'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// Load the actual editor and its local layout module. Browser tests separately
// measure visible drawing rectangles; this fixture exercises real model emits.
function fixture(t, width = 320) {
  const dom = new JSDOM(read('trainers/spacemath/index.html'), {
    url: 'https://workspace-fixture.invalid/trainers/spacemath/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.TextEncoder = TextEncoder;
  const media = { matches: width <= 700, addEventListener(_event, callback) { this.change = callback; } };
  w.matchMedia = () => media;
  w.JXG = { COORDS_BY_USER: 0, JSXGraph: {
    freeBoard() {},
    initBoard() {
      const handlers = new Map(); let box = [-8, 6, 8, -6];
      return {
        unitX: 50, unitY: 50, canvasWidth: 800, canvasHeight: 600,
        getBoundingBox: () => [...box],
        setBoundingBox(value) { box = [...value]; handlers.get('boundingbox')?.(); },
        setAttribute() {}, suspendUpdate() {}, unsuspendUpdate() {}, update() {}, fullUpdate() {},
        on(type, callback) { handlers.set(type, callback); },
        create(type, args, attrs) {
          return { type, args, attrs, on() {}, setAttribute() {}, setPosition() {},
            X: () => typeof args[0] === 'function' ? args[0]() : args[0],
            Y: () => typeof args[1] === 'function' ? args[1]() : args[1] };
        }
      };
    }
  }};
  for (const file of ['expression', 'model', 'constructions', 'app', 'workspace']) w.eval(read('trainers/spacemath/' + file + '.js'));
  const emissions = [];
  w.SpaceMathApp.subscribe(() => emissions.push(JSON.stringify(w.SpaceMathApp.getState())));
  const click = id => d.getElementById(id).click();
  const pressEscape = target => (target || d).dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  return { w, d, html: d.documentElement, click, emissions, pressEscape,
    resize(newWidth) { media.matches = newWidth <= 700; media.change?.({ matches: media.matches }); },
    snapshot: () => JSON.stringify(w.SpaceMathApp.getState()) };
}

test('compact layout exposes drawing first and panel/tool choices never create model writes', t => {
  const f = fixture(t), before = f.snapshot();
  assert.equal(f.d.getElementById('workspace-controls').hidden, false);
  assert.equal(f.html.dataset.workspaceTools, 'closed');
  assert.equal(f.html.dataset.workspaceObjects, 'closed');
  f.click('workspace-tools-toggle');
  assert.equal(f.html.dataset.workspaceTools, 'open');
  f.d.querySelector('[data-tool="segment"]').click();
  assert.equal(f.html.dataset.workspaceTools, 'closed');
  assert.equal(f.d.querySelector('[data-tool="segment"]').getAttribute('aria-pressed'), 'true', 'local folding keeps selected math tool');
  f.click('workspace-objects-toggle');
  assert.equal(f.html.dataset.workspaceObjects, 'open');
  assert.equal(f.d.getElementById('workspace-objects-toggle').textContent, 'К чертежу');
  f.click('workspace-objects-toggle');
  assert.equal(f.html.dataset.workspaceObjects, 'closed');
  assert.equal(f.snapshot(), before);
  assert.deepEqual(f.emissions, []);
});

test('an actual readonly editor can inspect, enter focus, and leave it by button or Escape without changing shared view', t => {
  const f = fixture(t), before = f.snapshot();
  f.w.SpaceMathApp.setReadOnly(true);
  for (const id of ['workspace-tools-toggle', 'workspace-objects-toggle', 'workspace-focus-toggle']) {
    assert.equal(f.d.getElementById(id).disabled, false, id + ' remains a local view control');
  }
  f.click('workspace-objects-toggle');
  f.click('workspace-focus-toggle');
  assert.equal(f.html.dataset.workspaceFocus, 'true');
  assert.equal(f.html.dataset.workspaceObjects, 'closed');
  assert.equal(f.d.getElementById('workspace-focus-toggle').textContent, 'Выйти');
  f.pressEscape(f.d.getElementById('point-x'));
  assert.equal(f.html.dataset.workspaceFocus, 'false');
  assert.equal(f.html.dataset.workspaceObjects, 'open', 'exit restores participant panel choice');
  f.click('workspace-focus-toggle'); f.click('workspace-focus-toggle');
  assert.equal(f.html.dataset.workspaceFocus, 'false');
  assert.equal(f.w.SpaceMathApp.getReadOnly(), true);
  assert.equal(f.snapshot(), before);
  assert.deepEqual(f.emissions, []);
});

test('width changes restore useful local defaults and keep shared geometry unchanged', t => {
  const f = fixture(t, 1280), before = f.snapshot();
  assert.equal(f.html.dataset.workspaceObjects, 'open');
  assert.equal(f.html.dataset.workspaceTools, 'open');
  f.resize(320);
  assert.equal(f.html.dataset.workspaceObjects, 'closed');
  assert.equal(f.html.dataset.workspaceTools, 'closed');
  f.click('workspace-focus-toggle'); f.resize(1280); f.click('workspace-focus-toggle');
  assert.equal(f.html.dataset.workspaceFocus, 'false');
  assert.equal(f.html.dataset.workspaceObjects, 'open');
  assert.equal(f.html.dataset.workspaceTools, 'open');
  assert.equal(f.snapshot(), before);
  assert.deepEqual(f.emissions, []);
});

test('Escape closes the compact panel, but does not intercept a model confirmation dialog', t => {
  const f = fixture(t);
  f.click('workspace-objects-toggle');
  f.pressEscape(f.d.getElementById('point-x'));
  assert.equal(f.html.dataset.workspaceObjects, 'closed');
  f.click('workspace-focus-toggle');
  f.d.getElementById('confirm-dialog').setAttribute('open', '');
  f.pressEscape();
  assert.equal(f.html.dataset.workspaceFocus, 'true', 'confirmation dialog owns Escape first');
  f.d.getElementById('confirm-dialog').removeAttribute('open');
  f.pressEscape();
  assert.equal(f.html.dataset.workspaceFocus, 'false');
  assert.deepEqual(f.emissions, []);
});

test('host focus requests are local and host navigation can restore the embedded layout', t => {
  const f=fixture(t),before=f.snapshot(),layout=[];
  f.w.addEventListener('mathexam:spacemath-layout',event=>layout.push(event.detail.focused));
  f.click('workspace-focus-toggle');
  assert.deepEqual(layout,[true]);
  f.click('workspace-tools-toggle');
  assert.deepEqual(layout,[true],'opening a local menu does not repeat a host request');
  f.w.dispatchEvent(new f.w.CustomEvent('mathexam:spacemath-exit-focus'));
  assert.equal(f.html.dataset.workspaceFocus,'false');
  assert.deepEqual(layout,[true,false]);
  assert.equal(f.snapshot(),before);
  assert.deepEqual(f.emissions,[]);
});

test('a late child focus rejected during failed navigation returns both layouts to normal without a journal write', async t => {
  const os=require('node:os'),{GroupLessonStore}=require('../board-server/group-lessons');
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'spacemath-focus-race-'));
  const store=new GroupLessonStore({directory});
  const created=store.create({title:'Synthetic focus race',names:['Test pupil']});
  const token=created.invites[0].studentToken,{entry,auth}=store.authorize(created.id,token);
  const dom=new JSDOM(read('trainers/group-board.html'),{
    url:'http://localhost/trainers/group-board.html#lesson='+created.id+'&token='+token+'&server=http%3A%2F%2Flocalhost',
    runScripts:'outside-only',pretendToBeVisual:true
  });
  t.after(()=>{dom.window.close();store.close();fs.rmSync(directory,{recursive:true,force:true});});
  const w=dom.window,d=w.document;
  w.ResizeObserver=class{observe(){}disconnect(){}};w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
  let geometry,holdSnapshot=false,rejectSnapshot,posts=0;
  w.GroupTrainerFrame=class{
    constructor(host,options){this.options=options;this.focused=false;this.state=options.state;this.element=d.createElement('div');host.append(this.element);if(options.trainerId==='spacemath')geometry=this;}
    update(options){if(options.state)this.state=options.state;}
    getState(){return holdSnapshot?new Promise((_resolve,reject)=>{rejectSnapshot=reject;}):Promise.resolve(this.state);}
    exitWorkspaceFocus(){if(this.focused){this.focused=false;this.options.onWorkspaceFocus?.(false);}}
    requestFocus(){this.focused=true;this.options.onWorkspaceFocus?.(true);}
    destroy(){this.exitWorkspaceFocus();this.element.remove();}
  };
  w.fetch=async(url,options={})=>{
    let data;
    if(url.endsWith('/status'))data=store.status();
    else if(options.method==='POST'){posts++;data=store.action(entry,auth,JSON.parse(options.body));}
    else data=store.snapshot(entry,auth);
    return {ok:true,status:200,json:async()=>w.JSON.parse(JSON.stringify(data))};
  };
  const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error('Focus race fixture timed out');};
  w.eval(read('trainers/group-board.js'));
  await wait(()=>!d.getElementById('app').hidden);
  d.getElementById('materialGeometry').click();await wait(()=>!!geometry);
  const before=JSON.stringify(store.snapshot(entry,auth)),revision=entry.lesson.revision;
  holdSnapshot=true;d.getElementById('materialBoard').click();await wait(()=>!!rejectSnapshot);
  geometry.requestFocus();
  assert.equal(d.body.dataset.geometryFocus,'false','host refuses focus during navigation');
  assert.equal(geometry.focused,false,'refusal also exits the child layout');
  rejectSnapshot(new Error('Synthetic snapshot failure'));holdSnapshot=false;
  await wait(()=>d.getElementById('errorNotice').textContent.includes('Synthetic snapshot failure'));
  assert.equal(d.getElementById('workspacePanels').dataset.surface,'geometry','failed navigation keeps the current material');
  assert.equal(geometry.focused,false);
  geometry.requestFocus();assert.equal(d.body.dataset.geometryFocus,'true','focus works again after navigation finishes');
  geometry.exitWorkspaceFocus();
  assert.equal(entry.lesson.revision,revision);assert.equal(posts,0);
  assert.equal(JSON.stringify(store.snapshot(entry,auth)),before);
});
