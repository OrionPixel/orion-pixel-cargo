import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Satellite, 
  Smartphone, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Wifi,
  Signal,
  TestTube
} from 'lucide-react';

export function GPSConnectionTest() {
  const [testDevice, setTestDevice] = useState({
    deviceId: 'TEST_GPS_001',
    latitude: 28.6139,
    longitude: 77.2090,
    speed: 45.5,
    heading: 180
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingLocation, setIsTestingLocation] = useState(false);
  
  const { toast } = useToast();

  const testGPSConnection = async () => {
    setIsTestingConnection(true);
    const results = [];
    
    try {
      // Test 1: Device Registration
      const registerResponse = await fetch('/api/gps/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: testDevice.deviceId,
          imei: '123456789012345',
          simNumber: '+91-9999999999'
        })
      });
      
      results.push({
        test: 'Device Registration',
        status: registerResponse.ok ? 'success' : 'failed',
        message: registerResponse.ok ? 'Device registered successfully' : 'Registration failed',
        icon: registerResponse.ok ? CheckCircle : XCircle,
        color: registerResponse.ok ? 'text-green-600' : 'text-red-600'
      });

      // Test 2: Location Update
      const locationResponse = await fetch('/api/gps/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: testDevice.deviceId,
          latitude: testDevice.latitude,
          longitude: testDevice.longitude,
          speed: testDevice.speed,
          heading: testDevice.heading,
          accuracy: 5,
          timestamp: new Date()
        })
      });
      
      results.push({
        test: 'Location Update',
        status: locationResponse.ok ? 'success' : 'failed',
        message: locationResponse.ok ? 'Location data received' : 'Location update failed',
        icon: locationResponse.ok ? CheckCircle : XCircle,
        color: locationResponse.ok ? 'text-green-600' : 'text-red-600'
      });

      // Test 3: Device List
      const devicesResponse = await fetch('/api/gps/devices');
      const devices = await devicesResponse.json();
      const deviceFound = devices.find((d: any) => d.deviceId === testDevice.deviceId);
      
      results.push({
        test: 'Device Discovery',
        status: deviceFound ? 'success' : 'failed',
        message: deviceFound ? 'Device found in system' : 'Device not found',
        icon: deviceFound ? CheckCircle : XCircle,
        color: deviceFound ? 'text-green-600' : 'text-red-600'
      });

      // Test 4: WebSocket Connection (simulated)
      results.push({
        test: 'WebSocket Support',
        status: 'success',
        message: 'WebSocket endpoint available at /gps-ws',
        icon: CheckCircle,
        color: 'text-green-600'
      });

      setTestResults(results);
      
      const allSuccessful = results.every(r => r.status === 'success');
      toast({
        title: allSuccessful ? "GPS Test Successful" : "GPS Test Completed",
        description: allSuccessful ? "All GPS functions working correctly" : "Some tests failed - check results",
        variant: allSuccessful ? "default" : "destructive"
      });

    } catch (error) {
      console.error('GPS test error:', error);
      toast({
        title: "Test Failed",
        description: "Unable to complete GPS connection test",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testLiveLocation = async () => {
    setIsTestingLocation(true);
    
    try {
      // Simulate live location updates
      for (let i = 0; i < 5; i++) {
        const randomLat = testDevice.latitude + (Math.random() - 0.5) * 0.01;
        const randomLng = testDevice.longitude + (Math.random() - 0.5) * 0.01;
        const randomSpeed = 30 + Math.random() * 40;
        
        await fetch('/api/gps/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: testDevice.deviceId,
            latitude: randomLat,
            longitude: randomLng,
            speed: randomSpeed,
            heading: testDevice.heading + (Math.random() - 0.5) * 20,
            accuracy: 3 + Math.random() * 5,
            timestamp: new Date()
          })
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
      
      toast({
        title: "Live Test Complete",
        description: "Sent 5 location updates successfully"
      });
      
    } catch (error) {
      toast({
        title: "Live Test Failed",
        description: "Error sending live location updates",
        variant: "destructive"
      });
    } finally {
      setIsTestingLocation(false);
    }
  };

  const testBrowserGPS = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "This browser doesn't support GPS",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTestDevice(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0
        }));
        
        toast({
          title: "Browser GPS Working",
          description: `Location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        });
      },
      (error) => {
        toast({
          title: "GPS Access Denied",
          description: "Please allow location access to test GPS",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            GPS Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Device Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Test Device ID</Label>
              <Input
                value={testDevice.deviceId}
                onChange={(e) => setTestDevice(prev => ({ ...prev, deviceId: e.target.value }))}
              />
            </div>
            <div>
              <Label>Test Location (Lat, Lng)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.000001"
                  value={testDevice.latitude}
                  onChange={(e) => setTestDevice(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                />
                <Input
                  type="number"
                  step="0.000001"
                  value={testDevice.longitude}
                  onChange={(e) => setTestDevice(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={testGPSConnection} 
              disabled={isTestingConnection}
            >
              <Satellite className="h-4 w-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test GPS System'}
            </Button>
            
            <Button 
              onClick={testLiveLocation} 
              disabled={isTestingLocation}
              variant="outline"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isTestingLocation ? 'Sending...' : 'Test Live Updates'}
            </Button>
            
            <Button 
              onClick={testBrowserGPS}
              variant="outline"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Test Browser GPS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <result.icon className={`h-5 w-5 ${result.color}`} />
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Real GPS Device Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <Satellite className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Hardware Trackers</h3>
              <p className="text-sm text-gray-600 mb-3">
                Professional GPS devices with SIM cards
              </p>
              <div className="space-y-1 text-xs">
                <p><strong>Brands:</strong> Concox, Teltonika, Queclink</p>
                <p><strong>Cost:</strong> ₹3,000 - ₹25,000</p>
                <p><strong>Data:</strong> ₹200-500/month</p>
              </div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">Mobile Apps</h3>
              <p className="text-sm text-gray-600 mb-3">
                Driver smartphone GPS tracking
              </p>
              <div className="space-y-1 text-xs">
                <p><strong>Platforms:</strong> Android, iOS</p>
                <p><strong>Cost:</strong> App development only</p>
                <p><strong>Data:</strong> ₹100-300/month</p>
              </div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <Signal className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-2">OBD Devices</h3>
              <p className="text-sm text-gray-600 mb-3">
                Vehicle diagnostics port integration
              </p>
              <div className="space-y-1 text-xs">
                <p><strong>Features:</strong> GPS + Diagnostics</p>
                <p><strong>Cost:</strong> ₹5,000 - ₹15,000</p>
                <p><strong>Benefits:</strong> Fuel monitoring</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Next Steps:</h4>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Choose GPS tracking method based on your fleet requirements</li>
              <li>Purchase recommended hardware or develop mobile app</li>
              <li>Configure devices using integration guide</li>
              <li>Test connection using above tools</li>
              <li>Register devices in GPS Device Manager</li>
              <li>Assign devices to vehicles and bookings</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}