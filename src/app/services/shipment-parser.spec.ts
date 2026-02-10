import { ShipmentParser } from './shipment-parser';
import { OpShipmentEventRaw } from '../models/shipment-event.model';
import { I18nService } from './i18n.service';

describe('ShipmentParser', () => {
  let parser: ShipmentParser;

  const baseLocation = {
    unLocationCode: 'CNYTN',
    unLocationName: 'Yantian, CN',
  };

  const baseRaw: OpShipmentEventRaw = {
    id: 'DEMO-1',
    version: 1,
    eventId: 'evt-1',
    source: 'oneport',
    blNo: 'BL-1',
    shippingLine: 'CMDU',
    containerNo: 'CONT-1',
    containerSize: '20',
    containerType: 'GP',
    shipmentType: 'IM',
    containerISOCode: '22G1',
    equipmentEvents: [],
  };

  beforeEach(() => {
    parser = new ShipmentParser(new I18nService());
  });

  it('ignores transport events when parsing raw data', () => {
    const data = parser.parseOpShipmentEventRaw({
      ...baseRaw,
      transportEvents: [
        {
          eventCode: 'VD',
          locationType: 'POL',
          eventTime: '2025-02-20T14:00:00+08:00',
          timeType: 'A',
          location: baseLocation,
        },
      ],
      equipmentEvents: [
        {
          eventCode: 'OG',
          eventName: 'Gate Out',
          locationType: 'POL',
          eventTime: '2025-02-20T10:30:00+08:00',
          timeType: 'A',
          containerStatus: 'F',
          location: baseLocation,
        },
      ],
    });

    expect(data.events).toHaveLength(1);
    expect(data.events[0].eventCode).toBe('OG');
  });

  it('includes the location code when a location name is present', () => {
    const data = parser.parseOpShipmentEventRaw({
      ...baseRaw,
      equipmentEvents: [
        {
          eventCode: 'OG',
          eventName: 'Gate Out',
          locationType: 'POL',
          eventTime: '2025-02-20T10:30:00+08:00',
          timeType: 'A',
          containerStatus: 'F',
          location: baseLocation,
        },
      ],
    });

    expect(data.events[0].location).toContain('Yantian, CN');
    expect(data.events[0].location).toContain('(CNYTN)');
  });

  it('keeps estimated times alongside actual times', () => {
    const data = parser.parseOpShipmentEventRaw({
      ...baseRaw,
      equipmentEvents: [
        {
          eventCode: 'AL',
          eventName: 'Loaded on Vessel',
          locationType: 'POL',
          eventTime: '2025-02-20T10:30:00+08:00',
          timeType: 'A',
          containerStatus: 'F',
          location: baseLocation,
        },
        {
          eventCode: 'AL',
          eventName: 'Loaded on Vessel',
          locationType: 'POL',
          eventTime: '2025-02-20T12:00:00+08:00',
          timeType: 'E',
          containerStatus: 'F',
          location: baseLocation,
        },
      ],
    });

    expect(data.events[0].actualTime).toBe('2025-02-20T10:30:00+08:00');
    expect(data.events[0].estimatedTime).toBe('2025-02-20T12:00:00+08:00');
    expect(data.events[0].timeDetails ?? '').toContain('Estimated');
  });
});
