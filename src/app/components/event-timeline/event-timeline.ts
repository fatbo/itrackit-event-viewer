import { Component, computed, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent } from '../../models/shipment-event.model';

interface TimelineIndexItem {
  label: string;
  anchorId: string;
  count: number;
}

@Component({
  selector: 'app-event-timeline',
  imports: [CommonModule],
  templateUrl: './event-timeline.html',
  styleUrl: './event-timeline.css',
})
export class EventTimeline {
  private eventDataService = inject(EventData);
  private document = inject(DOCUMENT);
  private readonly indexDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  protected readonly primaryEvent = this.eventDataService.primaryEvent;
  
  protected readonly sortedEvents = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events) return [];
    
    // Sort events by date (oldest first)
    return [...events].sort((a, b) => {
      return new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime();
    });
  });

  readonly eventIndexLabels = computed(() =>
    this.sortedEvents().map((event) => this.formatIndexLabel(event))
  );

  readonly timelineIndex = computed(() => {
    const labels = this.eventIndexLabels();
    const indexItems: TimelineIndexItem[] = [];

    labels.forEach((label, index) => {
      const lastItem = indexItems.at(-1);

      if (!lastItem || lastItem.label !== label) {
        indexItems.push({
          label,
          anchorId: this.getEventAnchorId(index),
          count: 1,
        });
      } else {
        lastItem.count += 1;
      }
    });

    return indexItems;
  });
  
  getEventIcon(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('depart') || type.includes('departure')) return '🚢';
    if (type.includes('arrive') || type.includes('arrival')) return '🏁';
    if (type.includes('load')) return '📦';
    if (type.includes('discharge') || type.includes('unload')) return '📭';
    if (type.includes('gate')) return '🚪';
    if (type.includes('customs')) return '🛃';
    return '📍';
  }

  protected getEventAnchorId(index: number): string {
    return `event-${index}`;
  }

  protected formatIndexLabel(event: ShipmentEvent): string {
    return this.indexDateFormatter.format(new Date(event.eventDateTime));
  }


  protected scrollToSection(anchorId: string): void {
    const target = this.document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
