# Engagement Invitation Website — Design Spec

**Date:** 2026-08-30
**Couple:** Abdelrahman Samra & Sarah Hesham
**Event:** Friday, October 9 2026, 3:00 PM — King Mariout, Alexandria
**Status:** Awaiting approval

---

## 1. Goal

A single-page website that reads as *the printed invitation, come to life* — not a wedding
template with their details typed into it. Guests arrive from a WhatsApp link, almost all on
phones, scroll the invitation as one continuous piece of paper, and RSVP for their whole family
in two taps.

The reference site the couple shared (zahranandnada.com) is a Wix build: four disconnected
full-height panels that fade in over a fixed background, a serif that fails to load on desktop,
and no RSVP form at all — just a link out. We beat it on three specific axes:

1. **Continuity** — one unbroken sheet of paper with a botanical border that grows as you scroll,
   instead of four slides doing the same fade.
2. **Fidelity** — the actual invitation artwork, not stock florals.
3. **Function** — a real group RSVP with guest-list lookup, writing to a sheet Sarah owns.

## 2. Non-goals

- No Our Story section, no dress code section (both explicitly cut).
- No Arabic translation. English only.
- No gallery, registry, accommodation, or timeline sections.
- No calendar export, no share-card feature (basic `<head>` meta only).
- No admin UI. Sarah reads and manages everything in Google Sheets.
- No account system, no login, no per-guest secret links.

---

## 3. Source material

The couple's actual invitation (received 2026-08-30) is the design authority. Its composition:

- Warm cream paper with visible grain.
- **AS monogram** at top — interlocking A and S, dusty rose, fine-stroked.
- Olive serif typography, centre-aligned, separated by **thin olive hairline rules**.
- "Engagement" set in a delicate rose script — the single script moment on the whole card.
- "09" in the date line picked out in rose while the rest of the line stays olive.
- Florals arranged on a **diagonal**: heavy cluster top-left, heavy cluster bottom-right, with a
  fine climbing vine down the right edge and a trailing vine along the bottom connecting them.
- Flora inventory: pink phalaenopsis orchids, pale veined anthuriums, deep magenta calla lilies,
  pink lilac/blossom sprays, long hanging olive amaranthus, fine leafy vines and tendrils.

**Note:** the invitation's own right-edge climbing vine is the direct source of this site's
central scroll motif. The vine is lifted from the artwork, not invented.

### 3.1 Two discrepancies between the invitation and the written brief

| | Invitation | Brief | Resolution |
|---|---|---|---|
| Names | `Abdelrahman` / `Sarah` (first names, stacked) | `Abdelrahman Samra & Sarah Hesham` | Follow the brief (full names), set the invitation's way: first name large, surname beneath in small tracked olive caps. Overridable in one line. |
| Invite line | "WE INVITE YOU TO CELEBRATE OUR" | "we would love to invite you to celebrate our" | Follow the brief. |

---

## 4. Art direction

### 4.1 Palette

Sampled from the invitation; exact values re-sampled from the source file during build.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4EDE6` | Page ground, warm cream |
| `--paper-raised` | `#FAF6F1` | Cards lifted off the ground |
| `--olive` | `#6A7A42` | Display type, names, caps lines, hairlines |
| `--olive-light` | `#8A9A5B` | Foliage, vine stroke, decorative leaves |
| `--ink` | `#45502C` | Small text only — form labels, helper text |
| `--rose` | `#C75B77` | Script accents, the ampersand, "09", buttons |
| `--rose-soft` | `#E9A9BC` | Petal tints, hover states, focus glow |
| `--magenta` | `#BE3D6B` | Calla-lily depth. Sparing. |
| `--plum` | `#7A5A6B` | Reserved. Only if a third accent proves necessary. |

Forbidden: dark/hunter green, gold, beige/brown, washed-out pastels.

