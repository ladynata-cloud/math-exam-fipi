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
    const top = span(node, 'stereo-numerator', '');
    const bottom = span(node, 'stereo-denominator', '');
    appendAtoms(top, numerator);
    appendAtoms(bottom, denominator);
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
  function closingParenthesis(text, opening) {
    let depth = 1, end = opening + 1;
    while (end < text.length && depth) {
      if (text[end] === '(') depth++;
      if (text[end] === ')') depth--;
      end++;
    }
    return depth ? null : end;
  }
  // A radical and its coefficient are one display atom. Preserve the authored
  // characters and parentheses; this reader neither evaluates nor simplifies.
  function radicalAt(text, start, prefix) {
    const root = start + prefix.length - 1, opening = root + 1;
    if (text[opening] === '(') {
      const end = closingParenthesis(text, opening);
      if (end && !/[А-Яа-яЁё]/u.test(text.slice(opening, end))) return { start, end, root, opening };
      return null;
    }
    const body = text.slice(opening).match(/^(?:\d+(?:[.,]\d+)?|[A-Za-zΑ-Ωα-ω])(?:[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?/u);
    return body ? { start, end: opening + body[0].length, root } : null;
  }
  function radicalRanges(text) {
    const matcher = /(?:\d+(?:[.,]\d+)?|[A-Za-zΑ-Ωα-ω])?√/gu, result = [];
    for (let match; (match = matcher.exec(text));) {
      const radical = radicalAt(text, match.index, match[0]);
      if (radical) { result.push(radical); matcher.lastIndex = radical.end; }
    }
    return result;
  }
  function appendAtoms(parent, text) {
    const matcher = /(?:\d+(?:[.,]\d+)?|[A-Za-zΑ-Ωα-ω])?√|\d+(?:[.,]\d+)?(?:[⁰¹²³⁴⁵⁶⁷⁸⁹]+|°)?/gu;
    let cursor = 0;
    for (let match; (match = matcher.exec(text));) {
      const radical = match[0].endsWith('√') ? radicalAt(text, match.index, match[0]) : null;
      if (match[0].endsWith('√') && !radical) continue;
      const end = radical ? radical.end : matcher.lastIndex;
      parent.append(document.createTextNode(text.slice(cursor, match.index)));
      const node = span(parent, 'stereo-math-atom', '');
      if (radical?.opening !== undefined) {
        node.append(document.createTextNode(text.slice(match.index, radical.opening + 1)));
        appendText(node, text.slice(radical.opening + 1, end - 1));
        node.append(document.createTextNode(')'));
      } else node.textContent = text.slice(match.index, end);
      cursor = end;
      matcher.lastIndex = end;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }
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
  function trigRight(text, start) {
    const name = text.slice(start).match(/^(?:sin|cos|ctg|tg|tan|cot)/);
    if (!name) return null;
    let argument = start + name[0].length;
    while (/\s/.test(text[argument] || '') && argument < text.length) argument++;
    if (text[argument] === '(') {
      const end = closingParenthesis(text, argument);
      if (end && !/[А-Яа-яЁё]/u.test(text.slice(argument, end))) return { start, end, trig: true };
      return null;
    }
    // An adjacent Greek letter or numeric angle is unambiguous. Latin names
    // require whitespace (sin x); do not reinterpret words such as sinh.
    const value = text.slice(argument).match(argument > start + name[0].length
      ? /^(?:[A-Za-zΑ-Ωα-ω]|\d+(?:[.,]\d+)?°?)/u
      : /^(?:[Α-Ωα-ω]|\d+(?:[.,]\d+)?°?)/u);
    if (!value) return null;
    const end = argument + value[0].length;
    return /[\p{L}\p{N}]/u.test(text[end] || '') ? null : { start, end, trig: true };
  }
  function atomRight(text, start) {
    while (start < text.length && /\s/.test(text[start])) start++;
    const trig = trigRight(text, start);
    if (trig) return trig;
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
    const radicals = radicalRanges(text);
    let cursor = 0;
    for (let slash = text.indexOf('/'); slash !== -1; slash = text.indexOf('/', slash + 1)) {
      // Format divisions inside a radical recursively, after its full extent
      // is known. Otherwise a slash could detach the root from its radicand.
      if (radicals.some(r => slash > r.root && slash < r.end)) continue;
      const left = atomLeft(text, slash - 1), right = atomRight(text, slash + 1);
      const wholeRadical = left && radicals.find(r => r.end === left.end);
      if (wholeRadical) left.start = wholeRadical.start;
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
      if ((/^[\p{L}]{2,}$/u.test(numerator) && !/^[A-Z]{2}$/.test(numerator)) || (!right.trig && /^[\p{L}]{2,}$/u.test(denominator) && !/^[A-Z]{2}$/.test(denominator)) ||
          /(?:sin|cos|tg|ctg|sqrt|log|ln)\s*$/i.test(text.slice(0, left.start)) ||
          /^[²³⁴⁵⁶⁷⁸⁹⁰^('′]/.test(text.slice(right.end)) || text[left.start - 1] === '^') continue;
      const whole = /^\d+$/.test(numerator) && /^\d+$/.test(denominator)
        ? text.slice(cursor, left.start).match(/([+−-]?\d+)([ \t\u00a0\u202f]+)$/u) : null;
      const mixedStart = whole ? left.start - whole[0].length : -1;
      const mixed = whole && !/[\p{L}\p{N}.,]/u.test(text[mixedStart - 1] || '');
      appendAtoms(parent, text.slice(cursor, mixed ? mixedStart : left.start));
      if (mixed) {
        const node = span(parent, 'stereo-mixed-number', '');
        appendAtoms(node, whole[1]);
        node.append(document.createTextNode(whole[2]));
        fraction(node, numerator, denominator);
      } else fraction(parent, numerator, denominator);
      cursor = right.end;
      slash = right.end - 1;
    }
    appendAtoms(parent, text.slice(cursor));
  }

  // Format authored display text in place, preserving interactive controls,
  // their values/listeners, diagrams and already formatted expressions.
  // This is deliberately the same conservative reader used by worked steps.
  function formatFractions(container) {
    if (!container) return;
    const skip = 'svg,math,a,button,input,textarea,select,option,script,style,code,pre,sup,sub,' +
      '.stereo-fraction,.stereo-trig-fraction,.stereo-math-atom,.stereo-mixed-number,#input-note,.number-help,[data-raw-math]';
    const walker = document.createTreeWalker(container, 4), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!/[\/√\d]/u.test(node.textContent) || node.parentElement?.closest(skip) ||
          ['SUP', 'SUB'].includes(node.nextSibling?.tagName)) continue;
      const fragment = document.createDocumentFragment();
      appendText(fragment, node.textContent);
      if (fragment.querySelector('.stereo-fraction,.stereo-math-atom')) node.replaceWith(fragment);
    }
  }


root.StereoMath={appendText,formatFractions};
})(typeof window!=='undefined'?window:globalThis);
