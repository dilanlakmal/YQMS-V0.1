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


export const getResult = (bundleQtyCheck, totalReject) => {
  if (bundleQtyCheck === 5) return totalReject > 1 ? "Fail" : "Pass";
  if (bundleQtyCheck === 9) return totalReject > 3 ? "Fail" : "Pass";
  if (bundleQtyCheck === 14) return totalReject > 5 ? "Fail" : "Pass";
  if (bundleQtyCheck === 20) return totalReject > 7 ? "Fail" : "Pass";
  return "N/A";
};