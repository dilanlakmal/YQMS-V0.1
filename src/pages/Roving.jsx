import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { allDefects } from '../constants/QC Inspection/defects';
import { API_BASE_URL } from "../../config";
import { useAuth } from '../components/authentication/AuthContext'; // Adjust the import path as needed
import { XCircle } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';

const RovingPage = () => {
  const { user, loading: authLoading } = useAuth(); // Use the useAuth hook to get the authenticated user
  const [inspectionType, setInspectionType] = useState('Normal');
  const [spiStatus, setSpiStatus] = useState('Pass');
  const [garments, setGarments] = useState([]);
  const [inspectionStartTime, setInspectionStartTime] = useState(null);
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [currentDate] = useState(new Date());
  const [selectedDefect, setSelectedDefect] = useState('');
  const [language, setLanguage] = useState('khmer'); // Default language set to Khmer

  // Handle garment initialization based on inspection type
  useEffect(() => {
    const size = inspectionType === 'Critical' ? 15 : 5;
    setGarments(Array.from({ length: size }, () => ({ garment_defect_id: '', defects: [], status: 'Pass' })));
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
  }, [inspectionType]);

  const addDefect = () => {
    if (selectedDefect) {
      const defect = allDefects.find((d) => d.english === selectedDefect);
      if (defect) {
        setGarments((prevGarments) => {
          const newGarments = [...prevGarments];
          newGarments[currentGarmentIndex] = {
            ...newGarments[currentGarmentIndex],
            defects: [
              ...newGarments[currentGarmentIndex].defects,
              { name: defect.english, count: 1, repair: defect.repair },
            ],
            status: 'Fail', // Set status to 'Fail' if a defect is added
          };
          return newGarments;
        });
        setSelectedDefect('');
      }
    }
  };

  const deleteDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      newGarments[currentGarmentIndex] = {
        ...newGarments[currentGarmentIndex],
        defects: newGarments[currentGarmentIndex].defects.filter((_, i) => i !== defectIndex),
        status: newGarments[currentGarmentIndex].defects.length > 1 ? 'Fail' : 'Pass', // Update status based on remaining defects
      };
      return newGarments;
    });
  };

  const incrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      defects[defectIndex] = { ...defects[defectIndex], count: defects[defectIndex].count + 1 };
      newGarments[currentGarmentIndex] = { ...newGarments[currentGarmentIndex], defects };
      return newGarments;
    });
  };

  const decrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      const currentCount = defects[defectIndex].count;
      if (currentCount > 1) {
        defects[defectIndex] = { ...defects[defectIndex], count: currentCount - 1 };
        newGarments[currentGarmentIndex] = { ...newGarments[currentGarmentIndex], defects };
      } else {
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects: defects.filter((_, i) => i !== defectIndex),
          status: defects.length > 1 ? 'Fail' : 'Pass', // Update status based on remaining defects
        };
      }
      return newGarments;
    });
  };

  const resetForm = () => {
    const size = inspectionType === 'Critical' ? 15 : 5;
    setGarments(Array.from({ length: size }, () => ({ garment_defect_id: '', defects: [], status: 'Pass' })));
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setSelectedDefect('');
    setLanguage('khmer');
  };


  const handleSubmit = async (e) => {
  e.preventDefault();

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const inspectionTime = `${hours}:${minutes}:${seconds}`;

  // Update garments with status, garment_defect_id, and garment_defect_count
  const updatedGarments = garments.map((garment) => {
    const hasDefects = garment.defects.length > 0;
    const garmentDefectCount = garment.defects.reduce((sum, defect) => sum + defect.count, 0);
    return {
      ...garment,
      status: hasDefects ? 'Fail' : 'Pass',
      // garment_defect_id: hasDefects ? uuidv4() : '',
      garment_defect_count: garmentDefectCount, // Add defect count for each garment
    };
  });

  // Calculate total defect count across all garments
  const totalDefectCount = updatedGarments.reduce((acc, g) => acc + g.garment_defect_count, 0);
  // Determine overall quality status
  const qualityStatus = updatedGarments.some((g) => g.status === 'Fail') ? 'Fail' : 'Pass';

  // Construct the report object
  const report = {
    inline_roving_id: Date.now(), // Replace with proper ID generation logic
    report_name: 'QC Inline Roving',
    emp_id: user?.emp_id || 'Guest',
    inspection_date: currentDate.toLocaleDateString("en-US"),
    inlineData: [
      {
        type: inspectionType,
        spi: spiStatus,
        checked_quantity: garments.length,
        inspection_time: inspectionTime, // Display as HH:MM:SS
        qualityStatus,
        rejectGarments: [
          {
            totalCount: totalDefectCount, // Common total defect count
            garments: updatedGarments.filter((g) => g.defects.length > 0),
          },
        ],
      },
    ],
  };

  try {
    // Send the report to the server
    await axios.post(`${API_BASE_URL}/api/save-qc-inline-roving`, report);

    // console.log(report);

    // Show success notification
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'QC Inline Roving data saved successfully!',
    });
    resetForm();
  } catch (error) {
    console.error("Error saving QC Inline Roving data:", error);

    // Show error notification
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to save QC Inline Roving data.',
    });
  }
};


  if (authLoading) {
    return <div>Loading...</div>; // Show loading state while fetching
  }

  const getDefectName = (defect) => {
    switch (language) {
      case 'english':
        return defect.english;
      case 'chinese':
        return defect.chinese;
      case 'khmer':
      default:
        return defect.khmer;
    }
  };

  // Calculate the common result status
  const commonResultStatus = garments.some((g) => g.defects.length > 0) ? 'Fail' : 'Pass';
  const garment = garments[currentGarmentIndex] || { defects: [], status: 'Pass' };
  const currentGarmentDefects = garment.defects;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          QC Inline Roving Inspection
        </h1>
        {/* Basic Info Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="text"
                value={currentDate.toLocaleDateString()}
                readOnly
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <input
                type="text"
                value={user?.emp_id || 'Guest'} // Display the emp_id from the authenticated user
                readOnly
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inspection Type</label>
              <div className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Normal"
                    checked={inspectionType === 'Normal'}
                    onChange={(e) => setInspectionType(e.target.value)}
                    className="form-radio"
                  />
                  <span className="ml-2">Normal</span>
                </label>
                <label className="inline-flex items-center ml-6">
                  <input
                    type="radio"
                    value="Critical"
                    checked={inspectionType === 'Critical'}
                    onChange={(e) => setInspectionType(e.target.value)}
                    className="form-radio"
                  />
                  <span className="ml-2">Critical</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SPI Section */}
          <div className="md:col-span-1 mb-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">SPI</h2>
            <div className="max-w-xs">
              <select
                value={spiStatus}
                onChange={(e) => setSpiStatus(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pass">Pass</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
          </div>
          {/* Quality Inspection Section */}
          <div className="md:col-span-2 mb-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quality</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Garment {currentGarmentIndex + 1} of {garments.length}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-lg ${
                    commonResultStatus === 'Pass'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Status: {commonResultStatus}
                </span>
              </div>
              {/* Display defects for all garments */}
              <div className="space-y-1">
                {currentGarmentDefects.length > 0 ? (
                  currentGarmentDefects.map((defect, defectIndex) => (
                    <div
                      key={`${currentGarmentIndex}-${defectIndex}`} // Unique key per garment and defect
                      className="flex items-center space-x-1 bg-white p-3 rounded-lg shadow-sm"
                    >
                      <select
                        value={defect.name}
                        onChange={(e) => {
                          const newGarments = [...garments];
                          newGarments[currentGarmentIndex].defects[defectIndex].name = e.target.value;
                          setGarments(newGarments);
                        }}
                        className="flex-1 p-2 w-6 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Defect</option>
                        {allDefects.map((defectName) => (
                          <option key={defectName.code} value={defectName.english}>
                            {getDefectName(defectName)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => decrementDefect(defectIndex)}
                          className="bg-gray-300 text-gray-700 px-2 py-1 rounded-l hover:bg-gray-400"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{defect.count}</span>
                        <button
                          onClick={() => incrementDefect(defectIndex)}
                          className="bg-gray-300 text-gray-700 px-2 py-1 rounded-r hover:bg-gray-400"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => deleteDefect(defectIndex)}
                        className="p-2 border text-bold text-red-600 hover:text-red-800 flex items-center space-x-1"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No defects recorded for this garment.</p>
                )}
                {/* Add defect to current garment */}
                <div className="flex items-center space-x-2 mt-4">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="khmer">Khmer</option>
                    <option value="english">English</option>
                    <option value="chinese">Chinese</option>
                  </select>
                  <select
                    value={selectedDefect}
                    onChange={(e) => setSelectedDefect(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Defect</option>
                    {allDefects.map((defect) => (
                      <option key={defect.code} value={defect.english}>
                        {getDefectName(defect)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addDefect}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={!selectedDefect}
                  >
                    Add Defect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation Buttons */}
        <div className="flex justify-end mt-2 ">
        <div className="space-x-4">
          <button
            onClick={() => setCurrentGarmentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentGarmentIndex === 0}
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg disabled:opacity-50"
          >
            Previous Garment
          </button>
         
            <button
              onClick={() => setCurrentGarmentIndex(prev => Math.min(garments.length - 1, prev + 1))}
              disabled={currentGarmentIndex === garments.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next Garment
            </button>
            
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSubmit}
            className="px-6 py-6 bg-green-700 text-white rounded-lg hover:bg-green-700"
          >
            Finish Inspection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RovingPage;
