import axios from "axios";
import { BarChart3, Check, LayoutDashboard, Users } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../components/authentication/AuthContext";
import SubConQASampleData from "../components/inspection/sub-con-qc1/SubConQASampleData";
import SubConQCInspection from "../components/inspection/sub-con-qc1/SubConQCInspection";
import SubConQCList from "../components/inspection/sub-con-qc1/SubConQCList";
import SubConQCReport from "../components/inspection/sub-con-qc1/SubConQCReport";
import SubConQCReportMobileView from "../components/inspection/sub-con-qc1/SubConQCReportMobileView";
import SubConQCDashboard from "../components/inspection/sub-con-qc1/dashboard/SubConQCDashboard";
import SubConQAInspectionData from "../components/inspection/sub-con-qc1/SubConQAInspectionData";

const PlaceholderComponent = ({ title }) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[300px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        This section is under development.
      </p>
    </div>
  );
};

const SubConQC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("inspection");
  const { user } = useAuth();

  // Lift state up to this parent component to preserve it across tabs
  const [inspectionState, setInspectionState] = useState({
    inspectionDate: new Date(),
    factory: null,
    lineNo: null,
    moNo: null,
    color: null,
    checkedQty: "",
    defects: [] // This will store the defects with quantities
  });

  // State and Effect to fetch factories
  const [allFactories, setAllFactories] = useState([]);

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/subcon-sewing-factories`
        );
        if (Array.isArray(res.data)) {
          setAllFactories(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch factories in SubConQC:", error);
      }
    };
    fetchFactories();
  }, []);

  // The tabs logic is now memoized and conditional
  const tabs = useMemo(() => {
    const allPossibleTabs = [
      {
        id: "inspection",
        labelKey: "subcon.tabs.inspection",
        icon: <Check size={18} />,
        component: (
          <SubConQCInspection
            inspectionState={inspectionState}
            setInspectionState={setInspectionState}
          />
        )
      },
      {
        id: "QA Sample Data",
        labelKey: "subcon.tabs.qaSampleData",
        icon: <BarChart3 size={18} />,
        component: <SubConQASampleData />
      },
      {
        id: "report",
        labelKey: "subcon.tabs.report",
        icon: <BarChart3 size={18} />,
        component: <SubConQCReport title="Report" />
      },
      {
        id: "report-mobile",
        labelKey: "subcon.tabs.report-mobile",
        icon: <BarChart3 size={18} />,
        component: <SubConQCReportMobileView title="Report Mobile" />
      },
      {
        id: "QA_Report",
        labelKey: "subcon.tabs.qaInspectionData",
        icon: <BarChart3 size={18} />,
        component: <SubConQAInspectionData title="QA Report" />
      },
      {
        id: "dashboard",
        labelKey: "subcon.tabs.dashboard",
        icon: <LayoutDashboard size={18} />,
        component: <SubConQCDashboard title="Dashboard" />
      },
      {
        id: "qc_list",
        labelKey: "subcon.tabs.qcList",
        icon: <Users size={18} />,
        component: <SubConQCList />
      }
    ];

    // Determine if the current user's name matches any factory name
    const isFactoryUser =
      user?.name && allFactories.length > 0
        ? allFactories.some(
            (f) => f.factory.toLowerCase() === user.name.toLowerCase()
          )
        : false;

    // If the user is a factory user, filter out the "QA Sample Data" tab
    if (isFactoryUser) {
      return allPossibleTabs.filter(
        (tab) =>
          tab.id !== "QA Sample Data" &&
          tab.id !== "report-mobile" &&
          tab.id !== "qc_list" &&
          tab.id !== "QA_Report"
      );
    }

    // Otherwise, return all tabs
    return allPossibleTabs;
  }, [inspectionState, user, allFactories]);

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  // Determine container max-width based on active tab
  const getContainerMaxWidth = () => {
    // QA Sample Data and QC List use smaller width (max-w-7xl)
    if (
      activeTab === "QA Sample Data" ||
      activeTab === "Report Mobile" ||
      activeTab === "qc_list"
    ) {
      return "max-w-7xl";
    }
    // Inspection, Report, Dashboard use larger width (max-w-8xl)
    return "max-w-8xl";
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Fixed width container for tabs - always max-w-8xl for consistency */}
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4 pt-1 sm:pt-2 lg:pt-2">
        {/* Tabs container - scrollable on mobile, compact design */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex min-w-max" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-4 ${
                    activeTab === tab.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {React.cloneElement(tab.icon, {
                    className: "w-3.5 h-3.5 sm:w-4 sm:h-4"
                  })}
                  <span>
                    {t(
                      tab.labelKey,
                      tab.id.charAt(0).toUpperCase() + tab.id.slice(1)
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content container - dynamic width based on active tab */}
      <div
        className={`${getContainerMaxWidth()} mx-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4 transition-all duration-300`}
      >
        <div className="mt-4 sm:mt-6">{activeComponent}</div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SubConQC;
