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
        <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm shadow-slate-100">
            <div className="flex items-center gap-4 text-sm text-slate-500 flex-1">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/")}
                    className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                    title={uiText.backHome}
                >
                    <Home size={18} />
                </motion.button>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-4 h-8">
                    <div className="flex items-center bg-slate-100 rounded-full px-3 py-1 text-[11px] font-bold text-slate-600 border border-slate-200">
                        {uiText.step} {currentStep} <span className="mx-1 opacity-40">/</span> {steps.length}
                    </div>
                    <span className="text-slate-900 font-semibold tracking-tight ml-2">{currentStepInfo.title}</span>
                </div>
            </div>

            {/* Centered Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block">
                <div className="flex items-center">
                    <span className="text-xl font-black tracking-tighter text-slate-900">YAI</span>
                    <div className="w-px h-4 bg-slate-300 mx-4"></div>
                    <h1 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                        {uiText.appTitle}
                    </h1>
                </div>
            </div>

            <div className="flex-1 flex justify-end items-center gap-3">
                <motion.button
                    whileHover={currentStep > 1 ? { x: -4, backgroundColor: "rgba(241, 245, 249, 1)" } : {}}
                    whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
                    onClick={onPrev}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border ${currentStep === 1
                        ? "text-slate-200 border-slate-100 cursor-not-allowed opacity-50"
                        : "text-slate-600 border-slate-200 bg-white shadow-sm hover:border-slate-300"
                        }`}
                >
                    <ArrowLeft size={14} className={currentStep === 1 ? "opacity-30" : "text-blue-500"} />
                    {uiText.prev}
                </motion.button>

                <motion.button
                    whileHover={currentStep < steps.length ? { x: 4, scale: 1.02, boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.2)" } : {}}
                    whileTap={currentStep < steps.length ? { scale: 0.98 } : {}}
                    onClick={onNext}
                    disabled={currentStep === steps.length}
                    className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${currentStep === steps.length
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border-t border-white/20"
                        }`}
                >
                    {uiText.next}
                    <ArrowRight size={14} className={currentStep === steps.length ? "opacity-30" : "text-blue-200"} />
                </motion.button>
            </div>
        </header>
    );
};

export default Header;
