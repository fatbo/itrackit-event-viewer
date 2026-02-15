import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('iTrackiT Shipment Viewer');
  });

  it('should render navigation tabs', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const navTabs = compiled.querySelectorAll('.nav-tab');
    expect(navTabs.length).toBe(2);
    expect(navTabs[0].textContent).toContain('Timeline');
    expect(navTabs[1].textContent).toContain('Event Comparison');
  });

  it('should auto-dismiss input panel when clicking outside', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const openButton = compiled.querySelector('.input-toggle-btn') as HTMLButtonElement;
    openButton.click();
    fixture.detectChanges();

    const inputPanel = compiled.querySelector('.input-panel') as HTMLElement;
    expect(inputPanel.classList.contains('input-panel-hidden')).toBe(false);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(inputPanel.classList.contains('input-panel-hidden')).toBe(true);
  });

  it('should define full-width styles for header, input panel, and footer', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const styles = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');

    expect(/\.app-header[^{]*\{[^}]*inline-size:\s*100%[^}]*margin-inline:\s*0/s.test(styles)).toBe(true);
    expect(/\.input-panel[^{]*\{[^}]*inline-size:\s*100%[^}]*margin-inline:\s*0/s.test(styles)).toBe(true);
    expect(/\.app-footer[^{]*\{[^}]*inline-size:\s*100%[^}]*margin-inline:\s*0/s.test(styles)).toBe(true);
  });
});
