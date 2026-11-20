'use strict';

// Real Chromium/SVG acceptance. Synthetic personal work only; no account or room.
// Run with the workflow's pinned Playwright. Evidence goes outside the worktree.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const course = require('../stereo-course/sections/data/course.json');
const WIDTHS = [320, 390, 768, 1280];
const STATES = ['initial', 'intermediate', 'final'];
const URL_PATH = '/stereo-course/sections/';
const ACTIVITY_KEY = 'mathexam.sections.master.activities.v1';
const byId = new Map(course.lessons.map(lesson => [lesson.id, lesson]));
const key = (a, b) => [a, b].sort().join('|');
const sub = (a, b) => a.map((n, i) => n - b[i]);
const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mean = points => points[0].map((_, i) => points.reduce((sum, p) => sum + p[i], 0) / points.length);
const displayName = name => name.replace(/_?(\d+)$/u, (_, digits) => [...digits].map(n => '₀₁₂₃₄₅₆₇₈₉'[Number(n)]).join(''));
const facesOf = lesson => (lesson.model.faces || []).map((face, i) => Array.isArray(face) ? { id: 'face-' + i, vertices: face } : face);
const planesOf = lesson => new Map([...facesOf(lesson), ...(lesson.model.planes || [])].map(plane => [plane.id, plane]));
const bodyNames = lesson => [...new Set([...(lesson.model.edges || []).flat(), ...facesOf(lesson).flatMap(face => face.vertices)])];

function normal(points) {
  // Newell's polygon normal, independently of the renderer's first triangle.
  const n = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  let length = Math.hypot(...n);
  if (length < 1e-10) {
    // A plane's listed points need not be a cyclic polygon.
    for (let i = 1; i < points.length - 1; i++) {
      const candidate = cross(sub(points[i], points[0]), sub(points[i + 1], points[0]));
      if (Math.hypot(...candidate) > 1e-10) return candidate.map(x => x / Math.hypot(...candidate));
    }
    throw new Error('Degenerate authored plane');
  }
  return n.map(x => x / length);
}

function fixture(lesson, state) {
  const count = state === 'initial' ? 0 : state === 'final' ? lesson.steps.length : Math.max(1, Math.floor(lesson.steps.length / 2));
  return { mode: count ? 'study' : 'choose', revealed: count, viewCount: count, justBuilt: count > 0,
    showResult: state === 'final', showHelpers: true, cleanView: false, planeView: false,
    calculationRevealed: state === 'final' ? (lesson.calculationSteps || []).length : 0,
    camera: { ...(lesson.model.initialCamera || { yaw: -.65, pitch: .46 }) } };
}

function lessonConfig(lesson, work) {
  const manual = work.construction?.active ? work.construction : null;
  // The short exercise supplies MN as a given. It earns zero formal steps.
  // The blank start of the full construction is tested immediately afterwards.
  if (lesson.id === 'starter-18' && work.mode === 'choose' && !manual && !work.recall) {
    return {count:1, planeId:null, flat:false, camera:work.camera, construction:false,
      focusNames:bodyNames(lesson), boundary:[], showResult:false};
  }
  const count = manual ? manual.actions.length : work.viewCount;
  let planeId = null;
  if (manual) planeId = manual.justBuilt ? lesson.steps[count - 1]?.plane : manual.selection.plane || (count === lesson.steps.length ? lesson.steps[count - 1]?.plane : null);
  else if (work.mode !== 'choose') {
    if (count < work.revealed) planeId = count ? lesson.steps[count - 1].plane : null;
    else if (work.justBuilt && work.revealed) planeId = lesson.steps[work.revealed - 1].plane;
    else if (lesson.steps[work.revealed] && (work.mode === 'study' || work.approved === work.revealed)) planeId = lesson.steps[work.revealed].plane;
    else if (count) planeId = lesson.steps[count - 1].plane;
  }
  const focus = count < work.revealed ? lesson.steps[count ? count - 1 : 0] :
    work.justBuilt ? lesson.steps[work.revealed - 1] : lesson.steps[Math.min(work.revealed, lesson.steps.length - 1)];
  return { count, planeId, flat: !!work.planeView && !!planeId, camera: work.camera,
    construction: !!manual, focusNames: manual ? [] : focus?.focusNames || [],
    actions: manual?.actions,
    boundary: manual?.boundaryConfirmed ? manual.boundarySelection : [],
    showResult: manual ? manual.boundaryConfirmed : !!work.showResult && count === lesson.steps.length };
}

