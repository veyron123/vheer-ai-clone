import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as affiliateService from '../../services/affiliateService.js';
import prisma from '../../config/database.js';

// Mock Prisma
jest.mock('../../config/database.js', () => ({
  default: {
    affiliate: { 
      findUnique: jest.fn(), 
      update: jest.fn() 
    },
    affiliateReferral: { 
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn() 
    },
    affiliateCommission: { 
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn() 
    },
    affiliatePayout: {
      findMany: jest.fn(),
      aggregate: jest.fn()
    },
    $transaction: jest.fn(),
  }
}));

describe('Commission Calculation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Commission Rate Calculations', () => {
    it('should calculate 20% commission correctly', async () => {
      const orderAmount = 100.00;
      const commissionRate = 20.0;
      const expectedCommission = 20.00;

      const result = affiliateService.calculateCommissionAmount(orderAmount, commissionRate);
      
      expect(result).toBe(expectedCommission);
      expect(result).toEqual(orderAmount * (commissionRate / 100));
    });

    it('should handle different commission rates', async () => {
      const testCases = [
        { amount: 100, rate: 10, expected: 10 },
        { amount: 100, rate: 15, expected: 15 },
        { amount: 100, rate: 25, expected: 25 },
        { amount: 100, rate: 30, expected: 30 },
        { amount: 250, rate: 20, expected: 50 },
        { amount: 99.99, rate: 20, expected: 19.998 },
      ];

      testCases.forEach(({ amount, rate, expected }) => {
        const result = affiliateService.calculateCommissionAmount(amount, rate);
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    it('should handle decimal amounts correctly', async () => {
      const orderAmount = 49.99;
      const commissionRate = 20.0;
      const expectedCommission = 9.998;

      const result = affiliateService.calculateCommissionAmount(orderAmount, commissionRate);
      
      expect(result).toBeCloseTo(expectedCommission, 3);
    });
  });

  describe('Recurring Commission Calculations', () => {
    it('should calculate recurring monthly commissions', async () => {
      const userId = 'recurring-user';
      const monthlyAmount = 29.99;
      const commissionRate = 20.0;

      const mockReferral = {
        id: 'ref-123',
        userId,
        affiliateId: 'aff-123',
        status: 'customer',
        lifetimeValue: 359.88, // 12 months of payments
        affiliate: {
          id: 'aff-123',
          commissionRate: 20.0,
        }
      };

      // Mock 12 monthly payments
      const mockCommissions = Array.from({ length: 12 }, (_, i) => ({
        id: `comm-${i}`,
        amount: monthlyAmount * 0.2,
        status: i < 6 ? 'paid' : 'pending',
        createdAt: new Date(Date.now() - (12 - i) * 30 * 24 * 60 * 60 * 1000),
      }));

      prisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);
      prisma.affiliateCommission.findMany.mockResolvedValue(mockCommissions);

      const totalCommissions = await affiliateService.getTotalRecurringCommissions(
        'aff-123',
        'ref-123'
      );

      const expectedTotal = mockCommissions.reduce((sum, c) => sum + c.amount, 0);
      expect(totalCommissions).toBeCloseTo(expectedTotal, 2);
    });

    it('should handle subscription upgrades with adjusted commission', async () => {
      const userId = 'upgrade-user';
      const initialPlan = 29.99;
      const upgradedPlan = 49.99;
      const commissionRate = 20.0;

      // First payment - initial plan
      const firstCommission = await affiliateService.calculateCommissionAmount(
        initialPlan, 
        commissionRate
      );
      expect(firstCommission).toBeCloseTo(5.998, 3);

      // Upgrade - calculate adjusted commission
      const upgradeCommission = await affiliateService.calculateCommissionAmount(
        upgradedPlan, 
        commissionRate
      );
      expect(upgradeCommission).toBeCloseTo(9.998, 3);

      // Total commission after upgrade
      const totalMonthlyCommission = upgradeCommission;
      expect(totalMonthlyCommission).toBeCloseTo(9.998, 3);
    });

    it('should stop commissions when subscription cancelled', async () => {
      const referralId = 'ref-cancelled';
      
      const mockCommissions = [
        { id: 'comm-1', amount: 6.00, status: 'paid', createdAt: new Date('2024-01-01') },
        { id: 'comm-2', amount: 6.00, status: 'paid', createdAt: new Date('2024-02-01') },
        { id: 'comm-3', amount: 6.00, status: 'paid', createdAt: new Date('2024-03-01') },
        // Subscription cancelled after 3 months
      ];

      prisma.affiliateCommission.findMany.mockResolvedValue(mockCommissions);
      
      const result = await affiliateService.getCommissionHistory('aff-123', {
        referralId,
      });

      expect(result.commissions).toHaveLength(3);
      expect(result.total).toBe(18.00);
    });
  });

  describe('Commission Status Management', () => {
    it('should create commission with pending status', async () => {
      const commissionData = {
        affiliateId: 'aff-123',
        referralId: 'ref-123',
        orderId: 'order-123',
        amount: 20.00,
      };

      const mockCommission = {
        ...commissionData,
        id: 'comm-123',
        status: 'pending',
        createdAt: new Date(),
      };

      prisma.affiliateCommission.create.mockResolvedValue(mockCommission);

      const result = await affiliateService.createCommission(commissionData);

      expect(result.status).toBe('pending');
      expect(prisma.affiliateCommission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'pending',
        })
      });
    });

    it('should update commission status to paid after processing', async () => {
      const commissionId = 'comm-123';
      
      prisma.affiliateCommission.update.mockResolvedValue({
        id: commissionId,
        status: 'paid',
        paidAt: new Date(),
      });

      const result = await affiliateService.markCommissionAsPaid(commissionId);

      expect(result.status).toBe('paid');
      expect(result.paidAt).toBeDefined();
      expect(prisma.affiliateCommission.update).toHaveBeenCalledWith({
        where: { id: commissionId },
        data: expect.objectContaining({
          status: 'paid',
          paidAt: expect.any(Date),
        })
      });
    });

    it('should handle commission reversals for refunds', async () => {
      const orderId = 'refunded-order';
      
      const mockCommission = {
        id: 'comm-refund',
        orderId,
        amount: 20.00,
        status: 'paid',
      };

      prisma.affiliateCommission.findMany.mockResolvedValue([mockCommission]);
      prisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          affiliateCommission: {
            update: jest.fn().mockResolvedValue({
              ...mockCommission,
              status: 'reversed',
            })
          },
          affiliate: {
            update: jest.fn()
          }
        };
        return await fn(mockTx);
      });

      const result = await affiliateService.reverseCommission(orderId);

      expect(result.status).toBe('reversed');
    });
  });

  describe('Balance Calculations', () => {
    it('should calculate available balance correctly', async () => {
      const affiliateId = 'aff-balance';
      
      // Total earnings
      prisma.affiliateCommission.aggregate.mockResolvedValueOnce({
        _sum: { amount: 500.00 }
      });
      
      // Pending commissions
      prisma.affiliateCommission.aggregate.mockResolvedValueOnce({
        _sum: { amount: 100.00 }
      });
      
      // Total paid out
      prisma.affiliatePayout.aggregate.mockResolvedValue({
        _sum: { amount: 200.00 }
      });

      const balance = await affiliateService.getAffiliateBalance(affiliateId);

      expect(balance).toEqual({
        totalEarnings: 500.00,
        pendingCommissions: 100.00,
        totalPaidOut: 200.00,
        availableBalance: 200.00, // 500 - 100 (pending) - 200 (paid out)
      });
    });

    it('should enforce minimum payout threshold', async () => {
      const affiliateId = 'aff-minimum';
      const requestedAmount = 45.00; // Below $50 minimum
      
      const mockBalance = {
        availableBalance: 100.00,
      };

      jest.spyOn(affiliateService, 'getAffiliateBalance')
        .mockResolvedValue(mockBalance);

      await expect(
        affiliateService.requestPayout(affiliateId, requestedAmount, 'paypal')
      ).rejects.toThrow('Minimum payout amount is $50');
    });
  });

  describe('Commission Aggregation and Reporting', () => {
    it('should aggregate commissions by period', async () => {
      const affiliateId = 'aff-report';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockCommissions = [
        { amount: 20.00, createdAt: new Date('2024-01-05') },
        { amount: 15.00, createdAt: new Date('2024-01-15') },
        { amount: 25.00, createdAt: new Date('2024-01-25') },
      ];

      prisma.affiliateCommission.findMany.mockResolvedValue(mockCommissions);
      prisma.affiliateCommission.aggregate.mockResolvedValue({
        _sum: { amount: 60.00 },
        _count: 3,
        _avg: { amount: 20.00 },
      });

      const report = await affiliateService.getCommissionReport(
        affiliateId,
        startDate,
        endDate
      );

      expect(report.total).toBe(60.00);
      expect(report.count).toBe(3);
      expect(report.average).toBe(20.00);
    });

    it('should calculate commission by referral source', async () => {
      const affiliateId = 'aff-source';
      
      const mockData = [
        { referral: { source: 'instagram' }, amount: 100.00 },
        { referral: { source: 'instagram' }, amount: 50.00 },
        { referral: { source: 'twitter' }, amount: 75.00 },
        { referral: { source: 'blog' }, amount: 125.00 },
      ];

      prisma.affiliateCommission.findMany.mockResolvedValue(mockData);

      const bySource = await affiliateService.getCommissionsBySource(affiliateId);

      expect(bySource).toEqual({
        instagram: 150.00,
        twitter: 75.00,
        blog: 125.00,
      });
    });
  });

  describe('Tier-based Commission Rates', () => {
    it('should apply tiered commission rates based on performance', async () => {
      const testCases = [
        { totalSales: 500, expectedRate: 20 },    // Base tier
        { totalSales: 1500, expectedRate: 22 },   // Silver tier
        { totalSales: 5500, expectedRate: 25 },   // Gold tier
        { totalSales: 15000, expectedRate: 30 },  // Platinum tier
      ];

      testCases.forEach(({ totalSales, expectedRate }) => {
        const rate = affiliateService.getTieredCommissionRate(totalSales);
        expect(rate).toBe(expectedRate);
      });
    });

    it('should apply bonus commissions for high performers', async () => {
      const affiliateId = 'aff-bonus';
      const monthlyTarget = 1000.00;
      const actualSales = 1500.00;
      const bonusRate = 5.0; // Additional 5% for exceeding target

      const baseCommission = actualSales * 0.20; // 300
      const bonusCommission = (actualSales - monthlyTarget) * (bonusRate / 100); // 25
      const totalCommission = baseCommission + bonusCommission; // 325

      const result = affiliateService.calculateCommissionWithBonus(
        actualSales,
        20.0,
        monthlyTarget,
        bonusRate
      );

      expect(result).toBeCloseTo(totalCommission, 2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero order amounts', async () => {
      const result = affiliateService.calculateCommissionAmount(0, 20);
      expect(result).toBe(0);
    });

    it('should handle negative amounts gracefully', async () => {
      const result = affiliateService.calculateCommissionAmount(-100, 20);
      expect(result).toBe(0);
    });

    it('should handle invalid commission rates', async () => {
      expect(() => affiliateService.calculateCommissionAmount(100, -10))
        .toThrow('Invalid commission rate');
      
      expect(() => affiliateService.calculateCommissionAmount(100, 101))
        .toThrow('Invalid commission rate');
    });

    it('should handle floating point precision', async () => {
      const amount = 33.33;
      const rate = 20.0;
      const expected = 6.666;
      
      const result = affiliateService.calculateCommissionAmount(amount, rate);
      
      // Use toBeCloseTo for floating point comparison
      expect(result).toBeCloseTo(expected, 3);
    });
  });
});