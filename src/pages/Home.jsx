import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-6">
      <div className="max-w-8xl mx-auto">
        <h3 className="text-3xl font-extrabold text-blue-900 mb-12 text-left drop-shadow-md">
          Welcome to Quality Data Management System
        </h3>

        <p className="text-lg text-gray-700 text-left mb-12">
          Click on the cards below to start inspection Reports.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* QC Inspection Card */}
          <div
            onClick={() => navigate("/details")}
            className="group bg-white p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105"
          >
            <div className="flex items-center justify-center mb-6 bg-blue-100 w-16 h-16 rounded-full group-hover:bg-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-blue-600 group-hover:text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-2 8.5h4v1H10v-1zm5.5-3l2.5 2.5"
                />
              </svg>
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
            <div className="flex items-center justify-center mb-6 bg-green-100 w-16 h-16 rounded-full group-hover:bg-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-green-600 group-hover:text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-3 4h6v1H9V6zm0 2h6v5H9V8zm0 6h6v1H9v-1z"
                />
              </svg>
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
