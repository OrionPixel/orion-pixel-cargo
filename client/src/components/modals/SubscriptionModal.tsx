import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Crown, ArrowLeft, Phone, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Initialize Stripe with error handling
const stripePromise = (() => {
  try {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
    if (!key) {
      console.warn('⚠️ Stripe: No public key provided, Stripe payments will be disabled');
      return Promise.resolve(null);
    }
    return loadStripe(key);
  } catch (error) {
    console.error('❌ Stripe: Failed to initialize Stripe:', error);
    return Promise.resolve(null);
  }
})();

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

// Payment Form Component
function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if Stripe is available
  if (!stripe) {
    return (
      <div className="text-center p-6">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Unavailable</h3>
        <p className="text-gray-500">Stripe payment processing is currently unavailable. Please try again later or contact support.</p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
    });

    if (result.error) {
      toast({
        title: "Payment Failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay'>('stripe');
  const [clientSecret, setClientSecret] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch real plans from database
  const { data: availablePlans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription-plans'],
    enabled: isOpen
  });

  // Convert database plans to PlanFeature format
  const plans: PlanFeature[] = availablePlans ? availablePlans.map((plan: any) => ({
    name: plan.name,
    price: plan.name.toLowerCase() === 'enterprise' ? "Connect Team" : `₹${Math.ceil(parseFloat(plan.price)).toLocaleString()}`,
    period: plan.name.toLowerCase() === 'enterprise' ? "" : "per month",
    description: plan.description,
    features: JSON.parse(plan.features || '[]'),
    isPopular: plan.isPopular,
    isEnterprise: plan.name.toLowerCase() === 'enterprise'
  })) : [];

  // Check trial status
  const { data: userProfile } = useQuery({
    queryKey: ['/api/profile'],
    enabled: isOpen
  });

  const isTrialActive = userProfile?.subscriptionPlan === 'trial';
  const trialDaysLeft = userProfile?.trialDaysLeft || 0;

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planName: string) => {
      const selectedPlanData = availablePlans?.find((plan: any) => plan.name === planName);
      const amount = selectedPlanData ? Math.ceil(parseFloat(selectedPlanData.price) * 100) : 0; // Convert to paisa
      
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        planName,
        amount
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSelectPlan = async (planName: string) => {
    setSelectedPlan(planName);
    if (planName === 'Enterprise') {
      // For enterprise, show contact sales
      toast({
        title: "Enterprise Plan",
        description: "Please contact our sales team for enterprise pricing.",
      });
      return;
    }
    createSubscriptionMutation.mutate(planName);
  };

  const handleClose = () => {
    setShowPayment(false);
    setSelectedPlan('');
    setClientSecret('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showPayment ? "Complete Payment" : "Choose Your Plan"}
          </DialogTitle>
        </DialogHeader>
        
        {!showPayment ? (
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
                        {trialDaysLeft} days remaining in your trial
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Trial
                  </Badge>
                </div>
              </div>
            )}

            {/* Plans Grid - 3 plans in a single row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {plansLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader className="text-center pb-4">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center">
                            <div className="h-4 w-4 bg-gray-200 rounded mr-3"></div>
                            <div className="h-4 bg-gray-200 rounded flex-1"></div>
                          </div>
                        ))}
                      </div>
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))
              ) : plans.length > 0 ? (
                plans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative transition-all duration-300 hover:shadow-lg ${
                    plan.isPopular ? 'ring-2 ring-primary shadow-lg scale-105' : 'hover:scale-105'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-primary">{plan.price}</span>
                      <span className="text-sm text-slate-600 ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{plan.description}</p>
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
                ))
              ) : (
                // No plans available
                <div className="col-span-2 text-center py-8">
                  <div className="text-gray-500">No subscription plans available at the moment.</div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Refresh Page
                  </Button>
                </div>
              )}
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
        ) : showPayment && clientSecret ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setShowPayment(false)}
                className="p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Plan: {selectedPlan}</p>
                <p className="font-medium">
                  ₹{parseFloat(plans.find(p => p.name === selectedPlan)?.price.replace('₹', '').replace(',', '') || '0').toLocaleString('en-IN')}/month
                </p>
              </div>
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm />
              </Elements>
            ) : (
              <div className="text-center p-6">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Unavailable</h3>
                <p className="text-gray-500">Stripe payment processing is currently unavailable. Please try again later or contact support.</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}