import { AlertCircle, Bluetooth, Printer } from "lucide-react";
import React, { forwardRef, useImperativeHandle, useState } from "react";

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
    printDefectData: async (data) => await handleDefectPrint(data),
    printGarmentDefectData: async (data) =>
      await handleGarmentDefectPrint(data),
    printBundleDefectData: async (data) => await handleBundleDefectPrint(data),
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
      const tsplCommands = [
        "SIZE 40 mm, 75 mm",
        "GAP 0 mm, 0 mm",
        "DIRECTION 0",
        "CLS",
        "SPEED 4",
        "DENSITY 8",
        "SET TEAR ON",
        `SET COUNTER @1 ${counter}`,
        `TEXT 20,30,"2",0,1,1,"Factory: ${printData.factory}"`,
        `TEXT 20,50,"2",0,1,1,"Cust.Style: ${printData.custStyle}"`,
        `TEXT 20,70,"2",0,1,1,"MO: ${printData.selectedMono}"`,
        `TEXT 20,90,"2",0,1,1,"Buyer: ${printData.buyer}"`,
        `TEXT 20,110,"2",0,1,1,"Line: ${printData.lineNo}"`,
        `TEXT 20,130,"2",0,1,1,"Color: ${printData.color}"`,
        `TEXT 20,150,"2",0,1,1,"Size: ${printData.size}"`,
        `TEXT 20,170,"2",0,1,1,"Count: ${printData.count}"`,
        `QRCODE 30,210,L,6,M,0,"${printData.bundle_random_id}"`,
        "PRINT 1",
        "",
      ].join("\n");
      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands);
      await sendChunkedData(data);
      updateState({ counter: counter + 1 });
      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  const handleDefectPrint = async (printData) => {
    const { characteristic, counter } = state;
    if (!characteristic) throw new Error("Printer not ready");
    try {
      const tsplCommands = [
        "SIZE 40 mm, 75 mm",
        "GAP 0 mm, 0 mm",
        "DIRECTION 0",
        "CLS",
        "SPEED 4",
        "DENSITY 8",
        "SET TEAR ON",
        `SET COUNTER @1 ${counter}`,
        `TEXT 20,10,"2",0,1,1,"Factory: ${printData.factory}"`,
        `TEXT 20,30,"2",0,1,1,"MO: ${printData.moNo}"`,
        `TEXT 20,50,"2",0,1,1,"Style: ${printData.custStyle}"`,
        `TEXT 20,70,"2",0,1,1,"Color: ${printData.color}"`,
        `TEXT 20,90,"2",0,1,1,"Size: ${printData.size}"`,
        `TEXT 20,110,"2",0,1,1,"Count: ${printData.count_print}"`,
        `TEXT 20,130,"2",0,1,1,"Repair: ${printData.repair}"`,
        `TEXT 20,150,"2",0,1,1,"Defects:"`,
        ...(printData.defects && Array.isArray(printData.defects)
          ? printData.defects.map(
              (d, index) =>
                `TEXT 20,${180 + index * 20},"2",0,1,1,"${d.defectName} (${
                  d.count
                })"`
            )
          : []),
        `QRCODE 30,${180 + (printData.defects?.length || 0) * 20},L,6,M,0,"${
          printData.defect_id
        }"`,
        "PRINT 1",
        "",
      ].join("\n");
      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands);
      await sendChunkedData(data);
      updateState({ counter: counter + 1 });
      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  const handleGarmentDefectPrint = async (printData) => {
    const { characteristic, counter } = state;
    if (!characteristic) throw new Error("Printer not ready");
    try {
      const defects =
        printData.rejectGarments?.[0]?.defects &&
        Array.isArray(printData.rejectGarments[0].defects)
          ? printData.rejectGarments[0].defects
          : [];
      const defectsByRepair = defects.reduce((acc, defect) => {
        const repair = defect.repair || "Unknown";
        if (!acc[repair]) acc[repair] = [];
        acc[repair].push(defect);
        return acc;
      }, {});

      const tsplCommands = [
        "SIZE 40 mm, 75 mm",
        "GAP 0 mm, 0 mm",
        "DIRECTION 0",
        "CLS",
        "SPEED 4",
        "DENSITY 8",
        "SET TEAR ON",
        `SET COUNTER @1 ${counter}`,
        `TEXT 20,10,"2",0,1,1,"Factory: ${printData.factory || "N/A"}"`,
        `TEXT 20,30,"2",0,1,1,"MO: ${printData.moNo || "N/A"}"`,
        `TEXT 20,50,"2",0,1,1,"Style: ${printData.custStyle || "N/A"}"`,
        `TEXT 20,70,"2",0,1,1,"Color: ${printData.color || "N/A"}"`,
        `TEXT 20,90,"2",0,1,1,"Size: ${printData.size || "N/A"}"`,
        `TEXT 20,110,"2",0,1,1,"Count: ${
          printData.rejectGarments?.[0]?.totalCount || printData.count || "N/A"
        }"`,
        `TEXT 20,130,"2",0,1,1,"Package No: ${printData.package_no || "N/A"}"`,
        `TEXT 20,150,"2",0,1,1,"Defects:"`,
      ];

      let yPosition = 170;
      Object.entries(defectsByRepair).forEach(([repair, defects]) => {
        tsplCommands.push(`TEXT 20,${yPosition},"2",0,1,1,"${repair}:"`);
        yPosition += 20;
        defects.forEach((defect) => {
          tsplCommands.push(
            `TEXT 20,${yPosition},"2",0,1,1,"${defect.name} (${defect.count})"`
          );
          yPosition += 20;
        });
      });

      tsplCommands.push(
        `QRCODE 30,${yPosition},L,6,M,0,"${
          printData.rejectGarments?.[0]?.garment_defect_id || "N/A"
        }"`,
        "PRINT 1",
        ""
      );

      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands.join("\n"));
      await sendChunkedData(data);
      updateState({ counter: counter + 1 });
      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  const handleBundleDefectPrint = async (printData) => {
    const { characteristic, counter } = state;
    if (!characteristic) throw new Error("Printer not ready");
    try {
      // Ensure defects array exists, default to empty array if not
      const defects =
        printData.defects && Array.isArray(printData.defects)
          ? printData.defects
          : [];

      // Initialize TSPL commands for the printer
      const tsplCommands = [
        "SIZE 40 mm, 75 mm", // Label size
        "GAP 0 mm, 0 mm",
        "DIRECTION 0",
        "CLS",
        "SPEED 4",
        "DENSITY 8",
        "SET TEAR ON",
        `SET COUNTER @1 ${counter}`,
        `TEXT 20,10,"2",0,1,1,"MO: ${printData.moNo || "N/A"}"`,
        `TEXT 20,30,"2",0,1,1,"Color: ${printData.color || "N/A"}"`,
        `TEXT 20,50,"2",0,1,1,"Size: ${printData.size || "N/A"}"`,
        `TEXT 20,70,"2",0,1,1,"Bundle Qty: ${printData.bundleQty || "N/A"}"`,
        `TEXT 20,90,"2",0,1,1,"Reject Garments: ${
          printData.totalRejectGarments || "N/A"
        }"`,
        `TEXT 20,110,"2",0,1,1,"Defect Count: ${
          printData.totalDefectCount || "N/A"
        }"`,
        `TEXT 20,130,"2",0,1,1,"Package No: ${printData.package_no || "N/A"}"`, // Include package_no
        `TEXT 20,150,"2",0,1,1,"Defects:"`,
      ];

      // Start y-position for defects
      let yPosition = 170;

      // Iterate over each garment and its defects
      defects.forEach((garment) => {
        garment.defects.forEach((defect) => {
          // Print each defect on its own row with garment number prefix
          tsplCommands.push(
            `TEXT 20,${yPosition},"2",0,1,1,"(${garment.garmentNumber}) ${defect.name}: ${defect.count}"`
          );
          yPosition += 20; // Move down for the next defect
        });
      });

      // Add QR code and print command
      tsplCommands.push(
        `QRCODE 30,${yPosition},L,6,M,0,"${
          printData.defect_print_id || "N/A"
        }"`,
        "PRINT 1",
        ""
      );

      // Encode and send the commands to the printer
      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands.join("\n"));
      await sendChunkedData(data);
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
