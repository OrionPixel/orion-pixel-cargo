import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleSchema } from "@shared/schema";
import type { InsertVehicle } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Satellite, Truck } from "lucide-react";

interface VehicleFormProps {
  vehicle?: any; // For editing existing vehicle
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    mode: "onChange",
    defaultValues: vehicle ? {
      registrationNumber: vehicle.registrationNumber || "",
      vehicleType: vehicle.vehicleType || "",
      capacity: vehicle.capacity?.toString() || "",
      driverName: vehicle.driverName || "",
      driverPhone: vehicle.driverPhone || "",
      driverLicense: vehicle.driverLicense || "",
      isAvailable: vehicle.status === "available",
      autoRegisterGPS: !!vehicle.gpsDeviceId,
      gpsDeviceId: vehicle.gpsDeviceId || "",
      gpsImei: vehicle.gpsImei || "",
      gpsSimNumber: vehicle.gpsSimNumber || "",
    } : {
      registrationNumber: "",
      vehicleType: "",
      capacity: "",
      driverName: "",
      driverPhone: "",
      driverLicense: "",
      isAvailable: true,
      autoRegisterGPS: false,
      gpsDeviceId: "",
      gpsImei: "",
      gpsSimNumber: "",
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: InsertVehicle) => {
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
      const method = vehicle ? "PUT" : "POST";
      
      console.log(`Making ${method} request to ${url}`, vehicleData);
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error("API Error:", JSON.stringify(errorData));
        
        // Check for duplicate registration error
        if (response.status === 409 && errorData.error === 'DUPLICATE_REGISTRATION') {
          throw new Error('DUPLICATE_REGISTRATION');
        }
        
        throw new Error(errorData.message || `Failed to ${vehicle ? 'update' : 'create'} vehicle`);
      }

      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: `Vehicle ${vehicle ? 'Updated' : 'Created'}`,
        description: `Vehicle has been ${vehicle ? 'updated' : 'created'} successfully`,
      });
      
      // Instant cache clear for millisecond-level updates
      queryClient.removeQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      
      let errorMessage = `Failed to ${vehicle ? 'update' : 'create'} vehicle`;
      
      if (error.message === 'DUPLICATE_REGISTRATION') {
        errorMessage = "This vehicle registration number already exists. Please use a different registration number.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    console.log("Form submission triggered:", data);
    createVehicleMutation.mutate(data);
  };

  const watchAutoGPS = form.watch("autoRegisterGPS");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle registration number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Mini Truck">Mini Truck</SelectItem>
                      <SelectItem value="Tempo">Tempo</SelectItem>
                      <SelectItem value="Container">Container</SelectItem>
                      <SelectItem value="Trailer">Trailer</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle capacity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="driverLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter license number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Driver Details */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="driverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter driver name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="driverPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* GPS Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-blue-600" />
              GPS Tracking Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="autoRegisterGPS"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable GPS Tracking for this Vehicle
                    </FormLabel>
                    <FormDescription>
                      Register a GPS device with this vehicle for automatic live tracking on all bookings
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchAutoGPS && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FormField
                  control={form.control}
                  name="gpsDeviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPS Device ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter GPS device ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the GPS device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gpsImei"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter IMEI number" {...field} />
                      </FormControl>
                      <FormDescription>
                        15-digit IMEI number of GPS device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gpsSimNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIM Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SIM card number" {...field} />
                      </FormControl>
                      <FormDescription>
                        SIM card number with data plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center p-3 bg-white rounded border">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium text-gray-900 mb-1">Auto-Setup Benefits:</div>
                    <ul className="text-xs space-y-1">
                      <li>• Automatic GPS registration</li>
                      <li>• Live tracking on all bookings</li>
                      <li>• Real-time location updates</li>
                      <li>• Driver contact integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            disabled={createVehicleMutation.isPending}
            className="flex-1"
            onClick={() => {
              console.log("Button clicked - triggering form submit");
              const formValues = form.getValues();
              console.log("Current form values:", formValues);
              onSubmit(formValues);
            }}
          >
            {createVehicleMutation.isPending 
              ? (vehicle ? "Updating..." : "Creating...") 
              : (vehicle ? "Update Vehicle" : "Create Vehicle")
            }
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}