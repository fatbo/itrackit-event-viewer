import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './json-editor.html',
  styleUrl: './json-editor.css',
})
export class JsonEditor {
  @Input() value = '';
  @Input() placeholder = 'Paste your shipment event JSON here...';
  @Input() rows = 6;
  @Output() valueChange = new EventEmitter<string>();

  protected readonly formatError = signal('');

  onValueChange(nextValue: string): void {
    this.value = nextValue;
    this.formatError.set('');
    this.valueChange.emit(nextValue);
  }

  formatJson(): void {
    if (!this.value.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(this.value);
      const formatted = JSON.stringify(parsed, null, 2);
      this.value = formatted;
      this.formatError.set('');
      this.valueChange.emit(formatted);
    } catch (error) {
      this.formatError.set('Unable to format: invalid JSON.');
    }
  }
}
