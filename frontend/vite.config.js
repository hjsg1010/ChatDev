import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_BASE_URL || 'http://localhost:6400'
  // Proxy base path without trailing slash (e.g. '/notebook/ns/name/proxy/5173'), or ''
  const proxyBase = (process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '').replace(/\/$/, '')

  return {
    plugins: [vue()],
    base: './',
    define: {
      __PROXY_BASE__: JSON.stringify(proxyBase),
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
