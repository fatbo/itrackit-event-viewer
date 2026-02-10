import { Injectable, signal } from '@angular/core';

export type Locale = 'en' | 'zh-Hant';

type TranslationParams = Record<string, string | number>;

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    'app.title': 'iTrackiT Shipment Viewer',
    'app.subtitle': 'Ocean Shipment Event Timeline Viewer',
    'app.loadData': 'Load Data',
    'app.language': 'Language',
    'app.languageEnglish': 'English',
    'app.languageChinese': 'Traditional Chinese',
    'app.footer': '© 2026 iTrackiT Shipment Viewer - Support Tool for Ocean Shipment Tracking',
    'input.title': 'Shipment Event Input',
    'input.close': 'Close',
    'input.demoMode': 'Demo Mode:',
    'input.demoDescription': "You're viewing sample shipment data below.",
    'input.clearDemo': 'Clear Demo',
    'input.usageTitle': 'How to Use',
    'input.usageLoadTitle': 'Load Your Data:',
    'input.usageLoadDescription': 'Paste JSON or upload a file below',
    'input.usageCompareTitle': 'Compare:',
    'input.usageCompareDescription':
      'Toggle to "Secondary Event" for side-by-side comparison',
    'input.usageFormatsTitle': 'Formats:',
    'input.usageFormatsDescription': 'OpShipmentEventRaw (OpenAPI) or ShipmentData',
    'input.togglePrimary': 'Primary Event',
    'input.toggleSecondary': 'Secondary Event (for comparison)',
    'input.pasteTitle': 'Paste JSON Data',
    'input.pastePlaceholder': 'Paste your shipment event JSON here...',
    'input.loadJson': 'Load JSON',
    'input.divider': 'OR',
    'input.uploadTitle': 'Upload JSON File',
    'input.clearAll': 'Clear All',
    'input.error.readFile': 'Error reading file',
    'input.error.invalidFormat':
      'Invalid shipment data format. Please provide either OpShipmentEventRaw or ShipmentData format.',
    'input.error.noEvents': 'Invalid shipment data: no events found',
    'input.error.invalidJson':
      'Invalid JSON format. Please check your JSON syntax and try again.',
    'summary.title': 'Shipment Summary',
    'summary.indicator.reeferLabel': 'REEFER',
    'summary.indicator.reeferTitle': 'Reefer Container',
    'summary.indicator.dangerousGoods': 'Contains Dangerous Goods',
    'summary.indicator.damage': 'Damage Reported',
    'summary.label.shipmentStatus': 'Shipment Status:',
    'summary.label.shipmentId': 'Shipment ID:',
    'summary.label.blNumber': 'BL Number:',
    'summary.label.bookingNumber': 'Booking Number:',
    'summary.label.containerNumber': 'Container Number:',
    'summary.label.containerSizeType': 'Container Size/Type:',
    'summary.label.containerIsoCode': 'Container ISO Code:',
    'summary.label.shipmentType': 'Shipment Type:',
    'summary.label.shippingLine': 'Shipping Line:',
    'summary.label.originPol': 'Origin (POL):',
    'summary.label.destinationPod': 'Destination (POD):',
    'summary.label.sealNumbers': 'Seal Numbers:',
    'summary.label.dangerousGoods': 'Dangerous Goods (DG):',
    'summary.label.damages': 'Damages (DMG):',
    'summary.label.reeferInfo': 'Reefer Information:',
    'summary.label.reeferRequiredTemp': 'Required Temp:',
    'summary.label.reeferReadingTemp': 'Reading Temp:',
    'summary.label.reeferReadingTime': 'Reading Time:',
    'summary.label.reeferAlert': 'Temperature difference detected',
    'summary.label.source': 'Source:',
    'summary.label.totalEvents': 'Total Events:',
    'summary.label.firstEvent': 'First Event:',
    'summary.label.latestEvent': 'Latest Event:',
    'summary.noData':
      'No shipment data loaded. Please paste or upload JSON data above.',
    'status.unavailable.label': 'Status Unavailable',
    'status.unavailable.description': 'No event data has been loaded yet.',
    'status.completed.label': 'Completed',
    'status.completed.description': 'Actual gate in/out recorded at the port of discharge.',
    'status.hkCompleted.label': 'Completed (Hong Kong Only)',
    'status.hkCompleted.description':
      'Actual vessel departure recorded in Hong Kong with no other actual ports.',
    'status.inTransit.label': 'In Transit',
    'status.inTransit.description':
      'Awaiting an actual gate event at POD or an actual Hong Kong departure.',
    'timeline.title': 'Event Timeline',
    'timeline.portTransition': 'Port Transition',
    'timeline.arrivalShort': 'Arr',
    'timeline.departureShort': 'Dep',
    'timeline.indexAria': 'Timeline index',
    'timeline.indexLabel': 'Index',
    'timeline.detail.location': 'Location:',
    'timeline.detail.eventCode': 'Event Code:',
    'timeline.detail.locationType': 'Location Type:',
    'timeline.detail.transportMode': 'Transport Mode:',
    'timeline.detail.vessel': 'Vessel:',
    'timeline.detail.voyage': 'Voyage:',
    'timeline.detail.containerStatus': 'Container Status:',
    'timeline.detail.status': 'Status:',
    'timeline.detail.facility': 'Facility:',
    'timeline.detail.dataProvider': 'Data Provider:',
    'timeline.unscheduledTitle': 'Unscheduled Events',
    'timeline.unscheduledHint': 'These events have no associated date/time.',
    'timeline.noEvents': 'No events found in the shipment data.',
    'comparison.title': 'Event Comparison',
    'comparison.keyDifferences': 'Key Differences',
    'comparison.noDifferences': '✓ No major differences detected between the two shipments.',
    'comparison.primaryHeader': 'Primary Event',
    'comparison.secondaryHeader': 'Secondary Event',
    'comparison.label.shipmentId': 'Shipment ID:',
    'comparison.label.containerSize': 'Container Size:',
    'comparison.label.containerType': 'Container Type:',
    'comparison.label.containerWeight': 'Container Weight:',
    'comparison.label.origin': 'Origin:',
    'comparison.label.destination': 'Destination:',
    'comparison.label.totalEvents': 'Total Events:',
    'comparison.noComparison':
      'Load a secondary event to enable comparison. Use the toggle button in the input section above to switch to "Secondary Event".',
    'comparison.eventCount': 'Event Count: {primary} vs {secondary}',
    'comparison.fieldDifference': '{label}: "{primary}" vs "{secondary}"',
    'comparison.eventMissingSecondary': 'Event {label} missing in secondary shipment',
    'comparison.eventMissingPrimary': 'Event {label} missing in primary shipment',
    'comparison.eventTimeDiff':
      'Event {label} {timeLabel} time: "{primary}" vs "{secondary}"',
    'comparison.eventTimeDiffFallback': 'Event {label} time: "{primary}" vs "{secondary}"',
    'comparison.unknownEvent': 'Unknown',
    'time.actual': 'Actual',
    'time.estimated': 'Estimated',
    'time.planned': 'Planned',
    'parser.containerStatus': '({status} container)',
    'parser.via': 'via {mode}',
    'parser.atLocation': 'at {location}',
    'parser.timeDetails': '- {details}',
    'parser.equipmentEvent': 'Equipment event',
    'parser.transportEvent': 'Transport event',
    'parser.containerStatusFormat': '{status} - {timeType}',
  },
  'zh-Hant': {
    'app.title': 'iTrackiT 貨運檢視器',
    'app.subtitle': '海運貨件事件時間軸檢視器',
    'app.loadData': '載入資料',
    'app.language': '語言',
    'app.languageEnglish': '英文',
    'app.languageChinese': '繁體中文',
    'app.footer': '© 2026 iTrackiT 貨運檢視器 - 海運貨件追蹤支援工具',
    'input.title': '貨運事件輸入',
    'input.close': '關閉',
    'input.demoMode': '示範模式：',
    'input.demoDescription': '您正在查看以下的範例貨運資料。',
    'input.clearDemo': '清除示範',
    'input.usageTitle': '使用說明',
    'input.usageLoadTitle': '載入您的資料：',
    'input.usageLoadDescription': '在下方貼上 JSON 或上傳檔案',
    'input.usageCompareTitle': '比較：',
    'input.usageCompareDescription': '切換至「次要事件」以進行並排比較',
    'input.usageFormatsTitle': '格式：',
    'input.usageFormatsDescription': 'OpShipmentEventRaw（OpenAPI）或 ShipmentData',
    'input.togglePrimary': '主要事件',
    'input.toggleSecondary': '次要事件（用於比較）',
    'input.pasteTitle': '貼上 JSON 資料',
    'input.pastePlaceholder': '在此貼上您的貨運事件 JSON...',
    'input.loadJson': '載入 JSON',
    'input.divider': '或',
    'input.uploadTitle': '上傳 JSON 檔案',
    'input.clearAll': '全部清除',
    'input.error.readFile': '讀取檔案時發生錯誤',
    'input.error.invalidFormat': '貨運資料格式無效。請提供 OpShipmentEventRaw 或 ShipmentData 格式。',
    'input.error.noEvents': '貨運資料無效：未找到事件',
    'input.error.invalidJson': 'JSON 格式無效。請檢查語法後再試。',
    'summary.title': '貨運摘要',
    'summary.indicator.reeferLabel': '冷凍櫃',
    'summary.indicator.reeferTitle': '冷凍貨櫃',
    'summary.indicator.dangerousGoods': '包含危險品',
    'summary.indicator.damage': '已回報損壞',
    'summary.label.shipmentStatus': '貨運狀態：',
    'summary.label.shipmentId': '貨運 ID：',
    'summary.label.blNumber': '提單號碼：',
    'summary.label.bookingNumber': '訂艙號碼：',
    'summary.label.containerNumber': '貨櫃號碼：',
    'summary.label.containerSizeType': '貨櫃尺寸/類型：',
    'summary.label.containerIsoCode': '貨櫃 ISO 代碼：',
    'summary.label.shipmentType': '貨運類型：',
    'summary.label.shippingLine': '船公司：',
    'summary.label.originPol': '起運港（POL）：',
    'summary.label.destinationPod': '目的港（POD）：',
    'summary.label.sealNumbers': '封條號碼：',
    'summary.label.dangerousGoods': '危險品（DG）：',
    'summary.label.damages': '損壞（DMG）：',
    'summary.label.reeferInfo': '冷凍櫃資訊：',
    'summary.label.reeferRequiredTemp': '需求溫度：',
    'summary.label.reeferReadingTemp': '讀取溫度：',
    'summary.label.reeferReadingTime': '讀取時間：',
    'summary.label.reeferAlert': '偵測到溫度差異',
    'summary.label.source': '資料來源：',
    'summary.label.totalEvents': '事件總數：',
    'summary.label.firstEvent': '第一個事件：',
    'summary.label.latestEvent': '最新事件：',
    'summary.noData': '尚未載入貨運資料。請在上方貼上或上傳 JSON 資料。',
    'status.unavailable.label': '狀態不可用',
    'status.unavailable.description': '尚未載入事件資料。',
    'status.completed.label': '已完成',
    'status.completed.description': '卸貨港已記錄實際閘口進出。',
    'status.hkCompleted.label': '已完成（僅香港）',
    'status.hkCompleted.description': '已記錄香港實際離港，且無其他實際港口紀錄。',
    'status.inTransit.label': '運輸中',
    'status.inTransit.description': '等待卸貨港實際閘口事件或香港實際離港。',
    'timeline.title': '事件時間軸',
    'timeline.portTransition': '港口轉換',
    'timeline.arrivalShort': '抵',
    'timeline.departureShort': '離',
    'timeline.indexAria': '時間軸索引',
    'timeline.indexLabel': '索引',
    'timeline.detail.location': '地點：',
    'timeline.detail.eventCode': '事件代碼：',
    'timeline.detail.locationType': '地點類型：',
    'timeline.detail.transportMode': '運輸方式：',
    'timeline.detail.vessel': '船名：',
    'timeline.detail.voyage': '航次：',
    'timeline.detail.containerStatus': '貨櫃狀態：',
    'timeline.detail.status': '狀態：',
    'timeline.detail.facility': '設施：',
    'timeline.detail.dataProvider': '資料提供者：',
    'timeline.unscheduledTitle': '未排程事件',
    'timeline.unscheduledHint': '這些事件沒有對應的日期/時間。',
    'timeline.noEvents': '貨運資料中沒有事件。',
    'comparison.title': '事件比較',
    'comparison.keyDifferences': '主要差異',
    'comparison.noDifferences': '✓ 兩筆貨運資料未偵測到重大差異。',
    'comparison.primaryHeader': '主要事件',
    'comparison.secondaryHeader': '次要事件',
    'comparison.label.shipmentId': '貨運 ID：',
    'comparison.label.containerSize': '貨櫃尺寸：',
    'comparison.label.containerType': '貨櫃類型：',
    'comparison.label.containerWeight': '貨櫃重量：',
    'comparison.label.origin': '起運港：',
    'comparison.label.destination': '目的港：',
    'comparison.label.totalEvents': '事件總數：',
    'comparison.noComparison':
      '載入次要事件以啟用比較。請在上方輸入區使用切換按鈕切換到「次要事件」。',
    'comparison.eventCount': '事件數量：{primary} vs {secondary}',
    'comparison.fieldDifference': '{label}：「{primary}」vs「{secondary}」',
    'comparison.eventMissingSecondary': '次要貨運缺少事件 {label}',
    'comparison.eventMissingPrimary': '主要貨運缺少事件 {label}',
    'comparison.eventTimeDiff': '事件 {label}{timeLabel}時間：「{primary}」vs「{secondary}」',
    'comparison.eventTimeDiffFallback': '事件 {label}時間：「{primary}」vs「{secondary}」',
    'comparison.unknownEvent': '未知',
    'time.actual': '實際',
    'time.estimated': '預計',
    'time.planned': '計劃',
    'parser.containerStatus': '（{status} 貨櫃）',
    'parser.via': '經由{mode}',
    'parser.atLocation': '於{location}',
    'parser.timeDetails': '－{details}',
    'parser.equipmentEvent': '貨櫃事件',
    'parser.transportEvent': '運輸事件',
    'parser.containerStatusFormat': '{status} - {timeType}',
  },
};

