import { Component, signal, computed, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MongoDbService, MongoDbConfig, QueryField } from '../../services/mongodb.service';
import { EventData } from '../../services/event-data';
import { ShipmentParser } from '../../services/shipment-parser';
import { ShipmentData } from '../../models/shipment-event.model';

@Component({
  selector: 'app-db-query',
  imports: [CommonModule, FormsModule],
  templateUrl: './db-query.html',
  styleUrl: './db-query.css',
})
export class DbQuery {
  @Input() isPrimary = true;

  protected readonly apiUrl = signal('');
  protected readonly database = signal('');
  protected readonly collection = signal('final_shipment');
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly showConnectionForm = signal(true);

  protected readonly queryValue = signal('');
  protected readonly queryField = signal<QueryField>('blNo');
  protected readonly querying = signal(false);
  protected readonly queryError = signal('');
  protected readonly querySuccess = signal('');

  constructor(
    protected mongoDb: MongoDbService,
    private eventDataService: EventData,
    private parser: ShipmentParser,
  ) {}

  async onConnect(): Promise<void> {
    const config: MongoDbConfig = {
      apiUrl: this.apiUrl().trim(),
      database: this.database().trim(),
      collection: this.collection().trim() || 'final_shipment',
      username: this.username().trim(),
      password: this.password(),
    };

    if (!config.apiUrl || !config.database || !config.username) {
      this.mongoDb.error.set('Please fill in API URL, database name, and username');
      return;
    }

    const success = await this.mongoDb.connect(config);
    if (success) {
      this.showConnectionForm.set(false);
    }
  }

  onDisconnect(): void {
    this.mongoDb.disconnect();
    this.showConnectionForm.set(true);
    this.queryValue.set('');
    this.queryError.set('');
    this.querySuccess.set('');
  }

  onChangeConnection(): void {
    this.showConnectionForm.set(true);
    this.queryError.set('');
    this.querySuccess.set('');
  }

  async onQuery(): Promise<void> {
    const value = this.queryValue().trim();
    if (!value) {
      this.queryError.set('Please enter a search value');
      return;
    }

    this.querying.set(true);
    this.queryError.set('');
    this.querySuccess.set('');

    try {
      const result = await this.mongoDb.query(this.queryField(), value);

      if (!result) {
        this.queryError.set('No shipment found matching the criteria');
        return;
      }

      let shipmentData: ShipmentData;

      if (this.parser.isOpShipmentEventRaw(result)) {
        shipmentData = this.parser.parseOpShipmentEventRaw(result);
      } else if (this.parser.isShipmentData(result)) {
        shipmentData = result;
      } else {
        this.queryError.set(
          'Retrieved document is not in a recognized shipment format',
        );
        return;
      }

      if (!shipmentData.events || !Array.isArray(shipmentData.events)) {
        this.queryError.set('Invalid shipment data: no events found');
        return;
      }

      if (this.isPrimary) {
        this.eventDataService.setPrimaryEvent(shipmentData);
      } else {
        this.eventDataService.setSecondaryEvent(shipmentData);
      }

      this.querySuccess.set(
        `Shipment loaded as ${this.isPrimary ? 'primary' : 'secondary'} event`,
      );
    } catch (err: any) {
      const message =
        err?.error?.message || err?.message || 'Query failed';
      this.queryError.set(message);
    } finally {
      this.querying.set(false);
    }
  }

  readonly canConnect = computed(() =>
    !!this.apiUrl().trim() &&
    !!this.database().trim() &&
    !!this.username().trim() &&
    !this.mongoDb.connecting()
  );
}
