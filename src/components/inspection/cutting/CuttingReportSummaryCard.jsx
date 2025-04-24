import React from "react";
import {
  FaCubes, // For Total Pcs
  FaCheckCircle, // For Total Pass
  FaTimesCircle, // For Total Reject
  FaRuler, // For Measurement Issues
  FaBug, // For Physical Defects
  FaChartLine, // For Pass Rate
  FaFlagCheckered // For Result
} from "react-icons/fa";

const CuttingReportSummaryCard = ({ summary }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold mb-4">Summary Data</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Total Pcs */}
        <div className="bg-blue-100 rounded-lg shadow-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaCubes className="text-blue-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">Total Pcs</h4>
          </div>
          <p className="text-xl font-bold text-blue-600">{summary.totalPcs}</p>
        </div>

        {/* Total Pass */}
        <div className="bg-green-100 rounded-lg shadow-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaCheckCircle className="text-green-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">Total Pass</h4>
          </div>
          <p className="text-xl font-bold text-green-600">
            {summary.totalPass}
          </p>
        </div>

        {/* Total Reject */}
        <div className="bg-red-100 rounded-lg shadow-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaTimesCircle className="text-red-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">
              Total Reject
            </h4>
          </div>
          <p className="text-xl font-bold text-red-600">
            {summary.totalReject}
          </p>
        </div>

        {/* Measurement Issues */}
        <div className="bg-red-100 rounded-lg shadow-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaRuler className="text-red-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">
              Measurement Issues
            </h4>
          </div>
          <p className="text-xl font-bold text-red-600">
            {summary.totalRejectMeasurement}
          </p>
        </div>

        {/* Physical Defects */}
        <div className="bg-red-100 rounded-lg shadow-md p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <FaBug className="text-red-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">
              Physical Defects
            </h4>
          </div>
          <p className="text-xl font-bold text-red-600">
            {summary.totalRejectDefects}
          </p>
        </div>

        {/* Pass Rate */}
        <div
          className={`${
            summary.passRate < 80 ? "bg-red-100" : "bg-green-100"
          } rounded-lg shadow-md p-4 text-center`}
        >
          <div className="flex items-center justify-center mb-2">
            <FaChartLine
              className={
                summary.passRate < 80
                  ? "text-red-600 mr-2"
                  : "text-green-600 mr-2"
              }
            />
            <h4 className="text-sm font-semibold text-gray-700">Pass Rate</h4>
          </div>
          <p
            className={`text-xl font-bold ${
              summary.passRate < 80 ? "text-red-600" : "text-green-600"
            }`}
          >
            {summary.passRate}%
          </p>
        </div>

        {/* Result */}
        <div
          className={`${
            summary.result === "Pass" ? "bg-green-100" : "bg-red-100"
          } rounded-lg shadow-md p-4 text-center`}
        >
          <div className="flex items-center justify-center mb-2">
            <FaFlagCheckered
              className={
                summary.result === "Pass"
                  ? "text-green-600 mr-2"
                  : "text-red-600 mr-2"
              }
            />
            <h4 className="text-sm font-semibold text-gray-700">Result</h4>
          </div>
          <p
            className={`text-xl font-bold ${
              summary.result === "Pass" ? "text-green-600" : "text-red-600"
            }`}
          >
            {summary.result}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CuttingReportSummaryCard;
