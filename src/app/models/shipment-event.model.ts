// Legacy interface for backward compatibility
export interface ShipmentEvent {
  eventType: string;
  eventDateTime: string;
  location?: string;
  description: string;
  vessel?: string;
  voyage?: string;
  status?: string;
  // Additional properties from OpShipmentEventRaw conversion
  eventCode?: string;
  locationType?: string;
  timeType?: string;
  containerStatus?: string;
  modeOfTransport?: string;
  facilityCode?: string;
  facilityName?: string;
  unLocationCode?: string;
  unLocationName?: string;
  dataProvider?: string;
  // Time grouping fields
  actualTime?: string;
  estimatedTime?: string;
  plannedTime?: string;
  timeDetails?: string;
  [key: string]: any; // Allow additional properties
  // AI prediction metadata
  aiPrediction?: AiPrediction;
  predictedTime?: string;
}

// Legacy interface for backward compatibility, extended with OpShipmentEventRaw fields
export interface ShipmentData {
  shipmentId?: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  bookingNumber?: string;
  containerNumber?: string;
  events: ShipmentEvent[];
  // Additional OpShipmentEventRaw fields
  blNo?: string;
  containerSize?: string;
  containerType?: string;
  containerISOCode?: string;
  shipmentType?: string;
  eventId?: string;
  source?: string;
  containerWeight?: string;
  sealNo?: string[];
  dg?: string[];
  dmg?: string[];
  transportEvents?: OpTransportEvent[];
  terminalData?: TerminalData;
  aiInsights?: AiInsights;
  [key: string]: any; // Allow additional properties
}

// New interfaces based on OpShipmentEventRaw schema

export interface Location {
  facilityCode?: string;
  facilityName?: string;
  unLocationCode: string;
  unLocationName: string;
}

export interface ConveyanceInfo {
  conveyanceName: string;
  conveyanceNumber: string;
}

export interface OpTransportEvent {
  seq?: number;
  eventCode: 'OG' | 'IG' | 'AE' | 'VD' | 'VA' | 'UV' | 'AL' | 'UR' | 'RD' | 'RA' | 'TA' | 'CT' | 'RT' | 'SS' | 'ZZ' | 'PD';
  eventName?: string;
  locationType: 'POL' | 'POD' | 'POT' | 'POC';
  eventTime: string;
  timeType: 'A' | 'E' | 'G';
  modeOfTransport?: 'Ocean' | 'Truck' | 'Barge' | 'Rail' | 'Ship';
  conveyanceInfo?: ConveyanceInfo;
  location: Location;
  DataProvider?: string;
  DataProviderPriority?: number;
}

export interface OpEquipmentEvent {
  eventCode: 'OG' | 'IG' | 'AE' | 'VD' | 'VA' | 'UV' | 'AL' | 'UR' | 'RD' | 'RA' | 'TA' | 'CT' | 'RT' | 'SS' | 'ZZ' | 'PD';
  eventName: string;
  locationType: 'POL' | 'POD' | 'POT' | 'POC';
  eventTime: string;
  timeType: 'A' | 'E' | 'G';
  containerStatus: 'F' | 'E';
  modeOfTransport?: 'Ocean' | 'Truck' | 'Barge' | 'Rail' | 'Ship';
  DataProvider?: string;
  DataProviderPriority?: number;
  conveyanceInfo?: ConveyanceInfo;
  location: Location;
}

export interface ReeferData {
  id?: string;
  version?: number;
  eventId?: string;
  eventTime?: string;
  terminal?: string;
  containerNumber?: string;
  vesselName?: string;
  voyageNumber?: string;
  requireTemp: string;
  requireTempUnit: string;
  readingTemp: string;
  readingTempUnit: string;
  readingTime: string;
  shipmentType?: string;
  shippingLine?: string;
  billOfLadingNumber?: string;
  bookingNumber?: string;
  createDate?: string;
  modifyDate?: string;
}

export interface TerminalData {
  id?: string;
  version?: number;
  containerNo?: string;
  shipmentType?: string;
  shippingLine?: string;
  billOfLadingNumber?: string;
  bookingNumber?: string;
  reeferData?: ReeferData;
  hotboxData?: any;
}

export interface OpShipmentEventRaw {
  id: string;
  version: number;
  egateNo?: string;
  eventId: string;
  eventTime?: string;
  source: string;
  blNo: string;
  bookingNo?: string;
  shippingLine: string;
  containerNo: string;
  containerSize: string;
  containerType: string;
  shipmentType: 'IM' | 'EX' | 'TS';
  containerISOCode: string;
  containerWeight?: string;
  pscNo?: string;
  eGateNo?: string;
  sealNo?: string[];
  dg?: string[];
  dmg?: string[];
  createDate?: string;
  modifyDate?: string;
  transportEvents?: OpTransportEvent[];
  equipmentEvents?: OpEquipmentEvent[];
  pol?: Location;
  pod?: Location;
  terminalData?: TerminalData;
}

export interface AiPrediction {
  targetEventCode: string;
  locationCode?: string;
  predictedTime: string;
  delayHours: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  drivers?: string[];
}

export interface AiInsights {
  modelVersion: string;
  generatedAt: string;
  predictions: AiPrediction[];
}
