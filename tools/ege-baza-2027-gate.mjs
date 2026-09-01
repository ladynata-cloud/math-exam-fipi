#!/usr/bin/env node
/* Гейт банка заданий тренажёра «Базовый ЕГЭ 2027» — голый Node, без зависимостей.
   Вырезает блок данных из HTML по маркерам, пересчитывает каждый ответ независимым
   кодом (не тем выражением, из которого ответ получен), проверяет ловушки и структуру.
   Успех — маркер EGE_BAZA_2027_GATE_OK в stdout и код 0. */
import {readFileSync} from 'node:fs';
const file=process.argv[2]||'trainers/ege-baza/index.html';
const html=readFileSync(file,'utf8');
const a=html.indexOf('/*__EGE_DATA_START__*/'), z=html.indexOf('/*__EGE_DATA_END__*/');
if(a<0||z<0){ console.error('EGE_BAZA_2027_GATE_FAIL: нет маркеров блока данных'); process.exit(1); }
const {TASKS,POSITIONS,LESSONS}=new Function(html.slice(a,z)+';return {TASKS,POSITIONS,LESSONS};')();
let bad=0; const err=m=>{console.log('  ✗',m);bad++;};
const byId=id=>TASKS.find(t=>t.id===id);
const chk=(id,val)=>{const t=byId(id); if(!t) return err('нет задачи '+id);
 const ok=t.answerType==='number'?Math.abs(t.answer-val)<1e-9:String(t.answer)===String(val);
 if(!ok) err(`${id}: в банке ${t.answer}, пересчёт даёт ${val}`);};
// структура
const byPos={}; TASKS.forEach(t=>(byPos[t.pos]=byPos[t.pos]||[]).push(t));
for(let i=1;i<=21;i++) if(!byPos[i]) err('нет заданий для позиции '+i);
if(POSITIONS.length!==21) err('позиций не 21');
const cover=LESSONS.flatMap(l=>l.positions); if(cover.length!==21||new Set(cover).size!==21) err('уроки не покрывают 21 позицию ровно один раз');
const ids=new Set();
for(const t of TASKS){
 if(ids.has(t.id)) err('дубль id '+t.id); ids.add(t.id);
 if(!t.text||!t.hints?.length) err(t.id+': нет текста или подсказок');
 const keys=Object.keys(t.traps||{}), norm=keys.map(k=>t.answerType==='number'?String(Number(k)):String(k));
 if(new Set(norm).size!==norm.length) err(t.id+': две ловушки на одно значение');
 for(const k of keys){ if(t.answerType==='number'?Math.abs(Number(k)-t.answer)<1e-9:String(k)===String(t.answer)) err(t.id+': ловушка = ответу ('+k+')'); }
 if(t.answerType==='match'&&!(/^[1-4]{4}$/.test(t.answer)&&new Set(t.answer).size===4&&t.rows?.length===4&&t.cols?.length===4)) err(t.id+': некорректное соответствие');
 if(t.answerType==='multi'){const d=String(t.answer).split(''); if(d.join('')!==d.slice().sort().join('')||d.some(x=>+x<1||+x>t.items.length)) err(t.id+': некорректный multi');}
}
// независимый пересчёт
chk('p1a',Math.ceil(94/8)); chk('p1b',2000-7*145); chk('p1c',Math.ceil(310/45));
chk('p3a',Math.max(...byId('p3a').fig.values));
{const f=byId('p3b').fig; chk('p3b',+f.labels[f.values.indexOf(Math.min(...f.values))]);}
{const r=byId('p3c').table.rows.map(r=>[r[0],+r[1]+ +r[2]+ +r[3]]).sort((x,y)=>y[1]-x[1]); chk('p3c',r.findIndex(x=>x[0]==='«Комета»')+1);}
chk('p4a',4*5**2/2); chk('p4b',(6+10)/2*7); chk('p4c',1.8*25+32);
chk('p5a',(400-8)/400); chk('p5b',9/30); chk('p5c',(20-8)/20);
chk('p6a',Math.min(15*260+300,15*250>3600?15*250:15*250+500,15*280>4500?15*280:15*280+200));
{const rows=byId('p6b').table.rows; chk('p6b',rows.filter(r=>+r[1]<=55&&+r[2]<=40&&+r[3]<=20&&parseFloat(r[4].replace(',','.'))<=10).map(r=>r[0]).join(''));}
chk('p6c',Math.min(9*4*72+5600,11*4*76+4800,14*4*68+4500));
{const v=byId('p7a').fig.values, per=[[3,4],[4,5],[6,7],[9,10]], d=per.map(([a,b])=>v[b]-v[a]), mx=Math.max(...d);
 chk('p7a',d.map((x,i)=>{const [a,b]=per[i]; if(x<0) return 3; if(x===0) return 4; if(x===mx) return 2; return (v[a]<=760&&v[b]<=760)?1:2;}).join(''));}
{const v=byId('p7b').fig.values, per=[[0,1],[1,2],[8,10],[3,5]]; let mx=0; for(let i=1;i<v.length;i++) mx=Math.max(mx,v[i]-v[i-1]);
 chk('p7b',per.map(([a,b])=>{const seg=v.slice(a,b+1); if(v[b]<v[a]) return 1; if(b-a===1&&v[b]-v[a]===mx) return 2; if(Math.min(...seg)>=55&&Math.max(...seg)<=70) return 3; if(Math.max(...seg)<=20) return 4; return 0;}).join(''));}
