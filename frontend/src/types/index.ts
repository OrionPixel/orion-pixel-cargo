export interface DashboardStats {
  totalBookings: number;
  activeShipments: number;
  revenue: string;
  availableVehicles: number;
  bookingsGrowth: number;
  shipmentsGrowth: number;
  revenueGrowth: number;
  vehiclesInMaintenance: number;
}

export interface VehicleStatus {
  available: number;
  inTransit: number;
  maintenance: number;
}

export interface SubscriptionPlan {
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export interface BookingFormData {
  bookingType: 'FTL' | 'LTL' | 'part_load';
  weight: number;
  distance: number;
  cargoDescription: string;
  pickupAddress: string;
  pickupCity: string;
  pickupPinCode: string;
  pickupDateTime: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPinCode: string;
  deliveryDateTime: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  baseRate: number;
  gstAmount: number;
  totalAmount: number;
}

export interface VehicleFormData {
  registrationNumber: string;
  vehicleType: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  status: 'available' | 'in_transit' | 'maintenance';
}

export interface WarehouseFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  capacity: number;
}
