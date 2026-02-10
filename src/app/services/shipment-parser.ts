import { Injectable } from '@angular/core';
import {
  OpShipmentEventRaw,
  OpTransportEvent,
  OpEquipmentEvent,
  ShipmentData,
  ShipmentEvent,
} from '../models/shipment-event.model';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root',
})
export class ShipmentParser {
  constructor(private i18n: I18nService) {}

  /**
   * Converts OpShipmentEventRaw format to ShipmentData format for display
   */
  parseOpShipmentEventRaw(raw: OpShipmentEventRaw): ShipmentData {
    const events: ShipmentEvent[] = [];

    // Process equipment events (primary focus based on requirement)
    if (raw.equipmentEvents && Array.isArray(raw.equipmentEvents)) {
      const groupedEvents = this.groupEquipmentEvents(raw.equipmentEvents);
      for (const groupedEvent of groupedEvents) {
        events.push(groupedEvent);
      }
    }

    // Build ShipmentData object
    return {
      shipmentId: raw.id,
      bookingNumber: raw.bookingNo,
      containerNumber: raw.containerNo,
      carrier: raw.shippingLine,
      origin: raw.pol ? this.formatLocation(raw.pol) : undefined,
      destination: raw.pod ? this.formatLocation(raw.pod) : undefined,
      events,
      // Include additional fields for reference
      blNo: raw.blNo,
      containerSize: raw.containerSize,
      containerType: raw.containerType,
      containerISOCode: raw.containerISOCode,
      shipmentType: raw.shipmentType,
      eventId: raw.eventId,
      source: raw.source,
      containerWeight: raw.containerWeight,
      sealNo: raw.sealNo,
      dg: raw.dg,
      dmg: raw.dmg,
      transportEvents: raw.transportEvents,
      terminalData: raw.terminalData,
    };
  }

  /**
   * Checks if the input data is in OpShipmentEventRaw format
   */
  isOpShipmentEventRaw(data: any): data is OpShipmentEventRaw {
    return (
      data &&
      typeof data === 'object' &&
      'id' in data &&
      'eventId' in data &&
      'source' in data &&
      'blNo' in data &&
      'containerNo' in data &&
      'containerISOCode' in data &&
      'shipmentType' in data &&
      (('transportEvents' in data && Array.isArray(data.transportEvents)) ||
        ('equipmentEvents' in data && Array.isArray(data.equipmentEvents)))
    );
  }

  /**
   * Checks if the input data is in legacy ShipmentData format
   */
  isShipmentData(data: any): data is ShipmentData {
    return (
      data &&
      typeof data === 'object' &&
      'events' in data &&
      Array.isArray(data.events)
    );
  }

  /**
   * Groups equipment events by event type, location, and location type
   * Each group displays actual and estimated times together
   */
  private groupEquipmentEvents(events: OpEquipmentEvent[]): ShipmentEvent[] {
    // Create a map to group events
    const groupMap = new Map<string, OpEquipmentEvent[]>();

    for (const event of events) {
      const groupKey = this.createGroupKey(
        event.eventCode,
        event.location.unLocationCode,
        event.locationType
      );

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(event);
    }

    // Convert grouped events to ShipmentEvent format
    const result: ShipmentEvent[] = [];
    for (const [, groupedEvents] of groupMap) {
      result.push(this.convertGroupedEquipmentEvents(groupedEvents));
    }

    return result;
  }

  private createGroupKey(eventCode: string, locationCode: string, locationType: string): string {
    return `${eventCode}|${locationCode}|${locationType}`;
  }

  private convertGroupedEquipmentEvents(events: OpEquipmentEvent[]): ShipmentEvent {
    // Sort events by time to get the primary event (usually actual time first)
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
    );

    const primaryEvent = sortedEvents[0];
    
    // Separate actual and estimated times
    const actualEvent = events.find(e => e.timeType === 'A');
    const estimatedEvent = events.find(e => e.timeType === 'E');
    const plannedEvent = events.find(e => e.timeType === 'G');
    // Use actual time as primary, fall back to estimated, then planned
    const displayEvent = actualEvent || estimatedEvent || plannedEvent || primaryEvent;

