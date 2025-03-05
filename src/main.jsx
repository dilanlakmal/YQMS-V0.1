import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BluetoothProvider } from './components/context/BluetoothContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <BluetoothProvider>
    <App />
    </BluetoothProvider>
  </React.StrictMode>,
)
