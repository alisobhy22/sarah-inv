# Engagement Invitation Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single-page static engagement-invitation website for Abdelrahman Samra & Sarah Hesham with a scroll-drawn botanical vine and a group RSVP backed by a Google Sheet.

**Architecture:** Vanilla HTML/CSS/JS, no build step — copy lives in `index.html`, settings in one `config.js`. Pure logic (name matching, vine path generation, countdown, WhatsApp fallback URL) lives in a shared `lib.js` tested with `node --test` and reused verbatim by the Google Apps Script backend. Motion is GSAP + ScrollTrigger driving one SVG vine whose stroke draws with scroll.

**Tech Stack:** HTML5, CSS custom properties, GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.14 (desktop only), Google Apps Script + Google Sheets, Node built-in test runner (dev only).

**Spec:** `docs/superpowers/specs/2026-08-30-engagement-invitation-site-design.md`

## Global Constraints

- Palette tokens exactly: `--paper #F4EDE6`, `--paper-raised #FAF6F1`, `--olive #6A7A42`, `--olive-light #8A9A5B`, `--ink #45502C`, `--rose #C75B77`, `--rose-soft #E9A9BC`, `--magenta #BE3D6B`, `--plum #7A5A6B` (plum unused unless needed). Forbidden anywhere: dark/hunter green, gold, beige/brown, washed-out pastels.
- Script font (Great Vibes) appears in exactly two places: the word *Engagement* and the ampersand between the names. (The RSVP thank-you uses italic Garamond, not script.)
- Body/small text uses `--ink`; display text (≥ ~28px) may use `--olive`.
- Hero copy verbatim: `TOGETHER WITH OUR FAMILIES` / `Abdelrahman SAMRA & Sarah HESHAM` / `we would love to invite you to celebrate our` / `Engagement` / `OCTOBER | 09 | AT 3PM` / `FRIDAY` / `KING MARIOUT, ALEXANDRIA`. Closing copy verbatim: `Please make sure to arrive on time to avoid any delays! Can't wait to celebrate with you!`
- Sections in order with these ids: `#names`, `#interlude`, `#celebration`, `#location`, `#rsvp`, `#closing`. No Our Story, no Dress Code.
- Mobile-first: base styles target 360px; enhance upward. Only `transform` and `opacity` are animated. Total transfer < 300KB.
- `prefers-reduced-motion: reduce` must render every element in its final state with no pinning, drawing, or parallax.
- All commits end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure

```
index.html                       All markup and copy (Task 2)
assets/css/style.css             All styles (Tasks 2, 5, 7)
assets/js/config.js              The only settings file (Task 1)
assets/js/lib.js                 Shared pure logic (Task 3)
assets/js/motion.js              Vine + scroll beats (Task 6)
assets/js/rsvp.js                Lookup / group RSVP / submit (Task 7)
assets/js/countdown.js           Closing countdown (Task 8)
assets/svg/flora.svg             Botanical <symbol> set (Task 5)
assets/img/cluster-*.svg         Four composed clusters (Task 5)
assets/source/                   Original invitation artwork (gitignored, user-supplied)
google-apps-script/Code.gs       Endpoints (Task 4)
google-apps-script/Lib.gs        Copy of lib.js for Apps Script (Task 4)
tests/lib.test.js                Node tests for lib.js (Task 3)
README.md                        Editing, Sheet setup, deployment (Tasks 1, 4, 9)
```

---

### Task 1: Scaffold, git, tokens, fonts

**Files:**
- Create: `.gitignore`, `assets/js/config.js`, `assets/css/style.css` (base only), `README.md` (skeleton)

**Interfaces:**
- Produces: CSS custom properties on `:root` (names in Global Constraints); `window.INVITE_CONFIG` with keys `appsScriptUrl`, `mapsUrl`, `eventIso`, `whatsappPhone`.

- [ ] **Step 1: Initialise git and ignore rules**

```bash
git init
```

Create `.gitignore`:

```gitignore
assets/source/
.playwright-mcp/
node_modules/
Thumbs.db
.DS_Store
```

- [ ] **Step 2: Write `assets/js/config.js`**

```js
// ── The only file a non-developer ever needs to edit. ──────────────
window.INVITE_CONFIG = {
  // Paste the Google Apps Script deployment URL here (README step 3).
  appsScriptUrl: 'PASTE_APPS_SCRIPT_URL_HERE',
  // Paste the Google Maps share link for the venue here.
  mapsUrl: 'https://www.google.com/maps/search/King+Mariout+Alexandria',
  // Event date/time. Egypt is UTC+3 in early October (summer time).
  eventIso: '2026-10-09T15:00:00+03:00',
  // Sarah's WhatsApp number, digits only with country code, e.g. '2010XXXXXXXX'.
  // Used only as a fallback if an RSVP fails to send.
  whatsappPhone: 'PASTE_WHATSAPP_NUMBER_HERE'
};
```

- [ ] **Step 3: Write base `assets/css/style.css`**

```css
/* ── Tokens ─────────────────────────────────────────────────────── */
:root {
  --paper: #F4EDE6;
  --paper-raised: #FAF6F1;
  --olive: #6A7A42;
  --olive-light: #8A9A5B;
  --ink: #45502C;
  --rose: #C75B77;
  --rose-soft: #E9A9BC;
  --magenta: #BE3D6B;
  --plum: #7A5A6B; /* reserved */
  --font-display: "Cormorant Garamond", "Times New Roman", serif;
  --font-body: "EB Garamond", Georgia, serif;
  --font-script: "Great Vibes", cursive;
}

/* ── Ground ─────────────────────────────────────────────────────── */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* Paper grain: generated turbulence, zero image weight. */
.texture {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.44 0 0 0 0 0.36 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

- [ ] **Step 4: Write `README.md` skeleton**

```markdown
# Abdelrahman & Sarah — Engagement Invitation

A single-page invitation website. No build step: edit, save, re-upload.

## Editing the words
All text lives in `index.html`. Open it in any editor, change the words
between the tags, save.

## Settings
`assets/js/config.js` holds the four values that wire the site up:
the RSVP endpoint URL, the Google Maps link, the event date, and the
WhatsApp fallback number. (Setup steps are in later sections.)

## Google Sheet setup
(Filled in by Task 4.)

## Deploying
(Filled in by Task 9.)
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore assets/js/config.js assets/css/style.css README.md docs/
git commit -m "chore: scaffold engagement site — tokens, config, spec and plan

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Full static page — markup and typography

**Files:**
- Create: `index.html`
- Modify: `assets/css/style.css` (append)

**Interfaces:**
- Consumes: CSS tokens from Task 1.
- Produces: the complete DOM later tasks hook into. Stable ids: `#vine`, `#names`, `#interlude`, `#celebration`, `#location`, `#rsvp`, `#closing`, `#rsvp-form`, `#guest-name`, `#lookup-status`, `#group-card`, `#group-label`, `#group-members`, `#choice`, `#manual`, `#party-size`, `#manual-toggle`, `#website` (honeypot), `#rsvp-submit`, `#rsvp-error`, `#rsvp-done`, `#done-message`, `#orchid`, `#countdown`, `#maps-link`. Reveal hook: `data-reveal` attribute on animatable blocks.

- [ ] **Step 1: Write `index.html`**

