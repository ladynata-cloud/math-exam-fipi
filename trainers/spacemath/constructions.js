/* Atomic, declarative classroom constructions. No coordinates are copied. */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./model.js') : root.SpaceMathModel);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpaceMathConstructions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';
  const fail = message => { throw new TypeError(message); };
  const modes = new Set(['rotate', 'dilate', 'reflectPoint', 'reflectLine', 'translate']);
  const titles = { rotate: 'Поворот', dilate: 'Гомотетия', reflectPoint: 'Центральная симметрия', reflectLine: 'Осевая симметрия', translate: 'Перенос' };
  function parameter(value, key, optional = []) {
    if (typeof value === 'number') return { [key]: value };
    if (!value || Object.getPrototypeOf(value) !== Object.prototype || !Object.hasOwn(value, key)
      || Object.keys(value).some(name => ![key, ...optional].includes(name))) fail('Некорректные параметры построения.');
    return value;
  }
  function bounded(value, min, max, label) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(label + ' вне допустимого диапазона.');
    return value;
  }
  function build(state, tool, parents, param) {
    // normalize also rejects unsafe JSON and makes a deep copy. A failed batch
    // can never expose partially created vertices or mutate a caller's state.
    const candidate = M.normalize(state), originalCount = candidate.objects.length;
    const points = new Set(M.pointTypes), lines = new Set(M.lineTypes), circles = new Set(M.circleTypes), vectors = new Set(M.vectorTypes);
    if (!Array.isArray(parents) || parents.length !== 2 || parents.some(id => typeof id !== 'string')) fail('Выберите два исходных объекта.');
    const find = id => candidate.objects.find(item => item.id === id);
    const first = find(parents[0]), second = find(parents[1]);
    if (!first || !second) fail('Исходный объект не найден.');
    const nextId = () => {
      let serial = 1;
      while (candidate.objects.some(item => item.id === 'o' + serial)) serial++;
      return 'o' + serial;
    };
    const pointLabel = () => {
      const used = new Set(candidate.objects.filter(item => points.has(item.type)).map(item => item.label));
      let serial = 0, label;
      do { label = String.fromCharCode(65 + serial % 26) + (serial >= 26 ? Math.floor(serial / 26) : ''); serial++; } while (used.has(label));
      return label;
    };
    const objectLabel = base => {
      let serial = 1, label;
      do { label = base.slice(0, 24) + ' ' + serial++; } while (candidate.objects.some(item => item.label === label));
      return label;
    };
    const append = (type, sourceParents, extra = {}, label) => {
      if (candidate.objects.length >= M.MAX_OBJECTS) fail('Не хватает места для всего построения: допускается не более ' + M.MAX_OBJECTS + ' объектов.');
      const item = { id: nextId(), type, label: label || (points.has(type) ? pointLabel() : objectLabel(type)), parents: [...sourceParents], ...extra };
      candidate.objects.push(item);
      return item.id;
    };
    const appearanceOf = item => item.appearance ? { appearance: { ...item.appearance } } : {};
    let selectedId, parameterId;
    if (tool === 'fixedLength' || tool === 'fixedAngle' || tool === 'regularPolygon') {
      if (!points.has(first.type) || !points.has(second.type)) fail('Для этого построения нужны две точки.');
      if (tool === 'fixedLength') {
        const { length } = parameter(param, 'length');
        bounded(length, 0, M.MAX_COORD, 'Длина');
        parameterId = append('fixedDistance', parents, { length });
        selectedId = append('segment', [parents[0], parameterId], {}, objectLabel('Отрезок заданной длины'));
      } else if (tool === 'fixedAngle') {
        const { angle } = parameter(param, 'angle');
        bounded(angle, -36000, 36000, 'Угол');
        parameterId = append('rotate', parents, { angle });
        append('ray', [parents[1], parents[0]], {}, objectLabel('Начальная сторона угла'));
        selectedId = append('ray', [parents[1], parameterId], {}, objectLabel('Луч заданного угла'));
        append('angle', [parents[0], parents[1], parameterId], {}, objectLabel('Величина угла'));
      } else {
        const options = parameter(param, 'sides', ['orientation']);
        const sides = bounded(options.sides, 3, 30, 'Число сторон'), orientation = options.orientation ?? 1;
        if (!Number.isInteger(sides) || ![-1, 1].includes(orientation)) fail('Число сторон должно быть целым от 3 до 30; направление — 1 или −1.');
        const vertices = [...parents];
        for (let index = 2; index < sides; index++) vertices.push(append('regularVertex', parents, { sides, index, orientation }));
        selectedId = append('polygon', vertices, {}, objectLabel('Правильный ' + sides + '-угольник'));
      }
    } else if (tool === 'transformFigure') {
      if (!param || Object.getPrototypeOf(param) !== Object.prototype || !modes.has(param.mode)) fail('Неизвестное преобразование.');
      const key = param.mode === 'rotate' ? 'angle' : param.mode === 'dilate' ? 'factor' : null;
      if (Object.keys(param).some(name => name !== 'mode' && name !== key) || key && !Object.hasOwn(param, key)) fail('Некорректные параметры преобразования.');
      if (key) bounded(param[key], key === 'angle' ? -36000 : -1000, key === 'angle' ? 36000 : 1000, key === 'angle' ? 'Угол' : 'Коэффициент');
      const referenceValid = param.mode === 'translate' ? vectors.has(second.type) : param.mode === 'reflectLine' ? lines.has(second.type) : points.has(second.type);
      if (!referenceValid) fail('Неверный центр, ось или вектор преобразования.');
      const sourceValid = points.has(first.type) || lines.has(first.type) || circles.has(first.type) || vectors.has(first.type) || first.type === 'polygon';
      if (!sourceValid) fail('Преобразование доступно для точек, линий, окружностей, векторов и многоугольников.');
      parameterId = append('transformation', [parents[1]], { mode: param.mode, ...(key ? { [key]: param[key] } : {}) }, objectLabel(titles[param.mode]));
      const images = new Map();
      const image = sourceId => {
        if (images.has(sourceId)) return images.get(sourceId);
        const original = find(sourceId);
        const result = append('transformedPoint', [sourceId, parameterId], appearanceOf(original));
        images.set(sourceId, result);
        return result;
      };
      const type = first.type;
      if (points.has(type)) selectedId = image(first.id);
      else if (circles.has(type)) {
        // Keep the radius independent of point-coordinate rounding. Rebuilding
        // a circle from its center and sampled edge loses a tiny radius far
        // from the origin, even for an identity transformation.
        selectedId = append('transformedCircle', [first.id, parameterId], appearanceOf(first), objectLabel('Образ ' + (first.label || 'окружности')));
      }
      else if (lines.has(type) || vectors.has(type)) {
        // A direction is transformed directly: T(a + d) - T(a) can round to
        // zero for a small d at a large a, although the line is still defined.
        selectedId = append(lines.has(type) ? 'transformedLine' : 'transformedVector', [first.id, parameterId], appearanceOf(first), objectLabel('Образ ' + (first.label || 'фигуры')));
      }
      else {
        const vertices = first.parents.map(id => image(id));
        selectedId = append(type, vertices, appearanceOf(first), objectLabel('Образ ' + (first.label || 'фигуры')));
      }
    } else fail('Неизвестное пакетное построение.');
    const normalized = M.normalize(candidate);
    if (normalized.objects.length <= originalCount) fail('Построение не создано.');
    return { objects: normalized.objects, selectedId, ...(parameterId ? { parameterId } : {}) };
  }
  return Object.freeze({ build });
});
