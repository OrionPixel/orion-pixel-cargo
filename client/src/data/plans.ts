// All possible features across all plans
export const allFeatures = [
  "Up to 100 bookings per month",
  "Up to 500 bookings per month", 
  "Unlimited bookings",
  "1 vehicle management",
  "Up to 25 vehicles",
  "Unlimited vehicles",
  "0 agent accounts",
  "Up to 10 agent accounts", 
  "Unlimited agent accounts",
  "Basic booking management",
  "Advanced booking management",
  "GPS vehicle tracking",
  "Real-time GPS tracking", 
  "Live shipment tracking",
  "Live route monitoring",
  "Vehicle fleet management",
  "User dashboard",
  "Advanced analytics dashboard",
  "User role management",
  "User management system",
  "Basic reporting",
  "Financial reports",
  "Email notifications",
  "Advanced notifications",
  "PDF bill generation",
  "Barcode & QR generation",
  "Theme customization",
  "Warehouse management", 
  "Office accounts"
];

// Master feature list for comparison - shows capacity per plan
export const allPlanFeatures = [
  // Capacity Comparison (no duplicates)
  "Monthly bookings",
  "Vehicle management", 
  "Agent accounts",
  
  // Core Features
  "Booking management",
  "GPS tracking",
  "Live shipment tracking",
  "User dashboard", 
  "Reporting system",
  "Email notifications",
  "Route monitoring",
  "Fleet management",
  "User role management",
  "PDF bill generation", 
  "Barcode & QR generation",
  "Analytics dashboard",
  "Financial reports",
  "Advanced notifications",
  "User management system",
  "Theme customization", 
  "Warehouse management",
  "Office accounts"
];

// Clean plan feature matrix showing what each plan INCLUDES
export const planFeatureMatrix = {
  starter: [
    "Monthly bookings", // 100 bookings
    "Vehicle management", // 1 vehicle
    "Booking management", // Basic
    "GPS tracking", // Basic
    "Live shipment tracking",
    "User dashboard",
    "Reporting system", // Basic
    "Email notifications"
  ],
  professional: [
    "Monthly bookings", // 500 bookings  
    "Vehicle management", // 25 vehicles
    "Agent accounts", // 10 agents
    "Booking management", // Advanced
    "GPS tracking", // Real-time
    "Live shipment tracking",
    "User dashboard",
    "Reporting system", // Advanced
    "Email notifications",
    "Route monitoring",
    "Fleet management", 
    "User role management",
    "PDF bill generation",
    "Barcode & QR generation",
    "Analytics dashboard",
    "Financial reports",
    "Advanced notifications"
  ],
  enterprise: [
    "Monthly bookings", // Unlimited
    "Vehicle management", // Unlimited
    "Agent accounts", // Unlimited 
    "Booking management", // Advanced
    "GPS tracking", // Real-time
    "Live shipment tracking",
    "User dashboard",
    "Reporting system", // Advanced
    "Email notifications", 
    "Route monitoring",
    "Fleet management",
    "User role management",
    "PDF bill generation",
    "Barcode & QR generation", 
    "Analytics dashboard",
    "Financial reports",
    "Advanced notifications",
    "User management system",
    "Theme customization",
    "Warehouse management",
    "Office accounts"
  ]
};

// Static plan data for faster loading - Real features only
export const staticPlans = [
  {
    id: 1,
    name: "Starter",
    description: "Perfect for small businesses getting started",
    price: "₹999",
    trialDays: 14,
    features: [
      "Up to 100 bookings per month",
      "1 vehicle management",
      "0 agent accounts",
      "Basic booking management",
      "GPS vehicle tracking", 
      "Live shipment tracking",
      "User dashboard",
      "Basic reporting",
      "Email notifications"
    ],
    isActive: true,
    isPopular: false
  },
  {
    id: 2,
    name: "Professional", 
    description: "Most popular for growing businesses",
    price: "₹2,999",
    trialDays: 14,
    features: [
      "Up to 500 bookings per month",
      "Up to 25 vehicles",
      "Up to 10 agent accounts",
      "Advanced booking management",
      "Real-time GPS tracking",
      "Live route monitoring",
      "Vehicle fleet management",
      "User role management",
      "PDF bill generation",
      "Barcode & QR generation",
      "Advanced analytics dashboard",
      "Financial reports"
    ],
    isActive: true,
    isPopular: true
  },
  {
    id: 3,
    name: "Enterprise",
    description: "Complete solution for large transportation companies",
    price: "Connect Team",
    trialDays: 0,
    features: [
      "Unlimited bookings",
      "Unlimited vehicles", 
      "Unlimited agent accounts",
      "All Professional features",
      "User management system",
      "Theme customization",
      "Warehouse management",
      "Office accounts",
      "Advanced notifications"
    ],
    isActive: true,
    isPopular: false
  }
];

// Upcoming features that will be available soon
export const upcomingFeatures = [
  "Mobile App (Android & iOS)",
  "API Access & Integrations", 
  "Route Optimization",
  "24/7 Phone Support",
  "Dedicated Account Manager",
  "White-label Solutions",
  "Advanced Security Features",
  "Multi-language Support",
  "Automated Billing",
  "Customer Portal",
  "SMS Notifications",
  "Custom Branding",
  "Data Export & Backup",
  "Training & Onboarding"
];

export const getPlanByName = (name: string) => {
  return staticPlans.find(plan => plan.name === name) || staticPlans[0];
};