import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='7ebbd328d7b59b691eb50d01324d4c438aa8404c';
const targetPath='trainers/oge-1-5-trainers/practice-1-5-tires.html';
const sourcePath='trainers/oge-2027-analogue-1.html';
const AUTHOR_ID='oge-2027-analogue-1';
const LABEL='Авторский аналог ОГЭ-2027 · Вариант 1';
const DISCLAIMER='Авторский комплект MathExam. Не является официальным материалом ФИПИ.';
const git=(...args)=>execFileSync('git',['-c','safe.directory='+root,...args],{cwd:root});
const baseTarget=git('show',BASE+':'+targetPath).toString('utf8');
const html=fs.readFileSync(path.join(root,targetPath),'utf8');
const sourceBytes=fs.readFileSync(path.join(root,sourcePath));
const source=sourceBytes.toString('utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const digest=value=>createHash('sha256').update(value).digest('hex');
const normalizedText=value=>String(value).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const scriptOf=text=>[...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
let scheduled=0,passed=0,failed=0;
function gate(name,fn){scheduled++;test(name,()=>{try{fn();passed++;}catch(error){failed++;throw error;}});}
process.once('beforeExit',()=>{if(scheduled>0&&passed===scheduled&&!failed)console.log('OGE_2027_ANALOGUE_TIRES_NODE_OK');});

function harness(text){
  const nodes=new Map(),storage=new Map(),writes=[];
  function element(){
    const classes=new Set();
    return {innerHTML:'',textContent:'',value:'',dataset:{},style:{},children:[],hidden:false,disabled:false,
      classList:{add(...args){args.forEach(c=>classes.add(c));},remove(...args){args.forEach(c=>classes.delete(c));},contains:c=>classes.has(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);}},
      appendChild(child){this.children.push(child);return child;},append(child){this.children.push(child);},
      setAttribute(name,value){this[name]=String(value);},removeAttribute(name){delete this[name];},
      querySelectorAll:()=>[],querySelector(selector){if(selector!=='strong')return null;if(!nodes.has('strong'))nodes.set('strong',element());return nodes.get('strong');},addEventListener(){},focus(){}};
  }
  const document={readyState:'loading',body:element(),addEventListener(){},querySelectorAll:()=>[],querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},
    createElement:()=>element(),createElementNS:()=>element(),getElementById(id){
      if(id==='cross-svg'||id==='anim-svg')return null;
      if(!nodes.has(id))nodes.set(id,element());
      return nodes.get(id);
    }};
  const location={search:''};
  const context=vm.createContext({document,URLSearchParams,location,window:{location,matchMedia:()=>({matches:true})},
    localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){writes.push(key);storage.set(key,String(value));}},
    setTimeout(){},clearTimeout(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){},performance:{now:()=>0},console:{info(){},warn(){},error(){}}});
  const expose=[
    'globalThis.__probe={VARIANTS,buildVariant,tire,STORAGE_KEY,populateVariants,refreshVariantBar,saveStore,loadVariant,',
    "initialVariantIndex:typeof initialVariantIndex==='function'?initialVariantIndex:null,",
    'select(index){state.variantIdx=index;VD=buildVariant(VARIANTS[index]);prog={solvedSteps:[false,false,false,false,false,false,false],streak:0,currentStep:0};CHECKS={};},',
    'setProgress(value){prog=value;},getProgress(){return prog;},',
    'renderSections(){renderMarking();renderTable();renderTask1();renderTask2();renderTask3();renderTask4();renderTask5();},',
    'checks(){return CHECKS;},view(){return VD;}};'
  ].join('\n');
  vm.runInContext(scriptOf(text)+'\n'+expose,context,{timeout:5000});
  return {api:context.__probe,nodes,storage,writes,document};
}
const current=harness(html),before=harness(baseTarget);
const variants=Array.from(current.api.VARIANTS),oldVariants=Array.from(before.api.VARIANTS);
const author=variants.find(v=>v.code===AUTHOR_ID),authorIndex=variants.findIndex(v=>v.code===AUTHOR_ID);
const sourceContext=vm.createContext({});
vm.runInContext(source.match(/<script id="model">([\s\S]*?)<\/script>/)[1],sourceContext,{timeout:3000});
const sourceModel=sourceContext.ExamModel;
const sourceTasks=Array.from(sourceModel.TASKS.slice(0,5));
const expectedIds=Array.from({length:5},(_,i)=>'oge2027-analogue-1-task-'+String(i+1).padStart(2,'0'));
const marking=value=>{const m=String(value).match(/^(\d+)\s*\/\s*(\d+)\s*R\s*(\d+)$/i);assert.ok(m,'Complete tyre marking');return m.slice(1).map(Number);};
const canonicalTable=compat=>[...compat.rows].sort((a,b)=>a.w-b.w).map(row=>({
  width:row.w,cells:[...compat.disks].sort((a,b)=>a-b).map(rim=>({
    rim,markings:row.cells[rim]?String(row.cells[rim]).split(';').map(cell=>marking(cell.trim()+' R'+rim)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]):[],
  })),
}));
const expectedTable={disks:[14,15,16],rows:[
  {w:175,cells:{14:'175/70',15:'175/65',16:null}},
  {w:185,cells:{14:'185/65',15:'185/60',16:null}},
  {w:195,cells:{14:null,15:'195/60',16:'195/55'}},
  {w:205,cells:{14:null,15:'205/55',16:'205/50'}},
]};
// Exact integer arithmetic derives answers independently of answer fields.
const widthAnswer=Math.max(...expectedTable.rows.filter(r=>r.cells[15]).map(r=>r.w));
const sidewallHundredths=(width,profile)=>BigInt(width)*BigInt(profile);
const diameterHundredths=(width,profile,rim)=>BigInt(rim)*2540n+2n*sidewallHundredths(width,profile);
const factoryD=diameterHundredths(185,65,14),newD=diameterHundredths(195,60,15);
const percentNumerator=(newD-factoryD)*100n,percentDenominator=factoryD;
const percentTenths=(percentNumerator*20n+percentDenominator)/(2n*percentDenominator);
const answers=[widthAnswer,Number(sidewallHundredths(205,50))/100,Number(factoryD)/100,
  Number(sidewallHundredths(195,60)-sidewallHundredths(185,60))/100,Number(percentTenths)/10];

