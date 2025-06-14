// src/utils/fractionUtils.js
export const decimalToFraction = (value) => {
  if (value === null || value === undefined) return "";
  if (value === 0) return "0";
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  const whole = Math.floor(absValue);
  const decimal = absValue - whole;

  if (decimal === 0) return `${sign}${whole}`;

  const fractions = [
    { fraction: "1/16", value: 1 / 16 },
    { fraction: "1/8", value: 1 / 8 },
    { fraction: "3/16", value: 3 / 16 },
    { fraction: "1/4", value: 1 / 4 },
    { fraction: "5/16", value: 5 / 16 },
    { fraction: "3/8", value: 3 / 8 },
    { fraction: "7/16", value: 7 / 16 },
    { fraction: "1/2", value: 1 / 2 },
    { fraction: "9/16", value: 9 / 16 },
    { fraction: "5/8", value: 5 / 8 },
    { fraction: "11/16", value: 11 / 16 },
    { fraction: "3/4", value: 3 / 4 },
    { fraction: "13/16", value: 13 / 16 },
    { fraction: "7/8", value: 7 / 8 },
    { fraction: "15/16", value: 15 / 16 },
    { fraction: "1", value: 1 }
  ];

  for (const f of fractions) {
    if (Math.abs(f.value - decimal) < 0.001) {
      return whole > 0
        ? `${sign}${whole} ${f.fraction}`
        : `${sign}${f.fraction}`;
    }
  }
  return `${sign}${absValue.toFixed(3)}`;
};

//Roving Buyer selection

const BUYER_MAPPINGS = [
  { pattern: "COM", name: "MWW" },    // "COM" is intentionally first to be checked before "CO"
  { pattern: "CO", name: "Costco" },
  { pattern: "AR", name: "Aritzia" },
  { pattern: "RT", name: "Reitmans" },
  { pattern: "AF", name: "ANF" },
  { pattern: "NT", name: "STORI" },
  // Add more mappings here as needed
];

export const determineBuyerRoving = (MONo) => {
  if (!MONo) {
    return "Other";
  }

  for (const mapping of BUYER_MAPPINGS) {
    if (MONo.includes(mapping.pattern)) {
      return mapping.name;
    }
  }

  return "Other";
};
