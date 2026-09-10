import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // The main chunk includes the markdown renderer + Shiki highlighter core,
    // which lands just under ~0.95 MB minified (~330 kB gzip) by design. The
    // Shiki *language* grammars are a curated set loaded lazily (each ≤180 kB),
    // so raise the default 500 kB threshold to avoid a false-positive warning.
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Proxy chat/SSE calls to the Spring AI backend (KHEZY ai-elements sample).
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // The browser sends an `Origin` header (e.g. http://localhost:5173).
        // After `changeOrigin` rewrites the Host to the backend, Spring treats
        // the request as cross-origin and applies the backend CORS allowlist
        // (which only lists :5173) -> 403 on other dev ports. Stripping the
        // Origin makes the proxied request same-origin, so the backend serves
        // it directly without CORS involvement.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
