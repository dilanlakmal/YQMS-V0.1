import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../../config";
import { MoreVertical, Eye, FileText, Download, Trash2 } from "lucide-react";
import SubmittedWashingDataFilter from "./SubmittedWashingDataFilter";
import QCWashingViewDetailsModal from "./QCWashingViewDetailsModal";
import QCWashingFullReportModal from "./QCWashingFullReportModal";
import QcWashingFullReportPDF from "./qcWashingFullReportPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";

const SubmittedWashingDataPage = () => {
  const [submittedData, setSubmittedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [showDefectColumn, setShowDefectColumn] = useState(false);
  const [showMeasurementColumn, setShowMeasurementColumn] = useState(false);
  const [viewDetailsModal, setViewDetailsModal] = useState({
    isOpen: false,
    itemData: null
  });
  const [fullReportModal, setFullReportModal] = useState({
    isOpen: false,
    recordData: null
  });
  const [isqcWashingPDF, setIsQcWashingPDF] = useState(false);

  // Single handleViewDetails function (removed the duplicate)
  const handleViewDetails = (record) => {
    const transformedData = {
      ...record,
      orderNo: record.orderNo,
      colorName: record.color,
      buyer: record.buyer,
      factoryName: record.factoryName,
      orderQty: record.orderQty,
      colorOrderQty: record.colorOrderQty,
      status: record.status || "submitted",
      checkedQty: record.checkedQty,
      washQty: record.washQty,
      totalCheckedPoint: record.totalCheckedPoint,
      totalPass: record.totalPass,
      totalFail: record.totalFail,
      passRate: record.passRate,
      overallFinalResult: record.overallFinalResult,
      measurementDetails: record.measurementDetails,
      defectDetails: record.defectDetails,
      before_after_wash: record.before_after_wash
    };

    setViewDetailsModal({
      isOpen: true,
      itemData: transformedData
    });
  };

  const handleCloseViewDetails = () => {
    setViewDetailsModal({
      isOpen: false,
      itemData: null
    });
  };

  // Add this function to close the modal
  const handleCloseFullReport = () => {
    setFullReportModal({
      isOpen: false,
      recordData: null
    });
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchSubmittedData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/qc-washing/all-submitted`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Report feature is not yet implemented on the server.");
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return;
        }

        const data = await response.json();

        if (data.success) {
          setSubmittedData(data.data || []);
        } else {
          setError(data.message || "Failed to fetch submitted data.");
        }
      } catch (err) {
        if (err.message.includes("404")) {
          setError("Report feature is not yet implemented on the server.");
        } else if (err.name === "TypeError" && err.message.includes("fetch")) {
          setError(
            "Could not connect to server. Please check your connection."
          );
        } else {
          setError(`Error: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmittedData();
  }, []);

  // Helper function to extract defect details
  const getDefectDetails = (record) => {
    const defects = [];

    // Check defectsByPc in defectDetails
    if (
      record.defectDetails?.defectsByPc &&
      Array.isArray(record.defectDetails.defectsByPc)
    ) {
      record.defectDetails.defectsByPc.forEach((pc) => {
        if (pc.pcDefects && Array.isArray(pc.pcDefects)) {
          pc.pcDefects.forEach((defect) => {
            const existingDefect = defects.find(
              (d) => d.name === defect.defectName
            );
            if (existingDefect) {
              existingDefect.qty += parseInt(defect.defectQty) || 0;
            } else {
              defects.push({
                name: defect.defectName || "Unknown",
                qty: parseInt(defect.defectQty) || 0
              });
            }
          });
        }
      });
    }

    return defects;
  };

  // Helper function to extract measurement details
  const getMeasurementDetails = (record) => {
    let checkedPoints = 0;
    let totalPass = 0;
    let totalFail = 0;
    let plusToleranceFail = 0;
    let minusToleranceFail = 0;

    // Use the measurementSizeSummary if available (more accurate)
    if (
      record.measurementDetails?.measurementSizeSummary &&
      Array.isArray(record.measurementDetails.measurementSizeSummary)
    ) {
      record.measurementDetails.measurementSizeSummary.forEach((summary) => {
        checkedPoints += summary.checkedPoints || 0;
        totalPass += summary.totalPass || 0;
        totalFail += summary.totalFail || 0;
        plusToleranceFail += summary.plusToleranceFailCount || 0;
        minusToleranceFail += summary.minusToleranceFailCount || 0;
      });
    } else if (record.measurementDetails?.measurement) {
      // Fallback to calculating from measurement data
      record.measurementDetails.measurement.forEach((measurement) => {
        if (measurement.pcs && Array.isArray(measurement.pcs)) {
          measurement.pcs.forEach((pc) => {
            if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
              pc.measurementPoints.forEach((point) => {
                if (point.result === "pass" || point.result === "fail") {
                  checkedPoints++;
                  if (point.result === "pass") {
                    totalPass++;
                  } else {
                    totalFail++;
                    // Determine if it's plus or minus tolerance fail
                    if (point.measured_value_decimal > point.tolerancePlus) {
                      plusToleranceFail++;
                    } else if (
                      point.measured_value_decimal < point.toleranceMinus
                    ) {
                      minusToleranceFail++;
                    }
                  }
                }
              });
            }
          });
        }
      });
    }

    return {
      checkedPoints,
      totalPass,
      totalFail,
      plusToleranceFail,
      minusToleranceFail
    };
  };

  const handleFullReport = (record) => {
    setFullReportModal({
      isOpen: true,
      recordData: record
    });
  };

  // Enhanced convert image to base64 using backend endpoint with retry mechanism
  const convertImageToBase64 = async (imagePath, API_BASE_URL) => {
    if (!imagePath || !API_BASE_URL) {
      console.log(`❌ convertImageToBase64: Missing parameters`);
      return null;
    }

    // If it's already base64, return it
    if (imagePath.startsWith("data:image/")) {
      return imagePath;
    }

    try {
      if (
        !imagePath.startsWith(
          "https://yqms.yaikh.com/storage/qc_washing_images/"
        )
      ) {
        console.warn("❌ Unsupported image path format:", imagePath);
        return imagePath; // fallback to original URL
      }

      const [type, filename] = imagePath
        .replace("https://yqms.yaikh.com/storage/qc_washing_images/", "")
        .split("/");

      const apiUrl = `${API_BASE_URL}/api/pdf-image-base64/${type}/${filename}`;
      console.log(`🔄 Converting to base64: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.base64) {
        console.log(`✅ Successfully converted: ${imagePath}`);
        return data.base64;
      } else {
        console.warn(`❌ Conversion failed, using original URL: ${imagePath}`);
        return imagePath;
      }
    } catch (error) {
      console.error(`❌ Error converting image to base64: ${error.message}`);
      return imagePath; // fallback to original URL
    }
  };

  // Process images for PDF rendering
  const processImagesInRecord = async (record, API_BASE_URL) => {
    try {
      const processedRecord = JSON.parse(JSON.stringify(record)); // Deep clone

      // Process defect images
      if (processedRecord.defectDetails?.defectsByPc) {
        console.log(
          "📋 Found defectsByPc:",
          processedRecord.defectDetails.defectsByPc.length
        );

        for (
          let pcIndex = 0;
          pcIndex < processedRecord.defectDetails.defectsByPc.length;
          pcIndex++
        ) {
          const pcDefect = processedRecord.defectDetails.defectsByPc[pcIndex];

          if (pcDefect.pcDefects) {
            console.log(
              `🔍 Processing ${pcDefect.pcDefects.length} defects for PC:`,
              pcDefect.garmentNo || pcDefect.pcNumber
            );

            for (
              let defectIndex = 0;
              defectIndex < pcDefect.pcDefects.length;
              defectIndex++
            ) {
              const defect = pcDefect.pcDefects[defectIndex];

              if (defect.defectImages && Array.isArray(defect.defectImages)) {
                console.log(
                  `🖼️ Processing ${defect.defectImages.length} images for defect:`,
                  defect.defectName
                );
                console.log("📷 Original defect images:", defect.defectImages);

                const processedImages = [];
                for (const imagePath of defect.defectImages) {
                  try {
                    // Skip if already base64
                    if (imagePath && imagePath.startsWith("data:image/")) {
                      processedImages.push(imagePath);
                      console.log("✅ Image already in base64 format");
                      continue;
                    }

                    const base64Image = await convertImageToBase64(
                      imagePath,
                      API_BASE_URL
                    );
                    if (base64Image && base64Image.startsWith("data:image/")) {
                      processedImages.push(base64Image);
                      console.log("✅ Successfully converted defect image");
                    } else {
                      console.warn(
                        `❌ Failed to convert defect image: ${imagePath}`
                      );
                      // Don't push null, skip invalid images
                    }
                  } catch (error) {
                    console.warn(
                      `❌ Error processing defect image: ${imagePath}`,
                      error.message
                    );
                  }
                }

                // IMPORTANT: Assign the processed images back to the correct location
                processedRecord.defectDetails.defectsByPc[pcIndex].pcDefects[
                  defectIndex
                ].defectImages = processedImages;
                console.log(
                  `📊 Final defect images count: ${processedImages.length}`
                );
              }
            }
          }
        }
      }

      // Process additional images
      if (
        processedRecord.defectDetails?.additionalImages &&
        Array.isArray(processedRecord.defectDetails.additionalImages)
      ) {
        const processedAdditionalImages = [];
        for (const imagePath of processedRecord.defectDetails
          .additionalImages) {
          try {
            // Skip if already base64
            if (imagePath && imagePath.startsWith("data:image/")) {
              processedAdditionalImages.push(imagePath);
              console.log("✅ Additional image already in base64 format");
              continue;
            }

            const base64Image = await convertImageToBase64(
              imagePath,
              API_BASE_URL
            );
            if (base64Image && base64Image.startsWith("data:image/")) {
              processedAdditionalImages.push(base64Image);
              console.log("✅ Successfully converted additional image");
            } else {
              console.warn(
                `❌ Failed to convert additional image: ${imagePath}`
              );
            }
          } catch (error) {
            console.warn(
              `❌ Error processing additional image: ${imagePath}`,
              error.message
            );
          }
        }

        // IMPORTANT: Assign the processed images back
        processedRecord.defectDetails.additionalImages =
          processedAdditionalImages;
        console.log(
          `📊 Final additional images count: ${processedAdditionalImages.length}`
        );
      }

      // Process inspection images
      if (processedRecord.inspectionDetails?.checkedPoints) {
        for (
          let pointIndex = 0;
          pointIndex < processedRecord.inspectionDetails.checkedPoints.length;
          pointIndex++
        ) {
          const point =
            processedRecord.inspectionDetails.checkedPoints[pointIndex];

          // Process point image
          if (point.image) {
            try {
              if (!point.image.startsWith("data:image/")) {
                const processedImage = await convertImageToBase64(
                  point.image,
                  API_BASE_URL
                );
                processedRecord.inspectionDetails.checkedPoints[
                  pointIndex
                ].image = processedImage || null;
              }
            } catch (error) {
              console.warn(
                `Skipping corrupted point image: ${point.image}`,
                error.message
              );
              processedRecord.inspectionDetails.checkedPoints[
                pointIndex
              ].image = null;
            }
          }

          // Process comparison images in inspection points
          if (point.comparison && Array.isArray(point.comparison)) {
            const processedComparisonImages = [];
            for (const imagePath of point.comparison) {
              if (imagePath.startsWith("data:image/")) {
                processedComparisonImages.push(imagePath);
              } else {
                const base64Image = await convertImageToBase64(
                  imagePath,
                  API_BASE_URL
                );
                if (base64Image) processedComparisonImages.push(base64Image);
              }
            }
            processedRecord.inspectionDetails.checkedPoints[
              pointIndex
            ].comparison = processedComparisonImages;
          }
        }
      }

      // Process machine process images
      if (processedRecord.inspectionDetails?.machineProcesses) {
        for (
          let machineIndex = 0;
          machineIndex <
          processedRecord.inspectionDetails.machineProcesses.length;
          machineIndex++
        ) {
          const machine =
            processedRecord.inspectionDetails.machineProcesses[machineIndex];
          if (machine.image) {
            try {
              if (!machine.image.startsWith("data:image/")) {
                const processedImage = await convertImageToBase64(
                  machine.image,
                  API_BASE_URL
                );
                processedRecord.inspectionDetails.machineProcesses[
                  machineIndex
                ].image = processedImage || null;
              }
            } catch (error) {
              console.warn(
                `Skipping corrupted machine image: ${machine.image}`,
                error.message
              );
              processedRecord.inspectionDetails.machineProcesses[
                machineIndex
              ].image = null;
            }
          }
        }
      }

      return processedRecord;
    } catch (error) {
      console.error("❌ Error processing images in record:", error);
      return record; // Return original record if processing fails
    }
  };

  const processImageToBase64 = async (imagePath) => {
    try {
      console.log("🔄 Processing image:", imagePath);

      const cleanPath = imagePath.replace("./public/", "");
      const response = await fetch(`${API_BASE_URL}/${cleanPath}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Validate JPEG header (SOI marker: 0xFF 0xD8)
      if (uint8Array.length < 2) {
        throw new Error("Image data too short");
      }

      if (uint8Array[0] !== 0xff || uint8Array[1] !== 0xd8) {
        console.warn("⚠️ Invalid JPEG header detected, attempting to fix...");
        // Sometimes the header gets corrupted, try to find the actual start
        let soi = -1;
        for (let i = 0; i < Math.min(100, uint8Array.length - 1); i++) {
          if (uint8Array[i] === 0xff && uint8Array[i + 1] === 0xd8) {
            soi = i;
            break;
          }
        }

        if (soi > 0) {
          console.log("✅ Found JPEG SOI at position:", soi);
          // Create new array starting from the actual SOI
          const correctedArray = uint8Array.slice(soi);
          const base64 = btoa(String.fromCharCode.apply(null, correctedArray));
          return `data:image;base64,${base64}`;
        } else {
          throw new Error("No valid JPEG SOI marker found");
        }
      }

      // Convert to base64 using chunks to avoid call stack issues
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }

      const base64 = btoa(binary);
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      console.log("✅ Image processed successfully");
      console.log("   Original size:", uint8Array.length, "bytes");
      console.log("   Base64 length:", base64.length);

      // Final validation
      try {
        atob(base64);
        console.log("✅ Base64 validation passed");
      } catch (e) {
        console.error("❌ Base64 validation failed:", e);
        return null;
      }

      return dataUrl;
    } catch (error) {
      console.error("❌ Error processing image:", imagePath, error);
      return null;
    }
  };

  const handleDownloadPDF = async (record) => {
    try {
      setIsQcWashingPDF(true);

      if (!API_BASE_URL) {
        throw new Error("API_BASE_URL is not defined");
      }

      console.log(
        "📝 Generating PDF with base64 images for record:",
        record._id
      );

      // Process images to base64
      const processedRecord = JSON.parse(JSON.stringify(record)); // Deep clone

      // Convert defect images
      if (processedRecord.defectDetails?.defectsByPc) {
        for (
          let pcIndex = 0;
          pcIndex < processedRecord.defectDetails.defectsByPc.length;
          pcIndex++
        ) {
          const pcDefect = processedRecord.defectDetails.defectsByPc[pcIndex];

          if (pcDefect.pcDefects) {
            for (
              let defectIndex = 0;
              defectIndex < pcDefect.pcDefects.length;
              defectIndex++
            ) {
              const defect = pcDefect.pcDefects[defectIndex];

              if (defect.defectImages && Array.isArray(defect.defectImages)) {
                const convertedImages = [];
                for (const imagePath of defect.defectImages) {
                  const base64Image = await convertImageToBase64(
                    imagePath,
                    API_BASE_URL
                  );
                  if (base64Image) {
                    convertedImages.push(base64Image);
                  }
                }
                processedRecord.defectDetails.defectsByPc[pcIndex].pcDefects[
                  defectIndex
                ].defectImages = convertedImages;
              }
            }
          }
        }
      }

      // Convert additional images
      if (processedRecord.defectDetails?.additionalImages) {
        const convertedAdditionalImages = [];
        for (const imagePath of processedRecord.defectDetails
          .additionalImages) {
          const base64Image = await convertImageToBase64(
            imagePath,
            API_BASE_URL
          );
          if (base64Image) {
            convertedAdditionalImages.push(base64Image);
          }
        }
        processedRecord.defectDetails.additionalImages =
          convertedAdditionalImages;
      }

      // Convert inspection images
      if (processedRecord.inspectionDetails?.checkedPoints) {
        for (
          let pointIndex = 0;
          pointIndex < processedRecord.inspectionDetails.checkedPoints.length;
          pointIndex++
        ) {
          const point =
            processedRecord.inspectionDetails.checkedPoints[pointIndex];

          // Convert point image
          if (point.image) {
            const base64Image = await convertImageToBase64(
              point.image,
              API_BASE_URL
            );
            processedRecord.inspectionDetails.checkedPoints[pointIndex].image =
              base64Image;
          }

          // Convert comparison images
          if (point.comparison && Array.isArray(point.comparison)) {
            const convertedComparisons = [];
            for (const imagePath of point.comparison) {
              const base64Image = await convertImageToBase64(
                imagePath,
                API_BASE_URL
              );
              if (base64Image) {
                convertedComparisons.push(base64Image);
              }
            }
            processedRecord.inspectionDetails.checkedPoints[
              pointIndex
            ].comparison = convertedComparisons;
          }
        }
      }

      // Convert machine images
      if (processedRecord.inspectionDetails?.machineProcesses) {
        for (
          let machineIndex = 0;
          machineIndex <
          processedRecord.inspectionDetails.machineProcesses.length;
          machineIndex++
        ) {
          const machine =
            processedRecord.inspectionDetails.machineProcesses[machineIndex];
          if (machine.image) {
            const base64Image = await convertImageToBase64(
              machine.image,
              API_BASE_URL
            );
            processedRecord.inspectionDetails.machineProcesses[
              machineIndex
            ].image = base64Image;
          }
        }
      }

      // Fetch comparison data
      let comparisonData = null;
      if (record.measurementDetails?.measurement?.length > 0) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/qc-washing/results?` +
              new URLSearchParams({
                orderNo: record.orderNo,
                color: record.color,
                washType: record.washType,
                reportType: record.reportType,
                factory: record.factoryName
              })
          );

          if (response.ok) {
            const data = await response.json();
            const targetWashType =
              record.before_after_wash === "Before Wash"
                ? "After Wash"
                : "Before Wash";
            comparisonData = data.find(
              (r) =>
                r.orderNo === record.orderNo &&
                r.color === record.color &&
                r.washType === record.washType &&
                r.reportType === record.reportType &&
                r.factoryName === record.factoryName &&
                r.before_after_wash === targetWashType
            );
          }
        } catch (error) {
          console.warn("Could not fetch comparison data:", error);
        }
      }

      // Generate PDF with base64 images
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(
        <QcWashingFullReportPDF
          recordData={processedRecord}
          comparisonData={comparisonData}
          API_BASE_URL={API_BASE_URL}
        />
      ).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QC_Washing_Report_${record.orderNo}_${
        record.color
      }_${record.before_after_wash.replace(" ", "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("✅ PDF generated successfully with base64 images");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsQcWashingPDF(false);
    }
  };
  // const handleDelete = async (record) => {
  //   console.log('Delete record:', record);
  //   if (window.confirm('Are you sure you want to delete this record?')) {
  //     try {
  //       const response = await fetch(`${API_BASE_URL}/api/qc-washing/delete/${record._id}`, {
  //         method: 'DELETE'
  //       });

  //       if (response.ok) {
  //         setSubmittedData(prev => prev.filter(item => item._id !== record._id));
  //         alert('Record deleted successfully');
  //       } else {
  //         alert('Failed to delete record');
  //       }
  //     } catch (error) {
  //       console.error('Error deleting record:', error);
  //       alert('Error deleting record');
  //     }
  //   }
  // };

  const toggleDropdown = (recordId) => {
    setOpenDropdown(openDropdown === recordId ? null : recordId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Filter function - moved to separate component but logic stays here
  const applyFilters = (filters) => {
    let filtered = [...submittedData];

    // Date range filter
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        const startDate = filters.dateRange.startDate
          ? new Date(filters.dateRange.startDate)
          : null;
        const endDate = filters.dateRange.endDate
          ? new Date(filters.dateRange.endDate)
          : null;

        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    }

    // Order number filter
    if (filters.orderNo) {
      filtered = filtered.filter((item) =>
        item.orderNo?.toLowerCase().includes(filters.orderNo.toLowerCase())
      );
    }

    // Color filter
    if (filters.color) {
      filtered = filtered.filter((item) => item.color === filters.color);
    }

    // QC ID filter
    if (filters.qcId) {
      filtered = filtered.filter((item) =>
        item.userId?.toLowerCase().includes(filters.qcId.toLowerCase())
      );
    }

    // Status filter
    // if (filters.status) {
    //   filtered = filtered.filter(item => item.overallFinalResult === filters.status);
    // }

    // Buyer filter
    if (filters.buyer) {
      filtered = filtered.filter((item) => item.buyer === filters.buyer);
    }

    // Factory name filter
    if (filters.factoryName) {
      filtered = filtered.filter(
        (item) => item.factoryName === filters.factoryName
      );
    }

    // Report type filter
    if (filters.reportType) {
      filtered = filtered.filter(
        (item) => item.reportType === filters.reportType
      );
    }

    // Wash type filter
    if (filters.washType) {
      filtered = filtered.filter((item) => item.washType === filters.washType);
    }

    if (filters.before_after_wash) {
      filtered = filtered.filter(
        (item) => item.before_after_wash === filters.before_after_wash
      );
    }

    setFilteredData(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    applyFilters(filters);
  };

  // Reset filters
  const handleFilterReset = () => {
    setFilteredData(submittedData);
  };

  // Update filtered data when original data changes
  useEffect(() => {
    setFilteredData(submittedData);
  }, [submittedData]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">
            Loading submitted data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            ⚠️ Error
          </div>
          <div className="text-gray-600 dark:text-gray-300 mb-2">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Component */}
      <SubmittedWashingDataFilter
        data={submittedData}
        onFilterChange={handleFilterChange}
        onReset={handleFilterReset}
        isVisible={filterVisible}
        onToggle={() => setFilterVisible(!filterVisible)}
      />

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Submitted QC Washing Reports
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showDefectColumn}
                  onChange={(e) => setShowDefectColumn(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show Defect Details
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showMeasurementColumn}
                  onChange={(e) => setShowMeasurementColumn(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show Measurement Details
              </label>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredData.length} of {submittedData.length} records
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">
              📋
            </div>
            <div className="text-gray-600 dark:text-gray-300 mb-2">
              {submittedData.length === 0
                ? "No submitted data found."
                : "No records match your filters."}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {submittedData.length === 0
                ? "Submit some QC washing data to see reports here."
                : "Try adjusting your filter criteria."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 min-w-max">
              {/* Table headers */}
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Inspection Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Factory
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Buyer
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Wash Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    MO No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                    Color
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    QC/QA ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Total Order Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Color Order Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Wash Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    Before/After Wash
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    Pass Rate (%)
                  </th>
                  {showDefectColumn && (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                      Defect Details
                    </th>
                  )}
                  {showMeasurementColumn && (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[300px]">
                      Measurement Details
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    Actions
                  </th>
                </tr>
                {/* Sub-header row for complex columns */}
                <tr className="bg-gray-100 dark:bg-gray-600">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  {showDefectColumn && (
                    <th className="px-3 py-2">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-300">
                        <span>Defect Name</span>
                        <span>Defect Qty</span>
                      </div>
                    </th>
                  )}
                  {showMeasurementColumn && (
                    <th className="px-3 py-2">
                      <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 dark:text-gray-300">
                        <span>Checked Points</span>
                        <span>Total Pass</span>
                        <span>Total Fail</span>
                        <span>Plus Tol. Fail</span>
                        <span>Minus Tol. Fail</span>
                      </div>
                    </th>
                  )}
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((record, index) => {
                  const defectDetails = getDefectDetails(record);
                  const measurementDetails = getMeasurementDetails(record);

                  return (
                    <tr
                      key={record._id || index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.date
                          ? new Date(record.date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.factoryName || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.buyer || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.washType || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.orderNo || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.color || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.userId || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.orderQty || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.colorOrderQty || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.washQty || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.before_after_wash || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.overallFinalResult === "Pass"
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                              : record.overallFinalResult === "Fail"
                              ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {record.overallFinalResult || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.passRate || "0"}
                      </td>
                      {showDefectColumn && (
                        <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {defectDetails.length > 0 ? (
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {defectDetails.map((defect, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-2 gap-2 text-xs border-b border-gray-100 dark:border-gray-600 pb-1"
                                >
                                  <span
                                    className="truncate"
                                    title={defect.name}
                                  >
                                    {defect.name}
                                  </span>
                                  <span className="text-center">
                                    {defect.qty}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">
                              No defects
                            </span>
                          )}
                        </td>
                      )}
                      {showMeasurementColumn && (
                        <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          <div className="grid grid-cols-5 gap-1 text-xs">
                            <span className="text-center">
                              {measurementDetails.checkedPoints}
                            </span>
                            <span className="text-center text-green-600 dark:text-green-400">
                              {measurementDetails.totalPass}
                            </span>
                            <span className="text-center text-red-600 dark:text-red-400">
                              {measurementDetails.totalFail}
                            </span>
                            <span className="text-center text-orange-600 dark:text-orange-400">
                              {measurementDetails.plusToleranceFail}
                            </span>
                            <span className="text-center text-orange-600 dark:text-orange-400">
                              {measurementDetails.minusToleranceFail}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(record._id);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                        >
                          <MoreVertical
                            size={16}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        </button>

                        {openDropdown === record._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleViewDetails(record);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <Eye size={16} className="mr-3" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  handleFullReport(record);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <FileText size={16} className="mr-3" />
                                Full Report
                              </button>
                              {/* <button
                                onClick={() => {
                                  handleDownloadPDF(record);
                                  setOpenDropdown(null);
                                }}
                                disabled={isqcWashingPDF}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                              >
                                <Download size={16} className="mr-3" />
                                {isqcWashingPDF
                                  ? "Generating PDF..."
                                  : "Download PDF"}
                              </button> */}
                              <hr className="my-1 border-gray-200 dark:border-gray-600" />
                              {/* <button
                                onClick={() => {
                                  handleDelete(record);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 size={16} className="mr-3" />
                                Delete
                              </button> */}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <QCWashingViewDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={handleCloseViewDetails}
        itemData={viewDetailsModal.itemData}
        allRecords={submittedData}
      />

      {/* Full Report Modal - ADD THIS */}
      <QCWashingFullReportModal
        isOpen={fullReportModal.isOpen}
        onClose={handleCloseFullReport}
        recordData={fullReportModal.recordData}
      />
    </div>
  );
};

export default SubmittedWashingDataPage;
