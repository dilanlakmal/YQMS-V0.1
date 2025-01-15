import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/inspection/Header";
import ViewToggle from "../components/inspection/ViewToggle";
import DefectsList from "../components/inspection/DefectsList";
import Summary from "../components/inspection/Summary";
import PlayPauseButton from "../components/inspection/PlayPauseButton";
import PreviewModal from "../components/inspection/PreviewModal";
import { defectsList } from "../constants/defects";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import HandleDownloadPDF from "../components/handlefunc/HandleDownloadPDF";
import FormatTime from "../components/formatting/FormatTime";
import { formatTimeString } from "../components/formatting/FormatedTime";

function Inspection({
  savedState,
  onStateChange,
  onLogEntry,
  onStartTime,
  onSubmit,
  timer,
  isPlaying,
  onPlayPause,
  sharedState = {},
  onUpdateSharedState = () => {},
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
    language,
    view,
    hasDefectSelected,
  ]);

  // Convert the date field to an ISO string
  const headerData = {
    ...savedState?.inspectionData,
    date:
      savedState?.inspectionData?.date instanceof Date
        ? savedState.inspectionData.date.toISOString()
        : savedState?.inspectionData?.date,
  };

  const saveQCDataToBackend = async (qcData) => {
    try {
      console.log("Sending QC Data to Backend:", qcData); // Debugging line
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
      console.log("Response from backend:", result); // Debugging line
    } catch (error) {
      console.error("Error saving QC data:", error);
    }
  };

  const handlePass = () => {
    if (!isPlaying || hasDefectSelected) return;

    // console.log("Header Data (Pass):", savedState?.inspectionData); // Debugging line

    const currentTime = new Date();
    const newCheckedQuantity = checkedQuantity + 1;
    const newGoodOutput = goodOutput + 1;

    // Update shared state
    onUpdateSharedState({
      cumulativeChecked: newCheckedQuantity,
      cumulativeGoodOutput: newGoodOutput,
      cumulativeDefects: Object.values(defects).reduce(
        (sum, count) => sum + count,
        0
      ),
      cumulativeDefectPieces: defectPieces,
    });

    const qcData = {
      headerData,
      type: "pass",
      garmentNo: newCheckedQuantity,
      status: "Pass",
      timestamp: timer,
      actualtime: currentTime.getTime(),
      formattedTimestamp: FormatTime({ seconds: timer }),
      formattedActualTime: formatTimeString(currentTime.getTime()),
      defectDetails: [],
      checkedQty: 1,
      goodOutput: 1,
      defectQty: 0,
      defectPieces: 0,
      defectArray: Object.entries(defects).map(([index, count]) => ({
        name: defectsList["english"][index].name,
        count: count,
      })),
      cumulativeChecked: newCheckedQuantity,
      cumulativeDefects: Object.values(defects).reduce(
        (sum, count) => sum + count,
        0
      ),
      cumulativeGoodOutput: newGoodOutput,
      cumulativeDefectPieces: defectPieces,
      returnDefectList: [],
      returnDefectArray: sharedState.returnDefectArray || [],
      returnDefectQty: 0,
      cumulativeReturnDefectQty: sharedState.cumulativeReturnDefectQty || 0,
    };

    // console.log("QC Data to be sent:", qcData); // Debugging line

    saveQCDataToBackend(qcData);
    setCheckedQuantity(newCheckedQuantity);
    setGoodOutput(newGoodOutput);
    onLogEntry?.(qcData);
  };

  const handleReject = () => {
    if (
      !isPlaying ||
      !Object.values(currentDefectCount).some((count) => count > 0)
    )
      return;

    const currentTime = new Date();
    const newCheckedQuantity = checkedQuantity + 1;
    const totalDefectsForThisRejection = Object.values(
      currentDefectCount
    ).reduce((sum, count) => sum + count, 0);
    const newDefectPieces = defectPieces + 1;

    // Create current defects array
    const currentDefects = Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .map(([index, count]) => ({
        name: defectsList["english"][index].name,
        count,
        timestamp: timer,
        actualtime: currentTime.getTime(),
      }));

    // Create a map of all defects (previous + current) by defect name
    const defectMap = new Map();

    // Add previous defects to the map
    Object.entries(defects).forEach(([index, count]) => {
      const defectName = defectsList["english"][index].name;
      defectMap.set(defectName, (defectMap.get(defectName) || 0) + count);
    });

    // Add current defects to the map
    Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .forEach(([index, count]) => {
        const defectName = defectsList["english"][index].name;
        defectMap.set(defectName, (defectMap.get(defectName) || 0) + count);
      });

    // Convert map to array format
    const mergedDefectArray = Array.from(defectMap.entries()).map(
      ([name, count]) => ({
        name,
        count,
      })
    );

    // Calculate total defects including current rejection
    const totalDefects =
      Object.values(defects).reduce((sum, count) => sum + count, 0) +
      totalDefectsForThisRejection;

    // Update shared state with current values
    onUpdateSharedState({
      cumulativeChecked: newCheckedQuantity,
      cumulativeDefects: totalDefects,
      cumulativeGoodOutput: goodOutput,
      cumulativeDefectPieces: newDefectPieces,
      defectArray: mergedDefectArray,
      currentDefectQty: totalDefects,
    });

    const qcData = {
      headerData,
      type: "reject",
      garmentNo: newCheckedQuantity,
      status: "Reject",
      defectDetails: currentDefects,
      timestamp: timer,
      actualtime: currentTime.getTime(),
      formattedTimestamp: FormatTime({ seconds: timer }),
      formattedActualTime: formatTimeString(currentTime.getTime()),
      checkedQty: 1,
      goodOutput: 0,
      defectQty: totalDefectsForThisRejection,
      defectPieces: 1,
      defectArray: mergedDefectArray,
      cumulativeChecked: newCheckedQuantity,
      cumulativeDefects: totalDefects,
      cumulativeGoodOutput: goodOutput,
      cumulativeDefectPieces: newDefectPieces,
      returnDefectList: [],
      returnDefectArray: sharedState.returnDefectArray || [],
      returnDefectQty: 0,
      cumulativeReturnDefectQty: sharedState.cumulativeReturnDefectQty || 0,
    };

    saveQCDataToBackend(qcData);
    setCheckedQuantity(newCheckedQuantity);
    setDefectPieces(newDefectPieces);

    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (count > 0) {
        setDefects((prev) => ({
          ...prev,
          [index]: (prev[index] || 0) + count,
        }));
      }
    });

    setCurrentDefectCount({});
    onLogEntry?.(qcData);
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
                timer={timer}
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
                defectsList={defectsList}
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
              returnDefectQty={sharedState.returnDefectQty || 0}
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
        returnDefectQty={sharedState.returnDefectQty || 0}
        language={language}
      />
    </div>
  );
}

export default Inspection;
