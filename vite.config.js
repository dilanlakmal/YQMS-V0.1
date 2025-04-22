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
  server: {
    host: '0.0.0.0',
    port: 3001,
    open: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '192.167.8.236-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '192.167.8.236.pem'))
    }
  }
})

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import fs from "fs";
// import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3001,
//     open: true,
//     https: {
//       key: fs.readFileSync(
//         "/Users/dilanlakmal/Downloads/YQMS-Latest-main/localhost-key.pem"
//       ),
//       cert: fs.readFileSync(
//         "/Users/dilanlakmal/Downloads/YQMS-Latest-main/localhost.pem"
//       ),
//     },
//   },
// });
//     open: true,
//     https: {
//       key: fs.readFileSync(
//         "/Users/dilanlakmal/Downloads/YQMS-Latest-main/192.167.7.252+1-key.pem"
//       ),
//       cert: fs.readFileSync(
//         "/Users/dilanlakmal/Downloads/YQMS-Latest-main/192.167.7.252+1.pem"
//       ),
//     },
//   },
// });
