import { emptyListOnNoSubscriptions, qs, request } from './api.js'

// One function per existing backend endpoint. URLs, verbs and payloads match
// what the dashboard already sent before the redesign.

export const authApi = {
  login: (email, password) => request('/reseller/login', { method: 'POST', auth: false, body: { email, password } }),
  info: (opts) => request('/reseller/info', opts),
}

export const customersApi = {
  list: (page, opts) => request(`/reseller/getSubscriptions${qs({ page })}`, opts).then(emptyListOnNoSubscriptions),
  searchByMac: (macAddress, opts) =>
    request(`/reseller/searchByMac${qs({ macAddress, type: 'reseller' })}`, opts).then(emptyListOnNoSubscriptions),
  // credit is the package label the backend expects: "1 year" or "Life Time".
  activate: (macAddress, credit) => request('/reseller/newSubscription', { method: 'POST', body: { macAddress, credit } }),
  changeHost: (oldHost, newHost) => request('/reseller/changeHost', { method: 'POST', body: { oldHost, newHost } }),
}

export const providerApi = {
  list: (page, opts) => request(`/reseller/getByCode${qs({ page })}`, opts).then(emptyListOnNoSubscriptions),
  searchByMac: (macAddress, opts) =>
    request(`/reseller/searchByMac${qs({ macAddress, type: 'provider' })}`, opts).then(emptyListOnNoSubscriptions),
  generateCode: (playlist) => request('/reseller/generateCode', { method: 'POST', body: { playlist } }),
}

// Read-only totals for the signed-in account (dashboard-only endpoint; scoped by the token server-side).
export const statsApi = {
  mine: (opts) => request('/reseller/stats', opts),
}

// Credit history of the signed-in reseller (scoped by the token server-side).
export const creditsApi = {
  mine: (page, opts) => request(`/reseller/creditTransactions${qs({ page })}`, opts),
}

// Distributor manager role. The API refuses these for every other account.
export const distributorApi = {
  info: (opts) => request('/distributor/info', opts),
  resellers: (opts) => request('/distributor/resellers', opts),
  transactions: (page, resellerId, opts) => request(`/distributor/transactions${qs({ page, resellerId })}`, opts),
  // idempotencyKey makes a retried or double-clicked submission safe: the API applies it once.
  recharge: (resellerId, amount, idempotencyKey, note) =>
    request('/distributor/recharge', { method: 'POST', body: { resellerId, amount, idempotencyKey, note: note || undefined } }),
  // Always creates a regular main reseller; starting credits are added as an audited recharge.
  createReseller: ({ userName, email, password, initialCredits, idempotencyKey }) =>
    request('/distributor/createReseller', { method: 'POST', body: { userName, email, password, initialCredits, idempotencyKey } }),
}

export const subResellersApi = {
  list: (opts) => request('/reseller/getSubReseller', opts),
  create: (body) => request('/reseller/addSubReseller', { method: 'POST', body }),
}
