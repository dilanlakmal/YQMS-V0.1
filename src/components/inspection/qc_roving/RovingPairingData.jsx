import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../authentication/AuthContext";
import { API_BASE_URL } from "../../../../config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  CheckCircle,
  XCircle,
  PackageCheck,
  Ruler,
  Wrench,
  RefreshCw,
  Loader,
  Info
} from "lucide-react";
import Swal from "sweetalert2";

const RovingPairingData = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    date: new Date(),
    qcId: user?.emp_id || "",
    operatorId: "",
    lineNo: "",
    moNo: ""
  });

  const [filterOptions, setFilterOptions] = useState({
    qcIds: [],
    operatorIds: [],
    lineNos: [],
    moNos: []
  });

  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    accessory: true,
    measurements: true,
    defects: true
  });

  const [defectDefinitions, setDefectDefinitions] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const showImagePopup = (imageUrl) => {
    Swal.fire({
      html: `<img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; object-fit: contain;" />`,
      showConfirmButton: false,
      showCloseButton: true,
      background: 'transparent',
      backdrop: 'rgba(0,0,0,0.8)',
      customClass: {
        popup: 'swal2-image-popup'
      }
    });
  };

  const showDetailsOnTap = (tooltipContent) => {
    Swal.fire({
      html: tooltipContent.html,
      confirmButtonText: "Close",
      width: '600px',
      showCloseButton: true,
      customClass: {
        popup: "roving-pairing-data-swal-popup"
      },
      didOpen: () => {
        const images = document.querySelectorAll('.defect-image-clickable');
        images.forEach(img => {
          img.addEventListener('click', (e) => {
            e.preventDefault();
            showImagePopup(img.src);
          });
        });
      }
    });
  };

  const formatDateForAPI = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const fetchFilterOptions = useCallback(
    async (selectedDate) => {
      if (!selectedDate) return;
      try {
        const formattedDate = formatDateForAPI(selectedDate);
        const response = await axios.get(
          `${API_BASE_URL}/api/roving-pairing/filters`,
          {
            params: { date: formattedDate }
          }
        );
        setFilterOptions(response.data);
        if (user?.emp_id && !response.data.qcIds.includes(user.emp_id)) {
          setFilterOptions((prev) => ({
            ...prev,
            qcIds: [user.emp_id, ...prev.qcIds].sort()
          }));
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    },
    [user.emp_id]
  );

  useEffect(() => {
    fetchFilterOptions(filters.date);
  }, [fetchFilterOptions, filters.date]);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        date: formatDateForAPI(filters.date),
        qcId: filters.qcId,
        operatorId: filters.operatorId,
        lineNo: filters.lineNo,
        moNo: filters.moNo
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/roving-pairing/report-data`,
        { params }
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReportData();
    fetchDefectDefinitions();
  }, [fetchReportData]);

  useEffect(() => {
    const userLanguage = user?.language || localStorage.getItem('preferredLanguage') || 'en';
    setCurrentLanguage(userLanguage);
  }, [user]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'preferredLanguage') {
        setCurrentLanguage(e.newValue || 'en');
      }
    };
    
    const handleCustomLanguageChange = (e) => {
      setCurrentLanguage(e.detail.language);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChanged', handleCustomLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleCustomLanguageChange);
    };
  }, []);

  const fetchDefectDefinitions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pairing-defects`);
      if (response.data && Array.isArray(response.data)) {
        setDefectDefinitions(response.data);
      }
    } catch (error) {
      console.error('Error fetching pairing defects:', error);
      setDefectDefinitions([]);
    }
  };

  const getDefectNameByLanguage = (defect, language = 'en') => {
    if (language.startsWith("kh")) return defect.defectNameKhmer || defect.defectNameEng;
    if (language.startsWith("zh")) {
      return defect.defectNameChinese || defect.defectNameEng;
    }
    return defect.defectNameEng;
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    if (field === "date") {
      newFilters.qcId = user?.emp_id || "";
      newFilters.operatorId = "";
      newFilters.lineNo = "";
      newFilters.moNo = "";
      fetchFilterOptions(value);
    }
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      date: new Date(),
      qcId: user?.emp_id || "",
      operatorId: "",
      lineNo: "",
      moNo: ""
    };
    setFilters(clearedFilters);
    fetchFilterOptions(clearedFilters.date);
  };

  const handleColumnVisibilityChange = (column) => {
    if (column === "all") {
      const areAllVisible = Object.values(visibleColumns).every((v) => v);
      setVisibleColumns({
        accessory: !areAllVisible,
        measurements: !areAllVisible,
        defects: !areAllVisible
      });
    } else {
      setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
    }
  };

  const inspectionReps = [
    "1st Inspection",
    "2nd Inspection",
    "3rd Inspection",
    "4th Inspection",
    "5th Inspection"
  ];

  const Legend = () => (
    <div className="p-4 mb-4 bg-gray-50 border rounded-lg text-sm text-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Info size={20} className="text-blue-500" />
        <h3 className="font-semibold text-base text-gray-800">
          Legend & Meanings
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <p className="font-semibold">Format:</p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              13/15
            </span>{" "}
            = Total Pass / Total Parts
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Abbreviations:</p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              T
            </span>{" "}
            = Measurement Total Rejects
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              N
            </span>{" "}
            = Measurement Negative Rejects
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              P
            </span>{" "}
            = Measurement Positive Rejects
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              TR
            </span>{" "}
            = Defect Total Rejected Parts
          </p>
          <p>
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">
              Q
            </span>{" "}
            = Defect Total Quantity
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Roving Pairing Inspection Data
        </h2>

        {/* Filter Pane */}
        <div className="p-4 bg-white rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <DatePicker
                selected={filters.date}
                onChange={(date) => handleFilterChange("date", date)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                QC ID
              </label>
              <select
                value={filters.qcId}
                onChange={(e) => handleFilterChange("qcId", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All QC IDs</option>
                {filterOptions.qcIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Operator ID
              </label>
              <select
                value={filters.operatorId}
                onChange={(e) =>
                  handleFilterChange("operatorId", e.target.value)
                }
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Operators</option>
                {filterOptions.operatorIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Line No
              </label>
              <select
                value={filters.lineNo}
                onChange={(e) => handleFilterChange("lineNo", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Lines</option>
                {filterOptions.lineNos.map((no) => (
                  <option key={no} value={no}>
                    {no}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MO No
              </label>
              <select
                value={filters.moNo}
                onChange={(e) => handleFilterChange("moNo", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All MOs</option>
                {filterOptions.moNos.map((no) => (
                  <option key={no} value={no}>
                    {no}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearFilters}
                className="w-full bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-baseline gap-6 mb-4 text-gray-600">
          <p>
            <strong>Operation Name:</strong> Pairing (ការផ្គូផ្គង)
          </p>
          <p>
            <strong>Operation No:</strong> 7
          </p>
        </div>

        <Legend />

        <div className="p-4 bg-white rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-x-6 gap-y-2">
            <h4 className="font-semibold text-gray-700">Show Columns:</h4>
            {Object.keys(visibleColumns).map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col]}
                  onChange={() => handleColumnVisibilityChange(col)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={Object.values(visibleColumns).every((v) => v)}
                onChange={() => handleColumnVisibilityChange("all")}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Select All
            </label>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-200 z-10">
              <tr>
                <th
                  rowSpan="2"
                  className="p-2 border border-gray-300 text-sm font-semibold text-gray-700 align-middle"
                >
                  Line No
                </th>
                <th
                  rowSpan="2"
                  className="p-2 border border-gray-300 text-sm font-semibold text-gray-700 align-middle"
                >
                  MO No
                </th>
                <th
                  rowSpan="2"
                  className="p-2 border border-gray-300 text-sm font-semibold text-gray-700 align-middle"
                >
                  Operator ID
                </th>
                {inspectionReps.map((rep) => (
                  <th
                    key={rep}
                    colSpan={
                      Object.values(visibleColumns).filter((v) => v).length
                    }
                    className="p-2 border border-gray-300 text-sm font-semibold text-gray-700"
                  >
                    {rep}
                  </th>
                ))}
              </tr>
              <tr>
                {inspectionReps.map((rep) => (
                  <React.Fragment key={`${rep}-sub`}>
                    {visibleColumns.accessory && (
                      <th className="p-2 border border-gray-300 bg-gray-100">
                        <PackageCheck
                          title="Accessory"
                          size={18}
                          className="mx-auto text-gray-600"
                        />
                      </th>
                    )}
                    {visibleColumns.measurements && (
                      <th className="p-2 border border-gray-300 bg-gray-100">
                        <Ruler
                          title="Measurements"
                          size={18}
                          className="mx-auto text-gray-600"
                        />
                      </th>
                    )}
                    {visibleColumns.defects && (
                      <th className="p-2 border border-gray-300 bg-gray-100">
                        <Wrench
                          title="Defects"
                          size={18}
                          className="mx-auto text-gray-600"
                        />
                      </th>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={
                      3 +
                      5 * Object.values(visibleColumns).filter((v) => v).length
                    }
                    className="text-center py-10"
                  >
                    <Loader className="animate-spin inline-block text-blue-500" />
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      3 +
                      5 * Object.values(visibleColumns).filter((v) => v).length
                    }
                    className="text-center py-10 text-gray-500"
                  >
                    No data found for the selected filters.
                  </td>
                </tr>
              ) : (
                // **** START: THE ONLY CORRECTION IS HERE in the tbody map ****
                reportData.map((row, rowIndex) => (
                  <tr
                    key={`${row.operatorId}-${row.lineNo}-${row.moNo}-${rowIndex}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="p-2 border border-gray-300 text-sm text-center font-medium">
                      {row.lineNo}
                    </td>
                    <td className="p-2 border border-gray-300 text-sm text-center font-medium">
                      {row.moNo}
                    </td>
                    <td className="p-2 border border-gray-300 text-sm text-center font-medium">
                      {row.operatorId}
                    </td>

                    {inspectionReps.map((repName) => {
                      const inspection = row.inspections.find(
                        (insp) => insp.rep_name === repName
                      );
                      const summary = inspection?.totalSummary;

                      const constructTooltipContent = (inspection, summary, row) => {
                        if (!inspection || !summary) return { text: "No inspection data", html: "<p>No inspection data available</p>" };

                        let defectsHtmlList = [];
                        let defectsTextList = [];
                        let allImages = [];
                        
                        // Access defects from row.pairingData (the original MongoDB data structure)
                        if (row?.pairingData?.length > 0) {
                          
                          const pairingRecord = row.pairingData.find(data => {
                            return data.inspection_rep_name === inspection.rep_name;
                          });
                         
                          
                          if (pairingRecord) {
                            
                            if (pairingRecord.defectSummary?.defectDetails?.length > 0) {
                              
                              pairingRecord.defectSummary.defectDetails.forEach((partTypeData,) => {
                                
                                if (partTypeData?.defectsForPart?.length > 0) {
                                  
                                  partTypeData.defectsForPart.forEach((partData, partIndex) => {
                                    
                                    if (partData?.defects?.length > 0) {
                                      
                                      partData.defects.forEach((defect, defectIndex) => {
                                        console.log(`Defect ${defectIndex}:`, defect);
                                        
                                        const defectName = defect.defectNameEng || 'Unknown Defect';
                                        const localizedDefectName = currentLanguage.startsWith('kh') 
                                          ? (defect.defectNameKhmer || defectName)
                                          : currentLanguage.startsWith('zh')
                                          ? (defect.defectNameChinese || defectName)
                                          : defectName;
                                        
                                        defectsTextList.push(
                                          `${partTypeData.partType} Part ${partData.partNo}: ${localizedDefectName} (Qty: ${defect.count})`
                                        );
                                        
                                        let singleDefectHtml = `<div style="margin: 4px 0; padding: 6px; border-left: 3px solid #dc2626; background-color: #fef2f2;">`;
                                        singleDefectHtml += `<strong>${partTypeData.partType} Part ${partData.partNo}:</strong> ${localizedDefectName} (Qty: ${defect.count})`;
                                        
                                        // Handle defect images
                                        if (defect.images && Array.isArray(defect.images) && defect.images.length > 0) {
                                          console.log(`Found ${defect.images.length} images for defect:`, defect.images);
                                          singleDefectHtml += `<div style="margin-top: 8px;">`;
                                          defect.images.forEach((image, imgIndex) => {
                                            if (image && typeof image === 'string') {
                                              allImages.push(image);
                                              singleDefectHtml += `<img src="${image}" alt="Defect Image ${imgIndex + 1}" class="defect-image-clickable" style="max-width: 80px; max-height: 80px; margin: 4px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;" />`;
                                            }
                                          });
                                          singleDefectHtml += `</div>`;
                                        } else {
                                          console.log('No images found for defect or images is not an array:', defect.images);
                                        }
                                        singleDefectHtml += `</div>`;
                                        defectsHtmlList.push(singleDefectHtml);
                                      });
                                    } else {
                                      console.log(`No defects found for part ${partData.partNo}`);
                                    }
                                  });
                                } else {
                                  console.log(`No defectsForPart found for part type ${partTypeData.partType}`);
                                }
                              });
                            } else {
                              console.log('No defect details found or defectDetails is empty');
                            }
                            
                            // Collect measurement images from pairingData
                            if (pairingRecord.measurementData?.length > 0) {
                              console.log('Processing measurement data for images...');
                              pairingRecord.measurementData.forEach((partTypeData) => {
                                if (partTypeData?.measurements?.length > 0) {
                                  partTypeData.measurements.forEach((measurement) => {
                                    if (measurement?.images?.length > 0) {
                                      console.log(`Found ${measurement.images.length} measurement images:`, measurement.images);
                                      measurement.images.forEach((image) => {
                                        if (image && typeof image === 'string') {
                                          allImages.push(image);
                                        }
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          } else {
                            console.log('No matching pairing record found for inspection:', inspection.rep_name);
                          }
                        } else {
                          console.log('No pairingData found in row');
                        }
                        
                        console.log('Final Defects HTML List:', defectsHtmlList);
                        console.log('Final All Images:', allImages);
                        console.log('=== END DEBUGGING ===');
                        
                        let finalDefectsHtml = "<strong>Defects:</strong> None";
                        if (defectsHtmlList.length > 0) {
                          finalDefectsHtml = `<strong>Defects Found:</strong><div style="margin-top: 8px;">${defectsHtmlList.join('')}</div>`;
                        }
                        
                        // Add all other images section
                        let allImagesHtml = "";
                        if (allImages.length > 0) {
                          allImagesHtml = `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                            <strong>All Images:</strong>
                            <div style="margin-top: 8px;">`;
                          allImages.forEach((image, index) => {
                            allImagesHtml += `<img src="${image}" alt="Image ${index + 1}" class="defect-image-clickable" style="max-width: 80px; max-height: 80px; margin: 4px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;" />`;
                          });
                          allImagesHtml += `</div></div>`;
                        }
                        
                        return {
                          text: `Pairing Inspection Details:
                              Date: ${filters.date ? formatDateForAPI(filters.date) : 'N/A'}
                              Line No: ${row.lineNo || 'N/A'}
                              MO No: ${row.moNo || 'N/A'}
                              Operator ID: ${row.operatorId || 'N/A'}
                              Inspection: ${inspection.rep_name}
                              Accessory Complete: ${inspection.accessoryComplete || 'N/A'}
                              Total Parts: ${summary?.totalParts || 0}
                              Total Pass: ${summary?.totalPass || 0}
                              Total Rejects: ${summary?.totalRejects || 0}
                              Pass Rate: ${summary?.passRate || 'N/A'}
                              Defect Rejected Parts: ${summary?.defectTotalRejectedParts || 0}
                              Defect Total Qty: ${summary?.defectTotalQty || 0}

                              Measurement Rejects:
                                Total: ${summary?.measurementTotalRejects || 0}
                                (+) ${summary?.measurementPositiveRejects || 0}
                                (-) ${summary?.measurementNegativeRejects || 0}

                              ${defectsTextList.length > 0 ? `Defects Found: ${defectsTextList.join(', ')}` : 'Defects: None'}`,
                          html: `
                            <div style="text-align: left; font-family: monospace; font-size: 0.85rem; line-height: 1.4;">
                              <h3 style="margin: 0 0 12px 0; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Pairing Inspection Details</h3>
                              <div style="margin-bottom: 12px;">
                                <strong>Date:</strong> ${filters.date ? formatDateForAPI(filters.date) : 'N/A'}<br>
                                <strong>Line No:</strong> ${row.lineNo || 'N/A'}<br>
                                <strong>MO No:</strong> ${row.moNo || 'N/A'}<br>
                                <strong>Operator ID:</strong> ${row.operatorId || 'N/A'}<br>
                                <strong>Inspection:</strong> ${inspection.rep_name}
                              </div>
                              <div style="margin-bottom: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                <strong>Accessory Complete:</strong> ${inspection.accessoryComplete || 'N/A'}<br>
                                <strong>Total Parts:</strong> ${summary.totalParts || 0}<br>
                                <strong>Total Pass:</strong> ${summary?.totalPass || 0}<br>
                                <strong>Total Rejects:</strong> ${summary?.totalRejects || 0}<br>
                                <strong>Pass Rate:</strong> ${summary?.passRate || 'N/A'}<br>
                                <strong>Defect Rejected Parts:</strong> ${summary?.defectTotalRejectedParts || 0}<br>
                                <strong>Defect Total Qty:</strong> ${summary?.defectTotalQty || 0}<br>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                                  <strong>Measurement Rejects:</strong><br>
                                  &nbsp;&nbsp;Total: ${summary?.measurementTotalRejects || 0}<br>
                                  &nbsp;&nbsp;Positive (+): ${summary?.measurementPositiveRejects || 0}<br>
                                  &nbsp;&nbsp;Negative (-): ${summary?.measurementNegativeRejects || 0}
                                </div>
                              </div>
                              <div style="padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                ${finalDefectsHtml}
                              </div>
                              ${allImagesHtml}
                            </div>
                          `
                        };
                      };

                      const tooltipContent = constructTooltipContent(inspection, summary, row);
                      
                      const accessoryCell = (
                        <td
                          className={`p-2 border border-gray-300 text-center cursor-pointer hover:opacity-80 ${
                            !inspection
                              ? "bg-gray-200"
                              : inspection.accessoryComplete === "Yes"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                          title={tooltipContent.text}
                          onClick={() => showDetailsOnTap(tooltipContent)}
                        >
                          {inspection &&
                            (inspection.accessoryComplete === "Yes" ? (
                              <CheckCircle
                                className="text-green-600 mx-auto"
                                size={20}
                              />
                            ) : (
                              <XCircle
                                className="text-red-600 mx-auto"
                                size={20}
                              />
                            ))}
                        </td>
                      );

                      const measurementCell = (
                        <td
                          className={`p-2 border border-gray-300 text-center text-xs cursor-pointer hover:opacity-80 ${
                            !summary
                              ? "bg-gray-200"
                              : summary.measurementTotalRejects > 0
                              ? "bg-red-100"
                              : "bg-green-100"
                          }`}
                          title={tooltipContent.text}
                          onClick={() => showDetailsOnTap(tooltipContent)}
                        >
                          {summary && (
                            <div>
                              <div className="font-bold">
                                {summary.totalPass ?? 0}/
                                {summary.totalParts ?? 0}
                              </div>
                              <div>
                                (T:{summary.measurementTotalRejects ?? 0}, N:
                                {summary.measurementNegativeRejects ?? 0}, P:
                                {summary.measurementPositiveRejects ?? 0})
                              </div>
                            </div>
                          )}
                        </td>
                      );

                      const defectCell = (
                        <td
                          className={`p-2 border border-gray-300 text-center text-xs cursor-pointer hover:opacity-80 ${
                            !summary
                              ? "bg-gray-200"
                              : summary.defectTotalRejectedParts > 0 ||
                                summary.defectTotalQty > 0
                              ? "bg-red-100"
                              : "bg-green-100"
                          }`}
                          title={tooltipContent.text}
                          onClick={() => showDetailsOnTap(tooltipContent)}
                        >
                          {summary && (
                            <div>
                              <div className="font-bold">
                                {summary.totalPass ?? 0}/
                                {summary.totalParts ?? 0}
                              </div>
                              <div>
                                (TR:{summary.defectTotalRejectedParts ?? 0}, Q:
                                {summary.defectTotalQty ?? 0})
                              </div>
                            </div>
                          )}
                        </td>
                      );

                      return (
                        <React.Fragment key={repName}>
                          {visibleColumns.accessory && accessoryCell}
                          {visibleColumns.measurements && measurementCell}
                          {visibleColumns.defects && defectCell}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
                // **** END: CORRECTION ****
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RovingPairingData;
