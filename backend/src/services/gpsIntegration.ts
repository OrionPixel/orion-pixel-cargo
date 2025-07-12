import { Express } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

export interface GPSDevice {
  deviceId: string;
  vehicleId?: string;
  bookingId?: number;
  lastSeen: Date;
  isActive: boolean;
  batteryLevel: number;
  signalStrength: number;
}

export interface GPSLocation {
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: Date;
  hdop: number; // Horizontal Dilution of Precision
  satellites: number;
}

// In-memory storage for active GPS devices
const activeDevices = new Map<string, GPSDevice>();
const deviceConnections = new Map<string, WebSocket>();

export function setupGPSIntegration(app: Express, server: Server) {
  
  // WebSocket server for real-time GPS data
  const wss = new WebSocketServer({ 
    server, 
    path: '/gps-ws',
    verifyClient: (info) => {
      // Add authentication logic here
      return true;
    }
  });

  wss.on('connection', (ws, req) => {
    console.log('GPS device connected:', req.url);
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleGPSMessage(ws, message);
      } catch (error) {
        console.error('Error processing GPS message:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      // Remove device from active connections
      for (const [deviceId, connection] of deviceConnections.entries()) {
        if (connection === ws) {
          deviceConnections.delete(deviceId);
          const device = activeDevices.get(deviceId);
          if (device) {
            device.isActive = false;
            device.lastSeen = new Date();
          }
          console.log(`GPS device ${deviceId} disconnected`);
          break;
        }
      }
    });
  });

  // HTTP endpoints for GPS integration
  
  // Register GPS device
  app.post('/api/gps/register', async (req, res) => {
    try {
      const { deviceId, vehicleId, imei, simNumber } = req.body;
      
      const device: GPSDevice = {
        deviceId,
        vehicleId,
        lastSeen: new Date(),
        isActive: true,
        batteryLevel: 100,
        signalStrength: 0
      };
      
      activeDevices.set(deviceId, device);
      
      res.json({ 
        message: 'Device registered successfully',
        device,
        websocketUrl: `ws://${req.get('host')}/gps-ws`
      });
    } catch (error) {
      console.error('Error registering GPS device:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  });

  // Receive GPS data via HTTP (for devices that don't support WebSocket)
  app.post('/api/gps/location', async (req, res) => {
    try {
      const locationData: GPSLocation = req.body;
      await processLocationUpdate(locationData);
      res.json({ status: 'success', timestamp: new Date() });
    } catch (error) {
      console.error('Error processing GPS location:', error);
      res.status(500).json({ error: 'Failed to process location' });
    }
  });

  // Get device status
  app.get('/api/gps/devices', async (req, res) => {
    try {
      const devices = Array.from(activeDevices.values());
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get devices' });
    }
  });

  // Assign device to booking
  app.post('/api/gps/assign', async (req, res) => {
    try {
      const { deviceId, bookingId } = req.body;
      const device = activeDevices.get(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      device.bookingId = bookingId;
      activeDevices.set(deviceId, device);
      
      res.json({ message: 'Device assigned to booking', device });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign device' });
    }
  });

  // Send command to GPS device
  app.post('/api/gps/command', async (req, res) => {
    try {
      const { deviceId, command, params } = req.body;
      const connection = deviceConnections.get(deviceId);
      
      if (!connection) {
        return res.status(404).json({ error: 'Device not connected' });
      }
      
      connection.send(JSON.stringify({
        type: 'command',
        command,
        params,
        timestamp: new Date()
      }));
      
      res.json({ message: 'Command sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send command' });
    }
  });
}

async function handleGPSMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case 'register':
      await handleDeviceRegistration(ws, message);
      break;
    case 'location':
      await processLocationUpdate(message.data);
      break;
    case 'status':
      await updateDeviceStatus(message.deviceId, message.data);
      break;
    case 'heartbeat':
      await handleHeartbeat(message.deviceId);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}

async function handleDeviceRegistration(ws: WebSocket, message: any) {
  const { deviceId, imei, firmwareVersion } = message;
  
  const device: GPSDevice = {
    deviceId,
    lastSeen: new Date(),
    isActive: true,
    batteryLevel: 100,
    signalStrength: 0
  };
  
  activeDevices.set(deviceId, device);
  deviceConnections.set(deviceId, ws);
  
  ws.send(JSON.stringify({
    type: 'registered',
    deviceId,
    timestamp: new Date(),
    config: {
      reportingInterval: 30, // seconds
      highAccuracyMode: true
    }
  }));
  
  console.log(`GPS device registered: ${deviceId}`);
}

async function processLocationUpdate(locationData: GPSLocation) {
  const device = activeDevices.get(locationData.deviceId);
  if (!device) {
    console.error('Unknown device:', locationData.deviceId);
    return;
  }
  
  // Update device last seen
  device.lastSeen = new Date();
  device.isActive = true;
  
  // If device is assigned to a booking, update live tracking
  if (device.bookingId) {
    try {
      // Check if live tracking exists
      const existingTracking = await storage.getLiveTracking(device.bookingId);
      
      if (existingTracking) {
        // Update existing tracking
        await storage.updateLiveTracking(device.bookingId, {
          currentLatitude: locationData.latitude,
          currentLongitude: locationData.longitude,
          currentSpeed: locationData.speed * 3.6, // Convert m/s to km/h
          heading: locationData.heading,
          altitude: locationData.altitude,
          accuracy: locationData.accuracy,
          lastUpdate: locationData.timestamp,
          // Calculate route progress and distance (simplified)
          routeProgress: calculateRouteProgress(locationData, device.bookingId),
          distanceToDestination: await calculateDistanceToDestination(locationData, device.bookingId)
        });
      } else {
        // Create new live tracking
        await storage.createLiveTracking({
          bookingId: device.bookingId,
          currentLatitude: locationData.latitude,
          currentLongitude: locationData.longitude,
          currentSpeed: locationData.speed * 3.6,
          heading: locationData.heading,
          altitude: locationData.altitude,
          accuracy: locationData.accuracy,
          routeProgress: 0,
          distanceToDestination: 0,
          isActive: true,
          lastUpdate: locationData.timestamp,
          estimatedArrival: new Date(Date.now() + 4 * 60 * 60 * 1000) // Default 4 hours
        });
      }
      
      // Create tracking event
      await storage.createTrackingEvent({
        bookingId: device.bookingId,
        status: 'in_transit',
        location: await reverseGeocode(locationData.latitude, locationData.longitude),
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        notes: `Live GPS update - Speed: ${(locationData.speed * 3.6).toFixed(1)} km/h`,
        isLiveUpdate: true,
        actualSpeed: locationData.speed * 3.6,
        timestamp: locationData.timestamp
      });
      
    } catch (error) {
      console.error('Error updating live tracking:', error);
    }
  }
  
  // Broadcast to connected clients
  broadcastLocationUpdate(locationData, device);
}

async function updateDeviceStatus(deviceId: string, statusData: any) {
  const device = activeDevices.get(deviceId);
  if (!device) return;
  
  device.batteryLevel = statusData.batteryLevel || device.batteryLevel;
  device.signalStrength = statusData.signalStrength || device.signalStrength;
  device.lastSeen = new Date();
}

async function handleHeartbeat(deviceId: string) {
  const device = activeDevices.get(deviceId);
  if (device) {
    device.lastSeen = new Date();
    device.isActive = true;
  }
}

function calculateRouteProgress(location: GPSLocation, bookingId: number): number {
  // Simplified progress calculation
  // In production, use actual route planning APIs
  return Math.random() * 100;
}

async function calculateDistanceToDestination(location: GPSLocation, bookingId: number): Promise<number> {
  // Simplified distance calculation
  // In production, integrate with Google Maps Distance Matrix API
  return 50 + Math.random() * 200;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Simplified reverse geocoding
  // In production, use Google Maps Geocoding API
  return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function broadcastLocationUpdate(locationData: GPSLocation, device: GPSDevice) {
  // Broadcast to all connected WebSocket clients
  const updateMessage = {
    type: 'location_update',
    deviceId: device.deviceId,
    bookingId: device.bookingId,
    location: locationData,
    timestamp: new Date()
  };
  
  // Here you would broadcast to connected web clients
  console.log('Broadcasting location update:', updateMessage);
}

// Cleanup inactive devices
setInterval(() => {
  const now = new Date();
  for (const [deviceId, device] of activeDevices.entries()) {
    const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
    if (timeSinceLastSeen > 5 * 60 * 1000) { // 5 minutes
      device.isActive = false;
    }
  }
}, 60000); // Check every minute