import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { ShipmentData, ShipmentEvent } from '../../models/shipment-event.model';
import { EventData } from '../../services/event-data';
import { I18nService } from '../../services/i18n.service';
import { LocationLookupService } from '../../services/location-lookup.service';

interface RouteCandidate {
  code?: string;
  name: string;
  locationType?: string;
  events: ShipmentEvent[];
}

interface RoutePoint extends RouteCandidate {
  lat: number;
  lng: number;
}

interface MapPreferences {
  lat: number;
  lng: number;
  zoom: number;
}

@Component({
  selector: 'app-route-map',
  templateUrl: './route-map.html',
  styleUrl: './route-map.css',
})
export class RouteMap implements AfterViewInit {
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;

  private readonly eventData = inject(EventData);
  protected readonly i18n = inject(I18nService);
  private readonly locationLookup = inject(LocationLookupService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly preferencesKey = 'itrackit.route-map-preferences';
  private readonly maxEventsPerLocation = 4;
  private readonly minMarkerZoomLevel = 5;
  private readonly mapBoundsPadding: [number, number] = [24, 24];
  private readonly minDelayThresholdHours = 0.25;
  private readonly msPerHour = 1000 * 60 * 60;

  protected readonly primaryEvent = this.eventData.primaryEvent;
  protected readonly routePoints = signal<RoutePoint[]>([]);
  protected readonly missingLocations = signal<string[]>([]);
  protected readonly hasPoints = computed(() => this.routePoints().length > 0);
  protected readonly hasAnyLocationData = computed(
    () => this.routePoints().length > 0 || this.missingLocations().length > 0
  );

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private routeLayer?: L.Polyline;
  private prefersReducedMotion = false;
  private routeBuildToken = 0;

  constructor() {
    effect(() => {
      const shipment = this.primaryEvent();
      void this.updateRouteData(shipment);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  protected async onMapToggle(event: Event): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const details = event.currentTarget as HTMLDetailsElement | null;
    if (!details) return;
    if (!details.open) return;
    await this.ensureMapReady();
    this.map?.invalidateSize();
  }

  private async updateRouteData(shipment: ShipmentData | null): Promise<void> {
    const token = ++this.routeBuildToken;
    if (!shipment) {
      this.routePoints.set([]);
      this.missingLocations.set([]);
      this.clearMapLayers();
      return;
    }

    const routeCandidates = this.buildRouteCandidates(shipment);
    const resolvedPoints: RoutePoint[] = [];
    const missingNames: string[] = [];

    for (const candidate of routeCandidates) {
      if (!candidate.code) {
        missingNames.push(candidate.name);
        continue;
      }
      const coordinates = await this.locationLookup.getCoordinates(candidate.code);
      if (!coordinates) {
        missingNames.push(candidate.name || candidate.code);
        continue;
      }
      resolvedPoints.push({
        ...candidate,
        lat: coordinates.lat,
        lng: coordinates.lng,
        name: candidate.name || coordinates.name,
      });
    }

    if (token !== this.routeBuildToken) return;

    this.routePoints.set(resolvedPoints);
    this.missingLocations.set(missingNames);
    if (this.map) {
      this.renderMapLayers();
    }
  }

  private buildRouteCandidates(shipment: ShipmentData): RouteCandidate[] {
    const fromTransport = (shipment.transportEvents ?? [])
      .slice()
      .sort((a, b) => {
        const seqA = a.seq ?? Number.MAX_SAFE_INTEGER;
        const seqB = b.seq ?? Number.MAX_SAFE_INTEGER;
        if (seqA !== seqB) return seqA - seqB;
        return new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime();
      })
      .map((event) => ({
        code: event.location?.unLocationCode?.toUpperCase(),
        name: event.location?.unLocationName || event.location?.unLocationCode || '',
        locationType: event.locationType,
      }));

    const fromEquipment = (shipment.events ?? [])
      .slice()
      .sort(
        (a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
      )
      .map((event) => ({
        code: event.unLocationCode?.toUpperCase(),
        name: event.unLocationName || event.location || '',
        locationType: event.locationType,
      }));

    const source = fromTransport.length > 0 ? fromTransport : fromEquipment;
    const route: RouteCandidate[] = [];
    const lastKey = { value: '' };

    for (const item of source) {
      const key = `${item.code || ''}|${item.name}`;
      if (!item.name || key === lastKey.value) continue;
      lastKey.value = key;
      route.push({
        code: item.code,
        name: item.name,
        locationType: item.locationType,
        events: this.getEventsForLocation(shipment, item.code, item.name),
      });
    }

    return route;
  }

  private getEventsForLocation(
    shipment: ShipmentData,
    locationCode?: string,
    locationName?: string
  ): ShipmentEvent[] {
    return (shipment.events ?? [])
      .filter((event) => {
        if (locationCode && event.unLocationCode?.toUpperCase() === locationCode) return true;
        if (!locationCode && locationName && event.unLocationName === locationName) return true;
        return false;
      })
      .slice(0, this.maxEventsPerLocation);
  }

  private async ensureMapReady(): Promise<void> {
    if (this.map || !this.mapContainer?.nativeElement) return;
    const mapElement = this.mapContainer.nativeElement;
    this.map = L.map(mapElement, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('moveend zoomend', () => this.persistMapPreferences());
    this.renderMapLayers();
  }

  private renderMapLayers(): void {
    if (!this.map) return;
    this.clearMapLayers();
    const points = this.routePoints();
    if (points.length === 0) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const lineColor = rootStyles.getPropertyValue('--accent-cyan').trim();
    const defaultMarkerColor = rootStyles.getPropertyValue('--accent-cyan').trim();
    const markerColors: Record<string, string> = {
      POL: rootStyles.getPropertyValue('--accent-emerald').trim(),
      POT: rootStyles.getPropertyValue('--accent-amber').trim(),
      POD: rootStyles.getPropertyValue('--accent-coral').trim(),
      POC: rootStyles.getPropertyValue('--accent-cyan').trim(),
    };

    this.applyMapViewport(points);

    this.markersLayer = L.layerGroup();
    for (const point of points) {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 7,
        color: markerColors[point.locationType || ''] || defaultMarkerColor,
        weight: 2,
        fillColor: markerColors[point.locationType || ''] || defaultMarkerColor,
        fillOpacity: 0.85,
      });
      marker.bindPopup(this.buildPopupContent(point));
      marker.on('click', () => {
        if (!this.map) return;
        const zoom = this.map.getZoom();
        this.map.setView([point.lat, point.lng], Math.max(zoom, this.minMarkerZoomLevel));
      });
      this.markersLayer.addLayer(marker);
    }
    this.markersLayer.addTo(this.map);

    if (points.length >= 2) {
      this.routeLayer = L.polyline(
        points.map((point) => [point.lat, point.lng]),
        {
          color: lineColor,
          weight: 3,
          opacity: 0.8,
          dashArray: this.prefersReducedMotion ? undefined : '10 12',
          className: this.prefersReducedMotion ? '' : 'route-line-animated',
        }
      );
      this.routeLayer.addTo(this.map);
    }
  }

  private applyMapViewport(points: RoutePoint[]): void {
    if (!this.map) return;
    const preference = this.readMapPreferences();
    if (preference) {
      this.map.setView([preference.lat, preference.lng], preference.zoom);
      return;
    }
    if (points.length === 1) {
      this.map.setView([points[0].lat, points[0].lng], this.minMarkerZoomLevel);
      return;
    }
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    this.map.fitBounds(bounds, { padding: this.mapBoundsPadding });
  }

  private clearMapLayers(): void {
    if (this.markersLayer) {
      this.map?.removeLayer(this.markersLayer);
      this.markersLayer = undefined;
    }
    if (this.routeLayer) {
      this.map?.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }
  }

  private buildPopupContent(point: RoutePoint): string {
    const eventItems = point.events
      .map((event) => {
        const date = event.eventDateTime
          ? new Date(event.eventDateTime).toLocaleString(this.i18n.localeTag())
          : this.i18n.t('routeMap.timeUnknown');
        const delay = this.getDelayLabel(event);
        return `<li>${this.escapeHtml(event.eventType)} — ${this.escapeHtml(date)}${
          delay ? ` (${this.escapeHtml(delay)})` : ''
        }</li>`;
      })
      .join('');

    const locationName = this.escapeHtml(point.name);
    const locationCode = point.code ? ` (${this.escapeHtml(point.code)})` : '';
    return `
      <div class="route-map-popup">
        <strong>${locationName}${locationCode}</strong>
        ${eventItems ? `<ul>${eventItems}</ul>` : `<p>${this.escapeHtml(this.i18n.t('routeMap.noEventsAtLocation'))}</p>`}
      </div>
    `;
  }

  private getDelayLabel(event: ShipmentEvent): string {
    if (!event.actualTime || !event.estimatedTime) return '';
    const actual = Date.parse(event.actualTime);
    const estimated = Date.parse(event.estimatedTime);
    if (Number.isNaN(actual) || Number.isNaN(estimated)) return '';
    const deltaHours = (actual - estimated) / this.msPerHour;
    if (Math.abs(deltaHours) < this.minDelayThresholdHours) return '';
    return this.i18n.t('routeMap.delay', {
      value: Math.abs(deltaHours).toFixed(1),
      direction: deltaHours > 0 ? this.i18n.t('routeMap.delayLate') : this.i18n.t('routeMap.delayEarly'),
    });
  }

  private persistMapPreferences(): void {
    if (!isPlatformBrowser(this.platformId) || !this.map) return;
    const center = this.map.getCenter();
    const payload: MapPreferences = {
      lat: Number(center.lat.toFixed(5)),
      lng: Number(center.lng.toFixed(5)),
      zoom: this.map.getZoom(),
    };
    const value = JSON.stringify(payload);
    try {
      localStorage.setItem(this.preferencesKey, value);
    } catch {
      try {
        sessionStorage.setItem(this.preferencesKey, value);
      } catch {
        // no-op
      }
    }
  }

  private readMapPreferences(): MapPreferences | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(this.preferencesKey) || sessionStorage.getItem(this.preferencesKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as MapPreferences;
      if (
        typeof parsed.lat !== 'number' ||
        typeof parsed.lng !== 'number' ||
        typeof parsed.zoom !== 'number'
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
