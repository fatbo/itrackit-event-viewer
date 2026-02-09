import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { OpTransportEvent, ShipmentEvent } from '../../models/shipment-event.model';

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
  private readonly ACTUAL_TIME_TYPE = 'A';
  private readonly GATE_OUT_CODE = 'OG';
  private readonly GATE_IN_CODE = 'IG';
  private readonly VESSEL_DEPARTURE_CODE = 'VD';
  private readonly HONG_KONG_LOCATION_CODE = 'HKHKG';

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

  readonly shipmentStatus = computed<ShipmentStatusInfo>(() => {
    const events = this.primaryEvent()?.events ?? [];
    const transportEvents = this.primaryEvent()?.transportEvents ?? [];
    if (events.length === 0 && transportEvents.length === 0) {
      return {
        label: 'Status Unavailable',
        description: 'No event data has been loaded yet.',
        tone: 'unknown',
      };
    }

    const hasPodGateEvent = events.some((event) => this.isActualGateEventAtPod(event));
    if (hasPodGateEvent) {
      return {
        label: 'Completed',
        description: 'Actual gate in/out recorded at the port of discharge.',
        tone: 'completed',
      };
    }

    const hasActualHongKongDeparture =
      events.some((event) => this.isActualHongKongDeparture(event)) ||
      transportEvents.some((event) => this.isActualHongKongTransportDeparture(event));
    if (
      hasActualHongKongDeparture &&
      !this.hasActualEventsOutsideHongKong(events, transportEvents)
    ) {
      return {
        label: 'Completed (Hong Kong Only)',
        description: 'Actual vessel departure recorded in Hong Kong with no other actual ports.',
        tone: 'completed',
      };
    }

    return {
      label: 'In Transit',
      description: 'Awaiting an actual gate event at POD or a confirmed Hong Kong departure.',
      tone: 'transit',
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

  private isActualGateEventAtPod(event: ShipmentEvent): boolean {
    return (
      this.isActualEvent(event) &&
      this.isGateEvent(event) &&
      event.locationType?.toUpperCase() === 'POD'
    );
  }

  private isActualEvent(event: ShipmentEvent): boolean {
    if (event.timeType?.toUpperCase() !== this.ACTUAL_TIME_TYPE) return false;
    if (!event.eventDateTime) return false;
    return !Number.isNaN(Date.parse(event.eventDateTime));
  }

  private isActualTransportEvent(event: OpTransportEvent): boolean {
    if (event.timeType?.toUpperCase() !== this.ACTUAL_TIME_TYPE) return false;
    if (!event.eventTime) return false;
    return !Number.isNaN(Date.parse(event.eventTime));
  }

  private isGateEvent(event: ShipmentEvent): boolean {
    const code = event.eventCode?.toUpperCase();
    return code === this.GATE_OUT_CODE || code === this.GATE_IN_CODE;
  }

  private isHongKongLocation(event: ShipmentEvent): boolean {
    return this.isHongKongLocationCode(event.unLocationCode);
  }

  private isHongKongLocationCode(locationCode?: string): boolean {
    return locationCode?.toUpperCase() === this.HONG_KONG_LOCATION_CODE;
  }

  private isDepartureLocationType(locationType?: string): boolean {
    const normalized = locationType?.toUpperCase();
    return normalized === 'POL' || normalized === 'POT' || normalized === 'POC';
  }

  private isActualHongKongDeparture(event: ShipmentEvent): boolean {
    return (
      this.isActualEvent(event) &&
      event.eventCode?.toUpperCase() === this.VESSEL_DEPARTURE_CODE &&
      this.isHongKongLocation(event) &&
      this.isDepartureLocationType(event.locationType)
    );
  }

  private isActualHongKongTransportDeparture(event: OpTransportEvent): boolean {
    return (
      this.isActualTransportEvent(event) &&
      event.eventCode?.toUpperCase() === this.VESSEL_DEPARTURE_CODE &&
      this.isHongKongLocationCode(event.location?.unLocationCode) &&
      this.isDepartureLocationType(event.locationType)
    );
  }

  private hasActualEventsOutsideHongKong(
    events: ShipmentEvent[],
    transportEvents: OpTransportEvent[]
  ): boolean {
    const hasEquipmentEvents = events.some(
      (event) =>
        this.isActualEvent(event) && !this.isHongKongLocationCode(event.unLocationCode)
    );
    if (hasEquipmentEvents) return true;
    return transportEvents.some(
      (event) =>
        this.isActualTransportEvent(event) &&
        !this.isHongKongLocationCode(event.location?.unLocationCode)
    );
  }
}