function expectedScene(lesson, config) {
  const points = lesson.model.points, bodies = bodyNames(lesson), center = mean(bodies.map(name => points[name]));
  const radius = Math.max(1e-4, ...bodies.map(name => Math.hypot(...sub(points[name], center))));
  const plane = planesOf(lesson).get(config.planeId);
  const planePoints = plane?.vertices.map(name => points[name]);
  const n = planePoints?.length >= 3 ? normal(planePoints) : null;
  const inPlane = name => !config.flat || !n || Math.abs(dot(n, sub(points[name], planePoints[0]))) < radius * 1e-7;
  const known = new Set([...bodies, ...(lesson.model.given || [])]);
  const added = new Set();
  const segments = new Map();
  // Personal construction draws the objects actually selected by the learner.
  // In particular an intersection must not reveal a later section segment from
  // the retained guided script (bridge-06/20). Compute the two whole-line
  // extents independently using affine parameters along each selected line.
  const steps = config.construction ? config.actions.map(action => {
    const selection = action.selection, target = lesson.steps[action.step].points?.[0];
    if (selection.role) return { points: [], segments: [{ a: selection.a, b: selection.b, kind: selection.role }] };
    if (selection.firstA) {
      assert(target, lesson.id + ': an accepted intersection names its target');
      const span = (a, b) => {
        const direction = sub(points[b], points[a]), denominator = dot(direction, direction);
        const names = [...new Set([a, b, target])].sort((x, y) => dot(sub(points[x], points[y]), direction) / denominator);
        return { a: names[0], b: names.at(-1), kind: 'helper' };
      };
      return { points: [target], segments: [span(selection.firstA, selection.firstB), span(selection.secondA, selection.secondB)] };
    }
    if (selection.directionA) {
      assert(target, lesson.id + ': an accepted parallel construction names its target');
      return { points: [target], segments: [{ a: selection.point, b: target, kind: 'section' }] };
    }
    return { points: [], segments: [] };
  }) : lesson.steps.slice(0, config.count);
  steps.forEach((step, i) => {
    for (const name of step.points || []) { known.add(name); added.add(name); }
    for (const segment of step.segments || []) {
      [segment.a, segment.b].forEach(name => { known.add(name); added.add(name); });
      if (!inPlane(segment.a) || !inPlane(segment.b)) continue;
      const id = key(segment.a, segment.b), previous = segments.get(id);
      segments.set(id, { kind: previous?.kind === 'section' ? 'section' : segment.kind || 'section', step: i + 1 });
    }
  });
  // Closing the learner's checked cyclic boundary is itself an accepted
  // construction. It may turn a previously chosen helper into a section side.
  if (config.construction && config.boundary?.length) config.boundary.forEach((a, i) => {
    const b = config.boundary[(i + 1) % config.boundary.length];
    known.add(a); known.add(b); added.add(a); added.add(b);
    if (!inPlane(a) || !inPlane(b)) return;
    const id = key(a, b);
    if (segments.get(id)?.kind !== 'section') segments.set(id, { kind: 'section', step: config.count });
  });
  // The authored small subsets are intentional. Completed endpoints and the
  // current action's explicit focus must still be available. Flat views may
  // omit off-plane points; manual choices expose every currently known point.
  const guidance = lesson.starter || lesson.scaffold;
  const subset = lesson.starter ? lesson.starterVisibleNames : lesson.scaffoldVisibleNames;
  let labels = [...known];
  if (guidance && Array.isArray(subset) && !config.construction) {
    const focus = config.focusNames ?? lesson.steps[Math.max(0, config.count - 1)]?.focusNames ?? [];
    labels = [...new Set([...subset, ...added, ...focus])].filter(name => known.has(name));
  }
  labels = labels.filter(name => points[name] && inPlane(name)).sort();
  const viewDirection = [Math.sin(config.camera.yaw) * Math.cos(config.camera.pitch), Math.cos(config.camera.yaw) * Math.cos(config.camera.pitch), Math.sin(config.camera.pitch)];
  const faces = facesOf(lesson).map(face => {
    const vertices = face.vertices.map(name => points[name]);
    let outward = normal(vertices);
    if (dot(outward, sub(mean(vertices), center)) < 0) outward = outward.map(x => -x);
    // Finite convex polygon membership, independently of the renderer's
    // whole-solid half-space cache. Coplanarity alone would include extensions.
    const contains = point => {
      if (Math.abs(dot(outward, sub(point, vertices[0]))) > radius * 1e-7) return false;
      const turns = vertices.map((a, i) => dot(cross(sub(vertices[(i + 1) % vertices.length], a), sub(point, a)), outward));
      const epsilon = radius * radius * 1e-7;
      return turns.every(value => value >= -epsilon) || turns.every(value => value <= epsilon);
    };
    return { contains, edgeKeys: face.vertices.map((name, i) => key(name, face.vertices[(i + 1) % face.vertices.length])), back: dot(outward, viewDirection) < -1e-8 };
  });
  for (const [id, segment] of segments) {
    const [a, b] = id.split('|');
    const supporting = faces.filter(face => face.contains(points[a]) && face.contains(points[b]));
    segment.hidden = !config.flat && segment.kind !== 'helper' && supporting.length > 0 && supporting.every(face => face.back);
  }
  const edges = Object.fromEntries((lesson.model.edges || []).filter(([a, b]) => inPlane(a) && inPlane(b)).map(([a, b]) => {
    const adjacent = faces.filter(face => face.edgeKeys.includes(key(a, b)));
    return [key(a, b), !config.flat && adjacent.length === 2 && adjacent.every(face => face.back)];
  }));
  const polygon = config.showResult && lesson.result?.polygon?.length >= 3 && lesson.result.polygon.every(inPlane) ? lesson.result.polygon.join('-') : null;
  return { labels, edges, segments: Object.fromEntries(segments), polygon, planeId: plane?.id || null };
}

