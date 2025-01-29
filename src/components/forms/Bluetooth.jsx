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

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Bluetooth, Printer, AlertCircle } from "lucide-react";

const BluetoothComponent = forwardRef((props, ref) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [server, setServer] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);

  // Gainscha printer service UUIDs
  const PRINTER_SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
  const PRINTER_CHARACTERISTIC = "00002af1-0000-1000-8000-00805f9b34fb";

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    isConnected,
    selectedDevice,
    printData: async (data) => {
      if (!selectedDevice || !isConnected) {
        throw new Error("Printer not connected");
      }
      return await printData(data);
    },
  }));

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      setShowDeviceList(true);
      setConnectionStatus("Scanning for devices...");

      if (!navigator.bluetooth) {
        throw new Error("Bluetooth not supported");
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          {
            namePrefix: "GP-", // Filter for Gainscha printers
          },
        ],
        optionalServices: [PRINTER_SERVICE],
      });

      console.log("Device selected:", device.name);
      setConnectionStatus("Device selected, connecting...");

      const gattServer = await device.gatt.connect();
      console.log("Connected to GATT server");

      const service = await gattServer.getPrimaryService(PRINTER_SERVICE);
      console.log("Got printer service");

      const printerCharacteristic = await service.getCharacteristic(
        PRINTER_CHARACTERISTIC
      );
      console.log("Got printer characteristic");

      setServer(gattServer);
      setCharacteristic(printerCharacteristic);
      setSelectedDevice(device);
      setIsConnected(true);
      setConnectionStatus("Ready to print");

      device.addEventListener("gattserverdisconnected", handleDisconnection);
    } catch (error) {
      console.error("Bluetooth Error:", error);
      setConnectionStatus(error.message);
      setIsConnected(false);
      setSelectedDevice(null);
      setCharacteristic(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnection = () => {
    console.log("Device disconnected");
    setIsConnected(false);
    setSelectedDevice(null);
    setServer(null);
    setCharacteristic(null);
    setConnectionStatus("Disconnected");
  };

  const handleClick = () => {
    if (isConnected) {
      if (server?.connected) {
        server.disconnect();
      }
      handleDisconnection();
    } else {
      scanForDevices();
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const writeToCharacteristic = async (data) => {
    const CHUNK_SIZE = 512; // Bluetooth LE typically has a limit around 512 bytes
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
      await sleep(50); // Give the printer time to process each chunk
    }
  };

  const printData = async (printData) => {
    if (!selectedDevice || !isConnected || !characteristic) {
      throw new Error("Printer not connected");
    }

    try {
      // Initialize printer
      const initCommands = new Uint8Array([
        0x1b,
        0x40, // Initialize printer
        0x1b,
        0x61,
        0x01, // Center alignment
      ]);
      await writeToCharacteristic(initCommands);
      await sleep(100);

      // Print text data
      const textEncoder = new TextEncoder();
      const textData = textEncoder.encode(
        `Factory: ${printData.factory}\n` +
          `MO: ${printData.selectedMono}\n` +
          `Buyer: ${printData.buyer}\n` +
          `Line: ${printData.lineNo}\n` +
          `Color: ${printData.color}\n` +
          `Size: ${printData.size}\n\n`
      );
      await writeToCharacteristic(textData);
      await sleep(200);

      // QR Code commands
      const qrSetup = new Uint8Array([
        0x1d,
        0x28,
        0x6b,
        0x04,
        0x00,
        0x31,
        0x41,
        0x32,
        0x00, // Select QR model
        0x1d,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x43,
        0x05, // Set QR size
        0x1d,
        0x28,
        0x6b,
        0x03,
        0x00,
        0x31,
        0x45,
        0x31, // Set error correction
      ]);
      await writeToCharacteristic(qrSetup);
      await sleep(100);

      // QR Code data
      const qrData = textEncoder.encode(printData.bundle_id);
      const qrHeader = new Uint8Array([
        0x1d,
        0x28,
        0x6b,
        qrData.length + 3,
        0x00,
        0x31,
        0x50,
        0x30,
      ]);
      await writeToCharacteristic(qrHeader);
      await writeToCharacteristic(qrData);
      await sleep(100);

      // Print QR Code
      const printQR = new Uint8Array([
        0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
      ]);
      await writeToCharacteristic(printQR);
      await sleep(500);

      // Feed and cut
      const endCommands = new Uint8Array([
        0x1b,
        0x4a,
        0x40, // Feed paper
        0x1d,
        0x56,
        0x42,
        0x00, // Cut paper
      ]);
      await writeToCharacteristic(endCommands);
      await sleep(200);

      return true;
    } catch (error) {
      console.error("Print error:", error);
      setConnectionStatus("Print error: " + error.message);
      throw error;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
          isConnected
            ? "bg-green-100 text-green-600"
            : "bg-gray-100 text-gray-400"
        }`}
        title={isConnected ? "Connected to printer" : "Connect to printer"}
      >
        <Bluetooth className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
        <Printer className="w-5 h-5" />
      </button>

      {connectionStatus && (
        <div
          className={`absolute top-full mt-2 w-48 p-2 rounded-md shadow-lg z-50 text-sm
          ${
            isConnected
              ? "bg-green-50 text-green-700"
              : "bg-white text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <AlertCircle className="w-4 h-4 text-gray-400" />
            )}
            <span>{connectionStatus}</span>
          </div>
          {selectedDevice && (
            <div className="mt-1 text-xs text-gray-500">
              {selectedDevice.name || "Unknown Device"}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BluetoothComponent.displayName = "BluetoothComponent";

export default BluetoothComponent;
