import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EventInput } from './components/event-input/event-input';
import { EventSummary } from './components/event-summary/event-summary';
import { EventTimeline } from './components/event-timeline/event-timeline';
import { EventComparison } from './components/event-comparison/event-comparison';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EventInput, EventSummary, EventTimeline, EventComparison],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('iTrackiT Shipment Viewer');
}
