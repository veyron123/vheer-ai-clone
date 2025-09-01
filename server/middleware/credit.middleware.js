import * as CreditService from '../services/creditService.js';

// Middleware для проверки и начисления ежедневных кредитов
export const checkDailyCredits = async (req, res, next) => {
  try {
    // Проверяем только для аутентифицированных пользователей
    if (req.user && req.user.id) {
      const result = await CreditService.checkAndAddDailyCredits(req.user.id);
      
      // Добавляем информацию о кредитах в объект пользователя
      req.user.creditInfo = result;
      
      // Логируем успешное начисление кредитов
      if (result.success && result.creditsAdded) {
        console.log(`Daily credits added for user ${req.user.id}: +${result.creditsAdded} credits`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in checkDailyCredits middleware:', error);
    // Не прерываем запрос, просто продолжаем без начисления кредитов
    next();
  }
};

// Middleware для проверки достаточности кредитов
export const requireCredits = (requiredAmount) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userCredits = await CreditService.getUserCredits(req.user.id);
      
      if (userCredits.totalCredits < requiredAmount) {
        return res.status(402).json({ 
          error: 'Insufficient credits',
          required: requiredAmount,
          current: userCredits.totalCredits,
          message: `You need ${requiredAmount} credits but only have ${userCredits.totalCredits}`
        });
      }

      // Добавляем информацию о кредитах в запрос
      req.userCredits = userCredits;
      req.requiredCredits = requiredAmount;
      
      next();
    } catch (error) {
      console.error('Error in requireCredits middleware:', error);
      res.status(500).json({ error: 'Error checking credits' });
    }
  };
};

// Middleware для списания кредитов после успешной операции
export const deductCredits = (amount, description) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await CreditService.deductCredits(
        req.user.id, 
        amount, 
        description || 'Operation completed'
      );

      // Добавляем информацию о списании в запрос
      req.creditDeduction = result;
      
      console.log(`Credits deducted for user ${req.user.id}: -${amount} credits. Remaining: ${result.remainingCredits}`);
      
      next();
    } catch (error) {
      console.error('Error in deductCredits middleware:', error);
      
      if (error.message === 'Insufficient credits') {
        return res.status(402).json({ 
          error: 'Insufficient credits',
          message: 'Not enough credits to complete this operation'
        });
      }
      
      res.status(500).json({ error: 'Error processing credits' });
    }
  };
};