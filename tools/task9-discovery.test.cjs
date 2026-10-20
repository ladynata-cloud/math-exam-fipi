'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
async function boot(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(path.resolve(__dirname,'../trainers/oge-task9-equations.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-task9-equations.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));assert.deepEqual(errors,[]);
 assert.equal(dom.window.eval('typeof makeEquationDiscovery'),'function','discovery fragment is integrated');return dom;
}
const snap=v=>JSON.stringify(v,(_k,x)=>typeof x==='bigint'?String(x):x);
function mount(w,expression){const t=w.eval(expression),counts={used:0,shown:0},node=w.makeEquationDiscovery(t,{onUse(){counts.used++;},onShow(){counts.shown++;}});w.document.body.appendChild(node);return{node,counts,t};}
function act(m,name,index=0){const b=m.node.querySelectorAll('[data-discovery-action="'+name+'"]')[index];assert.ok(b,name+' '+index);b.click();return b;}
function input(m,name,value){const el=m.node.querySelector('[data-discovery-input="'+name+'"]');assert.ok(el,name);el.value=String(value);return el;}
const status=m=>m.node.querySelector('[data-discovery-status]');

test('every non-linear family in the real bank and seeded generators has an optional task-specific model, without construction credit',async()=>{
 const dom=await boot();try{const w=dom.window,data=w.eval('(()=>{RNG=mkRng(20261021);const generated=[];for(const gid of Object.keys(GENS))for(let i=0;i<20;i++)generated.push(genTask(gid));return [...BANK,...generated];})()'),progress=w.localStorage.getItem('mathExamCourseProgress.v1'),families=new Set();
 for(const t of data){const before=snap(t),counter={used:0,shown:0},node=w.makeEquationDiscovery(t,{onUse(){counter.used++;},onShow(){counter.shown++;}});assert.equal(snap(t),before);assert.deepEqual(counter,{used:0,shown:0});if(t.fam==='L'){assert.equal(node,null);continue;}families.add(t.fam);assert.equal(node.tagName,'DETAILS');assert.equal(node.open,false);assert.equal(node.dataset.discoveryFamily,t.fam);assert.ok(node.dataset.discoveryKind);assert.ok(node.querySelector('summary'));assert.ok(node.querySelector('button'));assert.equal(node.querySelector('input:not([data-discovery-input])'),null);}
 assert.equal(families.size,15);assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),progress);
 }finally{dom.window.close();}
});

test('distribution and square tiles retain every signed original factor, including reversed binomials',async()=>{
 const dom=await boot();try{const w=dom.window,m=mount(w,"({fam:'LB',p:{Lt:[{br:{k:F(-2,3),inner:[T(-3,1),T(4)]}}],Rt:[T(8)]}})");assert.equal(m.node.querySelectorAll('[data-discovery-action=distribute]').length,2);act(m,'distribute');assert.equal(m.counts.used,1);assert.equal(m.counts.shown,0);act(m,'distribute',1);assert.equal(m.node.querySelectorAll('[aria-pressed=true]').length,2);assert.match(m.node.querySelector('.discovery-bracket').textContent,/−3x/);assert.ok(m.node.querySelector('.discovery-bracket .frac'));assert.match(status(m).textContent,/каждое слагаемое/);
 const sq=mount(w,"({fam:'LSQ',p:{Lt:[{sq:{s:F(3),rev:true}}],Rt:[{sq:{s:F(-4)}}]}})");const groups=sq.node.querySelectorAll('.discovery-square');assert.equal(groups.length,2);for(let i=0;i<8;i++)act(sq,'square-product',i);assert.equal(sq.counts.used,8);assert.equal(sq.counts.shown,0);assert.equal(sq.node.querySelectorAll('[aria-pressed=true]').length,8);assert.match(groups[0].textContent,/−x/);assert.match(groups[1].textContent,/−4/);assert.match(status(sq).textContent,/Два смешанных/);
 }finally{dom.window.close();}
});

