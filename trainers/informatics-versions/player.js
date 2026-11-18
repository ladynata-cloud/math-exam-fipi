'use strict';
(async function openEdition() {
  const args = new URLSearchParams(location.search);
  const period = args.get('edition') === 'november' ? 'november' : 'june';
  const entries = await read(period + '/manifest.json', 'json');
  const item = entries.find(entry => entry.slug === args.get('task'));
  if (!item || !/^[a-z0-9_.-]+\.html\.txt$/i.test(item.file)) throw Error('Этот выпуск отсутствует.');
  const frame = document.querySelector('iframe');
  const key = ['mathexam', 'informatics', '2026', period, item.slug].join('.');
  function readSaved(storageName) {
    try { return JSON.parse(window[storageName].getItem(key) || '{}'); }
    catch { return {}; }
  }
  // One opaque frame, one edition key, separate lifetimes for the two stores.
  const bridge = function(initial) {
    for (const [name, entries] of Object.entries(initial)) {
      const map = new Map(Object.entries(entries || {}));
      const notify = (op, key, value) => parent.postMessage({type:'edition-storage', name, op, key, value}, '*');
      Object.defineProperty(window, name, {value:{
        get length(){ return map.size; },
        key(index){ return Array.from(map.keys())[index] ?? null; },
        getItem(key){ return map.get(String(key)) ?? null; },
        setItem(key,value){ key=String(key); value=String(value); map.set(key,value); notify('set',key,value); },
        removeItem(key){ key=String(key); map.delete(key); notify('remove',key); },
        clear(){ map.clear(); notify('clear'); }
      }});
    }
  };
  addEventListener('message', event => {
    const m = event.data;
    if (event.source !== frame.contentWindow || event.origin !== 'null' || m?.type !== 'edition-storage') return;
    if (m.name !== 'sessionStorage' && m.name !== 'localStorage') return;
    try {
      const store = window[m.name];
      if (m.op === 'clear') store.removeItem(key);
      else if (typeof m.key === 'string') {
        const latest = Object.assign(Object.create(null), readSaved(m.name));
        if (m.op === 'set' && typeof m.value === 'string') latest[m.key] = m.value;
        else if (m.op === 'remove') delete latest[m.key];
        else return;
        store.setItem(key, JSON.stringify(latest));
      }
    } catch { /* Private browsing keeps the active session in memory. */ }
  });
  const state = {localStorage:readSaved('localStorage'), sessionStorage:readSaved('sessionStorage')};
  let raw = await read(period + '/' + item.file, 'text');
  const init = JSON.stringify(state).replace(/</g,'\\u003c');
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; base-uri 'none'; form-action 'none'";
  const prelude = '<meta http-equiv="Content-Security-Policy" content="'+policy+'"><script>('+bridge.toString()+')('+init+');<\/script>';
  if (!/<head(?:\s[^>]*)?>/i.test(raw)) throw Error('Не удалось прочитать сохранённый HTML.');
  frame.srcdoc = raw.replace(/<head(?:\s[^>]*)?>/i, tag => tag + prelude);
  const title = (period === 'june' ? 'Июнь' : 'Ноябрь') + ' 2026 · ' + item.title;
  document.querySelector('#title').textContent = frame.title = document.title = title;
  frame.hidden = false;
  document.querySelector('#status').hidden = true;
  async function read(url, format) {
    const response = await fetch(url);
    if (!response.ok) throw Error('Файл выпуска недоступен.');
    return response[format]();
  }
})().catch(error => {
  document.querySelector('#title').textContent = 'Выпуск не открыт';
  document.querySelector('#status').textContent = error.message + ' Вернитесь к сравнению и выберите тренажёр.';
});
