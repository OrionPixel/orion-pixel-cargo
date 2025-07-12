# LogiGoFast - Enterprise Cargo Management Platform

A comprehensive, full-stack logistics and transportation management system built with modern enterprise architecture principles, featuring real-time GPS tracking, comprehensive booking management, and advanced theme customization.

## 🏗️ Enterprise Architecture

This project has been restructured from a monolithic architecture to a modern enterprise-level folder structure that supports independent scaling, better team collaboration, and cleaner codebase organization.

### 📁 Project Structure

```
logigofast/
├── frontend/                 # React.js Frontend Application
│   ├── src/
│   │   ├── components/      # Reusable UI Components
│   │   ├── pages/          # Application Pages
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── lib/            # Utility Functions
│   │   ├── contexts/       # React Context Providers
│   │   └── types/          # TypeScript Type Definitions
│   ├── package.json        # Frontend Dependencies
│   ├── vite.config.ts      # Vite Configuration
│   ├── tailwind.config.ts  # Tailwind CSS Configuration
│   └── tsconfig.json       # TypeScript Configuration
│
├── backend/                 # Node.js/Express Backend API
│   ├── src/
│   │   ├── config/         # Database & Environment Configuration
│   │   ├── controllers/    # Business Logic Controllers
│   │   ├── middleware/     # Authentication & Validation Middleware
│   │   ├── routes/         # API Route Definitions
│   │   ├── services/       # Database & External Service Layer
│   │   └── index.ts        # Application Entry Point
│   ├── package.json        # Backend Dependencies
│   └── tsconfig.json       # TypeScript Configuration
│
├── database/               # Database Management
│   ├── schema/             # Drizzle ORM Schema Definitions
│   ├── migrations/         # Database Migration Files
│   ├── seed/              # Database Seed Scripts
│   └── drizzle.config.ts  # Database Configuration
│
├── shared/                 # Shared Types & Utilities
│   └── schema.ts          # Shared Type Definitions
│
├── server/                # Gateway & Orchestration
│   ├── index.ts           # Main Server Entry Point
│   ├── auth.ts            # Authentication Logic
│   ├── routes.ts          # Route Orchestration
│   └── storage.ts         # Storage Abstraction
│
├── devops/                # DevOps & Deployment
│   ├── docker/           # Docker Configurations
│   ├── scripts/          # Deployment Scripts
│   └── configs/          # Environment Configurations
│
└── docs/                  # Documentation
    └── GPS_INTEGRATION_GUIDE.md
```

## 🚀 Key Features

### Core Functionality
- **Comprehensive Booking Management** - Multi-type booking system (FTL, LTL, part_load)
- **Real-time GPS Tracking** - WebSocket-based live location monitoring
- **Fleet Management** - Vehicle registration, status tracking, and maintenance
- **Warehouse Operations** - Multi-location management with inventory tracking
- **User Management** - Role-based access control with office agents

### Advanced Features
- **Dynamic Theme System** - Real-time color customization for users and admins
- **Reporting & Analytics** - Dashboard with performance metrics and PDF exports
- **Mobile Responsive** - Optimized for all device sizes
- **Progressive Web App** - Offline capabilities and native app-like experience

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom theme system
- **Radix UI** components with shadcn/ui
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for type-safe database operations
- **Passport.js** for authentication
- **WebSocket** for real-time features

### Database & Infrastructure
- **PostgreSQL** (Neon serverless)
- **Session-based authentication**
- **Real-time GPS data streaming**
- **Automated deployments**

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd logigofast
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install module dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

4. **Environment Setup**
   ```bash
   # Set your DATABASE_URL environment variable
   export DATABASE_URL="postgresql://username:password@localhost:5432/logigofast"
   ```

5. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📱 Development Scripts

### Root Level Commands
```bash
npm run dev              # Start main development server
npm run build            # Build entire application
npm run start            # Start production server
npm run db:push          # Push database schema changes
npm run db:studio        # Open database studio
```

### Module-Specific Commands
```bash
# Frontend Development
npm run dev:frontend     # Start frontend dev server
npm run build:frontend   # Build frontend for production

# Backend Development  
npm run dev:backend      # Start backend dev server
npm run build:backend    # Build backend for production

# Utilities
npm run clean           # Clean all node_modules and dist folders
npm run install:all     # Install dependencies for all modules
```

## 🎨 Theme System

LogiGoFast features an advanced dynamic theme system that allows real-time color customization:

### User Themes
Users can customize their dashboard colors through the Theme Settings page:
- **Primary Color** - Main accent color for buttons and highlights
- **Secondary Color** - Supporting color for secondary elements  
- **Accent Color** - Accent color for special highlights

### Admin Themes
Super Admins control the global theme that affects:
- Landing pages and public website
- Default color schemes
- Login and registration pages

### Technical Implementation
- CSS custom properties for dynamic color application
- HSL color space for better color manipulation
- Real-time theme updates without page refresh
- Persistent theme storage in database

## 🔐 Authentication & Security

### Authentication Flow
1. **Session-based Authentication** using Passport.js
2. **Password Hashing** with bcrypt and scrypt
3. **Role-based Access Control** (transporter, distributor, warehouse, admin, office)
4. **Protected Routes** with middleware validation

### Security Features
- CORS protection for cross-origin requests
- Input validation with Zod schemas
- Session management with PostgreSQL store
- Environment-specific security configurations

## 📊 GPS & Tracking System

### Real-time Tracking
- WebSocket-based GPS data streaming
- Support for hardware GPS trackers and mobile apps
- Route monitoring and ETA calculations
- Live tracking visualization

### Integration Support
- Hardware GPS device integration
- Mobile app GPS tracking
- Manual location updates
- Geofencing and alerts

## 🏢 Business Features

### Booking Management
- Dynamic pricing calculation with GST
- Payment tracking and status management
- Barcode and QR code generation
- Multi-type cargo support

### Fleet Operations
- Vehicle registration and documentation
- Driver management and licensing
- Maintenance tracking and scheduling
- Availability and status monitoring

### Warehouse Management
- Multi-location warehouse operations
- Inventory tracking and stock monitoring
- Capacity management and reporting
- Loading/unloading coordination

## 📈 Analytics & Reporting

### Dashboard Analytics
- Real-time business metrics
- Revenue and commission tracking
- Booking performance analytics
- User activity monitoring

### Report Generation
- PDF export functionality
- Custom date range filtering
- Performance comparisons
- Financial summaries

## 🚀 Deployment

### Production Build
```bash
# Build all modules
npm run build

# Start production server
npm run start
```

### Environment Variables
```bash
DATABASE_URL=postgresql://...
NODE_ENV=production
SESSION_SECRET=your-secret-key
```

### Server Requirements
- Node.js 20+
- PostgreSQL 16+
- SSL certificate for HTTPS
- Process manager (PM2 recommended)

## 📝 API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Booking Endpoints
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Vehicle Endpoints
- `GET /api/vehicles` - Get user vehicles
- `POST /api/vehicles` - Add new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Remove vehicle

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use meaningful commit messages
3. Write tests for new features
4. Update documentation for API changes
5. Follow the established folder structure

### Code Style
- Use ESLint and Prettier for formatting
- Follow React and Node.js best practices
- Implement proper error handling
- Use TypeScript for type safety

## 📞 Support

For support and questions:
- Email: support@logigofast.com
- Phone: +91 7000758030
- Address: LIG Indore 452011

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**LogiGoFast** - Transforming logistics with modern technology and enterprise-grade architecture.