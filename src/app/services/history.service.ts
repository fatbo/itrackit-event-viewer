import { Injectable, signal } from '@angular/core';
import { OpShipmentEventRaw, ShipmentData } from '../models/shipment-event.model';

export interface ShipmentHistoryMetadata {
  shipmentId?: string;
  blNo?: string;
  containerNumber?: string;
  pol?: string;
  pod?: string;
}

export interface ShipmentHistoryEntry {
  key: string;
  identity: string;
  metadata: ShipmentHistoryMetadata;
  rawData: OpShipmentEventRaw | ShipmentData;
  viewedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private readonly HISTORY_STORAGE_KEY = 'itrackit.shipment-history';
  private readonly MAX_ENTRIES = 15;

  private readonly entriesState = signal<ShipmentHistoryEntry[]>(this.readEntries());
  readonly entries = this.entriesState.asReadonly();

  addEntry(rawData: OpShipmentEventRaw | ShipmentData): void {
    const metadata = this.extractMetadata(rawData);
    const identity = this.createIdentity(metadata);
    const viewedAt = new Date().toISOString();
    const key = `${identity}-${Date.now()}`;

    const nextEntries = [
      {
        key,
        identity,
        metadata,
        rawData,
        viewedAt,
      },
      ...this.entriesState().filter((entry) => entry.identity !== identity),
    ].slice(0, this.MAX_ENTRIES);

    this.saveEntries(nextEntries);
    this.entriesState.set(nextEntries);
  }

  removeEntry(key: string): void {
    const nextEntries = this.entriesState().filter((entry) => entry.key !== key);
    this.saveEntries(nextEntries);
    this.entriesState.set(nextEntries);
  }

  clearHistory(): void {
    this.saveEntries([]);
    this.entriesState.set([]);
  }

  private extractMetadata(rawData: OpShipmentEventRaw | ShipmentData): ShipmentHistoryMetadata {
    if (this.isOpShipmentEventRaw(rawData)) {
      return {
        shipmentId: rawData.id,
        blNo: rawData.blNo,
        containerNumber: rawData.containerNo,
        pol: rawData.pol?.unLocationCode ?? rawData.pol?.unLocationName,
        pod: rawData.pod?.unLocationCode ?? rawData.pod?.unLocationName,
      };
    }

    return {
      shipmentId: rawData.shipmentId,
      blNo: rawData.blNo,
      containerNumber: rawData.containerNumber,
      pol: rawData.origin,
      pod: rawData.destination,
    };
  }

  private createIdentity(metadata: ShipmentHistoryMetadata): string {
    return metadata.shipmentId || metadata.blNo || metadata.containerNumber || 'shipment';
  }

  private isOpShipmentEventRaw(data: OpShipmentEventRaw | ShipmentData): data is OpShipmentEventRaw {
    return 'id' in data && 'containerNo' in data;
  }

  private readEntries(): ShipmentHistoryEntry[] {
    return this.readEntriesFromStorage(localStorage) ?? this.readEntriesFromStorage(sessionStorage) ?? [];
  }

  private readEntriesFromStorage(storage: Storage): ShipmentHistoryEntry[] | null {
    try {
      const raw = storage.getItem(this.HISTORY_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((entry: unknown): entry is ShipmentHistoryEntry => {
        return (
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as ShipmentHistoryEntry).key === 'string' &&
          typeof (entry as ShipmentHistoryEntry).identity === 'string' &&
          typeof (entry as ShipmentHistoryEntry).viewedAt === 'string' &&
          typeof (entry as ShipmentHistoryEntry).rawData === 'object' &&
          (entry as ShipmentHistoryEntry).rawData !== null
        );
      });
    } catch {
      return null;
    }
  }

  private saveEntries(entries: ShipmentHistoryEntry[]): void {
    const serialized = JSON.stringify(entries);
    if (this.writeEntries(localStorage, serialized)) {
      return;
    }

    this.writeEntries(sessionStorage, serialized);
  }

  private writeEntries(storage: Storage, serialized: string): boolean {
    try {
      storage.setItem(this.HISTORY_STORAGE_KEY, serialized);
      return true;
    } catch {
      return false;
    }
  }
}
