/* SpaceMath formulas: a small mathematical grammar, never JavaScript.
 * Multiplication is explicit (*), powers use ^, angles are radians, and both
 * ln and log mean natural logarithm. Only x and parameters a, b, c are allowed.
 * Persist source strings; parsed programs are opaque, local, immutable values.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpaceMathExpression = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_LENGTH = 512, MAX_TOKENS = 256, MAX_DEPTH = 32, MAX_STEPS = 256;
  const MAX_MAGNITUDE = 1e100, MAX_PARAMETER = 1e6;
  const PARAMETERS = Object.freeze(['a', 'b', 'c']);
  const variables = new Set(['x', ...PARAMETERS]);
  const functions = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'exp', 'ln', 'log']);
  const comparisons = new Set(['<', '<=', '>', '>=', '==', '!=']);
  const programs = new WeakMap();
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const fail = (message, position) => { throw new TypeError(message + (position === undefined ? '' : ' Позиция ' + (position + 1) + '.')); };
  const finite = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_MAGNITUDE;

  function tokenize(source) {
    const result = [];
    let position = 0;
    while (position < source.length) {
      if (/\s/.test(source[position])) { position++; continue; }
      const start = position, rest = source.slice(position);
      const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
      const identifier = /^[A-Za-z][A-Za-z0-9_]*/.exec(rest);
      if (number) {
        const value = Number(number[0]);
        if (!finite(value)) fail('Число вне допустимого диапазона.', start);
        result.push({ type: 'number', value, position: start });
        position += number[0].length;
      } else if (identifier) {
        result.push({ type: 'name', value: identifier[0], position: start });
        position += identifier[0].length;
      } else {
        const double = rest.slice(0, 2), value = comparisons.has(double) ? double : rest[0];
        if (!['+', '-', '*', '/', '^', '(', ')', ',', '<', '>', '<=', '>=', '==', '!='].includes(value)) fail('Недопустимый символ.', start);
        result.push({ type: 'symbol', value, position: start });
        position += value.length;
      }
      if (result.length > MAX_TOKENS) fail('В формуле слишком много частей.');
    }
    result.push({ type: 'end', value: '', position: source.length });
    return result;
  }

  function parse(value) {
    if (typeof value !== 'string' || value.length > MAX_LENGTH) fail('Формула должна содержать не более ' + MAX_LENGTH + ' символов.');
    const source = value.trim();
    if (!source) fail('Введите формулу.');
    const tokens = tokenize(source), used = new Set();
    let index = 0, count = 0;
    const peek = () => tokens[index];
    const take = symbol => { if (peek().value !== symbol) return false; index++; return true; };
    const expect = symbol => { if (!take(symbol)) fail('Ожидалось «' + symbol + '».', peek().position); };
    function node(type, payload, children = []) {
      const depth = 1 + Math.max(0, ...children.map(child => child.depth));
      if (++count > MAX_STEPS || depth > MAX_DEPTH) fail('Формула слишком сложная.');
      return { type, ...payload, children, depth, key: type + JSON.stringify(payload) + '(' + children.map(child => child.key).join(',') + ')' };
    }
    function guard(depth) { if (depth > MAX_DEPTH) fail('Слишком много вложенных скобок или степеней.'); }
    function comparison(depth) {
      guard(depth);
      let left = sum(depth);
      if (comparisons.has(peek().value)) {
        const operator = tokens[index++].value;
        left = node('binary', { operator }, [left, sum(depth)]);
        if (comparisons.has(peek().value)) fail('Запишите одно сравнение в условии.', peek().position);
      }
      return left;
    }
    function sum(depth) {
      let left = product(depth);
      while (['+', '-'].includes(peek().value)) {
        const operator = tokens[index++].value;
        left = node('binary', { operator }, [left, product(depth)]);
      }
      return left;
    }
    function product(depth) {
      let left = unary(depth);
      while (['*', '/'].includes(peek().value)) {
        const operator = tokens[index++].value;
        left = node('binary', { operator }, [left, unary(depth)]);
      }
      return left;
    }
    function unary(depth) {
      guard(depth);
      if (['+', '-'].includes(peek().value)) return node('unary', { operator: tokens[index++].value }, [unary(depth + 1)]);
      return power(depth);
    }
    function power(depth) {
      let left = primary(depth);
      // Unary on the right supports 2^-2 and makes exponentiation right associative.
      if (take('^')) left = node('binary', { operator: '^' }, [left, unary(depth + 1)]);
      return left;
    }
    function primary(depth) {
      guard(depth);
      const token = tokens[index++];
      if (token.type === 'number') return node('number', { value: token.value });
      if (token.type === 'name') {
        if (variables.has(token.value)) { used.add(token.value); return node('variable', { name: token.value }); }
        if (token.value === 'pi' || token.value === 'e') return node('number', { value: token.value === 'pi' ? Math.PI : Math.E });
        if (token.value === 'If' || token.value === 'if') {
          expect('(');
          const condition = comparison(depth + 1); expect(',');
          const yes = comparison(depth + 1); expect(',');
          const no = comparison(depth + 1); expect(')');
          return node('if', {}, [condition, yes, no]);
        }
        if (!functions.has(token.value)) fail('Неизвестное имя «' + token.value + '». Используйте x, a, b, c или математическую функцию.', token.position);
        expect('(');
        const argument = comparison(depth + 1); expect(')');
        return node('call', { name: token.value }, [argument]);
      }
      if (token.value === '(') {
        const result = comparison(depth + 1); expect(')'); return result;
      }
      fail('Ожидалось число, переменная или выражение в скобках.', token.position);
    }
    const tree = comparison(1);
    if (peek().type !== 'end') fail('Лишняя часть формулы. Для умножения используйте *.', peek().position);
    const program = Object.freeze({ source, variables: Object.freeze([...used].sort()) });
    programs.set(program, tree);
    return program;
  }

  function validate(source) {
    try {
      const program = parse(source);
      return { ok: true, source: program.source, variables: [...program.variables] };
    } catch (error) { return { ok: false, error: error.message }; }
  }

  function parameters(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length > PARAMETERS.length || keys.some(key => !PARAMETERS.includes(key))) return null;
    const result = Object.create(null);
    for (const key of keys) {
      const property = Object.getOwnPropertyDescriptor(value, key);
      if (!own(property, 'value') || !finite(property.value) || Math.abs(property.value) > MAX_PARAMETER) return null;
      result[key] = property.value;
    }
    return result;
  }

  function evaluate(value, x = 0, parameterValues = {}) {
    try {
      const program = typeof value === 'string' ? parse(value) : value;
      const tree = program && typeof program === 'object' ? programs.get(program) : null;
      const environment = parameters(parameterValues);
      if (!tree || !environment || !finite(x)) return NaN;
      environment.x = x;
      let steps = 0;
      function visit(node) {
        if (++steps > MAX_STEPS) return NaN;
        if (node.type === 'number') return node.value;
        if (node.type === 'variable') return own(environment, node.name) ? environment[node.name] : NaN;
        const first = visit(node.children[0]);
        if (!finite(first)) return NaN;
        // Only the selected piece is evaluated, so sqrt(x) is valid in If(x>=0,sqrt(x),0).
        if (node.type === 'if') return visit(node.children[first !== 0 ? 1 : 2]);
        let result;
        if (node.type === 'unary') result = node.operator === '-' ? -first : first;
        else if (node.type === 'call') {
          if (node.name === 'tan') result = Math.abs(Math.cos(first)) < 1e-12 ? NaN : Math.tan(first);
          else if (node.name === 'ln' || node.name === 'log') result = first > 0 ? Math.log(first) : NaN;
          else result = Math[node.name](first);
        } else {
          const second = visit(node.children[1]);
          if (!finite(second)) return NaN;
          switch (node.operator) {
            case '+': result = first + second; break;
            case '-': result = first - second; break;
            case '*': result = first * second; break;
            case '/': result = second === 0 ? NaN : first / second; break;
            case '^': result = first === 0 && second <= 0 ? NaN : Math.pow(first, second); break;
            case '<': result = Number(first < second); break;
            case '<=': result = Number(first <= second); break;
            case '>': result = Number(first > second); break;
            case '>=': result = Number(first >= second); break;
            case '==': result = Number(first === second); break;
            case '!=': result = Number(first !== second); break;
            default: return NaN;
          }
        }
        return finite(result) ? result : NaN;
      }
      return visit(tree);
    } catch (_) { return NaN; }
  }

  // Bounded numerical drawing, not a symbolic continuity test. Curved segments
  // are refined; an unresolved jump, pole or domain boundary produces a gap.
  // Clip accepted line segments to the visible vertical range, rather than
  // putting huge coordinates into SVG or joining opposite sides of a pole.
  function sample(value, parameterValues, options) {
    const output = { x: [], y: [] };
    let program;
    try { program = typeof value === 'string' ? parse(value) : value; } catch (_) { return output; }
    if (!program || !programs.has(program) || !parameters(parameterValues) || !options || typeof options !== 'object') return output;
    const { left, right, bottom, top } = options;
    // A view may extend beyond the construction-coordinate limit after fitting
    // or aspect-ratio expansion; it is not a parameter value.
    if (![left, right, bottom, top].every(finite) || !(left < right && bottom < top) || Math.max(Math.abs(left), Math.abs(right), Math.abs(bottom), Math.abs(top)) > 1e12) return output;
    const requested = options.points === undefined ? 257 : options.points;
    if (!Number.isInteger(requested) || requested < 17 || requested > 1025) return output;
    const MAX_EVALUATIONS = 4096, MAX_OUTPUT = 4096, MAX_REFINEMENT = 9;
    const tolerance = (top - bottom) / 800, cache = new Map();
    const environment = parameters(parameterValues), hazards = [];
    function findHazards(node, path = []) {
      if (node.type === 'binary') {
        if (node.operator === '/') hazards.push({ kind: 'zero', node: node.children[1], path });
        else if (comparisons.has(node.operator)) hazards.push({ kind: 'comparison', node, path });
        else if (node.operator === '^') hazards.push({ kind: 'power', node, path });
      } else if (node.type === 'call' && ['sqrt', 'ln', 'log', 'tan', 'asin', 'acos'].includes(node.name)) hazards.push({ kind: node.name, node: node.children[0], path });
      if (node.type === 'if') {
        if (!(node.children[0].type === 'binary' && comparisons.has(node.children[0].operator))) hazards.push({ kind: 'predicate', node: node.children[0], path });
        findHazards(node.children[0], path);
        findHazards(node.children[1], [...path, { node: node.children[0], truthy: true }]);
        findHazards(node.children[2], [...path, { node: node.children[0], truthy: false }]);
      } else node.children.forEach(child => findHazards(child, path));
    }
    findHazards(programs.get(program));
    // Interval bounds expose domain hazards that may be invisible in sampled
    // function values (e.g. a cancelled denominator or a tiny reciprocal).
    // This is deliberately conservative: dependency overestimates can add gaps.
    function crossesHazard(x1, x2) {
      if (!hazards.length) return false;
      const memo = new Map(), unknown = [-Infinity, Infinity];
      const ordered = values => values.some(Number.isNaN) ? unknown : [Math.min(...values), Math.max(...values)];
      const contains = (range, point) => range[0] <= point && range[1] >= point;
      const multiply = (a, b) => ordered([a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]]);
      function interval(node) {
        if (memo.has(node)) return memo.get(node);
        let result;
        if (node.type === 'number') result = [node.value, node.value];
        else if (node.type === 'variable') result = node.name === 'x' ? [x1, x2] : own(environment, node.name) ? [environment[node.name], environment[node.name]] : unknown;
        else {
          const a = interval(node.children[0]);
          if (node.type === 'unary') result = node.operator === '-' ? [-a[1], -a[0]] : a;
          else if (node.type === 'if') {
            const yes = interval(node.children[1]), no = interval(node.children[2]);
            result = a[0] === 0 && a[1] === 0 ? no : !contains(a, 0) ? yes : [Math.min(yes[0], no[0]), Math.max(yes[1], no[1])];
          } else if (node.type === 'call') {
            if (node.name === 'abs') result = [contains(a, 0) ? 0 : Math.min(Math.abs(a[0]), Math.abs(a[1])), Math.max(Math.abs(a[0]), Math.abs(a[1]))];
            else if (node.name === 'sin' || node.name === 'cos') {
              if (!a.every(Number.isFinite) || a[1] - a[0] >= 2 * Math.PI) result = [-1, 1];
              else {
                const fn = Math[node.name], offset = node.name === 'sin' ? Math.PI / 2 : 0;
                const values = [fn(a[0]), fn(a[1])], first = Math.ceil((a[0] - offset) / Math.PI), last = Math.floor((a[1] - offset) / Math.PI);
                for (let k = first; k <= last && k < first + 3; k++) values.push(k % 2 === 0 ? 1 : -1);
                result = ordered(values);
              }
            } else if (node.name === 'tan') result = !a.every(Number.isFinite) || Math.ceil((a[0] - Math.PI / 2) / Math.PI) <= Math.floor((a[1] - Math.PI / 2) / Math.PI) ? unknown : ordered(a.map(Math.tan));
            else if (node.name === 'sqrt') result = a[1] < 0 ? unknown : [Math.sqrt(Math.max(0, a[0])), Math.sqrt(a[1])];
            else if (node.name === 'ln' || node.name === 'log') result = a[1] <= 0 ? unknown : [a[0] <= 0 ? -Infinity : Math.log(a[0]), Math.log(a[1])];
            else if (node.name === 'exp') result = [Math.exp(a[0]), Math.exp(a[1])];
            else if (node.name === 'atan') result = a.map(Math.atan);
            else if (node.name === 'asin' || node.name === 'acos') result = a[0] < -1 || a[1] > 1 ? unknown : ordered(a.map(Math[node.name]));
            else result = unknown;
          } else {
            const b = interval(node.children[1]);
            const sameExpression = node.children[0].key === node.children[1].key;
            switch (node.operator) {
              case '+': result = [a[0] + b[0], a[1] + b[1]]; break;
              case '-': result = sameExpression ? [0, 0] : [a[0] - b[1], a[1] - b[0]]; break;
              case '*': result = multiply(a, b); break;
              case '/': result = contains(b, 0) ? unknown : multiply(a, [1 / b[1], 1 / b[0]]); break;
              case '^': {
                if (b[0] === b[1] && Number.isInteger(b[0])) {
                  const power = b[0];
                  result = power <= 0 && contains(a, 0) ? unknown : ordered([Math.pow(a[0], power), Math.pow(a[1], power), ...(power > 0 && power % 2 === 0 && contains(a, 0) ? [0] : [])]);
                } else if (a[0] > 0) result = ordered([Math.pow(a[0], b[0]), Math.pow(a[0], b[1]), Math.pow(a[1], b[0]), Math.pow(a[1], b[1]), ...(contains(a, 1) || contains(b, 0) ? [1] : [])]);
                else result = unknown;
                break;
              }
              case '<': result = sameExpression ? [0, 0] : a[1] < b[0] ? [1, 1] : a[0] >= b[1] ? [0, 0] : [0, 1]; break;
              case '<=': result = sameExpression ? [1, 1] : a[1] <= b[0] ? [1, 1] : a[0] > b[1] ? [0, 0] : [0, 1]; break;
              case '>': result = sameExpression ? [0, 0] : a[0] > b[1] ? [1, 1] : a[1] <= b[0] ? [0, 0] : [0, 1]; break;
              case '>=': result = sameExpression ? [1, 1] : a[0] >= b[1] ? [1, 1] : a[1] < b[0] ? [0, 0] : [0, 1]; break;
              case '==': case '!=': {
                const same = sameExpression || a[0] === a[1] && b[0] === b[1] && a[0] === b[0], apart = a[1] < b[0] || b[1] < a[0];
                result = same ? node.operator === '==' ? [1, 1] : [0, 0] : apart ? node.operator === '==' ? [0, 0] : [1, 1] : [0, 1];
                break;
              }
              default: result = unknown;
            }
          }
        }
        if (!result || result.some(Number.isNaN)) result = unknown;
        memo.set(node, result);
        return result;
      }
      for (const hazard of hazards) {
        if (hazard.path.some(branch => { const range = interval(branch.node); return branch.truthy ? range[0] === 0 && range[1] === 0 : !contains(range, 0); })) continue;
        const a = interval(hazard.node);
        if (hazard.kind === 'zero' && contains(a, 0)) return true;
        if (hazard.kind === 'comparison' && a[0] !== a[1]) return true;
        if (hazard.kind === 'predicate' && contains(a, 0) && a[0] !== a[1]) return true;
        if (hazard.kind === 'power') {
          const base = interval(hazard.node.children[0]), exponent = interval(hazard.node.children[1]);
          if (exponent[0] === exponent[1] && Number.isInteger(exponent[0]) && exponent[0] > 0) continue;
          if (exponent[0] > 0 ? base[0] < 0 && base[1] >= 0 : contains(base, 0)) return true;
        }
        if (hazard.kind === 'sqrt' && a[0] < 0 && a[1] >= 0) return true;
        if (['ln', 'log'].includes(hazard.kind) && contains(a, 0)) return true;
        if (['asin', 'acos'].includes(hazard.kind) && (a[0] < -1 && a[1] >= -1 || a[0] <= 1 && a[1] > 1)) return true;
        if (hazard.kind === 'tan' && (!a.every(Number.isFinite) || Math.ceil((a[0] - Math.PI / 2) / Math.PI) <= Math.floor((a[1] - Math.PI / 2) / Math.PI))) return true;
      }
      return false;
    }
    let exhausted = false;
    function at(x) {
      if (cache.has(x)) return cache.get(x);
      if (cache.size >= MAX_EVALUATIONS) { exhausted = true; return NaN; }
      const y = evaluate(program, x, parameterValues);
      cache.set(x, y);
      return y;
    }
    function gap() {
      if (output.x.length && Number.isFinite(output.x[output.x.length - 1]) && output.x.length < MAX_OUTPUT) {
        output.x.push(NaN); output.y.push(NaN);
      }
    }
    function append(x, y) {
      if (output.x.length >= MAX_OUTPUT) { exhausted = true; return; }
      output.x.push(x); output.y.push(y);
    }
    function segment(x1, y1, x2, y2) {
      if ((y1 < bottom && y2 < bottom) || (y1 > top && y2 > top)) { gap(); return; }
      const originalX = x1, originalY = y1, dx = x2 - x1, dy = y2 - y1;
      if (y1 < bottom || y1 > top) { y1 = Math.max(bottom, Math.min(top, y1)); x1 = originalX + dx * ((y1 - originalY) / dy); }
      if (y2 < bottom || y2 > top) { y2 = Math.max(bottom, Math.min(top, y2)); x2 = originalX + dx * ((y2 - originalY) / dy); }
      const last = output.x.length - 1;
      if (last < 0 || output.x[last] !== x1 || output.y[last] !== y1) { gap(); append(x1, y1); }
      append(x2, y2);
    }
    function refine(x1, y1, x2, y2, depth) {
      if (exhausted) { gap(); return; }
      const middleX = x1 + (x2 - x1) / 2;
      if (!(middleX > x1 && middleX < x2)) { gap(); return; }
      const middleY = at(middleX);
      // A second, non-dyadic probe avoids drawing a flat line when a periodic
      // function happens to have zeros at every grid node and midpoint.
      const fraction = 0.3819660112501051, probeY = at(x1 + (x2 - x1) * fraction);
      const allFinite = [y1, middleY, probeY, y2].every(finite);
      if (allFinite) {
        const error = Math.max(Math.abs(middleY - (y1 / 2 + y2 / 2)), Math.abs(probeY - (y1 * (1 - fraction) + y2 * fraction)));
        const hazard = crossesHazard(x1, x2);
        if (error <= tolerance && !hazard) { segment(x1, y1, x2, y2); return; }
        // An entirely clipped interval cannot create a visible connection.
        if (!hazard && ([y1, middleY, probeY, y2].every(y => y < bottom) || [y1, middleY, probeY, y2].every(y => y > top))) { gap(); return; }
      } else if (![y1, middleY, probeY, y2].some(finite)) { gap(); return; }
      if (depth >= MAX_REFINEMENT || exhausted) { gap(); return; }
      refine(x1, y1, middleX, middleY, depth + 1);
      refine(middleX, middleY, x2, y2, depth + 1);
    }
    let x1 = left, y1 = at(left);
    for (let index = 1; index < requested && !exhausted; index++) {
      const x2 = index === requested - 1 ? right : left + (right - left) * index / (requested - 1), y2 = at(x2);
      refine(x1, y1, x2, y2, 0);
      x1 = x2; y1 = y2;
    }
    if (output.x.length && Number.isNaN(output.x[output.x.length - 1])) { output.x.pop(); output.y.pop(); }
    // The caller must not describe a budget-limited partial curve as complete.
    if (exhausted) output.limited = true;
    return output;
  }

  return Object.freeze({ parse, validate, evaluate, sample, parameters: PARAMETERS, limits: Object.freeze({ length: MAX_LENGTH, tokens: MAX_TOKENS, depth: MAX_DEPTH, steps: MAX_STEPS, magnitude: MAX_MAGNITUDE, parameter: MAX_PARAMETER }) });
});
