import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Truck, 
  Battery, 
  Signal,
  AlertTriangle,
  RefreshCw,
  Phone
} from 'lucide-react';

interface LiveTrackingMapProps {
  bookingId: number;
  booking?: any;
}

export function LiveTrackingMap({ bookingId, booking }: LiveTrackingMapProps) {
  const [liveData, setLiveData] = useState<any>(null);
  const [eta, setEta] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchLiveData = async () => {
    try {
      const [liveResponse, etaResponse, routeResponse] = await Promise.all([
        fetch(`/api/bookings/${bookingId}/live-tracking`),
        fetch(`/api/bookings/${bookingId}/eta`),
        fetch(`/api/bookings/${bookingId}/route-monitoring`)
      ]);

      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        setLiveData(liveData);
      }

      if (etaResponse.ok) {
        const etaData = await etaResponse.json();
        setEta(etaData);
      }

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        setRouteData(routeData);
      }

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching live tracking data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    
    // Set up auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchLiveData, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSignalStrength = (strength: number) => {
    if (strength >= 80) return { color: 'text-green-600', label: 'Excellent' };
    if (strength >= 60) return { color: 'text-yellow-600', label: 'Good' };
    if (strength >= 40) return { color: 'text-orange-600', label: 'Fair' };
    return { color: 'text-red-600', label: 'Poor' };
  };

  const getBatteryColor = (level: number) => {
    if (level >= 60) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading && !liveData) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading live tracking data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!liveData) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Live Tracking Not Available</h3>
            <p className="text-gray-500 mb-4">
              This shipment doesn't have live tracking enabled yet.
            </p>
            <Button onClick={fetchLiveData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Tracking</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Last update: {formatTime(lastUpdate)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Current Location</span>
              </div>
              <p className="text-sm text-gray-600">
                {liveData.currentLatitude?.toFixed(6)}, {liveData.currentLongitude?.toFixed(6)}
              </p>
              {liveData.nextCheckpoint && (
                <p className="text-xs text-blue-600 mt-1">
                  Next: {liveData.nextCheckpoint}
                </p>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="font-medium">Vehicle Status</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>Speed: {Number(liveData.currentSpeed || 0).toFixed(0)} km/h</span>
                <span>Heading: {Number(liveData.heading || 0).toFixed(0)}°</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Route Progress</span>
              <span>{Number(liveData.routeProgress || 0).toFixed(0)}%</span>
            </div>
            <Progress value={Number(liveData.routeProgress || 0)} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{booking?.pickupCity}</span>
              <span>{booking?.deliveryCity}</span>
            </div>
          </div>

          {/* ETA Information */}
          {eta && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Estimated Arrival</span>
                  </div>
                  <p className="text-lg font-semibold text-yellow-700">
                    {new Date(eta.estimatedArrival).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="text-lg font-semibold">
                    {(eta.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              {liveData.distanceToDestination && (
                <p className="text-sm text-yellow-600 mt-2">
                  {Number(liveData.distanceToDestination).toFixed(1)} km remaining
                </p>
              )}
            </div>
          )}

          {/* Device Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Battery className={`h-5 w-5 mx-auto mb-1 ${getBatteryColor(liveData.batteryLevel || 0)}`} />
              <div className="text-xs text-gray-600">Battery</div>
              <div className="font-medium">{liveData.batteryLevel || 0}%</div>
            </div>
            
            <div className="text-center">
              <Signal className={`h-5 w-5 mx-auto mb-1 ${getSignalStrength(liveData.signalStrength || 0).color}`} />
              <div className="text-xs text-gray-600">Signal</div>
              <div className="font-medium">{getSignalStrength(liveData.signalStrength || 0).label}</div>
            </div>
            
            <div className="text-center">
              <Navigation className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <div className="text-xs text-gray-600">Accuracy</div>
              <div className="font-medium">{Number(liveData.accuracy || 0).toFixed(0)}m</div>
            </div>
            
            <div className="text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <div className="text-xs text-gray-600">Altitude</div>
              <div className="font-medium">{Number(liveData.altitude || 0).toFixed(0)}m</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Monitoring */}
      {routeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Route Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Number(routeData.routeScore || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Route Efficiency</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Number(routeData.fuelConsumption || 0).toFixed(1)}L
                </div>
                <div className="text-sm text-gray-600">Fuel Used</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Number(routeData.carbonFootprint || 0).toFixed(1)}kg
                </div>
                <div className="text-sm text-gray-600">CO₂ Emissions</div>
              </div>
            </div>

            {routeData.deviationDistance > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-700">Route Deviation Detected</span>
                </div>
                <p className="text-sm text-orange-600">
                  Vehicle deviated {Number(routeData.deviationDistance).toFixed(1)} km from planned route
                  ({routeData.deviationTime} minutes delay)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Driver Contact */}
      {(liveData.driverName || liveData.driverPhone) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Driver Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{liveData.driverName || 'Driver'}</p>
                <p className="text-sm text-gray-600">{liveData.vehicleNumber}</p>
              </div>
              {liveData.driverPhone && (
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  {liveData.driverPhone}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}