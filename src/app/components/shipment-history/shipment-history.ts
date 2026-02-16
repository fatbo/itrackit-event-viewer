import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { HistoryService, ShipmentHistoryEntry } from '../../services/history.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-shipment-history',
  imports: [CommonModule],
  templateUrl: './shipment-history.html',
  styleUrl: './shipment-history.css',
})
export class ShipmentHistory {
  private readonly historyService = inject(HistoryService);
  protected readonly i18n = inject(I18nService);

  @Output() loadShipment = new EventEmitter<unknown>();

  protected readonly isExpanded = signal(false);
  protected readonly entries = computed(() => this.historyService.entries());

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  loadEntry(entry: ShipmentHistoryEntry): void {
    this.loadShipment.emit(entry.rawData);
  }

  removeEntry(key: string): void {
    this.historyService.removeEntry(key);
  }

  clearHistory(): void {
    this.historyService.clearHistory();
  }

  formatViewedAt(viewedAt: string): string {
    return new Date(viewedAt).toLocaleString(this.i18n.localeTag());
  }

  getEntryTitle(entry: ShipmentHistoryEntry): string {
    return (
      entry.metadata.shipmentId ||
      entry.metadata.blNo ||
      entry.metadata.containerNumber ||
      this.i18n.t('history.unknownShipment')
    );
  }

  getEntryDetails(entry: ShipmentHistoryEntry): string {
    const containerText = entry.metadata.containerNumber
      ? `${this.i18n.t('history.container')}: ${entry.metadata.containerNumber}`
      : this.i18n.t('history.containerUnavailable');
    const fromText = entry.metadata.pol || this.i18n.t('history.locationUnknown');
    const toText = entry.metadata.pod || this.i18n.t('history.locationUnknown');
    return `${containerText} | ${this.i18n.t('history.from')}: ${fromText} ${this.i18n.t('history.to')} ${toText}`;
  }
}
