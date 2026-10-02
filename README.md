# Nextro Diwali Bulk Orders — Landing Page

Static landing page for the Diwali corporate/bulk gifting campaign (`getnextro.com/bulk`).
Stack: HTML, CSS, vanilla JS, [GSAP 3](https://gsap.com) + ScrollTrigger, [Lenis](https://lenis.darkroom.engineering) — all via CDN, no build step.

```
index.html               page markup (all sections, SVG sprite)
assets/css/styles.css    design tokens + all styles
assets/js/config.js      ★ prices, MOQs, dates, contacts, flags, form endpoint, tracking IDs
assets/js/main.js        interactions + animation
assets/svg/rangoli.svg   background texture
assets/img/              drop custom graphics here
```

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
| `products[]` | Name, variant, tagline, spec chips, `retail` (struck-through), `bulk` (per unit), `moq`, badge, image. |
| `flags.showLogos` + `logos[]` | Shows a "Trusted by teams at" logo row in the hero. |
| `flags.showCounter` + `counterValue` | Shows the "X companies trusted Nextro this Diwali" badge. |
| `flags.showReferral` | ₹500 referral band. |
| `form.endpoint` | Where inquiries are POSTed (see below). Empty = simulated success. |
| `tracking.ga4Id` / `metaPixelId` | Loads GA4 / Meta Pixel when set. |

Copy for sections, FAQs and testimonials is plain HTML in `index.html`. If the asset files change, bump `?v=1` on the CSS/JS links.

## Product photos

The six product images live in `assets/img/Product Images/` and are used **exactly as provided**: no cropping, recolouring, conversion or renaming. They are 1086×1448 (3:4 portrait), and every frame on the page (product cards, "who it's for" picks, form chips) uses that same ratio so nothing is cut off. To change a photo, edit that product's `image` path in `assets/js/config.js` (paths with spaces are URL-encoded automatically). `nextro x700 with rear camera.png` is in the folder but not currently used.

## Swapping in custom graphics

All festive art is coded placeholder art, built so finished graphics can drop straight in:

- **Hero composition**: replace the inside of `.hero__visual` with `<img src="assets/img/hero-gifts.webp" alt="" class="hero__art">`. A square image around 1100×1100 works best.
- **Gift boxes**: the `#gift` symbol in the SVG sprite at the top of `index.html`. Colours come from the `.gift--saffron / --marigold / --night` classes.
- **Diyas**: `DIYA_SVG` in `main.js`. Flames flicker via the `.diya__flame` group.
- **Fairy lights / marigold strands**: generated in `main.js` (`buildLights`, `renderMarigolds`).

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
`cta_click` · `whatsapp_click` · `call_click` · `email_click` · `add_to_quote` · `usecase_select` · `form_step` · `faq_open` · `generate_lead` (Meta: `Lead`; WhatsApp/call: `Contact`).
Personal details (name, phone, email) are never sent to analytics.

## Deploying on Shopify (`/bulk`)

1. Upload `styles.css`, `config.js`, `main.js` and `rangoli.svg` to the theme's `assets/`, and update the paths (`{{ 'styles.css' | asset_url }}`).
2. Create a page template (for example `page.bulk.liquid`, or a custom section) with the `<body>` contents of `index.html`, and assign it to a page with the handle `bulk`.
3. Shopify's theme header and footer will wrap the page. Hide them on this template to keep ad traffic focused.
