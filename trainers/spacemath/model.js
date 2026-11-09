/* SpaceMath v1: bounded declarative constructions; no executable expressions. */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./expression.js') : root.SpaceMathExpression);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpaceMathModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Expression) {
  'use strict';
  const VERSION = 1, MAX_OBJECTS = 160, MAX_GRAPHS = 12, MAX_BYTES = 65536, MAX_COORD = 1000000;
  const POINTS = new Set(['point', 'midpoint', 'intersection', 'projection', 'reflectPoint', 'reflectLine', 'rotate', 'dilate']);
  const LINES = new Set(['segment', 'line', 'ray', 'parallel', 'perpendicular', 'bisector', 'perpendicularBisector']);
  const CIRCLES = new Set(['circle', 'circle3']);
  const MEASUREMENTS = new Set(['distance', 'angle', 'area', 'perimeter', 'circumference']);
  const TYPES = new Set([...POINTS, ...LINES, ...CIRCLES, ...MEASUREMENTS, 'polygon', 'slider', 'functionGraph']);
  const DEFAULT_VIEWPORT = Object.freeze({ x: 0, y: 0, span: 12 });
  function viewport(value) {
    keys(value, ['x', 'y', 'span']);
    if (![value.x, value.y, value.span].every(n => typeof n === 'number' && Number.isFinite(n)) || Math.abs(value.x) > 4 * MAX_COORD || Math.abs(value.y) > 4 * MAX_COORD || value.span < 1e-9 || value.span > 8 * MAX_COORD) fail('Область просмотра вне допустимого диапазона.');
    return { x: value.x, y: value.y, span: value.span };
  }
  const own = (v, key) => Object.prototype.hasOwnProperty.call(v, key);
  const fail = message => { throw new TypeError(message); };
  function safe(value, depth = 1, seen = new Set()) {
    if (depth > 8) fail('Слишком глубокое состояние.');
    if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
    if (typeof value === 'number') { if (!Number.isFinite(value)) fail('Число должно быть конечным.'); return; }
    if (!value || typeof value !== 'object' || seen.has(value)) fail('Нужен обычный JSON без циклов.');
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value), keys = Reflect.ownKeys(value);
    if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) fail('Недопустимый объект.');
    if (array && (value.length > MAX_OBJECTS || keys.length !== value.length + 1)) fail('Недопустимый массив.');
    seen.add(value);
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) fail('Недопустимый ключ.');
      const property = Object.getOwnPropertyDescriptor(value, key);
      if (!property.enumerable || !own(property, 'value')) fail('Допускаются только данные.');
      if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) fail('Недопустимый массив.');
      safe(property.value, depth + 1, seen);
    }
    seen.delete(value);
  }
  function keys(value, allowed) {
    if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).length !== allowed.length || allowed.some(k => !own(value, k))) fail('Неизвестные или пропущенные поля.');
  }
  function text(value, max) {
    if (typeof value !== 'string' || value.length > max || /[<>\u0000-\u001f\u007f]/.test(value)) fail('Текст должен быть коротким, без разметки.');
    return value;
  }
  function normalize(value) {
    safe(value);
    keys(value, ['version', 'title', 'objects', 'view']);
    if (value.version !== VERSION) fail('Неизвестная версия построения.');
    keys(value.view, own(value.view || {}, 'viewport') ? ['axes', 'grid', 'viewport'] : ['axes', 'grid']);
    const normalizedViewport = own(value.view, 'viewport') ? viewport(value.view.viewport) : { ...DEFAULT_VIEWPORT };
    if (typeof value.view.axes !== 'boolean' || typeof value.view.grid !== 'boolean') fail('Некорректный вид поля.');
    if (!Array.isArray(value.objects) || value.objects.length > MAX_OBJECTS) fail('Слишком много объектов.');
    if (value.objects.filter(item => item?.type === 'functionGraph').length > MAX_GRAPHS) fail('На одном поле допускается не более 12 графиков.');
    const seen = new Map(), parameterNames = new Set();
    const objects = value.objects.map(item => {
      if (!item || !TYPES.has(item.type)) fail('Неизвестный инструмент.');
      const fields = item.type === 'point' ? ['id', 'type', 'label', 'x', 'y'] : ['id', 'type', 'label', 'parents'];
      if (item.type === 'intersection') fields.push('branch');
      if (item.type === 'rotate') fields.push('angle');
      if (item.type === 'dilate') fields.push('factor');
      if (item.type === 'slider') fields.push('name', 'min', 'max', 'step', 'value');
      if (item.type === 'functionGraph') fields.push('expression');
      keys(item, fields);
      if (typeof item.id !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/i.test(item.id) || seen.has(item.id) || ['__proto__', 'prototype', 'constructor'].includes(item.id)) fail('Некорректный или повторный номер объекта.');
      const result = { id: item.id, type: item.type, label: text(item.label, 30) };
      if (item.type === 'point') {
        if (![item.x, item.y].every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= MAX_COORD)) fail('Координаты вне допустимого диапазона.');
        result.x = item.x; result.y = item.y;
      } else {
        if (!Array.isArray(item.parents) || item.parents.some(id => typeof id !== 'string' || !seen.has(id))) fail('Родитель должен быть создан раньше объекта.');
        const parents = item.parents.map(id => seen.get(id)), point = i => POINTS.has(parents[i]?.type), line = i => LINES.has(parents[i]?.type);
        let valid = false;
        if (['segment', 'line', 'ray', 'circle', 'midpoint', 'distance', 'perpendicularBisector', 'reflectPoint', 'rotate', 'dilate'].includes(item.type)) valid = parents.length === 2 && point(0) && point(1);
        else if (['angle', 'bisector', 'circle3'].includes(item.type)) valid = parents.length === 3 && point(0) && point(1) && point(2);
        else if (item.type === 'polygon') valid = parents.length >= 3 && parents.length <= 30 && parents.every(p => POINTS.has(p.type));
        else if (['parallel', 'perpendicular', 'projection', 'reflectLine'].includes(item.type)) valid = parents.length === 2 && line(0) && point(1);
        else if (item.type === 'area') valid = parents.length === 1 && (parents[0].type === 'polygon' || CIRCLES.has(parents[0].type));
        else if (item.type === 'perimeter') valid = parents.length === 1 && parents[0].type === 'polygon';
        else if (item.type === 'circumference') valid = parents.length === 1 && CIRCLES.has(parents[0].type);
        else if (item.type === 'slider') {
          valid = parents.length === 0 && ['a', 'b', 'c'].includes(item.name) && !parameterNames.has(item.name);
          if (![item.min, item.max, item.step, item.value].every(n => typeof n === 'number' && Number.isFinite(n)) || Math.abs(item.min) > MAX_COORD || Math.abs(item.max) > MAX_COORD || item.min >= item.max || item.value < item.min || item.value > item.max || item.step < 1e-6 || item.min + item.step > item.max) fail('Некорректные границы или значение ползунка.');
          const steps = (item.value - item.min) / item.step;
          const aligned = item.min + Math.round(steps) * item.step;
          if (Math.abs(item.value - aligned) > 4 * Number.EPSILON * Math.max(1, Math.abs(item.min), Math.abs(item.value), Math.abs(aligned))) fail('Значение параметра должно соответствовать заданному шагу.');
          Object.assign(result, { name: item.name, min: item.min, max: item.max, step: item.step, value: item.value });
          parameterNames.add(item.name);
        } else if (item.type === 'functionGraph') {
          if (!Expression) fail('Модуль формул не загружен.');
          const program = Expression.parse(item.expression), required = program.variables.filter(name => name !== 'x');
          const supplied = parents.map(p => p.name);
          valid = parents.every(p => p.type === 'slider') && parents.length === required.length && new Set(supplied).size === supplied.length && required.every(name => supplied.includes(name));
          result.expression = program.source;
        } else if (item.type === 'intersection') {
          valid = parents.length === 2 && parents.every(p => LINES.has(p.type) || CIRCLES.has(p.type)) && item.parents[0] !== item.parents[1] && (item.branch === 0 || item.branch === 1);
          result.branch = item.branch;
        }
        if (!valid) fail('Неверные исходные объекты для инструмента.');
        for (const [type, field, limit] of [['rotate', 'angle', 36000], ['dilate', 'factor', 1000]]) {
          if (item.type === type) {
            if (typeof item[field] !== 'number' || !Number.isFinite(item[field]) || Math.abs(item[field]) > limit) fail('Параметр преобразования вне допустимого диапазона.');
            result[field] = item[field];
          }
        }
        result.parents = [...item.parents];
      }
      seen.set(result.id, result);
      return result;
    });
    const result = { version: VERSION, title: text(value.title, 120), objects, view: { axes: value.view.axes, grid: value.view.grid, viewport: normalizedViewport } };
    if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_BYTES) fail('Построение превышает 64 КБ.');
    return result;
  }
  function empty() { return { version: VERSION, title: 'Новое построение', objects: [], view: { axes: true, grid: true, viewport: { ...DEFAULT_VIEWPORT } } }; }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, n) => [a[0] * n, a[1] * n];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
  const length = a => Math.hypot(a[0], a[1]);
  const finitePoint = a => a.every(Number.isFinite);
  // Relative tolerance only: a fixed length/area floor misclassifies small
  // valid constructions and can invent circle intersections.
  const EPS = 64 * Number.EPSILON;
  const nonzero = a => length(a) > 0;
  const undef = (kind, reason) => ({ kind, defined: false, reason });
  function point(xy) { return finitePoint(xy) ? { kind: 'point', defined: true, x: xy[0], y: xy[1] } : undef('point', 'Координаты не определены.'); }
  const xy = p => [p.x, p.y];
  function line(a, d, domain) { return nonzero(d) && Number.isFinite(length(d)) && finitePoint(a) && finitePoint(d) ? { kind: 'line', defined: true, a, d, domain } : undef('line', 'Для прямой нужны две различные точки.'); }
  const onDomain = (t, d) => t >= d[0] - EPS && t <= d[1] + EPS;
  function intersections(a, b) {
    if (a.kind === 'line' && b.kind === 'line') {
      const aLength = length(a.d), bLength = length(b.d), ad = mul(a.d, 1 / aLength), bd = mul(b.d, 1 / bLength), determinant = cross(ad, bd);
      if (Math.abs(determinant) <= EPS) return [];
      const gap = sub(b.a, a.a), t = cross(gap, bd) / determinant / aLength, u = cross(gap, ad) / determinant / bLength;
      return onDomain(t, a.domain) && onDomain(u, b.domain) ? [add(a.a, mul(a.d, t))] : [];
    }
    if (a.kind === 'circle' && b.kind === 'line') return intersections(b, a);
    if (a.kind === 'line' && b.kind === 'circle') {
      // Project onto a unit direction: the quadratic discriminant loses small
      // radii when line endpoints are far from the circle.
      const dLength = length(a.d), direction = mul(a.d, 1 / dLength), gap = sub(b.c, a.a);
      const along = dot(gap, direction), normalDistance = Math.abs(cross(gap, direction));
      const tolerance = EPS * Math.max(b.r, normalDistance);
      if (!Number.isFinite(normalDistance) || normalDistance > b.r + tolerance) return [];
      // Multiplying the square roots avoids premature underflow of r².
      const delta = Math.sqrt(Math.max(0, b.r - normalDistance)) * Math.sqrt(b.r + normalDistance), values = [(along - delta) / dLength];
      if (delta > EPS * b.r) values.push((along + delta) / dLength);
      // Preserve the algebraic branch when a segment/ray loses one intersection.
      return values.map(t => onDomain(t, a.domain) ? add(a.a, mul(a.d, t)) : null);
    }
    const gap = sub(b.c, a.c), distance = length(gap), tolerance = EPS * Math.max(a.r, b.r, distance);
    if (distance <= tolerance || distance > a.r + b.r + tolerance || distance < Math.abs(a.r - b.r) - tolerance) return [];
    const along = .5 * (distance + (a.r - b.r) / distance * (a.r + b.r));
    if (Math.abs(along) > a.r + tolerance) return [];
    const unit = mul(gap, 1 / distance), center = add(a.c, mul(unit, along)), height = Math.sqrt(Math.max(0, a.r - Math.abs(along))) * Math.sqrt(a.r + Math.abs(along));
    const offset = mul([-unit[1], unit[0]], height), first = add(center, offset);
    return height <= tolerance ? [first] : [first, sub(center, offset)];
  }
  function simplePolygon(vertices) {
    const n = vertices.length;
    const orientation = (a, b, c) => {
      const ab = sub(b, a), ac = sub(c, a), bl = length(ab), cl = length(ac);
      if (bl === 0 || cl === 0) return 0;
      const turn = cross(mul(ab, 1 / bl), mul(ac, 1 / cl));
      return Math.abs(turn) <= EPS ? 0 : Math.sign(turn);
    };
    const between = (a, b, p) => p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
    for (let i = 0; i < n; i++) {
      const a = vertices[i], b = vertices[(i + 1) % n];
      if (length(sub(a, b)) === 0) return false;
      for (let j = i + 1; j < n; j++) {
        if (j === i + 1 || i === 0 && j === n - 1) continue;
        const c = vertices[j], d = vertices[(j + 1) % n];
        const u = orientation(a, b, c), v = orientation(a, b, d), w = orientation(c, d, a), z = orientation(c, d, b);
        if (u * v < 0 && w * z < 0 || u === 0 && between(a, b, c) || v === 0 && between(a, b, d) || w === 0 && between(c, d, a) || z === 0 && between(c, d, b)) return false;
      }
    }
    return true;
  }
  function evaluate(value) {
    const state = normalize(value), results = Object.create(null);
    for (const object of state.objects) {
      const kind = POINTS.has(object.type) ? 'point' : LINES.has(object.type) ? 'line' : CIRCLES.has(object.type) ? 'circle' : MEASUREMENTS.has(object.type) ? 'measurement' : object.type;
      const parents = (object.parents || []).map(id => results[id]);
      let result;
      if (parents.some(p => !p.defined)) result = undef(kind, 'Исходный объект не определён.');
      else if (object.type === 'point') result = point([object.x, object.y]);
      else if (object.type === 'slider') result = { kind: 'slider', defined: true, name: object.name, min: object.min, max: object.max, step: object.step, value: object.value };
      else if (object.type === 'functionGraph') result = { kind: 'functionGraph', defined: true, expression: object.expression, parameters: Object.fromEntries(parents.map(p => [p.name, p.value])) };
      else if (object.type === 'midpoint') result = point(mul(add(xy(parents[0]), xy(parents[1])), 0.5));
      else if (object.type === 'perpendicularBisector') {
        const a = xy(parents[0]), b = xy(parents[1]), d = sub(b, a);
        result = line(mul(add(a, b), .5), [-d[1], d[0]], [-Infinity, Infinity]);
      } else if (object.type === 'projection' || object.type === 'reflectLine') {
        const source = parents[0], p = xy(parents[1]), size = length(source.d);
        const normal = [-source.d[1] / size, source.d[0] / size];
        const correction = mul(normal, dot(sub(p, source.a), normal));
        result = point(sub(p, mul(correction, object.type === 'projection' ? 1 : 2)));
      } else if (['reflectPoint', 'rotate', 'dilate'].includes(object.type)) {
        const p = xy(parents[0]), center = xy(parents[1]), delta = sub(p, center);
        if (object.type === 'reflectPoint') result = point(sub(mul(center, 2), p));
        else if (object.type === 'dilate') result = point(object.factor === 1 ? p : object.factor === 0 ? center : add(center, mul(delta, object.factor)));
        else {
          const degrees = object.angle % 360;
          if (degrees === 0) result = point(p);
          else {
            const quarter = degrees / 90, angle = degrees * Math.PI / 180;
            const c = Number.isInteger(quarter) ? [1, 0, -1, 0][(quarter + 4) % 4] : Math.cos(angle);
            const s = Number.isInteger(quarter) ? [0, 1, 0, -1][(quarter + 4) % 4] : Math.sin(angle);
            result = point(add(center, [delta[0] * c - delta[1] * s, delta[0] * s + delta[1] * c]));
          }
        }
      } else if (['segment', 'line', 'ray'].includes(object.type)) result = line(xy(parents[0]), sub(xy(parents[1]), xy(parents[0])), object.type === 'segment' ? [0, 1] : object.type === 'ray' ? [0, Infinity] : [-Infinity, Infinity]);
      else if (object.type === 'parallel' || object.type === 'perpendicular') {
        const d = parents[0].d;
        result = line(xy(parents[1]), object.type === 'parallel' ? [...d] : [-d[1], d[0]], [-Infinity, Infinity]);
      } else if (object.type === 'circle') {
        const c = xy(parents[0]), r = length(sub(xy(parents[1]), c));
        result = r > 0 && Number.isFinite(r) ? { kind: 'circle', defined: true, c, r } : undef('circle', 'Радиус окружности должен быть больше нуля.');
      } else if (object.type === 'circle3') {
        // A tiny edge can still meet another edge at a well-conditioned angle.
        // Use the most stable vertex, with deterministic ties across all orders.
        const vertices = parents.map(xy).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        let anchor;
        for (let i = 0; i < 3; i++) {
          const a = vertices[i], others = vertices.filter((_, j) => j !== i);
          const b = sub(others[0], a), c = sub(others[1], a), bl = length(b), cl = length(c);
          if (bl === 0 || cl === 0 || !Number.isFinite(bl) || !Number.isFinite(cl)) continue;
          const u = [b[0] / bl, b[1] / bl], v = [c[0] / cl, c[1] / cl], det = cross(u, v);
          if (!anchor || Math.abs(det) > Math.abs(anchor.det)) anchor = { a, u, v, bl, cl, det };
        }
        if (!anchor || Math.abs(anchor.det) <= EPS) result = undef('circle', 'Для окружности нужны три различные точки не на одной прямой.');
        else {
          const { a, u, v, bl, cl, det } = anchor;
          // Solve unit-direction equations without squaring unequal edge lengths.
          const offset = [(bl / 2 * v[1] - cl / 2 * u[1]) / det, (u[0] * cl / 2 - v[0] * bl / 2) / det];
          const center = add(a, offset), radius = length(offset);
          result = finitePoint(center) && Number.isFinite(radius) && radius > 0 ? { kind: 'circle', defined: true, c: center, r: radius } : undef('circle', 'Окружность не определена.');
        }
      } else if (object.type === 'polygon') {
        const vertices = parents.map(xy), base = vertices[0];
        const scale = Math.max(...vertices.map(p => length(sub(p, base))));
        const unit = scale > 0 && Number.isFinite(scale) ? vertices.map(p => mul(sub(p, base), 1 / scale)) : vertices.map(() => [0, 0]);
        const twiceArea = unit.reduce((sum, p, i) => sum + cross(p, unit[(i + 1) % unit.length]), 0);
        result = Math.abs(twiceArea) > EPS ? { kind: 'polygon', defined: true, vertices } : undef('polygon', 'Площадь многоугольника равна нулю.');
      } else if (['area', 'perimeter', 'circumference'].includes(object.type)) {
        const source = parents[0];
        if (source.kind === 'circle') result = { kind: 'measurement', defined: true, value: object.type === 'area' ? Math.PI * source.r * source.r : 2 * Math.PI * source.r, unit: object.type === 'area' ? ' ед.²' : ' ед.', position: [...source.c] };
        else {
          const vertices = source.vertices, base = vertices[0], scale = Math.max(...vertices.map(p => length(sub(p, base))));
          const unit = vertices.map(p => mul(sub(p, base), 1 / scale));
          if (object.type === 'area' && !simplePolygon(unit)) result = undef('measurement', 'Площадь самопересекающегося многоугольника не определена.');
          else {
            const value = object.type === 'area' ? Math.abs(unit.reduce((sum, p, i) => sum + cross(p, unit[(i + 1) % unit.length]), 0)) * scale * scale / 2 : vertices.reduce((sum, p, i) => sum + length(sub(p, vertices[(i + 1) % vertices.length])), 0);
            const position = mul(vertices.reduce((sum, p) => add(sum, p), [0, 0]), 1 / vertices.length);
            result = { kind: 'measurement', defined: true, value, unit: object.type === 'area' ? ' ед.²' : ' ед.', position };
          }
        }
      } else if (object.type === 'distance') {
        result = { kind: 'measurement', defined: true, value: length(sub(xy(parents[1]), xy(parents[0]))), unit: '', position: mul(add(xy(parents[0]), xy(parents[1])), 0.5) };
      } else if (object.type === 'angle' || object.type === 'bisector') {
        const center = xy(parents[1]), a = sub(xy(parents[0]), center), b = sub(xy(parents[2]), center), al = length(a), bl = length(b);
        if (al === 0 || bl === 0 || !Number.isFinite(al) || !Number.isFinite(bl)) result = undef(kind, 'Сторона угла имеет нулевую длину или не определена.');
        else if (object.type === 'angle') {
          const au = mul(a, 1 / al), bu = mul(b, 1 / bl);
          result = { kind: 'measurement', defined: true, value: Math.atan2(Math.abs(cross(au, bu)), dot(au, bu)) * 180 / Math.PI, unit: '°', position: center };
        }
        else {
          const d = add(mul(a, 1 / al), mul(b, 1 / bl));
          result = length(d) > EPS ? line(center, d, [0, Infinity]) : undef('line', 'Для развёрнутого угла выберите сторону биссектрисы.');
        }
      } else if (object.type === 'intersection') {
        const candidates = intersections(parents[0], parents[1]), candidate = candidates[object.branch];
        result = candidate ? point(candidate) : undef('point', 'Эта точка пересечения не существует.');
      }
      if (!result || (result.kind === 'measurement' && result.defined && !Number.isFinite(result.value))) result = undef(kind, 'Объект не определён.');
      results[object.id] = result;
    }
    return results;
  }
  function descendants(value, id) {
    const state = normalize(value), removed = new Set([id]);
    for (const object of state.objects) if (object.parents?.some(parent => removed.has(parent))) removed.add(object.id);
    return state.objects.filter(object => removed.has(object.id)).map(object => object.id);
  }
  return Object.freeze({ version: VERSION, MAX_OBJECTS, MAX_GRAPHS, MAX_BYTES, MAX_COORD, normalize, empty, evaluate, descendants, pointTypes: Object.freeze([...POINTS]), lineTypes: Object.freeze([...LINES]), circleTypes: Object.freeze([...CIRCLES]) });
});
