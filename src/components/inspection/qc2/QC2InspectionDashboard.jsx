//---This component shows the bundle information and the key statistics (Checked, Pass, Reject, Defect Qty).---//

import React from "react";
import { useTranslation } from "react-i18next";
import { QrCode, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const QC2InspectionDashboard = ({
  bundleData,
  isReturnInspection,
  sessionData,
  totalPass,
  totalRejects,
  defectQty
}) => {
  const { t } = useTranslation();

  if (!bundleData) return null;

  return (
    <div className="w-64 md:w-4/6 mx-4">
      <div className="overflow-x-auto whitespace-nowrap h-12 border-b mb-2">
        <div className="flex space-x-4 items-center">
          <div>
            <span className="text-xs">{t("bundle.department")}: </span>
            <span className="text-xs font-bold">{bundleData.department}</span>
          </div>
          <div>
            <span className="text-xs">{t("bundle.mono")}: </span>
            <span className="text-xs font-bold">{bundleData.selectedMono}</span>
          </div>
          <div>
            <span className="text-xs">{t("bundle.customer_style")}: </span>
            <span className="text-xs font-bold">{bundleData.custStyle}</span>
          </div>
          <div>
            <span className="text-xs">{t("bundle.color")}: </span>
            <span className="text-xs font-bold">{bundleData.color}</span>
          </div>
          <div>
            <span className="text-xs">{t("bundle.size")}: </span>
            <span className="text-xs font-bold">{bundleData.size}</span>
          </div>
          <div>
            <span className="text-xs">{t("bundle.line_no")}: </span>
            <span className="text-xs font-bold">{bundleData.lineNo}</span>
          </div>
          <div>
            <span className="text-xs">{t("bundle.package_no")}: </span>
            <span className="text-xs font-bold">{bundleData.package_no}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        {/* Checked Qty */}
        <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 items-center">
          <QrCode className="w-5 h-5 mr-2" />
          <div className="hidden md:block">
            <div className="text-xs">
              {isReturnInspection ? "Reject Garments" : "Checked Qty"}
            </div>
            <div className="text-xl font-bold">
              {isReturnInspection
                ? sessionData?.totalRejectGarmentCount
                : bundleData.passQtyIron}
            </div>
          </div>
          <div className="block md:hidden">
            <div className="text-xl font-bold">
              {isReturnInspection
                ? sessionData?.totalRejectGarmentCount
                : bundleData.passQtyIron}
            </div>
          </div>
        </div>
        {/* Total Pass */}
        <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          <div className="hidden md:block">
            <div className="text-xs">{t("dash.total_pass")}</div>
            <div className="text-xl font-bold text-green-600">{totalPass}</div>
          </div>
          <div className="block md:hidden">
            <div className="text-xl font-bold text-green-600">{totalPass}</div>
          </div>
        </div>
        {/* Total Rejects */}
        <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 items-center">
          <XCircle className="w-5 h-5 mr-2 text-red-600" />
          <div className="hidden md:block">
            <div className="text-xs">{t("dash.total_rejects")}</div>
            <div className="text-xl font-bold text-red-600">{totalRejects}</div>
          </div>
          <div className="block md:hidden">
            <div className="text-xl font-bold text-red-600">{totalRejects}</div>
          </div>
        </div>
        {/* Defect Qty */}
        <div className="flex md:flex-1 mx-1 bg-gray-100 rounded p-1 md:p-2 items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
          <div className="hidden md:block">
            <div className="text-xs">{t("qc2In.defect_qty")}</div>
            <div className="text-xl font-bold text-orange-600">{defectQty}</div>
          </div>
          <div className="block md:hidden">
            <div className="text-xl font-bold text-orange-600">{defectQty}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QC2InspectionDashboard;