Note: the four `cluster-*.svg` images referenced here are created in Task 5 and will 404 until then — expected.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Abdelrahman &amp; Sarah — Engagement</title>
  <meta name="description" content="Together with our families, we would love to invite you to celebrate our engagement. Friday, October 9 at 3PM — King Mariout, Alexandria.">
  <meta property="og:title" content="Abdelrahman & Sarah — Engagement">
  <meta property="og:description" content="Friday, October 9 at 3PM — King Mariout, Alexandria">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Great+Vibes&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <div class="texture" aria-hidden="true"></div>
  <svg id="vine" class="vine" aria-hidden="true" preserveAspectRatio="none"></svg>

  <main>
    <!-- ══ 1 · Names ═══════════════════════════════════════════ -->
    <section id="names" class="panel hero">
      <img class="cluster cluster-tl" src="assets/img/cluster-top-left.svg" alt="" aria-hidden="true" width="420" height="480">
      <img class="cluster cluster-r" src="assets/img/cluster-right.svg" alt="" aria-hidden="true" width="260" height="620" loading="lazy">
      <div class="hero-inner">
        <svg class="monogram" viewBox="0 0 120 80" role="img" aria-label="A and S monogram" data-reveal>
          <text x="30" y="60" class="mono-letter">A</text>
          <text x="62" y="66" class="mono-letter">S</text>
        </svg>
        <hr class="rule" data-reveal>
        <p class="caps" data-reveal>Together with our families</p>
        <hr class="rule" data-reveal>
        <h1 class="names-block" data-reveal>
          <span class="first-name">Abdelrahman</span>
          <span class="surname">Samra</span>
          <span class="amp" aria-hidden="true">&amp;</span>
          <span class="first-name">Sarah</span>
          <span class="surname">Hesham</span>
        </h1>
        <hr class="rule" data-reveal>
        <p class="caps small" data-reveal>we would love to invite you to celebrate our</p>
        <p class="script-word" data-reveal>Engagement</p>
        <hr class="rule" data-reveal>
        <p class="caps date-line" data-reveal>October <span class="bar">|</span> <span class="date-day">09</span> <span class="bar">|</span> at 3PM</p>
        <p class="caps small" data-reveal>Friday</p>
        <hr class="rule" data-reveal>
        <p class="caps" data-reveal>King Mariout, Alexandria</p>
      </div>
    </section>

    <!-- ══ 2 · Interlude — deliberate silence ══════════════════ -->
    <section id="interlude" class="panel interlude" aria-hidden="true">
      <img class="cluster cluster-hang" src="assets/img/cluster-amaranthus.svg" alt="" width="220" height="520" loading="lazy">
    </section>

    <!-- ══ 3 · Celebration ═════════════════════════════════════ -->
    <section id="celebration" class="panel">
      <div class="card" data-reveal>
        <p class="caps small">The celebration</p>
        <hr class="rule">
        <p class="big-date"><span class="caps">October</span> <span class="date-day huge">09</span> <span class="caps">2026</span></p>
        <p class="caps small">Friday · at 3 o'clock in the afternoon</p>
        <hr class="rule">
        <p class="caps">King Mariout, Alexandria</p>
        <p class="body-note">An afternoon of joy in the gardens — we can't wait to share it with you.</p>
      </div>
    </section>

    <!-- ══ 4 · Location ════════════════════════════════════════ -->
    <section id="location" class="panel">
      <div class="card map-card" data-reveal>
        <p class="caps small">Where to find us</p>
        <hr class="rule">
        <svg class="map-art" viewBox="0 0 300 170" aria-hidden="true">
          <path d="M0 40 C 70 20, 150 55, 300 30" class="map-road wide"/>
          <path d="M0 110 C 90 95, 180 130, 300 105" class="map-road"/>
          <path d="M150 0 C 140 60, 165 120, 150 170" class="map-road"/>
          <circle cx="152" cy="86" r="5" class="map-pin-dot"/>
          <path d="M152 86 C 144 74, 144 62, 152 58 C 160 62, 160 74, 152 86 Z" class="map-pin"/>
        </svg>
        <p class="venue-name caps">King Mariout</p>
        <p class="body-note">Alexandria</p>
        <a id="maps-link" class="button" href="#" rel="noopener" target="_blank">Click for Location</a>
      </div>
    </section>

    <!-- ══ 5 · RSVP ════════════════════════════════════════════ -->
    <section id="rsvp" class="panel">
      <img class="cluster cluster-br" src="assets/img/cluster-bottom-right.svg" alt="" aria-hidden="true" width="380" height="420" loading="lazy">
      <div class="rsvp-inner" data-reveal>
        <p class="caps">RSVP</p>
        <hr class="rule">
        <p class="body-note">Tell us you're coming — type your name and your whole party can answer together.</p>
        <form id="rsvp-form" novalidate>
          <div class="field">
            <label for="guest-name">Your full name</label>
            <input id="guest-name" name="name" type="text" autocomplete="name" autocapitalize="words" required>
            <p class="hint" id="lookup-status" aria-live="polite"></p>
          </div>
          <div id="group-card" class="group-card" hidden>
            <p class="group-label" id="group-label"></p>
            <ul id="group-members" class="group-members"></ul>
          </div>
          <div id="manual" hidden>
            <div class="field">
              <label for="party-size">How many of you will join us?</label>
              <input id="party-size" type="number" inputmode="numeric" min="1" max="10" value="1">
            </div>
          </div>
          <fieldset id="choice" class="choice" hidden>
            <legend class="visually-hidden">Will you attend?</legend>
            <label class="choice-card">
              <input type="radio" name="attending" value="yes">
              <span class="choice-title">Joyfully accepts</span>
              <span class="choice-sub">We'll be there</span>
            </label>
            <label class="choice-card">
              <input type="radio" name="attending" value="no">
              <span class="choice-title">Regretfully declines</span>
              <span class="choice-sub">Celebrating from afar</span>
            </label>
          </fieldset>
          <input type="text" name="website" id="website" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" id="rsvp-submit" class="button" hidden>Send our reply</button>
          <button type="button" id="manual-toggle" class="link-button" hidden>Can't find your name? RSVP anyway</button>
          <p id="rsvp-error" class="hint error" role="alert" hidden></p>
        </form>
        <div id="rsvp-done" hidden>
          <svg id="orchid" class="orchid" viewBox="0 0 120 120" aria-hidden="true">
            <ellipse class="petal" cx="60" cy="34" rx="14" ry="26"/>
            <ellipse class="petal" cx="38" cy="52" rx="14" ry="26" transform="rotate(-65 38 52)"/>
            <ellipse class="petal" cx="82" cy="52" rx="14" ry="26" transform="rotate(65 82 52)"/>
            <ellipse class="petal lip" cx="60" cy="74" rx="10" ry="16"/>
            <circle class="orchid-heart" cx="60" cy="60" r="7"/>
          </svg>
          <p class="thanks-line">Thank you</p>
          <p id="done-message" class="body-note"></p>
        </div>
      </div>
    </section>

    <!-- ══ 6 · Closing ═════════════════════════════════════════ -->
    <section id="closing" class="panel closing">
      <div data-reveal>
        <div id="countdown" class="countdown" aria-label="Countdown to the engagement">
          <div class="count-unit"><span class="count-num" data-unit="days">–</span><span class="count-label caps small">days</span></div>
          <div class="count-unit"><span class="count-num" data-unit="hours">–</span><span class="count-label caps small">hours</span></div>
          <div class="count-unit"><span class="count-num" data-unit="minutes">–</span><span class="count-label caps small">minutes</span></div>
          <div class="count-unit"><span class="count-num" data-unit="seconds">–</span><span class="count-label caps small">seconds</span></div>
        </div>
        <hr class="rule">
        <p class="closing-message">Please make sure to arrive on time to avoid any delays! Can't wait to celebrate with you!</p>
        <svg class="monogram small" viewBox="0 0 120 80" aria-hidden="true">
          <text x="30" y="60" class="mono-letter">A</text>
          <text x="62" y="66" class="mono-letter">S</text>
        </svg>
      </div>
    </section>
  </main>

  <script src="assets/js/config.js"></script>
  <script src="assets/js/lib.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
  <script defer src="assets/js/motion.js"></script>
  <script defer src="assets/js/rsvp.js"></script>
  <script defer src="assets/js/countdown.js"></script>
