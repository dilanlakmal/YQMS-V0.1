// src/components/inspection/ExpandCollapseControls.jsx
import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const ExpandCollapseControls = ({ onExpandAll, onCollapseAll }) => {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={onExpandAll}
        className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        title="Expand All"
      >
        <ChevronDown size={20} />
      </button>
      <button
        onClick={onCollapseAll}
        className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        title="Collapse All"
      >
        <ChevronUp size={20} />
      </button>
    </div>
  );
};

export default ExpandCollapseControls;
