import { PrismaClient } from '@prisma/client';
import { downloadAndSaveImage, generateThumbnail, shouldSaveImageForUser, deleteImageFiles } from '../utils/imageStorage.js';

const prisma = new PrismaClient();

/**
 * Save generated image to user's gallery
 * @param {Object} imageData - Image data to save
 * @param {Object} user - User object
 * @param {Object} generation - Generation record
 * @returns {Promise<Object>} Saved image record
 */
export async function saveGeneratedImage(imageData, user, generation) {
  try {
    console.log('Starting to save generated image for user:', user.username);
    
    // Check if user should have images saved
    if (!shouldSaveImageForUser(user)) {
      console.log('User does not have image saving enabled - skipping save');
      return null;
    }

    const { url: imageUrl, width = 1024, height = 1024 } = imageData;
    
    // Download and save the image (Cloudinary for production, local for dev)
    const { localPath, filename, cloudinaryId } = await downloadAndSaveImage(imageUrl, 'generated');
    
    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(localPath);
    
    // Save to database with proper URLs
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const finalImageUrl = localPath.startsWith('http') ? localPath : `${serverUrl}/${localPath}`;
    const finalThumbUrl = thumbnailPath.startsWith('http') ? thumbnailPath : `${serverUrl}/${thumbnailPath}`;
    
    const savedImage = await prisma.image.create({
      data: {
        userId: user.id,
        generationId: generation.id,
        url: finalImageUrl,
        thumbnailUrl: finalThumbUrl,
        prompt: generation.prompt,
        negativePrompt: generation.negativePrompt,
        model: generation.model,
        style: generation.style,
        width: parseInt(width),
        height: parseInt(height),
        isPublic: false, // Default to private
        likes: 0,
        views: 0
      }
    });

    console.log('Image saved successfully:', savedImage.id);
    return savedImage;
  } catch (error) {
    console.error('Error saving generated image:', error);
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

    const images = await prisma.image.findMany({
      where: { userId },
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