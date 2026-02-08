import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';

@Component({
  selector: 'app-event-summary',
  imports: [CommonModule],
  templateUrl: './event-summary.html',
  styleUrl: './event-summary.css',
})
export class EventSummary {
  private eventDataService = inject(EventData);
  
  protected readonly primaryEvent = this.eventDataService.primaryEvent;
  
  protected readonly eventCount = computed(() => {
    return this.primaryEvent()?.events?.length || 0;
  });
  
  protected readonly firstEvent = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) return null;
    return events[0];
  });
  
  protected readonly lastEvent = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) return null;
    return events[events.length - 1];
  });
}
