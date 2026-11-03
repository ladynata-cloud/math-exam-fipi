'use strict';
// Independent prompt-derived arithmetic and persisted-work regression. No DOM,
// network, pupil data, generated fixtures or production writes are used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'trainers/maxim-peterson6');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const source=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>!/\bsrc=/.test(m[1]))[2];
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'equation-method.js'),'utf8'),context);
vm.runInNewContext(source,context);
const C=context.window.TrainerCore,E=context.window.PetersonEquationMethod;
const copy=x=>JSON.parse(JSON.stringify(x));
const close=(a,b,label)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);
let tick=0;
const now=()=>new Date(Date.UTC(2026,10,2)+1000*tick++).toISOString();
function finish(progress,module){let result;const session=progress.sessions[module],p=C.problemFor(session);while(session.index<p.steps.length){const step=p.steps[session.index];result=C.submitAnswer(progress,module,step.kind==='choice'?step.expected:C.formatNumber(step.expected),session.index,now());assert.ok(['correct','complete'].includes(result.status));}return result;}
function numbers(text){return (text.match(/\d+(?:[.,]\d+)?/g)||[]).map(x=>Number(x.replace(',','.')));}
function duration(text){return Number(text.match(/(\d+) ч/)?.[1]||0)+Number(text.match(/(\d+) мин/)?.[1]||0)/60;}
// A small arithmetic reader for test equations, deliberately without eval or
// Function. It supports only numeric literals, x/t, fractions and arithmetic.
function expression(text,vars){
 const normalized=text.replace(/\{\{frac:([^{}:]+):([^{}:]+)\}\}/g,'(($1)/($2))').replace(/(\d+)\s+(\d+)\/(\d+)/g,'($1+$2/$3)').replace(/,/g,'.').replace(/−/g,'-').replace(/·/g,'*').replace(/:/g,'/');
 const tokens=normalized.match(/\d+(?:\.\d*)?|\.\d+|[xt()+\-*/]/g)||[];
 assert.equal(tokens.join(''),normalized.replace(/\s/g,''),'Unsupported equation text: '+text);let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const n=sum();assert.equal(tokens[i++],')');return n;}if(t==='-')return-atom();if(t==='+')return atom();if(t==='x'||t==='t'){assert.ok(Object.hasOwn(vars,t));return vars[t];}assert.ok(t!==undefined&&Number.isFinite(Number(t)));return Number(t);}
 function product(){let n=atom();while(i<tokens.length&&tokens[i]!==')'&&tokens[i]!=='+'&&tokens[i]!=='-'){const op=tokens[i];if(op==='*'||op==='/'){i++;const v=atom();n=op==='*'?n*v:n/v;}else n*=atom();}return n;}
 function sum(){let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],v=product();n=op==='+'?n+v:n-v;}return n;}
 const n=sum();assert.equal(i,tokens.length);assert.ok(Number.isFinite(n));return n;
}
function equationHolds(text,vars){const sides=text.split('=').map(s=>expression(s,vars));return sides.every(v=>Math.abs(v-sides[0])<1e-8*Math.max(1,Math.abs(v),Math.abs(sides[0])));}
function oracle(p){
 const a=numbers(p.prompt);let x,answer,contexts;
 switch(p.module+'/'+p.type){
  case 'time/path':x=answer=a[0]*a[1];break;
  case 'time/speed':x=answer=a[0]/a[1];break;
  case 'time/duration':x=answer=a[0]/a[1];break;
  case 'meeting/meeting':x=a[0]/(a[1]+a[2]);answer=a[1]*x;break;
  case 'chase/catch':x=a[2]/(a[1]-a[0]);answer=60*x;break;
  case 'chase/lag':x=answer=a[2]+(a[0]-a[1])*a[3]/60;break;
  case 'ratio/ratio-meet':answer=a[0]*a[1]/(1+a[1]);contexts=[1,7,53].map(x=>({x,t:a[0]/((1+a[1])*x)}));break;
  case 'ratio/ratio-away':x=a[2]/((a[1]/60)*(1+a[0]));answer=x*a[0];break;
  case 'river/river-speeds':x=a[0]+a[1];answer=a[0]-a[1];break;
  case 'river/river-recover':x=(a[0]-a[1])/2;answer=(a[0]+a[1])/2;break;
  case 'river/raft':x=answer=a[0]*a[1]/60;break;
  case 'river/roundtrip':x=a[2]/(a[0]+a[1]);answer=x+a[2]/(a[0]-a[1]);break;
  case 'river/river-path-difference':x=a[2]/(2*a[1]);answer=a[0]/a[1]+x;break;
  case 'percent-tasks/part':x=answer=a[0]*a[1]/100;break;
  case 'percent-tasks/whole':x=answer=a[0]*100/a[1];break;
  case 'percent-tasks/relation':x=answer=a[1]*100/a[0];break;
  case 'percent-tasks/discount':x=a[0]*a[1]/100;answer=a[0]-x;break;
  case 'river-units/river-units-down':x=answer=a[0]+a[1]*60/1000;break;
  case 'river-units/river-units-up':x=a[0]*60/1000+a[1];answer=x+a[1];break;
  case 'river-percent/river-percent':x=a[0]/(a[1]*(1+a[2]/100));answer=x+a[0]/(a[1]*(1-a[2]/100));break;
  case 'raft-percent/raft-percent':x=a[0]*100/a[1];answer=a[2]/(x+a[0])+a[2]/(x-a[0]);break;
  case 'joint-work/joint-work':{const first=duration(p.prompt.match(/наполняется за ([^.]+)\./)[1]),together=duration(p.prompt.match(/он наполнится за ([^.]+)\./)[1]);x=1/together-1/first;answer=1/x;break;}
  default:throw Error('Missing independent oracle: '+p.module+'/'+p.type);
 }
 return {x,answer,contexts:contexts||[{x}]};
}

