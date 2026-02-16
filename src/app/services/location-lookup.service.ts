import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface UnlocodeCoordEntry {
  name: string;
  coordinates: string;
}

export interface LocationCoordinate {
  lat: number;
  lng: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationLookupService {
  private readonly http = inject(HttpClient);
  private readonly datasetPath = 'assets/unlocode-coords.json';
  private datasetPromise?: Promise<Record<string, UnlocodeCoordEntry>>;

  async getCoordinates(code?: string | null): Promise<LocationCoordinate | null> {
    if (!code) return null;
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return null;

    const dataset = await this.loadDataset();
    const entry = dataset[normalizedCode];
    if (!entry?.coordinates) return null;
    const parsed = this.parseCoordinateString(entry.coordinates);
    if (!parsed) return null;
    return {
      ...parsed,
      name: entry.name || normalizedCode,
    };
  }

  private async loadDataset(): Promise<Record<string, UnlocodeCoordEntry>> {
    if (!this.datasetPromise) {
      this.datasetPromise = firstValueFrom(
        this.http.get<Record<string, UnlocodeCoordEntry>>(this.datasetPath)
      );
    }
    return this.datasetPromise;
  }

  private parseCoordinateString(coordinate: string): { lat: number; lng: number } | null {
    const trimmed = coordinate.trim();
    const match = trimmed.match(/^(\d{4})([NS])\s+(\d{5})([EW])$/i);
    if (!match) return null;

    const [, latRaw, latDir, lngRaw, lngDir] = match;
    const lat = this.toDecimalDegrees(latRaw, latDir.toUpperCase());
    const lng = this.toDecimalDegrees(lngRaw, lngDir.toUpperCase());
    if (lat === null || lng === null) return null;
    return { lat, lng };
  }

  private toDecimalDegrees(value: string, direction: string): number | null {
    if (value.length < 3) return null;
    if (!['N', 'S', 'E', 'W'].includes(direction)) return null;
    const degreeDigits = value.length - 2;
    const degrees = Number.parseInt(value.slice(0, degreeDigits), 10);
    const minutes = Number.parseInt(value.slice(degreeDigits), 10);
    if (Number.isNaN(degrees) || Number.isNaN(minutes)) return null;

    const decimal = degrees + minutes / 60;
    return direction === 'S' || direction === 'W' ? -decimal : decimal;
  }
}
