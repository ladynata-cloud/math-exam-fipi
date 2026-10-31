const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),vm=require('node:vm');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const examples={oneDigit:'147',zero:'201',remainder:'147',twoDigit:'24',decimalNatural:'4,2',appendZeros:'0,125',decimalDivisor:'3,2'};
for(const [level,answer] of Object.entries(examples)){
 const p=D.plan(D.make(level,0));assert.equal(p.quotient,answer);assert.equal(p.remainder,level==='remainder'?4:0);
 assert(p.actions.some(a=>a.kind==='product'));assert(p.actions.some(a=>a.kind==='subtract'));assert(p.actions.some(a=>a.kind==='bring'));assert(p.actions.some(a=>a.kind==='partial'));
 for(const a of p.actions)assert(D.check(a.answer,a),level+' '+a.kind);
}
const zero=D.plan(D.make('zero',0));assert(zero.cycles.some(c=>c.qd===0));assert(!D.check('',{kind:'digit',answer:'0'}));assert(!D.check('00',{kind:'digit',answer:'0'}));assert(D.check('0',{kind:'digit',answer:'0'}));
const appended=D.plan(D.make('appendZeros',0));assert.equal(appended.actions.filter(a=>a.kind==='comma').length,1);assert.equal(appended.actions.filter(a=>a.kind==='bring'&&a.appended).length,3);
assert(!D.check('0',{kind:'comma',answer:'0,'}));assert(D.check('0.',{kind:'comma',answer:'0,'}));
for(const raw of ['', '1e2','Infinity','NaN','-1','1/2','1+2','<script>'])assert.equal(D.equal(raw,'0'),false,raw);
assert(D.equal('1,20','1.2'));assert(!D.equal('1,2001','1,2'));assert.throws(()=>D.plan({level:'appendZeros',dividend:'1',divisor:'3'}));assert.throws(()=>D.plan({level:'oneDigit',dividend:'5',divisor:'0'}));
const carry=D.plan({level:'zero',dividend:'10005',divisor:'5'});assert.equal(carry.quotient,'2001');assert.equal(carry.cycles.filter(c=>c.qd===0).length,2);
const small=D.plan({level:'decimalDivisor',dividend:'0,084',divisor:'0,4'});assert.equal(small.normalizedDividend,'0,84');assert.equal(small.quotient,'0,21');
let count=0;for(const level of Object.keys(D.levels))for(let seed=0;seed<500;seed++){const p=D.plan(D.make(level,seed));assert(p.actions.length<150);for(const a of p.actions)assert(D.check(a.answer,a));count++;}
const state=D.blank(),task=D.make('zero',0),p=D.plan(task);state.session={task,mode:'check',step:3,errors:1,hints:0,reveals:0,repeated:false,input:'10'};
assert.deepEqual(D.validate(JSON.parse(JSON.stringify(state))),state);
for(const field of ['step','errors','hints','reveals']){const bad=structuredClone(state);bad.session[field]=-1;assert.throws(()=>D.validate(bad));}
let bad=structuredClone(state);bad.session.step=149;assert.throws(()=>D.validate(bad));bad=structuredClone(state);bad.session.task.level='unknown';assert.throws(()=>D.validate(bad));
state.records=[{...state.session,step:p.actions.length,input:'',errors:0,finishedAt:1000,independent:true}];assert.equal(D.validate(state).records[0].independent,true);
for(const field of ['errors','hints','reveals']){bad=structuredClone(state);bad.records[0][field]=1;assert.equal(D.validate(bad).records[0].independent,false);}
bad=structuredClone(state);bad.records[0].repeated=true;assert.equal(D.validate(bad).records[0].independent,false);
bad=structuredClone(state);bad.records=Array.from({length:1000},()=>({...state.records[0]}));assert.throws(()=>D.validate(bad));bad.session=null;assert.equal(D.validate(bad).records.length,1000);
const prefix='trainers/oge-basics/multiplication-division/';
const linked=['long-division-from-simple-to-decimals','long-division-one-digit','long-division-with-remainder','long-division-zero-in-quotient','long-division-two-digit','decimal-division-natural','division-append-zeros','decimal-divisor-shift','long-division-mixed-checkpoint'].map(s=>prefix+s+'.html').concat(['trainers/long-division-stepwise.html']);

