import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/flights/',
  plugins: [],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        arrivals: resolve(__dirname, 'arrivals/index.html'),
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
