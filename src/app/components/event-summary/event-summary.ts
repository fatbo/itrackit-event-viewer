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
  
  protected readonly hasDangerousGoods = computed(() => {
    const dg = this.primaryEvent()?.dg;
    return Array.isArray(dg) && dg.length > 0;
  });

  protected readonly hasDamages = computed(() => {
    const dmg = this.primaryEvent()?.dmg;
    return Array.isArray(dmg) && dmg.length > 0;
  });

  protected readonly firstEvent = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) return null;
    // Return chronologically first event (earliest date)
    return [...events].sort((a, b) => 
      new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    )[0];
  });
  
  protected readonly lastEvent = computed(() => {
    const events = this.primaryEvent()?.events;
    if (!events || events.length === 0) return null;
    // Return chronologically last event (latest date)
    const sorted = [...events].sort((a, b) => 
      new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    );
    return sorted[sorted.length - 1];
  });
}
