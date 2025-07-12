# GPS Device Integration Guide

## Overview
यह guide आपको बताती है कि real GPS devices को cargo tracking system के साथ कैसे connect करें।

## Supported Connection Methods

### 1. Hardware GPS Trackers
**Best for:** Commercial fleet tracking, high accuracy requirements

#### Popular GPS Tracker Models:
- **Concox GT06N** - Budget-friendly with basic tracking
- **Teltonika FMB920** - Advanced features, fuel monitoring
- **Queclink GV55** - Reliable, long battery life
- **Ruptela Eco4** - Professional grade tracker

#### Connection Process:
```
1. Purchase GPS tracker with SIM card support
2. Insert active SIM card with data plan
3. Configure tracker with our server endpoints:
   - Server IP: your-app-domain.com
   - Port: 443 (HTTPS)
   - Protocol: TCP/HTTP
4. Register device in system via /gps-devices page
```

#### Configuration Commands:
```
// For Concox GT06N
SMS Command: APN,internet,,,#
SMS Command: SERVER,1,your-app.com,443,0#
SMS Command: TIMER,30#

// For Teltonika FMB920
Use Teltonika Configurator software
Set server: your-app.com:443
Set data sending interval: 30 seconds
```

### 2. Mobile App Integration
**Best for:** Driver-based tracking, cost-effective solution

#### Android/iOS App Features:
- Real-time GPS location sharing
- Background tracking capability
- Battery optimization
- Offline data storage with sync

#### Implementation:
```javascript
// React Native Example
import Geolocation from '@react-native-community/geolocation';

const trackLocation = () => {
  Geolocation.getCurrentPosition(
    (position) => {
      const locationData = {
        deviceId: 'DRIVER_PHONE_001',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        accuracy: position.coords.accuracy,
        timestamp: new Date()
      };
      
      fetch('https://your-app.com/api/gps/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData)
      });
    },
    (error) => console.log(error),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
};

setInterval(trackLocation, 30000); // Track every 30 seconds
```

### 3. Vehicle OBD Integration
**Best for:** Fleet management, fuel monitoring, diagnostics

#### OBD GPS Devices:
- **Autopi TMU** - Raspberry Pi based, highly customizable
- **Cartrack OBD** - Plug-and-play solution
- **Verizon Hum** - Consumer-grade OBD tracker

#### Benefits:
- Vehicle diagnostics data
- Fuel consumption monitoring
- Engine health reports
- Ignition on/off detection

## API Endpoints for GPS Integration

### WebSocket Connection (Recommended for real-time)
```javascript
const ws = new WebSocket('wss://your-app.com/gps-ws');

// Register device
ws.send(JSON.stringify({
  type: 'register',
  deviceId: 'GPS_TRACKER_001',
  imei: '123456789012345',
  firmwareVersion: '1.0.0'
}));

// Send location data
ws.send(JSON.stringify({
  type: 'location',
  data: {
    deviceId: 'GPS_TRACKER_001',
    latitude: 28.6139,
    longitude: 77.2090,
    speed: 45.5, // km/h
    heading: 180,
    altitude: 250,
    accuracy: 5,
    timestamp: new Date()
  }
}));
```

### HTTP API (Alternative method)
```bash
# Register device
curl -X POST https://your-app.com/api/gps/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "GPS_TRACKER_001",
    "imei": "123456789012345",
    "simNumber": "+91-9876543210",
    "vehicleId": "1"
  }'

# Send location data
curl -X POST https://your-app.com/api/gps/location \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "GPS_TRACKER_001",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "speed": 45.5,
    "heading": 180,
    "accuracy": 5,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

## SIM Card Requirements

### Data Plan Specifications:
- **Minimum:** 1GB per month per device
- **Recommended:** 2GB per month for high-frequency tracking
- **Network:** 4G LTE preferred, 3G acceptable

### Carrier Recommendations (India):
1. **Jio** - Good coverage, affordable data plans
2. **Airtel** - Reliable for commercial use
3. **BSNL** - Government network, wide rural coverage

## Device Configuration Examples

### For Concox GT06N:
```
1. Insert SIM card and power on
2. Send SMS commands to device number:
   - APN,internet,,,#
   - SERVER,1,your-app.com,443,0#
   - TIMER,30# (30-second intervals)
   - RESET# (restart device)
```

### For Teltonika FMB920:
```
1. Download Teltonika Configurator
2. Connect via USB/Bluetooth
3. Configure:
   - GPRS Settings: APN = "internet"
   - Data Protocol: TCP
   - Server IP: your-app.com
   - Server Port: 443
   - Data Sending Period: 30 seconds
```

## Testing GPS Connection

### 1. Device Registration Check:
```bash
curl https://your-app.com/api/gps/devices
```

### 2. Live Location Verification:
```bash
curl https://your-app.com/api/live-tracking/all
```

### 3. Signal Strength Test:
Monitor device status in GPS Device Manager page to ensure:
- Signal strength > 70%
- Battery level adequate
- Regular heartbeat signals

## Troubleshooting Common Issues

### Device Not Connecting:
1. Check SIM card data balance
2. Verify APN settings
3. Ensure cellular coverage in area
4. Restart GPS device

### Irregular Updates:
1. Check device battery level
2. Verify data plan active
3. Ensure device firmware updated
4. Check for physical damage

### Poor GPS Accuracy:
1. Ensure clear sky view
2. Wait for GPS lock (cold start may take 2-3 minutes)
3. Check device antenna connection
4. Avoid metallic enclosures

## Cost Estimation

### Hardware GPS Tracker:
- Basic tracker: ₹3,000 - ₹8,000
- Advanced tracker: ₹8,000 - ₹25,000
- Professional grade: ₹25,000+

### Monthly Running Costs:
- SIM card data plan: ₹200 - ₹500 per month
- GPS service charges: Included in system
- Maintenance: Minimal

### Mobile App Solution:
- Development cost: One-time setup
- Driver phone data: ₹100 - ₹300 per month per driver
- No additional hardware required

## Support and Maintenance

### Regular Maintenance:
1. Monitor device battery levels
2. Check SIM card data usage
3. Update device firmware periodically
4. Verify GPS accuracy monthly

### Technical Support:
- Device configuration assistance
- API integration help
- Troubleshooting guidance
- Custom integration development

## Next Steps

1. Choose GPS tracking method based on your requirements
2. Purchase recommended hardware or develop mobile app
3. Configure devices using provided guides
4. Register devices in system via GPS Device Manager
5. Test tracking functionality
6. Deploy to production fleet

## Contact Information

For technical assistance with GPS integration:
- Email: support@your-app.com
- Phone: +91-XXXX-XXXXXX
- Documentation: https://docs.your-app.com/gps-integration