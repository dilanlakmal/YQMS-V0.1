import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Compress and resize image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @returns {Buffer} - Compressed image buffer
 */
export const compressImage = async (imageBuffer, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    let sharpInstance = sharp(imageBuffer);

    // Resize image while maintaining aspect ratio
    sharpInstance = sharpInstance.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });

    // Apply compression based on format
    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Save compressed image to disk
 * @param {Buffer} imageBuffer - Image buffer to save
 * @param {string} filename - Filename with extension
 * @param {string} subfolder - Subfolder name (defect, measurement, accessory)
 * @returns {string} - Relative path to saved image
 */
export const saveCompressedImage = async (imageBuffer, filename, subfolder) => {
  try {
    // Create directory structure: public/storage/roving/{subfolder}/
    const baseDir = path.join(process.cwd(), 'backend', 'public', 'storage', 'roving', subfolder);
    
    // Ensure directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const filePath = path.join(baseDir, filename);
    
    // Compress image before saving
    const compressedBuffer = await compressImage(imageBuffer, {
      width: 800,
      height: 600,
      quality: 85,
      format: 'jpeg'
    });

    // Save to disk
    fs.writeFileSync(filePath, compressedBuffer);

    // Return relative path for database storage
    return `/storage/roving/${subfolder}/${filename}`;
  } catch (error) {
    console.error('Error saving compressed image:', error);
    throw error;
  }
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for filename
 * @returns {string} - Unique filename
 */
export const generateUniqueFilename = (originalName, prefix = 'img') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const extension = path.extname(originalName) || '.jpg';
  return `${prefix}-${timestamp}-${random}${extension}`;
};

/**
 * Delete image file
 * @param {string} imagePath - Relative path to image
 */
export const deleteImage = (imagePath) => {
  try {
    if (imagePath && imagePath.startsWith('/storage/')) {
      const fullPath = path.join(process.cwd(), 'backend', 'public', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};