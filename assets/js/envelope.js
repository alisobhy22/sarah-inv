// The envelope: breaking the wax, lifting the flap, and going inside.
//
// Deliberately dependency-free and NOT deferred. This script owns the only
// way past a full-screen overlay, so it must not wait on the GSAP CDN and
// must not wait on the rest of the page — a guest stuck behind a closed card
// has no invitation at all. Every movement is a CSS transition; this file
// only sequences the classes that trigger them.
(function () {
  'use strict';

  var STORE_KEY = 'as-invite-opened';
  var gate = document.getElementById('seal-gate');
  if (!gate) return;                       // already opened, or hidden by noscript

  var button = gate.querySelector('.seal-button');
  var opening = false;

  // Must match the CSS. The wax breaks first, then the leaves swing.
  var PRESS_MS = 120;   // the seal presses in under the finger
  // The entrance starts WITH the leaves and runs compressed. Traced, the
  // timeline spends its first 1.3s on the monogram and clusters before any
  // text reveals, and a rotateY leaf is edge-on and effectively gone by
  // ~800ms — so at normal speed the doors opened onto blank paper for over
  // half a second. At 1.45x the reveals begin as the leaves clear.
  var HERO_SPEED = 1.45;
  var DONE_MS = 2400;   // flap, card rise and the zoom have all landed

  function remember() {
    try { localStorage.setItem(STORE_KEY, '1'); } catch (e) { /* private mode */ }
  }

  function open() {
    if (opening) return;                   // a double tap is still one opening
    opening = true;

    gate.classList.add('is-pressing');
    if (button) button.disabled = true;

    setTimeout(function () {
      gate.classList.remove('is-pressing');
      gate.classList.add('is-opening');
      // Release the scroll lock as the card opens, not after — the guest
      // should be able to move the moment there's something to move.
      document.documentElement.classList.remove('gated');
      remember();
      // motion.js holds the hero entrance while a gate is present, so the
      // bouquet unfolds into the opening card rather than behind a closed
      // one. It won't exist at all under reduced motion or a failed CDN,
      // where the hero already sits in its final state — hence the guard
      // rather than a bare call.
      if (typeof window.playHeroEntrance === 'function') window.playHeroEntrance(HERO_SPEED);
    }, PRESS_MS);

    setTimeout(function () {
      if (gate.parentNode) gate.parentNode.removeChild(gate);
    }, DONE_MS);
  }

  gate.addEventListener('click', open);
  // Enter/Space already reach a <button> as a click, so no extra key handling.
})();
