import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormatTime from "../components/formatting/FormatTime";
import { formatTimeString } from "../components/formatting/FormatedTime";
import DefectsList from "../components/inspection/DefectsList";
import Header from "../components/inspection/Header";
import Summary from "../components/inspection/Summary";
import ViewToggle from "../components/inspection/ViewToggle";
import { defectsList } from "../constants/defects";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../config";

function Return({
  savedState,
  onStateChange,
  onLogEntry,
  timer,
  isPlaying,
  sharedState = {},
  onUpdateSharedState = () => {},
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [language, setLanguage] = useState("english");
  const [returnDefects, setReturnDefects] = useState(
    savedState?.returnDefects || {}
  );
  const [currentDefectCount, setCurrentDefectCount] = useState({});
  // const [defects, setDefects] = useState(sharedState?.cumulativeDefects || {});

  const [defects, setDefects] = useState(() => {
    if (sharedState.defectArray) {
      // Convert defectArray back to the original format
      return sharedState.defectArray.reduce((acc, defect) => {
        // Find the index in defectsList that matches the defect name
        const index = Object.entries(defectsList.english).findIndex(
          ([_, value]) => value.name === defect.name
        );
        if (index !== -1) {
          acc[index] = defect.count;
        }
        return acc;
      }, {});
    }
    return {};
  });

  const [checkedQuantity, setCheckedQuantity] = useState(
    sharedState?.cumulativeChecked || 0
  );
  const [goodOutput, setGoodOutput] = useState(
    sharedState?.cumulativeGoodOutput || 0
  );
  const [defectPieces, setDefectPieces] = useState(
    sharedState?.cumulativeDefectPieces || 0
  );
  const [returnDefectQty, setReturnDefectQty] = useState(
    savedState?.returnDefectQty || 0
  );
  const [hasDefectSelected, setHasDefectSelected] = useState(false);

  const isReturnComplete = goodOutput >= checkedQuantity;

  useEffect(() => {
    if (!savedState?.inspectionData) {
      navigate("/details");
    }
  }, [savedState, navigate]);

  useEffect(() => {
    if (sharedState) {
      setCheckedQuantity(sharedState.cumulativeChecked || 0);
      // Update defects when sharedState.defectArray changes
      if (sharedState.defectArray) {
        const newDefects = sharedState.defectArray.reduce((acc, defect) => {
          const index = Object.entries(defectsList.english).findIndex(
            ([_, value]) => value.name === defect.name
          );
          if (index !== -1) {
            acc[index] = defect.count;
          }
          return acc;
        }, {});
        setDefects(newDefects);
      }
      setGoodOutput(sharedState.cumulativeGoodOutput || 0);
      setDefectPieces(sharedState.cumulativeDefectPieces || 0);
    }
  }, [sharedState]);

  useEffect(() => {
    onStateChange?.({
      ...savedState,
      returnDefects,
      currentDefectCount,
      goodOutput,
      returnDefectQty,
      language,
      view,
      hasDefectSelected,
    });
  }, [
    returnDefects,
    currentDefectCount,
    goodOutput,
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
      const response = await fetch(`${API_BASE_URL}/api/save-qc-data`, {
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

  const handlePassReturn = () => {
    if (!isPlaying || isReturnComplete || hasDefectSelected) return;

    const currentTime = new Date();
    const newGoodOutput = Math.min(goodOutput + 1, checkedQuantity);

    onUpdateSharedState({
      cumulativeGoodOutput: newGoodOutput,
      returnDefectArray: Object.entries(returnDefects).map(
        ([index, count]) => ({
          name: defectsList["english"][index].name,
          count: count,
        })
      ),
    });

    const qcData = {
      headerData,
      type: "pass-return",
      garmentNo: null,
      status: "Pass Return",
      timestamp: timer,
      actualtime: currentTime.getTime(),
      formattedTimestamp: FormatTime({ seconds: timer }),
      formattedActualTime: formatTimeString(currentTime.getTime()),
      defectDetails: [],
      checkedQty: 0,
      goodOutput: 1,
      defectQty: 0,
      defectPieces: 0,
      defectArray: sharedState.defectArray || [],
      cumulativeChecked: checkedQuantity,
      cumulativeDefects: sharedState.cumulativeDefects || 0,
      cumulativeGoodOutput: newGoodOutput,
      cumulativeDefectPieces: defectPieces,
      returnDefectList: [],
      returnDefectArray: Object.entries(returnDefects).map(
        ([index, count]) => ({
          name: defectsList["english"][index].name,
          count: count,
        })
      ),
      returnDefectQty: 0,
      cumulativeReturnDefectQty: returnDefectQty,
    };

    saveQCDataToBackend(qcData);
    setGoodOutput(newGoodOutput);
    onLogEntry?.(qcData);
  };

  const handleRejectReturn = () => {
    if (
      !isPlaying ||
      isReturnComplete ||
      !Object.values(currentDefectCount).some((count) => count > 0)
    )
      return;

    const currentTime = new Date();
    const totalNewDefects = Object.values(currentDefectCount).reduce(
      (sum, count) => sum + count,
      0
    );
    const newReturnDefectQty = returnDefectQty + totalNewDefects;

    onUpdateSharedState({
      returnDefectQty: newReturnDefectQty,
      cumulativeReturnDefectQty: newReturnDefectQty,
      returnDefectArray: Object.entries(returnDefects).map(
        ([index, count]) => ({
          name: defectsList["english"][index].name,
          count: count + (currentDefectCount[index] || 0),
        })
      ),
    });

    const returnDefectList = Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .map(([index, count]) => ({
        name: defectsList["english"][index].name,
        count,
      }));

    const mergedReturnDefectArray = Object.entries(returnDefects)
      .map(([index, count]) => ({
        name: defectsList["english"][index].name,
        count: count + (currentDefectCount[index] || 0),
      }))
      .concat(
        Object.entries(currentDefectCount)
          .filter(([index]) => !returnDefects[index])
          .map(([index, count]) => ({
            name: defectsList["english"][index].name,
            count,
          }))
      )
      .reduce((acc, defect) => {
        const existingDefect = acc.find((d) => d.name === defect.name);
        if (existingDefect) {
          existingDefect.count += defect.count;
        } else {
          acc.push(defect);
        }
        return acc;
      }, []);

    const qcData = {
      headerData,
      type: "reject-return",
      garmentNo: null,
      status: "Reject Return",
      timestamp: timer,
      actualtime: currentTime.getTime(),
      formattedTimestamp: FormatTime({ seconds: timer }),
      formattedActualTime: formatTimeString(currentTime.getTime()),
      defectDetails: [],
      checkedQty: 0,
      goodOutput: 0,
      defectQty: 0,
      defectPieces: 0,
      defectArray: sharedState.defectArray || [],
      cumulativeChecked: checkedQuantity,
      cumulativeDefects: sharedState.cumulativeDefects || 0,
      cumulativeGoodOutput: goodOutput,
      cumulativeDefectPieces: defectPieces,
      returnDefectList: returnDefectList,
      returnDefectArray: mergedReturnDefectArray,
      returnDefectQty: totalNewDefects,
      cumulativeReturnDefectQty: newReturnDefectQty,
    };

    saveQCDataToBackend(qcData);
    setReturnDefectQty(newReturnDefectQty);

    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (count > 0) {
        setReturnDefects((prev) => ({
          ...prev,
          [index]: (prev[index] || 0) + count,
        }));
      }
    });

    setCurrentDefectCount({});
    onLogEntry?.(qcData);
    setHasDefectSelected(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="fixed top-16 left-0 right-0 bg-white z-40">
        <div className="max-w-8xl mx-auto px-4 pt-2 pb-0">
          <Header inspectionData={savedState?.inspectionData} />
        </div>
      </div>

      <div className="fixed top-28 left-0 right-0 bg-white shadow-md z-30">
        <div className="max-w-8xl mx-auto px-4 pt-2 pb-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ViewToggle
              view={view}
              onViewChange={setView}
              onLanguageChange={setLanguage}
            />
            <div className="text-xl font-mono">{formatTime(timer)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 pt-14 pb-52">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-2 flex items-center justify-center">
            <button
              onClick={handlePassReturn}
              disabled={!isPlaying || isReturnComplete || hasDefectSelected}
              className={`w-full h-full py-0 rounded font-medium ${
                isPlaying && !isReturnComplete && !hasDefectSelected
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              Pass Return
            </button>
          </div>
          <div className="col-span-8">
            <DefectsList
              view={view}
              language={language}
              defects={returnDefects}
              currentDefectCount={currentDefectCount}
              onDefectUpdate={(index, value) => {
                setReturnDefects((prev) => ({ ...prev, [index]: value }));
              }}
              onCurrentDefectUpdate={(index, value) => {
                setCurrentDefectCount((prev) => ({ ...prev, [index]: value }));
                setHasDefectSelected(
                  Object.values({ ...currentDefectCount, [index]: value }).some(
                    (count) => count > 0
                  )
                );
              }}
              onLogEntry={onLogEntry}
              isPlaying={isPlaying && !isReturnComplete}
              onDefectSelect={setHasDefectSelected}
              isReturnView={true}
            />
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <button
              onClick={handleRejectReturn}
              disabled={
                !isPlaying ||
                isReturnComplete ||
                !Object.values(currentDefectCount).some((count) => count > 0)
              }
              className={`w-full h-full py-0 rounded font-medium ${
                isPlaying &&
                !isReturnComplete &&
                Object.values(currentDefectCount).some((count) => count > 0)
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              Reject Return
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-8xl mx-auto px-4 py-4">
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
  );
}

export default Return;
