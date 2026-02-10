import { I18nService } from './i18n.service';

describe('I18nService', () => {
  it('returns Traditional Chinese translations when locale is switched', () => {
    const service = new I18nService();

    service.setLocale('zh-Hant');

    expect(service.t('app.loadData')).toBe('載入資料');
    expect(service.getTimeTypeLabel('A')).toBe('實際');
  });
});
