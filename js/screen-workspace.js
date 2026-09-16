/* ============================================================
   Rent Manager — My Workspace

   1:1 with the canonical RMX Pages "My Workspace" frame
   (5XEzI94nmZsWE7rQQ7OIHP, node 4969:70308): a decorated pale-blue
   canvas, a centred greeting, then four tiles — My Favorites and My
   Reports (558px, two columns of grouped links each), Announcements
   and My Training (314px). Announcements and My Training can be
   hidden via the eye-slash in their header; a hidden tile becomes a
   restore chip in the row along the bottom of the tile area.
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, when = SA.when, each = SA.each, icon = SA.icon;

  function group(g) {
    var st = SA.wsGroupStyle[g.name] || { icon: 'description', color: 'var(--rmx-brand)' };
    return '<div class="wsgroup">' +
      '<span class="wsgroup__icon" style="background:' + st.color + '">' +
        icon(st.icon, 20, 'color:#fff') + '</span>' +
      '<div class="wsgroup__col">' +
        '<span class="wsgroup__name">' + esc(g.name) + '</span>' +
        each(g.links, function (l) {
          return '<a href="#" class="wslink"' + act('noop') + '>' + esc(l) + '</a>';
        }) +
      '</div>' +
    '</div>';
  }

  function columns(cols) {
    return '<div class="wscols">' + each(cols, function (c) {
      return '<div class="wscol">' + each(c, group) + '</div>';
    }) + '</div>';
  }

  /* mod: layout modifier class. hideKey: present -> the head icon hides the
     tile instead of just decorating it. */
  function tile(mod, title, accent, headIcon, hideKey, body) {
    return '<div class="wstile wstile--' + mod + '" style="border-top-color:' + accent + '">' +
      '<div class="wstile__head">' +
        '<span class="wstile__title">' + esc(title) + '</span>' +
        '<span class="spacer"></span>' +
        '<span class="wstile__headicon"' +
          (hideKey ? act('hideWsTile', hideKey) + ' title="Hide"' : ' title="More"') + '>' +
          icon(headIcon, 20, 'color:var(--rmx-text)') +
        '</span>' +
      '</div>' +
      '<div class="wstile__body">' + body + '</div>' +
    '</div>';
  }

  function trainingCard() {
    return '<div class="wstrain">' +
      '<img class="wstrain__logo" src="assets/rmu-logo.png" alt="Rent Manager University">' +
      '<div class="wstrain__copy">Connect your account to access your assigned trainings.</div>' +
      '<div class="wstrain__field">' + icon('person', 20, 'color:var(--rmx-text-muted)') +
        '<span class="wstrain__placeholder">Email</span></div>' +
      '<button class="wstrain__signin"' + act('noop') + '>Sign In</button>' +
    '</div>';
  }

  var HIDDEN_TILES = [
    { key: 'ann', label: 'Announcements', icon: 'campaign' },
    { key: 'training', label: 'My Training', icon: 'school' }
  ];

  SA.viewWorkspace = function () {
    var hidden = SA.state.wsHidden;

    var annBody =
      '<div class="wsann__bar">' +
        '<a href="#"' + act('noop') + '>View Changelog</a>' +
        '<span class="spacer"></span>' +
        '<a href="#"' + act('noop') + '>View All Announcements</a>' +
      '</div>' +
      each(SA.wsAnnouncements, function (a) {
        return '<div class="wsann">' +
          '<div class="wsann__top">' +
            '<div>' +
              '<div class="wsann__title">' + esc(a.title) + '</div>' +
              '<div class="wsann__date">' + esc(a.date) + '</div>' +
            '</div>' +
            '<span class="spacer"></span>' +
            when(a.badge, function () {
              return '<span class="wsann__badge wsann__badge--' +
                a.badge.toLowerCase() + '">' + esc(a.badge) + '</span>';
            }) +
          '</div>' +
          when(a.thumb, '<div class="wsann__thumb"><img src="assets/ws-announcement-art.png" alt=""></div>') +
          '<div class="wsann__text">' + esc(a.text) + '</div>' +
          '<div class="wsann__links">' +
            each(a.links, function (l) {
              return '<a href="#" class="wsann__link"' + act('noop') + '>' + esc(l) + '</a>';
            }) +
          '</div>' +
        '</div>';
      });

    var restoreRow = each(HIDDEN_TILES.filter(function (t) { return hidden[t.key]; }), function (t) {
      return '<button class="wschip"' + act('restoreWsTile', t.key) + '>' +
        icon(t.icon, 20, 'color:var(--rmx-brand-dark)') + esc(t.label) + '</button>';
    });

    return '<div class="screen wsscreen" data-screen-label="My Workspace">' +
      '<div class="wsgreet">' +
        '<div class="wsgreet__hi">Welcome, Charlie</div>' +
        '<div class="wsgreet__sub">Let’s get to work.</div>' +
      '</div>' +
      '<div class="wstiles">' +
        tile('fav', 'My Favorites', 'var(--rmx-brand)', 'more_vert', null, columns(SA.wsFavorites)) +
        tile('rep', 'My Reports', 'var(--rmx-border-success)', 'more_vert', null, columns(SA.wsReports)) +
        when(!hidden.ann, function () {
          return tile('ann', 'Announcements', 'var(--rmx-warning-soft)', 'visibility_off', 'ann', annBody);
        }) +
        when(!hidden.training, function () {
          return tile('training', 'My Training', 'var(--rmx-warning)', 'visibility_off', 'training', trainingCard());
        }) +
      '</div>' +
      when(restoreRow, function () {
        return '<div class="wshidden">' + restoreRow + '</div>';
      }) +
    '</div>';
  };
})(window.SA = window.SA || {});
