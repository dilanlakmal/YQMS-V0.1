import EditWord from "../../../utils/EditWord";
import { splitChineseWords } from "../../../../../utils/segmenter";
import { getOriginLangByPage } from "../../api/extraction.js";
import { useState, useEffect } from "react";
import { updateProductionData } from "../../api/extraction.js";
import ReactDOMServer from "react-dom/server";

const GprtFirstPage = ({
    production,
    setProduction,
    editable,
    step,
    currentLanguage // Receives "en", "zh", etc.
}) => {
    const [fetchedLang, setFetchedLang] = useState("");

    useEffect(() => {
        const fetchLang = async () => {
            if (production?.documentId && !currentLanguage) {
                const lang = await getOriginLangByPage(production.documentId, 1);
                setFetchedLang(lang.OrigenLang);
            }
        };
        fetchLang();
    }, [production, currentLanguage]);

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

    const title = getLocalizedText(production?.title?.text, originLang);
    const customer = production?.customer;
    const factory = production?.factory;
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
                // Fallback or specific logic if needed
                // return (splitChineseWords(input).map((w, i) => (<EditWord key={i} word={w} />)))

                case "complete":
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

    function updateProduction(production, updater) {
        const copy = structuredClone(production);
        updater(copy);
        setProduction(copy);
        return copy;
    }

    const commonCellClass = "border border-slate-300 p-3 text-sm text-slate-700 align-top";
    const labelClass = "font-semibold text-slate-500 text-xs uppercase tracking-wide mb-1 block";

    return (
        <div className="w-full bg-white shadow-sm p-4 md:p-6 mx-auto max-w-5xl rounded-sm">
            {/* Header Section */}
            <header className="mb-4 border-b border-slate-200 pb-3">
                <h1 className="text-3xl font-bold text-slate-900 text-center">
                    {renderContentByStep(title, async (newValue) => {
                        const updatedProduction = updateProduction(production, (prod) => {
                            prod.title.text[originLang] = newValue;
                        });
                        await updateProductionData(production.documentId, updatedProduction);
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
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.customer.style.code.label[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </div>
                </div>
                <div className="col-span-6 md:col-span-4 p-2 border-b border-slate-300">
                    {/* <span className={labelClass}>Style Code Value</span> */}
                    <div className="font-medium text-slate-900">
                        {renderContentByStep(getLocalizedText(customer?.style.code.value, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.customer.style.code.value[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </div>
                </div>

                <div className="col-span-6 md:col-span-4 p-2 border-r border-b border-slate-300">
                    {/* <span className={labelClass}>Factory ID Label</span> */}
                    <div>
                        {renderContentByStep(getLocalizedText(factory?.factoryID.label, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.factory.factoryID.label[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </div>
                </div>
                <div className="col-span-6 md:col-span-4 p-2 border-b border-slate-300">
                    {/* <span className={labelClass}>Factory ID Value</span> */}
                    <div className="font-medium text-slate-900">
                        {renderContentByStep(getLocalizedText(factory?.factoryID.value, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.factory.factoryID.value[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </div>
                </div>

                <div className="col-span-6 md:col-span-4 p-2  border-slate-300 border-r-0 md:border-r">
                    {/* <span className={labelClass}>Order No. Label</span> */}
                    <div>
                        {renderContentByStep(getLocalizedText(customer?.purchase.order.orderNumber.label, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.customer.purchase.order.orderNumber.label[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </div>
                </div>
                {/* Note: In original code, image spanned 4 rows. Here I'm simplifying grid for responsiveness. Adjusting cols to match logic roughly. */}

                <div className="col-span-6 md:col-span-4 p-2 md:border-r border-slate-300">
                    {/* <span className={labelClass}>Order Number</span> */}
                    <div className="font-medium text-slate-900">
                        {renderContentByStep(getLocalizedText(customer?.purchase.order.orderNumber.value, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.customer.purchase.order.orderNumber.value[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </div>
                </div>

                <div className="col-span-6 md:col-span-4 p-2 border-slate-300">
                    {/* Empty or additional info could go here to balance grid */}
                </div>

                {/* Quantity Row */}
                <div className="col-span-6 md:col-span-4 p-2 border-r border-t border-slate-300">
                    {/* <span className={labelClass}>Quantity Label</span> */}
                    {renderContentByStep(getLocalizedText(customer?.purchase.quantity.label, originLang),
                        async (newValue) => {
                            const updatedProduction = updateProduction(production, (prod) => {
                                prod.customer.purchase.quantity.label[originLang] = newValue;
                            });
                            await updateProductionData(production.documentId, updatedProduction);
                        }
                    )}
                </div>
                <div className="col-span-6 md:col-span-8 p-2 border-t border-slate-300 flex items-center gap-2">
                    {/* <span className={labelClass}>Quantity:</span> */}
                    <span className="font-medium text-slate-900 mr-1">
                        {renderContentByStep(getLocalizedText(customer?.purchase.quantity.value, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.customer.purchase.quantity.value[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </span>
                    <span className="text-slate-600">
                        {renderContentByStep(getLocalizedText(customer?.purchase.quantity.unit, originLang),
                            async (newValue) => {
                                const updatedProduction = updateProduction(production, (prod) => {
                                    prod.customer.purchase.quantity.unit[originLang] = newValue;
                                });
                                await updateProductionData(production.documentId, updatedProduction);
                            }
                        )}
                    </span>
                </div>

                {/* Packing & Order Type */}
                <div className="col-span-4 p-4 border-r border-t border-slate-300">
                    {/* <span className={labelClass}>Packing Main</span> */}
                    {renderContentByStep(getLocalizedText(customer?.packing.main.label, originLang),
                        async (newValue) => {
                            const updatedProduction = updateProduction(production, (prod) => {
                                prod.customer.packing.main.label[originLang] = newValue;
                            });
                            await updateProductionData(production.documentId, updatedProduction);
                        }
                    )}
                </div>
                <div className="col-span-4 p-4 border-r border-t border-slate-300">
                    {/* <span className={labelClass}>Order Type Label</span> */}
                    {renderContentByStep(getLocalizedText(customer?.purchase.order.orderType.label, originLang),
                        async (newValue) => {
                            const updatedProduction = updateProduction(production, (prod) => {
                                prod.customer.purchase.order.orderType.label[originLang] = newValue;
                            });
                            await updateProductionData(production.documentId, updatedProduction);
                        }
                    )}
                </div>
                <div className="col-span-4 p-4 border-t border-slate-300">
                    {/* <span className={labelClass}>Order Type Value</span> */}
                    {renderContentByStep(getLocalizedText(customer?.purchase.order.orderType.value, originLang),
                        async (newValue) => {
                            const updatedProduction = updateProduction(production, (prod) => {
                                prod.customer.purchase.order.orderType.value[originLang] = newValue;
                            });
                            await updateProductionData(production.documentId, updatedProduction);
                        }
                    )}
                </div>
            </div>

            {/* Notes Section */}
            <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">Manufacturing Notes</h3>
                <div className="bg-yellow-50/50 p-2 rounded-sm border border-yellow-100 text-slate-700 space-y-1">
                    {notes.map((note, idx) => (
                        <div key={idx} className="flex gap-2">
                            <span className="font-bold text-yellow-600">•</span>
                            <div className="flex-1">
                                {renderContentByStep(getLocalizedText(note, originLang),
                                    async (newValue) => {
                                        const updatedProduction = updateProduction(production, (prod) => {
                                            const noteRef = prod.customer.manufacturingNote.find(n => getLocalizedText(n, originLang) === getLocalizedText(note, originLang));
                                            if (noteRef) {
                                                noteRef[originLang] = newValue;
                                            }
                                        });
                                        await updateProductionData(production.documentId, updatedProduction);
                                    }
                                )}
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && <span className="text-slate-400 italic">No notes available.</span>}
                </div>
            </div>

            {/* Production Specifications */}
            <div className="mb-4 overflow-hidden rounded-sm border border-slate-200">
                {productionSpecifications.map((prod, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                        <ProductionSpecific
                            table={prod}
                            originLang={originLang}
                            renderContentByStep={renderContentByStep}
                            getLocalizedText={getLocalizedText} // Pass helper down
                        />
                    </div>
                ))}
            </div>

            {/* Stamp Section */}
            <div className="flex justify-end mt-6">
                <div className="text-right flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Approved Stamp</span>
                    {stamp?.img?.src ? (
                        <div className="relative">
                            <img src={stamp.img.src} alt="Stamp" className="w-24 h-24 object-contain opacity-90 rotate-[-5deg]" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-300 text-[10px]">
                            OFFICIAL STAMP
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductionSpecific = ({ table, originLang, renderContentByStep, getLocalizedText }) => {
    if (!table || table.length === 0) return null;
    const header = table[0];
    const rows = table.slice(1);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                        {header.map((h, i) => (
                            <th key={i} className="px-4 py-3 border-b border-slate-200">
                                {renderContentByStep(getLocalizedText(h, originLang))}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((cols, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                            {cols.map((cell, cellIndex) => (
                                <td key={cellIndex} colSpan={cell.colSpan} className="px-4 py-3 border-r last:border-r-0 border-slate-100 align-top">
                                    {renderContentByStep(getLocalizedText(cell, originLang))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const html = (reactElement) => {
    return ReactDOMServer.renderToStaticMarkup(reactElement);
};

export default GprtFirstPage;
export { html };