import { Injectable, signal } from '@angular/core';
import { ShipmentData } from '../models/shipment-event.model';

@Injectable({
  providedIn: 'root',
})
export class EventData {
  private primaryEventData = signal<ShipmentData | null>(null);
  private secondaryEventData = signal<ShipmentData | null>(null);
  
  readonly primaryEvent = this.primaryEventData.asReadonly();
  readonly secondaryEvent = this.secondaryEventData.asReadonly();
  
  setPrimaryEvent(data: ShipmentData | null): void {
    this.primaryEventData.set(data);
  }
  
  setSecondaryEvent(data: ShipmentData | null): void {
    this.secondaryEventData.set(data);
  }
  
  clearEvents(): void {
    this.primaryEventData.set(null);
    this.secondaryEventData.set(null);
  }
}
