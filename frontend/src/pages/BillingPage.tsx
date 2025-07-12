import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Settings, TrendingUp, DollarSign } from "lucide-react";

export default function BillingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [rateMethod, setRateMethod] = useState<'auto' | 'manual'>('auto');

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

  const { data: billingDetails, isLoading } = useQuery({
    queryKey: ["/api/billing"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/billing");
      return response.json();
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { rateCalculationMethod: string }) => {
      // Store in localStorage for now since database column doesn't exist yet
      localStorage.setItem('rateCalculationMethod', settings.rateCalculationMethod);
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your rate calculation settings have been saved locally.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRateMethodChange = (checked: boolean) => {
    const newMethod = checked ? 'manual' : 'auto';
    setRateMethod(newMethod);
    updateSettingsMutation.mutate({ rateCalculationMethod: newMethod });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading billing details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Billing & Settings</h1>
          <p className="text-slate-600 mt-1">Manage your subscription and booking preferences</p>
        </div>
      </div>

      {/* Subscription Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Current Plan</p>
                <p className="text-2xl font-bold text-blue-900 capitalize">
                  {billingDetails?.subscriptionPlan || 'Trial'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{Math.round(billingDetails?.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {billingDetails?.subscriptionPlan === 'enterprise' && (
          <>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Billing Rate</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {billingDetails?.billingPercentage || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                    <Settings className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-700">Monthly Billing</p>
                    <p className="text-2xl font-bold text-orange-900">
                      ₹{Math.round(billingDetails?.monthlyBilling || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Enterprise Billing Details */}
      {billingDetails?.subscriptionPlan === 'enterprise' && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Enterprise Billing Details</span>
            </CardTitle>
            <CardDescription className="text-purple-100">
              Your revenue-based billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">Billing Overview</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Revenue Generated:</span>
                    <span className="font-semibold">₹{Math.round(billingDetails.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Platform Fee Rate:</span>
                    <Badge variant="outline">{billingDetails.billingPercentage}% of revenue</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Monthly Platform Fee:</span>
                    <span className="font-semibold text-purple-600">₹{Math.round(billingDetails.monthlyBilling || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">Billing Model</h4>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">
                    As an Enterprise customer, you pay a percentage of your total revenue instead of fixed subscription fees. 
                    This ensures you only pay as your business grows.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Calculation Settings */}
      <Card className="shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Booking Rate Settings</span>
          </CardTitle>
          <CardDescription>
            Choose how your booking rates are calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="rate-method" className="text-base font-semibold">
                  Rate Calculation Method
                </Label>
                <p className="text-sm text-slate-600">
                  Choose between automatic rate calculation or manual rate entry for bookings
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Label htmlFor="rate-method" className="text-sm">
                  {rateMethod === 'auto' ? 'Automatic' : 'Manual'}
                </Label>
                <Switch
                  id="rate-method"
                  checked={rateMethod === 'manual'}
                  onCheckedChange={handleRateMethodChange}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Automatic Calculation</span>
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Rates are automatically calculated based on distance, weight, cargo type, and current market rates. 
                    This ensures competitive and fair pricing.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Manual Entry</span>
                </h4>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-800">
                    You can manually enter custom rates for each booking. This gives you full control over pricing 
                    but requires you to set rates for every shipment.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-2">Current Setting</h4>
              <div className="flex items-center space-x-2">
                <Badge variant={billingDetails?.rateCalculationMethod === 'auto' ? 'default' : 'secondary'}>
                  {billingDetails?.rateCalculationMethod === 'auto' ? 'Automatic Calculation' : 'Manual Entry'}
                </Badge>
                <span className="text-sm text-slate-600">
                  {billingDetails?.rateCalculationMethod === 'auto' 
                    ? 'Rates are calculated automatically' 
                    : 'You can enter custom rates for each booking'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}