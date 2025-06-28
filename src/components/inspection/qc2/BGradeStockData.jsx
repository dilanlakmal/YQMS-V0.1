import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import { Loader2 } from "lucide-react";

const BGradeStockData = ({ filters }) => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!filters.date) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/b-grade-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });
        if (!response.ok) throw new Error("Failed to fetch B-Grade stock data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]); // Refetch whenever filters change

  const totalBGradeQty = data.reduce(
    (sum, item) => sum + (item.bGradeQty || 0),
    0
  );

  const renderDefectDetails = (details) => {
    return details.map((garment) => (
      <div key={garment.garmentNumber} className="py-1">
        <span className="font-semibold">G:{garment.garmentNumber} - </span>
        {garment.defectDetails
          .map((d) => `${d.defectName}: ${d.defectCount}`)
          .join(", ")}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4 bg-blue-50 p-4 rounded-lg shadow-sm flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-800">
          Total B-Grade Qty
        </h3>
        <span className="text-2xl font-bold text-blue-900">
          {totalBGradeQty}
        </span>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MO No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Line No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                B-Grade Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Defect Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={`${item.package_no}-${index}`}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {item.moNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {item.package_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {item.lineNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {item.color}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {item.size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                  {item.bGradeQty}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {renderDefectDetails(item.defectDetails)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No B-Grade stock found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default BGradeStockData;