**Contrast decision.** `--olive` on `--paper` measures roughly 3.5:1 — fine for large display text
(WCAG AA large-text threshold is 3:1) but short of the 4.5:1 needed for body copy. Since this page
is an invitation and nearly all its type is display-sized, olive carries the headings, caps lines
and names exactly as printed. Anything genuinely small — form labels, helper text, error messages
— uses `--ink`. This keeps the invitation's colour while staying readable on a phone outdoors.

### 4.2 Typography

| Role | Face | Notes |
|---|---|---|
| Names, display | Cormorant Garamond, 300 | Matches the invitation's high-contrast editorial serif |
| Caps lines | Cormorant Garamond, uppercase, `0.28em` tracking | "TOGETHER WITH OUR FAMILIES", date line, venue line |
| Body / small | EB Garamond, 400 | Same Garamond lineage; holds up at 17px where Cormorant gets too fine |
| Script accent | Great Vibes | **Two places only:** the word *Engagement* and the ampersand |

Loaded from Google Fonts with `preconnect` and `display=swap`. If Egyptian network latency proves
bad in testing, self-host subset woff2 files instead — decided by measurement, not guess.

The **hairline rules** between blocks are a signature detail and must be reproduced: 1px,
`--olive` at ~35% opacity, short and centred, with generous space above and below.

### 4.3 Florals — changed recommendation

The couple previously chose "I author SVG botanicals." **Having now seen the invitation, I
recommend changing to a hybrid**, and this is the one open decision in this spec.

Hand-drawn SVG cannot match the lushness of that watercolour; a vector orchid placed next to their
real artwork would read as a cheaper imitation of it. Since the brief's highest priority is that
the site feel like *their invitation*, the artwork should be their invitation.

- **Raster, lifted from the invitation** — the four heavy clusters (top-left, right-edge vine,
  bottom-right, bottom trail). Cropped from the source file at high resolution, exported as WebP
  with PNG fallback, and composited with `mix-blend-mode: multiply` over the ivory ground. Because
  the artwork already sits on flat cream, multiply makes it read as cleanly transparent without
  needing a cut-out mask.
- **Authored SVG** — the connecting vine that draws itself on scroll (stroke animation requires
  vector), and the AS monogram (so it can stroke-animate and stay crisp at any size).

**Dependency:** this needs the highest-resolution original the couple has — the designer's PDF or
print-resolution PNG, not a WhatsApp-compressed copy. It goes in `assets/source/`. If only the
compressed version exists, we fall back to fully authored SVG for everything.

### 4.4 Paper texture

Generated in-browser: an inline SVG `feTurbulence` filter rendered once to a tiling background,
fixed-position, very low opacity, `pointer-events: none`. Zero image weight, no tiling seams.

---

## 5. The scroll: one continuous vine

A single olive SVG path runs the full height of the document down the margin. Its
`stroke-dashoffset` is bound to scroll progress, so scrolling *draws* the vine. Leaves and buds
sit at fixed points along it and scale in as the stroke passes them. The vine crosses from the
right margin to the left exactly once — at the Location section — as a deliberate beat.

This is one slow continuous gesture rather than a pile of effects, which is how the "cinematic
scroll" choice and the brief's "minimal animation" instruction reconcile.

**Mobile:** below 600px the margins are too tight for the vine at full amplitude. It narrows to a
fine trace hugging the right edge at reduced opacity — the same side the invitation's own climbing
vine occupies — and the heavy clusters shrink into the corners so they frame rather than crowd.
The margin crossover at Location is dropped at this width; the vine stays right throughout. The
vine never overlaps text at any width.

### 5.1 Section beats

