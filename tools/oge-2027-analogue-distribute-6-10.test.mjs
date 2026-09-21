import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'd5c9d0388ab3b22bcffec10d11504a0624e2b598';
const variantId = 'oge-2027-analogue-1';
const label = 'Авторский аналог ОГЭ-2027 · Вариант 1';
const disclaimer = 'Авторский материал MathExam. Не является официальным материалом ФИПИ.';
const paths = {
  6:'trainers/oge-task6-fractions.html', 7:'trainers/oge-task7-number-line.html',
  8:'trainers/oge-task8-powers-roots.html', 9:'trainers/oge-task9-equations.html',
  10:'trainers/oge-task10-probability.html',
};
const sourcePath = 'trainers/oge-2027-analogue-1.html';
const sourceGate = 'tools/oge-2027-analogue-1.test.mjs';
const inventoryGate = 'tools/trainer-inventory/test/inventory.test.mjs';
const hashHistory = 'docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md';
const ALLOWED = Object.freeze([...Object.values(paths),
  'tools/oge-2027-analogue-distribute-6-10.test.mjs',
  'tools/oge-2027-analogue-distribute-6-10.browser.mjs',
  'docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_6_10.md', sourceGate, inventoryGate, hashHistory]);
const read = relative => fs.readFileSync(path.join(root,relative),'utf8');
const gitBytes = (...args) => execFileSync('git',['-c','safe.directory='+root,...args],
  {cwd:root,windowsHide:true,maxBuffer:16*1024*1024,timeout:30000});
