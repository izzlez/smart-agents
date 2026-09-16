/* ============================================================
   Smart Agents — render helpers
   The design's runtime (support.js) compiled {{ }} bindings,
   <sc-for> and <sc-if> into React. This is the equivalent for a
   no-build page: string templates plus one delegated listener.
   ============================================================ */
(function (SA) {
  'use strict';

  /* ---------- escaping ---------- */
  var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"']/g, function (c) { return ENT[c]; });
  }
  SA.esc = esc;

  /* ---------- attribute builders ---------- */
  /* act('goAgent', 'movein#0') -> data-act="goAgent" data-arg="movein#0" */
  function act(name, arg, arg2) {
    var s = ' data-act="' + esc(name) + '"';
    if (arg !== undefined) s += ' data-arg="' + esc(arg) + '"';
    if (arg2 !== undefined) s += ' data-arg2="' + esc(arg2) + '"';
    return s;
  }
  function chg(name, arg, arg2) {
    var s = ' data-chg="' + esc(name) + '"';
    if (arg !== undefined) s += ' data-arg="' + esc(arg) + '"';
    if (arg2 !== undefined) s += ' data-arg2="' + esc(arg2) + '"';
    return s;
  }
  /* focus key — lets render() restore the caret after replacing innerHTML */
  function fk(key) { return ' data-fk="' + esc(key) + '"'; }
  SA.act = act; SA.chg = chg; SA.fk = fk;

  /* ---------- conditionals / loops ---------- */
  function when(cond, fn) { return cond ? (typeof fn === 'function' ? fn() : fn) : ''; }
  function each(list, fn) { return (list || []).map(fn).join(''); }
  function cls() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (!a) continue;
      if (typeof a === 'string') { out.push(a); continue; }
      Object.keys(a).forEach(function (k) { if (a[k]) out.push(k); });
    }
    return out.join(' ');
  }
  SA.when = when; SA.each = each; SA.cls = cls;

  /* ---------- atoms ---------- */
  /* Real RMX Iconography geometry where the harvested core covers the name;
     a provisional Material Symbols stand-in (flagged via the symbol's own
     data-provisional, see assets/icons-local.svg) everywhere else. Icon
     names stay Material-Symbols-style snake_case at call sites; the RMX
     sprite's ids are kebab-case, so core lookups convert on the way in. */
  function icon(name, size, style, extraCls) {
    var kebab = String(name).replace(/_/g, '-');
    var core = SA.ICON_CORE_IDS && SA.ICON_CORE_IDS[kebab];
    var id = core ? kebab : name;
    return '<svg class="' + cls('icon', size ? 'i-' + size : '', extraCls) + '" viewBox="0 0 20 20" aria-hidden="true"' +
      (style ? ' style="' + esc(style) + '"' : '') + '><use href="#' + esc(id) + '"></use></svg>';
  }
  /* Real Express admin-menu icons (see js/admin-icons-sprite.js) -- always
     square, native multi-tone colors, not tinted via currentColor. `name`
     is the bare kebab-case name (e.g. 'asset-types'); the sprite prefixes
     every id with "admin-" to keep this namespace away from the general
     icon() sprite. */
  function adminIcon(name, size) {
    var px = size || 50;
    return '<svg class="adminicon" width="' + px + '" height="' + px + '" viewBox="0 0 50 50" aria-hidden="true">' +
      '<use href="#admin-' + esc(name) + '"></use></svg>';
  }
  SA.adminIcon = adminIcon;

  /* The Mega Menu rail's selected pill + ribbon tail, as one continuous
     SVG path -- see the .menumod__shape rule in app.css for why this has
     to be one shape rather than a rectangle plus a separately-positioned
     triangle. `w` is the rail item's own width (212 for the header's
     Main Menu overlay, 232 for the Administration rail); `reach` is how
     far past that width the shape needs to extend before the tail
     starts (26 for the overlay, whose items sit inset from the real
     divider; 0 for the admin rail, whose items already run flush to it). */
  function railRibbon(w, reach) {
    var totalW = w + reach, h = 32, tailH = 44, tailX = totalW - 13;
    var d = 'M0,0 L' + totalW + ',0 L' + totalW + ',' + h + ' L' + tailX + ',' + tailH +
      ' L' + tailX + ',' + h + ' L0,' + h + ' Z';
    return '<svg class="menumod__shape" width="' + totalW + '" height="' + tailH +
      '" viewBox="0 0 ' + totalW + ' ' + tailH + '" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  SA.railRibbon = railRibbon;

  function orion(size, color) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 20 20" style="display:block;flex-shrink:0' +
      (color ? ';color:' + color : '') + '"><use href="#orion-mark"></use></svg>';
  }
  /* A toggle with no handler of its own emits no data-act, so a click falls
     through to whatever wrapping label or row does carry one. */
  function toggle(on, handler, arg, opts) {
    opts = opts || {};
    var wired = !opts.locked && typeof handler === 'string' && handler;
    return '<span class="' + cls('toggle', { 'toggle--on': on, 'toggle--locked': opts.locked, 'toggle--sm': opts.small }) + '"' +
      (wired ? act(handler, arg) : '') +
      (opts.title ? ' title="' + esc(opts.title) + '"' : '') +
      '><span class="toggle__knob"></span></span>';
  }
  function check(on, handler, arg, big) {
    return '<span class="' + cls('check', { 'check--on': on, 'check--lg': big }) + '"' +
      act(handler, arg) + '>' + (on ? '&#10003;' : '') + '</span>';
  }
  function checkStatic(on) {
    return '<span class="' + cls('check', { 'check--on': on }) + '">' + (on ? '&#10003;' : '') + '</span>';
  }
  function radio(on) {
    return '<span class="' + cls('radio', { 'radio--on': on }) + '"><span class="radio__dot"></span></span>';
  }
  SA.icon = icon; SA.orion = orion; SA.toggle = toggle;
  SA.check = check; SA.checkStatic = checkStatic; SA.radio = radio;

  var TYPE_BADGE = {
    'Data health': 'badge--health',
    'Workflow': 'badge--workflow',
    'Notification': 'badge--notification',
    'Schedule': 'badge--schedule'
  };
  function typeBadge(type) {
    return '<span class="badge ' + (TYPE_BADGE[type] || 'badge--neutral') + '">' + esc(type) + '</span>';
  }
  SA.typeBadge = typeBadge;
  SA.TYPE_BADGE = TYPE_BADGE;

  var TONE_BADGE = { ok: 'badge--ok', warn: 'badge--warn', neutral: 'badge--stop', err: 'badge--err' };
  function toneBadge(tone, text) {
    return '<span class="badge ' + (TONE_BADGE[tone] || 'badge--neutral') + '">' + esc(text) + '</span>';
  }
  SA.toneBadge = toneBadge;

  function seg(options, current, handler, opts) {
    opts = opts || {};
    return '<div class="' + cls('seg', { 'seg--line': opts.line, 'seg--fill': opts.fill }) + '">' +
      each(options, function (o) {
        var id = typeof o === 'string' ? o : o.id;
        var label = typeof o === 'string' ? o : (o.label || o.id);
        return '<button class="' + cls('seg__btn', { 'seg__btn--on': id === current }, opts.btnCls) + '"' +
          act(handler, id) + '>' + esc(label) + '</button>';
      }) + '</div>';
  }
  SA.seg = seg;

  /* Accepts a plain string/{id,label} list, plus two extras selectField's
     real call sites need: a group header (`{group:'Name'}`, rendered like
     the Quick Agent's existing .dd__group) and a non-selectable
     informational row (`{value, label, disabled:true}`). */
  function normOpts(list) {
    return (list || []).map(function (o) {
      if (o && typeof o === 'object' && o.group !== undefined) return { isGroup: true, label: o.group };
      if (typeof o === 'string') return { value: o, label: o };
      return { value: o.id !== undefined ? o.id : o.value, label: o.label || o.id || o.value, disabled: !!o.disabled };
    });
  }

  /* Dropdowns — never a native <select> (controls.md). "The trigger IS an
     Input Field with a chevron. The open panel is the Dropdown Menu
     component... List items ~36px, hover --border-disabled, selected adds
     --text-link." This renders that: a .field-styled <button> trigger plus
     a .dd panel (the same component already built for the Quick Agent
     picker), sized to the trigger's own width.

     Every existing state.js change-handler reads `ev.target.value` off a
     real DOM select — rewriting all of them was unnecessary. Instead the
     handler to invoke (`chgName`, `chgArg`, `chgArg2` — the exact three
     values a real `chg(chgName, chgArg, chgArg2)` would have carried) are
     packed into one opaque "spec" string, which doubles as this
     dropdown's open/closed identity (`state.dd === spec`). `A.pickSel` in
     state.js unpacks it and calls the original handler with a synthetic
     `{target:{value: v}}` — every handler these selects use only ever
     reads `.value` off that, so nothing downstream changed. */
  var SEL_SEP = '';
  SA.SEL_SEP = SEL_SEP;
  function selSpec(name, a1, a2) {
    return name + SEL_SEP + (a1 === undefined ? '' : a1) + SEL_SEP + (a2 === undefined ? '' : a2);
  }
  SA.selectField = function (list, current, chgName, chgArg, chgArg2, opts) {
    opts = opts || {};
    var items = normOpts(list);
    var cur = items.filter(function (o) { return !o.isGroup && o.value === current; })[0];
    var spec = selSpec(chgName, chgArg, chgArg2);
    var open = !opts.disabled && SA.state.dd === spec;
    return '<div class="' + cls('rsel', opts.cls, { 'rsel--disabled': opts.disabled }) + '"' +
        (opts.style ? ' style="' + esc(opts.style) + '"' : '') + '>' +
      '<button type="button" class="' + cls('field', 'rsel__trigger', { 'rsel__trigger--open': open }) + '"' +
        (opts.disabled ? ' disabled' : act('toggleSel', spec)) + '>' +
        '<span class="' + cls('rsel__val', { 'rsel__val--ph': !cur }) + '">' +
          esc(cur ? cur.label : (opts.placeholder || '')) + '</span>' +
        icon('keyboard_arrow_down', null, null, 'rsel__chev') +
      '</button>' +
      when(open, function () {
        return '<div class="dd rsel__panel">' + each(items, function (o) {
          if (o.isGroup) return '<div class="dd__group">' + esc(o.label) + '</div>';
          if (o.disabled) return '<div class="dd__opt dd__opt--dis">' + esc(o.label) + '</div>';
          return '<div class="' + cls('dd__opt', { 'dd__opt--sel': o.value === current }) + '"' +
            act('pickSel', spec, o.value) + '>' + esc(o.label) + '</div>';
        }) + '</div>';
      }) +
    '</div>';
  };

  /* A state-bound select. `key` scopes the value; `list` may lead with the
     current value, which is de-duplicated against the rest. */
  SA.pickVal = function (key, def) {
    var v = SA.state.picks[key];
    return v === undefined ? def : v;
  };
  SA.pick = function (key, list, def, extra) {
    var seen = {}, opts = [];
    list.forEach(function (o) { if (!seen[o]) { seen[o] = 1; opts.push(o); } });
    return SA.selectField(opts, SA.pickVal(key, def), 'setPick', key, undefined, { cls: extra });
  };
  SA.chkVal = function (key, def) {
    var v = SA.state.checks[key];
    return v === undefined ? def : v;
  };
  SA.chk = function (key, def, label) {
    return '<label class="row f13 ink2" style="gap:8px;cursor:pointer"' +
      act('togglePick', key, def ? 'on' : 'off') + '>' +
      checkStatic(SA.chkVal(key, def)) + esc(label) + '</label>';
  };

  function spinner(text, big) {
    return '<span class="row" style="gap:8px;font-size:14px">' +
      '<span class="' + cls('spinner', { 'spinner--lg': big }) + '"></span>' + esc(text) + '</span>';
  }
  SA.spinner = spinner;

  function okPill(text) {
    return '<span class="pill pill--ok">' + icon('check_circle', 16) + esc(text) + '</span>';
  }
  SA.okPill = okPill;

  function eyebrow(text, style) {
    return '<div class="rmx-eyebrow"' + (style ? ' style="' + esc(style) + '"' : '') + '>' + esc(text) + '</div>';
  }
  SA.eyebrow = eyebrow;

  function checkline(text, small) {
    return '<div class="' + cls('checkline', { 'checkline--sm': small }) + '">' +
      icon('check') + '<span>' + esc(text) + '</span></div>';
  }
  SA.checkline = checkline;

  /* ---------- text ---------- */
  /* Resolve {param} placeholders in a detection check against its params. */
  function fill(text, params) {
    return String(text).replace(/\{(\w+)\}/g, function (m, k) {
      return params && params[k] !== undefined ? params[k] : m;
    });
  }
  SA.fill = fill;

  /* Resolve {token} merge fields against the preview values. */
  function merge(text) {
    return String(text).replace(/\{\w+\}/g, function (m) {
      return SA.previewValues[m] !== undefined ? SA.previewValues[m] : m;
    });
  }
  SA.merge = merge;

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  SA.plural = plural;
})(window.SA = window.SA || {});
