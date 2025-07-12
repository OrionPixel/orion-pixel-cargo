import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/shared/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import companyLogo from "@/assets/company-logo.png";
import customIcon from "@assets/logo 2_1751792580183.png";
import { 
  Package, 
  CheckCircle, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Building, 
  Users,
  Phone,
  ArrowRight,
  Clock,
  Loader2,
  Menu
} from "lucide-react";
import { staticPlans } from "@/data/plans";

export default function Pricing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  // Scroll to top on page load
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Use static plans from data file for instant loading (no API calls)
  const plans = staticPlans;

  // Event-based subscription creation - only triggered by user action
  const createSubscription = async (planId: number) => {
    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId })
      });
      const data = await response.json();
      
      // Open Razorpay payment gateway
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        subscription_id: data?.subscriptionId,
        name: "LogiGoFast",
        description: `${data?.planName || 'Subscription'} Plan`,
        handler: function (response: any) {
          // Verify payment
          verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: user?.firstName + " " + user?.lastName || user?.email,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: "#8427d7", // Primary purple color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  };

  // Payment verification function
  const verifyPayment = async (paymentData: any) => {
    try {
      const response = await fetch("/api/subscription/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(paymentData)
      });
      
      if (response.ok) {
        toast({
          title: "Subscription Activated!",
          description: "Your subscription has been activated successfully. Redirecting to dashboard...",
        });
        setTimeout(() => {
          setLocation("/dashboard");
        }, 2000);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  const handleChoosePlan = (plan: any) => {
    if (!isAuthenticated) {
      // Store selected plan data in localStorage for signup process
      localStorage.setItem('selectedPlan', JSON.stringify({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        trialDays: plan.trialDays || 14,
        features: plan.features,
        maxBookings: plan.maxBookings,
        maxVehicles: plan.maxVehicles,
        maxAgents: plan.maxAgents
      }));
      
      // Redirect to sign-in page
      setLocation("/sign-in");
      return;
    }

    // Create subscription for authenticated users
    createSubscription(plan.id);
  };

  // No loading states needed for static data

  // Helper function to get plan icon
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('professional') || name.includes('pro')) return Zap;
    if (name.includes('enterprise') || name.includes('business')) return Crown;
    if (name.includes('starter') || name.includes('basic')) return Package;
    if (name.includes('free')) return Star;
    return Building;
  };

  // Helper function to format price
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (numPrice === 0) return "Free";
    if (numPrice === -1) return "Contact Us";
    return `₹${Math.ceil(numPrice).toLocaleString()}`;
  };

  // Helper function to get features from plan data
  const getPlanFeatures = (plan: any) => {
    const features = [];
    
    // Add feature based on limits
    if (plan.maxBookings) {
      features.push(plan.maxBookings === 999999 ? "Unlimited bookings" : `Up to ${plan.maxBookings} bookings`);
    }
    if (plan.maxVehicles) {
      features.push(plan.maxVehicles === 999999 ? "Unlimited vehicles" : `Up to ${plan.maxVehicles} vehicles`);
    }
    if (plan.maxAgents) {
      features.push(plan.maxAgents === 999999 ? "Unlimited agents" : `Up to ${plan.maxAgents} agents`);
    }

    // Add features from database (handle both string and JSON array formats)
    if (plan.features) {
      let featuresList = [];
      
      if (typeof plan.features === 'string') {
        try {
          // Try to parse as JSON first (for feature IDs saved from admin)
          const parsedFeatures = JSON.parse(plan.features);
          if (Array.isArray(parsedFeatures)) {
            featuresList = parsedFeatures;
          } else {
            // Split features by comma (for natural language features)
            featuresList = plan.features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
          }
        } catch {
          // Split features by comma if JSON parsing fails
          featuresList = plan.features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
        }
      } else if (Array.isArray(plan.features)) {
        featuresList = plan.features;
      }

      // Map feature IDs to user-friendly names
      const featureIdToName = {
        'realtime_gps': 'Real-time GPS Tracking',
        'booking_management': 'Advanced Booking Management',
        'vehicle_management': 'Vehicle Fleet Management',
        'route_monitoring': 'Route Monitoring',
        'eta_calculations': 'ETA Calculations',
        'payment_tracking': 'Payment Tracking',
        'barcode_qr': 'Barcode & QR Generation',
        'pdf_export': 'PDF Export',
        'performance_analytics': 'Performance Analytics',
        'revenue_tracking': 'Revenue Tracking',
        'email_support': 'Email Support',
        'phone_support': 'Phone Support',
        'priority_support': 'Priority Support',
        'warehouse_management': 'Warehouse Management',
        'inventory_tracking': 'Inventory Tracking',
        'agent_management': 'Agent Management',
        'commission_tracking': 'Commission Tracking',
        'notifications': 'Real-time Notifications',
        'api_access': 'API Access',
        'custom_integrations': 'Custom Integrations',
        'gst_compliance': 'GST Compliance',
        'secure_payments': 'Secure Payments',
        'live_tracking_map': 'Live Tracking Map',
        'geofencing': 'Geofencing Alerts',
        'route_optimization': 'Route Optimization',
        'maintenance_tracking': 'Maintenance Tracking',
        'fuel_monitoring': 'Fuel Monitoring',
        'capacity_management': 'Capacity Management',
        'custom_reports': 'Custom Reports',
        'dashboard_analytics': 'Dashboard Analytics',
        'multi_user_dashboard': 'Multi-user Dashboard',
        'role_based_access': 'Role-based Access Control'
      };

      featuresList.forEach((feature: string) => {
        // If it's a feature ID, convert to name, otherwise use as is
        if (featureIdToName[feature as keyof typeof featureIdToName]) {
          features.push(featureIdToName[feature as keyof typeof featureIdToName]);
        } else {
          features.push(feature);
        }
      });
    }

    // Fallback: Add features from selectedFeatures if exists
    if (plan.selectedFeatures && Array.isArray(plan.selectedFeatures)) {
      const featureNames = {
        'booking': 'Booking Management',
        'tracking': 'Real-time GPS Tracking',
        'vehicles': 'Vehicle Fleet Management',
        'warehouses': 'Warehouse Operations',
        'analytics': 'Advanced Analytics & Reports',
        'payments': 'Payment Tracking',
        'barcodes': 'Barcode & QR Generation',
        'agents': 'Agent Management System',
        'mobile': 'Mobile App Access',
        'support': 'Priority Support',
        'exports': 'PDF Export Functionality',
        'dashboard': 'Multi-user Dashboard',
        'commission': 'Commission Tracking'
      };
      
      plan.selectedFeatures.forEach((feature: string) => {
        if (featureNames[feature as keyof typeof featureNames]) {
          features.push(featureNames[feature as keyof typeof featureNames]);
        }
      });
    }

    return features;
  };

  // Create dynamic feature comparison data
  const createFeatureComparison = () => {
    const allFeatures = new Set<string>();
    
    // Collect all unique features from all plans
    plans.forEach((plan: any) => {
      const features = getPlanFeatures(plan);
      features.forEach(feature => allFeatures.add(feature));
    });

    // Group features by category
    const featureCategories = [
      {
        category: "Booking Management",
        items: Array.from(allFeatures).filter(f => 
          f.includes('booking') || f.includes('Booking') || 
          f.includes('Payment') || f.includes('Barcode') || f.includes('PDF')
        )
      },
      {
        category: "Fleet & Tracking", 
        items: Array.from(allFeatures).filter(f =>
          f.includes('GPS') || f.includes('Vehicle') || f.includes('Tracking') ||
          f.includes('vehicles') || f.includes('Mobile')
        )
      },
      {
        category: "Operations",
        items: Array.from(allFeatures).filter(f =>
          f.includes('Warehouse') || f.includes('Agent') || f.includes('agents') ||
          f.includes('Commission') || f.includes('Dashboard')
        )
      },
      {
        category: "Analytics & Reports",
        items: Array.from(allFeatures).filter(f =>
          f.includes('Analytics') || f.includes('Support')
        )
      }
    ];

    return featureCategories.filter(cat => cat.items.length > 0);
  };

  const featureCategories = createFeatureComparison();

  return (
    <div className="website-scope min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Navigation */}
      <nav 
        className="fixed top-0 w-full backdrop-blur-md border-b z-50"
        style={{ 
          backgroundColor: `hsl(var(--background) / 0.95)`,
          borderColor: `hsl(var(--border))`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2">
                <img 
                  src={customIcon}
                  alt="Custom Icon"
                  className="h-8 w-8 object-contain" 
                />
                <img 
                  src={companyLogo}
                  alt="Company Logo"
                  className="h-10 w-auto object-contain" 
                />
              </div>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Home
              </Link>
              <Link href="/about" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                About
              </Link>
              <Link href="/features" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Features
              </Link>
              <Link href="/pricing" 
                className="font-medium transition-colors"
                style={{ color: `hsl(var(--primary))` }}
              >
                Pricing
              </Link>
              <Link href="/contact" 
                className="transition-colors hover:opacity-80"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                Contact
              </Link>
              <Link href="/sign-in">
                <Button 
                  className="text-white rounded-full px-6 hover:opacity-90 transition-all"
                  style={{ 
                    backgroundColor: `hsl(var(--accent))`
                  }}
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-primary/10 border-2 border-primary/20 shadow-sm"
                style={{ color: `hsl(var(--primary))` }}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t" style={{ borderColor: `hsl(var(--border))` }}>
              <div className="flex flex-col space-y-4 pt-4">
                <Link 
                  href="/" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/about" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/features" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/pricing" 
                  className="font-medium px-2 py-1"
                  style={{ color: `hsl(var(--primary))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/contact" 
                  className="transition-colors px-2 py-1 hover:opacity-80"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="pt-4 border-t" style={{ borderColor: `hsl(var(--border))` }}>
                  <Link href="/sign-in">
                    <Button 
                      className="w-full text-white rounded-full"
                      style={{ backgroundColor: `hsl(var(--accent))` }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Simple, Transparent{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Choose the perfect plan for your logistics business. All plans include our core features with no hidden fees.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {plans.map((plan: any, index: number) => {
            const Icon = getPlanIcon(plan.name);
            const features = getPlanFeatures(plan);
            const isPopular = plan.isPopular || index === 1; // Middle plan is popular by default
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden ${
                  isPopular 
                    ? 'border-primary shadow-xl ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/30'
                } transition-all duration-300 hover:shadow-lg`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                      isPopular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-foreground">
                        {formatPrice(plan.price)}
                      </span>
                      {parseFloat(plan.price) > 0 && parseFloat(plan.price) !== -1 && (
                        <span className="text-muted-foreground ml-2">per month</span>
                      )}
                    </div>
                    
                    {plan.trialDays && plan.trialDays > 0 && (
                      <Badge variant="secondary" className="mb-4">
                        <Clock className="h-3 w-3 mr-1" />
                        {plan.trialDays}-Day Free Trial
                      </Badge>
                    )}
                    
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <Button 
                        className={`w-full ${
                          isPopular 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'bg-primary hover:bg-primary/90'
                        }`}
                        onClick={() => handleChoosePlan(plan)}
                        disabled={false}
                      >
                        <>
                          {plan.name === 'Enterprise' ? 'Connect Team' : 'Choose Plan'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      </Button>
                      
                      {plan.trialDays && plan.trialDays > 0 && (
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => handleChoosePlan(plan)}
                          disabled={false}
                        >
                          Start 14-Day Free Trial
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="font-semibold text-foreground">What's included:</p>
                    {features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      {featureCategories.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Detailed Feature Comparison
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Compare all features across our plans to find the perfect fit for your business needs.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-border shadow-sm">
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-border">
                  <thead 
                    className="bg-primary"
                    style={{ 
                      backgroundColor: `hsl(var(--primary))`
                    }}
                  >
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Features
                    </th>
                    {plans.map((plan: any) => (
                      <th key={plan.id} className="px-6 py-4 text-center text-sm font-semibold text-white">
                        {plan.name}
                        <div className="text-xs text-white/80 font-normal mt-1">
                          {formatPrice(plan.price)}
                          {parseFloat(plan.price) > 0 && parseFloat(plan.price) !== -1 && '/mo'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {featureCategories.map((category, catIndex) => [
                      <tr key={`cat-${catIndex}`} className="bg-muted/30">
                        <td colSpan={plans.length + 1} className="px-6 py-3 text-sm font-semibold text-foreground">
                          {category.category}
                        </td>
                      </tr>,
                      ...category.items.map((feature, featureIndex) => (
                        <tr key={`${catIndex}-${featureIndex}`} className="hover:bg-muted/20">
                          <td className="px-6 py-4 text-sm text-foreground">
                            {feature}
                          </td>
                          {plans.map((plan: any) => {
                            const planFeatures = getPlanFeatures(plan);
                            const hasFeature = planFeatures.includes(feature);
                            
                            return (
                              <td key={plan.id} className="px-6 py-4 text-center">
                                {hasFeature ? (
                                  <CheckCircle className="h-5 w-5 text-primary mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ]).flat()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Is there a setup fee?
            </h3>
            <p className="text-muted-foreground">
              No setup fees. All plans include free onboarding and training resources.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              What happens after the trial?
            </h3>
            <p className="text-muted-foreground">
              After your trial ends, you can choose a plan that fits your needs or continue with limited features.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Do you offer custom enterprise solutions?
            </h3>
            <p className="text-muted-foreground">
              Yes, we offer custom solutions for large enterprises. Contact our sales team for details.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of businesses already using LogiGoFast to streamline their logistics operations.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/sign-in">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">
                <Phone className="mr-2 h-5 w-5" />
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}