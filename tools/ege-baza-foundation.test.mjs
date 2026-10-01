import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const source=fs.readFileSync('trainers/ege-baza/course/index.html','utf8');
const data=source.split('/*__FOUNDATION_DATA_START__*/')[1].split('/*__FOUNDATION_DATA_END__*/')[0];
const {SKILLS,TASKS}=vm.runInNewContext(data+';({SKILLS,TASKS})');
// Independently calculated expected answers in the order of each skill's bank.
// Fractions, inverse operations and full purchase totals are expressed here,
// rather than importing application checkers or reusing stored answers.
const oracle={
 decimal:[75/100,128/100,44/100,24/20,69/100,25/100,45/100,32/40,97/100,6/10],
 division:[84/7,360/12,75/25,54/9,63/3,48/12,72/6,280/7,96/8,630/21],
 rounding:[Math.ceil(170/25),Math.floor(500/72),24*10,35*10,Math.ceil(38/6),17*100,Math.ceil(26/4),35*100,Math.floor(1000/145),48],
 percent:[350/5,45/3*20,18*100/60,250/5*3,480/10,24*5,260*3/20,42*10/3,360/4,63*20/7],
 change:[1200-1200*15/100,800+800/4,720*5/4,(1000+100)*9/10,600-120,2000+100,1500-180,920*20/23,750+90,960*5/4],
 choice:[Math.min(1080+200,1260),Math.min(750+180,870),80*10/4,1000-255-240,Math.min(600+100,720),6*3/4,Math.min(1080+250,1320),48/6,Math.min(900+150,1000),160*3/2]
};
assert.equal(SKILLS.length,6);assert.equal(TASKS.length,60);
assert.equal(new Set(TASKS.map(t=>t.id)).size,60);
assert.equal(new Set(TASKS.map(t=>t.text)).size,60,'Disjoint task wording across the four pools');
for(const s of SKILLS){
 const ts=TASKS.filter(t=>t.skill===s.id);assert.equal(ts.length,10);
 ts.forEach((t,i)=>{assert.ok(Math.abs(t.answer-oracle[s.id][i])<1e-9,t.id);assert.ok(t.solution.length>5,t.id+' explanation');if(t.phase==='practice')assert.ok(t.hint.length>5,t.id+' hint');});
 for(const phase of ['diagnostic','checkpoint','repeat'])assert.equal(ts.filter(t=>t.phase===phase).length,2);
 assert.equal(ts.filter(t=>t.phase==='practice').length,4);
 assert.ok(fs.existsSync(path.resolve('trainers/ege-baza/course',s.link)),s.link);
}
for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
assert.ok(!source.includes('localStorage.clear('));
assert.ok(!source.includes('fetch('),'No external data transmission');
assert.ok(!source.includes('eval('));
assert.ok(source.includes('prefers-reduced-motion'));
assert.ok(fs.readFileSync('trainers/index.html','utf8').includes('./ege-baza/course/'));
assert.ok(fs.readFileSync('trainers/ege-baza/index.html','utf8').includes('href="course/"'));
assert.ok(fs.readFileSync('sitemap.xml','utf8').includes('https://mathexam.space/trainers/ege-baza/course/'));
console.log('EGE_BAZA_FOUNDATION_OK: 60 independently calculated answers; 6 skills; disjoint pools; links, syntax and discovery.');
