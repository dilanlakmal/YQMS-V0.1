import { PlusCircle } from "lucide-react";
import React, { useMemo } from "react";
import SubConQADefectCard from "./SubConQADefectCard";

const DefectInputSection = ({
  defects,
  setDefects,
  uploadMetadata,
  standardDefects
}) => {
  const handleAddPcs = () => {
    const nextPcsNo =
      defects.length > 0 ? Math.max(...defects.map((d) => d.pcsNo)) + 1 : 1;
    setDefects([
      ...defects,
      {
        pcsNo: nextPcsNo,
        defectCode: null,
        defectName: "",
        khmerName: "",
        chineseName: "",
        decision: "N/A",
        standardStatus: "Major",
        qty: 1,
        images: [],
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
        defectName: "",
        khmerName: "",
        chineseName: "",
        decision: "N/A",
        standardStatus: "Major",
        qty: 1,
        images: [],
        tempId: Date.now()
      }
    ]);
  };

  const handleUpdate = (tempId, updatedData) => {
    setDefects((prevDefects) =>
      prevDefects.map((d) =>
        d.tempId === tempId ? { ...d, ...updatedData } : d
      )
    );
  };

  const handleDelete = (tempIdToDelete) => {
    setDefects((prevDefects) =>
      prevDefects.filter((d) => d.tempId !== tempIdToDelete)
    );
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
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Defect Details</h3>
        <button
          onClick={handleAddPcs}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <PlusCircle size={18} /> Add New Garment
        </button>
      </div>

      {defects.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No defects added yet.</p>
          <p className="text-sm text-gray-400">
            Click "Add New Garment" to start.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {defects.map((defect) => {
            const defectsForThisPcs = defects.filter(
              (d) => d.pcsNo === defect.pcsNo
            );
            const usedCodesForThisPcs = new Set(
              defectsForThisPcs.map((d) => d.defectCode).filter(Boolean)
            );
            const defectInPcs = defects.filter(
              (d) => d.pcsNo === defect.pcsNo && d.tempId <= defect.tempId
            ).length;

            return (
              <SubConQADefectCard
                key={defect.tempId}
                defect={{ ...defect, defectInPcs }}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                uploadMetadata={uploadMetadata}
                existingDefectCodes={defectsForThisPcs}
                standardDefects={standardDefects}
              />
            );
          })}
        </div>
      )}
      {defectsByGarment.length > 0 && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-wrap gap-2">
            {defectsByGarment.map((group) => (
              <button
                key={group[0].pcsNo}
                onClick={() => handleAddDefectToPcs(group[0].pcsNo)}
                className="flex items-center gap-2 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-3 py-1"
              >
                <PlusCircle size={14} /> Add to Garment #{group[0].pcsNo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectInputSection;
