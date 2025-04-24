import React from "react";

const DigitalMeasurementSummaryCard = ({
  orderQty,
  totalInspected,
  totalPass,
  totalReject,
  passRate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-lg font-semibold">Order Qty</h3>
        <p className="text-2xl">{orderQty}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-lg font-semibold">Total Inspected Qty</h3>
        <p className="text-2xl">{totalInspected}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-lg font-semibold">Total Pass</h3>
        <p className="text-2xl">{totalPass}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-lg font-semibold">Total Reject</h3>
        <p className="text-2xl">{totalReject}</p>
      </div>
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="text-lg font-semibold">Pass Rate</h3>
        <p className="text-2xl">{passRate}%</p>
      </div>
    </div>
  );
};

export default DigitalMeasurementSummaryCard;
