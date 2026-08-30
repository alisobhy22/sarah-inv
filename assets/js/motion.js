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

  // Smooth scroll on fine-pointer devices only — never hijack touch.
  if (typeof Lenis !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
    var lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

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
      wireHeroParallax();
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
      .to('.hero [data-reveal]', { opacity: 1, y: 0, stagger: 0.12, duration: 0.8 }, '-=0.8');
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
  }

  // Desktop only: gentle parallax retreat of the top-left cluster as you
  // leave the hero. Re-wired (never replayed) on a width-change rebuild;
  // reverts its own previous matchMedia instance first so repeated
  // rebuilds don't leave stale media-query listeners piling up.
  var heroParallaxMM;
  function wireHeroParallax() {
    if (heroParallaxMM) heroParallaxMM.revert();
    heroParallaxMM = gsap.matchMedia();
    heroParallaxMM.add('(min-width: 900px)', function () {
      gsap.to('.cluster-tl', {
        yPercent: -12, ease: 'none',
        scrollTrigger: { trigger: '#names', start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }
  wireHeroParallax();

  // ── Section reveals ───────────────────────────────────────────
  function wireReveals() {
    gsap.utils.toArray('main > section:not(#names) [data-reveal]').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });
  }
  wireReveals();

  // ── Orchid bloom (called by rsvp.js) ──────────────────────────
  window.bloomOrchid = function () {
    var o = document.getElementById('orchid');
    if (o) requestAnimationFrame(function () { o.classList.add('bloomed'); });
  };
})();
