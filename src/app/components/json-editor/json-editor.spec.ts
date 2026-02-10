import { TestBed } from '@angular/core/testing';
import { JsonEditor } from './json-editor';

describe('JsonEditor', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonEditor],
    }).compileComponents();
  });

  it('formats valid JSON with indentation', () => {
    const fixture = TestBed.createComponent(JsonEditor);
    const component = fixture.componentInstance;
    let emittedValue = '';

    component.value = '{"tracking":true}';
    component.valueChange.subscribe((value) => {
      emittedValue = value;
    });

    fixture.detectChanges();
    component.formatJson();

    expect(emittedValue).toBe('{\n  "tracking": true\n}');
    expect(fixture.nativeElement.querySelector('.format-message')).toBeNull();
  });

  it('shows an error when formatting invalid JSON', () => {
    const fixture = TestBed.createComponent(JsonEditor);
    const component = fixture.componentInstance;

    component.value = '{tracking:}';

    fixture.detectChanges();
    component.formatJson();
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.format-message');
    expect(message).not.toBeNull();
    expect(message?.textContent).toContain('Unable to format');
  });
});
