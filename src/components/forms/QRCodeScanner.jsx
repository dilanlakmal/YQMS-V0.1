// src/components/QrCodeScanner.js

import React, { useState } from "react";
import Scanner from "./Scanner";
import { Loader2, Package, Minus, Plus, Check, Clock, X, AlertCircle } from "lucide-react";

const QrCodeScanner = ({ 
  onScanSuccess, 
  onScanError, 
  autoAdd, 
  isAdding, 
  countdown, 
  handleAddRecord, 
  handleReset, 
  scannedData, 
  loadingData, 
  passQtyIron,
  passQtyOPA,
  passQtyWash,
  passQtyPack, 
  handlePassQtyChange, 
  error,
  isIroningPage, isWashingPage, isPackingPage, isOPAPage }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <Scanner
        onScanSuccess={onScanSuccess}
        onScanError={onScanError}
        continuous={true}
      />

      {loadingData && (
        <div className="flex items-center justify-center gap-2 text-blue-600 mt-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Loading bundle data...</p>
        </div>
      )}

      {scannedData && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-grow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Order Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bundle ID</p>
                  <p className="font-medium">{scannedData.bundle_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">MO Number</p>
                  <p className="font-medium">{scannedData.selectedMono}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Style</p>
                  <p className="font-medium">{scannedData.custStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Buyer</p>
                  <p className="font-medium">{scannedData.buyer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Color</p>
                  <p className="font-medium">{scannedData.color}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium">{scannedData.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Factory</p>
                  <p className="font-medium">{scannedData.factory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Line No</p>
                  <p className="font-medium">{scannedData.lineNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Count</p>
                  <p className="font-medium">{scannedData.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Separator ID</p>
                  <p className="font-medium">{scannedData.emp_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registered Date</p>
                  <p className="font-medium">
                    {scannedData.updated_date_seperator}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registered Time</p>
                  <p className="font-medium">
                    {scannedData.updated_time_seperator}
                  </p>
                </div>
                {scannedData.sub_con === "Yes" && (
                  <div>
                    <p className="text-sm text-gray-600">Sub Con Factory Name</p>
                    <p className="font-medium">{scannedData.sub_con_factory}</p>
                  </div>
                )}
                <div>
                  {isIroningPage && <p className="text-sm text-gray-600">Pass Qty (Iron)</p>}
                  {isWashingPage && <p className="text-sm text-gray-600">Pass Qty (wash)</p>}
                  {isPackingPage && <p className="text-sm text-gray-600">Pass Qty (pack)</p>}
                  {isOPAPage && <p className="text-sm text-gray-600">Pass Qty (OPA)</p>}


                  {isIroningPage ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePassQtyChange(passQtyIron - 1)}
                        className="px-2 py-1 rounded-md bg-gray-200 text-gray-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={passQtyIron}
                        onChange={(e) => handlePassQtyChange(Number(e.target.value))}
                        className="w-16 text-center border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={() => handlePassQtyChange(passQtyIron + 1)}
                        className="px-2 py-1 rounded-md bg-gray-200 text-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    // <p className="font-medium">{passQtyIron}</p>
                    <input
                      type="number"
                      value={isWashingPage ? passQtyWash :
                        isPackingPage ? passQtyPack :
                        isOPAPage ? passQtyOPA :
                        passQtyIron // Default to passQtyIron if none of the conditions match
                      }
                      readOnly
                      className="w-16 text-center border border-gray-300 rounded-md bg-gray-100"
                    />
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleAddRecord}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                    isAdding ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                  }`}
                >
                  {autoAdd && isAdding ? (
                    <>
                      <Clock className="w-5 h-5" />
                      Adding ({countdown}s)
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {autoAdd ? "Add Now" : "Add"}
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-md bg-gray-500 text-white flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )} */}
    </div>
  );
};

export default QrCodeScanner;
