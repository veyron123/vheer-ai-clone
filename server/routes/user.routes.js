import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        website: true,
        location: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            images: {
              where: { isPublic: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update current user's profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, bio, website, location } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(location !== undefined && { location }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        bio: true,
        website: true,
        location: true,
        avatar: true,
        totalCredits: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            expiresAt: true
          }
        }
      }
    });

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get current user's detailed profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            expiresAt: true
          }
        },
        _count: {
          select: {
            images: true,
            generations: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;