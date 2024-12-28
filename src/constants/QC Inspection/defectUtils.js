import { defectImages } from './defects';

/**
 * Get the image URL for a defect ID
 * @param {string} defectId - The ID of the defect
 * @returns {string} The image URL for the defect
 */
export const getDefectImage = (defectId) => {
  return defectImages[defectId] || "/IMG/qcc.png";
};