import html2pdf from "html2pdf.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

const HandleDownloadPDF = ({
  savedState,
  defects,
  checkedQuantity,
  goodOutput,
  defectPieces,
  language,
  defectsList // Add defectsList as a prop
}) => {
  const handleDownloadPDF = async () => {
    try {
      const inspectionData = savedState?.inspectionData;
      const defectItems = defectsList[language];
      const defectEntries = Object.entries(defects)
        .filter(([_, count]) => count > 0)
        .map(([index, count]) => ({
          name: defectItems[index].name, // Access the 'name' property
          count,
          rate:
            checkedQuantity > 0
              ? ((count / checkedQuantity) * 100).toFixed(2)
              : "0.00"
        }))
        .sort((a, b) => b.count - a.count);

      const totalDefects = Object.values(defects).reduce(
        (sum, count) => sum + count,
        0
      );
      const defectRate =
        checkedQuantity > 0 ? (totalDefects / checkedQuantity) * 100 : 0;
      const defectRatio =
        checkedQuantity > 0 ? (defectPieces / checkedQuantity) * 100 : 0;

      const currentTime = new Date();
      const timestamp = currentTime.toTimeString().split(" ")[0];

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
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };

      await html2pdf().set(opt).from(element).save();

      // Show success alert after download
      Swal.fire({
        title: "Success!",
        text: "PDF downloaded successfully!",
        icon: "success",
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to download PDF. Please try again.",
        icon: "error",
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    }
  };

  return (
    <button
      onClick={handleDownloadPDF}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center justify-center"
    >
      <FontAwesomeIcon icon={faDownload} size="lg" />
    </button>
  );
};

export default HandleDownloadPDF;
