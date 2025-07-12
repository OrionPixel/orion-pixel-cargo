import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Satellite, 
  Battery, 
  Signal, 
  Navigation,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface GPSData {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
  batteryLevel: number;
  signalStrength: number;
  isActive: boolean;
}

export function GPSStatusIndicator() {
  const [gpsData, setGpsData] = useState<GPSData>({
    latitude: 28.6139,
    longitude: 77.2090,
    speed: 0,
    heading: 0,
    altitude: 250,
    accuracy: 0,
    timestamp: new Date(),
    batteryLevel: 100,
    signalStrength: 0,
    isActive: false
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate GPS movement
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setGpsData(prev => {
        const newLat = prev.latitude + (Math.random() - 0.5) * 0.001; // Small movement
        const newLng = prev.longitude + (Math.random() - 0.5) * 0.001;
        const newSpeed = 30 + Math.random() * 40; // 30-70 km/h
        const newHeading = (prev.heading + Math.random() * 10 - 5) % 360;
        
        return {
          ...prev,
          latitude: newLat,
          longitude: newLng,
          speed: newSpeed,
          heading: newHeading,
          accuracy: 3 + Math.random() * 7, // 3-10 meters accuracy
          timestamp: new Date(),
          batteryLevel: Math.max(20, prev.batteryLevel - Math.random() * 0.1),
          signalStrength: 60 + Math.random() * 40, // 60-100% signal
          isActive: true
        };
      });
      setLastUpdate(new Date());
    }, 2000); // Update every 2 seconds for demo

    return () => clearInterval(interval);
  }, [isSimulating]);

  const startGPSSimulation = () => {
    setIsSimulating(true);
    setGpsData(prev => ({ ...prev, isActive: true }));
  };

  const stopGPSSimulation = () => {
    setIsSimulating(false);
    setGpsData(prev => ({ ...prev, isActive: false, speed: 0 }));
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    if (strength >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBatteryColor = (level: number) => {
    if (level >= 60) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyStatus = (accuracy: number) => {
    if (accuracy <= 5) return { color: 'text-green-600', status: 'Excellent' };
    if (accuracy <= 10) return { color: 'text-yellow-600', status: 'Good' };
    if (accuracy <= 20) return { color: 'text-orange-600', status: 'Fair' };
    return { color: 'text-red-600', status: 'Poor' };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-blue-600" />
            GPS Tracking Status
            {gpsData.isActive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isSimulating ? (
              <Button onClick={startGPSSimulation} size="sm">
                <Navigation className="h-4 w-4 mr-2" />
                Start GPS Demo
              </Button>
            ) : (
              <Button onClick={stopGPSSimulation} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Stop Demo
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Current Position</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Latitude:</span>
                <span className="ml-2 font-mono font-medium">{gpsData.latitude.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Longitude:</span>
                <span className="ml-2 font-mono font-medium">{gpsData.longitude.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Altitude:</span>
                <span className="ml-2 font-medium">{gpsData.altitude.toFixed(0)}m</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Vehicle Status</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Speed:</span>
                <span className="ml-2 font-medium">{gpsData.speed.toFixed(1)} km/h</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Heading:</span>
                <span className="ml-2 font-medium">{gpsData.heading.toFixed(0)}°</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Last Update:</span>
                <span className="ml-2 font-medium">{lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* GPS Quality Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`flex items-center justify-center mb-2 ${getAccuracyStatus(gpsData.accuracy).color}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <div className="text-xs text-gray-600 mb-1">GPS Accuracy</div>
            <div className="font-semibold">{gpsData.accuracy.toFixed(1)}m</div>
            <div className={`text-xs ${getAccuracyStatus(gpsData.accuracy).color}`}>
              {getAccuracyStatus(gpsData.accuracy).status}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`flex items-center justify-center mb-2 ${getSignalColor(gpsData.signalStrength)}`}>
              <Signal className="h-5 w-5" />
            </div>
            <div className="text-xs text-gray-600 mb-1">Signal Strength</div>
            <div className="font-semibold">{gpsData.signalStrength.toFixed(0)}%</div>
            <div className={`text-xs ${getSignalColor(gpsData.signalStrength)}`}>
              {gpsData.signalStrength >= 80 ? 'Excellent' : 
               gpsData.signalStrength >= 60 ? 'Good' : 
               gpsData.signalStrength >= 40 ? 'Fair' : 'Poor'}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`flex items-center justify-center mb-2 ${getBatteryColor(gpsData.batteryLevel)}`}>
              <Battery className="h-5 w-5" />
            </div>
            <div className="text-xs text-gray-600 mb-1">Battery Level</div>
            <div className="font-semibold">{gpsData.batteryLevel.toFixed(0)}%</div>
            <div className={`text-xs ${getBatteryColor(gpsData.batteryLevel)}`}>
              {gpsData.batteryLevel >= 60 ? 'Good' : 
               gpsData.batteryLevel >= 30 ? 'Low' : 'Critical'}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`flex items-center justify-center mb-2 ${gpsData.isActive ? 'text-green-600' : 'text-gray-400'}`}>
              {gpsData.isActive ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="text-xs text-gray-600 mb-1">GPS Status</div>
            <div className="font-semibold">
              {gpsData.isActive ? 'Active' : 'Inactive'}
            </div>
            <div className={`text-xs ${gpsData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {gpsData.isActive ? 'Tracking' : 'Standby'}
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Real-time Updates</span>
          </div>
          <p className="text-sm text-yellow-700">
            {isSimulating ? (
              `GPS is actively tracking. Position updates every 2 seconds. Last update: ${lastUpdate.toLocaleTimeString()}`
            ) : (
              'GPS tracking is currently stopped. Click "Start GPS Demo" to see live position updates.'
            )}
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={gpsData.isActive ? "default" : "secondary"}>
            {gpsData.isActive ? "GPS Active" : "GPS Inactive"}
          </Badge>
          <Badge variant="outline">
            Updates: {isSimulating ? "Real-time" : "Paused"}
          </Badge>
          <Badge variant="outline">
            Accuracy: {getAccuracyStatus(gpsData.accuracy).status}
          </Badge>
          <Badge variant="outline">
            Signal: {gpsData.signalStrength.toFixed(0)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}