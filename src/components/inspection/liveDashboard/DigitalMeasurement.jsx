import React, { useState, useEffect } from "react";
import axios from "axios";
import DigitalMeasurementFilterPane from "../digital_measurement/DigitalMeasurementFilterPane";
import DigitalMeasurementSummaryCard from "../digital_measurement/DigitalMeasurementSummaryCard";
import { API_BASE_URL } from "../../../../config";

const DigitalMeasurement = () => {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    factory: "",
    mono: "",
    custStyle: "",
    buyer: "",
    empId: ""
  });

  const [summary, setSummary] = useState({
    orderQty: 0,
    totalInspected: 0,
    totalPass: 0,
    totalReject: 0,
    passRate: "0.00"
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const params = {
          startDate: filters.startDate ? filters.startDate.toISOString() : "",
          endDate: filters.endDate ? filters.endDate.toISOString() : "",
          factory: filters.factory,
          mono: filters.mono,
          custStyle: filters.custStyle,
          buyer: filters.buyer,
          empId: filters.empId
        };
        const response = await axios.get(
          `${API_BASE_URL}/api/digital-measurement-summary`,
          {
            params,
            withCredentials: true
          }
        );
        setSummary(response.data);
      } catch (error) {
        console.error("Error fetching summary:", error);
      }
    };
    fetchSummary();
  }, [filters]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Digital Measurement Dashboard</h1>
      <DigitalMeasurementFilterPane filters={filters} setFilters={setFilters} />
      <DigitalMeasurementSummaryCard {...summary} />
    </div>
  );
};

export default DigitalMeasurement;
