import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWarehouseSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Warehouse, 
  Plus, 
  MapPin, 
  Building, 
  Package, 
  TrendingUp, 
  Users, 
  Clock, 
  Edit, 
  Trash2, 
  Phone, 
  Mail,
  Search,
  Filter,
  BarChart3,
  Truck,
  AlertCircle,
  CheckCircle,
  Activity,
  Eye,
  Download,
  Upload,
  Settings,
  Calendar,
  DollarSign
} from "lucide-react";
import WarehouseStockModal from "@/components/modals/WarehouseStockModal";
import StockHistoryModal from "@/components/modals/StockHistoryModal";
import type { Warehouse as WarehouseType } from "@shared/schema";

const warehouseFormSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().min(1, "PIN code is required"),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  maxCapacity: z.number().optional(),
  currentStock: z.number().min(0).optional(),
  warehouseType: z.enum(["distribution", "storage", "fulfillment", "cold_storage", "bonded"]).optional(),
  operationalStatus: z.enum(["operational", "maintenance", "closed", "under_construction"]).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  managerName: z.string().optional(),
  establishedDate: z.string().optional(),
  certifications: z.string().optional(),
  facilities: z.string().optional(),
  workingHours: z.string().optional(),
  securityLevel: z.enum(["basic", "medium", "high", "maximum"]).optional(),
  insuranceDetails: z.string().optional(),
  monthlyOperationalCost: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseFormSchema>;

