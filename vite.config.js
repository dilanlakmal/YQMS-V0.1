import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.ttf"],
  optimizeDeps: {
    include: ["jspdf", "jspdf-autotable"]
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    open: true,
    // https: {
    //   key: fs.readFileSync(
    //     "C:/Users/USER/Downloads/YQMS-V0.1-main/YQMS-V0.1-main/backend/Config/192.167.12.162-key.pem"
    //   ),
    //   cert: fs.readFileSync(
    //     "C:/Users/USER/Downloads/YQMS-V0.1-main/YQMS-V0.1-main/backend/Config/192.167.12.162.pem"
    //   )
    // }
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
