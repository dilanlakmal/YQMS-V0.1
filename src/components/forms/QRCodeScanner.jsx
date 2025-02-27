import React, { useState } from "react";
import Scanner from "./Scanner";
import { Loader2, Package, Minus, Plus, Check, Clock, X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    const {t} = useTranslation();

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
          <p>{t("qrCodeScan.loading_bundle")}</p>
        </div>
      )}

      {scannedData && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-grow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("bundle.order_details")}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t("downDa.bundle_id")}</p>
                  <p className="font-medium">{scannedData.bundle_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.mono")}</p>
                  <p className="font-medium">{scannedData.selectedMono}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("prevHeader.style")}</p>
                  <p className="font-medium">{scannedData.custStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.buyer")}</p>
                  <p className="font-medium">{scannedData.buyer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.color")}</p>
                  <p className="font-medium">{scannedData.color}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.size")}</p>
                  <p className="font-medium">{scannedData.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.factory")}</p>
                  <p className="font-medium">{scannedData.factory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.line_no")}</p>
                  <p className="font-medium">{scannedData.lineNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bundle.count")}</p>
                  <p className="font-medium">{scannedData.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("qrCodeScan.separator_id")}</p>
                  <p className="font-medium">{scannedData.emp_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("qrCodeScan.registered_date")}</p>
                  <p className="font-medium">
                    {scannedData.updated_date_seperator}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("qrCodeScan.registered_time")}</p>
                  <p className="font-medium">
                    {scannedData.updated_time_seperator}
                  </p>
                </div>
                {scannedData.sub_con === "Yes" && (
                  <div>
                    <p className="text-sm text-gray-600">{t("qrCodeScan.sub_con_factory_name")}</p>
                    <p className="font-medium">{scannedData.sub_con_factory}</p>
                  </div>
                )}
                <div>
                  <div>
                  {isIroningPage && <p className="text-sm text-gray-600">{t("iro.pass_qty")}</p>}
                  {isWashingPage && <p className="text-sm text-gray-600">{t("wash.pass_qty")}</p>}
                  {isPackingPage && <p className="text-sm text-gray-600">{t("pack.pass_qty")}</p>}
                  {isOPAPage && <p className="text-sm text-gray-600">{t("opa.pass_qty")}</p>}
                  </div>

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
                    <div>
                    {isWashingPage && <p className="font-medium">{passQtyWash}</p>}
                    {isOPAPage && <p className="font-medium">{passQtyOPA}</p>}
                    {isPackingPage && <p className="font-medium">{passQtyPack}</p>}
                    </div>
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
                      {t("qrCodeScan.adding")} ({countdown}s)
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
                  {t("dash.reset")}
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