test('all 22 word families: independent prompt arithmetic and selected equations, including distractors',()=>{
 const families=new Set();let checked=0;
 for(const m of C.modules)for(const level of ['easy','standard'])for(let seed=0;seed<120;seed++){
  const p=C.generate(m.id,level,C.seededRandom(seed));if(!p.method)continue;
  families.add(m.id+'/'+p.type);checked++;const truth=oracle(p);
  close(p.methodInfo.answer,truth.answer,p.prompt);
  assert.ok(p.steps.length<=10);assert.equal(p.steps[0].kind==='choice'||p.steps[0].kind==='number',true);
  assert.doesNotMatch(p.steps.map(s=>s.label+' '+s.hint+' '+s.explanation).join(' '),/Сколько всего частей|Одна часть:|одинаковых частей|Путь второго — 1 часть/);
  const model=p.steps.find(s=>s.kind==='choice'&&s.options.some(o=>o[0]===s.expected&&o[1]===p.methodInfo.equation));assert.ok(model,p.prompt);
  for(const vars of truth.contexts)assert.equal(equationHolds(p.methodInfo.equation,vars),true,p.prompt+' :: '+p.methodInfo.equation);
  for(const [id,text]of model.options)if(id!==model.expected)assert.equal(truth.contexts.every(vars=>equationHolds(text,vars)),false,p.prompt+' :: equivalent distractor '+text);
  const solveStep=p.steps.find(s=>s.label.startsWith('Найди x.'));
  if(truth.x===undefined)assert.equal(solveStep,undefined);else{assert.ok(solveStep);close(solveStep.expected,truth.x,'unknown in '+p.prompt);}
 }
 assert.equal(families.size,22);assert.ok(checked>1800);console.log('Independent word cases:',checked,'families:',families.size);
});

test('13 unique source word problems keep conditions and have independently fixed final answers',()=>{
 const fixtures=[['river-units','223-1',17.2],['river-units','223-2',22.2],['river-percent','226',3.2],['raft-percent','245',12.5],['river','300',20],['meeting','303',210],['chase','304',40],['ratio','305',54],['joint-work','306',6],['percent-tasks','361-1',40000],['percent-tasks','369-1',25],['percent-tasks','369-2',28],['percent-tasks','406-1',22800]];
 for(const [module,id,answer]of fixtures){const p=C.textbookProblem(module,id),old=C.legacy.textbookProblem(module,id);assert.equal(p.prompt,old.prompt);assert.equal(p.source,old.source);close(p.methodInfo.answer,answer,module+'/'+id);const progress=C.freshProgress(now());C.beginSession(progress,module,'standard',{exampleId:id,seed:17},now());assert.equal(finish(progress,module).independent,true);assert.equal(C.moduleStats(progress,module).solved,1);assert.doesNotThrow(()=>C.validateProgress(copy(progress)));}
 const p=C.textbookProblem('meeting','303');assert.equal(p.diagram.v1,'1,2x');assert.equal(p.diagram.v2,'x');assert.equal(p.methodInfo.equation,'t = {{frac:385:2,2x}} = {{frac:175:x}}');assert.equal(p.steps.some(s=>s.label.startsWith('Найди x.')),false);
 assert.equal(C.textbookProblem('ratio','305').methodInfo.equation,'4/3 · (x + 3x) = 96');
});