export default function Warehouses() {
  useUserTheme(); // Apply user theme
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedWarehouseForStock, setSelectedWarehouseForStock] = useState<WarehouseType | null>(null);
  const [selectedWarehouseForHistory, setSelectedWarehouseForHistory] = useState<WarehouseType | null>(null);
  const { toast } = useToast();

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      capacity: 0,
      maxCapacity: undefined,
      currentStock: 0,
      warehouseType: "storage",
      operationalStatus: "operational",
      contactPerson: "",
      phone: "",
      email: "",
      managerName: "",
      establishedDate: "",
      certifications: "",
      facilities: "",
      workingHours: "24/7",
      securityLevel: "medium",
      insuranceDetails: "",
      monthlyOperationalCost: undefined,
      latitude: undefined,
      longitude: undefined,
    },
  });

  const { data: warehouses = [], isLoading } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/warehouses/analytics"],
    enabled: !!warehouses.length,
  });

  // Use real warehouse data with calculated utilization
  const warehouseData = warehouses.map(w => ({
    ...w,
    currentUtilization: w.capacity > 0 ? Math.round(((w.currentStock || 0) / w.capacity) * 100) : 0,
    monthlyThroughput: Math.floor(Math.random() * 500 + 100), // This would come from booking data in real implementation
    staffCount: Math.floor(Math.random() * 20 + 5), // This would come from staff management system
    operationalCost: Number(w.monthlyOperationalCost) || 0,
    status: w.operationalStatus || 'operational',
    lastUpdated: new Date(w.updatedAt || w.createdAt || new Date()),
  }));

  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      const response = await apiRequest("POST", "/api/warehouses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse created successfully",
      });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create warehouse",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WarehouseFormData & { id: number }) => {
      const response = await apiRequest("PUT", `/api/warehouses/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse updated successfully",
      });
      setIsModalOpen(false);
      setEditingWarehouse(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update warehouse",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses/analytics"] });
      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete warehouse",
        variant: "destructive",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stockChange }: { id: number; stockChange: number }) => {
      const response = await apiRequest("PUT", `/api/warehouses/${id}/stock`, { stockChange });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses/analytics"] });
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  const updateStock = (id: number, change: number) => {
    updateStockMutation.mutate({ id, stockChange: change });
  };

  const onSubmit = (data: WarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate({ ...data, id: editingWarehouse.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      pinCode: warehouse.pinCode,
      capacity: warehouse.capacity || 0,
      maxCapacity: warehouse.maxCapacity || undefined,
      currentStock: warehouse.currentStock || 0,
      warehouseType: warehouse.warehouseType || "storage",
      operationalStatus: warehouse.operationalStatus || "operational",
      contactPerson: warehouse.contactPerson || "",
      phone: warehouse.phone || "",
      email: warehouse.email || "",
      managerName: warehouse.managerName || "",
      establishedDate: warehouse.establishedDate ? new Date(warehouse.establishedDate).toISOString().split('T')[0] : "",
      certifications: warehouse.certifications || "",
      facilities: warehouse.facilities || "",
      workingHours: warehouse.workingHours || "24/7",
      securityLevel: warehouse.securityLevel || "medium",
      insuranceDetails: warehouse.insuranceDetails || "",
      monthlyOperationalCost: warehouse.monthlyOperationalCost ? Number(warehouse.monthlyOperationalCost) : undefined,
      latitude: warehouse.latitude ? Number(warehouse.latitude) : undefined,
      longitude: warehouse.longitude ? Number(warehouse.longitude) : undefined,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingWarehouse(null);
    form.reset({
      name: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      capacity: 0,
      maxCapacity: undefined,
      currentStock: 0,
      warehouseType: "storage",
      operationalStatus: "operational",
      contactPerson: "",
      phone: "",
      email: "",
      managerName: "",
      establishedDate: "",
      certifications: "",
      facilities: "",
      workingHours: "24/7",
      securityLevel: "medium",
      insuranceDetails: "",
      monthlyOperationalCost: undefined,
      latitude: undefined,
      longitude: undefined,
    });
    setIsModalOpen(true);
  };

  // Filter warehouses
  const filteredWarehouses = warehouseData.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === "all" || warehouse.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const cities = ["all", ...new Set(warehouses.map(w => w.city).filter(Boolean))];

  // Analytics calculations
  const totalCapacity = warehouses.reduce((acc, w) => acc + (w.capacity || 0), 0);
  const avgUtilization = warehouseData.length > 0 
    ? warehouseData.reduce((acc, w) => acc + w.currentUtilization, 0) / warehouseData.length 
    : 0;
  const totalStaff = warehouseData.reduce((acc, w) => acc + w.staffCount, 0);
  const totalMonthlyCost = warehouseData.reduce((acc, w) => acc + w.operationalCost, 0);
  const operationalWarehouses = warehouseData.filter(w => w.status === 'operational').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Warehouse Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage warehouse locations, capacity, and operations</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Warehouse
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Warehouses</p>
                      <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Operational</p>
                      <p className="text-2xl font-bold text-gray-900">{operationalWarehouses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Capacity</p>
                      <p className="text-2xl font-bold text-gray-900">{totalCapacity.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">sq ft</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Utilization</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(avgUtilization)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
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
                        placeholder="Search warehouses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city || "unknown"}>
                          {city === "all" ? "All Cities" : city || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Warehouses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWarehouses.map((warehouse) => (
                <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {warehouse.city}, {warehouse.state}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={warehouse.status === 'operational' ? 'default' : 'secondary'}
                          className={warehouse.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {warehouse.status === 'operational' ? 'Operational' : 'Maintenance'}
                        </Badge>
                        <Badge variant="outline">{(warehouse.capacity || 0).toLocaleString()} sq ft</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <p>{warehouse.address}</p>
                      <p>{warehouse.pinCode}</p>
                    </div>

                    {/* Utilization Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilization</span>
                        <span>{warehouse.currentUtilization}%</span>
                      </div>
                      <Progress value={warehouse.currentUtilization} className="h-2" />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">Type</p>
                        <p className="font-semibold capitalize">{warehouse.warehouseType?.replace('_', ' ')}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">Monthly Cost</p>
                        <p className="font-semibold">₹{warehouse.operationalCost?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Manager Info */}
                    {warehouse.managerName && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium">Manager: {warehouse.managerName}</p>
                        {warehouse.facilities && (
                          <p className="text-xs text-blue-600 mt-1">{warehouse.facilities}</p>
                        )}
                      </div>
                    )}

                    {/* Stock Management */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-800">Stock Management</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs px-2 py-1 h-6"
                          onClick={() => {
                            setSelectedWarehouseForStock(warehouse);
                            setStockModalOpen(true);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                      <p className="text-xs text-green-700">
                        Current: {warehouse.currentStock?.toLocaleString() || 0} / Max: {(warehouse.maxCapacity || warehouse.capacity)?.toLocaleString()}
                      </p>
                    </div>
                    
                    {warehouse.contactPerson && (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {warehouse.contactPerson}
                        </div>
                        {warehouse.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {warehouse.phone}
                          </div>
                        )}
                        {warehouse.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {warehouse.email}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated {warehouse.lastUpdated.toLocaleDateString()}
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWarehouseForHistory(warehouse);
                          setHistoryModalOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(warehouse)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this warehouse?')) {
                            deleteMutation.mutate(warehouse.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredWarehouses.length === 0 && (
              <div className="text-center py-12">
                <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCity !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first warehouse location."
                  }
                </p>
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Warehouse
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Capacity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Capacity Distribution by City</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cities.slice(1).map(city => {
                      const cityWarehouses = warehouses.filter(w => w.city === city);
                      const cityCapacity = cityWarehouses.reduce((acc, w) => acc + (w.capacity || 0), 0);
                      const percentage = totalCapacity > 0 ? (cityCapacity / totalCapacity) * 100 : 0;
                      
                      return (
                        <div key={city}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{city}</span>
                            <span>{cityCapacity.toLocaleString()} sq ft ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Operational Costs */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Operational Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900">Total Monthly Cost</p>
                          <p className="text-sm text-blue-700">All warehouses combined</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">₹{totalMonthlyCost.toLocaleString()}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {warehouseData.slice(0, 5).map(warehouse => (
                        <div key={warehouse.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <span className="text-sm">{warehouse.name}</span>
                          <span className="font-medium">₹{warehouse.operationalCost.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Utilization Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Utilization Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {warehouseData.map(warehouse => (
                      <div key={warehouse.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{warehouse.name}</span>
                          <span className={`font-medium ${
                            warehouse.currentUtilization > 80 ? 'text-red-600' :
                            warehouse.currentUtilization > 60 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {warehouse.currentUtilization}%
                          </span>
                        </div>
                        <Progress 
                          value={warehouse.currentUtilization} 
                          className={`h-2 ${
                            warehouse.currentUtilization > 80 ? '[&>div]:bg-red-500' :
                            warehouse.currentUtilization > 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-900">
                        {warehouseData.length > 0 ? Math.round(warehouseData.reduce((acc, w) => acc + w.monthlyThroughput, 0) / warehouseData.length) : 0}
                      </p>
                      <p className="text-sm text-green-700">Avg Monthly Throughput</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-900">
                        {warehouses.length > 0 ? Math.round(totalCapacity / warehouses.length).toLocaleString() : 0}
                      </p>
                      <p className="text-sm text-purple-700">Avg Warehouse Size</p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-900">
                        {warehouses.length > 0 ? Math.round(totalStaff / warehouses.length) : 0}
                      </p>
                      <p className="text-sm text-orange-700">Avg Staff per Warehouse</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">
                        ₹{warehouses.length > 0 ? Math.round(totalMonthlyCost / warehouses.length).toLocaleString() : 0}
                      </p>
                      <p className="text-sm text-blue-700">Avg Monthly Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            {/* Management Tools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Bulk Import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Import multiple warehouses from CSV file</p>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Bulk Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Perform actions on multiple warehouses</p>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Selected
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Generate detailed warehouse reports</p>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Warehouse List Table */}
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Management Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Name</th>
                        <th className="p-3 font-medium">Location</th>
                        <th className="p-3 font-medium">Capacity</th>
                        <th className="p-3 font-medium">Utilization</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseData.map((warehouse) => (
                        <tr key={warehouse.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{warehouse.name}</p>
                              <p className="text-sm text-gray-600">{warehouse.contactPerson}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p>{warehouse.city}, {warehouse.state}</p>
                              <p className="text-sm text-gray-600">{warehouse.pinCode}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{(warehouse.capacity || 0).toLocaleString()}</p>
                              <p className="text-sm text-gray-600">sq ft</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="w-24">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{warehouse.currentUtilization}%</span>
                              </div>
                              <Progress value={warehouse.currentUtilization} className="h-1" />
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant={warehouse.status === 'operational' ? 'default' : 'secondary'}
                              className={warehouse.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {warehouse.status === 'operational' ? 'Operational' : 'Maintenance'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openEditModal(warehouse)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteMutation.mutate(warehouse.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stock Management Modal */}
      <WarehouseStockModal 
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setSelectedWarehouseForStock(null);
        }}
        warehouse={selectedWarehouseForStock}
      />

      {/* Stock History Modal */}
      <StockHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedWarehouseForHistory(null);
        }}
        warehouse={selectedWarehouseForHistory}
      />

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse 
                ? "Update warehouse information and settings"
                : "Add a new warehouse location to your network"
              }
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
                      <FormLabel>Warehouse Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Main Distribution Center" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (sq ft)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="50000"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Complete warehouse address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mumbai" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Maharashtra" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="400001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="warehouseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="distribution">Distribution</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="fulfillment">Fulfillment</SelectItem>
                            <SelectItem value="cold_storage">Cold Storage</SelectItem>
                            <SelectItem value="bonded">Bonded</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="operationalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operational Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="under_construction">Under Construction</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="0"
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Capacity (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="60000"
                          onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 98765 43210" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} placeholder="warehouse@company.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="managerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jane Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="monthlyOperationalCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Operational Cost (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="25000"
                          onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="facilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facilities & Features</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Loading dock, CCTV, Fire safety, Temperature control..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingWarehouse
                    ? "Update Warehouse"
                    : "Create Warehouse"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}