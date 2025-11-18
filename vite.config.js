import react from "@vitejs/plugin-react";
import fs from "fs";
import { defineConfig } from "vite";
import path from 'path'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.ttf"],
  optimizeDeps: {
    include: ["jspdf", "jspdf-autotable"]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    open: true,
    https: {
      key: fs.readFileSync(
        "C:/Users/USER/Downloads/YQMS-V0.1-main/YQMS-V0.1-main/backend/Config/192.167.12.162-key.pem"
      ),
      cert: fs.readFileSync(
        "C:/Users/USER/Downloads/YQMS-V0.1-main/YQMS-V0.1-main/backend/Config/192.167.12.162.pem"
      )
    }
  },
  build: {
    //minify: false, // Use esbuild for minification
    sourcemap: true,
    chunkSizeWarningLimit: 20000,
    rollupOptions: {
      manualChunks: {
        "jspdf-autotable": ["jspdf-autotable"]
      }
    }
  }
});
