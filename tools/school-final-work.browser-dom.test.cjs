const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const base='https://math.test',dir='trainers/school-workshop-check';
const html=fs.readFileSync(path.join(root,dir,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].filter(m=>!m[1].startsWith('/assets/assistant/')).map(m=>path.normalize(path.join(root,dir,m[1])));
function scriptFor(w,privateBlock,clearStore){
 if(clearStore) w.localStorage.setItem(clearStore[0],clearStore[1]);
 w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollIntoView=function(){};
 if(privateBlock) for(const k of ['setItem','getItem']) w.Storage.prototype[k]=()=>{throw Error('private store in board')};
 for(const p of scripts)w.eval(fs.readFileSync(p,'utf8'));
}
function standalone(course,previous){const dom=new JSDOM(html,{url:base+'/'+dir+'/index.html?course='+course,runScripts:'outside-only'});scriptFor(dom.window,false,previous);return dom;}
function input(w,id,value){const a=w.document.querySelector(id);a.value=value;a.dispatchEvent(new w.Event('input',{bubbles:true}));}
function click(w,s){const b=w.document.querySelector(s);assert(b,s);b.click();}
function submit(w){w.document.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
let checks=0,figures=0;
for(const course of ['5','6','7','8','9','10','11','foundation','probability','vilenkin5','vilenkin6','makarychev7-start','makarychev9']){
 let dom=standalone(course),w=dom.window;const key='mathexam:school-final:v1:'+course;
 input(w,'#answer','77777');submit(w);
 const retained=w.localStorage.getItem(key);dom.window.close();dom=standalone(course,[key,retained]);w=dom.window;
 assert.equal(w.document.querySelector('#answer').value,'77777');assert.match(w.document.querySelector('#feedback').textContent,/не сходится/);
 for(let i=0;i<6;i++){
  click(w,'[data-action=hint]');assert(w.document.querySelector('#concept-model .model-image > *'),course+' svg '+i);figures++;
  const slider=w.document.querySelector('#model-slider');if(slider&&!slider.parentElement.hidden)input(w,'#model-slider','100');
  const s=JSON.parse(w.localStorage.getItem(key));const skill=s.items[s.results.length];assert(w.WorkshopCurriculum.pathById[course].ids.includes(skill));
  const t=w.WorkshopMath.generate(skill,s.variant+s.results.length*173);const word=a=>Array.isArray(a)?a.map(word).join('; '):typeof a==='object'?w.WorkshopMath.fmt(a):String(a);
  let ans=word(t.answer);
  if(t.answerFormat==='decimal')ans=String((t.answer.n??t.answer)/(t.answer.d??1)).replace('.',',')+((t.answer.n??t.answer)%(t.answer.d??1)===0?',0':'');
  if(i===5 && course==='5')click(w,'[data-action=skip]');
  else {input(w,'#answer',ans);submit(w);assert.match(w.document.querySelector('#feedback').textContent,/Верно/,course+' '+i+' '+ans);click(w,'[data-action=next]');}
  checks++;
 }
 assert.equal(w.document.querySelectorAll('.result-list li').length,6);const done=w.localStorage.getItem(key);
 dom.window.close();dom=standalone(course,[key,done]);w=dom.window;
 assert(w.document.querySelector('.result-list'));click(w,'[data-action=retry]');assert(w.document.querySelector('#problem'));
 dom.window.close();
}
const parent=new JSDOM('<iframe></iframe><iframe></iframe>',{url:base+'/board',runScripts:'outside-only'});
const pw=parent.window,peers=[];
for(const el of pw.document.querySelectorAll('iframe')){el.src=base+'/'+dir+'/index.html?course=10';const w=el.contentWindow;assert(w!==w.top);w.document.open();w.document.write(html);w.document.close();const peer={w};peers.push(peer);}
const post=(peer,envelope,fields)=>peer.w.dispatchEvent(new peer.w.MessageEvent('message',{origin:base,source:pw,data:{...envelope,...fields}}));
for(const peer of peers){
 const w=peer.w;
 const original=pw.postMessage;
 pw.postMessage=function(d){if(d.type==='mathexam:trainer-ready')peer.ready=d;else if(d.type==='mathexam:trainer-state')peer.last=d.state;};
 scriptFor(w,true);pw.postMessage=original;
 assert(peer.ready,'registered');post(peer,peer.ready,{type:'mathexam:hydrate',mode:'empty'});
}
pw.postMessage=function(d){if(d.type!=='mathexam:trainer-state')return;const from=peers.find(p=>p.ready.bridgeInstanceId===d.bridgeInstanceId);from.last=d.state;const to=peers.find(p=>p!==from);post(to,to.ready,{type:'mathexam:apply-trainer-state',state:to.w.JSON.parse(JSON.stringify(d.state))});};
const [teacher,student]=peers;
input(teacher.w,'#answer','123');await wait(140);assert.equal(student.w.document.querySelector('#answer').value,'123');
click(teacher.w,'[data-action=hint]');await wait(120);assert(student.w.document.querySelector('#concept-model svg'));
input(teacher.w,'#model-slider','100');await wait(120);assert.equal(student.w.document.querySelector('#model-slider').value,'100');
click(student.w,'[data-action=skip]');await wait(120);assert.match(teacher.w.document.querySelector('#work').textContent,/Задание 2 из 6/);
assert.equal(teacher.w.localStorage.length,0);
parent.window.close();console.log({checks,figures,routeCount:13,storage:'resume and completed state',mirror:'2 iframe handoff, answer, help, slider, skip, isolated storage'});
})().catch(e=>{console.error(e);process.exitCode=1});
