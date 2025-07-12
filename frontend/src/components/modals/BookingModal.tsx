import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Truck, MapPin, Package, CreditCard, ArrowLeft, ArrowRight, Calculator, Loader2 } from "lucide-react";
import { fetchPinCode } from "../../utils/pincodeDatabase";

const bookingFormSchema = z.object({
  senderName: z.string().min(1, "Sender name is required"),
  senderPhone: z.string().min(10, "Valid phone number required"),
  senderEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  senderGst: z.string().optional(),
  senderAddress: z.string().min(1, "Sender address is required"),
  senderCity: z.string().min(1, "Sender city is required"),
  senderState: z.string().min(1, "Sender state is required"),
  senderPincode: z.string().min(6, "Valid pincode required"),
  
  receiverName: z.string().min(1, "Receiver name is required"),
  receiverPhone: z.string().min(10, "Valid phone number required"),
  receiverEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  receiverGst: z.string().optional(),
  receiverAddress: z.string().min(1, "Receiver address is required"),
  receiverCity: z.string().min(1, "Receiver city is required"),
  receiverState: z.string().min(1, "Receiver state is required"),
  receiverPincode: z.string().min(6, "Valid pincode required"),
  
  itemType: z.string().min(1, "Item type is required"),
  weight: z.number().min(0.1, "Weight must be greater than 0"),
  dimensions: z.string().optional(),
  serviceType: z.enum(["ftl", "ltl", "part_load"]),
  estimatedDeliveryDate: z.string().min(1, "Delivery date is required"),
  specialInstructions: z.string().optional(),
  vehicleId: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
}

export default function BookingModal({ isOpen, onClose, onBookingCreated }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<any>(null);
  const [pricing, setPricing] = useState({ 
    baseAmount: 0, 
    gstAmount: 0, 
    totalAmount: 0 
  });
  const [useAutoRate, setUseAutoRate] = useState(true);
  const [baseRatePerKm, setBaseRatePerKm] = useState(15);
  const { toast } = useToast();
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType: "ftl",
      estimatedDeliveryDate: getTodayDateTimeIST(),
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
  });



  // Get today's date in IST timezone formatted for datetime-local input
  function getTodayDateTimeIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().slice(0, 16);
  }

  const calculatePricing = (data: BookingFormValues) => {
    if (!useAutoRate) {
      return pricing;
    }

    const baseAmount = data.weight * baseRatePerKm;
    const gstAmount = baseAmount * 0.18;
    const totalAmount = baseAmount + gstAmount;

    return {
      baseAmount: Math.round(baseAmount),
      gstAmount: Math.round(gstAmount),
      totalAmount: Math.round(totalAmount)
    };
  };

  // Auto-fetch pin code with enhanced debugging
  const handleCityChange = (city: string, field: 'senderPincode' | 'receiverPincode') => {
    console.log('🚀 HANDLE CITY CHANGE CALLED:', { city, field });
    
    if (!city || city.trim().length === 0) {
      console.log('⚠️ Empty city provided, returning early');
      return;
    }
    
    console.log('🏠 PIN CODE AUTO-FETCH: Starting for city:', city);
    
    try {
      console.log('📊 Testing fetchPinCode function...');
      const pinCode = fetchPinCode(city);
      
      console.log('🏠 PIN CODE RESULT:', { 
        originalCity: city, 
        normalizedCity: city.toLowerCase().trim(),
        foundPinCode: pinCode,
        fieldTarget: field
      });

      if (pinCode && pinCode.length > 0) {
        console.log('✅ PIN CODE FOUND - Applying to form:', pinCode);
        form.setValue(field, pinCode);
        console.log('✅ PIN CODE APPLIED:', pinCode, 'to field:', field);
        
        // Show toast to confirm
        toast({
          title: "PIN Code Auto-filled",
          description: `${city} → ${pinCode}`,
        });
      } else {
        console.log('❌ PIN CODE NOT FOUND for city:', city);
        console.log('💡 Try cities like: mumbai, delhi, pune, bangalore, lakhimpur, pratapgarh');
      }
    } catch (error) {
      console.error('🏠 PIN CODE FETCH ERROR:', error);
    }
  };

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const calculatedPricing = calculatePricing(data);
      
      const bookingPayload = {
        ...data,
        ...calculatedPricing,
        trackingNumber: `LGF${Date.now()}`,
        status: "pending",
        paymentStatus: "pending"
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      return response.json();
    },
    onSuccess: (booking: any) => {
      toast({
        title: "Booking Created Successfully",
        description: `Tracking Number: ${booking.trackingNumber}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
      
      setStep(1);
      setBookingData(null);
      onClose();
      
      if (onBookingCreated) {
        onBookingCreated(booking);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onNext = (data: BookingFormValues) => {
    const calculatedPricing = calculatePricing(data);
    setPricing(calculatedPricing);
    setBookingData(data);
    setStep(2);
  };

  const resetForm = () => {
    form.reset();
    setPricing({ baseAmount: 0, gstAmount: 0, totalAmount: 0 });
    setUseAutoRate(true);
    setBaseRatePerKm(15);
    setStep(1);
    setBookingData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New Booking - Step {step} of 2
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
              {/* Sender Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Sender Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name / Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter sender name or company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderGst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GST number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter city name (e.g., mumbai, delhi)" 
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              handleCityChange(e.target.value, 'senderPincode');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="senderPincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PIN code (auto-filled from city)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Receiver Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Receiver Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="receiverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name / Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter receiver name or company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverGst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GST number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter city name (e.g., mumbai, delhi)" 
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              handleCityChange(e.target.value, 'receiverPincode');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiverPincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PIN code (auto-filled from city)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Shipment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Shipment Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="itemType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Electronics, Furniture" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="Enter weight"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="L x W x H (cm)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ftl">Full Truck Load (FTL)</SelectItem>
                            <SelectItem value="ltl">Less Than Truck Load (LTL)</SelectItem>
                            <SelectItem value="part_load">Part Load</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Delivery Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            min={getTodayDateTimeIST()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any special handling instructions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {vehicles && Array.isArray(vehicles) && vehicles.length > 0 ? (
                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Vehicle (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicles.map((vehicle: any) => (
                              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.vehicleNumber} - {vehicle.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>

              {/* Pricing Configuration */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Pricing Configuration
                </h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useAutoRate"
                    checked={useAutoRate}
                    onChange={(e) => setUseAutoRate(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="useAutoRate">Use automatic rate calculation</Label>
                </div>
                
                {useAutoRate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="baseRate">Base Rate per KG (₹)</Label>
                      <Input
                        id="baseRate"
                        type="number"
                        value={baseRatePerKm}
                        onChange={(e) => setBaseRatePerKm(parseFloat(e.target.value) || 15)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        <p>Base: ₹{Math.round(form.watch("weight") * baseRatePerKm)}</p>
                        <p>GST (18%): ₹{Math.round(form.watch("weight") * baseRatePerKm * 0.18)}</p>
                        <p className="font-semibold">Total: ₹{Math.round(form.watch("weight") * baseRatePerKm * 1.18)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 2 && bookingData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Review & Confirm Booking</h3>
              <p className="text-gray-600">Please review the details before confirming</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>From:</strong> {bookingData.senderCity}, {bookingData.senderState}</p>
                  <p><strong>To:</strong> {bookingData.receiverCity}, {bookingData.receiverState}</p>
                  <p><strong>Service:</strong> {bookingData.serviceType.toUpperCase()}</p>
                  <p><strong>Weight:</strong> {bookingData.weight} kg</p>
                  <p><strong>Item:</strong> {bookingData.itemType}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Pricing Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₹{Math.round(pricing.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{Math.round(pricing.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{Math.round(pricing.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={() => createBookingMutation.mutate(bookingData)}
                disabled={createBookingMutation.isPending}
                className="flex items-center gap-2"
              >
                {createBookingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}