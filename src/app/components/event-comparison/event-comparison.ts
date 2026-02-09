import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent } from '../../models/shipment-event.model';

@Component({
  selector: 'app-event-comparison',
  imports: [CommonModule],
  templateUrl: './event-comparison.html',
  styleUrl: './event-comparison.css',
})
export class EventComparison {
  private eventDataService = inject(EventData);
  
  protected readonly primaryEvent = this.eventDataService.primaryEvent;
  protected readonly secondaryEvent = this.eventDataService.secondaryEvent;
  
  protected readonly hasComparison = computed(() => {
    return this.primaryEvent() !== null && this.secondaryEvent() !== null;
  });
  
  protected readonly primarySortedEvents = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events) return [];
    return [...events].sort((a, b) => 
      new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    );
  });
  
  protected readonly secondarySortedEvents = computed(() => {
    const events = this.secondaryEvent()?.events;
    if (!events) return [];
    return [...events].sort((a, b) => 
      new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    );
  });
  
  protected readonly differences = computed(() => {
    const primary = this.primaryEvent();
    const secondary = this.secondaryEvent();
    
    if (!primary || !secondary) return [];
    
    const diffs: string[] = [];
    
    // Compare basic info
    this.addFieldDifference(diffs, 'Shipment ID', primary.shipmentId, secondary.shipmentId);
    this.addFieldDifference(diffs, 'BL Number', primary.blNo, secondary.blNo);
    this.addFieldDifference(diffs, 'Booking Number', primary.bookingNumber, secondary.bookingNumber);
    this.addFieldDifference(diffs, 'Container Number', primary.containerNumber, secondary.containerNumber);
    this.addFieldDifference(diffs, 'Container Size', primary.containerSize, secondary.containerSize);
    this.addFieldDifference(diffs, 'Container Type', primary.containerType, secondary.containerType);
    this.addFieldDifference(diffs, 'Container ISO Code', primary.containerISOCode, secondary.containerISOCode);
    this.addFieldDifference(diffs, 'Container Weight', primary.containerWeight, secondary.containerWeight);
    this.addFieldDifference(diffs, 'Shipment Type', primary.shipmentType, secondary.shipmentType);
    this.addFieldDifference(diffs, 'Shipping Line', primary.carrier, secondary.carrier);
    this.addFieldDifference(diffs, 'Origin', primary.origin, secondary.origin);
    this.addFieldDifference(diffs, 'Destination', primary.destination, secondary.destination);
    this.addFieldDifference(diffs, 'Source', primary.source, secondary.source);
    
    // Compare event counts
    const primaryCount = primary.events?.length || 0;
    const secondaryCount = secondary.events?.length || 0;
    
    if (primaryCount !== secondaryCount) {
      diffs.push(`Event Count: ${primaryCount} vs ${secondaryCount}`);
    }

    const primaryEventMap = this.buildEventMap(primary.events || []);
    const secondaryEventMap = this.buildEventMap(secondary.events || []);

    for (const [eventKey, primaryEvents] of primaryEventMap.entries()) {
      const secondaryEvents = secondaryEventMap.get(eventKey);
      if (!secondaryEvents) {
        primaryEvents.forEach((event, index) => {
          diffs.push(
            `Event ${this.formatEventLabel(event, primaryEvents.length > 1 ? index + 1 : undefined)} missing in secondary shipment`
          );
        });
        continue;
      }

      const maxEvents = Math.max(primaryEvents.length, secondaryEvents.length);
      for (let i = 0; i < maxEvents; i++) {
        const primaryEvent = primaryEvents[i];
        const secondaryEvent = secondaryEvents[i];
        if (!primaryEvent) {
          diffs.push(
            `Event ${this.formatEventLabel(secondaryEvent, secondaryEvents.length > 1 ? i + 1 : undefined)} missing in primary shipment`
          );
          continue;
        }
        if (!secondaryEvent) {
          diffs.push(
            `Event ${this.formatEventLabel(primaryEvent, primaryEvents.length > 1 ? i + 1 : undefined)} missing in secondary shipment`
          );
          continue;
        }
        const label = this.formatEventLabel(
          primaryEvent,
          primaryEvents.length > 1 || secondaryEvents.length > 1 ? i + 1 : undefined
        );
        diffs.push(...this.compareEventTimes(label, primaryEvent, secondaryEvent));
      }
    }

    for (const [eventKey, secondaryEvents] of secondaryEventMap.entries()) {
      if (!primaryEventMap.has(eventKey)) {
        secondaryEvents.forEach((event, index) => {
          diffs.push(
            `Event ${this.formatEventLabel(event, secondaryEvents.length > 1 ? index + 1 : undefined)} missing in primary shipment`
          );
        });
      }
    }
    
    return diffs;
  });

  private addFieldDifference(
    diffs: string[],
    label: string,
    primaryValue?: string,
    secondaryValue?: string
  ): void {
    if (primaryValue !== secondaryValue) {
      diffs.push(`${label}: "${this.formatValue(primaryValue)}" vs "${this.formatValue(secondaryValue)}"`);
    }
  }

  private formatValue(value?: string): string {
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    return value;
  }

  private formatDateTime(value?: string): string {
    return value ? new Date(value).toLocaleString() : '—';
  }

  private buildEventMap(events: ShipmentEvent[]): Map<string, ShipmentEvent[]> {
    const map = new Map<string, ShipmentEvent[]>();
    for (const event of events) {
      const key = this.getEventKey(event);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
      );
    }
    return map;
  }

  private getEventKey(event: ShipmentEvent): string {
    const location = event.unLocationCode || event.location || '';
    const eventCode = event.eventCode || event.eventType || 'Unknown';
    const locationType = event.locationType || '';
    return [eventCode, locationType, location].filter(Boolean).join('|');
  }

  private formatEventLabel(event: ShipmentEvent, sequence?: number): string {
    const eventCode = event.eventCode || event.eventType || 'Unknown';
    const locationType = event.locationType || '';
    const location = event.unLocationCode || '';
    const base = [locationType, eventCode].filter(Boolean).join(' ');
    const label = location ? `${base} (${location})` : base;
    return sequence ? `${label} #${sequence}` : label;
  }

  private compareEventTimes(
    label: string,
    primaryEvent: ShipmentEvent,
    secondaryEvent: ShipmentEvent
  ): string[] {
    const diffs: string[] = [];
    const timePairs = [
      { name: 'Actual', primary: primaryEvent.actualTime, secondary: secondaryEvent.actualTime },
      {
        name: 'Estimated',
        primary: primaryEvent.estimatedTime,
        secondary: secondaryEvent.estimatedTime,
      },
      { name: 'Planned', primary: primaryEvent.plannedTime, secondary: secondaryEvent.plannedTime },
    ];

    const hasTypedTimes = timePairs.some(
      time => time.primary !== undefined || time.secondary !== undefined
    );

    for (const time of timePairs) {
      if (time.primary !== time.secondary) {
        diffs.push(
          `Event ${label} ${time.name} time: "${this.formatDateTime(
            time.primary
          )}" vs "${this.formatDateTime(time.secondary)}"`
        );
      }
    }

    if (!hasTypedTimes && primaryEvent.eventDateTime !== secondaryEvent.eventDateTime) {
      diffs.push(
        `Event ${label} time: "${this.formatDateTime(
          primaryEvent.eventDateTime
        )}" vs "${this.formatDateTime(secondaryEvent.eventDateTime)}"`
      );
    }

    return diffs;
  }
}
