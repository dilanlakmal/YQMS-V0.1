import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

// Helper function to calculate mean
const calculateMean = (values) => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

// Helper function to calculate standard deviation
const calculateStandardDeviation = (values, mean) => {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
};

// Helper function to generate normal distribution data points
const generateNormalDistribution = (mean, stdDev, minX, maxX) => {
  const points = [];
  const step = (maxX - minX) / 100; // Number of points for smooth curve
  for (let x = minX; x <= maxX; x += step) {
    const y =
      (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
      Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
    points.push({ x, y });
  }
  return points;
};

const DigitalMeasurementStatisticalSummary = ({
  measurementDetails,
  summaryData,
  decimalToFraction
}) => {
  const chartRefs = useRef([]);

  useEffect(() => {
    if (!measurementDetails || !summaryData) return;

    // Process each measurement point
    summaryData.forEach((point, index) => {
      // Extract measured values for the current measurement point
      const measuredValues = measurementDetails.records
        .map((record) => {
          const value = record.actual[index]?.value || 0;
          return value !== 0 ? value : null;
        })
        .filter((val) => val !== null);

      if (measuredValues.length === 0) return;

      // Calculate mean and standard deviation
      const mean = calculateMean(measuredValues);
      const stdDev = calculateStandardDeviation(measuredValues, mean);

      // Define limits
      const buyerSpec = point.buyerSpec;
      const lowerLimit = buyerSpec + point.tolMinus;
      const upperLimit = buyerSpec + point.tolPlus;

      // Determine the range for the x-axis
      const minX = Math.min(lowerLimit, ...measuredValues) - stdDev * 2;
      const maxX = Math.max(upperLimit, ...measuredValues) + stdDev * 2;

      // Generate normal distribution data
      const normalData = generateNormalDistribution(mean, stdDev, minX, maxX);

      // Prepare scatter data for measured values (small dots at y = 0)
      const scatterData = measuredValues.map((value) => ({
        x: value,
        y: 0
      }));

      // Calculate discrepancy rate
      const discrepancyRate =
        buyerSpec !== 0
          ? (((buyerSpec - mean) / buyerSpec) * 100).toFixed(2)
          : "0.00";

      // Destroy existing chart if it exists
      if (chartRefs.current[index]) {
        chartRefs.current[index].destroy();
      }

      // Create new chart
      const ctx = document.getElementById(`chart-${index}`).getContext("2d");
      chartRefs.current[index] = new Chart(ctx, {
        type: "line",
        data: {
          datasets: [
            {
              label: "Normal Distribution",
              data: normalData,
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 2,
              fill: false,
              pointRadius: 0
            },
            {
              label: "Measured Values",
              data: scatterData,
              type: "scatter", // Use scatter type for individual points
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Black dots with slight transparency
              pointRadius: 2, // Small dot size
              pointHoverRadius: 3,
              showLine: false // No line connecting the dots
            },
            {
              label: "Lower Limit (LL)",
              data: [
                { x: lowerLimit, y: 0 },
                { x: lowerLimit, y: 0.5 }
              ],
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              type: "line"
            },
            {
              label: "Buyer Spec (S)",
              data: [
                { x: buyerSpec, y: 0 },
                { x: buyerSpec, y: 0.5 }
              ],
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              type: "line"
            },
            {
              label: "Upper Limit (UL)",
              data: [
                { x: upperLimit, y: 0 },
                { x: upperLimit, y: 0.5 }
              ],
              borderColor: "rgba(255, 206, 86, 1)",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              type: "line"
            },
            {
              label: "Mean (μ)",
              data: [
                { x: mean, y: 0 },
                { x: mean, y: 0.5 }
              ],
              borderColor: "rgba(153, 102, 255, 1)",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              type: "line"
            }
          ]
        },
        options: {
          scales: {
            x: {
              type: "linear",
              position: "bottom",
              title: {
                display: true,
                text: "Measurement Value"
              },
              ticks: {
                callback: function (value) {
                  if (value === lowerLimit) return "LL";
                  if (value === buyerSpec) return "S";
                  if (value === upperLimit) return "UL";
                  if (value === mean) return "μ";
                  return "";
                }
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Density"
              },
              max: 0.5,
              ticks: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              position: "right"
            },
            tooltip: {
              enabled: false // Disable tooltips to prevent showing values on hover
            }
          }
        }
      });
    });

    // Cleanup on unmount
    return () => {
      chartRefs.current.forEach((chart) => {
        if (chart) chart.destroy();
      });
    };
  }, [measurementDetails, summaryData]);

  if (!measurementDetails || !summaryData) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Statistical Analysis of Measurement Points
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryData.map((point, index) => {
          // Extract measured values for the current measurement point
          const measuredValues = measurementDetails.records
            .map((record) => {
              const value = record.actual[index]?.value || 0;
              return value !== 0 ? value : null;
            })
            .filter((val) => val !== null);

          if (measuredValues.length === 0) return null;

          // Calculate mean and standard deviation
          const mean = calculateMean(measuredValues);
          const buyerSpec = point.buyerSpec;

          // Calculate discrepancy rate
          const discrepancyRate =
            buyerSpec !== 0
              ? (((buyerSpec - mean) / buyerSpec) * 100).toFixed(2)
              : "0.00";

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <h3 className="text-md font-semibold mb-2 text-center">
                {point.measurementPoint}
              </h3>
              <canvas id={`chart-${index}`} className="w-full h-64"></canvas>
              <div className="mt-4 p-2 bg-gray-100 rounded text-center">
                <p className="text-sm font-medium">
                  Discrepancy Rate:{" "}
                  <span className="text-blue-600">{discrepancyRate}%</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DigitalMeasurementStatisticalSummary;
