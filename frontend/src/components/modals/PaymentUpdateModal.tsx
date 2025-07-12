import { useState } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";
import { CreditCard, Banknote, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { Booking } from "@shared/schema";

const paymentUpdateSchema = z.object({
  paymentMethod: z.enum(["cash", "online", "pending", "free"]),
  paymentStatus: z.enum(["paid", "pending", "failed", "free"]),
  paidAmount: z.number().min(0, "Paid amount cannot be negative"),
  transactionId: z.string().optional(),
  paymentNotes: z.string().optional(),
});

type PaymentUpdateFormValues = z.infer<typeof paymentUpdateSchema>;

interface PaymentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export default function PaymentUpdateModal({ isOpen, onClose, booking }: PaymentUpdateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentUpdateFormValues>({
    resolver: zodResolver(paymentUpdateSchema)
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentUpdateFormValues) => {
      if (!booking) throw new Error("No booking selected");
      
      const updateData = {
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        paidAmount: booking.totalAmount, // Always use the booking's total amount
        transactionId: data.transactionId || '',
        paymentNotes: data.paymentNotes || ''
      };
      
      await apiRequest('PUT', `/api/bookings/${booking.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment status updated successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update payment. Please try again.",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: PaymentUpdateFormValues) => {
    updatePaymentMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Update form values when booking changes or modal opens
  React.useEffect(() => {
    if (booking && isOpen) {

      
      form.reset({
        paymentMethod: booking.paymentMethod || 'cash',
        paymentStatus: 'paid', // Default to paid for new bookings
        paidAmount: parseFloat(booking.totalAmount || '0'), // Always use total amount
        transactionId: booking.transactionId || '',
        paymentNotes: booking.paymentNotes || ''
      });
    }
  }, [booking, isOpen, form]);

  // Watch payment method and auto-update payment status
  const watchedPaymentMethod = form.watch('paymentMethod');
  React.useEffect(() => {
    if (watchedPaymentMethod) {
      let newStatus: 'paid' | 'pending' | 'failed' | 'free' = 'paid';
      if (watchedPaymentMethod === 'pending') {
        newStatus = 'pending';
      } else if (watchedPaymentMethod === 'free') {
        newStatus = 'free';
      }
      form.setValue('paymentStatus', newStatus);
    }
  }, [watchedPaymentMethod, form]);

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Update Payment - {booking.bookingId}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Route:</span> {booking.pickupCity} → {booking.deliveryCity}
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span> 
                    <span className="text-lg font-bold text-green-600 ml-2">
                      ₹{Math.ceil(parseFloat(booking.totalAmount))}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Customer:</span> {booking.senderName}
                  </div>
                  <div>
                    <span className="font-medium">Current Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      booking.paymentStatus === 'free' ? 'bg-blue-100 text-blue-800' :
                      booking.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.paymentStatus === 'paid' ? '✓ Paid' :
                       booking.paymentStatus === 'free' ? 'Free' :
                       booking.paymentStatus === 'failed' ? '✗ Failed' : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="col-span-2 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Total Payment Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{Math.ceil(parseFloat(booking?.totalAmount || '0'))}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      <div className="flex justify-between">
                        <span>Base Rate: ₹{Math.ceil(parseFloat(booking?.baseRate || '0'))}</span>
                        <span>GST (18%): ₹{Math.ceil(parseFloat(booking?.gstAmount || '0'))}</span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      📌 This amount is calculated from the booking and cannot be changed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Update Form */}
            <Card>
              <CardHeader>
                <CardTitle>Update Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Cash Payment
                              </div>
                            </SelectItem>
                            <SelectItem value="online">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Online Payment
                              </div>
                            </SelectItem>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Payment Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="free">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Free Booking
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="text"
                              value={
                                field.value === 'paid' ? '✓ Payment Completed' :
                                field.value === 'free' ? '○ Free Booking' :
                                field.value === 'failed' ? '✗ Payment Failed' : 
                                '⏳ Payment Pending'
                              }
                              readOnly
                              className={`bg-gray-50 font-medium cursor-not-allowed ${
                                field.value === 'paid' ? 'text-green-600' :
                                field.value === 'free' ? 'text-blue-600' :
                                field.value === 'failed' ? 'text-red-600' : 
                                'text-yellow-600'
                              }`}
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Auto
                              </span>
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-600">
                          Status updates automatically based on payment method selection
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>Payment Amount (₹)</FormLabel>
                    <div className="relative">
                      <Input
                        type="text"
                        value={`₹${Math.ceil(parseFloat(booking?.totalAmount || '0'))}`}
                        readOnly
                        className="bg-gray-50 font-semibold text-lg text-green-600 cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Fixed
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Amount is automatically set from booking calculation and cannot be modified
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Transaction reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional payment details or notes..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePaymentMutation.isPending}>
                {updatePaymentMutation.isPending ? 'Updating...' : 'Update Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}