import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../components/authentication//AuthContext';

function Home() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const hasRole = (requiredRole) => {
    return user && user.roles && user.roles.includes(requiredRole);
  };

  const handleNavigation = (path, requiredRole) => {
    if (hasRole(requiredRole)) {
      navigate(path);
    } else {
      setErrorMessage('Unauthorized Access');
      setTimeout(() => {
        setErrorMessage('');
        window.location.reload();
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-md">
          Welcome to Quality Data Management System
        </h3> 

        <p className="text-lg text-gray-700 text-left mb-12 text-center">
          Click on the cards below to start inspection Reports or Live
          monitoring
        </p>

        {errorMessage && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {errorMessage}
          </div>
        )}

        {/* Grid with 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Order Data */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
              Order Data
            </h2>

            {/* Bundle Registration Card */}
            <div
              onClick={() =>handleNavigation("/bundle-registration","admin")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/bundle.avif')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Bundle Registration
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Click here to register orders for QC2 Inspection.
              </p>
            </div>

            {/* Washing Card */}
            <div
              onClick={() => handleNavigation("/washing","admin")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
               <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/washing.jpg')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Washing
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Click here to register orders for Washing
              </p>
            </div>
            {/* Dyeing Card */}
            <div
              onClick={() => handleNavigation("/dyeing", "admin")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/dyeing.png')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Dyeing
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Click here to register orders for Dyeing
              </p>
            </div>
            {/* Ironing Card */}
            <div
              onClick={() => handleNavigation("/ironing", "admin")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/iorning.avif')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Ironing
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Click here to register orders for Ironing
              </p>
            </div>
          </div>

          {/* Column 2: Quality Inspection */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
              Quality Inspection
            </h2>
            {/* QC1 Inspection Card */}
            <div
              onClick={() => handleNavigation("/details", "qc1")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/qcc.png')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                QC1 Inspection
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Begin a new QC1 Endline Inspection here.
              </p>
            </div>

            {/* QC2 Inspection Card */}
            <div
              onClick={() => handleNavigation("/qc2-inspection", "qc2")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/qc2.png')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                QC2 Inspection
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Begin a new QC2 Inspection Report here.
              </p>
            </div>
          </div>

          {/* Column 3: QA Audit */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">QA Audit</h2>
            {/* QA Audit Card */}
            <div
              onClick={() => handleNavigation("/audit", "qa")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/qaa.png')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600">
                QA Audit
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Start a QA Audit Report here.
              </p>
            </div>
          </div>

          {/* Column 4: Data Analytics */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
              Data Analytics
            </h2>
            {/* Download Data Card */}
            <div
              onClick={() => handleNavigation("/dashboard" , "admin")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/download.jpg')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Download Data
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Click here to Download Data.
              </p>
            </div>
            {/* Live Dashboard Card */}
            <div
              onClick={() => handleNavigation("/dashboard", "admin")}
              className="group bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="flex flex-col items-center justify-center mb-6  w-12 h-12  bg-[url('/IMG/dash.png')] bg-cover bg-center">
              
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Live Dashboard
              </h2>
              <p className="text-sm text-gray-600 group-hover:text-gray-800">
                Click here to see Live Dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
