// Run with `npm test`. The stats call must not send any account id: the server scopes it by the token.
import { afterEach, beforeEach, it } from 'node:test'
import assert from 'node:assert/strict'
import { statsApi } from '../src/lib/services.js'
import { niceTicks } from '../src/lib/chartScale.js'

let calls
beforeEach(() => {
  calls = []
  globalThis.localStorage = { getItem: () => 'tok', setItem() {}, removeItem() {} }
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return { ok: true, status: 200, json: async () => ({ subscriptions: { total: 0, monthly: [] } }) }
  }
})

afterEach(() => {
  delete globalThis.fetch
  delete globalThis.localStorage
})

it('requests GET /reseller/stats with the reseller token and no query or body', async () => {
  const res = await statsApi.mine()
  assert.equal(res.ok, true)
  assert.equal(calls.length, 1)
  assert.ok(calls[0].url.endsWith('/reseller/stats'))
  assert.equal(calls[0].init.method, 'GET')
  assert.equal(calls[0].init.body, undefined)
  assert.equal(calls[0].init.headers.authorization, 'servoM0tok')
})

it('chart ticks start at zero and cover the maximum', () => {
  assert.deepEqual(niceTicks(15), [0, 5, 10, 15])
})
