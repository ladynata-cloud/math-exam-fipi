/* Read-only skill routes shared by the base EGE learning pages. */
(function (root) {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const noop = () => {};
  function safeHref(value) {
    const href = String(value || '');
    return /^(?:\/(?!\/)|#)/.test(href) ? href : '#';
  }
  function mapFor(options) {
    const data = root.EgeBazaSkillMaps;
    if (!data) return null;
    if (options.module && options.skill) return data.forLegacy?.(options.module, options.skill) || null;
    return options.lessonId ? data.forLesson(options.lessonId) : data.forPosition(Number(options.pos));
  }
  function projection(options) {
    if (options.journey) return options.journey;
    try { return root.EgeBazaJourney?.snapshot() || null; } catch (_) { return null; }
  }
  function evidenceRows(options) {
    const journey = projection(options);
    const rows = new Map();
    for (const line of journey?.lines || []) {
      for (const item of line.items || []) if (item.source === 'path') rows.set(item.id, item);
    }
    // The current exercise is already validated by its own controller. Using it
    // avoids a one-save delay after a successful answer; it never writes a save.
    const lesson = options.lesson;
    if (options.lessonId && lesson && Number.isSafeInteger(lesson.independent) && lesson.independent >= 0 &&
        Number.isSafeInteger(lesson.guided) && lesson.guided >= 0) {
      rows.set(options.lessonId, {id:options.lessonId, status:lesson.independent > 0 ? 'independent' : lesson.guided > 0 || lesson.done ? 'guided' : lesson.attempted || lesson.help ? 'started' : 'unstarted',
        independent:lesson.independent > 0, guidedCount:lesson.guided});
    }
    return rows;
  }
  function practice(id) {
    const item = root.EgeBazaSkillMaps?.forLesson(id);
    return item ? {id:item.id, title:item.title, href:'/ege-baza/path/index.html#lesson=' + encodeURIComponent(item.id)} : null;
  }
  function evidenceMarkup(skill, rows) {
    const targets = (skill.practiceIds || []).map(id => ({item:practice(id), result:rows.get(id)})).filter(value => value.item);
    const independent = targets.find(value => value.result?.independent === true);
    if (independent) return '<p class="esm-evidence" data-skill-evidence="independent">Есть самостоятельное решение: <b>' + esc(independent.item.title) + '</b>.</p>';
    const guided = targets.find(value => value.result && ['guided','started'].includes(value.result.status));
    if (guided) return '<p class="esm-evidence" data-skill-evidence="practice">Есть работа в тренажёре «' + esc(guided.item.title) + '». Самостоятельный ответ ещё не отмечен.</p>';
    if (targets.some(value => value.result?.status === 'unknown' || value.result?.independent === null))
      return '<p class="esm-evidence" data-skill-evidence="unknown">Часть результатов сейчас недоступна.</p>';
    return '';
  }
  function skillsMarkup(map, options) {
    const rows = evidenceRows(options);
    return '<ol class="esm-route">' + map.skills.map((skill, index) => {
      const targets = (skill.practiceIds || []).map(practice).filter(Boolean);
      return '<li class="esm-node" data-skill-node="' + esc(skill.id) + '"><span class="esm-step" aria-hidden="true">' + (index + 1) +
        '</span><div class="esm-node-content"><h3>' + esc(skill.title) + '</h3><p>' + esc(skill.description) + '</p>' +
        (targets.length ? '<div class="esm-practice-links">' + targets.slice(0, 2).map(target => '<a href="' + esc(target.href) + '" data-skill-practice="' + esc(target.id) + '">' +
          (target.id === options.lessonId ? 'Этот тренажёр: ' : 'Тренировать: ') + esc(target.title) + '</a>').join('') +
          (targets.length > 2 ? '<details class="esm-more"><summary>Ещё упражнения: ' + (targets.length - 2) + '</summary>' + targets.slice(2).map(target =>
            '<a href="' + esc(target.href) + '" data-skill-practice="' + esc(target.id) + '">' + esc(target.title) + '</a>').join('') + '</details>' : '') + '</div>' : '') +
        evidenceMarkup(skill, rows) + '</div></li>';
    }).join('') + '</ol>';
  }
  function bodyMarkup(map, options) {
    const prerequisite = map.prerequisites || [];
    const title = map.goal || 'Выбери умение, которое хочешь отработать. Рядом — упражнения для практики.';
    return '<div class="esm-body"><p class="esm-goal">' + esc(title) + '</p>' +
      (prerequisite.length ? '<details class="esm-prerequisites"><summary>Что повторить перед началом</summary><ul>' +
        prerequisite.map(item => '<li><a href="' + esc(safeHref(item.href)) + '" target="_blank" rel="noopener" aria-label="' + esc(item.title + ' — в новой вкладке') + '">' + esc(item.title) + ' <span aria-hidden="true">↗</span></a>' +
          (item.reason ? '<span>' + esc(item.reason) + '</span>' : '') + '</li>').join('') + '</ul><p class="esm-support-note">Упражнение откроется в новой вкладке. Эта задача останется на месте.</p></details>' : '') +
      skillsMarkup(map, options) +
      '<p class="esm-key">Отметка относится к решению в указанном тренажёре. Для уверенного владения умением нужны разные задачи и повторение.</p>' +
      (options.onSteps && options.task ? '<div class="esm-task-steps"><p data-skill-step-count></p><button type="button" data-skill-steps>Решать эту задачу по шагам</button></div>' : '') +
      (map.next?.length && options.lessonId ? '<div class="esm-next"><span>Следующий тренажёр</span>' + map.next.slice(0, 2).map(item =>
        '<a href="' + esc(safeHref(item.href)) + '">' + esc(item.title) + '</a>').join('') + '</div>' : '') +
      '<a class="esm-course-link" href="/ege-baza/index.html#task?pos=' + Number(map.pos || options.pos) + '&amp;skills=1">Карта навыков задания №' +
      Number(map.pos || options.pos) + '</a></div>';
  }
  function markup(options) {
    const map = mapFor(options);
    if (!map || !Array.isArray(map.skills) || !map.skills.length) return '';
    return '<details class="ege-skill-map" data-ege-skill-map="' + esc(options.lessonId || options.module && options.module + ':' + options.skill || 'position-' + map.pos) + '"' +
      (options.open ? ' open' : '') + '><summary><span class="esm-symbol" aria-hidden="true">✦</span><span>Карта навыков' +
      (options.pos && !options.lessonId ? ' · №' + Number(options.pos) : '') + '</span><span class="esm-count">Умений: ' + map.skills.length +
      '</span></summary>' + bodyMarkup(map, options) + '</details>';
  }
  function positionMarkup(pos, options) {
    return markup(Object.assign({}, options || {}, {pos:Number(pos)}));
  }
  function attach(host, options) {
    options = options || {};
    const html = markup(options);
    if (!host || !html || !host.ownerDocument) return {refresh:noop, dispose:noop};
    // Each learning controller owns its subtree and calls attach after render.
    // A duplicate call in the same render must not add another route or handler.
    const existing = Array.from(host.children).find(node => node.hasAttribute?.('data-ege-skill-map'));
    if (existing) {
      if (existing.egeSkillController) return existing.egeSkillController;
      existing.remove();
    }
    const holder = host.ownerDocument.createElement('div');
    holder.innerHTML = html;
    const element = holder.firstElementChild;
    host.appendChild(element);
    let disposed = false, revealed = false;
    const reveal = () => {
      if (disposed || !element.isConnected) return;
      // A map includes short methods of solution. All in-task disclosures use
      // the writer's existing help marker, including keyboard/programmatic open.
      if (!revealed) { revealed = true; options.onReveal?.(); }
    };
    const onClick = event => {
      if (event.target.closest('summary') === element.querySelector('summary') && !element.open) reveal();
      const step = event.target.closest('[data-skill-steps]');
      if (step) { reveal(); options.onSteps?.(); }
      const same = event.target.closest('[data-skill-practice]');
      if (same && same.dataset.skillPractice === options.lessonId && options.onSteps) {
        event.preventDefault(); reveal(); options.onSteps();
      }
    };
    const onToggle = () => { if (element.open) reveal(); };
    element.addEventListener('click', onClick);
    element.addEventListener('toggle', onToggle);
    function refresh() {
      if (disposed || !element.isConnected) return;
      const map = mapFor(options), rows = evidenceRows(options);
      if (!map) return;
      for (const node of element.querySelectorAll('[data-skill-node]')) {
        const skill = map.skills.find(item => item.id === node.dataset.skillNode);
        const content = node.querySelector('.esm-node-content');
        if (!skill || !content) continue;
        content.querySelector('[data-skill-evidence]')?.remove();
        const evidence = evidenceMarkup(skill, rows);
        if (evidence) content.insertAdjacentHTML('beforeend', evidence);
      }
      const count = element.querySelector('[data-skill-step-count]');
      if (count) {
        const total = options.task?.steps?.length || 0;
        const done = Math.min(total, Math.max(0, Number(options.lesson?.step) || 0));
        count.textContent = 'Шагов разбора выполнено: ' + done + ' из ' + total + '. Это работа с помощью.';
      }
    }
    function dispose() {
      if (disposed) return;
      disposed = true;
      element.removeEventListener('click', onClick);
      element.removeEventListener('toggle', onToggle);
      element.remove();
    }
    const controller = {refresh, dispose};
    element.egeSkillController = controller;
    if (element.open) reveal();
    refresh();
    return controller;
  }
  root.EgeBazaSkillMap = Object.freeze({markup, positionMarkup, attach});
})(typeof window === 'object' ? window : globalThis);
