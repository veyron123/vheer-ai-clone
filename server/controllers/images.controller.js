import { PrismaClient } from '@prisma/client';
import { downloadAndSaveImage, generateThumbnail, shouldSaveImageForUser, deleteImageFiles } from '../utils/imageStorage.js';
import { getStorageProvider } from '../utils/storageProvider.js';

const prisma = new PrismaClient();

/**
 * Save generated image to user's gallery
 * @param {Object} imageData - Image data to save
 * @param {Object} user - User object
 * @param {Object} generation - Generation record
 * @returns {Promise<Object>} Saved image record
 */
/**
 * Upload image URL to IMGBB for HTTPS compatibility
 */
async function uploadToImgbb(imageUrl) {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
  
  if (!IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY not configured');
  }

  try {
    console.log('📤 [IMGBB] Downloading image from:', imageUrl);
    
    // Download image from URL  
    const axios = (await import('axios')).default;
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    // Convert to base64
    const base64 = Buffer.from(response.data).toString('base64');
    
    // Upload to IMGBB
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    
    const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (imgbbResponse.data?.success && imgbbResponse.data?.data?.url) {
      console.log('✅ [IMGBB] Upload successful:', imgbbResponse.data.data.url);
      return imgbbResponse.data.data.url;
    } else {
      throw new Error('IMGBB upload failed - no URL in response');
    }
  } catch (error) {
    console.error('❌ [IMGBB] Upload error:', error.message);
    throw error;
  }
}

export async function saveGeneratedImage(imageData, user, generation) {
  try {
    console.log('Starting to save generated image for user:', user.username);
    
    // Check if user should have images saved
    if (!shouldSaveImageForUser(user)) {
      console.log('User does not have image saving enabled - skipping save');
      return null;
    }

    const { url: imageUrl, width = 1024, height = 1024 } = imageData;
    
    // 🚨 CRITICAL FIX: Always use IMGBB for HTTPS compatibility
    // Instead of using StorageProvider (which defaults to localhost), 
    // upload to IMGBB to ensure HTTPS URLs work on production
    console.log('🔄 [HTTPS FIX] Uploading to IMGBB for HTTPS compatibility...');
    const imgbbUrl = await uploadToImgbb(imageUrl);
    
    const uploadResult = {
      url: imgbbUrl,
      path: `imgbb/${Date.now()}`,
      filename: `imgbb-${Date.now()}.png`
    };
    
    const thumbnailResult = {
      url: imgbbUrl, // Use same IMGBB URL as thumbnail
      path: uploadResult.path,
      filename: uploadResult.filename
    };
    
    console.log('✅ Upload complete:', {
      imageUrl: uploadResult.url,
      thumbnailUrl: thumbnailResult.url,
      cloudPath: uploadResult.path
    });
    
    // Save to database with cloudPath for deletion capability
    const savedImage = await prisma.image.create({
      data: {
        userId: user.id,
        generationId: generation.id,
        url: uploadResult.url,
        thumbnailUrl: thumbnailResult.url,
        prompt: generation.prompt,
        negativePrompt: generation.negativePrompt,
        model: generation.model,
        style: generation.style,
        width: parseInt(width),
        height: parseInt(height),
        isPublic: false, // Default to private
        likes: 0,
        views: 0,
        // CRITICAL: Store cloud path for deletion and "My Images" filtering
        cloudPath: uploadResult.path
      }
    });

    console.log('✅ Image saved to database with cloudPath:', savedImage.id, 'cloudPath:', uploadResult.path);
    return savedImage;
  } catch (error) {
    console.error('❌ Error saving generated image:', error);
    throw error;
  }
}

/**
 * Get user's saved images
 */
export const getMyImages = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user should have access to "My Images"
    if (!shouldSaveImageForUser(req.user)) {
      return res.json({ 
        success: true,
        images: [],
        total: 0,
        message: 'Upgrade to a paid plan to save images permanently'
      });
    }

    const images = await prisma.image.findMany({
      where: { 
        userId,
        // Only show images that were actually saved to storage (have cloudPath)
        cloudPath: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        generation: {
          select: {
            id: true,
            model: true,
            style: true,
            createdAt: true
          }
        }
      }
    });

    res.json({ 
      success: true,
      images,
      total: images.length
    });
  } catch (error) {
    console.error('Error fetching user images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch images',
      message: error.message 
    });
  }
};

/**
 * Update image visibility (public/private)
 */
export const updateImageVisibility = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { isPublic } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if image belongs to user
    const image = await prisma.image.findFirst({
      where: { 
        id: imageId,
        userId 
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update visibility
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: { isPublic: Boolean(isPublic) }
    });

    res.json({ 
      success: true,
      image: updatedImage,
      message: `Image ${isPublic ? 'published' : 'made private'}` 
    });
  } catch (error) {
    console.error('Error updating image visibility:', error);
    res.status(500).json({ 
      error: 'Failed to update image visibility',
      message: error.message 
    });
  }
};

/**
 * Delete user's image
 */
export const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if image belongs to user
    const image = await prisma.image.findFirst({
      where: { 
        id: imageId,
        userId 
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Extract file paths from URLs (handle both local and Cloudinary URLs)
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const imagePath = image.url?.replace(`${serverUrl}/`, '').replace('http://localhost:5000/', '');
    const thumbnailPath = image.thumbnailUrl?.replace(`${serverUrl}/`, '').replace('http://localhost:5000/', '');

    // Delete from database first
    await prisma.image.delete({
      where: { id: imageId }
    });

    // Delete files from storage
    await deleteImageFiles(imagePath, thumbnailPath);

    res.json({ 
      success: true,
      message: 'Image deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      message: error.message 
    });
  }
};

/**
 * Get public images gallery
 */
export const getPublicImages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const images = await prisma.image.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });

    const total = await prisma.image.count({
      where: { isPublic: true }
    });

    res.json({ 
      success: true,
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching public images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch public images',
      message: error.message 
    });
  }
};

/**
 * Download image proxy to handle CORS issues
 */
export const downloadImageProxy = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('Downloading image via proxy:', imageUrl);

    // Import axios dynamically
    const axios = (await import('axios')).default;
    
    // Fetch the image
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 30000
    });

    // Set headers for download
    const filename = `image-${Date.now()}.png`;
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', response.headers['content-length']);

    // Pipe the image stream to response
    response.data.pipe(res);

  } catch (error) {
    console.error('Download proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to download image',
      message: error.message 
    });
  }
};