</body>
</html>
```

- [ ] **Step 2: Append typography and layout to `assets/css/style.css`**

```css
/* ── Layout ─────────────────────────────────────────────────────── */
main { position: relative; z-index: 2; }
.panel {
  position: relative;
  padding: 5rem 1.5rem;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}
.hero { min-height: 100svh; display: flex; align-items: center; justify-content: center; padding-top: 6rem; }
.interlude { min-height: 55svh; }
.closing { padding-bottom: 7rem; }

/* ── Typography ─────────────────────────────────────────────────── */
.caps {
  font-family: var(--font-display);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.95rem;
  color: var(--olive);
  margin: 1.1rem 0;
}
.caps.small { font-size: 0.8rem; letter-spacing: 0.24em; }
.rule {
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--olive) 35%, transparent);
  width: 9rem;
  margin: 1.6rem auto;
}
.names-block { margin: 1.4rem 0; font-weight: 300; }
.names-block span { display: block; }
.first-name {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 11vw, 4.2rem);
  line-height: 1.12;
  color: var(--olive);
}
.surname {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.4em;
  font-size: 0.95rem;
  color: var(--olive);
  margin: 0.35rem 0 0.9rem;
}
.amp {
  font-family: var(--font-script);
  font-size: 2.4rem;
  color: var(--rose);
  margin: 0.2rem 0;
}
.script-word {
  font-family: var(--font-script);
  font-size: clamp(3rem, 13vw, 4.6rem);
  color: var(--rose);
  margin: 0.6rem 0;
  line-height: 1.2;
}
.date-line .date-day { color: var(--rose); font-size: 1.25em; }
.bar { color: color-mix(in srgb, var(--olive) 45%, transparent); margin: 0 0.35em; }
.monogram { width: 96px; height: auto; margin: 0 auto; display: block; }
.monogram.small { width: 64px; margin-top: 2.2rem; }
.mono-letter {
  font-family: var(--font-display);
  font-size: 58px;
  fill: var(--rose);
  stroke: var(--rose);
  stroke-width: 0.6;
}
.body-note { max-width: 34ch; margin: 1rem auto; }

/* ── Cards ──────────────────────────────────────────────────────── */
.card {
  background: var(--paper-raised);
  border: 1px solid color-mix(in srgb, var(--olive) 18%, transparent);
  box-shadow: 0 14px 40px -18px color-mix(in srgb, var(--ink) 28%, transparent);
  padding: 2.4rem 1.6rem;
}
.big-date { font-family: var(--font-display); margin: 1rem 0; }
.big-date .huge { font-size: 3.4rem; color: var(--rose); display: block; line-height: 1; margin: 0.4rem 0; }

/* ── Map card ───────────────────────────────────────────────────── */
.map-art { width: 100%; height: auto; margin: 1rem 0; }
.map-road { fill: none; stroke: color-mix(in srgb, var(--olive-light) 45%, transparent); stroke-width: 2; }
.map-road.wide { stroke-width: 5; }
.map-pin { fill: var(--rose); }
.map-pin-dot { fill: var(--magenta); }
.venue-name { font-size: 1.2rem; margin-bottom: 0; }

/* ── Buttons ────────────────────────────────────────────────────── */
.button {
  display: inline-block;
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.85rem;
  color: var(--paper-raised);
  background: var(--rose);
  border: 0;
  padding: 0.95rem 2rem;
  margin-top: 1.4rem;
  text-decoration: none;
  cursor: pointer;
}
.button:hover { background: var(--magenta); }
.button:focus-visible, input:focus-visible, .choice-card:has(input:focus-visible) {
  outline: 3px solid var(--rose-soft);
  outline-offset: 2px;
}
.link-button {
  background: none; border: 0; cursor: pointer;
  font-family: var(--font-body); font-style: italic; font-size: 0.95rem;
  color: var(--ink); text-decoration: underline; margin-top: 1rem;
}

/* ── Clusters (florals) ─────────────────────────────────────────── */
.cluster { position: absolute; pointer-events: none; mix-blend-mode: multiply; z-index: 1; }
.cluster-tl { top: 0; left: 0; width: min(46vw, 300px); height: auto; }
.cluster-r { top: 22%; right: 0; width: min(24vw, 180px); height: auto; }
.cluster-hang { top: 0; left: 4vw; width: min(30vw, 200px); height: auto; position: absolute; }
.cluster-br { bottom: -3rem; right: 0; width: min(48vw, 320px); height: auto; }

/* ── Vine ───────────────────────────────────────────────────────── */
.vine { position: absolute; top: 0; left: 0; width: 100%; z-index: 1; pointer-events: none; overflow: visible; }
.vine-path { fill: none; stroke: var(--olive-light); stroke-width: 1.6; stroke-linecap: round; }
.vine-leaf { fill: var(--olive-light); opacity: 0.85; }
.vine-bud { fill: var(--rose-soft); }

