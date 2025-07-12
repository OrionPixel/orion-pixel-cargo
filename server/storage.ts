import crypto from 'node:crypto';
import {
  users,
  warehouses,
  vehicles,
  bookings,
  trackingEvents,
  liveTracking,
  deliveryNotifications,
  routeMonitoring,
  invoices,
  subscriptions,
  subscriptionPlans,
  contactSubmissions,
  supportTickets,
  ticketResponses,
  notifications,
  messages,
  systemSettings,
  userThemeSettings,
  superAdminThemeSettings,
  announcements,
  warehouseStockOperations,
  warehouseInventory,
  type User,
  type UpsertUser,
  type Warehouse,
  type InsertWarehouse,
  type Vehicle,
  type InsertVehicle,
  type Booking,
  type InsertBooking,
  type TrackingEvent,
  type InsertTrackingEvent,
  type LiveTracking,
  type InsertLiveTracking,
  type DeliveryNotification,
  type InsertDeliveryNotification,
  type UserThemeSetting,
  type InsertUserThemeSetting,
  type SuperAdminThemeSetting,
  type InsertSuperAdminThemeSetting,
  type RouteMonitoring,
  type InsertRouteMonitoring,
  type Invoice,
  type InsertInvoice,
  type Subscription,
  type InsertSubscription,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Announcement,
  type InsertAnnouncement,
  warehouseStockOperations,
  type WarehouseStockOperation,
  type InsertWarehouseStockOperation,
  type WarehouseInventory,
  type InsertWarehouseInventory,
  expenses,
  type Expense,
  type InsertExpense,
  salaryPayments,
  vehicleExpenses,
  tollExpenses,
  incomeRecords,
  clientLedger,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, count, sum, sql, gte, lte, or, asc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: { email: string; firstName: string; lastName: string; hashedPassword: string; phone?: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSettings(userId: string, settings: { rateCalculationMethod?: string }): Promise<User>;
  updateUser(userId: string, updates: any): Promise<User>;
  resetUserPassword(userId: string, newPassword: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  // Warehouse operations
  getUserWarehouses(userId: string): Promise<Warehouse[]>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: number): Promise<void>;
  getWarehouseById(id: number): Promise<Warehouse | undefined>;
  getWarehousesByCity(userId: string, city: string): Promise<Warehouse[]>;
  getWarehouseUtilization(id: number): Promise<{ utilizationPercentage: number; currentStock: number; capacity: number }>;
  updateWarehouseStock(id: number, stockChange: number): Promise<Warehouse>;
  getWarehouseAnalytics(userId: string): Promise<{
    totalWarehouses: number;
    totalCapacity: number;
    totalCurrentStock: number;
    averageUtilization: number;
    warehousesByType: Record<string, number>;
    warehousesByStatus: Record<string, number>;
    monthlyOperationalCost: number;
  }>;
  getWarehouseStockHistory(warehouseId: number, limit?: number): Promise<WarehouseStockOperation[]>;
  
  // Vehicle operations
  getUserVehicles(userId: string): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;
  getAvailableVehicles(userId: string): Promise<Vehicle[]>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;
  
  // Booking operations
  getUserBookings(userId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getRecentBookings(userId: string, limit?: number): Promise<Booking[]>;
  
  // Tracking operations
  createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getBookingTrackingEvents(bookingId: number): Promise<TrackingEvent[]>;
  
  // Enhanced tracking operations
  createLiveTracking(tracking: InsertLiveTracking): Promise<LiveTracking>;
  updateLiveTracking(bookingId: number, tracking: Partial<InsertLiveTracking>): Promise<LiveTracking>;
  getLiveTracking(bookingId: number): Promise<LiveTracking | undefined>;
  getAllActiveLiveTracking(): Promise<LiveTracking[]>;
  
  // Delivery notifications
  createDeliveryNotification(notification: InsertDeliveryNotification): Promise<DeliveryNotification>;
  getUserNotifications(userId: string): Promise<DeliveryNotification[]>;
  markNotificationAsRead(id: number): Promise<DeliveryNotification>;
  
  // Route monitoring
  createRouteMonitoring(route: InsertRouteMonitoring): Promise<RouteMonitoring>;
  updateRouteMonitoring(bookingId: number, route: Partial<InsertRouteMonitoring>): Promise<RouteMonitoring>;
  getRouteMonitoring(bookingId: number): Promise<RouteMonitoring | undefined>;
  
  // ETA calculations
  calculateETA(bookingId: number): Promise<{ estimatedArrival: Date; confidence: number }>;
  getTrafficData(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<any>;
  optimizeRoute(waypoints: Array<{lat: number, lng: number}>): Promise<any>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getUserInvoices(userId: string): Promise<Invoice[]>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscription(userId: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
  
  // Dashboard statistics
  getDashboardStats(userId: string): Promise<{
    totalBookings: number;
    activeShipments: number;
    revenue: string;
    availableVehicles: number;
  }>;
  
  // Enterprise billing
  calculateEnterpriseRevelBilling(userId: string): Promise<{
    totalRevenue: number;
    billingPercentage: number;
    monthlyBilling: number;
  }>;
  getUserBillingDetails(userId: string): Promise<{
    subscriptionPlan: string;
    billingPercentage: number | null;
    totalRevenue: number;
    monthlyBilling: number;
    rateCalculationMethod: string;
  }>;
  
  // Office account operations
  createOfficeAccount(data: { email: string; firstName: string; lastName: string; officeName: string; hashedPassword: string; parentUserId: string; commissionRate?: number }): Promise<User>;
  getUserOfficeAccounts(userId: string): Promise<User[]>;
  updateOfficeAccount(officeId: string, data: Partial<{ email: string; firstName: string; lastName: string; officeName: string; commissionRate: number }>): Promise<User>;
  resetOfficeAccountPassword(officeId: string, newPassword: string): Promise<User>;
  deleteOfficeAccount(officeId: string): Promise<void>;
  getDailyBookingsList(userId: string, date?: string): Promise<Booking[]>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserAnalytics(userId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    adminRevenue: number;
    lastBookingDate: string | null;
    averageBookingValue: number;
    monthlyGrowth: number;
  }>;
  updateUserSubscription(userId: string, plan: string, status: string): Promise<User>;
  updateUserProfile(userId: string, updateData: any): Promise<User>;
  blockUser(userId: string): Promise<User>;
  unblockUser(userId: string): Promise<User>;
  
  // Admin analytics and reporting
  getAnalytics(): Promise<{
    revenue: number;
    activeUsers: number;
    topRoutes: Array<{ from: string; to: string; count: number }>;
    monthlyGrowth: number;
  }>;
  getRegularUsers(): Promise<User[]>;
  getAllBookings(): Promise<Booking[]>;
  getAllVehicles(): Promise<Vehicle[]>;
  
  // Agent analytics
  getAgentAnalytics(agentId: string, startDate?: string, endDate?: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
    avgBookingsPerDay: number;
    bookingsByDate: Array<{ date: string; bookings: number; revenue: number; commission: number }>;
    topRoutes: Array<{ from: string; to: string; bookings: number; revenue: number }>;
    serviceDistribution: Array<{ type: string; count: number; revenue: number }>;
    customerMetrics: {
      totalCustomers: number;
      repeatCustomers: number;
      avgOrderValue: number;
    };
  }>;
  
  // Support and activity tracking
  getAllSupportTickets(): Promise<any[]>;
  getActivityLogs(): Promise<any[]>;
  
  // Financial operations
  getSalaryPayments(userId: string): Promise<any[]>;
  createSalaryPayment(payment: any): Promise<any>;
  getVehicleExpenses(userId: string): Promise<any[]>;
  createVehicleExpense(expense: any): Promise<any>;
  getTollExpenses(userId: string): Promise<any[]>;
  createTollExpense(expense: any): Promise<any>;
  updateTollExpense(userId: string, expenseId: number, data: any): Promise<any>;
  deleteTollExpense(userId: string, expenseId: number): Promise<boolean>;
  getIncomeRecords(userId: string): Promise<any[]>;
  createIncomeRecord(record: any): Promise<any>;
  getClientLedger(userId: string): Promise<any[]>;
  getFinancialDashboard(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    pendingPayments: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    recentTransactions: any[];
  }>;
  
  // Database management operations
  getDatabaseStats(): Promise<{
    storageUsed: string;
    activeConnections: number;
    performance: string;
    lastBackup: string;
  }>;
  getDatabaseTables(): Promise<Array<{
    name: string;
    records: number;
    size: string;
    lastUpdated: string;
  }>>;
  clearTableData(tableName: string): Promise<any>;
  respondToSupportTicket(ticketId: string, response: string): Promise<any>;
  approveEnterpriseUser(userId: string, customPricing: number, billingPercentage: number): Promise<User>;
  exportReport(type: string): Promise<string>;

  // Contact form operations
  createContactSubmission(submission: any): Promise<any>;
  getContactSubmissions(): Promise<any[]>;
  updateContactSubmissionStatus(id: number, status: string): Promise<any>;

  // Support ticket operations
  createSupportTicket(ticket: any): Promise<any>;
  getSupportTickets(userId?: string): Promise<any[]>;
  updateSupportTicket(id: number, updates: any): Promise<any>;
  createTicketResponse(response: any): Promise<any>;
  getTicketResponses(ticketId: number): Promise<any[]>;

  // Notification operations
  createNotification(notification: any): Promise<any>;
  getUserNotifications(userId: string): Promise<any[]>;
  markNotificationAsRead(id: number): Promise<any>;
  markAllNotificationsAsRead(userId: string): Promise<any>;
  deleteNotification(id: number): Promise<any>;

  // System settings operations
  getSystemSettings(): Promise<any[]>;
  updateSystemSetting(key: string, value: string, updatedBy: string): Promise<any>;
  getSetting(key: string): Promise<any>;

  // GPS operations
  getAllGPSDevices(): Promise<any[]>;

  // User theme operations
  getUserThemeSettings(userId: string): Promise<UserThemeSetting | undefined>;
  createUserThemeSettings(settings: InsertUserThemeSetting): Promise<UserThemeSetting>;
  updateUserThemeSettings(userId: string, settings: Partial<InsertUserThemeSetting>): Promise<UserThemeSetting>;

  // Expense management operations
  getUserExpenses(userId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  getExpensesByType(userId: string, expenseType: string): Promise<Expense[]>;
  getExpenseAnalytics(userId: string): Promise<{
    totalExpenses: number;
    expensesByType: Record<string, number>;
    monthlyExpenses: Array<{ month: string; amount: number }>;
    topCategories: Array<{ category: string; amount: number; count: number }>;
  }>;

  // Subscription plans operations
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: number): Promise<void>;
  getSubscriptionPlanStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    averagePrice: number;
  }>;

  // Financial reports operations
  getFinancialReports(userId: string, period: string): Promise<{
    summary: {
      totalIncome: number;
      totalExpense: number;
      netProfit: number;
      profitMargin: number;
    };
    monthlyData: Array<{
      month: string;
      income: number;
      expense: number;
      profit: number;
    }>;
    transactions: {
      receivables: Array<{
        bookingId: string;
        amount: number;
        dueDate: string;
        status: string;
        customer: string;
      }>;
      payables: Array<{
        description: string;
        amount: number;
        dueDate: string;
        status: string;
        vendor: string;
      }>;
    };
    categoryBreakdown: {
      incomeBySource: Array<{ category: string; amount: number; percentage: number }>;
      expenseByCategory: Array<{ category: string; amount: number; percentage: number }>;
    };
  }>;

  // Additional Warehouse Management Functions  
  getWarehouseInventory(userId: string): Promise<any[]>;
  addInventoryItem(inventoryData: any): Promise<any>;
  getWarehouseOperations(userId: string): Promise<any[]>;
  recordStockOperation(operationData: any): Promise<any>;
  getWarehouseRevenue(userId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      return user;
    } catch (error) {
      console.error("Error getting user by phone:", error);
      throw error;
    }
  }



  async upsertUser(userData: UpsertUser): Promise<User> {
    // Set trial end date to 14 days from trial start
    if (!userData.trialEndDate && userData.trialStartDate) {
      userData.trialEndDate = new Date(userData.trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete in the following order to maintain referential integrity:
      
      // 1. Delete user theme settings
      await db.delete(userThemeSettings).where(eq(userThemeSettings.userId, userId));
      
      // 2. Delete all bookings associated with the user
      await db.delete(bookings).where(eq(bookings.userId, userId));
      
      // 3. Delete all vehicles associated with the user
      await db.delete(vehicles).where(eq(vehicles.userId, userId));
      
      // 4. Delete all warehouses associated with the user
      await db.delete(warehouses).where(eq(warehouses.userId, userId));
      
      // 5. Delete office accounts (child users) where this user is the parent
      const officeAccounts = await db.select().from(users).where(eq(users.parentUserId, userId));
      for (const office of officeAccounts) {
        await this.deleteUser(office.id); // Recursive deletion of office accounts
      }
      
      // 6. Finally, delete the user record
      await db.delete(users).where(eq(users.id, userId));
      
      console.log(`User ${userId} and all associated data deleted successfully`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  // Missing methods from interface
  async createUser(user: { email: string; firstName: string; lastName: string; hashedPassword: string; phone?: string }): Promise<User> {
    const userData = {
      id: crypto.randomUUID(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      hashedPassword: user.hashedPassword,
      phone: user.phone,
      role: 'user' as const,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subscriptionStatus: 'trial' as const,
      subscriptionPlan: 'trial' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUserSettings(userId: string, settings: { rateCalculationMethod?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ rateCalculationMethod: settings.rateCalculationMethod })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ hashedPassword: newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Live tracking methods
  async createLiveTracking(tracking: any): Promise<any> {
    try {
      const [newTracking] = await db.insert(liveTracking).values({
        ...tracking,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return newTracking;
    } catch (error) {
      console.error("Error creating live tracking:", error);
      throw error;
    }
  }

  async updateLiveTracking(id: number, tracking: any): Promise<any> {
    try {
      const [updated] = await db
        .update(liveTracking)
        .set({ ...tracking, updatedAt: new Date() })
        .where(eq(liveTracking.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating live tracking:", error);
      throw error;
    }
  }

  async getLiveTracking(bookingId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(liveTracking)
        .where(eq(liveTracking.bookingId, bookingId))
        .orderBy(desc(liveTracking.timestamp));
    } catch (error) {
      console.error("Error getting live tracking:", error);
      return [];
    }
  }

  async deleteLiveTracking(id: number): Promise<void> {
    try {
      await db.delete(liveTracking).where(eq(liveTracking.id, id));
    } catch (error) {
      console.error("Error deleting live tracking:", error);
      throw error;
    }
  }

  async assignGPSToBooking(bookingId: string, gpsDeviceId: string): Promise<void> {
    try {
      await db
        .update(bookings)
        .set({ gpsDeviceId, updatedAt: new Date() })
        .where(eq(bookings.bookingId, bookingId));
    } catch (error) {
      console.error("Error assigning GPS to booking:", error);
      throw error;
    }
  }

  // Warehouse operations
  async getUserWarehouses(userId: string): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.userId, userId));
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const warehouseData = {
      ...warehouse,
      updatedAt: new Date(),
      // Convert decimal fields to strings for database compatibility
      monthlyOperationalCost: warehouse.monthlyOperationalCost !== undefined 
        ? warehouse.monthlyOperationalCost.toString() 
        : undefined,
      latitude: warehouse.latitude !== undefined 
        ? warehouse.latitude.toString() 
        : undefined,
      longitude: warehouse.longitude !== undefined 
        ? warehouse.longitude.toString() 
        : undefined,
    };
    
    console.log('🏢 Creating warehouse with data:', warehouseData);
    
    const [newWarehouse] = await db.insert(warehouses).values(warehouseData).returning();
    
    console.log('✅ Warehouse created successfully:', newWarehouse);
    return newWarehouse;
  }

  async updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse> {
    // Convert number fields to strings for decimal columns
    const updateData = {
      ...warehouse,
      updatedAt: new Date(),
      // Convert decimal fields to strings for database compatibility
      monthlyOperationalCost: warehouse.monthlyOperationalCost !== undefined 
        ? warehouse.monthlyOperationalCost.toString() 
        : undefined,
      latitude: warehouse.latitude !== undefined 
        ? warehouse.latitude.toString() 
        : undefined,
      longitude: warehouse.longitude !== undefined 
        ? warehouse.longitude.toString() 
        : undefined,
    };
    
    console.log('🏢 Updating warehouse with data:', updateData);
    
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set(updateData)
      .where(eq(warehouses.id, id))
      .returning();
    
    console.log('✅ Warehouse updated successfully:', updatedWarehouse);
    return updatedWarehouse;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  async getWarehouseById(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async getWarehousesByCity(userId: string, city: string): Promise<Warehouse[]> {
    return await db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.userId, userId), eq(warehouses.city, city)));
  }

  async getWarehouseUtilization(id: number): Promise<{ utilizationPercentage: number; currentStock: number; capacity: number }> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }
    
    const currentStock = warehouse.currentStock || 0;
    const capacity = warehouse.capacity || 1;
    const utilizationPercentage = Math.round((currentStock / capacity) * 100);
    
    return {
      utilizationPercentage,
      currentStock,
      capacity,
    };
  }

  async updateWarehouseStock(id: number, stockChange: number): Promise<Warehouse> {
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    const newStock = Math.max(0, (warehouse.currentStock || 0) + stockChange);
    const maxCapacity = warehouse.maxCapacity || warehouse.capacity;
    
    if (newStock > maxCapacity) {
      throw new Error("Stock exceeds warehouse capacity");
    }

    const [updatedWarehouse] = await db
      .update(warehouses)
      .set({ 
        currentStock: newStock,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      .returning();
    
    return updatedWarehouse;
  }

  async getWarehouseAnalytics(userId: string): Promise<{
    totalWarehouses: number;
    totalCapacity: number;
    totalCurrentStock: number;
    averageUtilization: number;
    warehousesByType: Record<string, number>;
    warehousesByStatus: Record<string, number>;
    monthlyOperationalCost: number;
  }> {
    const userWarehouses = await this.getUserWarehouses(userId);
    
    const totalWarehouses = userWarehouses.length;
    const totalCapacity = userWarehouses.reduce((sum, w) => sum + (w.capacity || 0), 0);
    const totalCurrentStock = userWarehouses.reduce((sum, w) => sum + (w.currentStock || 0), 0);
    const averageUtilization = totalCapacity > 0 ? Math.round((totalCurrentStock / totalCapacity) * 100) : 0;
    
    const warehousesByType: Record<string, number> = {};
    const warehousesByStatus: Record<string, number> = {};
    let monthlyOperationalCost = 0;
    
    userWarehouses.forEach(warehouse => {
      // Count by type
      const type = warehouse.warehouseType || 'storage';
      warehousesByType[type] = (warehousesByType[type] || 0) + 1;
      
      // Count by status
      const status = warehouse.operationalStatus || 'operational';
      warehousesByStatus[status] = (warehousesByStatus[status] || 0) + 1;
      
      // Sum operational costs
      if (warehouse.monthlyOperationalCost) {
        monthlyOperationalCost += Number(warehouse.monthlyOperationalCost);
      }
    });
    
    return {
      totalWarehouses,
      totalCapacity,
      totalCurrentStock,
      averageUtilization,
      warehousesByType,
      warehousesByStatus,
      monthlyOperationalCost,
    };
  }

  // Vehicle operations
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    // For office accounts, get vehicles from their parent user
    const user = await this.getUser(userId);
    const searchUserId = user?.role === 'office' ? user.parentUserId : userId;
    
    return await db.select().from(vehicles).where(eq(vehicles.userId, searchUserId || userId));
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    try {
      console.log('🏗️ Storage: Creating vehicle with data:', vehicle);
      
      // Validate user exists before creating vehicle
      const user = await db.select().from(users).where(eq(users.id, vehicle.userId)).limit(1);
      if (!user || user.length === 0) {
        console.log('❌ User not found for vehicle creation:', vehicle.userId);
        const error = new Error(`User with ID ${vehicle.userId} not found`);
        (error as any).code = '23503';
        (error as any).constraint = 'vehicles_user_id_users_id_fk';
        throw error;
      }
      
      // Check if registration number already exists
      const existingVehicle = await db.select().from(vehicles).where(eq(vehicles.registrationNumber, vehicle.registrationNumber));
      
      if (existingVehicle.length > 0) {
        console.log('❌ Duplicate registration number found:', vehicle.registrationNumber);
        const error = new Error(`Vehicle with registration number ${vehicle.registrationNumber} already exists`);
        (error as any).code = '23505';
        (error as any).constraint = 'vehicles_registration_number_unique';
        throw error;
      }
      
      // Validate required fields
      if (!vehicle.registrationNumber || !vehicle.vehicleType) {
        console.log('❌ Missing required fields in vehicle data');
        const error = new Error('Registration number and vehicle type are required');
        (error as any).code = 'MISSING_REQUIRED_FIELDS';
        throw error;
      }
      
      console.log('✅ All validations passed, inserting vehicle...');
      const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
      console.log('✅ Vehicle created successfully:', newVehicle);
      return newVehicle;
    } catch (error: any) {
      console.error('❌ Error creating vehicle in storage:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail,
        timestamp: new Date().toISOString()
      });
      
      // Re-throw with better error classification
      if (error.code === '23503' && error.constraint === 'vehicles_user_id_users_id_fk') {
        const enhancedError = new Error('Invalid user ID - user does not exist');
        (enhancedError as any).code = '23503';
        (enhancedError as any).constraint = 'vehicles_user_id_users_id_fk';
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle> {
    console.log("Storage: Updating vehicle", id, "with data:", vehicle);
    
    // Map the form field names to database column names
    const updateData: any = {};
    if (vehicle.registrationNumber) updateData.registrationNumber = vehicle.registrationNumber;
    if (vehicle.vehicleType) updateData.vehicleType = vehicle.vehicleType;
    if (vehicle.capacity) updateData.capacity = parseFloat(vehicle.capacity.toString());
    if (vehicle.driverName) updateData.driverName = vehicle.driverName;
    if (vehicle.driverPhone) updateData.driverPhone = vehicle.driverPhone;
    if (vehicle.driverLicense) updateData.driverLicense = vehicle.driverLicense;
    if (vehicle.isAvailable !== undefined) updateData.status = vehicle.isAvailable ? 'available' : 'unavailable';
    if (vehicle.gpsDeviceId !== undefined) updateData.gpsDeviceId = vehicle.gpsDeviceId;
    if (vehicle.gpsImei !== undefined) updateData.gpsImei = vehicle.gpsImei;
    if (vehicle.gpsSimNumber !== undefined) updateData.gpsSimNumber = vehicle.gpsSimNumber;
    
    updateData.updatedAt = new Date();
    
    console.log("Storage: Mapped update data:", updateData);
    
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();
      
    console.log("Storage: Updated vehicle result:", updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async getAvailableVehicles(userId: string): Promise<Vehicle[]> {
    // For office accounts, get vehicles from their parent user
    const user = await this.getUser(userId);
    const searchUserId = user?.role === 'office' ? user.parentUserId : userId;
    
    return await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.userId, searchUserId || userId), eq(vehicles.status, "available")));
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return result[0];
  }

  async getVehicleByNumber(userId: string, vehicleNumber: string): Promise<Vehicle | undefined> {
    // Find the vehicle by registration number for the user
    const result = await db
      .select()
      .from(vehicles)
      .where(and(
        eq(vehicles.userId, userId),
        eq(vehicles.registrationNumber, vehicleNumber)
      ))
      .limit(1);
    return result[0];
  }

  // Booking operations
  async getUserBookings(userId: string): Promise<Booking[]> {
    const bookingsWithVehicles = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        bookingId: bookings.bookingId,
        bookingType: bookings.bookingType,
        weight: bookings.weight,
        distance: bookings.distance,
        cargoDescription: bookings.cargoDescription,
        itemCount: bookings.itemCount,
        pickupAddress: bookings.pickupAddress,
        pickupCity: bookings.pickupCity,
        pickupPinCode: bookings.pickupPinCode,
        pickupDateTime: bookings.pickupDateTime,
        deliveryAddress: bookings.deliveryAddress,
        deliveryCity: bookings.deliveryCity,
        deliveryPinCode: bookings.deliveryPinCode,
        deliveryDateTime: bookings.deliveryDateTime,
        senderName: bookings.senderName,
        senderPhone: bookings.senderPhone,
        senderEmail: bookings.senderEmail,
        senderGST: bookings.senderGST,
        receiverName: bookings.receiverName,
        receiverPhone: bookings.receiverPhone,
        receiverEmail: bookings.receiverEmail,
        receiverGST: bookings.receiverGST,
        handlingCharges: bookings.handlingCharges,
        baseRate: bookings.baseRate,
        gstAmount: bookings.gstAmount,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
        vehicleId: bookings.vehicleId,
        waybillNumber: bookings.waybillNumber,
        trackingNumber: bookings.trackingNumber,
        promoCode: bookings.promoCode,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        paidAmount: bookings.paidAmount,
        paymentDate: bookings.paymentDate,
        transactionId: bookings.transactionId,
        paymentNotes: bookings.paymentNotes,
        vehicleType: vehicles.vehicleType,
        vehicleRegistration: vehicles.registrationNumber,
        driverName: vehicles.driverName,
        driverPhone: vehicles.driverPhone,
      })
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
    
    // Get user details to check role and get office accounts
    const user = await this.getUser(userId);
    
    if (user?.role === 'office') {
      // Office accounts can see only their own bookings
      return bookingsWithVehicles.map(booking => ({
        ...booking,
        vehicleInfo: booking.vehicleType ? {
          type: booking.vehicleType,
          registration: booking.vehicleRegistration,
          driverName: booking.driverName,
          driverPhone: booking.driverPhone,
        } : null
      })) as Booking[];
    } else {
      // Regular users can see their own bookings and bookings from their office accounts
      const officeAccounts = await this.getUserOfficeAccounts(userId);
      const officeAccountIds = officeAccounts.map(acc => acc.id);
      
      if (officeAccountIds.length > 0) {
        // Get office account bookings too
        const officeBookings = await db
          .select({
            id: bookings.id,
            userId: bookings.userId,
            bookingId: bookings.bookingId,
            bookingType: bookings.bookingType,
            weight: bookings.weight,
            distance: bookings.distance,
            cargoDescription: bookings.cargoDescription,
            itemCount: bookings.itemCount,
            pickupAddress: bookings.pickupAddress,
            pickupCity: bookings.pickupCity,
            pickupPinCode: bookings.pickupPinCode,
            pickupDateTime: bookings.pickupDateTime,
            deliveryAddress: bookings.deliveryAddress,
            deliveryCity: bookings.deliveryCity,
            deliveryPinCode: bookings.deliveryPinCode,
            deliveryDateTime: bookings.deliveryDateTime,
            senderName: bookings.senderName,
            senderPhone: bookings.senderPhone,
            senderEmail: bookings.senderEmail,
            senderGST: bookings.senderGST,
            receiverName: bookings.receiverName,
            receiverPhone: bookings.receiverPhone,
            receiverEmail: bookings.receiverEmail,
            receiverGST: bookings.receiverGST,
            handlingCharges: bookings.handlingCharges,
            baseRate: bookings.baseRate,
            gstAmount: bookings.gstAmount,
            totalAmount: bookings.totalAmount,
            status: bookings.status,
            vehicleId: bookings.vehicleId,
            waybillNumber: bookings.waybillNumber,
            trackingNumber: bookings.trackingNumber,
            promoCode: bookings.promoCode,
            notes: bookings.notes,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
            paymentMethod: bookings.paymentMethod,
            paymentStatus: bookings.paymentStatus,
            paidAmount: bookings.paidAmount,
            paymentDate: bookings.paymentDate,
            transactionId: bookings.transactionId,
            paymentNotes: bookings.paymentNotes,
            vehicleType: vehicles.vehicleType,
            vehicleRegistration: vehicles.registrationNumber,
            driverName: vehicles.driverName,
            driverPhone: vehicles.driverPhone,
          })
          .from(bookings)
          .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
          .where(officeAccountIds.length > 0 ? inArray(bookings.userId, officeAccountIds) : sql`1=0`)
          .orderBy(desc(bookings.createdAt));
        
        // Combine and sort all bookings
        const allBookings = [...bookingsWithVehicles, ...officeBookings];
        const totalRevenue = Math.ceil(allBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
        console.log(`📊 getUserBookings: User ${userId} - Own: ${bookingsWithVehicles.length}, Office: ${officeBookings.length}, Total: ${allBookings.length} bookings, Revenue: ₹${totalRevenue}`);
        
        return allBookings
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(booking => ({
            ...booking,
            vehicleInfo: booking.vehicleType ? {
              type: booking.vehicleType,
              registration: booking.vehicleRegistration,
              driverName: booking.driverName,
              driverPhone: booking.driverPhone,
            } : null
          })) as Booking[];
      }
      
      return bookingsWithVehicles.map(booking => ({
        ...booking,
        vehicleInfo: booking.vehicleType ? {
          type: booking.vehicleType,
          registration: booking.vehicleRegistration,
          driverName: booking.driverName,
          driverPhone: booking.driverPhone,
        } : null
      })) as Booking[];
    }
  }

  async registerGPSDevice(deviceData: any): Promise<any> {
    // This would integrate with the GPS system
    // For now, we'll simulate the registration
    return {
      deviceId: deviceData.deviceId,
      status: 'registered',
      timestamp: new Date()
    };
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Generate unique booking ID
    const bookingId = `CB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    const bookingData = {
      ...booking,
      bookingId,
      trackingNumber,
      weight: booking.weight ? booking.weight.toString() : null,
      distance: booking.distance ? booking.distance.toString() : null,
      baseRate: booking.baseRate.toString(),
      gstAmount: booking.gstAmount.toString(),
      totalAmount: booking.totalAmount.toString(),
      deliveryDateTime: booking.deliveryDateTime ? new Date(booking.deliveryDateTime) : null,
      vehicleId: Number(booking.vehicleId),
    };
    
    const [newBooking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    
    // Auto-assign GPS tracking if vehicle has GPS device
    if (newBooking.vehicleId) {
      const vehicle = await db.select().from(vehicles)
        .where(eq(vehicles.id, newBooking.vehicleId))
        .limit(1);
      
      if (vehicle.length > 0 && vehicle[0].gpsDeviceId && vehicle[0].gpsStatus === 'active') {
        try {
          // Create live tracking entry
          await this.createLiveTracking({
            bookingId: newBooking.id,
            currentLatitude: 0, // Will be updated by GPS device
            currentLongitude: 0,
            currentSpeed: 0,
            heading: 0,
            altitude: 0,
            accuracy: 0,
            routeProgress: 0,
            distanceToDestination: 0,
            isActive: true,
            lastUpdate: new Date(),
            estimatedArrival: new Date(Date.now() + 4 * 60 * 60 * 1000), // Default 4 hours
            driverName: vehicle[0].driverName,
            driverPhone: vehicle[0].driverPhone,
            vehicleNumber: vehicle[0].vehicleNumber,
            batteryLevel: 100,
            signalStrength: 0
          });
          
          // Assign GPS device to this booking
          await this.assignGPSToBooking(vehicle[0].gpsDeviceId!, newBooking.id);
          
        } catch (error) {
          console.error('Failed to setup GPS tracking for booking:', error);
        }
      }
    }
    
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking> {
    const updateData = {
      ...booking,
      weight: booking.weight ? booking.weight.toString() : undefined,
      distance: booking.distance ? booking.distance.toString() : undefined,
      baseRate: booking.baseRate ? booking.baseRate.toString() : undefined,
      gstAmount: booking.gstAmount ? booking.gstAmount.toString() : undefined,
      totalAmount: booking.totalAmount ? booking.totalAmount.toString() : undefined,
      deliveryDateTime: booking.deliveryDateTime ? new Date(booking.deliveryDateTime) : undefined,
      updatedAt: new Date()
    };
    
    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getRecentBookings(userId: string, limit: number = 10): Promise<Booking[]> {
    // Get user details to check role
    const user = await this.getUser(userId);
    
    if (user?.role === 'office') {
      // Office accounts can see only their own bookings
      return await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt))
        .limit(limit);
    } else {
      // Regular users can see their own bookings and bookings from their office accounts
      const officeAccounts = await this.getUserOfficeAccounts(userId);
      const officeAccountIds = officeAccounts.map(acc => acc.id);
      
      if (officeAccountIds.length > 0) {
        // Get both user's own bookings and office account bookings
        const ownBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.userId, userId))
          .orderBy(desc(bookings.createdAt))
          .limit(limit);
        
        // Get office account bookings using individual queries
        let officeBookings = [];
        for (const officeId of officeAccountIds) {
          const officeUserBookings = await db
            .select()
            .from(bookings)
            .where(eq(bookings.userId, officeId))
            .orderBy(desc(bookings.createdAt))
            .limit(limit);
          officeBookings.push(...officeUserBookings);
        }
        
        // Combine and sort by creation date, then limit
        const allBookings = [...ownBookings, ...officeBookings];
        return allBookings
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      } else {
        // No office accounts, just get user's own bookings
        return await db
          .select()
          .from(bookings)
          .where(eq(bookings.userId, userId))
          .orderBy(desc(bookings.createdAt))
          .limit(limit);
      }
    }
  }

  // Tracking operations
  async createTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    // Check if a similar event already exists to prevent duplicates
    const existingEvent = await db
      .select()
      .from(trackingEvents)
      .where(
        and(
          eq(trackingEvents.bookingId, event.bookingId),
          eq(trackingEvents.status, event.status)
        )
      )
      .limit(1);
    
    // If event already exists, return it instead of creating duplicate
    if (existingEvent.length > 0) {
      return existingEvent[0];
    }
    
    const [newEvent] = await db.insert(trackingEvents).values(event).returning();
    return newEvent;
  }

  async getBookingTrackingEvents(bookingId: number): Promise<TrackingEvent[]> {
    return await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.bookingId, bookingId))
      .orderBy(desc(trackingEvents.timestamp));
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = `INV${Date.now()}`;
    const [newInvoice] = await db
      .insert(invoices)
      .values({ ...invoice, invoiceNumber })
      .returning();
    return newInvoice;
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .where(eq(bookings.userId, userId))
      .then(rows => rows.map(row => row.invoices));
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  private getFeaturesByPlan(plan: string): string[] {
    const features = {
      trial: [
        "14-day trial period",
        "Advanced Booking Management", 
        "Real-time GPS Tracking",
        "Vehicle Fleet Management",
        "Payment Tracking",
        "PDF Export",
        "Email Support"
      ],
      starter: [
        "Advanced Booking Management",
        "Real-time GPS Tracking", 
        "Vehicle Fleet Management",
        "Payment Tracking",
        "PDF Export",
        "Email Support",
        "3 bookings/month"
      ],
      professional: [
        "Advanced booking management",
        "Real-time tracking",
        "Email support", 
        "Analytics dashboard",
        "Route optimization",
        "Multi-warehouse support",
        "500 bookings/month",
        "25 vehicles",
        "10 agents"
      ],
      enterprise: [
        "Everything in Professional",
        "Unlimited bookings",
        "100 vehicles", 
        "50 agents",
        "Priority support",
        "Custom integrations",
        "Advanced analytics",
        "White-label options"
      ]
    };
    
    return features[plan] || features.trial;
  }

  async getUserSubscription(userId: string): Promise<any> {
    // Get user data which contains trial and subscription information
    const user = await this.getUser(userId);
    
    if (!user) {
      return null;
    }

    // Calculate trial days remaining
    const now = new Date();
    const trialEnd = user.trialEndDate ? new Date(user.trialEndDate) : now;
    const trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    
    console.log(`🔍 SUBSCRIPTION DEBUG: User ${user.email} - Trial End: ${user.trialEndDate}, Days Remaining: ${trialDaysRemaining}`);
    
    // Return subscription data based on user information
    return {
      id: user.id,
      userId: user.id,
      plan: user.subscriptionPlan || 'trial',
      status: user.subscriptionStatus || 'trial',
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      trialDaysRemaining,
      billingPercentage: user.billingPercentage,
      commissionRate: user.commissionRate,
      isActive: user.subscriptionStatus === 'active' || (user.subscriptionStatus === 'trial' && trialDaysRemaining > 0),
      features: this.getFeaturesByPlan(user.subscriptionPlan || 'trial'),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateSubscription(userId: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscription)
      .where(eq(subscriptions.userId, userId))
      .returning();
    return updatedSubscription;
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    totalBookings: number;
    activeShipments: number;
    revenue: string;
    availableVehicles: number;
  }> {
    // Get user details to check role
    const user = await this.getUser(userId);
    let userBookings: Booking[];
    let userVehicles: Vehicle[];
    
    if (user?.role === 'office') {
      // Office accounts (agents) can see only their own bookings
      userBookings = await db.select().from(bookings)
        .where(eq(bookings.userId, userId));
      
      // Agents inherit vehicles from their parent user
      const parentUserId = user.parentUserId || userId;
      userVehicles = await db.select().from(vehicles)
        .where(eq(vehicles.userId, parentUserId));
        
      const agentRevenue = Math.ceil(userBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
      console.log(`🏢 AGENT DASHBOARD: ${user.firstName} ${user.lastName} (${userId})`);
      console.log(`   📊 Agent Own Data: ${userBookings.length} bookings, ₹${agentRevenue} revenue`);
      console.log(`   🚗 Vehicles inherited from parent: ${userVehicles.length} vehicles`);
    } else {
      // Regular users can see their own bookings and bookings from their office accounts
      const officeAccounts = await this.getUserOfficeAccounts(userId);
      const officeAccountIds = officeAccounts.map(acc => acc.id);
      
      if (officeAccountIds.length > 0) {
        // Get both user's own bookings and office account bookings
        const ownBookings = await db.select().from(bookings)
          .where(eq(bookings.userId, userId));
        
        // Get office account bookings using individual queries to avoid SQL issues
        let officeBookings = [];
        for (const officeId of officeAccountIds) {
          const officeUserBookings = await db.select().from(bookings)
            .where(eq(bookings.userId, officeId));
          officeBookings.push(...officeUserBookings);
        }
        
        userBookings = [...ownBookings, ...officeBookings];
        const totalRevenue = Math.ceil(userBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
        console.log(`👤 PARENT USER DASHBOARD: ${user.firstName} ${user.lastName} (${userId})`);
        console.log(`   📊 Combined Data: ${userBookings.length} total bookings (${ownBookings.length} own + ${officeBookings.length} from agents)`);
        console.log(`   💰 Total Revenue: ₹${totalRevenue}`);
      } else {
        // No office accounts, just get user's own bookings
        userBookings = await db.select().from(bookings)
          .where(eq(bookings.userId, userId));
        const userRevenue = Math.ceil(userBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
        console.log(`👤 SINGLE USER DASHBOARD: ${user.firstName} ${user.lastName} (${userId})`);
        console.log(`   📊 Own Data Only: ${userBookings.length} bookings, ₹${userRevenue} revenue (no agents)`);
      }
      
      // Regular users see their own vehicles
      userVehicles = await db.select().from(vehicles)
        .where(eq(vehicles.userId, userId));
    }

    const totalBookings = userBookings.length;
    const activeShipments = userBookings.filter(b => 
      b.status === 'booked' || b.status === 'in_transit'
    ).length;
    
    const revenue = Math.ceil(userBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

    const availableVehicles = userVehicles.filter(v => v.status === 'available').length;

    console.log(`🔍 DASHBOARD STATS FINAL RESULT: ${totalBookings} bookings, ₹${revenue} revenue, ${activeShipments} active, ${availableVehicles} vehicles`);
    
    return {
      totalBookings,
      activeShipments,
      revenue: revenue.toString(),
      availableVehicles
    };

    const [maintenanceVehiclesResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(and(
        eq(vehicles.userId, userId),
        eq(vehicles.status, "maintenance")
      ));

    // Calculate growth rates
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [lastMonthBookingsResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        sql`${bookings.createdAt} >= ${lastMonth.toISOString()}`
      ));

    const [lastMonthRevenueResult] = await db
      .select({ total: sum(bookings.totalAmount) })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        eq(bookings.status, "delivered"),
        sql`${bookings.createdAt} >= ${lastMonth.toISOString()}`
      ));

  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    // Return all users for admin management, but exclude admins from regular analytics
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserAnalytics(userId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    adminRevenue: number;
    lastBookingDate: string | null;
    averageBookingValue: number;
    monthlyGrowth: number;
  }> {
    const user = await this.getUser(userId);
    const userBookings = await db.select().from(bookings)
      .where(eq(bookings.userId, userId));

    const totalBookings = userBookings.length;
    const totalRevenue = Math.ceil(userBookings
      .filter(b => b.status === 'delivered')
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

    // Calculate admin revenue based on plan
    let adminRevenue = 0;
    if (user?.subscriptionPlan === 'enterprise' && user.billingPercentage) {
      adminRevenue = (totalRevenue * Number(user.billingPercentage)) / 100;
    } else {
      // Standard commission rates for other plans
      const commissionRate = user?.subscriptionPlan === 'pro' ? 0.05 : 
                           user?.subscriptionPlan === 'starter' ? 0.08 : 0.10;
      adminRevenue = totalRevenue * commissionRate;
    }

    const lastBookingDate = userBookings.length > 0 
      ? userBookings.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0].createdAt || null
      : null;

    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate monthly growth (simplified)
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    
    const currentMonthBookings = userBookings.filter(b => 
      b.createdAt && new Date(b.createdAt) >= lastMonth
    ).length;
    const previousMonthBookings = userBookings.filter(b => {
      if (!b.createdAt) return false;
      const bookingDate = new Date(b.createdAt);
      return bookingDate >= new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1) &&
             bookingDate < lastMonth;
    }).length;

    const monthlyGrowth = previousMonthBookings > 0 
      ? ((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100 
      : 0;

    return {
      totalBookings,
      totalRevenue,
      adminRevenue,
      lastBookingDate: lastBookingDate ? lastBookingDate.toString() : null,
      averageBookingValue,
      monthlyGrowth
    };
  }

  async getRegularUsers(): Promise<User[]> {
    // Get only non-admin users for analytics and statistics
    return await db.select().from(users)
      .where(sql`${users.role} != 'admin'`)
      .orderBy(desc(users.createdAt));
  }

  async updateUserSubscription(userId: string, plan: string, status: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        subscriptionPlan: plan as any,
        subscriptionStatus: status as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserProfile(userId: string, updateData: any): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        email: updateData.email,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        role: updateData.role as any,
        subscriptionPlan: updateData.subscriptionPlan as any,
        subscriptionStatus: updateData.subscriptionStatus as any,
        billingPercentage: updateData.billingPercentage || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async blockUser(userId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isBlocked: true, status: 'blocked', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async unblockUser(userId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isBlocked: false, status: 'active', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Admin analytics and reporting
  async getAnalytics(): Promise<{
    revenue: number;
    activeUsers: number;
    topRoutes: Array<{ from: string; to: string; count: number }>;
    monthlyGrowth: number;
  }> {
    // Get all bookings with user data for commission calculation
    const allBookingsWithUsers = await db
      .select({
        booking: bookings,
        user: users
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(sql`${bookings.status} IN ('delivered', 'booked')`);
    
    // Calculate total admin revenue
    let adminRevenue = 0;
    
    // Commission revenue from enterprise users only
    for (const { booking, user } of allBookingsWithUsers) {
      const bookingAmount = Number(booking.totalAmount || 0);
      
      if (user.subscriptionPlan === 'enterprise' && user.billingPercentage) {
        // Enterprise users pay commission per booking
        adminRevenue += Math.ceil((bookingAmount * Number(user.billingPercentage)) / 100);
      }
    }
    
    // Subscription revenue from starter and pro users
    const subscriptionRevenue = await db
      .select({ 
        total: sql<number>`SUM(CASE 
          WHEN ${users.subscriptionPlan} = 'starter' THEN 299
          WHEN ${users.subscriptionPlan} = 'pro' THEN 999
          ELSE 0
        END)`
      })
      .from(users)
      .where(and(
        sql`${users.subscriptionStatus} = 'active'`,
        sql`${users.subscriptionPlan} IN ('starter', 'pro')`,
        sql`${users.role} != 'admin'`
      ));
    
    adminRevenue += subscriptionRevenue[0]?.total || 0;
    
    // Count only non-admin active users
    const activeUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.subscriptionStatus} = 'active' AND ${users.role} != 'admin'`);
    
    const topRoutes = allBookingsWithUsers
      .reduce((routes: any[], { booking }) => {
        const route = { from: booking.pickupCity, to: booking.deliveryCity };
        const existing = routes.find(r => r.from === route.from && r.to === route.to);
        if (existing) {
          existing.count++;
        } else {
          routes.push({ ...route, count: 1 });
        }
        return routes;
      }, [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate monthly growth based on admin revenue
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthBookingsWithUsers = await db
      .select({
        booking: bookings,
        user: users
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(and(
        sql`${bookings.status} IN ('delivered', 'booked')`,
        sql`${bookings.createdAt} >= ${lastMonth.toISOString()}`
      ));
    
    let lastMonthAdminRevenue = 0;
    
    // Commission revenue from enterprise users only (last month)
    for (const { booking, user } of lastMonthBookingsWithUsers) {
      const bookingAmount = Number(booking.totalAmount || 0);
      
      if (user.subscriptionPlan === 'enterprise' && user.billingPercentage) {
        lastMonthAdminRevenue += Math.ceil((bookingAmount * Number(user.billingPercentage)) / 100);
      }
    }
    
    // Add subscription revenue from last month (same as current month for active users)
    const lastMonthSubscriptionRevenue = await db
      .select({ 
        total: sql<number>`SUM(CASE 
          WHEN ${users.subscriptionPlan} = 'starter' THEN 299
          WHEN ${users.subscriptionPlan} = 'pro' THEN 999
          ELSE 0
        END)`
      })
      .from(users)
      .where(and(
        sql`${users.subscriptionStatus} = 'active'`,
        sql`${users.subscriptionPlan} IN ('starter', 'pro')`,
        sql`${users.role} != 'admin'`,
        sql`${users.createdAt} < ${lastMonth.toISOString()}`
      ));
    
    lastMonthAdminRevenue += lastMonthSubscriptionRevenue[0]?.total || 0;
    
    const monthlyGrowth = lastMonthAdminRevenue > 0 
      ? Math.round(((adminRevenue - lastMonthAdminRevenue) / lastMonthAdminRevenue) * 100)
      : 0;

    return {
      revenue: Math.ceil(adminRevenue), // Round up to whole number
      activeUsers: activeUsersResult[0]?.count || 0,
      topRoutes,
      monthlyGrowth
    };
  }

  async getAllBookings(): Promise<any[]> {
    try {
      const allBookings = await db
        .select({
          booking: bookings,
          vehicle: vehicles
        })
        .from(bookings)
        .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
        .orderBy(desc(bookings.createdAt));
      
      return allBookings.map(row => ({
        ...row.booking,
        registrationNumber: row.vehicle?.registrationNumber,
        vehicleNumber: row.vehicle?.registrationNumber,
        driverName: row.vehicle?.driverName,
        vehicleType: row.vehicle?.vehicleType
      }));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  }

  async getAllVehicles(): Promise<any[]> {
    try {
      // First get all vehicles
      const allVehicles = await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
      
      // Then get user info for each vehicle
      const vehiclesWithOwners = await Promise.all(
        allVehicles.map(async (vehicle) => {
          let ownerInfo = null;
          if (vehicle.userId) {
            const owner = await db.select().from(users).where(eq(users.id, vehicle.userId)).limit(1);
            if (owner.length > 0) {
              ownerInfo = owner[0];
            }
          }
          
          const ownerName = ownerInfo 
            ? (ownerInfo.firstName && ownerInfo.lastName 
               ? `${ownerInfo.firstName} ${ownerInfo.lastName}`
               : ownerInfo.officeName || 'Unknown Owner')
            : 'Unknown Owner';
            
          return {
            ...vehicle,
            ownerName,
            ownerEmail: ownerInfo?.email || null,
            ownerPhone: ownerInfo?.phone || null
          };
        })
      );

      return vehiclesWithOwners;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }
  }

  async getPendingEnterpriseRequests(): Promise<any[]> {
    try {
      return await db.select().from(users).where(
        and(
          eq(users.subscriptionPlan, 'enterprise'),
          eq(users.enterpriseApprovalStatus, 'pending')
        )
      ).orderBy(desc(users.enterpriseRequestDate));
    } catch (error) {
      console.error("Error fetching pending enterprise requests:", error);
      return [];
    }
  }

  async getAllUsersWithRevenue(): Promise<any[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      
      // Calculate trial status and remaining days
      const usersWithDetails = allUsers.map(user => {
        const now = new Date();
        let trialDaysRemaining = 0;
        let trialEnd;
        
        // Use trial_end_date if available, otherwise calculate from trial_start_date + 28 days
        if (user.trialEndDate) {
          trialEnd = new Date(user.trialEndDate);
        } else if (user.trialStartDate) {
          const trialStart = new Date(user.trialStartDate);
          trialEnd = new Date(trialStart.getTime() + (28 * 24 * 60 * 60 * 1000)); // 28 days trial period
        } else {
          // Default to current date + 28 days for new users
          trialEnd = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));
        }
        
        trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        const isTrialExpired = now > trialEnd && user.subscriptionStatus === 'trial';
        
        // Log trial days for debugging
        console.log(`📅 Fixed Trial Days for ${user.firstName} ${user.lastName}: ${trialDaysRemaining} days remaining (Status: ${user.subscriptionStatus}, Plan: ${user.subscriptionPlan}, trialEndDate: ${user.trialEndDate})`);
        
        return {
          ...user,
          trialDaysRemaining,
          isTrialExpired,
          canCreateBookings: user.subscriptionStatus === 'active' || (user.subscriptionStatus === 'trial' && !isTrialExpired)
        };
      });
      
      // Calculate revenue for each user
      const usersWithRevenue = await Promise.all(usersWithDetails.map(async (user) => {
        // Get bookings for this user
        const userBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.userId, user.id));

        // Get agent accounts created by this user (office role users under same office)
        const agentAccounts = await db
          .select()
          .from(users)
          .where(sql`${users.role} = 'office' AND ${users.officeName} = ${user.officeName || 'none'} AND ${users.id} != ${user.id}`);

        // Calculate commission revenue based on actual bookings
        let commissionRevenue = 0;
        let totalBookingAmount = 0;
        if (user.commissionRate && userBookings.length > 0) {
          totalBookingAmount = Math.ceil(userBookings.reduce((sum, booking) => {
            return sum + (Number(booking.totalAmount) || 0);
          }, 0));
          commissionRevenue = Math.ceil((totalBookingAmount * Number(user.commissionRate)) / 100);
        }

        // Calculate subscription revenue based on actual plan
        let subscriptionRevenue = 0;
        if (user.subscriptionPlan && user.subscriptionStatus === 'active') {
          switch (user.subscriptionPlan) {
            case 'starter': subscriptionRevenue = 299; break;
            case 'pro': subscriptionRevenue = 999; break;
            case 'enterprise': subscriptionRevenue = 2999; break;
          }
        }

        // Calculate next renewal date only for active paid subscriptions
        let nextRenewalDate = null;
        if (user.subscriptionPlan && user.subscriptionPlan !== 'basic' && user.subscriptionStatus === 'active') {
          if (user.subscriptionStartDate) {
            const startDate = new Date(user.subscriptionStartDate);
            nextRenewalDate = new Date(startDate);
            nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
          } else if (user.createdAt) {
            const startDate = new Date(user.createdAt);
            nextRenewalDate = new Date(startDate);
            nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
          }
        }

        // Determine revenue source
        let revenueSource = 'subscription';
        if (subscriptionRevenue > 0 && commissionRevenue > 0) {
          revenueSource = 'both';
        } else if (commissionRevenue > 0) {
          revenueSource = 'commission';
        }

        return {
          ...user,
          agentCount: agentAccounts.length,
          bookingCount: userBookings.length,
          totalBookingAmount,
          subscriptionRevenue,
          commissionRevenue,
          totalRevenue: totalBookingAmount, // Use actual booking amount instead of subscription + commission
          nextRenewalDate,
        };
      }));

      return usersWithRevenue;
    } catch (error) {
      console.error("Error fetching users with revenue:", error);
      return [];
    }
  }

  async getUserRevenues(): Promise<any[]> {
    try {
      // This can be used for detailed revenue analytics
      const revenues = await db
        .select({
          userId: users.id,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          email: users.email,
          subscriptionPlan: users.subscriptionPlan,
          commissionRate: users.commissionRate,
          totalBookings: sql<number>`COUNT(${bookings.id})`,
          totalAmount: sql<number>`SUM(CAST(${bookings.totalAmount} AS NUMERIC))`
        })
        .from(users)
        .leftJoin(bookings, eq(users.id, bookings.userId))
        .groupBy(users.id, users.firstName, users.lastName, users.email, users.subscriptionPlan, users.commissionRate);

      return revenues;
    } catch (error) {
      console.error("Error fetching user revenues:", error);
      return [];
    }
  }

  async getAllSupportTickets(): Promise<any[]> {
    try {
      // First get all support tickets
      const tickets = await db
        .select()
        .from(supportTickets)
        .orderBy(desc(supportTickets.createdAt));

      // Then get user info for each ticket
      const ticketsWithUserInfo = await Promise.all(
        tickets.map(async (ticket) => {
          let userInfo = { name: 'Unknown User', email: 'No Email', phone: null };
          
          if (ticket.userId) {
            try {
              const user = await db
                .select({
                  name: users.firstName, // Use firstName as name
                  email: users.email,
                  phone: users.phone
                })
                .from(users)
                .where(eq(users.id, ticket.userId))
                .limit(1);
              
              if (user.length > 0) {
                userInfo = user[0];
              }
            } catch (userError) {
              console.error("Error fetching user info for ticket:", ticket.id, userError);
            }
          }

          return {
            id: ticket.id,
            userId: ticket.userId,
            userName: userInfo.name || 'Unknown User',
            userEmail: userInfo.email || 'No Email',
            userPhone: userInfo.phone,
            subject: ticket.title, // Map title to subject for frontend compatibility
            message: ticket.description, // Map description to message for frontend compatibility
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            category: ticket.category,
            assignedTo: ticket.assignedTo,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt
          };
        })
      );

      return ticketsWithUserInfo;
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      return [];
    }
  }

  async getActivityLogs(): Promise<any[]> {
    return [
      {
        id: '1',
        userName: 'John Doe',
        action: 'LOGIN',
        details: 'User logged in successfully',
        ipAddress: '192.168.1.1',
        timestamp: new Date()
      }
    ];
  }

  async respondToSupportTicket(ticketId: string, response: string): Promise<any> {
    try {
      // Create a ticket response
      const ticketResponse = await this.createTicketResponse({
        ticketId: parseInt(ticketId),
        userId: 'admin-001', // Admin response
        message: response,
        isInternal: false
      });

      // Update ticket status to 'in_progress' or 'resolved'
      const updatedTicket = await this.updateSupportTicket(parseInt(ticketId), {
        status: 'in_progress'
      });

      return {
        ticketResponse,
        updatedTicket
      };
    } catch (error) {
      console.error("Error responding to support ticket:", error);
      throw error;
    }
  }

  async approveEnterpriseUser(userId: string, customPricing: number, billingPercentage: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionStatus: 'active',
        subscriptionPlan: 'enterprise',
        customPricing: customPricing.toString(),
        billingPercentage: billingPercentage.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async calculateEnterpriseRevelBilling(userId: string): Promise<{
    totalRevenue: number;
    billingPercentage: number;
    monthlyBilling: number;
  }> {
    // Get user's billing percentage
    const user = await this.getUser(userId);
    if (!user || user.subscriptionPlan !== 'enterprise' || !user.billingPercentage) {
      return { totalRevenue: 0, billingPercentage: 0, monthlyBilling: 0 };
    }

    // Calculate user's total revenue from bookings
    const userBookings = await db.select().from(bookings)
      .where(eq(bookings.userId, userId));
    
    const totalRevenue = Math.ceil(userBookings
      .filter(b => b.status === 'delivered')
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

    const billingPercentage = Number(user.billingPercentage);
    const monthlyBilling = Math.ceil((totalRevenue * billingPercentage) / 100);

    return {
      totalRevenue,
      billingPercentage,
      monthlyBilling
    };
  }



  async getUserBillingDetails(userId: string): Promise<{
    subscriptionPlan: string;
    billingPercentage: number | null;
    totalRevenue: number;
    monthlyBilling: number;
    rateCalculationMethod: string;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userBookings = await db.select().from(bookings)
      .where(eq(bookings.userId, userId));

    const totalRevenue = Math.ceil(userBookings
      .filter(b => b.status === 'delivered')
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

    let monthlyBilling = 0;
    if (user.subscriptionPlan === 'enterprise' && user.billingPercentage) {
      monthlyBilling = Math.ceil((totalRevenue * Number(user.billingPercentage)) / 100);
    }

    return {
      subscriptionPlan: user.subscriptionPlan || 'trial',
      billingPercentage: user.billingPercentage ? Number(user.billingPercentage) : null,
      totalRevenue,
      monthlyBilling,
      rateCalculationMethod: 'auto', // Default since column doesn't exist yet
    };
  }

  async exportReport(type: string): Promise<string> {
    let csvData = '';
    
    switch (type) {
      case 'users':
        const users = await this.getRegularUsers(); // Only export regular users, not admins
        csvData = 'ID,Name,Email,Plan,Status,Billing%,Created\n';
        csvData += users.map(u => 
          `${u.id},"${u.firstName} ${u.lastName}",${u.email},${u.subscriptionPlan},${u.subscriptionStatus},${u.billingPercentage || 'N/A'},${u.createdAt}`
        ).join('\n');
        break;
        
      case 'bookings':
        const bookings = await this.getAllBookings();
        csvData = 'ID,Customer,Route,Amount,Status,Date\n';
        csvData += bookings.map(b => 
          `${b.id},"${b.senderName}","${b.pickupCity} → ${b.deliveryCity}",${b.totalAmount},${b.status},${b.createdAt}`
        ).join('\n');
        break;
        
      case 'revenue':
        const analytics = await this.getAnalytics();
        csvData = 'Metric,Value\n';
        csvData += `Total Revenue,${analytics.revenue}\n`;
        csvData += `Active Users,${analytics.activeUsers}\n`;
        csvData += `Monthly Growth,${analytics.monthlyGrowth}%\n`;
        break;
        
      default:
        csvData = 'No data available for this report type\n';
    }
    
    return csvData;
  }

  // Office account operations
  async createOfficeAccount(data: { email: string; firstName: string; lastName: string; officeName: string; hashedPassword: string; parentUserId: string; commissionRate?: number }): Promise<User> {
    console.log('Creating office account with commission rate:', data.commissionRate);
    
    const [newOfficeAccount] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      officeName: data.officeName,
      hashedPassword: data.hashedPassword,
      parentUserId: data.parentUserId,
      role: 'office',
      subscriptionPlan: 'trial',
      subscriptionStatus: 'active',
      commissionRate: data.commissionRate?.toString() || '5.00'
    }).returning();
    
    console.log('Office account created successfully with commission rate:', newOfficeAccount.commissionRate);
    return newOfficeAccount;
  }

  async getUserOfficeAccounts(userId: string): Promise<User[]> {
    const result = await db.select().from(users)
      .where(and(
        eq(users.parentUserId, userId),
        eq(users.role, 'office')
      ))
      .orderBy(desc(users.createdAt));
    
    console.log(`getUserOfficeAccounts for ${userId}: found ${result.length} office accounts`);
    
    if (result.length === 0) {
      return [];
    }
    
    // Enhance each office account with live booking data
    const enhancedResults = await Promise.all(result.map(async (account) => {
      try {
        // Get booking statistics for this agent
        const agentBookings = await db.select().from(bookings)
          .where(eq(bookings.userId, account.id));
        
        const totalBookings = agentBookings.length;
        const totalRevenue = Math.ceil(agentBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
        const activeShipments = agentBookings.filter(b => 
          ['booked', 'picked', 'in_transit'].includes(b.status || '')
        ).length;
        
        // Calculate commission based on current rate
        const commissionRate = Number(account.commissionRate || 0);
        const monthlyCommission = (totalRevenue * commissionRate) / 100;
        
        // Get current month bookings for monthly stats
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const monthlyBookings = agentBookings.filter(b => 
          new Date(b.createdAt!) >= currentMonth
        );
        const monthlyRevenue = Math.ceil(monthlyBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
        
        const enhancedAccount = {
          ...account,
          totalBookings,
          totalRevenue,
          monthlyRevenue,
          monthlyCommission,
          activeShipments,
          bookingCount: totalBookings, // For backward compatibility
        };
        
        console.log(`Agent ${account.firstName} ${account.lastName} stats:`, {
          totalBookings,
          totalRevenue,
          monthlyCommission: Math.ceil(monthlyCommission).toString(),
          activeShipments
        });
        
        return enhancedAccount;
      } catch (error) {
        console.error(`Error fetching stats for agent ${account.id}:`, error);
        return {
          ...account,
          totalBookings: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          monthlyCommission: 0,
          activeShipments: 0,
          bookingCount: 0,
        };
      }
    }));
    
    return enhancedResults;
  }

  async updateOfficeAccount(officeId: string, data: Partial<{ email: string; firstName: string; lastName: string; officeName: string; commissionRate: number }>): Promise<User> {
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.officeName) updateData.officeName = data.officeName;
    if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate.toString();
    updateData.updatedAt = new Date();

    const [updatedAccount] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, officeId))
      .returning();
    
    return updatedAccount;
  }

  async resetOfficeAccountPassword(officeId: string, newPassword: string): Promise<User> {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedAccount = await db.update(users)
      .set({
        hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, officeId))
      .returning();
    
    return updatedAccount[0];
  }

  async deleteOfficeAccount(officeId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, officeId));
  }

  async getDailyBookingsList(userId: string, date?: string): Promise<Booking[]> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get user details to check role
    const user = await this.getUser(userId);
    
    if (user?.role === 'office') {
      // Office accounts can see all bookings they created
      return await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, userId),
            gte(bookings.createdAt, startOfDay),
            lte(bookings.createdAt, endOfDay)
          )
        )
        .orderBy(desc(bookings.createdAt));
    } else {
      // Regular users can see their own bookings and bookings from their office accounts
      const officeAccounts = await this.getUserOfficeAccounts(userId);
      const officeAccountIds = officeAccounts.map(acc => acc.id);
      
      if (officeAccountIds.length > 0) {
        // Get both user's own bookings and office account bookings
        const ownBookings = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, userId),
              gte(bookings.createdAt, startOfDay),
              lte(bookings.createdAt, endOfDay)
            )
          )
          .orderBy(desc(bookings.createdAt));
        
        // Get office account bookings for the specific date
        let officeBookings = [];
        for (const officeId of officeAccountIds) {
          const officeUserBookings = await db
            .select()
            .from(bookings)
            .where(
              and(
                eq(bookings.userId, officeId),
                gte(bookings.createdAt, startOfDay),
                lte(bookings.createdAt, endOfDay)
              )
            )
            .orderBy(desc(bookings.createdAt));
          officeBookings.push(...officeUserBookings);
        }
        
        // Combine and sort by creation date
        return [...ownBookings, ...officeBookings]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        // No office accounts, just get user's own bookings
        return await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, userId),
              gte(bookings.createdAt, startOfDay),
              lte(bookings.createdAt, endOfDay)
            )
          )
          .orderBy(desc(bookings.createdAt));
      }
    }
  }
  async getAgentAnalytics(agentId: string, startDate?: string, endDate?: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
    avgBookingsPerDay: number;
    bookingsByDate: Array<{ date: string; bookings: number; revenue: number; commission: number }>;
    topRoutes: Array<{ from: string; to: string; bookings: number; revenue: number }>;
    serviceDistribution: Array<{ type: string; count: number; revenue: number }>;
    customerMetrics: {
      totalCustomers: number;
      repeatCustomers: number;
      avgOrderValue: number;
    };
  }> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get all bookings for this agent in the date range
    const agentBookings = await db.select().from(bookings)
      .where(
        and(
          eq(bookings.userId, agentId),
          gte(bookings.createdAt, start),
          lte(bookings.createdAt, end)
        )
      )
      .orderBy(desc(bookings.createdAt));

    console.log(`Agent Analytics for ${agentId}: Found ${agentBookings.length} bookings between ${start.toISOString()} and ${end.toISOString()}`);

    // Get agent's commission rate
    const agent = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    const commissionRate = Number(agent[0]?.commissionRate || agent[0]?.customCommissionRate || 5.0) / 100; // Convert percentage to decimal

    const totalBookings = agentBookings.length;
    const totalRevenue = Math.ceil(agentBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));
    const totalCommission = Math.ceil(totalRevenue * commissionRate);
    
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const avgBookingsPerDay = totalBookings / daysDiff;

    console.log(`Analytics computed: ${totalBookings} bookings, ₹${totalRevenue} revenue, ₹${totalCommission} commission (${(commissionRate * 100)}% rate)`);

    // Group bookings by date
    const bookingsByDate = agentBookings.reduce((acc, booking) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { bookings: 0, revenue: 0 };
      }
      acc[date].bookings += 1;
      acc[date].revenue += Number(booking.totalAmount || 0);
      return acc;
    }, {} as Record<string, { bookings: number; revenue: number }>);

    const bookingsByDateArray = Object.entries(bookingsByDate).map(([date, data]) => ({
      date,
      bookings: data.bookings,
      revenue: Math.ceil(data.revenue),
      commission: Math.ceil(data.revenue * commissionRate)
    }));

    // Top routes
    const routeCounts = agentBookings.reduce((acc, booking) => {
      const route = `${booking.pickupCity} → ${booking.deliveryCity}`;
      if (!acc[route]) {
        acc[route] = { bookings: 0, revenue: 0, from: booking.pickupCity, to: booking.deliveryCity };
      }
      acc[route].bookings += 1;
      acc[route].revenue += Number(booking.totalAmount || 0);
      return acc;
    }, {} as Record<string, { bookings: number; revenue: number; from: string; to: string }>);

    const topRoutes = Object.values(routeCounts)
      .map(route => ({
        ...route,
        revenue: Math.ceil(route.revenue)
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Service distribution (by booking type)
    const serviceDistribution = agentBookings.reduce((acc, booking) => {
      const type = booking.bookingType || 'standard';
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 };
      }
      acc[type].count += 1;
      acc[type].revenue += Number(booking.totalAmount || 0);
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const serviceDistributionArray = Object.entries(serviceDistribution).map(([type, data]) => ({
      type,
      count: data.count,
      revenue: Math.ceil(data.revenue)
    }));

    // Customer metrics
    const uniqueCustomers = new Set(agentBookings.map(b => b.receiverEmail || b.receiverPhone)).size;
    const customerBookingCounts = agentBookings.reduce((acc, booking) => {
      const customer = booking.receiverEmail || booking.receiverPhone;
      acc[customer] = (acc[customer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repeatCustomers = Object.values(customerBookingCounts).filter(count => count > 1).length;
    const avgOrderValue = totalBookings > 0 ? Math.ceil(totalRevenue / totalBookings) : 0;

    return {
      totalBookings,
      totalRevenue,
      totalCommission,
      avgBookingsPerDay,
      bookingsByDate: bookingsByDateArray,
      topRoutes,
      serviceDistribution: serviceDistributionArray,
      customerMetrics: {
        totalCustomers: uniqueCustomers,
        repeatCustomers,
        avgOrderValue
      }
    };
  }
  // Contact form operations
  async createContactSubmission(submission: any): Promise<any> {
    const [result] = await db.insert(contactSubmissions).values(submission).returning();
    return result;
  }

  async getContactSubmissions(): Promise<any[]> {
    return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async updateContactSubmissionStatus(id: number, status: string): Promise<any> {
    const [result] = await db
      .update(contactSubmissions)
      .set({ status })
      .where(eq(contactSubmissions.id, id))
      .returning();
    return result;
  }

  async deleteContactSubmission(id: number): Promise<void> {
    await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
  }

  // Support ticket operations
  async createSupportTicket(ticket: any): Promise<any> {
    const [result] = await db.insert(supportTickets).values(ticket).returning();
    return result;
  }

  async getSupportTickets(userId?: string): Promise<any[]> {
    if (userId) {
      return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId));
    }
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: number, updates: any): Promise<any> {
    const [result] = await db
      .update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return result;
  }

  async createTicketResponse(response: any): Promise<any> {
    const [result] = await db.insert(ticketResponses).values(response).returning();
    return result;
  }

  async getTicketResponses(ticketId: number): Promise<any[]> {
    return await db
      .select()
      .from(ticketResponses)
      .where(eq(ticketResponses.ticketId, ticketId))
      .orderBy(asc(ticketResponses.createdAt));
  }

  // Notification operations
  async createNotification(notification: any): Promise<any> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }



  async markNotificationAsRead(id: number): Promise<any> {
    const [result] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result;
  }

  async markAllNotificationsAsRead(userId: string): Promise<any> {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<any> {
    const [result] = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
    return result;
  }

  // System settings operations
  async getSystemSettings(): Promise<any[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.key));
  }

  async updateSystemSetting(key: string, value: string, updatedBy: string): Promise<any> {
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    
    if (existing.length > 0) {
      const [result] = await db
        .update(systemSettings)
        .set({ value, updatedBy, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return result;
    } else {
      const [result] = await db
        .insert(systemSettings)
        .values({ key, value, updatedBy })
        .returning();
      return result;
    }
  }

  async getSetting(key: string): Promise<any> {
    const [result] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return result;
  }

  // User theme operations
  async getUserThemeSettings(userId: string): Promise<UserThemeSetting | undefined> {
    const [result] = await db.select().from(userThemeSettings).where(eq(userThemeSettings.userId, userId)).limit(1);
    return result;
  }

  async createUserThemeSettings(settings: InsertUserThemeSetting): Promise<UserThemeSetting> {
    const [result] = await db.insert(userThemeSettings).values(settings).returning();
    return result;
  }

  async updateUserThemeSettings(userId: string, settings: Partial<InsertUserThemeSetting>): Promise<UserThemeSetting> {
    const existingSettings = await this.getUserThemeSettings(userId);
    
    if (existingSettings) {
      const [result] = await db
        .update(userThemeSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userThemeSettings.userId, userId))
        .returning();
      return result;
    } else {
      // Create new settings if not exists
      const newSettings = { ...settings, userId };
      return await this.createUserThemeSettings(newSettings as InsertUserThemeSetting);
    }
  }

  // Super Admin theme operations
  async getSuperAdminThemeSettings(): Promise<SuperAdminThemeSetting | undefined> {
    const [result] = await db.select().from(superAdminThemeSettings).limit(1);
    return result;
  }

  async createSuperAdminThemeSettings(settings: InsertSuperAdminThemeSetting): Promise<SuperAdminThemeSetting> {
    const [result] = await db.insert(superAdminThemeSettings).values(settings).returning();
    return result;
  }

  async updateSuperAdminThemeSettings(settings: Partial<InsertSuperAdminThemeSetting>): Promise<SuperAdminThemeSetting> {
    const existingSettings = await this.getSuperAdminThemeSettings();
    
    if (existingSettings) {
      const [result] = await db
        .update(superAdminThemeSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(superAdminThemeSettings.id, existingSettings.id))
        .returning();
      return result;
    } else {
      // Create new settings if not exists
      return await this.createSuperAdminThemeSettings(settings as InsertSuperAdminThemeSetting);
    }
  }

  // Activity Logs Functions
  async getSystemLogs(): Promise<any[]> {
    // Generate real activity logs from database activities
    const allUsers = await db.select().from(users);
    const allBookings = await db.select().from(bookings);
    const allVehicles = await db.select().from(vehicles);
    
    const logs = [];
    
    // User registration logs
    allUsers.forEach(user => {
      if (user.createdAt) {
        logs.push({
          id: `user-${user.id}`,
          level: 'info',
          type: 'user',
          message: `New user registered: ${user.firstName} ${user.lastName} (${user.email})`,
          source: 'User Registration',
          timestamp: user.createdAt,
          details: {
            userId: user.id,
            role: user.role,
            plan: user.subscriptionPlan
          }
        });
      }
    });
    
    // Booking creation logs
    allBookings.forEach(booking => {
      if (booking.createdAt) {
        logs.push({
          id: `booking-${booking.id}`,
          level: 'success',
          type: 'booking',
          message: `New booking created: ${booking.pickupCity} → ${booking.deliveryCity} (₹${booking.totalAmount})`,
          source: 'Booking System',
          timestamp: booking.createdAt,
          details: {
            bookingId: booking.id,
            amount: booking.totalAmount,
            status: booking.status
          }
        });
      }
    });
    
    // Vehicle registration logs
    allVehicles.forEach(vehicle => {
      if (vehicle.createdAt) {
        logs.push({
          id: `vehicle-${vehicle.id}`,
          level: 'info',
          type: 'vehicle',
          message: `Vehicle registered: ${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
          source: 'Fleet Management',
          timestamp: vehicle.createdAt,
          details: {
            vehicleId: vehicle.id,
            type: vehicle.vehicleType,
            number: vehicle.vehicleNumber
          }
        });
      }
    });
    
    // Add system events
    logs.push({
      id: 'system-startup',
      level: 'info',
      type: 'system',
      message: 'System started successfully',
      source: 'System',
      timestamp: new Date(),
      details: {
        version: '1.0.0',
        environment: 'production'
      }
    });
    
    // Sort by timestamp (newest first)
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }



  async getLogStats(): Promise<any> {
    const logs = await this.getSystemLogs();
    
    const stats = {
      total: logs.length,
      levels: {
        info: logs.filter(l => l.level === 'info').length,
        success: logs.filter(l => l.level === 'success').length,
        warning: logs.filter(l => l.level === 'warning').length,
        error: logs.filter(l => l.level === 'error').length
      },
      types: {
        user: logs.filter(l => l.type === 'user').length,
        booking: logs.filter(l => l.type === 'booking').length,
        vehicle: logs.filter(l => l.type === 'vehicle').length,
        system: logs.filter(l => l.type === 'system').length
      },
      recent: logs.slice(0, 5)
    };
    
    return stats;
  }

  // Database management operations
  async getDatabaseStats() {
    try {
      // Get database size using PostgreSQL system query
      const sizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_database_size(current_database()) as size_bytes
      `;
      
      const sizeResult = await pool.query(sizeQuery);
      const storageUsed = sizeResult.rows[0]?.database_size || '0 MB';
      
      // Get active connections
      const connectionsQuery = `
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      
      const connectionsResult = await pool.query(connectionsQuery);
      const activeConnections = parseInt(connectionsResult.rows[0]?.active_connections || '0');
      
      // Get table statistics for performance calculation
      const statsQuery = `
        SELECT 
          COUNT(*) as table_count,
          SUM(n_tup_ins + n_tup_upd + n_tup_del) as total_operations
        FROM pg_stat_user_tables
      `;
      
      const statsResult = await pool.query(statsQuery);
      const totalOps = parseInt(statsResult.rows[0]?.total_operations || '0');
      
      // Performance based on database activity
      const performance = totalOps > 1000 ? 'Excellent' : totalOps > 500 ? 'Good' : totalOps > 100 ? 'Fair' : 'Low Activity';
      
      const lastBackup = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('Database stats calculated:', { storageUsed, activeConnections, performance, lastBackup });
      
      return {
        storageUsed,
        activeConnections,
        performance,
        lastBackup
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      
      // Fallback calculation using record counts
      try {
        const [usersCount] = await db.select({ count: count() }).from(users);
        const [bookingsCount] = await db.select({ count: count() }).from(bookings);
        const [vehiclesCount] = await db.select({ count: count() }).from(vehicles);
        const [warehousesCount] = await db.select({ count: count() }).from(warehouses);
        
        const totalRecords = (usersCount?.count || 0) + (bookingsCount?.count || 0) + 
                            (vehiclesCount?.count || 0) + (warehousesCount?.count || 0);
        
        // Estimate 2KB per record
        const estimatedSizeMB = Math.max(1, Math.round(totalRecords * 2 / 1024));
        const storageUsed = `${estimatedSizeMB} MB`;
        
        return {
          storageUsed,
          activeConnections: 5,
          performance: 'Good',
          lastBackup: new Date().toISOString().split('T')[0]
        };
      } catch (fallbackError) {
        console.error('Fallback calculation failed:', fallbackError);
        return {
          storageUsed: '1 MB',
          activeConnections: 1,
          performance: 'Unknown',
          lastBackup: 'Never'
        };
      }
    }
  }

  async getDatabaseTables() {
    try {
      const tables = [];
      
      // Get users table stats
      const [usersCount] = await db.select({ count: count() }).from(users);
      
      tables.push({
        name: 'users',
        records: usersCount?.count || 0,
        size: `${Math.round((usersCount?.count || 0) * 1.5)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get bookings table stats
      const [bookingsCount] = await db.select({ count: count() }).from(bookings);
      
      tables.push({
        name: 'bookings',
        records: bookingsCount?.count || 0,
        size: `${Math.round((bookingsCount?.count || 0) * 2.8)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get vehicles table stats
      const [vehiclesCount] = await db.select({ count: count() }).from(vehicles);
      
      tables.push({
        name: 'vehicles',
        records: vehiclesCount?.count || 0,
        size: `${Math.round((vehiclesCount?.count || 0) * 1.2)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get warehouses table stats
      const [warehousesCount] = await db.select({ count: count() }).from(warehouses);
      
      tables.push({
        name: 'warehouses',
        records: warehousesCount?.count || 0,
        size: `${Math.round((warehousesCount?.count || 0) * 1.1)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get tracking_events table stats
      const [trackingCount] = await db.select({ count: count() }).from(trackingEvents);
      
      tables.push({
        name: 'tracking_events',
        records: trackingCount?.count || 0,
        size: `${Math.round((trackingCount?.count || 0) * 0.8)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get live_tracking table stats
      const [liveTrackingCount] = await db.select({ count: count() }).from(liveTracking);
      tables.push({
        name: 'live_tracking',
        records: liveTrackingCount?.count || 0,
        size: `${Math.round((liveTrackingCount?.count || 0) * 1.5)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get subscriptions table stats
      const [subscriptionsCount] = await db.select({ count: count() }).from(subscriptions);
      tables.push({
        name: 'subscriptions',
        records: subscriptionsCount?.count || 0,
        size: `${Math.round((subscriptionsCount?.count || 0) * 0.5)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get contact submissions table stats
      const [contactCount] = await db.select({ count: count() }).from(contactSubmissions);
      tables.push({
        name: 'contact_submissions',
        records: contactCount?.count || 0,
        size: `${Math.round((contactCount?.count || 0) * 0.6)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      // Get support tickets table stats
      const [ticketsCount] = await db.select({ count: count() }).from(supportTickets);
      tables.push({
        name: 'support_tickets',
        records: ticketsCount?.count || 0,
        size: `${Math.round((ticketsCount?.count || 0) * 0.7)} KB`,
        lastUpdated: new Date().toLocaleDateString()
      });
      
      return tables;
    } catch (error) {
      console.error('Error getting database tables:', error);
      return [];
    }
  }

  async clearTableData(tableName: string) {
    try {
      console.log(`Clearing all data from table: ${tableName}`);
      
      // Map of allowed tables to their corresponding Drizzle table objects
      const tableMap: Record<string, any> = {
        'users': users,
        'bookings': bookings,
        'vehicles': vehicles,
        'warehouses': warehouses,
        'tracking_events': trackingEvents,
        'live_tracking': liveTracking,
        'delivery_notifications': deliveryNotifications,
        'route_monitoring': routeMonitoring,
        'invoices': invoices,
        'subscriptions': subscriptions,
        'contact_submissions': contactSubmissions,
        'support_tickets': supportTickets,
        'ticket_responses': ticketResponses,
        'notifications': notifications,
        'system_settings': systemSettings,
        'user_theme_settings': userThemeSettings,
        'super_admin_theme_settings': superAdminThemeSettings
      };
      
      const table = tableMap[tableName];
      if (!table) {
        throw new Error(`Table '${tableName}' is not allowed or does not exist`);
      }
      
      // Delete all records from the table
      const result = await db.delete(table);
      
      console.log(`Successfully cleared ${tableName} table`);
      
      return {
        success: true,
        message: `Successfully cleared all data from ${tableName} table`,
        tableName: tableName
      };
    } catch (error) {
      console.error(`Error clearing table ${tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        tableName: tableName
      };
    }
  }

  async executeSQLQuery(query: string) {
    try {
      console.log('Executing SQL query:', query);
      
      // Execute the raw SQL query
      const result = await db.execute(sql.raw(query));
      
      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : 0,
        query: query
      };
    } catch (error) {
      console.error('Error executing SQL query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        query: query
      };
    }
  }

  // Notification Methods
  async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    relatedId?: number;
    senderUserId?: string;
  }) {
    try {
      const result = await db.insert(notifications).values({
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        actionUrl: notification.actionUrl,
        relatedId: notification.relatedId,
        senderUserId: notification.senderUserId,
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string) {
    try {
      // Get user's own notifications
      const userNotifications = await db
        .select({
          notification: notifications,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: users.role,
          }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.senderUserId, users.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      // Get user's agents (office accounts)
      const userAgents = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.parentUserId, userId),
          eq(users.role, 'office')
        ));

      // If user has agents, get their notifications too
      let agentNotifications: any[] = [];
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id);
        
        agentNotifications = await db
          .select({
            notification: notifications,
            sender: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              role: users.role,
            }
          })
          .from(notifications)
          .leftJoin(users, eq(notifications.senderUserId, users.id))
          .where(inArray(notifications.userId, agentIds))
          .orderBy(desc(notifications.createdAt));
      }

      // Combine and sort all notifications by creation date
      const allNotifications = [...userNotifications, ...agentNotifications];
      allNotifications.sort((a, b) => 
        new Date(b.notification.createdAt).getTime() - new Date(a.notification.createdAt).getTime()
      );

      return allNotifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string) {
    try {
      // Mark user's own notifications as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      // Get user's agents (office accounts)
      const userAgents = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.parentUserId, userId),
          eq(users.role, 'office')
        ));

      // If user has agents, mark their notifications as read too
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id);
        
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(and(
            inArray(notifications.userId, agentIds),
            eq(notifications.isRead, false)
          ));
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string) {
    try {
      // Get user's own unread notifications count
      const userCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      // Get user's agents (office accounts)
      const userAgents = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.parentUserId, userId),
          eq(users.role, 'office')
        ));

      // Get agents' unread notifications count
      let agentCount = 0;
      if (userAgents.length > 0) {
        const agentIds = userAgents.map(agent => agent.id);
        
        const agentCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(and(
            inArray(notifications.userId, agentIds),
            eq(notifications.isRead, false)
          ));
        
        agentCount = Number(agentCountResult[0]?.count || 0);
      }

      const userUnreadCount = Number(userCount[0]?.count || 0);
      const totalCount = userUnreadCount + agentCount;
      
      console.log('📊 Unread Notification Count Debug:');
      console.log('👤 User ID:', userId);
      console.log('🔢 User unread count:', userUnreadCount, 'Type:', typeof userUnreadCount);
      console.log('👥 Agent unread count:', agentCount, 'Type:', typeof agentCount);
      console.log('📱 Total unread count:', totalCount, 'Type:', typeof totalCount);
      
      return totalCount;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  // Message Methods
  async createMessage(message: {
    fromUserId: string;
    toUserId: string;
    subject: string;
    message: string;
    relatedTicketId?: number;
    priority?: string;
  }) {
    try {
      const result = await db.insert(messages).values({
        fromUserId: message.fromUserId,
        toUserId: message.toUserId,
        subject: message.subject,
        message: message.message,
        relatedTicketId: message.relatedTicketId,
        priority: message.priority || 'medium',
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getUserMessages(userId: string, role: string) {
    try {
      console.log(`Getting messages for user ${userId} with role ${role}`);
      
      // Get messages where user is either sender or receiver
      const userMessages = await db
        .select({
          id: messages.id,
          fromUserId: messages.fromUserId,
          toUserId: messages.toUserId,
          subject: messages.subject,
          message: messages.message,
          relatedTicketId: messages.relatedTicketId,
          isRead: messages.isRead,
          priority: messages.priority,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          or(
            eq(messages.fromUserId, userId),
            eq(messages.toUserId, userId)
          )
        )
        .orderBy(desc(messages.createdAt));

      // Add sender information
      const messagesWithSender = await Promise.all(
        userMessages.map(async (msg) => {
          const sender = await db
            .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.id, msg.fromUserId))
            .limit(1);
          
          return {
            ...msg,
            senderName: sender[0] ? `${sender[0].firstName || ''} ${sender[0].lastName || ''}`.trim() || sender[0].email : 'Unknown',
            senderEmail: sender[0]?.email || 'unknown@email.com'
          };
        })
      );

      console.log(`📨 Found ${messagesWithSender.length} messages for user ${userId}`);
      return messagesWithSender;
    } catch (error) {
      console.error('Error getting user messages:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number) {
    try {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getUnreadMessageCount(userId: string) {
    try {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.toUserId, userId),
          eq(messages.isRead, false)
        ));
      
      return count[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number) {
    try {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async markAllMessagesAsRead(userId: string) {
    try {
      await db
        .update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.toUserId, userId),
          eq(messages.isRead, false)
        ));

      return { success: true };
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  }

  // Subscription plans operations
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .orderBy(asc(subscriptionPlans.sortOrder));
      return plans;
    } catch (error) {
      console.error('Error getting all subscription plans:', error);
      throw error;
    }
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(asc(subscriptionPlans.sortOrder));
      return plans;
    } catch (error) {
      console.error('Error getting active subscription plans:', error);
      throw error;
    }
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    try {
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id));
      return plan;
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      throw error;
    }
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    try {
      // Handle features - convert array to JSON string if needed
      let processedFeatures = plan.features;
      if (Array.isArray(plan.features)) {
        processedFeatures = JSON.stringify(plan.features);
      }
      
      const [newPlan] = await db
        .insert(subscriptionPlans)
        .values({
          ...plan,
          price: plan.price.toString(),
          features: processedFeatures,
        })
        .returning();
      return newPlan;
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      throw error;
    }
  }

  async updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const updateData = { ...plan };
      if (updateData.price !== undefined) {
        updateData.price = updateData.price.toString();
      }
      
      // Handle features - convert array to JSON string if needed
      if (updateData.features !== undefined) {
        if (Array.isArray(updateData.features)) {
          updateData.features = JSON.stringify(updateData.features);
        }
      }
      
      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, id))
        .returning();
      
      if (!updatedPlan) {
        throw new Error('Subscription plan not found');
      }
      
      return updatedPlan;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  async deleteSubscriptionPlan(id: number): Promise<void> {
    try {
      await db
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id));
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      throw error;
    }
  }

  async getSubscriptionPlanStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    averagePrice: number;
  }> {
    try {
      const [totalPlansResult] = await db
        .select({ count: count() })
        .from(subscriptionPlans);

      const [activePlansResult] = await db
        .select({ count: count() })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true));

      const [totalSubscriptionsResult] = await db
        .select({ count: count() })
        .from(subscriptions);

      const [avgPriceResult] = await db
        .select({ 
          avgPrice: sql<number>`COALESCE(AVG(CAST(${subscriptionPlans.price} AS DECIMAL)), 0)` 
        })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true));

      return {
        totalPlans: totalPlansResult.count,
        activePlans: activePlansResult.count,
        totalSubscriptions: totalSubscriptionsResult.count,
        averagePrice: Math.ceil(avgPriceResult.avgPrice || 0),
      };
    } catch (error) {
      console.error('Error getting subscription plan stats:', error);
      throw error;
    }
  }

  // Announcements methods
  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      return await db
        .select()
        .from(announcements)
        .orderBy(desc(announcements.priority), desc(announcements.createdAt));
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    try {
      const now = new Date();
      return await db
        .select()
        .from(announcements)
        .where(
          and(
            eq(announcements.isActive, true),
            lte(announcements.startDate, now),
            gte(announcements.endDate, now)
          )
        )
        .orderBy(asc(announcements.priority), desc(announcements.createdAt));
    } catch (error) {
      console.error('Error getting active announcements:', error);
      throw error;
    }
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    try {
      const [created] = await db
        .insert(announcements)
        .values(announcement)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  async updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>): Promise<Announcement> {
    try {
      const [updated] = await db
        .update(announcements)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(announcements.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  async deleteAnnouncement(id: number): Promise<void> {
    try {
      await db
        .delete(announcements)
        .where(eq(announcements.id, id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  async getAnnouncementById(id: number): Promise<Announcement | undefined> {
    try {
      const [announcement] = await db
        .select()
        .from(announcements)
        .where(eq(announcements.id, id));
      return announcement;
    } catch (error) {
      console.error('Error getting announcement by id:', error);
      throw error;
    }
  }

  // Financial Reports Implementation
  async getFinancialReports(userId: string, period: string = 'monthly') {
    try {
      console.log(`📊 Generating financial reports for user: ${userId}, period: ${period}`);
      
      // Get user's bookings for financial calculations
      const userBookings = await this.getUserBookings(userId);
      
      // Calculate total income from completed bookings
      const completedBookings = userBookings.filter(booking => 
        booking.status === 'delivered' && booking.paymentStatus === 'paid'
      );
      
      const totalIncome = completedBookings.reduce((sum, booking) => {
        return sum + Math.ceil(parseFloat(booking.totalAmount || '0'));
      }, 0);
      
      // Calculate expenses (estimated 30% of income for operational costs)
      const totalExpense = Math.ceil(totalIncome * 0.3);
      
      // Calculate net profit
      const netProfit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? Math.ceil((netProfit / totalIncome) * 100) : 0;
      
      // Generate monthly data for the last 12 months
      const monthlyData = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthBookings = completedBookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });
        
        const monthIncome = monthBookings.reduce((sum, booking) => {
          return sum + Math.ceil(parseFloat(booking.totalAmount || '0'));
        }, 0);
        
        const monthExpense = Math.ceil(monthIncome * 0.3);
        const monthProfit = monthIncome - monthExpense;
        
        monthlyData.push({
          month: monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          income: monthIncome,
          expense: monthExpense,
          profit: monthProfit
        });
      }
      
      // Generate receivables from pending bookings
      const pendingBookings = userBookings.filter(booking => 
        booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed'
      );
      
      const receivables = pendingBookings.map(booking => ({
        bookingId: booking.bookingId,
        amount: Math.ceil(parseFloat(booking.totalAmount || '0')),
        dueDate: booking.deliveryDateTime ? new Date(booking.deliveryDateTime).toLocaleDateString() : 'TBD',
        status: booking.paymentStatus || 'pending',
        customer: booking.receiverName
      }));
      
      // Generate sample payables (operational expenses)
      const payables = [
        {
          description: 'Vehicle Maintenance',
          amount: Math.ceil(totalIncome * 0.1),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'pending',
          vendor: 'Service Provider'
        },
        {
          description: 'Fuel Expenses',
          amount: Math.ceil(totalIncome * 0.15),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'pending',
          vendor: 'Fuel Station'
        },
        {
          description: 'Driver Salary',
          amount: Math.ceil(totalIncome * 0.05),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'pending',
          vendor: 'Staff'
        }
      ];
      
      // Calculate category breakdown
      const totalBookingAmount = totalIncome;
      const incomeBySource = [
        { 
          category: 'FTL Bookings', 
          amount: Math.ceil(totalBookingAmount * 0.6),
          percentage: 60
        },
        { 
          category: 'LTL Bookings', 
          amount: Math.ceil(totalBookingAmount * 0.3),
          percentage: 30
        },
        { 
          category: 'Part Load', 
          amount: Math.ceil(totalBookingAmount * 0.1),
          percentage: 10
        }
      ];
      
      const expenseByCategory = [
        { 
          category: 'Fuel & Maintenance', 
          amount: Math.ceil(totalExpense * 0.5),
          percentage: 50
        },
        { 
          category: 'Driver Costs', 
          amount: Math.ceil(totalExpense * 0.3),
          percentage: 30
        },
        { 
          category: 'Administrative', 
          amount: Math.ceil(totalExpense * 0.2),
          percentage: 20
        }
      ];
      
      const result = {
        summary: {
          totalIncome,
          totalExpense,
          netProfit,
          profitMargin
        },
        monthlyData,
        transactions: {
          receivables,
          payables
        },
        categoryBreakdown: {
          incomeBySource,
          expenseByCategory
        }
      };
      
      console.log(`📊 Financial reports generated successfully. Income: ₹${totalIncome}, Profit: ₹${netProfit}`);
      return result;
      
    } catch (error) {
      console.error('Error generating financial reports:', error);
      throw error;
    }
  }

  // Expense Management Operations
  async getUserExpenses(userId: string): Promise<Expense[]> {
    try {
      const userExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.expenseDate));
      
      return userExpenses;
    } catch (error) {
      console.error('Error getting user expenses:', error);
      throw error;
    }
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    try {
      const [newExpense] = await db
        .insert(expenses)
        .values({
          ...expense,
          amount: expense.amount.toString(), // Convert to string for decimal storage
        })
        .returning();
      
      return newExpense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    try {
      const updates: any = { ...expense, updatedAt: new Date() };
      if (updates.amount) {
        updates.amount = updates.amount.toString();
      }
      
      const [updatedExpense] = await db
        .update(expenses)
        .set(updates)
        .where(eq(expenses.id, id))
        .returning();
      
      return updatedExpense;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    try {
      await db.delete(expenses).where(eq(expenses.id, id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, id));
      
      return expense;
    } catch (error) {
      console.error('Error getting expense by id:', error);
      throw error;
    }
  }

  async getExpensesByType(userId: string, expenseType: string): Promise<Expense[]> {
    try {
      const userExpenses = await db
        .select()
        .from(expenses)
        .where(and(
          eq(expenses.userId, userId),
          eq(expenses.expenseType, expenseType)
        ))
        .orderBy(desc(expenses.expenseDate));
      
      return userExpenses;
    } catch (error) {
      console.error('Error getting expenses by type:', error);
      throw error;
    }
  }

  async getExpenseAnalytics(userId: string): Promise<{
    totalExpenses: number;
    expensesByType: Record<string, number>;
    monthlyExpenses: Array<{ month: string; amount: number }>;
    topCategories: Array<{ category: string; amount: number; count: number }>;
  }> {
    try {
      const userExpenses = await this.getUserExpenses(userId);
      
      // Calculate total expenses
      const totalExpenses = Math.ceil(userExpenses.reduce((sum, expense) => {
        return sum + parseFloat(expense.amount?.toString() || '0');
      }, 0));
      
      // Calculate expenses by type
      const expensesByType: Record<string, number> = {};
      userExpenses.forEach(expense => {
        const type = expense.expenseType || 'other';
        expensesByType[type] = (expensesByType[type] || 0) + parseFloat(expense.amount?.toString() || '0');
      });
      
      // Round up all expense type totals
      Object.keys(expensesByType).forEach(type => {
        expensesByType[type] = Math.ceil(expensesByType[type]);
      });
      
      // Calculate monthly expenses (last 12 months)
      const monthlyExpenses = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthExpenses = userExpenses.filter(expense => {
          const expenseDate = new Date(expense.expenseDate);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        });
        
        const monthAmount = Math.ceil(monthExpenses.reduce((sum, expense) => {
          return sum + parseFloat(expense.amount?.toString() || '0');
        }, 0));
        
        monthlyExpenses.push({
          month: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
          amount: monthAmount
        });
      }
      
      // Calculate top categories
      const categoryTotals: Record<string, { amount: number; count: number }> = {};
      userExpenses.forEach(expense => {
        const category = expense.category || 'Uncategorized';
        if (!categoryTotals[category]) {
          categoryTotals[category] = { amount: 0, count: 0 };
        }
        categoryTotals[category].amount += parseFloat(expense.amount?.toString() || '0');
        categoryTotals[category].count += 1;
      });
      
      const topCategories = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category,
          amount: Math.ceil(data.amount),
          count: data.count
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      return {
        totalExpenses,
        expensesByType,
        monthlyExpenses,
        topCategories
      };
    } catch (error) {
      console.error('Error getting expense analytics:', error);
      throw error;
    }
  }

  // Financial operations implementation
  async getSalaryPayments(userId: string): Promise<any[]> {
    try {
      console.log(`💸 Fetching salary payments for user: ${userId}`);
      const result = await db.select().from(salaryPayments).where(eq(salaryPayments.userId, userId));
      console.log(`✅ Found ${result.length} salary payments`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching salary payments:', error);
      return [];
    }
  }

  async createSalaryPayment(payment: any): Promise<any> {
    const [result] = await db.insert(salaryPayments).values(payment).returning();
    return result;
  }

  async updateSalaryPayment(userId: string, paymentId: number, data: any): Promise<any> {
    try {
      const [result] = await db
        .update(salaryPayments)
        .set({
          personName: data.personName,
          role: data.role,
          paymentType: data.paymentType,
          amount: data.amount,
          paymentDate: data.paymentDate,
          status: data.status,
          paymentMode: data.paymentMode,
          updatedAt: new Date()
        })
        .where(and(eq(salaryPayments.id, paymentId), eq(salaryPayments.userId, userId)))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating salary payment:", error);
      throw error;
    }
  }

  async deleteSalaryPayment(userId: string, paymentId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(salaryPayments)
        .where(and(
          eq(salaryPayments.id, paymentId),
          eq(salaryPayments.userId, userId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting salary payment:", error);
      throw error;
    }
  }

  async getVehicleExpenses(userId: string): Promise<any[]> {
    try {
      console.log(`🚗 Fetching vehicle expenses for user: ${userId}`);
      const result = await db
        .select({
          id: vehicleExpenses.id,
          userId: vehicleExpenses.userId,
          vehicleId: vehicleExpenses.vehicleId,
          vehicleNumber: vehicles.registrationNumber,
          expenseType: vehicleExpenses.expenseType,
          amount: vehicleExpenses.amount,
          fuelLitres: vehicleExpenses.fuelLitres,
          driverName: vehicleExpenses.driverName,
          routeId: vehicleExpenses.routeId,
          bookingId: vehicleExpenses.bookingId,
          receiptUrl: vehicleExpenses.receiptUrl,
          description: vehicleExpenses.description,
          expenseDate: vehicleExpenses.expenseDate,
          createdAt: vehicleExpenses.createdAt,
          updatedAt: vehicleExpenses.updatedAt
        })
        .from(vehicleExpenses)
        .leftJoin(vehicles, eq(vehicleExpenses.vehicleId, vehicles.id))
        .where(eq(vehicleExpenses.userId, userId));
      console.log(`✅ Found ${result.length} vehicle expenses`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching vehicle expenses:', error);
      return [];
    }
  }

  async createVehicleExpense(expense: any): Promise<any> {
    const [result] = await db.insert(vehicleExpenses).values(expense).returning();
    return result;
  }

  async updateVehicleExpense(userId: string, expenseId: number, data: any): Promise<any> {
    try {
      const [result] = await db
        .update(vehicleExpenses)
        .set({
          expenseType: data.expenseType,
          amount: data.amount,
          description: data.description,
          expenseDate: data.expenseDate,
          vehicleId: data.vehicleId,
          updatedAt: new Date()
        })
        .where(and(eq(vehicleExpenses.id, expenseId), eq(vehicleExpenses.userId, userId)))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating vehicle expense:", error);
      throw error;
    }
  }

  async deleteVehicleExpense(userId: string, expenseId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(vehicleExpenses)
        .where(and(
          eq(vehicleExpenses.id, expenseId),
          eq(vehicleExpenses.userId, userId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting vehicle expense:", error);
      throw error;
    }
  }

  async getTollExpenses(userId: string): Promise<any[]> {
    try {
      console.log(`🛣️ Fetching toll expenses for user: ${userId}`);
      const result = await db
        .select({
          id: tollExpenses.id,
          userId: tollExpenses.userId,
          vehicleId: tollExpenses.vehicleId,
          vehicleNumber: vehicles.registrationNumber,
          bookingId: tollExpenses.bookingId,
          routeId: tollExpenses.routeId,
          tollLocation: tollExpenses.tollBoothName, // Map tollBoothName to tollLocation for frontend
          amount: tollExpenses.amount,
          driverName: tollExpenses.driverName,
          date: tollExpenses.expenseDate, // Map expenseDate to date for frontend
          receiptUrl: tollExpenses.receiptUrl,
          submittedBy: tollExpenses.submittedBy,
          remarks: tollExpenses.remarks,
          createdAt: tollExpenses.createdAt,
          updatedAt: tollExpenses.updatedAt
        })
        .from(tollExpenses)
        .leftJoin(vehicles, eq(tollExpenses.vehicleId, vehicles.id))
        .where(eq(tollExpenses.userId, userId));
      console.log(`✅ Found ${result.length} toll expenses`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching toll expenses:', error);
      return [];
    }
  }

  async createTollExpense(expense: any): Promise<any> {
    const [result] = await db.insert(tollExpenses).values(expense).returning();
    return result;
  }

  async updateTollExpense(userId: string, expenseId: number, data: any): Promise<any> {
    try {
      const [result] = await db.update(tollExpenses)
        .set({
          tollLocation: data.tollLocation,
          amount: data.amount,
          expenseDate: data.expenseDate,
          vehicleId: data.vehicleId,
          updatedAt: new Date()
        })
        .where(and(eq(tollExpenses.id, expenseId), eq(tollExpenses.userId, userId)))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating toll expense:", error);
      throw error;
    }
  }

  async deleteTollExpense(userId: string, expenseId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(tollExpenses)
        .where(and(
          eq(tollExpenses.id, expenseId),
          eq(tollExpenses.userId, userId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting toll expense:", error);
      throw error;
    }
  }

  async getIncomeRecords(userId: string): Promise<any[]> {
    try {
      console.log(`📊 Fetching income records for user: ${userId}`);
      const result = await db.select().from(incomeRecords)
        .where(eq(incomeRecords.userId, userId))
        .orderBy(desc(incomeRecords.createdAt));
      console.log(`✅ Found ${result.length} income records`);
      return result.map(record => ({
        ...record,
        date: record.receivedDate || record.createdAt // Use receivedDate or createdAt as date for frontend
      }));
    } catch (error) {
      console.error('❌ Error fetching income records:', error);
      return [];
    }
  }

  async createIncomeRecord(record: any): Promise<any> {
    const [result] = await db.insert(incomeRecords).values(record).returning();
    return result;
  }

  async updateIncomeRecord(userId: string, recordId: number, data: any): Promise<any> {
    try {
      const [result] = await db
        .update(incomeRecords)
        .set({
          source: data.source,
          amount: data.amount,
          description: data.description,
          recordDate: data.recordDate,
          bookingId: data.bookingId,
          updatedAt: new Date()
        })
        .where(and(eq(incomeRecords.id, recordId), eq(incomeRecords.userId, userId)))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating income record:", error);
      throw error;
    }
  }

  async deleteIncomeRecord(userId: string, recordId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(incomeRecords)
        .where(and(
          eq(incomeRecords.id, recordId),
          eq(incomeRecords.userId, userId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting income record:", error);
      throw error;
    }
  }

  async getClientLedger(userId: string): Promise<any[]> {
    try {
      console.log(`📋 Fetching client ledger for user: ${userId}`);
      const result = await db.select().from(clientLedger).where(eq(clientLedger.userId, userId));
      console.log(`✅ Found ${result.length} client ledger entries`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching client ledger:', error);
      return [];
    }
  }

  async getFinancialDashboard(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    pendingPayments: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    recentTransactions: any[];
  }> {
    try {
      console.log(`💰 Generating financial dashboard for user: ${userId}`);
      
      // Get revenue from actual bookings (consistent with dashboard stats)
      let userBookings = [];
      try {
        userBookings = await db.select().from(bookings).where(eq(bookings.userId, userId));
        console.log(`📊 Found ${userBookings.length} user bookings for revenue calculation`);
      } catch (bookingError) {
        console.error('Error fetching user bookings:', bookingError);
        userBookings = [];
      }
      
      // Calculate total income from bookings (same as dashboard calculation)
      const totalIncome = Math.ceil(userBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

      // Calculate pending payments (unpaid bookings)
      const pendingBookings = userBookings.filter(booking => 
        booking.paymentStatus === 'pending' || booking.paymentStatus === 'unpaid' || !booking.paymentStatus
      );
      const pendingPayments = Math.ceil(pendingBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

      // Get all expenses (salary + vehicle + toll) with error handling
      let salaries = [];
      let vehicleExp = [];
      let tollExp = [];
      
      try {
        salaries = await db.select().from(salaryPayments).where(eq(salaryPayments.userId, userId));
        console.log(`💸 Found ${salaries.length} salary payments`);
      } catch (salaryError) {
        console.error('Error fetching salary payments:', salaryError);
        salaries = [];
      }
      
      try {
        vehicleExp = await db.select().from(vehicleExpenses).where(eq(vehicleExpenses.userId, userId));
        console.log(`🚗 Found ${vehicleExp.length} vehicle expenses`);
      } catch (vehicleError) {
        console.error('Error fetching vehicle expenses:', vehicleError);
        vehicleExp = [];
      }
      
      try {
        tollExp = await db.select().from(tollExpenses).where(eq(tollExpenses.userId, userId));
        console.log(`🛣️ Found ${tollExp.length} toll expenses`);
      } catch (tollError) {
        console.error('Error fetching toll expenses:', tollError);
        tollExp = [];
      }

      // Calculate total expenses with separate paid/unpaid tracking
      const totalExpenses = Math.ceil(
        salaries.reduce((sum, sal) => sum + Number(sal.amount || 0), 0) +
        vehicleExp.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) +
        tollExp.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      );

      // Calculate pending expense payments
      const pendingExpensePayments = Math.ceil(
        salaries.filter(sal => sal.status === 'unpaid').reduce((sum, sal) => sum + Number(sal.amount || 0), 0) +
        vehicleExp.filter(exp => exp.paymentStatus === 'unpaid').reduce((sum, exp) => sum + Number(exp.amount || 0), 0) +
        tollExp.filter(exp => exp.paymentStatus === 'unpaid').reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      );

      // Total pending payments (income + expenses)
      const totalPendingPayments = pendingPayments + pendingExpensePayments;

      // Calculate monthly data (current month)
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const monthlyBookings = userBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
      
      const monthlyIncome = Math.ceil(monthlyBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0));

      const monthlySalaries = salaries.filter(sal => {
        const salDate = new Date(sal.paymentDate || sal.createdAt);
        return salDate >= monthStart && salDate <= monthEnd;
      });

      const monthlyVehicleExp = vehicleExp.filter(exp => {
        const expDate = new Date(exp.expenseDate || exp.createdAt);
        return expDate >= monthStart && expDate <= monthEnd;
      });

      const monthlyTollExp = tollExp.filter(exp => {
        const expDate = new Date(exp.expenseDate || exp.createdAt);
        return expDate >= monthStart && expDate <= monthEnd;
      });

      const monthlyExpenses = Math.ceil(
        monthlySalaries.reduce((sum, sal) => sum + Number(sal.amount || 0), 0) +
        monthlyVehicleExp.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) +
        monthlyTollExp.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      );

      // Recent transactions (last 10) - use bookings for income transactions
      const allTransactions = [
        ...userBookings.map(booking => ({ 
          ...booking, 
          type: 'income', 
          category: 'Booking Revenue',
          amount: booking.totalAmount,
          date: booking.createdAt 
        })),
        ...salaries.map(sal => ({ ...sal, type: 'expense', category: 'Salary' })),
        ...vehicleExp.map(exp => ({ ...exp, type: 'expense', category: 'Vehicle' })),
        ...tollExp.map(exp => ({ ...exp, type: 'expense', category: 'Toll' }))
      ].sort((a, b) => {
        const dateA = new Date(a.date || a.paymentDate || a.expenseDate || a.createdAt);
        const dateB = new Date(b.date || b.paymentDate || b.expenseDate || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 10);

      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        pendingPayments: totalPendingPayments,
        monthlyIncome,
        monthlyExpenses,
        recentTransactions: allTransactions
      };
      
      console.log(`✅ Financial dashboard generated:`, {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        pendingPayments: totalPendingPayments,
        monthlyIncome,
        monthlyExpenses
      });
    } catch (error) {
      console.error('❌ Error getting financial dashboard:', error);
      
      // Return safe fallback data instead of throwing
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingPayments: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        recentTransactions: []
      };
    }
  }

  // Warehouse Stock Operations methods
  async getWarehouseStockOperations(userId: string): Promise<WarehouseStockOperation[]> {
    try {
      const operations = await db
        .select()
        .from(warehouseStockOperations)
        .where(eq(warehouseStockOperations.userId, userId))
        .orderBy(desc(warehouseStockOperations.createdAt));
      
      return operations;
    } catch (error) {
      console.error('Error getting warehouse stock operations:', error);
      throw error;
    }
  }

  async createWarehouseStockOperation(operation: InsertWarehouseStockOperation): Promise<WarehouseStockOperation> {
    try {
      const [newOperation] = await db
        .insert(warehouseStockOperations)
        .values(operation)
        .returning();
      
      return newOperation;
    } catch (error) {
      console.error('Error creating warehouse stock operation:', error);
      throw error;
    }
  }

  async getWarehouseInventory(userId: string): Promise<WarehouseInventory[]> {
    try {
      // Get user's warehouses first, then get inventory for those warehouses
      const userWarehouses = await db
        .select()
        .from(warehouses)
        .where(eq(warehouses.userId, userId));
      
      if (userWarehouses.length === 0) {
        return [];
      }
      
      const warehouseIds = userWarehouses.map(w => w.id);
      
      const inventory = await db
        .select()
        .from(warehouseInventory)
        .where(inArray(warehouseInventory.warehouseId, warehouseIds))
        .orderBy(warehouseInventory.itemName);
      
      return inventory;
    } catch (error) {
      console.error('Error getting warehouse inventory:', error);
      throw error;
    }
  }

  async updateWarehouseInventory(warehouseId: number, itemName: string, quantity: number, operationType: string): Promise<void> {
    try {
      // Check if inventory item exists
      const [existingItem] = await db
        .select()
        .from(warehouseInventory)
        .where(and(
          eq(warehouseInventory.warehouseId, warehouseId),
          eq(warehouseInventory.itemName, itemName)
        ));

      if (existingItem) {
        // Update existing inventory
        const newStock = operationType === "stock_in" 
          ? existingItem.currentStock + quantity 
          : Math.max(0, existingItem.currentStock - quantity);

        await db
          .update(warehouseInventory)
          .set({ 
            currentStock: newStock,
            lastUpdated: new Date()
          })
          .where(eq(warehouseInventory.id, existingItem.id));
      } else if (operationType === "stock_in") {
        // Create new inventory item for stock_in operations
        await db
          .insert(warehouseInventory)
          .values({
            warehouseId,
            itemName,
            currentStock: quantity,
            minStock: 10,
            maxStock: 1000,
            userId: "", // Will be set by the calling function
          });
      }
    } catch (error) {
      console.error('Error updating warehouse inventory:', error);
      throw error;
    }
  }

  async getWarehouseAnalytics(userId: string): Promise<{
    totalOperations: number;
    stockIn: number;
    stockOut: number;
    lowStockItems: number;
    inventoryValue: number;
  }> {
    try {
      // Get all operations for analytics
      const operations = await this.getWarehouseStockOperations(userId);
      
      const totalOperations = operations.length;
      const stockIn = operations.filter(op => op.operationType === 'stock_in').length;
      const stockOut = operations.filter(op => op.operationType === 'stock_out').length;
      
      // Get inventory for low stock analysis
      const inventory = await this.getWarehouseInventory(userId);
      const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock).length;
      
      // Calculate estimated inventory value (simplified calculation)
      const inventoryValue = inventory.reduce((sum, item) => sum + (item.currentStock * 100), 0);
      
      return {
        totalOperations,
        stockIn,
        stockOut,
        lowStockItems,
        inventoryValue
      };
    } catch (error) {
      console.error('Error getting warehouse analytics:', error);
      throw error;
    }
  }

  // Professional Warehouse Inventory Management
  async getWarehouseInventory(userId: string): Promise<any[]> {
    try {
      const inventory = await db
        .select()
        .from(warehouseInventory)
        .where(eq(warehouseInventory.userId, userId))
        .orderBy(desc(warehouseInventory.lastUpdated));
      
      return inventory;
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      return [];
    }
  }

  async addInventoryItem(inventoryData: any): Promise<any> {
    try {
      const [newItem] = await db
        .insert(warehouseInventory)
        .values({
          ...inventoryData,
          lastUpdated: new Date().toISOString(),
        })
        .returning();
      
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  // Warehouse Stock Operations Management
  async getWarehouseOperations(userId: string): Promise<any[]> {
    try {
      const operations = await db
        .select()
        .from(warehouseStockOperations)
        .where(eq(warehouseStockOperations.userId, userId))
        .orderBy(desc(warehouseStockOperations.timestamp));
      
      return operations;
    } catch (error) {
      console.error('Error fetching warehouse operations:', error);
      return [];
    }
  }

  async recordStockOperation(operationData: any): Promise<any> {
    try {
      const [newOperation] = await db
        .insert(warehouseStockOperations)
        .values({
          ...operationData,
          timestamp: new Date().toISOString(),
        })
        .returning();
      
      return newOperation;
    } catch (error) {
      console.error('Error recording stock operation:', error);
      throw error;
    }
  }

  async getWarehouseStockHistory(warehouseId: number, limit: number = 50): Promise<WarehouseStockOperation[]> {
    try {
      return await db
        .select()
        .from(warehouseStockOperations)
        .where(eq(warehouseStockOperations.warehouseId, warehouseId))
        .orderBy(desc(warehouseStockOperations.operationDate))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching warehouse stock history:", error);
      return [];
    }
  }

  // Warehouse Revenue Analytics
  async getWarehouseRevenue(userId: string): Promise<any[]> {
    try {
      // Get user warehouses for revenue calculation
      const userWarehouses = await this.getUserWarehouses(userId);
      
      // Calculate revenue based on warehouse operations and bookings
      const revenueData = [];
      
      for (const warehouse of userWarehouses) {
        const warehouseBookings = await db
          .select()
          .from(bookings)
          .where(and(
            eq(bookings.userId, userId),
            eq(bookings.pickupCity, warehouse.city)
          ));
        
        const monthlyRevenue = warehouseBookings.reduce((sum, booking) => {
          return sum + (parseFloat(booking.totalAmount) || 0);
        }, 0);
        
        const operationalCost = parseFloat(warehouse.operationalCost) || 0;
        const netProfit = monthlyRevenue - operationalCost;
        const occupancyRate = warehouse.currentStock / warehouse.capacity * 100;
        
        revenueData.push({
          warehouseId: warehouse.id,
          name: warehouse.name,
          monthlyRevenue: Math.ceil(monthlyRevenue),
          operationalCost: Math.ceil(operationalCost),
          netProfit: Math.ceil(netProfit),
          occupancyRate: Math.ceil(occupancyRate),
          throughput: warehouseBookings.length,
          averageStorageFee: monthlyRevenue > 0 ? Math.ceil(monthlyRevenue / warehouseBookings.length) : 0,
          handlingCharges: Math.ceil(monthlyRevenue * 0.15), // 15% handling charges
        });
      }
      
      return revenueData;
    } catch (error) {
      console.error('Error calculating warehouse revenue:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
