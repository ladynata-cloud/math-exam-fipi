import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='f1eb11261a32dd30afb614bc563975d1d9865e7d';
const git=(...args)=>execFileSync('git',['-c','safe.directory='+root,'-c','core.autocrlf=false',...args],{cwd:root,maxBuffer:64*1024*1024});
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const scripts=html=>[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const plain=value=>JSON.parse(JSON.stringify(value));
const digest=value=>createHash('sha256').update(value).digest('hex');
const trainers=['trainers/oge-task11-graphs-trainer.html','trainers/oge-task12-formulas-trainer.html',
  'trainers/oge-task13-inequalities.html','trainers/oge13-inequalities-series.html','trainers/oge-task14-progressions.html'];
const SCOPE=[...trainers,'tools/oge-2027-analogue-distribute-11-14.test.mjs',
  'tools/oge-2027-analogue-distribute-11-14.browser.mjs','docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_11_14.md'].sort();
let scheduled=0,passed=0,failed=0;
function gate(name,fn){scheduled++;test(name,()=>{try{fn();passed++;}catch(error){failed++;throw error;}});}
process.once('beforeExit',()=>{if(scheduled>0&&passed===scheduled&&!failed)console.log('OGE_2027_ANALOGUE_11_14_TEST_OK');});
const sourcePath='trainers/oge-2027-analogue-1.html';
const source=read(sourcePath);
const sourceContext=vm.createContext({});
vm.runInContext(source.match(/<script id="model">([\s\S]*?)<\/script>/)[1],sourceContext,{timeout:3000});
const sourceModel=sourceContext.ExamModel;
gate('immutable full variant and independent source answers 11–14',()=>{
  const original=git('show',BASE+':'+sourcePath);
  assert.equal(digest(fs.readFileSync(path.join(root,sourcePath))),digest(original));
  assert.equal(digest(original),'0dc6d63c073bd27d12a6bae2debc562765b0e12c4f16df77c7eec0e9aac3ed62');
  const tasks=Array.from(sourceModel.TASKS).filter(t=>t.number>=11&&t.number<=14);
  assert.deepEqual(tasks.map(t=>t.id),[11,12,13,14].map(n=>'oge2027-analogue-1-task-'+n));
  assert.deepEqual(tasks.map(t=>t.answerType),['sequence','number','choice','number']);
  assert.deepEqual(tasks.map(t=>t.answer),['231',110**2/242,3,320*0.5**(18/6)]);
});
function exactScope(paths){assert.deepEqual([...paths].sort(),SCOPE);}
gate('unconditional exact eight-file scope on this task base',()=>{
  git('merge-base','--is-ancestor',BASE,'HEAD');
  const paths=new Set([...git('diff','--name-only','--no-renames','-z',BASE,'--').toString().split('\0'),
    ...git('ls-files','--others','--exclude-standard','-z').toString().split('\0')].filter(Boolean));
  exactScope(paths);
});
gate('scope rejects each missing path, extra, substitution, duplicate and historical batches',()=>{
  exactScope(SCOPE);
  for(let i=0;i<SCOPE.length;i++)assert.throws(()=>exactScope(SCOPE.filter((_,j)=>i!==j)));
  assert.throws(()=>exactScope([...SCOPE,'ege-profil/index.html']));
  assert.throws(()=>exactScope([...SCOPE.slice(1),'sitemap.xml']));
  assert.throws(()=>exactScope([...SCOPE,SCOPE[0]]));
  assert.throws(()=>exactScope(['tools/oge-2027-analogue-distribute-6-10.test.mjs']));
});
gate('UTF-8, inline syntax, no new remote dependency or unsafe execution, sanitized additions',()=>{
  for(const file of SCOPE){
    const bytes=fs.readFileSync(path.join(root,file));new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if(trainers.includes(file))assert.equal(bytes.subarray(0,3).toString('hex'),git('show',BASE+':'+file).subarray(0,3).toString('hex'),file+' preserves baseline encoding prefix');
    else assert.notEqual(bytes.subarray(0,3).toString('hex'),'efbbbf',file+' new BOM');
    assert.ok(!bytes.includes(Buffer.from([0xef,0xbf,0xbd])),file+' replacement character');
  }
  for(const file of trainers){
    const html=read(file);new vm.Script(scripts(html).join('\n'),{filename:file});
    const before=git('show',BASE+':'+file).toString();
    const remotes=text=>[...text.matchAll(/(?:src|href)\s*=\s*["'](https?:[^"']+)/g)].map(m=>m[1]).sort();
    assert.deepEqual(remotes(html),remotes(before),file+' external assets');
  }
  const diff=git('diff','--unified=0',BASE,'--',...trainers).toString();
  const additions=diff.split('\n').filter(line=>line.startsWith('+')&&!line.startsWith('+++')).join('\n');
  assert.ok(!/\b(?:eval|fetch|XMLHttpRequest|WebSocket)\s*\(/.test(additions));
  assert.ok(!/\b(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(/.test(additions));
  for(const file of SCOPE){
    const text=read(file);
    assert.ok(!/[A-Za-z]:[\\/]Users[\\/]/i.test(text),file+' absolute machine path');
    assert.ok(!/(?:api[_-]?key|access[_-]?token|secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i.test(text),file+' secret assignment');
  }
  git('diff','--check',BASE,'--');
});
gate('historical gate sources remain byte-identical to current main',()=>{
  for(const file of ['tools/oge-2027-analogue-1.test.mjs','tools/trainer-inventory/test/inventory.test.mjs',
    'tools/oge-2027-analogue-distribute-1-5.test.mjs']){
    assert.equal(digest(fs.readFileSync(path.join(root,file))),digest(git('show',BASE+':'+file)),file);
  }
});

const author11File = 'trainers/oge-task11-graphs-trainer.html';
const author12File = 'trainers/oge-task12-formulas-trainer.html';
const authoredBaseline = relative => git('show', BASE + ':' + relative).toString('utf8');
const authoredSerialize = value => JSON.stringify(value, (_key, item) => typeof item === 'function' ? item.toString() : item);

function loadAuthor11() {
  const html = read(author11File);
  const original = scripts(html)[0];
  const svgStart = original.indexOf('function svgGraph(');
  const svgEnd = original.indexOf('// ---------- статистика в localStorage ----------', svgStart);
  assert.ok(svgStart >= 0 && svgEnd > svgStart, 'bounded original SVG renderer');
  const nodes = new Map();
  function makeNode(id) {
    const events = new Map();
    const result = {
      value: '', textContent: '', innerHTML: '', dataset: {}, style: {}, hidden: false,
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, append() {}, focus() {},
      closest() { return node('legacy-card'); },
      addEventListener(type, callback) {
        if (!events.has(type)) events.set(type, []);
        events.get(type).push(callback);
      },
      emit(type) { for (const callback of events.get(type) || []) callback({ preventDefault() {} }); }
    };
    Object.defineProperty(result, 'id', {
      get() { return id; },
      set(value) { id = value; nodes.set(value, result); }
    });
    if (id) nodes.set(id, result);
    Object.defineProperty(result, 'innerHTML', {
      get() { return result.markup || ''; },
      set(value) {
        result.markup = value;
        for (const match of value.matchAll(/\bid="([^"]+)"/g)) makeNode(match[1]);
      }
    });
    return result;
  }
  function node(id) { return nodes.get(id) || makeNode(id); }
  const context = vm.createContext({
    URLSearchParams, $: node, location: { search: '' },
    document: {
      createElement() { return makeNode(''); },
      querySelectorAll() { return []; },
      querySelector(selector) { return node(selector); }
    }
  });
  const extension = scripts(html).at(-1);
  assert.ok(extension.includes('// AUTHOR11_PURE_END'));
  vm.runInContext(original.slice(svgStart, svgEnd) + '\n' + extension, context);
  return { context, node, run: expression => vm.runInContext(expression, context) };
}

gate('task11 preserves all three original scripts, generators and initialization bytes', () => {
  const before = scripts(authoredBaseline(author11File));
  const after = scripts(read(author11File));
  assert.equal(before.length, 3);
  assert.equal(after.length, before.length + 1);
  assert.deepEqual(after.slice(0, before.length), before);
  assert.doesNotMatch(after.at(-1), /\b(?:localStorage|sessionStorage|recordSkill|saveStats)\b/);
});

gate('task11 independently maps 231 and checks actual SVG samples, bounds and hyperbola separation', () => {
  const runtime = loadAuthor11(), task = runtime.run('AUTHOR_TASKS[0]');
  assert.equal(runtime.run('AUTHOR_TASKS.length'), 1);
  assert.equal(task.id, 'oge2027-analogue-1-task-11');
  assert.equal(task.sourceTask, 11);
  assert.equal(task.answerType, 'sequence');
  assert.deepEqual(plain(task.formulas), ['y = −x + 2', 'y = x² + 1', 'y = −1/x']);
  const formulas = [x => -x + 2, x => x * x + 1, x => -1 / x];
  const derived = task.graphs.map(graph => formulas.findIndex(formula =>
    [-2, -1, 1, 2].every(x => runtime.context.authorGraphValue(graph, x) === formula(x))) + 1).join('');
  assert.equal(derived, '231'); assert.equal(task.answer, derived);
  assert.deepEqual(plain(task.graphs.map(graph => graph.label)), ['А', 'Б', 'В']);
  for (const graph of task.graphs) {
    const svg = runtime.context.authorGraphSvg(graph);
    assert.match(svg, /viewBox="0 0 300 300"/);
    assert.ok(svg.includes('aria-label="График ' + graph.label + '"'));
    const lines = [...svg.matchAll(/<polyline[^>]*points="([^"]+)"/g)]
      .map(match => match[1].split(' ').map(point => point.split(',').map(Number)));
    assert.equal(lines.length, graph.family === 'hyperbola' ? 2 : 1, graph.label);
    for (const line of lines) {
      assert.ok(line.length > 20);
      if (graph.family === 'hyperbola') {
        assert.ok(line.every(([px]) => px < 150) || line.every(([px]) => px > 150),
          'no segment crosses the vertical asymptote');
      }
      for (const [px, py] of line) {
        assert.ok(px >= 0 && px <= 300 && py >= 0 && py <= 300, 'SVG point inside viewBox');
        const x = px / 31.25 - 4.8, y = 4.8 - py / 31.25;
        assert.ok(Math.abs(y - runtime.context.authorGraphValue(graph, x)) < 0.04,
          'plotted point satisfies ' + graph.family + ' within SVG rounding');
      }
    }
  }
});

gate('task11 keeps the sequence parser and single-ID deep link fail closed', () => {
  const runtime = loadAuthor11(), id = 'oge2027-analogue-1-task-11';
  for (const answer of ['231', ' 231 ', '123']) assert.equal(runtime.context.parseAuthorAnswer(answer), answer.trim());
  for (const answer of ['2 3 1', '2,31', '2.31', '0231', '2310', '23', '451', '', 'Infinity']) {
    assert.equal(runtime.context.parseAuthorAnswer(answer), null, answer);
  }
  for (const query of ['?task=' + id, '?foo=bar&task=' + id, '?%74ask=' + id]) {
    assert.equal(runtime.context.requestedAuthorTask(query).id, id, query);
  }
  for (const query of ['', '?task=', '?task=unknown', '?task=' + id + '&task=' + id,
    '?task=' + id + '&%74ask=' + id, '?task=%', '?task=%GG', '?task=%C0%AF',
    '?task=' + id + '&junk=%', '?task=' + id + '-suffix', '?task=oge2027-analogue-1-task-12']) {
    assert.equal(runtime.context.requestedAuthorTask(query), null, query);
  }
});

gate('task11 preserves historical author credit and sticky hint/reveal across checks, repeats and filters', () => {
  for (const [help, expectedCredit] of [[null, true], ['hint', false], ['reveal', false]]) {
    const runtime = loadAuthor11();
    runtime.run('selectAuthorCohort(true)');
    assert.deepEqual(plain(runtime.run('AUTHOR_PROGRESS')), {
      assisted: false, revealed: false, solved: false, credited: false, wrongAttempts: 0
    });
    if (help) runtime.node('author11-' + help).emit('click');
    runtime.node('author11-repeat').emit('click');
    runtime.run('selectAuthorCohort(false); selectAuthorCohort(true)');
    runtime.node('author11-answer').value = '231';
    runtime.run('checkAuthorAnswer()');
    assert.equal(runtime.run('AUTHOR_PROGRESS.credited'), expectedCredit);
    assert.equal(runtime.run('AUTHOR_PROGRESS.solved'), true);
    if (help) assert.equal(runtime.run('AUTHOR_PROGRESS.assisted'), true);
    if (help === 'reveal') assert.equal(runtime.run('AUTHOR_PROGRESS.revealed'), true);
    const earned = runtime.run('JSON.stringify(AUTHOR_PROGRESS)');
    runtime.run('checkAuthorAnswer()');
    runtime.node('author11-repeat').emit('click');
    runtime.run('selectAuthorCohort(false); selectAuthorCohort(true)');
    runtime.node('author11-answer').value = '231';
    runtime.run('checkAuthorAnswer()');
    assert.equal(runtime.run('JSON.stringify(AUTHOR_PROGRESS)'), earned);
    if (!help) {
      runtime.node('author11-hint').emit('click');
      runtime.node('author11-reveal').emit('click');
      runtime.node('author11-repeat').emit('click');
      runtime.node('author11-answer').value = '231';
      runtime.run('checkAuthorAnswer()');
      assert.equal(runtime.run('AUTHOR_PROGRESS.credited'), true, 'earlier independent credit is historical');
      assert.equal(runtime.run('AUTHOR_PROGRESS.assisted && AUTHOR_PROGRESS.revealed'), true);
    }
  }
});

function loadAuthor12(html) {
  const nodes = new Map();
  const saved = { solved: 7, correct: 5, byType: { 2: { a: 7, c: 5 } }, bestDiag: 4, lastDate: '2026-09-01' };
  const storage = new Map([['mx-oge12-v1', JSON.stringify(saved)], ['foreign-test-key', 'sentinel']]);
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      value: '', innerHTML: '', textContent: '', style: {}, firstChild: null,
      classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {},
      focus() {}, replaceChildren() {}
    });
    return nodes.get(selector);
  }
  let seed = 1234;
  const math = Object.create(Math);
  math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const context = vm.createContext({
    Math: math, URLSearchParams,
    document: {
      querySelector: node, querySelectorAll() { return []; },
      createDocumentFragment() { return { appendChild() {} }; },
      body: { classList: { add() {}, remove() {} } }
    },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    window: { location: { search: '' } }
  });
  const bodies = scripts(html);
  assert.equal(bodies.length, 1);
  new vm.Script(bodies[0]);
  const boundary = bodies[0].indexOf('/* ===================== старт ===================== */');
  assert.ok(boundary > 0);
  vm.runInContext(bodies[0].slice(0, boundary), context);
  return { context, node, storage, run: expression => vm.runInContext(expression, context) };
}

function removeAuthor12Insertions(html) {
  const additions = [
    /\n\/\* Author analogue task 12: local cohort and accessible controls\. \*\/[\s\S]*?\/\* End author analogue task 12 styles\. \*\/\n/,
    /<!-- Author analogue task 12 cohort\. -->[\s\S]*?<!-- End author analogue task 12 cohort\. -->\n/,
    /\/\* Author analogue task 12 canonical data; the forty generators remain intact\. \*\/[\s\S]*?\/\* End author analogue task 12 canonical data\. \*\/\n\n/,
    /\/\* Author analogue task 12 session controller; no legacy stats or storage writes\. \*\/[\s\S]*?\/\* End author analogue task 12 session controller\. \*\/\n\n/,
    /\/\/ Author analogue task 12 deep-link activation\.\nif\(requestedAuthorTask\(window\.location\.search\)\)selectAuthorCohort\(true\);\n/
  ];
  for (const addition of additions) {
    assert.equal([...html.matchAll(new RegExp(addition.source, 'g'))].length, 1, 'one bounded author addition');
    html = html.replace(addition, '');
  }
  return html;
}

gate('task12 recovers the entire original HTML and preserves all forty generator functions, order and defaults', () => {
  const before = authoredBaseline(author12File), current = read(author12File);
  assert.equal(removeAuthor12Insertions(current), before, 'exact original HTML outside authored insertions');
  const old = loadAuthor12(before), now = loadAuthor12(current);
  assert.equal(now.run('GENS.length'), 40);
  assert.equal(now.run('AUTHOR_TASKS.length'), 1);
  assert.equal(authoredSerialize(now.run('GENS')), authoredSerialize(old.run('GENS')));
  for (const name of ['MODES', 'TYPES', 'DIAG_GROUP', 'LS', 'mode', 'typeFilter']) {
    assert.equal(authoredSerialize(now.run(name)), authoredSerialize(old.run(name)), name);
  }
  assert.deepEqual(plain(now.run('({mode,typeFilter,gens:GENS.length})')), { mode: 'quick', typeFilter: 0, gens: 40 });
  for (const [name, value] of Object.entries(old.context)) {
    if (typeof value === 'function') assert.equal(now.context[name].toString(), value.toString(), name);
  }
  assert.equal(authoredSerialize(now.run('GENS.map(generator=>generator.make())')),
    authoredSerialize(old.run('GENS.map(generator=>generator.make())')), 'all forty deterministic generated records');
});

gate('task12 independently derives 50 and reuses the existing formula task schema and five-step model', () => {
  const runtime = loadAuthor12(read(author12File)), task = runtime.run('AUTHOR_TASKS[0]');
  assert.equal(task.id, 'oge2027-analogue-1-task-12');
  assert.equal(task.sourceTaskId, task.id);
  assert.equal(task.sourceKind, 'author-analogue');
  assert.equal(task.variantId, 'oge-2027-analogue-1');
  assert.equal(task.answerType, 'number');
  assert.equal(task.target, 'R');
  assert.equal(110 * 110, 12100);
  assert.equal(242 * 50, 12100);
  assert.equal(task.answer, 110 ** 2 / 242);
  assert.deepEqual(plain(task.subst.vals), [110, 242]);
  assert.equal(task.subst.ev(task.subst.vals), 50);
  assert.match(task.story, /P = U² \/ R/);
  assert.match(task.story, /U = 110 В/);
  assert.match(task.story, /P = 242 Вт/);
  assert.equal(task.rearr.options.filter(option => option.ok).length, 1);
  assert.ok(task.rearr.options.find(option => option.ok).html.includes('U²'));
  const steps = runtime.run('buildSteps(AUTHOR_TASKS[0])');
  assert.deepEqual(plain(steps.map(step => step.kind)), ['mc', 'mc', 'mc', 'num', 'num']);
  assert.equal(steps[0].correct, 2);
  assert.equal(steps[1].correct, 1);
  assert.equal(steps[2].options.filter(option => option.ok).length, 1);
  assert.equal(steps[3].answer, 12100);
  assert.equal(steps[4].answer, 50);
  assert.ok(task.hints.every(hint => !/\b50\b/.test(hint)), 'local hint does not reveal the final answer');
});

gate('task12 accepts numeric exam forms and rejects malformed, duplicate and foreign deep links', () => {
  const runtime = loadAuthor12(read(author12File)), id = 'oge2027-analogue-1-task-12';
  for (const answer of ['50', '50,0', '50.00', '+50', ' 50 ']) assert.equal(runtime.context.parseAuthorAnswer(answer), 50);
  for (const answer of ['', ' ', '5 0', '50 Ом', '100/2', '5e1', 'Infinity', 'NaN', '0x32', '50,0.0']) {
    assert.equal(runtime.context.parseAuthorAnswer(answer), null, answer);
  }
  for (const query of ['?task=' + id, '?foo=bar&task=' + id, '?%74ask=' + id]) {
    assert.equal(runtime.context.requestedAuthorTask(query), true, query);
  }
  for (const query of ['', '?task=', '?task=unknown', '?task=' + id + '&task=' + id,
    '?task=' + id + '&%74ask=' + id, '?task=%', '?task=%GG', '?task=%C0%AF',
    '?task=' + id + '&junk=%', '?task=' + id + '-suffix', '?task=oge2027-analogue-1-task-11']) {
    assert.equal(runtime.context.requestedAuthorTask(query), false, query);
  }
});

gate('task12 keeps hint/reveal provenance sticky and legacy attempts, stats and storage isolated', () => {
  for (const [help, credit] of [[null, 'independent'], ['#hintBtn', 'assisted'], ['#solBtn', 'shown']]) {
    const runtime = loadAuthor12(read(author12File));
    runtime.run('cur=GENS[0].make(); A={checkedOnce:true,revealed:false,hintIdx:0,done:false}; diag={idx:2};');
    const legacy = runtime.run('JSON.stringify({stats,mode,typeFilter,cur,A,diag})');
    const storage = authoredSerialize([...runtime.storage]);
    assert.deepEqual(plain(runtime.run('AUTHOR_PROGRESS')), {
      hinted: false, revealed: false, credit: 'unanswered', wrongAttempts: 0
    });
    runtime.run('selectAuthorCohort(true)');
    if (help) runtime.node(help).onclick();
    runtime.node('#nextBtn').onclick();
    runtime.run('selectAuthorCohort(false); selectAuthorCohort(true)');
    runtime.node('#ansIn').value = '50';
    runtime.run('checkAuthorAnswer()');
    assert.equal(runtime.run('AUTHOR_PROGRESS.credit'), credit);
    if (help === '#hintBtn') assert.equal(runtime.run('AUTHOR_PROGRESS.hinted'), true);
    if (help === '#solBtn') assert.equal(runtime.run('AUTHOR_PROGRESS.revealed'), true);
    const earned = runtime.run('JSON.stringify(AUTHOR_PROGRESS)');
    runtime.run('checkAuthorAnswer()');
    runtime.node('#nextBtn').onclick();
    runtime.run('selectAuthorCohort(false); selectAuthorCohort(true)');
    runtime.node('#ansIn').value = '50';
    runtime.run('checkAuthorAnswer()');
    assert.equal(runtime.run('JSON.stringify(AUTHOR_PROGRESS)'), earned);
    if (!help) {
      runtime.node('#hintBtn').onclick(); runtime.node('#solBtn').onclick();
      runtime.node('#nextBtn').onclick();
      runtime.node('#ansIn').value = '50';
      runtime.run('checkAuthorAnswer()');
      assert.equal(runtime.run('AUTHOR_PROGRESS.credit'), 'independent');
      assert.equal(runtime.run('AUTHOR_PROGRESS.hinted && AUTHOR_PROGRESS.revealed'), true);
    }
    assert.equal(runtime.run('JSON.stringify({stats,mode,typeFilter,cur,A,diag})'), legacy);
    assert.equal(authoredSerialize([...runtime.storage]), storage);
  }
});

const canonical13 = 'trainers/oge13-inequalities-series.html';
const alias13 = 'trainers/oge-task13-inequalities.html';
const html13 = read(canonical13);
const baseHtml13 = git('show', BASE + ':' + canonical13).toString('utf8');
function loadModel13(html) {
  const bodies = scripts(html), context = vm.createContext({ URLSearchParams });
  const boundary = bodies[0].indexOf("let mod='quad'");
  assert.ok(boundary > 0, 'task13 legacy initialization boundary');
  vm.runInContext(bodies[0].slice(0, boundary), context);
  if (bodies[1]) {
    const marker = bodies[1].indexOf('// Author13 browser wiring.');
    assert.ok(marker > 0, 'task13 explicit pure-model boundary');
    vm.runInContext(bodies[1].slice(0, marker), context);
  }
  return { bodies, context, run: code => vm.runInContext(code, context) };
}
const current13 = loadModel13(html13), base13 = loadModel13(baseHtml13);
const bank13 = plain(current13.run('DATA')), oldBank13 = plain(base13.run('DATA'));
const api13 = current13.run('({ task: AUTHOR13_TASK, parse: author13ParseAnswer, initial: author13InitialResult, reduce: author13ApplyEvent, deep: author13IsDeepLink })');
gate('task13 preserves the entire legacy script, all 26 records, order, implicit group indices and defaults', () => {
  assert.equal(current13.bodies[0], base13.bodies[0]);
  assert.deepEqual(Object.fromEntries(Object.entries(oldBank13).map(([key, value]) => [key, value.length])), { linear: 6, quad: 8, graph: 4, special: 4, systems: 4 });
  for (const [key, records] of Object.entries(oldBank13)) assert.deepEqual(bank13[key], records, key);
  assert.deepEqual(Object.keys(bank13), [...Object.keys(oldBank13), 'author']);
  assert.equal(Object.values(bank13).flat().length, 27);
  assert.equal(bank13.author.length, 1);
  assert.match(current13.bodies[0], /let mod='quad', idx=\{linear:0,quad:0,graph:0,special:0,systems:0\}/);
  assert.match(current13.bodies[0], /const KEY='mathExamCourseProgress\.v1', TOPIC='oge13InequalitiesSeries'/);
  assert.deepEqual(plain(current13.run('MODS.slice(0,-1)')), plain(base13.run('MODS')));
  assert.doesNotMatch(current13.bodies[1], /localStorage|sessionStorage|saveStats\(|rec\(/);
});
gate('task13 maps exactly one author choice-number task to immutable source task13', () => {
  const sourceHtml = read('trainers/oge-2027-analogue-1.html');
  const sourceModel = sourceHtml.match(/<script\b[^>]*\bid=["']model["'][^>]*>([\s\S]*?)<\/script>/i);
  assert.ok(sourceModel);
  const sourceContext = vm.createContext({}); vm.runInContext(sourceModel[1], sourceContext);
  const source = plain(sourceContext.ExamModel.TASKS.find(task => task.number === 13));
  const task = plain(api13.task);
  assert.equal(task.id, 'oge2027-analogue-1-task-13');
  assert.equal(task.sourceId, source.id); assert.equal(task.sourceTask, source.number);
  assert.equal(task.sourceVariantId, source.variantId); assert.equal(task.answer, String(source.answer));
  assert.equal(source.answerType, 'choice'); assert.equal(task.answerType, 'choice-number');
  assert.deepEqual(task.e, ['2x − 6 ≤ 0', 'x + 3 > 0']);
  assert.match(source.prompt, /2x − 6 ≤ 0/); assert.match(source.prompt, /x \+ 3 &gt; 0/);
  assert.deepEqual(task.options, source.diagram.options.map(option => option.label));
  assert.deepEqual([task.interval.left, task.interval.right], source.diagram.bounds);
  assert.equal(task.interval.leftClosed, source.diagram.options[+source.answer - 1].leftClosed);
  assert.equal(task.interval.rightClosed, source.diagram.options[+source.answer - 1].rightClosed);
  assert.equal(Object.values(bank13).flat().filter(task => task.id === source.id).length, 1);
  assert.ok(html13.includes('Авторский аналог ОГЭ-2027 · Вариант 1'));
  assert.ok(html13.includes('Авторский материал MathExam. Не является официальным материалом ФИПИ.'));
});
gate('task13 independent system calculation proves open-left closed-right option3 and no equivalent legacy system or quadratic', () => {
  const system = x => 2 * x - 6 <= 0 && x + 3 > 0;
  const bounds = plain(api13.task.interval);
  const interval = x => (bounds.leftClosed ? x >= bounds.left : x > bounds.left) && (bounds.rightClosed ? x <= bounds.right : x < bounds.right);
  const probes = [-100, -3.001, -3, -2.999, 0, 2.999, 3, 3.001, 100];
  assert.deepEqual(probes.map(system), [false, false, false, true, true, true, true, false, false]);
  assert.deepEqual(probes.map(interval), probes.map(system));
  assert.deepEqual(bounds, { left: -3, right: 3, leftClosed: false, rightClosed: true });
  const candidates = [x => x >= -3 && x <= 3, x => x < -3 || x > 3, x => x > -3 && x <= 3, x => x >= -3 && x < 3];
  assert.deepEqual(candidates.flatMap((candidate, index) => probes.every(x => candidate(x) === system(x)) ? [index + 1] : []), [3]);
  assert.equal(api13.task.answer, '3');
  for (const task of oldBank13.systems) {
    const legacy = x => task.rays.every(ray => ray.dir === 'left' ? ray.closed ? x <= ray.v : x < ray.v : ray.closed ? x >= ray.v : x > ray.v);
    const samples = [...probes, ...task.rays.flatMap(ray => [ray.v - 0.001, ray.v, ray.v + 0.001])];
    assert.ok(samples.some(x => legacy(x) !== system(x)), 'existing system is not equivalent: ' + task.e.join('; '));
  }
  for (const task of oldBank13.quad) {
    const legacy = x => { const value = task.a * (x - task.r1) * (x - task.r2); return task.sign === 'gt' ? value > 0 : task.sign === 'gte' ? value >= 0 : task.sign === 'lt' ? value < 0 : value <= 0; };
    const samples = [...probes, task.r1, task.r2];
    assert.ok(samples.some(x => legacy(x) !== system(x)), 'existing quadratic is not equivalent: ' + task.e);
  }
});
gate('task13 accepts option numbers and rejects interval text, fractions, malformed numbers and multiple digits', () => {
  for (const value of ['1','2','3','4']) assert.equal(api13.parse(value), value);
  assert.equal(api13.parse(' 3 '), '3');
  for (const value of ['', '0', '5', '03', '+3', '3.0', '3,0', '3e0', '3/1', '3 1', '31', '(−3; 3]', '(-3;3]', 'NaN', 'Infinity', null, 3, {}, []]) assert.equal(api13.parse(value), null, String(value));
  assert.equal(api13.reduce(api13.initial(), 'check', '(−3; 3]').credit, null);
  assert.equal(api13.reduce(api13.initial(), 'check', '4').credit, null);
  assert.equal(api13.reduce(api13.initial(), 'check', '3').credit, 'independent');
});
gate('task13 routes only an exact unique valid task query and preserves the alias query with a relative offline target', () => {
  const id = api13.task.id;
  for (const query of ['?task=' + id, '?other=ok&task=' + id]) assert.equal(api13.deep(query), true, query);
  for (const query of ['', '?task=unknown', '?task=', '?task=' + id + '-extra', '?task=' + id + '&task=' + id, '?task=' + id + '&task=wrong', '?task=' + id + '&%74ask=' + id, '?task=%GG', '?task=' + id + '&bad=%GG', '?task=' + id + '&bad=%C0%AF', '?TASK=' + id, '?task=' + id + '%00']) assert.equal(api13.deep(query), false, query);
  const alias = read(alias13);
  assert.match(alias, /window\.location\.replace\('\.\/oge13-inequalities-series\.html' \+ window\.location\.search\)/);
  assert.match(alias, /<noscript><meta http-equiv="refresh" content="0; url=\.\/oge13-inequalities-series\.html"><\/noscript>/);
  assert.doesNotMatch(alias, /href="\/assets\//);
  assert.match(html13, /if \(author13IsDeepLink\(location\.search\)\) mod = 'author'/);
});
gate('task13 pure assistance and credit histories are immutable, sticky and idempotent under repeated checking', () => {
  const scenarios = [
    { events: [['check','3']], credit:'independent', hinted:false, revealed:false },
    { events: [['check','4'],['check','3']], credit:'independent', hinted:false, revealed:false, hadWrong:true },
    { events: [['hint'],['check','3']], credit:'assisted', hinted:true, revealed:false },
    { events: [['reveal'],['check','3']], credit:'revealed', hinted:false, revealed:true },
    { events: [['hint'],['reveal'],['check','3']], credit:'revealed', hinted:true, revealed:true },
    { events: [['reveal'],['hint'],['check','3']], credit:'revealed', hinted:true, revealed:true },
    { events: [['check','3'],['hint'],['reveal'],['check','3']], credit:'independent', hinted:true, revealed:true },
    { events: [['hint'],['check','3'],['reveal'],['check','3']], credit:'assisted', hinted:true, revealed:true }
  ];
  for (const scenario of scenarios) {
    let result = api13.initial();
    for (const [event, input] of scenario.events) {
      const frozen = JSON.stringify(result);
      const next = api13.reduce(Object.freeze(result), event, input);
      assert.equal(JSON.stringify(result), frozen, 'previous state remains immutable'); result = next;
    }
    assert.equal(result.credit, scenario.credit); assert.equal(result.hinted, scenario.hinted); assert.equal(result.revealed, scenario.revealed);
    assert.equal(result.hadWrong, Boolean(scenario.hadWrong));
    assert.deepEqual(plain(api13.reduce(result, 'check', '3')), plain(result), 'repeat check cannot add credit');
  }
  assert.match(html13, /Поля очищаются, но результат и история помощи сохраняются до обновления страницы/);
  assert.doesNotMatch(api13.task.hint, /вариант 3|x ≤ 3|x > −3|\(−3; 3\]/);
  assert.match(html13, /const bounds = \[\[true, true\], \[false, false\], \[false, true\], \[true, false\]\]/);
});

const file14 = 'trainers/oge-task14-progressions.html';
const html14 = read(file14);
const baseHtml14 = git('show', BASE + ':' + file14).toString('utf8');
const json14 = value => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
function load14(html) {
  const code = scripts(html).join('\n');
  const end = code.indexOf('/* ===== ОГЭ №14: запуск ===== */');
  assert.ok(end > 0, 'task14 bounded VM source');
  new vm.Script(code);
  const context = vm.createContext({ URLSearchParams, module: { exports: {} }, window: {} });
  vm.runInContext(code.slice(0, end), context, { timeout: 10000 });
  assert.ok(context.T14);
  return context.T14;
}
const old14 = load14(baseHtml14), current14 = load14(html14);
gate('task14 preserves nine generators, their order, weights and all four teaching quiz records', () => {
  assert.deepEqual(Object.keys(current14.GENS), ['AP-VAL', 'AP-SUM', 'AP-2PT', 'AP-SUM2DAY', 'GP-VAL', 'GP-COMPL', 'THRESH', 'PIC', 'TAXI']);
  assert.equal(json14(current14.GENS), json14(old14.GENS));
  assert.equal(json14(current14.GEN_ORDER), json14(old14.GEN_ORDER));
  assert.equal(json14(current14.GEN_WEIGHTS), json14(old14.GEN_WEIGHTS));
  for (const name of ['makeTask', 'randomTask', 'buildSteps', 'ways', 'parseDec', 'parseFracPair']) {
    assert.equal(current14[name].toString(), old14[name].toString(), 'unchanged task14 ' + name);
  }
  const quiz = html => html.match(/const QUIZ=\[[\s\S]*?\n\];/)[0];
  assert.equal(quiz(html14), quiz(baseHtml14));
  assert.equal(vm.runInNewContext(quiz(html14) + '\nQUIZ.length'), 4);
});
gate('task14 preserves 1260 deterministic old tasks, answers, distractors, solutions and independent simulations', () => {
  let checked = 0;
  for (const code of Object.keys(old14.GENS)) {
    assert.equal(current14.GENS[code].gen.toString(), old14.GENS[code].gen.toString());
    assert.equal(current14.GENS[code].sim.toString(), old14.GENS[code].sim.toString());
    for (let seed = 1; seed <= 140; seed++) {
      const before = old14.makeTask(code, seed * 7919 + 13), after = current14.makeTask(code, seed * 7919 + 13);
      assert.equal(json14(after), json14(before));
      assert.ok(current14.Fr.eq(current14.GENS[code].sim(after), after.ans));
      for (const method of after.methods) assert.equal(json14(current14.buildSteps(after, method)), json14(old14.buildSteps(before, method)));
      assert.equal(json14(current14.ways(after)), json14(old14.ways(before)));
      checked++;
    }
  }
  assert.equal(checked, 1260);
});
gate('task14 adds exactly one fixed author record outside the unchanged random bank', () => {
  assert.equal(old14.AUTHOR_TASK, undefined);
  assert.equal((html14.match(/T\.AUTHOR_TASK=Object\.freeze/g) || []).length, 1);
  const source = current14.AUTHOR_SOURCE, task = current14.AUTHOR_TASK;
  assert.equal(source.sourceKind, 'author-analogue');
  assert.equal(source.variantId, 'oge-2027-analogue-1');
  assert.equal(source.sourceTaskId, 'oge2027-analogue-1-task-14');
  assert.equal(source.localTaskId, source.sourceTaskId);
  assert.equal(task.id, source.localTaskId);
  assert.equal(source.answerType, 'numeric');
  assert.equal(source.coverageStatus, 'MISSING_APPENDED');
  assert.equal(source.label, 'Авторский аналог ОГЭ-2027 · Вариант 1');
  assert.equal(source.disclaimer, 'Авторский материал MathExam. Не является официальным материалом ФИПИ.');
  assert.match(task.text, /6 минут.*320 мг.*18 минут/);
  assert.equal(task.unit, 'мг');
  assert.equal(task.code, 'GP-VAL');
  assert.equal(current14.GENS['GP-VAL'].gen.toString().includes('[5,7,8,10,12,15]'), true, 'legacy decay excludes period six');
  assert.match(baseHtml14, /каждые 6 минут\. Сколько её останется через 30 минут, если было 320 мг/);
});
gate('task14 independently verifies three halvings, numeric answer forty, steps and no-answer hint', () => {
  const task = current14.AUTHOR_TASK;
  assert.equal(task.facts.P, 6); assert.equal(task.facts.T, 18); assert.equal(task.facts.k, 3);
  assert.equal(task.facts.m0.n, 320n); assert.equal(task.facts.m0.d, 1n);
  assert.equal(task.facts.q.n, 2n); assert.equal(task.facts.q.d, 1n);
  const periods = 18 / 6, masses = [320];
  for (let i = 0; i < periods; i++) masses.push(masses.at(-1) / 2);
  assert.deepEqual(masses, [320, 160, 80, 40]);
  assert.equal(320 * (1 / 2) ** periods, 40);
  assert.equal(task.ans.n, 40n); assert.equal(task.ans.d, 1n);
  assert.ok(current14.Fr.eq(current14.GENS['GP-VAL'].sim(task), task.ans));
  assert.equal(json14(current14.buildSteps(task, 'formula').map(step => current14.fmtN(step.a))), json14(['3', '8', '40']));
  assert.equal(json14(current14.buildSteps(task, 'table').map(step => current14.fmtN(step.a))), json14(['160', '80', '40']));
  assert.doesNotMatch(task.hint1, /40/);
  for (const value of ['40', '40,0', '40.00']) assert.ok(current14.Fr.eq(current14.parseDec(value), task.ans));
  for (const value of ['', '40abc', '40 мг', '1/0']) assert.equal(current14.parseDec(value), null);
  assert.equal(current14.Fr.eq(current14.parseDec('80'), task.ans), false);
});
gate('task14 exact deep link is fail-closed and author progress starts session-only', () => {
  const id = 'oge2027-analogue-1-task-14';
  assert.equal(current14.authorRequested('?task=' + id), true);
  for (const query of ['', '?task=unknown', '?task=' + id + '-extra', '?task=' + id + '&task=' + id, '?task=unknown&task=' + id, '?task=' + id + '&bad=%ZZ', '?task=%E0%A4%A']) {
    assert.equal(current14.authorRequested(query), false, query);
  }
  assert.equal(json14(current14.AUTHOR_PROGRESS), json14({ assisted: false, revealed: false, credited: false, solved: false }));
  assert.match(html14, /if\(T\.authorRequested\(location\.search\)\)\{T\.selectAuthorMarathon\(\);show\("marathon"\);\}\s*else show\("ref"\);/);
  const authorUi = html14.slice(html14.indexOf('function authorStatus(){'), html14.indexOf('T.renderStepsMode=renderStepsMode;'));
  assert.doesNotMatch(authorUi, /localStorage|sessionStorage|saveStore\(|bump\(/);
  assert.match(authorUi, /if\(!authorProgress\.assisted&&!authorProgress\.revealed\) authorProgress\.credited=true;/);
  assert.match(authorUi, /data-author-repeat\]\"\)\.onclick=renderAuthorMarathon/);
  assert.match(authorUi, /Поля очищаются, но результат и история помощи сохраняются до обновления страницы\./);
});

gate('wrong task12 answers provide no unrecorded mathematical help',()=>{
  const runtime=loadAuthor12(read(author12File));runtime.run('selectAuthorCohort(true)');
  runtime.node('#ansIn').value='0.02';runtime.run('checkAuthorAnswer()');
  assert.equal(runtime.run('AUTHOR_PROGRESS.hinted'),false);
  assert.doesNotMatch(runtime.node('#fb').innerHTML,/числитель|знаменатель|возведи|раздели/);
  runtime.node('#ansIn').value='50';runtime.run('checkAuthorAnswer()');
  assert.equal(runtime.run('AUTHOR_PROGRESS.credit'),'independent');
  const helped=loadAuthor12(read(author12File));helped.run('selectAuthorCohort(true)');
  helped.node('#hintBtn').onclick();helped.node('#ansIn').value='0.02';helped.run('checkAuthorAnswer()');
  assert.match(helped.node('#fb').innerHTML,/числитель.*знаменатель/);
  helped.node('#ansIn').value='50';helped.run('checkAuthorAnswer()');
  assert.equal(helped.run('AUTHOR_PROGRESS.credit'),'assisted');
});
