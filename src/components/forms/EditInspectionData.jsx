import React, { useState, useEffect } from "react";
import { allDefects } from "../../constants/QC Inspection/defects"; // Adjust the path as necessary

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
    newRejectGarments[garmentIndex].defects = newRejectGarments[garmentIndex].defects.filter(
      (_, i) => i !== defectIndex
    );
    setRejectGarments(newRejectGarments);
  };

  const handleDefectChange = (garmentIndex, defectIndex, field, value) => {
    const newRejectGarments = [...rejectGarments];
    newRejectGarments[garmentIndex].defects[defectIndex][field] = value;
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow-lg w-1/2">
        <h2 className="text-xl mb-4">Edit Garment</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block mb-1">MO No</label>
            <input
              type="text"
              value={garmentNumber}
              onChange={(e) => setGarmentNumber(e.target.value)}
              className="border p-2 rounded w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1">Package No</label>
            <input
              type="text"
              value={packageNo}
              onChange={(e) => setPackageNo(e.target.value)}
              className="border p-2 rounded w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="border p-2 rounded w-full"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1">Size</label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="border p-2 rounded w-full"
              readOnly
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg mb-2">Defects</h3>
          <div className="flex items-center mb-4 space-x-2">
            <div className="w-1/5">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="english">English</option>
                <option value="khmer">Khmer</option>
                <option value="chinese">Chinese</option>
              </select>
            </div>
            <div className="w-1/3">
              <select
                value={selectedGarment}
                onChange={(e) => setSelectedGarment(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select a garment</option>
                {rejectGarments.map((garment, index) => (
                  <option key={index} value={garment.garment_defect_id}>
                    Garment {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-1/3">
              <select
                value={selectedDefect}
                onChange={(e) => setSelectedDefect(e.target.value)}
                className="border p-2 rounded w-full"
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
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Defect
            </button>
          </div>

          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">No</th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">Garment No</th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">Defect Name</th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">Count</th>
                <th className="py-2 px-4 border-b border-gray-200 font-bold text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {rejectGarments.flatMap((garment, garmentIndex) =>
                garment.defects.map((defect, defectIndex) => (
                  <tr key={`${garmentIndex}-${defectIndex}`} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">{garmentIndex + 1}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">Garment {garmentIndex + 1}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">{getDefectName(defect.name)}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDecrement(garmentIndex, defectIndex)}
                          className="bg-gray-300 text-gray-700 px-2 py-1 rounded-l"
                        >
                          -
                        </button>
                        <span className="px-4 text-center">{defect.count}</span>
                        <button
                          onClick={() => handleIncrement(garmentIndex, defectIndex)}
                          className="bg-gray-300 text-gray-700 px-2 py-1 rounded-r"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      <button
                        onClick={() => handleDeleteDefect(garmentIndex, defectIndex)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
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

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;

