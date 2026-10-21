'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const tire=require('../trainers/oge-1-5-trainers/tire-3d.js');
const root=path.resolve(__dirname,'..'),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('tire marking produces independent axial, radial and bead-seat dimensions',()=>{
 const a=tire.dimensions({B:195,p:60,d:15});assert.deepEqual(a,{B:195,p:60,d:15,H:117,dm:381,r:190.5,R:307.5,D:615});
 const wide=tire.dimensions({B:205,p:60,d:15}),high=tire.dimensions({B:195,p:65,d:15}),rim=tire.dimensions({B:195,p:60,d:16});
 near(wide.H-a.H,6);near(wide.D-a.D,12);near(high.H-a.H,9.75);near(high.D-a.D,19.5);near(rim.D-a.D,25.4);near(rim.H,a.H);near(rim.B,a.B);
 for(const invalid of [0,-10,NaN,Infinity])assert.throws(()=>tire.dimensions({B:invalid}));
});

test('mesh section width reaches the actual sidewall extrema, beyond the narrower tread',()=>{
 for(const B of [155,195,255,265])for(const p of [40,60,80])for(const d of [12,13,15,19]){
  const dim=tire.dimensions({B,p,d}),mesh=tire.buildMesh(dim),rubber=mesh.faces.filter(f=>f.material==='sidewall'||f.material==='tread').flatMap(f=>f.points),tread=mesh.faces.filter(f=>f.material==='tread').flatMap(f=>f.points);
  near(Math.max(...rubber.map(v=>v[2]))-Math.min(...rubber.map(v=>v[2])),B);
  near(Math.max(...rubber.map(v=>Math.hypot(v[0],v[1]))),dim.R);
  near(Math.min(...rubber.map(v=>Math.hypot(v[0],v[1]))),dim.r);
  near(Math.max(...tread.map(v=>v[2]))-Math.min(...tread.map(v=>v[2])),.8*B);
  const width=tire.measurement(dim,'width');near(distance(...width.points),B);near(width.points[0][0],width.points[1][0]);near(width.points[0][1],width.points[1][1]);
  width.points.forEach(endpoint=>assert.ok(rubber.some(v=>distance(v,endpoint)<1e-8),'width witness attaches to a real max-section vertex'));
  const h=tire.measurement(dim,'side');near(distance(...h.points),dim.H);near(h.points[0][2],h.points[1][2]);near(distance(...h.line),dim.H);near(h.line[0][1],h.line[1][1]);near(h.line[0][2],h.line[1][2]);
  near(distance(...tire.measurement(dim,'disk').line),25.4*d);near(distance(...tire.measurement(dim,'all').line),25.4*d+2*B*p/100);
 }
});

