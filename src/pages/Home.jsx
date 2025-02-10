import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../components/authentication/AuthContext';

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!loading && user) {
      // User object is available here
    }
  }, [user, loading]);

  const hasRole = (requiredRoles) => {
    if (!user || !user.roles) {
      return false;
    }
    const allRoles = [...user.roles, ...(user.sub_roles || [])];
    return requiredRoles.some(role => allRoles.includes(role));
  };

  const handleNavigation = (path, requiredRoles) => {
    if (hasRole(requiredRoles)) {
      navigate(path);
    } else {
      setErrorMessage('Unauthorized Access');
      setTimeout(() => {
        setErrorMessage('');
      }, 1000);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const cards = [
    {
      title: "Order Data",
      items: [
        {
          path: "/bundle-registration",
          roles: ["admin_user"],
          image: "/IMG/bundle.avif",
          title: "Bundle Registration",
          description: "Click here to register orders for QC2 Inspection."
        },
        {
          path: "/washing",
          roles: ["admin_user"],
          image: "/IMG/washing.jpg",
          title: "Washing",
          description: "Click here to register orders for Washing."
        },
        {
          path: "/dyeing",
          roles: ["admin_user"],
          image: "/IMG/dyeing.png",
          title: "Dyeing",
          description: "Click here to register orders for Dyeing."
        },
        {
          path: "/ironing",
          roles: ["admin_user"],
          image: "/IMG/ironing.png",
          title: "Ironing",
          description: "Click here to register orders for Ironing."
        }
      ]
    },
    {
      title: "Quality Inspection",
      items: [
        {
          path: "/details",
          roles: ["admin_user", "qc1"],
          image: "/IMG/qcc.png",
          title: "QC1 Inspection",
          description: "Begin a new QC1 Endline Inspection here."
        },
        {
          path: "/qc2-inspection",
          roles: ["admin_user", "qc2"],
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
          roles: ["admin_user", "qa"],
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
          roles: ["admin_user"],
          image: "/IMG/download.jpg",
          title: "Download Data",
          description: "Click here to Download Data."
        },
        {
          path: "/dashboard",
          roles: ["admin_user"],
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
                hasRole(item.roles) && (
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
