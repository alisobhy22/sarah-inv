(function () {
  'use strict';
  var cfg = window.INVITE_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('rsvp-form'), nameInput = $('guest-name'), status = $('lookup-status');
  var groupCard = $('group-card'), groupLabel = $('group-label'), groupMembers = $('group-members');
  var choice = $('choice'), manual = $('manual'), manualToggle = $('manual-toggle');
  var submitBtn = $('rsvp-submit'), errorEl = $('rsvp-error'), doneEl = $('rsvp-done');

  var state = { group: null, manualMode: false, retried: false };

  // Also open the Maps link from config.
  $('maps-link').href = cfg.mapsUrl;

  // ── Lookup: debounced as the guest types ──────────────────────
  var debounceTimer, lastQuery = '';
  nameInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var q = nameInput.value.trim();
    if (state.manualMode) return;
    if (q.length < 3) { setGroup(null); status.textContent = ''; return; }
    status.textContent = 'Looking for your invitation…';
    debounceTimer = setTimeout(function () { doLookup(q); }, 500);
  });

  function doLookup(q) {
    lastQuery = q;
    var url = cfg.appsScriptUrl + '?action=lookup&name=' + encodeURIComponent(q);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (q !== lastQuery) return; // stale response
        if (res.found) {
          setGroup(res);
          status.textContent = '';
        } else {
          setGroup(null);
          status.textContent = "We couldn't find that name — try your full name as written on your invitation.";
          manualToggle.hidden = false;
        }
      })
      .catch(function () { jsonpLookup(q); });
  }

  // JSONP fallback if CORS misbehaves on some in-app browser.
  function jsonpLookup(q) {
    var cbName = 'inviteCb' + Date.now();
    window[cbName] = function (res) {
      delete window[cbName];
      if (res && res.found) { setGroup(res); status.textContent = ''; }
      else { setGroup(null); manualToggle.hidden = false; status.textContent = "We couldn't reach the guest list — you can still RSVP below."; }
    };
    var s = document.createElement('script');
    s.src = cfg.appsScriptUrl + '?action=lookup&name=' + encodeURIComponent(q) + '&callback=' + cbName;
    s.onerror = function () { setGroup(null); manualToggle.hidden = false; status.textContent = 'You can still RSVP — just tell us how many below.'; };
    document.body.appendChild(s);
  }

  function setGroup(res) {
    state.group = res;
    if (res) {
      groupLabel.textContent = res.label;
      groupMembers.innerHTML = '';
      res.members.forEach(function (m) {
        var li = document.createElement('li');
        li.textContent = m;
        groupMembers.appendChild(li);
      });
      groupCard.hidden = false;
      choice.hidden = false;
      submitBtn.hidden = false;
      manual.hidden = true;
      manualToggle.hidden = true;
    } else {
      groupCard.hidden = true;
      if (!state.manualMode) { choice.hidden = true; submitBtn.hidden = true; }
    }
  }

  manualToggle.addEventListener('click', function () {
    state.manualMode = true;
    state.group = null;
    groupCard.hidden = true;
    manual.hidden = false;
    choice.hidden = false;
    submitBtn.hidden = false;
    manualToggle.hidden = true;
    status.textContent = '';
  });

  // ── Submit ────────────────────────────────────────────────────
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errorEl.hidden = true;
    var attending = form.querySelector('input[name="attending"]:checked');
    var name = nameInput.value.trim();
    if (!name) { showError('Please tell us your name.'); return; }
    if (!attending) { showError('Please choose one of the two options.'); return; }

    var payload = state.group ? {
      groupId: state.group.groupId,
      label: state.group.label,
      members: state.group.members,
      partySize: state.group.members.length,
      attending: attending.value === 'yes',
      submittedBy: name,
      website: $('website').value
    } : {
      groupId: '',
      label: name,
      members: [name],
      partySize: Math.max(1, parseInt($('party-size').value, 10) || 1),
      attending: attending.value === 'yes',
      submittedBy: name,
      website: $('website').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    send(payload, attending.value === 'yes');
  });

  function send(payload, isYes) {
    fetch(cfg.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // CORS "simple request"
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error('server said no');
        showDone(payload, isYes);
      })
      .catch(function () {
        if (!state.retried) { state.retried = true; send(payload, isYes); return; }
        // Never lose an RSVP: hand it to WhatsApp.
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send our reply';
        errorEl.innerHTML = '';
        errorEl.appendChild(document.createTextNode('We couldn’t reach the guest book. '));
        var a = document.createElement('a');
        a.href = InviteLib.buildWhatsAppUrl(cfg.whatsappPhone, payload.label, payload.attending);
        a.textContent = 'Send your reply on WhatsApp instead';
        a.target = '_blank';
        a.rel = 'noopener';
        errorEl.appendChild(a);
        errorEl.hidden = false;
      });
  }

  function showDone(payload, isYes) {
    form.hidden = true;
    doneEl.hidden = false;
    $('done-message').textContent = isYes
      ? 'We can’t wait to celebrate with you on October 9th.'
      : 'We’ll miss you — thank you for letting us know.';
    if (window.bloomOrchid) window.bloomOrchid();
    doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
})();
