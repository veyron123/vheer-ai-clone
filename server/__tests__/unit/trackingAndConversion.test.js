import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as affiliateService from '../../services/affiliateService.js';
import prisma from '../../config/database.js';

// Mock Prisma
jest.mock('../../config/database.js', () => ({
  default: {
    affiliate: { findUnique: jest.fn() },
    affiliateLink: { findUnique: jest.fn(), update: jest.fn() },
    affiliateClick: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    affiliateReferral: { 
      create: jest.fn(), 
      findFirst: jest.fn(), 
      update: jest.fn(),
      findMany: jest.fn() 
    },
    affiliateCommission: { create: jest.fn(), update: jest.fn() },
    affiliateDailyStats: { 
      findFirst: jest.fn(), 
      create: jest.fn(), 
      update: jest.fn() 
    },
    user: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  }
}));

describe('Click Tracking and Conversion Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Click Tracking Flow', () => {
    it('should track unique click and update link stats', async () => {
      const clickData = {
        affiliateCode: 'TRACK123',
        linkId: 'link-123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome',
        referrer: 'https://instagram.com',
        sessionId: 'unique-session-123',
        country: 'US',
        city: 'New York',
      };

      const mockAffiliate = { 
        id: 'aff-123', 
        code: 'TRACK123',
        userId: 'user-123' 
      };
      
      const mockLink = { 
        id: 'link-123', 
        affiliateId: 'aff-123',
        clickCount: 10 
      };

      // Setup mocks
      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prisma.affiliateLink.findUnique.mockResolvedValue(mockLink);
      prisma.affiliateClick.findMany.mockResolvedValue([]); // No duplicate
      prisma.affiliateClick.create.mockResolvedValue({ 
        id: 'click-123',
        ...clickData 
      });
      prisma.$transaction.mockImplementation(async (fn) => await fn(prisma));

      // Execute
      const result = await affiliateService.trackClick(clickData);

      // Verify
      expect(result).toBeDefined();
      expect(prisma.affiliateClick.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          affiliateId: 'aff-123',
          linkId: 'link-123',
          ipAddress: '192.168.1.100',
          sessionId: 'unique-session-123',
        })
      });

      // Verify link click count update
      expect(prisma.affiliateLink.update).toHaveBeenCalledWith({
        where: { id: 'link-123' },
        data: { clickCount: { increment: 1 } }
      });
    });

    it('should prevent duplicate clicks from same session', async () => {
      const sessionId = 'duplicate-session';
      const existingClick = {
        id: 'existing-click',
        sessionId,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };

      prisma.affiliate.findUnique.mockResolvedValue({ id: 'aff-123', code: 'TEST' });
      prisma.affiliateClick.findMany.mockResolvedValue([existingClick]);

      const result = await affiliateService.trackClick({
        affiliateCode: 'TEST',
        sessionId,
      });

      expect(result).toBeNull();
      expect(prisma.affiliateClick.create).not.toHaveBeenCalled();
    });

    it('should allow clicks from same IP but different sessions', async () => {
      const ipAddress = '192.168.1.100';
      
      prisma.affiliate.findUnique.mockResolvedValue({ id: 'aff-123', code: 'TEST' });
      prisma.affiliateClick.findMany.mockResolvedValue([]); // No duplicates
      prisma.affiliateClick.create.mockResolvedValue({ id: 'click-new' });
      prisma.$transaction.mockImplementation(async (fn) => await fn(prisma));

      const result1 = await affiliateService.trackClick({
        affiliateCode: 'TEST',
        ipAddress,
        sessionId: 'session-1',
      });

      const result2 = await affiliateService.trackClick({
        affiliateCode: 'TEST',
        ipAddress,
        sessionId: 'session-2',
      });

      expect(prisma.affiliateClick.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Referral Registration Flow', () => {
    it('should create referral when user registers via affiliate link', async () => {
      const userId = 'new-user-123';
      const affiliateCode = 'REF123';
      const clickId = 'click-123';

      const mockAffiliate = { 
        id: 'aff-123', 
        code: 'REF123',
        userId: 'affiliate-user-123'
      };

      const mockClick = {
        id: clickId,
        affiliateId: 'aff-123',
        createdAt: new Date(),
      };

      // Prevent self-referral
      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);
      prisma.affiliateClick.findMany.mockResolvedValue([mockClick]);
      prisma.affiliateReferral.findFirst.mockResolvedValue(null); // No existing referral
      prisma.affiliateReferral.create.mockResolvedValue({
        id: 'ref-123',
        userId,
        affiliateId: 'aff-123',
        clickId,
        status: 'signup',
      });
      prisma.user.update.mockResolvedValue({ id: userId });

      const result = await affiliateService.createReferral(userId, affiliateCode, clickId);

      expect(result).toBeDefined();
      expect(result.status).toBe('signup');
      expect(prisma.affiliateReferral.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          affiliateId: 'aff-123',
          status: 'signup',
        })
      });
    });

    it('should prevent self-referral', async () => {
      const userId = 'user-123';
      const affiliateCode = 'SELF123';

      const mockAffiliate = { 
        id: 'aff-123', 
        code: 'SELF123',
        userId: 'user-123' // Same as referring user
      };

      prisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);

      await expect(
        affiliateService.createReferral(userId, affiliateCode)
      ).rejects.toThrow('Self-referral not allowed');

      expect(prisma.affiliateReferral.create).not.toHaveBeenCalled();
    });
  });

  describe('Conversion Tracking Flow', () => {
    it('should track conversion from signup to customer', async () => {
      const userId = 'converting-user';
      const orderId = 'order-123';
      const orderAmount = 99.99;

      const mockReferral = {
        id: 'ref-123',
        userId,
        affiliateId: 'aff-123',
        status: 'signup',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
        affiliate: {
          id: 'aff-123',
          commissionRate: 20.0,
          totalEarnings: 100.00,
        }
      };

      // Mock transaction
      prisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          affiliateReferral: { 
            update: jest.fn().mockResolvedValue({
              ...mockReferral,
              status: 'customer',
              firstPaymentDate: new Date(),
              lifetimeValue: orderAmount,
            })
          },
          affiliateCommission: { 
            create: jest.fn().mockResolvedValue({
              id: 'comm-123',
              affiliateId: 'aff-123',
              referralId: 'ref-123',
              orderId,
              amount: orderAmount * 0.2,
              status: 'pending',
            })
          },
          affiliate: { 
            update: jest.fn().mockResolvedValue({
              totalEarnings: 119.99,
            })
          },
        };
        return await fn(mockTx);
      });

      prisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);

      const result = await affiliateService.convertReferralToCustomer(
        userId, 
        orderId, 
        orderAmount
      );

      expect(result).toBeDefined();
      expect(result.amount).toBe(19.998); // 20% of 99.99
      expect(result.status).toBe('pending');
    });

    it('should update lifetime value on repeat purchases', async () => {
      const userId = 'repeat-customer';
      const orderId = 'order-456';
      const orderAmount = 150.00;

      const mockReferral = {
        id: 'ref-123',
        userId,
        affiliateId: 'aff-123',
        status: 'customer', // Already a customer
        lifetimeValue: 200.00, // Previous purchases
        affiliate: {
          id: 'aff-123',
          commissionRate: 20.0,
        }
      };

      prisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          affiliateReferral: { 
            update: jest.fn().mockResolvedValue({
              ...mockReferral,
              lifetimeValue: 350.00, // Updated total
            })
          },
          affiliateCommission: { 
            create: jest.fn().mockResolvedValue({
              amount: 30.00, // 20% of 150
              status: 'pending',
            })
          },
          affiliate: { update: jest.fn() },
        };
        return await fn(mockTx);
      });

      prisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);

      const result = await affiliateService.convertReferralToCustomer(
        userId, 
        orderId, 
        orderAmount
      );

      expect(result.amount).toBe(30.00);
    });
  });

  describe('Daily Statistics Tracking', () => {
    it('should aggregate daily statistics correctly', async () => {
      const affiliateId = 'aff-123';
      const date = new Date('2024-01-15');
      
      const existingStats = {
        id: 'stats-123',
        affiliateId,
        date,
        clicks: 50,
        signups: 5,
        customers: 2,
        revenue: 200.00,
        commissions: 40.00,
      };

      prisma.affiliateDailyStats.findFirst.mockResolvedValue(existingStats);
      prisma.affiliateDailyStats.update.mockResolvedValue({
        ...existingStats,
        clicks: 51,
      });

      await affiliateService.updateDailyStats(affiliateId, date, {
        clicks: 1,
      });

      expect(prisma.affiliateDailyStats.update).toHaveBeenCalledWith({
        where: { id: 'stats-123' },
        data: expect.objectContaining({
          clicks: { increment: 1 },
        })
      });
    });

    it('should create new daily stats if not exists', async () => {
      const affiliateId = 'aff-123';
      const date = new Date('2024-01-16');

      prisma.affiliateDailyStats.findFirst.mockResolvedValue(null);
      prisma.affiliateDailyStats.create.mockResolvedValue({
        id: 'stats-new',
        affiliateId,
        date,
        clicks: 1,
        signups: 0,
        customers: 0,
        revenue: 0,
        commissions: 0,
      });

      await affiliateService.updateDailyStats(affiliateId, date, {
        clicks: 1,
      });

      expect(prisma.affiliateDailyStats.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          affiliateId,
          date: expect.any(Date),
          clicks: 1,
        })
      });
    });
  });

  describe('Cookie Tracking', () => {
    it('should set affiliate cookie with 30-day expiration', () => {
      const res = {
        cookie: jest.fn(),
      };
      const affiliateCode = 'COOKIE123';

      affiliateService.setAffiliateCookie(res, affiliateCode);

      expect(res.cookie).toHaveBeenCalledWith(
        'ref',
        affiliateCode,
        expect.objectContaining({
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        })
      );
    });

    it('should read and validate affiliate cookie', () => {
      const req = {
        cookies: {
          ref: 'VALID123',
        },
      };

      const affiliateCode = affiliateService.getAffiliateCookie(req);
      expect(affiliateCode).toBe('VALID123');
    });

    it('should handle missing affiliate cookie', () => {
      const req = {
        cookies: {},
      };

      const affiliateCode = affiliateService.getAffiliateCookie(req);
      expect(affiliateCode).toBeNull();
    });
  });

  describe('Attribution Window', () => {
    it('should attribute conversion within 30-day window', async () => {
      const userId = 'user-attribution';
      const clickDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

      const mockReferral = {
        id: 'ref-123',
        userId,
        createdAt: clickDate,
        status: 'signup',
        affiliate: {
          id: 'aff-123',
          commissionRate: 20.0,
        }
      };

      prisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);
      prisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          affiliateReferral: { update: jest.fn() },
          affiliateCommission: { 
            create: jest.fn().mockResolvedValue({
              amount: 20.00,
              status: 'pending',
            })
          },
          affiliate: { update: jest.fn() },
        };
        return await fn(mockTx);
      });

      const result = await affiliateService.convertReferralToCustomer(
        userId, 
        'order-123', 
        100.00
      );

      expect(result).toBeDefined();
      expect(result.amount).toBe(20.00);
    });

    it('should not attribute conversion after 30-day window expires', async () => {
      const userId = 'user-expired';
      const clickDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

      const mockReferral = {
        id: 'ref-expired',
        userId,
        createdAt: clickDate,
        status: 'signup',
      };

      prisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);

      const result = await affiliateService.convertReferralToCustomer(
        userId, 
        'order-expired', 
        100.00
      );

      expect(result).toBeNull();
      expect(prisma.affiliateCommission.create).not.toHaveBeenCalled();
    });
  });
});