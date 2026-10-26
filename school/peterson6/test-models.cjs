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
t=mount('percent','p12');const ps=walk(t.host).filter(n=>n.tag==='input')[1];ps.value=150;ps.events.input();let squares=walk(t.host).filter(n=>n.tag==='svg');assert.equal(squares.length,2);assert.equal(walk(squares[0]).filter(n=>n.tag==='rect'&&n.attrs.fill==='#27855f').length,100);assert.equal(walk(squares[1]).filter(n=>n.tag==='rect'&&n.attrs.fill==='#27855f').length,50);assert(t.host.textContent.includes('150% = 2 · 150 = 300'));
assert.equal(walk(head).filter(n=>n.id==='peterson-model-styles').length,1);
console.log('PASS: 14 lesson variants mounted; '+count+' slider boundary checks; counterexamples, empty logic set, fraction grid, mean transfer, river difference, growth, 150% grid split, accessibility attributes and cleanup verified.');
// Part 2/3 topic models: controls are actions, task figures are present without opening help.
require('./continuation-models.js');
let newModes=0,newControls=0;
for(let n=15;n<=58;n++){
 const id='p'+n,host=new N('div'),lesson={id,model:'continuation',title:'Тема '+n},task={id:id+'-model-test'};
 const handle=PetersonModels.mount(host,lesson,task);
 assert.equal(typeof handle.getBoardState,'function',id);assert(host.textContent.includes('Авторский пример'),id);
 assert(walk(host).some(x=>x.attrs['aria-live']==='polite'),id);
 for(const s of walk(host).filter(x=>x.tag==='svg')){assert.equal(s.attrs.role,'img');assert(s.attrs['aria-label']);}
 for(const [index,sel]of walk(host).filter(x=>x.tag==='select').entries()){
  assert(walk(host).some(x=>x.tag==='label'&&x.htmlFor===sel.id));
  const values=PetersonContinuationModels.configs[id].controls[index].values;
  for(const option of [values[0],values.at(-1)]){sel.value=String(Array.isArray(option)?option[0]:option);sel.events.change();assert(handle.validateBoardState(handle.getBoardState()));assert(!/NaN|undefined/.test(host.textContent),id);newControls++;}
 }
 for(const button of walk(host).filter(x=>x.tag==='button'))assert.equal(button.type,'button');
 handle();assert.equal(host.children.length,0);newModes++;
}
for(const figure of [
 {type:'line',min:-5,max:5,points:[{name:'A',x:-3}]},
 {type:'plane',points:[{name:'A',x:2,y:3}],polylines:[[[0,0],[2,3]]]},
 {type:'geometry',points:[{name:'A',x:0,y:0},{name:'B',x:4,y:0}],segments:[['A','B']]},
 {type:'angle',degrees:60},{type:'solid',shape:'cube'},
 {type:'parts',parts:[{label:'A',count:2},{label:'B',count:3}]},
 {type:'proportion',leftTop:'2',leftBottom:'3',rightTop:'x',rightBottom:'12'}
]){const host=new N('div');PetersonContinuationModels.renderFigure(host,figure);assert(host.children.length);assert(!/NaN|undefined/.test(host.textContent));assert.equal(walk(host).filter(x=>x.tag==='details').length,0,'essential figure cannot be hidden as help');}
console.log(JSON.stringify({continuationModels:newModes,controlBoundaries:newControls,essentialFigureTypes:7}));
// Exact vertex sets and edge lengths of the two more complex Platonic solids.
for(const [shape,vertices,edges,degree]of [['dodecahedron',20,30,3],['icosahedron',12,30,5]]){
 const d=PetersonContinuationModels.platonicData(shape);assert.equal(d.points.length,vertices);assert.equal(d.edges.length,edges);
 const counts=Array(vertices).fill(0);d.edges.forEach(([a,b])=>{counts[a]++;counts[b]++;});assert(counts.every(n=>n===degree));
 const h=new N('div');PetersonContinuationModels.renderFigure(h,{type:'solid',shape});assert.equal(walk(h).filter(n=>n.tag==='line').length,edges);
}
// Render every authored essential figure when continuation content is present.
const fs=require('node:fs');let authoredFigures=0;
for(const file of ['part2.json','part3.json'])if(fs.existsSync(__dirname+'/'+file))for(const lesson of JSON.parse(fs.readFileSync(__dirname+'/'+file,'utf8')))for(const task of lesson.tasks)if(task.figure){
 const h=new N('div');PetersonContinuationModels.renderFigure(h,task.figure);assert(h.children.length,task.id);assert(!/NaN|undefined|не поддерживается|Неизвестная/.test(h.textContent),task.id);
 for(const n of walk(h))for(const value of Object.values(n.attrs))assert(!/NaN|Infinity|undefined/.test(value),task.id+' invalid SVG attr');authoredFigures++;
}
console.log(JSON.stringify({platonicSolids:2,authoredFigures}));
// Repeating ordinates in the inverse-proportion table must remain exact fractions.
{
 const host=new N('div'),lesson={id:'p21',model:'continuation',title:'Графики'},task={id:'p21-exact'};
 PetersonModels.mount(host,lesson,task);
 const sels=walk(host).filter(n=>n.tag==='select');sels[0].value='1';sels[0].events.change();sels[1].value='1';sels[1].events.change();
 assert(!host.textContent.includes('0,333'));assert(!host.textContent.includes('0,167'));
 const fractions=walk(host).filter(n=>n.className==='pm-fraction').map(n=>n.attrs['aria-label']);assert(fractions.includes('1 делить на 3'));assert(fractions.includes('1 делить на 6'));
 const figure=new N('div');PetersonContinuationModels.renderFigure(figure,{type:'angle',degrees:70,vertex:'O',arms:['A','B']});
 const svg=walk(figure).find(n=>n.tag==='svg');assert.equal(svg.attrs['aria-label'],'Данный угол');assert(!figure.textContent.includes('70'));
}
// Exercise the actual built 58-topic dataset, including every retained first-part model.
{
 const dataContext={window:{}};require('node:vm').runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),dataContext);
 const built=dataContext.window.PetersonCourse.lessons;assert.equal(built.length,58);let mounted=0,figures=0;
 for(const lesson of built){const host=new N('div'),task=lesson.tasks[0],handle=PetersonModels.mount(host,lesson,task);assert.equal(typeof handle.getBoardState,'function',lesson.id);assert(PetersonModels.validateBoardState(lesson,handle.getBoardState(),task),lesson.id);assert(!/NaN|undefined/.test(host.textContent));handle();mounted++;
  for(const task of lesson.tasks)if(task.figure){const h=new N('div');PetersonContinuationModels.renderFigure(h,task.figure);assert(h.children.length);assert(!/NaN|undefined|не поддерживается|Неизвестная/.test(h.textContent),task.id);for(const n of walk(h))for(const value of Object.values(n.attrs))assert(!/NaN|Infinity|undefined/.test(value),task.id);figures++;}
 }
 console.log(JSON.stringify({actualBuiltModels:mounted,actualBuiltEssentialFigures:figures,exactInverseFractions:true,neutralConstructionAngle:true}));
}