test('common multiplier checks all original denominators and reminds about integer terms',async()=>{
 const dom=await boot();try{const m=mount(dom.window,"({fam:'LF',p:{Lt:[{fr:{top:[T(1,1)],bot:2}},{fr:{top:[T(2,1)],bot:3}},T(7)],Rt:[{fr:{top:[T(1)],bot:5}}],dens:[2,3,5]}})");for(const x of ['0','-30','1.5']){input(m,'multiplier',x);act(m,'check-multiplier');assert.match(status(m).textContent,/положительное целое/);}input(m,'multiplier','6');act(m,'check-multiplier');assert.equal(status(m).dataset.valid,'false');assert.match(status(m).textContent,/6 : 5 — не подходит/);input(m,'multiplier','30');act(m,'check-multiplier');assert.equal(status(m).dataset.valid,'true');assert.match(status(m).textContent,/каждое слагаемое обеих частей.*целые числа тоже/);assert.equal(m.counts.shown,0);
 }finally{dom.window.close();}
});

test('proportions reject adjacent corners and reveal the exact two diagonal products only after both pairs',async()=>{
 const dom=await boot();try{const m=mount(dom.window,"({fam:'PROP',p:{ln:[T(7)],ld:[T(1,1),T(-3)],rn:[T(2)],rd:null}})");act(m,'cross-corner',0);act(m,'cross-corner',1);assert.match(status(m).textContent,/Нужна диагональ/);assert.equal(m.counts.shown,0);act(m,'cross-corner',2);assert.equal(m.counts.shown,0);act(m,'cross-corner',0);act(m,'cross-corner',3);assert.equal(m.counts.shown,1);assert.match(status(m).textContent,/\(7\) · \(1\) = \(2\) · \(x − 3\)/);assert.match(status(m).textContent,/знаменатели.*не должны равняться нулю/);assert.equal(m.node.querySelectorAll('.discovery-proportion>.frac').length,2);
 }finally{dom.window.close();}
});

test('square trials keep both signs and evaluate the original nonunit coefficient; target reveal is marked shown',async()=>{
 const dom=await boot();try{const m=mount(dom.window,"({fam:'QNB',p:{Lt:[T(F(-1,3),2),T(12)],Rt:[T(0)]}})");input(m,'square-x','3');act(m,'check-square');assert.equal(status(m).dataset.matches,'false');assert.match(status(m).textContent,/\(3\)² = 9.*\(−3\)² = 9/);input(m,'square-x','-6');act(m,'check-square');assert.equal(status(m).dataset.matches,'true');assert.match(status(m).textContent,/\(−6\)² = 36.*\(6\)² = 36/);assert.equal(m.counts.shown,0);act(m,'square-target');assert.equal(m.counts.shown,1);assert.match(status(m).textContent,/x² = 36/);assert.doesNotMatch(status(m).textContent,/x = [−-]?6/);
 }finally{dom.window.close();}
});

test('product zero keeps the zero-x case and treats factors as alternatives; factored answer reveal is explicit',async()=>{
 const dom=await boot();try{const w=dom.window,m=mount(w,"({fam:'QNCm',p:{Lt:[T(3,2)],Rt:[T(12,1)]}})");assert.equal(m.node.querySelector('[data-discovery-action=zero-factor]'),null);act(m,'show-factors');assert.equal(m.counts.shown,1);assert.equal(m.node.querySelectorAll('[data-discovery-action=zero-factor]').length,2);assert.match(m.node.querySelector('.discovery-factor-identity').textContent,/3x² − 12x = 0/);act(m,'zero-factor');assert.match(status(m).textContent,/x = 0/);assert.match(status(m).textContent,/оба одновременно.*не требуется/);act(m,'zero-factor',1);assert.match(status(m).textContent,/3x − 12 = 0/);assert.doesNotMatch(status(m).textContent,/x = 4/);
 const pair=mount(w,"({fam:'QP',p:{Lt:[{mul:[[T(-1,1),T(5)],[T(1,1),T(2)]]}],Rt:[T(0)]}})");assert.equal(pair.node.querySelectorAll('[data-discovery-action=zero-factor]').length,2);act(pair,'zero-factor');assert.match(status(pair).textContent,/−x \+ 5 = 0/);assert.equal(pair.counts.shown,0);
 }finally{dom.window.close();}
});

