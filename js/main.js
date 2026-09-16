/* ============================================================
   Smart Agents — render loop and event wiring
   One innerHTML pass per state change, one delegated listener,
   caret preserved across renders via data-fk keys.
   ============================================================ */
(function (SA) {
  'use strict';

  var root;

  /* ---------- focus / caret ---------- */
  function captureFocus() {
    var el = document.activeElement;
    if (!el || !el.dataset || !el.dataset.fk) return null;
    var snap = { key: el.dataset.fk };
    if (el.selectionStart !== undefined && el.selectionStart !== null) {
      try { snap.start = el.selectionStart; snap.end = el.selectionEnd; } catch (e) { /* not a text field */ }
    }
    return snap;
  }

  function restoreFocus(snap) {
    if (!snap) return;
    var el = root.querySelector('[data-fk="' + snap.key.replace(/"/g, '\\"') + '"]');
    if (!el) return;
    el.focus();
    if (snap.start !== undefined) {
      try { el.setSelectionRange(snap.start, snap.end); } catch (e) { /* select elements */ }
    }
  }

  /* ---------- screen switch ---------- */
  function screenHtml() {
    var s = SA.state;
    if (s.screen === 'workspace') return '<div class="main">' + SA.viewWorkspace() + '</div>';
    if (s.screen === 'admin') return SA.viewAdmin();            // supplies its own .main
    if (s.screen === 'agent') return SA.viewAgent();           // supplies its own .main
    if (s.screen === 'templates') return '<div class="main">' + SA.viewTemplates() + '</div>';
    if (s.screen === 'quick') return '<div class="main">' + SA.viewQuick() + '</div>';
    if (s.screen === 'inbox') return '<div class="main">' + SA.viewInbox() + '</div>';
    return '<div class="main">' + SA.viewLibrary() + '</div>';
  }

  SA.render = function () {
    var snap = captureFocus();
    var scroll = {};
    root.querySelectorAll('.screen, .canvas, .inspector, .nav').forEach(function (el, i) {
      if (el.scrollTop) scroll[el.className + ':' + i] = el.scrollTop;
    });

    root.className = 'rmx app' + (SA.props.density === 'Compact' ? ' dense' : '');
    root.innerHTML =
      SA.ICON_SPRITE +
      SA.ADMIN_ICON_SPRITE +
      SA.ORION_SYMBOL +
      SA.viewHeader() +
      SA.viewContextBar() +
      (SA.state.screen === 'workspace' || SA.state.screen === 'admin' ? '' : SA.viewNavTabs()) +
      '<div class="app__body">' + screenHtml() + '</div>' +
      SA.viewDialogs() +
      SA.viewMenu() +
      SA.viewToast();

    root.querySelectorAll('.screen, .canvas, .inspector, .nav').forEach(function (el, i) {
      var key = el.className + ':' + i;
      if (scroll[key]) el.scrollTop = scroll[key];
    });
    restoreFocus(snap);

    if (SA.state._scrollToAdminCat) {
      var target = root.querySelector('#admin-sec-' +
        SA.state._scrollToAdminCat.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      if (target) target.scrollIntoView({ block: 'start' });
      SA.state._scrollToAdminCat = null;
    }
  };

  /* ---------- dispatch ---------- */
  var DD_ACTIONS = { openWhenDd: 1, openThenDd: 1, pickWhen: 1, pickThen: 1, toggleSel: 1, pickSel: 1 };

  function run(name, arg, arg2, ev) {
    var fn = SA.actions[name];
    if (!fn) { console.warn('Smart Agents: no action named "' + name + '"'); return; }
    fn(arg, arg2, ev);
  }

  function onClick(ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) {
      if (SA.state.dd) { SA.state.dd = null; SA.render(); }
      return;
    }
    /* Overlay backdrops close on click, but not when the click was inside the panel. */
    if (el.classList.contains('overlay') && ev.target.closest('[data-stop]')) return;

    var name = el.dataset.act;
    if (el.tagName === 'A') ev.preventDefault();
    run(name, el.dataset.arg, el.dataset.arg2, ev);
    if (!DD_ACTIONS[name] && SA.state.dd) SA.state.dd = null;
    SA.render();
  }

  function onEdit(ev) {
    var el = ev.target.closest('[data-chg]');
    if (!el) return;
    /* Text fields update as you type; selects on change. */
    var isText = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
    if (ev.type === 'input' && !isText) return;
    if (ev.type === 'change' && isText) return;
    run(el.dataset.chg, el.dataset.arg, el.dataset.arg2, ev);
    SA.render();
  }

  /* ---------- boot ---------- */
  function boot() {
    root = document.getElementById('app');
    if (!root) { console.error('Smart Agents: #app not found'); return; }
    root.addEventListener('click', onClick);
    root.addEventListener('change', onEdit);
    root.addEventListener('input', onEdit);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (SA.state.dialog) { SA.actions.closeDialog(); SA.render(); }
        else if (SA.state.dd) { SA.state.dd = null; SA.render(); }
      }
    });
    SA.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.SA = window.SA || {});
