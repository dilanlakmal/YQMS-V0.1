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
      const response = await axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`);
      // console.log("User roles fetched:", response.data.roles); // Debugging log
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const fetchRoleManagement = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/role-management`);
      // console.log("Role management fetched:", response.data); // Debugging log
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
      setErrorMessage(t('Unauthorized Access'));
      setTimeout(() => {
        setErrorMessage('');
      }, 1000);
    }
  };

  if (loading || pageLoading) {
    return <div>Loading...</div>;
  }

  const cards = [
    {
      title: t("home.cutting/scc"),
      items: [
        {
          path: "/cutting",
          roles: ["Admin", "QC1"],
          image: "/IMG/cutting.webp",
          title: t("home.cutting"),
          description: "Begin a new Cutting Inspection Reports here."
        },
        {
          path: "/scc",
          roles: ["Admin", "QC2"],
          image: "/IMG/bundle.avif",
          title: t("SCC"),
          description: "Begin a new SCC Inspection Report here."
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
          description: "Click here to register orders for QC2 Inspection."
        },
        {
          path: "/washing",
          roles: ["Admin", "Washing"],
          image: "/IMG/washing.jpg",
          title: t("home.washing"),
          description: "Click here to register orders for Washing."
        },
        {
          path: "/opa",
          roles: ["Admin", "OPA"],
          image: "/IMG/dyeing.png",
          title: t("home.opa"),
          description: "Click here to scan orders in OPA."
        },
        {
          path: "/ironing",
          roles: ["Admin", "Ironing"],
          image: "/IMG/ironing.png",
          title: t("home.ironing"),
          description: "Click here to register orders for Ironing."
        },
        {
          path: "/packing",
          roles: ["Admin", "Packing"],
          image: "/IMG/packing.webp",
          title: t("home.packing"),
          description: "Click here to register orders for Packing."
        }
      ]
    },
    {
      title:  t("home.quality_inspection"),
      items: [
        {
          path: "/details",
          roles: ["Admin", "QC1"],
          image: "/IMG/qcc.png",
          title:  t("home.qc1_inspection"),
          description: "Begin a new QC1 Endline Inspection here."
        },
        {
          path: "/qc2-inspection",
          roles: ["Admin", "QC2"],
          image: "/IMG/qc2.png",
          title:  t("home.qc2_inspection"),
          description: "Begin a new QC2 Inspection Report here."
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
          description: "Start a QA Audit Report here."
        }
      ]
    },
    {
      title:  t("home.data_analytics"),
      items: [
        {
          path: "/download-data",
          roles: ["Admin", "Data Analytics"],
          image: "/IMG/download.jpg",
          title:  t("home.download_data"),
          description: "Click here to Download Data."
        },
        {
          path: "/live-dashboard",
          roles: ["Admin", "Data Analytics"],
          image: "/IMG/dash.png",
          title:  t("home.live_dashboard"),
          description: "Click here to see Live Dashboard."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-md">
          {t("home.welcome")}
        </h3>
        <p className="text-lg text-gray-700 text-left mb-12 text-center">
        {t("home.click_cards")}
        </p>
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {cards.map((section, index) => (
            <div key={index} className="space-y-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
                {section.title}
              </h2>
              {section.items.map((item, idx) => (
                hasAccess(item.roles) && (
                  <div
                    key={idx}
                    onClick={() => handleNavigation(item.path, item.roles)}
                    className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
                  >
                    <div className="flex flex-col items-center justify-center mb-6 w-12 h-12 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }}></div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                      {item.title}
                    </h2>
                    <p className="text-sm text-gray-600 group-hover:text-gray-800">
                      {item.description}
                    </p>
                  </div>
                )
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
