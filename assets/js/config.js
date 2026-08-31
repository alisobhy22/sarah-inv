// ── The only file a non-developer ever needs to edit. ──────────────
window.INVITE_CONFIG = {
  // Paste the Google Apps Script deployment URL here (README step 3).
  appsScriptUrl: 'PASTE_APPS_SCRIPT_URL_HERE',
  // The venue on Google Maps.
  mapsUrl: 'https://maps.app.goo.gl/sibx924cR86Tzzmn9?g_st=iw',
  // Event date/time. Egypt is UTC+3 in early October (summer time).
  eventIso: '2026-10-09T15:00:00+03:00',
  // Sarah's WhatsApp number, digits only with country code, e.g. '2010XXXXXXXX'.
  // Used only as a fallback if an RSVP fails to send.
  whatsappPhone: 'PASTE_WHATSAPP_NUMBER_HERE',

  // ── The guest list ──────────────────────────────────────────────
  // SAMPLE DATA — invented names, here so the RSVP flow can be tried
  // before the Google Sheet exists. Replace every row with the real
  // guests, or delete `guests` entirely once appsScriptUrl is set and
  // the Sheet becomes the source of truth (rsvp.js prefers the Sheet
  // whenever appsScriptUrl is filled in).
  //
  // Everyone sharing a `group` answers together and appears on each
  // other's RSVP, so a family replies once. `label` is what that party
  // is called back to them.
  guests: [
    { group: 'g001', label: 'The Kamal Family',        name: 'Ahmed Kamal' },
    { group: 'g001', label: 'The Kamal Family',        name: 'Mona Kamal' },
    { group: 'g001', label: 'The Kamal Family',        name: 'Laila Kamal' },
    { group: 'g002', label: 'The Sherif Family',       name: 'Omar Sherif' },
    { group: 'g002', label: 'The Sherif Family',       name: 'Dina Sherif' },
    { group: 'g003', label: 'The Fahmy Family',        name: 'Karim Fahmy' },
    { group: 'g003', label: 'The Fahmy Family',        name: 'Nour Fahmy' },
    { group: 'g003', label: 'The Fahmy Family',        name: 'Yassin Fahmy' },
    { group: 'g003', label: 'The Fahmy Family',        name: 'Salma Fahmy' },
    { group: 'g004', label: 'Youssef Adel & Guest',    name: 'Youssef Adel' },
    { group: 'g005', label: 'The Ibrahim Family',      name: 'Hany Ibrahim' },
    { group: 'g005', label: 'The Ibrahim Family',      name: 'Rania Ibrahim' },
    { group: 'g006', label: 'Farida Mostafa & Guest',  name: 'Farida Mostafa' },
    { group: 'g007', label: 'The Zaki Family',         name: 'Tarek Zaki' },
    { group: 'g007', label: 'The Zaki Family',         name: 'Heba Zaki' },
    { group: 'g007', label: 'The Zaki Family',         name: 'Malak Zaki' },
    { group: 'g008', label: 'The Sobhy Family',        name: 'Ali Sobhy' },
    { group: 'g008', label: 'The Sobhy Family',        name: 'Amira Sobhy' },
    { group: 'g009', label: 'Mahmoud Nabil & Guest',   name: 'Mahmoud Nabil' },
    { group: 'g010', label: 'The Halim Family',        name: 'Sherif Halim' },
    { group: 'g010', label: 'The Halim Family',        name: 'Yara Halim' },
    { group: 'g010', label: 'The Halim Family',        name: 'Adam Halim' }
  ]
};
