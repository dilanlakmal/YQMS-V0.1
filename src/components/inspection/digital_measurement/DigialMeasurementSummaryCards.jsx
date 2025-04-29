import React from "react";
import {
  FaShoppingCart,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaPercentage
} from "react-icons/fa";

const DigialMeasurementSummaryCards = ({ summaryData }) => {
  if (!summaryData)
    return (
      <div className="text-center text-gray-500">Loading summary data...</div>
    );

  return (
    <div className="grid grid-cols-5 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-blue-100 p-4 rounded-lg shadow-lg flex items-center">
        <FaShoppingCart className="text-3xl text-blue-600 mr-3" />
        <div>
          <h3 className="text-md font-semibold text-gray-700">Order Qty</h3>
          <p className="text-xl font-bold text-blue-800">
            {summaryData.orderQty}
          </p>
        </div>
      </div>
      <div className="bg-yellow-100 p-4 rounded-lg shadow-lg flex items-center">
        <FaSearch className="text-3xl text-yellow-600 mr-3" />
        <div>
          <h3 className="text-md font-semibold text-gray-700">Inspected Qty</h3>
          <p className="text-xl font-bold text-yellow-800">
            {summaryData.inspectedQty}
          </p>
        </div>
      </div>
      <div className="bg-green-100 p-4 rounded-lg shadow-lg flex items-center">
        <FaCheckCircle className="text-3xl text-green-600 mr-3" />
        <div>
          <h3 className="text-md font-semibold text-gray-700">Total Pass</h3>
          <p className="text-xl font-bold text-green-800">
            {summaryData.totalPass}
          </p>
        </div>
      </div>
      <div className="bg-red-100 p-4 rounded-lg shadow-lg flex items-center">
        <FaTimesCircle className="text-3xl text-red-600 mr-3" />
        <div>
          <h3 className="text-md font-semibold text-gray-700">Total Reject</h3>
          <p className="text-xl font-bold text-red-800">
            {summaryData.totalReject}
          </p>
        </div>
      </div>
      <div
        className={`p-4 rounded-lg shadow-lg flex items-center ${
          summaryData.passRate > 98 ? "bg-green-200" : "bg-red-200"
        }`}
      >
        <FaPercentage
          className={`text-3xl mr-3 ${
            summaryData.passRate > 98 ? "text-green-800" : "text-red-800"
          }`}
        />
        <div>
          <h3
            className={`text-md font-semibold ${
              summaryData.passRate > 98 ? "text-green-800" : "text-red-800"
            }`}
          >
            Pass Rate
          </h3>
          <p
            className={`text-xl font-bold ${
              summaryData.passRate > 98 ? "text-green-800" : "text-red-800"
            }`}
          >
            {summaryData.passRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigialMeasurementSummaryCards;
