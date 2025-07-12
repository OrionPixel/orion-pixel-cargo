import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Truck, DollarSign, Clock, Plus, Car, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";

import BookingModal from "@/components/modals/BookingModal";
import BarcodeModal from "@/components/modals/BarcodeModal";
import SubscriptionModal from "@/components/modals/SubscriptionModal";
import type { Booking } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { user } = useAuth();
  const { themeSettings } = useUserTheme();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Initialize dashboard with detailed performance timing
  useEffect(() => {
    const componentStartTime = performance.now();
    
    // Measure page navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    const firstPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    console.log('📊 PERFORMANCE ANALYSIS:');
    console.log(`📄 Total Page Load: ${pageLoadTime.toFixed(2)} ms`);
    console.log(`📄 DOM Content Loaded: ${domContentLoaded.toFixed(2)} ms`);
    console.log(`🎨 First Paint: ${firstPaint.toFixed(2)} ms`);
    console.log(`🎨 First Contentful Paint: ${firstContentfulPaint.toFixed(2)} ms`);
    console.log(`⚡ Component Mount: ${(performance.now() - componentStartTime).toFixed(2)} ms`);
    
    // Set dynamic title for agents
    if (user?.role === 'office') {
      document.title = `Agent Dashboard - ${user.firstName} ${user.lastName}`;
    }
    
    // Measure total dashboard ready time
    setTimeout(() => {
      const totalTime = performance.now() - componentStartTime;
      console.log(`✅ Dashboard fully ready in ${totalTime.toFixed(2)} milliseconds`);
    }, 0);
    
    // NO cache invalidation for faster loading - use cached data only
  }, []);

  // Fetch dashboard stats with optimized caching
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<any>(
    ['/api/dashboard/stats'],
    async () => {
      if (user?.role === 'office') {
        console.log(`🏢 AGENT FRONTEND: Fetching dashboard stats for ${user?.firstName} ${user?.lastName} (${user?.email})`);
      } else {
        console.log(`👤 USER FRONTEND: Fetching dashboard stats for ${user?.firstName} ${user?.lastName} (${user?.email})`);
      }
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('❌ Dashboard stats fetch failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }
      
      const stats = await response.json();
      if (user?.role === 'office') {
        console.log(`🏢 AGENT DASHBOARD DATA: ${stats.totalBookings} bookings, ₹${stats.revenue} revenue, ${stats.activeShipments} active shipments`);
      } else {
        console.log(`👤 USER DASHBOARD DATA: ${stats.totalBookings} bookings, ₹${stats.revenue} revenue, ${stats.activeShipments} active shipments`);
      }
      return stats;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnMount: false, // Prevent duplicate fetches
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1, // Reduce retries
      retryDelay: 2000,
    }
  );

  // Fetch recent bookings with optimized caching
  const { data: recentBookings, isLoading: recentBookingsLoading, refetch: refetchBookings } = useQuery<any[]>(
    ['/api/bookings/recent'],
    async () => {
      const response = await fetch('/api/bookings/recent', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recent bookings');
      }
      return response.json();
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      retryDelay: 2000,
    }
  );

  useEffect(() => {
    const handleOpenSubscriptionModal = () => {
      setShowSubscriptionModal(true);
    };

    window.addEventListener('openSubscriptionModal', handleOpenSubscriptionModal);
    return () => {
      window.removeEventListener('openSubscriptionModal', handleOpenSubscriptionModal);
    };
  }, []);

  const handleCreateBooking = () => {
    // Check if user has an active subscription or valid trial
    if (user?.subscriptionPlan === 'trial' && user?.trialEndDate && new Date() > new Date(user.trialEndDate)) {
      setShowSubscriptionModal(true);
    } else {
      setShowBookingModal(true);
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
      <div className="hidden">MODERN_DASHBOARD_LOADED_V2</div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                {user?.role === 'office' ? 'Agent Dashboard' : 'Dashboard'}
              </span>
            </h1>
            {user?.role === 'office' && (
              <p className="text-lg text-muted-foreground mt-1">
                Welcome back, <span style={{ color: `hsl(${themeSettings?.primaryColor})` }} className="font-semibold">{user.firstName} {user.lastName}</span>
              </p>
            )}
          </div>

        </div>

        <div>
          {/* Trial Status Banner */}
          {user?.subscriptionPlan === 'trial' && user?.trialEndDate && new Date() > new Date(user.trialEndDate) && (
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
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}

          {/* Header with Theme-based Gradient */}
          <div 
            className="relative rounded-xl p-6 mb-8 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${themeSettings.primaryColor}15, ${themeSettings.accentColor}15)`,
              borderLeft: `4px solid ${themeSettings.primaryColor}`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome, {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-muted-foreground">
                  {user?.officeName} • {user?.role === 'office' ? 'Office Agent' : 'User'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => refetchStats()} 
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${themeSettings.primaryColor}20`,
                    color: themeSettings.primaryColor,
                    border: `1px solid ${themeSettings.primaryColor}30`
                  }}
                  disabled={statsLoading}
                >
                  {statsLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: statsLoading ? '#f59e0b' : dashboardStats ? '#10b981' : '#ef4444'
                  }}
                  title={statsLoading ? 'Loading...' : dashboardStats ? 'Data loaded' : 'No data'}
                />
              </div>
            </div>
          </div>

          {/* Modern Stats Grid with Theme Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Bookings Card */}
            <div 
              className="relative rounded-xl p-6 bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.primaryColor}05, ${themeSettings.primaryColor}15)`,
                border: `1px solid ${themeSettings.primaryColor}20`
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? (
                      <span className="animate-pulse">•••</span>
                    ) : (
                      dashboardStats?.totalBookings ?? 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statsLoading ? 'Loading...' : 'All time'}
                  </p>
                </div>
                <div 
                  className="p-4 rounded-full bg-white/50 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.primaryColor}20` }}
                >
                  <Package 
                    className="h-8 w-8" 
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
                      `₹${Math.round(Number(dashboardStats?.revenue || 0))}`
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

          {/* Quick Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button 
              onClick={handleCreateBooking}
              className="p-6 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              style={{
                background: `linear-gradient(135deg, ${themeSettings.primaryColor}10, ${themeSettings.primaryColor}20)`,
                border: `1px solid ${themeSettings.primaryColor}30`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-full group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${themeSettings.primaryColor}20` }}
                >
                  <Plus 
                    className="h-6 w-6" 
                    style={{ color: themeSettings.primaryColor }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">New Booking</h3>
                  <p className="text-sm text-muted-foreground">Create a new shipment</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => refetchStats()}
              disabled={statsLoading}
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
                  <h3 className="font-semibold text-foreground">
                    {statsLoading ? 'Refreshing...' : 'Refresh Data'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Update dashboard stats</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setShowSubscriptionModal(true)}
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
                  <h3 className="font-semibold text-foreground">View Plans</h3>
                  <p className="text-sm text-muted-foreground">Manage subscription</p>
                </div>
              </div>
            </button>
          </div>

          {/* Recent Bookings with Modern Design */}
          <div 
            className="rounded-xl border shadow-sm"
            style={{ 
              background: 'var(--card)',
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
                      className="p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer"
                      style={{
                        background: 'var(--card)',
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
                          <p className="font-semibold text-foreground">₹{Math.round(Number(booking.totalAmount))}</p>
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
    </div>
  );
}