import { HistoryService } from './history.service';
import { OpShipmentEventRaw } from '../models/shipment-event.model';

function makeRawShipment(id: string, containerNo = `CONT-${id}`): OpShipmentEventRaw {
  return {
    id,
    version: 1,
    eventId: `event-${id}`,
    source: 'oneport',
    blNo: `BL-${id}`,
    shippingLine: 'CMDU',
    containerNo,
    containerSize: '40',
    containerType: 'HC',
    shipmentType: 'TS',
    containerISOCode: '42G1',
    equipmentEvents: [],
  };
}

describe('HistoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('adds entries and deduplicates by shipment identity', () => {
    const service = new HistoryService();

    service.addEntry(makeRawShipment('S1'));
    service.addEntry(makeRawShipment('S1', 'CONT-NEW'));

    const entries = service.entries();
    expect(entries.length).toBe(1);
    expect(entries[0].metadata.shipmentId).toBe('S1');
    expect(entries[0].metadata.containerNumber).toBe('CONT-NEW');
  });

  it('prunes history to the latest 15 entries', () => {
    const service = new HistoryService();

    for (let i = 1; i <= 20; i += 1) {
      service.addEntry(makeRawShipment(`S${i}`));
    }

    const entries = service.entries();
    expect(entries.length).toBe(15);
    expect(entries[0].metadata.shipmentId).toBe('S20');
    expect(entries[14].metadata.shipmentId).toBe('S6');
  });

  it('reads history from sessionStorage when localStorage is empty', () => {
    sessionStorage.setItem(
      'itrackit.shipment-history',
      JSON.stringify([
        {
          key: 'S1-1',
          identity: 'S1',
          metadata: { shipmentId: 'S1', containerNumber: 'CONT-S1' },
          rawData: makeRawShipment('S1'),
          viewedAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );

    const service = new HistoryService();
    expect(service.entries().length).toBe(1);
    expect(service.entries()[0].metadata.shipmentId).toBe('S1');
  });
});
