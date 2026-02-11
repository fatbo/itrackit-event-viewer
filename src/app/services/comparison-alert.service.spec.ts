import { ComparisonAlertService } from './comparison-alert.service';
import { EventData } from './event-data';
import { I18nService } from './i18n.service';
import { TestBed } from '@angular/core/testing';
import { ShipmentData, OpTransportEvent, ShipmentEvent } from '../models/shipment-event.model';

describe('ComparisonAlertService', () => {
  let service: ComparisonAlertService;
  let eventData: EventData;
  let i18n: I18nService;

  function makeShipmentData(overrides: Partial<ShipmentData> = {}): ShipmentData {
    return {
      events: [],
      transportEvents: [],
      ...overrides,
    };
  }

  function makeTransportEvent(overrides: Partial<OpTransportEvent>): OpTransportEvent {
    return {
      eventCode: 'VD',
      locationType: 'POL',
      eventTime: '2025-02-18T14:00:00+08:00',
      timeType: 'A',
      location: { unLocationCode: 'CNYTN', unLocationName: 'Yantian' },
      ...overrides,
    } as OpTransportEvent;
  }

  function makeEquipmentEvent(overrides: Partial<ShipmentEvent> = {}): ShipmentEvent {
    return {
      eventType: 'Gate In',
      eventDateTime: '2025-02-17T15:00:00+08:00',
      description: '',
      eventCode: 'IG',
      locationType: 'POL',
      timeType: 'A',
      unLocationCode: 'CNYTN',
      unLocationName: 'Yantian',
      ...overrides,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComparisonAlertService, EventData, I18nService],
    });
    service = TestBed.inject(ComparisonAlertService);
    eventData = TestBed.inject(EventData);
    i18n = TestBed.inject(I18nService);
  });

  it('should return empty alerts when no comparison data', () => {
    expect(service.alerts()).toEqual([]);
  });

  it('should return empty alerts when only primary data loaded', () => {
    eventData.setPrimaryEvent(makeShipmentData());
    expect(service.alerts()).toEqual([]);
  });

  describe('Info alerts', () => {
    it('should detect actual IG at POL', () => {
      eventData.setPrimaryEvent(makeShipmentData());
      const eventTime = '2025-02-17T15:00:00+08:00';
      eventData.setSecondaryEvent(makeShipmentData({
        events: [makeEquipmentEvent({
          eventCode: 'IG',
          locationType: 'POL',
          timeType: 'A',
          eventDateTime: eventTime,
        })],
      }));

      const infoAlerts = service.infoAlerts();
      const alert = infoAlerts.find(item => item.category === 'POL');
      const locationLabel = i18n.t('alerts.detail.location', { location: 'Yantian (CNYTN)' });
      const timeLabel = i18n.t('alerts.detail.time', {
        time: new Date(eventTime).toLocaleString(i18n.localeTag()),
      });
      expect(infoAlerts.length).toBeGreaterThanOrEqual(1);
      expect(infoAlerts.some(a => a.category === 'POL')).toBe(true);
      expect(alert?.message).toContain(locationLabel);
      expect(alert?.message).toContain(timeLabel);
    });

    it('should not alert when actual IG at POL already exists in primary', () => {
      eventData.setPrimaryEvent(makeShipmentData({
        events: [makeEquipmentEvent({ eventCode: 'IG', locationType: 'POL', timeType: 'A' })],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        events: [makeEquipmentEvent({ eventCode: 'IG', locationType: 'POL', timeType: 'A' })],
      }));

      const infoAlerts = service.infoAlerts();
      expect(infoAlerts.length).toBe(0);
    });

    it('should detect actual OG at POL', () => {
      eventData.setPrimaryEvent(makeShipmentData());
      eventData.setSecondaryEvent(makeShipmentData({
        events: [makeEquipmentEvent({ eventCode: 'OG', locationType: 'POL', timeType: 'A' })],
      }));

      const infoAlerts = service.infoAlerts();
      expect(infoAlerts.some(a => a.category === 'POL')).toBe(true);
    });

    it('should detect actual VD at POL from transport events', () => {
      eventData.setPrimaryEvent(makeShipmentData());
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VD',
          locationType: 'POL',
          timeType: 'A',
          conveyanceInfo: { conveyanceName: 'Test Vessel', conveyanceNumber: 'V001' },
        })],
      }));

      const infoAlerts = service.infoAlerts();
      const alert = infoAlerts.find(item => item.category === 'POL');
      const locationLabel = i18n.t('alerts.detail.location', { location: 'Yantian (CNYTN)' });
      const timeLabel = i18n.t('alerts.detail.time', {
        time: new Date('2025-02-18T14:00:00+08:00').toLocaleString(i18n.localeTag()),
      });
      const conveyanceLabel = i18n.t('alerts.detail.conveyance', {
        conveyance: 'Test Vessel (V001)',
      });
      expect(infoAlerts.some(a => a.category === 'POL')).toBe(true);
      expect(alert?.message).toContain(locationLabel);
      expect(alert?.message).toContain(timeLabel);
      expect(alert?.message).toContain(conveyanceLabel);
    });

    it('should detect actual VA at POD', () => {
      eventData.setPrimaryEvent(makeShipmentData());
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({ eventCode: 'VA', locationType: 'POD', timeType: 'A' })],
      }));

      const infoAlerts = service.infoAlerts();
      expect(infoAlerts.some(a => a.category === 'POD')).toBe(true);
    });

    it('should detect actual IG at POD', () => {
      eventData.setPrimaryEvent(makeShipmentData());
      eventData.setSecondaryEvent(makeShipmentData({
        events: [makeEquipmentEvent({ eventCode: 'IG', locationType: 'POD', timeType: 'A' })],
      }));

      const infoAlerts = service.infoAlerts();
      expect(infoAlerts.some(a => a.category === 'POD')).toBe(true);
    });

    it('should not generate info alert for estimated events', () => {
      eventData.setPrimaryEvent(makeShipmentData());
      eventData.setSecondaryEvent(makeShipmentData({
        events: [makeEquipmentEvent({ eventCode: 'IG', locationType: 'POL', timeType: 'E' })],
      }));

      const infoAlerts = service.infoAlerts();
      expect(infoAlerts.length).toBe(0);
    });
  });

  describe('Warning alerts - estimated time changes', () => {
    it('should warn when estimated VD at POL changes beyond threshold', () => {
      service.polVdThresholdHours.set(12);

      eventData.setPrimaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VD', locationType: 'POL', timeType: 'E',
          eventTime: '2025-02-18T14:00:00+08:00',
        })],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VD', locationType: 'POL', timeType: 'E',
          eventTime: '2025-02-19T14:00:00+08:00',
        })],
      }));

      const warnings = service.warningAlerts();
      const previousTime = new Date('2025-02-18T14:00:00+08:00').toLocaleString(i18n.localeTag());
      const currentTime = new Date('2025-02-19T14:00:00+08:00').toLocaleString(i18n.localeTag());
      const diffHours = (new Date('2025-02-19T14:00:00+08:00').getTime() -
        new Date('2025-02-18T14:00:00+08:00').getTime()) / (1000 * 60 * 60);
      const diffLabel = `${diffHours >= 0 ? '+' : '-'}${Math.abs(diffHours).toFixed(1)} ${i18n.t('alerts.units.hoursShort')}`;
      const alert = warnings.find(item => item.category === 'POL');
      expect(warnings.some(a => a.category === 'POL')).toBe(true);
      expect(alert?.message).toContain(previousTime);
      expect(alert?.message).toContain(currentTime);
      expect(alert?.message).toContain(diffLabel);
    });

    it('should not warn when estimated VD change is within threshold', () => {
      service.polVdThresholdHours.set(48);

      eventData.setPrimaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VD', locationType: 'POL', timeType: 'E',
          eventTime: '2025-02-18T14:00:00+08:00',
        })],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VD', locationType: 'POL', timeType: 'E',
          eventTime: '2025-02-19T14:00:00+08:00',
        })],
      }));

      const warnings = service.warningAlerts();
      expect(warnings.some(a => a.category === 'POL')).toBe(false);
    });

    it('should skip VD warning when actual VD already exists at POL', () => {
      service.polVdThresholdHours.set(12);

      eventData.setPrimaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VD', locationType: 'POL', timeType: 'E',
          eventTime: '2025-02-18T14:00:00+08:00',
        })],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [
          makeTransportEvent({
            eventCode: 'VD', locationType: 'POL', timeType: 'E',
            eventTime: '2025-02-19T14:00:00+08:00',
          }),
          makeTransportEvent({
            eventCode: 'VD', locationType: 'POL', timeType: 'A',
            eventTime: '2025-02-18T16:00:00+08:00',
          }),
        ],
      }));

      const warnings = service.warningAlerts();
      expect(warnings.filter(a => a.category === 'POL').length).toBe(0);
    });

    it('should warn when estimated VA at POD changes beyond threshold', () => {
      service.podVaThresholdHours.set(12);

      eventData.setPrimaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VA', locationType: 'POD', timeType: 'E',
          eventTime: '2025-03-06T08:00:00+01:00',
        })],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [makeTransportEvent({
          eventCode: 'VA', locationType: 'POD', timeType: 'E',
          eventTime: '2025-03-07T08:00:00+01:00',
        })],
      }));

      const warnings = service.warningAlerts();
      const previousTime = new Date('2025-03-06T08:00:00+01:00').toLocaleString(i18n.localeTag());
      const currentTime = new Date('2025-03-07T08:00:00+01:00').toLocaleString(i18n.localeTag());
      const diffHours = (new Date('2025-03-07T08:00:00+01:00').getTime() -
        new Date('2025-03-06T08:00:00+01:00').getTime()) / (1000 * 60 * 60);
      const diffLabel = `${diffHours >= 0 ? '+' : '-'}${Math.abs(diffHours).toFixed(1)} ${i18n.t('alerts.units.hoursShort')}`;
      const alert = warnings.find(item => item.category === 'POD');
      expect(warnings.some(a => a.category === 'POD')).toBe(true);
      expect(alert?.message).toContain(previousTime);
      expect(alert?.message).toContain(currentTime);
      expect(alert?.message).toContain(diffLabel);
    });
  });

  describe('Warning alerts - transition port changes', () => {
    it('should warn when number of transition ports changes', () => {
      eventData.setPrimaryEvent(makeShipmentData({
        transportEvents: [
          makeTransportEvent({ locationType: 'POT', location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' } }),
        ],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [
          makeTransportEvent({ locationType: 'POT', location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' } }),
          makeTransportEvent({ locationType: 'POT', location: { unLocationCode: 'SAJED', unLocationName: 'Jeddah' } }),
        ],
      }));

      const warnings = service.warningAlerts();
      expect(warnings.some(a => a.category === 'route')).toBe(true);
    });

    it('should not warn when transition ports are the same', () => {
      eventData.setPrimaryEvent(makeShipmentData({
        transportEvents: [
          makeTransportEvent({ locationType: 'POT', location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' } }),
        ],
      }));
      eventData.setSecondaryEvent(makeShipmentData({
        transportEvents: [
          makeTransportEvent({ locationType: 'POT', location: { unLocationCode: 'SGSIN', unLocationName: 'Singapore' } }),
        ],
      }));

      const warnings = service.warningAlerts();
      expect(warnings.some(a => a.category === 'route')).toBe(false);
    });
  });
});
