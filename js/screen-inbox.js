/* ============================================================
   Smart Agents — Agent Findings Inbox
   Two views over the same rows: grouped by what you would do
   about it, or a flat table.
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, orion = SA.orion, check = SA.check;

  /* Every finding from every agent, flattened and keyed. */
  function allRows() {
    var out = [];
    SA.agents.forEach(function (a) {
      var list = SA.findings[a.id];
      if (!list) return;
      list.forEach(function (r) {
        out.push({
          key: a.id + ':' + r.rec,
          agent: a, row: r,
          done: !!SA.state.doneRows[a.id + ':' + r.rec]
        });
      });
    });
    return out;
  }

  function money(rows) {
    var total = rows.reduce(function (acc, x) {
      var n = parseFloat(String(x.row.impact).replace(/[^0-9.]/g, ''));
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
    return '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  SA.viewInbox = function () {
    var s = SA.state;
    var rows = allRows();
    var open = rows.filter(function (x) { return !x.done; });
    var done = rows.filter(function (x) { return x.done; });

    var head =
      '<div class="pagehead pagehead--pad">' +
        '<div class="row" style="align-items:flex-end;gap:16px">' +
          '<div class="grow">' +
            '<h1 class="pagehead__title">Agent Findings</h1>' +
            '<div class="f13" style="margin-top:4px">Everything the agents found, grouped by what you would do about it.</div>' +
          '</div>' +
          SA.seg([{ id: 'todo', label: 'To-do' }, { id: 'table', label: 'Table' }], s.inboxView, 'setInboxView') +
        '</div>' +
        '<div class="inboxstats">' +
          '<div>' + SA.eyebrow('Open') + '<div class="inboxstat__v">' + open.length + '</div></div>' +
          '<div class="divider-v" style="height:34px"></div>' +
          '<div>' + SA.eyebrow('Checked off today') +
            '<div class="inboxstat__v" style="color:#3f7e1f">' + done.length + '</div></div>' +
          '<div class="divider-v" style="height:34px"></div>' +
          '<div>' + SA.eyebrow('Unbilled or at risk') +
            '<div class="inboxstat__v">' + money(open) + '</div></div>' +
        '</div>' +
      '</div>';

    var body;
    if (s.inboxView === 'todo') {
      body = '<div class="todowrap">' + each(SA.todoGroupOrder, function (gid) {
        var meta = SA.todoGroupMeta[gid];
        var items = rows.filter(function (x) { return (x.row.group || 'watch') === gid; });
        if (!items.length) return '';
        var openCount = items.filter(function (x) { return !x.done; }).length;
        return '<div>' +
          '<div class="todogroup__head">' +
            '<span class="todogroup__accent" style="background:' + meta.accent + '"></span>' +
            '<span class="todogroup__label">' + esc(meta.label) + '</span>' +
            '<span class="mono f12 muted">' + openCount + ' of ' + items.length + '</span>' +
            '<span class="f12 dim">' + esc(meta.help) + '</span>' +
          '</div>' +
          '<div class="card">' + each(items, function (x) {
            var r = x.row;
            return '<div class="' + cls('todo', { 'todo--done': x.done }) + '">' +
              check(x.done, 'toggleTodo', x.key, true) +
              '<div class="grow min0">' +
                '<div class="todo__head">' +
                  '<span class="todo__rec">' + esc(r.rec) + '</span>' +
                  '<span class="todo__issue f13 dim">' + esc(r.issue) + '</span>' +
                '</div>' +
                when(!x.done && r.matters, function () {
                  return '<div class="todo__why">' + esc(r.matters) + '</div>';
                }) +
                '<div class="todo__meta">' +
                  '<span class="agentlink">' + orion(16) +
                    '<a href="#"' + act('openAgentById', x.agent.id) + '>' + esc(x.agent.name) + '</a></span>' +
                  '<span class="f12 muted">' + esc(r.property) + '</span>' +
                  '<span class="f12 muted">Open ' + esc(r.age) + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="todo__right">' +
                '<span class="mono f13 ink2">' + esc(r.impact) + '</span>' +
                (x.done ? '<span class="badge badge--ok">Done</span>'
                  : '<div class="row" style="gap:4px">' +
                    '<button class="btn btn--secondary btn--compact"' + act('inboxAction', x.key) + '>' + esc(r.act) + '</button>' +
                    '<button class="btn btn--iconbox btn--icon"' + act('inboxSnooze', x.key) + ' title="Snooze">' +
                      icon('schedule', 16) + '</button>' +
                  '</div>') +
              '</div>' +
            '</div>';
          }) + '</div>' +
        '</div>';
      }) + '</div>';
    } else {
      body = '<div style="margin:16px 24px 24px" class="tbl">' +
        '<div class="tbl__head g-inbox">' +
          '<div>Record</div><div>Agent</div><div>Property</div><div>What&rsquo;s Wrong</div>' +
          '<div>Detected</div><div class="right">Actions</div>' +
        '</div>' +
        each(rows, function (x) {
          var r = x.row;
          return '<div class="tbl__row tbl__row--click g-inbox">' +
            '<div><div class="recname">' + esc(r.rec) + '</div>' +
              '<div class="recsub">' + esc(r.resident) + '</div></div>' +
            '<div class="row f13 ink2" style="gap:6px">' + orion(22, 'var(--rmx-brand-pressed)') +
              '<a href="#"' + act('openAgentById', x.agent.id) + '>' + esc(x.agent.name) + '</a></div>' +
            '<div class="f13 ink2">' + esc(r.property) + '</div>' +
            '<div class="f13 ink2">' + esc(r.issue) + '</div>' +
            '<div class="f13 dim">' + esc(r.detected) + '</div>' +
            '<div class="acts">' +
              (x.done ? '<span class="badge badge--ok">Done</span>'
                : '<button class="btn btn--secondary btn--compact"' + act('inboxAction', x.key) + '>' + esc(r.act) + '</button>' +
                  '<button class="btn btn--iconbox btn--icon"' + act('inboxSnooze', x.key) + ' title="Dismiss">' +
                    icon('close', 16) + '</button>') +
            '</div>' +
          '</div>';
        }) +
      '</div>';
    }

    return '<div class="screen" data-screen-label="Agent Findings Inbox">' + head + body + '</div>';
  };
})(window.SA = window.SA || {});
