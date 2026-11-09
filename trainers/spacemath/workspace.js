/* Local workspace layout. Nothing here reads or changes the shared model. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const controls = $('workspace-controls'), tools = $('tools');
  if (!controls || !tools) return;
  const html = document.documentElement;
  const toolsButton = $('workspace-tools-toggle');
  const objectsButton = $('workspace-objects-toggle');
  const focusButton = $('workspace-focus-toggle');
  const compactMedia = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 700px)') : null;
  let compact = compactMedia ? compactMedia.matches : window.innerWidth <= 700;
  let toolsOpen = !compact, objectsOpen = !compact, focused = false, previousLayout = null;
  let publishedFocus = false;

  function render() {
    html.dataset.workspaceReady = 'true';
    html.dataset.workspaceCompact = String(compact);
    html.dataset.workspaceTools = toolsOpen ? 'open' : 'closed';
    html.dataset.workspaceObjects = objectsOpen ? 'open' : 'closed';
    html.dataset.workspaceFocus = String(focused);
    toolsButton.setAttribute('aria-expanded', String(toolsOpen));
    objectsButton.setAttribute('aria-expanded', String(objectsOpen));
    objectsButton.textContent = compact && objectsOpen ? 'К чертежу' : 'Объекты';
    objectsButton.setAttribute('aria-label', compact && objectsOpen ? 'Вернуться к чертежу' : objectsOpen ? 'Скрыть панель объектов' : 'Открыть панель объектов');
    focusButton.setAttribute('aria-pressed', String(focused));
    focusButton.textContent = focused ? 'Выйти' : 'Развернуть';
    focusButton.setAttribute('aria-label', focused ? 'Выйти из режима большого чертежа' : 'Развернуть чертёж в рабочем окне');
    controls.hidden = false;
    if (focused !== publishedFocus) {
      publishedFocus = focused;
      // The same-origin frame wrapper owns this window and validates its
      // document before applying a local host layout. No journal state is sent.
      window.dispatchEvent(new CustomEvent('mathexam:spacemath-layout', { detail: { focused } }));
    }
  }
  function closeGroups() { tools.querySelectorAll('details[open]').forEach(group => { group.open = false; }); }
  function exitFocus() {
    if (!focused) return;
    focused = false;
    if (previousLayout?.compact === compact) { toolsOpen = previousLayout.toolsOpen; objectsOpen = previousLayout.objectsOpen; }
    else { toolsOpen = !compact; objectsOpen = !compact; }
    previousLayout = null; closeGroups(); render(); focusButton.focus({ preventScroll: true });
  }
  toolsButton.addEventListener('click', () => {
    toolsOpen = !toolsOpen;
    if (toolsOpen && compact) objectsOpen = false;
    if (!toolsOpen) closeGroups();
    render();
  });
  objectsButton.addEventListener('click', () => {
    objectsOpen = !objectsOpen;
    if (objectsOpen && compact) { toolsOpen = false; closeGroups(); }
    render();
  });
  focusButton.addEventListener('click', () => {
    if (focused) { exitFocus(); return; }
    previousLayout = { toolsOpen, objectsOpen, compact };
    focused = true; toolsOpen = false; objectsOpen = false; closeGroups(); render();
    $('geometry-board')?.focus({ preventScroll: true });
  });
  tools.addEventListener('click', event => {
    const button = event.target.closest('button[data-tool]');
    if (!button || button.disabled || !(compact || focused)) return;
    toolsOpen = false; objectsOpen = false; closeGroups(); render();
    const parameter = $('transformation-parameter');
    (parameter && !parameter.hidden ? $('tool-parameter') : $('geometry-board'))?.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || $('confirm-dialog')?.open) return;
    if (focused) { event.preventDefault(); event.stopImmediatePropagation(); exitFocus(); }
    else if (compact && (objectsOpen || toolsOpen)) {
      event.preventDefault(); event.stopImmediatePropagation();
      objectsOpen = false; toolsOpen = false; closeGroups(); render();
      (document.activeElement?.closest('#workspace-inspector') ? objectsButton : toolsButton).focus({ preventScroll: true });
    }
  }, true);
  function updateWidth() {
    const next = compactMedia ? compactMedia.matches : window.innerWidth <= 700;
    if (next === compact) return;
    compact = next;
    if (!focused) { toolsOpen = !compact; objectsOpen = !compact; }
    closeGroups(); render();
  }
  if (compactMedia?.addEventListener) compactMedia.addEventListener('change', updateWidth);
  else window.addEventListener('resize', updateWidth);
  window.addEventListener('mathexam:spacemath-exit-focus', exitFocus);
  render();
})();
