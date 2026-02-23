import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_BASE_URL || 'http://localhost:6400'
  // Proxy base path without trailing slash (e.g. '/notebook/ns/name/proxy/5173'), or ''
  const proxyBase = (process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '').replace(/\/$/, '')
  // When behind Kubeflow proxy, derive the backend proxy base so WebSocket can
  // bypass the Vite dev server and connect directly to the backend port.
  const backendPort = new URL(target).port || '6400'
  const backendProxyBase = proxyBase
    ? proxyBase.replace(/\/proxy\/\d+$/, `/proxy/${backendPort}`)
    : ''

  return {
    plugins: [
      vue(),
      // Re-add the proxy base path that Kubeflow strips from incoming requests
      proxyBase && {
        name: 'proxy-base-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && !req.url.startsWith(proxyBase)) {
              // Skip /api and /ws — let Vite's dev proxy handle them directly
              if (!req.url.startsWith('/api') && !req.url.startsWith('/ws')) {
                req.url = proxyBase + req.url
              }
            }
            next()
          })
        }
      },
    ].filter(Boolean),
    base: proxyBase ? proxyBase + '/' : '/',
    define: {
      __PROXY_BASE__: JSON.stringify(proxyBase),
      __BACKEND_PROXY_BASE__: JSON.stringify(backendProxyBase),
    },
    server: {
      host: true,
      allowedHosts: ['kubeflow.aistudio.aip.samsungds.net'],
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
        },
        '/ws': {
          target: target,
          ws: true,
          changeOrigin: true,
        }
      }
    }
  }
})
