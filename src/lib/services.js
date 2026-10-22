import { qs, request } from './api'

// One function per existing backend endpoint. URLs, verbs and payloads match
// what the dashboard already sent before the redesign.

export const authApi = {
  login: (email, password) => request('/reseller/login', { method: 'POST', auth: false, body: { email, password } }),
  info: (opts) => request('/reseller/info', opts),
}

export const customersApi = {
  list: (page, opts) => request(`/reseller/getSubscriptions${qs({ page })}`, opts),
  searchByMac: (macAddress, opts) => request(`/reseller/searchByMac${qs({ macAddress, type: 'reseller' })}`, opts),
  // credit is the package label the backend expects: "1 year" or "Life Time".
  activate: (macAddress, credit) => request('/reseller/newSubscription', { method: 'POST', body: { macAddress, credit } }),
  changeHost: (oldHost, newHost) => request('/reseller/changeHost', { method: 'POST', body: { oldHost, newHost } }),
}

export const providerApi = {
  list: (page, opts) => request(`/reseller/getByCode${qs({ page })}`, opts),
  searchByMac: (macAddress, opts) => request(`/reseller/searchByMac${qs({ macAddress, type: 'provider' })}`, opts),
  generateCode: (playlist) => request('/reseller/generateCode', { method: 'POST', body: { playlist } }),
}

export const subResellersApi = {
  list: (opts) => request('/reseller/getSubReseller', opts),
  create: (body) => request('/reseller/addSubReseller', { method: 'POST', body }),
}
