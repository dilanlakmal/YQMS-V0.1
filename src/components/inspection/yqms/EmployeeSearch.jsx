// src/components/inspection/yqms/EmployeeSearch.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { Search, Loader2 } from "lucide-react";

const EmployeeSearch = ({
  onSelectEmployee,
  placeholder = "Search by ID or Name..."
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const handleClickOutside = (event) => {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // eslint-disable-next-line
  const fetchUsers = useCallback(
    debounce(async (term) => {
      if (term.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/search`, {
          params: { term }
        });
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error("Error fetching users:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchTerm) {
      fetchUsers(searchTerm);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [searchTerm, fetchUsers]);

  const handleSelect = (employee) => {
    onSelectEmployee(employee);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>
      {showResults && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.length > 0
            ? results.map((user) => (
                <li
                  key={user.emp_id}
                  onClick={() => handleSelect(user)}
                  className="flex items-center p-3 hover:bg-blue-50 cursor-pointer"
                >
                  <img
                    src={user.face_photo || "https://via.placeholder.com/40"}
                    alt={user.eng_name}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {user.eng_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.emp_id} - {user.job_title}
                    </p>
                  </div>
                </li>
              ))
            : !isLoading && (
                <li className="p-3 text-sm text-gray-500 text-center">
                  No results found.
                </li>
              )}
        </ul>
      )}
    </div>
  );
};

export default EmployeeSearch;
