import { Component, computed, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent, OpTransportEvent } from '../../models/shipment-event.model';
import { I18nService } from '../../services/i18n.service';

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
  protected readonly i18n = inject(I18nService);
  private readonly indexDateFormatter = computed(
    () =>
      new Intl.DateTimeFormat(this.i18n.localeTag(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
  );
  
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
  
  getEventIcon(event: ShipmentEvent): string {
    const code = event.eventCode?.toUpperCase();
    if (code === 'VD' || code === 'RD') return '🚢';
    if (code === 'VA' || code === 'RA') return '🏁';
    if (code === 'AL') return '📦';
    if (code === 'UV' || code === 'PD') return '📭';
    if (code === 'OG' || code === 'IG') return '🚪';
    const type = event.eventType.toLowerCase();
    if (type.includes('customs')) return '🛃';
    return '📍';
  }

  protected getEventTypeLabel(event: ShipmentEvent): string {
    return event.eventCode ? this.i18n.getEventCodeLabel(event.eventCode) : event.eventType;
  }

  protected getEventDescription(event: ShipmentEvent): string {
    const parts: string[] = [];
    if (event.eventType) {
      parts.push(this.getEventTypeLabel(event));
    }

    if (event.containerStatus) {
      parts.push(
        this.i18n.t('parser.containerStatus', {
          status: this.i18n.getContainerStatusLabel(event.containerStatus),
        })
      );
    }

    if (event.modeOfTransport) {
      parts.push(this.i18n.t('parser.via', { mode: event.modeOfTransport }));
    }

    const timeDetails = this.buildTimeDetails(event);
    if (timeDetails.length > 1) {
      parts.push(this.i18n.t('parser.timeDetails', { details: timeDetails.join(', ') }));
    }

    return parts.length > 0 ? parts.join(' ') : event.description;
  }

  protected getEventAnchorId(index: number): string {
    return `event-${index}`;
  }

  protected formatIndexLabel(event: ShipmentEvent): string {
    return this.indexDateFormatter().format(new Date(event.eventDateTime));
  }

  protected getLocationTypeLabel(locationType?: string): string {
    return locationType ? this.i18n.getLocationTypeLabel(locationType) : '';
  }

  protected getContainerStatusLabel(containerStatus?: string): string {
    return containerStatus ? this.i18n.getContainerStatusLabel(containerStatus) : '';
  }

  protected getStatusLabel(event: ShipmentEvent): string {
    if (event.containerStatus && event.timeType) {
      return this.i18n.t('parser.containerStatusFormat', {
        status: this.i18n.getContainerStatusLabel(event.containerStatus),
        timeType: this.i18n.getTimeTypeLabel(event.timeType),
      });
    }
    return event.status || '';
  }


  protected scrollToSection(anchorId: string): void {
    const target = this.document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected getTimeTypeLabel(timeType: string): string {
    return this.i18n.getTimeTypeLabel(timeType);
  }

  private buildTimeDetails(event: ShipmentEvent): string[] {
    const timeDetails: string[] = [];
    if (event.actualTime) {
      timeDetails.push(
        `${this.i18n.t('time.actual')}: ${new Date(event.actualTime).toLocaleString(
          this.i18n.localeTag()
        )}`
      );
    }
    if (event.estimatedTime) {
      timeDetails.push(
        `${this.i18n.t('time.estimated')}: ${new Date(event.estimatedTime).toLocaleString(
          this.i18n.localeTag()
        )}`
      );
    }
    if (event.plannedTime) {
      timeDetails.push(
        `${this.i18n.t('time.planned')}: ${new Date(event.plannedTime).toLocaleString(
          this.i18n.localeTag()
        )}`
      );
    }
    return timeDetails;
  }
}
