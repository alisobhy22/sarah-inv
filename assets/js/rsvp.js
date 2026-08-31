(function () {
  'use strict';
  var cfg = window.INVITE_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('rsvp-form'), nameInput = $('guest-name');
  var partyList = $('party-list'), addBtn = $('add-person');
  var submitBtn = $('rsvp-submit'), errorEl = $('rsvp-error'), doneEl = $('rsvp-done');

  var state = { retried: false, rows: 0 };

  $('maps-link').href = cfg.mapsUrl;

  // ── Replying for other people ─────────────────────────────────
  // A row per extra person, each carrying its OWN answer rather than
  // inheriting the main guest's. One half of a couple coming while the
  // other can't is an ordinary thing, and a single party-wide yes/no
  // cannot express it.
  function addRow(name, coming) {
    var i = state.rows++;
    var li = document.createElement('li');
    li.className = 'party-row';

    var field = document.createElement('input');
    field.type = 'text';
    field.className = 'party-name';
    field.placeholder = 'Their name';
    field.autocapitalize = 'words';
    field.setAttribute('aria-label', 'Name of guest ' + (i + 1));
    if (name) field.value = name;

    var toggle = document.createElement('label');
    toggle.className = 'party-coming';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'party-check';
    cb.checked = coming !== false;
    cb.id = 'party-check-' + i;
    var cbText = document.createElement('span');
    cbText.textContent = 'Coming';
    toggle.appendChild(cb);
    toggle.appendChild(cbText);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'party-remove';
    remove.setAttribute('aria-label', 'Remove this person');
    remove.textContent = '×';
    remove.addEventListener('click', function () { li.remove(); });

    li.appendChild(field);
    li.appendChild(toggle);
    li.appendChild(remove);
    partyList.appendChild(li);
    field.focus();
  }

  addBtn.addEventListener('click', function () { addRow('', true); });

  function readParty() {
    return [].slice.call(partyList.querySelectorAll('.party-row'))
      .map(function (row) {
        return {
          name: row.querySelector('.party-name').value.trim(),
          attending: row.querySelector('.party-check').checked
        };
      })
      // A row left blank is someone the guest started adding and thought
      // better of — drop it rather than submitting an empty name.
      .filter(function (p) { return p.name; });
  }

  // ── Submit ────────────────────────────────────────────────────
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errorEl.hidden = true;

    var name = nameInput.value.trim();
    if (!name) { showError('Please tell us your name.'); nameInput.focus(); return; }

    var picked = form.querySelector('input[name="attending"]:checked');
    if (!picked) { showError('Please let us know whether you can make it.'); return; }
    var isYes = picked.value === 'yes';

    var party = readParty();
    var everyone = [{ name: name, attending: isYes }].concat(party);
    var coming = everyone.filter(function (p) { return p.attending; }).map(function (p) { return p.name; });

    var payload = {
      groupId: '',
      label: name,
      members: coming,                 // who is actually coming
      partySize: coming.length,
      attending: coming.length > 0,    // the reply counts if ANYONE is coming
      guests: everyone,                // full detail, one line per person
      submittedBy: name,
      website: $('website').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    send(payload, coming.length > 0);
  });

  function send(payload, anyoneComing) {
    // Not configured yet: say so plainly rather than spinning forever or
    // reporting a success that never happened.
    if (!cfg.appsScriptUrl || cfg.appsScriptUrl.indexOf('PASTE_') === 0) {
      failed('The guest book isn’t connected yet — please try again a little later.');
      return;
    }
    fetch(cfg.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // CORS "simple request"
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error('server said no');
        showDone(payload, anyoneComing);
      })
      .catch(function () {
        // One silent retry first — a single dropped request on a phone
        // network is common and not worth troubling the guest about.
        if (!state.retried) { state.retried = true; send(payload, anyoneComing); return; }
        failed('We couldn’t save your reply just now. Please check your connection and tap Send again.');
      });
  }

  // Hand the form back so the guest can simply try again. Their answers are
  // all still on screen — nothing is cleared — so retrying costs one tap.
  function failed(msg) {
    state.retried = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send your reply';   // must match the markup
    showError(msg);
  }

  function showDone(payload, anyoneComing) {
    form.hidden = true;
    doneEl.hidden = false;
    var n = payload.partySize;
    $('done-message').textContent = anyoneComing
      ? (n > 1
        ? 'All ' + n + ' of you — we can’t wait to celebrate on October 9th.'
        : 'We can’t wait to celebrate with you on October 9th.')
      : 'We’ll miss you — thank you for letting us know.';
    if (window.bloomOrchid) window.bloomOrchid();
    doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
})();
