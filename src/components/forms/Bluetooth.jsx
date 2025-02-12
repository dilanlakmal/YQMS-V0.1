import { AlertCircle, Bluetooth, Printer } from "lucide-react";
import React, { forwardRef, useImperativeHandle, useState } from "react";

// Printer-specific configurations
const PRINTER_CONFIG = {
  gainscha: {
    serviceUUID: "000018f0-0000-1000-8000-00805f9b34fb",
    writeUUID: "00002af1-0000-1000-8000-00805f9b34fb",
    chunkSize: 20,
    delay: 50,
    encoding: "gbk",
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
    counter: 1,
  });

  useImperativeHandle(ref, () => ({
    isConnected: state.isConnected,
    selectedDevice: state.selectedDevice,
    printData: async (data) => await handlePrint(data),
  }));

  const detectPrinterType = (deviceName) => {
    if (deviceName?.startsWith("GP-")) return "gainscha";
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
        filters: [{ namePrefix: "GP-" }],
        optionalServices: [PRINTER_CONFIG.gainscha.serviceUUID],
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

  const sendChunkedData = async (data) => {
    const { characteristic } = state;
    const { chunkSize, delay } = PRINTER_CONFIG.gainscha;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  const handlePrint = async (printData) => {
    const { characteristic, counter } = state;
    if (!characteristic) throw new Error("Printer not ready");

    try {
      // Generate TSPL commands with optimized layout and smaller QR code
      const tsplCommands = [
        "SIZE 40 mm, 75 mm", // Increased label height to 70 mm
        "GAP 0 mm, 0 mm",
        "DIRECTION 0",
        "CLS",
        "SPEED 4",
        "DENSITY 8",
        "SET TEAR ON",
        `SET COUNTER @1 ${counter}`,
        // Adjusted text positions to fit within 75 mm height
        `TEXT 20,30,"2",0,1,1,"Factory: ${printData.factory}"`,
        `TEXT 20,50,"2",0,1,1,"Cust.Style: ${printData.custStyle}"`,
        `TEXT 20,70,"2",0,1,1,"MO: ${printData.selectedMono}"`,
        `TEXT 20,90,"2",0,1,1,"Buyer: ${printData.buyer}"`,
        `TEXT 20,110,"2",0,1,1,"Line: ${printData.lineNo}"`,
        `TEXT 20,130,"2",0,1,1,"Color: ${printData.color}"`,
        `TEXT 20,150,"2",0,1,1,"Size: ${printData.size}"`,
        `TEXT 20,170,"2",0,1,1,"Count: ${printData.count}"`,
        // Corrected QR code parameters and position
        `QRCODE 30,210,L,6,M,0,"${printData.bundle_random_id}"`, // Y=300, size=M, EC=3 (H)
        "PRINT 1",
        "",
      ].join("\n");
      // const tsplCommands = [
      //   "SIZE 40 mm, 25 mm",
      //   "GAP 0 mm, 0 mm",
      //   "DIRECTION 0",
      //   "CLS",
      //   "SPEED 4",
      //   "DENSITY 8",
      //   "SET TEAR ON",
      //   `SET COUNTER @1 ${counter}`,
      //   // Adjusted text positions and added factory name
      //   `TEXT 10,10,"2",0,1,1,"Factory: ${printData.factory}"`,
      //   `TEXT 10,30,"2",0,1,1,"MO: ${printData.selectedMono}"`,
      //   `TEXT 10,50,"2",0,1,1,"Buyer: ${printData.buyer}"`,
      //   `TEXT 10,70,"2",0,1,1,"Line: ${printData.lineNo}"`,
      //   `TEXT 10,90,"2",0,1,1,"Color: ${printData.color}"`,
      //   `TEXT 10,110,"2",0,1,1,"Size: ${printData.size}"`,
      //   `TEXT 10,130,"2",0,1,1,"Count: ${printData.count}"`,
      //   // Reduced QR code size (L to M) and adjusted position
      //   `QRCODE 5,170,L,4,M,0,"${printData.bundle_random_id}"`,
      //   "PRINT 1",
      //   "",
      // ].join("\n");

      // Convert to bytes with GBK encoding
      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands);

      // Send commands
      await sendChunkedData(data);

      // Increment counter for next print
      updateState({ counter: counter + 1 });

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