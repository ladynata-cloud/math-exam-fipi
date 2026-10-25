'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
class Local extends ResourceLoader{fetch(url){const u=new URL(url);if(u.origin!=='https://mathexam.space')return null;const f=path.join(root,u.pathname);return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
const clone=(w,x)=>w.JSON.parse(JSON.stringify(x));
async function load(n,board=true){const route=`trainers/oge-task${n}-${{16:'circle',17:'quadrilaterals',18:'grid'}[n]}.html`,errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(path.join(root,route),'utf8'),{url:'https://mathexam.space/'+route+(board?'?board=1':''),runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.localStorage.setItem('mathExamCourseProgress.v1','{"private-sentinel":{"solved":99},"'+({16:'oge-task16-circle',17:'oge-task17-quadrilaterals',18:'oge-task18-grid'}[n])+'":{"runs":77,"best":10}}');}});await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));assert.deepEqual(errors,[]);return{dom,w:dom.window,d:dom.window.document,errors};}
const tick=()=>new Promise(r=>setTimeout(r,0));
const state=w=>JSON.stringify(w.OgeGeometryBoard.getState());
const native=n=>n===16?'trTask':n===17?'CUR':'TR.task';
const ids=n=>({answer:n===18?'ansIn':'ans',check:{16:'check',17:'chk',18:'chkBtn'}[n],next:{16:'next',17:'nxt',18:'nextBtn'}[n],give:{16:'giveup',17:'give',18:'giveBtn'}[n]});
function fill(w,d,id,value){d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('input',{bubbles:true}));}
function projection(d,n){return JSON.stringify({task:d.querySelector(n===17?'.qtext':'.task')?.textContent,figure:d.querySelector(n===16?'.diagram svg':n===17?'.fig svg':'.figwrap svg')?.outerHTML.replace(/(?:id=\"p|url\(#p)\d+/g,m=>m.replace(/\d+$/,'ID')),feedback:d.getElementById('fb')?.textContent,input:d.getElementById(ids(n).answer)?.value,disabled:d.getElementById(ids(n).answer)?.disabled,steps:d.querySelector(n===17?'#ssol':'#solBox')?.textContent,model:d.querySelector('.ocg-reading')?.textContent});}
for(const n of [16,17,18]){
 test(`OGE${n}: all native types, controls, two-view restore and completed work`,async()=>{
  const a=await load(n),b=await load(n);try{
   const before=a.w.localStorage.getItem('mathExamCourseProgress.v1'),peerBefore=b.w.localStorage.getItem('mathExamCourseProgress.v1');
   const keys=a.w.eval(n===17?'Object.keys(S17)':'Object.keys(SUBS)');assert.equal(keys.length,{16:33,17:38,18:15}[n]);
   for(const key of keys){
    const picker=a.d.getElementById('oge-board-subtype');picker.value=key;picker.dispatchEvent(new a.w.Event('change',{bubbles:true}));await tick();
    const input=ids(n).answer;fill(a.w,a.d,input,'999999');a.d.getElementById(ids(n).check).click();await tick();
    a.d.getElementById('courseHintToggle').click();const lab=a.d.querySelector('[data-geometry-model]');lab.open=true;
    for(const range of lab.querySelectorAll('input')){range.value=range.max;range.dispatchEvent(new a.w.Event('input',{bubbles:true}));}
    for(const button of lab.querySelectorAll('.ocg-controls button'))button.click();
    a.d.querySelectorAll('#courseHintPanel details').forEach(el=>el.open=true);
    if(n===17&&a.w.eval('CUR.sol.length')>1)a.d.getElementById('stepH').click();
    if(n===18)a.d.getElementById('hintBtn').click();
    const answer=a.w.eval(native(n)+'.ans');fill(a.w,a.d,input,String(answer));await tick();
    const packet=clone(b.w,a.w.OgeGeometryBoard.getState());assert.ok(b.w.OgeGeometryBoard.validateState(packet),key);
    b.w.OgeGeometryBoard.applyState(packet);await tick();assert.equal(state(b.w),state(a.w),key+' pending');assert.equal(projection(b.d,n),projection(a.d,n),key+' visual');
    b.d.getElementById(ids(n).check).click();await tick();assert.match(b.d.getElementById('fb').textContent,/Верно/);assert.equal(b.d.getElementById(input).disabled,true);assert.match(b.d.getElementById('fb').textContent,/подсказк|разобран/);
    a.w.OgeGeometryBoard.applyState(clone(a.w,b.w.OgeGeometryBoard.getState()));await tick();assert.equal(state(a.w),state(b.w));assert.equal(projection(a.d,n),projection(b.d,n));
    const stored=state(a.w);a.d.getElementById(ids(n).check).click();await tick();assert.equal(state(a.w),stored,'disabled repeat preserves work');
   }
   assert.equal(a.w.localStorage.getItem('mathExamCourseProgress.v1'),before);assert.equal(b.w.localStorage.getItem('mathExamCourseProgress.v1'),peerBefore);assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
  }finally{a.dom.window.close();b.dom.window.close();}
 });
 test(`OGE${n}: semantic validation rejects malformed snapshots atomically`,async()=>{
  const {dom,w,d}=await load(n);try{
   const original=state(w),valid=w.OgeGeometryBoard.getState();
   const cases=[];
   function bad(fn){const x=clone(w,valid);fn(x);cases.push(x);}
   bad(x=>x.task.key='not-a-task');bad(x=>x.task.value=-1);bad(x=>x.task.source='raw-html');bad(x=>x.task.extra='x');bad(x=>x.filter.topic='unknown');bad(x=>x.answer='<img src=x>');bad(x=>x.model.controls[Object.keys(x.model.controls)[0]]=999999);bad(x=>x.actions.push(['run','',false]));bad(x=>x.actions.push(['check','',false,'extra']));bad(x=>x.helpOpen=true);bad(x=>x.details.push('yes'));bad(x=>x.details=[]);bad(x=>x.referenceZoom.push(false));bad(x=>x.model.open=true);bad(x=>{x.actions.length=1;});
   let getterRead=false;const getter=clone(w,valid);Object.defineProperty(getter,'answer',{enumerable:true,get(){getterRead=true;throw Error('getter');}});cases.push(getter);
   for(const value of cases){assert.equal(w.OgeGeometryBoard.validateState(value),false);assert.throws(()=>w.OgeGeometryBoard.applyState(value),/Invalid geometry/);assert.equal(state(w),original);}
   assert.equal(getterRead,false);
  }finally{dom.window.close();}
 });
 test(`OGE${n}: standalone assistance remains sticky and completed answer locks`,async()=>{
  const {dom,w,d}=await load(n,false);try{
   assert.equal(w.OgeGeometryBoard,undefined);
   const key=w.eval(native(n)+(n===16?'.k':n===17?'.key':'.sub'));
   const correct=w.eval(native(n)+'.ans');d.getElementById('courseHintToggle').click();d.getElementById('courseHintToggle').click();fill(w,d,ids(n).answer,String(correct));d.getElementById(ids(n).check).click();await tick();
   assert.match(d.getElementById('fb').textContent,/Верно/);assert.equal(d.getElementById(ids(n).answer).disabled,true);
   const progress=JSON.parse(w.localStorage.getItem('mathExamCourseProgress.v1'));assert.equal(progress['oge-task'+n+'-'+{16:'circle',17:'quadrilaterals',18:'grid'}[n]].solvedByType?.[key]||0,0);assert.equal(progress['private-sentinel'].solved,99);
  }finally{dom.window.close();}
 });
}
for(const n of [16,17,18])test(`OGE${n}: archive descriptors, new tasks, and bounded repeated feedback`,async()=>{
 const a=await load(n),b=await load(n);try{
  // Archive content stays native and is identified by index rather than transmitted text/SVG.
  a.w.eval(n===16?'trTask=buildArchive(ARCHIVE[0]);trDone=false;trAtt=2;renderTrain();':n===17?'CUR=build(ARCHIVE[0].sub,ARCHIVE[0].p,{gen:false,srcLab:srcLabel(ARCHIVE[0],true),note:S17[ARCHIVE[0].sub].note});renderTrain(false);':'TR.task=archTask(ARCHIVE[0]);TR.done=false;drawTrain();');
  // Same-valued new tasks must not inherit the discovery helper's draft cache.
  const answerField=ids(n).answer;fill(a.w,a.d,answerField,'777');
  a.w.eval(n===16?'trTask=buildArchive(ARCHIVE[0]);trDone=false;trAtt=2;renderTrain();':n===17?'CUR=build(ARCHIVE[0].sub,ARCHIVE[0].p,{gen:false,srcLab:srcLabel(ARCHIVE[0],true),note:S17[ARCHIVE[0].sub].note});renderTrain(false);':'TR.task=archTask(ARCHIVE[0]);TR.done=false;drawTrain();');
  let packet=a.w.OgeGeometryBoard.getState();assert.equal(packet.answer,'');assert.equal(packet.task.source,'archive');assert.equal(packet.task.value,0);b.w.OgeGeometryBoard.applyState(clone(b.w,packet));assert.equal(projection(a.d,n),projection(b.d,n));
  const input=ids(n).answer;
  for(let i=0;i<140;i++){fill(a.w,a.d,input,'999999');a.d.getElementById(ids(n).check).click();if(n===18)a.d.getElementById('hintBtn').click();}
  await tick();packet=a.w.OgeGeometryBoard.getState();assert.ok(packet.actions.length<=7);assert.ok(b.w.OgeGeometryBoard.validateState(clone(b.w,packet)));b.w.OgeGeometryBoard.applyState(clone(b.w,packet));assert.equal(projection(a.d,n),projection(b.d,n));
  const correct=a.w.eval(native(n)+'.ans');fill(a.w,a.d,input,String(correct));a.d.getElementById(ids(n).check).click();await tick();b.w.OgeGeometryBoard.applyState(clone(b.w,a.w.OgeGeometryBoard.getState()));assert.equal(projection(a.d,n),projection(b.d,n));
  a.d.getElementById(ids(n).next).click();await tick();packet=a.w.OgeGeometryBoard.getState();assert.equal(packet.actions.length,0);assert.equal(packet.helpUsed,false);assert.equal(packet.answer,'');b.w.OgeGeometryBoard.applyState(clone(b.w,packet));assert.equal(projection(a.d,n),projection(b.d,n));assert.ok([...a.d.querySelectorAll('.stats,.pnote')].every(node=>node.hidden));
 }finally{a.dom.window.close();b.dom.window.close();}
});
test('OGE17: opening every solution step after a correct answer mirrors the retained solution',async()=>{
 const a=await load(17),b=await load(17);try{
  const answer=String(a.w.eval('CUR.ans'));fill(a.w,a.d,'ans',answer);a.d.getElementById('chk').click();await tick();assert.equal(a.d.getElementById('chk').disabled,true);
  a.d.getElementById('courseHintToggle').click();
  const total=a.w.eval('CUR.sol.length');
  for(let index=0;index<total;index++){
   a.d.getElementById('stepH').click();await tick();
   const packet=a.w.OgeGeometryBoard.getState();assert.equal(packet.actions.filter(x=>x[0]==='step').length,index+1);
   b.w.OgeGeometryBoard.applyState(clone(b.w,packet));await tick();assert.equal(state(b.w),state(a.w));assert.equal(projection(b.d,17),projection(a.d,17));assert.equal(b.d.querySelectorAll('#ssol .step').length,index+1);
  }
  assert.equal(a.d.getElementById('stepH').disabled,true);
 }finally{a.dom.window.close();b.dom.window.close();}
});
for(const n of [16,17,18])test(`OGE${n}: completed answer and action history must agree before hydration`,async()=>{
 const {dom,w,d}=await load(n);try{
  const original=state(w),base=w.OgeGeometryBoard.getState(),answer=String(w.eval(native(n)+'.ans'));
  const badDraft=clone(w,base);badDraft.actions=clone(w,[['check',answer,false]]);badDraft.answer='99999';assert.equal(w.OgeGeometryBoard.validateState(badDraft),false);assert.throws(()=>w.OgeGeometryBoard.applyState(badDraft),/Invalid geometry/);assert.equal(state(w),original);
  const extraCheck=clone(w,base);extraCheck.actions=clone(w,[['check',answer,false],['check',answer,false]]);extraCheck.answer=answer;assert.equal(w.OgeGeometryBoard.validateState(extraCheck),false);assert.throws(()=>w.OgeGeometryBoard.applyState(extraCheck),/Invalid geometry/);assert.equal(state(w),original);
  const extraGive=clone(w,base);extraGive.actions=clone(w,[['check',answer,false],['give',answer,true]]);extraGive.answer=answer;extraGive.helpUsed=true;assert.equal(w.OgeGeometryBoard.validateState(extraGive),false);assert.throws(()=>w.OgeGeometryBoard.applyState(extraGive),/Invalid geometry/);assert.equal(state(w),original);
  if(n===17){const afterGive=clone(w,base);afterGive.actions=clone(w,[['give','',true],['step','',true]]);afterGive.helpUsed=true;assert.equal(w.OgeGeometryBoard.validateState(afterGive),false);assert.throws(()=>w.OgeGeometryBoard.applyState(afterGive),/Invalid geometry/);assert.equal(state(w),original);const tooMany=clone(w,base),total=w.eval('CUR.sol.length');tooMany.actions=clone(w,Array.from({length:total+1},()=>['step','',true]));tooMany.helpUsed=true;assert.equal(w.OgeGeometryBoard.validateState(tooMany),false);assert.throws(()=>w.OgeGeometryBoard.applyState(tooMany),/Invalid geometry/);assert.equal(state(w),original);}
  fill(w,d,ids(n).answer,answer);d.getElementById(ids(n).check).click();await tick();const correct=w.OgeGeometryBoard.getState();assert.equal(w.OgeGeometryBoard.validateState(correct),true);w.OgeGeometryBoard.applyState(correct);assert.equal(d.getElementById(ids(n).answer).value,answer);assert.equal(d.getElementById(ids(n).answer).disabled,true);
 }finally{dom.window.close();}
});
