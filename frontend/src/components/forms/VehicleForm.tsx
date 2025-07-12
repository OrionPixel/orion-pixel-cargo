import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
    mode: "onChange",
    defaultValues: vehicle ? {
      registrationNumber: vehicle.registrationNumber || "",
      vehicleType: vehicle.vehicleType || "",
      capacity: vehicle.capacity?.toString() || "",
      driverName: vehicle.driverName || "",
      driverPhone: vehicle.driverPhone || "",
      driverLicense: vehicle.driverLicense || "",
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
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to ${vehicle ? 'update' : 'create'} vehicle: ${errorText}`);
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
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to ${vehicle ? 'update' : 'create'} vehicle`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    console.log("Form submission triggered:", data);
    createVehicleMutation.mutate(data);
  };

  const watchGPS = form.watch("gpsDeviceId");

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
                    <Input placeholder="DL01AB1234" {...field} value={field.value as string} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value as string}>
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
                    <Input placeholder="10 Tons" {...field} value={field.value as string} />
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
                    <Input placeholder="DL123456789" {...field} value={field.value as string} />
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
                    <Input placeholder="Driver Name" {...field} value={field.value as string} />
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
                    <Input placeholder="+91-9876543210" {...field} value={field.value as string} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <FormField
                control={form.control}
                name="gpsDeviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPS Device ID</FormLabel>
                    <FormControl>
                      <Input placeholder="GPS_TRACKER_001" {...field} value={field.value as string} />
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
                    <FormLabel>IMEI Number</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012345" {...field} value={field.value as string} />
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
                      <Input placeholder="+91-9876543210" {...field} value={field.value as string} />
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
                  <div className="font-medium text-gray-900 mb-1">GPS Setup Benefits:</div>
                  <ul className="text-xs space-y-1">
                    <li>• Live tracking on all bookings</li>
                    <li>• Real-time location updates</li>
                    <li>• Driver contact integration</li>
                    <li>• Route optimization</li>
                  </ul>
                </div>
              </div>
            </div>
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