| # | Section | id | The beat |
|---|---|---|---|
| 1 | Names (hero) | `#names` | Opens on the AS monogram drawing itself in rose. Botanical clusters sit folded inward; the first scroll unfolds them outward like a bouquet being unwrapped, revealing the invitation hierarchy beneath. Desktop pins for ~1 viewport; **mobile does not pin** (iOS Safari's collapsing toolbar makes pinned sections jitter) — there the unfold plays on load and short scroll. |
| 2 | Interlude | `#interlude` | Deliberate silence. Amaranthus hangs, the vine grows through open cream, no text. This is the "lots of negative space" instruction spent rather than saved. |
| 3 | Celebration | `#celebration` | The paper lifts: a `--paper-raised` card rises into place with date, time and venue, calla lilies drawing in at its corner. |
| 4 | Location | `#location` | The vine crosses margins. An illustrated map card — sage road lines, rose pin, venue name — rather than a Google iframe, which loads slowly and clashes with the palette. A prominent **Click for Location** button opens the real Maps pin. |
| 5 | RSVP | `#rsvp` | The payoff. The vine terminates in a full pink orchid that blooms on successful submit. |
| 6 | Closing | `#closing` | Countdown in delicate tracked numerals, then: *"Please make sure to arrive on time to avoid any delays! Can't wait to celebrate with you!"* The AS monogram again, small. The vine's last leaves fall away into white. |

### 5.2 Hero content and hierarchy

```
                    [AS monogram]
              ─────────────────────
           TOGETHER WITH OUR FAMILIES
              ─────────────────────

                  Abdelrahman
                     SAMRA
                       &                 ← rose script
                     Sarah
                    HESHAM

              ─────────────────────
      we would love to invite you to celebrate our

                  Engagement             ← rose script
              ─────────────────────

           OCTOBER │ 09 │ AT 3PM         ← "09" in rose
                   FRIDAY
              ─────────────────────
           KING MARIOUT, ALEXANDRIA
```

---

## 6. Architecture

Static site, no build step. Vanilla HTML/CSS/JS.

**Rationale.** This is one page of five sections — a document, not an application. Mobile-first
over Egyptian mobile networks means every kilobyte delays first paint; a React bundle would cost
100KB+ before a petal appears. No build step also means the couple can edit a sentence in
`index.html` and re-upload without npm, a toolchain, or a developer.

```
index.html                      All copy lives here — semantic, instant paint, readable to edit
assets/
  css/style.css
  js/config.js                  Apps Script URL, Maps URL, event datetime. The only settings file.
  js/motion.js                  Vine drawing, section beats, reduced-motion handling
  js/rsvp.js                    Lookup, group RSVP, submit, failure fallback
  svg/                          Vine paths + AS monogram (inlined at build-free runtime)
  img/                          Floral clusters (WebP + PNG fallback)
  source/                       Original invitation artwork, not shipped
google-apps-script/Code.gs      The Sheet endpoint
README.md                       How to edit copy, wire the Sheet, and deploy
```

Copy lives in the HTML rather than a JS content object deliberately: rendering text from JS delays
first paint and breaks the page without JS, for no benefit at this scale.

**Motion library:** GSAP + ScrollTrigger (~35KB gzipped, works back to old iOS). Lenis smooth-scroll
on **desktop only** — momentum-hijacking on touch fights native scrolling and feels broken.

---

## 7. RSVP system

### 7.1 Google Sheet schema

**Tab `Guests`** — Sarah maintains this by hand.

| GroupID | Full Name | Group Label |
|---|---|---|
| `g001` | Ahmed Kamal | The Kamal Family |
| `g001` | Mona Kamal | The Kamal Family |
| `g002` | Youssef Adel | Youssef Adel & Guest |
| `g002` | Guest | Youssef Adel & Guest |

**Tab `RSVPs`** — written by the site, one row per group, **upserted by GroupID** so a group that
changes its mind updates its row instead of appending a duplicate.

| Timestamp | Updated At | GroupID | Group Label | Members | Party Size | Attending | Submitted By |
|---|---|---|---|---|---|---|---|

Party size is derived from the group's member count, giving the caterer a real headcount even
though the guest only answers once for everyone.

### 7.2 Endpoints (Apps Script Web App, deployed "Anyone")

**Lookup** — `GET ?action=lookup&name=<query>`
Returns `{found: true, groupId, label, members: [...]}` or `{found: false}`.

Matching cascade, stopping at the first hit: exact normalised match → all typed tokens present in
one name → Levenshtein distance ≤ 2 on the best candidate. Normalisation lowercases, strips
diacritics, and collapses whitespace, so "sarah hesham", "Sarah  Hesham" and "SARAH HESHAM" all
land.

**Submit** — `POST` with `Content-Type: text/plain;charset=utf-8` carrying a JSON body.
The plain-text content type keeps it a CORS "simple request", avoiding the preflight that Apps
Script cannot answer.

### 7.3 Privacy

The guest list stays in the Sheet and is never shipped to the browser — only the single matched
group is ever returned. To stop the endpoint being walked to enumerate the list, lookup requires
**at least 3 characters** and a confident match; short prefixes return nothing. Exposure is limited
to: someone who already knows a guest's name can learn who that guest is grouped with. That is
acceptable for an engagement invitation, and it is strictly better than shipping the list as a
downloadable file.

### 7.4 Failure modes

| Failure | Behaviour |
|---|---|
| Name not found | "Can't find your name?" path — guest types their name and party size manually and submits anyway. Nobody is ever locked out by a spelling difference. |
| Lookup request fails | Falls through to the same manual path. The form never dead-ends. |
| Submit fails | Retry once, then offer a prefilled WhatsApp message to Sarah so the RSVP is never silently lost. |
| Bot submission | Hidden honeypot field; rows with it filled are dropped server-side. |
| CORS misbehaves in the wild | JSONP fallback for lookup. Verified against the real deployment during build, not assumed. |

### 7.5 Interaction

Guest types their name → their group appears with all its members listed → **one** answer for the
whole group via two large choice cards, *Joyfully accepts* / *Regretfully declines*, rather than
radio buttons. On success the orchid blooms and a handwritten-feeling thank-you replaces the form.

Adding a per-person breakdown later is additive, not a rewrite: the `Members` column already
carries the names.

---

## 8. Performance budget

| Metric | Target |
|---|---|
| Total transfer | < 300KB |
| LCP, mid-tier Android on 4G | < 1.8s |
| Scroll | 60fps; only `transform` and `opacity` are animated |
| Floral clusters | WebP, `loading="lazy"` below the fold, explicit dimensions to prevent shift |

Verified with a throttled Lighthouse run before delivery, not asserted.

## 9. Accessibility

- `prefers-reduced-motion: reduce` → every element renders in its final state; no pinning, no
  vine draw, no parallax. The page must be complete and beautiful with all motion removed.
- Form: real `<label>`s, visible focus rings in `--rose-soft`, errors announced via `aria-live`.
- Choice cards are real radio inputs, keyboard-operable, styled — not divs with click handlers.
- Decorative florals `aria-hidden`. The monogram carries an accessible name.
- Text contrast per the decision in §4.1.

## 10. Deployment

Drag the folder onto Netlify. The Apps Script deployment URL goes into `assets/js/config.js`.
`README.md` documents both, in plain English, for a non-developer.

## 11. Verification

- Real submission lands correctly in the real Sheet, including the upsert-on-resubmit path.
- Lookup tested against exact, misspelled, partial, and absent names.
- Tested at 360px, 390px, 768px and 1440px; iOS Safari and Android Chrome specifically.
- Reduced-motion pass.
- Throttled Lighthouse run.

## 12. Open decisions

1. **Florals: hybrid raster + SVG (§4.3)** — a change from the earlier "authored SVG" answer, made
   after seeing the real invitation. Needs approval.
2. **High-resolution invitation source file** — needed for the above. Designer's PDF or print PNG,
   not a WhatsApp copy.
3. **Real Maps pin** for King Mariout — placeholder until supplied, swappable in one config line.
4. **Full names vs. first names in the hero (§3.1)** — spec follows the brief; the invitation does
   it differently.
