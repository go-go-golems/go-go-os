import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@hypercard/engine': path.resolve(__dirname, '../../packages/engine/src'),
    },
  },
});
