import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import { API_BASE_URL } from '../../../../../config'; 
import { MoreVertical, Eye, FileText, Download } from 'lucide-react';
import SubmittedWashingDataFilter from './SubmittedWashingDataFilter';
import QCWashingViewDetailsModal from './QCWashingViewDetailsModal'; 
import QCWashingFullReportModal from './QCWashingFullReportModal';
import Swal from 'sweetalert2';

// Polyfill Buffer for client-side PDF generation
window.Buffer = window.Buffer || Buffer;


const SubmittedWashingDataPage = () => {
  const [submittedData, setSubmittedData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentFilters, setCurrentFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('actual'); // 'estimated' or 'actual'
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

//  const [isRefreshing, setIsRefreshing] = useState(false);
// const [refreshStatus, setRefreshStatus] = useState(null);
 
// const handleRefreshActualWashQty = async () => {
//   try {
//     setIsRefreshing(true);
//     setRefreshStatus(null);

//     const response = await fetch(`${API_BASE_URL}/api/qc-washing/refresh-actual-wash-qty`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     const result = await response.json();

//     if (result.success) {
//       setRefreshStatus({
//         type: 'success',
//         message: result.message,
//         details: result.data
//       });

//       // Show success message
//       Swal.fire({
//         title: "Success!",
//         text: result.message,
//         icon: "success",
//         timer: 5000,
//         showConfirmButton: true,
//       });

//       // Refresh the current data
//       await fetchSubmittedData(false); // Refresh data without showing loading
      
//       // Reset processed data to trigger re-processing with new actual values
//       setProcessedData([]);
      
//     } else {
//       throw new Error(result.message || 'Failed to refresh actual wash quantities');
//     }

//   } catch (error) {
//     console.error('Error refreshing actual wash quantities:', error);
//     setRefreshStatus({
//       type: 'error',
//       message: error.message
//     });

//     Swal.fire({
//       title: "Error!",
//       text: `Failed to refresh: ${error.message}`,
//       icon: "error",
//       timer: 5000,
//       showConfirmButton: true,
//     });
//   } finally {
//     setIsRefreshing(false);
//   }
// };

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
    if (isLoading || submittedData.length === 0) return;

    if (viewMode === 'estimated') {
      const dataToProcess = submittedData.map(record => ({
        ...record,
        displayWashQty: record.washQty,
        isActualWashQty: false,
        displayCheckedQty: record.checkedQty
      }));
      setProcessedData(dataToProcess);
      applyFilters(currentFilters || {}, currentFilters ? false : true, dataToProcess);
    } else {
      // For actual mode, show estimated data first, then process actual data
      const estimatedData = submittedData.map(record => ({
        ...record,
        displayWashQty: record.washQty,
        isActualWashQty: false,
        displayCheckedQty: record.checkedQty
      }));
      setProcessedData(estimatedData);
      applyFilters(currentFilters || {}, currentFilters ? false : true, estimatedData);
      
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
            const progressData = [...actualData, ...submittedData.slice(actualData.length).map(r => ({ 
              ...r, 
              displayWashQty: r.washQty, 
              isActualWashQty: false,
              displayCheckedQty: r.checkedQty
            }))];
            setProcessedData(progressData);
            applyFilters(currentFilters || {}, false, progressData);
          }
        }
        
        // Store final processed data and apply current filters
        setProcessedData(actualData);
        applyFilters(currentFilters || {}, false, actualData);
        setIsProcessing(false);
      }, 100);
    }
  };

  processDataForView();
}, [viewMode, submittedData, isLoading]);


  const fetchRealWashQty = async (record) => {
  try {
    // For estimated mode, return original data
    if (viewMode === 'estimated') {
      return { 
        displayWashQty: record.washQty || 0, 
        isActualWashQty: false, 
        originalWashQty: record.washQty || 0, 
        source: 'original',
        displayCheckedQty: record.checkedQty || 'N/A'
      };
    }

    // For actual mode, check if record already has actualWashQty
    if (record.actualWashQty !== undefined && record.actualWashQty !== null) {
      const actualCheckedQty = record.actualAQLValue?.sampleSize || record.checkedQty || 'N/A';
      
      return { 
        displayWashQty: record.actualWashQty, 
        isActualWashQty: true, 
        originalWashQty: record.washQty || 0, 
        source: 'qcwashing_actual',
        displayCheckedQty: actualCheckedQty,
        actualAQLValue: record.actualAQLValue
      };
    }

    // Handle special report types
    if (record.reportType && (record.reportType.toLowerCase() === 'first output' || record.reportType.toLowerCase() === 'sop')) {
      const isSOP = record.reportType.toLowerCase() === 'sop';
      return { 
        displayWashQty: record.washQty || 0, 
        isActualWashQty: true, 
        isFirstOutput: !isSOP, 
        isSOP: isSOP,
        originalWashQty: record.washQty || 0, 
        source: isSOP ? 'sop' : 'first_output',
        displayCheckedQty: record.checkedQty || 'N/A'
      };
    }

    // For inline reports without actualWashQty, try to fetch from external source (YM factory)
    if (record.reportType?.toLowerCase() === 'inline') {
      const factoryName = record.factoryName || '';
      
      if (factoryName.toUpperCase() === 'YM') {
        const dateStr = record.date ? new Date(record.date).toISOString().split('T')[0] : '';
        const styleNo = record.orderNo || '';
        let color = record.color || '';

        if (!dateStr || !styleNo || !color) {
          return { 
            displayWashQty: record.washQty || 0, 
            isActualWashQty: false, 
            originalWashQty: record.washQty || 0, 
            source: 'original',
            displayCheckedQty: record.checkedQty || 'N/A'
          };
        }

        const colorMatch = color.match(/\[([^\]]+)\]/);
        if (colorMatch) {
          color = colorMatch[1];
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`${API_BASE_URL}/api/qc-real-washing-qty/search?` + new URLSearchParams({ 
            inspectionDate: dateStr, 
            styleNo: styleNo, 
            color: color 
          }), {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.found && data.washQty > 0) {
              return { 
                displayWashQty: data.washQty, 
                isActualWashQty: true, 
                originalWashQty: record.washQty || 0, 
                source: 'qc_real_wash_qty_ym', 
                details: data.details,
                displayCheckedQty: record.checkedQty || 'N/A'
              };
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn('Real wash qty request timed out for:', record.orderNo);
          } else {
            console.error('Error fetching real wash qty from qc_real_washing_qty:', error);
          }
        }
      } else {
        // For non-YM factories, check for edited actual wash qty
        if (record.editedActualWashQty !== null && record.editedActualWashQty !== undefined) {
          return {
            displayWashQty: record.editedActualWashQty,
            isActualWashQty: true,
            originalWashQty: record.washQty || 0,
            source: 'edited_actual_wash_qty',
            details: { recordId: record._id, editedValue: record.editedActualWashQty, lastEditedAt: record.lastEditedAt },
            displayCheckedQty: record.checkedQty || 'N/A'
          };
        }
      }
    }

    // Default fallback
    return { 
      displayWashQty: record.washQty || 0, 
      isActualWashQty: false, 
      originalWashQty: record.washQty || 0, 
      source: 'original',
      displayCheckedQty: record.checkedQty || 'N/A'
    };

  } catch (error) {
    console.error('Error in fetchRealWashQty:', error);
    return { 
      displayWashQty: record.washQty || 0, 
      isActualWashQty: false, 
      originalWashQty: record.washQty || 0, 
      source: 'error',
      displayCheckedQty: record.checkedQty || 'N/A'
    };
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

const handleDownloadPDF = async (record) => {
  try {
    setIsQcWashingPDF(true);
    
    // Show initial loading message
    Swal.fire({
      title: "Preparing PDF Report",
      html: `
        <div class="text-left">
          <div id="progress-inspector">⏳ Loading inspector details...</div>
          <div id="progress-images">⏳ Loading images...</div>
          <div id="progress-pdf">⏳ Waiting...</div>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 1. Fetch inspector details
    let inspectorDetails = null;
    if (record.userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${record.userId}`);
        if (response.ok) {
          inspectorDetails = await response.json();
          document.getElementById('progress-inspector').innerHTML = '✅ Inspector details loaded';
        } else {
          document.getElementById('progress-inspector').innerHTML = '⚠️ Inspector details not found';
        }
      } catch (error) {
        console.warn('Failed to fetch inspector details:', error);
        document.getElementById('progress-inspector').innerHTML = '⚠️ Inspector details failed to load';
      }
    } else {
      document.getElementById('progress-inspector').innerHTML = '✅ No inspector details needed';
    }

    // 2. Use your existing endpoint to get all images for this record
    let preloadedImages = {};
    let imageStats = { total: 0, loaded: 0 };

    try {
      document.getElementById('progress-images').innerHTML = '⏳ Fetching images from server...';
      
      const imageResponse = await fetch(`${API_BASE_URL}/api/qc-washing/image-proxy-selected/${record._id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        preloadedImages = imageData.images || {};
        imageStats = {
          total: imageData.total || 0,
          loaded: imageData.loaded || 0
        };
        
        document.getElementById('progress-images').innerHTML = 
          `✅ Images loaded: ${imageStats.loaded}/${imageStats.total}`;
      } else {
        throw new Error(`Failed to fetch images: ${imageResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      document.getElementById('progress-images').innerHTML = 
        `⚠️ Image loading failed: ${error.message}`;
      // Continue with empty images - PDF will still generate
    }

    // 3. CRITICAL FIX: Load inspector image separately through proxy
    if (inspectorDetails && inspectorDetails.face_photo) {
      try {
        document.getElementById('progress-images').innerHTML = 
          `⏳ Loading inspector image... (${imageStats.loaded}/${imageStats.total} other images loaded)`;
        
        // Use the image proxy for inspector photo
        const inspectorImageUrl = inspectorDetails.face_photo.startsWith('http') 
          ? inspectorDetails.face_photo 
          : `${API_BASE_URL}${inspectorDetails.face_photo.startsWith('/') ? '' : '/'}${inspectorDetails.face_photo}`;
        
        const inspectorImageResponse = await fetch(`${API_BASE_URL}/api/qc-washing/image-proxy/${encodeURIComponent(inspectorImageUrl)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (inspectorImageResponse.ok) {
          const inspectorImageData = await inspectorImageResponse.json();
          if (inspectorImageData.dataUrl && inspectorImageData.dataUrl.startsWith('data:')) {
            // Add inspector image to preloaded images
            preloadedImages[inspectorDetails.face_photo] = inspectorImageData.dataUrl;
            preloadedImages[inspectorImageUrl] = inspectorImageData.dataUrl;
            
            document.getElementById('progress-images').innerHTML = 
              `✅ Images loaded: ${imageStats.loaded}/${imageStats.total} + inspector image`;
          }
        } else {
          console.warn('Failed to load inspector image through proxy');
        }
      } catch (error) {
        console.warn('Error loading inspector image:', error);
      }
    }

    // 4. Fetch checkpoint definitions
    let checkpointDefinitions = [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/qc-washing-checklist`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          checkpointDefinitions = data;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch checkpoint definitions:', error);
    }

    // 5. Prepare clean data for PDF
    const cleanRecordData = JSON.parse(JSON.stringify(record, (key, value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      return value;
    }));

    // 6. Generate PDF
    document.getElementById('progress-pdf').innerHTML = '⏳ Generating PDF document...';
    
    // Wait a moment to ensure all operations are complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { QcWashingFullReportPDF } = await import("./qcWashingFullReportPDF");

      // Create the PDF element with all required props
      const pdfElement = React.createElement(QcWashingFullReportPDF, {
        recordData: cleanRecordData,
        comparisonData: null,
        API_BASE_URL,
        checkpointDefinitions: checkpointDefinitions || [],
        preloadedImages,
        inspectorDetails: inspectorDetails || {},
        // Add these additional props to ensure proper rendering
        isLoading: false,
        skipImageLoading: false
      });

      const blob = await pdf(pdfElement).toBlob();

      document.getElementById('progress-pdf').innerHTML = '✅ PDF generated successfully';
      
      // Close loading dialog
      Swal.close();

      // 7. Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QC_Washing_Report_${record.orderNo || 'Unknown'}_${record.color || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success message
      Swal.fire({
        title: "Success!",
        html: `
          <div class="text-left">
            <div>✅ PDF downloaded successfully!</div>
            <div class="text-sm text-gray-600 mt-2">
              Inspector details: ${inspectorDetails ? 'Loaded' : 'Not available'}<br>
              Inspector image: ${inspectorDetails?.face_photo && preloadedImages[inspectorDetails.face_photo] ? 'Loaded' : 'Not available'}<br>
              Images loaded: ${imageStats.loaded}/${imageStats.total}<br>
              PDF size: ${(blob.size / 1024 / 1024).toFixed(2)} MB<br>
              ${imageStats.total > 0 && imageStats.loaded === imageStats.total ? 'All images loaded successfully' : 
                imageStats.total > 0 ? `${imageStats.total - imageStats.loaded} images failed to load` : 'No images found'}
            </div>
          </div>
        `,
        icon: "success",
        timer: 5000,
        showConfirmButton: true,
      });

    } catch (pdfError) {
      console.error('PDF generation specific error:', pdfError);
      throw new Error(`PDF generation failed: ${pdfError.message}`);
    }

  } catch (error) {
    Swal.fire({
      title: "Error!",
      html: `
        <div class="text-left">
          <div>❌ Failed to generate PDF</div>
          <div class="text-sm text-gray-600 mt-2">
            Error: ${error.message}<br>
            Please check the console for more details.
          </div>
        </div>
      `,
      icon: "error",
      timer: 10000,
      showConfirmButton: true,
    });
  } finally {
    setIsQcWashingPDF(false);
  }
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
    
    // Check if filters are empty (cleared)
    const hasFilters = filters && Object.keys(filters).some(key => {
      const value = filters[key];
      if (key === 'dateRange') {
        return value && (value.startDate || value.endDate);
      }
      return value && value !== '';
    });

    // If no filters, show last 7 days of records (most recent)
    if (!hasFilters) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0); // Set to the beginning of the day

      filtered = filtered.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= sevenDaysAgo;
      });

      // Sort by date descending to get most recent records first
      filtered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFilteredData(filtered);
      return;
    }
    
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
      setCurrentPage(1); 
    }
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
    // Apply filters to the processed data (which has actual wash qty)
    applyFilters(filters, true, processedData.length > 0 ? processedData : submittedData);
  };

  // Reset filters
  const handleFilterReset = () => {
    setCurrentFilters({});
    // Apply empty filters to show last 20 records
    applyFilters({}, true, processedData.length > 0 ? processedData : submittedData);
  };

  // Process AQL for current page records only
  useEffect(() => {
    const processCurrentPageAQL = async () => {
      if (!aqlEndpointAvailable || viewMode !== 'actual') return;
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageRecords = filteredData.slice(startIndex, endIndex);
      
      const updatedRecords = await Promise.all(
        currentPageRecords.map(async (record) => {
          // Only process AQL for inline reports with actual wash qty
          if (
            record.isActualWashQty &&
            record.displayWashQty > 0 &&
            record.reportType?.toLowerCase() === 'inline'
          ) {
            try {
              const aqlResponse = await fetch(`${API_BASE_URL}/api/qc-washing/aql-chart/find`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lotSize: record.displayWashQty, orderNo: record.orderNo })
              });

              if (aqlResponse.ok) {
                const aqlResult = await aqlResponse.json();
                if (aqlResult.success && aqlResult.aqlData) {
                  return { ...record, checkedQty: aqlResult.aqlData.sampleSize };
                }
              } else if (aqlResponse.status === 404) {
                setAqlEndpointAvailable(false);
              }
            } catch (e) {
              console.error("AQL fetch failed:", e);
              setAqlEndpointAvailable(false);
            }
          }
          return record;
        })
      );
      
      setPaginatedData(updatedRecords);
    };
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageRecords = filteredData.slice(startIndex, endIndex);
    
    // Set initial paginated data
    setPaginatedData(currentPageRecords);
    
    // Process AQL for current page only
    processCurrentPageAQL();
  }, [filteredData, currentPage, itemsPerPage, aqlEndpointAvailable, viewMode]);

  // NEW: useEffect to fetch actual wash qty for the current page
  useEffect(() => {
    const fetchActualsForCurrentPage = async () => {
      // Only run in 'actual' mode and if there's data
      if (viewMode !== 'actual' || paginatedData.length === 0) return;

      const recordsToUpdate = paginatedData.filter(
        record => !record.isActualWashQty // Only fetch for records we haven't processed yet
      );

      if (recordsToUpdate.length === 0) return;

      const updatedRecords = await Promise.all(
        recordsToUpdate.map(async record => {
          const washQtyData = await fetchRealWashQty(record);
          return { ...record, ...washQtyData };
        })
      );

      // Merge the updated records back into the main processedData list
      setProcessedData(prevData => {
        const newData = [...prevData];
        updatedRecords.forEach(updatedRecord => {
          const index = newData.findIndex(item => item._id === updatedRecord._id);
          if (index !== -1) {
            newData[index] = updatedRecord;
          }
        });
        return newData;
      });
    };

    fetchActualsForCurrentPage();
  }, [paginatedData, viewMode]); // Runs when the page changes or viewMode switches to 'actual'

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
              {/* {isRefreshing && (
        <span className="ml-2 text-sm text-orange-600 dark:text-orange-400">
          (Refreshing actual wash quantities...)
        </span>
      )}             */}
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
              {/* <button
      onClick={handleRefreshActualWashQty}
      disabled={isRefreshing || isLoading}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isRefreshing || isLoading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isRefreshing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Refreshing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Actual Wash Qty
        </>
      )}
    </button> */}
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
        {/* {refreshStatus && (
  <div className={`mb-4 p-4 rounded-lg ${
    refreshStatus.type === 'success' 
      ? 'bg-green-50 border border-green-200 text-green-800' 
      : 'bg-red-50 border border-red-200 text-red-800'
  }`}>
    <div className="font-medium">{refreshStatus.message}</div>
    {refreshStatus.details && (
      <div className="text-sm mt-2">
        <div>Records processed: {refreshStatus.details.qcRealWashingQty?.total || 0}</div>
        <div>Records updated: {refreshStatus.details.qcWashing?.modified || 0}</div>
        <div>Operations executed: {refreshStatus.details.qcWashing?.operations || 0}</div>
      </div>
    )}
  </div>
)} */}
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
                   Checked Qty (AQL)
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
                        {viewMode === 'actual' && record.displayCheckedQty !== undefined 
                          ? record.displayCheckedQty 
                          : record.checkedQty || 'N/A'}
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
