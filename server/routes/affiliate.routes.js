import express from 'express';
import * as affiliateController from '../controllers/affiliate.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { body, query, param } from 'express-validator';

const router = express.Router();

// Validation rules
const createLinkValidation = [
  body('alias')
    .optional()
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Alias must contain only letters, numbers, hyphens and underscores'),
  body('utmSource').optional().isString().isLength({ max: 100 }),
  body('utmMedium').optional().isString().isLength({ max: 100 }),
  body('utmCampaign').optional().isString().isLength({ max: 100 })
];

const updateLinkValidation = [
  param('linkId').isString(),
  body('alias')
    .optional()
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Alias must contain only letters, numbers, hyphens and underscores'),
  body('isActive').optional().isBoolean()
];

const paginationValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('status').optional().isIn(['signup', 'trial', 'customer', 'churned'])
];

const payoutValidation = [
  body('amount').isFloat({ min: 50 }).withMessage('Minimum payout amount is $50'),
  body('method').isIn(['bank', 'paypal', 'wise', 'crypto']),
  body('payoutDetails').optional().isObject()
];

// Public routes (no auth required)
router.get('/leaderboard', affiliateController.getLeaderboard);

// Protected routes (authentication required)
router.use(authenticate);

// Affiliate account management
router.post('/create', affiliateController.createAffiliate);
router.get('/dashboard', affiliateController.getAffiliateDashboard);

// Affiliate links management
router.post('/links', createLinkValidation, validateRequest, affiliateController.createAffiliateLink);
router.get('/links', affiliateController.getAffiliateLinks);
router.put('/links/:linkId', updateLinkValidation, validateRequest, affiliateController.updateAffiliateLink);
router.delete('/links/:linkId', param('linkId').isString(), validateRequest, affiliateController.deleteAffiliateLink);

// Referrals and commissions
router.get('/referrals', paginationValidation, validateRequest, affiliateController.getReferrals);
router.get('/commissions', paginationValidation, validateRequest, affiliateController.getCommissions);

// Payouts
router.get('/payouts', paginationValidation, validateRequest, affiliateController.getPayouts);
router.post('/payouts/request', payoutValidation, validateRequest, affiliateController.requestPayout);

// Analytics
router.get('/analytics', [
  query('period').optional().isIn(['7days', '30days', '90days', 'year']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], validateRequest, affiliateController.getAnalytics);

// Sub ID Reports
router.get('/reports/subid', [
  query('timeframe').optional().isIn(['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'custom']),
  query('search').optional().isString()
], validateRequest, affiliateController.getSubIdReports);

export default router;