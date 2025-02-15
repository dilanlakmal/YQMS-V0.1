import axios from "axios";
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../components/authentication/AuthContext';
import { useTranslation } from 'react-i18next';

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [roleManagement, setRoleManagement] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      fetchUserRoles();
      fetchRoleManagement();
    }
  }, [user, loading]);

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/user-roles/${user.emp_id}`
      );
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const fetchRoleManagement = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/role-management"
      );
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

  if (loading) {
    // return <div>t(Loading...)</div>;
    return <div>Loading...</div>;
  }

  const cards = [
    {
      title: "Order Data",
      items: [
        {
          path: "/bundle-registration",
          roles: ["Admin", "Bundle Registration"],
          image: "/IMG/bundle.avif",
          title: t("bundle_registration"),
          description: "Click here to register orders for QC2 Inspection."
        },
        {
          path: "/washing",
          roles: ["Admin", "Washing"],
          image: "/IMG/washing.jpg",
          title: "Washing",
          description: "Click here to register orders for Washing."
        },
        {
          path: "/dyeing",
          roles: ["Admin", "Dyeing"],
          image: "/IMG/dyeing.png",
          title: "Dyeing",
          description: "Click here to register orders for Dyeing."
        },
        {
          path: "/ironing",
          roles: ["Admin", "Ironing"],
          image: "/IMG/ironing.png",
          title: "Ironing",
          description: "Click here to register orders for Ironing."
        },
        {
          path: "/packing",
          roles: ["Admin", "Packing"],
          image: "/IMG/ironing.png",
          title: "Packing",
          description: "Click here to register orders for Packing."
        }
      ]
    },
    {
      title: "Quality Inspection",
      items: [
        {
          path: "/details",
          roles: ["Admin", "QC1"],
          image: "/IMG/qcc.png",
          title: "QC1 Inspection",
          description: "Begin a new QC1 Endline Inspection here."
        },
        {
          path: "/qc2-inspection",
          roles: ["Admin", "QC2"],
          image: "/IMG/qc2.png",
          title: "QC2 Inspection",
          description: "Begin a new QC2 Inspection Report here."
        }
      ]
    },
    {
      title: "QA Audit",
      items: [
        {
          path: "/audit",
          roles: ["Admin", "QA"],
          image: "/IMG/qaa.png",
          title: "QA Audit",
          description: "Start a QA Audit Report here."
        }
      ]
    },
    {
      title: "Data Analytics",
      items: [
        {
          path: "/download-data",
          roles: ["Admin", "Data Analytics"],
          image: "/IMG/download.jpg",
          title: "Download Data",
          description: "Click here to Download Data."
        },
        {
          path: "/dashboard",
          roles: ["Admin", "Data Analytics"],
          image: "/IMG/dash.png",
          title: "Live Dashboard",
          description: "Click here to see Live Dashboard."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-md">
          Welcome to Quality Data Management System
        </h3>
        <p className="text-lg text-gray-700 text-left mb-12 text-center">
          Click on the cards below to start inspection Reports or Live monitoring
        </p>
        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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