import axios from "axios";
import {
  AlertTriangle,
  Calendar,
  Check,
  Factory,
  Hash,
  List,
  Palette,
  Percent,
  Save,
  UserX,
  Users
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

// Import new components
import DefectInputSection from "./DefectInputSection";
import PageTitle from "./PageTitle";
import StatusAndImageSection from "./StatusAndImageSection";
import SummaryStatCard from "./SummaryStatCard";

const SubConQASampleData = () => {
  const { user } = useAuth();

  // --- FORM STATE ---
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [reportType, setReportType] = useState(null);
  const [factory, setFactory] = useState(null);
  const [lineNo, setLineNo] = useState(null);
  const [moNo, setMoNo] = useState(null);
  const [color, setColor] = useState(null);

  //const [qcId, setQcId] = useState("");
  const [selectedQcs, setSelectedQcs] = useState([]);
  const [checkedQty, setCheckedQty] = useState(20);

  const [defects, setDefects] = useState([]);

  const [spi, setSpi] = useState({ status: "Pass", images: [] });
  const [measurement, setMeasurement] = useState({
    status: "Pass",
    images: []
  });
  const [labelling, setLabelling] = useState({ status: "Correct", images: [] });
  const [additionalComments, setAdditionalComments] = useState("");

  const [existingReportId, setExistingReportId] = useState(null);

  // --- UI & DATA FETCHING STATE ---
  const [allFactories, setAllFactories] = useState([]);
  const [qcOptions, setQcOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  const [moNoSearchTerm, setMoNoSearchTerm] = useState("");
  const [moNoOptions, setMoNoOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [standardDefects, setStandardDefects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFindingReport, setIsFindingReport] = useState(false);

  // --- DATA FETCHING ---
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

    // --- NEW: Fetch all standard defects ---
    const fetchStandardDefects = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/qa-standard-defects-list`
        );
        setStandardDefects(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch standard defects", error);
        Swal.fire(
          "Data Error",
          "Could not load standard defects data. Decisions may not work correctly.",
          "error"
        );
      }
    };

    fetchFactories();
    fetchStandardDefects();
  }, []);

  const debounce = useCallback((func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }, []);

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

  useEffect(() => {
    if (factory) {
      const selectedFactory = allFactories.find(
        (f) => f.factory === factory.value
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
    setLineNo(null);
  }, [factory, allFactories]);

  useEffect(() => {
    if (reportType?.value === "QC2") {
      setLineNo({ value: "NA", label: "NA" });
    }
  }, [reportType]);

  useEffect(() => {
    const fetchColors = async () => {
      if (!moNo) {
        setColorOptions([]);
        setColor(null);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/order-details/${moNo.value}`
        );
        setColorOptions(
          res.data.colors.map((c) => ({ value: c.original, label: c.original }))
        );
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, [moNo]);

  // --- Effect to populate QC options when a factory is selected ---
  useEffect(() => {
    if (factory && allFactories.length > 0) {
      const selectedFactoryData = allFactories.find(
        (f) => f.factory === factory.value
      );
      if (selectedFactoryData && selectedFactoryData.qcList) {
        const options = selectedFactoryData.qcList.map((qc) => ({
          value: qc.qcID,
          label: `${qc.qcID} (${qc.qcName})`,
          qcName: qc.qcName // Store the name separately for the save payload
        }));
        setQcOptions(options);
      } else {
        setQcOptions([]);
      }
    } else {
      setQcOptions([]);
    }
    setSelectedQcs([]); // Always reset selected QCs when factory changes
  }, [factory, allFactories]);

  // --- Check for existing report ---
  useEffect(() => {
    const findExistingReport = async () => {
      // We must have all header fields and EXACTLY ONE QC selected.
      // This provides a stable, unique way to load a report for editing.
      if (
        inspectionDate &&
        reportType &&
        factory &&
        lineNo &&
        moNo &&
        color &&
        selectedQcs.length === 1
      ) {
        setIsFindingReport(true);
        try {
          const params = {
            inspectionDate: inspectionDate.toISOString().split("T")[0],
            reportType: reportType.value,
            factory: factory.value,
            lineNo: lineNo.value,
            moNo: moNo.value,
            color: color.value,
            qcId: selectedQcs[0].value
          };
          const res = await axios.get(
            `${API_BASE_URL}/api/subcon-sewing-qa-report/find`,
            { params }
          );

          if (res.data) {
            // If a report is found, enter edit mode and populate all fields.
            const report = res.data;
            setExistingReportId(report._id);
            setCheckedQty(report.checkedQty);
            setDefects(
              report.defectList.map((d) => ({ ...d, tempId: Math.random() })) ||
                []
            );
            setSelectedQcs(
              report.qcList.map((qc) => ({
                value: qc.qcID,
                label: `${qc.qcID} (${qc.qcName})`,
                qcName: qc.qcName
              }))
            );
            setSpi(report.spi || { status: "Pass", images: [] });
            setMeasurement(
              report.measurement || { status: "Pass", images: [] }
            );
            setLabelling(report.labelling || { status: "Correct", images: [] });
            setAdditionalComments(report.additionalComments || "");

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
            // If no report is found for this unique combination, exit edit mode
            setExistingReportId(null);
            setCheckedQty(20);
            setDefects([]);
            setSpi({ status: "Pass", images: [] });
            setMeasurement({ status: "Pass", images: [] });
            setLabelling({ status: "Correct", images: [] });
            setAdditionalComments("");
          }
        } catch (error) {
          console.error("Error checking for existing QA report:", error);
          setExistingReportId(null);
        } finally {
          setIsFindingReport(false);
        }
      }
    };

    findExistingReport();
  }, [inspectionDate, reportType, factory, lineNo, moNo, color, selectedQcs]);

  // --- COMPUTED VALUES ---
  const { totalDefectQty, rejectPcs, defectRate } = useMemo(() => {
    const totalQty = defects.reduce(
      (sum, defect) => sum + (Number(defect.qty) || 0),
      0
    );
    const uniquePcsWithDefects = new Set(
      defects.filter((d) => d.defectCode).map((d) => d.pcsNo)
    ).size;
    const rate =
      checkedQty > 0 ? ((totalQty / checkedQty) * 100).toFixed(2) : 0;
    return {
      totalDefectQty: totalQty,
      rejectPcs: uniquePcsWithDefects,
      defectRate: `${rate}%`
    };
  }, [defects, checkedQty]);

  const isFormHeaderInvalid = useMemo(() => {
    return (
      !reportType ||
      !factory ||
      !lineNo ||
      !moNo ||
      !color ||
      selectedQcs.length === 0 ||
      !checkedQty ||
      checkedQty <= 0
    );
  }, [reportType, factory, lineNo, moNo, color, selectedQcs, checkedQty]);

  // --- Create a rich uploadMetadata object ---
  const uploadMetadata = useMemo(
    () => ({
      reportType: reportType?.value,
      factory: factory?.value,
      lineNo: lineNo?.value,
      moNo: moNo?.value,
      color: color?.value,
      qcId: selectedQcs.map((qc) => qc.value).join("-")
      //qcId,
    }),
    [reportType, factory, lineNo, moNo, color, selectedQcs] //qcId
  );

  // --- SAVE/UPDATE HANDLER ---
  const handleSave = async () => {
    if (isFormHeaderInvalid) {
      Swal.fire(
        "Incomplete Form",
        "Please fill all required header fields.",
        "warning"
      );
      return;
    }
    setIsSubmitting(true);

    const factoryData = allFactories.find((f) => f.factory === factory.value);
    const payload = {
      inspectionDate,
      reportType: reportType.value,
      factory: factory.value,
      factory_second_name: factoryData?.factory_second_name || "",
      lineNo: lineNo.value,
      moNo: moNo.value,
      color: color.value,
      qcList: selectedQcs.map((qc) => ({
        qcID: qc.value,
        qcName: qc.qcName
      })),
      //qcId,
      preparedBy: { empId: user.emp_id, engName: user.eng_name },
      checkedQty: Number(checkedQty),
      rejectPcs,
      totalDefectQty,
      defectList: defects
        .filter((d) => d.defectCode)
        .map(({ tempId, defectInPcs, ...rest }) => rest), // Remove temp props
      spi,
      measurement,
      labelling,
      additionalComments
    };

    try {
      if (existingReportId) {
        await axios.put(
          `${API_BASE_URL}/api/subcon-sewing-qa-reports/${existingReportId}`,
          payload
        );
        Swal.fire({
          icon: "success",
          title: "Report Updated!",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/api/subcon-sewing-qa-reports`,
          payload
        );
        Swal.fire({
          icon: "success",
          title: "Report Saved!",
          timer: 2000,
          showConfirmButton: false
        });
      }
      // Reset form state after save
      setLineNo(null);
      setMoNo(null);
      setColor(null);
      setSelectedQcs([]);
      setDefects([]);
      setExistingReportId(null);
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
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <PageTitle user={user} />

      {/* --- FILTER PANE --- */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} />
              Date
            </label>
            <DatePicker
              selected={inspectionDate}
              onChange={setInspectionDate}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Report Type</label>
            <Select
              options={[
                { value: "QC1", label: "QC1" },
                { value: "QC2", label: "QC2" }
              ]}
              value={reportType}
              onChange={setReportType}
              styles={reactSelectStyles}
              placeholder="Select Type..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Factory size={16} />
              Factory
            </label>
            <Select
              options={allFactories.map((f) => ({
                value: f.factory,
                label: f.factory_second_name
                  ? `${f.factory} (${f.factory_second_name})`
                  : f.factory
              }))}
              value={factory}
              onChange={setFactory}
              styles={reactSelectStyles}
              placeholder="Select Factory..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <List size={16} />
              Line No
            </label>
            <Select
              options={lineOptions}
              value={lineNo}
              onChange={setLineNo}
              styles={reactSelectStyles}
              isDisabled={!factory || reportType?.value === "QC2"}
              placeholder="Select Line..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash size={16} />
              MO No
            </label>
            <Select
              options={moNoOptions}
              value={moNo}
              onInputChange={setMoNoSearchTerm}
              onChange={setMoNo}
              styles={reactSelectStyles}
              placeholder="Type to search MO..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Palette size={16} />
              Color
            </label>
            <Select
              options={colorOptions}
              value={color}
              onChange={setColor}
              styles={reactSelectStyles}
              isDisabled={!moNo}
              placeholder="Select Color..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users size={16} />
              QC ID(s)
            </label>
            <Select
              options={qcOptions}
              value={selectedQcs}
              onChange={setSelectedQcs}
              styles={reactSelectStyles}
              isDisabled={!factory} // Disabled until a factory is chosen
              isMulti
              placeholder="Select QC(s)..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Checked Qty</label>
            <input
              type="number"
              value={checkedQty}
              onChange={(e) => setCheckedQty(Number(e.target.value))}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
        </div>
      </div>

      {isFindingReport && (
        <div className="text-center p-4">Loading report data...</div>
      )}

      {/* --- MAIN CONTENT --- */}
      <div
        className={`${
          isFormHeaderInvalid || isFindingReport
            ? "opacity-50 pointer-events-none"
            : ""
        }`}
      >
        <DefectInputSection
          defects={defects}
          setDefects={setDefects}
          uploadMetadata={uploadMetadata}
          standardDefects={standardDefects}
        />

        <div className="space-y-6 mt-6">
          <StatusAndImageSection
            title="SPI"
            status={spi.status}
            setStatus={(val) => setSpi((p) => ({ ...p, status: val }))}
            options={[
              { value: "Pass", label: "Pass" },
              { value: "Fail", label: "Fail" }
            ]}
            images={spi.images}
            setImages={(imgs) => setSpi((p) => ({ ...p, images: imgs }))}
            uploadMetadata={uploadMetadata}
          />
          <StatusAndImageSection
            title="Measurement"
            status={measurement.status}
            setStatus={(val) => setMeasurement((p) => ({ ...p, status: val }))}
            options={[
              { value: "Pass", label: "Pass" },
              { value: "Fail", label: "Fail" }
            ]}
            images={measurement.images}
            setImages={(imgs) =>
              setMeasurement((p) => ({ ...p, images: imgs }))
            }
            uploadMetadata={uploadMetadata}
          />
          <StatusAndImageSection
            title="Labelling"
            status={labelling.status}
            setStatus={(val) => setLabelling((p) => ({ ...p, status: val }))}
            options={[
              { value: "Correct", label: "Correct" },
              { value: "Incorrect", label: "Incorrect" }
            ]}
            images={labelling.images}
            setImages={(imgs) => setLabelling((p) => ({ ...p, images: imgs }))}
            uploadMetadata={uploadMetadata}
          />
        </div>

        {/* --- SUMMARY & SUBMIT --- */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Inspection Summary</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStatCard
              title="Checked Qty"
              value={checkedQty}
              icon={<Check size={24} />}
            />
            <SummaryStatCard
              title="Reject Pcs"
              value={rejectPcs}
              icon={<UserX size={24} />}
              colorClass="text-red-500"
            />
            <SummaryStatCard
              title="Defect Qty"
              value={totalDefectQty}
              icon={<AlertTriangle size={24} />}
              colorClass="text-yellow-500"
            />
            <SummaryStatCard
              title="Defect Rate"
              value={defectRate}
              icon={<Percent size={24} />}
              colorClass="text-orange-500"
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <label className="text-lg font-semibold mb-2 block">
            Additional Comments
          </label>
          <textarea
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            rows={4}
            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
            placeholder="Enter any final comments here..."
          ></textarea>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSubmitting || isFormHeaderInvalid}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <Save size={18} />
            )}
            {isSubmitting
              ? "Saving..."
              : existingReportId
              ? "Update Report"
              : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubConQASampleData;
