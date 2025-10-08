import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import { API_BASE_URL } from '../../../../../config'; 
import { MoreVertical, Eye, FileText, Download, Trash2 } from 'lucide-react';
import SubmittedWashingDataFilter from './SubmittedWashingDataFilter';
import QCWashingViewDetailsModal from './QCWashingViewDetailsModal'; 
import QCWashingFullReportModal from './QCWashingFullReportModal';
import { PDFDownloadLink} from '@react-pdf/renderer';
import Swal from 'sweetalert2';

// Polyfill Buffer for client-side PDF generation
window.Buffer = window.Buffer || Buffer;

// Polyfill Buffer for client-side PDF generation
window.Buffer = window.Buffer || Buffer;

const SubmittedWashingDataPage = () => {
  const [submittedData, setSubmittedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentFilters, setCurrentFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('estimated'); // 'estimated' or 'actual'
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [aqlEndpointAvailable, setAqlEndpointAvailable] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [paginatedData, setPaginatedData] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterVisible, setFilterVisible] = useState(true);
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
 const [checkpointDefinitions, setCheckpointDefinitions] = useState([]);

  // Single handleViewDetails function (removed the duplicate)
  const handleViewDetails = (record) => {
    // Ensure the record passed is the one from the currently rendered (and processed) data
    setViewDetailsModal({
      isOpen: true,
      itemData: record,
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
}


// Update the data fetching logic
const fetchSubmittedData = async (showLoading = true) => {
  try {
    if (showLoading) setIsLoading(true);
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
    if (err.message.includes('404')) {
      setError("Report feature is not yet implemented on the server.");
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      setError("Could not connect to server. Please check your connection.");
    } else {
      setError(`Error: ${err.message}`);
    }
  } finally {
    if (showLoading) setIsLoading(false);
  }
};

  useEffect(() => {
    fetchSubmittedData();
  }, []);

  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setCheckpointDefinitions(data);
        }
      } catch (e) {
        console.error("Failed to fetch checkpoint definitions", e);
      }
    };
    fetchDefinitions();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          // Ensure that `users` is always an array to prevent crashes
          const usersArray = data.users || (Array.isArray(data) ? data : []);
          setUsers(usersArray);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]); // On error, ensure it's an empty array
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const processDataForView = async () => {
      if (isLoading) return;

      if (viewMode === 'estimated') {
        const dataToProcess = submittedData.map(record => ({
          ...record,
          displayWashQty: record.washQty,
          isActualWashQty: false,
        }));
        applyFilters(currentFilters || {}, false, dataToProcess);
      } else {
        // Show estimated data immediately, then process actual data in background
        const estimatedData = submittedData.map(record => ({
          ...record,
          displayWashQty: record.washQty,
          isActualWashQty: false,
        }));
        applyFilters(currentFilters || {}, false, estimatedData);
        
        setIsProcessing(true);
        
        // Process actual data in background
        setTimeout(async () => {
          const BATCH_SIZE = 10;
          let actualData = [];
          
          for (let i = 0; i < submittedData.length; i += BATCH_SIZE) {
            const batch = submittedData.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
              batch.map(async (record) => {
                const washQtyData = await fetchRealWashQty(record);
                return { ...record, ...washQtyData };
              })
            );
            actualData.push(...batchResults);
            
            // Update UI progressively
            if (actualData.length % 20 === 0) {
              applyFilters(currentFilters || {}, false, [...actualData, ...submittedData.slice(actualData.length).map(r => ({ ...r, displayWashQty: r.washQty, isActualWashQty: false }))]);
            }
          }
          
          applyFilters(currentFilters || {}, false, actualData);
          setIsProcessing(false);
        }, 100);
      }
    };

    processDataForView();
  }, [viewMode, submittedData, currentFilters, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRealWashQty = async (record) => {
    try {
      if (record.reportType && (record.reportType.toLowerCase() === 'first output' || record.reportType.toLowerCase() === 'sop')) {
        const isSOP = record.reportType.toLowerCase() === 'sop';
        return { 
          displayWashQty: record.washQty || 0, 
          isActualWashQty: true, 
          isFirstOutput: !isSOP, 
          isSOP: isSOP,
          originalWashQty: record.washQty || 0, 
          source: isSOP ? 'sop' : 'first_output' 
        };
      }

      if (!record.reportType || record.reportType.toLowerCase() !== 'inline') {
        return { displayWashQty: record.washQty || 0, isActualWashQty: false, isFirstOutput: false, originalWashQty: record.washQty || 0, source: 'original' };
      }

      const factoryName = record.factoryName || '';

      if (factoryName.toUpperCase() === 'YM') {
        const dateStr = record.date ? new Date(record.date).toISOString().split('T')[0] : '';
        const styleNo = record.orderNo || '';
        let color = record.color || '';

        if (!dateStr || !styleNo || !color) {
          return { displayWashQty: record.washQty || 0, isActualWashQty: false, isFirstOutput: false, originalWashQty: record.washQty || 0, source: 'original' };
        }

        const colorMatch = color.match(/\[([^\]]+)\]/);
        if (colorMatch) {
          color = colorMatch[1];
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          const response = await fetch(`${API_BASE_URL}/api/qc-real-washing-qty/search?` + new URLSearchParams({ inspectionDate: dateStr, styleNo: styleNo, color: color }), {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.found && data.washQty > 0) {
              return { displayWashQty: data.washQty, isActualWashQty: true, isFirstOutput: false, originalWashQty: record.washQty || 0, source: 'qc_real_wash_qty_ym', details: data.details };
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn('Real wash qty request timed out for:', record.orderNo);
          } else {
            console.error('Error fetching real wash qty from qc_real_washing_qty:', error);
          }
        }
        return { displayWashQty: record.washQty || 0, isActualWashQty: false, isFirstOutput: false, originalWashQty: record.washQty || 0, source: 'original' };
      } else {
        if (record.editedActualWashQty !== null && record.editedActualWashQty !== undefined) {
          return {
            displayWashQty: record.editedActualWashQty,
            isActualWashQty: true,
            isFirstOutput: false,
            originalWashQty: record.washQty || 0,
            source: 'edited_actual_wash_qty',
            details: { recordId: record._id, editedValue: record.editedActualWashQty, lastEditedAt: record.lastEditedAt }
          };
        }
        return { displayWashQty: record.washQty || 0, isActualWashQty: false, isFirstOutput: false, originalWashQty: record.washQty || 0, source: 'original' };
      }
    } catch (error) {
      console.error('Error in fetchRealWashQty:', error);
      return { displayWashQty: record.washQty || 0, isActualWashQty: false, isFirstOutput: false, originalWashQty: record.washQty || 0, source: 'error' };
    }
  };


  // Helper function to extract defect details
  const getDefectDetails = (record) => {
    const defects = [];
    
    // Check defectsByPc in defectDetails
    if (record.defectDetails?.defectsByPc && Array.isArray(record.defectDetails.defectsByPc)) {
      record.defectDetails.defectsByPc.forEach(pc => {
        if (pc.pcDefects && Array.isArray(pc.pcDefects)) {
          pc.pcDefects.forEach(defect => {
            const existingDefect = defects.find(d => d.name === defect.defectName);
            if (existingDefect) {
              existingDefect.qty += parseInt(defect.defectQty) || 0;
            } else {
              defects.push({
                name: defect.defectName || 'Unknown',
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
    if (record.measurementDetails?.measurementSizeSummary && Array.isArray(record.measurementDetails.measurementSizeSummary)) {
      record.measurementDetails.measurementSizeSummary.forEach(summary => {
        checkedPoints += summary.checkedPoints || 0;
        totalPass += summary.totalPass || 0;
        totalFail += summary.totalFail || 0;
        plusToleranceFail += summary.plusToleranceFailCount || 0;
        minusToleranceFail += summary.minusToleranceFailCount || 0;
      });
    } else if (record.measurementDetails?.measurement) {
      // Fallback to calculating from measurement data
      record.measurementDetails.measurement.forEach(measurement => {
        if (measurement.pcs && Array.isArray(measurement.pcs)) {
          measurement.pcs.forEach(pc => {
            if (pc.measurementPoints && Array.isArray(pc.measurementPoints)) {
              pc.measurementPoints.forEach(point => {
                if (point.result === 'pass' || point.result === 'fail') {
                  checkedPoints++;
                  if (point.result === 'pass') {
                    totalPass++;
                  } else {
                    totalFail++;
                    // Determine if it's plus or minus tolerance fail
                    if (point.measured_value_decimal > point.tolerancePlus) {
                      plusToleranceFail++;
                    } else if (point.measured_value_decimal < point.toleranceMinus) {
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

// Skip image conversion due to CORS issues - use placeholders
const convertImageToBase64 = async (imagePath, API_BASE_URL) => {
  if (!imagePath) return null;
  
  // If it's already base64, return it
  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }
  return null;
};


// Process images for PDF rendering
const processImagesInRecord = async (record, API_BASE_URL) => {
  try {
    const processedRecord = JSON.parse(JSON.stringify(record)); // Deep clone
    
    
    // Process defect images
    if (processedRecord.defectDetails?.defectsByPc) {
      
      for (let pcIndex = 0; pcIndex < processedRecord.defectDetails.defectsByPc.length; pcIndex++) {
        const pcDefect = processedRecord.defectDetails.defectsByPc[pcIndex];
        
        if (pcDefect.pcDefects) {
          
          for (let defectIndex = 0; defectIndex < pcDefect.pcDefects.length; defectIndex++) {
            const defect = pcDefect.pcDefects[defectIndex];
            
            if (defect.defectImages && Array.isArray(defect.defectImages)) {
              
              const processedImages = [];
              for (const imagePath of defect.defectImages) {
                // Skip if already base64
                if (imagePath && imagePath.startsWith('data:image/')) {
                  processedImages.push(imagePath);
                  continue;
                }
                
                // For CORS-blocked images, add placeholder info
                processedImages.push({ isPlaceholder: true, originalUrl: imagePath, type: 'defect' });
              }
              
              // IMPORTANT: Assign the processed images back to the correct location
              processedRecord.defectDetails.defectsByPc[pcIndex].pcDefects[defectIndex].defectImages = processedImages;
            }
          }
        }
      }
    }

    // Process additional images
    if (processedRecord.defectDetails?.additionalImages && Array.isArray(processedRecord.defectDetails.additionalImages)) {
      const processedAdditionalImages = [];
      for (const imagePath of processedRecord.defectDetails.additionalImages) {
        // Skip if already base64
        if (imagePath && imagePath.startsWith('data:image/')) {
          processedAdditionalImages.push(imagePath);
          continue;
        }
        
        processedAdditionalImages.push({ isPlaceholder: true, originalUrl: imagePath, type: 'additional' });
      }
      
      // IMPORTANT: Assign the processed images back
      processedRecord.defectDetails.additionalImages = processedAdditionalImages;
    }

    // Process inspection images
    if (processedRecord.inspectionDetails?.checkedPoints) {
      for (let pointIndex = 0; pointIndex < processedRecord.inspectionDetails.checkedPoints.length; pointIndex++) {
        const point = processedRecord.inspectionDetails.checkedPoints[pointIndex];
        
        // Process point image
        if (point.image) {
          try {
            if (!point.image.startsWith('data:image/')) {
              const processedImage = await convertImageToBase64(point.image, API_BASE_URL);
              processedRecord.inspectionDetails.checkedPoints[pointIndex].image = processedImage || null;
            }
          } catch (error) {
            console.warn(`Skipping corrupted point image: ${point.image}`, error.message);
            processedRecord.inspectionDetails.checkedPoints[pointIndex].image = null;
          }
        }

        // Process comparison images in inspection points
        if (point.comparison && Array.isArray(point.comparison)) {
          const processedComparisonImages = [];
          for (const imagePath of point.comparison) {
            if (imagePath.startsWith('data:image/')) {
              processedComparisonImages.push(imagePath);
            } else {
              console.log(`🖼️ Adding comparison image placeholder for: ${imagePath}`);
              processedComparisonImages.push({ isPlaceholder: true, originalUrl: imagePath, type: 'comparison' });
            }
          }
          processedRecord.inspectionDetails.checkedPoints[pointIndex].comparison = processedComparisonImages;
        }
      }
    }

    // Process machine process images
    if (processedRecord.inspectionDetails?.machineProcesses) {
      for (let machineIndex = 0; machineIndex < processedRecord.inspectionDetails.machineProcesses.length; machineIndex++) {
        const machine = processedRecord.inspectionDetails.machineProcesses[machineIndex];
        if (machine.image) {
          try {
            if (!machine.image.startsWith('data:image/')) {
              const processedImage = await convertImageToBase64(machine.image, API_BASE_URL);
              processedRecord.inspectionDetails.machineProcesses[machineIndex].image = processedImage || null;
            }
          } catch (error) {
            console.warn(`Skipping corrupted machine image: ${machine.image}`, error.message);
            processedRecord.inspectionDetails.machineProcesses[machineIndex].image = null;
          }
        }
      }
    }
    
    return processedRecord;
  } catch (error) {
    console.error('❌ Error processing images in record:', error);
    return record; // Return original record if processing fails
  }
};

const processImageToBase64 = async (imagePath) => {
  try {
    
    const cleanPath = imagePath.replace('./public/', '');
    const response = await fetch(`${API_BASE_URL}/${cleanPath}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Validate JPEG header (SOI marker: 0xFF 0xD8)
    if (uint8Array.length < 2) {
      throw new Error('Image data too short');
    }
    
    if (uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) {
      // Sometimes the header gets corrupted, try to find the actual start
      let soi = -1;
      for (let i = 0; i < Math.min(100, uint8Array.length - 1); i++) {
        if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8) {
          soi = i;
          break;
        }
      }
      
      if (soi > 0) {
        // Create new array starting from the actual SOI
        const correctedArray = uint8Array.slice(soi);
        const base64 = btoa(String.fromCharCode.apply(null, correctedArray));
        return `data:image;base64,${base64}`;
      } else {
        throw new Error('No valid JPEG SOI marker found');
      }
    }
    
    // Convert to base64 using chunks to avoid call stack issues
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    
    const base64 = btoa(binary);
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    
    // Final validation
    try {
      atob(base64);
    } catch (e) {
      console.error('❌ Base64 validation failed:', e);
      return null;
    }
    
    return dataUrl;
  } catch (error) {
    console.error('❌ Error processing image:', imagePath, error);
    return null;
  }
};

  const handleDownloadPDF = async (record) => {
  try {
    setIsQcWashingPDF(true);
    
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not defined');
    }
    
    // Fetch inspector details if userId exists
    let inspectorDetails = null;
    if (record.userId) {
      try {
        const inspectorResponse = await fetch(`${API_BASE_URL}/api/users/${record.userId}`);
        if (inspectorResponse.ok) {
          const userData = await inspectorResponse.json();
          if (userData && !userData.error) {
            inspectorDetails = userData;
          }
        } else {
          console.warn('⚠️ Failed to fetch inspector details:', inspectorResponse.status);
        }
      } catch (inspectorError) {
        console.warn('❌ Could not fetch inspector details:', inspectorError);
      }
    }
    
    // Fetch comparison data
    let comparisonData = null;
    if (record.measurementDetails?.measurement?.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/qc-washing/results?` + new URLSearchParams({
          orderNo: record.orderNo,
          color: record.color,
          washType: record.washType,
          reportType: record.reportType,
          factory: record.factoryName
        }));
        
        if (response.ok) {
          const data = await response.json();
          const targetWashType = record.before_after_wash === 'Before Wash' ? 'After Wash' : 'Before Wash';
          comparisonData = data.find(r => 
            r.orderNo === record.orderNo &&
            r.color === record.color &&
            r.washType === record.washType &&
            r.reportType === record.reportType &&
            r.factoryName === record.factoryName &&
            r.before_after_wash === targetWashType
          );
        }
      } catch (error) {
        console.warn('Could not fetch comparison data:', error);
      }
    }
    
    // FIXED: Preload images before generating PDF
    const preloadedImages = await preloadImagesForRecord(record, API_BASE_URL);
    
    // Add inspector photo to preloaded images if available
    if (inspectorDetails?.face_photo) {
      try {
        const loadInspectorPhoto = async (src, API_BASE_URL) => {
          let imageUrl = src;
          
          if (typeof src === 'object' && src !== null) {
            imageUrl = src.originalUrl || src.url || src.src || src.path || JSON.stringify(src);
          }
          
          if (!imageUrl || typeof imageUrl !== 'string') {
            console.warn('❌ Invalid inspector photo URL:', src);
            return null;
          }
          
          if (imageUrl.startsWith('data:')) {
            return imageUrl;
          }
          
          try {
            let cleanUrl = imageUrl.trim();
            
            const proxyUrl = `${API_BASE_URL}/api/image-proxy-all?url=${encodeURIComponent(cleanUrl)}`;
            const response = await fetch(proxyUrl, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.dataUrl && data.dataUrl.startsWith('data:')) {
                return data.dataUrl;
              } else {
                console.warn('❌ Invalid response data for inspector photo:', data);
              }
            } else {
              console.warn('❌ Failed to fetch inspector photo:', response.status, response.statusText);
            }
            return null;
          } catch (error) {
            console.error('❌ Error loading inspector photo:', error);
            return null;
          }
        };
        
        const inspectorPhotoBase64 = await loadInspectorPhoto(inspectorDetails.face_photo, API_BASE_URL);
        if (inspectorPhotoBase64) {
          // Store with multiple possible keys for better matching
          const photoKeys = [
            inspectorDetails.face_photo,
            inspectorDetails.face_photo.trim(),
            inspectorDetails.face_photo.startsWith('/') ? inspectorDetails.face_photo.substring(1) : '/' + inspectorDetails.face_photo
          ];
          
          photoKeys.forEach(key => {
            if (key && key.trim()) {
              preloadedImages[key.trim()] = inspectorPhotoBase64;
            }
          });
          
        } else {
          console.warn('⚠️ Inspector photo could not be loaded');
        }
      } catch (error) {
        console.error('❌ Failed to load inspector photo:', error);
      }
    } else {
      console.log('ℹ️ No inspector photo available');
    }
    
    
    // Import the PDF renderer
    const { pdf } = await import('@react-pdf/renderer');
    const { QcWashingFullReportPDF } = await import('./qcWashingFullReportPDF');
    
    if (!record || !record._id) {
      throw new Error('Invalid record data');
    }
    // Generate PDF with preloaded images and inspector details
    const blob = await pdf(
      React.createElement(QcWashingFullReportPDF, {
        recordData: record,
        comparisonData: comparisonData,
        API_BASE_URL: API_BASE_URL,
        checkpointDefinitions: checkpointDefinitions,
        preloadedImages: preloadedImages,
        skipImageLoading: false,
        inspectorDetails: inspectorDetails
      })
    ).toBlob();
    
    
    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QC_Washing_Report_${record.orderNo}_${record.color}_${record.before_after_wash.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success alert after download
    Swal.fire({
      title: 'Success!',
      text: 'PDF downloaded successfully!',
      icon: 'success',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });
    
  } catch (error) {
    // Provide more specific error messages
    let errorMessage = 'Failed to generate PDF';
    if (error.message.includes('SOI not found')) {
      errorMessage = 'Image format error. Some images may be corrupted.';
    } else if (error.message.includes('string child')) {
      errorMessage = 'Data formatting error. Please try again.';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Network access error. Please check your connection.';
    }
    
    Swal.fire({
      title: 'Error!',
      text: `${errorMessage}: ${error.message}`,
      icon: 'error',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  } finally {
    setIsQcWashingPDF(false);
  }
};

// FIXED: Add this helper function to preload images
const preloadImagesForRecord = async (record, API_BASE_URL) => {
  
  
  const imageCollection = new Map();
  const imageMap = {};
  
  // Helper function to normalize image keys (same as in PDF component)
  const normalizeImageKey = (src) => {
    if (typeof src === 'string') {
      return src.trim();
    } else if (typeof src === 'object' && src !== null) {
      return src.originalUrl || src.url || src.src || src.path || JSON.stringify(src);
    }
    return JSON.stringify(src);
  };
  
  // Helper function to add images to collection
  const addImageToCollection = (img, context = '') => {
  if (!img) return;
  
  
  // Generate all possible keys for this image (same logic as PDF component)
  const generateStorageKeys = (img) => {
    const keys = new Set();
    
    if (typeof img === 'string') {
      const cleanImg = img.trim();
      keys.add(cleanImg);
      keys.add(img); // untrimmed
      
      // Handle different URL formats
      if (cleanImg.startsWith('/')) {
        keys.add(cleanImg.substring(1));
      } else {
        keys.add('/' + cleanImg);
      }
      
      // Handle full URLs - extract path for 192.167.12.85:5000
      if (cleanImg.includes('192.167.12.85:5000')) {
        const urlParts = cleanImg.split('192.167.12.85:5000');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          keys.add(path);
          keys.add(path.startsWith('/') ? path.substring(1) : '/' + path);
        }
      }
      
      // Handle yqms.yaikh.com URLs - extract path
      if (cleanImg.includes('yqms.yaikh.com')) {
        const urlParts = cleanImg.split('yqms.yaikh.com');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          keys.add(path);
          keys.add(path.startsWith('/') ? path.substring(1) : '/' + path);
        }
      }
      
      // Handle storage/public paths
      if (cleanImg.includes('/storage/') || cleanImg.includes('/public/')) {
        const pathMatch = cleanImg.match(/(\/(?:storage|public)\/.+)/);
        if (pathMatch) {
          keys.add(pathMatch[1]);
          keys.add(pathMatch[1].substring(1));
        }
      }
      
    } else if (typeof img === 'object' && img !== null) {
      const possibleUrls = [
        img.originalUrl,
        img.url,
        img.src,
        img.path
      ].filter(Boolean);
      
      possibleUrls.forEach(url => {
        if (typeof url === 'string') {
          const subKeys = generateStorageKeys(url);
          subKeys.forEach(key => keys.add(key));
        }
      });
      
      keys.add(JSON.stringify(img));
    }
    
    return Array.from(keys);
  };

  const possibleKeys = generateStorageKeys(img);
  
  // Store all possible keys pointing to the same image source
  possibleKeys.forEach(key => {
    if (key && key.trim()) {
      imageCollection.set(key.trim(), img);
    }
  });
};

  // Collect defect images (both captured and uploaded)
  if (record.defectDetails?.defectsByPc) {
    record.defectDetails.defectsByPc.forEach((pc, pcIndex) => {
      if (pc.pcDefects) {
        pc.pcDefects.forEach((defect, defectIndex) => {
          // Collect captured defect images
          if (defect.defectImages && Array.isArray(defect.defectImages)) {
            defect.defectImages.forEach((img, imgIndex) => {
              addImageToCollection(img, `defect-pc${pcIndex}-defect${defectIndex}-captured${imgIndex}`);
            });
          }
          // Collect uploaded defect images
          if (defect.uploadedImages && Array.isArray(defect.uploadedImages)) {
            defect.uploadedImages.forEach((img, imgIndex) => {
              addImageToCollection(img, `defect-pc${pcIndex}-defect${defectIndex}-uploaded${imgIndex}`);
            });
          }
        });
      }
    });
  }
  

  // Collect additional images
  if (record.defectDetails?.additionalImages && Array.isArray(record.defectDetails.additionalImages)) {
    record.defectDetails.additionalImages.forEach((img, index) => {
      addImageToCollection(img, `additional-${index}`);
    });
  }

  // Collect new inspection images (both captured and uploaded)
  if (record.inspectionDetails?.checkpointInspectionData) {
    record.inspectionDetails.checkpointInspectionData.forEach((checkpoint, checkIndex) => {
      
      
      // Collect captured comparison images
      if (checkpoint.comparisonImages && Array.isArray(checkpoint.comparisonImages)) {
        checkpoint.comparisonImages.forEach((img, imgIndex) => {
          addImageToCollection(img, `checkpoint${checkIndex}-main-captured${imgIndex}`);
        });
      }
      // Collect uploaded comparison images
      if (checkpoint.uploadedImages && Array.isArray(checkpoint.uploadedImages)) {
        checkpoint.uploadedImages.forEach((img, imgIndex) => {
          addImageToCollection(img, `checkpoint${checkIndex}-main-uploaded${imgIndex}`);
        });
      }
      if (checkpoint.subPoints) {
        checkpoint.subPoints.forEach((subPoint, subIndex) => {
          
          
          // Collect captured sub-point images
          if (subPoint.comparisonImages && Array.isArray(subPoint.comparisonImages)) {
            subPoint.comparisonImages.forEach((img, imgIndex) => {
              addImageToCollection(img, `checkpoint${checkIndex}-sub${subIndex}-captured${imgIndex}`);
            });
          }
          // Collect uploaded sub-point images
          if (subPoint.uploadedImages && Array.isArray(subPoint.uploadedImages)) {
            subPoint.uploadedImages.forEach((img, imgIndex) => {
              addImageToCollection(img, `checkpoint${checkIndex}-sub${subIndex}-uploaded${imgIndex}`);
            });
          }
        });
      }
    });
  }

  // Collect legacy inspection images (both captured and uploaded)
  if (record.inspectionDetails?.checkedPoints) {
    record.inspectionDetails.checkedPoints.forEach((point, pointIndex) => {
      // Collect captured comparison images
      if (point.comparison && Array.isArray(point.comparison)) {
        point.comparison.forEach((img, imgIndex) => {
          addImageToCollection(img, `legacy-point${pointIndex}-captured${imgIndex}`);
        });
      }
      // Collect uploaded comparison images
      if (point.uploadedImages && Array.isArray(point.uploadedImages)) {
        point.uploadedImages.forEach((img, imgIndex) => {
          addImageToCollection(img, `legacy-point${pointIndex}-uploaded${imgIndex}`);
        });
      }
    });
  }

  // Collect machine images
  if (record.inspectionDetails?.machineProcesses) {
    record.inspectionDetails.machineProcesses.forEach((machine, machineIndex) => {
      if (machine.image) {
        addImageToCollection(machine.image, `machine${machineIndex}`);
      }
    });
  }

  // ENHANCED: Load images with better error handling and validation
  const loadImageAsBase64 = async (src, API_BASE_URL) => {
  let imageUrl = src;
  
  // Handle different image data formats
  if (typeof src === 'object' && src !== null) {
    if (src.originalUrl) {
      imageUrl = src.originalUrl;
    } else {
      imageUrl = src.url || src.src || src.path || JSON.stringify(src);
    }
  }
  
  if (typeof src === 'string' && src.startsWith('{')) {
    try {
      const parsed = JSON.parse(src);
      if (parsed.originalUrl) {
        imageUrl = parsed.originalUrl;
      } else {
        imageUrl = parsed.url || parsed.src || parsed.path || src;
      }
    } catch (e) {
      imageUrl = src;
    }
  }

  if (!imageUrl || typeof imageUrl !== 'string') {
    console.warn('Invalid image URL:', src);
    return null;
  }

  // If already base64, validate and return
  if (imageUrl.startsWith('data:')) {
    try {
      const base64Parts = imageUrl.split(',');
      if (base64Parts.length === 2 && base64Parts[1].length > 100) {
        // Test decode to ensure validity
        atob(base64Parts[1].substring(0, 100));
        return imageUrl;
      }
    } catch (e) {
      console.warn('Invalid base64 data:', e.message);
      return null;
    }
  }

  try {
    // Clean and normalize the URL
    let cleanUrl = imageUrl.trim();
    
    // Handle relative URLs
    if (cleanUrl.startsWith('/storage/') || cleanUrl.startsWith('/public/')) {
      cleanUrl = `${API_BASE_URL}${cleanUrl}`;
    }
    
    // ALWAYS use proxy to avoid CORS issues
    const proxyUrl = `${API_BASE_URL}/api/image-proxy-all?url=${encodeURIComponent(cleanUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.dataUrl && data.dataUrl.startsWith('data:')) {
        return data.dataUrl;
      }
    }
    
    return null;
    
  } catch (error) {
    console.warn('❌ Error loading image:', imageUrl, error.message);
    return null;
  }
};

  // Load all images with enhanced error handling
  const loadPromises = Array.from(imageCollection.entries()).map(async ([key, url], index) => {
    try {
      // Add progressive delay to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, index * 50));
      
      
      const base64 = await loadImageAsBase64(url, API_BASE_URL);
      
      if (base64 && base64.startsWith('data:')) {
        // Additional validation for base64 data
        const base64Parts = base64.split(',');
        if (base64Parts.length === 2 && base64Parts[1].length > 100) {
          try {
            // Test decode to ensure validity
            atob(base64Parts[1].substring(0, 100));
            imageMap[key] = base64;
            return { success: true, key };
          } catch (decodeError) {
            return { success: false, key, error: 'Base64 validation failed' };
          }
        } else {
          return { success: false, key, error: 'Invalid base64 format' };
        }
      } else {
        return { success: false, key, error: 'No valid base64 data' };
      }
    } catch (error) {
      return { success: false, key, error: error.message };
    }
  });

  // Wait for all images to load with timeout
  const results = await Promise.allSettled(loadPromises);
  
  let successCount = 0;
  let failCount = 0;
  const failedImages = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
    } else {
      failCount++;
      if (result.status === 'fulfilled') {
        failedImages.push(result.value.key);
      }
    }
  });

  if (failedImages.length > 0) {
    console.log('❌ Failed images:', failedImages.slice(0, 5)); // Show first 5 failed
  }

  return imageMap;
};

  const toggleDropdown = (recordId) => {
    setOpenDropdown(openDropdown === recordId ? null : recordId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Cross-filtering function with proper cumulative filtering
  const applyFilters = (filters, resetPage = true, dataToFilter = submittedData) => {
    let filtered = [...dataToFilter];
    
    // Date range filter
    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const startDate = filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null;
        const endDate = filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null;
        
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
      filtered = filtered.filter(item => 
        item.orderNo?.toLowerCase().includes(filters.orderNo.toLowerCase())
      );
    }

    // Color filter
    if (filters.color) {
      filtered = filtered.filter(item => item.color === filters.color);
    }

    // QC ID filter
    if (filters.qcId) {
      const searchTerm = filters.qcId.toLowerCase();
      filtered = filtered.filter(item => {
        // Check if the search term is in the user ID
        if (item.userId?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Check if the search term is in the user's name
        const user = users.find(u => u.emp_id === item.userId || u.userId === item.userId);
        if (user && user.eng_name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        return false;
      });
    }

    // Buyer filter
    // if (filters.buyer) {
    //   filtered = filtered.filter(item => item.buyer === filters.buyer);
    // }

    // Factory name filter
    if (filters.factoryName) {
      filtered = filtered.filter(item => item.factoryName === filters.factoryName);
    }

    // Report type filter
    if (filters.reportType) {
      filtered = filtered.filter(item => item.reportType === filters.reportType);
    }

    // Wash type filter
    if (filters.washType) {
      filtered = filtered.filter(item => item.washType === filters.washType);
    }

    // Before/After wash filter
    if (filters.before_after_wash) {
      filtered = filtered.filter(item => item.before_after_wash === filters.before_after_wash);
    }

    setFilteredData(filtered);
    if (resetPage) {
      setCurrentPage(1); // Reset to first page only when filters change
    }
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
    // The main useEffect hook will now handle applying filters when `currentFilters` changes.
  };

  // Reset filters
  const handleFilterReset = () => {
    setCurrentFilters({});
    // The main useEffect hook will handle this state change.
  };

  // This useEffect was causing the processed 'actual' data to be overwritten by raw 'submittedData'.
  // The main `processDataForView` useEffect now correctly handles updates when `submittedData` changes.
  useEffect(() => {
  // Update paginated data when filtered data or current page changes
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage, itemsPerPage]);

  // This useEffect ensures that if a modal is open while the view mode changes,
  // the data inside the modal is refreshed to match the new view.
  useEffect(() => {
    if (viewDetailsModal.isOpen && viewDetailsModal.itemData?._id) {
      const updatedItemData = filteredData.find(
        (record) => record._id === viewDetailsModal.itemData._id
      );
      if (updatedItemData) {
        setViewDetailsModal((prev) => ({
          ...prev,
          itemData: updatedItemData,
        }));
      }
    }
    if (fullReportModal.isOpen && fullReportModal.recordData?._id) {
      const updatedRecordData = filteredData.find(record => record._id === fullReportModal.recordData._id);
      if (updatedRecordData) setFullReportModal(prev => ({ ...prev, recordData: updatedRecordData }));
    }
  }, [filteredData, viewDetailsModal.isOpen, fullReportModal.isOpen]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredData.length);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading submitted data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">⚠️ Error</div>
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
        filteredData={filteredData}
        onFilterChange={handleFilterChange}
        onReset={handleFilterReset}
        isVisible={filterVisible}
        onToggle={() => setFilterVisible(!filterVisible)}
        users={users}
        loadingUsers={loadingUsers}
      />

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              QC Washing Final Reports
              {isProcessing && (
                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                  (Processing actual data...)
                </span>
              )}
            </h2>
             <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
              <button
                onClick={() => setViewMode('estimated')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  viewMode === 'estimated' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50'
                }`}
              >
                Estimated
              </button>
              <button
                onClick={() => setViewMode('actual')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  viewMode === 'actual' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50'
                }`}
              >
                Actual
              </button>
            </div>
          </div>
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
              Showing {startIndex}-{endIndex} of {filteredData.length} records
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📋</div>
            <div className="text-gray-600 dark:text-gray-300 mb-2">
              {submittedData.length === 0 ? 'No submitted data found.' : 'No records match your filters.'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {submittedData.length === 0 
                ? 'Submit some QC washing data to see reports here.' 
                : 'Try adjusting your filter criteria.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full max-h-[70vh]">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 min-w-max">
              {/* Table headers */}
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28 whitespace-normal">
                    Inspection Date
                  </th>
                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                   Factory
                  </th>
                   {/* <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                   Buyer
                  </th> */}
                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                  Wash Type
                  </th>
                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                 Report Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28 whitespace-normal">
                   Before/After Wash
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                    MO No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                    Color
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                    QC/QA ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28 whitespace-normal">
                    Total Order Qty
                  </th>
                  {/* <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Color Order Qty
                  </th> */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                   Wash Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28 whitespace-normal">
                   Checked Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24 whitespace-normal">
                   Defect Qty
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32 whitespace-normal">
                    Measurement Result / Pass Rate (%)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32 whitespace-normal">
                    Result / Defect Rate
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32 whitespace-normal">
                    Overall Result
                  </th>
                  
                  {showDefectColumn && (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48 whitespace-normal">
                      Defect Details
                    </th>
                  )}
                  {showMeasurementColumn && (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-64 whitespace-normal">
                      Measurement Details
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20 whitespace-normal">
                    Actions
                  </th>
                </tr>
                {/* Sub-header row for complex columns */}
                <tr className="bg-gray-100 dark:bg-gray-600">
                  <th className="px-3 py-2"></th>
                  {/* <th className="px-3 py-2"></th> */}
                  {/* <th className="px-3 py-2"></th> */}
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
                {paginatedData.map((record, index) => {
                  const defectDetails = getDefectDetails(record);
                  const measurementDetails = getMeasurementDetails(record);
                  const totalDefectCount = record.totalDefectCount ?? defectDetails.reduce((sum, defect) => sum + (defect.qty || 0), 0);
                  const defectRate = record.defectRate?.toFixed(1) ?? "0.0";
                  
                  return (
                    <tr key={record._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.factoryName || 'N/A'}
                      </td>
                      {/* <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.buyer || 'N/A'}
                      </td> */}
                       <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {(record.washType || 'N/A').replace(' Wash', '')}
                      </td>
                       <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.reportType || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {(record.before_after_wash || 'N/A').replace(' Wash', '')}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                        {record.orderNo || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.color || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.userId || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.orderQty || 'N/A'}
                      </td>
                      {/* <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.colorOrderQty || 'N/A'}
                      </td> */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        <div className="flex flex-col">
                          <span className={`font-medium ${
                            record.isActualWashQty ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {record.displayWashQty ?? 'N/A'}
                          </span>
                          {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                            {viewMode === 'actual' && (record.isFirstOutput
                              ? 'Actual (First Output)'
                              : record.isActualWashQty
                                ? record.washQtySource === 'qc_real_wash_qty_ym'
                                  ? 'Actual (YM Real)'
                                  : record.washQtySource === 'edited_actual_wash_qty'
                                  ? 'Actual'
                                  : 'Actual'
                                : 'Estimated')}
                          </span> */}
                         
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.checkedQty || 'N/A'}
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {totalDefectCount}
                      </td>
                       <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {(() => {
                          const { totalPass, totalFail } = measurementDetails;
                          const totalPoints = totalPass + totalFail;
                          const passRateValue = totalPoints > 0 
                            ? Math.round((totalPass / totalPoints) * 100) 
                            : (record.passRate || 0);
                          
                          const status = passRateValue >= 95 ? 'Pass' : 'Fail';

                          return (
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                status === 'Pass' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                              }`}>
                                {status}
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ({passRateValue}%)
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {(() => {
                          const result = record.defectDetails?.result || 'Pending';
                          return (
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result === 'Pass' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                  : result === 'Fail'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-yellow-600 dark:text-gray-200'
                              }`}>
                                {result}
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ({defectRate}%)
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const finalResult = record.overallFinalResult || 'Pending';
                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              finalResult === 'Pass' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                : finalResult === 'Fail'
                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-yellow-600 dark:text-gray-200'
                            }`}>
                              {finalResult}
                            </span>
                          );
                        })()}
                      </td>
                      
                      {showDefectColumn && (
                        <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {defectDetails.length > 0 ? (
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {defectDetails.map((defect, idx) => (
                                <div key={idx} className="grid grid-cols-2 gap-2 text-xs border-b border-gray-100 dark:border-gray-600 pb-1">
                                  <span className="truncate" title={defect.name}>{defect.name}</span>
                                  <span className="text-center">{defect.qty}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">No defects</span>
                          )}
                        </td>
                      )}
                      {showMeasurementColumn && (
                        <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                          <div className="grid grid-cols-5 gap-1 text-xs">
                            <span className="text-center">{measurementDetails.checkedPoints}</span>
                            <span className="text-center text-green-600 dark:text-green-400">{measurementDetails.totalPass}</span>
                            <span className="text-center text-red-600 dark:text-red-400">{measurementDetails.totalFail}</span>
                            <span className="text-center text-orange-600 dark:text-orange-400">{measurementDetails.plusToleranceFail}</span>
                            <span className="text-center text-orange-600 dark:text-orange-400">{measurementDetails.minusToleranceFail}</span>
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
                          <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
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
                              <button
                                onClick={() => {
                                  handleDownloadPDF(record);
                                  setOpenDropdown(null);
                                }}
                                disabled={isqcWashingPDF}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                              >
                                <Download size={16} className="mr-3" />
                                {isqcWashingPDF ? 'Generating PDF...' : 'Download PDF'}
                              </button>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex} to {endIndex} of {filteredData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <QCWashingViewDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={handleCloseViewDetails}
        itemData={viewDetailsModal.itemData}
        allRecords={filteredData}
      />

      {/* Full Report Modal - ADD THIS */}
    <QCWashingFullReportModal
      isOpen={fullReportModal.isOpen}
      onClose={handleCloseFullReport}
        recordData={fullReportModal.recordData}
        checkpointDefinitions={checkpointDefinitions}
    />
    </div>
  );
};

export default SubmittedWashingDataPage;
