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
  arrivalVessel?: string;
  departureVessel?: string;
  dwellTimeHours?: number;
}

interface EtaVariance {
  diffHours: number;
  label: string;
  tone: 'green' | 'amber' | 'red';
}

type MilestonePhase = 'origin' | 'transit' | 'destination';

interface MilestoneStep {
  label: string;
  eventCode: string;
  phase: MilestonePhase;
  completed: boolean;
  time?: string;
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
        node.departureVessel = event.conveyanceInfo?.conveyanceName;
      } else if (event.eventCode === 'VA' || event.eventCode === 'RA') {
        node.arrivalTime = event.eventTime;
        node.arrivalTimeType = event.timeType;
        node.arrivalVessel = event.conveyanceInfo?.conveyanceName;
      }
    }

    // Compute dwell time for each port
    for (const node of portMap.values()) {
      if (node.arrivalTime && node.departureTime) {
        const arrival = new Date(node.arrivalTime).getTime();
        const departure = new Date(node.departureTime).getTime();
        if (!isNaN(arrival) && !isNaN(departure) && departure > arrival) {
          node.dwellTimeHours = Math.round(((departure - arrival) / (1000 * 60 * 60)) * 10) / 10;
        }
      }
    }

    return portOrder.map(code => portMap.get(code)!);
  });

  protected readonly vesselChanges = computed(() => {
    const ports = this.portTransition();
    if (ports.length < 2) return [];
    const changes: { index: number; from: string; to: string }[] = [];
    for (let i = 0; i < ports.length - 1; i++) {
      const departureVessel = ports[i].departureVessel;
      const nextDepartureVessel = ports[i + 1].departureVessel;
      if (departureVessel && nextDepartureVessel && departureVessel !== nextDepartureVessel) {
        changes.push({ index: i, from: departureVessel, to: nextDepartureVessel });
      }
    }
    return changes;
  });

  protected getVesselChangeAt(index: number): string | null {
    const change = this.vesselChanges().find(c => c.index === index);
    return change ? change.to : null;
  }

  protected getEtaVariance(event: ShipmentEvent): EtaVariance | null {
    if (!event.actualTime || !event.estimatedTime) return null;
    const actual = new Date(event.actualTime).getTime();
    const estimated = new Date(event.estimatedTime).getTime();
    if (isNaN(actual) || isNaN(estimated)) return null;
    const diffMs = actual - estimated;
    const diffHours = Math.round((Math.abs(diffMs) / (1000 * 60 * 60)) * 10) / 10;
    const direction = diffMs > 0
      ? this.i18n.t('eta.later')
      : this.i18n.t('eta.earlier');
    const tone: EtaVariance['tone'] = diffHours < 2 ? 'green' : diffHours < 12 ? 'amber' : 'red';
    return {
      diffHours,
      label: this.i18n.t('eta.varianceLabel', { hours: diffHours, direction }),
      tone,
    };
  }

  protected readonly milestones = computed<MilestoneStep[]>(() => {
    const data = this.primaryEvent();
    if (!data) return [];
    const events = data.events ?? [];
    const transportEvents = (data.transportEvents ?? []) as OpTransportEvent[];

    const steps: MilestoneStep[] = [];
    const hasActualEquip = (code: string, locType: string) =>
      events.some(e => e.eventCode === code && e.locationType === locType && e.timeType === 'A');
    const hasActualTransport = (code: string, locType: string) =>
      transportEvents.some(e => e.eventCode === code && e.locationType === locType && e.timeType === 'A');
    const getTime = (code: string, locType: string): string | undefined => {
      const equip = events.find(e => e.eventCode === code && e.locationType === locType);
      const trans = transportEvents.find(e => e.eventCode === code && e.locationType === locType);
      return equip?.eventDateTime ?? trans?.eventTime;
    };

    // Origin milestones
    steps.push({ label: this.i18n.t('milestone.gateIn'), eventCode: 'IG', phase: 'origin', completed: hasActualEquip('IG', 'POL'), time: getTime('IG', 'POL') });
    steps.push({ label: this.i18n.t('milestone.loaded'), eventCode: 'AL', phase: 'origin', completed: hasActualEquip('AL', 'POL'), time: getTime('AL', 'POL') });
    steps.push({ label: this.i18n.t('milestone.vesselDeparture'), eventCode: 'VD', phase: 'origin', completed: hasActualTransport('VD', 'POL') || hasActualEquip('VD', 'POL'), time: getTime('VD', 'POL') });

    // Transit milestones (POT)
    const potPorts = new Set(transportEvents.filter(e => e.locationType === 'POT').map(e => e.location.unLocationCode));
    for (const potCode of potPorts) {
      const portName = transportEvents.find(e => e.location.unLocationCode === potCode)?.location.unLocationName ?? potCode;
      const hasArrival = transportEvents.some(e => e.eventCode === 'VA' && e.location.unLocationCode === potCode && e.timeType === 'A');
      const hasDeparture = transportEvents.some(e => e.eventCode === 'VD' && e.location.unLocationCode === potCode && e.timeType === 'A');
      steps.push({ label: this.i18n.t('milestone.transitArr', { port: portName }), eventCode: 'VA', phase: 'transit', completed: hasArrival, time: transportEvents.find(e => e.eventCode === 'VA' && e.location.unLocationCode === potCode)?.eventTime });
      steps.push({ label: this.i18n.t('milestone.transitDep', { port: portName }), eventCode: 'VD', phase: 'transit', completed: hasDeparture, time: transportEvents.find(e => e.eventCode === 'VD' && e.location.unLocationCode === potCode)?.eventTime });
    }

    // Destination milestones
    steps.push({ label: this.i18n.t('milestone.vesselArrival'), eventCode: 'VA', phase: 'destination', completed: hasActualTransport('VA', 'POD') || hasActualEquip('VA', 'POD'), time: getTime('VA', 'POD') });
    steps.push({ label: this.i18n.t('milestone.unloaded'), eventCode: 'UV', phase: 'destination', completed: hasActualEquip('UV', 'POD'), time: getTime('UV', 'POD') });
    steps.push({ label: this.i18n.t('milestone.gateOut'), eventCode: 'OG', phase: 'destination', completed: hasActualEquip('OG', 'POD'), time: getTime('OG', 'POD') });

    return steps;
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

  protected getLocationTypeClass(event: ShipmentEvent): string {
    switch (event.locationType?.toUpperCase()) {
      case 'POL': return 'location-pol';
      case 'POD': return 'location-pod';
      case 'POT': return 'location-pot';
      default: return '';
    }
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
