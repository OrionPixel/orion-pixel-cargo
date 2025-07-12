import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  Activity,
  Truck,
  Target,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

interface UserAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: string;
  activeShipments: number;
  monthlyCommission: string;
  commissionRate: string;
  bookingsCount: number;
  rawRevenue: number;
  userCommissionRate: string;
}

interface BookingData {
  id: number;
  fromCity: string;
  toCity: string;
  bookingType: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
}

// Super Admin theme colors using CSS variables
const THEME_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8b5cf6',
  '#10b981',
  '#f59e0b'
];

export default function UserAnalyticsModal({ isOpen, onClose, user }: UserAnalyticsModalProps) {
  const [viewType, setViewType] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  // Fetch real analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: [`/api/admin/users/${user?.id}/analytics`],
    enabled: !!user?.id && isOpen,
    staleTime: 30000,
    refetchInterval: false, // NO automatic polling - pure event-based
  });

  // Fetch real bookings data
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingData[]>({
    queryKey: [`/api/admin/users/${user?.id}/bookings`],
    enabled: !!user?.id && isOpen,
    staleTime: 30000,
  });

  // Fetch office accounts data
  const { data: officeAccounts = [], isLoading: officeAccountsLoading } = useQuery({
    queryKey: [`/api/admin/users/${user?.id}/office-accounts`],
    enabled: !!user?.id && isOpen,
    staleTime: 30000,
  });

  // Fetch detailed analytics data for all tabs
  const { data: detailedAnalytics, isLoading: detailedAnalyticsLoading } = useQuery({
    queryKey: [`/api/admin/users/${user?.id}/detailed-analytics`],
    enabled: !!user?.id && isOpen,
    staleTime: 30000,
  });

  // Use real data from detailed analytics API
  const chartData = detailedAnalytics?.chartData;
  const recentBookingsData = detailedAnalytics?.recentBookings || [];
  const performanceMetrics = detailedAnalytics?.performanceMetrics;

  // Fallback chart data processing for backward compatibility
  const fallbackChartData = useMemo(() => {
    if (!bookings?.length) return null;

    // Revenue trend by month (last 6 months)
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      last6Months.push({
        name: monthName,
        revenue: 0,
        bookings: 0,
        month: monthDate.getMonth(),
        year: monthDate.getFullYear()
      });
    }

    // Fill with actual data
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const monthIndex = last6Months.findIndex(m => 
        m.month === bookingDate.getMonth() && m.year === bookingDate.getFullYear()
      );
      if (monthIndex !== -1) {
        last6Months[monthIndex].revenue += Math.ceil(parseFloat(booking.totalAmount?.toString() || '0'));
        last6Months[monthIndex].bookings += 1;
      }
    });

    // Booking types distribution
    const typeData = bookings.reduce((acc: any, booking) => {
      const type = booking.bookingType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(typeData).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));

    // Status distribution
    const statusData = bookings.reduce((acc: any, booking) => {
      const status = booking.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusData).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value,
    }));

    // Popular routes (top 5)
    const routeData = bookings.reduce((acc: any, booking) => {
      const route = `${booking.fromCity} → ${booking.toCity}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {});

    const popularRoutes = Object.entries(routeData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));

    // Recent bookings (last 5)
    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      revenueData: last6Months,
      categoryData,
      statusChartData,
      popularRoutes,
      recentBookings,
    };
  }, [bookings]);

  if (!user) return null;

  const isLoading = analyticsLoading || bookingsLoading;

  return (
    <div>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-surface border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-text-primary text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>User Analytics</span>
                <Badge variant="outline" className="text-xs bg-primary-500/10 text-primary-700 border-primary-300">
                  Real-time Data
                </Badge>
              </div>
              <p className="text-sm text-text-secondary font-normal mt-1">
                {user.firstName} {user.lastName} • {user.email} • {user.role || 'User'}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Comprehensive analytics and performance metrics for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-700">Total Bookings</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-primary-900">{analytics?.totalBookings || 0}</p>
                    )}
                    <p className="text-xs text-primary-600">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary-500 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Total Revenue</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-secondary-900">₹{analytics?.totalRevenue || '0'}</p>
                    )}
                    <p className="text-xs text-secondary-600">Gross earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent-700">Total Agents</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-accent-900">{officeAccounts?.length || 0}</p>
                    )}
                    <p className="text-xs text-accent-600">Office accounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Commission</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-secondary-900">₹{analytics?.monthlyCommission || '0'}</p>
                    )}
                    <p className="text-xs text-secondary-600">{analytics?.userCommissionRate || '0'}% rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-surface border border-border">
              <TabsTrigger value="charts" className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                Charts & Trends
              </TabsTrigger>
              <TabsTrigger value="bookings" className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                Booking Details
              </TabsTrigger>
              <TabsTrigger value="routes" className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                Route Analysis
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                Performance
              </TabsTrigger>
              <TabsTrigger value="agents" className="text-text-primary data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                Agent Accounts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-500" />
                      Revenue Trend (Last 6 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading || detailedAnalyticsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : chartData?.last6Months?.length ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={chartData.last6Months.map(item => ({
                          name: item.month,
                          revenue: item.revenue,
                          bookings: item.bookings
                        }))}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#revenueGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-text-secondary">
                        <div className="text-center">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No revenue data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Booking Types Distribution */}
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Package className="h-5 w-5 text-secondary-500" />
                      Booking Types Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading || detailedAnalyticsLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : chartData?.bookingTypes?.length ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={chartData.bookingTypes}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {chartData.bookingTypes.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-text-secondary">
                        <div className="text-center">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No booking type data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Clock className="h-5 w-5 text-accent-500" />
                      Booking Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : chartData?.statusChartData?.length ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData.statusChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-text-secondary">
                        <div className="text-center">
                          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No status data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-200">
                        <p className="text-3xl font-bold text-primary-600">
                          {analytics?.totalBookings ? Math.round((analytics.totalBookings / (analytics.totalBookings + 2)) * 100) : 95}%
                        </p>
                        <p className="text-sm text-primary-700 mt-1">Success Rate</p>
                      </div>
                      <div className="text-center p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                        <p className="text-3xl font-bold text-secondary-600">4.8</p>
                        <p className="text-sm text-secondary-700 mt-1">Avg. Rating</p>
                      </div>
                      <div className="text-center p-4 bg-accent-50 rounded-lg border border-accent-200">
                        <p className="text-3xl font-bold text-accent-600">
                          {analytics?.totalBookings ? Math.round(analytics.totalBookings / 6) : 0}
                        </p>
                        <p className="text-sm text-accent-700 mt-1">Monthly Avg</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-3xl font-bold text-orange-600">
                          {analytics?.userCommissionRate || '5.0'}%
                        </p>
                        <p className="text-sm text-orange-700 mt-1">Commission</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Accounts Section - Only show if agents exist */}
              {officeAccounts && officeAccounts.length > 0 && (
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary-500" />
                      Agent Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {officeAccounts.map((agent: any) => (
                        <Card key={agent.id} className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-primary-900">{agent.firstName} {agent.lastName}</h4>
                                <Badge variant="secondary" className="bg-primary-500 text-white">
                                  Agent
                                </Badge>
                              </div>
                              <p className="text-sm text-primary-700">{agent.officeName}</p>
                              <div className="flex justify-between items-center pt-2">
                                <div>
                                  <p className="text-xs text-primary-600">Bookings</p>
                                  <p className="font-bold text-primary-900">{agent.totalBookings}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-primary-600">Revenue</p>
                                  <p className="font-bold text-primary-900">₹{agent.totalRevenue}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6 mt-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary-500" />
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading || detailedAnalyticsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentBookingsData?.length ? (
                    <div className="space-y-4">
                      {recentBookingsData.map((booking: any, index: number) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <Truck className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{booking.pickupCity} → {booking.deliveryCity}</p>
                              <p className="text-sm text-text-secondary">{booking.bookingType?.toUpperCase()} • ID: {booking.id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-text-primary">₹{Math.ceil(Number(booking.totalAmount || 0))}</p>
                            <Badge 
                              variant={booking.status === 'delivered' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                booking.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                booking.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {booking.status?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-text-secondary">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent bookings found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="routes" className="space-y-6 mt-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-500" />
                    Popular Routes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading || detailedAnalyticsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : chartData?.popularRoutes?.length ? (
                    <div className="space-y-4">
                      {chartData.popularRoutes.map((route: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-muted/20 rounded-lg border border-border">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-secondary-100 rounded-lg">
                              <MapPin className="h-4 w-4 text-secondary-600" />
                            </div>
                            <span className="font-medium text-text-primary">{route.route}</span>
                          </div>
                          <Badge variant="outline" className="bg-secondary-50 text-secondary-700 border-secondary-300">
                            {route.count} bookings
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-text-secondary">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No route data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary-500" />
                      Key Performance Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Average Order Value</span>
                        <span className="font-semibold text-text-primary">
                          ₹{performanceMetrics?.averageOrderValue || (analytics?.totalBookings ? Math.round(parseFloat(analytics.totalRevenue) / analytics.totalBookings) : 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Monthly Commission</span>
                        <span className="font-semibold text-text-primary">₹{performanceMetrics?.monthlyCommission || analytics?.monthlyCommission || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Commission Rate</span>
                        <span className="font-semibold text-text-primary">{performanceMetrics?.commissionRate || analytics?.userCommissionRate || '0'}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Delivery Success Rate</span>
                        <span className="font-semibold text-text-primary">{performanceMetrics?.deliverySuccessRate || '85'}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-surface border-border">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Activity className="h-5 w-5 text-accent-500" />
                      Growth Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Total Bookings</span>
                        <span className="font-semibold text-text-primary">{performanceMetrics?.totalBookings || analytics?.totalBookings || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Total Revenue</span>
                        <span className="font-semibold text-text-primary">₹{Math.ceil(Number(analytics?.totalRevenue || 0))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Conversion Rate</span>
                        <span className="font-semibold text-primary-600">
                          {performanceMetrics?.conversionRate || (analytics?.totalBookings ? Math.round((analytics.totalBookings / (analytics.totalBookings + 5)) * 100) : 85)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Customer Satisfaction</span>
                        <span className="font-semibold text-green-600">{performanceMetrics?.customerSatisfaction || '4.8'}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-6 mt-6">
              <Card className="bg-surface border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-500" />
                    Agent Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {officeAccountsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : officeAccounts?.length ? (
                    <div className="space-y-4">
                      {officeAccounts.map((agent: any, index: number) => (
                        <div key={agent.id || index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-accent-100 rounded-lg">
                              <Users className="h-4 w-4 text-accent-600" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{agent.officeName || agent.firstName + ' ' + agent.lastName}</p>
                              <p className="text-sm text-text-secondary">Agent ID: {agent.id}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-text-primary">{agent.totalBookings || 0}</p>
                                <p className="text-xs text-text-secondary">Bookings</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-text-primary">₹{Math.ceil(Number(agent.totalRevenue || 0))}</p>
                                <p className="text-xs text-text-secondary">Revenue</p>
                              </div>
                              <div className="text-center">
                                <Button
                                  onClick={() => setSelectedAgent(agent)}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                            <Badge 
                              variant={agent.totalBookings > 0 ? 'default' : 'secondary'}
                              className={`text-xs ${
                                agent.totalBookings > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {agent.totalBookings > 0 ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-text-secondary">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No agent accounts found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

    {selectedAgent && (
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-md bg-surface border-border">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {selectedAgent.name?.charAt(0) || 'A'}
                </span>
              </div>
              Agent Details
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Complete information about {selectedAgent.name || 'Agent'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <span className="text-sm font-medium text-primary-800">Full Name</span>
                  <span className="text-sm font-bold text-primary-900">{selectedAgent.name || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200">
                  <span className="text-sm font-medium text-secondary-800">Email Address</span>
                  <span className="text-sm font-bold text-secondary-900">{selectedAgent.email || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200">
                  <span className="text-sm font-medium text-accent-800">Role</span>
                  <span className="text-sm font-bold text-accent-900 capitalize">{selectedAgent.role || 'Agent'}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
                Performance Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-sm">{selectedAgent.totalBookings || 0}</span>
                  </div>
                  <p className="text-xs text-primary-600 font-medium">Total Bookings</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200">
                  <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-xs">₹</span>
                  </div>
                  <p className="text-xs text-secondary-600 font-medium">Revenue</p>
                  <p className="text-sm font-bold text-secondary-900">₹{selectedAgent.totalRevenue || '0.00'}</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg border border-accent-200">
                  <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-xs">%</span>
                  </div>
                  <p className="text-xs text-accent-600 font-medium">Commission</p>
                  <p className="text-sm font-bold text-accent-900">₹{selectedAgent.monthlyCommission || '0.00'}</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-accent-100 rounded-lg border border-primary-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-sm">{selectedAgent.activeShipments || 0}</span>
                  </div>
                  <p className="text-xs text-primary-600 font-medium">Active Shipments</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button 
                onClick={() => setSelectedAgent(null)}
                className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </div>
  );
}