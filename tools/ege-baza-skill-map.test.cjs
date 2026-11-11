'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'ege-baza', name + '.js'), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
function bank() {
  const ctx = vm.createContext({localStorage:{setItem(){throw Error('unexpected write');},removeItem(){throw Error('unexpected delete');}}});
  for (const name of ['path/data','path/practice','path/equation-practice','skill-map-data']) vm.runInContext(read(name),ctx,{filename:name});
  return ctx;
}
function dom(names=['skill-map-data','skill-map']) {
  const instance = new JSDOM('<main id="host"><input id="draft" value="7/"></main>',{url:'https://mathexam.space/ege-baza/',runScripts:'outside-only',pretendToBeVisual:true});
  for (const name of names) instance.window.eval(read(name));
  return instance;
}
function internalLink(href) {
  const url = new URL(href,'https://mathexam.space');
  assert.equal(url.origin,'https://mathexam.space','course maps use internal links');
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  assert(file.startsWith(root+path.sep),'link stays in repository');
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  assert(fs.existsSync(file),'existing target '+href);
  return url;
}

test('each of the 116 actual EGE families has a specific, navigable skill route',()=>{
  const ctx=bank(),api=ctx.EgeBazaSkillMaps,meta=ctx.PathData.meta.filter(m=>!m.grade7&&!m.pre7),all=api.all();
  assert.equal(meta.length,116);assert.equal(all.length,meta.length);
  assert.deepEqual(plain(all.map(m=>m.id).sort()),plain(meta.map(m=>m.id).sort()));
  const skills=new Map();
  for(const family of meta){
    const map=api.forLesson(family.id);assert(map,family.id);
    assert.equal(map.id,family.id);assert.equal(map.pos,family.pos);assert.equal(map.title,family.title);
    assert.equal(typeof map.goal,'string');assert(map.goal.trim().length>8);
    assert(map.skills.length>=3&&map.skills.length<=8,family.id+' bounded useful route');
    assert.equal(new Set(map.skills.map(s=>s.id)).size,map.skills.length,family.id+' no repeated nodes');
    for(const skill of map.skills){
      assert(/^[a-z0-9][a-z0-9-]*$/.test(skill.id),'stable skill id');
      assert(skill.title.trim()&&skill.description.trim());
      assert(Array.isArray(skill.practiceIds));
      for(const id of skill.practiceIds)assert(api.forLesson(id),'focused practice exists: '+id);
      if(skills.has(skill.id))assert.deepEqual(plain(skill),skills.get(skill.id),'shared skill identity '+skill.id);
      else skills.set(skill.id,plain(skill));
    }
    for(const link of map.prerequisites||[])internalLink(link.href);
    for(const next of map.next||[]){
      assert(api.forLesson(next.id),'next family exists');const u=internalLink(next.href);
      assert.equal(new URLSearchParams(u.hash.slice(1)).get('lesson'),next.id);
    }
  }
  assert(skills.size>50,'skill maps distinguish real mathematical actions');
  assert.equal(api.forLesson('missing'),null);assert.equal(api.forLesson('grade7-a-expression-structure'),null);
});

test('all 21 positions and 22 early/section-specific routes refer to real preparation',()=>{
  const ctx=bank(),api=ctx.EgeBazaSkillMaps;
  for(let pos=1;pos<=21;pos++){
    const map=api.forPosition(pos);assert(map&&map.skills.length);
    const expected=ctx.PathData.meta.filter(m=>!m.grade7&&!m.pre7&&m.pos===pos).map(m=>m.id).sort();
    assert.deepEqual(plain(map.lessons.map(m=>typeof m==='string'?m:m.id).sort()),plain(expected));
    assert.equal(new Set(map.skills.map(s=>s.id)).size,map.skills.length);
  }
  for(const pos of [0,22,NaN,-1])assert.equal(api.forPosition(pos),null);
  const groups={m01:['decimal','division','rounding','percent','change','choice'],m02:['data','probability','graphs','logic'],
    'work-rate':['share','joint','gardens','delay','leave','reverse','ratio','crew','minimum'],algebra:['add','multiply','mixed']};
  for(const [module,ids]of Object.entries(groups))for(const id of ids){
    const map=api.forLegacy(module,id);assert(map&&map.skills.length>=3,module+':'+id);
    assert(map.pos>=1&&map.pos<=21);
    for(const skill of map.skills)for(const family of skill.practiceIds)assert(api.forLesson(family));
    for(const link of map.prerequisites||[])internalLink(link.href);
  }
  assert.equal(api.forLegacy('m01','absent'),null);assert.equal(api.forLegacy('absent','decimal'),null);
});

