import { Injectable, signal, computed, inject } from '@angular/core';
import { EventData } from './event-data';
import { I18nService } from './i18n.service';
import { ShipmentData, OpTransportEvent } from '../models/shipment-event.model';

export type AlertLevel = 'info' | 'warning';

export interface ComparisonAlert {
  level: AlertLevel;
  message: string;
  category: string;
}

@Injectable({
  providedIn: 'root',
})
export class ComparisonAlertService {
  private readonly eventData = inject(EventData);
  private readonly i18n = inject(I18nService);

  /** Configurable threshold (hours) for estimated VD change at POL */
  readonly polVdThresholdHours = signal(24);
  /** Configurable threshold (hours) for estimated VA change at POD */
  readonly podVaThresholdHours = signal(24);

  readonly alerts = computed<ComparisonAlert[]>(() => {
    const primary = this.eventData.primaryEvent();
    const secondary = this.eventData.secondaryEvent();
    if (!primary || !secondary) return [];

    const results: ComparisonAlert[] = [];

    this.detectInfoAlerts(primary, secondary, results);
    this.detectWarningAlerts(primary, secondary, results);

    return results;
  });

  readonly infoAlerts = computed(() => this.alerts().filter(a => a.level === 'info'));
  readonly warningAlerts = computed(() => this.alerts().filter(a => a.level === 'warning'));

  /** Info: detect actual IG/OG/VD events in POL */
  private detectInfoAlerts(
    primary: ShipmentData,
    secondary: ShipmentData,
    results: ComparisonAlert[]
  ): void {
    const polInfoCodes = ['IG', 'OG', 'VD'];
    const podInfoCodes = ['VA', 'IG', 'OG'];

    // Check secondary (the newer data) for actual events
    const secondaryTransport = secondary.transportEvents ?? [];
    const secondaryEquipment = secondary.events ?? [];

    // POL info alerts
    for (const code of polInfoCodes) {
      if (this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, code, 'POL')) {
        results.push({
          level: 'info',
          message: this.i18n.t('alerts.info.actualEventAtPol', {
            event: this.i18n.getEventCodeLabel(code),
          }),
          category: 'POL',
        });
      }
    }

