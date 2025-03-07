import React, { useEffect, useState } from "react";
import { allDefects } from "../..//constants/QC Inspection/defects"; // Adjust the path as necessary

const EditModal = ({ isOpen, onClose, data, onSave }) => {
  const [garmentNumber, setGarmentNumber] = useState("");
  const [packageNo, setPackageNo] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [rejectGarments, setRejectGarments] = useState([]);
  const [selectedDefect, setSelectedDefect] = useState("");
  const [selectedGarment, setSelectedGarment] = useState("");
  const [language, setLanguage] = useState("english");

  useEffect(() => {
    if (data) {
      setGarmentNumber(data.moNo || "");
      setPackageNo(data.package_no || "");
      setColor(data.color || "");
      setSize(data.size || "");
      setRejectGarments(data.rejectGarments || []);
    }
  }, [data]);

  const handleAddDefect = () => {
    if (selectedDefect && selectedGarment) {
      const defect = allDefects.find((d) => d.english === selectedDefect);
      if (defect) {
        const garmentIndex = rejectGarments.findIndex(
          (garment) => garment.garment_defect_id === selectedGarment
        );
        if (garmentIndex !== -1) {
          const newRejectGarments = [...rejectGarments];
          newRejectGarments[garmentIndex].defects.push({
            name: defect.english,
            count: 0,
            repair: defect.repair,
          });
          setRejectGarments(newRejectGarments);
          setSelectedDefect("");
        }
      }
    }
  };

  const handleDeleteDefect = (garmentIndex, defectIndex) => {
    const newRejectGarments = [...rejectGarments];
    newRejectGarments[garmentIndex].defects = newRejectGarments[
      garmentIndex
    ].defects.filter((_, i) => i !== defectIndex);
    setRejectGarments(newRejectGarments);
  };

  const handleIncrement = (garmentIndex, defectIndex) => {
    const newRejectGarments = [...rejectGarments];
    newRejectGarments[garmentIndex].defects[defectIndex].count += 1;
    setRejectGarments(newRejectGarments);
  };

  const handleDecrement = (garmentIndex, defectIndex) => {
    const newRejectGarments = [...rejectGarments];
    newRejectGarments[garmentIndex].defects[defectIndex].count = Math.max(
      newRejectGarments[garmentIndex].defects[defectIndex].count - 1,
      0
    );
    setRejectGarments(newRejectGarments);
  };

  const handleSave = () => {
    const updatedData = {
      moNo: garmentNumber,
      package_no: packageNo,
      color: color,
      size: size,
      rejectGarments: rejectGarments,
    };
    onSave(updatedData);
    onClose();
  };

  const getDefectName = (defectName) => {
    const defect = allDefects.find((d) => d.english === defectName);
    if (!defect) return defectName;
    switch (language) {
      case "khmer":
        return defect.khmer;
      case "chinese":
        return defect.chinese;
      default:
        return defect.english;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-5/6  max-w-3xl md:w-1/2 m-4 p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Edit Garment</h2>

        {/* Attractive Box for Form Fields */}
        <div className="bg-blue-100 p-4 rounded-lg shadow-inner mb-2 md:mb-4 overflow-x-auto">
          <div className="flex flex-row md:flex-row gap-2 md:gap-4 min-w-[400px] md:min-w-0">
            <div className="flex-1">
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                MO No
              </label>
              <input
                type="text"
                value={garmentNumber}
                onChange={(e) => setGarmentNumber(e.target.value)}
                className="border p-1 md:p-2 rounded w-full bg-gray-100 text-gray-800"
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Package No
              </label>
              <input
                type="text"
                value={packageNo}
                onChange={(e) => setPackageNo(e.target.value)}
                className="border p-1 md:p-2 rounded w-full bg-gray-100 text-gray-800"
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="border p-1 md:p-2 rounded w-full bg-gray-100 text-gray-800"
                readOnly
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm font-semibold text-gray-700">
                Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="border p-1 md:p-2 rounded w-full bg-gray-100 text-gray-800"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Defects Section */}
        <div className="mb-4">
          <h3 className="text-lg md:text-xl font-semibold mb-2">Defects</h3>
          <div className="flex flex-col md:flex-row items-center mb-4 space-y-2 md:space-y-0 md:space-x-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border p-2 rounded w-full md:w-1/5"
            >
              <option value="english">English</option>
              <option value="khmer">Khmer</option>
              <option value="chinese">Chinese</option>
            </select>
            <div className="flex flex-row w-full space-x-2">
                <select
                  value={selectedGarment}
                  onChange={(e) => setSelectedGarment(e.target.value)}
                  className="border p-2 rounded w-1/2"
                >
                  <option value="">Select a garment</option>
                  {rejectGarments.map((garment, index) => (
                    <option key={index} value={garment.garment_defect_id}>
                      Garment {index + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDefect}
                  onChange={(e) => setSelectedDefect(e.target.value)}
                  className="border p-2 rounded w-1/2"
                >
                  <option value="">Select a defect</option>
                  {allDefects.map((defect) => (
                    <option key={defect.code} value={defect.english}>
                      {getDefectName(defect.english)}
                    </option>
                  ))}
                </select>
              </div>
            <button
              onClick={handleAddDefect}
              className="bg-blue-500 text-white px-4 py-2 rounded w-1/2 md:w-auto"
            >
              Add Defect
            </button>
          </div>

          {/* Defects Table */}
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full bg-white shadow-md rounded-lg border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                    Garment No
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                    Defect Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                    Count
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {rejectGarments.flatMap((garment, garmentIndex) =>
                  garment.defects.map((defect, defectIndex) => (
                    <tr
                      key={`${garmentIndex}-${defectIndex}`}
                      className="hover:bg-gray-100"
                    >
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        G. {garmentIndex + 1}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {getDefectName(defect.name)}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() =>
                              handleDecrement(garmentIndex, defectIndex)
                            }
                            className="bg-gray-300 text-gray-700 px-2 py-1 rounded-l"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">
                            {defect.count}
                          </span>
                          <button
                            onClick={() =>
                              handleIncrement(garmentIndex, defectIndex)
                            }
                            className="bg-gray-300 text-gray-700 px-2 py-1 rounded-r"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        <button
                          onClick={() =>
                            handleDeleteDefect(garmentIndex, defectIndex)
                          }
                          className="bg-red-500 text-white px-2 py-1 rounded w-full md:w-auto"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-row md:flex-row justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded w-full md:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full md:w-auto"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
