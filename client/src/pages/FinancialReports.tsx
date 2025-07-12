import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  Users,
  Car,
  FileText,
  Download,
  Calendar,
  IndianRupee,
  Truck,
  Receipt,
  PiggyBank,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FinancialDashboard {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
}

interface SalaryPayment {
  id: number;
  personName: string;
  role: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentType: string;
}

interface VehicleExpense {
  id: number;
  vehicleNumber: string;
  expenseType: string;
  amount: number;
  date: string;
  description: string;
}

interface TollExpense {
  id: number;
  vehicleNumber: string;
  tollLocation: string;
  amount: number;
  date: string;
}

interface IncomeRecord {
  id: number;
  source: string;
  amount: number;
  date: string;
  description: string;
  bookingId?: number;
}

export default function FinancialReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Helper function to refresh all data  
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/financial'] });
    window.location.reload(); // Force full page reload to ensure fresh data
  };
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Filter states
  const [filterPeriod, setFilterPeriod] = useState("all"); // all, week, month, custom
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  
  // Modal states
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showVehicleExpenseModal, setShowVehicleExpenseModal] = useState(false);
  const [showTollExpenseModal, setShowTollExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  
  // Edit states
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [editingVehicleExpense, setEditingVehicleExpense] = useState<any>(null);
  const [editingTollExpense, setEditingTollExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  
  // Form states
  const [salaryForm, setSalaryForm] = useState({
    personName: "",
    role: "",
    amount: "",
    paymentDate: "",
    status: "unpaid",
    paymentType: "salary",
    paymentMode: "cash"
  });
  
  const [vehicleExpenseForm, setVehicleExpenseForm] = useState({
    vehicleNumber: "",
    expenseType: "",
    amount: "",
    date: "",
    description: ""
  });
  
  const [tollExpenseForm, setTollExpenseForm] = useState({
    vehicleNumber: "",
    tollLocation: "",
    amount: "",
    date: ""
  });
  
  const [incomeForm, setIncomeForm] = useState({
    source: "",
    amount: "",
    date: "",
    description: "",
    bookingId: ""
  });

  // Financial dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<FinancialDashboard>({
    queryKey: ["/api/financial/dashboard"],
    enabled: !!user,
  });

  // Salary payments data
  const { data: salaryPayments, isLoading: salaryLoading } = useQuery<SalaryPayment[]>({
    queryKey: ["/api/financial/salary-payments"],
    enabled: !!user,
  });

  // Vehicle expenses data
  const { data: vehicleExpenses, isLoading: vehicleLoading } = useQuery<VehicleExpense[]>({
    queryKey: ["/api/financial/vehicle-expenses"],
    enabled: !!user,
  });

  // Toll expenses data
  const { data: tollExpenses, isLoading: tollLoading } = useQuery<TollExpense[]>({
    queryKey: ["/api/financial/toll-expenses"],
    enabled: !!user,
  });

  // Bookings data for income tracking (real revenue data)
  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  // Convert bookings to income format for display with real payment status
  const bookingIncomeRecords = bookings?.map(booking => ({
    id: booking.id,
    source: `Booking #${booking.trackingNumber}`,
    amount: booking.totalAmount,
    date: booking.createdAt,
    description: `${booking.senderName} to ${booking.receiverName}`,
    bookingId: booking.id,
    paymentStatus: booking.paymentStatus || 'pending', // Real payment status from booking
    status: booking.status || 'pending'
  })) || [];

  // Vehicles data for dropdown
  const { data: vehicles } = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
    enabled: !!user,
  });

  // Mutations for adding expenses
  const addSalaryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/financial/salary-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add salary payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowSalaryModal(false);
      setSalaryForm({ personName: "", role: "", amount: "", paymentDate: "", status: "unpaid", paymentType: "salary", paymentMode: "cash" });
      toast({ title: "Salary payment added successfully!" });
    },
  });

  const addVehicleExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/financial/vehicle-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add vehicle expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowVehicleExpenseModal(false);
      setVehicleExpenseForm({ vehicleNumber: "", expenseType: "", amount: "", date: "", description: "" });
      toast({ title: "Vehicle expense added successfully!" });
    },
  });

  const addTollExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/financial/toll-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add toll expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/toll-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowTollExpenseModal(false);
      setTollExpenseForm({ vehicleNumber: "", tollLocation: "", amount: "", date: "" });
      toast({ title: "Toll expense added successfully!" });
    },
  });

  const addIncomeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/financial/income-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add income record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/income-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowIncomeModal(false);
      setIncomeForm({ source: "", amount: "", date: "", description: "", bookingId: "" });
      toast({ title: "Income record added successfully!" });
    },
  });

  // Delete mutations
  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/financial/salary-payments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete salary payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      toast({ title: "Salary payment deleted successfully!" });
    },
  });

  const deleteVehicleExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/financial/vehicle-expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete vehicle expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      toast({ title: "Vehicle expense deleted successfully!" });
    },
  });

  const deleteTollExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/financial/toll-expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete toll expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/toll-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      toast({ title: "Toll expense deleted successfully!" });
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/financial/income-records/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete income record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/income-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      toast({ title: "Income record deleted successfully!" });
    },
  });

  // Update mutations
  const updateSalaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/financial/salary-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update salary payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowSalaryModal(false);
      setEditingSalary(null);
      setSalaryForm({ personName: "", role: "", amount: "", paymentDate: "", status: "unpaid", paymentType: "salary", paymentMode: "cash" });
      toast({ title: "Salary payment updated successfully!" });
    },
  });

  const updateVehicleExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/financial/vehicle-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update vehicle expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowVehicleExpenseModal(false);
      setEditingVehicleExpense(null);
      setVehicleExpenseForm({ vehicleNumber: "", expenseType: "", amount: "", date: "", description: "" });
      toast({ title: "Vehicle expense updated successfully!" });
    },
  });

  const updateTollExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/financial/toll-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update toll expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/toll-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowTollExpenseModal(false);
      setEditingTollExpense(null);
      setTollExpenseForm({ vehicleNumber: "", tollLocation: "", amount: "", date: "" });
      toast({ title: "Toll expense updated successfully!" });
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/financial/income-records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update income record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/income-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
      setShowIncomeModal(false);
      setEditingIncome(null);
      setIncomeForm({ source: "", amount: "", date: "", description: "", bookingId: "" });
      toast({ title: "Income record updated successfully!" });
    },
  });

  const formatCurrency = (amount: number) => {
    return `₹${Math.ceil(amount).toLocaleString()}`;
  };

  // Filter helper function
  const filterDataByDate = (data: any[], dateField: string = 'date') => {
    if (!data) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      switch (filterPeriod) {
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return itemDate >= weekAgo;
          
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return itemDate >= monthAgo;
          
        case "custom":
          if (!customDateFrom || !customDateTo) return true;
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999); // Include full end date
          return itemDate >= fromDate && itemDate <= toDate;
          
        default:
          return true;
      }
    });
  };

  // Filtered data
  const filteredSalaryPayments = filterDataByDate(salaryPayments, 'paymentDate');
  const filteredVehicleExpenses = filterDataByDate(vehicleExpenses, 'date');
  const filteredTollExpenses = filterDataByDate(tollExpenses, 'date');
  const filteredIncomeRecords = filterDataByDate(bookingIncomeRecords, 'date');

  // Calculate filtered dashboard data based on selected date range
  const calculateFilteredTotals = () => {
    // Calculate filtered income from booking revenue
    const filteredBookingIncome = filteredIncomeRecords?.reduce((sum, income) => sum + (Number(income.amount) || 0), 0) || 0;
    
    // Calculate filtered expenses
    const filteredSalaryTotal = filteredSalaryPayments?.reduce((sum, salary) => sum + (Number(salary.amount) || 0), 0) || 0;
    const filteredVehicleTotal = filteredVehicleExpenses?.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) || 0;
    const filteredTollTotal = filteredTollExpenses?.reduce((sum, toll) => sum + (Number(toll.amount) || 0), 0) || 0;
    const filteredTotalExpenses = filteredSalaryTotal + filteredVehicleTotal + filteredTollTotal;
    
    // Calculate filtered pending payments (bookings with pending/unpaid status)
    const filteredPendingPayments = filteredIncomeRecords?.filter(record => 
      record.paymentStatus === 'pending' || record.paymentStatus === 'unpaid'
    ).reduce((sum, record) => sum + (Number(record.amount) || 0), 0) || 0;
    
    return {
      totalIncome: filteredBookingIncome,
      totalExpense: filteredTotalExpenses,
      pendingPayments: filteredPendingPayments,
      netProfit: filteredBookingIncome - filteredTotalExpenses
    };
  };

  const filteredDashboardData = calculateFilteredTotals();

  const clearFilters = () => {
    setFilterPeriod("all");
    setCustomDateFrom("");
    setCustomDateTo("");
  };

  // Edit handlers
  const handleEditSalary = (payment: any) => {
    setEditingSalary(payment);
    setSalaryForm({
      personName: payment.personName,
      role: payment.role,
      amount: payment.amount ? payment.amount.toString() : "",
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      status: payment.status,
      paymentType: payment.paymentType,
      paymentMode: payment.paymentMode,
    });
    setShowSalaryModal(true);
  };

  const handleEditVehicleExpense = (expense: any) => {
    setEditingVehicleExpense(expense);
    setVehicleExpenseForm({
      vehicleNumber: expense.vehicleNumber,
      expenseType: expense.expenseType,
      amount: expense.amount ? expense.amount.toString() : "",
      date: new Date(expense.date).toISOString().split('T')[0],
      description: expense.description,
    });
    setShowVehicleExpenseModal(true);
  };

  const handleEditTollExpense = (toll: any) => {
    setEditingTollExpense(toll);
    setTollExpenseForm({
      vehicleNumber: toll.vehicleNumber,
      tollLocation: toll.tollLocation,
      amount: toll.amount ? toll.amount.toString() : "",
      date: new Date(toll.date).toISOString().split('T')[0],
    });
    setShowTollExpenseModal(true);
  };

  const handleEditIncome = (income: any) => {
    setEditingIncome(income);
    setIncomeForm({
      source: income.source,
      amount: income.amount ? income.amount.toString() : "",
      date: new Date(income.date).toISOString().split('T')[0],
      description: income.description,
      bookingId: income.bookingId ? income.bookingId.toString() : "",
    });
    setShowIncomeModal(true);
  };

  // Delete handlers with confirmation
  const handleDeleteSalary = (id: number) => {
    if (window.confirm("Are you sure you want to delete this salary payment?")) {
      deleteSalaryMutation.mutate(id);
    }
  };

  const handleDeleteVehicleExpense = (id: number) => {
    if (window.confirm("Are you sure you want to delete this vehicle expense?")) {
      deleteVehicleExpenseMutation.mutate(id);
    }
  };

  const handleDeleteTollExpense = (id: number) => {
    if (window.confirm("Are you sure you want to delete this toll expense?")) {
      deleteTollExpenseMutation.mutate(id);
    }
  };

  const handleDeleteIncome = (id: number) => {
    if (window.confirm("Are you sure you want to delete this income record?")) {
      deleteIncomeMutation.mutate(id);
    }
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...salaryForm,
      amount: parseFloat(salaryForm.amount),
    };
    
    if (editingSalary) {
      updateSalaryMutation.mutate({ id: editingSalary.id, data: formData });
    } else {
      addSalaryMutation.mutate(formData);
    }
  };

  const handleVehicleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...vehicleExpenseForm,
      amount: parseFloat(vehicleExpenseForm.amount),
    };
    
    if (editingVehicleExpense) {
      updateVehicleExpenseMutation.mutate({ id: editingVehicleExpense.id, data: formData });
    } else {
      addVehicleExpenseMutation.mutate(formData);
    }
  };

  const handleTollExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...tollExpenseForm,
      amount: parseFloat(tollExpenseForm.amount),
    };
    
    if (editingTollExpense) {
      updateTollExpenseMutation.mutate({ id: editingTollExpense.id, data: formData });
    } else {
      addTollExpenseMutation.mutate(formData);
    }
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...incomeForm,
      amount: parseFloat(incomeForm.amount),
      bookingId: incomeForm.bookingId ? parseInt(incomeForm.bookingId) : null,
    };
    
    if (editingIncome) {
      updateIncomeMutation.mutate({ id: editingIncome.id, data: formData });
    } else {
      addIncomeMutation.mutate(formData);
    }
  };

  if (!user) {
    return <div>Please log in to view financial reports.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive financial overview and detailed reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshAllData} variant="outline">
            Refresh Data
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="period">Time Period:</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterPeriod === "custom" && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateFrom">From:</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateTo">To:</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}

            {filterPeriod !== "all" && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}

            <div className="text-sm text-muted-foreground">
              {filterPeriod === "week" && "Showing data from last 7 days"}
              {filterPeriod === "month" && "Showing data from last 30 days"}
              {filterPeriod === "custom" && customDateFrom && customDateTo && 
                `Showing data from ${new Date(customDateFrom).toLocaleDateString()} to ${new Date(customDateTo).toLocaleDateString()}`}
              {filterPeriod === "all" && "Showing all available data"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="salaries" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Salaries
          </TabsTrigger>
          <TabsTrigger value="vehicle-expenses" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicle Expenses
          </TabsTrigger>
          <TabsTrigger value="toll-expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Toll Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? "Loading..." : formatCurrency(filteredDashboardData.totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredIncomeRecords?.length > 0
                    ? `${filteredIncomeRecords.length} ${filterPeriod !== 'all' ? 'filtered' : ''} bookings`
                    : "No booking revenue available"
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? "Loading..." : formatCurrency(filteredDashboardData.totalExpense)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((filteredSalaryPayments?.length || 0) + (filteredVehicleExpenses?.length || 0) + (filteredTollExpenses?.length || 0)) > 0
                    ? `${(filteredSalaryPayments?.length || 0) + (filteredVehicleExpenses?.length || 0) + (filteredTollExpenses?.length || 0)} ${filterPeriod !== 'all' ? 'filtered' : ''} expense records`
                    : "No expense data available"
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? "Loading..." : formatCurrency(filteredDashboardData.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredDashboardData.totalIncome > 0 ? 
                    `Profit Margin: ${Math.ceil((filteredDashboardData.netProfit / filteredDashboardData.totalIncome) * 100)}%` 
                    : "No profit data available"
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? "Loading..." : formatCurrency(filteredDashboardData.pendingPayments)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredDashboardData.pendingPayments > 0 ? 
                    `${filteredIncomeRecords?.filter(r => r.paymentStatus === 'pending' || r.paymentStatus === 'unpaid').length || 0} ${filterPeriod !== 'all' ? 'filtered' : ''} unpaid bookings` 
                    : "No pending payments"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? "Loading..." : (
                    (filteredSalaryPayments?.length || 0) + 
                    (filteredVehicleExpenses?.length || 0) + 
                    (filteredTollExpenses?.length || 0) + 
                    (filteredIncomeRecords?.length || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {`${filteredIncomeRecords?.length || 0} bookings + ${filteredSalaryPayments?.length || 0} salary + ${filteredVehicleExpenses?.length || 0} vehicle + ${filteredTollExpenses?.length || 0} toll ${filterPeriod !== 'all' ? 'filtered' : ''} records`}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Salary Payments</CardTitle>
                <CardDescription>
                  Employee salary records and payment history
                </CardDescription>
              </div>
              <Dialog open={showSalaryModal} onOpenChange={setShowSalaryModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Salary Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSalary ? "Edit Salary Payment" : "Add Salary Payment"}</DialogTitle>
                    <DialogDescription>
                      {editingSalary ? "Edit the salary payment record" : "Add a new salary payment record"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSalarySubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="personName" className="text-right">
                          Employee Name
                        </Label>
                        <Input
                          id="personName"
                          value={salaryForm.personName}
                          onChange={(e) => setSalaryForm({ ...salaryForm, personName: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <Select value={salaryForm.role} onValueChange={(value) => setSalaryForm({ ...salaryForm, role: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="driver">Driver</SelectItem>
                            <SelectItem value="helper">Helper</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="clerk">Clerk</SelectItem>
                            <SelectItem value="mechanic">Mechanic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Amount (₹)
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          value={salaryForm.amount}
                          onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentDate" className="text-right">
                          Payment Date
                        </Label>
                        <Input
                          id="paymentDate"
                          type="date"
                          value={salaryForm.paymentDate}
                          onChange={(e) => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                          Status
                        </Label>
                        <Select value={salaryForm.status} onValueChange={(value) => setSalaryForm({ ...salaryForm, status: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentMode" className="text-right">
                          Payment Mode
                        </Label>
                        <Select value={salaryForm.paymentMode} onValueChange={(value) => setSalaryForm({ ...salaryForm, paymentMode: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={addSalaryMutation.isPending || updateSalaryMutation.isPending}>
                        {(addSalaryMutation.isPending || updateSalaryMutation.isPending) 
                          ? (editingSalary ? "Updating..." : "Adding...") 
                          : (editingSalary ? "Update Payment" : "Add Payment")
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {salaryLoading ? (
                <div>Loading salary data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaryPayments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {filterPeriod !== 'all' 
                            ? `No salary payments found for the selected ${filterPeriod === 'custom' ? 'date range' : filterPeriod}`
                            : "No salary payments found"
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSalaryPayments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.personName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.role}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.paymentType}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditSalary(payment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSalary(payment.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicle-expenses" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vehicle Expenses</CardTitle>
                <CardDescription>
                  Vehicle maintenance and operational expenses
                </CardDescription>
              </div>
              <Dialog open={showVehicleExpenseModal} onOpenChange={setShowVehicleExpenseModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingVehicleExpense ? "Edit Vehicle Expense" : "Add Vehicle Expense"}</DialogTitle>
                    <DialogDescription>
                      {editingVehicleExpense ? "Edit the vehicle expense record" : "Add a new vehicle expense record"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleVehicleExpenseSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="vehicleNumber" className="text-right">
                          Vehicle Number
                        </Label>
                        <Select value={vehicleExpenseForm.vehicleNumber} onValueChange={(value) => setVehicleExpenseForm({ ...vehicleExpenseForm, vehicleNumber: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles?.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
                                {vehicle.registrationNumber} - {vehicle.vehicleType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expenseType" className="text-right">
                          Expense Type
                        </Label>
                        <Select value={vehicleExpenseForm.expenseType} onValueChange={(value) => setVehicleExpenseForm({ ...vehicleExpenseForm, expenseType: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="permit">Permit</SelectItem>
                            <SelectItem value="tyre">Tyre</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expenseAmount" className="text-right">
                          Amount (₹)
                        </Label>
                        <Input
                          id="expenseAmount"
                          type="number"
                          value={vehicleExpenseForm.amount}
                          onChange={(e) => setVehicleExpenseForm({ ...vehicleExpenseForm, amount: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expenseDate" className="text-right">
                          Date
                        </Label>
                        <Input
                          id="expenseDate"
                          type="date"
                          value={vehicleExpenseForm.date}
                          onChange={(e) => setVehicleExpenseForm({ ...vehicleExpenseForm, date: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={vehicleExpenseForm.description}
                          onChange={(e) => setVehicleExpenseForm({ ...vehicleExpenseForm, description: e.target.value })}
                          className="col-span-3"
                          placeholder="Enter expense details"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={addVehicleExpenseMutation.isPending || updateVehicleExpenseMutation.isPending}>
                        {(addVehicleExpenseMutation.isPending || updateVehicleExpenseMutation.isPending) 
                          ? (editingVehicleExpense ? "Updating..." : "Adding...") 
                          : (editingVehicleExpense ? "Update Expense" : "Add Expense")
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {vehicleLoading ? (
                <div>Loading vehicle expenses...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Expense Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicleExpenses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {filterPeriod !== 'all' 
                            ? `No vehicle expenses found for the selected ${filterPeriod === 'custom' ? 'date range' : filterPeriod}`
                            : "No vehicle expenses found"
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicleExpenses?.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.vehicleNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.expenseType}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditVehicleExpense(expense)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteVehicleExpense(expense.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="toll-expenses" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Toll Expenses</CardTitle>
                <CardDescription>
                  Highway toll payments and receipts
                </CardDescription>
              </div>
              <Dialog open={showTollExpenseModal} onOpenChange={setShowTollExpenseModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Toll Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTollExpense ? "Edit Toll Expense" : "Add Toll Expense"}</DialogTitle>
                    <DialogDescription>
                      {editingTollExpense ? "Edit the toll expense record" : "Add a new toll expense record"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleTollExpenseSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tollVehicleNumber" className="text-right">
                          Vehicle Number
                        </Label>
                        <Select value={tollExpenseForm.vehicleNumber} onValueChange={(value) => setTollExpenseForm({ ...tollExpenseForm, vehicleNumber: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles?.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
                                {vehicle.registrationNumber} - {vehicle.vehicleType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tollLocation" className="text-right">
                          Toll Location
                        </Label>
                        <Input
                          id="tollLocation"
                          value={tollExpenseForm.tollLocation}
                          onChange={(e) => setTollExpenseForm({ ...tollExpenseForm, tollLocation: e.target.value })}
                          className="col-span-3"
                          placeholder="Delhi-Mumbai Highway"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tollAmount" className="text-right">
                          Amount (₹)
                        </Label>
                        <Input
                          id="tollAmount"
                          type="number"
                          value={tollExpenseForm.amount}
                          onChange={(e) => setTollExpenseForm({ ...tollExpenseForm, amount: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tollDate" className="text-right">
                          Date
                        </Label>
                        <Input
                          id="tollDate"
                          type="date"
                          value={tollExpenseForm.date}
                          onChange={(e) => setTollExpenseForm({ ...tollExpenseForm, date: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={addTollExpenseMutation.isPending || updateTollExpenseMutation.isPending}>
                        {(addTollExpenseMutation.isPending || updateTollExpenseMutation.isPending) 
                          ? (editingTollExpense ? "Updating..." : "Adding...") 
                          : (editingTollExpense ? "Update Toll Expense" : "Add Toll Expense")
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tollLoading ? (
                <div>Loading toll expenses...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Toll Location</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTollExpenses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {filterPeriod !== 'all' 
                            ? `No toll expenses found for the selected ${filterPeriod === 'custom' ? 'date range' : filterPeriod}`
                            : "No toll expenses found"
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTollExpenses?.map((toll) => (
                      <TableRow key={toll.id}>
                        <TableCell className="font-medium">{toll.vehicleNumber}</TableCell>
                        <TableCell>{toll.tollLocation}</TableCell>
                        <TableCell>{formatCurrency(toll.amount)}</TableCell>
                        <TableCell>{new Date(toll.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditTollExpense(toll)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTollExpense(toll.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Booking Revenue</CardTitle>
                <CardDescription>
                  Real revenue from completed bookings (₹{dashboardData?.totalIncome || 0} total)
                </CardDescription>
              </div>
              <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingIncome ? "Edit Income Record" : "Add Income Record"}</DialogTitle>
                    <DialogDescription>
                      {editingIncome ? "Edit the income record" : "Add a new income record"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleIncomeSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="source" className="text-right">
                          Source
                        </Label>
                        <Select value={incomeForm.source} onValueChange={(value) => setIncomeForm({ ...incomeForm, source: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select income source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="booking">Booking Revenue</SelectItem>
                            <SelectItem value="advance">Advance Payment</SelectItem>
                            <SelectItem value="penalty">Penalty Fee</SelectItem>
                            <SelectItem value="commission">Commission</SelectItem>
                            <SelectItem value="other">Other Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="incomeAmount" className="text-right">
                          Amount (₹)
                        </Label>
                        <Input
                          id="incomeAmount"
                          type="number"
                          value={incomeForm.amount}
                          onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="incomeDate" className="text-right">
                          Date
                        </Label>
                        <Input
                          id="incomeDate"
                          type="date"
                          value={incomeForm.date}
                          onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="incomeDescription" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="incomeDescription"
                          value={incomeForm.description}
                          onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                          className="col-span-3"
                          placeholder="Enter income details"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bookingId" className="text-right">
                          Booking ID (Optional)
                        </Label>
                        <Input
                          id="bookingId"
                          type="number"
                          value={incomeForm.bookingId}
                          onChange={(e) => setIncomeForm({ ...incomeForm, bookingId: e.target.value })}
                          className="col-span-3"
                          placeholder="Link to booking if applicable"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={addIncomeMutation.isPending || updateIncomeMutation.isPending}>
                        {(addIncomeMutation.isPending || updateIncomeMutation.isPending) 
                          ? (editingIncome ? "Updating..." : "Adding...") 
                          : (editingIncome ? "Update Income Record" : "Add Income Record")
                        }
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div>Loading booking revenue data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncomeRecords?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {filterPeriod !== 'all' 
                            ? `No booking revenue found for the selected ${filterPeriod === 'custom' ? 'date range' : filterPeriod}`
                            : "No booking revenue found"
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIncomeRecords?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.source}
                        </TableCell>
                        <TableCell>{formatCurrency(record.amount)}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {record.paymentStatus === 'paid' || record.paymentStatus === 'completed' ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                          ) : record.paymentStatus === 'pending' ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">#{record.bookingId}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditIncome(record)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIncome(record.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>
                  Monthly expense categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4" />
                      <span>Vehicle Expenses</span>
                    </div>
                    <span className="font-medium">₹{Math.ceil((filteredVehicleExpenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4" />
                      <span>Toll Expenses</span>
                    </div>
                    <span className="font-medium">₹{Math.ceil((filteredTollExpenses?.reduce((sum, toll) => sum + (Number(toll.amount) || 0), 0) || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Salary Payments</span>
                    </div>
                    <span className="font-medium">₹{Math.ceil((filteredSalaryPayments?.reduce((sum, sal) => sum + (Number(sal.amount) || 0), 0) || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>
                  Total income from all sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Booking Revenue</span>
                    </div>
                    <span className="font-medium">₹{Math.ceil((filteredIncomeRecords?.filter(r => r.bookingId).reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0) || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PiggyBank className="h-4 w-4" />
                      <span>Other Income</span>
                    </div>
                    <span className="font-medium">₹{Math.ceil((filteredIncomeRecords?.filter(r => !r.bookingId).reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0) || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${Math.ceil(Number(amount) || 0).toLocaleString()}`;
};

// Moved refreshAllData inside component to access queryClient