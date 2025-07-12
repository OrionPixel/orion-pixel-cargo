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
  const { data: vehicles, isLoading, error, refetch } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: !!user, // Only fetch when user is authenticated
    retry: 1,
    refetchInterval: false, // Disable auto-refetch
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30 * 1000, // 30 seconds cache
    gcTime: 2 * 60 * 1000, // 2 minutes memory
  });

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

  const filteredVehicles = vehicles?.filter(vehicle => 
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
      {/* Mobile-responsive Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Vehicle Management</h2>
            <p className="text-sm sm:text-base text-slate-600 hidden sm:block">Manage your fleet with GPS tracking integration</p>
          </div>
          <Button 
            onClick={() => {
              setEditingVehicle(null);
              setShowVehicleModal(true);
            }} 
            style={{ backgroundColor: themeSettings.primaryColor }}
            className="text-white hover:opacity-90 flex items-center justify-center space-x-2 w-full sm:w-auto button-mobile"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 icon-mobile" />
            <span className="text-sm sm:text-base">Add Vehicle with GPS</span>
          </Button>
        </div>
      </header>

      <div className="p-3 sm:p-6">
        {/* Mobile-responsive Search */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="relative search-input-mobile">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4 icon-mobile" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 text-sm form-input-mobile"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Grid - Role Management Card Style */}
        {filteredVehicles && filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-primary/10 hover:border-primary/30 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${themeSettings.primaryColor}15` }}
                      >
                        <Truck 
                          className="h-6 w-6"
                          style={{ color: themeSettings.primaryColor }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{vehicle.registrationNumber}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.vehicleType}</p>
                      </div>
                    </div>
                    <Badge 
                      className={`${vehicle.status === 'available' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {vehicle.status?.toUpperCase()}
                    </Badge>
                  </div>



                  {/* Vehicle Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div 
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: `${themeSettings.primaryColor}08` }}
                    >
                      <div className="text-lg font-bold text-foreground">
                        {vehicle.capacity}
                      </div>
                      <div className="text-xs text-muted-foreground">Tons</div>
                    </div>
                    <div 
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: `${themeSettings.secondaryColor}15` }}
                    >
                      <div className="text-lg font-bold text-foreground">
                        {vehicle.gpsDeviceId ? 'GPS' : 'NO GPS'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.gpsDeviceId ? vehicle.gpsStatus?.toUpperCase() || 'INACTIVE' : 'Device'}
                      </div>
                    </div>
                  </div>

                  {/* GPS Device Info */}
                  {vehicle.gpsDeviceId && (
                    <div 
                      className="flex items-center gap-2 text-sm p-3 rounded-lg mb-4"
                      style={{ 
                        backgroundColor: `${themeSettings.primaryColor}10`,
                        color: themeSettings.primaryColor 
                      }}
                    >
                      <Satellite className="h-4 w-4" />
                      <span>GPS ID: {vehicle.gpsDeviceId}</span>
                      {vehicle.gpsImei && (
                        <span className="text-xs opacity-70">• IMEI: {vehicle.gpsImei}</span>
                      )}
                    </div>
                  )}

                  {/* Driver Info */}
                  {(vehicle.driverName || vehicle.driverPhone) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-foreground mb-1">Driver Information</div>
                      {vehicle.driverName && (
                        <div className="text-sm text-muted-foreground">{vehicle.driverName}</div>
                      )}
                      {vehicle.driverPhone && (
                        <div className="text-sm text-muted-foreground">{vehicle.driverPhone}</div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 group-hover:border-primary/30"
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setShowVehicleModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
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