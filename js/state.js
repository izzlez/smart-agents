/* ============================================================
   Smart Agents — state and actions
   `state` starts from the design's own initial state object,
   extended with the fields the rule/notification/AR editors and
   the canvas need (those lived in the truncated script tail).
   ============================================================ */
(function (SA) {
  'use strict';

  /* Editor props declared on the design's <script data-dc-script data-props>. */
  SA.props = {
    flowAnimation: true,          // boolean, Orion section
    density: 'Comfortable'        // enum: Comfortable | Compact, Tables section
  };

  var state = SA.state = {
    /* ---- from the design's initial state ---- */
    screen: 'workspace', enabled: true, filter: 'All', kindFilter: 'Agents', nav: 'agents',
    agentKey: null, tab: 'build', node: 'detection', settingsOpen: false,
    quickFor: null,
    when: null, whenText: '', then: null, optionsOpen: false,
    test: 'idle', dd: null,
    detectionText: null, sens: 'Balanced', sched: 'Nightly',
    scope: { Lease: true, Ledger: true, Charges: true, Units: true, Contacts: false, AP: false, 'Work Orders': false },
    approval: true,
    expanded: {}, selected: {}, sort: 'Age',
    replay: 'idle', rExpanded: {},
    dialog: null, dismissTarget: null, dismissReason: null, actionTarget: null,
    formVals: {}, whyOpen: false, picks: {}, checks: {},
    menuModule: 'Rental Info', graphs: {}, wsHidden: {},
    toast: null, toastKind: 'info',

    /* ---- navigation ---- */
    navOpen: { Notifications: false, Schedules: false },
    navGroup: null,
    adminCat: 'Preferences',  // active Administration category — matches the real page's
                              // default scroll position (top); the rail highlight should
                              // never disagree with where the page actually is.
                              // active notifGroup / schedType filter
    schedTypeFilter: 'All',

    /* ---- quick agent ---- */
    detId: null,
    detParams: {},
    conds: [],
    actionCfg: {},

    /* ---- canvas ---- */
    selNode: null,

    /* ---- approval tiers (credit agent) ---- */
    tiers: [
      { from: '0.00', to: '250.00', approvers: [], auto: true, rule: 'Any' },
      { from: '250.01', to: '2500.00', approvers: ['Property Manager'], auto: false, rule: 'Any' },
      { from: '2500.01', to: '', approvers: ['Controller', 'Regional Manager'], auto: false, rule: 'All' }
    ],
    tierAddMode: 'Role',
    tierAddValue: 'Property Manager',

    /* ---- node inspector: trigger ---- */
    trigKind: 'Schedule', trigEvent: 'A lease is signed', trigFreq: 'Daily',
    trigWeekday: 'Monday', trigMonthday: '1', trigHour: '2', trigMinute: '00', trigMeridiem: 'AM',

    /* ---- node inspector: action ---- */
    actionMode: 'Role', actionPrincipal: 'Property Manager',
    approverMode: 'Role', approver: 'Property Manager',
    apvTimeout: '3 days',
    backupMode: 'Role', backup: 'Regional Manager',

    /* ---- schedule editor ---- */
    ruleName: '', active: true,
    scFreq: 'Monthly', scRunDay: '1', scPostDay: '1',
    scStart: '01/01/2026', scEnd: '', noEnd: true,
    scCap: 'Adjust', scMemo: '',
    includes: {}, bills: {},
    schedRecips: null, schedAddMode: 'Role', schedAddValue: 'Property Manager',
    perChargeDetail: false, oversight: true,
    preview: 'idle',

    /* ---- notification editor ---- */
    aud: 'tenant', notifDelay: '0', channel: 'Email',
    contacts: {}, msgTab: 'email', bodyMode: 'Plain text',
    notifSubject: null, notifBody: null, smsBody: null,
    notifPreview: 'idle',

    /* ---- AR editor ---- */
    arSteps: null, arBasis: 'Oldest charge', arOpen: {}
  };

  /* ------------------------------------------------------------
     Lookups
     ------------------------------------------------------------ */
  SA.byKey = function (key) {
    for (var i = 0; i < SA.agents.length; i++) if (SA.agents[i].key === key) return SA.agents[i];
    return null;
  };
  SA.byId = function (id) {
    for (var i = 0; i < SA.agents.length; i++) if (SA.agents[i].id === id) return SA.agents[i];
    return null;
  };
  SA.detById = function (id) {
    for (var i = 0; i < SA.detLibrary.length; i++) if (SA.detLibrary[i].id === id) return SA.detLibrary[i];
    return null;
  };
  SA.current = function () { return state.agentKey ? SA.byKey(state.agentKey) : null; };

  /* Detection attached to an agent, via the design's agentDetId map. */
  SA.agentDetection = function (agent) {
    if (!agent) return null;
    return SA.detById(SA.agentDetId[agent.id]) || null;
  };

  /* Params for a detection: user overrides on top of the library defaults. */
  SA.detectionParams = function (det) {
    if (!det) return {};
    var out = {};
    Object.keys(det.params || {}).forEach(function (k) { out[k] = det.params[k]; });
    var over = state.detParams[det.id] || {};
    Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    return out;
  };

  /* The "What this detection checks" list, with values substituted in. */
  SA.checklistFor = function (det) {
    if (!det) return [];
    var p = SA.detectionParams(det);
    var out = (det.checks || []).map(function (c) { return SA.fill(c, p); });
    if (det.any && det.any.length) {
      out.push('Any one of: ' + det.any.map(function (a) { return SA.fill(a, p); }).join('; '));
    }
    return out;
  };

  /* key is "<agentId>:<record>" — the id used by doneRows and the dialog. */
  SA.findingByKey = function (key) {
    if (!key) return null;
    var p = String(key).split(':');
    var list = SA.findings[p[0]] || [];
    var row = list.filter(function (r) { return r.rec === p[1]; })[0];
    return row ? { row: row, agent: SA.byId(p[0]), key: key } : null;
  };

  SA.findingsFor = function (agent) {
    if (!agent) return [];
    return SA.findings[agent.id] || [];
  };
  SA.runHistoryFor = function (agent) {
    if (!agent) return SA.runHistory.generic;
    return SA.runHistory[agent.id] || SA.runHistory.generic;
  };
  SA.replayFor = function (agent) {
    if (!agent) return SA.replayRows.generic;
    return SA.replayRows[agent.id] || SA.replayRows.generic;
  };

  /* Rows visible in the library, honouring nav + filters. */
  SA.visibleRows = function () {
    var kf = state.kindFilter;
    return SA.agents.filter(function (a) {
      if (kf === 'Agents') {
        if (a.kind !== 'Agent') return false;
        return state.filter === 'All' || a.type === state.filter;
      }
      if (kf === 'Notifications') {
        if (a.type !== 'Notification' || !a.notifGroup) return false;
        return !state.navGroup || a.notifGroup === state.navGroup;
      }
      if (kf === 'Schedules') {
        if (a.type !== 'Schedule') return false;
        if (state.navGroup && a.schedType !== state.navGroup) return false;
        return state.schedTypeFilter === 'All' || a.schedType === state.schedTypeFilter;
      }
      return true;
    });
  };

  SA.notifGroups = function () {
    var seen = [], out = [];
    SA.agents.forEach(function (a) {
      if (a.notifGroup && seen.indexOf(a.notifGroup) === -1) { seen.push(a.notifGroup); out.push(a.notifGroup); }
    });
    return out;
  };
  SA.schedTypes = function () {
    var seen = [];
    SA.agents.forEach(function (a) { if (a.schedType && seen.indexOf(a.schedType) === -1) seen.push(a.schedType); });
    return seen;
  };
  SA.countKind = function (kind) {
    return SA.agents.filter(function (a) {
      if (kind === 'Agents') return a.kind === 'Agent';
      if (kind === 'Notifications') return a.type === 'Notification' && !!a.notifGroup;
      if (kind === 'Schedules') return a.type === 'Schedule';
      return false;
    }).length;
  };
  SA.openFindings = function () {
    var n = 0;
    SA.agents.forEach(function (a) {
      var list = SA.findings[a.id];
      if (!list) return;
      list.forEach(function (r) {
        var k = a.id + ':' + r.rec;
        if (!state.dismissedRows) state.dismissedRows = {};
        if (!state.dismissedRows[k] && !state.doneRows[k]) n++;
      });
    });
    return n;
  };
  state.dismissedRows = {};
  state.doneRows = {};

  /* Rule-editor family for an automation. */
  SA.ruleKind = function (agent) {
    if (!agent) return null;
    if (agent.type === 'Schedule') return agent.schedType === 'AR' ? 'ar' : 'schedule';
    if (agent.type === 'Notification') return 'notif';
    return null;
  };

  /* ------------------------------------------------------------
     Actions — every data-act / data-chg name the views emit
     ------------------------------------------------------------ */
  var A = SA.actions = {};

  function toast(msg, kind) {
    state.toast = msg;
    state.toastKind = kind || 'info';
    if (SA._toastTimer) clearTimeout(SA._toastTimer);
    SA._toastTimer = setTimeout(function () { state.toast = null; SA.render(); }, 3200);
  }
  SA.toast = toast;

  /* ---- global chrome ---- */
  A.toggleKill = function () {
    state.enabled = !state.enabled;
    toast(state.enabled ? 'Agents enabled company-wide.' : 'Agents disabled company-wide. Existing findings are preserved.',
      state.enabled ? 'ok' : 'warn');
  };
  A.noop = function () {};
  A.closeDialog = function () { state.dialog = null; state.dismissTarget = null; state.dismissReason = null; };

  /* ---- navigation ---- */
  A.goWorkspace = function () { state.screen = 'workspace'; state.dialog = null; };
  A.goAdmin = function () { state.screen = 'admin'; state.dialog = null; };
  /* The rail is a jump-nav into one long scroll, not a filter -- every
     category already renders. Clicking just marks it current and scrolls
     its section into view (see main.js render(), which reads this flag
     once the new content exists in the DOM). */
  A.setAdminCat = function (c) { state.adminCat = c; state.screen = 'admin'; state._scrollToAdminCat = c; };
  /* Administration > Automation > Smart Agents */
  A.goAgents = function () {
    state.screen = 'library'; state.kindFilter = 'Agents';
    state.filter = 'All'; state.navGroup = null; state.agentKey = null; state.dialog = null;
  };
  A.openMenu = function () { state.dialog = 'menu'; };
  A.hideWsTile = function (key) { state.wsHidden[key] = true; };
  A.restoreWsTile = function (key) { delete state.wsHidden[key]; };
  A.goLibrary = function () { state.screen = 'library'; state.agentKey = null; };
  A.goInbox = function () { state.screen = 'inbox'; state.nav = 'inbox'; };
  A.setKind = function (kind) {
    state.kindFilter = kind;
    state.nav = kind.toLowerCase();
    state.navGroup = null;
    state.filter = 'All';
    state.schedTypeFilter = 'All';
    state.screen = 'library';
    state.agentKey = null;
  };
  A.toggleNav = function (kind) { state.navOpen[kind] = !state.navOpen[kind]; };
  A.setNavGroup = function (group, kind) {
    state.kindFilter = kind;
    state.nav = kind.toLowerCase();
    state.navGroup = group;
    state.screen = 'library';
    state.agentKey = null;
  };
  A.setFilter = function (v) { state.filter = v; };
  A.setSchedType = function (v) { state.schedTypeFilter = v; };

  /* ---- library rows ---- */
  A.openAgent = function (key) {
    var a = SA.byKey(key);
    if (!a) return;
    state.agentKey = key;
    state.screen = 'agent';
    state.tab = 'build';
    state.settingsOpen = false;
    state.selNode = null;
    state.replay = 'idle';
    state.rExpanded = {};
    state.expanded = {};
    state.selected = {};
    state.preview = 'idle';
    state.notifPreview = 'idle';
    /* Seed the rule editors from the row that was opened. */
    state.ruleName = a.name;
    state.active = a.enabled;
    state.arSteps = null;
    state.schedRecips = null;
    state.notifSubject = null;
    state.notifBody = null;
    state.smsBody = null;
    state.includes = {};
    state.bills = {};
    state.contacts = {};
    var det = SA.agentDetection(a);
    state.detId = det ? det.id : null;
  };
  A.toggleAgent = function (key) {
    var a = SA.byKey(key);
    if (!a) return;
    a.enabled = !a.enabled;
    if (state.agentKey === key) state.active = a.enabled;
    toast(a.name + (a.enabled ? ' enabled.' : ' disabled. Existing findings are preserved.'), a.enabled ? 'ok' : 'warn');
  };

  /* ---- new agent / templates ---- */
  A.newAgent = function () {
    if (state.kindFilter === 'Agents') { state.screen = 'templates'; return; }
    state.dialog = 'pickType';
  };
  A.blankAgent = function () {
    state.screen = 'quick';
    state.quickFor = null;
    state.when = null; state.whenText = ''; state.then = null;
    state.detId = null; state.conds = []; state.test = 'idle';
    state.optionsOpen = false; state.actionCfg = {};
  };
  A.useTemplate = function (id) {
    var t = null;
    SA.templates.forEach(function (x) { if (x.id === id) t = x; });
    if (!t) return;
    if (t.mode === 'builder' && t.opens) {
      var existing = SA.byId(t.opens);
      if (existing) { A.openAgent(existing.key); toast('Opened ' + t.name + ' in the builder.', 'info'); return; }
      /* Template points at a builder agent that does not exist yet. */
      state.screen = 'quick';
      state.quickFor = t.id;
      state.when = 'detection';
      state.detId = t.det;
      state.then = 'task';
      state.test = 'idle';
      toast(t.name + ' has no canvas yet — starting from its detection.', 'info');
      return;
    }
    state.screen = 'quick';
    state.quickFor = t.id;
    state.when = 'detection';
    state.detId = t.det;
    state.then = t.then && /notify/i.test(t.then) ? 'notify' : (/flag/i.test(t.then || '') ? 'flag' : 'task');
    state.conds = [];
    state.test = 'idle';
    state.optionsOpen = false;
    state.actionCfg = {};
  };
  A.pickType = function (key) {
    var a = SA.byKey(key);
    if (!a) return;
    state.dialog = null;
    A.openAgent(key);
    toast('Set up ' + a.name + '.', 'info');
  };

  /* ---- quick agent ---- */
  A.openWhenDd = function () { state.dd = state.dd === 'when' ? null : 'when'; };
  A.openThenDd = function () { state.dd = state.dd === 'then' ? null : 'then'; };
  A.pickWhen = function (id) {
    state.dd = null;
    if (id === 'detection') { state.when = 'detection'; state.detId = null; return; }
    state.when = id;
    var opt = null;
    SA.whenOptions.forEach(function (o) { if (o.id === id) opt = o; });
    state.whenText = opt ? opt.label : '';
  };
  A.pickThen = function (id) {
    state.dd = null;
    state.then = id;
    state.actionCfg = {};
  };
  A.clearWhen = function () { state.when = null; state.detId = null; state.test = 'idle'; };
  A.setDet = function (_a, _b, ev) {
    state.detId = ev.target.value || null;
    state.test = 'idle';
  };
  A.setDetParam = function (detId, param, ev) {
    if (!state.detParams[detId]) state.detParams[detId] = {};
    state.detParams[detId][param] = ev.target.value;
    state.test = 'idle';
  };
  A.addCond = function () {
    state.conds.push({ field: SA.condFieldOptions[0], op: SA.condOpOptions[0], val: '' });
  };
  A.removeCond = function (i) { state.conds.splice(Number(i), 1); };
  A.setCond = function (i, key, ev) { state.conds[Number(i)][key] = ev.target.value; };
  A.toggleOptions = function () { state.optionsOpen = !state.optionsOpen; };
  A.setSens = function (v) { state.sens = v; };
  A.setSched = function (v) { state.sched = v; };
  A.runTest = function () {
    state.test = 'running';
    setTimeout(function () { state.test = 'done'; SA.render(); }, 1100);
  };
  A.setCfg = function (field, _b, ev) { state.actionCfg[field] = ev.target.value; };
  A.setActionMode = function (v) { state.actionMode = v; state.actionPrincipal = v === 'Role' ? SA.principalOptions[0] : SA.peopleOptions[0]; };
  A.setActionPrincipal = function (_a, _b, ev) { state.actionPrincipal = ev.target.value; };
  A.insertToken = function (token) {
    var key = state.then === 'task' ? 'desc' : (state.then === 'flag' || state.then === 'escape' ? 'note' : (state.then === 'finding' ? 'summary' : 'body'));
    state.actionCfg[key] = (state.actionCfg[key] || '') + token;
  };
  A.saveAgent = function () {
    toast('Agent saved. It runs ' + state.sched.toLowerCase() + ' at ' + state.sens.toLowerCase() + ' sensitivity.', 'ok');
    state.screen = 'library';
  };
  A.openPromote = function () { state.dialog = 'promote'; };
  A.confirmPromote = function () {
    state.dialog = null;
    toast('Promoted to the builder. This agent is now an agent workflow.', 'ok');
  };
  A.openQuickEditor = function () {
    var a = SA.current();
    state.screen = 'quick';
    state.quickFor = a ? a.key : null;
    state.when = 'detection';
    var det = SA.agentDetection(a);
    state.detId = det ? det.id : null;
    state.then = 'task';
  };

  /* ---- agent detail ---- */
  A.setTab = function (t) { state.tab = t; };
  A.toggleSettings = function () { state.settingsOpen = !state.settingsOpen; };
  A.selectNode = function (id) { state.selNode = id; };
  /* ---- node palette ----
     A new node lands as a sibling in the level below the selected node, so a
     branch fans out sideways rather than stretching the flow taller. The
     hand-off always stays the last level. */
  function levelOf(g, id) {
    for (var i = 0; i < g.cols.length; i++) {
      for (var j = 0; j < g.cols[i].length; j++) {
        if (g.cols[i][j].id === id) return i;
      }
    }
    return -1;
  }
  function isHandoffLevel(level) {
    return !!level && level.length > 0 && level.every(function (n) { return n.kind === 'Hand Off'; });
  }
  A.addNode = function (label) {
    var a = SA.current();
    if (!a) return;
    if (!state.enabled) { toast('Agents are disabled company-wide. Re-enable them to edit the canvas.', 'warn'); return; }
    var g = SA.workGraph(a.id);
    if (!g) { toast('This agent has no canvas.', 'info'); return; }
    var spec = SA.paletteNode[label];
    if (!spec) return;

    var sel = state.selNode;
    var li = sel ? levelOf(g, sel) : -1;
    if (li < 0) {
      /* nothing selected: attach under the last level that is not the hand-off */
      li = g.cols.length - 1;
      while (li > 0 && isHandoffLevel(g.cols[li])) li--;
      sel = g.cols[li] && g.cols[li].length ? g.cols[li][g.cols[li].length - 1].id : null;
    }

    var id = spec.kind.toLowerCase().replace(/[^a-z]/g, '') + '-' + (++SA.nodeSeq);
    var node = {
      id: id, kind: spec.kind, title: spec.title, sub: spec.sub,
      orion: !!spec.orion, added: true
    };

    var target = li + 1;
    if (target >= g.cols.length || isHandoffLevel(g.cols[target])) g.cols.splice(target, 0, [node]);
    else g.cols[target].push(node);
    if (sel) g.edges.push([sel, id]);

    state.selNode = id;
    toast(spec.kind + ' added. Set it up in the inspector.', 'ok');
  };
  A.removeNode = function (id) {
    var a = SA.current();
    if (!a) return;
    var g = SA.workGraph(a.id);
    if (!g) return;
    var found = null;
    g.cols.forEach(function (level) {
      level.forEach(function (n) { if (n.id === id) found = n; });
    });
    if (!found) return;
    if (!found.added) { toast('Only nodes you added can be removed.', 'warn'); return; }
    g.cols = g.cols.map(function (level) {
      return level.filter(function (n) { return n.id !== id; });
    }).filter(function (level) { return level.length > 0; });
    g.edges = g.edges.filter(function (e) { return e[0] !== id && e[1] !== id; });
    state.selNode = null;
    toast(found.kind + ' removed.', 'info');
  };
  A.resetCanvas = function () {
    var a = SA.current();
    if (!a) return;
    delete state.graphs[a.id];
    state.selNode = null;
    toast('Canvas reset to the saved version.', 'info');
  };
  A.toggleScope = function (k) { state.scope[k] = !state.scope[k]; };
  A.toggleApproval = function () {
    if (SA.approvalLocked()) return;
    state.approval = !state.approval;
  };
  A.setTrigKind = function (v) { state.trigKind = v; };
  A.setTrigFreq = function (v) { state.trigFreq = v; };
  A.setTrigMeridiem = function (v) { state.trigMeridiem = v; };
  A.setField = function (key, _b, ev) { state[key] = ev.target.value; };
  A.setApproverMode = function (v) { state.approverMode = v; state.approver = v === 'Role' ? SA.principalOptions[0] : SA.peopleOptions[0]; };
  A.setBackupMode = function (v) { state.backupMode = v; state.backup = v === 'Role' ? SA.principalOptions[1] : SA.peopleOptions[0]; };

  /* approval tiers */
  A.setTierAddMode = function (v) { state.tierAddMode = v; state.tierAddValue = v === 'Role' ? SA.principalOptions[0] : SA.peopleOptions[0]; };
  A.addTier = function () {
    state.tiers.push({ from: '', to: '', approvers: [], auto: false, rule: 'Any' });
  };
  A.removeTier = function (i) { state.tiers.splice(Number(i), 1); };
  A.setTierField = function (i, key, ev) { state.tiers[Number(i)][key] = ev.target.value; };
  A.addApprover = function (i) {
    var t = state.tiers[Number(i)];
    if (t.approvers.indexOf(state.tierAddValue) === -1) t.approvers.push(state.tierAddValue);
    t.auto = false;
  };
  A.removeApprover = function (i, name) {
    var t = state.tiers[Number(i)];
    t.approvers = t.approvers.filter(function (x) { return x !== name; });
    if (!t.approvers.length) t.auto = true;
  };
  A.setTierRule = function (i, rule) { state.tiers[Number(i)].rule = rule; };

  /* ---- schedule editor ---- */
  A.toggleActive = function () {
    state.active = !state.active;
    var a = SA.current();
    if (a) a.enabled = state.active;
  };
  A.setRuleName = function (_a, _b, ev) {
    state.ruleName = ev.target.value;
    var a = SA.current();
    if (a) a.name = ev.target.value;
  };
  A.toggleNoEnd = function () { state.noEnd = !state.noEnd; };
  A.toggleInclude = function (id) {
    var cur = SA.includeState(id);
    state.includes[id] = !cur;
  };
  A.toggleBill = function (id) { state.bills[id] = !SA.billState(id); };
  A.togglePerCharge = function () { state.perChargeDetail = !state.perChargeDetail; };
  A.toggleOversight = function () { state.oversight = !state.oversight; };
  A.setSchedAddMode = function (v) {
    state.schedAddMode = v;
    state.schedAddValue = v === 'Role' ? SA.schedAddOptions[0] : (v === 'User' ? SA.peopleOptions[0] : '');
  };
  A.addSchedRecip = function () {
    if (!state.schedAddValue) { toast('Enter an address or pick a recipient first.', 'warn'); return; }
    SA.schedRecipList().push({
      kind: state.schedAddMode.toLowerCase(),
      value: state.schedAddValue,
      icon: state.schedAddMode === 'Role' ? 'badge' : (state.schedAddMode === 'User' ? 'person' : 'mail'),
      kindLabel: state.schedAddMode
    });
    if (state.schedAddMode === 'Email') state.schedAddValue = '';
  };
  A.removeSchedRecip = function (i) { SA.schedRecipList().splice(Number(i), 1); };
  A.runPreview = function () {
    state.preview = 'running';
    setTimeout(function () { state.preview = 'done'; SA.render(); }, 1300);
  };
  A.clearPreview = function () { state.preview = 'idle'; };
  A.openOversightFindings = function () {
    var m = SA.byId('movein');
    if (m) { A.openAgent(m.key); state.tab = 'findings'; }
  };

  /* ---- notification editor ---- */
  A.setAud = function (v) { state.aud = v; };
  A.setChannel = function (v) {
    state.channel = v;
    if (v === 'Text') state.msgTab = 'sms';
    if (v === 'Email') state.msgTab = 'email';
  };
  A.setMsgTab = function (v) { state.msgTab = v; };
  A.setBodyMode = function (v) { state.bodyMode = v; };
  A.toggleContact = function (id) { state.contacts[id] = !SA.contactState(id); };
  A.insertNotifToken = function (token) {
    if (state.msgTab === 'sms') state.smsBody = SA.smsText() + token;
    else state.notifBody = SA.bodyText() + token;
  };
  A.runNotifPreview = function () {
    state.notifPreview = 'running';
    setTimeout(function () { state.notifPreview = 'done'; SA.render(); }, 900);
  };
  A.clearNotifPreview = function () { state.notifPreview = 'idle'; };
  A.openResidentData = function () {
    var r = SA.byId('residentdata');
    if (r) { A.openAgent(r.key); state.tab = 'findings'; }
  };

  /* ---- AR editor ---- */
  A.setArBasis = function (v) { state.arBasis = v; };
  A.toggleArStep = function (i) { state.arOpen[i] = !state.arOpen[i]; };
  A.toggleArActive = function (i) {
    var s = SA.arStepList()[Number(i)];
    s.on = !s.on;
  };
  A.setArField = function (i, key, ev) { SA.arStepList()[Number(i)][key] = ev.target.value; };
  A.setArContacts = function (i, v) { SA.arStepList()[Number(i)].contacts = v; };
  A.setArMsg = function (i, v) { SA.arStepList()[Number(i)].msg = v; };
  A.arAddStep = function () {
    var list = SA.arStepList();
    var last = list[list.length - 1];
    list.push({
      label: 'New step', day: String(Number(last ? last.day : 0) + 10),
      balOp: '> Greater than', balAmt: '50.00', charges: 'RC — Recurring charges',
      contacts: 'primary', msg: 'Email', tmpl: 'AR — late notice', on: true,
      note: 'Describe what this step is for so the next person understands why it exists.'
    });
    state.arOpen[list.length - 1] = true;
  };

  /* ---- findings tab ---- */
  A.setSort = function (v) { state.sort = v; };
  A.expandFinding = function (rec) { state.expanded[rec] = !state.expanded[rec]; };
  A.selectFinding = function (rec) { state.selected[rec] = !state.selected[rec]; };
  A.selectAll = function () {
    var rows = SA.sortedFindings();
    var all = rows.length && rows.every(function (r) { return state.selected[r.rec]; });
    rows.forEach(function (r) { state.selected[r.rec] = !all; });
  };
  A.clearSelection = function () { state.selected = {}; };
  A.bulkFix = function () {
    var n = Object.keys(state.selected).filter(function (k) { return state.selected[k]; }).length;
    state.selected = {};
    toast(SA.plural(n, 'finding') + ' sent to the fix queue.', 'ok');
  };
  A.bulkDismiss = function () {
    state.dismissTarget = '__bulk__';
    state.dialog = 'dismiss';
  };
  A.fixFinding = function (rec) {
    var a = SA.current();
    state.dialog = 'findingAction';
    state.actionTarget = (a ? a.id : '') + ':' + rec;
    state.formVals = {};
  };
  A.taskFinding = function (rec) { toast('Task created for ' + rec + '.', 'ok'); };
  A.snoozeFinding = function (rec) { toast(rec + ' snoozed for 7 days.', 'info'); };
  A.dismissFinding = function (rec) { state.dismissTarget = rec; state.dialog = 'dismiss'; };
  A.setDismissReason = function (r) { state.dismissReason = r; };
  A.confirmDismiss = function () {
    if (!state.dismissReason) return;
    var a = SA.current();
    var target = state.dismissTarget;
    if (target === '__bulk__') {
      var keys = Object.keys(state.selected).filter(function (k) { return state.selected[k]; });
      keys.forEach(function (k) { if (a) state.dismissedRows[a.id + ':' + k] = state.dismissReason; });
      state.selected = {};
      toast(SA.plural(keys.length, 'finding') + ' dismissed. They will not be raised again.', 'info');
    } else {
      if (a) state.dismissedRows[a.id + ':' + target] = state.dismissReason;
      toast(target + ' dismissed. It will not be raised again.', 'info');
    }
    state.dialog = null;
    state.dismissTarget = null;
    state.dismissReason = null;
  };

  /* ---- runs tab ---- */
  A.runReplay = function () {
    state.replay = 'running';
    setTimeout(function () { state.replay = 'done'; SA.render(); }, 1500);
  };
  A.resetReplay = function () { state.replay = 'idle'; state.rExpanded = {}; };
  A.expandReplay = function (id) { state.rExpanded[id] = !state.rExpanded[id]; };

  /* ---- inbox ---- */
  A.setInboxView = function (v) { state.inboxView = v; };
  A.toggleTodo = function (key) { state.doneRows[key] = !state.doneRows[key]; };
  /* An action never fires straight from the row — it opens a dialog so the
     person can either complete it or jump to the impacted account first. */
  A.inboxAction = function (key) {
    state.dialog = 'findingAction';
    state.actionTarget = key;
    state.formVals = {};
  };
  A.completeAction = function () {
    var key = state.actionTarget;
    if (key) state.doneRows[key] = true;
    state.dialog = null; state.actionTarget = null;
    toast('Done — ' + String(key).split(':')[1] + ' closed.', 'ok');
  };
  A.setFormField = function (fkey, _b, ev) { state.formVals[fkey] = ev.target.value; };
  /* Generic bindings so any control in any agent editor is really editable. */
  A.setPick = function (key, _b, ev) { state.picks[key] = ev.target.value; };
  A.setMenuModule = function (m) { state.menuModule = m; };
  A.togglePick = function (key, def) {
    var cur = state.checks[key];
    state.checks[key] = !(cur === undefined ? def === 'on' : cur);
  };
  A.toggleFormCheck = function (fkey, def) {
    var cur = state.formVals[fkey];
    state.formVals[fkey] = !(cur === undefined ? def === 'on' : cur);
  };
  A.toggleWhy = function () { state.whyOpen = !state.whyOpen; };
  A.openImpacted = function () {
    var key = String(state.actionTarget || '');
    toast('Would open ' + key.split(':')[1] + ' — the record view sits outside this prototype.', 'info');
  };
  A.inboxSnooze = function (key) { toast(key.split(':')[1] + ' snoozed for 7 days.', 'info'); };
  A.openAgentById = function (id) {
    var a = SA.byId(id);
    if (a) A.openAgent(a.key);
  };
  state.inboxView = 'todo';

  /* ------------------------------------------------------------
     Derived values the editors need in more than one view
     ------------------------------------------------------------ */
  SA.approvalLocked = function () {
    /* The design locks "requires approval" on money-moving actions. */
    var a = SA.current();
    if (!a) return false;
    return a.id === 'credit' || a.id === 'bill';
  };
  SA.includeState = function (id) {
    var d = null;
    SA.scheduleIncludes.forEach(function (x) { if (x.id === id) d = x; });
    return state.includes[id] === undefined ? (d ? d.on : false) : state.includes[id];
  };
  SA.billState = function (id) {
    var d = null;
    SA.scheduleBilling.forEach(function (x) { if (x.id === id) d = x; });
    return state.bills[id] === undefined ? (d ? d.on : false) : state.bills[id];
  };
  SA.contactState = function (id) {
    var d = null;
    SA.notifContactOptions.forEach(function (x) { if (x.id === id) d = x; });
    return state.contacts[id] === undefined ? (d ? d.on : false) : state.contacts[id];
  };
  SA.schedRecipList = function () {
    if (!state.schedRecips) {
      state.schedRecips = SA.schedRecipients.map(function (r) { return Object.assign({}, r); });
    }
    return state.schedRecips;
  };
  SA.arStepList = function () {
    if (!state.arSteps) {
      var a = SA.current();
      var n = (a && a.arSteps) || 4;
      state.arSteps = SA.arStepTemplates.slice(0, n).map(function (s) {
        return Object.assign({}, s, { on: true });
      });
    }
    return state.arSteps;
  };
  SA.subjectText = function () {
    return state.notifSubject === null ? SA.notifDefaults.subject : state.notifSubject;
  };
  SA.bodyText = function () {
    return state.notifBody === null ? SA.notifDefaults.body : state.notifBody;
  };
  SA.smsText = function () {
    return state.smsBody === null ? SA.notifDefaults.sms : state.smsBody;
  };

  /* Findings for the current agent, filtered and sorted. */
  SA.sortedFindings = function () {
    var a = SA.current();
    var rows = SA.findingsFor(a).slice();
    if (state.sort === 'Age') {
      rows.sort(function (x, y) { return parseInt(y.age, 10) - parseInt(x.age, 10); });
    } else {
      rows.sort(function (x, y) {
        return parseFloat(String(y.impact).replace(/[^0-9.]/g, '') || 0) -
               parseFloat(String(x.impact).replace(/[^0-9.]/g, '') || 0);
      });
    }
    return rows;
  };
})(window.SA = window.SA || {});
