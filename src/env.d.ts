/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_COMMERCE_API_BASE_URL?: string;
  readonly COMMERCE_API_TOKEN?: string;
  readonly PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
  readonly PUBLIC_GTM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
