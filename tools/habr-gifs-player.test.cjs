'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync(path.join(__dirname,'../assets/habr-entry-gifs.js'),'utf8');
const plans=require('./habr-gifs-capture-20261119.json').clips;
const flush=()=>new Promise(resolve=>setTimeout(resolve,45));
function mediaFor(clip) {
  const frames=clip.frames.map((f,i)=>({file:`frame-${String(i+1).padStart(2,'0')}.png`,caption:f.caption,durationMs:1500}));
  return {schemaVersion:1,complete:true,clips:[{id:clip.id,sourcePage:clip.url,complete:true,frameCount:frames.length,frames,files:Object.fromEntries([...frames.map(f=>[f.file,{}]),[clip.id+'.gif',{}]])}]};
}
async function fixture(clip,options={}) {
  const markup=options.markup||'<main><section class="card">Synthetic trainer control</section></main>';
  const dom=new JSDOM(markup,{url:'https://mathexam.space'+clip.url,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;let calls=0,observer;
  const motion={matches:!!options.reduced,addEventListener(_,fn){this.changed=fn;}};
  w.matchMedia=()=>motion;
  w.IntersectionObserver=class {constructor(fn){observer=fn;}observe(){}disconnect(){}};
  Object.defineProperty(w,'localStorage',{get(){throw Error('No storage access permitted');}});
  Object.defineProperty(w,'sessionStorage',{get(){throw Error('No storage access permitted');}});
  w.fetch=async url=>{calls++;assert.equal(url,'/assets/habr-entry-gifs/media.json');return{ok:true,json:async()=>options.media||{schemaVersion:1,complete:true,clips:plans.flatMap(p=>mediaFor(p).clips)}};};
  w.eval(code);await flush();
  return {w,dom,motion,calls:()=>calls,offscreen:()=>observer([{isIntersecting:false}]),close:()=>{w.dispatchEvent(new w.PageTransitionEvent("pagehide",{persisted:false}));w.close();}};
}
function clickText(w,text) {const b=[...w.document.querySelectorAll('.habr-gif-help button')].find(b=>b.textContent===text);assert(b,text);b.click();return b;}
test('help is lazy; poster/manual frames/transcript work; one explicit animation stops on close/offscreen',async()=>{
  const f=await fixture(plans[0]);try{
    const d=f.w.document,panel=d.querySelector('.habr-gif-help');assert(panel);assert.equal(f.calls(),0);assert.equal(d.querySelectorAll('.habr-gif-help img').length,0);
    panel.open=true;await flush();assert.equal(f.calls(),1);
    const img=d.querySelector('.habr-gif-help img');assert(img.src.endsWith('frame-01.png'));assert.equal(d.querySelectorAll('.habr-gif-transcript li').length,4);
    clickText(f.w,'Воспроизвести GIF');assert(img.src.endsWith('.gif'));assert.equal(d.querySelector('[aria-pressed="true"]').textContent,'Остановить GIF');
    clickText(f.w,'Следующий кадр →');assert(img.src.endsWith('frame-02.png'));assert(d.querySelector('.habr-gif-caption').textContent.includes('2 из 4'));
    clickText(f.w,'Воспроизвести GIF');assert.match(d.querySelector('.habr-gif-caption').textContent,/Анимация всех/);f.offscreen();assert(img.src.endsWith('frame-01.png'));
    clickText(f.w,'Воспроизвести GIF');panel.open=false;await flush();assert(img.src.endsWith('.png'));
    panel.open=true;await flush();assert.equal(f.calls(),1,'already loaded media is reused');
  }finally{f.close();}
});
test('reduced motion offers all manual frames and prevents GIF playback',async()=>{
  const f=await fixture(plans[0],{reduced:true});try{
    f.w.document.querySelector('.habr-gif-help').open=true;await flush();
    const b=clickText(f.w,'Воспроизвести GIF');assert(b.disabled);assert(f.w.document.querySelector('.habr-gif-help img').src.endsWith('.png'));
    clickText(f.w,'Следующий кадр →');assert(f.w.document.querySelector('.habr-gif-help img').src.endsWith('frame-02.png'));
    f.motion.matches=false;f.motion.changed();assert(!b.disabled);b.click();assert(f.w.document.querySelector('.habr-gif-help img').src.endsWith('.gif'));
    f.motion.matches=true;f.motion.changed();assert(b.disabled);assert(f.w.document.querySelector('.habr-gif-help img').src.endsWith('.png'));
  }finally{f.close();}
});
test('missing/incomplete media shows neutral help without any broken image',async()=>{
  const f=await fixture(plans[0],{media:{schemaVersion:1,complete:false,clips:[]}});try{
    f.w.document.querySelector('.habr-gif-help').open=true;await flush();
    assert.match(f.w.document.querySelector('.habr-gif-content').textContent,/готовится/);assert.equal(f.w.document.querySelectorAll('.habr-gif-help img').length,0);
  }finally{f.close();}
});
test('leaving an exact route removes help and stops animation; no other task gains a panel',async()=>{
  const f=await fixture(plans[6],{markup:'<section class="workbench">Synthetic section model</section>'});try{
    const panel=f.w.document.querySelector('.habr-gif-help');assert.equal(panel.dataset.habrGif,'habr-sections-starter18');
    panel.open=true;await flush();clickText(f.w,'Воспроизвести GIF');
    f.w.location.hash='unrelated';await flush();assert.equal(f.w.document.querySelectorAll('.habr-gif-help').length,0);
    f.w.location.hash='auth-core-05';await flush();assert.equal(f.w.document.querySelector('.habr-gif-help').dataset.habrGif,'habr-sections-authcore05');assert(!f.w.document.querySelector('.habr-gif-help').open);
  }finally{f.close();}
});
test('an iframe exits before fetching, mounting, observing or reading storage',()=>{
  vm.runInNewContext(code,{window:{top:{},self:{}},document:{readyState:'complete'}});
});
test('media cannot redirect image paths outside the approved clip directory',async()=>{
  const media=mediaFor(plans[0]);media.clips[0].frames[0].file='../other.png';
  const f=await fixture(plans[0],{media});try{f.w.document.querySelector('.habr-gif-help').open=true;await flush();assert.equal(f.w.document.querySelectorAll('.habr-gif-help img').length,0);}finally{f.close();}
});

test('late image failure from a removed route cannot damage the new clip',async()=>{
  const f=await fixture(plans[6],{markup:'<section class="workbench">Synthetic section model</section>'});try{
    f.w.document.querySelector('.habr-gif-help').open=true;await flush();
    const oldImage=f.w.document.querySelector('.habr-gif-help img');
    f.w.location.hash='auth-core-05';await flush();f.w.document.querySelector('.habr-gif-help').open=true;await flush();
    const currentImage=f.w.document.querySelector('.habr-gif-help img');assert.notEqual(oldImage,currentImage);
    clickText(f.w,'Воспроизвести GIF');oldImage.dispatchEvent(new f.w.Event('error'));
    assert(!currentImage.hidden);assert(currentImage.src.endsWith('.gif'));
  }finally{f.close();}
});
