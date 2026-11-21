import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The feed helper (server/) runs on 8787 in development.
      '/api': 'http://localhost:8787',
    },
  },
})
