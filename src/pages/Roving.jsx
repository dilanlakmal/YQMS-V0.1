import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { allDefects } from "../constants/defects";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import {
  XCircle,
  Database,
  QrCode,
  Eye,
  EyeOff,
  Camera,
  X
} from "lucide-react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CEDatabase from "../components/inspection/qc_roving/CEDatabase";
import EmpQRCodeScanner from "../components/inspection/qc_roving/EmpQRCodeScanner";
import PreviewRoving from "../components/inspection/qc_roving/PreviewRoving";
import RovingCamera from "../components/inspection/qc_roving/RovingCamera";
import RovingData from "../components/inspection/qc_roving/RovingData"; // Import the new component

const RovingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [inspectionType, setInspectionType] = useState("Normal");
  const [spiStatus, setSpiStatus] = useState("");
  const [measurementStatus, setMeasurementStatus] = useState("");
  const [spiImage, setSpiImage] = useState(null);
  const [measurementImage, setMeasurementImage] = useState(null);
  const [showSpiCamera, setShowSpiCamera] = useState(false);
  const [showMeasurementCamera, setShowMeasurementCamera] = useState(false);
  const [garments, setGarments] = useState([]);
  const [inspectionStartTime, setInspectionStartTime] = useState(null);
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDefect, setSelectedDefect] = useState("");
  const [selectedOperationId, setSelectedOperationId] = useState("");
  const [language, setLanguage] = useState("khmer");
  const [garmentQuantity, setGarmentQuantity] = useState(5);
  const [activeTab, setActiveTab] = useState("form");
  const [operationData, setOperationData] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUserData, setScannedUserData] = useState(null);
  const [showOperatorDetails, setShowOperatorDetails] = useState(false);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [lineNo, setLineNo] = useState("");
  const [moNo, setMoNo] = useState("");
  const [moNoSearch, setMoNoSearch] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [showMoNoDropdown, setShowMoNoDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const moNoDropdownRef = useRef(null);

  // Initialize garments based on inspection type
  useEffect(() => {
    const size = inspectionType === "Critical" ? 15 : 5;
    setGarments(
      Array.from({ length: size }, () => ({
        garment_defect_id: "",
        defects: [],
        status: "Pass"
      }))
    );
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setGarmentQuantity(size);
  }, [inspectionType]);

  // Fetch MO Numbers when the user types in the MO No field
  useEffect(() => {
    const fetchMoNumbers = async () => {
      if (moNoSearch.trim() === "") {
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-mo-numbers`,
          {
            params: { search: moNoSearch }
          }
        );
        setMoNoOptions(response.data);
        setShowMoNoDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Error fetching MO numbers:", error);
        setMoNoOptions([]);
        setShowMoNoDropdown(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch MO numbers."
        });
      }
    };

    fetchMoNumbers();
  }, [moNoSearch]);

  // Fetch Operation Data when MO No is selected
  useEffect(() => {
    const fetchOperationData = async () => {
      if (!moNo) {
        setOperationData([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/inline-orders-details`,
          {
            params: { stNo: moNo }
          }
        );
        setOperationData(response.data.orderData || []); // Set to orderData array
      } catch (error) {
        console.error("Error fetching operation data:", error);
        setOperationData([]);
        // Only show error if the MO Number was explicitly selected
        if (error.response?.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `MO Number "${moNo}" not found.`
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text:
              error.response?.data?.message || "Failed to fetch operation data."
          });
        }
      }
    };

    fetchOperationData();
  }, [moNo]);

  // Handle clicks outside the MO No dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moNoDropdownRef.current &&
        !moNoDropdownRef.current.contains(event.target)
      ) {
        setShowMoNoDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addDefect = () => {
    if (selectedDefect && selectedOperationId) {
      const defect = allDefects.find((d) => d.english === selectedDefect);
      if (defect) {
        setGarments((prevGarments) => {
          const newGarments = [...prevGarments];
          newGarments[currentGarmentIndex] = {
            ...newGarments[currentGarmentIndex],
            defects: [
              ...newGarments[currentGarmentIndex].defects,
              {
                name: defect.english,
                count: 1,
                operationId: selectedOperationId,
                repair: defect.repair
              }
            ],
            status: "Fail"
          };
          return newGarments;
        });
        setSelectedDefect("");
      }
    }
  };

  const deleteDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      newGarments[currentGarmentIndex] = {
        ...newGarments[currentGarmentIndex],
        defects: newGarments[currentGarmentIndex].defects.filter(
          (_, i) => i !== defectIndex
        ),
        status:
          newGarments[currentGarmentIndex].defects.length > 1 ? "Fail" : "Pass"
      };
      return newGarments;
    });
  };

  const incrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      defects[defectIndex] = {
        ...defects[defectIndex],
        count: defects[defectIndex].count + 1
      };
      newGarments[currentGarmentIndex] = {
        ...newGarments[currentGarmentIndex],
        defects
      };
      return newGarments;
    });
  };

  const decrementDefect = (defectIndex) => {
    setGarments((prevGarments) => {
      const newGarments = [...prevGarments];
      const defects = [...newGarments[currentGarmentIndex].defects];
      const currentCount = defects[defectIndex].count;
      if (currentCount > 1) {
        defects[defectIndex] = {
          ...defects[defectIndex],
          count: currentCount - 1
        };
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects
        };
      } else {
        newGarments[currentGarmentIndex] = {
          ...newGarments[currentGarmentIndex],
          defects: defects.filter((_, i) => i !== defectIndex),
          status: defects.length > 1 ? "Fail" : "Pass"
        };
      }
      return newGarments;
    });
  };

  const resetForm = () => {
    const size = inspectionType === "Critical" ? 15 : 5;
    setGarments(
      Array.from({ length: size }, () => ({
        garment_defect_id: "",
        defects: [],
        status: "Pass"
      }))
    );
    setInspectionStartTime(new Date());
    setCurrentGarmentIndex(0);
    setSelectedDefect("");
    setSelectedOperationId("");
    setLanguage("khmer");
    //setMoNo("");
    //setMoNoSearch("");
    //setMoNoOptions([]);
    //setShowMoNoDropdown(false);
    setOperationData([]);
    setScannedUserData(null);
    setShowOperatorDetails(false);
    setShowOperationDetails(false);
    //setLineNo("");
    setSpiStatus("");
    setMeasurementStatus("");
    setSpiImage(null);
    setMeasurementImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !lineNo ||
      !moNo ||
      !selectedOperationId ||
      !spiStatus ||
      !measurementStatus
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill all required fields first."
      });
      return;
    }

    const now = new Date();
    const inspectionTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const updatedGarments = garments.map((garment) => {
      const hasDefects = garment.defects.length > 0;
      const garmentDefectCount = garment.defects.reduce(
        (sum, defect) => sum + defect.count,
        0
      );
      return {
        ...garment,
        status: hasDefects ? "Fail" : "Pass",
        garment_defect_count: garmentDefectCount
      };
    });

    const totalDefectCount = updatedGarments.reduce(
      (acc, g) => acc + g.garment_defect_count,
      0
    );
    const qualityStatus = updatedGarments.some((g) => g.status === "Fail")
      ? "Fail"
      : "Pass";

    const selectedOperation = operationData.find(
      (data) => data.Tg_No === selectedOperationId
    );

    const report = {
      inline_roving_id: Date.now(),
      report_name: "QC Inline Roving",
      emp_id: user?.emp_id || "Guest",
      eng_name: user?.eng_name || "Guest",
      inspection_date: currentDate.toLocaleDateString("en-US"),
      mo_no: moNo,
      line_no: lineNo,
      inlineData: [
        {
          operator_emp_id: scannedUserData?.emp_id || "N/A",
          operator_eng_name: scannedUserData?.eng_name || "N/A",
          operator_kh_name: scannedUserData?.kh_name || "N/A",
          operator_job_title: scannedUserData?.job_title || "N/A",
          operator_dept_name: scannedUserData?.dept_name || "N/A",
          operator_sect_name: scannedUserData?.sect_name || "N/A",
          tg_no: selectedOperation?.Tg_No || "N/A",
          tg_code: selectedOperation?.Tg_Code || "N/A",
          ma_code: selectedOperation?.Ma_Code || "N/A",
          operation_ch_name: selectedOperation?.ch_name || "N/A",
          operation_kh_name: selectedOperation?.kh_name || "N/A",
          type: inspectionType,
          spi: spiStatus,
          spi_image: spiImage,
          measurement: measurementStatus,
          measurement_image: measurementImage,
          checked_quantity: garments.length,
          inspection_time: inspectionTime,
          qualityStatus,
          rejectGarments: [
            {
              totalCount: totalDefectCount,
              garments: updatedGarments.filter((g) => g.defects.length > 0)
            }
          ]
        }
      ]
    };

    try {
      await axios.post(`${API_BASE_URL}/api/save-qc-inline-roving`, report);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "QC Inline Roving data saved successfully!"
      });
      resetForm();
    } catch (error) {
      console.error("Error saving QC Inline Roving data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save QC Inline Roving data."
      });
    }
  };

  const handleUserDataFetched = (userData) => {
    setScannedUserData(userData);
    setShowScanner(false);
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  const getDefectName = (defect, lang = language) => {
    switch (lang) {
      case "english":
        return defect.english;
      case "chinese":
        return defect.chinese;
      case "khmer":
      default:
        return defect.khmer;
    }
  };

  const commonResultStatus = garments.some((g) => g.defects.length > 0)
    ? "Fail"
    : "Pass";
  const garment = garments[currentGarmentIndex] || {
    defects: [],
    status: "Pass"
  };
  const currentGarmentDefects = garment.defects;

  const totalDefects = garments.reduce(
    (acc, garment) =>
      acc + garment.defects.reduce((sum, defect) => sum + defect.count, 0),
    0
  );
  const defectGarments = garments.filter(
    (garment) => garment.defects.length > 0
  ).length;
  const defectRate = ((totalDefects / garmentQuantity) * 100).toFixed(2) + "%";
  const defectRatio =
    ((defectGarments / garmentQuantity) * 100).toFixed(2) + "%";

  const operationIds = [
    ...new Set(operationData.map((data) => data.Tg_No))
  ].sort();

  const selectedOperation = operationData.find(
    (data) => data.Tg_No === selectedOperationId
  );

  const lineNoOptions = Array.from({ length: 30 }, (_, i) =>
    (i + 1).toString()
  );

  const isFormValid =
    lineNo && moNo && selectedOperationId && spiStatus && measurementStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          QC Inline Roving Inspection
        </h1>
        {/* Tab Navigation */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 ${
              activeTab === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-l-lg`}
          >
            QC Inline Roving
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 ${
              activeTab === "data"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Data
          </button>
          <button
            onClick={() => setActiveTab("db")}
            className={`px-4 py-2 flex items-center space-x-2 ${
              activeTab === "db"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-r-lg`}
          >
            <Database className="w-5 h-5" />
            <span>DB</span>
          </button>
        </div>

        {activeTab === "form" ? (
          <>
            {/* Basic Info Section */}
            <div className="mb-8">
              {/* First Row: Date, Line No, MO No */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <DatePicker
                    selected={currentDate}
                    onChange={(date) => setCurrentDate(date)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    Line No
                  </label>
                  <select
                    value={lineNo}
                    onChange={(e) => setLineNo(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Line No</option>
                    {lineNoOptions.map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    MO No
                  </label>
                  <div className="relative" ref={moNoDropdownRef}>
                    <input
                      type="text"
                      value={moNoSearch}
                      onChange={(e) => {
                        setMoNoSearch(e.target.value);
                      }}
                      placeholder="Search MO No..."
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {showMoNoDropdown && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {moNoOptions.map((option, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setMoNo(option);
                              setMoNoSearch(option);
                              setShowMoNoDropdown(false);
                            }}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Second Row: Operation No, Scan QR, Inspection Type */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    Operation No
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOperationId}
                      onChange={(e) => setSelectedOperationId(e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                      disabled={!moNo || operationIds.length === 0}
                    >
                      <option value="">Select Operation No</option>
                      {operationIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                    {selectedOperation && (
                      <button
                        onClick={() =>
                          setShowOperationDetails(!showOperationDetails)
                        }
                        className="text-gray-600 hover:text-gray-800 mt-1"
                      >
                        {showOperationDetails ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {showOperationDetails && selectedOperation && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <p>
                          <strong>Tg_No:</strong> {selectedOperation.Tg_No}
                        </p>
                        <p>
                          <strong>Tg_Code (Machine Code):</strong>{" "}
                          {selectedOperation.Tg_Code || "N/A"}
                        </p>
                        <p>
                          <strong>Ma_Code (Machine Type):</strong>{" "}
                          {selectedOperation.Ma_Code || "N/A"}
                        </p>
                        <p>
                          <strong>Operation (Chi):</strong>{" "}
                          {selectedOperation.ch_name || "N/A"}
                        </p>
                        <p>
                          <strong>Operation (Kh):</strong>{" "}
                          {selectedOperation.kh_name || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    Scan QR
                  </label>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="mt-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full justify-center"
                  >
                    <QrCode className="w-5 h-5" />
                    Scan QR
                  </button>
                  {scannedUserData && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm">
                        <strong>Operator ID:</strong> {scannedUserData.emp_id}
                      </p>
                      <button
                        onClick={() =>
                          setShowOperatorDetails(!showOperatorDetails)
                        }
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {showOperatorDetails ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                  {showOperatorDetails && scannedUserData && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <p>
                          <strong>Operator ID:</strong>{" "}
                          {scannedUserData.emp_id || "N/A"}
                        </p>
                        <p>
                          <strong>Name (Eng):</strong>{" "}
                          {scannedUserData.eng_name || "N/A"}
                        </p>
                        <p>
                          <strong>Name (Kh):</strong>{" "}
                          {scannedUserData.kh_name || "N/A"}
                        </p>
                        <p>
                          <strong>Department:</strong>{" "}
                          {scannedUserData.dept_name || "N/A"}
                        </p>
                        <p>
                          <strong>Section:</strong>{" "}
                          {scannedUserData.sect_name || "N/A"}
                        </p>
                        <p>
                          <strong>Job Title:</strong>{" "}
                          {scannedUserData.job_title || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    Inspection Type
                  </label>
                  <div className="mt-1 w-full p-2 border border-gray-300 rounded-lg">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="Normal"
                        checked={inspectionType === "Normal"}
                        onChange={(e) => setInspectionType(e.target.value)}
                        className="form-radio"
                      />
                      <span className="ml-2">Normal</span>
                    </label>
                    <label className="inline-flex items-center ml-6">
                      <input
                        type="radio"
                        value="Critical"
                        checked={inspectionType === "Critical"}
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

              {/* Horizontal Divider */}
              <hr className="my-6 border-gray-300" />

              {/* Third Row: SPI and Measurement */}
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    SPI
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={spiStatus}
                      onChange={(e) => setSpiStatus(e.target.value)}
                      className="mt-1 w-3/4 p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select SPI Status</option>
                      <option value="Pass">Pass</option>
                      <option value="Reject">Reject</option>
                    </select>
                    <button
                      onClick={() => setShowSpiCamera(true)}
                      className="mt-1 p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  {spiImage && (
                    <div className="mt-2 relative p-2 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setSpiImage(null)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <img
                        src={`${API_BASE_URL}${spiImage}`}
                        alt="SPI Image"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700">
                    Measurement
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={measurementStatus}
                      onChange={(e) => setMeasurementStatus(e.target.value)}
                      className="mt-1 w-3/4 p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Measurement Status</option>
                      <option value="Pass">Pass</option>
                      <option value="Reject">Reject</option>
                    </select>
                    <button
                      onClick={() => setShowMeasurementCamera(true)}
                      className="mt-1 p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  {measurementImage && (
                    <div className="mt-2 relative p-2 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setMeasurementImage(null)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <img
                        src={`${API_BASE_URL}${measurementImage}`}
                        alt="Measurement Image"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quality Inspection Section */}
              <div className="md:col-span-2 mb-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Quality
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Garment {currentGarmentIndex + 1}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-lg ${
                        commonResultStatus === "Pass"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
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
                              newGarments[currentGarmentIndex].defects[
                                defectIndex
                              ].name = e.target.value;
                              setGarments(newGarments);
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Select Defect</option>
                            {allDefects.map((defectName) => (
                              <option
                                key={defectName.code}
                                value={defectName.english}
                              >
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
                            <span className="w-8 text-center">
                              {defect.count}
                            </span>
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
                      <p className="text-gray-600">
                        No defects recorded for this garment.
                      </p>
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
                        disabled={!moNo}
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
                        disabled={!selectedDefect || !selectedOperationId}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Defect Rate and Ratio Section */}
              <div className="md:col-span-1 mb-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Defect Metrics
                </h2>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">
                        Defect Rate
                      </th>
                      <th className="border border-gray-300 p-2">
                        Defect Ratio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border text-center border-gray-300 p-2">
                        {defectRate}
                      </td>
                      <td className="border text-center border-gray-300 p-2">
                        {defectRatio}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <div className="space-x-4">
                <button
                  onClick={() =>
                    setCurrentGarmentIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentGarmentIndex === 0}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentGarmentIndex((prev) =>
                      Math.min(garments.length - 1, prev + 1)
                    )
                  }
                  disabled={currentGarmentIndex === garments.length - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!isFormValid}
                className={`px-6 py-3 rounded-lg ${
                  isFormValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Preview
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-6 py-3 rounded-lg ${
                  isFormValid
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Finish Inspection
              </button>
            </div>
            {showScanner && (
              <EmpQRCodeScanner
                onUserDataFetched={handleUserDataFetched}
                onClose={() => setShowScanner(false)}
              />
            )}
            {showPreview && (
              <PreviewRoving
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                data={{
                  date: currentDate.toLocaleDateString("en-US"),
                  qcId: user?.emp_id || "Guest",
                  lineNo,
                  moNo,
                  operatorId: scannedUserData?.emp_id || "N/A",
                  inspectionType,
                  operationName:
                    selectedOperation?.kh_name ||
                    selectedOperation?.ch_name ||
                    "N/A",
                  spiStatus,
                  measurementStatus,
                  garments,
                  defectRate,
                  defectRatio
                }}
              />
            )}
            {showSpiCamera && (
              <RovingCamera
                isOpen={showSpiCamera}
                onClose={() => setShowSpiCamera(false)}
                onImageCaptured={(imagePath) => setSpiImage(imagePath)}
                date={currentDate.toISOString().split("T")[0]}
                type="spi"
                empId={user?.emp_id || "Guest"}
              />
            )}
            {showMeasurementCamera && (
              <RovingCamera
                isOpen={showMeasurementCamera}
                onClose={() => setShowMeasurementCamera(false)}
                onImageCaptured={(imagePath) => setMeasurementImage(imagePath)}
                date={currentDate.toISOString().split("T")[0]}
                type="measurement"
                empId={user?.emp_id || "Guest"}
              />
            )}
          </>
        ) : activeTab === "data" ? (
          <RovingData /> // Use the new RovingData component
        ) : (
          <CEDatabase />
        )}
      </div>
    </div>
  );
};

export default RovingPage;
