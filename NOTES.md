# Implementation notes — Smart Agents v2

Implementation of `Smart Agents v2.dc.html` from Claude Design project
`419cda21-0a52-417c-ab41-4ad004e6a6fa`, against the RMX design system
`rmx-design-system-019dd9a2-6db7-79d2-bf37-c82345a95d1d`.

## Run it

Open `index.html`. No build, no server, no dependencies — classic `<script>`
tags in dependency order, so it works straight off the filesystem. The only
network fetches are the Google Fonts stylesheets the design's `<helmet>`
already loaded (Roboto + Material Symbols).

## What came from the design, and what did not

`DesignSync.get_file` caps a response at 256 KiB. Both `Smart Agents v2.dc.html`
and `Smart Agents.dc.html` are just over that, so **both truncate mid-script**.

Recovered in full:

| Source | Where it landed |
|---|---|
| The entire `<x-dc>` template — all five screens, ~2,070 lines | `css/app.css` + the `js/screen-*.js` views |
| `agents` (95 rows) | `js/data-agents.js`, verbatim |
| `detections`, `quickThen`, `agentDetId`, `detLibrary` (18) | `js/data-agents.js`, verbatim |
| `templates` — 16 of 17, from the v1 file, which truncated later | `js/data-agents.js` |
| `colors_and_type.css` | `css/rmx-tokens.css`, verbatim |
| `data-props` (`flowAnimation`, `density`) | `SA.props` in `js/state.js` |

**Not recoverable — authored here:**

1. **The component's derived getters and handlers.** The template references
   ~250 bindings (`rows`, `navItems`, `nodes`, `edges`, `summaryLines`,
   `arStepRows`, `notifRestate`, …). All of that sits past the cap in both
   files. It is reimplemented in `js/state.js` (state + actions) and the
   `screen-*.js` views, driven by the bindings the template actually asks for
   and the counts the recovered data asserts.
2. **Row-level demo content** — findings, replay rows, run history, canvas
   graphs, notification/schedule/AR editor content. All in
   `js/data-content.js`. It is pinned to the recovered data wherever the data
   constrains it: `findings: 9 / 3 / 12` on the three agents that have them,
   `arSteps: 4 / 2 / 3` on the three AR series, each template's `shape` string
   (`7 nodes · 3 actions` etc.) matching the graph actually built, and each
   detection's `result` string.
3. **`templates['t-delinq']`** — cut off in both files. Rebuilt from
   `detLibrary['reminder-futility']` plus the oversight copy on the AR and
   notification editors, which both name "Delinquency Follow-Up". Marked
   `RECONSTRUCTED` in the source.

If the cap is lifted, or the file is exported another way, the authored logic
in `state.js` is the layer to diff against the original.

## Deliberate departures from the design source

- **Duplicate ids.** `agents` contains two real id collisions carried over from
  the design (`wo` and `insurance` each appear once as a legacy automation and
  once inside the notification catalogue). Row identity is a generated `key`
  (`id#index`), so opening a row always opens *that* row. `id` is left intact
  because `agentDetId` and the findings map key off it.
