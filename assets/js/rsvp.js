(function () {
  'use strict';
  var cfg = window.INVITE_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('rsvp-form'), select = $('guest-select'), status = $('lookup-status');
  var groupCard = $('group-card'), groupLabel = $('group-label'), groupMembers = $('group-members');
  var plusOne = $('plus-one');
  var choice = $('choice'), submitBtn = $('rsvp-submit'), errorEl = $('rsvp-error'), doneEl = $('rsvp-done');

  var state = { group: null, retried: false };

  $('maps-link').href = cfg.mapsUrl;

  // ── The guest list ────────────────────────────────────────────
  // Choosing from a list rather than typing removes the entire class of
  // problem the old fuzzy matcher existed to paper over: spelling, Arabic
  // transliteration, "which name is on my invitation". You cannot mistype
  // a name you tapped.
  var groups = {};       // group id -> { label, members: [name] }
  (cfg.guests || []).forEach(function (g) {
    if (!groups[g.group]) groups[g.group] = { id: g.group, label: g.label, members: [] };
    groups[g.group].members.push(g.name);
  });

  function buildList() {
    var ids = Object.keys(groups);
    if (!ids.length) {
      status.textContent = 'The guest list is still being prepared — please check back shortly.';
      select.disabled = true;
      return;
    }
    // Grouped by party, so a guest sees their own family as a heading and
    // finds themselves by household rather than scanning one long list.
    ids.sort(function (a, b) { return groups[a].label.localeCompare(groups[b].label); })
      .forEach(function (id) {
        var og = document.createElement('optgroup');
        og.label = groups[id].label;
        groups[id].members.slice().sort().forEach(function (name) {
          var o = document.createElement('option');
          o.value = id + '|' + name;
          o.textContent = name;
          og.appendChild(o);
        });
        select.appendChild(og);
      });
  }
  buildList();

  // ── Choosing a name ───────────────────────────────────────────
  select.addEventListener('change', function () {
    var v = select.value;
    if (!v) { setGroup(null); return; }
    var parts = v.split('|');
    var g = groups[parts[0]];
    setGroup({ groupId: g.id, label: g.label, members: g.members, chosen: parts[1] });
  });

  function setGroup(g) {
    state.group = g;
    if (!g) {
      groupCard.hidden = true;
      choice.hidden = true;
      submitBtn.hidden = true;
      status.textContent = '';
      return;
    }
    groupLabel.textContent = g.label;
    groupMembers.innerHTML = '';

    // One row per person on the invitation, each with their own answer, so
    // a family replies once and nobody is assumed in or out. The person who
    // picked their own name starts ticked; everyone else starts ticked too,
    // since the common case is the whole party coming — unticking is the
    // rarer, deliberate act.
    g.members.forEach(function (name, i) {
      var li = document.createElement('li');
      var id = 'member-' + i;
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.className = 'member-check';
      cb.checked = true;
      cb.value = name;
      var label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = name;
      li.appendChild(cb);
      li.appendChild(label);
      groupMembers.appendChild(li);
    });

    plusOne.checked = false;
    choice.hidden = false;
    submitBtn.hidden = false;
    status.textContent = '';
    syncMemberState();
  }

  // Declining hides the who's-coming detail — there is nobody to list.
  function syncMemberState() {
    var picked = form.querySelector('input[name="attending"]:checked');
    var yes = picked && picked.value === 'yes';
    groupCard.hidden = !(state.group && yes);
  }
  form.addEventListener('change', function (ev) {
    if (ev.target.name === 'attending') syncMemberState();
  });

  // ── Submit ────────────────────────────────────────────────────
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errorEl.hidden = true;

    if (!state.group) { showError('Please find your name in the list.'); return; }
    var attending = form.querySelector('input[name="attending"]:checked');
    if (!attending) { showError('Please choose one of the two options.'); return; }
    var isYes = attending.value === 'yes';

    var coming = [].slice.call(groupMembers.querySelectorAll('.member-check'))
      .filter(function (c) { return c.checked; })
      .map(function (c) { return c.value; });

    if (isYes && !coming.length) {
      showError('Please tick at least one person who is coming, or choose “Regretfully declines”.');
      return;
    }

    var partySize = isYes ? coming.length + (plusOne.checked ? 1 : 0) : 0;
    var payload = {
      groupId: state.group.groupId,
      label: state.group.label,
      members: isYes ? coming : [],
      partySize: partySize,
      plusOne: isYes && plusOne.checked,
      attending: isYes,
      submittedBy: state.group.chosen,
      website: $('website').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    send(payload, isYes);
  });

  function send(payload, isYes) {
    // No endpoint configured yet: the flow still has to complete rather than
    // fail silently, so the reply is handed to WhatsApp instead.
    if (!cfg.appsScriptUrl || cfg.appsScriptUrl.indexOf('PASTE_') === 0) {
      offerWhatsApp(payload, 'The guest book is not connected yet. ');
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
        showDone(payload, isYes);
      })
      .catch(function () {
        if (!state.retried) { state.retried = true; send(payload, isYes); return; }
        offerWhatsApp(payload, 'We couldn’t reach the guest book. ');
      });
  }

  // Never lose an RSVP.
  function offerWhatsApp(payload, lead) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send our reply';
    errorEl.innerHTML = '';
    errorEl.appendChild(document.createTextNode(lead));
    var a = document.createElement('a');
    a.href = InviteLib.buildWhatsAppUrl(cfg.whatsappPhone, payload.label, payload.attending);
    a.textContent = 'Send your reply on WhatsApp instead';
    a.target = '_blank';
    a.rel = 'noopener';
    errorEl.appendChild(a);
    errorEl.hidden = false;
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
