import { defineConfig } from 'vite';

export default defineConfig({
  base: '/flights/',
  plugins: [],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  esbuild: {
    jsx: 'automatic',
  },
});
