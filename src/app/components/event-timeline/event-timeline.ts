import { Component, computed, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent, OpTransportEvent } from '../../models/shipment-event.model';

interface TimelineIndexItem {
  label: string;
  anchorId: string;
  count: number;
}

interface PortNode {
  locationName: string;
  locationCode: string;
  locationType: string;
  arrivalTime?: string;
  arrivalTimeType?: string;
  departureTime?: string;
  departureTimeType?: string;
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
  
  protected readonly portTransition = computed(() => {
    const data = this.primaryEvent();
    const transportEvents = data?.transportEvents as OpTransportEvent[] | undefined;
    if (!transportEvents || transportEvents.length === 0) return [];

    // Sort by seq if available, otherwise by eventTime
    const sorted = [...transportEvents].sort((a, b) => {
      if (a.seq != null && b.seq != null) return a.seq - b.seq;
      if (a.seq != null) return -1;
      if (b.seq != null) return 1;
      return new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime();
    });

    // Group by location code to build port nodes
    const portMap = new Map<string, PortNode>();
    const portOrder: string[] = [];

    for (const event of sorted) {
      const code = event.location.unLocationCode;
      if (!portMap.has(code)) {
        portMap.set(code, {
          locationName: event.location.unLocationName,
          locationCode: code,
          locationType: event.locationType,
        });
        portOrder.push(code);
      }
      const node = portMap.get(code)!;
      if (event.eventCode === 'VD' || event.eventCode === 'RD') {
        node.departureTime = event.eventTime;
        node.departureTimeType = event.timeType;
      } else if (event.eventCode === 'VA' || event.eventCode === 'RA') {
        node.arrivalTime = event.eventTime;
        node.arrivalTimeType = event.timeType;
      }
    }

    return portOrder.map(code => portMap.get(code)!);
  });

  private hasValidDate(event: ShipmentEvent): boolean {
    return !!event.eventDateTime && !isNaN(new Date(event.eventDateTime).getTime());
  }

  protected readonly sortedEvents = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events) return [];
    
    // Only include events with a valid eventDateTime
    return events
      .filter(e => this.hasValidDate(e))
      .sort((a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime());
  });

  protected readonly undatedEvents = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events) return [];
    return events.filter(e => !this.hasValidDate(e));
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

  protected getTimeTypeLabel(timeType: string): string {
    switch (timeType) {
      case 'A': return 'Actual';
      case 'E': return 'Estimated';
      case 'G': return 'Planned';
      default: return '';
    }
  }
}