gate('source author page is exactly the published base blob and all 25 records remain intact',()=>{
  assert.deepEqual(sourceBytes,git('show',BASE+':'+sourcePath));
  assert.equal(digest(sourceBytes),'0dc6d63c073bd27d12a6bae2debc562765b0e12c4f16df77c7eec0e9aac3ed62');
  assert.equal(sourceModel.TASKS.length,25);
  assert.equal(new Set(Array.from(sourceModel.TASKS,t=>t.id)).size,25);
  assert.deepEqual(sourceTasks.map(t=>t.id),expectedIds);
  for(const t of sourceTasks){assert.equal(t.sourceKind,'author-analogue');assert.equal(t.variantId,AUTHOR_ID);}
  assert.deepEqual(sourceTasks.map(t=>t.answer),answers);
  assert.deepEqual(plain(sourceModel.TYRES),{factory:{width:185,profile:65,rim:14},inch:25.4,rows:[[175,70,65,null],[185,65,60,null],[195,null,60,55],[205,null,55,50]],rims:[14,15,16]});
});

gate('one author variant is appended after the same twenty stable old IDs',()=>{
  assert.equal(oldVariants.length,20);assert.equal(variants.length,21);
  assert.equal(variants.filter(v=>v.code===AUTHOR_ID).length,1);
  assert.equal(new Set(variants.map(v=>v.code)).size,21);
  assert.equal(authorIndex,20);
  assert.deepEqual(plain(variants.slice(0,20)),plain(oldVariants));
  assert.equal(author.sourceKind,'author-analogue');assert.equal(author.label,LABEL);
  assert.deepEqual(plain(author.sourceTaskIds),expectedIds);
});

