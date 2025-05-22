import axios from "axios";
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../components/authentication/AuthContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from "../../config";

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
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
  }, [user, loading, navigate]); // Added navigate to dependency array

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
    if (!user || !user.emp_id) {
        console.warn("User or emp_id not available for fetching roles.");
        return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`);
      setUserRoles(response.data.roles || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setUserRoles([]); // Set to empty array on error
    }
  };

  const fetchRoleManagement = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/role-management`);
      setRoleManagement(response.data || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching role management:", error);
      setRoleManagement([]); // Set to empty array on error
    }
  };

  const hasAccess = (requiredRoles) => {
    if (!user || !Array.isArray(roleManagement) || !Array.isArray(userRoles)) return false;

    const isSuperAdmin = userRoles.includes("Super Admin");
    const isAdmin = userRoles.includes("Admin");

    if (isSuperAdmin || isAdmin) return true;

    if (!Array.isArray(requiredRoles)) return false;

    return roleManagement.some(
      (roleDef) =>
        requiredRoles.includes(roleDef.role) &&
        Array.isArray(roleDef.jobTitles) &&
        roleDef.jobTitles.includes(user.job_title)
    );
  };


  const handleNavigation = (path, requiredRoles) => {
    if (hasAccess(requiredRoles)) {
      navigate(path);
    } else {
      setErrorMessage(t('Unauthorized Access'));
      setTimeout(() => {
        setErrorMessage('');
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

  // Define cards with explicit version property for each item
  const cards = [
    {
      title: t("home.fabric/cutting/scc"),
      items: [
        {
          path: "/Fabric",
          roles: ["Admin", "QC2"],
          image: "/IMG/fabric-logo.png",
          title: t("home.fabric"),
          description: "Fabric Inspection Reports",
          version: '0',
        },
        {
          path: "/cutting",
          roles: ["Admin", "QC1"],
          image: "/IMG/cutting.webp",
          title: t("home.cutting"),
          description: "Cutting Inspection Check Point.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/scc",
          roles: ["Admin", "QC2"],
          image: "/IMG/bundle.avif",
          title: t("SCC"),
          description: "SCC Inspection Check Point.",
          version: '0',
        },
        {
          path: "/sysadmin",
          roles: ["Admin", "System Administration"],
          image: "/IMG/system.png",
          title: t("home.systemadmin"),
          description: "Modify Defect & Measurements.",
          version: '0.1',
        },
      ]
    },
    {
      title:  t("home.order_data"),
      items: [
        {
          path: "/bundle-registration",
          roles: ["Admin", "Bundle Registration"],
          image: "/IMG/bundle.avif",
          title: t("home.bundle_registration"),
          description: "Order Registration: QC2.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/washing",
          roles: ["Admin", "Washing"],
          image: "/IMG/washing.jpg",
          title: t("home.washing"),
          description: "Scan orders for Washing.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/opa",
          roles: ["Admin", "OPA"],
          image: "/IMG/dyeing.png",
          title: t("home.opa"),
          description: "Scan orders in OPA.",
          version: '0.1', 
        },
        {
          path: "/ironing",
          roles: ["Admin", "Ironing"],
          image: "/IMG/ironing.png",
          title: t("home.ironing"),
          description: "Scan orders for Ironing.",
          version: '0.1', 
        },
        {
          path: "/packing",
          roles: ["Admin", "Packing"],
          image: "/IMG/packing.webp",
          title: t("home.packing"),
          description: "Scan orders for Packing.",
          version: '0.1', 
        }
      ]
    },
    {
      title:  t("home.quality_inspection"),
      items: [
        {
          path: "/roving",
          roles: ["Admin", "QC1"],
          image: "/IMG/qcinline.png",
          title:  t("home.qc_inline_roving"),
          description: "QC Inline Roving Check Point.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/inline-emp",
          roles: ["Admin", "Printing"],
          image: "assets/Home/qc2.png",
          title: "Print QR",
          description: "Sewing Worker QR.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/details",
          roles: ["Admin", "QC1"],
          image: "/IMG/qcc.png",
          title:  t("home.qc1_inspection"),
          description: "QC1 Inspection Check Point.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/qc2-repair-tracking",
          roles: ["Admin", "QC2"],
          image: "/IMG/repair.png",
          title: t("home.qc2_repair"),
          description: "QC2 Repair Tracking System.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/qc2-inspection",
          roles: ["Admin", "QC2"],
          image: "/IMG/qc2.png",
          title:  t("home.qc2_inspection"),
          description: "QC2 Inspection Check Point.",
          version: '0.1', // Changed to 0.1 as per previous context
        }
      ]
    },
    {
      title:  t("home.qa_audit"),
      items: [
        {
          path: "/audit",
          roles: ["Admin", "QA"],
          image: "/IMG/qaa.png",
          title:  t("home.qa_audit"),
          description: "QA Audit Check Point.",
          version: '0',
        },
        {
          path: "/final-inspection",
          roles: ["Admin", "QA"],
          image: "/IMG/qafinal.png",
          title: t("home.final_inspection"),
          description: "QA Final Inspection.",
          version: '0',
        },
      ],
    },
    {
      title:  t("home.data_analytics"),
      items: [
        {
          path: "/download-data",
          roles: ["Admin", "Download Data"],
          image: "/IMG/download.jpg",
          title:  t("home.download_data"),
          description: "Download Raw Data.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/live-dashboard",
          roles: ["Admin", "Live Dashboard"],
          image: "/IMG/dash.png",
          title:  t("home.live_dashboard"),
          description: "YQMS QC2 Live Dashboard.",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/powerbi",
          roles: ["Admin", "Power BI"],
          image: "/IMG/powerbi.png",
          title: "Power BI",
          description: "Power BI Report",
          version: '0.1', // Changed to 0.1 as per previous context
        },
        {
          path: "/qc1-sunrise",
          roles: ["Admin", "QC1 Sunrise"],
          image: "/IMG/sunrise.png",
          title: "QC1 Sunriser",
          description: "Upload Excel file here...",
          version: '0.1',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-8xl mx-auto">
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {cards.map((section, index) => (
            <div key={index} className="space-y-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
                {section.title}
              </h2>
              {section.items.map((item, idx) => {
                const canAccess = hasAccess(item.roles);
                if (!canAccess) return null;

                // Determine the ring and background color based on the explicit version property
                const isV01 = item.version === '0.1';
                const versionSpecificClasses = isV01
                  ? 'ring-green-500 bg-green-50' // Green ring and light green background for v0.1
                  : 'ring-gray-400 bg-gray-100'; // Gray ring and light gray background for v0

                return (
                  <div
                    key={idx}
                    onClick={() => handleNavigation(item.path, item.roles)}
                    // Apply conditional ring and background styling based on item.version
                    // Removed bg-white, using versionSpecificClasses instead
                    className={`group p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105 ring-2 ${versionSpecificClasses} ring-offset-2`}
                  >
                    <div className="flex flex-col items-center justify-center mb-2">
                      <img src={item.image} alt={item.title} className="w-16 h-16 object-contain mb-2" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 text-center">
                      {item.title}
                    </h2>
                    <p className="text-sm text-gray-600 group-hover:text-gray-800 text-center">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
