/* Accessibility toolbar, skip link, top-of-page start and in-page anchors (shared by all pages) */
(function () {
  var doc = document, root = doc.documentElement, KEY = 'mk_a11y';
  var state = { t: 0, gray: 0, underline: 0, links: 0, font: 0, still: 0, contrast: 0 };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Always open at the top (no restored scroll position, no leftover #anchor)
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  function top() { try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); } }
  if (location.hash) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  top();
  doc.addEventListener('DOMContentLoaded', top);
  window.addEventListener('load', function () { top(); setTimeout(top, 250); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) top(); });

  // In-page links scroll smoothly without writing a #hash into the address
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    var el = doc.getElementById(a.getAttribute('href').slice(1));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: (calm || state.still) ? 'auto' : 'smooth', block: 'start' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });

  // Skip link
  var skip = doc.createElement('a');
  skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'דלגי לתוכן הראשי';
  doc.body.insertBefore(skip, doc.body.firstChild);

  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in state) if (typeof s[k] === 'number') state[k] = s[k]; } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function apply() {
    var c = root.classList;
    ['a11y-t1', 'a11y-t2', 'a11y-t3'].forEach(function (x) { c.remove(x); });
    if (state.t) c.add('a11y-t' + state.t);
    c.toggle('a11y-gray', !!state.gray); c.toggle('a11y-underline', !!state.underline);
    c.toggle('a11y-links', !!state.links); c.toggle('a11y-font', !!state.font);
    c.toggle('a11y-still', !!state.still); c.toggle('a11y-contrast', !!state.contrast);
  }
  load(); apply();

  var btn = doc.createElement('button');
  btn.type = 'button'; btn.className = 'a11y-btn'; btn.setAttribute('aria-label', 'תפריט נגישות'); btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.2" r="1.7" fill="currentColor"/><path d="M5 8.5l7 1.6 7-1.6"/><path d="M12 10.1V15"/><path d="M12 15l-3.4 5.2"/><path d="M12 15l3.4 5.2"/></svg>';

  var panel = doc.createElement('div');
  panel.className = 'a11y-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'תפריט נגישות');
  panel.innerHTML =
    '<h2><span>נגישות</span><button type="button" class="a11y-x" aria-label="סגירת תפריט הנגישות">×</button></h2>' +
    '<div class="a11y-grid">' +
    '<button type="button" class="opt" data-a="bigger">הגדלת טקסט</button>' +
    '<button type="button" class="opt" data-a="smaller">הקטנת טקסט</button>' +
    '<button type="button" class="opt" data-a="contrast" aria-pressed="false">ניגודיות גבוהה</button>' +
    '<button type="button" class="opt" data-a="gray" aria-pressed="false">גווני אפור</button>' +
    '<button type="button" class="opt" data-a="underline" aria-pressed="false">קו תחתון לקישורים</button>' +
    '<button type="button" class="opt" data-a="links" aria-pressed="false">הדגשת קישורים</button>' +
    '<button type="button" class="opt" data-a="font" aria-pressed="false">גופן קריא</button>' +
    '<button type="button" class="opt" data-a="still" aria-pressed="false">עצירת אנימציות</button>' +
    '</div>' +
    '<button type="button" class="opt reset" data-a="reset">איפוס הגדרות</button>' +
    '<div class="a11y-links"><a href="accessibility.html">הצהרת נגישות</a></div>';

  doc.body.appendChild(btn); doc.body.appendChild(panel);

  function sync() {
    panel.querySelectorAll('[aria-pressed]').forEach(function (b) { b.setAttribute('aria-pressed', state[b.getAttribute('data-a')] ? 'true' : 'false'); });
  }
  function open() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); sync(); panel.querySelector('.a11y-x').focus(); }
  function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
  panel.querySelector('.a11y-x').addEventListener('click', close);
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) close();
    if (e.key === 'Tab' && !panel.hidden) {
      var f = [].slice.call(panel.querySelectorAll('button,a')); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'bigger') state.t = Math.min(3, state.t + 1);
    else if (a === 'smaller') state.t = Math.max(0, state.t - 1);
    else if (a === 'reset') for (var k in state) state[k] = 0;
    else state[a] = state[a] ? 0 : 1;
    apply(); save(); sync();
  });
})();
