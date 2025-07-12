import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Target, 
  Users,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  MapPin,
  Star
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface AgentAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: any;
}

interface AnalyticsData {
  bookingsByDate?: Array<{
    date: string;
    bookings: number;
    revenue: number;
    commission: number;
  }>;
  serviceDistribution?: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  topRoutes?: Array<{
    from: string;
    to: string;
    bookings: number;
    revenue: number;
  }>;
  [key: string]: any;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AgentAnalyticsModal({ isOpen, onClose, agent }: AgentAnalyticsModalProps) {
  const [dateRange, setDateRange] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate date range for API call
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'daily':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'weekly':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case 'monthly':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch real analytics data
  const { data: analyticsData, isLoading, error } = useQuery<AnalyticsData>(
    ["/api/agents", agent?.id, "analytics", dateRange],
    async () => {
      if (!agent?.id) return null;
      const response = await fetch(`/api/agents/${agent.id}/analytics?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication error for agent analytics');
          return null;
        }
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      console.log('Agent analytics data:', data);
      return data;
    },
    {
      enabled: !!agent?.id && isOpen,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    }
  );

  // Process analytics data for charts
  const processedData = analyticsData ? {
    // Group daily data by period for charts
    chartData: analyticsData.bookingsByDate && analyticsData.bookingsByDate.length > 0 
      ? analyticsData.bookingsByDate.map(item => ({
          date: format(new Date(item.date), 'MMM dd'),
          bookings: item.bookings,
          revenue: item.revenue,
          commission: item.commission,
        }))
      : [{ date: 'No Data', bookings: 0, revenue: 0, commission: 0 }],
    
    // Service distribution with real data
    serviceDistribution: analyticsData.serviceDistribution && analyticsData.serviceDistribution.length > 0
      ? analyticsData.serviceDistribution.map((service, index) => ({
          name: service.type === 'FTL' ? 'Full Truck Load' : 
                service.type === 'LTL' ? 'Less Than Truck Load' : 
                service.type === 'part_load' ? 'Part Load' : 
                service.type.charAt(0).toUpperCase() + service.type.slice(1),
          value: service.count,
          count: service.count,
          revenue: service.revenue,
          fill: COLORS[index % COLORS.length]
        }))
      : [{ name: 'No Services', value: 0, count: 0, revenue: 0, fill: COLORS[0] }],

    // Route performance with real data
    routePerformance: analyticsData.topRoutes && analyticsData.topRoutes.length > 0
      ? analyticsData.topRoutes.map(route => ({
          route: `${route.from} → ${route.to}`,
          bookings: route.bookings,
          revenue: route.revenue,
          efficiency: Math.min(100, Math.round((route.revenue / Math.max(route.bookings, 1)) / 10))
        }))
      : [{ route: 'No Routes', bookings: 0, revenue: 0, efficiency: 0 }]
  } : null;

  const exportReport = () => {
    // In real implementation, this would generate and download a PDF/Excel report
    console.log('Exporting agent analytics report...');
  };

  if (!agent) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Agent Analytics</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading analytics data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analyticsData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Agent Analytics</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No analytics data available for this agent</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Agent Analytics - {agent.firstName} {agent.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily View</SelectItem>
                  <SelectItem value="weekly">Weekly View</SelectItem>
                  <SelectItem value="monthly">Monthly View</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(customDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => date && setCustomDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={exportReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-blue-600">{analyticsData?.totalBookings || 0}</p>
                        <p className="text-xs text-gray-500">Last 30 days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">₹{Math.ceil(Number(analyticsData?.totalRevenue || 0)).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Gross earnings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Commission Earned</p>
                        <p className="text-2xl font-bold text-orange-600">₹{Math.ceil(Number(analyticsData?.totalCommission || 0))}</p>
                        <p className="text-xs text-gray-500">Based on commission rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Bookings/Day</p>
                        <p className="text-2xl font-bold text-purple-600">{(analyticsData?.avgBookingsPerDay || 0).toFixed(1)}</p>
                        <p className="text-xs text-gray-500">Daily average</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Bookings Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={processedData?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="bookings" fill="#3B82F6" name="Bookings" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Type Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={processedData?.serviceDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(processedData?.serviceDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {(processedData?.serviceDistribution || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.fill }}></div>
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.value}% ({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commission Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={processedData?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="commission" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">87%</div>
                      <p className="text-sm text-gray-600">Overall Performance</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Booking Success Rate</span>
                          <span className="font-medium">92%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Customer Satisfaction</span>
                          <span className="font-medium">88%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>On-time Delivery</span>
                          <span className="font-medium">85%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Quality Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Customer Rating</span>
                          <span className="font-medium">4.7/5</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Response Time</span>
                          <span className="font-medium">2.3 min avg</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Resolution Rate</span>
                          <span className="font-medium">96%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Time Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Peak Hours</span>
                        <span className="text-sm font-medium">10 AM - 2 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Most Active Day</span>
                        <span className="text-sm font-medium">Tuesday</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Call Duration</span>
                        <span className="text-sm font-medium">8.5 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Follow-up Rate</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" />
                      <Bar dataKey="revenue" fill="#10B981" name="Revenue (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="routes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Route Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(processedData?.routePerformance || []).map((route, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{route.route}</h4>
                          <p className="text-sm text-gray-600">{route.bookings} bookings this month</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-medium">₹{Math.ceil(route.revenue / 1000)}K</p>
                            <p className="text-sm text-gray-600">Revenue</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${route.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-12">{route.efficiency}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Route Revenue Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData?.routePerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Acquisition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={processedData?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} name="Daily Bookings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Customers</span>
                        <Badge variant="secondary">1,247</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Repeat Customers</span>
                        <Badge variant="secondary">68%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Customer Retention</span>
                        <Badge variant="secondary">84%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Order Value</span>
                        <Badge variant="secondary">₹12,450</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Referral Rate</span>
                        <Badge variant="secondary">23%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(processedData?.routePerformance?.length || 0) > 0 ? (
                      (processedData?.routePerformance || []).slice(0, 5).map((route, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{route.route} Route</h4>
                            <p className="text-sm text-gray-600">{route.bookings} bookings</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{Math.ceil(route.revenue / 100000)}L</p>
                            <p className="text-sm text-green-600">{route.efficiency}% efficiency</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No customer data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}