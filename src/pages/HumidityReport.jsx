import { useState } from "react";
import React from "react";
import Report from "../components/inspection/Humidity/Report";
import { API_BASE_URL } from "../../config";

const HumidityReportPage = () => {
  return (
    <div>
      <Report baseUrl={API_BASE_URL} />
    </div>
  );
};

export default HumidityReportPage;
