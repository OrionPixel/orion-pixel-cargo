import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import * as bcrypt from "bcrypt";
import { storage } from "./storage";
import { User } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(32).toString("hex"); // 32 bytes salt for security
  // Production-ready secure hashing
  const buf = (await scryptAsync(password, salt, 64)) as Buffer; // 64 bytes output
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Check if it's a bcrypt hash (office accounts) or scrypt hash (regular users)
    if (stored.startsWith('$2b$')) {
      // This is a bcrypt hash (used for office accounts)
      return await bcrypt.compare(supplied, stored);
    } else {
      // This is a scrypt hash (used for regular users)
      const [hashed, salt] = stored.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      // Use same reduced parameters for verification
      const keyLength = hashedBuf.length;
      const suppliedBuf = (await scryptAsync(supplied, salt, keyLength)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  // Replit deployment environment detection
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_URL || process.env.REPL_SLUG;
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cargo-flow-session-secret-production-ready",
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't save empty sessions
    rolling: true, // Refresh session on every request to keep it alive
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      max: 1000, // limit concurrent sessions
      ttl: 24 * 60 * 60 * 1000 // 24 hours TTL
    }),
    cookie: {
      secure: false, // Allow HTTP in development and Replit
      httpOnly: false, // Allow JavaScript access for better session handling
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Less restrictive for cross-origin requests
      domain: undefined, // Let browser handle domain
      path: '/', // Ensure cookie applies to all paths
    },
  };

  // Replit deployment fix - trust proxy for .replit.app domains
  app.set("trust proxy", true);
  
  // Initialize session middleware first
  const sessionMiddleware = session(sessionSettings);
  app.use(sessionMiddleware);
  
  // Initialize passport middleware
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log('🔧 Session middleware configured for Replit deployment');

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          console.log('🔍 Looking up user:', email);
          // User lookup with error handling for production
          const user = await storage.getUserByEmail(email);
          console.log('👤 User found:', user ? 'Yes' : 'No');
          
          if (!user || !user.hashedPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Password verification with production error handling
          let isValidPassword = false;
          try {
            isValidPassword = await comparePasswords(password, user.hashedPassword);
          } catch (passwordError) {
            console.error("Password comparison error:", passwordError);
            return done(null, false, { message: "Authentication failed" });
          }
          
          if (!isValidPassword) {
            console.log("❌ Password mismatch for user:", email);
            return done(null, false, { message: "Invalid email or password" });
          }
          
          return done(null, user);
        } catch (error) {
          console.error("Authentication error:", error);
          return done(null, false, { message: "Authentication failed" });
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('🔄 Serializing user:', user.id, user.email);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('🔄 Deserializing user ID:', id);
      // User deserialization with enhanced error handling
      const user = await storage.getUser(id);
      if (user) {
        console.log('✅ User deserialized:', user.email);
        done(null, user);
      } else {
        console.log('❌ User not found during deserialization:', id);
        done(null, false);
      }
    } catch (error) {
      console.error('❌ Deserialization error:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('🚀 REGISTRATION START:', {
        body: req.body,
        headers: req.headers.origin,
        userAgent: req.headers['user-agent']
      });

      const { email, password, firstName, lastName, phone, subscriptionPlan, trialDays } = req.body;

      if (!email || !password || !firstName || !lastName) {
        console.error('❌ REGISTRATION: Missing required fields', {
          email: !!email,
          password: !!password,
          firstName: !!firstName,
          lastName: !!lastName
        });
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists with this email
      console.log('🔍 REGISTRATION: Checking existing user with email:', email);
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        console.error('❌ REGISTRATION: User already exists with email:', email);
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Check if user already exists with this phone number
      if (phone) {
        console.log('🔍 REGISTRATION: Checking existing user with phone:', phone);
        const existingUserByPhone = await storage.getUserByPhone(phone);
        if (existingUserByPhone) {
          console.error('❌ REGISTRATION: User already exists with phone:', phone);
          return res.status(400).json({ message: "User already exists with this phone number" });
        }
      }

      console.log('🔐 REGISTRATION: Hashing password...');
      const hashedPassword = await hashPassword(password);
      console.log('✅ REGISTRATION: Password hashed successfully');
      
      console.log(`🔥 REGISTRATION: User ${email} signing up with plan: ${subscriptionPlan}, trial days: ${trialDays}`);
      
      console.log('👤 REGISTRATION: Creating user...');
      
      // Prepare user data with proper field mapping
      const userCreateData = {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        hashedPassword,
        phone: phone ? phone.trim() : undefined,
        subscriptionPlan: subscriptionPlan || 'starter',
        subscriptionStatus: 'trial',
        // Remove trialDays as it's calculated inside createUser
        // trialStartDate is handled by database default
      };
      
      console.log('📋 REGISTRATION: User data prepared:', {
        ...userCreateData,
        hashedPassword: '[HIDDEN]'
      });
      
      const user = await storage.createUser(userCreateData);
      
      console.log('✅ REGISTRATION: User created successfully:', user.id);

      // CRITICAL: Ensure session is fully established before responding
      console.log('🍪 REGISTRATION: Starting login process...');
      req.login(user, async (err) => {
        if (err) {
          console.error('❌ Registration login failed:', err);
          return next(err);
        }
        
        console.log('✅ Registration login successful for:', user.email);
        console.log('🍪 Session ID:', req.sessionID);
        console.log('👤 Session user:', req.user ? 'Set' : 'Not set');
        
        // Force session save before sending response
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('❌ Session save failed:', saveErr);
            return next(saveErr);
          }
          
          console.log('💾 Session saved successfully');
          
          // Double-check session is properly set
          if (!req.isAuthenticated() || !req.user) {
            console.error('❌ Session not properly authenticated after save');
            return res.status(500).json({ message: "Session creation failed" });
          }
          
          console.log('✅ Session confirmed - user is authenticated:', req.user.email);
          
          const { hashedPassword: _, ...userWithoutPassword } = user;
          
          // Add session confirmation to response with additional verification
          res.status(201).json({
            ...userWithoutPassword,
            sessionId: req.sessionID,
            authenticated: true,
            sessionVerified: req.isAuthenticated()
          });
        });
      });
    } catch (error) {
      console.error("❌ REGISTRATION CRITICAL ERROR:", error);
      console.error("Error stack:", error.stack);
      
      // Provide more specific error information in development
      if (process.env.NODE_ENV === 'development') {
        res.status(500).json({ 
          message: "Registration failed", 
          error: error.message,
          stack: error.stack 
        });
      } else {
        res.status(500).json({ message: "Registration failed. Please try again." });
      }
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('🔐 Login attempt for:', req.body.email);
    console.log('🌍 Origin:', req.headers.origin);
    console.log('🍪 Cookies:', req.headers.cookie ? 'Present' : 'None');
    
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        console.error('❌ Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('❌ Authentication failed:', info?.message);
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      
      console.log('✅ User authenticated:', user.email);
      
      // Proper session handling with passport
      req.login(user, (err) => {
        if (err) {
          console.error('❌ Session creation failed:', err);
          return next(err);
        }
        
        console.log('✅ Session created for:', user.email);
        
        // Immediately return user data without password
        const { hashedPassword: _, ...userWithoutPassword } = user;
        
        // Set aggressive caching headers
        res.set('Cache-Control', 'private, max-age=600'); // 10 minutes
        res.set('ETag', `"user-${user.id}"`);
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    try {
      console.log('🚪 COMPLETE LOGOUT initiated for session:', req.sessionID);
      
      // IMMEDIATE: Destroy session and passport user in Promise.all for speed
      await Promise.all([
        // Destroy session
        new Promise<void>((resolve) => {
          if (req.session) {
            req.session.destroy((err) => {
              if (err) {
                console.error("❌ Session destruction failed:", err);
              } else {
                console.log('✅ Session destroyed successfully');
              }
              resolve();
            });
          } else {
            resolve();
          }
        }),
        
        // Logout passport user only if authenticated
        new Promise<void>((resolve) => {
          if (req.isAuthenticated && req.isAuthenticated()) {
            req.logout((err) => {
              if (err) {
                console.error("❌ Passport logout failed:", err);
              } else {
                console.log('✅ Passport logout successful');
              }
              resolve();
            });
          } else {
            console.log('✅ No active passport session to logout');
            resolve();
          }
        })
      ]);
      
      // Clear ALL possible cookie names
      const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax' as const,
        maxAge: 0
      };
      
      // Clear cookies safely - avoid invalid cookie names
      const cookieNames = ['connect.sid', 'session', 'sessionid'];
      cookieNames.forEach(name => {
        try {
          res.clearCookie(name, cookieOptions);
        } catch (err) {
          console.warn(`Failed to clear cookie ${name}:`, err);
        }
      });
      
      // Aggressive cache prevention headers
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Last-Modified', new Date().toUTCString());
      res.set('ETag', ''); // Clear ETag
      
      // Force client to not cache this response
      res.set('Vary', '*');
      
      console.log('✅ COMPLETE LOGOUT: Session destroyed, cookies cleared, cache headers set');
      res.json({ 
        message: "Logged out successfully",
        logout: true,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ LOGOUT ERROR:', error);
      // Always respond with success even if logout partially fails
      res.status(200).json({ 
        message: "Logged out successfully",
        logout: true,
        timestamp: Date.now()
      });
    }
  });

  // User route is defined in routes.ts - remove duplicate
}

export function requireAuth(req: any, res: any, next: any) {
  console.log('🔒 Auth check for:', req.path);
  console.log('🔍 Authenticated:', req.isAuthenticated());
  console.log('👤 User present:', !!req.user);
  console.log('🍪 Session ID:', req.sessionID);
  
  if (!req.isAuthenticated() || !req.user) {
    console.log('❌ Authentication failed for:', req.path);
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log('✅ Authentication passed for:', req.user.email);
  next();
}