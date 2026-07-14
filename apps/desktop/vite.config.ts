import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { mineradioOverlayAssetsPlugin } from './src/mineradio-overlay-assets';

export default defineConfig({
  plugins: [react(), tailwindcss(), mineradioOverlayAssetsPlugin()],
  server: {
    host: '127.0.0.1',
    port: 3002,
    strictPort: true,
    watch: {
      // Rust builds update and lock files below `src-tauri/target`. Watching that
      // tree can terminate Vite with EBUSY on Windows while Cargo is running.
      ignored: ['**/src-tauri/**'],
    },
  },
});
