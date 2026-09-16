/* ============================================================
   Smart Agents — Finding resolution forms

   Every finding is resolved by a PERSON filling in a Rent Manager
   form. The agent proposes the numbers; it does not post them.
   This file gives each finding a `form` spec, so the findings
   dialog is always a real RM form and never an "agent step".

   Field kinds: text (default) | select | date | textarea | check
   ============================================================ */
(function (SA) {
  'use strict';

  function moneyAll(str) {
    return String(str || '').match(/\$[\d,]+(?:\.\d{2})?/g) || [];
  }
  function money(str) { return moneyAll(str)[0] || ''; }
  function lastMoney(str) { var m = moneyAll(str); return m.length ? m[m.length - 1] : ''; }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  var PEOPLE = ['Dana Kessler', 'Marcus Webb', 'Priya Raman', 'Regional Manager queue'];
  var GUARD = 'Orion found this and proposed the numbers. It cannot post or adjust a ' +
    'charge — that guardrail is locked — so you make the change.';

  /* ---------- one builder per action type ---------- */

  function addCharge(r) {
    return {
      title: 'Add Recurring Charge', submit: 'Save Charge', note: GUARD,
      sections: [
        { label: 'Charge', fields: [
          { key: 'type', label: 'Charge Type', kind: 'select', req: true,
            options: ['Rent', 'Late Fee', 'Utility', 'Parking', 'Pet Rent'], value: 'Rent' },
          { key: 'amount', label: 'Amount', req: true, focus: true,
            value: money(r.fix) || money(r.impact) },
          { key: 'freq', label: 'Frequency', kind: 'select',
            options: ['Monthly', 'Weekly', 'Quarterly', 'Annually'], value: 'Monthly' },
          { key: 'start', label: 'Start Date', kind: 'date', req: true, value: '09/01/2026' },
          { key: 'end', label: 'End Date', kind: 'date', value: '',
            help: 'Leave blank to run through the lease end date.' },
          { key: 'gl', label: 'GL Account', kind: 'select',
            options: ['4000 · Rental Income', '4010 · Other Income'], value: '4000 · Rental Income' }
        ] },
        { label: 'Posting', fields: [
          { key: 'prorate', kind: 'check', w: 'full', on: true,
            label: 'Back-date the move-in proration of ' + (lastMoney(r.fixDetail) || 'the partial month') },
          { key: 'memo', label: 'Comment', kind: 'textarea', w: 'full',
            value: 'Created from move-in charge review.' }
        ] }
      ]
    };
  }

  function endConcession(r) {
    return {
      title: 'End Concession', submit: 'Save Concession', note: GUARD,
      sections: [
        { label: 'Concession', fields: [
          { key: 'type', label: 'Concession Type', kind: 'select', ro: true,
            options: ['Move-In Special'], value: 'Move-In Special' },
          { key: 'amount', label: 'Amount', ro: true, value: money(r.impact) || money(r.fix) },
          { key: 'start', label: 'Start Date', kind: 'date', ro: true, value: '06/01/2026' },
          { key: 'end', label: 'End Date', kind: 'date', req: true, focus: true, value: '07/31/2026',
            help: 'The concession stops posting after this date.' },
          { key: 'reason', label: 'Reason', kind: 'select', req: true,
            options: ['Term expired', 'Early termination', 'Applied in error'], value: 'Term expired' }
        ] },
        { label: 'Posting', fields: [
          { key: 'reverse', kind: 'check', w: 'full', on: true,
            label: 'Reverse concession amounts posted after the end date' },
          { key: 'memo', label: 'Comment', kind: 'textarea', w: 'full',
            value: 'Concession term ended; recurring rent returns to the lease amount.' }
        ] }
      ]
    };
  }

  function reviewTask(r) {
    return {
      title: 'Create Task', submit: 'Save Task',
      note: 'Orion cannot decide a renewal. It has drafted the task so a person can.',
      sections: [
        { label: 'Task', fields: [
          { key: 'type', label: 'Task Type', kind: 'select', req: true,
            options: ['Renewal Review', 'Follow-Up', 'Inspection', 'Collections'], value: 'Renewal Review' },
          { key: 'assigned', label: 'Assigned To', kind: 'select', req: true,
            options: PEOPLE, value: PEOPLE[0] },
          { key: 'due', label: 'Due Date', kind: 'date', req: true, value: '10/11/2026' },
          { key: 'priority', label: 'Priority', kind: 'select',
            options: ['Normal', 'High', 'Low'], value: 'Normal' },
          { key: 'subject', label: 'Subject', w: 'full', focus: true,
            value: 'Renewal review — ' + r.resident + ' (' + r.rec + ')' },
          { key: 'notes', label: 'Description', kind: 'textarea', w: 'full', value: r.fixDetail || r.fix }
        ] }
      ]
    };
  }

  function requestW9(r) {
    return {
      title: 'Request W-9', submit: 'Send Request',
      note: 'Orion drafted the request. Sending it to a vendor is a person’s call.',
      sections: [
        { label: 'Vendor', fields: [
          { key: 'vendor', label: 'Vendor', ro: true, value: r.resident },
          { key: 'vendorid', label: 'Vendor ID', ro: true, value: r.rec },
          { key: 'contact', label: 'Contact', kind: 'select', req: true,
            options: ['Accounts Receivable', 'Primary Contact', 'Owner'], value: 'Accounts Receivable' },
          { key: 'email', label: 'Email', req: true, focus: true,
            value: 'ap@' + slug(r.resident).slice(0, 18) + '.com' }
        ] },
        { label: 'Request', fields: [
          { key: 'template', label: 'Template', kind: 'select',
            options: ['W-9 Request', 'W-9 Request (Second Notice)'], value: 'W-9 Request' },
          { key: 'due', label: 'Response Due', kind: 'date', req: true, value: '09/14/2026' },
          { key: 'attach', kind: 'check', w: 'full', on: true, label: 'Attach a blank Form W-9' },
          { key: 'hold', kind: 'check', w: 'full', on: true,
            label: 'Place a 1099 hold on this vendor until the W-9 is on file' },
          { key: 'message', label: 'Message', kind: 'textarea', w: 'full',
            value: 'We need a current Form W-9 on file before your next payment can be released.' }
        ] }
      ]
    };
  }

  function addContact(r) {
    return {
      title: 'Add Contact Information', submit: 'Save Contact',
      note: 'Orion found the gap. Contact details are entered by a person, never guessed.',
      sections: [
        { label: 'Contact', fields: [
          { key: 'ctype', label: 'Contact Type', kind: 'select', req: true,
            options: ['Phone', 'Email'], value: 'Phone' },
          { key: 'number', label: 'Phone Number', req: true, focus: true, value: '',
            help: 'Orion does not fill this in — the number is not on any record.' },
          { key: 'ntype', label: 'Number Type', kind: 'select', req: true,
            options: ['Mobile', 'Home', 'Work'], value: 'Mobile' },
          { key: 'ext', label: 'Extension', value: '' }
        ] },
        { label: 'Preferences', fields: [
          { key: 'primary', kind: 'check', w: 'full', on: true, label: 'Primary contact number' },
          { key: 'consent', kind: 'check', w: 'full', on: false,
            label: 'Resident has consented to text messages' },
          { key: 'memo', label: 'Comment', kind: 'textarea', w: 'full', value: '' }
        ] }
      ]
    };
  }

  var BY_ACT = {
    'Add Charge': addCharge,
    'End Concession': endConcession,
    'Review': reviewTask,
    'Request W-9': requestW9,
    'Add Contact': addContact
  };

  /* The two hand-authored Correct Charge forms already carry exact numbers.
     Lift them into the sectioned shape rather than re-deriving them. */
  function convertLegacy(form) {
    return {
      title: 'Correct Recurring Charge', submit: form.submit, note: form.note,
      sections: [{ label: 'Charge', fields: form.fields.map(function (f) {
        return {
          key: slug(f.label), label: f.label, kind: f.kind === 'check' ? 'check' : 'text',
          value: f.value, on: f.on, ro: f.ro, focus: f.focus,
          w: f.kind === 'check' ? 'full' : (f.w === 'full' ? 'full' : 'half')
        };
      }) }]
    };
  }

  Object.keys(SA.findings).forEach(function (set) {
    SA.findings[set].forEach(function (r) {
      if (r.form && r.form.fields) { r.form = convertLegacy(r.form); return; }
      var build = BY_ACT[r.act];
      if (build) r.form = build(r);
    });
  });

  /* Field values live in state so the form is genuinely editable. */
  SA.formKey = function (rec, key) { return rec + '.' + key; };
  SA.formVal = function (rec, f) {
    var k = SA.formKey(rec, f.key);
    var v = SA.state.formVals[k];
    return v === undefined ? (f.kind === 'check' ? !!f.on : (f.value || '')) : v;
  };
})(window.SA = window.SA || {});
