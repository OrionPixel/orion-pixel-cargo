import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Send, UserCheck, Phone, Mail, Building2, FileText, Eye, MapPin, Calendar, Package, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserTheme } from '@/contexts/UserThemeContext';

interface Contact {
  name: string;
  phone: string;
  email?: string;
  gst?: string;
  bookingCount: number;
  lastBooking: string;
  type: 'sender' | 'receiver';
  totalAmount?: number;
  bookings?: any[];
  mostUsedCity?: string;
  address?: string;
}

interface Booking {
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderGST?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverEmail?: string;
  receiverGST?: string;
  pickupCity?: string;
  pickupAddress?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  createdAt: string;
  [key: string]: any;
}

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const { themeSettings } = useUserTheme();

  // Fetch bookings to extract sender/receiver data
  const { data: bookings = [], isLoading } = useQuery<Booking[]>(
    ['/api/bookings'],
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
    }
  );

  // Process bookings to extract unique senders and receivers with detailed info
  const processContacts = (bookings: Booking[]): { senders: Contact[], receivers: Contact[] } => {
    const senderMap = new Map();
    const receiverMap = new Map();

    bookings.forEach((booking: Booking) => {
      // Process senders
      if (booking.senderName) {
        const senderKey = `${booking.senderName}-${booking.senderPhone}`;
        if (senderMap.has(senderKey)) {
          const existing = senderMap.get(senderKey);
          existing.bookingCount++;
          existing.totalAmount += Number(booking.totalAmount || 0);
          existing.bookings.push(booking);
          if (new Date(booking.createdAt) > new Date(existing.lastBooking)) {
            existing.lastBooking = booking.createdAt;
          }
        } else {
          senderMap.set(senderKey, {
            name: booking.senderName,
            phone: booking.senderPhone,
            email: booking.senderEmail,
            gst: booking.senderGST,
            address: booking.pickupCity || booking.pickupAddress,
            bookingCount: 1,
            totalAmount: Number(booking.totalAmount || 0),
            lastBooking: booking.createdAt,
            type: 'sender',
            bookings: [booking],
            mostUsedCity: booking.pickupCity
          });
        }
      }

      // Process receivers
      if (booking.receiverName) {
        const receiverKey = `${booking.receiverName}-${booking.receiverPhone}`;
        if (receiverMap.has(receiverKey)) {
          const existing = receiverMap.get(receiverKey);
          existing.bookingCount++;
          existing.totalAmount += Number(booking.totalAmount || 0);
          existing.bookings.push(booking);
          if (new Date(booking.createdAt) > new Date(existing.lastBooking)) {
            existing.lastBooking = booking.createdAt;
          }
        } else {
          receiverMap.set(receiverKey, {
            name: booking.receiverName,
            phone: booking.receiverPhone,
            email: booking.receiverEmail,
            gst: booking.receiverGST,
            address: booking.deliveryCity || booking.deliveryAddress,
            bookingCount: 1,
            totalAmount: Number(booking.totalAmount || 0),
            lastBooking: booking.createdAt,
            type: 'receiver',
            bookings: [booking],
            mostUsedCity: booking.deliveryCity
          });
        }
      }
    });

    return {
      senders: Array.from(senderMap.values()).sort((a, b) => b.bookingCount - a.bookingCount),
      receivers: Array.from(receiverMap.values()).sort((a, b) => b.bookingCount - a.bookingCount)
    };
  };

  const { senders, receivers } = processContacts(bookings);

  // Filter contacts based on search query
  const filterContacts = (contacts: Contact[]) => {
    if (!searchQuery) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredSenders = filterContacts(senders);
  const filteredReceivers = filterContacts(receivers);

  // Contact Details Modal Component
  const ContactDetailsModal = ({ contact }: { contact: Contact }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 w-8 p-0"
          style={{ borderColor: `hsl(var(--primary))` }}
        >
          <Eye className="h-4 w-4" style={{ color: `hsl(var(--primary))` }} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contact.type === 'sender' ? (
              <Send className="w-5 h-5" style={{ color: `hsl(var(--primary))` }} />
            ) : (
              <UserCheck className="w-5 h-5" style={{ color: `hsl(var(--secondary))` }} />
            )}
            {contact.name} - Full Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span>{contact.phone}</span>
              </div>
              
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span>{contact.email}</span>
                </div>
              )}
              
              {contact.gst && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">GST Number:</span>
                  <span>{contact.gst}</span>
                </div>
              )}
              
              {contact.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Primary City:</span>
                  <span>{contact.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: `hsl(var(--primary))` }} />
                  <span className="font-medium">Total Bookings:</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                  {contact.bookingCount}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" style={{ color: `hsl(var(--accent))` }} />
                  <span className="font-medium">Total Amount:</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--accent))` }}>
                  ₹{Math.ceil(contact.totalAmount || 0)}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Last Booking:</span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(contact.lastBooking).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Avg per Booking:</span>
                </div>
                <p className="text-sm font-medium">
                  ₹{Math.ceil((contact.totalAmount || 0) / contact.bookingCount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {contact.bookings?.slice(0, 5).map((booking, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded-lg border"
                    style={{ borderColor: `hsl(var(--primary) / 0.2)` }}
                  >
                    <div>
                      <p className="font-medium">Booking #{booking.trackingNumber}</p>
                      <p className="text-sm text-gray-600">
                        {booking.pickupCity} → {booking.deliveryCity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Math.ceil(booking.totalAmount || 0)}</p>
                      <Badge 
                        variant={booking.status === 'delivered' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <Card 
      className="hover:shadow-lg transition-all duration-300 border-l-4"
      style={{ borderLeftColor: `hsl(var(--primary))` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-lg" style={{ color: `hsl(var(--primary))` }}>
                {contact.name}
              </h3>
              <Badge 
                variant="secondary" 
                className="text-xs font-medium"
                style={{ 
                  backgroundColor: `hsl(var(--primary) / 0.1)`,
                  color: `hsl(var(--primary))`
                }}
              >
                {contact.bookingCount} booking{contact.bookingCount !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </div>
              
              {contact.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              
              {contact.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{contact.address}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Last: {new Date(contact.lastBooking).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: `hsl(var(--accent))` }}>
                    ₹{Math.ceil(contact.totalAmount || 0)}
                  </span>
                  <ContactDetailsModal contact={contact} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="ml-4 flex flex-col items-center gap-2">
            {contact.type === 'sender' ? (
              <Send className="w-6 h-6" style={{ color: `hsl(var(--primary))` }} />
            ) : (
              <UserCheck className="w-6 h-6" style={{ color: `hsl(var(--secondary))` }} />
            )}
            {contact.gst && (
              <Badge variant="outline" className="text-xs">
                GST
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{ color: `hsl(var(--primary))` }}
            >
              Contacts Directory
            </h1>
            <p className="text-gray-600 mt-2">Manage your senders and receivers with detailed insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                style={{ color: `hsl(var(--primary))` }}
              />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 border-2"
                style={{ borderColor: `hsl(var(--primary) / 0.2)` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className="border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: `hsl(var(--primary))` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Senders</CardTitle>
              <Send className="h-4 w-4" style={{ color: `hsl(var(--primary))` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                {senders.length}
              </div>
              <p className="text-xs text-gray-500">
                {filteredSenders.length} showing
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: `hsl(var(--secondary))` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Receivers</CardTitle>
              <UserCheck className="h-4 w-4" style={{ color: `hsl(var(--secondary))` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(var(--secondary))` }}>
                {receivers.length}
              </div>
              <p className="text-xs text-gray-500">
                {filteredReceivers.length} showing
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: `hsl(var(--accent))` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
              <Package className="h-4 w-4" style={{ color: `hsl(var(--accent))` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(var(--accent))` }}>
                {bookings.length}
              </div>
              <p className="text-xs text-gray-500">
                Unique transactions
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: `hsl(var(--primary))` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4" style={{ color: `hsl(var(--primary))` }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: `hsl(var(--primary))` }}>
                ₹{Math.ceil(bookings.reduce((acc, booking) => acc + (Number(booking.totalAmount) || 0), 0))}
              </div>
              <p className="text-xs text-gray-500">
                From all bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contacts Tabs */}
        <Tabs defaultValue="senders" className="w-full">
          <TabsList 
            className="grid w-full grid-cols-2 max-w-md mx-auto"
            style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}
          >
            <TabsTrigger 
              value="senders"
              className="flex items-center gap-2"
              style={{ 
                color: `hsl(var(--primary))`,
                fontWeight: '600'
              }}
            >
              <Send className="w-4 h-4" />
              Senders ({filteredSenders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="receivers"
              className="flex items-center gap-2"
              style={{ 
                color: `hsl(var(--secondary))`,
                fontWeight: '600'
              }}
            >
              <UserCheck className="w-4 h-4" />
              Receivers ({filteredReceivers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="senders" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold" style={{ color: `hsl(var(--primary))` }}>
                  Sender Contacts
                </h2>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `hsl(var(--primary) / 0.1)`,
                    color: `hsl(var(--primary))`
                  }}
                >
                  {filteredSenders.length} contacts
                </Badge>
              </div>
              
              {filteredSenders.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No senders found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search terms.' : 'Create your first booking to see sender contacts.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSenders.map((sender, index) => (
                    <ContactCard key={index} contact={sender} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="receivers" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold" style={{ color: `hsl(var(--secondary))` }}>
                  Receiver Contacts
                </h2>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `hsl(var(--secondary) / 0.1)`,
                    color: `hsl(var(--secondary))`
                  }}
                >
                  {filteredReceivers.length} contacts
                </Badge>
              </div>
              
              {filteredReceivers.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No receivers found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search terms.' : 'Create your first booking to see receiver contacts.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReceivers.map((receiver, index) => (
                    <ContactCard key={index} contact={receiver} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}