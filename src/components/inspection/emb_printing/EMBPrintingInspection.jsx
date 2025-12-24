import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  FileText,
  Camera,
  CheckCircle,
  BookOpen
} from "lucide-react";
import EMBHeaderTab from "./EMBHeaderTab";
import EMBPhotosTab from "./EMBPhotosTab";
import EMBReportsTab from "./EMBReportsTab";

const EMBPrintingInspection = () => {
  const { t } = useTranslation();
  
  // Load active tab from localStorage on mount, default to "header"
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("embPrinting_activeTab");
    return savedTab || "header";
  });
  
  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("embPrinting_activeTab", activeTab);
  }, [activeTab]);
  const [inspectionType, setInspectionType] = useState("First Output");
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitHandlerRef = useRef(null);
  const setActiveTabRef = useRef(null);

  // Reports state - lifted up to parent
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [reportsDateRange, setReportsDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date()
  });

  // Fetch reports function - lifted up to parent
  const fetchReports = useCallback(async (startDateOverride, endDateOverride) => {
    const dateStart = startDateOverride || reportsDateRange.startDate;
    const dateEnd = endDateOverride || reportsDateRange.endDate;
    
    setReportsLoading(true);
    setReportsError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scc/subcon-emb-reports`, {
        params: {
          startDate: dateStart.toISOString(),
          endDate: dateEnd.toISOString()
        }
      });
      
      if (response.data.success) {
        setReports(response.data.data || []);
      } else {
        setReports([]);
        setReportsError(response.data.message || "Failed to load reports.");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      if (err.response?.status === 404) {
        setReportsError("Report endpoint not found. Please check the API.");
      } else if (err.response?.status === 500) {
        setReportsError(err.response?.data?.message || "Server error. Please try again later.");
      } else {
        setReportsError("Failed to load reports. Please try again.");
      }
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, [reportsDateRange.startDate, reportsDateRange.endDate]);

  // Load reports on mount and when date range changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Form data state
  const [formData, setFormData] = useState({
    // Header data
    inspectionDate: new Date(),
    reportType: "EMB",
    factoryName: "",
    moNo: "",
    buyer: "",
    buyerStyle: "",
    color: "",
    skuNumber: "",
    totalOrderQty: null,
    qty: "",
    skuDescription: "",
    inspector: "",
    // EMB specific fields
    speed: "",
    stitch: "",
    needleSize: "",
    machineNo: "",
    // Printing specific fields
    manual: "",
    curing: "",
    time: "",
    pressure: "",
    shortCutP: "",
    
    // Validations and Checklists
    checklist: {},
    
    // Production data
    actualLayers: null,
    totalBundle: null,
    totalPcs: null,
    
    // Photos (organized by categories)
    photos: {},
    
    // Quality Plan / AQL
    aqlData: {
      type: "General",
      level: "II",
      sampleSizeLetterCode: "",
      sampleSize: null,
      acceptDefect: null,
      rejectDefect: null
    },
    defects: [],
    defectsQty: 0,
    defectRate: 0,
    productionDefects: { emb: [], printing: [] },
    
    // Conclusion
    result: "Pending",
    remarks: ""
  });

  const tabs = [
    {
      id: "header",
      label: t("embPrinting.tabs.header", "Header"),
      icon: <FileText size={18} />,
      component: EMBHeaderTab
    },
    {
      id: "photos",
      label: t("embPrinting.tabs.photos", "Photos"),
      icon: <Camera size={18} />,
      component: EMBPhotosTab
    },
    {
      id: "reports",
      label: t("embPrinting.tabs.reports", "Reports"),
      icon: <BookOpen size={18} />,
      component: EMBReportsTab
    }
  ];

  const handleChangeType = () => {
    setShowChangeTypeModal(true);
  };

  const handleFormDataChange = useCallback((newData) => {
    setFormData((prev) => ({
      ...prev,
      ...newData
    }));
  }, []);

  // Expose setActiveTab to child components via ref
  useEffect(() => {
    setActiveTabRef.current = setActiveTab;
  }, []);

  // Listen for refresh messages from child windows (inspection view)
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify message is from same origin
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data && event.data.type === 'REFRESH_EMB_REPORTS') {
        console.log("🔄 Received refresh message from inspection view, refreshing reports...");
        fetchReports();
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [fetchReports]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {inspectionType}
            </h2>
            <p className="text-sm text-gray-500">
              {t("embPrinting.currentInspectionType", "Current inspection type")}
            </p>
          </div>
        </div>
        <button
          onClick={handleChangeType}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {t("embPrinting.changeType", "Report Type")}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex items-center justify-between" aria-label="Tabs">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          {activeTab === "photos" && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  // Get submit handler from EMBHeaderTab via ref
                  if (submitHandlerRef.current) {
                    submitHandlerRef.current();
                  }
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {tabs.map((tab) => {
          const TabComponent = tab.component;
          return (
            <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
              <TabComponent
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onSubmitHandlerRef={submitHandlerRef}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
                inspectionType={inspectionType}
                setActiveTabRef={setActiveTabRef}
                // Pass reports state and fetch function to ReportsTab
                reports={tab.id === "reports" ? reports : undefined}
                reportsLoading={tab.id === "reports" ? reportsLoading : undefined}
                reportsError={tab.id === "reports" ? reportsError : undefined}
                fetchReports={tab.id === "reports" ? fetchReports : undefined}
                onDateRangeChange={tab.id === "reports" ? setReportsDateRange : undefined}
                reportsDateRange={tab.id === "reports" ? reportsDateRange : undefined}
                // Pass onSuccess callback to HeaderTab and PhotosTab
                onSuccess={tab.id !== "reports" ? fetchReports : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Change Type Modal */}
      {showChangeTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {t("embPrinting.selectInspectionType", "Select Inspection Type")}
            </h3>
            <div className="space-y-2">
              {["First Output", "Inline Inspection"].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setInspectionType(type);
                      setShowChangeTypeModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                      inspectionType === type
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowChangeTypeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {t("common.cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EMBPrintingInspection;

