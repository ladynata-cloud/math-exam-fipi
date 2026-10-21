(function(root){'use strict';
// Conservative display-only fraction utility derived from
// ege-profil/start/solutions.js, October 2026. No expression evaluation.
// Geometry-only extension: two capital Latin letters denote a segment (AB).
  function span(parent, className, value) {
    const element = document.createElement('span');
    element.className = className;
    element.textContent = value;
    parent.append(element);
    return element;
  }

  function fraction(parent, numerator, denominator, side, hidden = false) {
    const node = document.createElement('span');
    node.className = 'stereo-fraction';
    if (hidden) node.setAttribute('aria-hidden', 'true');
    else {
      node.setAttribute('role', 'math');
      node.setAttribute('aria-label', 'Дробь: числитель ' + numerator + ', знаменатель ' + denominator);
    }
    const top = span(node, 'stereo-numerator', numerator);
    const bottom = span(node, 'stereo-denominator', denominator);
    if (!hidden) { top.setAttribute('aria-hidden', 'true'); bottom.setAttribute('aria-hidden', 'true'); }
    if (side) {
      top.classList.add(side === 'left' ? 'stereo-extreme' : 'stereo-mean');
      bottom.classList.add(side === 'left' ? 'stereo-mean' : 'stereo-extreme');
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
      // Units and prose are not mathematical ratios. In particular м/с must
      // retain its conventional unit spelling when formatting a task prompt.
      if (/[А-Яа-яЁё]/u.test(numerator + denominator)) continue;
      const token = text.slice(0, slash).match(/\S*$/)?.[0] + text.slice(slash + 1).match(/^\S*/)?.[0];
      if (/:\/\/|^www\.|^\//i.test(token)) continue;
      // A function, multiword symbol or following power needs a larger grammar.
      // Keep these complete authored expressions literal rather than change scope.
      if ((/^[\p{L}]{2,}$/u.test(numerator) && !/^[A-Z]{2}$/.test(numerator)) || (/^[\p{L}]{2,}$/u.test(denominator) && !/^[A-Z]{2}$/.test(denominator)) ||
          /(?:sin|cos|tg|ctg|sqrt|log|ln)\s*$/i.test(text.slice(0, left.start)) ||
          /^[²³⁴⁵⁶⁷⁸⁹⁰^('′]/.test(text.slice(right.end)) || text[left.start - 1] === '^') continue;
      parent.append(document.createTextNode(text.slice(cursor, left.start)));
      fraction(parent, numerator, denominator);
      cursor = right.end;
      slash = right.end - 1;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }

  // Format authored display text in place, preserving interactive controls,
  // their values/listeners, diagrams and already formatted expressions.
  // This is deliberately the same conservative reader used by worked steps.
  function formatFractions(container) {
    if (!container) return;
    const skip = 'svg,math,a,button,input,textarea,select,option,script,style,code,pre,sup,sub,' +
      '.stereo-fraction,.stereo-trig-fraction,#input-note,.number-help,[data-raw-math]';
    const walker = document.createTreeWalker(container, 4), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!node.textContent.includes('/') || node.parentElement?.closest(skip) ||
          ['SUP', 'SUB'].includes(node.nextSibling?.tagName)) continue;
      const fragment = document.createDocumentFragment();
      appendText(fragment, node.textContent);
      if (fragment.querySelector('.stereo-fraction')) node.replaceWith(fragment);
    }
  }


root.StereoMath={appendText,formatFractions};
})(typeof window!=='undefined'?window:globalThis);
