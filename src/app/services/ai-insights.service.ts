import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import {
  AiInsights,
  AiPrediction,
  OpTransportEvent,
  ShipmentData,
  ShipmentEvent,
} from '../models/shipment-event.model';

interface PortTiming {
  arrival?: string;
  departure?: string;
  dwellHours?: number;
  priority?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AiInsightsService {
  private readonly modelVersion = 'tfjs-mvp-1';
  private readonly model: tf.LayersModel;

  constructor() {
    // Force CPU backend to avoid WebGL requirements in browsers/tests
    void tf.setBackend('cpu').catch(() => {});
    this.model = this.buildHeuristicModel();
  }

  enrichShipment(shipment: ShipmentData): ShipmentData {
    const predictions = this.generatePredictions(shipment);
    const aiInsights: AiInsights = {
      modelVersion: this.modelVersion,
      generatedAt: new Date().toISOString(),
      predictions,
    };

    const enhancedEvents = (shipment.events ?? []).map((event) => {
      if (event.actualTime) return event;
      const match = predictions.find((p) => this.matchesEvent(event, p));
      return match
        ? {
            ...event,
            aiPrediction: match,
            predictedTime: match.predictedTime,
          }
        : event;
    });

    return {
      ...shipment,
      aiInsights,
      events: enhancedEvents,
    };
  }

  private matchesEvent(event: ShipmentEvent, prediction: AiPrediction): boolean {
    return (
      prediction.targetEventCode === event.eventCode &&
      (!prediction.locationCode || prediction.locationCode === event.unLocationCode)
    );
  }

  private generatePredictions(shipment: ShipmentData): AiPrediction[] {
    const events = shipment.events ?? [];
    const transportEvents = (shipment.transportEvents ?? []) as OpTransportEvent[];
    if (events.length === 0) return [];

    const dwellByPort = this.buildDwellLookup(transportEvents);
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
    );

    const predictions: AiPrediction[] = [];

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      if (event.actualTime) continue;

      const targetTime = event.estimatedTime ?? event.plannedTime ?? event.eventDateTime;
      if (!targetTime) continue;

      const targetMs = Date.parse(targetTime);
      if (Number.isNaN(targetMs)) continue;

      const prevActual = this.findPreviousActual(sortedEvents, i);
      const baseReferenceMs = prevActual
        ? Date.parse(prevActual.actualTime ?? prevActual.eventDateTime)
        : targetMs;

      const baseGapHours = Math.max(
        0,
        (targetMs - baseReferenceMs) / (1000 * 60 * 60)
      ) || 24;

      const dwellHours =
        dwellByPort.get(event.unLocationCode ?? '')?.dwellHours ?? 0;
      const providerPriority =
        dwellByPort.get(event.unLocationCode ?? '')?.priority ?? 1;

      const { delayHours, confidence } = this.predictDelayHours(
        baseGapHours,
        dwellHours,
        providerPriority
      );

      const predictedTimeMs = targetMs + delayHours * 60 * 60 * 1000;
      const riskLevel = this.getRiskLevel(delayHours);
      const drivers = this.buildDrivers(delayHours, dwellHours, providerPriority);

      predictions.push({
        targetEventCode: event.eventCode ?? '',
        locationCode: event.unLocationCode,
        predictedTime: new Date(predictedTimeMs).toISOString(),
        delayHours: this.roundToOneDecimal(delayHours),
        riskLevel,
        confidence,
        drivers,
      });
    }

    return predictions;
  }

  private buildDrivers(delayHours: number, dwellHours: number, priority: number): string[] {
    const drivers: string[] = [];
    if (dwellHours > 0) drivers.push(`dwell:${this.roundToOneDecimal(dwellHours)}h`);
    if (priority > 1) drivers.push(`priority:${priority}`);
    if (delayHours > 0) drivers.push(`delta:${this.roundToOneDecimal(delayHours)}h`);
    return drivers;
  }

  private buildDwellLookup(events: OpTransportEvent[]): Map<string, PortTiming> {
    const portMap = new Map<string, PortTiming>();

    for (const event of events) {
      const code = event.location.unLocationCode;
      if (!portMap.has(code)) {
        portMap.set(code, {});
      }
      const node = portMap.get(code)!;
      if (event.eventCode === 'VA' || event.eventCode === 'RA') {
        node.arrival = event.eventTime;
      } else if (event.eventCode === 'VD' || event.eventCode === 'RD') {
        node.departure = event.eventTime;
      }
      if (event.DataProviderPriority != null) {
        node.priority =
          node.priority == null
            ? event.DataProviderPriority
            : Math.min(node.priority, event.DataProviderPriority);
      }
    }

    for (const node of portMap.values()) {
      if (node.arrival && node.departure) {
        const arrival = Date.parse(node.arrival);
        const departure = Date.parse(node.departure);
        if (!Number.isNaN(arrival) && !Number.isNaN(departure) && departure > arrival) {
          node.dwellHours = this.roundToOneDecimal(
            (departure - arrival) / (1000 * 60 * 60)
          );
        }
      }
    }

    return portMap;
  }

  private findPreviousActual(events: ShipmentEvent[], index: number): ShipmentEvent | null {
    for (let i = index - 1; i >= 0; i--) {
      const candidate = events[i];
      if (candidate.actualTime) {
        return candidate;
      }
    }
    return null;
  }

  private predictDelayHours(
    baseGapHours: number,
    dwellHours: number,
    providerPriority: number
  ): { delayHours: number; confidence: number } {
    return tf.tidy(() => {
      const input = tf.tensor2d([
        [
          this.normalize(baseGapHours, 96),
          this.normalize(dwellHours, 72),
          this.normalize(providerPriority, 5),
        ],
      ]);

      const output = this.model.predict(input) as tf.Tensor;
      const raw = output.dataSync()[0];
      const delayHours = Math.max(0, raw * 12);
      const confidence = this.clamp(0.35, 0.95, 0.55 + raw * 0.5);

      return { delayHours, confidence: this.roundToTwoDecimals(confidence) };
    });
  }

  private buildHeuristicModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 1,
        inputShape: [3],
        useBias: true,
        activation: 'linear',
      })
    );

    const dense = model.layers[0];
    const weights = tf.tensor2d([[0.08], [0.35], [0.12]]);
    const bias = tf.tensor1d([0.05]);
    dense.setWeights([weights, bias]);
    return model;
  }

  private getRiskLevel(delayHours: number): AiPrediction['riskLevel'] {
    if (delayHours > 6) return 'high';
    if (delayHours > 2) return 'medium';
    return 'low';
  }

  private normalize(value: number, max: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value / max));
  }

  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
