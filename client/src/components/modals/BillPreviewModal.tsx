import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, Calendar, MapPin, Package, User, Phone, Mail, FileText, Truck, IndianRupee } from 'lucide-react';
import { downloadBookingBill } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Booking } from '@shared/schema';

interface BillPreviewModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  officeName?: string;
}

export default function BillPreviewModal({ 
  booking, 
  isOpen, 
  onOpenChange,
  officeName = "LogiGoFast Logistics"
}: BillPreviewModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  if (!booking) return null;

  // Debug booking GST data
  console.log('🔍 Bill Preview Booking Data:', {
    bookingId: booking.id,
    senderGST: booking.senderGST,
    receiverGST: booking.receiverGST,
    senderEmail: booking.senderEmail,
    receiverEmail: booking.receiverEmail,
    userGST: user?.gstNumber,
    userOfficeName: user?.officeName,
    vehicleId: booking.vehicleId,
    vehicleInfo: booking.vehicleInfo,
    vehicleRegistration: (booking as any).vehicleRegistration,
    vehicleType: (booking as any).vehicleType,
    driverName: (booking as any).driverName
  });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return '₹0';
    return `₹${Math.ceil(Number(amount)).toLocaleString('en-IN')}`;
  };

  const handleDownloadBill = () => {
    try {
      downloadBookingBill(booking, user?.officeName || officeName, user?.gstNumber ?? undefined, user);
      toast({
        title: "Bill Downloaded",
        description: `Bill for booking ${booking.bookingId || `BK-${booking.id}`} has been downloaded successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'picked': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'booked': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Bill Preview
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Review bill details before downloading
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(booking.status || 'booked')}>
              {booking.status?.replace('_', ' ').toUpperCase() || 'BOOKED'}
            </Badge>
            <Badge className={getPaymentStatusColor(booking.paymentStatus || 'pending')}>
              {booking.paymentStatus?.toUpperCase() || 'PENDING'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Header */}
          <div className="text-white p-6 rounded-lg" style={{backgroundColor: 'hsl(var(--primary))'}}>
            <h1 className="text-3xl font-bold">{user?.officeName || officeName}</h1>
            <p className="text-white/80 text-lg mt-1">CARGO BOOKING BILL</p>
            {user?.gstNumber && (
              <p className="text-white/70 text-sm mt-1">GST: <span className="text-white font-semibold">{user.gstNumber}</span></p>
            )}
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-white/80">Bill No: <span className="text-white font-semibold">{booking.bookingId || `BK-${booking.id}`}</span></p>
                <p className="text-white/80">Tracking: <span className="text-white font-semibold">{booking.trackingNumber || 'N/A'}</span></p>
              </div>
              <div className="text-right">
                <p className="text-white/80">Date: <span className="text-white font-semibold">{formatDate(booking.createdAt)}</span></p>
                <p className="text-white/80">Type: <span className="text-white font-semibold">{booking.bookingType?.replace('_', ' ').toUpperCase() || 'FTL'}</span></p>
              </div>
            </div>
          </div>

          {/* Sender & Receiver Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sender Details */}
            <div className="bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                SENDER DETAILS
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span className="ml-2 text-gray-700">{booking.senderName || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2 text-gray-700">{booking.senderPhone || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2 text-gray-700">{booking.senderEmail || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">GST:</span>
                  <span className="ml-2 text-gray-700">{booking.senderGST || 'N/A'}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="ml-2 text-gray-700 text-sm">{booking.pickupAddress || 'N/A'}</p>
                    <p className="ml-2 text-gray-700 text-sm">{booking.pickupCity || 'N/A'} - {booking.pickupPinCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receiver Details */}
            <div className="bg-gray-50 p-5 rounded-lg border">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                RECEIVER DETAILS
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span className="ml-2 text-gray-700">{booking.receiverName || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2 text-gray-700">{booking.receiverPhone || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2 text-gray-700">{booking.receiverEmail || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">GST:</span>
                  <span className="ml-2 text-gray-700">{booking.receiverGST || 'N/A'}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="ml-2 text-gray-700 text-sm">{booking.deliveryAddress || 'N/A'}</p>
                    <p className="ml-2 text-gray-700 text-sm">{booking.deliveryCity || 'N/A'} - {booking.deliveryPinCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo & Transport Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cargo Details */}
            <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-orange-600" />
                CARGO DETAILS
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Description:</span>
                  <span className="ml-2 text-gray-700">{booking.cargoDescription || 'General Cargo'}</span>
                </div>
                <div>
                  <span className="font-medium">Weight:</span>
                  <span className="ml-2 text-gray-700">{booking.weight || 0} kg</span>
                </div>
                <div>
                  <span className="font-medium">Items:</span>
                  <span className="ml-2 text-gray-700">{booking.itemCount || 1}</span>
                </div>
              </div>
            </div>

            {/* Transport Details */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                TRANSPORT DETAILS
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Pickup:</span>
                  <span className="ml-2 text-gray-700">{formatDate(booking.pickupDateTime)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Delivery:</span>
                  <span className="ml-2 text-gray-700">{formatDate(booking.deliveryDateTime)}</span>
                </div>
                <div>
                  <span className="font-medium">Distance:</span>
                  <span className="ml-2 text-gray-700">{booking.distance || 0} km</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">Vehicle Number:</span>
                  <span className="ml-2 text-gray-700 font-mono bg-gray-200 px-2 py-1 rounded">
                    {booking.vehicleInfo?.registration || booking.vehicleRegistration || 'To be assigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
              <IndianRupee className="h-6 w-6 mr-2 text-green-600" />
              BILLING DETAILS
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Base Transportation Rate:</span>
                  <span className="font-bold">{formatCurrency(booking.baseRate)}</span>
                </div>
                {booking.handlingCharges && Number(booking.handlingCharges) > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Handling Charges:</span>
                    <span className="font-bold">{formatCurrency(booking.handlingCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">GST (18%):</span>
                  <span className="font-bold">{formatCurrency(booking.gstAmount)}</span>
                </div>
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-green-700">Total Amount:</span>
                  <span className="font-bold text-green-700 text-xl">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold text-gray-800 mb-2">Payment Information</h4>
                <p className="text-sm text-gray-600">
                  Status: <span className={`font-semibold ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {booking.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Service Provider:</strong> {user?.officeName || user?.firstName + ' ' + user?.lastName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>GST:</strong> {user?.gstNumber || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  For support: {user?.email} | {user?.phone || '+91 7000758030'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleDownloadBill}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4" />
              Download Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}