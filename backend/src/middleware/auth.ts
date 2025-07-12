import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import * as bcrypt from "bcrypt";
import { storage } from "../services/storage";
import { User } from "../../../shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(8).toString("hex"); // Reduced salt size
  // Much faster hashing for development
  const buf = (await scryptAsync(password, salt, 16)) as Buffer; // Reduced to 16 bytes
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
  
  // Passport configuration
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          console.log("🔐 Login attempt for:", email);
          
          const user = await storage.getUserByEmail(email);
          if (!user) {
            console.log("❌ User not found:", email);
            return done(null, false, { message: "Invalid credentials" });
          }

          console.log("👤 User found:", email, "Role:", user.role);

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            console.log("❌ Invalid password for:", email);
            return done(null, false, { message: "Invalid credentials" });
          }

          console.log("✅ Login successful for:", email);
          return done(null, user);
        } catch (error) {
          console.error("❌ Login error:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("🔄 Serializing user:", user.email);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log("🔄 Deserializing user ID:", id);
      const user = await storage.getUserById(id);
      if (!user) {
        console.log("❌ User not found during deserialization:", id);
        return done(null, false);
      }
      console.log("✅ User deserialized:", user.email);
      done(null, user);
    } catch (error) {
      console.error("❌ Deserialization error:", error);
      done(error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

export function requireAuth(req: any, res: any, next: any) {
  console.log("🔒 Auth check for:", req.path);
  console.log("🔍 Authenticated:", req.isAuthenticated());
  console.log("👤 User present:", !!req.user);
  console.log("🍪 Session ID:", req.sessionID);
  
  if (req.isAuthenticated() && req.user) {
    console.log("✅ Authentication passed for:", req.user.email);
    return next();
  }
  
  console.log("❌ Authentication failed for:", req.path);
  res.status(401).json({ 
    message: "Authentication required",
    path: req.path,
    authenticated: req.isAuthenticated(),
    hasUser: !!req.user
  });
}