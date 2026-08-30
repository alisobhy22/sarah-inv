(function () {
  'use strict';
  var target = new Date(window.INVITE_CONFIG.eventIso).getTime();
  var nums = {};
  ['days', 'hours', 'minutes', 'seconds'].forEach(function (u) {
    nums[u] = document.querySelector('#countdown [data-unit="' + u + '"]');
  });
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function tick() {
    var p = InviteLib.countdownParts(target, Date.now());
    nums.days.textContent = String(p.days);
    nums.hours.textContent = pad(p.hours);
    nums.minutes.textContent = pad(p.minutes);
    nums.seconds.textContent = pad(p.seconds);
    if (p.done) {
      clearInterval(timer);
      document.getElementById('countdown').innerHTML =
        '<p class="thanks-line">Today’s the day</p>';
    }
  }
  var timer = setInterval(tick, 1000);
  tick();
})();
