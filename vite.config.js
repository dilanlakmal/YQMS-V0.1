import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.ttf"],
  optimizeDeps: {
    include: ["jspdf", "jspdf-autotable"]
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    open: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '192.167.12.85-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '192.167.12.85.pem'))
    }
  },
  build: {
    // minify: false, // Use esbuild for minification
    sourcemap: true,
    chunkSizeWarningLimit: 20000,
    rollupOptions: {
      manualChunks: {
        "jspdf-autotable": ["jspdf-autotable"]
      }
    }
  },
})

