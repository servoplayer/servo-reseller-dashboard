import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useDebouncedValue from './useDebouncedValue'

/**
 * Paginated list + server-side MAC search, with `page`, `q` and `type` kept in
 * the URL so filters survive refresh, deep links and back/forward navigation.
 *
 * - No query: GET list endpoint for the current page (server pagination).
 * - Query: GET search endpoint (returns all matches, no pagination).
 * - Device type filter applies client-side to the loaded rows, as before;
 *   the backend has no type filter.
 */
export default function usePagedList({ list, search, pick, getType }) {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = params.get('q') ?? ''
  const types = (params.get('type') ?? '').split(',').filter(Boolean)
  const debouncedQuery = useDebouncedValue(query.trim(), 350)

  const [state, setState] = useState({ items: [], totalPages: 0, loading: true, error: '' })
  const [version, setVersion] = useState(0)
  const requestId = useRef(0)
  const fns = useRef({ list, search, pick })
  fns.current = { list, search, pick }

  useEffect(() => {
    const id = ++requestId.current
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: '' }))
    const run = debouncedQuery
      ? fns.current.search(debouncedQuery, { signal: controller.signal })
      : fns.current.list(page, { signal: controller.signal })
    run.then((res) => {
      if (id !== requestId.current || res.aborted) return
      if (!res.ok) {
        // A search with no matches may come back as 404; treat it as empty.
        if (debouncedQuery && res.status === 404) {
          setState({ items: [], totalPages: 0, loading: false, error: '' })
          return
        }
        setState((s) => ({ ...s, items: [], loading: false, error: res.message }))
        return
      }
      const { items, totalPages } = fns.current.pick(res.data)
      setState({ items: items ?? [], totalPages: debouncedQuery ? 0 : Number(totalPages) || 0, loading: false, error: '' })
    })
    return () => controller.abort()
  }, [page, debouncedQuery, version])

  const update = useCallback(
    (changes, { replace = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined || (k === 'page' && Number(v) === 1)) next.delete(k)
            else next.set(k, v)
          })
          return next
        },
        { replace },
      )
    },
    [setParams],
  )

  const setPage = (p) => {
    update({ page: p })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const setQuery = (q) => update({ q, page: null }, { replace: true })
  const toggleType = (t) => {
    if (t === null) return update({ type: null }, { replace: true })
    const next = types.includes(t) ? types.filter((x) => x !== t) : [...types, t]
    update({ type: next.join(',') }, { replace: true })
  }

  const filtered = types.length
    ? state.items.filter((item) => types.includes(String(getType(item) ?? '').toLowerCase()))
    : state.items

  return {
    ...state,
    items: filtered,
    loadedCount: state.items.length,
    page,
    query,
    types,
    searching: Boolean(debouncedQuery),
    pendingQuery: query.trim() !== debouncedQuery,
    setPage,
    setQuery,
    toggleType,
    reload: () => setVersion((v) => v + 1),
  }
}

