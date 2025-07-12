// SubmittedWashingDataPage.jsx
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../../config'; 

const SubmittedWashingDataPage = () => {
  const [submittedData, setSubmittedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmittedData = async () => {
      try {
        setIsLoading(true);
        // This endpoint would fetch all submitted QC washing data
        const response = await fetch(`${API_BASE_URL}/api/qc-washing/all-submitted`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setSubmittedData(data.data); // Assuming 'data' contains the array of submitted records
        } else {
          setError(data.message || "Failed to fetch submitted data.");
        }
      } catch (err) {
        console.error("Error fetching submitted data:", err);
        setError("Could not fetch submitted data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmittedData();
  }, []);

  if (isLoading) {
    return <div className="text-center py-4">Loading submitted data...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Submitted QC Washing Reports</h2>
      {submittedData.length === 0 ? (
        <p>No submitted data found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                {/* Add more headers as needed */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submittedData.map((record) => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.orderNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.colorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.reportType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.formData?.result || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.userId || 'N/A'}</td>
                  {/* Render more data fields */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubmittedWashingDataPage;