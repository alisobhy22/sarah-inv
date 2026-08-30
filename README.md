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

## Deploying
(Filled in by Task 9.)
