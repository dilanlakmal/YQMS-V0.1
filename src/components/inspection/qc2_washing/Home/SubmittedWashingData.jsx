import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../../config'; 
import { MoreVertical, Eye, FileText, Download, Trash2 } from 'lucide-react';
import SubmittedWashingDataFilter from './SubmittedWashingDataFilter';
import QCWashingViewDetailsModal from './QCWashingViewDetailsModal'; 
import QCWashingFullReportModal from './QCWashingFullReportModal';
import QcWashingFullReportPDF from './qcWashingFullReportPDF';
import { PDFDownloadLink } from '@react-pdf/renderer';

const SubmittedWashingDataPage = () => {
  const [submittedData, setSubmittedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
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
      status: record.status || 'submitted',
      checkedQty: record.checkedQty,
      washQty: record.washQty,
      totalCheckedPoint: record.totalCheckedPoint,
      totalPass: record.totalPass,
      totalFail: record.totalFail,
      passRate: record.passRate,
      overallFinalResult: record.overallFinalResult,
      measurementDetails: record.measurementDetails,
      defectDetails: record.defectDetails,
      before_after_wash: record.before_after_wash,
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
}

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
        if (err.message.includes('404')) {
          setError("Report feature is not yet implemented on the server.");
        } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
          setError("Could not connect to server. Please check your connection.");
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

// Enhanced convert image to base64 using backend endpoint with retry mechanism
const convertImageToBase64 = async (imagePath, API_BASE_URL, retries = 2) => {
  if (!imagePath || !API_BASE_URL) return null;
  
  // Check if it's already a base64 data URL
  if (imagePath.startsWith('data:image/')) {
    try {
      // Validate base64 format
      const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|bmp|webp);base64,([A-Za-z0-9+/=]+)$/;
      if (base64Pattern.test(imagePath)) {
        return imagePath;
      }
    } catch (error) {
      console.warn('Invalid base64 image data:', error.message);
      return null;
    }
  }

  // Check if it's already a full HTTP URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Clean the path
      let cleanPath = imagePath
        .replace('./public/storage/', '')
        .replace('./public/', '')
        .replace('/storage/', '')
        .replace(/^\/+/, '');

      const apiUrl = `${API_BASE_URL}/api/image-base64/${cleanPath}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.dataUrl) {
          // Validate the returned base64 data
          const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|bmp|webp);base64,([A-Za-z0-9+/=]+)$/;
          if (base64Pattern.test(data.dataUrl)) {
            return data.dataUrl;
          } else {
            console.warn(`Invalid base64 format returned for ${imagePath}`);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Request timeout for image: ${imagePath}`);
      } else if (error.message.includes('SOI not found') || error.message.includes('Buffer is not defined')) {
        console.warn(`Corrupted or invalid image data: ${imagePath}`);
        return null; // Don't retry for corrupted images
      } else {
        console.warn(`Error converting image (attempt ${attempt + 1}):`, error.message);
      }
      
      if (attempt === retries) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return null;
};


