import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
// export const sessions = pgTable(
//   "sessions",
//   {
//     sid: varchar("sid").primaryKey(),
//     sess: jsonb("sess").notNull(),
//     expire: timestamp("expire").notNull(),
//   },
//   (table) => [index("IDX_session_expire").on(table.expire)],
// );

// User storage table 
export const users: any = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  hashedPassword: varchar("hashed_password"),
  profileImageUrl: varchar("profile_image_url"),
  officeName: varchar("office_name"),
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  gstNumber: varchar("gst_number"),
  role: varchar("role", { enum: ["transporter", "distributor", "warehouse", "admin", "office"] }).default("transporter"),
  subscriptionPlan: varchar("subscription_plan", { enum: ["starter", "professional", "enterprise"] }),
  subscriptionStatus: varchar("subscription_status", { enum: ["trial", "active", "expired", "cancelled"] }).default("trial"),
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date"),
  paymentStatus: varchar("payment_status", { enum: ["pending", "paid", "failed"] }).default("pending"),
  enterpriseApprovalStatus: varchar("enterprise_approval_status", { enum: ["pending", "approved", "rejected"] }),
  enterpriseRequestDate: timestamp("enterprise_request_date"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  customCommissionRate: decimal("custom_commission_rate", { precision: 5, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.00"),
  isFreeAccess: boolean("is_free_access").default(false),
  isBlocked: boolean("is_blocked").default(false),
  isActive: boolean("is_active").default(true),
  status: varchar("status").default("active"),
  customPricing: decimal("custom_pricing", { precision: 10, scale: 2 }),
  billingPercentage: decimal("billing_percentage", { precision: 5, scale: 2 }),
  parentUserId: varchar("parent_user_id").references((): any => users.id),
  createdBy: varchar("created_by").references((): any => users.id),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  pinCode: varchar("pin_code").notNull(),
  capacity: integer("capacity").notNull(),
  currentStock: integer("current_stock").default(0),
  maxCapacity: integer("max_capacity"),
  warehouseType: varchar("warehouse_type", { enum: ["distribution", "storage", "fulfillment", "cold_storage", "bonded"] }).default("storage"),
  operationalStatus: varchar("operational_status", { enum: ["operational", "maintenance", "closed", "under_construction"] }).default("operational"),
  contactPerson: varchar("contact_person"),
  phone: varchar("phone"),
  email: varchar("email"),
  managerName: varchar("manager_name"),
  establishedDate: timestamp("established_date"),
  certifications: text("certifications"),
  facilities: text("facilities"),
  workingHours: varchar("working_hours").default("24/7"),
  securityLevel: varchar("security_level", { enum: ["basic", "medium", "high", "maximum"] }).default("medium"),
  insuranceDetails: text("insurance_details"),
  monthlyOperationalCost: decimal("monthly_operational_cost", { precision: 10, scale: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
  lastInspectionDate: timestamp("last_inspection_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id),
  registrationNumber: varchar("registration_number").notNull().unique(),
  vehicleType: varchar("vehicle_type").notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  driverName: varchar("driver_name"),
  driverPhone: varchar("driver_phone"),
  driverLicense: varchar("driver_license"),
  gpsDeviceId: varchar("gps_device_id"),
  gpsImei: varchar("gps_imei"),
  gpsSimNumber: varchar("gps_sim_number"),
  gpsStatus: varchar("gps_status").default("inactive"),
  status: varchar("status", { enum: ["available", "in_transit", "maintenance"] }).default("available"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id),
  bookingId: varchar("booking_id").notNull().unique(),
  bookingType: varchar("booking_type", { enum: ["FTL", "LTL", "part_load"] }).notNull(),
  
  // Cargo details
  weight: decimal("weight", { precision: 10, scale: 2 }),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  cargoDescription: text("cargo_description"),
  itemCount: integer("item_count").default(1),
  
  // Pickup details
  pickupAddress: text("pickup_address").notNull(),
  pickupCity: varchar("pickup_city").notNull(),
  pickupPinCode: varchar("pickup_pin_code").notNull(),
  pickupDateTime: timestamp("pickup_date_time").notNull(),
  
  // Delivery details
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: varchar("delivery_city").notNull(),
  deliveryPinCode: varchar("delivery_pin_code").notNull(),
  deliveryDateTime: timestamp("delivery_date_time"),
  
  // Sender details
  senderName: varchar("sender_name").notNull(),
  senderPhone: varchar("sender_phone").notNull(),
  senderEmail: varchar("sender_email"),
  senderGST: varchar("sender_gst"),
  
  // Receiver details
  receiverName: varchar("receiver_name").notNull(),
  receiverPhone: varchar("receiver_phone").notNull(),
  receiverEmail: varchar("receiver_email"),
  receiverGST: varchar("receiver_gst"),
  
  // Pricing
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  handlingCharges: decimal("handling_charges", { precision: 10, scale: 2 }).default("0"),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment details
  paymentMethod: varchar("payment_method", { enum: ["cash", "online", "pending", "free"] }).default("pending"),
  paymentStatus: varchar("payment_status", { enum: ["paid", "pending", "failed", "free"] }).default("pending"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  paymentDate: timestamp("payment_date"),
  transactionId: varchar("transaction_id"),
  paymentNotes: text("payment_notes"),
  
  // Status and tracking
  status: varchar("status", { enum: ["booked", "picked", "in_transit", "delivered", "cancelled"] }).default("booked"),
  vehicleId: integer("vehicle_id").references((): any => vehicles.id),
  waybillNumber: varchar("waybill_number"),
  trackingNumber: varchar("tracking_number"),
  
  // Additional fields
  promoCode: varchar("promo_code"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trackingEvents = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references((): any => bookings.id),
  status: varchar("status").notNull(),
  location: varchar("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  timestamp: timestamp("timestamp").defaultNow(),
  notes: text("notes"),
  
  // Enhanced tracking fields
  estimatedArrival: timestamp("estimated_arrival"),
  actualSpeed: decimal("actual_speed", { precision: 5, scale: 2 }), // km/h
  distanceRemaining: decimal("distance_remaining", { precision: 8, scale: 2 }), // km
  routeDeviation: boolean("route_deviation").default(false),
  driverName: varchar("driver_name"),
  driverPhone: varchar("driver_phone"),
  vehicleNumber: varchar("vehicle_number"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }), // for cold chain
  isLiveUpdate: boolean("is_live_update").default(false),
  batteryLevel: integer("battery_level"), // tracking device battery
  signalStrength: integer("signal_strength"), // GPS signal quality
});

// Live location tracking table
export const liveTracking = pgTable("live_tracking", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references((): any => bookings.id),
  vehicleId: integer("vehicle_id").references((): any => vehicles.id),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }).notNull(),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }).notNull(),
  currentSpeed: decimal("current_speed", { precision: 5, scale: 2 }), // km/h
  heading: decimal("heading", { precision: 5, scale: 2 }), // degrees
  altitude: decimal("altitude", { precision: 7, scale: 2 }), // meters
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // meters
  lastUpdate: timestamp("last_update").defaultNow(),
  isActive: boolean("is_active").default(true),
  routeProgress: decimal("route_progress", { precision: 5, scale: 2 }), // percentage
  estimatedArrival: timestamp("estimated_arrival"),
  nextCheckpoint: varchar("next_checkpoint"),
  distanceToDestination: decimal("distance_to_destination", { precision: 8, scale: 2 }),
});

// Delivery notifications table
export const deliveryNotifications = pgTable("delivery_notifications", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references((): any => bookings.id),
  userId: varchar("user_id").references((): any => users.id),
  type: varchar("type", { 
    enum: ["pickup_scheduled", "picked_up", "in_transit", "out_for_delivery", "delivered", "delayed", "exception"] 
  }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  channel: varchar("channel", { enum: ["email", "sms", "push", "whatsapp"] }).notNull(),
  status: varchar("status", { enum: ["sent", "delivered", "failed", "pending"] }).default("pending"),
});

// Route monitoring table
export const routeMonitoring = pgTable("route_monitoring", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references((): any => bookings.id),
  plannedRoute: text("planned_route"), // JSON string of route coordinates
  actualRoute: text("actual_route"), // JSON string of actual coordinates
  optimizedRoute: text("optimized_route"), // AI-optimized route
  deviationDistance: decimal("deviation_distance", { precision: 8, scale: 2 }), // km
  deviationTime: integer("deviation_time"), // minutes
  trafficConditions: text("traffic_conditions"), // JSON traffic data
  weatherConditions: text("weather_conditions"), // JSON weather data
  routeScore: decimal("route_score", { precision: 3, scale: 2 }), // efficiency score
  fuelConsumption: decimal("fuel_consumption", { precision: 6, scale: 2 }), // liters
  carbonFootprint: decimal("carbon_footprint", { precision: 8, scale: 3 }), // kg CO2
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references((): any => bookings.id),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  gstNumber: varchar("gst_number"),
  invoiceDate: date("invoice_date").defaultNow(),
  dueDate: date("due_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { enum: ["draft", "sent", "paid", "overdue"] }).default("draft"),
  pdfUrl: varchar("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").default(1), // months
  trialDays: integer("trial_days").default(7), // trial period in days
  features: text("features").notNull(),
  maxBookings: integer("max_bookings").default(100),
  maxVehicles: integer("max_vehicles").default(10),
  maxAgents: integer("max_agents").default(5),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  discountPercentage: integer("discount_percentage").default(0),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id),
  planId: integer("plan_id").references((): any => subscriptionPlans.id),
  planType: varchar("plan_type", { enum: ["starter", "pro", "enterprise"] }).notNull(),
  status: varchar("status", { enum: ["active", "cancelled", "expired"] }).default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  paymentMethod: varchar("payment_method"),
  paymentId: varchar("payment_id"),
  isRecurring: boolean("is_recurring").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact Form Submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  company: varchar("company"),
  message: text("message").notNull(),
  status: varchar("status").notNull().default("new"), // new, in_progress, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Announcements for landing page notification bar
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("info"), // info, warning, success, urgent
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  targetAudience: varchar("target_audience").default("all"), // all, premium, trial, inactive
  priority: integer("priority").default(1), // 1 = high, 2 = medium, 3 = low
  backgroundColor: varchar("background_color").default("#8427d7"),
  textColor: varchar("text_color").default("#ffffff"),
  showIcon: boolean("show_icon").default(true),
  imageUrl: varchar("image_url"), // Optional image for announcement
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  category: varchar("category").notNull().default("general"), // general, technical, billing, feature
  assignedTo: varchar("assigned_to").references((): any => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Support Ticket Responses
export const ticketResponses = pgTable("ticket_responses", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references((): any => supportTickets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references((): any => users.id),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references((): any => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("info"), // info, success, warning, error, message
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: varchar("action_url"),
  relatedId: integer("related_id"), // Related ticket ID or message ID
  senderUserId: varchar("sender_user_id").references((): any => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Messages between admin and users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull().references((): any => users.id),
  toUserId: varchar("to_user_id").notNull().references((): any => users.id),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  relatedTicketId: integer("related_ticket_id").references((): any => supportTickets.id),
  isRead: boolean("is_read").notNull().default(false),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Warehouse Stock Operations
export const warehouseStockOperations = pgTable("warehouse_stock_operations", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references((): any => warehouses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references((): any => users.id),
  operationType: varchar("operation_type", { enum: ["stock_in", "stock_out", "transfer", "adjustment"] }).notNull(),
  itemName: varchar("item_name").notNull(),
  itemCategory: varchar("item_category"),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit").default("units"),
  fromLocation: varchar("from_location"),
  toLocation: varchar("to_location"),
  reason: text("reason"),
  notes: text("notes"),
  status: varchar("status", { enum: ["completed", "pending", "cancelled", "in_transit"] }).default("completed"),
  operatedBy: varchar("operated_by").notNull(),
  operationDate: timestamp("operation_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Warehouse Inventory
export const warehouseInventory = pgTable("warehouse_inventory", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references((): any => warehouses.id, { onDelete: "cascade" }),
  itemName: varchar("item_name").notNull(),
  itemCategory: varchar("item_category"),
  currentStock: integer("current_stock").default(0),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock").default(1000),
  unit: varchar("unit").default("units"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: varchar("updated_by").references((): any => users.id),
});

// System Settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references((): any => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Salary & Commission Payments
export const salaryPayments = pgTable("salary_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references((): any => users.id, { onDelete: "cascade" }),
  personName: varchar("person_name").notNull(),
  role: varchar("role", { enum: ["driver", "agent", "loader", "sub_admin"] }).notNull(),
  paymentType: varchar("payment_type", { enum: ["salary", "commission"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  bookingId: integer("booking_id").references((): any => bookings.id),
  paymentDate: date("payment_date").notNull(),
  status: varchar("status", { enum: ["paid", "unpaid"] }).notNull().default("unpaid"),
  paymentMode: varchar("payment_mode", { enum: ["cash", "upi", "bank_transfer"] }).notNull(),
  remarks: text("remarks"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency", { enum: ["monthly", "weekly", "daily"] }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Vehicle Expenses
export const vehicleExpenses = pgTable("vehicle_expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references((): any => users.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references((): any => vehicles.id, { onDelete: "cascade" }),
  expenseType: varchar("expense_type", { enum: ["fuel", "service", "maintenance", "insurance", "tyres", "other"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fuelLitres: decimal("fuel_litres", { precision: 8, scale: 2 }),
  driverName: varchar("driver_name"),
  routeId: varchar("route_id"),
  bookingId: integer("booking_id").references((): any => bookings.id),
  receiptUrl: varchar("receipt_url"),
  description: text("description"),
  expenseDate: date("expense_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Toll & Travel Expenses
export const tollExpenses = pgTable("toll_expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references((): any => users.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references((): any => vehicles.id, { onDelete: "cascade" }),
  bookingId: integer("booking_id").references((): any => bookings.id),
  routeId: varchar("route_id"),
  tollBoothName: varchar("toll_booth_name"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  driverName: varchar("driver_name"),
  expenseDate: date("expense_date").notNull(),
  receiptUrl: varchar("receipt_url"),
  submittedBy: varchar("submitted_by"), // driver or admin
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Income Tracking
export const incomeRecords = pgTable("income_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references((): any => users.id, { onDelete: "cascade" }),
  bookingId: integer("booking_id").references((): any => bookings.id),
  clientName: varchar("client_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  incomeType: varchar("income_type", { enum: ["trip_payment", "advance", "penalty", "booking_income", "other"] }).notNull(),
  paymentStatus: varchar("payment_status", { enum: ["received", "pending", "overdue"] }).notNull(),
  invoiceId: varchar("invoice_id"),
  dueDate: date("due_date"),
  receivedDate: date("received_date"),
  paymentMode: varchar("payment_mode", { enum: ["cash", "upi", "bank_transfer", "cheque"] }),
  description: text("description"),
  source: varchar("source"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Client Ledger
export const clientLedger = pgTable("client_ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references((): any => users.id, { onDelete: "cascade" }),
  clientName: varchar("client_name").notNull(),
  clientPhone: varchar("client_phone"),
  clientEmail: varchar("client_email"),
  totalTrips: integer("total_trips").default(0),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0"),
  totalPaid: decimal("total_paid", { precision: 12, scale: 2 }).default("0"),
  totalPending: decimal("total_pending", { precision: 12, scale: 2 }).default("0"),
  lastTripDate: date("last_trip_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User Theme Settings (User Dashboard + Agent Dashboard)
export const userThemeSettings = pgTable("user_theme_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id).notNull().unique(),
  primaryColor: varchar("primary_color").default("#3094d1"),
  secondaryColor: varchar("secondary_color").default("#e7a293"),
  accentColor: varchar("accent_color").default("#cbdc65"),
  logoUrl: varchar("logo_url"), // Custom logo URL for user dashboard
  theme: varchar("theme", { enum: ["light", "dark", "system"] }).default("system"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Super Admin Theme Settings (Landing Website + Super Admin Pages)
export const superAdminThemeSettings = pgTable("super_admin_theme_settings", {
  id: serial("id").primaryKey(),
  primaryColor: varchar("primary_color").default("#3b82f6"),
  secondaryColor: varchar("secondary_color").default("#64748b"),
  accentColor: varchar("accent_color").default("#8b5cf6"),
  logoUrl: varchar("logo_url"), // Global website logo URL
  theme: varchar("theme", { enum: ["light", "dark"] }).default("light"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table for tracking business expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references((): any => users.id).notNull(),
  expenseType: varchar("expense_type", { 
    enum: ["salary", "commission", "fuel", "toll", "maintenance", "insurance", "office", "other"] 
  }).notNull(),
  category: varchar("category").notNull(), // Team Member Name, Agent Name, Vehicle Number, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  vehicleId: integer("vehicle_id").references((): any => vehicles.id), // For vehicle-related expenses
  agentId: varchar("agent_id").references((): any => users.id), // For agent commission
  paymentMethod: varchar("payment_method", { enum: ["cash", "bank_transfer", "upi", "cheque", "card"] }).default("cash"),
  paymentStatus: varchar("payment_status", { enum: ["paid", "pending", "cancelled"] }).default("paid"),
  receiptUrl: varchar("receipt_url"), // For uploading receipts
  notes: text("notes"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency", { enum: ["daily", "weekly", "monthly", "yearly"] }),
  tags: text("tags"), // JSON array of tags for better categorization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }: any) => ({
  warehouses: many(warehouses),
  vehicles: many(vehicles),
  bookings: many(bookings),
  subscriptions: many(subscriptions),
}));

export const warehousesRelations = relations(warehouses, ({ one }: any) => ({
  user: one(users, { fields: [warehouses.userId], references: [users.id] }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }: any) => ({
  user: one(users, { fields: [vehicles.userId], references: [users.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }: any) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [bookings.vehicleId], references: [vehicles.id] }),
  trackingEvents: many(trackingEvents),
  invoices: many(invoices),
}));

export const trackingEventsRelations = relations(trackingEvents, ({ one }: any) => ({
  booking: one(bookings, { fields: [trackingEvents.bookingId], references: [bookings.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }: any) => ({
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }: any) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }: any) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [subscriptions.planId], references: [subscriptionPlans.id] }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }: any) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  responses: many(ticketResponses),
}));

export const ticketResponsesRelations = relations(ticketResponses, ({ one }: any) => ({
  ticket: one(supportTickets, {
    fields: [ticketResponses.ticketId],
    references: [supportTickets.id],
  }),
  user: one(users, {
    fields: [ticketResponses.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }: any) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }: any) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [expenses.vehicleId],
    references: [vehicles.id],
  }),
  agent: one(users, {
    fields: [expenses.agentId],
    references: [users.id],
  }),
}));

export const salaryPaymentsRelations = relations(salaryPayments, ({ one }: any) => ({
  user: one(users, {
    fields: [salaryPayments.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [salaryPayments.bookingId],
    references: [bookings.id],
  }),
}));

export const vehicleExpensesRelations = relations(vehicleExpenses, ({ one }: any) => ({
  user: one(users, {
    fields: [vehicleExpenses.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [vehicleExpenses.vehicleId],
    references: [vehicles.id],
  }),
  booking: one(bookings, {
    fields: [vehicleExpenses.bookingId],
    references: [bookings.id],
  }),
}));

export const tollExpensesRelations = relations(tollExpenses, ({ one }: any) => ({
  user: one(users, {
    fields: [tollExpenses.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [tollExpenses.vehicleId],
    references: [vehicles.id],
  }),
  booking: one(bookings, {
    fields: [tollExpenses.bookingId],
    references: [bookings.id],
  }),
}));

export const incomeRecordsRelations = relations(incomeRecords, ({ one }: any) => ({
  user: one(users, {
    fields: [incomeRecords.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [incomeRecords.bookingId],
    references: [bookings.id],
  }),
}));

export const clientLedgerRelations = relations(clientLedger, ({ one }: any) => ({
  user: one(users, {
    fields: [clientLedger.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  customPricing: true,
  status: true,
  isBlocked: true
});
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  maxCapacity: z.number().optional(),
  currentStock: z.number().min(0).optional(),
  monthlyOperationalCost: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true }).extend({
  registrationNumber: z.string().min(1, "Registration number is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  capacity: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  driverLicense: z.string().optional(),
});
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    weight: z.number().optional(),
    distance: z.number().optional(),
    handlingCharges: z.number().min(0).default(0),
    deliveryDateTime: z.union([z.string(), z.date()]).optional().nullable().transform((val: any) => {
      if (!val) return null;
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
    pickupDateTime: z.union([z.string(), z.date()]).transform((val: any) => {
      if (typeof val === 'string') return new Date(val);
      return val;
    }),
    itemCount: z.number().min(1).default(1),
    paymentMethod: z.enum(["cash", "online", "pending", "free"]).default("pending"),
    paymentStatus: z.enum(["paid", "pending", "failed", "free"]).default("pending"),
    paidAmount: z.string().default("0"),
    transactionId: z.string().optional().nullable(),
    paymentNotes: z.string().optional().nullable(),
  });

// Rate calculation settings schema
export const rateSettingsSchema = z.object({
  rateCalculationMethod: z.enum(["auto", "manual"]).default("auto"),
});
export const insertTrackingEventSchema = createInsertSchema(trackingEvents).omit({ id: true, timestamp: true });
export const insertLiveTrackingSchema = createInsertSchema(liveTracking).omit({ id: true, lastUpdate: true });
export const insertDeliveryNotificationSchema = createInsertSchema(deliveryNotifications).omit({ id: true, sentAt: true, deliveredAt: true });
export const insertRouteMonitoringSchema = createInsertSchema(routeMonitoring).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  price: z.number().min(0, "Price must be positive"),
  duration: z.number().min(1, "Duration must be at least 1 month"),
  trialDays: z.number().min(0, "Trial days cannot be negative"),
  maxBookings: z.number().min(1, "Max bookings must be positive"),
  maxVehicles: z.number().min(1, "Max vehicles must be positive"),
  maxAgents: z.number().min(0, "Max agents cannot be negative"),
  discountPercentage: z.number().min(0).max(100, "Discount must be between 0-100%"),
  sortOrder: z.number().min(0).optional(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({ id: true, createdAt: true, status: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });

// Warehouse Stock Operations schemas
export const insertWarehouseStockOperationSchema = createInsertSchema(warehouseStockOperations).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  itemName: z.string().min(1, "Item name is required"),
  operationType: z.enum(["stock_in", "stock_out", "transfer", "adjustment"]),
  status: z.enum(["completed", "pending", "cancelled", "in_transit"]).default("completed"),
});

export const insertWarehouseInventorySchema = createInsertSchema(warehouseInventory).omit({ 
  id: true, 
  lastUpdated: true 
}).extend({
  currentStock: z.number().min(0, "Stock cannot be negative"),
  minStock: z.number().min(0, "Minimum stock cannot be negative"),
  maxStock: z.number().min(1, "Maximum stock must be greater than 0"),
  itemName: z.string().min(1, "Item name is required"),
});
export const insertTicketResponseSchema = createInsertSchema(ticketResponses).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true });
export const insertUserThemeSettingSchema = createInsertSchema(userThemeSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSuperAdminThemeSettingSchema = createInsertSchema(superAdminThemeSettings).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type LiveTracking = typeof liveTracking.$inferSelect;
export type InsertLiveTracking = z.infer<typeof insertLiveTrackingSchema>;
export type DeliveryNotification = typeof deliveryNotifications.$inferSelect;
export type InsertDeliveryNotification = z.infer<typeof insertDeliveryNotificationSchema>;
export type RouteMonitoring = typeof routeMonitoring.$inferSelect;
export type InsertRouteMonitoring = z.infer<typeof insertRouteMonitoringSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TicketResponse = typeof ticketResponses.$inferSelect;
export type InsertTicketResponse = z.infer<typeof insertTicketResponseSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type UserThemeSetting = typeof userThemeSettings.$inferSelect;
export type InsertUserThemeSetting = z.infer<typeof insertUserThemeSettingSchema>;
export type SuperAdminThemeSetting = typeof superAdminThemeSettings.$inferSelect;
export type InsertSuperAdminThemeSetting = z.infer<typeof insertSuperAdminThemeSettingSchema>;

// Expense schema and types
export const insertExpenseSchema = createInsertSchema(expenses).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  expenseDate: z.union([z.string(), z.date()]).transform((val: any) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Warehouse Stock Operations types
export type WarehouseStockOperation = typeof warehouseStockOperations.$inferSelect;
export type InsertWarehouseStockOperation = z.infer<typeof insertWarehouseStockOperationSchema>;

export type WarehouseInventory = typeof warehouseInventory.$inferSelect;
export type InsertWarehouseInventory = z.infer<typeof insertWarehouseInventorySchema>;

// Announcement types
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
