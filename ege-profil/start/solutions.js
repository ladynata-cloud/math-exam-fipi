(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let sequence = 0;
  const format = value => typeof value === 'number' ? Number(value.toFixed(8)).toLocaleString('ru-RU', { maximumFractionDigits: 8 }) : String(value);

  function steps(task) {
    const override = root.ProfileSolutionDetails?.[task.id];
    const authored = (typeof override === 'function' ? override(task) : override) || root.ProfileRightTrigSteps?.(task);
    const result = authored?.length ? authored.slice() : task.steps.flatMap(question => {
      const hintParts = String(question.hint || '').split(/<br\s*\/?\s*>/i);
      if (hintParts.length > 1 && hintParts.every(part => /^\s*\d+\.\s/.test(part))) {
        const titles = ['Записываем величины', 'Приводим к общему знаменателю', 'Убираем знаменатель', 'Находим нужное произведение'];
        return hintParts.map((part, index) => ({ title: titles[index] || 'Продолжаем вычисление', lines: [{ html: part.replace(/^\s*\d+\.\s*/, '') }] })).concat({
          title: 'Вычисляем результат действия', lines: [{ html: question.why }, { formula: 'Получаем: ' + format(question.answer) }]
        });
      }
      return [{ title: question.prompt, lines: [{ html: question.hint }, { html: question.why }, { formula: 'Получаем: ' + format(question.answer) }] }];
    });
    result.push({ title: 'Получаем ответ', lines: [{ html: task.explanation }, { formula: 'Ответ: ' + format(task.answer) }] });
    return result;
  }

  function span(parent, className, value) {
    const element = document.createElement('span');
    element.className = className;
    element.textContent = value;
    parent.append(element);
    return element;
  }

  function fraction(parent, numerator, denominator, side, hidden = false) {
    const node = document.createElement('span');
    node.className = 'profile-solution-fraction';
    if (hidden) node.setAttribute('aria-hidden', 'true');
    else {
      node.setAttribute('role', 'math');
      node.setAttribute('aria-label', 'Дробь: числитель ' + numerator + ', знаменатель ' + denominator);
    }
    const top = span(node, 'profile-solution-numerator', numerator);
    const bottom = span(node, 'profile-solution-denominator', denominator);
    if (!hidden) { top.setAttribute('aria-hidden', 'true'); bottom.setAttribute('aria-hidden', 'true'); }
    if (side) {
      top.classList.add(side === 'left' ? 'profile-solution-extreme' : 'profile-solution-mean');
      bottom.classList.add(side === 'left' ? 'profile-solution-mean' : 'profile-solution-extreme');
    }
    parent.append(node);
  }

  // Read only a single explicit mathematical atom on either side of a slash.
  // Parentheses are balanced; no algebra is inferred and no expressions run.
  const atomCharacter = /[\p{L}\p{N}.,°√]/u;
  function atomLeft(text, end) {
    while (end >= 0 && /\s/.test(text[end])) end--;
    if (text[end] === ')') {
      let depth = 1, start = end - 1;
      while (start >= 0 && depth) { if (text[start] === ')') depth++; if (text[start] === '(') depth--; start--; }
      if (depth) return null;
      start++;
      if (text[start - 1] === '√') start--;
      else if (/[\p{L}\p{N}^]/u.test(text[start - 1] || '')) return null;
      return { start, end: end + 1 };
    }
    let start = end;
    while (start >= 0 && atomCharacter.test(text[start])) start--;
    return start === end ? null : { start: start + 1, end: end + 1 };
  }
  function atomRight(text, start) {
    while (start < text.length && /\s/.test(text[start])) start++;
    let opening = start;
    if (text[opening] === '√') opening++;
    if (text[opening] === '(') {
      let depth = 1, end = opening + 1;
      while (end < text.length && depth) { if (text[end] === '(') depth++; if (text[end] === ')') depth--; end++; }
      return depth ? null : { start, end };
    }
    let end = start;
    while (end < text.length && atomCharacter.test(text[end])) end++;
    // A sentence-ending punctuation mark is not part of its denominator.
    while (end > start && /[.,]/.test(text[end - 1])) end--;
    return end === start ? null : { start, end };
  }
  function appendText(parent, text) {
    text = String(text ?? '');
    let cursor = 0;
    for (let slash = text.indexOf('/'); slash !== -1; slash = text.indexOf('/', slash + 1)) {
      const left = atomLeft(text, slash - 1), right = atomRight(text, slash + 1);
      if (!left || !right || left.start < cursor || text.slice(left.start, slash).includes('/') || text.slice(slash + 1, right.end).includes('/')) continue;
      // Do not reinterpret URL/path fragments, or chained divisions such as a/b/c.
      if (text[left.start - 1] === '/' || text[right.end] === '/' || text[slash - 1] === ':' || text[slash + 1] === '/') continue;
      const numerator = text.slice(left.start, left.end), denominator = text.slice(right.start, right.end);
      // A function, multiword symbol or following power needs a larger grammar.
      // Keep these complete authored expressions literal rather than change scope.
      if (/^[\p{L}]{2,}$/u.test(numerator) || /^[\p{L}]{2,}$/u.test(denominator) ||
          /(?:sin|cos|tg|ctg|sqrt|log|ln)\s*$/i.test(text.slice(0, left.start)) ||
          /^[²³⁴⁵⁶⁷⁸⁹⁰^('′]/.test(text.slice(right.end)) || text[left.start - 1] === '^') continue;
      parent.append(document.createTextNode(text.slice(cursor, left.start)));
      fraction(parent, numerator, denominator);
      cursor = right.end;
      slash = right.end - 1;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }

  function appendAuthored(parent, html, inline = false) {
    const template = document.createElement('template');
    template.innerHTML = String(html ?? '');
    const allowed = new Set(['P', 'BR', 'SUP', 'SUB', 'B', 'STRONG', 'I', 'EM']);
    const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH']);
    function copy(from, to) {
      for (const child of from.childNodes) {
        if (child.nodeType === 3) {
          // An exponent/subscript in a separate HTML node still belongs to the
          // authored atom. Keep its preceding expression intact.
          if (['SUP', 'SUB'].includes(child.nextSibling?.tagName)) to.append(document.createTextNode(child.textContent));
          else appendText(to, child.textContent);
        }
        else if (child.nodeType === 1 && !blocked.has(child.tagName)) {
          if (allowed.has(child.tagName)) {
            const element = document.createElement(inline && child.tagName === 'P' ? 'span' : child.tagName.toLowerCase());
            copy(child, element); to.append(element);
            if (inline && child.tagName === 'P') to.append(document.createTextNode(' '));
          } else copy(child, to);
        }
      }
    }
    copy(template.content, parent);
  }

  function line(parent, value) {
    const paragraph = document.createElement(value?.html ? 'div' : 'p');
    if (typeof value === 'string') appendText(paragraph, value);
    else if (value.html !== undefined) appendAuthored(paragraph, value.html);
    else if (value.fraction) {
      const f = value.fraction;
      paragraph.className = 'profile-solution-formula profile-solution-ratio';
      paragraph.setAttribute('role', 'math');
      paragraph.setAttribute('aria-label', `${f.before || ''} дробь: числитель ${f.numerator}, знаменатель ${f.denominator} ${f.after || ''}`.replace(/=/g, ' равно '));
      for (const part of ['before', 'fraction', 'after']) {
        if (part === 'fraction') fraction(paragraph, f.numerator, f.denominator, null, true);
        else if (f[part]) span(paragraph, 'profile-solution-equality', f[part]).setAttribute('aria-hidden', 'true');
      }
    } else if (value.proportion) {
      const p = value.proportion;
      paragraph.className = 'profile-solution-formula profile-solution-proportion';
      paragraph.setAttribute('role', 'math');
      paragraph.setAttribute('aria-label', `Дробь: числитель ${p.left[0]}, знаменатель ${p.left[1]}, равно дробь: числитель ${p.right[0]}, знаменатель ${p.right[1]}`);
      fraction(paragraph, p.left[0], p.left[1], 'left', true);
      const cross = document.createElement('span'); cross.className = 'profile-solution-crossbox'; cross.setAttribute('aria-hidden', 'true');
      const drawing = document.createElementNS(NS, 'svg'); drawing.setAttribute('viewBox', '0 0 56 64'); drawing.setAttribute('focusable', 'false'); drawing.classList.add('profile-solution-cross');
      [[15, 49, '#b42318'], [49, 15, '#5f6368']].forEach(([y1, y2, color], index) => {
        const diagonal = document.createElementNS(NS, 'line');
        for (const [key, value] of Object.entries({ x1: 2, x2: 54, y1, y2, stroke: color, 'stroke-width': 2.5 })) diagonal.setAttribute(key, value);
        if (index) diagonal.setAttribute('stroke-dasharray', '5 3');
        drawing.append(diagonal);
      });
      cross.append(drawing); span(cross, '', '='); paragraph.append(cross);
      fraction(paragraph, p.right[0], p.right[1], 'right', true);
    } else { paragraph.className = 'profile-solution-formula'; appendText(paragraph, value.formula); }
    parent.append(paragraph);
  }

  function mount(container, task, options = {}) {
    if (!container) return () => {};
    const wrapper = document.createElement('section'); wrapper.className = 'profile-solution';
    const open = document.createElement('button'); open.type = 'button'; open.className = 'button quiet'; open.dataset.solutionOpen = '';
    const label = options.label || 'Разобрать решение по шагам';
    open.textContent = label; open.setAttribute('aria-expanded', 'false'); wrapper.append(open); container.append(wrapper);
    let panel, list, next, authored, shown = 0, disposed = false;
    function permitted() { return !disposed && (typeof options.onHelp !== 'function' || options.onHelp() !== false); }
    function reveal(prechecked = false) {
      if (!panel || shown >= authored.length || disposed || (!prechecked && !permitted())) return;
      const step = authored[shown], item = document.createElement('li');
      item.className = 'profile-solution-step'; item.dataset.solutionStep = String(shown + 1);
      if (options.stepAttribute && /^data-[a-z-]+$/.test(options.stepAttribute)) item.setAttribute(options.stepAttribute, String(shown));
      const heading = document.createElement('h3'); heading.append(document.createTextNode(`Шаг ${shown + 1} из ${authored.length}. `)); appendAuthored(heading, step.title, true); item.append(heading);
      step.lines.forEach(value => line(item, value)); list.append(item); shown++;
      next.setAttribute('aria-disabled', String(shown === authored.length));
      next.textContent = shown < authored.length ? `Следующий шаг: ${shown + 1} из ${authored.length}` : `Все ${authored.length} шагов открыты`;
      options.onProgress?.(shown, authored.length);
    }
    function toggle() {
      if (disposed) return;
      const opening = open.getAttribute('aria-expanded') !== 'true';
      if (opening && !permitted()) return;
      if (!panel) {
        authored = steps(task);
        panel = document.createElement('section'); panel.className = 'profile-solution-panel'; panel.dataset.solutionPanel = ''; panel.id = 'profile-solution-' + (++sequence);
        panel.setAttribute('aria-label', 'Решение этой задачи по шагам'); open.setAttribute('aria-controls', panel.id);
        list = document.createElement('ol'); list.setAttribute('aria-live', 'polite'); list.setAttribute('aria-relevant', 'additions'); panel.append(list);
        next = document.createElement('button'); next.type = 'button'; next.className = 'button quiet'; next.dataset.solutionNext = '';
        if (options.nextId) next.id = options.nextId;
        next.addEventListener('click', nextStep); panel.append(next); wrapper.append(panel);
        const initial = Math.max(1, Math.min(authored.length, Number.isInteger(options.initialCount) ? options.initialCount : 1));
        for (let i = 0; i < initial; i++) { reveal(i === 0); if (disposed) return; }
      }
      panel.hidden = !opening; open.setAttribute('aria-expanded', String(opening)); open.textContent = opening ? 'Свернуть разбор' : label;
    }
    function nextStep() { reveal(); }
    open.addEventListener('click', toggle);
    if (options.initialOpen) toggle();
    return () => { disposed = true; open.removeEventListener('click', toggle); next?.removeEventListener('click', nextStep); wrapper.remove(); };
  }
  root.ProfileSolutions = { steps, mount };
})(globalThis);
