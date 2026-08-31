// ─────────────────────────────────────────────────────────────────
// Engagement RSVP endpoint.
//
// Self-contained on purpose: one file to paste, nothing else to keep in
// sync. (It used to need a second file, Lib.gs, only for the fuzzy name
// matcher behind a guest-list lookup. Guests type their own names now,
// so there is no list to look up and no matcher to share.)
//
// Deploy: Extensions → Apps Script → paste this in → set SHEET_ID below
// → Deploy → New deployment → Web app → Execute as: Me,
// Access: Anyone → copy the /exec URL into assets/js/config.js.
// ─────────────────────────────────────────────────────────────────

var SHEET_ID = '1OiLC1t9tzJVbWCcyruVMvMzcUXWqynW-7fVivLAl0u8';
var TAB = 'RSVPs';

var HEADERS = [
  'First replied', 'Last updated', 'Submitted by', 'Attending',
  'Party size', 'Coming', 'Not coming'
];

// A plain GET is the health check — open the /exec URL in a browser and
// you should see {"ok":true}. Anything else means the deployment is wrong.
function doGet() {
  return json_({ ok: true, service: 'engagement-rsvp' });
}

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'bad json' }); }

  // Honeypot: a bot filled the hidden field. Report success and write
  // nothing, so it has no signal that it was caught.
  if (data.website) return json_({ ok: true });

  var submittedBy = String(data.submittedBy || '').trim();
  if (!submittedBy) return json_({ ok: false, error: 'no name' });

  // One line per person, so "who exactly is coming" survives the trip.
  // Falls back to the flat members list if an older client posts.
  var people = Array.isArray(data.guests) && data.guests.length
    ? data.guests
    : (data.members || []).map(function (n) { return { name: n, attending: true }; });

  var coming = [], notComing = [];
  people.forEach(function (p) {
    var n = String(p && p.name || '').trim();
    if (!n) return;
    (p.attending ? coming : notComing).push(n);
  });

  var sheet = getSheet_();
  var now = new Date();
  var row = [
    now, now, submittedBy,
    coming.length ? 'Yes' : 'No',
    coming.length,
    coming.join(', '),
    notComing.join(', ')
  ];

  // Upsert on the submitter's name, not on a group id. The old key was
  // data.groupId, which this form no longer sends — so every reply took
  // the append path and a guest who changed their mind left two rows with
  // nothing to say which one counted.
  var key = normalizeName_(submittedBy);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (normalizeName_(String(values[i][2])) === key) {
      row[0] = values[i][0];                       // keep the first-replied stamp
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return json_({ ok: true, updated: true });
    }
  }
  sheet.appendRow(row);
  return json_({ ok: true, updated: false });
}

// Creates the tab and its header row on first use, so there is no way to
// get the columns wrong by hand.
function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TAB);
  if (!sheet) sheet = ss.insertSheet(TAB);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Matching "Ali Sobhy", "ali  sobhy" and "Ali Sobhy " as one person.
function normalizeName_(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
