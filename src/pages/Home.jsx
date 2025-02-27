import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";
// Import the API_BASE_URL from our config file
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
      title: t("home.cutting/scc"),
      items: [
        {
          path: "/cutting",
          roles: ["Admin", "QC1"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12l-9-9-9 9m18-5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2zM9 10h6m-6 4h6m-3-8v4"
              />
            </svg>
          ),
          title: t("home.cutting"), //"Cutting",
          description: "Begin a new Cutting Inspection Reports here.",
        },
        {
          path: "/scc",
          roles: ["Admin", "QC2"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: t("SCC"),
          description: "Begin a new SCC Inspection Report here.",
        },
      ],
    },
    {
      title: t("home.order_data"),
      items: [
        {
          path: "/bundle-registration",
          roles: ["Admin", "Bundle Registration"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9l9-5.25M12 12.75l3.75-2.25M12 12.75V15l3.75-2.25"
              />
            </svg>
          ),
          title: t("home.bundle_registration"),
          description: "Click here to register orders for QC2 Inspection.",
        },
        {
          path: "/washing",
          roles: ["Admin", "Washing"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 12h16M4 6h16M4 18h16M5 3h14M5 21h14"
              />
            </svg>
          ),
          title: t("home.washing"),
          description: "Click here to scan orders for Washing.",
        },
        {
          path: "/opa",
          roles: ["Admin", "OPA"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2C7.03 2 3 6.03 3 11c0 5 4 9 9 9s9-4 9-9c0-4.97-4.03-9-9-9zM7 12h10"
              />
            </svg>
          ),
          title: t("home.opa"),
          description: "Click here to scan orders in OPA.",
        },
        {
          path: "/ironing",
          roles: ["Admin", "Ironing"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 14h13.5a3 3 0 002.98-2.64l.54-4.32A2 2 0 0018 5H6a3 3 0 00-3 3v6zM5 18h14"
              />
            </svg>
          ),
          title: t("home.ironing"),
          description: "Click here to scan orders for Ironing.",
        },
        {
          path: "/packing",
          roles: ["Admin", "Packing"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 14h13.5a3 3 0 002.98-2.64l.54-4.32A2 2 0 0018 5H6a3 3 0 00-3 3v6zM5 18h14"
              />
            </svg>
          ),
          title: t("home.packing"),
          description: "Click here to scan orders for Packing.",
        },
      ],
    },
    {
      title: t("home.quality_inspection"),
      items: [
        {
          path: "/details",
          roles: ["Admin", "QC1"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12l-9-9-9 9m18-5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2zM9 10h6m-6 4h6m-3-8v4"
              />
            </svg>
          ),
          title: t("home.qc1_inspection"),
          description: "Begin a new QC1 Endline Inspection here.",
        },
        {
          path: "/qc2-inspection",
          roles: ["Admin", "QC2"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: t("home.qc2_inspection"),
          description: "Begin a new QC2 Inspection Report here.",
        },
      ],
    },
    {
      title: t("home.qa_audit"),
      items: [
        {
          path: "/audit",
          roles: ["Admin", "QA"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-green-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-3 4h6v1H9V6zm0 2h6v5H9V8zm0 6h6v1H9v-1z"
              />
            </svg>
          ),
          title: t("home.qa_audit"),
          description: "Start a QA Audit Report here.",
        },
      ],
    },
    {
      title: t("home.data_analytics"),
      items: [
        {
          path: "/download-data",
          roles: ["Admin", "Data Analytics"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v6zm0-18v6h8V3h-8z"
              />
            </svg>
          ),
          title: t("home.download_data"),
          description: "Click here to Download Data.",
        },
        {
          path: "/live-dashboard",
          roles: ["Admin", "Data Analytics"],
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v6zm0-18v6h8V3h-8z"
              />
            </svg>
          ),
          title: t("home.live_dashboard"),
          description: "Click here to see Live Dashboard.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-8xl mx-auto">
        {/* <h3 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-md">
          Welcome to Quality Data Management System
        </h3> */}
        {/* <p className="text-lg text-gray-700 text-center mb-12">
          Click on the cards below to start inspection Reports or Live
          monitoring
        </p> */}
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
                    {item.icon}
                  </div>
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