- **Nav shape.** The template's `navItems` is a flat list with `pad`/`size`/
  `chevron` fields, which implies a tree but does not spell one out. It is
  built as Agents / Notifications / Schedules, with the notification groups and
  schedule types as expandable children (13 and 10 of them, matching
  `schedTypeOptions`' count of 11 including "All"). The chevron carries its own
  action so expanding a branch does not also navigate to it.
- **Component layer.** The design hand-rolls every element with inline styles
  over `--rmx-*` tokens; it loads `_ds_bundle.js` but never calls into it. Those
  inline styles are lifted into classes in `css/app.css`. Button variants and
  sizes mirror `window.RMX.Button` from the bundle (primary / secondary / ghost,
  36px default and 28px compact) so the two stay in step.
- **Unwired pickers.** Where the design drew a static dropdown with no options
  behind it (scope, property, escape-hatch destination, date windows), it is
  rendered as `.fauxfield` — visually identical, deliberately inert. Real
  controls are real.

## Architecture

`render()` rebuilds the whole app into `#app` on every state change. One
delegated listener on the root reads `data-act` (click) and `data-chg`
(input/change); `data-fk` keys let the caret and scroll position survive the
innerHTML swap. That is the same shape as the design's own runtime — `support.js`
compiled `{{ }}`, `<sc-for>` and `<sc-if>` into React — minus the build step.

```
index.html
css/rmx-tokens.css     vendored design-system tokens
css/app.css            component layer
js/data-agents.js      recovered datasets
js/data-content.js     screen content + canvas graph layout
js/ui.js               escaping, atoms, attribute builders
js/state.js            state, lookups, actions, derived values
js/chrome.js           header, left nav, dialogs, toast
js/screen-library.js   Agent Library + Agent Templates
js/screen-quick.js     Quick Agent
js/screen-rules.js     schedule / AR / notification editors
js/screen-agent.js     Agent Detail: canvas, inspector, findings, runs
js/screen-inbox.js     Agent Findings Inbox
js/main.js             render loop + event wiring
```

## Verification

A headless harness drives the real actions and renders every screen, tab,
canvas node, notification channel, AR step and dialog — 456 renders. It asserts
no exceptions, no `undefined` / `NaN` / `[object Object]` leaking into markup,
no empty `data-act` (which would swallow a wrapping row's click), no duplicate
`style` attributes, and that every emitted action name resolves to a registered
handler. It caught two real bugs: bare `toggle()` calls emitting `data-act=""`
and shadowing their label's click, and a duplicate `style` attribute silently
dropping a rule.

**Not verified in a browser.** Chrome tooling was unavailable in the session
that built this, so layout and interaction have not been eyeballed against the
design. Worth a pass at 1320px and up — the shell sets `min-width: 1320px`, as
the design does.

## Figma

The five screens are also pushed to a Figma design file:
**https://www.figma.com/design/vwBQ2Zzu50RJT7OEEzk69p** — page *Smart Agents v2 — 1920*,
in the **LCS - UI/UX** team (the only plan on this account with a Full seat).

- Five frames at **1920 × 1080**: Agent Library, Agent Templates, Quick Agent,
  Agent Detail · Build, Agent Findings Inbox.
- A **click-through prototype**: the flow starts at Agent Library, with 14 links
  (row → detail, New Agent → templates, nav → inbox, breadcrumbs back, template
  card → detail/quick, inbox agent links → detail).
- An **RMX Tokens** variable collection holding all 28 colours from
  `colors_and_type.css`.
- Table columns and the template grid are recomputed for the wider canvas
  (1684px main area → 4 template cards across, not 2).

### Real RMX library components

The frames were then rewired onto the actual published libraries, which turned out
to be subscribed to the file already — **RMX Components**, **RMX Foundations** and
**RMX Iconography**. Hand-built approximations were replaced with real instances:

| Replaced with | Count |
|---|---|
| `Material Icon` (RMX Iconography, instance-swap + Size/Color variants) | 88 |
| `Button` (Type / State / Size, text + leading-icon props) | 33 |
| `Orion Logo` (`Type=Orion-Icon`) | 27 |
| `Checkbox` (`Checked?` / `State=Blue`) | 17 |
| `Toggle Slider` (on/off, `Selected?`) | 11 |
| `Toggle Switch` (2-option segmented) | 2 |
| `Header` (the Express site header, 1920×48) | 5 |

Deliberately **not** swapped, with the reason:

- **32 icons stay as drawn vectors** (named `icon-custom/*`). RMX Iconography has no
  faithful equivalent for `smart_toy`, `campaign`, `inbox`, `account_tree`,
  `fact_check`, `radar`, `call_split`, `how_to_reg`, `alt_route`, `star` or
  `pause_circle`. Aliasing them to loosely-related icons (`radar`→`search`,
  `campaign`→`notifications`) would have been worse than a correct custom glyph.
  Only three aliases were accepted as honest: `expand_more`→`keyboard_arrow_down`,
  `list_alt`→`reports`, `event_repeat`→`calendar_today`.
- **Two 3-option segmented controls** (Sensitivity, Run schedule) were reverted to
  custom. The RMX `Toggle Switch` has fixed segment widths and clipped
  "Conservative" at the 376px inspector width.
- **Tabs** stayed custom. The RMX `Tabs` component is 218px wide per tab and
  carries no count badge; the agent-detail tab row needs three compact tabs with
  a count pill.
- **Context Bar Item** is no longer used directly — the RMX `Header` component
  already contains the menu / reports / favourites buttons and Command Launch,
  so the whole header was swapped wholesale instead (see below).

Two RMX behaviours worth a decision from the design team:

1. `Checkbox` `State=Default` renders **orange**, not brand blue. The source design
   specified brand blue, and RMX offers `State=Blue`, so the instances are set to
   `Blue`. If orange is the intended RMX default, flip all 17 to `Default`.
2. The custom RMX icons (`reports`, `lock`) ignore the `Color` variant — their fills
   are baked. The header instances have white fills applied as instance overrides
   to sit on the navy bar.

### Other known gaps in the Figma version

1. **The build canvas has no dot-grid background** — flat `#f5f8fa` instead.
   Tiling that pattern needs an image fill, and image creation is not available
   through this API.
2. **Long lists are clipped at the 1080 viewport**, as they are on screen:
   templates shows 8 of 17, the inbox shows 3 of 6 groups. The agent table shows
   all 6 agents.
3. **Frames are flat screen designs**, not components or variants — no component
   library was generated, and the token variables are not bound to the layers
   that use those colours.
4. Figma's own skill resources (`/figma-use`, `/figma-generate-design`) returned
   permission errors in the session that built this, so the build followed the
   gotchas documented on the tool itself rather than that guidance.

### Site header

The hand-built header was replaced on all five frames with the RMX **`Header`**
component (`Use=Default`), which is natively **1920 × 48** — an exact match for the
frame width. It supplies the real Rent Manager logo lockup, the separated
menu / reports / favourites buttons, Command Launch, the Company Code block, the
brand-blue bell and the avatar. The `Code#1772:0` property is set to
`lcs-rmexpress`, and the avatar initials are overridden `MG` → `DK`.

The RMX header has no **Agents kill switch** — that control is specific to Smart
Agents and was introduced by the source `.dc.html`. Because Figma does not allow
adding children to an instance, each frame's header is now a plain `Site header`
wrapper (1920 × 48) holding the RMX Header instance plus the kill switch
positioned as an overlay, computed to sit 24px left of the Company Code block.
The kill switch itself uses the real `Toggle Slider` component.

This also retired the last of the header approximations: the hand-drawn Rent
Manager mark and the joined context-button bar are gone.

## Bringing the HTML back in line with Figma

After the Figma frames were rewired onto the real RMX libraries, the HTML was
updated to match. The HTML renders icons as Material Symbols ligatures from the
CDN, which is what the design system README prescribes, so the alignment work is
about **naming and structure**, not about embedding artwork.

### Icons renamed to the names RMX actually uses

| Was | Now | Why |
|---|---|---|
| `expand_more` | `keyboard_arrow_down` | RMX Iconography names this icon `keyboard_arrow_down` (6 call sites) |
| `event_repeat` | `calendar_today` | no `event_repeat` in RMX; `calendar_today` is what it uses for scheduling |
| `list_alt` | `description` | the RMX header's Reports button uses a custom `reports` Express icon; `description` is the nearest Material Symbol |
| `star` | `grade` | the RMX header's favourites button uses `grade` |

### Icons with no RMX equivalent

These stay as Material Symbols in the HTML and as drawn vectors in Figma. They
render correctly in the browser, so the HTML is actually ahead of the Figma file
here — but if RMX ever adds them, both should be updated together:

`smart_toy` · `campaign` · `inbox` · `account_tree` · `fact_check` · `radar` ·
`call_split` · `how_to_reg` · `alt_route` · `pause_circle` · `add_task` · `sms` ·
`person` · `block` · `history` · `delete` · `build` · `badge`

### Header rebuilt against the RMX `Header` component

- **Context buttons are now individually rounded with a 6px gap.** They were
  wrong before — I had them fused into one joined bar with dividers.
- **Search field is its own 4px-radius field**, 450px, no longer sharing a
  rounded edge with the button group.
- **The bell is brand blue** (`.hdr__bell`), not white.
- **Company Code is a right-aligned two-line block** in a `.hdr__manage`
  cluster, mirroring the component's Leading Content / Command Launch / Manage
  grouping.
- **The logo lockup is scaled to the component's 32px height** (mark 30px,
  wordmark 19px), approaching its 175 × 32 footprint.
- **The kill switch moved out of the right-hand cluster** and now sits in the gap
  between Command Launch and Manage, matching where it is positioned in Figma.
  It is not part of the RMX component — it is specific to Smart Agents.

### Brand marks — both now official RMX artwork

**Rent Manager logo.** Exported from the `Header` component as SVG and shipped
at `assets/logo-rentmanager.svg` — 175 x 32, 15 paths, all white-filled for the
navy bar. `js/chrome.js` references it as an `<img>` (`RM_LOGO`) rather than
inlining 10KB of path data; `.hdr__logo` sizes it to the 32px lockup height. The
hand-traced `RM_MARK` SVG and the fake `.hdr__wordmark` text are gone.

**Orion mark.** The Figma export came back as a 20 x 20 PNG, which was unusable —
the mark is drawn at 16, 20, 22, 24, 26 and 28px on these screens. So the
geometry was pulled straight out of the `Orion Logo` component
(`Type=Orion-Icon`) through the plugin API instead: `vectorPaths` with
coordinates rounded to 2dp on a 20-unit viewBox, which took it from 12.3KB of
full-float data down to 3.8KB and is visually lossless. It now lives in
`SA.ORION_SYMBOL` in `js/chrome.js` as a 5-path `<symbol>`, and also standalone
at `assets/orion-mark.svg`.

Two consequences worth knowing:

- The symbol viewBox changed from `0 0 32 32` to `0 0 20 20`, so `SA.orion()` in
  `js/ui.js` was updated to match. Any new call site must use the 20-unit box.
- The real mark carries **fixed brand fills** (#6eb744 green, #008dd5 brand blue,
  #13314c navy) rather than `currentColor`, so it is deliberately not tintable.
  The `color` argument to `SA.orion()` is now inert — kept only for call-site
  compatibility. The old trace used #2b7de1 for the blue; the real artwork uses
  the brand token #008dd5.

Verified: all 5 paths fall inside the 20 x 20 viewBox, and the two page-name
transfer chunks splice cleanly at a cubic control-point boundary.

### Checkbox fill is now one token

`--rmx-checkbox-fill` in `css/app.css` defaults to `--rmx-brand`, matching the
source design and the RMX `Checkbox` `State=Blue` variant used in Figma. If the
team confirms RMX's orange `State=Default` is correct, change that single token
to `--rmx-warning`.

## Workspace, menu, Administration, and the findings dialog

### Where the canonical designs came from

`RMX Pages` (`5XEzI94nmZsWE7rQQ7OIHP`). Worth recording a tooling limit: **that
file's pages are not enumerable** — `get_metadata` reports a single `Thumbnail`
page, `figma.root.children` sees only that page, and setting a selection to read
ids back does not work either. Nodes are reachable only by an id someone hands
you. The two section links provided (`2421:77120` Admin Pages, `2143:11725`
General Pages) were fetched at 1:1 and cropped locally with System.Drawing to
read the Administration and Workspace screens.

### Figma — new frames

| Frame | Notes |
|---|---|
| `00 · My Workspace` | Canonical: blue context bar, "Welcome, Charlie", four tiles (My Favorites, My Reports, Announcements, My Training) with coloured top accents and grouped link lists. **The prototype now starts here.** |
| `06 · Administration` | Canonical: title bar with "Find an item", 14-item left rail, 4-column grid of icon + title + italic description under ruled headings. Built with **Automation** active in the rail, which is how the page behaves when that category is picked — and which puts Smart Agents in view. |
| `07 · Main Menu` | Deliberately *not* the full mega menu. A scrim plus a 260px panel over the workspace: Workspace / Dashboard / **Administration** / modules. Enough to reach Admin, nothing more. |
| `5b · Finding Action` | The findings dialog — see below. |

### Smart Agents in the Administration IA

Added under **Automation → General**, as a peer of `Automated Notifications`,
using the real RMX `Orion Logo`. That group already holds the surfaces Smart
Agents supersedes: Automated Notifications, and the Task Automation list
(Recurring Charges, Late Fees, GPR, Recurring ePay, Accounts Receivable,
Tenant Statements, Utilities, Loans Receivable…).

### The Agent Findings action dialog

A finding's action no longer fires from the row. It opens a dialog that states
what was found, why it matters, and exactly what the action will do — then offers
two paths: **Complete Action**, or **jump to the impacted account**.

- Figma: frame `5b · Finding Action`, wired from all **9** action buttons in the
  inbox (`Add Charge`, `Correct Charge`, `End Concession`, `Request W-9`).
- HTML: `SA.state.dialog === 'findingAction'`, driven by `A.inboxAction` and by
  the Findings-tab `Fix` button, both routed through `SA.findingByKey()`.

**Open gap:** "Open LSE-10442" is intentionally a dead end. There is no tenant /
lease record screen in either the prototype or the HTML, and inventing one
without a canonical design would be guesswork. In Figma the button is present but
unwired; in the HTML it raises a toast saying the record view is out of scope.
Point me at the RMX Pages frame for a lease or tenant record and it becomes a
real jump.

### Prototype-wide corrections

Applied to Figma **and** the HTML, since they are the same product:

- **No breadcrumbs.** Rent Manager does not use them. All three breadcrumb rows
  are gone; back-navigation now lives on the blue context bar's `‹` chevron.
- **Bright blue context bar** added to every Smart Agents screen —
  `‹ Smart Agents`, `‹ Smart Agents: Move-In Charge Integrity`, etc. This is the
  RMX pattern (cf. `‹ Personal Preferences: Interface` on the canonical admin
  sub-pages) and it replaces what the breadcrumbs were doing.
- **Notifications and Schedules removed from the left rail**, and the **robot and
  inbox icons removed** — the rail is now text-only Agents + Agent Findings.
  In the HTML the rule editors in `screen-rules.js` are *retained*, not deleted:
  they are simply unreachable while those two rail entries are absent. Deleting
  ~600 lines of design-faithful editor code seemed the wrong call for a nav
  change; restoring two `navItem` calls brings them back.
- 29 prototype links; flow starting point is `00 · My Workspace`.

### Two bugs found and fixed along the way

1. **72 orphaned `Material Icon` instances** had accumulated on the Figma page
   root. `createInstance()` appends to the current page, so every instance whose
   re-parenting threw was left behind by earlier passes. Cleared.
2. **Icon-only RMX Buttons showed the literal text "Button"** — the swap left
   `Show Text` true on buttons that had no label. 11 fixed.

### Still Figma-only

The HTML has no Workspace, Administration, or menu — those three are prototype
frames. If the app should carry them too, that is a separate build.

## Menu wiring, and correction-as-form

### The menu button

It was only wired on two frames (`00`, `06`), so it was dead everywhere else.
Now wired on **all 8 frames**, two ways for redundancy:

1. a `hotspot/menu` rectangle at `x 667, y 7, 48 x 34` — verified against the
   real button, whose icon sits at `x 676..696, y 14..34` inside the RMX Header —
   appended last so it is the front-most child;
2. the header instance's own nested `Menu` layer, which also accepts a reaction.

### The flow starting point

`flowStartingPoints` was **already** set to `00 · My Workspace` and verified as
such. If the prototype still opens elsewhere it is the launch path, not the file:
a Figma prototype URL carries its own `starting-point-node-id`, so a previously
opened tab or shared link keeps reopening the frame it was pinned to, and
pressing Present with another frame selected starts from that frame.

- Explicit link: `…/proto/vwBQ2Zzu50RJT7OEEzk69p/…?node-id=37-1164&starting-point-node-id=37-1164`
- `00 · My Workspace` has also been moved to be the **first frame** on the page,
  so Present-with-nothing-selected lands there.

### Correcting a charge is a form, not an agent action

The distinction is real and it comes from the agent's own guardrail:
Move-In Charge Integrity is locked as **"Agent cannot post or adjust a charge"**.
So a missing charge and a wrong charge resolve differently:

| Finding | Resolution | Why |
|---|---|---|
| No recurring charge (`Add Charge`) | Agent action — **Complete Action** | The lease states the rent; the agent proposes and the person approves the act |
| Rent below signed lease (`Correct Charge`) | **Form the person fills in** | Requires a human-entered value; the agent may not adjust a charge |

- **Figma:** new frame `5c · Correct Charge`. Fields: Charge type and Current
  amount (read-only), **New amount** (focused) and Effective date (editable), a
  catch-up checkbox, and a Memo. Footer is Cancel / Open LSE-10457 / **Save
  Charge** — no "Complete Action". An amber note carries the reason: *"Orion
  found this and proposed the numbers, but it cannot post or adjust a charge —
  that guardrail is locked. You make the change."* Both `Correct Charge` buttons
  rewired to it; `Add Charge` and `Request W-9` still go to `5b`.
- **HTML:** data-driven. A finding with a `form` spec renders the form dialog via
  `SA.formBlock()`; one without renders the agent-action dialog. Specs live at the
  bottom of `js/data-content.js`.

**Left as-is deliberately:** `End Concession` (LSE-10491) still routes to the
agent-action dialog. It arguably belongs in the same class as Correct Charge —
it needs a human-entered end date — but only Correct Charge was asked for, so I
did not widen it. Say the word and it becomes a form too.

### Also fixed

The icon-only snooze buttons were still rendering the RMX Button component's
default **"Button"** label. Setting `Show Text#2324:0` to false did not take, so
the nested text node's `visible` is now overridden to false — **27** instances.

## The HTML app caught up with the prototype

Everything that existed only in Figma now exists in `index.html` too.

### New screens

| File | Screen |
|---|---|
| `js/screen-workspace.js` | **My Workspace** — the app's landing screen. Blue context bar (`My Workspace` / `My Dashboard →`), greeting, and four tiles: My Favorites, My Reports, Announcements, My Training. |
| `js/screen-admin.js` | **Administration** — title bar with "Find an item", 14-item category rail, four-column grid of icon + title + italic description under ruled headings. Opens on **Automation**, where **Smart Agents** sits under General next to Automated Notifications. |
| `js/data-rm.js` | The Rent Manager shell content for both, plus the menu. |

### Wiring

- **The app now boots on the Workspace** (`state.screen = 'workspace'`), matching
  the prototype's flow starting point.
- **The header menu button works** — it was `act('noop')`, now `act('openMenu')`.
  It opens the same short menu as the prototype (Workspace / Dashboard /
  Administration / modules), rendered as a scrim + panel anchored under the
  header rather than a centred dialog.
- **Administration → Smart Agents** routes into the agent library.
- **The context bar is screen-aware**: the Workspace gets its own bar,
  Administration gets none (it carries the white title bar instead, per the
  canonical design), and the Smart Agents screens keep `‹ Smart Agents: …`.
- The Workspace and Administration render **without the Smart Agents left rail** —
  it belongs to the Smart Agents section, not the Rent Manager shell.
- Only the Administration categories the prototype shows (Automation, Import,
  Preferences) have content; the rest land on an explicit "not built out in the
  prototype" state rather than faking depth.

### Copy and control changes

- **"Canvas agent" → "Workflow agent"** everywhere it names the agent type — the
  library rows, the template cards, the promote dialog and its toast. In Figma,
  9 text nodes. The word *canvas* is retained where it refers to the editing
  surface itself (the build canvas, `canvasNode`, "the canvas is read-only"),
  which is a different thing.
  Worth noting: a workflow-type agent now reads "Workflow agent" next to a
  "Workflow" type badge. Say the word if that redundancy should be resolved.
- **The All / Data health / Workflow filter chips are gone**, from the HTML
  library screen and from the Figma frame (3 chips). Six agents do not need
  filtering. The item count stays.

### Verification

The harness now loads the two new screen modules and asserts the Workspace tiles
and their links render, the menu panel contains Administration, the Administration
page shows Automation with Smart Agents and the Task Automation list, every rail
category renders, Administration emits **no** blue context bar, and the filter
chips are absent from the library. **499 renders, 0 problems.**

### The Rent Manager logo goes home

Clicking the logo lockup returns to My Workspace, the standard app-shell
convention.

- **HTML:** `.hdr__brand` carries `act('goWorkspace')` and a pointer cursor.
- **Figma:** a `hotspot/logo` rectangle on all **9** other frames (not on the
  Workspace itself — a self-navigation is invalid and pointless), each linked to
  `00 · My Workspace`.

The hotspot is measured from the header instance at run time rather than
estimated. First attempt matched the `Leading Content` wrapper and produced a
**643px-wide** hotspot, which would have made most of the empty header navigate
home; retargeted to the `Logo` node it is **187 × 44** at `x 10, y 2`. Verified
it ends at x=197 while the menu hotspot starts at x=667, so the two do not
overlap, and the menu hotspot is re-appended last to stay front-most.

## Workspace and context bar geometry, measured not guessed

The first pass at both was eyeballed off a low-resolution crop and was wrong.
The canonical RMX Pages workspace was re-measured by scanning pixel colour
transitions in a 1:1 render (System.Drawing, scanning for `#13314c`, `#008dd5`
and `#f58220` boundaries), which gives exact values rather than estimates.

| | Canonical | First pass | Now |
|---|---|---|---|
| Header height | 48 | 48 | 48 |
| **Context bar height** | **40** | 28 | **40** |
| Content top | 88 | 76 | 88 |
| Greeting top | 126 | ~114 | 126 |
| Tiles top | 201 | ~186 | 201 |
| **Tile row inset** | **66** | 46 | **66** |
| Tile gap | 20 | 16 | 20 |
| My Favorites | 551 | flex 1.6 | 551 |
| My Reports | 384 | flex 1.1 | 384 |
| Announcements | 316 | flex 1 | 316 |
| My Training | 316 | flex 1 | 316 |
| Tile top accent | 3 | 3 | 3 |

Two findings worth calling out:

1. **The context bar is 40px, not 28.** That was wrong on every screen, not just
   the workspace — all 9 Figma frames and the HTML are corrected, with the body
   heights reflowed so the frames stay 1080 tall.
2. **The tile row is not an even flex row.** The four tiles have fixed widths and
   there is a wide gap (~190px) between My Reports and Announcements — the layout
   reads as two clusters, left and right, not four equal columns. Reproduced with
   fixed widths plus a flexible `wstiles__gap` / `cluster gap` spacer between the
   second and third tile, so it stays responsive without inventing an even split.

The measured values are now asserted in the harness against `css/app.css`, so a
future edit that drifts off the canonical metrics fails the run.

---

## Session update — 2026-08-31

**The HTML app is the live artifact. Figma is frozen** at the user's
instruction ("we can stop updating figma now / the html proto is where we
live"). Everything below is HTML unless it says otherwise.

### Workflows are VERTICAL

The ask read "build all workflows horizontally"; asked to confirm the axis, the
answer was **"i want VERTICAL"**. `SA.layoutGraph` in `js/data-content.js` was
rewritten:

- `graph.cols` is now read as a list of **levels, top to bottom**.
- Nodes inside a level sit **side by side**, so a branch fans out sideways and
  the flow stays short rather than tall.
- Constants: `NODE_W 214`, `SIB_GAP 24`, `LEVEL_GAP 52`, `PAD 40`.
- Every node in a level shares the level's height, so connectors leave from one
  straight line.
- `estHeight()` mirrors the `.node` CSS box (padding, borders, flex gap, the
  24px `.node__top`, then title 13/18, sub 12/16, meta 11 mono). Nodes render
  with `min-height`, so an under-estimate would let a tall node collide with the
  level below — the harness checks for overlap on both axes.
- Solid edges drop straight down as vertical beziers. The **dashed hand-off
  branch skips a level**, so it is routed out to a channel at `canvasW - 18` and
  back in; a straight line would cut through the action row.
- `.canvas__inner` gained `margin: 0 auto`, so the graph is centred.

Canvases: movein 770x924, credit 1008x944, bill 1008x906, prospect 1008x872.
The canvas scrolls — expected for a vertical flow.

Figma frame `04 - Agent Detail` was rebuilt to match before the freeze
(graph 728x869, hand-off edge on the right channel) and verified by screenshot.

### "Escape hatch" is now "Hand Off"

Jargon, and not friendly. Renamed across data, canvas, inspector, quick view,
replay, and Figma (3 text nodes). Node kind **Hand Off**; field label
**Hand-off destination**; replay decision **Handed off**; and "anything that
matches no branch is handed off to a person". Internal ids stay `escape` — not
user-visible. The harness fails if "escape hatch" appears in any render.

### Schedules say how often, never when

Two requests, one rule. First: notification schedules cannot have specific
times. Then: remove specific days and times from the scheduled agents too.

Applied everywhere a schedule is *defined*:

| Was | Now |
|---|---|
| `Schedule - Lease end date approaches - Daily 7:00am` | `... - Daily` |
| `Weekly, Mon 4:30am` / `Weekly, Mon 5:00am` | `Weekly` |
| `Nightly 2:00am` | `Nightly` |
| `Daily 7:00am` / `Due date + offsets - Daily 6:00am` | `Daily` / `... - Daily` |
| `Monthly - Run day 1 - Post day 1` | `Monthly` |
| `Semi-monthly - Run days 1 and 15` | `Semi-monthly` |

22 trigger strings rewritten in `js/data-agents.js`. Also:

- Canvas trigger nodes lost their times and cron meta lines
  (`Nightly at 2:00am` + `cron 0 2 * * *` -> `Nightly`).
- The **trigger inspector** no longer offers weekday, month day, or
  hour/minute/AM-PM. It keeps "How often" and states the rule: "Agents run with
  Rent Manager's scheduled run. You choose how often — the specific day and time
  are not yours to set."
- The **schedule editor** dropped "on day N ... at 2:10am" and the "Next run"
  card now reads "Next scheduled run".
- The **notification editor** never had a time control; it now says so
  explicitly.

**Run-history timestamps are kept on purpose** (`Today 2:04am`, `Aug 30 2:04am`,
`Mon 5:01am`). Those record when a run actually happened; a run log without
times would be useless. Only the schedule *labels* were stripped.

### Findings resolve through a real RM form

The findings dialog was still shaped like an agent step. New file
**`js/data-forms.js`** gives **all 24 findings** a form spec — one builder per
action type (Add Charge, Correct Charge, Review -> Create Task, End Concession,
Request W-9, Add Contact), values derived from each finding's own numbers. The
two hand-authored Correct Charge forms are lifted into the sectioned shape so
their exact figures survive.

The dialog is now a Rent Manager form: sections with underlined headers, labels
above 34px controls, red required asterisks, real `<input>` / `<select>` /
`<textarea>` bound to `state.formVals`. The agent's reasoning is **demoted to a
disclosure** ("Why Orion suggested this") below the form instead of leading it.
Footer: Cancel | Open <record> | <Save...>.

### Every agent is editable

All 95 agents already resolved to an editor; the blocker was that the controls
were display-only. 14 `fauxfield` boxes and 4 static checkboxes became real
state-bound controls via new helpers `SA.pick(key, list, def)` and
`SA.chk(key, def, label)`, with option lists in `js/data-content.js`
(`scopeOptions`, `windowOptions`, `conditionFields`, `conditionOps`,
`handoffOptions`, `actionTargets`, `actionInputs`, `findingTypeOptions`,
`findingAgeOptions`). Condition-row keys are scoped per node
(`cond-f-<nodeId>-<i>`) so two condition nodes cannot share a value.

### Node palette is wired

Was a toast. Now:

- `SA.workGraph(agentId)` hands out a **working copy** of the graph, held in
  `state.graphs`; the authored spec in `SA.graphs` stays pristine as the reset
  baseline (asserted by the harness).
- `addNode(label)` drops the node as a **sibling in the level below the selected
  node**, so it fans out sideways in keeping with the vertical layout, and wires
  `selected -> new`. The hand-off always stays the last level. With nothing
  selected it attaches under the deepest non-hand-off level.
- `removeNode(id)` only removes nodes the user added; authored nodes are
  protected. The inspector shows a delete button on added nodes only.
- `resetCanvas()` discards edits; a Reset button sits at the foot of the palette.
- With agents disabled company-wide the canvas is read-only.

### Workspace and menu rebuilt from live screenshots

Earlier geometry came from the RMX Pages design; the user supplied screenshots
of the **running app**, which differ. Measured at 1920:

| Thing | Value |
|---|---|
| Header | 46px (the RMX `Header` component is 48 — the live app wins) |
| Context bar | 30px, 15px type, "My Workspace" left / "My Dashboard ->" right |
| Side margins | 135px |
| Greeting | "Welcome, Ali" 24/32 centred at y120, sub 13/18 at y158 |
| Tiles | y205, height 492, gap 20 |
| My Favorites | 730px, **three** columns of group cards |
| My Reports | 520px, **two** columns |
| Announcements | 360px, **orange** top accent, eye-slash icon, scrolls |
| My Training | **not a tile** — a link pinned bottom-right |
| Group card | bordered, 36px colour-chip icon, links indented 46px to the title |

The canvas is decorated, not flat: diagonal hatch top-left, a pale blob behind
the greeting, a bottom wave, and a dot grid bottom-centre (CSS gradients plus
two pseudo-elements).

The **Main Menu** was a plain list; it is now the real panel — 1320x488 centred
6px under the header, a top row of six destinations (Workspace, Dashboard,
Administration, Full Menu, Search, Help), a seven-module rail down the left with
the selected module filled blue and pointing into the content, column groups
with blue-underlined headers, and a footer of setup/report entries plus
`Version 12.260751`. Rental Info is transcribed in full; the other six modules
carry enough to read as real. Only **Workspace** and **Administration**
navigate — the destinations this prototype needs.

Header details: company code `lcs-bateam`, avatar `AF`, a red unread badge of 2
on the bell, and the menu button lights up while the menu is open.

### Harness

`smoke.js` is at **568 renders, 0 problems**. Added this session: the RM form
(all 24 findings have one, fields really edit, checkbox toggles, reasoning
collapsed by default), no rendered "escape hatch", no schedule day/time anywhere
a schedule is defined, the live workspace and menu geometry, the menu rail
switching modules, and full node-palette coverage including spec immutability
and the disabled-state lockout. The summary line was moved to the end of the
file so appended blocks actually run.

### Still open

- The HTML has **never been opened in a browser** in any session — no browser
  tooling has been available. Everything is verified by the headless harness and
  by reading the CSS, which cannot catch a purely visual regression.
- Figma is now behind the HTML on the workspace, the menu, header details, the
  findings form, the palette, and the schedule copy. Deliberate.
- "Open <record>" is still a deliberate dead end — no lease/tenant record screen
  exists in the prototype.
- `SA.trigWeekdayOptions` / `trigMonthdayOptions` / `trigHourOptions` /
  `trigMinuteOptions` and the `setTrigMeridiem` action are now unreferenced.
  Left in place rather than risk breaking a reference; safe to delete later.
- RMX `Checkbox` `State=Default` is orange; the prototype uses `State=Blue`.
  Still awaiting a team decision.

---

## Session update — 2026-09-15 — running on localhost, first RMX-accuracy pass

The app is now served at `http://localhost:4581` (`.claude/launch.json`, `smart-agents`
config) instead of only opening from `file://`. Verified end-to-end in a real
browser for the first time — Menu -> Administration -> Smart Agents -> Agent
Library, Agent Detail (build canvas, findings, runs), Agent Findings Inbox all
render and click through with no console errors.

**Figma was not authenticated this session** (`plugin:figma:figma` requires
auth this environment doesn't have). Everything below came from the
`rmx-prototyping` skill's bundled harvest (`data/*.json`, `assets/tokens.css`,
`assets/icons.svg`, dated 2026-09-10) rather than a live pull — flagged per
the skill's rule for when the library can't be reached.

### Icons: ligature font -> real SVG

The Material Symbols Google Font (ligature spans, `smart_toy` etc.) is gone —
the skill is explicit that an icon font "renders every icon as its own name"
once offline, and it's the wrong delivery mechanism regardless. Replaced with
an inline sprite (`SA.ICON_SPRITE`, generated into `js/icons-sprite.js`,
injected once per render next to `SA.ORION_SYMBOL`) and a rewritten
`SA.icon()` in `js/ui.js` that emits `<svg><use></svg>` instead of a span.

- **23 icon names** used in this app matched the skill's harvested RMX
  Iconography core exactly (`add`, `check`, `person`, `schedule`, `search`,
  `mail`, `notifications`, `chevron_right`, `keyboard_arrow_down`, …) — real
  RMX geometry now, sourced from `assets/icons.svg`.
- **29 names have no RMX equivalent available this session** — 15 of them
  (`account_tree`, `radar`, `call_split`, `how_to_reg`, `alt_route`,
  `pause_circle`, `add_task`, `sms`, `block`, `history`, `delete`, `build`,
  `badge`, `fact_check`, `campaign`) were already confirmed absent from RMX
  Iconography by the 2026-08-31 Figma session above; the other 14
  (`apps`, `school`, `play_arrow`, `undo`, `bolt`, `account_balance`,
  `assignment_ind`, `attach_money`, `auto_awesome`, `home_work`, `menu_book`,
  `savings`, `settings_suggest`, `visibility_off`) are new since then and were
  never checked against the library. All 29 are real Google Material Symbols
  Outlined geometry (the same glyphs the ligature font was already drawing —
  visually unchanged from before), fetched as static SVG and stored in
  `assets/icons-local.svg`, **each with a `data-provisional` attribute**
  naming why. Nothing was hand-drawn. Swap for a real RMX harvest once Figma
  access is available — see the two lists above for which ones actually need
  checking versus which are already known gaps.
- `assets/icons.svg` (RMX core, 63 symbols) and `assets/icons-local.svg`
  (provisional, 29 symbols) are the source files;
  `node <skill>/scripts/…`-style regeneration isn't wired up here — both were
  hand-copied into `js/icons-sprite.js` by a one-off script. Regenerate that
  file from the two `.svg` sources if either changes.

### Checkbox colour — the open question from 2026-08-31 is answered

The skill states plainly: RMX Checkbox `State=Default` is orange
(`--icon-attention` #F58220), and blue is *only* `State=Blue`/`State=Register`
(the select-all above a register). This app has exactly one register with
row selection — the Findings tab's table (`.tbl` in `screen-agent.js`,
`selectAll` / `selectFinding`) — everything else (scope filters, "no end
date", catch-up charge, W-9 attach, consent, …) is a standalone form
checkbox. So: `--rmx-checkbox-fill` in `css/app.css` now defaults to
`--rmx-warning` (orange), with a scoped override — `.tbl .check--on` — keeping
the findings register's checkboxes blue. Verified both via computed style
(`rgb(245,130,32)` standalone, `rgb(0,141,213)` in the register).

### Type — one real weight fixed

`--rmx-h3-weight` was `500`; RMX Foundations' `Web/Heading/S` only ships
SemiBold (600) and Regular (400), no Medium. Changed to `600`. `h1`, `h2`,
`h4` and body already matched a real named style's size/weight/line-height
exactly and were left alone. `--text-label` in the skill's tokens is marked
`[N]` (name-confirmed, value **not** verified) at brand blue — did not apply
this to field labels, since blue static labels above inputs would be an
unusual, unverified change; flagging rather than guessing.

### Not yet touched

This was a foundation-layer pass (tokens, type, icons, checkbox colour) — it
did not go component-by-component. Buttons, tabs, dropdowns, tiles and
register anatomy haven't been checked against `references/controls.md`,
`references/surfaces.md`, `references/data-display.md` or
`references/page-patterns.md` yet.

---

## Session update — 2026-09-15 (cont.) — My Workspace rebuilt from the canonical Figma frame

Figma access came back this session (it was unauthenticated for the pass
above). Pulled the real frame — `5XEzI94nmZsWE7rQQ7OIHP`, node `4969:70308`
"My Workspace" — via `get_design_context` on each tile instance, and rebuilt
`js/screen-workspace.js` and the Workspace section of `js/data-rm.js` from it
directly, rather than the live-screenshot measurements the 2026-08-31 session
used. That session's geometry (30px context bar, 3-column Favorites, Training
as a corner link) is now superseded for the Workspace by this canonical pull.

**Four tiles, not three.** My Favorites and My Reports (558px, two columns
each) are unchanged in kind but every group and link is rewritten to match
the real cards — Rental Info/Communication/Owners/Admin then
Services/Accounting/Receivables/Payables, each with the group's real link
list (e.g. Rental Info: Tenants, Prospects, Units, Properties, Unit Types,
Assets, Violations, Merge Prospects). **My Training is now a real tile**
(314px, orange overline), not a corner link — a Rent Manager University
sign-in card: logo, "Connect your account..." copy, an Email field, an
orange Sign In button.

**Group colour is one property per group, not per tile.** Read off each
card's real Icon Wrapper fill and confirmed consistent everywhere the group
appears: Rental Info/Receivables green (`--icon-success` #6eb744),
Communication/Owners orange (`--icon-attention` #f58220), Admin/Payables
amber (`--icon-notice` #faa61c, a new token — distinct from attention-orange),
Services/Accounting blue (`--icon-primary` = `--rmx-brand`). Two new tokens
in `css/rmx-tokens.css`: `--rmx-notice` (#faa61c) and `--rmx-border-success`
(#a8d48f, the *lighter* green used only for tile overlines, distinct from
`--rmx-success`).

**Tile overlines are each their own colour**, read from each tile's real
border token: Favorites `--border-secondary` (brand blue), Reports
`--border-success` (light green, the new token), Announcements
`--border-notice` (#f79b4d — already had this value as `--rmx-warning-soft`,
just hadn't been wired to a tile), Training `--border-attention` (orange).

**Announcements and Training are hideable, per the design's own
"Hidden Tiles" row.** Both headers carry the real `visibility_off` icon
(Favorites/Reports keep `more_vert` instead — a kebab options menu, not a
hide control — matching the design exactly). Clicking it now hides the tile
and adds a restore chip to a row along the bottom of the tile area, matching
the Figma "Hidden Tiles" frame; clicking the chip brings the tile back.
New state: `state.wsHidden`, actions `hideWsTile` / `restoreWsTile`.

**One content call worth flagging:** the design's second "Hidden Tiles"
chip is literally labelled "My Workspace" in Figma, but carries the `school`
icon and sits paired with the Announcements chip — restoring the *workspace
itself* makes no structural sense as a hidden-tile chip, and the icon says
Training. Implemented as "My Training" (real name, real icon) rather than
replicating what reads as a copy-paste slip in the source file. Worth a
sentence to whoever owns that frame.

**Announcement content is real**, not the placeholder set that was there
before: "Tenant Transfer Wizard" and "Lease Renewal Enhancements", both
dated January 21, 2026, both a `NEW` lozenge (solid `#195ca4` — a literal
override in the source, not a token), with the same generic screenshot
artwork Figma reuses on both cards (now `assets/ws-announcement-art.png`).

**New assets:** `assets/rmu-logo.png` (the Rent Manager University lockup —
Figma builds it from a vector wordmark plus a cropped raster slice for
"UNIVERSITY", but the full underlying raster already renders both lines
correctly on its own at the same aspect ratio, so it's used directly rather
than reproducing the crop) and `assets/ws-announcement-art.png`.

**Not changed:** the blue context bar (`.ctxbar`, 30px) stays at the
live-app height from the 2026-08-31 session rather than the 40px this Figma
frame's Context Bar instance specifies — that's a shared element used by
every screen, not just the Workspace, and the 30px value was itself a
deliberate correction from real screenshots of the running app. Flagging the
conflict rather than resolving it unilaterally; say the word if the canonical
40px should win everywhere.

---

## Session update — 2026-09-15 (cont. 2) — background, borders, responsiveness, type

Four fixes to the Workspace, each pulled from the real design rather than
adjusted by eye.

**Real background artwork.** The hatch/blobs/wave/dot-grid canvas was
hand-approximated with CSS gradients before. It's now the actual
`RMX_Background` asset — RMX-Iconography, `doVDYRtepBULKGZntmmS5B`, node
`6:4644` — exported at its native 1932×853 and saved as
`assets/ws-background.png`, applied via `background-size: cover`. The old
`::before`/`::after` gradient approximations are gone; the real asset already
contains all of it.

**Cards lost their 1px borders, kept their shadows.** `.wstile`, `.wsgroup`,
`.wsann` all had a plain `border: 1px solid var(--rmx-line)` that isn't in
the design — the design floats these purely on shadow. Removed all three;
`.wstile`'s colored 4px top overline is a different thing (a real design
element) and stays.

**Font fixes, cross-checked against `get_design_context` on the real nodes
this time instead of eyeballed:**
- `wsgreet__hi`/`wsgreet__sub` ("Welcome, Charlie" / "Let's get to work."):
  color was navy (`--rmx-brand-dark` #13314c) — the real Welcome Text node
  is `#575353`, a value that doesn't map to any existing token, used as a
  literal since it's a real harvested value, not a guess. The subtitle was
  also the wrong *size* — 13px/18px instead of the real 20px/28px.
- `.wsann__badge` ("NEW"/"UPDATED"): 12px instead of the real 14px.
- Tile header icon (`more_vert`/`visibility_off`): rendered at 18px instead
  of the real 20×20 icon slot.

---

## Session update — 2026-09-15 (cont. 3) — Main Menu rebuilt from the canonical Mega Menu Overlay

Rebuilt the Main Menu (`SA.viewMenu` in `js/chrome.js`, `.menu*` in
`css/app.css`) against the real frame — RMX-Pages `5XEzI94nmZsWE7rQQ7OIHP`,
node `4077:83116` "Mega Menu Overlay" — instead of the live-screenshot
measurements the earlier session used. Six real icon assets harvested this
session (Figma access is live again): the logo mark, Workspace, Dashboard,
Administration, Full Menu, and the rail's selected-item "ribbon" corner —
all downloaded as real SVG and added to `assets/icons-local.svg` *without*
`data-provisional` (they're genuine harvested RMX artwork, not stand-ins;
`data-provisional` stays reserved for the Material Symbols fallbacks from
earlier in the session). Search, Help, Settings, Reports and Close already
existed in the core sprite and were reused as-is.

**Panel:** 1384px wide (was 1320, eyeballed), 8px radius (was 6), 94px
header (was 66) + 445px body (was 422).

**Header:** logo grew to its real 40px with the actual multi-tone mark
(was a flat 32px orange square); "Menu" text corrected to 24px (was 20);
the six top destinations now carry their real icons instead of
approximations (Workspace's sparkle, Dashboard, Administration, and Full
Menu — a grid/map glyph — were previously `auto_awesome`, `schedule`,
`settings_suggest`, `menu_book`, none of them right); the close X moved to
its real absolutely-positioned 8px/8px corner spot at a real 32px instead of
sitting inline in the header at 18px text.

**Rail:** items are the real 212px/18px with the real `#0071aa` blue text
(the app already had this exact value as `--rmx-brand-hover`, so no new
token). The selected item's **ribbon** is real now — the actual folded-corner
asset positioned per the design's own offsets (`bottom:-12px; right:0`),
not a CSS triangle. **Hover is a new behavior, not in the static mock** — the
user described it directly ("rounded rectangle around the word with a blue
background"): implemented as a tight chip around just the label text
(`.menumod__label`, `padding:2px 6px`, `border-radius:sm`, blue background on
hover), deliberately narrower than the selected row's full-width ribbon
treatment so the two states stay visually distinct. Verified via
`getBoundingClientRect` that the hover chip is genuinely ~100px wide against
a 212px row — a screenshot at this panel's small on-screen scale reads as a
solid full-width bar next to the selected row below it, which is just an
optical read at that resolution, not the actual box.

### Follow-up — genuinely responsive, not scaled, plus a real color bug

The scale-transform approach above was wrong — asked to make it actually
responsive instead, from a screenshot of the live app at a narrower width
that exposed two real bugs the transform hack had only been hiding.

**Color bug:** `.menulink` was rendering the bright brand blue (`#008DD5`)
instead of the navy the design specifies. Cause: `.rmx a` (from
`rmx-tokens.css`, specificity 0,1,1) beats a bare `.menulink` (0,1,0)
regardless of source order, so the generic link-blue rule was winning.
Fixed by qualifying the selector — `.menucol .menulink` — which has enough
specificity to win. Confirmed via `getComputedStyle`: was `rgb(0,141,213)`,
now `rgb(19,49,76)`.

**Overflow bug:** the footer (`Rental Info Setup` / `...Reports` / `Asset
Reports` / `Short Term Rental Reports` / `Version ...`) had no
`flex-wrap`, so at a width where it didn't fit, the last button's label
and the version string overlapped instead of wrapping. Added
`flex-wrap: wrap` to `.menufoot`.

**Genuinely responsive now:** `.menupanel` width is `min(1384px, 96vw)` —
no `transform: scale()`. The header's fixed 80px side padding is
`clamp(16px, 4vw, 80px)` so it's the first thing to give way. `.menucols`
already wrapped (flex-wrap); `.menupanel__body` lost its fixed 445px height
in favor of `min-height: 445px` plus `overflow: auto` and a
`max-height: calc(100vh - 72px)` cap on the panel itself, so a wrapped
second row of groups (e.g. Bird's Eye View dropping under General at
narrower widths) grows the panel instead of clipping or forcing an internal
scrollbar unless it truly runs out of vertical room. Verified at 1920 (BEV
fits on the first row, footer fits on one line) and ~954px (BEV wraps to
its own row, footer wraps to two lines, no overlap, no scrollbar) — the
same markup reflows correctly at both, which a fixed scale factor can't do.

**Content (verified against the real Receivables columns, which is what the
mock frame shows selected):** `SA.menuGroups.Receivables` was two shallow
groups (General/Collections, 7 links) invented to "read as real" — replaced
with the actual five groups and ~25 real link labels (General, Loans
Receivable, Payments, Recurring Charges, Commercial). Footer replaced
(`Receivables Setup` / `Receivables Reports`, 2 items → `Receivables Setup` /
`Tenant Reports` / `Receivable Reports`, 3 items, with the real gear+reports
icons instead of a `description` icon that didn't match the design). Version
string corrected to the mock's `12.260554` (was `12.260751`, a typo/guess
from before). The other six modules' menu content is unchanged — this pass
verified Receivables specifically since that's what the mock frame shows
selected; the rest were already "read as real" from an earlier session and
weren't re-verified against Figma.

**Responsive — but scoped, not global.** `.app` is hard-pinned to
`width: 1920px` everywhere in this codebase, on purpose ("the page scrolls
if the browser window is smaller, rather than reflowing away from the
design" — a deliberate, documented, app-wide convention, not an oversight).
Making the whole app fluid was out of scope for a Workspace-only ask and
risks every other screen's canvas-sized layout (the build canvas, registers,
etc.). Instead: `root.className` in `js/main.js` now adds `app--fluid` only
when `state.screen === 'workspace'`, and `.app--fluid { width: auto;
min-width: 1320px }` overrides the fixed width just for that state. The tile
row already used fluid flex ratios (`flex: 558 1 0` / `flex: 314 1 0`,
carrying the real 558:558:314:314 proportions) from the pass above, so once
`.app` itself could shrink, the tiles started shrinking with it. Verified at
1920, 1400 and 1320 (the shell's documented floor) — no horizontal
scrollbar at any of them; every other screen (checked: Agent Library) still
renders at the fixed 1920 canvas, unaffected.

### Follow-up — the ribbon corner itself was distorted

Found via your annotated screenshot: the ribbon looked disconnected/wrong
because `icon()` (the shared helper) hardcodes `viewBox="0 0 20 20"` on
every icon's wrapper `<svg>` regardless of the symbol's native size. That's
correct for the 20x20 RMX icons, but the ribbon corner's native size is
13x12 — routing it through `icon()` meant a *second* aspect-ratio-preserving
scale on top of the `<use>`'s own, letterboxing and distorting a shape
that's already small enough for the distortion to read as "just wrong"
rather than "slightly off." Fixed by rendering it as its own inline
`<svg viewBox="0 0 13 12">` in `js/chrome.js` instead of through `icon()`,
matching its real dimensions exactly. `icon()` itself is unchanged — every
other icon in the app is a real 20x20 RMX symbol, so this was never an
issue anywhere else.

### Follow-up — the ribbon sat in the empty gap, not at the line

Even after the previous distortion fix, the corner's bounding box was
positioned `right: 0` relative to the selected rail item -- which sits 13px
short of the actual divider (the rail's 12px right padding + 1px border),
so the whole triangle floated in that gap with empty space on both sides
of it, reading as neither clearly "in the rail" nor "at the line."
Confirmed with a temporary debug outline + marker line before touching
CSS, rather than guessing from a screenshot a second time. Repositioned
to `right: -26px` (13px gap + 13px box width) so the box's *left* edge
lands exactly on the divider -- verified via `getBoundingClientRect`
(`cornerLeft - dividerX === 0`) -- putting the whole ribbon on the content
side of the line, pointing back at the selected item, matching the
reference.

### Follow-up — blue row now reaches its own ribbon

The selected row's blue background stopped at the rail's content edge
(same box every row uses), leaving a white sliver between it and the
ribbon now sitting 13-26px further right. Added `.menumod--on::before`:
an absolutely-positioned 26px extension (`left:100%` of the row, i.e.
starting exactly where the row's own box ends) in the same blue, so it
picks up exactly where the row stops and runs to exactly where the ribbon
ends. Verified before screenshotting: `getComputedStyle(btn, '::before')`
extension's right edge and the ribbon's `getBoundingClientRect().right`
both computed to 249.586px -- an exact match, not eyeballed.

### Follow-up — 16px between the ribbon and the content columns

Only 3px separated the ribbon's right edge from "Tenants" (same row
height, genuinely cramped -- confirmed by measuring both rects before
touching CSS). `.menucols` had symmetric 8px padding; split it so the left
side is 21px instead (8px original + 13px more), landing content start at
exactly 16px past the ribbon's right edge. Verified via
`tenants.left - corner.right === 16` before screenshotting.

---

## Session update — 2026-09-15 (cont. 4) — Administration rebuilt from the canonical Administration Menu

Rebuilt the whole Administration page against the real frame — RMX-Pages
`5XEzI94nmZsWE7rQQ7OIHP`, node `4620:157756` "Administration Menu" — a huge
one (4716px tall, 14 categories, ~130 items). Only Automation was already
built; everything else (Preferences' real icons, and all of Rental Info,
Accounting, Owners, Payables, Receivables, Service, Users, Customization,
Rollback, Import, Integrations, Locations) is new.

**The real interaction model is different from what was here before.**
The old build was a filter — the rail picked one category, everything else
showed a "not built out" placeholder. The real page is a single long
scroll with **every category's content rendered at once**; the rail is a
jump-nav that scrolls to a section and marks it current (`state.adminCat`
+ a one-shot `_scrollToAdminCat` flag main.js's `render()` reads after the
new DOM exists, then clears). This is *why* Automation didn't need to
move — its real position in the canonical page (between Rollback and
Import) is exactly where it already was, so "every category is real now"
and "Automation stays put" are the same change, not two.

### Icons: 91 real Express admin-menu icons, harvested this session

Every item's icon is the real one from Figma — `js/admin-icons-sprite.js`
(new, parallel to the existing RMX-icon sprite), a new `SA.adminIcon()`
helper in `js/ui.js` (deliberately not routed through the shared `icon()`
helper — these are native multi-tone glyphs, never tinted via
currentColor, and several are non-20×20 so they need their own square
viewBox handling), and a new `eicon` field on admin items (as opposed to
`icon`, which still means "generic RMX/Material icon" for the couple of
spots that use it).

**7 of the 91 are raster, not vector — a real Figma export limitation,
not a shortcut.** Contact Types, Lease Terms, Amenities, Property Groups,
Unit Status Types, STR Payment Policies, and Violation Categories all
export as syntactically valid but *empty* SVGs from Figma's API (0 path
data) — confirmed by re-fetching fresh asset URLs twice, so not a caching
fluke. `get_screenshot` on the same components renders them correctly
(Figma's canvas renderer has no trouble with whatever these components do
that the vector-flattening exporter chokes on), so each of those 7 is a
PNG crop of that real render, embedded as a base64 `<image>` inside its
`<symbol>` with `data-raster-fallback` naming why. Nothing was hand-drawn.

**A background-agent bug destroyed ~60 already-downloaded icons mid-task**
(a later agent's Bash `download.sh` script very likely started with an
`rm -rf` on the shared `/tmp/admin-icons`, wiping 3 earlier agents' work —
their *text* content survived in their returned reports, but their icon
files didn't). Re-harvested everything from Figma a second time, this
time into a session-scratchpad directory instead of shared `/tmp`, and
verified every single icon (`grep -c "<path"`, zero tolerance for the
empty-export bug above) before treating any batch as done.

### Chrome

Title bar: the same "System Preferences" admin-menu icon as the header's
Main Menu logo (40px) + "Administration" at the real 24px/regular (was
28px/500) + a real blue-bordered "Find an item" search field (was a plain
186px box with brand-blue border at the wrong shade). Left rail: this
page uses the *same* Mega Menu component as the header's Main Menu
overlay, confirmed by re-fetching it — reused `.menumod`/`.menumod__label`
/`.menumod--on`/`.menumod__corner` for color, type, hover-chip and ribbon,
but the two real instances are genuinely different widths (this rail's
items render at the component's full 232px, the overlay's at an inset
212px within a 224px rail) — scoped the ribbon-bridge hack from the
Main Menu session to `.menupanel .menumod--on::before` specifically, and
gave the admin rail its own `.adminrail` sizing plus a `::before` for the
divider (the real spec draws it as its own inset layer, not a plain
border on the rail box, so the selected pill's fill and ribbon can cross
over it same as the design).

### Content

Section titles are real 16px/SemiBold at `#3776BC` (new token
`--rmx-admin-blue` — genuinely a different blue from `--rmx-brand-hover`
#0071AA used elsewhere), 2px bottom border, fixed 200px width, matching
the real component exactly. Item grids are real CSS grid (4 columns,
24px/16px gaps) instead of the old fixed-width flex-wrap. Every
title/description string is the real Figma text — including two things
worth flagging rather than silently fixing: Import Records has
**"Import Deprecation Setup"** and **"Import Owner Contracts"**, which
read like typos for "Depreciation"/"Contacts" but are what the source
actually says (reproduced verbatim), and Accounting's "Manage Aliases"
carries the *exact same* description text as Preferences' "System Web
Preferences" — a likely copy-paste duplication in the source file itself,
also reproduced as-is rather than guessed at.

### Not done

"Find an item" is a real-looking, inert field (no filtering behavior
implemented) — the design doesn't specify search behavior and building
one wasn't asked for. The rail's "current" state is driven by whichever
button was last clicked (or Preferences by default); it does not update
on scroll (no scrollspy) — clicking a rail item scrolls correctly, but
scrolling manually past a section boundary won't re-highlight the rail.

### Follow-up — rail height, one-shape ribbon, admin rail background/hover

**32px rows, both rails.** `.menumod` padding was 8px top/bottom (40px
total with the 24px line-height); changed to 4px, giving 32px.

**The rectangle-plus-ribbon seam was a real rendering artifact, not a
color mismatch.** Both pieces used the same blue, but they were two
independently-rendered shapes (the button's own `background-color`, and a
separately-positioned `<svg>` triangle below it) meeting at a shared
edge — each shape's anti-aliasing blends toward whatever is *behind* it,
and where two independently-antialiased edges meet, a hairline of
partially-blended background shows through even at identical fill colors.
Fixed by drawing the whole selected state (rectangle + ribbon tail) as
one continuous SVG `<path>` — new `SA.railRibbon(w, reach)` in `js/ui.js` —
so there is exactly one outer edge and nothing for a seam to form between.
Used at both real call sites: the header's Main Menu overlay
(`railRibbon(212, 26)`, items inset within the rail per the real 224px
component usage there) and the Administration rail (`railRibbon(232, 0)`,
items already full-width). The old `--before` bridge hack and the
separate `menu-ribbon-corner` `<use>` are gone from both.

**Administration rail: white, not the app shell's gray.** `.adminrail`
never set its own background, so it showed `.app`'s `--rmx-bg-subtle`
underneath. Added an explicit white.

**Administration rail hover: cursor only.** The rounded blue-chip hover
was built for the header's Main Menu overlay specifically (per an earlier
explicit request) and got inherited here for free through the shared
`.menumod` class. Neutralized it for `.adminrail` — no background, no
padding/radius shift, cursor:pointer only. The overlay's chip hover is
unchanged.

### Follow-up — default landing category is Preferences, not Automation

`state.adminCat` initialized to `'Automation'` — a leftover from the old
filter model, where opening Administration jumped straight to Automation
so Smart Agents was immediately visible. Now that the page always shows
every category and just scrolls, that default meant the rail highlighted
"Automation" while the page itself sat at the top showing Preferences —
rail and scroll position disagreeing on first visit. Changed the default
to `'Preferences'`, matching where the page actually starts. Verified via
the normal `goAdmin` entry point (the header's "Administration" nav item).

### Follow-up — Administration page overflowed the viewport (horizontal scroll, jumpy layout)

`.app` is pinned to a fixed 1920×1080 canvas globally — correct for the
screens that are meant to stay pixel-locked to their Figma frame, but
Administration was never meant to be one of them: it's a real single-scroll
page, not a fixed board. At any browser width narrower than 1920 (this
session's pane included, at 1055×853), the fixed canvas forced horizontal
scroll and made the page feel like it was jumping around as content shifted
against a viewport it didn't actually fit.

Fixed by extending `.app--fluid` — the opt-in fluid-canvas override already
built earlier this session for Workspace — to also apply when
`state.screen === 'admin'` (`js/main.js`). That makes Administration
`width:100%; height:100vh` instead of the fixed 1920×1080, same mechanism
Workspace already used. Also switched `.admingrid` from a fixed
`repeat(4, minmax(0,1fr))` to `repeat(auto-fit, minmax(340px, 1fr))`
(`css/app.css`) so the category card grid reflows column count naturally
as the fluid canvas narrows, instead of squeezing 4 fixed columns into a
space that doesn't have room for them.

Verified via `document.body.scrollWidth/scrollHeight` vs.
`window.innerWidth/innerHeight`: before the fix, 1920×1080 vs. 1055×853
(overflowing on both axes); after, 1055×853 matching exactly at that
width, and still a correct 4-column layout at full 1920×1080. No console
errors either width.

### Follow-up — every page fits the viewport, not just Workspace and Administration

Every other screen (Library, Inbox, the agent builder, Templates, Quick)
was still pinned to the fixed 1920×1080 canvas, same overflow problem
Administration had. Redoing each one as a true fluid reflow like
Workspace/Administration wasn't right here: those two got hand-built
reflow because their content (tiles, a card grid) genuinely regroups at
other widths, but the agent builder's canvas/inspector split, the
register-style Library table, etc. have no narrower layout defined
anywhere in the Figma source — inventing one would be exactly the kind
of guess the rmx-prototyping skill says not to make.

So instead of reflowing those screens, `#stage` (new wrapper div around
`#app` in `index.html`) now scales the fixed 1920×1080 canvas down to fit
whatever window it's given: `applyScale()` in `js/main.js` computes
`min(1, innerWidth/1920, innerHeight/1080)`, applies it as a CSS
`transform: scale()` on `#app` with `transform-origin: top left`, and
sizes `#stage` to the resulting scaled footprint so nothing extends past
it. Runs after every `render()` and on window resize. Fluid screens
(Workspace, Administration) are left alone — `applyScale()` clears the
transform and lets `.app--fluid`'s own 100%/100vh sizing take over, since
those already reflow for real and don't need shrinking.

Same pixels, same layout, just smaller when the window is smaller — no
horizontal scroll, no invented breakpoint behavior. `html, body` switched
from `overflow: auto` to `overflow: hidden` since containment is now
guaranteed by `#stage`.

Verified: `document.body.scrollWidth/Height` match `innerWidth/Height`
exactly at 1055×853, 1024×700, and 1920×1080 (scale 1, pixel-identical to
before) across Library, Inbox, the agent builder, Templates, Quick,
Workspace and Administration. Confirmed clicks still land correctly
through the transform (Save button → toast) and that `position:fixed`
overlays (Main Menu, dialogs, toast) scale and position correctly, since
they're descendants of the transformed `#app` and CSS makes a
transformed element the containing block for its `fixed` children. No
console errors at any size tested.

### Follow-up — every page reflows for real now, instead of scaling down

The scale-to-fit approach above satisfied "fits the viewport" literally,
but shrinking the whole 1920×1080 canvas isn't the same thing as being
responsive — text and controls just got smaller instead of the layout
adapting. Replaced it with real reflow everywhere, the same mechanism
Workspace and Administration already used (`.app--fluid`), now applied
universally.

What made this straightforward: every screen's *own* layout was already
built fluid — `.nav` and `.palette`/`.inspector` are fixed-width sidebars
next to a `flex:1; min-width:0` content area, the register grids
(`.g-agents`, `.g-inbox`, etc.) use `minmax()` columns, `.tplgrid` is
`repeat(auto-fill, minmax(340px,1fr))`, `.quickwrap`/`.todowrap` are
`max-width` + `margin:auto`. The only thing actually pinning every screen
to 1920×1080 was `.app` itself. So `.app--fluid`'s rules
(`width:100%; height:100vh; min-width:960px; min-height:500px`) got
merged into the base `.app` rule in `css/app.css`, the modifier and its
per-screen conditional in `js/main.js` are gone, and `.app` is now always
fluid — no exceptions.

Also removed the `#stage`/`applyScale()` scale-transform machinery from
the previous fix (`index.html`, `js/main.js`) now that it's obsolete.

Where a screen's content genuinely can't shrink past its floor (the
register grids' column minimums, the agent builder's
palette+canvas+inspector row), it gets its own internal scrollbar
(`.screen`, `.canvas`, `.inspector` are all `overflow: auto`) rather than
the whole window scrolling sideways — the same contained-overflow pattern
Administration already established. `.app`'s `min-width: 960px` floor
keeps that from being reached in the first place down to a reasonably
narrow window.

Verified at 1000×650, 1200×800 and 1920×1080 across all seven screens
(Library, Inbox, the agent builder, Templates, Quick, Workspace,
Administration): no body-level horizontal or vertical scroll at any
size, full-size 1920×1080 renders pixel-identical to the original design
(the Quick screen's centered `max-width:940px` card confirms this — it
doesn't stretch edge-to-edge), and 1000×650 shows real reflow — full-size
text and controls, not shrunk, with only the register table and the
canvas row scrolling internally where their content still can't fit. No
console errors at any size tested.

### Follow-up — a too-narrow register scrolled the whole screen, not just itself

`.screen { overflow: auto }` meant that when a register's grid columns
hit their `minmax()` floor and got wider than the window, the *whole*
screen picked up a horizontal scrollbar — page head, "New Agent" button,
item count, all of it sliding out of view together with the table. Only
the register's own rows should scroll sideways.

Fixed by moving the horizontal-overflow responsibility down to the
register itself: `.tbl` now carries `overflow-x: auto` directly, and
`.screen` was narrowed to `overflow-y: auto; overflow-x: hidden` so it
can never be the one that scrolls sideways. `.tbl__head` and each
`.tbl__row` are siblings sized by the same grid template, so they still
scroll together in lockstep — the header and its columns never separate.
Verified on the Agent Library at 1000px wide: setting the table's own
`scrollLeft` reveals the later columns while `.pagehead__title`'s
position doesn't move and `document.body.scrollWidth` stays at the
window's width.

Also switched the Agent Library register specifically to RMX's white
register header (`Style=Table`) instead of the gray default
(`Style=Register`) — `.libtable .tbl__head { background: var(--rmx-bg) }`
in `css/app.css` — since that list reads as content sitting on the page
rather than a boxed table. Every other register (Agent Findings Inbox,
the per-agent Findings tab) keeps the gray `Style=Register` header;
this was scoped to `.libtable` only, not `.tbl__head` generally.

### Follow-up — "Resident" → "Tenant" in a finding's Records Involved chips

A finding's expanded detail (the per-agent Findings tab) lists three
related-record chips, e.g. "LSE-10442 — Lease", "UNIT 12-B — Maple
Grove", "Marcus Alvarez — Resident". Asked to use "Tenant" instead of
"Resident" there since it's the more Rent Manager-native term. Changed
the record-type suffix on the person chip from "— Resident" to
"— Tenant" across all 9 Move-In Charge Integrity findings and the
Missing Resident Data fallback (`js/data-content.js`), so it now reads
"Marcus Alvarez — Tenant".

Scoped this to Agent Findings only — left "Resident" alone everywhere
else it's used for a different feature (the Notification editor's
audience picker, the Quick Agent condition-field list, action targets),
since only Agent Findings was asked about and those are separate,
unrelated copy.

### Follow-up — Agents / Agent Findings switcher: left rail to top tabs

Moved the "Agents / Agent Findings" switcher from a 236px left rail
(`.nav`) to a real RMX Tabs row spanning the top of the screen, per a
design canvas exploration (`design-explore/agents-nav-tabs/`) the user
picked "Tabs" from.

Checked the actual RMX Tabs component against Figma before building
this (`data/components.json` in the rmx-prototyping skill, node
244:2547) rather than reusing this app's own pre-existing `.tab` CSS
as-is — and the existing `.tab`/`.tabs` rules (already in use for the
agent detail screen's Build/Findings/Runs tabs) turned out to be
wrong on three points versus the verified anatomy:

- Border should be **2px**, not 3px.
- Padding should be **16px vertical / 8px horizontal on all sides**
  (`Spacing/md` / `Spacing/xs`), not `0 0 10px` (bottom-only).
- Font weight is **600 (SemiBold) in both selected and unselected
  states** — Figma's own variant note is explicit that weight does
  NOT change on selection, only the border and text color do. The old
  CSS made the active tab 500 and left the inactive tab at the
  inherited default.

Fixed `.tab`/`.tabs`/`.tab--on` in `css/app.css` to the verified
values (this also corrects the Build/Findings/Runs tabs, since it's
the same shared component) and added `line-height: 1` and
`align-items: flex-start` on the row per the recipe. Measured tab
height now computes to ~48px as measured off the library, versus the
old rules' ~37px.

Replaced `SA.viewNav()`/`navItem()` in `js/chrome.js` with
`SA.viewNavTabs()`, built from the corrected `.tab` component: an
"Agents" tab with its count in the neutral `.tab__count` pill, an
"Agent Findings" tab with its count in a new `.tab__badge` (the old
`.nav__badge`'s filled-blue treatment, renamed since it's no longer
nav-specific — kept as its own distinct look from `.tab__count` since
Findings' count is actionable/unread and Agents' is just a total,
matching the distinction the old rail already made). `js/main.js` now
renders this as a full-width bar between the blue context bar and
`.app__body`, instead of as a flex sibling inside it, so every screen
that used to sit beside the rail (Library, Inbox, Templates, Quick,
and the agent detail screen) now gets the full width back. Workspace
and Administration are unaffected — they already didn't show the
rail.

Added the "Agents are running." status dot (`.statusdot`, green
`--rmx-success`, amber `--rmx-warning-soft` when disabled) on the
right of the new bar — this one wasn't a Figma component question,
just a small colored dot next to existing text.

Removed the old `.nav`/`.nav__item*`/`.nav__label`/`.nav__count`/
`.nav__sep`/`.nav__chev` CSS and the `navItem()` helper — confirmed
via grep they had no other callers before deleting.

Verified: computed styles on both the top switcher and the agent
detail's Build/Findings/Runs tabs show `font-weight: 600` and a 2px
border on every tab, active and inactive; Workspace and Administration
still render with no `.navtabs` bar; no console errors.

## RMX design-system audit — 2026-09-16

A pass against `rmx-prototyping`'s references (`data/components.json`,
`data/text-styles.json`, `references/controls.md`, `data-display.md`,
`page-patterns.md`) and against live computed styles in the browser, not
just the source. Figma itself was unreachable in this session (no
authenticated `figma` MCP connector), so nothing was re-harvested — every
fix below is backed by a measured value already in the skill's bundled
data, not a guess.

**Fixed:**

- **Type ramp.** RMX Foundations has exactly these text sizes: 12, 12.6,
  14, 16, 18, 20, 24, 32, 40, 56, 96. This app had invented 10px, 11px,
  13px, 15px and 28px sizes throughout — 13px alone via the shared `.f13`
  utility class, used ~70 times. Every occurrence now resolves to the
  nearest real style (13→14, 11→12, 10→12, 15→14 or 16 depending on
  context, 28→32 for the page H1).
- **A live CSS-specificity bug, confirmed by computed style, not just
  reading the source:** `.rmx h1 { font-size: 32px; ... }` in
  rmx-tokens.css is (class, element) specificity, which beats a bare class
  selector like `.pagehead__title--sm` or `.admintitle__h`. Every page
  title in the app was silently rendering at 32px/500/navy regardless of
  which sizing class it carried — `<h1 class="pagehead__title--sm">`
  measured 32px live, not the 24px its own rule said. Same bug on every
  dialog header (`<h2 class="f18">` measured 24px, not 18). Fixed by
  qualifying the overrides with the element (`h1.pagehead__title--sm`,
  `h2.f18`, etc.) so they tie on specificity and win on source order.
- **Checkbox / Radio.** RMX Checkbox and Radio button are both a measured
  20×20 with a 2px border and an 8px (`Spacing/xs`) gap to the label. Both
  were built at 16×16 with a 9px gap. Resized `.check`/`.radio` to 20×20,
  gap to 8px, `.check--lg` up to 24×24 to keep the same relative bump.
- **Input Field.** Style=Express/Size=Default measures 36px tall, value
  text 14px in `--text-secondary` (navy #13314c). `.field`/`.fauxfield`
  were 34px, 13px, and coloured `--rmx-ink` (pure black). Fixed to 36/14/navy.
- **Register header.** `data-display.md`: Style=Register (a register
  sitting directly on the page — Findings, Runs' Replay history when it's
  not inside a Tile, Inbox) is 28px, `--container-tertiary-dark` (#737373),
  white 12.6px Medium with +1.1px tracking, and the labels are already
  Title Case in the data ("Record", "Property", ...). `.tbl__head` was a
  light gray (#f5f8fa/#666) that matched neither Style=Register nor
  Style=Table, and forced `text-transform: uppercase` on top of Title Case
  data. Rewrote it to the real Style=Register, and gave Agent Library's and
  the agent detail Runs tab's run-history register (both sit inside a
  card-style box, not full-page) the real Style=Table instead — white,
  navy text, 32px, bordered top and bottom — via a `.tbl--card` modifier
  class next to the existing `.libtable` one.
- **Register rows do not have a hover state** — asked and answered by
  Emma per `data-display.md`: "nothing lights up under the cursor... do
  not add a hover tint... or an affordance of any kind." `.tbl__row--click`
  had both a background tint and `cursor: pointer`. Removed both.
- **Context Bar.** Measured 40px (8px vertical + 16px horizontal padding),
  leading text is Web/Heading/S/Regular — 18px, weight 400, white. The
  blue bar under the header (`.ctxbar`) was 30px with 15px/500 text. Fixed.
- **App bar.** Measured 48px. `.hdr` was 46px. Fixed.

**Open / unverified — flagged rather than guessed:**

- 29 of the app's 98 core icons (`js/icons-sprite.js`) are already marked
  `data-provisional` — honest stand-ins from Material Symbols, not yet
  checked against RMX Iconography, per the skill's own icon rule. They
  were already disclosed before this pass; harvesting the real glyphs
  needs an authenticated Figma session, which this one didn't have.
- Input Field `Size=Small` geometry was never harvested into
  `components.json` (`_incomplete` on that entry) — `.field--sm`'s 30px
  height is unverified either way; left as-is rather than guessed.
- `.check--lg`'s 24×24 size is this pass's own proportional choice (RMX's
  Checkbox component has no Size axis at all), used in exactly one place
  (the findings-inbox "done" checkbox).
