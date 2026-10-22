// Run with `npm test` (Node's built-in test runner, no extra dependencies).
import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { customersApi, providerApi, subResellersApi } from '../src/lib/services.js'

let calls
let nextResponse

const jsonResponse = (status, body) => ({ status, body })

beforeEach(() => {
  calls = []
  globalThis.localStorage = { getItem: () => 'tok', setItem() {}, removeItem() {} }
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return {
      ok: nextResponse.status >= 200 && nextResponse.status < 300,
      status: nextResponse.status,
      json: async () => {
        if (nextResponse.body === undefined) throw new SyntaxError('Unexpected token <')
        return nextResponse.body
      },
    }
  }
})

afterEach(() => {
  delete globalThis.fetch
  delete globalThis.localStorage
})

const NO_SUBS = jsonResponse(404, { message: 'No subscriptions found yet' })

describe('reseller: subscription lists treat "no subscriptions" 404 as empty', () => {
  for (const [name, call] of [
    ['GET /reseller/getSubscriptions', () => customersApi.list(1)],
    ['GET /reseller/searchByMac (reseller)', () => customersApi.searchByMac('aa')],
    ['GET /reseller/getByCode', () => providerApi.list(1)],
    ['GET /reseller/searchByMac (provider)', () => providerApi.searchByMac('aa')],
  ]) {
    it(`${name}: 404 "No subscriptions found yet" -> empty page`, async () => {
      nextResponse = NO_SUBS
      const res = await call()
      assert.equal(res.ok, true)
      assert.equal(res.empty, true)
      assert.deepEqual(res.data, { subscriptions: [], page: 1, totalPages: 0 })
    })
  }

  it('200 with an empty array is unchanged (same empty state)', async () => {
    nextResponse = jsonResponse(200, { subscriptions: [], page: 1, totalPages: 0 })
    const res = await customersApi.list(1)
    assert.equal(res.ok, true)
    assert.equal(res.empty, undefined)
    assert.deepEqual(res.data.subscriptions, [])
  })

  it('200 with subscriptions is passed through untouched', async () => {
    const subscriptions = [{ _id: 's1', isActive: true, subscriptionEndDate: '3025-04-25' }]
    nextResponse = jsonResponse(200, { subscriptions, page: 1, totalPages: 2 })
    const res = await customersApi.list(1)
    assert.equal(res.ok, true)
    assert.deepEqual(res.data.subscriptions, subscriptions)
    assert.equal(res.data.totalPages, 2)
  })

  it('keeps the request contract (URL and auth header)', async () => {
    nextResponse = NO_SUBS
    await customersApi.searchByMac('b8:27')
    assert.match(calls[0].url, /\/reseller\/searchByMac\?macAddress=b8%3A27&type=reseller$/)
    assert.equal(calls[0].init.headers.authorization, 'servoM0tok')
  })
})

describe('reseller: genuine errors are preserved', () => {
  it('404 with a different message on a list endpoint stays an error', async () => {
    nextResponse = jsonResponse(404, { message: 'Reseller not found' })
    const res = await customersApi.list(1)
    assert.equal(res.ok, false)
    assert.equal(res.message, 'Reseller not found')
  })

  it('404 without a JSON body (unknown route) stays an error', async () => {
    nextResponse = jsonResponse(404, undefined)
    const res = await customersApi.list(1)
    assert.equal(res.ok, false)
    assert.equal(res.status, 404)
  })

  it('404 on a non-list request is never normalized', async () => {
    nextResponse = jsonResponse(404, { message: 'No subscriptions found yet' })
    const res = await customersApi.activate('aa:bb', '1 year')
    assert.equal(res.ok, false)
    assert.equal(res.status, 404)
  })

  it('404 on the sub-reseller list (not a subscription list) stays an error', async () => {
    nextResponse = jsonResponse(404, { message: 'No subscriptions found yet' })
    const res = await subResellersApi.list()
    assert.equal(res.ok, false)
  })

  for (const status of [401, 403, 500]) {
    it(`${status} stays an error with the backend message`, async () => {
      nextResponse = jsonResponse(status, { message: `failure ${status}` })
      const res = await customersApi.list(1)
      assert.equal(res.ok, false)
      assert.equal(res.status, status)
      assert.equal(res.message, `failure ${status}`)
    })
  }

  it('network failure stays an error', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    const res = await customersApi.list(1)
    assert.equal(res.ok, false)
    assert.equal(res.status, 0)
  })
})
