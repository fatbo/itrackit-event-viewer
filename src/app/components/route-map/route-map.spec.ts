import { TestBed } from '@angular/core/testing';
import { RouteMap } from './route-map';
import { EventData } from '../../services/event-data';
import { LocationLookupService } from '../../services/location-lookup.service';
import { ShipmentData } from '../../models/shipment-event.model';

describe('RouteMap', () => {
  const lookupMock = {
    getCoordinates: async (code?: string | null) => {
      const lookup = {
        CNYTN: { lat: 22.55, lng: 114.2667, name: 'Yantian' },
        SGSIN: { lat: 1.3333, lng: 103.85, name: 'Singapore' },
      } as const;
      return (code && lookup[code as keyof typeof lookup]) || null;
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteMap],
      providers: [{ provide: LocationLookupService, useValue: lookupMock }],
    }).compileComponents();
  });

  it('builds an ordered route from transport events and maps available points', async () => {
    const fixture = TestBed.createComponent(RouteMap);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate In',
          eventDateTime: '2025-02-18T09:00:00+08:00',
          description: 'Gate in',
          unLocationCode: 'CNYTN',
          unLocationName: 'Yantian',
          eventCode: 'IG',
        },
      ],
      transportEvents: [
        {
          seq: 2,
          eventCode: 'VA',
          locationType: 'POT',
          eventTime: '2025-02-22T10:00:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' },
        },
        {
          seq: 1,
          eventCode: 'VD',
          locationType: 'POL',
          eventTime: '2025-02-18T10:00:00+08:00',
          timeType: 'A',
          location: { unLocationCode: 'CNYTN', unLocationName: 'Yantian' },
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();
    await (fixture.componentInstance as any).updateRouteData(shipment);

    expect(fixture.componentInstance['routePoints']().map((point: any) => point.code)).toEqual([
      'CNYTN',
      'SGSIN',
    ]);
  });

  it('tracks unmapped locations when lookup has no coordinates', async () => {
    const fixture = TestBed.createComponent(RouteMap);
    const eventData = TestBed.inject(EventData);
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Unknown Event',
          eventDateTime: '2025-02-20T09:00:00+08:00',
          description: 'Unknown location',
          unLocationCode: 'ZZZZZ',
          unLocationName: 'Unknown Port',
        },
      ],
    };

    eventData.setPrimaryEvent(shipment);
    fixture.detectChanges();
    await (fixture.componentInstance as any).updateRouteData(shipment);

    expect(fixture.componentInstance['routePoints']().length).toBe(0);
    expect(fixture.componentInstance['missingLocations']()).toContain('Unknown Port');
  });

  it('treats ports with actual events as arrived for solid route segments', () => {
    const fixture = TestBed.createComponent(RouteMap);
    const component = fixture.componentInstance as any;

    expect(
      component['hasArrived']({
        name: 'Singapore',
        lat: 1,
        lng: 2,
        events: [],
        transportEvents: [{ eventCode: 'VA', timeType: 'A' }],
      })
    ).toBe(true);

    expect(
      component['hasArrived']({
        name: 'Singapore',
        lat: 1,
        lng: 2,
        events: [],
        transportEvents: [{ eventCode: 'VA', timeType: 'E' }],
      })
    ).toBe(false);
  });

  it('includes estimated arrival and departure in popup when actual events are missing', () => {
    const fixture = TestBed.createComponent(RouteMap);
    const component = fixture.componentInstance as any;
    const popup = component['buildPopupContent']({
      name: 'Singapore',
      code: 'SGSIN',
      lat: 1,
      lng: 2,
      events: [],
      transportEvents: [
        {
          eventCode: 'VA',
          timeType: 'E',
          eventTime: '2025-02-22T10:00:00+08:00',
        },
        {
          eventCode: 'VD',
          timeType: 'E',
          eventTime: '2025-02-23T11:00:00+08:00',
        },
      ],
    });

    expect(popup).toContain('Estimated Vessel Arrival');
    expect(popup).toContain('Estimated Vessel Departure');
  });
});
