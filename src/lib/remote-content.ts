import type { FaqGroup, ProductDisplayConfig } from '@/types/app.type';
import {
  getCachedBlocksByKeys,
  getCachedBlocksByType,
  getCachedCommerceConfig,
  type CommerceBlock,
} from './commerce';
import type { CacheOptions } from './cache-page';
import { getEntry } from 'astro:content';
import { resolveContentImage } from './content-image';

const HOME_CONTENT_BLOCK_KEY = 'home-content';
const FOOTER_CONTENT_BLOCK_KEY = 'footer-content';
const HEADER_CONTENT_BLOCK_KEY = 'header-content';
const COOKIE_CONSENT_BLOCK_KEY = 'cookie-consent';
const THEME_BLOCK_KEY = 'theme';
const CHECKOUT_CONTENT_BLOCK_KEY = 'checkout-content';
const NON_ROUTE_PAGE_BLOCK_KEYS = new Set([
  HOME_CONTENT_BLOCK_KEY,
  FOOTER_CONTENT_BLOCK_KEY,
  HEADER_CONTENT_BLOCK_KEY,
  COOKIE_CONSENT_BLOCK_KEY,
  CHECKOUT_CONTENT_BLOCK_KEY,
]);

export interface CheckoutCountry {
  code: string;
  name: string;
  regions?: string[];
}

export interface CookieConsentContent {
  ariaLabel: string;
  heading: string;
  description: string;
  privacyPolicy: {
    label: string;
    href: string;
  };
  declineLabel: string;
  acceptLabel: string;
}

export interface HeaderContent {
  announcement: {
    text: string;
    href: string;
  };
  branding: {
    href: string;
    logo: string;
    logoAlt: string;
    title: string;
    favicon: string;
  };
}

export interface FooterContent {
  branding: {
    prefix: string;
    logo: string;
    logoAlt: string;
    name: string;
  };
  navigation: {
    ariaLabel: string;
    items: Array<{ label: string; href: string }>;
  };
  details: {
    copyright: string;
    support: string;
    currency: string;
    legal: string;
  };
}

export interface ThemeContent {
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    background: string;
    foreground: string;
  };
}

export async function getCheckoutCountries(
  cacheOptions: CacheOptions = {},
): Promise<CheckoutCountry[]> {
  const entry = await getEntry('blocks', CHECKOUT_CONTENT_BLOCK_KEY);
  const localMeta = isRecord(entry?.data) ? entry.data : {};
  let remoteMeta: Record<string, unknown> = {};

  try {
    const blocks = await getCachedBlocksByKeys(
      [CHECKOUT_CONTENT_BLOCK_KEY],
      cacheOptions,
    );
    remoteMeta = blocks[CHECKOUT_CONTENT_BLOCK_KEY]?.meta || {};
  } catch (error) {
    console.warn(
      'Remote checkout content unavailable; using local content.',
      error,
    );
  }

  const localCountries = normalizeCheckoutCountries(localMeta.countries);
  const remoteCountries = normalizeCheckoutCountries(remoteMeta.countries);
  return remoteCountries.length ? remoteCountries : localCountries;
}

export interface DynamicPage {
  key: string;
  href: string;
  title: string;
  navigationLabel: string;
  navigationOrder: number;
  showInFooter: boolean;
  noindex: boolean;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    imgUrl: string;
  };
  content: string;
}

export async function getHomeDecoration(cacheOptions: CacheOptions = {}) {
  const localBlock = await getLocalHomeContentBlock();
  let remoteBlock:
    Awaited<ReturnType<typeof getCachedBlocksByKeys>>[string] | undefined;
  try {
    const blocks = await getCachedBlocksByKeys(
      [HOME_CONTENT_BLOCK_KEY],
      cacheOptions,
    );
    remoteBlock = blocks[HOME_CONTENT_BLOCK_KEY];
  } catch (error) {
    console.warn('Remote decoration unavailable; using local content.', error);
  }
  const meta = mergeRecords(localBlock.meta, remoteBlock?.meta || {});
  const heroMeta = isRecord(meta.hero) ? meta.hero : {};
  const seoMeta = isRecord(meta.seo) ? meta.seo : {};
  const faqMeta = isRecord(meta.faqs) ? meta.faqs : {};
  const productDisplayMeta = isRecord(meta.productDisplay)
    ? meta.productDisplay
    : {};
  const mediaBaseUrl = await getMediaBaseUrl(cacheOptions);

  return {
    hero: {
      image: resolveContentImage(firstString(heroMeta.image), mediaBaseUrl),
      imageAlt: firstString(heroMeta.imageAlt),
      tip: firstString(heroMeta.tip),
    },
    seo: {
      title: firstString(seoMeta.title, meta.seoTitle),
      description: firstString(seoMeta.description, meta.seoDescription),
      keywords: normalizeKeywords(seoMeta.keywords),
    },
    productDisplay: normalizeProductDisplay(productDisplayMeta),
    faqs: normalizeFaqs(faqMeta),
  };
}

export async function getContentPage(
  blockKey: string,
  cacheOptions: CacheOptions = {},
) {
  const entry = await getEntry('blocks', blockKey);
  let remoteBlock:
    Awaited<ReturnType<typeof getCachedBlocksByKeys>>[string] | undefined;
  try {
    const blocks = await getCachedBlocksByKeys([blockKey], cacheOptions);
    remoteBlock = blocks[blockKey];
  } catch (error) {
    console.warn(
      `Remote block "${blockKey}" unavailable; using local content.`,
      error,
    );
  }

  const localMeta = isRecord(entry?.data) ? entry.data : {};
  const meta = mergeRecords(localMeta, remoteBlock?.meta || {});
  const localBody =
    entry && 'body' in entry && typeof entry.body === 'string'
      ? entry.body
      : '';

  return {
    title: firstString(meta.title) || blockKey,
    seo: {
      title: firstString(meta.seoTitle, meta.title) || blockKey,
      description: firstString(meta.seoDescription),
    },
    content: firstString(remoteBlock?.content) || localBody,
  };
}

export async function getDynamicPage(
  blockKey: string,
  cacheOptions: CacheOptions = {},
) {
  if (!isRouteBlockKey(blockKey) || NON_ROUTE_PAGE_BLOCK_KEYS.has(blockKey)) {
    return undefined;
  }
  const blocks = await getCachedBlocksByKeys([blockKey], cacheOptions);
  const block = blocks[blockKey];
  if (block?.type !== 'page') return undefined;
  const mediaBaseUrl = await getMediaBaseUrl(cacheOptions);
  return normalizeDynamicPage(block, mediaBaseUrl);
}

export async function getDynamicPages(
  cacheOptions: CacheOptions = {},
): Promise<DynamicPage[]> {
  const [blocks, mediaBaseUrl] = await Promise.all([
    getCachedBlocksByType('page', cacheOptions),
    getMediaBaseUrl(cacheOptions),
  ]);
  return blocks
    .filter(
      (block) =>
        isRouteBlockKey(block.key) && !NON_ROUTE_PAGE_BLOCK_KEYS.has(block.key),
    )
    .map((block) => normalizeDynamicPage(block, mediaBaseUrl))
    .sort(
      (a, b) =>
        a.navigationOrder - b.navigationOrder ||
        a.navigationLabel.localeCompare(b.navigationLabel),
    );
}

export async function getFooterContent(
  cacheOptions: CacheOptions = {},
): Promise<FooterContent> {
  const entry = await getEntry('blocks', FOOTER_CONTENT_BLOCK_KEY);
  const localMeta = isRecord(entry?.data) ? entry.data : {};
  let remoteMeta: Record<string, unknown> = {};

  try {
    const blocks = await getCachedBlocksByKeys(
      [FOOTER_CONTENT_BLOCK_KEY],
      cacheOptions,
    );
    remoteMeta = blocks[FOOTER_CONTENT_BLOCK_KEY]?.meta || {};
  } catch (error) {
    console.warn('Remote footer unavailable; using local content.', error);
  }

  const meta = mergeRecordsIncludingEmpty(localMeta, remoteMeta);
  const branding = isRecord(meta.branding) ? meta.branding : {};
  const navigation = isRecord(meta.navigation) ? meta.navigation : {};
  const details = isRecord(meta.details) ? meta.details : {};
  const mediaBaseUrl = await getMediaBaseUrl(cacheOptions);
  const items = Array.isArray(navigation.items)
    ? navigation.items.flatMap((item) => {
        if (!isRecord(item)) return [];
        const label = firstString(item.label);
        const href = firstString(item.href);
        return label && href ? [{ label, href }] : [];
      })
    : [];
  try {
    const pageItems = (await getDynamicPages(cacheOptions))
      .filter((page) => page.showInFooter)
      .map((page) => ({ label: page.navigationLabel, href: page.href }));
    for (const item of pageItems) {
      const existing = items.findIndex(
        (candidate) => candidate.href === item.href,
      );
      if (existing >= 0) items[existing] = item;
      else items.push(item);
    }
  } catch (error) {
    console.warn(
      'Remote page navigation unavailable; using configured footer links.',
      error,
    );
  }

  return {
    branding: {
      prefix: firstString(branding.prefix) || '',
      logo: resolveContentImage(firstString(branding.logo), mediaBaseUrl),
      logoAlt: firstString(branding.logoAlt) || '',
      name: firstString(branding.name) || '',
    },
    navigation: {
      ariaLabel: firstString(navigation.ariaLabel) || 'Footer navigation',
      items,
    },
    details: {
      copyright: firstString(details.copyright) || '',
      support: firstString(details.support) || '',
      currency: firstString(details.currency) || '',
      legal: firstString(details.legal) || '',
    },
  };
}

