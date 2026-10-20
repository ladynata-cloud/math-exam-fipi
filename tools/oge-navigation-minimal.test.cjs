'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const base=process.env.OGE_BASE_ROOT||root;
const files=['trainers/oge-course/index.html','oge/index.html'];
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const load=(f,hash='')=>new JSDOM(read(f),{url:'https://mathexam.space/'+f+hash,runScripts:'dangerously'});
test('course keeps every task route and the required honest lesson/variant labels',()=>{
 const d=load(files[0]).window.document;
 assert.equal(d.querySelectorAll('h1').length,1);
 for(let n=6;n<=25;n++){
  const links=[...d.querySelectorAll('h3 a')].filter(a=>a.textContent.trim()==='Задание '+n);
  assert.equal(links.length,1,'line '+n);
 }
 assert(d.querySelector('h3 a[href="/trainers/oge-1-5-trainers/"]'));
 const lesson=d.querySelector('a[href="/oge/geometry/task-15-external-angle.html"]').closest('article');
 assert.match(lesson.textContent,/урок с разбором/);
 assert.match(d.querySelector('#full-variants').textContent,/Не является официальным материалом ФИПИ/);
 assert(d.querySelector('#full-variants h3 a[href="/trainers/oge-2027-analogue-1.html"]'));
 assert.match(d.querySelector('#geometry').textContent,/рисунки и контрпримеры/);
});
test('extra practice and downloads are accessible disclosures; no inactive buttons or unsolicited prompts',()=>{
 const d=load(files[0]).window.document;
 for(const id of ['gaps','full-variants','downloads','practical-extra']){const el=d.getElementById(id);assert.equal(el.tagName,'DETAILS');assert.equal(el.open,false);assert(el.querySelector('summary'));}
 assert.equal(d.querySelectorAll('button[disabled]').length,0);
 assert(d.querySelectorAll('#downloads a[download]').length>=24);
 assert(!/localStorage|sessionStorage|fetch\(/.test(read(files[0])));
});
test('hash links open their optional destination for direct links and keyboard navigation',()=>{
 const dom=load(files[0],'#gaps');assert(dom.window.document.querySelector('#gaps').open);
 dom.window.location.hash='#downloads';dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));assert(dom.window.document.querySelector('#downloads').open);dom.window.close();
});
test('both hubs retain all previous navigation destinations and resolve local links',()=>{
 for(const f of files){
  const d=load(f).window.document;const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size);
  const old=execFileSync('git',['show','4b56350c35a67e41add8f2b25cf2bf7d73d1f71f:'+f],{cwd:base,encoding:'utf8'});
  const od=new JSDOM(old,{url:'https://mathexam.space/'+f}).window.document;
  const dest=new Set([...d.querySelectorAll('a[href]')].map(a=>a.href));
  for(const a of od.querySelectorAll('a[href]'))assert(dest.has(a.href),'Retain '+a.href);
  for(const a of d.querySelectorAll('a[href]')){const u=new URL(a.href);if(u.origin!=='https://mathexam.space')continue;let target=decodeURIComponent(u.pathname).slice(1);if(!target||target.endsWith('/'))target+='index.html';assert(fs.existsSync(path.join(root,target))||fs.existsSync(path.join(base,target)),f+' broken '+a.href);if(u.pathname==='/'+f&&u.hash)assert(d.getElementById(u.hash.slice(1)));}
 }
});
test('secondary OGE hub keeps informatics reachable and leads to mathematics course',()=>{
 const d=load(files[1]).window.document;assert.equal(new URL(d.querySelector('.primary-link').href).pathname,'/trainers/oge-course/');
 const informatics=d.querySelector('a[href="../trainers/oge-informatics-1-10-tutor.html"]');assert(informatics);assert(informatics.closest('details'));
 assert.doesNotMatch(d.querySelector('main').textContent,/зубрёжка/);
 for(const a of d.querySelectorAll('.topic-links a'))assert(!/^(Открыть|Открыть модуль|Пройти)$/.test(a.textContent.trim()),'Topic link has a meaningful label');
});
