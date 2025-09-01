import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        role: true,
        subscription: true
      }
    });
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const checkSubscription = (requiredPlan = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user.subscription) {
        return res.status(403).json({ error: 'No active subscription' });
      }
      
      if (requiredPlan) {
        const planHierarchy = {
          'FREE': 0,
          'BASIC': 1,
          'PRO': 2,
          'ENTERPRISE': 3
        };
        
        const userPlanLevel = planHierarchy[req.user.subscription.plan];
        const requiredPlanLevel = planHierarchy[requiredPlan];
        
        if (userPlanLevel < requiredPlanLevel) {
          return res.status(403).json({ 
            error: `This feature requires ${requiredPlan} plan or higher` 
          });
        }
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error checking subscription' });
    }
  };
};

export const checkCredits = async (req, res, next) => {
  try {
    const creditsNeeded = req.body.creditsNeeded || 1;
    
    const userCredits = await prisma.credit.aggregate({
      where: { userId: req.user.id },
      _sum: { amount: true }
    });
    
    const totalCredits = userCredits._sum.amount || 0;
    
    if (totalCredits < creditsNeeded) {
      return res.status(403).json({ 
        error: 'Insufficient credits',
        creditsNeeded,
        creditsAvailable: totalCredits
      });
    }
    
    req.userCredits = totalCredits;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking credits' });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    // Check both role and email for admin access
    const adminEmails = [
      'admin@colibrrri.com',
      'denisbelikin31@gmail.com', // Add your admin email here
      'unitradacergo@gmail.com',  // Admin user for dashboard access
      process.env.ADMIN_EMAIL
    ].filter(Boolean);
    
    const isAdminByRole = req.user?.role === 'ADMIN';
    const isAdminByEmail = adminEmails.includes(req.user?.email);
    
    if (!req.user || (!isAdminByRole && !isAdminByEmail)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking admin status' });
  }
};