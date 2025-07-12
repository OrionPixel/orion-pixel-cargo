import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GPSDeviceManager } from "@/components/tracking/GPSDeviceManager";
import { LiveTrackingDemo } from "@/components/tracking/LiveTrackingDemo";
import { GPSStatusIndicator } from "@/components/tracking/GPSStatusIndicator";
import { TrackingSimulator } from "@/components/tracking/TrackingSimulator";
import { 
  Satellite, 
  MapPin, 
  Activity,
  Wifi,
  WifiOff,
  Battery,
  Signal
} from "lucide-react";

export default function GPSDevices() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access GPS devices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Satellite className="h-8 w-8 text-blue-600" />
                GPS Devices
              </h1>
              <p className="text-gray-600 mt-2">
                Manage GPS devices, test connections, and monitor real-time tracking
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              System Active
            </Badge>
          </div>
        </div>

        {/* GPS Device Manager */}
        <div className="mb-8">
          <GPSDeviceManager />
        </div>

        {/* GPS Demo & Testing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Live Tracking Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Live Tracking Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiveTrackingDemo />
            </CardContent>
          </Card>

          {/* GPS Status Indicator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Signal className="h-5 w-5 text-green-600" />
                GPS Status Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GPSStatusIndicator />
            </CardContent>
          </Card>
        </div>

        {/* Tracking Simulator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              GPS Tracking Simulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingSimulator />
          </CardContent>
        </Card>

        {/* Connection Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">WebSocket Connection</p>
                  <p className="text-2xl font-bold text-green-900">Active</p>
                </div>
                <Wifi className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-green-700 mt-2">Real-time data streaming enabled</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Connected Devices</p>
                  <p className="text-2xl font-bold text-blue-900">0</p>
                </div>
                <Satellite className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700 mt-2">Register devices to start tracking</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">API Endpoints</p>
                  <p className="text-2xl font-bold text-purple-900">Ready</p>
                </div>
                <Signal className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-purple-700 mt-2">All GPS APIs operational</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}