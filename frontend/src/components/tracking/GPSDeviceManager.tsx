import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Satellite, 
  Plus, 
  Settings, 
  Smartphone,
  Truck,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  MapPin,
  Phone,
  AlertCircle
} from 'lucide-react';
import { GPSConnectionTest } from './GPSConnectionTest';

interface GPSDevice {
  deviceId: string;
  vehicleId?: string;
  bookingId?: number;
  lastSeen: Date;
  isActive: boolean;
  batteryLevel: number;
  signalStrength: number;
}

interface Vehicle {
  id: string;
  registrationNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  [key: string]: any;
}

export function GPSDeviceManager() {
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    imei: '',
    simNumber: '',
    vehicleId: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading } = useQuery<GPSDevice[]>(
    ['/api/gps/devices'],
    async () => {
      const response = await fetch('/api/gps/devices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch GPS devices');
      }
      return response.json();
    }
  );

  const { data: vehicles = [] } = useQuery<Vehicle[]>(
    ['/api/vehicles'],
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
    }
  );

  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceData: any) => {
      const response = await fetch('/api/gps/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      if (!response.ok) throw new Error('Failed to register device');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Device Registered",
        description: `GPS device ${data.device.deviceId} registered successfully`
      });
      setNewDevice({ deviceId: '', imei: '', simNumber: '', vehicleId: '' });
      setIsRegistering(false);
      queryClient.invalidateQueries({ queryKey: ['/api/gps/devices'] });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: "Failed to register GPS device",
        variant: "destructive"
      });
    }
  });

  const assignDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, bookingId }: { deviceId: string; bookingId: number }) => {
      const response = await fetch('/api/gps/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, bookingId })
      });
      if (!response.ok) throw new Error('Failed to assign device');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Device Assigned",
        description: "GPS device assigned to booking successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/gps/devices'] });
    }
  });

  const sendCommandMutation = useMutation({
    mutationFn: async ({ deviceId, command, params }: any) => {
      const response = await fetch('/api/gps/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, command, params })
      });
      if (!response.ok) throw new Error('Failed to send command');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Command Sent",
        description: "Command sent to GPS device successfully"
      });
    }
  });

  const handleRegisterDevice = () => {
    if (!newDevice.deviceId || !newDevice.imei) {
      toast({
        title: "Missing Information",
        description: "Please fill in Device ID and IMEI",
        variant: "destructive"
      });
      return;
    }
    registerDeviceMutation.mutate(newDevice);
  };

  const getDeviceStatusColor = (device: GPSDevice) => {
    if (!device.isActive) return 'text-red-600';
    const timeSinceLastSeen = Date.now() - new Date(device.lastSeen).getTime();
    if (timeSinceLastSeen < 60000) return 'text-green-600'; // Less than 1 minute
    if (timeSinceLastSeen < 300000) return 'text-yellow-600'; // Less than 5 minutes
    return 'text-red-600';
  };

  const getDeviceStatusText = (device: GPSDevice) => {
    if (!device.isActive) return 'Offline';
    const timeSinceLastSeen = Date.now() - new Date(device.lastSeen).getTime();
    if (timeSinceLastSeen < 60000) return 'Online';
    if (timeSinceLastSeen < 300000) return 'Delayed';
    return 'Offline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GPS Device Manager</h2>
          <p className="text-gray-600">Manage and monitor GPS tracking devices</p>
        </div>
        <Button onClick={() => setIsRegistering(!isRegistering)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Registration Form */}
      {isRegistering && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-blue-600" />
              Register New GPS Device
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Device ID</Label>
                <Input
                  placeholder="GPS_DEVICE_001"
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, deviceId: e.target.value }))}
                />
              </div>
              <div>
                <Label>IMEI Number</Label>
                <Input
                  placeholder="123456789012345"
                  value={newDevice.imei}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, imei: e.target.value }))}
                />
              </div>
              <div>
                <Label>SIM Number</Label>
                <Input
                  placeholder="+91-9876543210"
                  value={newDevice.simNumber}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, simNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label>Assign to Vehicle</Label>
                <Select value={newDevice.vehicleId} onValueChange={(value) => setNewDevice(prev => ({ ...prev, vehicleId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle: Vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.vehicleNumber} - {vehicle.vehicleType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleRegisterDevice} 
                disabled={registerDeviceMutation.isPending}
              >
                Register Device
              </Button>
              <Button variant="outline" onClick={() => setIsRegistering(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Smartphone className="h-5 w-5" />
            GPS Device Connection Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <Satellite className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Hardware GPS Tracker</h3>
              <p className="text-sm text-gray-600">Connect via SIM card and cellular data</p>
              <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                WebSocket: ws://yourapp.com/gps-ws
              </div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Mobile App</h3>
              <p className="text-sm text-gray-600">Driver app with GPS tracking</p>
              <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                API: POST /api/gps/location
              </div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <Truck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Vehicle OBD</h3>
              <p className="text-sm text-gray-600">Connect to vehicle diagnostics port</p>
              <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                Protocol: HTTP/MQTT
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Active GPS Devices ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading devices...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <Satellite className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No GPS Devices</h3>
              <p className="text-gray-500">Register your first GPS device to start tracking</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device: GPSDevice) => (
                <Card key={device.deviceId} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Satellite className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">{device.deviceId}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${getDeviceStatusColor(device)}`}>
                        {device.isActive ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        <span className="text-sm font-medium">{getDeviceStatusText(device)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Seen:</span>
                        <span>{new Date(device.lastSeen).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Battery:</span>
                        <div className="flex items-center gap-1">
                          <Battery className={`h-4 w-4 ${
                            device.batteryLevel >= 60 ? 'text-green-600' : 
                            device.batteryLevel >= 30 ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                          <span>{device.batteryLevel}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Signal:</span>
                        <div className="flex items-center gap-1">
                          <Signal className={`h-4 w-4 ${
                            device.signalStrength >= 80 ? 'text-green-600' : 
                            device.signalStrength >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                          <span>{device.signalStrength}%</span>
                        </div>
                      </div>
                      
                      {device.bookingId && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Booking:</span>
                          <Badge variant="outline">#{device.bookingId}</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendCommandMutation.mutate({
                          deviceId: device.deviceId,
                          command: 'get_location',
                          params: {}
                        })}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Locate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendCommandMutation.mutate({
                          deviceId: device.deviceId,
                          command: 'restart',
                          params: {}
                        })}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Restart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-600" />
            Integration Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">For Hardware GPS Devices:</h4>
            <div className="space-y-2 text-sm font-mono">
              <p>1. Register device: POST /api/gps/register</p>
              <p>2. Connect WebSocket: ws://yourapp.com/gps-ws</p>
              <p>3. Send location data every 30 seconds</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">For Mobile Apps:</h4>
            <div className="space-y-2 text-sm font-mono">
              <p>1. Get location permissions</p>
              <p>2. POST location data to /api/gps/location</p>
              <p>3. Include deviceId and booking information</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Integration Support</span>
            </div>
            <p className="text-sm text-yellow-700">
              Need help integrating your GPS devices? Contact our technical support team for device-specific configuration guides and API documentation.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* GPS Connection Test */}
      <GPSConnectionTest />
    </div>
  );
}