/* ============================================================
   Smart Agents — app chrome: header, left nav, dialogs, toast
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, chg = SA.chg, fk = SA.fk,
      when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, orion = SA.orion, toggle = SA.toggle,
      radio = SA.radio;

  /* Rent Manager logo lockup — the official RMX artwork, exported from the
     RMX `Header` component as SVG (175 x 32, white-filled for the navy bar).
     Lives in assets/ rather than inlined here: it is 15 paths / 10KB. */
  var RM_LOGO =
    '<img class="hdr__logo" src="assets/logo-rentmanager.svg" ' +
    'width="175" height="32" alt="Rent Manager">';

  /* Orion mark — the official RMX artwork, taken from the `Orion Logo`
     component (`Type=Orion-Icon`) in RMX Iconography. Coordinates are rounded
     to 2dp on a 20-unit viewBox, which is visually lossless.
     The three sparkles and two arcs carry fixed brand fills (#6eb744 green,
     #008dd5 brand blue, #13314c navy), so this mark is deliberately NOT
     tintable — the `color` argument to SA.orion() has no effect on it. */
  SA.ORION_SYMBOL =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    '<symbol id="orion-mark" viewBox="0 0 20 20">' +
    '<path d="M 0.13 3.67 C -0.04 3.74 -0.04 3.98 0.13 4.06 C 1.72 4.69 2.98 5.97 3.61 7.59 C 3.68 7.77 3.93 7.77 3.99 7.59 C 4.62 5.97 5.88 4.69 7.48 4.06 C 7.65 3.98 7.65 3.74 7.48 3.67 C 5.88 3.03 4.62 1.75 3.99 0.13 C 3.93 -0.04 3.68 -0.04 3.61 0.13 C 2.98 1.75 1.72 3.03 0.13 3.67 Z" fill="#6eb744" transform="translate(4.61 7.76)"/>' +
    '<path d="M 0.17 4.8 C -0.06 4.89 -0.06 5.22 0.17 5.31 C 2.26 6.15 3.91 7.82 4.74 9.94 C 4.82 10.17 5.15 10.17 5.24 9.94 C 6.06 7.82 7.71 6.15 9.8 5.31 C 10.03 5.22 10.03 4.89 9.8 4.8 C 7.71 3.97 6.06 2.29 5.24 0.17 C 5.15 -0.06 4.82 -0.06 4.74 0.17 C 3.91 2.29 2.26 3.97 0.17 4.8 Z" fill="#008dd5" transform="translate(8.99 1)"/>' +
    '<path d="M 0.09 2.59 C -0.03 2.63 -0.03 2.81 0.09 2.86 C 1.22 3.31 2.1 4.21 2.55 5.35 C 2.6 5.48 2.77 5.48 2.82 5.35 C 3.26 4.21 4.15 3.31 5.27 2.86 C 5.39 2.81 5.39 2.63 5.27 2.59 C 4.15 2.14 3.26 1.23 2.82 0.09 C 2.77 -0.03 2.59 -0.03 2.55 0.09 C 2.1 1.23 1.22 2.13 0.09 2.59 Z" fill="#13314c" transform="translate(1.37 13.26)"/>' +
    '<path d="M 10.7 1.07 C 10.72 1.16 10.73 1.25 10.74 1.34 C 10.74 1.36 10.75 1.37 10.75 1.39 C 10.76 1.47 10.77 1.55 10.77 1.63 C 10.78 1.67 10.78 1.71 10.78 1.75 C 10.79 1.81 10.79 1.87 10.79 1.93 C 10.8 2.04 10.8 2.14 10.8 2.25 C 10.8 6.16 7.62 9.35 3.71 9.35 C 3.59 9.35 3.47 9.34 3.35 9.34 C 3.32 9.34 3.3 9.33 3.27 9.33 C 3.18 9.32 3.08 9.32 2.99 9.31 C 2.97 9.31 2.95 9.3 2.92 9.3 C 2.83 9.29 2.73 9.28 2.63 9.26 C 2.62 9.26 2.6 9.26 2.59 9.25 C 2.48 9.24 2.38 9.22 2.28 9.2 C 2.27 9.2 2.26 9.19 2.25 9.19 C 2.14 9.17 2.03 9.14 1.93 9.11 C 1.93 9.11 1.92 9.11 1.92 9.11 C 1.58 9.02 1.24 8.91 0.91 8.77 C 0.56 8.99 0.25 9.27 0 9.6 C 0.57 9.89 1.16 10.11 1.78 10.26 C 1.79 10.26 1.8 10.26 1.81 10.26 C 1.95 10.29 2.08 10.32 2.21 10.35 C 2.25 10.35 2.29 10.36 2.33 10.36 C 2.44 10.38 2.55 10.4 2.66 10.41 C 2.7 10.42 2.75 10.42 2.8 10.43 C 2.9 10.44 3.01 10.45 3.13 10.46 C 3.17 10.46 3.21 10.47 3.26 10.47 C 3.41 10.48 3.56 10.48 3.71 10.48 C 8.25 10.48 11.94 6.79 11.94 2.25 C 11.94 2.07 11.94 1.9 11.93 1.73 C 11.92 1.69 11.92 1.65 11.92 1.61 C 11.9 1.44 11.89 1.28 11.87 1.12 C 11.87 1.12 11.87 1.11 11.86 1.1 C 11.84 0.92 11.81 0.74 11.77 0.57 C 11.77 0.55 11.76 0.54 11.76 0.53 C 11.72 0.36 11.68 0.19 11.63 0.02 C 11.63 0.01 11.63 0 11.63 0 C 11.29 0.32 10.98 0.68 10.7 1.07 L 10.7 1.07 Z" fill="#13314c" transform="translate(5.56 8.52)"/>' +
    '<path d="M 10.48 0.31 C 10.48 0.31 10.47 0.31 10.47 0.31 C 10.3 0.26 10.13 0.22 9.95 0.18 C 9.94 0.18 9.93 0.18 9.91 0.18 C 9.74 0.14 9.56 0.11 9.39 0.08 C 9.38 0.08 9.37 0.08 9.36 0.08 C 9.2 0.06 9.04 0.04 8.88 0.03 C 8.84 0.03 8.8 0.02 8.76 0.02 C 8.58 0.01 8.41 0 8.24 0 C 3.7 0 0 3.69 0 8.23 C 0 8.39 0 8.54 0.01 8.69 C 0.01 8.74 0.02 8.78 0.02 8.82 C 0.03 8.93 0.04 9.04 0.05 9.15 C 0.06 9.2 0.06 9.24 0.07 9.29 C 0.09 9.4 0.1 9.51 0.12 9.62 C 0.13 9.66 0.13 9.69 0.14 9.73 C 0.16 9.86 0.19 10 0.22 10.13 C 0.22 10.14 0.23 10.15 0.23 10.16 C 0.38 10.78 0.6 11.38 0.89 11.95 C 1.22 11.69 1.5 11.38 1.71 11.02 C 1.71 11.02 1.71 11.02 1.71 11.02 C 1.67 10.91 1.62 10.81 1.58 10.7 C 1.58 10.7 1.58 10.7 1.58 10.69 C 1.54 10.58 1.5 10.47 1.47 10.36 C 1.44 10.25 1.4 10.14 1.37 10.03 C 1.37 10.02 1.37 10.02 1.37 10.02 C 1.34 9.91 1.32 9.8 1.3 9.69 C 1.3 9.69 1.29 9.68 1.29 9.67 C 1.27 9.57 1.25 9.46 1.24 9.36 C 1.23 9.34 1.23 9.33 1.23 9.31 C 1.21 9.22 1.2 9.12 1.19 9.02 C 1.19 9 1.18 8.98 1.18 8.96 C 1.17 8.86 1.17 8.77 1.16 8.67 C 1.16 8.65 1.16 8.62 1.15 8.6 C 1.15 8.48 1.15 8.36 1.15 8.24 C 1.15 4.33 4.33 1.14 8.24 1.14 C 8.35 1.14 8.45 1.15 8.56 1.15 C 8.62 1.15 8.69 1.16 8.75 1.16 C 8.79 1.17 8.83 1.17 8.86 1.17 C 8.95 1.18 9.03 1.19 9.12 1.2 C 9.13 1.2 9.14 1.2 9.15 1.21 C 9.25 1.22 9.34 1.23 9.43 1.25 C 9.81 0.97 10.17 0.66 10.49 0.32 L 10.48 0.31 Z" fill="#008dd5" transform="translate(1.03 2.53)"/>' +
    '</symbol></svg>';

  /* ---------------- header ----------------
     Mirrors the RMX `Header` component (RMX Components), which is natively
     1920x48 and groups its contents as Leading Content / Command Launch /
     Manage. The Agents kill switch is NOT part of that component — it is
     specific to Smart Agents, and sits in the gap between Command Launch and
     the Manage cluster, matching where it is placed in the Figma file. */
  SA.viewHeader = function () {
    var s = SA.state;
    return '<div class="hdr">' +
      /* Leading Content — the logo goes home to the workspace */
      '<div class="hdr__brand"' + act('goWorkspace') + ' title="My Workspace">' + RM_LOGO + '</div>' +
      /* Command Launch */
      '<div class="hdr__center"><div class="hdr__ctxbar">' +
        '<button class="' + cls('hdr__ctxbtn', { 'hdr__ctxbtn--on': s.dialog === 'menu' }) + '"' +
          act('openMenu') + ' title="Main menu">' + icon('menu') + '</button>' +
        '<button class="hdr__ctxbtn"' + act('noop') + ' title="Reports">' + icon('description') + '</button>' +
        '<button class="hdr__ctxbtn"' + act('noop') + ' title="Manage Favorites">' + icon('grade') + '</button>' +
        '<div class="hdr__search">' + icon('search') + '<span class="hdr__search-ph">Command Launch</span></div>' +
      '</div></div>' +
      /* Smart Agents addition */
      '<button class="' + cls('kill', s.enabled ? 'kill--on' : 'kill--off') + '"' + act('toggleKill') +
        ' title="Global agent kill switch">' +
        '<span>Agents:</span>' +
        '<span class="kill__state">' + (s.enabled ? 'On' : 'Off') + '</span>' +
        '<span class="' + cls('toggle', 'toggle--sm', { 'toggle--on': s.enabled }) + '" style="' +
          (s.enabled ? '' : 'background:rgba(255,255,255,0.35)') + '"><span class="toggle__knob"></span></span>' +
      '</button>' +
      /* Manage */
      '<div class="hdr__manage">' +
        '<div class="hdr__code"><div>Company Code</div><div>lcs-bateam</div></div>' +
        '<span class="hdr__bellwrap"' + act('noop') + ' title="2 notifications">' +
          icon('notifications', 20, null, 'hdr__bell') +
          '<span class="hdr__bellbadge">2</span>' +
        '</span>' +
        '<div class="hdr__avatar">AF</div>' +
      '</div>' +
    '</div>';
  };

  /* ---------------- Agents / Agent Findings switcher ----------------
     A real RMX Tabs row (see .tab in app.css) spanning the top of the
     screen, not a bespoke left rail. Notifications and Schedules are
     deliberately absent: Smart Agents now lives under Administration >
     Automation alongside them, so the prototype scopes this to Agents and
     Agent Findings only. The rule editors in screen-rules.js are still
     implemented and become reachable again if these two entries are
     restored. */
  SA.viewNavTabs = function () {
    var s = SA.state;
    var agentsOn = s.screen !== 'inbox' && s.kindFilter === 'Agents';
    var findingsOn = s.screen === 'inbox';

    return '<div class="navtabs">' +
      '<div class="tabs">' +
        '<button class="' + cls('tab', { 'tab--on': agentsOn }) + '"' + act('setKind', 'Agents') + '>' +
          'Agents<span class="tab__count">' + esc(SA.countKind('Agents')) + '</span>' +
        '</button>' +
        '<button class="' + cls('tab', { 'tab--on': findingsOn }) + '"' + act('goInbox') + '>' +
          'Agent Findings<span class="tab__badge">' + esc(SA.openFindings()) + '</span>' +
        '</button>' +
      '</div>' +
      '<span class="spacer"></span>' +
      '<span class="navtabs__status">' +
        '<span class="' + cls('statusdot', { 'statusdot--off': !s.enabled }) + '"></span>' +
        'Agents are ' + (s.enabled ? 'running' : 'disabled company-wide') + '.' +
      '</span>' +
    '</div>';
  };

  /* ---------------- bright blue context bar ----------------
     Every Rent Manager page under a module carries this strip directly below
     the header. It also supplies the back affordance that breadcrumbs used to,
     since Rent Manager does not use breadcrumbs. */
  SA.viewContextBar = function () {
    var s = SA.state, label = "Smart Agents", back = null;
    /* Administration carries a white title bar instead of the blue strip. */
    if (s.screen === "admin") return "";
    if (s.screen === "workspace") {
      return '<div class="ctxbar">' +
        '<span>My Workspace</span><span class="spacer"></span>' +
        '<span>My Dashboard &nbsp;&rarr;</span>' +
      '</div>';
    }
    if (s.screen === "templates") { label = "Smart Agents: New Agent"; back = "goLibrary"; }
    else if (s.screen === "quick") {
      var tpl = null;
      SA.templates.forEach(function (t) { if (t.id === s.quickFor) tpl = t; });
      label = "Smart Agents: " + (tpl ? tpl.name : "New Agent"); back = "goLibrary";
    }
    else if (s.screen === "agent") {
      var a = SA.current();
      label = "Smart Agents: " + (a ? a.name : ""); back = "goLibrary";
    }
    else if (s.screen === "inbox") { label = "Smart Agents: Agent Findings"; back = "goLibrary"; }
    return '<div class="ctxbar"' + (back ? act(back) : "") + '>' +
      '<span class="ctxbar__back">‹</span>' +
      '<span>' + esc(label) + '</span>' +
    '</div>';
  };
  /* A form the person completes, used where the agent is not permitted to act. */
  /* A Rent Manager form: sections, labels above 34px controls, required
     asterisks, and real inputs bound to state so it can actually be filled in. */
  SA.formBlock = function (form, rec) {
    function field(f) {
      var fkey = SA.formKey(rec, f.key);
      var val = SA.formVal(rec, f);

      if (f.kind === 'check') {
        return '<label class="rmfield rmfield--full rmfield--check"' +
          act('toggleFormCheck', fkey, f.on ? 'on' : 'off') + '>' +
          SA.checkStatic(!!val) +
          '<span class="f13 ink2">' + esc(f.label) + '</span></label>';
      }

      var ctl;
      if (f.kind === 'select') {
        ctl = SA.selectField(f.options || [f.value], val, 'setFormField', fkey, undefined,
          { disabled: f.ro });
      } else if (f.kind === 'textarea') {
        ctl = '<textarea class="field field--full rmfield__area" rows="2"' + fk(fkey) +
          chg('setFormField', fkey) + (f.ro ? ' readonly' : '') + '>' + esc(val) + '</textarea>';
      } else {
        ctl = '<input class="field field--full"' + fk(fkey) + chg('setFormField', fkey) +
          (f.ro ? ' readonly' : '') +
          (f.kind === 'date' ? ' placeholder="mm/dd/yyyy"' : '') +
          ' value="' + esc(val) + '">';
      }

      return '<div class="' + cls('rmfield', { 'rmfield--full': f.w === 'full', 'rmfield--ro': f.ro }) + '">' +
        '<label class="rmfield__label">' +
          (f.req ? '<span class="rmfield__req">*</span> ' : '') + esc(f.label) + '</label>' +
        ctl +
        when(f.help, function () { return '<div class="rmfield__help">' + esc(f.help) + '</div>'; }) +
      '</div>';
    }

    return each(form.sections, function (sec) {
      return '<div class="rmsec">' +
        '<div class="rmsec__head">' + esc(sec.label) + '</div>' +
        '<div class="rmform">' + each(sec.fields, field) + '</div>' +
      '</div>';
    });
  };

  /* ---------------- dialogs ---------------- */
  function pickTypeRows() {
    var cfg = SA.pickTypeConfig[SA.state.kindFilter];
    if (!cfg) return [];
    var key = cfg.groupKey;
    return SA.agents.filter(function (a) { return !!a[key]; }).map(function (a) {
      return {
        key: a.key, name: a.name, group: a[key],
        meta: a.setups === 0 || a.setups === undefined
          ? (a.enabled ? 'Configured' : 'Not configured')
          : SA.plural(a.setups, 'setup')
      };
    });
  }

  SA.viewDialogs = function () {
    var s = SA.state;
    if (!s.dialog) return '';

    if (s.dialog === 'pickType') {
      var cfg = SA.pickTypeConfig[s.kindFilter] || { title: 'New', help: '' };
      return '<div class="overlay"' + act('closeDialog') + '>' +
        '<div class="dlg dlg--wide" data-stop>' +
          '<div class="dlg__head"><h2 class="f18">' + esc(cfg.title) + '</h2>' +
            '<div class="f13 dim" style="margin-top:4px">' + esc(cfg.help) + '</div></div>' +
          '<div class="dlg__scroll">' + each(pickTypeRows(), function (p) {
            return '<div class="pickrow g-picker"' + act('pickType', p.key) + '>' +
              '<div class="f14 brand">' + esc(p.name) + '</div>' +
              '<div class="f12 muted">' + esc(p.group) + '</div>' +
              '<div class="f12 dim right">' + esc(p.meta) + '</div>' +
            '</div>';
          }) + '</div>' +
          '<div class="dlg__foot"><button class="btn btn--secondary"' + act('closeDialog') + '>Cancel</button></div>' +
        '</div></div>';
    }

    if (s.dialog === 'findingAction') {
      var f = SA.findingByKey(s.actionTarget);
      if (!f) return '';
      var r = f.row, ag = f.agent, frm = r.form;
      /* Every finding resolves through a form. The agent's reasoning is real
         and stays available, but it sits under the form as a disclosure -
         this is a Rent Manager form, not an agent step. */
      return '<div class="overlay"' + act('closeDialog') + '>' +
        '<div class="dlg dlg--form" data-stop>' +
          '<div class="dlg__head">' +
            '<div class="row" style="gap:10px">' +
              '<h2 class="f18 navy w500 grow">' + esc(frm ? frm.title : r.act) + '</h2>' +
              '<span class="muted" style="cursor:pointer"' + act('closeDialog') + '>&#10005;</span>' +
            '</div>' +
            '<div class="f13 dim" style="margin-top:4px">' +
              esc(r.rec) + ' &middot; ' + esc(r.resident) + ' &middot; ' + esc(r.property) + '</div>' +
          '</div>' +
          '<div class="dlg__body dlg__body--form">' +
            when(frm && frm.note, function () {
              return '<div class="rmnote">' + orion(18) + '<span>' + esc(frm.note) + '</span></div>';
            }) +
            (frm ? SA.formBlock(frm, r.rec) :
              '<div class="rmsec"><div class="rmsec__head">Action</div>' +
                '<div class="f14 w500 navy" style="margin-bottom:6px">' + esc(r.fix) + '</div>' +
                '<div class="whybody__v">' + esc(r.fixDetail) + '</div></div>') +
            '<button class="whytoggle"' + act('toggleWhy') + '>' +
              icon(s.whyOpen ? 'keyboard_arrow_down' : 'chevron_right', 18) +
              'Why Orion suggested this' + '</button>' +
            when(s.whyOpen, function () {
              return '<div class="whybody">' +
                '<div><div class="whybody__k">What was found</div>' +
                  '<div class="whybody__v">' + esc(r.found) + '</div></div>' +
                '<div><div class="whybody__k">Why it matters</div>' +
                  '<div class="whybody__v">' + esc(r.matters) + '</div></div>' +
                '<div class="row f12 dim" style="gap:7px">' + orion(18) +
                  'Found by ' + esc(ag ? ag.name : '') +
                  (ag ? ' &middot; ' + esc(ag.trigger) : '') +
                  ' &middot; impact ' + esc(r.impact) + '</div>' +
              '</div>';
            }) +
          '</div>' +
          '<div class="dlg__foot">' +
            '<button class="btn btn--secondary"' + act('closeDialog') + '>Cancel</button>' +
            '<span class="spacer"></span>' +
            '<button class="btn btn--secondary"' + act('openImpacted') + '>Open ' + esc(r.rec) + '</button>' +
            '<button class="btn btn--primary"' + act('completeAction') + '>' +
              esc(frm ? frm.submit : 'Complete Action') + '</button>' +
          '</div>' +
        '</div></div>';
    }
    if (s.dialog === 'promote') {
      return '<div class="overlay"' + act('closeDialog') + '>' +
        '<div class="dlg" data-stop>' +
          '<div class="dlg__head row"><h2 class="f18 grow">Open in Builder</h2></div>' +
          '<div class="dlg__body">' +
            '<div class="dlg__warn">' + icon('warning') +
              '<div style="font-size:14px;line-height:20px">Promotion is one-way. Once this agent opens in the builder it becomes an agent workflow and cannot return to the quick view.</div></div>' +
            '<div style="font-size:14px;line-height:20px" class="ink2">Nothing about the agent changes &mdash; same trigger, same action, same engine. You get branching, multiple steps, and per-node guardrails.</div>' +
          '</div>' +
          '<div class="dlg__foot">' +
            '<button class="btn btn--secondary"' + act('closeDialog') + '>Cancel</button>' +
            '<button class="btn btn--primary"' + act('confirmPromote') + '>Promote to Builder</button>' +
          '</div>' +
        '</div></div>';
    }

    if (s.dialog === 'dismiss') {
      var subject = s.dismissTarget === '__bulk__'
        ? SA.plural(Object.keys(s.selected).filter(function (k) { return s.selected[k]; }).length, 'finding') +
          ' will be dismissed together.'
        : 'Dismiss the finding on ' + s.dismissTarget + '.';
      var ready = !!s.dismissReason;
      return '<div class="overlay"' + act('closeDialog') + '>' +
        '<div class="dlg" data-stop>' +
          '<div class="dlg__head"><h2 class="f18">Dismiss Finding</h2></div>' +
          '<div class="dlg__body">' +
            '<div style="font-size:14px;line-height:20px" class="ink2">' + esc(subject) + '</div>' +
            '<div><div class="f14" style="margin-bottom:4px"><span style="color:var(--rmx-error)">*</span> Reason</div>' +
              '<div class="col" style="gap:8px">' + each(SA.dismissReasons, function (r) {
                return '<label class="' + cls('reason', { 'reason--on': s.dismissReason === r }) + '"' +
                  act('setDismissReason', r) + '>' + radio(s.dismissReason === r) + esc(r) + '</label>';
              }) + '</div></div>' +
            '<div class="f12 dim">Dismissals are remembered. This agent will not raise this finding again.</div>' +
          '</div>' +
          '<div class="dlg__foot">' +
            '<button class="btn btn--secondary"' + act('closeDialog') + '>Cancel</button>' +
            '<button class="' + cls('btn', ready ? 'btn--primary' : 'btn--disabled') + '"' +
              (ready ? act('confirmDismiss') : '') + '>Dismiss Finding</button>' +
          '</div>' +
        '</div></div>';
    }
    return '';
  };

  /* ---------------- main menu ----------------
     Not the full mega menu — enough to reach Administration, matching the
     prototype. Anchored under the header rather than centred. */
  /* The live menu is a panel 1320px wide sitting just under the header: a row
     of destinations across the top, the module rail down the left, the selected
     module's links in underlined column groups, and a footer carrying the
     setup/report entries and the build number. Only Administration and
     Workspace navigate — those are the destinations this prototype needs. */
  SA.viewMenu = function () {
    var s = SA.state;
    if (s.dialog !== 'menu') return '';
    var mod = s.menuModule || SA.menuModules[0];
    var groups = SA.menuGroups[mod] || [];
    var footer = SA.menuFooter[mod] || [];

    var top = each(SA.menuTop, function (m) {
      var on = (m.label === 'Administration' && s.screen === 'admin') ||
               (m.label === 'Workspace' && s.screen === 'workspace');
      return '<button class="' + cls('menutop', { 'menutop--on': on }) + '"' +
        act(m.action || 'noop') + '>' + icon(m.icon, 20) + esc(m.label) + '</button>';
    });

    var rail = each(SA.menuModules, function (m) {
      var on = m === mod;
      return '<button class="' + cls('menumod', { 'menumod--on': on }) + '"' +
        act('setMenuModule', m) + '>' +
        /* One continuous shape (rect + ribbon tail), not a background
           color plus a separately-positioned triangle -- see the
           .menumod__shape rule in app.css for why. Items here sit inset
           212px within a 224px rail, so the shape reaches 26px past its
           own width to meet the real divider. */
        when(on, SA.railRibbon(212, 26)) +
        '<span class="menumod__label">' + esc(m) + '</span>' +
      '</button>';
    });

    var cols = each(groups, function (g) {
      return '<div class="menucol">' +
        '<div class="menucol__head">' + esc(g.name) + '</div>' +
        each(g.links, function (l) {
          return '<a href="#" class="menulink"' + act('noop') + '>' + esc(l) + '</a>';
        }) +
      '</div>';
    });

    return '<div class="menuscrim"' + act('closeDialog') + '></div>' +
      '<div class="menupanel">' +
        '<div class="menupanel__top">' +
          '<div class="menupanel__brand">' +
            icon('menu-logo', 40, null, 'menupanel__logo') +
            '<span class="menupanel__word">Menu</span>' +
          '</div>' +
          '<div class="menupanel__nav">' + top + '</div>' +
        '</div>' +
        '<button class="menupanel__x"' + act('closeDialog') + '>' + icon('close', 32) + '</button>' +
        '<div class="menupanel__body">' +
          '<div class="menurail">' + rail + '</div>' +
          '<div class="menucontent">' +
            '<div class="menucols">' + cols + '</div>' +
            '<div class="menufoot">' +
              each(footer, function (f, i) {
                return '<button class="menufoot__btn"' + act('noop') + '>' +
                  icon(i === 0 ? 'settings' : 'reports', 20) + esc(f) + '</button>';
              }) +
              '<span class="spacer"></span>' +
              '<span class="menufoot__ver">Version ' + esc(SA.rmVersion) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  };

  /* ---------------- toast ---------------- */
  /* RMX Toast has exactly three states — Action (default), Success, Failure
     — no "warning"/amber state. This app's toast(msg, kind) call sites pass
     'ok' / 'warn' / 'info'; mapped onto the real states below. Icon glyph
     is inherited-color (`currentColor`), so the modifier class alone
     decides both surface and icon tint — see .toast--* in app.css.
     check_circle_filled / error_filled are the real RMX glyphs the
     component uses (surfaces.md) and are already in this app's sprite
     (js/icons-sprite.js has both, confirmed via ICON_CORE_IDS) — an
     earlier pass here mistakenly assumed they weren't harvested and used
     the plain check/error glyphs instead. Corrected. */
  var TOAST_STATE = { ok: 'success', warn: 'failure', info: 'action' };
  var TOAST_ICON = { success: 'check_circle_filled', failure: 'error_filled', action: 'check_circle_filled' };

  SA.viewToast = function () {
    var s = SA.state;
    if (!s.toast) return '';
    var state = TOAST_STATE[s.toastKind] || 'action';
    return '<div class="toast toast--' + state + '">' +
      icon(TOAST_ICON[state], 32) +
      '<span>' + esc(s.toast) + '</span></div>';
  };
})(window.SA = window.SA || {});
