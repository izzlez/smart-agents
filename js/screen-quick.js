/* ============================================================
   Smart Agents — Quick Agent screen (one trigger, one action)
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, chg = SA.chg, fk = SA.fk,
      when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, orion = SA.orion, options = SA.options,
      checkline = SA.checkline, spinner = SA.spinner, okPill = SA.okPill;

  /* ---------- detection sentence with editable value slots ---------- */
  SA.detSegments = function (det, inInspector) {
    if (!det) return '';
    var p = SA.detectionParams(det);
    return '<div class="' + cls('segments', { 'segments--inspector': inInspector }) + '">' +
      each(det.seg, function (g, i) {
        if (typeof g === 'string') return '<span>' + esc(g) + '</span>';
        return '<input class="slot" style="width:' + esc(g.w) + '" value="' + esc(p[g.p]) + '"' +
          fk('slot-' + det.id + '-' + g.p) + chg('setDetParam', det.id, g.p) + '>';
      }) +
    '</div>';
  };

  /* ---------- grouped <optgroup> list of every prebuilt detection ---------- */
  function detectionSelect(current, big) {
    var groups = [];
    SA.detLibrary.forEach(function (d) {
      var g = groups.filter(function (x) { return x.group === d.group; })[0];
      if (!g) { g = { group: d.group, items: [] }; groups.push(g); }
      g.items.push(d);
    });
    return '<select class="' + cls('field', 'field--full', { 'field--lg': big }) + '"' + chg('setDet') + '>' +
      '<option value="">Choose a detection</option>' +
      each(groups, function (g) {
        return '<optgroup label="' + esc(g.group) + '">' + each(g.items, function (it) {
          return '<option value="' + esc(it.id) + '"' + (it.id === current ? ' selected' : '') + '>' +
            esc(it.name) + '</option>';
        }) + '</optgroup>';
      }) +
      '<option value="" disabled>Describe it in your own words — not available in v1</option>' +
    '</select>';
  }
  SA.detectionSelect = detectionSelect;

  /* ---------- read-only sample of matching records ---------- */
  var SAMPLE_SOURCE = { 'movein-charges': 'movein', 'w9': 'w9', 'missing-resident-data': 'residentdata' };

  SA.previewSample = function (det) {
    if (!det) return [];
    var src = SAMPLE_SOURCE[det.id];
    if (src && SA.findings[src]) {
      return SA.findings[src].slice(0, 3).map(function (r) {
        return { rec: r.rec, detail: r.issue, tag: 'Would flag', tone: 'warn' };
      });
    }
    return [
      { rec: 'LSE-10318', detail: det.name, tag: 'Would flag', tone: 'warn' },
      { rec: 'LSE-10327', detail: det.name, tag: 'Would flag', tone: 'warn' },
      { rec: 'LSE-10344', detail: 'Matched, but a person already dismissed it once', tag: 'Excluded', tone: 'neutral' }
    ];
  };

  /* ---------- action settings ---------- */
  function actionConfig() {
    var s = SA.state;
    var cfg = SA.actionConfigs[s.then];
    if (!cfg) return '';
    return '<div class="card fade" style="margin-top:16px">' +
      '<div class="card__head" style="background:var(--rmx-bg-subtle)">' +
        icon('tune', 18, 'color:var(--rmx-text)') +
        '<span>Action settings</span>' +
        '<span class="f13 muted" style="font-weight:400">' + esc(cfg.name) + '</span>' +
      '</div>' +
      '<div class="cfggrid">' +
        each(cfg.fields, function (f) {
          var val = s.actionCfg[f.id] === undefined ? '' : s.actionCfg[f.id];
          var body;
          if (f.kind === 'principal') {
            body = '<div class="row" style="gap:8px">' +
              SA.seg(['Role', 'Person'], s.actionMode, 'setActionMode') +
              '<select class="field grow min0"' + chg('setActionPrincipal') + '>' +
                options(s.actionMode === 'Role' ? SA.principalOptions : SA.peopleOptions, s.actionPrincipal) +
              '</select></div>';
          } else if (f.kind === 'select') {
            body = '<select class="field field--full"' + chg('setCfg', f.id) + '>' +
              options(f.options, val || f.options[0]) + '</select>';
          } else if (f.kind === 'textarea') {
            body = '<textarea class="field field--full"' + fk('cfg-' + f.id) + chg('setCfg', f.id) +
              ' placeholder="' + esc(f.placeholder || '') + '">' + esc(val) + '</textarea>';
          } else {
            body = '<input class="field field--full"' + fk('cfg-' + f.id) + chg('setCfg', f.id) +
              ' placeholder="' + esc(f.placeholder || '') + '" value="' + esc(val) + '">';
          }
          return '<div style="grid-column:' + esc(f.span || 'auto') + '">' +
            '<div class="f14 dim" style="margin-bottom:4px">' + esc(f.label) + '</div>' + body + '</div>';
        }) +
        '<div class="span2 row" style="gap:8px;flex-wrap:wrap">' +
          '<span class="f12 muted">Insert into ' + esc(cfg.msgLabel) + ':</span>' +
          each(SA.mergeChips, function (m) {
            return '<button class="token"' + act('insertToken', m) + '>' + esc(m) + '</button>';
          }) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- the screen ---------- */
  SA.viewQuick = function () {
    var s = SA.state;
    var tpl = null;
    SA.templates.forEach(function (t) { if (t.id === s.quickFor) tpl = t; });
    var title = tpl ? tpl.name : 'New Agent';
    var det = s.when === 'detection' ? SA.detById(s.detId) : null;

    var whenBlock;
    if (s.when === 'detection') {
      whenBlock =
        '<div class="detbox">' +
          '<div class="detbox__head">' +
            '<span class="pill pill--orion">' + orion(22) + 'Orion detection</span>' +
            '<span class="f12 grow" style="color:var(--rmx-brand-pressed)">No query, no table picking. Choose a detection and set its values.</span>' +
            '<button class="linkbtn f13"' + act('clearWhen') + '>Change</button>' +
          '</div>' +
          '<div class="detbox__body">' +
            detectionSelect(s.detId, true) +
            (det ? SA.detSegments(det)
                 : '<div class="f13 dim" style="margin-top:10px">Prebuilt detections only in this release. Set the values; the agent resolves the records &mdash; you never write a query or pick tables.</div>') +
          '</div>' +
        '</div>';
    } else {
      var label = s.when ? s.whenText : 'Choose what starts this agent';
      whenBlock =
        '<button class="picker"' + act('openWhenDd') + '>' +
          '<span class="' + cls('picker__text', { 'picker__text--ph': !s.when }) + '">' + esc(label) + '</span>' +
          icon('arrow_drop_down', null, 'color:var(--rmx-text)') +
        '</button>' +
        when(s.dd === 'when', function () {
          return '<div style="position:relative"><div class="dd">' + each(SA.whenOptions, function (o) {
            if (o.group) return '<div class="dd__group">' + esc(o.group) + '</div>';
            return '<div class="dd__opt"' + act('pickWhen', o.id) + '>' +
              when(o.orion, function () { return orion(26, 'var(--rmx-brand-pressed)'); }) +
              '<span>' + esc(o.label) + '</span></div>';
          }) + '</div></div>';
        });
    }

    var thenLabel = 'Choose what it does';
    SA.thenOptions.forEach(function (o) { if (o.id === s.then) thenLabel = o.label; });

    var checklist = when(det, function () {
      return '<div class="panel" style="margin-top:24px">' +
        '<div class="panel__head">' + orion(26, 'var(--rmx-brand-pressed)') +
          '<span class="w500 navy">What this detection checks</span>' +
          '<span class="spacer"></span>' +
          '<span class="f12 muted">Read-only restatement of your intent</span>' +
        '</div>' +
        '<div class="panel__body">' + each(SA.checklistFor(det), function (c) { return checkline(c); }) + '</div>' +
        '<div class="panel__foot">' +
          '<button class="btn btn--secondary btn--sm"' + act('runTest') + '>' +
            icon('play_arrow', 18) + 'Test Detection</button>' +
          when(s.test === 'running', function () { return spinner('Scanning read-only…'); }) +
          when(s.test === 'done', function () {
            return '<span class="badge badge--ok fade" style="padding:3px 10px;gap:6px">' +
              icon('check_circle', 16) + esc(det.result) + '</span>';
          }) +
          '<span class="spacer"></span>' +
          '<span class="f12 muted">Test runs read-only. Nothing is sent, posted, or changed.</span>' +
        '</div>' +
      '</div>';
    });

    var preview = when(det && s.test === 'done', function () {
      return '<div class="card fade-slow" style="margin-top:16px;overflow:hidden">' +
        '<div class="tbl__head" style="display:block">Sample of matching records</div>' +
        each(SA.previewSample(det), function (p) {
          return '<div class="tbl__row g-quickprev">' +
            '<div class="f14 brand">' + esc(p.rec) + '</div>' +
            '<div class="f13 ink2">' + esc(p.detail) + '</div>' +
            '<div class="right">' + SA.toneBadge(p.tone, p.tag) + '</div>' +
          '</div>';
        }) +
      '</div>';
    });

    var sensHelp = '';
    SA.sensOptions.forEach(function (o) { if (o.id === s.sens) sensHelp = o.help; });

    var optionsBlock =
      '<div style="margin-top:24px;border-top:1px solid var(--rmx-line);padding-top:16px">' +
        '<button class="linkbtn"' + act('toggleOptions') + '>' +
          icon(s.optionsOpen ? 'keyboard_arrow_down' : 'chevron_right', 20) + 'Options' +
          '<span class="muted f13">Schedule, scope, sensitivity, hand-off</span>' +
        '</button>' +
        when(s.optionsOpen, function () {
          return '<div class="optgrid fade">' +
            '<div><div class="f14" style="margin-bottom:4px">Run schedule</div>' +
              '<select class="field field--full fauxfield--36" style="height:36px;font-size:14px"' + chg('setSchedSelect') + '>' +
                options(SA.schedOptions, s.sched) + '</select></div>' +
            '<div><div class="f14" style="margin-bottom:4px">Scope</div>' +
              SA.pick('quick-scope', SA.scopeOptions, SA.scopeOptions[0], 'field--full fauxfield--36') + '</div>' +
            '<div><div class="f14" style="margin-bottom:6px">Sensitivity</div>' +
              SA.seg(SA.sensOptions, s.sens, 'setSens', { line: true }) +
              '<div class="fhelp">' + esc(sensHelp) + '</div></div>' +
            '<div><div class="f14" style="margin-bottom:4px">Hand-off destination</div>' +
              SA.pick('quick-handoff', SA.handoffOptions, SA.handoffOptions[0], 'field--full fauxfield--36') +
              '<div class="fhelp">Where work goes when the agent cannot or will not act.</div></div>' +
          '</div>';
        }) +
      '</div>';

    return '<div class="screen screen--tint" data-screen-label="Quick Agent">' +
      '<div class="pagehead pagehead--tight">' +
        '<div class="row" style="gap:12px">' +
          '<h1 class="pagehead__title--sm grow">' + esc(title) + '</h1>' +
          '<span class="badge badge--neutral">Quick agent</span>' +
        '</div>' +
      '</div>' +
      '<div class="quickwrap">' +
        '<div class="quickcard">' +
          '<div class="sentence">' +
            '<div class="sentence__lead">When</div><div>' + whenBlock + '</div>' +
            '<div class="sentence__lead--sm">Only when</div>' +
            '<div style="padding-top:8px">' +
              when(s.conds.length, function () {
                return '<div class="col" style="gap:8px;margin-bottom:10px">' + each(s.conds, function (c, i) {
                  return '<div class="condrow">' +
                    '<select class="field"' + chg('setCond', i, 'field') + '>' + options(SA.condFieldOptions, c.field) + '</select>' +
                    '<select class="field"' + chg('setCond', i, 'op') + '>' + options(SA.condOpOptions, c.op) + '</select>' +
                    '<input class="field"' + fk('cond-' + i) + chg('setCond', i, 'val') +
                      ' placeholder="Value" value="' + esc(c.val) + '">' +
                    '<button class="btn btn--iconbox"' + act('removeCond', i) + ' title="Remove condition">' +
                      icon('close', 16) + '</button>' +
                  '</div>';
                }) + '</div>';
              }) +
              '<button class="linkbtn"' + act('addCond') + '>' + icon('add_circle', 18) + 'Add a Condition</button>' +
              '<div class="fhelp fhelp--muted">Optional. Deterministic filters applied before the action runs &mdash; evaluated exactly as written.</div>' +
            '</div>' +
            '<div class="sentence__lead">Then</div>' +
            '<div>' +
              '<button class="picker"' + act('openThenDd') + '>' +
                '<span class="' + cls('picker__text', { 'picker__text--ph': !s.then }) + '">' + esc(thenLabel) + '</span>' +
                icon('arrow_drop_down', null, 'color:var(--rmx-text)') +
              '</button>' +
              when(s.dd === 'then', function () {
                return '<div style="position:relative"><div class="dd">' + each(SA.thenOptions, function (o) {
                  return '<div class="dd__opt"' + act('pickThen', o.id) + '>' + esc(o.label) + '</div>';
                }) + '</div></div>';
              }) +
            '</div>' +
          '</div>' +
          checklist + preview + when(s.then, actionConfig) + optionsBlock +
        '</div>' +
        '<div class="row" style="gap:12px;margin-top:16px">' +
          '<button class="btn btn--primary"' + act('saveAgent') + '>Save Agent</button>' +
          '<button class="btn btn--secondary"' + act('openPromote') + '>' +
            icon('account_tree', 18) + 'Open in Builder</button>' +
          '<span class="spacer"></span>' +
          '<span class="f12 muted">A quick agent is one trigger and one action on the same engine as the builder.</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  SA.actions.setSchedSelect = function (_a, _b, ev) { SA.state.sched = ev.target.value; };
})(window.SA = window.SA || {});
