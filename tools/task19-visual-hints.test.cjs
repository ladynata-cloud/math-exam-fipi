'use strict';

// Contracts for the optional visual help flow. Existing source banks are the
// independent truth/text baseline; the new renderer must not silently drop one.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, VirtualConsole, ResourceLoader} = require('jsdom');
const visuals = require('../trainers/task19-visual-models.js');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const KEY = 'mathExam.task19.visualHints.v1';
const sources = ['task19-visual-data.js', 'task19-models-triangles.js', 'task19-models-circles.js', 'task19-models-lines-polygons.js', 'task19-visual-models.js', 'task19-reference.js', 'task19-visual-app.js'];
const dataScope = {window:{}, module:{exports:{}}};
vm.runInNewContext(read('trainers/task19-visual-data.js'), dataScope);
const data = dataScope.window.Task19Data || dataScope.module.exports;
const cards = data.cards;
const normalize = text => text.normalize('NFKC').replace(/\s+/g, ' ').trim();

function originalCards() {
  const archive = read('trainers/archive-5-weeks/task19-before-visual-hints-20261020.html');
  const match = archive.match(/const INITIAL_DATA\s*=\s*(\{.*?\});\s*\n/s);
  assert(match, 'The previous rich bank is available as a source fixture');
  const rich = JSON.parse(match[1]).statements.map(s => ({id:s.id,text:s.text,truth:s.correct}));
  const basic = JSON.parse(read('trainers/task19-data.json')).cards.map(s => ({id:s.id,text:s.statement,truth:s.truth}));
  assert.equal(rich.length, 105);
  assert.equal(basic.length, 63);
  return [...rich, ...basic];
}

