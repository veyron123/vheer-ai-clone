import affiliateService from '../services/affiliateService.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Middleware to track affiliate clicks and set referral cookies
 */
export const trackAffiliateClick = async (req, res, next) => {
  try {
    // Check for affiliate parameters in URL
    const { ref, fp, fp_sid, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = req.query;
    
    console.log('🔍 [AFFILIATE TRACKING] Request:', req.url);
    console.log('🔍 [AFFILIATE TRACKING] Query params:', req.query);
    
    // If no affiliate code, continue
    if (!ref && !fp) {
      return next();
    }
    
    // Find affiliate and link
    let affiliate = null;
    let link = null;
    
    if (ref) {
      // Direct affiliate code
      affiliate = await prisma.affiliate.findUnique({
        where: { code: ref }
      });
    }
    
    if (fp) {
      // Find by link alias
      link = await prisma.affiliateLink.findUnique({
        where: { alias: fp },
        include: {
          affiliate: true
        }
      });
      
      if (link) {
        affiliate = link.affiliate;
      }
    }
    
    // If no valid affiliate found, continue
    if (!affiliate) {
      console.log(`Invalid affiliate reference: ref=${ref}, fp=${fp}`);
      return next();
    }
    
    // If no specific link found but affiliate exists, use default link
    if (!link && affiliate) {
      link = await prisma.affiliateLink.findFirst({
        where: {
          affiliateId: affiliate.id,
          isDefault: true
        }
      });
    }
    
    // Generate or get session ID
    let sessionId = req.cookies.affiliate_session;
    if (!sessionId) {
      sessionId = crypto.randomBytes(16).toString('hex');
      res.cookie('affiliate_session', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    // Get tracking data
    const trackingData = {
      sessionId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      landingPage: req.originalUrl,
      subId: fp_sid || null, // Track Sub ID from fp_sid parameter
      utmSource: utm_source || req.query.utm_source,
      utmMedium: utm_medium || req.query.utm_medium,
      utmCampaign: utm_campaign || req.query.utm_campaign,
      utmTerm: utm_term || req.query.utm_term,
      utmContent: utm_content || req.query.utm_content,
      country: req.get('CF-IPCountry') || null, // Cloudflare geo header
      city: req.get('CF-City') || null,
      deviceType: getDeviceType(req.get('User-Agent'))
    };
    
    // Track the click (only if link exists)
    const click = link ? await affiliateService.trackClick(link.id, trackingData) : null;
    
    // Set affiliate cookie for 30 days
    res.cookie('affiliate_code', affiliate.code, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Store click ID in cookie for attribution
    if (click) {
      res.cookie('affiliate_click', click.id, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    console.log(`Affiliate click tracked: ${affiliate.code} via ${link?.alias || 'default'}${fp_sid ? ` (subId: ${fp_sid})` : ''}`);
    
    // Add affiliate info to request for downstream use
    req.affiliateTracking = {
      affiliateCode: affiliate.code,
      clickId: click?.id,
      linkId: link.id
    };
    
    next();
  } catch (error) {
    console.error('Affiliate tracking error:', error);
    // Don't block request on tracking errors
    next();
  }
};

/**
 * Middleware to track affiliate referral on user registration
 */
export const trackAffiliateReferral = async (userId) => {
  try {
    // This function should be called after successful user registration
    // Get affiliate code from the new user's session/cookies
    
    // In a real implementation, you'd get the affiliate code from the request context
    // For now, we'll need to pass it from the registration controller
    
    // The actual implementation would be called from auth.controller.js after user creation
    console.log(`Ready to track affiliate referral for user ${userId}`);
  } catch (error) {
    console.error('Affiliate referral tracking error:', error);
  }
};

/**
 * Track affiliate conversion on payment
 */
export const trackAffiliateConversion = async (userId, orderId, amount) => {
  try {
    // Convert referral to customer and create commission
    const commission = await affiliateService.convertReferralToCustomer(userId, orderId, amount);
    
    if (commission) {
      console.log(`Affiliate conversion tracked: User ${userId}, Commission: $${commission.amount}`);
    }
    
    return commission;
  } catch (error) {
    console.error('Affiliate conversion tracking error:', error);
    return null;
  }
};

/**
 * Helper function to determine device type
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  userAgent = userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

export default {
  trackAffiliateClick,
  trackAffiliateReferral,
  trackAffiliateConversion
};