/* ── Forms ──────────────────────────────────────────────────────── */
.field { margin: 1.4rem 0; text-align: left; }
.field label { display: block; font-size: 0.9rem; letter-spacing: 0.06em; margin-bottom: 0.4rem; }
.field input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 1.05rem;
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid color-mix(in srgb, var(--olive) 35%, transparent);
  padding: 0.8rem 1rem;
}
.hint { font-size: 0.85rem; min-height: 1.2em; margin: 0.4rem 0 0; }
.hint.error { color: var(--magenta); }
.group-card {
  background: var(--paper-raised);
  border: 1px solid color-mix(in srgb, var(--olive) 22%, transparent);
  padding: 1.2rem 1.4rem; margin: 1.2rem 0; text-align: left;
}
.group-label { font-family: var(--font-display); font-size: 1.15rem; color: var(--olive); margin: 0 0 0.5rem; }
.group-members { list-style: none; padding: 0; margin: 0; }
.group-members li { padding: 0.15rem 0; }
.choice { border: 0; padding: 0; margin: 1.2rem 0; display: grid; gap: 0.8rem; }
.choice-card {
  display: block; cursor: pointer; text-align: center;
  background: var(--paper-raised);
  border: 1px solid color-mix(in srgb, var(--olive) 28%, transparent);
  padding: 1.1rem 1rem;
}
.choice-card input { position: absolute; opacity: 0; }
.choice-card:has(input:checked) { border-color: var(--rose); box-shadow: inset 0 0 0 1px var(--rose); }
.choice-title { display: block; font-family: var(--font-display); font-size: 1.25rem; color: var(--olive); }
.choice-card:has(input:checked) .choice-title { color: var(--rose); }
.choice-sub { font-size: 0.85rem; font-style: italic; }
.honeypot { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.thanks-line { font-family: var(--font-display); font-style: italic; font-size: 2rem; color: var(--rose); margin: 1rem 0 0.4rem; }
.orchid { width: 90px; height: auto; margin: 0 auto; display: block; }
.orchid .petal { fill: var(--rose-soft); opacity: 0.9; }
.orchid .petal.lip { fill: var(--rose); }
.orchid .orchid-heart { fill: var(--magenta); }

/* ── Countdown ──────────────────────────────────────────────────── */
.countdown { display: flex; justify-content: center; gap: 1.4rem; }
.count-unit { display: grid; gap: 0.2rem; }
.count-num {
  font-family: var(--font-display);
  font-weight: 300;
  font-size: 2.2rem;
  letter-spacing: 0.08em;
  color: var(--olive);
  font-variant-numeric: tabular-nums;
}
.closing-message { max-width: 30ch; margin: 1.4rem auto; font-size: 1.1rem; }

/* ── Utilities ──────────────────────────────────────────────────── */
.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
[hidden] { display: none !important; }

/* ── Wider screens ──────────────────────────────────────────────── */
@media (min-width: 700px) {
  .panel { padding: 7rem 2rem; }
  .choice { grid-template-columns: 1fr 1fr; }
  .cluster-tl { width: min(30vw, 420px); }
  .cluster-br { width: min(34vw, 380px); }
}
```

- [ ] **Step 3: Verify in a browser**

Run: `start index.html` — check at 360px (devtools) and full width:
- All hero lines present, in spec order, hairline rules between blocks.
- Script font on exactly *Engagement* and the ampersand; "09" rose in both date lines.
- No horizontal scroll at 360px. Broken cluster images are expected (Task 5).

- [ ] **Step 4: Commit**

```bash
git add index.html assets/css/style.css
git commit -m "feat: full static invitation page — markup, typography, sections

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Shared pure logic with tests

**Files:**
- Create: `assets/js/lib.js`
- Test: `tests/lib.test.js`

**Interfaces:**
- Produces: global `InviteLib` (and CommonJS export) with:
  - `normalizeName(s: string): string`
  - `levenshtein(a: string, b: string): number`
  - `matchGuest(query: string, guests: {groupId,name,label}[]): guest|null`
  - `countdownParts(targetMs: number, nowMs: number): {days,hours,minutes,seconds,done}`
  - `buildWhatsAppUrl(phone: string, label: string, attending: boolean): string`
  - `buildVinePath(height: number, waypoints: {y,x}[], amplitude: number, wavelength: number): string`

- [ ] **Step 1: Write the failing tests — `tests/lib.test.js`**

```js
const test = require('node:test');
const assert = require('node:assert');
const L = require('../assets/js/lib.js');

const GUESTS = [
  { groupId: 'g001', name: 'Ahmed Kamal', label: 'The Kamal Family' },
  { groupId: 'g001', name: 'Mona Kamal', label: 'The Kamal Family' },
  { groupId: 'g002', name: 'Youssef Adel', label: 'Youssef Adel & Guest' },
];

test('normalizeName lowercases, strips diacritics, collapses spaces', () => {
  assert.equal(L.normalizeName('  Sarah   HESHAM '), 'sarah hesham');
  assert.equal(L.normalizeName('Rénée'), 'renee');
  assert.equal(L.normalizeName("O'Brien-Smith"), 'obrien smith');
});

test('levenshtein', () => {
  assert.equal(L.levenshtein('sara', 'sarah'), 1);
  assert.equal(L.levenshtein('ahmed', 'ahmed'), 0);
  assert.equal(L.levenshtein('mona', 'youssef'), 7);
});

test('matchGuest: exact normalised match wins', () => {
  assert.equal(L.matchGuest('AHMED kamal', GUESTS).groupId, 'g001');
});

test('matchGuest: all typed tokens present matches', () => {
  assert.equal(L.matchGuest('kamal mona', GUESTS).name, 'Mona Kamal');
});

test('matchGuest: fuzzy within distance 2', () => {
  assert.equal(L.matchGuest('yousef adel', GUESTS).groupId, 'g002');
});

test('matchGuest: under 3 chars or no match returns null', () => {
  assert.equal(L.matchGuest('ah', GUESTS), null);
  assert.equal(L.matchGuest('completely unknown person', GUESTS), null);
});

test('countdownParts', () => {
  const p = L.countdownParts(1000 * (2 * 86400 + 3 * 3600 + 4 * 60 + 5), 0);
  assert.deepEqual(p, { days: 2, hours: 3, minutes: 4, seconds: 5, done: false });
  assert.equal(L.countdownParts(0, 1000).done, true);
});

test('buildWhatsAppUrl encodes the message', () => {
  const url = L.buildWhatsAppUrl('20100000000', 'The Kamal Family', true);
  assert.ok(url.startsWith('https://wa.me/20100000000?text='));
  assert.ok(decodeURIComponent(url).includes('Joyfully accepts'));
});

test('buildVinePath starts at first waypoint and ends at height', () => {
  const wps = [{ y: 0, x: 340 }, { y: 1000, x: 340 }];
  const d = L.buildVinePath(1000, wps, 26, 240);
  assert.ok(d.startsWith('M 340 0'));
  assert.ok(d.trim().endsWith('340 1000'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL — cannot find module `../assets/js/lib.js`.

- [ ] **Step 3: Write `assets/js/lib.js`**

```js
// Shared pure helpers — used by the browser, Node tests, and (copied
// verbatim to Lib.gs) Google Apps Script. No DOM, no I/O.
var InviteLib = (function () {
  'use strict';

  function normalizeName(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z؀-ۿ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(a, b) {
    var prev = [], curr = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      curr = [i];
      for (j = 1; j <= b.length; j++) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      prev = curr;
    }
    return prev[b.length];
  }

  // Cascade: exact → all tokens present → levenshtein ≤ 2. Null under 3 chars.
  function matchGuest(query, guests) {
    var q = normalizeName(query);
    if (q.length < 3) return null;
    var i, n;
    for (i = 0; i < guests.length; i++) {
      if (normalizeName(guests[i].name) === q) return guests[i];
    }
    var tokens = q.split(' ');
    for (i = 0; i < guests.length; i++) {
      n = normalizeName(guests[i].name);
      var all = true;
      for (var t = 0; t < tokens.length; t++) {
        if (n.indexOf(tokens[t]) === -1) { all = false; break; }
      }
      if (all) return guests[i];
    }
    var best = null, bestD = 3;
    for (i = 0; i < guests.length; i++) {
      var d = levenshtein(normalizeName(guests[i].name), q);
      if (d < bestD) { bestD = d; best = guests[i]; }
    }
    return best;
  }

  function countdownParts(targetMs, nowMs) {
    var s = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      done: s === 0
    };
  }

  function buildWhatsAppUrl(phone, label, attending) {
    var text = 'RSVP — ' + label + ': ' +
      (attending ? 'Joyfully accepts' : 'Regretfully declines');
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
  }

  // One continuous S-curving path. waypoints: [{y, x}] sorted by y —
  // the centreline x is interpolated linearly between them (this is
  // how the vine crosses margins at the Location section).
  function buildVinePath(height, waypoints, amplitude, wavelength) {
    function xAt(y) {
      if (y <= waypoints[0].y) return waypoints[0].x;
      for (var i = 1; i < waypoints.length; i++) {
        if (y <= waypoints[i].y) {
          var a = waypoints[i - 1], b = waypoints[i];
          return a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y || 1));
        }
      }
      return waypoints[waypoints.length - 1].x;
    }
    var d = 'M ' + xAt(0) + ' 0';
    var y = 0, dir = 1;
    while (y < height) {
      var y2 = Math.min(y + wavelength, height);
      d += ' C ' + (xAt(y) + dir * amplitude) + ' ' + (y + (y2 - y) * 0.25) +
           ', ' + (xAt(y2) + dir * amplitude) + ' ' + (y2 - (y2 - y) * 0.25) +
           ', ' + xAt(y2) + ' ' + y2;
      dir = -dir;
      y = y2;
    }
    return d;
  }

  return {
    normalizeName: normalizeName,
    levenshtein: levenshtein,
    matchGuest: matchGuest,
    countdownParts: countdownParts,
    buildWhatsAppUrl: buildWhatsAppUrl,
    buildVinePath: buildVinePath
  };
})();
if (typeof module !== 'undefined') module.exports = InviteLib;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/js/lib.js tests/lib.test.js
git commit -m "feat: shared pure logic — name matching, countdown, vine path

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Google Apps Script backend

