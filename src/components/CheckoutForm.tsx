import {
  PayPalCardFieldsProvider,
  PayPalCVVField,
  PayPalExpiryField,
  PayPalNumberField,
  PayPalScriptProvider,
  usePayPalCardFields,
} from '@paypal/react-paypal-js';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  loadStripe,
  type Stripe,
  type StripeCardNumberElement,
  type StripeElementsOptions,
} from '@stripe/stripe-js';
import {
  Component,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';

/* ---- React Error Boundary ---- */
class CheckoutErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message || String(error) };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[CheckoutForm] Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px',
            background: '#fff',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            margin: '20px',
          }}
        >
          <h2
            style={{ color: '#dc2626', fontSize: '20px', fontWeight: 'bold' }}
          >
            Checkout Render Error
          </h2>
          <pre
            style={{
              background: '#fef2f2',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '13px',
              marginTop: '12px',
              overflow: 'auto',
            }}
          >
            {this.state.errorMsg}
          </pre>
          <button
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { MuiSelectField, MuiTextField } from '@/components/MuiField';
import type {
  ICheckout,
  ICart,
  ICustomerInfo,
  IBillingInfo,
  IShippingInfo,
} from '@/types/app.type';
import { getSubTotal, formatPrice } from '@/lib/app';
import {
  PaymentMethod as PaymentMethodConfig,
  currency,
  CurrencySymbolCode,
} from '@/config/app.config';
import { setLs, getLs } from '@/lib/storage';
import type { AddressAutofillRetrieveResponse } from '@mapbox/search-js-core';

/* ================================================================
   Types
   ================================================================ */

type CheckoutState =
  'editing' | 'creating' | 'ready' | 'capturing' | 'complete';
type UIPaymentMethod = 'stripe' | 'paypal' | 'paypal-card';
type AddressAutofillComponentType = ComponentType<
  Record<string, unknown> & { children?: ReactNode }
>;

interface AddressFields {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CheckoutFormFields {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CartItem {
  skuId: string;
  productSlug?: string;
  apiSku?: string;
  skuName: string;
  quantity: number;
  price: number;
  originalPrice?: number;
}

/* ================================================================
   Props
   ================================================================ */

interface CheckoutFormProps {
  /** Cart items from $checkout store */
  cartItems: CartItem[];
  /** Total amount in cents */
  subtotal: number;
  /** PayPal client ID */
  paypalClientId: string;
  paypalCaptureMethod: 'manual' | 'automatic';
  /** Whether PayPal card fields are enabled */
  paypalCardEnabled: boolean;
  /** Stripe publishable key, empty string if not available */
  stripePublishableKey: string;
  /** Mapbox access token for address autocomplete */
  mapboxAccessToken: string;
  /** Payment configuration error message */
  paymentConfigError: string;
  /** Countries configured by the checkout-content block */
  countries: CountryOption[];
}

/* ================================================================
   Constants
   ================================================================ */

const CHECKOUT_FORM_STORAGE_KEY = 'cad-offer:checkout-form:v1';

const EMPTY_ADDRESS: AddressFields = {
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
};

const EMPTY_FORM: CheckoutFormFields = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  ...EMPTY_ADDRESS,
};

const VISA_CARD_STYLE = {
  input: {
    height: '44px',
    padding: '0 12px',
    'font-size': '16px',
    'line-height': '44px',
  },
} as Record<string, Record<string, string>>;

const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1A1A1A',
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      lineHeight: '42px',
      '::placeholder': { color: '#9E9E9E' },
    },
    invalid: { color: '#E02020' },
  },
  hidePostalCode: true,
};

/* ================================================================
   Country / Region Data
   ================================================================ */

const REGION_CODE_MAP: Record<string, Record<string, string>> = {
  US: {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
    'District of Columbia': 'DC',
  },
  CA: {
    Alberta: 'AB',
    'British Columbia': 'BC',
    Manitoba: 'MB',
    'New Brunswick': 'NB',
    'Newfoundland and Labrador': 'NL',
    'Northwest Territories': 'NT',
    'Nova Scotia': 'NS',
    Nunavut: 'NU',
    Ontario: 'ON',
    'Prince Edward Island': 'PE',
    Quebec: 'QC',
    Saskatchewan: 'SK',
    Yukon: 'YT',
  },
  AU: {
    'Australian Capital Territory': 'ACT',
    'New South Wales': 'NSW',
    'Northern Territory': 'NT',
    Queensland: 'QLD',
    'South Australia': 'SA',
    Tasmania: 'TAS',
    Victoria: 'VIC',
    'Western Australia': 'WA',
  },
};

export interface CountryOption {
  code: string;
  name: string;
  regions?: string[];
}

