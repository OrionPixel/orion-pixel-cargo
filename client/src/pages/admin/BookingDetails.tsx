import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Package, MapPin, User, Phone, Mail, Calendar, Truck, 
  ArrowLeft, Edit, FileText, Bell
} from "lucide-react";

interface BookingDetailsProps {
  bookingId: string;
}

function AdminBookingDetails({ bookingId }: BookingDetailsProps) {
  const { user, isLoading: authLoading } = useAuth();

  // Check authentication and admin role
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    window.location.href = "/admin-login";
    return null;
  }

  // Use new combined API for better performance (single request instead of 3)
  const { data: completeData, isLoading } = useQuery({
    queryKey: [`/api/admin/bookings/${bookingId}/complete`],
    enabled: !!user && user.role === 'admin' && !!bookingId,
    staleTime: 60000, // 1 minute cache for booking details
    gcTime: 300000, // 5 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable auto-refetch for performance
  });

  // Extract data from combined response
  const booking = completeData?.booking;
  const vehicle = completeData?.vehicle;
  const bookingUser = completeData?.user;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-text-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Booking Not Found</h1>
          <p className="text-text-secondary">The requested booking could not be found.</p>
          <Button 
            onClick={() => window.location.href = '/admin/bookings'} 
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'picked': return 'default';
      case 'in_transit': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/admin/bookings'}
              className="text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Booking Details</h1>
              <p className="text-text-secondary mt-1">#{booking.trackingNumber || `BK${booking.id}`}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = `/admin/bookings/${booking.id}/edit`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Booking
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </div>

        {/* Booking Status */}
        <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-primary-600" />
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Status</h2>
                  <Badge variant={getStatusColor(booking.status)} className="mt-1">
                    <span className="capitalize">{booking.status}</span>
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Total Amount</p>
                <p className="text-2xl font-bold text-text-primary">₹{Math.ceil(Number(booking.totalAmount || booking.totalCost || 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-text-primary">
              <MapPin className="h-5 w-5 mr-2 text-accent-600" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-secondary-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">From</p>
                  <p className="text-lg font-semibold text-text-primary">
                    {booking.pickupCity || booking.pickupLocation}
                  </p>
                  <p className="text-sm text-text-secondary">{booking.pickupPinCode}</p>
                </div>
              </div>
              
              <div className="flex-1 mx-8">
                <div className="flex items-center">
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-secondary-300 to-accent-300"></div>
                  <div className="mx-2 bg-accent-100 p-2 rounded-full">
                    <Truck className="h-4 w-4 text-accent-600" />
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-accent-300 to-primary-300"></div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-text-secondary text-right">To</p>
                  <p className="text-lg font-semibold text-text-primary text-right">
                    {booking.deliveryCity || booking.dropLocation || booking.deliveryLocation}
                  </p>
                  <p className="text-sm text-text-secondary text-right">{booking.deliveryPinCode}</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pickup Details */}
          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-text-primary">
                <MapPin className="h-5 w-5 mr-2 text-secondary-600" />
                Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-secondary">Address</p>
                <p className="text-text-primary">{booking.pickupAddress || booking.pickupLocation}</p>
                <p className="text-sm text-text-secondary">{booking.pickupCity} - {booking.pickupPinCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Date & Time</p>
                <p className="text-text-primary">
                  {booking.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Sender Information</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-text-secondary" />
                    <span className="text-text-primary">{booking.senderName}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-text-secondary" />
                    <span className="text-text-primary">{booking.senderPhone}</span>
                  </div>
                  {booking.senderEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-text-secondary" />
                      <span className="text-text-primary">{booking.senderEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-text-primary">
                <MapPin className="h-5 w-5 mr-2 text-accent-600" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-secondary">Address</p>
                <p className="text-text-primary">{booking.deliveryAddress || booking.dropLocation}</p>
                <p className="text-sm text-text-secondary">{booking.deliveryCity} - {booking.deliveryPinCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Expected Date & Time</p>
                <p className="text-text-primary">
                  {booking.deliveryDateTime ? new Date(booking.deliveryDateTime).toLocaleString() : 'To be determined'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Receiver Information</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-text-secondary" />
                    <span className="text-text-primary">{booking.receiverName}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-text-secondary" />
                    <span className="text-text-primary">{booking.receiverPhone}</span>
                  </div>
                  {booking.receiverEmail && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-text-secondary" />
                      <span className="text-text-primary">{booking.receiverEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        {bookingUser && (
          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-text-primary">
                <User className="h-5 w-5 mr-2 text-primary-600" />
                Booking Created By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-text-secondary">User Name</p>
                  <p className="text-text-primary">{bookingUser.firstName} {bookingUser.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Email</p>
                  <p className="text-text-primary">{bookingUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Role</p>
                  <Badge variant="outline" className="capitalize">
                    {bookingUser.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Office Name</p>
                  <p className="text-text-primary">{bookingUser.officeName || 'Direct Customer'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Commission Rate</p>
                  <p className="text-text-primary">{bookingUser.commissionRate ? `${bookingUser.commissionRate}%` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Subscription Plan</p>
                  <Badge variant="secondary" className="capitalize">
                    {bookingUser.subscriptionPlan || 'Basic'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Information */}
        <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-text-primary">Booking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-text-secondary">Booking Type</p>
                <p className="text-text-primary capitalize">{booking.bookingType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Weight</p>
                <p className="text-text-primary">{booking.weight || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Item Count</p>
                <p className="text-text-primary">{booking.itemCount || 1}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Cargo Description</p>
                <p className="text-text-primary">{booking.cargoDescription || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Payment Status</p>
                <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {booking.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Created At</p>
                <p className="text-text-primary">
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        {booking.vehicleId && (
          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-text-primary">
                <Truck className="h-5 w-5 mr-2 text-secondary-600" />
                Assigned Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-text-secondary">Vehicle Number</p>
                <p className="text-lg font-semibold text-text-primary">
                  {vehicle?.registrationNumber || vehicle?.vehicleNumber || booking.vehicleNumber || `Vehicle ID: ${booking.vehicleId}`}
                </p>

              </div>
              {vehicle && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Driver Name</p>
                      <p className="text-text-primary">{vehicle.driverName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Driver Phone</p>
                      <p className="text-text-primary">{vehicle.driverPhone || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Vehicle Type</p>
                      <p className="text-text-primary capitalize">{vehicle.vehicleType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Driver License</p>
                      <p className="text-text-primary">{vehicle.driverLicense || 'Not provided'}</p>
                    </div>
                  </div>
                </>
              )}
              {booking.waybillNumber && (
                <div>
                  <p className="text-sm font-medium text-text-secondary">Waybill Number</p>
                  <p className="text-text-primary">{booking.waybillNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AdminBookingDetails;