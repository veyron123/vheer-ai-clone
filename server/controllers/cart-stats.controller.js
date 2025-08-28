import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get cart statistics from CartOrder data
 */
export const getCartStats = async (req, res) => {
  try {
    // Get total cart orders statistics
    const totalStats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
      }
    });

    // Get paid orders statistics
    const paidStats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
      },
      where: {
        paymentStatus: 'PAID'
      }
    });

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
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

    const monthStats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
      },
      where: {
        createdAt: {
          gte: thisMonth
        }
      }
    });

    // Get status breakdown
    const statusBreakdown = await prisma.cartOrder.groupBy({
      by: ['orderStatus'],
      _count: true,
      where: {
        paymentStatus: 'PAID'
      }
    });

    const statusMap = statusBreakdown.reduce((acc, curr) => {
      acc[curr.orderStatus.toLowerCase()] = curr._count;
      return acc;
    }, {});

    // Get recent orders for activity
    const recentOrders = await prisma.cartOrder.findMany({
      where: {
        paymentStatus: 'PAID'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        orderReference: true,
        customerEmail: true,
        customerFirstName: true,
        amount: true,
        currency: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      stats: {
        total: {
          orders: totalStats._count,
          revenue: totalStats._sum.amount || 0
        },
        paid: {
          orders: paidStats._count,
          revenue: paidStats._sum.amount || 0
        },
        today: {
          orders: todayStats._count,
          revenue: todayStats._sum.amount || 0
        },
        thisMonth: {
          orders: monthStats._count,
          revenue: monthStats._sum.amount || 0
        },
        statusBreakdown: statusMap,
        recentActivity: recentOrders
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
 * Get list of carts (using CartOrder data for now)
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
      where.orderStatus = status;
    }

    // Get total count
    const totalCarts = await prisma.cartOrder.count({ where });

    // Get cart orders
    const carts = await prisma.cartOrder.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy === 'lastActivityAt' ? 'updatedAt' : sortBy]: sortOrder
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
    const transformedCarts = carts.map(cart => ({
      id: cart.id,
      sessionId: cart.orderReference,
      userId: cart.userId,
      user: cart.user,
      items: cart.items,
      totalAmount: cart.amount,
      itemCount: Array.isArray(cart.items) ? cart.items.length : 0,
      currency: cart.currency,
      customerEmail: cart.customerEmail || cart.user?.email,
      status: cart.orderStatus,
      paymentStatus: cart.paymentStatus,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      lastActivityAt: cart.updatedAt,
      isAbandoned: cart.paymentStatus !== 'PAID',
      isConverted: cart.paymentStatus === 'PAID'
    }));

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