gate('legacy data literal and embedded images retain exact bytes',()=>{
  const block=text=>{const start=text.indexOf('const VARIANTS = ['),end=text.indexOf('\n];',start);assert.ok(start>=0&&end>start);return text.slice(start,end+3);};
  assert.equal(block(html),block(baseTarget));
  for(const name of ['RIS1','RIS2']){
    const pattern=new RegExp('const '+name+'="([^"]+)";');
    assert.equal(html.match(pattern)?.[1],baseTarget.match(pattern)?.[1]);
  }
});

gate('the coherent author factory, eight allowed markings and all five question inputs are canonical',()=>{
  assert.deepEqual(marking(author.factory),[185,65,14]);
  assert.deepEqual(marking(author.t2),[205,50,16]);
  assert.deepEqual(marking(author.t4),[195,60,15]);
  assert.deepEqual(marking(author.t4Base),[185,60,15]);
  assert.equal(author.t4Measure,'radius');
  assert.deepEqual(marking(author.t5),[195,60,15]);
  assert.equal(author.t1.disk,15);assert.equal(author.t1.mode,'max');
  assert.deepEqual(plain(canonicalTable(author.t1.compat)),canonicalTable(expectedTable));
  const allowed=canonicalTable(author.t1.compat).flatMap(row=>row.cells.flatMap(cell=>cell.markings));
  assert.equal(allowed.length,8);
  for(const value of [author.factory,author.t2,author.t4,author.t4Base,author.t5]){
    assert.ok(allowed.some(a=>JSON.stringify(a)===JSON.stringify(marking(value))),value);
  }
});

for(let i=0;i<5;i++)gate('independent mathematics and correct units for task '+(i+1),()=>{
  const expected=[205,102.5,596.1,6,3.2][i];
  assert.equal(answers[i],expected);
  assert.equal(current.api.buildVariant(author).ans['t'+(i+1)],expected);
  assert.equal(sourceTasks[i].answer,expected);
  assert.match(normalizedText(sourceTasks[i].prompt),i===4?/процент/:/миллиметр/);
});
gate('radius difference uses two R15 wheels and percent rounding uses the factory diameter',()=>{
  const model=current.api.buildVariant(author);
  assert.equal(factoryD,59610n);assert.equal(newD,61500n);
  assert.equal(model.t4.D,615);assert.equal(model.t4Base.D,603);
  assert.equal((model.t4.D-model.t4Base.D)/2,6);
  assert.notEqual(model.ans.t4,Math.abs(model.t4.D-model.factory.D));
  assert.ok(percentNumerator*100n>=315n*percentDenominator);
  assert.ok(percentNumerator*100n<325n*percentDenominator);
  assert.equal(model.ans.t5,3.2);assert.equal(model.ans.t5x,103.2);
  assert.equal(new Set(Array.from(model.rows,t=>t.m)).size,model.rows.length);
  assert.ok(model.rows.some(t=>t.m==='185/60 R15'));
});

function semanticQuestions(v){
  const [width,profile]=marking(v.t2);
  return [
    ['allowed-width',v.t1.disk,v.t1.mode,v.t1.compat.rows.filter(r=>r.cells[v.t1.disk]).map(r=>r.w).sort((a,b)=>a-b),'mm'],
    ['height',width,profile,'mm'],
    ['diameter',marking(v.factory),'mm'],
    [v.t4Measure==='radius'?'radius-difference':'diameter-difference',marking(v.t4),marking(v.t4Base||v.factory),'mm'],
    ['travel-percent-change',marking(v.t5),marking(v.factory),1,'percent'],
  ];
}
function coherentSignature(v,build){
  const computed=build(v).ans;
  return JSON.stringify({factory:marking(v.factory),table:canonicalTable(v.t1.compat),questions:semanticQuestions(v),
    answers:[computed.t1,computed.t2,computed.t3,computed.t4,computed.t5]});
}
gate('normalized coherent-set dedup finds no old full duplicate and one final author set',()=>{
  const expected=coherentSignature(author,current.api.buildVariant);
  assert.equal(oldVariants.filter(v=>coherentSignature(v,before.api.buildVariant)===expected).length,0);
  assert.equal(variants.filter(v=>coherentSignature(v,current.api.buildVariant)===expected).length,1);
  const partial=oldVariants.find(v=>v.code==='1F235A');
  assert.deepEqual(semanticQuestions(partial)[1],semanticQuestions(author)[1]);
  assert.notEqual(partial.t2,author.t2,'Rim differs but height computation is identical');
  assert.notEqual(coherentSignature(partial,before.api.buildVariant),expected);
  const tableSet=v=>new Set(canonicalTable(v.t1.compat).flatMap(r=>r.cells.flatMap(c=>c.markings.map(JSON.stringify))));
  const authorSet=tableSet(author),overlap=tableSet(oldVariants.find(v=>v.code==='DB5DF7'));
  assert.equal([...authorSet].filter(mark=>overlap.has(mark)).length,7);
});

