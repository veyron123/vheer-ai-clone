import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get cart statistics from CartSession data
 */
export const getCartStats = async (req, res) => {
  try {
    // Get total cart sessions statistics
    const totalStats = await prisma.cartSession.aggregate({
      _count: true,
      _sum: {
        totalAmount: true
      }
    });

    // Get active carts statistics
    const activeStats = await prisma.cartSession.aggregate({
      _count: true,
      _sum: {
        totalAmount: true
      },
      where: {
        status: 'active'
      }
    });

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await prisma.cartSession.aggregate({
      _count: true,
      _sum: {
        totalAmount: true
      },
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Get this month's statistics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthStats = await prisma.cartSession.aggregate({
      _count: true,
      _sum: {
        totalAmount: true
      },
      where: {
        createdAt: {
          gte: thisMonth
        }
      }
    });

    // Get status breakdown
    const statusBreakdown = await prisma.cartSession.groupBy({
      by: ['status'],
      _count: true
    });

    const statusMap = statusBreakdown.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    // Get recent cart activity
    const recentActivity = await prisma.cartSession.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        sessionId: true,
        customerEmail: true,
        totalAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total: {
          carts: totalStats._count,
          value: totalStats._sum.totalAmount || 0
        },
        active: {
          carts: activeStats._count,
          value: activeStats._sum.totalAmount || 0
        },
        today: {
          carts: todayStats._count,
          value: todayStats._sum.totalAmount || 0
        },
        thisMonth: {
          carts: monthStats._count,
          value: monthStats._sum.totalAmount || 0
        },
        statusBreakdown: statusMap,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching cart stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart statistics',
      error: error.message
    });
  }
};

/**
 * Get list of carts (using CartSession data)
 */
export const getCarts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCarts = await prisma.cartSession.count({ where });

    // Get cart sessions
    const carts = await prisma.cartSession.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy === 'lastActivityAt' ? 'lastActivityAt' : sortBy]: sortOrder
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    // Transform to match expected cart format
    const transformedCarts = carts.map((cart) => {
      return {
        id: cart.id,
        sessionId: cart.sessionId,
        userId: cart.userId,
        user: cart.user,
        items: cart.items,
        totalAmount: cart.totalAmount,
        itemCount: cart.itemCount || 0,
        currency: cart.currency,
        customerEmail: cart.customerEmail || cart.user?.email,
        status: cart.status,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        lastActivityAt: cart.lastActivityAt || cart.updatedAt,
        isAbandoned: cart.status === 'abandoned',
        isConverted: cart.status === 'converted'
      };
    });

    res.json({
      success: true,
      carts: transformedCarts,
      pagination: {
        total: totalCarts,
        pages: Math.ceil(totalCarts / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch carts',
      error: error.message
    });
  }
};

/**
 * Get single cart by ID
 */
export const getCartById = async (req, res) => {
  try {
    const { id } = req.params;

    const cart = await prisma.cartSession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Transform to match expected cart format
    const transformedCart = {
      id: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      user: cart.user,
      items: cart.items,
      totalAmount: cart.totalAmount,
      itemCount: cart.itemCount || 0,
      currency: cart.currency,
      customerEmail: cart.customerEmail || cart.user?.email,
      status: cart.status,
      userIp: cart.userIp,
      userAgent: cart.userAgent,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      lastActivityAt: cart.lastActivityAt || cart.updatedAt,
      abandonedAt: cart.abandonedAt,
      convertedToOrderId: cart.convertedToOrderId,
      isAbandoned: cart.status === 'abandoned',
      isConverted: cart.status === 'converted'
    };

    res.json({
      success: true,
      cart: transformedCart
    });
  } catch (error) {
    console.error('Error fetching cart by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart details',
      error: error.message
    });
  }
};

/**
 * Update cart session by ID
 */
export const updateCartById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      customerEmail
    } = req.body;

    const data = {
      updatedAt: new Date(),
      lastActivityAt: new Date()
    };

    if (status) {
      data.status = status;
      
      // Update timestamps based on status
      if (status === 'abandoned' && !data.abandonedAt) {
        data.abandonedAt = new Date();
      }
    }

    if (customerEmail !== undefined) {
      data.customerEmail = customerEmail;
    }

    const cart = await prisma.cartSession.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    // Transform to match expected cart format
    const transformedCart = {
      id: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      user: cart.user,
      items: cart.items,
      totalAmount: cart.totalAmount,
      itemCount: cart.itemCount || 0,
      currency: cart.currency,
      customerEmail: cart.customerEmail || cart.user?.email,
      status: cart.status,
      userIp: cart.userIp,
      userAgent: cart.userAgent,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      lastActivityAt: cart.lastActivityAt || cart.updatedAt,
      abandonedAt: cart.abandonedAt,
      convertedToOrderId: cart.convertedToOrderId,
      isAbandoned: cart.status === 'abandoned',
      isConverted: cart.status === 'converted'
    };

    res.json({
      success: true,
      cart: transformedCart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message
    });
  }
};

/**
 * Get abandoned cart statistics (placeholder for now)
 */
export const getAbandonedCartStats = async (req, res) => {
  try {
    // For now, return empty stats since CartSession model is not implemented
    res.json({
      success: true,
      stats: {
        abandonedCarts: 0,
        recoveryRate: 0,
        totalValue: 0,
        recentAbandoned: []
      }
    });
  } catch (error) {
    console.error('Error fetching abandoned cart stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch abandoned cart statistics',
      error: error.message
    });
  }
};