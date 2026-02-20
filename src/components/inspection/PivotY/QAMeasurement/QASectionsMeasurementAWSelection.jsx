import React from "react";
import MeasurementSpecsShared from "./MeasurementSpecsShared";

const QASectionsMeasurementAWSelection = () => {
  return (
    <MeasurementSpecsShared
      title="Spec Selection (After Wash)"
      subtitle="Configure pattern specs from Order Details."
      apiEndpointBase="/api/qa-sections/measurement-specs-aw"
      dataKey="AllAfterWashSpecs"
      selectedDataKey="selectedAfterWashSpecs"
      isAw={true}
    />
  );
};

export default QASectionsMeasurementAWSelection;
