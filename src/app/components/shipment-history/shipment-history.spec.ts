import { TestBed } from '@angular/core/testing';
import { ShipmentHistory } from './shipment-history';
import { HistoryService } from '../../services/history.service';
import { OpShipmentEventRaw } from '../../models/shipment-event.model';

function makeRawShipment(id: string): OpShipmentEventRaw {
  return {
    id,
    version: 1,
    eventId: `event-${id}`,
    source: 'oneport',
    blNo: `BL-${id}`,
    shippingLine: 'CMDU',
    containerNo: `CONT-${id}`,
    containerSize: '40',
    containerType: 'HC',
    shipmentType: 'TS',
    containerISOCode: '42G1',
    equipmentEvents: [],
  };
}

describe('ShipmentHistory', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ShipmentHistory],
      providers: [HistoryService],
    }).compileComponents();
  });

  it('renders stored entries when expanded', () => {
    const historyService = TestBed.inject(HistoryService);
    historyService.addEntry(makeRawShipment('S1'));

    const fixture = TestBed.createComponent(ShipmentHistory);
    fixture.detectChanges();

    const toggleButton = fixture.nativeElement.querySelector('.history-toggle-btn') as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.history-item h4');
    expect(title?.textContent).toContain('S1');
  });

  it('emits selected raw data when loading from history', () => {
    const historyService = TestBed.inject(HistoryService);
    const raw = makeRawShipment('S2');
    historyService.addEntry(raw);

    const fixture = TestBed.createComponent(ShipmentHistory);
    let emitted: unknown = null;
    fixture.componentInstance.loadShipment.subscribe((value) => {
      emitted = value;
    });

    fixture.detectChanges();
    const toggleButton = fixture.nativeElement.querySelector('.history-toggle-btn') as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    const loadButton = fixture.nativeElement.querySelector('.history-load-btn') as HTMLButtonElement;
    loadButton.click();

    expect(emitted).toEqual(raw);
  });
});
