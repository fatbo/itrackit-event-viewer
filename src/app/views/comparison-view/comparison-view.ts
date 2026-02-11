import { Component } from '@angular/core';
import { EventComparison } from '../../components/event-comparison/event-comparison';

@Component({
  selector: 'app-comparison-view',
  imports: [EventComparison],
  templateUrl: './comparison-view.html',
  styleUrl: './comparison-view.css'
})
export class ComparisonView {}
