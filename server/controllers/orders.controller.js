import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    if (search) {
      where.OR = [
        { orderReference: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerFirstName: { contains: search, mode: 'insensitive' } },
        { customerLastName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: {
          [sortBy]: sortOrder
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
      }),
      prisma.order.count({ where })
    ]);
    
    // Calculate statistics
    const stats = await prisma.order.aggregate({
      _sum: {
        total: true
      },
      _count: {
        _all: true
      },
      where: {
        paymentStatus: 'paid'
      }
    });
    
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalOrders: total,
        totalRevenue: stats._sum.total || 0,
        paidOrders: stats._count._all || 0,
        statusBreakdown: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = curr._count._all;
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get single order by ID (admin only)
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            totalCredits: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Update order (admin only)
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...updates,
        // Set timestamps for status changes
        shippedAt: updates.status === 'shipped' && !existingOrder.shippedAt ? new Date() : existingOrder.shippedAt,
        deliveredAt: updates.status === 'delivered' && !existingOrder.deliveredAt ? new Date() : existingOrder.deliveredAt
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
    
    res.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
};

/**
 * Delete order (admin only)
 */
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.order.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
    });
  }
};

/**
 * Get order statistics (admin only)
 */
export const getOrderStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(period));
    
    // Get various statistics
    const [
      totalOrders,
      paidOrders,
      shippedOrders,
      deliveredOrders,
      revenueStats,
      recentOrders,
      topProducts
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Paid orders
      prisma.order.count({
        where: {
          paymentStatus: 'paid',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Shipped orders
      prisma.order.count({
        where: {
          status: 'shipped',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Delivered orders
      prisma.order.count({
        where: {
          status: 'delivered',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Revenue statistics
      prisma.order.aggregate({
        _sum: {
          total: true
        },
        _avg: {
          total: true
        },
        _max: {
          total: true
        },
        _min: {
          total: true
        },
        where: {
          paymentStatus: 'paid',
          createdAt: {
            gte: dateFilter
          }
        }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          orderReference: true,
          customerEmail: true,
          total: true,
          currency: true,
          status: true,
          paymentStatus: true,
          createdAt: true
        }
      }),
      
      // Top products (analyze items JSON)
      prisma.order.findMany({
        where: {
          paymentStatus: 'paid',
          createdAt: {
            gte: dateFilter
          }
        },
        select: {
          items: true
        }
      })
    ]);
    
    // Process top products
    const productCounts = {};
    topProducts.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const key = item.name || 'Unknown Product';
          if (!productCounts[key]) {
            productCounts[key] = {
              name: key,
              count: 0,
              revenue: 0
            };
          }
          productCounts[key].count += item.quantity || 1;
          productCounts[key].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    
    const topProductsList = Object.values(productCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    res.json({
      success: true,
      stats: {
        period: `${period} days`,
        totalOrders,
        paidOrders,
        shippedOrders,
        deliveredOrders,
        conversionRate: totalOrders > 0 ? ((paidOrders / totalOrders) * 100).toFixed(2) : 0,
        fulfillmentRate: paidOrders > 0 ? ((deliveredOrders / paidOrders) * 100).toFixed(2) : 0,
        revenue: {
          total: revenueStats._sum.total || 0,
          average: revenueStats._avg.total || 0,
          max: revenueStats._max.total || 0,
          min: revenueStats._min.total || 0
        },
        recentOrders,
        topProducts: topProductsList
      }
    });
    
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
};

/**
 * Get notifications for new orders (admin only)
 */
export const getOrderNotifications = async (req, res) => {
  try {
    // Get recent order notifications (stored as special payment records)
    const notifications = await prisma.payment.findMany({
      where: {
        currency: 'NOTIFICATION',
        status: 'NEW_ORDER'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    // Parse notification data
    const parsedNotifications = notifications.map(notif => {
      try {
        return {
          id: notif.id,
          ...JSON.parse(notif.description || '{}'),
          createdAt: notif.createdAt
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    res.json({
      success: true,
      notifications: parsedNotifications
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark notifications as read (admin only)
 */
export const markNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification IDs'
      });
    }
    
    // Delete notification records
    await prisma.payment.deleteMany({
      where: {
        id: {
          in: notificationIds
        },
        currency: 'NOTIFICATION'
      }
    });
    
    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};