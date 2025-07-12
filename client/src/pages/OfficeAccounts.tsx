import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserTheme } from '@/contexts/UserThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Settings,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OfficeAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  officeName: string;
  role: string;
  parentUserId: string;
  isActive: boolean;
  createdAt: Date;
  totalBookings: number;
  totalRevenue: number;
  commissionRate: number;
  lastLoginAt: Date | null;
}

function OfficeAccounts() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<OfficeAccount | null>(null);
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<OfficeAccount[]>({
    queryKey: ['/api/office-accounts'],
    staleTime: 30000,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (accountData: Partial<OfficeAccount>) => {
      const response = await fetch('/api/office-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(accountData),
      });
      if (!response.ok) throw new Error('Failed to create account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/office-accounts'] });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<OfficeAccount> & { id: string }) => {
      const response = await fetch(`/api/office-accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/office-accounts'] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/office-accounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/office-accounts'] });
    },
  });

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.officeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'active') return account.isActive;
    if (activeTab === 'inactive') return !account.isActive;
    return true;
  });

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(a => a.isActive).length;
  const totalRevenue = accounts.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalBookings = accounts.reduce((sum, a) => sum + a.totalBookings, 0);

  const getStatusBadge = (account: OfficeAccount) => {
    if (!account.isActive) {
      return <Badge variant="destructive" className="text-xs">Inactive</Badge>;
    }
    
    if (account.lastLoginAt) {
      const daysSinceLogin = Math.floor((Date.now() - new Date(account.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLogin <= 7) {
        return <Badge className="bg-green-500 text-white text-xs">Active</Badge>;
      } else if (daysSinceLogin <= 30) {
        return <Badge className="bg-yellow-500 text-white text-xs">Idle</Badge>;
      }
    }
    
    return <Badge variant="secondary" className="text-xs">Dormant</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Office Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your office team accounts and their performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              // Open create account modal
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold text-primary">{totalAccounts}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                <p className="text-2xl font-bold text-secondary">{activeAccounts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-accent">₹{Math.ceil(totalRevenue).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-green-600">{totalBookings}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-white border-primary/20">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building className="h-5 w-5" />
              Office Team Accounts
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border/50">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto rounded-none">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  All ({totalAccounts})
                </TabsTrigger>
                <TabsTrigger 
                  value="active"
                  className="data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary"
                >
                  Active ({activeAccounts})
                </TabsTrigger>
                <TabsTrigger 
                  value="inactive"
                  className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600"
                >
                  Inactive ({totalAccounts - activeAccounts})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredAccounts.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">
                                {account.firstName} {account.lastName}
                              </h4>
                              {getStatusBadge(account)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {account.officeName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {account.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {account.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <p className="font-medium text-primary">
                                  ₹{Math.ceil(account.totalRevenue).toLocaleString()}
                                </p>
                                <p className="text-muted-foreground">Revenue</p>
                              </div>
                              <div>
                                <p className="font-medium text-secondary">
                                  {account.totalBookings}
                                </p>
                                <p className="text-muted-foreground">Bookings</p>
                              </div>
                              <div>
                                <p className="font-medium text-accent">
                                  {account.commissionRate}%
                                </p>
                                <p className="text-muted-foreground">Commission</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedAccount(account)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteAccountMutation.mutate(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Created: {new Date(account.createdAt).toLocaleDateString('en-IN')}</span>
                          <span>Role: {account.role}</span>
                          {account.lastLoginAt && (
                            <span>Last login: {new Date(account.lastLoginAt).toLocaleDateString('en-IN')}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            ID: {account.id.slice(-6)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No office accounts found
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {searchTerm 
                      ? `No accounts match "${searchTerm}"`
                      : "Create your first office account to start managing your team"
                    }
                  </p>
                  <Button 
                    className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      // Open create account modal
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Account
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAccounts
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5)
                .map((account, index) => (
                  <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account.firstName} {account.lastName}</p>
                        <p className="text-xs text-muted-foreground">{account.officeName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">₹{Math.ceil(account.totalRevenue).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{account.totalBookings} bookings</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Award className="h-5 w-5" />
              Team Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Revenue per Account</span>
                <span className="font-bold text-primary">
                  ₹{totalAccounts > 0 ? Math.ceil(totalRevenue / totalAccounts).toLocaleString() : '0'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Bookings per Account</span>
                <span className="font-bold text-secondary">
                  {totalAccounts > 0 ? Math.ceil(totalBookings / totalAccounts) : 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Account Rate</span>
                <span className="font-bold text-accent">
                  {totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Commission Earned</span>
                <span className="font-bold text-green-600">
                  ₹{Math.ceil(accounts.reduce((sum, a) => sum + (a.totalRevenue * a.commissionRate / 100), 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OfficeAccounts;