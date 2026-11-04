'use strict';
// Exercise the real controller and authored proof bank. Scene mounting is unrelated
// to these buttons and is replaced with a small lifecycle stub.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),C=require(root+'/stereo-course/data/course.json'),PROOFS=require(root+'/stereo-course/data/proofs.json');
const links={polyhedra:'section',coordinates:'box-diagonal','sphere-equation':'sphere-cut','plane-equation':'dot',transformations:'scale',slices:'pyramid-volume','pyramid-frustum':'frustum',sphere:'sphere-cut',box:'box-diagonal'};
for(const unit of C.units)if(links[unit.id])unit.proof=links[unit.id];
function boot(id){
 const dom=new JSDOM('<header><button id="home"></button><nav class="toplinks"></nav><button id="export-progress"></button></header><p id="storage-notice" hidden></p><main id="app"></main>',{url:'https://example.test/stereo-course/#'+id,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.STEREO_COURSE=C;w.STEREO_PROOFS=PROOFS;
 const mount=(el,options)=>{el.innerHTML='<svg></svg>';return{setStep(){},getState:()=>options.savedCamera||{yaw:.6,pitch:.4},destroy(){}};};
 w.StereoTaskScenes={mount,mountProof:mount};w.SpaceViewer={mount};
 for(const file of ['answer.js','tasks.js','store.js','math-text.js','app.js'])w.eval(fs.readFileSync(root+'/stereo-course/assets/'+file,'utf8'));
 w.document.querySelector('[data-stage="2"]').click();
 return {w,dom,doc:w.document,state:()=>JSON.parse(w.localStorage.getItem('mathExamStereo.v1')).units[id]};
}
function clickChild(button){
 assert.ok(button,'expected button');
 const child=button.querySelector('.stereo-numerator')||button.firstElementChild;
 assert.ok(child,'authored choice has rendered child content');
 child.click();
}
const seenFractions=new Set();let choices=0,reasons=0,steps=0;
function checkChoice(button,raw){
 assert.equal(button.getAttribute('aria-label'),raw,'accessible name is the exact authored text');
 assert.equal(button.children.length,1,'one content wrapper, no duplicate text');
 assert.equal(button.firstElementChild.className,'proof-choice-text');
 assert.equal(button.firstElementChild.getAttribute('aria-hidden'),'true','button aria-label supplies its complete name');
 const display=button.cloneNode(true);
 for(const f of display.querySelectorAll('.stereo-fraction')){
  const numerator=f.querySelector('.stereo-numerator').textContent,denominator=f.querySelector('.stereo-denominator').textContent;
  seenFractions.add(numerator+'/'+denominator);f.replaceWith(numerator+'/'+denominator);
 }
 assert.equal(display.textContent,raw,'visual operands, punctuation and surrounding words are preserved');
}
assert.equal(Object.keys(PROOFS).length,19);
for(const [key,proof] of Object.entries(PROOFS)){
 const unit=C.units.find(u=>(u.proof||u.task)===key);assert.ok(unit,key+' has a course destination');
 const e=boot(unit.id);
 try{
  for(let i=0;i<proof.steps.length;i++){
   const options=[...e.doc.querySelectorAll('.proof-options button[data-proof]')];
   assert.deepEqual(options.map(b=>Number(b.dataset.proof)),proof.steps.map((_,n)=>n).slice(i,i+3).reverse(),key+' current choice window');
   for(const option of options){
    const index=Number(option.dataset.proof);checkChoice(option,proof.steps[index].text);choices++;
    if(index!==i){clickChild(option);assert.equal(e.state().proofDone.length,i,'out-of-order choice cannot advance');assert.equal(e.doc.querySelector('.reason-panel'),null);}
   }
   const trap=e.doc.querySelector('[data-action="visual-trap"]');
   checkChoice(trap,'Это следует из того, как выглядит рисунок.');clickChild(trap);
   assert.equal(e.state().proofDone.length,i,'visual trap cannot advance');
   const current=e.doc.querySelector('[data-proof="'+i+'"]');let directClicks=0;
   current.addEventListener('click',()=>directClicks++);clickChild(current);
   assert.equal(directClicks,1,'nested text/fraction click retains direct button listener');
   assert.strictEqual(e.doc.querySelector('[data-proof="'+i+'"]'),current,'reason insertion retains original choice button');
   assert.equal(current.dataset.proof,String(i));
   const reasonButtons=[...e.doc.querySelectorAll('.reason-panel .proof-options button')];
   assert.equal(reasonButtons.length,3);
   const authoredReasons=['Используем вывод, который сейчас доказываем.',proof.steps[i].reason,'Совпали измерения на рисунке.'];
   reasonButtons.forEach((button,n)=>{checkChoice(button,authoredReasons[n]);reasons++;});
   for(const bad of reasonButtons.filter(b=>b.dataset.action==='bad-reason')){clickChild(bad);assert.equal(e.state().proofDone.length,i,'incorrect reason cannot advance');}
   const good=reasonButtons[1];assert.equal(good.dataset.action,'good-reason');let reasonClicks=0;
   good.addEventListener('click',()=>reasonClicks++);clickChild(good);
   assert.equal(reasonClicks,1,'nested reason content retains direct listener');
   assert.deepEqual(e.state().proofDone,proof.steps.slice(0,i+1).map((_,n)=>'s'+n),'delegated good-reason action advances exactly once');
   steps++;
  }
  assert.equal(e.state().proof,true,key+' proof complete');
  assert.equal(e.doc.querySelector('.reason-panel'),null,'completed proof has no stale choices');
 }finally{e.dom.window.close();}
}
// Representative real authored fractions cover segment names, variables and powers
// in both original choices and dynamically created reason buttons.
for(const expression of ['BC/2','SH/3','z/H','z³/3'])assert.ok(seenFractions.has(expression),expression+' uses a fraction bar');
console.log('STEREO_PROOF_CHOICE_FRACTIONS_OK: 19 proofs, '+steps+' steps, '+choices+' authored choices, '+reasons+' reason buttons; exact accessible labels and delegated child clicks');
