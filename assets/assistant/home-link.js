/* Shared home return. Also bundled verbatim at the start of navigator-widget.js. */
(function (root) {
  'use strict';
  function mountHomeLink() {
    const document = root.document;
    if (root.self !== root.top || !document.body || document.getElementById('mathexam-home-navigation')) return;
    const pathname = root.location.pathname;
    if (pathname === '/' || pathname === '/index.html' || /^\/(?:book|b|learning|board-server|assistant-service|downloads|docs|tools|assets)\//.test(pathname)) return;
    const params = new URLSearchParams(root.location.search);
    if (['embed', 'embedded'].some(key => /^(?:1|true)$/.test(params.get(key) || ''))) return;
    const host = document.createElement('div');
    host.id = 'mathexam-home-navigation';
    // Shadow styles keep existing trainer button/nav rules away from this link.
    host.style.cssText = 'display:block;flex:none;order:-1;grid-column:1 / -1;align-self:stretch;box-sizing:border-box;width:100%;max-width:100%;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{color-scheme:light}*{box-sizing:border-box}nav{display:block;margin:0;padding:6px 12px;background:#f5f8f5;border-bottom:1px solid #d9e5dd;text-align:left;font:600 14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}a{display:inline-flex;align-items:center;gap:7px;min-height:44px;max-width:100%;padding:8px 12px;border:1px solid #b7cebf;border-radius:10px;background:#fff;color:#175d42;text-decoration:none;touch-action:manipulation}a:hover{background:#e8f3ed}a:focus-visible{outline:3px solid #176d49;outline-offset:2px}@media print{:host{display:none!important}}';
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Переход на главную');
    const link = document.createElement('a');
    link.href = '/';
    link.target = '_self';
    link.setAttribute('aria-label', 'На главную MathExam');
    link.textContent = '← На главную';
    nav.append(link);
    shadow.append(style, nav);
    // Some single-card trainers center a main element in a horizontal flex body.
    // Put their bar inside that card instead of adding a second horizontal column.
    let container = document.body;
    const bodyStyle = root.getComputedStyle(document.body);
    if (bodyStyle.display === 'flex' && /^row/.test(bodyStyle.flexDirection)) {
      container = document.body.querySelector('main') || Array.from(document.body.children).find(node => /^(?:DIV|ARTICLE|SECTION)$/.test(node.tagName)) || document.body;
    }
    container.prepend(host);
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mountHomeLink, { once: true });
  else mountHomeLink();
})(window);
