import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [roleManagement, setRoleManagement] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
        return;
      }
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      await Promise.all([fetchUserRoles(), fetchRoleManagement()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Error loading data");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user-roles/${user.emp_id}`
      );
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const fetchRoleManagement = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/role-management`);
      setRoleManagement(response.data);
    } catch (error) {
      console.error("Error fetching role management:", error);
    }
  };

  const hasAccess = (requiredRoles) => {
    if (!user || !roleManagement) return false;
    const isSuperAdmin = userRoles.includes("Super Admin");
    const isAdmin = userRoles.includes("Admin");
    if (isSuperAdmin || isAdmin) return true;
    return roleManagement.some(
      (role) =>
        requiredRoles.includes(role.role) &&
        role.jobTitles.includes(user.job_title)
    );
  };

  const handleNavigation = (path, requiredRoles) => {
    if (hasAccess(requiredRoles)) {
      navigate(path);
    } else {
      setErrorMessage("Unauthorized Access");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const cards = [
    {
      title: t("home.fabric/cutting/scc"),
      items: [
        {
          path: "/Fabric",
          roles: ["Admin", "Fabric"], // Matches "Fabric" role
          image: "assets/Home/fabric-logo.png",
          title: t("home.fabric"),
          description: "Fabric Inspection Reports"
        },
        {
          path: "/cutting",
          roles: ["Admin", "Cutting"], // Matches "Cutting" role
          image: "assets/Home/cutting.webp",
          title: t("home.cutting"),
          description: "Cutting Inspection Check Point"
        },
        {
          path: "/scc",
          roles: ["Admin", "SCC"], // Matches "SCC" role
          image: "assets/Home/bundle.avif",
          title: t("SCC"),
          description: "SCC Inspection Check Point"
        },
        {
          path: "/sysadmin",
          roles: ["Admin", "System Administration"], // Matches "System Administration" role
          image: "assets/Home/sysadmin.jpg",
          title: t("home.systemadmin"),
          description: "Modify Defect & Measurements"
        },
        {
          path: "/yqms",
          roles: ["Admin", "YQMS"], // Matches "YQMS" role
          image: "assets/Home/yqms.png",
          title: t("home.yqms"),
          description: "YQMS Project Management"
        }
      ]
    },
    {
      title: t("home.order_data"),
      items: [
        {
          path: "/bundle-registration",
          roles: ["Admin", "Bundle Registration"], // Matches "Bundle Registration" role
          image: "assets/Home/bundle.avif",
          title: t("home.bundle_registration"),
          description: "Order Registration: QC2."
        },
        {
          path: "/washing",
          roles: ["Admin", "Washing"], // Matches "Washing" role
          image: "assets/Home/washing.jpg",
          title: t("home.washing"),
          description: "Scan orders for Washing."
        },
        {
          path: "/opa",
          roles: ["Admin", "OPA"], // Matches "OPA" role
          image: "assets/Home/dyeing.png",
          title: t("home.opa"),
          description: "Scan orders in OPA."
        },
        {
          path: "/ironing",
          roles: ["Admin", "Ironing"], // Matches "Ironing" role
          image: "assets/Home/ironing.png",
          title: t("home.ironing"),
          description: "Scan orders for Ironing."
        },
        {
          path: "/packing",
          roles: ["Admin", "Packing"], // Matches "Packing" role
          image: "assets/Home/packing.webp",
          title: t("home.packing"),
          description: "Scan orders for Packing."
        }
      ]
    },
    {
      title: t("home.quality_inspection"),
      items: [
        {
          path: "/roving",
          roles: ["Admin", "QC Roving"], // Fixed: Changed "QC1" to "QC Roving"
          image: "assets/Home/qcinline.png",
          title: t("home.qc_inline_roving"),
          description: "QC Inline Roving Check Point."
        },
        {
          path: "/inline-emp",
          roles: ["Admin", "Printing"], // Matches "Printing" role
          image: "assets/Home/qc2.png",
          title: "Print QR",
          description: "Sewing Worker QR."
        },
        {
          path: "/details",
          roles: ["Admin", "QC1 Inspection"], // Matches "QC1 Inspection" role
          image: "assets/Home/qcc.png",
          title: t("home.qc1_inspection"),
          description: "QC1 Inspection Check Point."
        },
        {
          path: "/qc2-repair-tracking",
          roles: ["Admin", "QC2 Tracking"], // Matches "QC2 Tracking" role
          image: "assets/Home/repair.png",
          title: t("home.qc2_repair"),
          description: "QC2 Repair Tracking System."
        },
        {
          path: "/qc2-inspection",
          roles: ["Admin", "QC2 Inspection"], // Matches "QC2 Inspection" role
          image: "assets/Home/qc2.png",
          title: t("home.qc2_inspection"),
          description: "QC2 Inspection Check Point."
        }
      ]
    },
    {
      title: t("home.qa_audit"),
      items: [
        {
          path: "/audit",
          roles: ["Admin", "QA Audit"], // Matches "QA Audit" role
          image: "assets/Home/qaa.png",
          title: t("home.qa_audit"),
          description: "QA Audit Check Point."
        },
        {
          path: "/final-inspection",
          roles: ["Admin", "QA Audit"], // Matches "QA Audit" role (same as audit)
          image: "assets/Home/qafinal.png",
          title: t("home.final_inspection"),
          description: "QA Final Inspection."
        }
      ]
    },
    {
      title: t("home.data_analytics"),
      items: [
        {
          path: "/download-data",
          roles: ["Admin", "Download Data"], // Matches "Download Data" role
          image: "assets/Home/download.jpg",
          title: t("home.download_data"),
          description: "Download Raw Data."
        },
        {
          path: "/live-dashboard",
          roles: ["Admin", "Live Dashboard"], // Matches "Live Dashboard" role
          image: "assets/Home/dash.png",
          title: t("home.live_dashboard"),
          description: "YQMS QC2 Live Dashboard."
        },
        {
          path: "/powerbi",
          roles: ["Admin", "Power BI"], // Matches "Power BI" role
          image: "assets/Home/powerbi.png",
          title: "Power BI",
          description: "Power BI Report"
        },
        {
          path: "/qa-pivot",
          roles: ["Admin", "QA Pivot"], // Matches "QA Pivot" role
          image: "assets/Home/qalogo.png",
          title: "QA YM/Sub Con Evaluation",
          description: "Upload Excel / Dashboard"
        },
        {
          path: "/qc1-sunrise",
          roles: ["Admin", "QC1 Sunrise"], // Matches "QC1 Sunrise" role
          image: "assets/Home/sunrise.png",
          title: "QC1 Sunriser",
          description: "Upload Excel file here..."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-8xl mx-auto">
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
                {section.title}
              </h2>
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  onClick={() => handleNavigation(item.path, item.roles)}
                  className={`group bg-white p-6 rounded-xl shadow-lg cursor-pointer ${
                    hasAccess(item.roles)
                      ? "hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                >
                  <div
                    className="flex flex-col items-center justify-center mb-2 w-16 h-16 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.image})` }}
                  ></div>
                  <h2
                    className={`text-xl font-bold text-gray-800 mb-2 ${
                      hasAccess(item.roles)
                        ? "group-hover:text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {item.title}
                  </h2>
                  <p
                    className={`text-sm text-gray-600 ${
                      hasAccess(item.roles)
                        ? "group-hover:text-gray-800"
                        : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
