/**
 * Converts a string that may represent a whole number, a simple fraction, or a mixed fraction to a decimal.
 * This is the UPDATED and CORRECTED version.
 * @param {string | number} value - The input string or number.
 * @returns {{ raw: string | number, decimal: number | null }} An object with the original value and its decimal conversion.
 */

const fractionToDecimal = (value) => {
  const originalValue = value; // This will now be the formatted string like "13 3/4"

  if (value === null || value === undefined || String(value).trim() === "") {
    return { raw: originalValue, decimal: null };
  }

  // FIX 2: Since `raw: false` in the reader gives us strings, we can remove the `typeof value === "number"` check.
  // The function now assumes it's always working with a string.

  // Normalize all possible fraction slashes ('⁄' and '/') and trim whitespace.
  const strValue = String(value).trim().replace(/⁄/g, "/");

  let total = 0;

  try {
    // Check for mixed fraction (e.g., "23 3/8" or "-1 1/2")
    if (strValue.includes(" ") && strValue.includes("/")) {
      const parts = strValue.split(" ");
      const whole = parseFloat(parts[0]);
      const fractionParts = parts[1].split("/");
      const numerator = parseFloat(fractionParts[0]);
      const denominator = parseFloat(fractionParts[1]);

      if (
        isNaN(whole) ||
        isNaN(numerator) ||
        isNaN(denominator) ||
        denominator === 0
      ) {
        throw new Error("Invalid mixed fraction");
      }

      total = whole + (Math.sign(whole) || 1) * (numerator / denominator);
    }
    // Check for simple fraction (e.g., "1/2" or "-1/2")
    else if (strValue.includes("/")) {
      const fractionParts = strValue.split("/");
      const numerator = parseFloat(fractionParts[0]);
      const denominator = parseFloat(fractionParts[1]);

      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        throw new Error("Invalid simple fraction");
      }
      total = numerator / denominator;
    }
    // It's a regular number (as a string, e.g., "13.75" or "12")
    else {
      total = parseFloat(strValue);
    }

    const decimal = isNaN(total) ? null : parseFloat(total.toFixed(4));

    // This is now perfect. `originalValue` is the desired fraction string, and `decimal` is the calculated number.
    return { raw: originalValue, decimal: decimal };
  } catch (e) {
    console.error(`Could not parse fraction: "${originalValue}"`, e);
    return { raw: originalValue, decimal: null };
  }
};

/**
 * Detects column order for Measurement Points and Tolerances and returns the correct indices.
 * (No changes needed in this function)
 */
const detectAndFixColumns = (data) => {
  let engColIndex = 0;
  let chiColIndex = 1;
  const firstDataRowCell = data[2] && data[2][0] ? String(data[2][0]) : "";
  if (/[^\u0000-\u00ff]/.test(firstDataRowCell)) {
    engColIndex = 1;
    chiColIndex = 0;
  }

  let tolMinusIndex = 2;
  let tolPlusIndex = 3;
  let columnsNeedSwap = false;
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (row && row[tolPlusIndex] !== null) {
      const { decimal } = fractionToDecimal(row[tolPlusIndex]);
      if (decimal !== null && decimal < 0) {
        columnsNeedSwap = true;
        break;
      }
    }
  }

  if (columnsNeedSwap) {
    tolMinusIndex = 3;
    tolPlusIndex = 2;
  }

  return { engColIndex, chiColIndex, tolMinusIndex, tolPlusIndex };
};

/**
 * Parses and cleans the raw data from a washing spec Excel sheet.
 * (No changes needed in this function)
 */
export const cleanWashingSpecData = (data, sheetName) => {
  if (!data || data.length < 4) {
    throw new Error(
      `Sheet "${sheetName}" has insufficient data or is in the wrong format.`
    );
  }

  const relevantData = data.slice(1);

  const { engColIndex, chiColIndex, tolMinusIndex, tolPlusIndex } =
    detectAndFixColumns(relevantData);

  const headerRow1 = relevantData[0];
  const headerRow2 = relevantData[1];
  const headers = [];
  const columnIndexMap = {};
  let shuritsuColumnIndex = -1;
  headerRow1.forEach((cell, index) => {
    if (cell && typeof cell === "string" && cell.trim() === "缩率") {
      shuritsuColumnIndex = index;
    }
  });

  for (let i = 4; i < headerRow1.length; i++) {
    if (i === shuritsuColumnIndex) continue;

    const size = headerRow1[i];
    if (size !== null && size !== undefined && String(size).trim() !== "") {
      const spec1 = headerRow2[i];
      const spec2 = headerRow2[i + 1];

      if (spec1 && spec2) {
        headers.push({
          size: String(size).trim(),
          columns: [
            { name: "After Washing", original: String(spec1).trim() },
            { name: "Before Washing", original: String(spec2).trim() }
          ]
        });
        columnIndexMap[String(size).trim()] = [i, i + 1];
        i++;
      }
    }
  }

  const dataRows = relevantData.slice(2);
  const cleanedRows = [];

  dataRows.forEach((row) => {
    if (row.every((cell) => cell === null || String(cell).trim() === ""))
      return;

    const rowData = {
      "Measurement Point - Eng": row[engColIndex] || "",
      "Measurement Point - Chi": row[chiColIndex] || "",
      "Tol Minus": fractionToDecimal(row[tolMinusIndex]),
      "Tol Plus": fractionToDecimal(row[tolPlusIndex]),
      specs: {}
    };

    headers.forEach((header) => {
      const [col1Index, col2Index] = columnIndexMap[header.size];
      rowData.specs[header.size] = {
        "After Washing": fractionToDecimal(row[col1Index]),
        "Before Washing": fractionToDecimal(row[col2Index])
      };
    });

    cleanedRows.push(rowData);
  });

  return {
    sheetName,
    headers,
    rows: cleanedRows
  };
};
