# Database Schema Setup for Render Deployment

## Problem: Tables Not Creating Properly

### Root Cause:
Render environment में database schema properly push नहीं हो रहे हैं क्योंकि:
1. Drizzle migrations timeout हो जाते हैं
2. Foreign key constraints का order गलत है
3. Production environment specific issues

## Solution: Manual Database Setup

### Method 1: Automatic Script (Recommended)
```bash
# Render console में या post-deploy hook में:
node scripts/render-database-setup.js $DATABASE_URL
```

### Method 2: Complete Deployment Script
```bash
# All-in-one solution:
./scripts/render-deploy-complete.sh
```

### Method 3: Manual SQL Commands
Render console में directly run करें:

```sql
-- Essential Tables Creation Order:

-- 1. Users table (base table)
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

-- 2. Vehicles table
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

-- 3. Bookings table
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

-- 4. Notifications table
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

-- 5. Financial tables
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

-- 6. Theme tables
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

-- Insert default data
INSERT INTO super_admin_theme_settings (primary_color, secondary_color, accent_color, theme) 
VALUES ('#3496d1', '#3195d1', '#3296d1', 'light')
ON CONFLICT (id) DO NOTHING;
```

## Verification Commands

### Check Table Creation:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Count Records:
```sql
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
  'bookings' as table_name, COUNT(*) as count FROM bookings
UNION ALL
SELECT 
  'vehicles' as table_name, COUNT(*) as count FROM vehicles;
```

## Render Deployment Order:

### 1. Deploy Application First
- Upload code to Render
- Set environment variables
- Wait for successful deployment

### 2. Setup Database Schema
- Run database setup script
- Verify table creation
- Create admin user

### 3. Test Application
- Access application URL
- Test login functionality  
- Verify all features working

## Environment Variables Required:

```env
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=your_random_secret_key
NODE_ENV=production
ADMIN_EMAIL=admin@logigofast.com
ADMIN_PASSWORD=your_secure_password
```

## Expected Results:

### Tables Created: 15+
- users, bookings, vehicles
- notifications, messages
- salary_payments, income_records
- theme settings, subscriptions

### Admin User Created:
- Email: admin@logigofast.com
- Access to all features
- Theme customization working

### Application Features:
- Real-time notifications
- PWA installation
- Sound alerts
- Complete booking system
- Financial reporting

Database setup के बाद सभी features properly काम करेंगे!