test('preparation tasks and 13 percent conversions retain the exact legacy content',()=>{
 let checked=0;
 for(const m of C.modules)for(let seed=0;seed<100;seed++){const old=C.legacy.generate(m.id,'standard',C.seededRandom(seed)),p=C.generate(m.id,'standard',C.seededRandom(seed));if(!p.method){assert.equal(JSON.stringify(p),JSON.stringify(old));checked++;}}
 assert.ok(checked>=300);
 for(const module of ['percent-number','number-percent'])for(const [id]of C.samples[module])assert.equal(JSON.stringify(C.textbookProblem(module,id)),JSON.stringify(C.legacy.textbookProblem(module,id)));
});

test('version-1 unfinished draft, accepted steps, hints and history round-trip unchanged',()=>{
 const old=C.freshProgress(now(),1);C.beginSession(old,'ratio','standard',{exampleId:'303',seed:7,methodVersion:1},now());
 assert.equal(old.version,1);assert.equal(old.archivedSessions,undefined);
 assert.equal(C.submitAnswer(old,'ratio','yes',0,now()).status,'correct');C.toggleSessionHint(old,'ratio',now());old.sessions.ratio.answers[1]='2,';
 const serialized=JSON.stringify(old),checked=C.validateProgress(JSON.parse(serialized));assert.equal(JSON.stringify(checked),serialized);
 const oldSession=copy(old.sessions.ratio),oldProblem=copy(C.problemFor(oldSession));
 const current=C.startEquationSession(checked,'ratio',now());assert.equal(current.methodVersion,2);assert.equal(checked.version,2);assert.deepEqual(copy(checked.archivedSessions[0]),oldSession);assert.deepEqual(copy(C.problemFor(checked.archivedSessions[0])),oldProblem);
 assert.equal(checked.assistance.some(r=>r.methodVersion===2&&r.exposed),true);
 C.submitAnswer(checked,'ratio',C.problemFor(current).steps[0].expected,0,now());
 const newPartial=copy(current);C.resumeArchived(checked,0,now());assert.deepEqual(copy(checked.sessions.ratio),oldSession);assert.deepEqual(copy(checked.archivedSessions[0]),newPartial);
 const restored=C.validateProgress(copy(checked));assert.equal(JSON.stringify(restored),JSON.stringify(checked));assert.deepEqual(copy(C.startEquationSession(restored,'ratio',now()).answers),newPartial.answers);
 assert.equal(finish(restored,'ratio').independent,false);assert.equal(C.moduleStats(restored,'ratio').assisted,1);
 assert.equal(JSON.stringify(old),serialized,'The original saved snapshot is never edited by import or the new attempt');
});

test('legacy completed answers do not grant equation mastery or fresh independence on the same condition',()=>{
 const progress=C.freshProgress(now(),1);C.beginSession(progress,'ratio','standard',{exampleId:'305',methodVersion:1},now());assert.equal(finish(progress,'ratio').independent,true);
 const oldSolution=copy(progress.solutions[0]);assert.equal(C.moduleStats(progress,'ratio').solved,0);assert.equal(C.moduleStats(progress,'ratio').otherSolved,1);
 C.startEquationSession(progress,'ratio',now());assert.equal(finish(progress,'ratio').independent,false);assert.deepEqual(copy(progress.solutions[0]),oldSolution);
 assert.equal(C.moduleStats(progress,'ratio').independent,0);assert.equal(C.moduleStats(progress,'ratio').assisted,1);assert.equal(progress.solutions.length,2);
 assert.match(C.reportCSV(progress),/Ранее: по действиям/);assert.match(C.reportCSV(progress),/Через неизвестную/);assert.match(C.reportCSV(progress),/условие разбиралось ранее/);
 assert.doesNotThrow(()=>C.validateProgress(copy(progress)));
});

test('both 303 entrances, stale submits and repeated known conditions never double-credit',()=>{
 const progress=C.freshProgress(now());C.beginSession(progress,'meeting','standard',{exampleId:'303'},now());finish(progress,'meeting');
 const original=JSON.stringify(progress);assert.equal(C.submitAnswer(progress,'meeting','210',0,now()).status,'ignored');assert.equal(JSON.stringify(progress),original);
 C.beginSession(progress,'ratio','standard',{exampleId:'303'},now());assert.equal(finish(progress,'ratio').duplicate,true);assert.equal(progress.solutions.length,1);assert.equal(C.overallStats(progress).solved,1);
 assert.doesNotThrow(()=>C.validateProgress(copy(progress)));
 const legacy=C.freshProgress(now(),1);C.beginSession(legacy,'meeting','standard',{exampleId:'303',methodVersion:1},now());finish(legacy,'meeting');C.beginSession(legacy,'ratio','standard',{exampleId:'303'},now());assert.equal(finish(legacy,'ratio').independent,false);
});

