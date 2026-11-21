(function (root) {
  'use strict';

  const ink = '#245b49', active = '#97451e', shade = '#cde6d7';
  const n = x => Number(x.toFixed(2));
  const point = (x, y) => n(x) + ' ' + n(y);
  const line = (d, color = ink, width = 2, more = '') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
  const label = (x, y, text) => `<text x="${n(x)}" y="${n(y)}" text-anchor="middle" fill="#20382c" font-family="system-ui,sans-serif" font-size="15" paint-order="stroke" stroke="white" stroke-width="3" stroke-linejoin="round">${text}</text>`;
  const rect = (x, y, w, h) => `M${point(x, y)}h${n(w)}v${n(h)}h-${n(w)}Z`;

  function freeArea({a, b, c}, step) {
    const size = 146, x = 82, y = 21;
    const w = size * b / a, h = size * c / a;
    const left = x + (size - w) / 2, top = y + (size - h) / 2;
    const plot = rect(x, y, size, size), house = rect(left, top, w, h);
    const part = step === 0 ? 'plot' : step === 1 ? 'house' : 'free';
    const colored = {plot, house, free: plot + ' ' + house};
    const fill = step < 0 ? '' : `<path data-highlight="${part}" d="${colored[part]}" fill="${shade}" fill-rule="evenodd"/>`;
    const svg = fill + line(plot) + line(house, step === 1 ? active : ink) +
      label(x + size / 2, y + size + 20, a + ' м') +
      label(left + w / 2, top - 7, b + ' м') + label(left + w + 22, top + h / 2 + 5, c + ' м');
    const captions = ['Выделен весь квадратный участок.', 'Выделен прямоугольник дома.', 'Выделена земля вокруг дома.'];
    return {svg, title: `Квадратный участок со стороной ${a} м. Внутри дом ${b} на ${c} м. ` + (captions[Math.min(step, 2)] || ''),
      equation: [`S участка = ${a} · ${a}`, `S дома = ${b} · ${c}`, `S свободной части = ${a*a} − ${b*c}`][step]};
  }

  function fence({a, b, g}, step) {
    const scale = Math.min(203 / a, 125 / b), w = a * scale, h = b * scale;
    const x = 155 - w / 2, y = 36, bottom = y + h;
    const left = 155 - g * scale / 2, right = 155 + g * scale / 2;
    const sides = `M${point(left,bottom)}H${n(x)}V${y}H${n(x+w)}V${n(bottom)}H${n(right)}`;
    const closure = step === 0 ? line(`M${point(left,bottom)}H${n(right)}`, active, 2.5, 'stroke-dasharray="4 4" data-highlight="perimeter"') : '';
    const svg = line(sides, step >= 1 ? active : ink, 3, 'data-segment="fence"') + closure +
      line(`M${point(left,bottom-4)}v8 M${point(right,bottom-4)}v8`) +
      label(155, y-9, a + ' м') + label(x-25, y+h/2+5, b + ' м') +
      label(155, bottom+21, 'проезд ' + g + ' м');
    return {svg, title: `Участок ${a} на ${b} м с проездом ${g} м. ` +
      (step === 0 ? 'Пунктир замыкает границу участка для подсчёта периметра.' : 'Между концами забора оставлен проезд.'),
      equation: [`P = 2 · (${a} + ${b})`, `Длина забора = ${2*(a+b)} − ${g}`][step]};
  }

  function spokes({n: count}, step) {
    const x = 155, y = 94, r = 72, turn = 2 * Math.PI / count;
    const end = (i, radius) => point(x + radius * Math.cos(i*turn), y - radius * Math.sin(i*turn));
    const center = point(x, y);
    const spokes = Array.from({length: count}, (_, i) => line(`M${center}L${end(i,r)}`, '#628474', 1.3, 'data-spoke=""')).join('');
    const sector = `M${center}L${end(0,r)}A${r} ${r} 0 0 0 ${end(1,r)}Z`;
    const highlight = `<path data-highlight="sector" d="${sector}" fill="#f5d2aa"/>` + line(`M${end(0,r)}L${center}L${end(1,r)}`, active, 2.5) +
      line(`M${end(0,55)}A55 55 0 0 0 ${end(1,55)}`, active, 2.5);
    const full = step === 0;
    const svg = spokes + (full ? '' : highlight) + `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${full ? active : ink}" stroke-width="${full ? 4 : 2}"/>` +
      `<circle cx="${x}" cy="${y}" r="3" fill="${ink}"/>` + label(x, 192, 'Число спиц — ' + count);
    return {svg, title: `Колесо с ${count} равномерно расположенными спицами. ` +
      (full ? 'Выделен полный оборот.' : 'Выделен промежуток между двумя соседними спицами.'),
      equation: ['Один полный оборот', '1 спица → 1 промежуток', `Угол между спицами = 360° / ${count}`][step]};
  }

  function triangleAngles({a, b}, step) {
    const radians = angle => angle * Math.PI / 180;
    const cotA = 1 / Math.tan(radians(a)), cotB = 1 / Math.tan(radians(b));
    const h = Math.min(124, 207 / (cotA + cotB)), width = h * (cotA + cotB);
    const A = [155-width/2, 165], B = [155+width/2, 165], C = [A[0]+h*cotA, 165-h], c = 180-a-b;
    const unit = (v, p) => {const dx=p[0]-v[0], dy=p[1]-v[1], len=Math.hypot(dx,dy);return [dx/len,dy/len];};
    function mark(v, p, q, r, right = false) {
      const u = unit(v,p), w = unit(v,q);
      const offset = (s,t) => point(v[0]+s*u[0]+t*w[0], v[1]+s*u[1]+t*w[1]);
      if (right) return `M${offset(r,0)}L${offset(r,r)}L${offset(0,r)}`;
      return `M${offset(r,0)}A${r} ${r} 0 0 ${u[0]*w[1]-u[1]*w[0]>0?1:0} ${offset(0,r)}`;
    }
    const triangle = `M${point(...A)}L${point(...B)}L${point(...C)}Z`;
    const knownColor = step === 0 ? active : ink;
    const svg = line(triangle) + line(mark(A,B,C,21), knownColor, 2.5) + line(mark(B,A,C,21), knownColor, 2.5) +
      line(mark(C,A,B,step>=2 && c===90 ? 10 : 17, step>=2 && c===90), step>=1 ? active : ink, 2.5, 'data-angle="C"') +
      label(A[0]-10,A[1]+17,'A') + label(B[0]+10,B[1]+17,'B') + label(C[0],C[1]-10,'C') +
      label(A[0]+40,A[1]-6,a+'°') + label(B[0]-40,B[1]-6,b+'°') + label(C[0],C[1]+37,step>=2 ? c+'°' : '?');
    return {svg, title: `Треугольник ABC. Угол A равен ${a}°, угол B равен ${b}°. ` + (step>=2 ? `Угол C равен ${c}°.` : 'Нужно найти угол C.'),
      equation: [`∠A + ∠B = ${a}° + ${b}°`, `∠C = 180° − ${a+b}°`][step]};
  }

  const figures = new Map([
    ['practice-free-area', freeArea], ['practice-fence', fence],
    ['practice-spokes', spokes], ['practice-triangle-angle', triangleAngles]
  ]);
  function frame(task, step = -1) {
    const drawing = figures.get(task.id)(task.params, step);
    return {equation: drawing.equation, svg: `<svg xmlns="http://www.w3.org/2000/svg" class="task-figure plane-figure" data-plan="${task.id}" data-step="${step}" viewBox="0 0 310 204" role="img" aria-label="${drawing.title}"><title>${drawing.title}</title>${drawing.svg}</svg>`};
  }
  root.PathPlanePractice = {supports: task => figures.has(task.id), frame};
})(globalThis);
