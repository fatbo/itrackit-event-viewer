import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventData } from '../../services/event-data';
import { ShipmentData } from '../../models/shipment-event.model';
import { ShipmentParser } from '../../services/shipment-parser';

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
  
  constructor(
    private eventDataService: EventData,
    private parser: ShipmentParser
  ) {}
  
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
      const parsedData = JSON.parse(jsonString);
      let shipmentData: ShipmentData;
      
      // Check if it's OpShipmentEventRaw format
      if (this.parser.isOpShipmentEventRaw(parsedData)) {
        shipmentData = this.parser.parseOpShipmentEventRaw(parsedData);
      } else if (this.parser.isShipmentData(parsedData)) {
        // Already in ShipmentData format
        shipmentData = parsedData;
      } else {
        this.errorMessage.set('Invalid shipment data format. Please provide either OpShipmentEventRaw or ShipmentData format.');
        return;
      }
      
      // Validate that it has events array
      if (!shipmentData.events || !Array.isArray(shipmentData.events)) {
        this.errorMessage.set('Invalid shipment data: no events found');
        return;
      }
      
      if (this.isPrimary()) {
        this.eventDataService.setPrimaryEvent(shipmentData);
      } else {
        this.eventDataService.setSecondaryEvent(shipmentData);
      }
      
      this.errorMessage.set('');
      this.jsonInput.set('');
    } catch (error) {
      this.errorMessage.set('Invalid JSON format. Please check your JSON syntax and try again.');
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
