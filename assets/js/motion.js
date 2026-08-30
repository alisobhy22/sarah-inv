(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  // Reduced motion or missing CDN: leave everything in final state.
  if (reduced || !hasGsap) {
    window.bloomOrchid = function () {
      var o = document.getElementById('orchid');
      if (o) o.classList.add('bloomed');
    };
    return;
  }

  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);

  // Native scrolling only — no smooth-scroll library. ScrollTrigger's
  // scrub values below give the motion its glide instead.

  // ── The vine ──────────────────────────────────────────────────
  var vineSvg = document.getElementById('vine');
  var vinePath = null;

  function buildVine() {
    var h = document.documentElement.scrollHeight;
    var w = document.documentElement.clientWidth;
    var mobile = w < 600;
    var right = mobile ? w - 14 : w - 42;
    var left = mobile ? w - 14 : 42; // no crossover on mobile
    var loc = document.getElementById('location');
    var crossStart = loc.offsetTop - 200;
    var crossEnd = loc.offsetTop + 200;
    var waypoints = [
      { y: 0, x: right },
      { y: crossStart, x: right },
      { y: crossEnd, x: left },
      { y: h, x: left }
    ];
    var d = InviteLib.buildVinePath(h, waypoints, mobile ? 8 : 26, mobile ? 200 : 280);
    vineSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    vineSvg.setAttribute('height', h);
    vineSvg.style.opacity = mobile ? 0.55 : 1;
    vineSvg.innerHTML = '<path class="vine-path" d="' + d + '"/>';
    vinePath = vineSvg.querySelector('.vine-path');

    // Leaves and buds sampled along the path, alternating sides.
    var len = vinePath.getTotalLength();
    var frag = '';
    for (var i = 1; i <= 14; i++) {
      var pt = vinePath.getPointAtLength(len * (i / 15));
      var flip = i % 2 ? 1 : -1;
      if (i % 4 === 0) {
        frag += '<circle class="vine-bud" data-vine-orn cx="' + pt.x + '" cy="' + pt.y + '" r="4"/>';
      } else {
        frag += '<path class="vine-leaf" data-vine-orn d="M' + pt.x + ' ' + pt.y +
          ' c ' + 8 * flip + ' -4, ' + 16 * flip + ' -2, ' + 20 * flip + ' 6' +
          ' c ' + -8 * flip + ' 4, ' + -16 * flip + ' 2, ' + -20 * flip + ' -6 Z"/>';
      }
    }
    vineSvg.insertAdjacentHTML('beforeend', frag);

    // Draw with scroll across the whole document.
    gsap.set(vinePath, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(vinePath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 }
    });
    // Each ornament scales in as it enters the lower viewport.
    gsap.utils.toArray('[data-vine-orn]').forEach(function (el) {
      gsap.from(el, {
        scale: 0, transformOrigin: 'center', duration: 0.5,
        scrollTrigger: { trigger: el, start: 'top 78%' }
      });
    });
  }
  buildVine();

  // Mobile browsers collapse/expand their URL bar while the guest scrolls,
  // which fires `resize` with the viewport HEIGHT changed but the WIDTH
  // unchanged. That must be a complete no-op — only a genuine width change
  // (breakpoint crossing / orientation change) warrants tearing down and
  // rebuilding the scroll-driven triggers. Otherwise, on WhatsApp in-app
  // browsers (the primary platform here), every URL-bar wobble mid-scroll
  // would retrigger the vine rebuild and — without the fix below — replay
  // the hero entrance while the guest is reading.
  var lastWidth = document.documentElement.clientWidth;
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = document.documentElement.clientWidth;
      if (w === lastWidth) return; // height-only (URL bar) resize — ignore
      lastWidth = w;
      ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
      setHeroFinal();
      buildVine();
      wireReveals();
      wireParallax();
      buildPetals();
      ScrollTrigger.refresh();
    }, 250);
  });

  // ── Hero: bouquet unfold (plays exactly once, on load) ─────────
  function wireHeroEntrance() {
    var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.monogram .mono-letter', { opacity: 0, y: 10, stagger: 0.2, duration: 0.9 })
      .to('.hero .cluster', { opacity: 1, duration: 1.2 }, '-=0.4')
      .from('.cluster-tl', { xPercent: 18, yPercent: 12, rotation: 8, duration: 1.4 }, '<')
      .from('.cluster-r', { xPercent: 24, rotation: -6, duration: 1.4 }, '<')
      .to('.hero [data-reveal]', { opacity: 1, y: 0, stagger: 0.12, duration: 0.8 }, '-=0.8')
      .to('.hero .rule', { scaleX: 1, stagger: 0.1, duration: 0.7, ease: 'power2.out' }, '-=0.9');
  }
  wireHeroEntrance();

  // Pins the hero elements at their settled, fully-revealed state. Used
  // on a width-change rebuild so the one-time entrance never replays.
  function setHeroFinal() {
    gsap.set('.monogram .mono-letter', { opacity: 1, y: 0 });
    gsap.set('.hero .cluster', { opacity: 1 });
    gsap.set('.cluster-tl', { xPercent: 0, yPercent: 0, rotation: 0 });
    gsap.set('.cluster-r', { xPercent: 0, rotation: 0 });
    gsap.set('.hero [data-reveal]', { opacity: 1, y: 0 });
    gsap.set('.hero .rule', { scaleX: 1 });
  }

  // ── Parallax: background botanicals drift at their own speeds ──
  // Every cluster moves slower than the page (scrubbed to scroll), so
  // the flora reads as a layer floating behind the paper. All widths —
  // it's transform-only, cheap enough for phones.
  var PARALLAX = [
    { sel: '.cluster-tl', y: -14, trig: '#names', start: 'top top' },
    { sel: '.cluster-r', y: -26, trig: '#names', start: 'top top' },
    { sel: '.cluster-hang', y: 30, trig: '#interlude', start: 'top bottom' },
    { sel: '.cluster-br', y: -18, trig: '#rsvp', start: 'top bottom' }
  ];
  function wireParallax() {
    PARALLAX.forEach(function (p) {
      var el = document.querySelector(p.sel);
      if (!el) return;
      gsap.to(el, {
        yPercent: p.y, ease: 'none',
        scrollTrigger: { trigger: p.trig, start: p.start, end: 'bottom top', scrub: 0.8 }
      });
    });
  }
  wireParallax();

  // ── Breeze: clusters rock gently around their stem point, forever.
  // Rotation is reserved for this (parallax uses yPercent only), so the
  // two never fight over the same transform channel. Starts after the
  // hero entrance has fully settled.
  gsap.utils.toArray('.cluster').forEach(function (el, i) {
    gsap.to(el, {
      rotation: i % 2 ? 1.8 : -1.8,
      transformOrigin: '50% 0%',
      duration: 6 + i * 1.5,
      delay: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  });

  // ── Falling petals: a slow, endless drift down the hero only.
  (function heroPetals() {
    var hero = document.getElementById('names');
    for (var i = 0; i < 7; i++) {
      var p = document.createElement('div');
      p.className = 'petal-fall' + (i % 2 ? ' alt' : '');
      p.style.left = (5 + (i * 13) % 90) + '%';
      hero.appendChild(p);
      gsap.set(p, { y: -40, rotation: i * 40 });
      gsap.to(p, {
        y: hero.offsetHeight + 60,
        x: (i % 2 ? '+=' : '-=') + (40 + i * 10),
        rotation: '+=' + (140 + i * 30),
        duration: 10 + (i % 4) * 3,
        delay: i * 1.7,
        ease: 'none',
        repeat: -1
      });
    }
  })();

  // ── Floating petals: a sparse background layer that drifts as the
  // guest scrolls. Deterministic scatter (no flicker between rebuilds),
  // generated only in motion mode so reduced-motion never sees them.
  var petalLayer = null;
  function buildPetals() {
    if (petalLayer) petalLayer.remove();
    petalLayer = document.createElement('div');
    petalLayer.className = 'petal-layer';
    petalLayer.setAttribute('aria-hidden', 'true');
    var h = document.documentElement.scrollHeight;
    var count = 14;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'petal-float';
      var size = 9 + (i * 7) % 13;
      p.style.left = ((i * 61 + 13) % 92) + '%';
      p.style.top = Math.round(h * (0.06 + 0.88 * (i / count))) + 'px';
      p.style.width = size + 'px';
      p.style.height = Math.round(size * 1.4) + 'px';
      petalLayer.appendChild(p);
      gsap.to(p, {
        y: -(110 + (i % 5) * 55),
        rotation: (i % 2 ? 1 : -1) * (35 + (i * 13) % 45),
        ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
      });
    }
    document.body.appendChild(petalLayer);
  }
  buildPetals();

  // ── Section reveals ───────────────────────────────────────────
  function wireReveals() {
    gsap.utils.toArray('main > section:not(#names) [data-reveal]').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });

    // Map moment: the pin drops in with a bounce, the route fades after.
    gsap.from('.map-pin-group', {
      y: -36, opacity: 0, duration: 0.8, ease: 'bounce.out',
      scrollTrigger: { trigger: '#location', start: 'top 65%' }
    });
    gsap.from('.map-route', {
      opacity: 0, duration: 1.2, delay: 0.5,
      scrollTrigger: { trigger: '#location', start: 'top 65%' }
    });
  }
  wireReveals();

  // ── Orchid bloom (called by rsvp.js) ──────────────────────────
  window.bloomOrchid = function () {
    var o = document.getElementById('orchid');
    if (o) requestAnimationFrame(function () { o.classList.add('bloomed'); });
  };
})();
