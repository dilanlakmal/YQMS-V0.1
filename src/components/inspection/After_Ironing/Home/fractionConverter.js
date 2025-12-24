/**
 * Converts a decimal number to its fraction representation
 * @param {number|string} decimal - The decimal number to convert
 * @returns {string} - The fraction representation (e.g., "1/8", "3/16")
 */
export const decimalToFraction = (decimal) => {
  if (!decimal || decimal === 0) return '0';
  
  const num = parseFloat(decimal);
  if (isNaN(num)) return decimal.toString();
  
  // Handle negative numbers
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  // Common denominators for garment measurements (typically in inches)
  const denominators = [2, 4, 8, 16, 32, 64];
  
  // Find the best fraction representation
  let bestFraction = absNum.toString();
  let minError = Infinity;
  
  for (const denominator of denominators) {
    const numerator = Math.round(absNum * denominator);
    const fractionValue = numerator / denominator;
    const error = Math.abs(fractionValue - absNum);
    
    if (error < minError && error < 0.001) { // Tolerance for precision
      minError = error;
      
      if (numerator === 0) {
        bestFraction = '0';
      } else if (numerator === denominator) {
        bestFraction = '1';
      } else {
        // Simplify the fraction
        const gcd = findGCD(numerator, denominator);
        const simplifiedNum = numerator / gcd;
        const simplifiedDen = denominator / gcd;
        
        if (simplifiedDen === 1) {
          bestFraction = simplifiedNum.toString();
        } else {
          bestFraction = `${simplifiedNum}/${simplifiedDen}`;
        }
      }
    }
  }
  
  // If no good fraction found, return decimal with limited precision
  if (minError === Infinity || minError > 0.001) {
    bestFraction = absNum.toFixed(3).replace(/\.?0+$/, '');
  }
  
  return isNegative ? `-${bestFraction}` : bestFraction;
};

/**
 * Finds the Greatest Common Divisor of two numbers
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
const findGCD = (a, b) => {
  return b === 0 ? a : findGCD(b, a % b);
};

/**
 * Gets the tolerance value as fraction, with fallback to decimal
 * @param {object} point - The measurement point object
 * @param {string} type - 'plus' or 'minus'
 * @returns {string}
 */
export const getToleranceAsFraction = (point, type) => {
  const fractionKey = type === 'plus' ? 'tolerancePlus_fraction' : 'toleranceMinus_fraction';
  const decimalKey = type === 'plus' ? 'tolerancePlus' : 'toleranceMinus';
  
  // First try to use existing fraction value
  if (point[fractionKey]) {
    return point[fractionKey];
  }
  
  // If no fraction exists, convert decimal to fraction
  if (point[decimalKey] !== undefined && point[decimalKey] !== null) {
    return decimalToFraction(point[decimalKey]);
  }
  
  return 'N/A';
};
