import EditWord from "../../../utils/EditWord";
import { splitChineseWords } from "../../../../../utils/segmenter";
import { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import { document as docService } from "@/services/instructionService";

const GprtFirstPage = ({
    instruction,
    setinstruction,
    editable,
    step,
    currentLanguage, // Receives "en", "zh", etc.
    ...props
}) => {
    const [fetchedLang, setFetchedLang] = useState("");

    // Handle legacy prop names
    const data = instruction || props.production;
    const setData = setinstruction || props.setProduction;

    useEffect(() => {
        const fetchLang = async () => {
            if (data?.documentId && !currentLanguage && !fetchedLang) {
                try {
                    // Try to use the detectLanguage API if possible
                    if (data?.title?.text?.english) {
                        const result = await docService.detectLanguage(data.title.text.english);
                        if (result && result.code) {
                            setFetchedLang(result.code.toLowerCase());
                            return;
                        }
                    }

                    // Fallback to extraction service getOriginLangByPage if needed, 
                    // but we are cleaning up extraction.js, so we assumes the detectLanguage works.
                } catch (error) {
                    console.error("Failed to fetch origin language", error);
                }
            }
        };
        fetchLang();
    }, [data, currentLanguage, fetchedLang]);

    // Use passed language prop (for Review/Translation mode) or fetched origin lang (for Edit mode)
    const displayLang = currentLanguage || fetchedLang;
    const originLang = displayLang || "english";

    // Helper to safely get text, falling back to English or first available key if specific lang is missing
    const getLocalizedText = (obj, lang) => {
        if (!obj) return "";
        if (typeof obj === 'string') return obj;

        // If it's a cell object with specialized 'text' property
        const data = (obj.text && typeof obj.text === 'object') ? obj.text : obj;

        // Use the passed language name directly (e.g., 'english', 'chinese', 'khmer')
        if (data[lang] && typeof data[lang] === 'string') return data[lang];

        // Fallback strategy: prioritize english, then chinese, then khmer
        const fallbacks = ["english", "chinese", "khmer"];
        for (const fb of fallbacks) {
            if (data[fb] && typeof data[fb] === 'string') return data[fb];
        }

        // Final fallback: first string value found that isn't an ID or metadata
        const keys = Object.keys(data).filter(k => k !== '_id' && k !== 'colSpan' && k !== 'rowSpan');
        for (const k of keys) {
            if (typeof data[k] === 'string') return data[k];
        }

        return "";
    };

    const title = getLocalizedText(data?.title?.text, originLang);
    const customer = data?.customer;
    const factory = data?.factory;
    const productionSpecifications = customer?.purchase?.specs || [];
    const sample = customer?.style?.sample || {};
    const notes = customer?.manufacturingNote || [];
    const stamp = factory?.factoryStamp;

    // blob handling logic (kept as is)
    if (sample.img?.data) {
        const blob = new Blob([new Uint8Array(sample.img.data)], { type: "image/png" });
        const blobUrl = URL.createObjectURL(blob);
        sample.img = blobUrl;
        sample.imgId = sample?.description;
    }

    if (stamp?.img?.data) {
        const blob = new Blob([new Uint8Array(stamp.img.data)], { type: "image/png" });
        const blobUrl = URL.createObjectURL(blob);
        stamp.img = {
            src: blobUrl,
            id: stamp?.description
        };
    }

    const renderContentByStep = (input, onChange) => {
        const state = step?.toLowerCase();
        if (state) {
            switch (state) {
                case "preview":
                    return <EditWord word={input} onChange={onChange} />
                case "glossary":
                case "complete":
                case "final":
                    return input;
                case "review": // Using review mode for clean text or specialized edit if implemented
                    return <span className="text-slate-900">{input}</span>
                case "edit":
                    return <EditWord word={input} onChange={onChange} />
                default:
                    return input
            }
        }
        return <p className="text-slate-400 font-mono text-xs">-</p>
    };

    function updateLocalData(currentData, updater) {
        const copy = structuredClone(currentData);
        updater(copy);
        setData(copy);
        return copy;
    }

    const commonCellClass = "border border-slate-300 p-3 text-sm text-slate-700 align-top";
    const labelClass = "font-semibold text-slate-500 text-xs uppercase tracking-wide mb-1 block";

    return (
        <div className="w-full bg-white shadow-sm p-4 md:p-6 mx-auto rounded-sm">
            {/* Header Section */}
            <header className="mb-4 border-b border-slate-200 pb-3">
                <h1 className="text-3xl font-bold text-slate-900 text-center">
                    {renderContentByStep(title, async (newValue) => {
                        const updatedData = updateLocalData(data, (prod) => {
                            prod.title.text[originLang] = newValue;
                        });
                        await docService.updateInstruction(data.documentId, updatedData);
                    })}
                </h1>
            </header>

            {/* Top Grid Info */}
            <div className="grid grid-cols-12 gap-0 border border-slate-300 rounded-sm overflow-hidden mb-4">
                {/* Image Section - Spans 2 rows visually */}
                <div className="col-span-12 md:col-span-4 row-span-2 border-r border-b md:border-b-0 border-slate-300 p-2 flex items-center justify-center bg-slate-50">
                    {sample.img ? (
                        <img
                            alt={sample.imgId || "Sample"}
                            src={sample.img}
                            className="max-h-64 object-contain rounded shadow-sm border border-slate-200 bg-white"
                        />
                    ) : (
                        <div className="w-full h-48 flex items-center justify-center text-slate-300 text-sm">No Image</div>
                    )}
                </div>

                {/* Info Fields */}
                <div className="col-span-6 md:col-span-4 p-2 border-r border-b border-slate-300">
                    {/* <span className={labelClass}>Style Code Label</span> */}
                    <div>
                        {renderContentByStep(getLocalizedText(customer?.style.code.label, originLang),
                            async (newValue) => {
                                const updatedData = updateLocalData(data, (prod) => {
                                    prod.customer.style.code.label[originLang] = newValue;
                                });
                                await docService.updateInstruction(data.documentId, updatedData);
                            })}
                        <span className="font-bold text-slate-900 ml-1">
                            {renderContentByStep(getLocalizedText(customer?.style.code.value, originLang),
                                async (newValue) => {
                                    const updatedData = updateLocalData(data, (prod) => {
                                        prod.customer.style.code.value[originLang] = newValue;
                                    });
                                    await docService.updateInstruction(data.documentId, updatedData);
                                })}
                        </span>
                    </div>
                </div>

                <div className="col-span-6 md:col-span-4 p-2 border-b border-slate-300">
                    <div>
                        {renderContentByStep(getLocalizedText(customer?.style.name.label, originLang),
                            async (newValue) => {
                                const updatedData = updateLocalData(data, (prod) => {
                                    prod.customer.style.name.label[originLang] = newValue;
                                });
                                await docService.updateInstruction(data.documentId, updatedData);
                            })}
                        <span className="font-bold text-slate-900 ml-1">
                            {renderContentByStep(getLocalizedText(customer?.style.name.value, originLang),
                                async (newValue) => {
                                    const updatedData = updateLocalData(data, (prod) => {
                                        prod.customer.style.name.value[originLang] = newValue;
                                    });
                                    await docService.updateInstruction(data.documentId, updatedData);
                                })}
                        </span>
                    </div>
                </div>

                <div className="col-span-6 md:col-span-4 p-2 border-r border-slate-300">
                    <div>
                        {renderContentByStep(getLocalizedText(customer?.purchase.order.label, originLang),
                            async (newValue) => {
                                const updatedData = updateLocalData(data, (prod) => {
                                    prod.customer.purchase.order.label[originLang] = newValue;
                                });
                                await docService.updateInstruction(data.documentId, updatedData);
                            })}
                        <span className="font-bold text-slate-900 ml-1">
                            {renderContentByStep(getLocalizedText(customer?.purchase.order.value, originLang),
                                async (newValue) => {
                                    const updatedData = updateLocalData(data, (prod) => {
                                        prod.customer.purchase.order.value[originLang] = newValue;
                                    });
                                    await docService.updateInstruction(data.documentId, updatedData);
                                })}
                        </span>
                    </div>
                </div>

                <div className="col-span-6 md:col-span-4 p-2">
                    <div>
                        {renderContentByStep(getLocalizedText(customer?.purchase.contract.label, originLang),
                            async (newValue) => {
                                const updatedData = updateLocalData(data, (prod) => {
                                    prod.customer.purchase.contract.label[originLang] = newValue;
                                });
                                await docService.updateInstruction(data.documentId, updatedData);
                            })}
                        <span className="font-bold text-slate-900 ml-1">
                            {renderContentByStep(getLocalizedText(customer?.purchase.contract.value, originLang),
                                async (newValue) => {
                                    const updatedData = updateLocalData(data, (prod) => {
                                        prod.customer.purchase.contract.value[originLang] = newValue;
                                    });
                                    await docService.updateInstruction(data.documentId, updatedData);
                                })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Specifications Table */}
            <div className="mb-4">
                <table className="w-full border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-50">
                            {productionSpecifications.map((spec, idx) => (
                                <th key={idx} className="border border-slate-300 p-2 text-xs font-bold text-slate-600 uppercase text-center">
                                    {renderContentByStep(getLocalizedText(spec.label, originLang),
                                        async (newValue) => {
                                            const updatedData = updateLocalData(data, (prod) => {
                                                prod.customer.purchase.specs[idx].label[originLang] = newValue;
                                            });
                                            await docService.updateInstruction(data.documentId, updatedData);
                                        })}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {productionSpecifications.map((spec, idx) => (
                                <td key={idx} className="border border-slate-300 p-2 text-center font-bold text-slate-900">
                                    {renderContentByStep(getLocalizedText(spec.value, originLang),
                                        async (newValue) => {
                                            const updatedData = updateLocalData(data, (prod) => {
                                                prod.customer.purchase.specs[idx].value[originLang] = newValue;
                                            });
                                            await docService.updateInstruction(data.documentId, updatedData);
                                        })}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Manufacturing Notes & Factory Stamp */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Notes */}
                <div className="md:col-span-8 border border-slate-300 rounded-sm p-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <div className="w-1 h-3 bg-blue-500 rounded-full" />
                        Manufacturing Notes
                    </h3>
                    <div className="space-y-4">
                        {notes.map((note, idx) => (
                            <div key={idx} className="border-b border-slate-100 pb-3 last:border-0">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    {renderContentByStep(getLocalizedText(note.label, originLang),
                                        async (newValue) => {
                                            const updatedData = updateLocalData(data, (prod) => {
                                                prod.customer.manufacturingNote[idx].label[originLang] = newValue;
                                            });
                                            await docService.updateInstruction(data.documentId, updatedData);
                                        })}
                                </span>
                                <div className="text-slate-700 leading-relaxed">
                                    {renderContentByStep(getLocalizedText(note.value, originLang),
                                        async (newValue) => {
                                            const updatedData = updateLocalData(data, (prod) => {
                                                prod.customer.manufacturingNote[idx].value[originLang] = newValue;
                                            });
                                            await docService.updateInstruction(data.documentId, updatedData);
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Factory Stamp */}
                <div className="md:col-span-4 border border-slate-300 rounded-sm p-4 bg-slate-50/30 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4">Quality Validation</span>
                    {stamp?.img?.src ? (
                        <div className="relative group">
                            <img
                                alt={stamp.img.id}
                                src={stamp.img.src}
                                className="max-w-[140px] opacity-80 mix-blend-multiply grayscale-[0.2] rotate-[-5deg]"
                            />
                            <div className="mt-2 text-[10px] font-bold text-slate-400 italic">
                                {renderContentByStep(getLocalizedText(stamp?.label, originLang),
                                    async (newValue) => {
                                        const updatedData = updateLocalData(data, (prod) => {
                                            prod.factory.factoryStamp.label[originLang] = newValue;
                                        });
                                        await docService.updateInstruction(data.documentId, updatedData);
                                    })}
                            </div>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-200 font-black text-xs uppercase -rotate-12">
                            Pending
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Meta */}
            <footer className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-end text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="space-y-1">
                    <p>Document ID: {data?.documentId || "---"}</p>
                    <p>YAI Synthesis Engine v2.04</p>
                </div>
                <div className="text-right">
                    <p>© {new Date().getFullYear()} YAI KH Manufacturing</p>
                </div>
            </footer>
        </div>
    );
};

export default GprtFirstPage;

export function html(component) {
    return ReactDOMServer.renderToString(component);
}