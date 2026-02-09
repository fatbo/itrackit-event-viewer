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

  it('builds an index grouped by month', () => {
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
          eventDateTime: '2024-01-20T12:00:00Z',
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

    const component = fixture.componentInstance as any;
    expect(component.timelineIndex()).toEqual([
      { label: 'Jan 2024', anchorId: 'event-0', count: 2 },
      { label: 'Feb 2024', anchorId: 'event-2', count: 1 },
    ]);
  });

  it('identifies the first event of each month group', () => {
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
          eventDateTime: '2024-03-20T12:00:00Z',
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

    const component = fixture.componentInstance as any;
    const sortedEvents = component.sortedEvents();
    expect(component.isNewIndexGroup(sortedEvents[0], 0)).toBe(true);
    expect(component.isNewIndexGroup(sortedEvents[1], 1)).toBe(false);
    expect(component.isNewIndexGroup(sortedEvents[2], 2)).toBe(true);
  });
});
