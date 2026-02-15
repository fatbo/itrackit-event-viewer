import { AiInsightsService } from './ai-insights.service';
import { ShipmentData } from '../models/shipment-event.model';

describe('AiInsightsService', () => {
  it('enriches shipments with predicted times and risk metadata', () => {
    const service = new AiInsightsService();
    const shipment: ShipmentData = {
      events: [
        {
          eventType: 'Gate In',
          eventDateTime: '2026-01-05T09:00:00Z',
          description: '',
          eventCode: 'IG',
          locationType: 'POL',
          timeType: 'A',
          actualTime: '2026-01-05T09:00:00Z',
          unLocationCode: 'CNYTN',
        },
        {
          eventType: 'Unloaded',
          eventDateTime: '2026-01-10T10:00:00Z',
          description: '',
          eventCode: 'UV',
          locationType: 'POD',
          timeType: 'E',
          estimatedTime: '2026-01-10T10:00:00Z',
          unLocationCode: 'NLRTM',
        },
      ],
      transportEvents: [],
    };

    const enriched = service.enrichShipment(shipment);
    const predictedEvent = enriched.events?.find((e) => e.eventCode === 'UV');

    expect(enriched.aiInsights?.modelVersion).toBeTruthy();
    expect(predictedEvent?.aiPrediction).toBeTruthy();
    expect(predictedEvent?.aiPrediction?.predictedTime).toBeTruthy();
    expect(['low', 'medium', 'high']).toContain(
      predictedEvent?.aiPrediction?.riskLevel
    );
  });
});
