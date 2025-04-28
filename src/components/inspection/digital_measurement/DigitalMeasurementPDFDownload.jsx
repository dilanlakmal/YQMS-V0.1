import React, { useRef, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DigitalMeasurementPDFDownload = ({
  selectedMono,
  filteredMeasurementSummary,
  measurementDetails,
  decimalToFraction,
  onDownloadPDF
}) => {
  const pdfContentRef = useRef(null);

  // Memoize generatePDF to prevent unnecessary re-renders
  const generatePDF = useCallback(async () => {
    console.log("generatePDF called");
    if (!pdfContentRef.current) {
      console.log("pdfContentRef is null");
      return;
    }

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // Add Title
      pdf.setFontSize(16);
      pdf.text(
        `Digital Measurement Report - MO No: ${selectedMono}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Capture the content
      const canvas = await html2canvas(pdfContentRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate dimensions to fit the page
      const pdfWidth = pageWidth - 2 * margin;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      // Add new page if content exceeds page height
      if (yPosition + pdfHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.addImage(imgData, "PNG", margin, yPosition, pdfWidth, pdfHeight);
      pdf.save(`DigitalMeasurementReport_${selectedMono}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }, [selectedMono, pdfContentRef]);

  // Set the download callback when the component mounts or dependencies change
  useEffect(() => {
    console.log("Setting downloadPDFCallback");
    if (onDownloadPDF) {
      onDownloadPDF(generatePDF);
    }
  }, [onDownloadPDF, generatePDF]);

  // Helper function to render fractions as strings for PDF
  const renderFraction = (decimal) => {
    if (!decimal || isNaN(decimal)) return " ";

    const sign = decimal < 0 ? "-" : "";
    const absDecimal = Math.abs(decimal);
    const fractionValue =
      absDecimal >= 1 ? absDecimal - Math.floor(absDecimal) : absDecimal;
    const whole = absDecimal >= 1 ? Math.floor(absDecimal) : 0;

    if (fractionValue === 0) return `${sign}${whole || 0}`;

    const fractions = [
      { value: 0.0625, fraction: { numerator: 1, denominator: 16 } },
      { value: 0.125, fraction: { numerator: 1, denominator: 8 } },
      { value: 0.1875, fraction: { numerator: 3, denominator: 16 } },
      { value: 0.25, fraction: { numerator: 1, denominator: 4 } },
      { value: 0.3125, fraction: { numerator: 5, denominator: 16 } },
      { value: 0.375, fraction: { numerator: 3, denominator: 8 } },
      { value: 0.4375, fraction: { numerator: 7, denominator: 16 } },
      { value: 0.5, fraction: { numerator: 1, denominator: 2 } },
      { value: 0.5625, fraction: { numerator: 9, denominator: 16 } },
      { value: 0.625, fraction: { numerator: 5, denominator: 8 } },
      { value: 0.6875, fraction: { numerator: 11, denominator: 16 } },
      { value: 0.75, fraction: { numerator: 3, denominator: 4 } },
      { value: 0.8125, fraction: { numerator: 13, denominator: 16 } },
      { value: 0.875, fraction: { numerator: 7, denominator: 8 } },
      { value: 0.9375, fraction: { numerator: 15, denominator: 16 } }
    ];

    const tolerance = 0.01;
    const closestFraction = fractions.find(
      (f) => Math.abs(fractionValue - f.value) < tolerance
    );

    if (closestFraction) {
      const { numerator, denominator } = closestFraction.fraction;
      return `${sign}${
        whole !== 0 ? whole + " " : ""
      }${numerator}/${denominator}`;
    }
    return `${sign}${fractionValue.toFixed(3)}`;
  };

  return (
    <>
      {/* Hidden container for PDF content */}
      <div className="absolute left-[-9999px] w-[1200px]" ref={pdfContentRef}>
        {/* Measurement Summary Table */}
        <h2 className="text-lg font-semibold mb-4">Measurement Summary</h2>
        <table className="w-full bg-white rounded border table-auto mb-8">
          <thead>
            <tr className="bg-gray-200 text-sm">
              <th className="p-2 border">MO No</th>
              <th className="p-2 border">Cust. Style</th>
              <th className="p-2 border">Buyer</th>
              <th className="p-2 border">Country</th>
              <th className="p-2 border">Origin</th>
              <th className="p-2 border">Mode</th>
              <th className="p-2 border">Order Qty</th>
              <th className="p-2 border">Inspected Qty</th>
              <th className="p-2 border">Total Pass</th>
              <th className="p-2 border">Total Reject</th>
              <th className="p-2 border">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeasurementSummary.length > 0 ? (
              filteredMeasurementSummary.map((item, index) => (
                <tr key={index} className="text-center text-sm">
                  <td className="p-2 border">{item.moNo}</td>
                  <td className="p-2 border">{item.custStyle || "N/A"}</td>
                  <td className="p-2 border">{item.buyer || "N/A"}</td>
                  <td className="p-2 border">{item.country || "N/A"}</td>
                  <td className="p-2 border">{item.origin || "N/A"}</td>
                  <td className="p-2 border">{item.mode || "N/A"}</td>
                  <td className="p-2 border">{item.orderQty}</td>
                  <td className="p-2 border">{item.inspectedQty}</td>
                  <td className="p-2 border">{item.totalPass}</td>
                  <td className="p-2 border">{item.totalReject}</td>
                  <td className="p-2 border">{item.passRate}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="p-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Overall Measurement Point Summary Table */}
        <h2 className="text-lg font-semibold mb-4">
          Overall Measurement Point Summary
        </h2>
        <table className="w-full bg-white rounded border table-auto mb-8">
          <thead>
            <tr className="bg-gray-200 text-sm">
              <th className="p-2 border">Measurement Point</th>
              <th className="p-2 border">Buyer Spec</th>
              <th className="p-2 border">Tol-</th>
              <th className="p-2 border">Tol+</th>
              <th className="p-2 border">Total Count</th>
              <th className="p-2 border">Total Pass</th>
              <th className="p-2 border">Total Fail</th>
              <th className="p-2 border">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {measurementDetails?.measurementPointSummary?.length > 0 ? (
              measurementDetails.measurementPointSummary.map((point, index) => (
                <tr key={index} className="text-center text-sm">
                  <td className="p-2 border">{point.measurementPoint}</td>
                  <td className="p-2 border">
                    {renderFraction(point.buyerSpec)}
                  </td>
                  <td className="p-2 border">
                    {renderFraction(point.tolMinus)}
                  </td>
                  <td className="p-2 border">
                    {renderFraction(point.tolPlus)}
                  </td>
                  <td className="p-2 border">{point.totalCount}</td>
                  <td className="p-2 border">{point.totalPass}</td>
                  <td className="p-2 border">{point.totalFail}</td>
                  <td className="p-2 border">{point.passRate}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No measurement points available
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Inspected Summary Table */}
        <h2 className="text-lg font-semibold mb-4">
          Inspected Summary for MO No: {selectedMono}
        </h2>
        <table className="w-full bg-white rounded border table-auto">
          <thead>
            <tr className="bg-gray-200 text-sm">
              <th className="p-2 border">Inspection Date</th>
              <th className="p-2 border">Garment NO</th>
              <th className="p-2 border">Measurement Point</th>
              <th className="p-2 border">Buyer Specs</th>
              <th className="p-2 border">TolMinus</th>
              <th className="p-2 border">TolPlus</th>
              <th className="p-2 border">Measure Value</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {measurementDetails?.records?.length > 0 ? (
              measurementDetails.records.map((record, garmentIndex) => {
                const inspectionDate = new Date(
                  record.created_at
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit"
                });
                const garmentNo = garmentIndex + 1;
                const points = record.actual
                  .map((actualItem, index) => {
                    if (actualItem.value === 0) return null;
                    const spec = measurementDetails.sizeSpec[index];
                    const measurementPoint = spec.EnglishRemark;
                    const tolMinus = spec.ToleranceMinus.decimal;
                    const tolPlus = spec.TolerancePlus.decimal;
                    const buyerSpec = spec.Specs.find(
                      (s) => Object.keys(s)[0] === record.size
                    )[record.size].decimal;
                    const measureValue = actualItem.value;
                    const lower = buyerSpec + tolMinus;
                    const upper = buyerSpec + tolPlus;
                    const status =
                      measureValue >= lower && measureValue <= upper
                        ? "Pass"
                        : "Fail";
                    return {
                      measurementPoint,
                      buyerSpec,
                      tolMinus,
                      tolPlus,
                      measureValue,
                      status
                    };
                  })
                  .filter((p) => p !== null);

                return points.map((point, pointIndex) => (
                  <tr
                    key={`${garmentIndex}-${pointIndex}`}
                    className="text-center text-sm"
                  >
                    {pointIndex === 0 ? (
                      <td
                        rowSpan={points.length}
                        className="p-2 border align-middle"
                      >
                        {inspectionDate}
                      </td>
                    ) : null}
                    {pointIndex === 0 ? (
                      <td
                        rowSpan={points.length}
                        className="p-2 border align-middle"
                      >
                        {garmentNo}
                      </td>
                    ) : null}
                    <td className="p-2 border">{point.measurementPoint}</td>
                    <td className="p-2 border">
                      {renderFraction(point.buyerSpec)}
                    </td>
                    <td className="p-2 border">
                      {renderFraction(point.tolMinus)}
                    </td>
                    <td className="p-2 border">
                      {renderFraction(point.tolPlus)}
                    </td>
                    <td className="p-2 border">
                      {point.measureValue.toFixed(1)}
                    </td>
                    <td
                      className={`p-2 border ${
                        point.status === "Pass" ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {point.status}
                    </td>
                  </tr>
                ));
              })
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  No garments inspected for this MO No
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DigitalMeasurementPDFDownload;
