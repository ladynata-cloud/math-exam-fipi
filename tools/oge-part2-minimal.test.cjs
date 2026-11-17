'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const {restoreSourceAlignment}=require('./oge-source-alignment-20-22.cjs');
const files={20:'oge-task20-equations.html',21:'oge-task21-word-problems.html',22:'oge-task22-functions-graphs.html'};
const html=n=>fs.readFileSync(path.join(__dirname,'../trainers',files[n]),'utf8');
function seeded(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
async function boot(n,{saved,blocked}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(html(n),{url:'https://example.test/trainers/'+files[n],runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.Math.random=seeded(901+n);w.__TESTHOOK__=true;if(saved)w.localStorage.setItem('oge21_prog',JSON.stringify(saved));if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('storage unavailable');}});}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 return {w:dom.window,d:dom.window.document,errors,close:()=>dom.window.close()};
}
function byText(root,txt){const b=[...root.querySelectorAll('button')].find(b=>b.textContent.trim()===txt);assert(b,'Missing button '+txt);return b;}
function visible(el){for(let n=el;n&&n.nodeType===1;n=n.parentElement){if(n.hidden||n.classList.contains('hidden')||n.style.display==='none')return false;if(n.tagName==='DETAILS'&&!n.open&&el!==n.querySelector('summary'))return false;}return true;}
function snapshot(el){return el.innerHTML;}
function fill22(ans,p){
   if(p.atoms){for(const a of p.atoms){byText(ans,a.type==='point'?'+ отдельное значение':'+ промежуток').click();const row=[...ans.querySelectorAll('.ab-row')].at(-1);if(a.type==='point')row.querySelector('.v-dec').value=a.v.toString();else{row.querySelectorAll('.v-dec')[0].value=a.lo.toString();row.querySelectorAll('.v-dec')[1].value=a.hi.toString();row.querySelectorAll('select')[0].value=a.loCl?'[':'(';row.querySelectorAll('select')[1].value=a.hiCl?']':')';}}}
   else p.vals.forEach((value,i)=>{if(i)byText(ans,'+ значение').click();ans.querySelectorAll('.v-dec')[i].value=value.toString();});
}
for(const n of [20,21,22])test('task '+n+': starts with a problem; help and navigation remain optional',async()=>{
 const t=await boot(n);try{
  assert.deepEqual(t.errors,[]);const settings=t.d.getElementById('courseSettings');assert(settings&&!settings.open);
  const hints=[...t.d.querySelectorAll('button')].filter(b=>b.textContent==='Хочешь подсказку?'&&visible(b));assert.equal(hints.length,1);
  const b=hints[0],panel=t.d.getElementById(b.getAttribute('aria-controls'));assert(panel.hidden);assert.equal(b.getAttribute('aria-expanded'),'false');
  assert.match(t.d.querySelector('.minimal-proof-note').textContent,/развёрнутое решение/i);
  const firstInput=[...t.d.querySelectorAll('input')].find(visible);if(firstInput)firstInput.value='123';
  const main=n===20?t.d.querySelector('#body .prompt'):n===21?t.d.querySelector('#content .problem'):t.d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"] .statement');
  const before=snapshot(main);b.click();assert(!panel.hidden);assert.equal(b.getAttribute('aria-expanded'),'true');assert.equal(snapshot(main),before);if(firstInput)assert.equal(firstInput.value,'123');
  b.click();assert(panel.hidden);b.click();assert(!panel.hidden);assert.equal(snapshot(main),before);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task20: every one of 14 types opens the current problem stepper and keeps it on hide/reopen',async()=>{
 const t=await boot(20);try{
  const api=t.w.__T20;assert.equal(api.ORDER.length,14);
  for(const key of api.ORDER){
   const seed=100+api.ORDER.indexOf(key);t.w.Math.random=seeded(seed);const engine=api.MODULES[key].engine(),data=engine.gen(),expected=engine.render(data).stepper(data).problemHTML;t.w.Math.random=seeded(seed);api.STATE.module=key;api.STATE.mode='drill';api.render();
   const main=t.d.querySelector('#body .prompt'),before=snapshot(main),btn=byText(t.d,'Хочешь подсказку?');
   btn.click();const panel=t.d.getElementById('task20Help');assert(panel.querySelector('.sstep'),key+' has first step');
   const text=panel.querySelector('.mathline').innerHTML;const normalized=t.d.createElement('div');normalized.innerHTML=expected;assert.equal(text,normalized.innerHTML,key+' help matches the same exercise');assert.equal(snapshot(main),before);
   const first=panel.querySelector('.sstep');btn.click();btn.click();assert.equal(panel.querySelector('.sstep'),first,key+' preserves state');
   byText(t.d,'Другая задача →').click();assert(t.d.getElementById('task20Help').hidden);assert.equal(t.d.querySelectorAll('#task20Help .sstep').length,0);
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task20: main answer survives help and correct checking advances only once',async()=>{
 const t=await boot(20);try{
  const api=t.w.__T20,seed=44;t.w.Math.random=seeded(seed);const p=api.MODULES.A.engine().gen();t.w.Math.random=seeded(seed);api.STATE.module='A';api.STATE.mode='drill';api.render();
  const input=t.d.querySelector('#body .qbox > div:not(.minimal-hint) .numin');assert(input);input.value=String(p.ans);
  byText(t.d,'Хочешь подсказку?').click();assert.equal(input.value,String(p.ans));
  const check=[...t.d.querySelectorAll('#body .qbox > .btns button')][0];check.click();assert(check.disabled);assert.equal(t.d.querySelector('.stat.solved b').textContent,'1');check.click();assert.equal(t.d.querySelector('.stat.solved b').textContent,'1');
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task21: all 13 types keep exact current data in optional help and leave saved counts intact',async()=>{
 const t=await boot(21,{saved:{t1:4,unrelated:3}});try{
  const before=t.w.localStorage.getItem('oge21_prog');assert.equal(t.w.__T.MODULES.length,13);
  for(let i=0;i<13;i++){
   t.d.querySelector('.chip[data-idx="'+i+'"]').click();const main=t.d.querySelector('#content .problem'),beforeHTML=snapshot(main),hint=byText(t.d,'Хочешь подсказку?');
   const input=t.d.querySelector('#content .card > div:not(.minimal-hint) .af input');input.value='123';hint.click();
   assert.equal(snapshot(main),beforeHTML);assert.equal(input.value,'123');assert(t.d.querySelector('#task21Help .stepcard'),String(i));assert(t.d.querySelector('#task21Help svg'),i+' visualization');
   const step=t.d.querySelector('#task21Help .stepcard');hint.click();hint.click();assert.equal(t.d.querySelector('#task21Help .stepcard'),step);assert.equal(t.w.localStorage.getItem('oge21_prog'),before);
   byText(t.d,'Другая задача →').click();assert(t.d.getElementById('task21Help').hidden);
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task21: 13 synthetic learners solve every type, and answers revealed never earn independent credit',async()=>{
 const t=await boot(21);try{
  for(let i=0;i<13;i++){
   const module=t.w.__T.MODULES[i],seed=108+i;t.w.Math.random=seeded(seed);const p=module.gen();t.w.Math.random=seeded(seed);t.d.querySelector('.chip[data-idx="'+i+'"]').click();
   const fields=[...t.d.querySelectorAll('#content .card > div:not(.minimal-hint) .af')],parts=module.finalParts(p);assert.equal(fields.length,parts.length);
   for(let j=0;j<fields.length;j++){const part=parts[j],answer=part.ans instanceof t.w.__T.Rn?part.ans:t.w.__T.Rn.from(part.ans);fields[j].querySelector('input').value=String(answer.toNumber());byText(fields[j],'Проверить').click();assert(fields[j].classList.contains('ok'),module.key+' part '+j);}
   assert.equal(t.w.__T.PROG[module.key],1);fields.forEach(f=>byText(f,'Проверить').click());assert.equal(t.w.__T.PROG[module.key],1);
   byText(t.d,'Другая задача →').click();byText(t.d,'Хочешь подсказку?').click();const details=t.d.querySelector('#task21Help details');details.open=true;
   [...details.querySelectorAll('button')].filter(b=>b.textContent==='Показать').forEach(b=>b.click());assert.equal(t.w.__T.PROG[module.key],1);
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task21: storage remains optional and print/theory/step modes still work',async()=>{
 const t=await boot(21,{blocked:true});try{
  for(const mode of ['learn','steps','drill']){t.d.querySelector('.mode[data-mode="'+mode+'"]').click();assert(t.d.getElementById('content').textContent.length>50);}
  t.d.getElementById('printBtn').click();assert(t.d.getElementById('printModal').classList.contains('open'));assert.equal(t.d.querySelectorAll('#pSheet .plist > li').length,10);t.d.getElementById('pClose').click();assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task22: three labs respond to sliders and optional steps retain the same generated problem',async()=>{
 const t=await boot(22);try{
  for(const nav of t.d.querySelectorAll('.mod-btn')){
   nav.click();const panel=t.d.querySelector('.panel:not(.hidden)'),host=panel.querySelector('.mode-host[data-mode="marathon"]'),problem=host.__problem;
   const hint=byText(host,'Хочешь подсказку?');hint.click();const help=t.d.getElementById(hint.getAttribute('aria-controls')),slider=help.querySelector('input[type=range]'),svg=help.querySelector('svg'),before=svg.innerHTML;
   slider.value=slider.max;slider.dispatchEvent(new t.w.Event('input'));assert.notEqual(svg.innerHTML,before);assert.equal(host.__problem,problem);
   byText(help,'Разобрать по шагам').click();const step=help.querySelector('.step-card');assert(step);assert.equal(step.parentElement.parentElement.__problem,problem);hint.click();hint.click();assert.equal(help.querySelector('.step-card'),step);
   byText(help,'Показать шаг').click();const retry=help.querySelector('.btn-retry');assert(!retry.classList.contains('hidden'));retry.click();assert(help.hidden);assert.notEqual(host.__problem,problem);assert.equal(help.querySelectorAll('.step-card').length,0);
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task22: answer builder still grades the full generated set and keeps shown answers distinct',async()=>{
 const t=await boot(22);try{
  for(const nav of t.d.querySelectorAll('.mod-btn')){
   nav.click();const panel=t.d.querySelector('.panel:not(.hidden)'),host=panel.querySelector('.mode-host[data-mode="marathon"]'),p=host.__problem,ans=host.querySelector('.ans-host');
   fill22(ans,p);
   byText(host,'Проверить').click();assert.match(host.querySelector(':scope > .fb').textContent,/Верно/);assert.equal(host.querySelector('.score b').textContent,'1');byText(host,'Проверить').click();assert.equal(host.querySelector('.score b').textContent,'1','Repeated checking is idempotent');
   byText(host,'Другая задача →').click();byText(host,'Хочешь подсказку?').click();const help=host.querySelector('.minimal-help');help.querySelector('details').open=true;byText(help,'Показать ответ').click();assert.match(host.querySelector(':scope > .fb').textContent,/Ответ/);assert.equal(host.querySelector('.score b').textContent,'1');
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

// Fingerprints below protect the original exact-arithmetic engines and problem banks.
// The redesign may change composition and presentation, never their generated mathematics.
const protectedRegions=[
 [20,'<script id="core-math">','</script>','ec76558e23da655f3af017d0b03e60765cd606345e4e424cc675c0aa57f4fa05'],
 // The captured 21 region also contains runAnim. Its only approved change is
 // the room-only synchronous final frame; the normalization assertion below
 // independently preserves every byte of the original generators and math.
 [21,'const MODULES=[];','/*__MODULES_INSERT__*/','71e19ecc87418e361f1d05d445b63a292952250aae9717f790135d855a04ffea'],
 [22,'function bgcd(a,b)','function numStr(x)','c4f37002378f6104bec3d9ffeec0f71cdbdd585f3a2fdc51b1705ed0b7faeaac'],
 [22,'// ---------- set equality (for grading) ----------','function piecewiseHtml(pieces)','ba67ae39d38f1c05d37bc2071e74da76e5793ea0163e72bcd18e6608324f7651']
];
test('exact math engines and complete generator bank are byte-identical to the published base',()=>{
 for(const [n,start,end,expected] of protectedRegions){const source=restoreSourceAlignment("trainers/"+files[n],html(n)),a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a);const actual=crypto.createHash('sha256').update(source.slice(a,b)).digest('hex');assert.equal(actual,expected,'task '+n+' '+start);if(n===21){const original=source.slice(a,b).replace('if(window.OgeCourseSharedMode||reduceMotion())','if(reduceMotion())');assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'5043b1bad2e441999f829b3cb2d57e39e830a966a7a7228a1cef2da5d82d8143','21: original bank and exact math stay unchanged');}}
});


test('task20: revealing a step cannot be laundered into an independent main answer',async()=>{
 const t=await boot(20);try{
  const api=t.w.__T20,seed=50;t.w.Math.random=seeded(seed);const p=api.MODULES.A.engine().gen();t.w.Math.random=seeded(seed);api.STATE.module='A';api.STATE.mode='drill';api.render();
  byText(t.d,'Хочешь подсказку?').click();const help=t.d.getElementById('task20Help');let turns=0;
  while(help.querySelector('.sstep.active')){const active=help.querySelector('.sstep.active'),show=[...active.querySelectorAll('button')].find(b=>b.textContent==='Показать шаг'||b.textContent.startsWith('Понятно'));assert(show);show.click();assert(++turns<20);}
  assert(help.querySelector('.stepfinal'));t.d.querySelector('#body .qbox > div:not(.minimal-hint) .numin').value=String(p.ans);t.d.querySelector('#body .qbox > .btns button').click();
  assert.equal(t.d.querySelector('.stat.solved b').textContent,'0');assert.match(t.d.querySelector('#body .qbox > .fb').textContent,/зачёт не начисляется/);assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task22: revealed helper steps stay marked through hide/reopen and final answer checking',async()=>{
 const t=await boot(22);try{
  for(const nav of t.d.querySelectorAll('.mod-btn')){
   nav.click();const host=t.d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"]'),p=host.__problem;
   const hint=byText(host,'Хочешь подсказку?');hint.click();const help=host.querySelector('.minimal-help');byText(help,'Разобрать по шагам').click();let turns=0;
   while(help.querySelector('.step-card.active')){byText(help.querySelector('.step-card.active'),'Показать шаг').click();await new Promise(r=>setTimeout(r,140));assert(++turns<20);}
   assert(help.querySelector('.all-done'));hint.click();hint.click();fill22(host.querySelector('.ans-host'),p);host.querySelector(':scope > .btn-row > .btn-check').click();
   assert.equal(host.querySelector('.score b').textContent,'0');assert.match(host.querySelector(':scope > .fb').textContent,/ответ был показан/);
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});


test('task22: full answer reveal is explicitly labelled when the learner later checks the correct main answer',async()=>{
 const t=await boot(22);try{
  for(const nav of t.d.querySelectorAll('.mod-btn')){
   nav.click();const host=t.d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"]'),problem=host.__problem;
   byText(host,'Хочешь подсказку?').click();const help=host.querySelector('.minimal-help');help.querySelector('details').open=true;
   byText(help,'Показать ответ').click();assert.match(host.querySelector(':scope > .fb').textContent,/Ответ:/);
   assert.equal(help.querySelectorAll('.step-card').length,0,'This path uses the full answer, not helper steps');
   fill22(host.querySelector('.ans-host'),problem);host.querySelector(':scope > .btn-row > .btn-check').click();
   assert.equal(host.querySelector(':scope > .fb').textContent,'Верно (ответ был показан).',nav.dataset.mod+' explicitly discloses prior answer reveal');
   assert.equal(host.querySelector('.score b').textContent,'0',nav.dataset.mod+' receives no independent credit');
  }
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});

test('task20 DR3 independently checks all three critical points, both allowed regions and mixed brackets',async()=>{
 const t=await boot(20);try{
  const {STATE,render,M,R}=t.w.__T20;
  for(let numerator=2;numerator<=7;numerator++)for(let gap=2;gap<=8;gap++){
   t.w.Math.random=(()=>{const values=[(numerator-2+.1)/6,(gap-2+.1)/7];return()=>values.shift()??.2;})();
   const row=M.gen.DR3();
   assert.equal(row.z,numerator);assert.equal(row.b,numerator+gap);
   const {z,b}=row;
   const f=x=>(x-z)/(x*(x-b));
   assert.deepEqual([-1,1,z+.5,b+1].map(x=>Math.sign(f(x))),[-1,1,-1,1]);
   assert(f(z)===0);
   assert([0,b].every(x=>x*(x-b)===0 && x-z!==0));
   const correct={first:'0',last:String(z),ray:String(b),left:'(',right:']',rayLeft:'('};
   const grade=R.DR3(row).check;
   assert.equal(grade(()=>correct).ok,true);
   for(const [key,value] of [['first',''],['last',String(b)],['ray','0'],['left','['],['right',')'],['rayLeft','[']]){
    assert.equal(grade(()=>({...correct,[key]:value})).ok,false,key);
   }
   t.w.Math.random=(()=>{const values=[(numerator-2+.1)/6,(gap-2+.1)/7,.75];return()=>values.shift()??.2;})();
   const second=M.gen.DR3();
   const comparator=x=>(x+z)*(x-b)/x;
   assert.deepEqual([-z-1,-1,1,b+1].map(x=>Math.sign(comparator(x))),[-1,1,-1,1]);
   assert(comparator(-z)===0&&comparator(b)===0);
   const gradeSecond=R.DR3(second).check;
   const exact={first:String(-z),last:'0',ray:String(b),left:'[',right:')',rayLeft:'['};
   assert.equal(gradeSecond(()=>exact).ok,true);
   assert.equal(gradeSecond(()=>({...exact,right:']'})).ok,false);
   assert.equal(gradeSecond(()=>correct).ok,false);
  }
  t.w.Math.random=()=>0;
  STATE.module='DR3';STATE.mode='drill';render();
  const card=t.d.querySelector('#body .qbox');
  const input=[...card.querySelectorAll(':scope > div:not(.minimal-hint) .numin')];
  const selects=[...card.querySelectorAll(':scope > div:not(.minimal-hint) select')];
  const check=card.querySelector(':scope > .btns .primary');
  byText(card,'Хочешь подсказку?').click();
  assert.match(card.querySelector('#task20Help .sstep').textContent,/ОДЗ/);
  input.forEach((node,i)=>node.value=['0','2','4'][i]);
  check.click();assert(!check.disabled);
  selects[1].value=']';check.click();assert(check.disabled);
 }finally{t.close();}
});

test('task21 resolves all transport profiles and dilution data by independently conserving time or mass',async()=>{
 const t=await boot(21);try{
  const modules=t.w.__T.MODULES;
  const ride=modules.find(row=>row.key==='t3');
  for(let vehicle=0;vehicle<2;vehicle++)for(let index=0;index<6;index++)for(const choice of [.1,.9]){
   const samples=[(vehicle+.1)/2,(index+.1)/6,choice];
   t.w.Math.random=()=>samples.shift()??.2;
   const p=ride.gen();
   const slow=p.x-p.d;
   assert(Number.isInteger(p.D)&&p.D>0);
   assert(p.x>slow&&slow>0);
   assert(Math.abs(p.D/slow-p.D/p.x-p.dt)<1e-10);
   assert(Math.abs(p.quad.a*p.x*p.x+p.quad.b*p.x+p.quad.c)<1e-10);
   assert.equal(p.finalParts[0].ans.toNumber(),choice<.5?p.x:slow);
   assert.match(p.stmt,vehicle===0?/велосипедиста/:/автомобиля/);
   assert(vehicle===0?p.x<=30&&slow>=14:p.x<=110&&slow>=50);
  }
  const dilution=modules.find(row=>row.key==='t12');
  for(let ratio=0;ratio<5;ratio++)for(let batch=0;batch<5;batch++)for(let scale=0;scale<4;scale++){
   const samples=[(ratio+.1)/5,(batch+.1)/5,(scale+.1)/4];
   t.w.Math.random=()=>samples.shift()??.2;
   const p=dilution.gen();
   assert(p.water>0&&p.oldPercent>p.newPercent&&p.oldPercent<=25);
   assert.equal((p.before+p.water)*p.newPercent,p.before*p.oldPercent);
   assert.equal(p.salt.toNumber(),p.before*p.oldPercent/100);
   assert.equal(dilution.steps(p).at(-1).ans.toNumber(), p.water);
   assert.match(p.stmt,/килограммов воды/);
  }
  const p=dilution.gen(),model=t.d.createElement('div');
  dilution.viz(model,p);
  const bars=model.querySelectorAll('rect');
  assert(+bars[0].getAttribute('width')<+bars[2].getAttribute('width'));
  assert.equal(bars[1].getAttribute('width'),bars[3].getAttribute('width'));
 }finally{t.close();}
});

test('task22 twice excluded nodes and exact no-intersection slopes belong to the displayed graph',async()=>{
 const t=await boot(22);try{
  const {genEvenHyperbola,graphSpec,statementHtml,stepPlan}=t.w.__api;
  for(let index=0;index<2;index++)for(let quarter=1;quarter<=4;quarter++){
   const samples=[(index+.1)/2,(quarter-1+.1)/4];
   t.w.Math.random=()=>samples.shift()??.2;
   const p=genEvenHyperbola(),g=graphSpec(p),k=p.c/p.hole**2;
   assert.deepEqual(Array.from(g.holes),[-p.hole,p.hole]);
   assert.deepEqual(Array.from(p.vals,k=>k.toNum()),[-k,0,k]);
   for(const slope of [-k,0,k])assert.equal(g.intersectK(slope).length,0);
   for(const slope of [-2*k,-k/2,k/2,2*k]){
    const xs=g.intersectK(slope);
    assert.equal(xs.length,1);
    assert(Math.sign(xs[0])===-Math.sign(slope));
    assert(Math.abs(slope*xs[0]-g.fn(xs[0]))<1e-10);
   }
   assert.match(statementHtml(p),/не имеет с графиком общих точек/);
   assert.equal(stepPlan(p).at(-1).answer,p.vals);
  }
  t.d.querySelector('.mod-btn[data-mod="m3"]').click();
  const host=t.d.querySelector('.panel[data-mod="m3"] .mode-host[data-mode="marathon"]');
  byText(host,'Две выколотые точки · y = kx').click();
  const p=host.__problem;
  assert.equal(p.sub,'even_kx_none');
  byText(host,'Хочешь подсказку?').click();
  assert.equal(host.querySelectorAll('svg .dot-open').length,2);
  const slider=host.querySelector('input[type="range"]');
  for(const [slope,expected] of [[p.vals[0].toNum(),0],[0,0],[p.vals[2].toNum(),0],[2,1]]){
   slider.value=String(slope);slider.dispatchEvent(new t.w.Event('input'));
   assert.equal(host.querySelector('.badge-t2').textContent,String(expected));
  }
  const ans=host.querySelector('.ans-host'),check=host.querySelector(':scope > .btn-row > .btn-check');
  fill22(ans,{vals:p.vals.slice(1)});check.click();assert(!check.disabled);
  byText(ans,'+ значение').click();
  ans.querySelectorAll('.v-dec')[2].value=p.vals[0].toString();check.click();
  assert(check.disabled);
 }finally{t.close();}
});

test('source alignment inverse preserves historical pins and rejects partial or foreign edits',()=>{
 for(const file of Object.values(files).map(name=>'trainers/'+name)){
  const {pages}=require('./fixtures/oge-source-alignment-20-22.json');
  const raw=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  const base=restoreSourceAlignment(file,raw);
  assert.notEqual(base,raw);
  for(const {after} of pages[file]){
   const edited=raw.replace(after,after.replace(/\n/,'\n<!-- changed -->'));
   assert.notEqual(edited,raw);
   assert.equal(restoreSourceAlignment(file,edited),edited);
  }
  const extra=raw.replace('</body>','<!-- an unrelated change --></body>');
  assert.notEqual(restoreSourceAlignment(file,extra),base);
 }
});

test('task21 three counts preserve both comparisons and the exact total',async()=>{
 const t=await boot(21);try{
  const module=t.w.__T.MODULES.find(entry=>entry.key==='t13');
  for(let m=12;m<=26;m++)for(let factor=2;factor<=4;factor++)for(let extra=3;extra<=10;extra++){
   for(const compareSmall of [true,false]){
    const samples=[(m-12+.1)/15,(factor-2+.1)/3,(extra-3+.1)/8,compareSmall ? .1 : .8];
    t.w.Math.random=()=>samples.shift()??.2;
    const p=module.gen();
    assert.equal(p.medium,m);
    assert.equal(p.large,p.medium*factor);
    assert.equal(p.small,p.medium+extra);
    assert.equal((p.total-extra)/(factor+2),p.medium);
    const compare=compareSmall?p.small:p.medium;
    assert.equal(module.finalParts(p)[0].ans.toNumber(),p.large-compare);
    assert(p.large>compare);
    assert.match(p.stmt,compareSmall?/чем маленьких/:/чем средних/);
    assert.equal(module.steps(p).at(-1).ans.toNumber(),p.large-compare);
   }
  }
  const p=module.gen(),holder=t.d.createElement('div');
  module.viz(holder,p);
  assert.equal([...holder.querySelectorAll('svg text')].filter(label=>label.textContent==='x').length,p.factor+2);
  assert([...holder.querySelectorAll('svg text')].some(label=>label.textContent==='+'+p.extra));
 }finally{t.close();}
});

test('task22 shifted parabola excludes each point and handles coincident hole heights',async()=>{
 const t=await boot(22);try{
  const {genParabolaTwoHoles,Fr,countH,stepPlan}=t.w.__api;
  for(let vx=-2;vx<=2;vx++)for(let vy=-3;vy<=2;vy++)for(const fromLeft of [1,2])for(const fromRight of [1,2]){
   const samples=[(vx+2+.1)/5,(vy+3+.1)/6,(fromLeft-1+.1)/2,(fromRight-1+.1)/2];
   t.w.Math.random=()=>samples.shift()??.2;
   const p=genParabolaTwoHoles(),values=Array.from(p.vals,val=>val.toNum());
   assert.equal(p.left,vx-fromLeft);assert.equal(p.right,vx+fromRight);
   const exactlyOne=[];
   for(const m of [vy-1,vy,vy+1,vy+2,vy+3,vy+4,vy+5]){
    const delta=m-vy;
    const candidates=delta<0?[]:delta===0?[vx]:[vx-Math.sqrt(delta),vx+Math.sqrt(delta)];
    const actual=candidates.filter(x=>x!==p.left&&x!==p.right);
    assert.equal(countH(p.pieces,Fr(m)),actual.length);
    if(actual.length===1)exactlyOne.push(m);
   }
   assert.deepEqual(values,exactlyOne);
   assert.equal(stepPlan(p).at(-1).answer,p.vals);
  }
  t.d.querySelector('.mod-btn[data-mod="m3"]').click();
  const host=t.d.querySelector('.panel[data-mod="m3"] .mode-host[data-mode="marathon"]');
  const cases=[[[.1,.1,.1,.1],0],[[.1,.1,.1,.8],1]];
  for(const [samples,atHole] of cases){
   t.w.Math.random=()=>samples.shift()??.2;
   byText(host,'Парабола с двумя выколотыми точками').click();
   const p=host.__problem;
   assert.equal(p.sub,'parab_m_twoholes');
   byText(host,'Хочешь подсказку?').click();
   assert.equal(host.querySelectorAll('.grapher .dot-open').length,2);
   const slider=host.querySelector('input[type="range"]');
   for(const [level,count] of [[p.vertexY-1,0],[p.vertexY,1],[p.vertexY+1,atHole],[p.vertexY+2,2]]){
    slider.value=String(level);slider.dispatchEvent(new t.w.Event('input'));
    assert.equal(host.querySelector('.badge-t2').textContent,String(count));
   }
   const ans=host.querySelector('.ans-host'),check=host.querySelector(':scope > .btn-row > .btn-check');
   ans.querySelector('.v-dec').value=String(p.vertexY-1);
   check.click();assert(!check.disabled);
   fill22(ans,p);check.click();assert(check.disabled);
  }
 }finally{t.close();}
});
