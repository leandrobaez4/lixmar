import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export function resolveApiProxyTarget(env = process.env) {
  return env.LIXMAR_API_PROXY_TARGET || 'http://127.0.0.1:8001'
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: resolveApiProxyTarget(),
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
