/* ==========================================================================
   NEXTRO · DIWALI BULK ORDERS — page logic
   Sections: helpers · tracking · contacts · deadline · decor · products &
   quote tray · filters · FAQ · carousel · form · dock · motion
   (diya, LED lights, marigolds, lanterns, dock behaviour: components.js)
   ========================================================================== */
(function () {
  'use strict';

  const C = window.NEXTRO_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const canAnimate = !!(gsap && ScrollTrigger) && !reduceMotion;
  let lenis = null;

  const products = C.products || [];
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const inr = (n) => inrFmt.format(Math.round(n));
  const savePct = (p) => Math.round((1 - p.bulk / p.retail) * 100);
  const gstNote = (C.pricing && C.pricing.gstNote) || '+ GST';

  const store = {
    get(key, fallback) {
      try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
  };

  const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ------------------------------------------------------------------------
     Tracking
     ------------------------------------------------------------------------ */
  window.dataLayer = window.dataLayer || [];

  function track(event, params = {}) {
    window.dataLayer.push({ event, ...params });
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (typeof window.fbq === 'function') {
      if (event === 'generate_lead') window.fbq('track', 'Lead', params);
      else if (event === 'whatsapp_click' || event === 'call_click') window.fbq('track', 'Contact', params);
      else window.fbq('trackCustom', event, params);
    }
  }

  function loadTracking() {
    const t = C.tracking || {};
    if (t.ga4Id) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(t.ga4Id)}`;
      document.head.appendChild(s);
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', t.ga4Id);
    }
    if (t.metaPixelId) {
      /* eslint-disable */
      !function (f, b, e, v, n, t2, s2) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t2 = b.createElement(e); t2.async = !0; t2.src = v; s2 = b.getElementsByTagName(e)[0]; s2.parentNode.insertBefore(t2, s2); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', t.metaPixelId);
      window.fbq('track', 'PageView');
    }
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) track(el.dataset.track, { location: el.dataset.loc || '' });
  });

  /* ------------------------------------------------------------------------
     Contacts
     ------------------------------------------------------------------------ */
  const contact = C.contact || {};
  const waLink = (msg) => `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(msg || contact.whatsappMessage || '')}`;

  function applyContacts() {
    $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.waMsg); });
    $$('[data-tel]').forEach((a) => { a.href = `tel:${contact.phone}`; });
    $$('[data-mail]').forEach((a) => { a.href = `mailto:${contact.email}?subject=${encodeURIComponent('Diwali bulk order inquiry')}`; });
    $$('[data-phone-display]').forEach((el) => { el.textContent = contact.phoneDisplay; });
    $$('[data-email-display]').forEach((el) => { el.textContent = contact.email; });
    $$('[data-gst-note]').forEach((el) => { el.textContent = gstNote; });
    const minPrice = Math.min(...products.map((p) => p.bulk));
    $$('[data-min-price]').forEach((el) => { el.textContent = inr(minPrice); });
  }

  /* ------------------------------------------------------------------------
     Deadline: strip, dock, countdown, before/after copy
     ------------------------------------------------------------------------ */
  const campaign = C.campaign || {};
  const deadline = new Date(campaign.lastOrderDate);
  const clockOffset = campaign.nowOverride ? new Date(campaign.nowOverride).getTime() - Date.now() : 0;
  const now = () => new Date(Date.now() + clockOffset);

  function updateDeadline() {
    const diff = deadline - now();
    const after = !(diff > 0);
    root.classList.toggle('is-after', after);
    if (after) return false;

    const days = Math.floor(diff / 864e5);
    const label = days === 0 ? 'Last day to order!' : days === 1 ? '1 day left' : `${days} days left`;
    $$('[data-days-left]').forEach((el) => { el.textContent = label; });

    const pad = (n) => String(n).padStart(2, '0');
    const cd = {
      d: days,
      h: Math.floor((diff / 36e5) % 24),
      m: Math.floor((diff / 6e4) % 60),
      s: Math.floor((diff / 1e3) % 60),
    };
    Object.entries(cd).forEach(([k, v]) => {
      const el = $(`[data-cd="${k}"]`);
      if (el) el.textContent = pad(v);
    });
    return true;
  }

  function initDeadline() {
    $$('[data-last-label]').forEach((el) => { el.textContent = campaign.lastOrderLabel; });
    $$('[data-diwali-label]').forEach((el) => { el.textContent = campaign.diwaliLabel; });
    if (updateDeadline()) {
      const timer = setInterval(() => { if (!updateDeadline()) clearInterval(timer); }, 1000);
    }
  }

  /* ------------------------------------------------------------------------
     Festive decor now lives in components.js (NextroUI.diya / lights / marigold / dock)
     ------------------------------------------------------------------------ */
  const UI = window.NextroUI;

  /* ------------------------------------------------------------------------
     Products + quote tray
     ------------------------------------------------------------------------ */
  let quote = sanitizeQuote(store.get('nextro_quote', {}));

  function sanitizeQuote(q) {
    const out = {};
    Object.entries(q || {}).forEach(([id, qty]) => {
      const p = byId[id];
      const n = parseInt(qty, 10);
      if (p && n >= p.moq) out[id] = Math.min(n, 9999);
    });
    return out;
  }

  /* ---- Product cards (Figma 27:5690) ----
     Every dimension below is in the Figma card's own pixels (384 wide). U() turns a number into calc(n * var(--u)),
     where --u = card width / 384 (set in CSS) — so the artwork scales perfectly with the card on any screen. */
  const U = (n) => `calc(${n} * var(--u))`;
  const CARD_IMG = 'assets/img/cards/';
  const img = (src, alt, style = '') => `<img class="pc-fill" src="${CARD_IMG}${src}" alt="${alt}"${style ? ` style="${style}"` : ''} draggable="false" loading="lazy" decoding="async">`;
  const turned = (cx, cy, w, h, deg, inner) => `<div class="pc-abs" style="left:${U(cx)};top:${U(cy)};width:${U(w)};height:${U(h)};transform:translate(-50%,-50%) rotate(${deg}deg)">${inner}</div>`;
  const CARD_ART = {
    x300: () => `<div class="pc-abs" style="left:calc(50% + ${U(5.28)});top:${U(83.73)};width:${U(286.4)};height:${U(286.4)};transform:translateX(-50%)">${img('x300-product.png', 'Nextro X300 dashcam')}</div>`,
    x600: () => `<div class="pc-abs" style="left:${U(22.85)};top:${U(80.72)};width:${U(327.467)};height:${U(327.467)}">
        ${turned(163.7335, 163.7335, 263.512, 263.512, 16.49, img('x300-product.png', 'Nextro X600 dashcam'))}
        ${turned(247.162, 131.311, 115.724, 58.531, -18.71, `<div class="pc-clip"><img src="${CARD_IMG}x600-rear.png" alt="" style="position:absolute;left:0;top:-73.24%;width:100%;height:263.62%;max-width:none" draggable="false" loading="lazy" decoding="async"></div>`)}
        ${turned(221.723, 141.1605, 23.201, 3.839, -18.71, img('x600-detail.png', ''))}
      </div>`,
    x700: () => `<div class="pc-abs" style="left:50%;top:${U(98.13)};width:${U(314.133)};height:${U(314.133)};transform:translateX(-50%)">${img('x700-product.png', 'Nextro X700 dashcam')}</div>`,
    x900: () => `<div class="pc-abs" style="left:${U(61.6)};top:${U(139.68)};width:${U(260.653)};height:${U(180.372)}">${img('x900-product.png', 'Nextro X900 dashcam')}</div>`,
    n70: () => [
      turned(197.12, 245.06, 170.37, 162, 11.41, img('n70-body.png', 'Nextro N70 wireless adaptor')),
      turned(149.77, 279.33, 66.19, 52.1, 11.41, img('n70-plate.png', '', 'object-fit:fill')),
      `<div class="pc-abs" style="left:${U(138.39)};top:${U(236.09)};width:${U(35.607)};height:${U(35.607)};background:#0e0e0e"></div>`,
      turned(156.7, 260.16, 17.86, 24.504, -25.8, '<span style="position:absolute;inset:-4.36% -5.98%"><img class="pc-fill" src="assets/svg/figma/n70-ellipse-a.svg" alt="" style="object-fit:fill" draggable="false"></span>'),
      turned(156.72, 260.07, 21.52, 29.525, -25.8, '<img class="pc-fill" src="assets/svg/figma/n70-ellipse-b.svg" alt="" style="object-fit:fill" draggable="false">'),
    ].join(''),
    n50: () => [
      `<div class="pc-abs" style="left:${U(105.6)};top:${U(162.93)};width:${U(173.067)};height:${U(173.067)}">${img('n50-product.png', 'Nextro N50 wireless adaptor')}</div>`,
      turned(185.47, 267.58, 27.87, 6.73, 27.03, '<img class="pc-fill" src="assets/svg/figma/n50-mark-a.svg" alt="" style="object-fit:fill" draggable="false">'),
      turned(166.66, 258.09, 11.52, 6.47, 27.03, '<img class="pc-fill" src="assets/svg/figma/n50-mark-b.svg" alt="" style="object-fit:fill" draggable="false">'),
    ].join(''),
  };

  function cardHTML(p) {
    const c = p.card || { name: `Nextro ${p.name}`, bg: '' };
    const save = savePct(p);
    return `
      <article class="pcard" id="product-${p.id}" data-id="${p.id}" data-cat="${p.category}" data-reveal aria-label="${c.name}: ${inr(p.bulk)} per unit ${gstNote}, minimum ${p.moq} units, save up to ${save}%">
        <img class="pcard__bg" src="${c.bg}" alt="" width="1064" height="1478" loading="lazy" decoding="async" draggable="false">
        <div class="pcard__stage">
          ${(CARD_ART[p.id] || (() => ''))()}
          <div class="pcard__name"><p>${c.name}</p>${c.sub ? `<p class="pcard__name-sub">${c.sub}</p>` : ''}</div>
          <div class="pcard__band"><span aria-hidden="true">🪔</span> Save Upto ${save}%</div>
          <div class="pcard__flower">
            <span class="pcard__flower-art"><span><img src="assets/svg/figma/price-flower.svg" alt="" width="184" height="185" draggable="false"></span></span>
            <div class="pcard__flower-text">
              <div class="pcard__from"><p>Starting at</p><p class="pcard__amount">${inr(p.bulk)}</p></div>
              ${c.showMin === false ? '' : `<p class="pcard__min">MIN ${p.moq} Units</p>`}
            </div>
          </div>
          <div class="pcard__action" data-action>
            <button type="button" class="pcard__add" data-add aria-label="Add ${p.name} to quote (min. ${p.moq} units)">${icon('i-plus')} Add</button>
            <div class="pcard__stepper" hidden>
              <div class="stepper">
                <button type="button" data-dec aria-label="Decrease ${p.name} quantity">${icon('i-minus')}</button>
                <input type="number" inputmode="numeric" min="${p.moq}" max="9999" step="1" value="${p.moq}" aria-label="${p.name} quantity (min. ${p.moq})" data-qty>
                <button type="button" data-inc aria-label="Increase ${p.name} quantity">${icon('i-plus')}</button>
              </div>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderProducts() {
    const grid = $('[data-product-grid]');
    if (!grid) return;
    grid.innerHTML = products.map(cardHTML).join('');

    const counts = { all: products.length };
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    $$('[data-count-cat]').forEach((el) => { el.textContent = counts[el.dataset.countCat] || 0; });

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.pcard');
      if (!card) return;
      const p = byId[card.dataset.id];
      const current = quote[p.id] || 0;
      if (e.target.closest('[data-add]')) {
        setQty(p.id, p.moq);
        track('add_to_quote', { product: p.name, quantity: p.moq });
        const input = $('[data-qty]', card);
        if (input) input.focus({ preventScroll: true });
      } else if (e.target.closest('[data-inc]')) {
        setQty(p.id, current + 1);
      } else if (e.target.closest('[data-dec]')) {
        setQty(p.id, current - 1 < p.moq ? 0 : current - 1);
        if (!quote[p.id]) {
          const add = $('[data-add]', card);
          if (add) add.focus({ preventScroll: true });
        }
      }
    });

    grid.addEventListener('change', (e) => {
      const input = e.target.closest('[data-qty]');
      if (!input) return;
      const p = byId[input.closest('.pcard').dataset.id];
      const n = parseInt(input.value, 10);
      if (!n || n <= 0) setQty(p.id, 0);
      else setQty(p.id, Math.max(p.moq, n));
    });

    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('[data-qty]')) e.target.blur();
    });
  }

  function setQty(id, qty) {
    const prev = totals();
    if (qty > 0) quote[id] = Math.min(qty, 9999);
    else delete quote[id];
    store.set('nextro_quote', quote);
    updateQuoteUI(prev);
  }

  function totals() {
    const items = Object.entries(quote).map(([id, qty]) => ({ p: byId[id], qty }));
    return {
      items,
      count: items.length,
      units: items.reduce((s, it) => s + it.qty, 0),
      value: items.reduce((s, it) => s + it.qty * it.p.bulk, 0),
    };
  }

  const qtyBucket = (u) => (u < 10 ? '5–9' : u < 25 ? '10–24' : u < 50 ? '25–49' : u < 100 ? '50–99' : '100+');
  const quoteItemsText = (t) => t.items.map((it) => `${it.p.name} × ${it.qty}`).join(', ');

  function updateQuoteUI(prev) {
    const t = totals();

    // Cards
    $$('.pcard').forEach((card) => {
      const p = byId[card.dataset.id];
      const qty = quote[p.id] || 0;
      card.classList.toggle('in-quote', qty > 0);
      $('[data-add]', card).hidden = qty > 0;
      $('.pcard__stepper', card).hidden = qty === 0;
      const input = $('[data-qty]', card);
      if (qty && document.activeElement !== input) input.value = qty;
      $('[data-dec]', card).setAttribute('aria-label', qty === p.moq ? `Remove ${p.name} from quote` : `Decrease ${p.name} quantity`);
    });

    // Dock tray
    const dock = $('[data-dock]');
    if (dock) {
      dock.classList.toggle('has-items', t.count > 0);
      $('[data-tray-count]').textContent = t.units;
      $('[data-tray-summary]').innerHTML = `${t.count} product${t.count === 1 ? '' : 's'}<span class="hide-sm"> in your quote</span>`;
      $('[data-dock-cta-label]').textContent = t.count ? 'Get quote' : 'Get a Quote';
      const totalEl = $('[data-tray-total]');
      if (canAnimate && prev && prev.value !== t.value) {
        const o = { v: prev.value };
        gsap.to(o, { v: t.value, duration: 0.6, ease: 'power2.out', onUpdate: () => { totalEl.textContent = inr(o.v); } });
        if (t.count) gsap.fromTo('.dock__count', { scale: 1.35 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      } else {
        totalEl.textContent = inr(t.value);
      }
      updateDock();
    }

    // Form: selection summary + prefill
    const sel = $('[data-selection]');
    if (sel) {
      sel.hidden = t.count === 0;
      $('[data-selection-list]').innerHTML = t.items
        .map((it) => `<li><span>${it.p.name} ${it.p.variant} × ${it.qty}</span><span>${inr(it.qty * it.p.bulk)}</span></li>`)
        .join('');
      $('[data-selection-total]').innerHTML = `<span>Est. total · ${t.units} units</span><span>${inr(t.value)} <small>${gstNote}</small></span>`;
    }
    if (t.count) prefillFromQuote(t);
    const hidden = $('input[name="quote_items"]');
    if (hidden) hidden.value = quoteItemsText(t);
  }

  function prefillFromQuote(t) {
    const form = $('#quoteForm');
    if (!form) return;
    t.items.forEach((it) => {
      const cb = $(`input[name="products"][value="${it.p.name}"]`, form);
      if (cb) cb.checked = true;
    });
    const radio = $(`input[name="quantity"][value="${qtyBucket(t.units)}"]`, form);
    if (radio) radio.checked = true;
    clearError('products');
    clearError('quantity');
    updateMoqHint();
  }

  /* ------------------------------------------------------------------------
     Product filter
     ------------------------------------------------------------------------ */
  function setFilter(cat) {
    $$('[data-filter]').forEach((b) => {
      const on = b.dataset.filter === cat;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const shown = [];
    $$('.pcard').forEach((card) => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.style.display = show ? '' : 'none';
      if (show) shown.push(card);
    });
    if (canAnimate) {
      gsap.fromTo(shown, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
      ScrollTrigger.refresh();
    }
  }

  function initFilters() {
    $$('[data-filter]').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  }

  /* ------------------------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------------------------ */
  function initAccordion() {
    $$('.acc__btn').forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if (!canAnimate) { panel.hidden = open; return; }
        if (open) {
          gsap.to(panel, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.inOut', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
        } else {
          panel.hidden = false;
          gsap.fromTo(panel, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power3.out', onComplete: () => { gsap.set(panel, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
        }
        if (!open) track('faq_open', { question: btn.textContent.trim() });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Reviews carousel
     ------------------------------------------------------------------------ */
  function initCarousel() {
    const scroller = $('[data-carousel]');
    if (!scroller) return;
    const prev = $('[data-carousel-prev]');
    const next = $('[data-carousel-next]');
    const stepSize = () => {
      const card = $('.review', scroller);
      return card ? card.getBoundingClientRect().width + 20 : 400;
    };
    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth - 4;
      prev.disabled = scroller.scrollLeft <= 4;
      next.disabled = scroller.scrollLeft >= max;
    };
    prev.addEventListener('click', () => scroller.scrollBy({ left: -stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => scroller.scrollBy({ left: stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ------------------------------------------------------------------------
     Multi-step inquiry form
     ------------------------------------------------------------------------ */
  const form = $('#quoteForm');
  let step = 1;
  const STEP_NAMES = ['Your order', 'Your details', 'Final touches'];

  function renderProductChoices() {
    const wrap = $('[data-product-choices]');
    if (!wrap) return;
    wrap.innerHTML = products.map((p) => {
      const chip = p.chip || { label: p.variant, image: '' };
      return `
      <label class="pchoice">
        <input type="checkbox" name="products" value="${p.name}" data-id="${p.id}">
        <span>${chip.image ? `<img src="${chip.image}" alt="" width="44" height="44" loading="lazy" decoding="async">` : ''}<span class="pchoice__txt"><b>${p.name}</b><small>${chip.label}</small></span></span>
      </label>`;
    }).join('');
  }

  const fieldInputs = (name) => $$(`[name="${name}"]`, form);

  function setError(name, msg) {
    const err = $(`#err-${name}`);
    if (err) err.textContent = msg;
    fieldInputs(name).forEach((el) => el.setAttribute('aria-invalid', 'true'));
    if (name === 'quantity') $('.choice-row', form).setAttribute('aria-invalid', 'true');
  }

  function clearError(name) {
    if (!form) return;
    const err = $(`#err-${name}`);
    if (err) err.textContent = '';
    fieldInputs(name).forEach((el) => el.removeAttribute('aria-invalid'));
    if (name === 'quantity') $('.choice-row', form).removeAttribute('aria-invalid');
  }

  const normalizePhone = (v) => v.replace(/[^\d]/g, '').replace(/^(91|0)(?=\d{10}$)/, '');

  const validators = {
    1: [
      ['products', () => fieldInputs('products').some((c) => c.checked) || 'Pick at least one product, or choose "Not sure".'],
      ['quantity', () => fieldInputs('quantity').some((c) => c.checked) || 'Select a quantity range.'],
      ['city', () => form.elements.city.value.trim().length >= 2 || 'Enter your delivery city.'],
    ],
    2: [
      ['company', () => form.elements.company.value.trim().length >= 2 || 'Enter your company name.'],
      ['name', () => form.elements.name.value.trim().length >= 2 || 'Enter your name.'],
      ['phone', () => /^[6-9]\d{9}$/.test(normalizePhone(form.elements.phone.value)) || 'Enter a valid 10-digit mobile number.'],
      ['email', () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.elements.email.value.trim()) || 'Enter a valid email address.'],
    ],
    3: [],
  };

  function validateStep(n) {
    let firstInvalid = null;
    validators[n].forEach(([name, check]) => {
      const result = check();
      if (result === true) clearError(name);
      else {
        setError(name, result);
        if (!firstInvalid) firstInvalid = fieldInputs(name)[0];
      }
    });
    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      const fieldEl = firstInvalid.closest('.field');
      if (canAnimate && fieldEl) gsap.fromTo(fieldEl, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return false;
    }
    return true;
  }

  function showStep(n) {
    const current = $(`.qstep[data-step="${step}"]`, form);
    const target = $(`.qstep[data-step="${n}"]`, form);
    const dir = n > step ? 1 : -1;
    step = n;

    current.hidden = true;
    current.classList.remove('is-active');
    target.hidden = false;
    target.classList.add('is-active');
    if (canAnimate) gsap.fromTo(target, { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' });

    $$('[data-progress]').forEach((li) => {
      const i = parseInt(li.dataset.progress, 10);
      li.classList.toggle('is-active', i === n);
      li.classList.toggle('is-done', i < n);
    });
    const bar = $('[data-progress-bar]');
    if (bar) bar.style.width = `${(n / 3) * 100}%`;
    const announcer = $('[data-step-announcer]');
    if (announcer) announcer.textContent = `Step ${n} of 3: ${STEP_NAMES[n - 1]}`;

    const card = $('.form-card');
    if (card && card.getBoundingClientRect().top < headerHeight()) scrollToEl(card, null, -(headerHeight() + 16));

    const first = $('input:not([type="hidden"]), textarea, select', target);
    if (first && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
    track('form_step', { step: n });
  }

  function updateMoqHint() {
    const hint = $('[data-moq-hint]');
    if (!hint || !form) return;
    const qty = (fieldInputs('quantity').find((r) => r.checked) || {}).value;
    const tenMin = fieldInputs('products')
      .filter((c) => c.checked && c.dataset.id && byId[c.dataset.id].moq > 5)
      .map((c) => c.value);
    if (qty === '5–9' && tenMin.length) {
      hint.textContent = `${tenMin.join(', ')} start${tenMin.length === 1 ? 's' : ''} at 10 units. We'll suggest the best mix in your quote.`;
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
  }

  function readUtms() {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    let utm = {};
    try { utm = JSON.parse(window.sessionStorage.getItem('nextro_utm') || '{}'); } catch (e) { /* ignore */ }
    keys.forEach((k) => { if (params.get(k)) utm[k] = params.get(k); });
    try { window.sessionStorage.setItem('nextro_utm', JSON.stringify(utm)); } catch (e) { /* ignore */ }
    keys.forEach((k) => {
      const input = form && form.elements[k];
      if (input && utm[k]) input.value = utm[k];
    });

    const src = (utm.utm_source || '').toLowerCase();
    const map = [
      [/^(ig|insta)/, 'Instagram'],
      [/^(fb|facebook|meta)/, 'Facebook'],
      [/^(li|linkedin)/, 'LinkedIn'],
      [/^google/, 'Google search'],
      [/^(wa|whatsapp)/, 'WhatsApp'],
      [/^(email|newsletter|mail)/, 'Email'],
    ];
    const hit = map.find(([re]) => re.test(src));
    if (hit && form) form.elements.source.value = hit[1];
  }

  function collect() {
    const fd = new FormData(form);
    return {
      products: fd.getAll('products'),
      quantity: fd.get('quantity'),
      city: (fd.get('city') || '').trim(),
      company: (fd.get('company') || '').trim(),
      name: (fd.get('name') || '').trim(),
      phone: `+91${normalizePhone(fd.get('phone') || '')}`,
      email: (fd.get('email') || '').trim(),
      addons: fd.getAll('addons'),
      packaging: (fd.get('packaging') || '').trim(),
      source: fd.get('source') || '',
      quote_items: fd.get('quote_items') || '',
      quote_estimate: totals().value || '',
      utm_source: fd.get('utm_source') || '',
      utm_medium: fd.get('utm_medium') || '',
      utm_campaign: fd.get('utm_campaign') || '',
      utm_content: fd.get('utm_content') || '',
      utm_term: fd.get('utm_term') || '',
      page: window.location.href,
      submitted_at: new Date().toISOString(),
    };
  }

  async function submit(data) {
    const endpoint = C.form && C.form.endpoint;
    if (!endpoint) {
      // Front-end only: simulate a successful submit so the full flow can be reviewed.
      console.info('[Nextro] Inquiry (no endpoint configured):', data);
      await new Promise((r) => setTimeout(r, 900));
      return;
    }
    // text/plain avoids a CORS preflight (works with Google Apps Script & most webhooks)
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
    if (!res.ok && res.type !== 'opaque') throw new Error(`HTTP ${res.status}`);
  }

  function initForm() {
    if (!form) return;
    renderProductChoices();
    readUtms();

    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-next]')) {
        if (validateStep(step)) showStep(step + 1);
      } else if (e.target.closest('[data-back]')) {
        showStep(step - 1);
      }
    });

    form.addEventListener('input', (e) => {
      const name = e.target.name;
      if (name && e.target.getAttribute('aria-invalid') === 'true') clearError(name);
      if (name === 'products' || name === 'quantity') { clearError(name); updateMoqHint(); }
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'products' || e.target.name === 'quantity') { clearError(e.target.name); updateMoqHint(); }
    });

    // Enter on steps 1–2 advances instead of submitting
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && step < 3 && e.target.tagName === 'INPUT') {
        e.preventDefault();
        if (validateStep(step)) showStep(step + 1);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (step < 3) { if (validateStep(step)) showStep(step + 1); return; }
      for (const n of [1, 2]) {
        if (!validators[n].every(([, check]) => check() === true)) { showStep(n); validateStep(n); return; }
      }

      const btn = $('[data-submit]', form);
      const errBox = $('[data-form-error]', form);
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';
      errBox.hidden = true;

      const data = collect();
      try {
        await submit(data);
        track('generate_lead', { products: data.products.join(', '), quantity: data.quantity, city: data.city });
        onSuccess(data, btn);
      } catch (err) {
        console.error('[Nextro] Submit failed', err);
        errBox.innerHTML = `Something went wrong sending your request. Please try again, or <a href="${waLink(`Hi Nextro! I'd like a Diwali bulk quote. Company: ${data.company}, Products: ${data.products.join(', ')}, Qty: ${data.quantity}, City: ${data.city}`)}" target="_blank" rel="noopener">send it on WhatsApp</a>.`;
        errBox.hidden = false;
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });
  }

  function onSuccess(data, fromEl) {
    const rect = fromEl.getBoundingClientRect();
    const success = $('[data-success]');
    const waBtn = $('[data-success-wa]');
    const msg = [
      "Hi Nextro! I just requested a Diwali bulk quote.",
      `Company: ${data.company}`,
      `Products: ${data.products.join(', ')}`,
      data.quote_items ? `Quote list: ${data.quote_items}` : '',
      `Quantity: ${data.quantity}`,
      `City: ${data.city}`,
    ].filter(Boolean).join('\n');
    if (waBtn) waBtn.href = waLink(msg);

    $('.form-progress').hidden = true;
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });

    quote = {};
    store.set('nextro_quote', quote);
    updateQuoteUI();

    if (canAnimate) {
      gsap.from(success.children, { opacity: 0, y: 20, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  function burst(x, y) {
    const colors = ['#FFB703', '#FF8A00', '#FFD66B', '#E85D04', '#FF5C8A'];
    for (let i = 0; i < 36; i++) {
      const dot = document.createElement('span');
      dot.className = 'spark-dot';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.background = colors[i % colors.length];
      document.body.appendChild(dot);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 160;
      gsap.to(dot, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40,
        scale: 0.2 + Math.random(),
        opacity: 0,
        duration: 0.9 + Math.random() * 0.7,
        ease: 'power3.out',
        onComplete: () => dot.remove(),
      });
    }
  }

  /* ------------------------------------------------------------------------
     Header + dock + smooth anchors
     ------------------------------------------------------------------------ */
  const headerHeight = () => ($('.header') ? $('.header').offsetHeight : 68);
  let dockUI = null;
  const updateDock = () => { if (dockUI) dockUI.update(); };

  function initDock() {
    dockUI = UI.dock.mount($('[data-dock]'), { after: '.hero', hideOn: ['#quote', '#finale', '.footer'] });

    const header = $('.header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function scrollToEl(el, done, offset) {
    const off = offset !== undefined ? offset : -(headerHeight() + 12);
    if (lenis) {
      lenis.scrollTo(el, { offset: off, duration: 1.2, onComplete: done });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY + off;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (done) setTimeout(done, reduceMotion ? 0 : 600);
    }
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#' || id === '#main') return;
      const target = id === '#top' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      if (id === '#top') {
        if (lenis) lenis.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      scrollToEl(target);
    });
  }

  /* ------------------------------------------------------------------------
     Flags (logos, counter)
     ------------------------------------------------------------------------ */
  function applyFlags() {
    const f = C.flags || {};
    const logosWrap = $('[data-logos]');
    if (logosWrap && f.showLogos && (C.logos || []).length) {
      $('[data-logo-row]').innerHTML = C.logos.map((l) => `<img src="${l.src}" alt="${l.name}" loading="lazy">`).join('');
      logosWrap.hidden = false;
    }
    const counter = $('[data-counter]');
    if (counter && f.showCounter && f.counterValue > 0) {
      $('[data-counter-value]').textContent = f.counterValue;
      counter.hidden = false;
    }
  }

  /* ------------------------------------------------------------------------
     Motion (GSAP + ScrollTrigger + Lenis)
     ------------------------------------------------------------------------ */
  function initLights() {
    const header = $('[data-lights="header"]');
    const finale = $('[data-lights="finale"]');
    UI.lights.mount(header);                          // pinned garland: draws + twinkles
    UI.lights.mount(finale, { twinkle: false });      // closing garland: draws, then lights up on scroll
    UI.lights.lightUp(finale, { trigger: '#finale', start: 'top 70%' });
  }

  // the pinned garland hands over to the closing section's own garland
  function initLightsHandoff() {
    UI.lights.stickyHandoff($('.lights--header'), $('#finale'));
  }

  function initMotion() {
    if (!canAnimate) return;
    root.classList.add('has-motion');

    // Smooth scroll
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Hero intro: the garland drops in while the artwork eases into place
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.lights--header svg', { y: -40, opacity: 0, duration: 1 }, 0)
      .from('.hero__art', { scale: 1.05, opacity: 0, duration: 1.5, ease: 'power2.out', transformOrigin: '50% 40%' }, 0);

    // Idle loops
    UI.diya.animate();
    UI.marigold.animate();

    // Scroll reveals (hero handled by the intro timeline)
    const reveals = $$('[data-reveal]').filter((el) => !el.closest('.hero'));
    gsap.set(reveals, { opacity: 0, y: 32 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true, clearProps: 'transform' }),
    });

    // Trust counter
    $$('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = `${Math.round(o.v)}${el.dataset.suffix || ''}`; } }),
      });
    });

    // Sweets vs Nextro
    const cmp = $('[data-compare]');
    if (cmp) {
      gsap.from('.compare-card', { opacity: 0, y: 40, duration: 0.9, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: cmp, start: 'top 80%', once: true } });
      gsap.from('.compare__vs', { scale: 0, rotation: -90, duration: 0.7, ease: 'back.out(2)', scrollTrigger: { trigger: cmp, start: 'top 70%', once: true } });
      gsap.timeline({ scrollTrigger: { trigger: '.compare__grid', start: 'top 70%', end: 'bottom 55%', scrub: 0.6 } })
        .to('[data-compare-sweets]', { filter: 'grayscale(1)', opacity: 0.55, scale: 0.97, ease: 'none' }, 0)
        .to('[data-compare-nextro]', { scale: 1.03, boxShadow: '0 40px 90px -30px rgba(255, 138, 0, .75)', ease: 'none' }, 0);
    }

    // How it works: line draws on scroll
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      gsap.fromTo('[data-steps-fill]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-steps]', start: 'top 75%', end: 'bottom 55%', scrub: 0.5 } });
    });
    mm.add('(max-width: 860px)', () => {
      gsap.fromTo('[data-steps-fill]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '[data-steps]', start: 'top 70%', end: 'bottom 60%', scrub: 0.5 } });
    });
    gsap.from('.step', { opacity: 0, y: 30, duration: 0.7, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '[data-steps]', start: 'top 80%', once: true } });
    gsap.from('.step__icon', { scale: 0.4, duration: 0.7, stagger: 0.15, ease: 'back.out(2.2)', scrollTrigger: { trigger: '[data-steps]', start: 'top 80%', once: true } });

    // Finale
    gsap.from('.finale__title, .finale__sub, .countdown > div, .finale__ctas', { opacity: 0, y: 30, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '#finale', start: 'top 65%', once: true } });
    gsap.from('.finale__diyas .diya', { scale: 0, opacity: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.1, ease: 'back.out(2.4)', scrollTrigger: { trigger: '.finale__diyas', start: 'top 92%', once: true } });

    // Recalculate once fonts and images settle
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    if (canAnimate) gsap.registerPlugin(ScrollTrigger);
    loadTracking();
    applyContacts();
    initDeadline();
    applyFlags();
    UI.diya.render();
    UI.marigold.render();
    renderProducts();
    initForm();
    updateQuoteUI();
    initFilters();
    initAccordion();
    initCarousel();
    initDock();
    initAnchors();
    initLights();
    initLightsHandoff();
    initMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
