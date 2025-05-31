// import { useEffect, useRef, useState } from "react";
// import { API_BASE_URL } from "../../../config";

// function MonoSearch({
//   value,
//   onSelect,
//   placeholder,
//   showSearchIcon,
//   closeOnOutsideClick,
// }) {
//   const [suggestions, setSuggestions] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const searchRef = useRef(null);

//   useEffect(() => {
//     const handler = setTimeout(async () => {
//       if (searchTerm.length > 0) {
//         // Changed from >= 3 to > 0
//         setIsLoading(true);
//         try {
//           const response = await fetch(
//             `${API_BASE_URL}/api/search-mono?term=${searchTerm}` // Changed 'digits' to 'term' for clarity
//           );
//           const data = await response.json();
//           setSuggestions(data);
//           setIsDropdownOpen(true);
//         } catch (error) {
//           console.error("Search failed:", error);
//           setSuggestions([]);
//         } finally {
//           setIsLoading(false);
//         }
//       } else {
//         setSuggestions([]);
//         setIsDropdownOpen(false);
//       }
//     }, 300); // Debounce delay of 300ms

//     return () => clearTimeout(handler);
//   }, [searchTerm]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     if (closeOnOutsideClick) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [closeOnOutsideClick]);

//   const handleSelect = (mono) => {
//     onSelect(mono);
//     setSearchTerm(mono); // Display the selected MO No in the input
//     setSuggestions([]);
//     setIsDropdownOpen(false);
//   };

//   return (
//     <div className="mb-4 relative" ref={searchRef}>
//       <div className="relative">
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => {
//             const input = e.target.value;
//             setSearchTerm(input); // Allow any input, not just digits
//           }}
//           className={`w-full px-3 py-2 border ${
//             isDropdownOpen ? "rounded-t-md" : "rounded-md"
//           } border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
//           placeholder={placeholder}
//         />
//         {isLoading && (
//           <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
//           </div>
//         )}
//       </div>

//       {isDropdownOpen && suggestions.length > 0 && (
//         <ul className="absolute z-10 w-full bg-white border border-t-0 border-gray-300 rounded-b-md shadow-lg max-h-80 overflow-y-auto">
//           {suggestions.map((mono) => (
//             <li
//               key={mono}
//               className="px-3 py-2 hover:bg-indigo-50 cursor-pointer transition-colors"
//               onClick={() => handleSelect(mono)}
//             >
//               <span className="font-mono">{mono}</span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// export default MonoSearch;

// src/components/forms/MonoSearch.jsx
import React, { useEffect, useRef, useState } from "react"; // Added React for clarity, though not strictly necessary for this file.
import { API_BASE_URL } from "../../../config"; // Assuming this path is correct

function MonoSearch({
  value, // This is formData.selectedMono from the parent
  onSelect,
  placeholder,
  showSearchIcon, // This prop is not currently used in the JSX
  closeOnOutsideClick,
  inputClassName // Added to allow parent to pass custom input classes
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState(value || ""); // Initialize with passed value
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // ** THIS IS THE FIX: Sync internal searchTerm with the value prop from parent **
  useEffect(() => {
    setSearchTerm(value || ""); // If parent's value changes, update what's shown in input
  }, [value]);
  // ***************************************************************************

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm && searchTerm !== value && searchTerm.length > 0) {
        // Only search if searchTerm is different from current selected value
        setIsLoading(true);
        setIsDropdownOpen(true); // Open dropdown when typing starts for search
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/search-mono?term=${searchTerm}`
          );
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error("Search failed:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else if (!searchTerm) {
        // Clear suggestions if search term is empty
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, value, API_BASE_URL]); // Added value to dependency to re-evaluate search condition

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        // Optional: If clicking outside and searchTerm is not the selected value, revert to selected value
        // if (value && searchTerm !== value) {
        //   setSearchTerm(value);
        // }
      }
    };

    if (closeOnOutsideClick && isDropdownOpen) {
      // Only add listener if dropdown is open
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeOnOutsideClick, isDropdownOpen, value, searchTerm]); // Added isDropdownOpen, value, searchTerm

  const handleSelect = (mono) => {
    onSelect(mono); // Notify parent
    setSearchTerm(mono); // Display the selected MO No in the input
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!newSearchTerm) {
      // If input is cleared, also clear selection in parent
      onSelect(""); // Notify parent that selection is cleared
      setIsDropdownOpen(false);
      setSuggestions([]);
    } else if (newSearchTerm.length > 0 && !isDropdownOpen) {
      // If typing starts and dropdown is closed, open it
      setIsDropdownOpen(true);
    }
  };

  const handleInputFocus = () => {
    // Optionally, open dropdown if there's a search term or existing suggestions
    if (searchTerm && suggestions.length > 0) {
      setIsDropdownOpen(true);
    } else if (searchTerm && searchTerm !== value) {
      // If user typed something different from selected, trigger search
      // This will trigger the debounced search useEffect
    }
  };

  return (
    <div className="mb-4 relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm} // Input field is bound to internal searchTerm
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          // Consider onBlur if you want to revert to 'value' or close dropdown
          // onBlur={() => setTimeout(() => {
          //   if (!searchRef.current?.contains(document.activeElement)) { // check if focus moved outside component
          //       setIsDropdownOpen(false);
          //       if (value && searchTerm !== value) setSearchTerm(value); // Revert if not selected
          //   }
          // }, 150)}
          className={`w-full px-3 py-2 border ${
            isDropdownOpen && suggestions.length > 0
              ? "rounded-t-md"
              : "rounded-md"
          } border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            inputClassName || ""
          }`}
          placeholder={placeholder}
        />
        {showSearchIcon &&
          !isLoading && ( // Example usage of showSearchIcon
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-t-0 border-gray-300 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
          {" "}
          {/* Increased z-index, reduced max-h */}
          {suggestions.map((mono) => (
            <li
              key={mono}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer transition-colors text-sm" // Made text smaller
              onClick={() => handleSelect(mono)}
              onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click registers
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