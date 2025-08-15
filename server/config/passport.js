import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { subscription: true }
    });
    
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google Profile:', profile);
    
    // Check if user already exists with this Google ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      },
      include: { subscription: true }
    });

    if (user) {
      // Update Google ID if user exists but doesn't have it
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
          include: { subscription: true }
        });
      }
      return done(null, user);
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
        fullName: profile.displayName,
        avatar: profile.photos[0]?.value,
        emailVerified: true, // Google emails are verified
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE'
          }
        },
        credits: {
          create: {
            amount: 10, // Welcome bonus
            type: 'BONUS',
            description: 'Welcome bonus for Google signup'
          }
        }
      },
      include: { subscription: true }
    });

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:5000/auth/facebook/callback",
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Facebook Profile:', profile);
    
    // Check if user already exists with this Facebook ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { facebookId: profile.id },
          { email: profile.emails?.[0]?.value }
        ]
      },
      include: { subscription: true }
    });

    if (user) {
      // Update Facebook ID if user exists but doesn't have it
      if (!user.facebookId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { facebookId: profile.id },
          include: { subscription: true }
        });
      }
      return done(null, user);
    }

    // Create new user
    const email = profile.emails?.[0]?.value || `${profile.id}@facebook.local`;
    user = await prisma.user.create({
      data: {
        facebookId: profile.id,
        email: email,
        username: email.split('@')[0] + '_' + Date.now(),
        fullName: `${profile.name.givenName} ${profile.name.familyName}`,
        avatar: profile.photos?.[0]?.value,
        emailVerified: !!profile.emails?.[0]?.value,
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE'
          }
        },
        credits: {
          create: {
            amount: 10, // Welcome bonus
            type: 'BONUS',
            description: 'Welcome bonus for Facebook signup'
          }
        }
      },
      include: { subscription: true }
    });

    return done(null, user);
  } catch (error) {
    console.error('Facebook OAuth Error:', error);
    return done(error, null);
  }
}));

// Serialize/Deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { subscription: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;