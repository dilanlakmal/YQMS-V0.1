import React from "react";
import MeasurementSpecsShared from "./MeasurementSpecsShared";

const QASectionsMeasurementSpecsSelection = () => {
  return (
    <MeasurementSpecsShared
      title="Spec Selection (Before Wash)"
      subtitle="Search MO, Select Points, Save Configuration."
      apiEndpointBase="/api/qa-sections/measurement-specs"
      dataKey="AllBeforeWashSpecs"
      selectedDataKey="selectedBeforeWashSpecs"
      isAw={false}
    />
  );
};

export default QASectionsMeasurementSpecsSelection;
