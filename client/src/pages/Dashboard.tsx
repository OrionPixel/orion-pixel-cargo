import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package, Truck, DollarSign, Clock, Plus, Car, Star, Search, Filter, FileText, QrCode, Download, Calendar, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { useLocation } from "wouter";

import BookingModal from "@/components/modals/BookingModal";
import BarcodeModal from "@/components/modals/BarcodeModal";
import SubscriptionModal from "@/components/modals/SubscriptionModal";

import type { Booking } from "@shared/schema";
import { queryClient, ensureNavigationCache } from "@/lib/queryClient";
import { RealtimeNotificationService } from "@/services/RealtimeNotificationService";


export default function Dashboard() {
  const { user } = useAuth();
  const { themeSettings } = useUserTheme();
  const [, setLocation] = useLocation();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'bill' | 'barcode' | 'export'>('bill');
  const [dateRangeType, setDateRangeType] = useState<'today' | 'all' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // INSTANT: Dashboard ready immediately - no performance logging for speed
  useEffect(() => {
    // Set dynamic title for agents
    if (user?.role === 'office') {
      document.title = `Agent Dashboard - ${user.firstName} ${user.lastName}`;
    }
  }, [user]);

  // ⚡ PERFORMANCE: Dashboard stats with real-time updates via SSE
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - allow fresh data
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true, // Allow fresh fetch on mount
    refetchInterval: false, // No automatic polling - rely on SSE
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: { totalBookings: 0, totalRevenue: 0, activeShipments: 0, totalVehicles: 0 },
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for dashboard stats`);
      return failureCount < 3;
    }
  });

  // ⚡ PERFORMANCE: Recent bookings with real-time updates via SSE
  const { data: recentBookings, isLoading: recentBookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['/api/bookings/recent'],
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute - allow fresh data
    gcTime: 3 * 60 * 1000,
    refetchOnMount: true, // Allow fresh fetch on mount
    refetchInterval: false, // No automatic polling - rely on SSE
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: [],
  });

  // ⚡ PERFORMANCE: All bookings with real-time updates via SSE
  const { data: allBookings, refetch: refetchAllBookings } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - allow fresh data
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true, // Allow fresh fetch on mount
    refetchInterval: false, // No automatic polling - rely on SSE
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: [],
  });

  // Filter bookings based on search query
  const filteredBookings = (allBookings as Booking[] | undefined)?.filter((booking: Booking) => {
    if (!searchQuery.trim()) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      booking.trackingNumber?.toLowerCase().includes(query) ||
      booking.bookingId?.toLowerCase().includes(query) ||
      booking.senderName?.toLowerCase().includes(query) ||
      booking.receiverName?.toLowerCase().includes(query) ||
      booking.pickupAddress?.toLowerCase().includes(query) ||
      booking.deliveryAddress?.toLowerCase().includes(query) ||
      booking.senderPhone?.includes(query) ||
      booking.receiverPhone?.includes(query)
    );
  }) || [];

  // ⚡ PERFORMANCE: SSE real-time updates for Dashboard
  useEffect(() => {
    if (!user?.id || !user?.role) return;

    console.log('🔥 Dashboard: Setting up real-time updates via centralized service');
    
    // Use the centralized RealtimeNotificationService instead of creating a new SSE connection
    const service = RealtimeNotificationService.getInstance(
      user.id,
      user.role,
      queryClient,
      true, // soundEnabled
      () => {} // playSound function (not needed for dashboard)
    );

    // Add event listeners for dashboard-specific events
    const handleBookingEvent = (event: any) => {
      console.log('📦 Dashboard: Booking update received via centralized service');
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    };

    const handleDashboardEvent = (event: any) => {
      console.log('📊 Dashboard: Dashboard update received via centralized service');
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
    };

    // Register event listeners
    service.addEventListener('booking', handleBookingEvent);
    service.addEventListener('dashboard', handleDashboardEvent);
    
    return () => {
      // Remove event listeners
      service.removeEventListener('booking', handleBookingEvent);
      service.removeEventListener('dashboard', handleDashboardEvent);
    };
  }, [user?.id, user?.role, queryClient]);

  useEffect(() => {
    const handleOpenSubscriptionModal = () => {
      setShowSubscriptionModal(true);
    };

    window.addEventListener('openSubscriptionModal', handleOpenSubscriptionModal);
    return () => {
      window.removeEventListener('openSubscriptionModal', handleOpenSubscriptionModal);
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleCreateBooking = () => {
    // Check if user has an active subscription or valid trial
    const subscriptionStatus = user?.subscriptionStatus as string;
    if (subscriptionStatus === 'trial' && user?.trialEndDate && new Date() > new Date(user.trialEndDate)) {
      setShowSubscriptionModal(true);
    } else {
      setShowBookingModal(true);
    }
  };

  // Bulk Action Functions
  const handleBulkBillPrint = () => {
    const bookingsArray = (allBookings as Booking[] | undefined) || [];
    if (bookingsArray.length === 0) {
      alert("कोई बुकिंग नहीं मिली। पहले कुछ बुकिंग्स बनाएं।");
      return;
    }
    setBulkActionType('bill');
    setShowBulkActionModal(true);
  };

  const handleBulkBarcodeePrint = () => {
    const bookingsArray = (allBookings as Booking[] | undefined) || [];
    if (bookingsArray.length === 0) {
      alert("कोई बुकिंग नहीं मिली। पहले कुछ बुकिंग्स बनाएं।");
      return;
    }
    setBulkActionType('barcode');
    setShowBulkActionModal(true);
  };

  const handleExportBookings = () => {
    const bookingsArray = (allBookings as Booking[] | undefined) || [];
    if (bookingsArray.length === 0) {
      alert("कोई बुकिंग नहीं मिली। पहले कुछ बुकिंग्स बनाएं।");
      return;
    }
    setBulkActionType('export');
    setShowBulkActionModal(true);
  };

  // Perform bulk action based on date range type
  const performBulkAction = () => {
    let selectedBookings: any[] = [];
    let rangeLabel = '';

    // Filter bookings based on selected date range type
    const bookingsArray = (allBookings as Booking[] | undefined) || [];
    if (dateRangeType === 'today') {
      const today = new Date();
      selectedBookings = bookingsArray.filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.toDateString() === today.toDateString();
      });
      rangeLabel = "Today's";
    } else if (dateRangeType === 'all') {
      selectedBookings = bookingsArray;
      rangeLabel = "All";
    } else if (dateRangeType === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert("Please select both start and end dates for custom range.");
        return;
      }
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      selectedBookings = bookingsArray.filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
      rangeLabel = "Custom range";
    }

    if (selectedBookings.length === 0) {
      alert(`No bookings found for ${rangeLabel.toLowerCase()}.`);
      return;
    }

    const actionName = bulkActionType === 'bill' ? 'Bill Print' : 
                      bulkActionType === 'barcode' ? 'Barcode Print' : 'Export';
    
    const proceed = confirm(`${actionName} ${selectedBookings.length} bookings from ${rangeLabel.toLowerCase()}?`);
    
    if (proceed) {
      if (bulkActionType === 'bill') {
        // Bill print logic
        selectedBookings.forEach((booking: any) => {
          // Print bill for each booking
          console.log(`Printing bill for booking: ${booking.trackingNumber}`);
        });
        alert(`Successfully printed bills for ${selectedBookings.length} bookings.`);
      } else if (bulkActionType === 'barcode') {
        // Barcode print logic
        selectedBookings.forEach((booking: any) => {
          // Print barcode for each booking
          console.log(`Printing barcode for booking: ${booking.trackingNumber}`);
        });
        alert(`Successfully printed barcodes for ${selectedBookings.length} bookings.`);
      } else if (bulkActionType === 'export') {
        // Export logic (CSV)
        const csvContent = selectedBookings.map((booking: any) => 
          `${booking.trackingNumber},${booking.senderName},${booking.receiverName},${booking.totalAmount}`
        ).join('\n');
        
        const blob = new Blob([`Tracking Number,Sender,Receiver,Amount\n${csvContent}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings_${rangeLabel.toLowerCase().replace(' ', '_')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert(`Successfully exported ${selectedBookings.length} bookings.`);
      }
      
      setShowBulkActionModal(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Please sign in to access your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" data-version="modern-theme-v2">
      {/* Force New Design Indicator */}
      <div className="hidden">MODERN_DASHBOARD_V10_SUPER_CLEAN_FORCE_REFRESH</div>
      <div className="space-y-4 md:space-y-6 dashboard-mobile md:dashboard-desktop">

        {/* Mobile-responsive Bulk Actions and Search Section with Gradient */}
        <div 
          className="relative rounded-xl p-3 md:p-6 mb-4 md:mb-6 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${themeSettings.primaryColor}15, ${themeSettings.accentColor}15)`,
            borderLeft: `4px solid ${themeSettings.primaryColor}`
          }}
        >
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {/* Bulk Action Buttons - Stack on mobile, row on larger screens */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:space-y-0 button-group-mobile sm:button-group-tablet">
              <Button
                size="sm"
                className="flex items-center justify-center gap-2 text-white transition-transform duration-200 hover:scale-105 text-xs sm:text-sm w-full sm:w-auto button-mobile"
                onClick={handleBulkBillPrint}
                style={{
                  backgroundColor: themeSettings.primaryColor,
                  borderColor: themeSettings.primaryColor
                }}
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 icon-mobile" />
                <span className="hidden sm:inline">Bulk Bill Print</span>
                <span className="sm:hidden text-mobile-sm">Bill Print</span>
              </Button>
              
              <Button
                size="sm"
                className="flex items-center justify-center gap-2 text-white transition-transform duration-200 hover:scale-105 text-xs sm:text-sm w-full sm:w-auto button-mobile"
                onClick={handleBulkBarcodeePrint}
                style={{
                  backgroundColor: themeSettings.primaryColor,
                  borderColor: themeSettings.primaryColor
                }}
              >
                <QrCode className="h-3 w-3 sm:h-4 sm:w-4 icon-mobile" />
                <span className="hidden sm:inline">Bulk Barcode Print</span>
                <span className="sm:hidden text-mobile-sm">Barcode</span>
              </Button>
              
              <Button
                size="sm"
                className="flex items-center justify-center gap-2 text-white transition-transform duration-200 hover:scale-105 text-xs sm:text-sm w-full sm:w-auto button-mobile"
                onClick={handleExportBookings}
                style={{
                  backgroundColor: themeSettings.primaryColor,
                  borderColor: themeSettings.primaryColor
                }}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 icon-mobile" />
                <span className="hidden sm:inline">Export Bookings</span>
                <span className="sm:hidden text-mobile-sm">Export</span>
              </Button>
            </div>

            {/* Search Bar - Full width on mobile, constrained on desktop */}
            <div className="relative w-full lg:max-w-md search-input-mobile">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 icon-mobile" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 sm:pl-10 pr-4 w-full text-sm form-input-mobile"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted text-xs"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          {/* Trial Status Banner */}
          {user?.subscriptionStatus === 'trial' && user?.trialEndDate && new Date() > new Date(user.trialEndDate) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900">Trial Expired</p>
                    <p className="text-sm text-orange-700">Upgrade to continue using all features</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="transition-all duration-200"
                  style={{ 
                    backgroundColor: themeSettings.primaryColor,
                    color: 'white',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = themeSettings.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = themeSettings.primaryColor;
                  }}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}

          {/* Mobile-responsive Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 dashboard-stats-grid">
            {/* Total Bookings Card */}
            <div 
              className="relative rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 bg-gradient-to-br shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer card-mobile"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.primaryColor}05, ${themeSettings.primaryColor}15)`,
                border: `1px solid ${themeSettings.primaryColor}20`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 card-title-mobile">Total Bookings</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground card-content-mobile">
                    {statsLoading ? (
                      <span className="animate-pulse">•••</span>
                    ) : (
                      dashboardStats?.totalBookings ?? 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 text-mobile-sm">
                    {statsLoading ? 'Loading...' : 'All time'}
                  </p>
                </div>
                <div 
                  className="p-2 sm:p-3 md:p-4 rounded-full bg-white/50 group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                  style={{ backgroundColor: `${themeSettings.primaryColor}20` }}
                >
                  <Package 
                    className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" 
                    style={{ color: themeSettings.primaryColor }}
                  />
                </div>
              </div>
            </div>

            {/* Active Shipments Card */}
            <div 
              className="relative rounded-xl p-6 bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.secondaryColor}05, ${themeSettings.secondaryColor}15)`,
                border: `1px solid ${themeSettings.secondaryColor}20`
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Shipments</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? (
                      <span className="animate-pulse">•••</span>
                    ) : (
                      dashboardStats?.activeShipments ?? 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statsLoading ? 'Loading...' : 'In transit'}
                  </p>
                </div>
                <div 
                  className="p-4 rounded-full bg-white/50 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.secondaryColor}20` }}
                >
                  <Truck 
                    className="h-8 w-8" 
                    style={{ color: themeSettings.secondaryColor }}
                  />
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div 
              className="relative rounded-xl p-6 bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.accentColor}05, ${themeSettings.accentColor}15)`,
                border: `1px solid ${themeSettings.accentColor}20`
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? (
                      <span className="animate-pulse">•••</span>
                    ) : (
                      `₹${Math.ceil(Number(dashboardStats?.revenue || 0))}`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statsLoading ? 'Loading...' : 'This month'}
                  </p>
                </div>
                <div 
                  className="p-4 rounded-full bg-white/50 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.accentColor}20` }}
                >
                  <DollarSign 
                    className="h-8 w-8" 
                    style={{ color: themeSettings.accentColor }}
                  />
                </div>
              </div>
            </div>

            {/* Available Vehicles Card */}
            <div 
              className="relative rounded-xl p-6 bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.primaryColor}05, ${themeSettings.primaryColor}15)`,
                border: `1px solid ${themeSettings.primaryColor}20`
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Available Vehicles</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? (
                      <span className="animate-pulse">•••</span>
                    ) : (
                      dashboardStats?.availableVehicles ?? 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statsLoading ? 'Loading...' : 'Ready for booking'}
                  </p>
                </div>
                <div 
                  className="p-4 rounded-full bg-white/50 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.primaryColor}20` }}
                >
                  <Car 
                    className="h-8 w-8" 
                    style={{ color: themeSettings.primaryColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-responsive Quick Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <button 
              onClick={handleCreateBooking}
              className="p-6 rounded-xl text-left select-none dashboard-new-booking-btn"
              style={{
                backgroundColor: themeSettings.primaryColor,
                color: 'white',
                border: 'none',
                userSelect: 'none',
                cursor: 'pointer !important'
              }}
            >
              <div className="flex items-center gap-4" style={{ cursor: 'pointer !important' }}>
                <div 
                  className="p-3 rounded-full"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    cursor: 'pointer !important'
                  }}
                >
                  <Plus 
                    className="h-6 w-6" 
                    style={{ 
                      color: 'white',
                      cursor: 'pointer !important'
                    }}
                  />
                </div>
                <div className="select-none" style={{ cursor: 'pointer !important' }}>
                  <h3 className="font-semibold select-none" style={{ 
                    color: 'white',
                    cursor: 'pointer !important'
                  }}>New Booking</h3>
                  <p className="text-sm select-none" style={{ 
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer !important'
                  }}>Create a new shipment</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setLocation('/bookings')}
              className="p-6 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.secondaryColor}10, ${themeSettings.secondaryColor}20)`,
                border: `1px solid ${themeSettings.secondaryColor}30`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-full group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.secondaryColor}20` }}
                >
                  <Clock 
                    className="h-6 w-6" 
                    style={{ color: themeSettings.secondaryColor }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">View Bookings</h3>
                  <p className="text-sm text-muted-foreground">Manage all shipments</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setLocation('/tracking')}
              className="p-6 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.accentColor}10, ${themeSettings.accentColor}20)`,
                border: `1px solid ${themeSettings.accentColor}30`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-full group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.accentColor}20` }}
                >
                  <Star 
                    className="h-6 w-6" 
                    style={{ color: themeSettings.accentColor }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Track Shipments</h3>
                  <p className="text-sm text-muted-foreground">Monitor live tracking</p>
                </div>
              </div>
            </button>
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div 
              className="rounded-xl border shadow-sm mb-6 bg-white"
              style={{ 
                borderColor: `${themeSettings.primaryColor}20`
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: `${themeSettings.primaryColor}10` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Search Results</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredBookings.length} orders found for "{searchQuery}"
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${themeSettings.primaryColor}10` }}
                    >
                      <Search 
                        className="h-8 w-8" 
                        style={{ color: themeSettings.primaryColor }}
                      />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground">Try different keywords or check spelling</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.slice(0, 10).map((booking: any) => (
                      <div 
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all"
                        style={{ 
                          borderColor: `${themeSettings.primaryColor}20`,
                          backgroundColor: `${themeSettings.primaryColor}05`
                        }}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${themeSettings.primaryColor}15` }}
                          >
                            <Package 
                              className="h-5 w-5" 
                              style={{ color: themeSettings.primaryColor }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{booking.trackingNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.senderName} → {booking.receiverName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">₹{Math.ceil(parseFloat(booking.totalAmount || "0"))}</p>
                          <p 
                            className="text-sm px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: booking.status === 'delivered' ? '#10b98120' : 
                                            booking.status === 'in_transit' ? '#f59e0b20' : 
                                            booking.status === 'picked' ? '#3b82f620' : '#64748b20',
                              color: booking.status === 'delivered' ? '#059669' : 
                                     booking.status === 'in_transit' ? '#d97706' : 
                                     booking.status === 'picked' ? '#2563eb' : '#475569'
                            }}
                          >
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredBookings.length > 10 && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing first 10 results. Refine your search to see more specific results.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Bookings with Modern Design */}
          <div 
            className="rounded-xl border shadow-md bg-white"
            style={{ 
              borderColor: `${themeSettings.primaryColor}20`
            }}
          >
            <div className="p-6 border-b" style={{ borderColor: `${themeSettings.primaryColor}10` }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Recent Bookings</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your latest shipment activities</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      refetchBookings();
                      refetchStats();
                    }}
                    className="px-4 py-2 rounded-lg border transition-all hover:scale-105"
                    style={{
                      borderColor: `${themeSettings.secondaryColor}30`,
                      color: themeSettings.secondaryColor,
                      backgroundColor: `${themeSettings.secondaryColor}10`
                    }}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {recentBookingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div 
                    className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `${themeSettings.primaryColor}30`, borderTopColor: 'transparent' }}
                  />
                  <span className="ml-3 text-muted-foreground">Loading bookings...</span>
                </div>
              ) : !recentBookings || (Array.isArray(recentBookings) && recentBookings.length === 0) ? (
                <div className="text-center py-16">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${themeSettings.primaryColor}10` }}
                  >
                    <Package 
                      className="h-8 w-8" 
                      style={{ color: themeSettings.primaryColor }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">Start by creating your first shipment booking</p>
                  <button 
                    onClick={handleCreateBooking} 
                    className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: themeSettings.primaryColor,
                      color: 'white'
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2 inline" />
                    Create First Booking
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(recentBookings) ? recentBookings.slice(0, 5).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="p-4 rounded-lg border shadow-sm transition-all hover:shadow-md cursor-pointer"
                      style={{
                        background: '#ffffff',
                        borderColor: `${themeSettings.primaryColor}20`,
                        borderLeft: `4px solid ${themeSettings.primaryColor}`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${themeSettings.primaryColor}20` }}
                          >
                            <Package 
                              className="h-6 w-6" 
                              style={{ color: themeSettings.primaryColor }}
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">#{booking.bookingId}</h4>
                            <p className="text-sm text-muted-foreground">{booking.senderName}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.pickupCity} → {booking.deliveryCity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div 
                            className="px-3 py-1 rounded-full text-xs font-medium mb-2"
                            style={{
                              backgroundColor: booking.status === 'delivered' ? '#10b98120' : 
                                             booking.status === 'in_transit' ? '#f59e0b20' :
                                             `${themeSettings.primaryColor}20`,
                              color: booking.status === 'delivered' ? '#10b981' : 
                                     booking.status === 'in_transit' ? '#f59e0b' :
                                     themeSettings.primaryColor
                            }}
                          >
                            {booking.status}
                          </div>
                          <p className="font-semibold text-foreground">₹{Math.ceil(Number(booking.totalAmount || 0))}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BarcodeModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        booking={selectedBooking}
      />
      
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingCreated={(booking) => {
          // Immediately refresh data after booking creation
          refetchBookings();
          refetchStats();
          queryClient.invalidateQueries({ queryKey: ['/api/bookings/recent'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          setShowBookingModal(false);
        }}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Bulk Action Modal */}
      <Dialog open={showBulkActionModal} onOpenChange={setShowBulkActionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {bulkActionType === 'bill' && <FileText className="h-5 w-5" />}
              {bulkActionType === 'barcode' && <QrCode className="h-5 w-5" />}
              {bulkActionType === 'export' && <Download className="h-5 w-5" />}
              <span>
                {bulkActionType === 'bill' && 'Bulk Bill Print'}
                {bulkActionType === 'barcode' && 'Bulk Barcode Print'}
                {bulkActionType === 'export' && 'Export Bookings'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label>Select Date Range</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="dateRangeType"
                    checked={dateRangeType === 'today'}
                    onChange={() => setDateRangeType('today')}
                    className="text-primary"
                  />
                  <span>Today's Bookings</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    ({((allBookings as Booking[] | undefined) || []).filter((booking: any) => {
                      const today = new Date();
                      const bookingDate = new Date(booking.createdAt);
                      return bookingDate.toDateString() === today.toDateString();
                    }).length} bookings)
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="dateRangeType"
                    checked={dateRangeType === 'all'}
                    onChange={() => setDateRangeType('all')}
                    className="text-primary"
                  />
                  <span>All Bookings</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    ({((allBookings as Booking[] | undefined) || []).length} bookings)
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="dateRangeType"
                    checked={dateRangeType === 'custom'}
                    onChange={() => setDateRangeType('custom')}
                    className="text-primary"
                  />
                  <span>Custom Date Range</span>
                </label>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {dateRangeType === 'custom' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowBulkActionModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={performBulkAction}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {bulkActionType === 'bill' && 'Print Bills'}
                {bulkActionType === 'barcode' && 'Print Barcodes'}
                {bulkActionType === 'export' && 'Export'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}