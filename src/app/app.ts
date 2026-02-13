import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { EventInput } from './components/event-input/event-input';
import { I18nService, Locale } from './services/i18n.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EventInput],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly title = computed(() => this.i18n.t('app.title'));
  protected readonly showInput = signal(false);
  protected readonly isDarkTheme = computed(() => this.themeService.theme() === 'dark');

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  toggleInput(): void {
    this.showInput.set(!this.showInput());
  }

  closeInput(): void {
    this.showInput.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