for(let index=0;index<20;index++)gate('preserve legacy model, seven pedagogical sections and answers: '+oldVariants[index].code,()=>{
  assert.deepEqual(plain(current.api.buildVariant(variants[index])),plain(before.api.buildVariant(oldVariants[index])));
  current.api.select(index);before.api.select(index);
  current.api.renderSections();before.api.renderSections();
  for(let section=0;section<7;section++){
    const after=current.nodes.get('section-'+section).innerHTML,old=before.nodes.get('section-'+section).innerHTML;
    assert.equal(normalizedText(after),normalizedText(old),'Changed visible text in section '+section);
    assert.deepEqual([...after.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>m[1]),[...old.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>m[1]));
  }
  const checks=current.api.checks(),oldChecks=before.api.checks();
  assert.deepEqual(Object.keys(checks),Object.keys(oldChecks));
  for(const key of Object.keys(oldChecks)){
    const a=checks[key],b=oldChecks[key];
    for(const field of ['correct','tol','stepIdx','isFinal','custom','expect','fields','okMsg']){
      assert.deepEqual(a[field]===undefined?null:plain(a[field]),b[field]===undefined?null:plain(b[field]),key+'.'+field);
    }
    if(b.hint&&typeof b.correct==='number'){
      for(const value of [0,1,b.correct-1,b.correct,b.correct+1,b.correct*2,-b.correct])assert.equal(a.hint(value),b.hint(value),key);
    }
  }
});

gate('selector contains the author once and presentation identifies its source accurately',()=>{
  current.api.populateVariants();
  const options=current.nodes.get('variant-select').children;
  assert.equal(options.length,21);
  assert.equal(options.filter(o=>o.textContent.includes(LABEL)).length,1);
  current.api.select(authorIndex);current.api.refreshVariantBar();current.api.renderSections();
  assert.ok(html.includes(DISCLAIMER));
  assert.ok([...current.nodes.values()].some(n=>n.textContent.includes(LABEL)||n.innerHTML.includes(LABEL)));
  const all=Array.from({length:7},(_,i)=>current.nodes.get('section-'+i).innerHTML).join('\n');
  assert.ok(!/data:image\/png|<img\b/.test(all),'Author mode must not display legacy raster references');
  const q4=normalizedText(current.nodes.get('section-5').innerHTML);
  assert.match(q4,/радиус/);assert.ok(q4.includes('195/60 R15')&&q4.includes('185/60 R15'));
  const expectedFinalIds=['t1-final','t2-H','t3-D','t4-diff','t5-final'];
  expectedFinalIds.forEach((id,i)=>{
    assert.equal(current.api.checks()[id].correct,answers[i]);
    assert.equal(current.api.checks()[id].stepIdx,i+2);
    assert.equal(current.api.checks()[id].isFinal,true);
  });
});

gate('exact author deep link is deterministic and invalid or absent parameters preserve old default selection',()=>{
  const choose=current.api.initialVariantIndex;assert.equal(typeof choose,'function');
  for(const saved of [{},{selectedCode:oldVariants[7].code},{selectedCode:'unknown'}]){
    const fallback=saved.selectedCode===oldVariants[7].code?7:0;
    assert.equal(choose(saved,'?variant='+AUTHOR_ID),20);
    for(const search of [
      '', '?x=1','?variant=unknown','?variant=OGE-2027-ANALOGUE-1','?variant=0','?variant='+AUTHOR_ID+'x',
      '?variant='+AUTHOR_ID+'&variant='+AUTHOR_ID,
      '?variant='+AUTHOR_ID+'&variant=unknown',
      '?variant=unknown&variant='+AUTHOR_ID,
      '?variant='+AUTHOR_ID+'&variant=',
    ])assert.equal(choose(saved,search),fallback,search);
  }
});

gate('saving the author preserves old per-variant records and unrelated storage values',()=>{
  const h=harness(html),oldCode=oldVariants[0].code;
  const oldRecord={solvedSteps:[true,false,true,false,false,false,false],streak:2,currentStep:2};
  const seed={selectedCode:oldCode,mode:'practice',byCode:{[oldCode]:oldRecord,legacyOther:{solvedSteps:[true],streak:1,currentStep:0}}};
  h.storage.set('tiresTrainerV2',JSON.stringify(seed));
  h.storage.set('mathExamCourseProgress.v1',JSON.stringify({unrelated:{solved:7,total:8}}));
  h.storage.set('foreign-key','unchanged');
  h.api.select(20);
  const authorProgress={solvedSteps:[false,true,false,true,false,false,true],streak:3,currentStep:6};
  h.api.setProgress(authorProgress);h.api.saveStore();
  const saved=JSON.parse(h.storage.get('tiresTrainerV2'));
  assert.deepEqual(saved.byCode[oldCode],oldRecord);
  assert.deepEqual(saved.byCode.legacyOther,seed.byCode.legacyOther);
  assert.deepEqual(saved.byCode[AUTHOR_ID],authorProgress);
  assert.equal(saved.selectedCode,AUTHOR_ID);
  assert.equal(h.storage.get('foreign-key'),'unchanged');
  assert.deepEqual(JSON.parse(h.storage.get('mathExamCourseProgress.v1')).unrelated,{solved:7,total:8});
  assert.deepEqual([...new Set(h.writes)].sort(),['mathExamCourseProgress.v1','tiresTrainerV2']);
  assert.equal(h.api.STORAGE_KEY,before.api.STORAGE_KEY);
});

gate('inline JavaScript is valid and no new external execution, source PDF or foreign storage authority appears',()=>{
  const executable=scriptOf(html);
  const syntax=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:executable,encoding:'utf8'});
  assert.equal(syntax.status,0,syntax.stderr);
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b|\beval\s*\(|\bnew\s+Function\b|localStorage\.clear\s*\(/.test(executable));
  assert.ok(!/<script\b[^>]*src\s*=|@import\b|url\(\s*["']?(?:https?:)?\/\//i.test(html));
  assert.ok(!/\.pdf(?:[?#"'\s<]|$)/i.test(html));
  const storageKeys=text=>[...scriptOf(text).matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*([^,)]+)/g)].map(m=>m[1].trim()).sort();
  assert.deepEqual(storageKeys(html),storageKeys(baseTarget));
  assert.ok(!/(?:[A-Za-z]:[\\/](?:Users|home|tmp)[\\/])|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(html));
});

gate('changed files stay inside the six paths approved for this bounded batch',()=>{
  const allowed=new Set([targetPath,'tools/oge-2027-analogue-distribute-1-5.test.mjs','tools/oge-2027-analogue-distribute-1-5.browser.mjs',
    'docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_1_5.md','tools/trainer-inventory/test/inventory.test.mjs','tools/oge-2027-analogue-1.test.mjs']);
  const changed=new Set([...git('diff','--name-only',BASE).toString().trim().split(/\r?\n/),
    ...git('ls-files','--others','--exclude-standard').toString().trim().split(/\r?\n/)].filter(Boolean));
  assert.deepEqual([...changed].sort(),[...allowed].sort());
  for(const file of changed)assert.ok(allowed.has(file),'Out of scope: '+file);
  for(const file of [sourcePath,'sitemap.xml','trainers/oge-course/index.html','trainers/board-compat.json']){
    assert.equal(git('diff','--name-only',BASE,'--',file).toString().trim(),'','Protected file changed: '+file);
  }
});
