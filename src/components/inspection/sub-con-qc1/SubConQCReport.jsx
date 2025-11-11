import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckSquare,
  Download,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  Percent,
  X,
  XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../config";
import { useAuth } from "../../authentication/AuthContext";

// --- SummaryCard component---
const SummaryCard = ({ icon, title, children, bgColorClass }) => (
  <div
    className={`p-4 rounded-lg shadow-md flex items-start gap-4 ${
      bgColorClass || "bg-white dark:bg-gray-800"
    }`}
  >
    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg text-indigo-500 flex-shrink-0">
      {icon}
    </div>
    <div className="flex-grow">
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {/* Children prop allows for custom content like text and badges */}
      <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {children}
      </div>
    </div>
  </div>
);

const TopDefectCard = ({ rank, defect }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
      Top {rank} Defect
    </p>
    {defect ? (
      <div className="space-y-1">
        <p
          className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate"
          title={defect.name}
        >
          {defect.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold">{defect.qty.toLocaleString()}</span>{" "}
          pcs | <span className="font-semibold">{defect.rate.toFixed(2)}%</span>
        </p>
      </div>
    ) : (
      <p className="text-sm text-gray-400">N/A</p>
    )}
  </div>
);

const ToggleButton = ({ label, value, activeValue, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
      activeValue === value
        ? "bg-indigo-600 text-white shadow"
        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`}
  >
    {label}
  </button>
);

// --- Modal component for displaying QA Inspector's Information ---
const QAUserModal = ({ user, isLoading, onClose }) => {
  if (!user && !isLoading) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-72 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
        ) : (
          <>
            <img
              src={
                user.face_photo ||
                `https://ui-avatars.com/api/?name=${user.eng_name}&background=random`
              }
              alt={user.eng_name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-400 object-cover"
            />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {user.emp_id}
            </h3>
            <p className="text-md text-gray-600 dark:text-gray-300">
              {user.eng_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user.job_title}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// --- Modal component for displaying defect images ---
const QAImageModal = ({ data, onClose }) => {
  if (!data) return null;

  const defectsWithImages = data.defectList.filter(
    (d) => d.images && d.images.length > 0
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Defect Images
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          {defectsWithImages.length > 0 ? (
            defectsWithImages.map((defect) => (
              <div key={defect.defectCode}>
                <h4 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                  {defect.defectName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {defect.khmerName} | {defect.chineseName}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {defect.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={`${PUBLIC_ASSET_URL}${img}`}
                      //href={`${API_BASE_URL}${img}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-md shadow-lg group"
                    >
                      <img
                        //src={`${API_BASE_URL}${img}`}
                        src={`${PUBLIC_ASSET_URL}${img}`}
                        alt={`Defect ${defect.defectCode} - ${idx + 1}`}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No images found for this report.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const SubConQCReport = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: new Date(),
    factory: null,
    lineNo: null,
    moNo: null,
    color: null
  });

  const [data, setData] = useState({
    reports: [],
    summary: {
      totalCheckedQty: 0,
      totalDefectQty: 0,
      totalQASampleSize: 0,
      totalQADefectQty: 0,
      overallDefectRate: 0,
      topDefects: []
    },
    filterOptions: { factories: [], lineNos: [], moNos: [], colors: [] }
  });

  const [allDefects, setAllDefects] = useState([]);
  const [allFactories, setAllFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState("qty"); // 'qty' or 'rate'

  // --- States for managing modals ---
  const [qaUserInfo, setQaUserInfo] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [imageModalData, setImageModalData] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const userFactory = useMemo(() => {
    // Check if we have a user, a name, and our NEW master list of factories
    if (user && user.name && allFactories.length > 0) {
      // Find a factory name in our master list that matches the user's name
      const matchedFactoryName = allFactories.find(
        (f) => f.toLowerCase() === user.name.toLowerCase()
      );

      if (matchedFactoryName) {
        return { value: matchedFactoryName, label: matchedFactoryName };
      }
    }
    return null;
  }, [user, allFactories]); // <-- DEPENDENCY CHANGED

  // Fetch the master list of all defects once on component mount
  useEffect(() => {
    const fetchAllDefects = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/subcon-defects`);
        res.data.sort((a, b) => a.DefectCode - b.DefectCode);
        setAllDefects(res.data);
      } catch (err) {
        console.error("Failed to fetch master defect list", err);
      }
    };
    fetchAllDefects();
  }, []);

  // === LOGIC: Automatically set the factory filter for a factory user ===

  useEffect(() => {
    // If we've identified the user's factory and the filter isn't already set,
    // update the filters state to select their factory by default.
    if (userFactory && !filters.factory) {
      handleFilterChange("factory", userFactory);
    }
  }, [userFactory, filters.factory]);

  // === NEW useEffect TO FETCH ALL FACTORIES ONCE ===
  useEffect(() => {
    const fetchAllFactories = async () => {
      try {
        // This uses the same pattern as your Inspection page
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories`
        );
        if (Array.isArray(res.data)) {
          // We only need the factory names for our logic
          setAllFactories(res.data.map((f) => f.factory));
        }
      } catch (err) {
        console.error("Failed to fetch master factory list", err);
      }
    };
    fetchAllFactories();
  }, []); // Empty dependency array means it runs only once

  // Fetch all report data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const params = {
        startDate: format(filters.startDate, "yyyy-MM-dd"),
        endDate: format(filters.endDate, "yyyy-MM-dd"),
        factory: filters.factory?.value,
        lineNo: filters.lineNo?.value,
        moNo: filters.moNo?.value,
        color: filters.color?.value
      };
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-qc1-report-data`,
          { params }
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        setError("Could not load report data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const dynamicDefectHeaders = useMemo(() => {
    if (data.reports.length === 0 || allDefects.length === 0) return [];
    const presentDefectCodes = new Set(
      data.reports.flatMap((r) => r.defectList.map((d) => d.defectCode))
    );
    return allDefects.filter((defect) =>
      presentDefectCodes.has(defect.DefectCode)
    );
  }, [data.reports, allDefects]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterName]: value };
      if (filterName === "factory") {
        newFilters.lineNo = null;
        newFilters.moNo = null;
        newFilters.color = null;
      }
      if (filterName === "lineNo") {
        newFilters.moNo = null;
        newFilters.color = null;
      }
      if (filterName === "moNo") {
        newFilters.color = null;
      }
      return newFilters;
    });
  };

  // --- MODIFIED clearFilters function ---
  const clearFilters = () => {
    const defaultFilters = {
      startDate: new Date(),
      endDate: new Date(),
      factory: null,
      lineNo: null,
      moNo: null,
      color: null
    };
    // If the user is restricted to one factory, re-apply that filter after clearing others
    if (userFactory) {
      defaultFilters.factory = userFactory;
    }
    setFilters(defaultFilters);
  };

  // === NEW LOGIC: Create a conditional options list for the factory filter ===
  const factoryFilterOptions = useMemo(() => {
    // If the user is a factory user, the dropdown should only contain their factory
    if (userFactory) {
      return [userFactory];
    }
    // For all other users, map the full list of factories from the API response
    return (
      data.filterOptions?.factories?.map((f) => ({
        value: f,
        label: f
      })) || []
    );
  }, [userFactory, data.filterOptions.factories]);

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

  const handleShowQaUser = async (empId) => {
    if (!empId) return;
    setIsUserLoading(true);
    setQaUserInfo(null); // Clear previous user data
    setIsUserModalOpen(true);
    try {
      // --- CORRECTED: Using the new API route ---
      const res = await axios.get(
        `${API_BASE_URL}/api/user-info-subcon-qa/${empId}`
      );
      setQaUserInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch user info", err);
      // Close modal on error to prevent it getting stuck
      setIsUserModalOpen(false);
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleShowImages = (qaReport) => {
    if (qaReport) {
      setImageModalData(qaReport);
      setIsImageModalOpen(true);
    }
  };

  const closeUserModal = () => setIsUserModalOpen(false);
  const closeImageModal = () => setIsImageModalOpen(false);

  // --- FIX #1: REFINED COLOR LOGIC ---
  const getRateColorClass = (rate, isOverall = false) => {
    const highThreshold = isOverall ? 5 : 3;
    const midThreshold = isOverall ? 3 : 1;
    if (rate > highThreshold)
      return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    if (rate >= midThreshold)
      return "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400";
    if (rate > 0)
      return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
    // Return a class with default background for 0 or N/A values
    return "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  };

  // --- Helper function for QA Defect Rate column color ---
  const getQARateColorClass = (rate) => {
    if (rate >= 10)
      return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    if (rate >= 0)
      return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
    return "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  };

  // --- Calculate the overall QA rate from the summary data ---
  const overallQARate = useMemo(() => {
    if (
      !data.summary.totalQASampleSize ||
      data.summary.totalQASampleSize === 0
    ) {
      return 0;
    }
    return (
      (data.summary.totalQADefectQty / data.summary.totalQASampleSize) * 100
    );
  }, [data.summary]);

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Sub-Con QC Report
      </h1>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-shrink-0">
            <label className="text-sm font-medium">Start Date</label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              maxDate={filters.endDate}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              popperClassName="react-datepicker-popper-z-50"
            />
          </div>
          <div className="flex-shrink-0">
            <label className="text-sm font-medium">End Date</label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              minDate={filters.startDate}
              className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
              popperClassName="react-datepicker-popper-z-50"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium">Factory</label>
            <Select
              options={factoryFilterOptions}
              value={filters.factory}
              onChange={(val) => handleFilterChange("factory", val)}
              styles={reactSelectStyles}
              isClearable={!userFactory} // A normal user can clear, a factory user cannot
              isDisabled={!!userFactory} // The dropdown is disabled for a factory user
              placeholder="All Factories"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium">Line No</label>
            <Select
              options={data.filterOptions?.lineNos?.map((l) => ({
                value: l,
                label: l
              }))}
              value={filters.lineNo}
              onChange={(val) => handleFilterChange("lineNo", val)}
              styles={reactSelectStyles}
              isClearable
              isDisabled={!filters.factory}
              placeholder="All Lines"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium">MO No</label>
            <Select
              options={data.filterOptions?.moNos?.map((m) => ({
                value: m,
                label: m
              }))}
              value={filters.moNo}
              onChange={(val) => handleFilterChange("moNo", val)}
              styles={reactSelectStyles}
              isClearable
              placeholder="All MOs"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium">Color</label>
            <Select
              options={data.filterOptions?.colors?.map((c) => ({
                value: c,
                label: c
              }))}
              value={filters.color}
              onChange={(val) => handleFilterChange("color", val)}
              styles={reactSelectStyles}
              isClearable
              isDisabled={!filters.moNo}
              placeholder="All Colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <XCircle size={20} />
            </button>
            <button className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <Download size={20} />
            </button>
            <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <FileText size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <SummaryCard
          icon={<CheckSquare size={24} />}
          title="Checked | QA Sample"
        >
          <div className="flex items-end justify-between w-full">
            <span>{(data.summary.totalCheckedQty ?? 0).toLocaleString()}</span>
            <span className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
              {(data.summary.totalQASampleSize ?? 0).toLocaleString()}
            </span>
          </div>
        </SummaryCard>

        {/* Card 2: Total Defects + QA Defects */}
        <SummaryCard
          icon={<AlertTriangle size={24} />}
          title="Defects | QA Defects"
        >
          <div className="flex items-end justify-between w-full">
            <span>{(data.summary.totalDefectQty ?? 0).toLocaleString()}</span>
            <span className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
              {(data.summary.totalQADefectQty ?? 0).toLocaleString()}
            </span>
          </div>
        </SummaryCard>

        {/* Card 3: Overall Defect Rate */}
        <SummaryCard
          icon={<Percent size={24} />}
          title="QC Defect Rate"
          bgColorClass={getRateColorClass(data.summary.overallDefectRate, true)}
        >
          {data.summary.overallDefectRate.toFixed(2)}%
        </SummaryCard>

        {/* Card 4: NEW Overall QA Rate */}
        <SummaryCard
          icon={<Percent size={24} />}
          title="QA Defect Rate"
          bgColorClass={getQARateColorClass(overallQARate)}
        >
          {overallQARate.toFixed(2)}%
        </SummaryCard>

        <TopDefectCard rank={1} defect={data.summary.topDefects[0]} />
        <TopDefectCard rank={2} defect={data.summary.topDefects[1]} />
        <TopDefectCard rank={3} defect={data.summary.topDefects[2]} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <p className="text-sm font-semibold">Display By:</p>
          <div className="flex items-center gap-2">
            <ToggleButton
              label="Defect Qty"
              value="qty"
              activeValue={displayMode}
              onClick={setDisplayMode}
            />
            <ToggleButton
              label="Defect Rate"
              value="rate"
              activeValue={displayMode}
              onClick={setDisplayMode}
            />
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-30">
              <tr>
                <th className="px-4 py-2 font-semibold sticky left-0 z-40 min-w-[120px] bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600">
                  Date
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[120px] z-40 min-w-[140px] bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600">
                  Factory
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[260px] z-40 min-w-[80px] bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600">
                  Line
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[340px] z-40 min-w-[120px] bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600">
                  MO No
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[460px] z-40 min-w-[140px] bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600">
                  Color
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[600px] z-40 min-w-[120px] bg-gray-100 dark:bg-gray-700 text-center border-r border-gray-300 dark:border-gray-600">
                  Checked Qty
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[720px] z-40 min-w-[120px] bg-gray-100 dark:bg-gray-700 text-center border-r border-gray-300 dark:border-gray-600">
                  Defect Qty
                </th>
                <th className="px-4 py-2 font-semibold sticky left-[840px] z-40 min-w-[120px] bg-gray-100 dark:bg-gray-700 text-center border-r-2 border-gray-400 dark:border-gray-500">
                  Defect Rate
                </th>
                <th className="px-4 py-2 font-semibold text-center border-l border-gray-300 dark:border-gray-600">
                  QA Sample Size
                </th>
                <th className="px-4 py-2 font-semibold text-center border-l border-gray-300 dark:border-gray-600">
                  QA Defect Qty
                </th>
                <th className="px-4 py-2 font-semibold text-center border-l border-gray-300 dark:border-gray-600">
                  QA ID
                </th>

                <th className="px-4 py-2 font-semibold text-center border-l border-gray-300 dark:border-gray-600">
                  QA Defect Rate
                </th>

                {/* --- 👈 NEW: Header for the QA Defect Details column --- */}
                <th className="px-4 py-2 font-semibold text-center border-l border-gray-300 dark:border-gray-600 min-w-[200px]">
                  QA Defect Details
                </th>
                <th className="px-4 py-2 font-semibold text-center border-l border-gray-300 dark:border-gray-600 border-r-2 border-gray-400 dark:border-gray-500">
                  Images
                </th>

                {dynamicDefectHeaders.map((defect) => (
                  <th
                    key={defect.DefectCode}
                    className="px-3 py-2 font-semibold min-w-[150px] max-w-[200px] whitespace-normal break-words text-center border-r border-gray-300 dark:border-gray-600"
                    title={defect.DefectNameEng}
                  >
                    {defect.DefectNameEng}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8 + dynamicDefectHeaders.length}
                    className="text-center py-8"
                  >
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8 + dynamicDefectHeaders.length}
                    className="text-center py-8"
                  >
                    <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
                    <p className="mt-2 text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </td>
                </tr>
              ) : data.reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + dynamicDefectHeaders.length}
                    className="text-center p-8 text-gray-500 dark:text-gray-400"
                  >
                    No data found.
                  </td>
                </tr>
              ) : (
                data.reports.map((report) => {
                  const defectMap = new Map(
                    report.defectList.map((d) => [d.defectCode, d.qty])
                  );
                  const defectRateOverall =
                    report.checkedQty > 0
                      ? (report.totalDefectQty / report.checkedQty) * 100
                      : 0;

                  // --- 👈 NEW: Get QA data and perform calculations ---
                  const qaReport = report.qaReport; // This object now comes directly from the backend
                  const hasImages = qaReport?.qcData?.some((qcItem) =>
                    qcItem.defectList.some(
                      (d) => d.images && d.images.length > 0
                    )
                  );
                  const qaDefectRate =
                    qaReport && qaReport.totalCheckedQty > 0
                      ? (qaReport.totalOverallDefectQty /
                          qaReport.totalCheckedQty) *
                        100
                      : 0;
                  const aggregatedQADefects = qaReport?.qcData
                    ? qaReport.qcData
                        .flatMap((qc) => qc.defectList)
                        .reduce((acc, defect) => {
                          const existing = acc.find(
                            (d) => d.defectName === defect.defectName
                          );
                          if (existing) {
                            existing.qty += defect.qty;
                          } else {
                            acc.push({ ...defect });
                          }
                          return acc;
                        }, [])
                    : [];

                  return (
                    <tr
                      key={report._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-2 sticky left-0 z-20 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                        {format(new Date(report.inspectionDate), "yyyy-MM-dd")}
                      </td>
                      <td className="px-4 py-2 sticky left-[120px] z-20 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                        {report.factory}
                      </td>
                      <td className="px-4 py-2 sticky left-[260px] z-20 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                        {report.lineNo}
                      </td>
                      <td className="px-4 py-2 sticky left-[340px] z-20 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                        {report.moNo}
                      </td>
                      <td className="px-4 py-2 sticky left-[460px] z-20 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                        {report.color}
                      </td>
                      <td className="px-4 py-2 text-center sticky left-[600px] z-20 bg-blue-50 dark:bg-blue-900/40 border-r border-gray-300 dark:border-gray-600">
                        {report.checkedQty}
                      </td>
                      <td className="px-4 py-2 text-center sticky left-[720px] z-20 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600">
                        {report.totalDefectQty}
                      </td>

                      <td
                        className={`px-4 py-2 text-center font-semibold sticky left-[840px] z-20 border-r-2 border-gray-400 dark:border-gray-500 ${getRateColorClass(
                          defectRateOverall,
                          true
                        )}`}
                      >
                        {defectRateOverall.toFixed(2)}%
                      </td>

                      {/* QA Sample Size */}
                      <td className="px-4 py-2 text-center border-l">
                        {qaReport ? qaReport.totalCheckedQty : ""}
                      </td>

                      {/* QA Defect Qty */}
                      <td className="px-4 py-2 text-center border-l">
                        {qaReport ? qaReport.totalOverallDefectQty : ""}
                      </td>

                      {/* QA ID*/}
                      <td className="px-4 py-2 text-center border-l">
                        {qaReport?.preparedBy?.empId && (
                          // Use a flex container to align the text and icon side-by-side
                          <div className="flex items-center justify-center gap-1">
                            {/* 1. Display the QA ID with a very small font size and subtle color */}
                            <span className="text-xxs text-gray-500 dark:text-gray-400">
                              {qaReport.preparedBy.empId}
                            </span>

                            {/* 2. Keep the icon button as it was */}
                            <button
                              onClick={() =>
                                handleShowQaUser(qaReport.preparedBy.empId)
                              }
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                              title={`View details for ${qaReport.preparedBy.empId}`}
                            >
                              <Info size={16} className="text-blue-500" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* QA Defect Rate*/}
                      <td
                        className={`px-4 py-2 text-center font-semibold border-l ${getQARateColorClass(
                          qaDefectRate
                        )}`}
                      >
                        {qaReport ? `${qaDefectRate.toFixed(2)}%` : ""}
                      </td>

                      {/* <td
                        className={`px-4 py-2 text-center font-semibold border-l ${getQARateColorClass(
                          qaDefectRate
                        )}`}
                      >
                        {qaReport ? `${qaDefectRate.toFixed(2)}%` : ""}
                      </td> */}

                      {/* QA Defect Details */}
                      <td className="px-3 py-2 text-left border-l align-top">
                        {/* MODIFICATION #6: Map over the new aggregatedQADefects */}
                        {aggregatedQADefects.length > 0
                          ? aggregatedQADefects.map((defect) => (
                              <div
                                key={defect.defectCode}
                                className="text-xs whitespace-normal break-words"
                              >
                                {defect.defectName} ({defect.qty})
                              </div>
                            ))
                          : ""}
                      </td>

                      <td className="px-4 py-2 text-center border-l border-r-2 border-gray-400 dark:border-gray-500">
                        <button
                          onClick={() => {
                            // flatten the defect lists into the structure the modal expects
                            const allDefects = qaReport.qcData.flatMap(
                              (qc) => qc.defectList
                            );
                            const modalData = {
                              ...qaReport,
                              defectList: allDefects
                            };
                            handleShowImages(modalData);
                          }}
                          disabled={!hasImages}
                          className="p-1 rounded-full disabled:cursor-not-allowed"
                        >
                          <ImageIcon
                            size={16}
                            className={
                              hasImages
                                ? "text-blue-500 hover:text-blue-700"
                                : "text-gray-400"
                            }
                          />
                        </button>
                      </td>

                      {dynamicDefectHeaders.map((defect) => {
                        const qty = defectMap.get(defect.DefectCode);
                        const rate =
                          report.checkedQty > 0 && qty
                            ? (qty / report.checkedQty) * 100
                            : 0;
                        return (
                          <td
                            key={defect.DefectCode}
                            className={`px-4 py-2 text-center border-r border-gray-300 dark:border-gray-600 ${
                              displayMode === "rate"
                                ? getRateColorClass(rate)
                                : "bg-white dark:bg-gray-800"
                            }`}
                          >
                            {displayMode === "qty"
                              ? qty || ""
                              : qty
                              ? `${rate.toFixed(2)}%`
                              : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isUserModalOpen && (
        <QAUserModal
          user={qaUserInfo}
          isLoading={isUserLoading}
          onClose={closeUserModal}
        />
      )}
      {isImageModalOpen && (
        <QAImageModal data={imageModalData} onClose={closeImageModal} />
      )}
    </div>
  );
};

export default SubConQCReport;
