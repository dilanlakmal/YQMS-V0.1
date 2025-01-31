import { useState, useEffect, useRef } from "react";

function MonoSearch({
  value,
  onSelect,
  placeholder,
  showSearchIcon,
  closeOnOutsideClick,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `http://localhost:5001/api/search-mono?digits=${searchTerm}`
          );
          const data = await response.json();
          setSuggestions(data);
          setIsDropdownOpen(true);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (closeOnOutsideClick) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeOnOutsideClick]);

  return (
    <div className="mb-4 relative" ref={searchRef}>
      {/* <label className="block text-sm font-medium text-gray-700 mb-1">
        ...
      </label> */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setSearchTerm(digits);
          }}
          className={`w-full px-3 py-2 border ${
            isDropdownOpen ? "rounded-t-md" : "rounded-md"
          } border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-t-0 border-gray-300 rounded-b-md shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((mono) => (
            <li
              key={mono}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer transition-colors"
              onClick={() => {
                onSelect(mono);
                setSuggestions([]);
                setSearchTerm("");
                setIsDropdownOpen(false);
              }}
            >
              <span className="font-mono">{mono}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MonoSearch;
