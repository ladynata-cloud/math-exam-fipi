'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const ROOT=path.resolve(__dirname,'../..'),G=require(ROOT+'/geometry-course/assets/geometry.js'),course=require(ROOT+'/geometry-course/data/course.json');
function fixture(spec){const d=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=d.window,calls=[];w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,method)=>(...args)=>calls.push([method,...args]),set:()=>true});for(const f of ['geometry','lab'])w.eval(fs.readFileSync(ROOT+'/geometry-course/assets/'+f+'.js','utf8'));const el=w.document.querySelector('main'),events=[],v=w.GeoLab.mount(el,spec,e=>events.push(e.type));el.querySelector('canvas').getBoundingClientRect=()=>({left:0,top:0,width:640,height:420});const click=s=>el.querySelector(s).click(),tool=t=>click('[data-tool='+t+']'),point=id=>{const p=v.board.point(id);assert(p&&p.x>=0&&p.x<=640&&p.y>=0&&p.y<=420,id+' is visible');el.querySelector('canvas').dispatchEvent(new w.MouseEvent('pointerdown',{clientX:p.x,clientY:p.y,bubbles:true}));};return {d,w,el,v,events,click,tool,point,calls};}
function construct(f,goal){const {v,tool,point}=f,b=v.board;const make=(t,ids)=>{tool(t);ids.forEach(point);};switch(goal){case 'midpoint':make('midpoint',['A','B']);break;case 'median':make('midpoint',['A','B']);make('segment',['C',b.points.at(-1).id]);break;case 'altitude':case 'perpendicular':make('perpendicular',['C','A','B']);break;case 'parallel':make('parallel',['C','A','B']);break;case 'bisector':make('bisector',['A','C','B']);break;case 'reflection':make('reflection',['C','A','B']);break;case 'diagonal':make('segment',['A','C']);break;case 'midline':make('midpoint',['A','C']);const m=b.points.at(-1).id;make('midpoint',['B','C']);make('segment',[m,b.points.at(-1).id]);break;case 'perpbisector':make('circle',['A','B']);make('circle',['B','A']);tool('intersection');for(const o of b.objects.filter(o=>o.type==='circle')){f.el.querySelector('.object-select').value=o.id;f.click('[data-act=object]');}make('line',b.points.slice(-2).map(p=>p.id));break;case 'explore':return;default:throw Error(goal);}}
test('all 63 research scenes have actionable guidance and every named construction can be made by hand',()=>{for(const u of course.units){const f=fixture({figure:u.figure,goal:u.goal});try{assert(f.el.querySelector('.lab-mission').textContent.length>20,u.id);assert(f.el.querySelector('[data-act=undo]').disabled);construct(f,u.goal);if(u.goal!=='explore'){assert(f.v.board.goal(u.goal).ok,u.id);f.click('[data-act=goal]');assert.match(f.el.querySelector('.lab-feedback').textContent,/выполнено/);assert(!f.el.querySelector('[data-act=undo]').disabled);}if(u.goal==='perpbisector'||u.goal==='reflection')for(const p of f.v.board.points)assert(p.x>=0&&p.x<=640&&p.y>=0&&p.y<=420,u.id+' '+p.id+' visible');}finally{f.d.window.close();}}});
test('undo reverses selection before construction; duplicate picks and failed operations leave history intact',()=>{const f=fixture({figure:'segment',goal:'midpoint'});try{construct(f,'midpoint');const built=f.v.board.snapshot();f.tool('segment');f.point('A');f.point('A');assert.equal(f.v.board.snapshot(),built);f.click('[data-act=undo]');assert.equal(f.v.board.snapshot(),built);f.click('[data-act=undo]');assert.equal(f.v.board.points.length,2);assert(f.el.querySelector('[data-act=undo]').disabled);}finally{f.d.window.close();}const b=new G.Board(G.scene('triangle'));b.move('C',500,300);const before=b.snapshot();assert.throws(()=>b.make('perpendicular',['A','B','C']));assert.equal(b.snapshot(),before);assert.equal(b.history.length,0);});
test('reset, a drag and Ctrl+Z each restore exactly one prior action',()=>{const f=fixture({figure:'segment',goal:'midpoint'});try{construct(f,'midpoint');const built=f.v.board.snapshot();f.click('[data-act=reset]');assert.equal(f.v.board.points.length,2);f.click('[data-act=undo]');assert.equal(f.v.board.snapshot(),built);f.tool('move');f.point('A');const cv=f.el.querySelector('canvas');cv.dispatchEvent(new f.w.MouseEvent('pointerup'));assert.equal(f.v.board.history.length,1,'click without movement adds no undo step');f.point('A');cv.dispatchEvent(new f.w.MouseEvent('pointermove',{clientX:170,clientY:180}));cv.dispatchEvent(new f.w.MouseEvent('pointerup'));assert.notEqual(f.v.board.snapshot(),built);cv.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}));assert.equal(f.v.board.snapshot(),built);}finally{f.d.window.close();}});
test('perpendicular accepts C then baseline click and survives moving onto the baseline',()=>{const f=fixture({figure:'angle',goal:'perpendicular'});try{assert(f.v.board.object('AB'));f.tool('perpendicular');f.point('C');const a=f.v.board.point('A'),b=f.v.board.point('B');f.el.querySelector('canvas').dispatchEvent(new f.w.MouseEvent('pointerdown',{clientX:(a.x+b.x)/2,clientY:(a.y+b.y)/2}));assert(f.v.board.goal('perpendicular').ok);f.v.board.move('C',(a.x+b.x)/2,(a.y+b.y)/2);assert(f.v.board.goal('perpendicular').ok);const line=f.v.board.geometry(f.v.board.objects.at(-1));assert(Math.abs(G.dot(G.sub(line.q,line.p),G.sub(b,a)))<1e-6);f.v.redraw();assert.match(f.el.querySelector('.lab-readout').textContent,/90.0°/);}finally{f.d.window.close();}const b=new G.Board(G.scene('triangle'));b.make('perpendicular',['A','A','B']);assert(b.geometry(b.objects.at(-1)));});
test('coincident lines are not parallel and empty coordinate fields do not move a point to zero',()=>{const b=new G.Board(G.scene('triangle'));b.make('parallel',['C','A','B']);assert(b.goal('parallel').ok);b.move('C',300,300);assert(!b.goal('parallel').ok);const f=fixture({figure:'segment',goal:'midpoint'});try{const before=f.v.board.snapshot();f.el.querySelector('.point-x').value='';f.click('[data-act=move]');assert.equal(f.v.board.snapshot(),before);assert.match(f.el.querySelector('.lab-feedback').textContent,/Пустое поле/);}finally{f.d.window.close();}});

