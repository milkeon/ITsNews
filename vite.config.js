import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/proxy/yozm': {
        target: 'https://yozm.wishket.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/yozm/, '')
      },
      '/proxy/geek': {
        target: 'https://news.hada.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/geek/, '')
      },
      '/proxy/itworld': {
        target: 'https://www.itworld.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/itworld/, '')
      }
    }
  }
})
