import { useState, useCallback } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { apiRequest } from "@/lib/queryClient";
import BookingModal from "@/components/modals/BookingModal";
import { AutoGPSTracker } from "@/components/tracking/AutoGPSTracker";
import PaymentUpdateModal from "@/components/modals/PaymentUpdateModal";
import BarcodeModal from "@/components/modals/BarcodeModal";
import BookingExportModal from "@/components/modals/BookingExportModal";
import BillPreviewModal from "@/components/modals/BillPreviewModal";
import { Plus, Search, Filter, Eye, Truck, Package, Clock, CheckCircle, CreditCard, Download, QrCode, MapPin, Calendar, User, Phone, Mail, IndianRupee, Edit, Trash2, AlertCircle, RefreshCw, CalendarDays, Printer } from "lucide-react";
import { downloadBookingBill } from "@/lib/pdfGenerator";
import type { Booking, TrackingEvent } from "@shared/schema";

export default function Bookings() {
  const { user } = useAuth();
  const { themeSettings } = useUserTheme();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [showGPSTracking, setShowGPSTracking] = useState(false);
  const [selectedBookingForBillPreview, setSelectedBookingForBillPreview] = useState<Booking | null>(null);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, error, refetch } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user, // Only fetch when user is authenticated
    retry: 1, // Reduce retries for speed
    retryDelay: 500, // Faster retry
    refetchInterval: false, // Disable auto-refresh for speed
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Navigation optimization: use cached data immediately
    staleTime: 15 * 60 * 1000, // Navigation optimization: cache for 15 minutes
    gcTime: 30 * 60 * 1000 // Keep in memory for 30 minutes
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {

      
      // Update booking status
      await apiRequest('PUT', `/api/bookings/${bookingId}`, { status });
      
      // Create tracking event
      await apiRequest('POST', `/api/bookings/${bookingId}/tracking`, {
        status,
        location: getLocationForStatus(status),
        notes: getStatusDescription(status),
        updateBookingStatus: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/recent"] });
      toast({
        title: "Status Updated",
        description: "Booking status and tracking updated successfully"
      });
    },
    onError: (error) => {

      toast({
        title: "Update Failed",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  });

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'booked': return 'Booking confirmed and scheduled for pickup';
      case 'picked': return 'Package picked up from sender location';
      case 'in_transit': return 'Package is being transported to destination';
      case 'delivered': return 'Package delivered successfully to receiver';
      case 'cancelled': return 'Booking has been cancelled';
      default: return 'Status updated';
    }
  };

  const getLocationForStatus = (status: string) => {
    switch (status) {
      case 'booked': return 'Pickup Location';
      case 'picked': return 'Origin Hub';
      case 'in_transit': return 'On Route';
      case 'delivered': return 'Destination';
      case 'cancelled': return 'N/A';
      default: return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        // For datetime-local format, treat as local time
        const [datePart, timePart] = timestamp.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        // Create date using local timezone components
        const localDate = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        return localDate.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For other date formats
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-IN', {
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

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.pickupCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.deliveryCity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
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
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'in_transit':
        return 'secondary';
      case 'picked':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'picked':
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canUpdateStatus = (currentStatus: string, newStatus: string) => {
    const statusFlow = ['booked', 'picked', 'in_transit', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const newIndex = statusFlow.indexOf(newStatus);
    return newIndex > currentIndex;
  };

  const formatCurrency = (amount: string | number) => {
    const roundedAmount = Math.ceil(Number(amount));
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(roundedAmount);
  };

  const handleBookingCreated = useCallback((booking: any) => {
    console.log('=== PAYMENT MODAL TRIGGER VIA CALLBACK ===');
    console.log('handleBookingCreated called with booking:', booking);
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
    console.log('Payment modal state set to true');
  }, []);

  // Listen for payment modal events
  React.useEffect(() => {
    const handlePaymentModalEvent = (event: CustomEvent) => {
      console.log('=== PAYMENT MODAL EVENT HANDLER ===');
      console.log('Payment modal event received:', event.detail);
      const { booking } = event.detail;
      console.log('Setting selected booking:', booking);
      console.log('Opening payment modal...');
      setSelectedBooking(booking);
      setIsPaymentModalOpen(true);
    };


    window.addEventListener('openPaymentModal', handlePaymentModalEvent as EventListener);
    
    return () => {

      window.removeEventListener('openPaymentModal', handlePaymentModalEvent as EventListener);
    };
  }, []);

  // Debug effect to track modal state changes
  React.useEffect(() => {

  }, [isPaymentModalOpen, selectedBooking]);

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 mb-2">Unable to load bookings</h3>
          <p className="text-slate-500 mb-4">Please try refreshing the page or contact support if the issue persists.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Mobile-responsive Header */}
      <div className="bg-card border-b border-border p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Bookings</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track and manage all your cargo bookings</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto button-responsive-group">
            <BookingExportModal
              bookings={filteredBookings}
              trigger={
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              }
            />
            <Button 
              onClick={() => setShowBookingModal(true)} 
              className="transition-all duration-200"
              style={{ 
                backgroundColor: themeSettings.primaryColor,
                color: 'white',
                border: 'none'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = themeSettings.accentColor}
              onMouseLeave={(e) => e.target.style.backgroundColor = themeSettings.primaryColor}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-responsive Search and Filter Controls */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3">
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-2 icon-mobile" />
            Showing <span className="font-medium text-foreground mx-1">{filteredBookings?.length || 0}</span> 
            of <span className="font-medium text-foreground mx-1">{bookings?.length || 0}</span> bookings
            {(searchTerm || statusFilter !== "all" || dateFromFilter || dateToFilter) && (
              <span className="ml-2 text-primary">(filtered)</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 search-filter-mobile">
          <div className="flex-1 relative search-input-mobile">
            <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground icon-mobile" />
            <Input
              placeholder="Search by booking ID, customer, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 text-sm form-input-mobile"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          
          {/* Mobile-responsive Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="date"
                placeholder="From Date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                onFocus={(e) => e.currentTarget.focus()}
                className="pl-10 sm:pl-12 w-full sm:w-48 cursor-pointer hover:bg-muted/30 transition-all duration-200 border-2 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="date"
                placeholder="To Date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                onFocus={(e) => e.currentTarget.focus()}
                className="pl-10 sm:pl-12 w-full sm:w-48 cursor-pointer hover:bg-muted/30 transition-all duration-200 border-2 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
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
                className="px-3 w-full sm:w-auto text-sm"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-border p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
          <p className="text-muted-foreground">Get started by creating your first booking</p>
          <Button onClick={() => setShowBookingModal(true)} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow bg-white" style={{ border: '2px solid hsl(var(--primary) / 0.3)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(booking.status)} className="flex items-center gap-1">
                      {getStatusIcon(booking.status)}
                      {booking.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-lg font-semibold text-foreground">#{booking.bookingId || booking.id}</span>
                    <span className="text-sm text-muted-foreground">
                      {booking.createdAt ? formatDate(booking.createdAt) : new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <CreditCard className="h-3 w-3" />
                      <Badge 
                        variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}
                        className={
                          booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                          booking.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-800' : 
                          'bg-red-100 text-red-800'
                        }
                      >
                        {booking.paymentStatus?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{booking.customerName || booking.senderName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.customerPhone || booking.senderPhone || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-foreground">{booking.pickupLocation || booking.pickupCity || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-6">
                      Pickup: {booking.pickupDateTime ? formatTimestamp(booking.pickupDateTime) : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-foreground">{booking.deliveryLocation || booking.deliveryCity || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-6">
                      Delivery: {booking.deliveryDateTime ? formatTimestamp(booking.deliveryDateTime) : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-end items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsTrackingModalOpen(true);
                    }}
                    className="hover:bg-primary/10 hover:border-primary hover:text-primary transition-all font-medium"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-sm">Track</span>
                  </Button>
                  
                  {/* GPS Tracking Button - Shows for all bookings, functionality determined inside modal */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowGPSTracking(true);
                    }}
                    className="gps-button"
                    title={`GPS Tracking for Booking #${booking.bookingId || booking.id}`}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">GPS</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsBarcodeModalOpen(true);
                    }}
                    className="hover:bg-accent/10 hover:border-accent hover:text-accent transition-all font-medium"
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    <span className="text-sm">Barcode</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsPaymentModalOpen(true);
                    }}
                    className={`border-secondary text-secondary-foreground hover:bg-secondary/10 hover:text-secondary transition-all duration-200 font-medium ${
                      booking.paymentStatus === 'paid' 
                        ? 'opacity-60 cursor-not-allowed bg-muted border-muted-foreground text-muted-foreground' 
                        : 'hover:shadow-lg hover:border-secondary'
                    }`}
                    disabled={booking.paymentStatus === 'paid'}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    <span className="text-sm font-semibold">
                      {booking.paymentStatus === 'paid' ? 'Payment Complete' : 'Update Payment'}
                    </span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBookingForBillPreview(booking);
                      setShowBillPreviewModal(true);
                    }}
                    className="hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all font-medium"
                    title={`Preview & Print Bill for Booking #${booking.bookingId || booking.id}`}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Print Bill</span>
                  </Button>
                  
                  <Select
                    value={booking.status}
                    onValueChange={(newStatus) => {
                      if (canUpdateStatus(booking.status, newStatus)) {
                        updateStatusMutation.mutate({ bookingId: booking.id, status: newStatus });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-9 border-accent/50 hover:border-accent text-accent-foreground font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booked" disabled={!canUpdateStatus(booking.status, 'booked')}>
                        Booked
                      </SelectItem>
                      <SelectItem value="picked" disabled={!canUpdateStatus(booking.status, 'picked')}>
                        Picked Up
                      </SelectItem>
                      <SelectItem value="in_transit" disabled={!canUpdateStatus(booking.status, 'in_transit')}>
                        In Transit
                      </SelectItem>
                      <SelectItem value="delivered" disabled={!canUpdateStatus(booking.status, 'delivered')}>
                        Delivered
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        onBookingCreated={handleBookingCreated}
      />

      {/* Payment Update Modal */}
      <PaymentUpdateModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
      />

      {/* Barcode Modal */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        officeName={user?.officeName || user?.firstName + " " + user?.lastName || "CargoFlow Logistics"}
      />

      {/* Bill Preview Modal */}
      <BillPreviewModal
        booking={selectedBookingForBillPreview}
        isOpen={showBillPreviewModal}
        onOpenChange={setShowBillPreviewModal}
        officeName={user?.officeName || user?.firstName + " " + user?.lastName || "LogiGoFast Logistics"}
      />

      {/* Tracking Modal - Enhanced with GPS option */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Package Tracking - #{selectedBooking?.bookingId || selectedBooking?.id}</span>
              {selectedBooking?.vehicleId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsTrackingModalOpen(false);
                    setShowGPSTracking(true);
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="font-medium">Switch to GPS View</span>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <TrackingModalContent booking={selectedBooking} />
          )}
        </DialogContent>
      </Dialog>

      {/* GPS Tracking Modal */}
      <Dialog open={showGPSTracking} onOpenChange={setShowGPSTracking}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Live GPS Tracking - Booking #{selectedBooking?.bookingId || selectedBooking?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">From:</span>
                    <div className="text-green-600">{selectedBooking.pickupLocation || selectedBooking.pickupCity}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">To:</span>
                    <div className="text-green-600">{selectedBooking.deliveryLocation || selectedBooking.deliveryCity}</div>
                  </div>
                </div>
              </div>

              {/* GPS Tracker Component */}
              <AutoGPSTracker bookingId={selectedBooking.id} />
              
              {/* Close Button */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowGPSTracking(false);
                    setIsTrackingModalOpen(true);
                  }}
                >
                  Back to Tracking
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowGPSTracking(false)}
                >
                  Close GPS Tracking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tracking Modal Content Component
function TrackingModalContent({ booking }: { booking: Booking }) {
  const { data: trackingEvents, isLoading } = useQuery<TrackingEvent[]>({
    queryKey: [`/api/bookings/${booking.id}/tracking`],
  });

  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        // For datetime-local format, treat as local time
        const [datePart, timePart] = timestamp.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        // Create date using local timezone components
        const localDate = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        return localDate.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For other date formats
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-IN', {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return '📋';
      case 'picked': return '📦';
      case 'in_transit': return '🚛';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading tracking information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Pickup Location</h3>
          <p className="text-gray-900">{booking.pickupLocation || booking.pickupCity || 'N/A'}</p>
          <p className="text-sm text-gray-500">
            {booking.pickupDateTime ? formatTimestamp(booking.pickupDateTime) : 'N/A'}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-1">Delivery Location</h3>
          <p className="text-gray-900">{booking.deliveryLocation || booking.deliveryCity || 'N/A'}</p>
          <p className="text-sm text-gray-500">
            {booking.deliveryDateTime ? formatTimestamp(booking.deliveryDateTime) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon(booking.status)}</span>
          <div>
            <h3 className="font-semibold text-blue-900">Current Status</h3>
            <p className="text-blue-700 capitalize">{booking.status?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
      
      {/* Tracking Timeline */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Tracking Timeline</h3>
        {trackingEvents && trackingEvents.length > 0 ? (
          <div className="space-y-4">
            {trackingEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 capitalize">
                    {event.status?.replace('_', ' ') || 'Status Update'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {event.location || 'Location updating...'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {event.notes || event.description || 'No additional details'}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Time not available'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-2">📍</div>
            <h4 className="text-gray-600 font-medium mb-1">No tracking events yet</h4>
            <p className="text-gray-500 text-sm">
              Tracking information will appear here as your package moves through our network
            </p>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
        <div>
          <span className="font-medium text-gray-700">Tracking Number:</span>
          <p className="text-gray-900">{booking.trackingNumber || 'N/A'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Service Type:</span>
          <p className="text-gray-900">{booking.serviceType || booking.bookingType || 'Standard'}</p>
        </div>
      </div>
    </div>
  );
}

// Tracking Dialog Component
function TrackingDialog({ booking }: { booking: Booking }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: trackingEvents, isLoading } = useQuery<TrackingEvent[]>({
    queryKey: [`/api/bookings/${booking.id}/tracking`],
    enabled: isOpen,
  });

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle datetime-local format (YYYY-MM-DDTHH:mm)
      if (timestamp.includes('T')) {
        // For datetime-local format, treat as local time
        const [datePart, timePart] = timestamp.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        // Create date using local timezone components
        const localDate = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        
        return localDate.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // For other date formats
      return new Date(timestamp).toLocaleString('en-IN', {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return '📋';
      case 'picked': return '📦';
      case 'in_transit': return '🚛';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Track
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Package Tracking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Tracking ID:</span>
                <div className="font-mono text-green-600">{booking.trackingNumber}</div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Current Status:</span>
                <div className="flex items-center gap-2">
                  <span>{getStatusIcon(booking.status)}</span>
                  <Badge variant={booking.status === 'delivered' ? 'default' : 'secondary'}>
                    {booking.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex justify-between text-sm">
                <span><strong>From:</strong> {booking.pickupCity}</span>
                <span><strong>To:</strong> {booking.deliveryCity}</span>
              </div>
              <div className="text-sm mt-1">
                <strong>Pickup Date:</strong> {formatTimestamp(booking.pickupDateTime)}
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div>
            <h3 className="font-medium text-slate-800 mb-3">Tracking History</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trackingEvents && trackingEvents.length > 0 ? (
              <div className="space-y-4">
                {trackingEvents.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      index === 0 ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 capitalize">
                          {event.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      {event.location && (
                        <div className="text-sm text-slate-600 mt-1">
                          📍 {event.location}
                        </div>
                      )}
                      {event.notes && (
                        <div className="text-sm text-slate-500 mt-1">
                          {event.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tracking events found</p>
                <p className="text-sm">Tracking information will appear here once available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


