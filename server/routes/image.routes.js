import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get public gallery
router.get('/gallery', async (req, res) => {
  try {
    const { page = 1, limit = 20, style, model } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {
      isPublic: true,
      ...(style && { style }),
      ...(model && { model })
    };
    
    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.image.count({ where })
    ]);
    
    res.json({
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// Get user's images
router.get('/my-images', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.image.count({
        where: { userId: req.user.id }
      })
    ]);
    
    res.json({
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Toggle image visibility
router.patch('/:id/visibility', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    
    const image = await prisma.image.findUnique({
      where: { id }
    });
    
    if (!image || image.userId !== req.user.id) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const updatedImage = await prisma.image.update({
      where: { id },
      data: { isPublic }
    });
    
    res.json(updatedImage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Delete image
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await prisma.image.findUnique({
      where: { id }
    });
    
    if (!image || image.userId !== req.user.id) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    await prisma.image.delete({
      where: { id }
    });
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;