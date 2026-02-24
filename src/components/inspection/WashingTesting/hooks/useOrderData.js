import { useRef, useCallback } from "react";
import { API_BASE_URL } from "../../../../../config.js";
import { useOrderDataStore } from "../../../../stores/washing/index.js";

/**
 * Custom hook for order data API calls.
 * State (availableColors, availablePOs, etc.) lives in useOrderDataStore —
 * any component can read it directly without prop drilling.
 */
export const useOrderData = () => {
  const {
    setAvailableColors, setAvailablePOs, setAvailableETDs, setAvailableSizes,
    setUsedColors, setFabrication, setFabricContent, setSeason,
    setStyleDescription, setCustStyle, setAnfSpecs,
    setIsLoadingColors, setIsLoadingSpecs,
    resetOrderData,
  } = useOrderDataStore();

  const lastFetchedColorStyleRef = useRef(null);
  const lastFetchedYorksysStyleRef = useRef(null);

  const isValidStyleFormat = useCallback((orderNo) => {
    if (!orderNo) return false;
    const trimmed = orderNo.trim().toUpperCase();
    if (trimmed.length < 3) return false;
    if (!/^[A-Za-z]/.test(trimmed)) return false;
    return true;
  }, []);

  // ─── fetchOrderColors ─────────────────────────────────────────────────────
  const fetchOrderColors = useCallback(async (orderNo, setFormData) => {
    if (!orderNo || !isValidStyleFormat(orderNo)) {
      setAvailableColors([]);
      return;
    }

    const trimmedOrderNo = orderNo.trim();
    const normalizedStyle = trimmedOrderNo.toUpperCase();

    // Read live values from store (avoids stale-closure dep array)
    const { isLoadingColors, availableColors, custStyle } = useOrderDataStore.getState();
    if (
      isLoadingColors ||
      (lastFetchedColorStyleRef.current?.toUpperCase() === normalizedStyle &&
        availableColors.length > 0)
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
        `${API_BASE_URL}/api/washing/strict-order-details/${encodeURIComponent(trimmedOrderNo)}`
      );

      if (response.ok) {
        const orderData = await response.json();
        lastFetchedColorStyleRef.current = trimmedOrderNo;

        if (orderData.success === false) {
          setAvailableColors([]);
          return;
        }

        if (orderData.colorOptions && Array.isArray(orderData.colorOptions)) {
          const uniqueColors = [
            ...new Set(
              orderData.colorOptions.map((c) => (c.value || c.label || "").trim()).filter(Boolean)
            ),
          ];
          setAvailableColors(uniqueColors);
        } else {
          setAvailableColors([]);
        }

        if (orderData.colorQtyBySize) {
          const allSizes = new Set();
          Object.values(orderData.colorQtyBySize).forEach((sizesMap) =>
            Object.keys(sizesMap).forEach((size) => allSizes.add(size))
          );
          if (allSizes.size > 0) setAvailableSizes([...allSizes]);
        } else if (
          orderData.sizeList &&
          Array.isArray(orderData.sizeList) &&
          orderData.sizeList.length > 0
        ) {
          setAvailableSizes(orderData.sizeList);
        }

        if (orderData.custStyle && orderData.custStyle !== "N/A") {
          const extracted = orderData.custStyle;
          setCustStyle(extracted);
          if (setFormData) {
            setFormData((prev) => ({
              ...prev,
              buyerStyle: extracted,
              custStyle: extracted,
              moNo: prev.moNo || trimmedOrderNo,
            }));
          }
        } else {
          setCustStyle("");
          if (setFormData) {
            setFormData((prev) => ({ ...prev, moNo: prev.moNo || trimmedOrderNo }));
          }
        }

        const descFromDt =
          orderData.engName && orderData.engName !== "N/A"
            ? String(orderData.engName).trim()
            : "";
        if (descFromDt) {
          setStyleDescription(descFromDt);
          if (setFormData) {
            setFormData((prev) => ({ ...prev, styleDescription: descFromDt }));
          }
        }
      } else if (response.status === 404) {
        setAvailableColors([]);
        setCustStyle("");
        lastFetchedColorStyleRef.current = trimmedOrderNo;
      } else {
        console.warn(`Failed to fetch order details for ${trimmedOrderNo}: ${response.status}`);
        setAvailableColors([]);
      }
    } catch (error) {
      if (
        !error.message.includes("Failed to fetch") &&
        !error.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        console.error("Error fetching order colors:", error);
      }
      setAvailableColors([]);
    } finally {
      setIsLoadingColors(false);
    }
  }, [isValidStyleFormat, setAvailableColors, setAvailableSizes, setCustStyle, setStyleDescription, setIsLoadingColors]); // eslint-disable-line

  // ─── fetchUsedColors ──────────────────────────────────────────────────────
  const fetchUsedColors = useCallback(async (orderNo) => {
    if (!orderNo) { setUsedColors([]); return; }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/report-washing/used-colors?ymStyle=${encodeURIComponent(orderNo.trim())}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) setUsedColors(result.usedColors || []);
      }
    } catch (error) {
      console.error("Error fetching used colors:", error);
      setUsedColors([]);
    }
  }, [setUsedColors]);

  // ─── fetchYorksysOrderETD ─────────────────────────────────────────────────
  const fetchYorksysOrderETD = useCallback(async (orderNo, setFormData) => {
    if (!orderNo || !isValidStyleFormat(orderNo)) {
      setAvailablePOs([]);
      setAvailableETDs([]);
      return;
    }

    const trimmedOrderNo = orderNo.trim();
    const normalizedStyle = trimmedOrderNo.toUpperCase();

    // Read live values from store
    const { season } = useOrderDataStore.getState();
    if (lastFetchedYorksysStyleRef.current?.toUpperCase() === normalizedStyle) {
      if (setFormData && season) {
        setFormData((prev) => ({
          ...prev,
          season: season || prev.season,
        }));
      }
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(trimmedOrderNo)}`
      );

      if (response.ok) {
        lastFetchedYorksysStyleRef.current = trimmedOrderNo;
        const result = await response.json();

        if (result.success === false) {
          setAvailablePOs([]);
          setAvailableETDs([]);
          return;
        }

        if (
          result.success &&
          result.data?.SKUData &&
          Array.isArray(result.data.SKUData) &&
          result.data.SKUData.length > 0
        ) {
          // ETDs
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
              }).filter(Boolean)
            ),
          ].sort();
          setAvailableETDs(uniqueETDs.length > 0 ? uniqueETDs : []);

          // POs
          const uniquePOs = [
            ...new Set(
              result.data.SKUData.map((sku) => (sku.POLine || "").trim()).filter(Boolean)
            ),
          ];
          setAvailablePOs(uniquePOs.length > 0 ? uniquePOs : []);

          // Sizes
          const sizes = result.data.sizeList || result.data.SizeList;
          if (sizes && Array.isArray(sizes) && sizes.length > 0) setAvailableSizes(sizes);

          // Fabrication
          if (
            result.data.FabricContent &&
            Array.isArray(result.data.FabricContent) &&
            result.data.FabricContent.length > 0
          ) {
            const fabString = result.data.FabricContent.map(
              (f) => `${f.percentageValue}% ${f.fabricName}`
            ).join(", ");
            setFabrication(fabString);
            setFabricContent(result.data.FabricContent);
            if (setFormData) setFormData((prev) => ({ ...prev, fabrication: fabString }));
          } else {
            setFabrication("");
            setFabricContent([]);
            if (setFormData) setFormData((prev) => ({ ...prev, fabrication: "" }));
          }
        } else {
          setAvailablePOs([]);
          setAvailableETDs([]);
          setFabrication("");
          setFabricContent([]);
          if (setFormData) setFormData((prev) => ({ ...prev, fabrication: "" }));
        }

        // Season
        let extractedSeason = "";
        if (result.data?.season && result.data.season !== "N/A") {
          extractedSeason = result.data.season;
          setSeason(extractedSeason);
        } else {
          setSeason("");
        }

        // Style description is sourced from fetchOrderColors (engName field).
        // skuDescription from yorksys is the buyer/brand name, NOT the garment description,
        // so we deliberately do NOT set styleDescription here.

        if (setFormData) {
          const mainStyle = (
            result.data?.moNo || result.data?.style || trimmedOrderNo || ""
          ).toString().trim();
          setFormData((prev) => ({
            ...prev,
            season: extractedSeason || "",
            moNo: mainStyle || prev.moNo,
          }));
        }
      } else if (response.status === 404) {
        lastFetchedYorksysStyleRef.current = trimmedOrderNo;
        setAvailablePOs([]);
        setAvailableETDs([]);
        setFabrication("");
        setFabricContent([]);
        setSeason("");
        if (setFormData) setFormData((prev) => ({ ...prev, season: "", fabrication: "" }));
      } else {
        console.warn(
          `Failed to fetch yorksys order for ${trimmedOrderNo}: ${response.status} ${response.statusText}`
        );
        setAvailablePOs([]);
        setAvailableETDs([]);
        setFabrication("");
        setFabricContent([]);
        setSeason("");
      }
    } catch (error) {
      if (
        !error.message.includes("Failed to fetch") &&
        !error.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        console.error("Error fetching yorksys order ETD:", error);
      }
      setAvailablePOs([]);
      setAvailableETDs([]);
      setFabrication("");
      setFabricContent([]);
      setSeason("");
    }
  }, [isValidStyleFormat, setAvailablePOs, setAvailableETDs, setAvailableSizes, setFabrication, setFabricContent, setSeason]); // eslint-disable-line

  // ─── fetchAnfSpecs ────────────────────────────────────────────────────────
  const fetchAnfSpecs = useCallback(async (moNo, size) => {
    if (!moNo || !size) { setAnfSpecs([]); return; }
    setIsLoadingSpecs(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/anf-measurement/spec-table?moNo=${encodeURIComponent(moNo)}&size=${encodeURIComponent(size)}`
      );
      if (response.ok) {
        const specs = await response.json();
        setAnfSpecs(specs?.success === false ? [] : specs);
      } else {
        if (response.status !== 404) {
          console.warn(`Failed to fetch ANF specs for MO ${moNo} Size ${size}: ${response.status}`);
        }
        setAnfSpecs([]);
      }
    } catch (error) {
      console.error("Error fetching ANF specs:", error);
      setAnfSpecs([]);
    } finally {
      setIsLoadingSpecs(false);
    }
  }, [setAnfSpecs, setIsLoadingSpecs]);

  // ─── resetOrderData wraps the store action + clears refs ─────────────────
  const resetOrderDataFull = useCallback(() => {
    resetOrderData();
    lastFetchedColorStyleRef.current = null;
    lastFetchedYorksysStyleRef.current = null;
  }, [resetOrderData]);

  return {
    fetchOrderColors,
    fetchUsedColors,
    fetchYorksysOrderETD,
    fetchAnfSpecs,
    resetOrderData: resetOrderDataFull,
  };
};
