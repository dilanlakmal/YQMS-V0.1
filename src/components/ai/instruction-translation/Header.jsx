import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslate } from "@/hooks/useTranslate";
import { motion } from "framer-motion";
import { Home, ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Top Header Navigation Component
 * Displays current step info, title, and navigation buttons.
 */
const Header = ({ currentStep, steps, onPrev, onNext }) => {
    const navigate = useNavigate();
    const currentStepInfo = steps[currentStep - 1] || {};
    const { translateBatch, userLang } = useTranslate();

    const [uiText, setUiText] = useState({
        backHome: "Back to Home",
        step: "STEP",
        appTitle: "Instruction Translation",
        prev: "PREVIOUS",
        next: "NEXT"
    });

    useEffect(() => {
        const translateContent = async () => {
            const values = Object.values(uiText);
            const translated = await translateBatch(values);
            const newUiText = {};
            Object.keys(uiText).forEach((key, i) => {
                newUiText[key] = translated[i];
            });
            setUiText(prev => ({ ...prev, ...newUiText }));
        };

        if (userLang && userLang !== 'en') {
            translateContent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLang]);

    return (
        <header className="h-14 sm:h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center z-10 sticky top-0 shadow-sm shadow-slate-100 px-3 sm:px-8">
            <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
                {/* Left Side: Home & Current Step */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/")}
                        className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm flex-shrink-0"
                        title={uiText.backHome}
                    >
                        <Home size={18} />
                    </motion.button>

                    <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-4 h-8 min-w-0">
                        <div className="flex items-center bg-blue-50/50 rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold text-blue-700 border border-blue-100 flex-shrink-0">
                            <span className="hidden xs:inline mr-1">{uiText.step}</span> {currentStep} <span className="mx-1 opacity-40">/</span> {steps.length}
                        </div>
                        <span className="text-slate-900 font-bold tracking-tight truncate text-sm sm:text-base hidden xs:block">
                            {currentStepInfo.title}
                        </span>
                    </div>
                </div>

                {/* Centered Title (Desktop Only) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:flex items-center pointer-events-none">
                    <span className="text-xl font-black tracking-tighter text-slate-900">YAI</span>
                    <div className="w-px h-4 bg-slate-300 mx-4"></div>
                    <h1 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                        {uiText.appTitle}
                    </h1>
                </div>

                {/* Right Side: Navigation */}
                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <motion.button
                        whileHover={currentStep > 1 ? { x: -2, backgroundColor: "rgba(241, 245, 249, 1)" } : {}}
                        whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
                        onClick={onPrev}
                        disabled={currentStep === 1}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 h-9 sm:h-10 text-[11px] font-bold rounded-xl transition-all border ${currentStep === 1
                            ? "text-slate-200 border-slate-100 cursor-not-allowed opacity-50"
                            : "text-slate-600 border-slate-200 bg-white shadow-sm hover:border-slate-300"
                            }`}
                    >
                        <ArrowLeft size={14} className={currentStep === 1 ? "opacity-30" : "text-blue-500"} />
                        <span className="hidden md:inline">{uiText.prev}</span>
                    </motion.button>

                    <motion.button
                        whileHover={currentStep < steps.length ? { x: 2, scale: 1.02, boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.2)" } : {}}
                        whileTap={currentStep < steps.length ? { scale: 0.98 } : {}}
                        onClick={onNext}
                        disabled={currentStep === steps.length}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-5 h-9 sm:h-10 text-[11px] font-bold rounded-xl transition-all ${currentStep === steps.length
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border-t border-white/20"
                            }`}
                    >
                        <span className="hidden md:inline">{uiText.next}</span>
                        <ArrowRight size={14} className={currentStep === steps.length ? "opacity-30" : "text-blue-200"} />
                    </motion.button>
                </div>
            </div>
        </header>
    );
};

export default Header;
