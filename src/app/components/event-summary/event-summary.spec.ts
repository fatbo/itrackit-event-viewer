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

  it('marks shipments in transit without an actual POL gate event', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Loaded on Vessel',
          eventDateTime: '2025-01-10T08:00:00Z',
          description: 'Loaded on vessel.',
          eventCode: 'AL',
          locationType: 'POL',
          timeType: 'A',
          unLocationCode: 'CNYTN',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance['shipmentStatus']?.();
    expect(status?.label).toBe('In Transit');
  });

  it('marks Hong Kong departures as completed tracking when no other actual events exist', () => {
    const fixture = TestBed.createComponent(EventSummary);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate Out',
          eventDateTime: '2025-01-10T08:00:00Z',
          description: 'Gate out at Hong Kong.',
          eventCode: 'OG',
          locationType: 'POL',
          timeType: 'A',
          unLocationCode: 'HKHKG',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance['shipmentStatus']?.();
    expect(status?.label).toBe('Completed (Hong Kong Tracking)');
  });

  it('marks shipments completed when POL gate events exist with other actual updates', () => {
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
        {
          eventType: 'Vessel Arrival',
          eventDateTime: '2025-01-15T08:00:00Z',
          description: 'Arrived at POD.',
          eventCode: 'VA',
          locationType: 'POD',
          timeType: 'A',
          unLocationCode: 'SGSIN',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const status = fixture.componentInstance['shipmentStatus']?.();
    expect(status?.label).toBe('Completed');
  });
});
