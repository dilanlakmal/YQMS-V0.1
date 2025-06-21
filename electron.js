// const { app, BrowserWindow, ipcMain } = require("electron");
// const escpos = require("escpos-xml");
// const { Bluetooth } = require("escpos-bluetooth");
// const path = require("path");

// let mainWindow;
// let printer;

// async function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//   });

//   if (process.env.NODE_ENV === "development") {
//     await mainWindow.loadURL("http://localhost:5173");
//   } else {
//     mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
//   }
// }

// // Add this function in electron.js
// function setStatus(message) {
//   mainWindow.webContents.send("bluetooth-status", message);
// }

// // Printer handling
// ipcMain.handle("connect-printer", async () => {
//   try {
//     const bluetooth = new Bluetooth();

//     // 1. First check paired devices
//     const pairedDevices = await bluetooth.listPairedDevices();
//     const gainschaPrinter = pairedDevices.find(
//       (device) => device.name?.startsWith("GP-") // Add null check
//     );

//     if (gainschaPrinter) {
//       printer = gainschaPrinter.printer;
//       return {
//         success: true,
//         printerName: gainschaPrinter.name,
//         vendorId: gainschaPrinter.vendorId,
//       };
//     }

//     // 2. If not found, start discovery
//     setStatus("Discovering nearby devices...");
//     const devices = await bluetooth.discoverDevices();
//     const foundPrinter = devices.find(
//       (device) => device.name?.startsWith("GP-") // Add null check
//     );

//     if (!foundPrinter) {
//       throw new Error("No Gainscha printers found nearby");
//     }

//     // 3. Pair and connect
//     setStatus("Pairing device...");
//     await bluetooth.pairDevice(foundPrinter.address);

//     setStatus("Connecting...");
//     printer = await bluetooth.connect(foundPrinter.address);

//     return {
//       success: true,
//       printerName: foundPrinter.name,
//       vendorId: foundPrinter.vendorId,
//     };
//   } catch (error) {
//     console.error("Bluetooth connection error:", error);
//     return {
//       success: false,
//       error: error.message,
//       stack: error.stack,
//     };
//   }
// });

// ipcMain.handle("print-data", async (_, data) => {
//   try {
//     const xmlTemplate = `
//       <document>
//         <align mode="center">
//           <text>Factory: ${data.factory}</text>
//           <text>MO: ${data.selectedMono}</text>
//           <text>Buyer: ${data.buyer}</text>
//           <text>Line: ${data.lineNo}</text>
//           <text>Color: ${data.color}</text>
//           <text>Size: ${data.size}</text>
//         </align>
//         <qrcode size="8" error="M">${data.bundle_id}</qrcode>
//         <cut/>
//       </document>
//     `;

//     const buffer = escpos.xmlToEscPos(xmlTemplate, {
//       encoding: "GB18030",
//       pageSize: "58mm",
//     });

//     await printer.write(buffer);
//     return { success: true };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// });

// ipcMain.handle("disconnect-printer", () => {
//   if (printer) {
//     printer.close();
//     printer = null;
//   }
//   return true;
// });

// app.whenReady().then(createWindow);

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") app.quit();
// });


// In your preload script (e.g., electron/preload.js)
const { contextBridge, ipcRenderer } = require("electron");

// Expose a safe, limited API to the renderer process (your React app)
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      // Whitelist channels to prevent security risks.
      // Only allow sending on the 'log-to-main' channel.
      const validChannels = ["log-to-main"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    }
    // You can also expose ipcRenderer.on here if you need two-way communication
  }
});