test('legacy exposure after a new attempt starts remains sticky on resume and completion',()=>{
 const progress=C.freshProgress(now(),1);C.beginSession(progress,'ratio','standard',{exampleId:'303',methodVersion:1},now());C.startEquationSession(progress,'ratio',now());
 assert.equal(progress.assistance.length,0,'Starting an untouched condition does not manufacture help');
 C.resumeArchived(progress,0,now());finish(progress,'ratio');const oldSolution=copy(progress.solutions[0]);
 C.resumeArchived(progress,0,now());assert.equal(progress.assistance.some(r=>r.methodVersion===2&&r.exposed),true);
 const restored=C.validateProgress(copy(progress));assert.equal(finish(restored,'ratio').independent,false);assert.equal(C.moduleStats(restored,'ratio').independent,0);assert.deepEqual(copy(restored.solutions[0]),oldSolution);
 const untouched=C.freshProgress(now());C.beginSession(untouched,'ratio','standard',{exampleId:'303'},now());C.submitAnswer(untouched,'ratio',C.problemFor(untouched.sessions.ratio).steps[0].expected,0,now());C.beginSession(untouched,'ratio','standard',{exampleId:'305'},now());C.resumeArchived(untouched,0,now());
 assert.equal(finish(untouched,'ratio').independent,true,'An attempt does not count its own earlier accepted steps as external exposure');
 const late=C.freshProgress(now());C.beginSession(late,'ratio','standard',{exampleId:'303'},now());C.beginSession(late,'meeting','standard',{exampleId:'303',methodVersion:1},now());finish(late,'meeting');assert.equal(finish(late,'ratio').independent,false,'Completion also notices legacy exposure from another module without an archive restore');
 assert.doesNotThrow(()=>C.validateProgress(copy(late)));
});

test('help through both 303 entries preserves per-topic metrics and imports without losing assistance',()=>{
 const progress=C.freshProgress(now());
 for(const module of ['meeting','ratio']){C.beginSession(progress,module,'standard',{exampleId:'303'},now());const step=C.problemFor(progress.sessions[module]).steps[0];C.submitAnswer(progress,module,step.options.find(o=>o[0]!==step.expected)[0],0,now());C.toggleSessionHint(progress,module,now());}
 const help=progress.assistance.find(r=>r.methodVersion===2);assert.equal(help.errors,2);assert.equal(help.hints,2);assert.deepEqual(copy(help.moduleCounts),{meeting:{errors:1,hints:1},ratio:{errors:1,hints:1}});
 let restored=C.validateProgress(copy(progress));assert.equal(JSON.stringify(restored),JSON.stringify(progress));assert.equal(finish(restored,'ratio').independent,false);assert.equal(finish(restored,'meeting').duplicate,true);restored=C.validateProgress(copy(restored));assert.equal(restored.solutions.length,1);assert.equal(C.overallStats(restored).assisted,1);
 for(const module of ['meeting','ratio']){assert.equal(restored.metrics[module].errors,1);assert.equal(restored.metrics[module].hints,1);}
 const bad=copy(restored);bad.assistance[0].moduleCounts.ratio.hints=0;assert.throws(()=>C.validateProgress(bad));
 const unrelated=copy(restored);unrelated.assistance[0].moduleCounts.time=unrelated.assistance[0].moduleCounts.ratio;delete unrelated.assistance[0].moduleCounts.ratio;assert.throws(()=>C.validateProgress(unrelated));
});

test('changed content versions, forged exposure flags and corrupted archived steps are rejected',()=>{
 const progress=C.freshProgress(now(),1);C.beginSession(progress,'ratio','standard',{exampleId:'303',methodVersion:1},now());C.submitAnswer(progress,'ratio','yes',0,now());C.startEquationSession(progress,'ratio',now());finish(progress,'ratio');
 const original=JSON.stringify(progress),mutations=[p=>p.sessions.ratio.methodVersion=99,p=>p.archivedSessions[0].answers[0]='no',p=>p.solutions[0].exposed=false,p=>delete p.solutions[0].exposed,p=>p.assistance.find(r=>r.methodVersion===2).exposed=false,p=>p.version=1];
 for(const mutate of mutations){const bad=copy(progress);mutate(bad);assert.throws(()=>C.validateProgress(bad));assert.equal(JSON.stringify(progress),original);}
});

test('symbolic and ordinary fractions render with a bar, all source text remains escaped',()=>{
 const rendered=E.rich('{{frac:175:x}} + 1/9 <img src=x onerror=alert(1)>');assert.equal((rendered.match(/class="equation-fraction"/g)||[]).length,2);assert.match(rendered,/175 делить на x/);assert.doesNotMatch(rendered,/<img/);assert.match(rendered,/&lt;img/);
 assert.doesNotMatch(E.rich('{{frac:<svg onload=alert(1)>:x}}'),/<svg/);
 assert.match(source,/name="equation-choice"/);assert.match(source,/Решать через неизвестную/);assert.match(source,/data-resume-archive/);
});
