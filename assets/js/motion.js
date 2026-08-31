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
    // The crossover has to be given room. At a fixed +/-200px the vine cut the
    // full page width in 400px of travel and read as a straight diagonal rule
    // ruled across the paper, not a vine — and it got worse once the sections
    // grew to a full screen each. Scaling the window to the viewport keeps the
    // traverse gradual at any height.
    var cross = Math.max(360, Math.round(window.innerHeight * 0.8));
    var crossStart = loc.offsetTop - cross;
    var crossEnd = loc.offsetTop + cross;
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
      var at = i / 15;
      var pt = vinePath.getPointAtLength(len * at);
      var flip = i % 2 ? 1 : -1;
      // data-at records where along the stroke this ornament sits, so it can
      // bloom as the drawing head passes it rather than on its own viewport
      // trigger — see the onUpdate below.
      if (i % 4 === 0) {
        frag += '<circle class="vine-bud" data-vine-orn data-at="' + at + '" cx="' + pt.x + '" cy="' + pt.y + '" r="4"/>';
      } else {
        frag += '<path class="vine-leaf" data-vine-orn data-at="' + at + '" d="M' + pt.x + ' ' + pt.y +
          ' c ' + 8 * flip + ' -4, ' + 16 * flip + ' -2, ' + 20 * flip + ' 6' +
          ' c ' + -8 * flip + ' 4, ' + -16 * flip + ' 2, ' + -20 * flip + ' -6 Z"/>';
      }
    }
    vineSvg.insertAdjacentHTML('beforeend', frag);

    // Draw with scroll across the whole document.
    gsap.set(vinePath, { strokeDasharray: len, strokeDashoffset: len });

    // Ornaments bloom off the SAME scroll progress that draws the stroke, so a
    // leaf opens exactly as the line reaches it. Previously each had its own
    // ScrollTrigger keyed to viewport position, which fired out of step with
    // the drawing head — leaves appeared on bare paper ahead of the line.
    var orns = gsap.utils.toArray('[data-vine-orn]').map(function (el) {
      gsap.set(el, { scale: 0, transformOrigin: 'center' });
      return { el: el, at: parseFloat(el.getAttribute('data-at')) };
    });
    var BLOOM = 0.05; // fraction of total scroll a single ornament takes to open

    // gsap.set, not gsap.quickSetter: quickSetter writes style.transform, which
    // these <circle>/<path> nodes ignore in favour of their transform ATTRIBUTE,
    // so the ornaments stayed pinned at scale 0. gsap.set writes the attribute.
    function bloom(progress) {
      for (var i = 0; i < orns.length; i++) {
        var t = (progress - orns[i].at) / BLOOM;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        gsap.set(orns[i].el, { scale: t * t * (3 - 2 * t), transformOrigin: 'center' });
      }
    }

    gsap.to(vinePath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: function (self) { bloom(self.progress); },
        // deep-link or restored scroll position: seed the correct state on load
        onRefresh: function (self) { bloom(self.progress); }
      }
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
      // Pixel `y`, NOT yPercent. yPercent belongs to the parallax scrub, and
      // wireParallax() builds its trigger while this entrance is still in
      // flight — so it recorded the entrance's in-progress yPercent (12, i.e.
      // 52px) as the scrub's start value, and the first scroll of any size
      // snapped the cluster 52px down to meet it. Same channel discipline the
      // breeze already follows below: one transform channel, one owner.
      .from('.cluster-tl', { xPercent: 18, y: 52, rotation: 8, duration: 1.4 }, '<')
      .from('.cluster-r', { xPercent: 24, rotation: -6, duration: 1.4 }, '<')
      .to('.hero [data-reveal]', { opacity: 1, y: 0, stagger: 0.12, duration: 0.8 }, '-=0.8')
      .to('.hero .rule', { scaleX: 1, stagger: 0.1, duration: 0.7, ease: 'power2.out' }, '-=0.9');
    return tl;
  }
  // Held when the seal gate is present, so the bouquet unfolds INTO the
  // opening card rather than playing out behind a closed one — by the time
  // the leaves clear, the names are already settling. envelope.js calls this.
  // Idempotent, so a double tap can't run the entrance twice.
  var heroPlayed = false;
  // `speed` lets the gate run the entrance faster than it plays on a plain
  // load. Traced: the timeline spends its first 1.3s on the monogram and the
  // clusters before any [data-reveal] text begins. That's right when the hero
  // IS the first impression — but behind an opening card it means the leaves
  // clear onto blank paper for the better part of a second.
  window.playHeroEntrance = function (speed) {
    if (heroPlayed) return;
    heroPlayed = true;
    var tl = wireHeroEntrance();
    if (tl && speed) tl.timeScale(speed);
  };
  if (!document.getElementById('seal-gate')) window.playHeroEntrance();

  // Pins the hero elements at their settled, fully-revealed state. Used
  // on a width-change rebuild so the one-time entrance never replays.
  function setHeroFinal() {
    gsap.set('.monogram .mono-letter', { opacity: 1, y: 0 });
    gsap.set('.hero .cluster', { opacity: 1 });
    gsap.set('.cluster-tl', { xPercent: 0, y: 0, rotation: 0 });   // y, not yPercent — see above
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
  // The mirrored anchors are excluded, for a reason worth recording: their
  // `scale: -1 1` makes GSAP read their starting rotation as ~180 degrees, so
  // a tween toward -1.8 sweeps a HALF TURN and yoyos it forever instead of
  // swaying. Measured: 25 degrees of travel in 1.5s on #celebration, against
  // under 1 degree for every cluster that isn't mirrored.
  //
  // Excluding them is also right on its own terms. The breeze pivots about
  // '50% 0%' — the top edge — which is where a cluster hanging from above is
  // attached. These two are anchored at the BOTTOM, so pivoting them from the
  // top swings the end that should be rooted.
  gsap.utils.toArray('.cluster:not(.cluster-bl)').forEach(function (el, i) {
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

  // ── Falling petals ────────────────────────────────────────────
  // One FIXED, viewport-sized layer, so petals fall across every section
  // instead of only the hero. This replaces both of the old layers: the
  // hero-only fall, and the scroll-scrubbed "float" layer whose petals hung
  // motionless over the type. At 12px a border-radius blob has no silhouette
  // and reads as a smudge on the paper; the shape now comes from
  // --petal-mask, and the scaleX yoyo below fakes the edge-on flip that
  // makes a tumbling petal read as a petal rather than a drifting speck.
  var petalLayer = null;
  var washes = document.querySelector('.washes');

  // Both the petal layer and the wash layer are absolutely positioned with no
  // positioned ancestor, so percentage heights would resolve against the
  // VIEWPORT, not the document. Their height has to be written in px.
  function sizeDocLayers(h) {
    if (washes) washes.style.height = h + 'px';
    if (petalLayer) petalLayer.style.height = h + 'px';
  }

  function buildPetals() {
    if (petalLayer) petalLayer.remove();
    petalLayer = document.createElement('div');
    petalLayer.className = 'petal-layer';
    petalLayer.setAttribute('aria-hidden', 'true');

    var docH = document.documentElement.scrollHeight;
    petalLayer.style.height = docH + 'px';

    // Anchored to the page, the petals have a whole document to cover rather
    // than one screen, so the count scales with its height — a fixed dozen
    // spread over five screens would read as nothing at all. Each petal falls
    // inside its own band and loops there, which keeps the whole page evenly
    // populated without animating a hundred nodes.
    var BAND = 620;
    var count = Math.max(10, Math.min(26, Math.round(docH / 340)));

    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      // Deterministic scatter — no Math.random, so an orientation change
      // rebuilds the same sky instead of reshuffling it under the guest.
      p.className = 'petal-fall' + (i % 3 === 1 ? ' rose' : (i % 5 === 2 ? ' leaf' : ''));
      var size = 9 + (i * 7) % 11;
      p.style.width = size + 'px';
      p.style.height = Math.round(size * 1.35) + 'px';
      p.style.left = ((i * 61 + 9) % 94) + '%';
      // Bands overlap slightly and are offset per petal, so the seams between
      // them never line up into a visible horizontal rank of petals.
      var bandTop = Math.round((docH - BAND) * (i / Math.max(1, count - 1)));
      p.style.top = bandTop + 'px';
      petalLayer.appendChild(p);

      var dur = 16 + (i % 5) * 4;
      gsap.set(p, { y: -50, rotation: i * 37 });
      var fall = gsap.to(p, {
        y: BAND,
        x: (i % 2 ? '+=' : '-=') + (30 + (i % 4) * 22),
        rotation: '+=' + (150 + (i % 3) * 90),
        duration: dur,
        ease: 'none',
        repeat: -1
      });
      // Seed each petal at a different point of its own fall, so the page is
      // already populated on load rather than filling in over the first
      // twenty seconds. Staggered delays would leave the first screen bare —
      // which is the screen that matters most.
      fall.progress((i * 0.37) % 1);

      gsap.to(p, {
        scaleX: 0.25,
        duration: 1.6 + (i % 4) * 0.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
    }
    document.body.appendChild(petalLayer);
    sizeDocLayers(docH);
  }
  buildPetals();

  // The document grows when the webfonts swap in and when the RSVP group card
  // appears, and both layers are sized in px — so they have to be re-measured
  // rather than left short at the bottom of the page.
  if (typeof ResizeObserver !== 'undefined') {
    var lastDocH = document.documentElement.scrollHeight;
    new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastDocH) < 12) return;
      lastDocH = h;
      sizeDocLayers(h);
    }).observe(document.body);
  }

  // ── Directional section advance ───────────────────────────────
  // A small scroll carries the guest to the NEXT section. CSS scroll-snap
  // can't do this: it settles on the nearest point, which right after a
  // small scroll is the point just left — measured, a 90px wheel from the
  // hero snapped back to 0. So intent is accumulated here and the move is
  // issued as an ordinary native smooth scroll. Native scrolling is
  // preserved throughout: preventDefault fires only while a move is
  // actually in flight, never on a scroll we're letting through.
  // #interlude is not a destination. It's the wordless breath between the
  // names and the celebration — landing ON it would spend a whole screen on
  // a panel with nothing to read. It stays a section you pass THROUGH.
  var PANELS = gsap.utils.toArray('main > section.panel')
    .filter(function (sec) { return sec.id !== 'interlude'; });

  var INTENT_PX = 40;      // wheel travel in one direction before advancing
  var GLIDE_S = 1.5;       // ← the drama dial. Seconds per section.
  var INTENT_DECAY_MS = 180;

  var moving = false;
  var glide = null;
  var intent = 0;
  var intentDir = 0;
  var intentTimer = null;

  // Never take the scroll away from someone USING the form — a hijacked
  // scroll under an open mobile keyboard is miserable. Focus is the right
  // test, not the section: exempting all of #rsvp meant a guest who was
  // merely reading it could never advance to the closing, since the pointer
  // sits inside that section whenever it fills the screen.
  function exempt() {
    // Nothing advances while the card is still closed. The gate blocks the
    // view but not the wheel, so without this a scroll over the seal would
    // silently move the invitation underneath it.
    if (document.documentElement.classList.contains('gated')) return true;
    var el = document.activeElement;
    return !!(el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  function indexAt(y) {
    var idx = 0;
    for (var i = 0; i < PANELS.length; i++) {
      if (PANELS[i].offsetTop <= y + 2) idx = i;
    }
    return idx;
  }

  // A section taller than the window has to be READ THROUGH before it hands
  // the guest on, or a nudge would skip content they never saw — the hero's
  // venue line, the map. Such a section advances only from its far edge;
  // in between, this returns false and the scroll is left entirely native.
  function canLeave(sec, dir, y) {
    if (InviteLib.shouldSnap(sec.offsetHeight, window.innerHeight)) return true;
    if (dir > 0) return y + window.innerHeight >= sec.offsetTop + sec.offsetHeight - 4;
    return y <= sec.offsetTop + 4;
  }

  function advance(dir) {
    var y = window.scrollY;
    var i = indexAt(y);
    if (!canLeave(PANELS[i], dir, y)) return false;
    var target = i + dir;
    // Going down from mid-section, the first stop is that section's own top.
    if (dir < 0 && y > PANELS[i].offsetTop + 4) target = i;
    if (target < 0 || target >= PANELS.length) return false;
    if (dir > 0 && PANELS[target].offsetTop <= y + 2) return false;

    // Driven here rather than handed to `scroll-behavior: smooth`, because
    // that has no duration knob — the browser picks ~300ms and there is no
    // CSS to slow it down. Tweening a proxy and writing the scroll position
    // each frame buys both the duration and the easing, and needs no
    // ScrollToPlugin. power2.inOut so the page leans in and settles rather
    // than starting and stopping flat.
    moving = true;
    intent = 0;
    intentDir = 0;

    var proxy = { y: window.scrollY };
    glide = gsap.to(proxy, {
      y: PANELS[target].offsetTop,
      duration: GLIDE_S,
      ease: 'power2.inOut',
      onUpdate: function () { window.scrollTo(0, proxy.y); },
      onComplete: function () { moving = false; glide = null; },
      onInterrupt: function () { moving = false; glide = null; }
    });
    return true;
  }

  // A guest who reaches for the page mid-glide gets it back immediately —
  // a long animation you cannot interrupt is the part of this pattern that
  // actually feels broken. Touch isn't preventDefault'd anywhere, so the
  // finger would otherwise fight the tween for a second and a half.
  function cancelGlide() {
    if (!glide) return;
    glide.kill();
    glide = null;
    moving = false;
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;              // pinch-zoom, not a scroll
    if (moving) { e.preventDefault(); return; }
    if (exempt()) return;
    var dir = e.deltaY > 0 ? 1 : (e.deltaY < 0 ? -1 : 0);
    if (!dir) return;

    if (dir !== intentDir) { intent = 0; intentDir = dir; }
    intent += Math.abs(e.deltaY);
    clearTimeout(intentTimer);
    intentTimer = setTimeout(function () { intent = 0; intentDir = 0; }, INTENT_DECAY_MS);
    if (intent < INTENT_PX) return;

    if (advance(dir)) e.preventDefault();
  }, { passive: false });

  // Touch takes the opposite tack: it NEVER calls preventDefault. WhatsApp's
  // in-app browser is the primary platform here and its native momentum
  // scrolling is better than anything worth substituting — hijacking
  // touchmove is exactly where these implementations start feeling broken.
  // Instead the gesture runs natively, and only a SHORT flick (the "scroll a
  // tiny bit" case, which native scrolling would leave stranded between
  // sections) is finished off with a glide once the finger lifts.
  var touchStartY = 0;
  var touchStartAt = 0;
  window.addEventListener('touchstart', function (e) {
    cancelGlide();                       // the finger always wins
    touchStartY = e.touches[0].clientY;
    touchStartAt = Date.now();
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (moving || exempt()) return;
    var dy = touchStartY - (e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY);
    var far = Math.abs(dy);
    // A long swipe is a deliberate journey — leave it and its momentum be.
    if (far < 12 || far > 90) return;
    if (Date.now() - touchStartAt > 600) return;   // a slow drag, not a flick
    advance(dy > 0 ? 1 : -1);
  }, { passive: true });

  // ── Section reveals ───────────────────────────────────────────
  function wireReveals() {
    // Reveal per SECTION, not per element. Triggering each element off its own
    // position made a section arrive as a ragged trickle — the rule, then the
    // heading, then the date, each on its own schedule. Grouping them behind
    // one trigger with a stagger lands the section as a composed unit.
    gsap.utils.toArray('main > section:not(#names)').forEach(function (sec) {
      var els = sec.querySelectorAll('[data-reveal]');
      if (!els.length) return;
      gsap.to(els, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.1,
        scrollTrigger: { trigger: sec, start: 'top 72%' }
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
