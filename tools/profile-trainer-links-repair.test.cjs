'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const course=require('../ege-profil/start/course-links.js');
const root=path.resolve(__dirname,'..');
const expected=[
 [4,'probability-t45.html','basic'],[5,'probability-t45.html','compound'],
 [7,'trigonometry.html','equations'],[8,'trigonometry.html','values'],
 [9,'functions-t1112.html','extrema'],[10,'applied-t910.html','formulas'],
 [11,'applied-t910.html','text'],[12,'functions-t1112.html','graphs']
];
const origin='https://mathexam.space';
function doc(file){return new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:origin+'/'+file});}
test('each combined trainer link selects the learner-requested topic',()=>{
 for(const [number,file,topic] of expected){
  const dom=new JSDOM(course.resources(number));
  const link=[...dom.window.document.querySelectorAll('a')].find(a=>a.getAttribute('href').includes('/'+file));
  assert(link,number+' links to '+file);
  assert.equal(link.getAttribute('href'),'/ege-profil/trainers/'+file+'?topic='+topic);
  dom.window.close();
 }
});
test('additional banks are requested explicitly, and every bank/prerequisite exists',()=>{
 const lessons=['geometry','algebra','stereo','probability','equations','functions','applied','finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
 for(let number=1;number<=13;number++){
  const dom=new JSDOM(course.resources(number));
  for(const panel of dom.window.document.querySelectorAll('.course-resources')){
   assert.equal(panel.tagName,'DETAILS');assert.equal(panel.open,false);assert(panel.querySelector('summary'));
  }
  for(const link of dom.window.document.querySelectorAll('a')){
   const url=new URL(link.getAttribute('href'),origin);
   assert.equal(url.origin,origin);assert(fs.statSync(path.join(root,url.pathname)).isFile());
  }
  dom.window.close();
 }
 for(const bank of course.banks)for(const id of bank.help)assert(lessons.some(l=>l.id===id),bank.path+' prerequisite '+id);
});
test('geometry entry cards open the same calm course; board links retain their specific registered number',()=>{
 const dom=doc('ege-profil/index.html'),d=dom.window.document;
 assert.deepEqual([...d.querySelectorAll('.first-three-link')].map(a=>a.hash),['#calm/1','#calm/2','#calm/3']);
 const board=[...d.querySelectorAll('a[href*="trainer-board.html"]')].map(a=>new URL(a.href).searchParams.get('trainer'));
 assert.deepEqual(board,['/ege-profil/start/index.html#exam/1','/ege-profil/start/index.html#exam/2','/ege-profil/start/index.html#exam/3']);
 assert.equal(d.querySelector('#legacy-course').open,false);
 assert.match(d.querySelector('header').textContent,/проекту ФИПИ 2027/);
 dom.window.close();
});
test('archived 2026 links select the correct topic without being renumbered as 2027',()=>{
 const historical={4:['probability-t45.html','basic'],5:['probability-t45.html','compound'],6:['trigonometry.html','equations'],7:['trigonometry.html','values'],9:['applied-t910.html','formulas'],10:['applied-t910.html','text'],11:['functions-t1112.html','graphs'],12:['functions-t1112.html','extrema']};
 for(const [file,name] of [['ege-profil/exam/variant.html','LINE_TRAINER'],['ege-profil/exam/full-exam.html','TRAINER'],['ege-profil/review.html','LINE_TRAINER']]){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const match=source.match(new RegExp('\\b'+name+'\\s*=\\s*\\{([^}]*)\\}'));assert(match,file);
  const rows=Object.fromEntries([...match[1].matchAll(/(\d+)\s*:\s*"([^"]+)"/g)].map(m=>[m[1],m[2]]));
  for(const [number,[target,topic]] of Object.entries(historical))assert(rows[number].endsWith(target+'?topic='+topic),file+' number '+number);
 }
 const dom=doc('ege-profil/index.html');
 for(const li of dom.window.document.querySelectorAll('#route li.line')){
  const n=li.querySelector('.num')?.textContent; if(!historical[n])continue;
  const [target,topic]=historical[n];assert(li.querySelector('a[href="trainers/'+target+'?topic='+topic+'"]'),'index archive '+n);
 }
 dom.window.close();
});
