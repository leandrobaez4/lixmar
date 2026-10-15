import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { clearPublicSession, getPublicSession, verifyPublicSession } from '../src/auth/publicSession.js'

const originalFetch = globalThis.fetch
const originalWindow = globalThis.window

beforeEach(() => {
  globalThis.window = {
    dispatchEvent() {},
    localStorage: { removeItem() {} },
  }
})

afterEach(() => {
  clearPublicSession()
  globalThis.fetch = originalFetch
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
})

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const validProfile = { id: 12, email: 'buyer@example.com', name: 'Buyer', verified: true }

test('accepts the verified profile contract without retaining a bearer token', async () => {
  globalThis.fetch = async () => response({
    success: true,
    data: { ...validProfile, token: 'only-in-response' },
    expires_in: 3600,
  })

  assert.equal(await verifyPublicSession(), true)
  assert.deepEqual(getPublicSession(), validProfile)
})

test('rejects a malformed successful response and clears an older profile', async () => {
  globalThis.fetch = async () => response({ success: true, data: validProfile, expires_in: 3600 })
  assert.equal(await verifyPublicSession(), true)

  globalThis.fetch = async () => response({ success: true, data: { verified: true }, expires_in: 3600 })
  assert.equal(await verifyPublicSession(), false)
  assert.equal(getPublicSession(), null)
})

test('rejects a profile whose cookie expiry is missing or elapsed', async () => {
  globalThis.fetch = async () => response({ success: true, data: validProfile, expires_in: 0 })
  assert.equal(await verifyPublicSession(), false)
  assert.equal(getPublicSession(), null)
})

test('rejects an unverified user and an unauthorized session', async () => {
  globalThis.fetch = async () => response({ success: true, data: { ...validProfile, verified: false }, expires_in: 3600 })
  assert.equal(await verifyPublicSession(), false)

  globalThis.fetch = async () => response({ message: 'Unauthenticated.' }, 401)
  assert.equal(await verifyPublicSession(), false)
  assert.equal(getPublicSession(), null)
})

test('concurrent session checks share one request', async () => {
  let resolveFetch
  let fetchCount = 0
  globalThis.fetch = () => {
    fetchCount += 1
    return new Promise((resolve) => { resolveFetch = resolve })
  }

  const first = verifyPublicSession()
  const second = verifyPublicSession()
  resolveFetch(response({ success: true, data: validProfile, expires_in: 3600 }))

  assert.equal(await first, true)
  assert.equal(await second, true)
  assert.equal(fetchCount, 1)
})

test('clearing the session prevents an older verification response from restoring it', async () => {
  let resolveFetch
  globalThis.fetch = () => new Promise((resolve) => { resolveFetch = resolve })

  const pending = verifyPublicSession()
  clearPublicSession()
  resolveFetch(response({ success: true, data: validProfile, expires_in: 3600 }))

  assert.equal(await pending, false)
  assert.equal(getPublicSession(), null)
})