test('trigonometric ratios and glued surface evidence stay attached to the right mathematical action',()=>{
  const api=bank().EgeBazaSkillMaps,ratio=api.forLesson('practice-right-ratio');
  assert(ratio.skills.some(skill=>skill.id==='fraction-decimal'),'a ratio of lengths needs conversion to a decimal');
  assert(!ratio.skills.some(skill=>['fraction-division','reciprocal'].includes(skill.id)),'a ratio of lengths is not division by a fractional operand');
  const faces=api.forLesson('practice-faces').skills.find(skill=>skill.id==='face-count');
  assert(faces.practiceIds.includes('practice-faces'));
  assert(!faces.practiceIds.includes('practice-joined-surface'),'counting external square patches for area does not prove counting geometric faces');
});

test('viewing the route never writes progress or turns family evidence into mastery',()=>{
  const instance=dom(),w=instance.window;
  try{
    let writes=0;w.Storage.prototype.setItem=()=>{writes++;throw Error('write');};w.Storage.prototype.removeItem=()=>{writes++;throw Error('delete');};
    const map=w.EgeBazaSkillMaps.forLesson('round'),skill=map.skills.find(s=>s.practiceIds.length),target=skill.practiceIds[0];
    w.EgeBazaJourney={snapshot:()=>({lines:[{items:[{id:target,source:'path',status:'independent',independent:true}]}]})};
    const html=w.EgeBazaSkillMap.markup({lessonId:'round'});
    const host=w.document.getElementById('host');host.insertAdjacentHTML('beforeend',html);
    const evidence=host.querySelector('[data-skill-evidence="independent"]');
    assert(evidence);assert(evidence.textContent.includes(w.EgeBazaSkillMaps.forLesson(target).title));
    assert(!/навык освоен|готовность.*100|100.*готовность/i.test(host.textContent));
    w.EgeBazaJourney={snapshot:()=>({lines:[{items:[{id:target,source:'path',status:'guided',independent:false}]}]})};
    assert(w.EgeBazaSkillMap.markup({lessonId:'round'}).includes('data-skill-evidence="practice"'));
    w.EgeBazaJourney={snapshot:()=>({lines:[{items:[{id:target,source:'path',status:'unknown',independent:null}]}]})};
    assert(w.EgeBazaSkillMap.markup({lessonId:'round'}).includes('data-skill-evidence="unknown"'));
    assert.equal(writes,0);
  }finally{w.close();}
});

