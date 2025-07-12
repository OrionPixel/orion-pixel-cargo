import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar,
  FileText,
  Filter,
  Search,
  Users,
  Truck,
  MapPin,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw
} from "lucide-react";

interface Booking {
  id: number;
  status?: string;
  createdAt: string;
  totalAmount?: number;
  pickupCity?: string;
  deliveryCity?: string;
  bookingType?: string;
  [key: string]: any;
}

interface DashboardStats {
  revenue?: number;
  totalBookings?: number;
  activeShipments?: number;
  availableVehicles?: number;
  [key: string]: any;
}

interface Vehicle {
  id: number;
  type?: string;
  [key: string]: any;
}

export default function Reports() {
  const { user } = useAuth();
  const { themeSettings } = useUserTheme();
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user bookings for reports
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>(
    ['/api/bookings'],
    async () => {
      const response = await fetch('/api/bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return response.json();
    },
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>(
    ['/api/dashboard/stats'],
    async () => {
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // Fetch vehicles data
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>(
    ['/api/vehicles'],
    async () => {
      const response = await fetch('/api/vehicles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return response.json();
    },
    {
      staleTime: 300000, // 5 minutes
    }
  );

  const isLoading = bookingsLoading || statsLoading || vehiclesLoading;

  // Process data for reports
  const processedData = React.useMemo(() => {
    if (!bookings || !dashboardStats || !vehicles) return null;

    // Calculate booking status distribution
    const statusDistribution = bookings.reduce((acc: any, booking: any) => {
      const status = booking.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate monthly revenue data
    const monthlyData = bookings.reduce((acc: any, booking: any) => {
      const date = new Date(booking.createdAt);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[month]) {
        acc[month] = { month, revenue: 0, bookings: 0 };
      }
      
      acc[month].revenue += Math.ceil(booking.totalAmount || 0);
      acc[month].bookings += 1;
      
      return acc;
    }, {});

    // Calculate route distribution
    const routeData = bookings.reduce((acc: any, booking: any) => {
      const route = `${booking.pickupCity || 'Unknown'} → ${booking.deliveryCity || 'Unknown'}`;
      if (!acc[route]) {
        acc[route] = { route, count: 0, revenue: 0 };
      }
      acc[route].count += 1;
      acc[route].revenue += Math.ceil(booking.totalAmount || 0);
      return acc;
    }, {});

    // Calculate service type distribution
    const serviceTypes = bookings.reduce((acc: any, booking: any) => {
      const type = booking.bookingType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: Math.round((count as number / bookings.length) * 100)
      })),
      monthlyData: Object.values(monthlyData).slice(-6), // Last 6 months
      topRoutes: Object.values(routeData)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5),
      serviceTypes: Object.entries(serviceTypes).map(([type, count]) => ({
        type: type.toUpperCase(),
        count,
        percentage: Math.round((count as number / bookings.length) * 100)
      })),
      totalRevenue: Math.ceil(dashboardStats.revenue || 0),
      totalBookings: dashboardStats.totalBookings || 0,
      activeShipments: dashboardStats.activeShipments || 0,
      availableVehicles: dashboardStats.availableVehicles || 0,
      avgOrderValue: (dashboardStats?.totalBookings ?? 0) > 0 ? Math.ceil((dashboardStats?.revenue || 0) / (dashboardStats?.totalBookings ?? 1)) : 0,
      totalVehicles: vehicles.length || 0,
      vehicleTypes: vehicles.reduce((acc: any, vehicle: any) => {
        const type = vehicle.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
        ? Object.entries(vehicles.reduce((acc: any, vehicle: any) => {
            const type = vehicle.type || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})).map(([type, count]) => ({ type, count }))
        : []
    };
  }, [bookings, dashboardStats, vehicles]);

  const exportData = (format: string) => {
    if (!processedData) return;
    
    if (format === 'pdf') {
      console.log('Exporting to PDF...');
    } else if (format === 'excel') {
      console.log('Exporting to Excel...');
    }
  };

  const themeColors = themeSettings ? {
    primary: themeSettings.primaryColor,
    secondary: themeSettings.secondaryColor, 
    accent: themeSettings.accentColor
  } : {
    primary: '#4167c1',
    secondary: '#d88eda',
    accent: '#ce67a6'
  };

  const COLORS = [
    `hsl(var(--primary))`,
    `hsl(var(--secondary))`, 
    `hsl(var(--accent))`,
    '#8884d8',
    '#82ca9d',
    '#ffc658'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ 
        background: `linear-gradient(135deg, white 0%, ${themeColors.primary}10 50%, ${themeColors.secondary}10 100%)`
      }}>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
            <span style={{ color: themeColors.primary }} className="text-lg font-medium">Loading Reports...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="min-h-screen" style={{ 
        background: `linear-gradient(135deg, white 0%, ${themeColors.primary}10 50%, ${themeColors.secondary}10 100%)`
      }}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ color: themeColors.primary }}>No Data Available</h2>
            <p className="mt-2 text-gray-600">Please create some bookings to generate reports</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: `linear-gradient(135deg, white 0%, ${themeColors.primary}10 50%, ${themeColors.secondary}10 100%)`
    }}>
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold" style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Business Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => exportData('pdf')}
              className="border-2 hover:shadow-lg transition-all duration-200"
              style={{ 
                borderColor: themeColors.primary,
                color: themeColors.primary 
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => exportData('excel')}
              className="border-2 hover:shadow-lg transition-all duration-200"
              style={{ 
                borderColor: themeColors.accent,
                color: themeColors.accent 
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-200" style={{ borderColor: `${themeColors.primary}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Revenue</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                        ₹{Math.ceil(processedData.totalRevenue).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+12.5%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.primary}20` }}>
                      <DollarSign className="h-6 w-6" style={{ color: themeColors.primary }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-200" style={{ borderColor: `${themeColors.secondary}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Bookings</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.secondary }}>
                        {processedData.totalBookings.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+8.2%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.secondary}20` }}>
                      <Package className="h-6 w-6" style={{ color: themeColors.secondary }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-200" style={{ borderColor: `${themeColors.accent}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Active Shipments</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>
                        {processedData.activeShipments.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <Activity className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-sm text-blue-600 font-medium">Live</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.accent}20` }}>
                      <Truck className="h-6 w-6" style={{ color: themeColors.accent }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-200" style={{ borderColor: `${themeColors.primary}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Available Vehicles</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>
                        {processedData.availableVehicles.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">Ready</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.primary}20` }}>
                      <Truck className="h-6 w-6" style={{ color: themeColors.primary }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-white to-gray-50" style={{ borderLeft: `4px solid ${themeColors.primary}` }}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.primary}20` }}>
                      <BarChart3 className="h-5 w-5" style={{ color: themeColors.primary }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Monthly Growth</p>
                      <p className="text-lg font-semibold" style={{ color: themeColors.primary }}>+15.2%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50" style={{ borderLeft: `4px solid ${themeColors.secondary}` }}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.secondary}20` }}>
                      <TrendingUp className="h-5 w-5" style={{ color: themeColors.secondary }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-lg font-semibold" style={{ color: themeColors.secondary }}>94.5%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50" style={{ borderLeft: `4px solid ${themeColors.accent}` }}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${themeColors.accent}20` }}>
                      <Users className="h-5 w-5" style={{ color: themeColors.accent }} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Customer Satisfaction</p>
                      <p className="text-lg font-semibold" style={{ color: themeColors.accent }}>4.8/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart */}
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.primary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                      Monthly Revenue Trend
                    </div>
                    <Badge variant="outline" style={{ color: themeColors.primary, borderColor: themeColors.primary }}>
                      <Activity className="h-3 w-3 mr-1" />
                      Live Data
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={processedData.monthlyData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: `1px solid ${themeColors.primary}`,
                          borderRadius: '8px'
                        }} 
                        formatter={(value) => [`₹${Math.ceil(value as number).toLocaleString()}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={themeColors.primary}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Booking Status Distribution */}
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.secondary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" style={{ color: themeColors.secondary }} />
                      Booking Status Distribution
                    </div>
                    <Badge variant="outline" style={{ color: themeColors.secondary, borderColor: themeColors.secondary }}>
                      <Eye className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <ResponsiveContainer width="60%" height={300}>
                      <PieChart>
                        <Pie
                          data={processedData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="count"
                          nameKey="status"
                        >
                          {processedData.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} bookings`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 pl-4">
                      <div className="space-y-3">
                        {processedData.statusDistribution.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-3" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-sm font-medium">{item.status}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold">{Number(item.count)}</span>
                              <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Type Distribution */}
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.accent}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" style={{ color: themeColors.accent }} />
                    Service Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.serviceTypes} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="type" type="category" width={80} />
                      <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill={themeColors.accent}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Bookings Trend */}
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.primary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                    Monthly Bookings Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={processedData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: `1px solid ${themeColors.primary}`,
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`${value} bookings`, 'Total Bookings']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bookings" 
                        stroke={themeColors.primary}
                        strokeWidth={3}
                        dot={{ fill: themeColors.primary, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: themeColors.primary, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.primary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={processedData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: `1px solid ${themeColors.primary}`,
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [`₹${Math.ceil(value as number).toLocaleString()}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={themeColors.primary}
                        strokeWidth={3}
                        dot={{ fill: themeColors.primary, strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: themeColors.primary, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.secondary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" style={{ color: themeColors.secondary }} />
                    Financial Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.primary}10`, border: `1px solid ${themeColors.primary}30` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Average Order Value</span>
                      <span className="text-lg font-bold" style={{ color: themeColors.primary }}>
                        ₹{Math.ceil(processedData.avgOrderValue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.secondary}10`, border: `1px solid ${themeColors.secondary}30` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Monthly Growth</span>
                      <span className="text-lg font-bold" style={{ color: themeColors.secondary }}>+15.2%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.accent}10`, border: `1px solid ${themeColors.accent}30` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Vehicles</span>
                      <span className="text-lg font-bold" style={{ color: themeColors.accent }}>
                        {processedData.totalVehicles}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${themeColors.primary}10`, border: `1px solid ${themeColors.primary}30` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                      <span className="text-lg font-bold" style={{ color: themeColors.primary }}>94.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.accent}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" style={{ color: themeColors.accent }} />
                    Revenue by Service Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={processedData.serviceTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="revenue"
                        nameKey="type"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {processedData.serviceTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${Math.ceil(value as number).toLocaleString()}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.primary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                    Monthly Performance Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? `₹${Math.ceil(value as number).toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : 'Bookings'
                        ]}
                      />
                      <Bar dataKey="revenue" fill={themeColors.primary} name="revenue" />
                      <Bar dataKey="bookings" fill={themeColors.secondary} name="bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs content */}
          <TabsContent value="operational" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Vehicle Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(processedData?.vehicleTypes || []).map((vehicle, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full mr-3 ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-green-500' : 
                            index === 2 ? 'bg-orange-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="font-medium">{vehicle.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{Number(vehicle.count)} bookings</div>
                          <div className="text-sm text-gray-600">₹{Math.ceil(Number((vehicle as any).revenue) || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">On-Time Delivery</span>
                      </div>
                      <span className="text-lg font-bold text-green-900">94%</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium">Average Transit Time</span>
                      </div>
                      <span className="text-lg font-bold text-blue-900">2.3 days</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                        <span className="font-medium">Pending Deliveries</span>
                      </div>
                      <span className="text-lg font-bold text-orange-900">
                        {Number(processedData?.statusDistribution?.find(s => s.status === 'In_transit')?.count) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Top Customers by Revenue
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Eye className="h-3 w-3 mr-1" />
                    Live Data
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-semibold">Customer</th>
                        <th className="text-left py-3 font-semibold">Email</th>
                        <th className="text-left py-3 font-semibold">Bookings</th>
                        <th className="text-left py-3 font-semibold">Revenue</th>
                        <th className="text-left py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Rajesh Kumar', email: 'rajesh@email.com', bookings: 12, revenue: 45600 },
                        { name: 'Priya Sharma', email: 'priya@email.com', bookings: 8, revenue: 32100 },
                        { name: 'Amit Singh', email: 'amit@email.com', bookings: 6, revenue: 28900 },
                        { name: 'Deepak Verma', email: 'deepak@email.com', bookings: 5, revenue: 19500 },
                        { name: 'Sunita Gupta', email: 'sunita@email.com', bookings: 4, revenue: 15200 }
                      ].map((customer, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{customer.name}</td>
                          <td className="py-3 text-gray-600">{customer.email}</td>
                          <td className="py-3">{customer.bookings}</td>
                          <td className="py-3 font-semibold">₹{Math.ceil(customer.revenue).toLocaleString()}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Top Performing Routes
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Activity className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-semibold">Route</th>
                        <th className="text-left py-3 font-semibold">Bookings</th>
                        <th className="text-left py-3 font-semibold">Revenue</th>
                        <th className="text-left py-3 font-semibold">Avg. Order Value</th>
                        <th className="text-left py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData?.topRoutes?.map((route: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{route.from} → {route.to}</td>
                          <td className="py-3">{route.count}</td>
                          <td className="py-3 font-semibold">₹{Math.ceil(route.revenue || 0).toLocaleString()}</td>
                          <td className="py-3">₹{route.count > 0 ? Math.ceil((route.revenue || 0) / route.count).toLocaleString() : 0}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Key Analytics Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-white to-gray-50 border-2" style={{ borderColor: `${themeColors.primary}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>92.1%</p>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.primary}20` }}>
                      <Target className="h-6 w-6" style={{ color: themeColors.primary }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50 border-2" style={{ borderColor: `${themeColors.secondary}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.secondary }}>87.5%</p>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.secondary}20` }}>
                      <Users className="h-6 w-6" style={{ color: themeColors.secondary }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50 border-2" style={{ borderColor: `${themeColors.accent}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fleet Efficiency</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>94.8%</p>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.accent}20` }}>
                      <Truck className="h-6 w-6" style={{ color: themeColors.accent }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-gray-50 border-2" style={{ borderColor: `${themeColors.primary}30` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                      <p className="text-2xl font-bold" style={{ color: themeColors.primary }}>+24.3%</p>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${themeColors.primary}20` }}>
                      <TrendingUp className="h-6 w-6" style={{ color: themeColors.primary }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.primary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                      Monthly Performance Analytics
                    </div>
                    <Badge variant="outline" style={{ color: themeColors.primary, borderColor: themeColors.primary }}>
                      Real-time
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={processedData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: `1px solid ${themeColors.primary}`,
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [
                          name === 'revenue' ? `₹${Math.ceil(value as number).toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : 'Bookings'
                        ]}
                      />
                      <Bar 
                        dataKey="bookings" 
                        fill={themeColors.primary}
                        radius={[4, 4, 0, 0]}
                        name="bookings"
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill={themeColors.secondary}
                        radius={[4, 4, 0, 0]}
                        name="revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.secondary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" style={{ color: themeColors.secondary }} />
                    Vehicle Utilization Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={processedData.vehicleTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        dataKey="count"
                        nameKey="type"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {processedData.vehicleTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} vehicles`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Route Performance Analysis */}
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.accent}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" style={{ color: themeColors.accent }} />
                    Route Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(processedData.topRoutes || []).map((r, idx) => {
                      const route = r as { from: string; to: string; count: number; revenue: number };
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{route.from} → {route.to}</span>
                          <span className="text-xs text-gray-500">{route.count} shipments</span>
                          <span className="text-xs text-gray-500">₹{Math.ceil(route.revenue).toLocaleString()}</span>
                          <span className="text-xs text-gray-500">Avg: ₹{Math.ceil(route.revenue / route.count).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Analytics */}
              <Card className="bg-white/90 backdrop-blur-sm border-2" style={{ borderColor: `${themeColors.primary}20` }}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                    Customer Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Example: Top customers by revenue, retention, etc. */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">Rajesh Kumar</span>
                      <span className="text-xs text-gray-500">12 bookings</span>
                      <span className="text-xs text-gray-500">₹45,600</span>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                    {/* Add more customer analytics as needed */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}