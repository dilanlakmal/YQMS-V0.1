import { AlertTriangle, Eye, FileUp, Loader, Save, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { read, utils } from "xlsx";
import { API_BASE_URL } from "../../../../config";

const ANFUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = (keepFile = false) => {
    setPreviewData(null);
    setError("");
    if (!keepFile) {
      setSelectedFile(null);
      if (document.getElementById("anf-file-upload")) {
        document.getElementById("anf-file-upload").value = "";
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        setSelectedFile(file);
        resetState(true);
      } else {
        setError("Invalid file type. Please upload a .xlsx or .xls file.");
        setSelectedFile(null);
      }
    }
  };

  const handleDragEvents = (e) => e.preventDefault();
  const handleDragEnter = (e) => {
    handleDragEvents(e);
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  //Preview Data from Excel
  const handlePreview = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });

      const header = {
        company: jsonData[0]?.[0] || "N/A",
        title: jsonData[1]?.[0] || "N/A",
        buyer: "ANF",
        moNo: jsonData[4]?.[1] || "N/A",
        custStyle: jsonData[10]?.[1] || "N/A",
        poNo: jsonData[5]?.[1] || "N/A",
        date: jsonData[7]?.[1] || "N/A",
        orderQty: jsonData[6]?.[1] || "N/A",
        country: jsonData[3]?.[3] || "N/A",
        shipmentMethod: jsonData[4]?.[3] || "N/A",
        portOfDestination: jsonData[5]?.[3] || "N/A",
        cartonNo: jsonData[6]?.[3] || "N/A"
      };

      const splitIndex = jsonData.findIndex((row) =>
        row.some(
          (cell) =>
            cell?.toString().trim().toLowerCase() ===
            "colour & size distribution"
        )
      );
      const filterEmptyRows = (row) =>
        row.length > 0 && row.some((cell) => cell !== "");

      let packingListHeaders = jsonData[9] || [];
      let packingListData = [];
      let sizeDistribution = null;

      // Rename last column if it's empty
      const lastHeaderIndex = packingListHeaders.length - 1;
      if (lastHeaderIndex >= 0 && !packingListHeaders[lastHeaderIndex]) {
        packingListHeaders[lastHeaderIndex] = "Area";
      }

      if (splitIndex !== -1) {
        packingListData = jsonData
          .slice(10, splitIndex - 1)
          .filter(filterEmptyRows);

        // Filter size distribution headers to remove empty columns
        const distHeadersRaw = jsonData[splitIndex + 1] || [];
        const distDataRaw = jsonData
          .slice(splitIndex + 2)
          .filter(filterEmptyRows);
        const totalColIndex = distHeadersRaw.findIndex(
          (h) => h?.toString().toUpperCase() === "TOTAL"
        );
        const rawSizeHeaders =
          totalColIndex !== -1
            ? distHeadersRaw.slice(2, totalColIndex)
            : distHeadersRaw.slice(2);

        // Filter out empty size names to match the filtered dynamicSizeNames
        const sizeHeaders = rawSizeHeaders.filter(
          (name) => name && name.toString().trim() !== ""
        );

        // Process distribution data with hardcoded detail names for merged cells
        const detailTypes = ["Order Qty", "Actual", "Difference", "-/+%"];
        const processedDistData = [];

        let currentColor = "";
        let detailIndex = 0;

        distDataRaw.forEach((row) => {
          const colorCell = row[0]?.toString().trim();
          const detailCell = row[1]?.toString().trim();

          // Handle merged cells - if color column has value, it's a new color group
          if (colorCell) {
            currentColor = colorCell;
            detailIndex = 0;
          }

          // Assign detail type based on pattern or use hardcoded sequence
          let detailType = detailTypes[detailIndex % 4];

          // If detail cell has a value, use it (for non-merged rows)
          if (detailCell) {
            // Try to match with known patterns
            if (detailCell.toLowerCase().includes("order")) {
              detailType = "Order Qty";
            } else if (detailCell.toLowerCase().includes("actual")) {
              detailType = "Actual";
            } else if (detailCell.toLowerCase().includes("diff")) {
              detailType = "Difference";
            } else if (
              detailCell.includes("%") ||
              detailCell.includes("+") ||
              detailCell.includes("-")
            ) {
              detailType = "-/+%";
            } else {
              detailType = detailCell;
            }
          }

          const rawValues =
            totalColIndex !== -1 ? row.slice(2, totalColIndex) : row.slice(2);
          // Filter values to match filtered headers
          const values = rawValues.filter(
            (_, index) =>
              rawSizeHeaders[index] &&
              rawSizeHeaders[index].toString().trim() !== ""
          );

          processedDistData.push({
            color: currentColor,
            details: detailType,
            values: values
          });

          detailIndex++;
        });

        let orderQtyTotal = 0,
          differenceTotal = 0;
        const dataWithTotals = processedDistData.map((row) => {
          const total = row.values
            .map((v) => parseFloat(v) || 0)
            .reduce((a, b) => a + b, 0);
          if (row.details === "Order Qty") orderQtyTotal = total;
          if (row.details === "Difference") differenceTotal = total;
          return { ...row, total };
        });
        const finalData = dataWithTotals.map((row) => {
          if (row.details === "-/+%") {
            const percentage = orderQtyTotal
              ? differenceTotal / orderQtyTotal
              : 0;
            return {
              ...row,
              formattedTotal: `${(percentage * 100).toFixed(2)}%`
            };
          }
          return { ...row, formattedTotal: row.total };
        });
        sizeDistribution = { headers: sizeHeaders, data: finalData };
      } else {
        packingListData = jsonData.slice(10).filter(filterEmptyRows);
      }

      // --- LOGIC TO DETECT AND REMOVE EMPTY SIZE COLUMNS ---
      const normalizeHeader = (text) =>
        text.toString().replace(/\s+/g, " ").trim().toLowerCase();
      const getIndex = (name) =>
        packingListHeaders.findIndex(
          (h) => normalizeHeader(h) === normalizeHeader(name)
        );

      const cartonsIndex = getIndex("Cartons");
      const subTotalIndex = getIndex("Sub Total");

      let finalHeaders = packingListHeaders;
      let finalData = packingListData;

      if (cartonsIndex !== -1 && subTotalIndex !== -1) {
        const validSizeColumnIndices = [];

        // Check each potential size column for data
        for (let i = cartonsIndex + 1; i < subTotalIndex; i++) {
          const hasData = packingListData.some(
            (row) => (Number(row[i]) || 0) > 0
          );
          if (hasData) {
            validSizeColumnIndices.push(i);
          }
        }

        // Reconstruct the headers array
        const nonSizePrefixHeaders = packingListHeaders.slice(
          0,
          cartonsIndex + 1
        );
        const validSizeHeaders = validSizeColumnIndices.map(
          (i) => packingListHeaders[i]
        );
        const nonSizeSuffixHeaders = packingListHeaders.slice(subTotalIndex);

        finalHeaders = [
          ...nonSizePrefixHeaders,
          ...validSizeHeaders,
          ...nonSizeSuffixHeaders
        ];

        // Reconstruct each data row
        finalData = packingListData.map((row) => {
          const prefixData = row.slice(0, cartonsIndex + 1);
          const validSizeData = validSizeColumnIndices.map((i) => row[i]);
          const suffixData = row.slice(subTotalIndex);
          return [...prefixData, ...validSizeData, ...suffixData];
        });
      }

      if (finalData.length === 0) {
        setError(
          "No valid packing list data found. Please check the file's format."
        );
        return;
      }

      const finalPackingList = { headers: finalHeaders, data: finalData };
      setPreviewData({
        header,
        packingList: finalPackingList,
        sizeDistribution
      });
    } catch (e) {
      console.error("Parsing Error:", e);
      setError(
        "Failed to parse the Excel file. Please check its format and content."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  //Save Data to Backend
  const handleSave = async () => {
    if (!previewData) {
      setError("Please preview data before saving.");
      return;
    }
    setIsSaving(true);
    setError("");

    try {
      const { header, packingList, sizeDistribution } = previewData;

      // --- Data Transformation Logic ---

      const normalizeHeader = (text) => {
        if (!text || typeof text.toString !== "function") return "";
        return text.toString().replace(/\s+/g, " ").trim().toLowerCase();
      };

      const h = packingList.headers;
      const getIndex = (name) => {
        const normalizedName = normalizeHeader(name);
        return h.findIndex(
          (headerCell) => normalizeHeader(headerCell) === normalizedName
        );
      };

      const fromIndex = getIndex("Cartons");
      const toIndex = getIndex("Sub Total");

      if (fromIndex === -1 || toIndex === -1) {
        console.error(
          "DEBUG: Cleaned headers being searched:",
          h.map(normalizeHeader)
        );
        throw new Error(
          "Critical column 'Cartons' or 'Sub Total' not found. Check Excel file. See console for debug info."
        );
      }

      // --- Filter out empty strings from dynamicSizeNames before saving ---
      const dynamicSizeNames = h
        .slice(fromIndex + 1, toIndex)
        .filter((name) => name && name.trim() !== "");

      const cartonData = packingList.data.map((row) => {
        const sizeData = [];
        dynamicSizeNames.forEach((sizeName, i) => {
          const qty = Number(row[fromIndex + 1 + i]);
          if (qty > 0) {
            sizeData.push({ SizeName: sizeName, SizeOrderQty: qty });
          }
        });
        return {
          CartonNo: parseInt(row[getIndex("From")], 10) || 0,
          CartonNoEnd: parseInt(row[getIndex("To")], 10) || 0,
          CartonCount: parseInt(row[getIndex("Cartons")], 10) || 0,
          CartonQty: parseInt(row[getIndex("Sub Total")], 10) || 0,
          NetWeight: parseFloat(row[getIndex("Net Weight KG")]) || 0,
          GrossWeight: parseFloat(row[getIndex("Gross Weight KG")]) || 0,
          Color: row[getIndex("Color")] || "",
          ColorCode: row[getIndex("Color Code")] || "",
          ChineseColor: row[getIndex("Chinese Color")] || "",
          CustNo: parseInt(row[getIndex("Cust No.")], 10) || "",
          Dimensions: {
            L: Number(row[getIndex("L/CM")]) || 0,
            W: Number(row[getIndex("W/CM")]) || 0,
            H: Number(row[getIndex("H/CM")]) || 0
          },
          SizeData: sizeData
        };
      });

      // Improved distribution data extraction logic
      let distributionData = [];
      if (sizeDistribution) {
        const colorMap = new Map();

        // Use the filtered size headers from sizeDistribution (already filtered in preview)
        const validSizeNames = sizeDistribution.headers;

        sizeDistribution.data.forEach((row) => {
          const color = row.color?.toString().trim();
          const details = row.details?.toString().trim();

          console.log(
            `Processing row - Color: ${color}, Details: ${details}, Values:`,
            row.values
          );

          // Skip only if there's no color at all
          if (!color) {
            return;
          }

          // Initialize color entry if it doesn't exist
          if (!colorMap.has(color)) {
            colorMap.set(color, {
              color: color,
              sizeQty: validSizeNames.map((name) => ({
                sizeName: name,
                OrderQty: 0,
                ActualQty: 0
              }))
            });
          }

          const colorData = colorMap.get(color);

          // Process values for Order Qty and Actual rows only
          if (details === "Order Qty" || details === "Actual") {
            row.values.forEach((value, index) => {
              if (index < colorData.sizeQty.length) {
                const sizeEntry = colorData.sizeQty[index];
                const qty = parseInt(value, 10) || 0;

                if (details === "Order Qty") {
                  sizeEntry.OrderQty = qty;
                } else if (details === "Actual") {
                  sizeEntry.ActualQty = qty;
                }
              }
            });
          }
        });

        distributionData = Array.from(colorMap.values());
      }

      const payload = {
        moNo: header.moNo,
        custStyle: header.custStyle,
        buyer: header.buyer,
        poNo: header.poNo,
        date: header.date,
        country: header.country,
        orderQty: Number(header.orderQty),
        shipmentMethod: header.shipmentMethod,
        destination: header.portOfDestination,
        cartonList: header.cartonNo,
        cartonData: cartonData,
        SizeArray: dynamicSizeNames,
        DistributionData: distributionData
      };

      const response = await fetch(`${API_BASE_URL}/api/packing-list/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! Status: ${response.status}`
        );
      }

      toast.success("Packing list saved successfully!", {
        duration: 2000, // The pop-up will auto-disappear in 4 seconds
        style: {
          border: "1px solid #4CAF50", // Green border
          padding: "20px", // More padding to make it bigger
          color: "#333", // Text color
          minWidth: "350px", // Set a minimum width for the rectangle
          borderRadius: "10px", // Softer corners
          backgroundColor: "#f0fff0" // Light green background
        },
        iconTheme: {
          primary: "#4CAF50", // Success icon color
          secondary: "#FFFFFF" // Success icon background
        }
      });

      //toast.success("Packing list saved successfully!");

      //alert("Packing list saved successfully!");
      resetState();
    } catch (err) {
      console.error("Full Save Error:", err);
      const errorMessage = `Save Failed: ${err.message}`;
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000, // Give users more time to read errors
        style: {
          border: "1px solid #F44336", // Red border
          padding: "20px", // More padding
          color: "#333", // Text color
          minWidth: "350px", // Set a minimum width
          borderRadius: "10px", // Softer corners
          backgroundColor: "#fff0f0" // Light red background
        },
        iconTheme: {
          primary: "#F44336", // Error icon color
          secondary: "#FFFFFF" // Error icon background
        }
      });
      //toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Main Render Logic ---
  if (previewData) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Previewing Packing List
          </h2>
          <button
            onClick={() => resetState(true)}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 transition-colors"
          >
            <X className="w-5 h-5 mr-2" /> Close Preview
          </button>
        </div>

        <div className="space-y-10">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800">
              {previewData.header.company}
            </h3>
            <p className="text-xl font-semibold text-gray-700">
              {previewData.header.title}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-3 text-sm mb-4">
              <div>
                <strong className="text-gray-500 block">MO No:</strong>{" "}
                {previewData.header.moNo}
              </div>
              <div>
                <strong className="text-gray-500 block">Buyer:</strong>{" "}
                {previewData.header.buyer}
              </div>
              <div>
                <strong className="text-gray-500 block">Cust. Style:</strong>{" "}
                {previewData.header.custStyle}
              </div>
              <div>
                <strong className="text-gray-500 block">PO No:</strong>{" "}
                {previewData.header.poNo}
              </div>
              <div>
                <strong className="text-gray-500 block">Date:</strong>{" "}
                {previewData.header.date}
              </div>
              <div>
                <strong className="text-gray-500 block">Country:</strong>{" "}
                {previewData.header.country}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-3 text-sm">
              <div>
                <strong className="text-gray-500 block">Carton No:</strong>{" "}
                {previewData.header.cartonNo}
              </div>
              <div>
                <strong className="text-gray-500 block">Order Qty:</strong>{" "}
                {previewData.header.orderQty}
              </div>
              <div>
                <strong className="text-gray-500 block">
                  Shipment Method:
                </strong>{" "}
                {previewData.header.shipmentMethod}
              </div>
              <div>
                <strong className="text-gray-500 block">
                  Port of Destination:
                </strong>{" "}
                {previewData.header.portOfDestination}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Packing List Details
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[50vh] overflow-y-auto relative bg-white">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {previewData.packingList.headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.packingList.data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50/50">
                      {previewData.packingList.headers.map(
                        (header, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 whitespace-nowrap text-gray-700"
                          >
                            {row[cellIndex]}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {previewData.sizeDistribution && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Colour & Size Distribution
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-max w-auto text-sm border border-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Colour
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Details
                      </th>
                      {previewData.sizeDistribution.headers.map(
                        (header, index) => (
                          <th
                            scope="col"
                            key={index}
                            className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[5rem]"
                          >
                            {header}
                          </th>
                        )
                      )}
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[5rem]"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.sizeDistribution.data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {row.color}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 font-medium">
                          {row.details}
                        </td>
                        {row.values.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 whitespace-nowrap text-gray-600 text-center"
                          >
                            {cell}
                          </td>
                        ))}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800 text-center font-medium bg-gray-50">
                          {row.formattedTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300"
            >
              {isSaving ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isSaving ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Default Upload UI ---
  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      <Toaster position="top-center" reverseOrder={false} />
      <label
        htmlFor="anf-file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragEvents}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full px-4 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging
            ? "border-indigo-600 bg-indigo-50"
            : "border-gray-300 hover:bg-gray-50"
        }`}
      >
        <FileUp className="w-12 h-12 text-gray-400 mb-4" />
        <span className="font-semibold text-gray-700">
          Drop your .xlsx file here
        </span>
        <span className="text-sm text-gray-500 mt-1">or click to browse</span>
        <input
          id="anf-file-upload"
          type="file"
          className="sr-only"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
        />
      </label>

      {selectedFile && (
        <div className="text-center text-sm text-gray-600 bg-gray-100 p-2 rounded-md truncate">
          {selectedFile.name}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
        <button
          onClick={handlePreview}
          disabled={!selectedFile || isLoading}
          className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 transition-transform duration-150 ease-in-out hover:scale-105"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Eye className="w-5 h-5 mr-2" />
          )}
          Preview
        </button>
        <button
          disabled={true}
          className="w-full flex items-center justify-center px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-md cursor-not-allowed"
        >
          <Save className="w-5 h-5 mr-2" /> Save
        </button>
      </div>

      {error && (
        <div className="mt-2 flex items-center p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ANFUploader;
