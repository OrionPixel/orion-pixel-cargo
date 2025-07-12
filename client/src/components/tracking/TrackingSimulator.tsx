import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  MapPin, 
  Truck, 
  Route,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TrackingSimulatorProps {
  bookingId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function TrackingSimulator({ bookingId, isOpen, onClose }: TrackingSimulatorProps) {
  const [simulationData, setSimulationData] = useState({
    currentLatitude: 28.6139,
    currentLongitude: 77.2090,
    currentSpeed: 45,
    heading: 180,
    altitude: 250,
    accuracy: 5,
    routeProgress: 25,
    distanceToDestination: 150,
    driverName: 'Raj Kumar',
    driverPhone: '+91-9876543210',
    vehicleNumber: 'DL01AB1234',
    batteryLevel: 85,
    signalStrength: 75,
    temperature: 22.5
  });

  const [routeData, setRouteData] = useState({
    deviationDistance: 0,
    deviationTime: 0,
    routeScore: 8.5,
    fuelConsumption: 12.5,
    carbonFootprint: 2.8
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLiveTrackingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/bookings/${bookingId}/live-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create live tracking');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Live Tracking Started",
        description: "Simulation data has been initialized successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'live-tracking'] });
    }
  });

  const updateLiveTrackingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/bookings/${bookingId}/live-tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update live tracking');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Live tracking data has been updated"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'live-tracking'] });
    }
  });

  const createTrackingEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/bookings/${bookingId}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create tracking event');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tracking Event Added",
        description: "New tracking event has been recorded"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'tracking'] });
    }
  });

  const createRouteMonitoringMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/bookings/${bookingId}/route-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create route monitoring');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Route Monitoring Started",
        description: "Route optimization data has been initialized"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'route-monitoring'] });
    }
  });

  const startSimulation = () => {
    // Initialize live tracking
    createLiveTrackingMutation.mutate({
      ...simulationData,
      isActive: true,
      estimatedArrival: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
    });

    // Create initial tracking event
    createTrackingEventMutation.mutate({
      status: 'in_transit',
      location: 'Highway NH-1, Delhi',
      latitude: simulationData.currentLatitude,
      longitude: simulationData.currentLongitude,
      notes: 'Live tracking started - vehicle en route',
      isLiveUpdate: true,
      actualSpeed: simulationData.currentSpeed,
      distanceRemaining: simulationData.distanceToDestination,
      driverName: simulationData.driverName,
      driverPhone: simulationData.driverPhone,
      vehicleNumber: simulationData.vehicleNumber,
      batteryLevel: simulationData.batteryLevel,
      signalStrength: simulationData.signalStrength
    });

    // Initialize route monitoring
    createRouteMonitoringMutation.mutate({
      ...routeData,
      plannedRoute: JSON.stringify([
        { lat: 28.6139, lng: 77.2090 },
        { lat: 29.0588, lng: 76.0856 },
        { lat: 30.3165, lng: 78.0322 }
      ]),
      actualRoute: JSON.stringify([
        { lat: simulationData.currentLatitude, lng: simulationData.currentLongitude }
      ]),
      trafficConditions: JSON.stringify({
        current: 'moderate',
        forecast: 'light',
        incidents: []
      }),
      weatherConditions: JSON.stringify({
        temperature: simulationData.temperature,
        conditions: 'clear',
        visibility: 'good'
      })
    });
  };

  const simulateMovement = () => {
    // Simulate vehicle movement
    const newLat = simulationData.currentLatitude + (Math.random() - 0.5) * 0.01;
    const newLng = simulationData.currentLongitude + (Math.random() - 0.5) * 0.01;
    const newProgress = Math.min(100, simulationData.routeProgress + Math.random() * 10);
    const newDistance = Math.max(0, simulationData.distanceToDestination - Math.random() * 20);

    const updatedData = {
      ...simulationData,
      currentLatitude: newLat,
      currentLongitude: newLng,
      routeProgress: newProgress,
      distanceToDestination: newDistance,
      currentSpeed: 40 + Math.random() * 20 // 40-60 km/h
    };

    setSimulationData(updatedData);
    updateLiveTrackingMutation.mutate(updatedData);

    // Create periodic tracking events
    createTrackingEventMutation.mutate({
      status: 'in_transit',
      location: `Kilometer ${Math.floor(newProgress * 2)}`,
      latitude: newLat,
      longitude: newLng,
      notes: `Vehicle position updated - ${newProgress.toFixed(1)}% complete`,
      isLiveUpdate: true,
      actualSpeed: updatedData.currentSpeed,
      distanceRemaining: newDistance
    });
  };

  const simulateDelivery = () => {
    createTrackingEventMutation.mutate({
      status: 'delivered',
      location: 'Destination Address',
      latitude: simulationData.currentLatitude,
      longitude: simulationData.currentLongitude,
      notes: 'Package delivered successfully to recipient',
      isLiveUpdate: false
    });

    // Deactivate live tracking
    updateLiveTrackingMutation.mutate({
      isActive: false,
      routeProgress: 100,
      distanceToDestination: 0
    });
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-blue-600" />
          Live Tracking Simulator - Booking #{bookingId}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button onClick={startSimulation} disabled={createLiveTrackingMutation.isPending}>
            <Play className="h-4 w-4 mr-2" />
            Start Simulation
          </Button>
          <Button onClick={simulateMovement} variant="outline">
            <Truck className="h-4 w-4 mr-2" />
            Simulate Movement
          </Button>
          <Button onClick={simulateDelivery} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Simulate Delivery
          </Button>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-medium">Current Position</span>
            </div>
            <p className="text-sm text-gray-600">
              {simulationData.currentLatitude.toFixed(6)}, {simulationData.currentLongitude.toFixed(6)}
            </p>
            <Badge className="mt-2">{simulationData.routeProgress.toFixed(1)}% Complete</Badge>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Vehicle Status</span>
            </div>
            <p className="text-sm text-gray-600">
              Speed: {simulationData.currentSpeed.toFixed(0)} km/h
            </p>
            <p className="text-sm text-gray-600">
              Distance: {simulationData.distanceToDestination.toFixed(0)} km
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="font-medium">ETA</span>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(Date.now() + (simulationData.distanceToDestination / simulationData.currentSpeed * 60 * 60 * 1000)).toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Manual Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Position Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={simulationData.currentLatitude}
                  onChange={(e) => setSimulationData(prev => ({
                    ...prev,
                    currentLatitude: parseFloat(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={simulationData.currentLongitude}
                  onChange={(e) => setSimulationData(prev => ({
                    ...prev,
                    currentLongitude: parseFloat(e.target.value)
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Vehicle Data</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Speed (km/h)</Label>
                <Input
                  type="number"
                  value={simulationData.currentSpeed}
                  onChange={(e) => setSimulationData(prev => ({
                    ...prev,
                    currentSpeed: parseFloat(e.target.value)
                  }))}
                />
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={simulationData.routeProgress}
                  onChange={(e) => setSimulationData(prev => ({
                    ...prev,
                    routeProgress: parseFloat(e.target.value)
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">Battery: {simulationData.batteryLevel}%</Badge>
          <Badge variant="outline">Signal: {simulationData.signalStrength}%</Badge>
          <Badge variant="outline">Driver: {simulationData.driverName}</Badge>
          <Badge variant="outline">Vehicle: {simulationData.vehicleNumber}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}