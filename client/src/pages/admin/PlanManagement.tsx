import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  Crown,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  BarChart3,
  Zap
} from "lucide-react";

// Available features in the application
const AVAILABLE_FEATURES = {
  booking: {
    label: "Booking Management",
    features: [
      { id: "unlimited_bookings", name: "Unlimited Bookings", description: "No limit on number of bookings" },
      { id: "booking_types", name: "FTL/LTL/Part Load", description: "All booking types supported" },
      { id: "dynamic_pricing", name: "Dynamic Pricing", description: "Real-time price calculation" },
      { id: "payment_tracking", name: "Payment Tracking", description: "Track payment status" },
      { id: "barcode_qr", name: "Barcode & QR Generation", description: "Generate tracking codes" },
      { id: "pdf_export", name: "PDF Export", description: "Export booking documents" },
      { id: "bulk_booking", name: "Bulk Booking", description: "Create multiple bookings at once" },
      { id: "automated_quotes", name: "Automated Quotes", description: "AI-powered quote generation" }
    ]
  },
  tracking: {
    label: "GPS & Tracking",
    features: [
      { id: "realtime_gps", name: "Real-time GPS Tracking", description: "Live location tracking" },
      { id: "route_monitoring", name: "Route Monitoring", description: "Monitor delivery routes" },
      { id: "eta_calculations", name: "ETA Calculations", description: "Estimated arrival times" },
      { id: "live_tracking_map", name: "Live Tracking Map", description: "Interactive tracking map" },
      { id: "geofencing", name: "Geofencing Alerts", description: "Location-based alerts" },
      { id: "route_optimization", name: "Route Optimization", description: "Optimize delivery routes" },
      { id: "gps_device_integration", name: "GPS Device Integration", description: "Hardware GPS support" }
    ]
  },
  fleet: {
    label: "Fleet Management",
    features: [
      { id: "vehicle_management", name: "Vehicle Management", description: "Manage fleet vehicles" },
      { id: "driver_management", name: "Driver Management", description: "Driver information & tracking" },
      { id: "maintenance_tracking", name: "Maintenance Tracking", description: "Vehicle maintenance logs" },
      { id: "fuel_monitoring", name: "Fuel Monitoring", description: "Track fuel consumption" },
      { id: "vehicle_status", name: "Vehicle Status Tracking", description: "Real-time vehicle status" }
    ]
  },
  warehouse: {
    label: "Warehouse Operations",
    features: [
      { id: "warehouse_management", name: "Warehouse Management", description: "Multi-location warehouses" },
      { id: "inventory_tracking", name: "Inventory Tracking", description: "Stock monitoring" },
      { id: "capacity_management", name: "Capacity Management", description: "Warehouse capacity tracking" },
      { id: "stock_reporting", name: "Stock Reporting", description: "Inventory reports" }
    ]
  },
  analytics: {
    label: "Analytics & Reports",
    features: [
      { id: "performance_analytics", name: "Performance Analytics", description: "Business performance insights" },
      { id: "revenue_tracking", name: "Revenue Tracking", description: "Financial performance tracking" },
      { id: "custom_reports", name: "Custom Reports", description: "Generate custom reports" },
      { id: "cost_analysis", name: "Cost Analysis", description: "Cost optimization insights" },
      { id: "growth_tracking", name: "Growth Tracking", description: "Business growth metrics" },
      { id: "dashboard_analytics", name: "Dashboard Analytics", description: "Real-time dashboard" }
    ]
  },
  users: {
    label: "User Management",
    features: [
      { id: "agent_management", name: "Agent Management", description: "Manage office agents" },
      { id: "commission_tracking", name: "Commission Tracking", description: "Track agent commissions" },
      { id: "multi_user_dashboard", name: "Multi-user Dashboard", description: "Multiple user access" },
      { id: "role_based_access", name: "Role-based Access", description: "User permission management" },
      { id: "user_analytics", name: "User Analytics", description: "User performance tracking" }
    ]
  },
  support: {
    label: "Support & Communication",
    features: [
      { id: "email_support", name: "Email Support", description: "Email customer support" },
      { id: "phone_support", name: "Phone Support", description: "Phone customer support" },
      { id: "priority_support", name: "Priority Support", description: "High priority assistance" },
      { id: "notifications", name: "Notifications", description: "Real-time notifications" },
      { id: "messaging", name: "In-app Messaging", description: "Internal messaging system" }
    ]
  },
  integration: {
    label: "Integrations & API",
    features: [
      { id: "api_access", name: "API Access", description: "Full API access" },
      { id: "custom_integrations", name: "Custom Integrations", description: "Third-party integrations" },
      { id: "webhook_support", name: "Webhook Support", description: "Real-time data webhooks" },
      { id: "white_label", name: "White-label Options", description: "Brand customization" }
    ]
  },
  security: {
    label: "Security & Compliance",
    features: [
      { id: "gst_compliance", name: "GST Compliance", description: "Tax compliance features" },
      { id: "secure_payments", name: "Secure Payments", description: "Encrypted payment processing" },
      { id: "data_backup", name: "Data Backup", description: "Automated data backups" },
      { id: "ssl_security", name: "SSL Security", description: "Secure data transmission" }
    ]
  }
};

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  price: z.number().min(-1, "Price must be valid (use -1 for Contact Team pricing)"),
  duration: z.number().min(1, "Duration must be at least 1 month"),
  trialDays: z.number().min(0, "Trial days cannot be negative"),
  selectedFeatures: z.array(z.string()).min(1, "At least one feature must be selected"),
  maxBookings: z.number().min(1, "Max bookings must be positive"),
  maxVehicles: z.number().min(1, "Max vehicles must be positive"),
  maxAgents: z.number().min(0, "Max agents cannot be negative"),
  isActive: z.boolean(),
  isPopular: z.boolean(),
  discountPercentage: z.number().min(0).max(100).optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

