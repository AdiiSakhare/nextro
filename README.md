# Nextro Diwali Bulk Orders — Landing Page

Static landing page for the Diwali corporate/bulk gifting campaign (`getnextro.com/bulk`).
Stack: HTML, CSS, vanilla JS, [GSAP 3](https://gsap.com) + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering) — all via CDN, no build step.

```
index.html                page markup (all sections, SVG sprite)
components.html           ★ component library for developers: live demos, markup, options, motion specs
assets/css/base.css       design tokens + reset + utilities
assets/css/components.css reusable components: buttons, diya, LED lights, marigolds, lanterns, sticky dock
assets/css/styles.css     page layout + section styles
assets/js/components.js   component behaviour: window.NextroUI (diya, lights, marigold, dock)
assets/js/config.js       ★ prices, MOQs, dates, contacts, flags, form endpoint, tracking IDs, product card/chip data
assets/js/main.js         page logic: quote tray, form, product cards (+ CARD_ART), scroll reveals
assets/img/hero/          hero artwork (Figma)
assets/img/cards/         product-card backgrounds + cut-outs (Figma)
assets/img/form/          product thumbnails for the quote form (Figma)
assets/img/brand/         white logo for the footer (Figma)
assets/img/Product Images/  the 3:4 product photos (not used on the page right now — the "who it's for" section was removed; kept as provided)
assets/svg/figma/         icons + illustrations exported from Figma (logo, step icons, the three lanterns, price flower…)
assets/svg/rangoli-*.svg  the three rangoli artworks from Figma (why · products · finale)
```

## Components (developer handoff)

The festive pieces that are hardest to rebuild — **buttons, diya, LED fairy lights, hanging marigolds, hanging lanterns, sticky bottom bar** — live in `components.css` + `components.js` and are documented in **`components.html`** (open it in a browser: live demos, copy-paste markup, options, motion specs). The page uses exactly this code, so the library can't drift from the site.

Load order: `base.css` → `components.css` → `styles.css`; scripts: GSAP → `components.js` → `main.js`. Motion needs GSAP; without it (or with "reduce motion") everything renders but stays still. The lanterns are CSS-only.

## Design source (Figma)

Page design: <https://www.figma.com/design/jmktLaEjT5y5kPVol3jBH5/Nextro---Diwali-Special-Offer-Landing-Page?node-id=27-2> (file key `jmktLaEjT5y5kPVol3jBH5`). Implemented from the Figma MCP's design context (not screenshots).

- **Live code stays live.** The Figma file only had *placeholders* for the fairy lights and diyas, so those are our coded, animated components: the garland hangs from the sticky header, and every diya (How-it-works pill, closing row) is `DIYA_SVG` in `main.js`. The hero's diyas are part of the hero artwork itself.
- **Rangoli** — three SVGs from Figma, each with its designed opacity baked in, all turning very slowly via `.rangoli` (see `@keyframes rangoli-spin`). Only Figma's export backdrop was stripped from them; the artwork paths are untouched.
- **Product cards** are built from the Figma layers. Every number in `CARD_ART` (main.js) is in the Figma card's own 384px units and scales with the card via `--u` (= card width ÷ 384), so the artwork stays exact at any size. Prices, MOQs and "Save Upto" % are live from `config.js`.
- **Hero**: artwork only for now. The headline, sub-line and CTA were taken out on request and can be added back; a visually hidden `<h1>` keeps the page heading. Phones (≤640px) crop the outer 12.5% of the artwork each side so it doesn't shrink to a thin strip.
- **Lanterns** (How it works): the Figma lanterns split into `lantern-left/mid/right.svg`, each an `<img class="lantern">` that swings slowly (`@keyframes lantern-swing`, ±2–3°, 5.6–6.8s per leg) from the point where its string meets the card edge (`--px`). Off below 1100px; still under `prefers-reduced-motion`.
- **Dock** (sticky bar) uses the same night + violet glow as the deadline chip (`pill-glow.svg` as a background).
- **Fonts**: Onest everywhere, plus Host Grotesk / Schibsted Grotesk / Space Grotesk, which the Figma product cards use.
- **Not in the Figma file** (kept as they were, restyled with the new tokens): reviews, the "ordering 50+" band, quote form steps 2 and 3.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Editing content

Almost everything that changes lives in **`assets/js/config.js`**:

| Key | What it controls |
|---|---|
| `campaign.lastOrderDate` | Countdown, "N days left" in the strip and sticky bar. After this date the page automatically switches to year-round copy. |
| `campaign.nowOverride` | Set a date to preview the post-deadline state. Keep `null` in production. |
| `contact.*` | Phone, WhatsApp number + default message, email, hours. Used by every call/WhatsApp/email button. |
| `products[]` | Name, variant, `retail`, `bulk` (per unit), `moq`, `card` (Figma card name/background), `chip` (form chip label/thumbnail), plus `tagline`/`specs`/`badge`/`image` used by the "who it's for" tabs. |
| `flags.showLogos` + `logos[]`, `flags.showCounter` | Reserved for a logo row / counter badge — the redesigned hero has no slot for them yet. |
| `form.endpoint` | Where inquiries are POSTed (see below). Empty = simulated success. |
| `tracking.ga4Id` / `metaPixelId` | Loads GA4 / Meta Pixel when set. |

Copy for sections, FAQs and testimonials is plain HTML in `index.html`. If the asset files change, bump `?v=1` on the CSS/JS links.

## Product photos

The six photos in `assets/img/Product Images/` are used **exactly as provided** (no cropping, recolouring, conversion or renaming) by the (now removed) "who it's for" tabs. They are 1086×1448 (3:4 portrait) and the frames use that same ratio. To change one, edit that product's `image` path in `assets/js/config.js`.

## Page weight

The Figma artwork is large: ~18 MB of card PNGs (loaded lazily as you scroll), 1.7 MB for the hero, ~1.2 MB of form thumbnails. Compressing them (WebP/AVIF at display size) would cut this a lot — they were kept as exported on purpose.

## Connecting the inquiry form

On submit the page POSTs JSON (sent as `text/plain`, so there's no CORS preflight) to `form.endpoint`:

```json
{ "products": ["X700","N70"], "quantity": "25–49", "city": "Pune", "company": "...", "name": "...",
  "phone": "+919876543210", "email": "...", "addons": ["Diwali gift box"], "packaging": "...",
  "source": "Instagram", "use_case": "HR & Admin", "quote_items": "X700 × 15, N70 × 20",
  "quote_estimate": 159465, "utm_source": "...", "utm_medium": "...", "utm_campaign": "...",
  "utm_content": "...", "utm_term": "...", "page": "...", "submitted_at": "ISO date" }
```

Google Apps Script example (Sheet + email alert). Deploy it as a Web App that "Anyone" can access, then paste the URL into `form.endpoint`:

```js
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActive().getSheets()[0].appendRow([
    new Date(), d.company, d.name, d.phone, d.email, d.products.join(', '), d.quantity,
    d.city, d.quote_items, d.addons.join(', '), d.packaging, d.source, d.use_case,
    d.utm_source, d.utm_campaign,
  ]);
  MailApp.sendEmail('bulk@getnextro.com', `New bulk inquiry: ${d.company}`, JSON.stringify(d, null, 2));
  return ContentService.createTextOutput('ok');
}
```

If a submit fails, the user is offered a prefilled WhatsApp fallback.

## Analytics events

Every event is pushed to `window.dataLayer`, and also sent to GA4 / Meta when their IDs are set:
`cta_click` · `whatsapp_click` · `call_click` · `email_click` · `add_to_quote` · `form_step` · `faq_open` · `generate_lead` (Meta: `Lead`; WhatsApp/call: `Contact`).
Personal details (name, phone, email) are never sent to analytics.

## Deploying on Shopify (`/bulk`)

1. Upload `styles.css`, `config.js`, `main.js` and `rangoli.svg` to the theme's `assets/`, and update the paths (`{{ 'styles.css' | asset_url }}`).
2. Create a page template (for example `page.bulk.liquid`, or a custom section) with the `<body>` contents of `index.html`, and assign it to a page with the handle `bulk`.
3. Shopify's theme header and footer will wrap the page. Hide them on this template to keep ad traffic focused.
