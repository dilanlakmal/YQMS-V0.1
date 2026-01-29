import { useNavigate } from "react-router-dom";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Top Header Navigation Component
 * Displays current step info, title, and navigation buttons.
 * 
 * @param {Object} props
 * @param {number} props.currentStep - Current active step number
 * @param {Array} props.steps - List of step objects
 * @param {Function} props.onPrev - Handler for previous button
 * @param {Function} props.onNext - Handler for next button
 */
const Header = ({ currentStep, steps, onPrev, onNext }) => {
    const navigate = useNavigate();
    const currentStepInfo = steps[currentStep - 1] || {};

    return (
        <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-between px-8 z-10 sticky top-0">
            <div className="flex items-center gap-4 text-sm text-slate-500 flex-1">
                <button
                    onClick={() => navigate("/")}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                    title="Back to Home"
                >
                    <Home size={20} />
                </button>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <span className="font-medium text-slate-900">Step {currentStep}</span>
                    <span>/</span>
                    <span>{steps.length}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span>{currentStepInfo.title}</span>
                </div>
            </div>

            {/* Centered Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Instruction Translation
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200 uppercase tracking-wide">
                        Engine
                    </span>
                </div>
            </div>

            <div className="flex-1 flex justify-end">
                <button
                    onClick={onPrev}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentStep === 1
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-slate-700 hover:bg-white hover:shadow-sm"
                        }`}
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <button
                    onClick={onNext}
                    disabled={currentStep === steps.length}
                    className={`flex items-center gap-1 px-5 py-2 text-sm font-medium rounded-lg shadow-sm shadow-blue-200 transition-all ${currentStep === steps.length
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300"
                        }`}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </header>
    );
};

export default Header;
