import React from "react";
import ANFMeasurementResults from "./ANFMeasurementResults"; // Import the base component

// This is the unique logic for the Buyer Report.
const buyerReportProcessor = (data) => {
  return data.map((item) => {
    // If status is not 'Completed' or if checked qty is 0, return the original item
    if (
      item.status !== "Completed" ||
      !item.summary.checkedQty ||
      item.summary.checkedQty <= 0
    ) {
      return item;
    }

    const orderQty = item.orderQty_color;
    const initialChecked = item.summary.checkedQty;

    // If already fully checked, return original item
    if (initialChecked >= orderQty) {
      return item;
    }

    // --- Start of Projection Calculations ---
    const difference = orderQty - initialChecked;

    // 1. Garment Details Projection
    const projectedCheckedQty = initialChecked + difference; // This will equal orderQty
    const projectedOkGarment = item.summary.okGarment + difference;

    // 2. Measurement Details Projection
    const pointsPerGarment = item.summary.totalPoints / initialChecked;
    const projectedTotalPoints = Math.round(pointsPerGarment * orderQty);

    const pointsDifference = projectedTotalPoints - item.summary.totalPoints;
    const projectedPassPoints = item.summary.passPoints + pointsDifference;

    return {
      ...item,
      // Create a new summary object with projected values
      summary: {
        ...item.summary,
        checkedQty: projectedCheckedQty,
        okGarment: projectedOkGarment,
        // rejectedGarment remains the same

        totalPoints: projectedTotalPoints,
        passPoints: projectedPassPoints
        // issuePoints, tolPlus, tolNeg remain the same
      },
      // Add a flag to indicate this row was modified for styling
      isProjected: true
    };
  });
};

// The new component is now just a wrapper around the original.
const ANFMeasurementBuyerReportSize = () => {
  return <ANFMeasurementResults dataProcessor={buyerReportProcessor} />;
};

export default ANFMeasurementBuyerReportSize;
