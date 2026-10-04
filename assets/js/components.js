/* ==========================================================================
   NEXTRO · COMPONENTS (behaviour)
   --------------------------------------------------------------------------
   Plain JS, no build step. Needs GSAP (and ScrollTrigger for lights.lightUp) only for
   motion: without them every component still renders, it just stays still.

   Public API — window.NextroUI
     NextroUI.defs()                       injects the shared SVG gradients (once)
     NextroUI.diya.render(root?)           draws the lamp into every [data-diya]
     NextroUI.diya.animate(root?)          flame flicker + glow pulse
     NextroUI.lights.mount(el, opts?)      draws a garland into el, twinkles, redraws on resize
     NextroUI.lights.lightUp(el, opts)     dim until a scroll trigger, then switch on bulb by bulb
     NextroUI.lights.stickyHandoff(frame, nextEl)   pinned garland rides up when nextEl arrives
     NextroUI.marigold.render(root?)       draws every [data-marigold="n"] strand
     NextroUI.marigold.animate(root?)      slow pendulum sway
     NextroUI.dock.mount(el, opts)         show/hide logic for the sticky bar

   See components.html for markup, options and motion specs.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Motion needs GSAP and a visitor who hasn't asked for reduced motion.
  const canAnimate = () => !!window.gsap && !reduceMotion;

  /* ------------------------------------------------------------------------
     Shared SVG gradients (diya flame + bulb glows). Injected once, ids are stable.
     ------------------------------------------------------------------------ */
  function defs() {
    if (document.getElementById('nx-defs')) return;
    const holder = document.createElement('div');
    holder.innerHTML = `
      <svg id="nx-defs" class="sprite" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">
        <defs>
          <radialGradient id="g-flame-glow">
            <stop offset="0" stop-color="#FFD66B" stop-opacity=".85"/>
            <stop offset=".45" stop-color="#FFB703" stop-opacity=".35"/>
            <stop offset="1" stop-color="#FF8A00" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="g-flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFE27A"/>
            <stop offset=".55" stop-color="#FFB703"/>
            <stop offset="1" stop-color="#FF6A00"/>
          </linearGradient>
          <linearGradient id="g-diya" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#E2622A"/>
            <stop offset="1" stop-color="#A93A0E"/>
          </linearGradient>
          <radialGradient id="g-bulb-a"><stop offset="0" stop-color="#FFD66B" stop-opacity=".9"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>
          <radialGradient id="g-bulb-b"><stop offset="0" stop-color="#FF8A00" stop-opacity=".85"/><stop offset="1" stop-color="#FF8A00" stop-opacity="0"/></radialGradient>
          <radialGradient id="g-bulb-c"><stop offset="0" stop-color="#FF5C8A" stop-opacity=".8"/><stop offset="1" stop-color="#FF5C8A" stop-opacity="0"/></radialGradient>
          <radialGradient id="g-bulb-d"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".95"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient>
        </defs>
      </svg>`;
    document.body.prepend(holder.firstElementChild);
  }

  /* ------------------------------------------------------------------------
     DIYA
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

  const diya = {
    svg: DIYA_SVG,
    render(root = document) {
      defs();
      $$('[data-diya]', root).forEach((el) => { el.innerHTML = DIYA_SVG; });
    },
    // Flame: random scale/rotate every 0.12–0.3s (a real flame never repeats). Glow: 0.9s breathing pulse.
    animate(root = document) {
      if (!canAnimate()) return;
      const gsap = window.gsap;
      $$('.diya__flame', root).forEach((f) => {
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
      gsap.to($$('.diya__glow', root), { opacity: 0.6, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.25, from: 'random' } });
    },
  };

  /* ------------------------------------------------------------------------
     LED FAIRY LIGHTS
     ------------------------------------------------------------------------ */
  const BULB_COLORS = [
    { fill: '#FFC21A', glow: 'a' },
    { fill: '#FF8A00', glow: 'b' },
    { fill: '#FF5C8A', glow: 'c' },
    { fill: '#FFF1C9', glow: 'd' },
  ];

  // Draws the wire (quadratic swags) and places a bulb every `spacing` px along it.
  function buildLights(el) {
    defs();
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

  // Each bulb's glow breathes between 25–60% opacity, 0.6–1.6s, with a random start delay.
  function twinkle(bulbs) {
    if (!canAnimate()) return;
    const gsap = window.gsap;
    bulbs.forEach((b) => {
      gsap.to(b.querySelector('.bulb__glow'), {
        opacity: gsap.utils.random(0.25, 0.6),
        duration: gsap.utils.random(0.6, 1.6),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: gsap.utils.random(0, 1.5),
      });
    });
  }

  const lights = {
    build: buildLights,
    twinkle,

    // opts.twinkle (default true): start twinkling straight away (use false when lightUp() will do it). Redraws when the width changes by 40px or more.
    mount(el, opts = {}) {
      if (!el) return null;
      const doTwinkle = opts.twinkle !== false;
      buildLights(el);
      if (doTwinkle) twinkle($$('.bulb', el));

      let lastW = window.innerWidth;
      let t;
      const onResize = () => {
        if (Math.abs(window.innerWidth - lastW) < 40) return;
        lastW = window.innerWidth;
        clearTimeout(t);
        t = setTimeout(() => {
          if (canAnimate()) window.gsap.killTweensOf($$('.bulb, .bulb__glow', el));
          buildLights(el);
          twinkle($$('.bulb', el));   // a redrawn garland is always lit
        }, 200);
      };
      window.addEventListener('resize', onResize);
      return { rebuild: () => buildLights(el), destroy: () => window.removeEventListener('resize', onResize) };
    },

    // Dim until `trigger` scrolls to `start`, then switch on bulb by bulb (0.06s stagger), then twinkle.
    lightUp(el, { trigger, start = 'top 70%' } = {}) {
      if (!el || !canAnimate() || !window.ScrollTrigger) return;
      const gsap = window.gsap;
      const bulbs = $$('.bulb', el);
      gsap.set(bulbs, { opacity: 0.18 });
      gsap.set($$('.bulb__glow', el), { opacity: 0 });
      window.ScrollTrigger.create({
        trigger,
        start,
        once: true,
        onEnter: () => {
          gsap.to(bulbs, { opacity: 1, duration: 0.25, stagger: 0.06, ease: 'power1.out' });
          gsap.to($$('.bulb__glow', el), { opacity: 1, duration: 0.4, stagger: 0.06, onComplete: () => twinkle(bulbs) });
        },
      });
    },

    /* A garland pinned under a sticky header hands over to the next section's own garland: once that
       section's top edge reaches the pinned lights, they ride up with the edge and tuck under the header,
       so only one string is ever visible. `frame` is the .lights--header box, it must contain a .lights__push layer. */
    stickyHandoff(frame, nextEl) {
      const layer = frame && $('.lights__push', frame);
      if (!layer || !nextEl) return;
      const update = () => {
        const h = frame.offsetHeight;
        const hangsAt = frame.getBoundingClientRect().top;   // where the pinned garland starts (viewport px)
        const edge = nextEl.getBoundingClientRect().top;     // top edge of the next section
        const push = Math.min(0, Math.max(-h, edge - (hangsAt + h)));
        layer.style.setProperty('--lights-push', `${push}px`);
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  };

  /* ------------------------------------------------------------------------
     HANGING MARIGOLDS
     ------------------------------------------------------------------------ */
  const marigold = {
    render(root = document) {
      $$('[data-marigold]', root).forEach((el) => {
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
    },
    // Pendulum from the top of the strand: ±3°, alternating direction, 2.4s + 0.3s per extra strand.
    animate(root = document) {
      if (!canAnimate()) return;
      const gsap = window.gsap;
      $$('.marigold-strand', root).forEach((s, i) => {
        gsap.set(s, { transformOrigin: '50% 0%' });
        gsap.to(s, { rotation: i % 2 ? 3 : -3, duration: 2.4 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      });
    },
  };

  /* ------------------------------------------------------------------------
     STICKY DOCK
     The bar slides up once `after` (the hero) has scrolled out of view — or as soon as it has
     content to show (`.has-items`) — and slides away while any `hideOn` element is on screen.
     opts: { after: '.hero', hideOn: ['#quote', '#finale', '.footer'], rootMargin: '0px 0px -15% 0px' }
     ------------------------------------------------------------------------ */
  const dock = {
    mount(el, opts = {}) {
      if (!el) return null;
      const after = opts.after || null;
      const hideOn = opts.hideOn || [];
      const seen = new Map();   // element → is on screen
      const state = { after: !!after };

      const update = () => {
        const afterVisible = after ? state.after : false;
        const hasItems = el.classList.contains('has-items');
        const covered = hideOn.some((sel) => seen.get(sel));
        el.classList.toggle('is-visible', (!afterVisible || hasItems) && !covered);
      };

      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const key = en.target.__nxDockKey;
          if (key === '__after') state.after = en.isIntersecting;
          else seen.set(key, en.isIntersecting);
        });
        update();
      }, { rootMargin: opts.rootMargin || '0px 0px -15% 0px' });

      if (after) { const a = $(after); if (a) { a.__nxDockKey = '__after'; io.observe(a); } }
      hideOn.forEach((sel) => { const t = $(sel); if (t) { t.__nxDockKey = sel; io.observe(t); } });
      update();

      return {
        update,
        // true → show the quote tray content instead of the deadline content
        setHasItems(on) { el.classList.toggle('has-items', !!on); update(); },
      };
    },
  };

  window.NextroUI = { defs, diya, lights, marigold, dock };
})();