const shoe=p=>Math.abs(p.reduce((s,[x,y],i)=>{const [X,Y]=p[(i+1)%p.length];return s+x*Y-X*y;},0))/2;
['p9a','p9b','p9c'].forEach(id=>chk(id,shoe(byId(id).fig.poly)));
chk('p10a',40*25-6*4); chk('p10b',360/18); chk('p10c',2*(45+20)-5);
chk('p11a',8*1000*1.5-8000); chk('p11b',2*(3*4+3*5+4*5)); chk('p11c',45/9);
chk('p12a',Math.sqrt(25**2-24**2)); chk('p12b',Math.sqrt(10**2-6**2)); chk('p12c',8/10); chk('p12d',12*8/2);
chk('p13a',(6*10)/(2*5)); chk('p13b',6*(10*Math.sqrt(13**2-5**2)/2)); chk('p13c',5*4**3);
chk('p14a',3.4*2.5+1.6); chk('p14b',(2.4+3.6)/1.5); chk('p14c',3/4+(5/6)/(2/3)); chk('p14d',6.4/4-0.6);
chk('p15a',320*1.15); chk('p15b',450*0.8); chk('p15c',45/9*5); chk('p15d',45000*0.87);
chk('p16a',Math.sqrt(18*5*10)/5); chk('p16b',14*Math.sin(30*Math.PI/180)); chk('p16c',9*5-1); chk('p16d',3*Math.log(7)/Math.log(Math.sqrt(7)));
chk('p17a',5); chk('p17b',(10-1)/2); chk('p17c',2); chk('p17d',(9-5)/2);
{const t=byId('p18a'), vals={'√27':Math.sqrt(27),'log₂ 5':Math.log2(5),'5/2':2.5,'√11':Math.sqrt(11)};
 chk('p18a',t.fig.points.map(([,x])=>{let b=0,d=1e9;t.cols.forEach((c,i)=>{const e=Math.abs(vals[c]-x);if(e<d){d=e;b=i+1;}});return b;}).join(''));}
{const t=byId('p18b'), m=Math.sqrt(0.24), vals={'4m':4*m,'m²':m*m,'−1/m':-1/m,'m − 1':m-1};
 chk('p18b',t.fig.points.map(([,x])=>{let b=0,d=1e9;t.cols.forEach((c,i)=>{const e=Math.abs(vals[c]-x);if(e<d){d=e;b=i+1;}});return b;}).join(''));}
const R={div15_odd_distinct:n=>/^\d{4}$/.test(n)&&+n%15===0&&[...n].every(d=>+d%2===1)&&new Set(n).size===4,
 strike74123568:n=>{const s='74123568';if(!/^\d{5}$/.test(n))return false;let i=0;for(const c of n){i=s.indexOf(c,i);if(i<0)return false;i++;}return +n%15===0;},
 div18_prod24:n=>/^\d{4}$/.test(n)&&+n%18===0&&[...n].reduce((a,d)=>a*+d,1)===24};
TASKS.filter(t=>t.answerType==='rule').forEach(t=>{ if(!R[t.rule]) return err(t.id+': нет правила '+t.rule); if(!R[t.rule](String(t.answerExample))) err(t.id+': пример не проходит правило'); });
chk('p20a',4*(12/10)); chk('p20b',6*0.15/10*100); chk('p20c',450/6); chk('p20d',(300-180)/2);
{let s=[];for(let b=1;b<=20;b++){const a=(51+10*b)/7;if(Number.isInteger(a)&&a+b<=20)s.push(a);} if(s.length!==1) err('p21a: решений не одно'); else chk('p21a',s[0]);}
chk('p21b',20+18-26);
{const arcs=byId('p21c').fig.arcs.map(x=>x[2]); chk('p21c',Math.min(arcs[0]+arcs[1],arcs[2]+arcs[3]));}
{const S=95+104+88; let ns=[];for(let n=1;n<=60;n++) if(16*n<=S&&S<=17*n) ns.push(n); if(ns.length!==1) err('p21d: решений не одно'); else chk('p21d',ns[0]);}
console.log(`заданий ${TASKS.length}, позиций ${Object.keys(byPos).length}, ловушек ${TASKS.reduce((a,t)=>a+Object.keys(t.traps||{}).length,0)}`);
if(bad){ console.log(`EGE_BAZA_2027_GATE_FAIL (${bad})`); process.exit(1); }
console.log('EGE_BAZA_2027_GATE_OK');
