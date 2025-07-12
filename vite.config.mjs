import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        ladders: path.resolve(__dirname, 'src/ladders.html'),
        editLadder: path.resolve(__dirname, 'src/edit-ladder.html')
      }
    }
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