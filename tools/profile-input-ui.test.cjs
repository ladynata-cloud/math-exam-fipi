'use strict';
// Run with jsdom available (the ege-profil package declares it).
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function open(area,hash){
 const file=path.join(root,'ege-profil',area,'index.html');
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/ege-profil/'+area+'/index.html#'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.scrollTo=()=>{};
 for(const script of dom.window.document.querySelectorAll('script[src]'))dom.window.eval(fs.readFileSync(path.resolve(path.dirname(file),script.getAttribute('src')),'utf8'));
 return dom;
}
function submit(dom,value){const w=dom.window,d=w.document;d.querySelector('#answer-form input[type=text]').value=value;d.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));return d.querySelector('#feedback').textContent;}
function saved(dom,key){return JSON.parse(dom.window.localStorage.getItem(key));}
const circleKey='mathexam.mordkovichCircle.v1',startKey='mathexam.profileStart2027.v1';
for(const area of ['circle','start']){
 const circle=area==='circle',session=circle?'m4-1-am:independent':'vec-coordinates:independent';
 const dom=open(area,circle?'task/m4-1-am/independent':'practice/vec-coordinates/independent');
 const key=circle?circleKey:startKey;
 assert.match(submit(dom,'3π/'),/Не удалось прочитать/);assert(!saved(dom,key).sessions[session].wrong);
 if(circle){assert.match(submit(dom,'3/4π'),/^Верно/);dom.window.document.getElementById('next').click();assert(saved(dom,key).records['m4-1-am'].independent);}
 else {assert.match(submit(dom,'999999'),/Пока не сходится/);assert(saved(dom,key).sessions[session].wrong);}
 dom.window.close();
}
const dom=open('start','lesson/vec-coordinates'),d=dom.window.document;
for(const name of ['a','b']){
 const dots=d.querySelectorAll('[data-drag="'+name+'"] circle');assert.equal(dots.length,2);assert.equal(dots[0].getAttribute('r'),'10');assert.equal(dots[0].getAttribute('pointer-events'),'all');assert.equal(dots[1].getAttribute('r'),'4');
}
const input=d.querySelector('[name="prof-vector-a-0"]');input.value='1';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(d.querySelector('[data-drag="a"] circle').getAttribute('cx'),'292');
dom.window.close();
console.log('PROFILE_INPUT_DOM_OK: both form handlers, unpenalized invalid notation, correct arc answer saved as independent, numeric mistake counted, vector point/hit sizes and coordinate updates');
