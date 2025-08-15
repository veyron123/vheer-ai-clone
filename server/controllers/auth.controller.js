import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware.js';
import CreditService from '../services/creditService.js';

const prisma = new PrismaClient();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

export const register = async (req, res, next) => {
  try {
    const { email, username, password, fullName } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      throw new AppError('User with this email or username already exists', 400);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with subscription and initial credits
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        totalCredits: 10, // Initial daily credits
        lastCreditUpdate: new Date(), // Set current time for daily credits tracking
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE'
          }
        },
        credits: {
          create: {
            amount: 10, // Welcome bonus record
            type: 'WELCOME_BONUS',
            description: 'Welcome bonus'
          }
        }
      },
      include: {
        subscription: true
      }
    });
    
    const token = generateToken(user.id);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        subscription: user.subscription
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true
      }
    });
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const token = generateToken(user.id);
    
    // Проверить и начислить ежедневные кредиты при входе
    try {
      await CreditService.checkAndAddDailyCredits(user.id);
    } catch (error) {
      console.log('Daily credits check failed:', error.message);
    }
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        subscription: user.subscription
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: true,
        _count: {
          select: {
            images: true,
            generations: true
          }
        }
      }
    });
    
    // Проверить и начислить ежедневные кредиты при проверке профиля
    try {
      await CreditService.checkAndAddDailyCredits(req.user.id);
      // Получить обновленные данные пользователя после начисления кредитов
      const updatedUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          subscription: true,
          _count: {
            select: {
              images: true,
              generations: true
            }
          }
        }
      });
      
      res.json({
        ...updatedUser,
        password: undefined
      });
    } catch (error) {
      console.log('Daily credits check failed:', error.message);
      res.json({
        ...user,
        password: undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, avatar } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        bio,
        avatar
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true
      }
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// OAuth Success Handler
export const oauthSuccess = async (req, res, next) => {
  try {
    const user = req.user;
    const token = generateToken(user.id);
    
    // Проверить и начислить ежедневные кредиты при OAuth входе
    try {
      await CreditService.checkAndAddDailyCredits(user.id);
    } catch (error) {
      console.log('Daily credits check failed for OAuth user:', error.message);
    }
    
    // Redirect to frontend with token  
    const frontendURL = process.env.FRONTEND_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://colibrrri.com' 
        : 'http://localhost:5182');
    res.redirect(`${frontendURL}/en/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      subscription: user.subscription
    }))}`);
  } catch (error) {
    next(error);
  }
};

// OAuth Failure Handler
export const oauthFailure = (req, res) => {
  const frontendURL = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://colibrrri.com' 
      : 'http://localhost:5182');
  res.redirect(`${frontendURL}/en/auth/error?message=OAuth authentication failed`);
};