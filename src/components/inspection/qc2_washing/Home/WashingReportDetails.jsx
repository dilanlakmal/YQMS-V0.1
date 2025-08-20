import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../../../../../config";
import WashingSpecsDataPreview from "../WashingSpecsDataPreview";

const WashingReportDetails = () => {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/qc-washing/submitted/${id}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setReportData(data.data);
        } else {
          setError(data.message || "Failed to fetch report data.");
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Could not fetch report data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReportData();
    }
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-10">Loading report details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  if (!reportData) {
    return (
      <div className="text-center py-10">No data found for this report.</div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold mb-4">QC Washing Report Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Order No:</span> {reportData.orderNo}
          </div>
          <div>
            <span className="font-semibold">Date:</span>{" "}
            {new Date(reportData.date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Color:</span> {reportData.colorName}
          </div>
          <div>
            <span className="font-semibold">Report Type:</span>{" "}
            {reportData.reportType}
          </div>
          <div>
            <span className="font-semibold">Result:</span>{" "}
            <span
              className={`font-bold ${
                reportData.formData?.result === "PASS"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {reportData.formData?.result || "N/A"}
            </span>
          </div>
           <div>
            <span className="font-semibold">Submitted By:</span>{" "}
            {reportData.userId || "N/A"}
          </div>
          {reportData.formData?.remarks && (
            <div className="md:col-span-2 lg:col-span-3">
              <span className="font-semibold">Remarks:</span>{" "}
              {reportData.formData.remarks}
            </div>
          )}
        </div>
      </div>

      {reportData.formData?.measurements && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Measurement Specifications
          </h2>
          <WashingSpecsDataPreview
            measurements={reportData.formData.measurements}
            isReadOnly={true}
          />
        </div>
      )}
    </div>
  );
};

export default WashingReportDetails;