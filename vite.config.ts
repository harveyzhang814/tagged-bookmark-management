import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

const enableSourceMap = process.env.ENABLE_SOURCEMAP === 'true';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    port: 5177,
    strictPort: true,
    cors: true
  },
  build: {
    sourcemap: enableSourceMap,
    rollupOptions: {
      input: {
        popup: 'src/pages/popup/main.html',
        options: 'src/pages/options/main.html'
      }
    }
  }
});