**Files:**
- Create: `google-apps-script/Code.gs`, `google-apps-script/Lib.gs`
- Modify: `README.md` (Sheet setup section)

**Interfaces:**
- Consumes: `matchGuest` from Lib.gs (verbatim copy of `assets/js/lib.js` — the `typeof module` guard makes it inert in Apps Script).
- Produces: `GET ?action=lookup&name=<q>` → `{found:false}` or `{found:true, groupId, label, members:[string]}` (JSONP when `callback` param present). `POST` (text/plain JSON body `{groupId, label, members, partySize, attending, submittedBy, website}`) → `{ok:true|false}`, upserted by GroupID.

- [ ] **Step 1: Copy `assets/js/lib.js` to `google-apps-script/Lib.gs`**

```powershell
Copy-Item assets/js/lib.js google-apps-script/Lib.gs
```

Add this comment as the first line of `Lib.gs`:
```js
// GENERATED COPY of assets/js/lib.js — edit that file, re-copy here.
```

- [ ] **Step 2: Write `google-apps-script/Code.gs`**

```js
// Engagement RSVP endpoint. Deploy: Extensions → Apps Script → Deploy →
// New deployment → Web app → Execute as: Me / Access: Anyone.
var SHEET_ID = 'PASTE_SHEET_ID_HERE';

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== 'lookup') return json_({ ok: true });
  var result = lookup_(p.name || '');
  if (p.callback && /^[\w.]+$/.test(p.callback)) { // JSONP fallback
    return ContentService
      .createTextOutput(p.callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(result);
}

function lookup_(nameQuery) {
  var rows = SpreadsheetApp.openById(SHEET_ID)
    .getSheetByName('Guests').getDataRange().getValues();
  var guests = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1]) {
      guests.push({
        groupId: String(rows[i][0]),
        name: String(rows[i][1]),
        label: String(rows[i][2])
      });
    }
  }
  var hit = InviteLib.matchGuest(nameQuery, guests);
  if (!hit) return { found: false };
  var members = [];
  for (var j = 0; j < guests.length; j++) {
    if (guests[j].groupId === hit.groupId) members.push(guests[j].name);
  }
  return { found: true, groupId: hit.groupId, label: hit.label, members: members };
}

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false }); }
  if (data.website) return json_({ ok: true }); // honeypot: fake success, write nothing

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('RSVPs');
  var now = new Date();
  var groupId = String(data.groupId || ('manual-' + now.getTime()));
  var row = [
    now, now, groupId,
    String(data.label || ''),
    (data.members || []).join(', '),
    Number(data.partySize) || 0,
    data.attending ? 'Joyfully accepts' : 'Regretfully declines',
    String(data.submittedBy || '')
  ];
  // Upsert by GroupID (column C); manual rows always append.
  if (groupId.indexOf('manual-') !== 0) {
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][2]) === groupId) {
        row[0] = values[i][0]; // keep first-submitted timestamp
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        return json_({ ok: true });
      }
    }
  }
  sheet.appendRow(row);
  return json_({ ok: true });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 3: Fill in the README "Google Sheet setup" section**

Replace `(Filled in by Task 4.)` with:

```markdown
1. Create a Google Sheet named **Engagement RSVPs** with two tabs:
   - **Guests** — header row `GroupID | Full Name | Group Label`, then one
     row per invited person. Everyone sharing a GroupID answers together.
     Example: `g001 | Ahmed Kamal | The Kamal Family`.
   - **RSVPs** — header row
     `Timestamp | Updated At | GroupID | Group Label | Members | Party Size | Attending | Submitted By`.
     Leave the rest empty; the website writes here.
2. In the Sheet: **Extensions → Apps Script**. Create two files, paste in
   `google-apps-script/Code.gs` and `google-apps-script/Lib.gs`. In
   `Code.gs`, set `SHEET_ID` to the long id from the Sheet's URL.
3. **Deploy → New deployment → Web app** — Execute as **Me**, access
   **Anyone**. Copy the deployment URL into `appsScriptUrl` in
   `assets/js/config.js`.
4. To change the guest list later, just edit the Guests tab. No redeploy.
```

- [ ] **Step 4: Verify against a real deployment**

Create the Sheet per the README with sample rows `g001 Ahmed Kamal / g001 Mona Kamal / g002 Youssef Adel`, deploy, then:

```powershell
# Expect {"found":true,...,"members":["Ahmed Kamal","Mona Kamal"]}
curl.exe -sL "<DEPLOY_URL>?action=lookup&name=ahmed%20kamal"
# Expect {"found":false}
curl.exe -sL "<DEPLOY_URL>?action=lookup&name=nobody%20here"
# Expect {"ok":true} and a row in RSVPs
curl.exe -sL -X POST -H "Content-Type: text/plain;charset=utf-8" -d "{\"groupId\":\"g001\",\"label\":\"The Kamal Family\",\"members\":[\"Ahmed Kamal\",\"Mona Kamal\"],\"partySize\":2,\"attending\":true,\"submittedBy\":\"Ahmed Kamal\"}" "<DEPLOY_URL>"
# Re-POST with attending false — verify the SAME row updates (upsert), not a new one.
# POST with "website":"x" — expect ok:true but NO new row (honeypot).
```

If no Google account is available in this session, mark this step for the user and verify in Task 9.

- [ ] **Step 5: Commit**

```bash
git add google-apps-script/ README.md
git commit -m "feat: Apps Script RSVP backend — lookup, upsert submit, honeypot

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Botanical artwork — symbols, clusters, monogram polish

