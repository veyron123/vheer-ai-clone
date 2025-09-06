import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

class AffiliateService {
  /**
   * Generate unique affiliate code
   */
  generateAffiliateCode(userId) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(3).toString('hex');
    return `${userId.slice(-4)}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Create or get affiliate account for user
   */
  async createOrGetAffiliate(userId) {
    // Check if user already has affiliate account
    let affiliate = await prisma.affiliate.findUnique({
      where: { userId },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            referrals: true,
            clicks: true
          }
        }
      }
    });

    if (affiliate) {
      return affiliate;
    }

    // Create new affiliate account
    const code = this.generateAffiliateCode(userId);
    
    affiliate = await prisma.affiliate.create({
      data: {
        userId,
        code,
        status: 'active'
      },
      include: {
        links: true
      }
    });

    // Create default affiliate link
    const defaultLink = await this.createAffiliateLink(affiliate.id, {
      isDefault: true
    });

    affiliate.links = [defaultLink];
    return affiliate;
  }

  /**
   * Create new affiliate link
   */
  async createAffiliateLink(affiliateId, options = {}) {
    const { alias, utmSource, utmMedium, utmCampaign, isDefault = false } = options;

    // Check if alias is already taken
    if (alias) {
      const existingLink = await prisma.affiliateLink.findUnique({
        where: { alias }
      });
      
      if (existingLink) {
        throw new AppError('This alias is already taken', 400);
      }
    }

    // Get affiliate code
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { code: true }
    });

    if (!affiliate) {
      throw new AppError('Affiliate not found', 404);
    }

    // Build URL with parameters
    const baseUrl = process.env.FRONTEND_URL || 'https://colibrrri.com';
    const params = new URLSearchParams();
    params.append('ref', affiliate.code);
    
    if (alias) params.append('fp', alias);
    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (utmCampaign) params.append('utm_campaign', utmCampaign);

    const url = `${baseUrl}?${params.toString()}`;

    // Create link
    const link = await prisma.affiliateLink.create({
      data: {
        affiliateId,
        alias,
        url,
        isDefault
      }
    });

    return link;
  }

  /**
   * Track affiliate click
   */
  async trackClick(linkId, trackingData) {
    const {
      sessionId,
      ipAddress,
      userAgent,
      referer,
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      country,
      city,
      deviceType
    } = trackingData;

    // Get link and affiliate info
    const link = await prisma.affiliateLink.findUnique({
      where: { id: linkId },
      select: { 
        id: true,
        affiliateId: true,
        clickCount: true
      }
    });

    if (!link) {
      throw new AppError('Invalid affiliate link', 404);
    }

    // Create click record
    const click = await prisma.affiliateClick.create({
      data: {
        linkId,
        affiliateId: link.affiliateId,
        sessionId,
        ipAddress,
        userAgent,
        referer,
        landingPage,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        country,
        city,
        deviceType
      }
    });

    // Update link click count
    await prisma.affiliateLink.update({
      where: { id: linkId },
      data: {
        clickCount: { increment: 1 }
      }
    });

    // Update daily stats
    await this.updateDailyStats(link.affiliateId, {
      clicks: 1,
      uniqueClicks: sessionId ? 1 : 0
    });

    return click;
  }

  /**
   * Track new referral (user signup)
   */
  async trackReferral(userId, affiliateCode, clickId = null) {
    // Find affiliate by code
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode },
      select: { id: true, userId: true }
    });

    if (!affiliate) {
      console.log(`Invalid affiliate code: ${affiliateCode}`);
      return null;
    }

    // Don't allow self-referral
    if (affiliate.userId === userId) {
      console.log('Self-referral attempt blocked');
      return null;
    }

    // Check if user is already referred
    const existingReferral = await prisma.affiliateReferral.findUnique({
      where: { userId }
    });

    if (existingReferral) {
      console.log(`User ${userId} is already referred`);
      return existingReferral;
    }

    // Create referral
    const referral = await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        userId,
        clickId,
        status: 'signup'
      }
    });

    // Update daily stats
    await this.updateDailyStats(affiliate.id, {
      signups: 1
    });

    // Send notification to affiliate (optional)
    // await this.notifyAffiliate(affiliate.id, 'new_signup', { userId });

    return referral;
  }

  /**
   * Convert referral to customer (first payment)
   */
  async convertReferralToCustomer(userId, orderId, amount) {
    // Find referral
    const referral = await prisma.affiliateReferral.findUnique({
      where: { userId },
      include: {
        affiliate: {
          select: {
            id: true,
            commissionRate: true,
            tier: true
          }
        }
      }
    });

    if (!referral) {
      return null; // User was not referred
    }

    // Update referral status
    const now = new Date();
    await prisma.affiliateReferral.update({
      where: { id: referral.id },
      data: {
        status: 'customer',
        firstPaymentDate: referral.firstPaymentDate || now,
        lastPaymentDate: now,
        conversionDate: referral.conversionDate || now,
        lifetimeValue: {
          increment: amount
        }
      }
    });

    // Calculate commission
    const commissionRate = referral.affiliate.commissionRate / 100;
    const commissionAmount = amount * commissionRate;

    // Create commission record
    const commission = await prisma.affiliateCommission.create({
      data: {
        affiliateId: referral.affiliate.id,
        referralId: referral.id,
        orderId,
        type: referral.firstPaymentDate ? 'recurring' : 'sale',
        amount: commissionAmount,
        baseAmount: amount,
        commissionRate: referral.affiliate.commissionRate,
        status: 'pending' // Will be approved after review
      }
    });

    // Update affiliate earnings
    await prisma.affiliate.update({
      where: { id: referral.affiliate.id },
      data: {
        pendingPayouts: {
          increment: commissionAmount
        }
      }
    });

    // Update daily stats
    await this.updateDailyStats(referral.affiliate.id, {
      customers: referral.firstPaymentDate ? 0 : 1,
      revenue: amount,
      commissions: commissionAmount
    });

    return commission;
  }

  /**
   * Get affiliate dashboard data
   */
  async getAffiliateDashboard(affiliateId) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                clicks: true,
                referrals: true
              }
            }
          }
        },
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                email: true,
                createdAt: true
              }
            }
          }
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            clicks: true,
            referrals: true,
            commissions: true
          }
        }
      }
    });

    // Get stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await prisma.affiliateStatDaily.findMany({
      where: {
        affiliateId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate totals
    const totals = {
      clicks: affiliate._count.clicks,
      signups: affiliate._count.referrals,
      customers: await prisma.affiliateReferral.count({
        where: {
          affiliateId,
          status: 'customer'
        }
      }),
      earnings: affiliate.totalEarnings,
      pending: affiliate.pendingPayouts,
      paid: affiliate.paidAmount
    };

    return {
      affiliate,
      totals,
      recentStats,
      links: affiliate.links,
      referrals: affiliate.referrals,
      commissions: affiliate.commissions
    };
  }

  /**
   * Update daily statistics
   */
  async updateDailyStats(affiliateId, stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = {};
    if (stats.clicks !== undefined) data.clicks = { increment: stats.clicks };
    if (stats.uniqueClicks !== undefined) data.uniqueClicks = { increment: stats.uniqueClicks };
    if (stats.signups !== undefined) data.signups = { increment: stats.signups };
    if (stats.customers !== undefined) data.customers = { increment: stats.customers };
    if (stats.revenue !== undefined) data.revenue = { increment: stats.revenue };
    if (stats.commissions !== undefined) data.commissions = { increment: stats.commissions };

    await prisma.affiliateStatDaily.upsert({
      where: {
        affiliateId_date: {
          affiliateId,
          date: today
        }
      },
      update: data,
      create: {
        affiliateId,
        date: today,
        clicks: stats.clicks || 0,
        uniqueClicks: stats.uniqueClicks || 0,
        signups: stats.signups || 0,
        customers: stats.customers || 0,
        revenue: stats.revenue || 0,
        commissions: stats.commissions || 0
      }
    });
  }

  /**
   * Process affiliate payout
   */
  async processPayout(affiliateId, amount, method, transactionId) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: {
        pendingPayouts: true,
        paidAmount: true
      }
    });

    if (!affiliate) {
      throw new AppError('Affiliate not found', 404);
    }

    if (amount > affiliate.pendingPayouts) {
      throw new AppError('Insufficient pending balance', 400);
    }

    // Create payout record
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId,
        amount,
        method,
        transactionId,
        status: 'processing',
        processedAt: new Date()
      }
    });

    // Update affiliate balances
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        pendingPayouts: {
          decrement: amount
        },
        paidAmount: {
          increment: amount
        }
      }
    });

    // Mark related commissions as paid
    await prisma.affiliateCommission.updateMany({
      where: {
        affiliateId,
        status: 'approved',
        payoutId: null
      },
      data: {
        status: 'paid',
        payoutId: payout.id,
        paidAt: new Date()
      }
    });

    return payout;
  }

  /**
   * Get affiliate leaderboard
   */
  async getLeaderboard(period = 'month', limit = 10) {
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020); // Earliest possible date
        break;
    }

    const leaderboard = await prisma.affiliate.findMany({
      where: {
        status: 'active',
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        code: true,
        totalEarnings: true,
        user: {
          select: {
            username: true,
            fullName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            referrals: true,
            clicks: true
          }
        }
      },
      orderBy: {
        totalEarnings: 'desc'
      },
      take: limit
    });

    return leaderboard;
  }
}

export default new AffiliateService();