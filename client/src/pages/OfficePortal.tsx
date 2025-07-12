import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Booking } from "@shared/schema";
import { Plus, Download, Calendar, FileText, LogOut, Package, DollarSign, Truck, Filter } from "lucide-react";
import BookingModal from "@/components/modals/BookingModal";
import { useUserTheme } from "@/contexts/UserThemeContext";

export default function OfficePortal() {
  const { user, handleLogout } = useAuth();
  const { themeSettings } = useUserTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Initialize portal
  useEffect(() => {
    if (user?.role === 'office') {
      document.title = `Agent Portal - ${user.firstName} ${user.lastName}`;
    }
  }, [user]);

  // Fetch agent bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user
  });

  // Fetch agent stats
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user
  });

  // Filter bookings
  const filteredBookings = (bookings as Booking[]).filter((booking: Booking) => {
    const statusMatch = filterStatus === 'all' || booking.status === filterStatus;
    const dateMatch = !selectedDate || booking.createdAt?.toString().includes(selectedDate);
    return statusMatch && dateMatch;
  });

  // Download daily PDF
  const downloadPDF = useMutation({
    mutationFn: async (date: string) => {
      const response = await fetch(`/api/bookings/export-pdf?date=${date}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('PDF download failed');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${selectedDate || 'today'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "PDF Downloaded", description: "Booking report downloaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    }
  });

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get commission rate from user data
  const commissionRate = user?.commissionRate || 0;
  const monthlyRevenue = parseFloat((stats as any)?.revenue || '0');
  const monthlyCommission = (monthlyRevenue * (commissionRate as number)) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: `hsl(${themeSettings.primaryColor})` }}
              >
                Agent Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Button 
              onClick={handleLogoutClick}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              style={{ 
                borderColor: `hsl(${themeSettings.primaryColor})`,
                color: `hsl(${themeSettings.primaryColor})`
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Package className="h-4 w-4" style={{ color: `hsl(${themeSettings.primaryColor})` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(${themeSettings.primaryColor})` }}>
                {(stats as any)?.totalBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
              <Truck className="h-4 w-4" style={{ color: `hsl(${themeSettings.secondaryColor})` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(${themeSettings.secondaryColor})` }}>
                {(stats as any)?.activeShipments || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4" style={{ color: `hsl(${themeSettings.accentColor})` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(${themeSettings.accentColor})` }}>
                ₹{Math.ceil(monthlyRevenue)}
              </div>
            </CardContent>
          </Card>

          {(commissionRate as number) > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission ({commissionRate}%)</CardTitle>
                <DollarSign className="h-4 w-4" style={{ color: `hsl(${themeSettings.primaryColor})` }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: `hsl(${themeSettings.primaryColor})` }}>
                  ₹{Math.ceil(monthlyCommission)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-2"
            style={{ 
              backgroundColor: `hsl(${themeSettings.primaryColor})`,
              borderColor: `hsl(${themeSettings.primaryColor})`
            }}
          >
            <Plus className="h-4 w-4" />
            Create Booking
          </Button>
          
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button 
              onClick={() => downloadPDF.mutate(selectedDate)}
              variant="outline"
              disabled={downloadPDF.isPending}
              className="flex items-center gap-2"
              style={{ 
                borderColor: `hsl(${themeSettings.accentColor})`,
                color: `hsl(${themeSettings.accentColor})`
              }}
            >
              <Download className="h-4 w-4" />
              {downloadPDF.isPending ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="picked">Picked</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date Filter</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            {bookingsLoading ? (
              <div className="text-center py-8">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <div style={{display: 'table', width: '100%', tableLayout: 'fixed'}}>
                <div style={{display: 'table-row'}}>
                  {filteredBookings.slice(0, 2).map((booking: Booking) => (
                    <div key={booking.id} style={{display: 'table-cell', width: '50%', padding: '4px'}}>
                      <Card className="p-2 hover:shadow-md transition-shadow" style={{width: '100%', minWidth: '0'}}>
                    <div className="space-y-2">
                      {/* Header with Booking ID and Status */}
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-xs truncate">
                          #{booking.trackingNumber || booking.id}
                        </h3>
                        <Badge variant={
                          booking.status === 'delivered' ? 'default' :
                          booking.status === 'cancelled' ? 'destructive' :
                          booking.status === 'in_transit' ? 'secondary' :
                          'outline'
                        } className="text-xs px-1 py-0">
                          {(booking.status?.toUpperCase() || 'PENDING').slice(0, 3)}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="mb-1">
                        <p className="font-medium text-xs text-gray-900 truncate">{booking.senderName}</p>
                        <p className="text-xs text-gray-600 truncate">{booking.senderPhone}</p>
                      </div>

                      {/* Route Info */}
                      <div className="text-xs mb-1">
                        <div className="truncate">
                          <span className="font-medium">From: </span>
                          <span>{((booking as any).pickupAddress || booking.senderAddress)?.slice(0, 10)}...</span>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">To: </span>
                          <span>{((booking as any).deliveryAddress || booking.receiverAddress)?.slice(0, 10)}...</span>
                        </div>
                      </div>

                      {/* Amount and Date */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                        <span className="text-xs font-bold text-green-600">
                          ₹{Math.ceil(Number(booking.totalAmount || 0))}
                        </span>
                        <span className="text-xs text-gray-500">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit'}) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Card>
                    </div>
                  ))}
                </div>
                {filteredBookings.length > 2 && (
                  <div style={{display: 'table-row'}}>
                    {filteredBookings.slice(2, 4).map((booking: Booking) => (
                      <div key={booking.id} style={{display: 'table-cell', width: '50%', padding: '4px'}}>
                        <Card className="p-2 hover:shadow-md transition-shadow" style={{width: '100%', minWidth: '0'}}>
                          <div className="space-y-2">
                            {/* Header with Booking ID and Status */}
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-xs truncate">
                                #{booking.trackingNumber || booking.id}
                              </h3>
                              <Badge variant={
                                booking.status === 'delivered' ? 'default' :
                                booking.status === 'cancelled' ? 'destructive' :
                                booking.status === 'in_transit' ? 'secondary' :
                                'outline'
                              } className="text-xs px-1 py-0">
                                {(booking.status?.toUpperCase() || 'PENDING').slice(0, 3)}
                              </Badge>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-1">
                              <p className="font-medium text-xs text-gray-900 truncate">{booking.senderName}</p>
                              <p className="text-xs text-gray-600 truncate">{booking.senderPhone}</p>
                            </div>

                            {/* Route Info */}
                            <div className="text-xs mb-1">
                              <div className="truncate">
                                <span className="font-medium">From: </span>
                                <span>{((booking as any).pickupAddress || booking.senderAddress)?.slice(0, 10)}...</span>
                              </div>
                              <div className="truncate">
                                <span className="font-medium">To: </span>
                                <span>{((booking as any).deliveryAddress || booking.receiverAddress)?.slice(0, 10)}...</span>
                              </div>
                            </div>

                            {/* Amount and Date */}
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                              <span className="text-xs font-bold text-green-600">
                                ₹{Math.ceil(Number(booking.totalAmount || 0))}
                              </span>
                              <span className="text-xs text-gray-500">
                                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit'}) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
          }}
        />
      )}
    </div>
  );
}