**Files:**
- Create: `assets/svg/flora.svg`, `assets/img/cluster-top-left.svg`, `assets/img/cluster-right.svg`, `assets/img/cluster-amaranthus.svg`, `assets/img/cluster-bottom-right.svg`
- Modify: `README.md` (artwork swap section)

**Interfaces:**
- Consumes: `<img class="cluster">` slots from Task 2 (exact filenames above).
- Produces: standalone SVG cluster files. Swap seam: when the real invitation artwork arrives, crops are exported to the same four positions and the four `src` attributes in `index.html` are updated — documented in README.

- [ ] **Step 1: Write the symbol set `assets/svg/flora.svg`**

Watercolour feel comes from layered translucent fills plus a slight blur. Palette only from tokens (hex literals here since SVG files don't see CSS vars).

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
  <defs>
    <filter id="wc" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.6"/>
    </filter>
    <g id="orchid">
      <ellipse cx="0" cy="-16" rx="9" ry="17" fill="#E9A9BC" opacity="0.85" filter="url(#wc)"/>
      <ellipse cx="-14" cy="-2" rx="9" ry="17" fill="#E9A9BC" opacity="0.8" transform="rotate(-65)" filter="url(#wc)"/>
      <ellipse cx="14" cy="-2" rx="9" ry="17" fill="#E9A9BC" opacity="0.8" transform="rotate(65)" filter="url(#wc)"/>
      <ellipse cx="-8" cy="9" rx="8" ry="13" fill="#F0C3D0" opacity="0.85" transform="rotate(-30)" filter="url(#wc)"/>
      <ellipse cx="8" cy="9" rx="8" ry="13" fill="#F0C3D0" opacity="0.85" transform="rotate(30)" filter="url(#wc)"/>
      <path d="M0 2 C -5 8, -3 14, 0 16 C 3 14, 5 8, 0 2 Z" fill="#C75B77"/>
      <circle cx="0" cy="1" r="3.4" fill="#BE3D6B"/>
    </g>
    <g id="calla">
      <path d="M0 30 C -1 16, -2 6, 0 0" stroke="#8A9A5B" stroke-width="2.4" fill="none"/>
      <path d="M0 2 C -12 -6, -10 -24, 0 -30 C 6 -22, 10 -8, 3 3 Z" fill="#C75B77" opacity="0.85" filter="url(#wc)"/>
      <path d="M0 0 C -6 -8, -5 -18, 0 -24" stroke="#BE3D6B" stroke-width="1.6" fill="none" opacity="0.7"/>
    </g>
    <g id="anthurium">
      <path d="M0 -22 C 16 -18, 18 4, 4 18 C 0 22, -4 20, -6 14 C -16 2, -12 -18, 0 -22 Z" fill="#F0C3D0" opacity="0.75" filter="url(#wc)"/>
      <path d="M0 -22 C 16 -18, 18 4, 4 18" stroke="#E9A9BC" stroke-width="1.2" fill="none"/>
      <path d="M-1 -18 L 1 8" stroke="#C75B77" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <g id="amaranthus">
      <path d="M0 0 C 2 24, -2 46, 1 70" stroke="#8A9A5B" stroke-width="1.6" fill="none"/>
      <g fill="#8A9A5B" opacity="0.75">
        <circle cx="-2" cy="8" r="2.6"/><circle cx="3" cy="14" r="2.6"/><circle cx="-1" cy="21" r="2.6"/>
        <circle cx="2" cy="28" r="2.4"/><circle cx="-2" cy="35" r="2.4"/><circle cx="2" cy="42" r="2.2"/>
        <circle cx="-1" cy="49" r="2.2"/><circle cx="1" cy="56" r="2"/><circle cx="0" cy="63" r="1.8"/>
      </g>
    </g>
    <g id="blossom">
      <g fill="#E9A9BC" opacity="0.9">
        <ellipse cx="0" cy="-4" rx="2.6" ry="4"/>
        <ellipse cx="-4" cy="1" rx="2.6" ry="4" transform="rotate(-70)"/>
        <ellipse cx="4" cy="1" rx="2.6" ry="4" transform="rotate(70)"/>
        <ellipse cx="-2.5" cy="4" rx="2.6" ry="4" transform="rotate(-140)"/>
        <ellipse cx="2.5" cy="4" rx="2.6" ry="4" transform="rotate(140)"/>
      </g>
      <circle r="1.6" fill="#C75B77"/>
    </g>
    <g id="leaf">
      <path d="M0 0 C 8 -4, 16 -2, 20 6 C 12 10, 4 8, 0 0 Z" fill="#8A9A5B" opacity="0.8" filter="url(#wc)"/>
    </g>
    <g id="sprig">
      <path d="M0 0 C 4 -14, 2 -28, 6 -40" stroke="#8A9A5B" stroke-width="1.2" fill="none"/>
      <use href="#leaf" transform="translate(2 -12) scale(0.5)"/>
      <use href="#leaf" transform="translate(3 -24) scale(0.45) rotate(-30)"/>
      <use href="#leaf" transform="translate(5 -34) scale(0.4) rotate(20)"/>
    </g>
  </defs>
</svg>
```

- [ ] **Step 2: Write the four cluster files**

Each is standalone (symbols inlined by reference won't cross files for `<img>`, so each cluster file `<use>`s symbols defined in its own `<defs>` — copy the `<defs>` block from `flora.svg` into each file). Compositions:

`assets/img/cluster-top-left.svg` — viewBox `0 0 420 480`, heavy corner: 3 orchids (translate ~(90,120) scale 1.6; (170,80) scale 1.2 rotate 20; (60,220) scale 1.1 rotate -15), 2 callas ((240,140) scale 1.4 rotate 35; (200,220) scale 1.1 rotate 60), 1 anthurium ((140,40) scale 1.5 rotate -10), 2 amaranthus hanging ((70,260) scale 1.3; (150,280) scale 1.1 rotate 8), blossom spray (4 blossoms scattered (260,60)…(320,120) scales 0.8–1.2), 3 sprigs fanning outward.

`assets/img/cluster-right.svg` — viewBox `0 0 260 620`, the climbing vine edge: one long S-path stem (`M 200 620 C 160 480, 240 360, 190 220 C 160 130, 210 60, 180 0` stroke `#8A9A5B` width 2), 5 sprigs branching off it at y≈100/220/340/460/560 alternating rotation, 3 blossoms near the top, 1 small calla at (170, 400) scale 0.9 rotate -20.

`assets/img/cluster-amaranthus.svg` — viewBox `0 0 220 520`, hanging interlude piece: 3 amaranthus from the top edge ((60,0) scale 2.4; (120,0) scale 2.0 rotate 4; (170,0) scale 1.6 rotate -6), 2 leaves at their bases, nothing else — airy by design.

`assets/img/cluster-bottom-right.svg` — viewBox `0 0 380 420`, mirror-weight of top-left: 2 orchids ((260,280) scale 1.7; (180,340) scale 1.2 rotate -25), 1 anthurium ((300,180) scale 1.6 rotate 15), 2 callas ((120,300) scale 1.2 rotate -50; (330,300) scale 1.0 rotate 30), 1 amaranthus rising ((340,120) scale 1.2 rotate 180), blossom trail along the bottom ((40,380)…(200,400), 5 blossoms scales 0.7–1.1), 2 sprigs.

Author each file fully with these transforms; tune positions visually in the browser until the diagonal composition (heavy top-left ↔ heavy bottom-right) matches the invitation's balance.

- [ ] **Step 3: Add the artwork-swap section to README**

```markdown
## Swapping in the real invitation artwork
The site ships with drawn florals. To use the invitation's own artwork:
1. Get the designer's original (PDF or print-resolution PNG) into
   `assets/source/` (this folder never uploads).
2. Crop the four regions — top-left cluster, right climbing vine,
   hanging amaranthus, bottom-right cluster — and export each as WebP
   (~1200px on the long side) into `assets/img/`.
3. In `index.html`, change the four `cluster-*.svg` filenames to the new
   files. The `mix-blend-mode: multiply` styling makes the cream
   background of the crops disappear against the page — no cut-outs needed.
```

- [ ] **Step 4: Verify in a browser**

Reload `index.html`: four clusters render, framing not crowding; text never overlaps flora at 360px and 1440px; multiply blend shows paper grain through the petals.

- [ ] **Step 5: Commit**

```bash
git add assets/svg/ assets/img/ README.md
git commit -m "feat: watercolour botanical clusters and symbol set

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Motion — vine, hero unfold, beats

**Files:**
- Create: `assets/js/motion.js`
- Modify: `assets/css/style.css` (append motion-initial states)

**Interfaces:**
- Consumes: `InviteLib.buildVinePath`, `#vine`, `.cluster`, `[data-reveal]`, section ids from Task 2; GSAP/ScrollTrigger/Lenis globals from CDN.
- Produces: `window.bloomOrchid()` — called by rsvp.js on successful submit.

- [ ] **Step 1: Append motion CSS**

```css
/* ── Motion initial states (only when JS + motion allowed) ─────── */
html.motion [data-reveal] { opacity: 0; transform: translateY(24px); }
html.motion .hero .cluster { opacity: 0; }
html.motion .orchid .petal, html.motion .orchid .orchid-heart {
  transform-origin: 60px 60px; transform: scale(0); 
}
.orchid.bloomed .petal, .orchid.bloomed .orchid-heart { transform: scale(1); transition: transform 0.9s cubic-bezier(.2,.8,.3,1.1); }
.orchid.bloomed .petal:nth-child(2) { transition-delay: 0.08s; }
.orchid.bloomed .petal:nth-child(3) { transition-delay: 0.16s; }
.orchid.bloomed .petal.lip { transition-delay: 0.26s; }
.orchid.bloomed .orchid-heart { transition-delay: 0.36s; }
```

- [ ] **Step 2: Write `assets/js/motion.js`**

```js
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
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
      buildVine();
      wireReveals();
      wireHero();
      ScrollTrigger.refresh();
    }, 250);
  });

  // ── Hero: bouquet unfold ──────────────────────────────────────
  function wireHero() {
    var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.monogram .mono-letter', { opacity: 0, y: 10, stagger: 0.2, duration: 0.9 })
      .to('.hero .cluster', { opacity: 1, duration: 1.2 }, '-=0.4')
      .from('.cluster-tl', { xPercent: 18, yPercent: 12, rotation: 8, duration: 1.4 }, '<')
      .from('.cluster-r', { xPercent: 24, rotation: -6, duration: 1.4 }, '<')
      .to('.hero [data-reveal]', { opacity: 1, y: 0, stagger: 0.12, duration: 0.8 }, '-=0.8');
    // Desktop only: gentle parallax retreat of the clusters as you leave.
    gsap.matchMedia().add('(min-width: 900px)', function () {
      gsap.to('.cluster-tl', {
        yPercent: -12, ease: 'none',
        scrollTrigger: { trigger: '#names', start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }
  wireHero();

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
```

- [ ] **Step 3: Verify in a browser**

- Scroll top→bottom: vine draws continuously, crosses to the left margin at Location (desktop width), stays right-edge and fainter under 600px.
- Hero clusters unfold outward on load; content staggers in.
- With OS reduced-motion enabled (or devtools emulation): page fully visible, nothing hidden, no vine draw.
- Devtools performance: no layout thrash while scrolling (only transform/opacity/dashoffset).

- [ ] **Step 4: Commit**

```bash
git add assets/js/motion.js assets/css/style.css
git commit -m "feat: scroll-drawn vine, hero unfold, section reveals

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: RSVP front-end

**Files:**
- Create: `assets/js/rsvp.js`

**Interfaces:**
- Consumes: `INVITE_CONFIG.appsScriptUrl`, `INVITE_CONFIG.whatsappPhone`, `InviteLib.buildWhatsAppUrl`, `window.bloomOrchid()`, form ids from Task 2, backend contract from Task 4.
- Produces: end-to-end RSVP behaviour.

- [ ] **Step 1: Write `assets/js/rsvp.js`**

```js
(function () {
  'use strict';
  var cfg = window.INVITE_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('rsvp-form'), nameInput = $('guest-name'), status = $('lookup-status');
  var groupCard = $('group-card'), groupLabel = $('group-label'), groupMembers = $('group-members');
  var choice = $('choice'), manual = $('manual'), manualToggle = $('manual-toggle');
  var submitBtn = $('rsvp-submit'), errorEl = $('rsvp-error'), doneEl = $('rsvp-done');

  var state = { group: null, manualMode: false, retried: false };

  // Also open the Maps link from config.
  $('maps-link').href = cfg.mapsUrl;

  // ── Lookup: debounced as the guest types ──────────────────────
  var debounceTimer, lastQuery = '';
  nameInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var q = nameInput.value.trim();
    if (state.manualMode) return;
    if (q.length < 3) { setGroup(null); status.textContent = ''; return; }
    status.textContent = 'Looking for your invitation…';
    debounceTimer = setTimeout(function () { doLookup(q); }, 500);
  });

  function doLookup(q) {
    lastQuery = q;
    var url = cfg.appsScriptUrl + '?action=lookup&name=' + encodeURIComponent(q);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (q !== lastQuery) return; // stale response
        if (res.found) {
          setGroup(res);
          status.textContent = '';
        } else {
          setGroup(null);
          status.textContent = "We couldn't find that name — try your full name as written on your invitation.";
          manualToggle.hidden = false;
        }
      })
      .catch(function () { jsonpLookup(q); });
  }

  // JSONP fallback if CORS misbehaves on some in-app browser.
  function jsonpLookup(q) {
    var cbName = 'inviteCb' + Date.now();
    window[cbName] = function (res) {
      delete window[cbName];
      if (res && res.found) { setGroup(res); status.textContent = ''; }
      else { setGroup(null); manualToggle.hidden = false; status.textContent = "We couldn't reach the guest list — you can still RSVP below."; }
    };
    var s = document.createElement('script');
    s.src = cfg.appsScriptUrl + '?action=lookup&name=' + encodeURIComponent(q) + '&callback=' + cbName;
    s.onerror = function () { setGroup(null); manualToggle.hidden = false; status.textContent = 'You can still RSVP — just tell us how many below.'; };
    document.body.appendChild(s);
  }

  function setGroup(res) {
    state.group = res;
    if (res) {
      groupLabel.textContent = res.label;
      groupMembers.innerHTML = '';
      res.members.forEach(function (m) {
        var li = document.createElement('li');
        li.textContent = m;
        groupMembers.appendChild(li);
      });
      groupCard.hidden = false;
      choice.hidden = false;
      submitBtn.hidden = false;
      manual.hidden = true;
      manualToggle.hidden = true;
    } else {
      groupCard.hidden = true;
      if (!state.manualMode) { choice.hidden = true; submitBtn.hidden = true; }
    }
  }

  manualToggle.addEventListener('click', function () {
    state.manualMode = true;
    state.group = null;
    groupCard.hidden = true;
    manual.hidden = false;
    choice.hidden = false;
    submitBtn.hidden = false;
    manualToggle.hidden = true;
    status.textContent = '';
  });

  // ── Submit ────────────────────────────────────────────────────
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errorEl.hidden = true;
    var attending = form.querySelector('input[name="attending"]:checked');
    var name = nameInput.value.trim();
    if (!name) { showError('Please tell us your name.'); return; }
    if (!attending) { showError('Please choose one of the two options.'); return; }

    var payload = state.group ? {
      groupId: state.group.groupId,
      label: state.group.label,
      members: state.group.members,
      partySize: state.group.members.length,
      attending: attending.value === 'yes',
      submittedBy: name,
      website: $('website').value
    } : {
      groupId: '',
      label: name,
      members: [name],
      partySize: Math.max(1, parseInt($('party-size').value, 10) || 1),
      attending: attending.value === 'yes',
      submittedBy: name,
      website: $('website').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    send(payload, attending.value === 'yes');
  });

  function send(payload, isYes) {
    fetch(cfg.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // CORS "simple request"
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error('server said no');
        showDone(payload, isYes);
      })
      .catch(function () {
        if (!state.retried) { state.retried = true; send(payload, isYes); return; }
        // Never lose an RSVP: hand it to WhatsApp.
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send our reply';
        errorEl.innerHTML = '';
        errorEl.appendChild(document.createTextNode('We couldn’t reach the guest book. '));
        var a = document.createElement('a');
        a.href = InviteLib.buildWhatsAppUrl(cfg.whatsappPhone, payload.label, payload.attending);
        a.textContent = 'Send your reply on WhatsApp instead';
        a.target = '_blank';
        a.rel = 'noopener';
        errorEl.appendChild(a);
        errorEl.hidden = false;
      });
  }

  function showDone(payload, isYes) {
    form.hidden = true;
    doneEl.hidden = false;
    $('done-message').textContent = isYes
      ? 'We can’t wait to celebrate with you on October 9th.'
      : 'We’ll miss you — thank you for letting us know.';
    if (window.bloomOrchid) window.bloomOrchid();
    doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
})();
```

- [ ] **Step 2: Verify against the deployed backend**

With `config.js` pointing at the Task 4 deployment, in a browser:
- Type `ahmed kamal` → Kamal Family card with both members → choose accepts → submit → orchid blooms, thank-you shows, row lands in the Sheet.
- Submit again as the same group with declines → the same Sheet row updates.
- Type an unknown name → "can't find" message + manual button → manual path submits with party size.
- Temporarily set `appsScriptUrl` to a bad URL → after retry, WhatsApp fallback link appears and opens a prefilled message.
- Keyboard-only: tab through the form; radios reachable and switchable with arrows; focus rings visible.

- [ ] **Step 3: Commit**

```bash
git add assets/js/rsvp.js
git commit -m "feat: group RSVP — lookup, choice cards, upsert submit, fallbacks

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Countdown and finishing touches

