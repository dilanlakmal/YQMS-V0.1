import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    https: {
      key: fs.readFileSync(
        "/Users/dilanlakmal/Downloads/YQMS-Latest-main/localhost-key.pem"
      ),
      cert: fs.readFileSync(
        "/Users/dilanlakmal/Downloads/YQMS-Latest-main/localhost.pem"
      ),
    },
  },
});
