import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Header from "../components/inspection/Header";
import ViewToggle from "../components/inspection/ViewToggle";
import DefectsList from "../components/inspection/DefectsList";
import Summary from "../components/inspection/Summary";
import PlayPauseButton from "../components/inspection/PlayPauseButton";
import PreviewModal from "../components/inspection/PreviewModal";
import PreviewHeader from "../components/inspection/preview/PreviewHeader";
import PreviewDefects from "../components/inspection/preview/PreviewDefects";
import PreviewSummary from "../components/inspection/preview/PreviewSummary";
import { defectsList } from "../constants/defects";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";

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

  const handlePass = () => {
    if (!isPlaying || hasDefectSelected) return;

    const currentTime = new Date();
    setCheckedQuantity((prev) => prev + 1);
    setGoodOutput((prev) => prev + 1);

    onLogEntry?.({
      type: "pass",
      garmentNo: checkedQuantity + 1,
      status: "Pass",
      timestamp: currentTime.getTime(),
      defectDetails: [],
    });
  };

  const handleReject = () => {
    if (
      !isPlaying ||
      !Object.values(currentDefectCount).some((count) => count > 0)
    )
      return;

    const currentTime = new Date();
    setCheckedQuantity((prev) => prev + 1);
    setDefectPieces((prev) => prev + 1);

    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (count > 0) {
        setDefects((prev) => ({
          ...prev,
          [index]: (prev[index] || 0) + count,
        }));
      }
    });

    const currentDefects = Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .map(([index, count]) => ({
        name: defectsList[language][index],
        count,
        timestamp: currentTime.getTime(),
      }));

    onLogEntry?.({
      type: "reject",
      garmentNo: checkedQuantity + 1,
      status: "Reject",
      defectDetails: currentDefects,
      timestamp: currentTime.getTime(),
    });

    setCurrentDefectCount({});
  };

  const handleDownloadPDF = async () => {
    try {
      const inspectionData = savedState?.inspectionData; // Assuming you have this data
      const defectItems = defectsList[language]; // Defect items from your constants
      const defectEntries = Object.entries(defects)
        .filter(([_, count]) => count > 0)
        .map(([index, count]) => ({
          name: defectItems[index],
          count,
          rate:
            checkedQuantity > 0
              ? ((count / checkedQuantity) * 100).toFixed(2)
              : "0.00",
        }))
        .sort((a, b) => b.count - a.count); // Sort defects by count

      const totalDefects = Object.values(defects).reduce(
        (sum, count) => sum + count,
        0
      );
      const defectRate =
        checkedQuantity > 0 ? (totalDefects / checkedQuantity) * 100 : 0;
      const defectRatio =
        checkedQuantity > 0 ? (defectPieces / checkedQuantity) * 100 : 0;

      const currentTime = new Date();
      const timestamp = currentTime.toTimeString().split(" ")[0]; // Format: HH:MM:SS

      const headerContent = `
        <div style="font-size: 14px; margin-bottom: 20px;">
          <h2 style="text-align: center; margin-bottom: 20px;">Inspection Details</h2>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Field</th>
                <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px;">Date</td>
                <td style="padding: 8px;">${new Date(
                  inspectionData.date
                ).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Factory</td>
                <td style="padding: 8px;">${inspectionData.factory}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Line No</td>
                <td style="padding: 8px;">${inspectionData.lineNo}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Style</td>
                <td style="padding: 8px;">${inspectionData.styleCode} ${
        inspectionData.styleDigit
      }</td>
              </tr>
              <tr>
                <td style="padding: 8px;">MO No</td>
                <td style="padding: 8px;">${inspectionData.moNo}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Customer</td>
                <td style="padding: 8px;">${inspectionData.customer}</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 12px; text-align: right;">Downloaded at: ${timestamp}</p>
        </div>
      `;

      const defectContent = `
        <div style="font-size: 14px; margin-bottom: 20px;">
          <h2 style="text-align: center; margin-bottom: 20px;">Defect Details</h2>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Defect Type</th>
                <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Quantity</th>
                <th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Defect Rate</th>
              </tr>
            </thead>
            <tbody>
              ${defectEntries
                .map(
                  ({ name, count, rate }) => `
                <tr>
                  <td style="padding: 8px; text-align: left;">${name}</td>
                  <td style="padding: 8px; text-align: left;">${count}</td>
                  <td style="padding: 8px; text-align: left;">${rate}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      const summaryContent = `
        <div style="font-size: 14px; margin-bottom: 20px;">
          <h2 style="text-align: center; margin-bottom: 20px;">Summary</h2>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 8px; text-align: center; background-color: #f2f2f2;">Total Defects</th>
                <th style="padding: 8px; text-align: center; background-color: #f2f2f2;">Checked Quantity</th>
                <th style="padding: 8px; text-align: center; background-color: #f2f2f2;">Good Output</th>
                <th style="padding: 8px; text-align: center; background-color: #f2f2f2;">Defect Pieces</th>
                <th style="padding: 8px; text-align: center; background-color: #f2f2f2;">Defect Rate</th>
                <th style="padding: 8px; text-align: center; background-color: #f2f2f2;">Defect Ratio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; text-align: center;">${totalDefects}</td>
                <td style="padding: 8px; text-align: center;">${checkedQuantity}</td>
                <td style="padding: 8px; text-align: center;">${goodOutput}</td>
                <td style="padding: 8px; text-align: center;">${defectPieces}</td>
                <td style="padding: 8px; text-align: center;">${defectRate.toFixed(
                  2
                )}%</td>
                <td style="padding: 8px; text-align: center;">${defectRatio.toFixed(
                  2
                )}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const contentToPrint = `
        <div style="font-family: Arial, sans-serif;">
          <h1 style="text-align: center; font-size: 20px; margin-top: 40px;">QC Inspection Report</h1>
          ${headerContent}
          ${defectContent}
          ${summaryContent}
        </div>
      `;

      const element = document.createElement("div");
      element.innerHTML = contentToPrint;

      const opt = {
        margin: 1,
        filename: "inspection-report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
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
                timer={formatTime(timer)}
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-400 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faEye} size="lg" />
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faDownload} size="lg" />
              </button>

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
