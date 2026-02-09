import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface MongoDbConfig {
  apiUrl: string;
  database: string;
  collection: string;
  username: string;
  password: string;
}

export type QueryField = 'blNo' | 'bookingNo' | 'containerNo';

@Injectable({
  providedIn: 'root',
})
export class MongoDbService {
  private config: MongoDbConfig | null = null;

  readonly connected = signal(false);
  readonly connecting = signal(false);
  readonly error = signal('');

  constructor(private http: HttpClient) {}

  async connect(config: MongoDbConfig): Promise<boolean> {
    this.connecting.set(true);
    this.error.set('');

    if (config.apiUrl && !config.apiUrl.startsWith('https://') && !config.apiUrl.startsWith('http://localhost')) {
      this.error.set('API URL must use HTTPS to protect credentials');
      this.connecting.set(false);
      return false;
    }

    try {
      // Store config and test connection with a minimal query
      this.config = config;
      const headers = this.buildHeaders();
      const body = this.buildRequestBody({}, 'findOne');

      await firstValueFrom(
        this.http.post(config.apiUrl + '/action/findOne', body, { headers })
      );

      this.connected.set(true);
      return true;
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'Connection failed';
      this.error.set(message);
      this.config = null;
      this.connected.set(false);
      return false;
    } finally {
      this.connecting.set(false);
    }
  }

  disconnect(): void {
    this.config = null;
    this.connected.set(false);
    this.error.set('');
  }

  async query(field: QueryField, value: string): Promise<any> {
    if (!this.config) {
      throw new Error('Not connected to database');
    }

    const filter: Record<string, string> = {};
    filter[field] = value;

    const headers = this.buildHeaders();
    const body = this.buildRequestBody(filter, 'findOne');

    const response = await firstValueFrom(
      this.http.post<any>(this.config.apiUrl + '/action/findOne', body, { headers })
    );

    // Atlas Data API wraps result in { document: ... }
    return response?.document ?? response;
  }

  private buildHeaders(): HttpHeaders {
    if (!this.config) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(this.config.username + ':' + this.config.password),
    });
  }

  private buildRequestBody(
    filter: Record<string, any>,
    action: string
  ): Record<string, any> {
    if (!this.config) {
      return {};
    }
    return {
      dataSource: 'default',
      database: this.config.database,
      collection: this.config.collection,
      filter,
    };
  }
}