test('canvas click focuses keyboard controls; a perpendicular through either baseline endpoint is constructible',()=>{
 for(const target of ['A','B']){const f=fixture({figure:'angle',goal:'perpendicular'});try{
  f.tool('perpendicular');f.point(target);
  assert.equal(f.w.document.activeElement,f.el.querySelector('canvas'),'pointer interaction focuses the canvas');
  const a=f.v.board.point('A'),b=f.v.board.point('B'),before=f.v.board.objects.length;
  f.el.querySelector('canvas').dispatchEvent(new f.w.MouseEvent('pointerdown',{clientX:(a.x+b.x)/2,clientY:(a.y+b.y)/2,bubbles:true}));
  assert.equal(f.v.board.objects.length,before+1,'through '+target+' via baseline click');
  const o=f.v.board.objects.at(-1),g=f.v.board.geometry(o);
  assert.equal(o.a,target);assert.equal(o.construction,'perpendicular');
  assert(Math.abs(G.dot(G.sub(g.q,g.p),G.sub(b,a)))<1e-6);
 }finally{f.d.window.close();}}
});
test('a perpendicular to another side cannot supply the AB right-angle readout',()=>{
 const f=fixture({figure:'angle',goal:'perpendicular'});try{
  f.v.board.make('perpendicular',['C','C','A']);f.v.redraw();
  assert(!f.v.board.goal('perpendicular').ok);
  assert(!f.el.querySelector('.lab-readout').textContent.includes('Угол с AB'));
  f.v.board.make('perpendicular',['C','A','B']);f.v.redraw();
  assert(f.v.board.goal('perpendicular').ok);
  assert.match(f.el.querySelector('.lab-readout').textContent,/Угол с AB = 90.0°/);
 }finally{f.d.window.close();}
});
test('restored off-canvas work keeps labels beside points and remains fitted after reset and undo',()=>{
 const f=fixture({figure:'triangle',goal:'reflection'});try{
  const old=new G.Board(G.scene('triangle')),id=old.make('reflection',['C','A','B'])[0];
  const saved=JSON.parse(old.snapshot());f.v.board.points=saved.points;f.v.board.objects=saved.objects;f.v.redraw();
  const p=f.v.board.point(id);assert(p.y>420,'pre-existing drawing reaches outside original viewport');
  let label=f.calls.filter(c=>c[0]==='fillText'&&c[1]===id).at(-1);
  assert.deepEqual(label.slice(2),[p.x+10,p.y-10],'label remains beside restored point in world coordinates');
  const fittedScale=f.calls.filter(c=>c[0]==='scale').at(-1).slice(1);
  assert(fittedScale[0]<1,'restore fits the outlying point');
  f.click('[data-act=reset]');f.click('[data-act=undo]');
  assert.equal(f.v.board.snapshot(),old.snapshot(),'undo restores old drawing without losing a point');
  assert.deepEqual(f.calls.filter(c=>c[0]==='scale').at(-1).slice(1),fittedScale,'undo also restores a fitting viewport');
  label=f.calls.filter(c=>c[0]==='fillText'&&c[1]===id).at(-1);
  assert.deepEqual(label.slice(2),[p.x+10,p.y-10]);
 }finally{f.d.window.close();}
});
