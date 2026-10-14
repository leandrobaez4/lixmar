import assert from 'node:assert/strict'
import { test } from 'node:test'
import viteConfig from '../vite.config.js'

test('development API requests are proxied to the documented Laravel server', () => {
  assert.equal(viteConfig.server.proxy['/api'].target, 'http://127.0.0.1:8001')
  assert.equal(viteConfig.server.proxy['/api'].changeOrigin, true)
})
