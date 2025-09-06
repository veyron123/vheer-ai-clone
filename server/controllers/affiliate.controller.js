import affiliateService from '../services/affiliateService.js';
import { AppError } from '../middleware/errorHandler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create or get affiliate account
 */
export const createAffiliate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const affiliate = await affiliateService.createOrGetAffiliate(userId);
    
    res.status(200).json({
      success: true,
      affiliate
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate dashboard
 */
export const getAffiliateDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    const dashboard = await affiliateService.getAffiliateDashboard(affiliate.id);
    
    res.status(200).json({
      success: true,
      ...dashboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new affiliate link
 */
export const createAffiliateLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { alias, utmSource, utmMedium, utmCampaign } = req.body;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    // Check link limit (max 10 active links)
    const linkCount = await prisma.affiliateLink.count({
      where: {
        affiliateId: affiliate.id,
        isActive: true
      }
    });
    
    if (linkCount >= 10) {
      throw new AppError('Maximum number of links reached', 400);
    }
    
    const link = await affiliateService.createAffiliateLink(affiliate.id, {
      alias,
      utmSource,
      utmMedium,
      utmCampaign
    });
    
    res.status(201).json({
      success: true,
      link
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all affiliate links
 */
export const getAffiliateLinks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    const links = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliate.id,
        isActive: true
      },
      include: {
        _count: {
          select: {
            clicks: true,
            referrals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({
      success: true,
      links
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update affiliate link
 */
export const updateAffiliateLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { linkId } = req.params;
    const { alias, isActive } = req.body;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    // Check if link belongs to this affiliate
    const link = await prisma.affiliateLink.findFirst({
      where: {
        id: linkId,
        affiliateId: affiliate.id
      }
    });
    
    if (!link) {
      throw new AppError('Link not found', 404);
    }
    
    // Check if alias is already taken
    if (alias && alias !== link.alias) {
      const existingLink = await prisma.affiliateLink.findUnique({
        where: { alias }
      });
      
      if (existingLink) {
        throw new AppError('This alias is already taken', 400);
      }
    }
    
    // Update link
    const updatedLink = await prisma.affiliateLink.update({
      where: { id: linkId },
      data: {
        alias,
        isActive
      }
    });
    
    res.status(200).json({
      success: true,
      link: updatedLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete affiliate link
 */
export const deleteAffiliateLink = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { linkId } = req.params;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    // Check if link belongs to this affiliate
    const link = await prisma.affiliateLink.findFirst({
      where: {
        id: linkId,
        affiliateId: affiliate.id
      }
    });
    
    if (!link) {
      throw new AppError('Link not found', 404);
    }
    
    // Don't allow deleting default link
    if (link.isDefault) {
      throw new AppError('Cannot delete default link', 400);
    }
    
    // Soft delete (set inactive)
    await prisma.affiliateLink.update({
      where: { id: linkId },
      data: {
        isActive: false
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referrals list
 */
export const getReferrals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    const where = {
      affiliateId: affiliate.id
    };
    
    if (status) {
      where.status = status;
    }
    
    const [referrals, total] = await Promise.all([
      prisma.affiliateReferral.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
              createdAt: true
            }
          },
          link: {
            select: {
              alias: true,
              url: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.affiliateReferral.count({ where })
    ]);
    
    res.status(200).json({
      success: true,
      referrals,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get commissions list
 */
export const getCommissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    const where = {
      affiliateId: affiliate.id
    };
    
    if (status) {
      where.status = status;
    }
    
    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        include: {
          referral: {
            include: {
              user: {
                select: {
                  email: true,
                  fullName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.affiliateCommission.count({ where })
    ]);
    
    res.status(200).json({
      success: true,
      commissions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payouts list
 */
export const getPayouts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    const where = {
      affiliateId: affiliate.id
    };
    
    if (status) {
      where.status = status;
    }
    
    const [payouts, total] = await Promise.all([
      prisma.affiliatePayout.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.affiliatePayout.count({ where })
    ]);
    
    res.status(200).json({
      success: true,
      payouts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request payout
 */
export const requestPayout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, method, payoutDetails } = req.body;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    // Check minimum payout amount ($50)
    if (amount < 50) {
      throw new AppError('Minimum payout amount is $50', 400);
    }
    
    // Check available balance
    if (amount > affiliate.pendingPayouts) {
      throw new AppError('Insufficient balance', 400);
    }
    
    // Create payout request
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        method,
        status: 'pending'
      }
    });
    
    // Update affiliate payout details if provided
    if (payoutDetails) {
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          payoutMethod: method,
          payoutDetails
        }
      });
    }
    
    res.status(201).json({
      success: true,
      payout,
      message: 'Payout request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics data
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30days', startDate, endDate } = req.query;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case '7days':
          dateFilter.date = {
            gte: new Date(now.setDate(now.getDate() - 7))
          };
          break;
        case '30days':
          dateFilter.date = {
            gte: new Date(now.setDate(now.getDate() - 30))
          };
          break;
        case '90days':
          dateFilter.date = {
            gte: new Date(now.setDate(now.getDate() - 90))
          };
          break;
        case 'year':
          dateFilter.date = {
            gte: new Date(now.setFullYear(now.getFullYear() - 1))
          };
          break;
      }
    }
    
    // Get daily stats
    const dailyStats = await prisma.affiliateStatDaily.findMany({
      where: {
        affiliateId: affiliate.id,
        ...dateFilter
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Get link performance
    const linkPerformance = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliate.id,
        isActive: true
      },
      select: {
        id: true,
        alias: true,
        url: true,
        clickCount: true,
        conversionCount: true,
        _count: {
          select: {
            clicks: true,
            referrals: true
          }
        }
      },
      orderBy: {
        clickCount: 'desc'
      }
    });
    
    // Get top referrals
    const topReferrals = await prisma.affiliateReferral.findMany({
      where: {
        affiliateId: affiliate.id,
        status: 'customer'
      },
      select: {
        id: true,
        user: {
          select: {
            email: true,
            fullName: true
          }
        },
        lifetimeValue: true,
        firstPaymentDate: true,
        commissions: {
          select: {
            amount: true,
            status: true
          }
        }
      },
      orderBy: {
        lifetimeValue: 'desc'
      },
      take: 10
    });
    
    // Calculate summary
    const summary = {
      totalClicks: dailyStats.reduce((sum, day) => sum + day.clicks, 0),
      totalSignups: dailyStats.reduce((sum, day) => sum + day.signups, 0),
      totalCustomers: dailyStats.reduce((sum, day) => sum + day.customers, 0),
      totalRevenue: dailyStats.reduce((sum, day) => sum + day.revenue, 0),
      totalCommissions: dailyStats.reduce((sum, day) => sum + day.commissions, 0),
      conversionRate: 0
    };
    
    if (summary.totalClicks > 0) {
      summary.conversionRate = (summary.totalCustomers / summary.totalClicks * 100).toFixed(2);
    }
    
    res.status(200).json({
      success: true,
      summary,
      dailyStats,
      linkPerformance,
      topReferrals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate leaderboard
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'month', limit = 10 } = req.query;
    
    const leaderboard = await affiliateService.getLeaderboard(period, parseInt(limit));
    
    res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Sub ID reports
 */
export const getSubIdReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe = 'last30days', search = '' } = req.query;
    
    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });
    
    if (!affiliate) {
      throw new AppError('Affiliate account not found', 404);
    }
    
    // Calculate date range based on timeframe
    let dateFilter = {};
    const now = new Date();
    
    switch(timeframe) {
      case 'today':
        dateFilter.createdAt = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'yesterday':
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        dateFilter.createdAt = {
          gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          lt: new Date(yesterday.setHours(23, 59, 59, 999))
        };
        break;
      case 'last7days':
        dateFilter.createdAt = {
          gte: new Date(now.setDate(now.getDate() - 7))
        };
        break;
      case 'last30days':
        dateFilter.createdAt = {
          gte: new Date(now.setDate(now.getDate() - 30))
        };
        break;
      case 'thisMonth':
        dateFilter.createdAt = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        dateFilter.createdAt = {
          gte: lastMonth,
          lte: endOfLastMonth
        };
        break;
    }
    
    // Group clicks by subId
    const clicksBySubId = await prisma.affiliateClick.groupBy({
      by: ['subId'],
      where: {
        affiliateId: affiliate.id,
        ...dateFilter,
        ...(search ? {
          subId: {
            contains: search,
            mode: 'insensitive'
          }
        } : {})
      },
      _count: {
        id: true
      }
    });
    
    // Get referrals and commissions data for each subId
    const subIdReports = await Promise.all(
      clicksBySubId.map(async (click) => {
        const subId = click.subId || 'direct';
        
        // Get referrals for this subId
        const referrals = await prisma.affiliateReferral.count({
          where: {
            affiliateId: affiliate.id,
            click: {
              subId: click.subId
            },
            ...dateFilter
          }
        });
        
        // Get customers and earnings for this subId
        const commissions = await prisma.affiliateCommission.aggregate({
          where: {
            affiliateId: affiliate.id,
            referral: {
              click: {
                subId: click.subId
              }
            },
            status: 'approved',
            ...dateFilter
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        });
        
        return {
          subId,
          clicks: click._count.id,
          referrals,
          customers: commissions._count.id,
          earnings: commissions._sum.amount || 0
        };
      })
    );
    
    // Sort by clicks descending
    subIdReports.sort((a, b) => b.clicks - a.clicks);
    
    res.status(200).json({
      success: true,
      data: subIdReports
    });
  } catch (error) {
    next(error);
  }
};