'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');require('../ege-baza/path/equation-practice.js');
const legacy=require('../ege-baza/reference/legacy-map.js');
function fixture(hash=''){const dom=new JSDOM(read('ege-baza/reference/exam.html'),{url:'https://mathexam.space/ege-baza/reference/exam.html'+hash,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.HTMLElement.prototype.scrollIntoView=()=>{};for(const name of ['ui','exam-data','exam'])w.eval(read('ege-baza/reference/'+name+'.js'));return dom;}
test('all source blocks, exact existing task routes and honest preparatory labels',()=>{
 const f=fixture(),groups=f.window.EgeExamReference.groups;
 assert.equal(groups.length,22);assert.equal(new Set(groups.map(g=>g.id)).size,22);
 assert.deepEqual([...new Set(groups.map(g=>g.section))],['algebra','plane','solid','trig','functions']);
 for(const g of groups){assert(g.pins.length>0);for(const pin of g.pins){const url=new URL(pin.href,'https://mathexam.space');assert.equal(url.origin,'https://mathexam.space');assert.equal(url.search,'');if(url.pathname==='/ege-baza/path/index.html'){assert(D.meta.some(m=>m.id===pin.id));assert.equal(url.hash,'#lesson='+pin.id);for(let seed=0;seed<12;seed++)assert(D.task(pin.id,seed).q.trim());}else {assert(legacy.pins.some(p=>new URL(p.href,'https://mathexam.space/ege-baza/reference/').href===url.href),pin.href);}}}
 for(const id of ['equilateral','rhombus'])assert(groups.find(g=>g.id===id).pins.every(p=>p.note.startsWith('Подготовка:')));
 assert.equal(groups.find(g=>g.id==='derivative').pins[1].href,'/trainers/ege-baza/data-course/index.html#practice-graphs-2');
 assert.match(read('trainers/ege-baza/data-course/content.js'),/Найдите производную в точке касания/);
 f.window.close();
});
test('100 square values, trig table and formula conditions match the source mathematics',()=>{
 let f=fixture('#squares'),d=f.window.document;
 assert.deepEqual([...d.querySelectorAll('.exam-table td')].map(x=>+x.textContent),Array.from({length:100},(_,n)=>n*n));
 assert.equal(d.querySelector('[title="73²"]').textContent,'5329');
 const groups=f.window.EgeExamReference.groups;assert.match(groups.find(g=>g.id==='roots').note,/b > 0/);assert.match(groups.find(g=>g.id==='logs').note,/a ≠ 1/);assert.match(groups.find(g=>g.id==='quadratic').note,/D < 0/);
 f.window.close();f=fixture('#trig-values');d=f.window.document;
 const rows=[...d.querySelectorAll('.exam-table tr')].map(r=>[...r.children].map(c=>c.textContent));
 assert.deepEqual(rows[1],['Градусы','0°','30°','45°','60°','90°','180°','270°','360°']);
 assert.equal(rows[4][5],'—');assert.equal(rows[4][7],'—');assert.equal(rows[2][7],'−1');assert.equal(rows[3][6],'−1');
 f.window.close();
});
test('disclosure, deep links, keyboard focus, same-origin pins and source attribution',()=>{
 for(const hash of ['#algebra','#plane','#solid','#trig','#functions','#trapezoid','#%ZZ','#<img src=x>']){
  const f=fixture(hash),d=f.window.document;assert.equal(d.querySelectorAll('.exam-pin-list[open]').length,0);assert(d.querySelectorAll('.exam-pin-list').length>0);
  for(const a of d.querySelectorAll('.ref-pin')){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener');assert.equal(new URL(a.href).origin,'https://mathexam.space');}
  assert.equal(d.querySelectorAll('#exam-sections [aria-current="page"]').length,1);
  if(hash==='#trapezoid'){assert.equal(d.activeElement.id,'trapezoid');assert.equal(d.querySelector('[aria-current="page"]').hash,'#plane');}
  assert.equal(d.querySelectorAll('img[onerror]').length,0);assert.match(d.querySelector('.ref-intro').textContent,/2015/);f.window.close();
 }
 assert.match(read('ege-baza/reference/index.html'),/href="exam.html"/);
});
