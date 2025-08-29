import crypto from 'crypto';
import axios from 'axios';
import logger from '../utils/logger.js';

class WayForPayRecurringService {
  constructor() {
    this.merchantAccount = process.env.WAYFORPAY_MERCHANT_LOGIN;
    this.merchantPassword = process.env.WAYFORPAY_MERCHANT_PASSWORD;
    this.merchantSecret = process.env.WAYFORPAY_MERCHANT_SECRET;
    this.apiUrl = 'https://api.wayforpay.com/regularApi';
  }

  /**
   * Generate signature for WayForPay request
   * @param {Object} params 
   * @returns {string}
   */
  generateSignature(params) {
    const signatureFields = [
      params.merchantAccount,
      params.orderReference,
      params.amount,
      params.currency,
      params.merchantPassword
    ];
    
    const signatureString = signatureFields.join(';');
    // Use HMAC with secret for signature generation
    return crypto.createHmac('md5', this.merchantSecret)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Create recurring payment
   * @param {Object} paymentData 
   * @returns {Promise<Object>}
   */
  async createRecurringPayment(paymentData) {
    try {
      const {
        orderReference,
        amount,
        currency = 'UAH',
        productName,
        productPrice,
        productCount = 1,
        regularMode, // 'MONTHLY', 'YEARLY'
        dateBegin, // Start date in DD.MM.YYYY format
        dateEnd,   // End date in DD.MM.YYYY format
        recToken   // Recurring token from previous payment
      } = paymentData;

      const requestData = {
        transactionType: 'CREATE_REGULAR_PAYMENT',
        merchantAccount: this.merchantAccount,
        merchantPassword: this.merchantPassword,
        orderReference,
        amount,
        currency,
        productName: Array.isArray(productName) ? productName : [productName],
        productPrice: Array.isArray(productPrice) ? productPrice : [productPrice],
        productCount: Array.isArray(productCount) ? productCount : [productCount],
        regularMode,
        dateBegin,
        dateEnd,
        recToken
      };

      // Generate signature
      requestData.merchantSignature = this.generateSignature(requestData);

      logger.info('🔄 Creating recurring payment with WayForPay:', {
        orderReference,
        amount,
        regularMode
      });

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.reasonCode === 1100) {
        logger.info('✅ Recurring payment created successfully:', response.data);
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.error('❌ Failed to create recurring payment:', response.data);
        return {
          success: false,
          error: response.data.reason || 'Failed to create recurring payment',
          data: response.data
        };
      }

    } catch (error) {
      logger.error('❌ Error creating recurring payment:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Charge recurring payment
   * @param {Object} chargeData 
   * @returns {Promise<Object>}
   */
  async chargeRecurringPayment(chargeData) {
    try {
      const {
        orderReference,
        amount,
        currency = 'UAH',
        recToken
      } = chargeData;

      const requestData = {
        transactionType: 'CHARGE',
        merchantAccount: this.merchantAccount,
        merchantPassword: this.merchantPassword,
        orderReference,
        amount,
        currency,
        recToken
      };

      // Generate signature
      requestData.merchantSignature = this.generateSignature(requestData);

      logger.info('💳 Charging recurring payment:', {
        orderReference,
        amount,
        recToken: recToken?.slice(0, 8) + '...'
      });

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.reasonCode === 1100) {
        logger.info('✅ Recurring payment charged successfully:', {
          orderReference,
          amount,
          transactionStatus: response.data.transactionStatus
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.error('❌ Failed to charge recurring payment:', response.data);
        return {
          success: false,
          error: response.data.reason || 'Failed to charge recurring payment',
          data: response.data
        };
      }

    } catch (error) {
      logger.error('❌ Error charging recurring payment:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Cancel recurring payment
   * @param {string} orderReference 
   * @returns {Promise<Object>}
   */
  async cancelRecurringPayment(orderReference) {
    try {
      const requestData = {
        transactionType: 'REMOVE_REGULAR_PAYMENT',
        merchantAccount: this.merchantAccount,
        merchantPassword: this.merchantPassword,
        orderReference
      };

      // Generate signature
      requestData.merchantSignature = this.generateSignature(requestData);

      logger.info('🚫 Cancelling recurring payment:', { orderReference });

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.reasonCode === 1100) {
        logger.info('✅ Recurring payment cancelled successfully:', { orderReference });
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.error('❌ Failed to cancel recurring payment:', response.data);
        return {
          success: false,
          error: response.data.reason || 'Failed to cancel recurring payment',
          data: response.data
        };
      }

    } catch (error) {
      logger.error('❌ Error cancelling recurring payment:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Check status of recurring payment
   * @param {string} orderReference 
   * @returns {Promise<Object>}
   */
  async getRecurringPaymentStatus(orderReference) {
    try {
      const requestData = {
        transactionType: 'CHECK_STATUS',
        merchantAccount: this.merchantAccount,
        merchantPassword: this.merchantPassword,
        orderReference
      };

      // Generate signature
      requestData.merchantSignature = this.generateSignature(requestData);

      const response = await axios.post(this.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('❌ Error checking recurring payment status:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Calculate next payment date
   * @param {string} mode - 'MONTHLY' or 'YEARLY'
   * @param {Date} fromDate - Starting date
   * @returns {Date}
   */
  calculateNextPaymentDate(mode, fromDate = new Date()) {
    const nextDate = new Date(fromDate);
    
    if (mode === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (mode === 'YEARLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    return nextDate;
  }

  /**
   * Format date for WayForPay (DD.MM.YYYY)
   * @param {Date} date 
   * @returns {string}
   */
  formatDateForWayForPay(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}

export default WayForPayRecurringService;