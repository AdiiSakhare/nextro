/* ==========================================================================
   NEXTRO · DIWALI BULK ORDERS — page logic
   Sections: helpers · tracking · contacts · deadline · decor · products &
   quote tray · tabs · filters · FAQ · carousel · form · dock · motion
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
  const imgUrl = (p, w) => `${C.cdn}${p.image}&width=${w}`;
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
    $$('[data-hours]').forEach((el) => { el.textContent = contact.hours; });
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
     Festive decor (placeholders until custom graphics arrive)
     ------------------------------------------------------------------------ */
  const DIYA_SVG = `
    <svg viewBox="0 0 120 110" aria-hidden="true" focusable="false">
      <circle class="diya__glow" cx="60" cy="38" r="40" fill="url(#g-flame-glow)"/>
      <g class="diya__flame">
        <path d="M60 6c9 15 15 26 13 36-1.6 8-7 12-13 12s-11.4-4-13-12c-2-10 4-21 13-36Z" fill="url(#g-flame)"/>
        <path d="M60 27c4 7 7 12 6 17-.8 4-3.4 6-6 6s-5.2-2-6-6c-1-5 2-10 6-17Z" fill="#FFF6CC"/>
      </g>
      <path d="M60 54v7" stroke="#5A3A1E" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M6 62c18-6 90-6 108 0-3 26-24 42-54 42S9 88 6 62Z" fill="url(#g-diya)"/>
      <path d="M6 62c18-6 90-6 108 0-18 7-90 7-108 0Z" fill="#7A2A0A"/>
      <path d="M22 80c12 5 64 5 76 0" stroke="#FFC21A" stroke-width="3.5" stroke-linecap="round" fill="none" stroke-dasharray=".5 9"/>
      <path d="M32 93c10 3 46 3 56 0" stroke="#FFD66B" stroke-width="2" stroke-linecap="round" fill="none" opacity=".55"/>
    </svg>`;

  function renderDiyas() {
    $$('[data-diya]').forEach((el) => { el.innerHTML = DIYA_SVG; });
  }

  const BULB_COLORS = [
    { fill: '#FFC21A', glow: 'a' },
    { fill: '#FF8A00', glow: 'b' },
    { fill: '#FF5C8A', glow: 'c' },
    { fill: '#FFF1C9', glow: 'd' },
  ];
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function buildLights(el) {
    const w = el.clientWidth;
    const h = el.clientHeight || 110;
    if (!w) return;
    const small = w < 640;
    const swags = small ? 2 : w < 1100 ? 3 : 4;
    const spacing = small ? 44 : 60;
    const top = 4;
    const sag = h * (small ? 0.34 : 0.42);
    const seg = (w + 20) / swags;

    let d = `M -10 ${top}`;
    for (let i = 0; i < swags; i++) {
      const x0 = -10 + i * seg;
      const x1 = x0 + seg;
      d += ` Q ${(x0 + x1) / 2} ${top + sag * 2} ${x1} ${top}`;
    }

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'wire');
    svg.appendChild(path);
    el.replaceChildren(svg);

    const total = path.getTotalLength();
    let i = 0;
    for (let l = spacing / 2; l < total; l += spacing, i++) {
      const pt = path.getPointAtLength(l);
      if (pt.x < -4 || pt.x > w + 4) continue;
      const c = BULB_COLORS[i % BULB_COLORS.length];
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'bulb');
      g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${((i % 3) - 1) * 8})`);
      g.innerHTML = `
        <circle class="bulb__glow" cx="0" cy="9" r="17" fill="url(#g-bulb-${c.glow})"/>
        <rect x="-2.6" y="-1" width="5.2" height="5" rx="1.2" fill="#6B5240"/>
        <ellipse class="bulb__glass" cx="0" cy="9.5" rx="4.6" ry="6.4" fill="${c.fill}"/>
        <ellipse cx="-1.4" cy="7.4" rx="1.2" ry="2" fill="#fff" opacity=".6"/>`;
      svg.appendChild(g);
    }
  }

  function renderMarigolds() {
    $$('[data-marigold]').forEach((el) => {
      const n = parseInt(el.dataset.marigold, 10) || 5;
      const step = 24;
      const h = 12 + n * step + 18;
      let flowers = '';
      for (let i = 0; i < n; i++) {
        const y = 18 + i * step;
        const outer = i % 2 ? '#FFB703' : '#FF8A00';
        const inner = i % 2 ? '#F59E0B' : '#E8590C';
        flowers += `<circle cx="14" cy="${y}" r="10.5" fill="${outer}"/><circle cx="14" cy="${y}" r="6.5" fill="${inner}" opacity=".85"/><circle cx="14" cy="${y}" r="2.5" fill="#9A3412"/>`;
      }
      const tail = 18 + (n - 1) * step + 12;
      el.innerHTML = `<svg width="28" height="${h}" viewBox="0 0 28 ${h}" aria-hidden="true"><path d="M14 0V${tail}" stroke="#E7C27A" stroke-width="1.2"/>${flowers}<path d="M14 ${tail}c-5 4-6 9-2 14 1-5 4-8 2-14Zm0 0c5 4 6 9 2 14-1-5-4-8-2-14Z" fill="#3F8F3A"/></svg>`;
    });
  }

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

  function cardHTML(p) {
    return `
      <article class="pcard" id="product-${p.id}" data-id="${p.id}" data-cat="${p.category}" data-reveal>
        <div class="pcard__media">
          <span class="pcard__moq">Min. ${p.moq} units</span>
          ${p.badge ? `<span class="pcard__badge">${p.badge}</span>` : ''}
          <img src="${imgUrl(p, 640)}" srcset="${imgUrl(p, 420)} 420w, ${imgUrl(p, 640)} 640w, ${imgUrl(p, 900)} 900w" sizes="(max-width: 640px) 92vw, (max-width: 1040px) 46vw, 380px" alt="Nextro ${p.name} ${p.variant}" width="400" height="469" loading="lazy" decoding="async">
        </div>
        <div class="pcard__body">
          <div class="pcard__title">
            <h3>${p.name}</h3><span>${p.variant}</span>
            <a class="pcard__link" href="${p.url}" target="_blank" rel="noopener">Specs ${icon('i-arrow')}</a>
          </div>
          <p class="pcard__tag">${p.tagline}</p>
          <ul class="pcard__specs">${p.specs.map((s) => `<li>${s}</li>`).join('')}</ul>
          <div class="pcard__price">
            <div>
              <span class="pcard__label">Bulk price</span>
              <span class="pcard__amount">${inr(p.bulk)}</span><span class="pcard__per">/unit ${gstNote}</span>
            </div>
            <div class="pcard__retail">
              <span>Retail <s>${inr(p.retail)}</s></span>
              <span class="pcard__save">Save ${savePct(p)}%</span>
            </div>
          </div>
          <div class="pcard__action" data-action>
            <button type="button" class="btn btn--dark pcard__add" data-add>${icon('i-plus')} Add to quote</button>
            <div class="pcard__stepper" hidden>
              <p class="stepper__label"><span>Quantity (min. ${p.moq})</span><b>${icon('i-check')} In your quote</b></p>
              <div class="stepper">
                <button type="button" data-dec aria-label="Decrease ${p.name} quantity">${icon('i-minus')}</button>
                <input type="number" inputmode="numeric" min="${p.moq}" max="9999" step="1" value="${p.moq}" aria-label="${p.name} quantity" data-qty>
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
      $('[data-tray-summary]').textContent = `${t.count} product${t.count === 1 ? '' : 's'} in your quote`;
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
     Use-case tabs
     ------------------------------------------------------------------------ */
  let activeUseCase = '';

  function renderPicks() {
    $$('.tab-panel').forEach((panel) => {
      const ids = (panel.dataset.picks || '').split(',').map((s) => s.trim()).filter((id) => byId[id]);
      const slot = $('[data-picks-slot]', panel);
      if (!slot) return;
      slot.innerHTML = `
        <p class="picks__label">Best picks</p>
        <div class="picks__grid">
          ${ids.map((id) => {
            const p = byId[id];
            return `
              <button type="button" class="pick" data-goto="${p.id}">
                <span class="pick__media"><img src="${imgUrl(p, 420)}" alt="" width="400" height="469" loading="lazy" decoding="async"></span>
                <span class="pick__name">${p.name}<small>${p.variant}</small></span>
                <span class="pick__price">${inr(p.bulk)}<small>/unit · min. ${p.moq}</small></span>
                <span class="pick__go">See details ${icon('i-arrow')}</span>
              </button>`;
          }).join('')}
        </div>`;
    });
  }

  function initTabs() {
    const wrap = $('[data-tabs]');
    if (!wrap) return;
    const tabs = $$('[role="tab"]', wrap);
    const panels = $$('[role="tabpanel"]', wrap);
    activeUseCase = panels[0] ? panels[0].dataset.usecase : '';

    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => {
        const on = p.id === tab.getAttribute('aria-controls');
        if (on && p.hidden) {
          p.hidden = false;
          activeUseCase = p.dataset.usecase;
          if (canAnimate) {
            gsap.fromTo(p.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
          }
        } else if (!on) {
          p.hidden = true;
        }
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      track('usecase_select', { usecase: activeUseCase });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    wrap.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-goto]');
      if (pick) goToProduct(pick.dataset.goto);

      const cta = e.target.closest('[data-quote-usecase]');
      if (cta) {
        const panel = cta.closest('.tab-panel');
        const useCase = $('input[name="use_case"]');
        if (useCase) useCase.value = panel.dataset.usecase;
        const anyChecked = $$('input[name="products"]:checked').length > 0;
        if (!anyChecked) {
          (panel.dataset.picks || '').split(',').forEach((id) => {
            const p = byId[id.trim()];
            const cb = p && $(`input[name="products"][value="${p.name}"]`);
            if (cb) cb.checked = true;
          });
          updateMoqHint();
        }
        track('cta_click', { location: 'usecase', usecase: panel.dataset.usecase });
      }
    });
  }

  function goToProduct(id) {
    const card = $(`#product-${id}`);
    if (!card) return;
    if (card.style.display === 'none') setFilter('all');
    scrollToEl(card, () => {
      card.classList.remove('is-highlight');
      void card.offsetWidth;
      card.classList.add('is-highlight');
      setTimeout(() => card.classList.remove('is-highlight'), 3400);
    }, -(headerHeight() + 24));
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
      gsap.fromTo(shown, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', overwrite: true });
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
    wrap.innerHTML = products.map((p) => `
      <label class="pchoice">
        <input type="checkbox" name="products" value="${p.name}" data-id="${p.id}">
        <span><img src="${imgUrl(p, 120)}" alt="" width="44" height="44" loading="lazy"><b>${p.name}</b><small>${p.variant}</small></span>
      </label>`).join('') + `
      <label class="pchoice">
        <input type="checkbox" name="products" value="Not sure — help me choose">
        <span><i class="pchoice__icon">${icon('i-gift')}</i><b>Not sure</b><small>Help me choose</small></span>
      </label>`;
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
      use_case: fd.get('use_case') || activeUseCase,
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
        track('generate_lead', { products: data.products.join(', '), quantity: data.quantity, city: data.city, use_case: data.use_case });
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
  const visible = { hero: true, quote: false, finale: false, footer: false };

  function updateDock() {
    const dock = $('[data-dock]');
    if (!dock) return;
    const hasItems = dock.classList.contains('has-items');
    const show = (!visible.hero || hasItems) && !visible.quote && !visible.finale && !visible.footer;
    dock.classList.toggle('is-visible', show);
  }

  function initDock() {
    const watch = [['hero', '.hero'], ['quote', '#quote'], ['finale', '#finale'], ['footer', '.footer']];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { visible[en.target.dataset.watch] = en.isIntersecting; });
      updateDock();
    }, { rootMargin: '0px 0px -15% 0px' });
    watch.forEach(([key, sel]) => {
      const el = $(sel);
      if (el) { el.dataset.watch = key; io.observe(el); }
    });

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
     Flags (logos, counter, referral)
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
    const referral = $('[data-referral]');
    if (referral && f.showReferral === false) referral.hidden = true;
  }

  /* ------------------------------------------------------------------------
     Motion (GSAP + ScrollTrigger + Lenis)
     ------------------------------------------------------------------------ */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'w__i';
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
  }

  function initFlames(flames) {
    flames.forEach((f) => {
      gsap.set(f, { transformOrigin: '50% 100%' });
      const flick = () => gsap.to(f, {
        scaleY: gsap.utils.random(0.86, 1.14),
        scaleX: gsap.utils.random(0.9, 1.06),
        rotation: gsap.utils.random(-5, 5),
        duration: gsap.utils.random(0.12, 0.3),
        ease: 'sine.inOut',
        onComplete: flick,
      });
      flick();
    });
  }

  function twinkle(bulbs) {
    bulbs.forEach((b) => {
      const glow = b.querySelector('.bulb__glow');
      gsap.to(glow, {
        opacity: gsap.utils.random(0.25, 0.6),
        duration: gsap.utils.random(0.6, 1.6),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: gsap.utils.random(0, 1.5),
      });
    });
  }

  function initLights() {
    const hero = $('[data-lights="hero"]');
    const finale = $('[data-lights="finale"]');
    [hero, finale].forEach((el) => el && buildLights(el));

    if (canAnimate) {
      if (hero) twinkle($$('.bulb', hero));
      if (finale) {
        const bulbs = $$('.bulb', finale);
        gsap.set(bulbs, { opacity: 0.18 });
        gsap.set($$('.bulb__glow', finale), { opacity: 0 });
        ScrollTrigger.create({
          trigger: '#finale',
          start: 'top 70%',
          once: true,
          onEnter: () => {
            gsap.to(bulbs, { opacity: 1, duration: 0.25, stagger: 0.06, ease: 'power1.out' });
            gsap.to($$('.bulb__glow', finale), { opacity: 1, duration: 0.4, stagger: 0.06, onComplete: () => twinkle(bulbs) });
          },
        });
      }
    }

    let lastW = window.innerWidth;
    let t;
    window.addEventListener('resize', () => {
      if (Math.abs(window.innerWidth - lastW) < 40) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => {
        [hero, finale].forEach((el) => {
          if (!el) return;
          if (canAnimate) gsap.killTweensOf($$('.bulb, .bulb__glow', el));
          buildLights(el);
          if (canAnimate) twinkle($$('.bulb', el));
        });
      }, 200);
    });
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

    // Hero intro
    const title = $('.hero__title');
    if (title) splitWords(title);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.lights--hero svg', { y: -40, opacity: 0, duration: 1 }, 0)
      .from('.hero .eyebrow', { y: 16, opacity: 0, duration: 0.6 }, 0.1)
      .from('.hero__title .w__i', { yPercent: 110, duration: 0.9, stagger: 0.04 }, 0.2)
      .fromTo('.hero__title .hl', { backgroundSize: '0% 0.3em' }, { backgroundSize: '100% 0.3em', duration: 0.8, ease: 'power2.inOut' }, 0.9)
      .from(['.hero__sub', '.hero__ctas', '.hero__trust', '.hero__chip'], { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.55)
      .from('.hv-glow', { scale: 0.5, opacity: 0, duration: 1.4 }, 0.1)
      .from('.hv-card-wrap', { y: 70, rotation: -14, opacity: 0, duration: 1.1, ease: 'back.out(1.4)' }, 0.25)
      .from('.hv-gift', { y: -160, opacity: 0, duration: 1, stagger: 0.13, ease: 'bounce.out' }, 0.5)
      .from('.hv-diya', { scale: 0, opacity: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.1, ease: 'back.out(2.4)' }, 1.1)
      .from(['.hv-price', '.hv-tag'], { scale: 0.5, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2.2)' }, 1.2)
      .from('.hv-spark', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.08 }, 1.3);

    // Idle loops in the hero
    gsap.to('.hv-card-wrap', { y: -10, rotation: -2.5, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.6 });
    gsap.to('.hv-price', { y: -8, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 });
    gsap.to('.hv-spark', { scale: 0.55, opacity: 0.5, rotation: 25, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.35, from: 'random' }, delay: 2 });
    initFlames($$('.diya__flame'));
    gsap.to('.diya__glow', { opacity: 0.6, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.25, from: 'random' } });
    $$('.marigold-strand').forEach((s, i) => {
      gsap.set(s, { transformOrigin: '50% 0%' });
      gsap.to(s, { rotation: i % 2 ? 3 : -3, duration: 2.4 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    });

    // Scroll reveals (hero handled by the intro timeline)
    const reveals = $$('[data-reveal]').filter((el) => !el.closest('.hero__grid'));
    gsap.set(reveals, { opacity: 0, y: 32 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true }),
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
    renderDiyas();
    renderMarigolds();
    renderProducts();
    renderPicks();
    initForm();
    updateQuoteUI();
    initTabs();
    initFilters();
    initAccordion();
    initCarousel();
    initDock();
    initAnchors();
    initLights();
    initMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
