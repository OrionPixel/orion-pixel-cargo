import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  CheckCircle, 
  Ban, 
  Search, 
  DollarSign, 
  Calendar, 
  Package, 
  Crown, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Target, 
  Edit, 
  Save, 
  X,
  UserPlus,
  Clock,
  AlertTriangle,
  Building2,
  RefreshCw,
  Settings,
  BarChart3,
  Trash2,
  Gift
} from 'lucide-react';
import UserAnalyticsModal from '@/components/modals/UserAnalyticsModal';
import ManageUserModal from '@/components/modals/ManageUserModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  commissionRate: string;
  trialDaysRemaining: number;
  trialStartDate?: string;
  officeName?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  isFreeAccess?: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: string;
  monthlyGrowth: string;
}

interface UserAnalytics {
  totalBookings: number;
  totalRevenue: string;
  monthlyCommission: string;
  activeShipments: number;
  commissionRate: string;
}

function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<string>('');
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState<any>(null);
  const [selectedUserForManagement, setSelectedUserForManagement] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    role: 'transporter',
    subscriptionPlan: 'starter',
    branch: '',
    isFreeAccess: false,
    commissionRate: '5'
  });

  // Authentication check
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    window.location.href = "/admin-login";
    return null;
  }

  // Data fetching with cache disabled for real-time trial data
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    onSuccess: (data) => {
      console.log('📊 Admin Users Data Fetched (Fresh):', data);
      console.log('🔍 First 3 users trial data check:', 
        data.slice(0, 3).map(u => ({
          name: u.firstName,
          status: u.subscriptionStatus,
          plan: u.subscriptionPlan,
          trialDays: u.trialDaysRemaining
        }))
      );
    }
  });



  const { data: stats = {} } = useQuery<UserStats>({
    queryKey: ['/api/admin/user-stats'],
    enabled: !!user && user.role === 'admin',
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Theme settings
  const { data: themeSettings = { primaryColor: '#72ab61', secondaryColor: '#acd5a0', accentColor: '#8dcf78' } } = useQuery({
    queryKey: ['/api/admin/theme-settings'],
    enabled: !!user && user.role === 'admin',
  });



  // Mutations
  const commissionMutation = useMutation({
    mutationFn: async ({ userId, commissionRate }: { userId: string; commissionRate: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: Number(commissionRate) })
      });
      if (!response.ok) throw new Error('Failed to update commission');
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Commission Updated",
        description: `Commission rate set to ${variables.commissionRate}% successfully`,
      });
      setEditingCommission(null);
      setNewCommissionRate('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update commission rate",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Created",
        description: `${newUserData.firstName} ${newUserData.lastName} has been created successfully`,
      });
      setShowCreateUserDialog(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
        role: 'transporter',
        subscriptionPlan: 'starter',
        branch: '',
        isFreeAccess: false,
        commissionRate: '5'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Deleted",
        description: `${userToDelete?.firstName} ${userToDelete?.lastName} has been deleted successfully`,
      });
      setShowDeleteConfirmation(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Create function to handle trial extension for specific user
  const handleExtendTrial = async (userId: string, days: number) => {
    try {
      console.log(`🚀 Making API call to extend trial for user ${userId} by ${days} days`);
      
      // Use apiRequest from queryClient for proper authentication
      const response = await fetch(`/api/admin/users/${userId}/extend-trial`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({ days })
      });
      console.log(`📡 Trial extension API response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Trial extension failed:`, error);
        toast({
          title: "Extension Failed",
          description: error.message || "Failed to extend trial",
          variant: "destructive",
        });
        return;
      }
      
      const result = await response.json();
      console.log(`✅ Trial extension successful:`, result);
      
      toast({
        title: "Trial Extended",
        description: `Trial extended by ${days} days successfully`,
      });
      
      // Aggressive cache invalidation for trial extension - Clear everything
      console.log('🔄 Starting aggressive cache invalidation...');
      
      // Clear all possible related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/details`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/analytics`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/comprehensive-analytics'] })
      ]);
      
      // Force remove from cache completely
      queryClient.removeQueries({ queryKey: ['/api/admin/users'] });
      queryClient.removeQueries({ queryKey: [`/api/admin/users/${userId}`] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      
      console.log('✅ Aggressive cache invalidation completed');
    } catch (error: any) {
      console.error(`💥 Trial extension error:`, error);
      toast({
        title: "Extension Failed",
        description: "Failed to extend trial",
        variant: "destructive",
      });
    }
  };

  // Create function to handle free account enable for specific user
  const handleEnableFreeAccount = async (userId: string) => {
    try {
      console.log(`🚀 Making API call to enable free account for user ${userId}`);
      const response = await fetch(`/api/admin/users/${userId}/enable-free-account`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        mode: 'cors'
      });
      console.log(`📡 Free account API response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Free account enable failed:`, error);
        toast({
          title: "Failed to Enable Free Account",
          description: error.message || "Failed to enable free account",
          variant: "destructive",
        });
        return;
      }
      
      const result = await response.json();
      console.log(`✅ Free account enable successful:`, result);
      
      toast({
        title: "Free Account Enabled",
        description: "User now has unlimited free access with enterprise features",
      });
      
      // Aggressive cache invalidation for free account enable - Clear everything
      console.log('🔄 Starting aggressive cache invalidation for free account...');
      
      // Clear all possible related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/details`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/analytics`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/comprehensive-analytics'] })
      ]);
      
      // Force remove from cache completely
      queryClient.removeQueries({ queryKey: ['/api/admin/users'] });
      queryClient.removeQueries({ queryKey: [`/api/admin/users/${userId}`] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      
      console.log('✅ Aggressive cache invalidation for free account completed');
    } catch (error: any) {
      console.error(`💥 Free account error:`, error);
      toast({
        title: "Failed to Enable Free Account",
        description: "Failed to enable free account",
        variant: "destructive",
      });
    }
  };

  // Helper functions

  // Helper function to check if user is active based on last login (14 days rule)
  const isUserActive = (user: any) => {
    if (!user.lastLogin) {
      // If never logged in, check account creation date
      // If account is less than 14 days old, consider active
      const createdDate = new Date(user.createdAt);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return createdDate > fourteenDaysAgo; // Active if account created within 14 days
    }
    
    // If has logged in, check last login date
    const lastLoginDate = new Date(user.lastLogin);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return lastLoginDate > fourteenDaysAgo;
  };

  // Helper function to get trial status with days remaining
  const getTrialStatus = (user: any) => {
    // Debug info for trial status detection
    console.log(`🔍 Frontend Trial Status Check - User ${user.firstName}: Status=${user.subscriptionStatus}, Plan=${user.subscriptionPlan}, TrialDays=${user.trialDaysRemaining}`);
    
    // Check if user is on trial (either trial status or trial plan)
    if ((user.subscriptionStatus === 'trial' || user.subscriptionPlan === 'trial') && user.trialDaysRemaining !== undefined && user.trialDaysRemaining !== null) {
      const daysLeft = user.trialDaysRemaining;
      return {
        text: `Trial (${daysLeft} days left)`,
        color: daysLeft > 7 ? 'bg-blue-100 text-blue-700' : 
               daysLeft > 3 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
      };
    }
    
    // Activity-based status for non-trial users
    const active = isUserActive(user);
    return {
      text: active ? 'Active' : 'Inactive',
      color: active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
    };
  };;

  // Filter users based on search and exclude office/agent/admin accounts
  const filteredUsers = users.filter((user: any) => {
    // Exclude office/agent/admin accounts - only show main users
    if (user.role === 'office' || user.role === 'agent' || user.role === 'admin') return false;
    
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateUser = () => {
    createUserMutation.mutate(newUserData);
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="space-y-6 p-6 min-h-screen" 
      style={{ 
        background: `linear-gradient(135deg, ${themeSettings.primaryColor}05 0%, ${themeSettings.secondaryColor}03 50%, ${themeSettings.accentColor}02 100%)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: themeSettings.primaryColor }}>
            User Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage users, commissions, and analytics with admin controls
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateUserDialog(true)}
          className="text-white shadow-lg border-0 px-6 py-3 text-base font-medium"
          style={{ 
            backgroundColor: themeSettings.primaryColor,
            boxShadow: `0 4px 12px ${themeSettings.primaryColor}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = themeSettings.secondaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = themeSettings.primaryColor;
          }}
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card 
          className="shadow-lg border-0 overflow-hidden"
          style={{ 
            backgroundColor: 'white',
            border: `1px solid ${themeSettings.primaryColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${themeSettings.primaryColor}15` }}
              >
                <Users className="h-6 w-6" style={{ color: themeSettings.primaryColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold" style={{ color: themeSettings.primaryColor }}>
                  {filteredUsers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg border-0 overflow-hidden"
          style={{ 
            backgroundColor: 'white',
            border: `1px solid ${themeSettings.secondaryColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${themeSettings.secondaryColor}15` }}
              >
                <CheckCircle className="h-6 w-6" style={{ color: themeSettings.secondaryColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Users</p>
                <p className="text-3xl font-bold" style={{ color: themeSettings.secondaryColor }}>
                  {users.filter((u: any) => u.subscriptionStatus === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg border-0 overflow-hidden"
          style={{ 
            backgroundColor: 'white',
            border: `1px solid ${themeSettings.accentColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${themeSettings.accentColor}15` }}
              >
                <Package className="h-6 w-6" style={{ color: themeSettings.accentColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Trial Users</p>
                <p className="text-3xl font-bold" style={{ color: themeSettings.accentColor }}>
                  {users.filter((u: any) => u.subscriptionStatus === 'trial').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg border-0 overflow-hidden"
          style={{ 
            backgroundColor: 'white',
            border: `1px solid ${themeSettings.primaryColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${themeSettings.primaryColor}15` }}
              >
                <DollarSign className="h-6 w-6" style={{ color: themeSettings.primaryColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold" style={{ color: themeSettings.primaryColor }}>
                  ₹{Math.ceil(Number((stats as any).totalRevenue || 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card 
        className="shadow-lg border-0 mb-8"
        style={{ 
          backgroundColor: 'white',
          border: `1px solid ${(themeSettings as any).primaryColor}15`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                style={{ color: `${(themeSettings as any).primaryColor}60` }}
              />
              <Input
                placeholder="Search users by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-base border-0 bg-gray-50 rounded-xl focus:ring-2 focus:bg-white transition-all"
                style={{ 
                  focusRingColor: `${(themeSettings as any).primaryColor}30`,
                  borderColor: `${(themeSettings as any).primaryColor}20`
                }}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/user-stats'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/comprehensive-analytics'] });
                  toast({
                    title: "Data Refreshed",
                    description: "User data has been refreshed successfully",
                  });
                }}
                className="text-white font-medium px-4 py-2 border-0"
                style={{ backgroundColor: themeSettings.accentColor }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <div className="text-sm text-gray-600 font-medium">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogTrigger asChild>
          <Button className="bg-primary-500 hover:bg-primary-600 text-white shadow-md">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="text-text-primary">Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-text-primary">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    placeholder="Enter first name"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-text-primary">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    placeholder="Enter last name"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-text-primary">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="Enter email address"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-text-primary">Phone</Label>
                  <Input
                    id="phone"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-text-primary">Address</Label>
                <Input
                  id="address"
                  value={newUserData.address}
                  onChange={(e) => setNewUserData({...newUserData, address: e.target.value})}
                  placeholder="Enter complete address"
                  className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-text-primary">City</Label>
                  <Input
                    id="city"
                    value={newUserData.city}
                    onChange={(e) => setNewUserData({...newUserData, city: e.target.value})}
                    placeholder="City"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-text-primary">State</Label>
                  <Input
                    id="state"
                    value={newUserData.state}
                    onChange={(e) => setNewUserData({...newUserData, state: e.target.value})}
                    placeholder="State"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
                <div>
                  <Label htmlFor="pinCode" className="text-text-primary">Pin Code</Label>
                  <Input
                    id="pinCode"
                    value={newUserData.pinCode}
                    onChange={(e) => setNewUserData({...newUserData, pinCode: e.target.value})}
                    placeholder="Pin Code"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="role" className="text-text-primary">Role</Label>
                  <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                    <SelectTrigger className="bg-surface border-border text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border">
                      <SelectItem value="transporter">Transporter</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch" className="text-text-primary">Branch</Label>
                  <Input
                    id="branch"
                    value={newUserData.branch}
                    onChange={(e) => setNewUserData({...newUserData, branch: e.target.value})}
                    placeholder="Enter branch name (e.g., Bhopal Branch)"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
                <div>
                  <Label htmlFor="commissionRate" className="text-text-primary">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    value={newUserData.commissionRate}
                    onChange={(e) => setNewUserData({...newUserData, commissionRate: e.target.value})}
                    placeholder="5"
                    min="0"
                    max="100"
                    step="0.1"
                    className="bg-surface border-border text-text-primary placeholder:text-text-secondary"
                  />
                </div>
              </div>

              {/* Subscription Plan and Free Access */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subscriptionPlan" className="text-text-primary">Subscription Plan</Label>
                  <Select 
                    value={newUserData.isFreeAccess ? 'free' : newUserData.subscriptionPlan} 
                    onValueChange={(value) => {
                      if (value === 'free') {
                        setNewUserData({...newUserData, subscriptionPlan: 'enterprise', isFreeAccess: true});
                      } else {
                        setNewUserData({...newUserData, subscriptionPlan: value, isFreeAccess: false});
                      }
                    }}
                  >
                    <SelectTrigger className="bg-surface border-border text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border">
                      <SelectItem value="starter">Starter Plan</SelectItem>
                      <SelectItem value="professional">Professional Plan</SelectItem>
                      <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                      <SelectItem value="free">Free Enterprise Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2 pb-2">
                    <input
                      type="checkbox"
                      id="isFreeAccess"
                      checked={newUserData.isFreeAccess}
                      onChange={(e) => setNewUserData({
                        ...newUserData, 
                        isFreeAccess: e.target.checked,
                        subscriptionPlan: e.target.checked ? 'enterprise' : 'starter'
                      })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isFreeAccess" className="text-text-primary text-sm">
                      Enable Free Enterprise Access
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="bg-surface border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateUserDialog(false)}
                className="border-border text-text-primary hover:bg-secondary-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending || !newUserData.firstName || !newUserData.lastName || !newUserData.email}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Grid - One per row like booking cards */}
      <div className="space-y-4">
        {filteredUsers.map((userItem: any) => {
          const UserAnalyticsCard = ({ user }: { user: any }) => {
            const { data: analytics = { 
              totalBookings: 0, 
              totalRevenue: '0', 
              activeShipments: 0, 
              monthlyCommission: '0',
              commissionRate: user.commissionRate || '5.00'
            }, isLoading: analyticsLoading } = useQuery<UserAnalytics>({
              queryKey: [`/api/admin/users/${user.id}/analytics`],
              enabled: !!user.id && user.role !== 'admin',
              staleTime: 0,
              refetchInterval: false, // NO automatic polling - pure event-based
              refetchOnWindowFocus: true,
              refetchOnMount: true,
            });

            return (
              <Card 
                key={user.id} 
                className="hover:shadow-md transition-shadow bg-white"
                style={{ 
                  borderTop: '2px solid hsl(var(--primary) / 0.3)', 
                  borderRight: '2px solid hsl(var(--primary) / 0.3)', 
                  borderBottom: '2px solid hsl(var(--primary) / 0.3)', 
                  borderLeft: '4px solid hsl(var(--primary))'
                }}
              >
                
                <CardContent className="p-6">
                  {/* THREE ROW LAYOUT - UPDATED */}
                  {/* Row 1: User Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: (themeSettings as any).primaryColor }}
                    >
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge 
                            className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ 
                              backgroundColor: `${(themeSettings as any).secondaryColor}20`,
                              color: (themeSettings as any).secondaryColor
                            }}
                          >
                            {user.subscriptionPlan || 'trial'}
                          </Badge>
                          <Badge className={getTrialStatus(user).color}>
                            {getTrialStatus(user).text}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Analytics Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-white border-2 rounded-xl" style={{ borderColor: `${(themeSettings as any).primaryColor}20` }}>
                      <p className="text-2xl font-bold" style={{ color: (themeSettings as any).primaryColor }}>
                        {analyticsLoading ? (
                          <span className="animate-pulse bg-gray-200 h-8 w-12 rounded inline-block"></span>
                        ) : (
                          analytics.totalBookings || 0
                        )}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-1">Total Bookings</p>
                    </div>
                    
                    <div className="text-center p-4 bg-white border-2 rounded-xl" style={{ borderColor: `${(themeSettings as any).secondaryColor}20` }}>
                      <p className="text-2xl font-bold" style={{ color: (themeSettings as any).secondaryColor }}>
                        {analyticsLoading ? (
                          <span className="animate-pulse bg-gray-200 h-8 w-16 rounded inline-block"></span>
                        ) : (
                          `₹${Math.ceil(parseFloat(analytics.totalRevenue || '0')).toLocaleString()}`
                        )}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-1">Revenue</p>
                    </div>
                    
                    <div className="text-center p-4 bg-white border-2 rounded-xl" style={{ borderColor: `${(themeSettings as any).accentColor}20` }}>
                      <p className="text-2xl font-bold" style={{ color: (themeSettings as any).accentColor }}>
                        {analytics.activeShipments || 0}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-1">Active Shipments</p>
                    </div>
                    
                    <div className="text-center p-4 bg-white border-2 rounded-xl" style={{ borderColor: `${(themeSettings as any).primaryColor}20` }}>
                      <p className="text-2xl font-bold" style={{ color: (themeSettings as any).primaryColor }}>
                        {analyticsLoading ? (
                          <span className="animate-pulse bg-gray-200 h-8 w-16 rounded inline-block"></span>
                        ) : (
                          `₹${Math.ceil(parseFloat(analytics.monthlyCommission || '0')).toLocaleString()}`
                        )}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-1">Commission</p>
                    </div>
                  </div>

                  {/* Row 3: Action Buttons */}
                  <div className="grid grid-cols-5 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUserForAnalytics(user)}
                      className="text-white font-medium py-2 border-0"
                      style={{ backgroundColor: (themeSettings as any).accentColor }}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSelectedUserForManagement(user)}
                      className="text-white font-medium py-2 border-0"
                      style={{ backgroundColor: (themeSettings as any).primaryColor }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    {/* Trial Extension Button - Show for trial users */}
                    {(user.subscriptionStatus === 'trial' || user.subscriptionPlan === 'trial') && (
                      <Button
                        key={`trial-${user.id}`}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log(`🕐 Extending trial for user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
                          handleExtendTrial(user.id, 7);
                        }}
                        className="text-white font-medium py-2 border-0"
                        style={{ backgroundColor: '#10b981' }}
                        disabled={false}
                        type="button"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        +7 Days
                      </Button>
                    )}
                    {/* Free Account Button - Show for all users who don't have free access */}
                    {!user.isFreeAccess && !user.is_free_access && (
                      <Button
                        key={`free-${user.id}`}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log(`🎁 Enabling free account for user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
                          console.log(`User data:`, { isFreeAccess: user.isFreeAccess, is_free_access: user.is_free_access });
                          handleEnableFreeAccount(user.id);
                        }}
                        className="text-white font-medium py-2 border-0"
                        style={{ backgroundColor: '#f59e0b' }}
                        disabled={false}
                        type="button"
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        Free
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(user)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium py-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          };

          return <UserAnalyticsCard key={userItem.id} user={userItem} />;
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No users found</h3>
          <p className="text-text-secondary">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first user to get started'}
          </p>
        </div>
      )}

      {/* User Analytics Modal */}
      <UserAnalyticsModal
        isOpen={!!selectedUserForAnalytics}
        onClose={() => setSelectedUserForAnalytics(null)}
        user={selectedUserForAnalytics}
      />

      {/* Manage User Modal */}
      <ManageUserModal
        isOpen={!!selectedUserForManagement}
        onClose={() => setSelectedUserForManagement(null)}
        user={selectedUserForManagement}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-text-primary flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Delete User Account
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-text-primary mb-4">
              Are you sure you want to delete <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>'s account?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-1">This action cannot be undone</h4>
                  <p className="text-sm text-red-700">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                    <li>User profile and account data</li>
                    <li>All associated bookings and records</li>
                    <li>Office accounts and agent data</li>
                    <li>Historical analytics and reports</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Email: <span className="font-medium">{userToDelete?.email}</span>
            </p>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              className="border-border text-text-primary hover:bg-secondary-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;