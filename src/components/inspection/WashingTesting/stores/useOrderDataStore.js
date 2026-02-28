import { create } from "zustand";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

let _lastFetchedColorStyle = null;
let _lastFetchedYorksysStyle = null;

const isValidStyleFormat = (orderNo) => {
    if (!orderNo) return false;
    const trimmed = orderNo.trim().toUpperCase();
    return trimmed.length >= 3 && /^[A-Za-z]/.test(trimmed);
};

export const useOrderDataStore = create((set, get) => ({
    availableColors: [],
    availablePOs: [],
    availableETDs: [],
    availableSizes: [],
    usedColors: [],
    fabrication: "",
    fabricContent: [],
    season: "",
    styleDescription: "",
    custStyle: "",
    anfSpecs: [],
    isLoadingColors: false,
    isLoadingSpecs: false,

    factories: [],
    isLoadingFactories: false,

    setAvailableColors: (v) => set({ availableColors: v }),
    setAvailablePOs: (v) => set({ availablePOs: v }),
    setAvailableETDs: (v) => set({ availableETDs: v }),
    setAvailableSizes: (v) => set({ availableSizes: v }),
    setUsedColors: (v) => set({ usedColors: v }),
    setFabrication: (v) => set({ fabrication: v }),
    setFabricContent: (v) => set({ fabricContent: v }),
    setSeason: (v) => set({ season: v }),
    setStyleDescription: (v) => set({ styleDescription: v }),
    setCustStyle: (v) => set({ custStyle: v }),
    setAnfSpecs: (v) => set({ anfSpecs: v }),
    setIsLoadingColors: (v) => set({ isLoadingColors: v }),
    setIsLoadingSpecs: (v) => set({ isLoadingSpecs: v }),

    fetchFactories: async () => {
        set({ isLoadingFactories: true });
        try {
            const response = await fetch(`${API_BASE_URL}/api/subcon-sewing-factories-manage`);
            if (response.ok) {
                set({ factories: await response.json() });
            } else {
                console.error("Failed to fetch factories");
                showToast.error("Failed to load factories. Please check your connection.");
            }
        } catch (error) {
            console.error("Error fetching factories:", error);
            if (
                error.message.includes("Failed to fetch") ||
                error.message.includes("ERR_CONNECTION_REFUSED")
            ) {
                showToast.error(
                    `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running.`,
                );
            } else {
                showToast.error("Error loading factories. Please try again.");
            }
        } finally {
            set({ isLoadingFactories: false });
        }
    },

    resetOrderData: () => {
        _lastFetchedColorStyle = null;
        _lastFetchedYorksysStyle = null;
        set({
            availableColors: [],
            availablePOs: [],
            availableETDs: [],
            availableSizes: [],
            fabrication: "",
            fabricContent: [],
            season: "",
            styleDescription: "",
            custStyle: "",
            anfSpecs: [],
        });
    },

    // ─── Fetch actions (merged from useOrderData hook) ────────────────

    fetchOrderColors: async (orderNo, setFormData) => {
        if (!orderNo || !isValidStyleFormat(orderNo)) {
            set({ availableColors: [] });
            return;
        }

        const trimmedOrderNo = orderNo.trim();
        const normalizedStyle = trimmedOrderNo.toUpperCase();

        const { isLoadingColors, availableColors, custStyle } = get();
        if (
            isLoadingColors ||
            (_lastFetchedColorStyle?.toUpperCase() === normalizedStyle && availableColors.length > 0)
        ) {
            if (setFormData && custStyle) {
                setFormData((prev) => ({
                    ...prev,
                    custStyle: custStyle || prev.custStyle,
                    buyerStyle: custStyle || prev.buyerStyle,
                }));
            }
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/washing/strict-order-details/${encodeURIComponent(trimmedOrderNo)}`,
            );

            if (response.ok) {
                const orderData = await response.json();
                _lastFetchedColorStyle = trimmedOrderNo;

                if (orderData.success === false) {
                    set({ availableColors: [] });
                    return;
                }

                if (orderData.colorOptions && Array.isArray(orderData.colorOptions)) {
                    const uniqueColors = [
                        ...new Set(
                            orderData.colorOptions
                                .map((c) => (c.value || c.label || "").trim())
                                .filter(Boolean),
                        ),
                    ];
                    set({ availableColors: uniqueColors });
                } else {
                    set({ availableColors: [] });
                }

                if (orderData.colorQtyBySize) {
                    const allSizes = new Set();
                    Object.values(orderData.colorQtyBySize).forEach((sizesMap) =>
                        Object.keys(sizesMap).forEach((size) => allSizes.add(size)),
                    );
                    if (allSizes.size > 0) set({ availableSizes: [...allSizes] });
                } else if (
                    orderData.sizeList &&
                    Array.isArray(orderData.sizeList) &&
                    orderData.sizeList.length > 0
                ) {
                    set({ availableSizes: orderData.sizeList });
                }

                if (orderData.custStyle && orderData.custStyle !== "N/A") {
                    const extracted = orderData.custStyle;
                    set({ custStyle: extracted });
                    if (setFormData) {
                        setFormData((prev) => ({
                            ...prev,
                            buyerStyle: extracted,
                            custStyle: extracted,
                            moNo: prev.moNo || trimmedOrderNo,
                        }));
                    }
                } else {
                    set({ custStyle: "" });
                    if (setFormData) {
                        setFormData((prev) => ({ ...prev, moNo: prev.moNo || trimmedOrderNo }));
                    }
                }

                const descFromDt =
                    orderData.engName && orderData.engName !== "N/A"
                        ? String(orderData.engName).trim()
                        : "";
                if (descFromDt) {
                    set({ styleDescription: descFromDt });
                    if (setFormData) {
                        setFormData((prev) => ({ ...prev, styleDescription: descFromDt }));
                    }
                }
            } else if (response.status === 404) {
                _lastFetchedColorStyle = trimmedOrderNo;
                set({ availableColors: [], custStyle: "" });
            } else {
                console.warn(`Failed to fetch order details for ${trimmedOrderNo}: ${response.status}`);
                set({ availableColors: [] });
            }
        } catch (error) {
            if (
                !error.message.includes("Failed to fetch") &&
                !error.message.includes("ERR_CONNECTION_REFUSED")
            ) {
                console.error("Error fetching order colors:", error);
            }
            set({ availableColors: [] });
        } finally {
            set({ isLoadingColors: false });
        }
    },

    fetchUsedColors: async (orderNo) => {
        if (!orderNo) {
            set({ usedColors: [] });
            return;
        }
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/report-washing/used-colors?ymStyle=${encodeURIComponent(orderNo.trim())}`,
            );
            if (response.ok) {
                const result = await response.json();
                if (result.success) set({ usedColors: result.usedColors || [] });
            }
        } catch (error) {
            console.error("Error fetching used colors:", error);
            set({ usedColors: [] });
        }
    },

    fetchYorksysOrderETD: async (orderNo, setFormData) => {
        if (!orderNo || !isValidStyleFormat(orderNo)) {
            set({ availablePOs: [], availableETDs: [] });
            return;
        }

        const trimmedOrderNo = orderNo.trim();
        const normalizedStyle = trimmedOrderNo.toUpperCase();

        const { season } = get();
        if (_lastFetchedYorksysStyle?.toUpperCase() === normalizedStyle) {
            if (setFormData && season) {
                setFormData((prev) => ({ ...prev, season: season || prev.season }));
            }
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(trimmedOrderNo)}`,
            );

            if (response.ok) {
                _lastFetchedYorksysStyle = trimmedOrderNo;
                const result = await response.json();

                if (result.success === false) {
                    set({ availablePOs: [], availableETDs: [] });
                    return;
                }

                if (
                    result.success &&
                    result.data?.SKUData &&
                    Array.isArray(result.data.SKUData) &&
                    result.data.SKUData.length > 0
                ) {
                    const uniqueETDs = [
                        ...new Set(
                            result.data.SKUData.map((sku) => {
                                let etdDate = (sku.ETD || "").trim();
                                if (!etdDate) return null;
                                try {
                                    if (/^\d{4}-\d{2}-\d{2}$/.test(etdDate)) return etdDate;
                                    const d = new Date(etdDate);
                                    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
                                } catch {
                                    /* ignore */
                                }
                                return etdDate;
                            }).filter(Boolean),
                        ),
                    ].sort();
                    set({ availableETDs: uniqueETDs.length > 0 ? uniqueETDs : [] });

                    const uniquePOs = [
                        ...new Set(
                            result.data.SKUData.map((sku) => (sku.POLine || "").trim()).filter(Boolean),
                        ),
                    ];
                    set({ availablePOs: uniquePOs.length > 0 ? uniquePOs : [] });

                    if (setFormData) {
                        setFormData((prev) => ({
                            ...prev,
                            po: uniquePOs.length > 0 ? uniquePOs : [],
                            exFtyDate: uniqueETDs.length > 0 ? uniqueETDs : [],
                        }));
                    }

                    const sizes = result.data.sizeList || result.data.SizeList;
                    if (sizes && Array.isArray(sizes) && sizes.length > 0) set({ availableSizes: sizes });

                    if (
                        result.data.FabricContent &&
                        Array.isArray(result.data.FabricContent) &&
                        result.data.FabricContent.length > 0
                    ) {
                        const fabString = result.data.FabricContent.map(
                            (f) => `${f.percentageValue}% ${f.fabricName}`,
                        ).join(", ");
                        set({ fabrication: fabString, fabricContent: result.data.FabricContent });
                        if (setFormData) setFormData((prev) => ({ ...prev, fabrication: fabString }));
                    } else {
                        set({ fabrication: "", fabricContent: [] });
                        if (setFormData) setFormData((prev) => ({ ...prev, fabrication: "" }));
                    }
                } else {
                    set({ availablePOs: [], availableETDs: [], fabrication: "", fabricContent: [] });
                    if (setFormData) setFormData((prev) => ({ ...prev, fabrication: "" }));
                }

                let extractedSeason = "";
                if (result.data?.season && result.data.season !== "N/A") {
                    extractedSeason = result.data.season;
                    set({ season: extractedSeason });
                } else {
                    set({ season: "" });
                }

                if (setFormData) {
                    const mainStyle = (
                        result.data?.moNo || result.data?.style || trimmedOrderNo || ""
                    )
                        .toString()
                        .trim();
                    setFormData((prev) => ({
                        ...prev,
                        season: extractedSeason || "",
                        moNo: mainStyle || prev.moNo,
                    }));
                }
            } else if (response.status === 404) {
                _lastFetchedYorksysStyle = trimmedOrderNo;
                set({
                    availablePOs: [],
                    availableETDs: [],
                    fabrication: "",
                    fabricContent: [],
                    season: "",
                });
                if (setFormData) setFormData((prev) => ({ ...prev, season: "", fabrication: "" }));
            } else {
                console.warn(
                    `Failed to fetch yorksys order for ${trimmedOrderNo}: ${response.status} ${response.statusText}`,
                );
                set({
                    availablePOs: [],
                    availableETDs: [],
                    fabrication: "",
                    fabricContent: "",
                    season: "",
                });
            }
        } catch (error) {
            if (
                !error.message.includes("Failed to fetch") &&
                !error.message.includes("ERR_CONNECTION_REFUSED")
            ) {
                console.error("Error fetching yorksys order ETD:", error);
            }
            set({
                availablePOs: [],
                availableETDs: [],
                fabrication: "",
                fabricContent: [],
                season: "",
            });
        }
    },

    // ─── Fetch last careSymbols used for a given style ────────────────
    fetchLastCareSymbols: async (ymStyle, setFormData) => {
        if (!ymStyle || !isValidStyleFormat(ymStyle)) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/report-washing?ymStyle=${encodeURIComponent(ymStyle.trim())}&limit=1&page=1`,
            );
            if (!response.ok) return;
            const result = await response.json();
            if (!result.success || !Array.isArray(result.data) || result.data.length === 0) return;

            const latestReport = result.data[0];
            if (!latestReport.careSymbols) return;

            // Parse careSymbols (may be stored as JSON string or plain object)
            let careSymbols = {};
            if (typeof latestReport.careSymbols === "string") {
                try { careSymbols = JSON.parse(latestReport.careSymbols); } catch { return; }
            } else if (typeof latestReport.careSymbols === "object") {
                careSymbols = latestReport.careSymbols;
            }

            if (Object.keys(careSymbols).length === 0) return;

            // Pre-fill form only if user hasn't already made a selection
            if (setFormData) {
                setFormData((prev) => ({
                    ...prev,
                    // Only auto-fill if careSymbols is currently empty
                    careSymbols: (!prev.careSymbols || Object.keys(prev.careSymbols).length === 0)
                        ? careSymbols
                        : prev.careSymbols,
                }));
            }
        } catch (error) {
            // Silently ignore - this is a nice-to-have auto-fill feature
            console.debug("Could not fetch last care symbols for style:", ymStyle, error);
        }
    },

    fetchAnfSpecs: async (moNo, size) => {
        if (!moNo || !size) {
            set({ anfSpecs: [] });
            return;
        }
        set({ isLoadingSpecs: true });
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/anf-measurement/spec-table?moNo=${encodeURIComponent(moNo)}&size=${encodeURIComponent(size)}`,
            );
            if (response.ok) {
                const specs = await response.json();
                set({ anfSpecs: specs?.success === false ? [] : specs });
            } else {
                if (response.status !== 404) {
                    console.warn(`Failed to fetch ANF specs for MO ${moNo} Size ${size}: ${response.status}`);
                }
                set({ anfSpecs: [] });
            }
        } catch (error) {
            console.error("Error fetching ANF specs:", error);
            set({ anfSpecs: [] });
        } finally {
            set({ isLoadingSpecs: false });
        }
    },
}));
