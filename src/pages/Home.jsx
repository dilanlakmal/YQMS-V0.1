import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-md">
          Welcome to Quality Data Management System
        </h3> 

        <p className="text-lg text-gray-700 text-center mb-12">
          Click on the cards below to start inspection Reports.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* QC Dashboard */}
          <div
            onClick={() => navigate("/dashboard")}
            className="group bg-white p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
          >
            <div className="flex flex-col items-center justify-center mb-6  w-20 h-20  bg-[url('/IMG/dash.png')] bg-cover bg-center">
              
              </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-blue-600">
              QC Dashboard
            </h2>
            <p className="text-gray-600 group-hover:text-gray-800">
              Click here to see Live Dashboard.
            </p>
          </div>

          {/* QC Inspection Card */}
          <div
            onClick={() => navigate("/details")}
            className="group bg-white p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
          >
            <div className="flex flex-col items-center justify-center mb-6  w-20 h-20  bg-[url('/IMG/qcc.png')] bg-cover bg-center">
              
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-blue-600">
              QC Inspection
            </h2>
            <p className="text-gray-600 group-hover:text-gray-800">
              Begin a new QC Endline Inspection Reports here.
            </p>
          </div>

          {/* QA Audit Card */}
          <div
            onClick={() => navigate("/details-audit")}
            className="group bg-white p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
          >
             <div className="flex flex-col items-center justify-center mb-6  w-20 h-20  bg-[url('/IMG/qaa.png')] bg-cover bg-center">
              
              </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-green-600">
              QA Audit
            </h2>
            <p className="text-gray-600 group-hover:text-gray-800">
              Start a QA Audit Report here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
