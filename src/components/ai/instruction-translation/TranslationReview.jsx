import { useState } from "react";
import GprtTranslationTemplate from "./templates/gprt/GprtTranslationTemplate";
import { AlertCircle, FileCheck, Download, Save, BookPlus, Info, Maximize2, Minimize2, Globe, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const TranslationReview = ({ team, mode = "final", production, setProduction, onNext, sourceLang, targetLangs = [] }) => {
    const allLangs = [sourceLang, ...targetLangs];

    const initialLang = targetLangs[0]?.value || sourceLang?.value || "english";
    const [currentViewLang, setCurrentViewLang] = useState(initialLang);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleExportPdf = async () => {
        const element = document.getElementById('printable-content');
        if (!element) return;

        setIsExporting(true);
        try {
            // Give a tiny timeout for any pending renders
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                // windowWidth: element.scrollWidth, // Removed
                // windowHeight: element.scrollHeight, // Removed
                // // Ensure we capture everything even if scrolled
                // scrollX: 0, // Removed
                // scrollY: -window.scrollY // Removed
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const margin = 10;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const innerWidth = pageWidth - (margin * 2);
            const innerHeight = pageHeight - (margin * 2);

            const imgProps = pdf.getImageProperties(imgData);
            const ratio = Math.min(innerWidth / imgProps.width, innerHeight / imgProps.height);

            const finalWidth = imgProps.width * ratio;
            const finalHeight = imgProps.height * ratio;

            const xOffset = margin + (innerWidth - finalWidth) / 2;
            const yOffset = margin + (innerHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);

            pdf.save(`Order_${production?.documentId || 'Instruction'}_${currentViewLang.toUpperCase()}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            // alert("Failed to export PDF. Please ensure all images are loaded and try again."); // Removed
        } finally {
            setIsExporting(false);
        }
    };

    const containerClasses = isExpanded
        ? "fixed inset-0 z-50 bg-slate-50 flex flex-col"
        : "h-full w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative flex flex-col";

    return (
        <div className={containerClasses}>
            {/* Multi-Language Switcher for Final Result */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Globe size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Document Preview</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Multi-Language Synthesis</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {allLangs.map((lang) => (
                        <button
                            key={lang.value}
                            onClick={() => setCurrentViewLang(lang.value)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${currentViewLang === lang.value
                                ? "bg-white text-blue-600 shadow-sm scale-105"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                        >
                            {lang.label?.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleExpand}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title={isExpanded ? "Collapse View" : "Expand View"}
                    >
                        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {team === "GPRT0007C" ? (
                <div className="flex-1 overflow-hidden bg-white relative flex flex-col">
                    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-0">
                        <GprtTranslationTemplate
                            editable={false}
                            step="complete"
                            currentLanguage={currentViewLang}
                            production={production}
                            setProduction={setProduction}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <p>Select a supported team to view the final result.</p>
                </div>
            )}

            {team === "GPRT0007C" && (
                <div className="p-5 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isExporting ? 'bg-blue-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {isExporting ? "Generating PDF..." : `${currentViewLang} version • Ready for Export`}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-lg shadow-blue-200 group"
                        >
                            {isExporting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                            )}
                            {isExporting ? "Exporting..." : `Download ${currentViewLang.toUpperCase()} PDF`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranslationReview;