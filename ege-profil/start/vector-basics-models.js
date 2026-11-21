(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const colors = { a: '#285bc9', b: '#9d440d', result: '#147451', guide: '#718299' };
  let sequence = 0;

  function scene(task, context) {
    const { points, arrows, reveal, axes, concealedPoints = [] } = task.vectorDiagram;
    const earned = context.mode === 'guided' ? context.completed || 0 : context.solved ? task.steps.length : 0;
    const shown = arrows.concat(reveal.filter(stage => stage.after <= earned).flatMap(stage => stage.arrows));
    const used = new Set(shown.flatMap(a => [a.from, a.to]));
    const visible = Object.entries(points).filter(([name]) => !concealedPoints.includes(name) || used.has(name));
    return { points, visible, shown, axes };
  }

  function render(container, task, context = {}) {
    const { points, visible, shown, axes } = scene(task, context);
    const doc = container.ownerDocument;
    const id = 'basic-vector-' + (++sequence);
    function element(tag, attributes, text) {
      const node = doc.createElementNS(NS, tag);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      if (text !== undefined) node.textContent = text;
      return node;
    }
    const svg = element('svg', {
      viewBox: '0 0 320 180', width: '100%', role: 'img', 'aria-labelledby': id + '-title ' + id + '-desc',
      'data-vector-basics-drawing': task.id
    });
    svg.style.cssText = 'display:block;max-width:430px;height:auto;margin-inline:auto';
    const description = shown.map(({ from, to, name, color }) => {
      if (from === to) return 'Начало и конец в точке ' + from + '.';
      if (color === 'guide') return 'Пунктирный отрезок ' + from + to + '.';
      return 'Стрелка' + (name ? ' «' + name + '»' : '') + ' от ' + from + ' к ' + to + '.';
    }).join(' ');
    const positions = axes ? Object.entries(points) : visible;
    svg.append(
      element('title', { id: id + '-title' }, 'Векторы на клетчатой сетке'),
      element('desc', { id: id + '-desc' }, description + ' ' + positions.map(([name, [x, y]]) =>
        'Точка ' + name + ': ' + x + ' по горизонтали, ' + y + ' по вертикали.').join(' '))
    );
    const defs = element('defs', {});
    for (const [color, fill] of Object.entries(colors)) {
      const marker = element('marker', { id: id + '-' + color, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 11,
        markerHeight: 11, orient: 'auto', markerUnits: 'userSpaceOnUse' });
      marker.append(element('path', { d: 'M0 0L10 5L0 10Z', fill }));
      defs.append(marker);
    }
    svg.append(defs);
    const all = Object.values(points).concat(axes ? [[0, 0]] : []);
    const xValues = all.map(([x]) => x), yValues = all.map(([, y]) => y);
    const xMin = Math.min(...xValues), xMax = Math.max(...xValues), yMin = Math.min(...yValues), yMax = Math.max(...yValues);
    const scale = Math.min(270 / (xMax - xMin + 1), 136 / (yMax - yMin + 1), 31);
    const midX = (xMax + xMin) / 2, midY = (yMax + yMin) / 2;
    const toScreen = ([x, y]) => [160 + (x - midX) * scale, 90 - (y - midY) * scale];
    function line([x1, y1], [x2, y2], stroke, width, attrs = {}) {
      svg.append(element('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round', ...attrs }));
    }
    function label([x, y], value, fill = '#253c56', attrs = {}) {
      svg.append(element('text', { x, y, fill, 'font-size': 16, 'font-family': 'system-ui,sans-serif', 'font-weight': 650,
        stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round', 'paint-order': 'stroke', ...attrs }, value));
    }
    svg.append(element('rect', { x: 1, y: 1, width: 318, height: 178, rx: 13, fill: '#fcfdff', stroke: '#d9e3ef' }));
    for (let x = Math.ceil(midX - 148 / scale); x <= midX + 148 / scale; x++) {
      const [px] = toScreen([x, 0]);
      line([px, 9], [px, 171], axes && x === 0 ? '#899bb0' : '#e3eaf4', 1);
    }
    for (let y = Math.ceil(midY - 81 / scale); y <= midY + 81 / scale; y++) {
      const [, py] = toScreen([0, y]);
      line([9, py], [311, py], axes && y === 0 ? '#899bb0' : '#e3eaf4', 1);
    }
    if (axes) {
      const [x, y] = toScreen([0, 0]);
      label([302, y - 5], 'x'); label([x + 5, 19], 'y'); label([x - 13, y + 17], '0');
    }
    for (const [index, { from, to, name, color }] of shown.entries()) {
      const start = toScreen(points[from]), end = toScreen(points[to]);
      const dx = end[0] - start[0], dy = end[1] - start[1], length = Math.hypot(dx, dy);
      const attrs = { 'data-vector-arrow': from + to, 'data-vector-role': color };
      if (!length) {
        svg.append(element('circle', { cx: start[0], cy: start[1], r: 8, fill: 'none', stroke: colors[color], 'stroke-width': 2, ...attrs }));
        continue;
      }
      if (color === 'guide') {
        line(start, end, colors[color], 2, { 'stroke-dasharray': '4 4', ...attrs });
        continue;
      }
      const reverse = shown.slice(0, index).some(a => a.from === to && a.to === from);
      const offset = reverse ? 6 : 0;
      const shift = p => [p[0] - dy / length * offset, p[1] + dx / length * offset];
      const inset = Math.min(length / 3, 5);
      line(shift(start), shift([end[0] - dx / length * inset, end[1] - dy / length * inset]), colors[color], color === 'result' ? 3.6 : 2.8,
        { 'marker-end': 'url(#' + id + '-' + color + ')', ...attrs });
      if (name) {
        const [x, y] = shift([start[0] + dx * .58, start[1] + dy * .58]);
        label([x + dy / length * 13, y - dx / length * 13 + 4], name, colors[color],
          { 'text-anchor': 'middle', 'font-size': name.length > 3 ? 13 : 16 });
      }
    }
    for (const [name, at] of visible) {
      const [x, y] = toScreen(at);
      svg.append(element('circle', { cx: x, cy: y, r: 3, fill: '#253c56', 'data-vector-point': name }));
      label([x + 5, y - 6], name);
    }
    container.replaceChildren(svg);
  }

  const models = root.ProfileTaskModels = root.ProfileTaskModels || {};
  for (const lesson of root.ProfileVectorBasics || []) {
    for (const task of lesson.tasks) models[task.id] = render;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { scene };
})(globalThis);
