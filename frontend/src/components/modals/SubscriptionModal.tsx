import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Check, 
  Crown, 
  Users, 
  Building, 
  BarChart3, 
  Zap,
  Phone,
  CreditCard
} from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlanFeature {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

const plans: PlanFeature[] = [
  {
    name: "Starter",
    price: "₹299",
    period: "/month",
    description: "Monthly subscription for small logistics operations",
    features: [
      "1 User Account",
      "1 Warehouse", 
      "100 Bookings/month",
      "Basic Features",
      "Email Support",
      "Fixed Monthly Fee"
    ]
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month", 
    description: "Monthly subscription for growing businesses",
    features: [
      "5 User Accounts",
      "3 Warehouses",
      "1000 Bookings/month",
      "Advanced Features",
      "GPS Tracking",
      "Invoice Generation",
      "Priority Support",
      "Fixed Monthly Fee"
    ],
    isPopular: true
  },
  {
    name: "Enterprise",
    price: "Commission",
    period: "based",
    description: "Pay per booking - custom commission rates",
    features: [
      "Unlimited Users",
      "Unlimited Warehouses", 
      "Unlimited Bookings",
      "AI Analytics",
      "Audit Logs",
      "Dedicated Support",
      "Custom Integration",
      "Pay per booking (5-15% commission)"
    ],
    isEnterprise: true
  }
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("razorpay");

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { planType: string; amount?: number }) => {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month from now
      
      await apiRequest('POST', '/api/subscription', {
        planType: data.planType.toLowerCase(),
        amount: data.amount,
        paymentMethod,
        endDate: endDate.toISOString(),
        isRecurring: true
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription created successfully! Welcome to your new plan."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    },
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

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    
    if (planName === "Enterprise") {
      toast({
        title: "Enterprise Plan",
        description: "Please contact our sales team for custom pricing.",
      });
      return;
    }

    const planAmount = planName === "Starter" ? 299 : planName === "Pro" ? 999 : 0;
    createSubscriptionMutation.mutate({ 
      planType: planName,
      amount: planAmount
    });
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Starter':
        return <Users className="h-8 w-8 text-white" />;
      case 'Pro':
        return <Building className="h-8 w-8 text-white" />;
      case 'Enterprise':
        return <BarChart3 className="h-8 w-8 text-white" />;
      default:
        return <Crown className="h-8 w-8 text-white" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Trial Banner */}
          {isTrialActive && (
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Free Trial Active</h3>
                    <p className="text-sm text-slate-600">
                      You have {trialDaysLeft} days remaining with full Pro features
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{trialDaysLeft}</p>
                  <p className="text-xs text-slate-600">Days Left</p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  plan.isPopular ? 'border-2 border-primary shadow-lg' : 'border hover:border-primary/50'
                } ${selectedPlan === plan.name ? 'ring-2 ring-primary' : ''}`}
                onClick={() => !createSubscriptionMutation.isPending && handleSelectPlan(plan.name)}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto bg-primary rounded-xl flex items-center justify-center mb-4">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-slate-900 mb-2">
                    {plan.price}
                    <span className="text-base font-normal text-slate-600">{plan.period}</span>
                  </div>
                  <p className="text-slate-600">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.isPopular ? '' : 'variant-outline'}`}
                    variant={plan.isPopular ? "default" : "outline"}
                    disabled={createSubscriptionMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan.name);
                    }}
                  >
                    {createSubscriptionMutation.isPending && selectedPlan === plan.name ? (
                      "Processing..."
                    ) : plan.isEnterprise ? (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Sales
                      </>
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PAY</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">Razorpay</h4>
                        <p className="text-sm text-slate-600">Cards, UPI, Net Banking, Wallets</p>
                      </div>
                      {paymentMethod === 'razorpay' && (
                        <Check className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-colors ${
                    paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('stripe')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-purple-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">STRIPE</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">Stripe</h4>
                        <p className="text-sm text-slate-600">International Cards & Payments</p>
                      </div>
                      {paymentMethod === 'stripe' && (
                        <Check className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Crown className="h-4 w-4" />
              <span>
                Your payment information is secure and encrypted. You can cancel or change your plan anytime.
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