    // POD info alerts
    for (const code of podInfoCodes) {
      if (this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, code, 'POD')) {
        results.push({
          level: 'info',
          message: this.i18n.t('alerts.info.actualEventAtPod', {
            event: this.i18n.getEventCodeLabel(code),
          }),
          category: 'POD',
        });
      }
    }
  }

  /** Warning: detect estimated time changes and port count changes */
  private detectWarningAlerts(
    primary: ShipmentData,
    secondary: ShipmentData,
    results: ComparisonAlert[]
  ): void {
    const primaryTransport = primary.transportEvents ?? [];
    const secondaryTransport = secondary.transportEvents ?? [];
    const primaryEquipment = primary.events ?? [];
    const secondaryEquipment = secondary.events ?? [];

    // Warning: estimated VD change at POL (skip if actual VD exists at POL)
    if (!this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, 'VD', 'POL')) {
      const diff = this.getEstimatedTimeDiffHours(
        primaryTransport, secondaryTransport,
        primaryEquipment, secondaryEquipment,
        'VD', 'POL'
      );
      if (diff !== null && Math.abs(diff) >= this.polVdThresholdHours()) {
        results.push({
          level: 'warning',
          message: this.i18n.t('alerts.warning.estimatedVdChangeAtPol', {
            hours: this.formatHours(Math.abs(diff)),
            direction: diff > 0
              ? this.i18n.t('alerts.direction.delayed')
              : this.i18n.t('alerts.direction.advanced'),
          }),
          category: 'POL',
        });
      }
    }

    // Warning: estimated VA change at POD (skip if actual VA exists at POD)
    if (!this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, 'VA', 'POD')) {
      const diff = this.getEstimatedTimeDiffHours(
        primaryTransport, secondaryTransport,
        primaryEquipment, secondaryEquipment,
        'VA', 'POD'
      );
      if (diff !== null && Math.abs(diff) >= this.podVaThresholdHours()) {
        results.push({
          level: 'warning',
          message: this.i18n.t('alerts.warning.estimatedVaChangeAtPod', {
            hours: this.formatHours(Math.abs(diff)),
            direction: diff > 0
              ? this.i18n.t('alerts.direction.delayed')
              : this.i18n.t('alerts.direction.advanced'),
          }),
          category: 'POD',
        });
      }
    }

    // Warning: number of transition ports changed
    const primaryPorts = this.getTransitionPorts(primaryTransport, primaryEquipment);
    const secondaryPorts = this.getTransitionPorts(secondaryTransport, secondaryEquipment);
    if (primaryPorts.size !== secondaryPorts.size) {
      results.push({
        level: 'warning',
        message: this.i18n.t('alerts.warning.transitionPortsChanged', {
          primary: primaryPorts.size,
          secondary: secondaryPorts.size,
        }),
        category: 'route',
      });
    }
  }

  private hasActualEventAtLocation(
    transportEvents: OpTransportEvent[],
    equipmentEvents: { eventCode?: string; locationType?: string; timeType?: string }[],
    eventCode: string,
    locationType: string
  ): boolean {
    const inTransport = transportEvents.some(
      e => e.eventCode === eventCode &&
           e.locationType === locationType &&
           e.timeType === 'A'
    );
    if (inTransport) return true;

    return equipmentEvents.some(
      e => e.eventCode === eventCode &&
           e.locationType === locationType &&
           e.timeType === 'A'
    );
  }

  /** Get the time difference in hours between estimated events across primary/secondary */
  private getEstimatedTimeDiffHours(
    primaryTransport: OpTransportEvent[],
    secondaryTransport: OpTransportEvent[],
    primaryEquipment: { eventCode?: string; locationType?: string; timeType?: string; estimatedTime?: string; eventDateTime?: string }[],
    secondaryEquipment: { eventCode?: string; locationType?: string; timeType?: string; estimatedTime?: string; eventDateTime?: string }[],
    eventCode: string,
    locationType: string
  ): number | null {
    const primaryTime = this.findEstimatedTime(primaryTransport, primaryEquipment, eventCode, locationType);
    const secondaryTime = this.findEstimatedTime(secondaryTransport, secondaryEquipment, eventCode, locationType);

    if (!primaryTime || !secondaryTime) return null;

    const diffMs = secondaryTime.getTime() - primaryTime.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  private findEstimatedTime(
    transportEvents: OpTransportEvent[],
    equipmentEvents: { eventCode?: string; locationType?: string; timeType?: string; estimatedTime?: string; eventDateTime?: string }[],
    eventCode: string,
    locationType: string
  ): Date | null {
    // Check transport events for estimated time
    const transportEvent = transportEvents.find(
      e => e.eventCode === eventCode &&
           e.locationType === locationType &&
           e.timeType === 'E'
    );
    if (transportEvent) {
      return new Date(transportEvent.eventTime);
    }

    // Check equipment events for estimated time
    const equipEvent = equipmentEvents.find(
      e => e.eventCode === eventCode &&
           e.locationType === locationType
    );
    if (equipEvent?.estimatedTime) {
      return new Date(equipEvent.estimatedTime);
    }

    return null;
  }

  /** Collect unique POT (transhipment) location codes */
  private getTransitionPorts(
    transportEvents: OpTransportEvent[],
    equipmentEvents: { locationType?: string; unLocationCode?: string }[]
  ): Set<string> {
    const ports = new Set<string>();
    for (const e of transportEvents) {
      if (e.locationType === 'POT' && e.location?.unLocationCode) {
        ports.add(e.location.unLocationCode);
      }
    }
    for (const e of equipmentEvents) {
      if (e.locationType === 'POT' && e.unLocationCode) {
        ports.add(e.unLocationCode);
      }
    }
    return ports;
  }

  private formatHours(hours: number): string {
    return hours.toFixed(1);
  }
}
