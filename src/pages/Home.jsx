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

  const allSections = useMemo(
    () => [
      /* ... sections array  ... */
      {
        id: "qc2-system",
        title: "QC2 System",
        icon: <Layers className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        items: [
          {
            path: "/bundle-registration",
            pageId: "bundle-registration",
            image: "assets/Home/bundle.avif",
            title: t("home.bundle_registration"),
            description: "Order Registration"
          },
          {
            path: "/washing",
            pageId: "washing",
            image: "assets/Home/washing.jpg",
            title: t("home.washing"),
            description: "Scan orders for Washing"
          },
          {
            path: "/opa",
            pageId: "opa",
            image: "assets/Home/dyeing.png",
            title: t("home.opa"),
            description: "Scan orders in OPA"
          },
          {
            path: "/ironing",
            pageId: "ironing",
            image: "assets/Home/ironing.png",
            title: t("home.ironing"),
            description: "Scan orders for Ironing"
          },
          {
            path: "/qc2-inspection",
            pageId: "qc2-inspection",
            image: "assets/Home/qc2.png",
            title: t("home.qc2_inspection"),
            description: "QC2 Inspection Point"
          },
          {
            path: "/qc2-repair-tracking",
            pageId: "qc2-inspection",
            image: "assets/Home/repair.png",
            title: "Defect Tracking",
            description: "QC2 Repair Tracking"
          },
          {
            path: "/packing",
            pageId: "packing",
            image: "assets/Home/packing.webp",
            title: t("home.packing"),
            description: "Scan orders for Packing"
          },
          {
            path: "/b-grade-defect",
            pageId: "qc2-inspection",
            image: "assets/Home/bgrade.png",
            title: "B-Grade Defects",
            description: "Record B-Grade defects"
          },
          {
            path: "/b-grade-stcok",
            pageId: "qc2-inspection",
            image: "assets/Home/bgrade.png",
            title: "B-Grade Stock",
            description: "View B-Grade Stock"
          }
        ]
      },
      {
        id: "fabric-cutting",
        title: "Fabric & Cutting",
        icon: <Scissors className="w-5 h-5 mr-2" />,
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        items: [
          {
            path: "/Fabric",
            roles: ["Fabric"],
            image: "assets/Home/fabric-logo.png",
            title: t("home.fabric"),
            description: "Fabric Inspection"
          },
          {
            path: "/cutting",
            roles: ["Cutting"],
            image: "assets/Home/cutting.webp",
            title: t("home.cutting"),
            description: "Cut Panel Inspection"
          },
          {
            path: "/cutting-inline",
            roles: ["Cutting"],
            image: "assets/Home/cutting-inline.png",
            title: t("home.cutting-inline"),
            description: "Cutting Inline Inspection"
          },
          {
            path: "/scc",
            roles: ["SCC"],
            image: "assets/Home/bundle.avif",
            title: t("SCC"),
            description: "Spreading & Cutting"
          },
          {
            path: "/qcWashing",
            roles: ["QC Washing"],
            image: "assets/Home/qcWashing.png",
            title: t("home.qcWashing"),
            description: "Washing Report"
          },
          {
            path: "/upload-beforewash-specs",
            roles: ["Washing Clerk"],
            image: "assets/Home/uploadspecs.png",
            title: t("home.upload_beforewash_specs"),
            description: "Upload Beforewash Specs"
          },
          {
            path: "/select-dt-specs",
            roles: ["Washing Clerk", "QA Clerk"],
            image: "assets/Home/select-specs.png",
            title: t("home.select_dt_specs"),
            description: "Select After Wash DT Specs"
          },
          {
            path: "/anf-washing",
            roles: ["ANF QA"],
            image: "assets/Home/anf-washing.png",
            title: t("home.anf_washing"),
            description: "QC After Wash Measurements"
          },
          {
            path: "/anf-washing-ver2",
            roles: ["ANF QA"],
            image: "assets/Home/anf-washing-ver2.png",
            title: t("home.anf_washing_version2"),
            description: "QC AW Measurements - Version 2"
          },
          {
            path: "/supplier-issues",
            roles: ["Supplier QC"],
            image: "assets/Home/supplier-issues.png",
            title: t("home.supplier-issues"),
            description: "Supplier Issues Sub-Con Fty"
          }
        ]
      },
      {
        id: "sewing-qc",
        title: "Sewing QC Inspection",
        icon: <CheckSquare className="w-5 h-5 mr-2" />,
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        items: [
          {
            path: "/roving",
            roles: ["QC Roving"],
            image: "assets/Home/qcinline.png",
            title: "QC Inline Roving",
            description: "QC Inline Roving Point"
          },
          {
            path: "/details",
            roles: ["QC1 Inspection"],
            image: "assets/Home/qcc.png",
            title: t("home.qc1_inspection"),
            description: "QC1 Inspection Point"
          },
          {
            path: "/qc1-subcon-inspection",
            roles: ["QC1 Sub Con"],
            image: "assets/Home/qcc.png",
            title: t("home.qc1_inspection"),
            description: "QC1 Sub Con Inspection"
          },
          {
            path: "/inline-emp",
            roles: ["Printing"],
            image: "assets/Home/qc2.png",
            title: "Print QR",
            description: "Sewing Worker QR Code"
          }
        ]
      },
      {
        id: "qa-inspection",
        title: "QA Inspection",
        icon: <Shield className="w-5 h-5 mr-2" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        items: [
          {
            path: "/audit",
            roles: ["QA Audit"],
            image: "assets/Home/qaa.png",
            title: "QMS Audit",
            description: "QMS Audit Check Point"
          },
          {
            path: "/qc2-upload-data",
            roles: ["Washing Clerk"],
            image: "assets/Home/qc2-workers-upload.png",
            title: t("home.qc2_upload_data"),
            description: "QC2 Upload Data"
          },
          {
            path: "/qc-accuracy",
            roles: ["QA"],
            image: "assets/Home/qc-accuracy.png",
            title: "QA Random Inspection",
            description: "QA Random Checks"
          },
          {
            path: "/qc-accuracy-ver2",
            roles: ["QA"],
            image: "assets/Home/qc-accuracy.png",
            title: "QC Output",
            description: "QC Output | Sunrise & Old Barcode System"
          },
          {
            path: "/training",
            roles: ["System Administration"],
            image: "assets/Home/training.jpg",
            title: "YQMS Training",
            description: "Training Schedule & Progress"
          },
          {
            path: "/exam",
            roles: ["System Administration"],
            image: "assets/Home/exam.jpg",
            title: "YQMS Exam",
            description: "Create Exam & Preview"
          },
          {
            path: "/qa-yorksys",
            roles: ["QA Clerk"],
            image: "assets/Home/upload-orders.png",
            title: "Upload Orders",
            description: "Order data from York-sys"
          },
          {
            path: "/final-inspection",
            roles: ["QA"],
            image: "assets/Home/qafinal.png",
            title: "Final Inspection",
            description: "QA Final Inspection"
          }
        ]
      },
      {
        id: "ce-section",
        title: "CE",
        icon: <ClipboardList className="w-5 h-5 mr-2" />,
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        items: [
          {
            path: "/master-list",
            roles: ["CE"],
            image: "assets/Home/masterlist.png",
            title: "Master List",
            description: "View and manage the Master List"
          }
        ]
      },
      {
        id: "admin-panel",
        title: "Admin Panel",
        icon: <Settings className="w-5 h-5 mr-2" />,
        bgColor: "bg-gray-100 dark:bg-gray-800/20",
        items: [
          {
            path: "/ieadmin",
            roles: ["IE", "System Administration"],
            image: "assets/Home/ie.png",
            title: t("home.ieadmin"),
            description: "IE System Admin"
          },
          {
            path: "/sysadmin",
            roles: ["System Administration"],
            image: "assets/Home/sysadmin.jpg",
            title: t("home.systemadmin"),
            description: "Modify Defects"
          },
          {
            path: "/yqms",
            roles: ["YQMS"],
            image: "assets/Home/yqms.png",
            title: t("home.yqms"),
            description: "Project Management"
          }
        ]
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <BarChart3 className="w-5 h-5 mr-2" />,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        items: [
          {
            path: "/download-data",
            roles: ["Download Data"],
            image: "assets/Home/download.jpg",
            title: t("home.download_data"),
            description: "Download Raw Data"
          },
          {
            path: "/live-dashboard",
            roles: ["Live Dashboard"],
            image: "assets/Home/dash.png",
            title: t("home.live_dashboard"),
            description: "QC2 Live Dashboard"
          },
          {
            path: "/powerbi",
            roles: ["Power BI"],
            image: "assets/Home/powerbi.png",
            title: "Power BI",
            description: "View Power BI Reports"
          },
          {
            path: "/qa-pivot",
            roles: ["QA Pivot"],
            image: "assets/Home/qalogo.png",
            title: "QA Evaluation",
            description: "Upload & View Data"
          },
          {
            path: "/qc1-sunrise",
            roles: ["QC1 Sunrise"],
            image: "assets/Home/sunrise.png",
            title: "QC1 Sunrise",
            description: "Upload Excel Data"
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
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto">
              {accessibleSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleTabClick(section.id)}
                  className="flex-shrink-0 flex items-center px-3 py-2 text-sm font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
            {/* <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button> */}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-6 rounded-md">
            {errorMessage}
          </div>
        )}
        <div className="space-y-12">
          {accessibleSections.length > 0 ? (
            accessibleSections.map((section) => (
              <section
                key={section.id}
                ref={(el) => (sectionRefs.current[section.id] = el)}
                className={`p-6 rounded-2xl ${section.bgColor} transition-colors`}
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
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      onClick={() => handleNavigation(item)}
                      className="group relative flex flex-col items-center justify-center p-4 rounded-xl shadow-md transition-all duration-300 bg-white dark:bg-slate-800 cursor-pointer hover:shadow-xl hover:-translate-y-1"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 object-contain mb-3"
                      />
                      <h3 className="text-sm font-bold text-center text-slate-700 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-20">
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
  );
}

export default Home;
