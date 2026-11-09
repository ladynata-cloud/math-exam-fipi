/* Original MathExam investigations adapted from the reviewed GeoGebra planimetry methods.
 * Pure geometry and SVG only: no storage, network, native task grading or shared-board mutation. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OgeVideoGeometryLessons = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const GREEN = '#216342', ORANGE = '#c45d23', GREY = '#6b7280';
  const point = (x, y) => ({ x, y });
  const add = (a, b) => point(a.x + b.x, a.y + b.y);
  const sub = (a, b) => point(a.x - b.x, a.y - b.y);
  const mul = (a, k) => point(a.x * k, a.y * k);
  const mid = (a, b) => mul(add(a, b), .5);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = value => (Math.round(value * 100) / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  function parameter(params, key, fallback, min, max) {
    const value = params && typeof params[key] === 'number' ? params[key] : Number(params && params[key]);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  }
  function canvas(title, bounds) {
    const [xmin, xmax, ymin, ymax] = bounds;
    const scale = Math.min(416 / (xmax - xmin), 226 / (ymax - ymin));
    const ox = 240 - scale * (xmin + xmax) / 2, oy = 150 + scale * (ymin + ymax) / 2;
    const xy = p => point(ox + p.x * scale, oy - p.y * scale);
    const chunks = [];
    return {
      line(a, b, color = GREEN, dashed = false) {
        const p = xy(a), q = xy(b);
        chunks.push(`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${color}" stroke-width="2.4"${dashed ? ' stroke-dasharray="6 5"' : ''}/>`);
      },
      polygon(points, color = GREEN) {
        chunks.push(`<polygon points="${points.map(p => { const q = xy(p); return q.x + ',' + q.y; }).join(' ')}" fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="2.4"/>`);
      },
      circle(center, radius, color = GREEN, dashed = false) {
        const p = xy(center);
        chunks.push(`<circle cx="${p.x}" cy="${p.y}" r="${radius * scale}" fill="none" stroke="${color}" stroke-width="2.1"${dashed ? ' stroke-dasharray="6 5"' : ''}/>`);
      },
      label(p, name, dx = 9, dy = -9, color = GREEN) {
        const q = xy(p);
        chunks.push(`<circle cx="${q.x}" cy="${q.y}" r="3.5" fill="${color}"/><text x="${q.x + dx}" y="${q.y + dy}" font-family="system-ui,sans-serif" font-size="16" fill="${color}">${escape(name)}</text>`);
      },
      right(v, a, b) {
        const ua = mul(sub(a, v), 9 / (scale * distance(v, a))), ub = mul(sub(b, v), 9 / (scale * distance(v, b)));
        const p = xy(add(v, ua)), q = xy(add(add(v, ua), ub)), r = xy(add(v, ub));
        chunks.push(`<path d="M${p.x},${p.y} L${q.x},${q.y} L${r.x},${r.y}" fill="none" stroke="${ORANGE}" stroke-width="1.5"/>`);
      },
      finish() {
        return `<svg xmlns="http://www.w3.org/2000/svg" class="ovm-geometry" viewBox="0 0 480 300" role="img" aria-label="${escape(title)}" preserveAspectRatio="xMidYMid meet"><title>${escape(title)}</title>${chunks.join('')}</svg>`;
      }
    };
  }
  const source = label => ({ label: 'GeoGebra · планиметрия · ' + label });
  function medianGeometry(params) {
    const a = parameter(params, 'a', 2, -2, 8);
    const A = point(a, 4), B = point(0, 0), C = point(6, 0), M = point(3, 0), H = point(a, 0);
    return { A, B, C, M, H, height: 4, median: distance(A, M), halfArea: 6 };
  }
  function diameterGeometry(params) {
    const angle = parameter(params, 'angle', 60, 20, 160), rad = angle * Math.PI / 180;
    return { O: point(0, 0), B: point(-3, 0), C: point(3, 0), A: point(3 * Math.cos(rad), 3 * Math.sin(rad)), radius: 3, angle };
  }
  function similarityGeometry(params) {
    const k = parameter(params, 'k', 1.5, .5, 2);
    const A = point(0, 0), B = point(4, 0), C = point(1, 3), offset = point(6, 0);
    return { A, B, C, D: offset, E: add(offset, mul(B, k)), F: add(offset, mul(C, k)), k, firstArea: 6, secondArea: 6 * k * k };
  }
  function tangentGeometry(params) {
    const d = parameter(params, 'd', 5, 3.5, 9), r = 3;
    const x = r * r / d, y = r * Math.sqrt(d * d - r * r) / d;
    return { O: point(0, 0), P: point(d, 0), A: point(x, y), B: point(x, -y), r, d, length: Math.sqrt(d * d - r * r) };
  }
  function commonCircleGeometry(params) {
    // BC=4. A stays above BC with AB,AC>4, hence both marked intersections lie on the segments.
    const x = parameter(params, 'x', 2, 1, 3);
    const A = point(x, 6), B = point(0, 0), C = point(4, 0);
    const B1 = add(C, mul(sub(A, C), 4 / distance(A, C)));
    const C1 = add(B, mul(sub(A, B), 4 / distance(A, B)));
    const M = mid(B, B1), N = mid(C, C1), O = mid(B, C);
    return { A, B, C, B1, C1, M, N, O, radius: 2 };
  }
  return [
    {
      id: 'median-height', title: 'Медиана и высота: что сохраняется?', tasks: [15, 19],
      goal: 'Различи середину стороны и основание перпендикуляра, в том числе вне треугольника.',
      source: source('высота, медиана и точные зависимости'),
      controls: [{ key: 'a', label: 'Положение вершины A над прямой BC', min: -2, max: 8, step: .5, value: 2 }],
      predict: { question: 'Если A переместить влево от B, где окажется основание высоты к BC?', choices: ['Всегда внутри отрезка BC', 'На продолжении BC за B', 'В середине BC'], answer: 1, explain: 'Высоту проводят к прямой, содержащей сторону. У тупоугольного треугольника её основание может лежать на продолжении.' },
      reason: { question: 'Почему медиана AM делит площадь треугольника пополам при любом положении A?', choices: ['Любая медиана перпендикулярна стороне', 'BM = MC, а высота к одной прямой BC общая', 'AM всегда равна AH'], answer: 1, explain: 'Треугольники ABM и AMC имеют равные основания BM и MC и одну высоту. Поэтому их площади равны; прямой угол у медианы не требуется.' },
      geometry: medianGeometry,
      render(params) {
        const g = medianGeometry(params), d = canvas('Треугольник ABC, медиана AM и высота AH к прямой BC', [-2.8, 8.8, -.9, 5]);
        d.line(point(-2.5, 0), point(8.5, 0), GREY, true); d.polygon([g.A, g.B, g.C]); d.line(g.A, g.M, GREEN); d.line(g.A, g.H, ORANGE);
        d.right(g.H, g.A, point(g.H.x + 1, 0));
        d.label(g.A, 'A', 8, -12); d.label(g.B, g.H.x === 0 ? 'B=H' : 'B', -21, 24); d.label(g.C, g.H.x === 6 ? 'C=H' : 'C', 8, 24);
        d.label(g.M, g.H.x === 3 ? 'M=H' : 'M', -9, 24);
        if (![0, 3, 6].includes(g.H.x)) d.label(g.H, 'H', -9, -10, ORANGE);
        return { svg: d.finish(), readout: `BC = 6; BM = MC = 3. AH = 4; AM ≈ ${num(g.median)}. Площадь ABM = площадь AMC = 6. ${g.H.x < 0 || g.H.x > 6 ? 'H лежит на продолжении стороны.' : 'H лежит на стороне BC.'}` };
      },
      practices: [
        { prompt: 'В треугольнике ABC сторона BC = 10, высота к прямой BC равна 6. M — середина BC. Найди площадь ABM.', answer: 15, hint: 'Возьми основание BM, равное половине BC, и общую высоту.', solution: 'BM = 5; S(ABM) = 5 · 6 / 2 = 15.' },
        { prompt: 'В треугольнике ABC BC = 14, высота к прямой BC равна 4. M — середина BC. Найди площадь AMC.', answer: 14, hint: 'MC — половина BC. Высота к прямой не меняется.', solution: 'MC = 7; S(AMC) = 7 · 4 / 2 = 14.' },
        { prompt: 'В тупоугольном треугольнике ABC BC = 8, высота AH к прямой BC равна 9, H лежит за B. M — середина BC. Найди площадь ABM.', answer: 18, hint: 'Внешняя высота тоже используется в формуле площади.', solution: 'BM = 4; S(ABM) = 4 · 9 / 2 = 18.' }
      ]
    },
    {
      id: 'diameter-angle', title: 'Диаметр и прямой угол', tasks: [16, 19],
      goal: 'Проверь, что угол, опирающийся на диаметр, сохраняется при движении точки по окружности.',
      source: source('вписанный угол и диаметр'),
      controls: [{ key: 'angle', label: 'Положение A на верхней полуокружности, градусы', min: 20, max: 160, step: 10, value: 60 }],
      predict: { question: 'B и C — концы диаметра. A движется по верхней полуокружности, не попадая в B и C. Как меняется угол BAC?', choices: ['Остаётся равным 90°', 'Равен половине текущего угла ABC', 'Растёт вместе с перемещением A'], answer: 0, explain: 'Угол BAC опирается на полуокружность. Половина дуги 180° равна 90°.' },
      reason: { question: 'Какое условие гарантирует прямой угол BAC?', choices: ['A выглядит высокой на рисунке', 'BC — диаметр, а A лежит на окружности и отличается от B и C', 'AB и AC должны быть равны'], answer: 1, explain: 'Равенство катетов не требуется. Важно, что вписанный угол опирается на диаметр; в концах диаметра треугольник вырождается.' },
      geometry: diameterGeometry,
      render(params) {
        const g = diameterGeometry(params), d = canvas('A на окружности; угол BAC опирается на диаметр BC', [-3.8, 3.8, -3.8, 3.8]);
        d.circle(g.O, 3); d.polygon([g.A, g.B, g.C]); d.line(g.O, g.A, GREY, true); d.right(g.A, g.B, g.C);
        d.label(g.A, 'A', g.A.x > 0 ? 8 : -21, -10); d.label(g.B, 'B', -20, 22); d.label(g.C, 'C', 8, 22); d.label(g.O, 'O', -7, 22);
        return { svg: d.finish(), readout: `BC = 6; ∠BAC = 90°. AB ≈ ${num(distance(g.A, g.B))}; AC ≈ ${num(distance(g.A, g.C))}. AB² + AC² = BC² = 36.` };
      },
      practices: [
        { prompt: 'BC — диаметр окружности, BC = 10. A лежит на окружности и отличается от B и C. AB = 6. Найди AC.', answer: 8, hint: 'Сначала обоснуй прямой угол при A, затем примени теорему Пифагора.', solution: '∠BAC = 90°; AC² = 10² − 6² = 64; AC = 8.' },
        { prompt: 'BC — диаметр окружности, BC = 13. A лежит на окружности и отличается от B и C. AB = 5. Найди AC.', answer: 12, hint: 'Диаметр BC — гипотенуза треугольника ABC.', solution: '∠BAC = 90°; AC² = 13² − 5² = 144; AC = 12.' },
        { prompt: 'BC — диаметр окружности, BC = 17. A лежит на окружности и отличается от B и C. AB = 8. Найди AC.', answer: 15, hint: 'Угол при A опирается на диаметр.', solution: '∠BAC = 90°; AC² = 17² − 8² = 225; AC = 15.' }
      ]
    },
    {
      id: 'similarity-area', title: 'Подобие: длины и площади', tasks: [17, 23],
      goal: 'Отдели коэффициент подобия k от отношения площадей k².',
      source: source('зависимые построения и изменение масштаба'),
      controls: [{ key: 'k', label: 'Коэффициент подобия второго треугольника k', min: .5, max: 2, step: .25, value: 1.5 }],
      predict: { question: 'Все стороны второго треугольника в 2 раза больше соответствующих сторон первого. Во сколько раз больше площадь?', choices: ['В 2 раза', 'В 4 раза', 'В 8 раз'], answer: 1, explain: 'И основание, и высота увеличиваются вдвое: площадь умножается на 2 · 2.' },
      reason: { question: 'Почему при подобии площадь умножается на k²?', choices: ['Меняется только основание', 'Основание и соответствующая высота умножаются на k', 'Площадь всегда равна периметру'], answer: 1, explain: 'S = ah/2. После подобия S′ = (ka)(kh)/2 = k²S. Это верно и при 0 < k < 1.' },
      geometry: similarityGeometry,
      render(params) {
        const g = similarityGeometry(params), d = canvas('Подобные треугольники ABC и DEF с коэффициентом k', [-.7, 14.8, -.8, 6.8]);
        d.polygon([g.A, g.B, g.C]); d.polygon([g.D, g.E, g.F], ORANGE);
        for (const [p, name, color, dx, dy] of [[g.A, 'A', GREEN, -15, 21], [g.B, 'B', GREEN, 3, 21], [g.C, 'C', GREEN, -6, -9], [g.D, 'D', ORANGE, -15, 21], [g.E, 'E', ORANGE, 3, 21], [g.F, 'F', ORANGE, -6, -9]]) d.label(p, name, dx, dy, color);
        return { svg: d.finish(), readout: `k = ${num(g.k)}. AB = 4; DE = ${num(4 * g.k)}. S(ABC) = 6; S(DEF) = ${num(g.secondArea)}. Отношение площадей = ${num(g.k * g.k)}.` };
      },
      practices: [
        { prompt: 'Треугольники ABC и DEF подобны, AB соответствует DE. AB = 4, DE = 10, площадь ABC равна 8. Найди площадь DEF.', answer: 50, hint: 'Сначала найди DE/AB, затем возведи отношение в квадрат.', solution: 'k = 10/4 = 2,5; S(DEF) = 8 · 2,5² = 50.' },
        { prompt: 'Два параллелограмма подобны. Сторона второго в 3 раза больше соответствующей стороны первого. Площадь первого равна 7. Найди площадь второго.', answer: 63, hint: 'Площади подобных фигур относятся как квадраты соответствующих длин.', solution: 'Отношение площадей 3² = 9; S₂ = 7 · 9 = 63.' },
        { prompt: 'Треугольники ABC и DEF подобны, AB соответствует DE. AB = 12, DE = 6, площадь ABC равна 20. Найди площадь DEF.', answer: 5, hint: 'Второй треугольник уменьшен: k = 1/2.', solution: 'S(DEF) = 20 · (1/2)² = 5.' }
      ]
    },
    {
      id: 'equal-tangents', title: 'Две касательные из одной точки', tasks: [16, 23],
      goal: 'Увидь перпендикулярные радиусы и объясни равенство касательных через прямоугольные треугольники.',
      source: source('касательные и сохранение точных связей'),
      controls: [{ key: 'd', label: 'Расстояние OP до внешней точки', min: 3.5, max: 9, step: .5, value: 5 }],
      predict: { question: 'Из внешней точки P проведены касательные PA и PB. Если отодвинуть P от окружности, что сохранится?', choices: ['PA = PB и прямые углы OAP, OBP', 'Длина PA останется прежней', 'Радиус OA станет равен OP'], answer: 0, explain: 'Точки касания перемещаются, а радиус к точке касания остаётся перпендикулярен касательной. Отрезки касательных из одной точки равны.' },
      reason: { question: 'Почему PA = PB?', choices: ['Рисунок симметричен на экране — этого достаточно', 'Прямоугольные треугольники OAP и OBP равны по общей гипотенузе OP и равным радиусам OA, OB', 'Все отрезки вне окружности равны'], answer: 1, explain: 'Из равенства прямоугольных треугольников следует равенство соответствующих катетов PA и PB. Это обоснование, а не измерение картинки.' },
      geometry: tangentGeometry,
      render(params) {
        const g = tangentGeometry(params), d = canvas('Две касательные PA, PB к окружности с центром O', [-3.8, 10, -3.8, 3.8]);
        d.circle(g.O, g.r); d.line(g.P, g.A, ORANGE); d.line(g.P, g.B, ORANGE); d.line(g.O, g.A); d.line(g.O, g.B); d.line(g.O, g.P, GREY, true);
        d.right(g.A, g.O, g.P); d.right(g.B, g.O, g.P);
        d.label(g.O, 'O', -19, 19); d.label(g.P, 'P', 10, 5, ORANGE); d.label(g.A, 'A', -10, -12); d.label(g.B, 'B', -10, 25);
        return { svg: d.finish(), readout: `OA = OB = 3; OP = ${num(g.d)}. ∠OAP = ∠OBP = 90°. PA = PB ≈ ${num(g.length)}; PA² = OP² − 9.` };
      },
      practices: [
        { prompt: 'Из точки P проведена касательная PA к окружности с центром O. Радиус OA = 5, OP = 13. Найди PA.', answer: 12, hint: 'Радиус к точке касания перпендикулярен касательной.', solution: 'Треугольник OAP прямоугольный; PA² = 13² − 5² = 144; PA = 12.' },
        { prompt: 'Из P проведены касательные PA и PB к окружности с центром O. OP = 10, радиус равен 6. Найди сумму PA + PB.', answer: 16, hint: 'Найди одну касательную по Пифагору и используй PA = PB.', solution: 'PA = √(10² − 6²) = 8; PB = 8; PA + PB = 16.', proof: 'OA ⟂ PA и OB ⟂ PB. Прямоугольные треугольники OAP и OBP равны по общей гипотенузе OP и равным катетам OA = OB, поэтому PA = PB.' },
        { prompt: 'Из P проведена касательная PA к окружности радиуса 8 с центром O. OP = 17. Найди PA.', answer: 15, hint: 'OP — гипотенуза, радиус — один катет.', solution: 'PA² = 17² − 8² = 225; PA = 15.' }
      ]
    },
    {
      id: 'midpoints-common-circle', title: 'Найти общую окружность', tasks: [24, 25],
      goal: 'Пройди путь от равных сторон через медианы равнобедренных треугольников к окружности с диаметром BC.',
      source: source('урок 8 · равные отрезки, середины и окружность'),
      controls: [{ key: 'x', label: 'Положение A при сохранении BC = CB₁ = BC₁', min: 1, max: 3, step: .25, value: 2 }],
      predict: { question: 'B₁ лежит на AC, C₁ — на AB; BC = CB₁ = BC₁. M и N — середины BB₁ и CC₁. На какой окружности могут лежать B, M, N, C?', choices: ['С диаметром BC', 'С центром A', 'С диаметром BB₁'], answer: 0, explain: 'В равнобедренном CBB₁ медиана CM является высотой; аналогично BN ⟂ CC₁. Получаются прямые углы BMC и BNC.' },
      reason: { question: 'Какой шаг превращает наблюдение в доказательство?', choices: ['Достаточно проверить рисунок в трёх положениях', 'CB = CB₁ и M — середина BB₁ ⇒ CM ⟂ BB₁; BC = BC₁ и N — середина CC₁ ⇒ BN ⟂ CC₁', 'Любые середины отрезков лежат на одной окружности'], answer: 1, explain: 'Углы BMC и BNC прямые. По обратному свойству угла, опирающегося на диаметр, M и N лежат на окружности с диаметром BC. Вместе с B и C они принадлежат одной окружности.' },
      geometry: commonCircleGeometry,
      preview(params) {
        const g = commonCircleGeometry(params), d = canvas('Условие: треугольник ABC, равные отрезки BC, CB₁, BC₁ и середины M, N', [-1, 5, -.8, 6.9]);
        d.polygon([g.A, g.B, g.C]);
        d.line(g.B, g.C, ORANGE); d.line(g.C, g.B1, ORANGE); d.line(g.B, g.C1, ORANGE);
        d.line(g.B, g.B1, GREY, true); d.line(g.C, g.C1, GREY, true);
        // Equal-length marks encode only the given BC = CB₁ = BC₁.
        for (const [a, b] of [[g.B, g.C], [g.C, g.B1], [g.B, g.C1]]) {
          const center = mid(a, b), v = sub(b, a), n = mul(point(-v.y, v.x), .11 / distance(a, b));
          d.line(sub(center, n), add(center, n), ORANGE);
        }
        d.label(g.A, 'A', -6, -12); d.label(g.B, 'B', -21, 24); d.label(g.C, 'C', 10, 24);
        d.label(g.B1, 'B₁', 12, -7); d.label(g.C1, 'C₁', -34, -7);
        d.label(g.M, 'M', -28, 3, GREY); d.label(g.N, 'N', 12, 3, GREY);
        return { svg: d.finish(), readout: 'Дано: BC = CB₁ = BC₁. B₁ лежит на AC, C₁ — на AB. M — середина BB₁; N — середина CC₁.' };
      },
      render(params) {
        const g = commonCircleGeometry(params), d = canvas('B, M, N и C лежат на окружности с диаметром BC', [-1, 5, -2.7, 6.9]);
        d.circle(g.O, g.radius, ORANGE); d.polygon([g.A, g.B, g.C]); d.line(g.B, g.B1); d.line(g.C, g.C1); d.line(g.C, g.M, GREY, true); d.line(g.B, g.N, GREY, true);
        d.right(g.M, g.B, g.C); d.right(g.N, g.B, g.C);
        d.label(g.A, 'A', -6, -12); d.label(g.B, 'B', -21, 21); d.label(g.C, 'C', 10, 21);
        d.label(g.B1, 'B₁', 11, -7); d.label(g.C1, 'C₁', -29, -7); d.label(g.M, 'M', -26, 3, ORANGE); d.label(g.N, 'N', 11, 3, ORANGE);
        return { svg: d.finish(), readout: 'BC = CB₁ = BC₁ = 4. M — середина BB₁; N — середина CC₁. ∠BMC = ∠BNC = 90°. Общая окружность имеет центр в середине BC и радиус 2. Изменение A сохраняет все заданные связи.' };
      },
      practices: [
        { prompt: 'В невырожденном треугольнике ABC точки B₁ и C₁ лежат соответственно на AC и AB; BC = CB₁ = BC₁ = 10. M и N — середины BB₁ и CC₁. Докажи, что B, M, N, C лежат на одной окружности, и найди её радиус. В поле ответа введи радиус.', answer: 5, hint: 'В равнобедренных CBB₁ и BCC₁ медианы CM и BN являются высотами.', solution: '∠BMC = ∠BNC = 90°; общая окружность имеет диаметр BC = 10, поэтому R = 5.', proof: 'CB = CB₁, поэтому в равнобедренном CBB₁ медиана CM перпендикулярна BB₁. Аналогично из BC = BC₁ следует BN ⟂ CC₁. Значит, ∠BMC = ∠BNC = 90°, и M,N лежат на окружности с диаметром BC. Её радиус равен BC/2 = 5.' },
        { prompt: 'В невырожденном треугольнике ABC точки B₁ ∈ AC и C₁ ∈ AB, BC = CB₁ = BC₁ = 14. M и N — середины BB₁ и CC₁. Обоснуй существование общей окружности B,M,N,C и найди её радиус.', answer: 7, hint: 'Достаточно получить два прямых угла, опирающихся на BC.', solution: 'CM ⟂ BB₁ и BN ⟂ CC₁; диаметр общей окружности BC = 14; R = 7.', proof: 'В CBB₁ и BCC₁ равные стороны сходятся соответственно в C и B. Медианы CM и BN поэтому являются высотами. Прямые углы BMC и BNC дают одну окружность с диаметром BC; R = 14/2 = 7.' },
        { prompt: 'В невырожденном треугольнике ABC точка B₁ лежит на AC, а C₁ — на AB; BC = CB₁ = BC₁ = 9. M,N — середины BB₁,CC₁. Докажи принадлежность B,M,N,C одной окружности и найди её радиус.', answer: 4.5, hint: 'Обоснуй, что CM и BN — высоты, затем найди диаметр.', solution: '∠BMC = ∠BNC = 90°; диаметр BC = 9; R = 4,5.', proof: 'Из CB = CB₁ и середины M получаем CM ⟂ BB₁. Из BC = BC₁ и середины N получаем BN ⟂ CC₁. Поэтому M и N лежат на окружности с диаметром BC, как и B,C. Радиус равен 9/2.' }
      ]
    }
  ];
});
