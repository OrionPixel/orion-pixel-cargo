import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Navigation,
  Bell,
  RefreshCw,
  Eye,
  Signal,
  Filter,
  SortAsc,
  Download,
  Activity,
  Satellite,
  Phone,
  Mail,
  CalendarDays
} from "lucide-react";
import { useState, useMemo } from "react";
import type { Booking, TrackingEvent } from "@shared/schema";
import { LiveTrackingMap } from "@/components/tracking/LiveTrackingMap";

interface LiveTracking {
  bookingId: number;
  isActive: boolean;
  currentLocation?: string;
  lastUpdate?: string;
  [key: string]: any;
}

export default function Tracking() {
  const { user } = useAuth();
  useUserTheme(); // Apply user theme
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  const { data: bookings, isLoading } = useQuery<Booking[]>(
    ["/api/bookings"],
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
      enabled: !!user,
      staleTime: 30000,
    }
  );

  const { data: notifications } = useQuery(
    ["/api/notifications"],
    async () => {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    {
      enabled: !!user,
      staleTime: 30000,
    }
  );

  const { data: allLiveTracking = [] } = useQuery<LiveTracking[]>(
    ["/api/live-tracking/all"],
    async () => {
      const response = await fetch('/api/live-tracking/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch live tracking');
      }
      return response.json();
    },
    {
      enabled: !!user,
      staleTime: 15000, // Fresh for 15 seconds
    }
  );

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    let filtered = bookings;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.pickupCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.deliveryCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicleId?.toString().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Apply date range filter
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(booking => {
        if (!booking.createdAt) return false;
        const bookingDate = new Date(booking.createdAt);
        const fromDate = dateFromFilter ? new Date(dateFromFilter) : null;
        const toDate = dateToFilter ? new Date(dateToFilter) : null;
        
        if (fromDate && toDate) {
          return bookingDate >= fromDate && bookingDate <= toDate;
        } else if (fromDate) {
          return bookingDate >= fromDate;
        } else if (toDate) {
          return bookingDate <= toDate;
        }
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "pickup":
          return new Date(a.pickupDateTime || 0).getTime() - new Date(b.pickupDateTime || 0).getTime();
        case "delivery":
          return new Date(a.deliveryDateTime || 0).getTime() - new Date(b.deliveryDateTime || 0).getTime();
        case "status":
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [bookings, searchTerm, statusFilter, sortBy, dateFromFilter, dateToFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-secondary" />;
      case 'picked':
        return <Package className="h-5 w-5 text-accent" />;
      case 'booked':
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'picked':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'booked':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        const localDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        return localDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Live Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor all shipments with real-time GPS tracking and delivery updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {filteredBookings.filter(b => b.status === 'in_transit').length} Active
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card style={{ borderTop: '2px solid hsl(var(--primary) / 0.3)', borderRight: '2px solid hsl(var(--primary) / 0.3)', borderBottom: '2px solid hsl(var(--primary) / 0.3)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                <p className="text-2xl font-bold text-foreground">{bookings?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card style={{ borderTop: '2px solid hsl(var(--primary) / 0.3)', borderRight: '2px solid hsl(var(--primary) / 0.3)', borderBottom: '2px solid hsl(var(--primary) / 0.3)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold text-secondary">
                  {bookings?.filter(b => b.status === 'in_transit').length || 0}
                </p>
              </div>
              <Truck className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card style={{ borderTop: '2px solid hsl(var(--primary) / 0.3)', borderRight: '2px solid hsl(var(--primary) / 0.3)', borderBottom: '2px solid hsl(var(--primary) / 0.3)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-accent">
                  {bookings?.filter(b => b.status === 'delivered').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card style={{ borderTop: '2px solid hsl(var(--primary) / 0.3)', borderRight: '2px solid hsl(var(--primary) / 0.3)', borderBottom: '2px solid hsl(var(--primary) / 0.3)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">GPS Enabled</p>
                <p className="text-2xl font-bold text-primary">
                  {bookings?.filter(b => b.vehicleId).length || 0}
                </p>
              </div>
              <Satellite className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Count Display */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Package className="h-4 w-4 mr-2" />
        Showing <span className="font-medium text-foreground mx-1">{filteredBookings?.length || 0}</span> 
        of <span className="font-medium text-foreground mx-1">{bookings?.length || 0}</span> bookings
        {(searchTerm || statusFilter !== "all" || dateFromFilter || dateToFilter) && (
          <span className="ml-2 text-primary">(filtered)</span>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search by booking ID, tracking number, customer, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="picked">Picked Up</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="pickup">Pickup Date</SelectItem>
            <SelectItem value="delivery">Delivery Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Date Range Filter */}
        <div className="flex gap-2">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="date"
              placeholder="From Date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              onFocus={(e) => e.currentTarget.focus()}
              className="pl-12 w-48 cursor-pointer hover:bg-muted/30 transition-all duration-200 border-2 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{ colorScheme: 'light' }}
            />
          </div>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="date"
              placeholder="To Date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              onFocus={(e) => e.currentTarget.focus()}
              className="pl-12 w-48 cursor-pointer hover:bg-muted/30 transition-all duration-200 border-2 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{ colorScheme: 'light' }}
            />
          </div>
          {(dateFromFilter || dateToFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFromFilter("");
                setDateToFilter("");
              }}
              className="px-3"
            >
              Clear
            </Button>
          )}
        </div>
      </div>


      
      {/* Live Tracking Map */}
      {allLiveTracking && allLiveTracking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Live GPS Tracking Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 rounded-lg bg-slate-100 flex items-center justify-center">
              <LiveTrackingMap bookingId={0} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Cards with Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            List View ({filteredBookings.length})
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4 mt-6">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <EnhancedTrackingCard 
                key={booking.id} 
                booking={booking} 
                onViewDetails={setSelectedBooking}
              />
            ))
          ) : !isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No shipments found</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter !== "all" ? 'Try adjusting your filters' : 'Start by creating your first booking'}
              </p>
            </div>
          ) : null}
        </TabsContent>
        
        <TabsContent value="map" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="h-96 rounded-lg bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">Interactive Tracking Map</h3>
                  <p className="text-slate-500">View all active shipments on an interactive map</p>
                  <Button className="mt-4" variant="outline">
                    <Satellite className="h-4 w-4 mr-2" />
                    Enable GPS Tracking
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Tracking Modal */}
      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detailed Tracking - {selectedBooking.bookingId}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <DetailedTrackingView booking={selectedBooking} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Enhanced Tracking Card Component
function EnhancedTrackingCard({ booking, onViewDetails }: { booking: Booking; onViewDetails: (booking: Booking) => void }) {
  const { data: trackingEvents } = useQuery<TrackingEvent[]>({
    queryKey: ["/api/tracking", booking.id],
    enabled: !!booking.id,
  });

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'booked': return 25;
      case 'picked': return 50;
      case 'in_transit': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200" style={{ borderTop: '2px solid hsl(var(--primary) / 0.3)', borderRight: '2px solid hsl(var(--primary) / 0.3)', borderBottom: '2px solid hsl(var(--primary) / 0.3)', borderLeft: '4px solid hsl(var(--primary))' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(booking.status || '')}
            <div>
              <CardTitle className="text-lg">{booking.bookingId}</CardTitle>
              <p className="text-sm text-slate-600 font-mono">
                {booking.trackingNumber || 'TRK-' + booking.bookingId.slice(-8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {booking.vehicleId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {booking.vehicleId ? `Vehicle #${booking.vehicleId}` : 'Not assigned'}
              </Badge>
            )}
            {booking.vehicleId && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Satellite className="h-3 w-3" />
                GPS
              </Badge>
            )}
            <Badge className={`${getStatusColor(booking.status || '')} border`}>
              {booking.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-medium">{getStatusProgress(booking.status || '')}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStatusProgress(booking.status || '')}%` }}
            ></div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="font-medium">{booking.pickupCity}</span>
          </div>
          <div className="flex-1 mx-4">
            <div className="border-t border-dashed border-slate-300 relative">
              <Truck className="h-4 w-4 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="font-medium">{booking.deliveryCity}</span>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Customer:</span>
            <p className="font-medium truncate">{booking.senderName || booking.receiverName || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-500">Vehicle:</span>
            <p className="font-medium">
              {booking.vehicleId ? `Vehicle #${booking.vehicleId}` : (booking.bookingType || 'Not assigned')}
            </p>
            {booking.bookingType && (
              <p className="text-xs text-slate-400">{booking.bookingType}</p>
            )}
          </div>
          <div>
            <span className="text-slate-500">Weight:</span>
            <p className="font-medium">{booking.weight ? `${booking.weight} kg` : 'Not specified'}</p>
          </div>
          <div>
            <span className="text-slate-500">Value:</span>
            <p className="font-medium text-black">₹{booking.totalAmount ? Math.ceil(parseFloat(booking.totalAmount)).toLocaleString() : '0'}</p>
          </div>
        </div>

        {/* Driver Contact & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            {booking.receiverPhone && (
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                {booking.receiverPhone}
              </Button>
            )}
            {(booking.senderPhone || booking.receiverPhone) && (
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Notify Customer
              </Button>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewDetails(booking)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Detailed Tracking View Component
function DetailedTrackingView({ booking }: { booking: Booking }) {
  const { data: trackingEvents } = useQuery<TrackingEvent[]>({
    queryKey: ["/api/tracking", booking.id],
    enabled: !!booking.id,
  });

  const formatDetailDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        const localDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        return localDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'N/A';
    }
  };

  const sortedEvents = (trackingEvents || []).sort((a: any, b: any) => {
    if (!a.status || !b.status) return 0;
    return (a.status || '').localeCompare(b.status || '');
  });

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Booking ID:</span>
              <span className="font-mono font-medium">{booking.bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tracking Number:</span>
              <span className="font-mono font-medium">{booking.trackingNumber || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Sender:</span>
              <span className="font-medium">{booking.senderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Receiver:</span>
              <span className="font-medium">{booking.receiverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Weight:</span>
              <span className="font-medium">{booking.weight ? `${booking.weight} kg` : 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Value:</span>
              <span className="font-medium text-accent">₹{booking.totalAmount ? Math.ceil(parseFloat(booking.totalAmount)).toLocaleString() : '0'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle & Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Vehicle:</span>
              <span className="font-medium">{booking.vehicleId ? `Vehicle #${booking.vehicleId}` : 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Vehicle Type:</span>
              <span className="font-medium">{booking.bookingType || 'Standard'}</span>
            </div>
            {booking.receiverName && (
              <div className="flex justify-between">
                <span className="text-slate-600">Driver:</span>
                <span className="font-medium">{booking.receiverName}</span>
              </div>
            )}
            {booking.receiverPhone && (
              <div className="flex justify-between">
                <span className="text-slate-600">Driver Phone:</span>
                <span className="font-medium">{booking.receiverPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Pickup Date:</span>
              <span className="font-medium">{formatDetailDate(booking.pickupDateTime?.toString() || '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Delivery Date:</span>
              <span className="font-medium">{booking.deliveryDateTime ? formatDetailDate(booking.deliveryDateTime.toString()) : 'TBD'}</span>
            </div>
            {booking.vehicleId && (
              <div className="flex justify-between">
                <span className="text-slate-600">GPS Status:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Satellite className="h-3 w-3" />
                  Enabled
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tracking Timeline */}
      {trackingEvents && trackingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingTimeline events={sortedEvents} />
          </CardContent>
        </Card>
      )}

      {/* Live GPS Tracking */}
      {booking.vehicleId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Satellite className="h-5 w-5 text-primary" />
              Live GPS Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">GPS tracking active</p>
                <p className="text-xs text-slate-500">Vehicle ID: {booking.vehicleId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Tracking Timeline Component
function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        const localDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        return localDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-4 relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-300"></div>
      
      {events
        .sort((a: any, b: any) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        })
        .map((event, index) => {
          const isLatest = index === 0;
          const statusColors = {
            'booked': 'bg-primary border-primary/20',
            'picked': 'bg-secondary border-secondary/20', 
            'in_transit': 'bg-accent border-accent/20',
            'delivered': 'bg-green-500 border-green-200'
          };
          const bgColor = statusColors[event.status as keyof typeof statusColors] || 'bg-slate-500 border-slate-200';
          
          return (
            <div key={event.id} className="relative flex items-start space-x-4">
              <div className={`w-3 h-3 rounded-full ${bgColor} border-2 border-white shadow-sm mt-1.5 z-10`}></div>
              
              <div className="flex-1 min-w-0">
                <div className={`p-3 rounded-lg border-l-4 ${
                  isLatest ? 'bg-white border-l-blue-500 shadow-sm' : 'bg-slate-50 border-l-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-sm capitalize ${
                      isLatest ? 'text-primary' : 'text-slate-700'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {event.timestamp ? formatDate(event.timestamp.toString()) : 'Unknown time'}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center space-x-1 mb-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span className="text-sm text-slate-600 font-medium">
                        {event.location}
                      </span>
                    </div>
                  )}
                  
                  {event.notes && (
                    <p className="text-sm text-slate-600 mt-2 italic">
                      "{event.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'in_transit':
      return <Truck className="h-5 w-5 text-primary" />;
    case 'picked':
      return <Package className="h-5 w-5 text-secondary" />;
    case 'booked':
      return <Calendar className="h-5 w-5 text-slate-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-red-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_transit':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'picked':
      return 'bg-secondary/10 text-secondary border-secondary/20';
    case 'booked':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-red-100 text-red-800 border-red-200';
  }
}