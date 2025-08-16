import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import axios from 'axios';

// Ensure upload directories exist
const uploadDirs = [
  'uploads/images/originals',
  'uploads/images/generated', 
  'uploads/images/thumbnails'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Download image from URL and save to local storage
 * @param {string} imageUrl - URL of the image to download
 * @param {string} type - Type of image ('original' or 'generated')
 * @returns {Promise<{localPath: string, filename: string}>}
 */
export async function downloadAndSaveImage(imageUrl, type = 'generated') {
  try {
    const filename = `${uuidv4()}.png`;
    const subDir = type === 'original' ? 'originals' : 'generated';
    const localPath = path.join('uploads', 'images', subDir, filename);
    const fullPath = path.resolve(localPath);

    // Download image
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 30000
    });

    // Save to file
    const writer = fs.createWriteStream(fullPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Image saved to: ${localPath}`);
        resolve({ 
          localPath: localPath.replace(/\\/g, '/'), // Convert to forward slashes for URLs
          filename 
        });
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading and saving image:', error);
    throw error;
  }
}

/**
 * Save base64 image to local storage
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} type - Type of image ('original' or 'generated')
 * @returns {Promise<{localPath: string, filename: string}>}
 */
export async function saveBase64Image(base64Data, type = 'generated') {
  try {
    const filename = `${uuidv4()}.png`;
    const subDir = type === 'original' ? 'originals' : 'generated';
    const localPath = path.join('uploads', 'images', subDir, filename);
    const fullPath = path.resolve(localPath);

    // Remove data URL prefix if present
    const base64Only = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Save to file
    const buffer = Buffer.from(base64Only, 'base64');
    fs.writeFileSync(fullPath, buffer);

    console.log(`Base64 image saved to: ${localPath}`);
    return { 
      localPath: localPath.replace(/\\/g, '/'), // Convert to forward slashes for URLs
      filename 
    };
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw error;
  }
}

/**
 * Generate thumbnail for an image
 * @param {string} imagePath - Path to the original image
 * @param {number} width - Thumbnail width (default: 300)
 * @param {number} height - Thumbnail height (default: 300)
 * @returns {Promise<string>} Path to the thumbnail
 */
export async function generateThumbnail(imagePath, width = 300, height = 300) {
  try {
    const filename = `thumb_${uuidv4()}.webp`;
    const thumbnailPath = path.join('uploads', 'images', 'thumbnails', filename);
    const fullThumbnailPath = path.resolve(thumbnailPath);
    const fullImagePath = path.resolve(imagePath);

    await sharp(fullImagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(fullThumbnailPath);

    console.log(`Thumbnail generated: ${thumbnailPath}`);
    return thumbnailPath.replace(/\\/g, '/');
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

/**
 * Check if user should have images saved
 * @param {Object} user - User object with subscription info
 * @returns {boolean}
 */
export function shouldSaveImageForUser(user) {
  // Special case for @unitradecargo_1755153796918
  if (user.username === 'unitradecargo_1755153796918') {
    return true;
  }

  // Check if user has paid subscription
  if (user.subscription && user.subscription.plan !== 'FREE') {
    return true;
  }

  return false;
}

/**
 * Delete image files from storage
 * @param {string} imagePath - Path to the image
 * @param {string} thumbnailPath - Path to the thumbnail
 */
export async function deleteImageFiles(imagePath, thumbnailPath) {
  try {
    if (imagePath && fs.existsSync(path.resolve(imagePath))) {
      fs.unlinkSync(path.resolve(imagePath));
      console.log(`Deleted image: ${imagePath}`);
    }
    
    if (thumbnailPath && fs.existsSync(path.resolve(thumbnailPath))) {
      fs.unlinkSync(path.resolve(thumbnailPath));
      console.log(`Deleted thumbnail: ${thumbnailPath}`);
    }
  } catch (error) {
    console.error('Error deleting image files:', error);
  }
}