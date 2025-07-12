import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Warehouse,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Users,
  IndianRupee,
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Calculator,
  Building2,
  Calendar
} from "lucide-react";

// Types
interface WarehouseData {
  id: number;
  name: string;
  location: string;
  type: 'distribution' | 'storage' | 'fulfillment' | 'cold_storage' | 'hazmat';
  capacity: number;
  occupiedSpace: number;
  manager: string;
  contact: string;
  email: string;
  status: 'active' | 'inactive' | 'maintenance';
  established: string;
  monthlyRent: number;
  operatingCost: number;
  revenue: number;
  profitMargin: number;
  lastUpdated: string;
}

interface InventoryItem {
  id: number;
  warehouseId: number;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  expiryDate?: string;
  location: string; // Rack/Section
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  lastUpdated: string;
}

interface StockOperation {
  id: number;
  warehouseId: number;
  type: 'inbound' | 'outbound' | 'transfer' | 'adjustment';
  productName: string;
  quantity: number;
  unit: string;
  value: number;
  operator: string;
  timestamp: string;
  reference: string;
  notes?: string;
}

interface WarehouseRevenue {
  warehouseId: number;
  monthlyRevenue: number;
  operationalCost: number;
  netProfit: number;
  occupancyRate: number;
  throughput: number; // Items processed per month
  averageStorageFee: number;
  handlingCharges: number;
}

