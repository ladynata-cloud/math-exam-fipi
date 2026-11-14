/* Inlined only in the downloaded HTML. */
(function standaloneTrainer(config) {
  'use strict';
  const source = new URL(config.source);
  const current = new URL(location.href);
  const indexPath = source.pathname.endsWith('/index.html') ? source.pathname.slice(0, -'index.html'.length) : null;

  function link(href) {
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|data:|blob:)/i.test(href)) return href;
    const url = new URL(href, source);
    // Some course helpers have already resolved site paths using the file URL.
    if (url.protocol === 'file:') {
      if (url.pathname === current.pathname) return href;
      url.href = new URL(url.pathname + url.search + url.hash, source.origin).href;
    }
    if (url.origin !== source.origin) return href;
    if (url.pathname === source.pathname || url.pathname === indexPath) {
      const local = new URL(current.href);
      local.search = url.search;
      local.hash = url.hash;
      return local.href;
    }
    return url.href;
  }

  function update(anchor) {
    if (anchor.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
    const href = anchor.getAttribute('href');
    const fixed = link(href);
    if (fixed !== href) anchor.setAttribute('href', fixed);
  }

  window.MathExamTrainerOffline = Object.freeze({
    origin: source.origin,
    media: pathname => config.media[pathname] || pathname
  });

  // Practice views create and replace links as the learner switches tasks.
  const anchors = 'a[href]';
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes' && record.target.matches(anchors)) update(record.target);
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches(anchors)) update(node);
        node.querySelectorAll(anchors).forEach(update);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
})
