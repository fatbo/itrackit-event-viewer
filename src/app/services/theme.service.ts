import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try {
        localStorage.setItem('itrackit-theme', t);
      } catch {
        // localStorage unavailable
      }
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private getInitialTheme(): Theme {
    try {
      const stored = localStorage.getItem('itrackit-theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return 'dark';
  }
}
