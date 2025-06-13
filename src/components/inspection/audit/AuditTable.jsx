import React from "react";
import { useTranslation } from "react-i18next";
import AuditTableRow from "./AuditTableRow"; // Ensure this path is correct

const AuditTable = ({
  auditData,
  onAuditDataChange,
  sectionEnabled,
  currentLang
}) => {
  const { t } = useTranslation();

  console.log(
    "AuditTable rendering, currentLang:",
    currentLang,
    "auditData length:",
    auditData.length
  );

  const handleUpdateRow = (index, updatedValues) => {
    const newData = auditData.map((item, i) =>
      i === index ? { ...item, ...updatedValues } : item
    );
    onAuditDataChange(newData);
  };

  return (
    <div className="overflow-x-auto mx-4 sm:mx-6 my-4 shadow-md rounded-lg">
      <table className="min-w-full border-collapse border border-gray-300 bg-white">
        <thead className="bg-gray-100 text-xs sticky top-0 z-10">
          <tr>
            <th className="border p-1.5 text-center" colSpan="3">
              {t("auditTable.requirement")}
            </th>
            <th className="border p-1.5 text-center">{t("auditTable.ok")}</th>
            <th className="border p-1.5 text-center">
              {t("auditTable.toImprove")}
            </th>
            <th className="border p-1.5 text-center">{t("auditTable.na")}</th>
            <th className="border p-1.5 text-center">
              {t("auditTable.observations")}
            </th>
            <th className="border p-1.5 text-center">
              {t("auditTable.images")}
            </th>
            <th className="border p-1.5 text-center">
              {t("auditTable.level")}
            </th>
            <th className="border p-1.5 text-center">
              {t("auditTable.mustHave")}
            </th>
            <th className="border p-1.5 text-center">
              {t("auditTable.score")}
            </th>
            <th className="border p-1.5 text-center">
              {t("auditTable.naScore")}
            </th>
          </tr>
          <tr>
            <th className="border p-1.5 text-center font-medium">
              {t("auditTable.mainTopic")}
            </th>
            <th className="border p-1.5 text-center font-medium">
              {t("auditTable.no")}
            </th>
            <th className="border p-1.5 text-center font-medium">
              {t("auditTable.points")}
            </th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
            <th className="border p-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {auditData.map((item, index) => (
            <AuditTableRow
              key={item.uniqueId || item.no || index}
              item={item}
              index={index}
              onUpdate={handleUpdateRow}
              sectionEnabled={sectionEnabled}
              currentLang={currentLang}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;
