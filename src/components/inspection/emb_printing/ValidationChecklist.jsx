import React from "react";
import { useTranslation } from "react-i18next";

const ValidationChecklist = ({ checklist, onChecklistChange }) => {
  const { t } = useTranslation();

  const validationItems = [
    {
      key: "orderType",
      label: t("sccEMBReport.orderType", "Order Type"),
      options: [
        { value: "New Order", label: "New Order" },
        { value: "New Repeat", label: "New Repeat" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "samplesAvailable",
      label: t("sccEMBReport.samplesAvailable", "Samples Available"),
      options: [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "labAnalysisTesting",
      label: t("sccEMBReport.labAnalysisTesting", "Lab Analysis & Testing"),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "masterCartonRequirements",
      label: t(
        "sccEMBReport.masterCartonRequirements",
        "Master Carton Requirements"
      ),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "dropTest",
      label: t("sccEMBReport.dropTest", "Drop Test"),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "price",
      label: t("sccEMBReport.price", "Price"),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "hangTags",
      label: t("sccEMBReport.hangTags", "Hang Tags"),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "labels",
      label: t("sccEMBReport.labels", "Labels"),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
    {
      key: "composition",
      label: t("sccEMBReport.composition", "Composition"),
      options: [
        { value: "Conform", label: "Conform" },
        { value: "Non-Conform", label: "Non-Conform" },
        { value: "N/A", label: "N/A" },
      ],
    },
  ];

  const handleChecklistClick = (key, value) => {
    onChecklistChange({
      ...checklist,
      [key]: value,
    });
  };

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold text-gray-700 mb-4">
        {t(
          "sccEMBReport.validationsAndChecklists",
          "Validations and Checklists"
        )}
      </h3>
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full divide-y divide-gray-200 text-sm">
          <tbody className="bg-white divide-y divide-gray-200">
            {validationItems.map((item) => (
              <tr
                key={item.key}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-700 w-1/3">
                  {item.label}
                </td>
                {item.options.map((option) => (
                  <td
                    key={option.value}
                    className="px-4 py-3 text-center border-l border-gray-200"
                  >
                    <button
                      type="button"
                      onClick={() => handleChecklistClick(item.key, option.value)}
                      className={`px-4 py-2 rounded-md font-medium transition-all ${
                        checklist?.[item.key] === option.value
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ValidationChecklist;

