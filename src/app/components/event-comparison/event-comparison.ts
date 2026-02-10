import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent } from '../../models/shipment-event.model';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-event-comparison',
  imports: [CommonModule],
  templateUrl: './event-comparison.html',
  styleUrl: './event-comparison.css',
})
export class EventComparison {
  private eventDataService = inject(EventData);
  protected readonly i18n = inject(I18nService);
  
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
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('comparison.label.shipmentId')),
      primary.shipmentId,
      secondary.shipmentId
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.blNumber')),
      primary.blNo,
      secondary.blNo
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.bookingNumber')),
      primary.bookingNumber,
      secondary.bookingNumber
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.containerNumber')),
      primary.containerNumber,
      secondary.containerNumber
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('comparison.label.containerSize')),
      primary.containerSize,
      secondary.containerSize
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('comparison.label.containerType')),
      primary.containerType,
      secondary.containerType
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.containerIsoCode')),
      primary.containerISOCode,
      secondary.containerISOCode
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('comparison.label.containerWeight')),
      primary.containerWeight,
      secondary.containerWeight
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.shipmentType')),
      primary.shipmentType,
      secondary.shipmentType
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.shippingLine')),
      primary.carrier,
      secondary.carrier
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('comparison.label.origin')),
      primary.origin,
      secondary.origin
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('comparison.label.destination')),
      primary.destination,
      secondary.destination
    );
    this.addFieldDifference(
      diffs,
      this.normalizeLabel(this.i18n.t('summary.label.source')),
      primary.source,
      secondary.source
    );
    
    // Compare event counts
    const primaryCount = primary.events?.length || 0;
    const secondaryCount = secondary.events?.length || 0;
    
    if (primaryCount !== secondaryCount) {
      diffs.push(
        this.i18n.t('comparison.eventCount', {
          primary: primaryCount,
          secondary: secondaryCount,
        })
      );
    }

    const primaryEventMap = this.buildEventMap(primary.events || []);
    const secondaryEventMap = this.buildEventMap(secondary.events || []);

    for (const [eventKey, primaryEvents] of primaryEventMap.entries()) {
      const secondaryEvents = secondaryEventMap.get(eventKey);
      if (!secondaryEvents) {
        primaryEvents.forEach((event, index) => {
          diffs.push(
            this.i18n.t('comparison.eventMissingSecondary', {
              label: this.formatEventLabel(
                event,
                primaryEvents.length > 1 ? index + 1 : undefined
              ),
            })
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
            this.i18n.t('comparison.eventMissingPrimary', {
              label: this.formatEventLabel(
                secondaryEvent,
                secondaryEvents.length > 1 ? i + 1 : undefined
              ),
            })
          );
          continue;
        }
        if (!secondaryEvent) {
          diffs.push(
            this.i18n.t('comparison.eventMissingSecondary', {
              label: this.formatEventLabel(
                primaryEvent,
                primaryEvents.length > 1 ? i + 1 : undefined
              ),
            })
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
            this.i18n.t('comparison.eventMissingPrimary', {
              label: this.formatEventLabel(
                event,
                secondaryEvents.length > 1 ? index + 1 : undefined
              ),
            })
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
      diffs.push(
        this.i18n.t('comparison.fieldDifference', {
          label,
          primary: this.formatValue(primaryValue),
          secondary: this.formatValue(secondaryValue),
        })
      );
    }
  }

  private formatValue(value?: string): string {
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    return value;
  }

  private formatDateTime(value?: string): string {
    return value ? new Date(value).toLocaleString(this.i18n.localeTag()) : '—';
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
    const eventCode =
      event.eventCode || event.eventType || this.i18n.t('comparison.unknownEvent');
    const locationType = event.locationType || '';
    return [eventCode, locationType, location].filter(Boolean).join('|');
  }

  private formatEventLabel(event: ShipmentEvent, sequence?: number): string {
    const eventCode = event.eventCode
      ? this.i18n.getEventCodeLabel(event.eventCode)
      : event.eventType || this.i18n.t('comparison.unknownEvent');
    const locationType = event.locationType
      ? this.i18n.getLocationTypeLabel(event.locationType)
      : '';
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
      {
        name: this.i18n.t('time.actual'),
        primary: primaryEvent.actualTime,
        secondary: secondaryEvent.actualTime,
      },
      {
        name: this.i18n.t('time.estimated'),
        primary: primaryEvent.estimatedTime,
        secondary: secondaryEvent.estimatedTime,
      },
      {
        name: this.i18n.t('time.planned'),
        primary: primaryEvent.plannedTime,
        secondary: secondaryEvent.plannedTime,
      },
    ];

    const hasTypedTimes = timePairs.some(
      time => time.primary !== undefined || time.secondary !== undefined
    );

    for (const time of timePairs) {
      if (time.primary !== time.secondary) {
        diffs.push(
          this.i18n.t('comparison.eventTimeDiff', {
            label,
            timeLabel: time.name,
            primary: this.formatDateTime(time.primary),
            secondary: this.formatDateTime(time.secondary),
          })
        );
      }
    }

    if (!hasTypedTimes && primaryEvent.eventDateTime !== secondaryEvent.eventDateTime) {
      diffs.push(
        this.i18n.t('comparison.eventTimeDiffFallback', {
          label,
          primary: this.formatDateTime(primaryEvent.eventDateTime),
          secondary: this.formatDateTime(secondaryEvent.eventDateTime),
        })
      );
    }

    return diffs;
  }

  private normalizeLabel(label: string): string {
    return label.replace(/[:：]\s*$/, '');
  }
}