function normalizeDynamicPage(
  block: CommerceBlock,
  mediaBaseUrl: string,
): DynamicPage {
  const meta = isRecord(block.meta) ? block.meta : {};
  const seo = isRecord(meta.seo) ? meta.seo : {};
  const navigation = isRecord(meta.navigation) ? meta.navigation : {};
  const title = firstString(meta.title) || humanizeBlockKey(block.key);
  const navigationOrder =
    typeof navigation.order === 'number' && Number.isFinite(navigation.order)
      ? navigation.order
      : 100;

  return {
    key: block.key,
    href: `/${block.key}`,
    title,
    navigationLabel: firstString(navigation.label) || title,
    navigationOrder,
    showInFooter:
      navigation.hidden !== true && navigation.showInFooter !== false,
    noindex: meta.noindex === true,
    updatedAt: block.updatedAt,
    seo: {
      title: firstString(seo.title, meta.seoTitle, meta.title) || title,
      description: firstString(seo.description, meta.seoDescription) || '',
      keywords: normalizeKeywords(seo.keywords) || '',
      imgUrl: resolveContentImage(
        firstString(seo.image, meta.seoImage),
        mediaBaseUrl,
      ),
    },
    content: firstString(block.content) || '',
  };
}

function isRouteBlockKey(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function humanizeBlockKey(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function getHeaderContent(
  cacheOptions: CacheOptions = {},
): Promise<HeaderContent> {
  const entry = await getEntry('blocks', HEADER_CONTENT_BLOCK_KEY);
  const localMeta = isRecord(entry?.data) ? entry.data : {};
  let remoteMeta: Record<string, unknown> = {};

  try {
    const blocks = await getCachedBlocksByKeys(
      [HEADER_CONTENT_BLOCK_KEY],
      cacheOptions,
    );
    remoteMeta = blocks[HEADER_CONTENT_BLOCK_KEY]?.meta || {};
  } catch (error) {
    console.warn('Remote header unavailable; using local content.', error);
  }

  const meta = mergeRecordsIncludingEmpty(localMeta, remoteMeta);
  const announcement = isRecord(meta.announcement) ? meta.announcement : {};
  const branding = isRecord(meta.branding) ? meta.branding : {};
  const mediaBaseUrl = await getMediaBaseUrl(cacheOptions);

  return {
    announcement: {
      text: firstString(announcement.text) || '',
      href: firstString(announcement.href) || '/',
    },
    branding: {
      href: firstString(branding.href) || '/',
      logo: resolveContentImage(firstString(branding.logo), mediaBaseUrl),
      logoAlt: firstString(branding.logoAlt) || '',
      title: firstString(branding.title) || '',
      favicon: resolveContentImage(firstString(branding.favicon), mediaBaseUrl),
    },
  };
}

export async function getThemeContent(
  cacheOptions: CacheOptions = {},
): Promise<ThemeContent> {
  const entry = await getEntry('blocks', THEME_BLOCK_KEY);
  const localMeta = isRecord(entry?.data) ? entry.data : {};
  let remoteMeta: Record<string, unknown> = {};

  try {
    const blocks = await getCachedBlocksByKeys([THEME_BLOCK_KEY], cacheOptions);
    remoteMeta = blocks[THEME_BLOCK_KEY]?.meta || {};
  } catch (error) {
    console.warn('Remote theme unavailable; using local theme.', error);
  }

  const meta = mergeRecords(localMeta, remoteMeta);
  const colors = isRecord(meta.colors) ? meta.colors : {};

  return {
    colors: {
      primary: normalizeCssColor(colors.primary, '#0273b5'),
      primaryForeground: normalizeCssColor(colors.primaryForeground, '#ffffff'),
      secondary: normalizeCssColor(colors.secondary, '#14c354'),
      background: normalizeCssColor(colors.background, '#ffffff'),
      foreground: normalizeCssColor(colors.foreground, '#1a1a1a'),
    },
  };
}

export async function getCookieConsentContent(
  cacheOptions: CacheOptions = {},
): Promise<CookieConsentContent> {
  const entry = await getEntry('blocks', COOKIE_CONSENT_BLOCK_KEY);
  const localMeta = isRecord(entry?.data) ? entry.data : {};
  let remoteMeta: Record<string, unknown> = {};

  try {
    const blocks = await getCachedBlocksByKeys(
      [COOKIE_CONSENT_BLOCK_KEY],
      cacheOptions,
    );
    remoteMeta = blocks[COOKIE_CONSENT_BLOCK_KEY]?.meta || {};
  } catch (error) {
    console.warn(
      'Remote cookie consent unavailable; using local content.',
      error,
    );
  }

  const meta = mergeRecordsIncludingEmpty(localMeta, remoteMeta);
  const privacyPolicy = isRecord(meta.privacyPolicy) ? meta.privacyPolicy : {};

  return {
    ariaLabel: firstString(meta.ariaLabel) || 'Cookie preferences',
    heading: firstString(meta.heading) || '',
    description: firstString(meta.description) || '',
    privacyPolicy: {
      label: firstString(privacyPolicy.label) || '',
      href: firstString(privacyPolicy.href) || '',
    },
    declineLabel: firstString(meta.declineLabel) || '',
    acceptLabel: firstString(meta.acceptLabel) || '',
  };
}

async function getLocalHomeContentBlock() {
  const entry = await getEntry('blocks', HOME_CONTENT_BLOCK_KEY);
  return {
    meta: isRecord(entry?.data) ? entry.data : {},
  };
}

async function getMediaBaseUrl(cacheOptions: CacheOptions) {
  try {
    return (await getCachedCommerceConfig(cacheOptions)).mediaBaseUrl;
  } catch (error) {
    console.warn(
      'Commerce media configuration unavailable; preserving content image paths.',
      error,
    );
    return '';
  }
}

function normalizeFaqs(value: Record<string, unknown>): FaqGroup[] {
  const items = Array.isArray(value.items) ? value.items : [];
  const normalized = items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const question = firstString(item.question);
    const answer = firstString(item.answer);
    return question && answer ? [{ a: question, q: [answer] }] : [];
  });
  if (!normalized.length) return [];
  return [
    {
      title: firstString(value.title) || 'Frequently Asked Questions',
      faqs: normalized,
    },
  ];
}

