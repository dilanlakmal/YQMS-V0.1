import { useState, useCallback } from "react";
import EditWord from "../../../utils/EditWord";
import instructionService from "../../../../../services/instructionService";
import { Copy, Package, Factory, ShoppingCart, Truck, AlertCircle, FileText, Ruler } from "lucide-react";

/**
 * Clean & Dynamic GprtFirstPage Template
 * Uses instruction data directly without restructuring.
 * Enhanced UI with modern aesthetics, distinct sections, and a measurement table.
 */
const GprtFirstPage = ({
    instruction,
    setinstruction,
    step,
    currentLanguage = ""
}) => {
    // Determine the working language (selected or detected)
    const workingLang = currentLanguage || instruction?.detectedLanguage || "en";

    /**
     * Helper to get display text from the multilingual object (original + translations)
     */
    const getDisplayText = (val) => {
        if (!val) return "";
        if (typeof val === "string") return val;

        // Fallback sequence: selected -> detected -> english -> first available value
        return val[workingLang] ||
            val[instruction?.detectedLanguage] ||
            val.english ||
            val["null"] ||
            Object.values(val)[0] ||
            "";
    };

    /**
     * Unified handler for updating instruction fields
     */
    const handleUpdate = async (path, isLabel, newValue) => {
        if (!setinstruction || !instruction) return;

        // Clone deeply to maintain immutability
        const updated = JSON.parse(JSON.stringify(instruction));

        // Helper to find target object by path
        const getNestedObject = (obj, p) => p.split('.').reduce((acc, part) => acc && acc[part], obj);

        const targetObj = getNestedObject(updated, path);
        if (!targetObj) return;

        const propName = isLabel ? 'field_name' : 'annotation_value';
        const currentData = targetObj[propName];

        // Apply update based on data type
        if (typeof currentData === 'string') {
            targetObj[propName] = newValue;
        } else if (typeof currentData === 'object' && currentData !== null) {
            currentData[workingLang] = newValue;
            if (workingLang === 'en' || !instruction.detectedLanguage) {
                currentData.english = newValue;
            }
        } else {
            targetObj[propName] = newValue;
        }

        // Optimistic UI Update
        setinstruction(updated);

        // Persistent Backend Update
        try {
            const docId = instruction.document_id || instruction.id || instruction._id;
            if (docId) {
                await instructionService.document.updateInstruction(docId, updated);
            }
        } catch (error) {
            console.error("Failed to sync update to backend:", error);
        }
    };

    /**
     * Helper to render editable/non-editable fields with enhanced UI
     */
    const EditableCell = ({ label, value, path, icon: Icon }) => {
        const isEditable = step === "Preview" || step === "edit";

        return (
            <div className="group relative overflow-hidden rounded-xl bg-slate-50 border border-slate-200 p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {isEditable ? (
                            <EditWord word={getDisplayText(label)} onChange={(val) => handleUpdate(path, true, val)} />
                        ) : (
                            getDisplayText(label) || "LABEL"
                        )}
                    </div>
                </div>
                <div className="text-xl font-bold text-slate-900 break-words leading-tight">
                    {isEditable ? (
                        <EditWord word={getDisplayText(value)} onChange={(val) => handleUpdate(path, false, val)} />
                    ) : (
                        getDisplayText(value) || "-"
                    )}
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-100/0 to-slate-200/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
            </div>
        );
    };

    if (!instruction) {
        return (
            <div className="min-h-[600px] flex items-center justify-center p-12 text-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="text-slate-400 font-medium tracking-wide uppercase">Waiting for instruction stream...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto bg-white min-h-screen pb-20">
            {/* Header Section */}
            <div className="mb-8 border-b border-slate-100 pb-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-slate-900 leading-none">
                        {step === "Preview" || step === "edit" ? (
                            <EditWord
                                word={getDisplayText(instruction.title?.annotation_value)}
                                onChange={(val) => handleUpdate("title", false, val)}
                            />
                        ) : (
                            getDisplayText(instruction.title?.annotation_value) || "INSTRUCTION"
                        )}
                    </h1>
                    <div className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-500">
                        {step === "Preview" || step === "edit" ? (
                            <EditWord
                                word={getDisplayText(instruction.title?.field_name)}
                                onChange={(val) => handleUpdate("title", true, val)}
                            />
                        ) : (
                            getDisplayText(instruction.title?.field_name) || "DOCUMENT TITLE"
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid: Image + Key Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Left Column: Image (Span 7) */}
                <div className="lg:col-span-7">
                    <div className="h-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 relative group min-h-[500px] flex items-center justify-center">
                        {instruction.imageExtracted?.[0] ? (
                            <img
                                src={instruction.imageExtracted[0]}
                                alt="Product"
                                className="w-full h-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex flex-col items-center opacity-20">
                                <Package className="w-24 h-24 mb-4" />
                                <div className="text-xl font-black uppercase tracking-widest text-slate-400">No Image</div>
                            </div>
                        )}
                        {/* Optional overlay tag */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm text-slate-500">
                            PRODUCT IMAGE
                        </div>
                    </div>
                </div>

                {/* Right Column: Details (Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <EditableCell
                        label={instruction.product_number?.field_name}
                        value={instruction.product_number?.annotation_value}
                        path="product_number"
                        icon={Copy}
                    />

                    <EditableCell
                        label={instruction.factory?.field_name}
                        value={instruction.factory?.annotation_value}
                        path="factory"
                        icon={Factory}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <EditableCell
                            label={instruction.customer?.purchase?.quantity?.field_name}
                            value={instruction.customer?.purchase?.quantity?.annotation_value}
                            path="customer.purchase.quantity"
                            icon={ShoppingCart}
                        />
                        <EditableCell
                            label={instruction.customer?.purchase?.order_number?.field_name}
                            value={instruction.customer?.purchase?.order_number?.annotation_value}
                            path="customer.purchase.order_number"
                            icon={FileText}
                        />
                    </div>

                    <EditableCell
                        label={instruction.shipping_remark?.field_name}
                        value={instruction.shipping_remark?.annotation_value}
                        path="shipping_remark"
                        icon={Truck}
                    />
                </div>
            </div>

            {/* Instruction Notes Section */}
            {instruction.instruction_notes?.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">Production Instructions</h2>
                        <div className="h-px bg-slate-200 flex-grow" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {instruction.instruction_notes.map((note, index) => (
                            <div key={index} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60 group">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
                                    {index + 1}
                                </span>
                                <div className="flex flex-col flex-grow">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">
                                        {(step === "Preview" || step === "edit") ? (
                                            <EditWord word={getDisplayText(note?.field_name)} onChange={(val) => handleUpdate(`instruction_notes.${index}`, true, val)} />
                                        ) : (
                                            getDisplayText(note?.field_name) || "POINT"
                                        )}
                                    </span>
                                    <div className="text-base font-medium text-slate-800 leading-relaxed">
                                        {(step === "Preview" || step === "edit") ? (
                                            <EditWord word={getDisplayText(note?.annotation_value)} onChange={(val) => handleUpdate(`instruction_notes.${index}`, false, val)} />
                                        ) : (
                                            getDisplayText(note?.annotation_value)
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* NEW: Measurement Table Section */}
            <div className="mb-16">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Ruler className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">Measurement Chart / Size Spec</h2>
                    <div className="h-px bg-slate-200 flex-grow" />
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">

                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end opacity-40 hover:opacity-100 transition-opacity duration-700">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                    Generated by YQMS System
                </div>
                <img src="/pass.png" alt="Factory stamp" className="h-24 mix-blend-multiply grayscale contrast-125" />
            </div>
        </div>
    );
};

export default GprtFirstPage;