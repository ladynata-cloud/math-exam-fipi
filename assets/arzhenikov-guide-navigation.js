/* Page-only presentation of the existing public navigator. Lesson content stays
   in source HTML; the shared widget, dialog and handlers are not replaced. */
(function () {
  'use strict';
  if (!['/topics/metod-arzhenikova/', '/topics/metod-arzhenikova/index.html'].includes(location.pathname)) return;
  function placeNavigator() {
    if (!document.body?.classList.contains('arz-method')) return;
    const host = document.getElementById('maxexam-public-assistant');
    const menu = document.querySelector('body.arz-method header.site-header nav.site-nav');
    if (!host?.shadowRoot || !menu) return;
    if (!host.shadowRoot.querySelector('[data-arzhenikov-guide-navigation]')) {
      const style = document.createElement('style');
      style.setAttribute('data-arzhenikov-guide-navigation', '');
      style.textContent =
        ':host{display:inline-flex!important;position:static!important;contain:none!important;min-height:0!important;min-width:0;max-width:100%;align-self:center}' +
        '.launcher{position:static;inset:auto;z-index:auto;display:flex;width:auto;height:auto;min-height:44px;max-width:100%;padding:8px 12px;gap:8px;border-radius:12px;box-shadow:none}' +
        '.launcher-mark{width:24px;height:24px;flex:0 0 24px;font-size:20px}' +
        '.launcher-label{position:static;display:block;width:auto;height:auto;overflow:visible;clip-path:none;white-space:normal;line-height:1.3}' +
        '.launcher-label strong{font-size:16px}.launcher-label>span{display:none}';
      host.shadowRoot.append(style);
    }
    if (host.parentNode !== menu) {
      const focused = document.activeElement === host ? host.shadowRoot.activeElement : null;
      menu.append(host);
      focused?.focus({preventScroll: true});
    }
  }
  // Deferred scripts finish before DOMContentLoaded, including the exact shared
  // navigator pair. Re-running this adapter keeps the same host and one style.
  if (document.readyState === 'complete') placeNavigator();
  else document.addEventListener('DOMContentLoaded', placeNavigator, {once: true});
})();