// Process images for PDF rendering
const processImagesInRecord = async (record, API_BASE_URL) => {
  try {
    const processedRecord = JSON.parse(JSON.stringify(record)); // Deep clone
    
    console.log('Processing images for record:', processedRecord._id);
    console.log('DefectDetails structure:', processedRecord.defectDetails);

    // Process defect images
    if (processedRecord.defectDetails?.defectsByPc) {
      console.log('Found defectsByPc:', processedRecord.defectDetails.defectsByPc.length);
      for (const pcDefect of processedRecord.defectDetails.defectsByPc) {
        if (pcDefect.pcDefects) {
          console.log(`Processing ${pcDefect.pcDefects.length} defects for PC:`, pcDefect.garmentNo || pcDefect.pcNumber);
          for (const defect of pcDefect.pcDefects) {
            if (defect.defectImages && Array.isArray(defect.defectImages)) {
              console.log(`Processing ${defect.defectImages.length} images for defect:`, defect.defectName);
              console.log('Original defect images:', defect.defectImages);
              
              // Process each image with error handling
              const validImages = [];
              for (const imagePath of defect.defectImages) {
                try {
                  const base64Image = await convertImageToBase64(imagePath, API_BASE_URL);
                  if (base64Image) {
                    validImages.push(base64Image);
                    console.log(`Successfully processed image: ${imagePath.substring(0, 50)}...`);
                  } else {
                    console.warn(`Failed to process image: ${imagePath}`);
                  }
                } catch (error) {
                  console.warn(`Skipping corrupted image: ${imagePath}`, error.message);
                }
              }
              defect.defectImages = validImages;
              console.log(`Final processed images count: ${validImages.length}`);
            }
          }
        }
      }
    }

    // Process additional images
    if (processedRecord.defectDetails?.additionalImages && Array.isArray(processedRecord.defectDetails.additionalImages)) {
      console.log(`Processing ${processedRecord.defectDetails.additionalImages.length} additional images`);
      console.log('Original additional images:', processedRecord.defectDetails.additionalImages);
      
      const validAdditionalImages = [];
      for (const imagePath of processedRecord.defectDetails.additionalImages) {
        try {
          const base64Image = await convertImageToBase64(imagePath, API_BASE_URL);
          if (base64Image) {
            validAdditionalImages.push(base64Image);
            console.log(`Successfully processed additional image: ${imagePath.substring(0, 50)}...`);
          } else {
            console.warn(`Failed to process additional image: ${imagePath}`);
          }
        } catch (error) {
          console.warn(`Skipping corrupted additional image: ${imagePath}`, error.message);
        }
      }
      processedRecord.defectDetails.additionalImages = validAdditionalImages;
      console.log(`Final additional images count: ${validAdditionalImages.length}`);
    }

    // Process inspection images
    if (processedRecord.inspectionDetails?.checkedPoints) {
      for (const point of processedRecord.inspectionDetails.checkedPoints) {
        // Process point image
        if (point.image) {
          try {
            const processedImage = await convertImageToBase64(point.image, API_BASE_URL);
            point.image = processedImage || point.image;
          } catch (error) {
            console.warn(`Skipping corrupted point image: ${point.image}`, error.message);
            point.image = null;
          }
        }
        
        // Process comparison images
        if (point.comparison && Array.isArray(point.comparison)) {
          const validComparisonImages = [];
          for (const imagePath of point.comparison) {
            try {
              const base64Image = await convertImageToBase64(imagePath, API_BASE_URL);
              if (base64Image) {
                validComparisonImages.push(base64Image);
              }
            } catch (error) {
              console.warn(`Skipping corrupted comparison image: ${imagePath}`, error.message);
            }
          }
          point.comparison = validComparisonImages;
        }
      }
    }

    // Process machine process images
    if (processedRecord.inspectionDetails?.machineProcesses) {
      for (const machine of processedRecord.inspectionDetails.machineProcesses) {
        if (machine.image) {
          try {
            const processedImage = await convertImageToBase64(machine.image, API_BASE_URL);
            machine.image = processedImage || machine.image;
          } catch (error) {
            console.warn(`Skipping corrupted machine image: ${machine.image}`, error.message);
            machine.image = null;
          }
        }
      }
    }

    return processedRecord;

  } catch (error) {
    console.error('Error processing images in record:', error);
    return record; // Return original record if processing fails
  }
};


