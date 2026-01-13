import { useState } from "react";
import FirstPage from "./Page1";
import { Lock, FileText, AlertCircle, SidebarClose, SidebarOpen } from "lucide-react";

function GPRTTemplate({ editable, step, production, setProduction, currentLanguage }) {
  const [activePage, setActivePage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const totalPages = 19;

  return (
    <div className="flex h-full w-full bg-slate-100 relative">
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 z-10 p-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-slate-500 hover:text-blue-600 transition-all ${isSidebarOpen ? "left-[14.5rem]" : "left-4"}`}
        title={isSidebarOpen ? "Close Page Menu" : "Open Page Menu"}
      >
        {isSidebarOpen ? <SidebarClose size={16} /> : <SidebarOpen size={16} />}
      </button>

      {/* Sidebar for Pages */}
      <div
        className={`bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full border-none"}`}
        style={{ visibility: isSidebarOpen ? 'visible' : 'hidden' }}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pages</h3>
        </div>
        <div className="p-2 space-y-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => page === 1 && setActivePage(page)}
              disabled={page !== 1}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activePage === page
                ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm"
                : page === 1
                  ? "text-slate-700 hover:bg-slate-50"
                  : "text-slate-400 cursor-not-allowed opacity-60"
                }`}
            >
              <span className="flex items-center gap-3">
                <FileText size={16} className={activePage === page ? "text-blue-500" : "text-slate-400"} />
                Page {page}
              </span>
              {page !== 1 && <Lock size={14} className="text-slate-300" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8 pt-12 relative transition-all duration-300">
        <div className="max-w-5xl mx-auto">
          {activePage === 1 ? (
            <FirstPage
              production={production}
              setProduction={setProduction}
              editable={editable}
              step={step}
              currentLanguage={currentLanguage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-600">Page Unavailable</h3>
              <p className="text-sm">This page is not included in the current demo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GPRTTemplate;
