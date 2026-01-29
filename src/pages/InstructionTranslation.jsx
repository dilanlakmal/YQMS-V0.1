import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Circle,
    FileText,
    Globe,
    Award,
    Users,
    Loader2
} from "lucide-react";

import Guide from "../components/ai/instruction-translation/Guide";
import TeamSelection from "../components/ai/instruction-translation/TeamSelection";
import DocumentUpload from "../components/ai/instruction-translation/DocumentUpload";
import LanguageConfig from "../components/ai/instruction-translation/LanguageConfig";
import TranslationReview from "../components/ai/instruction-translation/TranslationReview";
import Sidebar from "../components/ai/instruction-translation/Sidebar";
import Header from "../components/ai/instruction-translation/Header";
import TranslationOverlay from "../components/ai/instruction-translation/TranslationOverlay";
import processTranslate from "../components/ai/instruction-translation/api/translation";
import { getProduction } from "../components/ai/instruction-translation/api/extraction";
import { customer, progress, document } from "@/services/instructionService";
import { useAuth } from "@/components/authentication/AuthContext";

const InstructionTranslation = () => {
    const [steps, setSteps] = useState(null);
    const [teams, setTeams] = useState(null);
    const [showDoc, setShowDoc] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [files, setFiles] = useState([]);
    const [preview, setPreview] = useState("");
    const [instruction, setinstruction] = useState({});
    const [glossaryFile, setGlossaryFile] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [glossaryCount, setGlossaryCount] = useState(0);
    const [isTranslating, setIsTranslating] = useState(false);
    const { user } = useAuth();

    const [sourceLang, setSourceLang] = useState({ value: "english", label: "English" });
    const [targetLangs, setTargetLangs] = useState([
        { value: "khmer", label: "Khmer" },
        { value: "english", label: "English" }
    ]);

    const iconMapping = {
        "Users": Users,
        "FileText": FileText,
        "Globe": Globe,
        "Award": Award
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                let userLanguage = user?.language || localStorage.getItem("preferredLanguage") || "en";
                if (userLanguage === "kh") userLanguage = "km";
                if (userLanguage === "ch") userLanguage = "zh-Hans";

                const data = await progress.getProgress(userLanguage);
                const customerData = await customer.getCustomer();
                setTeams(customerData);
                // Map the API response to the format expected by the UI
                const formattedSteps = data.map(step => ({
                    ...step,
                    // Use 'order' as the ID for internal UI logic (1, 2, 3...)
                    id: step.order,
                    // Keep the original ID just in case
                    originalId: step.id,
                    // Map the string icon name to the actual component
                    icon: iconMapping[step.icon] || Circle
                })).sort((a, b) => a.order - b.order);

                setSteps(formattedSteps);
                const activeStep = data.find(step => step.status === "active");
                if (activeStep) {
                    setCurrentStep(activeStep.order);
                }

                // Restore active document and instruction data
                const docsResponse = await document.getDocsByUser();
                const userDocs = docsResponse?.documents || [];
                const activeDoc = userDocs.find(d => d.active);

                if (userDocs.length > 0) {
                    setFiles(userDocs);
                }

                if (activeDoc) {
                    // Fetch extraction data
                    try {
                        const instructionData = await getProduction(activeDoc._id);
                        setinstruction(instructionData);
                        // If the instruction data has customer info, restore selectedTeam
                        if (instructionData?.customer?.customer_info?.name) {
                            setSelectedTeam(instructionData.customer.customer_info.name);
                        } else if (instructionData?.customer) {
                            // Fallback for different response structures
                            setSelectedTeam(instructionData.customer);
                        }
                        setPreview("Preview");
                    } catch (err) {
                        logger.error("Failed to restore instruction data:", err);
                    }
                }
            } catch (error) {
                logger.error("Failed to fetch page data:", error);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeSteps = steps;

    const handleNext = async () => {
        if (currentStep === 3) {
            // Trigger translation animation
            setIsTranslating(true);
            try {
                const targetValues = targetLangs.map(l => l.value);
                targetValues.push(sourceLang.value);
                logger.log("targetValues", targetValues);
                // Ensure documentId exists before calling API
                if (!instruction?.documentId) {
                    logger.error("Missing documentId for translation");
                    setIsTranslating(false);
                    return;
                }
                const translatedData = await processTranslate(instruction.documentId, targetValues);
                setinstruction(prev => ({ ...prev, ...translatedData }));
                setTimeout(async () => {
                    setIsTranslating(false);
                    setCurrentStep(prev => prev + 1);
                    // Update progress to Step 4
                    await progress.updateStatus(steps[3].originalId);
                }, 3500);
            } catch (error) {
                logger.error("Translation failed:", error);
                setIsTranslating(false);
                // Optionally add a toast/alert here
            }
        } else if (currentStep < activeSteps.length) {
            const nextStepOrder = currentStep + 1;
            const nextStepIndex = nextStepOrder - 1;
            setCurrentStep(nextStepOrder);

            if (steps[nextStepIndex]) {
                await progress.updateStatus(steps[nextStepIndex].originalId);
            }
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    if (!steps) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-[#f8fafc] overflow-hidden font-sans text-slate-800">
            {/* Sidebar Navigation */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                steps={activeSteps}
                currentStep={currentStep}
                showDoc={showDoc}
                setShowDoc={setShowDoc}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">

                <Header
                    currentStep={currentStep}
                    steps={activeSteps}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />

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
                                    <Guide />
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
                                                <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep - 1].instruct_title}</h2>
                                                <p className="text-slate-500 mt-2">{steps[currentStep].instruct_description}</p>
                                            </div>
                                            <div className="mt-8">
                                                <TeamSelection
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
                                                <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep - 1].instruct_title}</h2>
                                                <p className="text-slate-500">{steps[currentStep].instruct_description}</p>
                                            </div>
                                            <DocumentUpload
                                                instruction={instruction}
                                                setinstruction={setinstruction}
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
                                                <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep - 1].instruct_title}</h2>
                                                <p className="text-slate-500">{steps[currentStep].instruct_description}</p>
                                            </div>
                                            <LanguageConfig
                                                glossaryFile={glossaryFile}
                                                setGlossaryFile={setGlossaryFile}
                                                instruction={instruction}
                                                onNext={handleNext}
                                                sourceLang={sourceLang}
                                                setSourceLang={setSourceLang}
                                                targetLangs={targetLangs}
                                                setTargetLangs={setTargetLangs}
                                            />
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="h-full">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-slate-900">{steps[currentStep - 1].instruct_title}</h2>
                                                <p className="text-slate-500">{steps[currentStep - 1].instruct_description}</p>
                                            </div>
                                            <TranslationReview
                                                team={selectedTeam}
                                                mode="final"
                                                instruction={instruction}
                                                setinstruction={setinstruction}
                                                sourceLang={sourceLang}
                                                targetLangs={targetLangs}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Global Translation Overlay */}
                    <TranslationOverlay
                        isTranslating={isTranslating}
                        sourceLang={sourceLang}
                        targetLangs={targetLangs}
                    />
                </div>
            </main >
        </div >
    );
}

export default InstructionTranslation;