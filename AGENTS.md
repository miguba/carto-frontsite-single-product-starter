# Carto Frontsite Starter

This repository is a standalone storefront backed by the Carto Private
Commerce API. Users own the generated source and may deploy it independently.

- Keep `COMMERCE_API_TOKEN` server-only. Never expose it through a public
  environment variable or browser bundle.
- Keep Carto API access inside `src/lib/commerce.ts`; UI components should not
  call Carto Private directly.
- Do not invent Commerce API fields. Use the types declared in
  `src/lib/commerce.ts` and the existing request methods.
- Preserve checkout, payment, inventory, and order error handling when changing
  presentation code.
- Run `npm run check` after functional changes.
