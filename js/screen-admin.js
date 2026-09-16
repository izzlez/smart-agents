/* ============================================================
   Rent Manager — Administration

   1:1 with the canonical RMX Pages "Administration Menu" frame
   (5XEzI94nmZsWE7rQQ7OIHP, node 4620:157756): a white title bar
   (real admin-menu logo + "Administration" + a "Find an item" search
   field), a Mega Menu rail down the left (the same component as the
   header's Main Menu overlay — solid selected pill + ribbon), and
   every category's real content in ONE continuous scroll on the
   right. The rail is a jump-nav into that scroll, not a filter — the
   real page shows every category at once; picking a rail item just
   scrolls to it and marks it current.
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, adminIcon = SA.adminIcon, orion = SA.orion;

  function slug(s) { return 'admin-sec-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  function adminItem(it) {
    var clickable = !!it.action;
    return '<div class="' + cls('adminitem', { 'adminitem--click': clickable }) + '"' +
        (clickable ? act(it.action) : '') + '>' +
      '<span class="adminitem__icon">' +
        (it.orion ? orion(32) :
          it.eicon ? adminIcon(it.eicon, 50) :
          icon(it.icon || 'description', 28, 'color:var(--rmx-brand)')) +
      '</span>' +
      '<span class="adminitem__text">' +
        '<span class="adminitem__title">' + esc(it.title) + '</span>' +
        '<span class="adminitem__desc">' + esc(it.desc) + '</span>' +
      '</span>' +
    '</div>';
  }

  SA.viewAdmin = function () {
    var s = SA.state;
    var current = s.adminCat || 'Preferences';

    var rail = each(SA.adminNav, function (c) {
      var on = c === current;
      /* One continuous shape (rect + ribbon tail) -- see SA.railRibbon().
         This rail's items are already the component's full 232px width,
         flush with the real divider, so no extra reach is needed. */
      return '<button class="' + cls('menumod', { 'menumod--on': on }) + '"' +
        act('setAdminCat', c) + '>' +
        when(on, SA.railRibbon(232, 0)) +
        '<span class="menumod__label">' + esc(c) + '</span>' +
      '</button>';
    });

    var content = each(SA.adminNav, function (cat) {
      var groups = SA.adminSections[cat];
      return '<div class="adminsection" id="' + slug(cat) + '">' +
        '<div class="adminsection__head">' + esc(cat) + '</div>' +
        (groups ? each(groups, function (g) {
          return '<div class="admingroup">' +
            when(g.sub, '<div class="admingroup__sub">' + esc(g.sub || '') + '</div>') +
            when(g.items, function () {
              return '<div class="admingrid">' + each(g.items, adminItem) + '</div>';
            }) +
            when(g.links, function () {
              return '<div class="admingrid admingrid--links">' + each(g.links, function (l) {
                return '<a href="#" class="adminlink"' + act('noop') + '>' + esc(l) + '</a>';
              }) + '</div>';
            }) +
          '</div>';
        }) : '<div class="adminempty">' +
          icon('build', 30, 'color:var(--rmx-text-muted)') +
          '<div class="empty__title">' + esc(cat) + '</div>' +
          '<div class="empty__text">This category is not built out in the prototype.</div>' +
        '</div>') +
      '</div>';
    });

    return '<div class="main" data-screen-label="Administration">' +
      '<div class="admintitle">' +
        adminIcon('system-preferences', 40) +
        '<h1 class="admintitle__h">Administration</h1>' +
        '<div class="admintitle__find">' + icon('search', 20, 'color:var(--rmx-text-muted)') +
          '<span class="admintitle__findtext">Find an item</span></div>' +
      '</div>' +
      '<div class="adminbody">' +
        '<div class="menurail adminrail">' + rail + '</div>' +
        '<div class="admincontent" data-fk="admincontent">' + content + '</div>' +
      '</div>' +
    '</div>';
  };
})(window.SA = window.SA || {});
