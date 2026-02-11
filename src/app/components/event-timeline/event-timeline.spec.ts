import { TestBed } from '@angular/core/testing';
import { EventTimeline } from './event-timeline';
import { EventData } from '../../services/event-data';
import { ShipmentData } from '../../models/shipment-event.model';

describe('EventTimeline', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTimeline],
    }).compileComponents();
  });

  it('builds an index grouped by day', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate In',
          eventDateTime: '2024-01-10T12:00:00Z',
          description: 'Container gate in.',
        },
        {
          eventType: 'Loaded',
          eventDateTime: '2024-01-10T18:00:00Z',
          description: 'Container loaded on vessel.',
        },
        {
          eventType: 'Departure',
          eventDateTime: '2024-02-05T12:00:00Z',
          description: 'Vessel departed.',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.timelineIndex()).toEqual([
      { label: 'Jan 10, 2024', anchorId: 'event-0', count: 2 },
      { label: 'Feb 5, 2024', anchorId: 'event-2', count: 1 },
    ]);
  });

  it('exposes day labels for each event', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate In',
          eventDateTime: '2024-03-10T12:00:00Z',
          description: 'Container gate in.',
        },
        {
          eventType: 'Loaded',
          eventDateTime: '2024-03-10T18:00:00Z',
          description: 'Container loaded on vessel.',
        },
        {
          eventType: 'Departure',
          eventDateTime: '2024-04-05T12:00:00Z',
          description: 'Vessel departed.',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const labels = component.eventIndexLabels();
    expect(labels[0]).toBe('Mar 10, 2024');
    expect(labels[1]).toBe('Mar 10, 2024');
    expect(labels[2]).toBe('Apr 5, 2024');
  });

  it('returns location type CSS class for events', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const component = fixture.componentInstance;

    expect((component as any)['getLocationTypeClass']({ eventType: '', eventDateTime: '', description: '', locationType: 'POL' })).toBe('location-pol');
    expect((component as any)['getLocationTypeClass']({ eventType: '', eventDateTime: '', description: '', locationType: 'POD' })).toBe('location-pod');
    expect((component as any)['getLocationTypeClass']({ eventType: '', eventDateTime: '', description: '', locationType: 'POT' })).toBe('location-pot');
    expect((component as any)['getLocationTypeClass']({ eventType: '', eventDateTime: '', description: '' })).toBe('');
  });

  it('detects vessel changes between consecutive port transition legs', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [],
      transportEvents: [
        {
          seq: 1,
          eventCode: 'VD',
          locationType: 'POL',
          eventTime: '2025-02-18T14:00:00+08:00',
          timeType: 'A',
          conveyanceInfo: { conveyanceName: 'VESSEL A', conveyanceNumber: '001' },
          location: { unLocationCode: 'CNYTN', unLocationName: 'Yantian, CN' },
        },
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POT',
          eventTime: '2025-02-21T06:30:00+08:00',
          timeType: 'A',
          conveyanceInfo: { conveyanceName: 'VESSEL A', conveyanceNumber: '001' },
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore, SG' },
        },
        {
          seq: 3,
          eventCode: 'VD',
          locationType: 'POT',
          eventTime: '2025-02-22T20:00:00+08:00',
          timeType: 'A',
          conveyanceInfo: { conveyanceName: 'VESSEL B', conveyanceNumber: '002' },
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore, SG' },
        },
        {
          seq: 4,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-03-06T08:00:00+01:00',
          timeType: 'A',
          conveyanceInfo: { conveyanceName: 'VESSEL B', conveyanceNumber: '002' },
          location: { unLocationCode: 'NLRTM', unLocationName: 'Rotterdam, NL' },
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    // Vessel changes from A to B between POL (index 0) and POT (index 1)
    expect((component as any).getVesselChangeAt(0)).toBe('VESSEL B');
    // No change between POT and POD (both VESSEL B)
    expect((component as any).getVesselChangeAt(1)).toBeNull();
  });
});