const DEFAULT_COUNTRIES: CountryOption[] = [
  {
    code: 'US',
    name: 'United States',
    regions: [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'California',
      'Colorado',
      'Connecticut',
      'Delaware',
      'Florida',
      'Georgia',
      'Hawaii',
      'Idaho',
      'Illinois',
      'Indiana',
      'Iowa',
      'Kansas',
      'Kentucky',
      'Louisiana',
      'Maine',
      'Maryland',
      'Massachusetts',
      'Michigan',
      'Minnesota',
      'Mississippi',
      'Missouri',
      'Montana',
      'Nebraska',
      'Nevada',
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
      'North Carolina',
      'North Dakota',
      'Ohio',
      'Oklahoma',
      'Oregon',
      'Pennsylvania',
      'Rhode Island',
      'South Carolina',
      'South Dakota',
      'Tennessee',
      'Texas',
      'Utah',
      'Vermont',
      'Virginia',
      'Washington',
      'West Virginia',
      'Wisconsin',
      'Wyoming',
      'District of Columbia',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    regions: [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Northwest Territories',
      'Nova Scotia',
      'Nunavut',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
      'Yukon',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  },
  {
    code: 'AU',
    name: 'Australia',
    regions: [
      'Australian Capital Territory',
      'New South Wales',
      'Northern Territory',
      'Queensland',
      'South Australia',
      'Tasmania',
      'Victoria',
      'Western Australia',
    ],
  },
];

/* ================================================================
   Utility functions
   ================================================================ */

function toRegionCode(countryCode: string, regionName: string): string {
  return REGION_CODE_MAP[countryCode]?.[regionName] || regionName;
}

function normalizeRegion(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function matchRegion(regions: readonly string[], value: string) {
  const normalizedValue = normalizeRegion(value);
  if (!normalizedValue) return '';
  return (
    regions.find((region) => normalizeRegion(region) === normalizedValue) ??
    regions.find(
      (region) =>
        normalizeRegion(region).includes(normalizedValue) ||
        normalizedValue.includes(normalizeRegion(region)),
    ) ??
    ''
  );
}

function friendlyError(caught: unknown): string {
  if (!caught) return 'An unexpected error occurred. Please try again.';

  const message = caught instanceof Error ? caught.message : String(caught);
  const lowered = message.toLowerCase();

  // Stripe errors
  if (lowered.includes('card_declined') || lowered.includes('card declined')) {
    return 'Your card was declined. Please try a different card or contact your bank.';
  }
  if (lowered.includes('expired_card') || lowered.includes('card expired')) {
    return 'Your card has expired. Please use a different card.';
  }
  if (lowered.includes('incorrect_cvc') || lowered.includes('incorrect_cvc')) {
    return 'The security code (CVC) is incorrect. Please check and try again.';
  }
  if (lowered.includes('insufficient_funds')) {
    return 'Your card has insufficient funds. Please try a different card.';
  }

  // PayPal errors
  if (
    lowered.includes('instrument_declined') ||
    lowered.includes('payment_source_info_cannot_be_verified')
  ) {
    return 'This payment method was declined. Please try a different card or payment option.';
  }
  if (lowered.includes('payer_cannot_pay')) {
    return 'Your PayPal account is unable to complete this payment. Please contact PayPal or use a different method.';
  }
  if (lowered.includes('card_expired')) {
    return 'Your card has expired. Please use a different card.';
  }
  if (lowered.includes('unsupported_currency')) {
    return 'This payment method does not support the required currency.';
  }
  if (lowered.includes('unprocessable_entity')) {
    if (lowered.includes('card') || lowered.includes('payment_source')) {
      return 'Your card could not be processed. Please use a different card or try another payment method.';
    }
    return 'The payment could not be completed. Please verify your information and try again.';
  }

  // Network errors
  if (
    lowered.includes('network') ||
    lowered.includes('fetch') ||
    lowered.includes('failed to fetch')
  ) {
    return 'A network error occurred. Please check your connection and try again.';
  }

  // Validation errors
  if (lowered.includes('validation failed') || lowered.includes('required')) {
    return 'Please complete all required fields before proceeding.';
  }

  // Generic
  if (message.length > 200) {
    return 'An error occurred while processing your payment. Please try again.';
  }
  return message || 'An unexpected error occurred. Please try again.';
}

async function postLocal<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    success: boolean;
    data: T;
    error?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error || `Request failed with status ${response.status}`,
    );
  }

  return payload.data;
}

function mergeStoredForm(
  value: unknown,
  countries: CountryOption[],
): CheckoutFormFields {
  if (!value || typeof value !== 'object') return EMPTY_FORM;
  const stored = value as Partial<Record<keyof CheckoutFormFields, unknown>>;
  const country =
    typeof stored.country === 'string' &&
    countries.some((item) => item.code === stored.country)
      ? stored.country
      : countries[0]?.code || EMPTY_FORM.country;

  return {
    email: typeof stored.email === 'string' ? stored.email : EMPTY_FORM.email,
    phone: typeof stored.phone === 'string' ? stored.phone : EMPTY_FORM.phone,
    firstName:
      typeof stored.firstName === 'string'
        ? stored.firstName
        : EMPTY_FORM.firstName,
    lastName:
      typeof stored.lastName === 'string'
        ? stored.lastName
        : EMPTY_FORM.lastName,
    address1:
      typeof stored.address1 === 'string'
        ? stored.address1
        : EMPTY_FORM.address1,
    address2:
      typeof stored.address2 === 'string'
        ? stored.address2
        : EMPTY_FORM.address2,
    city: typeof stored.city === 'string' ? stored.city : EMPTY_FORM.city,
    state: typeof stored.state === 'string' ? stored.state : EMPTY_FORM.state,
    postalCode:
      typeof stored.postalCode === 'string'
        ? stored.postalCode
        : EMPTY_FORM.postalCode,
    country,
  };
}

function mergeStoredAddress(
  value: unknown,
  countries: CountryOption[],
): AddressFields {
  if (!value || typeof value !== 'object') return EMPTY_ADDRESS;
  const stored = value as Partial<Record<keyof AddressFields, unknown>>;
  const country =
    typeof stored.country === 'string' &&
    countries.some((item) => item.code === stored.country)
      ? stored.country
      : countries[0]?.code || EMPTY_ADDRESS.country;

  return {
    address1:
      typeof stored.address1 === 'string'
        ? stored.address1
        : EMPTY_ADDRESS.address1,
    address2:
      typeof stored.address2 === 'string'
        ? stored.address2
        : EMPTY_ADDRESS.address2,
    city: typeof stored.city === 'string' ? stored.city : EMPTY_ADDRESS.city,
    state:
      typeof stored.state === 'string' ? stored.state : EMPTY_ADDRESS.state,
    postalCode:
      typeof stored.postalCode === 'string'
        ? stored.postalCode
        : EMPTY_ADDRESS.postalCode,
    country,
  };
}

/* ================================================================
   SVG Payment Logos
   ================================================================ */

