import { getSecret } from 'astro:env/server';

export type CacheOptions = { refresh?: boolean };

const localCache = new Map<string, unknown>();

/**
 * Cache Carto reads through the Web Cache API when the runtime provides it.
 * Node runtimes without that API use an in-memory fallback and do not depend
 * on a writable filesystem.
 */
export async function cachePage<T>(
  key: string,
  load: () => Promise<T>,
  { refresh = false }: CacheOptions = {},
) {
  const namespace = await getCacheNamespace();
  const request = new Request(
    `https://frontsite-cache.invalid/${namespace}/${encodeURIComponent(key)}`,
  );
  const cacheKey = request.url;

  if (!('caches' in globalThis)) {
    if (!refresh && localCache.has(cacheKey)) {
      return localCache.get(cacheKey) as T;
    }

    const value = await load();
    localCache.set(cacheKey, value);
    return value;
  }

  const cache = await caches.open('frontsite-commerce');
  if (!refresh) {
    const cached = await cache.match(request);
    if (cached) return (await cached.json()) as T;
  }

  const value = await load();
  const response = Response.json(value, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
  await cache.put(request, response);
  return value;
}

async function getCacheNamespace() {
  const source = [
    getSecret('PUBLIC_COMMERCE_API_BASE_URL')?.trim().replace(/\/+$/, '') || '',
    getSecret('COMMERCE_API_TOKEN') || '',
  ].join('\0');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
