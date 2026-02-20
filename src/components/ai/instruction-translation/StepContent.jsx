import TeamSelection from "./TeamSelection";
import DocumentUpload from "./DocumentUpload";
import LanguageConfig from "./LanguageConfig";
import TranslationReview from "./TranslationReview";

const StepContent = ({
    currentStep,
    stepData,
    teams,
    selectedTeam,
    onTeamSelect,
    instruction,
    setinstruction,
    files,
    setFiles,
    preview,
    setPreview,
    setCurrentStep,
    onNext,
    sourceLang,
    setSourceLang,
    targetLangs,
    setTargetLangs
}) => {

    // Header for each step
    const StepHeader = () => (
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{stepData.instruct_title}</h2>
            <p className="text-slate-500 mt-2">{stepData.instruct_description}</p>
        </div>
    );

    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">{stepData.instruct_title}</h2>
                        <p className="text-slate-500 mt-2">{stepData.instruct_description}</p>
                    </div>
                    <div className="mt-8">
                        <TeamSelection
                            teams={teams}
                            onSelect={onTeamSelect}
                        />
                    </div>
                </div>
            );
        case 2:
            return (
                <div className="h-full flex flex-col">
                    <StepHeader />
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
                        onNext={onNext}
                        sourceLang={sourceLang}
                        setSourceLang={setSourceLang}
                    />
                </div>
            );
        case 3:
            return (
                <div className="space-y-6">
                    <StepHeader />
                    <LanguageConfig
                        instruction={instruction}
                        onNext={onNext}
                        sourceLang={sourceLang}
                        setSourceLang={setSourceLang}
                        targetLangs={targetLangs}
                        setTargetLangs={setTargetLangs}
                    />
                </div>
            );
        case 4:
            return (
                <div className="h-full">
                    <StepHeader />
                    <TranslationReview
                        team={selectedTeam}
                        mode="final"
                        instruction={instruction}
                        setinstruction={setinstruction}
                        sourceLang={sourceLang}
                        targetLangs={targetLangs}
                    />
                </div>
            );
        default:
            return null;
    }
};

export default StepContent;