test('orthographic rotation preserves geometry and uses a common scale across dimensions',()=>{
 const dim=tire.dimensions(),width=tire.measurement(dim,'width');
 for(const view of [{yaw:-147,pitch:70},...Object.values(tire.presets)])for(const vertex of width.points)near(distance(tire.rotate(vertex,view),[0,0,0]),distance(vertex,[0,0,0]));
 const projectedLength=(points,view)=>distance(...points.map(p=>tire.project(p,view).slice(0,2)));
 near(projectedLength(width.line,tire.presets.front),0);
 near(projectedLength(width.line,tire.presets.tread),dim.B*tire.frame.scale);
 assert.ok(projectedLength(width.line,tire.presets.quarter)>dim.B*tire.frame.scale*.5);
 near(projectedLength(tire.measurement(dim,'side').line,tire.presets.front),dim.H*tire.frame.scale);
 const bigger=tire.dimensions({d:16});near(projectedLength(tire.measurement(bigger,'all').line,tire.presets.front)-projectedLength(tire.measurement(dim,'all').line,tire.presets.front),25.4*tire.frame.scale);
 const max=tire.dimensions({B:265,p:80,d:19});for(const view of [...Object.values(tire.presets),{yaw:-130,pitch:70},{yaw:70,pitch:-70}])for(const f of tire.buildMesh(max).faces)for(const v of f.points){const p=tire.project(v,view);assert.ok(p.every(Number.isFinite));assert.ok(p[0]>0&&p[0]<tire.frame.width&&p[1]>0&&p[1]<tire.frame.height,'largest mesh stays in frame');}
 for(let yaw=-180;yaw<=180;yaw+=5)for(let pitch=-70;pitch<=70;pitch+=5)for(const part of Object.keys(tire.parts))for(const endpoint of [...tire.measurement(max,part).line,...tire.measurement(max,part).points]){const [x,y]=tire.project(endpoint,{yaw,pitch});assert.ok(x>=4&&x<=tire.frame.width-4&&y>=4&&y<=tire.frame.height-4,part+' witnesses remain in the tire area at '+yaw+','+pitch);}
 for(const camera of [...Object.values(tire.presets),{yaw:-130,pitch:70},{yaw:70,pitch:-70}])for(const chosen of ['width','side','disk','all','radius','width,side,disk','width,side,disk,all,radius']){
  const layout=tire.drawingLayout(chosen),dom=new JSDOM('<svg>'+tire.renderSvg(max,camera,chosen)+'</svg>');try{
   const labels=[...dom.window.document.querySelectorAll('[data-tire-callout]')];assert.equal(labels.length,tire.selectedParts(chosen).length);
   let priorEnd=0;for(const label of labels){const box=label.querySelector('rect'),y=+box.getAttribute('y'),h=+box.getAttribute('height');assert.ok(y>=priorEnd,'callouts do not overlap');assert.ok(y+h<=layout.height,'callouts remain inside frame');priorEnd=y+h;assert.match(label.textContent,/мм/);assert.equal(label.querySelectorAll('path').length,2,'each full name stays attached by a leader');}
  }finally{dom.window.close();}
 }
});

class Local extends ResourceLoader{fetch(url){const u=new URL(url);if(u.origin!=='https://mathexam.space')return null;const f=path.join(root,u.pathname);return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
async function open(){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation|HTMLCanvasElement.prototype.getContext/.test(e.message))errors.push(e.message);});const dom=new JSDOM(fs.readFileSync(path.join(root,'trainers/oge-1-5-trainers/practice-1-5-tires.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-1-5-trainers/practice-1-5-tires.html',resources:new Local(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=()=>1;}});await new Promise(r=>dom.window.addEventListener('load',r));await new Promise(r=>setTimeout(r,20));return {dom,doc:dom.window.document,errors};}
const storage=w=>JSON.stringify(Object.keys(w.localStorage).sort().map(k=>[k,w.localStorage.getItem(k)]));
const set=(el,value)=>{el.value=value;el.dispatchEvent(new el.ownerDocument.defaultView.Event('input',{bubbles:true}));};

test('real tire help rotates, changes dimensions, explains edge-on width and preserves drafts without credit',async()=>{
 const c=await open(),{doc,dom}=c;try{
  doc.querySelector('#step-stepper [data-step="3"]').click();await new Promise(r=>setTimeout(r,20));
  const section=doc.querySelector('#section-3'),answer=section.querySelector('#t2-H input');answer.value='123,4';const before=storage(dom.window),toggle=section.querySelector('.pd-toggle');toggle.click();
  const panel=section.querySelector('.pd-panel');panel.querySelector('details').open=true;const stage=panel.querySelector('.t3d-stage'),part=panel.querySelector('[data-pd-key=part]');
  assert.equal(stage.dataset.yaw,'-38');assert.equal(stage.dataset.pitch,'-12');assert.equal(part.value,'width');assert.ok(stage.querySelectorAll('polygon').length>500);
  const original=stage.querySelector('svg').innerHTML;set(panel.querySelector('[data-pd-key=width]'),255);assert.notEqual(stage.querySelector('svg').innerHTML,original);assert.match(panel.querySelector('.pd-reading').textContent,/B = 255 мм/);assert.equal(panel.querySelector('select[aria-label="Показать размер"]'),null);
  for(const key of ['side','disk'])panel.querySelector('[data-tire-part='+key+']').click();assert.equal(part.value,'width,side,disk');assert.equal(stage.querySelectorAll('[data-tire-dimension]').length,3);assert.match(stage.textContent,/Ширина шины/);assert.match(stage.textContent,/Высота боковины/);assert.match(stage.textContent,/Диаметр диска/);
  set(part,'width');
  panel.querySelector('[data-tire-view=front]').click();assert.match(panel.querySelector('.t3d-view-note').textContent,/ширина скрыта/);
  panel.querySelector('[data-tire-view=tread]').click();assert.equal(stage.dataset.yaw,'90');
  stage.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));assert.equal(stage.dataset.yaw,'80');
  const pointer=(type,x,y)=>{const e=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:7,clientX:x,clientY:y,button:0});stage.dispatchEvent(e);};
  pointer('pointerdown',100,100);pointer('pointermove',140,120);pointer('pointerup',140,120);assert.equal(stage.dataset.yaw,'102');assert.equal(stage.dataset.pitch,'9');
  panel.querySelector('.pd-return').click();toggle.click();assert.equal(stage.dataset.yaw,'102');assert.equal(stage.dataset.pitch,'9');assert.equal(panel.querySelector('[data-pd-key=width]').value,'255');assert.equal(answer.value,'123,4');assert.equal(storage(dom.window),before);
  stage.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));assert.equal(stage.dataset.yaw,'-38');assert.equal(stage.dataset.pitch,'-12');assert.deepEqual(c.errors,[]);
 }finally{dom.window.close();}
});

