import { useState, useEffect, useRef } from "react";
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
import StepContent from "../components/ai/instruction-translation/StepContent";
import Sidebar from "../components/ai/instruction-translation/Sidebar";
import Header from "../components/ai/instruction-translation/Header";
import TranslationOverlay from "../components/ai/instruction-translation/TranslationOverlay";

import { customer, progress, document } from "@/services/instructionService";
import { useAuth } from "@/components/authentication/AuthContext";
import { useTranslate } from "@/hooks/useTranslate";
import { useInstructionFlow } from "@/hooks/useInstructionFlow";

const InstructionTranslation = () => {
    // Custom Hook for Step Management
    const {
        steps,
        currentStep,
        setCurrentStep,
        loadSteps,
        goToNext,
        goToPrev,
        updateAllStepsTeam
    } = useInstructionFlow();

    // Local State
    const [teams, setTeams] = useState(null);
    const [showDoc, setShowDoc] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Form/Data State
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [files, setFiles] = useState([]);
    const [preview, setPreview] = useState("");
    const [instruction, setinstruction] = useState({});
    const [isTranslating, setIsTranslating] = useState(false);

    // Language State
    const [sourceLang, setSourceLang] = useState(null);
    const [targetLangs, setTargetLangs] = useState([]);

    const { user } = useAuth();
    const { translateBatch } = useTranslate();

    const iconMapping = {
        "Users": Users,
        "FileText": FileText,
        "Globe": Globe,
        "Award": Award
    };

    // Use a ref to prevent double-initialization in StrictMode/re-renders
    const hasFetched = useRef(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!user || hasFetched.current) return;

            try {
                hasFetched.current = true;
                let userLanguage = user?.language || localStorage.getItem("preferredLanguage") || "en";
                if (userLanguage === "kh") userLanguage = "km";
                if (userLanguage === "ch") userLanguage = "zh-Hans";

                const data = await progress.getProgress(userLanguage);
                const customerData = await customer.getCustomer();
                setTeams(customerData);

                // Map API response to UI format
                let formattedSteps = data.map(step => ({
                    ...step,
                    id: step.order,
                    originalId: step.id,
                    icon: iconMapping[step.icon] || Circle
                })).sort((a, b) => a.order - b.order);

                // Translate static text
                if (translateBatch) {
                    formattedSteps = await translateBatch(formattedSteps, 'title');
                    formattedSteps = await translateBatch(formattedSteps, 'instruct_title');
                    formattedSteps = await translateBatch(formattedSteps, 'instruct_description');
                    formattedSteps = await translateBatch(formattedSteps, 'description');
                }

                loadSteps(formattedSteps);

                // Restore Team
                const teamStep = data.find(s => s.order === 1);
                if (teamStep?.team) {
                    setSelectedTeam(teamStep.team);
                }

                // Restore Active Document
                const docsResponse = await document.getDocsByUser();
                const userDocs = docsResponse?.documents || [];
                const activeDoc = userDocs.find(d => d.active);

                if (userDocs.length > 0) {
                    setFiles(userDocs);
                }

                if (activeDoc) {
                    try {
                        // Check if we already have this instruction loaded to avoid redundant fetch
                        if (instruction?.documentId !== activeDoc._id) {
                            const response = await document.getInstruction(activeDoc._id);
                            const instructionData = response.data || response;
                            setinstruction(instructionData);

                            // Only restore from instruction if we haven't already restored from progress
                            if (!teamStep || !teamStep.team) {
                                if (instructionData?.customer?.customer_info?.name) {
                                    setSelectedTeam(instructionData.customer.customer_info.name);
                                } else if (typeof instructionData?.customer === 'string') {
                                    setSelectedTeam(instructionData.customer);
                                }
                            }
                            setPreview("Preview");
                        }
                    } catch (err) {
                        console.error("Failed to restore instruction data:", err);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch page data:", error);
                hasFetched.current = false; // Allow retry on failure
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loadSteps]);


    // Handlers
    const handleTeamSelection = async (team) => {
        setSelectedTeam(team.code);

        try {
            await updateAllStepsTeam(team.code);
            goToNext();
        } catch (error) {
            console.error("Failed to save team selection:", error);
        }
    };

    const handleNextClick = async () => {
        if (currentStep === 3) {
            // Step 3 -> 4: Translation Trigger
            try {
                // Save languages
                if (steps[2]) {
                    await progress.updateProgress(steps[2].originalId, {
                        source_language: sourceLang?.value,
                        target_languages: targetLangs.map(l => l.value)
                    });
                }

                console.log("Triggering translation with:", {
                    source: sourceLang,
                    targets: targetLangs,
                    instructionId: instruction?.instructionId,
                    _id: instruction?._id
                });

                // Start Translation Logic
                setIsTranslating(true);
                const targetValues = targetLangs.map(l => l.value);
                targetValues.push(sourceLang.value);

                const idToUse = instruction?.instructionId || instruction?._id || instruction?.id;

                if (!idToUse) {
                    console.error("Missing instructionId for translation", instruction);
                    alert("Error: Missing Instruction ID. Please reload the document.");
                    setIsTranslating(false);
                    return;
                }

                await document.translate(idToUse, targetValues);

                // Refresh Data
                try {
                    const docIdToFetch = instruction.documentId || instruction.document_id || files.find(f => f.active)?._id;
                    if (docIdToFetch) {
                        const updatedResponse = await document.getInstruction(docIdToFetch);
                        setinstruction(updatedResponse.data || updatedResponse);
                        console.log("Instruction data refreshed with translations.");
                    } else {
                        console.warn("Could not determine document ID for refresh.");
                    }
                } catch (refreshError) {
                    console.error("Failed to refresh instruction data:", refreshError);
                }

                setTimeout(async () => {
                    setIsTranslating(false);
                    goToNext(); // Advances to Step 4
                }, 1000);

            } catch (error) {
                console.error("Translation flow failed:", error);
                setIsTranslating(false);
            }
        } else {
            // Standard Navigation
            goToNext();
        }
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
                steps={steps}
                currentStep={currentStep}
                showDoc={showDoc}
                setShowDoc={setShowDoc}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">

                <Header
                    currentStep={currentStep}
                    steps={steps}
                    onPrev={goToPrev}
                    onNext={handleNextClick}
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
                                className="h-full w-full overflow-y-auto p-4 md:p-6 lg:p-8"
                            >
                                <div className="max-w-[1600px] w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px] p-6 md:p-8 lg:p-10">
                                    <StepContent
                                        currentStep={currentStep}
                                        stepData={steps[currentStep - 1]}
                                        teams={teams}
                                        selectedTeam={selectedTeam}
                                        onTeamSelect={handleTeamSelection}
                                        instruction={instruction}
                                        setinstruction={setinstruction}
                                        files={files}
                                        setFiles={setFiles}
                                        preview={preview}
                                        setPreview={setPreview}
                                        setCurrentStep={setCurrentStep}
                                        onNext={handleNextClick}
                                        sourceLang={sourceLang}
                                        setSourceLang={setSourceLang}
                                        targetLangs={targetLangs}
                                        setTargetLangs={setTargetLangs}
                                    />
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