import assert from 'node:assert/strict'
import test from 'node:test'
import viteConfig, { resolveApiProxyTarget } from '../vite.config.js'

test('proxies the storefront API to the documented Laravel port by default', () => {
  assert.equal(resolveApiProxyTarget({}), 'http://127.0.0.1:8001')
  assert.equal(viteConfig.server.proxy['/api'].target, resolveApiProxyTarget())
})

test('allows local environments to override the Laravel proxy target', () => {
  assert.equal(
    resolveApiProxyTarget({ LIXMAR_API_PROXY_TARGET: 'http://127.0.0.1:9000' }),
    'http://127.0.0.1:9000',
  )
})
