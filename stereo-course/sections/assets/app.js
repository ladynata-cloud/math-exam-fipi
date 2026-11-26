
(function () {
  'use strict';

  const C = window.COURSE;
  const board = window.SECTIONS_BOARD_SESSION || null;
  const storage = board ? board.storage : { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };
  let boardApplying = false, boardSettle = null;
  const wrapYaw = value => value >= -Math.PI && value < Math.PI ? value :
    ((value + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const host = document.getElementById('sections-app');
  if (!C || !Array.isArray(C.lessons) || !C.lessons.length) {
    host.replaceChildren(document.createTextNode('В этом файле не найдены материалы курса.'));
    return;
  }
  const NS = 'http://www.w3.org/2000/svg';
  const KEY = typeof C.storageKey === 'string' && C.storageKey.trim() ? C.storageKey : 'mathexam.sections.master.v1';
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const mul = (a, s) => a.map(v => v * s);
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => Math.hypot(...a);
  const unit = a => mul(a, 1 / Math.max(norm(a), 1e-14));
  const mean = arr => arr.length ? mul(arr.reduce(add, [0, 0, 0]), 1 / arr.length) : [0, 0, 0];
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const edgeKey = (a, b) => [a, b].sort().join('|');
  const displayName = x => String(x).replace(/_?([0-9]+)$/g, m => m.replace('_', '').replace(/[0-9]/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]));
  const lessonMap = new Map(C.lessons.map(l => [l.id, l]));
  const moduleMap = new Map((C.modules || []).map(m => [m.id, m]));
  const skillMap = new Map((Array.isArray(C.skills) ? C.skills : []).map(s => [s.id, s.label || s.title || s.id]));

  // A short scaffold uses the same calm presentation without becoming a starter.
  function guidanceFor(lesson) { return lesson?.starter || lesson?.scaffold || null; }
  function guidanceNames(lesson) { return lesson.starter ? lesson.starterVisibleNames : lesson.scaffoldVisibleNames; }

  function frozenCopy(value) {
    const copy = JSON.parse(JSON.stringify(value));
    const freeze = object => {
      if (!object || typeof object !== 'object' || Object.isFrozen(object)) return object;
      Object.values(object).forEach(freeze); return Object.freeze(object);
    };
    return freeze(copy);
  }
  function sourceReference(reference) {
    if (!reference) return '';
    if (typeof reference === 'string') return reference;
    if (Array.isArray(reference)) return reference.map(sourceReference).filter(Boolean).join('; ');
    if (typeof reference === 'object') return [reference.authors, reference.title || reference.name, reference.part ? 'часть ' + reference.part : '', reference.section, reference.task ? '№ ' + reference.task : '', reference.page ? 'с. ' + reference.page : '', reference.year].filter(Boolean).join(' · ');
    return '';
  }
  function sourceLabel(lesson, short) {
    const src = lesson.source;
    if (typeof src === 'string') return src;
    if (!src) return '';
    if (src.kind === 'author') return ['Авторская задача', short ? '' : sourceReference(src.reference)].filter(Boolean).join(' · ');
    return [src.reference ? sourceReference(src.reference) : '', src.section, src.task ? '№ ' + src.task : '', src.page ? (short ? 'с. ' : 'печатная с. ') + src.page : '', !short && src.scanPage ? 'страница файла ' + src.scanPage : ''].filter(Boolean).join(' · ');
  }
  function lessonSkills(lesson) {
    const skills = lesson.skills || (lesson.skill ? [lesson.skill] : []);
    return (Array.isArray(skills) ? skills : [skills]).filter(Boolean).map(s => typeof s === 'string' ? skillMap.get(s) || s : s.label || s.title || s.id).filter(Boolean);
  }

  function el(tag, attrs, text, svg) {
    const n = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') n.className = v;
      else if (k === 'checked' && !svg) n.checked = !!v;
      else if (k === 'disabled' && !svg) n.disabled = !!v;
      else n.setAttribute(k, String(v));
    }
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function svgEl(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, String(v));
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function math(text) {
    const f = document.createDocumentFragment();
    const parts = String(text || '').split(/(\[\[frac:[^\[\]]+\|[^\[\]]+\]\]|\n)/g);
    for (const part of parts) {
      if (!part) continue;
      const match = part.match(/^\[\[frac:([^|]+)\|([^\]]+)\]\]$/);
      if (match) {
        const span = el('span', { class: 'fraction', role: 'math', 'aria-label': match[1] + ' делить на ' + match[2] });
        span.append(el('span', { class: 'numerator', 'aria-hidden': 'true' }, match[1]), el('span', { class: 'denominator', 'aria-hidden': 'true' }, match[2]));
        f.append(span);
      } else if (part === '\n') f.append(el('br'));
      else f.append(document.createTextNode(part));
    }
    return f;
  }
  function para(text, className) { const p = el('p', className ? { class: className } : {}); p.append(math(text)); return p; }
  function button(text, fn, cls, attrs) {
    const b = el('button', { type: 'button', ...(attrs || {}), ...(cls ? { class: cls } : {}) }, text);
    b.addEventListener('click', fn);
    return b;
  }
  function details(label, children, onOpen, open) {
    const d = el('details'); if (open) d.open = true;
    // A queued toggle from a replaced card must not update the new scene.
    d.addEventListener('toggle', event => { if (!d.isConnected) event.stopImmediatePropagation(); }, true);
    d.append(el('summary', {}, label));
    for (const child of children) d.append(child);
    if (onOpen) d.addEventListener('toggle', () => { if (d.open && !boardApplying) onOpen(); });
    return d;
  }
  function planesFor(lesson) {
    const f = (lesson.model.faces || []).map((face, i) => Array.isArray(face) ? { id: 'face-' + i, label: face.map(displayName).join(''), vertices: face } : face);
    const map = new Map(f.map(p => [p.id, p]));
    for (const p of lesson.model.planes || []) map.set(p.id, p);
    return map;
  }
  function samePlane(lesson, a, b) {
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    const pts = a.vertices.map(n => lesson.model.points[n]).filter(Boolean);
    const other = b.vertices.map(n => lesson.model.points[n]).filter(Boolean);
    if (pts.length < 3 || other.length < 3) return false;
    let normal = null;
    for (let i = 1; i < pts.length - 1; i++) {
      const n = cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0]));
      if (norm(n) > 1e-10) { normal = unit(n); break; }
    }
    if (!normal) return false;
    const scale = Math.max(1, ...pts.concat(other).map(p => norm(sub(p, pts[0]))));
    return other.every(p => Math.abs(dot(normal, sub(p, pts[0]))) < scale * 1e-8);
  }
  function knownNames(lesson, count) {
    const names = new Set((lesson.model.edges || []).flat().concat(lesson.model.given || []));
    lesson.steps.slice(0, count).forEach(step => {
      (step.points || []).forEach(n => names.add(n));
      (step.segments || []).forEach(line => { names.add(line.a); names.add(line.b); });
    });
    return names;
  }
  function choicePlanes(lesson, step, planes, count) {
    const known = knownNames(lesson, count);
    const candidates = Array.isArray(step.planeOptions) ? step.planeOptions.map(id => planes.get(id)).filter(Boolean) : [...planes.values()];
    return candidates.filter(p => p.vertices.every(n => known.has(n)));
  }
  function plannedAction(step, plane) {
    // The intended operation must be visible before a plane can be chosen.
    // Hide the expected plane's name if the author's wording repeats it.
    const text = String(step.action || '');
    const labels = [plane.label, ...(String(plane.label || '').match(/\([^()]+\)/g) || [])].filter(Boolean);
    return labels.reduce((out, name) => out.split(name).join('(название выбери ниже)'), text);
  }
  function numericValue(input) {
    const raw = String(input).trim().replace(/\s/g, '').replace(/,/g, '.').replace(/−/g, '-');
    const simple = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
    if (simple.test(raw)) return Number(raw);
    const pieces = raw.split('/');
    if (pieces.length === 2 && pieces.every(x => simple.test(x)) && Number(pieces[1]) !== 0) return Number(pieces[0]) / Number(pieces[1]);
    return NaN;
  }

  // This bounded personal activity never changes the shared-board work schema.
  // Its actions are separate from the retained guided steps and their evidence.
  const constructionIds = new Set(['starter', 'bridge'].flatMap(prefix =>
    [3, 6, 9, 12, 15, 18, 19, 20, 21, 22, 23, 24].map(n => prefix + '-' + String(n).padStart(2, '0'))));
  const supportsConstruction = id => !board && constructionIds.has(id) && lessonMap.has(id);
  function constructionTolerance(lesson) {
    return Math.max(1, ...Object.values(lesson.model.points).map(norm)) * 1e-7;
  }
  function nearPoint(a, b, eps) { return !!a && !!b && norm(sub(a, b)) <= eps; }
  function lineParameter(point, a, b, eps) {
    const direction = sub(b, a), length = norm(direction);
    if (length <= eps || norm(cross(sub(point, a), direction)) > eps * length) return null;
    return dot(sub(point, a), direction) / dot(direction, direction);
  }
  function planeNormal(lesson, plane) {
    const points = (plane?.vertices || []).map(n => lesson.model.points[n]).filter(Boolean);
    for (let i = 1; i + 1 < points.length; i++) {
      const normal = cross(sub(points[i], points[0]), sub(points[i + 1], points[0]));
      if (norm(normal) > constructionTolerance(lesson)) return { origin: points[0], normal: unit(normal) };
    }
    return null;
  }
  function inConstructionPlane(lesson, name, plane) {
    const p = lesson.model.points[name], basis = planeNormal(lesson, plane);
    return !!p && !!basis && Math.abs(dot(sub(p, basis.origin), basis.normal)) <= constructionTolerance(lesson);
  }
  function insideConstructionBody(lesson, point) {
    const center = mean([...new Set(lesson.model.edges.flat())].map(n => lesson.model.points[n]));
    return (lesson.model.faces || []).every(face => {
      const basis = planeNormal(lesson, Array.isArray(face) ? {vertices:face} : face);
      if (!basis) return false;
      const outward = dot(sub(center, basis.origin), basis.normal) > 0 ? mul(basis.normal, -1) : basis.normal;
      return dot(sub(point, basis.origin), outward) <= constructionTolerance(lesson);
    });
  }
  function intersectConstructionLines(a, b, c, d, eps) {
    const u = sub(b, a), v = sub(d, c), w = sub(c, a), normal = cross(u, v);
    if (norm(u) <= eps || norm(v) <= eps) return {code:'same-point'};
    if (norm(normal) <= eps * Math.max(norm(u), norm(v))) return {code:'parallel'};
    if (Math.abs(dot(w, unit(normal))) > eps) return {code:'skew'};
    const t = dot(cross(w, v), normal) / dot(normal, normal);
    return {point:add(a, mul(u, t))};
  }
  function constructionPlan(lesson) {
    if (!lesson || !constructionIds.has(lesson.id)) return [];
    const n = Number(lesson.id.split('-')[1]), starter = lesson.id.startsWith('starter-');
    return lesson.steps.map((step, index) => {
      const plan = {step:index, plane:step.plane};
      const segments = step.segments || [], target = (step.points || [])[0];
      if (!starter && [3,19].includes(n) && index === 1) return {...plan,kind:'parallel',target,
        trace:segments.find(line=>line.a===target||line.b===target),
        direction:lesson.steps.slice(0,index).reverse().flatMap(previous=>previous.segments||[]).find(line=>line.kind==='section'),
        prompt:'Выбери известную точку, направление параллельного следа и ребро, на котором появится новая вершина.'};
      if (target) {
        const referenceEdge = lesson.model.edges.find(([a,b]) => lineParameter(lesson.model.points[target], lesson.model.points[a], lesson.model.points[b], constructionTolerance(lesson)) !== null);
        return {...plan,kind:'intersection',target,referenceEdge:referenceEdge || null,
          prompt:'Выбери две прямые по двум известным точкам на каждой. Их общая точка должна выполнить цель этого шага.'};
      }
      if (!segments.length) {
        if (starter && [3,19].includes(n)) return {...plan,kind:'point',target:'M',prompt:'Выбери рабочую грань и отмеченную точку, которую нужно найти по условию.'};
        if (starter && [12,22].includes(n)) return {...plan,kind:'edge-point',target:'X',prompt:'Выбери соседнюю грань, общую точку и ребро, через которое переходим в эту грань.'};
        if (!starter && [9,21].includes(n)) return {...plan,kind:'plane',prompt:'Задай рабочую плоскость тремя уже известными точками. Они не должны лежать на одной прямой.'};
        const previous = lesson.steps.slice(0,index).reverse().flatMap(s => s.segments || []).find(s => s.kind === 'section');
        return {...plan,kind:'segment',segment:previous,line:false,prompt:'Выдели отрезок следа, лежащий внутри грани, и назови его роль.'};
      }
      return {...plan,kind:'segment',segment:segments[0],line:/прямую/.test(step.action || ''),
        prompt:starter && [9,21].includes(n) ? 'Построй ' + (index === 0 ? 'первую' : 'вторую') + ' диагональ, названную в условии: выбери два конца.' :
          'Выполни следующий шаг: выбери рабочую плоскость, две известные точки и роль линии.'};
    }).map(plan=>{
      const title={point:'Находим точку в грани','edge-point':'Переходим в соседнюю грань',plane:'Задаём рабочую плоскость',segment:'Выбираем линию и её роль',intersection:'Находим пересечение прямых',parallel:'Переносим параллельный след'}[plan.kind];
      let prompt=plan.prompt;
      // The short route specifies a geometric goal, so learners need not guess
      // an author's ordering. It does not supply endpoint names or line roles.
      if(plan.kind==='segment') {
        if(starter&&[15,23].includes(n))prompt=[
          'Начни обход с отмеченной точки на боковом ребре. Первую линию проведи в грани, содержащей ребро AB.',
          'Продолжи обход по основанию, не возвращаясь к начальной точке.',
          'Замкни обход через оставшуюся грань.'
        ][plan.step]+' Выбери плоскость, концы и роль линии.';
        if(starter&&[18,24].includes(n))prompt=(plan.step===0?'Начни обход с отмеченной точки на ребре AE и двигайся сначала к ребру BF.':plan.step===3?'Замкни обход через последнюю боковую грань.':'Продолжи обход по боковым граням в том же направлении, не возвращаясь по уже проведённой линии.')+' Выбери плоскость, концы и роль линии.';
        if(!starter&&[3,19].includes(n))prompt='Сначала проведи линию в боковой грани, содержащей рёбра BF и CG. Выбери плоскость, концы и роль линии.';
        if(!starter&&[9,21].includes(n)&&plan.step===0)prompt='Начни с диагонали основания, лежащей в плоскости, названной в условии. Выбери плоскость, концы и роль линии.';
        if(!starter&&[12,22].includes(n))prompt=(plan.step===0?'Сначала проведи опорную прямую из условия, на которой лежит внутренняя точка.':'Теперь проведи прямую, пересечение которой с ребром требуется найти.')+' Выбери плоскость, концы и роль линии.';
        if(!starter&&[15,23].includes(n))prompt=[
          'Сначала соедини заданные проекции в основании.',
          'В заданной рабочей плоскости соедини первую внутреннюю точку с её проекцией.',
          'Покажи связь второй внутренней точки с её проекцией.',
          'Соедини внутренние точки, принадлежность которых рабочей плоскости уже установлена.'
        ][plan.step]+' Выбери плоскость, концы и роль линии.';
        if(!starter&&[18,24].includes(n)&&plan.step>=3)prompt=(plan.step===3?'От новой точки на ребре основания перейди по соседней боковой грани к уже известной точке среза.':'Замкни оставшуюся часть обхода.')+' Выбери плоскость, концы и роль линии.';
      }
      return {...plan,title,prompt};
    });
  }
  function constructionFields(plan) {
    if (plan.kind === 'point') return ['point'];
    if (plan.kind === 'edge-point') return ['point','edgeA','edgeB'];
    if (plan.kind === 'plane') return ['a','b','c'];
    if (plan.kind === 'parallel') return ['point','directionA','directionB','edgeA','edgeB'];
    if (plan.kind === 'intersection') return ['firstA','firstB','secondA','secondB'];
    return ['a','b'];
  }
  function validateConstructionAction(lesson, index, selection) {
    const plan = constructionPlan(lesson)[index], fail = (code,message) => ({correct:false,code,message});
    if (!plan || !selection || typeof selection !== 'object') return fail('missing','Выбери элементы текущего действия.');
    const known = knownNames(lesson,index), points = lesson.model.points, eps = constructionTolerance(lesson), fields = constructionFields(plan);
    if (!selection.plane || fields.some(key => !known.has(selection[key]))) return fail('missing','Выбери рабочую плоскость и заполни каждый выбор известными точками. Новую точку сначала нужно построить.');
    const planes = planesFor(lesson), plane = planes.get(selection.plane);
    if (!plane || !plane.vertices.every(name => known.has(name)) || !samePlane(lesson,plane,planes.get(plan.plane)))
      return fail('plane','Эта плоскость не выполняет цель текущего шага. Проверь нужные точки и переход на соседнюю грань; совпадение линий на экране недостаточно.');
    const inPlane = names => names.every(name => inConstructionPlane(lesson,name,plane));
    const bodyEdge = (a,b) => lesson.model.edges.some(([x,y]) => (nearPoint(points[a],points[x],eps) && nearPoint(points[b],points[y],eps)) || (nearPoint(points[a],points[y],eps) && nearPoint(points[b],points[x],eps)));
    const wrongPlane = () => fail('different-plane','Выбранные точки не лежат в одной рабочей плоскости. Проверь их принадлежность грани, а не только расположение на картинке.');
    if (plan.kind === 'point' || plan.kind === 'edge-point') {
      if (!inPlane(fields.map(k=>selection[k]))) return wrongPlane();
      if (!nearPoint(points[selection.point],points[plan.target],eps)) return fail('point','Это другая точка. Найди точку, о которой говорится в текущем действии.');
      if (plan.kind === 'edge-point') {
        if (!bodyEdge(selection.edgeA,selection.edgeB)) return fail('edge','Это не ребро тела. Общее ребро соседних граней выбирается по двум его вершинам.');
        const t=lineParameter(points[selection.point],points[selection.edgeA],points[selection.edgeB],eps);
        if (t === null || t < -eps || t > 1+eps) return fail('finite-edge','Точка не принадлежит выбранному конечному ребру. Продолжение ребра и само ребро нужно различать.');
      }
    } else if (plan.kind === 'plane') {
      if (!inPlane(fields.map(k=>selection[k]))) return wrongPlane();
      if (norm(cross(sub(points[selection.b],points[selection.a]),sub(points[selection.c],points[selection.a]))) <= eps)
        return fail('collinear','Три точки на одной прямой не задают единственную плоскость. Нужна третья точка вне этой прямой.');
    } else if (plan.kind === 'segment') {
      const a=points[selection.a],b=points[selection.b],target=plan.segment;
      if (nearPoint(a,b,eps)) return fail('same-point','Для линии нужны две различные точки.');
      if (!inPlane([selection.a,selection.b])) return wrongPlane();
      if (!['helper','section'].includes(selection.role)) return fail('role','Укажи роль: вспомогательная линия или сторона сечения.');
      if (selection.role === 'section' && (!insideConstructionBody(lesson,a) || !insideConstructionBody(lesson,b)))
        return fail('outside-body','Внешняя точка может помогать построению, но не входит в сторону сечения внутри тела. Отдели след от его части в грани.');
      if (selection.role !== (target.kind || 'section')) return fail('role',target.kind === 'helper' ? 'Эта линия нужна для построения. Она не является стороной полного сечения.' : 'Здесь строится часть границы сечения. Вспомогательные линии выделяются отдельно.');
      const ta=points[target.a],tb=points[target.b];
      const equivalent=plan.line ? lineParameter(ta,a,b,eps)!==null && lineParameter(tb,a,b,eps)!==null :
        (nearPoint(a,ta,eps)&&nearPoint(b,tb,eps))||(nearPoint(a,tb,eps)&&nearPoint(b,ta,eps));
      if (!equivalent) return fail('goal','В этой плоскости такую линию провести можно, но она не выполняет текущую цель. Сверь нужные концы с условием и уже найденными точками.');
    } else {
      let intersection;
      if (plan.kind === 'parallel') {
        const origin=points[selection.point],direction=sub(points[selection.directionB],points[selection.directionA]);
        if (!bodyEdge(selection.edgeA,selection.edgeB)) return fail('edge','Выбери именно ребро тела по его двум вершинам.');
        if (!inPlane([selection.point,selection.edgeA,selection.edgeB])) return wrongPlane();
        const basis=planeNormal(lesson,plane);
        if (norm(direction)<=eps) return fail('same-point','Направление задаётся двумя различными точками.');
        if (Math.abs(dot(direction,basis.normal))>eps) return fail('parallel-plane','Это направление выходит из выбранной плоскости. Для переноса параллельного следа нужно обосновать параллельность граней.');
        if (!plan.trace || lineParameter(origin,points[plan.trace.a],points[plan.trace.b],eps)===null)
          return fail('parallel-origin','Через эту точку нельзя перенести нужный след: она не принадлежит секущей в выбранной грани. Найди уже известную общую точку этих плоскостей.');
        const reference=plan.direction&&sub(points[plan.direction.b],points[plan.direction.a]);
        if (!reference || norm(cross(unit(direction),unit(reference)))>1e-7)
          return fail('parallel-direction','Выбранное направление не параллельно уже построенному следу в противоположной грани. Совпадение точки встречи само по себе не обосновывает перенос.');
        intersection=intersectConstructionLines(origin,add(origin,direction),points[selection.edgeA],points[selection.edgeB],eps);
        if (intersection.point) {
          const t=lineParameter(intersection.point,points[selection.edgeA],points[selection.edgeB],eps);
          if(t===null || t < -eps || t > 1+eps)return fail('finite-edge','Прямая встретила продолжение, а требуется точка на конечном ребре. Проверь направление и выбранное ребро.');
        }
      } else {
        intersection=intersectConstructionLines(points[selection.firstA],points[selection.firstB],points[selection.secondA],points[selection.secondB],eps);
        if (intersection.code==='skew') return fail('skew','Прямые скрещиваются: их изображения могут пересекаться на экране, но общей пространственной точки нет.');
        if (!inPlane(fields.map(k=>selection[k]))) return wrongPlane();
      }
      if(intersection.code==='same-point')return fail('same-point','Каждая прямая задаётся двумя различными точками.');
      if(intersection.code==='parallel')return fail('parallel','Параллельные или совпадающие прямые не дают единственной общей точки. Выбери две пересекающиеся прямые.');
      if(intersection.code==='skew')return fail('skew','Выбранные прямые скрещиваются и не имеют общей точки.');
      if(!nearPoint(intersection.point,points[plan.target],eps))return fail('intersection','Общая точка этих прямых не выполняет цель шага. Проверь, какие объекты связывают данные точки с нужной гранью или ребром.');
      if(plan.referenceEdge) {
        const [a,b]=plan.referenceEdge,t=lineParameter(intersection.point,points[a],points[b],eps),location=t>=-eps&&t<=1+eps?'edge':'extension';
        if(!['edge','extension'].includes(selection.location))return fail('location','Укажи, находится новая точка на ребре или на его продолжении.');
        if(selection.location!==location)return fail('finite-edge',location==='extension'?'Точка находится за концом ребра. Она принадлежит его прямой, но не конечному ребру.':'Точка лежит между концами ребра, включая его концы. Здесь продолжать ребро за вершину не требуется.');
      }
    }
    return {correct:true,code:'accepted',message:'Действие проверено по пространственным координатам. Теперь объясни, почему оно допустимо.'};
  }
  function constructionDrawingStep(lesson,action) {
    const plan=constructionPlan(lesson)[action.step],selection=action.selection,points=lesson.model.points;
    const drawing={plane:selection.plane,points:[],segments:[]};
    if(plan.kind==='segment')drawing.segments.push({a:selection.a,b:selection.b,kind:selection.role});
    else if(plan.kind==='parallel') {
      drawing.points.push(plan.target);drawing.segments.push({a:selection.point,b:plan.target,kind:'section'});
    } else if(plan.kind==='intersection') {
      drawing.points.push(plan.target);
      for(const [a,b] of [[selection.firstA,selection.firstB],[selection.secondA,selection.secondB]]) {
        // Draw the chosen line only as an auxiliary construction. Its finite
        // section part requires a separate accepted endpoint/role choice.
        const names=[a,b,plan.target],direction=sub(points[b],points[a]);
        names.sort((x,y)=>dot(sub(points[x],points[a]),direction)-dot(sub(points[y],points[a]),direction));
        drawing.segments.push({a:names[0],b:names[names.length-1],kind:'helper'});
      }
    }
    return drawing;
  }
  function constructionActionText(lesson,action) {
    const plan=constructionPlan(lesson)[action.step],s=action.selection,name=displayName,pair=(a,b)=>name(s[a])+name(s[b]);
    if(plan.kind==='point')return 'Отмечена точка '+name(s.point)+' в выбранной грани.';
    if(plan.kind==='edge-point')return 'Точка '+name(s.point)+' принадлежит ребру '+pair('edgeA','edgeB')+' выбранной грани.';
    if(plan.kind==='plane')return 'Рабочая плоскость задана неколлинеарными точками '+[s.a,s.b,s.c].map(name).join(', ')+'.';
    if(plan.kind==='segment')return 'Построена '+(s.role==='section'?'сторона сечения ':'вспомогательная линия ')+pair('a','b')+'.';
    if(plan.kind==='parallel')return 'Через '+name(s.point)+' проведена прямая, параллельная '+pair('directionA','directionB')+'. Её пересечение с ребром '+pair('edgeA','edgeB')+' обозначено '+name(plan.target)+'.';
    return 'Найдена точка '+name(plan.target)+' пересечения выбранных прямых '+pair('firstA','firstB')+' и '+pair('secondA','secondB')+'.'+(s.location==='extension'?' Она лежит на продолжении ребра.':s.location==='edge'?' Она лежит на конечном ребре.':'');
  }
  function validateConstructionBoundary(lesson,names) {
    if(!lesson)return {correct:false,code:'unknown',message:'Карточка для проверки не найдена.'};
    const expected=lesson.result?.polygon,fail=(code,message)=>({correct:false,code,message}),eps=constructionTolerance(lesson);
    if(!expected?.length)return {correct:true,code:'not-required'};
    if(!Array.isArray(names)||names.length<3)return fail('incomplete','Граница пока не замкнута: нужны все её вершины в последовательном порядке.');
    if(new Set(names).size!==names.length||names.some(n=>!lesson.model.points[n]))return fail('duplicate','Вершину отмечаем один раз; последняя сторона замыкается к первой автоматически.');
    if(names.some(n=>!insideConstructionBody(lesson,lesson.model.points[n])))return fail('outside-body','Внешняя вспомогательная точка не входит в границу сечения.');
    if(names.length!==expected.length||names.some(n=>!expected.some(e=>nearPoint(lesson.model.points[n],lesson.model.points[e],eps))))
      return fail('incomplete','Граница неполна или содержит лишнюю точку. Проследи переход между соседними гранями.');
    const same=(a,b)=>nearPoint(lesson.model.points[a],lesson.model.points[b],eps),start=expected.findIndex(e=>same(e,names[0]));
    if(![1,-1].some(direction=>names.every((n,i)=>same(n,expected[(start+direction*i+expected.length)%expected.length]))))
      return fail('order','Такой порядок соединяет несоседние вершины. Обойди границу по сторонам, не пересекая внутренность сечения.');
    return {correct:true,code:'closed',message:'Граница замкнута; лишних или пропущенных вершин нет. Обход в обратную сторону также допустим.'};
  }

  let stored = {};
  let storageFailed = false;
  try { stored = JSON.parse(storage.getItem(KEY) || '{}'); } catch (_) { stored = {}; }
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};
  let current = C.lessons[0].id;
  try { const h = decodeURIComponent(location.hash.slice(1)); if (lessonMap.has(h)) current = h; else if (lessonMap.has(stored.current)) current = stored.current; } catch (_) {}
  const state = { version: 1, current, tasks: stored.tasks && typeof stored.tasks === 'object' && !Array.isArray(stored.tasks) ? stored.tasks : {} };
  let catalogFilter = '';
  let catalogQuery = '';
  let catalogLevel = '';
  let catalogOrigin = '';
  let catalogOpen = window.innerWidth > 760;
  let renderer = null;
  let currentMain = null;
  let catalogList = null;
  let catalogCount = null;
  let live = null;
  let frame = null;
  let lastRenderedId = null;
  let avoidHash = false;

  function taskState(lesson) {
    let s = state.tasks[lesson.id];
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      s = state.tasks[lesson.id] = board ? {} : { attemptEvidenceVersion: 1, mistakes: 0 };
    }
    // Older records mixed mistakes and opened help. Never upgrade that history
    // into independent work. Personal evidence does not enter the board schema.
    if (!board && s.attemptEvidenceVersion === 1) {
      s.mistakes = Number.isInteger(s.mistakes) ? clamp(s.mistakes, 0, 1000000) : 0;
      if (!['first', 'corrected'].includes(s.choiceEvidence)) delete s.choiceEvidence;
      if (!s.choiceEvidence || !Number.isSafeInteger(s.choiceEvidenceAt) || s.choiceEvidenceAt <= 0) delete s.choiceEvidenceAt;
    }
    s.mode = ['choose', 'study', 'practice'].includes(s.mode) ? s.mode : 'choose';
    s.revealed = Number.isInteger(s.revealed) ? clamp(s.revealed, 0, lesson.steps.length) : 0;
    s.viewCount = Number.isInteger(s.viewCount) ? clamp(s.viewCount, 0, s.revealed) : s.revealed;
    s.approved = s.approved === s.revealed ? s.approved : -1;
    s.questionApproved = s.questionApproved === s.revealed ? s.questionApproved : -1;
    s.questionAttempts = s.questionAttempts && typeof s.questionAttempts === 'object' && !Array.isArray(s.questionAttempts) ? s.questionAttempts : {};
    s.planeAttempts = s.planeAttempts && typeof s.planeAttempts === 'object' && !Array.isArray(s.planeAttempts) ? s.planeAttempts : {};
    s.calculationRevealed = Number.isInteger(s.calculationRevealed) ? clamp(s.calculationRevealed, 0, (lesson.calculationSteps || []).length) : 0;
    s.calculationSeen = !!s.calculationSeen;
    s.helpUsed = !!s.helpUsed; s.workedSeen = !!s.workedSeen; s.resultSeen = !!s.resultSeen;
    s.theoryOpen = !!s.theoryOpen;
    s.notesOpen = !!s.notesOpen;
    s.justBuilt = !!s.justBuilt && s.revealed > 0;
    s.showResult = !!s.showResult && s.revealed === lesson.steps.length && s.calculationRevealed === (lesson.calculationSteps || []).length;
    s.draft = typeof s.draft === 'string' ? s.draft.slice(0, board ? 2000 : 30000) : '';
    s.draftOpen = !!s.draftOpen;
    s.glossaryOpen = !!s.glossaryOpen;
    s.answer = typeof s.answer === 'string' ? s.answer.slice(0, 120) : '';
    s.answerChecked = !!s.answerChecked;
    s.correctAnswer = !!s.correctAnswer;
    s.answerInvalid = !!s.answerInvalid && !s.answerChecked;
    s.selectedCheck = Number.isInteger(s.selectedCheck) ? s.selectedCheck : -1;
    s.checkCorrect = !!s.checkCorrect;
    s.proofChecks = Array.isArray(s.proofChecks) ? Array.from({length:(lesson.proofChecklist || []).length}, (_, index) => !!s.proofChecks[index]) : (lesson.proofChecklist || []).map(() => false);
    s.independentSteps = Number.isInteger(s.independentSteps) ? clamp(s.independentSteps, 0, lesson.steps.length) : 0;
    s.hints = Array.isArray(s.hints) ? s.hints.filter(Number.isInteger) : [];
    s.helpReasons = Array.isArray(s.helpReasons) ? s.helpReasons.filter(x => typeof x === 'string').slice(board ? -24 : -100) : [];
    s.hintOpen = s.hintOpen && typeof s.hintOpen === 'object' && !Array.isArray(s.hintOpen) ? s.hintOpen : {};
    s.showHelpers = s.showHelpers !== false;
    s.cleanView = !!s.cleanView;
    s.planeView = !!s.planeView;
    const initial = lesson.model.initialCamera || { yaw: -.65, pitch: .46 };
    s.camera = s.camera && Number.isFinite(s.camera.yaw) && Number.isFinite(s.camera.pitch) ? { yaw: board ? wrapYaw(s.camera.yaw) : s.camera.yaw, pitch: clamp(s.camera.pitch, -1.45, 1.45) } : { ...initial };
    if (!board && supportsConstruction(lesson.id) && s.construction) constructionState(lesson,s);
    return s;
  }
  function constructionState(lesson,s,create=false) {
    if (!supportsConstruction(lesson.id)) return null;
    let work=s.construction;
    if (!work || typeof work!=='object' || Array.isArray(work) || work.version!==1) {
      if(!create)return null;
      work=s.construction={version:1,active:false,actions:[],selection:{},mistakes:0,history:[],boundarySelection:[],selectedCheck:-1};
    }
    const plan=constructionPlan(lesson),actions=[];
    for(const old of (Array.isArray(work.actions)?work.actions:[]).slice(0,plan.length)) {
      const index=actions.length;
      if(!old || old.step!==index || !validateConstructionAction(lesson,index,old.selection).correct)break;
      const keys=['plane',...constructionFields(plan[index]),'role','location'],selection={};
      keys.forEach(key=>{if(typeof old.selection[key]==='string')selection[key]=old.selection[key];});
      actions.push({step:index,selection});
    }
    work.actions=actions;work.active=work.active===true;
    work.selection=work.selection && typeof work.selection==='object' && !Array.isArray(work.selection)?Object.fromEntries(Object.entries(work.selection).filter(([key,value])=>['plane','point','a','b','c','firstA','firstB','secondA','secondB','directionA','directionB','edgeA','edgeB','role','location'].includes(key)&&typeof value==='string'&&value.length<80)):{};
    work.mistakes=Number.isSafeInteger(work.mistakes)?clamp(work.mistakes,0,1000000):0;
    work.helpUsed=!!work.helpUsed || s.helpUsed || s.workedSeen || s.resultSeen || s.calculationSeen || s.revealed>0 || s.approved>=0 || s.questionApproved>=0;
    work.history=Array.isArray(work.history)?work.history.slice(-50):[];
    work.boundarySelection=Array.isArray(work.boundarySelection)?work.boundarySelection.filter(name=>typeof name==='string'&&knownNames(lesson,actions.length).has(name)).slice(0,30):[];
    work.boundaryConfirmed=work.boundaryConfirmed===true && actions.length===plan.length && validateConstructionBoundary(lesson,work.boundarySelection).correct;
    work.selectedCheck=Number.isInteger(work.selectedCheck)&&work.selectedCheck>=0&&work.selectedCheck<(lesson.check?.options.length||0)?work.selectedCheck:-1;
    work.justBuilt=!!work.justBuilt && actions.length>0 && actions.length<plan.length;
    work.feedback=work.feedback && typeof work.feedback.message==='string'?{correct:work.feedback.correct===true,code:String(work.feedback.code||'').slice(0,40),message:work.feedback.message.slice(0,600)}:null;
    if(!['first','corrected'].includes(work.evidence)||!Number.isSafeInteger(work.evidenceAt)||work.evidenceAt<=0){delete work.evidence;delete work.evidenceAt;}
    work.completed=actions.length===plan.length && (!lesson.result?.polygon?.length || work.boundaryConfirmed) && (!lesson.check || work.selectedCheck===lesson.check.correct);
    return work;
  }
  function startConstruction(id=state.current) {
    if(!supportsConstruction(id))return false;
    if(state.current!==id)switchLesson(id,false);
    const lesson=lessonMap.get(id),s=taskState(lesson),work=constructionState(lesson,s,true);
    if (s.recall) s.recall.open=false;
    work.active=true;save();renderLesson();return true;
  }
  function undoConstruction(lesson,s) {
    const work=constructionState(lesson,s);
    if(!work?.actions.length)return;
    const action=work.actions.pop();
    work.history.push({kind:'undo',action,at:Date.now()});
    work.selection={};work.justBuilt=false;work.boundarySelection=[];work.boundaryConfirmed=false;work.selectedCheck=-1;work.feedback=null;
    save();renderLesson();announce('Последнее самостоятельное действие отменено. Прежний результат и отметки помощи сохранены.');
  }
  function save(recordCompletion = false) {
    // Keep an earned result when the learner later compares it with a worked
    // solution or repeats the card. Only actual completed, unassisted choices
    // in this version can earn it; proof and freehand work remain separate.
    if (!board) {
      const lesson = lessonMap.get(state.current), s = state.tasks[state.current];
      const construction=lesson && s ? constructionState(lesson,s) : null;
      if(construction?.completed && !construction.helpUsed && !construction.evidence) {
        construction.evidence=construction.mistakes?'corrected':'first';construction.evidenceAt=Date.now();
      }
      if (lesson && s && !construction?.active && s.attemptEvidenceVersion === 1 && !s.choiceEvidence && s.mode === 'practice' &&
          guidanceFor(lesson)?.phase !== 'guided' && s.revealed === lesson.steps.length &&
          s.independentSteps === lesson.steps.length && !s.helpUsed && !s.workedSeen && !s.resultSeen &&
          !s.calculationSeen && !s.calculationRevealed &&
          (!lesson.check || (s.checkCorrect && s.selectedCheck === lesson.check.correct)) &&
          (!lesson.result?.numeric || (s.answerChecked && s.correctAnswer))) {
        s.choiceEvidence = s.mistakes > 0 ? 'corrected' : 'first';
        if (recordCompletion) s.choiceEvidenceAt = Date.now();
      }
    }
    try { storage.setItem(KEY, JSON.stringify(state)); }
    catch (_) {
      if (!storageFailed) {
        storageFailed = true;
        const alert = para('Браузер не разрешил сохранить прогресс. Пока эта вкладка открыта, ответы и шаги сохраняются в ней.', 'storage-alert');
        alert.setAttribute('role', 'status'); host.prepend(alert);
      }
    }
  }
  function announce(text) { if (live) live.textContent = text; }
  function beginAttempt(s) {
    // The old catalog precreated empty records for every card. Starting one of
    // those is a new attempt; completed/started history is never reclassified.
    if (board || s.attemptEvidenceVersion === 1 || s.mode !== 'choose' || s.revealed ||
        s.workedSeen || s.helpUsed || s.resultSeen || s.calculationSeen || s.calculationRevealed ||
        s.independentSteps || s.answer || s.answerChecked || s.selectedCheck >= 0 || s.draft ||
        s.theoryOpen || s.notesOpen || s.hints.length || s.helpReasons.length || s.proofChecks.some(Boolean) ||
        Object.keys(s.planeAttempts).length || Object.keys(s.questionAttempts).length ||
        Object.values(s.hintOpen).some(Boolean)) return;
    s.attemptEvidenceVersion = 1; s.mistakes = 0;
  }
  function markMistake(lesson, s) {
    if (!board && s.attemptEvidenceVersion === 1) s.mistakes = Math.min(1000000, s.mistakes + 1);
    save(); refreshStatus(lesson, s); renderCatalog();
  }
  function markHelp(id, reason) {
    const lesson = lessonMap.get(id); if (!lesson) return false;
    const s = taskState(lesson); s.helpUsed = true;
    if (typeof reason === 'string' && reason.trim() && !s.helpReasons.includes(reason)) s.helpReasons.push(reason.slice(0, 300));
    save(); refreshStatus(lesson, s); renderCatalog(); return true;
  }
  function statusText(s, lesson) {
    if (s.revealed === lesson.steps.length && s.revealed > 0) {
      if(s.calculationRevealed<(lesson.calculationSteps || []).length)return s.helpUsed?'Построено с подсказкой':'Построение завершено';
      if (s.helpUsed) return 'Разобрано с подсказкой';
      if (s.workedSeen || s.resultSeen) return 'Разобрано';
      return !board && s.attemptEvidenceVersion === 1 && s.mistakes > 0 ? 'Построено после своих исправлений' : 'Построение выполнено';
    }
    if (s.mode === 'practice' && guidanceFor(lesson)?.phase === 'guided') return 'Пробуем с опорой';
    if (s.mode === 'practice' && (s.workedSeen || s.helpUsed || s.resultSeen)) return 'Проверка после помощи';
    if (s.mode === 'practice') return !board && s.attemptEvidenceVersion === 1 && s.mistakes > 0 ? 'Исправляю самостоятельно' : 'Самостоятельная попытка';
    if (s.mode === 'study') return 'Разбор по шагам';
    return 'Выбери способ работы';
  }
  function modeNote(s, lesson) {
    if (guidanceFor(lesson)) {
      if (s.mode === 'study') return 'Сначала смотрим вместе. Затем будет другой пример для твоей попытки.';
      if (guidanceFor(lesson).phase === 'guided') return 'В этой попытке есть опора. В следующем примере попробуем без неё.';
      return (s.workedSeen || s.helpUsed || s.resultSeen) ? 'Помощь сохранена. После разбора возьмём новый пример.' : 'Новый пример. Назови плоскость и объясни свой выбор.';
    }
    if (s.mode !== 'practice') return 'Разбор показывает основания построения. Его просмотр не считается самостоятельным решением.';
    return (s.workedSeen || s.helpUsed || s.resultSeen) ? 'Эта попытка идёт после разбора или помощи. Для независимой проверки выбери новую аналогичную задачу.' : 'Самостоятельная попытка: выбирай плоскость и объясняй каждый шаг. Подсказку можно открыть в любой момент; её использование сохранится.';
  }
  function refreshStatus(lesson, s) {
    if (lesson.id !== state.current) return;
    const badge = document.querySelector('.learning-status'); if (badge) badge.textContent = statusText(s, lesson);
    const note = document.querySelector('.mode-note'); if (note) note.textContent = modeNote(s, lesson);
  }
  function boardLink(lesson) {
    const origin = /^https?:$/.test(location.protocol) ? location.origin : 'https://mathexam.space';
    const target = new URL('/trainers/trainer-board.html', origin);
    target.searchParams.set('trainer', '/trainers/sections-from-zero.html#' + encodeURIComponent(lesson.id));
    const link = el('a', {
      class: 'sections-board-open', href: target.href, 'data-sections-board-open': '',
      title: 'Открыть это задание рядом с доской'
    }, 'На доску →');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      // A course opened over an existing board returns to that same room.
      // Only the public card ID is offered; personal work and cabinet routes
      // never become board state or URL parameters.
      const request = new CustomEvent('sections:board-request', { cancelable: true, detail: { lessonId: lesson.id } });
      if (!window.dispatchEvent(request)) event.preventDefault();
    });
    return link;
  }
  function switchLesson(id, moveFocus) {
    if (!lessonMap.has(id)) return;
    if (board && id !== state.current) state.tasks = {};
    state.current = id; save();
    try { avoidHash = true; history.replaceState(null, '', '#' + encodeURIComponent(id)); } catch (_) { location.hash = encodeURIComponent(id); }
    avoidHash = false;
    renderLesson(); renderCatalog();
    if (moveFocus) {
      const target = document.getElementById('lesson-title');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }
  window.addEventListener('hashchange', () => {
    if (avoidHash) return;
    try { const id = decodeURIComponent(location.hash.slice(1)); if (lessonMap.has(id) && id !== state.current) switchLesson(id, !board); } catch (_) {}
  });

  class Scene {
    constructor(container, lesson, onCamera) {
      this.lesson = lesson; this.data = lesson.model; this.onCamera = typeof onCamera === 'function' ? onCamera : () => {};
      this.planes = planesFor(lesson); this.faces = [...this.planes.values()].filter(p => (this.data.faces || []).some(f => f.id === p.id));
      if (!this.faces.length) this.faces = (this.data.faces || []).map((f, i) => Array.isArray(f) ? { id: 'face-' + i, vertices: f } : f);
      this.bodyNames = [...new Set((this.data.edges || []).flat().concat(this.faces.flatMap(f => f.vertices || [])))];
      this.bodyCenter = mean(this.bodyNames.map(n => this.data.points[n]).filter(Boolean));
      this.bodyRadius = Math.max(1e-4, ...this.bodyNames.map(n => norm(sub(this.data.points[n], this.bodyCenter))));
      this.adjacency = new Map();
      this.faceInfo = this.faces.map((face, index) => {
        const pts = face.vertices.map(n => this.data.points[n]);
        const n = this.normal(pts); const center = mean(pts);
        const outward = dot(n, sub(center, this.bodyCenter)) < 0 ? mul(n, -1) : n;
        face.vertices.forEach((v, i) => { const key = edgeKey(v, face.vertices[(i + 1) % face.vertices.length]); if (!this.adjacency.has(key)) this.adjacency.set(key, []); this.adjacency.get(key).push(index); });
        return { ...face, normal: outward, center };
      });
      // For convex solids, two endpoints on a finite face determine a side on it.
      // A point on an extension can satisfy its plane equation outside the solid.
      this.pointFaces = new Map();
      const epsilon = this.bodyRadius * 1e-7;
      for (const [name, point] of Object.entries(this.data.points)) {
        const distances = this.faceInfo.map(face => dot(face.normal, sub(point, face.center)));
        const faces = distances.some(d => d > epsilon) ? [] :
          this.faceInfo.filter((face, i) => Math.abs(distances[i]) <= epsilon);
        this.pointFaces.set(name, faces);
      }
      this.svg = svgEl('svg', { class: 'model-svg', viewBox: '0 0 600 420', tabindex: 0, role: 'img', 'aria-label': 'Пространственная модель. Стрелки поворачивают, Home возвращает исходный вид.' });
      container.append(this.svg);
      this.width = 600; this.height = 420; this.current = null; this.drag = null; this.raf = null; this.labelMetrics = new Map();
      this.svg.addEventListener('pointerdown', e => {
        if (this.current?.planeView) return;
        this.drag = { x: e.clientX, y: e.clientY, yaw: this.current.camera.yaw, pitch: this.current.camera.pitch, id: e.pointerId };
        this.svg.setPointerCapture(e.pointerId);
      });
      this.svg.addEventListener('pointermove', e => {
        if (!this.drag || this.drag.id !== e.pointerId) return;
        this.current.camera.yaw = this.drag.yaw + (e.clientX - this.drag.x) * .008;
        this.current.camera.pitch = clamp(this.drag.pitch - (e.clientY - this.drag.y) * .006, -1.45, 1.45);
        if (board) this.onCamera({ ...this.current.camera, yaw: wrapYaw(this.current.camera.yaw) });
        this.requestDraw();
      });
      const release = e => { if (this.drag && this.drag.id === e.pointerId) { this.drag = null; this.onCamera({ ...this.current.camera }); } };
      this.svg.addEventListener('pointerup', release); this.svg.addEventListener('pointercancel', release);
      this.svg.addEventListener('keydown', e => {
        const turns = { ArrowLeft: [-.16, 0], ArrowRight: [.16, 0], ArrowUp: [0, .12], ArrowDown: [0, -.12] };
        if (turns[e.key]) { e.preventDefault(); this.turn(...turns[e.key]); }
        if (e.key === 'Home') { e.preventDefault(); this.reset(); }
      });
      this.observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.resize()) : null;
      this.observer?.observe(this.svg); this.resize();
    }
    normal(pts) {
      for (let i = 1; i < pts.length - 1; i++) { const n = cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0])); if (norm(n) > 1e-10) return unit(n); }
      return [0, 0, 1];
    }
    resize() {
      this.width = Math.max(220, this.svg.clientWidth || 600); this.height = this.svg.clientHeight || 420;
      this.labelMetrics.clear();
      this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`); this.requestDraw();
    }
    requestDraw() { if (this.raf !== null) return; this.raf = requestAnimationFrame(() => { this.raf = null; this.draw(); }); }
    destroy() { this.observer?.disconnect(); if (this.raf !== null) cancelAnimationFrame(this.raf); }
    update(current) { this.current = current; this.svg.classList.toggle('plane-view', !!current.planeView); this.draw(); }
    turn(yaw, pitch) {
      if (!this.current || this.current.planeView) return;
      this.current.camera.yaw += yaw; this.current.camera.pitch = clamp(this.current.camera.pitch + pitch, -1.45, 1.45);
      this.onCamera({ ...this.current.camera }); this.draw();
    }
    reset() {
      if (!this.current) return;
      this.current.camera = { ...(this.data.initialCamera || { yaw: -.65, pitch: .46 }) };
      this.onCamera({ ...this.current.camera }); this.draw();
    }
    measureLabel(label, focused) {
      const key = (focused ? 'focus|' : 'normal|') + label;
      if (this.labelMetrics.has(key)) return this.labelMetrics.get(key);
      const probe = svgEl('text', { x: 0, y: 0, class: 'model-label' + (focused ? ' focused' : ''), opacity: 0, 'aria-hidden': 'true' }, label);
      this.svg.append(probe);
      const style = getComputedStyle(probe);
      const box = probe.getBBox();
      let metrics = { x: box.x, y: box.y, width: box.width, height: box.height };
      // getBBox measures the actual SVG font, including Unicode subscripts.
      // A detached/hidden portal may have no SVG box yet; Canvas uses the same font.
      if (!(metrics.width > 0 && metrics.height > 0)) {
        const context = document.createElement('canvas').getContext('2d');
        context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(' ');
        const m = context.measureText(label), size = parseFloat(style.fontSize) || 20;
        metrics = { x: -(m.actualBoundingBoxLeft || 0), y: -(m.actualBoundingBoxAscent || size), width: Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0)), height: (m.actualBoundingBoxAscent || size) + (m.actualBoundingBoxDescent || size * .2) };
      }
      probe.remove(); this.labelMetrics.set(key, metrics); return metrics;
    }
    draw() {
      if (!this.current) return;
      const c = this.current, points = this.data.points, steps = c.construction ? c.constructionSteps || [] : this.lesson.steps;
      const plane = c.planeId ? this.planes.get(c.planeId) : null;
      const planePts = plane ? plane.vertices.map(n => points[n]).filter(Boolean) : [];
      const nPlane = planePts.length > 2 ? this.normal(planePts) : null;
      const originPlane = planePts[0] || [0, 0, 0];
      const inPlane = p => !nPlane || Math.abs(dot(nPlane, sub(p, originPlane))) < this.bodyRadius * 1e-7;
      const flat = c.planeView && !!nPlane;
      let known = new Set([...this.bodyNames, ...(this.data.given || [])]);
      let segments = [];
      for (let i = 0; i < c.viewCount; i++) {
        const step = steps[i];
        (step.points || []).forEach(p => known.add(p));
        for (const seg of step.segments || []) { known.add(seg.a); known.add(seg.b); segments.push({ ...seg, step: i, plane: step.plane }); }
      }
      if(c.construction&&c.constructionBoundary?.length) {
        const boundary=c.constructionBoundary;
        boundary.forEach((a,index)=>{
          const b=boundary[(index+1)%boundary.length];known.add(a);known.add(b);
          if(!segments.some(s=>s.kind==='section'&&edgeKey(s.a,s.b)===edgeKey(a,b)))segments.push({a,b,kind:'section',step:c.viewCount-1});
        });
      }
      known = new Set([...known].filter(name => points[name] && (!flat || inPlane(points[name]))));
      segments = segments.filter(s => (!flat || (inPlane(points[s.a]) && inPlane(points[s.b]))) && ((c.showHelpers && !c.cleanView) || s.kind !== 'helper' || s.step === c.viewCount - 1));
      if (!c.showHelpers || c.cleanView) {
        const useful = new Set(this.bodyNames.concat(this.data.given || [], segments.flatMap(s => [s.a, s.b]), plane ? plane.vertices : []));
        known = new Set([...known].filter(n => useful.has(n)));
      }
      const priority = new Set((c.viewCount ? steps[c.viewCount - 1].points || [] : []).concat(c.viewCount ? (steps[c.viewCount - 1].segments || []).flatMap(s => [s.a, s.b]) : this.data.given || []));
      let labelNames = c.cleanView ? new Set([...(this.data.given || []), ...segments.flatMap(s => [s.a, s.b]), ...(plane?.vertices || []), ...priority]) : known;
      if (!c.construction && guidanceFor(this.lesson) && Array.isArray(guidanceNames(this.lesson))) {
        const relevant = new Set(guidanceNames(this.lesson));
        this.lesson.steps.slice(0, c.viewCount).forEach(step => {
          (step.points || []).forEach(name => relevant.add(name));
          (step.segments || []).forEach(line => { relevant.add(line.a); relevant.add(line.b); });
        });
        const focusStep = this.lesson.steps[Math.max(0, c.viewCount - 1)];
        (c.focusNames || focusStep?.focusNames || []).forEach(name => relevant.add(name));
        labelNames = new Set([...relevant].filter(name => known.has(name)));
      }
      const yaw = c.camera.yaw, pitch = c.camera.pitch;
      const rotate = p => {
        const d = p[0] * Math.sin(yaw) + p[1] * Math.cos(yaw);
        return [p[0] * Math.cos(yaw) - p[1] * Math.sin(yaw), p[2] * Math.cos(pitch) - d * Math.sin(pitch), p[2] * Math.sin(pitch) + d * Math.cos(pitch)];
      };
      let u = [1, 0, 0], v = [0, 1, 0];
      if (flat) { u = unit(sub(planePts.find(p => norm(sub(p, originPlane)) > 1e-8) || add(originPlane, [1, 0, 0]), originPlane)); v = unit(cross(nPlane, u)); }
      const raw = p => flat ? [dot(sub(p, originPlane), u), dot(sub(p, originPlane), v), 0] : rotate(sub(p, this.bodyCenter));
      const extent = [...known].map(n => raw(points[n]));
      if (planePts.length) extent.push(...planePts.map(raw));
      if (!extent.length) extent.push([0, 0, 0]);
      const xmin = Math.min(...extent.map(p => p[0])), xmax = Math.max(...extent.map(p => p[0]));
      const ymin = Math.min(...extent.map(p => p[1])), ymax = Math.max(...extent.map(p => p[1]));
      const scale = Math.min((this.width - 90) / Math.max(xmax - xmin, this.bodyRadius * .3), (this.height - 95) / Math.max(ymax - ymin, this.bodyRadius * .3));
      const center = [(xmin + xmax) / 2, (ymin + ymax) / 2];
      const project = p => { const r = raw(p); return [this.width / 2 + (r[0] - center[0]) * scale, this.height / 2 - (r[1] - center[1]) * scale, r[2]]; };
      const path = names => names.map((name, i) => { const p = project(points[name]); return `${i ? 'L' : 'M'}${p[0].toFixed(3)} ${p[1].toFixed(3)}`; }).join(' ');
      const line = (a, b, cls, attrs) => {
        const pa = project(points[a]), pb = project(points[b]);
        const geometry = {x1:pa[0], y1:pa[1], x2:pb[0], y2:pb[1]};
        if (attrs['data-hidden']) {
          // Align the 6-on, 5-off pattern on coincident edges, including partial
          // segments authored from a different endpoint or in reverse.
          const dx = pb[0] - pa[0], dy = pb[1] - pa[1], length = Math.hypot(dx, dy);
          if (length > 1e-8) {
            const forward = Math.abs(dx) > 1e-8 * length ? dx > 0 : dy > 0;
            const along = (pa[0] * dx + pa[1] * dy) / length;
            geometry['stroke-dashoffset'] = (forward ? along : 6 + along) % 11;
          }
        }
        return svgEl('line', {...geometry, class:cls, ...attrs});
      };
      const hiddenSide = (a, b) => {
        if (flat) return false;
        const faces = this.pointFaces.get(a).filter(face => this.pointFaces.get(b).includes(face));
        return faces.length > 0 && faces.every(face => rotate(face.normal)[2] < -1e-8);
      };
      const title = svgEl('title', {}, this.lesson.title);
      const desc = svgEl('desc', {}, (plane ? 'Работаем в плоскости ' + plane.label + '. ' : '') + 'Показано шагов: ' + c.viewCount + ' из ' + this.lesson.steps.length + '. ' + (flat ? 'Плоский вид этой плоскости.' : 'Точная пространственная конфигурация, которую можно вращать.'));
      const g = svgEl('g', { 'aria-hidden': 'true' });
      if (!flat) {
        this.faceInfo.slice().sort((a, b) => raw(a.center)[2] - raw(b.center)[2]).forEach(face => {
          const front = rotate(face.normal)[2] >= -1e-8;
          g.append(svgEl('path', { d: path(face.vertices) + ' Z', fill: front ? '#f0f6f1' : '#f7faf7', 'fill-opacity': front ? '.53' : '.16', stroke: 'none' }));
        });
      }
      if (planePts.length >= 3) g.append(svgEl('path', { d: path(plane.vertices) + ' Z', class: 'model-plane', 'data-active-plane': plane.id }));
      if (c.showResult && this.lesson.result?.polygon?.length >= 3) {
        const poly = this.lesson.result.polygon;
        if (!flat || poly.every(name => inPlane(points[name]))) {
          g.append(svgEl('path', { d: path(poly) + ' Z', class: 'model-final', 'data-section-polygon': poly.join('-') }));
          const builtSides = new Set(segments.filter(s => s.kind === 'section').map(s => edgeKey(s.a, s.b)));
          poly.forEach((a, i) => {
            const b = poly[(i + 1) % poly.length];
            if (builtSides.has(edgeKey(a, b))) return;
            const hidden = hiddenSide(a, b);
            g.append(line(a, b, 'model-final-side' + (hidden ? ' occluded' : ''), {'data-final-side': a + '-' + b, 'data-hidden': hidden}));
          });
        }
      }
      for (const [a, b] of this.data.edges || []) {
        if (flat && !(inPlane(points[a]) && inPlane(points[b]))) continue;
        const adjacent = this.adjacency.get(edgeKey(a, b)) || [];
        const hidden = !flat && adjacent.length === 2 && adjacent.every(i => rotate(this.faceInfo[i].normal)[2] < -1e-8);
        g.append(line(a, b, 'model-edge' + (hidden ? ' hidden' : ''), { 'data-edge': a + '-' + b, 'data-hidden': hidden }));
      }
      for(const [a,b] of c.previewSegments || []) {
        if(known.has(a)&&known.has(b)&&(!flat || (inPlane(points[a])&&inPlane(points[b]))))
          g.append(line(a,b,'model-segment helper construction-preview',{'data-construction-preview':a+'-'+b}));
      }
      // Repeated construction of an already visible segment changes its focus, not its geometry.
      const visibleSegments = new Map();
      segments.forEach(s => {
        const key = edgeKey(s.a, s.b), old = visibleSegments.get(key);
        // A later auxiliary reuse must not turn a verified section boundary
        // into a dashed helper. Preserve its section role and latest focus.
        visibleSegments.set(key, old?.kind === 'section' && s.kind === 'helper' ? { ...s, kind: 'section' } : s);
      });
      for (const s of visibleSegments.values()) {
        const helper = s.kind === 'helper', hidden = !helper && hiddenSide(s.a, s.b);
        const cls = 'model-segment' + (helper ? ' helper' : '') + (hidden ? ' occluded' : '') + (s.step === c.viewCount - 1 ? ' current' : '');
        g.append(line(s.a, s.b, cls, { 'data-segment': s.a + '-' + s.b, 'data-kind': s.kind || 'section', 'data-step': s.step + 1, 'data-hidden': hidden }));
      }
      const allProjected = [...known].map(name => ({ name, p: project(points[name]), focused: priority.has(name) }));
      const projected = allProjected.filter(p => labelNames.has(p.name));
      const textGroup = svgEl('g');
      const pointBoxes = allProjected.map(({ p }) => [p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5]);
      const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
      const lineObstacles = [...(this.data.edges || []), ...[...visibleSegments.values()].map(s => [s.a, s.b])].filter(([a,b]) => !flat || (inPlane(points[a]) && inPlane(points[b]))).map(([a,b]) => [project(points[a]), project(points[b])]);
      const hitsBox = (a,b,box) => {
        let low=0,high=1;
        for(let axis=0;axis<2;axis++) {
          const d=b[axis]-a[axis];
          if(Math.abs(d)<1e-9) { if(a[axis]<box[axis] || a[axis]>box[axis+2]) return false; }
          else { const u=(box[axis]-a[axis])/d,v=(box[axis+2]-a[axis])/d;low=Math.max(low,Math.min(u,v));high=Math.min(high,Math.max(u,v));if(low>high)return false; }
        }
        return true;
      };
      const placements = [];
      projected.sort((a, b) => Number(b.focused) - Number(a.focused) || a.name.localeCompare(b.name)).forEach(item => {
        const {name,p,focused}=item, label=displayName(name), metric=this.measureLabel(label,focused);
        const w=metric.width+7,h=metric.height+7,padding=7;
        const outward=Math.atan2(p[1]-this.height/2,p[0]-this.width/2), candidates=[];
        for(const gap of [9,19,32,48,68,92]) for(let k=0;k<16;k++) {
          const angle=outward+k*Math.PI/8, dx=Math.cos(angle),dy=Math.sin(angle);
          const cx=p[0]+dx*(w/2+gap),cy=p[1]+dy*(h/2+gap);
          const left=clamp(cx-w/2,padding,Math.max(padding,this.width-padding-w));
          const top=clamp(cy-h/2,padding,Math.max(padding,this.height-padding-h));
          const box=[left,top,left+w,top+h];
          candidates.push({box,x:left+3.5-metric.x,y:top+3.5-metric.y,distance:Math.hypot(left+w/2-p[0],top+h/2-p[1]),anglePenalty:k===0?0:1});
        }
        const cost=(candidate,others)=>others.reduce((sum,other)=>sum+overlap(candidate.box,other.box)*1200,0)+pointBoxes.reduce((sum,box)=>sum+overlap(candidate.box,box)*220,0)+lineObstacles.reduce((sum,[a,b])=>sum+(hitsBox(a,b,candidate.box)?23:0),0)+candidate.distance*.55+candidate.anglePenalty;
        let best=candidates[0],bestCost=Infinity;
        for(const candidate of candidates){const cst=cost(candidate,placements);if(cst<bestCost){best=candidate;bestCost=cst;}}
        placements.push({...item,label,metric,candidates,cost,...best});
      });
      // A second pass lets an earlier label move when a later one has few options.
      for(let pass=0;pass<2;pass++) for(let i=placements.length-1;i>=0;i--) {
        const item=placements[i],others=placements.filter((_,j)=>j!==i);
        let best=item,bestCost=item.cost(item,others);
        for(const candidate of item.candidates){const cst=item.cost(candidate,others);if(cst<bestCost-.01){best=candidate;bestCost=cst;}}
        if(best!==item)Object.assign(item,best);
      }
      // A dense final drawing can exhaust the candidates around one point.
      // Keep its label and font size, then use free space elsewhere in the
      // frame. The existing leader connects a displaced label to its point.
      for(const item of placements) {
        const others=placements.filter(other=>other!==item);
        const blocked=box=>others.some(other=>overlap(box,other.box)>.01)||pointBoxes.some(point=>overlap(box,point)>.01);
        if(!blocked(item.box))continue;
        const w=item.box[2]-item.box[0],h=item.box[3]-item.box[1];
        let best=null,bestCost=Infinity;
        for(let top=7;top<=this.height-7-h;top+=6)for(let left=7;left<=this.width-7-w;left+=6) {
          const box=[left,top,left+w,top+h];if(blocked(box))continue;
          const candidate={box,x:left+3.5-item.metric.x,y:top+3.5-item.metric.y,
            distance:Math.hypot(left+w/2-item.p[0],top+h/2-item.p[1]),anglePenalty:1};
          const value=item.cost(candidate,others);if(value<bestCost){best=candidate;bestCost=value;}
        }
        if(best)Object.assign(item,best);
      }
      for(const {name,p,focused,label,x,y,box,distance} of placements) {
        const endX=clamp(p[0],box[0],box[2]),endY=clamp(p[1],box[1],box[3]);
        if (distance > 36) textGroup.append(svgEl('line', { x1: p[0], y1: p[1], x2: endX, y2: endY, class: 'model-leader' }));
        textGroup.append(svgEl('circle', { cx: p[0], cy: p[1], r: focused ? 3.5 : 2.7, class: 'model-point' + (focused ? ' focused' : ''), 'data-point': name }));
        textGroup.append(svgEl('text', { x, y, 'text-anchor': 'start', class: 'model-label' + (focused ? ' focused' : ''), 'data-label': name }, label));
      }
      g.append(textGroup); this.svg.replaceChildren(title, desc, g);
    }
  }

  function renderShell() {
    const header = el('header', { class: 'app-header' });
    const title = el('div'); title.append(para('ГЕОМЕТРИЯ · ПОСТРОЕНИЯ', 'eyebrow'), el('h1', {}, C.title || 'Сечения: от плоскости к доказательству'), para(C.subtitle || 'Сначала плоскость. Затем прямая.', 'subtitle'));
    header.append(title);
    if (board) header.append(el('div', { class: 'brand' }, 'MathExam'));
    else {
      const links = el('nav', { class: 'course-return', 'aria-label': 'Возврат из курса' });
      const home = location.protocol === 'file:' ? 'https://mathexam.space/' : '/';
      links.append(button('← В начало курса', () => window.dispatchEvent(new Event('sections:start')), 'ghost', { 'data-action': 'course-start' }),
        el('a', { href: home }, 'На главную сайта'));
      header.append(links);
    }
    const rule = el('details', { class: 'principle principle-compact' });
    rule.append(el('summary', {}, 'Сначала плоскость, затем линия'), para('Назови рабочую плоскость. Объясни, почему нужные точки лежат в ней. Только после этого проводи прямую.'), para('Каждая сторона сечения лежит в одной грани тела и в секущей плоскости. Вспомогательная прямая может продолжаться за пределы тела.'));
    const layout = el('div', { class: 'layout' });
    const catalog = el('details', { class: 'catalog' }); catalog.open = catalogOpen;
    catalog.append(el('summary', {}, 'Уроки и задачи'));
    catalog.addEventListener('toggle', () => { catalogOpen = catalog.open; });
    catalog.append(el('label', { for: 'catalog-query', class: 'catalog-search-label' }, 'Тема, навык или номер'));
    const query = el('input', { id: 'catalog-query', type: 'search', placeholder: 'Например: куб, 14, след', autocomplete: 'off', maxlength: 200 });
    query.addEventListener('input', () => { catalogQuery = query.value.slice(0, 200); renderCatalog(); });
    const filter = el('select', { 'aria-label': 'Раздел курса' }); filter.append(el('option', { value: '' }, 'Все разделы'));
    for (const m of C.modules || []) filter.append(el('option', { value: m.id }, m.title));
    filter.addEventListener('change', () => { catalogFilter = filter.value; renderCatalog(); });
    const filterBox=el('div',{class:'catalog-filters'});
    const level=el('select',{'aria-label':'Уровень задачи','data-catalog-filter':'level'});
    [['','Все уровни'],['A','Уровень A'],['B','Уровень B'],['C','Уровень C']].forEach(([value,label])=>level.append(el('option',{value},label)));
    level.addEventListener('change',()=>{catalogLevel=level.value;renderCatalog();});
    const origin=el('select',{'aria-label':'Происхождение задачи','data-catalog-filter':'origin'});
    [['','Все источники'],['author','Авторские'],['source','Пособия']].forEach(([value,label])=>origin.append(el('option',{value},label)));
    origin.addEventListener('change',()=>{catalogOrigin=origin.value;renderCatalog();});
    filterBox.append(level,origin);
    catalogCount = para('', 'catalog-count'); catalogList = el('div', { class: 'catalog-list' });
    catalog.append(query, filter, filterBox, catalogCount, catalogList);
    currentMain = el('main', { class: 'course-main' }); layout.append(catalog, currentMain);
    const source = C.source || {};
    const footer = el('footer', { class: 'app-footer' });
    const sourceText=typeof source==='string'?source:[source.authors,source.title,source.publisher,source.year].filter(Boolean).join(' · ');
    if(sourceText)footer.append(para(sourceText));
    footer.append(para(board ? 'Общий разбор не меняет личный прогресс. При выборе другой карточки начинается новое построение. Ответы на доказательства проверяются с преподавателем.' : 'Прогресс и черновик сохраняются в этом браузере. Поворот модели меняет вид, но не геометрию. Ответы на доказательства проверяются с преподавателем.'));
    if (!board && location.protocol !== 'file:') footer.append(el('a', { href: '/stereo-course/sections/download/Sections_From_Zero.html', download: 'Sections_From_Zero.html' }, 'Скачать весь курс для работы без интернета'));
    live = el('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
    host.replaceChildren(header, rule, layout, footer, live);
    renderCatalog(); renderLesson();
  }

  function renderCatalog() {
    if (!catalogList) return;
    const matching = C.lessons.filter(l => (!catalogFilter || l.module === catalogFilter) && (!catalogLevel || String(l.level || '').toUpperCase()===catalogLevel) && (!catalogOrigin || (l.source?.kind==='author'?'author':'source')===catalogOrigin) && (!catalogQuery || [l.title, l.id, l.condition, sourceLabel(l,false),...lessonSkills(l)].filter(v => v !== undefined).join(' ').toLowerCase().includes(catalogQuery.trim().toLowerCase())));
    catalogCount.textContent = matching.length + ' из ' + C.lessons.length + ' карточек';
    const frag = document.createDocumentFragment();
    for (const l of matching) {
      const s = taskState(l);
      const b = button('', () => switchLesson(l.id, true), 'catalog-item' + (l.id === state.current ? ' current' : ''), { 'aria-current': l.id === state.current ? 'page' : 'false', 'data-lesson-id': l.id });
      const title = el('span');
      if (s.revealed === l.steps.length && s.revealed) title.append(el('span', { class: 'progress-dot', 'aria-label': 'Построение завершено' }));
      title.append(document.createTextNode(l.title));
      b.append(title, el('small', {}, [l.level?'Уровень '+l.level:'',sourceLabel(l,true)].filter(Boolean).join(' · ')));
      frag.append(b);
    }
    if (!matching.length) frag.append(para('Таких карточек не найдено. Попробуй другой номер или слово.', 'muted small'));
    catalogList.replaceChildren(frag);
  }

  // A short decision on the same cube. Keep its progress separate from the four
  // formal construction steps and keep an earlier lesson attempt available.
  function recallVisible(lesson, s) {
    return lesson.id === 'starter-18' && (s.recall?.open ||
      (s.mode === 'choose' && !s.construction?.active && !s.recall));
  }
  function defaultRecall(variant = 0) {
    return {open:true, variant, point:'', face:'', hint:false};
  }
  function recallGeometry(r) {
    return r.variant === 0
      ? {from:'N', faces:{P:'BFGC'}, points:['M','P','Q']}
      : {from:'M', faces:{N:'AEFB', Q:'DHEA'}, points:['N','P','Q']};
  }
  function renderRecall(panel, lesson, s, planes) {
    const r = s.recall || defaultRecall();
    const {from, faces, points} = recallGeometry(r);
    const correctFace = faces[r.point];
    const solved = !!correctFace && r.face === correctFace;
    const box = el('section',{class:'step-card', 'data-section-recall':''});
    const change = (patch) => { s.recall = {...r, ...patch}; save(); renderLesson(); };
    box.append(el('h3',{}, r.variant ? 'Разминка · первый отрезок' : 'Продолжи сечение от точки N'),
      para(r.variant ? 'Проведи любую сторону сечения из M. Выбери вторую точку.'
        : 'Отрезок MN уже проведён. В какую точку пойдёшь из N, чтобы продолжить границу?'));
    const choices = el('div',{class:'plane-choice',role:'group','aria-label':'Вторая точка'});
    points.forEach(point => choices.append(button(point,()=>change({point,face:''}),'',{
      'data-recall-point':point,'aria-pressed':point===r.point})));
    box.append(choices);
    if (r.point && !correctFace) {
      box.append(para(r.point === 'M' ? 'Так ты вернёшься по уже проведённому отрезку. Куда можно пойти дальше?'
        : 'Поверни куб. Есть ли грань, в которой целиком лежит твой отрезок?', 'feedback retry'));
    }
    if (correctFace) {
      box.append(para('Покажи, в какой грани лежит отрезок '+from+r.point+'.'));
      const choices = el('div',{class:'plane-choice',role:'group','aria-label':'Общая грань'});
      for (const id of ['AEFB','BFGC','CGHD','DHEA']) {
        choices.append(button(planes.get(id).label,()=>{
          change({face:id});
        },'',{'data-recall-face':id,'aria-pressed':r.face===id}));
      }
      box.append(choices);
      if (r.face) box.append(para(solved ? 'Верно. Обе точки лежат в выбранной грани и в плоскости сечения.'
        : 'Найди на кубе оба ребра с отмеченными точками. Выбранная грань содержит их оба?',
        solved?'feedback good':'feedback retry'));
    }
    if (!solved) {
      box.append(button('Покажи один шаг',()=>{
        markHelp(lesson.id,'Подсказка к короткой разминке'); change({hint:true});
      },'ghost',{'data-recall-hint':''}));
      if (r.hint) box.append(para(r.variant
        ? 'Точка M лежит на ребре AE. Проверь обе боковые грани с этим ребром.'
        : 'Найди ребро BF с точкой N. По одной из двух его граней ты уже пришёл из M. Посмотри на другую.'));
    } else {
      box.append(button('Первый отрезок с другого ракурса',()=>{
        s.camera.yaw=wrapYaw(s.camera.yaw+Math.PI/2);
        s.recall=defaultRecall(1); save(); renderLesson();
      },'ghost',{'data-recall-repeat':''}));
    }
    box.append(button(s.mode==='choose' && !s.construction?.active?'К полному построению':'Вернуться к моему построению',
      ()=>change({open:false}),'ghost',{'data-recall-close':''}));
    panel.append(box);
  }

  function activePlane(lesson, s) {
    if (recallVisible(lesson,s)) return s.recall?.face || null;
    const manual=constructionState(lesson,s);
    if(manual?.active) {
      const count=manual.actions.length;
      return manual.justBuilt?lesson.steps[count-1]?.plane:manual.selection.plane || (count===lesson.steps.length?lesson.steps[count-1]?.plane:null);
    }
    if (s.mode === 'choose') return null;
    if (s.viewCount < s.revealed) return s.viewCount ? lesson.steps[s.viewCount - 1].plane : null;
    if (s.justBuilt && s.revealed) return lesson.steps[s.revealed - 1].plane;
    const upcoming = lesson.steps[s.revealed];
    if (upcoming && (s.mode === 'study' || s.approved === s.revealed)) return upcoming.plane;
    if (s.viewCount) return lesson.steps[s.viewCount - 1].plane;
    return null;
  }
  function updateScene(lesson, s, caption) {
    if (recallVisible(lesson,s)) {
      const r=s.recall || defaultRecall(), {from}=recallGeometry(r);
      caption.textContent=r.face?'Выбранная грань: '+r.face:'Поверни куб, чтобы рассмотреть грани';
      renderer?.update({viewCount:r.variant?0:1,planeId:r.face || null,planeView:!!r.face && s.planeView,
        camera:{...s.camera},showHelpers:true,cleanView:false,showResult:false,
        focusNames:['A','B','C','D','E','F','G','H','M','N','P','Q'],
        previewSegments:r.point?[[from,r.point]]:[]});
      return;
    }
    const construction=constructionState(lesson,s);
    if(construction?.active) {
      const count=construction.actions.length,selected=construction.selection,plan=constructionPlan(lesson)[count];
      const planeId=construction.justBuilt?lesson.steps[count-1]?.plane:selected.plane || (count===lesson.steps.length?lesson.steps[count-1]?.plane:null);
      const plane=planesFor(lesson).get(planeId),known=knownNames(lesson,count),preview=[];
      const pair=(a,b)=>{if(known.has(selected[a])&&known.has(selected[b])&&selected[a]!==selected[b])preview.push([selected[a],selected[b]]);};
      if(plan?.kind==='segment')pair('a','b');
      if(plan?.kind==='intersection'){pair('firstA','firstB');pair('secondA','secondB');}
      if(plan?.kind==='parallel'){pair('directionA','directionB');pair('edgeA','edgeB');}
      if(plan?.kind==='edge-point')pair('edgeA','edgeB');
      caption.textContent=plane?'Выбранная плоскость: '+plane.label:'Выбери рабочую плоскость для своего действия';
      renderer?.update({viewCount:count,planeId:plane?.id,planeView:s.planeView&&!!plane,camera:{...s.camera},showHelpers:s.showHelpers,cleanView:s.cleanView,
        showResult:construction.boundaryConfirmed,focusNames:Object.values(selected).filter(value=>known.has(value)),previewSegments:preview,construction:true,
        constructionSteps:construction.actions.map(action=>constructionDrawingStep(lesson,action)),constructionBoundary:construction.boundaryConfirmed?construction.boundarySelection:[]});
      return;
    }
    const id = activePlane(lesson, s), p = planesFor(lesson).get(id);
    caption.textContent = p ? (s.planeView ? 'Плоский вид: ' : 'Плоскость шага: ') + p.label : 'Исходная фигура';
    const focusStep=s.viewCount<s.revealed?(s.viewCount?lesson.steps[s.viewCount-1]:lesson.steps[0]):s.justBuilt?lesson.steps[s.revealed-1]:lesson.steps[Math.min(s.revealed,lesson.steps.length-1)];
    renderer?.update({ viewCount: s.viewCount, planeId: id, planeView: s.planeView && !!p, camera: { ...s.camera }, showHelpers: s.showHelpers, cleanView:s.cleanView, showResult: s.showResult && s.viewCount === lesson.steps.length,focusNames:focusStep?.focusNames || [] });
  }
  function renderLesson() {
    const lesson = lessonMap.get(state.current), s = taskState(lesson), planes = planesFor(lesson);
    const manual=!!constructionState(lesson,s)?.active;
    const starter = guidanceFor(lesson);
    document.querySelector('.layout')?.classList.toggle('starter-layout', !!starter);
    currentMain.classList.toggle('starter-lesson', !!starter);
    if (starter && lastRenderedId !== lesson.id) { const catalog = document.querySelector('.catalog'); if (catalog) catalog.open = false; }
    const oldScroll = window.scrollY;
    renderer?.destroy(); renderer = null;
    const fragment = document.createDocumentFragment();
    const topbar = el('div', { class: 'lesson-topbar' });
    topbar.append(el('span', { class: 'breadcrumbs' }, lesson.starter ? 'Первые шаги · ступень ' + lesson.starter.stage + ' из 6' : lesson.scaffold ? 'К основным задачам' : moduleMap.get(lesson.module)?.title || lesson.module || 'Курс'), el('span', { class: 'lesson-position' }, (C.lessons.indexOf(lesson) + 1) + ' / ' + C.lessons.length));
    const header = el('section', { class: 'lesson-header' });
    header.append(el('h2', { id: 'lesson-title', tabindex: '-1' }, lesson.title), para(lesson.condition, 'lesson-condition'));
    if (!board) header.append(boardLink(lesson));
    const labels=el('div',{class:'lesson-tags'});
    if(lesson.level)labels.append(el('span',{class:'level-tag'},'Уровень '+lesson.level));
    for(const skill of lessonSkills(lesson))labels.append(el('span',{class:'skill-tag'},skill));
    const metadata = [];
    if (labels.childNodes.length && !starter) metadata.push(labels);
    if (lesson.source && !starter) metadata.push(para(sourceLabel(lesson,false), 'source-line'));
    if (board) header.append(...metadata);
    if (starter) {
      header.prepend(para((lesson.id==='starter-18' && !manual && !recallVisible(lesson,s) && s.mode==='study' ? 'Разбор по шагам' : '') || ({model:'Смотрим вместе',guided:'Пробуем с опорой',transfer:'Новый пример: пробую сам'})[starter.phase] || (lesson.scaffold?'Новый приём':'Первые шаги'),'starter-phase'));
      if (starter.glossary?.length) {
        const words=el('div',{class:'starter-glossary'});
        starter.glossary.forEach(item=>{const row=para('');row.append(el('strong',{},item.term+' — '),math(item.text));words.append(row);});
        const dictionary=details('Новые слова',[words],()=>{if(starter.phase!=='model')markHelp(lesson.id,'Словарь новых слов');},s.glossaryOpen);
        dictionary.addEventListener('toggle',()=>{s.glossaryOpen=dictionary.open;save();});header.append(dictionary);
      }
    }
    const work = el('section', { class: 'workbench', 'aria-label': 'Модель и пошаговое построение' });
    const modelPanel = el('div', { class: 'model-panel' });
    frame = el('div', { class: 'model-frame' }); const caption = el('div', { class: 'model-caption', 'aria-live': 'polite' }); frame.append(caption);
    modelPanel.append(frame, para(starter ? 'Можно повернуть модель пальцем или мышью.' : 'Поворачивай мышью, пальцем или стрелками. Home — исходный вид.', 'model-help'));
    if (lesson.goal) modelPanel.append(para(lesson.goal, 'lesson-goal'));
    const controls = el('div', { class: 'model-controls', role: 'group', 'aria-label': 'Управление моделью' });
    if (!starter) [['←', -.17, 0, 'Повернуть влево'], ['→', .17, 0, 'Повернуть вправо'], ['↑', 0, .12, 'Повернуть вверх'], ['↓', 0, -.12, 'Повернуть вниз']].forEach(([label, a, b, aria]) => controls.append(button(label, () => renderer?.turn(a, b), 'rotation', { 'aria-label': aria, disabled: s.planeView })));
    controls.append(button('Исходный вид', () => { s.camera = { ...(lesson.model.initialCamera || { yaw: -.65, pitch: .46 }) }; save(); renderer?.reset(); }, 'reset-camera'));
    const planeButton = button(s.planeView ? 'Объёмная модель' : 'В этой плоскости', () => { s.planeView = !s.planeView; save(); renderLesson(); }, 'plane-toggle', { 'aria-pressed': s.planeView, disabled: !activePlane(lesson, s) });
    controls.append(planeButton); modelPanel.append(controls);
    const extras = el('div', { class: 'model-extras' });
    const helperLabel = el('label'); const helperCheck = el('input', { type: 'checkbox', checked: s.showHelpers });
    helperCheck.addEventListener('change', () => { s.showHelpers = helperCheck.checked; save(); updateScene(lesson, s, caption); });
    helperLabel.append(helperCheck, document.createTextNode('Вспомогательные линии')); extras.append(helperLabel); if (!starter) modelPanel.append(extras);
    extras.append(button('Чистый вид',()=>{s.cleanView=!s.cleanView;save();renderLesson();},'clean-view',{ 'aria-pressed':s.cleanView,'data-action':'clean-view',title:'Оставить подписи и линии, нужные для текущего построения'}));
    const legend = el('div', { class: 'legend', 'aria-label': 'Обозначения на модели' });
    [['plane', 'Плоскость'], ['current', 'Текущий шаг'], ['', 'Построено'], ['aux', 'Вспомогательная линия']].forEach(([cls, text]) => legend.append(el('span', { class: cls }, text)));
    modelPanel.append(legend);
    if (!starter) modelPanel.append(para('Невидимые рёбра и стороны сечения показаны штрихами. Совпадение линий на экране само по себе не доказывает их пересечение.', 'model-note'));
    if ((lesson.theory || []).length) {
      const theory = details('Нужная теория', lesson.theory.map(t => para(t)), () => { s.helpUsed = true; s.theoryOpen = true; save(); refreshStatus(lesson, s); }, s.theoryOpen);
      theory.addEventListener('toggle', () => { s.theoryOpen = theory.open; save(); }); theory.classList.add('theory-details'); modelPanel.append(theory);
    }
    const stepPanel = el('div', { class: 'step-panel' });
    const recall = recallVisible(lesson,s);
    if (recall) renderRecall(stepPanel,lesson,s,planes);
    if (!recall || (s.mode==='choose' && !manual)) renderStepPanel(stepPanel, lesson, s, planes);
    if (!recall && lesson.id==='starter-18') stepPanel.append(button('Разминка на две минуты',()=>{
      s.recall=defaultRecall(1); s.camera.yaw=wrapYaw(s.camera.yaw+Math.PI/2);
      save(); renderLesson();
    },'ghost',{'data-recall-start':''}));
    if(lesson.practiceTopic && !starter && !board)stepPanel.append(button('Потренировать этот шаг',()=>{
      save(); window.dispatchEvent(new CustomEvent('sections:practice',{detail:{topic:lesson.practiceTopic,lessonId:lesson.id,step:s.revealed}}));
    },'practice-step ghost',{'data-action':'practice-step'}));
    work.append(modelPanel, stepPanel);
    fragment.append(topbar, header, work);
    if (!board && metadata.length) fragment.append(details('Источник и навыки задания', metadata));
    if ((lesson.notes || []).length) {
      const notes = details(lesson.source?.kind==='author'?'Уточнения к задаче и модели':'Уточнения к пособию и модели', lesson.notes.map(n => para(n)), () => {
        s.notesOpen = true; s.helpUsed = true; save(); refreshStatus(lesson, s);
      }, s.notesOpen);
      notes.classList.add('task-notes');
      notes.addEventListener('toggle', () => { s.notesOpen = notes.open; save(); });
      fragment.append(notes);
    }
    if (!recall && !manual && (!starter || s.revealed)) fragment.append(renderHistory(lesson, s, planes));
    if(!manual && s.revealed===lesson.steps.length && s.revealed>0 && lesson.calculationSteps?.length)fragment.append(renderCalculations(lesson,s));
    const bottom = manual && !recall ? renderConstructionDraft(s) : renderBottom(lesson, s); if (bottom.childNodes.length) fragment.append(bottom);
    if (starter && lesson.source) { const metadata=details('Сведения о карточке',[para(sourceLabel(lesson,false),'source-line')]);metadata.classList.add('starter-metadata');fragment.append(metadata); }
    const navigation = el('nav', { class: 'lesson-navigation', 'aria-label': 'Переход между заданиями' });
    const i = C.lessons.indexOf(lesson);
    const returnToStage=()=>{if(board){const catalog=document.querySelector('.catalog');catalog.open=true;catalog.querySelector('summary').focus();catalog.scrollIntoView({block:'start'});}else window.dispatchEvent(new CustomEvent('sections:route',{detail:lesson.pathStageId?{stageId:lesson.pathStageId}:{}}));};
    if (lesson.pathStageId) {
      const previous=lesson.pathPreviousId && lessonMap.has(lesson.pathPreviousId),next=lesson.pathNextId && lessonMap.has(lesson.pathNextId);
      navigation.append(button(previous?'← Предыдущий пример':board?'Все задания':'К моему этапу',previous?()=>switchLesson(lesson.pathPreviousId,true):returnToStage,'ghost',{'data-action':previous?'path-previous':'starter-route','data-path-action':'previous'}));
      navigation.append(button(next?'Следующий пример →':board?'Все задания':'К проверке этапа →',next?()=>switchLesson(lesson.pathNextId,true):returnToStage,s.revealed===lesson.steps.length?'primary':'ghost',{'data-action':starter?'starter-next':'path-next','data-path-action':'next'}));
    } else if (starter) {
      navigation.append(button(board?'Все задания':'К моему маршруту',returnToStage,'ghost',{'data-action':'starter-route'}));
      if (starter.nextId && lessonMap.has(starter.nextId)) navigation.append(button(s.revealed===lesson.steps.length?'К следующему примеру →':'Следующий пример →',()=>switchLesson(starter.nextId,true),s.revealed===lesson.steps.length?'primary':'ghost',{'data-action':'starter-next'}));
      else navigation.append(button(board?'Все задания':'Продолжить курс →',returnToStage,'primary',{'data-action':'starter-next'}));
    } else navigation.append(button('← Предыдущее задание', () => switchLesson(C.lessons[i - 1].id, true), 'ghost', { disabled: i === 0 }), button('Следующее задание →', () => switchLesson(C.lessons[i + 1].id, true), 'ghost', { disabled: i === C.lessons.length - 1 }));
    fragment.append(navigation);
    currentMain.replaceChildren(fragment);
    renderer = new Scene(frame, lesson, camera => { s.camera = camera; save(); }); updateScene(lesson, s, caption);
    if (lastRenderedId === lesson.id) window.scrollTo({ top: oldScroll, behavior: 'auto' });
    lastRenderedId = lesson.id;
    window.dispatchEvent(new CustomEvent('sections:lesson',{detail:{id:lesson.id,lessonId:lesson.id}}));
  }

  function renderConstructionDraft(s) {
    const box=el('section',{class:'construction-draft'});
    box.append(el('h3',{},'Моё объяснение'),el('label',{for:'proof-draft'},'Почему выбранные точки и линии принадлежат нужным плоскостям?'));
    const area=el('textarea',{id:'proof-draft',maxlength:30000,'data-construction-draft':'',placeholder:'Работаю в плоскости … . Это допустимо, потому что … .'});area.value=s.draft;
    area.addEventListener('input',()=>{s.draft=area.value.slice(0,30000);save();});
    box.append(area,para('Запись сохраняется. Автоматически проверяются выбранные геометрические действия; полное доказательство обсуждаем с преподавателем.','teacher-note'));
    return box;
  }
  function renderConstructionPanel(panel,lesson,s,planes) {
    const work=constructionState(lesson,s,true),plans=constructionPlan(lesson),index=work.actions.length,plan=plans[index];
    const header=el('section',{class:'construction-heading'});
    header.append(el('h3',{},'Строю сам'),para('Проверено действий: '+index+' из '+plans.length,'construction-status'));
    if(work.evidence)header.append(para((work.completed&&!work.helpUsed?'':'Ранее ')+(work.evidence==='first'?'выбраны все элементы без подсказок.':'выбраны все элементы после своих исправлений.'),'construction-evidence'));
    if(work.helpUsed)header.append(para('В этой карточке уже открывалась помощь. Она сохранена в истории; новое нажатие или отмена её не стирает.','small'));
    panel.append(header);
    const feedbackNode=()=>{
      if(work.feedback)panel.append(para(work.feedback.message,'feedback '+(work.feedback.correct?'good':'retry')));
    };
    if(work.justBuilt && plan) {
      const done=work.actions[index-1],box=el('section',{class:'step-card construction-action'});
      box.append(el('h4',{},'Действие выполнено'),para(constructionActionText(lesson,done)),para('Проверь своё объяснение выполненного действия, затем выбери элементы следующего.','small'),button('Следующее самостоятельное действие',()=>{work.justBuilt=false;work.feedback=null;save();renderLesson();},'primary',{'data-action':'construction-next'}));
      panel.append(box);
    } else if(plan) {
      const box=el('section',{class:'step-card construction-action','data-construction-step':index});
      box.append(el('h4',{},(index+1)+'. '+plan.title),para(plan.prompt));
      const group=el('div',{class:'plane-choice','aria-label':'Рабочая плоскость самостоятельного действия'});
      choicePlanes(lesson,lesson.steps[index],planes,index).forEach(plane=>{
        group.append(button(plane.label,()=>{work.selection.plane=plane.id;work.feedback=null;save();renderLesson();},work.selection.plane===plane.id?'selected':'',{'data-construction-plane':plane.id,'aria-pressed':work.selection.plane===plane.id}));
      });
      box.append(el('p',{},'1. В какой плоскости работаешь?'),group,el('p',{},'2. Выбери элементы действия'));
      const names=[...knownNames(lesson,index)].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const labels={point:'Точка',a:'Первая точка',b:'Вторая точка',c:'Третья точка',firstA:'Первая прямая: точка 1',firstB:'Первая прямая: точка 2',secondA:'Вторая прямая: точка 1',secondB:'Вторая прямая: точка 2',directionA:'Направление: точка 1',directionB:'Направление: точка 2',edgeA:'Ребро: первая вершина',edgeB:'Ребро: вторая вершина'};
      const fields=el('div',{class:'construction-fields'});
      function selectField(key,label,options) {
        const id='construction-'+key,row=el('div',{class:'construction-field'}),select=el('select',{id,'data-construction-input':key});
        select.append(el('option',{value:''},'Выбери…'));options.forEach(([value,text])=>select.append(el('option',{value},text)));
        select.value=work.selection[key]||'';
        select.addEventListener('change',()=>{work.selection[key]=select.value;work.feedback=null;save();renderLesson();document.getElementById(id)?.focus({preventScroll:true});});
        row.append(el('label',{for:id},label),select);fields.append(row);
      }
      constructionFields(plan).forEach(key=>selectField(key,labels[key],names.map(name=>[name,displayName(name)])));
      if(plan.kind==='segment')selectField('role','Какую роль играет линия?',[['helper','Вспомогательная линия'],['section','Сторона сечения']]);
      if(plan.referenceEdge)selectField('location','Новая точка лежит на конечном ребре или на его продолжении?',[['edge','На конечном ребре'],['extension','На продолжении за вершиной']]);
      box.append(fields,para('Выбранные пары точек показаны на модели как пробные линии. Они станут построением после проверки.','small'));
      box.append(button('Проверить и выполнить действие',()=>{
        const selection={...work.selection},result=validateConstructionAction(lesson,index,selection);
        work.feedback=result;
        if(result.correct) {
          work.actions.push({step:index,selection});work.selection={};work.justBuilt=work.actions.length<plans.length;
          work.boundarySelection=[];work.boundaryConfirmed=false;work.selectedCheck=-1;
        } else {
          if(result.code!=='missing'&&result.code!=='location'&&result.code!=='role')work.mistakes++;
          else if(result.code==='role'&&selection.role)work.mistakes++;
          work.history.push({kind:'attempt',step:index,selection,code:result.code,at:Date.now()});
        }
        save(true);renderLesson();announce(result.message);
      },'primary',{'data-action':'construction-submit'}));
      const hint=details('Подсказка к действию',[para(lesson.steps[index].hint || lesson.steps[index].reason),para('Открытие этой подсказки сохраняется как помощь к карточке.','teacher-note')],()=>{
        if(!hint.isConnected)return;
        work.hintStep=index;work.helpUsed=true;markHelp(lesson.id,'Подсказка самостоятельного построения: шаг '+(index+1));
      },work.hintStep===index);
      hint.addEventListener('toggle',()=>{if(hint.isConnected&&!hint.open&&work.hintStep===index){work.hintStep=-1;save();}});
      box.append(hint);panel.append(box);feedbackNode();
    } else {
      const finish=el('section',{class:'step-card construction-finish'});
      finish.append(el('h4',{},work.completed?(work.helpUsed?'Построение проверено после помощи':'Самостоятельные действия проверены'):'Все действия выполнены. Проверь результат.'));
      if(lesson.result?.polygon?.length) {
        finish.append(para('Выбери вершины границы по порядку обхода. Начать можно с любой вершины и идти в любую сторону. Последняя сторона вернётся к первой автоматически.'));
        const vertices=el('div',{class:'construction-boundary-options','aria-label':'Вершины границы по порядку'});
        [...knownNames(lesson,index)].sort().forEach(name=>vertices.append(button(displayName(name),()=>{
          const at=work.boundarySelection.indexOf(name);if(at<0)work.boundarySelection.push(name);else work.boundarySelection.splice(at,1);
          work.boundaryConfirmed=false;work.feedback=null;save();renderLesson();
        },work.boundarySelection.includes(name)?'selected':'',{'data-construction-vertex':name,'aria-pressed':work.boundarySelection.includes(name)})));
        finish.append(vertices,para(work.boundarySelection.length?work.boundarySelection.map(displayName).join(' → ')+' → '+displayName(work.boundarySelection[0]):'Граница ещё не выбрана.','construction-boundary-order'));
        finish.append(button('Проверить замкнутую границу',()=>{
          const result=validateConstructionBoundary(lesson,work.boundarySelection);work.feedback=result;work.boundaryConfirmed=result.correct;
          if(!result.correct)work.mistakes++;
          save(true);renderLesson();announce(result.message);
        },'primary',{'data-action':'construction-boundary-submit'}));
        if(work.boundaryConfirmed)finish.append(para('Граница проверена.','feedback good'));
      }
      if(lesson.check) {
        finish.append(el('h4',{},'Почему это работает?'),para(lesson.check.question));
        const choices=el('div',{class:'check-options'});
        lesson.check.options.forEach((text,i)=>choices.append(button(text,()=>{
          work.selectedCheck=i;
          if(i!==lesson.check.correct){work.mistakes++;work.feedback={correct:false,code:'reason',message:'Это объяснение не подтверждает построение. Проверь принадлежность точек и роль вспомогательных линий.'};}
          else work.feedback={correct:true,code:'reason',message:lesson.check.explanation};
          save(true);renderLesson();
        },work.selectedCheck===i?'selected':'',{'data-construction-check':i,'aria-pressed':work.selectedCheck===i})));
        finish.append(choices);
      }
      if(work.completed)finish.append(para(work.helpUsed?'Геометрические действия и итоговые выборы проверены после помощи.':'Геометрические действия и итоговые выборы проверены.','feedback good'),para('Обоснуй своими словами рабочую плоскость каждого действия. Полное доказательство автоматически не оценивается.','teacher-note'));
      panel.append(finish);feedbackNode();
    }
    const controls=el('div',{class:'construction-controls'});
    if(work.actions.length)controls.append(button('Отменить последнее действие',()=>undoConstruction(lesson,s),'ghost',{'data-action':'construction-undo'}));
    controls.append(button('Вернуться к выбору плоскости и разбору',()=>{work.active=false;save();renderLesson();},'ghost',{'data-action':'construction-leave'}));panel.append(controls);
    if(work.actions.length) {
      const history=el('ol');work.actions.forEach(action=>{const item=el('li');item.append(para(constructionActionText(lesson,action)),para('Плоскость: '+(planes.get(action.selection.plane)?.label || action.selection.plane),'small'));history.append(item);});
      panel.append(details('Мои принятые действия',[history]));
    }
  }

  function renderStepPanel(panel, lesson, s, planes) {
    if(constructionState(lesson,s)?.active){renderConstructionPanel(panel,lesson,s,planes);return;}
    if (s.mode === 'choose') {
      const choice = el('div', { class: 'mode-choice' });
      const startStudy=()=>{if(s.recall)s.recall.open=false;beginAttempt(s);s.mode='study';s.workedSeen=true;save();renderLesson();renderCatalog();};
      const startPractice=()=>{if(s.recall)s.recall.open=false;beginAttempt(s);s.mode='practice';if(guidanceFor(lesson)?.phase==='guided')markHelp(lesson.id,'Учебная попытка с опорой');save();renderLesson();};
      if (guidanceFor(lesson)) {
        const phase=guidanceFor(lesson).phase,model=phase==='model';
        choice.append(el('h3',{},model?(lesson.scaffold?'Разберём новый приём':'Посмотрим одно действие'):phase==='guided'?'Теперь попробуем с опорой':'Теперь новый пример'),para(guidanceFor(lesson).intro || (lesson.scaffold?'Назовём рабочую плоскость. Затем обоснуем каждую новую линию.':'Сначала назовём плоскость. Потом выполним одно действие.')));
        if(supportsConstruction(lesson.id))choice.append(button('Построить самостоятельно',()=>startConstruction(lesson.id),'primary',{'data-action':'start-construction'}),para('Сам выбери точки, линии и их роль. Действия проверяются; прежний разбор и результаты сохраняются отдельно.','small'));
        choice.append(button(model?'Сделаем вместе':phase==='guided'?'Попробую с опорой':supportsConstruction(lesson.id)?'Потренировать выбор плоскости':'Попробую сам',model?startStudy:startPractice,supportsConstruction(lesson.id)?'ghost':'primary',{'data-action':model?'start-study':'start-practice'}));
        const other=details('Другой способ работы',[button(model?'Попробую сам':'Посмотреть разбор',model?startPractice:startStudy,'ghost',{'data-action':model?'start-practice':'start-study'})]);other.classList.add('starter-other-mode');choice.append(other);
      } else {
        choice.append(el('h3', {}, 'Как будем строить?'), para('В обоих режимах сначала определяем плоскость. Новые линии появляются только после твоего действия.'));
        choice.append(button('Разобрать по шагам', startStudy, 'primary', { 'data-action': 'start-study' }));
        choice.append(button('Построить самостоятельно', startPractice, '', { 'data-action': 'start-practice' }));
      }
      if (s.workedSeen || s.helpUsed || s.resultSeen) choice.append(para('Разбор или подсказки этой задачи уже открывались. Новая попытка сохранит эту отметку.', 'small muted'));
      panel.append(choice); return;
    }
    if(supportsConstruction(lesson.id))panel.append(button('Открыть самостоятельное построение',()=>startConstruction(lesson.id),'ghost',{'data-action':'start-construction'}));
    const meter = el('div', { class: 'step-meter' });
    meter.append(el('span', {}, (guidanceFor(lesson)?'Сделано: ':'Построено: ') + s.revealed + ' из ' + lesson.steps.length), el('span', { class: 'learning-status' }, statusText(s, lesson)));
    const progress = el('div', { class: 'step-progress', role: 'progressbar', 'aria-valuenow': s.revealed, 'aria-valuemin': 0, 'aria-valuemax': lesson.steps.length, 'aria-label': 'Выполненные шаги' }); const fill = el('span'); fill.style.width = (100 * s.revealed / Math.max(1, lesson.steps.length)) + '%'; progress.append(fill);
    panel.append(meter, progress);
    if (s.viewCount < s.revealed) {
      const box = el('div', { class: 'step-card' });
      box.append(el('h3', {}, s.viewCount ? 'Рисунок после шага ' + s.viewCount : 'Исходный рисунок'), para('Построенные шаги и ответы сохранены. Сейчас ты рассматриваешь более ранний вид модели.'));
      box.append(button('Вернуться к текущему построению', () => { s.viewCount = s.revealed; save(); renderLesson(); }, 'primary'));
      panel.append(box); return;
    }
    const step = lesson.steps[s.revealed];
    if (s.justBuilt && step) {
      const completed = lesson.steps[s.revealed - 1];
      const box = el('div', { class: 'step-card' });
      box.append(el('h3', {}, 'Шаг ' + s.revealed + ' выполнен'), para('Плоскость: ' + (planes.get(completed.plane)?.label || completed.plane), 'plane-tag'), para(completed.action));
      box.append(para(guidanceFor(lesson) && !(completed.segments||[]).length?'Посмотри на результат этого шага. Объяснение осталось ниже.':'Посмотри, где лежит новая линия. Предыдущие построения сохранены.', 'small'));
      box.append(button('К следующему шагу', () => { s.justBuilt = false; save(); renderLesson(); }, 'primary action-button', { 'data-action': 'next-step' }));
      panel.append(box);
    } else if (!step) {
      const box = el('div', { class: 'step-card' });
      box.append(el('h3', {}, guidanceFor(lesson)?'Этот пример закончен':'Построение завершено'), para(guidanceFor(lesson)?(guidanceFor(lesson).recall || 'Расскажи своими словами, что мы сделали и в какой плоскости работали.'):'Проверь, в какой плоскости находится каждая линия и как получены новые точки. Для сечения дополнительно проверь, что его граница замкнута.'));
      if (!guidanceFor(lesson)) box.append(para('Все шаги остались ниже. Объясни вслух, в какой плоскости проведена каждая новая прямая.', 'small'));
      if (guidanceFor(lesson) && lesson.check) box.append(button('Ответить на короткий вопрос',()=>document.getElementById('starter-check')?.scrollIntoView({block:'start',behavior:'auto'}),'primary',{'data-action':'starter-check-scroll'}));
      if(lesson.calculationSteps?.length)box.append(para('Теперь можно завершить решение самостоятельно или открыть его продолжение по одному шагу ниже.','small'));
      panel.append(box);
    } else {
      const box = el('div', { class: 'step-card', 'data-current-step': s.revealed + 1 });
      const plane = planes.get(step.plane);
      if (!plane) { box.append(para('Плоскость этого шага не найдена в данных. Построение остановлено.', 'feedback retry')); panel.append(box); return; }
      const approved = s.mode === 'study' || s.approved === s.revealed;
      const question=step.question;
      const questionReady=s.mode==='study' || !question || s.questionApproved===s.revealed;
      box.append(el('h3', {}, (s.revealed + 1) + '. ' + (approved ? questionReady?step.title:'Обоснуй построение' : 'Выбери плоскость действия')));
      if (!approved) {
        if (guidanceFor(lesson)?.phase==='guided' && (step.support || guidanceFor(lesson).support)) box.append(para(step.support || guidanceFor(lesson).support,'starter-support'));
        box.append(para(plannedAction(step, plane), 'action-text'));
        box.append(para(guidanceFor(lesson)?'В какой плоскости работаем?':'В какой плоскости выполним следующий шаг? Назови её, прежде чем проводить линию.'));
        const candidates = el('div', { class: 'plane-choice', role: 'group', 'aria-label': 'Выбери плоскость следующего построения' });
        const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        const planeAttempt=s.planeAttempts[s.revealed];
        if(planeAttempt?.wrong?.length){feedback.className='feedback retry';feedback.textContent=lesson.starter?'Вернись к условию. Найди грань, в которой находятся нужные точки.':lesson.scaffold?'Вернись к условию. Найди названную плоскость, которой принадлежат нужные точки или в которой задано направление.':'Проверь, где лежат обе нужные точки или точка и заданное направление. Пересечение изображений линий само по себе не доказывает их пересечение в пространстве.';}
        for (const p of choicePlanes(lesson, step, planes, s.revealed)) {
          const b = button(step.planeChoiceLabels?.[p.id] || p.label, () => {
            if (samePlane(lesson, p, plane)) {
              const attempt=s.planeAttempts[s.revealed] || {wrong:[]};attempt.selected=p.id;attempt.correct=true;s.planeAttempts[s.revealed]=attempt;
              s.approved = s.revealed; save(); renderLesson(); announce(question?'Плоскость выбрана. Выбери обоснование, прежде чем выполнять построение.':'Плоскость выбрана. Теперь объясни принадлежность точек и выполни построение.');
            } else {
              const attempt=s.planeAttempts[s.revealed] || {wrong:[]};attempt.selected=p.id;attempt.correct=false;if(!Array.isArray(attempt.wrong))attempt.wrong=[];if(!attempt.wrong.includes(p.id))attempt.wrong.push(p.id);s.planeAttempts[s.revealed]=attempt;
              markMistake(lesson, s);
              renderLesson(); announce('Для этого шага нужна другая плоскость. Проверь, где лежат нужные точки.');
            }
          }, planeAttempt?.wrong?.includes(p.id)?'incorrect':'', { 'data-plane-choice': p.id }); candidates.append(b);
        }
        box.append(candidates, feedback);
      } else {
        const tag = el('div', { class: 'plane-tag' }); tag.append(el('span', { class: 'plane-label' }, 'Работаем в плоскости'), document.createTextNode(plane.label));
        box.append(tag);
        if(!questionReady) {
          const questionBox=el('div',{class:'step-question','data-step-question':s.revealed+1});
          if(!Array.isArray(question.options) || !Number.isInteger(question.correct) || question.correct<0 || question.correct>=question.options.length) {
            questionBox.append(para('Вопрос этого шага требует уточнения в данных курса. Построение пока недоступно.','feedback retry'));
          } else {
            questionBox.append(para(plannedAction(step,plane),'action-text'),el('h4',{},'Почему это допустимо?'),para(question.prompt));
            const choices=el('div',{class:'reason-choice',role:'group','aria-label':question.prompt || 'Обоснование построения'});
            const attempt=s.questionAttempts[s.revealed];
            question.options.forEach((option,index)=>{
              const selected=attempt?.selected===index;
              const b=button('',()=>{
                const previous=s.questionAttempts[s.revealed] || {wrong:[]};
                previous.selected=index;previous.correct=index===question.correct;
                if(!Array.isArray(previous.wrong))previous.wrong=[];
                if(!previous.correct && !previous.wrong.includes(index))previous.wrong.push(index);
                s.questionAttempts[s.revealed]=previous;
                if(previous.correct){s.questionApproved=s.revealed;save();renderLesson();announce('Обоснование выбрано. Прочитай основания и выполни построение.');}
                else {markMistake(lesson,s);renderLesson();announce('Это основание не подтверждает действие. Проверь принадлежность точек и условие применяемого свойства.');}
              },selected?'incorrect':'',{'data-reason-choice':index,'aria-pressed':selected});b.append(math(option));choices.append(b);
            });
            questionBox.append(choices);
            if(attempt && !attempt.correct)questionBox.append(para('Это основание не подтверждает действие. Проверь принадлежность точек и условие применяемого свойства. Можно исправить выбор или открыть подсказку.','feedback retry'));
          }
          box.append(questionBox);
        } else {
        if (plane.description && !lesson.steps.slice(0, s.revealed).some(old => old.plane === step.plane)) box.append(para(plane.description, 'plane-definition'));
        box.append(para(step.reason, 'membership'), para(step.action, 'action-text'));
        if(question && s.mode==='practice' && question.explanation && !guidanceFor(lesson))box.append(para(question.explanation,'reason-explanation'));
        if (step.note) box.append(para(step.note, 'step-note'));
        box.append(button((step.segments || []).length ? 'Выполнить построение' : 'Выполнить этот шаг', () => {
          if (s.mode === 'practice' && s.approved !== s.revealed) return;
          if(s.mode==='practice' && question && s.questionApproved!==s.revealed)return;
          if (s.mode === 'study') s.workedSeen = true;
          if (s.mode === 'practice' && !s.workedSeen && !s.helpUsed && !s.resultSeen) s.independentSteps += 1;
          s.revealed += 1; s.viewCount = s.revealed; s.justBuilt = true; s.approved = -1; s.questionApproved=-1; save(true); renderLesson(); renderCatalog();
          announce('Шаг выполнен. ' + (s.revealed < lesson.steps.length ? 'Теперь выбираем плоскость следующего шага.' : 'Построение завершено.'));
        }, 'primary action-button', { 'data-action': 'construct' }));
        }
      }
      const hintIndex = s.revealed;
      const hint = details('Хочешь подсказку?', [para(step.hint || step.reason)], () => {
        s.helpUsed = true; s.hintOpen[hintIndex] = true; if (!s.hints.includes(hintIndex)) s.hints.push(hintIndex); save(); refreshStatus(lesson, s);
      }, !!s.hintOpen[hintIndex]);
      hint.addEventListener('toggle', () => { s.hintOpen[hintIndex] = hint.open; save(); });
      hint.classList.add('step-hint'); box.append(hint); panel.append(box);
    }
    const nav = el('div', { class: 'step-navigation' });
    nav.append(button('Предыдущий вид', () => { s.viewCount = Math.max(0, s.viewCount - 1); save(); renderLesson(); }, 'ghost', { disabled: s.viewCount === 0 }));
    nav.append(button(s.mode === 'practice' ? 'Перейти к разбору' : 'Проверить себя', () => {
      s.mode = s.mode === 'practice' ? 'study' : 'practice'; if (s.mode === 'study') s.workedSeen = true;
      s.approved = -1; s.questionApproved=-1; save(); renderLesson();
    }, 'ghost'));
    if (s.revealed) nav.append(button('Начать построение заново', () => { s.revealed = 0; s.viewCount = 0; s.justBuilt = false; s.approved = -1; s.questionApproved=-1; s.planeAttempts={};s.questionAttempts={}; s.calculationRevealed=0; s.showResult = false; s.independentSteps = 0; s.mode = 'choose'; save(); renderLesson(); renderCatalog(); }, 'ghost', { 'data-action': 'restart' }));
    if (guidanceFor(lesson)) { const extra=details('Повторить или сменить способ',[nav]);extra.classList.add('starter-repeat');panel.append(extra); } else panel.append(nav);
    panel.append(para(modeNote(s,lesson), 'mode-note'));
  }

  function renderHistory(lesson, s, planes) {
    const section = el('section', { class: 'history', 'aria-label': 'Предыдущие шаги решения' });
    section.append(el('h3', {}, guidanceFor(lesson)?'Что уже сделали':'Ход построения'));
    if (!s.revealed) { section.append(para('Здесь будут оставаться выполненные шаги. Предыдущие объяснения не исчезают.', 'history-empty')); return section; }
    const list = el('ol', { class: 'history-list' });
    lesson.steps.slice(0, s.revealed).forEach((step, i) => {
      const item = el('li', { class: 'history-step' + (i === s.viewCount - 1 ? ' current-history' : ''), 'data-history-step': i + 1 });
      item.append(el('strong', {}, (i + 1) + '. ' + step.title), para('Плоскость: ' + (planes.get(step.plane)?.label || step.plane), 'history-plane'), para(step.reason), para(step.action));
      if (step.note) item.append(para(step.note, 'small muted'));
      item.append(button('Посмотреть этот шаг на модели', () => { s.viewCount = i + 1; save(); renderLesson(); document.querySelector('.model-frame').scrollIntoView({ block: 'start', behavior: 'auto' }); }));
      list.append(item);
    });
    section.append(list); return section;
  }

  function renderCalculations(lesson,s) {
    const steps=lesson.calculationSteps || [],section=el('section',{class:'calculations history',id:'calculation-steps','aria-label':'Вычисления и доказательство'});
    section.append(el('h3',{},'Вычисления и доказательство'),para('Открыто '+s.calculationRevealed+' из '+steps.length+' шагов. '+(lesson.result?.numeric?'Численный ответ можно проверить самостоятельно в поле ниже.':'Сначала запиши своё рассуждение в черновике.'),'small muted'));
    const list=el('ol',{class:'history-list calculation-list'});
    steps.slice(0,s.calculationRevealed).forEach((step,index)=>{
      const item=el('li',{class:'calculation-step history-step','data-calculation-step':index+1});
      item.append(el('strong',{},(index+1)+'. '+(typeof step==='object' && step.title?step.title:'Разбор шага')));
      if(typeof step==='string')item.append(para(step));
      else {
        const seen=new Set();
        for(const field of ['text','body','reason','expression','formula','action','explanation','conclusion']) {
          const entries=Array.isArray(step[field])?step[field]:[step[field]];
          for(const text of entries)if(typeof text==='string' && text.trim() && !seen.has(text)) {
            seen.add(text);item.append(para(text,['expression','formula'].includes(field)?'calculation-expression':''));
          }
        }
      }
      list.append(item);
    });
    if(s.calculationRevealed)section.append(list);
    if(s.calculationRevealed<steps.length) {
      if(s.mode==='practice')section.append(para('Открытие готового шага сохранится как помощь. Свой ход вычислений можно записать в черновике.','teacher-note'));
      section.append(button('Открыть шаг '+(s.calculationRevealed+1)+' из '+steps.length,()=>{
        s.calculationRevealed+=1;s.calculationSeen=true;
        if(s.mode==='practice')markHelp(lesson.id,'Просмотр вычислений и доказательства');else s.workedSeen=true;
        save();renderLesson();renderCatalog();announce('Открыт шаг вычислений '+s.calculationRevealed+'. Предыдущие шаги сохранены.');
      },'primary calculation-next',{'data-action':'next-calculation'}));
    } else section.append(para('Разбор вычислений открыт полностью. Объясни переходы своими словами и проверь итог ниже.','small'));
    return section;
  }

  function renderBottom(lesson, s) {
    const bottom = el('div', { class: 'task-bottom' });
    const ready = !recallVisible(lesson,s) && s.revealed === lesson.steps.length && s.revealed > 0;
    const calculationsReady=s.calculationRevealed===(lesson.calculationSteps || []).length;
    if (ready) {
      const result = el('section'); result.append(el('h3', {}, guidanceFor(lesson)?'Что получилось':'Проверка результата'));
      if (lesson.result?.numeric) {
        const num = lesson.result.numeric;
        const form = el('form', { class: 'answer-form' });
        const label = el('label', { for: 'numeric-answer' }, num.prompt || ('Введи численный результат' + (num.unit ? ' (' + num.unit + ')' : '')));
        const row = el('div', { class: 'input-row' });
        const input = el('input', { id: 'numeric-answer', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-describedby': 'answer-format', maxlength: 120 }); input.value = s.answer;
        input.addEventListener('input', () => { s.answer = input.value.slice(0, 120); s.answerChecked = false; s.correctAnswer = false; s.answerInvalid = false; save(); drawFeedback(); });
        const submit = button('Проверить', checkAnswer, 'primary', { 'data-action': 'check-numeric-answer' }); row.append(input, submit);
        const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        const drawFeedback = () => {
          if (s.answerInvalid) { feedback.className = 'feedback retry'; feedback.textContent = 'Введи число (например, 1,33) или обычную дробь вида 4/3. Корень можно вычислить и ввести десятичное приближение.'; return; }
          if (!s.answerChecked) { feedback.className = 'feedback'; feedback.textContent = ''; return; }
          feedback.className = 'feedback ' + (s.correctAnswer ? 'good' : 'retry');
          feedback.textContent = s.correctAnswer ? 'Численный результат совпал. Теперь объясни вычисления и построение.' : 'Пока результат не совпал. Проверь искомую величину, отношения отрезков и единицы.';
        };
        function checkAnswer() {
          const value = numericValue(input.value);
          if (!Number.isFinite(value)) { s.answer = input.value.slice(0, 120); s.answerInvalid = true; s.answerChecked = false; s.correctAnswer = false; save(); drawFeedback(); return; }
          s.answer = input.value.slice(0, 120); s.answerInvalid = false; s.answerChecked = true; s.correctAnswer = Math.abs(value - num.value) <= (num.tolerance || 1e-6);
          if (!s.correctAnswer) markMistake(lesson,s); else { save(true); refreshStatus(lesson,s); }
          drawFeedback();
        }
        // Cabinet frames forbid native form submission; checking stays local.
        input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); checkAnswer(); } });
        form.addEventListener('submit', e => { e.preventDefault(); checkAnswer(); });
        const toleranceText = num.tolerance && num.tolerance >= .001 ? ' Достаточно приближения с указанной в условии точностью.' : '';
        form.append(label, row, para('Введи число' + (num.unit ? ' в единицах «' + num.unit + '»' : '') + '; запятая, точка и дробь вида 4/3 допустимы.' + toleranceText, 'answer-format'), feedback);
        form.querySelector('.answer-format').id = 'answer-format'; drawFeedback(); result.append(form);
      }
      if (lesson.result?.text && calculationsReady) {
        const d = details('Показать вывод и ответ', [para(lesson.result.text)], () => {
          s.resultSeen = true; s.helpUsed = true; s.showResult = true; save(); refreshStatus(lesson, s);
          const caption = document.querySelector('.model-caption'); if (caption) updateScene(lesson, s, caption);
        }, s.showResult); d.classList.add('result-details');
        d.addEventListener('toggle', () => { if (!d.open) { s.showResult = false; save(); const caption = document.querySelector('.model-caption'); if (caption) updateScene(lesson, s, caption); } });
        result.append(d);
      } else if(lesson.result?.text && !calculationsReady) {
        result.append(para('Готовый вывод появится после последовательного разбора решения.'+(lesson.result?.numeric?' До этого можно проверить свой численный ответ.':''),'teacher-note'));
      }
      result.append(para(guidanceFor(lesson)?'Объясни свой ответ вслух. Можно рассказать преподавателю или записать ниже.':'Совпадение ответа не проверяет доказательство. Для полного решения объясни, почему каждая линия лежит в названной плоскости.', 'teacher-note'));
      bottom.append(result);
      if (lesson.check) {
        const check = lesson.check;
        const section = el('section',guidanceFor(lesson)?{id:'starter-check'}:{}); section.append(el('h3', {}, guidanceFor(lesson)?'Один короткий вопрос':'Проверь понимание'), para(check.question));
        const options = el('div', { class: 'check-options', role: 'group', 'aria-label': check.question });
        const feedback = el('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
        function feedbackText() {
          if (s.selectedCheck < 0) return;
          feedback.className = 'feedback ' + (s.checkCorrect ? 'good' : 'retry');
          feedback.replaceChildren(math(s.checkCorrect ? 'Верно. ' + check.explanation : 'Пока неверно. Сверь выбранное утверждение с условием и своим построением. Можно исправить ответ самостоятельно.'));
        }
        check.options.forEach((option, index) => {
          const b = button('', () => {
            s.selectedCheck = index; s.checkCorrect = index === check.correct;
            if (!s.checkCorrect) markMistake(lesson,s);
            save(s.checkCorrect); refreshStatus(lesson, s); [...options.children].forEach((node, j) => node.classList.toggle('selected', j === index)); feedbackText();
          }, s.selectedCheck === index ? 'selected' : '', { 'data-check-option': index }); b.append(math(option)); options.append(b);
        }); feedbackText(); section.append(options, feedback); if (guidanceFor(lesson)) bottom.prepend(section); else bottom.append(section);
      }
      if(lesson.takeaway && calculationsReady) {
        const takeaway=el('section',{class:'takeaway wide'});takeaway.append(el('h3',{},guidanceFor(lesson)?'Запомним одну идею':'Что взять в следующую задачу'));
        (Array.isArray(lesson.takeaway)?lesson.takeaway:[lesson.takeaway]).forEach(text=>takeaway.append(para(text)));
        bottom.append(takeaway);
      }
    }
    const draft = el('section', { class: ready && lesson.check ? 'wide' : '' });
    draft.append(el('h3', {}, 'Мои рассуждения'), el('label', { for: 'proof-draft' }, 'Запиши плоскости, основания построений и вычисления'));
    const area = el('textarea', { id: 'proof-draft', maxlength: board ? 2000 : 30000, placeholder: 'Например: работаю в плоскости … . Точки … и … лежат в ней, потому что … .' }); area.value = s.draft;
    area.addEventListener('input', () => { s.draft = area.value.slice(0, board ? 2000 : 30000); save(); });
    draft.append(area, para(board ? 'Черновик виден участникам общего разбора. При выборе другой карточки начинается новая работа.' : 'Черновик сохраняется при переходе к другой задаче и после обновления страницы. Его проверяет преподаватель.', 'teacher-note'));
    if(lesson.proofChecklist?.length) {
      const list=el('div',{class:'proof-checklist'});
      list.append(el('h4',{},'Самопроверка записи'),para('Эти отметки — памятка для тебя. Они не оценивают правильность доказательства.','teacher-note'));
      lesson.proofChecklist.forEach((text,index)=>{
        const label=el('label'),check=el('input',{type:'checkbox',checked:!!s.proofChecks[index],'data-proof-check':index});
        check.addEventListener('change',()=>{s.proofChecks[index]=check.checked;save();});
        const words=el('span');words.append(math(text));label.append(check,words);list.append(label);
      });
      draft.append(list);
    }
    if (guidanceFor(lesson)) { const optional=details('Моя запись — можно ответить устно',[draft],null,s.draftOpen);optional.classList.add('starter-draft');optional.addEventListener('toggle',()=>{s.draftOpen=optional.open;save();});bottom.append(optional); } else bottom.append(draft); return bottom;
  }

  function getSharedState() {
    const lesson = lessonMap.get(state.current), work = JSON.parse(JSON.stringify(taskState(lesson)));
    work.draft = board.encodeText(work.draft); work.answer = board.encodeText(work.answer);
    work.helpReasons = work.helpReasons.map(board.encodeText);
    return { version: 1, courseId: 'sections-from-zero', route: 'lessons', lessonId: state.current, work,
      catalog: { query: board.encodeText(catalogQuery), module: catalogFilter, level: catalogLevel, origin: catalogOrigin,
        open: !!document.querySelector('.catalog')?.open },
      ui: { principleOpen: !!document.querySelector('.principle')?.open, modeOptionsOpen: !!document.querySelector('.starter-other-mode')?.open,
        repeatOptionsOpen: !!document.querySelector('.starter-repeat')?.open, metadataOpen: !!document.querySelector('.starter-metadata')?.open }
    };
  }
  function applySharedState(value) {
    if (!board.validateState(value)) throw new TypeError('Invalid sections board state');
    if (JSON.stringify(getSharedState()) === JSON.stringify(value)) return;
    clearTimeout(boardSettle); boardApplying = true;
    try {
      const copy = JSON.parse(JSON.stringify(value)), work = copy.work;
      work.draft = board.decodeText(work.draft); work.answer = board.decodeText(work.answer);
      work.helpReasons = work.helpReasons.map(board.decodeText);
      state.current = copy.lessonId; state.tasks = { [copy.lessonId]: work };
      catalogQuery = board.decodeText(copy.catalog.query); catalogFilter = copy.catalog.module;
      catalogLevel = copy.catalog.level; catalogOrigin = copy.catalog.origin;
      renderLesson(); renderCatalog();
      document.getElementById('catalog-query').value = catalogQuery;
      document.querySelector('select[aria-label="Раздел курса"]').value = catalogFilter;
      document.querySelector('[data-catalog-filter="level"]').value = catalogLevel;
      document.querySelector('[data-catalog-filter="origin"]').value = catalogOrigin;
      document.querySelector('.catalog').open = catalogOpen = copy.catalog.open;
      for (const [key, selector] of Object.entries({ principleOpen: '.principle', modeOptionsOpen: '.starter-other-mode',
          repeatOptionsOpen: '.starter-repeat', metadataOpen: '.starter-metadata' })) {
        const element = document.querySelector(selector); if (element) element.open = copy.ui[key];
      }
      history.replaceState(null, '', '#' + encodeURIComponent(copy.lessonId)); save();
    } finally {
      // Setting <details open> queues native toggle events. Keep remote renders
      // muted through their settlement, while the session preserves real input.
      boardSettle = setTimeout(() => { boardApplying = false; }, 0);
    }
  }

  try {
    if (!board && current==='starter-18' && new URLSearchParams(location.search).get('warmup')==='1') {
      const s=taskState(lessonMap.get(current));
      s.recall=defaultRecall(1); s.camera.yaw=wrapYaw(s.camera.yaw+Math.PI/2);
      const url=new URL(location.href); url.searchParams.delete('warmup');
      history.replaceState(null,'',url.href);
      save();
    }
    renderShell();
    const publicLessons=frozenCopy(C.lessons),publicLessonMap=new Map(publicLessons.map(lesson=>[lesson.id,lesson]));
    window.SECTIONS_APP = Object.freeze({
      getState: () => JSON.parse(JSON.stringify(state)),
      selectLesson: id => switchLesson(id, false),
      supportsConstruction,
      startConstruction,
      getConstructionPlan:id=>frozenCopy(constructionPlan(lessonMap.get(id))),
      checkConstructionAction:(id,index,selection)=>frozenCopy(validateConstructionAction(lessonMap.get(id),index,selection)),
      checkConstructionBoundary:(id,names)=>frozenCopy(validateConstructionBoundary(lessonMap.get(id),names)),
      lessons:publicLessons,
      getCurrentLesson:()=>publicLessonMap.get(state.current),
      createScene:(container,lesson,onCamera)=>new Scene(container,lesson,onCamera),
      markHelp
    });
    if (board) {
      document.documentElement.dataset.sectionsView = 'lessons';
      board.attach({getState:getSharedState, applyState:applySharedState, isApplying:()=>boardApplying, numericValue});
      board.start();
    }
  } catch (error) {
    const box = el('div', { class: 'app-error' }); box.append(el('h2', {}, 'Не удалось открыть эту карточку'), para('Проверь, что файл курса сохранён целиком. Техническая причина: ' + error.message)); host.replaceChildren(box);
    throw error;
  }
})();

/* Pure data and exact-coordinate activities. No network, eval or dependencies. */
(function (root) {
  'use strict';
  const topics = [
    ['incidence','Выбрать рабочую плоскость','Две точки → общая плоскость → линия.'],
    ['trace','След и вспомогательная точка','Не путать прямую ребра с конечным ребром.'],
    ['projection','Вспомогательная плоскость','Полностью задать точку и перенести принадлежность.'],
    ['ratio','Отношения отрезков','Доля целого, отношения и точка деления.'],
    ['similarity','Подобие, площадь, объём','Различать коэффициенты k, k² и k³.'],
    ['area','Площади и длины','Плоская фигура внутри пространственной задачи.'],
    ['angles','Углы и перпендикуляры','Выбирать нужную проекцию и два перпендикуляра.'],
    ['coordinates','Координаты и параметр ребра','Подстановка, линейная интерполяция, 0≤t≤1.'],
    ['proof','Проверить доказательство','Находить пропущенное условие и неверный вывод.'],
    ['strategy','Выбрать следующий шаг','Планировать построение, сравнивать методы.'],
    ['topology','Форма и полнота сечения','Считать разные вершины, учитывать границы и касания.'],
    ['fluency','Вычислительная разминка','Дроби, теорема Пифагора, простые преобразования.']
  ].map(([id,title,description])=>({id,title,description}));
  const rand = seed => {let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};};
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0), sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), mul=(a,s)=>a.map(v=>v*s), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>Math.hypot(...a), unit=a=>mul(a,1/norm(a));
  const f=n=>Number(n.toFixed(4)).toString().replace('.',','), display=s=>s.replace(/[0-9]+/g,m=>m.replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]));
  const frac=(a,b)=>'[[frac:'+a+'|'+b+']]';
  const edgesOf=faces=>{const seen=new Set(),out=[];for(const vs of faces)for(let i=0;i<vs.length;i++){const e=[vs[i],vs[(i+1)%vs.length]],k=e.slice().sort().join('|');if(!seen.has(k)){seen.add(k);out.push(e);}}return out;};
  function solid(kind='cube',height=1) {
    let points,faces;
    if(kind==='tetra') {
      points={A:[0,0,0],B:[1,0,0],C:[0,1,0],S:[0,0,1]};faces=[['A','B','C'],['S','A','B'],['S','B','C'],['S','C','A']];
    } else if(kind==='pyramid') {
      points={A:[-1,-1,0],B:[-1,1,0],C:[1,1,0],D:[1,-1,0],S:[0,0,2]};faces=[['A','B','C','D'],['S','A','B'],['S','B','C'],['S','C','D'],['S','D','A']];
    } else {
      const shift=kind==='oblique'?.5:0;
      points={A:[0,0,0],B:[0,1,0],C:[1,1,0],D:[1,0,0],A1:[shift,0,height],B1:[shift,1,height],C1:[1+shift,1,height],D1:[1+shift,0,height]};
      faces=[['A','B','C','D'],['A1','B1','C1','D1'],['A','A1','B1','B'],['B','B1','C1','C'],['C','C1','D1','D'],['D','D1','A1','A']];
    }
    const fs=faces.map(v=>({id:v.join(''),label:'('+v.map(display).join('')+')',vertices:v,description:'Плоскость грани '+v.map(display).join('')+'. Вершины тела уже заданы.'}));
    return {points,faces:fs,planes:fs.map(x=>({...x})),edges:edgesOf(faces),given:[]};
  }
  const logic = {
    trace:[
      ['Прямые MN и AB пересеклись в T за концом ребра AB. Что можно заключить?',['T не принадлежит плоскости основания.','T принадлежит прямой AB и её плоскости; принадлежность самому ребру проверяем отдельно.','T обязательно вершина сечения.'],1,'Плоскость содержит всю прямую, а не только ребро.','Вспомогательная точка может лежать вне тела. Для вершины сечения нужно попадание на его поверхность.'],
      ['След секущей на основании параллелен AB. Можно ли искать их конечную точку пересечения?',['Да, если сильнее продлить.','Нет: в евклидовой геометрии параллельные различные прямые не пересекаются.','Да, их изображения должны пересечься.'],1,'Проверь параллельность до поиска точки.','Используй другое ребро, параллельность следов или вспомогательную плоскость; не создавай фиктивную точку.'],
      ['T лежит на уже построенном следе α∩β и на прямой общего ребра плоскостей β и γ. Что верно?',['T принадлежит α и γ.','T обязательно лежит внутри ребра.','Любая точка γ принадлежит α.'],0,'Проследи две независимые цепочки принадлежности.','Из T∈α∩β следует T∈α. Из принадлежности прямой общего ребра β,γ следует T∈γ.'],
      ['M∈α∩β и N∈α∩β, M≠N. Плоскости α,β различны. Чему равно их пересечение?',['Прямой MN.','Только отрезку MN.','Любой плоскости через MN.'],0,'Пересечение двух различных плоскостей — прямая.','Конечный отрезок станет стороной сечения лишь после ограничения гранью тела.']
    ],
    projection:[
      ['Внутри изображения призмы поставлена точка M без других условий. Однозначно ли задана пространственная точка?',['Да, её видно.','Нет: нужны дополнительные пространственные данные, например вторичная проекция и связь с ней.','Да, если точка красная.'],1,'Одна экранная отметка может изображать разные точки пространства.','Для внутренней точки укажи, на какой линии или в какой плоскости она лежит, либо задай проекцию и направление.'],
      ['M лежит на явно названной плоской грани. Нужно ли всегда давать ещё и вторичную проекцию, чтобы понять M?',['Да, без исключений.','Нет: принадлежность грани уже задаёт её плоскость; при невырожденном изображении точку в этой грани можно определить.','Нет: можно вообще не указывать грань.'],1,'Различай внутреннюю точку тела и точку известной грани.','Дополнительные данные требуются при пространственной неоднозначности; точку известной грани можно проецировать уже после её задания.'],
      ['В прямой призме MM₀ ∥ AA₁, M₀ лежит в основании. Через M,M₀,N₀ задана вспомогательная плоскость. Почему NN₀ ∥ AA₁ через N₀ лежит в ней?',['Плоскость содержит MM₀ и N₀ вне неё; прямая через N₀, параллельная MM₀, принадлежит ей.','Потому что NN₀ вертикальна на экране.','Любая прямая через N₀ лежит в плоскости.'],0,'Используй точку и направление внутри заданной плоскости.','Теперь M,N и их вторичные проекции можно связывать плоскими построениями в одной конкретной плоскости.'],
      ['При параллельном проецировании что сохраняется для отрезков одной прямой, если проекция невырождена?',['Отношение длин этих отрезков.','Все пространственные углы.','Все абсолютные длины.'],0,'Не путай аффинные и метрические свойства.','Параллельная проекция сохраняет отношения на одной прямой, но обычно искажает длины и углы.']
    ],
    proof:[
      ['Ученик пишет: «Прямые лежат в разных плоскостях, значит не пересекаются». Что не так?',['Принадлежность разным плоскостям не исключает общей точки.','Любые две пространственные прямые пересекаются.','Разные плоскости всегда параллельны.'],0,'Например, AB и BC лежат в разных боковых гранях куба, но имеют B.','Нужно доказать невозможность общей точки: например, принадлежность различным параллельным плоскостям.'],
      ['Прямая l перпендикулярна одной прямой m плоскости α. Следует ли l⊥α?',['Да.','Нет: нужен полный признак с двумя пересекающимися прямыми α.','Да, если m длинная.'],1,'Один перпендикуляр не определяет нормаль плоскости.','Проверяем l⊥m, l⊥n, m,n⊂α, m∩n существует.'],
      ['На модели сечение выглядит ромбом. Что является доказательством?',['Равенство четырёх сторон, выведенное из условия.','Похожий вид на одном ракурсе.','Равные экранные расстояния.'],0,'Измерение в перспективе не переносится в пространство.','Найди стороны в гранях и обоснуй их равенство, например по средним линиям или теореме Пифагора.'],
      ['Ломаная замкнута, каждое её звено лежит на грани. Достаточно ли этого?',['Нет: все звенья ещё должны принадлежать одной секущей плоскости и образовывать полную границу.','Да, всегда.','Достаточно любых трёх звеньев.'],0,'Замкнутая пространственная ломаная может быть неплоской.','Проверь принадлежность общей плоскости, расположение вершин на рёбрах и отсутствие пропущенных частей границы.'],
      ['Для двугранного угла построены два отрезка из одной точки его ребра. Что ещё обязательно?',['Оба должны лежать каждый в своей грани и быть перпендикулярны ребру.','Достаточно одного перпендикуляра.','Достаточно одинаковой длины.'],0,'Линейный угол имеет точное определение.','Только два перпендикуляра к ребру, построенные в соответствующих полуплоскостях, дают нужный линейный угол.'],
      ['Три точки A,M,B лежат на одной прямой. Ученик называет единственную плоскость (AMB). Верно ли это?',['Нет: три коллинеарные точки не определяют единственную плоскость.','Да: любые три буквы определяют плоскость.','Верно только для куба.'],0,'В аксиоме есть условие «не лежат на одной прямой».','Укажи третью точку вне AB или две пересекающиеся прямые.']
    ],
    strategy:[
      ['Две данные точки секущей лежат на одной грани. Какой первый шаг обоснован?',['Назвать плоскость этой грани и провести прямую через эти точки.','Соединить все данные точки замкнутой ломаной.','Нарисовать предполагаемый многоугольник по виду.'],0,'Начни с двух известных общих точек двух плоскостей.','После первой линии ищи её пересечения с рёбрами или их продолжениями внутри той же плоскости.'],
      ['Основной след оказался далеко от тела и ухудшает читаемость. Что разумно?',['Проверить вспомогательное сечение или параллельные следы как другой законный путь.','Перенести точку ближе вручную.','Признать задачу неразрешимой.'],0,'Способ решения можно менять, геометрию — нельзя.','Сравни методы: каждый должен дать ту же плоскость и тот же многоугольник. Длина чертежа не заменяет доказательства.'],
      ['Нужна точка l∩α, а у l нет очевидной общей грани с исходными точками α. Как действовать?',['Ввести содержащую l вспомогательную плоскость β, построить α∩β и пересечь с l внутри β.','Пересечь изображения l и произвольного ребра.','Провести l сразу в α.'],0,'Создай конкретную общую плоскость для будущего пересечения прямых.','Последнее действие станет обычным плоским пересечением двух прямых β.'],
      ['После построения сечения требуется его площадь. Какой переход полезен?',['Выделить плоскую фигуру сечения, доказать её свойства и найти необходимые длины.','Измерить закрашенную область экрана.','Перемножить любые два ребра тела.'],0,'Сначала выясни тип фигуры и нужную формулу.','Прямоугольность, равенство сторон, высота трапеции и масштаб подобия требуют обоснования.']
    ],
    topology:[
      ['Сколько сторон максимально у невырожденного сечения тетраэдра?',['Три.','Четыре.','Шесть.'],1,'У тетраэдра четыре выпуклые грани.','Каждая грань даёт не более одной стороны; поэтому верхняя граница — четыре.'],
      ['Плоскость пересекает три рёбра, выходящие из одной вершины, в одной и той же вершине. Сколько разных точек получено?',['Три.','Одну.','Зависит от цвета.'],1,'Считай точки, а не записи пересечения с рёбрами.','Совпадающие координаты и одна пространственная вершина не становятся тремя вершинами многоугольника.'],
      ['У выпуклой n-угольной призмы сколько граней и, следовательно, какова верхняя граница числа сторон сечения?',['n.','n+2.','2n.'],1,'Добавь к боковым граням два основания.','У призмы n боковых граней и два основания; одна грань даёт не более одной стороны.'],
      ['Камера повернулась, и две подписи поменялись местами. Изменилось ли сечение?',['Нет: изменилось только изображение.','Да: появилась новая вершина.','Да: изменились длины.'],0,'Разделяй преобразование вида и изменение геометрических данных.','Настоящее изменение сечения требует изменения плоскости или тела.'],
      ['Плоскость совпадает с гранью куба. Как описать результат точно?',['Пересечение — квадратная грань; это опорный, предельный случай.','Пересечения нет.','Это всегда внутренний разрез куба.'],0,'Проверь, есть ли точки тела по обе стороны плоскости.','При совпадении с гранью весь куб расположен в одном замкнутом полупространстве.']
    ]
  };
  function shuffled(q,rng) {
    if(q.kind!=='choice')return q;
    const entries=q.options.map((text,i)=>({text,yes:i===q.answer}));
    for(let i=entries.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];}
    return {...q,options:entries.map(x=>x.text),answer:entries.findIndex(x=>x.yes)};
  }
  function makeDrill(topic,index=0) {
    index=Number.isFinite(Number(index))?Math.max(0,Math.floor(Number(index))):0;
    if(!topics.some(t=>t.id===topic))topic='incidence';
    const seed=Array.from(topic).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),17)+Math.imul(index+1,104729),rng=rand(seed),pick=(a,b)=>a+Math.floor(rng()*(b-a+1));
    const base={id:topic+'-'+index,topic,index,tolerance:.00051,unit:'',hint:'Назови известные величины и нужное правило.',rule:'Сначала объяснение, затем действие.',steps:[]};let q;
    if(topic==='incidence') {
      const m=solid(),faces=m.faces,face=faces[index%faces.length],vs=face.vertices,a=vs[0],b=vs[1],c=vs[vs.length-1],t=pick(2,8)/10,u=pick(2,8)/10;
      m.points.M=add(m.points[a],mul(sub(m.points[b],m.points[a]),t));m.points.N=add(m.points[a],mul(sub(m.points[c],m.points[a]),u));m.given=['M','N'];
      const scene={id:'drill-'+index,title:'Рабочая плоскость',model:m,steps:[{plane:face.id,points:[],segments:[{a:'M',b:'N',kind:'helper'}],reason:'M и N принадлежат одной указанной грани.',action:'Проводим MN в '+face.label+'.'}],result:{}};
      q={kind:'choice',prompt:'В кубе M∈'+display(a+b)+', N∈'+display(a+c)+'. В какой из названных плоскостей можно провести MN?',options:[face.label,faces[(index+2)%6].label,faces[(index+4)%6].label],answer:0,scene,scenePlane:face.id,hint:'Найди грань, которая содержит оба ребра.',rule:'Две точки прямой в плоскости ⇒ вся прямая в плоскости.',steps:['Ребро '+display(a+b)+' принадлежит '+face.label+'.','Ребро '+display(a+c)+' тоже принадлежит '+face.label+'.','Значит M,N∈'+face.label+' и MN лежит в ней.']};
    } else if(logic[topic]) {
      const item=logic[topic][index%logic[topic].length];q={kind:'choice',prompt:item[0],options:item[1].slice(),answer:item[2],hint:item[3],rule:item[4],steps:[item[3],item[4]]};
    } else if(topic==='ratio') {
      const p=pick(1,5),r=pick(1,6),k=pick(2,9),L=(p+r)*k,part=index%3;
      if(part===0)q={kind:'number',prompt:'M∈AB, AM:MB='+p+':'+r+', AB='+L+'. Найди AM.',answer:p*k,hint:'Целый отрезок содержит '+(p+r)+' равных частей.',rule:'Доля AM в AB равна '+frac(p,p+r)+'.',steps:['Всего частей: '+p+'+'+r+'='+(p+r)+'.','Одна часть: '+frac(L,p+r)+'='+k+'.','AM='+p+'·'+k+'='+p*k+'.']};
      else if(part===1)q={kind:'number',prompt:'M∈AB, AM:MB='+p+':'+r+'. В записи M=A+t(B−A) найди t. Ответ — дробь или число до тысячных.',answer:p/(p+r),otherAnswer:{value:p/r,message:'Это отношение AM к MB. В вопросе просят параметр t. Какой отрезок в записи задаёт полный шаг?'},hint:'t — доля AM от целого AB, не отношение AM к MB.',rule:'t=AM/AB.',steps:['AB состоит из '+(p+r)+' частей.','На AM приходится '+p+' частей.','t='+frac(p,p+r)+'≈'+f(p/(p+r))+'.']};
      else q={kind:'number',prompt:'M∈AB, AM='+p*k+', MB='+r*k+'. Во сколько раз AB больше AM? Ответ — дробь или число до тысячных.',answer:(p+r)/p,hint:'Сначала найди целый AB.',rule:'Не заменяй целый отрезок одной его частью.',steps:['AB='+p*k+'+'+r*k+'='+L+'.','Искомое отношение AB:AM='+frac(L,p*k)+'='+frac(p+r,p)+'.']};
    } else if(topic==='similarity') {
      const p=pick(1,3),r=p+pick(1,3),k=p/r,power=index%3+1,baseValue=Math.pow(r,power)*pick(2,5),names={1:'сторона',2:'площадь',3:'объём'},unit={1:'ед.',2:'кв. ед.',3:'куб. ед.'};
      q={kind:'number',prompt:'Сечение пирамиды параллельно основанию. Отношение расстояния от вершины до секущей к полной высоте равно '+p+':'+r+'. '+(power===3?'Объём исходной пирамиды':power===2?'Площадь основания':'Сторона основания')+' равен '+baseValue+'. Найди '+(power===3?'объём малой пирамиды у вершины':power===2?'площадь сечения':'соответствующую сторону сечения')+'.',answer:baseValue*Math.pow(k,power),unit:unit[power],hint:'Для '+names[power]+' коэффициент изменения равен k'+(power===1?'':power===2?'²':'³')+'.',rule:'Длины изменяются в k раз, площади — в k², объёмы — в k³.',steps:['k='+frac(p,r)+'.','Искомая величина = '+baseValue+'·('+frac(p,r)+')'+(power===1?'':power===2?'²':'³')+'.','Получаем '+f(baseValue*Math.pow(k,power))+' '+unit[power]]};
    } else if(topic==='area') {
      const a=pick(2,9),b=pick(2,8),h=pick(2,7),variant=index%4;
      if(variant===0)q={kind:'number',prompt:'В сечении доказан прямоугольный треугольник с катетами '+a+' и '+b+'. Найди его площадь.',answer:a*b/2,unit:'кв. ед.',hint:'Половина произведения перпендикулярных катетов.',rule:'S=ab/2.',steps:['Катеты перпендикулярны; один — основание, другой — высота.','S='+frac(a+'·'+b,2)+'='+f(a*b/2)+'.']};
      else if(variant===1)q={kind:'number',prompt:'Сечение — трапеция с основаниями '+a+' и '+(a+b)+' и высотой '+h+'. Найди площадь.',answer:(2*a+b)*h/2,unit:'кв. ед.',hint:'Высота — перпендикуляр к основаниям, не боковая сторона.',rule:'S=(a+b)h/2.',steps:['Сумма оснований: '+a+'+'+(a+b)+'='+(2*a+b)+'.','S='+frac((2*a+b)+'·'+h,2)+'='+f((2*a+b)*h/2)+'.']};
      else if(variant===2)q={kind:'number',prompt:'Сечение — равносторонний треугольник со стороной '+a+'√2. Найди площадь, округли до тысячных.',answer:a*a*Math.sqrt(3)/2,unit:'кв. ед.',hint:'Сначала возведи сторону в квадрат: (a√2)²=2a².',rule:'S=√3·сторона²/4.',steps:['('+a+'√2)²='+(2*a*a)+'.','S='+frac((2*a*a)+'√3',4)+'≈'+f(a*a*Math.sqrt(3)/2)+'.']};
      else q={kind:'number',prompt:'Площадь ортогональной проекции сечения равна '+a*b+'. Острый угол плоскостей равен 60°. Найди площадь самого сечения.',answer:2*a*b,otherAnswer:{value:a*b,message:'Ты указал площадь проекции. Вопрос про площадь самого сечения. Какая из этих фигур наклонена к плоскости проекции?'},unit:'кв. ед.',hint:'Площадь проекции равна S·cos60°, а не S/cos60°.',rule:'Sпроекции=S·cosφ, 0≤φ<90°.',steps:['cos60°=1/2.','S='+a*b+' ÷ '+frac(1,2)+'='+(2*a*b)+'.','Само сечение не меньше своей ортогональной проекции.']};
    } else if(topic==='angles') {
      const pairs=[[1,1],[1,Math.sqrt(3)],[Math.sqrt(3),1],[2,3],[3,4]], [vertical,projection]=pairs[index%pairs.length],k=pick(2,6),v=vertical*k,p=projection*k;
      q={kind:'number',prompt:'В плоскости, содержащей отрезок и его ортогональную проекцию на основание, получен прямоугольный треугольник. Перпендикулярная составляющая равна '+(vertical===Math.sqrt(3)?k+'√3':f(v))+', проекция — '+(projection===Math.sqrt(3)?k+'√3':f(p))+'. Найди угол отрезка с плоскостью в градусах до тысячных.',answer:Math.atan2(v,p)*180/Math.PI,otherAnswer:{value:Math.atan2(p,v)*180/Math.PI,message:'Это угол с перпендикуляром к плоскости. Вопрос про угол отрезка с самой плоскостью. Где на чертеже его вершина и стороны?'},unit:'°',hint:'Угол прямой с плоскостью — угол с её ненулевой ортогональной проекцией.',rule:'tanφ=перпендикулярная составляющая / длина проекции.',steps:['tanφ='+frac(vertical===Math.sqrt(3)?k+'√3':f(v),projection===Math.sqrt(3)?k+'√3':f(p))+'.','φ=arctan('+frac(vertical===Math.sqrt(3)?k+'√3':f(v),projection===Math.sqrt(3)?k+'√3':f(p))+')≈'+f(Math.atan2(v,p)*180/Math.PI)+'°. Промежуточное отношение не округляем.', 'Угол с нормалью был бы дополнительным до 90°.']};
    } else if(topic==='coordinates') {
      const fA=pick(-6,4),fB=fA+pick(2,9),t=[-.5,.25,.5,.75,1.5][index%5],c=fA+t*(fB-fA);
      if(index%2===0)q={kind:'number',prompt:'На ребре AB значение линейного выражения F=ax+by+cz равно '+fA+' в A и '+fB+' в B. Плоскость задана F='+f(c)+'. Найди t в A+t(B−A).',answer:t,hint:'F(A+t(B−A))=F(A)+t(F(B)−F(A)).',rule:'t=(c−F(A))/(F(B)−F(A)); затем проверь 0≤t≤1.',steps:[fA+'+t·('+(fB-fA)+')='+f(c)+'.','t='+frac(f(c-fA),fB-fA)+'='+f(t)+'.',t<0||t>1?'Пересечение с продолжением, не с ребром.':'Точка лежит на конечном ребре.']};
      else q={kind:'choice',prompt:'При пересечении плоскости с прямой ребра AB получили t='+f(t)+' в A+t(B−A). Где точка?',options:['На конечном ребре AB.','На продолжении за A.','На продолжении за B.'],answer:t<0?1:t>1?2:0,hint:'У A параметр 0, у B параметр 1.',rule:'Ребро: 0≤t≤1; за A: t<0; за B: t>1.',steps:['Сравни '+f(t)+' с 0 и 1.',t<0?'Параметр отрицательный: за A.':t>1?'Параметр больше 1: за B.':'Параметр внутри [0;1]: на ребре.']};
    } else {
      const a=pick(2,8),b=pick(2,9),variant=index%3;
      if(variant===0)q={kind:'number',prompt:'В грани построен прямоугольный треугольник с катетами '+a+' и '+b+'. Найди гипотенузу до тысячных.',answer:Math.hypot(a,b),hint:'Складываются квадраты, не сами катеты.',rule:'c=√(a²+b²).',steps:['c²='+a+'²+'+b+'²='+(a*a+b*b)+'.','c=√'+(a*a+b*b)+'≈'+f(Math.hypot(a,b))+'.']};
      else if(variant===1)q={kind:'number',prompt:'Вычисли '+frac(a,b)+'·'+frac(b,a+1)+'. Введи обычную дробь или число до тысячных.',answer:a/(a+1),hint:'Сократи общий множитель '+b+' в числителе и знаменателе.',rule:'Умножаем числители и знаменатели, сокращаем общие ненулевые множители.',steps:[frac(a+'·'+b,b+'·'+(a+1))+'='+frac(a,a+1)+'.']};
      else q={kind:'number',prompt:'Длина стороны подобной фигуры уменьшилась в '+b+' раз. Площадь исходной фигуры '+(a*b*b)+'. Найди новую площадь.',answer:a,hint:'Для площади коэффициент длины нужно возвести в квадрат.',rule:'Sновая=Sисходная/b².',steps:[frac(a*b*b,b+'²')+'='+a+'.']};
    }
    return shuffled({...base,...q},rng);
  }
  const labFamilies=[
    {id:'cube-sum',title:'Куб · параллельное движение',kind:'cube',normal:[1,1,1],initial:1.5,description:'Единичный куб: AD — x, AB — y, AA₁ — z. Исследуй x+y+z=t. Отличай изменение плоскости от поворота камеры.',question:'На каких уровнях треугольник превращается в шестиугольник? Что происходит точно на границе?'},
    {id:'cube-weighted',title:'Куб · от трёх до шести сторон',kind:'cube',normal:[2,3,4],initial:4.5,description:'Единичный куб. Плоскости 2x+3y+4z=t параллельны друг другу. Не делай вывод о форме только по числу заданных точек.',question:'Найди интервалы с 3,4,5,6 сторонами. Почему критические значения связаны с вершинами куба?'},
    {id:'cube-horizontal',title:'Куб · внутреннее сечение и касание',kind:'cube',normal:[0,0,1],initial:.5,description:'Исследуем z=t: параллельные основаниям плоскости.',question:'Как отличить квадрат внутри куба от совпадения с его гранью? Когда пересечение пусто?'},
    {id:'tetra-parallel',title:'Тетраэдр · подобие и степени',kind:'tetra',normal:[0,0,1],initial:.4,description:'A(0;0;0), B(1;0;0), C(0;1;0), S(0;0;1). Сечение z=t параллельно ABC.',question:'Почему площади изменяются как (1−t)², а объём малой пирамиды — как (1−t)³?'},
    {id:'tetra-oblique',title:'Тетраэдр · треугольник или четырёхугольник',kind:'tetra',normal:[1,-1,1],initial:.4,description:'Тот же тетраэдр; теперь x−y+z=t. Не всякое сечение тетраэдра треугольное.',question:'Найди четырёхугольник. Докажи, почему пятиугольника быть не может.'},
    {id:'pyramid-parallel',title:'Пирамида · сечение и отсечённый объём',kind:'pyramid',normal:[0,0,1],initial:1,description:'Квадратное основание: −1≤x,y≤1, z=0. Вершина S(0;0;2). Сечение z=t.',question:'Если расстояние до вершины уменьшилось вдвое, во сколько раз уменьшились сторона, площадь и объём?'},
    {id:'pyramid-vertical',title:'Пирамида · плоскость проходит мимо вершины',kind:'pyramid',normal:[1,0,0],initial:.3,description:'Плоскости x=t перпендикулярны основанию квадратной пирамиды.',question:'Почему при t=0 сечение треугольное, а при 0<|t|<1 — четырёхугольное? Что при |t|=1?'},
    {id:'oblique-normal',title:'Косая призма · полное нормальное сечение',kind:'oblique',normal:[.5,0,1],initial:.8,description:'Основание — единичный квадрат. Боковое ребро v=(0,5;0;h). Секущая 0,5x+hz=t перпендикулярна боковым рёбрам.',question:'Когда сечение пересекает все четыре боковых ребра? Что меняется при малой высоте h?',height:true}
  ];
  function labBounds(familyId,height=1){const spec=labFamilies.find(x=>x.id===familyId)||labFamilies[0],m=solid(spec.kind,height),n=spec.height?[.5,0,height]:spec.normal,values=Object.values(m.points).map(p=>dot(n,p)),critical=[...new Set(values.map(x=>Number(x.toFixed(10))))].sort((a,b)=>a-b),span=Math.max(1,critical.at(-1)-critical[0]);return{min:critical[0]-.12*span,max:critical.at(-1)+.12*span,critical,normal:n};}
  function makeLab(familyId,level,height=1) {
    const spec=labFamilies.find(x=>x.id===familyId)||labFamilies[0],model=solid(spec.kind,height),n=spec.height?[.5,0,height]:spec.normal,t=Number(level),eps=1e-8,bodyNames=Object.keys(model.points),values=bodyNames.map(k=>dot(n,model.points[k])-t),hits=[];
    const nameAt=p=>{for(const [name,q]of Object.entries(model.points))if(norm(sub(p,q))<eps)return name;const pool='P Q R T U V W X Y Z E F G H J K L M N'.split(' ');const name=pool.find(x=>!model.points[x]);model.points[name]=p;return name;};
    for(const [a,b]of model.edges){const pa=model.points[a],pb=model.points[b],da=dot(n,pa)-t,db=dot(n,pb)-t;if(Math.abs(da)<eps)hits.push(a);if(Math.abs(db)<eps)hits.push(b);if(da*db<-eps*eps)hits.push(nameAt(add(pa,mul(sub(pb,pa),da/(da-db)))));}
    let polygon=[...new Set(hits)],dimension=polygon.length?0:-1;
    if(polygon.length>1)dimension=1;
    if(polygon.length>2){const a=model.points[polygon[0]],v=sub(model.points[polygon[1]],a);if(polygon.slice(2).some(k=>{const w=sub(model.points[k],a);return norm(w)>eps && norm(cross(v,w))>1e-9*norm(v)*norm(w);} ))dimension=2;}
    if(dimension===2){const center=mul(polygon.map(k=>model.points[k]).reduce(add,[0,0,0]),1/polygon.length),u=unit(sub(model.points[polygon[0]],center)),w=cross(unit(n),u);polygon.sort((a,b)=>Math.atan2(dot(sub(model.points[a],center),w),dot(sub(model.points[a],center),u))-Math.atan2(dot(sub(model.points[b],center),w),dot(sub(model.points[b],center),u)));}
    const positive=values.some(x=>x>eps),negative=values.some(x=>x<-eps),inside=positive&&negative;
    const classification=dimension<0?'Пустое пересечение':dimension===0?'Касание в точке':dimension===1?'Касание по отрезку':inside?'Внутреннее сечение · сторон: '+polygon.length:'Опорное пересечение: совпадение с гранью';
    const edgeRows=model.edges.map(([a,b])=>{const va=dot(n,model.points[a]),vb=dot(n,model.points[b]),den=vb-va;return {edge:display(a+b),from:va,to:vb,parameter:Math.abs(den)<eps?null:(t-va)/den,coplanar:Math.abs(den)<eps&&Math.abs(t-va)<eps};});
    const steps=model.faces.map(face=>{
      const fp=face.vertices.map(k=>model.points[k]),fn=unit(cross(sub(fp[1],fp[0]),sub(fp[2],fp[0]))),on=polygon.filter(k=>Math.abs(dot(fn,sub(model.points[k],fp[0])))<eps),all=face.vertices.every(k=>Math.abs(dot(n,model.points[k])-t)<eps);let segments=[];
      if(all&&dimension===2)segments=face.vertices.map((a,i)=>({a,b:face.vertices[(i+1)%face.vertices.length],kind:'section'}));
      else if(on.length===2)segments=[{a:on[0],b:on[1],kind:'section'}];
      const action=segments.length?'В '+face.label+' строим '+segments.map(s=>display(s.a+s.b)).join(', ')+'.':on.length?'В '+face.label+' получаем точку '+display(on[0])+', но отдельной стороны здесь нет.':'В этой грани пересечений нет: её вершины лежат строго по одну сторону уровня.';
      return {title:'Рассматриваем '+face.label,plane:face.id,reason:'Рабочая плоскость '+face.label+' определена вершинами этой грани. На каждом её ребре вычисляем параметр tребра=(уровень−F(A))/(F(B)−F(A)); берём только 0≤tребра≤1. Формулу деления используем при F(B)≠F(A). Если F(B)=F(A), всё ребро лежит в секущей при равенстве уровню, иначе пересечения нет. '+(all?'Все вершины грани удовлетворяют уравнению секущей.':segments.length?'Концы найденного отрезка удовлетворяют и уравнению секущей, и плоскости грани.':on.length?'Единственная общая точка не образует отдельной стороны в этой грани.':'Все значения в вершинах грани находятся строго по одну сторону уровня; внутри выпуклой грани нового пересечения нет.'),action,points:on,segments};
    });
    let area=0,perimeter=0;
    if(dimension===2){const p0=model.points[polygon[0]];for(let i=1;i<polygon.length-1;i++)area+=norm(cross(sub(model.points[polygon[i]],p0),sub(model.points[polygon[i+1]],p0)))/2;for(let i=0;i<polygon.length;i++)perimeter+=norm(sub(model.points[polygon[i]],model.points[polygon[(i+1)%polygon.length]]));}
    const extra=[];
    if(spec.id==='tetra-parallel'&&t>=0&&t<=1)extra.push({label:'Коэффициент подобия от вершины',value:1-t},{label:'Площадь по формуле',value:.5*(1-t)**2},{label:'Объём малой пирамиды',value:(1-t)**3/6});
    if(spec.id==='pyramid-parallel'&&t>=0&&t<=2)extra.push({label:'Коэффициент подобия от вершины',value:1-t/2},{label:'Площадь по формуле',value:4*(1-t/2)**2},{label:'Объём малой пирамиды',value:8/3*(1-t/2)**3});
    let normalInfo=null;
    if(spec.height){const low=.5,high=.25+height*height,parameters=['A','B','C','D'].map(k=>(t-.5*model.points[k][0])/high);normalInfo={low,high,exists:low<=high+eps,full:parameters.every(x=>x>=-eps&&x<=1+eps),parameters};}
    return {id:'lab-'+spec.id,title:spec.title,model,steps,result:dimension===2?{polygon}: {},spec,normal:n,level:t,height,classification,dimension,inside,polygon,area,perimeter,edgeRows,extra,normalInfo,equation:n.map((c,i)=>c?(Math.abs(c)===1?(c<0?'−':''):f(c)+'·')+['x','y','z'][i]:null).filter(Boolean).join(' + ').replaceAll('+ −','− ').replaceAll('+ -','− ')+' = '+f(t)};
  }
  const assessments=[
    {id:'entry',title:'Входная диагностика',description:'Пять коротких вопросов. Выясняем, с какого умения начать; это не экзаменационная отметка.',topics:['incidence','projection','ratio','proof','topology'],proof:'Назови одну пространственную ситуацию, где пересечение изображений не означает пересечения прямых.'},
    {id:'basic',title:'Контроль 1 · Законность построений',description:'Плоскость, след, перенос точки и полнота сечения.',topics:['incidence','trace','projection','strategy','proof'],proof:'На новой задаче из главы «Следы» запиши для каждой линии плоскость и два основания принадлежности точек.'},
    {id:'metric',title:'Контроль 2 · От построения к вычислению',description:'Отношения, подобие, площадь, угол и ограничения координат.',topics:['ratio','similarity','area','angles','coordinates'],proof:'Выбери вычислительную задачу и объясни, какая плоская фигура дала нужную формулу. Докажи, что взята именно её высота.'},
    {id:'research',title:'Контроль 3 · Особые случаи и доказательства',description:'Проверяем границы применимости метода и полноту аргумента.',topics:['topology','proof','projection','coordinates','strategy'],proof:'Предскажи изменение числа сторон в одной лаборатории. Отдельно запиши наблюдение и доказательство критических значений.'},
    {id:'final',title:'Итоговая работа',description:'Пять автоматически проверяемых заданий и отдельное построение с доказательством для преподавателя.',topics:['incidence','trace','similarity','area','proof'],proof:'Построй новую задачу из главы «Выбор метода» или «Сложные построения». Назови плоскость каждой линии, обоснуй границу, вычисли указанную величину и проверь результат другим способом.'}
  ];
  function writtenConstruction(id, run) {
    if (id === 'entry') return null;
    const model = solid(id === 'basic' || id === 'final' ? 'tetra' : 'cube');
    const mark = (name, a, b, portion) => {
      model.points[name] = add(model.points[a], mul(sub(model.points[b], model.points[a]), portion));
      model.given.push(name);
    };
    let prompt, solution;
    if (id === 'basic') {
      const denominator = 2 + run % 3;
      for (const [name, endpoint] of [['M', 'A'], ['N', 'B'], ['K', 'C']]) mark(name, 'S', endpoint, 1 / denominator);
      prompt = 'В тетраэдре SABC точки M, N и K лежат на рёбрах SA, SB и SC. На каждом ребре расстояние от S до отмеченной точки равно 1/' + denominator + ' длины этого ребра. Построй сечение плоскостью MNK. Назови грань для каждой стороны. На грани SAB покажи сторону сечения и отдельно назови прямую пересечения плоскостей MNK и SAB.';
      solution = 'В грани SAB получаем отрезок MN, в SBC — NK, в SCA — KM. Их концы лежат на рёбрах, а отрезки целиком лежат на соответствующих гранях. MN ∥ AB и MK ∥ AC по пропорциональности отрезков, поэтому плоскость сечения параллельна основанию ABC. Других сторон нет. След на плоскости SAB — вся прямая MN. Сторона на самой грани — только отрезок MN.';
    } else if (id === 'metric') {
      const half = 2 + run % 5;
      for (const [name, endpoint] of [['M', 'B'], ['N', 'D'], ['K', 'A1']]) mark(name, 'A', endpoint, .5);
      prompt = 'Ребро куба ABCDA₁B₁C₁D₁ равно ' + (2 * half) + '. Точки M, N и K — середины рёбер AB, AD и AA₁. Построй сечение плоскостью MNK. Докажи форму сечения и найди его площадь.';
      solution = 'Каждая пара точек лежит на одной из трёх граней при A. Плоскость отсекает угол при A: в осях вдоль AB, AD и AA₁ она имеет уравнение x+y+z=' + half + '. На остальных трёх гранях одна координата уже больше ' + half + '. Все стороны сечения равны ' + half + '√2 по теореме Пифагора. Площадь равностороннего треугольника равна (' + half + '√2)²·√3/4 = ' + (half * half) + '√3/2.';
    } else if (id === 'research') {
      const height = 3 + run % 5;
      prompt = 'Куб с ребром ' + height + ' стоит на грани ABCD. Горизонтальная плоскость расположена на уровне t, отсчитанном от ABCD вверх. Для каждого положения опиши общую часть плоскости и куба и укажи, когда плоскость пересекает внутренность куба. Разбери t < 0, t = 0, 0 < t < ' + height + ', t = ' + height + ' и t > ' + height + '. Нарисуй по одному примеру внутреннего и граничного положения.';
      solution = 'У всех точек куба высота от 0 до ' + height + '. Вне этого промежутка общих точек нет. На концах плоскость содержит целую нижнюю или верхнюю грань. При 0 < t < ' + height + ' на каждом вертикальном ребре есть ровно одна точка высоты t. Соединяя соседние точки по боковым граням, получаем квадрат со стороной ' + height + '. Только между крайними уровнями плоскость проходит через внутренность куба.';
    } else if (id === 'final') {
      const ab = 4 + run % 5, unit = 1 + run % 3, sc = 5 * unit;
      Object.assign(model.points, {A:[0,0,0], B:[ab,0,0], C:[.75*ab,3*unit,0], S:[.75*ab-3*unit,3*unit,4*unit]});
      mark('M', 'S', 'A', .5); mark('N', 'S', 'B', .5); mark('K', 'A', 'C', .5);
      prompt = 'В тетраэдре SABC даны AB = ' + ab + ', SC = ' + sc + '. Точки M, N и K — середины SA, SB и AC. Построй сечение плоскостью MNK. Укажи, на каком ребре лежит четвёртая вершина и как её построить. Обоснуй каждую сторону сечения и найди периметр.';
      solution = 'MN — средняя линия треугольника SAB, MK — средняя линия SAC. Через N в грани SBC проведи NR ∥ SC до ребра BC. Поскольку MK ∥ SC, прямая NR лежит и в секущей плоскости. По теореме о средней линии R — середина BC. В основании ABC отрезок RK параллелен AB. Граница проходит по четырём граням в порядке M–N–R–K. Две стороны равны AB/2 и две равны SC/2, поэтому периметр равен AB + SC = ' + (ab + sc) + '.';
    }
    return {prompt, solution, scene:{title:'Исходный чертёж письменной задачи', model, steps:[]}};
  }
  function makeExam(id, run=0, writtenVersion=1) {
    const spec = assessments.find(x => x.id === id) || assessments[0];
    const written = writtenVersion === 1 ? writtenConstruction(spec.id, run) : null;
    return {...spec, run, proof:written?.prompt || spec.proof, written,
      questions:spec.topics.map((t,i) => makeDrill(t, 41 + run * 131 + i * 17))};
  }
  const api={topics,makeDrill,labFamilies,labBounds,makeLab,assessments,makeExam,solid,formatNumber:f};
  root.SECTION_ACTIVITIES=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

(function () {
  'use strict';
  if(window.SECTIONS_BOARD_SESSION)return;
  const C=window.COURSE,api=window.SECTIONS_APP,A=window.SECTION_ACTIVITIES;
  if(!C||!api||!A)return;
  const KEY='mathexam.sections.master.activities.v1',layout=document.querySelector('.layout'),host=document.getElementById('sections-app');
  const defaults={view:'map',route:'full',path:{stageId:'begin-01',readiness:{},reviews:{}},practice:{topic:'incidence',topics:{},returnTo:null,reviewStage:null},labs:{family:'cube-sum',states:{}},research:{states:{}},exams:{},examId:'entry'};
  let state;try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){state={...defaults};}
  state.practice={...defaults.practice,...state.practice};state.labs={...defaults.labs,...state.labs};state.exams=state.exams||{};state.path={...defaults.path,...state.path};state.path.readiness=state.path.readiness||{};
  state.research=state.research&&typeof state.research==='object'&&!Array.isArray(state.research)?state.research:{states:{}};
  if(!state.research.states||typeof state.research.states!=='object'||Array.isArray(state.research.states))state.research.states={};
  let visual=null,proofVisual=null,nav,portal,storageOK=true;
  const lessonById=new Map(C.lessons.map(x=>[x.id,x])),moduleById=new Map(C.modules.map(x=>[x.id,x]));
  const stageById = new Map((C.learningPath || []).map(stage => [stage.id, stage]));
  const REVIEW_DELAY = 24 * 60 * 60 * 1000;
  const REVIEW_BANK_LIMIT = 96;
  if (!state.path.reviews || typeof state.path.reviews !== 'object' || Array.isArray(state.path.reviews)) state.path.reviews = {};
  for (const [id, review] of Object.entries(state.path.reviews)) {
    if (!stageById.has(id) || !Number.isInteger(review?.index) || review.index < 0 || review.index >= REVIEW_BANK_LIMIT) {
      delete state.path.reviews[id];
      continue;
    }
    state.path.reviews[id] = {...newDrill(review.index), ...review,
      history:Array.isArray(review.history) ? review.history.filter(entry => typeof entry?.prompt === 'string' && Array.isArray(entry.solution)) : [],
      viewed:Array.isArray(review.viewed) ? review.viewed.filter(prompt => typeof prompt === 'string') : []};
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){storageOK=false;}}
  function el(tag,attrs={},text){const x=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')x.className=v;else if(k==='value')x.value=v;else if(k==='disabled')x.disabled=!!v;else if(k==='checked')x.checked=!!v;else x.setAttribute(k,String(v));}if(text!==undefined)x.textContent=text;return x;}
  function math(text){const f=document.createDocumentFragment();for(const part of String(text||'').split(/(\[\[frac:[^\[\]]+\|[^\[\]]+\]\]|\n)/g)){const m=part.match(/^\[\[frac:([^|]+)\|([^\]]+)\]\]$/);if(m){const span=el('span',{class:'fraction',role:'math','aria-label':m[1]+' делить на '+m[2]});span.append(el('span',{class:'numerator','aria-hidden':true},m[1]),el('span',{class:'denominator','aria-hidden':true},m[2]));f.append(span);}else if(part==='\n')f.append(el('br'));else f.append(document.createTextNode(part));}return f;}
  function p(text,cls){const x=el('p',cls?{class:cls}:{});x.append(math(text));return x;}
  function btn(text,fn,cls='',attrs={}){const x=el('button',{type:'button',class:cls,...attrs},text);x.addEventListener('click',fn);return x;}
  function disclosure(title,children,cls=''){const x=el('details',{class:cls});x.append(el('summary',{},title),...children);return x;}
  function list(items){const ul=el('ul');items.forEach(t=>{const li=el('li');li.append(math(t));ul.append(li);});return ul;}
  function title(text,eyebrow,description){const h=el('header',{class:'master-section-heading'});if(eyebrow)h.append(p(eyebrow,'eyebrow'));h.append(el('h2',{tabindex:'-1'},text));if(description)h.append(p(description,'muted'));return h;}
  function parse(text){const s=String(text).trim().replace(/\s+/g,'').replace(/,/g,'.').replace(/−/g,'-');if(!s)return NaN;const pieces=s.split('/'),num=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;if(pieces.length===1&&num.test(s))return Number(s);if(pieces.length===2&&pieces.every(x=>num.test(x))&&Number(pieces[1])!==0)return Number(pieces[0])/Number(pieces[1]);return NaN;}
  function correct(q,answer){return q.kind==='choice'?Number(answer)===q.answer:Number.isFinite(parse(answer))&&Math.abs(parse(answer)-q.answer)<=q.tolerance;}
  function answerText(q){return q.kind==='choice'?q.options[q.answer]:A.formatNumber(q.answer)+(q.unit?' '+q.unit:'');}
  function markExamHelp(reason,exceptId=null){for(const[id,exam]of Object.entries(state.exams)){if(exam.started&&!exam.finished&&id!==exceptId){exam.assisted=true;exam.helpReason=reason;}}}
  function show(view,focus=true){
    if(view==='control')markExamHelp('Во время работы открыт другой набор.',state.examId);else markExamHelp('Во время работы открыты учебные материалы или другой раздел.');
    if(visual){visual.destroy();visual=null;}
    if(proofVisual){proofVisual.destroy();proofVisual=null;}
    state.view=view;document.documentElement.dataset.sectionsView=view;save();document.querySelector('.skip-link')?.setAttribute('href',view==='lessons'?'#lesson-title':'#master-portal');layout.hidden=view!=='lessons';portal.hidden=view==='lessons';
    nav.querySelectorAll('button').forEach(b=>{const yes=b.dataset.view===(view==='research'?'map':view);b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));});
    if(view!=='lessons'){
      portal.replaceChildren();
      ({map:renderMap,research:renderResearch,practice:renderPractice,labs:renderLabs,control:renderControl,teacher:renderTeacher}[view]||renderMap)();
      if(!storageOK)portal.prepend(p('Браузер не разрешил постоянное сохранение. Пока вкладка открыта, работа остаётся здесь.','storage-alert'));
      if(focus)portal.querySelector('h2')?.focus({preventScroll:true});
    }
    if(focus)window.scrollTo({top:nav.offsetTop-8,behavior:'auto'});
  }
  function openLesson(id){if(!lessonById.has(id))return;const stageId=lessonById.get(id).pathStageId;if(stageId)state.path.stageId=stageId;show('lessons',false);api.selectLesson(id);document.getElementById('lesson-title')?.focus({preventScroll:true});document.getElementById('lesson-title')?.scrollIntoView({block:'start'});}
  function openModule(id){const m=moduleById.get(id),first=m?.coreIds?.[0]||C.lessons.find(l=>l.module===id)?.id;if(!first)return;openLesson(first);const filter=document.querySelector('select[aria-label="Раздел курса"]');if(filter){filter.value=id;filter.dispatchEvent(new Event('change'));}}
  function openPractice(topic,context=null){state.practice.reviewStage=null;state.practice.topic=A.topics.some(x=>x.id===topic)?topic:'incidence';state.practice.returnTo=context;if(context?.lessonId)api.markHelp(context.lessonId,'Отдельная тренировка умения: '+state.practice.topic);show('practice');}
  function openLab(id){state.labs.family=id;show('labs');}
  function openExam(id){state.examId=id;show('control');}
  function openPathLesson(id){
    const existing=api.getState().tasks[id],progress=lessonProgress(id,{[id]:existing});
    openLesson(id);
    // Preserve started legacy work. A fresh transfer or a saved manual draft
    // without a competing legacy attempt opens the personal construction.
    if(api.supportsConstruction?.(id)&&(progress.manual&&!existing?.construction?.active||!progress.started&&!existing?.construction))api.startConstruction(id);
  }
  function researchState(stage){
    const spec=stage.research,ids=new Set(spec.actions.map(action=>action.id));
    let s=state.research.states[stage.id];
    if(!s||typeof s!=='object'||Array.isArray(s)||s.version!==1)s=state.research.states[stage.id]={version:1};
    s.prediction=typeof s.prediction==='string'&&(s.prediction==='unknown'||spec.predictions.some((_,i)=>String(i)===s.prediction))?s.prediction:'';
    s.observed=Array.isArray(s.observed)?[...new Set(s.observed.filter(id=>ids.has(id)))]:[];
    s.lastAction=ids.has(s.lastAction)&&s.observed.includes(s.lastAction)?s.lastAction:'';
    s.locked=!!s.prediction&&(!!s.locked||s.observed.length>0);
    // A corrupt/old empty forecast must never silently become a recorded one.
    if(!s.prediction){s.observed=[];s.lastAction='';s.locked=false;}
    s.notes=typeof s.notes==='string'?s.notes.slice(0,6000):'';
    s.completed=!!s.completed&&s.locked&&spec.actions.every(a=>s.observed.includes(a.id))&&!!s.notes.trim();
    s.nextLesson=typeof s.nextLesson==='string'&&(stage.lessons.includes(s.nextLesson)||s.nextLesson===stage.reserveLesson)?s.nextLesson:stage.lessons[0];
    s.history=Array.isArray(s.history)?s.history.filter(x=>x&&typeof x==='object'&&typeof x.prediction==='string').slice(-40):[];
    if(!s.camera||!Number.isFinite(s.camera.yaw)||!Number.isFinite(s.camera.pitch))s.camera={yaw:-.65,pitch:.46};
    s.camera={yaw:s.camera.yaw,pitch:Math.max(-1.45,Math.min(1.45,s.camera.pitch))};
    return s;
  }
  function openResearch(stageId,nextLesson){
    const stage=stageById.get(stageId);if(!stage?.research)return;
    state.path.stageId=stageId;
    const s=researchState(stage);
    if(typeof nextLesson==='string'&&(stage.lessons.includes(nextLesson)||nextLesson===stage.reserveLesson))s.nextLesson=nextLesson;
    try{history.replaceState(null,'',location.pathname+location.search);}catch(_){}
    show('research');
  }
  function startStage(stage,id){
    if(!stage.research||lessonProgress(id,api.getState().tasks).started||researchState(stage).completed)openPathLesson(id);
    else openResearch(stage.id,id);
  }
  function renderResearch(){
    const stage=stageById.get(state.path.stageId);
    if(!stage?.research){renderMap();return;}
    const spec=stage.research,s=researchState(stage),action=spec.actions.find(a=>a.id===s.lastAction);
    const allObserved=spec.actions.every(a=>s.observed.includes(a.id));
    const card=el('section',{class:'master-panel research-card','data-research-stage':stage.id});
    card.append(title(stage.title,'ИССЛЕДОВАНИЕ ПЕРЕД ЗАДАЧЕЙ',spec.question));
    card.append(p('1. Предположи → 2. Проверь на модели → 3. Запиши вывод','research-steps'));
    const prediction=el('select',{id:'research-prediction','aria-label':'Мой прогноз',disabled:s.locked});
    prediction.append(el('option',{value:''},'Выбери предположение'));
    spec.predictions.forEach((text,i)=>prediction.append(el('option',{value:i},text)));
    prediction.append(el('option',{value:'unknown'},'Пока не могу предположить'));prediction.value=s.prediction;
    prediction.addEventListener('change',()=>{if(s.locked)return;s.prediction=prediction.value;save();show('research',false);});
    card.append(el('label',{'for':'research-prediction'},s.locked?'Первоначальный прогноз сохранён':'Что ты предполагаешь?'),prediction,
      p('Можно ошибиться или выбрать «пока не могу предположить». Прогноз не оценивается как решение задачи.','small muted'));
    const controls=el('div',{class:'research-actions','aria-label':'Действия с моделью'});
    spec.actions.forEach(a=>controls.append(btn(a.label,()=>{
      if(!s.prediction)return;
      if(!s.observed.length&&spec.source==='lesson')api.markHelp(spec.lessonId,'Исследование на модели этой карточки');
      s.locked=true;s.lastAction=a.id;if(!s.observed.includes(a.id))s.observed.push(a.id);
      if(a.camera)s.camera={...a.camera};
      save();show('research',false);
    },s.lastAction===a.id?'primary':'ghost',{'data-action':'research-observe','data-experiment':a.id,disabled:!s.prediction,'aria-pressed':s.lastAction===a.id})));
    card.append(controls);
    if(!s.prediction)card.append(p('Сейчас запиши свой прогноз, затем выбери действие с моделью.','research-current'));
    else if(!allObserved)card.append(p('Проверь все положения: '+s.observed.length+' из '+spec.actions.length+'. Модель можно поворачивать.','research-current'));
    const position=action||spec.actions[0];
    const model=spec.source==='lab'?A.makeLab(spec.family,position.level,position.height||1):lessonById.get(spec.lessonId);
    const count=action?(spec.source==='lab'?model.steps.length:action.count):0;
    const frame=el('div',{class:'model-frame research-model'});
    frame.append(el('div',{class:'model-caption'},action?action.label:'Исходная модель · результат ещё не открыт'));
    card.append(frame);portal.append(card);
    visual=api.createScene(frame,model,camera=>{s.camera=camera;save();});
    visual.update({viewCount:count,planeId:action?.planeId||null,planeView:!!action?.flat,camera:{...s.camera},showHelpers:true,showResult:!!action&&count===model.steps.length,cleanView:false});
    if(action){
      const observed=el('section',{class:'research-observation','aria-live':'polite'});
      observed.append(el('h3',{},'Что видно в этом опыте'),p(action.observation));
      if(spec.source==='lab'){
        observed.append(p(model.classification+(model.dimension===2?' · площадь ≈ '+A.formatNumber(model.area):''),'research-result'));
        if(spec.family==='oblique-normal')observed.append(p(model.normalInfo.full?'Все боковые рёбра пересечены.':'Не все боковые рёбра пересечены.'),p('Допустимый общий уровень: от '+A.formatNumber(model.normalInfo.low)+' до '+A.formatNumber(model.normalInfo.high)+'.'+(model.normalInfo.exists?'':' Нижняя граница больше верхней: общего интервала нет.')));
        if(stage.id==='main-10'){
          const table=el('table',{class:'master-table'}),head=el('tr');['Ребро','Параметр u','На самом ребре?'].forEach(t=>head.append(el('th',{},t)));table.append(head);
          model.edgeRows.forEach(row=>{const tr=el('tr');[row.edge,row.parameter===null?(row.coplanar?'всё ребро':'параллельно'):A.formatNumber(row.parameter),row.coplanar||row.parameter!==null&&row.parameter>=-1e-8&&row.parameter<=1+1e-8?'да':'нет'].forEach(t=>tr.append(el('td',{},t)));table.append(tr);});
          observed.append(disclosure('Проверить параметры рёбер',[elWrap(table,'table-scroll')]));
        }
      }
      card.append(observed);
    }
    if(allObserved){
      const label=el('label',{'for':'research-note'},'Что ты заметил? Запиши своими словами.');
      const note=el('textarea',{id:'research-note',rows:3,maxlength:6000,placeholder:'Я заметил… Это верно, если…'});note.value=s.notes;
      const finish=btn(s.completed?'Вывод сохранён':'Сравнить вывод с объяснением',()=>{if(!s.notes.trim())return;s.completed=true;save();show('research',false);},'primary',{'data-action':'research-finish',disabled:!s.notes.trim()||s.completed});
      note.addEventListener('input',()=>{s.notes=note.value.slice(0,6000);s.completed=false;card.querySelector('.research-conclusion')?.remove();finish.disabled=!s.notes.trim();finish.textContent='Сравнить вывод с объяснением';save();});
      card.append(label,note,p('Твой вывод сохраняется для обсуждения. Текст доказательства автоматически не оценивается.','small muted'),finish);
    }
    if(s.completed){
      const result=el('section',{class:'research-conclusion'});
      const predictionText=s.prediction==='unknown'?'Ты сначала отметил, что пока не можешь предположить.':spec.predictions[Number(s.prediction)];
      result.append(el('h3',{},'Сопоставь с объяснением'),p(spec.conclusion),p('Граница применимости: '+spec.boundary),p('Твой первоначальный прогноз: '+predictionText,'small'),
        p(s.prediction==='unknown'?'Теперь сформулируй предположение для нового примера.':Number(s.prediction)===spec.answer?'Прогноз согласуется с наблюдением. Для общего вывода нужны указанные основания.':'Наблюдение уточняет первоначальный прогноз. Он сохранён, чтобы видеть изменение мысли.','small'),
        p(spec.transfer,'research-transfer'),btn('Перейти к задаче',()=>{if(s.completed&&s.notes.trim())openPathLesson(s.nextLesson);},'primary',{'data-action':'research-to-lesson'}));
      card.append(result);
    }
    const returnRow=el('div',{class:'master-actions'});
    returnRow.append(btn('← К этапу курса',()=>show('map'),'ghost',{'data-action':'research-back'}));
    if(s.prediction||s.observed.length)returnRow.append(btn('Повторить опыт с новым прогнозом',()=>{
      s.history.push({prediction:s.prediction,observed:[...s.observed],lastAction:s.lastAction,notes:s.notes,completed:s.completed});
      s.history=s.history.slice(-40);Object.assign(s,{prediction:'',observed:[],lastAction:'',locked:false,notes:'',completed:false});save();show('research',false);
    },'ghost',{'data-action':'research-restart'}));
    card.append(returnRow);
    if(s.history.length){const history=el('div');s.history.slice().reverse().forEach(h=>history.append(p('Прогноз: '+(h.prediction==='unknown'?'Пока не могу предположить':spec.predictions[Number(h.prediction)]||'не записан')+'. Вывод: '+(h.notes||'ещё не записан'))));card.append(disclosure('Предыдущие опыты ('+s.history.length+')',[history]));}
  }
  function stageStats(){const tasks=api.getState().tasks||{},records=C.lessons.map(l=>lessonProgress(l.id,tasks));return{started:records.filter(r=>r.started).length,built:records.filter(r=>r.built).length,help:records.filter(r=>r.started&&r.help).length};}
  function lessonProgress(id,tasks){
    const lesson=lessonById.get(id),s=tasks[id];
    if(!lesson)return{started:false,built:false,finished:false,checked:false,help:false,label:'Нет задания'};
    const construction=s?.construction?.version===1&&api.supportsConstruction?.(id)?s.construction:null;
    const manual=!!construction&&(construction.active===true||s.mode==='choose'&&!s.revealed&&s.selectedCheck<0&&!s.answerChecked);
    const oldEvidence=s?.attemptEvidenceVersion===1&&['first','corrected'].includes(s.choiceEvidence)?s.choiceEvidence:null;
    const manualEvidence=['first','corrected'].includes(construction?.evidence)&&Number.isSafeInteger(construction.evidenceAt)&&construction.evidenceAt>0?construction.evidence:null;
    const evidence=manualEvidence||oldEvidence;
    const started=!!s&&(!!construction||s.mode==='study'||s.mode==='practice'||s.revealed>0||!!s.draft||s.answerChecked||s.selectedCheck>=0||!!evidence);
    const actionCount=manual?(construction.actions||[]).length:s?.revealed||0;
    const actionTotal=manual?api.getConstructionPlan(id).length:lesson.steps.length;
    const built=started&&actionCount===actionTotal;
    const finished=manual?construction.completed===true:built&&(!lesson.check||(s.checkCorrect===true&&s.selectedCheck===lesson.check.correct))&&(!lesson.result?.numeric||(s.answerChecked===true&&s.correctAnswer===true));
    const help=!!s&&(s.helpUsed||s.workedSeen||s.resultSeen||s.calculationSeen||(s.calculationRevealed||0)>0||manual&&construction.helpUsed);
    // Old records cannot establish how an attempt was made. A manual readiness
    // checkbox and a revealed diagram never certify an independent construction.
    const currentChecked=finished&&!help&&(manual?construction.helpUsed===false:s.attemptEvidenceVersion===1&&s.mode==='practice'&&
      (lesson.starter||lesson.scaffold)?.phase!=='guided'&&s.independentSteps===lesson.steps.length);
    // An explanation opened after a successful attempt must not erase it.
    // The engine records this evidence only when the independent attempt ends.
    const checked=!!evidence||currentChecked,corrected=evidence?evidence==='corrected':(manual?construction.mistakes:s?.mistakes||0)>0;
    const historical=!!evidence&&!currentChecked;
    let label='Ещё не выполняли';
    if(started){
      if(checked)label=historical?(corrected?'Ранее сам исправил; выборы без подсказки':'Ранее проверены выборы без подсказки'):(corrected?'Сам исправил; выборы без подсказки':'Выборы проверены без подсказки');
      else if(help)label=built?'Построено с разбором или помощью':'В работе с разбором или помощью';
      else if(built)label=finished?'Построено; способ работы не подтверждён':'Построено; ответ ещё не проверен';
      else label='В работе: '+actionCount+' из '+actionTotal+' действий';
    }
    return{started,built,finished,checked,help,corrected,historical,label,manual};
  }
  function stageChecks(stage) {
    const transfer = stage.lessons.filter(id => (lessonById.get(id).starter || lessonById.get(id).scaffold)?.phase === 'transfer');
    return new Set([...(transfer.length ? transfer : [stage.lessons.at(-1)]), ...(stage.reserveLesson ? [stage.reserveLesson] : [])]);
  }
  function stageProgress(stage,tasks){
    const ids=[...stage.lessons,...(stage.reserveLesson?[stage.reserveLesson]:[])];
    const records=ids.map(id=>({id,...lessonProgress(id,tasks)}));
    const checks=stageChecks(stage);
    const verified=records.find(r=>checks.has(r.id)&&r.checked);
    const taskStarted=records.some(r=>r.started),research=stage.research&&state.research.states[stage.id];
    const exploring=research?.version===1&&(!!research.prediction||!!research.observed?.length||!!research.history?.length);
    const started=taskStarted||exploring,help=records.some(r=>r.help);
    if(verified)return{kind:'checked',label:verified.historical?(verified.corrected?'Ранее сам исправил; без подсказки':'Ранее проверены выборы без подсказки'):(verified.corrected?'Сам исправил; без подсказки':'Выборы без подсказки'),started,verified:verified.id};
    if(exploring&&!taskStarted)return{kind:'started',label:research.completed?'Исследование завершено; впереди задача':'Исследование в работе',started:true,verified:null};
    if(help)return{kind:'help',label:'Есть работа с помощью',started,verified:null};
    if(records.some(r=>r.built))return{kind:'built',label:'Построено; нужна проверка',started,verified:null};
    return{kind:started?'started':'new',label:started?'В работе':'Ещё не начато',started,verified:null};
  }
  function stageRecommendation(stage,tasks,current){
    const ids=[...stage.lessons,...(stage.reserveLesson?[stage.reserveLesson]:[])];
    const currentWork=lessonProgress(current,tasks);
    if(ids.includes(current)&&currentWork.started&&!currentWork.finished)return{id:current,label:'Продолжить занятие',note:'Вернись к сохранённому действию и ответу.'};
    const progress=stageProgress(stage,tasks);
    if(progress.verified)return{id:progress.verified,label:'Открыть своё построение',note:'Выборы проверены. Теперь воспроизведи чертёж и объяснение на бумаге или доске.'};
    const unfinished=stage.lessons.find(id=>!lessonProgress(id,tasks).finished);
    if(unfinished)return{id:unfinished,label:stage.lessons.some(id=>lessonProgress(id,tasks).started)?'Продолжить занятие':stage.id==='begin-01'?'Начать с первой грани':'Начать этот этап',note:'Следующий пример этого этапа.'};
    if(!progress.verified&&stage.reserveLesson&&!lessonProgress(stage.reserveLesson,tasks).finished)return{id:stage.reserveLesson,label:'Новый пример без прежнего разбора',note:'Проверь выбор плоскостей на другом примере.'};
    return{id:stage.lessons[stage.lessons.length-1],label:'Открыть своё построение',note:'Построения сохранены. Теперь объясни каждую линию на бумаге или доске.'};
  }
  function reviewDueAt(stage, tasks) {
    const recorded = [...stageChecks(stage)].flatMap(id => {
      const task=tasks[id],times=[];
      if(task?.attemptEvidenceVersion===1&&['first','corrected'].includes(task.choiceEvidence)&&Number.isSafeInteger(task.choiceEvidenceAt)&&task.choiceEvidenceAt>0)times.push(task.choiceEvidenceAt);
      const work=task?.construction;
      if(api.supportsConstruction?.(id)&&work?.version===1&&['first','corrected'].includes(work.evidence)&&Number.isSafeInteger(work.evidenceAt)&&work.evidenceAt>0)times.push(work.evidenceAt);
      return times;
    });
    return recorded.length ? Math.min(...recorded) + REVIEW_DELAY : null;
  }
  function reviewIndex(topic) {
    const practice = state.practice.topics[topic];
    const used = new Set([
      ...(Array.isArray(practice?.viewed) ? practice.viewed : []),
      ...(Array.isArray(practice?.history) ? practice.history.map(entry => entry?.prompt) : [])
    ]);
    if (practice) used.add(A.makeDrill(topic, practice.index).prompt);
    for (const [id, review] of Object.entries(state.path.reviews)) {
      if (stageById.get(id)?.practice === topic) {
        used.add(A.makeDrill(topic, review.index).prompt);
        for (const prompt of review.viewed || []) used.add(prompt);
        for (const entry of review.history || []) used.add(entry.prompt);
      }
    }
    for (const [id, exam] of Object.entries(state.exams)) {
      const runs = (exam.history || []).map(entry => entry.run);
      if (exam.started || exam.finished) runs.push(exam.run);
      for (const run of runs) for (const question of A.makeExam(id, run).questions) {
        if (question.topic === topic) used.add(question.prompt);
      }
    }
    const structure = prompt => prompt.replace(/[+-]?\d+(?:[.,]\d+)?/g, '#');
    const usedStructures = new Set([...used].filter(prompt => typeof prompt === 'string').map(structure));
    let fallback = -1;
    for (let i = 0; i < REVIEW_BANK_LIMIT; i++) {
      const prompt = A.makeDrill(topic, i).prompt;
      if (used.has(prompt)) continue;
      if (!usedStructures.has(structure(prompt))) return i;
      if (fallback < 0) fallback = i;
    }
    return fallback;
  }
  function renderReview(stage, tasks) {
    const dueAt = reviewDueAt(stage, tasks);
    if (!dueAt) return null;
    const attempt = state.path.reviews[stage.id];
    const box = el('section', { class: 'stage-review', 'aria-label': 'Повторная проверка умения' });
    box.append(el('h4', {}, 'Проверка после паузы'));
    if (Date.now() < dueAt) box.append(p('Через сутки после самостоятельного решения здесь появится новый короткий пример.', 'small muted'));
    else {
      const outcomes = {first:'Новый пример решён с первой попытки без подсказки.',corrected:'Новый пример решён после самостоятельного исправления.',assisted:'Новый пример разобран с помощью.'};
      box.append(p(outcomes[attempt?.firstCorrect] || 'Вспомни приём на новом условии. Построение и доказательство по-прежнему можно обсудить с преподавателем.', 'small muted'));
      const index = attempt ? attempt.index : reviewIndex(stage.practice);
      if (index >= 0) box.append(btn(attempt ? 'Открыть повторную проверку' : 'Решить новый пример', () => {
        if (!state.path.reviews[stage.id]) state.path.reviews[stage.id] = newDrill(index);
        state.practice.reviewStage = stage.id;
        show('practice');
      }, 'ghost', { 'data-action': 'path-review' }));
      else box.append(p('Все короткие примеры по этому умению уже открывались.', 'small muted'));
    }
    return box;
  }
  function renderMap(){
    const path=C.learningPath||[];
    if(!path.length){renderFullMap();return;}
    let index=path.findIndex(x=>x.id===state.path.stageId);if(index<0)index=0;
    const stage=path[index],work=api.getState(),tasks=work.tasks||{},manual=state.path.readiness[stage.id]||(state.path.readiness[stage.id]=[]);
    const summaries=path.map(item=>stageProgress(item,tasks)),started=summaries.filter(x=>x.started).length,verified=summaries.filter(x=>x.verified).length;
    const saved=lessonById.get(work.current),resume=saved&&lessonProgress(saved.id,tasks).started;
    portal.append(title('Мой путь',null,'Сначала исследуем вопрос на модели, затем разбираем задачу и строим на новом примере самостоятельно.'));
    const overview=el('section',{class:'path-summary','aria-label':'Ход работы по курсу'});
    overview.append(p('Начато этапов: '+started+' из '+path.length,'path-summary-count'),p('Проверены выборы на новом примере: '+verified+' из '+path.length,'path-summary-count'),p('Чертёж и доказательство проверяем отдельно.','small muted'));
    if(resume)overview.append(btn('Продолжить: '+saved.title,()=>openPathLesson(saved.id),'primary',{'data-action':'path-resume'}));
    if(stage.research&&researchState(stage).prediction&&!researchState(stage).completed)overview.append(btn('Продолжить исследование: '+stage.title,()=>openResearch(stage.id),'primary',{'data-action':'research-resume'}));
    const tours=el('div',{class:'sections-tour-links'});
    [['start','Как начать'],['resume','Как продолжить'],['construct','Как получается сечение']].forEach(([kind,label])=>{
      const trigger=btn('▶ '+label,()=>window.SECTIONS_TOUR?.open(kind,trigger),'ghost',{'data-tour-open':kind});
      tours.append(trigger);
    });
    overview.append(disclosure('Как заниматься · короткие показы',[tours],'sections-tours'));
    portal.append(overview);
    const box=el('section',{class:'master-panel gentle-stage','data-stage-id':stage.id,'aria-labelledby':'path-stage-title'});
    const kindStages=path.filter(s=>s.kind===stage.kind),kindIndex=kindStages.findIndex(s=>s.id===stage.id)+1,kindLabel=stage.kind==='starter'?'Начальная ступень':stage.kind==='bridge'?'Подготовка к методу':'Основной этап';
    box.append(p('Этап '+(index+1)+' из '+path.length+' · '+kindLabel+' '+kindIndex+' из '+kindStages.length,'eyebrow'),el('h3',{id:'path-stage-title',tabindex:'-1'},stage.title),p(stage.newIdea,'gentle-new-idea'));
    const recommendation=stageRecommendation(stage,tasks,work.current);
    box.append(btn(recommendation.label,()=>startStage(stage,recommendation.id),'primary gentle-start',{'data-action':'path-start','data-next-lesson':recommendation.id}),p(lessonById.get(recommendation.id).title,'small next-lesson-label'),p(recommendation.note,'small muted'));
    if(stage.research)box.append(p(stage.research.question,'research-entry-question'),btn(researchState(stage).completed?'Вернуться к исследованию':'Сначала исследовать вопрос',()=>openResearch(stage.id,recommendation.id),'ghost',{'data-action':'stage-research'}));
    const rows=el('ol',{class:'gentle-lesson-list'});
    stage.lessons.forEach((id,i)=>{const l=lessonById.get(id),row=el('li'),guidance=l.starter||l.scaffold,role=guidance?({model:'Сделаем вместе',guided:'Попробуем с опорой',transfer:'Новый пример самостоятельно'})[guidance.phase]:'Задание '+(i+1);row.append(btn(role+' · '+l.title,()=>openPathLesson(id),'ghost',{'data-path-lesson':id}),p(lessonProgress(id,tasks).label,'small muted'));rows.append(row);});box.append(disclosure('Примеры этого этапа',[rows],'stage-examples'));
    if(stage.reserveLesson){const reserve=stage.reserveLesson,extra=disclosure('Если понадобилась помощь',[p('Сначала разберись в трудном действии. Для следующей самостоятельной попытки есть отдельный пример с другими точками или гранью. Повтор открытого разбора сохраняется как работа после помощи.'),btn('Новый пример без прежнего разбора',()=>openPathLesson(reserve),'ghost',{'data-action':'path-reserve'}),p(lessonProgress(reserve,tasks).label,'small muted')]);box.append(extra);}
    else box.append(disclosure('Опора перед этим этапом',[p(stage.entrySupport),btn('Потренировать нужное умение',()=>openPractice(stage.practice),'ghost')]));
    const review = renderReview(stage, tasks);
    if (review) box.append(review);
    portal.append(box);
    const map=el('section',{class:'path-overview','aria-labelledby':'path-overview-title'});
    map.append(el('h3',{id:'path-overview-title'},'Все этапы курса'),p('6 начальных ступеней · 6 подготовительных · 14 основных. Идём в указанном порядке; нужный этап можно открыть сразу.','small muted'));
    const all=el('ol',{class:'gentle-path-list'});
    path.forEach((item,i)=>{
      const progress=summaries[i],selected=item.id===stage.id,checked=(state.path.readiness[item.id]||[]).filter(Boolean).length;
      const li=el('li',{'data-stage-progress':progress.kind,class:'path-node'+(selected?' path-node-current':'')});
      const choose=()=>{state.path.stageId=item.id;save();show('map',false);const heading=document.getElementById('path-stage-title');heading?.focus({preventScroll:true});heading?.scrollIntoView({block:'start'});};
      const action=btn('',choose,'path-node-action',{'data-path-stage':item.id,'aria-label':'Этап '+(i+1)+'. '+item.title+'. '+(selected?'Вы здесь. ':'')+progress.label,...(selected?{'aria-current':'step'}:{})});
      action.append(el('span',{class:'path-node-number','aria-hidden':'true'},i+1),el('span',{class:'path-node-title'},item.title),el('span',{class:'path-node-kind'},item.kind==='starter'?'Начальная ступень':item.kind==='bridge'?'Подготовка к методу':'Основной этап'),el('span',{class:'path-node-status'},(selected?'Вы здесь · ':'')+progress.label));
      li.append(action,p('Самооценка: '+checked+' из '+item.readiness.length,'path-node-manual'));all.append(li);
    });
    map.append(all,p('«Выборы без подсказки» означает проверку действий и ответов в модели. Просмотр разбора и самооценка не подтверждают самостоятельное доказательство.','small muted'));
    const readiness=el('section',{class:'master-panel gentle-readiness',id:'path-readiness'});readiness.append(el('h3',{},'Моя самопроверка'),p('Выполни новое задание на бумаге или доске и объясни каждый шаг. Кнопки тренируют выбор плоскости; собственный чертёж и объяснение проверяй отдельно.','small'),p('Отмечай только то, что уже получается без разбора. Эти отметки сохраняются как самопроверка.','small muted'));
    stage.readiness.forEach((text,i)=>{const label=el('label',{class:'gentle-ready-check'}),input=el('input',{type:'checkbox',checked:!!manual[i],'data-readiness':i});input.addEventListener('change',()=>{manual[i]=input.checked;save();show('map',false);portal.querySelector('[data-readiness="'+i+'"]')?.focus({preventScroll:true});});label.append(input,el('span',{},text));readiness.append(label);});
    const ready=stage.readiness.every((_,i)=>manual[i]);readiness.append(p(ready?'Критерии отмечены вручную. Можно переходить к следующему этапу; это не автоматическая оценка полного доказательства.':'Если действие пока не получается, вернись к одному короткому примеру. Темп можно менять.','small muted'));
    if(index+1<path.length){const go=()=>{state.path.stageId=path[index+1].id;save();show('map');};if(ready)readiness.append(btn('К следующему этапу: '+path[index+1].title,go,'primary',{'data-action':'path-next-stage'}));else readiness.append(disclosure('Выбрать следующий этап по решению преподавателя',[p('Переход оставит критерии готовности неотмеченными.'),btn('Открыть следующий этап',go,'ghost',{'data-action':'path-next-stage'})]));}
    else readiness.append(p('Это последний этап маршрута. Итог — новая смешанная задача с собственным построением, доказательством, вычислениями и разбором случаев.','step-note'));
    portal.append(readiness,map);
    const start=portal.childNodes.length;renderFullMap();const oldNodes=Array.from(portal.childNodes).slice(start);portal.append(disclosure('Другие маршруты и полный банк задач',oldNodes,'gentle-full-catalog'));
  }
  function renderFullMap(){
    portal.append(title('От первого следа к собственному доказательству','КАРТА КУРСА','Выберите маршрут или начните с короткой диагностики. Темп можно менять; каждая задача сохраняет свой ход работы.'));
    const hero=el('section',{class:'master-hero'}),intro=el('div');intro.append(el('h3',{},'Плоскость → основание → действие → вывод'),p('Не угадываем линию по рисунку. Сначала определяем, где разрешено строить, затем объясняем переход. После построения отдельно доказываем форму сечения и выполняем вычисления.'));
    const actions=el('div',{class:'master-actions'});actions.append(btn('Начать с диагностики',()=>openExam('entry'),'primary'),btn('Продолжить задачу',()=>openLesson(api.getState().current),'ghost'));intro.append(actions);
    const stats=el('div',{class:'master-stat-grid'});[[C.modules.filter(m=>m.id!=='onboarding').length,'основных глав'],[C.lessons.length,'карточек с моделями'],[A.topics.length,'отдельных умений'],[A.labFamilies.length,'лабораторий']].forEach(([n,label])=>{const box=el('div');box.append(el('strong',{},n),el('span',{},label));stats.append(box);});hero.append(intro,stats);portal.append(hero);
    const routeGrid=el('div',{class:'master-grid'});for(const route of C.routes||[]){const card=el('section',{class:'master-card'});card.append(p(route.level,'eyebrow'),el('h3',{},route.title),p(route.description),p(route.lessons.length+' опорных карточек. Остальной банк доступен в «Задачах».','small muted'),btn('Открыть маршрут',()=>{state.route=route.id;save();renderRoute();document.getElementById('route-detail')?.scrollIntoView({block:'start'});},'ghost',{'data-route':route.id}));routeGrid.append(card);}portal.append(routeGrid);
    const routeBox=el('section',{id:'route-detail',class:'master-panel'});portal.append(routeBox);renderRoute();
    portal.append(el('h3',{class:'master-divider-title'},'Все главы'));
    const grid=el('div',{class:'master-grid chapter-grid'});for(const m of C.modules){const card=el('section',{class:'master-card',id:'chapter-'+m.id});card.append(p('Уровень '+m.level+' · '+C.lessons.filter(l=>l.module===m.id).length+' карточек','eyebrow'),el('h3',{},m.title),p(m.description),list((m.outcomes||[]).slice(0,3)));const more=disclosure('Идея главы и выходная проверка',[p(m.intro),list(m.rules||[]),p('Типичная ошибка: '+m.error),p('Выход из главы: '+m.exit)],'chapter-detail');card.append(more);if(m.lab)card.append(btn('Исследовать на модели',()=>openLab(m.lab),'primary',{'data-module-lab':m.lab}));card.append(btn('К задачам главы',()=>openModule(m.id),'ghost'),btn('Тренировка умения',()=>openPractice(m.practice),'ghost'));grid.append(card);}portal.append(grid);
    const progress=stageStats();portal.append(p('В этом браузере: начато '+progress.started+', построения завершены в '+progress.built+' карточках, разбор или помощь использованы в '+progress.help+'. Это история работы, а не автоматическая оценка доказательств.','master-footnote'));
  }
  function renderRoute(){const box=document.getElementById('route-detail');if(!box)return;const route=(C.routes||[]).find(r=>r.id===state.route)||(C.routes||[])[0];if(!route)return;box.replaceChildren(el('h3',{},route.title),p(route.guidance||route.description));const links=el('div',{class:'route-links'});route.lessons.forEach((id,i)=>{const l=lessonById.get(id);if(l)links.append(btn((i+1)+'. '+l.title,()=>openLesson(id),'route-link'));});box.append(disclosure('Показать последовательность карточек', [links]),btn('Начать маршрут',()=>openLesson(route.lessons[0]),'primary'));}
  function newDrill(index) {
    return {index,answer:'',checked:false,correct:false,hint:0,drawn:false,hadError:false,mistakes:0,firstCorrect:null,history:[],viewed:[]};
  }
  function practiceState(topic) {
    const attempt = state.practice.topics[topic] ||= newDrill(0);
    if (!Array.isArray(attempt.history)) attempt.history = [];
    if (!Array.isArray(attempt.viewed)) attempt.viewed = [];
    return attempt;
  }
  function archivePractice(s, q) {
    if (s.answer === '' && !s.hint && !s.checked) return;
    s.history.push({prompt:q.prompt,answer:q.kind==='choice'&&s.answer!==''?q.options[Number(s.answer)]:s.answer,rawAnswer:s.answer,
      correct:s.checked?s.correct:null,help:s.hint>0,firstCorrect:s.firstCorrect || null,solution:s.hint>1?q.steps:[],expected:s.checked?answerText(q):null});
  }
  function renderPractice(){
    const reviewStage = stageById.get(state.practice.reviewStage);
    const review = reviewStage && state.path.reviews[reviewStage.id];
    const topic=review ? reviewStage.practice : state.practice.topic;
    const s=review || practiceState(topic),q=A.makeDrill(topic,s.index),spec=A.topics.find(x=>x.id===topic);
    if (!s.viewed.includes(q.prompt)) { s.viewed.push(q.prompt); save(); }
    const lessonState=api.getState(),contextId=lessonState.current,contextLesson=lessonById.get(contextId),contextTask=lessonState.tasks?.[contextId];
    if (review) {
      portal.append(title('Проверка после паузы', null, reviewStage.title), btn('← К этапу курса', () => {
        state.path.stageId = reviewStage.id;
        show('map');
      }, 'ghost return-task'));
    } else {
      if(state.practice.returnTo&&state.practice.returnTo.lessonId!==contextId){state.practice.returnTo=null;save();}
      if(contextLesson?.practiceTopic===topic&&contextTask?.mode==='practice'&&contextTask.revealed<contextLesson.steps.length){if(!state.practice.returnTo)state.practice.returnTo={lessonId:contextId,scroll:window.scrollY};api.markHelp(contextId,'Отдельная тренировка умения: '+topic);save();}
      portal.append(title('Потренировать одно действие','ПРАКТИКУМ','Новые примеры помогают отработать конкретное умение. Возврат к исходной задаче сохраняет построение, ракурс и черновик.'));
      if(state.practice.returnTo){const context=state.practice.returnTo;portal.append(btn('← Вернуться к сохранённой задаче',()=>{state.practice.returnTo=null;save();openLesson(context.lessonId);if(Number.isFinite(context.scroll))window.scrollTo({top:context.scroll});},'primary return-task',{'data-action':'return-task'}));}
      const select=el('select',{'aria-label':'Тренируемое умение'});A.topics.forEach(x=>select.append(el('option',{value:x.id},x.title)));select.value=topic;select.addEventListener('change',()=>{state.practice.topic=select.value;save();show('practice',false);});portal.append(select);
    }
    const card=el('section',{class:'master-panel drill-card'});card.append(p('Пример '+(s.index+1)+' · '+spec.title,'eyebrow'),p(q.prompt,'drill-prompt'));
    if(q.scene){const frame=el('div',{class:'model-frame drill-model'});frame.append(el('div',{class:'model-caption'},s.checked&&s.correct?'Рабочая плоскость: '+q.scene.model.planes.find(p=>p.id===q.scenePlane).label:'Исходная фигура: сначала выбери плоскость'));card.append(frame);visual=api.createScene(frame,q.scene,()=>{});visual.update({viewCount:s.drawn?1:0,planeId:s.checked&&s.correct?q.scenePlane:null,planeView:false,camera:{yaw:-.65,pitch:.46},showHelpers:true,showResult:false});}
    const feedback=el('div',{class:'feedback',role:'status'});
    function submit(answer) {
      s.answer = answer;
      s.checked = true;
      s.correct = correct(q, answer);
      if (!s.correct) { s.hadError = true; s.mistakes = (s.mistakes || 0) + 1; }
      else if (!s.firstCorrect) s.firstCorrect = s.hint ? 'assisted' : s.hadError ? 'corrected' : 'first';
      save(); show('practice', false);
    }
    if(q.kind==='choice'){
      const choices=el('div',{class:'check-options'});q.options.forEach((value,index)=>{const b=btn('',()=>submit(index),s.answer!==''&&Number(s.answer)===index?'selected':'',{'data-drill-option':index,disabled:s.checked&&s.correct});b.append(math(value));choices.append(b);});card.append(choices);
    }else{
      const locked = !!review && !!s.firstCorrect;
      const form=el('form',{class:'drill-form'}),label=el('label',{for:'drill-answer'},'Ответ'+(q.unit?' ('+q.unit+')':'')),input=el('input',{id:'drill-answer',type:'text',inputmode:'decimal',autocomplete:'off',value:s.answer,disabled:locked});
      input.addEventListener('input',()=>{s.answer=input.value;s.checked=false;s.correct=false;feedback.replaceChildren();feedback.className='feedback';save();});
      const checkAnswer=()=>{if(locked)return;if(!Number.isFinite(parse(s.answer))){feedback.className='feedback retry';feedback.textContent='Введи число или простую дробь с ненулевым знаменателем.';return;}submit(s.answer);};
      input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();checkAnswer();}});
      form.append(label,input,btn('Проверить',checkAnswer,'primary',{'data-action':'check-drill-answer',disabled:locked}),p('Запятая, точка и дробь вида 4/3 допустимы. Если требуется приближение — до тысячных.','small muted'));
      form.addEventListener('submit',e=>{e.preventDefault();checkAnswer();});card.append(form);
    }
    if (s.checked) {
      feedback.className = 'feedback ' + (s.correct ? 'good' : 'retry');
      const other = q.otherAnswer;
      const matchesOther = other && Math.abs(parse(s.answer) - other.value) <= q.tolerance;
      feedback.append(p(s.correct ? 'Ответ совпал. Объясни, какое правило использовано.' : matchesOther ? other.message : 'Пока не совпало. Сверь ответ с вопросом и данными задачи.'));
      if(s.correct)feedback.append(p(q.rule));
      if (!s.correct && s.mistakes >= 2 && !s.hint) feedback.append(p('При необходимости открой короткую подсказку.', 'small'));
    }
    card.append(feedback);
    if(q.scene&&s.checked&&s.correct&&!s.drawn)card.append(btn('Показать действие в выбранной плоскости',()=>{s.drawn=true;save();show('practice',false);},'primary',{'data-action':'drill-draw'}));
    const help=el('div',{class:'master-actions'});help.append(btn('Короткая подсказка',()=>{s.hint=Math.max(s.hint,1);save();show('practice',false);},'ghost',{'data-action':'drill-hint'}),btn('Разобрать этот пример',()=>{s.hint=2;save();show('practice',false);},'ghost',{'data-action':'drill-solution'}));card.append(help);
    if(s.hint){card.append(p(q.hint,'step-note'));if(s.hint>1){const ol=el('ol',{class:'drill-solution'});q.steps.forEach(t=>{const li=el('li');li.append(math(t));ol.append(li);});card.append(ol,p('Этот пример разобран с помощью. Для новой самостоятельной попытки возьми следующий.','teacher-note'));}}
    const nextIndex = review ? reviewIndex(topic) : s.index + 1;
    if (nextIndex >= 0 && (!review || !['first','corrected'].includes(s.firstCorrect))) card.append(btn('Новый похожий пример', () => {
      archivePractice(s, q);
      const {history, viewed} = s;
      Object.assign(s, newDrill(nextIndex), {history, viewed});
      save(); show('practice', false);
    }, 'primary next-drill', {'data-action':'next-drill'}));
    portal.append(card);
    if(s.history.length){const history=el('div');s.history.slice().reverse().forEach((h,i)=>{const row=el('article',{class:'drill-history-row'});row.append(p(h.prompt),p('Твой ответ: '+(h.answer===''?'не введён':h.answer)+' · '+(h.correct===null?'проверка не завершена':h.correct?'ответ совпал':'нужна доработка')+(h.help?' · использована помощь':''),'small'));if(h.solution.length)row.append(list(h.solution));history.append(row);});portal.append(disclosure('Предыдущие примеры этого умения ('+s.history.length+')',[history]));}
  }
  function labState(id){if(!state.labs.states[id]){const family=A.labFamilies.find(x=>x.id===id);state.labs.states[id]={level:family.initial,height:1,revealed:0,justBuilt:false,prediction:'',predictionLocked:false,notes:'',flat:false,camera:{yaw:-.65,pitch:.46},history:[]};}const s=state.labs.states[id];s.predictionLocked=!!s.predictionLocked||s.revealed>0;return s;}
  function archiveLab(s,model){if(s.revealed||s.prediction||s.notes)s.history.push({level:s.level,height:s.height,revealed:s.revealed,justBuilt:s.justBuilt,prediction:s.prediction,predictionLocked:!!s.predictionLocked,notes:s.notes,result:s.revealed===model.steps.length?model.classification:'Не завершено',area:s.revealed===model.steps.length?model.area:null});}
  function changeLab(s,model,updates){archiveLab(s,model);Object.assign(s,updates,{revealed:0,justBuilt:false,prediction:'',predictionLocked:false,notes:''});save();show('labs',false);}
  function predictionKey(model){return model.dimension<0?'empty':model.dimension===0?'point':model.dimension===1?'segment':String(model.polygon.length);}
  function predictionLabel(value){return({'unknown':'пока не могу предположить','empty':'пусто','point':'точка','segment':'отрезок','3':'треугольник','4':'четырёхугольник','5':'пятиугольник','6':'шестиугольник'})[value]||'не записан';}
  function renderLabs(){
    const id=state.labs.family,s=labState(id),model=A.makeLab(id,s.level,s.height),spec=model.spec,bounds=A.labBounds(id,s.height);s.revealed=Math.max(0,Math.min(s.revealed,model.steps.length));
    portal.append(title('Изменяй условие, проверяй гипотезу','ЛАБОРАТОРИИ','Сначала прогноз, затем построение по граням, затем вывод. Наблюдение помогает открыть закономерность; доказательство записывается отдельно.'));
    const select=el('select',{'aria-label':'Семейство сечений'});A.labFamilies.forEach(f=>select.append(el('option',{value:f.id},f.title)));select.value=id;select.addEventListener('change',()=>{state.labs.family=select.value;save();show('labs',false);});portal.append(select,p(spec.description),p(spec.question,'lab-question'));
    const controls=el('section',{class:'master-panel lab-settings'});controls.append(el('h3',{},'Плоскость: '+model.equation));
    const rangeId='lab-level',range=el('input',{id:rangeId,type:'range',min:bounds.min,max:bounds.max,step:.01,value:s.level}),value=el('output',{'for':rangeId},'Уровень '+A.formatNumber(s.level));controls.append(el('label',{'for':rangeId},'Переместить секущую плоскость'),range,value);
    range.addEventListener('input',()=>{value.textContent='Новый уровень '+A.formatNumber(Number(range.value))+' — отпусти ползунок, чтобы начать новый опыт.';});range.addEventListener('change',()=>changeLab(s,model,{level:Number(range.value)}));
    const exact=el('div',{class:'critical-levels'});exact.append(p('Критические уровни в вершинах:','small'));bounds.critical.forEach(t=>exact.append(btn(A.formatNumber(t),()=>changeLab(s,model,{level:t}),'ghost',{'data-critical':t})));controls.append(exact);
    if(spec.height){const h=el('input',{id:'lab-height',type:'range',min:.2,max:1.5,step:.05,value:s.height}),out=el('output',{'for':'lab-height'},'h='+A.formatNumber(s.height));controls.append(el('label',{'for':'lab-height'},'Высота косой призмы'),h,out);h.addEventListener('input',()=>out.textContent='h='+A.formatNumber(Number(h.value)));h.addEventListener('change',()=>{const height=Number(h.value),b=A.labBounds(id,height);changeLab(s,model,{height,level:Math.max(b.min,Math.min(b.max,s.level))});});}
    const prediction=el('select',{'aria-label':'Прогноз пересечения',disabled:s.predictionLocked});[['','Сначала мой прогноз…'],['unknown','Пока не могу предположить'],['empty','Пересечение пусто'],['point','Только точка'],['segment','Только отрезок'],['3','Треугольник'],['4','Четырёхугольник'],['5','Пятиугольник'],['6','Шестиугольник']].forEach(([v,t])=>prediction.append(el('option',{value:v},t)));prediction.value=s.prediction;prediction.addEventListener('change',()=>{if(s.predictionLocked)return;s.prediction=prediction.value;save();show('labs',false);});controls.append(el('label',{},'Какое пересечение ожидаешь?'),prediction);if(s.predictionLocked)controls.append(p(s.prediction?'Прогноз зафиксирован при начале построения. Для новой гипотезы начни опыт с другими данными; первоначальный прогноз останется в журнале.':'Этот прежний опыт начат без прогноза. Продолжение сохранено; в новом опыте сначала запиши предположение.','small'));portal.append(controls);
    const work=el('section',{class:'lab-workbench'}),modelPanel=el('div',{class:'master-panel lab-model-panel'}),frame=el('div',{class:'model-frame'}),stepIndex=s.justBuilt&&s.revealed?s.revealed-1:Math.min(s.revealed,model.steps.length-1),step=model.steps[stepIndex],plane=model.model.planes.find(p=>p.id===step.plane);
    frame.append(el('div',{class:'model-caption'},'Рабочая плоскость: '+plane.label));modelPanel.append(frame,p('Вращение меняет только вид. Новые отрезки появляются после отдельного действия в указанной плоскости.','model-help'));visual=api.createScene(frame,model,camera=>{s.camera=camera;save();});
    visual.update({viewCount:s.revealed,planeId:step.plane,planeView:s.flat,camera:s.camera,showHelpers:true,showResult:s.revealed===model.steps.length});
    const modelControls=el('div',{class:'model-controls'});modelControls.append(btn(s.flat?'Объёмная модель':'В этой плоскости',()=>{s.flat=!s.flat;save();show('labs',false);},'plane-toggle',{'data-action':'lab-flat'}),btn('Исходный вид',()=>{s.camera={yaw:-.65,pitch:.46};save();show('labs',false);},'reset-camera'));modelPanel.append(modelControls);
    const panel=el('div',{class:'master-panel lab-step-panel'});panel.append(p('Рассмотрено граней: '+s.revealed+' из '+model.steps.length,'eyebrow'));
    if(!s.prediction&&s.revealed===0){panel.append(el('h3',{},'Сначала твой прогноз'),p('Предположи форму пересечения или выбери «Пока не могу предположить». После этого можно проверить каждую грань.'),btn('Выполнить действие в этой плоскости',()=>{},'primary',{'data-action':'lab-next',disabled:true}));}else if(s.justBuilt&&s.revealed<model.steps.length){panel.append(el('h3',{},'Действие выполнено в '+plane.label),p(step.action),p('Новая линия остаётся в своей рабочей плоскости. Перейди к следующей грани отдельным действием.','small'),btn('К следующей грани',()=>{s.justBuilt=false;save();show('labs',false);},'primary',{'data-action':'lab-advance'}));}else if(s.revealed<model.steps.length){panel.append(el('h3',{},step.title),p(plane.description,'plane-tag'),p(step.reason),p(step.action,'step-note'),btn('Выполнить действие в этой плоскости',()=>{if(!s.prediction&&s.revealed===0)return;s.revealed++;s.justBuilt=true;s.predictionLocked=true;save();show('labs',false);},'primary',{'data-action':'lab-next'}));}else{
      panel.append(el('h3',{},model.classification));if(s.prediction)panel.append(p(s.prediction==='unknown'?'Теперь сравни наблюдение с новым предположением для соседнего положения.':s.prediction===predictionKey(model)?'Прогноз совпал. Теперь объясни, почему.':'Результат отличается от прогноза. Найди, где изменились пересечения рёбер.','feedback '+(s.prediction==='unknown'?'':s.prediction===predictionKey(model)?'good':'retry')));
      if(model.dimension===2)panel.append(p('Площадь: '+A.formatNumber(model.area)+' · периметр: '+A.formatNumber(model.perimeter),'lab-measures'),p('Числа вычислены по пространственным координатам. Они служат проверкой, а не доказательством общей формулы.','teacher-note'));
      for(const row of model.extra)panel.append(p(row.label+': '+A.formatNumber(row.value)));
      if(model.normalInfo){const n=model.normalInfo;panel.append(p(n.full?'Сечение пересекает все четыре боковых ребра.':'Не все боковые рёбра пересечены: это не полное нормальное сечение для формулы боковой поверхности.','step-note'),p('Для пересечения всех боковых рёбер требуется '+A.formatNumber(n.low)+' ≤ уровень ≤ '+A.formatNumber(n.high)+'. '+(!n.exists?'Нижняя граница больше верхней: при этой высоте полного нормального сечения внутри данной призмы нет.':'')))}
      panel.append(btn('Повторить построение при тех же данных',()=>{archiveLab(s,model);s.revealed=0;s.justBuilt=false;s.notes='';save();show('labs',false);},'ghost',{'data-action':'lab-restart'}));
    }
    work.append(modelPanel,panel);portal.append(work);
    if(s.revealed){const old=el('ol');model.steps.slice(0,s.revealed).forEach(st=>{const li=el('li');li.append(el('strong',{},st.title),p(st.action),p(st.reason,'small'));old.append(li);});portal.append(disclosure('Выполненные действия по граням',[old]));}
    if(s.revealed===model.steps.length){const table=el('table',{class:'master-table'}),head=el('thead'),hr=el('tr');['Ребро','F в начале','F в конце','Параметр / случай'].forEach(x=>hr.append(el('th',{},x)));head.append(hr);table.append(head);const body=el('tbody');model.edgeRows.forEach(row=>{const tr=el('tr');[row.edge,A.formatNumber(row.from),A.formatNumber(row.to),row.parameter===null?(row.coplanar?'всё ребро в плоскости':'пересечения нет'):A.formatNumber(row.parameter)+(row.parameter<0||row.parameter>1?' — за ребром':' — на ребре')].forEach(x=>tr.append(el('td',{},x)));body.append(tr);});table.append(body);portal.append(disclosure('Проверить пересечения каждого конечного ребра',[elWrap(table,'table-scroll')]));}
    const notes=el('section',{class:'master-panel'});notes.append(el('label',{'for':'lab-notes'},'Мой вывод: наблюдение отдельно, доказательство отдельно'));const area=el('textarea',{id:'lab-notes',placeholder:'Наблюдаю: …\nПредполагаю: …\nОбосновываю: …'});area.value=s.notes;area.addEventListener('input',()=>{s.notes=area.value;save();});notes.append(area,p('При изменении параметра выполненная работа автоматически остаётся в журнале опытов.','teacher-note'));portal.append(notes);
    if(s.history.length){const history=el('div');s.history.slice().reverse().forEach(h=>{const row=el('article',{class:'drill-history-row'});row.append(p('Уровень '+A.formatNumber(h.level)+(spec.height?', h='+A.formatNumber(h.height):'')+' · '+h.result),p('Первоначальный прогноз: '+predictionLabel(h.prediction)+'.','small'),p(h.notes||'Вывод не записан.','small'),btn('Вернуться к этому опыту',()=>{archiveLab(s,model);Object.assign(s,{level:h.level,height:h.height,revealed:h.revealed,justBuilt:!!h.justBuilt,prediction:h.prediction,predictionLocked:!!h.predictionLocked||h.revealed>0,notes:h.notes});save();show('labs',false);},'ghost'));history.append(row);});portal.append(disclosure('Журнал опытов ('+s.history.length+')',[history]));}
  }
  function elWrap(child,cls){const x=el('div',{class:cls});x.append(child);return x;}
  function renderControl(){
    portal.append(title('Проверяем на новом наборе','САМОСТОЯТЕЛЬНАЯ РАБОТА','Пять заданий без сообщения о верности по ходу. После завершения — результат, объяснения и подходящие тренировки. Письменное доказательство проверяется отдельно.'));
    const select=el('select',{'aria-label':'Самостоятельная работа'});A.assessments.forEach(x=>select.append(el('option',{value:x.id},x.title)));select.value=state.examId;select.addEventListener('change',()=>{state.examId=select.value;save();show('control',false);});portal.append(select);
    const id=state.examId,s=state.exams[id]||(state.exams[id]={run:0,started:false,finished:false,answers:{},proof:'',assisted:false,history:[]}),exam=A.makeExam(id,s.run,s.started ? s.writtenVersion || 0 : 1);
    if(!s.started){const box=el('section',{class:'master-panel'});box.append(el('h3',{},exam.title),p(exam.description),p('Таймера нет. Ответы можно менять до отправки. Если во время работы открыть материалы курса, это сохранится как помощь.'),btn('Начать пять заданий',()=>{s.writtenVersion=1;s.started=true;s.position=0;save();show('control',false);},'primary',{'data-action':'exam-start'}));portal.append(box);return;}
    if(s.finished){const score=exam.questions.reduce((n,q,i)=>n+Number(correct(q,s.answers[i])),0),box=el('section',{class:'master-panel'});box.append(el('h3',{},'Автоматическая часть: '+score+' из '+exam.questions.length),p(s.assisted?'Во время этой попытки открывались другие материалы. Результат сохранён как работа с помощью.':'В этой попытке переходы к помощи не зафиксированы. Это результат короткой автоматической части, а не оценка полного доказательства.'),p('Самостоятельная работа завершена. Для следующей проверки будет подготовлен новый набор.','teacher-note'));
      exam.questions.forEach((q,i)=>{const good=correct(q,s.answers[i]),row=el('article',{class:'exam-review '+(good?'correct':'needs-work')});row.append(el('h4',{},(i+1)+'. '+(good?'Ответ совпал':'Нужно разобрать')),p(q.prompt),p('Твой ответ: '+(q.kind==='choice'?q.options[Number(s.answers[i])]:s.answers[i])),p('Верный ответ: '+answerText(q)),p(q.rule));if(!good)row.append(btn('Потренировать это умение',()=>openPractice(q.topic),'ghost'));box.append(row);});
      box.append(el('h3',{},'Письменная часть для преподавателя'),p(exam.proof),p(s.proof||'Текст доказательства пока не записан.','proof-record'),...(exam.written ? [disclosure('Сверить построение и обоснование', [p(exam.written.solution)])] : []),p('Автоматическая оценка доказательства не выставляется. Обсудите плоскость каждого действия, перенос принадлежности, полноту границы и вычисления.','teacher-note'),btn('Новая попытка с новым набором',()=>{s.history.push({run:s.run,score,assisted:s.assisted,answers:s.answers,proof:s.proof,writtenVersion:s.writtenVersion || 0});Object.assign(s,{run:s.run+1,started:false,finished:false,answers:{},proof:'',assisted:false,helpReason:'',position:0});save();show('control',false);},'primary',{'data-action':'exam-new'}));portal.append(box);return;
    }
    s.position=Math.max(0,Math.min(s.position||0,exam.questions.length-1));const i=s.position,q=exam.questions[i],card=el('section',{class:'master-panel exam-question'});card.append(p('Задание '+(i+1)+' из '+exam.questions.length+' · сохранено ответов '+Object.keys(s.answers).filter(k=>String(s.answers[k]).trim()!=='').length,'eyebrow'),p(q.prompt,'drill-prompt'));
    if(q.scene){const frame=el('div',{class:'model-frame drill-model'});frame.append(el('div',{class:'model-caption'},'Исходная фигура'));card.append(frame);visual=api.createScene(frame,q.scene,()=>{});visual.update({viewCount:0,planeId:null,planeView:false,camera:{yaw:-.65,pitch:.46},showHelpers:true,showResult:false});}
    if(q.kind==='choice'){const choices=el('div',{class:'check-options'});q.options.forEach((answer,index)=>{const b=btn('',()=>{s.answers[i]=index;save();show('control',false);},s.answers[i]!==undefined&&Number(s.answers[i])===index?'selected':'',{'data-exam-option':index});b.append(math(answer));choices.append(b);});card.append(choices);}else{const input=el('input',{id:'exam-answer',type:'text',inputmode:'decimal',autocomplete:'off',value:s.answers[i]??''});card.append(el('label',{'for':'exam-answer'},'Ответ'+(q.unit?' ('+q.unit+')':'')),input,p('Можно вводить десятичное число или дробь 4/3.','small muted'));input.addEventListener('input',()=>{s.answers[i]=input.value;save();});}
    card.append(p('Ответ сохраняется. Верность будет показана только после отправки всех пяти заданий.','teacher-note'));
    const navigation=el('div',{class:'master-actions'});navigation.append(btn('← Предыдущее',()=>{s.position--;save();show('control',false);},'ghost',{disabled:i===0}),btn('Следующее →',()=>{s.position++;save();show('control',false);},'primary',{disabled:i===exam.questions.length-1}));card.append(navigation);portal.append(card);
    const proof = el('section', {class:'master-panel'});
    proof.append(el('h3', {}, 'Отдельное построение и доказательство'), p(exam.proof));
    portal.append(proof);
    if (exam.written) {
      const frame = el('div', {class:'model-frame drill-model'});
      frame.append(el('div', {class:'model-caption'}, 'Исходный чертёж. Выполни построение на бумаге.'));
      proof.append(frame);
      proofVisual = api.createScene(frame, exam.written.scene, () => {});
      proofVisual.update({viewCount:0, planeId:null, planeView:false, camera:{yaw:-.65,pitch:.46}, showHelpers:false, showResult:false});
    }
    const draft = el('textarea', {id:'exam-proof', placeholder:'Укажи плоскость каждого построения и объясни вывод.'});
    draft.value = s.proof;
    draft.addEventListener('input', () => {s.proof=draft.value; save();});
    proof.append(el('label', {for:'exam-proof'}, 'Моё обоснование'), draft, p('Письменную работу проверяет преподаватель. Баллы за пять коротких вопросов считаются отдельно.', 'teacher-note'));
    const notice=el('p',{class:'feedback',role:'status'}),finish=btn('Отправить все пять ответов',()=>{const missing=exam.questions.findIndex((x,j)=>s.answers[j]===undefined||String(s.answers[j]).trim()===''||(x.kind==='number'&&!Number.isFinite(parse(s.answers[j]))));if(missing>=0){notice.className='feedback retry';notice.textContent='Заполни ответ к заданию '+(missing+1)+' в допустимом формате. Верность пока не оценивается.';return;}s.finished=true;save();show('control',false);},'primary',{'data-action':'exam-finish'});portal.append(finish,notice);
  }
  function renderTeacher(){
    portal.append(title('Как проводить курс','ДЛЯ ПРЕПОДАВАТЕЛЯ','Порядок обучения задаёт путь из '+(C.learningPath||[]).length+' этапов. Для основных тем предложен ориентир нагрузки: 32 занятия по 55 минут. Время на вводные ступени, переходные упражнения и возвращение к пробелам добавляется по готовности ученика.'));
    const principles=el('div',{class:'master-grid'});for(const [name,text]of C.teachingPrinciples||[]){const card=el('section',{class:'master-card'});card.append(el('h3',{},name),p(text));principles.append(card);}portal.append(principles);
    const plan=el('table',{class:'master-table'}),head=el('tr');['Число занятий','Фокус','Работа','Выход'].forEach(t=>head.append(el('th',{},t)));plan.append(head);for(const row of C.sessionPlan||[]){const tr=el('tr'),range=String(row[0]).match(/\d+/g)?.map(Number)||[],duration=range.length>1?range[range.length-1]-range[0]+1:range[0]||row[0];[duration,...row.slice(1)].forEach(x=>tr.append(el('td',{},x)));plan.append(tr);}portal.append(disclosure('Ориентировочное время по темам',[p('Таблица показывает нагрузку по темам. Последовательность заданий и подготовительных действий смотрите в разделе «Мой путь».'),elWrap(plan,'table-scroll')]));
    const rubric=el('div');for(const [label,text]of C.rubric||[])rubric.append(el('h4',{},label),p(text));portal.append(disclosure('Критерии проверки доказательства',[p('По каждому пункту: обосновано / требуется уточнение / пока отсутствует. Чекбокс ученика — самоотчёт, не автоматическая проверка.'),rubric]));
    const sources=el('div');for(const src of C.sources||[]){const box=el('article',{class:'source-card'});box.append(el('h4',{},src.title),p(src.detail,'small muted'),p(src.used),p(src.coverage,'small'));sources.append(box);}portal.append(disclosure('Как использованы пять комплектов материалов',[p('Курс организован по умениям. Авторские условия, сохранённые задачи пособия и лаборатории обозначены отдельно.'),sources]));
    if(C.sourceNotes?.length)portal.append(disclosure('Уточнения и ошибки источников',C.sourceNotes.map(x=>p(x))));
    const session=el('section',{class:'master-panel'});session.append(el('h3',{},'Ритм одного занятия'),list(['5–7 минут: вспомнить нужное правило на коротком новом примере.','8–12 минут: разобрать одну идею с моделью, выполняя по одному действию.','15–20 минут: самостоятельное построение и объяснение плоскостей.','5–10 минут: при затруднении потренировать отдельное умение и вернуться.','5–8 минут: новая короткая задача на перенос и запись вывода.']),p('Слабому ученику можно оставить один полноценный разбор и один новый аналог. Более сильному — предложить второй метод, обратную задачу или исследование параметра.','teacher-note'));portal.append(session);
    const stats=stageStats();portal.append(p('История этого браузера: '+stats.started+' начатых карточек, '+stats.built+' законченных построений. Состояние отдельных задач, практикума, лабораторий и контрольных сохраняется локально. Для переноса между устройствами можно выгрузить отчёт, но совместная доска этим файлом не синхронизируется.'));
    portal.append(btn('Скачать отчёт о ходе работы',()=>{const blob=new Blob([JSON.stringify({course:C.title,version:C.version,exportedAt:new Date().toISOString(),lessons:api.getState(),activities:state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=el('a',{href:url,download:'Sections_Learning_Progress.json'});link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'ghost'));
  }
  nav=el('nav',{class:'master-nav',role:'tablist','aria-label':'Разделы большого курса'});for(const[id,label]of [['map','Мой путь'],['lessons','Задачи'],['practice','Практика'],['labs','Опыты'],['control','Контроль'],['teacher','Учителю']])nav.append(btn(label,()=>{if(id==='practice')state.practice.reviewStage=null;show(id);},'',{'data-view':id,role:'tab','aria-selected':false}));
  portal=el('main',{class:'master-portal',id:'master-portal',tabindex:'-1'});host.insertBefore(nav,layout);host.insertBefore(portal,layout);
  window.addEventListener('sections:practice',e=>openPractice(e.detail.topic,{lessonId:e.detail.lessonId,scroll:window.scrollY}));
  window.addEventListener('sections:lesson',e=>{const lesson=lessonById.get(e.detail?.id||e.detail?.lessonId||api.getState().current);if(lesson?.pathStageId){state.path.stageId=lesson.pathStageId;save();}if(state.view!=='lessons')show('lessons',false);});
  window.addEventListener('sections:route',e=>{const stageId=e.detail?.stageId||lessonById.get(api.getState().current)?.pathStageId;if((C.learningPath||[]).some(x=>x.id===stageId))state.path.stageId=stageId;show('map');});
  window.addEventListener('sections:start', () => {
    state.path.stageId = C.learningPath?.[0]?.id || defaults.path.stageId;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { location.hash = ''; }
    show('map');
    window.scrollTo({top: 0, behavior: 'auto'});
  });
  window.SECTIONS_MASTER=Object.freeze({getState:()=>JSON.parse(JSON.stringify(state)),show,openLesson,openPractice,openLab,openExam,openResearch});
  // A shared exercise link must open that exercise, not hide it behind the map.
  let linkedLesson=null;
  try { linkedLesson=lessonById.get(decodeURIComponent(location.hash.slice(1))) || null; } catch (_) {}
  if(linkedLesson){
    state.view='lessons';
    if(linkedLesson.pathStageId)state.path.stageId=linkedLesson.pathStageId;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }
  show(['map','research','lessons','practice','labs','control','teacher'].includes(state.view)?state.view:'map',false);
  if (linkedLesson) window.requestAnimationFrame(() => {
    if (state.view === 'lessons' && api.getState().current === linkedLesson.id) {
      document.getElementById('lesson-title')?.scrollIntoView({block:'start', behavior:'auto'});
    }
  });
})();

(function () {
  'use strict';
  // A teaching preview is isolated from the course, its storage and board state.
  if (window.SECTIONS_BOARD_SESSION || window.SECTIONS_TOUR) return;
  const api = window.SECTIONS_APP;
  if (!api || typeof api.createScene !== 'function') return;
  const motion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let dialog, shade, heading, notice, media, caption, counter, transcript, playButton, previousButton, nextButton, repeatButton;
  let opened = false, nativeModal = false, opener = null, timer = null, playing = false, scene = null;
  let kind = 'start', position = 0, frames = [], camera = { yaw: -2.14, pitch: -.4 };
  const delay = 3200;

  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs || {})) {
      if (name === 'class') node.className = value;
      else node.setAttribute(name, String(value));
    }
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, action, fn) {
    const node = el('button', { type: 'button', 'data-tour-action': action }, label);
    node.addEventListener('click', fn); return node;
  }
  function textOf(selector, fallback) {
    const text = document.querySelector(selector)?.textContent?.trim();
    return text ? text.slice(0, 180) : fallback;
  }
  function previewItem(text, active, className) {
    return el('span', { class: (className || 'sections-tour-mini-button') + (active ? ' is-active' : '') }, text);
  }
  function makeFrames(selected) {
    if (selected === 'construct') return [
      { title: 'Сначала прочитай условие', text: 'Точки P, Q и R отмечены на рёбрах AB, AD и AE куба. Построй сечение плоскостью PQR.', count: 0, plane: null },
      { title: '1. Назови грань для P и Q', text: 'P лежит на AB, а Q — на AD. Эти рёбра принадлежат грани ABCD. Сначала выделяем её плоскость; линию пока не проводим.', count: 0, plane: 'ABCD' },
      { title: 'Проведи PQ в грани ABCD', text: 'P и Q принадлежат грани ABCD и секущей плоскости. Поэтому отрезок PQ лежит в обеих плоскостях и является стороной сечения.', count: 1, plane: 'ABCD' },
      { title: '2. Назови грань для Q и R', text: 'Q лежит на AD, а R — на AE. Общая грань этих точек — ADHE. Сначала называем плоскость следующего действия.', count: 1, plane: 'ADHE' },
      { title: 'Проведи QR в грани ADHE', text: 'Q и R принадлежат грани ADHE и секущей плоскости. Соединяем их и получаем вторую сторону сечения.', count: 2, plane: 'ADHE' },
      { title: '3. Назови грань для R и P', text: 'R лежит на AE, а P — на AB. Обе точки принадлежат грани ABFE. До последней линии выделяем эту плоскость.', count: 2, plane: 'ABFE' },
      { title: 'Проведи RP в грани ABFE', text: 'R и P принадлежат грани ABFE и секущей плоскости. Отрезок RP замыкает треугольник PQR.', count: 3, plane: 'ABFE' },
      { title: 'Сечение — треугольник PQR', text: 'Каждая сторона лежит на грани куба и в секущей плоскости. Плоскость отсекает угол при A: с противоположными гранями она не встречается. Теперь объясни, почему допустима каждая из трёх линий.', count: 3, plane: null, result: true }
    ];
    if (selected === 'resume') {
      const hasSaved = !!document.querySelector('[data-action="path-resume"]');
      const savedTitle = hasSaved ? textOf('#lesson-title', 'Твоя сохранённая задача') : 'Пример сохранённой задачи';
      const resumeLabel = textOf('[data-action="path-resume"]', 'Продолжить: …');
      return [
        { title: 'Открой «Мой путь»', text: hasSaved ? 'Здесь видны этапы и сохранённое занятие. Кнопка продолжения возвращает к твоей работе.' : 'Это учебный показ. Кнопка продолжения появится после того, как ты начнёшь работу.', view: 'navigation', active: 'map' },
        { title: 'Найди кнопку «Продолжить: …»', text: 'Название на кнопке подсказывает, какая задача сохранена. Нажми её в самом курсе, когда закроешь показ.', view: 'resume', label: resumeLabel, hasSaved },
        { title: 'Вернись на точное место', text: 'Откроется та же карточка с твоими шагами, ответом и записью. Незавершённая проверка останется на месте.', view: 'saved', label: savedTitle },
        { title: 'Выполни оставшееся действие', text: 'Продолжай с сохранённого шага: выбери плоскость, построй линию или проверь ответ — в зависимости от того, где остановился.', view: 'remaining', label: savedTitle }
      ];
    }
    return [
      { title: 'Открой «Мой путь»', text: 'Начало курса — одна грань и одна точка. Весь маршрут можно посмотреть на карте этапов.', view: 'navigation', active: 'map' },
      { title: 'Начни с первой грани', text: 'В первом этапе нажми «Начать с первой грани». Сначала сделай прогноз, проверь модель и запиши вывод. Затем перейди к примеру «Находим одну грань».', view: 'start' },
      { title: 'Выбери «Сделаем вместе»', text: 'Первый пример показывает одно действие. После него будут похожий пример с опорой и новый пример для твоей попытки.', view: 'mode' },
      { title: 'Выполни один шаг', text: 'Прочитай, в какой плоскости работаем. Нажми «Выполнить этот шаг» и посмотри, что выделилось на модели.', view: 'step' },
      { title: 'Перейди к следующему примеру', text: 'Ответь на короткий вопрос. Затем нажми «Следующий пример →». Свой ход работы можно продолжить позже.', view: 'next' }
    ];
  }
  function demoLesson() {
    const faces = [
      { id: 'ABCD', label: 'ABCD', vertices: ['A','B','C','D'] },
      { id: 'EFGH', label: 'EFGH', vertices: ['E','F','G','H'] },
      { id: 'ABFE', label: 'ABFE', vertices: ['A','B','F','E'] },
      { id: 'BCGF', label: 'BCGF', vertices: ['B','C','G','F'] },
      { id: 'CDHG', label: 'CDHG', vertices: ['C','D','H','G'] },
      { id: 'ADHE', label: 'ADHE', vertices: ['A','D','H','E'] }
    ];
    return {
      id: 'tour-cube-triangle', title: 'Учебный пример: сечение куба PQR',
      model: {
        points: { A:[0,0,0], B:[1,0,0], C:[1,1,0], D:[0,1,0], E:[0,0,1], F:[1,0,1], G:[1,1,1], H:[0,1,1], P:[.35,0,0], Q:[0,.55,0], R:[0,0,.70] },
        edges: [['A','B'],['B','C'],['C','D'],['D','A'],['E','F'],['F','G'],['G','H'],['H','E'],['A','E'],['B','F'],['C','G'],['D','H']],
        faces, planes: faces, given: ['P','Q','R'], initialCamera: { yaw: -2.14, pitch: -.4 }
      },
      steps: [
        { plane: 'ABCD', points: [], segments: [{ a:'P', b:'Q', kind:'section' }] },
        { plane: 'ADHE', points: [], segments: [{ a:'Q', b:'R', kind:'section' }] },
        { plane: 'ABFE', points: [], segments: [{ a:'R', b:'P', kind:'section' }] }
      ],
      result: { polygon: ['P','Q','R'] }
    };
  }
  function miniNavigation(active) {
    const nav = el('div', { class:'sections-tour-mini-nav' });
    for (const [id, fallback] of [['map','Мой путь'],['lessons','Задачи'],['practice','Практика']]) {
      nav.append(previewItem(textOf('[data-view="'+id+'"]',fallback),id===active));
    }
    return nav;
  }
  function renderPreview(frame) {
    media.replaceChildren(); media.classList.remove('sections-tour-model');
    const mini = el('div', { class:'sections-tour-mini', 'aria-hidden':'true', inert:'' });
    mini.append(el('div', { class:'sections-tour-mini-brand' }, 'Сечения с нуля'), miniNavigation(frame.view==='navigation'?'map':null));
    const panel = el('div', { class:'sections-tour-mini-panel' });
    if (frame.view === 'navigation') {
      panel.append(el('strong',{},'Мой путь'),el('p',{},'Одна грань и одна точка'),previewItem('1',true,'sections-tour-mini-node'),previewItem('2',false,'sections-tour-mini-node'),previewItem('3',false,'sections-tour-mini-node'));
    } else if (frame.view === 'start') {
      panel.append(el('span',{class:'sections-tour-mini-eyebrow'},'Этап 1 из 26'),el('strong',{},'Одна грань и одна точка'),previewItem('Начать с первой грани',true));
    } else if (frame.view === 'mode') {
      panel.append(el('strong',{},'Находим одну грань'),el('p',{},'Посмотрим одно действие'),previewItem('Сделаем вместе',true));
    } else if (frame.view === 'step') {
      panel.append(el('strong',{},'Работаем в плоскости'),el('p',{},'Сначала называем грань и нужную точку.'),previewItem('Выполнить этот шаг',true));
    } else if (frame.view === 'next') {
      panel.append(el('strong',{},'Один короткий вопрос'),el('p',{},'Проверь понимание'),previewItem('Следующий пример →',true));
    } else if (frame.view === 'resume') {
      panel.append(el('strong',{},'Мой путь'),el('p',{},frame.hasSaved?'Твоё сохранённое занятие':'После начала работы'),previewItem(frame.label,true));
    } else if (frame.view === 'saved') {
      panel.append(el('strong',{},frame.label),previewItem('Что уже сделали',true),el('p',{},'Шаги · ответ · мои рассуждения'));
    } else {
      panel.append(el('strong',{},frame.label),el('p',{},'Сохранённое действие'),previewItem('Продолжай с того места, где остановился',true));
    }
    mini.append(panel); media.append(mini);
  }
  function controls() {
    if (!dialog) return;
    const reduced = !!motion.matches;
    playButton.disabled = reduced;
    playButton.textContent = playing ? 'Пауза' : position === frames.length-1 ? 'Смотреть ещё раз' : 'Смотреть';
    playButton.setAttribute('aria-pressed',String(playing));
    previousButton.disabled = position===0;
    nextButton.disabled = position===frames.length-1;
    notice.textContent = reduced ? 'Без автоматического движения: переключай кадры кнопками «Назад» и «Далее».' : 'Показ; твоя работа не меняется.';
  }
  function pause() { if(timer!==null)window.clearTimeout(timer);timer=null;playing=false;controls(); }
  function schedule() {
    if (!opened || !playing || motion.matches || document.hidden) { pause(); return; }
    timer = window.setTimeout(() => {
      timer=null;
      if (!opened || !playing || motion.matches || document.hidden) { pause(); return; }
      if(position<frames.length-1){position++;render();}
      if(position===frames.length-1)pause();else schedule();
    },delay);
  }
  function render() {
    const frame=frames[position];
    media.dataset.tourFrame=String(position);
    counter.textContent='Кадр '+(position+1)+' из '+frames.length;
    caption.replaceChildren(el('h3',{id:'sections-tour-frame-title'},frame.title),el('p',{},frame.text));
    if(kind==='construct') {
      media.classList.add('sections-tour-model');
      if(!scene) {
        media.replaceChildren();
        scene=api.createScene(media,demoLesson(),value=>{camera={...value};});
        media.querySelector('svg')?.setAttribute('aria-label','Учебная модель куба с точками P, Q и R. Можно повернуть мышью или стрелками.');
      }
      scene.update({viewCount:frame.count,planeId:frame.plane,planeView:false,camera:{...camera},showHelpers:true,cleanView:false,showResult:!!frame.result});
    } else renderPreview(frame);
    controls();
  }
  function go(delta) { pause();position=Math.max(0,Math.min(frames.length-1,position+delta));render(); }
  function repeat() { pause();position=0;camera={yaw:-2.14,pitch:-.4};render(); }
  function togglePlay() {
    if(playing){pause();return;}
    if(motion.matches||document.hidden)return;
    if(position===frames.length-1){position=0;render();}
    playing=true;controls();schedule();
  }
  function focusable() {
    return [...dialog.querySelectorAll('button:not([disabled]),summary,a[href],input:not([disabled]),[tabindex="0"]')].filter(node=>{
      if(node.closest('[hidden]'))return false;
      const closed=node.closest('details:not([open])');
      return !closed||node===closed.querySelector('summary');
    });
  }
  function finish(restoreFocus) {
    if(!opened)return;
    opened=false;pause();scene?.destroy();scene=null;
    shade.hidden=true;dialog.classList.remove('sections-tour-fallback');dialog.removeAttribute('open');
    const target=opener;opener=null;
    if(restoreFocus&&target?.isConnected&&typeof target.focus==='function')target.focus({preventScroll:true});
  }
  function close(restoreFocus=true) {
    if(!opened)return;
    if(nativeModal&&typeof dialog.close==='function')dialog.close();
    finish(restoreFocus);
  }
  function ensureDialog() {
    if(dialog)return;
    shade=el('div',{class:'sections-tour-shade',hidden:''});
    dialog=el('dialog',{class:'sections-tour','data-sections-tour':'','aria-labelledby':'sections-tour-title','aria-describedby':'sections-tour-notice',tabindex:'-1'});
    const top=el('header',{class:'sections-tour-header'});
    heading=el('h2',{id:'sections-tour-title'});
    top.append(heading,button('Закрыть','close',()=>close()));
    notice=el('p',{id:'sections-tour-notice',class:'sections-tour-notice'});
    const modelNote=el('p',{class:'sections-tour-example-note'},'Учебный пример. В заданиях будут другие точки.');
    modelNote.dataset.tourExample='';
    media=el('div',{class:'sections-tour-media','data-tour-frame':'0'});
    caption=el('section',{class:'sections-tour-caption','aria-live':'polite','aria-atomic':'true'});
    counter=el('p',{class:'sections-tour-counter'});
    const actions=el('div',{class:'sections-tour-controls','aria-label':'Управление показом'});
    previousButton=button('Назад','previous',()=>go(-1));
    playButton=button('Смотреть','play',togglePlay);
    nextButton=button('Далее','next',()=>go(1));
    repeatButton=button('Сначала','repeat',repeat);
    actions.append(previousButton,playButton,nextButton,repeatButton);
    const text=el('details',{'data-tour-transcript':''});
    text.append(el('summary',{},'Все шаги текстом'));transcript=el('ol');text.append(transcript);
    dialog.append(top,notice,modelNote,media,caption,counter,actions,text);
    document.body.append(shade,dialog);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    dialog.addEventListener('close',()=>finish(true));
    shade.addEventListener('click',()=>close());
    dialog.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key!=='Tab')return;
      const nodes=focusable(),first=nodes[0],last=nodes[nodes.length-1];
      if(!first){event.preventDefault();dialog.focus();return;}
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog)){event.preventDefault();first.focus();}
    });
    document.addEventListener('focusin',event=>{
      if(opened&&!dialog.contains(event.target))(focusable()[0]||dialog).focus({preventScroll:true});
    });
  }
  function open(selected,trigger) {
    if(!['start','resume','construct'].includes(selected))return false;
    ensureDialog();pause();scene?.destroy();scene=null;media.replaceChildren();
    const candidate=trigger||document.activeElement;
    if(candidate&&!dialog.contains(candidate))opener=candidate;
    kind=selected;position=0;frames=makeFrames(kind);camera={yaw:-2.14,pitch:-.4};
    dialog.dataset.tourKind=kind;
    heading.textContent=kind==='start'?'Как начать курс':kind==='resume'?'Как продолжить занятие':'Как построить сечение';
    const exampleNote=dialog.querySelector('[data-tour-example]');
    const emptyResume=kind==='resume'&&!document.querySelector('[data-action="path-resume"]');
    exampleNote.hidden=kind!=='construct'&&!emptyResume;
    exampleNote.textContent=emptyResume?'Учебный показ. Сохранённого занятия пока нет.':'Учебный пример. В заданиях будут другие точки.';
    transcript.replaceChildren(...frames.map(frame=>{const item=el('li');item.append(el('strong',{},frame.title),el('p',{},frame.text));return item;}));
    dialog.querySelector('[data-tour-transcript]').open=false;
    if(!opened){
      opened=true;nativeModal=false;
      if(typeof dialog.showModal==='function'){
        try{dialog.showModal();nativeModal=true;}catch(_){nativeModal=false;}
      }
      if(!nativeModal){dialog.setAttribute('open','');dialog.setAttribute('aria-modal','true');dialog.setAttribute('role','dialog');dialog.classList.add('sections-tour-fallback');shade.hidden=false;}
    }
    render();dialog.querySelector('[data-tour-action="close"]').focus({preventScroll:true});
    return true;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',()=>close(false));
  if(typeof motion.addEventListener==='function')motion.addEventListener('change',()=>{if(motion.matches)pause();controls();});
  else if(typeof motion.addListener==='function')motion.addListener(()=>{if(motion.matches)pause();controls();});
  window.SECTIONS_TOUR=Object.freeze({open});
})();
