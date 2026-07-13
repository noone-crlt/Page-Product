import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://myapp-fmoh.onrender.com',
        changeOrigin: true,
      },
      '/paymentHub': {
        target: 'https://myapp-fmoh.onrender.com',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
