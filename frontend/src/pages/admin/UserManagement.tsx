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
  Settings,
  BarChart3,
  Trash2
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

  // Data fetching
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
  });



  const { data: stats = {} } = useQuery<UserStats>({
    queryKey: ['/api/admin/user-stats'],
    enabled: !!user && user.role === 'admin',
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
    // console.log(`User ${user.firstName}: Status=${user.subscriptionStatus}, Plan=${user.subscriptionPlan}, TrialDays=${user.trialDaysRemaining}`);
    
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
        background: `linear-gradient(135deg, ${(themeSettings as any).primaryColor}05 0%, ${(themeSettings as any).secondaryColor}03 50%, ${(themeSettings as any).accentColor}02 100%)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: (themeSettings as any).primaryColor }}>
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
            backgroundColor: (themeSettings as any).primaryColor,
            boxShadow: `0 4px 12px ${(themeSettings as any).primaryColor}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = (themeSettings as any).secondaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = (themeSettings as any).primaryColor;
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
            border: `1px solid ${(themeSettings as any).primaryColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${(themeSettings as any).primaryColor}15` }}
              >
                <Users className="h-6 w-6" style={{ color: (themeSettings as any).primaryColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold" style={{ color: (themeSettings as any).primaryColor }}>
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
            border: `1px solid ${(themeSettings as any).secondaryColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${(themeSettings as any).secondaryColor}15` }}
              >
                <CheckCircle className="h-6 w-6" style={{ color: (themeSettings as any).secondaryColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Users</p>
                <p className="text-3xl font-bold" style={{ color: (themeSettings as any).secondaryColor }}>
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
            border: `1px solid ${(themeSettings as any).accentColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${(themeSettings as any).accentColor}15` }}
              >
                <Package className="h-6 w-6" style={{ color: (themeSettings as any).accentColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Trial Users</p>
                <p className="text-3xl font-bold" style={{ color: (themeSettings as any).accentColor }}>
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
            border: `1px solid ${(themeSettings as any).primaryColor}20`
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${(themeSettings as any).primaryColor}15` }}
              >
                <DollarSign className="h-6 w-6" style={{ color: (themeSettings as any).primaryColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold" style={{ color: (themeSettings as any).primaryColor }}>
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
                  borderColor: `${(themeSettings as any).primaryColor}20`
                }}
              />
            </div>
            
            <div className="text-sm text-gray-600 font-medium">
              Showing {filteredUsers.length} of {users.length} users
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
                  <Label htmlFor="subscriptionPlan" className="text-text-primary">Branch</Label>
                  <Select value={newUserData.subscriptionPlan} onValueChange={(value) => setNewUserData({...newUserData, subscriptionPlan: value})}>
                    <SelectTrigger className="bg-surface border-border text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border">
                      <SelectItem value="starter">Bhopal Branch</SelectItem>
                      <SelectItem value="professional">Indore Branch</SelectItem>
                      <SelectItem value="enterprise">Jabalpur Branch</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Users Grid - Two per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              refetchOnWindowFocus: true,
              refetchOnMount: true,
            });

            return (
              <Card 
                key={user.id} 
                className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group"
                style={{ 
                  backgroundColor: 'white',
                  border: `1px solid ${(themeSettings as any).primaryColor}15`
                }}
              >
                <div 
                  className="h-3 w-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${(themeSettings as any).primaryColor} 0%, ${(themeSettings as any).secondaryColor} 50%, ${(themeSettings as any).accentColor} 100%)`
                  }}
                />
                
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: (themeSettings as any).primaryColor }}
                      >
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
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
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center text-gray-700">
                      <Mail className="h-4 w-4 mr-3" style={{ color: (themeSettings as any).primaryColor }} />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-4 w-4 mr-3" style={{ color: (themeSettings as any).secondaryColor }} />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-4 w-4 mr-3" style={{ color: (themeSettings as any).accentColor }} />
                      <span className="text-sm">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Analytics Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
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
                      <p className="text-xs text-gray-600 font-medium mt-1">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          };
          return <UserAnalyticsCard key={userItem.id} user={userItem} />;
        })}
      </div>
    </div>
  );
}

export default UserManagement;