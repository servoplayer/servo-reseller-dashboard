// Run with `npm test`. Covers the client side of the distributor manager role.
import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isDistributorManager, isFullReseller, roleLabel, saveRole } from '../src/lib/role.js'
import { MAX_RECHARGE, newIdempotencyKey, rechargeAmountError, signedAmount } from '../src/lib/credits.js'
import { creditsApi, distributorApi } from '../src/lib/services.js'

let store
let calls
beforeEach(() => {
  store = { authToken: 'tok' }
  calls = []
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => (store[k] = String(v)),
    removeItem: (k) => delete store[k],
  }
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return { ok: true, status: 201, json: async () => ({ transaction: {} }) }
  }
})

afterEach(() => {
  delete globalThis.localStorage
  delete globalThis.fetch
})

describe('role flags', () => {
  it('a distributor manager is neither a full reseller nor a sub-reseller', () => {
    saveRole('distributorManager')
    assert.equal(isDistributorManager(), true)
    assert.equal(isFullReseller(), false)
    assert.equal(roleLabel(), 'Distributor manager')
  })

  it('existing roles are unchanged', () => {
    saveRole('Reseller')
    assert.equal(isFullReseller(), true)
    assert.equal(isDistributorManager(), false)
    saveRole('subReseller')
    assert.equal(isFullReseller(), false)
    assert.equal(isDistributorManager(), false)
    assert.equal(roleLabel(), 'Sub-reseller')
  })

  it('an unknown role stores nothing', () => {
    saveRole('Admin')
    assert.equal(store.authorization, undefined)
  })
})

describe('recharge input rules', () => {
  it('accepts whole numbers from 1 to the maximum', () => {
    assert.equal(rechargeAmountError('1'), '')
    assert.equal(rechargeAmountError(String(MAX_RECHARGE)), '')
  })

  it('rejects empty, zero, negative, fractional and too-large amounts', () => {
    for (const v of ['', '0', '-3', '1.5', String(MAX_RECHARGE + 1), 'abc']) assert.notEqual(rechargeAmountError(v), '', v)
  })

  it('idempotency keys are unique and accepted by the API format', () => {
    const a = newIdempotencyKey()
    const b = newIdempotencyKey()
    assert.notEqual(a, b)
    assert.match(a, /^[A-Za-z0-9_-]{8,100}$/)
  })

  it('formats signed changes', () => {
    assert.equal(signedAmount({ type: 'recharge', amount: 5 }), '+5')
    assert.equal(signedAmount({ type: 'deduction', amount: 2 }), '−2')
  })
})

describe('API calls', () => {
  it('recharge posts a number amount with the idempotency key and the token', async () => {
    await distributorApi.recharge('r1', 25, 'key-12345678', '')
    assert.ok(calls[0].url.endsWith('/distributor/recharge'))
    assert.equal(calls[0].init.method, 'POST')
    assert.deepEqual(JSON.parse(calls[0].init.body), { resellerId: 'r1', amount: 25, idempotencyKey: 'key-12345678' })
    assert.equal(calls[0].init.headers.authorization, 'servoM0tok')
  })

  it('a reseller\'s own history sends no account id', async () => {
    await creditsApi.mine(2)
    assert.ok(calls[0].url.endsWith('/reseller/creditTransactions?page=2'))
  })
})