**Files:**
- Create: `assets/js/countdown.js`

**Interfaces:**
- Consumes: `INVITE_CONFIG.eventIso`, `InviteLib.countdownParts`, `#countdown` markup from Task 2.

- [ ] **Step 1: Write `assets/js/countdown.js`**

```js
(function () {
  'use strict';
  var target = new Date(window.INVITE_CONFIG.eventIso).getTime();
  var nums = {};
  ['days', 'hours', 'minutes', 'seconds'].forEach(function (u) {
    nums[u] = document.querySelector('#countdown [data-unit="' + u + '"]');
  });
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function tick() {
    var p = InviteLib.countdownParts(target, Date.now());
    nums.days.textContent = String(p.days);
    nums.hours.textContent = pad(p.hours);
    nums.minutes.textContent = pad(p.minutes);
    nums.seconds.textContent = pad(p.seconds);
    if (p.done) {
      clearInterval(timer);
      document.getElementById('countdown').innerHTML =
        '<p class="thanks-line">Today’s the day</p>';
    }
  }
  var timer = setInterval(tick, 1000);
  tick();
})();
```

- [ ] **Step 2: Verify**

Reload: countdown shows the correct remaining time to Oct 9 2026 15:00 Egypt time and ticks each second. Temporarily set `eventIso` to a past date → "Today's the day" replaces it. Restore.

