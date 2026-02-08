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
    if (primary.shipmentId !== secondary.shipmentId) {
      diffs.push(`Shipment ID: "${primary.shipmentId}" vs "${secondary.shipmentId}"`);
    }
    
    if (primary.origin !== secondary.origin) {
      diffs.push(`Origin: "${primary.origin}" vs "${secondary.origin}"`);
    }
    
    if (primary.destination !== secondary.destination) {
      diffs.push(`Destination: "${primary.destination}" vs "${secondary.destination}"`);
    }
    
    // Compare event counts
    const primaryCount = primary.events?.length || 0;
    const secondaryCount = secondary.events?.length || 0;
    
    if (primaryCount !== secondaryCount) {
      diffs.push(`Event Count: ${primaryCount} vs ${secondaryCount}`);
    }
    
    return diffs;
  });
}
