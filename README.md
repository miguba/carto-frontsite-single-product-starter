# Carto Frontsite Single Product Starter

An open-source starting point for building a single-product storefront backed
by the Carto Private Commerce API. Clone it, customize it with code or AI, and
deploy it to your preferred hosting platform through Carto Kit.

## Architecture

- Astro renders storefront and policy routes on demand.
- React islands handle SKU selection, checkout, payments, FAQ interactions,
  cookie consent, and the mobile purchase bar.
- Carto Private remains the system of record for products, inventory, site
  configuration, orders, payments, and Blocks.
- A runtime Web Cache API caches server-side Carto reads when the deployment
  platform provides one; local and standard Node runtimes use an in-memory
  fallback.
- The complete application source belongs to you after cloning this Starter.

## Configuration

Install the project and securely connect it to Carto Private:

```sh
npm install
npx carto-kit@latest connect
npm run dev
```

`carto-kit connect` opens Carto Private's verification flow and writes the
authorized project configuration to `.env`. Tokens are never passed as
command-line arguments.

The resulting local configuration uses these environment variables:

```dotenv
PUBLIC_COMMERCE_API_BASE_URL=https://carto.example.com
COMMERCE_API_TOKEN=sk_live_replace_me
PUBLIC_MAPBOX_ACCESS_TOKEN=
PUBLIC_GTM_ID=
```

`COMMERCE_API_TOKEN` is server-only.

Open `http://localhost:4321`. To test from another device on the same network,
use `npm run dev:host` and open the LAN address printed by Astro.

Runtimes without the Web Cache API, including Astro's Node-based development
server, automatically fall back to an in-memory cache. Restarting the process
clears it; adding `?___refresh___=1` to a page refreshes the current entries.

## Block content

Local defaults live in `src/content/blocks`. A remote Carto Block with the same
key overrides the local content while missing metadata falls back to the local
default.

| Block key                | Purpose                              |
| ------------------------ | ------------------------------------ |
| `home-content`           | Hero, SEO, product display, and FAQs |
| `header-content`         | Announcement, branding, and favicon  |
| `about-us`               | About page                           |
| `contact-us`             | Contact page                         |
| `privacy-policy`         | Privacy policy                       |
| `refund-shipping-policy` | Refund and delivery policy           |
| `terms-conditions`       | Store terms                          |

Carto reads are cached without an application TTL and are isolated by the
Carto Private origin and project token. Use `?___refresh___=1` on a page to
bypass and replace the relevant cached reads. A hosting platform may still
evict Cache API entries according to its cache policy.
Policy defaults are placeholders and must be reviewed before accepting live
orders.

`home-content.meta.productDisplay` controls the homepage purchase section.
Use `mode: single` with `single.productSlug`, or `mode: group` with a
`group.products` list containing `productSlug` and `label`. Remote metadata
overrides the local defaults. When `single.productSlug` is empty, the first
active product is displayed.

`header-content.meta.branding.favicon` controls the browser tab icon. Set it
to an uploaded Block media path or an absolute image URL. When it is empty, the
template falls back to `/favicon.ico`.

### Dynamic pages

Create a remote Block with `type: page` to publish a new root-level page. Its
Block `key` becomes the route (`returns-policy` becomes `/returns-policy`) and
its Markdown body becomes the page content. Keys must use lowercase letters,
numbers, and single hyphens.

Page frontmatter supports:

```yaml
title: Returns Policy
seo:
  title: Returns Policy
  description: Returns and exchange terms for this store.
  keywords:
    - returns
    - exchanges
  image: /i/returns-share.jpg
navigation:
  label: Returns
  order: 40
  showInFooter: true
noindex: false
```

Dynamic pages are added to the footer and sitemap automatically. Set
`navigation.hidden: true` or `navigation.showInFooter: false` to omit a page
from the footer, and `noindex: true` to omit it from the sitemap and add a
`noindex` robots directive. Static Astro routes always take precedence over a
dynamic Block with the same key.

## Commands

```sh
npm install
npm run dev
npm run check
npm run build
```

Configure the deployment target and deploy through Carto Kit:

```sh
npx carto-kit@latest deploy
```

The starter contains only the platform-neutral Node SSR build. Carto Kit owns
deployment-platform adaptation, credentials, generated hosting configuration,
and publishing.
