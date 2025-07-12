import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useSuperAdminTheme } from "@/contexts/SuperAdminThemeContext";
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
  Eye
} from "lucide-react";

// Dynamic colors based on Super Admin theme

function AdminReports() {
  const { user } = useAuth();
  const { themeSettings } = useSuperAdminTheme();
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Dynamic theme colors for charts
  const chartColors = [
    themeSettings.primaryColor,
    themeSettings.secondaryColor, 
    themeSettings.accentColor,
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300'
  ];

  // Fetch comprehensive reports data
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useQuery<any>({
    queryKey: ['/api/admin/reports', dateRange, reportType],
    enabled: !!user && user.role === 'admin',
    staleTime: 30000, // Cache for 30 seconds
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Admin access required to view reports</p>
        </div>
      </div>
    );
  }

  const exportData = (format: string) => {
    if (!reportsData) return;
    
    if (format === 'pdf') {
      // PDF export logic here
      console.log('Exporting to PDF...');
    } else if (format === 'excel') {
      // Excel export logic here
      console.log('Exporting to Excel...');
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${themeSettings.primaryColor}08 0%, ${themeSettings.secondaryColor}08 50%, ${themeSettings.accentColor}08 100%)`
      }}
    >
      {/* Enhanced Header */}
      <div 
        className="backdrop-blur-sm border-b p-6 mb-8"
        style={{
          backgroundColor: `${themeSettings.primaryColor}05`,
          borderBottomColor: `${themeSettings.primaryColor}20`
        }}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 
              className="text-3xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${themeSettings.primaryColor} 0%, ${themeSettings.accentColor} 100%)`
              }}
            >
              Business Intelligence Dashboard
            </h1>
            <p className="mt-1" style={{ color: `${themeSettings.primaryColor}99` }}>
              Comprehensive analytics and performance insights
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search reports..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
            </div>
            
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
            
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => exportData('pdf')}
              style={{ 
                borderColor: themeSettings.primaryColor,
                color: themeSettings.primaryColor 
              }}
              className="hover:opacity-80"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => exportData('excel')}
              style={{ 
                borderColor: themeSettings.accentColor,
                color: themeSettings.accentColor 
              }}
              className="hover:opacity-80"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList 
            className="grid w-full grid-cols-2 lg:grid-cols-6 backdrop-blur-sm"
            style={{ backgroundColor: `${themeSettings.primaryColor}10` }}
          >
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {reportsLoading ? "..." : `₹${Math.ceil(reportsData?.metrics?.totalRevenue || 0).toLocaleString()}`}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+12.5%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Bookings</p>
                      <p className="text-2xl font-bold text-green-900">
                        {reportsLoading ? "..." : (reportsData?.metrics?.totalBookings || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+8.2%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <Package className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Active Customers</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {reportsLoading ? "..." : (reportsData?.metrics?.activeCustomers || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+15.3%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <Users className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Completion Rate</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {reportsLoading ? "..." : `${reportsData?.metrics?.completionRate || 0}%`}
                      </p>
                      <div className="flex items-center mt-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600 font-medium">Excellent</span>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-full">
                      <Target className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Performance */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Monthly Performance
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={reportsData?.monthlyData || []}>
                        <defs>
                          <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorBookings)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Booking Status Distribution
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ResponsiveContainer width="60%" height={300}>
                        <PieChart>
                          <Pie
                            data={reportsData?.statusDistribution || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="count"
                            nameKey="type"
                          >
                            {(reportsData?.statusDistribution || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 pl-4">
                        <div className="space-y-3">
                          {(reportsData?.statusDistribution || []).map((item: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-3" 
                                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                                ></div>
                                <span className="text-sm font-medium">{item.type}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">{item.count}</div>
                                <div className="text-xs text-gray-600">₹{Math.ceil(item.revenue || 0).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={reportsData?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Financial Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700 font-medium">Average Order Value</span>
                      <span className="text-lg font-bold text-green-900">
                        ₹{Math.ceil(reportsData?.metrics?.avgOrderValue || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 font-medium">Monthly Growth</span>
                      <span className="text-lg font-bold text-blue-900">+12.5%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700 font-medium">Total Vehicles</span>
                      <span className="text-lg font-bold text-purple-900">
                        {reportsData?.metrics?.totalVehicles || 0}
                      </span>
                    </div>
                  </div>
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
                    {(reportsData?.vehicleDistribution || []).map((vehicle: any, index: number) => (
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
                          <div className="font-semibold">{vehicle.count} bookings</div>
                          <div className="text-sm text-gray-600">₹{Math.ceil(vehicle.revenue || 0).toLocaleString()}</div>
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
                        {(reportsData?.statusDistribution?.find((s: any) => s.type === 'In_transit')?.count || 0)}
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
                      {(reportsData?.topCustomers || []).slice(0, 10).map((customer: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 font-medium">{customer.name}</td>
                          <td className="py-3 text-gray-600">{customer.email}</td>
                          <td className="py-3">{customer.bookings}</td>
                          <td className="py-3 font-semibold">₹{Math.ceil(customer.revenue || 0).toLocaleString()}</td>
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
                      {(reportsData?.topRoutes || []).map((route: any, index: number) => (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Monthly Booking Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportsData?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Vehicle Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportsData?.vehicleDistribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="type"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(reportsData?.vehicleDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminReports;