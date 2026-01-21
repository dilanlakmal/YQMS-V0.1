import { useState, useRef, useCallback } from "react";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

/**
 * Custom hook for managing order data (colors, PO, ETD)
 */
export const useOrderData = () => {
  const [availableColors, setAvailableColors] = useState([]);
  const [availablePOs, setAvailablePOs] = useState([]);
  const [availableETDs, setAvailableETDs] = useState([]);
  const [fabrication, setFabrication] = useState("");
  const [season, setSeason] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [custStyle, setCustStyle] = useState("");
  const [isLoadingColors, setIsLoadingColors] = useState(false);
  const lastFetchedColorStyleRef = useRef(null);
  const lastFetchedYorksysStyleRef = useRef(null);

  // Helper function to validate if order number looks like a valid YM Style
  const isValidStyleFormat = useCallback((orderNo) => {
    if (!orderNo) return false;
    const trimmed = orderNo.trim().toUpperCase();

    // Minimum length check - YM Styles are typically at least 4 chars
    if (trimmed.length < 3) return false; // Allowed 3 chars now

    // Check if it starts with letters (typical YM Style format)
    if (!/^[A-Za-z]/.test(trimmed)) return false;

    return true;
  }, []);

  // Fetch colors and buyer style from dt_orders collection
  const fetchOrderColors = useCallback(async (orderNo, setFormData) => {
    if (!orderNo) {
      setAvailableColors([]);
      return;
    }

    // Validate style format before making API call
    if (!isValidStyleFormat(orderNo)) {
      setAvailableColors([]);
      return;
    }

    // Prevent duplicate calls for the same style
    const trimmedOrderNo = orderNo.trim();
    const normalizedStyle = trimmedOrderNo.toUpperCase();

    // Check if we're already loading or if this is the same style we just fetched (case-insensitive)
    if (isLoadingColors || (lastFetchedColorStyleRef.current?.toUpperCase() === normalizedStyle && availableColors.length > 0)) {
      // Still update formData if provided, as it might have been cleared externally
      if (setFormData && custStyle) {
        setFormData(prev => ({
          ...prev,
          custStyle: custStyle || prev.custStyle,
          buyerStyle: custStyle || prev.buyerStyle
        }));
      }
      return; // Already loading or already fetched
    }

    setIsLoadingColors(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/washing/order-details/${encodeURIComponent(trimmedOrderNo)}`
      );

      if (response.ok) {
        const orderData = await response.json();

        // Mark this style as fetched
        lastFetchedColorStyleRef.current = trimmedOrderNo;

        // Handle success: false (new 200 OK instead of 404)
        if (orderData.success === false) {
          setAvailableColors([]);
          setCustStyle("");
          return;
        }

        // Extract colors from OrderColors array
        if (orderData.colors && Array.isArray(orderData.colors)) {
          const colorNames = orderData.colors
            .map(c => c.original || c)
            .filter(Boolean);
          const uniqueColors = [...new Set(colorNames)];
          setAvailableColors(uniqueColors);
        } else {
          setAvailableColors([]);
        }

        // Extract and populate Buyer Style (CustStyle) from dt_orders
        if (orderData.custStyle && orderData.custStyle !== "N/A") {
          const extractedCustStyle = orderData.custStyle;
          setCustStyle(extractedCustStyle);

          if (setFormData) {
            setFormData((prev) => ({
              ...prev,
              buyerStyle: extractedCustStyle,
              custStyle: extractedCustStyle,
            }));
          }
        } else {
          setCustStyle("");
        }
      } else if (response.status === 404) {
        // 404 is expected if order doesn't exist
        setAvailableColors([]);
        setCustStyle("");
        lastFetchedColorStyleRef.current = trimmedOrderNo;
      } else {
        // Other errors (500, etc.) - log but don't spam console
        console.warn(`Failed to fetch order details for ${trimmedOrderNo}: ${response.status}`);
        setAvailableColors([]);
      }
    } catch (error) {
      // Only log non-connection errors (connection errors are handled elsewhere)
      if (!error.message.includes("Failed to fetch") && !error.message.includes("ERR_CONNECTION_REFUSED")) {
        console.error("Error fetching order colors:", error);
      }
      setAvailableColors([]);
    } finally {
      setIsLoadingColors(false);
    }
  }, [isValidStyleFormat, isLoadingColors, availableColors.length]);

  // Fetch ETD and PO from yorksys_orders by Style (YM Style)
  const fetchYorksysOrderETD = useCallback(async (orderNo, setFormData) => {
    if (!orderNo) {
      setAvailablePOs([]);
      setAvailableETDs([]);
      return;
    }

    // Validate style format before making API call
    if (!isValidStyleFormat(orderNo)) {
      setAvailablePOs([]);
      setAvailableETDs([]);
      return;
    }

    // Prevent duplicate calls for the same style
    const trimmedOrderNo = orderNo.trim();
    const normalizedStyle = trimmedOrderNo.toUpperCase();

    if (lastFetchedYorksysStyleRef.current?.toUpperCase() === normalizedStyle) {
      // Still update formData if provided, as it might have been cleared externally
      if (setFormData && (season || styleDescription)) {
        setFormData(prev => ({
          ...prev,
          season: season || prev.season,
          styleDescription: styleDescription || prev.styleDescription
        }));
      }
      return; // Already fetched for this style
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(trimmedOrderNo)}`
      );

      if (response.ok) {
        // Mark this style as fetched to prevent duplicate calls
        lastFetchedYorksysStyleRef.current = trimmedOrderNo;

        const result = await response.json();

        // Check if order exists (handle success: false in 200 response)
        if (result.success === false) {
          setAvailablePOs([]);
          setAvailableETDs([]);
          return;
        }

        // Check if order exists and has SKUData
        if (result.success && result.data && result.data.SKUData && Array.isArray(result.data.SKUData) && result.data.SKUData.length > 0) {
          // Get all unique ETD values from SKUData
          const allETDs = result.data.SKUData
            .map(sku => sku.ETD)
            .filter(etd => etd && etd.trim() !== "")
            .map(etd => {
              let etdDate = etd.trim();

              // Try to parse and format the date to YYYY-MM-DD
              try {
                if (/^\d{4}-\d{2}-\d{2}$/.test(etdDate)) {
                  return etdDate;
                } else {
                  const parsedDate = new Date(etdDate);
                  if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString().split("T")[0];
                  }
                }
              } catch (dateError) {
                console.error("Error parsing ETD date:", dateError);
              }
              return etdDate;
            })
            .filter(Boolean);

          const uniqueETDs = [...new Set(allETDs)].sort();
          setAvailableETDs(uniqueETDs.length > 0 ? uniqueETDs : []);

          // Get all unique PO values from SKUData (POLine)
          const allPOLines = result.data.SKUData
            .map(sku => sku.POLine)
            .filter(poline => poline && poline.trim() !== "")
            .map(poline => poline.trim());

          const uniquePOLines = [...new Set(allPOLines)];
          setAvailablePOs(uniquePOLines.length > 0 ? uniquePOLines : []);

          // Build fabrication string from FabricContent array
          if (result.data.FabricContent && Array.isArray(result.data.FabricContent) && result.data.FabricContent.length > 0) {
            const fabString = result.data.FabricContent
              .map(f => `${f.percentageValue}% ${f.fabricName}`)
              .join(", ");
            setFabrication(fabString);

            // Also update formData if setFormData is provided
            if (setFormData) {
              setFormData(prev => ({
                ...prev,
                fabrication: fabString
              }));
            }
          } else {
            setFabrication("");
            if (setFormData) {
              setFormData(prev => ({
                ...prev,
                fabrication: ""
              }));
            }
          }
        } else {
          setAvailablePOs([]);
          setAvailableETDs([]);
          setFabrication("");
          if (setFormData) {
            setFormData(prev => ({
              ...prev,
              fabrication: ""
            }));
          }
        }

        let extractedSeason = "";
        if (result.data.season && result.data.season !== "N/A") {
          extractedSeason = result.data.season;
          setSeason(extractedSeason);
        } else {
          setSeason("");
        }

        // Extract Style Description (Only use skuDescription)
        let description = "";

        if (result.data.skuDescription && result.data.skuDescription !== "N/A") {
          description = result.data.skuDescription;
        } else if (result.data.SKUData && Array.isArray(result.data.SKUData) && result.data.SKUData.length > 0) {
          // Fallback only to skuDescription within SKUData array if not at root
          const skuWithDesc = result.data.SKUData.find(sku => sku.skuDescription && sku.skuDescription !== "N/A");
          if (skuWithDesc) {
            description = skuWithDesc.skuDescription;
          }
        }

        if (description) {
          setStyleDescription(description);
        } else {
          setStyleDescription("");
        }

        // Populate formData with Season and Style Description if setFormData is provided
        if (setFormData) {
          setFormData(prev => ({
            ...prev,
            season: extractedSeason || '',
            styleDescription: description || ''
          }));
        }

      } else if (response.status === 404) {
        // Order not found
        lastFetchedYorksysStyleRef.current = trimmedOrderNo;
        setAvailablePOs([]);
        setAvailableETDs([]);
        setFabrication("");
        setSeason("");
        setStyleDescription("");
        if (setFormData) {
          setFormData(prev => ({
            ...prev,
            season: '',
            styleDescription: ''
          }));
        }
      } else {
        console.warn(`Failed to fetch yorksys order for ${trimmedOrderNo}: ${response.status} ${response.statusText}`);
        setAvailablePOs([]);
        setAvailableETDs([]);
        setFabrication("");
        setSeason("");
        setStyleDescription("");
      }
    } catch (error) {
      if (!error.message.includes("Failed to fetch") && !error.message.includes("ERR_CONNECTION_REFUSED")) {
        console.error("Error fetching yorksys order ETD:", error);
      }
      setAvailablePOs([]);
      setAvailableETDs([]);
      setFabrication("");
      setSeason("");
      setStyleDescription("");
    }
  }, [isValidStyleFormat]);

  // Reset all order data
  const resetOrderData = useCallback(() => {
    setAvailableColors([]);
    setAvailablePOs([]);
    setAvailableETDs([]);
    setFabrication("");
    setSeason("");
    setStyleDescription("");
    setCustStyle("");
    lastFetchedColorStyleRef.current = null;
    lastFetchedYorksysStyleRef.current = null;
  }, []);

  return {
    availableColors,
    availablePOs,
    availableETDs,
    fabrication,
    season,
    styleDescription,
    custStyle,
    isLoadingColors,
    fetchOrderColors,
    fetchYorksysOrderETD,
    resetOrderData,
    isValidStyleFormat
  };
};