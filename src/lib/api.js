export const API_BASE = 'https://servo-back.onrender.com'

const TOKEN_KEY = 'authToken'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** Same behaviour as before: drop the token and role flag, return to login. */
export function logOut() {
  clearToken()
  localStorage.removeItem('authorization')
  window.location.assign('/')
}

/**
 * Thin wrapper around fetch that keeps the backend contract unchanged
 * (same URLs, verbs, bodies and `servoM0<token>` authorization header).
 *
 * Never throws: resolves to { ok, status, data, message } so callers can
 * decide how to surface failures. `message` is the backend's own message when
 * one is provided, otherwise a readable fallback.
 */
export async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers.authorization = `servoM0${getToken()}`

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') return { ok: false, aborted: true, status: 0, data: null, message: '' }
    return {
      ok: false,
      status: 0,
      data: null,
      message: 'Could not reach the Servo server. Check your connection and try again.',
    }
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  const message =
    data?.message ||
    (response.ok ? '' : `Request failed (${response.status}). Please try again.`)

  return { ok: response.ok, status: response.status, data, message }
}

/** Builds a query string, skipping empty values. */
export const qs = (params) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const str = search.toString()
  return str ? `?${str}` : ''
}

// The subscription-list endpoints answer `404 { message: "No subscriptions found yet" }`
// when the collection is simply empty. Only that exact reply is a valid empty
// state; any other 404 (unknown route, missing record, different message) is
// still a real error.
const NO_SUBSCRIPTIONS = /no subscriptions? (were )?found/i

export const isNoSubscriptionsResponse = (res) =>
  !res.ok && res.status === 404 && NO_SUBSCRIPTIONS.test(res.data?.message ?? '')

/**
 * For subscription-list requests only: normalizes the "no subscriptions"
 * 404 into the same shape as a successful page with zero records, so callers
 * render their empty state instead of an error. Everything else passes through.
 */
export function emptyListOnNoSubscriptions(res, listKey = 'subscriptions') {
  if (!isNoSubscriptionsResponse(res)) return res
  return {
    ok: true,
    empty: true,
    status: res.status,
    message: res.data.message,
    data: { [listKey]: [], page: 1, totalPages: 0 },
  }
}
