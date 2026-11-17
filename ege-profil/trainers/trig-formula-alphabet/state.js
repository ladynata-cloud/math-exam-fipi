(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MathExamFormulaState = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const KEY = 'trig-stp-trainer-v2';
  const OLD_KEY = 'mathExamCourseProgress.v1';
  const BACKUP_KEY = 'mathexam.formulas.backup.v1';
  const DAY = 86400000, INTERVALS = [1, 3, 7, 14, 30];
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const copy = value => JSON.parse(JSON.stringify(value));
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const unique = list => [...new Set(list)];

  function normalize(value) {
    return String(value == null ? '' : value).trim().toLowerCase()
      .replace(/ё/g, 'е').replace(/[−–—]/g, '-').replace(/[·×⋅]/g, '*')
      .replace(/π/g, 'pi').replace(/α/g, 'a').replace(/β/g, 'b')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')
      .replace(/≠/g, '!=').replace(/≥/g, '>=').replace(/≤/g, '<=')
      .replace(/\bctg\b/g, 'cot').replace(/\btg\b/g, 'tan')
      .replace(/√\s*\(/g, 'sqrt(').replace(/√\s*(\d+)/g, 'sqrt($1)')
      .replace(/\s+/g, '');
  }

  function algebraTokens(value) {
    // Decimal commas are accepted as scalar input here. They remain untouched
    // by normalize(), because "-1,1" can also be an explicitly requested set.
    let text = normalize(value).replace(/(\d),(?=\d)/g, '$1.').replace(/\|([^|]+)\|/g, 'abs($1)');
    text = text.replace(/(sin|cos|tan|cot)\^([234])\(([^()]*)\)/g, '$1($3)^$2');
    text = text.replace(/(sin|cos|tan|cot)\^([234])([a-z])/g, '$1($3)^$2');
    text = text.replace(/(sin|cos|tan|cot)(-?\d*[abxytpq]|pi)(?=sin|cos|tan|cot|[+\-*/)]|$)/g, '$1($2)');
    if (!text || text.length > 350 || /[^a-z0-9.+*/^()\-]/.test(text)) throw new Error('format');
    const tokens = text.match(/sqrt|arcsin|arccos|arctan|sin|cos|tan|cot|abs|pi|[abxyptqknuv]|(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/^()]/g) || [];
    if (tokens.join('') !== text || tokens.length > 150) throw new Error('format');
    for (let i = 1; i < tokens.length; i++) {
      if (/^[\d.]/.test(tokens[i - 1]) && /^[\d.]/.test(tokens[i])) throw new Error('number');
    }
    return tokens;
  }

  /* A bounded algebra normalizer, not an identity oracle. Trig functions remain
     atoms: leaving the original expression unchanged cannot prove a requested
     addition/double-angle transformation. Only whole-factor commutativity,
     elementary arithmetic and sin/cos parity are normalized. No eval is used. */
  function canonical(value) {
    const tokens = algebraTokens(value);
    let at = 0, depth = 0, operations = 0, factorTrials = 0, serialized = 0;
    const restrictions = new Set();
    const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    const abs = n => n < 0n ? -n : n;
    function gcd(a, b) { a = abs(a); b = abs(b); while (b) { const r = a % b; a = b; b = r; } return a; }
    function rational(n, d = 1n) {
      if (++operations > 30000) throw new Error('complexity');
      if (!d) throw new Error('undefined');
      if (d < 0n) { n = -n; d = -d; }
      if (!n) return { n: 0n, d: 1n };
      const divisor = gcd(n, d); n /= divisor; d /= divisor;
      if (abs(n).toString().length > 100 || d.toString().length > 100) throw new Error('range');
      return { n, d };
    }
    const sum = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
    const product = (a, b) => rational(a.n * b.n, a.d * b.d);
    const quotient = (a, b) => rational(a.n * b.d, a.d * b.n);
    const negative = a => rational(-a.n, a.d);
    const zero = () => rational(0n);
    const one = () => rational(1n);
    function encode(value) {
      const text = JSON.stringify(value); serialized += text.length;
      // Nested function atoms contain serialized arguments. A depth bound
      // alone is insufficient because escaping can multiply their size.
      if (text.length > 16000 || serialized > 500000) throw new Error('complexity');
      return text;
    }
    const ratText = value => value.d === 1n ? String(value.n) : String(value.n) + '/' + String(value.d);
    function decimal(raw) {
      const parts = raw.split('.'), fraction = parts[1] || '';
      return rational(BigInt((parts[0] || '0') + fraction), 10n ** BigInt(fraction.length));
    }
    const number = value => value.n ? new Map([['', value]]) : new Map();
    const integer = value => number(rational(BigInt(value)));
    const atom = name => new Map([[encode([[name, 1]]), one()]]);
    function clean(poly) {
      for (const [key, value] of poly) if (!value.n) poly.delete(key);
      if (poly.size > 100) throw new Error('complexity');
      return poly;
    }
    const entries = poly => [...clean(new Map(poly))].sort((a, b) => compare(a[0], b[0]));
    const key = poly => encode(entries(poly).map(([name, value]) => [name, ratText(value)]));
    function add(a, b, sign = 1) {
      const out = new Map(a);
      for (const [name, value] of b) {
        out.set(name, sum(out.get(name) || zero(), sign === 1 ? value : negative(value)));
        if (out.size > 100) throw new Error('complexity');
      }
      return clean(out);
    }
    function factorsKey(powers, coefficient) {
      const factors = [];
      for (const [name, exponent] of powers) {
        if (!exponent) continue;
        if (name.startsWith('#sqrt:')) {
          const prime = BigInt(name.slice(6));
          const whole = Math.floor(exponent / 2), remaining = exponent - 2 * whole;
          if (whole > 0) coefficient = product(coefficient, rational(prime ** BigInt(whole)));
          if (whole < 0) coefficient = product(coefficient, rational(1n, prime ** BigInt(-whole)));
          if (remaining) factors.push([name, remaining]);
        } else factors.push([name, exponent]);
      }
      factors.sort((a, b) => compare(a[0], b[0]));
      return [factors.length ? encode(factors) : '', coefficient];
    }
    function multiply(a, b) {
      const out = new Map();
      for (const [ka, va] of a) for (const [kb, vb] of b) {
        const powers = new Map(ka ? JSON.parse(ka) : []);
        for (const [name, exponent] of kb ? JSON.parse(kb) : []) powers.set(name, (powers.get(name) || 0) + exponent);
        const [name, coefficient] = factorsKey(powers, product(va, vb));
        out.set(name, sum(out.get(name) || zero(), coefficient));
        if (out.size > 100) throw new Error('complexity');
      }
      return clean(out);
    }
    const knownNonzero = name => name === 'pi' || name.startsWith('#sqrt:');
    function scaled(poly) {
      const leading = entries(poly)[0][1];
      return { leading, normalized: new Map([...poly].map(([name, value]) => [name, quotient(value, leading)])) };
    }
    function requireNonzero(poly) {
      if (poly.size === 1) {
        const [name] = [...poly][0];
        for (const [factor] of name ? JSON.parse(name) : []) {
          if (!knownNonzero(factor)) restrictions.add('nonzero:' + factor);
        }
      } else {
        // A denominator's nonzero constant scale and sign do not affect its
        // excluded points. Polynomial factoring/cross multiplication is not
        // attempted: unlisted transformations remain an explicit exercise.
        restrictions.add('nonzero-polynomial:' + key(scaled(poly).normalized));
      }
    }
    function divide(a, b) {
      clean(b);
      if (!b.size) throw new Error('undefined');
      requireNonzero(b);
      if (b.size !== 1) {
        const normalized = scaled(b);
        return multiply(multiply(a, number(quotient(one(), normalized.leading))), atom('1/(' + key(normalized.normalized) + ')'));
      }
      const [name, coefficient] = [...b][0];
      const powers = new Map((name ? JSON.parse(name) : []).map(([factor, exponent]) => [factor, -exponent]));
      const [inverseName, inverseValue] = factorsKey(powers, quotient(one(), coefficient));
      return multiply(a, new Map([[inverseName, inverseValue]]));
    }
    const constant = p => p.size === 0 ? zero() : p.size === 1 && p.has('') ? p.get('') : null;
    function factorInteger(value, factors, sign) {
      let rest = value;
      for (let candidate = 2n; candidate * candidate <= rest; candidate += candidate === 2n ? 1n : 2n) {
        if (++factorTrials > 12000) throw new Error('complexity');
        let count = 0;
        while (rest % candidate === 0n) { rest /= candidate; count++; }
        if (count) factors.set('#sqrt:' + candidate, (factors.get('#sqrt:' + candidate) || 0) + sign * count);
      }
      if (rest > 1n) factors.set('#sqrt:' + rest, (factors.get('#sqrt:' + rest) || 0) + sign);
    }
    function radical(value) {
      if (value.n < 0n) throw new Error('undefined');
      if (!value.n) return integer(0);
      const powers = new Map();
      factorInteger(value.n, powers, 1); factorInteger(value.d, powers, -1);
      const [name, coefficient] = factorsKey(powers, one());
      return new Map([[name, coefficient]]);
    }
    function primary() {
      if (++depth > 24) throw new Error('complexity');
      let result; const token = tokens[at++];
      if (token === '(') { result = expression(); if (tokens[at++] !== ')') throw new Error('bracket'); }
      else if (/^(?:sqrt|arcsin|arccos|arctan|sin|cos|tan|cot|abs)$/.test(token || '')) {
        if (tokens[at++] !== '(') throw new Error('argument');
        let arg = expression(); if (tokens[at++] !== ')') throw new Error('bracket');
        const num = constant(arg);
        if (token === 'sqrt' && num !== null) result = radical(num);
        else if (token === 'abs' && num !== null) result = number(rational(abs(num.n), num.d));
        else {
          let sign = 1;
          const leading = entries(arg)[0];
          if (/^(sin|cos|tan|cot)$/.test(token) && leading && leading[1].n < 0n) {
            arg = multiply(integer(-1), arg);
            if (token !== 'cos') sign = -1;
          }
          const argKey = key(arg);
          if (token === 'tan') restrictions.add('nonzero:cos(' + argKey + ')');
          if (token === 'cot') restrictions.add('nonzero:sin(' + argKey + ')');
          if (token === 'sqrt') restrictions.add('nonnegative:' + argKey);
          if (token === 'arcsin' || token === 'arccos') {
            if (num && abs(num.n) > num.d) throw new Error('undefined');
            if (!num) restrictions.add('unit-interval:' + argKey);
          }
          result = multiply(integer(sign), atom(token + '(' + argKey + ')'));
        }
      } else if (/^(?:\d|\.)/.test(token || '')) result = number(decimal(token));
      else if (/^(?:pi|[abxyptqknuv])$/.test(token || '')) result = atom(token);
      else throw new Error('token');
      depth--;
      if (tokens[at] === '^') {
        at++; let sign = 1;
        if (tokens[at] === '-' || tokens[at] === '+') { sign = tokens[at++] === '-' ? -1 : 1; }
        const exponent = Number(tokens[at++]) * sign;
        if (!Number.isInteger(exponent) || Math.abs(exponent) > 8) throw new Error('power');
        // In the school real-valued convention, a zeroth power still needs a
        // nonzero base. Cancelling that condition would accept 0^0 as 1.
        if (exponent === 0) { if (!result.size) throw new Error('undefined'); requireNonzero(result); }
        let power = integer(1);
        for (let i = 0; i < Math.abs(exponent); i++) power = multiply(power, result);
        result = exponent < 0 ? divide(integer(1), power) : power;
      }
      return result;
    }
    function unary() {
      if (tokens[at] === '+') { at++; return unary(); }
      if (tokens[at] === '-') { at++; return multiply(integer(-1), unary()); }
      return primary();
    }
    function term() {
      let out = unary();
      while (at < tokens.length) {
        if (tokens[at] === '*') { at++; out = multiply(out, unary()); }
        else if (tokens[at] === '/') { at++; out = divide(out, unary()); }
        else if (tokens[at] !== '+' && tokens[at] !== '-' && tokens[at] !== ')' && tokens[at] !== '^') out = multiply(out, unary());
        else break;
      }
      return out;
    }
    function expression() {
      let out = term();
      while (tokens[at] === '+' || tokens[at] === '-') { const sign = tokens[at++] === '+' ? 1 : -1; out = add(out, term(), sign); }
      return out;
    }
    const result = expression(); if (at !== tokens.length) throw new Error('tail');
    return encode({ value: key(result), domain: [...restrictions].sort(compare) });
  }

  function matches(actual, answers) {
    if (typeof actual !== 'string' || actual.length > 350 || !Array.isArray(answers)) return false;
    if (answers.some(answer => normalize(actual) === normalize(answer))) return true;
    try {
      const got = canonical(actual);
      return answers.some(answer => {
        // A declared pair/set or a restricted answer must not be mistaken for
        // a decimal or be accepted after dropping a component/condition.
        if (typeof answer !== 'string' || /[,;±]/.test(answer)) return false;
        try { return canonical(answer) === got; } catch (_) { return false; }
      });
    } catch (_) { return false; }
  }

  function syntaxTree(actual) {
      const tokens = algebraTokens(actual);
      let at = 0, depth = 0;
      const node = (type, start, extra = {}) => ({ type, source: tokens.slice(start, at).join(''), ...extra });
      function primary() {
        if (++depth > 24) throw new Error('complexity');
        const start = at, token = tokens[at++];
        let result;
        if (token === '(') {
          result = expression(); if (tokens[at++] !== ')') throw new Error('bracket');
          result = { ...result, source: tokens.slice(start, at).join('') };
        } else if (/^(?:sqrt|arcsin|arccos|arctan|sin|cos|tan|cot|abs)$/.test(token || '')) {
          if (tokens[at++] !== '(') throw new Error('argument');
          const arg = expression(); if (tokens[at++] !== ')') throw new Error('bracket');
          result = node('function', start, { name: token, arg });
        } else if (/^(?:\d|\.)/.test(token || '')) result = node('number', start);
        else if (/^(?:pi|[abxyptqknuv])$/.test(token || '')) result = node('symbol', start, { name: token });
        else throw new Error('token');
        depth--;
        if (tokens[at] === '^') {
          at++; let sign = 1;
          if (tokens[at] === '-' || tokens[at] === '+') sign = tokens[at++] === '-' ? -1 : 1;
          const exponent = Number(tokens[at++]) * sign;
          if (!Number.isInteger(exponent) || Math.abs(exponent) > 8) throw new Error('power');
          result = node('power', start, { base: result, exponent });
        }
        return result;
      }
      function unary() {
        const start = at;
        if (tokens[at] === '+' || tokens[at] === '-') { at++; return node('unary', start, { arg: unary() }); }
        return primary();
      }
      function term() {
        const start = at; let result = unary();
        while (at < tokens.length) {
          if (tokens[at] === '*' || tokens[at] === '/') {
            const type = tokens[at++] === '*' ? 'product' : 'quotient';
            const right = unary(); result = node(type, start, { left: result, right });
          } else if (!['+', '-', ')', '^'].includes(tokens[at])) {
            const right = unary(); result = node('product', start, { left: result, right });
          } else break;
        }
        return result;
      }
      function expression() {
        const start = at; let result = term();
        while (tokens[at] === '+' || tokens[at] === '-') {
          at++; const right = term(); result = node('sum', start, { left: result, right });
        }
        return result;
      }
      const result = expression(); if (at !== tokens.length) throw new Error('tail');
      return result;
  }

  /* Mathematical equivalence and the requested visible form are separate.
     For example, sin²x is equal to sin x·sin x, but has not been rewritten as
     a product. Function arguments never supply the outer form of an answer. */
  function checkForm(actual, requiredForm) {
    if (!requiredForm) return true;
    if (!['product', 'sum', 'power'].includes(requiredForm) || typeof actual !== 'string' || actual.length > 350) return false;
    try {
      const result = syntaxTree(actual);
      const strip = n => n.type === 'unary' ? strip(n.arg) : n;
      function scalar(n) {
        n = strip(n);
        if (n.type === 'number' || (n.type === 'symbol' && n.name === 'pi')) return true;
        if (n.type === 'function') return scalar(n.arg);
        if (n.type === 'power') return scalar(n.base);
        return n.left && n.right ? scalar(n.left) && scalar(n.right) : false;
      }
      const cache = new Map(), zeroKey = canonical('0'), unitKeys = new Set([canonical('1'), canonical('-1')]);
      function key(n) {
        if (!cache.has(n)) { try { cache.set(n, canonical(n.source)); } catch (_) { cache.set(n, null); } }
        return cache.get(n);
      }
      function factors(n) {
        n = strip(n);
        return n.type === 'product' ? [...factors(n.left), ...factors(n.right)] : [n];
      }
      function unscale(n) {
        n = strip(n);
        if (n.type === 'quotient' && scalar(n.right)) return unscale(n.left);
        if (n.type === 'product') {
          const variableFactors = factors(n).filter(factor => !scalar(factor));
          if (variableFactors.length === 1) return unscale(variableFactors[0]);
        }
        return n;
      }
      function sumTerms(n) {
        if (key(n) === zeroKey) return 0;
        n = unscale(n);
        if (n.type === 'sum') return sumTerms(n.left) + sumTerms(n.right);
        return key(n) === zeroKey ? 0 : 1;
      }
      if (requiredForm === 'sum') return sumTerms(result) >= 2;
      if (requiredForm === 'power') { const n = unscale(result); return n.type === 'power' && n.exponent >= 2; }
      let productRoot = strip(result);
      const denominators = [];
      while (productRoot.type === 'quotient' && scalar(productRoot.right)) {
        denominators.push({ source: '1/(' + productRoot.right.source + ')' });
        productRoot = strip(productRoot.left);
      }
      if (productRoot.type !== 'product') return false;
      const list = factors(productRoot), variables = list.filter(factor => !scalar(factor));
      const constants = [...list.filter(scalar), ...denominators];
      let coefficient = null;
      if (constants.length) coefficient = canonical(constants.map(factor => '(' + factor.source + ')').join('*'));
      if (coefficient === zeroKey) return false;
      if (variables.length >= 2) return true;
      if (variables.length === 1) return constants.length > 0 && !unitKeys.has(coefficient);
      return constants.filter(factor => !unitKeys.has(key(factor))).length >= 2 && !unitKeys.has(coefficient);
    } catch (_) { return false; }
  }

  /* Directional exercises can require sin(x), rather than the equal -sin(-x).
     Only the arguments are compared here; the outer factor order and sign
     remain the responsibility of matches(). An empty list requires no trig
     calls, as when simplifying sin(-x)+sin(x) all the way to a number. */
  function checkArguments(actual, requiredArgs) {
    if (requiredArgs == null) return true;
    if (!Array.isArray(requiredArgs) || requiredArgs.length > 20 || typeof actual !== 'string' || actual.length > 350) return false;
    try {
      const names = /^(?:sin|cos|tan|cot|arcsin|arccos|arctan)$/;
      const signature = (fn, arg) => fn + ':' + canonical(arg);
      const expected = new Set(requiredArgs.map(item => {
        if (!object(item) || typeof item.fn !== 'string' || typeof item.arg !== 'string' || !names.test(item.fn)) throw new Error('argument');
        return signature(item.fn, item.arg);
      }));
      const actualArgs = new Set();
      function visit(n) {
        if (n.type === 'function' && names.test(n.name)) actualArgs.add(signature(n.name, n.arg.source));
        for (const child of [n.arg, n.base, n.left, n.right]) if (child) visit(child);
      }
      visit(syntaxTree(actual));
      return expected.size === actualArgs.size && [...expected].every(arg => actualArgs.has(arg));
    } catch (_) { return false; }
  }

  function createStore(storage, data, clock = () => Date.now()) {
    const skills = new Map(), tasks = new Map();
    for (const mod of data.modules || []) for (const skill of mod.skills || []) {
      skills.set(skill.id, skill);
      for (const task of skill.tasks || []) tasks.set(task.id, { ...task, skillId: skill.id });
    }
    let warning = '', protectedVersion = false, conflicted = false;
    function read(key) { try { return storage ? storage.getItem(key) : null; } catch (_) { warning = 'Сохранение недоступно. Результаты останутся только в этом открытом сеансе.'; return null; } }
    function parse(raw) { try { const value = JSON.parse(raw || 'null'); return object(value) ? value : {}; } catch (_) { warning = 'Прежняя запись повреждена. Сохранена резервная копия; этот курс начнём заново.'; return {}; } }
    const originalRaw = read(KEY), oldRaw = read(OLD_KEY);
    let envelope = parse(originalRaw), old = parse(oldRaw);
    function alphabetSnapshot(value) {
      if (!own(value, 'alphabet')) return null;
      return JSON.stringify(value.alphabet, (_, entry) => {
        if (!object(entry)) return entry;
        const ordered = Object.create(null);
        for (const key of Object.keys(entry).sort()) ordered[key] = entry[key];
        return ordered;
      });
    }
    let lastStoredAlphabet = alphabetSnapshot(envelope);
    function cleanView(value) {
      const src = object(value) ? value : {};
      return { screen: typeof src.screen === 'string' ? src.screen : 'home', route: String(src.route || '').slice(0, 30), skillId: String(src.skillId || '').slice(0, 30), taskId: String(src.taskId || '').slice(0, 50), moduleId: String(src.moduleId || '').slice(0, 30), investigationId: String(src.investigationId || '').slice(0, 30) };
    }
    const incoming = object(envelope.alphabet) ? envelope.alphabet : null;
    if (incoming && incoming.version !== 1) { protectedVersion = true; warning = 'Здесь сохранена другая версия курса. Её данные не изменяются; текущая работа — только в этом сеансе.'; }
    const now = () => Number(clock());
    const state = { version: 1, revision: data.version || 1, skills: {}, attempts: {}, activeByTask: {}, investigations: {}, view: cleanView(), serial: 0,
      legacy: { profile: object(envelope.progress) ? copy(envelope.progress) : {}, standalone: object(old.trigSumToProductTrainer) ? copy(old.trigSumToProductTrainer) : {}, importedAt: now() } };
    const lists = ['independent', 'assisted', 'corrected', 'familiar', 'recalled'];
    for (const id of skills.keys()) {
      const src = incoming && object(incoming.skills) && object(incoming.skills[id]) ? incoming.skills[id] : {};
      const record = { studied: src.studied === true, kinds: [], stage: Math.min(4, Math.max(0, Number.isInteger(src.stage) ? src.stage : 0)), dueAt: finite(src.dueAt) ? src.dueAt : null, lastSuccess: finite(src.lastSuccess) ? src.lastSuccess : null, lastReview: finite(src.lastReview) ? src.lastReview : null };
      for (const name of lists) record[name] = unique((Array.isArray(src[name]) ? src[name] : []).filter(taskId => tasks.has(taskId) && tasks.get(taskId).skillId === id));
      record.kinds = unique(record.independent.map(taskId => tasks.get(taskId).tag));
      state.skills[id] = record;
    }
    if (incoming && !protectedVersion) {
      if (object(incoming.legacy)) state.legacy = copy(incoming.legacy);
      if (object(incoming.view) && typeof incoming.view.screen === 'string') state.view = cleanView(incoming.view);
      state.serial = Math.max(0, Number.isSafeInteger(incoming.serial) ? incoming.serial : 0);
      if (object(incoming.investigations)) for (const [id, value] of Object.entries(incoming.investigations)) if (/^lab\d{2}$/.test(id) && value === true) state.investigations[id] = true;
      if (object(incoming.attempts)) for (const [id, a] of Object.entries(incoming.attempts).slice(-2000)) {
        if (!object(a) || !/^a\d+$/.test(id) || !tasks.has(a.taskId) || tasks.get(a.taskId).skillId !== a.skillId) continue;
        state.attempts[id] = { id, taskId: a.taskId, skillId: a.skillId, assisted: a.assisted === true, wrong: a.wrong === true, closed: a.closed === true,
          familiar: a.familiar === true, review: a.review === true, openedAt: finite(a.openedAt) ? a.openedAt : now(), lastAt: finite(a.lastAt) ? a.lastAt : now(), status: typeof a.status === 'string' ? a.status.slice(0, 20) : '', draft: typeof a.draft === 'string' ? a.draft.slice(0, 350) : '', checks: Number.isInteger(a.checks) ? Math.max(0, Math.min(a.checks, 10000)) : 0,
          blocks: Array.isArray(a.blocks) ? a.blocks.filter(token => (tasks.get(a.taskId).tokens || []).includes(token)).slice(0, 80) : [] };
        const options = tasks.get(a.taskId).options || [];
        if (Array.isArray(a.optionOrder) && a.optionOrder.length === options.length && new Set(a.optionOrder).size === options.length && a.optionOrder.every(i => Number.isInteger(i) && i >= 0 && i < options.length)) state.attempts[id].optionOrder = a.optionOrder.slice();
      }
      if (object(incoming.activeByTask)) for (const [taskId, id] of Object.entries(incoming.activeByTask)) if (tasks.has(taskId) && own(state.attempts, id) && state.attempts[id].taskId === taskId) state.activeByTask[taskId] = id;
    }
    if (!incoming && (originalRaw || oldRaw)) {
      try { if (storage && !storage.getItem(BACKUP_KEY)) storage.setItem(BACKUP_KEY, JSON.stringify({ createdAt: now(), profile: originalRaw, standalone: oldRaw })); }
      catch (_) { warning = 'Не удалось сохранить резервную копию. Работа этого курса останется в текущем сеансе.'; protectedVersion = true; }
    }
    function acceptsCurrent(value) {
      if (conflicted) return false;
      if (alphabetSnapshot(value) !== lastStoredAlphabet) {
        conflicted = true;
        warning = 'Курс изменён в другой вкладке. Обнови страницу, чтобы продолжить с сохранёнными результатами. Эта вкладка больше не записывает прогресс.';
        return false;
      }
      return true;
    }
    function freshForSubmit() {
      if (conflicted) return false;
      try { return !storage || acceptsCurrent(parse(storage.getItem(KEY))); }
      catch (_) { warning = 'Сохранение недоступно. Результаты останутся только в этом открытом сеансе.'; return true; }
    }
    function persist() {
      if (protectedVersion || conflicted) return false;
      try {
        if (!storage) throw new Error('unavailable');
        const current = parse(storage.getItem(KEY));
        if (!acceptsCurrent(current)) return false;
        if (object(current.alphabet) && current.alphabet.version !== 1) throw new Error('new-version');
        state.view = cleanView(state.view);
        const next = Object.assign(Object.create(null), envelope, current, { alphabet: state });
        storage.setItem(KEY, JSON.stringify(next)); envelope = next;
        lastStoredAlphabet = alphabetSnapshot(next);
        return true;
      } catch (_) { warning = 'Сохранение недоступно. Результаты останутся только в этом открытом сеансе.'; return false; }
    }
    function current(taskId) { const id = state.activeByTask[taskId]; return id && state.attempts[id] || null; }
    function allocate(taskId, skillId, mode) {
      if (!tasks.has(taskId) || tasks.get(taskId).skillId !== skillId) throw new Error('Unknown course task');
      const seen = Object.values(state.attempts).some(a => a.taskId === taskId);
      const record = state.skills[skillId];
      const due = finite(record.dueAt) && record.dueAt <= now();
      let id;
      do {
        state.serial = state.serial >= Number.MAX_SAFE_INTEGER ? 1 : state.serial + 1;
        id = 'a' + state.serial;
      } while (own(state.attempts, id));
      const a = { id, taskId, skillId, assisted: false, wrong: false, closed: false, familiar: seen, review: mode === 'review' && due, openedAt: now(), lastAt: now(), status: '', draft: '', blocks: [], checks: 0 };
      state.attempts[id] = a; state.activeByTask[taskId] = id;
      // Keep bounded history; the skill-level evidence and current attempts remain.
      const keys = Object.keys(state.attempts);
      if (keys.length > 1800) {
        const active = new Set(Object.values(state.activeByTask));
        for (const oldId of keys.slice(0, keys.length - 1500)) if (!active.has(oldId)) delete state.attempts[oldId];
      }
      persist(); return a;
    }
    function begin(taskId, skillId, mode = 'learn') { return current(taskId) || allocate(taskId, skillId, mode); }
    function repeat(taskId, skillId, mode = 'practice') {
      const existing = current(taskId);
      if (existing && !existing.closed) return existing; // cannot clear a live assisted/wrong attempt
      return allocate(taskId, skillId, mode);
    }
    function help(taskId) {
      const a = current(taskId);
      if (a && !a.closed) {
        if (!a.assisted) {
          const record = state.skills[a.skillId];
          record.stage = 0; record.dueAt = now() + DAY; record.lastReview = now();
        }
        a.assisted = true; a.lastAt = now(); persist();
      }
      return a;
    }
    function study(skillId) { if (state.skills[skillId]) { state.skills[skillId].studied = true; persist(); } }
    function submit(taskId, raw, suppliedTask) {
      const task = tasks.get(taskId), a = current(taskId);
      if (!task || !a || (suppliedTask && suppliedTask.id !== taskId)) throw new Error('Unknown attempt');
      if (!freshForSubmit()) return { status: 'conflict', correct: false };
      if (a.closed) return { status: a.status, correct: true, duplicate: true };
      if (typeof raw !== 'string' || !raw.trim() || raw.length > 350) return { status: 'format', correct: false };
      const record = state.skills[a.skillId], beforeAttempt = copy(a), beforeRecord = copy(record);
      function saveResult(result) {
        persist();
        if (!conflicted) return result;
        // A second tab may write after the initial read but before this save.
        // Restore only this attempted grade; never merge or overwrite its data.
        for (const key of Object.keys(a)) delete a[key];
        Object.assign(a, beforeAttempt);
        for (const key of Object.keys(record)) delete record[key];
        Object.assign(record, beforeRecord);
        return { status: 'conflict', correct: false };
      }
      const correct = matches(raw, task.answers);
      if (correct && (!checkForm(raw, task.requiredForm) || !checkArguments(raw, task.requiredArgs))) {
        a.draft = raw; a.lastAt = now();
        return saveResult({ status: 'form', correct: false, equivalent: true });
      }
      if (!correct) {
        let allAlgebra = true;
        for (const answer of task.answers) try { canonical(answer); } catch (_) { allAlgebra = false; }
        if (allAlgebra) { try { canonical(raw); } catch (_) { a.draft = raw; return saveResult({ status: 'format', correct: false }); } }
      }
      a.draft = raw; a.checks++; a.lastAt = now();
      if (!correct) {
        a.wrong = true;
        const r = state.skills[a.skillId]; r.stage = 0; r.dueAt = now() + DAY; r.lastReview = now();
        return saveResult({ status: 'wrong', correct: false });
      }
      a.closed = true;
      a.status = a.assisted ? 'assisted' : a.wrong ? 'corrected' : a.review ? 'recalled' : a.familiar ? 'familiar' : 'independent';
      record[a.status] = unique(record[a.status].concat(taskId));
      record.studied = true;
      if (a.status === 'independent') record.kinds = unique(record.kinds.concat(task.tag));
      const clean = a.status === 'independent' || a.status === 'recalled';
      if (clean) {
        if (a.status === 'recalled' && finite(record.dueAt) && record.dueAt <= now() && (!finite(record.lastReview) || now() - record.lastReview >= DAY)) {
          record.stage = Math.min(4, record.stage + 1); record.lastReview = now();
          record.dueAt = now() + INTERVALS[record.stage] * DAY;
        } else if (!finite(record.dueAt)) { record.stage = 0; record.dueAt = now() + DAY; record.lastReview = now(); }
        record.lastSuccess = now();
      } else if (a.status === 'assisted' || a.status === 'corrected') { record.stage = 0; record.dueAt = now() + DAY; record.lastReview = now(); }
      return saveResult({ status: a.status, correct: true, duplicate: false });
    }
    function due() { return [...skills.keys()].filter(id => finite(state.skills[id].dueAt) && state.skills[id].dueAt <= now()).sort((a, b) => state.skills[a].dueAt - state.skills[b].dueAt); }
    function summary() {
      const records = Object.values(state.skills);
      return { totalSkills: skills.size, studied: records.filter(r => r.studied).length,
        independent: records.filter(r => r.independent.length >= 2 && r.kinds.length >= 2).length,
        applied: records.filter(r => r.independent.some(id => /^(apply|method|domain|reverse)$/.test(tasks.get(id).tag))).length,
        recalled: records.filter(r => r.recalled.length > 0).length, due: due().length,
        assisted: records.filter(r => r.assisted.length > 0).length, corrected: records.filter(r => r.corrected.length > 0).length };
    }
    function report() { return { kind: 'mathexam-formula-alphabet-report', version: 1, exportedAt: new Date(now()).toISOString(), summary: summary(), skills: copy(state.skills), priorStudy: copy(state.legacy) }; }
    persist();
    return { state, get warning() { return warning; }, get conflicted() { return conflicted; }, ensureCurrent: freshForSubmit, persist, current, begin, repeat, help, study, submit, due, summary, report };
  }
  return { KEY, OLD_KEY, BACKUP_KEY, INTERVALS, DAY, normalize, canonical, matches, checkForm, checkArguments, createStore };
});
