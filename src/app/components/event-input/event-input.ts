import { Component, signal, OnInit, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { JsonEditor } from '../json-editor/json-editor';
import { ShipmentData, OpShipmentEventRaw } from '../../models/shipment-event.model';
import { ShipmentParser } from '../../services/shipment-parser';
import { I18nService } from '../../services/i18n.service';
import { AiInsightsService } from '../../services/ai-insights.service';

@Component({
  selector: 'app-event-input',
  imports: [CommonModule, FormsModule, JsonEditor],
  templateUrl: './event-input.html',
  styleUrl: './event-input.css',
})
export class EventInput implements OnInit {
  @Input() onClose?: () => void;
  
  protected readonly i18n = inject(I18nService);
  protected readonly jsonInput = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);
  protected readonly isPrimary = signal(true);
  protected readonly isDemoData = signal(true);
  
  private readonly DEMO_DATA: OpShipmentEventRaw = {
    "id": "DEMO-1234567890",
    "version": 1,
    "egateNo": "OP-00052919",
    "eventId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "eventTime": "2026-01-05T08:00:00+08:00",
    "source": "oneport",
    "blNo": "AMQ0325766",
    "bookingNo": "BOOK0325766",
    "shippingLine": "CMDU",
    "containerNo": "SZLU9011734",
    "containerSize": "40",
    "containerType": "HC",
    "shipmentType": "TS" as const,
    "containerISOCode": "42G1",
    "containerWeight": "22500",
    "pscNo": "208928029892",
    "sealNo": ["CMA22309", "SEAL12345", "LOCK00789"],
    "dg": ["3/1234", "8/2809"],
    "dmg": ["DENT-LEFT", "SCRATCH-ROOF"],
    "createDate": "2026-01-04T10:00:00+08:00",
    "modifyDate": "2026-01-15T12:00:00+08:00",
    "pol": {
      "facilityCode": "YICT",
      "facilityName": "YANTIAN INTERNATIONAL CONTAINER TERMINAL",
      "unLocationCode": "CNYTN",
      "unLocationName": "Yantian, CN"
    },
    "pod": {
      "facilityCode": "APM",
      "facilityName": "APM TERMINALS ROTTERDAM",
      "unLocationCode": "NLRTM",
      "unLocationName": "Rotterdam, NL"
    },
    "transportEvents": [
      {
        "seq": 1,
        "eventCode": "VD",
        "eventName": "Vessel Departure",
        "locationType": "POL",
        "eventTime": "2026-01-06T18:00:00+08:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM ZHENG HE",
          "conveyanceNumber": "0FA51S1MA"
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
        "seq": 2,
        "eventCode": "VA",
        "eventName": "Vessel Arrival",
        "locationType": "POT",
        "eventTime": "2026-01-09T03:00:00+08:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM ZHENG HE",
          "conveyanceNumber": "0FA51S1MA"
        },
        "location": {
          "facilityCode": "SGPSA",
          "facilityName": "PSA SINGAPORE TERMINAL",
          "unLocationCode": "SGSIN",
          "unLocationName": "Singapore, SG"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 2
      },
      {
        "seq": 3,
        "eventCode": "VD",
        "eventName": "Vessel Departure",
        "locationType": "POT",
        "eventTime": "2026-01-10T14:00:00+08:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "SGPSA",
          "facilityName": "PSA SINGAPORE TERMINAL",
          "unLocationCode": "SGSIN",
          "unLocationName": "Singapore, SG"
        },
        "DataProvider": "Carrier",
        "DataProviderPriority": 1
      },
      {
        "seq": 4,
        "eventCode": "VA",
        "eventName": "Vessel Arrival",
        "locationType": "POT",
        "eventTime": "2026-01-16T02:00:00+03:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "JTCPT",
          "facilityName": "JEDDAH CONTAINER PORT TERMINAL",
          "unLocationCode": "SAJED",
          "unLocationName": "Jeddah, SA"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 2
      },
      {
        "seq": 5,
        "eventCode": "VD",
        "eventName": "Vessel Departure",
        "locationType": "POT",
        "eventTime": "2026-01-18T06:00:00+03:00",
        "timeType": "A",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "JTCPT",
          "facilityName": "JEDDAH CONTAINER PORT TERMINAL",
          "unLocationCode": "SAJED",
          "unLocationName": "Jeddah, SA"
        },
        "DataProvider": "Carrier",
        "DataProviderPriority": 1
      },
      {
        "seq": 6,
        "eventCode": "VA",
        "eventName": "Vessel Arrival",
        "locationType": "POD",
        "eventTime": "2026-01-24T08:00:00+01:00",
        "timeType": "E",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "APM",
          "facilityName": "APM TERMINALS ROTTERDAM",
          "unLocationCode": "NLRTM",
          "unLocationName": "Rotterdam, NL"
        },
        "DataProvider": "Carrier",
        "DataProviderPriority": 1
      }
    ],
    "equipmentEvents": [
      {
        "eventCode": "IG",
        "eventName": "Gate In",
        "locationType": "POL",
        "eventTime": "2026-01-05T09:00:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Truck",
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
        "eventCode": "AL",
        "eventName": "Loaded on Vessel",
        "locationType": "POL",
        "eventTime": "2026-01-06T14:30:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM ZHENG HE",
          "conveyanceNumber": "0FA51S1MA"
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
        "locationType": "POT",
        "eventTime": "2026-01-09T07:00:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM ZHENG HE",
          "conveyanceNumber": "0FA51S1MA"
        },
        "location": {
          "facilityCode": "SGPSA",
          "facilityName": "PSA SINGAPORE TERMINAL",
          "unLocationCode": "SGSIN",
          "unLocationName": "Singapore, SG"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 1
      },
      {
        "eventCode": "AL",
        "eventName": "Loaded on Vessel",
        "locationType": "POT",
        "eventTime": "2026-01-10T10:00:00+08:00",
        "timeType": "A",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "SGPSA",
          "facilityName": "PSA SINGAPORE TERMINAL",
          "unLocationCode": "SGSIN",
          "unLocationName": "Singapore, SG"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 1
      },
      {
        "eventCode": "UV",
        "eventName": "Unloaded From Vessel",
        "locationType": "POD",
        "eventTime": "2026-01-24T12:00:00+01:00",
        "timeType": "E",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "APM",
          "facilityName": "APM TERMINALS ROTTERDAM",
          "unLocationCode": "NLRTM",
          "unLocationName": "Rotterdam, NL"
        },
        "DataProvider": "Carrier",
        "DataProviderPriority": 1
      },
      {
        "eventCode": "UV",
        "eventName": "Unloaded From Vessel",
        "locationType": "POD",
        "eventTime": "2026-01-24T15:00:00+01:00",
        "timeType": "G",
        "containerStatus": "F",
        "modeOfTransport": "Ocean",
        "conveyanceInfo": {
          "conveyanceName": "CMA CGM JACQUES SAADE",
          "conveyanceNumber": "0FA52W1MA"
        },
        "location": {
          "facilityCode": "APM",
          "facilityName": "APM TERMINALS ROTTERDAM",
          "unLocationCode": "NLRTM",
          "unLocationName": "Rotterdam, NL"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 2
      },
      {
        "eventCode": "OG",
        "eventName": "Gate Out",
        "locationType": "POD",
        "eventTime": "2026-01-25T10:00:00+01:00",
        "timeType": "E",
        "containerStatus": "F",
        "modeOfTransport": "Truck",
        "location": {
          "facilityCode": "APM",
          "facilityName": "APM TERMINALS ROTTERDAM",
          "unLocationCode": "NLRTM",
          "unLocationName": "Rotterdam, NL"
        },
        "DataProvider": "Port",
        "DataProviderPriority": 1
      }
    ]
  };
  
  constructor(
    private eventDataService: EventData,
    private parser: ShipmentParser,
    private aiInsights: AiInsightsService
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
    this.isLoading.set(true);
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.isDemoData.set(false);
      this.processJsonInput(content);
    };
    
    reader.onerror = () => {
      this.errorMessage.set(this.i18n.t('input.error.readFile'));
      this.isLoading.set(false);
    };
    
    reader.readAsText(file);
  }
  
  onPasteJson(): void {
    this.isDemoData.set(false);
    this.processJsonInput(this.jsonInput());
  }
  
  private processJsonInput(jsonString: string): void {
    this.isLoading.set(true);
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
        this.errorMessage.set(this.i18n.t('input.error.invalidFormat'));
        return;
      }
      
      shipmentData = this.aiInsights.enrichShipment(shipmentData);
      
      // Validate that it has events array
      if (!shipmentData.events || !Array.isArray(shipmentData.events)) {
        this.errorMessage.set(this.i18n.t('input.error.noEvents'));
        return;
      }
      
      if (this.isPrimary()) {
        this.eventDataService.setPrimaryEvent(shipmentData);
      } else {
        this.eventDataService.setSecondaryEvent(shipmentData);
      }
      
      this.errorMessage.set('');
    } catch (error) {
      this.errorMessage.set(this.i18n.t('input.error.invalidJson'));
    } finally {
      this.isLoading.set(false);
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
    this.isLoading.set(false);
  }

  loadDemoData(): void {
    try {
      const shipmentData = this.aiInsights.enrichShipment(
        this.parser.parseOpShipmentEventRaw(this.DEMO_DATA)
      );
      this.eventDataService.setPrimaryEvent(shipmentData);
      this.isDemoData.set(true);
      this.errorMessage.set('');
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  }
}
