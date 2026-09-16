/* ============================================================
   Smart Agents — rule-mode editors
   Three shapes, chosen by the automation's own type:
     schedule  — recurring run (post / bill / draft / send)
     ar        — dunning sequence of steps
     notif     — one notification with per-audience setups
   ============================================================ */
(function (SA) {
  'use strict';
  var esc = SA.esc, act = SA.act, chg = SA.chg, fk = SA.fk,
      when = SA.when, each = SA.each, cls = SA.cls,
      icon = SA.icon, orion = SA.orion, toggle = SA.toggle,
      check = SA.check, radio = SA.radio, options = SA.options,
      checkline = SA.checkline, spinner = SA.spinner, okPill = SA.okPill;

  /* ---------------- shared bits ---------------- */
  function nameCard(a, eyebrowText, lines) {
    var s = SA.state;
    return '<div class="card card--focus">' +
      '<div class="card__head card__head--tint">' +
        '<input class="field grow" style="height:36px;background:#fff;font-size:16px;font-weight:500;color:var(--rmx-brand-dark);padding:0 10px"' +
          fk('rulename') + chg('setRuleName') + ' value="' + esc(s.ruleName || a.name) + '">' +
        '<label class="row f14 ink" style="gap:8px;cursor:pointer"' + act('toggleActive') + '>' +
          toggle(s.active) + 'Active</label>' +
      '</div>' +
      '<div class="card__body">' +
        SA.eyebrow(eyebrowText, 'margin-bottom:8px') +
        '<div class="col" style="gap:7px">' + each(lines, function (l) { return checkline(l); }) + '</div>' +
        '<div class="f12 muted" style="margin-top:10px">This restatement updates as you change the settings below. It is what the run will actually do.</div>' +
      '</div>' +
    '</div>';
  }

  function oversightCard(agentName, body, lockLabel, toggleable) {
    var s = SA.state;
    return '<div class="card">' +
      '<div class="card__head" style="font-weight:400">' + orion(22) +
        '<span class="grow f14 w500 navy">Agent oversight</span>' +
        toggle(s.oversight, toggleable ? 'toggleOversight' : null, null, toggleable ? {} : { locked: true }) +
      '</div>' +
      '<div class="col" style="padding:16px;gap:12px">' +
        '<div class="f13 ink2" style="line-height:19px">' + body + '</div>' +
        '<div class="row" style="flex-wrap:wrap;gap:8px;margin-top:12px">' +
          '<span class="lockchip">' + icon('lock') + esc(lockLabel) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function recentRuns(a, title) {
    return '<div class="card">' +
      '<div class="card__head">' + esc(title) + '</div>' +
      '<div style="padding:4px 0">' + each(SA.runHistoryFor(a), function (h) {
        return '<div class="runrow">' +
          '<span class="mono ink2 grow">' + esc(h.when) + '</span>' +
          '<span class="dim">' + esc(h.actions) + '</span>' +
          SA.toneBadge(h.tone, h.result) +
        '</div>';
      }) + '</div>' +
    '</div>';
  }

  /* ---------------- schedule editor ---------------- */
  function scheduleEditor(a) {
    var s = SA.state;
    var isRecurring = a.schedType === 'Recurring Charges';
    var scopeCount = isRecurring ? '412 leases' : '3 properties';
    var samePostDay = s.scRunDay === s.scPostDay;

    var lines = [
      'Runs ' + s.scFreq.toLowerCase() + ' with the scheduled Rent Manager run.',
      a.action + '.',
      'Dates each charge day ' + s.scPostDay + ' of the month.',
      'Applies to all properties (3) → ' + scopeCount + ' in scope today.'
    ];
    if (isRecurring && SA.includeState('inc-prorate')) lines.push('Prorates first and last months at the daily rate.');
    lines.push('Sends the run summary to ' + SA.schedRecipList().map(function (r) { return r.value; }).join(' and ') + '.');
    if (s.noEnd) lines.push('Runs from ' + s.scStart + ' until someone turns it off.');

    var left =
      nameCard(a, 'What this schedule does', lines) +

      '<div class="card">' +
        '<div class="card__head">When it runs</div>' +
        '<div class="card__body">' +
          '<div class="phrase">' +
            '<span>Run</span>' +
            '<select class="field field--num" style="width:150px"' + chg('setField', 'scFreq') + '>' +
              options(['Monthly', 'Semi-monthly', 'Weekly', 'Daily'], s.scFreq) + '</select>' +
          '</div>' +
          '<div class="fhelp" style="margin-top:4px">Runs with Rent Manager&rsquo;s scheduled run. ' +
            'The cadence is yours; the day and time are not.</div>' +

          '<div class="phrase" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--rmx-line-soft)">' +
            '<span>Date each charge</span>' +
            '<select class="field field--num" style="width:74px"' + chg('setField', 'scPostDay') + '>' +
              options(['1', '2', '3', 'Last'], s.scPostDay) + '</select>' +
            '<span>of the month.</span>' +
          '</div>' +
          '<div class="f12" style="margin-top:4px;color:' +
            (samePostDay ? 'var(--rmx-text)' : '#a85e0e') + '">' +
            esc(samePostDay
              ? 'The charge date matches the run date, so residents see the charge on the day it posts.'
              : 'The run happens on day ' + s.scRunDay + ' but each charge is dated day ' + s.scPostDay +
                '. Residents will see a charge dated before or after it actually posted.') +
          '</div>' +

          '<div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--rmx-line-soft)">' +
            SA.eyebrow('Active dates', 'margin-bottom:8px') +
            '<div class="row" style="align-items:flex-end;gap:16px;flex-wrap:wrap">' +
              '<div><div class="f13 dim" style="margin-bottom:4px">Start date</div>' +
                '<input class="field" style="width:150px"' + fk('scstart') + chg('setField', 'scStart') +
                  ' value="' + esc(s.scStart) + '"></div>' +
              '<div><div class="f13 dim" style="margin-bottom:4px">End date</div>' +
                '<input class="field" style="width:150px"' + fk('scend') + chg('setField', 'scEnd') +
                  ' placeholder="' + (s.noEnd ? 'No end date' : 'mm/dd/yyyy') + '" value="' + esc(s.scEnd) + '"' +
                  (s.noEnd ? ' disabled' : '') + '></div>' +
              '<label class="row f14 ink" style="gap:8px;height:34px;cursor:pointer"' + act('toggleNoEnd') + '>' +
                '<span class="' + cls('check', { 'check--on': s.noEnd }) + '">' + (s.noEnd ? '&#10003;' : '') + '</span>' +
                'Runs until someone turns it off</label>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">What it applies to</div>' +
        '<div class="card__body row" style="gap:12px;flex-wrap:wrap">' +
          '<span class="scopechip">All properties (3)</span>' +
          '<span class="scopechip">' + esc(isRecurring ? 'Residential' : 'All') + ' group</span>' +
          '<span class="f14 dim">&rarr; ' + esc(scopeCount) + ' in scope today</span>' +
          '<span class="spacer"></span>' +
          '<button class="btn btn--secondary btn--sm"' + act('noop') + '>Change Scope</button>' +
        '</div>' +
      '</div>' +

      when(isRecurring, function () {
        return '<div class="card">' +
            '<div class="card__head">What else posts in this run</div>' +
            '<div style="padding:6px 18px 14px">' + each(SA.scheduleIncludes, function (o) {
              var on = SA.includeState(o.id);
              return '<label class="togglerow"' + act('toggleInclude', o.id) + '>' + toggle(on) +
                '<span class="grow"><span class="togglerow__label">' + esc(o.label) + '</span>' +
                '<span class="togglerow__help">' + esc(o.help) + '</span></span></label>';
            }) + '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card__head">How it bills</div>' +
            '<div style="padding:6px 18px 16px">' + each(SA.scheduleBilling, function (o) {
              var on = SA.billState(o.id);
              return '<label class="togglerow"' + act('toggleBill', o.id) + '>' + toggle(on) +
                '<span class="grow"><span class="togglerow__label">' + esc(o.label) + '</span>' +
                '<span class="togglerow__help">' + esc(o.help) + '</span></span></label>';
            }) +
              '<div style="display:grid;grid-template-columns:230px minmax(0,1fr);gap:16px;margin-top:16px">' +
                '<div><div class="f13 dim" style="margin-bottom:4px">If a CRE setup cap is exceeded</div>' +
                  '<select class="field field--full"' + chg('setField', 'scCap') + '>' +
                    options(['Adjust', 'Post anyway', 'Skip and flag'], s.scCap) + '</select></div>' +
                '<div><div class="f13 dim" style="margin-bottom:4px">Memo on every rent charge</div>' +
                  '<input class="field field--full"' + fk('scmemo') + chg('setField', 'scMemo') +
                    ' placeholder="Optional — appears on the resident ledger" value="' + esc(s.scMemo) + '"></div>' +
              '</div>' +
            '</div>' +
          '</div>';
      }) +

      '<div class="card">' +
        '<div class="card__head">Who hears about the run</div>' +
        '<div class="card__body">' +
          '<div class="f13 dim" style="margin-bottom:4px">Send the run summary to</div>' +
          '<div class="col" style="gap:8px">' + each(SA.schedRecipList(), function (r, i) {
            return '<div class="reciprow">' + icon(r.icon, 18, 'color:var(--rmx-text)') +
              '<span class="f14 ink grow">' + esc(r.value) + '</span>' +
              '<span class="f12 muted">' + esc(r.kindLabel) + '</span>' +
              '<button class="btn btn--iconbox btn--icon-sm"' + act('removeSchedRecip', i) + ' title="Remove">' +
                icon('close', 16) + '</button></div>';
          }) + '</div>' +
          '<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">' +
            SA.seg(['Role', 'User', 'Email'], s.schedAddMode, 'setSchedAddMode') +
            (s.schedAddMode === 'Email'
              ? '<input class="field grow" style="min-width:220px"' + fk('schedadd') + chg('setField', 'schedAddValue') +
                ' placeholder="name@company.com" value="' + esc(s.schedAddValue) + '">'
              : '<select class="field grow" style="min-width:220px"' + chg('setField', 'schedAddValue') + '>' +
                options(s.schedAddMode === 'Role' ? SA.schedAddOptions : SA.peopleOptions, s.schedAddValue) + '</select>') +
            '<button class="btn btn--secondary"' + act('addSchedRecip') + '>Add Recipient</button>' +
          '</div>' +
          '<div class="fhelp fhelp--muted">Roles resolve per property when the run finishes. Users and typed addresses are fixed.</div>' +
          '<label class="togglerow" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--rmx-line-soft);border-bottom:none"' +
            act('togglePerCharge') + '>' + toggle(s.perChargeDetail) +
            '<span class="grow"><span class="togglerow__label">Include per-charge detail</span>' +
            '<span class="togglerow__help">Attaches every charge posted, not just the totals.</span></span></label>' +
        '</div>' +
      '</div>';

    var previewSummary = '412 evaluated · 409 will post · 2 skipped · 1 not billed';
    var right =
      '<div class="card">' +
        '<div class="card__head">Next run</div>' +
        '<div class="card__body">' +
          '<div class="f20 w500 navy">Next scheduled run</div>' +
          '<div class="f13 dim" style="margin-top:2px">' + esc(scopeCount) + ' in scope</div>' +
          (s.preview === 'idle'
            ? '<div><button class="btn btn--primary btn--full" style="margin-top:14px"' + act('runPreview') + '>Preview This Run</button>' +
              '<div class="fhelp">See exactly what would post, and what would be skipped, before it happens. Nothing is posted, sent, or changed.</div></div>'
            : s.preview === 'running'
            ? '<div style="margin-top:14px">' + spinner('Evaluating 412 leases…') + '</div>'
            : '<div style="margin-top:14px">' + okPill('Preview only — nothing posted') +
              '<div class="mono f12 ink2" style="margin-top:10px">' + esc(previewSummary) + '</div>' +
              '<button class="btn btn--neutral btn--full btn--xs" style="margin-top:12px"' + act('clearPreview') + '>Clear Preview</button></div>') +
        '</div>' +
      '</div>' +
      oversightCard(a.name,
        'After every run, <strong style="font-weight:500">Move-In Charge Integrity</strong> checks the leases this schedule should have billed and did not, and writes findings for a person to fix.',
        'Agent cannot post or adjust — locked', true) +
      recentRuns(a, 'Recent runs');

    var previewTable = when(s.preview === 'done', function () {
      return '<div class="card" style="margin-top:20px">' +
        '<div class="card__head" style="font-weight:400">' +
          '<span class="f14 w500 navy">Preview of the Sep 1 run</span>' +
          '<span class="mono f12 dim">' + esc(previewSummary) + '</span>' +
          '<span class="spacer"></span>' + okPill('No side effects') +
        '</div>' +
        '<div class="tbl__head g-schedprev">' +
          '<div>Record</div><div>Resident</div><div>Charge</div><div>Amount</div><div>Date</div>' +
          '<div class="right">Outcome</div>' +
        '</div>' +
        each(SA.schedPreviewRows, function (r) {
          return '<div class="tbl__group fade">' +
            '<div class="tbl__row g-schedprev f13 ink2" style="border-bottom:none">' +
              '<div class="brand">' + esc(r.rec) + '</div>' +
              '<div>' + esc(r.who) + '</div>' +
              '<div>' + esc(r.charge) + '</div>' +
              '<div class="mono">' + esc(r.amount) + '</div>' +
              '<div>' + esc(r.date) + '</div>' +
              '<div class="right">' + SA.toneBadge(r.tone, r.status) + '</div>' +
            '</div>' +
            when(r.reason, function () {
              return '<div style="padding:0 16px 12px" class="f12 dim">' + esc(r.reason) + '</div>';
            }) +
          '</div>';
        }) +
      '</div>';
    });

    return '<div class="rulewrap">' +
      '<div class="rulegrid"><div class="rulecol">' + left + '</div><div class="rulecol">' + right + '</div></div>' +
      previewTable +
    '</div>';
  }

  /* ---------------- AR sequence editor ---------------- */
  function arEditor(a) {
    var s = SA.state;
    var steps = SA.arStepList();
    var on = steps.filter(function (x) { return x.on; });

    var summary = [
      'Counts every step from the ' + s.arBasis.toLowerCase() + '.',
      SA.plural(on.length, 'step') + ' of ' + steps.length + ' are active, from day ' +
        (on[0] ? on[0].day : '—') + ' to day ' + (on.length ? on[on.length - 1].day : '—') + '.',
      'A step only fires if the balance is still over its own threshold that day.',
      'Delinquency Follow-Up holds a step when it is already contacting the resident.'
    ];

    var left =
      nameCard(a, 'What this sequence does', summary) +

      '<div class="card">' +
        '<div class="card__head">Count each step from<span class="spacer"></span>' +
          SA.seg(['Oldest charge', 'Statement date'], s.arBasis, 'setArBasis', { btnCls: 'seg__btn--xs' }) +
        '</div>' +
        '<div style="padding:12px 18px" class="f12 dim">' +
          esc(s.arBasis === 'Oldest charge'
            ? 'Day 1 is the due date of the oldest unpaid charge, so a resident who partially pays does not restart the clock.'
            : 'Day 1 is the statement date, so every resident on the property moves through the sequence together.') +
        '</div>' +
      '</div>' +

      '<div>' +
        '<div class="row" style="align-items:baseline;gap:12px;padding-bottom:10px">' +
          '<span class="f16 w500 navy">The sequence</span>' +
          '<span class="f12 dim">Each step fires only if the balance is still over its threshold.</span>' +
        '</div>' +
        '<div class="col" style="gap:0">' + each(steps, function (t, i) {
          var open_ = !!s.arOpen[i];
          var contactLabel = '';
          SA.arContactOptions.forEach(function (c) { if (c.id === t.contacts) contactLabel = c.label; });
          var restate = 'Day ' + t.day + ' after the oldest charge is due, if the balance is ' +
            t.balOp.replace(/^[^A-Za-z]+/, '').toLowerCase() + ' $' + t.balAmt + '.';
          return '<div class="arstep">' +
            '<div class="arstep__rail">' +
              '<span class="arstep__day">Day ' + esc(t.day) + '</span>' +
              '<span class="arstep__dot" style="background:' + (t.on ? 'var(--rmx-brand)' : 'var(--rmx-line-strong)') + '"></span>' +
              '<span class="arstep__line"></span>' +
            '</div>' +
            '<div class="arstep__main">' +
              '<div class="' + cls('arstep__card', { 'arstep__card--off': !t.on }) + '">' +
                '<div class="arstep__head"' + act('toggleArStep', i) + '>' +
                  toggle(t.on, 'toggleArActive', i) +
                  '<div class="grow" style="min-width:200px">' +
                    '<div class="row" style="align-items:baseline;gap:10px">' +
                      '<span class="arstep__no">Step ' + (i + 1) + '</span>' +
                      '<span class="arstep__title" style="color:' + (t.on ? 'var(--rmx-brand-dark)' : 'var(--rmx-text-muted)') + '">' +
                        esc(t.label) + '</span>' +
                    '</div>' +
                    '<div class="arstep__restate">' + esc(restate) + '</div>' +
                  '</div>' +
                  '<div class="arstep__facts">' +
                    '<span class="fact">' + esc(t.msg) + '</span>' +
                    '<span class="fact mono">$' + esc(t.balAmt) + '</span>' +
                    '<span class="fact">' + esc(contactLabel) + '</span>' +
                  '</div>' +
                  icon(open_ ? 'keyboard_arrow_down' : 'chevron_right', 20, 'color:var(--rmx-text-muted)') +
                '</div>' +
                when(open_, function () {
                  return '<div class="arstep__open"><div class="arstep__cols">' +
                    '<div class="col" style="gap:14px">' +
                      '<div><div class="f13 dim" style="margin-bottom:4px">When it fires</div>' +
                        '<div class="row f15 ink" style="gap:8px">' +
                          '<input class="field field--num" style="width:64px"' + fk('ar-day-' + i) +
                            chg('setArField', i, 'day') + ' value="' + esc(t.day) + '">' +
                          '<span>days after the oldest charge is due</span></div></div>' +
                      '<div><div class="f13 dim" style="margin-bottom:4px">Only when the balance is</div>' +
                        '<div class="row" style="gap:8px">' +
                          '<select class="field grow"' + chg('setArField', i, 'balOp') + '>' +
                            options(['> Greater than', '≥ At least', '< Less than'], t.balOp) + '</select>' +
                          '<input class="field field--right" style="width:110px"' + fk('ar-amt-' + i) +
                            chg('setArField', i, 'balAmt') + ' value="' + esc(t.balAmt) + '"></div></div>' +
                      '<div><div class="f13 dim" style="margin-bottom:4px">Charge types counted</div>' +
                        '<select class="field field--full"' + chg('setArField', i, 'charges') + '>' +
                          options(['RC — Recurring charges', 'All charge types', 'Rent only', 'Rent and utilities'], t.charges) +
                        '</select></div>' +
                    '</div>' +
                    '<div class="col" style="gap:14px">' +
                      '<div><div class="f13 dim" style="margin-bottom:4px">Who receives it</div>' +
                        '<div class="col" style="gap:8px">' + each(SA.arContactOptions, function (c) {
                          return '<label class="optrow"' + act('setArContacts', i, c.id) + '>' +
                            radio(t.contacts === c.id) + esc(c.label) + '</label>';
                        }) + '</div></div>' +
                      '<div><div class="f13 dim" style="margin-bottom:4px">Deliver by</div>' +
                        SA.seg(SA.arMsgOptions, t.msg, 'setArMsgFor' + i, { btnCls: 'seg__btn--sm' }) + '</div>' +
                      '<div><div class="f13 dim" style="margin-bottom:4px">Message</div>' +
                        '<select class="field field--full"' + chg('setArField', i, 'tmpl') + '>' +
                          options(['AR — friendly reminder', 'AR — late notice', 'AR — formal notice', 'AR — pre-eviction'], t.tmpl) +
                        '</select></div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="restate" style="margin-top:14px">' + esc(t.note) + '</div></div>';
                }) +
              '</div>' +
            '</div>' +
          '</div>';
        }) +
          '<div class="row" style="gap:14px">' +
            '<div style="width:96px;flex-shrink:0"></div>' +
            '<button class="btn btn--dashed grow"' + act('arAddStep') + '>' + icon('add', 18) + 'Add a Step</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var right =
      '<div class="card">' +
        '<div class="card__head">Who is in the sequence</div>' +
        '<div class="card__body">' +
          '<div class="f13 ink2" style="line-height:19px">128 residents currently carry a balance past grace. ' +
            SA.plural(on.length, 'active step') + ' means a resident can receive at most ' + on.length +
            ' messages across the cycle, and the outbound cap holds that to 2 per 7 days.</div>' +
          '<button class="btn btn--primary btn--full" style="margin-top:12px"' + act('runNotifPreview') + '>Preview Today&rsquo;s Sends</button>' +
          when(s.notifPreview === 'done', function () {
            return '<div style="margin-top:12px">' + okPill('Preview only — nothing sent') +
              each(SA.notifPreviewRows, function (r) {
                return '<div style="padding:9px 0;border-top:1px solid var(--rmx-line-soft)" class="f13">' +
                  '<div class="ink2">' + esc(r.who) + '</div>' +
                  '<div class="f12 muted">' + esc(r.addr) + ' &middot; ' + esc(r.when) + '</div></div>';
              }) + '</div>';
          }) +
        '</div>' +
      '</div>' +
      oversightCard(a.name,
        '<strong style="font-weight:500">Delinquency Follow-Up</strong> reads this sequence before it acts. When a step is already going out, the agent holds its own message instead of stacking a second one.',
        'Max 2 outbound per 7 days — locked', true) +
      recentRuns(a, 'Recent sends');

    return '<div class="rulewrap"><div class="rulegrid">' +
      '<div class="rulecol">' + left + '</div><div class="rulecol">' + right + '</div>' +
    '</div></div>';
  }

  /* one Deliver-by handler per step index */
  for (var i = 0; i < 12; i++) {
    (function (idx) {
      SA.actions['setArMsgFor' + idx] = function (v) {
        var list = SA.arStepList();
        if (list[idx]) list[idx].msg = v;
      };
    })(i);
  }

  /* ---------------- notification editor ---------------- */
  function notifEditor(a) {
    var s = SA.state;
    var audLabel = '';
    SA.notifAudiences.forEach(function (x) { if (x.id === s.aud) audLabel = x.label; });
    var trigPhrase = a.trigger.replace(/^(Event|Schedule)\s·\s/, '').replace(/\s·\s.*$/, '');
    var picked = SA.notifContactOptions.filter(function (c) { return SA.contactState(c.id); });
    var contactWarn = picked.length === 0;
    var isBoth = s.channel === 'Both';
    var showEmail = s.channel === 'Email' || (isBoth && s.msgTab === 'email');
    var showText = s.channel === 'Text' || (isBoth && s.msgTab === 'sms');
    var sms = SA.smsText();
    var segCount = Math.max(1, Math.ceil(sms.length / 160));

    var restate = [
      'Sends ' + (s.notifDelay === '0' ? 'as soon as' : s.notifDelay + ' days after') + ' ' + trigPhrase.toLowerCase() + '.',
      'Goes to the ' + audLabel.toLowerCase() + ' by ' + s.channel.toLowerCase() + '.',
      picked.length ? 'Reaches ' + picked.map(function (c) { return c.label.toLowerCase(); }).join(' and ') + '.' : 'No contacts are selected, so nothing will send.',
      SA.plural(a.setups || 0, 'setup') + ' on this notification. Each one has its own timing, filters, and recipients.'
    ];

    var left =
      nameCard(a, 'What this notification does', restate) +

      '<div class="card">' +
        '<div class="card__head">Notification setups' +
          '<span class="f12 muted" style="font-weight:400">' + SA.plural(a.setups || 0, 'setup') + '</span></div>' +
        '<div class="card__body">' +
          '<div class="row" style="gap:10px;flex-wrap:wrap">' + each(SA.notifAudiences, function (x) {
            return '<button class="' + cls('audbtn', { 'audbtn--on': s.aud === x.id }) + '"' + act('setAud', x.id) + '>' +
              '<span class="audbtn__title"><span class="audbtn__dot" style="background:' + x.dot + '"></span>' +
                esc(x.label) + '</span>' +
              '<span class="audbtn__meta">' + esc(x.meta) + '</span></button>';
          }) +
            '<button class="audbtn audbtn--add"' + act('noop') + '>' + icon('add', 18) + 'Add Setup</button>' +
          '</div>' +
          '<div class="f12 muted" style="margin-top:10px">Each audience is its own setup &mdash; own timing, own filters, own recipients. You are editing <strong style="font-weight:500">' + esc(audLabel) + '</strong>.</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">When it sends</div>' +
        '<div class="card__body">' +
          '<div class="phrase">' +
            '<span>Send</span>' +
            '<select class="field field--num" style="width:74px"' + chg('setField', 'notifDelay') + '>' +
              options(['0', '1', '3', '7'], s.notifDelay) + '</select>' +
            '<span>days after</span>' +
            '<span class="phrase__fixed">' + esc(trigPhrase) + '</span>' +
            '<span>to the</span>' +
            '<span class="phrase__fixed">' + esc(audLabel) + '</span>' +
          '</div>' +
          /* A scheduled notification rides the nightly run; it cannot be pinned to a clock time. */
          when(/^Schedule/.test(a.trigger),
            '<div class="row f12 dim" style="margin-top:10px;gap:8px">' +
              icon('schedule', 16, 'color:var(--rmx-text-muted)') +
              '<span>Scheduled notifications send with the nightly run. You set the day offset &mdash; a specific time of day is not available.</span>' +
            '</div>') +
          '<div class="row" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--rmx-line-soft);gap:14px;flex-wrap:wrap">' +
            '<span class="f13 dim">Deliver by</span>' +
            SA.seg(SA.channelOptions, s.channel, 'setChannel', { btnCls: 'seg__btn--sm' }) +
            '<span class="f13 dim grow" style="min-width:240px">' +
              esc(s.channel === 'Email' ? 'One email per recipient, using the property’s sending address.'
                : s.channel === 'Text' ? 'Text only. Residents with no mobile number on file are skipped.'
                : 'Email and text both go out. Write the text short — it is not the email.') + '</span>' +
          '</div>' +
          '<div class="row f12 dim" style="margin-top:10px;gap:8px">' +
            icon('sms', 16, 'color:var(--rmx-text-muted)') +
            '<span>2 of 412 residents have consented to texts but have no valid mobile number.</span>' +
            '<a href="#"' + act('openResidentData') + '>Fix missing numbers</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">Which records qualify</div>' +
        '<div class="card__body row" style="gap:10px;flex-wrap:wrap">' +
          '<span class="scopechip">All properties (3)</span>' +
          '<span class="scopechip">All lease categories</span>' +
          '<span class="f14 dim">&rarr; 14 records qualify today</span>' +
          '<span class="spacer"></span>' +
          '<button class="btn btn--secondary btn--sm"' + act('noop') + '>Change Filters</button>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">Which contacts on the lease</div>' +
        '<div class="card__body" style="border-bottom:1px solid var(--rmx-line)">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px">' +
            each(SA.notifContactOptions, function (c) {
              var on = SA.contactState(c.id);
              return '<label class="optrow optrow--top"' + act('toggleContact', c.id) + '>' +
                '<span class="' + cls('check', { 'check--on': on }) + '" style="margin-top:2px">' +
                  (on ? '&#10003;' : '') + '</span>' +
                '<span class="grow"><span class="togglerow__label">' + esc(c.label) + '</span>' +
                '<span class="togglerow__help">' + esc(c.help) + '</span></span></label>';
            }) +
          '</div>' +
          '<div class="row" style="gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--rmx-line-soft)">' +
            '<span class="mono f12 ink2 grow">' + esc(picked.length ? picked.length + ' contact types → 21 people today' : '0 contact types selected') + '</span>' +
            when(contactWarn, function () {
              return '<span class="badge badge--warn" style="padding:3px 10px;gap:6px">' +
                icon('warning', 15) + 'Pick at least one contact</span>';
            }) +
          '</div>' +
        '</div>' +
        '<div class="card__head">Named recipients and exclusions</div>' +
        '<div>' + each(SA.notifRecipients, function (r) {
          return '<div class="tbl__row g-recipients f13" style="padding:11px 18px">' +
            '<div style="color:' + (r.tone === 'stop' ? 'var(--rmx-text-muted)' : 'var(--rmx-ink-2)') + '">' + esc(r.name) + '</div>' +
            '<div class="dim">' + esc(r.addr) + '</div>' +
            '<div>' + SA.toneBadge(r.tone, r.type) + '</div>' +
            '<div class="right">' + icon('delete', 18, 'color:var(--rmx-text-muted);cursor:pointer') + '</div>' +
          '</div>';
        }) +
          '<div style="padding:12px 18px"><button class="linkbtn"' + act('noop') + '>' +
            icon('add_circle', 18) + 'Add a Recipient</button></div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">What it says</div>' +
        when(isBoth, function () {
          return '<div class="msgtabs">' +
            '<button class="' + cls('msgtab', { 'msgtab--on': s.msgTab === 'email' }) + '"' + act('setMsgTab', 'email') + '>Email</button>' +
            '<button class="' + cls('msgtab', { 'msgtab--on': s.msgTab === 'sms' }) + '"' + act('setMsgTab', 'sms') + '>Text</button>' +
            '<span class="spacer"></span>' +
            '<span class="f12 muted" style="align-self:center">Write the text short &mdash; it is not the email</span>' +
          '</div>';
        }) +
        when(showEmail, function () {
          return '<div style="padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start">' +
            '<div>' +
              '<div class="f13 dim" style="margin-bottom:4px">Subject</div>' +
              '<input class="field field--full"' + fk('notif-subject') + chg('setField', 'notifSubject') +
                ' value="' + esc(SA.subjectText()) + '">' +
              '<div class="row" style="gap:8px;margin:14px 0 6px">' +
                '<span class="f13 dim grow">Email body</span>' +
                SA.seg(['Plain text', 'Rich text'], s.bodyMode, 'setBodyMode', { btnCls: 'seg__btn--26' }) +
              '</div>' +
              '<textarea class="field field--full" style="min-height:190px"' + fk('notif-body') +
                chg('setField', 'notifBody') + '>' + esc(SA.bodyText()) + '</textarea>' +
              '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">' +
                '<span class="f12 muted">Insert field:</span>' +
                each(SA.notifTokens, function (t) {
                  return '<button class="token"' + act('insertNotifToken', t) + '>' + esc(t) + '</button>';
                }) +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="f13 dim" style="margin-bottom:4px">Email preview with real values</div>' +
              '<div class="mailpreview">' +
                '<div class="mailpreview__head">' +
                  '<div class="f12 muted">To: malvarez@example.com</div>' +
                  '<div class="f14 w500 navy" style="margin-top:4px">' + esc(SA.merge(SA.subjectText())) + '</div>' +
                '</div>' +
                '<div class="mailpreview__body">' + esc(SA.merge(SA.bodyText())) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }) +
        when(showText, function () {
          return '<div style="padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:start">' +
            '<div>' +
              '<div class="f13 dim" style="margin-bottom:4px">Text message</div>' +
              '<textarea class="field field--full" style="min-height:120px"' + fk('sms-body') +
                chg('setField', 'smsBody') + '>' + esc(sms) + '</textarea>' +
              '<div class="row" style="gap:12px;margin-top:8px">' +
                '<span class="mono f12 dim">' + sms.length + ' characters</span>' +
                '<span class="f12" style="color:' + (segCount > 1 ? '#a85e0e' : 'var(--rmx-text)') + '">' +
                  SA.plural(segCount, 'segment') + '</span>' +
              '</div>' +
              '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">' +
                '<span class="f12 muted">Insert field:</span>' +
                each(SA.smsTokensList, function (t) {
                  return '<button class="token"' + act('insertNotifToken', t) + '>' + esc(t) + '</button>';
                }) +
              '</div>' +
              '<div class="fhelp" style="margin-top:12px">Links are shortened at send time. Every text carries the reply-STOP footer required for consent.</div>' +
            '</div>' +
            '<div>' +
              '<div class="f13 dim" style="margin-bottom:4px">Text preview</div>' +
              '<div class="smsphone">' +
                '<div class="smsphone__time">Today 8:00 AM</div>' +
                '<div class="smsphone__bubble">' + esc(SA.merge(sms)) + '</div>' +
                '<div class="smsphone__foot">Reply STOP to opt out</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }) +
      '</div>';

    var right =
      '<div class="card">' +
        '<div class="card__head">Who would get it today</div>' +
        '<div class="card__body">' +
          (s.notifPreview !== 'done'
            ? '<div><div class="f13 dim">Check the audience before you turn it on. Nothing is sent.</div>' +
              '<button class="btn btn--primary btn--full" style="margin-top:12px"' + act('runNotifPreview') + '>Preview Recipients</button></div>'
            : '<div>' + okPill('Preview only — nothing sent') +
              '<div class="mono f12 ink2" style="margin:10px 0">14 qualify · 12 will send · 2 skipped</div>' +
              each(SA.notifPreviewRows, function (r) {
                return '<div style="padding:9px 0;border-top:1px solid var(--rmx-line-soft)" class="f13">' +
                  '<div class="ink2">' + esc(r.who) + '</div>' +
                  '<div class="f12 muted">' + esc(r.addr) + ' &middot; ' + esc(r.when) + '</div></div>';
              }) +
              '<button class="btn btn--neutral btn--full btn--xs" style="margin-top:12px"' + act('clearNotifPreview') + '>Clear Preview</button></div>') +
        '</div>' +
      '</div>' +
      oversightCard(a.name,
        'When an agent is already contacting this resident, <strong style="font-weight:500">Delinquency Follow-Up</strong> holds this notice so the resident gets one message, not two. Held notices are listed on the agent&rsquo;s run.',
        'Max 2 outbound per 7 days — locked', false) +
      recentRuns(a, 'Recent sends');

    return '<div class="rulewrap"><div class="rulegrid">' +
      '<div class="rulecol">' + left + '</div><div class="rulecol">' + right + '</div>' +
    '</div></div>';
  }

  /* ---------------- entry point ---------------- */
  SA.viewRuleEditor = function (a) {
    var kind = SA.ruleKind(a);
    if (kind === 'ar') return arEditor(a);
    if (kind === 'notif') return notifEditor(a);
    if (kind === 'schedule') return scheduleEditor(a);
    return '<div class="rulewrap"><div class="card empty">' +
      icon('build', 30, 'color:var(--rmx-text-muted)') +
      '<div class="empty__title">No editor for this automation type</div>' +
      '<div class="empty__text">This row is an automation but does not resolve to a schedule, AR sequence, or notification.</div>' +
    '</div></div>';
  };
})(window.SA = window.SA || {});
