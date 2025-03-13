import { AlertCircle, Bluetooth, Printer } from "lucide-react";
import React, { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useBluetooth } from "../context/BluetoothContext";
import { allDefects } from "../../constants/QC Inspection/defects";

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
  const { bluetoothState, updateBluetoothState } = useBluetooth();
  const [showStatus, setShowStatus] = useState(false);

  useImperativeHandle(ref, () => ({
    isConnected: bluetoothState.isConnected,
    selectedDevice: bluetoothState.selectedDevice,
    characteristic: bluetoothState.characteristic,
    connectPrinter,
    printData: async (data) => await handlePrint(data),
    printDefectData: async (data) => await handleDefectPrint(data),
    printGarmentDefectData: async (data) => await handleGarmentDefectPrint(data),
    printBundleDefectData: async (data) => await handleBundleDefectPrint(data),
    onConnect: null, // Will be set by parent component
    onDisconnect: null, // Will be set by parent component
  }));

  // Show connection status when it changes
  useEffect(() => {
    if (bluetoothState.connectionStatus) {
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bluetoothState.connectionStatus]);

  // Notify parent component of connection changes
  useEffect(() => {
    if (bluetoothState.isConnected && ref.current?.onConnect) {
      ref.current.onConnect();
    } else if (!bluetoothState.isConnected && ref.current?.onDisconnect) {
      ref.current.onDisconnect();
    }
  }, [bluetoothState.isConnected]);

  const detectPrinterType = (deviceName) => {
    if (deviceName?.startsWith("GP-")) return "gainscha";
    return null;
  };

  const connectPrinter = async () => {
    try {
      updateBluetoothState({
        isScanning: true,
        connectionStatus: "Scanning for devices...",
      });
      setShowStatus(true);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "GP-" }],
        optionalServices: [PRINTER_CONFIG.gainscha.serviceUUID],
      });
      const printerType = detectPrinterType(device.name);
      if (!printerType) throw new Error("Unsupported printer");
      updateBluetoothState({
        connectionStatus: `Connecting to ${printerType} printer...`,
        printerType,
      });
      const server = await device.gatt.connect();
      const { serviceUUID, writeUUID } = PRINTER_CONFIG[printerType];
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(writeUUID);
      
      
      // Set up disconnection listener
      device.addEventListener("gattserverdisconnected", handleDisconnect);
      // device.addEventListener("gattserverdisconnected", () => handleDisconnect());
      
      updateBluetoothState({
        isConnected: true,
        isScanning: false,
        selectedDevice: device,
        characteristic,
        connectionStatus: `Connected to ${device.name}`,
      });
      console.log("Device Connected");
      setShowStatus(true);
    } catch (error) {
      console.error("Bluetooth Error:", error);
      handleDisconnect(error.message);
    }
  };

  const handleDisconnect = (errorMessage = "Disconnected") => {
    if (bluetoothState.selectedDevice) {
      if (bluetoothState.selectedDevice.gatt.connected) {
        // console.log("Manually Disconnecting Bluetooth");
        bluetoothState.selectedDevice.gatt.disconnect();
      }
    }
    updateBluetoothState({
      isConnected: false,
      isScanning: false,
      selectedDevice: null,
      characteristic: null,
      connectionStatus: errorMessage,
    });
    setShowStatus(true);
  };

  useEffect(() => {
    if (showStatus) {
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 500); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showStatus]);

  const sendChunkedData = async (data) => {
    const { characteristic } = bluetoothState;
    const { chunkSize, delay } = PRINTER_CONFIG.gainscha;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  const getShortEngName = (defectName) => {
    const defect = allDefects.find((d) => d.english === defectName);
    return defect ? defect.shortEng : defectName; // Fallback to original name if not found
  };

  const handlePrint = async (printData) => {
    const { characteristic, counter } = bluetoothState;
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
        `TEXT 20,190,"2",0,1,1,"Package No: ${printData.package_no}"`,
        `QRCODE 30,230,L,6,M,0,"${printData.bundle_random_id}"`,
        "PRINT 1",
        "",
      ].join("\n");
      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands);
      await sendChunkedData(data);
      updateBluetoothState({ counter: counter + 1 });
      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  const handleDefectPrint = async (printData) => {
    const { characteristic, counter } = bluetoothState;
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
                `TEXT 20,${180 + index * 20},"2",0,1,1,"${getShortEngName(
                  d.defectName
                )} (${d.count})"`
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
      updateBluetoothState({ counter: counter + 1 });
      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  const handleGarmentDefectPrint = async (printData) => {
    const { characteristic, counter } = bluetoothState;
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
            `TEXT 20,${yPosition},"2",0,1,1,"${getShortEngName(defect.name)} (${
              defect.count
            })"`
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
      updateBluetoothState({ counter: counter + 1 });
      return true;
    } catch (error) {
      console.error("Print Error:", error);
      handleDisconnect("Print failed: " + error.message);
      throw error;
    }
  };

  const handleBundleDefectPrint = async (printData) => {
    const { characteristic, counter } = bluetoothState;
    if (!characteristic) throw new Error("Printer not ready");
    try {
      const defects =
        printData.defects && Array.isArray(printData.defects)
          ? printData.defects
          : [];
      const tsplCommands = [
        "SIZE 40 mm, 75 mm",
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
        `TEXT 20,130,"2",0,1,1,"Package No: ${printData.package_no || "N/A"}"`,
        `TEXT 20,150,"2",0,1,1,"Defects:"`,
      ];
      let yPosition = 170;
      defects.forEach((garment) => {
        garment.defects.forEach((defect) => {
          tsplCommands.push(
            `TEXT 20,${yPosition},"2",0,1,1,"(${
              garment.garmentNumber
            }) ${getShortEngName(defect.name)}: ${defect.count}"`
          );
          yPosition += 20;
        });
      });
      tsplCommands.push(
        `QRCODE 30,${yPosition},L,6,M,0,"${
          printData.defect_print_id || "N/A"
        }"`,
        "PRINT 1",
        ""
      );
      const encoder = new TextEncoder("gbk");
      const data = encoder.encode(tsplCommands.join("\n"));
      await sendChunkedData(data);
      updateBluetoothState({ counter: counter + 1 });
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
          bluetoothState.isConnected ? handleDisconnect() : connectPrinter()
        }
        className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
          bluetoothState.isConnected
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-400'
        }`}
        disabled={bluetoothState.isScanning}
      >
        <Bluetooth
          className={`w-5 h-5 ${bluetoothState.isScanning ? 'animate-pulse' : ''}`}
        />
        <Printer className="w-5 h-5" />
      </button>
      {showStatus && bluetoothState.connectionStatus && (
        <div
          className={`absolute top-full mt-2 w-64 p-2 rounded-md shadow-lg z-50 text-sm ${
            bluetoothState.isConnected
              ? "bg-green-50 text-green-700"
              : "bg-white text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {bluetoothState.isConnected ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <AlertCircle className="w-4 h-4 text-gray-400" />
            )}
            <span>{bluetoothState.connectionStatus}</span>
          </div>
          {bluetoothState.selectedDevice && (
            <div className="mt-1 text-xs text-gray-500">
              {bluetoothState.selectedDevice.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BluetoothComponent.displayName = "BluetoothComponent";

export default BluetoothComponent;
