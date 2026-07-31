import type { APIRoute } from 'astro';
import { getDynamicPages } from '@/lib/remote-content';

/**
 * Dynamic XML Sitemap for SSR mode.
 * Lists all publicly indexable pages with their metadata.
 *
 * NOTE: Replace the fallback domain with your actual production domain,
 * or set the `site` property in astro.config.mjs.
 */
export const prerender = false;

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact-us', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/refund-shipping-policy', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms-conditions', changefreq: 'monthly', priority: '0.3' },
];

export const GET: APIRoute = async ({ url }) => {
  const baseUrl = url.origin;
  const today = new Date().toISOString().split('T')[0];
  let dynamicPages: typeof STATIC_PAGES = [];
  try {
    dynamicPages = (await getDynamicPages())
      .filter((page) => !page.noindex)
      .map((page) => ({
        path: page.href,
        changefreq: 'monthly',
        priority: '0.5',
      }));
  } catch (error) {
    console.warn('Dynamic pages unavailable for sitemap.', error);
  }
  const pages = [...STATIC_PAGES];
  for (const page of dynamicPages) {
    if (!pages.some((candidate) => candidate.path === page.path)) {
      pages.push(page);
    }
  }

  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
