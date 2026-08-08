import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the repo from a sub-path; a leading slash would ask the
  // browser for /assets on the domain root and every chunk would 404.
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
  server: { host: '127.0.0.1', port: 5173 },
});
