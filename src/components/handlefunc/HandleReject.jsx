import { useEffect } from "react";
import FormatTime from "../formatting/FormatTime";
import SaveQCDataToBackend from "../api/SaveQCDataToBackend"; // Import SaveQCDataToBackend

const HandleReject = ({
  isPlaying,
  currentDefectCount,
  checkedQuantity,
  defectPieces,
  defects,
  onLogEntry,
  timer,
}) => {
  const handleReject = async () => {
    if (
      !isPlaying ||
      !Object.values(currentDefectCount).some((count) => count > 0)
    )
      return;

    const currentTime = new Date();
    const timestamp = timer;

    const newCheckedQuantity = checkedQuantity + 1;
    const newDefectPieces = defectPieces + 1;

    // Calculate the total defects for this rejection
    const totalDefectsForThisRejection = Object.values(
      currentDefectCount
    ).reduce((sum, count) => sum + count, 0);

    // Prepare defect details for logging
    const currentDefects = Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .map(([index, count]) => ({
        name: defectsList["english"][index].name,
        count,
        timestamp: timer,
        actualtime: currentTime.getTime(),
      }));

    // Prepare data for onLogEntry
    const logEntryData = {
      type: "reject",
      garmentNo: newCheckedQuantity,
      status: "Reject",
      defectDetails: currentDefects,
      timestamp: timer,
      actualtime: currentTime.getTime(),
      cumulativeChecked: newCheckedQuantity,
      cumulativeDefects:
        Object.values(defects).reduce((sum, count) => sum + count, 0) +
        totalDefectsForThisRejection,
    };

    // Call onLogEntry
    onLogEntry?.(logEntryData);

    // Merge defects and currentDefectCount to create defectArray
    const defectArray = Object.entries(defects).map(([index, count]) => ({
      name: defectsList["english"][index].name, // Defect name in English
      count: count + (currentDefectCount[index] || 0), // Cumulative count including current entry
    }));

    // Add defects from currentDefectCount that are not in defects
    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (!defects[index]) {
        defectArray.push({
          name: defectsList["english"][index].name, // Defect name in English
          count: count, // Current count for this defect
        });
      }
    });

    // Ensure defect names are unique and sum counts for duplicates
    const mergedDefectArray = defectArray.reduce((acc, defect) => {
      const existingDefect = acc.find((d) => d.name === defect.name);
      if (existingDefect) {
        existingDefect.count += defect.count; // Sum counts for the same defect name
      } else {
        acc.push(defect); // Add new defect to the array
      }
      return acc;
    }, []);

    // Prepare data for MongoDB
    const qcData = {
      ...logEntryData, // Use the same data as onLogEntry
      checkedQty: 1,
      goodOutput: 0, // No change for reject
      defectQty: totalDefectsForThisRejection, // Sum of selected defect counts for this entry
      defectPieces: 1, // Increment defect pieces for this entry
      defectArray: mergedDefectArray, // Include the merged defect array
      cumulativeChecked: newCheckedQuantity,
      cumulativeDefects:
        Object.values(defects).reduce((sum, count) => sum + count, 0) +
        totalDefectsForThisRejection,
      cumulativeGoodOutput: goodOutput, // Cumulative good output
      cumulativeDefectPieces: newDefectPieces, // Cumulative defect pieces
      returnDefectList: [], // Empty for pass
      returnDefectArray: [], // Maintain the same state as previous record
      returnDefectQty: 0, // Current entry
      cumulativeReturnDefectQty: 0, // Cumulative return defect quantity
    };

    // Save to MongoDB using the SaveQCDataToBackend component
    try {
      await SaveQCDataToBackend(qcData);
    } catch (error) {
      console.error("Error in HandleReject:", error);
    }

    // Update state (if needed)
    return {
      checkedQuantity: newCheckedQuantity,
      defectPieces: newDefectPieces,
      defects: mergedDefectArray,
    };
  };

  return (
    <button
      onClick={handleReject}
      disabled={
        !isPlaying ||
        !Object.values(currentDefectCount).some((count) => count > 0)
      }
      className={`w-full h-full py-0 rounded font-medium ${
        isPlaying &&
        Object.values(currentDefectCount).some((count) => count > 0)
          ? "bg-red-500 text-white"
          : "bg-gray-300 text-gray-600"
      }`}
    >
      Reject
    </button>
  );
};

export default HandleReject;