function boot(options = {}) {
  const file = options.file || 'task19-trainer.html';
  const card = options.card === undefined ? 'prev-056' : options.card;
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(read('trainers/' + file), {
    url:'https://example.test/trainers/' + file + (card ? '?card=' + encodeURIComponent(card) : ''),
    runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:console
  });
  dom.window.addEventListener('error', event => errors.push(event.message));
  if (options.storage) {
    for (const [key, value] of Object.entries(options.storage)) {
      dom.window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
  if (options.noStorage) {
    Object.defineProperty(dom.window, 'localStorage', {get() { throw new Error('Storage blocked for this test'); }});
  }
  for (const source of sources) dom.window.eval(read('trainers/' + source));
  if (!dom.window.document.getElementById('statement').textContent.trim() || /Загрузка/.test(dom.window.document.getElementById('statement').textContent)) {
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  }
  return {dom, window:dom.window, document:dom.window.document, errors,
    el:id => dom.window.document.getElementById(id),
    saved:() => JSON.parse(dom.window.localStorage.getItem(KEY))};
}

test('both prior banks retain their exact mathematical statements and truth values', () => {
  assert.equal(new Set(cards.map(c => c.id)).size, cards.length, 'Card ids are unique');
  const identities = new Map();
  for (const card of cards) for (const id of [card.id,...(card.aliases || [])]) {
    assert(!identities.has(id) || identities.get(id) === card.id, 'Ambiguous source identity '+id);
    identities.set(id,card.id);
  }
  for (const old of originalCards()) {
    // Owner's PDF page 20 asks for familiar wording, with no mathematical change.
    const expectedText=old.id==='prev-011'?'Сумма углов любого треугольника равна 180°.':old.text;
    if(old.id==='prev-011')assert.equal(old.text,'Сумма внутренних углов любого треугольника равна 180°.');
    const candidates = cards.filter(c => normalize(c.text) === normalize(expectedText));
    assert(candidates.length, 'Missing source statement ' + old.id);
    assert(candidates.every(c => c.truth === old.truth), 'Changed truth for ' + old.id);
    assert(candidates.some(c => c.id === old.id || (c.aliases || []).includes(old.id)), 'Lost source identity ' + old.id);
  }
  for (const card of cards) {
    assert.equal(typeof card.truth, 'boolean', card.id);
    assert(card.theme && card.explanation && card.hint && card.hint.prompt, card.id + ': complete teaching content');
    assert(card.hint.model && !card.hint.svg, card.id + ': every active hint is an interactive model');
    if (card.hint.model) assert(visuals.modelNames.includes(card.hint.model), card.id + ': known interactive model');
    assert.doesNotMatch(card.hint.prompt, /^(?:Это утверждение\s+)?(?:верно|неверно)[.!:]/i, card.id + ': hint must not supply a verdict');
  }
});

test('the source audit maps every recorded assertion to a card without changing its truth', () => {
  const audit = JSON.parse(read('trainers/task19-source-coverage.json'));
  assert.match(audit.auditDate,/^\d{4}-\d{2}-\d{2}$/,'Audit date is explicit');
  assert.equal(audit.officialBank.complete,false,'A partial official-bank audit must not claim exhaustive FIPI coverage');
  assert.equal(typeof audit.officialBank.status,'string');
  assert(audit.officialBank.status.trim(),'Official coverage limitation is explicit');
  assert(Array.isArray(audit.sources) && audit.sources.length,'Source snapshots are enumerated');
  assert.equal(new Set(audit.sources.map(s=>s.id)).size,audit.sources.length,'Source ids are unique');
  const byId = new Map(cards.map(c=>[c.id,c]));
  const covered = new Set();
  let entryCount = 0;
  for (const source of audit.sources) {
    assert(source.id && source.type,'Source has identity and provenance type');
    assert([source.url,source.fileName].some(value=>typeof value === 'string' && value.trim()),source.id+': source has a public URL or original file name');
    assert(Array.isArray(source.entries) && source.entries.length,source.id+': finite source snapshot');
    const ids = new Set();
    for (const entry of source.entries) {
      const label = source.id+'/'+entry.sourceId;
      assert(entry.sourceId && !ids.has(entry.sourceId),label+': unique source entry');
      ids.add(entry.sourceId);
      assert.equal(typeof entry.text,'string',label+': source wording retained');
      assert(entry.text.trim(),label+': source wording is nonempty');
      assert.equal(typeof entry.truth,'boolean',label+': source truth is explicit');
      const card = byId.get(entry.cardId);
      assert(card,label+': points to a canonical active card');
      assert(['exact','equivalent','included'].includes(entry.matchType),label+': match is classified');
      if (entry.matchType === 'exact') assert.equal(normalize(entry.text),normalize(card.text),label+': exact match preserves wording');
      else assert(typeof entry.note === 'string' && entry.note.trim(),label+': nonliteral coverage has an audit note');
      if (entry.matchType === 'included') {
        assert.equal(entry.sourceId,'fipi-007',label+': inclusion is limited to the independently reviewed middle-line assertion');
        assert.equal(card.id,'prev-042',label+': reviewed covering statement');
        assert.equal(entry.truth,true,label+': an included source statement must be true');
        assert.equal(card.truth,true,label+': the stronger covering statement must also be true');
      }
      if (entry.truth !== card.truth) {
        const correction = entry.correction;
        assert(correction,label+': truth mismatch requires an explicit audited correction');
        assert.equal(correction.originalTruth,entry.truth,label+': correction names the original verdict');
        assert.equal(correction.correctedTruth,card.truth,label+': correction matches the active verdict');
        assert(typeof correction.reason === 'string' && correction.reason.trim(),label+': correction has a mathematical reason');
      }
      covered.add(card.id);
      entryCount++;
    }
  }
  for (const card of cards) assert(covered.has(card.id),card.id+': active card has an audited source mapping');
  assert.equal(audit.counts.uniqueCards,cards.length,'Published card count follows the actual bank');
  if ('sourceEntries' in audit.counts) assert.equal(audit.counts.sourceEntries,entryCount,'Published source-entry count follows the enumerated snapshots');
});

test('active lessons and accessible former modes use familiar school terminology', () => {
  for (const card of cards) {
    for (const [field,text] of Object.entries({text:card.text,explanation:card.explanation,hintPrompt:card.hint.prompt,hintSvg:card.hint.svg || ''})) {
      assert.doesNotMatch(text,/конгруэнт/iu,card.id+' '+field+': use «равны» in the learner-facing wording');
    }
  }
  for (const file of [
    'trainers/task19-data.json',
    'trainers/archive-5-weeks/geometry-statements-trainer-improved-370628fb.html',
    'trainers/archive-5-weeks/geometry-statements-trainer-improved-updated-22181e31.html',
    'trainers/archive-5-weeks/preview-5-8bb7dd76.html',
    'trainers/archive-5-weeks/task19-before-visual-hints-20261020.html'
  ]) assert(!/конгруэнт/iu.test(read(file)),file+': old modes retain the requested terminology correction');
});

test('both public URLs start with a question and optional help, not a revealed solution', () => {
  for (const file of ['task19-trainer.html','geometry_statements_trainer_improved.html']) {
    const env = boot({file});
    try {
      assert.match(env.el('statement').textContent, /ромб.*диагонали/iu);
      assert.equal(env.el('hintToggle').textContent.trim(), 'Хочешь подсказку?');
      assert(env.el('hintPanel').hidden, file + ': hint is opt-in');
      assert(env.el('answerPanel').hidden, file + ': verdict is withheld');
      assert.equal(env.el('answerExplanation').textContent.trim(), '');
      assert.equal(env.el('btnTrue').disabled, false);
      assert.equal(env.el('btnFalse').disabled, false);
      assert.deepEqual(env.errors, []);
    } finally { env.dom.window.close(); }
  }
});

test('both entry pages and the standalone download link to the existing previous-modes archive', () => {
  const entries = [
    {file:'trainers/task19-trainer.html',url:'https://mathexam.space/trainers/task19-trainer.html'},
    {file:'trainers/geometry_statements_trainer_improved.html',url:'https://mathexam.space/trainers/geometry_statements_trainer_improved.html'},
    {file:'downloads/trainers/task19-trainer/task19-trainer.html',url:'file:///task19-trainer.html'}
  ];
  const targets = [];
  for (const entry of entries) {
    const dom = new JSDOM(read(entry.file),{url:entry.url});
    try {
      const links = [...dom.window.document.querySelectorAll('#settings a')].filter(link=>/Прежние режимы/.test(link.textContent));
      assert.equal(links.length,1,entry.file+': previous modes remain reachable');
      const target = new URL(links[0].href);
      assert.equal(target.origin,'https://mathexam.space',entry.file+': downloaded HTML must open the public archive, not a relative local file');
      assert.match(target.pathname,/^\/trainers\/archive-5-weeks\//,entry.file+': target is a preserved trainer archive');
      const localTarget = path.resolve(root,'.'+decodeURIComponent(target.pathname));
      assert(fs.existsSync(localTarget) && fs.statSync(localTarget).isFile(),entry.file+': archive target exists: '+target.pathname);
      targets.push(target.href);
    } finally { dom.window.close(); }
  }
  assert.equal(new Set(targets).size,1,'Public and downloaded trainers point to the same preserved archive');
});

test('all source statements have a usable visual hint without recording an answer', () => {
  for (const card of cards) {
    const env = boot({card:card.id});
    try {
      assert.equal(normalize(env.el('statement').textContent), normalize(card.text), card.id);
      const before = env.el('progressText').textContent;
      env.el('hintToggle').click();
      assert.equal(env.el('hintPanel').hidden, false, card.id + ': hint opens');
      assert(env.el('visualHost').querySelector('svg'), card.id + ': real diagram rendered');
      assert(env.el('hintPrompt').textContent.trim(), card.id + ': observation prompt rendered');
      assert(env.el('answerPanel').hidden, card.id + ': help does not answer');
      assert.equal(env.el('progressText').textContent, before, card.id + ': help is not graded');
      assert.deepEqual(env.errors, [], card.id + ': no render errors');
    } finally { env.dom.window.close(); }
  }
});

test('a wrong answer explains the same statement, and duplicate clicks do not count twice', () => {
  const env = boot({card:'prev-056'});
  try {
    env.el('btnTrue').click();
    assert.equal(env.el('answerPanel').hidden, false);
    assert(env.el('answerExplanation').textContent.trim().length > 20);
    assert(env.el('btnTrue').disabled && env.el('btnFalse').disabled);
    const once = env.window.localStorage.getItem(KEY);
    env.el('btnTrue').click();
    env.el('btnFalse').click();
    env.window.document.dispatchEvent(new env.window.KeyboardEvent('keydown', {code:'KeyJ',key:'j',bubbles:true}));
    assert.equal(env.window.localStorage.getItem(KEY), once, 'An already answered card cannot score again');
    env.el('hintToggle').click();
    assert(env.el('visualHost').querySelector('svg'), 'Help remains available after an error');
    env.el('nextCard').click();
    assert(env.el('hintPanel').hidden, 'Next statement starts without help');
    assert(env.el('answerPanel').hidden, 'Previous verdict is removed');
    assert.equal(env.el('answerExplanation').textContent.trim(), '');
    assert.deepEqual(env.errors, []);
  } finally { env.dom.window.close(); }
});

test('topic selection actually limits the next questions', () => {
  const env = boot();
  try {
    const theme = cards.find(c => /Окружность/iu.test(c.theme)).theme;
    const select = env.el('topicSelect');
    assert([...select.options].some(o => o.value === theme));
    select.value = theme;
    select.dispatchEvent(new env.window.Event('change',{bubbles:true}));
    for (let i=0; i<5; i++) {
      assert.equal(env.el('topicLabel').textContent.trim(), theme);
      env.el('nextCard').click();
    }
    assert.deepEqual(env.errors, []);
  } finally { env.dom.window.close(); }
});

test('blocked or corrupt browser storage cannot prevent answering', () => {
  for (const options of [{noStorage:true},{storage:{[KEY]:'{broken'}}]) {
    const env = boot(options);
    try {
      assert(env.el('statement').textContent.trim());
      env.el('hintToggle').click();
      assert(env.el('visualHost').querySelector('svg'));
      env.el('btnFalse').click();
      assert.equal(env.el('answerPanel').hidden, false);
      env.el('nextCard').click();
      assert(env.el('answerPanel').hidden);
      assert.deepEqual(env.errors, []);
    } finally { env.dom.window.close(); }
  }
});

test('opening the redesigned trainer does not overwrite either former storage format', () => {
  const oldBasic = {progress:{rhombus_diagonals_equal:{box:2,seen:3,correct:1}},stats:{doneToday:3,correctToday:1,totalToday:3,dayKey:'2026-01-01'}};
  const oldErrors = [{statementId:'prev-056',ts:1,mode:'cards',wasCorrect:false,count:2}];
  const storage = {'task19_trainer_v1':oldBasic,'geometryStatements.errors.v2':oldErrors,'geometryStatements.userAdded.v1':[{id:'custom',text:'User work'}]};
  const env = boot({storage});
  try {
    env.el('btnFalse').click();
    for (const [key,value] of Object.entries(storage)) assert.equal(env.window.localStorage.getItem(key), JSON.stringify(value), key);
    assert.deepEqual(env.errors, []);
  } finally { env.dom.window.close(); }
});

test('an answered card survives reload without being scored twice', () => {
  const first = boot();
  let saved;
  try {
    first.el('hintToggle').click();
    first.el('btnTrue').click();
    saved = first.saved();
    assert.equal(saved.records['prev-056'].attempts, 1);
    assert.equal(saved.records['prev-056'].correct, 0);
    assert.equal(saved.records['prev-056'].needsReview, true);
  } finally { first.dom.window.close(); }
  const second = boot({card:null,storage:{[KEY]:saved}});
  try {
    assert.equal(second.el('answerPanel').hidden, false);
    assert.equal(second.el('hintPanel').hidden, false);
    assert(second.el('visualHost').querySelector('svg'));
    second.el('btnFalse').click();
    assert.deepEqual(second.saved().records, saved.records);
    assert.deepEqual(second.errors, []);
  } finally { second.dom.window.close(); }
});

test('review mode selects recorded mistakes and exits cleanly when they are corrected', () => {
  const env = boot();
  try {
    env.el('btnTrue').click();
    env.el('reviewOnly').checked = true;
    env.el('reviewOnly').dispatchEvent(new env.window.Event('change',{bubbles:true}));
    assert.equal(env.saved().current.id, 'prev-056');
    assert.equal(env.el('answerPanel').hidden, true);
    env.el('btnFalse').click();
    assert.equal(env.saved().records['prev-056'].needsReview, false);
    env.el('nextCard').click();
    assert.match(env.el('statement').textContent, /нет ошибок/);
    assert(env.el('hintToggle').hidden);
    env.el('nextCard').click();
    assert.equal(env.saved().review, false);
    assert(env.saved().current.id);
    assert.equal(env.el('hintToggle').hidden, false);
    assert.deepEqual(env.errors, []);
  } finally { env.dom.window.close(); }
});

test('legacy records are imported by source aliases, and malformed new records are sanitized', () => {
  const alias = JSON.parse(read('trainers/task19-data.json')).cards[0].id;
  const canonical = cards.find(c => c.id === alias || c.aliases?.includes(alias));
  const legacy = boot({card:null,storage:{task19_trainer_v1:{progress:{[alias]:{seen:7,correct:4,box:1}}},'geometryStatements.errors.v2':[{statementId:'prev-056'}]}});
  try {
    assert.deepEqual(legacy.saved().records[canonical.id], {attempts:7,correct:4,needsReview:true});
    assert.equal(legacy.saved().records['prev-056'].needsReview, true);
  } finally { legacy.dom.window.close(); }
  for (const malformed of [
    {version:1,records:{missing:{attempts:99},'prev-056':{attempts:-4,correct:100,needsReview:'true'}},topic:'unknown',current:{id:'missing',answer:true}},
    {version:1,records:[],topic:null,current:{id:'prev-056',answer:{}}},
    {version:1,records:{'prev-056':null},current:{id:'prev-056',answer:'false',hintOpen:'yes'}}
  ]) {
    const env = boot({card:null,storage:{[KEY]:malformed}});
    try {
      const state = env.saved();
      assert(state.current && cards.some(c => c.id === state.current.id));
      assert.equal(state.records.missing, undefined);
      assert.equal(state.current.answer, null);
      for (const r of Object.values(state.records)) assert(r.attempts >= r.correct && r.correct >= 0);
      env.el('btnTrue').click();
      assert.equal(env.el('answerPanel').hidden, false);
      assert.deepEqual(env.errors, []);
    } finally { env.dom.window.close(); }
  }
});

const near = (actual, expected, message) => assert(Math.abs(actual-expected) < 1e-7, `${message}: ${actual} ≠ ${expected}`);
const length = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
const dot = (a,b) => a[0]*b[0]+a[1]*b[1];
const subtract = (a,b) => [a[0]-b[0],a[1]-b[1]];
const area = (a,b,c) => Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;

function verifyGeometry(model, params) {
  const {points:P,metrics:M,values:V} = visuals.sample(model,params);
  const verifyPoints=(p,label)=>{
    assert(Array.isArray(p)&&p.length>0,label+' contains coordinates');
    if(typeof p[0]==='number'){assert.equal(p.length,2,label+' is a plane point');assert(p.every(Number.isFinite),label+' has finite coordinates');}
    else p.forEach((point,i)=>verifyPoints(point,label+'['+i+']'));
  };
  for (const [name,p] of Object.entries(P)) verifyPoints(p,model+' '+name);
  for (const [name,value] of Object.entries(M)) if (typeof value === 'number') assert(Number.isFinite(value), model+' '+name+' finite measurement');
  const output = visuals.render(model,params);
  assert.match(output.svg, /<svg\b/);
  assert.doesNotMatch(output.svg, /NaN|Infinity|undefined/);
  if (model === 'adjacentAngles') near(M.alpha+M.beta,180,'Adjacent angles');
  if (model === 'triangleAngles') {
    near(M.a+M.b+M.c,180,'Triangle angle sum');
    assert(Math.min(M.a,M.b,M.c)>0);
    assert(area(P.A,P.B,P.C)>0);
  }
  if (model === 'triangleMedian' || model === 'areaTriangle') {
    near(area(P.A,P.B,P.C),M.area,'Area from coordinates');
    near(length(P.A,P.M),length(P.M,P.B),'Median reaches midpoint');
    near(area(P.A,P.M,P.C),area(P.M,P.B,P.C),'Median halves area');
  }
  if (model === 'triangleSides') {
    assert.equal(M.exists, V.a+V.b>V.c && V.a+V.c>V.b && V.b+V.c>V.a);
    if (M.exists) {
      near(length(P.B,P.C),V.a,'Side a');near(length(P.A,P.C),V.b,'Side b');near(length(P.A,P.B),V.c,'Side c');
      near(M.angles.reduce((a,b)=>a+b,0),180,'Triangle sides produce true angles');
    } else assert.equal(Object.keys(P).length,0,'Invalid triangle cannot be drawn as a valid triangle');
  }
  if (['parallelogram','rhombus','rectangle'].includes(model)) {
    near(length(P.A,P.B),length(P.C,P.D),'Opposite sides');
    near(length(P.A,P.D),length(P.B,P.C),'Other opposite sides');
    near(length(P.A,P.O),length(P.C,P.O),'First diagonal bisected');
    near(length(P.B,P.O),length(P.D,P.O),'Second diagonal bisected');
    if (model==='rhombus') {
      near(length(P.A,P.B),length(P.A,P.D),'Rhombus equal sides');
      near(dot(subtract(P.C,P.A),subtract(P.D,P.B)),0,'Rhombus diagonals perpendicular');
      near(M.BAC,M.CAD,'Rhombus first diagonal bisects an angle');
      near(M.ABD,M.DBC,'Rhombus second diagonal bisects an angle');
    }
    if (model==='rectangle') near(length(P.A,P.C),length(P.B,P.D),'Rectangle equal diagonals');
  }
  if (model === 'trapezoid') {
    near(P.A[1],P.B[1],'Lower base horizontal');near(P.C[1],P.D[1],'Upper base horizontal');
    near(length(P.E,P.F),(length(P.A,P.B)+length(P.C,P.D))/2,'Trapezoid midline');
    assert(M.bottom>M.top && M.height>0);
    near(M.area,area(P.A,P.B,P.C)+area(P.A,P.C,P.D),'Trapezoid area');
    near(M.AO+M.OC,length(P.A,P.C),'Trapezoid intersection lies on AC');
    near(M.BO+M.OD,length(P.B,P.D),'Trapezoid intersection lies on BD');
    near(M.AO/M.OC,M.bottom/M.top,'Trapezoid diagonal division is base ratio');
    near(M.BO/M.OD,M.bottom/M.top,'Other trapezoid diagonal division is base ratio');
  }
  if (model === 'circleChord') {
    near(length(P.O,P.A),M.radius,'Chord endpoint on circle');near(length(P.O,P.B),M.radius,'Other endpoint on circle');
    near(length(P.A,P.B),M.chord,'Chord measurement');
    assert(M.chord>0 && M.chord<=M.diameter+1e-9);
  }
  if (model === 'circleAngle') {
    assert(V.point>V.central && V.point<360,'Inscribed vertex stays on opposite arc');
    near(2*M.inscribed,M.central,'Central angle twice inscribed angle');
    near(M.secondInscribed,M.inscribed,'Angles subtending same arc');
    for (const name of ['A','B','C','D']) near(length(P.O,P[name]),5,'Point lies on circle');
    if (V.diameter) near(M.inscribed,90,'Diameter subtends a right angle');
  }
  if (model === 'similarity') {
    near(M.scaledPerimeter/M.perimeter,M.scale,'Similar perimeter ratio');
    near(M.scaledArea/M.area,M.scale**2,'Similar area ratio');
  }
}

test('every geometry model preserves its mathematical conditions at all slider corners', () => {
  for (const model of visuals.modelNames) {
    const controls = visuals.controlsFor(model);
    const variants = controls.reduce((list,c) => list.flatMap(p => [{...p,[c.key]:c.min},{...p,[c.key]:c.max}]), [{}]);
    for (const params of [{},...variants]) verifyGeometry(model,params);
  }
  for (const central of [30,90,120,180]) for (const point of [0,50,180,340,400]) verifyGeometry('circleAngle',{central,point,compare:true});
  for (const point of [0,200,340]) verifyGeometry('circleAngle',{diameter:true,point});
  assert.equal(visuals.sample('triangleSides',{a:2,b:3,c:5}).metrics.exists,false);
  assert.equal(visuals.sample('triangleSides',{a:2,b:3,c:4.5}).metrics.exists,true);
  assert(visuals.sample('rhombus',{angle:60}).metrics.AC !== visuals.sample('rhombus',{angle:60}).metrics.BD,'A non-square rhombus is a real counterexample');
  near(visuals.sample('rhombus',{angle:90}).metrics.AC,visuals.sample('rhombus',{angle:90}).metrics.BD,'Square special case');
  near(visuals.sample('circleChord',{offset:0}).metrics.chord,10,'Central chord is diameter');
  assert.equal(visuals.controlsFor('circleAngle',{diameter:true}).some(c=>c.key==='central'),false);
  assert.equal(visuals.controlsFor('triangleMedian',{locked:['x']}).some(c=>c.key==='x'),false);
});

test('the downloadable trainer includes the current lessons and works without network or browser storage', () => {
  const requests = [], errors = [];
  class NoNetwork extends ResourceLoader { fetch(url) { requests.push(url); return null; } }
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  const dom = new JSDOM(read('downloads/trainers/task19-trainer/task19-trainer.html'), {
    url:'file:///task19-trainer.html',runScripts:'dangerously',resources:new NoNetwork(),virtualConsole
  });
  const doc = dom.window.document;
  try {
    for (const file of [...sources,'task19-visual.css']) {
      const embedded = doc.querySelector('[data-inline-source="/trainers/'+file+'"]');
      assert(embedded,'Offline copy embeds '+file);
      let expected=read('trainers/'+file).trim();
      const manifest=JSON.parse(read('downloads/trainers-manifest.json')).trainers.find(e=>e.slug==='task19-trainer');
      for(const imagePath of manifest.inlineImageAssets||[]){
        const embeddedImage='data:image/png;base64,'+fs.readFileSync(path.join(root,imagePath.slice(1))).toString('base64');
        expected=expected.replaceAll(JSON.stringify(imagePath),JSON.stringify(embeddedImage));
      }
      assert.equal(embedded.textContent.trim(),expected,'Offline copy is stale; rerun build-trainer-downloads for '+file);
    }
    assert.equal(doc.querySelector('#hintPanel').hidden,true);
    assert.equal(doc.querySelector('#answerPanel').hidden,true);
    doc.querySelector('#hintToggle').click();
    assert(doc.querySelector('#visualHost svg'));
    doc.querySelector('#btnFalse').click();
    assert.equal(doc.querySelector('#answerPanel').hidden,false);
    doc.querySelector('#nextCard').click();
    assert.equal(doc.querySelector('#answerPanel').hidden,true);
    assert.deepEqual(requests,[],'A downloaded lesson must not need assets from the website');
    assert.deepEqual(errors,[]);
  } finally { dom.window.close(); }
});
