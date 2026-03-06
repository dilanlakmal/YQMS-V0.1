/**
 * Edit Handlers
 * Handlers for edit report functionality
 */

import { fetchOrderDetailsAPI, fetchYorksysOrderAPI } from "../services";
import { normalizeDateForInput } from "../helpers";

/**
 * Prepare edit form data from report
 * @param {object} report - Report object
 * @param {function} setEditFormData - State setter
 * @param {function} setEditAvailableColors - State setter
 * @param {function} setEditAvailablePOs - State setter
 * @param {function} setEditAvailableETDs - State setter
 * @param {function} setEditAvailableSizes - State setter
 */
export const prepareEditFormData = async (
  report,
  setEditFormData,
  setEditAvailableColors,
  setEditAvailablePOs,
  setEditAvailableETDs,
  setEditAvailableSizes,
) => {
  const ensureArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.trim()) {
      if (val.startsWith("[") && val.endsWith("]")) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          /* fall through to split */
        }
      }
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return val ? [val] : [];
  };

  // Populate edit form with current report data
  setEditFormData({
    reportType: report.reportType || "Home Wash Test",
    color: ensureArray(report.color),
    buyerStyle: report.buyerStyle || "",
    po: ensureArray(report.po),
    exFtyDate: ensureArray(report.exFtyDate),
    factory: report.factory || "",
    sendToHomeWashingDate: normalizeDateForInput(report.sendToHomeWashingDate),
    sampleSize: (() => {
      const sizes = ensureArray(report.reportSampleSizes ?? report.sampleSize);
      if (sizes.length > 0) return sizes;

      return ensureArray(report.size || report.range);
    })(),
  });

  // Fetch available options for the report's ymStyle
  if (report.ymStyle) {
    try {
      // Fetch colors
      const orderDetails = await fetchOrderDetailsAPI(report.ymStyle);
      setEditAvailableColors(orderDetails.colors || []);

      // Fetch ETD, PO, and Sizes
      const yorksysData = await fetchYorksysOrderAPI(report.ymStyle);
      setEditAvailablePOs(yorksysData.pos || []);
      setEditAvailableETDs(yorksysData.etds || []);
      const yorksysSizes = yorksysData.sizeList || yorksysData.SizeList || [];

      // 1. Get current report sizes (priority)
      const currentReportSizes = (() => {
        const sizes = ensureArray(
          report.reportSampleSizes ?? report.sampleSize,
        );
        if (sizes.length > 0) return sizes;
        return ensureArray(report.size || report.range);
      })();

      // Use current report sizes as the ONLY available options if they exist
      // Otherwise fall back to fetched style sizes
      let allSizes;
      if (currentReportSizes.length > 0) {
        allSizes = new Set(currentReportSizes);
      } else {
        allSizes = new Set(yorksysSizes);
        // Also check orderDetails for sizes as fallback
        if (orderDetails.colorQtyBySize) {
          Object.values(orderDetails.colorQtyBySize).forEach((sizesMap) =>
            Object.keys(sizesMap).forEach((size) => allSizes.add(size)),
          );
        } else if (
          orderDetails.sizeList &&
          Array.isArray(orderDetails.sizeList)
        ) {
          orderDetails.sizeList.forEach((s) => allSizes.add(s));
        }
      }

      // Enhanced Size Sorting
      const SIZE_ORDER = [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "XXXL",
        "4XL",
        "5XL",
      ];
      const sortedAvailableSizes = [...allSizes].sort((a, b) => {
        const ia = SIZE_ORDER.indexOf(String(a).toUpperCase());
        const ib = SIZE_ORDER.indexOf(String(b).toUpperCase());
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return String(a).localeCompare(String(b));
      });

      setEditAvailableSizes(sortedAvailableSizes);

      // For Colors, POs, and ETDs: We still show all available style options
      // but ensure current ones are always included set
      const currentColors = ensureArray(report.color);
      const allAvailableColors = new Set([
        ...(orderDetails.colors || []),
        ...currentColors,
      ]);
      setEditAvailableColors([...allAvailableColors]);

      const currentPOs = ensureArray(report.po);
      const allAvailablePOs = new Set([
        ...(yorksysData.pos || []),
        ...currentPOs,
      ]);
      setEditAvailablePOs([...allAvailablePOs]);

      const currentETDs = ensureArray(report.exFtyDate);
      const allAvailableETDs = new Set([
        ...(yorksysData.etds || []),
        ...currentETDs,
      ]);
      setEditAvailableETDs([...allAvailableETDs]);
    } catch (error) {
      console.error("Error fetching order data for edit:", error);
      setEditAvailableColors([]);
      setEditAvailablePOs([]);
      setEditAvailableETDs([]);
      setEditAvailableSizes([]);
    }
  }
};

/**
 * Handle edit form input change
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditFormInputChange = (
  field,
  value,
  editFormData,
  setEditFormData,
) => {
  setEditFormData({
    ...editFormData,
    [field]: value,
  });
};

/**
 * Handle edit color selection
 * @param {string} color - Color to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditColorSelect = (color, editFormData, setEditFormData) => {
  const currentColors = editFormData.color || [];
  const newColors = currentColors.includes(color)
    ? currentColors.filter((c) => c !== color)
    : [...currentColors, color];

  setEditFormData({
    ...editFormData,
    color: newColors,
  });
};

/**
 * Handle edit PO selection
 * @param {string} po - PO to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditPOSelect = (po, editFormData, setEditFormData) => {
  const currentPOs = editFormData.po || [];
  const newPOs = currentPOs.includes(po)
    ? currentPOs.filter((p) => p !== po)
    : [...currentPOs, po];

  setEditFormData({
    ...editFormData,
    po: newPOs,
  });
};

/**
 * Handle edit ETD selection
 * @param {string} etd - ETD to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditETDSelect = (etd, editFormData, setEditFormData) => {
  const currentETDs = editFormData.exFtyDate || [];
  const newETDs = currentETDs.includes(etd)
    ? currentETDs.filter((e) => e !== etd)
    : [...currentETDs, etd];

  setEditFormData({
    ...editFormData,
    exFtyDate: newETDs,
  });
};

/**
 * Handle edit size selection
 * @param {string} size - Size to toggle
 * @param {object} editFormData - Current form data
 * @param {function} setEditFormData - State setter
 */
export const handleEditSizeSelect = (size, editFormData, setEditFormData) => {
  const currentSizes = editFormData.sampleSize || [];
  const newSizes = currentSizes.includes(size)
    ? currentSizes.filter((s) => s !== size)
    : [...currentSizes, size];

  setEditFormData({
    ...editFormData,
    sampleSize: newSizes,
  });
};
