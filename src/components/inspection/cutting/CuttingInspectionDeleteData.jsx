// src/components/inspection/cutting/CuttingInspectionDeleteData.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Trash2, Loader2 } from "lucide-react";

const CuttingInspectionDeleteData = ({
  inspectionRecord,
  onRecordDeleted,
  onSizeDeleted
}) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState({ record: false, size: null });

  if (!inspectionRecord) {
    // This case should ideally be handled by the parent,
    // but as a safeguard if it's somehow rendered with no record:
    return (
      <div className="mt-6 pt-6 border-t border-gray-300 text-center text-gray-500">
        {t(
          "cuttingReport.noRecordSelectedForDelete",
          "No record selected to display delete options."
        )}
      </div>
    );
  }

  const handleDeleteEntireRecord = async () => {
    Swal.fire({
      title: t("cuttingReport.confirmDeleteEntireTitle"),
      text: t("cuttingReport.confirmDeleteEntireMsg"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("cutting.yesDeleteIt"),
      cancelButtonText: t("cutting.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting({ record: true, size: null });
        try {
          await axios.delete(
            `${API_BASE_URL}/api/cutting-inspection-record/${inspectionRecord._id}`
          );
          Swal.fire({
            icon: "success",
            title: t("cutting.deleted"),
            text: t("cuttingReport.recordDeletedSuccess")
          });
          if (onRecordDeleted) onRecordDeleted();
        } catch (error) {
          console.error("Error deleting entire record:", error);
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text:
              error.response?.data?.message ||
              t("cuttingReport.failedToDeleteRecord")
          });
        } finally {
          setIsDeleting({ record: false, size: null });
        }
      }
    });
  };

  const handleDeleteSpecificSize = async (inspectedSizeToDelete) => {
    Swal.fire({
      title: t("cuttingReport.confirmDeleteSizeTitle"),
      text: t("cuttingReport.confirmDeleteSizeMsg", {
        size: inspectedSizeToDelete
      }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("cutting.yesDeleteIt"),
      cancelButtonText: t("cutting.cancel")
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsDeleting({ record: false, size: inspectedSizeToDelete });
        try {
          await axios.delete(
            `${API_BASE_URL}/api/cutting-inspection-record/${inspectionRecord._id}/size/${inspectedSizeToDelete}`
          );
          Swal.fire({
            icon: "success",
            title: t("cutting.deleted"),
            text: t("cuttingReport.sizeDataDeletedSuccess", {
              size: inspectedSizeToDelete
            })
          });
          if (onSizeDeleted) onSizeDeleted();
        } catch (error) {
          console.error(`Error deleting size ${inspectedSizeToDelete}:`, error);
          Swal.fire({
            icon: "error",
            title: t("cutting.error"),
            text:
              error.response?.data?.message ||
              t("cuttingReport.failedToDeleteSizeData", {
                size: inspectedSizeToDelete
              })
          });
        } finally {
          setIsDeleting({ record: false, size: null });
        }
      }
    });
  };

  return (
    <div className="mt-6">
      {" "}
      {/* Removed pt-6 border-t, parent can handle separation */}
      {/* ** REINTEGRATED: Inspection Record Details Table ** */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-slate-50">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {t("cuttingReport.recordDetailsTitle")}
        </h2>
        <div className="overflow-x-auto shadow rounded-md">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "inspectionDate",
                  "qcId",
                  "garmentType",
                  "moNo",
                  "tableNo",
                  "color",
                  "buyer",
                  "lotNoCount",
                  "totalBundleQty",
                  "bundleQtyCheck",
                  "totalInspectionQty",
                  "cuttingType",
                  "inspectionDetailsSummary"
                ].map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    {t(`cuttingReport.table.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.inspectionDate}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.cutting_emp_id}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.garmentType}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.moNo}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.tableNo}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.color}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.buyer}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                  {inspectionRecord.lotNo?.length || 0}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                  {inspectionRecord.totalBundleQty}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                  {inspectionRecord.bundleQtyCheck}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                  {inspectionRecord.totalInspectionQty}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {inspectionRecord.cuttingtype}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <div>
                    {inspectionRecord.inspectionData?.length || 0}{" "}
                    {t("cuttingReport.sizesChecked")}
                  </div>
                  {(inspectionRecord.inspectionData || []).map((inspData) => (
                    <div
                      key={inspData.inspectedSize}
                      className="text-xs text-gray-600"
                    >
                      - {t("cuttingReport.sizeLabel")} {inspData.inspectedSize}:{" "}
                      {inspData.bundleQtyCheckSize} {t("cuttingReport.bundles")}
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Options Section */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          {t("cuttingReport.deleteOptionsTitle")}
        </h3>
        <div className="space-y-6">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="text-md font-medium text-red-800 mb-2">
              {t("cuttingReport.option1Title")}
            </h4>
            <p className="text-xs text-red-700 mb-3">
              {t("cuttingReport.option1Description")}
            </p>
            <button
              onClick={handleDeleteEntireRecord}
              disabled={isDeleting.record || isDeleting.size !== null}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              {isDeleting.record ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Trash2 size={18} className="mr-2" />
              )}
              {t("cuttingReport.deleteEntireButton")}
            </button>
          </div>

          {inspectionRecord.inspectionData &&
            inspectionRecord.inspectionData.length > 0 && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <h4 className="text-md font-medium text-orange-800 mb-3">
                  {t("cuttingReport.option2Title")}
                </h4>
                <ul className="space-y-2">
                  {(inspectionRecord.inspectionData || []).map((inspSize) => (
                    <li
                      key={inspSize.inspectedSize}
                      className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-md shadow-sm"
                    >
                      <span className="text-sm text-gray-800">
                        {t("cuttingReport.sizeLabel")}:{" "}
                        <strong className="font-medium">
                          {inspSize.inspectedSize}
                        </strong>
                        <span className="text-xs text-gray-500 ml-2">
                          ({inspSize.bundleQtyCheckSize}{" "}
                          {t("cuttingReport.bundles")})
                        </span>
                      </span>
                      <button
                        onClick={() =>
                          handleDeleteSpecificSize(inspSize.inspectedSize)
                        }
                        disabled={
                          isDeleting.size === inspSize.inspectedSize ||
                          isDeleting.record
                        }
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                        title={t("cuttingReport.deleteThisSizeData")}
                      >
                        {isDeleting.size === inspSize.inspectedSize ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CuttingInspectionDeleteData;
