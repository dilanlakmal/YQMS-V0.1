import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle } from "lucide-react";
import DefectRow from "./DefectRow";

const DefectInputTable = ({
  defects,
  setDefects,
  availableDefects,
  standardDefects, // <-- Receive new prop
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
        imageUrl: "", // Add imageUrl
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
        tempId: Date.now()
      }
    ]);
  };

  // --- FIX #5: UPDATE handleUpdate TO POPULATE NEW FIELDS ---
  const handleUpdate = (index, field, value) => {
    const newDefects = [...defects];
    if (field === "defect") {
      // Find the corresponding standard defect
      const stdDefect = standardDefects.find((sd) => sd.code === value.code);
      const initialDecision = stdDefect?.decisions[0];

      newDefects[index] = {
        ...newDefects[index],
        defectCode: value.code,
        defectNameEng: value.english,
        defectNameKh: value.khmer,
        defectNameCh: value.chinese,
        type: value.selectedType, // Buyer-specific type
        decision: initialDecision?.decisionEng || "N/A", // Set initial decision
        standardStatus: initialDecision?.status || "Major", // Set initial standard status
        qty: 1
      };
    } else if (field === "clear") {
      newDefects[index] = {
        ...newDefects[index],
        defectCode: null,
        qty: 1,
        type: null,
        decision: "", // Clear fields
        standardStatus: ""
      };
    } else {
      newDefects[index][field] = value;
    }
    setDefects(newDefects);
  };

  // const handleUpdate = (index, field, value) => {
  //   const newDefects = [...defects];
  //   if (field === "defect") {
  //     newDefects[index] = {
  //       ...newDefects[index],
  //       defectCode: value.code,
  //       defectNameEng: value.english,
  //       defectNameKh: value.khmer,
  //       defectNameCh: value.chinese,
  //       type: value.selectedType,
  //       qty: 1
  //     };
  //   } else if (field === "clear") {
  //     newDefects[index] = {
  //       ...newDefects[index],
  //       defectCode: null,
  //       qty: 1,
  //       type: null
  //     };
  //   } else {
  //     newDefects[index][field] = value;
  //   }
  //   setDefects(newDefects);
  // };

  const handleDelete = (indexToDelete) => {
    setDefects(defects.filter((_, index) => index !== indexToDelete));
  };

  const groupedDefects = useMemo(() => {
    const groups = new Map();
    defects.forEach((defect, index) => {
      if (!groups.has(defect.pcsNo)) {
        groups.set(defect.pcsNo, []);
      }
      groups.get(defect.pcsNo).push({ ...defect, originalIndex: index });
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
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusCircle size={18} />
          {t("qcAccuracy.addPcs", "Add Pcs")}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="p-3 w-20 text-center">
                {t("qcAccuracy.pcsNo", "Pcs No")}
              </th>
              <th scope="col" className="p-3">
                {t("qcAccuracy.defectName", "Defect Name")}
              </th>

              {/* --- FIX #5: ADD NEW HEADERS --- */}
              <th scope="col" className="p-3 w-48 text-center">
                Decision
              </th>

              <th scope="col" className="p-3 w-32 text-center">
                {t("qcAccuracy.qty", "Qty")}
              </th>
              <th scope="col" className="p-3 w-40">
                {t("qcAccuracy.type", "Type")}
              </th>
              <th scope="col" className="p-3 w-40">
                Standard Status
              </th>
              {/* --- NEW IMAGE HEADER --- */}
              <th scope="col" className="p-3 w-24 text-center">
                {t("qcAccuracy.image", "Image")}
              </th>
              <th scope="col" className="p-3 w-20 text-center">
                {t("qcAccuracy.action", "Action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {defects.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-4 text-center text-gray-500 dark:text-gray-400 italic"
                >
                  {t(
                    "qcAccuracy.noDefectsAdded",
                    'No defects added. Click "Add Pcs" to start.'
                  )}
                </td>
              </tr>
            ) : (
              groupedDefects.map((group, groupIndex) => (
                <React.Fragment key={group[0].pcsNo}>
                  {group.map((defect, defectInGroupIndex) => {
                    const usedCodesForThisPcs = new Set(
                      group.map((d) => d.defectCode).filter(Boolean)
                    );
                    const availableDefectsForThisRow = availableDefects.filter(
                      (d) =>
                        !usedCodesForThisPcs.has(d.code) ||
                        d.code === defect.defectCode
                    );

                    return (
                      <DefectRow
                        key={defect.tempId || defect.originalIndex}
                        defect={defect}
                        rowIndex={defect.originalIndex}
                        availableDefects={availableDefectsForThisRow}
                        standardDefects={standardDefects} // <-- Pass full list to row
                        buyer={buyer}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        uploadMetadata={uploadMetadata} // Pass metadata down
                      />
                    );
                  })}
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td
                      colSpan="5"
                      className="p-1 border-t dark:border-gray-600"
                    >
                      <button
                        onClick={() => handleAddDefectToPcs(group[0].pcsNo)}
                        className="w-full text-xs flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded p-1"
                      >
                        <PlusCircle size={14} />
                        {t(
                          "qcAccuracy.addAnotherDefect",
                          "Add Another Defect to Pcs {{pcsNo}}",
                          { pcsNo: group[0].pcsNo }
                        )}
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DefectInputTable;
