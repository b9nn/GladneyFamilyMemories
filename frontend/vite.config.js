import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // REQUIRED for GitHub Pages
  base: '/GladneyFamilyMemories/',

  // Output the production build into /docs (so GitHub Pages can serve it)
  build: {
    outDir: '../docs',
    emptyOutDir: true
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
