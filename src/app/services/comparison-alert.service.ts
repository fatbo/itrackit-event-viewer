import { Injectable, signal, computed, inject } from '@angular/core';
import { EventData } from './event-data';
import { I18nService } from './i18n.service';
import { ShipmentData, OpTransportEvent, ShipmentEvent } from '../models/shipment-event.model';

export type AlertLevel = 'info' | 'warning';

export interface ComparisonAlert {
  level: AlertLevel;
  message: string;
  category: string;
}

interface AlertEventDetails {
  time?: string;
  location?: string;
  conveyance?: string;
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

    // Check for new actual events appearing in secondary (the newer data)
    const primaryTransport = primary.transportEvents ?? [];
    const primaryEquipment = primary.events ?? [];
    const secondaryTransport = secondary.transportEvents ?? [];
    const secondaryEquipment = secondary.events ?? [];

    // POL info alerts
    for (const code of polInfoCodes) {
      if (
        this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, code, 'POL') &&
        !this.hasActualEventAtLocation(primaryTransport, primaryEquipment, code, 'POL')
      ) {
        const details = this.getActualEventDetails(secondaryTransport, secondaryEquipment, code, 'POL');
        results.push({
          level: 'info',
          message: this.i18n.t('alerts.info.actualEventAtPol', {
            event: this.i18n.getEventCodeLabel(code),
            details: this.formatAlertDetails(details),
          }),
          category: 'POL',
        });
      }
    }

    // POD info alerts
    for (const code of podInfoCodes) {
      if (
        this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, code, 'POD') &&
        !this.hasActualEventAtLocation(primaryTransport, primaryEquipment, code, 'POD')
      ) {
        const details = this.getActualEventDetails(secondaryTransport, secondaryEquipment, code, 'POD');
        results.push({
          level: 'info',
          message: this.i18n.t('alerts.info.actualEventAtPod', {
            event: this.i18n.getEventCodeLabel(code),
            details: this.formatAlertDetails(details),
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
      const change = this.getEstimatedTimeChangeDetails(
        primaryTransport, secondaryTransport,
        primaryEquipment, secondaryEquipment,
        'VD', 'POL'
      );
      if (change && Math.abs(change.diffHours) >= this.polVdThresholdHours()) {
        results.push({
          level: 'warning',
          message: this.i18n.t('alerts.warning.estimatedVdChangeAtPol', {
            previous: this.formatDateTime(change.primaryTime),
            current: this.formatDateTime(change.secondaryTime),
            difference: this.formatHourDelta(change.diffHours),
          }),
          category: 'POL',
        });
      }
    }

    // Warning: estimated VA change at POD (skip if actual VA exists at POD)
    if (!this.hasActualEventAtLocation(secondaryTransport, secondaryEquipment, 'VA', 'POD')) {
      const change = this.getEstimatedTimeChangeDetails(
        primaryTransport, secondaryTransport,
        primaryEquipment, secondaryEquipment,
        'VA', 'POD'
      );
      if (change && Math.abs(change.diffHours) >= this.podVaThresholdHours()) {
        results.push({
          level: 'warning',
          message: this.i18n.t('alerts.warning.estimatedVaChangeAtPod', {
            previous: this.formatDateTime(change.primaryTime),
            current: this.formatDateTime(change.secondaryTime),
            difference: this.formatHourDelta(change.diffHours),
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
    equipmentEvents: ShipmentEvent[],
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

  private getActualEventDetails(
    transportEvents: OpTransportEvent[],
    equipmentEvents: ShipmentEvent[],
    eventCode: string,
    locationType: string
  ): AlertEventDetails | null {
    const transportEvent = transportEvents.find(
      e => e.eventCode === eventCode &&
           e.locationType === locationType &&
           e.timeType === 'A'
    );
    if (transportEvent) {
      return this.buildAlertDetails(
        this.formatDateTime(transportEvent.eventTime),
        this.formatLocation(transportEvent.location),
        this.shouldIncludeConveyance(eventCode)
          ? this.formatConveyance(
              transportEvent.conveyanceInfo?.conveyanceName,
              transportEvent.conveyanceInfo?.conveyanceNumber
            )
          : undefined
      );
    }

    const equipmentEvent = equipmentEvents.find(
      e => e.eventCode === eventCode &&
           e.locationType === locationType &&
           e.timeType === 'A'
    );
    if (equipmentEvent) {
      return this.buildAlertDetails(
        this.formatDateTime(equipmentEvent.eventDateTime),
        this.formatEquipmentLocation(equipmentEvent),
        this.shouldIncludeConveyance(eventCode)
          ? this.formatConveyance(equipmentEvent.vessel, equipmentEvent.voyage)
          : undefined
      );
    }

    return null;
  }

  private formatAlertDetails(details: AlertEventDetails | null): string {
    if (!details) return '';

    const parts = [
      details.time ? this.i18n.t('alerts.detail.time', { time: details.time }) : null,
      details.location
        ? this.i18n.t('alerts.detail.location', { location: details.location })
        : null,
      details.conveyance
        ? this.i18n.t('alerts.detail.conveyance', { conveyance: details.conveyance })
        : null,
    ].filter((part): part is string => Boolean(part));

    if (parts.length === 0) return '';

    return ` (${parts.join(' • ')})`;
  }

  private buildAlertDetails(
    time?: string,
    location?: string,
    conveyance?: string
  ): AlertEventDetails {
    return {
      time,
      location,
      conveyance,
    };
  }

  private shouldIncludeConveyance(eventCode: string): boolean {
    return eventCode === 'VD' || eventCode === 'VA';
  }

  private formatEquipmentLocation(event: ShipmentEvent): string | undefined {
    const formatted = this.formatLocation({
      facilityName: event.facilityName,
      unLocationName: event.unLocationName,
      unLocationCode: event.unLocationCode,
    });
    return formatted || event.location || undefined;
  }

  private formatLocation(location?: {
    facilityName?: string;
    unLocationName?: string;
    unLocationCode?: string;
  }): string {
    if (!location) return '';

    const parts: string[] = [];

    if (location.facilityName) {
      parts.push(location.facilityName);
    }

    if (location.unLocationName) {
      if (location.unLocationCode) {
        parts.push(`${location.unLocationName} (${location.unLocationCode})`);
      } else {
        parts.push(location.unLocationName);
      }
    } else if (location.unLocationCode) {
      parts.push(location.unLocationCode);
    }

    return parts.join(', ');
  }

  private formatConveyance(name?: string, number?: string): string | undefined {
    if (!name && !number) return undefined;
    if (name && number) {
      return `${name} (${number})`;
    }
    return name ?? number;
  }

  private formatDateTime(value?: string | Date): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(this.i18n.localeTag());
  }

  /** Get the time difference in hours between estimated events across primary/secondary */
  private getEstimatedTimeChangeDetails(
    primaryTransport: OpTransportEvent[],
    secondaryTransport: OpTransportEvent[],
    primaryEquipment: ShipmentEvent[],
    secondaryEquipment: ShipmentEvent[],
    eventCode: string,
    locationType: string
  ): { diffHours: number; primaryTime: Date; secondaryTime: Date } | null {
    const primaryTime = this.findEstimatedTime(primaryTransport, primaryEquipment, eventCode, locationType);
    const secondaryTime = this.findEstimatedTime(secondaryTransport, secondaryEquipment, eventCode, locationType);

    if (!primaryTime || !secondaryTime) return null;

    const diffMs = secondaryTime.getTime() - primaryTime.getTime();
    return {
      diffHours: diffMs / (1000 * 60 * 60),
      primaryTime,
      secondaryTime,
    };
  }

  private findEstimatedTime(
    transportEvents: OpTransportEvent[],
    equipmentEvents: ShipmentEvent[],
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

  private formatHourDelta(diffHours: number): string {
    const sign = diffHours >= 0 ? '+' : '-';
    return `${sign}${this.formatHours(Math.abs(diffHours))} ${this.i18n.t('alerts.units.hoursShort')}`;
  }
}
