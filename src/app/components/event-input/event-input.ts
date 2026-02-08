import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentData, OpShipmentEventRaw } from '../../models/shipment-event.model';
import { ShipmentParser } from '../../services/shipment-parser';

@Component({
  selector: 'app-event-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-input.html',
  styleUrl: './event-input.css',
})
export class EventInput implements OnInit {
  protected readonly jsonInput = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isPrimary = signal(true);
  protected readonly isDemoData = signal(true);
  
  private readonly DEMO_DATA: OpShipmentEventRaw = {
    "id": "DEMO-1234567890",
    "version": 1,
    "egateNo": "OP-00052919",
    "eventId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "eventTime": "2025-02-20T00:30+08:00",
    "source": "oneport",
    "blNo": "AMQ0325766",
    "bookingNo": "BOOK0325766",
    "shippingLine": "CMDU",
    "containerNo": "SZLU9011734",
    "containerSize": "45",
    "containerType": "r1",
    "shipmentType": "IM" as const,
    "containerISOCode": "45RT",
    "containerWeight": "20000",
    "pscNo": "208928029892",
    "sealNo": ["CMA22309", "SEAL12345"],
    "dg": ["2092/22"],
    "dmg": ["LEFT"],
    "createDate": "2025-02-19T10:00:00+08:00",
    "modifyDate": "2025-02-20T00:30:00+08:00",
    "pol": {
      "facilityCode": "YICT",
      "facilityName": "YANTIAN INTERNATIONAL CONTAINER TERMINAL",
      "unLocationCode": "CNYTN",
      "unLocationName": "Yantian, CN"
    },
    "pod": {
      "facilityCode": "HIT",
      "facilityName": "HONG KONG INTERNATIONAL TERMINAL",
      "unLocationCode": "HKHKG",
      "unLocationName": "Hong Kong, CN"
    },
    "transportEvents": [
      {
        "eventCode": "VD",
        "eventName": "Vessel Departure",
        "locationType": "POL",
        "eventTime": "2025-02-20T14:00:00+08:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CNC CHEETAH",
          "conveyanceNumber": "0XW80S1NC"
        },
        "location": {
          "facilityCode": "YICT",
          "facilityName": "YANTIAN INTERNATIONAL CONTAINER TERMINAL",
          "unLocationCode": "CNYTN",
          "unLocationName": "Yantian, CN"
        },
        "DataProvider": "Carrier",
        "DataProviderPriority": 1
      },
      {
        "eventCode": "VA",
        "eventName": "Vessel Arrival",
        "locationType": "POD",
        "eventTime": "2025-02-22T19:23:21+08:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CNC CHEETAH",
          "conveyanceNumber": "0XW80S1NC"
        },
        "location": {
          "facilityCode": "HIT",
          "facilityName": "HONG KONG INTERNATIONAL TERMINAL",
          "unLocationCode": "HKHKG",
          "unLocationName": "Hong Kong, CN"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 2
      }
    ],
    "equipmentEvents": [
      {
        "eventCode": "AL",
        "eventName": "Loaded on Vessel",
        "locationType": "POL",
        "eventTime": "2025-02-20T10:30:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CNC CHEETAH",
          "conveyanceNumber": "0XW80S1NC"
        },
        "location": {
          "facilityCode": "YICT",
          "facilityName": "YANTIAN INTERNATIONAL CONTAINER TERMINAL",
          "unLocationCode": "CNYTN",
          "unLocationName": "Yantian, CN"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 1
      },
      {
        "eventCode": "UV",
        "eventName": "Unloaded From Vessel",
        "locationType": "POD",
        "eventTime": "2025-02-22T19:00:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CNC CHEETAH",
          "conveyanceNumber": "0XW80S1NC"
        },
        "location": {
          "facilityCode": "HIT",
          "facilityName": "HONG KONG INTERNATIONAL TERMINAL",
          "unLocationCode": "HKHKG",
          "unLocationName": "Hong Kong, CN"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 1
      },
      {
        "eventCode": "OG",
        "eventName": "Gate Out",
        "locationType": "POD",
        "eventTime": "2025-02-23T08:15:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Truck",
        "location": {
          "facilityCode": "HIT",
          "facilityName": "HONG KONG INTERNATIONAL TERMINAL",
          "unLocationCode": "HKHKG",
          "unLocationName": "Hong Kong, CN"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 1
      }
    ]
  };
  
  constructor(
    private eventDataService: EventData,
    private parser: ShipmentParser
  ) {}

  ngOnInit(): void {
    // Load demo data on initialization
    this.loadDemoData();
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.isDemoData.set(false);
      this.processJsonInput(content);
    };
    
    reader.onerror = () => {
      this.errorMessage.set('Error reading file');
    };
    
    reader.readAsText(file);
  }
  
  onPasteJson(): void {
    this.isDemoData.set(false);
    this.processJsonInput(this.jsonInput());
  }
  
  private processJsonInput(jsonString: string): void {
    try {
      const parsedData = JSON.parse(jsonString);
      let shipmentData: ShipmentData;
      
      // Check if it's OpShipmentEventRaw format
      if (this.parser.isOpShipmentEventRaw(parsedData)) {
        shipmentData = this.parser.parseOpShipmentEventRaw(parsedData);
      } else if (this.parser.isShipmentData(parsedData)) {
        // Already in ShipmentData format
        shipmentData = parsedData;
      } else {
        this.errorMessage.set('Invalid shipment data format. Please provide either OpShipmentEventRaw or ShipmentData format.');
        return;
      }
      
      // Validate that it has events array
      if (!shipmentData.events || !Array.isArray(shipmentData.events)) {
        this.errorMessage.set('Invalid shipment data: no events found');
        return;
      }
      
      if (this.isPrimary()) {
        this.eventDataService.setPrimaryEvent(shipmentData);
      } else {
        this.eventDataService.setSecondaryEvent(shipmentData);
      }
      
      this.errorMessage.set('');
      this.jsonInput.set('');
    } catch (error) {
      this.errorMessage.set('Invalid JSON format. Please check your JSON syntax and try again.');
    }
  }
  
  toggleEventType(): void {
    this.isPrimary.set(!this.isPrimary());
  }
  
  clearAll(): void {
    this.jsonInput.set('');
    this.errorMessage.set('');
    this.eventDataService.clearEvents();
    this.isDemoData.set(false);
  }

  loadDemoData(): void {
    try {
      const shipmentData = this.parser.parseOpShipmentEventRaw(this.DEMO_DATA);
      this.eventDataService.setPrimaryEvent(shipmentData);
      this.isDemoData.set(true);
      this.errorMessage.set('');
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  }
}

