import React, { createContext, useContext, useState } from 'react';

const BluetoothContext = createContext();

export const useBluetooth = () => useContext(BluetoothContext);

export const BluetoothProvider = ({ children }) => {
  const [bluetoothState, setBluetoothState] = useState({
    isConnected: false,
    isScanning: false,
    selectedDevice: null,
    connectionStatus: '',
    printerType: null,
    characteristic: null,
    counter: 1,
  });

  const updateBluetoothState = (newState) => {
    setBluetoothState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <BluetoothContext.Provider value={{ bluetoothState, updateBluetoothState }}>
      {children}
    </BluetoothContext.Provider>
  );
};
