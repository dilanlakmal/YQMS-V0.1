// src/components/inspection/cutting/report/ReportSizeDetail.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import ReportCuttingIssues from "./ReportCuttingIssues";
import ReportDefectTable from "./ReportDefectTable";
import ReportMeasurementDataTable from "./ReportMeasurementDataTable";
import ReportSizeSummaryTable from "./ReportSizeSummaryTable";

const ReportSizeDetail = ({ inspectionDataEntry }) => {
  const { t } = useTranslation();

  if (!inspectionDataEntry) return null;

  const { inspectedSize, bundleInspectionData, tolerance, cuttingDefects } =
    inspectionDataEntry;

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg shadow">
      <h3 className="text-xl font-bold text-blue-700 mb-4">
        {t("cutting.inspectionDetailSummaryBySize")}: {inspectedSize}
      </h3>

      <ReportSizeSummaryTable
        bundleInspectionData={bundleInspectionData}
        inspectedSize={inspectedSize}
      />

      {bundleInspectionData?.map((bundle) => (
        <div key={bundle.bundleNo} className="mt-4 p-3 border-t border-dashed">
          {bundle.measurementInsepctionData?.map((partData) => (
            <div key={partData.partName} className="mb-3">
              <ReportMeasurementDataTable
                partData={partData}
                bundleNo={bundle.bundleNo}
                tolerance={tolerance}
              />
              <ReportDefectTable
                partData={partData}
                bundleNo={bundle.bundleNo}
              />
            </div>
          ))}
        </div>
      ))}

      <ReportCuttingIssues cuttingDefects={cuttingDefects} />
    </div>
  );
};

export default ReportSizeDetail;
