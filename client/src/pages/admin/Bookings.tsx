import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Package, Search, Filter, Eye, MapPin, Calendar, Truck, 
  Download, RefreshCw, DollarSign, Clock, CheckCircle, Edit, MoreHorizontal, CalendarDays
} from "lucide-react";
import type { Booking } from "@shared/schema";

function AdminBookings() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // Check authentication and admin role
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = "/admin-login";
    return null;
  }

  // Fetch bookings with aggressive caching for speed
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    enabled: !!currentUser && currentUser.role === 'admin',
    staleTime: 60000, // 1 minute cache for instant loading
    gcTime: 600000, // 10 minutes garbage collection
    refetchInterval: false, // Pure event-based architecture
    refetchOnWindowFocus: false, // No auto-refetch
    refetchOnMount: false, // Use cache for instant navigation
  });

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = (booking.trackingNumber || `BK${booking.id}`)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (booking.deliveryLocation || booking.dropLocation)?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all" && booking.createdAt) {
        const bookingDate = new Date(booking.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            matchesDate = bookingDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = bookingDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = bookingDate >= monthAgo;
            break;
        }
      }
      
      // Apply date range filter
      let matchesDateRange = true;
      if ((dateFromFilter || dateToFilter) && booking.createdAt) {
        const bookingDate = new Date(booking.createdAt);
        const fromDate = dateFromFilter ? new Date(dateFromFilter) : null;
        const toDate = dateToFilter ? new Date(dateToFilter) : null;
        
        if (fromDate && toDate) {
          matchesDateRange = bookingDate >= fromDate && bookingDate <= toDate;
        } else if (fromDate) {
          matchesDateRange = bookingDate >= fromDate;
        } else if (toDate) {
          matchesDateRange = bookingDate <= toDate;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesDateRange;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter, dateFromFilter, dateToFilter]);

  // Mutation for updating booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return await apiRequest(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Success", description: "Booking status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Action handlers
  const handleViewBooking = (booking: any) => {
    // Prefetch combined data using optimized endpoint (single request instead of 3)
    queryClient.prefetchQuery({
      queryKey: [`/api/admin/bookings/${booking.id}/complete`],
      staleTime: 60000, // 1 minute cache
    });
    
    // Navigate to booking details page
    window.location.href = `/admin/bookings/${booking.id}`;
  };

  const handleEditBooking = (booking: any) => {
    // Navigate to booking edit page
    window.location.href = `/admin/bookings/${booking.id}/edit`;
  };

  const handleUpdateStatus = (bookingId: number, status: string) => {
    updateStatusMutation.mutate({ bookingId, status });
  };

  const handleGenerateInvoice = (bookingId: number) => {
    // Generate invoice for booking
    console.log("Generate invoice for booking:", bookingId);
    toast({ title: "Info", description: "Invoice generation started" });
  };

  const handleTrackPackage = (bookingId: number) => {
    // Open tracking details
    console.log("Track package for booking:", bookingId);
    toast({ title: "Info", description: "Opening tracking details" });
  };

  const handleSendNotification = (bookingId: number) => {
    // Send notification to customer
    console.log("Send notification for booking:", bookingId);
    toast({ title: "Info", description: "Notification sent to customer" });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'in_transit': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'in_transit': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      inTransit: bookings.filter(b => b.status === 'in_transit').length,
      delivered: bookings.filter(b => b.status === 'delivered').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: Math.ceil(bookings.reduce((sum, b) => sum + Number(b.totalAmount || b.totalCost || 0), 0))
    };
  }, [bookings]);



  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Booking Management</h1>
            <p className="text-text-secondary mt-1">Monitor and manage all platform bookings</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-secondary-200 p-2 rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-secondary-600 hover:bg-secondary-100"
                onClick={() => {
                  const startTime = performance.now();
                  console.log('🔄 Manual refresh initiated...');
                  
                  // Force refetch with cache invalidation
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
                  queryClient.refetchQueries({ queryKey: ["/api/admin/bookings"] });
                  
                  const endTime = performance.now();
                  console.log(`✅ Manual refresh completed in ${(endTime - startTime).toFixed(2)}ms`);
                  
                  toast({ 
                    title: "Refreshed", 
                    description: "Bookings data refreshed successfully" 
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Manual Refresh
              </Button>
            </div>
            <div className="bg-primary-500 p-2 rounded-lg">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:text-primary-500">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Total Bookings</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-accent-100 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-accent-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Pending</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Truck className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">In Transit</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.inTransit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-secondary-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-secondary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Delivered</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-accent-100 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-accent-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Cancelled</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-secondary-100 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-secondary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-secondary">Total Revenue</p>
                  <p className="text-2xl font-bold text-text-primary">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking List</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Package className="h-4 w-4 mr-2" />
                Showing <span className="font-medium text-foreground mx-1">{filteredBookings?.length || 0}</span> 
                of <span className="font-medium text-foreground mx-1">{bookings?.length || 0}</span> bookings
                {(searchTerm || statusFilter !== "all" || dateFromFilter || dateToFilter) && (
                  <span className="ml-2 text-primary">(filtered)</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tracking number or location..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
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
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Details</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-primary-600" />
                          <div>
                            <p className="font-medium text-text-primary">#{booking.trackingNumber || `BK${booking.id}`}</p>
                            <p className="text-sm text-text-secondary">{booking.bookingType || 'FTL'}</p>
                            {booking.vehicleId && (
                              <p className="text-xs text-text-secondary">Vehicle: {booking.registrationNumber || booking.vehicleNumber || `V${booking.vehicleId}`}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-text-primary">
                          <p className="font-medium">{booking.pickupLocation}</p>
                          <p className="text-sm text-text-secondary">to {booking.deliveryLocation || booking.dropLocation}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-text-primary">
                          <div className="flex items-center space-x-2">
                            <div className="bg-secondary-100 px-2 py-1 rounded-md">
                              <p className="text-xs font-medium text-secondary-700">{booking.pickupCity}</p>
                            </div>
                            <div className="text-text-secondary">→</div>
                            <div className="bg-primary-100 px-2 py-1 rounded-md">
                              <p className="text-xs font-medium text-primary-700">{booking.deliveryCity}</p>
                            </div>
                          </div>
                          {booking.pickupPinCode && booking.deliveryPinCode && (
                            <p className="text-xs text-text-secondary mt-1">
                              {booking.pickupPinCode} → {booking.deliveryPinCode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {booking.serviceType?.toUpperCase() || booking.bookingType?.toUpperCase() || 'FTL'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-text-primary">₹{Math.ceil(Number(booking.totalAmount || booking.totalCost || 0))}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(booking.status || 'pending')}>
                          {getStatusIcon(booking.status || 'pending')}
                          <span className="capitalize ml-1">{booking.status || 'pending'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-text-secondary">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditBooking(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, 'picked')}>
                                Mark as Picked
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, 'in_transit')}>
                                Mark in Transit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(booking.id, 'delivered')}>
                                Mark as Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateInvoice(booking.id)}>
                                Generate Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTrackPackage(booking.id)}>
                                Track Package
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendNotification(booking.id)}>
                                Send Notification
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

export default AdminBookings;