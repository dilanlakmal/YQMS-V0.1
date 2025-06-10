import {
  DocumentArrowUpIcon,
  TableCellsIcon,
  XCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import Papa from "papaparse";
import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

// Helper function to split an array into chunks of a specific size
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const FIXED_COLUMNS_CONFIG = [
  {
    key: "Inspection #",
    header: "Inspection #",
    minWidth: "w-80 max-w-80"
  },
  {
    key: "Inspector",
    header: "Inspector",
    minWidth: "min-w-[8rem]",
    dataClass: "whitespace-nowrap"
  },
  {
    key: "PO #",
    header: "PO #",
    minWidth: "min-w-[7rem]",
    dataClass: "whitespace-nowrap"
  },
  {
    key: "Style",
    header: "Style",
    minWidth: "min-w-[8rem]",
    dataClass: "whitespace-nowrap"
  },
  {
    key: "Report Type",
    header: "Report Type",
    minWidth: "min-w-[7rem]",
    dataClass: "whitespace-nowrap"
  },
  {
    key: "All Comments",
    header: "All Comments",
    minWidth: "min-w-[16rem]",
    dataClass: "break-words"
  },
  {
    key: "Sample Inspected",
    header: "Sample Inspected",
    minWidth: "min-w-[6rem]",
    dataClass: "whitespace-nowrap text-center"
  },
  {
    key: "Defect",
    header: "Defect",
    minWidth: "min-w-[16rem]"
  },
  {
    key: "Total Number of Defects",
    header: "Total Defects",
    minWidth: "min-w-[6rem]",
    dataClass: "whitespace-nowrap text-center"
  },
  {
    key: "Defect Rate",
    header: "Defect Rate",
    minWidth: "min-w-[6rem]",
    dataClass: "whitespace-nowrap text-center"
  },
  {
    key: "Submitted Inspection Date",
    header: "Submitted Date",
    minWidth: "min-w-[9rem]",
    dataClass: "whitespace-nowrap"
  },
  {
    key: "Inspection Result",
    header: "Result",
    minWidth: "min-w-[7rem]",
    dataClass: "whitespace-nowrap"
  }
];
const FIXED_COLUMN_KEYS = FIXED_COLUMNS_CONFIG.map((col) => col.key);

const ExcelUploadSubQA = () => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [error, setError] = useState("");

  const handleCommentChange = (rowIndex, newComment) => {
    setParsedData((prevData) =>
      prevData.map((row, idx) =>
        idx === rowIndex ? { ...row, "All Comments": newComment } : row
      )
    );
  };

  const processCsvData = (data) => {
    const transformedData = data.map((row) => {
      const fixedData = {};
      FIXED_COLUMN_KEYS.forEach((colName) => {
        const actualKey = Object.keys(row).find(
          (k) => k.trim().toLowerCase() === colName.trim().toLowerCase()
        );
        fixedData[colName] = actualKey ? row[actualKey] : "";
      });

      const defectDetails = [];
      Object.keys(row).forEach((key) => {
        const keyTrimmed = key.trim();
        if (
          !FIXED_COLUMN_KEYS.some(
            (fcKey) => fcKey.trim().toLowerCase() === keyTrimmed.toLowerCase()
          )
        ) {
          const qty = parseInt(row[key], 10);
          if (!isNaN(qty) && qty > 0) {
            let defectCodeLetter = "";
            let defectCodeNoStr = "";
            let defectName = "";

            // New Regex to capture:
            // Group 1: The first letter (A-Z)
            // Group 2: (Optional) Hyphen immediately after the letter
            // Group 3: The numbers and spaces part
            // Group 4: Everything after the hyphen that separates code from name (the defect name)
            // Examples:
            // F30 5-Packing-Others -> G1:F, G2:undefined, G3:30 5, G4:Packing-Others
            // C-6 2-Dirty mark   -> G1:C, G2:-,         G3:6 2, G4:Dirty mark
            // M-10-Color Mismatch -> G1:M, G2:-,         G3:10,  G4:Color Mismatch
            const match = keyTrimmed.match(
              /^([A-Z])(-)?([0-9\s.]*?)\s*-\s*(.*)$/
            );
            // Explanation of the new regex:
            // ^([A-Z])          : Group 1 - Starts with an uppercase letter.
            // (-)?              : Group 2 - Optionally matches and captures a hyphen immediately after the letter.
            // ([0-9\s.]*?)     : Group 3 - Matches and captures digits, spaces, and now explicitly dots (non-greedy `*?`).
            //                   Allows for numbers like "6", "6 2", "6.2". Non-greedy to stop before the separating hyphen.
            // \s*-\s*           : Matches the hyphen that separates the code part from the name part, allowing optional spaces around it.
            // (.*)$             : Group 4 - Captures the rest of the string as the defect name.

            if (match && match.length === 5) {
              // Now we expect 5 groups (index 0 is full match)
              defectCodeLetter = match[1]; // The first letter

              // Group 3 (match[3]) contains the number part.
              // Process numbers: trim, replace multiple spaces/dots with single, then replace space with dot.
              let rawNoPart = match[3].trim();
              defectCodeNoStr = rawNoPart
                .replace(/\s*\.\s*/g, ".")
                .replace(/\s+/g, "."); // Normalize dots and spaces to single dots

              defectName = match[4].trim(); // Everything after the separating hyphen
            } else {
              // Fallback if the primary regex doesn't match
              const firstHyphenIndex = keyTrimmed.indexOf("-");
              if (firstHyphenIndex !== -1) {
                const potentialCodePart = keyTrimmed
                  .substring(0, firstHyphenIndex)
                  .trim();
                defectName = keyTrimmed.substring(firstHyphenIndex + 1).trim();

                if (
                  potentialCodePart.length > 0 &&
                  /^[A-Z]/.test(potentialCodePart)
                ) {
                  defectCodeLetter = potentialCodePart[0];
                  let numPart = potentialCodePart.substring(1).trim();
                  // If the numPart itself starts with a hyphen (like in C-6), remove it.
                  if (numPart.startsWith("-")) {
                    numPart = numPart.substring(1).trim();
                  }
                  defectCodeNoStr = numPart
                    .replace(/\s*\.\s*/g, ".")
                    .replace(/\s+/g, ".");
                } else {
                  defectName = keyTrimmed;
                }
              } else {
                defectName = keyTrimmed;
              }
            }

            defectDetails.push({
              letter: defectCodeLetter,
              no: defectCodeNoStr,
              name: defectName,
              qty: qty
            });
          }
        }
      });
      return { ...fixedData, defectDetails };
    });
    return transformedData;
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      if (
        uploadedFile.type === "text/csv" ||
        uploadedFile.name.endsWith(".csv")
      ) {
        setFile(uploadedFile); // Keep the file object temporarily for UI
        setParsedData([]);
        setShowTable(false);
        setError("");
        setIsParsing(true);
        const reader = new FileReader();
        reader.onabort = () => {
          setError("File reading was aborted.");
          setIsParsing(false);
        };
        reader.onerror = () => {
          setError("File reading has failed.");
          setIsParsing(false);
        };
        reader.onload = () => {
          Papa.parse(reader.result, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                setError(
                  `Error parsing CSV: ${results.errors
                    .map((e) => e.message)
                    .join(", ")}`
                );
                setIsParsing(false);
                setFile(null); // Clear the invalid file from UI
                return;
              }

              // --- START: HEADER VALIDATION ---
              const csvHeaders = results.meta.fields.map((h) =>
                h.trim().toLowerCase()
              );
              const expectedHeaders = FIXED_COLUMN_KEYS.map((h) =>
                h.trim().toLowerCase()
              );
              const missingHeaders = [];

              for (const expectedHeader of expectedHeaders) {
                if (!csvHeaders.includes(expectedHeader)) {
                  // Find the original casing for the error message
                  const originalCaseHeader = FIXED_COLUMN_KEYS.find(
                    (key) => key.trim().toLowerCase() === expectedHeader
                  );
                  missingHeaders.push(originalCaseHeader || expectedHeader);
                }
              }

              if (missingHeaders.length > 0) {
                const missingHeadersString = missingHeaders.join(", ");
                setError(
                  `Missing column(s): [${missingHeadersString}]. Please upload a file with the correct columns.`
                );
                setIsParsing(false);
                setFile(null); // Clear the invalid file from UI state
                setParsedData([]); // Ensure no old data is shown
                return; // Stop further processing
              }
              // --- END: HEADER VALIDATION ---

              // If headers are valid, proceed to process and set data
              setParsedData(processCsvData(results.data));
              setIsParsing(false);
              // File is valid, so no need to clear `file` state here, it's already set
            },
            error: (err) => {
              setError(`PapaParse error: ${err.message}`);
              setIsParsing(false);
              setFile(null); // Clear the invalid file from UI
            }
          });
        };
        reader.readAsText(uploadedFile);
      } else {
        setError("Invalid file type. Please upload a CSV file.");
        setFile(null); // Not a CSV, clear file
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false
  });

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setParsedData([]);
    setShowTable(false);
    setIsParsing(false);
    setError("");
  };

  const memoizedTable = useMemo(() => {
    if (!parsedData.length) return null;

    return (
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg p-4 mt-8 w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowTable(false)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors duration-150"
          >
            <XMarkIcon className="h-5 w-5 mr-2" /> Close Table
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {FIXED_COLUMNS_CONFIG.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 border border-gray-300 ${
                    col.minWidth
                  } ${
                    col.key === "Defect" ||
                    col.key === "Total Number of Defects" ||
                    col.key === "Defect Rate" ||
                    col.key === "Sample Inspected"
                      ? "text-center"
                      : ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
              <th
                scope="col"
                className="px-3 py-3.5 text-center text-xs sm:text-sm font-semibold text-gray-900 border border-gray-300 min-w-[5rem]"
              >
                Letter
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-center text-xs sm:text-sm font-semibold text-gray-900 border border-gray-300 min-w-[5rem]"
              >
                No
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900 border border-gray-300 min-w-[20rem] max-w-[30rem]"
              >
                Defect Name
              </th>{" "}
              {/* Increased width */}
              <th
                scope="col"
                className="px-3 py-3.5 text-center text-xs sm:text-sm font-semibold text-gray-900 border border-gray-300 min-w-[4rem]"
              >
                Qty
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {parsedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="divide-x divide-gray-200 hover:bg-gray-50 transition-colors duration-150"
              >
                {FIXED_COLUMNS_CONFIG.map((col) => {
                  if (col.key === "Inspection #") {
                    const inspectionValue = row[col.key];
                    let numbersToDisplay = [];
                    if (typeof inspectionValue === "string") {
                      numbersToDisplay = inspectionValue
                        .split(",")
                        .map((n) => n.trim())
                        .filter((n) => n);
                    } else if (inspectionValue != null) {
                      numbersToDisplay = [String(inspectionValue)];
                    }
                    const numberPairs = chunk(numbersToDisplay, 2);
                    return (
                      <td
                        key={`${col.key}-${rowIndex}`}
                        className={`px-1.5 py-2 text-xs sm:text-sm text-gray-700 border-b border-gray-300 align-top ${col.minWidth} overflow-hidden`}
                      >
                        {numbersToDisplay.length > 0 ? (
                          <div className="flex flex-col space-y-0.5">
                            {numberPairs.map((pair, pairIndex) => (
                              <div key={pairIndex} className="flex -mx-0.5">
                                <span className="flex-1 min-w-0 px-0.5 text-left truncate">
                                  {pair[0]}
                                </span>
                                {pair[1] && (
                                  <span className="flex-1 min-w-0 px-0.5 text-left truncate">
                                    {pair[1]}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span> </span>
                        )}
                      </td>
                    );
                  } else if (col.key === "Defect") {
                    const defectValue = row[col.key];
                    let defectItems = [];
                    if (typeof defectValue === "string") {
                      defectItems = defectValue
                        .split(",")
                        .map((item) => item.trim())
                        .filter((item) => item);
                    } else if (defectValue != null) {
                      defectItems = [String(defectValue)];
                    }
                    return (
                      <td
                        key={`${col.key}-${rowIndex}`}
                        className={`px-3 py-4 text-xs sm:text-sm text-gray-700 border-b border-gray-300 align-top text-center ${col.minWidth}`}
                      >
                        {defectItems.length > 0 ? (
                          defectItems.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className={itemIndex > 0 ? "pt-0.5" : ""}
                            >
                              {item}
                            </div>
                          ))
                        ) : (
                          <span> </span>
                        )}
                      </td>
                    );
                  } else if (col.key === "All Comments") {
                    return (
                      <td
                        key={`${col.key}-${rowIndex}`}
                        className={`px-1 py-1 text-xs sm:text-sm text-gray-700 border-b border-gray-300 align-top ${
                          col.minWidth
                        } ${col.dataClass || ""}`}
                      >
                        <textarea
                          value={row[col.key]}
                          onChange={(e) =>
                            handleCommentChange(rowIndex, e.target.value)
                          }
                          rows="3"
                          className="w-full p-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm resize-y"
                        />
                      </td>
                    );
                  }
                  return (
                    <td
                      key={`${col.key}-${rowIndex}`}
                      className={`px-3 py-4 text-xs sm:text-sm text-gray-700 border-b border-gray-300 align-top ${
                        col.minWidth
                      } ${col.dataClass || ""}`}
                    >
                      {row[col.key]}
                    </td>
                  );
                })}
                <td className="px-3 py-4 text-xs sm:text-sm text-gray-700 border-b border-gray-300 min-w-[5rem] align-top text-center">
                  {row.defectDetails?.map((defect, defectIndex) => (
                    <div
                      key={`letter-${defectIndex}`}
                      className={`py-1 ${
                        defectIndex > 0 ? "border-t border-gray-200" : ""
                      }`}
                    >
                      {defect.letter}
                    </div>
                  ))}
                </td>
                <td className="px-3 py-4 text-xs sm:text-sm text-gray-700 border-b border-gray-300 min-w-[5rem] align-top text-center">
                  {row.defectDetails?.map((defect, defectIndex) => (
                    <div
                      key={`no-${defectIndex}`}
                      className={`py-1 ${
                        defectIndex > 0 ? "border-t border-gray-200" : ""
                      }`}
                    >
                      {defect.no}
                    </div>
                  ))}
                </td>
                <td className="px-3 py-4 text-xs text-gray-700 border-b border-gray-300 min-w-[20rem] max-w-[30rem] align-top break-words">
                  {" "}
                  {/* text-xs applied here */}
                  {row.defectDetails?.map((defect, defectIndex) => (
                    <div
                      key={`name-${defectIndex}`}
                      className={`py-1 ${
                        defectIndex > 0 ? "border-t border-gray-200" : ""
                      }`}
                    >
                      {defect.name}
                    </div>
                  ))}
                </td>
                <td className="px-3 py-4 text-xs sm:text-sm text-gray-700 border-b border-gray-300 min-w-[4rem] align-top text-center">
                  {row.defectDetails?.map((defect, defectIndex) => (
                    <div
                      key={`qty-${defectIndex}`}
                      className={`py-1 ${
                        defectIndex > 0 ? "border-t border-gray-200" : ""
                      }`}
                    >
                      {defect.qty}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {parsedData.length === 0 && (
              <tr>
                <td
                  colSpan={FIXED_COLUMNS_CONFIG.length + 4}
                  className="px-3 py-10 text-center text-sm text-gray-500 border-b border-gray-300"
                >
                  No data to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }, [parsedData, setShowTable, handleCommentChange]);

  return (
    <div className="p-4 sm:p-6 w-full">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
        Upload Sub Con QA Excel File
      </h2>
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8 max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-8 sm:p-10 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? "border-indigo-600 bg-indigo-50"
              : "border-gray-300 hover:border-gray-400"
          } ${file ? "border-green-500 bg-green-50" : ""}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center">
              <DocumentArrowUpIcon className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mb-2" />
              <p className="text-green-700 font-medium text-sm sm:text-base">
                {file.name}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                ({(file.size / 1024).toFixed(2)} KB)
              </p>
              <button
                onClick={removeFile}
                className="mt-3 text-red-500 hover:text-red-700 transition-colors duration-150"
                title="Remove file"
              >
                <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <DocumentArrowUpIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2" />
              <p className="text-gray-700 text-sm sm:text-base">
                {isDragActive
                  ? "Drop the file here ..."
                  : "Drag 'n' drop a CSV file here, or click to select"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                CSV files only
              </p>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">
            {error}
          </p>
        )}
        {isParsing && (
          <div className="mt-6">
            <p className="text-sm text-indigo-600 mb-2 text-center">
              Analyzing file...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
        {parsedData.length > 0 && !isParsing && !showTable && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowTable(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-md inline-flex items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              <TableCellsIcon className="h-5 w-5 mr-2" /> View Table
            </button>
          </div>
        )}
      </div>
      {showTable && memoizedTable}
    </div>
  );
};

export default ExcelUploadSubQA;
