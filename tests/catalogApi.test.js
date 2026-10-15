import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { fetchProduct, fetchProducts } from '../src/catalog/catalogApi.js'
import { accountRequest } from '../src/account/accountApi.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

test('catalog search uses filters and accepts the product contract returned by the API', async () => {
  let requestedUrl
  globalThis.fetch = async (url) => {
    requestedUrl = url
    return jsonResponse({ data: [{ id: 31, title: 'Teléfono', price: '150.00', currency: 'ARS' }], total: 1, last_page: 1 })
  }
  const payload = await fetchProducts({ category_id: 7, page: 2 })
  assert.equal(payload.data[0].id, 31)
  assert.match(requestedUrl, /category_id=7/)
  assert.match(requestedUrl, /page=2/)
})

test('malformed catalog responses fail at the API boundary', async () => {
  globalThis.fetch = async () => jsonResponse({ data: [{ id: 31, title: 'Teléfono', currency: 'ARS' }], total: 1, last_page: 1 })
  await assert.rejects(fetchProducts({ page: 1 }), /formato esperado/)
})

test('missing product returns an actionable 404 instead of fictitious data', async () => {
  globalThis.fetch = async () => jsonResponse({}, 404)
  await assert.rejects(fetchProduct(999), /Producto no disponible/)
})

test('catalog server errors do not expose database details', async () => {
  globalThis.fetch = async () => jsonResponse({ message: 'SQLSTATE[42703]: internal query' }, 500)
  await assert.rejects(fetchProducts(), (error) => error.status === 500
    && /catálogo no está disponible/.test(error.message)
    && !/SQLSTATE/.test(error.message))
})

test('expired account session is surfaced before rendering orders', async () => {
  globalThis.fetch = async () => jsonResponse({}, 401)
  await assert.rejects(accountRequest('/orders'), (error) => error.status === 401 && /sesión venció/.test(error.message))
})

test('concurrent account reads share one request without letting an aborted consumer cancel it', async () => {
  let resolveFetch
  let fetchCount = 0
  globalThis.fetch = () => {
    fetchCount += 1
    return new Promise((resolve) => { resolveFetch = resolve })
  }

  const controller = new AbortController()
  const abandoned = accountRequest('/catalog/products/mine?page=1', { signal: controller.signal })
  const active = accountRequest('/catalog/products/mine?page=1')
  controller.abort()
  resolveFetch(jsonResponse({ data: [] }))

  await assert.rejects(abandoned, (error) => error.name === 'AbortError')
  assert.deepEqual(await active, { data: [] })
  assert.equal(fetchCount, 1)
})
