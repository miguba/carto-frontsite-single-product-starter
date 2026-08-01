# Checkout shared-layout design QA

## Evidence

- Source visual truth: `/var/folders/14/ds_ztnp97476j121lxlj8dkc0000gn/T/codex-clipboard-a9f8772f-105d-44fc-ba7d-06663ec9bc7b.png`
- Implementation screenshot: `.design-audit/checkout-shared-layout.png`
- Browser-rendered route: `http://localhost:4173/checkout`
- Viewport: 1280 × 720 CSS px
- Source pixels: 2880 × 2741, including browser chrome
- Implementation pixels: 1280 × 1181 full-page capture at 1× density
- Normalization: compared the page-content structure rather than browser chrome; the source was scaled to the implementation width for the full-view review.
- State: checkout unavailable state, used to verify the page shell independently of commerce credentials.

## Full-view comparison

The checkout page now follows the same storefront shell as the home page and the reference: announcement strip, centered brand header, checkout content region, and the complete footer/navigation/legal area. The checkout-specific content remains contained on the light-gray main background.

## Focused region comparison

- Header: announcement strip and centered logo/title are present and use the existing storefront content and theme tokens.
- Footer: shared branding, navigation, copyright, support, currency, and legal text are present.
- Checkout content: the existing checkout component and its typography, colors, and behavior were not changed by this layout-only update.

## Required fidelity surfaces

- Fonts and typography: shared header/footer use the same configured storefront fonts as the home page.
- Spacing and layout rhythm: shared header/footer spacing is inherited directly from `DefaultLayout`; no checkout-only duplicate styles were introduced.
- Colors and visual tokens: announcement, brand, and footer colors use the existing theme content and CSS variables.
- Image quality and asset fidelity: the configured storefront logo is reused at its native layout size.
- Copy and content: header/footer copy comes from the same editable content blocks used by the home page.

## Findings

No actionable P0, P1, or P2 differences remain for the requested shared-layout change.

## Verification

- Astro/TypeScript diagnostics: passed with 0 errors and 0 warnings.
- Unit tests: 17 passed.
- Production SSR build: passed.
- Browser console errors: none.
- Primary interactions tested: page load and shared layout rendering; order submission was intentionally not exercised.

## Comparison history

- Before: `checkoutOnly` suppressed the announcement, footer, and cookie-consent layer.
- Fix: removed the checkout-only layout flag from the checkout page.
- After: browser evidence confirms the announcement, header, footer, and checkout content all render together.

final result: passed

---

# AutoCAD important-notice design QA

## Evidence

- Source visual truth: `/var/folders/14/ds_ztnp97476j121lxlj8dkc0000gn/T/codex-clipboard-728e2e09-bddf-4980-b0e8-628caa072ebb.png`
- Implementation screenshot: `autocad-notice-implementation.png`
- Focused side-by-side comparison: `autocad-notice-comparison.jpg`
- Browser-rendered route: `http://localhost:4173/?product=autodesk-autocad-subscription`
- Viewport: 1440 × 1000 CSS px at 1× density
- Source pixels: 2048 × 1122, including browser chrome; implementation pixels: 1440 × 2559 full-page capture
- Normalization: both notice regions were cropped to the same 1080 px width and placed side by side for direct visual comparison.
- State: desktop storefront with the AutoCAD product tab selected.

## Full-view and focused comparison

The AutoCAD notice appears directly after the introductory paragraph and before “Main Features,” matching the reference hierarchy. The focused comparison confirms the pale-yellow fill, orange left rule, rounded corners, inset spacing, body typography, bold label, and copy wrapping are visually aligned. No additional focused region was needed because the requested change is isolated to this single component.

## Required fidelity surfaces

- Fonts and typography: the notice uses the storefront body font and matches the reference's 16 px body scale, line height, and bold label treatment.
- Spacing and layout rhythm: placement, outer vertical spacing, inner padding, left-rule width, and radius match the reference proportionally.
- Colors and visual tokens: pale amber background, amber left border, dark body copy, and darker bold label match the source's semantic warning treatment.
- Image quality and asset fidelity: the notice contains no image assets.
- Copy and content: the label and full notice text match the supplied reference exactly.

## Findings and comparison history

No actionable P0, P1, or P2 differences remain for the requested desktop notice block. The first side-by-side comparison passed without a visual correction cycle.

## Verification

- Astro/TypeScript diagnostics: passed with 0 errors and 0 warnings.
- Unit tests: 17 passed.
- Production SSR build: passed.
- Primary state tested: AutoCAD tab selected and notice rendered between the introduction and feature list.
- Console check: existing development-only `jsxDEV is not a function` hydration errors remain in unrelated React islands; the server-rendered notice itself produced no error and the production build passed.
- Responsive check: a pre-existing page-wide narrow-layout issue appears under the browser's 390 px viewport override; it is outside this desktop-reference change and was not introduced by the notice.

final result: passed

---

# FAQ content synchronization QA

## Evidence

- Source visual truth: `/var/folders/14/ds_ztnp97476j121lxlj8dkc0000gn/T/codex-clipboard-db49cacc-6a3a-4de2-a8d5-f24f0101b8f8.png`
- Implementation screenshot: `faq-implementation.png`
- Full-page implementation screenshot: `storefront-implementation-full.png`
- Viewport: 1280 × 720 CSS px at 1× density
- Source pixels: 1162 × 657; focused implementation pixels: 1280 × 720
- State: desktop storefront with the FAQ accordion expanded

## Required fidelity surfaces

- Fonts and typography, spacing and layout rhythm, colors and tokens: existing storefront presentation was intentionally preserved because this was a content-only update.
- Image quality and asset fidelity: the FAQ section contains no image assets.
- Copy and content: all six questions and answers match the reference wording and order, including punctuation, the 0–1 range, year list, country list, and support wording.

## Findings and comparison history

No actionable P0, P1, or P2 content mismatches remained after the first implementation pass. The rendered DOM confirms both FAQ rows; focused visual evidence confirms the expanded section and first row. Browser console errors: none.

final result: passed