test('disclosing a task map marks help before submission while retaining answer DOM and drafts',async()=>{
  const instance=dom(),w=instance.window;
  try{
    const host=w.document.getElementById('host'),draft=w.document.getElementById('draft');
    let help=false,reveals=0,steps=0;
    const lesson={independent:0,guided:0,step:0,help:false};
    const controller=w.EgeBazaSkillMap.attach(host,{lessonId:'round',lesson,task:{steps:[{q:'one'},{q:'two'}]},onReveal:()=>{help=true;reveals++;lesson.help=true;},onSteps:()=>steps++});
    const element=host.querySelector('[data-ege-skill-map]');
    assert(element&&!element.open);assert.equal(help,false);
    element.querySelector('summary').click();
    assert.equal(help,true,'help is synchronous with disclosure');assert.equal(reveals,1);
    assert.strictEqual(w.document.getElementById('draft'),draft);assert.equal(draft.value,'7/');
    element.querySelector('[data-skill-steps]').click();assert.equal(steps,1);
    lesson.step=1;controller.refresh();
    assert.match(element.querySelector('[data-skill-step-count]').textContent,/1 из 2/);
    assert(element.querySelector('[data-skill-step-count]').textContent.includes('с помощью'));
    const same=element.querySelector('[data-skill-practice="round"]');
    if(same){same.click();assert.equal(steps,2,'same exercise opens existing guided controller');}
    assert.strictEqual(w.EgeBazaSkillMap.attach(host,{lessonId:'round'}),controller,'no duplicate route');
    assert.equal(host.querySelectorAll('[data-ege-skill-map]').length,1);
    element.open=false;element.open=true;await new Promise(resolve=>w.setTimeout(resolve,0));
    assert.equal(reveals,1,'toggle fallback does not double-count help');
    controller.dispose();controller.dispose();assert.equal(host.querySelectorAll('[data-ege-skill-map]').length,0);
    element.querySelector('summary').click();assert.equal(reveals,1,'detached controller no longer acts');
    assert.equal(w.EgeBazaSkillMap.attach(host,{lessonId:'missing'}).refresh(),undefined);
  }finally{w.close();}
});

test('programmatic opening is help too, and text/links cannot inject executable markup',async()=>{
  const instance=dom(),w=instance.window;
  try{
    let revealed=0;
    const host=w.document.getElementById('host'),controller=w.EgeBazaSkillMap.attach(host,{lessonId:'round',onReveal:()=>revealed++});
    host.querySelector('[data-ege-skill-map]').open=true;await new Promise(resolve=>w.setTimeout(resolve,0));
    assert.equal(revealed,1);controller.dispose();
    const bad={id:'bad',pos:1,title:'<img src=x onerror=alert(1)>',goal:'<script>bad()</script>',skills:[{id:'x',title:'<svg onload=bad()>',description:'<img src=x>',practiceIds:[]}],prerequisites:[{title:'Unsafe',href:'javascript:bad()'}]};
    w.EgeBazaSkillMaps={forLesson:()=>bad,forPosition:()=>bad};
    host.insertAdjacentHTML('beforeend',w.EgeBazaSkillMap.markup({lessonId:'bad'}));
    assert.equal(host.querySelectorAll('script,img,svg').length,0);
    assert(!Array.from(host.querySelectorAll('a')).some(a=>a.getAttribute('href').startsWith('javascript:')));
  }finally{w.close();}
});

function skyDOM(reduced=false,canvas=true) {
  const instance=dom([]),w=instance.window,host=w.document.getElementById('host');
  const frames=new Map(),observers=[],listeners=new Set();let seq=0,hidden=false,painted=0,disconnected=0;
  const media={matches:reduced,addEventListener(type,fn){listeners.add(fn);},removeEventListener(type,fn){listeners.delete(fn);}};
  w.matchMedia=()=>media;w.requestAnimationFrame=fn=>{frames.set(++seq,fn);return seq;};w.cancelAnimationFrame=id=>frames.delete(id);
  Object.defineProperty(w.document,'hidden',{get:()=>hidden,configurable:true});
  const gradient={addColorStop(){}},ctx={clearRect(){painted++;},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},stroke(){},quadraticCurveTo(){},setTransform(){},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}};
  if(canvas)w.CanvasRenderingContext2D=function(){};
  w.HTMLCanvasElement.prototype.getContext=()=>canvas?ctx:null;
  w.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){}disconnect(){disconnected++;}};
  w.IntersectionObserver=class{constructor(fn){this.fn=fn;observers.push(this);}observe(target){this.target=target;}disconnect(){disconnected++;}};
  w.eval(read('star-sky'));
  const tasks=Array.from({length:21},(_,i)=>({pos:i+1,title:'Тема '+(i+1),description:'Описание',total:5,started:0,independent:0,items:[]}));
  tasks[10].independent=1;tasks[10].started=1;tasks[12].independent=null;tasks[12].started=null;
  host.innerHTML=w.EgeBazaStarSky.markup(tasks);
  host.querySelector('.sky-chart').getBoundingClientRect=()=>({top:0,bottom:370,width:500,height:370});
  const cleanup=w.EgeBazaStarSky.mount(host,tasks);
  return {instance,w,host,tasks,cleanup,frames,media,listeners,get painted(){return painted;},get disconnected(){return disconnected;},
    visible(value){hidden=!value;w.document.dispatchEvent(new w.Event('visibilitychange'));},
    inView(value){for(const o of observers)o.fn([{target:o.target,isIntersecting:value}]);}};
}

