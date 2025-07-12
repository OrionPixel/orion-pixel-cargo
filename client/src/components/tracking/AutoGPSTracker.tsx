import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Truck, 
  Navigation, 
  Clock,
  Battery,
  Signal,
  Phone
} from 'lucide-react';

interface AutoGPSTrackerProps {
  bookingId: number;
}

export function AutoGPSTracker({ bookingId }: AutoGPSTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);

  // Check if booking has GPS tracking
  const { data: gpsInfo, isLoading } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/gps-info`],
    refetchInterval: false, // NO automatic polling - pure event-based
  });

  // Get live tracking data
  const { data: liveTracking } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/live-tracking`],
    enabled: !!gpsInfo?.hasGPS,
    refetchInterval: false, // NO automatic polling - pure event-based
  });

  useEffect(() => {
    setIsTracking(!!liveTracking?.isActive);
  }, [liveTracking]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-gray-500">
            Checking GPS availability...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gpsInfo?.hasGPS) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-500">
            No GPS tracking available for this vehicle
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Add GPS device to vehicle for automatic tracking
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-green-600" />
            <span>Auto GPS Tracking</span>
            {isTracking && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
            )}
          </div>
          <Badge variant={isTracking ? "default" : "secondary"}>
            {isTracking ? "Active" : "Standby"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Vehicle & GPS Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-600">Vehicle:</span>
            <div className="font-medium">{gpsInfo.vehicleNumber}</div>
          </div>
          <div>
            <span className="text-gray-600">GPS Device:</span>
            <div className="font-medium">{gpsInfo.gpsDeviceId}</div>
          </div>
        </div>

        {liveTracking && (
          <>
            {/* Route Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Route Progress</span>
                <span>{liveTracking.routeProgress?.toFixed(1) || 0}%</span>
              </div>
              <Progress value={liveTracking.routeProgress || 0} className="h-2" />
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-white rounded border">
                <Truck className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="text-xs font-medium">
                  {liveTracking.currentSpeed?.toFixed(0) || 0} km/h
                </div>
                <div className="text-xs text-gray-500">Speed</div>
              </div>
              
              <div className="text-center p-2 bg-white rounded border">
                <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                <div className="text-xs font-medium">
                  {liveTracking.estimatedArrival ? 
                    new Date(liveTracking.estimatedArrival).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 'Calculating'
                  }
                </div>
                <div className="text-xs text-gray-500">ETA</div>
              </div>
              
              <div className="text-center p-2 bg-white rounded border">
                <MapPin className="h-4 w-4 mx-auto mb-1 text-red-600" />
                <div className="text-xs font-medium">
                  {liveTracking.distanceToDestination?.toFixed(0) || 0} km
                </div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
            </div>

            {/* Device Status */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Battery className={`h-3 w-3 ${
                    (liveTracking.batteryLevel || 0) >= 60 ? 'text-green-600' : 
                    (liveTracking.batteryLevel || 0) >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <span>{liveTracking.batteryLevel || 0}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Signal className={`h-3 w-3 ${
                    (liveTracking.signalStrength || 0) >= 80 ? 'text-green-600' : 
                    (liveTracking.signalStrength || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <span>{liveTracking.signalStrength || 0}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Phone className="h-3 w-3" />
                <span>{liveTracking.driverPhone}</span>
              </div>
            </div>

            {/* Last Update */}
            <div className="text-xs text-gray-500 text-center">
              Last update: {liveTracking.lastUpdate ? 
                new Date(liveTracking.lastUpdate).toLocaleTimeString() : 'Never'
              }
            </div>
          </>
        )}

        {!liveTracking && isTracking && (
          <div className="text-center text-xs text-gray-500 py-2">
            Waiting for GPS signal...
          </div>
        )}
      </CardContent>
    </Card>
  );
}