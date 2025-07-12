import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Truck, 
  Clock, 
  Battery,
  Signal,
  Phone,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export function LiveTrackingDemo() {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState({
    currentLocation: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
    destination: { lat: 30.7333, lng: 76.7794, name: "Chandigarh" },
    progress: 0,
    speed: 0,
    eta: "",
    batteryLevel: 95,
    signalStrength: 85,
    driverName: "Rajesh Kumar",
    driverPhone: "+91-9876543210",
    vehicleNumber: "DL01AB1234",
    distanceRemaining: 250,
    lastUpdate: new Date()
  });

  // Demo simulation
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setTrackingData(prev => {
        const newProgress = Math.min(100, prev.progress + Math.random() * 2);
        const newSpeed = 40 + Math.random() * 30; // 40-70 km/h
        const newDistance = Math.max(0, prev.distanceRemaining - Math.random() * 5);
        const etaHours = newDistance / newSpeed;
        const etaTime = new Date(Date.now() + etaHours * 60 * 60 * 1000);
        
        // Simulate location change
        const latChange = (prev.destination.lat - prev.currentLocation.lat) * 0.02;
        const lngChange = (prev.destination.lng - prev.currentLocation.lng) * 0.02;
        
        return {
          ...prev,
          progress: newProgress,
          speed: newSpeed,
          currentLocation: {
            ...prev.currentLocation,
            lat: prev.currentLocation.lat + latChange,
            lng: prev.currentLocation.lng + lngChange
          },
          distanceRemaining: newDistance,
          eta: etaTime.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          batteryLevel: Math.max(20, prev.batteryLevel - Math.random() * 0.1),
          signalStrength: 70 + Math.random() * 30,
          lastUpdate: new Date()
        };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isTracking]);

  const startTracking = () => {
    setIsTracking(true);
    setTrackingData(prev => ({
      ...prev,
      speed: 45,
      eta: new Date(Date.now() + 5 * 60 * 60 * 1000).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  };

  const stopTracking = () => {
    setIsTracking(false);
    setTrackingData(prev => ({ ...prev, speed: 0 }));
  };

  const resetDemo = () => {
    setIsTracking(false);
    setTrackingData({
      currentLocation: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
      destination: { lat: 30.7333, lng: 76.7794, name: "Chandigarh" },
      progress: 0,
      speed: 0,
      eta: "",
      batteryLevel: 95,
      signalStrength: 85,
      driverName: "Rajesh Kumar",
      driverPhone: "+91-9876543210",
      vehicleNumber: "DL01AB1234",
      distanceRemaining: 250,
      lastUpdate: new Date()
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            Live Tracking Demo
            {isTracking && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">LIVE</span>
              </div>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={startTracking} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Start Tracking
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
            <Button onClick={resetDemo} variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Route Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-green-600" />
              {trackingData.currentLocation.name}
            </span>
            <span className="text-gray-600">{trackingData.progress.toFixed(1)}% Complete</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-red-600" />
              {trackingData.destination.name}
            </span>
          </div>
          <Progress value={trackingData.progress} className="h-3" />
          <div className="text-center text-sm text-gray-600">
            {trackingData.distanceRemaining.toFixed(0)} km remaining
          </div>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Vehicle Status</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-900">
                {trackingData.speed.toFixed(0)} km/h
              </div>
              <div className="text-sm text-blue-700">
                Current Speed
              </div>
              <div className="text-xs text-blue-600">
                Vehicle: {trackingData.vehicleNumber}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">ETA</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-green-900">
                {trackingData.eta || "Calculating..."}
              </div>
              <div className="text-sm text-green-700">
                Estimated Arrival
              </div>
              <div className="text-xs text-green-600">
                Updated live
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800">Distance</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-purple-900">
                {trackingData.distanceRemaining.toFixed(0)} km
              </div>
              <div className="text-sm text-purple-700">
                Remaining
              </div>
              <div className="text-xs text-purple-600">
                Direct route
              </div>
            </div>
          </Card>
        </div>

        {/* Device Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Battery className={`h-5 w-5 mx-auto mb-1 ${
              trackingData.batteryLevel >= 60 ? 'text-green-600' : 
              trackingData.batteryLevel >= 30 ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <div className="text-xs text-gray-600">Battery</div>
            <div className="font-medium">{trackingData.batteryLevel.toFixed(0)}%</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Signal className={`h-5 w-5 mx-auto mb-1 ${
              trackingData.signalStrength >= 80 ? 'text-green-600' : 
              trackingData.signalStrength >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <div className="text-xs text-gray-600">Signal</div>
            <div className="font-medium">{trackingData.signalStrength.toFixed(0)}%</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-xs text-gray-600">Location</div>
            <div className="font-medium text-xs">
              {trackingData.currentLocation.lat.toFixed(3)}, {trackingData.currentLocation.lng.toFixed(3)}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-xs text-gray-600">Last Update</div>
            <div className="font-medium text-xs">
              {trackingData.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Driver Contact */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Driver Contact</span>
              </div>
              <div className="text-sm text-yellow-700">
                {trackingData.driverName}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              {trackingData.driverPhone}
            </Button>
          </div>
        </Card>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={isTracking ? "default" : "secondary"}>
            {isTracking ? "Live Tracking" : "Tracking Stopped"}
          </Badge>
          <Badge variant="outline">
            Updates: {isTracking ? "Every 3 seconds" : "Paused"}
          </Badge>
          <Badge variant="outline">
            GPS: {trackingData.signalStrength >= 70 ? "Strong" : "Weak"}
          </Badge>
          <Badge variant="outline">
            Route: {trackingData.progress.toFixed(0)}% Complete
          </Badge>
        </div>

        {/* Demo Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Demo Instructions:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click "Start Tracking" to begin live GPS simulation</li>
              <li>Watch real-time updates of location, speed, and ETA</li>
              <li>Battery and signal strength change dynamically</li>
              <li>Progress bar shows route completion percentage</li>
              <li>All data updates every 3 seconds automatically</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}