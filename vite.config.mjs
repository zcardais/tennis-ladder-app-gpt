import { defineConfig } from 'vite';

export default defineConfig({
  // Use default project root
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    open: '/dashboard.html' // or index.html if preferred
  },
  resolve: {
    alias: {
      firebase: '/node_modules/firebase'
    }
  }
});