// The original laboratory addition preserved these ten old entry pages. Later
// published changes deliberately migrated two entries to the guided runtime
// (#365/#377) and wrapped the eight legacy engines with the managed loader.
// Keep the historical mathematical source as the reference; only reverse the
// precise accepted wrapper/UI changes, rather than blessing a new page snapshot.
const root=path.resolve(__dirname,'..');
const legacyCommit='010e89c75c0fe110b57c983c728b8216fb38cd9d';
const decimalUICommit='c9bf66e2d95f48db0134d43cc590da89f8bc3053'; // Published PR #377.
const course=prefix+'long-division-from-simple-to-decimals.html';
const searchEntry='trainers/long-division-stepwise.html';
const decimalEntry=prefix+'decimal-divisor-shift.html';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const historical=(commit,file)=>cp.execFileSync('git',['-C',root,'show',commit+':'+file],{encoding:'utf8',maxBuffer:2*1024*1024});
const scripts=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map(m=>({attrs:m[1],body:m[2]}));
const sourcePath=(script,file)=>{
 const match=script.attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
 if(!match)return null;
 const url=new URL(match[1],'https://mathexam.space/'+file);
 assert.equal(url.origin,'https://mathexam.space',file+': runtime must remain local');
 assert(fs.statSync(path.join(root,url.pathname)).isFile(),file+': missing runtime '+url.pathname);
 return url.pathname;
};
const legacy=new Map(linked.map(file=>[file,historical(legacyCommit,file)]));
const originals=new Map([...legacy].map(([file,html])=>{
 const nodes=scripts(html);assert.equal(nodes.length,1,file+': historical extraction boundary');
 return [file,nodes[0].body];
}));
function unwrapManaged(body,file){
 const start='\nif (!window.MathExamRemediationManaged) {',end='\n\n}\n';
 assert(body.startsWith(start)&&body.endsWith(end),file+': missing exact managed-engine guard');
 return '\n'+body.slice(start.length+1,-end.length)+'\n';
}
function block(body,start,end,file){
 const a=body.indexOf('\nfunction '+start+'('),b=body.indexOf('\nfunction '+end+'(',a+1);
 assert(a>=0&&b>a,file+': missing accepted function boundaries '+start+'/'+end);
 return body.slice(a,b);
}
const acceptedDecimal=scripts(historical(decimalUICommit,decimalEntry)).find(s=>s.body.trim()).body;
function restoredDecimal(body){
 // #377 changed presentation and contextual hints, not the generator, answer
 // checker, teaching bank, saved progress or completion accounting.
 for(const [newStart,oldStart,end] of [
  ['renderNormalization','renderPractice','renderInputForPhase'],
  ['currentHint','showHint','startCheck']
 ]){
  const current=block(body,newStart,end,decimalEntry);
  assert.equal(current,block(acceptedDecimal,newStart,end,decimalEntry),decimalEntry+': unreviewed '+newStart+' change');
  body=body.replace(current,()=>block(originals.get(decimalEntry),oldStart,end,decimalEntry));
 }
 return body;
}
function checkManaged(file,html){
 const nodes=scripts(html);
 assert.equal(nodes.length,2,file+': exactly the loader and guarded legacy engine');
 assert.equal(sourcePath(nodes[0],file),'/trainers/oge-basics/learning-loader.js',file+': managed loader');
 assert.equal(nodes[0].body.trim(),'');
 assert(!/\b(?:async|defer)(?:\s|=|$)/i.test(nodes[0].attrs),file+': loader must establish the guard before inline code');
 assert.equal(nodes[1].attrs.trim(),'',file+': legacy fallback must remain an ordinary guarded script');
 new vm.Script(nodes[1].body,{filename:file});
 let body=unwrapManaged(nodes[1].body,file);
 if(file===decimalEntry)body=restoredDecimal(body);
 assert.equal(body,originals.get(file),file+': historical mathematical engine and teaching bank changed');
 assert(/<a\b[^>]*\bhref=["']division-lab\.html(?:#[^"']*)?["']/i.test(html),file+': laboratory route removed');
}
const base='/'+prefix;
const guidedSources={
 [course]:['/trainers/oge-basics/learning-loader.js',base+'division-lab-core.js',base+'division-guided-core.js','/trainers/oge-basics/arithmetic-route.js',base+'decimal-shift.js',base+'multiplication-refresh.js',base+'division-guided.js','/trainers/oge-basics/navigation-minimal.js'],
 [searchEntry]:[base+'division-lab-core.js',base+'division-guided-core.js','/trainers/oge-basics/arithmetic-route.js','/trainers/long-division-entry.js',base+'decimal-shift.js',base+'multiplication-refresh.js','/trainers/oge-basics/basics-help.js',base+'division-guided.js','/trainers/oge-basics/navigation-minimal.js']
};
function checkGuided(file,html){
 const nodes=scripts(html),expected=guidedSources[file],hasBank=file===course;
 assert.equal(nodes.length,expected.length+Number(hasBank),file+': unexpected active or missing script');
 assert.deepEqual(nodes.slice(0,expected.length).map(node=>sourcePath(node,file)),expected,file+': ordered guided runtime dependencies');
 for(const [i,node] of nodes.slice(0,expected.length).entries()){
  assert.equal(node.body.trim(),'');
  assert(!/\basync(?:\s|=|$)/i.test(node.attrs),file+': dependency order must not race');
  assert.equal(/\bdefer(?:\s|=|$)/i.test(node.attrs),expected[i]!=='/trainers/oge-basics/learning-loader.js',file+': dependency execution order');
 }
 if(hasBank){
  const bank=nodes.at(-1);
  assert.match(bank.attrs,/\btype="text\/plain"/i,file+': teaching extraction must not execute the old UI');
  assert.match(bank.attrs,/\bid="managed-teaching-source"/i,file+': managed teaching extraction id');
  const old=originals.get(file),boundary=old.indexOf('\nlet state=');
  assert(boundary>0,file+': historical teaching/generator boundary');
  assert.equal(bank.body,old.slice(0,boundary)+'\nlet state=null; // Extraction boundary: public UI lives in division-guided.js.\n})();\n',file+': retained historical teaching bank and generator changed');
  new vm.Script(bank.body,{filename:file});
 }
}
for(const file of linked){
 if(guidedSources[file])checkGuided(file,read(file));
 else checkManaged(file,read(file));
}

