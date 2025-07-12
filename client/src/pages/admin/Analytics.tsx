import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import {
  BarChart3, TrendingUp, Users, Package, DollarSign, Activity,
  Download, RefreshCw, ArrowUp, ArrowDown, Calendar, Truck,
  MapPin, Clock, Target, Zap, Globe, Star, Award, ShoppingCart,
  Route, Building2, PieChart as PieChartIcon, TrendingDown,
  FileText, Eye, Filter, Search, MoreVertical, Navigation,
  Compass, Map, Navigation2, Calculator, Percent, IndianRupee
} from "lucide-react";

function AdminAnalytics() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Check authentication and admin role
  if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
    window.location.href = "/admin-login";
    return null;
  }

  // Fetch comprehensive analytics data from database
  const { data: comprehensiveData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin-comprehensive-analytics"],
    enabled: !!currentUser && currentUser.role === 'admin',
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser && currentUser.role === 'admin',
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    enabled: !!currentUser && currentUser.role === 'admin',
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/api/admin/vehicles"],
    enabled: !!currentUser && currentUser.role === 'admin',
  });

  // Use real analytics data from database
  const comprehensiveAnalytics = useMemo(() => {
    if (!comprehensiveData) {
      return {
        totalRevenue: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        revenueGrowth: 0,
        bookingGrowth: 0,
        totalBookings: 0,
        totalUsers: 0,
        totalVehicles: 0,
        completionRate: 0,
        cancellationRate: 0,
        utilizationRate: 0,
        avgOrderValue: 0,
        deliveredBookings: 0,
        inTransitBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        activeVehicles: 0,
        inTransitVehicles: 0,
        maintenanceVehicles: 0,
        topRoutes: [],
        topCities: [],
        serviceStats: [],
        monthlyTrends: [],
        customerSegments: [],
        last30DaysRevenue: 0,
        last30DaysBookings: 0,
        last7DaysBookings: 0
      };
    }

    // Process comprehensive data from backend
    const data = comprehensiveData;
    
    // Calculate city-wise analysis from routes
    const cityStats = {};
    data.topRoutes?.forEach(route => {
      const [pickup, delivery] = route.route.split(' → ');
      
      if (!cityStats[pickup]) {
        cityStats[pickup] = { city: pickup, pickups: 0, deliveries: 0, totalRevenue: 0, totalBookings: 0 };
      }
      if (!cityStats[delivery]) {
        cityStats[delivery] = { city: delivery, pickups: 0, deliveries: 0, totalRevenue: 0, totalBookings: 0 };
      }
      
      cityStats[pickup].pickups += route.count;
      cityStats[pickup].totalRevenue += route.revenue;
      cityStats[pickup].totalBookings += route.count;
      
      cityStats[delivery].deliveries += route.count;
      cityStats[delivery].totalRevenue += route.revenue;
      cityStats[delivery].totalBookings += route.count;
    });
    
    const topCities = Object.values(cityStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 8);

    // Calculate vehicle utilization
    const vehicleStats = data.vehicleStatusCounts || {};
    const totalVehicles = Object.values(vehicleStats).reduce((sum, count) => sum + count, 0);
    const activeVehicles = vehicleStats.available || 0;
    const inTransitVehicles = vehicleStats.in_transit || 0;
    const maintenanceVehicles = vehicleStats.maintenance || 0;
    const utilizationRate = totalVehicles > 0 ? Math.ceil(((activeVehicles + inTransitVehicles) / totalVehicles) * 100) : 0;
    
    // Customer segments based on revenue
    const customerSegments = users.reduce((acc, user) => {
      const userBookings = bookings.filter(b => b.userId === user.id);
      const userRevenue = Math.ceil(userBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0));
      
      let segment = 'New';
      if (userRevenue > 50000) segment = 'Premium';
      else if (userRevenue > 20000) segment = 'Gold';
      else if (userRevenue > 5000) segment = 'Silver';
      else if (userBookings.length > 0) segment = 'Bronze';
      
      if (!acc[segment]) acc[segment] = { segment, count: 0, revenue: 0 };
      acc[segment].count += 1;
      acc[segment].revenue += userRevenue;
      
      return acc;
    }, {});

    return {
      // Real data from backend
      totalRevenue: data.totalRevenue || 0,
      thisMonthRevenue: data.thisMonthRevenue || 0,
      lastMonthRevenue: data.lastMonthRevenue || 0,
      revenueGrowth: data.revenueGrowth || 0,
      bookingGrowth: data.bookingGrowth || 0,
      totalBookings: data.totalBookings || 0,
      totalUsers: data.totalUsers || 0,
      totalVehicles: data.totalVehicles || 0,
      completionRate: data.completionRate || 0,
      cancellationRate: data.cancellationRate || 0,
      utilizationRate,
      avgOrderValue: data.avgOrderValue || 0,
      
      // Status distributions from real data
      deliveredBookings: data.deliveredBookings || 0,
      inTransitBookings: data.inTransitBookings || 0,
      pendingBookings: data.pendingBookings || 0,
      cancelledBookings: data.bookingStatusCounts?.cancelled || 0,
      activeVehicles,
      inTransitVehicles,
      maintenanceVehicles,
      
      // Market analysis from real data
      topRoutes: data.topRoutes || [],
      topCities,
      serviceStats: data.servicePerformance?.map(service => ({
        type: service.type,
        count: service.count,
        revenue: service.revenue,
        marketShare: service.percentage
      })) || [],
      monthlyTrends: data.monthlyTrends?.map(trend => ({
        month: trend.month,
        bookings: trend.bookings,
        revenue: trend.revenue,
        avgOrderValue: trend.bookings > 0 ? Math.ceil(trend.revenue / trend.bookings) : 0
      })) || [],
      customerSegments: Object.values(customerSegments),
      
      // Additional metrics
      last30DaysRevenue: data.totalRevenue || 0, // Fallback to total
      last30DaysBookings: data.totalBookings || 0,
      last7DaysBookings: data.totalBookings || 0
    };
  }, [comprehensiveData, bookings, users, vehicles]);

  // Chart colors based on theme
  const chartColors = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  if (authLoading || analyticsLoading || usersLoading || bookingsLoading || vehiclesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="text-text-secondary">Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50 to-secondary-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
              Business Intelligence Dashboard
            </h1>
            <p className="text-text-secondary">
              Advanced analytics, market trends, and performance insights for strategic decision making
            </p>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last updated: {new Date().toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Real-time data
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-white border-primary-200">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" className="border-primary-200">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-primary-600 to-accent-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Super Admin Revenue Breakdown */}
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-white to-primary-50 border-primary-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-700">
                <IndianRupee className="h-5 w-5" />
                Super Admin Revenue Breakdown (Commission + Subscription)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-text-secondary font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-700">
                  ₹{(comprehensiveData?.totalIncome || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  {(comprehensiveData?.monthlyGrowth || 0) >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${(comprehensiveData?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(comprehensiveData?.monthlyGrowth || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-text-secondary font-medium">Commission Revenue</p>
                <p className="text-2xl font-bold text-secondary-700">
                  ₹{(comprehensiveData?.commissionRevenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">From user bookings</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-text-secondary font-medium">Subscription Revenue</p>
                <p className="text-2xl font-bold text-accent-700">
                  ₹{(comprehensiveData?.subscriptionRevenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">Monthly subscriptions</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-text-secondary font-medium">Total Income</p>
                <p className="text-lg font-semibold text-text-primary">
                  ₹{(comprehensiveData?.totalIncome || 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-secondary">Commission + Subscription</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          <Card className="bg-gradient-to-br from-white to-primary-50 border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-medium">This Month Revenue</p>
                  <p className="text-2xl font-bold text-primary-700">
                    ₹{comprehensiveAnalytics.thisMonthRevenue.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <Percent className="h-3 w-3 text-primary-600" />
                    <span className="text-xs font-medium text-primary-600">
                      Admin Income
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl">
                  <IndianRupee className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-secondary-50 border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-medium">Total Bookings</p>
                  <p className="text-2xl font-bold text-secondary-700">
                    {comprehensiveData?.totalBookings || 0}
                  </p>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {Math.abs(comprehensiveData?.monthlyGrowth || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-secondary-100 rounded-xl">
                  <Package className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-accent-50 border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold text-accent-700">
                    ₹{comprehensiveAnalytics.avgOrderValue.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">8.2%</span>
                  </div>
                </div>
                <div className="p-3 bg-accent-100 rounded-xl">
                  <Calculator className="h-6 w-6 text-accent-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-primary-50 border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-primary-700">
                    {comprehensiveAnalytics.completionRate}%
                  </p>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Excellent</span>
                  </div>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl">
                  <Target className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-secondary-50 border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-medium">Fleet Utilization</p>
                  <p className="text-2xl font-bold text-secondary-700">
                    {comprehensiveAnalytics.utilizationRate}%
                  </p>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Optimal</span>
                  </div>
                </div>
                <div className="p-3 bg-secondary-100 rounded-xl">
                  <Truck className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-accent-50 border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-medium">Platform Users</p>
                  <p className="text-2xl font-bold text-accent-700">
                    {comprehensiveData?.platformUsers || 0}
                  </p>
                  <div className="text-xs text-text-secondary space-y-1">
                    <div>Users: {comprehensiveData?.mainUsers || 0}</div>
                    <div>Agents: {comprehensiveData?.agentUsers || 0}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Growing</span>
                  </div>
                </div>
                <div className="p-3 bg-accent-100 rounded-xl">
                  <Users className="h-6 w-6 text-accent-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-primary-200">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Route Analysis
            </TabsTrigger>
            <TabsTrigger value="markets" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Market Trends
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-700">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Trend (6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={comprehensiveAnalytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                      <XAxis dataKey="month" stroke="hsl(var(--text-secondary))" />
                      <YAxis stroke="hsl(var(--text-secondary))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid hsl(var(--primary) / 0.2)',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [
                          name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                          name === 'revenue' ? 'Revenue' : 'Bookings'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={chartColors.primary} 
                        fill="url(#revenueGradient)"
                        strokeWidth={3}
                      />
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Performance */}
              <Card className="bg-white/70 backdrop-blur-sm border-secondary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary-700">
                    <PieChartIcon className="h-5 w-5" />
                    Service Type Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={comprehensiveAnalytics.serviceStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="revenue"
                        label={({ type, marketShare }) => `${type}: ${marketShare}%`}
                      >
                        {comprehensiveAnalytics.serviceStats.map((entry, index) => {
                          const colors = [chartColors.primary, chartColors.secondary, chartColors.accent];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Bookings vs Revenue */}
            <Card className="bg-white/70 backdrop-blur-sm border-accent-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent-700">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Bookings vs Revenue Correlation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comprehensiveAnalytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                    <XAxis dataKey="month" stroke="hsl(var(--text-secondary))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--text-secondary))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--text-secondary))" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : name === 'bookings' ? 'Bookings' : 'Avg Order Value'
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="bookings" fill={chartColors.secondary} name="bookings" />
                    <Bar yAxisId="right" dataKey="avgOrderValue" fill={chartColors.accent} name="avgOrderValue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Route Analysis Tab */}
          <TabsContent value="routes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Routes by Revenue */}
              <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-700">
                    <Navigation className="h-5 w-5" />
                    Top Revenue Routes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comprehensiveAnalytics.topRoutes.slice(0, 8).map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-transparent rounded-lg border border-primary-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-primary-700 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{route.route}</div>
                          <div className="text-sm text-text-secondary">{route.count} shipments</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary-700">₹{route.revenue.toLocaleString()}</div>
                        <div className="text-sm text-secondary-600">Commission: ₹{Math.ceil(route.revenue * 0.05).toLocaleString()}</div>
                        <div className="text-xs text-text-secondary">{route.percentage}% of total</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* City Performance */}
              <Card className="bg-white/70 backdrop-blur-sm border-secondary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary-700">
                    <Building2 className="h-5 w-5" />
                    Top Performing Cities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comprehensiveAnalytics.topCities.slice(0, 8).map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-secondary-50 to-transparent rounded-lg border border-secondary-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-secondary-100 rounded-full text-secondary-700 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{city.city}</div>
                          <div className="text-sm text-text-secondary">
                            {city.pickups} pickups, {city.deliveries} deliveries
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-secondary-700">₹{city.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-text-secondary">{city.totalBookings} total bookings</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Route Revenue Chart */}
            <Card className="bg-white/70 backdrop-blur-sm border-accent-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent-700">
                  <Map className="h-5 w-5" />
                  Route Revenue Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comprehensiveAnalytics.topRoutes.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                    <XAxis 
                      dataKey="route" 
                      stroke="hsl(var(--text-secondary))" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                    />
                    <YAxis stroke="hsl(var(--text-secondary))" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Bookings'
                      ]}
                    />
                    <Bar dataKey="revenue" fill={chartColors.accent} name="revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Trends Tab */}
          <TabsContent value="markets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Growth Analysis */}
              <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-700">
                    <TrendingUp className="h-5 w-5" />
                    Market Growth Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={comprehensiveAnalytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                      <XAxis dataKey="month" stroke="hsl(var(--text-secondary))" />
                      <YAxis stroke="hsl(var(--text-secondary))" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'avgOrderValue' ? `₹${value.toLocaleString()}` : value,
                          'Average Order Value'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgOrderValue" 
                        stroke={chartColors.primary} 
                        strokeWidth={3}
                        dot={{ fill: chartColors.primary, strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Market Share */}
              <Card className="bg-white/70 backdrop-blur-sm border-secondary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary-700">
                    <Percent className="h-5 w-5" />
                    Service Market Share
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comprehensiveAnalytics.serviceStats.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-primary">{service.type}</span>
                        <span className="text-sm text-text-secondary">{service.marketShare}%</span>
                      </div>
                      <Progress value={service.marketShare} className="h-2" />
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>{service.count} orders</span>
                        <span>₹{service.revenue.toLocaleString()} revenue</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Customer Segments */}
            <Card className="bg-white/70 backdrop-blur-sm border-accent-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent-700">
                  <Users className="h-5 w-5" />
                  Customer Segment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={comprehensiveAnalytics.customerSegments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                    <XAxis dataKey="segment" stroke="hsl(var(--text-secondary))" />
                    <YAxis stroke="hsl(var(--text-secondary))" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Customers'
                      ]}
                    />
                    <Bar dataKey="count" fill={chartColors.accent} name="count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Completion Rate */}
              <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">Delivery Success Rate</h3>
                    <Target className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-primary-700">
                      {comprehensiveAnalytics.completionRate}%
                    </div>
                    <Progress value={comprehensiveAnalytics.completionRate} className="h-3" />
                    <p className="text-sm text-text-secondary">
                      {comprehensiveAnalytics.deliveredBookings} of {comprehensiveAnalytics.totalBookings} orders delivered
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Fleet Utilization */}
              <Card className="bg-white/70 backdrop-blur-sm border-secondary-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">Fleet Utilization</h3>
                    <Truck className="h-5 w-5 text-secondary-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-secondary-700">
                      {comprehensiveAnalytics.utilizationRate}%
                    </div>
                    <Progress value={comprehensiveAnalytics.utilizationRate} className="h-3" />
                    <p className="text-sm text-text-secondary">
                      {comprehensiveAnalytics.activeVehicles + comprehensiveAnalytics.inTransitVehicles} of {comprehensiveAnalytics.totalVehicles} vehicles active
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Rate */}
              <Card className="bg-white/70 backdrop-blur-sm border-accent-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">Cancellation Rate</h3>
                    <TrendingDown className="h-5 w-5 text-accent-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-accent-700">
                      {comprehensiveAnalytics.cancellationRate}%
                    </div>
                    <Progress value={comprehensiveAnalytics.cancellationRate} className="h-3" />
                    <p className="text-sm text-text-secondary">
                      {comprehensiveAnalytics.cancelledBookings} orders cancelled
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Radar Chart */}
            <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-700">
                  <Activity className="h-5 w-5" />
                  Overall Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={[
                    { metric: 'Completion Rate', value: comprehensiveAnalytics.completionRate },
                    { metric: 'Fleet Utilization', value: comprehensiveAnalytics.utilizationRate },
                    { metric: 'Customer Satisfaction', value: Math.max(0, Math.min(100, 90 - comprehensiveAnalytics.cancellationRate)) },
                    { metric: 'On-Time Delivery', value: Math.max(0, Math.min(100, comprehensiveAnalytics.completionRate)) },
                    { metric: 'Cost Efficiency', value: Math.max(0, Math.min(100, comprehensiveAnalytics.utilizationRate)) },
                    { metric: 'Revenue Growth', value: Math.max(0, Math.min(100, comprehensiveAnalytics.revenueGrowth + 50)) }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Segments Distribution */}
              <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-700">
                    <Users className="h-5 w-5" />
                    Customer Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={comprehensiveAnalytics.customerSegments}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="count"
                        label={({ segment, count }) => `${segment}: ${count}`}
                      >
                        {comprehensiveAnalytics.customerSegments.map((entry, index) => {
                          const colors = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.success, chartColors.warning];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Customer Value Analysis */}
              <Card className="bg-white/70 backdrop-blur-sm border-secondary-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary-700">
                    <Star className="h-5 w-5" />
                    Customer Value Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comprehensiveAnalytics.customerSegments.map((segment, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-secondary-50 to-transparent rounded-lg border border-secondary-100">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-text-primary">{segment.segment}</h4>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          {segment.count} customers
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Total Revenue:</span>
                        <span className="font-medium">₹{Math.ceil(segment.revenue).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Avg per Customer:</span>
                        <span className="font-medium">₹{Math.ceil(segment.revenue / segment.count).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Business Insights Cards */}
              <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-8 w-8 text-primary-600" />
                    <h3 className="font-bold text-primary-800">Revenue Growth</h3>
                  </div>
                  <p className="text-sm text-primary-700 leading-relaxed">
                    {comprehensiveAnalytics.revenueGrowth >= 0 ? 'Positive' : 'Negative'} revenue growth of {Math.abs(comprehensiveAnalytics.revenueGrowth).toFixed(1)}% 
                    indicates {comprehensiveAnalytics.revenueGrowth >= 0 ? 'strong business expansion' : 'areas for improvement'}. 
                    Focus on {comprehensiveAnalytics.topRoutes[0]?.route || 'top performing routes'} for maximum impact.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Route className="h-8 w-8 text-secondary-600" />
                    <h3 className="font-bold text-secondary-800">Route Optimization</h3>
                  </div>
                  <p className="text-sm text-secondary-700 leading-relaxed">
                    Top route "{comprehensiveAnalytics.topRoutes[0]?.route}" generates 
                    {comprehensiveAnalytics.topRoutes[0]?.percentage || 0}% of total revenue. 
                    Consider expanding capacity on high-performing routes for increased profitability.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-accent-600" />
                    <h3 className="font-bold text-accent-800">Performance Excellence</h3>
                  </div>
                  <p className="text-sm text-accent-700 leading-relaxed">
                    {comprehensiveAnalytics.completionRate}% completion rate demonstrates excellent operational efficiency. 
                    Maintain quality standards while scaling operations for sustainable growth.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                    <h3 className="font-bold text-green-800">Customer Base</h3>
                  </div>
                  <p className="text-sm text-green-700 leading-relaxed">
                    Strong customer distribution across segments. 
                    Premium customers contribute significantly to revenue. 
                    Focus on customer retention and upselling strategies.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="h-8 w-8 text-blue-600" />
                    <h3 className="font-bold text-blue-800">Fleet Management</h3>
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    {comprehensiveAnalytics.utilizationRate}% fleet utilization indicates optimal resource management. 
                    Monitor maintenance schedules to prevent disruptions and maintain efficiency.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-8 w-8 text-purple-600" />
                    <h3 className="font-bold text-purple-800">Market Opportunities</h3>
                  </div>
                  <p className="text-sm text-purple-700 leading-relaxed">
                    Market analysis reveals opportunities in {comprehensiveAnalytics.topCities[0]?.city || 'major cities'}. 
                    Consider strategic expansion to untapped markets for business growth.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card className="bg-white/70 backdrop-blur-sm border-primary-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-700">
                  <FileText className="h-5 w-5" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">🎯 Revenue Optimization</h4>
                    <p className="text-sm text-green-700">
                      Focus on top-performing routes and increase capacity during peak demand periods to maximize revenue potential.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">🚛 Fleet Expansion</h4>
                    <p className="text-sm text-blue-700">
                      Consider adding vehicles to high-demand routes to capture additional market share and reduce wait times.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">👥 Customer Retention</h4>
                    <p className="text-sm text-purple-700">
                      Implement loyalty programs for premium customers and develop strategies to upgrade bronze and silver customers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminAnalytics;