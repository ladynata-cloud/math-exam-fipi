(function (root) {
  'use strict';
  const adapter = root.Peterson5Board;
  if (!adapter || document.body?.dataset.petersonBoard !== adapter.marker) return;
  if (location.pathname !== adapter.path || !root.MathExamBoard || !root.PetersonApp?.boardMode || !root.PetersonWorkshop?.boardMode) {
    throw new Error('The shared Peterson course requires its board wrapper');
  }
  const main = document.getElementById('main');
  const session = adapter.create({ lessons: root.PetersonCourse.lessons, topics: root.PetersonWorkshopData.topics, math: root.PetersonMath });
  let applying = false, timer = null, notify = () => {}, last = '', rendered = location.hash || '#home';
  function media() { return root.Peterson5Media?.getState() || { gifPlaying: false }; }
  function getState() {
    if (rendered !== (location.hash || '#home')) root.PetersonApp.route();
    return session.pack({ route: location.hash || '#home', legacy: root.PetersonApp.getState(),
      workshop: root.PetersonWorkshop.getState(), view: session.readView(main, { media: media() }) });
  }
  function applyState(value) {
    const incoming = session.unpack(value);
    const previous = session.unpack(getState());
    clearTimeout(timer); applying = true;
    function restore(scene) {
      root.PetersonApp.replaceBoardState(scene.legacy);
      root.PetersonWorkshop.replaceBoardState(scene.workshop);
      history.replaceState(null, '', location.pathname + location.search + scene.route);
      root.PetersonApp.route();
      session.applyView(main, scene.view, { findNumber: root.PetersonApp.findNumber,
        applyMedia: state => root.Peterson5Media?.applyState(state) });
    }
    try {
      restore(incoming);
      last = JSON.stringify(getState());
    } catch (error) {
      restore(previous);
      last = JSON.stringify(getState());
      throw error;
    } finally { applying = false; }
  }
  function schedule() {
    if (applying) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (applying) return;
      try {
        const value = getState(), encoded = JSON.stringify(value);
        if (encoded !== last) { last = encoded; notify(); }
      } catch (error) {
        const node = document.getElementById('storage-warning');
        node.hidden = false; node.textContent = 'Последнее изменение не передалось на доску. Сократи длинную запись и повтори действие.';
        console.error(error);
      }
    }, 0);
  }
  // Keep visible drafts within the same limits as the transmitted scene.
  document.addEventListener('input', event => {
    const input = event.target;
    if (!input.matches?.('input[type=text],input[type=search],textarea')) return;
    const limit = input.tagName === 'TEXTAREA' ? 2000 : input.maxLength > 0 ? input.maxLength : 500;
    input.value = input.value.slice(0, limit).replace(/<\/?[a-z][^>]*>/gi, text => text.replace(/</g, '‹').replace(/>/g, '›'));
  }, true);
  root.addEventListener('peterson5:route', event => { rendered = event.detail; });
  root.__peterson5Board = Object.freeze({ getState, applyState, validateState: session.validateState });
  last = JSON.stringify(getState());
  root.MathExamBoard.register({ id: adapter.id, version: adapter.version, stateSchemaVersion: adapter.stateSchemaVersion,
    parentOrigin: location.origin, getState, applyState,
    subscribe(callback) {
      notify = callback;
      const events = ['click', 'input', 'change', 'submit', 'toggle', 'keydown'];
      events.forEach(name => document.addEventListener(name, schedule, true));
      root.addEventListener('hashchange', schedule);
      root.addEventListener('peterson5:change', schedule);
      return () => { clearTimeout(timer); events.forEach(name => document.removeEventListener(name, schedule, true));
        root.removeEventListener('hashchange', schedule); root.removeEventListener('peterson5:change', schedule); notify = () => {}; };
    }
  });
})(window);
