import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentData } from '../../models/shipment-event.model';

@Component({
  selector: 'app-event-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-input.html',
  styleUrl: './event-input.css',
})
export class EventInput {
  protected readonly jsonInput = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isPrimary = signal(true);
  
  constructor(private eventDataService: EventData) {}
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.processJsonInput(content);
    };
    
    reader.onerror = () => {
      this.errorMessage.set('Error reading file');
    };
    
    reader.readAsText(file);
  }
  
  onPasteJson(): void {
    this.processJsonInput(this.jsonInput());
  }
  
  private processJsonInput(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString) as ShipmentData;
      
      // Validate that it has events array
      if (!data.events || !Array.isArray(data.events)) {
        this.errorMessage.set('Invalid shipment data: missing events array');
        return;
      }
      
      if (this.isPrimary()) {
        this.eventDataService.setPrimaryEvent(data);
      } else {
        this.eventDataService.setSecondaryEvent(data);
      }
      
      this.errorMessage.set('');
      this.jsonInput.set('');
    } catch (error) {
      this.errorMessage.set('Invalid JSON format: ' + (error as Error).message);
    }
  }
  
  toggleEventType(): void {
    this.isPrimary.set(!this.isPrimary());
  }
  
  clearAll(): void {
    this.jsonInput.set('');
    this.errorMessage.set('');
    this.eventDataService.clearEvents();
  }
}
