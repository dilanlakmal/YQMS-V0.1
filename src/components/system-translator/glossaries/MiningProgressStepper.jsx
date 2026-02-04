import React from 'react';
import { FileText, Scan, BrainCircuit, CheckCircle, Loader2 } from 'lucide-react';

export default function MiningProgressStepper({ status, progress }) {
    const steps = [
        { id: 'ingesting', label: 'Ingestion', icon: FileText, desc: 'Uploading & Reading' },
        { id: 'ocr', label: 'OCR / Analysis', icon: Scan, desc: 'Scanning Structure' },
        { id: 'mining', label: 'AI Mining', icon: BrainCircuit, desc: 'Extracting Terms' },
        { id: 'completed', label: 'Done', icon: CheckCircle, desc: 'Ready for Review' }
    ];

    // Map backend status to stepper index
    let activeIndex = 0;
    if (status === 'uploading') activeIndex = 0;
    else if (status === 'ingesting') activeIndex = 1;
    else if (status === 'mining') activeIndex = 2;
    else if (status === 'completed') activeIndex = 4; // All done

    // Percentage for mining phase
    const miningPercent = progress.total > 0
        ? Math.round((progress.processed / progress.total) * 100)
        : 0;

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-center mb-8 translator-text-foreground">
                Document Mining in Progress
            </h3>

            <div className="relative flex justify-between">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                <div
                    className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500 -z-10"
                    style={{ width: `${Math.min(100, (activeIndex / (steps.length - 1)) * 100)}%` }}
                ></div>

                {steps.map((step, idx) => {
                    const isActive = idx === activeIndex;
                    const isCompleted = idx < activeIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive || isCompleted
                                        ? 'bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30'
                                        : 'bg-white border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600'
                                    }`}
                            >
                                {isActive && status !== 'completed' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </div>
                            <div className="mt-2 text-center">
                                <p className={`text-sm font-medium ${isActive || isCompleted ? 'translator-text-foreground' : 'text-gray-400'}`}>
                                    {step.label}
                                </p>
                                <p className="text-xs text-gray-500 hidden sm:block">{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dynamic Status Message */}
            <div className="mt-8 text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                {status === 'ingesting' && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
                        Analyzing document structure with Azure Document Intelligence...
                    </p>
                )}
                {status === 'mining' && (
                    <div className="w-full">
                        <div className="flex justify-between text-xs mb-1 font-medium text-gray-600 dark:text-gray-300">
                            <span>Processing chunks...</span>
                            <span>{miningPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${miningPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-center mt-2 text-gray-500">
                            {progress.processed} of {progress.total} segments processed
                        </p>
                    </div>
                )}
                {status === 'completed' && (
                    <div className="text-green-600 font-medium">
                        Mining complete! Finalizing results...
                    </div>
                )}
            </div>
        </div>
    );
}
