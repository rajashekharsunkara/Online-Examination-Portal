import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        // Don't rewrite - backend expects /api/v1/* paths
      },
      '/ws': {
        target: 'ws://api:8000',
        ws: true,
      },
    },
  },
})
