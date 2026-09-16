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

  function options(list, current) {
    return each(list, function (o) {
      var v = typeof o === 'string' ? o : o.id;
      var l = typeof o === 'string' ? o : (o.label || o.id);
      return '<option value="' + esc(v) + '"' + (v === current ? ' selected' : '') + '>' + esc(l) + '</option>';
    });
  }
  SA.options = options;

  /* A state-bound <select>. `key` scopes the value; `list` may lead with the
     current value, which is de-duplicated against the rest. */
  SA.pickVal = function (key, def) {
    var v = SA.state.picks[key];
    return v === undefined ? def : v;
  };
  SA.pick = function (key, list, def, extra) {
    var seen = {}, opts = [];
    list.forEach(function (o) { if (!seen[o]) { seen[o] = 1; opts.push(o); } });
    return '<select class="field' + (extra ? ' ' + extra : '') + '"' +
      chg('setPick', key) + '>' + options(opts, SA.pickVal(key, def)) + '</select>';
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
    return '<span class="row" style="gap:8px;font-size:13px">' +
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
