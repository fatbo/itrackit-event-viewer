export interface ShipmentEvent {
  eventType: string;
  eventDateTime: string;
  location?: string;
  description: string;
  vessel?: string;
  voyage?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
}

export interface ShipmentData {
  shipmentId?: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  bookingNumber?: string;
  containerNumber?: string;
  events: ShipmentEvent[];
  [key: string]: any; // Allow additional properties
}
