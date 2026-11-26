'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../trainers/inequalities-number-line.html'),'utf8');
const source=html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
function fixture(source){
 const elements=new Map(),make=()=>({textContent:'',className:'',value:'',dataset:{},children:[],events:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},appendChild(x){this.children.push(x)},addEventListener(k,v){this.events[k]=v},getBoundingClientRect(){return {left:0,width:720}},setPointerCapture(){}});
 const get=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id)};
 const modes=['gt','gte','lt','lte'].map(mode=>Object.assign(make(),{dataset:{mode}}));
 const document={getElementById:get,createElementNS:()=>make(),querySelectorAll:()=>modes};
 let config,notifications=0;
 const window={addEventListener(){},MathExamBoard:{register(c){config=c;return {notifyStateChanged(){notifications++}}}}};
 const run=new Function('document','window','location','setTimeout',source);
 run(document,window,{origin:'https://mathexam.test'},()=>{});
 return {get,config,modes,notifications:()=>notifications};
}
test('all integer states roundtrip without changing score or echoing remote state',()=>{
 const f=fixture(source);
 assert.equal(f.config.id,'inequalities-number-line');
 for(const mode of ['gt','gte','lt','lte'])for(let a=-8;a<=8;a++)for(let x=-10;x<=10;x++)for(const interacted of [false,true]){
  const good=mode==='gt'?x>a:mode==='gte'?x>=a:mode==='lt'?x<a:x<=a;
  const state={mode,a,x,interacted,score:12,scored:interacted&&good,hint:true};
  f.config.applyState(state);
  assert.deepEqual(f.config.getState(),state);
  assert.equal(String(f.get('score').textContent),'12');
 }
 assert.equal(f.notifications(),0);
});
test('malformed states do not change visible lesson or score',()=>{
 const f=fixture(source),s=f.config.getState();
 for(const invalid of [null,{}, {...s,a:9},{...s,x:1.5},{...s,mode:'toString'},{...s,mode:['gt']},{...s,mode:1},{...s,score:-1},{...s,scored:true},{...s,extra:1}]){
  assert.throws(()=>f.config.applyState(invalid));
  assert.deepEqual(f.config.getState(),s);
 }
 assert.equal(f.notifications(),0);
});
test('local pointer changes publish state and score remains stable after hydration',()=>{
 const f=fixture(source);
 f.get('svg').events.pointerdown({pointerId:1,clientX:360});
 f.get('svg').events.pointerup({});
 const s=f.config.getState();
 assert.equal(s.x,0);assert.equal(s.score,1);assert.equal(s.scored,true);
 assert(f.notifications()>0);
 const g=fixture(source);g.config.applyState(s);
 assert.deepEqual(g.config.getState(),s);assert.equal(g.notifications(),0);
});
