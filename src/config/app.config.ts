export const currency = '$';

export const CurrencySymbolCode: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'CNY',
  HK$: 'HKD',
  S$: 'SGD',
  '₩': 'KRW',
  '₹': 'INR',
  '₺': 'TRY',
  AUD: 'AUD',
  JPY: 'JPY',
};

export const PaymentMethod: ('stripe' | 'paypal')[] = ['stripe', 'paypal'];
export const siteTitle = 'Carto Store';