// Enhanced helper function for image URL construction with better error handling
const getImageUrl = async (imagePath, API_BASE_URL) => {
  // Use the enhanced convertImageToBase64 function
  return await convertImageToBase64(imagePath, API_BASE_URL);
};

  const handleDownloadPDF = async (record) => {
  try {
    // Show loading state
    setIsQcWashingPDF(true);

    // Validate API_BASE_URL
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not defined');
    }
    
    // Debug: Log original record structure
    console.log('Original record defectDetails:', record.defectDetails);
    
    // Process images for PDF
    const processedRecord = await processImagesInRecord(record, API_BASE_URL);
    
    // Debug: Log processed record structure
    console.log('Processed record defectDetails:', processedRecord.defectDetails);
    
    // Fetch comparison data if needed
    let comparisonData = null;
    if (record.measurementDetails?.measurement && 
        record.measurementDetails.measurement.length > 0) {
      
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
          const rawComparisonData = data.find(r => 
            r.orderNo === record.orderNo &&
            r.color === record.color &&
            r.washType === record.washType &&
            r.reportType === record.reportType &&
            r.factoryName === record.factoryName &&
            r.before_after_wash === targetWashType
          );
          
          if (rawComparisonData) {
            comparisonData = await processImagesInRecord(rawComparisonData, API_BASE_URL);
          }
        }
      } catch (error) {
        console.warn('Could not fetch comparison data:', error);
      }
    }
    
    // Create and trigger download using react-pdf
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(
      <QcWashingFullReportPDF 
        recordData={processedRecord} 
        comparisonData={comparisonData} 
        API_BASE_URL={API_BASE_URL}
      />
    ).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QC_Washing_Report_${record.orderNo}_${record.color}_${record.before_after_wash.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
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
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter function - moved to separate component but logic stays here
  const applyFilters = (filters) => {
    let filtered = [...submittedData];

    // Date range filter
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
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
      filtered = filtered.filter(item => 
        item.userId?.toLowerCase().includes(filters.qcId.toLowerCase())
      );
    }

    // Status filter
    // if (filters.status) {
    //   filtered = filtered.filter(item => item.overallFinalResult === filters.status);
    // }

    // Buyer filter
    if (filters.buyer) {
      filtered = filtered.filter(item => item.buyer === filters.buyer);
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

    if (filters.before_after_wash) {
      filtered = filtered.filter(item => item.before_after_wash === filters.before_after_wash);
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
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredData.length} of {submittedData.length} records
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
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 min-w-max">
              {/* Table headers */}
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Inspection Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    MO No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                    Color
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    QC ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Total Order Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                    Color Order Qty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                   Before/After Wash
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                    Defect Details
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[300px]">
                    Measurement Details
                  </th>
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
                  <th className="px-3 py-2">
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-300">
                      <span>Defect Name</span>
                      <span>Defect Qty</span>
                    </div>
                  </th>
                  <th className="px-3 py-2">
                    <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 dark:text-gray-300">
                      <span>Checked Points</span>
                      <span>Total Pass</span>
                      <span>Total Fail</span>
                      <span>Plus Tol. Fail</span>
                      <span>Minus Tol. Fail</span>
                    </div>
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((record, index) => {
                  const defectDetails = getDefectDetails(record);
                  const measurementDetails = getMeasurementDetails(record);
                  
                  return (
                    <tr key={record._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
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
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.colorOrderQty || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {record.before_after_wash || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.overallFinalResult === 'Pass' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                            : record.overallFinalResult === 'Fail'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                        }`}>
                          {record.overallFinalResult || 'N/A'}
                        </span>
                      </td>
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
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                        <div className="grid grid-cols-5 gap-1 text-xs">
                          <span className="text-center">{measurementDetails.checkedPoints}</span>
                          <span className="text-center text-green-600 dark:text-green-400">{measurementDetails.totalPass}</span>
                          <span className="text-center text-red-600 dark:text-red-400">{measurementDetails.totalFail}</span>
                          <span className="text-center text-orange-600 dark:text-orange-400">{measurementDetails.plusToleranceFail}</span>
                          <span className="text-center text-orange-600 dark:text-orange-400">{measurementDetails.minusToleranceFail}</span>
                        </div>
                      </td>
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
      </div>

      {/* View Details Modal */}
      <QCWashingViewDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={handleCloseViewDetails}
        itemData={viewDetailsModal.itemData}
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
