import axios from "axios";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import { Loader2 } from "lucide-react";

import {
  Layers,
  Settings,
  BarChart3,
  Scissors,
  CheckSquare,
  Shield,
  Sun,
  Moon,
  ClipboardList,
  Bell,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home as HomeIcon
} from "lucide-react";

// --- Theme Hook for Dark Mode ---
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("home-theme") || "light",
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

// --- Custom Hook for Screen Size Detection ---
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return "mobile";
      if (window.innerWidth < 1024) return "tablet";
      return "desktop";
    }
    return "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("mobile");
      } else if (window.innerWidth < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

// --- Utility for Push Notifications ---
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- Settings Modal Component ---
const SettingsModal = ({
  isOpen,
  onClose,
  user,
  isMobile,
  theme,
  toggleTheme,
}) => {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Check subscription status - runs on mount and when user changes
  useEffect(() => {
    if (!user?.emp_id) {
      setCheckingSubscription(false);
      return;
    }

    const checkSubscriptionStatus = async () => {
      setCheckingSubscription(true);

      // Check browser support
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push Messaging not supported");
        setCheckingSubscription(false);
        return;
      }

      // Get current permission
      setPermission(Notification.permission);

      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;
        const browserSubscription =
          await registration.pushManager.getSubscription();

        if (browserSubscription) {
          // Browser has a subscription - verify it exists in our database
          try {
            const response = await axios.post(
              `${API_BASE_URL}/api/fincheck-reports/push/verify`,
              {
                empId: user.emp_id,
                endpoint: browserSubscription.endpoint,
              },
            );

            if (response.data.success && response.data.exists) {
              setIsSubscribed(true);
            } else {
              // Browser has subscription but not in our DB - user needs to re-subscribe
              setIsSubscribed(false);
            }
          } catch (verifyError) {
            // If verify endpoint doesn't exist or fails, fall back to local check
            console.log("Verify API not available, using local check");
            setIsSubscribed(true);
          }
        } else {
          // No browser subscription
          setIsSubscribed(false);
        }
      } catch (e) {
        console.error("Error checking subscription:", e);
        setIsSubscribed(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [user?.emp_id]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setDebugError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const subscribeToPush = async () => {
    if (!user || !user.emp_id) return;
    setLoading(true);
    setDebugError(null);
    setSuccessMessage(null);

    try {
      // --- STEP 1: Request Permission ---
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error(
          "Permission Denied. Please enable notifications in browser settings.",
        );
      }

      // --- STEP 2: Register Service Worker ---
      let registration;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      } catch (swError) {
        throw new Error(`SW Register Failed: ${swError.message}`);
      }

      // --- STEP 3: Get VAPID Public Key ---
      let publicVapidKey;
      try {
        const keyRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/push/vapid-key`,
        );
        publicVapidKey = keyRes.data.publicKey;
      } catch (apiError) {
        throw new Error(`API VAPID Key Error: ${apiError.message}`);
      }

      // --- STEP 4: Unsubscribe existing subscription first (to get fresh one) ---
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          await existingSub.unsubscribe();
        }
      } catch (unsubError) {
        console.log("No existing subscription to remove");
      }

      // --- STEP 5: Subscribe to Push Manager ---
      let subscription;
      try {
        const convertedKey = urlBase64ToUint8Array(publicVapidKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      } catch (subError) {
        throw new Error(`PushManager Subscribe Error: ${subError.message}`);
      }

      // --- STEP 6: Send to Backend ---
      try {
        await axios.post(
          `${API_BASE_URL}/api/fincheck-reports/push/subscribe`,
          {
            empId: user.emp_id,
            subscription: subscription,
            userAgent: navigator.userAgent,
          },
        );
      } catch (backendError) {
        throw new Error(`Backend Save Error: ${backendError.message}`);
      }

      // Success
      setIsSubscribed(true);
      setSuccessMessage("Notifications enabled successfully!");
    } catch (error) {
      console.error("Push Flow Error:", error);
      setDebugError(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] ${
        isMobile ? "" : "flex items-center justify-center"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-slate-900 ${
          isMobile
            ? "h-full w-full"
            : "rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Notifications Section */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Push Notifications
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Get alerts for Fincheck updates
                </p>
              </div>
            </div>

            {debugError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{debugError}</span>
                </div>
                <button
                  className="mt-2 text-xs underline"
                  onClick={() => setDebugError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg mb-3 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {successMessage}
              </div>
            )}

            {checkingSubscription ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking status...
              </div>
            ) : permission === "denied" ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Notifications Blocked
                </p>
                <p className="text-xs">
                  Please enable them in your browser settings and refresh the
                  page.
                </p>
              </div>
            ) : permission === "granted" && isSubscribed ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Notifications are enabled
              </div>
            ) : (
              <button
                onClick={subscribeToPush}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  loading
                    ? "bg-gray-300 dark:bg-slate-700 cursor-not-allowed text-gray-500"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Enable Notifications
                  </>
                )}
              </button>
            )}
          </div>

          {/* Theme Section */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    Appearance
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600 transition-all active:scale-95"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* User Info Section */}
          {user && (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                    {user.name || "User"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.job_title || "Employee"} • ID: {user.emp_id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* App Version */}
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
            YQMS Version 2.0
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Mobile Bottom Navigation Component ---
const MobileBottomNav = ({
  sections,
  activeSection,
  onSectionChange,
  onSettingsClick,
}) => {
  const navRef = useRef(null);
  const activeButtonRef = useRef(null);

  // Auto-scroll to active section in nav
  useEffect(() => {
    if (activeButtonRef.current && navRef.current) {
      const container = navRef.current;
      const button = activeButtonRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      if (
        buttonRect.left < containerRect.left ||
        buttonRect.right > containerRect.right
      ) {
        button.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeSection]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-50">
      <div
        ref={navRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            ref={activeSection === section.id ? activeButtonRef : null}
            onClick={() => onSectionChange(section.id)}
            className={`flex-shrink-0 min-w-[72px] flex flex-col items-center py-2 px-2 transition-all duration-200 ${
              activeSection === section.id
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                activeSection === section.id
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : ""
              }`}
            >
              {React.cloneElement(section.icon, {
                className: "w-5 h-5",
                style: { margin: 0 },
              })}
            </div>
            <span className="text-[9px] mt-1 font-medium leading-tight text-center max-w-[60px] truncate">
              {section.title}
            </span>
          </button>
        ))}
        <button
          onClick={onSettingsClick}
          className="flex-shrink-0 min-w-[72px] flex flex-col items-center py-2 px-2 text-slate-400 dark:text-slate-500"
        >
          <div className="p-1.5">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-1 font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

// --- Mobile Compact Grid Item Component ---
const MobileGridItem = ({ item, onClick, fincheckActionCount }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-start p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm active:scale-[0.95] active:bg-gray-50 dark:active:bg-slate-700 transition-all border border-gray-100 dark:border-slate-700 aspect-square"
    >
      {/* Notification Badge */}
      {item.path === "/fincheck-inspection" && fincheckActionCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm animate-pulse">
          {fincheckActionCount}
        </div>
      )}

      <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden mt-1">
        <img
          src={item.image}
          alt={item.title}
          className="w-7 h-7 object-contain"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      <h3 className="text-[10px] font-medium text-slate-700 dark:text-white text-center leading-tight mt-1.5 line-clamp-2 px-0.5">
        {item.title}
      </h3>
    </div>
  );
};

// --- Tablet Grid Item Component ---
const TabletGridItem = ({ item, onClick, fincheckActionCount }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm cursor-pointer hover:shadow-md active:scale-[0.98] transition-all border border-gray-100 dark:border-slate-700"
    >
      {/* Notification Badge */}
      {item.path === "/fincheck-inspection" && fincheckActionCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm animate-pulse">
          {fincheckActionCount}
        </div>
      )}

      <img
        src={item.image}
        alt={item.title}
        className="w-10 h-10 object-contain mb-2"
      />
      <h3 className="text-xs font-bold text-center text-slate-700 dark:text-slate-100 line-clamp-2">
        {item.title}
      </h3>
      <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
        {item.description}
      </p>
    </div>
  );
};

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();

  const [errorMessage, setErrorMessage] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [roleManagement, setRoleManagement] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [accessMap, setAccessMap] = useState({});

  const [fincheckActionCount, setFincheckActionCount] = useState(0);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("home-active-section") || null;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sectionRefs = useRef({});

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";

  const allSections = useMemo(
    () => [
      {
        id: "qc2-system",
        title: "QC2",
        icon: <Layers className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        items: [
          {
            path: "/bundle-registration",
            pageId: "bundle-registration",
            image: "assets/Home/bundle.avif",
            title: t("home.bundle_registration"),
            description: "Order Registration",
          },
          {
            path: "/washing",
            pageId: "washing",
            image: "assets/Home/washing.jpg",
            title: t("home.washing"),
            description: "Scan orders for Washing",
          },
          {
            path: "/opa",
            pageId: "opa",
            image: "assets/Home/dyeing.png",
            title: t("home.opa"),
            description: "Scan orders in OPA",
          },
          {
            path: "/ironing",
            pageId: "ironing",
            image: "assets/Home/ironing.png",
            title: t("home.ironing"),
            description: "Scan orders for Ironing",
          },
          {
            path: "/qc2-inspection",
            pageId: "qc2-inspection",
            image: "assets/Home/qc2.png",
            title: t("home.qc2_inspection"),
            description: "QC2 Inspection Point",
          },
          {
            path: "/qc2-repair-tracking",
            pageId: "qc2-inspection",
            image: "assets/Home/repair.png",
            title: "Defect Tracking",
            description: "QC2 Repair Tracking",
          },
          {
            path: "/packing",
            pageId: "packing",
            image: "assets/Home/packing.webp",
            title: t("home.packing"),
            description: "Scan orders for Packing",
          },
          {
            path: "/b-grade-defect",
            pageId: "qc2-inspection",
            image: "assets/Home/bgrade.png",
            title: "B-Grade Defects",
            description: "Record B-Grade defects",
          },
          {
            path: "/b-grade-stcok",
            pageId: "qc2-inspection",
            image: "assets/Home/bgrade.png",
            title: "B-Grade Stock",
            description: "View B-Grade Stock",
          },
        ],
      },
      {
        id: "fabric-cutting",
        title: "Fabric",
        icon: <Scissors className="w-5 h-5 mr-2" />,
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        items: [
          {
            path: "/Fabric",
            roles: ["Fabric"],
            image: "assets/Home/fabric-logo.png",
            title: t("home.fabric"),
            description: "Fabric Inspection",
          },
          {
            path: "/cutting",
            roles: ["Cutting"],
            image: "assets/Home/cutting.webp",
            title: t("home.cutting"),
            description: "Cut Panel Inspection",
          },
          {
            path: "/cutting-inline",
            roles: ["Cutting"],
            image: "assets/Home/cutting-inline.png",
            title: t("home.cutting-inline"),
            description: "Cutting Inline Inspection",
          },
          {
            path: "/scc",
            roles: ["SCC"],
            image: "assets/Home/SCCLogo.jpg",
            title: t("SCC"),
            description: "Spreading & Cutting",
          },
          {
            path: "/qcWashing",
            roles: ["QC Washing"],
            image: "assets/Home/qcwashing.png",
            title: t("home.qcWashing"),
            description: "Washing Report",
          },
          {
            path: "/afterIroning",
            roles: ["QC Ironing"],
            image: "assets/Home/after_ironing.png",
            title: t("home.afterIroning"),
            description: "After Ironing Report",
          },
          {
            path: "/select-dt-specs",
            roles: ["Washing Clerk", "QA Clerk"],
            image: "assets/Home/select-specs.png",
            title: t("home.select_dt_specs"),
            description: "Select After Wash DT Specs",
          },
          {
            path: "/anf-washing",
            roles: ["ANF QA"],
            image: "assets/Home/anf-washing.png",
            title: t("home.anf_washing"),
            description: "QC After Wash Measurements",
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
        title: "Sewing",
        icon: <CheckSquare className="w-5 h-5 mr-2" />,
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        items: [
          {
            path: "/roving",
            roles: ["QC Roving"],
            image: "assets/Home/qcinline.png",
            title: "QC Inline Roving",
            description: "QC Inline Roving Point",
          },
          {
            path: "/details",
            roles: ["QC1 Inspection"],
            image: "assets/Home/qcc.png",
            title: t("home.qc1_inspection"),
            description: "QC1 Inspection Point",
          },
          {
            path: "/sub-con-qc1",
            roles: ["QC1 Sub Con"],
            image: "assets/Home/sub-con-qc1.png",
            title: t("home.qc1_subcon_inspection"),
            description: "QC1 Sub Con Inspection",
          },
          {
            path: "/inline-emp",
            roles: ["Printing"],
            image: "assets/Home/qc2.png",
            title: "Print QR",
            description: "Sewing Worker QR Code",
          },
          {
            path: "/humidity-report",
            roles: ["Humidity QC"],
            image: "assets/Home/Humidity.jpg",
            title: "Humidity Report",
            description: "View Humidity Report",
          },
        ],
      },
      {
        id: "y-pivot",
        title: "Fincheck",
        icon: <Layers className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        items: [
          {
            path: "/qa-sections",
            roles: ["Fincheck Config"],
            image: "assets/Home/Fincheck_Setting.png",
            title: t("home.qa_sections"),
            description: "Configuration",
          },
          {
            path: "/qa-measurements",
            roles: ["Fincheck Measurement"],
            image: "assets/Home/FinCheck_Measurements.png",
            title: t("home.qa_measurements"),
            description: "Upload/Measurement Settings",
          },
          {
            path: "/qa-templates",
            roles: ["Fincheck Templates"],
            image: "assets/Home/Fincheck_Templates.png",
            title: t("home.qa_templates"),
            description: "...",
          },
          {
            path: "/fincheck-inspection",
            roles: ["Fincheck Inspections"],
            image: "assets/Home/Fincheck_Inspection.png",
            title: t("home.y_pivot_inspection"),
            description: "...",
          },
          {
            path: "/fincheck-reports",
            roles: ["Fincheck Reports"],
            image: "assets/Home/Fincheck_Reports.png",
            title: t("home.y_pivot_report"),
            description: "...",
          },
          {
            path: "/P88Legacy",
            roles: ["P88"],
            image: "assets/Home/p88Legacy.png",
            title: t("home.p88_Legacy"),
            description: "Historical Data",
            version: "0",
          },
        ],
      },
      {
        id: "qa-inspection",
        title: "QA",
        icon: <Shield className="w-5 h-5 mr-2" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        items: [
          {
            path: "/audit",
            roles: ["QA Audit"],
            image: "assets/Home/qaa.png",
            title: "QMS Audit",
            description: "QMS Audit Check Point",
          },
          {
            path: "/qc2-upload-data",
            roles: ["Washing Clerk"],
            image: "assets/Home/qc2-workers-upload.png",
            title: t("home.qc2_upload_data"),
            description: "QC2 Upload Data",
          },
          {
            path: "/qc2-washing-upload",
            roles: ["Washing Clerk"],
            image: "assets/Home/qc2WashingUpload.png",
            title: t("home.qc2_washing_data"),
            description: "QC2 Washing Data",
          },
          {
            path: "/qc-accuracy",
            roles: ["QA"],
            image: "assets/Home/qc-accuracy.png",
            title: "QA Random Inspection",
            description: "QA Random Checks",
          },
          {
            path: "/qc-output",
            roles: ["QA"],
            image: "assets/Home/qcOutput.png",
            title: "QC Output",
            description: "QC Output | Sunrise & Old Barcode System",
          },
          {
            path: "/training",
            roles: ["System Administration"],
            image: "assets/Home/training.jpg",
            title: "YQMS Training",
            description: "Training Schedule & Progress",
          },
          {
            path: "/exam",
            roles: ["System Administration"],
            image: "assets/Home/exam.jpg",
            title: "YQMS Exam",
            description: "Create Exam & Preview",
          },
          {
            path: "/packing-list",
            roles: ["QA Clerk"],
            image: "assets/Home/PackingList.png",
            title: "Upload Packing List",
            description: "Packing List from Shipping Dept",
          },
          {
            path: "/final-inspection",
            roles: ["QA"],
            image: "assets/Home/qafinal.png",
            title: "Final Inspection",
            description: "QA Final Inspection",
          },
        ],
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
            image: "assets/Home/CE-System.png",
            title: "CE",
            description: "Production Control & Monitoring",
          },
        ],
      },
      {
        id: "admin-panel",
        title: "Admin",
        icon: <Settings className="w-5 h-5 mr-2" />,
        bgColor: "bg-gray-100 dark:bg-gray-800/20",
        items: [
          {
            path: "/ieadmin",
            roles: ["IE", "System Administration"],
            image: "assets/Home/ie.png",
            title: t("home.ieadmin"),
            description: "IE System Admin",
          },
          {
            path: "/sysadmin",
            roles: ["System Administration"],
            image: "assets/Home/sysadmin.jpg",
            title: t("home.systemadmin"),
            description: "Modify Defects",
          },
          {
            path: "/yqms",
            roles: ["YQMS"],
            image: "assets/Home/yqms.png",
            title: t("home.yqms"),
            description: "Project Management",
          },
        ],
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
            description: "Download Raw Data",
          },
          {
            path: "/live-dashboard",
            roles: ["Live Dashboard"],
            image: "assets/Home/dash.png",
            title: t("home.live_dashboard"),
            description: "QC2 Live Dashboard",
          },
          {
            path: "/powerbi",
            roles: ["Power BI"],
            image: "assets/Home/powerbi.png",
            title: "Power BI",
            description: "View Power BI Reports",
          },
          {
            path: "/qa-pivot",
            roles: ["QA Pivot"],
            image: "assets/Home/qalogo.png",
            title: "QA Evaluation",
            description: "Upload & View Data",
          },
          {
            path: "/qc1-sunrise",
            roles: ["QC1 Sunrise"],
            image: "assets/Home/sunrise.png",
            title: "QC1 Sunrise",
            description: "Upload Excel Data",
          },
        ],
      },
      {
        id: "ydt",
        title: "YDT",
        icon: <ClipboardList className="w-5 h-5 mr-2" />,
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        items: [
          {
            path: "/production-Sheet",
            roles: ["production"],
            image: "assets/Home/coverPage.png",
            title: "Production Sheet",
            description: "Maintain the production sheet",
            version: "0",
          },
        ],
      },
    ],
    [t],
  );

  // Persist active section to localStorage
  useEffect(() => {
    if (activeSection) {
      localStorage.setItem("home-active-section", activeSection);
    }
  }, [activeSection]);

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
        setErrorMessage("");
        try {
          const [roleManagementRes, userRolesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/role-management`),
            axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`),
          ]);
          setRoleManagement(roleManagementRes.data);
          setUserRoles(userRolesRes.data.roles);
        } catch (error) {
          console.error("Error fetching base roles:", error);
          setErrorMessage("Error loading base page permissions.");
          setPageLoading(false);
        }
      };
      fetchBaseRoles();
    }
  }, [user]);

  // STEP 3: Fetch IE-specific access rights only AFTER legacy roles are loaded
  useEffect(() => {
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
              `${API_BASE_URL}/api/ie/role-management/access-check?emp_id=${user.emp_id}&page=${pageId}`,
            ),
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
          setPageLoading(false);
        }
      };
      checkAllIEAccess();
    }
  }, [roleManagement, user, allSections]);

  // Hybrid access function
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
            role.jobTitles.includes(user.job_title),
        );
      }
      return false;
    },
    [user, userRoles, roleManagement, accessMap],
  );

  // Dynamic filtering logic
  const accessibleSections = useMemo(() => {
    if (pageLoading || !userRoles) return [];
    return allSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasAccess(item)),
      }))
      .filter((section) => section.items.length > 0);
  }, [allSections, hasAccess, pageLoading, userRoles]);

  // Set initial active section when accessible sections are loaded
  useEffect(() => {
    if (accessibleSections.length > 0) {
      const savedSection = localStorage.getItem("home-active-section");
      // Check if saved section exists in accessible sections
      const sectionExists = accessibleSections.some(
        (s) => s.id === savedSection,
      );

      if (!activeSection || !sectionExists) {
        // If no active section or saved section is not accessible, use first available
        setActiveSection(
          sectionExists ? savedSection : accessibleSections[0].id,
        );
      }
    }
  }, [accessibleSections]);

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
      block: "start",
    });
  };

  // Get current section items for mobile/tablet view
  const currentSectionItems = useMemo(() => {
    if (!activeSection) return [];
    const section = accessibleSections.find((s) => s.id === activeSection);
    return section ? section.items : [];
  }, [activeSection, accessibleSections]);

  const currentSection = useMemo(() => {
    return accessibleSections.find((s) => s.id === activeSection);
  }, [activeSection, accessibleSections]);

  // Fetch Fincheck Action Required Count for Badge
  useEffect(() => {
    if (!user?.emp_id) return;

    const fetchActionCount = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/action-count?empId=${user.emp_id}`,
        );
        if (res.data.success) {
          setFincheckActionCount(res.data.count);
        }
      } catch (error) {
        console.error("Error fetching action count:", error);
      }
    };

    fetchActionCount();

    const interval = setInterval(fetchActionCount, 60000);
    return () => clearInterval(interval);
  }, [user?.emp_id]);

  // Register Service Worker on Mount (Required for Push Notifications)
  useEffect(() => {
    if (!user?.emp_id) return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push Messaging not supported");
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration.scope);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, [user?.emp_id]);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </div>
    );
  }

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <>
        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          isMobile={true}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="fixed inset-0 top-12 bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 h-12">
              <div className="flex items-center gap-2">
                {currentSection && (
                  <>
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {React.cloneElement(currentSection.icon, {
                        className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                        style: { margin: 0 },
                      })}
                    </div>
                    <h1 className="text-sm font-bold text-slate-800 dark:text-white">
                      {currentSection.title}
                    </h1>
                  </>
                )}
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </header>

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-3 mt-2 bg-red-500 text-white text-center py-2 rounded-lg text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Mobile Content */}
          <main className="p-2 pb-24">
            {currentSectionItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {currentSectionItems.map((item, index) => (
                  <MobileGridItem
                    key={index}
                    item={item}
                    onClick={() => handleNavigation(item)}
                    fincheckActionCount={fincheckActionCount}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <HomeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No items available in this section
                </p>
              </div>
            )}
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav
            sections={accessibleSections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        </div>
      </>
    );
  }

  // --- Tablet Layout ---
  if (isTablet) {
    return (
      <>
        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          isMobile={false}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="fixed inset-0 top-12 bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col overflow-hidden">
          {/* Tablet Header */}
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                {currentSection && (
                  <>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {React.cloneElement(currentSection.icon, {
                        className: "w-5 h-5 text-blue-600 dark:text-blue-400",
                        style: { margin: 0 },
                      })}
                    </div>
                    <h1 className="text-base font-bold text-slate-800 dark:text-white">
                      {currentSection.title}
                    </h1>
                  </>
                )}
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </header>

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-4 mt-2 bg-red-500 text-white text-center py-2 rounded-lg text-sm font-medium">
              {errorMessage}
            </div>
          )}

          {/* Tablet Content */}
          <main className="p-4 pb-24">
            {currentSectionItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {currentSectionItems.map((item, index) => (
                  <TabletGridItem
                    key={index}
                    item={item}
                    onClick={() => handleNavigation(item)}
                    fincheckActionCount={fincheckActionCount}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <HomeIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  No items available in this section
                </p>
              </div>
            )}
          </main>

          {/* Tablet Bottom Navigation */}
          <MobileBottomNav
            sections={accessibleSections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        </div>
      </>
    );
  }

  // --- Desktop Layout (Original) ---
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        isMobile={false}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto flex-1">
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
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 ml-4 transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
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
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                  }}
                >
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      onClick={() => handleNavigation(item)}
                      className="group relative flex flex-col items-center justify-center p-4 rounded-xl shadow-md transition-all duration-300 bg-white dark:bg-slate-800 cursor-pointer hover:shadow-xl hover:-translate-y-1"
                    >
                      {/* Notification Badge for Fincheck Inspection */}
                      {item.path === "/fincheck-inspection" &&
                        fincheckActionCount > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
                            {fincheckActionCount}
                          </div>
                        )}

                      <img
                        src={item.image}
                        alt={item.title}
                        className={`${item.imageSize === "large" ? "w-20 h-20" : "w-14 h-14"} object-contain mb-3`}
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
