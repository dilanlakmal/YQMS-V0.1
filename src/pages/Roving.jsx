import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { allDefects } from '../constants/QC Inspection/defects';
import { API_BASE_URL } from "../../config";
import { useAuth } from '../components/authentication/AuthContext';
import { XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';

const RovingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [inspectionType, setInspectionType] = useState('Normal');
  const [spiStatus, setSpiStatus] = useState('Pass');
  const [garments, setGarments] = useState([]);
  const [inspectionStartTime, setInspectionStartTime] = useState(null);
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDefect, setSelectedDefect] = useState('');
  const [language, setLanguage] = useState('khmer');
  const [garmentQuantity, setGarmentQuantity] = useState(5);
  const [activeTab, setActiveTab] = useState('form'); // State for tab switching
  const [reports, setReports] = useState([]); // State for submitted data

  // Initialize garments based on inspection type
  useEffect(() => {
    const size = inspectionType === 'Critical' ? 15 : 5;
    setGarments(Array.from({ length: size }, () => ({ garment_defect_id: '', defects: [], status: 'Pass' })));
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setGarmentQuantity(size);
  }, [inspectionType]);

  // Fetch reports when "Data" tab is selected
  useEffect(() => {
    if (activeTab === 'data') {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qc-inline-roving-reports`);
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch reports.',
      });
    }
  };

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
            status: 'Fail',
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
        status: newGarments[currentGarmentIndex].defects.length > 1 ? 'Fail' : 'Pass',
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
          status: defects.length > 1 ? 'Fail' : 'Pass',
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
    const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const updatedGarments = garments.map((garment) => {
      const hasDefects = garment.defects.length > 0;
      const garmentDefectCount = garment.defects.reduce((sum, defect) => sum + defect.count, 0);
      return {
        ...garment,
        status: hasDefects ? 'Fail' : 'Pass',
        garment_defect_count: garmentDefectCount,
      };
    });

    const totalDefectCount = updatedGarments.reduce((acc, g) => acc + g.garment_defect_count, 0);
    const qualityStatus = updatedGarments.some((g) => g.status === 'Fail') ? 'Fail' : 'Pass';

    const report = {
      inline_roving_id: Date.now(),
      report_name: 'QC Inline Roving',
      emp_id: user?.emp_id || 'Guest',
      eng_name: user?.eng_name || 'Guest',
      inspection_date: currentDate.toLocaleDateString("en-US"),
      inlineData: [
        {
          type: inspectionType,
          spi: spiStatus,
          checked_quantity: garments.length,
          inspection_time: inspectionTime,
          qualityStatus,
          rejectGarments: [
            {
              totalCount: totalDefectCount,
              garments: updatedGarments.filter((g) => g.defects.length > 0),
            },
          ],
        },
      ],
    };

    try {
      await axios.post(`${API_BASE_URL}/api/save-qc-inline-roving`, report);
    //  console.log(report);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'QC Inline Roving data saved successfully!',
      });
      resetForm();
    } catch (error) {
      console.error("Error saving QC Inline Roving data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save QC Inline Roving data.',
      });
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  // Function to get defect name based on selected language
  const getDefectName = (defect, lang = language) => {
    switch (lang) {
      case 'english':
        return defect.english;
      case 'chinese':
        return defect.chinese;
      case 'khmer':
      default:
        return defect.khmer;
    }
  };

  const commonResultStatus = garments.some((g) => g.defects.length > 0) ? 'Fail' : 'Pass';
  const garment = garments[currentGarmentIndex] || { defects: [], status: 'Pass' };
  const currentGarmentDefects = garment.defects;

  // Generate defect summary with language consistency
  const generateDefectSummary = () => {
    return garments
      .map((garment, index) => {
        if (garment.defects.length > 0) {
          const defectDetails = garment.defects.map(defect => {
            const defectObj = allDefects.find(d => d.english === defect.name);
            return defectObj ? `${getDefectName(defectObj)} (Qty: ${defect.count})` : '';
          }).filter(Boolean).join(', ');
          return `G.${index + 1}: ${defectDetails}`;
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');
  };

  const totalDefects = garments.reduce((acc, garment) => acc + garment.defects.reduce((sum, defect) => sum + defect.count, 0), 0);
  const defectGarments = garments.filter(garment => garment.defects.length > 0).length;
  const defectRate = ((totalDefects / garmentQuantity) * 100) + '%';
  const defectRatio = ((defectGarments / garmentQuantity) * 100) + '%'; //.toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          QC Inline Roving Inspection
        </h1>
        {/* Tab Navigation */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 ${activeTab === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-l-lg`}
          >
            QC Inline Roving
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 ${activeTab === 'data' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-r-lg`}
          >
            Data
          </button>
        </div>

        {activeTab === 'form' ? (
          <>
            {/* Basic Info Section */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <DatePicker
                    selected={currentDate}
                    onChange={(date) => setCurrentDate(date)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    value={user?.emp_id || 'Guest'}
                    readOnly
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspection Type</label>
                  <div className="mt-1 w-full p-2 border border-gray-300 rounded-lg">
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
                  <div className="mt-2 text-sm text-gray-600">
                    Quantity: {garmentQuantity}
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
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
                <textarea
                  readOnly
                  value={generateDefectSummary()}
                  className="mt-4 w-full p-2 border border-gray-300 rounded-lg"
                  rows={Math.min(10, garments.length)}
                />
                <table className="mt-4 w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">Defect Rate</th>
                      <th className="border border-gray-300 p-2">Defect Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border text-center border-gray-300 p-2">{defectRate}</td>
                      <td className="border text-center border-gray-300 p-2">{defectRatio}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Quality Inspection Section */}
              <div className="md:col-span-2 mb-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Quality</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Garment {currentGarmentIndex + 1}
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
                  <div className="space-y-1">
                    {currentGarmentDefects.length > 0 ? (
                      currentGarmentDefects.map((defect, defectIndex) => (
                        <div
                          key={`${currentGarmentIndex}-${defectIndex}`}
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
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No defects recorded for this garment.</p>
                    )}
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
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <div className="space-x-4">
                <button
                  onClick={() => setCurrentGarmentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentGarmentIndex === 0}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentGarmentIndex(prev => Math.min(garments.length - 1, prev + 1))}
                  disabled={currentGarmentIndex === garments.length - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800"
              >
                Finish Inspection
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th> */}
                  {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-500">Report Name</th> */}
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Emp ID</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Emp Name</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Inspection Date</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Inspection Time</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Type</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">SPI</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Checked Qty</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Quality Status</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Total Defects</th>
                  <th className="px-2 py-1 text-left text-sm font-medium text-gray-700 border border-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.inline_roving_id}>
                    {/* <td className="px-6 py-4 whitespace-nowrap">{report.inline_roving_id}</td> */}
                    {/* <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200">{report.report_name}</td> */}
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.emp_id}</td>
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.eng_name}</td>
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.inspection_date}</td>
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.inlineData[0].inspection_time}</td>
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.inlineData[0].type}</td>
                    <td className={`px-2 py-1 text-sm border border-gray-200 ${report.inlineData[0].spi === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'}`}>
                      {report.inlineData[0].spi}
                    </td>
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.inlineData[0].checked_quantity}</td>
                    <td className={`px-2 py-1 text-sm border border-gray-200 ${report.inlineData[0].qualityStatus === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'}`}>
                      {report.inlineData[0].qualityStatus}
                    </td>
                    <td className="px-2 py-1 text-sm text-gray-700 border border-gray-200">{report.inlineData[0].rejectGarments[0].totalCount}</td>
                    <td className="px-2 py-1 text-xsm text-gray-700 border border-gray-200">
                      {report.inlineData[0].rejectGarments[0].garments.map((garment, index) => (
                        <div key={index}>
                          <ul>
                            {garment.defects.map((defect, defectIndex) => (
                              <li key={defectIndex}>
                                {defect.name} : {defect.count}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RovingPage;
