import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import affiliateRoutes from '../../routes/affiliate.routes.js';
import { authenticate } from '../../middleware/auth.js';
import * as affiliateService from '../../services/affiliateService.js';

// Mock the affiliate service
jest.mock('../../services/affiliateService.js');
jest.mock('../../middleware/auth.js');

const app = express();
app.use(express.json());
app.use('/api/affiliate', affiliateRoutes);

describe('Affiliate API Integration Tests', () => {
  let authToken;
  let mockUserId = 'test-user-123';
  let mockAffiliateId = 'test-affiliate-456';

  beforeAll(() => {
    // Mock JWT token
    authToken = jwt.sign(
      { userId: mockUserId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.userId = mockUserId;
      next();
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/affiliate/create', () => {
    it('should create a new affiliate account', async () => {
      const mockAffiliate = {
        id: mockAffiliateId,
        userId: mockUserId,
        code: 'TEST123',
        commissionRate: 20.0,
        totalEarnings: 0,
      };

      affiliateService.createAffiliate.mockResolvedValue(mockAffiliate);

      const response = await request(app)
        .post('/api/affiliate/create')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        affiliate: mockAffiliate,
      });
      expect(affiliateService.createAffiliate).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 without authentication', async () => {
      authenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .post('/api/affiliate/create')
        .expect(401);
    });
  });

  describe('GET /api/affiliate/dashboard', () => {
    it('should return dashboard data for authenticated affiliate', async () => {
      const mockDashboardData = {
        affiliate: {
          id: mockAffiliateId,
          code: 'TEST123',
          totalEarnings: 500.00,
          pendingEarnings: 100.00,
          availableBalance: 400.00,
        },
        stats: {
          totalClicks: 1000,
          totalSignups: 50,
          totalCustomers: 20,
          conversionRate: 5.0,
        },
        recentActivity: [],
      };

      affiliateService.getAffiliateDashboard.mockResolvedValue(mockDashboardData);

      const response = await request(app)
        .get('/api/affiliate/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockDashboardData,
      });
    });
  });

  describe('POST /api/affiliate/links', () => {
    it('should create a new affiliate link with valid data', async () => {
      const linkData = {
        alias: 'summer-promo',
        utmSource: 'instagram',
        utmMedium: 'social',
        utmCampaign: 'july2024',
      };

      const mockLink = {
        id: 'link-789',
        affiliateId: mockAffiliateId,
        ...linkData,
        clickCount: 0,
        isActive: true,
      };

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.createAffiliateLink.mockResolvedValue(mockLink);

      const response = await request(app)
        .post('/api/affiliate/links')
        .set('Authorization', `Bearer ${authToken}`)
        .send(linkData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        link: mockLink,
      });
    });

    it('should validate alias format', async () => {
      const invalidLinkData = {
        alias: 'invalid alias!', // Contains invalid characters
      };

      const response = await request(app)
        .post('/api/affiliate/links')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLinkData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/affiliate/links', () => {
    it('should return all links for the affiliate', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          alias: 'promo-1',
          clickCount: 100,
          conversionCount: 5,
          isActive: true,
        },
        {
          id: 'link-2',
          alias: 'promo-2',
          clickCount: 50,
          conversionCount: 2,
          isActive: true,
        },
      ];

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.getAffiliateLinks.mockResolvedValue(mockLinks);

      const response = await request(app)
        .get('/api/affiliate/links')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        links: mockLinks,
      });
    });
  });

  describe('PUT /api/affiliate/links/:linkId', () => {
    it('should update an existing link', async () => {
      const linkId = 'link-123';
      const updateData = {
        alias: 'updated-alias',
        isActive: false,
      };

      const mockUpdatedLink = {
        id: linkId,
        ...updateData,
      };

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.updateAffiliateLink.mockResolvedValue(mockUpdatedLink);

      const response = await request(app)
        .put(`/api/affiliate/links/${linkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        link: mockUpdatedLink,
      });
    });
  });

  describe('DELETE /api/affiliate/links/:linkId', () => {
    it('should delete a link', async () => {
      const linkId = 'link-to-delete';

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.deleteAffiliateLink.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/affiliate/links/${linkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Link deleted successfully',
      });
    });
  });

  describe('GET /api/affiliate/referrals', () => {
    it('should return paginated referrals', async () => {
      const mockReferrals = [
        {
          id: 'ref-1',
          userId: 'user-1',
          status: 'customer',
          createdAt: new Date(),
          user: {
            email: 'customer1@example.com',
            fullName: 'Customer One',
          },
        },
        {
          id: 'ref-2',
          userId: 'user-2',
          status: 'signup',
          createdAt: new Date(),
          user: {
            email: 'customer2@example.com',
            fullName: 'Customer Two',
          },
        },
      ];

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.getReferrals.mockResolvedValue({
        referrals: mockReferrals,
        total: 2,
      });

      const response = await request(app)
        .get('/api/affiliate/referrals')
        .query({ limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        referrals: mockReferrals,
        total: 2,
      });
    });

    it('should filter referrals by status', async () => {
      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.getReferrals.mockResolvedValue({
        referrals: [],
        total: 0,
      });

      await request(app)
        .get('/api/affiliate/referrals')
        .query({ status: 'customer' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(affiliateService.getReferrals).toHaveBeenCalledWith(
        mockAffiliateId,
        expect.objectContaining({ status: 'customer' })
      );
    });
  });

  describe('GET /api/affiliate/commissions', () => {
    it('should return commission history', async () => {
      const mockCommissions = [
        {
          id: 'comm-1',
          amount: 20.00,
          status: 'paid',
          orderId: 'order-1',
          createdAt: new Date(),
        },
        {
          id: 'comm-2',
          amount: 15.00,
          status: 'pending',
          orderId: 'order-2',
          createdAt: new Date(),
        },
      ];

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.getCommissions.mockResolvedValue({
        commissions: mockCommissions,
        total: 35.00,
      });

      const response = await request(app)
        .get('/api/affiliate/commissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        commissions: mockCommissions,
        total: 35.00,
      });
    });
  });

  describe('POST /api/affiliate/payouts/request', () => {
    it('should create payout request with valid amount', async () => {
      const payoutData = {
        amount: 100.00,
        method: 'paypal',
        payoutDetails: {
          email: 'affiliate@example.com',
        },
      };

      const mockPayout = {
        id: 'payout-1',
        ...payoutData,
        status: 'pending',
        createdAt: new Date(),
      };

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.requestPayout.mockResolvedValue(mockPayout);

      const response = await request(app)
        .post('/api/affiliate/payouts/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payoutData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        payout: expect.objectContaining({
          amount: 100.00,
          method: 'paypal',
          status: 'pending',
        }),
      });
    });

    it('should reject payout below minimum amount', async () => {
      const invalidPayoutData = {
        amount: 25.00, // Below $50 minimum
        method: 'paypal',
      };

      const response = await request(app)
        .post('/api/affiliate/payouts/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayoutData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/affiliate/analytics', () => {
    it('should return analytics for specified period', async () => {
      const mockAnalytics = {
        summary: {
          totalClicks: 500,
          totalSignups: 25,
          totalCustomers: 10,
          totalCommissions: 200.00,
          conversionRate: 5.0,
        },
        dailyStats: [
          { date: '2024-01-01', clicks: 50, signups: 3, customers: 1, revenue: 20.00 },
          { date: '2024-01-02', clicks: 45, signups: 2, customers: 1, revenue: 15.00 },
        ],
        linkPerformance: [],
        topReferrals: [],
      };

      affiliateService.getAffiliateByUserId.mockResolvedValue({ id: mockAffiliateId });
      affiliateService.getAffiliateAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/affiliate/analytics')
        .query({ period: '30days' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        analytics: mockAnalytics,
      });
    });

    it('should validate date range parameters', async () => {
      await request(app)
        .get('/api/affiliate/analytics')
        .query({ 
          startDate: 'invalid-date',
          endDate: '2024-01-31',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/affiliate/leaderboard', () => {
    it('should return public leaderboard without authentication', async () => {
      const mockLeaderboard = [
        { rank: 1, code: 'TOP***', earnings: 1000.00 },
        { rank: 2, code: 'SEC***', earnings: 750.00 },
        { rank: 3, code: 'THI***', earnings: 500.00 },
      ];

      affiliateService.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const response = await request(app)
        .get('/api/affiliate/leaderboard')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        leaderboard: mockLeaderboard,
      });
    });
  });
});