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
  whatsappPhone: 'PASTE_WHATSAPP_NUMBER_HERE'

  // No guest list here any more: guests type their own name and add
  // anyone they're replying for, so nothing has to be known in advance.
};
