import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EventInput } from './components/event-input/event-input';
import { EventSummary } from './components/event-summary/event-summary';
import { EventTimeline } from './components/event-timeline/event-timeline';
import { EventComparison } from './components/event-comparison/event-comparison';
import { I18nService, Locale } from './services/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EventInput, EventSummary, EventTimeline, EventComparison],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly title = computed(() => this.i18n.t('app.title'));
  protected readonly showInput = signal(false);

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  toggleInput(): void {
    this.showInput.set(!this.showInput());
  }

  closeInput(): void {
    this.showInput.set(false);
  }
}
