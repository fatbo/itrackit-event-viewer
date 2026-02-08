import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentEvent } from '../../models/shipment-event.model';

@Component({
  selector: 'app-event-timeline',
  imports: [CommonModule],
  templateUrl: './event-timeline.html',
  styleUrl: './event-timeline.css',
})
export class EventTimeline {
  private eventDataService = inject(EventData);
  
  protected readonly primaryEvent = this.eventDataService.primaryEvent;
  
  protected readonly sortedEvents = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events) return [];
    
    // Sort events by date (oldest first)
    return [...events].sort((a, b) => {
      return new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime();
    });
  });
  
  getEventIcon(eventType: string): string {
    const type = eventType.toLowerCase();
    if (type.includes('depart') || type.includes('departure')) return '🚢';
    if (type.includes('arrive') || type.includes('arrival')) return '🏁';
    if (type.includes('load')) return '📦';
    if (type.includes('discharge') || type.includes('unload')) return '📭';
    if (type.includes('gate')) return '🚪';
    if (type.includes('customs')) return '🛃';
    return '📍';
  }
}
