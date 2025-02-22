import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true
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
