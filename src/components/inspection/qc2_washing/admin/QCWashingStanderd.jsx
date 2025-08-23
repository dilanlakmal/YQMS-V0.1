import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../../config";
import { FaThermometerHalf, FaClock, FaFlask, FaTint } from "react-icons/fa";
import Swal from "sweetalert2";

const WASH_TYPES = ["Normal Wash", "Acid Wash", "Garment Dye", "Soft Wash"];

const MACHINE_TYPES = [
  {
    key: "washingMachine",
    label: "Washing Machine",
    fields: ["temperature", "time", "silicon", "softener"]
  },
  { key: "tumbleDry", label: "Tumble Dry", fields: ["temperature", "time"] }
];

const FIELD_LABELS = {
  temperature: "Temp (°C)",
  time: "Time (min)",
  silicon: "Silicon (g)",
  softener: "Softener (g)"
};

const FIELD_ICONS = {
  temperature: <FaThermometerHalf className="text-blue-500 mr-1" />,
  time: <FaClock className="text-yellow-500 mr-1" />,
  silicon: <FaFlask className="text-purple-500 mr-1" />,
  softener: <FaTint className="text-pink-500 mr-1" />
};

export default function QCWashingStandardTable() {
  const [standards, setStandards] = useState({});
  // Change loading to track each wash type separately
  const [loadingStates, setLoadingStates] = useState({});

  // Fetch standards on mount
  const fetchStandards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing/standards`);
      const data = await response.json();

      if (data.success) {
        // Convert array to object by washType for easy access
        const obj = {};
        data.data.forEach((item) => {
          obj[item.washType] = item;
        });
        setStandards(obj);
      } else {
        setStandards({});
      }
    } catch (error) {
      setStandards({});
      console.error("Error fetching standards:", error);
      Swal.fire({
        icon: "error",
        title: "Error fetching standards",
        text: error.message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: "top-end",
        toast: true
      });
    }
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  // Handle input change
  const handleChange = (washType, machineKey, field, value) => {
    setStandards((prev) => ({
      ...prev,
      [washType]: {
        ...prev[washType],
        [machineKey]: {
          ...((prev[washType] && prev[washType][machineKey]) || {}),
          [field]: value
        }
      }
    }));
  };

  // Save or update - now handles loading state per wash type
  const handleSave = async (washType) => {
    if (!washType) return;

    // Set loading state for this specific wash type
    setLoadingStates((prev) => ({ ...prev, [washType]: true }));

    try {
      const body = {
        washType,
        washingMachine: standards[washType]?.washingMachine || {},
        tumbleDry: standards[washType]?.tumbleDry || {}
      };

      const response = await fetch(`${API_BASE_URL}/api/qc-washing/standards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setStandards((prev) => ({ ...prev, [washType]: data.data }));
        Swal.fire({
          icon: "success",
          title: `${washType} standards saved successfully!`,
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to save standards",
          text: data.message || "Unknown error occurred",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          position: "top-end",
          toast: true
        });
      }
    } catch (error) {
      console.error("Error saving standards:", error);
      Swal.fire({
        icon: "error",
        title: "Error saving standards",
        text: error.message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        position: "top-end",
        toast: true
      });
    } finally {
      // Clear loading state for this specific wash type
      setLoadingStates((prev) => ({ ...prev, [washType]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {WASH_TYPES.map((washType) => (
        <div key={washType} className="mb-8">
          <h2 className="text-lg font-bold mb-2">{washType}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MACHINE_TYPES.map((machine) => (
              <div
                key={machine.key}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded shadow"
              >
                <h3 className="font-semibold mb-2 dark:text-white">
                  {machine.label}
                </h3>
                <table className="w-full">
                  <thead>
                    <tr>
                      {machine.fields.map((field) => (
                        <th
                          key={field}
                          className="text-left px-2 py-1 dark:text-white"
                        >
                          <div className="flex items-center">
                            {FIELD_ICONS[field]}
                            {FIELD_LABELS[field]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {machine.fields.map((field) => (
                        <td key={field} className="px-2 py-1">
                          <input
                            type="number"
                            className="border px-2 py-1 rounded w-20 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                            value={
                              standards[washType]?.[machine.key]?.[field] ?? ""
                            }
                            onChange={(e) =>
                              handleChange(
                                washType,
                                machine.key,
                                field,
                                e.target.value
                              )
                            }
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <button
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            onClick={() => handleSave(washType)}
            disabled={loadingStates[washType]} // Check loading state for this specific wash type
          >
            {loadingStates[washType]
              ? "Saving..."
              : `Save ${washType} Standards`}
          </button>
        </div>
      ))}
    </div>
  );
}
