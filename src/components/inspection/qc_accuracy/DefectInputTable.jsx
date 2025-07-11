import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle } from "lucide-react";
import QADefectCard from "./QADefectCard"; // Use the new card component with the correct name

const DefectInputTable = ({
  defects,
  setDefects,
  availableDefects,
  standardDefects,
  buyer,
  uploadMetadata
}) => {
  const { t } = useTranslation();

  const handleAddPcs = () => {
    const nextPcsNo =
      defects.length > 0 ? Math.max(...defects.map((d) => d.pcsNo)) + 1 : 1;
    setDefects([
      ...defects,
      {
        pcsNo: nextPcsNo,
        defectCode: null,
        qty: 1,
        type: null,
        imageUrl: "",
        decision: "N/A",
        standardStatus: "",
        tempId: Date.now()
      }
    ]);
  };

  const handleAddDefectToPcs = (pcsNo) => {
    setDefects([
      ...defects,
      {
        pcsNo,
        defectCode: null,
        qty: 1,
        type: null,
        imageUrl: "",
        decision: "N/A",
        standardStatus: "",
        tempId: Date.now()
      }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const newDefects = [...defects];
    if (field === "defect") {
      const stdDefect = standardDefects.find((sd) => sd.code === value.code);
      const initialDecision = stdDefect?.decisions[0];
      newDefects[index] = {
        ...newDefects[index],
        defectCode: value.code,
        defectNameEng: value.english,
        defectNameKh: value.khmer,
        defectNameCh: value.chinese,
        type: value.selectedType,
        decision: initialDecision?.decisionEng || "N/A",
        standardStatus: initialDecision?.status || "Major",
        qty: 1
      };
    } else if (field === "clear") {
      newDefects[index] = {
        ...newDefects[index],
        defectCode: null,
        qty: 1,
        type: null,
        decision: "",
        standardStatus: ""
      };
    } else {
      newDefects[index][field] = value;
    }
    setDefects(newDefects);
  };

  const handleDelete = (indexToDelete) => {
    setDefects(defects.filter((_, index) => index !== indexToDelete));
  };

  const defectsByGarment = useMemo(() => {
    const groups = new Map();
    defects.forEach((defect) => {
      if (!groups.has(defect.pcsNo)) {
        groups.set(defect.pcsNo, []);
      }
      groups.get(defect.pcsNo).push(defect);
    });
    return Array.from(groups.values());
  }, [defects]);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {t("qcAccuracy.defectDetails", "Defect Details")}
        </h3>
        <button
          onClick={handleAddPcs}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <PlusCircle size={18} />
          {t("qcAccuracy.addPcs", "Add New Garment")}
        </button>
      </div>

      {defects.length === 0 ? (
        <div className="p-4 text-center text-gray-500 italic border rounded-lg dark:border-gray-700">
          {t(
            "qcAccuracy.noDefectsAdded",
            'No defects added. Click "Add New Garment" to start.'
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {defects.map((defect, index) => {
            const defectsForThisPcs = defects.filter(
              (d) => d.pcsNo === defect.pcsNo
            );
            const usedCodesForThisPcs = new Set(
              defectsForThisPcs.map((d) => d.defectCode).filter(Boolean)
            );

            const availableDefectsForThisRow = availableDefects.filter(
              (d) =>
                !usedCodesForThisPcs.has(d.code) || d.code === defect.defectCode
            );

            const defectInPcs = defects.filter(
              (d) => d.pcsNo === defect.pcsNo && d.tempId <= defect.tempId
            ).length;

            return (
              <QADefectCard
                key={defect.tempId || index}
                defect={{ ...defect, defectInPcs }}
                rowIndex={index}
                availableDefects={availableDefectsForThisRow}
                standardDefects={standardDefects}
                buyer={buyer}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                uploadMetadata={uploadMetadata}
              />
            );
          })}
        </div>
      )}

      {defectsByGarment.length > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Add More Defects to an Existing Garment
          </h4>
          <div className="flex flex-wrap gap-2">
            {defectsByGarment.map((group) => (
              <button
                key={group[0].pcsNo}
                onClick={() => handleAddDefectToPcs(group[0].pcsNo)}
                className="flex items-center gap-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-3 py-1"
              >
                <PlusCircle size={14} />
                {t("qcAccuracy.addAnotherDefect", "Add to Garment {{pcsNo}}", {
                  pcsNo: group[0].pcsNo
                })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectInputTable;
