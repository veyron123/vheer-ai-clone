import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all cart orders with filtering and pagination
 */
export const getCartOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      paymentStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { orderReference: { contains: search } },
        { customerEmail: { contains: search } },
        { customerFirstName: { contains: search } },
        { customerLastName: { contains: search } },
        { customerPhone: { contains: search } }
      ];
    }

    if (status) {
      where.orderStatus = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Get total count
    const totalOrders = await prisma.cartOrder.count({ where });

    // Get orders with user relation
    const orders = await prisma.cartOrder.findMany({
      where,
      skip,
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
    });

    // Calculate stats
    const stats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
      },
      where: {
        paymentStatus: 'PAID'
      }
    });

    // Get status breakdown
    const statusBreakdown = await prisma.cartOrder.groupBy({
      by: ['orderStatus'],
      _count: true
    });

    const statusMap = statusBreakdown.reduce((acc, curr) => {
      acc[curr.orderStatus.toLowerCase()] = curr._count;
      return acc;
    }, {});

    res.json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        pages: Math.ceil(totalOrders / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      },
      stats: {
        totalOrders,
        totalRevenue: stats._sum.amount || 0,
        paidOrders: stats._count || 0,
        statusBreakdown: statusMap
      }
    });
  } catch (error) {
    console.error('Error fetching cart orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get single cart order by ID
 */
export const getCartOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.cartOrder.findUnique({
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
    console.error('Error fetching cart order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Update cart order
 */
export const updateCartOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      orderStatus,
      trackingNumber,
      trackingCarrier,
      adminNotes
    } = req.body;

    const data = {
      updatedAt: new Date()
    };

    if (orderStatus) {
      data.orderStatus = orderStatus;
      
      // Update timestamps based on status
      if (orderStatus === 'SHIPPED' && !data.shippedAt) {
        data.shippedAt = new Date();
      }
      if (orderStatus === 'DELIVERED' && !data.deliveredAt) {
        data.deliveredAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      data.trackingNumber = trackingNumber;
    }

    if (trackingCarrier !== undefined) {
      data.trackingCarrier = trackingCarrier;
    }

    if (adminNotes !== undefined) {
      data.adminNotes = adminNotes;
    }

    const order = await prisma.cartOrder.update({
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

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating cart order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
};

/**
 * Get order stats
 */
export const getOrderStats = async (req, res) => {
  try {
    const stats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
      }
    });

    const paidStats = await prisma.cartOrder.aggregate({
      _count: true,
      _sum: {
        amount: true
      },
      where: {
        paymentStatus: 'PAID'
      }
    });

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

    res.json({
      success: true,
      stats: {
        total: {
          orders: stats._count,
          revenue: stats._sum.amount || 0
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
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

/**
 * Get notifications for new orders
 */
export const getOrderNotifications = async (req, res) => {
  try {
    // Find orders created in last 5 minutes that haven't been viewed
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const newOrders = await prisma.cartOrder.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        },
        paymentStatus: 'PAID'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        orderReference: true,
        customerEmail: true,
        customerFirstName: true,
        customerLastName: true,
        amount: true,
        currency: true,
        createdAt: true
      }
    });

    const notifications = newOrders.map(order => ({
      id: order.id,
      orderId: order.id,
      title: '🛍️ New Order!',
      message: `New order #${order.orderReference} from ${order.customerFirstName || 'Customer'} - ${order.currency} ${order.amount}`,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      notifications
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
 * Mark notifications as read
 */
export const markNotificationsRead = async (req, res) => {
  try {
    // Since we don't have a separate notifications table,
    // we can just return success
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};