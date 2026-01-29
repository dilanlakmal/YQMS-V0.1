import { useState } from "react";
import GprtFirstPage from "./GprtFirstPage";
import { FileText, AlertCircle, SidebarClose, SidebarOpen } from "lucide-react";
import { html } from "./GprtFirstPage";

function GprtTranslationTemplate({ editable, step, instruction, setinstruction, currentLanguage, ...props }) {
  const [activePage, setActivePage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const totalPages = 19;

  // Handle legacy prop names
  const data = instruction || props.production;
  const setData = setinstruction || props.setProduction;

  logger.log("Rendering GprtTranslationTemplate with step:", step);
  if (step === "Preview") {
    const renderedHtml = html(<GprtFirstPage
      instruction={data}
      setinstruction={setData}
      editable={editable}
      step={step}
      currentLanguage={currentLanguage}
    />);
    logger.log("Preview HTML generated:", renderedHtml.substring(0, 100) + "...");
  }

  return (
    <div className="flex h-full w-full bg-slate-100 relative">
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 z-40 p-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-slate-500 hover:text-blue-600 transition-all ${isSidebarOpen ? "left-[14.5rem]" : "left-4"}`}
        title={isSidebarOpen ? "Close Page Menu" : "Open Page Menu"}
      >
        {isSidebarOpen ? <SidebarClose size={16} /> : <SidebarOpen size={16} />}
      </button>

      {/* Sidebar for Pages */}
      <div
        className={`bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0 transition-all duration-300 ease-in-out z-30 ${isSidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full border-none"}`}
        style={{ visibility: isSidebarOpen ? 'visible' : 'hidden' }}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pages</h3>
        </div>
        <div className="p-2 space-y-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activePage === page
                ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
            >
              <span className="flex items-center gap-3">
                <FileText size={16} className={activePage === page ? "text-blue-500" : "text-slate-400"} />
                Page {page}
              </span>
              {page !== 1 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">V2</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto bg-slate-50/50 relative transition-all duration-300 ${step === 'complete' || step === 'final' ? 'p-0' : 'p-6 md:p-8 pt-12'}`}>
        <div className="w-full mx-auto" id="printable-content">
          {activePage === 1 ? (
            <GprtFirstPage
              instruction={data}
              setinstruction={setData}
              editable={editable}
              step={step}
              currentLanguage={currentLanguage}
            />
          ) : (
            <div className="relative overflow-hidden w-full min-h-[600px] bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-2xl border border-white/10">
              {/* Premium Background Elements */}
              <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              </div>

              <div className="relative z-10 space-y-8 max-w-md">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-xl border border-white/20">
                    <AlertCircle size={48} className="text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-extrabold text-white tracking-tight">
                    Page <span className="text-blue-400">{activePage}</span> Unavailable
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    This page layout is currently being mapped by our architectural team.
                    Structure analysis for <span className="text-slate-200 font-semibold">GPRT-V19</span> is in progress.
                  </p>
                </div>

                <div className="pt-4 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Awaiting Version 2.0</span>
                  </div>

                  <button
                    onClick={() => setActivePage(1)}
                    className="text-sm font-semibold text-slate-500 hover:text-white transition-colors underline decoration-blue-500/30 underline-offset-8"
                  >
                    Return to Page 1
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GprtTranslationTemplate;
