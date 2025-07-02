import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', // tells Vite to use src/ as the app root
  publicDir: '../public', // location of static assets (if you add any later)
  build: {
	outDir: '../dist', // where the production build will be output
	emptyOutDir: true
  },
  server: {
	open: '/index.html' // auto-opens the main page on npm run dev
  }
});