// Exercise the protection itself: a new runtime contract must still reject
// mathematical edits, a missing guard, broken dependencies and active old code.
let mutations=0;
function rejects(file,from,to,reason){
 const html=read(file);assert(html.includes(from),'mutation fixture missing: '+reason);
 assert.throws(()=>guidedSources[file]?checkGuided(file,html.replace(from,to)):checkManaged(file,html.replace(from,to)),reason);
 mutations++;
}
const oneDigit=prefix+'long-division-one-digit.html';
rejects(oneDigit,'Math.floor(cur/d)','Math.ceil(cur/d)','reject changed mathematical generator');
rejects(oneDigit,'"answer": "147"','"answer": "148"','reject changed teaching answer');
rejects(oneDigit,'!window.MathExamRemediationManaged','window.MathExamRemediationManaged','reject inverted managed guard');
rejects(oneDigit,'../learning-loader.js','../missing-loader.js','reject missing managed loader');
rejects(oneDigit,'</body>','<script>window.unexpected=true;</script></body>','reject extra executable code');
rejects(decimalEntry,"const preparing=['shiftCount'","const preparing=['wrongPhase'",'reject unapproved normalization UI delta');
rejects(decimalEntry,'factor=pow10(t.shift),places','factor=pow10(t.shift+1),places','reject wrong decimal hint factor');
rejects(decimalEntry,'Math.floor(cur/d)','Math.ceil(cur/d)','reject decimal generator changes outside the approved UI delta');
rejects(course,'"answer": "147"','"answer": "148"','reject changed retained course bank');
rejects(course,'type="text/plain"','type="text/javascript"','reject reactivated legacy teaching source');
rejects(course,'division-guided-core.js','division-lab-core.js','reject missing guided core or duplicate dependency');
rejects(searchEntry,'/trainers/long-division-entry.js','/trainers/oge-basics/arithmetic-route.js','reject removed public entry adapter');
rejects(searchEntry,'defer></script>','async></script>','reject unordered runtime loading');
for(const file of [course,searchEntry]){assert.throws(()=>checkGuided(file,legacy.get(file)),file+': reject restoration of obsolete UI');mutations++;}
console.log(count+' generated plans, edge cases, exact input, state validation, evidence flags; 8 guarded legacy engines, 2 guided entries, retained historical teaching/math and '+mutations+' negative controls: PASS');
