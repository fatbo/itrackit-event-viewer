import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent } from '../../models/shipment-event.model';

interface ShipmentStatusInfo {
  label: string;
  description: string;
  tone: 'completed' | 'limited' | 'transit' | 'unknown';
}

@Component({
  selector: 'app-event-summary',
  imports: [CommonModule],
  templateUrl: './event-summary.html',
  styleUrl: './event-summary.css',
})
export class EventSummary {
  private eventDataService = inject(EventData);
  
  protected readonly primaryEvent = this.eventDataService.primaryEvent;
  
  protected readonly eventCount = computed(() => {
    return this.primaryEvent()?.events?.length || 0;
  });
  
  protected readonly hasDangerousGoods = computed(() => {
    const dg = this.primaryEvent()?.dg;
    return Array.isArray(dg) && dg.length > 0;
  });

  protected readonly hasDamages = computed(() => {
    const dmg = this.primaryEvent()?.dmg;
    return Array.isArray(dmg) && dmg.length > 0;
  });

  protected readonly shipmentStatus = computed<ShipmentStatusInfo | null>(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) {
      return {
        label: 'Status Unavailable',
        description: 'No event data has been loaded yet.',
        tone: 'unknown',
      };
    }

    const polGateEvents = events.filter((event) => this.isActualGateEventAtPol(event));

    if (polGateEvents.length === 0) {
      return {
        label: 'In Transit',
        description: 'Awaiting an actual gate-in or gate-out at the port of loading.',
        tone: 'transit',
      };
    }

    const hasHongKongPolGate = polGateEvents.some((event) => this.isHongKongLocation(event));
    if (hasHongKongPolGate && !this.hasActualEventsOutsideHongKong(events)) {
      return {
        label: 'Completed (Hong Kong Tracking)',
        description: 'Tracking ends after the actual gate event in Hong Kong.',
        tone: 'limited',
      };
    }

    return {
      label: 'Completed',
      description: 'Actual gate-in/out recorded at the port of loading.',
      tone: 'completed',
    };
  });

  protected readonly firstEvent = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) return null;
    // Return chronologically first event (earliest date)
    return [...events].sort((a, b) => 
      new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    )[0];
  });
  
  protected readonly lastEvent = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) return null;
    // Return chronologically last event (latest date)
    const sorted = [...events].sort((a, b) => 
      new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    );
    return sorted[sorted.length - 1];
  });

  private isActualGateEventAtPol(event: ShipmentEvent): boolean {
    return (
      this.isActualEvent(event) &&
      this.isGateEvent(event) &&
      event.locationType?.toUpperCase() === 'POL'
    );
  }

  private isActualEvent(event: ShipmentEvent): boolean {
    if (event.timeType?.toUpperCase() !== 'A') return false;
    if (!event.eventDateTime) return false;
    return !Number.isNaN(Date.parse(event.eventDateTime));
  }

  private isGateEvent(event: ShipmentEvent): boolean {
    const code = event.eventCode?.toUpperCase();
    return code === 'OG' || code === 'IG';
  }

  private isHongKongLocation(event: ShipmentEvent): boolean {
    return event.unLocationCode?.toLowerCase() === 'hkhkg';
  }

  private hasActualEventsOutsideHongKong(events: ShipmentEvent[]): boolean {
    return events.some(
      (event) =>
        this.isActualEvent(event) &&
        !!event.unLocationCode &&
        event.unLocationCode.toLowerCase() !== 'hkhkg'
    );
  }
}
