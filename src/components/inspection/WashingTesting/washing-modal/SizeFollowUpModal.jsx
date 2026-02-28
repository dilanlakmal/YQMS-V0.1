import React from "react";
import { CheckCircle2, Layers, X } from "lucide-react";

/**
 * SizeFollowUpModal
 * Shown after a Home Wash Test is submitted with 2 or more sizes selected.
 * Informs the submitter of every size included in that report.
 */
const SizeFollowUpModal = ({ isOpen, sizes = [], ymStyle = "", colors = [], onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header strip */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Layers className="w-5 h-5" />
                        <span className="font-semibold text-sm tracking-wide">Multi-Size Submission</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors rounded-full p-0.5 hover:bg-white/20"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4">
                    {/* Success icon + message */}
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Report submitted successfully!
                        </p>
                        {ymStyle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Style: <span className="font-medium text-gray-700 dark:text-gray-200">{ymStyle}</span>
                            </p>
                        )}
                    </div>

                    {/* Color tags */}
                    {colors.length > 0 && (
                        <div>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                Color(s) submitted
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {colors.map((c, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full"
                                    >
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size grid */}
                    <div>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            {sizes.length} size{sizes.length !== 1 ? "s" : ""} included in this report
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {sizes.map((size, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{size}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <span className="font-semibold">Note:</span> This report covers{" "}
                        <span className="font-semibold">{sizes.length} sizes</span>. Please ensure lab
                        testing is performed for each size listed above.
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SizeFollowUpModal;
