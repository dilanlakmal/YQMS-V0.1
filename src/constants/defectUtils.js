import { defectImages } from './defectImages';

/**
 * Get the image URL for a defect ID
 * @param {string} defectId - The ID of the defect
 * @returns {string} The image URL for the defect
 */
export const getDefectImage = (defectId) => {
  return defectImages[defectId] || "/qcc.png";
};