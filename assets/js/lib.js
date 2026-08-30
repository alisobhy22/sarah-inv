// Shared pure helpers — used by the browser, Node tests, and (copied
// verbatim to Lib.gs) Google Apps Script. No DOM, no I/O.
var InviteLib = (function () {
  'use strict';

  function normalizeName(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, '')
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
