import { Routes } from '@angular/router';
import { TimelineView } from './views/timeline-view/timeline-view';
import { ComparisonView } from './views/comparison-view/comparison-view';

export const routes: Routes = [
  { path: 'timeline', component: TimelineView },
  { path: 'comparison', component: ComparisonView },
  { path: '', redirectTo: 'timeline', pathMatch: 'full' },
  { path: '**', redirectTo: 'timeline' },
];
