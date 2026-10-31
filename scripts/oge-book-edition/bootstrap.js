/* Fixed-edition boundary. Generated copies receive a literal immutable config. */
(function () {
  'use strict';
  const config = __BOOK_CONFIG__;
  const prefix = 'mathExamBook:' + config.edition + ':';
  const nativeStores = new Map();
  const scopedStores = new Map();
  for (const name of ['localStorage', 'sessionStorage']) {
    let native;
    try { native = window[name]; } catch (_) { continue; }
    const keys = () => {
      const out = [];
      for (let i = 0; i < native.length; i++) {
        const key = native.key(i);
        if (key && key.startsWith(prefix)) out.push(key.slice(prefix.length));
      }
      return out;
    };
    const methods = {
      getItem: key => native.getItem(prefix + String(key)),
      setItem: (key, value) => native.setItem(prefix + String(key), String(value)),
      removeItem: key => native.removeItem(prefix + String(key)),
      clear: () => { for (const key of keys()) native.removeItem(prefix + key); },
      key: index => keys()[Number(index) >>> 0] ?? null
    };
    const scoped = new Proxy(Object.create(null), {
      get: (_, key) => key === 'length' ? keys().length
        : key === Symbol.toStringTag ? 'Storage'
        : Object.hasOwn(methods, key) ? methods[key]
        : typeof key === 'string' ? methods.getItem(key) ?? undefined : undefined,
      set: (_, key, value) => { methods.setItem(key, value); return true; },
      deleteProperty: (_, key) => { methods.removeItem(key); return true; },
      ownKeys: keys,
      has: (_, key) => Object.hasOwn(methods, key) || key === 'length' || methods.getItem(key) !== null,
      getOwnPropertyDescriptor: (_, key) => typeof key === 'string' && methods.getItem(key) !== null
        ? {configurable: true, enumerable: true, writable: true, value: methods.getItem(key)} : undefined,
      defineProperty: (_, key, descriptor) => {
        if (!Object.hasOwn(descriptor, 'value')) return false;
        methods.setItem(key, descriptor.value); return true;
      }
    });
    nativeStores.set(name, native);
    scopedStores.set(name, scoped);
    Object.defineProperty(window, name, {configurable: false, enumerable: true, get: () => scoped});
  }
  // Existing multi-tab guards receive their original logical keys. A public
  // trainer's storage event must never invalidate a separate book exercise.
  window.addEventListener('storage', event => {
    const store = [...nativeStores].find(([, native]) => native === event.storageArea);
    if (!store) return;
    if (event.key !== null && !event.key.startsWith(prefix)) {
      event.stopImmediatePropagation(); return;
    }
    if (event.key !== null) Object.defineProperty(event, 'key', {value: event.key.slice(prefix.length)});
    Object.defineProperty(event, 'storageArea', {value: scopedStores.get(store[0])});
  }, true);

  const files = new Set(config.paths);
  const pathFile = pathname => pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  function rewriteLink(anchor) {
    const href = anchor.getAttribute('href');
    if (!href || /^(?:#|data:|blob:|javascript:|mailto:|tel:)/i.test(href)) return;
    let url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    const sameSite = url.origin === location.origin || url.origin === config.publicOrigin;
    let original = url.pathname;
    if (sameSite && original.startsWith(config.path)) original = '/' + original.slice(config.path.length);
    if (sameSite && files.has(pathFile(original))) {
      const fixed = config.path + original.slice(1) + url.search + url.hash;
      if (anchor.getAttribute('href') !== fixed) anchor.setAttribute('href', fixed);
      anchor.removeAttribute('data-book-exit');
      return;
    }
    if (sameSite && url.pathname.startsWith(config.aliasPath)) return;
    if (sameSite) {
      const outside = config.publicOrigin + original + url.search + url.hash;
      if (anchor.getAttribute('href') !== outside) anchor.setAttribute('href', outside);
    }
    anchor.dataset.bookExit = '';
    anchor.title = 'Вне книжной редакции: эта страница может обновляться';
    if (anchor.target === '_blank') anchor.rel = 'noopener noreferrer';
  }
  const scan = node => {
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.matches?.('a[href],area[href]')) rewriteLink(node);
    node.querySelectorAll?.('a[href],area[href]').forEach(rewriteLink);
  };
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') rewriteLink(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['href']});
  document.addEventListener('DOMContentLoaded', () => {
    scan(document);
    const footer = document.createElement('aside');
    footer.className = 'book-edition-note';
    footer.setAttribute('aria-label', 'Книжная редакция');
    const label = document.createElement('span');
    label.textContent = 'Книжная редакция · 31.10.2026 · v1. Результаты хранятся отдельно в этом браузере.';
    const manifest = document.createElement('a');
    manifest.href = config.path + 'manifest.json';
    manifest.textContent = 'Состав редакции';
    footer.append(label, ' ', manifest);
    document.body.append(footer);
  }, {once: true});
  Object.defineProperty(window, 'MathExamBookEdition', {
    value: Object.freeze({edition: config.edition, path: config.path, storagePrefix: prefix}), writable: false
  });
})();
