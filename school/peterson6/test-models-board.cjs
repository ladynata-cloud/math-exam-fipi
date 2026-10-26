'use strict';
// In-memory model contract checks. No browser, layout or screenshot evidence.
const assert = require('node:assert/strict');
let dispatched = 0;
class Node {
  constructor(tag) {
    this.tag = tag; this.children = []; this.attrs = {}; this.events = {}; this._text = ''; this.value = ''; this.className = '';
    this.classList = { toggle: (name, enabled) => {
      const names = this.className.split(' ').filter(Boolean).filter(item => item !== name);
      if (enabled) names.push(name);
      this.className = names.join(' ');
    } };
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  append(...nodes) {
    for (const node of nodes) {
      this.children.push(node); node.parent = this;
      if (this.tag === 'select' && this.children.length === 1 && node.tag === 'option') this.value = node.value;
    }
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  addEventListener(type, handler) { this.events[type] = handler; }
  dispatchEvent(event) { dispatched++; this.events[event.type]?.(event); }
  replaceChildren(...nodes) { this.children = []; this._text = ''; this.append(...nodes); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); }
}
const head = new Node('head');
const walk = node => [node, ...node.children.flatMap(walk)];
global.document = {
  head, createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag),
  createTextNode: text => Object.assign(new Node('#text'), { _text: text }),
  getElementById: id => walk(head).find(node => node.id === id)
};
require('./models.js');
const models = global.PetersonModels;
const clone = value => JSON.parse(JSON.stringify(value));
const variants = {
  logic: ['p01', 'p02', 'p03', 'p06', 'p07'], variable: ['p04', 'p05'], fractions: ['p08'],
  river: ['p09'], mean: ['p10'], percent: ['p11', 'p12'], growth: ['p13', 'p14']
};
function mount(kind, lessonId) {
  const host = new Node('div'), lesson = { id: lessonId, model: kind, title: kind };
  const handle = models.mount(host, lesson);
  assert.equal(typeof handle, 'function', 'original callable cleanup API remains');
  for (const key of ['getBoardState', 'applyBoardState', 'validateBoardState']) assert.equal(typeof handle[key], 'function');
  return { host, handle, lesson };
}
function elements(f, tag) { return walk(f.host).filter(node => node.tag === tag); }
function fire(node, type) { node.dispatchEvent({ type }); }
function set(node, value, type = 'input') { node.value = String(value); fire(node, type); }
function press(f, text) { const button = elements(f, 'button').find(node => node.textContent === text); assert(button, text); fire(button, 'click'); }
function visual(node) {
  return { tag: node.tag, text: node._text, attrs: Object.fromEntries(Object.entries(node.attrs).filter(([key]) => key !== 'for')),
    value: String(node.value), className: node.className, children: node.children.map(visual) };
}
let roundtrips = 0;
function transfer(source, target) {
  const snapshot = source.handle.getBoardState();
  assert(models.validateBoardState(target.lesson, snapshot));
  assert(target.handle.validateBoardState(snapshot));
  const calls = dispatched;
  target.handle.applyBoardState(snapshot);
  assert.equal(dispatched, calls, 'restore does not replay DOM events');
  assert.deepEqual(target.handle.getBoardState(), snapshot);
  assert.deepEqual(visual(target.host), visual(source.host), 'controls, explanation and model match');
  roundtrips++;
}
// Every authored model variant and every slider boundary produces a transportable state.
for (const [kind, ids] of Object.entries(variants)) for (const id of ids) {
  const source = mount(kind, id), target = mount(kind, id);
  transfer(source, target);
  for (const control of elements(source, 'input')) for (const value of [control.min, control.max]) {
    set(control, value); transfer(source, target);
  }
  const result = source.handle.getBoardState();
  assert.equal(result.lessonId, id); assert.equal(result.kind, kind);
  source.handle(); target.handle(); assert.equal(source.host.children.length, 0); assert.equal(target.host.children.length, 0);
}
// Logic restores the selection closure and the quantifier select, including empty sets.
let a = mount('logic', 'p06'), b = mount('logic', 'p06');
set(elements(a, 'select')[0], 1, 'change');
for (const number of ['2', '4', '6']) press(a, number);
transfer(a, b); assert(b.host.textContent.includes('Выбери хотя бы одно число'));
press(b, '3'); assert(b.host.textContent.includes('ни одного чётного'));
press(b, '2'); assert(b.host.textContent.includes('Свидетель: 2.'));
set(elements(b, 'select')[0], 0, 'change'); assert(b.host.textContent.includes('Контрпример: 3.'));
transfer(b, a);
a = mount('logic', 'p01'); b = mount('logic', 'p01'); press(a, '7'); transfer(a, b); press(b, '8');
assert.deepEqual(b.handle.getBoardState().chosen, [8]); assert(b.host.textContent.includes('8 — чётное число. — верно.'));
// Continue interactions from hydrated model state; expected mathematics is checked independently.
a = mount('variable', 'p05'); b = mount('variable', 'p05'); set(elements(a, 'input')[0], 4); transfer(a, b);
set(elements(b, 'input')[0], 5); assert(b.host.textContent.includes('13 < 12 — неверно.'));
a = mount('fractions', 'p08'); b = mount('fractions', 'p08'); set(elements(a, 'input')[0], 5); set(elements(a, 'input')[1], 4); transfer(a, b);
set(elements(b, 'input')[0], 3); assert(b.host.textContent.includes('3 · 4 = 12 клеток'));
a = mount('river', 'p09'); b = mount('river', 'p09'); set(elements(a, 'input')[0], 17); set(elements(a, 'input')[1], 3.5); transfer(a, b);
set(elements(b, 'input')[0], 12); assert(b.host.textContent.includes('15,5 − 8,5 = 7 = 2 · 3,5'));
a = mount('percent', 'p12'); b = mount('percent', 'p12'); set(elements(a, 'input')[0], 320); set(elements(a, 'input')[1], 150); transfer(a, b);
assert.equal(elements(b, 'svg').length, 2); set(elements(b, 'input')[1], 50); assert(b.host.textContent.includes('50% = 3,2 · 50 = 160'));
a = mount('growth', 'p14'); b = mount('growth', 'p14'); set(elements(a, 'input')[0], 1200); set(elements(a, 'input')[1], 20); set(elements(a, 'input')[2], 2); transfer(a, b);
set(elements(b, 'input')[2], 3); assert(b.host.textContent.includes('1 920')); assert(b.host.textContent.includes('2 073,6'));
// Mean carries both selectors even when changing them did not redraw the model.
a = mount('mean', 'p10'); b = mount('mean', 'p10'); set(elements(a, 'select')[0], 2, 'change'); set(elements(a, 'select')[1], 1, 'change'); transfer(a, b);
press(b, 'Переложить 1 кружок'); assert.deepEqual(b.handle.getBoardState().piles, [2, 9, 4]);
set(elements(b, 'select')[1], 2, 'change'); press(b, 'Переложить 1 кружок'); transfer(b, a);
assert.equal(a.handle.getBoardState().notice, 'same'); assert(a.host.textContent.includes('Выбери две разные коробки.'));
set(elements(a, 'select')[1], 0, 'change'); transfer(a, b); assert.equal(b.handle.getBoardState().notice, 'same', 'displayed notice survives subsequent selector change');
for (let i = 0; i < 5; i++) press(b, 'Переложить 1 кружок'); transfer(b, a);
assert.deepEqual(a.handle.getBoardState().piles, [6, 9, 0]); assert.equal(a.handle.getBoardState().notice, 'empty');
press(a, 'Начать заново'); assert.deepEqual(a.handle.getBoardState().piles, [2, 8, 5]); assert.equal(a.handle.getBoardState().notice, 'none');
assert.equal(a.handle.getBoardState().from, 2, 'reset preserves existing selector behavior');
// Returned and applied arrays have no aliases into the renderer closure.
let exposed = a.handle.getBoardState(); exposed.piles[0] = 999; assert.deepEqual(a.handle.getBoardState().piles, [2, 8, 5]);
exposed = a.handle.getBoardState(); a.handle.applyBoardState(exposed); exposed.piles[1] = 999; assert.deepEqual(a.handle.getBoardState().piles, [2, 8, 5]);
// Reject foreign lesson/type, unsafe shape, invalid mathematics and non-grid values atomically.
let rejections = 0, getterCalls = 0;
function reject(f, value) {
  const before = f.handle.getBoardState(), picture = visual(f.host), calls = dispatched;
  assert.equal(models.validateBoardState(f.lesson, value), false);
  assert.equal(f.handle.validateBoardState(value), false);
  assert.throws(() => f.handle.applyBoardState(value), /Invalid Peterson model board state/);
  assert.deepEqual(f.handle.getBoardState(), before); assert.deepEqual(visual(f.host), picture); assert.equal(dispatched, calls);
  rejections++;
}
for (const [kind, ids] of Object.entries(variants)) for (const id of ids) {
  const f = mount(kind, id), value = f.handle.getBoardState();
  for (const invalid of [null, [], { ...value, extra: 1 }, { ...value, lessonId: 'p99' }, { ...value, kind: 'other' }, Object.assign(Object.create({ inherited: true }), value)]) reject(f, invalid);
  const getter = clone(value); Object.defineProperty(getter, 'lessonId', { enumerable: true, get() { getterCalls++; return id; } }); reject(f, getter);
  const hidden = clone(value); Object.defineProperty(hidden, 'hidden', { value: true }); reject(f, hidden);
  const symbol = clone(value); symbol[Symbol('hidden')] = true; reject(f, symbol);
  if (kind === 'logic') {
    for (const chosen of [[1, 1], [2, 1], [0], [9], Array(1), Object.assign([2], { extra: true })]) reject(f, { ...value, chosen });
    const accessor = [2]; Object.defineProperty(accessor, '0', { enumerable: true, get() { getterCalls++; return 2; } }); reject(f, { ...value, chosen: accessor });
    const pretendArray = {}; Object.defineProperty(pretendArray, 'length', { get() { getterCalls++; return 1; } }); reject(f, { ...value, chosen: pretendArray });
    if (id === 'p01') { reject(f, { ...value, chosen: [] }); reject(f, { ...value, chosen: [1, 2] }); }
    if (!['p06', 'p07'].includes(id)) reject(f, { ...value, mode: value.mode === 'all' ? 'exists' : 'all' });
  }
  if (kind === 'variable') for (const x of [-1, 9, 0.5, NaN, Infinity, '4']) reject(f, { ...value, x });
  if (kind === 'fractions') { reject(f, { ...value, a: 6 }); reject(f, { ...value, b: 1.5 }); }
  if (kind === 'river') { reject(f, { ...value, own: 5 }); reject(f, { ...value, current: 0.25 }); }
  if (kind === 'mean') {
    for (const piles of [[1, 2, 3], [16, -1, 0], [2, 8, 5, 0], [2.5, 7.5, 5], Array(3)]) reject(f, { ...value, piles });
    reject(f, { ...value, from: 3 }); reject(f, { ...value, to: -1 }); reject(f, { ...value, notice: '<b>same</b>' });
  }
  if (kind === 'percent') { reject(f, { ...value, whole: 30 }); reject(f, { ...value, p: 201 }); }
  if (kind === 'growth') { reject(f, { ...value, initial: 150 }); reject(f, { ...value, rate: 6 }); reject(f, { ...value, years: 7 }); }
}
assert.equal(getterCalls, 0, 'validators do not evaluate untrusted accessors');
assert.equal(models.validateBoardState({ id: 'p08', model: 'logic' }, mount('logic', 'p01').handle.getBoardState()), false);
console.log(JSON.stringify({ ok: true, lessonVariants: 14, roundtrips, rejections, coverage: 'model/controls/closure/notice hydrate, no replay, next local interaction, strict atomic validation', visualBrowserQA: false }));
// The new state is task-specific and restores both controls and future interaction closures.
require('./continuation-models.js');
function continuation(id,taskId=id+'-sample'){
 const host=new Node('div'),lesson={id,model:'continuation',title:id},task={id:taskId};
 return {host,lesson,task,handle:models.mount(host,lesson,task)};
}
let continuationRoundtrips=0,continuationRejected=0;
function syncContinuation(a,b){const value=a.handle.getBoardState(),calls=dispatched;assert(models.validateBoardState(b.lesson,value,b.task));b.handle.applyBoardState(value);assert.deepEqual(b.handle.getBoardState(),value);assert.deepEqual(visual(b.host),visual(a.host));assert.equal(dispatched,calls);continuationRoundtrips++;}
function invalidContinuation(f,v){const before=f.handle.getBoardState(),picture=visual(f.host);assert.equal(models.validateBoardState(f.lesson,v,f.task),false);assert.throws(()=>f.handle.applyBoardState(v),/Invalid Peterson model board state/);assert.deepEqual(f.handle.getBoardState(),before);assert.deepEqual(visual(f.host),picture);continuationRejected++;}
for(let n=15;n<=58;n++){
 const id='p'+n,a=continuation(id),b=continuation(id);syncContinuation(a,b);
 for(const [i,control]of elements(a,'select').entries()){
  const options=PetersonContinuationModels.configs[id].controls[i].values;
  for(const option of [options[0],options.at(-1)]){set(control,Array.isArray(option)?option[0]:option,'change');syncContinuation(a,b);}
 }
 for(let i=0;i<5;i++){press(a,'Следующий шаг модели');syncContinuation(a,b);}
 press(b,'Начать модель заново');syncContinuation(b,a);
 const valid=a.handle.getBoardState();
 for(const bad of [null,[],{...valid,kind:'logic'},{...valid,lessonId:'p99'},{...valid,taskId:'different'},{...valid,extra:true},{...valid,stage:6},{...valid,stage:-1},{...valid,stage:0.5},{...valid,values:[]},{...valid,values:valid.values.map(()=>Infinity)},{...valid,values:valid.values.map(()=>99999)},Object.assign(Object.create({x:1}),valid)])invalidContinuation(a,bad);
 const getter=clone(valid);Object.defineProperty(getter,'values',{enumerable:true,get(){getterCalls++;return valid.values;}});invalidContinuation(a,getter);
 const accessor=clone(valid);Object.defineProperty(accessor.values,'0',{enumerable:true,get(){getterCalls++;return valid.values[0];}});invalidContinuation(a,accessor);
 const symbol=clone(valid);symbol[Symbol('extra')]=1;invalidContinuation(a,symbol);
 const extraArray=clone(valid);extraArray.values.extra=1;invalidContinuation(a,extraArray);
 const exposed=a.handle.getBoardState();exposed.values[0]=9999;assert.notEqual(a.handle.getBoardState().values[0],9999);
 const incoming=a.handle.getBoardState();a.handle.applyBoardState(incoming);incoming.values[0]=9999;assert.notEqual(a.handle.getBoardState().values[0],9999);
 a.handle();b.handle();
}
assert.equal(getterCalls,0,'new validators must not call untrusted accessors');
// A restored coordinate model must use restored x in the next y update.
let ca=continuation('p39'),cb=continuation('p39');set(elements(ca,'select')[0],-4,'change');set(elements(ca,'select')[1],2,'change');syncContinuation(ca,cb);set(elements(cb,'select')[1],-3,'change');assert(cb.host.textContent.includes('A(-4; -3)'));assert.deepEqual(cb.handle.getBoardState().values,[-4,-3]);
// Restored sign choices must drive later arithmetic, rather than stale initial closures.
ca=continuation('p28');cb=continuation('p28');set(elements(ca,'select')[0],4,'change');set(elements(ca,'select')[1],-2,'change');syncContinuation(ca,cb);set(elements(cb,'select')[1],3,'change');assert(cb.host.textContent.includes('4 − (3) = 1'));
console.log(JSON.stringify({continuationLessons:44,continuationRoundtrips,continuationRejected,validated:'task identity, no getters, no aliasing, atomic restore, visual equality, post-hydration controls',visualBrowserQA:false}));
