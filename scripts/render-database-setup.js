/**
 * Render Database Schema Setup Script
 * Comprehensive database table creation for production deployment
 * Usage: node scripts/render-database-setup.js [database_url]
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';

const DATABASE_TABLES = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(50) DEFAULT 'transporter',
      office_name VARCHAR(255),
      gst_number VARCHAR(15),
      address TEXT,
      subscription_plan VARCHAR(50) DEFAULT 'starter',
      subscription_status VARCHAR(50) DEFAULT 'trial',
      trial_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      trial_end_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '28 days'),
      commission_rate DECIMAL(5,2) DEFAULT 0.00,
      parent_user_id UUID REFERENCES users(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  bookings: `
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      tracking_number VARCHAR(255) UNIQUE NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      sender_phone VARCHAR(20) NOT NULL,
      sender_email VARCHAR(255),
      sender_gst VARCHAR(15),
      sender_address TEXT NOT NULL,
      receiver_name VARCHAR(255) NOT NULL,
      receiver_phone VARCHAR(20) NOT NULL,
      receiver_email VARCHAR(255),
      receiver_gst VARCHAR(15),
      receiver_address TEXT NOT NULL,
      pickup_date TIMESTAMP NOT NULL,
      delivery_date TIMESTAMP,
      service_type VARCHAR(50) NOT NULL,
      vehicle_type VARCHAR(100),
      weight DECIMAL(10,2),
      dimensions VARCHAR(255),
      cargo_description TEXT,
      base_amount DECIMAL(10,2) NOT NULL,
      gst_amount DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_status VARCHAR(50) DEFAULT 'pending',
      status VARCHAR(50) DEFAULT 'pending',
      pickup_city VARCHAR(255),
      delivery_city VARCHAR(255),
      distance DECIMAL(10,2),
      estimated_delivery TIMESTAMP,
      driver_name VARCHAR(255),
      driver_phone VARCHAR(20),
      vehicle_number VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  vehicles: `
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      registration_number VARCHAR(50) UNIQUE NOT NULL,
      vehicle_type VARCHAR(100) NOT NULL,
      capacity VARCHAR(100),
      driver_name VARCHAR(255),
      driver_phone VARCHAR(20),
      driver_license VARCHAR(50),
      insurance_expiry DATE,
      pollution_expiry DATE,
      fitness_expiry DATE,
      status VARCHAR(50) DEFAULT 'available',
      current_location VARCHAR(255),
      gps_device_id VARCHAR(100),
      gps_sim_number VARCHAR(20),
      gps_status VARCHAR(50) DEFAULT 'inactive',
      gps_imei VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  tracking_events: `
    CREATE TABLE IF NOT EXISTS tracking_events (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      event_type VARCHAR(100) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50),
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  live_tracking: `
    CREATE TABLE IF NOT EXISTS live_tracking (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      location_name VARCHAR(255),
      speed DECIMAL(5,2),
      heading DECIMAL(5,2),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      battery_level INTEGER,
      signal_strength INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT false,
      action_url VARCHAR(500),
      sender_user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id UUID NOT NULL REFERENCES users(id),
      receiver_id UUID NOT NULL REFERENCES users(id),
      subject VARCHAR(255),
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      thread_id UUID,
      attachment_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  gps_devices: `
    CREATE TABLE IF NOT EXISTS gps_devices (
      id SERIAL PRIMARY KEY,
      device_id VARCHAR(100) UNIQUE NOT NULL,
      vehicle_id INTEGER REFERENCES vehicles(id),
      sim_number VARCHAR(20),
      imei VARCHAR(50),
      status VARCHAR(50) DEFAULT 'inactive',
      last_ping TIMESTAMP,
      battery_level INTEGER,
      signal_strength INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  // Financial Tables
  salary_payments: `
    CREATE TABLE IF NOT EXISTS salary_payments (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      person_name VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      payment_type VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      payment_mode VARCHAR(50),
      remarks TEXT,
      is_recurring BOOLEAN DEFAULT false,
      recurring_frequency VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  vehicle_expenses: `
    CREATE TABLE IF NOT EXISTS vehicle_expenses (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      expense_type VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      expense_date DATE NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(50) DEFAULT 'paid',
      receipt_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  toll_expenses: `
    CREATE TABLE IF NOT EXISTS toll_expenses (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      booking_id INTEGER REFERENCES bookings(id),
      toll_plaza VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      location VARCHAR(255),
      expense_date DATE NOT NULL,
      receipt_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  income_records: `
    CREATE TABLE IF NOT EXISTS income_records (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      income_type VARCHAR(100) DEFAULT 'booking',
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      income_date DATE NOT NULL,
      payment_method VARCHAR(50),
      status VARCHAR(50) DEFAULT 'received',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  client_ledger: `
    CREATE TABLE IF NOT EXISTS client_ledger (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      client_name VARCHAR(255) NOT NULL,
      client_email VARCHAR(255),
      client_phone VARCHAR(20),
      transaction_type VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      transaction_date DATE NOT NULL,
      booking_id INTEGER REFERENCES bookings(id),
      balance DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  // Theme Tables
  user_theme_settings: `
    CREATE TABLE IF NOT EXISTS user_theme_settings (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      primary_color VARCHAR(7) DEFAULT '#3094d1',
      secondary_color VARCHAR(7) DEFAULT '#3195d1',
      accent_color VARCHAR(7) DEFAULT '#3296d1',
      logo_url VARCHAR(500),
      theme VARCHAR(10) DEFAULT 'system',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  super_admin_theme_settings: `
    CREATE TABLE IF NOT EXISTS super_admin_theme_settings (
      id SERIAL PRIMARY KEY,
      primary_color VARCHAR(7) DEFAULT '#3496d1',
      secondary_color VARCHAR(7) DEFAULT '#3195d1',
      accent_color VARCHAR(7) DEFAULT '#3296d1',
      logo_url VARCHAR(500),
      theme VARCHAR(10) DEFAULT 'light',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  // Subscription Tables
  subscription_plans: `
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      billing_cycle VARCHAR(20) DEFAULT 'monthly',
      max_bookings INTEGER NOT NULL,
      max_vehicles INTEGER NOT NULL,
      max_agents INTEGER NOT NULL,
      features TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
};

async function setupDatabase() {
  try {
    const dbUrl = process.argv[2] || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('❌ Database URL required. Usage: node render-database-setup.js [database_url]');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    const sql = postgres(dbUrl);
    const db = drizzle(sql);

    console.log('✅ Database connected successfully');
    console.log('🔄 Creating tables...');

    // Create tables in correct order (considering foreign key constraints)
    const tableOrder = [
      'users',
      'vehicles', 
      'bookings',
      'tracking_events',
      'live_tracking',
      'notifications',
      'messages',
      'gps_devices',
      'salary_payments',
      'vehicle_expenses',
      'toll_expenses',
      'income_records',
      'client_ledger',
      'user_theme_settings',
      'super_admin_theme_settings',
      'subscription_plans'
    ];

    for (const tableName of tableOrder) {
      try {
        console.log(`📋 Creating table: ${tableName}`);
        await sql.unsafe(DATABASE_TABLES[tableName]);
        console.log(`✅ Table created: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Table ${tableName} might already exist:`, error.message);
      }
    }

    // Insert default data
    console.log('🔄 Inserting default data...');
    
    // Default subscription plans
    await sql.unsafe(`
      INSERT INTO subscription_plans (name, display_name, price, max_bookings, max_vehicles, max_agents, features) 
      VALUES 
        ('starter', 'Starter', 999, 100, 1, 0, 'Basic booking management, GPS tracking, Dashboard analytics'),
        ('professional', 'Professional', 2999, 500, 25, 10, 'Advanced reporting, Multi-agent support, Priority support'),
        ('enterprise', 'Enterprise', 4999, 2000, 100, 50, 'Unlimited features, Custom integrations, Dedicated support')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Default super admin theme
    await sql.unsafe(`
      INSERT INTO super_admin_theme_settings (primary_color, secondary_color, accent_color, theme) 
      VALUES ('#3496d1', '#3195d1', '#3296d1', 'light')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Default data inserted');
    console.log('🎉 Database setup completed successfully!');
    
    // Verify tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📊 Created tables:', tables.map(t => t.table_name).join(', '));
    
    await sql.end();
    console.log('🔒 Database connection closed');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();