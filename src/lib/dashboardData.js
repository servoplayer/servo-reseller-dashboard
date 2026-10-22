import { useCallback, useMemo, useState } from 'react'
import { useResource } from './resource'
import { authApi, customersApi, subResellersApi } from './services'
import { daysUntil, EXPIRING_SOON_DAYS, isLifetime } from './format'

// Shared read models. Keys are prefixes used by `invalidate()` after mutations.
export const useInfo = () => useResource('info', authApi.info)
export const useCustomersFirstPage = () => useResource('customers:1', () => customersApi.list(1))
const SKIPPED = () => Promise.resolve({ ok: true, status: 200, data: null, message: '' })
// Pass enabled=false to skip the request (sub-resellers cannot have sub-resellers).
export const useSubResellers = (enabled = true) =>
  useResource(enabled ? 'subresellers' : 'skip:subresellers', enabled ? subResellersApi.list : SKIPPED)

export const creditsOf = (infoData) => infoData?.info?.subscriptionsNum

/** Packages offered when activating a customer, with the credits each one uses. */
export const PACKAGES = [
  { value: '1 year', label: '1 year', credits: 1 },
  { value: 'Life Time', label: 'Lifetime', credits: 2 },
]

/** Active, time-limited subscriptions that are expired or expire within the warning window. */
export function splitByExpiry(subs = []) {
  const expiring = []
  const expired = []
  subs.forEach((s) => {
    if (!s?.isActive || isLifetime(s.subscriptionEndDate)) return
    const days = daysUntil(s.subscriptionEndDate)
    if (days === null) return
    if (days < 0) expired.push(s)
    else if (days <= EXPIRING_SOON_DAYS) expiring.push(s)
  })
  const byDate = (a, b) => new Date(a.subscriptionEndDate) - new Date(b.subscriptionEndDate)
  return { expiring: expiring.sort(byDate), expired: expired.sort(byDate) }
}

const READ_KEY = 'servo-alerts-read'

function readMarks() {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY)) || {}
  } catch {
    return {}
  }
}

/**
 * Operational alerts derived from live API data. The backend has no
 * notification service, so alerts are computed on the client; read state is
 * remembered per browser and resets when an alert's content changes.
 */
export function useAlerts() {
  const info = useInfo()
  const customers = useCustomersFirstPage()
  const [marks, setMarks] = useState(readMarks)

  const alerts = useMemo(() => {
    const list = []
    const credits = creditsOf(info.data)
    if (credits !== undefined && credits !== null) {
      const n = Number(credits)
      if (n <= 0) {
        list.push({
          id: 'credits',
          signature: String(n),
          tone: 'danger',
          title: 'No credits left',
          body: "You can't activate new customers until your account administrator adds credits.",
          to: '/layout',
          cta: 'View balance',
        })
      } else if (n < 2) {
        list.push({
          id: 'credits',
          signature: String(n),
          tone: 'warning',
          title: `Low balance: ${n} credit left`,
          body: 'Enough for a 1-year activation only. Lifetime activations use 2 credits.',
          to: '/layout',
          cta: 'View balance',
        })
      }
    }
    const { expiring, expired } = splitByExpiry(customers.data?.subscriptions)
    if (expired.length) {
      list.push({
        id: 'expired',
        signature: expired.map((s) => s._id).join(','),
        tone: 'danger',
        title: `${expired.length} subscription${expired.length > 1 ? 's' : ''} past the end date`,
        body: 'Found on the first page of your customers.',
        to: '/layout#attention',
        cta: 'Review',
      })
    }
    if (expiring.length) {
      list.push({
        id: 'expiring',
        signature: expiring.map((s) => s._id).join(','),
        tone: 'warning',
        title: `${expiring.length} customer${expiring.length > 1 ? 's' : ''} expiring within ${EXPIRING_SOON_DAYS} days`,
        body: 'Found on the first page of your customers.',
        to: '/layout#attention',
        cta: 'Review',
      })
    }
    return list.map((a) => ({ ...a, read: marks[a.id] === a.signature }))
  }, [info.data, customers.data, marks])

  const persist = (next) => {
    setMarks(next)
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(next))
    } catch {
      // Read state is a convenience; ignore storage failures.
    }
  }

  const markRead = useCallback((alert) => persist({ ...readMarks(), [alert.id]: alert.signature }), [])
  const markAllRead = useCallback(
    () => persist(alerts.reduce((acc, a) => ({ ...acc, [a.id]: a.signature }), readMarks())),
    [alerts],
  )

  return {
    alerts,
    unread: alerts.filter((a) => !a.read).length,
    loading: info.loading || customers.loading,
    markRead,
    markAllRead,
  }
}

