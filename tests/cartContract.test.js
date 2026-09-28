import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { clearPublicCart, fetchPublicCart, getPublicCartCount, getPublicCartItems } from '../src/cart/publicCart.js'

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
  clearPublicCart()
})

function response(data) {
  return { ok: true, json: async () => ({ data }) }
}

test('rejects a malformed cart rather than showing it as empty', async () => {
  globalThis.fetch = async () => response({ items_count: 1, vendors: [{ items: null }], grand_total: 10, is_valid: true, currency: 'ARS' })
  await assert.rejects(fetchPublicCart(), /formato esperado/)
  assert.equal(getPublicCartCount(), 0)
})

test('shows an actionable message when the cart requires a session', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Unauthenticated.' }) })
  await assert.rejects(fetchPublicCart(), (error) => error.code === 'SESSION_REQUIRED' && /Iniciá sesión/.test(error.message))
})

test('server errors do not expose database details in the cart', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ message: 'SQLSTATE secret connection detail' }) })
  await assert.rejects(fetchPublicCart(), (error) => /Intentá de nuevo más tarde/.test(error.message) && !error.message.includes('SQLSTATE'))
})

test('accepts the cart envelope returned by the API', async () => {
  globalThis.fetch = async () => response({ items_count: 1, vendors: [{ items: [{ id: 1, quantity: 2 }] }], grand_total: 20, is_valid: true, currency: 'ARS' })
  await fetchPublicCart()
  assert.equal(getPublicCartCount(), 1)
  assert.equal(getPublicCartItems()[0].quantity, 2)
})

test('clearing the session prevents an older cart response from restoring it', async () => {
  let resolveFetch
  globalThis.fetch = () => new Promise((resolve) => { resolveFetch = resolve })
  const pending = fetchPublicCart()
  clearPublicCart()
  resolveFetch(response({ items_count: 1, vendors: [{ items: [{ id: 1, quantity: 1 }] }], grand_total: 10, is_valid: true, currency: 'ARS' }))
  assert.equal(await pending, null)
  assert.deepEqual(getPublicCartItems(), [])
})
