(function () {
  'use strict';
  var target = new Date(window.INVITE_CONFIG.eventIso).getTime();
  var nums = {};
  ['days', 'hours', 'minutes', 'seconds'].forEach(function (u) {
    nums[u] = document.querySelector('#countdown [data-unit="' + u + '"]');
  });
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Only touch the DOM when a unit actually changes, so the roll fires once per
  // real tick — days/hours/minutes stay still while seconds count.
  function set(el, val) {
    if (el.textContent === val) return;
    el.textContent = val;
    if (reduced) return;
    el.classList.remove('roll');
    void el.offsetWidth; // reflow, so re-adding the class restarts the animation
    el.classList.add('roll');
  }

  function tick() {
    var p = InviteLib.countdownParts(target, Date.now());
    set(nums.days, String(p.days));
    set(nums.hours, pad(p.hours));
    set(nums.minutes, pad(p.minutes));
    set(nums.seconds, pad(p.seconds));
    if (p.done) {
      clearInterval(timer);
      document.getElementById('countdown').innerHTML =
        '<p class="thanks-line">Today’s the day</p>';
    }
  }
  var timer = setInterval(tick, 1000);
  tick();
})();
