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
          image: "assets/Home/cutting.webp",
          title: t("home.cutting"), //"Cutting",
          description: "Begin a new Cutting Inspection Reports here.",
        },
        {
          path: "/scc",
          roles: ["Admin", "QC2"],
          image: "assets/Home/bundle.avif",
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
          image: "assets/Home/bundle.avif",
          title: t("home.bundle_registration"),
          description: "Click here to register orders for QC2 Inspection.",
        },
        {
          path: "/washing",
          roles: ["Admin", "Washing"],
          image: "assets/Home/washing.jpg",
          title: t("home.washing"),
          description: "Click here to scan orders for Washing.",
        },
        {
          path: "/opa",
          roles: ["Admin", "OPA"],
          image: "assets/Home/dyeing.png",
          title: t("home.opa"),
          description: "Click here to scan orders in OPA.",
        },
        {
          path: "/ironing",
          roles: ["Admin", "Ironing"],
          image: "assets/Home/ironing.png",
          title: t("home.ironing"),
          description: "Click here to scan orders for Ironing.",
        },
        {
          path: "/packing",
          roles: ["Admin", "Packing"],
          image: "assets/Home/packing.webp",
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
          image: "assets/Home/qcc.png",
          title: t("home.qc1_inspection"),
          description: "Begin a new QC1 Endline Inspection here.",
        },
        {
          path: "/qc2-inspection",
          roles: ["Admin", "QC2"],
          image: "assets/Home/qc2.png",
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
          image: "assets/Home/qaa.png",
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
          image: "assets/Home/download.jpg",
          title: t("home.download_data"),
          description: "Click here to Download Data.",
        },
        {
          path: "/live-dashboard",
          roles: ["Admin", "Data Analytics"],
          image: "assets/Home/dash.png",
          title: t("home.live_dashboard"),
          description: "Click here to see Live Dashboard.",
        },
        {
          path: "/qc1-sunrise",
          roles: ["Admin", "Data Analytics"],
          image: "assets/Home/dash.png",
          title: "QC1 Sunriser",
          description: "QC1 BI Report",
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
                  {/* <div className="flex items-center justify-center mb-4 bg-blue-100 w-12 h-12 rounded-full group-hover:bg-blue-600">
                    {item.icon}
                  </div> */}
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
