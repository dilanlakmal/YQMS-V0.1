// import React, { useState, useEffect } from "react";
// import { Bluetooth } from "lucide-react";

// const BluetoothComponent = () => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [devices, setDevices] = useState([]);
//   const [showDeviceList, setShowDeviceList] = useState(false);

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         acceptAllDevices: true,
//         optionalServices: ["generic_access"],
//       });

//       const server = await device.gatt.connect();
//       setIsConnected(true);
//       setDevices((prev) => [...prev, device]);
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       setIsConnected(false);
//       setDevices([]);
//     } else {
//       scanForDevices();
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors ${
//           isConnected
//             ? "bg-blue-100 text-blue-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected" : "Connect Bluetooth Device"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//       </button>

//       {showDeviceList && devices.length > 0 && (
//         <div className="absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg p-2 z-50">
//           {devices.map((device, index) => (
//             <div key={index} className="p-2 text-sm text-gray-700">
//               {device.name || "Unknown Device"}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default BluetoothComponent;

// import React, { useState, useEffect } from "react";
// import { Bluetooth } from "lucide-react";

// const BluetoothComponent = () => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);

//   // Filter for TSC printer service UUID
//   const TSC_SERVICE_UUID = "49535343-FE7D-4AE5-8FA9-9FAFD205E455";

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         filters: [
//           { services: [TSC_SERVICE_UUID] },
//           { namePrefix: "TSC" }, // Filter for TSC printers
//         ],
//         optionalServices: ["battery_service"],
//       });

//       console.log("Device selected:", device.name);

//       const server = await device.gatt.connect();
//       const service = await server.getPrimaryService(TSC_SERVICE_UUID);

//       setSelectedDevice(device);
//       setIsConnected(true);

//       // Add event listener for disconnection
//       device.addEventListener("gattserverdisconnected", () => {
//         setIsConnected(false);
//         setSelectedDevice(null);
//       });
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       alert("Failed to connect to printer. Please try again.");
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       // Disconnect
//       if (selectedDevice?.gatt?.connected) {
//         selectedDevice.gatt.disconnect();
//       }
//       setIsConnected(false);
//       setSelectedDevice(null);
//     } else {
//       scanForDevices();
//     }
//   };

//   // Function to print data
//   const printData = async (data) => {
//     if (!selectedDevice || !isConnected) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       const server = await selectedDevice.gatt.connect();
//       const service = await server.getPrimaryService(TSC_SERVICE_UUID);
//       const characteristic = await service.getCharacteristic(
//         "49535343-8841-43F4-A8D4-ECBE34729BB3"
//       );

//       // TSC printer commands for label setup
//       const commands = [
//         "SIZE 45 mm, 70 mm\n", // Set label size (4.5cm x 7cm)
//         "GAP 3 mm, 0 mm\n", // Set gap between labels
//         "DIRECTION 1\n", // Print direction
//         "REFERENCE 0,0\n", // Set reference point
//         "OFFSET 0 mm\n", // Set offset
//         "SET TEAR ON\n", // Enable tear-off mode
//         "CLS\n", // Clear image buffer
//       ].join("");

//       await characteristic.writeValue(new TextEncoder().encode(commands));

//       // Send print data
//       const printCommands = generatePrintCommands(data);
//       await characteristic.writeValue(new TextEncoder().encode(printCommands));
//     } catch (error) {
//       console.error("Print error:", error);
//       throw error;
//     }
//   };

//   return {
//     isConnected,
//     isScanning,
//     selectedDevice,
//     printData,
//     connect: scanForDevices,
//     disconnect: handleClick,
//     render: (
//       <div className="relative">
//         <button
//           onClick={handleClick}
//           className={`p-2 rounded-full transition-colors ${
//             isConnected
//               ? "bg-blue-100 text-blue-600"
//               : "bg-gray-100 text-gray-400"
//           }`}
//           title={isConnected ? "Connected" : "Connect Bluetooth Device"}
//         >
//           <Bluetooth
//             className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`}
//           />
//         </button>

//         {showDeviceList && selectedDevice && (
//           <div className="absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg p-2 z-50">
//             <div className="p-2 text-sm text-gray-700">
//               {selectedDevice.name || "Unknown Device"}
//             </div>
//           </div>
//         )}
//       </div>
//     ),
//   };
// };

// // Helper function to generate TSC printer commands
// const generatePrintCommands = (data) => {
//   const commands = [];

//   // Set text and barcode positions according to margins
//   // 20mm top margin, 5mm bottom margin
//   commands.push(
//     `TEXT 10,20,"2",0,1,1,"${data.factory}"\n`,
//     `TEXT 10,35,"2",0,1,1,"MO: ${data.selectedMono}"\n`,
//     `TEXT 10,50,"2",0,1,1,"Buyer: ${data.buyer}"\n`,
//     `TEXT 10,65,"2",0,1,1,"Line: ${data.lineNo}"\n`,
//     `TEXT 10,80,"2",0,1,1,"Color: ${data.color}"\n`,
//     `TEXT 10,95,"2",0,1,1,"Size: ${data.size}"\n`,
//     `QRCODE 10,110,L,4,A,0,"${data.bundle_random_id}"\n`,
//     "PRINT 1\n"
//   );

//   return commands.join("");
// };

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);

//   // Filter for TSC printer service UUID
//   const TSC_SERVICE_UUID = "49535343-FE7D-4AE5-8FA9-9FAFD205E455";

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice || !isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         filters: [
//           { services: [TSC_SERVICE_UUID] },
//           { namePrefix: "TSC" }, // Filter for TSC printers
//         ],
//         optionalServices: ["battery_service"],
//       });

//       console.log("Device selected:", device.name);

//       const server = await device.gatt.connect();
//       const service = await server.getPrimaryService(TSC_SERVICE_UUID);

//       setSelectedDevice(device);
//       setIsConnected(true);

//       // Add event listener for disconnection
//       device.addEventListener("gattserverdisconnected", () => {
//         setIsConnected(false);
//         setSelectedDevice(null);
//       });
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       alert("Failed to connect to printer. Please try again.");
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       // Disconnect
//       if (selectedDevice?.gatt?.connected) {
//         selectedDevice.gatt.disconnect();
//       }
//       setIsConnected(false);
//       setSelectedDevice(null);
//     } else {
//       scanForDevices();
//     }
//   };

//   // Function to print data
//   const printData = async (data) => {
//     if (!selectedDevice || !isConnected) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       const server = await selectedDevice.gatt.connect();
//       const service = await server.getPrimaryService(TSC_SERVICE_UUID);
//       const characteristic = await service.getCharacteristic(
//         "49535343-8841-43F4-A8D4-ECBE34729BB3"
//       );

//       // TSC printer commands for label setup (4.5cm x 7cm with margins)
//       const commands = [
//         "SIZE 45 mm, 70 mm\n", // Set label size
//         "GAP 3 mm, 0 mm\n", // Set gap between labels
//         "DIRECTION 1\n", // Print direction
//         "REFERENCE 0,0\n", // Set reference point
//         "OFFSET 0 mm\n", // Set offset
//         "SET TEAR ON\n", // Enable tear-off mode
//         "CLS\n", // Clear image buffer
//         'TEXT 10,20,"2",0,1,1,"Factory: ' + data.factory + '"\n',
//         'TEXT 10,35,"2",0,1,1,"MO: ' + data.selectedMono + '"\n',
//         'TEXT 10,50,"2",0,1,1,"Buyer: ' + data.buyer + '"\n',
//         'TEXT 10,65,"2",0,1,1,"Line: ' + data.lineNo + '"\n',
//         'TEXT 10,80,"2",0,1,1,"Color: ' + data.color + '"\n',
//         'TEXT 10,95,"2",0,1,1,"Size: ' + data.size + '"\n',
//         'QRCODE 10,110,L,4,A,0,"' + data.bundle_random_id + '"\n',
//         "PRINT 1\n",
//       ].join("");

//       await characteristic.writeValue(new TextEncoder().encode(commands));

//       return true;
//     } catch (error) {
//       console.error("Print error:", error);
//       throw error;
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors ${
//           isConnected
//             ? "bg-blue-100 text-blue-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected" : "Connect Bluetooth Device"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//       </button>

//       {showDeviceList && selectedDevice && (
//         <div className="absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg p-2 z-50">
//           <div className="p-2 text-sm text-gray-700">
//             {selectedDevice.name || "Unknown Device"}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice || !isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         // Accept all devices first to find the printer
//         acceptAllDevices: true,
//         optionalServices: [
//           "00001101-0000-1000-8000-00805f9b34fb", // Standard Serial Port Service
//           "000018f0-0000-1000-8000-00805f9b34fb", // Gainscha specific service
//         ],
//         // optionalServices: [
//         //   "generic_access",
//         //   "battery_service",
//         //   "000018f0-0000-1000-8000-00805f9b34fb",
//         // ],
//       });

//       console.log("Device selected:", device.name);

//       const server = await device.gatt.connect();

//       setSelectedDevice(device);
//       setIsConnected(true);

//       // Add event listener for disconnection
//       device.addEventListener("gattserverdisconnected", () => {
//         console.log("Device disconnected");
//         setIsConnected(false);
//         setSelectedDevice(null);
//       });
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       alert("Failed to connect to printer. Please try again.");
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       // Disconnect
//       if (selectedDevice?.gatt?.connected) {
//         selectedDevice.gatt.disconnect();
//       }
//       setIsConnected(false);
//       setSelectedDevice(null);
//     } else {
//       scanForDevices();
//     }
//   };

//   // Function to print data
//   const printData = async (data) => {
//     if (!selectedDevice || !isConnected) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       const server = await selectedDevice.gatt.connect();

//       // Commands for Gainscha printer
//       const commands = [
//         "\x1B\x40", // Initialize printer
//         "\x1D\x76\x30", // Select paper type (thermal)
//         "\x1B\x4A\x40", // Feed paper 40 dots

//         // Set print area for 45mm x 70mm label
//         "\x1B\x57\x00\x00\x00\x00\x2C\x01\x9F\x00",

//         // Text alignment and size
//         "\x1B\x61\x01", // Center alignment
//         "\x1B\x21\x00", // Normal size text

//         // Print header information
//         `Factory: ${data.factory}\n`,
//         `MO: ${data.selectedMono}\n`,
//         `Buyer: ${data.buyer}\n`,
//         `Line: ${data.lineNo}\n`,
//         `Color: ${data.color}\n`,
//         `Size: ${data.size}\n`,

//         // QR Code commands
//         "\x1D\x28\x6B\x04\x00\x31\x41\x32\x00", // QR Code: Select model
//         "\x1D\x28\x6B\x03\x00\x31\x43\x05", // QR Code: Set size
//         "\x1D\x28\x6B\x03\x00\x31\x45\x31", // QR Code: Set error correction

//         // QR Code data
//         `\x1D\x28\x6B${String.fromCharCode(
//           data.bundle_random_id.length + 3
//         )}\x00\x31\x50\x30${data.bundle_random_id}`,

//         // Print QR Code
//         "\x1D\x28\x6B\x03\x00\x31\x51\x30",

//         // Feed and cut
//         "\x1B\x4A\x40", // Feed paper
//         "\x1D\x56\x42\x00", // Cut paper
//       ].join("");

//       // Send data to printer
//       const encoder = new TextEncoder();
//       const data = encoder.encode(commands);

//       // Try to find a characteristic that accepts write commands
//       const services = await server.getPrimaryServices();
//       for (const service of services) {
//         const characteristics = await service.getCharacteristics();
//         for (const characteristic of characteristics) {
//           if (
//             characteristic.properties.write ||
//             characteristic.properties.writeWithoutResponse
//           ) {
//             await characteristic.writeValue(data);
//             return true;
//           }
//         }
//       }

//       throw new Error("No writable characteristic found");
//     } catch (error) {
//       console.error("Print error:", error);
//       throw error;
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors ${
//           isConnected
//             ? "bg-blue-100 text-blue-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected" : "Connect Bluetooth Device"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//       </button>

//       {showDeviceList && selectedDevice && (
//         <div className="absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg p-2 z-50">
//           <div className="p-2 text-sm text-gray-700">
//             {selectedDevice.name || "Unknown Device"}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice?.gatt?.connected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         acceptAllDevices: true,
//         optionalServices: [
//           "00001101-0000-1000-8000-00805f9b34fb", // Standard Serial Port Service
//           "000018f0-0000-1000-8000-00805f9b34fb", // Gainscha specific service
//         ],
//       });

//       console.log("Device selected:", device.name);

//       const server = await device.gatt.connect();

//       // Get the required service
//       const service = await server.getPrimaryService(
//         "00001101-0000-1000-8000-00805f9b34fb"
//       );

//       setSelectedDevice(device);
//       setIsConnected(true);

//       device.addEventListener("gattserverdisconnected", () => {
//         console.log("Device disconnected");
//         setIsConnected(false);
//         setSelectedDevice(null);
//       });
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       alert("Failed to connect to printer. Please try again.");
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       if (selectedDevice?.gatt?.connected) {
//         selectedDevice.gatt.disconnect();
//       }
//       setIsConnected(false);
//       setSelectedDevice(null);
//     } else {
//       scanForDevices();
//     }
//   };

//   // Helper function for text encoding
//   const encodeText = (text) => {
//     return new TextEncoder().encode(text);
//   };

//   // Updated print function with proper ESC/POS commands
//   const printData = async (printData) => {
//     if (!selectedDevice?.gatt?.connected) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       const server = await selectedDevice.gatt.connect();
//       const service = await server.getPrimaryService(
//         "00001101-0000-1000-8000-00805f9b34fb"
//       );
//       const characteristic = await service.getCharacteristic(
//         "00002a01-0000-1000-8000-00805f9b34fb"
//       );

//       // Create command buffer
//       const commands = [
//         // Initialize printer
//         new Uint8Array([0x1b, 0x40]),

//         // Set alignment to center
//         new Uint8Array([0x1b, 0x61, 0x01]),

//         // Text content
//         encodeText(`Factory: ${printData.factory}\n`),
//         encodeText(`MO: ${printData.selectedMono}\n`),
//         encodeText(`Buyer: ${printData.buyer}\n`),
//         encodeText(`Line: ${printData.lineNo}\n`),
//         encodeText(`Color: ${printData.color}\n`),
//         encodeText(`Size: ${printData.size}\n\n`),

//         // QR Code configuration
//         new Uint8Array([
//           0x1d,
//           0x28,
//           0x6b,
//           0x03,
//           0x00,
//           0x31,
//           0x43,
//           0x08, // Set QR size (8)
//           0x1d,
//           0x28,
//           0x6b,
//           0x03,
//           0x00,
//           0x31,
//           0x45,
//           0x33, // Error correction level (H)
//         ]),

//         // QR Code data
//         (() => {
//           const data = encodeText(printData.bundle_random_id);
//           const length = data.length + 3;
//           return new Uint8Array([
//             0x1d,
//             0x28,
//             0x6b,
//             length,
//             0x00,
//             0x31,
//             0x50,
//             0x30,
//             ...data,
//           ]);
//         })(),

//         // Print QR code
//         new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),

//         // Feed and cut paper
//         new Uint8Array([0x1b, 0x64, 0x04]), // Feed 4 lines
//         new Uint8Array([0x1d, 0x56, 0x42, 0x00]), // Full cut
//       ];

//       // Send commands in sequence
//       for (const command of commands) {
//         await characteristic.writeValue(command);
//         await new Promise((resolve) => setTimeout(resolve, 50)); // Short delay
//       }

//       return true;
//     } catch (error) {
//       console.error("Print error:", error);
//       throw error;
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors ${
//           isConnected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected" : "Connect Bluetooth Device"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//       </button>

//       {showDeviceList && selectedDevice && (
//         <div className="absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg p-2 z-50">
//           <div className="p-2 text-sm text-gray-700">
//             {selectedDevice.name || "Unknown Device"}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth, Printer, AlertCircle } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState("");
//   const [server, setServer] = useState(null);

//   // Gainscha printer service UUIDs
//   const PRINTER_SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
//   const PRINTER_CHARACTERISTIC = "00002af1-0000-1000-8000-00805f9b34fb";

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice || !isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);
//       setConnectionStatus("Scanning for devices...");

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         filters: [
//           {
//             namePrefix: "GP-", // Filter for Gainscha printers
//           },
//         ],
//         optionalServices: [
//           PRINTER_SERVICE,
//           "generic_access",
//           "device_information",
//         ],
//       });

//       console.log("Device selected:", device.name);
//       setConnectionStatus("Device selected, connecting...");

//       const gattServer = await device.gatt.connect();
//       console.log("Connected to GATT server");
//       setConnectionStatus("Connected to printer");

//       // Get the printer service
//       const service = await gattServer.getPrimaryService(PRINTER_SERVICE);
//       console.log("Got printer service");

//       // Get the characteristic for printing
//       const characteristic = await service.getCharacteristic(
//         PRINTER_CHARACTERISTIC
//       );
//       console.log("Got printer characteristic");

//       setServer(gattServer);
//       setSelectedDevice(device);
//       setIsConnected(true);
//       setConnectionStatus("Ready to print");

//       // Add event listener for disconnection
//       device.addEventListener("gattserverdisconnected", handleDisconnection);
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       setConnectionStatus(error.message);
//       setIsConnected(false);
//       setSelectedDevice(null);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleDisconnection = () => {
//     console.log("Device disconnected");
//     setIsConnected(false);
//     setSelectedDevice(null);
//     setServer(null);
//     setConnectionStatus("Disconnected");
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       // Disconnect
//       if (server?.connected) {
//         server.disconnect();
//       }
//       handleDisconnection();
//     } else {
//       scanForDevices();
//     }
//   };

//   // Function to print data
//   const printData = async (data) => {
//     if (!selectedDevice || !isConnected || !server) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       const service = await server.getPrimaryService(PRINTER_SERVICE);
//       const characteristic = await service.getCharacteristic(
//         PRINTER_CHARACTERISTIC
//       );

//       // Commands for Gainscha printer
//       const commands = [
//         "\x1B\x40", // Initialize printer
//         "\x1D\x76\x30", // Select paper type (thermal)
//         "\x1B\x4A\x40", // Feed paper 40 dots

//         // Print header information
//         `Factory: ${data.factory}\n`,
//         `MO: ${data.selectedMono}\n`,
//         `Buyer: ${data.buyer}\n`,
//         `Line: ${data.lineNo}\n`,
//         `Color: ${data.color}\n`,
//         `Size: ${data.size}\n`,

//         // QR Code commands for Gainscha
//         "\x1D\x28\x6B\x04\x00\x31\x41\x32\x00", // QR Code: Select model
//         "\x1D\x28\x6B\x03\x00\x31\x43\x05", // QR Code: Set size
//         "\x1D\x28\x6B\x03\x00\x31\x45\x31", // QR Code: Set error correction

//         // QR Code data
//         `\x1D\x28\x6B${String.fromCharCode(
//           data.bundle_id.length + 3
//         )}\x00\x31\x50\x30${data.bundle_id}`,

//         // Print QR Code
//         "\x1D\x28\x6B\x03\x00\x31\x51\x30",

//         // Feed and cut
//         "\x1B\x4A\x40", // Feed paper
//         "\x1D\x56\x42\x00", // Cut paper
//       ].join("");

//       // Send data to printer
//       const encoder = new TextEncoder();
//       const data = encoder.encode(commands);
//       await characteristic.writeValue(data);

//       return true;
//     } catch (error) {
//       console.error("Print error:", error);
//       setConnectionStatus("Print error: " + error.message);
//       throw error;
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
//           isConnected
//             ? "bg-green-100 text-green-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected to printer" : "Connect to printer"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//         <Printer className="w-5 h-5" />
//       </button>

//       {connectionStatus && (
//         <div
//           className={`absolute top-full mt-2 w-48 p-2 rounded-md shadow-lg z-50 text-sm
//           ${
//             isConnected
//               ? "bg-green-50 text-green-700"
//               : "bg-white text-gray-700"
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             {isConnected ? (
//               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             ) : (
//               <AlertCircle className="w-4 h-4 text-gray-400" />
//             )}
//             <span>{connectionStatus}</span>
//           </div>
//           {selectedDevice && (
//             <div className="mt-1 text-xs text-gray-500">
//               {selectedDevice.name || "Unknown Device"}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth, Printer, AlertCircle } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState("");
//   const [server, setServer] = useState(null);

//   // Gainscha printer service UUIDs
//   const PRINTER_SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
//   const PRINTER_CHARACTERISTIC = "00002af1-0000-1000-8000-00805f9b34fb";

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice || !isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);
//       setConnectionStatus("Scanning for devices...");

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         filters: [
//           {
//             namePrefix: "GP-", // Filter for Gainscha printers
//           },
//         ],
//         optionalServices: [
//           PRINTER_SERVICE,
//           "generic_access",
//           "device_information",
//         ],
//       });

//       console.log("Device selected:", device.name);
//       setConnectionStatus("Device selected, connecting...");

//       const gattServer = await device.gatt.connect();
//       console.log("Connected to GATT server");
//       setConnectionStatus("Connected to printer");

//       // Get the printer service
//       const service = await gattServer.getPrimaryService(PRINTER_SERVICE);
//       console.log("Got printer service");

//       // Get the characteristic for printing
//       const characteristic = await service.getCharacteristic(
//         PRINTER_CHARACTERISTIC
//       );
//       console.log("Got printer characteristic");

//       setServer(gattServer);
//       setSelectedDevice(device);
//       setIsConnected(true);
//       setConnectionStatus("Ready to print");

//       // Add event listener for disconnection
//       device.addEventListener("gattserverdisconnected", handleDisconnection);
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       setConnectionStatus(error.message);
//       setIsConnected(false);
//       setSelectedDevice(null);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleDisconnection = () => {
//     console.log("Device disconnected");
//     setIsConnected(false);
//     setSelectedDevice(null);
//     setServer(null);
//     setConnectionStatus("Disconnected");
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       // Disconnect
//       if (server?.connected) {
//         server.disconnect();
//       }
//       handleDisconnection();
//     } else {
//       scanForDevices();
//     }
//   };

//   // Function to print data
//   const printData = async (printData) => {
//     if (!selectedDevice || !isConnected || !server) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       const service = await server.getPrimaryService(PRINTER_SERVICE);
//       const characteristic = await service.getCharacteristic(
//         PRINTER_CHARACTERISTIC
//       );

//       // Commands for Gainscha printer
//       const commands = [
//         "\x1B\x40", // Initialize printer
//         "\x1D\x76\x30", // Select paper type (thermal)
//         "\x1B\x4A\x40", // Feed paper 40 dots

//         // Print header information
//         `Factory: ${printData.factory}\n`,
//         `MO: ${printData.selectedMono}\n`,
//         `Buyer: ${printData.buyer}\n`,
//         `Line: ${printData.lineNo}\n`,
//         `Color: ${printData.color}\n`,
//         `Size: ${printData.size}\n`,

//         // QR Code commands for Gainscha
//         "\x1D\x28\x6B\x04\x00\x31\x41\x32\x00", // QR Code: Select model
//         "\x1D\x28\x6B\x03\x00\x31\x43\x05", // QR Code: Set size
//         "\x1D\x28\x6B\x03\x00\x31\x45\x31", // QR Code: Set error correction

//         // QR Code data
//         `\x1D\x28\x6B${String.fromCharCode(
//           printData.bundle_id.length + 3
//         )}\x00\x31\x50\x30${printData.bundle_id}`,

//         // Print QR Code
//         "\x1D\x28\x6B\x03\x00\x31\x51\x30",

//         // Feed and cut
//         "\x1B\x4A\x40", // Feed paper
//         "\x1D\x56\x42\x00", // Cut paper
//       ].join("");

//       // Send data to printer
//       const encoder = new TextEncoder();
//       const commandBuffer = encoder.encode(commands);
//       await characteristic.writeValue(commandBuffer);

//       return true;
//     } catch (error) {
//       console.error("Print error:", error);
//       setConnectionStatus("Print error: " + error.message);
//       throw error;
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
//           isConnected
//             ? "bg-green-100 text-green-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected to printer" : "Connect to printer"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//         <Printer className="w-5 h-5" />
//       </button>

//       {connectionStatus && (
//         <div
//           className={`absolute top-full mt-2 w-48 p-2 rounded-md shadow-lg z-50 text-sm
//           ${
//             isConnected
//               ? "bg-green-50 text-green-700"
//               : "bg-white text-gray-700"
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             {isConnected ? (
//               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             ) : (
//               <AlertCircle className="w-4 h-4 text-gray-400" />
//             )}
//             <span>{connectionStatus}</span>
//           </div>
//           {selectedDevice && (
//             <div className="mt-1 text-xs text-gray-500">
//               {selectedDevice.name || "Unknown Device"}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth, Printer, AlertCircle } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showDeviceList, setShowDeviceList] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState("");
//   const [server, setServer] = useState(null);
//   const [characteristic, setCharacteristic] = useState(null);

//   // Gainscha printer service UUIDs
//   const PRINTER_SERVICE = "fda50693-a4e2-4fb1-afcf-c6eb07647825"; // "000018f0-0000-1000-8000-00805f9b34fb";
//   const PRINTER_CHARACTERISTIC = "fda50693-a4e2-4fb1-afcf-c6eb07647825"; // "00002af1-0000-1000-8000-00805f9b34fb";

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice || !isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setShowDeviceList(true);
//       setConnectionStatus("Scanning for devices...");

//       if (!navigator.bluetooth) {
//         throw new Error("Bluetooth not supported");
//       }

//       const device = await navigator.bluetooth.requestDevice({
//         filters: [
//           {
//             namePrefix: "GP-", // Filter for Gainscha printers
//           },
//         ],
//         optionalServices: [PRINTER_SERVICE],
//       });

//       console.log("Device selected:", device.name);
//       setConnectionStatus("Device selected, connecting...");

//       const gattServer = await device.gatt.connect();
//       console.log("Connected to GATT server");

//       const service = await gattServer.getPrimaryService(PRINTER_SERVICE);
//       console.log("Got printer service");

//       const printerCharacteristic = await service.getCharacteristic(
//         PRINTER_CHARACTERISTIC
//       );
//       console.log("Got printer characteristic");

//       setServer(gattServer);
//       setCharacteristic(printerCharacteristic);
//       setSelectedDevice(device);
//       setIsConnected(true);
//       setConnectionStatus("Ready to print");

//       device.addEventListener("gattserverdisconnected", handleDisconnection);
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       setConnectionStatus(error.message);
//       setIsConnected(false);
//       setSelectedDevice(null);
//       setCharacteristic(null);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleDisconnection = () => {
//     console.log("Device disconnected");
//     setIsConnected(false);
//     setSelectedDevice(null);
//     setServer(null);
//     setCharacteristic(null);
//     setConnectionStatus("Disconnected");
//   };

//   const handleClick = () => {
//     if (isConnected) {
//       if (server?.connected) {
//         server.disconnect();
//       }
//       handleDisconnection();
//     } else {
//       scanForDevices();
//     }
//   };

//   const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   const writeToCharacteristic = async (data) => {
//     const CHUNK_SIZE = 20; // Bluetooth LE typically has a limit around 512 bytes
//     for (let i = 0; i < data.length; i += CHUNK_SIZE) {
//       const chunk = data.slice(i, i + CHUNK_SIZE);
//       await characteristic.writeValue(chunk);
//       await sleep(50); // Give the printer time to process each chunk
//     }
//   };

//   const printData = async (printData) => {
//     if (!selectedDevice || !isConnected || !characteristic) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       // Initialize printer
//       const initCommands = new Uint8Array([
//         0x1b,
//         0x40, // Initialize printer
//         0x1b,
//         0x61,
//         0x01, // Center alignment
//       ]);
//       await writeToCharacteristic(initCommands);
//       await sleep(100);

//       // Print text data
//       const textEncoder = new TextEncoder();
//       const textData = textEncoder.encode(
//         `Factory: ${printData.factory}\n` +
//           `MO: ${printData.selectedMono}\n` +
//           `Buyer: ${printData.buyer}\n` +
//           `Line: ${printData.lineNo}\n` +
//           `Color: ${printData.color}\n` +
//           `Size: ${printData.size}\n\n`
//       );
//       await writeToCharacteristic(textData);
//       await sleep(200);

//       // QR Code commands
//       const qrSetup = new Uint8Array([
//         0x1d,
//         0x28,
//         0x6b,
//         0x04,
//         0x00,
//         0x31,
//         0x41,
//         0x32,
//         0x00, // Select QR model
//         0x1d,
//         0x28,
//         0x6b,
//         0x03,
//         0x00,
//         0x31,
//         0x43,
//         0x05, // Set QR size
//         0x1d,
//         0x28,
//         0x6b,
//         0x03,
//         0x00,
//         0x31,
//         0x45,
//         0x31, // Set error correction
//       ]);
//       await writeToCharacteristic(qrSetup);
//       await sleep(100);

//       // QR Code data
//       const qrData = textEncoder.encode(printData.bundle_id);
//       const qrHeader = new Uint8Array([
//         0x1d,
//         0x28,
//         0x6b,
//         qrData.length + 3,
//         0x00,
//         0x31,
//         0x50,
//         0x30,
//       ]);
//       await writeToCharacteristic(qrHeader);
//       await writeToCharacteristic(qrData);
//       await sleep(100);

//       // Print QR Code
//       const printQR = new Uint8Array([
//         0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
//       ]);
//       await writeToCharacteristic(printQR);
//       await sleep(500);

//       // Feed and cut
//       const endCommands = new Uint8Array([
//         0x1b,
//         0x4a,
//         0x40, // Feed paper
//         0x1d,
//         0x56,
//         0x42,
//         0x00, // Cut paper
//       ]);
//       await writeToCharacteristic(endCommands);
//       await sleep(200);

//       return true;
//     } catch (error) {
//       console.error("Print error:", error);
//       setConnectionStatus("Print error: " + error.message);
//       throw error;
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
//           isConnected
//             ? "bg-green-100 text-green-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected to printer" : "Connect to printer"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//         <Printer className="w-5 h-5" />
//       </button>

//       {connectionStatus && (
//         <div
//           className={`absolute top-full mt-2 w-48 p-2 rounded-md shadow-lg z-50 text-sm
//           ${
//             isConnected
//               ? "bg-green-50 text-green-700"
//               : "bg-white text-gray-700"
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             {isConnected ? (
//               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             ) : (
//               <AlertCircle className="w-4 h-4 text-gray-400" />
//             )}
//             <span>{connectionStatus}</span>
//           </div>
//           {selectedDevice && (
//             <div className="mt-1 text-xs text-gray-500">
//               {selectedDevice.name || "Unknown Device"}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

// import React, {
//   useState,
//   useEffect,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { Bluetooth, Printer, AlertCircle } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [connectionStatus, setConnectionStatus] = useState("");
//   const [writeCharacteristic, setWriteCharacteristic] = useState(null);
//   const [printerType, setPrinterType] = useState("unknown");

//   // Niimbot B50W service UUIDs
//   const NIIMBOT_SERVICE = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
//   const NIIMBOT_WRITE_CHARACTERISTIC = "49535343-8841-43f4-a8d4-ecbe34729bb3";

//   // Gainscha printer service UUIDs
//   const GAINSCHA_SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
//   const GAINSCHA_CHARACTERISTIC = "00002af1-0000-1000-8000-00805f9b34fb";

//   useImperativeHandle(ref, () => ({
//     isConnected,
//     selectedDevice,
//     printData: async (data) => {
//       if (!selectedDevice || !isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return await printData(data);
//     },
//   }));

//   const detectPrinterType = (deviceName) => {
//     if (deviceName?.startsWith("GP-")) return "gainscha";
//     if (deviceName?.startsWith("B50W-")) return "niimbot";
//     return "unknown";
//   };

//   const scanForDevices = async () => {
//     try {
//       setIsScanning(true);
//       setConnectionStatus("Scanning for devices...");

//       const device = await navigator.bluetooth.requestDevice({
//         filters: [{ namePrefix: "GP-" }, { namePrefix: "B50W-" }],
//         optionalServices: [NIIMBOT_SERVICE, GAINSCHA_SERVICE],
//       });

//       const detectedType = detectPrinterType(device.name);
//       setPrinterType(detectedType);
//       setConnectionStatus(`Connecting to ${detectedType} printer...`);

//       const server = await device.gatt.connect();
//       let service, characteristic;

//       if (detectedType === "niimbot") {
//         service = await server.getPrimaryService(NIIMBOT_SERVICE);
//         characteristic = await service.getCharacteristic(
//           NIIMBOT_WRITE_CHARACTERISTIC
//         );
//       } else {
//         // Gainscha
//         service = await server.getPrimaryService(GAINSCHA_SERVICE);
//         characteristic = await service.getCharacteristic(
//           GAINSCHA_CHARACTERISTIC
//         );
//       }

//       setWriteCharacteristic(characteristic);
//       setSelectedDevice(device);
//       setIsConnected(true);
//       setConnectionStatus(`Connected to ${device.name}`);

//       device.addEventListener("gattserverdisconnected", handleDisconnection);
//     } catch (error) {
//       console.error("Bluetooth Error:", error);
//       setConnectionStatus(error.message);
//       setIsConnected(false);
//       setSelectedDevice(null);
//       setWriteCharacteristic(null);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   const handleDisconnection = () => {
//     setIsConnected(false);
//     setSelectedDevice(null);
//     setWriteCharacteristic(null);
//     setConnectionStatus("Disconnected");
//   };

//   const handleClick = () => {
//     isConnected ? handleDisconnection() : scanForDevices();
//   };

//   const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   const writeToPrinter = async (data) => {
//     const CHUNK_SIZE = printerType === "niimbot" ? 16 : 20;
//     const DELAY = printerType === "niimbot" ? 300 : 50;

//     for (let i = 0; i < data.length; i += CHUNK_SIZE) {
//       const chunk = data.slice(i, i + CHUNK_SIZE);
//       await writeCharacteristic.writeValue(chunk);
//       await sleep(DELAY);
//     }
//   };

//   const printData = async (printData) => {
//     if (!isConnected || !writeCharacteristic) {
//       throw new Error("Printer not connected");
//     }

//     try {
//       // Common initialization
//       const initCommands = new Uint8Array([0x1b, 0x40]);
//       await writeToPrinter(initCommands);

//       if (printerType === "niimbot") {
//         // Niimbot specific setup
//         const niimbotSetup = new Uint8Array([
//           0x1b,
//           0x61,
//           0x01, // Center alignment
//           0x1d,
//           0x57,
//           0x4c,
//           0x00, // Label width = 50mm
//           0x1d,
//           0x57,
//           0x48,
//           0x00, // Label height = 30mm
//           0x1b,
//           0x45,
//           0x01, // Bold ON
//         ]);
//         await writeToPrinter(niimbotSetup);
//       } else {
//         // Gainscha alignment
//         const gainschaAlignment = new Uint8Array([0x1b, 0x61, 0x01]);
//         await writeToPrinter(gainschaAlignment);
//       }

//       await sleep(100);

//       // Print text data
//       const textEncoder = new TextEncoder();
//       const textData = textEncoder.encode(
//         `Factory: ${printData.factory}\n` +
//           `MO: ${printData.selectedMono}\n` +
//           `Buyer: ${printData.buyer}\n` +
//           `Line: ${printData.lineNo}\n` +
//           `Color: ${printData.color}\n` +
//           `Size: ${printData.size}\n\n`
//       );
//       await writeToPrinter(textData);
//       await sleep(200);

//       // QR Code implementation (works for both printers)
//       const qrSetup = new Uint8Array([
//         0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, 0x1d, 0x28, 0x6b,
//         0x03, 0x00, 0x31, 0x43, 0x05, 0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45,
//         0x31,
//       ]);
//       await writeToPrinter(qrSetup);
//       await sleep(100);

//       const qrData = textEncoder.encode(printData.bundle_id);
//       const qrHeader = new Uint8Array([
//         0x1d,
//         0x28,
//         0x6b,
//         qrData.length + 3,
//         0x00,
//         0x31,
//         0x50,
//         0x30,
//       ]);
//       await writeToPrinter(qrHeader);
//       await writeToPrinter(qrData);
//       await sleep(100);

//       const printQR = new Uint8Array([
//         0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
//       ]);
//       await writeToPrinter(printQR);
//       await sleep(500);

//       // Common ending commands
//       const endCommands = new Uint8Array([
//         0x1b,
//         0x4a,
//         0x40, // Feed paper
//         0x1d,
//         0x56,
//         0x42,
//         0x00, // Cut paper
//       ]);
//       await writeToPrinter(endCommands);

//       return true;
//     } catch (error) {
//       console.error("Print error:", error);
//       setConnectionStatus("Print error: " + error.message);
//       throw error;
//     }
//   };

//   // Keep your existing JSX return here
//   return (
//     <div className="relative">
//       <button
//         onClick={handleClick}
//         className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
//           isConnected
//             ? "bg-green-100 text-green-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected to printer" : "Connect to printer"}
//       >
//         <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
//         <Printer className="w-5 h-5" />
//       </button>

//       {connectionStatus && (
//         <div
//           className={`absolute top-full mt-2 w-48 p-2 rounded-md shadow-lg z-50 text-sm ${
//             isConnected
//               ? "bg-green-50 text-green-700"
//               : "bg-white text-gray-700"
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             {isConnected ? (
//               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             ) : (
//               <AlertCircle className="w-4 h-4 text-gray-400" />
//             )}
//             <span>{connectionStatus}</span>
//           </div>
//           {selectedDevice && (
//             <div className="mt-1 text-xs text-gray-500">
//               {selectedDevice.name || "Unknown Device"}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Bluetooth, Printer, AlertCircle } from "lucide-react";

// Printer-specific configurations
const PRINTER_CONFIG = {
  niimbot: {
    serviceUUID: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    writeUUID: "49535343-8841-43f4-a8d4-ecbe34729bb3",
    chunkSize: 16,
    delay: 300,
    encoding: "cp437", // Niimbot typically uses CP437 encoding
  },
  gainscha: {
    serviceUUID: "000018f0-0000-1000-8000-00805f9b34fb",
    writeUUID: "00002af1-0000-1000-8000-00805f9b34fb",
    chunkSize: 20,
    delay: 50,
    encoding: "gbk", // Gainscha often uses GBK encoding for Chinese characters
  },
};

const BluetoothComponent = forwardRef((props, ref) => {
  const [state, setState] = useState({
    isConnected: false,
    isScanning: false,
    selectedDevice: null,
    connectionStatus: "",
    printerType: null,
    characteristic: null,
  });

  useImperativeHandle(ref, () => ({
    isConnected: state.isConnected,
    selectedDevice: state.selectedDevice,
    printData: async (data) => {
      if (!state.isConnected) throw new Error("Printer not connected");
      return await handlePrint(data);
    },
  }));

  const detectPrinterType = (deviceName) => {
    if (deviceName?.startsWith("GP-")) return "gainscha";
    if (deviceName?.startsWith("B50W-")) return "niimbot";
    return null;
  };

  const updateState = (newState) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const connectPrinter = async () => {
    try {
      updateState({
        isScanning: true,
        connectionStatus: "Scanning for devices...",
      });

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "GP-" }, { namePrefix: "B50W-" }],
        optionalServices: Object.values(PRINTER_CONFIG).map(
          (c) => c.serviceUUID
        ),
      });

      const printerType = detectPrinterType(device.name);
      if (!printerType) throw new Error("Unsupported printer");

      updateState({
        connectionStatus: `Connecting to ${printerType} printer...`,
        printerType,
      });

      const server = await device.gatt.connect();
      const { serviceUUID, writeUUID } = PRINTER_CONFIG[printerType];
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(writeUUID);

      device.addEventListener("gattserverdisconnected", handleDisconnect);

      updateState({
        isConnected: true,
        isScanning: false,
        selectedDevice: device,
        characteristic,
        connectionStatus: `Connected to ${device.name}`,
      });
    } catch (error) {
      console.error("Bluetooth Error:", error);
      handleDisconnect(error.message);
    }
  };

  const handleDisconnect = (errorMessage = "Disconnected") => {
    state.selectedDevice?.gatt?.disconnect();
    updateState({
      isConnected: false,
      isScanning: false,
      selectedDevice: null,
      characteristic: null,
      connectionStatus: errorMessage,
    });
  };

  const encodeText = (text, encoding) => {
    const encoder = new TextEncoder(encoding, {
      NONSTANDARD_allowLegacyEncoding: true,
    });
    return encoder.encode(text);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const writeToCharacteristic = async (data) => {
    const CHUNK_SIZE = 20; // Bluetooth LE typically has a limit around 512 bytes
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  const handlePrint = async (printData) => {
    const { printerType, characteristic } = state;
    if (!characteristic) throw new Error("Printer not ready");

    try {
      // Common initialization
      await sendChunkedData(new Uint8Array([0x1b, 0x40])); // Initialize printer

      // Printer-specific setup
      const config = PRINTER_CONFIG[printerType];
      let setupCommands = [];

      if (printerType === "niimbot") {
        setupCommands = [
          0x1b,
          0x61,
          0x01, // Center alignment
          0x1d,
          0x57,
          0x4c,
          0x00, // Label width
          0x1d,
          0x57,
          0x48,
          0x00, // Label height
          0x1b,
          0x45,
          0x01, // Bold on
        ];
      } else {
        setupCommands = [
          0x1b,
          0x61,
          0x01, // Center alignment
          0x1d,
          0x57,
          0x80,
          0x01, // Paper width 400 pixels
        ];
      }

      await sendChunkedData(new Uint8Array(setupCommands));
      await sendChunkedData(encodeText("\n\n", config.encoding));

      // Print text data
      const textLines = [
        `Factory: ${printData.factory}`,
        `MO: ${printData.selectedMono}`,
        `Buyer: ${printData.buyer}`,
        `Line: ${printData.lineNo}`,
        `Color: ${printData.color}`,
        `Size: ${printData.size}\n\n`,
      ];

      for (const line of textLines) {
        const encoded = encodeText(line + "\n", config.encoding);
        await sendChunkedData(encoded);
      }

      // Print QR Code
      const qrCommands = [
        0x1d,
        0x28,
        0x6b,
        0x04,
        0x00,
        0x31,
        0x41,
        0x32,
        0x00, // Set QR code size
        0x1d,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x43,
        0x08, // Set QR code error correction
        0x1d,
        0x28,
        0x6b,
        printerType === "niimbot" ? 0x03 : 0x04,
        0x00,
        0x31,
        0x50,
        0x30, // Store QR data
        ...encodeText(printData.bundle_id, config.encoding),
        0x1d,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x51,
        0x30, // Print QR code
      ];

      await sendChunkedData(new Uint8Array(qrCommands));
      await sendChunkedData(new Uint8Array([0x1b, 0x4a, 0x40])); // Feed paper
      await sendChunkedData(new Uint8Array([0x1d, 0x56, 0x42, 0x00])); // Cut paper

      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() =>
          state.isConnected ? handleDisconnect() : connectPrinter()
        }
        className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
          state.isConnected
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-400"
        }`}
        disabled={state.isScanning}
      >
        <Bluetooth
          className={`w-5 h-5 ${state.isScanning ? "animate-pulse" : ""}`}
        />
        <Printer className="w-5 h-5" />
      </button>

      {state.connectionStatus && (
        <div
          className={`absolute top-full mt-2 w-64 p-2 rounded-md shadow-lg z-50 text-sm ${
            state.isConnected
              ? "bg-green-50 text-green-700"
              : "bg-white text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {state.isConnected ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <AlertCircle className="w-4 h-4 text-gray-400" />
            )}
            <span>{state.connectionStatus}</span>
          </div>
          {state.selectedDevice && (
            <div className="mt-1 text-xs text-gray-500">
              {state.selectedDevice.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BluetoothComponent.displayName = "BluetoothComponent";
export default BluetoothComponent;

//electorn.js code

// import React, { useState, forwardRef, useImperativeHandle } from "react";
// import { Bluetooth, Printer, AlertCircle } from "lucide-react";

// const BluetoothComponent = forwardRef((props, ref) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState("");
//   const [printerName, setPrinterName] = useState("");

//   // Expose methods to parent component
//   useImperativeHandle(ref, () => ({
//     isConnected,
//     printData: async (data) => {
//       if (!isConnected) {
//         throw new Error("Printer not connected");
//       }
//       return window.electron.printData(data);
//     },
//   }));

//   const handleConnect = async () => {
//     try {
//       if (isConnected) {
//         await window.electron.disconnectPrinter();
//         setIsConnected(false);
//         setConnectionStatus("Disconnected");
//         return;
//       }

//       setConnectionStatus("Searching for printers...");

//       // Add timeout for printer discovery
//       const connectionResult = await Promise.race([
//         window.electron.connectPrinter(),
//         new Promise((_, reject) =>
//           setTimeout(() => reject(new Error("Connection timeout (30s)")), 30000)
//         ),
//       ]);

//       if (connectionResult.success) {
//         setIsConnected(true);
//         setPrinterName(connectionResult.printerName);
//         setConnectionStatus(`Connected to ${connectionResult.printerName}`);
//       } else {
//         throw new Error(connectionResult.error || "Failed to connect");
//       }
//     } catch (error) {
//       setConnectionStatus(error.message);
//       setIsConnected(false);
//       console.error("Connection error:", error);
//     }
//   };

//   return (
//     <div className="relative">
//       <button
//         onClick={handleConnect}
//         className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
//           isConnected
//             ? "bg-green-100 text-green-600"
//             : "bg-gray-100 text-gray-400"
//         }`}
//         title={isConnected ? "Connected to printer" : "Connect to printer"}
//       >
//         <Bluetooth className="w-5 h-5" />
//         <Printer className="w-5 h-5" />
//       </button>

//       {connectionStatus && (
//         <div
//           className={`absolute top-full mt-2 w-48 p-2 rounded-md shadow-lg z-50 text-sm
//           ${
//             isConnected
//               ? "bg-green-50 text-green-700"
//               : "bg-white text-gray-700"
//           }`}
//         >
//           <div className="flex items-center gap-2">
//             {isConnected ? (
//               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//             ) : (
//               <AlertCircle className="w-4 h-4 text-gray-400" />
//             )}
//             <span>{connectionStatus}</span>
//           </div>
//           {printerName && (
//             <div className="mt-1 text-xs text-gray-500">{printerName}</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// });

// BluetoothComponent.displayName = "BluetoothComponent";

// export default BluetoothComponent;
