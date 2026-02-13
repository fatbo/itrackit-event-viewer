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

  it('computes dwell time at ports with both arrival and departure', () => {
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
          location: { unLocationCode: 'CNYTN', unLocationName: 'Yantian, CN' },
        },
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POT',
          eventTime: '2025-02-21T06:00:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore, SG' },
        },
        {
          seq: 3,
          eventCode: 'VD',
          locationType: 'POT',
          eventTime: '2025-02-22T18:00:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore, SG' },
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const ports = (fixture.componentInstance as any).portTransition();
    const sgPort = ports.find((p: any) => p.locationCode === 'SGSIN');
    expect(sgPort).toBeTruthy();
    // 36 hours between arrival and departure
    expect(sgPort.dwellTimeHours).toBe(36);
  });

  it('resolves seq conflicts using higher-priority data provider values', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [],
      transportEvents: [
        {
          seq: 1,
          eventCode: 'VD',
          locationType: 'POL',
          eventTime: '2025-02-05T15:29:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' },
          DataProvider: 'provider-a',
          DataProviderPriority: 1,
        },
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-12T02:12:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'HKHKG', unLocationName: 'Hong Kong,CN' },
          DataProvider: 'provider-b',
          DataProviderPriority: 5,
        },
        {
          seq: 3,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-12T02:12:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'HKHKG', unLocationName: 'Hong Kong,CN' },
          DataProvider: 'provider-a',
          DataProviderPriority: 1,
        },
        {
          seq: 3,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-06T05:55:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'MYPKG', unLocationName: 'Port Klang,MY' },
          DataProvider: 'provider-b',
          DataProviderPriority: 5,
        },
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-06T05:55:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'MYPKG', unLocationName: 'Port Klang,MY' },
          DataProvider: 'provider-a',
          DataProviderPriority: 1,
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const ports = (fixture.componentInstance as any).portTransition();
    expect(ports.map((port: any) => port.locationCode)).toEqual(['SGSIN', 'MYPKG', 'HKHKG']);
  });

  it('treats missing DataProviderPriority as lower priority during seq conflict resolution', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [],
      transportEvents: [
        {
          seq: 1,
          eventCode: 'VD',
          locationType: 'POL',
          eventTime: '2025-02-05T15:29:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' },
          DataProviderPriority: 1,
        },
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-12T02:12:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'HKHKG', unLocationName: 'Hong Kong,CN' },
        },
        {
          seq: 3,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-12T02:12:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'HKHKG', unLocationName: 'Hong Kong,CN' },
          DataProviderPriority: 1,
        },
        {
          seq: 3,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-06T05:55:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'MYPKG', unLocationName: 'Port Klang,MY' },
        },
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POD',
          eventTime: '2025-02-06T05:55:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'MYPKG', unLocationName: 'Port Klang,MY' },
          DataProviderPriority: 1,
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const ports = (fixture.componentInstance as any).portTransition();
    expect(ports.map((port: any) => port.locationCode)).toEqual(['SGSIN', 'MYPKG', 'HKHKG']);
  });

  it('computes ETA variance when both actual and estimated times exist', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const component = fixture.componentInstance;

    const eventOnTime = {
      eventType: 'Loaded',
      eventDateTime: '2025-01-10T10:00:00Z',
      description: 'test',
      actualTime: '2025-01-10T10:00:00Z',
      estimatedTime: '2025-01-10T09:00:00Z',
    };

    const eventLate = {
      eventType: 'Loaded',
      eventDateTime: '2025-01-10T20:00:00Z',
      description: 'test',
      actualTime: '2025-01-10T20:00:00Z',
      estimatedTime: '2025-01-10T06:00:00Z',
    };

    const variance1 = (component as any).getEtaVariance(eventOnTime);
    expect(variance1).toBeTruthy();
    expect(variance1.diffHours).toBe(1);
    expect(variance1.tone).toBe('green');

    const variance2 = (component as any).getEtaVariance(eventLate);
    expect(variance2).toBeTruthy();
    expect(variance2.diffHours).toBe(14);
    expect(variance2.tone).toBe('red');
  });

  it('returns null ETA variance when no estimated time', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const component = fixture.componentInstance;

    const eventNoEst = {
      eventType: 'Loaded',
      eventDateTime: '2025-01-10T10:00:00Z',
      description: 'test',
      actualTime: '2025-01-10T10:00:00Z',
    };

    expect((component as any).getEtaVariance(eventNoEst)).toBeNull();
  });

  it('builds milestone steps from equipment and transport events', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        { eventType: 'Gate In', eventDateTime: '2025-01-10T08:00:00Z', description: 'test', eventCode: 'IG', locationType: 'POL', timeType: 'A' },
        { eventType: 'Loaded', eventDateTime: '2025-01-10T10:00:00Z', description: 'test', eventCode: 'AL', locationType: 'POL', timeType: 'A' },
      ],
      transportEvents: [
        { eventCode: 'VD', locationType: 'POL', eventTime: '2025-01-10T14:00:00Z', timeType: 'A', location: { unLocationCode: 'CNYTN', unLocationName: 'Yantian, CN' } },
        { eventCode: 'VA', locationType: 'POD', eventTime: '2025-01-20T08:00:00Z', timeType: 'E', location: { unLocationCode: 'NLRTM', unLocationName: 'Rotterdam, NL' } },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const milestones = (fixture.componentInstance as any).milestones();
    expect(milestones.length).toBeGreaterThanOrEqual(6);
    // Gate In at POL should be completed
    const gateIn = milestones.find((m: any) => m.eventCode === 'IG' && m.phase === 'origin');
    expect(gateIn?.completed).toBe(true);
    // Vessel Arrival at POD should not be completed (Estimated)
    const vaAtPod = milestones.find((m: any) => m.eventCode === 'VA' && m.phase === 'destination');
    expect(vaAtPod?.completed).toBe(false);
  });

  it('includes POC ports in transit milestones', () => {
    const fixture = TestBed.createComponent(EventTimeline);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [],
      transportEvents: [
        { eventCode: 'VD', locationType: 'POL', eventTime: '2025-01-10T14:00:00Z', timeType: 'A', location: { unLocationCode: 'ARBUE', unLocationName: 'Buenos Aires' } },
        { eventCode: 'VA', locationType: 'POC', eventTime: '2025-02-05T11:18:00Z', timeType: 'A', location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' } },
        { eventCode: 'VD', locationType: 'POC', eventTime: '2025-02-07T20:46:00Z', timeType: 'A', location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' } },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();

    const milestones = (fixture.componentInstance as any).milestones();
    const transitArrival = milestones.find((m: any) => m.eventCode === 'VA' && m.phase === 'transit' && m.label.includes('Singapore'));
    const transitDeparture = milestones.find((m: any) => m.eventCode === 'VD' && m.phase === 'transit' && m.label.includes('Singapore'));

    expect(transitArrival?.completed).toBe(true);
    expect(transitDeparture?.completed).toBe(true);
  });
});
