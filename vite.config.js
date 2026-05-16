import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths for assets on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5500, // Matching original Live Server port for consistency
    open: true
  }
});