const MAP_TRANSLATIONS: Record<
  Locale,
  {
    timeType: Record<string, string>;
    containerStatus: Record<string, string>;
    eventCode: Record<string, string>;
    locationType: Record<string, string>;
  }
> = {
  en: {
    timeType: {
      A: 'Actual',
      E: 'Estimated',
      G: 'Planned',
    },
    containerStatus: {
      F: 'Full',
      E: 'Empty',
    },
    eventCode: {
      OG: 'Gate Out',
      IG: 'Gate In',
      AE: 'Arrived at Export',
      VD: 'Vessel Departure',
      VA: 'Vessel Arrival',
      UV: 'Unloaded from Vessel',
      AL: 'Loaded on Vessel',
      UR: 'Unloaded from Rail',
      RD: 'Rail Departure',
      RA: 'Rail Arrival',
      TA: 'Truck Arrival',
      CT: 'Container Terminal',
      RT: 'Return to Terminal',
      SS: 'Shipment Status',
      ZZ: 'Other',
      PD: 'Port Discharge',
    },
    locationType: {
      POL: 'Port of Loading',
      POD: 'Port of Discharge',
      POT: 'Port of Transhipment',
      POC: 'Port of Call',
    },
  },
  'zh-Hant': {
    timeType: {
      A: '實際',
      E: '預計',
      G: '計劃',
    },
    containerStatus: {
      F: '滿載',
      E: '空櫃',
    },
    eventCode: {
      OG: '閘口出場',
      IG: '閘口進場',
      AE: '到達出口',
      VD: '船舶離港',
      VA: '船舶到港',
      UV: '卸船',
      AL: '裝船',
      UR: '卸鐵路',
      RD: '鐵路出發',
      RA: '鐵路到達',
      TA: '卡車到達',
      CT: '貨櫃碼頭',
      RT: '返回碼頭',
      SS: '貨運狀態',
      ZZ: '其他',
      PD: '卸貨港卸貨',
    },
    locationType: {
      POL: '裝貨港',
      POD: '卸貨港',
      POT: '轉運港',
      POC: '停靠港',
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  readonly locale = signal<Locale>('en');

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  localeTag(): string {
    return this.locale() === 'zh-Hant' ? 'zh-Hant-TW' : 'en-US';
  }

  t(key: string, params?: TranslationParams): string {
    const locale = this.locale();
    const translation =
      TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
    if (!params) {
      return translation;
    }
    return Object.entries(params).reduce(
      (result, [param, value]) =>
        result.replaceAll(`{${param}}`, String(value)),
      translation
    );
  }

  getTimeTypeLabel(timeType: string): string {
    return this.getMapValue('timeType', timeType);
  }

  getContainerStatusLabel(containerStatus: string): string {
    return this.getMapValue('containerStatus', containerStatus);
  }

  getEventCodeLabel(eventCode: string): string {
    return this.getMapValue('eventCode', eventCode);
  }

  getLocationTypeLabel(locationType: string): string {
    return this.getMapValue('locationType', locationType);
  }

  private getMapValue(
    mapKey: keyof (typeof MAP_TRANSLATIONS)['en'],
    value: string
  ): string {
    const locale = this.locale();
    return (
      MAP_TRANSLATIONS[locale]?.[mapKey]?.[value] ??
      MAP_TRANSLATIONS.en[mapKey]?.[value] ??
      value
    );
  }
}
