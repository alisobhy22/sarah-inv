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
  assert.equal(L.levenshtein('mona', 'youssef'), 6);
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

// ── shouldSnap ────────────────────────────────────────────────────
// A section taller than the window must not carry a snap point: its
// start-aligned point would pull a guest reading its lower half back
// to the top, which reads as the page being stuck.
test('shouldSnap: a section shorter than the window snaps', () => {
  assert.equal(L.shouldSnap(600, 900), true);
});

test('shouldSnap: a section exactly the window height snaps', () => {
  assert.equal(L.shouldSnap(900, 900), true);
});

test('shouldSnap: a section taller than the window does not snap', () => {
  assert.equal(L.shouldSnap(1400, 900), false);
});

test('shouldSnap: overhang within the slack still snaps', () => {
  assert.equal(L.shouldSnap(906, 900), true);
  assert.equal(L.shouldSnap(909, 900), false);
});

test('shouldSnap: slack is configurable', () => {
  assert.equal(L.shouldSnap(940, 900, 40), true);
  assert.equal(L.shouldSnap(941, 900, 40), false);
});

test('shouldSnap: a zero-height or unmeasured section does not snap', () => {
  assert.equal(L.shouldSnap(0, 900), false);
});
