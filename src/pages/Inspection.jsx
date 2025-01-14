import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import fs from "fs"; // Node.js file system module
import Header from "../components/inspection/Header";
import ViewToggle from "../components/inspection/ViewToggle";
import DefectsList from "../components/inspection/DefectsList";
import Summary from "../components/inspection/Summary";
import PlayPauseButton from "../components/inspection/PlayPauseButton";
import PreviewModal from "../components/inspection/PreviewModal";
import { defectsList } from "../constants/defects";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import FormatTime from "../components/formatting/FormatTime";
import HandleDownloadPDF from "../components/handlefunc/HandleDownloadPDF"; // Import the new component
import HandlePass from "../components/handlefunc/HandlePass"; // Import HandlePass
import HandleReject from "../components/handlefunc/HandleReject"; // Import HandleReject

function Inspection({
  savedState,
  onStateChange,
  onLogEntry,
  onStartTime,
  onSubmit,
  timer,
  isPlaying,
  onPlayPause,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState(savedState?.view || "list");
  const [language, setLanguage] = useState(savedState?.language || "english");
  const [defects, setDefects] = useState(savedState?.defects || {});
  const [currentDefectCount, setCurrentDefectCount] = useState(
    savedState?.currentDefectCount || {}
  );
  const [checkedQuantity, setCheckedQuantity] = useState(
    savedState?.checkedQuantity || 0
  );
  const [goodOutput, setGoodOutput] = useState(savedState?.goodOutput || 0);
  const [defectPieces, setDefectPieces] = useState(
    savedState?.defectPieces || 0
  );
  const [returnDefectQty, setReturnDefectQty] = useState(
    savedState?.returnDefectQty || 0
  );
  const [hasDefectSelected, setHasDefectSelected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!savedState?.inspectionData) {
      navigate("/details");
    }
  }, [savedState, navigate]);

  useEffect(() => {
    onStateChange?.({
      ...savedState,
      defects,
      currentDefectCount,
      checkedQuantity,
      goodOutput,
      defectPieces,
      returnDefectQty,
      language,
      view,
      hasDefectSelected,
    });
  }, [
    defects,
    currentDefectCount,
    checkedQuantity,
    goodOutput,
    defectPieces,
    returnDefectQty,
    language,
    view,
    hasDefectSelected,
  ]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const saveQCDataToBackend = async (qcData) => {
    try {
      const response = await fetch("http://localhost:5001/api/save-qc-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qcData),
      });

      if (!response.ok) {
        throw new Error("Failed to save QC data");
      }

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error("Error saving QC data:", error);
    }
  };

  const handlePass = () => {
    if (!isPlaying || hasDefectSelected) return;

    const currentTime = new Date();

    setCheckedQuantity((prev) => prev + 1);
    setGoodOutput((prev) => prev + 1);

    // Prepare data for onLogEntry (unchanged)
    const logEntryData = {
      type: "pass",
      garmentNo: checkedQuantity + 1,
      status: "Pass",
      timestamp: timer,
      actualtime: currentTime.getTime(),
      defectDetails: [],
    };

    // Call onLogEntry (unchanged)
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
      cumulativeChecked: checkedQuantity + 1,
      cumulativeDefects: Object.values(defects).reduce(
        (sum, count) => sum + count,
        0
      ),
      cumulativeGoodOutput: goodOutput + 1, // Cumulative good output
      cumulativeDefectPieces: defectPieces, // Cumulative defect pieces
      returnDefectList: [], // Empty for pass
      returnDefectArray: [], // Maintain the same state as previous record
      returnDefectQty: 0, // Current entry
      cumulativeReturnDefectQty: 0, // Cumulative return defect quantity
    };

    // Save to MongoDB
    saveQCDataToBackend(qcData);
  };

  const handleReject = () => {
    if (
      !isPlaying ||
      !Object.values(currentDefectCount).some((count) => count > 0)
    )
      return;

    const currentTime = new Date();
    const timestamp = timer;

    setCheckedQuantity((prev) => prev + 1);
    setDefectPieces((prev) => prev + 1);

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

    // Prepare data for onLogEntry (unchanged)
    const logEntryData = {
      type: "reject",
      garmentNo: checkedQuantity + 1,
      status: "Reject",
      defectDetails: currentDefects,
      timestamp: timer,
      actualtime: currentTime.getTime(),
      cumulativeChecked: checkedQuantity + 1,
      cumulativeDefects:
        Object.values(defects).reduce((sum, count) => sum + count, 0) +
        totalDefectsForThisRejection,
    };

    // Call onLogEntry (unchanged)
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
      cumulativeChecked: checkedQuantity + 1,
      cumulativeDefects:
        Object.values(defects).reduce((sum, count) => sum + count, 0) +
        totalDefectsForThisRejection,
      cumulativeGoodOutput: goodOutput, // Cumulative good output
      cumulativeDefectPieces: defectPieces + 1, // Cumulative defect pieces
      returnDefectList: [], // Empty for pass
      returnDefectArray: [], // Maintain the same state as previous record
      returnDefectQty: 0, // Current entry
      cumulativeReturnDefectQty: 0, // Cumulative return defect quantity
    };

    // Save to MongoDB
    saveQCDataToBackend(qcData);

    // Update the defects state with the temporary counts
    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (count > 0) {
        setDefects((prev) => ({
          ...prev,
          [index]: (prev[index] || 0) + count,
        }));
      }
    });

    // Reset the temporary defect counts
    setCurrentDefectCount({});
  };

  const handleSubmit = () => {
    onSubmit();
    navigate("/details");
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="inspection-content">
        <div className="fixed top-16 left-0 right-0 bg-white z-40">
          <div className="max-w-8xl mx-auto px-4 pt-2 pb-0">
            <Header inspectionData={savedState?.inspectionData} />
          </div>
        </div>

        <div className="fixed top-28 left-0 right-0 bg-white shadow-md z-20">
          <div className="max-w-8xl mx-auto px-4 pt-2 pb-1 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ViewToggle
                view={view}
                onViewChange={setView}
                onLanguageChange={setLanguage}
              />
              <PlayPauseButton
                isPlaying={isPlaying}
                onToggle={onPlayPause}
                timer={timer} //{formatTime(timer)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-400 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faEye} size="lg" />
              </button>

              <HandleDownloadPDF
                savedState={savedState}
                defects={defects}
                checkedQuantity={checkedQuantity}
                goodOutput={goodOutput}
                defectPieces={defectPieces}
                language={language}
                defectsList={defectsList} // Pass defectsList as a prop
              />

              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto px-4 pt-14 pb-52">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2 flex items-center justify-center">
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
            </div>
            <div className="col-span-8">
              <DefectsList
                view={view}
                language={language}
                defects={defects}
                currentDefectCount={currentDefectCount}
                onDefectUpdate={(index, value) => {
                  setDefects((prev) => ({ ...prev, [index]: value }));
                }}
                onCurrentDefectUpdate={(index, value) => {
                  setCurrentDefectCount((prev) => ({
                    ...prev,
                    [index]: value,
                  }));
                }}
                onLogEntry={onLogEntry}
                isPlaying={isPlaying}
                onDefectSelect={setHasDefectSelected}
              />
            </div>

            <div className="col-span-2 flex items-center justify-center">
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
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-8xl mx-auto px-4 py-4">
          <div className="summary-content">
            <Summary
              defects={defects}
              checkedQuantity={checkedQuantity}
              goodOutput={goodOutput}
              defectPieces={defectPieces}
              returnDefectQty={returnDefectQty}
            />
          </div>
        </div>
      </div>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        inspectionData={savedState?.inspectionData}
        defects={defects}
        checkedQuantity={checkedQuantity}
        goodOutput={goodOutput}
        defectPieces={defectPieces}
        returnDefectQty={returnDefectQty}
        language={language}
      />
    </div>
  );
}

export default Inspection;
