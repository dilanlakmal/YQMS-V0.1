import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";

const CEDatabase = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/ymce-system-data`
        );
        setData(response.data);
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          "Failed to fetch data from YMCE_SYSTEM database.";
        setError(errorMessage);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage
        });
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        YMCE_SYSTEM Database - ViewTg Data
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                St_No
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                By_Style
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Tg_No
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Tg_Code
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Ma_Code
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                ch_name
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                kh_name
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                Dept_Type
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                PiecesQty
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                OperationPrice
              </th>
              <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                GST
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index}>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.St_No}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.By_Style}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.Tg_No}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.Tg_Code}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.Ma_Code}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.ch_name}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.kh_name}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.Dept_Type}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.PiecesQty}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.OperationPrice}
                </td>
                <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                  {row.GST}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEDatabase;
