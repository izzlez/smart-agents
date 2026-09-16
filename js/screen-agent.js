/* ============================================================
   Smart Agents — Agent Detail screen
   Header + tabs + settings drawers, the build canvas and its
   inspector, the Findings tab and the Runs tab.
   Rule-mode editors live in screen-rules.js.
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, chg = SA.chg, fk = SA.fk,
      when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, orion = SA.orion, toggle = SA.toggle,
      check = SA.check, checkStatic = SA.checkStatic, radio = SA.radio,
      typeBadge = SA.typeBadge, options = SA.options,
      checkline = SA.checkline, spinner = SA.spinner, okPill = SA.okPill;

  /* ---------------- authored per-agent settings copy ---------------- */
  var OBJECTIVES = {
    movein: 'Make sure every lease is billed what its signed agreement says, before a month of rent goes missing.',
    w9: 'Have a W-9 on file for every vendor that will need a 1099, before year end.',
    residentdata: 'Keep every active resident reachable by phone and email, with an emergency contact on the lease.',
    credit: 'Clear small, documented credits without a queue, and put every other credit in front of a person who can approve it.',
    bill: 'Move clean invoices toward payment and stop the ones that disagree with their paperwork.',
    prospect: 'Keep live prospects in contact until they tour, lease, or say no — without over-messaging them.'
  };
  var GUARDRAILS = {
    movein: ['Cannot post or adjust a charge', 'Cannot email residents', 'Max 1 task per lease per run', 'Every finding names its evidence'],
    w9: ['Cannot email vendors directly', 'Cannot edit vendor records', 'Max 1 task per vendor per week', 'Every finding names its evidence'],
    residentdata: ['Cannot write resident contact fields', 'Cannot contact residents', 'Max 1 task per resident per week', 'Every finding names its evidence'],
    credit: ['Cannot approve over $250.00', 'Cannot post to a closed period', 'Approval required over the limit', 'Declines must state a reason'],
    bill: ['Cannot pay an invoice', 'Cannot approve without a matching PO', 'Approval required over $250.00 variance', 'Holds must name what is missing'],
    prospect: ['Max 2 outbound per 7 days', 'Cannot discount or quote rent', 'Cannot mark a prospect leased', 'Uses the channel the prospect used first']
  };
  function guardrailsFor(a) { return GUARDRAILS[a.id] || GUARDRAILS.movein; }
  function objectiveFor(a) { return OBJECTIVES[a.id] || 'Keep this record type consistent with what the signed agreement says.'; }

  function ruleSettings(a) {
    return [
      { label: 'Kind', value: a.type + (a.schedType ? ' · ' + a.schedType : (a.notifGroup ? ' · ' + a.notifGroup : '')) },
      { label: 'Trigger', value: a.trigger },
      { label: 'Runs as', value: 'Automation Service' },
      { label: 'Last run', value: a.last },
      { label: 'Current state', value: a.state },
      { label: 'Hand-off', value: 'Regional Manager queue · Dana Kessler' }
    ];
  }

  /* Replay decision pills reuse the badge tones as a pill shape. */
  var TONE_PILL = { ok: 'badge--ok', warn: 'badge--warn', neutral: 'badge--stop', err: 'badge--err' };

  /* ---------------- condition rows per canvas node ---------------- */
  var COND_ROWS = {
    'cond-open': [
      { field: 'Finding status', op: 'is not', val: 'Dismissed' },
      { field: 'Unit type', op: 'is not', val: 'Employee, Model' }
    ],
    'cond-tier1': [{ field: 'Credit amount', op: 'is at most', val: '$250.00' }],
    'cond-tier2': [{ field: 'Credit amount', op: 'is over', val: '$250.00' }],
    'cond-doc': [{ field: 'Supporting document', op: 'is', val: 'Missing' }],
    'cond-reason': [
      { field: 'Reason code', op: 'does not match', val: 'Ledger activity' },
      { field: 'Concession schedule', op: 'is', val: 'None' }
    ],
    'cond-var': [
      { field: 'Variance to PO', op: 'is over', val: '$250.00' },
      { field: 'Variance to last approved', op: 'is over', val: '$250.00' }
    ],
    'cond-unit': [
      { field: 'Matching unit available', op: 'is', val: 'Now or within 30 days' },
      { field: 'Prospect stage', op: 'is not', val: 'Lost, Leased' }
    ]
  };

  /* ---------------- header + tabs ---------------- */
  function tabsFor(a) {
    var isRule = a.mode === 'rule';
    var fcount = SA.findingsFor(a).length;
    return [
      { id: 'build', label: isRule ? 'Setup' : 'Build' },
      { id: 'findings', label: 'Findings', count: fcount || null },
      { id: 'runs', label: isRule ? 'History' : 'Runs' }
    ];
  }

  function agentHead(a) {
    var s = SA.state;
    return '<div class="pagehead pagehead--tabs">' +
      '<div class="row" style="gap:12px">' +
        '<h1 class="pagehead__title--sm">' + esc(a.name) + '</h1>' +
        typeBadge(a.type) +
        '<span class="f13 muted">' + esc(a.trigger) + '</span>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn--neutral btn--sm"' + act('toggleSettings') + '>' +
          icon('settings', 18) + (s.settingsOpen ? 'Hide Settings' : 'Settings') + '</button>' +
        '<button class="btn btn--primary btn--sm"' + act('saveRule') + '>Save</button>' +
      '</div>' +
      '<div class="tabs">' + each(tabsFor(a), function (t) {
        return '<button class="' + cls('tab', { 'tab--on': s.tab === t.id }) + '"' + act('setTab', t.id) + '>' +
          esc(t.label) +
          when(t.count, function () { return '<span class="tab__count">' + esc(t.count) + '</span>'; }) +
        '</button>';
      }) + '</div>' +
    '</div>';
  }

  function settingsDrawer(a) {
    var s = SA.state;
    if (!s.settingsOpen) return '';
    if (a.mode === 'rule') {
      return '<div class="settings settings--rule">' + each(ruleSettings(a), function (r) {
        return '<div>' + SA.eyebrow(r.label, 'margin-bottom:4px') +
          '<div class="settings__line">' + esc(r.value) + '</div></div>';
      }) + '</div>';
    }
    return '<div class="settings">' +
      '<div>' +
        SA.eyebrow('Objective', 'margin-bottom:6px') +
        '<div class="settings__line">' + esc(objectiveFor(a)) + '</div>' +
        SA.eyebrow('Hand-off destination', 'margin:14px 0 6px') +
        '<div class="settings__line">Regional Manager queue &middot; Dana Kessler</div>' +
      '</div>' +
      '<div>' +
        SA.eyebrow('Guardrails', 'margin-bottom:6px') +
        '<div class="row" style="flex-wrap:wrap;gap:8px">' + each(guardrailsFor(a), function (g) {
          return '<span class="lockchip lockchip--card">' + icon('lock') + esc(g) + '</span>';
        }) + '</div>' +
        '<div class="f12 muted" style="margin-top:8px">Locked guardrails are product decisions for this release and cannot be edited.</div>' +
      '</div>' +
      '<div>' +
        SA.eyebrow('Permissions', 'margin-bottom:6px') +
        '<div class="settings__line">Runs as: Automation Service</div>' +
        '<div class="settings__line">Reads: Lease, Ledger, Charges, Units</div>' +
        '<div class="settings__line">Writes: Tasks, Notes, Notifications</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------- build: canvas ---------------- */
  function canvasNode(n, selected) {
    var color = SA.nodeKindColor[n.kind] || 'var(--rmx-brand)';
    return '<div class="' + cls('node', { 'node--on': selected }) + '"' +
      ' style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + n.w + 'px;min-height:' + n.h + 'px"' +
      act('selectNode', n.id) + '>' +
      '<div class="node__top">' +
        (n.orion ? orion(24) : icon(SA.nodeKindIcon[n.kind] || 'bolt', 16, 'color:' + color)) +
        '<span class="node__kind" style="color:' + color + '">' + esc(n.kind) + '</span>' +
        '<span class="spacer"></span>' +
        when(n.orion, function () { return '<span class="pill pill--orion-soft" style="padding:2px 8px;font-size:12px">Orion</span>'; }) +
        when(n.locked, function () { return icon('lock', 14, 'color:var(--rmx-text-muted)'); }) +
      '</div>' +
      '<div class="node__title">' + esc(n.title) + '</div>' +
      when(n.sub, function () { return '<div class="node__sub">' + esc(n.sub) + '</div>'; }) +
      when(n.meta, function () { return '<div class="node__meta">' + esc(n.meta) + '</div>'; }) +
    '</div>';
  }

  function buildCanvas(a) {
    var s = SA.state;
    var spec = SA.workGraph(a.id);
    if (!spec) return '';
    var g = SA.layoutGraph(spec);
    var sel = s.selNode || (g.nodes.filter(function (n) { return n.kind === 'Detection'; })[0] || g.nodes[0]).id;
    var selNode = g.nodes.filter(function (n) { return n.id === sel; })[0] || g.nodes[0];
    var off = !s.enabled;

    return '<div class="canvaswrap">' +
      '<div class="palette">' +
        '<div class="palette__label">Add Node</div>' +
        each(SA.paletteItems, function (p) {
          return '<button class="palette__btn"' + act('addNode', p.label) + ' title="' + esc(p.title) + '"' +
            ' style="color:' + (SA.nodeKindColor[p.id.charAt(0).toUpperCase() + p.id.slice(1)] || 'var(--rmx-text)') + '">' +
            icon(p.icon, 20) + esc(p.label) + '</button>';
        }) +
        '<div class="palette__reset">' +
          '<button class="palette__resetbtn"' + act('resetCanvas') + ' title="Discard canvas edits">' +
            icon('undo', 18) + 'Reset</button>' +
        '</div>' +
      '</div>' +
      '<div class="canvas">' +
        when(off, function () {
          return '<div class="canvas__veil"><div class="canvas__veilcard">' +
            icon('pause_circle', 28, 'color:var(--rmx-warning)') +
            '<div class="w500 navy" style="margin-top:6px">Agents are disabled</div>' +
            '<div class="f13" style="margin-top:4px">The canvas is read-only and nothing is evaluating. Re-enable agents in the header to edit.</div>' +
          '</div></div>';
        }) +
        '<div class="canvas__inner" style="width:' + g.w + 'px;height:' + g.h + 'px' +
          (off ? ';filter:grayscale(0.6);opacity:0.55' : '') + '">' +
          '<svg class="canvas__svg" width="' + g.w + '" height="' + g.h + '">' +
            each(g.edges, function (e) {
              return '<path d="' + esc(e.d) + '" fill="none" stroke="' +
                (e.dashed ? 'var(--rmx-warning)' : 'var(--rmx-line)') + '" stroke-width="' + (e.dashed ? 1.5 : 2) + '"' +
                (e.dashed ? ' stroke-dasharray="6 6"' : '') +
                (SA.props.flowAnimation && !off && !e.dashed ? ' style="stroke-dasharray:6 6;animation:rmxDash 1.6s linear infinite"' : '') +
                '></path>';
            }) +
          '</svg>' +
          each(g.nodes, function (n) { return canvasNode(n, n.id === sel); }) +
        '</div>' +
      '</div>' +
      inspector(a, selNode) +
    '</div>';
  }

  /* ---------------- build: inspector ---------------- */
  function inspector(a, n) {
    var s = SA.state;
    var color = SA.nodeKindColor[n.kind] || 'var(--rmx-brand)';
    var body;
    if (n.kind === 'Detection') body = inspDetection(a);
    else if (n.kind === 'Condition') body = inspCondition(n);
    else if (n.kind === 'Trigger') body = inspTrigger();
    else if (n.kind === 'Hand Off') body = inspEscape();
    else body = inspAction(a, n);

    return '<div class="inspector">' +
      '<div class="inspector__head">' +
        icon(SA.nodeKindIcon[n.kind] || 'bolt', 18, 'color:' + color) +
        '<div class="grow">' +
          '<div class="inspector__kind">' + esc(n.kind) + '</div>' +
          '<div class="inspector__title">' + esc(n.title) + '</div>' +
        '</div>' +
        when(n.orion, function () { return '<span class="pill pill--orion-soft">' + orion(22) + 'Orion</span>'; }) +
        when(n.added, function () {
          return '<button class="inspector__rm"' + act('removeNode', n.id) + ' title="Remove this node">' +
            icon('delete', 18) + '</button>';
        }) +
      '</div>' + body +
    '</div>';
  }

  function inspDetection(a) {
    var s = SA.state;
    var det = SA.detById(s.detId) || SA.agentDetection(a);
    var sensHelp = '';
    SA.sensOptions.forEach(function (o) { if (o.id === s.sens) sensHelp = o.help; });
    var window_ = det ? (SA.detections[a.id] ? SA.detections[a.id].window : 'Last 30 days') : 'Last 30 days';

    return '<div class="inspector__body">' +
      '<div>' +
        '<div class="flabel">What to detect</div>' +
        SA.detectionSelect(det ? det.id : null) +
        when(det, function () { return SA.detSegments(det, true); }) +
        '<div class="fhelp fhelp--muted">Prebuilt detections only in this release. Set the values; the agent resolves the records &mdash; you never write a query or pick tables.</div>' +
        '<div class="note" style="margin-top:12px">A detection assesses a record &mdash; it does not route. Put a condition after it for each branch you want, and anything that matches no branch is handed off to a person.</div>' +
      '</div>' +
      '<div>' +
        '<div class="flabel">Where to look</div>' +
        '<div class="col" style="gap:8px">' +
          SA.pick('det-scope', SA.scopeOptions, SA.scopeOptions[0], 'field--full') +
          SA.pick('det-window', [window_].concat(SA.windowOptions), window_, 'field--full') +
          SA.chk('det-active', true, 'Active leases only') +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="flabel" style="margin-bottom:2px">Data scope</div>' +
        '<div class="f12 dim" style="margin-bottom:8px">The only data this detection can see.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
          each(Object.keys(s.scope), function (k) {
            return '<label class="row f13" style="gap:8px;cursor:pointer;color:' +
              (s.scope[k] ? 'var(--rmx-ink-2)' : 'var(--rmx-text-muted)') + '"' + act('toggleScope', k) + '>' +
              '<span class="' + cls('check', { 'check--on': s.scope[k] }) + '">' + (s.scope[k] ? '&#10003;' : '') + '</span>' +
              esc(k) + '</label>';
          }) +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="flabel">Sensitivity</div>' +
        SA.seg(SA.sensOptions, s.sens, 'setSens', { line: true, fill: true }) +
        '<div class="fhelp">' + esc(sensHelp) + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="flabel">Run schedule</div>' +
        SA.seg(SA.schedOptions, s.sched, 'setSched', { line: true, fill: true }) +
      '</div>' +
      when(det, function () {
        return '<div class="panel">' +
          '<div class="panel__head">' + orion(28, 'var(--rmx-brand-pressed)') +
            '<span class="f13 w500 navy">What this detection checks</span></div>' +
          '<div class="panel__body" style="gap:7px">' +
            each(SA.checklistFor(det), function (c) { return checkline(c, true); }) +
          '</div>' +
        '</div>';
      }) +
      '<div class="col" style="gap:8px">' +
        '<button class="btn btn--secondary" style="height:34px"' + act('runTest') + '>' +
          icon('play_arrow', 18) + 'Test Detection</button>' +
        when(s.test === 'running', function () { return spinner('Scanning read-only…'); }) +
        when(s.test === 'done' && det, function () {
          return '<div class="row fade" style="gap:8px;padding:8px 10px;border-radius:4px;background:var(--rmx-success-bg);color:#3f7e1f;font-size:14px">' +
            icon('check_circle', 16) + esc(det.result) + ' &middot; read-only</div>';
        }) +
      '</div>' +
    '</div>';
  }

  function inspCondition(n) {
    var rows = COND_ROWS[n.id] || [{ field: 'Record status', op: 'is', val: 'Active' }];
    return '<div class="inspector__body inspector__body--tight">' +
      '<div class="f12 dim">Deterministic branching. Evaluated exactly as written &mdash; no interpretation.</div>' +
      each(rows, function (r, i) {
        return '<div style="display:grid;grid-template-columns:1fr 76px 1fr;gap:6px">' +
          SA.pick('cond-f-' + n.id + '-' + i, [r.field].concat(SA.conditionFields), r.field, 'field--full') +
          SA.pick('cond-o-' + n.id + '-' + i, [r.op].concat(SA.conditionOps), r.op, 'field--full') +
          '<input class="field field--full"' + fk('cond-v-' + n.id + '-' + i) +
            chg('setPick', 'cond-v-' + n.id + '-' + i) + ' value="' + esc(SA.pickVal('cond-v-' + n.id + '-' + i, r.val)) + '">' +
        '</div>';
      }) +
      '<button class="linkbtn f13" style="align-self:flex-start"' + act('noop') + '>' +
        icon('add_circle', 18) + 'Add Another Field Test</button>' +
    '</div>';
  }

  function inspTrigger() {
    var s = SA.state;
    var restate = s.trigKind === 'Event'
      ? 'Runs the moment ' + s.trigEvent.charAt(0).toLowerCase() + s.trigEvent.slice(1) + '. Nothing is queued or batched.'
      : 'Runs ' + s.trigFreq.toLowerCase() + ' with the scheduled Rent Manager run.';

    return '<div class="inspector__body" style="gap:16px">' +
      '<div><div class="flabel">Starts on</div>' +
        SA.seg(['Event', 'Schedule'], s.trigKind, 'setTrigKind', { fill: true }) + '</div>' +
      when(s.trigKind === 'Event', function () {
        return '<div><div class="flabel">Event</div>' +
          '<select class="field field--full"' + chg('setField', 'trigEvent') + '>' +
            options(SA.trigEventOptions, s.trigEvent) + '</select>' +
          '<div class="fhelp">Runs the moment the event happens, not on a schedule.</div></div>';
      }) +
      when(s.trigKind === 'Schedule', function () {
        return '<div class="col" style="gap:16px">' +
          '<div><div class="flabel">How often</div>' +
            SA.seg(SA.trigFreqOptions, s.trigFreq, 'setTrigFreq', { line: true, fill: true }) + '</div>' +
          /* A schedule sets the cadence only. Rent Manager owns the clock, so
             there is no weekday, month day, or time-of-day to choose. */
          '<div class="note">Agents run with Rent Manager&rsquo;s scheduled run. You choose how ' +
            'often &mdash; the specific day and time are not yours to set.</div>' +
        '</div>';
      }) +
      '<div class="restate">' + esc(restate) + '</div>' +
      '<div class="f12 dim">One trigger per agent. Everything downstream runs in order from here.</div>' +
    '</div>';
  }

  function inspEscape() {
    return '<div class="inspector__body inspector__body--tight">' +
      '<div class="row" style="gap:8px;padding:10px 12px;border-radius:4px;background:#fdebd9;color:#a85e0e;font-size:14px;align-items:flex-start">' +
        icon('info', 18) +
        '<span>Every agent hands off to a person, and that step cannot be deleted. There is no silent no-op.</span></div>' +
      '<div><div class="flabel">Destination</div>' +
        SA.pick('handoff-dest', SA.handoffOptions, SA.handoffOptions[0], 'field--full') + '</div>' +
      '<div><div class="flabel">Work arrives here when</div>' +
        '<div class="col f13 ink2" style="gap:7px">' +
          '<div>&bull; A guardrail blocks the chosen action</div>' +
          '<div>&bull; The agent has no action it can justify</div>' +
          '<div>&bull; Required data is missing or contradictory</div>' +
        '</div></div>' +
      '<label class="row f13 ink2" style="gap:8px;cursor:pointer"' + act('togglePick', 'handoff-note', 'on') + '>' +
        checkStatic(SA.chkVal('handoff-note', true)) +
        'Attach the agent&rsquo;s reasoning to routed work</label>' +
    '</div>';
  }

  function inspAction(a, n) {
    var s = SA.state;
    var isApproval = n.kind === 'Approval';
    var isPerson = /task|notify|approval|send/i.test(n.title) || isApproval;
    var locked = SA.approvalLocked();
    var hasTiers = isApproval && a.id === 'credit';

    var restate = 'Goes to the ' + (s.approverMode === 'Role' ? s.approver.toLowerCase() : s.approver) +
      '. If there is no answer in ' + s.apvTimeout.toLowerCase() + ' it moves to the ' +
      (s.backupMode === 'Role' ? s.backup.toLowerCase() : s.backup) + '. It never expires silently.';

    return '<div class="inspector__body">' +
      '<div><div class="flabel">Action type</div>' +
        SA.pick('act-target-' + n.id, [n.title].concat(SA.actionTargets), n.title, 'field--full') + '</div>' +

      when(isPerson && !isApproval, function () {
        return '<div><div class="flabel">Send to</div>' +
          '<div class="row" style="gap:8px">' +
            SA.seg(['Role', 'Person'], s.actionMode, 'setActionMode') +
            '<select class="field grow min0"' + chg('setActionPrincipal') + '>' +
              options(s.actionMode === 'Role' ? SA.principalOptions : SA.peopleOptions, s.actionPrincipal) + '</select>' +
          '</div>' +
          '<div class="fhelp fhelp--muted">Pick a role and it resolves per property at run time. Pick a person and it always goes to them.</div>' +
        '</div>';
      }) +
      when(!isPerson, function () {
        return '<div><div class="flabel">Target record</div>' +
          SA.pick('act-input-' + n.id, SA.actionInputs, SA.actionInputs[0], 'field--full') + '</div>';
      }) +

      when(isApproval, function () {
        return '<div class="col" style="gap:16px">' +
          '<div><div class="flabel">Who approves</div>' +
            '<div class="row" style="gap:8px">' +
              SA.seg(['Role', 'Person'], s.approverMode, 'setApproverMode') +
              '<select class="field grow min0"' + chg('setField', 'approver') + '>' +
                options(s.approverMode === 'Role' ? SA.principalOptions : SA.peopleOptions, s.approver) + '</select>' +
            '</div></div>' +
          '<div style="display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px">' +
            '<div><div class="flabel">No answer in</div>' +
              '<select class="field field--full"' + chg('setField', 'apvTimeout') + '>' +
                options(['24 hours', '3 days', '7 days'], s.apvTimeout) + '</select></div>' +
            '<div><div class="flabel">Then it goes to</div>' +
              '<div class="row" style="gap:8px">' +
                SA.seg(['Role', 'Person'], s.backupMode, 'setBackupMode', { btnCls: 'seg__btn--xs' }) +
                '<select class="field grow min0"' + chg('setField', 'backup') + '>' +
                  options(s.backupMode === 'Role' ? SA.principalOptions : SA.peopleOptions, s.backup) + '</select>' +
              '</div></div>' +
          '</div>' +
          '<div class="restate">' + esc(restate) + '</div>' +
          when(hasTiers, approvalTiers) +
        '</div>';
      }) +

      '<div style="border:1px solid var(--rmx-line);border-radius:4px;padding:12px">' +
        '<div class="row" style="gap:10px">' +
          toggle(s.approval, 'toggleApproval', null, { locked: locked }) +
          '<div class="grow f14 ink">Requires approval</div>' +
          when(locked, function () { return icon('lock', 16, 'color:var(--rmx-text-muted)'); }) +
        '</div>' +
        '<div class="f12 dim" style="margin-top:8px">' +
          esc(locked
            ? 'Locked on for this action — it moves money, so a person signs off every time.'
            : (s.approval ? 'A person confirms before this action runs.' : 'The agent runs this action on its own and records what it did.')) +
        '</div>' +
      '</div>' +
      '<div><div class="flabel">If the action cannot run</div>' +
        '<div class="row f13 ink2" style="gap:8px">' +
          icon('alt_route', 18, 'color:var(--rmx-warning)') +
          'Hand off to a person &mdash; Regional Manager queue</div></div>' +
    '</div>';
  }

  function approvalTiers() {
    var s = SA.state;
    return '<div>' +
      '<div class="flabel">Approval tiers by amount</div>' +
      '<div class="col" style="gap:10px">' + each(s.tiers, function (t, i) {
        var multi = t.approvers.length > 1;
        var restate = t.auto
          ? 'Anything in this band posts automatically, with the reasoning written to the ledger.'
          : (multi
            ? (t.rule === 'All' ? 'All ' + t.approvers.length + ' approvers must sign off.' : 'Any one of the ' + t.approvers.length + ' approvers can sign off.')
            : 'Goes to ' + (t.approvers[0] || 'nobody yet') + '.');
        return '<div class="tier">' +
          '<div class="row" style="gap:8px;margin-bottom:10px">' +
            '<span class="arstep__no">Tier ' + (i + 1) + '</span>' +
            '<span class="spacer"></span>' +
            '<button class="btn btn--iconbox btn--icon-xs"' + act('removeTier', i) + ' title="Remove tier">' +
              icon('close', 14) + '</button>' +
          '</div>' +
          '<div class="row f13 ink" style="gap:8px">' +
            '<span>$</span>' +
            '<input class="field field--right" style="width:88px"' + fk('tier-from-' + i) +
              chg('setTierField', i, 'from') + ' value="' + esc(t.from) + '">' +
            '<span>to $</span>' +
            '<input class="field field--right" style="width:108px"' + fk('tier-to-' + i) +
              chg('setTierField', i, 'to') + ' placeholder="No limit" value="' + esc(t.to) + '">' +
          '</div>' +
          '<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">' +
            each(t.approvers, function (ap) {
              return '<span class="pill pill--tier">' + esc(ap) +
                '<span style="cursor:pointer;display:inline-flex"' +
                act('removeApprover', i, ap) + '>' + icon('close', 14) + '</span></span>';
            }) +
            when(t.auto, function () {
              return '<span class="pill pill--ok">Automatic &mdash; no approver</span>';
            }) +
          '</div>' +
          '<div class="row" style="gap:8px;margin-top:10px">' +
            '<button class="btn btn--secondary btn--compact"' + act('addApprover', i) + '>Add Approver</button>' +
            when(multi, function () {
              return SA.seg(['Any', 'All'], t.rule, 'setTierRuleFor' + i, { line: true, btnCls: 'seg__btn--xxs' });
            }) +
          '</div>' +
          '<div class="f12 dim" style="margin-top:8px;line-height:18px">' + esc(restate) + '</div>' +
        '</div>';
      }) + '</div>' +
      '<div class="row" style="gap:8px;margin-top:12px">' +
        SA.seg(['Role', 'Person'], s.tierAddMode, 'setTierAddMode', { btnCls: 'seg__btn--xs' }) +
        '<select class="field field--sm grow min0"' + chg('setField', 'tierAddValue') + '>' +
          options(s.tierAddMode === 'Role' ? SA.principalOptions : SA.peopleOptions, s.tierAddValue) + '</select>' +
      '</div>' +
      '<div class="fhelp fhelp--muted">Pick who to add, then use Add Approver on the tier that needs them.</div>' +
      '<button class="linkbtn" style="margin-top:12px"' + act('addTier') + '>' +
        icon('add_circle', 18) + 'Add Tier</button>' +
    '</div>';
  }

  /* Any/All is per tier, so each index needs its own action name. */
  for (var ti = 0; ti < 8; ti++) {
    (function (i) {
      SA.actions['setTierRuleFor' + i] = function (rule) {
        if (SA.state.tiers[i]) SA.state.tiers[i].rule = rule;
      };
    })(ti);
  }

  /* ---------------- build: quick-agent read-only view ---------------- */
  function buildQuick(a) {
    var det = SA.agentDetection(a);
    var thenText = SA.quickThen[a.id] || a.action || 'Create a task for the property manager';
    return '<div class="screen screen--tint" style="padding:24px">' +
      '<div style="max-width:900px;margin:0 auto">' +
        '<div class="banner banner--info" style="margin-bottom:16px">' +
          icon('info', 18) +
          '<span class="f13 grow" style="color:var(--rmx-brand-pressed)">This agent was authored as a quick agent &mdash; one trigger, one action. It runs on the same engine as builder agents.</span>' +
          '<button class="btn btn--secondary btn--xs"' + act('openQuickEditor') + '>Edit Quick Agent</button>' +
        '</div>' +
        '<div class="card" style="border-radius:5px;padding:28px">' +
          '<div class="sentence" style="row-gap:16px">' +
            '<div class="sentence__lead f18" style="padding-top:4px">When</div>' +
            '<div>' +
              '<div class="f18 ink" style="line-height:26px">' + esc(det ? det.name : a.trigger) + '</div>' +
              '<div style="margin-top:8px"><span class="pill pill--orion-soft">' + orion(22) + 'Orion detection</span></div>' +
            '</div>' +
            '<div class="sentence__lead f18" style="padding-top:4px">Then</div>' +
            '<div class="f18 ink" style="line-height:26px">' + esc(thenText) + '</div>' +
          '</div>' +
          when(det, function () {
            return '<div class="panel" style="margin-top:22px">' +
              '<div class="panel__head">' + orion(28, 'var(--rmx-brand-pressed)') +
                '<span class="f13 w500 navy">What this detection checks</span></div>' +
              '<div class="panel__body" style="gap:7px">' +
                each(SA.checklistFor(det), function (c) { return checkline(c, true); }) + '</div>' +
            '</div>';
          }) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------- Findings tab ---------------- */
  function findingsTab(a) {
    var s = SA.state;
    var rows = SA.sortedFindings();
    var dismissed = rows.filter(function (r) { return s.dismissedRows[a.id + ':' + r.rec]; }).length;
    var fixed = rows.filter(function (r) { return s.doneRows[a.id + ':' + r.rec]; }).length;
    var open = rows.length - dismissed - fixed;
    var atRisk = rows.reduce(function (acc, r) {
      var n = parseFloat(String(r.impact).replace(/[^0-9.]/g, ''));
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
    var selCount = Object.keys(s.selected).filter(function (k) { return s.selected[k]; }).length;
    var allOn = rows.length && rows.every(function (r) { return s.selected[r.rec]; });

    var stats = [
      { label: 'Open', value: open, color: 'var(--rmx-brand-dark)' },
      { label: 'Dismissed', value: dismissed, color: 'var(--rmx-text)' },
      { label: 'Fixed today', value: fixed, color: '#3f7e1f' },
      { label: 'Unbilled or at risk', value: '$' + atRisk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: 'var(--rmx-brand-dark)' }
    ];

    if (!rows.length) {
      return '<div class="screen" style="padding:20px 24px 32px">' +
        '<div class="card empty">' + icon('check_circle', 30, 'color:var(--rmx-success)') +
          '<div class="empty__title">Nothing open on this agent</div>' +
          '<div class="empty__text">This agent takes actions rather than writing findings. Its decisions are on the ' +
            (a.mode === 'rule' ? 'History' : 'Runs') + ' tab.</div>' +
        '</div></div>';
    }

    return '<div class="screen" style="padding:20px 24px 32px">' +
      '<div class="statbar">' +
        '<div>' + SA.eyebrow('Last scan') +
          '<div class="f14 navy" style="margin-top:2px">' + esc(a.last) + ' &middot; ' + esc(a.trigger) + '</div></div>' +
        '<div class="divider-v" style="height:36px"></div>' +
        each(stats, function (st) {
          return '<div>' + SA.eyebrow(st.label) +
            '<div class="stat__value" style="color:' + st.color + '">' + esc(st.value) + '</div></div>';
        }) +
        '<span class="spacer"></span>' +
        '<div class="f12 muted" style="max-width:230px;text-align:right">A queue of what was found &mdash; not a log of what was done.</div>' +
      '</div>' +

      '<div class="toolbar">' +
        SA.pick('find-prop', SA.scopeOptions, SA.scopeOptions[0], 'field--32') +
        SA.pick('find-type', SA.findingTypeOptions, SA.findingTypeOptions[0], 'field--32') +
        SA.pick('find-age', SA.findingAgeOptions, SA.findingAgeOptions[0], 'field--32') +
        '<span class="spacer"></span>' +
        '<span class="f13 dim">Sort</span>' +
        each(['Age', 'Impact'], function (o) {
          return '<button class="' + cls('chip', { 'chip--on': s.sort === o }) + '"' + act('setSort', o) + '>' +
            esc(o) + '</button>';
        }) +
      '</div>' +

      when(selCount, function () {
        return '<div class="bulkbar">' +
          '<span class="f14 w500" style="color:var(--rmx-brand-pressed)">' + SA.plural(selCount, 'finding') + ' selected</span>' +
          '<button class="btn btn--primary btn--xs"' + act('bulkFix') + '>Fix Selected</button>' +
          '<button class="btn btn--secondary btn--xs"' + act('bulkDismiss') + '>Dismiss Selected</button>' +
          '<span class="spacer"></span>' +
          '<button class="linkbtn f13"' + act('clearSelection') + '>Clear</button>' +
        '</div>';
      }) +

      '<div class="tbl">' +
        '<div class="tbl__head g-findings">' +
          '<div>' + check(!!allOn, 'selectAll') + '</div>' +
          '<div>Record</div><div>Property</div><div>What&rsquo;s Wrong</div><div>Detected</div>' +
          '<div>Suggested Fix</div><div class="right">Actions</div>' +
        '</div>' +
        each(rows, function (r) {
          var key = a.id + ':' + r.rec;
          var isDismissed = !!s.dismissedRows[key];
          var isFixed = !!s.doneRows[key];
          var sel = !!s.selected[r.rec];
          var open_ = !!s.expanded[r.rec];
          return '<div class="' + cls('tbl__group', { 'finding--sel': sel, 'finding--dismissed': isDismissed }) + '">' +
            '<div class="tbl__row g-findings" style="border-bottom:none">' +
              '<div>' + check(sel, 'selectFinding', r.rec) + '</div>' +
              '<div class="row min0" style="gap:6px;cursor:pointer"' + act('expandFinding', r.rec) + '>' +
                icon(open_ ? 'keyboard_arrow_down' : 'chevron_right', 18, 'color:var(--rmx-text-muted)') +
                '<div class="min0"><div class="recname">' + esc(r.rec) + '</div>' +
                  '<div class="recsub">' + esc(r.resident) + '</div></div>' +
              '</div>' +
              '<div class="f13 ink2">' + esc(r.property) + '</div>' +
              '<div class="f13 ink2 row" style="gap:8px">' +
                when(isDismissed, function () {
                  return '<span class="badge badge--stop shrink0" style="padding:1px 7px;font-size:12px;gap:4px">' +
                    icon('block', 14) + 'Previously dismissed</span>';
                }) +
                '<span>' + esc(r.issue) + '</span>' +
              '</div>' +
              '<div class="f13 dim">' + esc(r.detected) + '</div>' +
              '<div class="f13 ink2">' + esc(isFixed ? 'Fixed today' : r.fix) + '</div>' +
              '<div class="acts">' +
                (isDismissed
                  ? '<button class="btn btn--neutral btn--compact"' + act('expandFinding', r.rec) + '>Reopen</button>'
                  : (isFixed
                    ? '<span class="badge badge--ok">Fixed</span>'
                    : '<button class="btn btn--secondary btn--compact"' + act('fixFinding', r.rec) + '>' + esc(r.act || 'Fix') + '</button>' +
                      '<button class="btn btn--iconbox btn--icon"' + act('taskFinding', r.rec) + ' title="Create task">' + icon('add_task', 16) + '</button>' +
                      '<button class="btn btn--iconbox btn--icon"' + act('snoozeFinding', r.rec) + ' title="Snooze">' + icon('schedule', 16) + '</button>' +
                      '<button class="btn btn--iconbox btn--icon"' + act('dismissFinding', r.rec) + ' title="Dismiss">' + icon('close', 16) + '</button>')) +
              '</div>' +
            '</div>' +
            when(open_, function () {
              return '<div class="expand"><div class="expand__card">' +
                '<div class="col" style="gap:14px">' +
                  '<div>' + SA.eyebrow('What was found', 'margin-bottom:4px') +
                    '<div class="expand__text">' + esc(r.found) + '</div></div>' +
                  '<div>' + SA.eyebrow('Why it matters', 'margin-bottom:4px') +
                    '<div class="expand__text">' + esc(r.matters) + '</div></div>' +
                  '<div>' + SA.eyebrow('Suggested fix', 'margin-bottom:4px') +
                    '<div class="expand__text">' + esc(r.fixDetail) + '</div></div>' +
                  when(isDismissed, function () {
                    return '<div class="note" style="background:#fff;font-size:14px">Dismissed: ' +
                      esc(s.dismissedRows[key]) + '</div>';
                  }) +
                '</div>' +
                '<div>' + SA.eyebrow('Records involved', 'margin-bottom:6px') +
                  '<div class="col" style="gap:6px">' + each(r.records, function (x) {
                    return '<a href="#" class="reclink"' + act('noop') + '>' + icon('description', 16) + esc(x) + '</a>';
                  }) + '</div>' +
                  SA.eyebrow('Detected by', 'margin:14px 0 6px') +
                  '<div class="row f13 ink2" style="gap:6px">' + orion(22, 'var(--rmx-brand-pressed)') +
                    esc(a.name) + ' &middot; Detection</div>' +
                '</div>' +
              '</div></div>';
            }) +
          '</div>';
        }) +
      '</div>' +
    '</div>';
  }

  /* ---------------- Runs tab ---------------- */
  function runsTab(a) {
    var s = SA.state;
    if (!s.enabled) {
      return '<div class="screen" style="padding:20px 24px 32px">' +
        '<div class="card empty empty--lock">' + icon('lock', 32, 'color:var(--rmx-warning)') +
          '<div class="empty__title empty__title--lg">Run views are locked</div>' +
          '<div class="empty__text" style="max-width:420px">Agents are disabled company-wide, so there is nothing to run and no new history to show. Existing history is preserved and returns when agents are enabled.</div>' +
          '<button class="btn btn--secondary" style="margin-top:16px"' + act('toggleKill') + '>Enable Agents</button>' +
        '</div></div>';
    }

    var isRule = a.mode === 'rule';
    var rows = SA.replayFor(a);
    var history = SA.runHistoryFor(a);
    var replayMeta = 'last 30 days · ' + rows.length + ' records evaluated · ' + a.name;

    var replayCard = '<div class="card" style="margin-bottom:20px">' +
      '<div class="card__head"><span class="grow">Replay</span>' +
        '<span class="f12 muted" style="font-weight:400">Runs the agent against historical records with all side effects suppressed.</span></div>' +
      (isRule
        ? '<div style="padding:24px" class="f14 dim">Replay is for agents. This automation runs a fixed rule, so its history below is the complete record of what it did.</div>'
        : (s.replay === 'idle'
          ? '<div class="empty">' + icon('history', 30, 'color:var(--rmx-brand)') +
              '<div class="empty__title">See what this agent would have decided</div>' +
              '<div class="empty__text">Replay evaluates real historical records and shows the decision, the reasoning, and the actions it rejected. Nothing is sent, posted, or changed.</div>' +
              '<button class="btn btn--primary" style="margin-top:16px"' + act('runReplay') + '>Run Against Last 30 Days</button>' +
            '</div>'
          : s.replay === 'running'
          ? '<div class="empty"><span class="spinner spinner--lg"></span>' +
              '<div class="f14" style="margin-top:12px">Replaying ' + esc(replayMeta) + '</div></div>'
          : '<div>' +
              '<div class="replayhead">' +
                '<span class="mono f13 ink2">' + esc(replayMeta) + '</span>' +
                okPill('No side effects — nothing was sent, posted, or changed.') +
                '<span class="spacer"></span>' +
                '<button class="btn btn--neutral btn--xs"' + act('resetReplay') + '>Clear</button>' +
              '</div>' +
              each(rows, function (r) {
                var open_ = !!s.rExpanded[r.recordId];
                return '<div class="tbl__group fade">' +
                  '<div class="tbl__row g-replay" style="border-bottom:none;cursor:pointer"' +
                    act('expandReplay', r.recordId) + '>' +
                    '<div><div class="f14 w500 navy">' + esc(r.subject) + '</div>' +
                      '<div class="recsub">' + esc(r.recordId) + '</div></div>' +
                    '<div class="row mono f13 ink2" style="gap:16px">' + each(r.facts, function (f) {
                      return '<span>' + esc(f) + '</span>';
                    }) + '</div>' +
                    '<div><span class="pill pill--decide ' + (TONE_PILL[r.tone] || 'badge--neutral') + '">' +
                      icon(r.icon, 15) + esc(r.decision) + '</span></div>' +
                    '<div class="right">' + icon(open_ ? 'keyboard_arrow_down' : 'chevron_right', 20, 'color:var(--rmx-text-muted)') + '</div>' +
                  '</div>' +
                  when(open_, function () {
                    return '<div style="padding:0 16px 18px" class="fade">' +
                      '<div class="expand__card expand__card--replay">' +
                        '<div class="col" style="gap:14px">' +
                          '<div><div class="rmx-eyebrow row" style="margin-bottom:4px;gap:6px">' +
                            orion(20, 'var(--rmx-brand-pressed)') + 'Why</div>' +
                            '<div class="expand__text">' + esc(r.why) + '</div></div>' +
                          '<div>' + SA.eyebrow('Considered', 'margin-bottom:6px') +
                            '<div class="col" style="gap:6px">' +
                              (r.considered.length ? each(r.considered, function (c) {
                                return '<div class="row f13 ink2" style="gap:8px;align-items:flex-start">' +
                                  icon('remove', 16, 'color:var(--rmx-text-muted);margin-top:1px') +
                                  '<span><span class="strike">' + esc(c.action) + '</span> &mdash; ' + esc(c.reason) + '</span></div>';
                              }) : '<div class="f13 dim">Nothing else was in scope for this record.</div>') +
                            '</div></div>' +
                        '</div>' +
                        '<div class="col" style="gap:14px">' +
                          '<div>' + SA.eyebrow('Data seen', 'margin-bottom:6px') +
                            '<div class="row" style="flex-wrap:wrap;gap:6px">' + each(r.dataSeen, function (d) {
                              return '<span class="datachip">' + esc(d) + '</span>';
                            }) + '</div></div>' +
                          '<div>' + SA.eyebrow('Audit', 'margin-bottom:4px') +
                            '<div class="mono f12 dim" style="line-height:18px">' + esc(r.audit) + '</div></div>' +
                        '</div>' +
                      '</div></div>';
                  }) +
                '</div>';
              }) +
            '</div>')) +
      '</div>';

    var historyCard = '<div class="tbl tbl--card">' +
      '<div class="card__head">Run history</div>' +
      '<div class="tbl__head g-runs">' +
        '<div>Started</div><div>Trigger</div><div>Records Seen</div><div>Actions Taken</div><div>Result</div>' +
      '</div>' +
      each(history, function (h) {
        return '<div class="tbl__row g-runs f13 ink2">' +
          '<div class="mono">' + esc(h.when) + '</div>' +
          '<div>' + esc(h.trigger) + '</div>' +
          '<div class="mono">' + esc(h.seen) + '</div>' +
          '<div class="mono">' + esc(h.actions) + '</div>' +
          '<div>' + SA.toneBadge(h.tone, h.result) + '</div>' +
        '</div>';
      }) +
    '</div>';

    return '<div class="screen" style="padding:20px 24px 32px">' + replayCard + historyCard + '</div>';
  }

  /* ---------------- screen ---------------- */
  SA.viewAgent = function () {
    var s = SA.state;
    var a = SA.current();
    if (!a) return SA.viewLibrary();

    var body;
    if (s.tab === 'findings') body = findingsTab(a);
    else if (s.tab === 'runs') body = runsTab(a);
    else if (a.mode === 'rule') body = SA.viewRuleEditor(a);
    else if (a.mode === 'quick') body = buildQuick(a);
    else body = buildCanvas(a);

    return '<div class="main" data-screen-label="Agent Detail">' +
      agentHead(a) + settingsDrawer(a) + body +
    '</div>';
  };

  SA.actions.saveRule = function () {
    SA.toast('Saved.', 'ok');
  };
})(window.SA = window.SA || {});
