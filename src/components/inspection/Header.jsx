import { useState } from "react";

function Header({ inspectionData, editable = false }) {
  const [editedData, setEditedData] = useState(inspectionData || {});

  if (!inspectionData) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg shadow mb-4">
        <p className="text-yellow-700">
          No inspection data available. Please start from the Details page.
        </p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    if (!editable) return;
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const data = editable ? editedData : inspectionData;

  function formatText(text) {
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
  }

  
  return (
    <div className="overflow-x-auto bg-white pt-2 pb-3 rounded-lg mb-2git ">
      <div className="flex space-x-4 text-sm items-center">
        {Object.entries(data).map(([key, value]) => (
          <div  key={key} className='text-center border-r border-b border-gray-300 pr-4 pt-2 pb-2'>
            <span className="font-bold">{formatText(key)}: </span>
            {editable ? (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                className="border-r border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            ) : (
              <span>
                {value instanceof Date ? value.toLocaleDateString() : value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


export default Header;
