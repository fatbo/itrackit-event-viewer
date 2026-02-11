import { I18nService } from './i18n.service';

describe('I18nService', () => {
  it('returns Traditional Chinese translations when locale is switched', () => {
    const service = new I18nService();

    service.setLocale('zh-Hant');

    expect(service.t('app.loadData')).toBe('載入資料');
    expect(service.getTimeTypeLabel('A')).toBe('實際');
  });

  it('returns shipment type labels in English', () => {
    const service = new I18nService();

    expect(service.getShipmentTypeLabel('IM')).toBe('Import');
    expect(service.getShipmentTypeLabel('EX')).toBe('Export');
    expect(service.getShipmentTypeLabel('TS')).toBe('Transhipment');
  });

  it('returns shipment type labels in Traditional Chinese', () => {
    const service = new I18nService();
    service.setLocale('zh-Hant');

    expect(service.getShipmentTypeLabel('IM')).toBe('進口');
    expect(service.getShipmentTypeLabel('EX')).toBe('出口');
    expect(service.getShipmentTypeLabel('TS')).toBe('轉運');
  });
});
