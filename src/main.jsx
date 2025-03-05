import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BluetoothProvider } from "./components/context/BluetoothContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BluetoothProvider>
      <App />
    </BluetoothProvider>
  </React.StrictMode>
);
