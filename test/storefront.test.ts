import { describe, expect, it } from 'vitest';
import {
  renderMarkdown,
  stripMarkdownFrontmatter,
} from '../src/lib/simple-markdown';
import { resolveContentImage } from '../src/lib/content-image';
import { readFileSync } from 'node:fs';

describe('single-product storefront template', () => {
  it('confirms manual-capture orders without showing a capture waiting step', () => {
    const commerce = readFileSync(
      new URL('../src/lib/commerce.ts', import.meta.url),
      'utf8',
    );
    const checkout = readFileSync(
      new URL('../src/components/CheckoutForm.tsx', import.meta.url),
      'utf8',
    );
    const orderPage = readFileSync(
      new URL('../src/pages/orders/[orderNo].astro', import.meta.url),
      'utf8',
    );
    const captureRoute = readFileSync(
      new URL('../src/pages/api/checkout/capture.ts', import.meta.url),
      'utf8',
    );

    expect(commerce).toContain("| 'authorized'");
    expect(commerce).toContain("captureMethod: 'manual' | 'automatic'");
    expect(checkout).toContain("paypalCaptureMethod === 'automatic'");
    expect(checkout).toContain('updatedOrder.paymentStatus');
    expect(captureRoute).toContain('paymentStatus: order.paymentStatus');
    expect(checkout).not.toContain('?status=paid');
    expect(orderPage).toContain("paymentStatus === 'authorized'");
    expect(orderPage).toContain('const orderConfirmed = paid || authorized');
    expect(orderPage).not.toContain('Awaiting merchant capture');
  });

  it('defines the product display through the local home block', () => {
    const homeContent = readFileSync(
      new URL('../src/content/blocks/home-content.md', import.meta.url),
      'utf8',
    );

    expect(homeContent).toContain('productDisplay:');
    expect(homeContent).toContain('mode: group');
    expect(homeContent).toMatch(/- productSlug: \S+/);
    expect(homeContent).toMatch(/single:\s+productSlug: '\S+'/);
  });

  it('publishes a copyable catalog of editable Carto Blocks', () => {
    const catalog = readFileSync(
      new URL('../src/pages/carto/blocks.astro', import.meta.url),
      'utf8',
    );

    expect(catalog).toContain("await getCollection('blocks')");
    expect(catalog).toContain(
      "import.meta.glob('/src/content/blocks/*.{md,mdx}'",
    );
    expect(catalog).toContain('navigator.clipboard.writeText(source)');
    expect(catalog).toContain(
      '<meta name="robots" content="noindex,nofollow" />',
    );
  });

  it('documents the editable fields in bundled Carto Blocks', () => {
    const homeContent = readFileSync(
      new URL('../src/content/blocks/home-content.md', import.meta.url),
      'utf8',
    );
    const privacyPolicy = readFileSync(
      new URL('../src/content/blocks/privacy-policy.md', import.meta.url),
      'utf8',
    );

    expect(homeContent).toContain(
      '# 必填的 Block 标识符。请勿修改，以确保能够覆盖首页默认配置。',
    );
    expect(homeContent).toContain(
      '# 单个商品使用 "single"，可切换的商品标签组使用 "group"。',
    );
    expect(privacyPolicy).toContain(
      '# 上线前请根据您的业务及适用司法辖区审核这些默认文本。',
    );
  });

  it('publishes editable layout Blocks with local fallback content', () => {
    const remoteContent = readFileSync(
      new URL('../src/lib/remote-content.ts', import.meta.url),
      'utf8',
    );
    const catalog = readFileSync(
      new URL('../src/pages/carto/blocks.astro', import.meta.url),
      'utf8',
    );

    for (const key of ['header-content', 'footer-content', 'cookie-consent']) {
      const localBlock = readFileSync(
        new URL(`../src/content/blocks/${key}.md`, import.meta.url),
        'utf8',
      );

      expect(localBlock).toContain(`blockKey: ${key}`);
      expect(catalog).toContain(`'${key}'`);
      expect(remoteContent).toContain(`'${key}'`);
    }
  });

  it('publishes configurable checkout countries with safe local fallbacks', () => {
    const checkoutContent = readFileSync(
      new URL('../src/content/blocks/checkout-content.md', import.meta.url),
      'utf8',
    );
    const checkoutPage = readFileSync(
      new URL('../src/pages/checkout.astro', import.meta.url),
      'utf8',
    );
    const checkoutForm = readFileSync(
      new URL('../src/components/CheckoutForm.tsx', import.meta.url),
      'utf8',
    );
    const remoteContent = readFileSync(
      new URL('../src/lib/remote-content.ts', import.meta.url),
      'utf8',
    );

    expect(checkoutContent).toContain('blockKey: checkout-content');
    expect(checkoutContent).toContain('countries:');
    expect(remoteContent).toContain('getCheckoutCountries');
    expect(remoteContent).toContain('/^[A-Z]{2}$/');
    expect(checkoutPage).toContain('countries={checkoutCountries}');
    expect(checkoutPage).not.toContain('checkoutOnly');
    expect(checkoutForm).toContain(
      'normalized.length ? normalized : DEFAULT_COUNTRIES',
    );
  });

  it('loads the favicon from header content with a local fallback', () => {
    const layout = readFileSync(
      new URL('../src/layouts/DefaultLayout/index.astro', import.meta.url),
      'utf8',
    );
    const remoteContent = readFileSync(
      new URL('../src/lib/remote-content.ts', import.meta.url),
      'utf8',
    );

    expect(layout).toContain(
      "headerContent.branding.favicon || '/favicon.ico'",
    );
    expect(remoteContent).toMatch(
      /favicon:\s*resolveContentImage\([\s\S]*branding\.favicon[\s\S]*mediaBaseUrl/,
    );
  });

  it('loads validated theme colors and applies them to every page', () => {
    const layout = readFileSync(
      new URL('../src/layouts/DefaultLayout/index.astro', import.meta.url),
      'utf8',
    );
    const remoteContent = readFileSync(
      new URL('../src/lib/remote-content.ts', import.meta.url),
      'utf8',
    );
    const checkoutStyles = readFileSync(
      new URL('../src/styles/checkout.css', import.meta.url),
      'utf8',
    );
    const checkoutForm = readFileSync(
      new URL('../src/components/CheckoutForm.tsx', import.meta.url),
      'utf8',
    );

    expect(layout).toContain('getThemeContent');
    expect(layout).toContain("'--primary': theme.colors.primary");
    expect(remoteContent).toContain('/^#[0-9a-f]{6}$/i.test(color)');
    expect(checkoutStyles).toContain('--brand: var(--primary)');
    expect(checkoutStyles).toContain(
      'color-mix(in srgb, var(--brand) 8%, transparent)',
    );
    expect(checkoutStyles).not.toContain('--brand-rgb');
    expect(checkoutStyles).toContain('--text-secondary:');
    expect(checkoutStyles).not.toMatch(/\n\s*--secondary:/);
    expect(checkoutForm).toContain("getPropertyValue('--primary')");
    expect(checkoutForm).toContain('colorPrimary: themeColors.primary');
  });

  it('resolves uploaded Block images through the Carto media endpoint', () => {
    const mediaBaseUrl = 'https://carto.example.com/media/';

    expect(resolveContentImage('/i/logo.jpg', mediaBaseUrl)).toBe(
      'https://carto.example.com/media/i/logo.jpg',
    );
    expect(resolveContentImage('i/hero.webp', mediaBaseUrl)).toBe(
      'https://carto.example.com/media/i/hero.webp',
    );
    expect(resolveContentImage('/cube.png', mediaBaseUrl)).toBe('/cube.png');
    expect(
      resolveContentImage('https://cdn.example.com/logo.png', mediaBaseUrl),
    ).toBe('https://cdn.example.com/logo.png');
  });

  it('uses an in-memory cache when the Web Cache API is unavailable', () => {
    const source = readFileSync(
      new URL('../src/lib/cache-page.ts', import.meta.url),
      'utf8',
    );

    expect(source).toContain("if (!('caches' in globalThis))");
    expect(source).toContain('const localCache = new Map<string, unknown>()');
  });

  it('publishes SEO metadata and discovery files for the request domain', () => {
    const layout = readFileSync(
      new URL('../src/layouts/DefaultLayout/index.astro', import.meta.url),
      'utf8',
    );
    const home = readFileSync(
      new URL('../src/pages/index.astro', import.meta.url),
      'utf8',
    );
    const jsonLd = readFileSync(
      new URL('../src/components/JsonLd.astro', import.meta.url),
      'utf8',
    );
    const robots = readFileSync(
      new URL('../src/pages/robots.txt.ts', import.meta.url),
      'utf8',
    );
    const sitemap = readFileSync(
      new URL('../src/pages/sitemap.xml.ts', import.meta.url),
      'utf8',
    );

    expect(layout).toContain('<link rel="canonical" href={canonicalUrl} />');
    expect(layout).toContain('<meta property="og:url"');
    expect(home).toContain("'@type': 'FAQPage'");
    expect(home).toContain('<JsonLd slot="head"');
    expect(jsonLd).toContain(".replaceAll('<', '\\\\u003c')");
    expect(robots).toContain('`Sitemap: ${url.origin}/sitemap.xml`');
    expect(sitemap).toContain('const baseUrl = url.origin');
    expect(robots).not.toContain('example.com');
    expect(sitemap).not.toContain('localhost');
  });

  it('renders safe product markdown without leaking frontmatter', () => {
    const source = `---\ninternal: true\n---\n## Details\n\n<script>alert(1)</script>`;
    const html = renderMarkdown(stripMarkdownFrontmatter(source));

    expect(html).toContain('<h2>Details</h2>');
    expect(html).not.toContain('internal: true');
    expect(html).not.toContain('<script>');
  });

  it('normalizes escaped product newlines before rendering markdown', () => {
    const html = renderMarkdown(
      '## Details\\n\\n### Benefits\\n\\n- Fast delivery\\n- Secure checkout',
    );

    expect(html).toContain('<h2>Details</h2>');
    expect(html).toContain('<h3>Benefits</h3>');
    expect(html).toContain('<li>Fast delivery</li>');
    expect(html).not.toContain('\\n');
  });

  it('renders product markdown images instead of showing their source text', () => {
    const html = renderMarkdown(
      '![](https://pics.dibsale.com/product-image.jpg)\\n\\n![Impact wrench](/images/wrench.jpg)',
    );

    expect(html).toContain(
      '<img src="https://pics.dibsale.com/product-image.jpg" alt="" loading="lazy" decoding="async" />',
    );
    expect(html).toContain(
      '<img src="/images/wrench.jpg" alt="Impact wrench" loading="lazy" decoding="async" />',
    );
    expect(html).not.toContain('![](');
  });

  it('does not render unsafe markdown image URLs', () => {
    const html = renderMarkdown('![](javascript:alert(1))');

    expect(html).not.toContain('<img');
    expect(html).toContain('![](javascript:alert(1))');
  });

  it('keeps Carto reads indefinitely and isolates cache entries by source', () => {
    const source = readFileSync(
      new URL('../src/lib/cache-page.ts', import.meta.url),
      'utf8',
    );

    expect(source).toContain('crypto.subtle.digest(');
    expect(source).toContain("getSecret('PUBLIC_COMMERCE_API_BASE_URL')");
    expect(source).toContain("getSecret('COMMERCE_API_TOKEN')");
    expect(source).not.toContain('max-age=');
    expect(source).not.toContain('CARTO_CACHE_TTL');
  });

  it('refreshes shared site configuration through the refresh query flag', () => {
    const source = readFileSync(
      new URL('../src/layouts/DefaultLayout/index.astro', import.meta.url),
      'utf8',
    );

    expect(source).toContain(
      "Astro.url.searchParams.get('___refresh___') === '1'",
    );
    expect(source).toContain(
      'getCachedCommerceConfig({ refresh: refreshCache })',
    );
  });

  it('publishes remote page blocks as key-based routes and navigation', () => {
    const route = readFileSync(
      new URL('../src/pages/[blockKey].astro', import.meta.url),
      'utf8',
    );
    const remoteContent = readFileSync(
      new URL('../src/lib/remote-content.ts', import.meta.url),
      'utf8',
    );
    const commerce = readFileSync(
      new URL('../src/lib/commerce.ts', import.meta.url),
      'utf8',
    );

    expect(route).toContain('getDynamicPage(blockKey');
    expect(remoteContent).toContain("block?.type !== 'page'");
    expect(remoteContent).toContain("getCachedBlocksByType('page'");
    expect(remoteContent).toContain('navigation.showInFooter !== false');
    expect(remoteContent).toContain(
      'normalizeDynamicPage(block, mediaBaseUrl)',
    );
    expect(remoteContent).toMatch(
      /imgUrl:\s*resolveContentImage\([\s\S]*mediaBaseUrl/,
    );
    expect(commerce).toContain('commerce:blocks:type:');
  });
});
