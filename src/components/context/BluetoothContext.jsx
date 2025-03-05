// import React, { createContext, useContext, useState } from "react";

// const BluetoothContext = createContext();

// export const useBluetooth = () => useContext(BluetoothContext);

// export const BluetoothProvider = ({ children }) => {
//   const [bluetoothState, setBluetoothState] = useState({
//     isConnected: false,
//     isScanning: false,
//     selectedDevice: null,
//     connectionStatus: "",
//     printerType: null,
//     characteristic: null,
//     counter: 1,
//   });

//   const updateBluetoothState = (newState) => {
//     setBluetoothState((prev) => ({ ...prev, ...newState }));
//   };

//   return (
//     <BluetoothContext.Provider value={{ bluetoothState, updateBluetoothState }}>
//       {children}
//     </BluetoothContext.Provider>
//   );
// };

import React, { createContext, useContext, useEffect, useState } from "react";

const BluetoothContext = createContext();

export const useBluetooth = () => useContext(BluetoothContext);

export const BluetoothProvider = ({ children }) => {
  const [bluetoothState, setBluetoothState] = useState({
    isConnected: false,
    isScanning: false,
    selectedDevice: null,
    connectionStatus: "",
    printerType: null,
    characteristic: null,
    counter: 1,
  });

  const updateBluetoothState = (newState) => {
    setBluetoothState((prev) => ({ ...prev, ...newState }));
  };

  // Persist bluetooth state to localStorage when it changes
  useEffect(() => {
    if (bluetoothState.isConnected) {
      // We can't store the device or characteristic objects, so we just store connection status
      localStorage.setItem("bluetoothConnected", "true");
      localStorage.setItem(
        "bluetoothDeviceName",
        bluetoothState.selectedDevice?.name || ""
      );
      localStorage.setItem(
        "bluetoothPrinterType",
        bluetoothState.printerType || ""
      );
      localStorage.setItem(
        "bluetoothCounter",
        bluetoothState.counter.toString()
      );
    } else {
      localStorage.removeItem("bluetoothConnected");
      localStorage.removeItem("bluetoothDeviceName");
      localStorage.removeItem("bluetoothPrinterType");
    }
  }, [
    bluetoothState.isConnected,
    bluetoothState.selectedDevice,
    bluetoothState.printerType,
    bluetoothState.counter,
  ]);

  // Check for disconnection events at the global level
  useEffect(() => {
    const handleBluetoothDisconnected = (event) => {
      console.log("Bluetooth device disconnected event detected");
      if (bluetoothState.isConnected) {
        updateBluetoothState({
          isConnected: false,
          isScanning: false,
          selectedDevice: null,
          characteristic: null,
          connectionStatus: "Device disconnected",
        });
      }
    };

    // Listen for bluetooth disconnection events
    navigator.bluetooth?.addEventListener?.(
      "disconnected",
      handleBluetoothDisconnected
    );

    return () => {
      navigator.bluetooth?.removeEventListener?.(
        "disconnected",
        handleBluetoothDisconnected
      );
    };
  }, [bluetoothState.isConnected]);

  return (
    <BluetoothContext.Provider value={{ bluetoothState, updateBluetoothState }}>
      {children}
    </BluetoothContext.Provider>
  );
};
