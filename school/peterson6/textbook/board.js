(function (win) {
  'use strict';
  const id = document.body.dataset.petersonBoard;
  if (!['peterson6-textbook', 'peterson6-workshop'].includes(id)) return;
  if (location.pathname !== '/trainers/' + id + '.html' || !win.MathExamBoard) throw new Error('Нужен зарегистрированный вход общей доски');

  const book = win.PetersonBook;
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function stable(x) {
    if (Array.isArray(x)) return x.map(stable);
    if (!object(x)) return x;
    return Object.fromEntries(Object.keys(x).sort().map(key => [key, stable(x[key])]));
  }
  function safeText(x, limit) {
    return String(x ?? '').slice(0, limit);
  }
  // The transport rejects HTML-shaped strings. A reversible escape keeps inequalities
  // such as “a<b and c>d” intact across controllers, including when the user types ~.
  function mapText(value, transform) {
    if (typeof value === 'string') return transform(value);
    if (Array.isArray(value)) return value.map(entry => mapText(entry, transform));
    if (!object(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, mapText(entry, transform)]));
  }
  const encode = value => mapText(value, text => text.replace(/~/g, '~~').replace(/</g, '~l'));
  const decode = value => mapText(value, text => text.replace(/~([~l])/g, (_, mark) => mark === '~' ? '~' : '<'));
  function work(part, raw) {
    const cleaned = book.sanitize(part, raw);
    book.assist(cleaned);
    cleaned.updated = 0;
    return cleaned;
  }
  function flags(raw) {
    if (!object(raw) || typeof raw.text !== 'string' || typeof raw.ok !== 'boolean') throw TypeError('Некорректное сообщение');
    return {text: safeText(raw.text, 600), ok: raw.ok};
  }
  function synchronize(app) {
    let applying = false, timer, notify = () => {}, previous = '';
    function snapshot() { return encode(app.normalize(app.get())); }
    function validate(value) {
      return win.MathExamBoard.validateState(value).ok &&
        JSON.stringify(stable(value)) === JSON.stringify(stable(encode(app.normalize(decode(value)))));
    }
    function apply(value) {
      if (!validate(value)) throw TypeError('Состояние этой задачи не подходит');
      clearTimeout(timer); applying = true;
      try { app.apply(decode(value)); previous = JSON.stringify(snapshot()); }
      finally { applying = false; }
    }
    function schedule() {
      if (applying) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = JSON.stringify(snapshot());
        if (next !== previous) { previous = next; notify(); }
      }, 0);
    }
    document.addEventListener('input', e => {
      const input = e.target;
      if (!input.matches?.('input[type=text],input:not([type]),textarea')) return;
      const limit = input.tagName === 'TEXTAREA' ? 1500 : 240;
      input.value = safeText(input.value, Math.min(input.maxLength > 0 ? input.maxLength : limit, limit));
    }, true);
    document.addEventListener('click', e => {
      const anchor=e.target.closest?.('a[href]');
      if (anchor && !anchor.getAttribute('href').startsWith('#')) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    previous = JSON.stringify(snapshot());
    win.PetersonVolumeRoom = Object.freeze({getState:snapshot,applyState:apply,validateState(value){try{return validate(value);}catch(_){return false;}}});
    win.MathExamBoard.register({id, version:'1.0.0', stateSchemaVersion:1, parentOrigin:location.origin,
      getState:snapshot, applyState:apply, subscribe(callback) {
        notify=callback;
        const events=['input','change','click','submit','toggle','close'];
        events.forEach(name=>document.addEventListener(name,schedule,true));
        win.addEventListener('hashchange',schedule);
        return ()=>{clearTimeout(timer);events.forEach(name=>document.removeEventListener(name,schedule,true));win.removeEventListener('hashchange',schedule);notify=()=>{};};
      }});
  }
  win.PetersonVolumeBoard=Object.freeze({id,work,flags,safeText,synchronize});
})(window);
