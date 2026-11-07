/* SpaceMath v1: bounded declarative constructions; no executable expressions. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpaceMathModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1, MAX_OBJECTS = 160, MAX_BYTES = 65536, MAX_COORD = 1000000;
  const POINTS = new Set(['point', 'midpoint', 'intersection']);
  const LINES = new Set(['segment', 'line', 'ray', 'parallel', 'perpendicular', 'bisector']);
  const TYPES = new Set([...POINTS, ...LINES, 'circle', 'polygon', 'distance', 'angle']);
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
    keys(value.view, ['axes', 'grid']);
    if (typeof value.view.axes !== 'boolean' || typeof value.view.grid !== 'boolean') fail('Некорректный вид поля.');
    if (!Array.isArray(value.objects) || value.objects.length > MAX_OBJECTS) fail('Слишком много объектов.');
    const seen = new Map();
    const objects = value.objects.map(item => {
      if (!item || !TYPES.has(item.type)) fail('Неизвестный инструмент.');
      keys(item, item.type === 'point' ? ['id', 'type', 'label', 'x', 'y'] : item.type === 'intersection' ? ['id', 'type', 'label', 'parents', 'branch'] : ['id', 'type', 'label', 'parents']);
      if (typeof item.id !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/i.test(item.id) || seen.has(item.id) || ['__proto__', 'prototype', 'constructor'].includes(item.id)) fail('Некорректный или повторный номер объекта.');
      const result = { id: item.id, type: item.type, label: text(item.label, 30) };
      if (item.type === 'point') {
        if (![item.x, item.y].every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= MAX_COORD)) fail('Координаты вне допустимого диапазона.');
        result.x = item.x; result.y = item.y;
      } else {
        if (!Array.isArray(item.parents) || item.parents.some(id => typeof id !== 'string' || !seen.has(id))) fail('Родитель должен быть создан раньше объекта.');
        const parents = item.parents.map(id => seen.get(id)), point = i => POINTS.has(parents[i]?.type), line = i => LINES.has(parents[i]?.type);
        let valid = false;
        if (['segment', 'line', 'ray', 'circle', 'midpoint', 'distance'].includes(item.type)) valid = parents.length === 2 && point(0) && point(1);
        else if (['angle', 'bisector'].includes(item.type)) valid = parents.length === 3 && point(0) && point(1) && point(2);
        else if (item.type === 'polygon') valid = parents.length >= 3 && parents.length <= 30 && parents.every(p => POINTS.has(p.type));
        else if (['parallel', 'perpendicular'].includes(item.type)) valid = parents.length === 2 && line(0) && point(1);
        else if (item.type === 'intersection') {
          valid = parents.length === 2 && parents.every(p => LINES.has(p.type) || p.type === 'circle') && item.parents[0] !== item.parents[1] && (item.branch === 0 || item.branch === 1);
          result.branch = item.branch;
        }
        if (!valid) fail('Неверные исходные объекты для инструмента.');
        result.parents = [...item.parents];
      }
      seen.set(result.id, result);
      return result;
    });
    const result = { version: VERSION, title: text(value.title, 120), objects, view: { axes: value.view.axes, grid: value.view.grid } };
    if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_BYTES) fail('Построение превышает 64 КБ.');
    return result;
  }
  function empty() { return { version: VERSION, title: 'Новое построение', objects: [], view: { axes: true, grid: true } }; }
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
  function evaluate(value) {
    const state = normalize(value), results = Object.create(null);
    for (const object of state.objects) {
      const kind = POINTS.has(object.type) ? 'point' : LINES.has(object.type) ? 'line' : ['distance', 'angle'].includes(object.type) ? 'measurement' : object.type;
      const parents = (object.parents || []).map(id => results[id]);
      let result;
      if (parents.some(p => !p.defined)) result = undef(kind, 'Исходный объект не определён.');
      else if (object.type === 'point') result = point([object.x, object.y]);
      else if (object.type === 'midpoint') result = point(mul(add(xy(parents[0]), xy(parents[1])), 0.5));
      else if (['segment', 'line', 'ray'].includes(object.type)) result = line(xy(parents[0]), sub(xy(parents[1]), xy(parents[0])), object.type === 'segment' ? [0, 1] : object.type === 'ray' ? [0, Infinity] : [-Infinity, Infinity]);
      else if (object.type === 'parallel' || object.type === 'perpendicular') {
        const d = parents[0].d;
        result = line(xy(parents[1]), object.type === 'parallel' ? [...d] : [-d[1], d[0]], [-Infinity, Infinity]);
      } else if (object.type === 'circle') {
        const c = xy(parents[0]), r = length(sub(xy(parents[1]), c));
        result = r > 0 && Number.isFinite(r) ? { kind: 'circle', defined: true, c, r } : undef('circle', 'Радиус окружности должен быть больше нуля.');
      } else if (object.type === 'polygon') {
        const vertices = parents.map(xy), base = vertices[0];
        const scale = Math.max(...vertices.map(p => length(sub(p, base))));
        const unit = scale > 0 && Number.isFinite(scale) ? vertices.map(p => mul(sub(p, base), 1 / scale)) : vertices.map(() => [0, 0]);
        const twiceArea = unit.reduce((sum, p, i) => sum + cross(p, unit[(i + 1) % unit.length]), 0);
        result = Math.abs(twiceArea) > EPS ? { kind: 'polygon', defined: true, vertices } : undef('polygon', 'Площадь многоугольника равна нулю.');
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
      if (!result || (result.kind === 'measurement' && !Number.isFinite(result.value))) result = undef(kind, 'Объект не определён.');
      results[object.id] = result;
    }
    return results;
  }
  function descendants(value, id) {
    const state = normalize(value), removed = new Set([id]);
    for (const object of state.objects) if (object.parents?.some(parent => removed.has(parent))) removed.add(object.id);
    return state.objects.filter(object => removed.has(object.id)).map(object => object.id);
  }
  return Object.freeze({ version: VERSION, MAX_OBJECTS, MAX_BYTES, MAX_COORD, normalize, empty, evaluate, descendants, pointTypes: Object.freeze([...POINTS]), lineTypes: Object.freeze([...LINES]) });
});