function VisaLogo() {
  return (
    <svg
      className="payment-card-logo"
      width="36"
      height="24"
      viewBox="0 0 36 24"
      fill="none"
      aria-label="Visa"
    >
      <rect width="36" height="24" rx="3" fill="#1a1f71" />
      <text
        x="4"
        y="16"
        fontSize="10"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg
      className="payment-card-logo"
      width="36"
      height="24"
      viewBox="0 0 36 24"
      fill="none"
      aria-label="Mastercard"
    >
      <rect width="36" height="24" rx="3" fill="#231f20" />
      <circle cx="14" cy="12" r="7" fill="#eb001b" />
      <circle cx="22" cy="12" r="7" fill="#f79e1b" fillOpacity="0.85" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg
      className="payment-card-logo"
      width="36"
      height="24"
      viewBox="0 0 36 24"
      fill="none"
      aria-label="American Express"
    >
      <rect width="36" height="24" rx="3" fill="#007bc1" />
      <text
        x="3"
        y="16"
        fontSize="10"
        fontWeight="900"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        AMEX
      </text>
    </svg>
  );
}

/* ================================================================
   Main CheckoutForm Component
   ================================================================ */

export default function CheckoutForm({
  cartItems,
  subtotal,
  paypalClientId,
  paypalCaptureMethod,
  paypalCardEnabled,
  stripePublishableKey,
  mapboxAccessToken,
  paymentConfigError,
  countries,
}: CheckoutFormProps) {
  const configuredCountries = useMemo(() => {
    const normalized = countries.flatMap((country) => {
      const fallback = DEFAULT_COUNTRIES.find(
        (item) => item.code === country.code,
      );
      return country.code && country.name
        ? [{ ...country, regions: country.regions ?? fallback?.regions ?? [] }]
        : [];
    });
    return normalized.length ? normalized : DEFAULT_COUNTRIES;
  }, [countries]);
  const [themeColors, setThemeColors] = useState({
    primary: '#0273b5',
    foreground: '#1a1a1a',
    background: '#ffffff',
  });

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setThemeColors({
      primary: styles.getPropertyValue('--primary').trim() || '#0273b5',
      foreground: styles.getPropertyValue('--foreground').trim() || '#1a1a1a',
      background: styles.getPropertyValue('--background').trim() || '#ffffff',
    });
  }, []);

  /* ---- Available payment methods ---- */
  const canUseStripe =
    Boolean(stripePublishableKey) && PaymentMethodConfig.includes('stripe');
  const canUsePayPalWallet =
    Boolean(paypalClientId) && PaymentMethodConfig.includes('paypal');
  const canUsePayPalCard = Boolean(paypalClientId) && paypalCardEnabled;
  const cardFieldsEligible = canUsePayPalCard;
  const hasPaymentConfigError = Boolean(
    paymentConfigError && !canUseStripe && !canUsePayPalWallet,
  );

  const hasMultipleCardProviders = Boolean(canUseStripe && canUsePayPalCard);

  // Determine default payment method
  const getDefaultPaymentMethod = (): UIPaymentMethod => {
    if (canUseStripe) return 'stripe';
    if (canUsePayPalCard) return 'paypal-card';
    return 'stripe';
  };

  /* ---- Cart data (initialized from nanostore) ---- */
  const [resolvedCartItems, setResolvedCartItems] =
    useState<CartItem[]>(cartItems);
  const [resolvedSubtotal, setResolvedSubtotal] = useState(subtotal);

  // Initialize cart data from nanostore/localStorage on client mount
  useEffect(() => {
    try {
      // Try to restore checkout data from localStorage
      const checkout = getLs('checkout');
      if (checkout?.cart) {
        const cart = checkout.cart as ICart;
        const items: CartItem[] = [];

        if (cart.item) {
          const sku = cart.item.sku;
          items.push({
            skuId: cart.item.skuId,
            productSlug: sku?.productSlug,
            apiSku: sku?.apiSku,
            skuName: sku?.name || cart.item.skuId,
            quantity: cart.item.quantity || 1,
            price: sku?.price || 0,
            originalPrice: sku?.originalPrice,
          });
        }

        if (cart.items) {
          for (const ci of cart.items) {
            const sku = ci.sku;
            items.push({
              skuId: ci.skuId,
              productSlug: sku?.productSlug,
              apiSku: sku?.apiSku,
              skuName: sku?.name || ci.skuId,
              quantity: ci.quantity || 1,
              price: sku?.price || 0,
              originalPrice: sku?.originalPrice,
            });
          }
        }

        if (items.length > 0) {
          setResolvedCartItems(items);
          const total = getSubTotal(cart);
          if (total > 0) setResolvedSubtotal(total);
        }
      }
    } catch {
      // Use the server-provided data as fallback
    }
  }, []);

  /* ---- State ---- */
  const [state, setState] = useState<CheckoutState>('editing');
  const [paymentMethod, setPaymentMethod] = useState<UIPaymentMethod>(
    getDefaultPaymentMethod,
  );
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Shipping form
  const [form, setForm] = useState<CheckoutFormFields>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CHECKOUT_FORM_STORAGE_KEY) || 'null',
      );
      return mergeStoredForm(stored, configuredCountries);
    } catch {
      return EMPTY_FORM;
    }
  });

  // Billing form
  const [billingForm, setBillingForm] = useState<AddressFields>(() => {
    try {
      const raw = localStorage.getItem(CHECKOUT_FORM_STORAGE_KEY);
      if (!raw) {
        return {
          ...EMPTY_ADDRESS,
          country: configuredCountries[0]?.code || EMPTY_ADDRESS.country,
        };
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.billingAddress) {
        return mergeStoredAddress(parsed.billingAddress, configuredCountries);
      }
    } catch {
      /* ignore */
    }
    return EMPTY_ADDRESS;
  });

  const [billingAsShipping, setBillingAsShipping] = useState(true);

  // Order/payment refs
  const orderRef = useRef<{ orderNo: string; paymentId: string } | null>(null);
  const paymentRef = useRef<{
    provider: string;
    providerOrderId?: string;
    clientSecret?: string;
  } | null>(null);
  const stripeClientSecret = useRef<string>('');
  const paypalOrderIdRef = useRef<string | null>(null);
  const [stripeCardReady, setStripeCardReady] = useState(false);
  const [stripeSubmitting, setStripeSubmitting] = useState(false);
  const stripeCardRef = useRef<StripeCardNumberElement | null>(null);
  const stripeInstanceRef = useRef<Stripe | null>(null);

  // Order summary panel (mobile collapsible)
  // Mapbox address autofill
  const [AddressAutofillComponent, setAddressAutofillComponent] =
    useState<AddressAutofillComponentType | null>(null);

  // Lock form when preparing/capturing
  const detailsLocked = state === 'creating' || state === 'capturing';

  /* ---- Derived data ---- */
  const customerName = `${form.firstName} ${form.lastName}`.trim();
  const lineTotal = resolvedSubtotal;

  // Country options
  const countryOptions = useMemo(
    () => configuredCountries.map((c) => ({ label: c.name, value: c.code })),
    [configuredCountries],
  );

  const regionOptions = useMemo(() => {
    const country = configuredCountries.find((c) => c.code === form.country);
    return (country?.regions || []).map((r) => ({ label: r, value: r }));
  }, [configuredCountries, form.country]);

  const billingRegionOptions = useMemo(() => {
    const country = configuredCountries.find(
      (c) => c.code === billingForm.country,
    );
    return (country?.regions || []).map((r) => ({ label: r, value: r }));
  }, [billingForm.country, configuredCountries]);

  const activeBillingAddress = billingAsShipping
    ? {
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: toRegionCode(form.country, form.state),
        postalCode: form.postalCode,
        country: form.country,
      }
    : {
        address1: billingForm.address1,
        address2: billingForm.address2,
        city: billingForm.city,
        state: toRegionCode(billingForm.country, billingForm.state),
        postalCode: billingForm.postalCode,
        country: billingForm.country,
      };

  /* ---- localStorage persistence ---- */
  useEffect(() => {
    try {
      const toPersist = {
        ...form,
        billingAddress: billingForm,
        billingAsShipping,
      };
      localStorage.setItem(
        CHECKOUT_FORM_STORAGE_KEY,
        JSON.stringify(toPersist),
      );
    } catch {
      /* ignore quota errors */
    }
  }, [form, billingForm, billingAsShipping]);

  /* ---- Mapbox dynamic import ---- */
  useEffect(() => {
    if (!mapboxAccessToken) return;
    let mounted = true;
    import('@mapbox/search-js-react')
      .then((mod) => {
        if (mounted) {
          setAddressAutofillComponent(
            () =>
              mod.AddressAutofill as unknown as AddressAutofillComponentType,
          );
        }
      })
      .catch(() => {
        if (mounted) setAddressAutofillComponent(null);
      });
    return () => {
      mounted = false;
    };
  }, [mapboxAccessToken]);

  /* ---- Stripe initialization ---- */
  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) return null;
    if (typeof window === 'undefined') return null; // SSR: skip Stripe script loading
    return loadStripe(stripePublishableKey);
  }, [stripePublishableKey]);

  const stripeOptions: StripeElementsOptions = useMemo(
    () => ({
      mode: 'payment' as const,
      amount: resolvedSubtotal || 50, // minimum 50 cents to avoid Stripe validation error
      currency: CurrencySymbolCode[currency]?.toLowerCase() || 'usd',
      appearance: {
        theme: 'stripe' as const,
        variables: {
          borderRadius: '7px',
          colorPrimary: themeColors.primary,
          colorText: themeColors.foreground,
          colorBackground: themeColors.background,
        },
      },
    }),
    [resolvedSubtotal, themeColors],
  );

  /* ---- State machine helpers ---- */
  function handleDetailsChange() {
    if (state === 'ready') {
      orderRef.current = null;
      paymentRef.current = null;
      stripeClientSecret.current = '';
      paypalOrderIdRef.current = null;
      setState('editing');
    }
    setError('');
  }

  function updateField(field: keyof CheckoutFormFields, value: string) {
    handleDetailsChange();
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateBillingField(field: keyof AddressFields, value: string) {
    handleDetailsChange();
    setBillingForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateCountry(value: string) {
    updateField('country', value);
    updateField('state', '');
  }

  function updateBillingCountry(value: string) {
    updateBillingField('country', value);
    updateBillingField('state', '');
  }

  function validateDetails(): boolean {
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!form.address1.trim()) {
      setError('Please enter your address.');
      return false;
    }
    if (!form.city.trim() || !form.postalCode.trim()) {
      setError('Please enter your city and postal code.');
      return false;
    }
    if (!form.state) {
      setError('Please select your state/region.');
      return false;
    }
    return true;
  }

  /* ---- Build checkout data for API ---- */
  function buildCheckoutData(): ICheckout {
    const customerInfo: ICustomerInfo = {
      email: form.email,
      phone: form.phone.trim(),
      firstName: form.firstName,
      lastName: form.lastName,
    };

    const shippingInfo: IShippingInfo = {
      fullAddress: form.address1,
      address2: form.address2,
      city: form.city,
      state: form.state,
      zipCode: form.postalCode,
      country: form.country,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone.trim(),
    };

    const billingInfo: IBillingInfo = {
      fullAddress: activeBillingAddress.address1,
      address2: activeBillingAddress.address2,
      city: activeBillingAddress.city,
      state: activeBillingAddress.state,
      zipCode: activeBillingAddress.postalCode,
      country: activeBillingAddress.country,
      isSameAsShippingInfo: billingAsShipping,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone.trim(),
    };

    // Convert cart items for the API
    // 只使用 cart.item（单选 SKU），避免 item 和 items 重复导致金额翻倍
    const cart: ICart = {
      item: resolvedCartItems[0]
        ? {
            skuId: resolvedCartItems[0].skuId,
            quantity: resolvedCartItems[0].quantity,
            sku: {
              id: resolvedCartItems[0].skuId,
              name: resolvedCartItems[0].skuName,
              price: resolvedCartItems[0].price,
              productSlug: resolvedCartItems[0].productSlug,
              apiSku: resolvedCartItems[0].apiSku,
            },
          }
        : undefined,
    };

    return {
      cart,
      customerInfo,
      shippingInfo,
      billingInfo,
      isSameAsShippingAddress: billingAsShipping,
      paymentMethod: paymentMethod === 'stripe' ? 'stripe' : 'paypal',
    };
  }

  /* ================================================================
     Payment flow
     ================================================================ */

  async function preparePayment(method: UIPaymentMethod) {
    if (!validateDetails()) return;

    setError('');
    setState('creating');

    try {
      const checkout = buildCheckoutData();
      const provider = method === 'stripe' ? 'stripe' : 'paypal';
      const fundingSource = method === 'paypal-card' ? 'card' : method;

      const result = await postLocal<{
        orderNo: string;
        paymentId: string;
        clientSecret?: string;
        providerOrderId?: string;
      }>('/api/checkout/orders', {
        checkout: { ...checkout, paymentMethod: provider },
        paymentMethod: provider,
        fundingSource,
      });

      orderRef.current = {
        orderNo: result.orderNo,
        paymentId: result.paymentId,
      };
      paymentRef.current = {
        provider,
        providerOrderId: result.providerOrderId || result.paymentId,
        clientSecret: result.clientSecret,
      };

      if (result.clientSecret) {
        stripeClientSecret.current = result.clientSecret;
      }

      setState('ready');

      return result.providerOrderId || result.paymentId;
    } catch (caught) {
      setState('editing');
      setError(friendlyError(caught));
      throw caught;
    }
  }

  async function capturePayment(providerOrderId: string) {
    const currentOrder = orderRef.current;
    const currentPayment = paymentRef.current;
    if (!currentOrder || !currentPayment) {
      throw new Error('Order is not ready yet.');
    }

    setError('');
    setState('capturing');

    try {
      const updatedOrder = await postLocal<{
        orderNo: string;
        paymentStatus: 'authorized' | 'paid';
      }>('/api/checkout/capture', {
        orderNo: currentOrder.orderNo,
        provider: currentPayment.provider,
        providerOrderId,
      });

      setState('complete');

      // Clear checkout data and redirect
      setLs('checkout', {
        cart: undefined,
        shippingInfo: undefined,
        customerInfo: undefined,
        billingInfo: undefined,
      });

      window.location.href = `/orders/${encodeURIComponent(updatedOrder.orderNo)}?status=${updatedOrder.paymentStatus}`;
    } catch (caught) {
      orderRef.current = null;
      paymentRef.current = null;
      stripeClientSecret.current = '';
      setState('editing');
      setError(friendlyError(caught));
    }
  }

  async function submitStripePayment() {
    if (
      !validateDetails() ||
      !stripeInstanceRef.current ||
      !stripeCardRef.current
    )
      return;

    setStripeSubmitting(true);
    setError('');

    try {
      let clientSecret = stripeClientSecret.current;

      if (!clientSecret) {
        await preparePayment('stripe');
        clientSecret = stripeClientSecret.current;
      }

      if (!clientSecret) {
        throw new Error('Stripe did not return a payment client secret.');
      }

      const result = await stripeInstanceRef.current.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: stripeCardRef.current,
            billing_details: {
              address: {
                line1: activeBillingAddress.address1,
                line2: activeBillingAddress.address2 || undefined,
                city: activeBillingAddress.city,
                state: activeBillingAddress.state,
                postal_code: activeBillingAddress.postalCode,
                country: activeBillingAddress.country,
              },
              email: form.email,
              name: customerName,
              phone: form.phone.trim(),
            },
          },
        },
      );

      if (result.error) {
        throw new Error(result.error.message || 'Stripe payment failed.');
      }

      const paymentIntentId = result.paymentIntent?.id;
      if (!paymentIntentId) {
        throw new Error('Stripe did not return a PaymentIntent id.');
      }

      await capturePayment(paymentIntentId);
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setStripeSubmitting(false);
    }
  }

  /* ---- Stripe card ready handler ---- */
  const handleStripeReady = useCallback(
    (stripe: Stripe | null, card: StripeCardNumberElement | null) => {
      if (stripe && card) {
        stripeInstanceRef.current = stripe;
        stripeCardRef.current = card;
        setStripeCardReady(true);
      } else {
        setStripeCardReady(false);
      }
    },
    [],
  );

  /* ---- Mapbox autofill handlers ---- */
  function applyMapboxAddress(retrieved: AddressAutofillRetrieveResponse) {
    handleDetailsChange();
    const props = (retrieved as any).properties ?? retrieved;
    const features = (retrieved as any).features;
    const featureProps = features?.[0]?.properties;

    const propsSource = props || featureProps || {};

    setForm((prev) => ({
      ...prev,
      address1:
        propsSource.address_line1 || propsSource.address_line1 || prev.address1,
      address2: propsSource.address_line2 || prev.address2,
      city: propsSource.address_level2 || propsSource.place || prev.city,
      state:
        matchRegion(
          configuredCountries.find((c) => c.code === prev.country)?.regions ||
            [],
          propsSource.address_level1 || propsSource.region || '',
        ) || prev.state,
      postalCode:
        propsSource.postcode || propsSource.postal_code || prev.postalCode,
      country: configuredCountries.some(
        (country) =>
          country.code ===
          String(propsSource.country_code || prev.country).toUpperCase(),
      )
        ? String(propsSource.country_code || prev.country).toUpperCase()
        : prev.country,
    }));
  }

  /* ================================================================
     Render: Order Summary Panel
     ================================================================ */

  const renderOrderSummary = () => (
    <section className="checkout-order-panel box rounded-brand">
      <h3>Your Order</h3>

      <ul className="space-y-2">
        <li className="flex items-center gap-3 text-gray-400 font-rm text-sm border-b pb-2">
          <div className="flex-auto">Price</div>
          <div className="">Subtotal</div>
        </li>
        {resolvedCartItems.map((item) => {
          const itemOriginal = item.originalPrice || item.price;
          const itemSaving = itemOriginal - item.price;
          const itemDiscountPercent =
            itemOriginal > item.price
              ? Math.round((itemSaving / itemOriginal) * 100)
              : 0;
          const hasItemSaving = itemSaving > 0;
          return (
            <li key={item.skuId} className="flex items-center gap-3 text-sm">
              <div className="flex-auto">
                <div>{item.skuName}</div>
                <div>
                  {formatPrice(item.price)} × {item.quantity}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end uppercase gap-1 font-h">
                {hasItemSaving && (
                  <div className="text-secondary font-bold text-xl">
                    Save {itemDiscountPercent}%
                  </div>
                )}
                <div className="space-x-2">
                  {hasItemSaving && (
                    <span className="text-base relative font-bold text-gray-400">
                      {formatPrice(itemOriginal)}
                      <span className="absolute top-[50%] left-0 w-full h-[2px] z-10 bg-primary/50"></span>
                    </span>
                  )}
                  <span
                    className={
                      hasItemSaving
                        ? 'font-bold text-xl text-primary'
                        : 'font-bold text-xl text-price'
                    }
                  >
                    {formatPrice(item.price)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-between items-center text-sm text-gray-400 font-rm border-b pb-2">
        <span>Subtotal</span>
        <span className="font-h">{formatPrice(lineTotal)}</span>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-400 font-rm">
        <span>Total</span>
        <span className="text-primary text-2xl font-h font-bold">
          {formatPrice(lineTotal)}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">All prices in USD</p>
    </section>
  );

  /* ================================================================
     Render: Payment Method Accordion
     ================================================================ */

  const paymentControls = (
    <>
      <div className="payment-choice-box">
        {/* Stripe */}
        {canUseStripe && (
          <section
            className={
              paymentMethod === 'stripe'
                ? 'payment-choice is-active'
                : 'payment-choice'
            }
          >
            <button
              className="payment-choice-header"
              type="button"
              aria-expanded={paymentMethod === 'stripe'}
              onClick={() => setPaymentMethod('stripe')}
            >
              <span
                className={
                  paymentMethod === 'stripe'
                    ? 'payment-radio active'
                    : 'payment-radio'
                }
                aria-hidden="true"
              />
              <strong>Credit/Debit Card</strong>
              {hasMultipleCardProviders && (
                <span className="payment-provider-pill">Stripe</span>
              )}
              <span
                className="payment-card-pills"
                aria-label="Accepted card types"
              >
                <VisaLogo />
                <MastercardLogo />
                <AmexLogo />
              </span>
            </button>
            <div
              className={
                paymentMethod === 'stripe'
                  ? 'payment-choice-body'
                  : 'payment-choice-body payment-choice-body-hidden'
              }
              aria-hidden={paymentMethod !== 'stripe'}
            >
              {stripePromise ? (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <StripeCardSection onReady={handleStripeReady} />
                </Elements>
              ) : (
                <div className="payment-unavailable-note">
                  <p>Secure card entry is currently unavailable.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PayPal Card Fields */}
        {canUsePayPalCard && cardFieldsEligible && (
          <section
            className={
              paymentMethod === 'paypal-card'
                ? 'payment-choice is-active'
                : 'payment-choice'
            }
          >
            <button
              className="payment-choice-header"
              type="button"
              aria-expanded={paymentMethod === 'paypal-card'}
              onClick={() => setPaymentMethod('paypal-card')}
            >
              <span
                className={
                  paymentMethod === 'paypal-card'
                    ? 'payment-radio active'
                    : 'payment-radio'
                }
                aria-hidden="true"
              />
              <strong>Credit/Debit Card</strong>
              {hasMultipleCardProviders && (
                <span className="payment-provider-pill">PayPal</span>
              )}
              <span
                className="payment-card-pills"
                aria-label="Accepted card types"
              >
                <VisaLogo />
                <MastercardLogo />
                <AmexLogo />
              </span>
            </button>
            <div
              className={
                paymentMethod === 'paypal-card'
                  ? 'payment-choice-body'
                  : 'payment-choice-body payment-choice-body-hidden'
              }
              aria-hidden={paymentMethod !== 'paypal-card'}
            >
              <div className="card-fields-container">
                <div className="card-field-item card-number-item">
                  <div className="paypal-card-field card-number-field">
                    <PayPalNumberField
                      placeholder="1234 1234 1234 1234"
                      style={VISA_CARD_STYLE}
                    />
                  </div>
                </div>
                <div className="card-field-split">
                  <div className="card-field-item">
                    <div className="paypal-card-field">
                      <PayPalExpiryField
                        placeholder="MM / YY"
                        style={VISA_CARD_STYLE}
                      />
                    </div>
                  </div>
                  <div className="card-field-item">
                    <div className="paypal-card-field">
                      <PayPalCVVField
                        placeholder="CVC"
                        style={VISA_CARD_STYLE}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Submit buttons stack */}
      <div className="payment-submit-stack">
        {/* Stripe submit */}
        {canUseStripe && (
          <div
            className={
              paymentMethod === 'stripe'
                ? 'payment-submit-panel is-active'
                : 'payment-submit-panel'
            }
            aria-hidden={paymentMethod !== 'stripe'}
          >
            <button
              className="buy-button mt-4"
              disabled={
                paymentMethod !== 'stripe' ||
                state === 'creating' ||
                state === 'capturing' ||
                stripeSubmitting ||
                !stripeCardReady
              }
              onClick={() => {
                setPaymentMethod('stripe');
                submitStripePayment().catch(() => undefined);
              }}
              type="button"
            >
              <span>
                {stripeSubmitting
                  ? 'PROCESSING...'
                  : state === 'creating'
                    ? 'PREPARING...'
                    : 'Place Order'}
              </span>
            </button>
          </div>
        )}

        {/* PayPal Card submit */}
        {canUsePayPalCard && cardFieldsEligible && (
          <div
            className={
              paymentMethod === 'paypal-card'
                ? 'payment-submit-panel is-active'
                : 'payment-submit-panel'
            }
            aria-hidden={paymentMethod !== 'paypal-card'}
          >
            <PayPalCardSubmitButton
              disabled={
                paymentMethod !== 'paypal-card' ||
                state === 'creating' ||
                state === 'capturing'
              }
              onBeforeSubmit={validateDetails}
              cardholderName={customerName}
              billing={activeBillingAddress}
            />
          </div>
        )}
      </div>

      {/* Terms checkbox */}
      <label className="payment-terms-copy pt-2">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.currentTarget.checked)}
        />
        <span>
          I agree to the{' '}
          <a href="/terms-conditions" className="text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="text-primary">
            Privacy Policy
          </a>
          .
        </span>
      </label>
    </>
  );

  /* ================================================================
     Render: Main Layout
     ================================================================ */

  return (
    <CheckoutErrorBoundary>
      <div className="checkout-experience">
        <div className="checkout-grid">
          {/* Your Order — mobile top, hidden on desktop */}
          <div className="checkout-order-mobile">{renderOrderSummary()}</div>

          {/* Contact + Address form (col 1 on desktop) */}
          <form
            className="checkout-form rounded-brand"
            id="checkout-details-form"
            onSubmit={(event) => {
              event.preventDefault();
              preparePayment(paymentMethod).catch(() => undefined);
            }}
          >
            <fieldset disabled={detailsLocked}>
              <h2 className="checkout-form-title">Contact information</h2>
              <MuiTextField
                label="Email address"
                required
                autoComplete="email"
                id="checkout-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <div className="form-grid two mobile-two">
                <MuiTextField
                  label="First name"
                  required
                  autoComplete="given-name"
                  id="checkout-first-name"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
                <MuiTextField
                  label="Last name"
                  required
                  autoComplete="family-name"
                  id="checkout-last-name"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>
              <MuiTextField
                label="Phone"
                required
                autoComplete="tel"
                id="checkout-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />

              {/* Address */}
              <h2 className="checkout-form-title">Your Address</h2>
              {mapboxAccessToken && AddressAutofillComponent ? (
                <div className="mui-field address-autocomplete">
                  <AddressAutofillComponent
                    accessToken={mapboxAccessToken}
                    browserAutofillEnabled
                    onRetrieve={applyMapboxAddress}
                    options={{
                      country: form.country,
                      language: 'en',
                      limit: 5,
                    }}
                    popoverOptions={{ offset: 6, placement: 'bottom-start' }}
                    theme={{
                      variables: {
                        borderRadius: '8px',
                        colorPrimary: themeColors.primary,
                        colorText: themeColors.foreground,
                        colorBackground: themeColors.background,
                      },
                    }}
                  >
                    <input
                      placeholder=" "
                      required
                      autoComplete="street-address"
                      id="checkout-address1"
                      value={form.address1}
                      onChange={(e) => updateField('address1', e.target.value)}
                    />
                  </AddressAutofillComponent>
                  <span className="mui-label">
                    Street address
                    <span className="mui-required" aria-hidden="true">
                      {' '}
                      *
                    </span>
                  </span>
                </div>
              ) : (
                <MuiTextField
                  label="Street address"
                  required
                  autoComplete="street-address"
                  id="checkout-address1"
                  value={form.address1}
                  onChange={(e) => updateField('address1', e.target.value)}
                />
              )}

              <MuiTextField
                label="Apt, suite, etc."
                optional
                autoComplete="address-line2"
                id="checkout-address2"
                value={form.address2}
                onChange={(e) => updateField('address2', e.target.value)}
              />

              <div className="form-grid two mobile-two">
                <MuiSelectField
                  label="Country"
                  required
                  id="checkout-country"
                  value={form.country}
                  onValueChange={updateCountry}
                  options={countryOptions}
                />
                <MuiSelectField
                  label="State"
                  required
                  filled={Boolean(form.state)}
                  id="checkout-state"
                  value={form.state}
                  onValueChange={(v) => updateField('state', v)}
                  options={regionOptions}
                />
              </div>

              <div className="form-grid two mobile-two">
                <MuiTextField
                  label="City"
                  required
                  autoComplete="address-level2"
                  id="checkout-city"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
                <MuiTextField
                  label="Postal code"
                  required
                  autoComplete="postal-code"
                  id="checkout-postal"
                  value={form.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                />
              </div>

              {/* Billing address checkbox */}
              <label className="billing-as-shipping-row">
                <input
                  type="checkbox"
                  checked={billingAsShipping}
                  onChange={(event) => {
                    handleDetailsChange();
                    setBillingAsShipping(event.target.checked);
                  }}
                  id="billing-as-shipping"
                />
                <span>Billing address same as above</span>
              </label>

              {/* Separate billing address */}
              {!billingAsShipping && (
                <div className="shipping-address-section">
                  <h2 className="checkout-form-title">Billing address</h2>
                  <MuiTextField
                    label="Street address"
                    required
                    autoComplete="billing street-address"
                    id="billing-address1"
                    value={billingForm.address1}
                    onChange={(e) =>
                      updateBillingField('address1', e.target.value)
                    }
                  />
                  <MuiTextField
                    label="Apt, suite, etc."
                    optional
                    autoComplete="billing address-line2"
                    id="billing-address2"
                    value={billingForm.address2}
                    onChange={(e) =>
                      updateBillingField('address2', e.target.value)
                    }
                  />
                  <div className="form-grid two mobile-two">
                    <MuiSelectField
                      label="Country"
                      required
                      id="billing-country"
                      value={billingForm.country}
                      onValueChange={updateBillingCountry}
                      options={countryOptions}
                    />
                    <MuiSelectField
                      label="State"
                      required
                      filled={Boolean(billingForm.state)}
                      id="billing-state"
                      value={billingForm.state}
                      onValueChange={(v) => updateBillingField('state', v)}
                      options={billingRegionOptions}
                    />
                  </div>
                  <div className="form-grid two mobile-two">
                    <MuiTextField
                      label="City"
                      required
                      autoComplete="billing address-level2"
                      id="billing-city"
                      value={billingForm.city}
                      onChange={(e) =>
                        updateBillingField('city', e.target.value)
                      }
                    />
                    <MuiTextField
                      label="Postal code"
                      required
                      autoComplete="billing postal-code"
                      id="billing-postal"
                      value={billingForm.postalCode}
                      onChange={(e) =>
                        updateBillingField('postalCode', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </fieldset>
          </form>

          {/* Right sidebar: Your Order + Payment */}
          <div className="checkout-sidebar">
            {/* Your Order — hidden on mobile, visible on desktop */}
            <div className="checkout-order-desktop">{renderOrderSummary()}</div>

            {/* Payment section */}
            <aside className="order-summary">
              {/* Error display */}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <section className="payment-panel">
                <h2>Payment</h2>

                {hasPaymentConfigError ? (
                  <div className="payment-unavailable-note" role="alert">
                    <strong>No payment methods are available.</strong>
                    <p>{paymentConfigError}</p>
                  </div>
                ) : (
                  <PayPalScriptProvider
                    options={{
                      clientId: paypalClientId || 'test',
                      currency: CurrencySymbolCode[currency] || 'USD',
                      components: 'buttons,card-fields',
                      intent:
                        paypalCaptureMethod === 'automatic'
                          ? 'capture'
                          : 'authorize',
                    }}
                  >
                    {canUsePayPalCard && cardFieldsEligible ? (
                      <PayPalCardFieldsProvider
                        createOrder={async () => {
                          // Return cached order ID to avoid duplicate orders
                          // when PayPal SDK calls createOrder multiple times.
                          if (paypalOrderIdRef.current) {
                            return paypalOrderIdRef.current;
                          }
                          const id = await preparePayment('paypal-card');
                          if (!id) {
                            throw new Error(
                              'Please fill in all required contact and shipping details.',
                            );
                          }
                          paypalOrderIdRef.current = id;
                          return id;
                        }}
                        onApprove={async (data) => {
                          if (data.orderID) {
                            await capturePayment(data.orderID);
                          }
                        }}
                        onError={(err) => {
                          setError(friendlyError(err));
                        }}
                      >
                        {paymentControls}
                      </PayPalCardFieldsProvider>
                    ) : (
                      paymentControls
                    )}
                  </PayPalScriptProvider>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </CheckoutErrorBoundary>
  );
}

/* ================================================================
   Inner Components
   ================================================================ */

/* ---- Stripe Card Section ---- */
function StripeCardSection({
  onReady,
}: {
  onReady: (
    stripe: Stripe | null,
    card: StripeCardNumberElement | null,
  ) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (stripe && elements) {
      const cardElement = elements.getElement(
        CardNumberElement,
      ) as StripeCardNumberElement | null;
      onReady(stripe, cardElement);
    } else {
      onReady(null, null);
    }
  }, [stripe, elements, onReady]);

  return (
    <div className="stripe-payment-section">
      <div className="card-fields-container">
        <div className="card-field-item">
          <div className="stripe-card-field">
            <CardNumberElement
              options={{
                ...STRIPE_ELEMENT_OPTIONS,
                placeholder: '1234 1234 1234 1234',
                showIcon: true,
              }}
            />
          </div>
        </div>
        <div className="card-field-split">
          <div className="card-field-item">
            <div className="stripe-card-field">
              <CardExpiryElement
                options={{
                  ...STRIPE_ELEMENT_OPTIONS,
                  placeholder: 'MM / YY',
                }}
              />
            </div>
          </div>
          <div className="card-field-item">
            <div className="stripe-card-field">
              <CardCvcElement
                options={{
                  ...STRIPE_ELEMENT_OPTIONS,
                  placeholder: 'CVC',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- PayPal Card Submit Button ---- */
function PayPalCardSubmitButton({
  disabled,
  onBeforeSubmit,
  cardholderName,
  billing,
}: {
  disabled: boolean;
  onBeforeSubmit: () => boolean;
  cardholderName: string;
  billing: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}) {
  const { cardFieldsForm } = usePayPalCardFields();
  const [submitting, setSubmitting] = useState(false);

  async function submitCard() {
    if (!onBeforeSubmit() || typeof cardFieldsForm?.submit !== 'function')
      return;

    setSubmitting(true);
    try {
      const submitFn = cardFieldsForm.submit as (
        options?: Record<string, unknown>,
      ) => Promise<void>;
      await submitFn({
        cardholderName,
        billingAddress: {
          address_line_1: billing.address1,
          address_line_2: billing.address2 || undefined,
          admin_area_2: billing.city,
          admin_area_1: billing.state,
          postal_code: billing.postalCode,
          country_code: billing.country,
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      className="buy-button mt-4"
      disabled={disabled || submitting}
      onClick={submitCard}
      type="button"
    >
      <span>{submitting ? 'PROCESSING...' : 'Place Order'}</span>
    </button>
  );
}