test('star navigation includes all numbers, preserves unknown progress, and uses accessible native controls',()=>{
  const s=skyDOM(true);
  try{
    assert.equal(s.host.querySelectorAll('[data-star-position]').length,21);
    assert.equal(s.host.querySelectorAll('button[data-star-position]').length,21);
    assert(s.host.querySelector('[data-star-position="11"]').classList.contains('sky-point-independent'));
    assert(s.host.querySelector('[data-star-position="13"]').classList.contains('sky-point-unknown'));
    s.host.querySelector('[data-star-position="21"]').click();
    assert.equal(s.host.querySelector('[data-sky-open]').getAttribute('href'),'#task?pos=21');
    assert.equal(s.host.querySelector('[data-sky-skills]').getAttribute('href'),'#task?pos=21&skills=1');
    const last=s.host.querySelector('[data-star-position="21"]');
    last.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));
    assert.strictEqual(s.w.document.activeElement,s.host.querySelector('[data-star-position="1"]'));
    assert.equal(s.host.querySelectorAll('[data-star-position][aria-pressed="true"]').length,1);
    assert.equal(s.frames.size,0,'reduced motion starts stopped');
  }finally{s.cleanup();s.w.close();}
});

test('animation pauses outside the viewport and hidden tabs and releases all active work on disposal',()=>{
  const s=skyDOM(false);
  try{
    const sky=s.host.querySelector('.star-sky'),pause=s.host.querySelector('[data-sky-pause]');
    assert.equal(s.frames.size,1);assert.equal(sky.dataset.motion,'running');
    const [id,frame]=s.frames.entries().next().value;s.frames.delete(id);frame(100);
    assert.equal(s.frames.size,1,'one RAF chain only');
    pause.click();assert.equal(s.frames.size,0);assert.equal(sky.dataset.motion,'paused');
    s.visible(false);pause.click();assert.equal(s.frames.size,0,'unpausing a hidden tab does not run');
    s.visible(true);assert.equal(s.frames.size,1);
    s.inView(false);assert.equal(s.frames.size,0);
    s.inView(true);assert.equal(s.frames.size,1);
    s.cleanup();assert.equal(s.frames.size,0);assert.equal(s.listeners.size,0);assert.equal(s.disconnected,2);
    s.visible(true);s.inView(true);pause.click();assert.equal(s.frames.size,0,'disposed sky cannot restart');
    assert.equal(sky.dataset.motion,'paused');
  }finally{s.cleanup();s.w.close();}
});

test('static canvas fallback keeps all navigation working without an animation loop',()=>{
  const s=skyDOM(false,false);
  try{
    assert.equal(s.frames.size,0);assert(s.host.querySelector('[data-sky-pause]').hidden);
    s.host.querySelector('[data-star-position="17"]').click();
    assert.equal(s.host.querySelector('[data-sky-open]').getAttribute('href'),'#task?pos=17');
    assert.equal(s.w.EgeBazaStarSky.markup([]),'');
    const unsafe=s.w.EgeBazaStarSky.markup([{pos:1,title:'<img src=x>',description:'<script>bad()</script>',total:1,started:0,independent:0}]);
    const box=s.w.document.createElement('div');box.innerHTML=unsafe;assert.equal(box.querySelectorAll('img,script').length,0);
  }finally{s.cleanup();s.w.close();}
});
