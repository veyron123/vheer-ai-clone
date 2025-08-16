import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary for production deployment
if (process.env.NODE_ENV === 'production' || process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('🟢 Cloudinary configured for production storage');
}

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
 * Download image from URL and save to cloud storage (Cloudinary for production, local for dev)
 * @param {string} imageUrl - URL of the image to download
 * @param {string} type - Type of image ('original' or 'generated')
 * @returns {Promise<{localPath: string, filename: string}>}
 */
export async function downloadAndSaveImage(imageUrl, type = 'generated') {
  const filename = `${uuidv4()}.png`;
  
  // Use Cloudinary for production (Render hosting)
  if (process.env.NODE_ENV === 'production' || process.env.CLOUDINARY_CLOUD_NAME) {
    return await uploadToCloudinary(imageUrl, filename, type);
  }
  
  // Use local storage for development
  return await saveToLocal(imageUrl, filename, type);
}

/**
 * Upload image to Cloudinary
 * @param {string} imageUrl - URL of the image to upload
 * @param {string} filename - Generated filename
 * @param {string} type - Type of image
 * @returns {Promise<{localPath: string, filename: string}>}
 */
async function uploadToCloudinary(imageUrl, filename, type) {
  try {
    console.log(`📤 Uploading to Cloudinary: ${type}/${filename}`);
    
    const folder = `vheer-ai/${type}`;
    const publicId = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      public_id: publicId,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
      transformation: [
        { quality: '90' },
        { format: 'auto' }
      ]
    });
    
    console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
    
    return {
      localPath: result.secure_url,
      filename: result.original_filename || filename,
      cloudinaryId: result.public_id
    };
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    throw error;
  }
}

/**
 * Save image to local storage (development only)
 * @param {string} imageUrl - URL of the image
 * @param {string} filename - Generated filename
 * @param {string} type - Type of image
 * @returns {Promise<{localPath: string, filename: string}>}
 */
async function saveToLocal(imageUrl, filename, type) {
  try {
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
        console.log(`Image saved locally: ${localPath}`);
        resolve({ 
          localPath: localPath.replace(/\\/g, '/'), // Convert to forward slashes for URLs
          filename 
        });
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error saving image locally:', error);
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
 * @param {string} imagePath - Path or URL to the original image
 * @param {number} width - Thumbnail width (default: 300)
 * @param {number} height - Thumbnail height (default: 300)
 * @returns {Promise<string>} Path to the thumbnail
 */
export async function generateThumbnail(imagePath, width = 300, height = 300) {
  // For Cloudinary (production), use URL transformation
  if (process.env.NODE_ENV === 'production' || process.env.CLOUDINARY_CLOUD_NAME) {
    return generateCloudinaryThumbnail(imagePath, width, height);
  }
  
  // For local development, use Sharp
  return generateLocalThumbnail(imagePath, width, height);
}

/**
 * Generate thumbnail using Cloudinary URL transformation
 * @param {string} imageUrl - Cloudinary URL
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {Promise<string>} Thumbnail URL
 */
async function generateCloudinaryThumbnail(imageUrl, width, height) {
  try {
    // If it's already a Cloudinary URL, just transform it
    if (imageUrl.includes('cloudinary.com')) {
      // Extract public_id from URL
      const urlParts = imageUrl.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      
      // Get folder from URL
      const folderIndex = urlParts.indexOf('vheer-ai');
      const folder = folderIndex !== -1 ? `vheer-ai/${urlParts[folderIndex + 1]}` : 'vheer-ai/generated';
      
      // Generate thumbnail URL with transformation
      const thumbnailUrl = cloudinary.url(`${folder}/${publicId}`, {
        width: width,
        height: height,
        crop: 'fill',
        quality: '80',
        format: 'webp'
      });
      
      console.log(`📸 Cloudinary thumbnail generated: ${thumbnailUrl}`);
      return thumbnailUrl;
    }
    
    // If it's not a Cloudinary URL, upload it first
    const filename = `thumb_${uuidv4()}.webp`;
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'vheer-ai/thumbnails',
      public_id: filename.replace(/\.[^/.]+$/, ''),
      transformation: [
        { width: width, height: height, crop: 'fill' },
        { quality: '80', format: 'webp' }
      ]
    });
    
    console.log(`📸 Cloudinary thumbnail uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error generating Cloudinary thumbnail:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}

/**
 * Generate thumbnail locally using Sharp
 * @param {string} imagePath - Path to the original image
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {Promise<string>} Path to the thumbnail
 */
async function generateLocalThumbnail(imagePath, width, height) {
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
 * Delete image files from storage (Cloudinary or local)
 * @param {string} imagePath - Path/URL to the image
 * @param {string} thumbnailPath - Path/URL to the thumbnail
 * @param {string} cloudinaryId - Cloudinary public_id (if available)
 */
export async function deleteImageFiles(imagePath, thumbnailPath, cloudinaryId = null) {
  if (process.env.NODE_ENV === 'production' || process.env.CLOUDINARY_CLOUD_NAME) {
    await deleteFromCloudinary(imagePath, thumbnailPath, cloudinaryId);
  } else {
    await deleteFromLocal(imagePath, thumbnailPath);
  }
}

/**
 * Delete files from Cloudinary
 * @param {string} imagePath - Cloudinary URL
 * @param {string} thumbnailPath - Cloudinary thumbnail URL
 * @param {string} cloudinaryId - Cloudinary public_id
 */
async function deleteFromCloudinary(imagePath, thumbnailPath, cloudinaryId) {
  try {
    // Extract public_id from URL if cloudinaryId is not provided
    if (!cloudinaryId && imagePath && imagePath.includes('cloudinary.com')) {
      const urlParts = imagePath.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicIdWithExt = filename.split('.')[0];
      
      // Find folder
      const folderIndex = urlParts.indexOf('vheer-ai');
      const folder = folderIndex !== -1 ? `vheer-ai/${urlParts[folderIndex + 1]}` : 'vheer-ai/generated';
      
      cloudinaryId = `${folder}/${publicIdWithExt}`;
    }
    
    if (cloudinaryId) {
      await cloudinary.uploader.destroy(cloudinaryId);
      console.log(`🗑️ Deleted from Cloudinary: ${cloudinaryId}`);
    }
    
    // Delete thumbnail if it has a different public_id
    if (thumbnailPath && thumbnailPath !== imagePath && thumbnailPath.includes('cloudinary.com')) {
      const thumbUrlParts = thumbnailPath.split('/');
      const thumbFilename = thumbUrlParts[thumbUrlParts.length - 1];
      const thumbPublicId = thumbFilename.split('.')[0];
      const thumbFolder = 'vheer-ai/thumbnails';
      
      await cloudinary.uploader.destroy(`${thumbFolder}/${thumbPublicId}`);
      console.log(`🗑️ Deleted thumbnail from Cloudinary: ${thumbFolder}/${thumbPublicId}`);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
}

/**
 * Delete files from local storage
 * @param {string} imagePath - Local path to image
 * @param {string} thumbnailPath - Local path to thumbnail
 */
async function deleteFromLocal(imagePath, thumbnailPath) {
  try {
    if (imagePath && fs.existsSync(path.resolve(imagePath))) {
      fs.unlinkSync(path.resolve(imagePath));
      console.log(`Deleted local image: ${imagePath}`);
    }
    
    if (thumbnailPath && fs.existsSync(path.resolve(thumbnailPath))) {
      fs.unlinkSync(path.resolve(thumbnailPath));
      console.log(`Deleted local thumbnail: ${thumbnailPath}`);
    }
  } catch (error) {
    console.error('Error deleting local files:', error);
  }
}