import { SSF } from "xlsx"; // SheetJS Standard Format for date handling

/**
 * NEW LOGIC: Determines the Buyer name based on the MO/PO number.
 * @param {string} moNo - The purchase order number.
 * @returns {string} The determined buyer's name.
 */
const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";
  const upperMoNo = moNo.toUpperCase(); // Use uppercase for case-insensitive matching

  // Check for the more specific "COM" first to correctly identify MWW
  if (upperMoNo.includes("COM")) return "MWW";

  // Then, check for the more general "CO" for Costco
  if (upperMoNo.includes("CO")) return "Costco";

  // The rest of the original rules
  if (upperMoNo.includes("AR")) return "Aritzia";
  if (upperMoNo.includes("RT")) return "Reitmans";
  if (upperMoNo.includes("AF")) return "ANF";
  if (upperMoNo.includes("NT")) return "STORI";

  // Default case if no other rules match
  return "Other";
};

/** HELPER 1: Formats a JavaScript Date object into 'M/D/YYYY'. */
const formatJSDate = (date) => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
  return "";
};

/** HELPER 2: Converts an Excel serial number into a 'M/D/YYYY' date string. */
const convertExcelSerialDate = (serial) => {
  if (typeof serial === "number" && !isNaN(serial)) {
    return SSF.format("m/d/yyyy", serial);
  }
  return "";
};

/** HELPER 3: Converts an Excel serial number into a JavaScript Date object. */
const excelSerialToJSDate = (serial) => {
  return new Date((serial - 25569) * 86400 * 1000);
};

/**
 * Parses and cleans data, now also determining the buyer.
 * @param {Array<Object>} data - The raw JSON data from sheet_to_json.
 * @returns {Object} A structured object with all required data.
 */
export const cleanYorksysOrderData = (data) => {
  if (!data || data.length === 0) {
    throw new Error("The Excel file is empty or has no data rows.");
  }

  const summaryRow = data[0];
  if (!summaryRow) {
    throw new Error(
      "Could not read the first data row for summary information."
    );
  }

  // --- Extract MO No and determine Buyer right away ---
  const moNo = summaryRow["PO #"] || "N/A";
  const buyer = getBuyerFromMoNumber(moNo);

  // --- Create the detailed data list ---
  const skuDetails = data
    .map((row) => {
      const rawColor = row["COLOR"] || "";
      const color = rawColor.includes("[")
        ? rawColor.split("[")[0].trim()
        : rawColor.trim();
      const poLine = row["PO LINE ATTRIBUTE # 1"];

      return {
        sku: row["SKU #"] || "",
        etd: formatJSDate(row["ETD"]),
        eta: convertExcelSerialDate(row["ETA"]),
        poLine: poLine === "TBA" ? "" : poLine || "",
        color: color,
        qty: Number(row["QUANTITY"]) || 0
      };
    })
    .filter((detail) => detail.sku);

  // --- Aggregate data for the comprehensive PO Summary ---
  const orderSummary = {
    uniqueSkus: new Set(),
    etdDates: [],
    etaDates: [],
    uniqueColors: new Set(),
    uniquePoLines: new Set(),
    totalQty: 0
  };

  for (const row of data) {
    if (!row["SKU #"]) continue;
    orderSummary.uniqueSkus.add(row["SKU #"]);
    orderSummary.totalQty += Number(row["QUANTITY"]) || 0;

    const rawColor = row["COLOR"] || "";
    const color = rawColor.includes("[")
      ? rawColor.split("[")[0].trim()
      : rawColor.trim();
    if (color) orderSummary.uniqueColors.add(color);

    const poLine = row["PO LINE ATTRIBUTE # 1"];
    if (poLine && poLine !== "TBA") orderSummary.uniquePoLines.add(poLine);

    if (row["ETD"] instanceof Date) orderSummary.etdDates.push(row["ETD"]);
    if (typeof row["ETA"] === "number")
      orderSummary.etaDates.push(excelSerialToJSDate(row["ETA"]));
  }

  // --- Process the aggregated data into final display strings ---
  const getPeriodString = (dates) => {
    if (dates.length === 0) return "N/A";
    dates.sort((a, b) => a - b);
    const startDate = formatJSDate(dates[0]);
    const endDate = formatJSDate(dates[dates.length - 1]);
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  };

  const getUniqueDateString = (dates) => {
    if (dates.length === 0) return "N/A";
    const uniqueFormattedDates = new Set(dates.map(formatJSDate));
    return Array.from(uniqueFormattedDates).join(", ");
  };

  const poSummary = [
    {
      poNo: moNo,
      totalSkus: orderSummary.uniqueSkus.size,
      uniqueEtds: getUniqueDateString(orderSummary.etdDates),
      etdPeriod: getPeriodString(orderSummary.etdDates),
      uniqueEtas: getUniqueDateString(orderSummary.etaDates),
      etaPeriod: getPeriodString(orderSummary.etaDates),
      totalColors: orderSummary.uniqueColors.size,
      totalPoLines: orderSummary.uniquePoLines.size,
      totalQty: orderSummary.totalQty
    }
  ];

  // --- Return all data, now including the Buyer ---
  return {
    buyer: buyer, // Add the determined buyer
    factory: summaryRow["SUPPLIER/COMPANY"] || "N/A",
    moNo: moNo,
    season: summaryRow["SEASON"] || "N/A",
    style: summaryRow["STYLE"] || "N/A",
    skuDescription: summaryRow["SKU DESCRIPTION"] || "N/A",
    destination: summaryRow["DESTINATION"] || "N/A",
    shipMode: summaryRow["SHIP MODE"] || "N/A",
    currency: summaryRow["CURRENCY"] || "N/A",
    skuDetails,
    poSummary
  };
};
