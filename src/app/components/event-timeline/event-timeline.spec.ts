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
});
