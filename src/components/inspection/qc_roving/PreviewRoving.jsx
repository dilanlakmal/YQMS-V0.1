import React from "react";
import { X } from "lucide-react";

const PreviewRoving = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const {
    date,
    qcId,
    lineNo,
    moNo,
    operatorId,
    inspectionType,
    operationName,
    machineCode,
    spiStatus,
    measurementStatus,
    garments,
    defectRate,
    defectRatio,
    remark, 
    spiFilesToUpload, 
    measurementFilesToUpload, 
    rovingStatus, 
    overallStatusColor, // <-- Destructure the new prop
  } = data || {}; 

  // Compute defect details for the table
  const defectDetails = garments
    .map((garment, index) => {
      if (garment.defects.length > 0) {
        return garment.defects.map((defect) => ({
          garmentNo: index + 1,
          defectName: defect.name,
          defectQty: defect.count
        }));
      }
      return [];
    })
    .flat();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">QC Inline Roving</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Section */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Summary</h3>
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Date</th>
                <th className="border border-gray-300 p-2">QC ID</th>
                <th className="border border-gray-300 p-2">Line No</th>
                <th className="border border-gray-300 p-2">MO No</th>
                <th className="border border-gray-300 p-2">Operator ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center">
                  {date}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {qcId}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {lineNo}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {moNo}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {operatorId}
                </td>
              </tr>
            </tbody>
          </table>
          {/* Remaining Summary Items in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <p>
              <strong>Inspection Type:</strong> {inspectionType} ---{" "}
              <strong>Checked Qty:</strong>{" "}
              {inspectionType === "Normal" ? 5 : 15}
            </p>
            <p>
              <strong>Operation Name:</strong> {operationName} ---{" "}
              <strong>Machine Code :</strong> {machineCode}
            </p>
          </div>
        </div>

        {/* Inspection Data Section */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Inspection Data
        </h3>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1">
            <p>
              <strong>SPI:</strong>
            </p>
            <div
              className={`mt-2 p-2 rounded-lg text-center ${
                spiStatus === "Pass"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {spiStatus}
            </div>
          </div>
          <div className="flex-1">
            <p>
              <strong>Measurement:</strong>
            </p>
            <div
              className={`mt-2 p-2 rounded-lg text-center ${
                measurementStatus === "Pass"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {measurementStatus}
            </div>
          </div>
        </div>

         {/* Display SPI Images */}
        {spiFilesToUpload && spiFilesToUpload.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">SPI Images</h3>
            <div className="flex flex-wrap gap-2">
              {spiFilesToUpload.map((file, index) => (
                <div key={`spi-preview-${index}`} className="w-24 h-24 border border-gray-300 rounded overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt={`SPI ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defect Details Section */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Defect Details
        </h3>
        {defectDetails.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Part No</th>
                <th className="border border-gray-300 p-2">Defect Name</th>
                <th className="border border-gray-300 p-2">Defect Qty</th>
              </tr>
            </thead>
            <tbody>
              {defectDetails.map((defect, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2 text-center">
                    {defect.garmentNo}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {defect.defectName}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {defect.defectQty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 mb-4">No defects recorded.</p>
        )}

        {/* Display Measurement Images */}
        {measurementFilesToUpload && measurementFilesToUpload.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Measurement Images</h3>
            <div className="flex flex-wrap gap-2">
              {measurementFilesToUpload.map((file, index) => (
                <div key={`measurement-preview-${index}`} className="w-24 h-24 border border-gray-300 rounded overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt={`Measurement ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remark Section */}
        {remark && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Remark</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200 whitespace-pre-wrap">
              {remark}
            </p>
          </div>
        )}

        {/* Defect Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <p>
            <strong>Defect Rate:</strong> {defectRate}
          </p>
          <p>
            <strong>Defect Ratio:</strong> {defectRatio}
          </p>
        </div>

        {/* Roving Status Section */}
        {rovingStatus && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Roving Status</h3>
            <p className={`text-lg font-medium p-2 rounded-md inline-block ${overallStatusColor || 'bg-gray-200 text-gray-700'}`}>
              {rovingStatus}
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewRoving;
