import React from "react";

const SubConSelection = ({
  isSubCon,
  setIsSubCon,
  subConName,
  setSubConName,
}) => {
  const subConNames = ["Sunicon", "Elite", "SYD"];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Sub - con
      </label>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="subCon"
              value="No"
              checked={!isSubCon}
              onChange={() => {
                setIsSubCon(false);
                setSubConName("");
              }}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">No</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="subCon"
              value="Yes"
              checked={isSubCon}
              onChange={() => setIsSubCon(true)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Yes</span>
          </label>
        </div>

        {isSubCon && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub con Factory name
            </label>
            <select
              value={subConName}
              onChange={(e) => setSubConName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Sub con Factory</option>
              {subConNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubConSelection;
