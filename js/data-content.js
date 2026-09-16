/* ============================================================
   Smart Agents — screen content
   ------------------------------------------------------------
   Everything here lived in the part of the design's component
   script that sits past the 256 KiB read cap, so it is authored
   to match the template's bindings and the counts the recovered
   data asserts (`findings: 9 / 3 / 12`, `arSteps`, `setups`,
   template `shape` strings, detection `result` strings).
   Voice follows the design system README: flat, neutral,
   enterprise-pragmatic, sentence case in body copy.
   ============================================================ */
(function (SA) {
  'use strict';

  SA.PROPERTIES = ['Maple Grove', 'Riverside Commons', 'Oak Park Flats'];

  /* ---------------- option lists ---------------- */

  SA.sensOptions = [
    { id: 'Conservative', help: 'Only flags records it is certain about. Fewer findings, almost no noise.' },
    { id: 'Balanced', help: 'The default. Flags a record when the evidence clearly supports it.' },
    { id: 'Aggressive', help: 'Flags anything that looks off. More findings, more to dismiss.' }
  ];
  SA.schedOptions = ['Nightly', 'Weekly', 'Monthly'];

  SA.whenOptions = [
    { group: 'Orion detects' },
    { id: 'detection', label: 'Choose an Orion detection', orion: true },
    { group: 'Something happens' },
    { id: 'ev-lease', label: 'A lease is signed' },
    { id: 'ev-payment', label: 'A payment posts' },
    { id: 'ev-invoice', label: 'An invoice is received' },
    { id: 'ev-credit', label: 'A credit is added to a tenant ledger' },
    { group: 'On a schedule' },
    { id: 'sc-daily', label: 'Every day at a set time' }
  ];

  SA.thenOptions = [
    { id: 'notify', label: 'Notify a person or role' },
    { id: 'task', label: 'Create a task' },
    { id: 'message', label: 'Send a message from a template' },
    { id: 'flag', label: 'Flag the record' },
    { id: 'finding', label: 'Write a finding only — take no action' },
    { id: 'escape', label: 'Hand it off to a person' }
  ];

  SA.principalOptions = [
    'Property Manager', 'Regional Manager', 'Leasing Agent', 'AP Manager',
    'Controller', 'Maintenance Supervisor', 'Assigned User'
  ];
  SA.peopleOptions = [
    'Dana Kessler', 'Jonathan Cameron', 'Gayatri Harikrishnan', 'Marcus Alvarez',
    'Priya Raman', 'Tom Beaudry', 'Renee Ostrowski'
  ];

  SA.mergeChips = [
    '{resident}', '{unit}', '{property}', '{balance}',
    '{lease_end}', '{amount}', '{due_date}', '{agent}'
  ];

  SA.condFieldOptions = [
    'Property', 'Unit type', 'Lease term', 'Balance', 'Days past due',
    'Charge type', 'Resident status', 'Market'
  ];
  SA.condOpOptions = ['is', 'is not', 'is over', 'is under', 'contains', 'is empty'];

  SA.trigEventOptions = [
    'A lease is signed', 'A payment posts', 'A payment is returned',
    'An invoice is received', 'A credit is added to a tenant ledger',
    'A work order is assigned', 'A notice to vacate is recorded',
    'A prospect submits a guest card'
  ];
  SA.trigFreqOptions = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
  SA.trigWeekdayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  SA.trigMonthdayOptions = ['1', '2', '3', '6', '15', 'Last day'];
  SA.trigHourOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  SA.trigMinuteOptions = ['00', '15', '30', '45'];

  SA.dismissReasons = [
    'Not a problem — the record is correct as it stands',
    'Already handled outside the agent',
    'Intentional exception for this property',
    'The detection is wrong about this record'
  ];

  SA.paletteItems = [
    { id: 'detection', icon: 'radar', label: 'Detect', title: 'Add an Orion detection' },
    { id: 'condition', icon: 'call_split', label: 'Branch', title: 'Add a deterministic condition' },
    { id: 'action', icon: 'bolt', label: 'Act', title: 'Add an action' },
    { id: 'approval', icon: 'how_to_reg', label: 'Approve', title: 'Add an approval step' }
  ];

  /* ---------------- canvas graphs ----------------
     Column-based specs; x/y are laid out by SA.layoutGraph().
     Node counts and action counts match each template's `shape`. */

  SA.graphs = {
    movein: {
      cols: [
        [{ id: 'trigger', kind: 'Trigger', title: 'Nightly', sub: 'Runs once a night against all properties.' }],
        [{ id: 'detection', kind: 'Detection', title: 'Charges that do not match the lease', sub: 'Move-in within 30 days · rent below signed · under market', orion: true, meta: '9 records' }],
        [{ id: 'cond-open', kind: 'Condition', title: 'Not already dismissed', sub: 'Excludes findings a person closed.' }],
        [
          { id: 'act-task', kind: 'Action', title: 'Create task → Property Manager', sub: 'One task per lease, with the missing charge attached.', meta: '9 tasks' },
          { id: 'act-flag', kind: 'Action', title: 'Flag the lease', sub: 'Marks the lease so the register shows it.', locked: true },
          { id: 'act-notify', kind: 'Action', title: 'Notify Regional Manager', sub: 'One digest per property, not one per lease.' }
        ],
        [{ id: 'escape', kind: 'Hand Off', title: 'Regional Manager queue', sub: 'Anything it cannot justify acting on lands here.', locked: true }]
      ],
      edges: [
        ['trigger', 'detection'], ['detection', 'cond-open'],
        ['cond-open', 'act-task'], ['cond-open', 'act-flag'], ['cond-open', 'act-notify'],
        ['cond-open', 'escape', true]
      ]
    },
    credit: {
      cols: [
        [{ id: 'trigger', kind: 'Trigger', title: 'A credit is added to a tenant ledger', sub: 'Fires the moment the credit is saved.', meta: 'event' }],
        [{ id: 'detection', kind: 'Detection', title: 'Credit request outside the normal pattern', sub: 'Amount for the reason code · supporting document', orion: true, meta: '7 today' }],
        [
          { id: 'cond-tier1', kind: 'Condition', title: 'Amount ≤ $250.00', sub: 'Inside the automatic limit.' },
          { id: 'cond-tier2', kind: 'Condition', title: 'Amount > $250.00', sub: 'Needs a person.' },
          { id: 'cond-doc', kind: 'Condition', title: 'No document attached', sub: 'Concession, refund, or work order.' },
          { id: 'cond-reason', kind: 'Condition', title: 'Reason code does not match', sub: 'Ledger activity contradicts the code.' }
        ],
        [
          { id: 'act-auto', kind: 'Action', title: 'Approve within limit', sub: 'Posts the credit and writes the reasoning to the ledger.', meta: '4 today' },
          { id: 'approval', kind: 'Approval', title: 'Send for approval', sub: 'Property Manager, then Controller over $2,500.00.' },
          { id: 'act-doc', kind: 'Action', title: 'Request documentation', sub: 'Asks the requester for the missing document.', meta: '2 today' },
          { id: 'act-decline', kind: 'Action', title: 'Decline the credit', sub: 'Declines with the reason, never silently.', locked: true }
        ],
        [
          { id: 'act-post', kind: 'Action', title: 'Post on approval', sub: 'Runs only after a person approves.', meta: '1 today' },
          { id: 'escape', kind: 'Hand Off', title: 'Regional Manager queue', sub: 'No answer in 3 days routes here.', locked: true }
        ]
      ],
      edges: [
        ['trigger', 'detection'],
        ['detection', 'cond-tier1'], ['detection', 'cond-tier2'], ['detection', 'cond-doc'], ['detection', 'cond-reason'],
        ['cond-tier1', 'act-auto'], ['cond-tier2', 'approval'], ['cond-doc', 'act-doc'], ['cond-reason', 'act-decline'],
        ['approval', 'act-post'], ['approval', 'escape', true]
      ]
    },
    bill: {
      cols: [
        [{ id: 'trigger', kind: 'Trigger', title: 'An invoice is received', sub: 'Fires on receipt, before posting.', meta: 'event' }],
        [{ id: 'detection', kind: 'Detection', title: 'Invoice out of pattern for the vendor', sub: 'Against its PO and the vendor’s last approved invoice', orion: true, meta: '19 today' }],
        [{ id: 'cond-var', kind: 'Condition', title: 'Variance over $250.00', sub: 'Deterministic threshold on the difference.' }],
        [
          { id: 'act-approve', kind: 'Action', title: 'Approve for payment', sub: 'Only when it matches the PO and the vendor pattern.', meta: '14 today' },
          { id: 'act-send', kind: 'Action', title: 'Send for approval', sub: 'Routes to the AP approver for the property.', meta: '3 today' },
          { id: 'act-hold', kind: 'Action', title: 'Hold for PO or W-9', sub: 'Holds and names exactly what is missing.', meta: '2 today' },
          { id: 'act-task', kind: 'Action', title: 'Create task → AP', sub: 'For invoices that need a human read.' }
        ],
        [{ id: 'escape', kind: 'Hand Off', title: 'Regional Manager queue', sub: 'Contradictory paperwork lands here.', locked: true }]
      ],
      edges: [
        ['trigger', 'detection'], ['detection', 'cond-var'],
        ['cond-var', 'act-approve'], ['cond-var', 'act-send'], ['cond-var', 'act-hold'], ['cond-var', 'act-task'],
        ['cond-var', 'escape', true]
      ]
    },
    prospect: {
      cols: [
        [{ id: 'trigger', kind: 'Trigger', title: 'Daily', sub: 'One pass over every live prospect.' }],
        [{ id: 'detection', kind: 'Detection', title: 'Prospect going cold', sub: 'No contact for 3 days · not lost · has not toured', orion: true, meta: '23 today' }],
        [{ id: 'cond-unit', kind: 'Condition', title: 'A matching unit is available', sub: 'Now, or within 30 days.' }],
        [
          { id: 'act-followup', kind: 'Action', title: 'Send the follow-up template', sub: 'One message, in the channel they used first.', meta: '14 today' },
          { id: 'act-tour', kind: 'Action', title: 'Offer a tour time', sub: 'Two slots from the leasing calendar.', meta: '6 today' },
          { id: 'act-task', kind: 'Action', title: 'Create task → Leasing Agent', sub: 'When a person should make the call.', meta: '3 today' },
          { id: 'act-cold', kind: 'Action', title: 'Mark cold', sub: 'After the outbound cap is reached.', locked: true }
        ],
        [{ id: 'escape', kind: 'Hand Off', title: 'Regional Manager queue', sub: 'No contact method on file lands here.', locked: true }]
      ],
      edges: [
        ['trigger', 'detection'], ['detection', 'cond-unit'],
        ['cond-unit', 'act-followup'], ['cond-unit', 'act-tour'], ['cond-unit', 'act-task'], ['cond-unit', 'act-cold'],
        ['cond-unit', 'escape', true]
      ]
    }
  };

  /* The flow reads top-to-bottom: each entry in graph.cols is a LEVEL, and the
     nodes inside a level sit side by side so a branch fans out horizontally. */
  SA.NODE_W = 214;
  SA.SIB_GAP = 24;    /* between siblings inside one level */
  SA.LEVEL_GAP = 52;  /* between levels, top to bottom */
  SA.PAD = 40;

  /* Lay a column spec out into absolutely positioned nodes + bezier edges. */
  /* Nodes render with min-height, so an under-estimate would let a tall node
     collide with the level below. estHeight() mirrors the .node CSS box. */
  function estLines(text, charsPerLine) {
    return Math.max(1, Math.ceil(String(text || '').length / charsPerLine));
  }
  function estHeight(n) {
    var blocks = 2 + (n.sub ? 1 : 0) + (n.meta ? 1 : 0);
    return 10 + 10 + 2 +               /* padding + borders */
      (blocks - 1) * 6 +               /* flex gap */
      24 +                             /* .node__top */
      estLines(n.title, 28) * 18 +     /* 13px / 18px */
      (n.sub ? estLines(n.sub, 30) * 16 : 0) +   /* 12px / 16px */
      (n.meta ? estLines(n.meta, 28) * 14 : 0);  /* 11px mono */
  }

  /* The canvas is editable, so each agent gets a working copy of its graph.
     The authored spec in SA.graphs stays pristine as the reset baseline. */
  SA.nodeSeq = 0;
  SA.workGraph = function (agentId) {
    var g = SA.state.graphs[agentId];
    if (!g) {
      var base = SA.graphs[agentId];
      if (!base) return null;
      g = JSON.parse(JSON.stringify(base));
      SA.state.graphs[agentId] = g;
    }
    return g;
  };

  /* What each palette button drops onto the canvas. */
  SA.paletteNode = {
    Detect:  { kind: 'Detection', title: 'New detection', sub: 'Pick what Orion should look for.', orion: true },
    Branch:  { kind: 'Condition', title: 'New condition', sub: 'Add the field tests for this branch.' },
    Act:     { kind: 'Action', title: 'New action', sub: 'Choose what happens and who it goes to.' },
    Approve: { kind: 'Approval', title: 'New approval', sub: 'Name who signs off before it acts.' }
  };

  SA.layoutGraph = function (graph) {
    var nodes = [], byId = {}, levels = graph.cols;

    function rowWidth(level) {
      return level.length * SA.NODE_W + (level.length - 1) * SA.SIB_GAP;
    }
    var widest = 0;
    levels.forEach(function (level) { widest = Math.max(widest, rowWidth(level)); });
    var canvasW = SA.PAD + widest + SA.PAD;

    var y = SA.PAD;
    levels.forEach(function (level, li) {
      var x0 = (canvasW - rowWidth(level)) / 2;
      var levelH = 0;
      level.forEach(function (n, si) {
        var h = estHeight(n);
        levelH = Math.max(levelH, h);
        var node = Object.assign({}, n, {
          x: Math.round(x0 + si * (SA.NODE_W + SA.SIB_GAP)),
          y: Math.round(y),
          w: SA.NODE_W,
          h: h
        });
        nodes.push(node);
        byId[node.id] = node;
      });
      /* every node in a level shares the level's baseline height so the
         connectors leave from one straight line */
      level.forEach(function (n) { byId[n.id].h = levelH; });
      y += levelH + (li === levels.length - 1 ? 0 : SA.LEVEL_GAP);
    });
    var canvasH = y + SA.PAD;

    /* Solid edges drop straight down. The dashed hand-off branch skips a level,
       so it is routed out to a side channel instead of through the row between. */
    var channel = canvasW - 18;
    var edges = graph.edges.map(function (e) {
      var a = byId[e[0]], b = byId[e[1]];
      if (!a || !b) return null;
      var dashed = !!e[2];
      var y1 = a.y + a.h, y2 = b.y;
      if (dashed) {
        var ax = a.x + a.w, bx = b.x + b.w;         /* leave and re-enter on the right */
        var ay = a.y + a.h / 2, by = b.y + b.h / 2;
        var r = 10;
        return {
          d: 'M ' + ax + ' ' + ay +
             ' H ' + (channel - r) +
             ' Q ' + channel + ' ' + ay + ' ' + channel + ' ' + (ay + r) +
             ' V ' + (by - r) +
             ' Q ' + channel + ' ' + by + ' ' + (channel - r) + ' ' + by +
             ' H ' + bx,
          dashed: true
        };
      }
      var x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
      var mid = (y1 + y2) / 2;
      return {
        d: 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + mid + ', ' + x2 + ' ' + mid + ', ' + x2 + ' ' + y2,
        dashed: false
      };
    }).filter(Boolean);

    return { nodes: nodes, edges: edges, w: canvasW, h: canvasH };
  };

  SA.nodeKindColor = {
    Trigger: '#3f7e1f',
    Detection: 'var(--rmx-brand-pressed)',
    Condition: '#6b28cc',
    Action: 'var(--rmx-brand)',
    Approval: '#a85e0e',
    'Hand Off': 'var(--rmx-warning)'
  };
  SA.nodeKindIcon = {
    Trigger: 'schedule',
    Detection: 'radar',
    Condition: 'call_split',
    Action: 'bolt',
    Approval: 'how_to_reg',
    'Hand Off': 'alt_route'
  };

  /* ---------------- findings ----------------
     Counts line up with agents[].findings: movein 9, w9 3, residentdata 12. */

  function f(o) { return o; }

  SA.findings = {
    movein: [
      f({ rec: 'LSE-10442', resident: 'Marcus Alvarez', property: 'Maple Grove', detected: '12 days ago', age: '12 days',
        issue: 'No recurring charge 12 days after move-in', fix: 'Add recurring rent $1,485.00/mo', impact: '$1,485.00', act: 'Add Charge', group: 'bill',
        found: 'The lease was signed on Aug 19 with a move-in date of Aug 19 and monthly rent of $1,485.00. No active recurring charge exists on the lease as of today.',
        matters: 'September rent will not post for this unit. The balance will read $0.00 and no late fee logic will ever engage.',
        fixDetail: 'Create the recurring rent charge for $1,485.00 effective Sep 1, then back-date the August proration of $717.10.',
        records: ['LSE-10442 — Lease', 'UNIT 12-B — Maple Grove', 'Marcus Alvarez — Tenant'] }),
      f({ rec: 'LSE-10457', resident: 'Priya Raman', property: 'Maple Grove', detected: '9 days ago', age: '9 days',
        issue: 'Recurring rent $75.00 below the signed lease rent', fix: 'Raise recurring rent to $1,560.00', impact: '$75.00', act: 'Correct Charge', group: 'correct',
        found: 'The signed lease sets rent at $1,560.00. The active recurring charge posts $1,485.00 — a $75.00 monthly shortfall since Jun 1.',
        matters: 'Three months have already posted short. The gap compounds every month it stays uncorrected.',
        fixDetail: 'Change the recurring charge to $1,560.00 and post a one-time catch-up charge of $225.00 for June through August.',
        records: ['LSE-10457 — Lease', 'RC-8841 — Recurring charge', 'Priya Raman — Tenant'] }),
      f({ rec: 'LSE-10461', resident: 'Dominic Chen', property: 'Riverside Commons', detected: '8 days ago', age: '8 days',
        issue: 'No recurring charge 8 days after move-in', fix: 'Add recurring rent $1,720.00/mo', impact: '$1,720.00', act: 'Add Charge', group: 'bill',
        found: 'Move-in recorded Aug 23. Lease rent is $1,720.00. No recurring charge has been created on the lease.',
        matters: 'The unit reads as occupied but bills nothing. It will not appear in any past-due report.',
        fixDetail: 'Create the recurring rent charge for $1,720.00 effective Sep 1 and prorate August at $498.06.',
        records: ['LSE-10461 — Lease', 'UNIT 4-A — Riverside Commons', 'Dominic Chen — Tenant'] }),
      f({ rec: 'LSE-10468', resident: 'Sofia Okafor', property: 'Riverside Commons', detected: '6 days ago', age: '6 days',
        issue: 'Rent $145.00 under unit market rent at renewal', fix: 'Review at renewal — 41 days out', impact: '$145.00', act: 'Review', group: 'watch',
        found: 'Recurring rent is $1,655.00. The unit’s current market rent is $1,800.00. The lease renews in 41 days.',
        matters: 'This is the only window to reprice before the term locks for another year.',
        fixDetail: 'Send the renewal offer at market, or record a deliberate below-market decision on the lease.',
        records: ['LSE-10468 — Lease', 'UNIT 7-C — Riverside Commons', 'Sofia Okafor — Tenant'] }),
      f({ rec: 'LSE-10473', resident: 'Ethan Whitfield', property: 'Oak Park Flats', detected: '21 days ago', age: '21 days',
        issue: 'No recurring charge 21 days after move-in', fix: 'Add recurring rent $1,290.00/mo', impact: '$1,290.00', act: 'Add Charge', group: 'bill',
        found: 'Move-in recorded Aug 10. Lease rent is $1,290.00. No recurring charge exists. The August cycle has already closed without billing this lease.',
        matters: 'A full month of rent has gone unbilled. This is the oldest open finding on the agent.',
        fixDetail: 'Create the recurring rent charge for $1,290.00 and post the missed August charge of $886.45 as a catch-up.',
        records: ['LSE-10473 — Lease', 'UNIT 2-D — Oak Park Flats', 'Ethan Whitfield — Tenant'] }),
      f({ rec: 'LSE-10480', resident: 'Naomi Castellanos', property: 'Oak Park Flats', detected: '5 days ago', age: '5 days',
        issue: 'Recurring rent $120.00 below the signed lease rent', fix: 'Raise recurring rent to $1,415.00', impact: '$120.00', act: 'Correct Charge', group: 'correct',
        found: 'Signed lease rent is $1,415.00. The active recurring charge posts $1,295.00.',
        matters: 'The charge was copied from the prior lease on this unit and never updated to the new term.',
        fixDetail: 'Change the recurring charge to $1,415.00 effective Sep 1 and post a $120.00 catch-up for August.',
        records: ['LSE-10480 — Lease', 'RC-9012 — Recurring charge', 'Naomi Castellanos — Tenant'] }),
      f({ rec: 'LSE-10486', resident: 'Julian Petrov', property: 'Maple Grove', detected: '4 days ago', age: '4 days',
        issue: 'No parking charge on a lease with an assigned space', fix: 'Add parking charge $65.00/mo', impact: '$65.00', act: 'Add Charge', group: 'correct',
        found: 'Space P-14 is assigned to this lease. No parking charge is posting. Comparable leases at this property post $65.00.',
        matters: 'Assigned parking is billable at this property and this space is occupied.',
        fixDetail: 'Add the $65.00 parking charge effective Sep 1, or release space P-14 back to the pool.',
        records: ['LSE-10486 — Lease', 'P-14 — Parking space', 'Julian Petrov — Tenant'] }),
      f({ rec: 'LSE-10491', resident: 'Amara Diallo', property: 'Riverside Commons', detected: '3 days ago', age: '3 days',
        issue: 'Concession still posting after its end date', fix: 'End the concession — expired Jul 31', impact: '$200.00', act: 'End Concession', group: 'correct',
        found: 'A $200.00 monthly concession carried an end date of Jul 31 and has continued to post in August.',
        matters: 'The credit is reducing rent past the term the resident agreed to.',
        fixDetail: 'End the concession as of Jul 31 and reverse the August credit of $200.00.',
        records: ['LSE-10491 — Lease', 'CON-441 — Concession', 'Amara Diallo — Tenant'] }),
      f({ rec: 'LSE-10495', resident: 'Grady Lindqvist', property: 'Oak Park Flats', detected: '2 days ago', age: '2 days',
        issue: 'No recurring charge 4 days after move-in', fix: 'Add recurring rent $1,610.00/mo', impact: '$1,610.00', act: 'Add Charge', group: 'bill',
        found: 'Move-in recorded Aug 27. Lease rent is $1,610.00. No recurring charge exists yet.',
        matters: 'Caught before the September cycle. Fixing it now costs nothing but a charge record.',
        fixDetail: 'Create the recurring rent charge for $1,610.00 effective Sep 1 and prorate August at $259.68.',
        records: ['LSE-10495 — Lease', 'UNIT 9-A — Oak Park Flats', 'Grady Lindqvist — Tenant'] })
    ],
    w9: [
      f({ rec: 'VEN-2201', resident: 'Kestrel Plumbing Co.', property: 'All properties', detected: '6 days ago', age: '6 days',
        issue: '$8,420.00 paid this tax year, no W-9 on file', fix: 'Request a W-9 from the vendor contact', impact: '$8,420.00', act: 'Request W-9', group: 'document',
        found: 'Payments to this vendor total $8,420.00 in the current tax year. No W-9 document is attached to the vendor record.',
        matters: 'This vendor requires a 1099 and there is no taxpayer information to file it with.',
        fixDetail: 'Email the W-9 request to the vendor contact and attach the returned form to the vendor record.',
        records: ['VEN-2201 — Vendor', '14 payments — current tax year'] }),
      f({ rec: 'VEN-2244', resident: 'Bright Ridge Landscaping', property: 'All properties', detected: '6 days ago', age: '6 days',
        issue: '$1,960.00 paid this tax year, no W-9 on file', fix: 'Request a W-9 from the vendor contact', impact: '$1,960.00', act: 'Request W-9', group: 'document',
        found: 'Payments total $1,960.00 in the current tax year across 8 invoices. No W-9 is attached.',
        matters: 'Past the $600.00 threshold with four months of the tax year still to run.',
        fixDetail: 'Email the W-9 request to the vendor contact and attach the returned form to the vendor record.',
        records: ['VEN-2244 — Vendor', '8 payments — current tax year'] }),
      f({ rec: 'VEN-2298', resident: 'Halvorsen Electric', property: 'All properties', detected: '6 days ago', age: '6 days',
        issue: '$640.00 paid this tax year, no W-9 on file', fix: 'Request a W-9 from the vendor contact', impact: '$640.00', act: 'Request W-9', group: 'document',
        found: 'Payments total $640.00 in the current tax year. The vendor crossed the threshold on the most recent invoice.',
        matters: 'Newly over the threshold. Easiest to collect now, while the work is recent.',
        fixDetail: 'Email the W-9 request to the vendor contact and attach the returned form to the vendor record.',
        records: ['VEN-2298 — Vendor', '2 payments — current tax year'] })
    ],
    residentdata: [
      f({ rec: 'RES-4412', resident: 'Talia Brennan', property: 'Maple Grove', detected: '4 days ago', age: '4 days', issue: 'No mobile or home phone', fix: 'Add a phone number', impact: 'Cannot text', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4418', resident: 'Owen Mbeki', property: 'Maple Grove', detected: '4 days ago', age: '4 days', issue: 'No email address', fix: 'Add an email address', impact: 'Cannot email', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4423', resident: 'Camille Rousseau', property: 'Maple Grove', detected: '4 days ago', age: '4 days', issue: 'No emergency contact on the lease', fix: 'Add an emergency contact', impact: 'Compliance', act: 'Add Contact', group: 'emergency' }),
      f({ rec: 'RES-4431', resident: 'Devon Ashworth', property: 'Riverside Commons', detected: '4 days ago', age: '4 days', issue: 'No mobile or home phone', fix: 'Add a phone number', impact: 'Cannot text', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4437', resident: 'Ingrid Solberg', property: 'Riverside Commons', detected: '4 days ago', age: '4 days', issue: 'No email address', fix: 'Add an email address', impact: 'Cannot email', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4442', resident: 'Rashad Coleman', property: 'Riverside Commons', detected: '4 days ago', age: '4 days', issue: 'No emergency contact on the lease', fix: 'Add an emergency contact', impact: 'Compliance', act: 'Add Contact', group: 'emergency' }),
      f({ rec: 'RES-4449', resident: 'Beatriz Salazar', property: 'Riverside Commons', detected: '4 days ago', age: '4 days', issue: 'Phone number fails validation', fix: 'Correct the phone number', impact: 'Cannot text', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4455', resident: 'Henrik Lund', property: 'Oak Park Flats', detected: '4 days ago', age: '4 days', issue: 'No mobile or home phone', fix: 'Add a phone number', impact: 'Cannot text', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4460', resident: 'Yasmin Haddad', property: 'Oak Park Flats', detected: '4 days ago', age: '4 days', issue: 'No email address', fix: 'Add an email address', impact: 'Cannot email', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4466', resident: 'Curtis Nakamura', property: 'Oak Park Flats', detected: '4 days ago', age: '4 days', issue: 'No emergency contact on the lease', fix: 'Add an emergency contact', impact: 'Compliance', act: 'Add Contact', group: 'emergency' }),
      f({ rec: 'RES-4471', resident: 'Elena Vasquez', property: 'Oak Park Flats', detected: '4 days ago', age: '4 days', issue: 'Email address bounced twice', fix: 'Correct the email address', impact: 'Cannot email', act: 'Add Contact', group: 'contact' }),
      f({ rec: 'RES-4478', resident: 'Malik Trent', property: 'Maple Grove', detected: '4 days ago', age: '4 days', issue: 'No emergency contact on the lease', fix: 'Add an emergency contact', impact: 'Compliance', act: 'Add Contact', group: 'emergency' })
    ]
  };

  /* Fill in the fields the short resident-data rows omit. */
  SA.findings.residentdata.forEach(function (r) {
    r.found = r.found || 'The lease is active and ' + r.issue.toLowerCase() + '. The record has been in this state since move-in.';
    r.matters = r.matters || 'Every notification this resident should receive fails silently until the record is complete.';
    r.fixDetail = r.fixDetail || 'Open the resident record and ' + r.fix.toLowerCase() + '. No agent writes to resident contact fields.';
    r.records = r.records || [r.rec + ' — Tenant', r.property + ' — Property'];
  });

  SA.todoGroupMeta = {
    bill: { label: 'Bill it before the month closes', accent: 'var(--rmx-brand)', help: 'Rent that will not post unless someone creates the charge.' },
    correct: { label: 'Correct a charge amount', accent: 'var(--rmx-warning)', help: 'A charge exists but disagrees with the signed lease.' },
    document: { label: 'Chase a document', accent: 'var(--rmx-magenta)', help: 'Nothing is wrong with the record — a form is missing.' },
    contact: { label: 'Fill in a contact record', accent: 'var(--rmx-brand-pressed)', help: 'Residents who cannot currently be reached.' },
    emergency: { label: 'Add an emergency contact', accent: 'var(--rmx-ink-2)', help: 'Required on the lease and currently blank.' },
    watch: { label: 'Decide at renewal', accent: 'var(--rmx-text-muted)', help: 'Nothing is broken. There is a window closing.' }
  };
  SA.todoGroupOrder = ['bill', 'correct', 'document', 'contact', 'emergency', 'watch'];

  /* ---------------- run history + replay ---------------- */

  SA.runHistory = {
    movein: [
      { when: 'Today 2:04am', trigger: 'Nightly', seen: '486', actions: '9', result: 'Completed', tone: 'ok' },
      { when: 'Aug 30 2:04am', trigger: 'Nightly', seen: '486', actions: '7', result: 'Completed', tone: 'ok' },
      { when: 'Aug 29 2:03am', trigger: 'Nightly', seen: '484', actions: '11', result: 'Completed', tone: 'ok' },
      { when: 'Aug 28 2:04am', trigger: 'Nightly', seen: '484', actions: '0', result: 'Nothing found', tone: 'neutral' },
      { when: 'Aug 27 2:11am', trigger: 'Nightly', seen: '312', actions: '4', result: 'Partial — ledger timeout', tone: 'warn' }
    ],
    w9: [
      { when: 'Mon 5:01am', trigger: 'Weekly', seen: '148', actions: '3', result: 'Completed', tone: 'ok' },
      { when: 'Aug 25 5:01am', trigger: 'Weekly', seen: '147', actions: '2', result: 'Completed', tone: 'ok' },
      { when: 'Aug 18 5:00am', trigger: 'Weekly', seen: '147', actions: '0', result: 'Nothing found', tone: 'neutral' },
      { when: 'Aug 11 5:01am', trigger: 'Weekly', seen: '145', actions: '1', result: 'Completed', tone: 'ok' },
      { when: 'Aug 4 5:00am', trigger: 'Weekly', seen: '144', actions: '2', result: 'Completed', tone: 'ok' }
    ],
    generic: [
      { when: 'Today 6:00am', trigger: 'Daily', seen: '412', actions: '38', result: 'Completed', tone: 'ok' },
      { when: 'Yesterday 6:00am', trigger: 'Daily', seen: '412', actions: '31', result: 'Completed', tone: 'ok' },
      { when: 'Aug 29 6:00am', trigger: 'Daily', seen: '410', actions: '29', result: 'Completed', tone: 'ok' },
      { when: 'Aug 28 6:00am', trigger: 'Daily', seen: '410', actions: '34', result: 'Completed', tone: 'ok' },
      { when: 'Aug 27 6:02am', trigger: 'Daily', seen: '289', actions: '18', result: 'Partial — retried', tone: 'warn' }
    ]
  };

  SA.replayRows = {
    movein: [
      { subject: 'Marcus Alvarez', recordId: 'LSE-10442 · Maple Grove', facts: ['rent $1,485.00', 'rc none'], decision: 'Wrote a finding', tone: 'ok', icon: 'check_circle',
        why: 'The lease has a move-in date inside the window and no active recurring charge. That is unambiguous, so it wrote a finding and created the task rather than guessing an amount.',
        considered: [{ action: 'Create the recurring charge itself', reason: 'the agent cannot post charges — locked guardrail' }, { action: 'Notify the resident', reason: 'nothing for the resident to act on' }],
        dataSeen: ['Lease', 'Ledger', 'Charges', 'Units'], audit: 'run 0831-0204 · det movein-charges · 12ms · no writes' },
      { subject: 'Sofia Okafor', recordId: 'LSE-10468 · Riverside Commons', facts: ['rent $1,655.00', 'market $1,800.00'], decision: 'Wrote a finding', tone: 'ok', icon: 'check_circle',
        why: 'Rent is $145.00 under market, which is over the $100.00 threshold. The renewal is 41 days out so there is still time for a person to act.',
        considered: [{ action: 'Send a renewal offer', reason: 'pricing is a human decision at this property' }],
        dataSeen: ['Lease', 'Units'], audit: 'run 0831-0204 · det movein-charges · 9ms · no writes' },
      { subject: 'Wendell Ferris', recordId: 'LSE-10402 · Maple Grove', facts: ['rent $1,390.00', 'rc $1,390.00'], decision: 'No action', tone: 'neutral', icon: 'remove',
        why: 'The recurring charge matches the signed lease rent exactly and the lease is inside its term. Nothing to report.',
        considered: [], dataSeen: ['Lease', 'Charges'], audit: 'run 0831-0204 · det movein-charges · 6ms · no writes' },
      { subject: 'Colette Njoku', recordId: 'LSE-10389 · Oak Park Flats', facts: ['rc none', 'unit model'], decision: 'Excluded', tone: 'neutral', icon: 'block',
        why: 'The unit is flagged as a model unit, which the detection excludes. It would otherwise have matched on the missing recurring charge.',
        considered: [{ action: 'Write a finding', reason: 'excluded by the detection’s own scope' }],
        dataSeen: ['Lease', 'Units'], audit: 'run 0831-0204 · det movein-charges · 4ms · no writes' },
      { subject: 'Bram Oosterhuis', recordId: 'LSE-10375 · Riverside Commons', facts: ['rc none', 'ledger locked'], decision: 'Handed off', tone: 'warn', icon: 'alt_route',
        why: 'The lease looks unbilled but the ledger was locked by a month-end close, so the agent could not confirm whether a charge exists. It routed the record rather than assert something it could not verify.',
        considered: [{ action: 'Write a finding', reason: 'could not read the ledger to confirm' }, { action: 'Skip the record', reason: 'silent no-ops are not permitted' }],
        dataSeen: ['Lease', 'Units'], audit: 'run 0831-0204 · det movein-charges · 31ms · routed to Regional Manager queue' }
    ],
    generic: [
      { subject: 'Kestrel Plumbing Co.', recordId: 'VEN-2201', facts: ['paid $8,420.00', 'w9 none'], decision: 'Wrote a finding', tone: 'ok', icon: 'check_circle',
        why: 'Payments this tax year are well past the $600.00 threshold and no W-9 document is attached to the vendor record.',
        considered: [{ action: 'Email the vendor directly', reason: 'outbound to vendors is not in this agent’s scope' }],
        dataSeen: ['Vendors', 'Payments', 'Documents'], audit: 'run 0825-0501 · det w9 · 8ms · no writes' },
      { subject: 'Halvorsen Electric', recordId: 'VEN-2298', facts: ['paid $640.00', 'w9 none'], decision: 'Wrote a finding', tone: 'ok', icon: 'check_circle',
        why: 'The most recent invoice pushed year-to-date payments over the threshold. No W-9 on file.',
        considered: [], dataSeen: ['Vendors', 'Payments'], audit: 'run 0825-0501 · det w9 · 5ms · no writes' },
      { subject: 'Tidewater Roofing', recordId: 'VEN-2180', facts: ['paid $12,900.00', 'w9 on file'], decision: 'No action', tone: 'neutral', icon: 'remove',
        why: 'Over the threshold but a current W-9 is attached to the vendor record. Nothing to report.',
        considered: [], dataSeen: ['Vendors', 'Documents'], audit: 'run 0825-0501 · det w9 · 4ms · no writes' },
      { subject: 'Ridgeline Supply', recordId: 'VEN-2255', facts: ['paid $2,300.00', 'corp exempt'], decision: 'Excluded', tone: 'neutral', icon: 'block',
        why: 'The vendor is flagged corporate exempt, which the detection excludes from the W-9 requirement.',
        considered: [{ action: 'Write a finding', reason: 'excluded by the detection’s own scope' }],
        dataSeen: ['Vendors'], audit: 'run 0825-0501 · det w9 · 3ms · no writes' },
      { subject: 'Juniper Pest Control', recordId: 'VEN-2263', facts: ['paid $780.00', 'w9 expired'], decision: 'Handed off', tone: 'warn', icon: 'alt_route',
        why: 'A W-9 exists but its signature date is four years old, and the agent has no rule for how old is too old. It routed the vendor for a person to judge.',
        considered: [{ action: 'Treat it as missing', reason: 'no guardrail defines an expiry window' }],
        dataSeen: ['Vendors', 'Documents'], audit: 'run 0825-0501 · det w9 · 14ms · routed to Regional Manager queue' }
    ]
  };

  /* ---------------- schedule editor ---------------- */

  SA.scheduleIncludes = [
    { id: 'inc-prorate', label: 'Prorated first and last months', help: 'Charges partial months at the daily rate for move-ins and move-outs.', on: true },
    { id: 'inc-parking', label: 'Assigned parking and storage', help: 'Posts space charges alongside rent for leases with an assignment.', on: true },
    { id: 'inc-pet', label: 'Pet rent', help: 'Posts recurring pet rent where a pet is on the lease.', on: true },
    { id: 'inc-onetime', label: 'One-time charges dated in this period', help: 'Sweeps up charges someone dated into this run but did not post.', on: false }
  ];
  SA.scheduleBilling = [
    { id: 'bill-cre', label: 'Apply CRE setup caps', help: 'Honours per-lease escalation caps on commercial leases.', on: true },
    { id: 'bill-skipzero', label: 'Skip zero-dollar charges', help: 'A charge that computes to $0.00 is not posted at all.', on: true }
  ];
  SA.schedRecipients = [
    { kind: 'role', value: 'Property Manager', icon: 'badge', kindLabel: 'Role' },
    { kind: 'user', value: 'Dana Kessler', icon: 'person', kindLabel: 'User' }
  ];
  SA.schedAddOptions = [
    'Property Manager', 'Regional Manager', 'Controller', 'AP Manager',
    'Leasing Agent', 'Maintenance Supervisor', 'Owner'
  ];

  SA.schedPreviewRows = [
    { rec: 'LSE-10201', who: 'Wendell Ferris', charge: 'Rent', amount: '$1,390.00', date: 'Sep 1', status: 'Will post', tone: 'ok' },
    { rec: 'LSE-10204', who: 'Harriet Nakashima', charge: 'Rent + parking', amount: '$1,545.00', date: 'Sep 1', status: 'Will post', tone: 'ok' },
    { rec: 'LSE-10212', who: 'Grady Lindqvist', charge: 'Rent (prorated)', amount: '$259.68', date: 'Sep 1', status: 'Will post', tone: 'ok' },
    { rec: 'LSE-10218', who: 'Amara Diallo', charge: 'Rent − concession', amount: '$1,455.00', date: 'Sep 1', status: 'Will post', tone: 'ok',
      reason: 'A $200.00 concession is still active on this lease. Move-In Charge Integrity has an open finding saying it expired Jul 31.' },
    { rec: 'LSE-10229', who: 'Colette Njoku', charge: 'Rent', amount: '$0.00', date: '—', status: 'Skipped', tone: 'neutral',
      reason: 'Unit is flagged as a model unit. Zero-dollar charges are not posted.' },
    { rec: 'LSE-10442', who: 'Marcus Alvarez', charge: '—', amount: '—', date: '—', status: 'Not billed', tone: 'warn',
      reason: 'No recurring charge exists on this lease, so this run has nothing to post. This is one of the 9 findings from the Aug 1 run.' }
  ];

  /* ---------------- notification editor ---------------- */

  SA.notifAudiences = [
    { id: 'tenant', label: 'Resident', dot: 'var(--rmx-brand)', meta: 'Email + text · 2 contacts' },
    { id: 'pm', label: 'Property Manager', dot: 'var(--rmx-success)', meta: 'Email · resolves per property' },
    { id: 'regional', label: 'Regional Manager', dot: 'var(--rmx-warning)', meta: 'Email digest · weekly' }
  ];
  SA.notifContactOptions = [
    { id: 'primary', label: 'Primary resident', help: 'The first named resident on the lease.', on: true },
    { id: 'co', label: 'Co-residents', help: 'Everyone else named on the lease.', on: true },
    { id: 'guarantor', label: 'Guarantors', help: 'Anyone financially responsible but not living there.', on: false },
    { id: 'occupant', label: 'Occupants', help: 'Listed on the lease with no financial responsibility.', on: false },
    { id: 'emergency', label: 'Emergency contacts', help: 'Only for notices about entry or safety.', on: false },
    { id: 'agent', label: 'Authorised agents', help: 'A third party the resident named in writing.', on: false }
  ];
  SA.notifRecipients = [
    { name: 'Dana Kessler', addr: 'dkessler@lcs.com', type: 'Always add', tone: 'ok' },
    { name: 'Jonathan Cameron', addr: 'jcameron@lcs.com', type: 'Always add', tone: 'ok' },
    { name: 'Renee Ostrowski', addr: 'rostrowski@lcs.com', type: 'Exclude', tone: 'stop' }
  ];
  SA.notifTokens = ['{resident}', '{unit}', '{property}', '{lease_end}', '{balance}', '{manager}'];
  SA.smsTokensList = ['{resident}', '{unit}', '{balance}', '{due_date}', '{link}', '{property}'];
  SA.channelOptions = ['Email', 'Text', 'Both'];

  SA.notifDefaults = {
    subject: 'Your lease at {property} ends on {lease_end}',
    body: 'Hello {resident},\n\nYour lease for {unit} at {property} is scheduled to end on {lease_end}. If you would like to stay, reply to this message or contact {manager} and we will send a renewal offer.\n\nIf you plan to move out, we need written notice so we can schedule your move-out inspection.\n\nThank you,\n{property} Management',
    sms: '{property}: your lease for {unit} ends {lease_end}. Reply to talk about renewing, or let us know if you are moving out.'
  };
  SA.previewValues = {
    '{resident}': 'Marcus Alvarez',
    '{unit}': 'Unit 12-B',
    '{property}': 'Maple Grove',
    '{lease_end}': 'Nov 14, 2026',
    '{balance}': '$0.00',
    '{manager}': 'Dana Kessler',
    '{due_date}': 'Sep 1, 2026',
    '{amount}': '$1,485.00',
    '{link}': 'rmx.co/p/8f2a',
    '{agent}': 'Move-In Charge Integrity'
  };

  /* ---------------- AR sequence editor ---------------- */

  SA.arStepTemplates = [
    { label: 'Friendly reminder', day: '5', balOp: '> Greater than', balAmt: '25.00', charges: 'RC — Recurring charges', contacts: 'primary', msg: 'Email', tmpl: 'AR — friendly reminder',
      note: 'The first contact is deliberately soft. Most balances at this age are an oversight, not a hardship.' },
    { label: 'Late notice', day: '10', balOp: '> Greater than', balAmt: '50.00', charges: 'RC — Recurring charges', contacts: 'all', msg: 'Both', tmpl: 'AR — late notice',
      note: 'Names the late fee that has already posted and the balance including it.' },
    { label: 'Formal notice', day: '20', balOp: '≥ At least', balAmt: '250.00', charges: 'All charge types', contacts: 'all', msg: 'Email', tmpl: 'AR — formal notice',
      note: 'The last step before the file goes to a person. Wording is fixed by the compliance template.' },
    { label: 'Pre-eviction notice', day: '30', balOp: '≥ At least', balAmt: '500.00', charges: 'All charge types', contacts: 'responsible', msg: 'Email', tmpl: 'AR — pre-eviction',
      note: 'Delinquency Follow-Up reads this step. If it has already escalated the resident to a person, this step holds.' }
  ];
  SA.arContactOptions = [
    { id: 'primary', label: 'Primary resident only' },
    { id: 'all', label: 'Everyone on the lease' },
    { id: 'responsible', label: 'Financially responsible parties' },
    { id: 'guarantor', label: 'Guarantors as well' }
  ];
  SA.arMsgOptions = ['Email', 'Text', 'Both'];

  SA.notifPreviewRows = [
    { who: 'Marcus Alvarez · Unit 12-B', addr: 'malvarez@example.com', when: 'Today 8:00am' },
    { who: 'Priya Raman · Unit 3-C', addr: 'praman@example.com', when: 'Today 8:00am' },
    { who: 'Devon Ashworth · Unit 6-A', addr: 'no email on file — will be skipped', when: '—' }
  ];

  /* ---------------- quick-agent action settings ---------------- */

  SA.actionConfigs = {
    notify: {
      name: 'Notify a person or role',
      msgLabel: 'the message',
      fields: [
        { id: 'principal', kind: 'principal', label: 'Send to', span: '1 / -1' },
        { id: 'channel', kind: 'select', label: 'Deliver by', options: ['Email', 'Text', 'Both'] },
        { id: 'urgency', kind: 'select', label: 'Grouping', options: ['One message per record', 'One digest per property', 'One digest per run'] },
        { id: 'subject', kind: 'text', label: 'Subject', placeholder: 'Appears in the recipient’s inbox' },
        { id: 'body', kind: 'textarea', label: 'Message', span: '1 / -1', placeholder: 'What the recipient needs to know and what to do about it' }
      ]
    },
    task: {
      name: 'Create a task',
      msgLabel: 'the task description',
      fields: [
        { id: 'principal', kind: 'principal', label: 'Assign to', span: '1 / -1' },
        { id: 'priority', kind: 'select', label: 'Priority', options: ['Normal', 'High', 'Low'] },
        { id: 'due', kind: 'select', label: 'Due', options: ['In 3 days', 'In 7 days', 'End of month', 'No due date'] },
        { id: 'title', kind: 'text', label: 'Task title', placeholder: 'Short, imperative — what to do' },
        { id: 'desc', kind: 'textarea', label: 'Description', span: '1 / -1', placeholder: 'Include the record, the finding, and the fix' }
      ]
    },
    message: {
      name: 'Send a message from a template',
      msgLabel: 'the message',
      fields: [
        { id: 'principal', kind: 'principal', label: 'Send to', span: '1 / -1' },
        { id: 'template', kind: 'select', label: 'Template', options: ['Renewal reminder', 'Missing document request', 'Balance reminder', 'Move-in checklist'] },
        { id: 'channel', kind: 'select', label: 'Deliver by', options: ['Email', 'Text', 'Both'] },
        { id: 'subject', kind: 'text', label: 'Subject override', placeholder: 'Leave blank to use the template subject' },
        { id: 'body', kind: 'textarea', label: 'Additional note', span: '1 / -1', placeholder: 'Appended above the template signature' }
      ]
    },
    flag: {
      name: 'Flag the record',
      msgLabel: 'the flag note',
      fields: [
        { id: 'flagkind', kind: 'select', label: 'Flag', options: ['Needs review', 'Billing exception', 'Compliance hold'] },
        { id: 'visible', kind: 'select', label: 'Visible on', options: ['The register row', 'The record header', 'Both'] },
        { id: 'note', kind: 'textarea', label: 'Flag note', span: '1 / -1', placeholder: 'Why the record is flagged' }
      ]
    },
    finding: {
      name: 'Write a finding only',
      msgLabel: 'the finding',
      fields: [
        { id: 'severity', kind: 'select', label: 'Severity', options: ['Informational', 'Needs attention', 'Urgent'] },
        { id: 'queue', kind: 'select', label: 'Appears in', options: ['Agent Findings inbox', 'This agent only'] },
        { id: 'summary', kind: 'textarea', label: 'Finding text', span: '1 / -1', placeholder: 'What was found, why it matters, and the suggested fix' }
      ]
    },
    escape: {
      name: 'Hand it off to a person',
      msgLabel: 'the routing note',
      fields: [
        { id: 'dest', kind: 'select', label: 'Destination', options: ['Regional Manager queue', 'Controller queue', 'Compliance queue'] },
        { id: 'note', kind: 'textarea', label: 'Routing note', span: '1 / -1', placeholder: 'What the person receiving this needs to decide' }
      ]
    }
  };

  /* ---------------- picker dialog catalogue ---------------- */

  SA.pickTypeConfig = {
    Notifications: {
      title: 'New Notification',
      help: 'Pick the notification you want to set up. Each one already knows what it triggers on — you choose the audience, timing, and wording.',
      groupKey: 'notifGroup'
    },
    Schedules: {
      title: 'New Schedule',
      help: 'Pick the kind of run you want to add. The schedule type decides what it posts; you choose when it runs and who hears about it.',
      groupKey: 'schedType'
    }
  };

  /* ------------------------------------------------------------
     Charge corrections are resolved by a PERSON FILLING IN A FORM,
     not by the agent acting. Move-In Charge Integrity's own guardrail
     is "Agent cannot post or adjust a charge - locked", so the only
     honest resolution here is a form the user completes.
     A finding with a `form` renders the form dialog; one without it
     renders the agent-action dialog.
     ------------------------------------------------------------ */
  (function () {
    var byRec = {};
    SA.findings.movein.forEach(function (r) { byRec[r.rec] = r; });
    var GUARD = 'Orion found this and proposed the numbers, but it cannot post or ' +
      'adjust a charge \u2014 that guardrail is locked. You make the change.';

    byRec['LSE-10457'].form = {
      title: 'Correct recurring charge', submit: 'Save Charge', note: GUARD,
      fields: [
        { label: 'Charge type', value: 'Rent', ro: true, w: 'half' },
        { label: 'Current amount', value: '$1,485.00', ro: true, w: 'half' },
        { label: 'New amount', value: '$1,560.00', focus: true, w: 'half' },
        { label: 'Effective date', value: '09/01/2026', w: 'half' },
        { kind: 'check', label: 'Post a catch-up charge of $225.00 for June\u2013August', on: true },
        { label: 'Memo (optional)', value: 'Corrected to signed lease rent', w: 'full' }
      ]
    };
    byRec['LSE-10480'].form = {
      title: 'Correct recurring charge', submit: 'Save Charge', note: GUARD,
      fields: [
        { label: 'Charge type', value: 'Rent', ro: true, w: 'half' },
        { label: 'Current amount', value: '$1,295.00', ro: true, w: 'half' },
        { label: 'New amount', value: '$1,415.00', focus: true, w: 'half' },
        { label: 'Effective date', value: '09/01/2026', w: 'half' },
        { kind: 'check', label: 'Post a catch-up charge of $120.00 for August', on: true },
        { label: 'Memo (optional)', value: 'Corrected to signed lease rent', w: 'full' }
      ]
    };
  })();

  /* ------------------------------------------------------------
     Option lists for the agent editors. Every control that used to be
     a display-only box is a real select now, so any agent can be edited.
     ------------------------------------------------------------ */
  SA.scopeOptions = ['All properties (3)', 'Maple Grove', 'Riverside Commons', 'Cedar Point'];
  SA.windowOptions = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 90 days', 'All open records'];
  SA.conditionFields = ['Record status', 'Days since move-in', 'Recurring charge', 'Lease rent',
    'Concession end date', 'Balance', 'Contact method', 'Vendor W-9'];
  SA.conditionOps = ['is', 'is not', 'is greater than', 'is less than', 'is missing', 'is on or after'];
  SA.handoffOptions = ['Regional Manager queue', 'Property Manager queue', 'Accounting queue',
    'Dana Kessler', 'Marcus Webb'];
  SA.actionTargets = ['Property Manager', 'Regional Manager', 'Accounting', 'Leasing Agent', 'Resident'];
  SA.actionInputs = ['The record the detection matched', 'The lease on the record',
    'The resident on the record', 'The property on the record'];
  SA.findingTypeOptions = ['All finding types', 'Missing charge', 'Wrong amount', 'Expired concession', 'Needs review'];
  SA.findingAgeOptions = ['Any age', 'Under 7 days', '7-30 days', 'Over 30 days'];
})(window.SA = window.SA || {});
