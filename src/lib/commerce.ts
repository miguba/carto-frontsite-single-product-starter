import { cachePage, type CacheOptions } from './cache-page';
import { getSecret } from 'astro:env/server';

type ProductVariant = {
  id: string;
  sku: string;
  optionValues: Record<string, string>;
  decoration: Record<string, unknown>;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  currency: string;
  mainImage: string | null;
  galleryImages: string[];
  content: string | null;
  meta: {
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
      image?: string;
    };
    sellingPoints?: string[];
    decoration?: Record<string, unknown>;
  };
  variants: ProductVariant[];
};

export type Order = {
  orderNo: string;
  status: 'pending' | 'processing' | 'done' | 'cancelled';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  currency: string;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  itemCount: number;
  customer: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  };
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  items: Array<{
    id: string;
    productSlug: string;
    productTitle: string;
    sku: string;
    image: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

type OrderAddress = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CommerceBlock = {
  key: string;
  type: string;
  meta: Record<string, unknown>;
  content: string;
  updatedAt: string;
};

type BlocksList = {
  items: CommerceBlock[];
  total: number;
};

export type CommerceConfig = {
  mediaBaseUrl: string;
  site: {
    name: string;
    domain: string;
    supportEmail: string;
    supportResponseTime: string;
    copyrightYear: string;
  };
  checkout: { successNotice: string };
  payments: {
    paypal: { enabled: boolean; creditCardEnabled: boolean; clientId: string };
    stripe: { enabled: boolean; publishableKey: string };
  };
};

function getApiConfig() {
  return {
    baseUrl: (getSecret('PUBLIC_COMMERCE_API_BASE_URL') || '').replace(
      /\/$/,
      '',
    ),
    token: getSecret('COMMERCE_API_TOKEN') || '',
  };
}

async function commerceRequest<T>(path: string, init: RequestInit = {}) {
  const { baseUrl, token } = getApiConfig();
  if (!baseUrl) {
    throw new Error('PUBLIC_COMMERCE_API_BASE_URL is not configured');
  }
  if (!token) throw new Error('COMMERCE_API_TOKEN is not configured');

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: unknown;
  } | null;
  if (!response.ok || !payload?.success) {
    const message =
      typeof payload?.data === 'string'
        ? payload.data
        : `Carto API returned ${response.status}`;
    throw new Error(message);
  }
  return payload.data as T;
}

const getCommerceConfig = () =>
  commerceRequest<CommerceConfig>('/api/commerce/config');

export const getCachedCommerceConfig = (options?: CacheOptions) =>
  cachePage('commerce:config', getCommerceConfig, options);

const getProducts = () =>
  commerceRequest<Product[]>('/api/commerce/products?limit=100&offset=0');

export const getCachedProducts = (options?: CacheOptions) =>
  cachePage('commerce:products:100:0', getProducts, options);

const getProduct = (slug: string) =>
  commerceRequest<Product>(
    `/api/commerce/products/${encodeURIComponent(slug)}`,
  );

export const getCachedProduct = (slug: string, options?: CacheOptions) =>
  cachePage(`commerce:product:${slug}`, () => getProduct(slug), options);

export const getOrder = (orderNo: string) =>
  commerceRequest<Order>(`/api/commerce/orders/${encodeURIComponent(orderNo)}`);

const getBlocksByKeys = (keys: string[]) => {
  const params = new URLSearchParams({ keys: [...new Set(keys)].join(',') });
  return commerceRequest<Record<string, CommerceBlock>>(
    `/api/commerce/blocks?${params}`,
  );
};

export const getCachedBlocksByKeys = (
  keys: string[],
  options?: CacheOptions,
) => {
  const normalized = [
    ...new Set(keys.map((key) => key.trim()).filter(Boolean)),
  ].sort();
  return cachePage(
    `commerce:blocks:${normalized.join('|')}`,
    () => getBlocksByKeys(normalized),
    options,
  );
};

const getBlocksByType = async (type: string) => {
  const perPage = 100;
  const requestPage = (page: number) =>
    commerceRequest<BlocksList>(
      `/api/commerce/blocks?${new URLSearchParams({
        type,
        page: String(page),
        perPage: String(perPage),
      })}`,
    );
  const firstPage = await requestPage(1);
  const pageCount = Math.ceil(firstPage.total / perPage);
  if (pageCount <= 1) return firstPage.items;
  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => requestPage(index + 2)),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
};

export const getCachedBlocksByType = (type: string, options?: CacheOptions) => {
  const normalized = type.trim();
  if (!normalized) return Promise.resolve([]);
  return cachePage(
    `commerce:blocks:type:${normalized}`,
    () => getBlocksByType(normalized),
    options,
  );
};

export function mediaUrl(
  value: string | null | undefined,
  mediaBaseUrl: string,
) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${mediaBaseUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}

export const postCommerce = <T>(path: string, body: unknown) =>
  commerceRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });
