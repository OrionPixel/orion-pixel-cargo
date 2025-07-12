import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  Shield, 
  Building, 
  Mail,
  Phone,
  Calendar,
  Ban,
  CheckCircle,
  Crown,
  Filter,
  Package
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  officeName?: string;
  commissionRate?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  nextRenewalDate?: string;
  isActive: boolean;
  createdAt: string;
  phoneNumber?: string;
  totalRevenue?: number;
  commissionRevenue?: number;
  subscriptionRevenue?: number;
  agentCount?: number;
  bookingCount?: number;
  revenueSource?: 'subscription' | 'commission' | 'both';
}

export default function UsersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Redirect if not admin
  if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
    window.location.href = "/admin-login";
    return null;
  }

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!currentUser && currentUser.role === 'admin',
  });

  const { data: userRevenues = [], isLoading: revenueLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/user-revenues'],
    enabled: !!currentUser && currentUser.role === 'admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = searchTerm === '' || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.officeName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u: User) => u.isActive).length,
    transporters: users.filter((u: User) => u.role === 'transporter').length,
    distributors: users.filter((u: User) => u.role === 'distributor').length,
    warehouse: users.filter((u: User) => u.role === 'warehouse').length,
    office: users.filter((u: User) => u.role === 'office').length,
    paidUsers: users.filter((u: User) => u.subscriptionPlan && u.subscriptionPlan !== 'basic').length,
    totalRevenue: users.reduce((sum: number, u: User) => sum + (u.totalRevenue || 0), 0),
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'transporter': return 'bg-blue-100 text-blue-800';
      case 'distributor': return 'bg-green-100 text-green-800';
      case 'warehouse': return 'bg-purple-100 text-purple-800';
      case 'office': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-primary-100 text-primary-800';
      case 'pro': return 'bg-secondary-100 text-secondary-800';
      case 'starter': return 'bg-accent-100 text-accent-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRevenueSourceIcon = (source: string) => {
    switch (source) {
      case 'subscription': return '💳';
      case 'commission': return '💰';
      case 'both': return '🎯';
      default: return '📊';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      userId: selectedUser.id,
      updates: selectedUser,
    });
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100">
        <div className="container mx-auto px-4 py-8 space-y-6">
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading users...</p>
            </div>
          )}
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
              <p className="text-text-secondary mt-1">Manage users, roles, and permissions across the platform</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-secondary-100 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Total Users</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Active</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Transporters</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.transporters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Distributors</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.distributors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Warehouse</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.warehouse}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Crown className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Office</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.office}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Paid Users</p>
                    <p className="text-2xl font-bold text-text-primary">{stats.paidUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-accent-100 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-accent-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-secondary">Total Revenue</p>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or office..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/50">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="transporter">Transporter</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/50">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary-600" />
                Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Revenue Details</TableHead>
                    <TableHead>Agents/Bookings</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary-100 p-2 rounded-full">
                            <Users className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-text-secondary">{user.email}</p>
                            {user.phoneNumber && (
                              <p className="text-xs text-text-secondary">{user.phoneNumber}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className={`${getRoleColor(user.role)} border-0`}>
                            {user.role}
                          </Badge>
                          {user.officeName && (
                            <p className="text-xs text-text-secondary mt-1">{user.officeName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className={`${getSubscriptionColor(user.subscriptionPlan || 'basic')} border-0`}>
                            {user.subscriptionPlan || 'Basic'}
                          </Badge>
                          {user.subscriptionStatus && (
                            <p className="text-xs text-text-secondary mt-1 capitalize">{user.subscriptionStatus}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span>{getRevenueSourceIcon(user.revenueSource || 'subscription')}</span>
                            <span className="text-sm font-semibold text-text-primary">
                              {formatCurrency(user.totalRevenue || 0)}
                            </span>
                          </div>
                          {user.subscriptionRevenue && user.subscriptionRevenue > 0 && (
                            <p className="text-xs text-green-600">
                              Subscription: {formatCurrency(user.subscriptionRevenue)}
                            </p>
                          )}
                          {user.commissionRevenue && user.commissionRevenue > 0 && (
                            <p className="text-xs text-blue-600">
                              Commission: {formatCurrency(user.commissionRevenue)} ({user.commissionRate}%)
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3 text-text-secondary" />
                            <span className="text-sm text-text-primary">{user.agentCount || 0} Agents</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Package className="h-3 w-3 text-text-secondary" />
                            <span className="text-sm text-text-primary">{user.bookingCount || 0} Bookings</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-text-primary">
                          {user.nextRenewalDate ? (
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(user.nextRenewalDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {Math.ceil((new Date(user.nextRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">No subscription</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3 mr-1" />
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
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user details, role, and permissions.
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={selectedUser.firstName}
                        onChange={(e) => setSelectedUser({
                          ...selectedUser,
                          firstName: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={selectedUser.lastName}
                        onChange={(e) => setSelectedUser({
                          ...selectedUser,
                          lastName: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({
                        ...selectedUser,
                        email: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select 
                      value={selectedUser.role} 
                      onValueChange={(value) => setSelectedUser({
                        ...selectedUser,
                        role: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transporter">Transporter</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Office Name</label>
                    <Input
                      value={selectedUser.officeName || ''}
                      onChange={(e) => setSelectedUser({
                        ...selectedUser,
                        officeName: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Commission Rate (%)</label>
                    <Input
                      type="number"
                      value={selectedUser.commissionRate || ''}
                      onChange={(e) => setSelectedUser({
                        ...selectedUser,
                        commissionRate: e.target.value
                      })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </AdminLayout>
  );
}