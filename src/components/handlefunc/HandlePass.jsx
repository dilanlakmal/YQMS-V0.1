import { useEffect } from "react";
import FormatTime from "../formatting/FormatTime";
import SaveQCDataToBackend from "../api/SaveQCDataToBackend"; // Import SaveQCDataToBackend

const HandlePass = ({
  isPlaying,
  hasDefectSelected,
  checkedQuantity,
  goodOutput,
  defects,
  onLogEntry,
  timer,
}) => {
  const handlePass = async () => {
    if (!isPlaying || hasDefectSelected) return;

    const currentTime = new Date();

    const newCheckedQuantity = checkedQuantity + 1;
    const newGoodOutput = goodOutput + 1;

    // Prepare data for onLogEntry
    const logEntryData = {
      type: "pass",
      garmentNo: newCheckedQuantity,
      status: "Pass",
      timestamp: timer,
      actualtime: currentTime.getTime(),
      defectDetails: [],
    };

    // Call onLogEntry
    onLogEntry?.(logEntryData);

    // Prepare defect array with cumulative counts
    const defectArray = Object.entries(defects).map(([index, count]) => ({
      name: defectsList["english"][index].name, // Defect name in English
      count: count, // Cumulative count for this defect
    }));

    // Prepare data for MongoDB
    const qcData = {
      ...logEntryData, // Use the same data as onLogEntry
      checkedQty: 1,
      goodOutput: 1,
      defectQty: 0,
      defectPieces: 0,
      defectArray: defectArray, // Include the defect array
      cumulativeChecked: newCheckedQuantity,
      cumulativeDefects: Object.values(defects).reduce(
        (sum, count) => sum + count,
        0
      ),
      cumulativeGoodOutput: newGoodOutput, // Cumulative good output
      cumulativeDefectPieces: defectPieces, // Cumulative defect pieces
      returnDefectList: [], // Empty for pass
      returnDefectArray: [], // Maintain the same state as previous record
      returnDefectQty: 0, // Current entry
      cumulativeReturnDefectQty: 0, // Cumulative return defect quantity
    };

    // Save to MongoDB using the SaveQCDataToBackend component
    try {
      await SaveQCDataToBackend(qcData);
    } catch (error) {
      console.error("Error in HandlePass:", error);
    }

    // Update state (if needed)
    return {
      checkedQuantity: newCheckedQuantity,
      goodOutput: newGoodOutput,
    };
  };

  return (
    <button
      onClick={handlePass}
      disabled={!isPlaying || hasDefectSelected}
      className={`w-full h-full py-0 rounded font-medium ${
        isPlaying && !hasDefectSelected
          ? "bg-green-500 text-white"
          : "bg-gray-300 text-gray-600"
      }`}
    >
      Pass
    </button>
  );
};

export default HandlePass;