test('coefficient matching keeps signs and QR uses coefficients only after explicit left collection',async()=>{
 const dom=await boot();try{const w=dom.window,m=mount(w,"({fam:'QR',p:{Lt:[T(7,2),T(-3,1),T(5)],Rt:[T(2,2),T(6,1),T(-2)]}})");assert.equal(m.node.querySelector('.discovery-coefficients').hidden,true);assert.equal(m.counts.shown,0);act(m,'collect-coefficients');assert.equal(m.counts.shown,1);assert.equal(m.node.querySelector('.discovery-coefficients').hidden,false);const toks=[...m.node.querySelectorAll('[data-coefficient-token]')];assert.deepEqual(toks.map(b=>b.textContent),['5','−9','7']);act(m,'coefficient-token',1);act(m,'coefficient-slot');assert.equal(m.node.querySelector('[data-coefficient-slot=a]').dataset.matched,undefined);act(m,'coefficient-slot',1);assert.equal(m.node.querySelector('[data-coefficient-slot=b]').dataset.matched,'true');assert.equal(m.node.querySelector('[data-coefficient-slot=b]').textContent,'b = −9');
 const qf=mount(w,"({fam:'QF',p:{Lt:[T(-3,2),T(-4,1),T(7)],Rt:[T(0)]}})");assert.equal(qf.node.querySelector('.discovery-coefficients').hidden,false);assert.deepEqual([...qf.node.querySelectorAll('[data-coefficient-token]')].map(b=>b.textContent),['−3','−4','7']);assert.equal(qf.counts.shown,0);
 }finally{dom.window.close();}
});

test('original denominator trials reject every pole, including 0/0 cancellation, and accept exact nonpole fractions',async()=>{
 const dom=await boot();try{const cases=[['Z',"{c1:3,c2:-5}",[-3,5]],['NZ',"{qa:1,qb:-2,qc:1,dr:-1}",[1]],['XF',"{an:6,b:5}",[0]],['S2',"{a:13,b:12,c:12,d:13,k:2}",[12,13]],['SB',"{k:2,m:-3,n:2}",[2]]];
 for(const [fam,p,poles] of cases){const m=mount(dom.window,"({fam:"+JSON.stringify(fam)+",p:"+p+"})");assert.ok(m.node.querySelector('.frac'),fam+' original fractions retained');for(const x of poles){input(m,'denominator-x',x);act(m,'check-denominators');assert.equal(status(m).dataset.defined,'false',fam+' x='+x);assert.match(status(m).textContent,/не определено/);}input(m,'denominator-x','1/3');act(m,'check-denominators');assert.equal(status(m).dataset.defined,'true',fam);assert.ok(status(m).querySelector('.frac'),fam+' exact nonterminating fraction');if(fam!=='NZ')assert.match(status(m).textContent,/ещё не проверка равенства/);assert.equal(m.counts.shown,0);}
 }finally{dom.window.close();}
});


test('zero numerator alone is insufficient: a cancelled denominator remains forbidden',async()=>{
 const dom=await boot();try{const m=mount(dom.window,"({fam:'NZ',p:{qa:1,qb:-3,qc:2,dr:-1}})");
 input(m,'denominator-x','1');act(m,'check-denominators');assert.equal(status(m).dataset.defined,'false');assert.equal(status(m).dataset.fractionZero,'false');assert.match(status(m).textContent,/даже если числитель тоже равен нулю/);
 input(m,'denominator-x','2');act(m,'check-denominators');assert.equal(status(m).dataset.defined,'true');assert.equal(status(m).dataset.fractionZero,'true');assert.match(status(m).textContent,/дробь равна нулю/);assert.doesNotMatch(status(m).textContent,/ещё не проверка равенства/);
 input(m,'denominator-x','3');act(m,'check-denominators');assert.equal(status(m).dataset.fractionZero,'false');assert.match(status(m).textContent,/тоже не равна нулю/);assert.equal(m.counts.shown,0);
 }finally{dom.window.close();}
});
