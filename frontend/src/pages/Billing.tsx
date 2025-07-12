import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SubscriptionModal from "@/components/modals/SubscriptionModal";
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Users,
  Building,
  BarChart3
} from "lucide-react";
import type { Subscription } from "@shared/schema";

export default function Billing() {
  const { user, isLoading: authLoading } = useAuth();
  useUserTheme(); // Apply user theme
  const { toast } = useToast();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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

  const getTrialDaysLeft = () => {
    if (!user?.trialEndDate) return 0;
    const today = new Date();
    const trialEnd = new Date(user.trialEndDate);
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isTrialActive = user?.subscriptionPlan === 'trial' && user?.subscriptionStatus === 'active';
  const trialDaysLeft = getTrialDaysLeft();

  const planFeatures = {
    trial: [
      "All Pro features enabled",
      "14-day trial period",
      "Full access to platform",
      "Email support"
    ],
    starter: [
      "1 User Account",
      "1 Warehouse",
      "100 Bookings/month",
      "Basic Features",
      "Email Support"
    ],
    pro: [
      "5 User Accounts",
      "3 Warehouses", 
      "1000 Bookings/month",
      "Advanced Features",
      "GPS Tracking",
      "Invoice Generation",
      "Priority Support"
    ],
    enterprise: [
      "Unlimited Users",
      "Unlimited Warehouses",
      "Unlimited Bookings",
      "AI Analytics",
      "Audit Logs",
      "Dedicated Support",
      "Custom Integration"
    ]
  };

  const planPricing = {
    starter: "₹299",
    pro: "₹999",
    enterprise: "Custom"
  };

  const currentPlan = user?.subscriptionPlan || 'trial';
  const currentFeatures = planFeatures[currentPlan as keyof typeof planFeatures] || [];

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
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Billing & Subscription</h2>
          <Button onClick={() => setShowSubscriptionModal(true)} className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Change Plan</span>
          </Button>
        </div>
      </header>

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
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center plan-${currentPlan}`}>
                    {currentPlan === 'trial' && <Zap className="h-8 w-8 text-white" />}
                    {currentPlan === 'starter' && <Users className="h-8 w-8 text-white" />}
                    {currentPlan === 'pro' && <Building className="h-8 w-8 text-white" />}
                    {currentPlan === 'enterprise' && <BarChart3 className="h-8 w-8 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 capitalize">
                      {currentPlan} Plan
                    </h3>
                    <p className="text-lg text-slate-600">
                      {currentPlan === 'trial' 
                        ? 'Free Trial Period'
                        : currentPlan === 'enterprise' 
                        ? 'Custom Pricing'
                        : `${planPricing[currentPlan as keyof typeof planPricing]}/month`
                      }
                    </p>
                  </div>
                </div>

                {/* Trial Warning */}
                {isTrialActive && trialDaysLeft <= 3 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Trial Ending Soon</p>
                        <p className="text-sm text-yellow-600">
                          Your trial expires in {trialDaysLeft} day(s). Upgrade to continue using all features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features List */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-3">Included Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-3">Current Usage</h4>
                  <div className="space-y-3">
                    {isTrialActive ? (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Days Remaining:</span>
                        <span className="font-medium text-slate-800">{trialDaysLeft}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Users:</span>
                          <span className="font-medium text-slate-800">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Warehouses:</span>
                          <span className="font-medium text-slate-800">-</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Bookings:</span>
                          <span className="font-medium text-slate-800">-</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="w-full"
                    variant={isTrialActive ? "default" : "outline"}
                  >
                    {isTrialActive ? "Choose Plan" : "Change Plan"}
                  </Button>
                  
                  {!isTrialActive && (
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
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
                    <tr className="text-left border-b">
                      <th className="pb-3 text-sm font-medium text-slate-500">Date</th>
                      <th className="pb-3 text-sm font-medium text-slate-500">Description</th>
                      <th className="pb-3 text-sm font-medium text-slate-500">Amount</th>
                      <th className="pb-3 text-sm font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 text-sm text-slate-600">
                        {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)} Plan
                      </td>
                      <td className="py-3 text-sm font-medium text-slate-800">
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
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No billing history available</p>
                <p className="text-sm text-slate-400 mt-2">
                  You're currently on a free trial. Billing history will appear after you subscribe to a plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No payment method added</p>
              <Button onClick={() => setShowSubscriptionModal(true)}>
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </>
  );
}