    // Build time details
    const timeDetails: string[] = [];
    if (actualEvent) {
      timeDetails.push(
        `${this.i18n.t('time.actual')}: ${new Date(actualEvent.eventTime).toLocaleString(
          this.i18n.localeTag()
        )}`
      );
    }
    if (estimatedEvent) {
      timeDetails.push(
        `${this.i18n.t('time.estimated')}: ${new Date(estimatedEvent.eventTime).toLocaleString(
          this.i18n.localeTag()
        )}`
      );
    }
    if (plannedEvent) {
      timeDetails.push(
        `${this.i18n.t('time.planned')}: ${new Date(plannedEvent.eventTime).toLocaleString(
          this.i18n.localeTag()
        )}`
      );
    }

    return {
      eventType: this.getEventTypeName(displayEvent.eventCode, displayEvent.eventName),
      eventDateTime: displayEvent.eventTime,
      location: this.formatLocation(displayEvent.location),
      description: this.buildGroupedEquipmentEventDescription(displayEvent, timeDetails),
      vessel: displayEvent.conveyanceInfo?.conveyanceName,
      voyage: displayEvent.conveyanceInfo?.conveyanceNumber,
      status: this.formatContainerStatus(displayEvent.containerStatus, displayEvent.timeType),
      // Additional fields for reference
      eventCode: displayEvent.eventCode,
      locationType: displayEvent.locationType,
      timeType: displayEvent.timeType,
      containerStatus: displayEvent.containerStatus,
      modeOfTransport: displayEvent.modeOfTransport,
      facilityCode: displayEvent.location.facilityCode,
      facilityName: displayEvent.location.facilityName,
      unLocationCode: displayEvent.location.unLocationCode,
      unLocationName: displayEvent.location.unLocationName,
      dataProvider: displayEvent.DataProvider,
      // Store time details for display
      actualTime: actualEvent?.eventTime,
      estimatedTime: estimatedEvent?.eventTime,
      plannedTime: plannedEvent?.eventTime,
      timeDetails: timeDetails.join(' | '),
    };
  }

  private buildGroupedEquipmentEventDescription(event: OpEquipmentEvent, timeDetails: string[]): string {
    const parts: string[] = [];

    if (event.eventName) {
      parts.push(event.eventName);
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

    // Add time details if multiple times are available
    if (timeDetails.length > 1) {
      parts.push(this.i18n.t('parser.timeDetails', { details: timeDetails.join(', ') }));
    }

    return parts.length > 0 ? parts.join(' ') : this.i18n.t('parser.equipmentEvent');
  }

  private formatLocation(location: any): string {
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

  private getEventTypeName(eventCode: string, eventName?: string): string {
    if (eventName) {
      return eventName;
    }

    // Fallback to event code mappings
    return this.i18n.getEventCodeLabel(eventCode) || eventCode;
  }

  private buildEventDescription(event: OpTransportEvent): string {
    const parts: string[] = [];

    if (event.eventName) {
      parts.push(event.eventName);
    }

    if (event.modeOfTransport) {
      parts.push(this.i18n.t('parser.via', { mode: event.modeOfTransport }));
    }

    if (event.locationType) {
      parts.push(
        this.i18n.t('parser.atLocation', {
          location: this.i18n.getLocationTypeLabel(event.locationType),
        })
      );
    }

    return parts.length > 0 ? parts.join(' ') : this.i18n.t('parser.transportEvent');
  }

  private convertTransportEvent(event: OpTransportEvent): ShipmentEvent {
    return {
      eventType: this.getEventTypeName(event.eventCode, event.eventName),
      eventDateTime: event.eventTime,
      location: this.formatLocation(event.location),
      description: this.buildEventDescription(event),
      vessel: event.conveyanceInfo?.conveyanceName,
      voyage: event.conveyanceInfo?.conveyanceNumber,
      status: this.formatTimeType(event.timeType),
      // Additional fields for reference
      eventCode: event.eventCode,
      locationType: event.locationType,
      timeType: event.timeType,
      modeOfTransport: event.modeOfTransport,
      facilityCode: event.location.facilityCode,
      facilityName: event.location.facilityName,
      unLocationCode: event.location.unLocationCode,
      unLocationName: event.location.unLocationName,
      dataProvider: event.DataProvider,
    };
  }

  private formatTimeType(timeType: string): string {
    return this.i18n.getTimeTypeLabel(timeType) || timeType;
  }

  private formatContainerStatus(containerStatus: string, timeType: string): string {
    return this.i18n.t('parser.containerStatusFormat', {
      status: this.i18n.getContainerStatusLabel(containerStatus) || containerStatus,
      timeType: this.i18n.getTimeTypeLabel(timeType) || timeType,
    });
  }
}
