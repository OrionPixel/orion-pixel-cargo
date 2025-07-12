import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { staticPlans } from "@/data/plans";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { 
  Crown, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Users,
  Building,
  BarChart3,
  RotateCcw,
  X,
  Star
} from "lucide-react";
import type { Subscription } from "@shared/schema";

export default function Billing() {
  const { user, isLoading: authLoading } = useAuth();
  useUserTheme(); // Apply user theme
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showPlanSelection, setShowPlanSelection] = useState(false);


  // Check authentication in useEffect to avoid render loops
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, user, toast]);

  // Return loading or null if no user
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
  });

  // Fetch all available plans from database (public endpoint)
  const { data: availablePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    staleTime: 5 * 60 * 1000,
  });

  const getTrialDaysLeft = () => {
    if (!user?.trialEndDate) return 0;
    
    const today = new Date();
    const trialEnd = new Date(user.trialEndDate);
    
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get user's current plan from database
  const getCurrentPlanDetails = () => {
    if (!user?.subscriptionPlan || !availablePlans.length) return null;
    return availablePlans.find((plan: any) => plan.name.toLowerCase() === user.subscriptionPlan.toLowerCase());
  };

  const isTrialActive = user?.subscriptionStatus === 'trial' || (!user?.subscriptionPlan || user?.subscriptionPlan === 'trial');
  const trialDaysLeft = getTrialDaysLeft();
  const currentPlan = user?.subscriptionPlan || 'trial';
  const currentPlanDetails = getCurrentPlanDetails();

  // Get total trial days (14 days by default)
  const getDisplayTrialDays = () => {
    if (currentPlanDetails?.trialDays) {
      return currentPlanDetails.trialDays;
    }
    // Default trial period is 14 days
    return 14;
  };

  // Create feature display with proper mapping
  const createFeatureDisplay = () => {
    if (currentPlanDetails?.features) {
      const features = JSON.parse(currentPlanDetails.features);
      return features.map((feature: string) => {
        const featureMap: { [key: string]: string } = {
          'booking_management': 'Advanced Booking Management',
          'vehicle_management': 'Vehicle Fleet Management', 
          'gps_tracking': 'Real-time GPS Tracking',
          'route_monitoring': 'Route Monitoring',
          'payment_tracking': 'Payment Tracking',
          'barcode_qr': 'Barcode & QR Generation',
          'pdf_export': 'PDF Export',
          'email_support': 'Email Support',
          'phone_support': 'Phone Support',
          'warehouse_management': 'Warehouse Management',
          'analytics_dashboard': 'Analytics & Reports',
          'multi_user': 'Multi-user Access',
          'api_integration': 'API Integration',
          'custom_branding': 'Custom Branding',
          'priority_support': 'Priority Support'
        };
        return featureMap[feature] || feature;
      });
    } else {
      // Trial period features
      return [
        `${getDisplayTrialDays()}-day trial period`,
        "Advanced Booking Management", 
        "Real-time GPS Tracking",
        "Vehicle Fleet Management",
        "Payment Tracking",
        "PDF Export",
        "Email Support"
      ];
    }
  };

  const planFeatures = createFeatureDisplay();

  const planPricing = currentPlanDetails?.name?.toLowerCase() === 'enterprise' ? 
    "Connect Team" : 
    currentPlanDetails?.price ? 
    `₹${parseFloat(currentPlanDetails.price).toLocaleString()}` : 
    "Free Trial";

  console.log(`🎯 BILLING PAGE DEBUG:`, {
    userPlan: user?.subscriptionPlan,
    userTrialStartDate: user?.trialStartDate,
    userTrialEndDate: user?.trialEndDate,
    userSubscriptionStatus: user?.subscriptionStatus,
    currentPlanDetails,
    planFeatures,
    trialDaysLeft,
    displayTrialDays: getDisplayTrialDays(),
    availablePlansLength: availablePlans.length,
    rawAvailablePlans: availablePlans,
    currentPlanName: currentPlanDetails?.name,
    currentPlanTrialDays: currentPlanDetails?.trialDays,
    calculatedTrialDays: trialDaysLeft
  });

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-primary/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Billing & Subscription</h2>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => {
                console.log('🔄 Force refreshing user data...');
                sessionStorage.removeItem('cached_user');
                sessionStorage.removeItem('cached_dashboard');
                sessionStorage.removeItem('cached_bookings');
                queryClient.clear();
                window.location.reload();
              }} 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button onClick={() => setShowPlanSelection(true)} className="flex items-center space-x-2 bg-primary hover:bg-primary/90">
              <Crown className="h-4 w-4" />
              <span>Change Plan</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Trial Status Bar */}
      {isTrialActive && (
        <div className="bg-accent/10 border-b border-accent/20 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-foreground">Trial Period</span>
                </div>
                <span className="text-muted-foreground">
                  {trialDaysLeft > 0 
                    ? `${trialDaysLeft} days remaining` 
                    : 'Trial expired'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (trialDaysLeft / getDisplayTrialDays()) * 100))}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((trialDaysLeft / getDisplayTrialDays()) * 100)}%
                  </span>
                </div>
                <Button 
                  onClick={() => setShowPlanSelection(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Current Plan Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>Current Subscription</span>
              </CardTitle>
              <Badge 
                variant={user?.subscriptionStatus === 'active' ? 'default' : 'destructive'}
                className="capitalize"
              >
                {user?.subscriptionStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plan Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-primary/10 border-2 border-primary/20`}>
                    {currentPlan === 'trial' && <Zap className="h-8 w-8 text-primary" />}
                    {currentPlan === 'starter' && <Users className="h-8 w-8 text-primary" />}
                    {currentPlan === 'pro' && <Building className="h-8 w-8 text-primary" />}
                    {currentPlan === 'enterprise' && <BarChart3 className="h-8 w-8 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground capitalize">
                      {currentPlan} Plan
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      {currentPlan === 'trial' 
                        ? 'Free Trial Period'
                        : currentPlanDetails?.name?.toLowerCase() === 'enterprise'
                        ? 'Connect Team'
                        : currentPlanDetails?.price 
                        ? `₹${parseFloat(currentPlanDetails.price).toLocaleString()}/month`
                        : 'Custom Pricing'
                      }
                    </p>
                  </div>
                </div>

                {/* Trial Warning */}
                {isTrialActive && trialDaysLeft <= 3 && (
                  <div className="mb-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-accent">Trial Ending Soon</p>
                        <p className="text-sm text-accent/80">
                          Your trial expires in {trialDaysLeft} day(s). Upgrade to continue using all features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features List */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Included Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.isArray(planFeatures) ? planFeatures.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {typeof feature === 'string' ? feature : feature.name || feature}
                        </span>
                      </div>
                    )) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Loading features...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <h4 className="font-medium text-foreground mb-3">Current Usage</h4>
                  <div className="space-y-3">
                    {isTrialActive ? (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Days Remaining:</span>
                        <span className="font-medium text-foreground">{trialDaysLeft}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Users:</span>
                          <span className="font-medium text-foreground">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Warehouses:</span>
                          <span className="font-medium text-foreground">-</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Bookings:</span>
                          <span className="font-medium text-foreground">-</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowPlanSelection(true)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    View All Plans
                  </Button>
                  
                  <Button 
                    onClick={() => setShowPlanSelection(true)}
                    className="w-full"
                    variant="outline"
                  >
                    {isTrialActive ? "Quick Upgrade" : "Change Plan"}
                  </Button>
                  
                  {!isTrialActive && (
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive/90 border-destructive/20 hover:border-destructive/40">
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-primary/20">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    <tr>
                      <td className="py-3 text-sm text-muted-foreground">
                        {subscription.trialStartDate ? 
                          new Date(subscription.trialStartDate).toLocaleDateString('en-IN') : 
                          user?.trialStartDate ? 
                            new Date(user.trialStartDate).toLocaleDateString('en-IN') : 
                            '-'
                        }
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {subscription?.planType ? 
                          (subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)) + ' Plan' : 
                          subscription?.plan ? 
                            (subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)) + ' Plan' :
                            'Trial Plan'
                        }
                      </td>
                      <td className="py-3 text-sm font-medium text-foreground">
                        {subscription.amount ? `₹${Math.ceil(Number(subscription.amount)).toLocaleString()}` : 'Free'}
                      </td>
                      <td className="py-3">
                        <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                          {subscription.status}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No billing history available</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  You're currently on a free trial. Billing history will appear after you subscribe to a plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No payment method added</p>
              <Button onClick={() => setShowPlanSelection(true)} className="bg-primary hover:bg-primary/90">
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Selection Modal */}
      <Dialog open={showPlanSelection} onOpenChange={setShowPlanSelection}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-6">
              Choose Your Perfect Plan
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6">
            {staticPlans.map((plan, index) => {
              const isPrimary = plan.name.toLowerCase() === 'professional';
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2 ${
                    isPrimary ? 'border-primary scale-105' : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  {isPrimary && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-center py-2 text-sm font-semibold">
                      <Star className="h-4 w-4 inline mr-1" />
                      Most Popular
                    </div>
                  )}
                  
                  <CardContent className={`p-6 ${isPrimary ? 'pt-12' : ''}`}>
                    <div className="text-center mb-6">
                      <div className="mb-4">
                        {index === 0 && <Zap className="h-12 w-12 mx-auto text-primary" />}
                        {index === 1 && <Crown className="h-12 w-12 mx-auto text-primary" />}
                        {index === 2 && <Building className="h-12 w-12 mx-auto text-primary" />}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      
                      <div className="mb-6">
                        <div className="text-4xl font-bold text-gray-900">
                          {plan.name.toLowerCase() === 'enterprise' ? (
                            <span className="text-2xl">Connect Team</span>
                          ) : (
                            <>₹{plan.price}<span className="text-lg text-gray-500">/month</span></>
                          )}
                        </div>
                        {plan.name.toLowerCase() !== 'enterprise' && (
                          <p className="text-sm text-gray-500 mt-1">14-day free trial</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={() => {
                        localStorage.setItem('selectedPlan', JSON.stringify(plan));
                        setShowPlanSelection(false);
                        toast({
                          title: "Plan Selected",
                          description: `You have selected the ${plan.name} plan. Contact our team to proceed with activation.`,
                        });
                      }}
                      className={`w-full transition-colors ${
                        isPrimary 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {isTrialActive ? `Start ${plan.name} Trial` : `Switch to ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              Need help choosing? Contact our team for personalized recommendations.
            </p>
            <Button 
              onClick={() => setShowPlanSelection(false)}
              variant="outline"
              className="mx-auto"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
