import { Component } from '@angular/core';
import { EventSummary } from '../../components/event-summary/event-summary';
import { EventTimeline } from '../../components/event-timeline/event-timeline';
import { RouteMap } from '../../components/route-map/route-map';

@Component({
  selector: 'app-timeline-view',
  imports: [EventSummary, EventTimeline, RouteMap],
  templateUrl: './timeline-view.html',
  styleUrl: './timeline-view.css'
})
export class TimelineView {}