const git = (...args) => gitBytes(...args).toString('utf8');
const base = relative => git('show',BASE+':'+relative);
const digest = value => createHash('sha256').update(value).digest('hex');
const id = n => 'oge2027-analogue-1-task-'+String(n).padStart(2,'0');
const serialize = value => JSON.stringify(value,(_,v)=>typeof v==='bigint'?v+'n':typeof v==='function'?v.toString():v);
const plain = value => JSON.parse(serialize(value));
const clean = html => String(html).replace(/<[^>]*>/g,'').replaceAll('&nbsp;',' ').replaceAll('&minus;','−').replace(/\s+/g,'').replaceAll('−','-').replaceAll(',','.');
const scripts = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const currentHtml = Object.fromEntries(Object.entries(paths).map(([n,p])=>[n,read(p)]));
const baseHtml = Object.fromEntries(Object.entries(paths).map(([n,p])=>[n,base(p)]));
function load(n,html){
  let code=scripts(html).map(([,attrs,body])=>{assert.doesNotMatch(attrs,/\bsrc\s*=/i);new vm.Script(body);return body;}).join('\n');
  if(n===6)code=code.split('// Initialize trainer')[0];
  if(n===8)code=code.split('const score=')[0];
  if(n===9)code=code.split('/* ============ ИНИЦИАЛИЗАЦИЯ')[0];
  const context=vm.createContext({URLSearchParams,console,window:{addEventListener(){}},document:{addEventListener(){}},location:{search:''},...(n===7?{module:{exports:{}}}:{})});
  vm.runInContext(code,context,{timeout:10000});
  return {context,run:code=>vm.runInContext(code,context,{timeout:10000})};
}
const now=Object.fromEntries(Object.keys(paths).map(n=>[n,load(+n,currentHtml[n])]));
const old=Object.fromEntries(Object.keys(paths).map(n=>[n,load(+n,baseHtml[n])]));
const bankName=n=>n===6?'TASKS':n===10?'AUTHOR_TASKS':'BANK';
const banks=Object.fromEntries(Object.keys(paths).map(n=>[n,now[n].run(bankName(+n))]));
const authored=n=>banks[n].at(-1);
const sourceContext=vm.createContext({});
vm.runInContext(scripts(read(sourcePath)).find(([,attrs])=>/\bid=["']model["']/.test(attrs))[2],sourceContext);
const sourceTasks=sourceContext.ExamModel.TASKS;
let failed=0,passed=0,scheduled=0;
function gate(name,fn){scheduled++;test(name,()=>{try{fn();passed++;}catch(error){failed++;throw error;}});}
process.once('beforeExit',()=>{if(!failed&&passed===scheduled)console.log('OGE_2027_ANALOGUE_DISTRIBUTE_6_10_NODE_OK');});

function exactScope(actual,expected=ALLOWED){assert.deepEqual([...actual].sort(),[...expected].sort());}
function arrayLiteral(text,name){const match=text.match(new RegExp('const '+name+' = Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);'));assert.ok(match,name);return match[1];}
function withoutScope(text,kind){
  const start=text.indexOf(kind==='source'?'// Closed PR124':'// Historical allowlists');
  const end=text.indexOf(kind==='source'?"gate('model updates are pure":"test('committed-scope sources",start);
  assert.ok(start>=0&&end>start,'bounded approved scope region');return text.slice(0,start)+text.slice(end);
}
function pilot(text){const match=text.match(/const pilotExpected = Object\.freeze\((\{[\s\S]*?\n\})\);/);assert.ok(match);return vm.runInNewContext('('+match[1]+')');}
function maskPilot(text){return text.replace(/const pilotExpected = Object\.freeze\(\{[\s\S]*?\n\}\);/,'const pilotExpected = PILOT_BYTES;');}

gate('exact eleven-file scope and fail-closed missing, duplicate, foreign and twelfth-file vectors',()=>{
  git('merge-base','--is-ancestor',BASE,'HEAD');
  const changed=new Set([...git('diff','--name-only','--no-renames','-z',BASE,'--').split('\0'),...git('ls-files','--others','--exclude-standard','-z').split('\0')].filter(Boolean));
  exactScope(changed);assert.equal(ALLOWED.length,11);assert.equal(new Set(ALLOWED).size,11);
  for(let i=0;i<11;i++){
    assert.throws(()=>exactScope(ALLOWED.filter((_,j)=>i!==j)));
    assert.throws(()=>exactScope(ALLOWED.map((file,j)=>i===j?'tools/unapproved.test.mjs':file)));
  }
  assert.throws(()=>exactScope([...ALLOWED,'tools/unapproved.test.mjs']));
  assert.throws(()=>exactScope([...ALLOWED,ALLOWED[0]]));
  for(const p of [sourceGate,inventoryGate]){
    const text=read(p);const scope=vm.runInNewContext(arrayLiteral(text,'OGE_2027_ANALOGUE_DISTRIBUTE_6_10'));exactScope(scope);
    for(const historical of ['distributionScope','historicalPr124Scope']){
      assert.equal(arrayLiteral(text,historical),arrayLiteral(base(p),historical),'historical scope byte identity');
      const oldScope=vm.runInNewContext(arrayLiteral(text,historical),{relativeTrainer:sourcePath});
      assert.throws(()=>exactScope(oldScope));assert.throws(()=>exactScope(ALLOWED,oldScope));
      for(const foreign of oldScope.filter(file=>!ALLOWED.includes(file)))assert.throws(()=>exactScope([...ALLOWED.slice(0,-1),foreign]));
    }
  }
});

gate('source page and all non-scope source/inventory assertions remain unchanged',()=>{
  assert.deepEqual(fs.readFileSync(path.join(root,sourcePath)),gitBytes('show',BASE+':'+sourcePath),'published source bytes');
  assert.deepEqual(gitBytes('show','HEAD:'+sourcePath),gitBytes('show',BASE+':'+sourcePath),'source Git object');
  assert.equal(withoutScope(read(sourceGate),'source'),withoutScope(base(sourceGate),'source'));
  assert.equal(maskPilot(withoutScope(read(inventoryGate),'inventory')),maskPilot(withoutScope(base(inventoryGate),'inventory')));
  const before=pilot(base(inventoryGate)),after=pilot(read(inventoryGate));
  assert.deepEqual(Object.keys(after),Object.keys(before));
  assert.deepEqual(plain(after['trainers/oge-task20-equations.html']),plain(before['trainers/oge-task20-equations.html']));
  assert.deepEqual(gitBytes('show','HEAD:trainers/oge-task20-equations.html'),gitBytes('show',BASE+':trainers/oge-task20-equations.html'));
});

gate('all old canonical records, IDs, order, answers, solutions and generator families are preserved',()=>{
  for(const [n,count] of [[6,174],[7,142],[8,160],[9,135]]){
    const before=old[n].run(bankName(n));assert.equal(before.length,count);assert.equal(banks[n].length,count+1);
    assert.equal(serialize(banks[n].slice(0,count)),serialize(before),'entire canonical prefix '+n);
    const legacyIds=banks[n].slice(0,count).map(t=>t.id).filter(x=>x!==undefined);
    assert.equal(new Set(legacyIds).size,legacyIds.length,'legacy IDs '+n);
  }
  assert.equal(currentHtml[6].match(/const TASKS = \[[^\n]+\];/)[0],baseHtml[6].match(/const TASKS = \[[^\n]+\];/)[0],'immutable legacy literal plus visible runtime append');
  assert.equal(serialize(now[8].run('LEGACY_BANK')),serialize(old[8].run('BANK')));
  for(const name of ['GENS','TYPE_LIST','FIXED_MINIS'])assert.equal(serialize(now[10].run(name)),serialize(old[10].run(name)),name);
  assert.equal(now[10].run('Object.keys(GENS).length'),7);assert.equal(now[10].run('FIXED_MINIS.length'),7);assert.equal(banks[10].length,1);
  for(const n of [7,8,9]){
    const expression=n===7?'BANK.map(t=>buildStepsAny(t,"school"))':n===8?'BANK.map(t=>({render:renderTask(t),steps:buildSteps(t)}))':'BANK.map(t=>({key:taskKey(t),solution:taskSolve(t),stepFactories:taskSteps(t)}))';
    const before=old[n].run(expression),after=now[n].run(expression).slice(0,before.length);
    assert.equal(serialize(after),serialize(before),'old rendered math/solutions '+n);
  }
  for(const name of ['createRecord','applyTaskEvent','parseInput','eqFrac','summarizeRecords'])assert.equal(now[6].run(name+'.toString()'),old[6].run(name+'.toString()'));
  for(const name of ['parseNum','checkFinal','taskKey','taskSolve'])assert.equal(now[9].run(name+'.toString()'),old[9].run(name+'.toString()'));
  for(const name of ['checkAnswer','parseAns','parsePair','mountSteps','selfTest','record','loadStats','saveStats'])assert.equal(now[10].run(name+'.toString()'),old[10].run(name+'.toString()'));
});

gate('exact one source mapping and one append per author task; no answer-only deduplication',()=>{
  const mapped=[];
  for(const n of [6,7,8,9,10]){
    const metadata=plain(now[n].run('AUTHOR_SOURCE'));
    assert.deepEqual(metadata,{sourceKind:'author-analogue',variantId,sourceTaskId:id(n),localTaskId:id(n),status:'MISSING_APPENDED',label,disclaimer});
    assert.equal(authored(n).id,id(n));assert.equal(banks[n].filter(t=>t.id===id(n)).length,1);mapped.push(metadata.localTaskId);
    const source=sourceTasks.find(t=>t.number===n);assert.equal(source.id,id(n));assert.equal(source.variantId,variantId);
    const provenance=n===10?authored(n).source:authored(n);
    for(const key of ['sourceKind','variantId','sourceTaskId'])assert.equal(provenance[key],metadata[key]);
    assert.match(currentHtml[n],/data-author-cohort|dataset\.authorCohort/);assert.match(currentHtml[n],/data-source-task-id|dataset\.sourceTaskId/);
  }
  assert.equal(new Set(mapped).size,5);
  const signatures={
    6:t=>clean(t.html),
    7:t=>serialize({N:t.N,kind:t.kind,sub:t.sub,pic:t.pic?{labels:t.pic.labels,pts:t.pic.pts}:null,opts:t.opts?.map(o=>clean(o.html)),key:t.key}),
    8:t=>serialize({type:t.type,p:t.p}),
    9:t=>serialize({fam:t.fam,p:t.p,ask:t.ask}),
  };
  for(const n of [6,7,8,9]){
    const signature=signatures[n](authored(n));assert.equal(old[n].run(bankName(n)).filter(t=>signatures[n](t)===signature).length,0,'exact source structure absent '+n);
    assert.equal(banks[n].filter(t=>signatures[n](t)===signature).length,1,'idempotent canonical representation '+n);
  }
  assert.equal(old[9].run('BANK.find(t=>t.id==="pf-10").exp'),'-7','same answer exists but is a different equation');
  assert.notEqual(signatures[9](old[9].run('BANK.find(t=>t.id==="pf-10")')),signatures[9](authored(9)));
  assert.ok(old[8].run('BANK.some(t=>t.ans[0]===81*t.ans[1])'),'same power answer is not exact source identity');
  const probabilityMinis=old[10].run('FIXED_MINIS');
  assert.ok(probabilityMinis.every(t=>typeof t.html==='string'&&t.html.length>0));
  assert.ok(!probabilityMinis.some(t=>clean(t.html)===clean(authored(10).text)));
  assert.doesNotMatch(old[10].run('gen102.toString()'),/violet|remainder|маркеров/,'old two-colour family does not express the five-colour remainder statement');
});

gate('independent arithmetic, exact source statement and actual answer parsers for 6–10',()=>{
  assert.equal(48*27,1296);assert.equal(324/25,12.96);
  assert.equal(clean(authored(6).html),'4.8·2.7');assert.equal(authored(6).n*25,324*authored(6).d);
  for(const input of ['12,96','12.96','324/25','1296/100'])assert.equal(now[6].run(`eqFrac(parseInput(${JSON.stringify(input)}).value,TASKS.at(-1).n,TASKS.at(-1).d)`),true,input);
  assert.equal(now[6].run('eqFrac(parseInput("129,6").value,TASKS.at(-1).n,TASKS.at(-1).d)'),false);
  assert.ok(7**2<50&&50<7.1**2);assert.equal(authored(7).key,2);assert.equal(authored(7).N,50);
  assert.equal(now[7].run('computeCKey(BANK.at(-1))'),2);assert.equal(now[7].run('parseIntStrict("7.07")'),null);
  const power=(9n**7n*10n**5n)/(90n**5n);assert.equal(power,81n);assert.deepEqual(plain(authored(8).p),{b1:9,p:7,b2:10,q:5,r:5});assert.deepEqual(plain(authored(8).ans),[81,1]);
  for(const value of ['81','81,0','81.0','162/2'])assert.equal(now[8].run(`feq(parseAns(${JSON.stringify(value)}),Fr(81))`),true);
  for(const value of ['9','2'])assert.equal(now[8].run(`feq(parseAns(${JSON.stringify(value)}),Fr(81))`),false);
  const x=(12-20-6)/(5-3);assert.equal(x,-7);assert.equal(5*(x+4)-3*(x-2),12);
  assert.deepEqual(plain(authored(9).p),plain(now[9].run('({Lt:[BR(5,[X(1),N(4)]),BR(-3,[X(1),N(-2)])],Rt:[N(12)]})')));
  for(const value of ['-7','−7','-14/2'])assert.equal(now[9].run(`checkFinal(BANK.at(-1),${JSON.stringify(value)}).ok`),true);
  assert.equal(now[9].run('checkFinal(BANK.at(-1),"7").ok'),false);assert.match(now[9].run('checkFinal(BANK.at(-1),"7").msg'),/знак/);
  const remainder=250-35-45-50,black=remainder/2,fav=35+black;assert.equal(remainder,120);assert.equal(black,60);assert.equal(fav,95);assert.equal(fav/250,.38);
  assert.equal(clean(authored(10).text),clean(sourceTasks.find(t=>t.number===10).prompt),'exact source probability wording');
  assert.deepEqual(plain(authored(10).meta),{total:250,red:35,green:45,violet:50,remainder:120,blue:60,black:60,fav:95});
  for(const value of ['0,38','0.38','19/50','95/250'])assert.equal(now[10].run(`checkAnswer(AUTHOR_TASKS[0],parseAns(${JSON.stringify(value)}))`),true);
  for(const value of ['0,24','0,14','0,48'])assert.ok(now[10].run(`authorWrongFeedback(parseAns(${JSON.stringify(value)}))`).length>20,'diagnostic '+value);
  for(const value of ['0,24','0,14','0,48','95'])assert.equal(now[10].run(`checkAnswer(AUTHOR_TASKS[0],parseAns(${JSON.stringify(value)}))`),false);
  for(const [n,answer,type] of [[6,12.96,'number'],[7,2,'choice'],[8,81,'number'],[9,-7,'number'],[10,.38,'number']]){
    const source=sourceTasks.find(t=>t.number===n);assert.equal(source.answer,answer);assert.equal(source.answerType,type);
  }
});

gate('number-line SVG positions encode the actual square root and option B = 2',()=>{
  const t=authored(7);assert.deepEqual(plain(t.pic.labels),[6,7,8]);assert.deepEqual(plain(t.opts.map(o=>clean(o.html))),['A','B','C','D']);
  const points=t.pic.pts;assert.deepEqual(plain(points.map(p=>p.name)),['A','B','C','D']);assert.equal(points[0].x,6.6);assert.equal(points[1].x,Math.sqrt(50));assert.equal(points[2].x,7.45);assert.equal(points[3].x,7.8);
  const svg=now[7].run('svgLine(BANK.at(-1).pic)');assert.match(svg,/role="img"/);assert.match(svg,/aria-label="[^"]*6, 7, 8/);
  const circles=[...svg.matchAll(/<circle data-point="([A-D])" data-value="([^"]+)" cx="([^"]+)"/g)];assert.equal(circles.length,4);
  const ticks=[...svg.matchAll(/<text x="([^"]+)" y="61"[^>]*>([678])<\/text>/g)];assert.equal(ticks.length,3);
  const x7=Number(ticks.find(m=>m[2]==='7')[1]),x8=Number(ticks.find(m=>m[2]==='8')[1]);
  for(const [,name,value,pixel] of circles){const expected=points.find(p=>p.name===name).x;assert.equal(Number(value),expected);assert.ok(Math.abs((Number(pixel)-x7)/(x8-x7)+7-expected)<1e-12);}
  assert.ok(Number(circles[1][3])>x7&&Number(circles[1][3])<x7+.1*(x8-x7));
});

gate('author step answers are mathematically correct and old self-checks still pass',()=>{
  const steps7=now[7].run('buildStepsAny(BANK.at(-1),"school")');assert.deepEqual(plain(steps7.map(s=>s.type)),['int2','int','choice','int']);
  assert.equal(steps7[0].ans1,7);assert.equal(steps7[0].ans2,8);assert.equal(steps7[1].ans,5041);assert.equal(steps7[2].correct,1);assert.equal(steps7[3].ans,2);
  assert.equal(now[7].run('verifySteps(buildStepsAny(BANK.at(-1),"school"))'),null);assert.deepEqual(plain(now[7].run('verifyBank()')),[]);
  const steps8=now[8].run('buildSteps(BANK.at(-1))');assert.equal(steps8.length,3);assert.deepEqual(plain(steps8.map(s=>s.ins.length)),[1,2,1]);
  assert.deepEqual(plain(steps8.map(s=>s.ins.map(i=>i.val))),[[{n:'5n',d:'1n'}],[{n:'2n',d:'1n'},{n:'0n',d:'1n'}],[{n:'81n',d:'1n'}]]);
  const steps9=now[9].run('taskSteps(BANK.at(-1)).map(f=>f())');assert.equal(steps9.length,5);
  assert.deepEqual(plain(steps9.map(s=>s.reveal.vals)),[['5','20'],['-3','6'],['2','26'],['2','-14'],['-7']]);
  for(const step of steps9)assert.equal(step.check(step.reveal.vals,{}).ok,true);
  assert.deepEqual(plain(now[9].run('selfCheckBank()')),{total:136,bad:0});
  const steps10=authored(10).steps;assert.equal(steps10.length,4);assert.deepEqual(plain(steps10.map(s=>s.ans)),[{n:'120n',d:'1n'},{n:'60n',d:'1n'},{n:'95n',d:'1n'},{n:'19n',d:'50n'}]);
  assert.equal(old[10].run('selfTest(60)'),5416);assert.equal(now[10].run('selfTest(60)'),5416);
});

gate('default modes, old cohort membership, storage names and assisted-credit model stay isolated',()=>{
  assert.equal(now[6].run('cat'),'bank');assert.equal(now[6].run('shuffle'),false);
  for(const [key,count] of [['all',174],['bank',81],['dec',21],['author',1]])assert.equal(now[6].run(`TASKS.filter(t=>matchesCategory(t,${JSON.stringify(key)})).length`),count);
  assert.equal(now[7].run('marList().length'),142);assert.equal(now[7].run('marFilter'),'all');assert.equal(now[7].run('marSrc'),'all');
  assert.equal(now[9].run('maraState.filter'),'all');assert.deepEqual(plain(now[9].run('authorMaraProgress')),{helpUsed:false,independent:false});
  assert.equal(now[10].run('stepType'),'10.1');assert.equal(now[10].run('marFilter'),'all');assert.equal(now[10].run('LS_KEY'),old[10].run('LS_KEY'));
  for(const n of [6,7,8,9,10]){
    const before=[...baseHtml[n].matchAll(/<[^>]*class=["'][^"']*(?:active|on)[^"']*["'][^>]*>/g)].map(m=>m[0]);
    for(const element of before.filter(t=>/\b(?:pane|tab|view)/.test(t)))assert.ok(currentHtml[n].includes(element),'initial active UI unchanged '+n);
    const storageCalls=text=>[...text.matchAll(/(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem|clear)\s*\([^\n]*/g)].map(m=>m[0]);
    assert.deepEqual(storageCalls(currentHtml[n]),storageCalls(baseHtml[n]),'storage operations unchanged '+n);
  }
  const state10=now[10].run('JSON.stringify(STATS)');now[10].run('renderStats=()=>{};recordAuthor("shown");recordAuthor("correct");recordAuthor("correct")');
  assert.deepEqual(plain(now[10].run('AUTHOR_PROGRESS')),{assisted:true,credited:false,shown:true});assert.equal(now[10].run('JSON.stringify(STATS)'),state10);
  now[10].run('AUTHOR_PROGRESS.assisted=false;AUTHOR_PROGRESS.shown=false;recordAuthor("correct");recordAuthor("correct")');
  assert.equal(now[10].run('AUTHOR_PROGRESS.credited'),true);assert.equal(now[10].run('JSON.stringify(STATS)'),state10);
});

gate('task6 author boundary preserves legacy attempts and sticky help without repeated credit',()=>{
  const runtime=load(6,currentHtml[6]);runtime.context.document.getElementById=()=>({checked:false});
  runtime.run('buildChips=()=>{};renderTask=()=>{};startSet();applyCurrent("wrong");applyCurrent("correct")');
  const legacy=runtime.run('JSON.stringify(captureSet())');
  runtime.run('selectCategory("bank")');assert.equal(runtime.run('JSON.stringify(captureSet())'),legacy,'same category remains a no-op');
  runtime.run('selectCategory("author")');assert.equal(runtime.run('order.length'),1);assert.equal(runtime.run('summarizeRecords(order,records).independent'),0);
  runtime.run('applyCurrent("wrong");applyCurrent("reveal");selectCategory("bank")');assert.equal(runtime.run('JSON.stringify(captureSet())'),legacy,'legacy order, attempts, streak and shuffle restore');
  runtime.run('selectCategory("author");applyCurrent("correct");applyCurrent("correct")');
  assert.deepEqual(plain(runtime.run('currentRecord()')),{wrongAttempts:1,answerWasRevealed:true,status:'revealed'});
  assert.equal(runtime.run('summarizeRecords(order,records).independent'),0);assert.equal(runtime.run('streak'),0);
  runtime.run('selectCategory("author")');assert.equal(runtime.run('currentRecord().answerWasRevealed'),true,'same author chip cannot erase help');
  runtime.run('startSet();applyCurrent("correct");applyCurrent("correct")');assert.equal(runtime.run('streak'),1);assert.equal(runtime.run('summarizeRecords(order,records).independent'),1);
  runtime.run('selectCategory("bank")');assert.equal(runtime.run('JSON.stringify(captureSet())'),legacy,'explicit author reset cannot erase legacy');
  runtime.run('selectCategory("dec")');assert.equal(runtime.run('order.length'),21);assert.equal(runtime.run('summarizeRecords(order,records).independent'),0,'legacy category switch keeps its original reset policy');
});

function routes(n,search){
  if(n===6||n===9)return now[n].run(`authorTaskFromQuery(${JSON.stringify(search)})`)===id(n);
  if(n===10){now[n].context.location.search=search;return now[n].run('requestedAuthorTask()');}
  const code=scripts(currentHtml[n]).map(m=>m[2]).join('\n');const start=code.lastIndexOf('const taskQuery=');assert.ok(start>0);
  const tail=code.slice(start);const routing=n===7?tail.slice(0,tail.lastIndexOf('\n});')):tail;
  let activated=false;const context=vm.createContext({URLSearchParams,window:{location:{search}},AUTHOR_SOURCE:plain(now[n].run('AUTHOR_SOURCE')),BANK:banks[n],isAuthorTask:t=>t.id===id(n),
    renderMarChips(){},renderMarGrid(){},renderMarTask(){},switchTab:tab=>{activated=tab==='mar';},marSetFilter(){},showView:tab=>{activated=tab==='mar';}});
  vm.runInContext(routing,context);return activated;
}
gate('deep links select only their exact single local source ID and reject malformed queries',()=>{
  for(const n of [6,7,8,9,10]){
    assert.equal(routes(n,'?task='+id(n)),true);assert.equal(routes(n,'?foo=bar&task='+id(n)),true);
    for(const query of ['', '?task=', '?task=unknown','?task='+id(n)+'&task='+id(n),'?task=%','?task=%GG','?task='+id(n)+'&junk=%','?task='+id(n+1),'?task='+id(n)+'-suffix'])assert.equal(routes(n,query),false,n+' '+query);
  }
});

gate('Pilot A fixtures match exact HEAD Git blobs; old hash-basis history and task20 stay intact',()=>{
  const expected=pilot(read(inventoryGate));const history=read(hashHistory),oldHistory=base(hashHistory);assert.ok(history.startsWith(oldHistory),'append-only historical evidence');
  assert.match(history,/OGE_2027_ANALOGUE_DISTRIBUTE_6_10/);
  for(const n of [6,8,9]){
    // Deliberately read HEAD, never filesystem hashes or HEAD:path lookalikes.
    const object=git('rev-parse','HEAD:'+paths[n]).trim();const bytes=gitBytes('cat-file','blob',object);
    assert.equal(digest(bytes),expected[paths[n]].sha256,'HEAD Git-object sha256 '+n);assert.equal(bytes.length,expected[paths[n]].sizeBytes,'HEAD Git-object size '+n);
    assert.ok(history.includes(expected[paths[n]].sha256));assert.ok(history.includes(String(expected[paths[n]].sizeBytes)));
    assert.ok(history.includes(pilot(base(inventoryGate))[paths[n]].sha256));
  }
});

gate('new trainer bytes contain no secrets, network code, bidi/control additions or unrelated architecture',()=>{
  for(const n of [6,7,8,9,10]){
    const html=currentHtml[n],before=baseHtml[n];
    for(const expression of [/\uFEFF/g,/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,/[\u202A-\u202E\u2066-\u2069]/g])assert.equal((html.match(expression)||[]).length,(before.match(expression)||[]).length,'preserved existing controls '+n);
    const diff=git('diff','--unified=0',BASE,'--',paths[n]).split('\n').filter(line=>line.startsWith('+')&&!line.startsWith('+++')).map(line=>line.slice(1)).join('\n');
    assert.doesNotMatch(diff,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b|<script[^>]+src\s*=/i);
    assert.doesNotMatch(diff,/(?:token|password|passwd|api[_-]?key)\s*[:=]\s*["'][^"']+["']/i);
    assert.doesNotMatch(diff,/(?:[A-Za-z]:[\\/]Users[\\/]|https?:\/\/(?!mathexam\.space|www\.w3\.org))/);
    assert.doesNotMatch(diff,/oge2027-analogue-1-task-(?:11|12|13|14)/);
  }
});
