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
  const [isLoadingColors, setIsLoadingColors] = useState(false);
  const lastFetchedStyleRef = useRef(null);

  // Helper function to validate if order number looks like a valid YM Style
  const isValidStyleFormat = useCallback((orderNo) => {
    if (!orderNo) return false;
    const trimmed = orderNo.trim();
    
    // Minimum length check - YM Styles are typically at least 4-5 characters
    if (trimmed.length < 4) return false;
    
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
    // Check if we're already loading or if this is the same style we just fetched
    if (isLoadingColors || (lastFetchedStyleRef.current === trimmedOrderNo && availableColors.length > 0)) {
      return; // Already loading or already fetched
    }

    setIsLoadingColors(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/order-details/${encodeURIComponent(trimmedOrderNo)}`
      );

      if (response.ok) {
        const orderData = await response.json();

        // Mark this style as fetched
        lastFetchedStyleRef.current = trimmedOrderNo;

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
        if (orderData.custStyle && orderData.custStyle !== "N/A" && setFormData) {
          setFormData((prev) => ({
            ...prev,
            buyerStyle: orderData.custStyle,
          }));
        }
      } else if (response.status === 404) {
        // 404 is expected if order doesn't exist - not an error, just no data
        setAvailableColors([]);
        lastFetchedStyleRef.current = trimmedOrderNo; // Mark as fetched to prevent retries
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
  const fetchYorksysOrderETD = useCallback(async (orderNo) => {
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
    if (lastFetchedStyleRef.current === trimmedOrderNo) {
      return; // Already fetched for this style
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/by-style/${encodeURIComponent(trimmedOrderNo)}`
      );

      if (response.ok) {
        // Mark this style as fetched to prevent duplicate calls
        lastFetchedStyleRef.current = trimmedOrderNo;
        
        const result = await response.json();

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
        } else {
          setAvailablePOs([]);
          setAvailableETDs([]);
        }
      } else if (response.status === 404) {
        // Order not found - this is expected if style doesn't exist in yorksys_orders
        // Mark as fetched to prevent duplicate calls for non-existent orders
        lastFetchedStyleRef.current = trimmedOrderNo;
        setAvailablePOs([]);
        setAvailableETDs([]);
        // Note: Browser console will show 404, but this is expected behavior
        // Not all YM Styles exist in yorksys_orders collection
      } else {
        // Only log non-404 errors (500, etc.)
        console.warn(`Failed to fetch yorksys order for ${trimmedOrderNo}: ${response.status} ${response.statusText}`);
        setAvailablePOs([]);
        setAvailableETDs([]);
      }
    } catch (error) {
      // Only log non-connection errors
      if (!error.message.includes("Failed to fetch") && !error.message.includes("ERR_CONNECTION_REFUSED")) {
        console.error("Error fetching yorksys order ETD:", error);
      }
      setAvailablePOs([]);
      setAvailableETDs([]);
    }
  }, [isValidStyleFormat]);

  // Reset all order data
  const resetOrderData = useCallback(() => {
    setAvailableColors([]);
    setAvailablePOs([]);
    setAvailableETDs([]);
    lastFetchedStyleRef.current = null;
  }, []);

  return {
    availableColors,
    availablePOs,
    availableETDs,
    isLoadingColors,
    fetchOrderColors,
    fetchYorksysOrderETD,
    resetOrderData,
    isValidStyleFormat,
  };
};

