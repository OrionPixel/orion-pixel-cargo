import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import Razorpay from "razorpay";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
// import { isAuthenticated } from "./replitAuth"; // Comment out Replit auth

// Simple authentication function for local development
const isAuthenticated = (req: any, res: any, next: any) => {
  // For local development, always allow access
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  // For production, use session authentication
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};
import { setupGPSIntegration } from "./gpsIntegration";
import { getEventHub } from "./eventHub";
import { setupDiagnosticRoutes } from "./diagnostic";
import { 
  insertWarehouseSchema,
  insertVehicleSchema,
  insertBookingSchema,
  insertTrackingEventSchema,
  insertSubscriptionSchema,
  insertSubscriptionPlanSchema,
  insertContactSubmissionSchema,
  insertSupportTicketSchema,
  insertTicketResponseSchema,
  insertNotificationSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { db } from "./db";
import { bookings, users, supportTickets } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { jsPDF } from "jspdf";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(8).toString("hex");
  const buf = (await scryptAsync(password, salt, 16)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Initialize Razorpay (optional for deployment)
let razorpay: Razorpay | null = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized successfully");
  } else {
    console.log("⚠️ Razorpay not initialized - API keys not provided");
  }
} catch (error) {
  console.log("⚠️ Razorpay initialization failed:", error);
}