async function settled(page) {
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
}

async function svgSnapshot(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await settled(page);
  return page.locator(selector).evaluate(svg => {
    const rect = r => ({ x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    function box(node, halo = false) {
      const local = node.getBBox(), matrix = node.getScreenCTM(), style = getComputedStyle(node);
      const padding = halo && style.stroke !== 'none' ? parseFloat(style.strokeWidth) / 2 : 0;
      const corners = [[local.x - padding, local.y - padding], [local.x + local.width + padding, local.y - padding],
        [local.x + local.width + padding, local.y + local.height + padding], [local.x - padding, local.y + local.height + padding]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
      const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
      return { x: Math.min(...xs), right: Math.max(...xs), y: Math.min(...ys), bottom: Math.max(...ys),
        width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    }
    function style(node) {
      const s = getComputedStyle(node);
      return { stroke: s.stroke, fill: s.fill, width: parseFloat(s.strokeWidth), dash: s.strokeDasharray,
        opacity: Number(s.opacity) * Number(s.strokeOpacity), display: s.display, visibility: s.visibility };
    }
    function lines(attribute) {
      return [...svg.querySelectorAll('[' + attribute + ']')].map(node => ({
        id: node.getAttribute(attribute), hidden: node.getAttribute('data-hidden'), kind: node.getAttribute('data-kind'),
        step: Number(node.getAttribute('data-step')), style: style(node), box: box(node),
        values: ['x1', 'y1', 'x2', 'y2'].map(name => Number(node.getAttribute(name)))
      }));
    }
    const labels = [...svg.querySelectorAll('[data-label]')].map(node => ({
      name: node.dataset.label, text: node.textContent, glyph: box(node), paint: box(node, true),
      fontSize: parseFloat(getComputedStyle(node).fontSize), style: style(node)
    }));
    const clip = rect(svg.getBoundingClientRect());
    for (let ancestor = svg.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const s = getComputedStyle(ancestor), r = ancestor.getBoundingClientRect();
      if (/hidden|clip|scroll|auto/u.test(s.overflowX)) { clip.x = Math.max(clip.x, r.x); clip.right = Math.min(clip.right, r.right); }
      if (/hidden|clip|scroll|auto/u.test(s.overflowY)) { clip.y = Math.max(clip.y, r.y); clip.bottom = Math.min(clip.bottom, r.bottom); }
    }
    return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, svg: rect(svg.getBoundingClientRect()), clip,
      labels, points: [...svg.querySelectorAll('[data-point]')].map(node => ({ name: node.dataset.point, box: box(node, true), style: style(node) })),
      edges: lines('data-edge'), segments: lines('data-segment'),
      activePlane: svg.querySelector('[data-active-plane]')?.getAttribute('data-active-plane') || null,
      polygon: svg.querySelector('[data-section-polygon]')?.getAttribute('data-section-polygon') || null };
  });
}

function problemsFor(actual, expected) {
  const problems = [];
  const check = (condition, message) => { if (!condition) problems.push(message); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const inside = box => box.x >= actual.clip.x - .8 && box.right <= actual.clip.right + .8 && box.y >= actual.clip.y - .8 && box.bottom <= actual.clip.bottom + .8;
  check(actual.scrollWidth <= actual.viewport + 1, 'page horizontal overflow');
  check(actual.svg.width >= 220 && actual.svg.height >= 180, 'model is too small to inspect');
  check(actual.svg.x >= -.8 && actual.svg.right <= actual.viewport + .8, 'model exceeds viewport width');
  check(same(actual.labels.map(label => label.name).sort(), expected.labels), 'required label set differs: expected ' + expected.labels.join(',') + '; actual ' + actual.labels.map(label => label.name).sort().join(','));
  check(same(actual.points.map(point => point.name).sort(), expected.labels), 'required labelled point is absent or duplicated');
  for (const label of actual.labels) {
    check(label.text === displayName(label.name), 'incorrect displayed name ' + label.name);
    check(label.glyph.width > 0 && label.glyph.height > 0 && label.fontSize >= 18, 'unreadable label ' + label.name);
    check(label.style.display !== 'none' && label.style.visibility === 'visible' && label.style.fill !== 'none', 'hidden label ' + label.name);
    check(inside(label.paint), 'clipped painted label ' + label.name);
    for (const point of actual.points) {
      const width = Math.min(label.glyph.right, point.box.right) - Math.max(label.glyph.x, point.box.x);
      const height = Math.min(label.glyph.bottom, point.box.bottom) - Math.max(label.glyph.y, point.box.y);
      check(width <= 1 || height <= 1, 'label hides point ' + label.name + '/' + point.name);
    }
  }
  for (let i = 0; i < actual.labels.length; i++) for (let j = i + 1; j < actual.labels.length; j++) {
    const a = actual.labels[i], b = actual.labels[j];
    const width = Math.min(a.glyph.right, b.glyph.right) - Math.max(a.glyph.x, b.glyph.x);
    const height = Math.min(a.glyph.bottom, b.glyph.bottom) - Math.max(a.glyph.y, b.glyph.y);
    check(width <= 1 || height <= 1, 'overlapping glyph boxes ' + a.name + '/' + b.name);
  }
  for (const point of actual.points) check(inside(point.box), 'clipped point ' + point.name);
  const lineKey = line => { const parts = line.id.split('-'); assert.equal(parts.length, 2); return key(...parts); };
  check(same(actual.edges.map(lineKey).sort(), Object.keys(expected.edges).sort()), 'body edge set differs');
  check(same(actual.segments.map(lineKey).sort(), Object.keys(expected.segments).sort()), 'constructed segment set differs');
  for (const line of [...actual.edges, ...actual.segments]) {
    check(line.values.every(Number.isFinite), 'nonfinite line ' + line.id);
    check(line.style.stroke !== 'none' && line.style.width >= 1 && line.style.opacity > .1 && line.style.visibility === 'visible', 'invisible line ' + line.id);
    check(inside(line.box), 'clipped line ' + line.id);
  }
  const dashed = line => line.style.dash !== 'none' && line.style.dash.split(/[ ,]+/u).some(n => parseFloat(n) > 0);
  for (const edge of actual.edges) {
    const hidden = expected.edges[lineKey(edge)];
    check(edge.hidden === String(hidden), 'incorrect hidden-edge geometry ' + edge.id);
    check(dashed(edge) === hidden, 'incorrect hidden-edge dash ' + edge.id);
  }
  for (const segment of actual.segments) {
    const wanted = expected.segments[lineKey(segment)];
    if (!wanted) continue;
    check(segment.kind === wanted.kind && segment.step === wanted.step, 'incorrect constructed role/focus ' + segment.id);
    check(segment.hidden === String(wanted.hidden), 'incorrect constructed visibility ' + segment.id);
    check(dashed(segment) === (wanted.kind === 'helper' || wanted.hidden), 'incorrect helper/section stroke ' + segment.id);
  }
  check(actual.activePlane === expected.planeId, 'wrong active plane');
  check(actual.polygon === expected.polygon, 'wrong final polygon');
  return problems;
}


function validateStrokeOracle() {
  // Hand-specified convex cube: y=0 is behind it when looking from +y.
  // These fixtures do not call the renderer or read its data-hidden attribute.
  const lesson = {
    model: { points: {
      A:[0,0,0], B:[1,0,0], C:[1,1,0], D:[0,1,0],
      A1:[0,0,1], B1:[1,0,1], C1:[1,1,1], D1:[0,1,1],
      M:[.2,0,.3], N:[.8,0,.7], P:[.2,1,.3], Q:[.8,1,.7],
      X:[2,0,.3], Y:[3,0,.7], I:[.2,.5,.3], J:[.8,.5,.7]
    }, faces:[['A','B','C','D'],['A1','B1','C1','D1'],['A','B','B1','A1'],
      ['B','C','C1','B1'],['C','D','D1','C1'],['D','A','A1','D1']], edges:[] },
    steps:[{ segments:[{a:'M',b:'N',kind:'section'}, {a:'P',b:'Q',kind:'section'},
      {a:'A',b:'A1',kind:'section'}, {a:'X',b:'Y',kind:'section'}, {a:'I',b:'J',kind:'section'}] }]
  };
  const config = { count:1, camera:{yaw:0,pitch:0}, flat:false };
  const expected = expectedScene(lesson, config);
  assert.equal(expected.segments['M|N'].hidden, true, 'rear finite face is hidden');
  for (const id of ['P|Q','A|A1','X|Y','I|J']) assert.equal(expected.segments[id].hidden, false,
    id + ': front, silhouette edge, plane extension, or unsupported interior is not a hidden face side');
  assert.equal(expectedScene(lesson, {...config,camera:{yaw:Math.PI,pitch:0}}).segments['M|N'].hidden, false, 'camera reversal reveals the rear side');
  assert.equal(expectedScene(lesson, {...config,flat:true}).segments['M|N'].hidden, false, 'flat projection has no hidden sides');
  const helper = structuredClone(lesson); helper.steps[0].segments[0].kind = 'helper';
  assert.equal(expectedScene(helper, config).segments['M|N'].hidden, false, 'a helper keeps its distinct role');

  // Exercise the actual browser acceptance predicate with independent expected
  // geometry. Every mutation changes only one semantic field of a valid line.
  const checkMutation = (wanted, change, message) => {
    const box = {x:10,y:10,right:30,bottom:30,width:20,height:20};
    const actual = {viewport:320,scrollWidth:320,svg:{x:0,y:0,right:300,bottom:200,width:300,height:200},
      clip:{x:0,y:0,right:300,bottom:200},labels:[],points:[],edges:[],activePlane:null,polygon:null,
      segments:[{id:'M-N',kind:wanted.kind,step:1,hidden:String(wanted.hidden),values:[10,10,30,30],box,
        style:{stroke:'#123',width:2,opacity:1,visibility:'visible',dash:wanted.kind==='helper'||wanted.hidden?'6, 5':'none'}}]};
    const oracle = {labels:[],edges:{},segments:{'M|N':wanted},planeId:null,polygon:null};
    assert.deepEqual(problemsFor(actual, oracle), [], 'unmutated stroke fixture');
    change(actual.segments[0]);
    assert(problemsFor(actual, oracle).some(problem => problem.startsWith(message)), message + ' must be rejected');
  };
  const hidden = expected.segments['M|N'], visible = expected.segments['P|Q'];
  const auxiliary = expectedScene(helper, config).segments['M|N'];
  checkMutation(hidden, line => {line.style.dash='none';}, 'incorrect helper/section stroke');
  checkMutation(visible, line => {line.style.dash='6, 5';}, 'incorrect helper/section stroke');
  checkMutation(auxiliary, line => {line.style.dash='none';}, 'incorrect helper/section stroke');
  checkMutation(hidden, line => {line.hidden='false';}, 'incorrect constructed visibility');
  checkMutation(visible, line => {line.hidden='true';}, 'incorrect constructed visibility');
  checkMutation(auxiliary, line => {line.hidden='true';}, 'incorrect constructed visibility');
  return { geometryAssertions:8, negativeControls:6 };
}

const segment = (plane, a, b, role = 'helper') => ({ plane, a, b, role });
const intersection = (plane, firstA, firstB, secondA, secondB, location) => ({ plane, firstA, firstB, secondA, secondB, ...(location ? { location } : {}) });
// Independent browser journey fixtures: selection of objects, not revealing a
// completed solution or calling the validator instead of using the controls.
const MANUAL = {
  'starter-09': [segment('DHEA', 'D', 'E'), segment('DHEA', 'H', 'A'), intersection('DHEA', 'E', 'D', 'A', 'H')],
  'starter-18': [segment('AEFB', 'M', 'N', 'section'), segment('BFGC', 'N', 'P', 'section'), segment('CGHD', 'P', 'Q', 'section'), segment('DHEA', 'Q', 'M', 'section')],
  'bridge-06': [segment('AEFB', 'M', 'N', 'section'), intersection('AEFB', 'M', 'N', 'A', 'B', 'extension'), intersection('ABCD', 'X', 'P', 'A', 'D', 'edge'), segment('ABCD', 'Y', 'P', 'section')],
  'bridge-18': [segment('SBC', 'M', 'N', 'section'), intersection('SBC', 'M', 'N', 'B', 'C', 'extension'), intersection('ABC', 'X', 'P', 'C', 'A', 'edge'), segment('SCA', 'N', 'Q', 'section'), segment('SAB', 'P', 'M', 'section')]
};

async function selectAction(page, selection) {
  await page.locator('[data-construction-plane="' + selection.plane + '"]').click();
  for (const [field, value] of Object.entries(selection)) if (field !== 'plane') await page.locator('[data-construction-input="' + field + '"]').selectOption(value);
}
const currentWork = page => page.evaluate(() => { const state = window.SECTIONS_APP.getState(); return state.tasks[state.current]; });

async function finishManual(page, lesson) {
  if (lesson.result?.polygon?.length) {
    // Reverse and rotate: equivalent cyclic orders must work through the UI.
    const names = lesson.result.polygon.slice().reverse(); names.push(names.shift());
    for (const name of names) await page.locator('[data-construction-vertex="' + name + '"]').click();
    await page.locator('[data-action="construction-boundary-submit"]').click();
  }
  if (lesson.check) await page.locator('[data-construction-check="' + lesson.check.correct + '"]').click();
  const work = await currentWork(page);
  assert.equal(work.construction.completed, true, lesson.id + ': geometric choices complete');
  assert.equal(work.revealed, 0, lesson.id + ': retained guided history is not rewritten');
  assert.match(await page.locator('.construction-finish').innerText(), /доказательство автоматически не оценивается/u);
}

async function main() {
  const strokeOracle = validateStrokeOracle();
  // This validates coverage/fixtures only. It is explicitly not browser evidence.
  const coverage = course.lessons.flatMap(lesson => STATES.map(state => {
    const work = fixture(lesson, state), expected = expectedScene(lesson, lessonConfig(lesson, work));
    assert(expected.labels.length, lesson.id + ': nonempty authored label requirement');
    return { id: lesson.id, state, count: work.viewCount };
  }));
  assert.equal(course.lessons.length, 186);
  assert.equal(course.learningPath.length, 26);
  if (process.argv.includes('--validate-fixtures')) {
    console.log(JSON.stringify({ fixtureValidation: 'PASS', browserRun: false, strokeOracle, cards: course.lessons.length, widths: WIDTHS, scenes: coverage.length * WIDTHS.length, manualJourneys: Object.keys(MANUAL).length * WIDTHS.length, researchJourneys: course.learningPath.length * WIDTHS.length }));
    return;
  }
  const { chromium } = require('playwright');
  const output = process.env.SECTIONS_HARMONIZATION_SHOTS ? path.resolve(process.env.SECTIONS_HARMONIZATION_SHOTS) : fs.mkdtempSync(path.join(os.tmpdir(), 'sections-harmonization-'));
  fs.mkdirSync(output, { recursive: true });
  const report = { status: 'RUNNING', strokeOracle, startedAt: new Date().toISOString(), widths: WIDTHS, cards: course.lessons.length, scenes: [], failures: [], pageErrors: [], browserRun: true };
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://local.test').pathname);
    const file = path.resolve(ROOT, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(ROOT + path.sep)) { response.writeHead(403); response.end(); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
    fs.readFile(file, (error, data) => {
      response.writeHead(error ? 404 : 200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(error ? 'Not found' : data);
    });
  });
  let browser;
  let phase = 'browser launch';
  async function inspect(page, lesson, config, label, selector = '.course-main .model-svg', screenshot = false) {
    const actual = await svgSnapshot(page, selector), expected = expectedScene(lesson, config);
    const problems = problemsFor(actual, expected);
    const record = { label, width: actual.viewport, lesson: lesson.id, count: config.count, labels: actual.labels.map(x => x.name), edges: actual.edges.length, segments: actual.segments.length, flat: !!config.flat, problems };
    report.scenes.push(record);
    if (problems.length) {
      report.failures.push({ ...record, expected, actual });
      if (report.failures.length <= 12) await page.screenshot({ path: path.join(output, 'failure-' + String(report.failures.length).padStart(2, '0') + '.png') });
    } else if (screenshot) await page.screenshot({ path: path.join(output, label.replace(/[^a-zA-Z0-9_-]/gu, '-') + '-' + actual.viewport + '.png') });
  }
  async function inspectLesson(page, id, label, screenshot = false) {
    await inspect(page, byId.get(id), lessonConfig(byId.get(id), await currentWork(page)), label, '.course-main .model-svg', screenshot);
  }
  async function newPage(width) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'ru-RU', reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => report.pageErrors.push({ phase, message: error.message }));
    return { context, page };
  }
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true, ...(process.env.SECTIONS_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.SECTIONS_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const { context, page } = await newPage(1280);
    try {
      await page.goto(origin + URL_PATH);
      await page.waitForFunction(() => window.SECTIONS_MASTER && window.SECTIONS_APP);
      // Fail if generated course-data was left stale. This is the actual page.
      assert.deepEqual(await page.evaluate(() => window.COURSE), course, 'canonical page serves the current authored course');
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 1000 });
        for (const state of STATES) {
          phase = 'all cards ' + width + ' ' + state;
          const tasks = Object.fromEntries(course.lessons.map(lesson => [lesson.id, fixture(lesson, state)]));
          await page.evaluate(({ key, activities, tasks, first }) => {
            localStorage.setItem(key, JSON.stringify({ version: 1, current: first, tasks }));
            localStorage.setItem(activities, JSON.stringify({ view: 'lessons' }));
            // A same-document hash navigation would let the OLD app save over
            // these fixtures. replaceState changes the deep link without an
            // event, then reload reads the intended new state atomically.
            history.replaceState(null, '', location.pathname + '#' + first);
          }, { key: course.storageKey, activities: ACTIVITY_KEY, tasks, first: course.lessons[0].id });
          await page.reload();
          await page.waitForFunction(() => window.SECTIONS_MASTER && window.SECTIONS_APP);
          for (const lesson of course.lessons) {
            await page.evaluate(id => window.SECTIONS_MASTER.openLesson(id), lesson.id);
            const restored = await currentWork(page);
            assert.equal(restored.viewCount, tasks[lesson.id].viewCount, lesson.id + ': fixture restored');
            assert.equal(restored.showResult, state === 'final', lesson.id + ': final result state restored');
            await inspectLesson(page, lesson.id, state + '-' + lesson.id, ['starter-18', 'auth-method-04', 'ii-example-7'].includes(lesson.id));
            if (lesson.id==='starter-18' && state==='initial') {
              assert.equal(await page.locator('[data-section-recall]').count(),1);
              await page.locator('[data-recall-close]').click();
              assert.equal((await currentWork(page)).revealed,0);
              await inspectLesson(page,lesson.id,'initial-full-starter-18',true);
            }
          }
          console.log('SVG matrix ' + width + ' ' + state + ': ' + course.lessons.length + ' scenes');
        }
        for (const id of ['starter-18', 'bridge-06', 'auth-method-01', 'auth-method-04', 'auth-metric-09']) {
          phase = 'rotated and flat ' + id + ' ' + width;
          await page.evaluate(id => window.SECTIONS_MASTER.openLesson(id), id);
          const svg = page.locator('.course-main .model-svg');
          const before = (await currentWork(page)).camera;
          await svg.focus(); await svg.press('ArrowRight'); await svg.press('ArrowUp');
          const rotated = (await currentWork(page)).camera;
          assert.notDeepEqual(rotated, before, 'keyboard changes camera');
          await inspectLesson(page, id, 'rotated-' + id, true);
          await page.locator('.course-main .plane-toggle').click();
          assert.equal((await currentWork(page)).planeView, true);
          await inspectLesson(page, id, 'flat-' + id, true);
          await page.locator('.course-main .plane-toggle').click();
          await svg.focus(); await svg.press('Home');
          assert.deepEqual((await currentWork(page)).camera, byId.get(id).model.initialCamera || { yaw: -.65, pitch: .46 });
        }
      }
    } finally { await context.close(); }

    for (const width of WIDTHS) {
      const { context, page } = await newPage(width);
      try {
        phase = 'research ' + width;
        await page.goto(origin + URL_PATH);
        await page.locator('[data-action="path-start"]').click();
        assert.equal(await page.locator('[data-research-stage]').getAttribute('data-research-stage'), course.learningPath[0].id, 'fresh route starts with research');
        for (const stage of course.learningPath) {
          phase = 'research ' + stage.id + ' ' + width;
          await page.evaluate(id => window.SECTIONS_MASTER.openResearch(id), stage.id);
          assert.equal(await page.locator('#research-prediction').inputValue(), '');
          assert.equal(await page.locator('[data-action="research-observe"]:enabled').count(), 0, 'empty prediction cannot reveal an experiment');
          const spec = stage.research;
          const prediction = stage.id === course.learningPath[0].id ? 'unknown' : String((spec.answer + 1) % spec.predictions.length);
          await page.locator('#research-prediction').selectOption(prediction);
          for (const action of spec.actions) {
            await page.locator('[data-action="research-observe"][data-experiment="' + action.id + '"]').click();
            assert.equal(await page.locator('#research-prediction').isDisabled(), true);
            assert.equal(await page.locator('#research-prediction').inputValue(), prediction, 'initial wrong/unknown prediction stays intact');
            const research = await page.evaluate(id => window.SECTIONS_MASTER.getState().research.states[id], stage.id);
            const model = spec.source === 'lesson' ? byId.get(spec.lessonId) : await page.evaluate(({ family, action }) => window.SECTION_ACTIVITIES.makeLab(family, action.level, action.height || 1), { family: spec.family, action });
            const count = spec.source === 'lab' ? model.steps.length : action.count;
            await inspect(page, model, { count, planeId: action.planeId || null, flat: !!action.flat, camera: research.camera, showResult: count === model.steps.length }, 'research-' + stage.id + '-' + action.id, '.research-model .model-svg', stage.id === 'begin-01' || stage.id === 'main-13');
          }
          assert.equal(await page.locator('[data-action="research-finish"]').isDisabled(), true, 'observation alone is not a recorded conclusion');
          const note = 'Я сравнил положения модели. Для общего вывода нужно обоснование.';
          await page.locator('#research-note').fill(note);
          if (stage.id === 'main-13') {
            await page.reload(); await page.waitForFunction(() => window.SECTIONS_MASTER);
            assert.equal(await page.locator('#research-note').inputValue(), note);
            assert.equal(await page.locator('#research-prediction').inputValue(), prediction);
          }
          await page.locator('[data-action="research-finish"]').click();
          const saved = await page.evaluate(id => window.SECTIONS_MASTER.getState().research.states[id], stage.id);
          assert.equal(saved.completed, true); assert.equal(saved.prediction, prediction);
          assert.deepEqual(saved.observed.slice().sort(), spec.actions.map(action => action.id).sort());
          assert.match(await page.locator('.research-conclusion').innerText(), /Граница применимости/u);
          await page.locator('[data-action="research-to-lesson"]').click();
          assert.equal(await page.evaluate(() => window.SECTIONS_APP.getState().current), stage.lessons[0]);
        }
        console.log('Research journeys ' + width + ': ' + course.learningPath.length + ' completed');
      } finally { await context.close(); }

      const manual = await newPage(width);
      try {
        const page = manual.page;
        await page.goto(origin + URL_PATH + '#starter-09');
        for (const [id, selections] of Object.entries(MANUAL)) {
          phase = 'manual ' + id + ' ' + width;
          const lesson = byId.get(id);
          await page.evaluate(id => window.SECTIONS_MASTER.openLesson(id), id);
          await page.locator('[data-action="start-construction"]').click();
          assert.equal(await page.locator('[data-construction-plane][aria-pressed="true"]').count(), 0);
          assert.deepEqual(await page.locator('[data-construction-input]').evaluateAll(nodes => nodes.map(node => node.value)), Array(await page.locator('[data-construction-input]').count()).fill(''));
          await inspectLesson(page, id, 'manual-initial-' + id, true);
          for (const [index, selection] of selections.entries()) {
            if (await page.locator('[data-action="construction-next"]').count()) await page.locator('[data-action="construction-next"]').click();
            await selectAction(page, selection);
            if (id === 'bridge-06' && index === 1) {
              await page.locator('[data-construction-input="location"]').selectOption('edge');
              await page.locator('[data-action="construction-submit"]').click();
              const rejected = (await currentWork(page)).construction;
              assert.equal(rejected.actions.length, index); assert.equal(rejected.feedback.code, 'finite-edge');
              await page.locator('[data-construction-input="location"]').selectOption('extension');
            }
            await page.locator('[data-action="construction-submit"]').click();
            assert.equal((await currentWork(page)).construction.actions.length, index + 1, id + ': accepted chosen objects');
            await inspectLesson(page, id, 'manual-' + id + '-action-' + (index + 1));
          }
          await finishManual(page, lesson);
          await inspectLesson(page, id, 'manual-final-' + id, true);
          if (id === 'starter-09') {
            const earned = (await currentWork(page)).construction.evidenceAt;
            assert(Number.isFinite(earned));
            await page.locator('[data-action="construction-undo"]').click();
            assert.equal((await currentWork(page)).construction.actions.length, 2);
            await inspectLesson(page, id, 'manual-undo-' + id, true);
            await page.locator('.construction-action details > summary').click();
            await page.waitForFunction(() => { const s = window.SECTIONS_APP.getState(); return s.tasks[s.current].construction.helpUsed; });
            await selectAction(page, { plane: 'DHEA', firstA: 'E', firstB: 'D' });
            await page.locator('#proof-draft').fill('Обе диагонали лежат в плоскости DHEA.');
            await page.reload(); await page.waitForFunction(() => window.SECTIONS_APP);
            const restored = (await currentWork(page)).construction;
            assert.equal(restored.actions.length, 2); assert.equal(restored.evidenceAt, earned); assert.equal(restored.helpUsed, true);
            assert.equal(await page.locator('[data-construction-input="firstA"]').inputValue(), 'E');
            assert.equal(await page.locator('[data-construction-input="secondA"]').inputValue(), '');
            assert.equal(await page.locator('#proof-draft').inputValue(), 'Обе диагонали лежат в плоскости DHEA.');
            await selectAction(page, selections[2]); await page.locator('[data-action="construction-submit"]').click();
            await finishManual(page, lesson);
            assert.equal((await currentWork(page)).construction.evidenceAt, earned, 'undo/retry after help cannot invent new unaided evidence');
          }
        }
        console.log('Manual journeys ' + width + ': ' + Object.keys(MANUAL).length + ' completed');
      } finally { await manual.context.close(); }
    }
    assert.deepEqual(report.pageErrors, [], 'no browser runtime errors');
    assert.equal(report.failures.length, 0, 'SVG failures; see report.json and failure screenshots');
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL'; report.error = { phase, message: error.message, stack: error.stack };
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser?.close(); server.closeAllConnections?.(); await new Promise(resolve => server.close(resolve));
    console.log(JSON.stringify({ status: report.status, scenes: report.scenes.length, failedScenes: report.failures.length, pageErrors: report.pageErrors.length, evidence: output }));
  }
}

module.exports = { expectedScene, problemsFor, fixture, lessonConfig, validateStrokeOracle };
if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 1; });
