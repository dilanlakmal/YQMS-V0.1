import { useState, useEffect } from "react";
import { useTranslate } from "@/hooks/useTranslate";
import { motion } from "framer-motion";
import {
    ChevronsRight,
    Sparkles,
    ChevronsLeft,
    CheckCircle2,
    X,
    BookOpen
} from "lucide-react";

/**
 * Sidebar Navigation Component
 * Displays the list of steps and allows documentation toggle.
 * 
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Whether the sidebar is collapsed
 * @param {Function} props.setIsCollapsed - Function to toggle collapse state
 * @param {Array} props.steps - List of step objects
 * @param {number} props.currentStep - Current active step ID
 * @param {boolean} props.showDoc - Whether the documentation view is active
 * @param {Function} props.setShowDoc - Function to toggle documentation view
 */
const Sidebar = ({ isCollapsed, setIsCollapsed, steps, currentStep, showDoc, setShowDoc }) => {
    const { translateBatch, userLang } = useTranslate();
    const [uiText, setUiText] = useState({
        viewDoc: "View Documentation",
        closeDoc: "Close Documentation"
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
        <aside className={`${isCollapsed ? "w-20 px-2" : "w-80"} bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm relative h-full max-h-screen overflow-hidden transition-all duration-300`}>
            <div className={`pt-8 pb-6 flex flex-col ${isCollapsed ? "items-center px-2" : "px-6"} flex-shrink-0 transition-all duration-300`}>
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} w-full mb-6`}>
                    {isCollapsed ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCollapsed(false)}
                            className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-blue-500/20 group overflow-hidden"
                            title="Expand Sidebar"
                        >
                            <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
                            <span className="text-xl font-black text-white tracking-tighter">Y</span>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </motion.button>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 group">
                                <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-violet-600 rounded-lg shadow-md shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <Sparkles size={20} className="text-white animate-pulse" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-black tracking-tighter leading-none bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        YAI
                                    </h1>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1 opacity-80">
                                        Intelligence
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                                title="Collapse Sidebar"
                            >
                                <ChevronsLeft size={20} />
                            </button>
                        </>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="px-1">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;

                    return (
                        <div
                            key={step.id}
                            className={`relative flex items-center ${isCollapsed ? "justify-center p-2" : "p-3"} rounded-xl transition-all duration-300 ${isActive
                                ? "bg-blue-50 border border-blue-100 shadow-sm"
                                : "hover:bg-slate-50"
                                }`}
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full ${isCollapsed ? "" : "mr-4"
                                    } border transition-colors ${isActive
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                                        : isCompleted
                                            ? "bg-emerald-100 border-emerald-200 text-emerald-600"
                                            : "bg-white border-slate-200 text-slate-400"
                                    }`}
                            >
                                {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1">
                                    <h3
                                        className={`text-sm font-semibold ${isActive
                                            ? "text-blue-900"
                                            : isCompleted
                                                ? "text-slate-700"
                                                : "text-slate-500"
                                            }`}
                                    >
                                        {step.title}
                                    </h3>
                                    <p
                                        className={`text-xs ${isActive ? "text-blue-600" : "text-slate-400"
                                            }`}
                                    >
                                        {step.description}
                                    </p>
                                </div>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="activeStepIndicator"
                                    className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-100 flex-shrink-0 sticky bottom-0 bg-white z-[30] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setShowDoc(!showDoc)}
                    className={`flex items-center justify-center w-full gap-2 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors ${isCollapsed ? "px-0" : "px-4"
                        }`}
                    title={
                        isCollapsed
                            ? showDoc
                                ? uiText.closeDoc
                                : uiText.viewDoc
                            : ""
                    }
                >
                    {showDoc ? <X size={16} /> : <BookOpen size={16} />}
                    {!isCollapsed &&
                        (showDoc ? uiText.closeDoc : uiText.viewDoc)}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
