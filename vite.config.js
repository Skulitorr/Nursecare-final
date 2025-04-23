import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  },
  plugins: [react()],
  server: {
    port: process.env.FRONTEND_PORT || 5000,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || 3000}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(
          ['patients', 'staff', 'inventory', 'schedule', 'chatbot']
            .map(page => [page, resolve(__dirname, `${page}.html`)])
        )
      }
    }
  }
})