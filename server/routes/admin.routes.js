import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as authenticateUser, adminAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users with pagination and filters
router.get('/users', authenticateUser, adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      plan = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for filtering
    const where = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (plan) {
      where.subscription = {
        plan: plan
      };
    }

    // Get total count
    const totalUsers = await prisma.user.count({ where });

    // Get users with related data
    const users = await prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        subscription: true,
        _count: {
          select: {
            images: true,
            generations: true,
            payments: true
          }
        }
      }
    });

    // Calculate stats
    const stats = await prisma.user.aggregate({
      _count: true,
      _sum: {
        totalCredits: true
      }
    });

    const subscriptionStats = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: true
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      },
      stats: {
        totalUsers: stats._count,
        totalCredits: stats._sum.totalCredits || 0,
        subscriptions: subscriptionStats
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin action)
router.delete('/users/:id', authenticateUser, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { username: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    res.json({ 
      message: 'User deleted successfully', 
      deletedUser: user 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get single user details
router.get('/users/:id', authenticateUser, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        images: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        generations: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        credits: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user (admin actions)
router.patch('/users/:id', authenticateUser, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { totalCredits, emailVerified, subscription } = req.body;

    const updates = {};
    
    if (totalCredits !== undefined) {
      updates.totalCredits = totalCredits;
    }
    
    if (emailVerified !== undefined) {
      updates.emailVerified = emailVerified;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
      include: {
        subscription: true
      }
    });

    // Update subscription if provided
    if (subscription && user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          plan: subscription.plan || user.subscription.plan,
          status: subscription.status || user.subscription.status
        }
      });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get dashboard statistics
router.get('/stats', authenticateUser, adminAuth, async (req, res) => {
  try {
    // User stats
    const userStats = await prisma.user.aggregate({
      _count: true,
      _sum: {
        totalCredits: true
      }
    });

    // New users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Subscription breakdown
    const subscriptions = await prisma.subscription.groupBy({
      by: ['plan', 'status'],
      _count: true
    });

    // Generation stats
    const generationStats = await prisma.generation.aggregate({
      _count: true,
      _sum: {
        creditsUsed: true
      }
    });

    // Payment stats
    const paymentStats = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS'
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    // Recent activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        createdAt: true
      }
    });

    const recentGenerations = await prisma.generation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.json({
      users: {
        total: userStats._count,
        newThisMonth: newUsers,
        totalCredits: userStats._sum.totalCredits || 0
      },
      subscriptions,
      generations: {
        total: generationStats._count,
        creditsUsed: generationStats._sum.creditsUsed || 0
      },
      payments: {
        total: paymentStats._count,
        revenue: paymentStats._sum.amount || 0
      },
      recent: {
        users: recentUsers,
        generations: recentGenerations
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;