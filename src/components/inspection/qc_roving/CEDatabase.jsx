import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import Swal from "sweetalert2";

const CEDatabase = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [selectedMoNo, setSelectedMoNo] = useState("");
  const [styleNo, setStyleNo] = useState("");
  const [deptName, setDeptName] = useState("");
  const moNoDropdownRef = useRef(null);

  // Fetch MO Numbers when the user types in the MO No field
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-mo-numbers`,
          {
            params: { search: moNoSearch }
          }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch MO numbers."
        });
      }
    };

    fetchMoNumbers();
  }, [moNoSearch]);

  // Fetch Style No and Dept Name when an MO No is selected
  useEffect(() => {
    const fetchMoDetails = async () => {
      if (!selectedMoNo) {
        setStyleNo("");
        setDeptName("");
        setData([]);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-details`,
          {
            params: { stNo: selectedMoNo }
          }
        );
        const order = response.data;
        setStyleNo(order.By_Style || "N/A");
        setDeptName(order.Dept_Type || "N/A");
        // Sort orderData by Tg_No (lowest to highest, numerically)
        const sortedData = order.orderData
          .filter((item) => item.Tg_No != null)
          .sort((a, b) => {
            const tgNoA = parseInt(a.Tg_No, 10);
            const tgNoB = parseInt(b.Tg_No, 10);
            return tgNoA - tgNoB;
          });
        setData(sortedData);
      } catch (error) {
        console.error("Error fetching MO details:", error);
        setStyleNo("");
        setDeptName("");
        setData([]);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch MO details."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMoDetails();
  }, [selectedMoNo]);

  // Handle clicks outside the MO No dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Inline Orders Database - Operation Data
      </h2>

      {/* Filter Pane */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">
              MO No
            </label>
            <div className="relative" ref={moNoDropdownRef}>
              <input
                type="text"
                value={moNoSearch}
                onChange={(e) => {
                  setMoNoSearch(e.target.value);
                }}
                placeholder="Search MO No..."
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
              />
              {showMoNoDropdown && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {moNoOptions.map((option, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedMoNo(option);
                        setMoNoSearch(option);
                        setShowMoNoDropdown(false); // Close dropdown immediately
                      }}
                      className="p-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">
              Style No
            </label>
            <input
              type="text"
              value={styleNo}
              readOnly
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">
              Dept Name
            </label>
            <input
              type="text"
              value={deptName}
              readOnly
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center p-4">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center p-4 text-gray-600">
          No data available. Please select an MO No to view operation data.
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                  Tg_No
                </th>
                <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                  Tg_Name
                </th>
                <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                  Machine Code
                </th>
                <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                  Operation (Chi)
                </th>
                <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">
                  Operation (Kh)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index}>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {row.Tg_No || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {row.Tg_Code || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {row.Ma_Code || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {row.ch_name || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">
                    {row.kh_name || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CEDatabase;
