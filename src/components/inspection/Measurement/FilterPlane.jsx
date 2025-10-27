import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../config.js';
import { debounce } from 'lodash'; // Assuming lodash is in your project

const FilterPlane = ({ onFilter, loading }) => {
  const [styleNo, setStyleNo] = useState('');
  const [washType, setWashType] = useState('beforeWash');
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

  // Debounced function to fetch suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length > 0) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/measurement/styles/search?query=${query}`);
          setSuggestions(response.data);
          setIsSuggestionsVisible(true);
        } catch (error) {
          console.error("Failed to fetch style suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 300), // 300ms delay
    []
  );

  useEffect(() => {
    fetchSuggestions(styleNo);
  }, [styleNo, fetchSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    setStyleNo(suggestion);
    setIsSuggestionsVisible(false);
    onFilter({ styleNo: suggestion, washType });
  };

  const handleWashTypeChange = (newWashType) => {
    setWashType(newWashType);
    // If a style number is already selected, re-run the filter with the new wash type
    if (styleNo) {
      onFilter({ styleNo, washType: newWashType });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      {/* The form tag is kept for semantic structure, but onSubmit is removed */}
      <div className="grid sm:grid-cols-3 gap-4 items-end">
        {/* The surrounding div for the input is changed to a form to prevent layout shifts, 
            but the onSubmit handler is removed to fix the error. */}
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col relative">
          <label htmlFor="styleNo" className="mb-1 font-semibold text-gray-700">Style No</label>
          <input
            id="styleNo"
            type="text"
            value={styleNo}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => setStyleNo(e.target.value)}
            placeholder="e.g., STYLE123"
            autoComplete="off"
            onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 150)} // Hide on blur with a small delay
          />
          {isSuggestionsVisible && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-10 max-h-60 overflow-y-auto shadow-lg">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => handleSuggestionClick(suggestion)} // Use onMouseDown to fire before onBlur
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="flex flex-col">
          <label htmlFor="washType" className="mb-1 font-semibold text-gray-700">Wash Type</label>
          <select
            id="washType"
            value={washType}
            onChange={(e) => handleWashTypeChange(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="beforeWash">Before Wash</option>
            <option value="afterWash">After Wash</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPlane;