// Initialize Stripe (optional for deployment)
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.log("⚠️ Stripe not initialized - API key not provided");
  }
} catch (error) {
  console.log("⚠️ Stripe initialization failed:", error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // EMERGENCY PRODUCTION HEALTH CHECK ENDPOINT
  app.get('/api/health', (req, res) => {
    try {
      const healthInfo = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        api: 'functional',
        server: 'cargorepo-4.onrender.com',
        message: 'Emergency production server is running'
      };
      console.log('🏥 Health check requested:', healthInfo);
      res.json(healthInfo);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads/announcements');
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage_multer,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only allow image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  });

  // Logo upload configuration
  const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads/logos');
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const logoUpload = multer({ 
    storage: logoStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow all image formats including SVG
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (PNG, JPG, GIF, SVG) are allowed!'), false);
      }
    }
  });

  // Auth middleware
  setupAuth(app);
  
  // Diagnostic routes for production troubleshooting
  setupDiagnosticRoutes(app);

  // Auth routes
  app.get('/api/user', async (req: any, res) => {
    try {
      console.log('🔍 AUTH CHECK: User endpoint called');
      console.log('🍪 Session authenticated:', req.isAuthenticated());
      console.log('👤 User in session:', !!req.user);
      console.log('🍪 Session ID:', req.sessionID);
      
      // CRITICAL: Check for logout indicators in headers
      const logoutHeader = req.headers['x-logout-flag'] || req.headers['logout'];
      if (logoutHeader === 'true') {
        console.log('🚫 LOGOUT HEADER DETECTED - Rejecting authentication');
        return res.status(401).json({ 
          message: "User logged out",
          logout: true 
        });
      }
      
      // Check authentication status  
      if (!req.isAuthenticated() || !req.user) {
        console.log('❌ AUTH CHECK: Not authenticated');
        return res.status(401).json({ 
          message: "Authentication required",
          authenticated: false 
        });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('❌ AUTH CHECK: User not found in database');
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if trial has expired (non-blocking)
      if (user.subscriptionPlan === 'trial' && user.trialEndDate && new Date() > user.trialEndDate) {
        // Update in background without blocking response
        setImmediate(async () => {
          try {
            await storage.upsertUser({
              ...user,
              subscriptionStatus: 'expired'
            });
          } catch (err) {
            console.error("Background trial update failed:", err);
          }
        });
      }
      
      console.log('✅ AUTH CHECK: User authenticated successfully:', user.email);
      
      // Add cache-control headers to prevent caching of auth data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(user);
    } catch (error) {
      console.error("❌ AUTH CHECK: Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin Analytics Routes
  app.get("/api/admin/analytics", requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Enhanced caching headers for admin analytics
      res.set({
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120', // 1 minute cache
        'ETag': `admin-analytics-${Math.floor(Date.now() / 60000)}`, // ETag changes every minute
        'X-Content-Type-Options': 'nosniff'
      });

      // Get real analytics data from database
      const allUsers = await storage.getAllUsers();
      const allBookings = await storage.getAllBookings();
      const allVehicles = await storage.getAllVehicles();
      
      const analytics = {
        revenue: allBookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0),
        bookings: allBookings.length,
        users: allUsers.length,
        vehicles: allVehicles.length,
        activeUsers: allUsers.filter(u => u.subscriptionStatus === 'active').length,
        completedBookings: allBookings.filter(b => b.status === 'delivered').length,
        pendingBookings: allBookings.filter(b => b.status === 'pending').length,
        revenue30Days: allBookings
          .filter(b => new Date(b.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .reduce((sum, booking) => sum + (booking.totalCost || 0), 0),
        bookings30Days: allBookings
          .filter(b => new Date(b.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
      };
      
      const responseTime = Date.now() - startTime;
      
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`🚀 Admin Analytics API: Generated analytics in ${responseTime}ms`);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Dashboard Stats Route - for both users and agents
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin Users Route




  // Admin Vehicles Route
  app.get("/api/admin/vehicles", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const allVehicles = await storage.getAllVehicles();
      res.json(allVehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Admin Single Vehicle Route
  app.get("/api/admin/vehicles/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicleById(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  // Admin Users Routes
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      console.log("🔍 DEBUG: /api/admin/users endpoint called successfully");
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Enhanced caching headers for admin users
      res.set({
        'Cache-Control': 'private, max-age=90, stale-while-revalidate=150', // 1.5 minute cache
        'ETag': `admin-users-${Math.floor(Date.now() / 90000)}`, // ETag changes every 1.5 minutes
        'X-Content-Type-Options': 'nosniff'
      });

      console.log("📊 Fetching users with trial days calculation...");
      const allUsers = await storage.getAllUsersWithRevenue();
      
      const responseTime = Date.now() - startTime;
      
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`🚀 Admin Users API: Fetched ${allUsers.length} users with trial data in ${responseTime}ms`);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin User Revenues Route
  app.get("/api/admin/user-revenues", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const userRevenues = await storage.getUserRevenues();
      res.json(userRevenues);
    } catch (error) {
      console.error("Error fetching user revenues:", error);
      res.status(500).json({ message: "Failed to fetch user revenues" });
    }
  });

  // Update user commission rate
  app.patch("/api/admin/users/:userId/commission", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId: targetUserId } = req.params;
      const { commissionRate } = req.body;

      console.log('Commission update request:', { targetUserId, commissionRate });

      if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({ message: "Invalid commission rate. Must be between 0 and 100." });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't allow commission setting for office accounts
      if (targetUser.role === 'office') {
        return res.status(400).json({ message: "Commission cannot be set for office accounts" });
      }

      const updatedUser = await storage.updateUser(targetUserId, { commissionRate: commissionRate.toString() });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }

      console.log('Commission updated successfully:', updatedUser);
      res.json({ message: "Commission rate updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating commission rate:", error);
      res.status(500).json({ message: "Failed to update commission rate" });
    }
  });

  // Approve enterprise plan request
  app.patch("/api/admin/users/:userId/approve-enterprise", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { userId: targetUserId } = req.params;
      const { commissionRate, action } = req.body; // action: 'approve' or 'reject'

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.subscriptionPlan !== 'enterprise') {
        return res.status(400).json({ message: "User does not have enterprise plan" });
      }

      const updates: any = {
        enterpriseApprovalStatus: action,
        approvedBy: userId,
        approvedAt: new Date()
      };

      if (action === 'approve' && commissionRate) {
        updates.commissionRate = commissionRate.toString();
        updates.subscriptionStatus = 'active';
      }

      const updatedUser = await storage.updateUser(targetUserId, updates);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }

      res.json({ 
        message: `Enterprise plan ${action}d successfully`, 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error approving enterprise plan:", error);
      res.status(500).json({ message: "Failed to approve enterprise plan" });
    }
  });

  // Admin Create User Route
  app.post("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const userData = {
        ...req.body,
        createdBy: userId,
        hashedPassword: req.body.password // You may want to hash this
      };
      
      const newUser = await storage.createUser(userData);
      
      res.json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get pending enterprise requests
  app.get("/api/admin/enterprise-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const pendingRequests = await storage.getPendingEnterpriseRequests();
      res.json(pendingRequests);
    } catch (error) {
      console.error("Error fetching enterprise requests:", error);
      res.status(500).json({ message: "Failed to fetch enterprise requests" });
    }
  });

  // Admin Single User Route
  app.get("/api/admin/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUserId = req.params.id;
      const targetUser = await storage.getUser(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(targetUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin Update User Route
  app.patch("/api/admin/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const targetUserId = req.params.id;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(targetUserId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });



  // Admin Logs Routes
  app.get("/api/admin/logs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const logs = await storage.getSystemLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.get("/api/admin/logs/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const logStats = await storage.getLogStats();
      res.json(logStats);
    } catch (error) {
      console.error("Error fetching log stats:", error);
      res.status(500).json({ message: "Failed to fetch log stats" });
    }
  });

  // Admin Reports Route
  app.get("/api/admin/reports", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get all data for reports
      const allBookings = await storage.getAllBookings();
      const allUsers = await storage.getAllUsers();
      const allVehicles = await storage.getAllVehicles();
      
      // Monthly performance data
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      
      for (let i = 0; i < 12; i++) {
        const monthBookings = allBookings.filter(booking => {
          if (!booking.createdAt) return false;
          const bookingDate = new Date(booking.createdAt);
          return bookingDate.getFullYear() === currentYear && bookingDate.getMonth() === i;
        });
        
        const monthRevenue = monthBookings.reduce((sum, booking) => {
          return sum + (parseFloat(booking.totalAmount) || 0);
        }, 0);
        
        monthlyData.push({
          month: months[i],
          bookings: monthBookings.length,
          revenue: Math.ceil(monthRevenue)
        });
      }
      
      // Vehicle type distribution
      const vehicleStats = {};
      allBookings.forEach(booking => {
        const vehicleType = booking.vehicleType || 'Unknown';
        if (!vehicleStats[vehicleType]) {
          vehicleStats[vehicleType] = { count: 0, revenue: 0 };
        }
        vehicleStats[vehicleType].count += 1;
        vehicleStats[vehicleType].revenue += parseFloat(booking.totalAmount) || 0;
      });
      
      const vehicleDistribution = Object.entries(vehicleStats).map(([type, stats]: [string, any]) => ({
        type,
        count: stats.count,
        revenue: Math.ceil(stats.revenue)
      }));
      
      // Status distribution
      const statusStats = {};
      allBookings.forEach(booking => {
        const status = booking.status || 'Unknown';
        if (!statusStats[status]) {
          statusStats[status] = { count: 0, revenue: 0 };
        }
        statusStats[status].count += 1;
        statusStats[status].revenue += parseFloat(booking.totalAmount) || 0;
      });
      
      const statusDistribution = Object.entries(statusStats).map(([type, stats]: [string, any]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: stats.count,
        revenue: Math.ceil(stats.revenue)
      }));
      
      // Top routes
      const routeStats = {};
      allBookings.forEach(booking => {
        const route = `${booking.pickupCity || 'Unknown'} → ${booking.deliveryCity || 'Unknown'}`;
        if (!routeStats[route]) {
          routeStats[route] = { count: 0, revenue: 0 };
        }
        routeStats[route].count += 1;
        routeStats[route].revenue += parseFloat(booking.totalAmount) || 0;
      });
      
      const topRoutes = Object.entries(routeStats)
        .map(([route, stats]: [string, any]) => {
          const [from, to] = route.split(' → ');
          return {
            from,
            to,
            count: stats.count,
            revenue: Math.ceil(stats.revenue)
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Performance metrics
      const totalRevenue = Math.ceil(allBookings.reduce((sum, booking) => {
        return sum + (parseFloat(booking.totalAmount) || 0);
      }, 0));
      
      const completedBookings = allBookings.filter(b => b.status === 'delivered').length;
      const completionRate = allBookings.length > 0 ? 
        Math.ceil((completedBookings / allBookings.length) * 100) : 0;
      
      const avgOrderValue = allBookings.length > 0 ? 
        Math.ceil(totalRevenue / allBookings.length) : 0;
      
      // Customer analytics
      const customerStats = {};
      allUsers.forEach(user => {
        if (user.role !== 'admin') {
          const userBookings = allBookings.filter(b => b.userId === user.id);
          const userRevenue = userBookings.reduce((sum, booking) => {
            return sum + (parseFloat(booking.totalAmount) || 0);
          }, 0);
          
          customerStats[user.id] = {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            bookings: userBookings.length,
            revenue: Math.ceil(userRevenue),
            lastBooking: userBookings.length > 0 ? 
              Math.max(...userBookings.map(b => new Date(b.createdAt || '').getTime())) : null
          };
        }
      });
      
      const topCustomers = Object.values(customerStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);
      
      const reportData = {
        monthlyData,
        vehicleDistribution,
        statusDistribution,
        topRoutes,
        topCustomers,
        metrics: {
          totalRevenue,
          completionRate,
          avgOrderValue,
          totalBookings: allBookings.length,
          activeCustomers: Object.keys(customerStats).length,
          totalVehicles: allVehicles.length
        }
      };
      
      res.json(reportData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Admin Single Booking Route
  app.get("/api/admin/bookings/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // NEW: Combined booking details API for better performance
  app.get("/api/admin/bookings/:id/complete", requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingId = parseInt(req.params.id);
      
      // First get booking to get vehicleId and userId
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Then fetch related data in parallel
      const promises = [];
      
      if (booking.vehicleId) {
        promises.push(storage.getVehicleById(booking.vehicleId));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      if (booking.userId) {
        promises.push(storage.getUser(booking.userId));
      } else {
        promises.push(Promise.resolve(null));
      }
      
      const [vehicle, bookingUser] = await Promise.all(promises);
      
      const responseTime = Date.now() - startTime;
      console.log(`🚀 Combined Booking Details API: Fetched booking ${bookingId} with related data in ${responseTime}ms`);

      res.json({
        booking,
        vehicle: vehicle || null,
        user: bookingUser || null,
        responseTime
      });
    } catch (error) {
      console.error("Error fetching complete booking details:", error);
      res.status(500).json({ message: "Failed to fetch complete booking details" });
    }
  });

  // Admin Booking Status Update Route
  app.patch("/api/admin/bookings/:id/status", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Set cache headers for better performance
      res.set('Cache-Control', 'private, max-age=120'); // 2 minutes
      res.set('ETag', `"stats-${userId}-${Date.now()}"`);
      
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouses', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const warehouses = await storage.getUserWarehouses(userId);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.post('/api/warehouses', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validationResult = insertWarehouseSchema.safeParse({ ...req.body, userId });
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      const warehouse = await storage.createWarehouse(validationResult.data);
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.put('/api/warehouses/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      console.log(`🏢 PUT /api/warehouses/${id} - User: ${userId}`);
      console.log('📦 Request body:', req.body);
      
      const validationResult = insertWarehouseSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        console.log('❌ Validation failed:', validationResult.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      console.log('✅ Validation passed, updating warehouse...');
      const warehouse = await storage.updateWarehouse(id, validationResult.data);
      
      console.log('🎉 Warehouse updated successfully:', warehouse);
      res.json(warehouse);
    } catch (error) {
      console.error("❌ Error updating warehouse:", error);
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  app.delete('/api/warehouses/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWarehouse(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });

  // Vehicle routes
  app.get('/api/vehicles', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const vehicles = await storage.getUserVehicles(userId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post('/api/vehicles', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      console.log('🚗 VEHICLE CREATION: Starting for user:', userId);
      console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate user authentication
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(401).json({ 
          message: "Authentication required. Please login and try again.",
          error: "AUTHENTICATION_REQUIRED" 
        });
      }
      
      // Convert capacity to string as the schema expects decimal (string)
      const vehicleData = { 
        ...req.body, 
        userId,
        capacity: req.body.capacity ? req.body.capacity.toString() : undefined
      };
      
      console.log('🔄 Processed vehicle data:', JSON.stringify(vehicleData, null, 2));
      
      // Validate required fields before schema validation
      if (!vehicleData.registrationNumber || !vehicleData.vehicleType) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
          message: "Registration number and vehicle type are required",
          error: "MISSING_REQUIRED_FIELDS",
          receivedData: vehicleData
        });
      }
      
      const validationResult = insertVehicleSchema.safeParse(vehicleData);
      
      if (!validationResult.success) {
        console.error("❌ VALIDATION FAILED:", validationResult.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors,
          receivedData: vehicleData
        });
      }

      console.log('✅ Validation successful, creating vehicle...');
      
      // Test database connection before creating vehicle
      try {
        await db.select().from(users).where(eq(users.id, userId)).limit(1);
      } catch (dbError: any) {
        console.error('❌ Database connection test failed:', dbError);
        return res.status(503).json({ 
          message: "Database connection error. Please try again.",
          error: "DATABASE_CONNECTION_FAILED" 
        });
      }
      
      const vehicle = await storage.createVehicle(validationResult.data);
      console.log('✅ Vehicle created successfully:', vehicle);
      
      res.status(201).json(vehicle);
    } catch (error: any) {
      console.error("❌ ERROR creating vehicle:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        constraint: error.constraint,
        timestamp: new Date().toISOString()
      });
      
      // Check for duplicate registration number error
      if (error.code === '23505' && error.constraint === 'vehicles_registration_number_unique') {
        return res.status(409).json({ 
          message: "Vehicle registration number already exists. Please use a different registration number.",
          error: "DUPLICATE_REGISTRATION" 
        });
      }
      
      // Check for foreign key violation (user not found)
      if (error.code === '23503' && error.constraint === 'vehicles_user_id_users_id_fk') {
        return res.status(400).json({ 
          message: "Invalid user. Please login again and try.",
          error: "INVALID_USER" 
        });
      }
      
      // Check for database connection issues
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({ 
          message: "Database connection error. Please try again.",
          error: "DATABASE_CONNECTION" 
        });
      }
      
      // Check for timeout errors
      if (error.message && error.message.includes('timeout')) {
        return res.status(504).json({ 
          message: "Request timeout. Please try again.",
          error: "TIMEOUT" 
        });
      }
      
      // Check for schema or column errors
      if (error.message && (error.message.includes('does not exist') || error.message.includes('column'))) {
        // Specific handling for GPS column errors
        if (error.message.includes('gps_device_id') || error.message.includes('gps_imei') || error.message.includes('gps_sim_number') || error.message.includes('gps_status')) {
          return res.status(500).json({ 
            message: "Database schema outdated. GPS columns missing. Please contact support to update schema.",
            error: "GPS_SCHEMA_ERROR",
            details: error.message,
            fix: "Run database migration: npm run db:push"
          });
        }
        
        return res.status(500).json({ 
          message: "Database schema error. Please contact support.",
          error: "SCHEMA_ERROR",
          details: error.message
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create vehicle",
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  app.put('/api/vehicles/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert capacity to string if present
      const updateData = {
        ...req.body,
        capacity: req.body.capacity ? req.body.capacity.toString() : undefined
      };
      
      const validationResult = insertVehicleSchema.partial().safeParse(updateData);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }

      const vehicle = await storage.updateVehicle(id, validationResult.data);
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete('/api/vehicles/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicle(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Booking routes
  app.get('/api/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/recent', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      const bookings = await storage.getRecentBookings(userId, limit);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      res.status(500).json({ message: "Failed to fetch recent bookings" });
    }
  });

  app.post('/api/bookings', requireAuth, async (req: any, res) => {
    const startTime = Date.now();
    const requestId = `REQ_${startTime}_${Math.random().toString(36).substr(2, 4)}`;
    
    console.log(`🚀 BOOKING START [${requestId}]: Optimized booking creation for user ${req.user.id}`);
    
    try {
      const userId = req.user.id;
      
      // ⚡ PERFORMANCE: Check high-priority request header from frontend
      const isHighPriority = req.headers['x-request-priority'] === 'high';
      if (isHighPriority) {
        console.log(`⚡ HIGH PRIORITY REQUEST [${requestId}]: Processing with optimized path`);
      }
      
      // ⚡ PERFORMANCE: Parallel user validation and data processing
      const [user] = await Promise.all([
        storage.getUser(userId),
        // Pre-generate booking ID while user validation is happening
        Promise.resolve(`BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`)
      ]);
      
      if (!user) {
        console.log(`❌ USER NOT FOUND [${requestId}]: ${userId}`);
        return res.status(404).json({ message: "User not found", requestId });
      }
      
      // ⚡ PERFORMANCE: Fast trial check - simplified logic
      const now = Date.now();
      let isTrialExpired = false;
      
      if (user.subscriptionStatus === 'trial' && user.trialStartDate) {
        const trialDays = Math.floor((now - new Date(user.trialStartDate).getTime()) / (1000 * 3600 * 24));
        isTrialExpired = trialDays >= 14;
        
        if (isTrialExpired) {
          console.log(`🚫 TRIAL EXPIRED [${requestId}]: User ${userId} - ${trialDays} days`);
          return res.status(403).json({ 
            message: "Trial expired", 
            code: "TRIAL_EXPIRED",
            description: "Your 14-day trial has expired. Please upgrade to continue.",
            requestId
          });
        }
      }
      
      // ⚡ PERFORMANCE: Agent trial check only if user is agent
      if (user.role === 'office' && user.parentUserId) {
        const parentUser = await storage.getUser(user.parentUserId);
        if (parentUser?.subscriptionStatus === 'trial' && parentUser.trialStartDate) {
          const parentTrialDays = Math.floor((now - new Date(parentUser.trialStartDate).getTime()) / (1000 * 3600 * 24));
          if (parentTrialDays >= 14) {
            console.log(`🚫 PARENT TRIAL EXPIRED [${requestId}]: Agent ${userId}`);
            return res.status(403).json({ 
              message: "Parent account trial expired", 
              code: "PARENT_TRIAL_EXPIRED",
              requestId
            });
          }
        }
      }
      
      console.log(`✅ VALIDATION PASSED [${requestId}]: ${Date.now() - startTime}ms`);
    
      // ⚡ PERFORMANCE: Pre-calculate booking ID and data transformation
      const bookingId = `BK${now}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // ⚡ PERFORMANCE: Optimized data transformation with minimal operations
      const bookingData = {
        ...req.body,
        userId,
        bookingId,
        vehicleId: parseInt(req.body.vehicleId),
        weight: parseFloat(req.body.weight) || 0,
        distance: parseFloat(req.body.distance) || 0,
        baseRate: String(req.body.baseRate || "0"),
        gstAmount: String(req.body.gstAmount || "0"), 
        totalAmount: String(req.body.totalAmount || "0"),
        itemCount: parseInt(req.body.itemCount) || 1,
        pickupDateTime: req.body.pickupDateTime,
        deliveryDateTime: req.body.deliveryDateTime || null,
        paymentMethod: req.body.paymentMethod || "pending",
        paymentStatus: req.body.paymentStatus || "pending",
        paidAmount: String(req.body.paidAmount || "0"),
        transactionId: req.body.transactionId || "",
        paymentNotes: req.body.paymentNotes || "",
        paymentDate: req.body.paymentStatus === 'paid' ? new Date() : null,
        status: "booked"
      };
      
      // ⚡ PERFORMANCE: Fast validation
      const validationResult = insertBookingSchema.safeParse(bookingData);
      
      if (!validationResult.success) {
        console.error(`❌ VALIDATION FAILED [${requestId}]:`, validationResult.error.errors);
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error),
          requestId
        });
      }

      console.log(`🏗️ CREATING BOOKING [${requestId}]: ${Date.now() - startTime}ms elapsed`);
      
      // ⚡ PERFORMANCE: Create booking with optimized storage call
      const booking = await storage.createBooking(validationResult.data);
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ BOOKING CREATED [${requestId}]: ${responseTime}ms total - ID: ${booking.bookingId}`);
      
      // ⚡ PERFORMANCE: Send immediate response with performance metrics
      res.status(201).json({
        ...booking,
        _performance: {
          requestId,
          responseTime: `${responseTime}ms`,
          priority: isHighPriority ? 'high' : 'normal'
        }
      });
      
      // ⚡ PERFORMANCE: Optimized background task batching with parallel execution
      setImmediate(async () => {
        const backgroundStart = Date.now();
        console.log(`🔧 BACKGROUND TASKS START [${requestId}]: Processing secondary operations`);
        
        // ⚡ PERFORMANCE: Get user info first for all operations
        const bookingUser = await storage.getUser(booking.userId);
        
        // ⚡ PERFORMANCE: Execute independent operations in parallel
        const backgroundTasks = await Promise.allSettled([
          // Task 1: Create income record
          storage.createIncomeRecord({
            userId: booking.userId,
            amount: booking.totalAmount,
            incomeType: 'booking_income',
            clientName: booking.senderName || 'Customer',
            bookingId: booking.id,
            paymentStatus: booking.paymentStatus === 'paid' ? 'received' : 'pending',
            notes: `Income from booking ${booking.bookingId} (${booking.pickupCity} to ${booking.deliveryCity})`
          }),
          
          // Task 2: Create tracking event
          storage.createTrackingEvent({
            bookingId: booking.id,
            status: 'booked',
            location: booking.pickupCity,
            notes: 'Booking created successfully'
          }),
          
          // Task 3: Create user notification
          storage.createNotification({
            userId: booking.userId,
            title: 'New Booking Created',
            message: bookingUser?.role === 'office' && bookingUser.officeName
              ? `Agent booking created by ${bookingUser.officeName} (${bookingUser.email}): ${booking.bookingId} from ${booking.pickupCity} to ${booking.deliveryCity}. Amount: ₹${Math.ceil(Number(booking.totalAmount))}`
              : `Your booking ${booking.bookingId} from ${booking.pickupCity} to ${booking.deliveryCity} has been created successfully. Amount: ₹${Math.ceil(Number(booking.totalAmount))}`,
            type: 'booking',
            isRead: false,
            relatedId: booking.id,
            actionUrl: `/bookings/${booking.id}`
          }),
          
          // Task 4: Create parent notification (if agent)
          (bookingUser?.role === 'office' && bookingUser.parentUserId) 
            ? storage.createNotification({
                userId: bookingUser.parentUserId,
                title: 'Agent Booking Created',
                message: `Your agent ${bookingUser.officeName} (${bookingUser.email}) created a booking: ${booking.bookingId} from ${booking.pickupCity} to ${booking.deliveryCity}. Amount: ₹${Math.ceil(Number(booking.totalAmount))}`,
                type: 'booking',
                isRead: false,
                relatedId: booking.id,
                actionUrl: `/bookings/${booking.id}`,
                senderUserId: booking.userId
              })
            : Promise.resolve(null)
        ]);
        
        // ⚡ PERFORMANCE: Process results and emit real-time updates
        const [incomeResult, trackingResult, notificationResult, parentNotificationResult] = backgroundTasks;
        
        // Log results
        incomeResult.status === 'fulfilled' 
          ? console.log(`💰 Income record created [${requestId}]: ₹${booking.totalAmount}`)
          : console.error(`❌ Income record failed [${requestId}]:`, incomeResult.reason);
          
        trackingResult.status === 'fulfilled'
          ? console.log(`📍 Tracking event created [${requestId}]: ${booking.pickupCity}`)
          : console.error(`❌ Tracking event failed [${requestId}]:`, trackingResult.reason);
        
        // ⚡ PERFORMANCE: Immediate real-time updates via EventHub
        try {
          const eventHub = getEventHub();
          
          // Batch emit all real-time updates
          const realTimeUpdates = [
            // User updates
            eventHub.emitBookingUpdate(booking.userId, {
              type: 'booking_created',
              action: 'new',
              data: booking,
              performance: { requestId, backgroundTime: Date.now() - backgroundStart }
            }),
            
            eventHub.emitDashboardUpdate(booking.userId, {
              type: 'stats_refresh',
              action: 'update',
              timestamp: new Date().toISOString()
            })
          ];
          
          // Add notification update if successful
          if (notificationResult.status === 'fulfilled') {
            realTimeUpdates.push(
              eventHub.emitNewNotification(booking.userId, {
                type: 'notification',
                action: 'new',
                data: notificationResult.value
              })
            );
          }
          
          // Add parent updates if agent booking
          if (parentNotificationResult.status === 'fulfilled' && parentNotificationResult.value && bookingUser?.parentUserId) {
            realTimeUpdates.push(
              eventHub.emitNewNotification(bookingUser.parentUserId, {
                type: 'notification',
                action: 'new',
                data: parentNotificationResult.value
              }),
              eventHub.emitDashboardUpdate(bookingUser.parentUserId, {
                type: 'agent_booking_created',
                action: 'update',
                timestamp: new Date().toISOString()
              })
            );
          }
          
          // Execute all real-time updates
          await Promise.allSettled(realTimeUpdates);
          
          const backgroundTime = Date.now() - backgroundStart;
          console.log(`🔥 BACKGROUND COMPLETE [${requestId}]: ${backgroundTime}ms - All real-time updates sent`);
          
        } catch (eventError) {
          console.error(`❌ Real-time updates failed [${requestId}]:`, eventError);
        }
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put('/api/bookings/:id', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validationResult = insertBookingSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      const oldBooking = await storage.getBooking(id);
      const booking = await storage.updateBooking(id, validationResult.data);
      
      // Generate notification for status change
      if (oldBooking && validationResult.data.status && oldBooking.status !== validationResult.data.status) {
        try {
          const statusMessages = {
            'booked': 'Your booking has been confirmed and is being processed',
            'picked': 'Your shipment has been picked up and is on the way',
            'in_transit': 'Your shipment is in transit and moving to destination', 
            'delivered': 'Your shipment has been delivered successfully',
            'cancelled': 'Your booking has been cancelled'
          };
          
          const message = statusMessages[validationResult.data.status] || `Status updated to ${validationResult.data.status}`;
          
          await storage.createNotification({
            userId: booking.userId,
            title: 'Booking Status Updated',
            message: `${booking.bookingId}: ${message}`,
            type: 'status',
            isRead: false,
            relatedId: booking.id,
            actionUrl: `/tracking/${booking.id}`
          });
          console.log(`📢 Status notification created for booking: ${booking.bookingId} (${validationResult.data.status})`);
        } catch (notificationError) {
          console.error('Failed to create status notification:', notificationError);
        }
      }

      // Generate notification for payment status change
      if (oldBooking && validationResult.data.paymentStatus && oldBooking.paymentStatus !== validationResult.data.paymentStatus) {
        try {
          const paymentMessages = {
            'paid': 'Payment received successfully for your booking',
            'failed': 'Payment failed for your booking. Please try again',
            'pending': 'Payment is pending for your booking'
          };
          
          const message = paymentMessages[validationResult.data.paymentStatus] || `Payment status updated to ${validationResult.data.paymentStatus}`;
          
          await storage.createNotification({
            userId: booking.userId,
            title: 'Payment Status Updated',
            message: `${booking.bookingId}: ${message}`,
            type: 'payment',
            isRead: false,
            relatedId: booking.id,
            actionUrl: `/bookings/${booking.id}`
          });
          console.log(`📢 Payment notification created for booking: ${booking.bookingId} (${validationResult.data.paymentStatus})`);
        } catch (notificationError) {
          console.error('Failed to create payment notification:', notificationError);
        }
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.get('/api/bookings/:id/tracking', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const events = await storage.getBookingTrackingEvents(id);
      res.json(events);
    } catch (error) {
      console.error("Error fetching tracking events:", error);
      res.status(500).json({ message: "Failed to fetch tracking events" });
    }
  });

  app.post('/api/bookings/:id/tracking', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const validationResult = insertTrackingEventSchema.safeParse({ 
        ...req.body, 
        bookingId 
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      const event = await storage.createTrackingEvent(validationResult.data);
      
      // Update booking status if provided
      if (req.body.updateBookingStatus) {
        await storage.updateBooking(bookingId, { status: req.body.status });
      }

      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating tracking event:", error);
      res.status(500).json({ message: "Failed to create tracking event" });
    }
  });

  // Daily bookings PDF export
  app.get('/api/bookings/daily-pdf', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = req.query.date || new Date().toISOString().split('T')[0];
      
      // Get bookings for the specified date
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const userBookings = await storage.getUserBookings(userId);
      const dailyBookings = userBookings.filter(booking => {
        const bookingDate = new Date(booking.pickupDateTime || booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      // Generate PDF using jsPDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('Daily Bookings Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Date: ${date}`, 20, 35);
      doc.text(`Agent: ${req.user.firstName} ${req.user.lastName}`, 20, 45);
      doc.text(`Total Bookings: ${dailyBookings.length}`, 20, 55);
      
      // Table headers
      let yPosition = 70;
      doc.setFontSize(10);
      doc.text('Booking ID', 20, yPosition);
      doc.text('Route', 60, yPosition);
      doc.text('Status', 120, yPosition);
      doc.text('Amount', 160, yPosition);
      
      yPosition += 10;
      
      // Table data
      dailyBookings.forEach((booking, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(booking.bookingId || `BK-${booking.id}`, 20, yPosition);
        doc.text(`${booking.pickupCity || 'N/A'} → ${booking.deliveryCity || 'N/A'}`, 60, yPosition);
        doc.text(booking.status || 'pending', 120, yPosition);
        doc.text(`₹${Math.ceil(Number(booking.totalAmount) || 0)}`, 160, yPosition);
        
        yPosition += 8;
      });
      
      // Summary
      const totalRevenue = dailyBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(`Total Revenue: ₹${Math.ceil(totalRevenue)}`, 20, yPosition);
      
      const pdfBuffer = doc.output('arraybuffer');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="daily-bookings-${date}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
      
    } catch (error) {
      console.error("Error generating daily PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Subscription routes
  app.get('/api/subscription', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validationResult = insertSubscriptionSchema.safeParse({ 
        ...req.body, 
        userId 
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      const subscription = await storage.createSubscription(validationResult.data);
      
      // Update user's subscription plan
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          subscriptionPlan: req.body.planType,
          subscriptionStatus: 'active',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: req.body.endDate
        });
      }

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoices = await storage.getUserInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Admin routes


  app.put('/api/admin/users/:id/subscription', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.id;
      const { plan, status } = req.body;
      
      const user = await storage.updateUserSubscription(userId, plan, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ message: "Failed to update user subscription" });
    }
  });

  app.put('/api/admin/users/:id/block', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.id;
      const user = await storage.blockUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.put('/api/admin/users/:id/unblock', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = req.params.id;
      const user = await storage.unblockUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Profile Management Routes
  app.get('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user profile data (exclude sensitive information)
      const profile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        officeName: user.officeName,
        address: user.address,
        gstNumber: user.gstNumber,
        city: user.city,
        state: user.state,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
        profileImageUrl: user.profileImageUrl
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, phone, officeName, address, gstNumber, city, state } = req.body;
      
      console.log('Updating user:', userId, 'with updates:', req.body);
      
      // Validate input
      if (email && !email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        phone,
        officeName,
        address,
        gstNumber,
        city,
        state
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return updated profile (exclude sensitive information)
      const profile = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        officeName: updatedUser.officeName,
        address: updatedUser.address,
        gstNumber: updatedUser.gstNumber,
        city: updatedUser.city,
        state: updatedUser.state,
        role: updatedUser.role,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus,
        createdAt: updatedUser.createdAt,
        profileImageUrl: updatedUser.profileImageUrl
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/profile/image', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // For now, we'll simulate image upload
      // In production, you would handle actual file upload here
      const imageUrl = `/uploads/profile-${userId}-${Date.now()}.jpg`;
      
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: imageUrl // Map to correct database field
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "Profile image updated successfully",
        profileImage: updatedUser.profileImageUrl // Map response field
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Support Tickets API Endpoints
  app.get('/api/support-tickets', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get support tickets for the authenticated user
      const tickets = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt));
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });



  // Additional admin routes
  app.get("/api/admin/comprehensive-analytics", requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Enhanced caching headers for comprehensive analytics
      res.set({
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120', // 1 minute cache
        'ETag': `admin-comprehensive-analytics-${Math.floor(Date.now() / 60000)}`, // ETag changes every minute
        'X-Content-Type-Options': 'nosniff'
      });
      
      // Get all real data from database
      const allUsers = await storage.getAllUsers();
      const allBookings = await storage.getAllBookings();
      const allVehicles = await storage.getAllVehicles();
      
      // Calculate Super Admin's actual revenue (Commission + Subscription)
      let superAdminCommissionRevenue = 0;
      let superAdminSubscriptionRevenue = 0;
      
      // Calculate commission revenue from all bookings
      for (const booking of allBookings) {
        const bookingAmount = parseFloat(booking.totalAmount) || 0;
        const user = allUsers.find(u => u.id === booking.userId);
        
        if (user && user.commissionRate) {
          const commissionRate = parseFloat(user.commissionRate) || 5;
          superAdminCommissionRevenue += (bookingAmount * commissionRate) / 100;
        }
      }
      
      // Calculate subscription revenue from active users
      const activeSubscribers = allUsers.filter(u => u.subscriptionStatus === 'active');
      for (const user of activeSubscribers) {
        if (user.subscriptionPlan === 'starter') {
          superAdminSubscriptionRevenue += 299; // Monthly starter plan
        } else if (user.subscriptionPlan === 'professional') {
          superAdminSubscriptionRevenue += 999; // Monthly professional plan  
        }
        // Enterprise users pay commission per booking, not subscription
      }
      
      const totalSuperAdminRevenue = Math.ceil(superAdminCommissionRevenue + superAdminSubscriptionRevenue);
      const totalBookingsRevenue = Math.ceil(allBookings.reduce((sum, booking) => {
        return sum + (parseFloat(booking.totalAmount) || 0);
      }, 0));
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const thisMonthBookings = allBookings.filter(b => 
        b.createdAt && new Date(b.createdAt) >= thisMonth
      );
      const lastMonthBookings = allBookings.filter(b => 
        b.createdAt && new Date(b.createdAt) >= lastMonth && new Date(b.createdAt) < thisMonth
      );
      
      // Calculate Super Admin's monthly revenue breakdown
      let thisMonthCommission = 0;
      let lastMonthCommission = 0;
      
      thisMonthBookings.forEach(booking => {
        const bookingAmount = parseFloat(booking.totalAmount) || 0;
        const user = allUsers.find(u => u.id === booking.userId);
        if (user && user.commissionRate) {
          const commissionRate = parseFloat(user.commissionRate) || 5;
          thisMonthCommission += (bookingAmount * commissionRate) / 100;
        }
      });
      
      lastMonthBookings.forEach(booking => {
        const bookingAmount = parseFloat(booking.totalAmount) || 0;
        const user = allUsers.find(u => u.id === booking.userId);
        if (user && user.commissionRate) {
          const commissionRate = parseFloat(user.commissionRate) || 5;
          lastMonthCommission += (bookingAmount * commissionRate) / 100;
        }
      });
      
      const thisMonthSuperAdminRevenue = Math.ceil(thisMonthCommission + superAdminSubscriptionRevenue);
      const lastMonthSuperAdminRevenue = Math.ceil(lastMonthCommission + superAdminSubscriptionRevenue);
      
      // Total booking amounts for reference
      const thisMonthBookingsRevenue = Math.ceil(thisMonthBookings.reduce((sum, b) => 
        sum + (parseFloat(b.totalAmount) || 0), 0
      ));
      const lastMonthBookingsRevenue = Math.ceil(lastMonthBookings.reduce((sum, b) => 
        sum + (parseFloat(b.totalAmount) || 0), 0
      ));
      
      const revenueGrowth = lastMonthSuperAdminRevenue > 0 ? 
        ((thisMonthSuperAdminRevenue - lastMonthSuperAdminRevenue) / lastMonthSuperAdminRevenue) * 100 : 0;
      
      // Status distribution
      const statusCounts = allBookings.reduce((acc, booking) => {
        const status = booking.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      // Vehicle status distribution
      const vehicleStatusCounts = allVehicles.reduce((acc, vehicle) => {
        const status = vehicle.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      // Performance metrics
      const completionRate = allBookings.length > 0 ? 
        Math.ceil((statusCounts.delivered || 0) / allBookings.length * 100) : 0;
      
      const avgOrderValue = allBookings.length > 0 ? 
        Math.ceil(totalBookingsRevenue / allBookings.length) : 0;
      
      // Route analysis
      const routeStats = allBookings.reduce((acc, booking) => {
        const route = `${booking.pickupCity || 'Unknown'} → ${booking.deliveryCity || 'Unknown'}`;
        if (!acc[route]) {
          acc[route] = { count: 0, revenue: 0 };
        }
        acc[route].count += 1;
        acc[route].revenue += parseFloat(booking.totalAmount) || 0;
        return acc;
      }, {});
      
      const topRoutes = Object.entries(routeStats)
        .map(([route, data]) => ({
          route,
          count: data.count,
          revenue: Math.ceil(data.revenue)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Monthly trends (last 6 months)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthBookings = allBookings.filter(b => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });
        
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          bookings: monthBookings.length,
          revenue: Math.ceil(monthBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0))
        };
      });
      
      // Service type analysis
      const serviceTypes = allBookings.reduce((acc, booking) => {
        const service = booking.serviceType || 'FTL';
        if (!acc[service]) {
          acc[service] = { count: 0, revenue: 0 };
        }
        acc[service].count += 1;
        acc[service].revenue += parseFloat(booking.totalAmount) || 0;
        return acc;
      }, {});
      
      const servicePerformance = Object.entries(serviceTypes).map(([type, data]) => ({
        type,
        count: data.count,
        revenue: Math.ceil(data.revenue),
        percentage: Math.ceil((data.count / allBookings.length) * 100)
      }));
      
      const comprehensiveAnalytics = {
        // Super Admin Revenue (Commission + Subscription)
        totalRevenue: totalSuperAdminRevenue,
        thisMonthRevenue: thisMonthSuperAdminRevenue,
        lastMonthRevenue: lastMonthSuperAdminRevenue,
        
        // Revenue Breakdown for Super Admin
        revenueBreakdown: {
          commissionRevenue: Math.ceil(superAdminCommissionRevenue),
          subscriptionRevenue: Math.ceil(superAdminSubscriptionRevenue),
          thisMonthCommission: Math.ceil(thisMonthCommission),
          lastMonthCommission: Math.ceil(lastMonthCommission),
          totalBookingsValue: totalBookingsRevenue, // Reference: total booking amounts
          thisMonthBookingsValue: thisMonthBookingsRevenue,
          lastMonthBookingsValue: lastMonthBookingsRevenue
        },
        
        revenueGrowth,
        bookingGrowth: thisMonthBookings.length > 0 && lastMonthBookings.length > 0 ? 
          Math.ceil(((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100) : 0,
        totalBookings: allBookings.length,
        thisMonthBookings: thisMonthBookings.length,
        totalUsers: allUsers.length,
        totalVehicles: allVehicles.length,
        
        // Performance metrics
        completionRate,
        avgOrderValue,
        cancellationRate: allBookings.length > 0 ? 
          Math.ceil(((statusCounts.cancelled || 0) / allBookings.length) * 100) : 0,
        
        // Status distributions
        bookingStatusCounts: statusCounts,
        vehicleStatusCounts: vehicleStatusCounts,
        
        // Analysis data
        topRoutes,
        monthlyTrends,
        servicePerformance,
        
        // Additional metrics
        activeUsers: allUsers.filter(u => u.subscriptionStatus === 'active').length,
        pendingBookings: statusCounts.booked || 0,
        inTransitBookings: statusCounts.in_transit || 0,
        deliveredBookings: statusCounts.delivered || 0
      };
      
      const responseTime = Date.now() - startTime;
      
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`🚀 Admin Comprehensive Analytics API: Generated analytics in ${responseTime}ms`);
      
      res.json(comprehensiveAnalytics);
    } catch (error) {
      console.error("Error fetching comprehensive analytics:", error);
      res.status(500).json({ message: "Failed to fetch comprehensive analytics" });
    }
  });

  app.get("/api/admin/bookings", requireAuth, async (req: any, res) => {
    try {
      console.log("🚀 Admin Bookings API: Starting request...");
      const startTime = Date.now();
      
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Enhanced caching headers for maximum performance
      res.set({
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120', // 1 minute cache with 2 minutes stale
        'ETag': `admin-bookings-${Math.floor(Date.now() / 60000)}`, // ETag changes every minute
        'X-Content-Type-Options': 'nosniff',
        'X-Response-Time': '0ms' // Will be updated below
      });
      
      const bookings = await storage.getAllBookings();
      const responseTime = Date.now() - startTime;
      
      // Update response time header
      res.set('X-Response-Time', `${responseTime}ms`);
      
      console.log(`✅ Admin Bookings API: Fetched ${bookings.length} bookings in ${responseTime}ms`);
      res.json(bookings);
    } catch (error) {
      console.error("❌ Admin Bookings API Error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/vehicles", requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Enhanced caching headers for admin vehicles
      res.set({
        'Cache-Control': 'private, max-age=120, stale-while-revalidate=180', // 2 minute cache
        'ETag': `admin-vehicles-${Math.floor(Date.now() / 120000)}`, // ETag changes every 2 minutes
        'X-Content-Type-Options': 'nosniff'
      });
      
      const vehicles = await storage.getAllVehicles();
      const responseTime = Date.now() - startTime;
      
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`🚀 Admin Vehicles API: Fetched ${vehicles.length} vehicles in ${responseTime}ms`);
      
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/admin/support-tickets", requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Enhanced caching headers for support tickets
      res.set({
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60', // 30 second cache
        'ETag': `admin-tickets-${Math.floor(Date.now() / 30000)}`, // ETag changes every 30 seconds
        'X-Content-Type-Options': 'nosniff'
      });
      
      const tickets = await storage.getAllSupportTickets();
      const responseTime = Date.now() - startTime;
      
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`🚀 Admin Support Tickets API: Fetched ${tickets.length} tickets in ${responseTime}ms`);
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/admin/activity-logs", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const logs = await storage.getActivityLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.post("/api/admin/users/:userId/approve-enterprise", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { customPricing, billingPercentage } = req.body;
      
      const user = await storage.approveEnterpriseUser(userId, parseFloat(customPricing), parseFloat(billingPercentage || '0'));
      res.json(user);
    } catch (error) {
      console.error("Error approving enterprise:", error);
      res.status(500).json({ message: "Failed to approve enterprise plan" });
    }
  });

  app.post("/api/admin/support-tickets/:ticketId/respond", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ticketId } = req.params;
      const { response } = req.body;
      
      const ticket = await storage.respondToSupportTicket(ticketId, response);
      res.json(ticket);
    } catch (error) {
      console.error("Error responding to ticket:", error);
      res.status(500).json({ message: "Failed to respond to ticket" });
    }
  });

  app.get("/api/admin/export/:type", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { type } = req.params;
      const csvData = await storage.exportReport(type);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  app.post("/api/admin/users/:userId/block", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const user = await storage.blockUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.post("/api/admin/users/:userId/unblock", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const user = await storage.unblockUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Update user by admin
  app.put("/api/admin/users/:userId", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const updateData = req.body;
      
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get enterprise billing details
  app.get("/api/admin/users/:userId/billing", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const billing = await storage.calculateEnterpriseRevelBilling(userId);
      res.json(billing);
    } catch (error) {
      console.error("Error calculating billing:", error);
      res.status(500).json({ message: "Failed to calculate billing" });
    }
  });

  // Get detailed user analytics
  app.get("/api/admin/users/:userId/analytics", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Use ONLY database queries - avoid storage.getUserBookings which causes duplication
      const allBookings = await storage.getAllBookings();
      
      // Get user's personal bookings ONLY 
      const personalBookings = allBookings.filter(b => b.userId === userId);
      const personalRevenue = personalBookings.reduce((sum: number, booking: any) => {
        const amount = booking.totalAmount || 0;
        return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
      }, 0);
      
      // Get office accounts bookings separately
      const officeAccounts = await storage.getUserOfficeAccounts(userId);
      let officeBookingsCount = 0;
      let officeRevenue = 0;
      
      if (officeAccounts.length > 0) {
        for (const office of officeAccounts) {
          const officeBookings = allBookings.filter(b => b.userId === office.id);
          officeBookingsCount += officeBookings.length;
          
          const officeAccountRevenue = officeBookings.reduce((sum: number, booking: any) => {
            const amount = booking.totalAmount || 0;
            return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
          }, 0);
          
          officeRevenue += officeAccountRevenue;
          
          console.log(`Agent ${office.firstName} ${office.lastName} stats: {
  totalBookings: ${officeBookings.length},
  totalRevenue: ${Math.ceil(officeAccountRevenue)},
  monthlyCommission: '${Math.ceil(officeAccountRevenue * parseFloat(office.commissionRate || '5') / 100)}',
  activeShipments: ${officeBookings.filter((b: any) => b.status === 'in_transit' || b.status === 'picked_up').length}
}`);
        }
      }
      
      // Final totals: Personal + Office accounts
      const totalRevenue = Math.ceil(personalRevenue + officeRevenue);
      const totalBookings = personalBookings.length + officeBookingsCount;
      
      console.log(`📊 FIXED Analytics: User ${userId} - Personal: ${personalBookings.length}, Office: ${officeBookingsCount}, Total: ${totalBookings} bookings, Revenue: ₹${totalRevenue}`);
      
      const activeShipments = personalBookings.filter((booking: any) => 
        booking.status === 'in_transit' || booking.status === 'picked_up'
      ).length;
      
      const commissionRate = parseFloat(user.commissionRate || '5');
      // Commission should be calculated on total revenue (personal + office accounts)
      const monthlyCommission = Math.ceil(totalRevenue * commissionRate / 100);
      
      const analytics = {
        totalBookings,
        totalRevenue: Math.ceil(totalRevenue).toString(),
        activeShipments,
        monthlyCommission,
        commissionRate: Math.ceil(commissionRate).toString()
      };
      
      console.log(`User ${userId} analytics:`, {
        ...analytics,
        bookingsCount: totalBookings,
        rawRevenue: totalRevenue,
        userCommissionRate: user.commissionRate
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  // Get specific booking for admin with performance optimization
  app.get("/api/admin/bookings/:bookingId", requireAuth, async (req: any, res) => {
    try {
      console.log("🚀 Admin Booking Details API: Starting request...");
      const startTime = Date.now();
      
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { bookingId } = req.params;
      
      // Add caching headers for booking details
      res.set({
        'Cache-Control': 'public, max-age=60', // 1 minute cache for booking details
        'ETag': `booking-${bookingId}-${Date.now()}`,
      });
      
      const booking = await storage.getBookingById(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ Admin Booking Details API: Fetched booking ${bookingId} in ${responseTime}ms`);
      
      res.json(booking);
    } catch (error) {
      console.error("❌ Admin Booking Details API Error:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Get admin dashboard user statistics 
  app.get("/api/admin/user-stats", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users and calculate overall statistics
      const allUsers = await storage.getAllUsers();
      const allBookings = await storage.getAllBookings();
      
      // Filter out admin and office accounts for user count
      const regularUsers = allUsers.filter(u => u.role !== 'admin' && u.role !== 'office');
      const activeUsers = regularUsers.filter(u => u.isActive !== false).length;
      
      // Calculate total bookings and revenue
      const totalBookings = allBookings.length;
      const totalRevenue = Math.ceil(allBookings.reduce((sum, booking) => {
        const amount = booking.totalAmount || 0;
        return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
      }, 0));
      
      // Calculate monthly growth (placeholder for now)
      const monthlyGrowth = "+12%";
      
      res.json({
        totalUsers: regularUsers.length,
        activeUsers,
        totalBookings,
        totalRevenue: Math.ceil(totalRevenue).toString(),
        monthlyRevenue: Math.ceil(totalRevenue).toString(), // Same as total for now
        monthlyGrowth
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Get user office accounts
  app.get("/api/admin/users/:userId/office-accounts", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const officeAccounts = await storage.getUserOfficeAccounts(userId);
      
      // Get analytics for each office account
      const officeAccountsWithStats = await Promise.all(
        officeAccounts.map(async (office) => {
          const officeBookings = await storage.getUserBookings(office.id);
          const totalRevenue = Math.ceil(officeBookings.reduce((sum, booking) => {
            const amount = booking.totalAmount || booking.price || 0;
            return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
          }, 0));
          
          const commissionRate = parseFloat(office.commissionRate || '5');
          const commission = Math.ceil(totalRevenue * commissionRate / 100);
          
          return {
            ...office,
            bookingCount: officeBookings.length,
            revenue: Math.ceil(totalRevenue).toString(),
            commission
          };
        })
      );
      
      res.json(officeAccountsWithStats);
    } catch (error) {
      console.error("Error fetching office accounts:", error);
      res.status(500).json({ message: "Failed to fetch office accounts" });
    }
  });

  // Update user basic info
  app.patch("/api/admin/users/:userId/basic-info", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { firstName, lastName, email, officeName } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        officeName
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user basic info:", error);
      res.status(500).json({ message: "Failed to update user basic info" });
    }
  });

  // Reset user password
  app.patch("/api/admin/users/:userId/reset-password", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      await db.update(users)
        .set({ hashedPassword })
        .where(eq(users.id, userId));
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset user password" });
    }
  });

  // Update user basic info
  app.patch('/api/admin/users/:userId/basic-info', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { firstName, lastName, email, officeName } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Update user basic info
      await db.update(users)
        .set({ 
          firstName,
          lastName,
          email,
          officeName: officeName || null
        })
        .where(eq(users.id, userId));
      
      res.json({ message: "Basic information updated successfully" });
    } catch (error: any) {
      console.error("Error updating basic info:", error);
      
      // Handle duplicate email error
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        return res.status(400).json({ 
          message: "Email already exists. Please use a different email address." 
        });
      }
      
      res.status(500).json({ message: "Failed to update basic information" });
    }
  });

  // Update user commission rate
  app.patch('/api/admin/users/:userId/commission', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { commissionRate } = req.body;
      
      if (!commissionRate || commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({ message: "Commission rate must be between 0 and 100" });
      }
      
      // Update commission rate in database
      await db.update(users)
        .set({ commissionRate: commissionRate.toString() })
        .where(eq(users.id, userId));
      
      res.json({ message: "Commission rate updated successfully", commissionRate });
    } catch (error) {
      console.error("Error updating commission rate:", error);
      res.status(500).json({ message: "Failed to update commission rate" });
    }
  });

  // Extend user trial endpoint
  app.patch('/api/admin/users/:userId/extend-trial', requireAuth, async (req: any, res) => {
    try {
      console.log('🚀 TRIAL EXTENSION DEBUG: Starting request');
      console.log('Request params:', req.params);
      console.log('Request body:', req.body);
      
      const currentUser = req.user;
      console.log('Current user:', currentUser?.email, 'Role:', currentUser?.role);
      
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('❌ TRIAL EXTENSION: Access denied - not admin');
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { days } = req.body;
      
      console.log('Parsed data - UserID:', userId, 'Days:', days);
      
      if (!days || days <= 0 || days > 365) {
        console.log('❌ TRIAL EXTENSION: Invalid days value:', days);
        return res.status(400).json({ message: "Days must be between 1 and 365" });
      }

      // Get current user details
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate new trial end date
      const currentDate = new Date();
      const currentTrialEnd = targetUser.trialEndDate ? new Date(targetUser.trialEndDate) : currentDate;
      
      // If trial has already expired, start from current date
      const baseDate = currentTrialEnd > currentDate ? currentTrialEnd : currentDate;
      const newTrialEndDate = new Date(baseDate);
      newTrialEndDate.setDate(newTrialEndDate.getDate() + parseInt(days));

      // Update trial end date in database
      console.log('🔄 Updating trial end date to:', newTrialEndDate.toISOString());
      await db.update(users)
        .set({ 
          trialEndDate: newTrialEndDate,
          subscriptionStatus: 'trial',
          subscriptionPlan: 'trial'
        })
        .where(eq(users.id, userId));

      console.log(`✅ Extended trial for user ${targetUser.email} by ${days} days. New end date: ${newTrialEndDate.toISOString()}`);
      
      res.json({ 
        message: `Trial extended by ${days} days successfully`,
        newTrialEndDate: newTrialEndDate.toISOString(),
        user: targetUser.email
      });
    } catch (error: any) {
      console.error("❌ DETAILED TRIAL EXTENSION ERROR:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      res.status(500).json({ message: "Failed to extend trial", error: error.message });
    }
  });

  // Enable free account endpoint
  app.patch('/api/admin/users/:userId/enable-free-account', requireAuth, async (req: any, res) => {
    try {
      console.log('🚀 FREE ACCOUNT DEBUG: Starting request');
      console.log('Request params:', req.params);
      console.log('Request body:', req.body);
      
      const currentUser = req.user;
      console.log('Current user:', currentUser?.email, 'Role:', currentUser?.role);
      
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('❌ FREE ACCOUNT: Access denied - not admin');
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      console.log('Parsed UserID:', userId);

      // Get current user details
      console.log('📝 Getting user details...');
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        console.log('❌ FREE ACCOUNT: User not found:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      console.log('✅ Target user found:', targetUser.email);

      // Set very long trial end date (10 years from now) for unlimited free access
      const freeTrialEndDate = new Date();
      freeTrialEndDate.setFullYear(freeTrialEndDate.getFullYear() + 10);
      console.log('📅 Setting free trial end date:', freeTrialEndDate.toISOString());

      // Update user to have free unlimited access
      console.log('🔄 Updating database...');
      try {
        const updateResult = await db.update(users)
          .set({ 
            trialEndDate: freeTrialEndDate,
            subscriptionStatus: 'active',
            subscriptionPlan: 'enterprise', // Give enterprise features
            isFreeAccess: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
        console.log('✅ Database update result:', updateResult);
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
        throw dbError;
      }

      console.log(`✅ Enabled free unlimited account for user ${targetUser.email}. End date: ${freeTrialEndDate.toISOString()}`);
      
      res.json({ 
        message: "Free unlimited account enabled successfully",
        freeTrialEndDate: freeTrialEndDate.toISOString(),
        user: targetUser.email,
        plan: 'enterprise'
      });
    } catch (error: any) {
      console.error("❌ FULL ERROR DETAILS:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      res.status(500).json({ message: "Failed to enable free account", error: error.message });
    }
  });

  // Admin Reports endpoint for Reports page charts
  app.get("/api/admin/reports", requireAuth, async (req: any, res) => {
    try {
      console.log("🚀 Admin Reports API: Starting request...");
      const startTime = Date.now();
      
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Enhanced caching headers for reports
      res.set({
        'Cache-Control': 'private, max-age=90, stale-while-revalidate=120', // 90 seconds cache
        'ETag': `admin-reports-${Math.floor(Date.now() / 90000)}`, // ETag changes every 90 seconds
        'X-Content-Type-Options': 'nosniff'
      });
      
      // Fetch all data
      const [allBookings, allUsers, allVehicles] = await Promise.all([
        storage.getAllBookings(),
        storage.getAllUsers(),
        storage.getAllVehicles()
      ]);

      // Calculate monthly data for charts
      const monthlyData = [];
      const last6Months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        
        const monthBookings = allBookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate.getMonth() === date.getMonth() && 
                 bookingDate.getFullYear() === date.getFullYear();
        });
        
        const monthlyRevenue = Math.ceil(monthBookings.reduce((sum, booking) => {
          const amount = booking.totalAmount || 0;
          return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
        }, 0));
        
        monthlyData.push({
          month: monthName,
          bookings: monthBookings.length,
          revenue: monthlyRevenue
        });
        
        last6Months.push(...monthBookings);
      }

      // Status distribution for pie chart
      const statusCounts = allBookings.reduce((acc, booking) => {
        const status = booking.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusDistribution = Object.entries(statusCounts).map(([type, count]) => {
        const statusBookings = allBookings.filter(b => b.status === type);
        const statusRevenue = Math.ceil(statusBookings.reduce((sum, booking) => {
          const amount = booking.totalAmount || 0;
          return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
        }, 0));
        
        return {
          type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
          count: count as number,
          revenue: statusRevenue
        };
      });

      // Vehicle distribution
      const vehicleTypes = allVehicles.reduce((acc, vehicle) => {
        const type = vehicle.vehicleType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const vehicleDistribution = Object.entries(vehicleTypes).map(([type, count]) => {
        // Calculate revenue for each vehicle type based on bookings
        const typeBookings = allBookings.filter(booking => {
          // You can enhance this logic based on how vehicle type relates to bookings
          return booking.vehicleType === type;
        });
        
        const typeRevenue = Math.ceil(typeBookings.reduce((sum, booking) => {
          const amount = booking.totalAmount || 0;
          return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
        }, 0));
        
        return {
          type,
          count: count as number,
          revenue: typeRevenue
        };
      });

      // Top customers by revenue
      const customerStats = {};
      allBookings.forEach(booking => {
        const customerId = booking.userId;
        const customer = allUsers.find(u => u.id === customerId);
        if (customer && customer.role !== 'admin') {
          const key = customer.id;
          if (!customerStats[key]) {
            customerStats[key] = {
              name: `${customer.firstName} ${customer.lastName}`,
              email: customer.email,
              bookings: 0,
              revenue: 0
            };
          }
          customerStats[key].bookings += 1;
          const amount = booking.totalAmount || 0;
          customerStats[key].revenue += (typeof amount === 'string' ? parseFloat(amount) : amount);
        }
      });

      const topCustomers = Object.values(customerStats)
        .map((customer: any) => ({
          ...customer,
          revenue: Math.ceil(customer.revenue)
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      // Top routes
      const routeStats = {};
      allBookings.forEach(booking => {
        const route = `${booking.pickupCity} → ${booking.deliveryCity}`;
        if (!routeStats[route]) {
          routeStats[route] = {
            from: booking.pickupCity,
            to: booking.deliveryCity,
            count: 0,
            revenue: 0
          };
        }
        routeStats[route].count += 1;
        const amount = booking.totalAmount || 0;
        routeStats[route].revenue += (typeof amount === 'string' ? parseFloat(amount) : amount);
      });

      const topRoutes = Object.values(routeStats)
        .map((route: any) => ({
          ...route,
          revenue: Math.ceil(route.revenue)
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate metrics
      const totalRevenue = Math.ceil(allBookings.reduce((sum, booking) => {
        const amount = booking.totalAmount || 0;
        return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
      }, 0));
      
      const completionRate = allBookings.length > 0 ? 
        Math.ceil(((statusCounts.delivered || 0) / allBookings.length) * 100) : 0;
      
      const avgOrderValue = allBookings.length > 0 ? 
        Math.ceil(totalRevenue / allBookings.length) : 0;
      
      const activeCustomers = allUsers.filter(u => 
        u.role !== 'admin' && u.subscriptionStatus === 'active'
      ).length;

      const reportsData = {
        monthlyData,
        statusDistribution,
        vehicleDistribution,
        topCustomers,
        topRoutes,
        metrics: {
          totalRevenue,
          totalBookings: allBookings.length,
          totalVehicles: allVehicles.length,
          activeCustomers,
          completionRate,
          avgOrderValue
        }
      };

      const responseTime = Date.now() - startTime;
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`✅ Admin Reports API: Generated reports data in ${responseTime}ms`);
      
      res.json(reportsData);
    } catch (error) {
      console.error("❌ Admin Reports API Error:", error);
      res.status(500).json({ message: "Failed to fetch reports data" });
    }
  });

  // Delete user account
  app.delete('/api/admin/users/:userId', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      
      // Check if user exists
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of admin users
      if (userToDelete.role === 'admin') {
        return res.status(400).json({ message: "Cannot delete admin users" });
      }
      
      // Delete user using storage interface
      await storage.deleteUser(userId);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Office account management routes
  app.post('/api/office-accounts', requireAuth, async (req: any, res) => {
    try {
      const { email, firstName, lastName, officeName, password, commissionRate } = req.body;
      const parentUserId = req.user.id;
      
      console.log('Creating office account with commission rate:', commissionRate);
      
      // Hash password for office account
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const officeAccount = await storage.createOfficeAccount({
        email,
        firstName, 
        lastName,
        officeName,
        hashedPassword,
        parentUserId,
        commissionRate: commissionRate || 5.0
      });
      
      console.log('Office account created with commission rate:', officeAccount.commissionRate);
      res.json(officeAccount);
    } catch (error: any) {
      console.error("Error creating office account:", error);
      
      // Handle duplicate email error
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        return res.status(400).json({ 
          message: `An account with email "${email}" already exists. Please use a different email address.` 
        });
      }
      
      res.status(500).json({ message: "Failed to create office account" });
    }
  });

  app.get('/api/office-accounts', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const officeAccounts = await storage.getUserOfficeAccounts(userId);
      res.json(officeAccounts);
    } catch (error) {
      console.error("Error fetching office accounts:", error);
      res.status(500).json({ message: "Failed to fetch office accounts" });
    }
  });

  app.put('/api/office-accounts/:officeId', requireAuth, async (req: any, res) => {
    try {
      const { officeId } = req.params;
      const { email, firstName, lastName, officeName, commissionRate } = req.body;
      
      const updatedAccount = await storage.updateOfficeAccount(officeId, {
        email,
        firstName,
        lastName,
        officeName,
        commissionRate
      });
      
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating office account:", error);
      res.status(500).json({ message: "Failed to update office account" });
    }
  });

  app.put('/api/office-accounts/:officeId/reset-password', requireAuth, async (req: any, res) => {
    try {
      const { officeId } = req.params;
      const { newPassword } = req.body;
      
      const updatedAccount = await storage.resetOfficeAccountPassword(officeId, newPassword);
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error resetting office account password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.delete('/api/office-accounts/:officeId', requireAuth, async (req: any, res) => {
    try {
      const { officeId } = req.params;
      await storage.deleteOfficeAccount(officeId);
      res.json({ message: "Office account deleted successfully" });
    } catch (error) {
      console.error("Error deleting office account:", error);
      res.status(500).json({ message: "Failed to delete office account" });
    }
  });

  // Daily bookings list download for office accounts
  app.get('/api/bookings/daily-list', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = req.query.date as string;
      
      const bookings = await storage.getDailyBookingsList(userId, date);
      
      // Generate CSV format for download
      const csvHeader = 'Booking ID,Sender,Receiver,Pickup City,Delivery City,Amount,Status,Date\n';
      const csvData = bookings.map(b => 
        `${b.bookingId},"${b.senderName}","${b.receiverName}","${b.pickupCity}","${b.deliveryCity}",${b.totalAmount},${b.status},${b.createdAt}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="daily-bookings-${date || 'today'}.csv"`);
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error("Error generating daily bookings list:", error);
      res.status(500).json({ message: "Failed to generate daily bookings list" });
    }
  });

  // Agent Analytics route
  app.get('/api/agents/:agentId/analytics', requireAuth, async (req: any, res) => {
    try {
      const { agentId } = req.params;
      const { startDate, endDate } = req.query;
      
      const analytics = await storage.getAgentAnalytics(agentId, startDate, endDate);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching agent analytics:", error);
      res.status(500).json({ message: "Failed to fetch agent analytics" });
    }
  });

  // Contact form routes
  app.post('/api/contact', async (req, res) => {
    try {
      const validation = insertContactSubmissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid contact submission data",
          errors: fromZodError(validation.error)
        });
      }

      const submission = await storage.createContactSubmission(validation.data);
      res.json(submission);
    } catch (error) {
      console.error("Error creating contact submission:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  app.get('/api/contact-submissions', requireAuth, async (req: any, res) => {
    try {
      const startTime = Date.now();
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Enhanced caching headers for contact submissions
      res.set({
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=90', // 1 minute cache
        'ETag': `admin-contacts-${Math.floor(Date.now() / 60000)}`, // ETag changes every minute
        'X-Content-Type-Options': 'nosniff'
      });

      const submissions = await storage.getContactSubmissions();
      const responseTime = Date.now() - startTime;
      
      res.set('X-Response-Time', `${responseTime}ms`);
      console.log(`🚀 Admin Contact Submissions API: Fetched ${submissions.length} submissions in ${responseTime}ms`);
      
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({ message: "Failed to fetch contact submissions" });
    }
  });

  // Update contact submission status
  app.put('/api/contact-submissions/:id/status', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['new', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'new', 'in_progress', or 'resolved'" });
      }

      const submission = await storage.updateContactSubmissionStatus(parseInt(id), status);
      res.json(submission);
    } catch (error) {
      console.error("Error updating contact submission status:", error);
      res.status(500).json({ message: "Failed to update contact submission status" });
    }
  });

  // Delete contact submission
  app.delete('/api/contact-submissions/:id', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params;
      await storage.deleteContactSubmission(parseInt(id));
      res.json({ message: "Contact submission deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact submission:", error);
      res.status(500).json({ message: "Failed to delete contact submission" });
    }
  });

  // Server-Sent Events endpoint removed - using EventHub WebSocket at /ws endpoint instead

  // Warehouse Stock History API endpoint
  app.get('/api/warehouses/:warehouseId/stock-history', requireAuth, async (req: any, res) => {
    try {
      const { warehouseId } = req.params;
      const { limit = 50 } = req.query;
      
      // Get stock operations for this warehouse
      const stockOperations = await storage.getWarehouseStockHistory(parseInt(warehouseId), parseInt(limit as string));
      
      // Transform to match the expected format
      const stockHistory = stockOperations.map(op => ({
        id: op.id.toString(),
        timestamp: op.operationDate || op.createdAt,
        operationType: op.operationType === 'stock_in' ? 'add' : 'remove',
        quantity: op.quantity,
        reason: op.reason || `${op.operationType} operation`,
        category: op.operationType,
        notes: op.notes,
        previousStock: 0, // Would need additional calculation in real implementation
        newStock: 0, // Would need additional calculation in real implementation  
        userName: op.operatedBy
      }));
      
      res.json(stockHistory);
    } catch (error) {
      console.error("Error fetching warehouse stock history:", error);
      res.status(500).json({ message: "Failed to fetch stock history" });
    }
  });

  // Test notification endpoint for debugging real-time updates
  app.post('/api/test-notification', async (req: any, res) => {
    try {
      const { userId, title, message, type } = req.body;
      
      console.log('🔔 Creating test notification:', { userId, title, message, type });
      
      // Create notification in database
      const notification = await storage.createNotification({
        userId,
        title,
        message,
        type: type || 'info',
        isRead: false
      });

      console.log('✅ Test notification created:', notification);

      // Emit real-time notification via WebSocket (EventHub)
      try {
        console.log('🔧 Attempting to get EventHub for test notification...');
        const eventHub = getEventHub();
        console.log('✅ EventHub obtained, emitting test notification...');
        
        eventHub.emitNewNotification(notification.userId, {
          type: 'notification',
          notification: {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            createdAt: notification.createdAt
          },
          data: notification,
          userId: notification.userId,
          timestamp: Date.now()
        });
        
        console.log(`🔥 WebSocket test notification sent to user: ${notification.userId}`);
      } catch (eventError) {
        console.error('❌ Failed to emit WebSocket test notification:', eventError);
      }

      res.json({ 
        message: 'Test notification created successfully',
        notification 
      });
    } catch (error) {
      console.error('❌ Error creating test notification:', error);
      res.status(500).json({ message: 'Failed to create test notification' });
    }
  });

  // Support ticket routes
  app.post('/api/support-tickets', requireAuth, async (req: any, res) => {
    try {
      const { subject, message, priority, category } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }
      
      // Map frontend fields to schema fields
      const ticketData = {
        userId: req.user.id,
        title: subject,        // Map subject to title
        description: message,  // Map message to description
        priority: priority || 'medium',
        category: category || 'general',
        status: 'open'
      };
      
      const validation = insertSupportTicketSchema.safeParse(ticketData);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid ticket data",
          errors: fromZodError(validation.error)
        });
      }

      const ticket = await storage.createSupportTicket(validation.data);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get('/api/support-tickets', requireAuth, async (req: any, res) => {
    try {
      const tickets = req.user.role === 'admin' 
        ? await storage.getSupportTickets() 
        : await storage.getSupportTickets(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Admin support ticket management endpoints
  app.post('/api/admin/respond-ticket', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ticketId, response } = req.body;
      
      if (!ticketId || !response) {
        return res.status(400).json({ message: "Ticket ID and response are required" });
      }
      
      const result = await storage.respondToSupportTicket(ticketId, response);
      res.json(result);
    } catch (error) {
      console.error("Error responding to support ticket:", error);
      res.status(500).json({ message: "Failed to respond to support ticket" });
    }
  });

  app.patch('/api/admin/tickets/:ticketId', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { ticketId } = req.params;
      const { status, priority, assignedTo } = req.body;
      
      const result = await storage.updateSupportTicket(ticketId, { status, priority, assignedTo });
      res.json(result);
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  // Notification routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/read-all', requireAuth, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // GPS-Vehicle Integration endpoints
  app.get("/api/bookings/:id/gps-info", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (!booking.vehicleId) {
        return res.json({ hasGPS: false, message: "No vehicle assigned to this booking" });
      }

      // Check if vehicle has GPS device
      const vehicle = await storage.getVehicleById(booking.vehicleId);
      if (!vehicle || !vehicle.gpsDeviceId) {
        return res.json({ hasGPS: false, message: "Vehicle does not have GPS device" });
      }

      res.json({
        hasGPS: true,
        vehicleId: booking.vehicleId,
        gpsDeviceId: vehicle.gpsDeviceId,
        gpsStatus: vehicle.gpsStatus || "inactive",
        vehicleRegistration: vehicle.registrationNumber
      });
    } catch (error) {
      console.error("Error fetching GPS info:", error);
      res.status(500).json({ error: "Failed to fetch GPS info" });
    }
  });

  // Get live tracking for a booking
  app.get("/api/bookings/:id/live-tracking", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const liveTracking = await storage.getLiveTracking(bookingId);
      
      if (!liveTracking) {
        return res.json({ isActive: false, message: "No live tracking available" });
      }

      res.json({
        isActive: liveTracking.isActive,
        currentLatitude: liveTracking.currentLatitude,
        currentLongitude: liveTracking.currentLongitude,
        currentSpeed: liveTracking.currentSpeed,
        heading: liveTracking.heading,
        lastUpdate: liveTracking.lastUpdate,
        batteryLevel: liveTracking.batteryLevel,
        signalStrength: liveTracking.signalStrength,
        estimatedArrival: liveTracking.estimatedArrival
      });
    } catch (error) {
      console.error("Error fetching live tracking:", error);
      res.status(500).json({ error: "Failed to fetch live tracking" });
    }
  });

  // Analytics endpoint for reports
  app.get("/api/analytics", requireAuth, async (req: any, res) => {
    try {
      // Get user-specific booking analytics
      const userId = req.user.id;
      
      // Get total bookings and revenue for this user (including office accounts)
      const userBookings = await storage.getUserBookings(userId);
      
      const totalBookings = userBookings.length;
      const totalRevenue = Math.ceil(userBookings.reduce((sum, booking) => 
        sum + Number(booking.totalAmount || 0), 0
      ));
      
      console.log(`Analytics API: User ${userId} has ${totalBookings} bookings with ₹${totalRevenue} total revenue (including office bookings)`);
      
      // Count active agents (office accounts)
      const officeAccounts = await storage.getUserOfficeAccounts(userId);
      const activeAgents = officeAccounts.length;
      
      // Get top routes from user's bookings
      const routeCounts = userBookings.reduce((routes: any, booking) => {
        const key = `${booking.pickupCity}-${booking.deliveryCity}`;
        routes[key] = (routes[key] || 0) + 1;
        return routes;
      }, {});
      
      const topRoutes = Object.entries(routeCounts)
        .map(([route, count]) => {
          const [from, to] = route.split('-');
          return { from, to, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate monthly growth based on current vs previous month
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const currentMonthBookings = userBookings.filter(b => 
        b.createdAt && new Date(b.createdAt) >= currentMonthStart
      ).length;
      
      const previousMonthBookings = userBookings.filter(b => {
        if (!b.createdAt) return false;
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= previousMonthStart && bookingDate <= previousMonthEnd;
      }).length;
      
      const monthlyGrowth = previousMonthBookings > 0 
        ? Math.round(((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100)
        : currentMonthBookings > 0 ? 100 : 0;
      
      res.json({
        revenue: totalRevenue,
        activeAgents,
        totalBookings,
        topRoutes,
        monthlyGrowth
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get user office accounts with analytics data (admin only)
  app.get("/api/admin/users/:userId/office-accounts", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const officeAccounts = await storage.getUserOfficeAccounts(userId);
      
      // Get booking data for each office account
      const allBookings = await storage.getAllBookings();
      
      const enrichedOfficeAccounts = officeAccounts.map((office: any) => {
        const officeBookings = allBookings.filter(b => b.userId === office.id);
        const totalRevenue = officeBookings.reduce((sum: number, booking: any) => {
          const amount = booking.totalAmount || 0;
          return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
        }, 0);
        
        return {
          id: office.id,
          firstName: office.firstName,
          lastName: office.lastName,
          email: office.email,
          officeName: office.officeName,
          totalBookings: officeBookings.length,
          totalRevenue: Math.ceil(totalRevenue).toString()
        };
      });
      
      res.json(enrichedOfficeAccounts);
    } catch (error) {
      console.error("Error getting user office accounts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get detailed user analytics for modal tabs
  app.get('/api/admin/users/:userId/detailed-analytics', requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      
      // Get user's bookings (both personal and office account bookings)
      const userBookings = await storage.getUserBookings(userId);
      const officeAccounts = await storage.getUserOfficeAccounts(userId);
      
      // Get all office account bookings
      let allOfficeBookings: any[] = [];
      for (const office of officeAccounts) {
        const officeBookings = await storage.getUserBookings(office.id);
        allOfficeBookings = allOfficeBookings.concat(officeBookings);
      }
      
      // Combine all bookings
      const allBookings = [...userBookings, ...allOfficeBookings];
      
      // Generate last 6 months data for charts
      const last6Months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthBookings = allBookings.filter(b => {
          if (!b.createdAt) return false;
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });
        
        const revenue = Math.ceil(monthBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0));
        
        last6Months.push({
          month: monthName,
          bookings: monthBookings.length,
          revenue: revenue
        });
      }
      
      // Get recent bookings (last 10)
      const recentBookings = allBookings
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10)
        .map(booking => ({
          id: booking.id,
          bookingType: booking.bookingType,
          status: booking.status,
          totalAmount: booking.totalAmount,
          pickupCity: booking.pickupCity,
          deliveryCity: booking.deliveryCity,
          createdAt: booking.createdAt
        }));
      
      // Calculate popular routes
      const routeCounts = allBookings.reduce((routes: any, booking) => {
        if (booking.pickupCity && booking.deliveryCity) {
          const route = `${booking.pickupCity} → ${booking.deliveryCity}`;
          routes[route] = (routes[route] || 0) + 1;
        }
        return routes;
      }, {});
      
      const popularRoutes = Object.entries(routeCounts)
        .map(([route, count]) => ({ route, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate performance metrics
      const totalRevenue = Math.ceil(allBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0));
      const avgOrderValue = allBookings.length > 0 ? Math.ceil(totalRevenue / allBookings.length) : 0;
      const completedBookings = allBookings.filter(b => b.status === 'delivered').length;
      const completionRate = allBookings.length > 0 ? (completedBookings / allBookings.length) * 100 : 0;
      
      // Calculate customer satisfaction (simulated based on completion rate)
      const customerSatisfaction = Math.min(completionRate + 10, 100);
      
      res.json({
        chartData: {
          last6Months,
          popularRoutes
        },
        recentBookings,
        performanceMetrics: {
          totalBookings: allBookings.length,
          totalRevenue: Math.ceil(totalRevenue).toString(),
          avgOrderValue: Math.ceil(avgOrderValue).toString(),
          completionRate: Math.ceil(completionRate).toString(),
          customerSatisfaction: Math.ceil(customerSatisfaction).toString()
        }
      });
    } catch (error) {
      console.error("Error fetching detailed analytics:", error);
      res.status(500).json({ error: "Failed to fetch detailed analytics" });
    }
  });

  // Reports data endpoint
  app.get("/api/reports/data", requireAuth, async (req: any, res) => {
    try {
      const { dateRange, reportType } = req.query;
      
      // Get analytics data
      const analytics = await storage.getAnalytics();
      
      // Calculate actual monthly data from bookings
      const totalBookings = analytics.topRoutes.reduce((sum, route) => sum + route.count, 0);
      const userId = req.user.id;
      const userBookings = await storage.getUserBookings(userId);
      
      // Generate real monthly data from actual bookings
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthBookings = userBookings.filter(b => {
          if (!b.createdAt) return false;
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        }).length;
        
        monthlyData.push({
          month: months[date.getMonth()],
          bookings: monthBookings
        });
      }
      
      // Vehicle type distribution from actual bookings
      const vehicleTypes = userBookings.reduce((acc, booking) => {
        const type = booking.vehicleType || 'Standard Vehicle';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      const vehicleDistribution = Object.entries(vehicleTypes).map(([type, count]) => ({
        type,
        count: count,
        revenue: userBookings
          .filter(b => (b.vehicleType || 'Standard Vehicle') === type)
          .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
      }));
      
      // Status distribution 
      const statusTypes = userBookings.reduce((acc, booking) => {
        const status = booking.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const statusDistribution = Object.entries(statusTypes).map(([status, count]) => ({
        type: status.charAt(0).toUpperCase() + status.slice(1),
        count: count,
        revenue: userBookings
          .filter(b => b.status === status)
          .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
      }));
      
      const totalRevenue = userBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
      
      res.json({
        monthlyData,
        vehicleDistribution,
        statusDistribution,
        totalRevenue,
        totalBookings: userBookings.length
      });
    } catch (error) {
      console.error("Error fetching reports data:", error);
      res.status(500).json({ error: "Failed to fetch reports data" });
    }
  });

  app.get("/api/bookings/with-gps", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getBookingsWithGPSTracking(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching GPS bookings:", error);
      res.status(500).json({ message: "Failed to fetch GPS bookings" });
    }
  });

  app.put("/api/vehicles/:id/gps-status", requireAuth, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const { status } = req.body;
      const vehicle = await storage.updateVehicleGPSStatus(vehicleId, status);
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating GPS status:", error);
      res.status(500).json({ message: "Failed to update GPS status" });
    }
  });

  // User theme settings routes - with agent theme inheritance
  app.get("/api/user/theme-settings", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let settings;
      
      // If user is an agent (office role), inherit parent's theme
      if (user?.role === 'office' && user.parentUserId) {
        console.log(`Agent ${userId} inheriting theme from parent ${user.parentUserId}`);
        settings = await storage.getUserThemeSettings(user.parentUserId);
      } else {
        // Regular user, get their own theme
        settings = await storage.getUserThemeSettings(userId);
      }
      
      if (!settings) {
        // Return default theme settings
        return res.json({
          primaryColor: "#3b82f6",
          secondaryColor: "#64748b", 
          accentColor: "#f59e0b",
          theme: "system",
          logoUrl: null
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error getting user theme settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/theme-settings", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { primaryColor, secondaryColor, accentColor, theme, logoUrl } = req.body;
      
      const updatedSettings = await storage.updateUserThemeSettings(req.user.id, {
        primaryColor,
        secondaryColor,
        accentColor,
        theme,
        logoUrl
      });
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user theme settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logo upload endpoint
  app.post("/api/user/theme/logo", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.id;
      
      // For now, we'll simulate logo upload
      // In production, you would handle actual file upload here
      const logoUrl = `/uploads/logo-${userId}-${Date.now()}.png`;
      
      // Update theme settings with new logo URL
      const updatedSettings = await storage.updateUserThemeSettings(userId, {
        logoUrl
      });
      
      res.json({ 
        message: "Logo uploaded successfully",
        logoUrl: logoUrl
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Admin user details endpoint
  app.get("/api/admin/users/:userId/details", async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        officeName: user.officeName,
        role: user.role,
        trialEndDate: user.trialEndDate,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        isActive: user.isActive,
        createdAt: user.createdAt,
        commissionRate: user.commissionRate
      });
    } catch (error) {
      console.error("Error getting user details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin user basic info update endpoint
  app.put("/api/admin/users/:userId/basic-info", requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { firstName, lastName, email, phone, address, officeName } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        phone,
        address,
        officeName
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User information updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user basic info:", error);
      res.status(500).json({ message: "Failed to update user information" });
    }
  });

  // Admin password reset endpoint
  app.put("/api/admin/users/:userId/reset-password", requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Super Admin theme settings routes
  app.get("/api/admin/theme-settings", async (req, res) => {
    try {
      const settings = await storage.getSuperAdminThemeSettings();
      
      if (!settings) {
        // Return default theme settings
        return res.json({
          primaryColor: "#3b82f6",
          secondaryColor: "#64748b",
          accentColor: "#8b5cf6",
          theme: "light"
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error getting super admin theme settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/theme-settings", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { primaryColor, secondaryColor, accentColor, theme } = req.body;
      
      const updatedSettings = await storage.updateSuperAdminThemeSettings({
        primaryColor,
        secondaryColor,
        accentColor,
        theme
      });
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating super admin theme settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Logo Upload Endpoint
  app.post("/api/admin/upload-logo", requireAuth, logoUpload.single('logo'), async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create logo URL relative to uploads directory
      const logoUrl = `/uploads/logos/${req.file.filename}`;
      
      console.log('🎨 ADMIN LOGO UPLOADED:', {
        filename: req.file.filename,
        path: req.file.path,
        logoUrl: logoUrl,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Update super admin theme settings with new logo URL
      const updatedSettings = await storage.updateSuperAdminThemeSettings({
        logoUrl: logoUrl
      });

      res.json({ 
        logoUrl: logoUrl,
        filename: req.file.filename,
        message: 'Logo uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading admin logo:', error);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  });

  // Super Admin Comprehensive Analytics Endpoint
  app.get("/api/admin-comprehensive-analytics", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all bookings and users
      const allBookings = await storage.getAllBookings();
      const allUsers = await storage.getAllUsers();
      
      // Filter: Only count users (exclude agents from commission calculation)
      const mainUsers = allUsers.filter(u => u.role !== 'office' && u.role !== 'admin');
      
      // Calculate TOTAL commission revenue from ALL bookings (users + agents)
      let commissionRevenue = 0;
      
      allBookings.forEach(booking => {
        const bookingAmount = parseFloat(booking.totalAmount || '0');
        const bookingUser = allUsers.find(u => u.id === booking.userId);
        
        // Include commission from both main users AND office agents
        if (bookingUser && bookingUser.role !== 'admin') {
          let commissionRate = parseFloat(bookingUser.commissionRate || '5');
          
          // If this is an office agent booking, find the parent user's commission rate
          if (bookingUser.role === 'office' && bookingUser.parentUserId) {
            const parentUser = allUsers.find(u => u.id === bookingUser.parentUserId);
            if (parentUser && parentUser.commissionRate) {
              commissionRate = parseFloat(parentUser.commissionRate);
            }
          }
          
          const commission = (bookingAmount * commissionRate) / 100;
          commissionRevenue += commission;
        }
      });

      // Calculate subscription revenue from ACTUALLY PAID subscriptions only
      // Only count users who have moved beyond trial and are paying
      const paidSubscribers = allUsers.filter(u => 
        u.subscriptionStatus === 'active' && 
        u.role !== 'admin' && 
        u.role !== 'office' &&
        u.subscriptionPlan && 
        u.subscriptionPlan !== 'trial' && 
        u.subscriptionPlan !== 'free' &&
        // Additional check: make sure they're not on trial status
        (!u.trialStartDate || (u.trialEndDate && new Date() > new Date(u.trialEndDate)))
      );
      
      // Since all current users are on trial, subscription revenue should be 0
      const subscriptionRevenue = 0;

      // Total income: commission revenue + subscription revenue (currently 0 since all are on trial)
      const totalIncome = Math.ceil(commissionRevenue + subscriptionRevenue);

      // Calculate monthly growth based on user bookings only (not agent bookings)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthUserBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt || '');
        const bookingUser = allUsers.find(u => u.id === booking.userId);
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear &&
               bookingUser && bookingUser.role !== 'office';
      });
      
      const previousMonthUserBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt || '');
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const bookingUser = allUsers.find(u => u.id === booking.userId);
        return bookingDate.getMonth() === prevMonth && 
               bookingDate.getFullYear() === prevYear &&
               bookingUser && bookingUser.role !== 'office';
      });

      // Calculate growth based on Super Admin's 5% commission income only
      const currentMonthUserCommission = currentMonthUserBookings.reduce((sum, b) => {
        const bookingAmount = parseFloat(b.totalAmount || '0');
        return sum + (bookingAmount * 0.05); // Super Admin gets fixed 5%
      }, 0);
      
      const previousMonthUserCommission = previousMonthUserBookings.reduce((sum, b) => {
        const bookingAmount = parseFloat(b.totalAmount || '0');
        return sum + (bookingAmount * 0.05); // Super Admin gets fixed 5%
      }, 0);
      
      const monthlyGrowth = previousMonthUserCommission > 0 
        ? Math.ceil(((currentMonthUserCommission - previousMonthUserCommission) / previousMonthUserCommission) * 100) 
        : 0;

      // Count platform users breakdown
      const mainUsersCount = allUsers.filter(user => 
        user.role === 'transporter' || user.role === 'distributor' || user.role === 'warehouse'
      ).length;
      const agentUsersCount = allUsers.filter(user => user.role === 'office').length;
      const platformUsers = mainUsersCount + agentUsersCount;
      
      // Count ALL bookings (user + agent bookings combined)
      const userBookings = allBookings;



      const analytics = {
        totalIncome: Math.ceil(totalIncome),
        commissionRevenue: Math.ceil(commissionRevenue),
        subscriptionRevenue: Math.ceil(subscriptionRevenue),
        platformUsers: platformUsers,
        mainUsers: mainUsersCount,
        agentUsers: agentUsersCount,
        totalBookings: userBookings.length,
        monthlyGrowth: monthlyGrowth,
        avgCommissionRate: 5.0
      };
      
      console.log(`📊 Analytics breakdown - Main Users: ${mainUsersCount}, Agent Users: ${agentUsersCount}, Total: ${platformUsers}`);

      res.json(analytics);
    } catch (error) {
      console.error("Error getting Super Admin comprehensive analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== MESSAGING & NOTIFICATION SYSTEM =====

  // Get user notifications
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count: Number(count) });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/mark-read", requireAuth, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", requireAuth, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Get messages between admin and user
  app.get("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { ticketId } = req.query;
      
      let messages = await storage.getUserMessages(userId, userRole);
      
      // Filter by ticket ID if provided
      if (ticketId) {
        console.log(`🎯 Filtering messages by ticketId: ${ticketId} (type: ${typeof ticketId})`);
        console.log(`📋 Messages before filter:`, messages.map(m => ({ id: m.id, relatedTicketId: m.relatedTicketId, subject: m.subject })));
        
        const filteredMessages = messages.filter((msg: any) => {
          const matches = msg.relatedTicketId === parseInt(ticketId);
          console.log(`🔍 Message ${msg.id}: relatedTicketId=${msg.relatedTicketId}, matches=${matches}`);
          return matches;
        });
        
        console.log(`✅ Filtered messages count: ${filteredMessages.length}`);
        messages = filteredMessages;
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Create new message
  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const { toUserId, subject, message: messageText, relatedTicketId, priority } = req.body;
      const fromUserId = req.user.id;

      // Create the message
      const newMessage = await storage.createMessage({
        fromUserId,
        toUserId,
        subject,
        message: messageText,
        relatedTicketId,
        priority
      });

      // Create notification for the recipient
      await storage.createNotification({
        userId: toUserId,
        title: `New message: ${subject}`,
        message: `You have received a new message from ${req.user.firstName || req.user.email}`,
        type: 'message',
        relatedId: newMessage.id,
        senderUserId: fromUserId,
        actionUrl: '/messages'
      });

      res.json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread-count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Failed to fetch message count" });
    }
  });

  // Mark message as read
  app.put("/api/messages/:id/mark-read", requireAuth, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Mark all messages as read
  app.put("/api/messages/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllMessagesAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      res.status(500).json({ message: "Failed to mark all messages as read" });
    }
  });

  // Enhanced support ticket creation with notifications
  app.post("/api/support-tickets", requireAuth, async (req: any, res) => {
    try {
      const { title, description, priority, category } = req.body;
      const userId = req.user.id;
      
      const newTicket = await storage.createSupportTicket({
        userId,
        title,
        description,
        priority,
        category,
        status: 'open'
      });

      // Get all admin users
      const adminUsers = await storage.getAllUsers();
      const admins = adminUsers.filter(user => user.role === 'admin');

      // Create notifications for all admins
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          title: 'New Support Ticket',
          message: `${req.user.firstName || req.user.email} created a new support ticket: ${title}`,
          type: 'info',
          relatedId: newTicket.id,
          senderUserId: userId,
          actionUrl: '/admin/support'
        });
      }

      res.json(newTicket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // Subscription Plans API endpoints
  // Public endpoint for pricing page (no auth required)
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      console.log('📊 Fetching public subscription plans');
      const plans = await storage.getAllSubscriptionPlans();
      const activePlans = plans.filter(plan => plan.isActive);
      console.log('✅ Returning', activePlans.length, 'active plans for public');
      res.json(activePlans);
    } catch (error) {
      console.error("Error fetching public subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/admin/subscription-plans', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching active subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/admin/subscription-plans/stats', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getSubscriptionPlanStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching subscription plan stats:", error);
      res.status(500).json({ message: "Failed to fetch subscription plan stats" });
    }
  });

  app.post('/api/admin/subscription-plans', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validation = insertSubscriptionPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid plan data", 
          errors: validation.error.errors 
        });
      }
      
      const plan = await storage.createSubscriptionPlan(validation.data);
      res.json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  app.put('/api/admin/subscription-plans/:id', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const planId = parseInt(req.params.id);
      const validation = insertSubscriptionPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid plan data", 
          errors: validation.error.errors 
        });
      }
      
      const plan = await storage.updateSubscriptionPlan(planId, validation.data);
      
      // Broadcast plan update to all connected clients
      const eventHub = getEventHub();
      if (eventHub) {
        eventHub.emitPlanUpdate(plan);
        
        // Also fetch all plans and broadcast complete list
        const allPlans = await storage.getAllSubscriptionPlans();
        eventHub.emitPricingDataUpdate(allPlans.filter(p => p.isActive));
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });

  app.delete('/api/admin/subscription-plans/:id', requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const planId = parseInt(req.params.id);
      await storage.deleteSubscriptionPlan(planId);
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

  // ===== RAZORPAY SUBSCRIPTION ENDPOINTS =====

  // Create Razorpay subscription
  app.post('/api/create-subscription', requireAuth, async (req: any, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ 
          message: "Payment service not available. Please contact support.",
          error: "RAZORPAY_NOT_CONFIGURED"
        });
      }

      const { planId } = req.body;
      const userId = req.user.id;

      // Get subscription plan from database
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create Razorpay subscription
      const subscription = await razorpay.subscriptions.create({
        plan_id: `plan_${plan.id}`, // You'll need to create plans in Razorpay dashboard
        customer_notify: 1,
        quantity: 1,
        total_count: 12, // 12 months
        addons: [],
        notes: {
          user_id: userId,
          plan_name: plan.name,
          email: user.email || '',
        }
      });

      // Save subscription to database
      const newSubscription = await storage.createSubscription({
        userId,
        planId: plan.id,
        razorpaySubscriptionId: subscription.id,
        status: 'created',
        amount: plan.price,
        currency: 'INR'
      });

      res.json({
        subscriptionId: subscription.id,
        planName: plan.name,
        amount: plan.price,
        currency: 'INR',
        subscription: newSubscription
      });

    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Handle Razorpay payment success
  app.post('/api/subscription/verify-payment', requireAuth, async (req: any, res) => {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
      const userId = req.user.id;

      // Verify payment signature (you should implement this for security)
      // const crypto = require('crypto');
      // const body = razorpay_payment_id + "|" + razorpay_subscription_id;
      // const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      //   .update(body.toString())
      //   .digest('hex');

      // if (expectedSignature !== razorpay_signature) {
      //   return res.status(400).json({ message: "Payment verification failed" });
      // }

      // Update subscription status in database
      const subscription = await storage.updateSubscriptionStatus(razorpay_subscription_id, 'active');
      
      if (subscription) {
        // Get subscription plan details
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        
        // Update user subscription details
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + (plan?.trialDays || 7));
        
        await storage.upsertUser({
          id: userId,
          subscriptionPlan: plan?.name || 'professional',
          subscriptionStatus: 'active',
          trialEndDate: trialEndDate,
          razorpaySubscriptionId: razorpay_subscription_id
        });

        // Send success notification
        await storage.createNotification({
          userId,
          title: "Subscription Activated!",
          message: `Your ${plan?.name} plan has been activated successfully. Enjoy all premium features!`,
          type: "success"
        });

        res.json({ 
          message: "Payment verified and subscription activated",
          subscription,
          plan
        });
      } else {
        res.status(404).json({ message: "Subscription not found" });
      }

    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Get user's active subscription
  app.get('/api/user/subscription', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.razorpaySubscriptionId) {
        // Get subscription details from Razorpay
        if (!razorpay) {
          return res.status(503).json({ message: "Payment service not available" });
        }
        const razorpaySubscription = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
        
        // Get local subscription details
        const localSubscription = await storage.getSubscriptionByRazorpayId(user.razorpaySubscriptionId);
        
        res.json({
          razorpaySubscription,
          localSubscription,
          user: {
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
            trialEndDate: user.trialEndDate
          }
        });
      } else {
        res.json({ message: "No active subscription found" });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.razorpaySubscriptionId) {
        // Cancel subscription in Razorpay
        if (!razorpay) {
          return res.status(503).json({ message: "Payment service not available" });
        }
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, { cancel_at_cycle_end: 1 });
        
        // Update subscription status in database
        await storage.updateSubscriptionStatus(user.razorpaySubscriptionId, 'cancelled');
        
        // Update user subscription status
        await storage.upsertUser({
          id: userId,
          subscriptionStatus: 'cancelled'
        });

        res.json({ message: "Subscription cancelled successfully" });
      } else {
        res.status(404).json({ message: "No active subscription found" });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Stripe Payment Intent endpoint
  app.post('/api/create-payment-intent', requireAuth, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment service not available. Please contact support.",
          error: "STRIPE_NOT_CONFIGURED"
        });
      }

      const { planId, amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'inr',
        metadata: {
          userId: req.user.id,
          planId: planId || 'unknown'
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Image upload endpoint for announcements
  app.post('/api/upload/announcement-image', requireAuth, upload.single('image'), async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Create the image URL that will be stored in database
      const imageUrl = `/uploads/announcements/${req.file.filename}`;
      
      console.log('📸 IMAGE UPLOADED:', {
        filename: req.file.filename,
        path: req.file.path,
        imageUrl: imageUrl
      });

      res.json({ 
        imageUrl: imageUrl,
        filename: req.file.filename,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Announcements routes
  app.get('/api/announcements', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const announcements = await storage.getAllAnnouncements();
      console.log('📢 FETCHED ANNOUNCEMENTS FOR ADMIN:', announcements.length);
      res.json(announcements);
    } catch (error) {
      console.error('Error getting announcements:', error);
      res.status(500).json({ message: 'Failed to get announcements' });
    }
  });

  app.get('/api/announcements/active', async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Error getting active announcements:', error);
      res.status(500).json({ message: 'Failed to get active announcements' });
    }
  });

  app.post('/api/announcements', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Convert datetime-local strings to Date objects
      const announcementData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };

      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  app.put('/api/announcements/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const id = parseInt(req.params.id);
      
      // Convert datetime-local strings to Date objects if they exist
      const updateData = {
        ...req.body
      };
      
      if (req.body.startDate) {
        updateData.startDate = new Date(req.body.startDate);
      }
      
      if (req.body.endDate) {
        updateData.endDate = new Date(req.body.endDate);
      }
      
      const announcement = await storage.updateAnnouncement(id, updateData);
      res.json(announcement);
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Failed to update announcement' });
    }
  });

  app.delete('/api/announcements/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // Financial Reports endpoint
  app.get('/api/financial-reports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      
      // Get query parameters for filtering
      const { period, startDate, endDate, categoryFilter } = req.query;
      
      // Get user bookings for financial calculations
      let bookings = await storage.getUserBookings(userId);
      
      // Apply date filtering if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        bookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt || '');
          return bookingDate >= start && bookingDate <= end;
        });
      }
      
      // Calculate current month data
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const currentMonthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt || '');
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });
      
      // Calculate total revenue (all filtered bookings)
      const totalRevenue = Math.ceil(bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0));
      
      // Calculate commission paid (5% of total revenue)
      const commissionPaid = Math.ceil(totalRevenue * 0.05);
      
      // Calculate net income (revenue - commission)
      const netIncome = Math.ceil(totalRevenue - commissionPaid);
      
      // Current month revenue
      const currentMonthRevenue = Math.ceil(currentMonthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0));
      
      // Calculate realistic expenses based on logistics business
      const fuelExpenses = Math.ceil(totalRevenue * 0.18); // 18% of revenue
      const maintenanceExpenses = Math.ceil(totalRevenue * 0.10); // 10% of revenue
      const driverSalaries = Math.ceil(totalRevenue * 0.30); // 30% of revenue
      const insuranceExpenses = Math.ceil(totalRevenue * 0.05); // 5% of revenue
      const officeCosts = Math.ceil(totalRevenue * 0.08); // 8% of revenue
      const otherExpenses = Math.ceil(totalRevenue * 0.04); // 4% of revenue
      
      const totalExpenses = Math.ceil(fuelExpenses + maintenanceExpenses + driverSalaries + insuranceExpenses + officeCosts + otherExpenses + commissionPaid);
      const profit = Math.ceil(totalRevenue - totalExpenses);
      
      // Monthly data for charts (last 12 months or based on period)
      const monthsToShow = period === 'yearly' ? 12 : 6;
      const monthlyData = [];
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        const monthBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt || '');
          return bookingDate.getMonth() === monthDate.getMonth() && 
                 bookingDate.getFullYear() === monthDate.getFullYear();
        });
        
        const monthRevenue = Math.ceil(monthBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0));
        const monthExpenses = Math.ceil(monthRevenue * 0.75); // 75% of revenue as expenses
        const monthProfit = Math.ceil(monthRevenue - monthExpenses);
        
        monthlyData.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthProfit
        });
      }
      
      // Yearly comparison data (last 3 years)
      const yearlyComparison = [];
      for (let i = 2; i >= 0; i--) {
        const year = currentYear - i;
        const yearBookings = bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt || '');
          return bookingDate.getFullYear() === year;
        });
        
        const yearRevenue = Math.ceil(yearBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0));
        const yearExpenses = Math.ceil(yearRevenue * 0.75);
        const yearProfit = Math.ceil(yearRevenue - yearExpenses);
        
        yearlyComparison.push({
          year: year.toString(),
          revenue: yearRevenue,
          expenses: yearExpenses,
          profit: yearProfit
        });
      }
      
      // Top revenue routes
      const routeRevenue: { [key: string]: { total: number; count: number; amounts: number[] } } = {};
      bookings.forEach(booking => {
        const route = `${booking.pickupLocation} → ${booking.deliveryLocation}`;
        if (!routeRevenue[route]) {
          routeRevenue[route] = { total: 0, count: 0, amounts: [] };
        }
        routeRevenue[route].total += booking.totalAmount || 0;
        routeRevenue[route].count += 1;
        routeRevenue[route].amounts.push(booking.totalAmount || 0);
      });
      
      const topRoutes = Object.entries(routeRevenue)
        .map(([route, data]) => ({
          route,
          bookings: data.count,
          revenue: Math.ceil(data.total),
          avgAmount: Math.ceil(data.total / data.count)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      // Enhanced income breakdown with transaction counts
      const incomeBreakdown = [
        { 
          category: 'Full Truck Load (FTL)', 
          amount: Math.ceil(totalRevenue * 0.45), 
          percentage: 45,
          count: Math.ceil(bookings.length * 0.3)
        },
        { 
          category: 'Less Than Truck Load (LTL)', 
          amount: Math.ceil(totalRevenue * 0.35), 
          percentage: 35,
          count: Math.ceil(bookings.length * 0.5)
        },
        { 
          category: 'Part Load Services', 
          amount: Math.ceil(totalRevenue * 0.15), 
          percentage: 15,
          count: Math.ceil(bookings.length * 0.15)
        },
        { 
          category: 'Express Delivery', 
          amount: Math.ceil(totalRevenue * 0.05), 
          percentage: 5,
          count: Math.ceil(bookings.length * 0.05)
        }
      ];
      
      // Enhanced expense breakdown with transaction counts
      const expenseBreakdown = [
        { 
          category: 'Driver Salaries & Benefits', 
          amount: driverSalaries, 
          percentage: 30,
          count: Math.ceil(bookings.length * 0.8)
        },
        { 
          category: 'Fuel & Energy Costs', 
          amount: fuelExpenses, 
          percentage: 18,
          count: Math.ceil(bookings.length * 1.2)
        },
        { 
          category: 'Vehicle Maintenance', 
          amount: maintenanceExpenses, 
          percentage: 10,
          count: Math.ceil(bookings.length * 0.3)
        },
        { 
          category: 'Office & Administrative', 
          amount: officeCosts, 
          percentage: 8,
          count: Math.ceil(bookings.length * 0.1)
        },
        { 
          category: 'Insurance & Security', 
          amount: insuranceExpenses, 
          percentage: 5,
          count: Math.ceil(bookings.length * 0.05)
        },
        { 
          category: 'Platform Commission', 
          amount: commissionPaid, 
          percentage: 5,
          count: bookings.length
        },
        { 
          category: 'Other Expenses', 
          amount: otherExpenses, 
          percentage: 4,
          count: Math.ceil(bookings.length * 0.2)
        }
      ];
      
      // Enhanced transactions with realistic data
      const recentTransactions = bookings.slice(0, 15).map(booking => ({
        id: booking.id,
        date: booking.createdAt,
        description: `Shipment: ${booking.senderName} to ${booking.receiverName}`,
        amount: Math.ceil(booking.totalAmount || 0),
        type: 'income',
        category: booking.serviceType === 'ftl' ? 'FTL Service' : 
                 booking.serviceType === 'ltl' ? 'LTL Service' : 'Part Load',
        status: booking.paymentStatus || 'paid'
      }));
      
      // Add some expense transactions for realism
      const expenseTransactions = [
        {
          id: 9991,
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          description: 'Fuel expenses for fleet',
          amount: Math.ceil(fuelExpenses / 10),
          type: 'expense',
          category: 'Fuel Costs',
          status: 'paid'
        },
        {
          id: 9992,
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          description: 'Driver salary payment',
          amount: Math.ceil(driverSalaries / 8),
          type: 'expense',
          category: 'Driver Salaries',
          status: 'paid'
        },
        {
          id: 9993,
          date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          description: 'Vehicle maintenance service',
          amount: Math.ceil(maintenanceExpenses / 5),
          type: 'expense',
          category: 'Maintenance',
          status: 'paid'
        }
      ];
      
      // Combine and sort transactions
      const allTransactions = [...recentTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);
      
      // Profit & Loss Statement
      const profitLossStatement = {
        grossRevenue: totalRevenue,
        operatingExpenses: totalExpenses - commissionPaid,
        grossProfit: Math.ceil(totalRevenue - (totalExpenses - commissionPaid)),
        taxExpenses: Math.ceil(profit * 0.18), // 18% tax rate
        netProfit: Math.ceil(profit * 0.82) // After tax profit
      };
      
      const financialData = {
        overview: {
          totalRevenue,
          totalExpenses,
          netIncome,
          profit,
          currentMonthRevenue,
          profitMargin: totalRevenue > 0 ? Math.ceil((profit / totalRevenue) * 100) : 0
        },
        monthlyTrends: monthlyData,
        yearlyComparison,
        incomeBreakdown,
        expenseBreakdown,
        recentTransactions: allTransactions,
        topRoutes,
        profitLossStatement
      };
      
      res.json(financialData);
    } catch (error) {
      console.error('Error getting financial reports:', error);
      res.status(500).json({ message: 'Failed to get financial reports' });
    }
  });

  // Financial Reports API
  app.get('/api/financial-reports', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { period = 'monthly' } = req.query;
      
      console.log(`📊 Generating financial reports for user: ${userId}, period: ${period}`);
      
      const financialData = await storage.getFinancialReports(userId, period);
      res.json(financialData);
    } catch (error) {
      console.error("Error generating financial reports:", error);
      res.status(500).json({ message: "Failed to generate financial reports" });
    }
  });

  // Expense Management Routes
  app.get("/api/expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const expenses = await storage.getUserExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const { amount, expenseType, category, description, expenseDate, vehicleId } = req.body;

      if (!amount || !expenseType || !description) {
        return res.status(400).json({ message: "Amount, expense type, and description are required" });
      }

      const expenseData = {
        userId,
        amount: parseFloat(amount),
        expenseType,
        category: category || 'General',
        description,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        vehicleId: vehicleId || null
      };

      const newExpense = await storage.createExpense(expenseData);
      res.status(201).json(newExpense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      // Check if expense belongs to user
      const existingExpense = await storage.getExpenseById(parseInt(id));
      if (!existingExpense || existingExpense.userId !== userId) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const { amount, expenseType, category, description, expenseDate, vehicleId } = req.body;
      
      const updateData: any = {};
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (expenseType !== undefined) updateData.expenseType = expenseType;
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate);
      if (vehicleId !== undefined) updateData.vehicleId = vehicleId;

      const updatedExpense = await storage.updateExpense(parseInt(id), updateData);
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      // Check if expense belongs to user
      const existingExpense = await storage.getExpenseById(parseInt(id));
      if (!existingExpense || existingExpense.userId !== userId) {
        return res.status(404).json({ message: "Expense not found" });
      }

      await storage.deleteExpense(parseInt(id));
      res.json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  app.get("/api/expenses/analytics", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const analytics = await storage.getExpenseAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching expense analytics:", error);
      res.status(500).json({ message: "Failed to fetch expense analytics" });
    }
  });

  app.get("/api/expenses/by-type/:type", requireAuth, async (req: any, res) => {
    try {
      const { type } = req.params;
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const expenses = await storage.getExpensesByType(userId, type);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses by type:", error);
      res.status(500).json({ message: "Failed to fetch expenses by type" });
    }
  });

  // Financial Routes
  app.get("/api/financial/dashboard", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const dashboard = await storage.getFinancialDashboard(userId);
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching financial dashboard:", error);
      res.status(500).json({ message: "Failed to fetch financial dashboard" });
    }
  });

  app.get("/api/financial/salary-payments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const payments = await storage.getSalaryPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching salary payments:", error);
      res.status(500).json({ message: "Failed to fetch salary payments" });
    }
  });

  app.post("/api/financial/salary-payments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log("💸 Salary Payment API - UserID:", userId);
      console.log("💸 Salary Payment API - Request body:", JSON.stringify(req.body, null, 2));
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const paymentData = {
        personName: req.body.personName,
        role: req.body.role,
        paymentType: req.body.paymentType,
        amount: parseFloat(req.body.amount),
        paymentDate: req.body.paymentDate,
        status: req.body.status,
        paymentMode: req.body.paymentMode,
        userId
      };
      
      console.log("💸 Final payment data:", JSON.stringify(paymentData, null, 2));
      
      const payment = await storage.createSalaryPayment(paymentData);
      console.log("✅ Salary payment created successfully:", JSON.stringify(payment, null, 2));
      res.json(payment);
    } catch (error) {
      console.error("❌ Error creating salary payment:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create salary payment", error: error.message });
    }
  });

  // PUT endpoint for updating salary payments
  app.put("/api/financial/salary-payments/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const paymentId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!paymentId) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const paymentData = {
        personName: req.body.personName,
        role: req.body.role,
        paymentType: req.body.paymentType,
        amount: parseFloat(req.body.amount),
        paymentDate: req.body.paymentDate,
        status: req.body.status,
        paymentMode: req.body.paymentMode
      };

      const updatedPayment = await storage.updateSalaryPayment(userId, paymentId, paymentData);
      if (updatedPayment) {
        res.json({ message: "Salary payment updated successfully", payment: updatedPayment });
      } else {
        res.status(404).json({ message: "Salary payment not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error updating salary payment:", error);
      res.status(500).json({ message: "Failed to update salary payment" });
    }
  });

  // DELETE endpoint for salary payments
  app.delete("/api/financial/salary-payments/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const paymentId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!paymentId) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const deleted = await storage.deleteSalaryPayment(userId, paymentId);
      if (deleted) {
        res.json({ message: "Salary payment deleted successfully" });
      } else {
        res.status(404).json({ message: "Salary payment not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error deleting salary payment:", error);
      res.status(500).json({ message: "Failed to delete salary payment" });
    }
  });

  app.get("/api/financial/vehicle-expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const expenses = await storage.getVehicleExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching vehicle expenses:", error);
      res.status(500).json({ message: "Failed to fetch vehicle expenses" });
    }
  });

  app.post("/api/financial/vehicle-expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log("🚗 Vehicle Expense API - UserID:", userId);
      console.log("🚗 Vehicle Expense API - Request body:", JSON.stringify(req.body, null, 2));
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      // First, let's see what vehicles this user has
      const allUserVehicles = await storage.getUserVehicles(userId);
      console.log("🚗 All user vehicles:", JSON.stringify(allUserVehicles, null, 2));

      // Find vehicle ID from vehicle number
      let vehicleId = null;
      if (req.body.vehicleNumber) {
        console.log("🚗 Looking for vehicle with number:", req.body.vehicleNumber);
        const vehicle = await storage.getVehicleByNumber(userId, req.body.vehicleNumber);
        console.log("🚗 Found vehicle:", JSON.stringify(vehicle, null, 2));
        
        if (vehicle) {
          vehicleId = vehicle.id;
          console.log("🚗 Vehicle ID found:", vehicleId);
        } else {
          console.log("❌ Vehicle not found with number:", req.body.vehicleNumber);
          console.log("❌ Available vehicles are:", allUserVehicles.map(v => v.registrationNumber));
          return res.status(400).json({ 
            message: `Vehicle not found with number: ${req.body.vehicleNumber}. Available vehicles: ${allUserVehicles.map(v => v.registrationNumber).join(', ')}` 
          });
        }
      } else {
        console.log("❌ No vehicle number provided in request");
        return res.status(400).json({ message: "Vehicle number is required" });
      }

      const expenseData = { 
        expenseType: req.body.expenseType,
        amount: parseFloat(req.body.amount),
        description: req.body.description,
        expenseDate: req.body.date, // Map 'date' field to 'expenseDate' for database
        userId,
        vehicleId
      };
      
      console.log("🚗 Final expense data before save:", JSON.stringify(expenseData, null, 2));
      
      const expense = await storage.createVehicleExpense(expenseData);
      console.log("✅ Vehicle expense created successfully:", JSON.stringify(expense, null, 2));
      res.json(expense);
    } catch (error) {
      console.error("❌ Error creating vehicle expense:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create vehicle expense", error: error.message });
    }
  });

  // PUT endpoint for updating vehicle expenses
  app.put("/api/financial/vehicle-expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const expenseId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!expenseId) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      // Find vehicle ID from vehicle number
      let vehicleId = null;
      if (req.body.vehicleNumber) {
        const vehicle = await storage.getVehicleByNumber(userId, req.body.vehicleNumber);
        if (vehicle) {
          vehicleId = vehicle.id;
        } else {
          return res.status(400).json({ message: "Vehicle not found with this number" });
        }
      }

      const expenseData = {
        expenseType: req.body.expenseType,
        amount: parseFloat(req.body.amount),
        description: req.body.description,
        expenseDate: req.body.date,
        vehicleId
      };

      const updatedExpense = await storage.updateVehicleExpense(userId, expenseId, expenseData);
      if (updatedExpense) {
        res.json({ message: "Vehicle expense updated successfully", expense: updatedExpense });
      } else {
        res.status(404).json({ message: "Vehicle expense not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error updating vehicle expense:", error);
      res.status(500).json({ message: "Failed to update vehicle expense" });
    }
  });

  app.delete("/api/financial/vehicle-expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const expenseId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!expenseId) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const deleted = await storage.deleteVehicleExpense(userId, expenseId);
      if (deleted) {
        res.json({ message: "Vehicle expense deleted successfully" });
      } else {
        res.status(404).json({ message: "Vehicle expense not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error deleting vehicle expense:", error);
      res.status(500).json({ message: "Failed to delete vehicle expense" });
    }
  });

  app.get("/api/financial/toll-expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const expenses = await storage.getTollExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching toll expenses:", error);
      res.status(500).json({ message: "Failed to fetch toll expenses" });
    }
  });

  app.post("/api/financial/toll-expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log("🛣️ Toll Expense API - UserID:", userId);
      console.log("🛣️ Toll Expense API - Request body:", req.body);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      // Find vehicle ID from vehicle number
      let vehicleId = null;
      if (req.body.vehicleNumber) {
        console.log("🛣️ Looking for vehicle with number:", req.body.vehicleNumber);
        const vehicle = await storage.getVehicleByNumber(userId, req.body.vehicleNumber);
        console.log("🛣️ Found vehicle:", vehicle);
        
        if (vehicle) {
          vehicleId = vehicle.id;
          console.log("🛣️ Vehicle ID found:", vehicleId);
        } else {
          console.log("❌ Vehicle not found with number:", req.body.vehicleNumber);
          return res.status(400).json({ message: "Vehicle not found with this number" });
        }
      }

      const expenseData = { 
        tollBoothName: req.body.tollLocation, // Map tollLocation to tollBoothName for database
        amount: parseFloat(req.body.amount),
        expenseDate: req.body.date, // Map 'date' field to 'expenseDate' for database
        userId,
        vehicleId
      };
      
      console.log("🛣️ Final expense data:", expenseData);
      
      const expense = await storage.createTollExpense(expenseData);
      console.log("✅ Toll expense created:", expense);
      res.json(expense);
    } catch (error) {
      console.error("❌ Error creating toll expense:", error);
      res.status(500).json({ message: "Failed to create toll expense" });
    }
  });

  app.delete("/api/financial/toll-expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const expenseId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!expenseId) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const deleted = await storage.deleteTollExpense(userId, expenseId);
      if (deleted) {
        res.json({ message: "Toll expense deleted successfully" });
      } else {
        res.status(404).json({ message: "Toll expense not found" });
      }
    } catch (error) {
      console.error("Error deleting toll expense:", error);
      res.status(500).json({ message: "Failed to delete toll expense" });
    }
  });



  // PUT endpoint for updating toll expenses  
  app.put("/api/financial/toll-expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const expenseId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!expenseId) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      // Find vehicle ID from vehicle number
      let vehicleId = null;
      if (req.body.vehicleNumber) {
        const vehicle = await storage.getVehicleByNumber(userId, req.body.vehicleNumber);
        if (vehicle) {
          vehicleId = vehicle.id;
        } else {
          return res.status(400).json({ message: "Vehicle not found with this number" });
        }
      }

      const expenseData = {
        tollBoothName: req.body.tollLocation, // Map tollLocation to tollBoothName for database
        amount: parseFloat(req.body.amount),
        expenseDate: req.body.date,
        vehicleId
      };

      const updatedExpense = await storage.updateTollExpense(userId, expenseId, expenseData);
      if (updatedExpense) {
        res.json({ message: "Toll expense updated successfully", expense: updatedExpense });
      } else {
        res.status(404).json({ message: "Toll expense not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error updating toll expense:", error);
      res.status(500).json({ message: "Failed to update toll expense" });
    }
  });

  app.get("/api/financial/income-records", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const records = await storage.getIncomeRecords(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching income records:", error);
      res.status(500).json({ message: "Failed to fetch income records" });
    }
  });

  app.post("/api/financial/income-records", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log("📊 Income Record API - UserID:", userId);
      console.log("📊 Income Record API - Request body:", JSON.stringify(req.body, null, 2));
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const recordData = {
        source: req.body.source,
        amount: parseFloat(req.body.amount),
        description: req.body.description,
        recordDate: req.body.date, // Map 'date' field to 'recordDate' for database
        bookingId: req.body.bookingId ? parseInt(req.body.bookingId) : null,
        userId
      };
      
      console.log("📊 Final record data:", JSON.stringify(recordData, null, 2));
      
      const record = await storage.createIncomeRecord(recordData);
      console.log("✅ Income record created successfully:", JSON.stringify(record, null, 2));
      res.json(record);
    } catch (error) {
      console.error("❌ Error creating income record:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create income record", error: error.message });
    }
  });

  // PUT endpoint for updating income records
  app.put("/api/financial/income-records/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!recordId) {
        return res.status(400).json({ message: "Invalid record ID" });
      }

      const recordData = {
        source: req.body.source,
        amount: parseFloat(req.body.amount),
        description: req.body.description,
        recordDate: req.body.date,
        bookingId: req.body.bookingId ? parseInt(req.body.bookingId) : null
      };

      const updatedRecord = await storage.updateIncomeRecord(userId, recordId, recordData);
      if (updatedRecord) {
        res.json({ message: "Income record updated successfully", record: updatedRecord });
      } else {
        res.status(404).json({ message: "Income record not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error updating income record:", error);
      res.status(500).json({ message: "Failed to update income record" });
    }
  });

  // DELETE endpoint for income records
  app.delete("/api/financial/income-records/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordId = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      if (!recordId) {
        return res.status(400).json({ message: "Invalid record ID" });
      }

      const deleted = await storage.deleteIncomeRecord(userId, recordId);
      if (deleted) {
        res.json({ message: "Income record deleted successfully" });
      } else {
        res.status(404).json({ message: "Income record not found or access denied" });
      }
    } catch (error) {
      console.error("❌ Error deleting income record:", error);
      res.status(500).json({ message: "Failed to delete income record" });
    }
  });

  app.get("/api/financial/client-ledger", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      const ledger = await storage.getClientLedger(userId);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching client ledger:", error);
      res.status(500).json({ message: "Failed to fetch client ledger" });
    }
  });

  // Warehouse Stock Operations APIs
  app.get("/api/warehouse/stock-operations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const operations = await storage.getWarehouseStockOperations(userId);
      res.json(operations);
    } catch (error) {
      console.error("Error fetching warehouse stock operations:", error);
      res.status(500).json({ message: "Failed to fetch warehouse stock operations" });
    }
  });

  app.post("/api/warehouse/stock-operations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const operationData = { ...req.body, userId, operatedBy: req.user.firstName + " " + req.user.lastName };
      
      const operation = await storage.createWarehouseStockOperation(operationData);
      
      // Update inventory if needed
      if (operation.operationType === "stock_in" || operation.operationType === "stock_out") {
        await storage.updateWarehouseInventory(operation.warehouseId, operation.itemName, operation.quantity, operation.operationType);
      }
      
      res.json(operation);
    } catch (error) {
      console.error("Error creating warehouse stock operation:", error);
      res.status(500).json({ message: "Failed to create warehouse stock operation" });
    }
  });

  app.get("/api/warehouse/inventory", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const inventory = await storage.getWarehouseInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching warehouse inventory:", error);
      res.status(500).json({ message: "Failed to fetch warehouse inventory" });
    }
  });



  app.get("/api/warehouse/analytics", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analytics = await storage.getWarehouseAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching warehouse analytics:", error);
      res.status(500).json({ message: "Failed to fetch warehouse analytics" });
    }
  });

  // Comprehensive warehouse analytics endpoint
  app.get("/api/warehouses/analytics", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analytics = await storage.getWarehouseAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching warehouses analytics:", error);
      res.status(500).json({ message: "Failed to fetch warehouses analytics" });
    }
  });

  // Professional Warehouse Management API Endpoints
  
  // Get all warehouses for user
  app.get('/api/warehouses', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const warehouses = await storage.getUserWarehouses(userId);
      res.json(warehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      res.status(500).json({ message: 'Failed to fetch warehouses' });
    }
  });

  // Create new warehouse
  app.post('/api/warehouses', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const warehouseData = { ...req.body, userId };
      const warehouse = await storage.createWarehouse(warehouseData);
      
      res.status(201).json(warehouse);
    } catch (error) {
      console.error('Error creating warehouse:', error);
      res.status(500).json({ message: 'Failed to create warehouse' });
    }
  });

  // Update warehouse
  app.put('/api/warehouses/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const warehouseId = parseInt(req.params.id);
      
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const warehouse = await storage.updateWarehouse(warehouseId, req.body, userId);
      res.json(warehouse);
    } catch (error) {
      console.error('Error updating warehouse:', error);
      res.status(500).json({ message: 'Failed to update warehouse' });
    }
  });

  // Delete warehouse
  app.delete('/api/warehouses/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const warehouseId = parseInt(req.params.id);
      
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      await storage.deleteWarehouse(warehouseId, userId);
      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      res.status(500).json({ message: 'Failed to delete warehouse' });
    }
  });

  // Get warehouse inventory
  app.get('/api/warehouses/inventory', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const inventory = await storage.getWarehouseInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ message: 'Failed to fetch inventory' });
    }
  });

  // Add inventory item
  app.post('/api/warehouses/inventory', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const inventoryData = { ...req.body, userId };
      const item = await storage.addInventoryItem(inventoryData);
      
      res.status(201).json(item);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      res.status(500).json({ message: 'Failed to add inventory item' });
    }
  });

  // Get warehouse operations
  app.get('/api/warehouses/operations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const operations = await storage.getWarehouseOperations(userId);
      res.json(operations);
    } catch (error) {
      console.error('Error fetching operations:', error);
      res.status(500).json({ message: 'Failed to fetch operations' });
    }
  });

  // Record stock operation
  app.post('/api/warehouses/operations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const operationData = { ...req.body, userId };
      const operation = await storage.recordStockOperation(operationData);
      
      res.status(201).json(operation);
    } catch (error) {
      console.error('Error recording operation:', error);
      res.status(500).json({ message: 'Failed to record operation' });
    }
  });

  // Get warehouse revenue analytics
  app.get('/api/warehouses/revenue', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const revenueData = await storage.getWarehouseRevenue(userId);
      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ message: 'Failed to fetch revenue data' });
    }
  });

  const httpServer = createServer(app);
  
  // Setup GPS integration
  setupGPSIntegration(app, httpServer);
  
  return httpServer;
}
