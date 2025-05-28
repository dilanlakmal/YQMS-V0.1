import { 
  QC2OrderData,
  ymEcoConnection
 } from "../Config/mongodb.js";

export const normalizeDateString = (dateStr) => {
  if (!dateStr) return null;
  try {
    // Attempt to parse the date string, this helps validate it and handle various separators
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) { // Check if date is valid
        // Fallback for "M/D/YYYY" or "MM/DD/YYYY" if new Date() fails for that specific format
        const parts = dateStr.split(/[\/\-\.]/); // Split by common separators
        if (parts.length === 3) {
            const month = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            if (!isNaN(month) && !isNaN(day) && !isNaN(year) && year.toString().length === 4) {
                 // Ensure parts are valid numbers and year is 4 digits
                const normalizedMonth = ("0" + month).slice(-2);
                const normalizedDay = ("0" + day).slice(-2);
                return `${normalizedMonth}/${normalizedDay}/${year}`;
            }
        }
      throw new Error("Invalid date format after attempting to parse parts.");
    }

    // If new Date() parsed it successfully, format it
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const day = ("0" + dateObj.getDate()).slice(-2);
    const year = dateObj.getFullYear();
    return `${month}/${day}/${year}`;

  } catch (error) {
    console.error(`Invalid date string provided to normalizeDateString: ${dateStr}`, error);
    return null; 
  }
};

// const normalizeDateString = (dateStr) => {
//   if (!dateStr) return null;
//   try {
//     const [month, day, year] = dateStr.split("/").map((part) => part.trim());
//     if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) {
//       throw new Error("Invalid date format");
//     }
//     // Add leading zeros to month and day
//     const normalizedMonth = ("0" + parseInt(month, 10)).slice(-2);
//     const normalizedDay = ("0" + parseInt(day, 10)).slice(-2);
//     return `${normalizedMonth}/${normalizedDay}/${year}`;
//   } catch (error) {
//     console.error(`Invalid date string: ${dateStr}`, error);
//     return null;
//   }
// };


export const getResult = (bundleQtyCheck, totalReject) => {
  if (bundleQtyCheck === 5) return totalReject > 1 ? "Fail" : "Pass";
  if (bundleQtyCheck === 9) return totalReject > 3 ? "Fail" : "Pass";
  if (bundleQtyCheck === 14) return totalReject > 5 ? "Fail" : "Pass";
  if (bundleQtyCheck === 20) return totalReject > 7 ? "Fail" : "Pass";
  return "N/A";
};

export const formatDateToMMDDYYYY = (dateInput) => {
   if (!dateInput) return null;
  const d = new Date(dateInput); // Handles ISO string or Date object
  const month = d.getMonth() + 1; // No padding
  const day = d.getDate(); // No padding
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export const generateRandomId = async () => {
  let randomId;
  let isUnique = false;

  while (!isUnique) {
    randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
    if (!existing) isUnique = true;
  }

  return randomId;
};

// Helper function to sanitize input for filenames
export const sanitize = (input) => {
  if (typeof input !== "string") input = String(input);
  let sane = input.replace(/[^a-zA-Z0-9-_]/g, "_");
  if (sane === "." || sane === "..") return "_";
  return sane;
};

export const getOrdinal = (n) => {
  if (n <= 0) return String(n);
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0] || "th");
}

export const formatDate = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escapes . * + ? ^ $ { } ( ) | [ ] \
};

// This endpoint is unused
export async function fetchOrderDetails(mono) {
  const collection = ymEcoConnection.db.collection("dt_orders");
  const order = await collection.findOne({ Order_No: mono });

  const colorMap = new Map();
  order.OrderColors.forEach((c) => {
    const key = c.Color.toLowerCase().trim();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        originalColor: c.Color.trim(),
        sizes: new Map(),
      });
    }

    c.OrderQty.forEach((q) => {
      if (q.Quantity > 0) {
        const sizeParts = q.Size.split(";");
        const cleanSize = sizeParts[0].trim();
        const sizeKey = cleanSize.toLowerCase();
        if (!colorMap.get(key).sizes.has(sizeKey)) {
          colorMap.get(key).sizes.set(sizeKey, cleanSize);
        }
      }
    });
  });

  return {
    engName: order.EngName,
    totalQty: order.TotalQty,
    colors: Array.from(colorMap.values()).map((c) => c.originalColor),
    colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
      acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes.values());
      return acc;
    }, {}),
  };
}
