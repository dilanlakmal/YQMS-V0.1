import axios from "axios";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import {
  Layers,
  Settings,
  BarChart3,
  Scissors,
  CheckSquare,
  Shield,
  Sun,
  Moon,
  ClipboardList
} from "lucide-react";

// --- Theme Hook for Dark Mode ---
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("home-theme") || "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
    localStorage.setItem("home-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, toggleTheme };
};

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [errorMessage, setErrorMessage] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [roleManagement, setRoleManagement] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [accessMap, setAccessMap] = useState({});
  const sectionRefs = useRef({});

  const backgroundImageUrl = "assets/Home/background.avif"; 

  const allSections = useMemo(
    () => [
      {
        id: "qc2-system",
        title: "QC2 System",
        icon: <Layers className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50/80 dark:bg-blue-900/40",
        items: [
          {
            path: "/bundle-registration",
            pageId: "bundle-registration",
            image: "assets/Home/bundle.avif",
            title: t("home.bundle_registration"),
            description: "Order Registration",
            version: '0',
          },
          {
            path: "/washing",
            pageId: "washing",
            image: "assets/Home/washing.jpg",
            title: t("home.washing"),
            description: "Scan orders for Washing",
            version: '0',
          },
          {
            path: "/opa",
            pageId: "opa",
            image: "assets/Home/dyeing.png",
            title: t("home.opa"),
            description: "Scan orders in OPA",
            version: '0',
          },
          {
            path: "/ironing",
            pageId: "ironing",
            image: "assets/Home/ironing.png",
            title: t("home.ironing"),
            description: "Scan orders for Ironing",
            version: '0',
          },
          {
            path: "/qc2-inspection",
            pageId: "qc2-inspection",
            image: "assets/Home/qc2.png",
            title: t("home.qc2_inspection"),
            description: "QC2 Inspection Point",
            version: '0',
          },
          {
            path: "/qc2-repair-tracking",
            pageId: "qc2-inspection",
            image: "assets/Home/repair.png",
            title: "Defect Tracking",
            description: "QC2 Repair Tracking",
            version: '0',
          },
          {
            path: "/packing",
            pageId: "packing",
            image: "assets/Home/packing.webp",
            title: t("home.packing"),
            description: "Scan orders for Packing",
            version: '0',
          },
          {
            path: "/b-grade-defect",
            pageId: "qc2-inspection",
            image: "assets/Home/bgrade.png",
            title: "B-Grade Defects",
            description: "Record B-Grade defects",
            version: '0',
          },
          {
            path: "/b-grade-stcok",
            pageId: "qc2-inspection",
            image: "assets/Home/bgrade.png",
            title: "B-Grade Stock",
            description: "View B-Grade Stock",
            version: '0',
          }
        ]
      },
      {
        id: "fabric-cutting",
        title: "Fabric & Cutting",
        icon: <Scissors className="w-5 h-5 mr-2" />,
        bgColor: "bg-teal-50/80 dark:bg-teal-900/40",
        items: [
          {
            path: "/Fabric",
            roles: ["Fabric"],
            image: "assets/Home/fabric-logo.png",
            title: t("home.fabric"),
            description: "Fabric Inspection",
            version: '0',
          },
          {
            path: "/cutting",
            roles: ["Cutting"],
            image: "assets/Home/cutting.webp",
            title: t("home.cutting"),
            description: "Cut Panel Inspection",
            version: '0.1',
          },
          {
            path: "/cutting-inline",
            roles: ["Cutting"],
            image: "assets/Home/cutting-inline.png",
            title: t("home.cutting-inline"),
            description: "Cutting Inline Inspection",
            version: '0.1',
          },
          {
            path: "/scc",
            roles: ["SCC"],
            image: "assets/Home/SCCLogo.jpg",
            title: t("SCC"),
            description: "Spreading & Cutting",
            version: '0.1',
          },
          {
            path: "/qcWashing",
            roles: ["QC Washing"],
            image: "assets/Home/qcWashing.png",
            title: t("home.qcWashing"),
            description: "Washing Report",
            version: '0.1',
          },
          {
            path: "/afterIroning",
            roles: ["QC Ironing"],
            image: "assets/Home/after_ironing.png",
            title: t("home.afterIroning"),
            description: "After Ironing Report",
            version: '0.1',
          },
          {
            path: "/select-dt-specs",
            roles: ["Washing Clerk", "QA Clerk"],
            image: "assets/Home/select-specs.png",
            title: t("home.select_dt_specs"),
            description: "Select After Wash DT Specs",
            version: '0.1',
          },
          {
            path: "/anf-washing",
            roles: ["ANF QA"],
            image: "assets/Home/anf-washing.png",
            title: t("home.anf_washing"),
            description: "QC After Wash Measurements",
            version: '0.1',
          },
          {
            path: "/supplier-issues",
            roles: ["Supplier QC"],
            image: "assets/Home/supplier-issues.png",
            title: t("home.supplier-issues"),
            description: "Supplier Issues Sub-Con Fty",
            version: '0.1',
          }
        ]
      },
      {
        id: "sewing-qc",
        title: "Sewing QC",
        icon: <CheckSquare className="w-5 h-5 mr-2" />,
        bgColor: "bg-purple-50/80 dark:bg-purple-900/40",
        items: [
          {
            path: "/roving",
            roles: ["QC Roving"],
            image: "assets/Home/qcinline.png",
            title: "QC Inline Roving",
            description: "QC Inline Roving Point",
            version: '0.1',
          },
          {
            path: "/details",
            roles: ["QC1 Inspection"],
            image: "assets/Home/qcc.png",
            title: t("home.qc1_inspection"),
            description: "QC1 Inspection Point",
            version: '0.1',
          },
          {
            path: "/sub-con-qc1",
            roles: ["QC1 Sub Con"],
            image: "assets/Home/sub-con-qc1.png",
            title: t("home.qc1_subcon_inspection"),
            description: "QC1 Sub Con Inspection",
            version: '0.1',
          },
          {
            path: "/inline-emp",
            roles: ["Printing"],
            image: "assets/Home/qc2.png",
            title: "Print QR",
            description: "Sewing Worker QR Code",
            version: '0.1',
          },
          {
            path: "/humidity-report",
            roles: ["QA"],
            image: "assets/Home/Humidity.jpg",
            title: "Humidity Report",
            description: "View Humidity Report",
            version: '0.1',
          }
        ]
      },
      {
        id: "y-pivot",
        title: "Fin Check",
        icon: <Layers className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50/80 dark:bg-blue-900/40",
        items: [
          {
            path: "/qa-sections",
            roles: ["Fincheck Config"],
            image: "assets/Home/Fincheck_Setting.png",
            title: t("home.qa_sections"),
            description: "Configuration",
            version: "0"
          },
          {
            path: "/qa-measurements",
            roles: ["Fincheck Measurement"],
            image: "assets/Home/FinCheck_Measurements.png",
            title: t("home.qa_measurements"),
            description: "Upload/Measurement Settings",
            version: "0.1"
          },
          {
            path: "/qa-templates",
            roles: ["Fincheck Templates"],
            image: "assets/Home/Fincheck_Templates.png",
            title: t("home.qa_templates"),
            description: "...",
            version: "0"
          },
          {
            path: "/fincheck-inspection",
            roles: ["Fincheck Inspections"],
            image: "assets/Home/Fincheck_Inspection.png",
            title: t("home.y_pivot_inspection"),
            description: "...",
            version: "0.1"
          },
          {
            path: "/fincheck-reports",
            //pageId: "y-pivot-inspection",
            roles: ["Fincheck Reports"],
            image: "assets/Home/Fincheck_Reports.png",
            title: t("home.y_pivot_report"),
            description: "...",
            version: "0.1"
          },
          {
            path: "/P88Legacy",
            roles: ["P88"],
            image: "assets/Home/p88Legacy.png",
            title: t("home.p88_Legacy"),
            description: "Historical Data",
            version: "0.1"
          }
        ]
      },
      {
        id: "qa-inspection",
        title: "QA Inspection",
        icon: <Shield className="w-5 h-5 mr-2" />,
        bgColor: "bg-yellow-50/80 dark:bg-yellow-900/40",
        items: [
          {
            path: "/audit",
            roles: ["QA Audit"],
            image: "assets/Home/qaa.png",
            title: "QMS Audit",
            description: "QMS Audit Check Point",
            version: '0',
          },
          {
            path: "/qc2-upload-data",
            roles: ["Washing Clerk"],
            image: "assets/Home/qc2-workers-upload.png",
            title: t("home.qc2_upload_data"),
            description: "QC2 Upload Data",
            version: '0.1',
          },
          {
            path: "/qc2-washing-upload",
            roles: ["Washing Clerk"],
            image: "assets/Home/qc2WashingUpload.png",
            title: t("home.qc2_washing_data"),
            description: "QC2 Washing Data",
            version: '0.1',
          },
          {
            path: "/qc-accuracy",
            roles: ["QA"],
            image: "assets/Home/qc-accuracy.png",
            title: "QA Random Inspection",
            description: "QA Random Checks",
            version: '0.1',
          },
          {
            path: "/qc-output",
            roles: ["QA"],
            image: "assets/Home/qcOutput.png",
            title: "QC Output",
            description: "QC Output | Sunrise & Old Barcode System",
            version: '0.1',
          },
          {
            path: "/training",
            roles: ["System Administration"],
            image: "assets/Home/training.jpg",
            title: "YQMS Training",
            description: "Training Schedule & Progress",
            version: '0',
          },
          {
            path: "/exam",
            roles: ["System Administration"],
            image: "assets/Home/exam.jpg",
            title: "YQMS Exam",
            description: "Create Exam & Preview",
            version: '0',
          },
          {
            path: "/packing-list",
            roles: ["QA Clerk"],
            image: "assets/Home/PackingList.png",
            title: "Upload Packing List",
            description: "Packing List from Shipping Dept",
            version: '0',
          },
          {
            path: "/final-inspection",
            roles: ["QA"],
            image: "assets/Home/qafinal.png",
            title: "Final Inspection",
            description: "QA Final Inspection",
            version: '0',
          }
        ]
      },
      {
        id: "ce-section",
        title: "CE",
        icon: <ClipboardList className="w-5 h-5 mr-2" />,
        bgColor: "bg-orange-50/80 dark:bg-orange-900/40",
        items: [
          {
            path: "/master-list",
            roles: ["CE"],
            image: "assets/Home/CE-System.png",
            title: "CE",
            description: "Proudction Control & Monitoring",
            version: '0',
          }
        ]
      },
      {
        id: "admin-panel",
        title: "Admin Panel",
        icon: <Settings className="w-5 h-5 mr-2" />,
        bgColor: "bg-gray-100/80 dark:bg-gray-800/40",
        items: [
          {
            path: "/ieadmin",
            roles: ["IE", "System Administration"],
            image: "assets/Home/ie.png",
            title: t("home.ieadmin"),
            description: "IE System Admin",
            version: '0',
          },
          {
            path: "/sysadmin",
            roles: ["System Administration"],
            image: "assets/Home/sysadmin.jpg",
            title: t("home.systemadmin"),
            description: "Modify Defects",
            version: '0.1',
          },
          {
            path: "/yqms",
            roles: ["YQMS"],
            image: "assets/Home/yqms.png",
            title: t("home.yqms"),
            description: "Project Management",
            version: '0',
          }
        ]
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <BarChart3 className="w-5 h-5 mr-2" />,
        bgColor: "bg-red-50/80 dark:bg-red-900/40",
        items: [
          {
            path: "/download-data",
            roles: ["Download Data"],
            image: "assets/Home/download.jpg",
            title: t("home.download_data"),
            description: "Download Raw Data",
            version: '0',
          },
          {
            path: "/live-dashboard",
            roles: ["Live Dashboard"],
            image: "assets/Home/dash.png",
            title: t("home.live_dashboard"),
            description: "QC2 Live Dashboard",
            version: '0.1',
          },
          {
            path: "/powerbi",
            roles: ["Power BI"],
            image: "assets/Home/powerbi.png",
            title: "Power BI",
            description: "View Power BI Reports",
            version: '0.1',
          },
          {
            path: "/qa-pivot",
            roles: ["QA Pivot"],
            image: "assets/Home/qalogo.png",
            title: "QA Evaluation",
            description: "Upload & View Data",
            version: '0',
          },
          {
            path: "/qc1-sunrise",
            roles: ["QC1 Sunrise"],
            image: "assets/Home/sunrise.png",
            title: "QC1 Sunrise",
            description: "Upload Excel Data",
            version: '0.1',
          }
        ]
      },
      {
        id: "ai-section",
        title: "AI-Servicers",
        icon: <ClipboardList className="w-5 h-5 mr-2" />,
        bgColor: "bg-rose-50/80 dark:bg-rose-900/40",
        items: [
          {
            path: "/translator",
            roles: ["AI"],
            image: "assets/Home/translator.png",
            title: "AI Translator",
            description: "Upload and translate",
            version: '0',
          }
        ]
      },
      {
        id: "ydt",
        title: "YDT",
        icon: <ClipboardList className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50/80 dark:bg-blue-900/40",
        items: [
          {
            path: "/production-Sheet",
            roles: ["production"],
            image: "assets/Home/coverPage.png",
            title: "Production Sheet",
            description: "Maintain the production sheet",
            version: "0"
          }
        ]
      }
    ],
    [t]
  );

  // STEP 1: Initial check for user authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // STEP 2: Fetch legacy and user-specific roles once user is available
  useEffect(() => {
    if (user) {
      const fetchBaseRoles = async () => {
        setPageLoading(true);
        setErrorMessage(""); // Clear previous errors
        try {
          const [roleManagementRes, userRolesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/role-management`),
            axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`)
          ]);

          setRoleManagement(roleManagementRes.data);
          setUserRoles(userRolesRes.data.roles);
        } catch (error) {
          console.error("Error fetching base roles:", error);
          setErrorMessage("Error loading base page permissions.");
          setPageLoading(false); // Stop loading on error
        }
        // Do not set pageLoading to false here, let the next step do it
      };

      fetchBaseRoles();
    }
  }, [user]);

  // STEP 3: Fetch IE-specific access rights only AFTER legacy roles are loaded
  useEffect(() => {
    // This effect runs only when `roleManagement` is successfully populated
    if (roleManagement) {
      const checkAllIEAccess = async () => {
        try {
          const pageIdsToCheck = [
            ...new Set(
              allSections
                .flatMap((s) => s.items)
                .filter((item) => item.pageId)
                .map((item) => item.pageId)
            )
          ];

          const accessPromises = pageIdsToCheck.map((pageId) =>
            axios.get(
              `${API_BASE_URL}/api/ie/role-management/access-check?emp_id=${user.emp_id}&page=${pageId}`
            )
          );

          const results = await Promise.all(accessPromises);
          const newAccessMap = {};

          results.forEach((res, index) => {
            newAccessMap[pageIdsToCheck[index]] = res.data.hasAccess;
          });

          setAccessMap(newAccessMap);
        } catch (error) {
          console.error("Error fetching IE access rights:", error);
          setErrorMessage("Error loading IE page permissions.");
        } finally {
          // This is the final step, now we can stop the main loading indicator
          setPageLoading(false);
        }
      };

      checkAllIEAccess();
    }
  }, [roleManagement, user, allSections]); // Dependency on roleManagement is key

  // Hybrid access function remains the same, it will use the state populated by the effects
  const hasAccess = useCallback(
    (item) => {
      if (!user) return false;

      const isSuperAdmin = userRoles.includes("Super Admin");
      const isAdmin = userRoles.includes("Admin");

      if (isSuperAdmin || isAdmin) return true;

      if (item.pageId) return accessMap[item.pageId] === true;

      if (item.roles && roleManagement && user.job_title) {
        return roleManagement.some(
          (role) =>
            item.roles.includes(role.role) &&
            role.jobTitles.includes(user.job_title)
        );
      }

      return false;
    },
    [user, userRoles, roleManagement, accessMap]
  );

  // Dynamic filtering logic remains the same
  const accessibleSections = useMemo(() => {
    if (pageLoading || !userRoles) return [];

    return allSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasAccess(item))
      }))
      .filter((section) => section.items.length > 0);
  }, [allSections, hasAccess, pageLoading, userRoles]);

  const handleNavigation = (item) => {
    if (hasAccess(item)) {
      navigate(item.path);
    } else {
      setErrorMessage("Unauthorized Access");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleTabClick = (sectionId) => {
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen">
        <header className="fixed top-16 w-full z-40 bg-white/60 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto">
                {accessibleSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleTabClick(section.id)}
                    className="flex-shrink-0 flex items-center px-2 py-2 text-sm font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:bg-gray-200/80 dark:hover:bg-slate-800/80 transition-colors backdrop-blur-sm"
                  >
                    {section.icon}
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
              
              {/* <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-gray-200/80 dark:hover:bg-slate-800/80 transition-colors backdrop-blur-sm"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button> */}
            </div>
          </div>
        </header>

        <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 mt-16">
          {errorMessage && (
            <div className="bg-red-500/90 text-white text-center py-2 mb-6 rounded-md backdrop-blur-sm">
              {errorMessage}
            </div>
          )}

          <div className="space-y-12">
            {accessibleSections.length > 0 ? (
              accessibleSections.map((section) => (
                <section
                  key={section.id}
                  ref={(el) => (sectionRefs.current[section.id] = el)}
                  className={`scroll-mt-20 p-6 rounded-2xl ${section.bgColor} transition-colors backdrop-blur-sm border border-white/20 dark:border-slate-700/20`}
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                    {section.icon}
                    {section.title}
                  </h2>

                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))"
                    }}
                  >
                    {section.items.map((item, itemIndex) => {
                      const getVersionStyle = () => {
                        if (item.version === '0') {
                          return 'border-4 border-red-500';
                        } else if (item.version === '0.1') {
                          return 'border-4 border-green-500';
                        }
                        return '';
                      };

                      return (
                        <div
                          key={itemIndex}
                          onClick={() => handleNavigation(item)}
                          className={`group relative flex flex-col items-center justify-center p-4 rounded-xl shadow-md transition-all duration-300 bg-white/90 dark:bg-slate-800/90 cursor-pointer hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm ${getVersionStyle()}`}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-16 object-contain mb-3"
                          />

                          <h3 className="text-sm font-bold text-center text-slate-700 dark:text-slate-100">
                            {item.title}
                          </h3>

                          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-20 bg-white/80 dark:bg-slate-800/80 rounded-2xl backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  No Accessible Modules
                </h2>
                <p className="mt-2 text-slate-500">
                  Please contact your administrator if you believe you should have
                  access.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
