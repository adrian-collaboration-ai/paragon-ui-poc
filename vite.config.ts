/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false, // Disable source maps to avoid CSP issues
  },
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.useparagon.com https://cdnjs.cloudflare.com https://fonts.googleapis.com https://apis.google.com https://accounts.google.com http://localhost:8888; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com; img-src 'self' data: https:; frame-src 'self' https://connect.useparagon.com https://accounts.google.com https://docs.google.com;"
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
