const DAY = 24 * 60 * 60 * 1000

/** Parses a backend date value; returns null when it is missing or unparseable. */
export function parseDate(value) {
  if (value === undefined || value === null || value === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Formats a date; falls back to the raw value if the backend sent a non-date string. */
export function formatDate(value, { withTime = false } = {}) {
  const date = parseDate(value)
  if (!date) return value ? String(value) : '—'
  return (withTime ? dateTimeFmt : dateFmt).format(date)
}

/** Whole days from now until the given date (negative when in the past). */
export function daysUntil(value) {
  const date = parseDate(value)
  if (!date) return null
  return Math.ceil((date.getTime() - Date.now()) / DAY)
}

export function relativeDays(value) {
  const days = daysUntil(value)
  if (days === null) return ''
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
}

/** Formats an amount; the backend stores plain numbers without a currency code. */
export function formatAmount(value) {
  if (value === undefined || value === null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export const formatNumber = (value) =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString()

/** MAC addresses are compared without separators and case. */
export const normalizeMac = (value = '') => value.replace(/[^a-fA-F0-9]/g, '').toLowerCase()

/** Device types are stored with inconsistent casing (e.g. "lg", "LG"). */
export function formatDeviceType(type) {
  if (!type) return '—'
  const lower = String(type).toLowerCase()
  if (lower === 'lg') return 'LG'
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export const EXPIRING_SOON_DAYS = 30

/** Subscription status derived from the end date. */
export function subscriptionStatus(endDate) {
  const days = daysUntil(endDate)
  if (days === null) return { tone: 'neutral', label: 'Unknown' }
  if (days < 0) return { tone: 'danger', label: 'Expired' }
  if (days <= EXPIRING_SOON_DAYS) return { tone: 'warning', label: 'Expiring soon' }
  return { tone: 'success', label: 'Active' }
}

// Lifetime activations are stored with a far-future end date ("3025-04-25").
export function isLifetime(endDate) {
  if (endDate === '3025-04-25') return true
  const date = parseDate(endDate)
  return Boolean(date && date.getFullYear() >= 3000)
}

export const packageLabel = (endDate) => (isLifetime(endDate) ? 'Lifetime' : '1 year')

/** Status of a reseller customer: backend `isActive` plus expiry from the end date. */
export function customerStatus(item) {
  if (!item?.isActive) return { tone: 'neutral', label: 'Not active' }
  if (isLifetime(item.subscriptionEndDate)) return { tone: 'success', label: 'Active' }
  return subscriptionStatus(item.subscriptionEndDate)
}

/** Same formatting as before: keep letters/digits only, group in pairs with ":". */
export const formatMacInput = (value = '') =>
  value.replace(/[^a-zA-Z0-9]/g, '').match(/.{1,2}/g)?.join(':') || ''
