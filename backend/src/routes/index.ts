import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "../services/storage";
import { setupAuth, requireAuth } from "../middleware/auth";
import { setupGPSIntegration } from "../services/gpsIntegration";
import { 
  insertWarehouseSchema,
  insertVehicleSchema,
  insertBookingSchema,
  insertTrackingEventSchema,
  insertSubscriptionSchema,
  insertContactSubmissionSchema,
  insertSupportTicketSchema,
  insertTicketResponseSchema,
  insertNotificationSchema
} from "../../../shared/schema";
import { fromZodError } from "zod-validation-error";
import { db } from "../config/database";
import { bookings, users, supportTickets } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(8).toString("hex");
  const buf = (await scryptAsync(password, salt, 16)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Set cache headers early for faster subsequent requests
      res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
      
      const user = await storage.getUser(userId);
      if (!user) {
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
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin Analytics Routes
  app.get("/api/admin/analytics", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

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


  // Admin Bookings Route
  app.get("/api/admin/bookings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const allBookings = await storage.getAllBookings();
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

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
      console.log("🔍 DEBUG: /api/admin/users endpoint called successfully");
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log("📊 Fetching users with trial days calculation...");
      const allUsers = await storage.getAllUsersWithRevenue();
      console.log(`📋 Successfully fetched ${allUsers.length} users with trial data`);
      
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

  // ⛔ Database Routes Removed for Security - SQL Injection Risk

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
      const validationResult = insertWarehouseSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      const warehouse = await storage.updateWarehouse(id, validationResult.data);
      res.json(warehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
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
      const userId = req.user.id;
      
      // Convert capacity to string as the schema expects decimal (string)
      const vehicleData = { 
        ...req.body, 
        userId,
        capacity: req.body.capacity ? req.body.capacity.toString() : undefined
      };
      
      const validationResult = insertVehicleSchema.safeParse(vehicleData);
      
      if (!validationResult.success) {
        console.log("Validation failed:", validationResult.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }

      const vehicle = await storage.createVehicle(validationResult.data);
      res.status(201).json(vehicle);
    } catch (error: any) {
      console.error("Error creating vehicle:", error);
      
      // Check for duplicate registration number error
      if (error.code === '23505' && error.constraint === 'vehicles_registration_number_unique') {
        return res.status(409).json({ 
          message: "Vehicle registration number already exists. Please use a different registration number.",
          error: "DUPLICATE_REGISTRATION" 
        });
      }
      
      res.status(500).json({ message: "Failed to create vehicle" });
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
    try {
      const userId = req.user.id;
      
      // Check user subscription status and trial days
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`🔒 TRIAL CHECK: User ${userId} - Role: ${user.role}, SubscriptionStatus: ${user.subscriptionStatus}`);
      
      // Calculate trial days remaining
      let trialDaysRemaining = 0;
      let isTrialExpired = false;
      
      if (user.trialStartDate) {
        const trialStart = new Date(user.trialStartDate);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - trialStart.getTime()) / (1000 * 3600 * 24));
        trialDaysRemaining = Math.max(0, 14 - daysDiff);
        isTrialExpired = trialDaysRemaining <= 0;
      }
      
      console.log(`🔒 TRIAL CHECK: Trial days remaining: ${trialDaysRemaining}, Is expired: ${isTrialExpired}`);
      
      // Check if user is on trial and trial has expired
      if (user.subscriptionStatus === 'trial' && isTrialExpired) {
        console.log(`🚫 BOOKING BLOCKED: Trial expired for user ${userId}`);
        return res.status(403).json({ 
          message: "Trial expired", 
          code: "TRIAL_EXPIRED",
          description: "Your 14-day trial has expired. Please upgrade to a paid plan to continue creating bookings.",
          trialDaysRemaining: 0,
          requiresSubscription: true
        });
      }
      
      // For office users (agents), check parent user's trial status
      if (user.role === 'office' && user.parentUserId) {
        const parentUser = await storage.getUser(user.parentUserId);
        if (parentUser && parentUser.subscriptionStatus === 'trial') {
          let parentTrialDaysRemaining = 0;
          if (parentUser.trialStartDate) {
            const trialStart = new Date(parentUser.trialStartDate);
            const currentDate = new Date();
            const daysDiff = Math.floor((currentDate.getTime() - trialStart.getTime()) / (1000 * 3600 * 24));
            parentTrialDaysRemaining = Math.max(0, 14 - daysDiff);
          }
          
          console.log(`🔒 AGENT TRIAL CHECK: Parent trial days remaining: ${parentTrialDaysRemaining}`);
          
          if (parentTrialDaysRemaining <= 0) {
            console.log(`🚫 AGENT BOOKING BLOCKED: Parent trial expired for agent ${userId}`);
            return res.status(403).json({ 
              message: "Parent account trial expired", 
              code: "PARENT_TRIAL_EXPIRED",
              description: "Your parent account's 14-day trial has expired. Please ask your account owner to upgrade to a paid plan.",
              trialDaysRemaining: 0,
              requiresSubscription: true
            });
          }
        }
      }
      
      console.log(`✅ BOOKING ALLOWED: User ${userId} can create booking`);
    
      // Generate required fields
      const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Convert and format data types correctly based on schema
      const bookingData = {
        ...req.body,
        userId,
        bookingId,
        vehicleId: parseInt(req.body.vehicleId),
        weight: parseFloat(req.body.weight) || 0,
        distance: parseFloat(req.body.distance) || 0,
        baseRate: req.body.baseRate?.toString() || "0",
        gstAmount: req.body.gstAmount?.toString() || "0", 
        totalAmount: req.body.totalAmount?.toString() || "0",
        itemCount: parseInt(req.body.itemCount) || 1,
        pickupDateTime: req.body.pickupDateTime,
        deliveryDateTime: req.body.deliveryDateTime || null,
        paymentMethod: req.body.paymentMethod || "pending",
        paymentStatus: req.body.paymentStatus || "pending",
        paidAmount: req.body.paidAmount?.toString() || "0",
        transactionId: req.body.transactionId || "",
        paymentNotes: req.body.paymentNotes || "",
        paymentDate: req.body.paymentStatus === 'paid' ? new Date() : null,
        status: "booked" // Set initial status to "booked" instead of "confirmed"
      };
      
      const validationResult = insertBookingSchema.safeParse(bookingData);
      
      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error);
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error)
        });
      }

      const booking = await storage.createBooking(validationResult.data);
      
      // Create initial tracking event
      await storage.createTrackingEvent({
        bookingId: booking.id,
        status: 'booked',
        location: booking.pickupCity,
        notes: 'Booking created successfully'
      });

      // Generate automatic notification for booking creation
      try {
        // Get user information to check if it's an agent
        const bookingUser = await storage.getUser(booking.userId);
        let notificationMessage = `Your booking ${booking.bookingId} from ${booking.pickupCity} to ${booking.deliveryCity} has been created successfully. Amount: ₹${booking.totalAmount}`;
        
        // If user is an agent (office role), add agent information to message
        if (bookingUser && bookingUser.role === 'office' && bookingUser.officeName) {
          notificationMessage = `Agent booking created by ${bookingUser.officeName} (${bookingUser.email}): ${booking.bookingId} from ${booking.pickupCity} to ${booking.deliveryCity}. Amount: ₹${booking.totalAmount}`;
        }

        // Only notify parent user if agent and parent are different
        if (bookingUser && bookingUser.role === 'office' && bookingUser.parentUserId) {
          if (bookingUser.parentUserId !== bookingUser.id) {
            await storage.createNotification({
              userId: bookingUser.parentUserId,
              title: 'Agent Booking Created',
              message: notificationMessage,
              type: 'booking',
              relatedId: booking.id,
              senderUserId: bookingUser.id,
            });
            console.log(`📢 Agent booking notification sent to parent user: ${bookingUser.parentUserId}`);
          }
        } else {
          // If not an agent, notify the booking creator
          await storage.createNotification({
            userId: booking.userId,
            title: 'New Booking Created',
            message: notificationMessage,
            type: 'booking',
            relatedId: booking.id,
            senderUserId: booking.userId,
          });
          console.log(`📢 Booking notification sent to user: ${booking.userId}`);
        }
      } catch (err) {
        console.error('❌ Error creating notification for booking:', err);
      }

      res.status(201).json(booking);
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
      const jsPDF = require('jspdf');
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
        doc.text(`₹${booking.totalAmount || 0}`, 160, yPosition);
        
        yPosition += 8;
      });
      
      // Summary
      const totalRevenue = dailyBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(`Total Revenue: ₹${totalRevenue}`, 20, yPosition);
      
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
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
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
      
      res.json(comprehensiveAnalytics);
    } catch (error) {
      console.error("Error fetching comprehensive analytics:", error);
      res.status(500).json({ message: "Failed to fetch comprehensive analytics" });
    }
  });

  app.get("/api/admin/bookings", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/vehicles", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/admin/support-tickets", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const tickets = await storage.getAllSupportTickets();
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

  // Get specific booking for admin
  app.get("/api/admin/bookings/:bookingId", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { bookingId } = req.params;
      const booking = await storage.getBookingById(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
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
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const submissions = await storage.getContactSubmissions();
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

  const httpServer = createServer(app);
  
  // Setup GPS integration
  setupGPSIntegration(app, httpServer);
  
  return httpServer;
}
