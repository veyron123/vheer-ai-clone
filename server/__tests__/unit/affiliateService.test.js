import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as affiliateService from '../../services/affiliateService.js';
import prisma from '../../config/database.js';

// Mock Prisma client
jest.mock('../../config/database.js', () => ({
  default: {
    affiliate: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    affiliateLink: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    affiliateClick: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    affiliateReferral: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    affiliateCommission: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    affiliatePayout: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    affiliateDailyStats: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}));

describe('AffiliateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAffiliate', () => {
    it('should create a new affiliate with unique code', async () => {
      const userId = 'test-user-id';
      const mockAffiliate = {
        id: 'affiliate-id',
        userId,
        code: 'TEST123',
        commissionRate: 20.0,
        totalEarnings: 0,
        createdAt: new Date(),
      };

      prisma.affiliate.findUnique.mockResolvedValue(null);
      prisma.affiliate.create.mockResolvedValue(mockAffiliate);

      const result = await affiliateService.createAffiliate(userId);

      expect(result).toEqual(mockAffiliate);
      expect(prisma.affiliate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          code: expect.any(String),
        }),
      });
    });

    it('should return existing affiliate if already exists', async () => {
      const userId = 'existing-user-id';
      const existingAffiliate = {
        id: 'affiliate-id',
        userId,
        code: 'EXIST123',
        commissionRate: 20.0,
      };

      prisma.affiliate.findUnique.mockResolvedValue(existingAffiliate);

      const result = await affiliateService.createAffiliate(userId);

      expect(result).toEqual(existingAffiliate);
      expect(prisma.affiliate.create).not.toHaveBeenCalled();
    });
  });

  describe('createAffiliateLink', () => {
    it('should create a new affiliate link with custom alias', async () => {
      const affiliateId = 'affiliate-id';
      const linkData = {
        alias: 'summer-sale',
        utmSource: 'instagram',
        utmMedium: 'social',
        utmCampaign: 'july2024',
      };

      const mockLink = {
        id: 'link-id',
        affiliateId,
        ...linkData,
        clickCount: 0,
        isActive: true,
        createdAt: new Date(),
      };

      prisma.affiliateLink.findUnique.mockResolvedValue(null);
      prisma.affiliateLink.create.mockResolvedValue(mockLink);

      const result = await affiliateService.createAffiliateLink(affiliateId, linkData);

      expect(result).toEqual(mockLink);
      expect(prisma.affiliateLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          affiliateId,
          ...linkData,
        }),
      });
    });

    it('should throw error if alias already exists', async () => {
      const affiliateId = 'affiliate-id';
      const linkData = { alias: 'existing-alias' };

      prisma.affiliateLink.findUnique.mockResolvedValue({ id: 'existing-link' });

      await expect(
        affiliateService.createAffiliateLink(affiliateId, linkData)
      ).rejects.toThrow('Alias already exists');
    });
  });

  describe('trackClick', () => {
    it('should track click and create click record', async () => {
      const trackingData = {
        affiliateCode: 'TEST123',
        linkId: 'link-id',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        referrer: 'https://instagram.com',
        sessionId: 'session-123',
      };

      const mockAffiliate = { id: 'affiliate-id', code: 'TEST123' };
      const mockLink = { id: 'link-id', affiliateId: 'affiliate-id' };
      const mockClick = {
        id: 'click-id',
        ...trackingData,
        createdAt: new Date(),
      };

      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prisma.affiliateLink.findUnique.mockResolvedValue(mockLink);
      prisma.affiliateClick.findMany.mockResolvedValue([]);
      prisma.affiliateClick.create.mockResolvedValue(mockClick);
      prisma.$transaction.mockImplementation(async (fn) => await fn(prisma));

      const result = await affiliateService.trackClick(trackingData);

      expect(result).toEqual(mockClick);
      expect(prisma.affiliateClick.create).toHaveBeenCalled();
    });

    it('should not track duplicate clicks from same session', async () => {
      const trackingData = {
        affiliateCode: 'TEST123',
        sessionId: 'duplicate-session',
      };

      const mockAffiliate = { id: 'affiliate-id', code: 'TEST123' };
      const existingClick = { id: 'existing-click', sessionId: 'duplicate-session' };

      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prisma.affiliateClick.findMany.mockResolvedValue([existingClick]);

      const result = await affiliateService.trackClick(trackingData);

      expect(result).toBeNull();
      expect(prisma.affiliateClick.create).not.toHaveBeenCalled();
    });
  });

  describe('convertReferralToCustomer', () => {
    it('should calculate and create commission on conversion', async () => {
      const userId = 'user-id';
      const orderId = 'order-123';
      const amount = 100.00;

      const mockReferral = {
        id: 'referral-id',
        userId,
        affiliateId: 'affiliate-id',
        status: 'signup',
        affiliate: {
          id: 'affiliate-id',
          commissionRate: 20.0,
          totalEarnings: 0,
        },
      };

      const expectedCommission = amount * 0.20; // 20% commission

      prisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);
      prisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          affiliateReferral: { update: jest.fn() },
          affiliateCommission: { 
            create: jest.fn().mockResolvedValue({
              id: 'commission-id',
              amount: expectedCommission,
              status: 'pending',
            })
          },
          affiliate: { update: jest.fn() },
        };
        return await fn(mockTx);
      });

      const result = await affiliateService.convertReferralToCustomer(userId, orderId, amount);

      expect(result).toBeTruthy();
      expect(result.amount).toBe(expectedCommission);
    });

    it('should not create commission for non-existent referral', async () => {
      const userId = 'non-referred-user';
      const orderId = 'order-456';
      const amount = 50.00;

      prisma.affiliateReferral.findFirst.mockResolvedValue(null);

      const result = await affiliateService.convertReferralToCustomer(userId, orderId, amount);

      expect(result).toBeNull();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('calculateCommissions', () => {
    it('should calculate correct commission amount based on rate', async () => {
      const affiliateId = 'affiliate-id';
      const referralId = 'referral-id';
      const orderAmount = 200.00;
      const commissionRate = 20.0;

      const mockCommission = {
        id: 'commission-id',
        affiliateId,
        referralId,
        amount: orderAmount * (commissionRate / 100),
        status: 'pending',
        createdAt: new Date(),
      };

      prisma.affiliateCommission.create.mockResolvedValue(mockCommission);

      const result = await affiliateService.calculateCommission(
        affiliateId,
        referralId,
        orderAmount,
        commissionRate
      );

      expect(result.amount).toBe(40.00); // 20% of 200
      expect(prisma.affiliateCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 40.00,
          status: 'pending',
        }),
      });
    });
  });

  describe('getAffiliateAnalytics', () => {
    it('should return aggregated analytics data', async () => {
      const affiliateId = 'affiliate-id';
      const period = '30days';
      
      const mockStats = {
        totalClicks: 150,
        totalSignups: 25,
        totalCustomers: 10,
        totalCommissions: 500.00,
        conversionRate: 6.67,
      };

      prisma.affiliateClick.count.mockResolvedValue(150);
      prisma.affiliateReferral.count.mockResolvedValueOnce(25);
      prisma.affiliateReferral.count.mockResolvedValueOnce(10);
      prisma.affiliateCommission.aggregate.mockResolvedValue({
        _sum: { amount: 500.00 },
      });

      const result = await affiliateService.getAffiliateAnalytics(affiliateId, { period });

      expect(result.summary.totalClicks).toBe(150);
      expect(result.summary.totalSignups).toBe(25);
      expect(result.summary.totalCustomers).toBe(10);
      expect(result.summary.conversionRate).toBeCloseTo(6.67, 1);
    });
  });

  describe('requestPayout', () => {
    it('should create payout request if balance is sufficient', async () => {
      const affiliateId = 'affiliate-id';
      const amount = 100.00;
      const method = 'paypal';

      const mockAffiliate = {
        id: affiliateId,
        totalEarnings: 150.00,
        totalPaidOut: 0,
      };

      const mockPayout = {
        id: 'payout-id',
        affiliateId,
        amount,
        method,
        status: 'pending',
        createdAt: new Date(),
      };

      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prisma.affiliatePayout.create.mockResolvedValue(mockPayout);

      const result = await affiliateService.requestPayout(affiliateId, amount, method);

      expect(result).toEqual(mockPayout);
      expect(prisma.affiliatePayout.create).toHaveBeenCalled();
    });

    it('should throw error if balance is insufficient', async () => {
      const affiliateId = 'affiliate-id';
      const amount = 100.00;

      const mockAffiliate = {
        id: affiliateId,
        totalEarnings: 50.00,
        totalPaidOut: 0,
      };

      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);

      await expect(
        affiliateService.requestPayout(affiliateId, amount, 'paypal')
      ).rejects.toThrow('Insufficient balance');
    });

    it('should enforce minimum payout amount', async () => {
      const affiliateId = 'affiliate-id';
      const amount = 25.00; // Below minimum

      const mockAffiliate = {
        id: affiliateId,
        totalEarnings: 100.00,
        totalPaidOut: 0,
      };

      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);

      await expect(
        affiliateService.requestPayout(affiliateId, amount, 'paypal')
      ).rejects.toThrow('Minimum payout amount is $50');
    });
  });
});