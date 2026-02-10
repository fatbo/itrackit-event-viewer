import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { OpTransportEvent, ShipmentEvent } from '../../models/shipment-event.model';
import { I18nService } from '../../services/i18n.service';

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
  protected readonly i18n = inject(I18nService);
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

  protected readonly hasReeferData = computed(() => {
    return !!this.primaryEvent()?.terminalData?.reeferData;
  });

  protected readonly reeferData = computed(() => {
    return this.primaryEvent()?.terminalData?.reeferData;
  });

  protected readonly isReeferTempAlert = computed(() => {
    const reefer = this.reeferData();
    if (!reefer) return false;
    
    const requireTemp = parseFloat(reefer.requireTemp);
    const readingTemp = parseFloat(reefer.readingTemp);
    
    if (isNaN(requireTemp) || isNaN(readingTemp)) return false;
    
    // Alert if reading temp differs from required temp by ≥1 degree
    const diff = Math.abs(readingTemp - requireTemp);
    return diff >= 1;
  });

  readonly shipmentStatus = computed<ShipmentStatusInfo>(() => {
    const primaryEvent = this.primaryEvent();
    const events = primaryEvent?.events ?? [];
    const transportEvents = primaryEvent?.transportEvents ?? [];
    if (events.length === 0 && transportEvents.length === 0) {
      return {
        label: this.i18n.t('status.unavailable.label'),
        description: this.i18n.t('status.unavailable.description'),
        tone: 'unknown',
      };
    }

    const hasPodGateEvent = events.some((event) => this.isActualGateEventAtPod(event));
    if (hasPodGateEvent) {
      return {
        label: this.i18n.t('status.completed.label'),
        description: this.i18n.t('status.completed.description'),
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
        label: this.i18n.t('status.hkCompleted.label'),
        description: this.i18n.t('status.hkCompleted.description'),
        tone: 'completed',
      };
    }

    return {
      label: this.i18n.t('status.inTransit.label'),
      description: this.i18n.t('status.inTransit.description'),
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

  protected getEventTypeLabel(event: ShipmentEvent | null): string {
    if (!event) return '';
    return event.eventCode ? this.i18n.getEventCodeLabel(event.eventCode) : event.eventType;
  }

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
    const hasEquipmentEventsOutsideHongKong = events.some(
      (event) =>
        this.isActualEvent(event) && !this.isHongKongLocationCode(event.unLocationCode)
    );
    return (
      hasEquipmentEventsOutsideHongKong ||
      transportEvents.some(
        (event) =>
          this.isActualTransportEvent(event) &&
          !this.isHongKongLocationCode(event.location?.unLocationCode)
      )
    );
  }
}
