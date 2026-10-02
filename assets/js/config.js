/* ==========================================================================
   NEXTRO DIWALI BULK — SINGLE SOURCE OF TRUTH
   Edit prices, MOQs, dates, contacts and feature flags here.
   Everything on the page that depends on these values reads from this file.
   ========================================================================== */

window.NEXTRO_CONFIG = {
  campaign: {
    // Last date to order for guaranteed Diwali delivery (IST)
    lastOrderDate: '2026-11-01T23:59:59+05:30',
    lastOrderLabel: '1 Nov',
    diwaliLabel: '8 Nov',
    // Preview the post-deadline (year-round) copy by setting a date here,
    // e.g. '2026-11-02T10:00:00+05:30'. Leave null in production.
    nowOverride: null,
  },

  contact: {
    phoneDisplay: '+91 90969 60651',
    phone: '+919096960651',
    whatsapp: '919096960651', // country code + number, no "+"
    whatsappMessage: "Hi Nextro! I'd like a quote for Diwali bulk gifting.",
    email: 'bulk@getnextro.com',
    hours: 'Mon–Fri, 9am–5pm',
  },

  form: {
    // Leave empty to simulate a successful submit (front-end only).
    // Set to a URL that accepts a JSON POST (Apps Script, Zapier, your API…)
    endpoint: '',
  },

  flags: {
    showLogos: false,      // "Trusted by teams at" logo strip in the hero
    showCounter: false,    // "X companies trusted Nextro this Diwali" badge
    counterValue: 0,
    showReferral: true,    // ₹500 referral band
  },

  // Company logos for the trust strip (only shown when flags.showLogos = true)
  logos: [
    // { name: 'Acme Corp', src: 'assets/img/logos/acme.svg' },
  ],

  pricing: {
    gstNote: '+ GST',
  },

  cdn: 'https://cdn.shopify.com/s/files/1/0793/0137/8271/files/',

  products: [
    {
      id: 'x300',
      name: 'X300',
      variant: 'SoloView',
      category: 'dashcam',
      tagline: 'The practical gift. Loved by every driver.',
      specs: ['2K QHD recording', '145° wide view', 'Wi-Fi app + voice control'],
      retail: 2999,
      bulk: 2850,
      moq: 10,
      badge: 'Best value',
      image: 'Hero-img.webp?v=1775712704',
      url: 'https://getnextro.com/products/nextro-dashcam-x300',
    },
    {
      id: 'x600',
      name: 'X600',
      variant: 'DualVision',
      category: 'dashcam',
      tagline: 'Front and rear. Complete coverage.',
      specs: ['4K front + 1K rear', '24-hr parking monitor', 'Voice control'],
      retail: 5999,
      bulk: 4999,
      moq: 10,
      badge: '',
      image: 'Hero-img_6a2f9ace-0941-45d6-b8a9-40cde6a7996d.webp?v=1775713000',
      url: 'https://getnextro.com/products/nextro-dashcam-x600',
    },
    {
      id: 'x700',
      name: 'X700',
      variant: 'DualVision Plus',
      category: 'dashcam',
      tagline: 'The premium choice. Sony STARVIS night vision.',
      specs: ['Sony STARVIS 4K', 'GPS + ADAS alerts', '3.2" IPS screen'],
      retail: 9999,
      bulk: 8499,
      moq: 5,
      badge: 'Premium pick',
      image: 'Frame1707478433.webp?v=1775713186',
      url: 'https://getnextro.com/products/nextro-dashcam-x700-dualvision-plus',
    },
    {
      id: 'x900',
      name: 'X900',
      variant: 'TriVision',
      category: 'dashcam',
      tagline: 'The flagship. Nothing missed.',
      specs: ['Front + rear + cabin', '4K Sony STARVIS', 'GPS + ADAS alerts'],
      retail: 13499,
      bulk: 10999,
      moq: 5,
      badge: 'Flagship',
      image: '1st-image.webp?v=1775713449',
      url: 'https://getnextro.com/products/nextro-dashcam-x900-trivision',
    },
    {
      id: 'n70',
      name: 'N70',
      variant: 'Wireless Adaptor · Glass',
      category: 'adaptor',
      tagline: 'Wireless CarPlay. The tech gift.',
      specs: ['CarPlay + Android Auto', 'Dual-band 5GHz Wi-Fi', 'Premium glass finish'],
      retail: 2249,
      bulk: 1599,
      moq: 10,
      badge: 'Tech gift',
      image: 'opyxg4h0wiuf74ikchjs.webp?v=1780482168',
      url: 'https://getnextro.com/products/nextro-n70-2-in-1-wireless-adapter-for-carplay-android-auto-glass',
    },
    {
      id: 'n50',
      name: 'N50',
      variant: 'Wireless Adaptor',
      category: 'adaptor',
      tagline: 'Wireless CarPlay. Accessible price.',
      specs: ['CarPlay + Android Auto', 'Plug & play in 2 min', 'OTA updates'],
      retail: 1799,
      bulk: 1549,
      moq: 10,
      badge: '',
      image: 'ryrwpecnzammpeuls0rj.webp?v=1780482009',
      url: 'https://getnextro.com/products/nextro-n50-2-in-1-wireless-adapter-for-carplay-android-auto-plastic',
    },
  ],

  // Analytics — leave empty until IDs are ready. Events are always pushed to window.dataLayer.
  tracking: {
    ga4Id: '',        // e.g. 'G-XXXXXXX'
    metaPixelId: '',  // e.g. '1234567890'
  },
};
