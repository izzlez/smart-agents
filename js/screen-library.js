/* ============================================================
   Smart Agents — Agent Library + Agent Templates screens
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, chg = SA.chg,
      when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, orion = SA.orion, toggle = SA.toggle,
      typeBadge = SA.typeBadge, options = SA.options;

  var ROW_ICON = {
    'Data health': { icon: 'fact_check', color: 'var(--rmx-brand-pressed)' },
    'Workflow': { icon: 'account_tree', color: '#6b28cc' },
    'Notification': { icon: 'campaign', color: 'var(--rmx-warning)' },
    'Schedule': { icon: 'calendar_today', color: '#3f7e1f' }
  };
  var MODE_LABEL = { builder: 'Agent workflow', quick: 'Quick agent', rule: 'Automation rule' };

  var NAV_COPY = {
    Agents: { title: 'Agents', sub: 'Orion detects, decides, and acts — every run leaves its reasoning behind.', newLabel: 'New Agent' },
    Notifications: { title: 'Notifications', sub: 'Fixed rules that send when something happens or a date arrives.', newLabel: 'New Notification' },
    Schedules: { title: 'Schedules', sub: 'Recurring runs that post, bill, draft, or send on the calendar.', newLabel: 'New Schedule' }
  };

  function stateColor(a) {
    if (a.state === 'Not configured') return 'var(--rmx-text-muted)';
    if (/open findings/.test(a.state)) return 'var(--rmx-brand)';
    return 'var(--rmx-text)';
  }

  SA.viewLibrary = function () {
    var s = SA.state;
    var copy = NAV_COPY[s.kindFilter] || NAV_COPY.Agents;
    var rows = SA.visibleRows();
    var title = s.navGroup || copy.title;

    var head =
      '<div class="pagehead">' +
        '<div class="row" style="align-items:flex-end;gap:16px">' +
          '<div class="grow">' +
            '<h1 class="pagehead__title">Smart Agents</h1>' +
            '<div class="f13" style="margin-top:4px;display:flex;align-items:baseline;gap:6px">' +
              '<span class="navy w500">' + esc(title) + '</span><span>&mdash;</span><span>' + esc(copy.sub) + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn--primary"' + act('newAgent') + '>' + icon('add', 20) + esc(copy.newLabel) + '</button>' +
        '</div>' +
        /* No type filter chips — the list is short enough not to need them. */
        '<div class="filterbar">' +
          '<div class="spacer"></div>' +
          '<div class="f12 muted">' + SA.plural(rows.length, 'item') + '</div>' +
        '</div>' +
      '</div>';

    var banner = when(!s.enabled, function () {
      return '<div class="libbanner"><div class="banner banner--warn">' +
        icon('pause_circle') +
        '<div class="grow" style="color:#a85e0e">' +
          '<div class="w500">Agents are disabled company-wide.</div>' +
          '<div class="f13">No agent is evaluating records, sending, or writing findings. Existing findings are preserved.</div>' +
        '</div>' +
        '<button class="btn btn--secondary btn--sm"' + act('toggleKill') + '>Enable Agents</button>' +
      '</div></div>';
    });

    var table =
      '<div class="libtable tbl">' +
        '<div class="tbl__head g-agents">' +
          '<div>Agent</div><div>Type</div><div>Trigger / Schedule</div><div>Last Run</div><div>Current State</div>' +
          '<div class="right">Enabled</div>' +
        '</div>' +
        (rows.length ? each(rows, function (a) {
          var ri = ROW_ICON[a.type] || ROW_ICON['Data health'];
          return '<div class="tbl__row tbl__row--click g-agents"' + act('openAgent', a.key) + '>' +
            '<div class="agentcell">' +
              icon(ri.icon, 20, 'color:' + ri.color) +
              '<div class="min0">' +
                '<div class="agentcell__name">' + esc(a.name) + '</div>' +
                '<div class="agentcell__mode">' + esc(MODE_LABEL[a.mode] || a.mode) +
                  when(a.orion, function () {
                    return '<span class="orionmark">' + orion(20) + 'Orion</span>';
                  }) +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div>' + typeBadge(a.type) + '</div>' +
            '<div class="f13 ink2">' + esc(a.trigger) + '</div>' +
            '<div class="f13" style="color:' + (a.last === '—' ? 'var(--rmx-text-muted)' : 'var(--rmx-ink-2)') + '">' +
              esc(a.last) + '</div>' +
            '<div class="f13" style="color:' + stateColor(a) + '">' + esc(a.state) + '</div>' +
            '<div style="display:flex;justify-content:flex-end">' +
              toggle(a.enabled, 'toggleAgent', a.key, { title: a.enabled ? 'Disable' : 'Enable' }) +
            '</div>' +
          '</div>';
        }) : '<div style="padding:40px;text-align:center" class="dim">Nothing matches this filter.</div>') +
      '</div>';

    return '<div class="screen" data-screen-label="Agent Library">' + head + banner + table + '</div>';
  };

  /* ---------------- Agent Templates ---------------- */
  SA.viewTemplates = function () {
    var head =
      '<div class="pagehead pagehead--pad">' +
        '<div class="row" style="align-items:flex-end;gap:16px">' +
          '<div class="grow">' +
            '<h1 class="pagehead__title">New Agent</h1>' +
            '<div class="f13" style="margin-top:4px">Start from a standard template. Every part of it &mdash; the detection, its values, the conditions, the actions &mdash; is editable once you pick one.</div>' +
          '</div>' +
          '<button class="btn btn--secondary"' + act('blankAgent') + '>Start From Scratch</button>' +
        '</div>' +
      '</div>';

    var grid = '<div class="tplgrid">' + each(SA.templates, function (t) {
      var det = SA.detById(t.det);
      return '<div class="tplcard"' + act('useTemplate', t.id) + '>' +
        '<div class="row" style="gap:8px">' + orion(22) + typeBadge(t.type) +
          '<span class="spacer"></span>' +
          '<span class="f12 muted">' + esc(t.mode === 'builder' ? 'Agent workflow' : 'Quick agent') + '</span>' +
        '</div>' +
        '<div><div class="tplcard__name">' + esc(t.name) + '</div>' +
          '<div class="tplcard__desc">' + esc(t.desc) + '</div></div>' +
        '<div class="tplcard__specs">' +
          '<div class="tplspec"><span class="tplspec__k">Detects</span>' +
            '<span class="tplspec__v">' + esc(det ? det.name : t.det) + '</span></div>' +
          '<div class="tplspec"><span class="tplspec__k">Then</span>' +
            '<span class="tplspec__v">' + esc(t.then) + '</span></div>' +
          '<div class="tplspec"><span class="tplspec__k">Shape</span>' +
            '<span class="tplspec__v">' + esc(t.shape) + '</span></div>' +
        '</div>' +
        '<button class="btn btn--secondary btn--sm"' + act('useTemplate', t.id) + '>Use Template</button>' +
      '</div>';
    }) + '</div>';

    return '<div class="screen screen--tint" data-screen-label="Agent Templates">' + head + grid + '</div>';
  };

  /* select handler name used above */
  SA.actions.setSchedTypeSelect = function (_a, _b, ev) { SA.state.schedTypeFilter = ev.target.value; };
})(window.SA = window.SA || {});
