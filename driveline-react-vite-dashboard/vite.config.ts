import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3020,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Direct to NGINX (HTTP/2)
        changeOrigin: true,
        rewrite: (path) => path, // Keep /api prefix
        ws: true, // WebSocket support
        // No CORS issues - proxy handles it
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor.react'
            if (id.includes('react-router-dom')) return 'vendor.router'
            return 'vendor'
          }
        }
      }
    }
  }
})