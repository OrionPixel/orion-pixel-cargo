import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useUserTheme } from "@/contexts/UserThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VehicleForm } from "@/components/forms/VehicleForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Edit, Trash2, Truck, AlertCircle, Satellite } from "lucide-react";
import type { Vehicle } from "@shared/schema";

export default function Vehicles() {
  const { user, isLoading: authLoading } = useAuth();
  const { themeSettings } = useUserTheme(); // Apply user theme
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, user, toast]);

  // Fetch vehicles - optimized for instant updates
  const { data: vehicles, isLoading, error, refetch } = useQuery<Vehicle[]>(
    ["/api/vehicles"],
    async () => {
      const response = await fetch('/api/vehicles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return response.json();
    },
    {
      enabled: !!user, // Only fetch when user is authenticated
      retry: 1,
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 30 * 1000, // 30 seconds cache
    }
  );

  // Delete vehicle mutation - optimized for instant updates
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
      
      // Instant cache clear and refetch for millisecond-level updates
      queryClient.removeQueries({ queryKey: ["/api/vehicles"] });
      queryClient.resetQueries({ queryKey: ["/api/vehicles"] });
      refetch();
    },
    onError: (error: any) => {
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
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive"
      });
    },
  });

  const filteredVehicles = vehicles?.filter((vehicle: Vehicle) => 
    vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseModal = async () => {
    setShowVehicleModal(false);
    setEditingVehicle(null);
    
    // Instant cache clear and refetch - no page reload needed
    queryClient.removeQueries({ queryKey: ["/api/vehicles"] });
    queryClient.resetQueries({ queryKey: ["/api/vehicles"] });
    
    // Force immediate fresh data fetch
    refetch();
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Vehicle Management</h2>
            <p className="text-slate-600">Manage your fleet with GPS tracking integration</p>
          </div>
          <Button 
            onClick={() => {
              setEditingVehicle(null);
              setShowVehicleModal(true);
            }} 
            style={{ backgroundColor: themeSettings.primaryColor }}
            className="text-white hover:opacity-90 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vehicle with GPS</span>
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Grid */}
        {filteredVehicles && filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle: Vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow" style={{ border: '2px solid hsl(var(--primary) / 0.3)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {vehicle.registrationNumber}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={vehicle.status === 'available' ? 'default' : 'secondary'}
                        className={vehicle.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      >
                        {vehicle.status?.toUpperCase()}
                      </Badge>
                      
                      {/* GPS Status Badge */}
                      {vehicle.gpsDeviceId ? (
                        <Badge 
                          variant="outline" 
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          GPS: {vehicle.gpsStatus?.toUpperCase() || 'INACTIVE'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          No GPS
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-medium">{vehicle.vehicleType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Capacity:</span>
                      <span className="font-medium">{vehicle.capacity} tons</span>
                    </div>
                    {vehicle.driverName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Driver:</span>
                        <span className="font-medium">{vehicle.driverName}</span>
                      </div>
                    )}
                    {vehicle.driverPhone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Phone:</span>
                        <span className="font-medium">{vehicle.driverPhone}</span>
                      </div>
                    )}
                    
                    {/* GPS Device Info */}
                    {vehicle.gpsDeviceId && (
                      <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-2 rounded">
                        <Satellite className="h-4 w-4" />
                        <span>GPS: {vehicle.gpsDeviceId}</span>
                        {vehicle.gpsImei && (
                          <span className="text-xs text-muted-foreground">• IMEI: {vehicle.gpsImei}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setShowVehicleModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                      disabled={deleteVehicleMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No vehicles found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm 
                  ? "Try adjusting your search criteria"
                  : "Add your first vehicle to get started"
                }
              </p>
              <Button 
                onClick={() => setShowVehicleModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle with GPS
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vehicle Modal */}
      <Dialog open={showVehicleModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle with GPS Integration'}
            </DialogTitle>
          </DialogHeader>
          
          <VehicleForm 
            vehicle={editingVehicle}
            onSuccess={handleCloseModal}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}