// In-memory DOM unit checks only. This is not browser/layout or screenshot evidence.
const assert=require('node:assert/strict');
class N {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.events={};this._text='';this.value='';this.className='';this.classList={toggle:(c,on)=>{let a=this.className.split(' ').filter(Boolean).filter(x=>x!==c);if(on)a.push(c);this.className=a.join(' ');}};}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){nodes.forEach(n=>{if(typeof n==='string')n=Object.assign(new N('#text'),{_text:n});this.children.push(n);n.parent=this;});}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,v){this.events[k]=v;}
 replaceChildren(...v){this.children=[];this._text='';this.append(...v);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
}
const head=new N('head');
const walk=n=>[n,...n.children.flatMap(walk)];
global.document={head,createElement:t=>new N(t),createElementNS:(_,t)=>new N(t),createTextNode:t=>Object.assign(new N('#text'),{_text:t}),getElementById:id=>walk(head).find(n=>n.id===id)};
require('./models.js');
function mount(model,id){const host=new N('div');const cleanup=PetersonModels.mount(host,{model,id,title:model});assert(host.textContent);assert(walk(host).some(n=>n.attrs['aria-live']==='polite'));for(const b of walk(host).filter(n=>n.tag==='button'))assert.equal(b.type,'button');for(const n of walk(host).filter(n=>['input','select'].includes(n.tag)))assert(walk(host).some(l=>l.tag==='label'&&l.htmlFor===n.id));for(const s of walk(host).filter(n=>n.tag==='svg')){assert.equal(s.attrs.role,'img');assert(s.attrs['aria-label']);}return {host,cleanup};}
let count=0;
for(const [model,ids] of Object.entries({logic:['p01','p02','p03','p06','p07'],variable:['p04','p05'],fractions:['p08'],river:['p09'],mean:['p10'],percent:['p11','p12'],growth:['p13','p14']})){
 for(const id of ids){const {host,cleanup}=mount(model,id);assert(!host.textContent.includes('NaN'));for(const node of walk(host).filter(n=>n.tag==='input')){for(const v of [node.min,node.max]){node.value=v;node.events.input();assert(!host.textContent.includes('NaN'));assert(!host.textContent.includes('undefined'));count++;}}cleanup();assert.equal(host.children.length,0);}
}
let t=mount('logic','p02');let b=walk(t.host).find(n=>n.tag==='button'&&n.textContent==='3');b.events.click();assert(t.host.textContent.includes('Контрпример: 3'));
t=mount('logic','p03');for(const i of [2,4,6])walk(t.host).find(n=>n.tag==='button'&&n.textContent===String(i)).events.click();assert(t.host.textContent.includes('Выбери хотя бы одно число'));walk(t.host).find(n=>n.tag==='button'&&n.textContent==='3').events.click();assert(t.host.textContent.includes('ни одного чётного'));
t=mount('fractions','p08');assert(t.host.textContent.includes('2 · 3 = 6 клеток'));
t=mount('mean','p10');const move=walk(t.host).find(n=>n.tag==='button'&&n.textContent.startsWith('Переложить'));for(let i=0;i<3;i++)move.events.click();assert(t.host.textContent.includes('Получилось поровну'));
t=mount('river','p09');assert(t.host.textContent.includes('12 − 8 = 4 = 2 · 2'));
t=mount('growth','p14');assert(t.host.textContent.includes('1 331'));assert(t.host.textContent.includes('1 300'));
t=mount('percent','p12');const ps=walk(t.host).filter(n=>n.tag==='input')[1];ps.value=150;ps.events.input();let squares=walk(t.host).filter(n=>n.tag==='svg');assert.equal(squares.length,2);assert.equal(walk(squares[0]).filter(n=>n.tag==='rect'&&n.attrs.fill==='#27855f').length,100);assert.equal(walk(squares[1]).filter(n=>n.tag==='rect'&&n.attrs.fill==='#27855f').length,50);assert(t.host.textContent.includes('Пусть x'));assert(t.host.textContent.includes('300 : 200 = 1,5'));assert(walk(t.host).filter(n=>n.className==='pm-fraction').length>=3);
assert.equal(walk(head).filter(n=>n.id==='peterson-model-styles').length,1);
console.log('PASS: 14 lesson variants mounted; '+count+' slider boundary checks; counterexamples, empty logic set, fraction grid, mean transfer, river difference, growth, 150% grid split, accessibility attributes and cleanup verified.');