export default function Warehouses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Form states
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    location: "",
    type: "distribution",
    capacity: "",
    manager: "",
    contact: "",
    email: "",
    monthlyRent: "",
    operatingCost: ""
  });

  const [inventoryForm, setInventoryForm] = useState({
    productName: "",
    sku: "",
    category: "",
    quantity: "",
    unit: "kg",
    costPrice: "",
    sellingPrice: "",
    supplier: "",
    expiryDate: "",
    location: ""
  });

  const [operationForm, setOperationForm] = useState({
    type: "inbound",
    productName: "",
    quantity: "",
    unit: "kg",
    value: "",
    reference: "",
    notes: ""
  });

  // Data fetching
  const { data: warehouses, isLoading: warehousesLoading } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouses"],
    enabled: !!user,
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/warehouses/inventory"],
    enabled: !!user,
  });

  const { data: operations, isLoading: operationsLoading } = useQuery<StockOperation[]>({
    queryKey: ["/api/warehouses/operations"],
    enabled: !!user,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<WarehouseRevenue[]>({
    queryKey: ["/api/warehouses/revenue"],
    enabled: !!user,
    select: (data) => {
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    }
  });

  // Mutations
  const addWarehouseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add warehouse");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setShowWarehouseModal(false);
      resetWarehouseForm();
      toast({ title: "Warehouse added successfully!" });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update warehouse");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setShowWarehouseModal(false);
      setEditingWarehouse(null);
      resetWarehouseForm();
      toast({ title: "Warehouse updated successfully!" });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete warehouse");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: "Warehouse deleted successfully!" });
    },
  });

  const addInventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/warehouses/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add inventory item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses/inventory"] });
      setShowInventoryModal(false);
      resetInventoryForm();
      toast({ title: "Inventory item added successfully!" });
    },
  });

  const addOperationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/warehouses/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add stock operation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses/inventory"] });
      setShowOperationModal(false);
      resetOperationForm();
      toast({ title: "Stock operation recorded successfully!" });
    },
  });

  // Helper functions
  const resetWarehouseForm = () => {
    setWarehouseForm({
      name: "",
      location: "",
      type: "distribution",
      capacity: "",
      manager: "",
      contact: "",
      email: "",
      monthlyRent: "",
      operatingCost: ""
    });
  };

  const resetInventoryForm = () => {
    setInventoryForm({
      productName: "",
      sku: "",
      category: "",
      quantity: "",
      unit: "kg",
      costPrice: "",
      sellingPrice: "",
      supplier: "",
      expiryDate: "",
      location: ""
    });
  };

  const resetOperationForm = () => {
    setOperationForm({
      type: "inbound",
      productName: "",
      quantity: "",
      unit: "kg",
      value: "",
      reference: "",
      notes: ""
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.ceil(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      in_stock: "bg-green-100 text-green-800",
      low_stock: "bg-yellow-100 text-yellow-800",
      out_of_stock: "bg-red-100 text-red-800",
      expired: "bg-red-100 text-red-800"
    };
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      distribution: <Truck className="h-4 w-4" />,
      storage: <Warehouse className="h-4 w-4" />,
      fulfillment: <Package className="h-4 w-4" />,
      cold_storage: <Building2 className="h-4 w-4" />,
      hazmat: <AlertTriangle className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || icons.storage;
  };

  // Filtered data with safe checks
  const filteredWarehouses = warehouses?.filter(warehouse => {
    const matchesSearch = (warehouse?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (warehouse?.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (warehouse?.manager || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || warehouse?.status === filterStatus;
    const matchesType = filterType === "all" || warehouse?.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  // Calculate summary statistics with safe defaults
  const summaryStats = {
    totalWarehouses: warehouses?.length || 0,
    activeWarehouses: warehouses?.filter(w => w?.status === 'active').length || 0,
    totalCapacity: warehouses?.reduce((sum, w) => sum + (w?.capacity || 0), 0) || 0,
    totalOccupied: warehouses?.reduce((sum, w) => sum + (w?.occupiedSpace || 0), 0) || 0,
    totalRevenue: Array.isArray(revenueData) ? revenueData.reduce((sum, r) => sum + (r?.monthlyRevenue || 0), 0) : 0,
    totalCost: warehouses?.reduce((sum, w) => sum + (w?.operatingCost || 0) + (w?.monthlyRent || 0), 0) || 0,
    averageOccupancy: warehouses?.length ? 
      (warehouses.reduce((sum, w) => sum + ((w?.occupiedSpace || 0) / (w?.capacity || 1) * 100), 0) / warehouses.length) : 0,
    totalProfit: 0,
    profitMargin: 0
  };

  summaryStats.totalProfit = summaryStats.totalRevenue - summaryStats.totalCost;
  summaryStats.profitMargin = summaryStats.totalRevenue > 0 ? 
    (summaryStats.totalProfit / summaryStats.totalRevenue * 100) : 0;

  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...warehouseForm,
      capacity: parseFloat(warehouseForm.capacity),
      monthlyRent: parseFloat(warehouseForm.monthlyRent),
      operatingCost: parseFloat(warehouseForm.operatingCost),
      occupiedSpace: 0,
      revenue: 0,
      profitMargin: 0,
      status: "active",
      established: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (editingWarehouse) {
      updateWarehouseMutation.mutate({ id: editingWarehouse.id, data: formData });
    } else {
      addWarehouseMutation.mutate(formData);
    }
  };

  const handleInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...inventoryForm,
      warehouseId: selectedWarehouse?.id || warehouses?.[0]?.id,
      quantity: parseInt(inventoryForm.quantity),
      costPrice: parseFloat(inventoryForm.costPrice),
      sellingPrice: parseFloat(inventoryForm.sellingPrice),
      status: parseInt(inventoryForm.quantity) > 10 ? "in_stock" : 
              parseInt(inventoryForm.quantity) > 0 ? "low_stock" : "out_of_stock",
      lastUpdated: new Date().toISOString()
    };

    addInventoryMutation.mutate(formData);
  };

  const handleOperationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...operationForm,
      warehouseId: selectedWarehouse?.id || warehouses?.[0]?.id,
      quantity: parseInt(operationForm.quantity),
      value: parseFloat(operationForm.value),
      operator: user?.officeName || user?.name || "System",
      timestamp: new Date().toISOString()
    };

    addOperationMutation.mutate(formData);
  };

  const handleEditWarehouse = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name,
      location: warehouse.location,
      type: warehouse.type,
      capacity: warehouse.capacity.toString(),
      manager: warehouse.manager,
      contact: warehouse.contact,
      email: warehouse.email,
      monthlyRent: warehouse.monthlyRent.toString(),
      operatingCost: warehouse.operatingCost.toString()
    });
    setShowWarehouseModal(true);
  };

  const handleDeleteWarehouse = (id: number) => {
    if (window.confirm("Are you sure you want to delete this warehouse? This action cannot be undone.")) {
      deleteWarehouseMutation.mutate(id);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access warehouse management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouse Management</h2>
          <p className="text-muted-foreground">
            Professional warehouse operations and inventory control system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalWarehouses}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.activeWarehouses} active facilities
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Capacity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summaryStats.totalCapacity || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.ceil(summaryStats.averageOccupancy)}% average occupancy
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.ceil(summaryStats.profitMargin)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Operating {summaryStats.activeWarehouses} facilities
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Warehouse Status Overview */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Warehouse Status Distribution</CardTitle>
                <CardDescription>Current operational status of all facilities</CardDescription>
              </CardHeader>
              <CardContent>
                {warehousesLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {["active", "inactive", "maintenance"].map(status => {
                      const count = warehouses?.filter(w => w.status === status).length || 0;
                      const percentage = summaryStats.totalWarehouses > 0 ? 
                        (count / summaryStats.totalWarehouses * 100) : 0;
                      
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{status}</span>
                            <span>{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Overview */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Revenue & Cost Analysis</CardTitle>
                <CardDescription>Monthly financial performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(summaryStats.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Operating Costs</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(summaryStats.totalCost)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Net Profit</span>
                      <span className={`text-lg font-bold ${summaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summaryStats.totalProfit)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Profit Margin: {Math.ceil(summaryStats.profitMargin)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Operations */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Recent Stock Operations</CardTitle>
              <CardDescription>Latest warehouse activities and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {operationsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {operations?.slice(0, 5).map(operation => (
                    <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          operation.type === 'inbound' ? 'bg-green-500' :
                          operation.type === 'outbound' ? 'bg-red-500' :
                          operation.type === 'transfer' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{operation.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {operation.type} • {operation.quantity} {operation.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(operation.value)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(operation.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent operations found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          {/* Filters and Actions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Warehouse Facilities</CardTitle>
              <CardDescription>Manage and monitor all warehouse locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search warehouses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="fulfillment">Fulfillment</SelectItem>
                    <SelectItem value="cold_storage">Cold Storage</SelectItem>
                    <SelectItem value="hazmat">Hazmat</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showWarehouseModal} onOpenChange={setShowWarehouseModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Warehouse
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingWarehouse ? "Update warehouse information" : "Create a new warehouse facility"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Warehouse Name</Label>
                          <Input
                            id="name"
                            value={warehouseForm.name}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                            placeholder="Enter warehouse name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={warehouseForm.location}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                            placeholder="Enter location address"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="type">Warehouse Type</Label>
                          <Select value={warehouseForm.type} onValueChange={(value) => setWarehouseForm({ ...warehouseForm, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="distribution">Distribution Center</SelectItem>
                              <SelectItem value="storage">Storage Facility</SelectItem>
                              <SelectItem value="fulfillment">Fulfillment Center</SelectItem>
                              <SelectItem value="cold_storage">Cold Storage</SelectItem>
                              <SelectItem value="hazmat">Hazmat Storage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="capacity">Storage Capacity (sq ft)</Label>
                          <Input
                            id="capacity"
                            type="number"
                            value={warehouseForm.capacity}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: e.target.value })}
                            placeholder="Enter storage capacity"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="manager">Manager Name</Label>
                          <Input
                            id="manager"
                            value={warehouseForm.manager}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, manager: e.target.value })}
                            placeholder="Enter manager name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact">Contact Number</Label>
                          <Input
                            id="contact"
                            value={warehouseForm.contact}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, contact: e.target.value })}
                            placeholder="Enter contact number"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={warehouseForm.email}
                          onChange={(e) => setWarehouseForm({ ...warehouseForm, email: e.target.value })}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="monthlyRent">Monthly Rent (₹)</Label>
                          <Input
                            id="monthlyRent"
                            type="number"
                            value={warehouseForm.monthlyRent}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, monthlyRent: e.target.value })}
                            placeholder="Enter monthly rent"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="operatingCost">Operating Cost (₹)</Label>
                          <Input
                            id="operatingCost"
                            type="number"
                            value={warehouseForm.operatingCost}
                            onChange={(e) => setWarehouseForm({ ...warehouseForm, operatingCost: e.target.value })}
                            placeholder="Enter operating cost"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => {
                          setShowWarehouseModal(false);
                          setEditingWarehouse(null);
                          resetWarehouseForm();
                        }}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingWarehouse ? "Update Warehouse" : "Add Warehouse"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Warehouses Grid */}
              {warehousesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredWarehouses.map(warehouse => (
                    <Card key={warehouse.id} className="bg-white hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(warehouse.type)}
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                          </div>
                          <Badge className={getStatusBadge(warehouse.status)}>
                            {warehouse.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {warehouse.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Capacity</span>
                            <span className="font-medium">{(warehouse.capacity || 0).toLocaleString()} sq ft</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Occupancy</span>
                              <span>{Math.round(((warehouse?.occupiedSpace || 0) / (warehouse?.capacity || 1)) * 100)}%</span>
                            </div>
                            <Progress value={((warehouse?.occupiedSpace || 0) / (warehouse?.capacity || 1)) * 100} className="h-1" />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Manager</span>
                            <span className="font-medium">{warehouse?.manager || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                            <span className="font-medium text-green-600">{formatCurrency(warehouse?.revenue || 0)}</span>
                          </div>
                          <div className="flex gap-1 pt-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedWarehouse(warehouse)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditWarehouse(warehouse)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeleteWarehouse(warehouse.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredWarehouses.length === 0 && !warehousesLoading && (
                <div className="text-center py-12">
                  <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No warehouses found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterStatus !== "all" || filterType !== "all" 
                      ? "Try adjusting your filters to see more results."
                      : "Get started by adding your first warehouse facility."}
                  </p>
                  {(!searchTerm && filterStatus === "all" && filterType === "all") && (
                    <Button onClick={() => setShowWarehouseModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Warehouse
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Track and manage stock across all warehouse locations</CardDescription>
              </div>
              <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Inventory
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                    <DialogDescription>Add a new product to warehouse inventory</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInventorySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productName">Product Name</Label>
                        <Input
                          id="productName"
                          value={inventoryForm.productName}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, productName: e.target.value })}
                          placeholder="Enter product name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          value={inventoryForm.sku}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, sku: e.target.value })}
                          placeholder="Enter SKU code"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={inventoryForm.category}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}
                          placeholder="Enter product category"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={inventoryForm.supplier}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value })}
                          placeholder="Enter supplier name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={inventoryForm.quantity}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                          placeholder="Enter quantity"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select value={inventoryForm.unit} onValueChange={(value) => setInventoryForm({ ...inventoryForm, unit: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="ltr">Liters</SelectItem>
                            <SelectItem value="box">Boxes</SelectItem>
                            <SelectItem value="pallet">Pallets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="location">Rack/Location</Label>
                        <Input
                          id="location"
                          value={inventoryForm.location}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, location: e.target.value })}
                          placeholder="e.g., A1-B2"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="costPrice">Cost Price (₹)</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          step="0.01"
                          value={inventoryForm.costPrice}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, costPrice: e.target.value })}
                          placeholder="Enter cost price"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                        <Input
                          id="sellingPrice"
                          type="number"
                          step="0.01"
                          value={inventoryForm.sellingPrice}
                          onChange={(e) => setInventoryForm({ ...inventoryForm, sellingPrice: e.target.value })}
                          placeholder="Enter selling price"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={inventoryForm.expiryDate}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowInventoryModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Inventory Item</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory?.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">{item.supplier}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{formatCurrency(item.quantity * item.sellingPrice)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(item.status || 'inactive')}>
                            {(item.status || 'inactive').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No inventory items found. Add products to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stock Operations</CardTitle>
                <CardDescription>Record and track all stock movements and transactions</CardDescription>
              </div>
              <Dialog open={showOperationModal} onOpenChange={setShowOperationModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Operation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Stock Operation</DialogTitle>
                    <DialogDescription>Log a new stock movement or transaction</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleOperationSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Operation Type</Label>
                        <Select value={operationForm.type} onValueChange={(value) => setOperationForm({ ...operationForm, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inbound">Inbound (Stock In)</SelectItem>
                            <SelectItem value="outbound">Outbound (Stock Out)</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="productName">Product Name</Label>
                        <Input
                          id="productName"
                          value={operationForm.productName}
                          onChange={(e) => setOperationForm({ ...operationForm, productName: e.target.value })}
                          placeholder="Enter product name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={operationForm.quantity}
                          onChange={(e) => setOperationForm({ ...operationForm, quantity: e.target.value })}
                          placeholder="Enter quantity"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select value={operationForm.unit} onValueChange={(value) => setOperationForm({ ...operationForm, unit: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="ltr">Liters</SelectItem>
                            <SelectItem value="box">Boxes</SelectItem>
                            <SelectItem value="pallet">Pallets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="value">Value (₹)</Label>
                        <Input
                          id="value"
                          type="number"
                          step="0.01"
                          value={operationForm.value}
                          onChange={(e) => setOperationForm({ ...operationForm, value: e.target.value })}
                          placeholder="Enter value"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reference">Reference Number</Label>
                      <Input
                        id="reference"
                        value={operationForm.reference}
                        onChange={(e) => setOperationForm({ ...operationForm, reference: e.target.value })}
                        placeholder="Enter reference number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={operationForm.notes}
                        onChange={(e) => setOperationForm({ ...operationForm, notes: e.target.value })}
                        placeholder="Enter additional notes"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowOperationModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Record Operation</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {operationsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations?.map(operation => (
                      <TableRow key={operation.id}>
                        <TableCell>
                          {new Date(operation.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            operation.type === 'inbound' ? 'bg-green-100 text-green-800' :
                            operation.type === 'outbound' ? 'bg-red-100 text-red-800' :
                            operation.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {operation.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{operation.productName}</TableCell>
                        <TableCell>
                          {operation.quantity} {operation.unit}
                        </TableCell>
                        <TableCell>{formatCurrency(operation.value)}</TableCell>
                        <TableCell>{operation.operator}</TableCell>
                        <TableCell className="font-mono">{operation.reference}</TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No operations recorded yet. Start by recording your first stock operation.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Warehouse Utilization</CardTitle>
                <CardDescription>Space utilization across all facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warehouses?.map(warehouse => (
                    <div key={warehouse.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{warehouse?.name || 'Unknown'}</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(((warehouse?.occupiedSpace || 0) / (warehouse?.capacity || 1)) * 100)}%
                        </span>
                      </div>
                      <Progress value={((warehouse?.occupiedSpace || 0) / (warehouse?.capacity || 1)) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{(warehouse?.occupiedSpace || 0).toLocaleString()} sq ft used</span>
                        <span>{(warehouse?.capacity || 0).toLocaleString()} sq ft total</span>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      No warehouse data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for warehouse operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">Average Occupancy Rate</p>
                      <p className="text-2xl font-bold">{Math.ceil(summaryStats.averageOccupancy)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">Monthly Throughput</p>
                      <p className="text-2xl font-bold">{operations?.length || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">Revenue per Sq Ft</p>
                      <p className="text-2xl font-bold">
                        ₹{summaryStats.totalCapacity > 0 ? 
                          Math.ceil(summaryStats.totalRevenue / summaryStats.totalCapacity) : 0}
                      </p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">Cost Efficiency</p>
                      <p className="text-2xl font-bold">{Math.ceil(summaryStats.profitMargin)}%</p>
                    </div>
                    <Calculator className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Revenue Model & Financial Analysis</CardTitle>
              <CardDescription>Comprehensive financial performance of warehouse operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-green-600 mb-2">Total Revenue</h4>
                    <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Monthly earnings from all facilities</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-red-600 mb-2">Total Costs</h4>
                    <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalCost)}</p>
                    <p className="text-sm text-muted-foreground">Rent + operational expenses</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className={`font-semibold mb-2 ${summaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Net Profit
                    </h4>
                    <p className="text-2xl font-bold">{formatCurrency(summaryStats.totalProfit)}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil(summaryStats.profitMargin)}% profit margin
                    </p>
                  </div>
                </div>

                {/* Revenue Breakdown by Warehouse */}
                <div>
                  <h4 className="font-semibold mb-4">Revenue Breakdown by Warehouse</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Monthly Rent</TableHead>
                        <TableHead>Operating Cost</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Net Profit</TableHead>
                        <TableHead>ROI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouses?.map(warehouse => {
                        const totalCost = (warehouse?.monthlyRent || 0) + (warehouse?.operatingCost || 0);
                        const netProfit = (warehouse?.revenue || 0) - totalCost;
                        const roi = totalCost > 0 ? (netProfit / totalCost * 100) : 0;
                        
                        return (
                          <TableRow key={warehouse.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{warehouse?.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{warehouse?.location || 'N/A'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {(warehouse?.type || 'storage').replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(warehouse?.monthlyRent || 0)}</TableCell>
                            <TableCell>{formatCurrency(warehouse?.operatingCost || 0)}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(warehouse?.revenue || 0)}
                            </TableCell>
                            <TableCell className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(netProfit)}
                            </TableCell>
                            <TableCell className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.ceil(roi)}%
                            </TableCell>
                          </TableRow>
                        );
                      }) || (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No warehouse data available for revenue analysis
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Revenue Model Information */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Revenue Model Breakdown</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h5 className="font-medium text-green-600 mb-2">Revenue Sources</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• Storage fees based on space utilization</li>
                        <li>• Handling charges for inbound/outbound operations</li>
                        <li>• Value-added services (packaging, labeling)</li>
                        <li>• Cross-docking and transshipment fees</li>
                        <li>• Specialized storage premiums (cold, hazmat)</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-red-600 mb-2">Cost Structure</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• Monthly rent or lease payments</li>
                        <li>• Utilities (electricity, water, HVAC)</li>
                        <li>• Staff salaries and benefits</li>
                        <li>• Equipment maintenance and depreciation</li>
                        <li>• Insurance and security costs</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="font-semibold mb-4">Key Performance Indicators</h4>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-3 border rounded">
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{summaryStats.totalCapacity > 0 ? 
                          Math.ceil(summaryStats.totalRevenue / summaryStats.totalCapacity) : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Revenue per Sq Ft</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.ceil(summaryStats.averageOccupancy)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Occupancy Rate</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-2xl font-bold text-orange-600">
                        {operations?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Monthly Operations</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.ceil(summaryStats.profitMargin)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}