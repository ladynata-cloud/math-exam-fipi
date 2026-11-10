'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ink = require('../trainers/group-board-ink.js');

const context = {target:'pupil-a', assignmentId:'board-one', actor:'pupil-a'};
const stroke = (id, author = context.actor) => ({id, author, points:[{x:0.2,y:0.3},{x:0.6,y:0.7}],color:'#172033',width:3});
const action = (opId, type, payload, overrides = {}) => ({opId,type,payload,target:context.target,assignmentId:context.assignmentId,...overrides});
const queuedStroke = (opId, id, overrides) => {
  const {author, ...payload} = stroke(id);
  return action(opId,'stroke',payload,overrides);
};
const previews = (...actions) => Object.fromEntries(actions.map(item=>[item.opId,{actor:context.actor}]));
const ids = strokes => strokes.map(item=>item.id);

test('pending handwriting remains beside concurrent saved ink without mutating the snapshot or queue', () => {
  const saved=[stroke('mine'),stroke('teacher','teacher')];
  const actions=[queuedStroke('operation','pending')];
  const before=JSON.stringify({saved,actions});
  const result=ink.project(saved,actions,previews(...actions),context);
  assert.deepEqual(ids(result),['mine','teacher','pending']);
  assert.equal(result[2].author,context.actor);
  assert.equal(JSON.stringify({saved,actions}),before);
  assert.notEqual(result,saved);
});

test('an acknowledged stroke is not doubled while its response is still in flight', () => {
  const actions=[queuedStroke('operation','pending')];
  const saved=[stroke('pending')];
  assert.deepEqual(ink.project(saved,actions,previews(...actions),context),saved);
  assert.deepEqual(ink.project(saved,[],{},context),saved);
});

test('preview requires the same workspace, board generation and current writer', () => {
  const actions=[
    queuedStroke('other-seat','other',{target:'pupil-b'}),
    queuedStroke('old-board','old',{assignmentId:'board-zero'}),
    queuedStroke('other-writer','foreign'),
    queuedStroke('own','mine')
  ];
  const metadata=previews(...actions);metadata['other-writer'].actor='teacher';
  assert.deepEqual(ids(ink.project([],actions,metadata,context)),['mine']);
  assert.deepEqual(ink.project([],actions,metadata,{...context,target:'pupil-b'}),[]);
});

test('payload cannot give a pending stroke another writer identity', () => {
  const pending=queuedStroke('operation','pending');pending.payload.author='teacher';
  assert.equal(ink.project([],[pending],previews(pending),context)[0].author,context.actor);
});

test('a pupil cannot project changes into the common board or another pupil workspace', () => {
  for (const target of ['common','pupil-b']) {
    const pending=queuedStroke('operation','pending',{target});
    assert.deepEqual(ink.project([],[pending],previews(pending),{...context,target}),[]);
  }
  const pending=queuedStroke('operation','pending',{target:'pupil-b'});
  assert.deepEqual(ids(ink.project([],[pending],{operation:{actor:'teacher'}},{...context,target:'pupil-b',actor:'teacher'})),['pending']);
});

test('an erase is immediate, idempotent and limited to the current writer', () => {
  const ownErase=action('erase-own','erase',{strokeId:'mine'});
  const foreignErase=action('erase-teacher','erase',{strokeId:'teacher'});
  const actions=[ownErase,foreignErase],metadata=previews(...actions);
  const saved=[stroke('mine'),stroke('teacher','teacher')];
  const result=ink.project(saved,actions,metadata,context);
  assert.deepEqual(ids(result),['teacher']);
  assert.deepEqual(ink.project(result,actions,metadata,context),result);
});

test('a pending stroke followed by its addressed eraser does not reappear', () => {
  const actions=[queuedStroke('draw','new'),action('erase','erase',{strokeId:'new'})];
  const saved=[stroke('old')];
  assert.deepEqual(ink.project(saved,actions,previews(...actions),context),saved);
  assert.deepEqual(ink.project(saved,actions.slice(1),previews(...actions),context),saved);
});

test('undo preview retains its exact original target across a lost acknowledgement', () => {
  const saved=[stroke('older'),stroke('newer'),stroke('teacher','teacher')];
  const undo=action('undo','undo',{});
  const metadata={undo:ink.preview('undo',saved,context.actor)};
  assert.equal(metadata.undo.strokeId,'newer');
  const result=ink.project(saved,[undo],metadata,context);
  assert.deepEqual(ids(result),['older','teacher']);
  assert.deepEqual(ink.project(result,[undo],metadata,context),result);
  assert.deepEqual(undo.payload,{});
});

test('preview metadata survives reload without adding fields to wire actions', () => {
  const saved=[stroke('old'),stroke('new')],actions=[action('undo','undo',{})];
  const persisted=JSON.parse(JSON.stringify({outbox:actions,inkPreviews:{undo:ink.preview('undo',saved,context.actor)}}));
  assert.deepEqual(ids(ink.project(saved,persisted.outbox,persisted.inkPreviews,context)),['old']);
  assert.deepEqual(Object.keys(persisted.outbox[0]).sort(),['assignmentId','opId','payload','target','type']);
});

test('legacy or foreign restored actions without matching preview provenance are not invented', () => {
  const saved=[stroke('old')],actions=[action('undo','undo',{}),queuedStroke('draw','pending')];
  assert.deepEqual(ink.project(saved,actions,{},context),saved);
  assert.deepEqual(ink.project(saved,actions,{undo:{actor:'teacher',strokeId:'old'},draw:{actor:'teacher'}},context),saved);
});

test('rejection removes only its local preview while canonical and other pending ink survive', () => {
  const saved=[stroke('old')],actions=[queuedStroke('reject','rejected'),queuedStroke('next','pending')];
  const metadata=previews(...actions);
  assert.deepEqual(ids(ink.project(saved,actions.slice(1),metadata,context)),['old','pending']);
  const rejectedErase=action('erase','erase',{strokeId:'old'});
  assert.deepEqual(ink.project(saved,[],previews(rejectedErase),context),saved);
});

test('empty or unrelated actions do not alter ink', () => {
  assert.deepEqual(ink.project(undefined,undefined,undefined,context),[]);
  const saved=[stroke('old')],unrelated=action('geometry','geometry',{state:{}});
  assert.deepEqual(ink.project(saved,[unrelated],previews(unrelated),context),saved);
  assert.equal(ink.preview('geometry',saved,context.actor),null);
  assert.deepEqual(ink.preview('undo',[],context.actor),{actor:context.actor,strokeId:null});
});
