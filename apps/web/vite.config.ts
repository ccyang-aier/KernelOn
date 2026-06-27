import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@kernelon/core': fileURLToPath(new URL('../../packages/core/src', import.meta.url)),
      '@kernelon/ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
