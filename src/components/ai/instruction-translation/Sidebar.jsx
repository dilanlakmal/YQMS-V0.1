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
    return (
        <aside className={`${isCollapsed ? "w-20 px-2" : "w-80"} bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm relative h-full max-h-screen overflow-hidden transition-all duration-300`}>
            <div className={`py-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-6"} flex-shrink-0`}>
                {isCollapsed ? (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-200 hover:scale-110 transition-transform duration-300 text-white"
                        title="Expand Sidebar"
                    >
                        <ChevronsRight size={24} />
                    </button>
                ) : (
                    <>
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles size={24} className="text-white" />
                        </div>

                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Collapse Sidebar"
                        >
                            <ChevronsLeft size={20} />
                        </button>
                    </>
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
                                ? "Close Documentation"
                                : "View Documentation"
                            : ""
                    }
                >
                    {showDoc ? <X size={16} /> : <BookOpen size={16} />}
                    {!isCollapsed &&
                        (showDoc ? "Close Documentation" : "View Documentation")}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