test('rebuilding a helper restores rotation as well as its dimensions and selected measurement',async()=>{
 const c=await open(),{doc,dom}=c;try{
  const holder=doc.createElement('div'),prompt=doc.createElement('p');prompt.textContent='Проверка состояния модели';holder.append(prompt);doc.body.append(holder);const api=dom.window.PracticalDiscovery;api.attach(prompt,'tires','width-state',prompt.textContent);
  let panel=holder.querySelector('.pd-panel');holder.querySelector('.pd-toggle').click();panel.querySelector('details').open=true;set(panel.querySelector('[data-pd-key=width]'),245);set(panel.querySelector('[data-pd-key=part]'),'width,side,disk');set(panel.querySelector('[data-pd-key=tire-yaw]'),53);set(panel.querySelector('[data-pd-key=tire-pitch]'),24);
  holder.querySelector('.pm-context-hint').remove();delete prompt.dataset.pdAttached;api.attach(prompt,'tires','width-state',prompt.textContent);panel=holder.querySelector('.pd-panel');assert.equal(panel.hidden,false);assert.equal(panel.querySelector('[data-pd-key=width]').value,'245');assert.equal(panel.querySelector('[data-pd-key=part]').value,'width,side,disk');assert.deepEqual([...panel.querySelectorAll('[data-tire-part]:checked')].map(e=>e.value),['width','side','disk']);assert.equal(panel.querySelector('.t3d-stage').dataset.yaw,'53');assert.equal(panel.querySelector('.t3d-stage').dataset.pitch,'24');assert.deepEqual(c.errors,[]);
 }finally{dom.window.close();}
});

test('downloadable practical package contains the exact 3D helper and relative tire dependency',()=>{
 const {execFileSync}=require('node:child_process'),zip=path.join(root,'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip');
 const member=name=>execFileSync('unzip',['-p',zip,name],{encoding:'utf8',maxBuffer:4*1024*1024});
 assert.equal(member('tire-3d.js'),fs.readFileSync(path.join(root,'trainers/oge-1-5-trainers/tire-3d.js'),'utf8'));
 assert.equal(member('tire-3d-labels.css'),fs.readFileSync(path.join(root,'trainers/oge-1-5-trainers/tire-3d-labels.css'),'utf8'));
 assert.equal(member('practical-discovery.js'),fs.readFileSync(path.join(root,'trainers/oge-1-5-trainers/practical-discovery.js'),'utf8'));
 assert.equal(member('practical-minimal.css'),fs.readFileSync(path.join(root,'trainers/oge-1-5-trainers/practical-minimal.css'),'utf8'));
 assert.match(member('practice-1-5-tires.html'),/<script src="tire-3d\.js"><\/script>/);
 assert.doesNotMatch(member('tire-3d.js').replaceAll('http://www.w3.org/2000/svg',''),/https?:\/\//,'SVG namespace is not a network dependency; no CDN URL is present');
});
