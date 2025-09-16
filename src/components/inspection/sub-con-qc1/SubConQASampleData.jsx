import axios from "axios";
import {
  AlertTriangle,
  Calendar,
  Eye,
  Factory,
  Hash,
  List,
  Palette,
  Save,
  Search,
  User
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

import { CommentsCard, VerticalSummaryCard } from "./SharedComponents";
import SubConQCQADefect from "./SubConQCQADefect";

const SampleSizeCard = ({ sampleSize, onChange }) => (
  <div className="p-4 rounded-lg shadow-md flex flex-col bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700">
    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">
      QA Sample Size
    </h4>
    <input
      type="number"
      value={sampleSize}
      onChange={onChange}
      className="w-full bg-white dark:bg-gray-900/50 border-2 border-blue-300 dark:border-gray-600 rounded-md text-4xl font-bold p-2 text-blue-600 dark:text-blue-300"
      placeholder="20"
    />
  </div>
);

const SubConQASampleData = () => {
  const { user } = useAuth();
  const [qaState, setQaState] = useState({
    inspectionDate: new Date(),
    factory: null,
    lineNo: null,
    moNo: null,
    color: null,
    sampleSize: "20",
    comments: "",
    defects: []
  });

  // --- NEW --- State to track if we are editing an existing report
  const [existingReportId, setExistingReportId] = useState(null);

  // Other states
  const [allFactories, setAllFactories] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  const [moNoSearchTerm, setMoNoSearchTerm] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [defectSearchTerm, setDefectSearchTerm] = useState("");
  const [defectOptions, setDefectOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA FETCHING (No changes here) ---
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories`
        );
        setAllFactories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch factories", error);
      }
    };
    fetchFactories();
  }, []);

  useEffect(() => {
    if (user && user.name && allFactories.length > 0 && !qaState.factory) {
      const matchedFactory = allFactories.find(
        (f) => f.factory.toLowerCase() === user.name.toLowerCase()
      );
      if (matchedFactory) {
        setQaState((prev) => ({
          ...prev,
          factory: {
            value: matchedFactory.factory,
            label: matchedFactory.factory_second_name
              ? `${matchedFactory.factory} (${matchedFactory.factory_second_name})`
              : matchedFactory.factory
          }
        }));
      }
    }
  }, [user, allFactories, qaState.factory]);

  // Debounce helper
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const debouncedMoSearch = useCallback(
    debounce(async (term) => {
      if (term.length < 3) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-mono`, {
          params: { term }
        });
        setMoNoOptions(res.data.map((mo) => ({ value: mo, label: mo })));
      } catch (error) {
        console.error("Error searching MO:", error);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedMoSearch(moNoSearchTerm);
  }, [moNoSearchTerm, debouncedMoSearch]);

  const debouncedDefectSearch = useCallback(
    debounce(async (term) => {
      if (term.length < 1) {
        setDefectOptions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qa-standard-defects`, {
          params: { searchTerm: term }
        });
        const currentDefectCodes = new Set(qaState.defects.map((d) => d.code));
        const filteredOptions = res.data
          .filter((d) => !currentDefectCodes.has(d.code))
          .map((d) => ({
            value: d.code,
            label: `${d.code} - ${d.english}`,
            defect: d
          }));
        setDefectOptions(filteredOptions);
      } catch (error) {
        console.error("Error searching defects:", error);
      }
    }, 300),
    [qaState.defects]
  );

  useEffect(() => {
    debouncedDefectSearch(defectSearchTerm);
  }, [defectSearchTerm, debouncedDefectSearch]);

  useEffect(() => {
    if (qaState.factory) {
      const selectedFactory = allFactories.find(
        (f) => f.factory === qaState.factory.value
      );
      setLineOptions(
        selectedFactory?.lineList.map((line) => ({
          value: line,
          label: line
        })) || []
      );
    } else {
      setLineOptions([]);
    }
    handleStateChange("lineNo", null);
  }, [qaState.factory, allFactories]);

  useEffect(() => {
    const fetchColors = async () => {
      if (!qaState.moNo) {
        setColorOptions([]);
        handleStateChange("color", null);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order-details/${qaState.moNo.value}`
        );
        setColorOptions(
          res.data.colors.map((c) => ({ value: c.original, label: c.original }))
        );
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, [qaState.moNo]);

  // --- NEW useEffect: To check for an existing report ---
  useEffect(() => {
    const { inspectionDate, factory, lineNo, moNo, color } = qaState;

    if (inspectionDate && factory && lineNo && moNo && color) {
      const findExistingReport = async () => {
        try {
          const params = {
            inspectionDate: inspectionDate.toISOString().split("T")[0],
            factory: factory.value,
            lineNo: lineNo.value,
            moNo: moNo.value,
            color: color.value
          };
          const res = await axios.get(
            `${API_BASE_URL}/api/subcon-sewing-qa-report/find`,
            { params }
          );

          if (res.data) {
            // --- REPORT FOUND: POPULATE THE FORM ---
            const existingReport = res.data;
            setExistingReportId(existingReport._id);

            handleStateChange(
              "sampleSize",
              existingReport.sampleSize.toString()
            );
            handleStateChange("comments", existingReport.comments || "");

            // Map defects from DB format to frontend state format
            const defectsFromDB = existingReport.defectList.map((d) => ({
              code: d.defectCode,
              english: d.defectName,
              khmer: d.khmerName,
              chinese: d.chineseName,
              qty: d.qty,
              images: d.images
            }));
            handleStateChange("defects", defectsFromDB);

            Swal.fire({
              icon: "info",
              title: "Previous Report Loaded",
              text: "You are now editing an existing QA report.",
              toast: true,
              position: "top-end",
              showConfirmButton: false,
              timer: 3500
            });
          } else {
            // --- NO REPORT FOUND: RESET TO A NEW FORM STATE ---
            setExistingReportId(null);
            handleStateChange("sampleSize", "20");
            handleStateChange("comments", "");
            handleStateChange("defects", []);
          }
        } catch (error) {
          console.error("Error checking for existing QA report:", error);
          setExistingReportId(null);
        }
      };
      findExistingReport();
    }
  }, [
    qaState.inspectionDate,
    qaState.factory,
    qaState.lineNo,
    qaState.moNo,
    qaState.color
  ]);

  // --- HANDLERS (No changes here) ---
  const handleStateChange = (field, value) => {
    setQaState((prev) => ({ ...prev, [field]: value }));
  };

  const handleDefectSelect = (selectedOption) => {
    if (selectedOption) {
      const newDefect = { ...selectedOption.defect, qty: 1, images: [] };
      setQaState((prev) => ({
        ...prev,
        defects: [...prev.defects, newDefect]
      }));
      setDefectSearchTerm("");
      setDefectOptions([]);
    }
  };

  const handleDefectUpdate = (defectCode, updatedData) => {
    setQaState((prev) => ({
      ...prev,
      defects: prev.defects.map((d) =>
        d.code === defectCode ? updatedData : d
      )
    }));
  };

  const handleDefectRemove = (defectCode) => {
    setQaState((prev) => ({
      ...prev,
      defects: prev.defects.filter((d) => d.code !== defectCode)
    }));
  };

  const totalDefectQty = useMemo(() => {
    return qaState.defects.reduce(
      (sum, defect) => sum + (Number(defect.qty) || 0),
      0
    );
  }, [qaState.defects]);

  const isFormInvalid = useMemo(() => {
    return (
      !qaState.factory ||
      !qaState.lineNo ||
      !qaState.moNo ||
      !qaState.color ||
      !qaState.sampleSize ||
      Number(qaState.sampleSize) <= 0
    );
  }, [qaState]);

  // --- UPDATED handleSave function ---
  const handleSave = async () => {
    if (isFormInvalid) {
      Swal.fire(
        "Incomplete Form",
        "Please fill all required fields (Factory, Line, MO, Color, Sample Size).",
        "warning"
      );
      return;
    }
    setIsSubmitting(true);

    const factoryData = allFactories.find(
      (f) => f.factory === qaState.factory.value
    );
    const payload = {
      inspectionDate: qaState.inspectionDate,
      factory: qaState.factory.value,
      factory_second_name: factoryData?.factory_second_name || "",
      lineNo: qaState.lineNo.value,
      moNo: qaState.moNo.value,
      color: qaState.color.value,
      preparedBy: { empId: user.emp_id, engName: user.eng_name },
      sampleSize: Number(qaState.sampleSize),
      totalDefectQty: totalDefectQty,
      comments: qaState.comments,
      defectList: qaState.defects.map((d) => ({
        defectCode: d.code,
        defectName: d.english,
        khmerName: d.khmer,
        chineseName: d.chinese,
        qty: d.qty,
        images: d.images
      }))
    };

    try {
      let response;
      if (existingReportId) {
        // --- UPDATE an existing report ---
        response = await axios.put(
          `${API_BASE_URL}/api/subcon-sewing-qa-reports/${existingReportId}`,
          payload
        );
        Swal.fire({
          icon: "success",
          title: "Report Updated!",
          text: `The QA report has been successfully updated.`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // --- CREATE a new report ---
        response = await axios.post(
          `${API_BASE_URL}/api/subcon-sewing-qa-reports`,
          payload
        );
        Swal.fire({
          icon: "success",
          title: "Report Saved!",
          text: `QA report saved with ID: ${response.data.reportID}`,
          timer: 2500,
          showConfirmButton: false
        });
      }

      // Reset form after successful save/update
      setQaState((prev) => ({
        ...prev,
        lineNo: null,
        moNo: null,
        color: null,
        sampleSize: "20",
        comments: "",
        defects: []
      }));
      setMoNoSearchTerm("");
      setExistingReportId(null); // Reset edit mode
    } catch (error) {
      console.error("Error saving QA report:", error);
      Swal.fire(
        "Save Failed",
        error.response?.data?.error || "An unexpected error occurred.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STYLES ---
  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-border)"
    }),
    singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--color-bg-secondary)",
      zIndex: 50
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#4f46e5"
        : isFocused
        ? "var(--color-bg-tertiary)"
        : "var(--color-bg-secondary)",
      color: isSelected ? "white" : "var(--color-text-primary)"
    })
  };

  return (
    <div className="space-y-6">
      {/* Filter Pane */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} /> Date
            </label>
            <DatePicker
              selected={qaState.inspectionDate}
              onChange={(date) => handleStateChange("inspectionDate", date)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Factory size={16} /> Factory
            </label>
            <Select
              options={allFactories.map((f) => ({
                value: f.factory,
                label: f.factory_second_name
                  ? `${f.factory} (${f.factory_second_name})`
                  : f.factory
              }))}
              value={qaState.factory}
              onChange={(val) => handleStateChange("factory", val)}
              styles={reactSelectStyles}
              placeholder="Select Factory..."
              isClearable
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <List size={16} /> Line No
            </label>
            <Select
              options={lineOptions}
              value={qaState.lineNo}
              onChange={(val) => handleStateChange("lineNo", val)}
              styles={reactSelectStyles}
              placeholder="Select Line..."
              isDisabled={!qaState.factory}
              isClearable
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash size={16} /> MO No
            </label>
            <Select
              options={moNoOptions}
              value={qaState.moNo}
              onInputChange={setMoNoSearchTerm}
              onChange={(val) => handleStateChange("moNo", val)}
              styles={reactSelectStyles}
              placeholder="Type to search MO..."
              isClearable
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette size={16} /> Color
            </label>
            <Select
              options={colorOptions}
              value={qaState.color}
              onChange={(val) => handleStateChange("color", val)}
              styles={reactSelectStyles}
              placeholder="Select Color..."
              isDisabled={!qaState.moNo}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left Column */}
        <div className="w-full lg:w-1/4 lg:sticky lg:top-6 space-y-4">
          <SampleSizeCard
            sampleSize={qaState.sampleSize}
            onChange={(e) => handleStateChange("sampleSize", e.target.value)}
          />
          <VerticalSummaryCard
            icon={<AlertTriangle size={20} />}
            title="Total Defect Qty"
            value={totalDefectQty}
            colorClass="text-yellow-500"
            bgColorClass="bg-yellow-100 dark:bg-yellow-900/50"
          />
          <VerticalSummaryCard
            icon={<User size={20} />}
            title="Prepared By"
            value={user?.emp_id || "N/A"}
            colorClass="text-gray-500"
            bgColorClass="bg-gray-200 dark:bg-gray-700/50"
          />
          <CommentsCard
            comments={qaState.comments}
            onChange={(e) => handleStateChange("comments", e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 shadow-lg">
              <Eye size={18} /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || isFormInvalid}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <Save size={18} />
              )}
              {/* --- UPDATED BUTTON TEXT --- */}
              {isSubmitting
                ? "Saving..."
                : existingReportId
                ? "Update Inspection"
                : "Save Inspection"}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-3/4 space-y-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Search size={16} /> Add Defect
            </label>
            <Select
              options={defectOptions}
              onInputChange={setDefectSearchTerm}
              inputValue={defectSearchTerm}
              onChange={handleDefectSelect}
              value={null}
              placeholder="Type Defect Code or Name to search..."
              styles={reactSelectStyles}
              noOptionsMessage={() =>
                defectSearchTerm.length < 2
                  ? "Keep typing to search..."
                  : "No defects found"
              }
            />
          </div>

          <div className="space-y-4">
            {qaState.defects.map((defect) => (
              <SubConQCQADefect
                key={defect.code}
                defect={defect}
                onUpdate={handleDefectUpdate}
                onRemove={handleDefectRemove}
                inspectionContext={{
                  date: qaState.inspectionDate,
                  factory: qaState.factory,
                  lineNo: qaState.lineNo,
                  moNo: qaState.moNo
                }}
              />
            ))}
            {qaState.defects.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No defects added yet.</p>
                <p className="text-sm text-gray-400">
                  Use the search box above to find and add defects.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubConQASampleData;
