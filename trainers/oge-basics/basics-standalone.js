/* Task-first presentation for the unchanged legacy teaching sources. */
(function (root) {
  'use strict';
  const d = root.document;
  const $ = id => d.getElementById(id);
  function element(tag, className, text) {
    const node = d.createElement(tag); if (className) node.className = className;
    if (text) node.textContent = text; return node;
  }
  function details(title, className) {
    const node = element('details', className); node.append(element('summary', '', title)); return node;
  }
  function init() {
    if (root.MathExamRemediationManaged || root.MathExamDivisionCourseLocal || !root.MathExamBasicsHelp || d.body.dataset.basicsStandalone) return false;
    const practice = $('view-practice');
    const percent = !!($('p-q') && $('p-h1'));
    const generic = !!($('practicePrompt') && $('practiceAnswer') && $('hint1'));
    const division = !!($('taskTitle') && $('answerArea') && $('hint1') && root.__trainerDebug?.CONFIG);
    if (!practice || (!percent && !generic && !division)) return false;
    const firstHint = percent ? $('p-h1') : $('hint1');
    const secondHint = percent ? $('p-h2') : $('hint2');
    const solution = percent ? $('p-sol') : $('solutionBtn') || $('solution');
    const start = d.querySelector(percent ? '[data-nav="practice"],[data-go="practice"]' : '[data-route="practice"]');
    if (!firstHint || !start) return false;

    // The original action chooses the first practice task exactly once.
    start.click();
    if (practice.hidden) return false;
    d.body.dataset.basicsStandalone = percent ? 'percent' : division ? 'division' : 'basic';
    d.body.classList.add('basics-task-first');
    const title = root.__trainerDebug?.SPEC?.title || root.__trainerDebug?.CONFIG?.title || $('doc-title')?.textContent || d.title.split(' · ')[0];
    if (!percent) {
      const heading = element('h1', 'bs-title', title); practice.before(heading);
    }

    const menu = details('Тема и результаты', 'bs-options bs-navigation');
    const nav = d.querySelector(percent ? 'header nav' : '.topbar nav');
    if (nav) { nav.before(menu); menu.append(nav); }
    const options = details('Выбрать упражнение · мои результаты', 'bs-options bs-practice-options');
    practice.append(options);
    const heading = practice.querySelector(':scope > .head');
    const practiceHead = practice.querySelector(':scope > .practice-head');
    if (heading) options.append(heading);
    if (practiceHead) options.append(practiceHead);
    for (const node of [...practice.querySelectorAll(':scope > .level-card')]) options.append(node);
    if (percent) {
      if ($('chips')) options.append($('chips'));
      const stats = practice.querySelector(':scope > .stats'); if (stats) options.append(stats);
      for (const node of [...practice.children]) {
        if (node.tagName === 'H2' || (node.tagName === 'P' && !node.id)) node.classList.add('bs-redundant');
      }
    }

    const host = element('div', 'basics-help-host');
    host.setAttribute('data-basics-help-host', '');
    const anchor = percent ? $('p-q') : division ? $('phaseText') : $('practicePrompt');
    anchor.after(host);
    const helpRoot = element('div', 'bs-current-help');
    const hintControls = element('div', 'bs-hint-controls');
    firstHint.textContent = 'Небольшая подсказка';
    if (secondHint) secondHint.textContent = 'Ещё один намёк';
    for (const node of [firstHint, secondHint, solution]) if (node) hintControls.append(node);
    helpRoot.append(hintControls);
    const hintOutput = percent ? element('div', 'bs-hint-output') : $('hintStack');
    if (hintOutput) helpRoot.append(hintOutput);
    if (!percent) {
      const side = practice.querySelector('.side');
      if (side) {
        // Empty help-card copy is no longer useful; retain native counters.
        const stats = side.querySelector('.stats,.status-row'); if (stats) options.append(stats);
        side.classList.add('bs-redundant');
      }
    }

    const helper = root.MathExamBasicsHelp.create();
    const ids = new WeakMap(); let sequence = 0, currentIdentity = '', usedIdentity = '', scheduled = false;
    const contentId = location.pathname.split('/oge-basics/')[1]?.replace(/\.html$/, '') || '';
    function key(object) { if (!object) return 'empty'; if (!ids.has(object)) ids.set(object, ++sequence); return ids.get(object); }
    function taskIdentity() {
      const state = root.__trainerDebug?.state?.();
      if (division) return key(state?.task) + ':' + state?.stepIndex + ':' + ($('phaseText')?.textContent || '');
      if (generic) return String(key(state?.current || $('practiceAnswer')?.firstElementChild));
      // Percentage task is private to its original closure. Rendering creates
      // new prompt/answer nodes; typing and checking do not replace them.
      return String(key($('p-q')?.firstElementChild));
    }
    function capturePercentHint() {
      if (!percent) return;
      const feedback = $('p-fb');
      const isHint = feedback.classList.contains('tip') && /^(?:Подсказка\s*\d*\.|Разбор\.)/.test(feedback.textContent.trim());
      if (isHint) {
        if (hintOutput.innerHTML !== feedback.innerHTML) hintOutput.innerHTML = feedback.innerHTML;
        // Only explanatory markup is copied. The checker keeps its original
        // live region and will show ordinary success/error feedback there.
        feedback.hidden = true;
      } else feedback.hidden = false;
    }
    function markUsed() {
      if (usedIdentity === currentIdentity) return;
      usedIdentity = currentIdentity;
      firstHint.click(); // Native accounting, including existing streak rules.
      capturePercentHint();
    }
    function refresh() {
      scheduled = false;
      capturePercentHint();
      const identity = taskIdentity();
      if (identity === currentIdentity) return;
      currentIdentity = identity; usedIdentity = '';
      if (percent) hintOutput.replaceChildren();
      const condition = (percent ? $('p-q')?.querySelector('.prompt') : division ? $('taskTitle') : $('practicePrompt'))?.textContent || '';
      const phase = division ? root.__trainerDebug?.state?.().phase : '';
      const kind = {product:'product',remainder:'subtract',digit:'digit',bring:'bring',comma:'comma',shiftCount:'decimal-shift',shiftDividend:'decimal-shift',shiftDivisor:'decimal-shift'}[phase] || '';
      helper.update({host, identity:contentId + ':' + identity, contentId, context:{prompt:condition, step:division ? $('phaseText')?.textContent || '' : '',kind}, rootContent:helpRoot, onUse:markUsed, disabled:false});
    }
    function schedule() { if (!scheduled) { scheduled = true; root.queueMicrotask(refresh); } }
    const observer = new MutationObserver(schedule);
    for (const node of percent ? [$('p-q')] : division ? [$('phaseText'), $('taskTitle'), $('answerArea')] : [$('practicePrompt'), $('practiceAnswer')]) {
      if (node) observer.observe(node, {childList:true, subtree:true});
    }
    if (percent) {
      new MutationObserver(capturePercentHint).observe($('p-fb'), {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
      for (const button of [firstHint, secondHint, solution]) if (button) button.addEventListener('click', capturePercentHint);
    }

    function resumePractice() {
      // Native legacy navigation starts/rebuilds practice. A return from an
      // explanation instead reuses the live task and its actual input nodes.
      for (const view of d.querySelectorAll('.view')) view.hidden = view !== practice;
      const state = root.__trainerDebug?.state?.(); if (state) state.route = 'practice';
      for (const button of d.querySelectorAll('[data-route],[data-nav]')) button.classList.toggle('active', (button.dataset.route || button.dataset.nav) === 'practice');
      menu.open = false;
      host.querySelector('button')?.focus({preventScroll:true});
    }
    d.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      const route = button.dataset.route || button.dataset.nav || button.dataset.go;
      const finalLesson = ['lessonNext','l-next'].includes(button.id) && /(?:к практике|к тренировке|перейти к практике)/i.test(button.textContent);
      if (route === 'practice' || finalLesson) {
        event.preventDefault(); event.stopImmediatePropagation(); resumePractice();
      } else if (route === 'learn') markUsed();
    }, true);
    if (percent) d.addEventListener('keydown', event => {
      // The private percentage route variable still says "learn" after a
      // draft-preserving return. Dispatch Enter through the visible checker
      // instead of the original input's closure-bound lesson handler.
      if (event.key !== 'Enter' || practice.hidden || !$('p-q').contains(event.target) || event.target.tagName !== 'INPUT') return;
      event.preventDefault(); event.stopImmediatePropagation(); $('p-check').click();
    }, true);
    d.addEventListener('click', schedule);
    refresh();
    return true;
  }
  root.MathExamBasicsStandalone = {init};
  init();
})(window);
