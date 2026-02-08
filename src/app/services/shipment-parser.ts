import { Injectable } from '@angular/core';
import {
  OpShipmentEventRaw,
  OpTransportEvent,
  OpEquipmentEvent,
  ShipmentData,
  ShipmentEvent,
} from '../models/shipment-event.model';

@Injectable({
  providedIn: 'root',
})
export class ShipmentParser {
  // Constants for mapping
  private readonly CONTAINER_STATUS_MAP: { [key: string]: string } = {
    F: 'Full',
    E: 'Empty',
  };

  private readonly TIME_TYPE_MAP: { [key: string]: string } = {
    A: 'Actual',
    E: 'Estimated',
    G: 'Planned',
  };

  private readonly EVENT_CODE_MAP: { [key: string]: string } = {
    OG: 'Gate Out',
    IG: 'Gate In',
    AE: 'Arrived at Export',
    VD: 'Vessel Departure',
    VA: 'Vessel Arrival',
    UV: 'Unloaded from Vessel',
    AL: 'Loaded on Vessel',
    UR: 'Unloaded from Rail',
    RD: 'Rail Departure',
    RA: 'Rail Arrival',
    TA: 'Truck Arrival',
    CT: 'Container Terminal',
    RT: 'Return to Terminal',
    SS: 'Shipment Status',
    ZZ: 'Other',
    PD: 'Port Discharge',
  };

  private readonly LOCATION_TYPE_MAP: { [key: string]: string } = {
    POL: 'Port of Loading',
    POD: 'Port of Discharge',
    POT: 'Port of Transhipment',
    POC: 'Port of Call',
  };

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

    // Process transport events
    if (raw.transportEvents && Array.isArray(raw.transportEvents)) {
      for (const te of raw.transportEvents) {
        events.push(this.convertTransportEvent(te));
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
      timeDetails.push(`Actual: ${new Date(actualEvent.eventTime).toLocaleString()}`);
    }
    if (estimatedEvent) {
      timeDetails.push(`Estimated: ${new Date(estimatedEvent.eventTime).toLocaleString()}`);
    }
    if (plannedEvent) {
      timeDetails.push(`Planned: ${new Date(plannedEvent.eventTime).toLocaleString()}`);
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
      parts.push(`(${this.CONTAINER_STATUS_MAP[event.containerStatus]} container)`);
    }

    if (event.modeOfTransport) {
      parts.push(`via ${event.modeOfTransport}`);
    }

    // Add time details if multiple times are available
    if (timeDetails.length > 1) {
      parts.push(`- ${timeDetails.join(', ')}`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Equipment event';
  }

  private formatLocation(location: any): string {
    if (!location) return '';

    const parts: string[] = [];

    if (location.facilityName) {
      parts.push(location.facilityName);
    }

    if (location.unLocationName) {
      parts.push(location.unLocationName);
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
    return this.EVENT_CODE_MAP[eventCode] || eventCode;
  }

  private buildEventDescription(event: OpTransportEvent): string {
    const parts: string[] = [];

    if (event.eventName) {
      parts.push(event.eventName);
    }

    if (event.modeOfTransport) {
      parts.push(`via ${event.modeOfTransport}`);
    }

    if (event.locationType) {
      parts.push(`at ${this.LOCATION_TYPE_MAP[event.locationType] || event.locationType}`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Transport event';
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
    return this.TIME_TYPE_MAP[timeType] || timeType;
  }

  private formatContainerStatus(containerStatus: string, timeType: string): string {
    return `${this.CONTAINER_STATUS_MAP[containerStatus] || containerStatus} - ${this.TIME_TYPE_MAP[timeType] || timeType}`;
  }
}
