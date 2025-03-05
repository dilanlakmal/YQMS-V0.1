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
  isIroningPage, isWashingPage, isPackingPage, isOPAPage,isDefectCard }) => {
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
                    {isDefectCard
                      ? isOPAPage || isIroningPage || isWashingPage
                        ? scannedData.totalRejectGarmentCount || 0
                        : isPackingPage
                        ? scannedData.totalRejectGarment_Var || 0
                        : scannedData.count || 0
                      : scannedData.count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("qrCodeScan.registered_time")}</p>
                  <p className="font-medium">
                    {isDefectCard
                      ? scannedData.emp_id_inspection
                      : scannedData.emp_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {isDefectCard ? "Inspection Date" : "Registered Date"}
                  </p>
                  <p className="font-medium">
                    {isDefectCard
                      ? scannedData.inspection_date
                      : scannedData.updated_date_seperator}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {isDefectCard ? "Inspection Time" : "Registered Time"}
                  </p>
                  <p className="font-medium">
                    {isDefectCard
                      ? scannedData.inspection_time
                      : scannedData.updated_time_seperator}
                  </p>
                </div>
                {scannedData.sub_con === "Yes" && (
                  <div>
                    <p className="text-sm text-gray-600">{t("qrCodeScan.sub_con_factory_name")}</p>
                    <p className="font-medium">{scannedData.sub_con_factory}</p>
                  </div>
                )}
              </div>

              {/* <div>
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
                  )} */}

              {/* Horizontal Line Separator */}
              <hr className="my-6 border-gray-300" />

              {/* Pass Quantity Section */}
              {(isIroningPage || isOPAPage) && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {isIroningPage ? "Pass Iron Qty" : "Pass OPA Qty"}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handlePassQtyChange(
                          (isIroningPage ? passQtyIron : passQtyOPA) - 1
                        )
                      }
                      className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    <input
                      type="number"
                      value={isIroningPage ? passQtyIron : passQtyOPA}
                      onChange={(e) =>
                        handlePassQtyChange(Number(e.target.value))
                      }
                      className="w-20 text-lg text-center border border-gray-300 rounded-md py-2"
                    />
                    <button
                      onClick={() =>
                        handlePassQtyChange(
                          (isIroningPage ? passQtyIron : passQtyOPA) + 1
                        )
                      }
                      className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {isWashingPage && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Pass Wash Qty</p>
                  <input
                    type="number"
                    value={passQtyWash}
                    readOnly
                    className="w-20 text-lg text-center border border-gray-300 rounded-md py-2 bg-gray-100"
                  />
                </div>
              )}

              {isPackingPage && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Pass Pack Qty</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePassQtyChange(passQtyPack - 1)}
                      className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      disabled={passQtyPack <= 0}
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    <input
                      type="number"
                      value={passQtyPack}
                      onChange={(e) =>
                        handlePassQtyChange(Number(e.target.value))
                      }
                      className="w-20 text-lg text-center border border-gray-300 rounded-md py-2"
                      min="0"
                      max={
                        isDefectCard
                          ? scannedData.totalRejectGarment_Var ||
                            scannedData.count
                          : scannedData.count
                      }
                    />
                    <button
                      onClick={() => handlePassQtyChange(passQtyPack + 1)}
                      className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      disabled={
                        passQtyPack >=
                        (isDefectCard
                          ? scannedData.totalRejectGarment_Var ||
                            scannedData.count
                          : scannedData.count)
                      }
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

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
    </div>
  );
};

export default QrCodeScanner;
