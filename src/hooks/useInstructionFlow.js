import { useState, useCallback } from "react";
import { progress } from "@/services/instructionService";

export const useInstructionFlow = () => {
    const [steps, setSteps] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Initial load of steps
    const loadSteps = useCallback((data) => {
        setSteps(data);
        const activeStep = data.find(step => step.status === "active");
        if (activeStep) {
            setCurrentStep(activeStep.order);
        }
    }, []);

    // Update progress status in backend and local state
    const updateStepStatus = useCallback(async (stepIndex, status = "active") => {
        if (!steps || !steps[stepIndex]) return;

        const stepToUpdate = steps[stepIndex];
        try {
            await progress.updateStatus(stepToUpdate.originalId, status);

            // Optimistic update
            setSteps(prevSteps => prevSteps.map((s, idx) =>
                idx === stepIndex ? { ...s, status } :
                    status === "active" ? { ...s, status: "inactive" } : s
            ));
        } catch (error) {
            console.error("Failed to update step status:", error);
        }
    }, [steps]);

    // Go to next step
    const goToNext = useCallback(async () => {
        if (!steps) return;
        const nextStepOrder = currentStep + 1;
        const nextStepIndex = nextStepOrder - 1;

        if (steps[nextStepIndex]) {
            await updateStepStatus(nextStepIndex, "active");
            setCurrentStep(nextStepOrder);
        }
    }, [currentStep, steps, updateStepStatus]);

    // Go to previous step
    const goToPrev = useCallback(async () => {
        if (currentStep <= 1 || !steps) return;

        const prevStepOrder = currentStep - 1;
        const prevStepIndex = prevStepOrder - 1;

        if (steps[prevStepIndex]) {
            await updateStepStatus(prevStepIndex, "active");
            setCurrentStep(prevStepOrder);
        }
    }, [currentStep, steps, updateStepStatus]);

    // Update team for all steps
    const updateAllStepsTeam = useCallback(async (teamCode) => {
        if (!steps) return;
        try {
            // Optimistic update
            setSteps(prevSteps => prevSteps.map(s => ({ ...s, team: teamCode })));
            // Parallel backend updates
            const updatePromises = steps.map(step =>
                progress.updateProgress(step.originalId, { team: teamCode })
            );
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Failed to update team for all steps:", error);
        }
    }, [steps]);

    return {
        steps,
        currentStep,
        setCurrentStep,
        loadSteps,
        goToNext,
        goToPrev,
        updateAllStepsTeam
    };
};
