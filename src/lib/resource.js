import { useEffect, useRef, useState } from 'react'

// Short-lived, in-memory cache for read requests that several widgets share
// (overview cards, the alerts bell). Mutations call `invalidate(prefix)` so
// every widget showing that data refetches.
const TTL = 60 * 1000
const store = new Map()
const listeners = new Set()

function cachedRequest(key, fetcher) {
  const hit = store.get(key)
  if (hit && Date.now() - hit.time < TTL) return hit.promise
  const promise = fetcher().then((res) => {
    if (!res.ok) store.delete(key)
    return res
  })
  store.set(key, { promise, time: Date.now() })
  return promise
}

export function invalidate(...prefixes) {
  for (const key of [...store.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) store.delete(key)
  }
  listeners.forEach((fn) => fn(prefixes))
}

export function useResource(key, fetcher) {
  const [state, setState] = useState({ loading: true, data: null, error: '', status: 0 })
  const [version, setVersion] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: '' }))
    cachedRequest(key, () => fetcherRef.current()).then((res) => {
      if (!alive) return
      setState({
        loading: false,
        data: res.ok ? res.data : null,
        error: res.ok ? '' : res.message,
        status: res.status,
      })
    })
    return () => {
      alive = false
    }
  }, [key, version])

  useEffect(() => {
    const onInvalidate = (prefixes) => {
      if (prefixes.some((p) => key.startsWith(p))) setVersion((v) => v + 1)
    }
    listeners.add(onInvalidate)
    return () => listeners.delete(onInvalidate)
  }, [key])

  return { ...state, reload: () => invalidate(key) }
}
