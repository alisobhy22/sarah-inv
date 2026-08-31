# Abdelrahman & Sarah — Engagement Invitation

A single-page invitation website. No build step: edit, save, re-upload.

## Editing the words
All text lives in `index.html`. Open it in any editor, change the words
between the tags, save.

## Settings
`assets/js/config.js` holds the three values that wire the site up:
the RSVP endpoint URL, the Google Maps link, and the event date.
(Setup steps are in later sections.)

## Google Sheet setup
No guest list is needed — guests type their own name and add anyone
they're replying for, so nothing has to be known in advance.

1. Create a blank Google Sheet, named anything (e.g. **Engagement
   RSVPs**). You don't need to add tabs or headers: the script creates
   the `RSVPs` tab and its header row the first time someone replies.
2. From the Sheet's URL, copy the long id between `/d/` and `/edit`:
   `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
3. In the Sheet: **Extensions → Apps Script**. Delete whatever is in
   `Code.gs` and paste in `google-apps-script/Code.gs` from this repo.
   Set `SHEET_ID` at the top to the id from step 2. Save.
4. **Deploy → New deployment → Web app** — Execute as **Me**, access
   **Anyone**. Authorise when prompted (Google will warn about an
   unverified app — it's your own script; Advanced → Go to project).
5. Copy the deployment URL (it ends in `/exec`). Open it in a browser
   first: you should see `{"ok":true,"service":"engagement-rsvp"}`. If
   you see anything else, the deployment settings are wrong.
6. Paste that URL into `appsScriptUrl` in `assets/js/config.js`. Commit
   and push.

**Changing the script later:** editing the code isn't enough — you must
**Deploy → Manage deployments → edit → Version: New version** for the
change to reach the live URL.

Each reply becomes one row: who submitted it, whether anyone is coming,
the headcount, and the names split into *Coming* and *Not coming*. A
guest who replies twice updates their existing row instead of adding a
second one, so the sheet always shows their latest answer.

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
1. Go to https://app.netlify.com/drop and drag this whole folder in.
2. Netlify gives you a URL — that's the invitation. Rename the site in
   Site settings for a nicer address (e.g. abdelrahman-and-sarah).
3. To update: edit files, drag the folder in again.
4. Send the URL by WhatsApp. Done.
