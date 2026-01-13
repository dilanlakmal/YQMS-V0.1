import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    FileText,
    Globe,
    Award,
    CheckSquare,
    Save,
    Users,
    X,
    Languages,
    ArrowRightLeft,
    Sparkles,
    BrainCircuit,
    Loader2
} from "lucide-react";
import Document from "../components/ai/instruction/translation/Document";
import SelectTeam from "../components/ai/instruction/translation/SelectTeam";
import InsertPdf from "../components/ai/instruction/translation/InsertPdf";
import SelectLanguage from "../components/ai/instruction/translation/SelectLanguage";
import Result from "../components/ai/instruction/translation/Result";
import { teams } from "../constants/teams";

const InstructionTranslation = () => {
    const [showDoc, setShowDoc] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [files, setFiles] = useState([]);
    const [preview, setPreview] = useState("");
    const [production, setProduction] = useState({});
    const [glossaryFile, setGlossaryFile] = useState(null);
    const [glossaryCount, setGlossaryCount] = useState(0);
    const [isTranslating, setIsTranslating] = useState(false);

    const [sourceLang, setSourceLang] = useState({ value: "english", label: "English" });
    const [targetLang, setTargetLang] = useState({ value: "chinese", label: "Chinese (Simplified)" });

    const steps = useMemo(() => [
        { id: 1, title: 'Select Team', description: 'Choose your department', icon: Users },
        { id: 2, title: 'Insert PDF', description: 'Upload instruction file', icon: FileText },
        { id: 3, title: 'Configure', description: 'Language & Glossary', icon: Globe },
        { id: 4, title: 'Review', description: 'Edit & Update Glossary', icon: CheckSquare },
        { id: 5, title: 'Finalize', description: 'Export PDF', icon: Award },
    ], []);

    const activeSteps = steps;

    const handleNext = () => {
        if (currentStep === 3) {
            // Trigger translation animation
            setIsTranslating(true);
            setTimeout(() => {
                setIsTranslating(false);
                setCurrentStep(prev => prev + 1);
            }, 3500); // Duration for high-end animation feel
        } else if (currentStep < activeSteps.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
            {/* Sidebar Navigation */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm relative">
                <div className="p-8 pb-4 relative overflow-hidden group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                                Instruction Translation
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Translation Engine</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {activeSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <div
                                key={step.id}
                                className={`relative flex items-center p-3 rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-blue-50 border border-blue-100 shadow-sm"
                                    : "hover:bg-slate-50"
                                    }`}
                            >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 border transition-colors ${isActive
                                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                                    : isCompleted
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-600"
                                        : "bg-white border-slate-200 text-slate-400"
                                    }`}>
                                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-semibold ${isActive ? "text-blue-900" : isCompleted ? "text-slate-700" : "text-slate-500"}`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-xs ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                                        {step.description}
                                    </p>
                                </div>
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

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowDoc(!showDoc)}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                        {showDoc ? <X size={16} /> : <BookOpen size={16} />}
                        {showDoc ? "Close Documentation" : "View Documentation"}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
                {/* Top Header / Progress for Mobile or just general info */}
                <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium text-slate-900">Step {currentStep}</span>
                        <span>/</span>
                        <span>{activeSteps.length}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span>{activeSteps[currentStep - 1]?.title}</span>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentStep === 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-700 hover:bg-white hover:shadow-sm"
                                }`}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentStep === activeSteps.length}
                            className={`flex items-center gap-1 px-5 py-2 text-sm font-medium rounded-lg shadow-sm shadow-blue-200 transition-all ${currentStep === activeSteps.length
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300"
                                }`}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {showDoc ? (
                            <motion.div
                                key="documentation"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute inset-0 bg-white z-30 overflow-auto p-8"
                            >
                                <div className="max-w-4xl mx-auto">
                                    <Document />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="h-full w-full overflow-y-auto p-6 md:p-10"
                            >
                                <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px] p-8">
                                    {currentStep === 1 && (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <h2 className="text-2xl font-bold text-slate-900">Select Your Team</h2>
                                                <p className="text-slate-500 mt-2">Choose the department for this instruction to proceed.</p>
                                            </div>
                                            <div className="mt-8">
                                                <SelectTeam
                                                    teams={teams}
                                                    setSelectedTeam={setSelectedTeam}
                                                    currentStep={currentStep}
                                                    setCurrentStep={setCurrentStep}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="h-full flex flex-col">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-slate-900">Upload Instruction</h2>
                                                <p className="text-slate-500">Attach the PDF file you wish to translate.</p>
                                            </div>
                                            <InsertPdf
                                                production={production}
                                                setProduction={setProduction}
                                                team={selectedTeam}
                                                files={files}
                                                setFiles={setFiles}
                                                preview={preview}
                                                setPreview={setPreview}
                                                currentStep={currentStep}
                                                setCurrentStep={setCurrentStep}
                                            />
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-slate-900">Translation Configuration</h2>
                                                <p className="text-slate-500">Select language and upload glossary for accurate translation.</p>
                                            </div>
                                            <SelectLanguage
                                                glossaryFile={glossaryFile}
                                                setGlossaryFile={setGlossaryFile}
                                                production={production}
                                                onNext={handleNext}
                                                sourceLang={sourceLang}
                                                setSourceLang={setSourceLang}
                                                targetLang={targetLang}
                                                setTargetLang={setTargetLang}
                                            />
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="h-full">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-slate-900">Review & Refine</h2>
                                                <p className="text-slate-500">Edit translations and allow the AI to learn from your changes.</p>
                                            </div>
                                            <Result
                                                team={selectedTeam}
                                                mode="review"
                                                glossaryCount={glossaryCount}
                                                setGlossaryCount={setGlossaryCount}
                                                production={production}
                                                setProduction={setProduction}
                                                onNext={handleNext}
                                                sourceLang={sourceLang}
                                                targetLang={targetLang}
                                            />
                                        </div>
                                    )}

                                    {currentStep === 5 && (
                                        <div className="h-full">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-slate-900">Finalize & Export</h2>
                                                <p className="text-slate-500">Download your finalized instruction document.</p>
                                            </div>
                                            <Result
                                                team={selectedTeam}
                                                mode="final"
                                                glossaryCount={glossaryCount}
                                                production={production}
                                                setProduction={setProduction}
                                                sourceLang={sourceLang}
                                                targetLang={targetLang}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Global Translation Overlay */}
                    <AnimatePresence>
                        {isTranslating && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 overflow-hidden"
                            >
                                {/* Background Decorative Elements */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <div className="ai-neural-glow top-1/4 left-1/4 opacity-30"></div>
                                    <div className="ai-neural-glow bottom-1/4 right-1/4 opacity-30"></div>

                                    {/* Floating Translation Particles (Letters/Symbols) */}
                                    {['A', 'あ', '中', 'Σ', 'Ω', '文', 'En', '한', 'ก'].map((char, i) => (
                                        <div
                                            key={i}
                                            className="translation-letter text-2xl"
                                            style={{
                                                left: `${10 + Math.random() * 80}%`,
                                                top: `${20 + Math.random() * 60}%`,
                                                animationDelay: `${i * 0.4}s`,
                                                opacity: 0.4
                                            }}
                                        >
                                            {char}
                                        </div>
                                    ))}
                                </div>

                                <div className="relative flex flex-col items-center">
                                    <div className="relative w-32 h-32 mb-8">
                                        {/* Spinning World Icon */}
                                        <div className="absolute inset-0 globe-spinning text-blue-500/20">
                                            <Globe size={128} strokeWidth={0.5} />
                                        </div>
                                        {/* Main Sparkle Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="p-6 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/40 relative z-10 animate-pulse">
                                                <Languages size={48} className="text-white" />
                                            </div>
                                        </div>
                                        {/* Orbiting particles */}
                                        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400"></div>
                                        </div>
                                    </div>

                                    <div className="text-center space-y-4">
                                        <h2 className="text-3xl font-bold text-white tracking-tight">
                                            Translating Content
                                        </h2>
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="px-3 py-1 bg-white/10 rounded-full text-blue-300 text-sm font-medium border border-white/10 uppercase tracking-widest">{sourceLang.label}</span>
                                            <ArrowRightLeft size={16} className="text-slate-500" />
                                            <span className="px-3 py-1 bg-blue-600/20 rounded-full text-blue-400 text-sm font-medium border border-blue-500/20 uppercase tracking-widest">{targetLang.label}</span>
                                        </div>

                                        <div className="w-64 h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden mx-auto">
                                            <motion.div
                                                className="h-full bg-blue-500"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 3.5, ease: "easeInOut" }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm italic mt-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Applying DeepMind Neural Translation...</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Context hints floating around */}
                                <div className="mt-16 flex gap-8">
                                    <div className="glass-morphism px-4 py-2 rounded-lg flex items-center gap-2 animate-bounce" style={{ animationDelay: '0s' }}>
                                        <Sparkles size={14} className="text-blue-500" />
                                        <span className="text-xs font-semibold text-slate-700">Glossary Applied</span>
                                    </div>
                                    <div className="glass-morphism px-4 py-2 rounded-lg flex items-center gap-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
                                        <BrainCircuit size={14} className="text-indigo-500" />
                                        <span className="text-xs font-semibold text-slate-700">Context Aware</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

export default InstructionTranslation;