import { Component } from '@angular/core';
import { EventSummary } from '../../components/event-summary/event-summary';
import { EventTimeline } from '../../components/event-timeline/event-timeline';

@Component({
  selector: 'app-timeline-view',
  imports: [EventSummary, EventTimeline],
  templateUrl: './timeline-view.html',
  styleUrl: './timeline-view.css'
})
export class TimelineView {}
