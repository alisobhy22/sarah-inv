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
