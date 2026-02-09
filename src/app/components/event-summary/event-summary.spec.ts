import { TestBed } from '@angular/core/testing';
import { EventSummary } from './event-summary';
import { EventData } from '../../services/event-data';
import { ShipmentData } from '../../models/shipment-event.model';

describe('EventSummary', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSummary],
    }).compileComponents();
  });

  it('marks shipments in transit without an actual POD gate event', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate Out',
          eventDateTime: '2025-01-10T08:00:00Z',
          description: 'Gate out at POL.',
          eventCode: 'OG',
          locationType: 'POL',
          timeType: 'A',
          unLocationCode: 'CNYTN',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance.shipmentStatus();
    expect(status?.label).toBe('In Transit');
  });

  it('marks Hong Kong-only departures as completed when no other actual events exist', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [],
      transportEvents: [
        {
          eventCode: 'VD',
          locationType: 'POT',
          eventTime: '2025-01-10T08:00:00Z',
          timeType: 'A',
          location: {
            unLocationCode: 'HKHKG',
            unLocationName: 'Hong Kong',
          },
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance.shipmentStatus();
    expect(status?.label).toBe('Completed (Hong Kong Only)');
  });

  it('keeps Hong Kong-only completion when equipment and transport departures are in Hong Kong', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Vessel Departure',
          eventDateTime: '2025-01-10T08:00:00Z',
          description: 'Departed Hong Kong.',
          eventCode: 'VD',
          locationType: 'POL',
          timeType: 'A',
          unLocationCode: 'HKHKG',
        },
        {
          eventType: 'Loaded on Vessel',
          eventDateTime: '2025-01-11T08:00:00Z',
          description: 'Loaded at Hong Kong.',
          eventCode: 'AL',
          locationType: 'POL',
          timeType: 'A',
          unLocationCode: 'HKHKG',
        },
      ],
      transportEvents: [
        {
          eventCode: 'VD',
          locationType: 'POC',
          eventTime: '2025-01-10T08:00:00Z',
          timeType: 'A',
          location: {
            unLocationCode: 'HKHKG',
            unLocationName: 'Hong Kong',
          },
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance.shipmentStatus();
    expect(status?.label).toBe('Completed (Hong Kong Only)');
  });

  it('marks shipments completed when POD gate events exist', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate Out',
          eventDateTime: '2025-01-10T08:00:00Z',
          description: 'Gate out at POD.',
          eventCode: 'OG',
          locationType: 'POD',
          timeType: 'A',
          unLocationCode: 'SGSIN',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance.shipmentStatus();
    expect(status?.label).toBe('Completed');
  });

  it('keeps shipments in transit when actual events exist outside Hong Kong without POD gates', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Vessel Departure',
          eventDateTime: '2025-01-10T08:00:00Z',
          description: 'Departed Hong Kong.',
          eventCode: 'VD',
          locationType: 'POL',
          timeType: 'A',
          unLocationCode: 'HKHKG',
        },
        {
          eventType: 'Vessel Arrival',
          eventDateTime: '2025-01-12T08:00:00Z',
          description: 'Arrived at Singapore.',
          eventCode: 'VA',
          locationType: 'POT',
          timeType: 'A',
          unLocationCode: 'SGSIN',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance.shipmentStatus();
    expect(status?.label).toBe('In Transit');
  });

  it('shows status unavailable when there are no events', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance.shipmentStatus();
    expect(status?.label).toBe('Status Unavailable');
  });
});