- [ ] **Step 3: Commit**

```bash
git add assets/js/countdown.js
git commit -m "feat: closing countdown

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Verification pass and deployment docs

**Files:**
- Modify: `README.md` (Deploying section)

- [ ] **Step 1: Run the full test suite**

Run: `node --test tests/`
Expected: all PASS.

- [ ] **Step 2: Cross-viewport check**

In devtools at 360, 390, 768, 1440px: no horizontal scroll, clusters frame not crowd, vine never overlaps text, choice cards side-by-side ≥700px and stacked below.

- [ ] **Step 3: Reduced-motion check**

Emulate `prefers-reduced-motion: reduce`: every section fully visible with no scrolling, no vine draw, no pin; RSVP works; orchid still appears (unanimated) after submit.

- [ ] **Step 4: Performance check**

Lighthouse, mobile preset, throttled: LCP < 1.8s target, total transfer < 300KB (check Network tab, disable cache). If fonts push the budget: subset and self-host woff2 (per spec §4.2) — only if measurement says so.

- [ ] **Step 5: End-to-end against the real Sheet**

Repeat Task 7 Step 2's five checks once more on the final code, plus one lookup with a misspelling (`yousef adel`) confirming fuzzy match.

- [ ] **Step 6: Fill in README Deploying section**

Replace `(Filled in by Task 9.)` with:

```markdown
1. Go to https://app.netlify.com/drop and drag this whole folder in.
2. Netlify gives you a URL — that's the invitation. Rename the site in
   Site settings for a nicer address (e.g. abdelrahman-and-sarah).
3. To update: edit files, drag the folder in again.
4. Send the URL by WhatsApp. Done.
```

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: deployment guide; verification pass complete

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** every spec section maps to a task — palette/type (1–2), hero hierarchy (2), florals hybrid seam (5 + README swap doc), vine + beats + reduced motion (6), backend contract §7.2 including JSONP and honeypot (4), failure modes §7.4 (7), countdown + closing copy (2, 8), performance/a11y/deploy (9). Deliberately deferred per spec: real Maps pin and real artwork are user-supplied config/asset swaps, not tasks.
- **Type consistency:** `InviteLib` names used identically in Tasks 3, 4, 6, 7, 8; backend field names (`groupId`, `label`, `members`, `partySize`, `attending`, `submittedBy`, `website`) match between Code.gs and rsvp.js; DOM ids in Tasks 6–8 all defined in Task 2.
- **Known judgment call:** Task 5 gives exact compositions but expects visual tuning in the browser; that is inherent to artwork and bounded by the verify step.
