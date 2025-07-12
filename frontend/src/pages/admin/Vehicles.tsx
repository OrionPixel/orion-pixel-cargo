import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Truck, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, CheckCircle, XCircle, 
  Plus, Download, Fuel, MapPin, Calendar, Activity, Settings, User, Phone, Mail,
  CreditCard, FileText, Clock, Navigation
} from "lucide-react";

function AdminVehicles() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["/api/admin/vehicles"],
    enabled: !!user && user.role === 'admin',
  });

  const updateVehicleStatusMutation = useMutation({
    mutationFn: async ({ vehicleId, status }: { vehicleId: string; status: string }) => {
      return await apiRequest(`/api/admin/vehicles/${vehicleId}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      toast({ title: "Success", description: "Vehicle status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const filteredVehicles = (vehicles as any[]).filter((vehicle: any) => {
    const matchesSearch = vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: (vehicles as any[]).length,
    active: (vehicles as any[]).filter((v: any) => v.status === 'available').length,
    maintenance: (vehicles as any[]).filter((v: any) => v.status === 'maintenance').length,
    inactive: (vehicles as any[]).filter((v: any) => !v.isActive).length,
    onTrip: (vehicles as any[]).filter((v: any) => v.status === 'in_transit').length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Vehicle Management</h1>
            <p className="text-text-secondary mt-1">Manage and monitor fleet vehicles</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-secondary-200 p-2 rounded-lg">
              <Button variant="ghost" size="sm" className="text-secondary-600 hover:bg-secondary-100">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="bg-primary-500 p-2 rounded-lg">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:text-primary-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Truck className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Total Vehicles</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-secondary-100 p-3 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-secondary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Active</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-accent-100 p-3 rounded-lg">
                  <Activity className="h-8 w-8 text-accent-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">On Trip</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.onTrip}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Settings className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Maintenance</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.maintenance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-accent-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-accent-100 p-3 rounded-lg">
                  <XCircle className="h-8 w-8 text-accent-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">Inactive</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/70 backdrop-blur-sm border border-primary-200 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-text-primary">Vehicle List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder="Search vehicles by number or driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary-200 focus:border-primary-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-primary-200 focus:border-primary-500">
                  <Filter className="h-4 w-4 mr-2 text-primary-600" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_trip">On Trip</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>GPS Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle: any) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <Truck className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{vehicle.registrationNumber}</p>
                          <p className="text-sm text-text-secondary">{vehicle.vehicleType || 'Truck'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="bg-secondary-100 p-1 rounded-lg">
                          <User className="h-4 w-4 text-secondary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{vehicle.ownerName || 'Unknown Owner'}</p>
                          <p className="text-sm text-text-secondary">{vehicle.ownerEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-text-primary">{vehicle.driverName || 'No Driver Assigned'}</p>
                        <p className="text-sm text-text-secondary">{vehicle.driverPhone || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-secondary-300 text-secondary-700">
                        {vehicle.vehicleType || 'Truck'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        vehicle.status === 'available' ? 'default' :
                        vehicle.status === 'in_transit' ? 'secondary' : 
                        vehicle.status === 'maintenance' ? 'destructive' : 'outline'
                      }>
                        {vehicle.status || 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-text-secondary">
                        <Navigation className="h-3 w-3 mr-1 text-accent-500" />
                        <Badge variant={vehicle.gpsStatus === 'active' ? 'default' : 'outline'} className="text-xs">
                          {vehicle.gpsStatus || 'inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateVehicleStatusMutation.mutate({
                            vehicleId: vehicle.id,
                            status: vehicle.isActive ? 'maintenance' : 'available'
                          })}
                          disabled={updateVehicleStatusMutation.isPending}
                        >
                          {vehicle.isActive ? (
                            <XCircle className="h-4 w-4 text-accent-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-secondary-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vehicle Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary-600" />
                <span>Vehicle Details - {selectedVehicle?.registrationNumber}</span>
              </DialogTitle>
              <DialogDescription>
                Complete vehicle information and statistics
              </DialogDescription>
            </DialogHeader>

            {selectedVehicle && (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">Registration Number:</span>
                          <span>{selectedVehicle.registrationNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-secondary-600" />
                          <span className="font-medium">Vehicle Type:</span>
                          <Badge variant="outline">{selectedVehicle.vehicleType}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-accent-600" />
                          <span className="font-medium">Status:</span>
                          <Badge variant={
                            selectedVehicle.status === 'available' ? 'default' :
                            selectedVehicle.status === 'in_transit' ? 'secondary' : 
                            selectedVehicle.status === 'maintenance' ? 'destructive' : 'outline'
                          }>
                            {selectedVehicle.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Navigation className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">GPS Status:</span>
                          <Badge variant={selectedVehicle.gpsStatus === 'active' ? 'default' : 'outline'}>
                            {selectedVehicle.gpsStatus || 'inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Fuel className="h-4 w-4 text-accent-600" />
                          <span className="font-medium">Capacity:</span>
                          <span>{selectedVehicle.capacity || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-secondary-600" />
                          <span className="font-medium">Added:</span>
                          <span>{selectedVehicle.createdAt ? new Date(selectedVehicle.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">Last Updated:</span>
                          <span>{selectedVehicle.updatedAt ? new Date(selectedVehicle.updatedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-accent-600" />
                          <span className="font-medium">Active:</span>
                          <Badge variant={selectedVehicle.isActive ? 'default' : 'outline'}>
                            {selectedVehicle.isActive ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">Owner Name:</span>
                          <span>{selectedVehicle.ownerName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-secondary-600" />
                          <span className="font-medium">Email:</span>
                          <span>{selectedVehicle.ownerEmail || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-accent-600" />
                          <span className="font-medium">Phone:</span>
                          <span>{selectedVehicle.ownerPhone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">User ID:</span>
                          <span className="text-xs text-gray-500">{selectedVehicle.userId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Driver Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Driver Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">Driver Name:</span>
                          <span>{selectedVehicle.driverName || 'No Driver Assigned'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-secondary-600" />
                          <span className="font-medium">Driver Phone:</span>
                          <span>{selectedVehicle.driverPhone || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-accent-600" />
                          <span className="font-medium">License Number:</span>
                          <span>{selectedVehicle.driverLicense || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-primary-600" />
                          <span className="font-medium">Current Location:</span>
                          <span>{selectedVehicle.currentLocation || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Details */}
                {(selectedVehicle.model || selectedVehicle.year || selectedVehicle.fuelType || selectedVehicle.mileage) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Technical Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {selectedVehicle.model && (
                            <div className="flex items-center space-x-2">
                              <Truck className="h-4 w-4 text-primary-600" />
                              <span className="font-medium">Model:</span>
                              <span>{selectedVehicle.model}</span>
                            </div>
                          )}
                          {selectedVehicle.year && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-secondary-600" />
                              <span className="font-medium">Year:</span>
                              <span>{selectedVehicle.year}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {selectedVehicle.fuelType && (
                            <div className="flex items-center space-x-2">
                              <Fuel className="h-4 w-4 text-accent-600" />
                              <span className="font-medium">Fuel Type:</span>
                              <span>{selectedVehicle.fuelType}</span>
                            </div>
                          )}
                          {selectedVehicle.mileage && (
                            <div className="flex items-center space-x-2">
                              <Navigation className="h-4 w-4 text-primary-600" />
                              <span className="font-medium">Mileage:</span>
                              <span>{selectedVehicle.mileage} km/l</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setIsDetailsModalOpen(false)}>
                Edit Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AdminVehicles;