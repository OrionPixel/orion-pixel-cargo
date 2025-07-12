import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  Settings,
  Key,
  Percent,
  Save,
  RefreshCw,
} from "lucide-react";

interface ManageUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface UserAnalyticsData {
  totalBookings: number;
  totalRevenue: string;
  activeShipments: number;
  monthlyCommission: string;
  commissionRate: string;
  bookingsCount: number;
  rawRevenue: number;
  userCommissionRate: string;
}

interface UserDetailsData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  officeName: string;
  role: string;
  trialEndDate: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
  commissionRate: string;
}

export default function ManageUserModal({ isOpen, onClose, user }: ManageUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch real-time user details
  const { data: userDetails, isLoading: detailsLoading } = useQuery<UserDetailsData>({
    queryKey: [`/api/admin/users/${user?.id}/details`],
    enabled: !!user?.id && isOpen,
    staleTime: 30000,
    refetchInterval: false, // NO automatic polling - pure event-based
  });

  // Fetch real-time user analytics
  const { data: userAnalytics, isLoading: analyticsLoading } = useQuery<UserAnalyticsData>({
    queryKey: [`/api/admin/users/${user?.id}/analytics`],
    enabled: !!user?.id && isOpen,
    staleTime: 30000,
    refetchInterval: false, // NO automatic polling - pure event-based
  });
  
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    officeName: ''
  });

  const [newPassword, setNewPassword] = useState('');
  const [commissionRate, setCommissionRate] = useState('5.00');

  // Update state when user data is fetched
  useEffect(() => {
    if (userDetails) {
      setBasicInfo({
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        address: userDetails.address || '',
        officeName: userDetails.officeName || ''
      });
      setCommissionRate(userDetails.commissionRate || '5.00');
    } else if (user) {
      setBasicInfo({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        officeName: user.officeName || ''
      });
      setCommissionRate(user.commissionRate || '5.00');
    }
  }, [userDetails, user]);

  // Update basic info mutation
  const updateBasicInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/users/${user.id}/basic-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update user information');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User information updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${user.id}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user information",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: password }),
      });
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      setNewPassword('');
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Update commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (rate: string) => {
      const response = await fetch(`/api/admin/users/${user.id}/commission`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commissionRate: Number(rate) }),
      });
      if (!response.ok) {
        throw new Error('Failed to update commission rate');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission rate updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${user.id}/analytics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${user.id}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setCommissionRate('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission rate", 
        variant: "destructive",
      });
    },
  });

  const handleBasicInfoUpdate = () => {
    updateBasicInfoMutation.mutate(basicInfo);
  };

  const handlePasswordReset = () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate(newPassword);
  };

  const handleCommissionUpdate = () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 20) {
      toast({
        title: "Error",
        description: "Commission rate must be between 0% and 20%",
        variant: "destructive",
      });
      return;
    }
    updateCommissionMutation.mutate(commissionRate);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-surface border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-text-primary text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Manage User</span>
                <Badge variant="outline" className="text-xs bg-primary-500/10 text-primary-700 border-primary-300">
                  Real-time Data
                </Badge>
              </div>
              <p className="text-sm text-text-secondary font-normal mt-1">
                {user.firstName} {user.lastName} • {user.email}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Manage user information, security settings, and commission rates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* User Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-700">Total Bookings</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      <p className="text-xl font-bold text-primary-900">{userAnalytics?.totalBookings || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Total Revenue</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <p className="text-xl font-bold text-secondary-900">₹{Math.ceil(Number(userAnalytics?.totalRevenue || 0))}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent-700">Active Shipments</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      <p className="text-xl font-bold text-accent-900">{userAnalytics?.activeShipments || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">Commission Rate</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      <p className="text-xl font-bold text-orange-900">{userAnalytics?.userCommissionRate || '0'}%</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="basic-info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-surface border border-border">
              <TabsTrigger 
                value="basic-info" 
                className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="commission" 
                className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Commission
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info" className="space-y-6 mt-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <User className="h-5 w-5 text-primary-500" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {detailsLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName" className="text-text-primary flex items-center gap-2">
                          <User className="h-4 w-4 text-primary-500" />
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={basicInfo.firstName}
                          onChange={(e) => setBasicInfo({...basicInfo, firstName: e.target.value})}
                          className="mt-2 bg-surface border-border text-text-primary"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lastName" className="text-text-primary flex items-center gap-2">
                          <User className="h-4 w-4 text-primary-500" />
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={basicInfo.lastName}
                          onChange={(e) => setBasicInfo({...basicInfo, lastName: e.target.value})}
                          className="mt-2 bg-surface border-border text-text-primary"
                          placeholder="Enter last name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-text-primary flex items-center gap-2">
                          <Mail className="h-4 w-4 text-secondary-500" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={basicInfo.email}
                          onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                          className="mt-2 bg-surface border-border text-text-primary"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-text-primary flex items-center gap-2">
                          <Phone className="h-4 w-4 text-accent-500" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={basicInfo.phone}
                          onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                          className="mt-2 bg-surface border-border text-text-primary"
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="officeName" className="text-text-primary flex items-center gap-2">
                          <Building className="h-4 w-4 text-orange-500" />
                          Office Name
                        </Label>
                        <Input
                          id="officeName"
                          value={basicInfo.officeName}
                          onChange={(e) => setBasicInfo({...basicInfo, officeName: e.target.value})}
                          className="mt-2 bg-surface border-border text-text-primary"
                          placeholder="Enter office name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-text-primary flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={basicInfo.address}
                          onChange={(e) => setBasicInfo({...basicInfo, address: e.target.value})}
                          className="mt-2 bg-surface border-border text-text-primary"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={handleBasicInfoUpdate}
                      disabled={updateBasicInfoMutation.isPending || detailsLoading}
                      className="bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-2"
                    >
                      {updateBasicInfoMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {updateBasicInfoMutation.isPending ? "Updating..." : "Update Information"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent-500" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {detailsLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Account Status</span>
                        <Badge 
                          variant={userDetails?.isActive ? "default" : "secondary"}
                          className={userDetails?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                        >
                          {userDetails?.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Role</span>
                        <Badge variant="outline" className="text-text-primary border-border">
                          {userDetails?.role || user.role || 'User'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Subscription Plan</span>
                        <Badge variant="outline" className="text-text-primary border-border">
                          {userDetails?.subscriptionPlan || 'Basic'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Member Since</span>
                        <span className="font-medium text-text-primary">
                          {userDetails?.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Key className="h-5 w-5 text-accent-500" />
                    Password Reset
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-text-primary flex items-center gap-2">
                        <Shield className="h-4 w-4 text-accent-500" />
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-2 bg-surface border-border text-text-primary"
                        placeholder="Enter new password"
                      />
                      <p className="text-sm text-text-secondary mt-1">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <Button 
                      onClick={handlePasswordReset}
                      disabled={resetPasswordMutation.isPending || !newPassword.trim()}
                      className="bg-accent-500 hover:bg-accent-600 text-white flex items-center gap-2"
                    >
                      {resetPasswordMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commission" className="space-y-6 mt-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Percent className="h-5 w-5 text-orange-500" />
                    Commission Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="commissionRate" className="text-text-primary flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        Commission Rate (%)
                      </Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="mt-2 bg-surface border-border text-text-primary"
                        placeholder="Enter commission rate"
                      />
                      <p className="text-sm text-text-secondary mt-1">
                        Commission rate between 0% and 20%
                      </p>
                    </div>

                    {/* Real-time commission display */}
                    <div className="bg-muted/20 rounded-lg p-4 border border-border">
                      <h4 className="font-medium text-text-primary mb-3">Current Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-text-secondary">Monthly Commission</p>
                          {analyticsLoading ? (
                            <Skeleton className="h-6 w-16" />
                          ) : (
                            <p className="text-lg font-bold text-orange-600">
                              ₹{userAnalytics?.monthlyCommission || '0'}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Total Revenue</p>
                          {analyticsLoading ? (
                            <Skeleton className="h-6 w-20" />
                          ) : (
                            <p className="text-lg font-bold text-primary-600">
                              ₹{userAnalytics?.totalRevenue || '0'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCommissionUpdate}
                      disabled={updateCommissionMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                    >
                      {updateCommissionMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {updateCommissionMutation.isPending ? "Updating..." : "Update Commission Rate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}