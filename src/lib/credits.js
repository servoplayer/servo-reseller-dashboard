// Client-side mirror of the API's recharge rules (src/services/credits.js in the
// backend), used only to give early feedback. The API validates everything again.
export const MAX_RECHARGE = 10000

/** Error message for an amount field value, or '' when it is valid. */
export function rechargeAmountError(value) {
  if (value === '' || value === null || value === undefined) return 'Enter the number of credits to add.'
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return 'Use a whole number of 1 or more.'
  if (n > MAX_RECHARGE) return `You can add at most ${MAX_RECHARGE.toLocaleString()} credits at a time.`
  return ''
}

/**
 * One key per recharge attempt. Retrying with the same key (after a timeout or
 * a double click) is answered with the original result instead of crediting twice.
 */
export function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** "+5" for a recharge, "−3" for a deduction. */
export const signedAmount = (tx) => `${tx.type === 'deduction' ? '−' : '+'}${Number(tx.amount).toLocaleString()}`

export const actorLabel = (role) => (role === 'Admin' ? 'Administrator' : role === 'distributorManager' ? 'Distributor manager' : '—')