// Helper function to get feature name by ID
const getFeatureName = (featureId: string): string => {
  for (const category of Object.values(AVAILABLE_FEATURES)) {
    const feature = category.features.find(f => f.id === featureId);
    if (feature) return feature.name;
  }
  return featureId;
};

// Helper function to convert feature IDs to display string
const featuresToString = (featureIds: string[]): string => {
  return featureIds.map(id => getFeatureName(id)).join(', ');
};

// CategoryWiseFeatureSelector Component
function CategoryWiseFeatureSelector({ field }: { field: any }) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="space-y-4">
        {Object.entries(AVAILABLE_FEATURES).map(([categoryKey, category]) => {
          const isExpanded = expandedCategories[categoryKey];
          const selectedCount = Array.isArray(field.value) 
            ? field.value.filter((f: string) => 
                category.features.some(feature => feature.id === f)
              ).length 
            : 0;

          return (
            <div key={categoryKey} className="border rounded-lg">
              <button
                type="button"
                onClick={() => toggleCategory(categoryKey)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{isExpanded ? '📂' : '📁'}</div>
                  <div>
                    <h4 className="font-semibold text-primary">{category.label}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedCount} / {category.features.length} features selected
                    </p>
                  </div>
                </div>
                <div className="text-gray-400">
                  {isExpanded ? '−' : '+'}
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {category.features.map((feature) => (
                    <div key={feature.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                      <input
                        type="checkbox"
                        id={feature.id}
                        checked={Array.isArray(field.value) ? field.value.includes(feature.id) : false}
                        onChange={(e) => {
                          const currentFeatures = Array.isArray(field.value) ? field.value : [];
                          if (e.target.checked) {
                            field.onChange([...currentFeatures, feature.id]);
                          } else {
                            field.onChange(currentFeatures.filter((id: string) => id !== feature.id));
                          }
                        }}
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor={feature.id} className="flex-1 text-sm cursor-pointer">
                        <div className="font-medium text-gray-900">{feature.name}</div>
                        <div className="text-gray-600 mt-1">{feature.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPlanManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("plans");
  const [priceType, setPriceType] = useState<"regular" | "free" | "connect">("regular");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration: 1,
      trialDays: 7,
      selectedFeatures: [],
      maxBookings: 100,
      maxVehicles: 10,
      maxAgents: 5,
      isActive: true,
      isPopular: false,
      discountPercentage: 0,
    },
  });

  // Fetch subscription plans from API
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch subscription plan stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/subscription-plans/stats"],
    enabled: !!user && user.role === 'admin',
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: PlanFormData) => apiRequest("POST", "/api/admin/subscription-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans/stats"] });
      toast({
        title: "Plan Created",
        description: "Subscription plan has been created successfully",
      });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: (data: PlanFormData & { id: number }) => apiRequest("PUT", `/api/admin/subscription-plans/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans/stats"] });
      toast({
        title: "Plan Updated",
        description: "Subscription plan has been updated successfully",
      });
      setIsModalOpen(false);
      setEditingPlan(null);
      form.reset();
    },
    onError: (error) => {
      console.error('❌ Plan Update Error:', error);
      toast({
        title: "Error",
        description: `Failed to update plan: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (planId: number) => apiRequest("DELETE", `/api/admin/subscription-plans/${planId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans/stats"] });
      toast({
        title: "Plan Deleted",
        description: "Subscription plan has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const subscriptions = [
    {
      id: 1,
      userId: "74626241-9c12-4b8d-9ac3-a3e564a63792",
      userName: "Arjun Patel",
      userEmail: "orionpixel07@gmail.com",
      planName: "Professional",
      status: "active",
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      amount: 2999,
      paymentStatus: "paid",
      autoRenewal: true
    },
    {
      id: 2,
      userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      userName: "Priya Sharma",
      userEmail: "priya.sharma@example.com",
      planName: "Enterprise",
      status: "trial",
      startDate: "2025-01-20",
      endDate: "2025-02-03",
      amount: 4999,
      paymentStatus: "pending",
      autoRenewal: false
    }
  ];

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && plan.isActive) ||
                         (statusFilter === "inactive" && !plan.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setPriceType("regular"); // Reset to regular pricing for new plans
    form.reset({
      name: "",
      description: "",
      price: 0,
      duration: 1,
      trialDays: 7,
      selectedFeatures: [],
      maxBookings: 100,
      maxVehicles: 10,
      maxAgents: 5,
      isActive: true,
      isPopular: false,
      discountPercentage: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    
    // Set price type based on plan price
    if (plan.price === 0) {
      setPriceType("free");
    } else if (plan.price === -1) {
      setPriceType("connect");
    } else {
      setPriceType("regular");
    }
    
    // Parse features from string to array if needed
    let parsedFeatures = [];
    if (typeof plan.features === 'string') {
      // If it's a string, try to parse it as JSON first, otherwise split by comma
      try {
        parsedFeatures = JSON.parse(plan.features);
      } catch {
        parsedFeatures = plan.features.split(',').map(f => f.trim()).filter(f => f.length > 0);
      }
    } else if (Array.isArray(plan.features)) {
      parsedFeatures = plan.features;
    }
    
    form.reset({
      name: plan.name,
      description: plan.description,
      price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price,
      duration: plan.duration,
      trialDays: plan.trialDays || 7,
      selectedFeatures: parsedFeatures,
      maxBookings: plan.maxBookings === -1 ? 999999 : plan.maxBookings,
      maxVehicles: plan.maxVehicles === -1 ? 999999 : plan.maxVehicles,
      maxAgents: plan.maxAgents === -1 ? 999999 : plan.maxAgents,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      discountPercentage: plan.discountPercentage || 0,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: PlanFormData) => {
    console.log('🔍 Form Submit Triggered:', {
      formValid: form.formState.isValid,
      isDirty: form.formState.isDirty,
      errors: form.formState.errors,
      formData: data,
      editingPlan: editingPlan?.id
    });

    // Manual validation check using Zod
    const validationResult = planSchema.safeParse(data);
    console.log('🔧 Manual Zod Validation Result:', {
      success: validationResult.success,
      errors: validationResult.success ? null : validationResult.error.flatten(),
      data: validationResult.success ? validationResult.data : null
    });

    // Use Zod validation result instead of React Hook Form state
    if (!validationResult.success) {
      console.error('❌ Manual Zod validation failed:', validationResult.error.flatten());
      toast({
        title: "Validation Error",
        description: "Please check form fields and try again.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Validation passed, proceeding with submit...');
    
    // Prepare the data with proper features conversion
    const processedData = {
      ...data,
      features: Array.isArray(data.selectedFeatures) ? JSON.stringify(data.selectedFeatures) : data.selectedFeatures
    };
    
    console.log('📊 Plan Update Data:', {
      original: data,
      processed: processedData,
      editingPlan: editingPlan?.id,
      selectedFeatures: data.selectedFeatures
    });
    
    if (editingPlan) {
      updatePlanMutation.mutate({ ...processedData, id: editingPlan.id });
    } else {
      createPlanMutation.mutate(processedData);
    }
  };

  const totalRevenue = plans.reduce((sum, plan) => sum + (plan.revenue || 0), 0);
  const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscribersCount || 0), 0);
  const activePlans = plans.filter(p => p.isActive).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: `hsl(var(--primary))` }}>
            Plan Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage subscription plans, pricing, and user subscriptions
          </p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="bg-gradient-to-r"
          style={{ 
            background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
            color: 'white'
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--primary))` }}>Total Revenue</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  ₹{Math.ceil(totalRevenue).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8" style={{ color: `hsl(var(--primary))` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--secondary))` }}>Total Subscribers</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--secondary))` }}>
                  {totalSubscribers}
                </p>
              </div>
              <Users className="h-8 w-8" style={{ color: `hsl(var(--secondary))` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--accent))` }}>Active Plans</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--accent))` }}>
                  {activePlans}
                </p>
              </div>
              <Package className="h-8 w-8" style={{ color: `hsl(var(--accent))` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--primary))` }}>Avg. Revenue/Plan</p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  ₹{Math.ceil(totalRevenue / plans.length).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8" style={{ color: `hsl(var(--primary))` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search plans..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Plans Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans ({filteredPlans.length})</CardTitle>
              <CardDescription>
                Manage pricing plans and their features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Trial Days</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{plan.name}</span>
                              {plan.isPopular && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {plan.price === 0 ? (
                            <span className="font-medium text-green-600">Free</span>
                          ) : plan.price === -1 ? (
                            <span className="font-medium text-blue-600">Connect Team</span>
                          ) : (
                            <>
                              <span className="font-medium">₹{Math.ceil(plan.price).toLocaleString()}</span>
                              <span className="text-muted-foreground"> per month</span>
                            </>
                          )}
                          {plan.discountPercentage > 0 && plan.price > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                              {plan.discountPercentage}% OFF
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{plan.trialDays || 7} days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {plan.subscribersCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₹{Math.ceil(plan.revenue || 0).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          {/* Subscriptions Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users or plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions ({filteredSubscriptions.length})</CardTitle>
              <CardDescription>
                Monitor user subscription status and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.userName}</div>
                          <div className="text-sm text-muted-foreground">{subscription.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subscription.planName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status === 'active' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Trial
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(subscription.startDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">to {new Date(subscription.endDate).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₹{Math.ceil(subscription.amount).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subscription.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                          {subscription.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update plan details and features' : 'Create a new subscription plan for users'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Professional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Options</FormLabel>
                      <div className="space-y-3">
                        {/* Price Type Selector */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPriceType("regular");
                              field.onChange(field.value || 0);
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              priceType === "regular" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            Regular Price
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPriceType("free");
                              field.onChange(0);
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              priceType === "free" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            Free
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPriceType("connect");
                              field.onChange(-1); // Special value for "Connect team"
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              priceType === "connect" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            Connect Team
                          </button>
                        </div>

                        {/* Price Input - only show for regular pricing */}
                        {priceType === "regular" && (
                          <div className="relative">
                            <Input 
                              type="number" 
                              placeholder="2999" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="pr-20"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-sm text-muted-foreground">per month</span>
                            </div>
                          </div>
                        )}

                        {/* Display selected option */}
                        {priceType === "free" && (
                          <div className="text-sm text-muted-foreground bg-green-50 border border-green-200 rounded-md px-3 py-2">
                            🆓 This plan will be completely free
                          </div>
                        )}

                        {priceType === "connect" && (
                          <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                            📞 Users will need to contact your team for pricing
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Plan description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectedFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Features</FormLabel>
                    <CategoryWiseFeatureSelector field={field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxBookings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Bookings</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxVehicles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Vehicles</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAgents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Agents</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trialDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trial Days</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="7" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active Plan</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Popular Plan</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  onClick={() => {
                    console.log('🔘 Update Button Clicked!', {
                      isFormValid: form.formState.isValid,
                      isDirty: form.formState.isDirty,
                      errors: form.formState.errors,
                      currentValues: form.getValues()
                    });
                  }}
                  style={{ 
                    background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
                    color: 'white'
                  }}
                >
                  {(createPlanMutation.isPending || updatePlanMutation.isPending) 
                    ? "Saving..." 
                    : editingPlan ? 'Update Plan' : 'Create Plan'
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}