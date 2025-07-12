import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Package,
  Truck,
  Star,
  Activity,
  TrendingUp,
  User,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Filter,
  Download,
  UserPlus,
  DollarSign,
  Clock,
  Target,
  ChevronDown,
  Settings,
  Key,
  RefreshCw
} from "lucide-react";
import BookingModal from "@/components/modals/BookingModal";
import AgentAnalyticsModal from "@/components/modals/AgentAnalyticsModal";

const agentSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  officeName: z.string().min(1, "Office name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  commissionRate: z.number().min(0).max(100),
});

const editAgentSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  officeName: z.string().min(1, "Office name is required"),
});

type AgentFormData = z.infer<typeof agentSchema>;
type EditAgentFormData = z.infer<typeof editAgentSchema>;

export default function Agents() {
  const { themeSettings } = useUserTheme(); // Apply user theme
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isCommissionEditOpen, setIsCommissionEditOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newCommissionRate, setNewCommissionRate] = useState(0);
  const [useCustomCommission, setUseCustomCommission] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [analyticsAgent, setAnalyticsAgent] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      officeName: "",
      password: "",
      commissionRate: 0,
    },
  });

  const editForm = useForm<EditAgentFormData>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      officeName: "",
    },
  });

  // Fetch agents data with live statistics
  const { data: agents = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/office-accounts"],
    staleTime: 30 * 1000, // Refresh every 30 seconds for live data
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const response = await fetch('/api/office-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-accounts"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({ title: "Success", description: "Agent created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    },
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async (data: EditAgentFormData & { id: string }) => {
      await apiRequest("PUT", `/api/office-accounts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-accounts"] });
      setIsEditModalOpen(false);
      setEditingAgent(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Agent updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update agent",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { agentId: string; newPassword: string }) => {
      await apiRequest('PUT', `/api/office-accounts/${data.agentId}/reset-password`, {
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      setIsPasswordResetOpen(false);
      setSelectedAgent(null);
      setNewPassword("");
      toast({
        title: "Success",
        description: "Password reset successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  });



  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/office-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-accounts"] });
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete agent",
        variant: "destructive",
      });
    },
  });

  const filteredAgents = agents.filter(agent => 
    agent.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.officeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: AgentFormData) => {
    createAgentMutation.mutate(data);
  };

  const onEditSubmit = (data: EditAgentFormData) => {
    if (editingAgent) {
      updateAgentMutation.mutate({ ...data, id: editingAgent.id });
    }
  };

  const handleEditAgent = (agent: any) => {
    setEditingAgent(agent);
    setNewCommissionRate(agent.commissionRate || 0);
    setNewPassword("");
    editForm.reset({
      email: agent.email,
      firstName: agent.firstName,
      lastName: agent.lastName,
      officeName: agent.officeName,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteAgent = (agent: any) => {
    if (confirm(`Are you sure you want to delete ${agent.firstName} ${agent.lastName}?`)) {
      deleteAgentMutation.mutate(agent.id);
    }
  };

  const handleViewAnalytics = (agent: any) => {
    setAnalyticsAgent(agent);
    setIsAnalyticsModalOpen(true);
  };



  // Commission update mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async ({ agentId, commissionRate }: { agentId: string; commissionRate: number }) => {
      await apiRequest("PUT", `/api/office-accounts/${agentId}`, { commissionRate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-accounts"] });
      toast({
        title: "Success",
        description: "Commission rate updated successfully",
      });
      setNewCommissionRate(0);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission rate",
        variant: "destructive",
      });
    },
  });

  // Sample stats for agents
  const agentStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.isActive !== false).length,
    totalBookings: agents.reduce((sum, agent) => sum + (agent.bookingCount || 0), 0),
    monthlyRevenue: agents.reduce((sum, agent) => sum + (agent.monthlyRevenue || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeSettings.primaryColor}, ${themeSettings.accentColor})` }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                Agent Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage agents, track performance, and handle commissions</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setIsBookingModalOpen(true)}
                variant="outline"
                style={{ borderColor: themeSettings.primaryColor, color: themeSettings.primaryColor }}
                className="hover:opacity-80"
              >
                <Package className="h-4 w-4 mr-2" />
                Quick Booking
              </Button>
              <Button 
                variant="outline"
                style={{ borderColor: themeSettings.secondaryColor, color: themeSettings.secondaryColor }}
                className="hover:opacity-80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                style={{ background: `linear-gradient(135deg, ${themeSettings.primaryColor}, ${themeSettings.accentColor})` }}
                className="text-white hover:opacity-90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Agent
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{agentStats.totalAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{agentStats.activeAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{agentStats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{Math.ceil(agentStats.monthlyRevenue).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search agents by name, email, or office..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {agent.firstName?.[0]}{agent.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.firstName} {agent.lastName}</h3>
                        <p className="text-sm text-gray-600">{agent.officeName}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{agent.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-primary/10 p-2 rounded">
                      <p className="text-lg font-semibold text-primary">{agent.totalBookings || agent.bookingCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="bg-accent/10 p-2 rounded">
                      <p className="text-lg font-semibold text-accent">₹{Math.ceil(Number(agent.totalRevenue || 0)).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div className="bg-secondary/10 p-2 rounded">
                      <p className="text-lg font-semibold text-secondary">{Number(agent.commissionRate || 0)}%</p>
                      <p className="text-xs text-muted-foreground">Commission Rate</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                    <div className="bg-accent/10 p-2 rounded">
                      <p className="text-sm font-semibold text-accent">₹{Math.ceil(Number(agent.monthlyCommission || 0)).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Monthly Commission</p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded">
                      <p className="text-sm font-semibold text-primary">{agent.activeShipments || 0}</p>
                      <p className="text-xs text-muted-foreground">Active Shipments</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewAnalytics(agent)}
                      className="flex-1"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setNewPassword("");
                        setIsPasswordResetOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAgent(agent)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredAgents.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first agent."}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Agent
            </Button>
          </div>
        )}
      </div>

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manage Agent - {editingAgent?.firstName} {editingAgent?.lastName}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="officeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingAgent(null);
                        editForm.reset();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateAgentMutation.isPending}
                      className="flex-1"
                    >
                      {updateAgentMutation.isPending ? "Updating..." : "Update Basic Info"}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">Password Reset</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Reset the password for {editingAgent?.firstName} {editingAgent?.lastName}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (editingAgent && newPassword.trim() && newPassword.length >= 6) {
                        resetPasswordMutation.mutate({
                          agentId: editingAgent.id,
                          newPassword: newPassword.trim()
                        });
                      }
                    }}
                    disabled={resetPasswordMutation.isPending || !newPassword.trim() || newPassword.length < 6}
                    className="w-full"
                  >
                    {resetPasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="commission" className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Commission Settings</h3>
                <p className="text-sm text-green-700 mb-4">
                  Current commission rate: <strong>{editingAgent?.commissionRate || 0}%</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(parseFloat(e.target.value) || 0)}
                      placeholder="Enter commission rate (0-100%)"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Commission will be calculated on all future bookings made by this agent.</p>
                    <p>Current monthly commission: <strong>₹{Math.ceil(Number(editingAgent?.monthlyCommission || 0)).toLocaleString()}</strong></p>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (editingAgent && newCommissionRate >= 0 && newCommissionRate <= 100) {
                        updateCommissionMutation.mutate({
                          agentId: editingAgent.id,
                          commissionRate: newCommissionRate
                        });
                      }
                    }}
                    disabled={updateCommissionMutation.isPending || newCommissionRate < 0 || newCommissionRate > 100}
                    className="w-full"
                  >
                    {updateCommissionMutation.isPending ? "Updating Commission..." : "Update Commission Rate"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Agent Analytics Modal */}
      <AgentAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => {
          setIsAnalyticsModalOpen(false);
          setAnalyticsAgent(null);
        }}
        agent={analyticsAgent}
      />

      {/* Enhanced Create Agent Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Agent Account</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="commission">Commission</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Personal Information</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Enter the agent's basic details and office information
                </p>
                
                <Form {...form}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter first name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter last name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="officeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office/Branch Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter office or branch name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
            </TabsContent>
            
            <TabsContent value="credentials" className="space-y-4">
              <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                <h3 className="font-semibold text-secondary mb-2">Login Credentials</h3>
                <p className="text-sm text-secondary/80 mb-4">
                  Set up email and password for the agent's account access
                </p>
                
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} placeholder="agent@company.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Minimum 6 characters" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <p className="font-medium">Password Requirements:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Minimum 6 characters</li>
                        <li>Agent can change password later</li>
                        <li>Keep it simple but secure</li>
                      </ul>
                    </div>
                  </div>
                </Form>
              </div>
            </TabsContent>
            
            <TabsContent value="commission" className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-primary mb-2">Commission Settings</h3>
                <p className="text-sm text-primary/80 mb-4">
                  Configure commission rate for this agent's bookings
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="customCommission"
                      checked={useCustomCommission}
                      onChange={(e) => setUseCustomCommission(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <Label htmlFor="customCommission" className="font-medium">
                      Set Custom Commission Rate
                    </Label>
                  </div>
                  
                  {!useCustomCommission && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm text-gray-700">
                        <strong>Default Commission:</strong> 5% will be applied to all bookings made by this agent.
                      </p>
                    </div>
                  )}
                  
                  {useCustomCommission && (
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="commissionRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Rate (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                placeholder="Enter rate between 0-100%"
                              />
                            </FormControl>
                            <FormMessage />
                            <div className="text-xs text-green-600 mt-1">
                              Commission will be calculated on gross booking amount
                            </div>
                          </FormItem>
                        )}
                      />
                    </Form>
                  )}
                  
                  <div className="bg-green-100 p-3 rounded">
                    <p className="text-sm text-green-800">
                      <strong>Example:</strong> If agent books ₹10,000 shipment with {useCustomCommission ? `${form.watch('commissionRate') || 0}%` : '5%'} commission,
                      they earn ₹{useCustomCommission ? Math.ceil((form.watch('commissionRate') || 0) * 100).toLocaleString() : '500'}.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setUseCustomCommission(false);
                form.reset();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={createAgentMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createAgentMutation.isPending ? "Creating Agent..." : "Create Agent Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">🔒 Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center bg-yellow-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-yellow-800">
                {selectedAgent?.firstName} {selectedAgent?.lastName}
              </div>
              <div className="text-sm text-yellow-600">{selectedAgent?.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                Last login: {selectedAgent?.lastLogin ? new Date(selectedAgent.lastLogin).toLocaleDateString() : 'Never'}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-lg font-semibold">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (minimum 3 characters)"
                  className="mt-2"
                />
              </div>
              
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p className="font-medium">Password Guidelines:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Minimum 3 characters</li>
                  <li>Agent will be notified of password change</li>
                  <li>They can change it again after logging in</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPasswordResetOpen(false);
                  setNewPassword('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedAgent && newPassword.trim()) {
                    resetPasswordMutation.mutate({
                      agentId: selectedAgent.id,
                      newPassword: newPassword.trim()
                    });
                  }
                }}
                disabled={resetPasswordMutation.isPending || !newPassword.trim() || newPassword.length < 3}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commission Edit Dialog */}
      <Dialog open={isCommissionEditOpen} onOpenChange={setIsCommissionEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">💰 Manage Commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center bg-blue-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">
                {selectedAgent?.firstName} {selectedAgent?.lastName}
              </div>
              <div className="text-sm text-blue-600">{selectedAgent?.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                Current: {selectedAgent?.commissionRate || 0}% commission
              </div>
            </div>
            
            {/* Commission Options */}
            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-lg font-semibold">Choose Commission Structure</Label>
              </div>
              
              {/* Fixed Salary Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  newCommissionRate === 0 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setNewCommissionRate(0)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    newCommissionRate === 0 ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {newCommissionRate === 0 && <div className="w-2 h-2 bg-white rounded-full ml-0.5 mt-0.5"></div>}
                  </div>
                  <div>
                    <div className="font-semibold text-green-700">Fixed Salary Only</div>
                    <div className="text-sm text-green-600">No commission per booking</div>
                  </div>
                </div>
              </div>

              {/* Commission Based Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  newCommissionRate > 0 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setNewCommissionRate(Math.max(newCommissionRate, 5))}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    newCommissionRate > 0 ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {newCommissionRate > 0 && <div className="w-2 h-2 bg-white rounded-full ml-0.5 mt-0.5"></div>}
                  </div>
                  <div>
                    <div className="font-semibold text-blue-700">Commission Based</div>
                    <div className="text-sm text-blue-600">Percentage per booking</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Rate Input */}
            {newCommissionRate > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Label htmlFor="newCommissionRate" className="text-lg font-semibold text-blue-800">
                  Commission Percentage
                </Label>
                <div className="flex items-center justify-center space-x-2 mt-3">
                  <Input
                    id="newCommissionRate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-20 h-12 text-center text-lg font-bold border-blue-300"
                  />
                  <span className="text-lg font-bold text-blue-800">%</span>
                </div>
                
                <div className="text-center text-blue-700 mt-2">
                  Agent earns {newCommissionRate}% on each booking
                </div>

                {/* Commission Preview */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2 bg-white rounded border border-secondary/20">
                    <div className="text-xs text-gray-600">₹1,000</div>
                    <div className="font-bold text-secondary">₹{Math.ceil(newCommissionRate * 10)}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border border-primary/20">
                    <div className="text-xs text-gray-600">₹10,000</div>
                    <div className="font-bold text-primary">₹{Math.ceil(newCommissionRate * 100)}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border border-accent/20">
                    <div className="text-xs text-gray-600">₹50,000</div>
                    <div className="font-bold text-accent">₹{Math.ceil(newCommissionRate * 500)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  setIsCommissionEditOpen(false);
                  setSelectedAgent(null);
                  setNewCommissionRate(0);
                }}
              >
                Cancel
              </Button>
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedAgent) {
                    updateCommissionMutation.mutate({
                      agentId: selectedAgent.id,
                      commissionRate: newCommissionRate
                    });
                  }
                }}
                disabled={updateCommissionMutation.isPending}
              >
                {updateCommissionMutation.isPending ? "Updating..." : "Update Commission"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">🔑 Reset Agent Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center bg-blue-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">
                {selectedAgent?.firstName} {selectedAgent?.lastName}
              </div>
              <div className="text-sm text-blue-600">{selectedAgent?.email}</div>
              <div className="text-xs text-blue-500">{selectedAgent?.officeName}</div>
            </div>
            
            <div>
              <Label htmlFor="newPassword" className="text-lg font-semibold">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter secure password"
                className="mt-2 h-12 text-lg"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                Minimum 6 characters recommended
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  setIsPasswordResetOpen(false);
                  setSelectedAgent(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </Button>
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedAgent && newPassword.trim()) {
                    resetPasswordMutation.mutate({
                      agentId: selectedAgent.id,
                      newPassword: newPassword.trim()
                    });
                  }
                }}
                disabled={resetPasswordMutation.isPending || !newPassword.trim() || newPassword.length < 3}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commission Edit Dialog */}
      <Dialog open={isCommissionEditOpen} onOpenChange={setIsCommissionEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">💰 Manage Commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center bg-blue-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">
                {selectedAgent?.firstName} {selectedAgent?.lastName}
              </div>
              <div className="text-sm text-blue-600">{selectedAgent?.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                Current: {selectedAgent?.commissionRate || 0}% commission
              </div>
            </div>
            
            {/* Commission Options */}
            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-lg font-semibold">Choose Commission Structure</Label>
              </div>
              
              {/* Fixed Salary Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  newCommissionRate === 0 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setNewCommissionRate(0)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    newCommissionRate === 0 ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {newCommissionRate === 0 && <div className="w-2 h-2 bg-white rounded-full ml-0.5 mt-0.5"></div>}
                  </div>
                  <div>
                    <div className="font-semibold text-green-700">Fixed Salary Only</div>
                    <div className="text-sm text-green-600">No commission per booking</div>
                  </div>
                </div>
              </div>

              {/* Commission Based Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  newCommissionRate > 0 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setNewCommissionRate(Math.max(newCommissionRate, 5))}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    newCommissionRate > 0 ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {newCommissionRate > 0 && <div className="w-2 h-2 bg-white rounded-full ml-0.5 mt-0.5"></div>}
                  </div>
                  <div>
                    <div className="font-semibold text-blue-700">Commission Based</div>
                    <div className="text-sm text-blue-600">Percentage per booking</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Rate Input */}
            {newCommissionRate > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Label htmlFor="newCommissionRate" className="text-lg font-semibold text-blue-800">
                  Commission Percentage
                </Label>
                <div className="flex items-center justify-center space-x-2 mt-3">
                  <Input
                    id="newCommissionRate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-20 h-12 text-center text-lg font-bold border-blue-300"
                  />
                  <span className="text-lg font-bold text-blue-800">%</span>
                </div>
                
                <div className="text-center text-blue-700 mt-2">
                  Agent earns {newCommissionRate}% on each booking
                </div>

                {/* Commission Preview */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2 bg-white rounded border border-secondary/20">
                    <div className="text-xs text-gray-600">₹1,000</div>
                    <div className="font-bold text-secondary">₹{Math.ceil(newCommissionRate * 10)}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border border-primary/20">
                    <div className="text-xs text-gray-600">₹10,000</div>
                    <div className="font-bold text-primary">₹{Math.ceil(newCommissionRate * 100)}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border border-accent/20">
                    <div className="text-xs text-gray-600">₹50,000</div>
                    <div className="font-bold text-accent">₹{Math.ceil(newCommissionRate * 500)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  setIsCommissionEditOpen(false);
                  setSelectedAgent(null);
                  setNewCommissionRate(0);
                }}
              >
                Cancel
              </Button>
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (selectedAgent) {
                    updateCommissionMutation.mutate({
                      agentId: selectedAgent.id,
                      commissionRate: newCommissionRate
                    });
                  }
                }}
                disabled={updateCommissionMutation.isPending}
              >
                {updateCommissionMutation.isPending ? "Updating..." : "Update Commission"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </div>
  );
}