function normalizeCheckoutCountries(value: unknown): CheckoutCountry[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const code = firstString(item.code)?.toUpperCase();
    const name = firstString(item.name);
    if (!code || !name || !/^[A-Z]{2}$/.test(code) || seen.has(code)) return [];
    seen.add(code);

    const regions = Array.isArray(item.regions)
      ? item.regions.flatMap((region) => {
          const normalized = firstString(region);
          return normalized ? [normalized] : [];
        })
      : undefined;
    return [{ code, name, ...(regions ? { regions } : {}) }];
  });
}

function normalizeProductDisplay(
  value: Record<string, unknown>,
): ProductDisplayConfig {
  const group = isRecord(value.group) ? value.group : {};
  const single = isRecord(value.single) ? value.single : {};
  const products = Array.isArray(group.products)
    ? group.products.flatMap((item) => {
        if (!isRecord(item)) return [];
        const productSlug = firstString(item.productSlug);
        if (!productSlug) return [];
        return [
          {
            productSlug,
            label: firstString(item.label) || productSlug,
          },
        ];
      })
    : [];

  return {
    mode: value.mode === 'group' ? 'group' : 'single',
    group: { products },
    single: { productSlug: firstString(single.productSlug) || '' },
  };
}

function firstString(...values: unknown[]) {
  return values
    .find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    )
    ?.trim();
}

function normalizeCssColor(value: unknown, fallback: string) {
  const color = firstString(value);
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function normalizeKeywords(value: unknown) {
  if (Array.isArray(value))
    return value.filter((item) => typeof item === 'string').join(', ');
  return firstString(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeRecords(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null || value === '') continue;
    merged[key] =
      isRecord(defaults[key]) && isRecord(value)
        ? mergeRecords(defaults[key] as Record<string, unknown>, value)
        : value;
  }
  return merged;
}

function mergeRecordsIncludingEmpty(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    merged[key] =
      isRecord(defaults[key]) && isRecord(value)
        ? mergeRecordsIncludingEmpty(
            defaults[key] as Record<string, unknown>,
            value,
          )
        : value;
  }
  return merged;
}
