import test from 'node:test';import assert from 'node:assert/strict';
import {R,eq,add,mul,div,sub,compare} from '../src/math-kernel.js';
import {DATA_TOPICS,solveWordData} from '../src/word-data.js';
import {answerOffline,isProviderTopic} from '../src/tutor.js';
const solve=(topic,q,a)=>{const s=solveWordData(topic,q);assert(s,q);if(a!==undefined)assert.equal(s.verify(a).status,'correct',q);return s;};
test('motion units, meeting and pursuit preserve the actual distance relation',()=>{
 solve('motion','Движение: скорость 60 км/ч; время 30 мин; найти путь','30000 м');
 solve('motion','Движение: путь 120 км; время 2 ч; найти скорость','60 км/ч');
 solve('motion','Движение: путь 120 км; скорость 60 км/ч; найти время','120 мин');
 solve('motion','Навстречу: расстояние 300 км; первый 60 км/ч; второй 40 км/ч','3 ч');
 solve('motion','Вдогонку: отставание 30 км; сзади 60 км/ч; впереди 50 км/ч','3 ч');
 solve('motion','Вдогонку: отставание 30 км; сзади 40 км/ч; впереди 50 км/ч','не произойдёт');
 for(let v=1;v<=12;v++)for(let t=1;t<=8;t++){const s=solve('motion',`Движение: скорость ${v} м/с; время ${t} мин; найти путь`);assert(eq(s.expected,R(v*t*60)));}
 for(const q of ['Движение: скорость 0 км/ч; время 2 ч; найти путь','Движение: скорость 60 км/ч; время 2 кг; найти путь','Движение: скорость 60 км/ч; время 2 ч; путь 120 км; найти путь'])assert.equal(solveWordData('motion',q),null);
});
test('joint work agrees with independently computed fractions of a job; concentration conserves mass',()=>{
 for(let a=1;a<=12;a++)for(let b=1;b<=12;b++){
  const s=solve('work-rates',`Работа: первый ${a} ч; второй ${b} ч; найти время вместе`);assert(eq(s.expected,R(a*b,a+b)));assert(compare(s.expected,R(a))<0);assert(compare(s.expected,R(b))<0);
 }
 solve('work-rates','Работа: первый 60 мин; второй 2 ч; найти время вместе','40 мин');
 for(const a of [1,2,5])for(const b of [1,3,7])for(const p of [0,10,100])for(const q of [0,40,100]){
  const s=solve('mixtures',`Смесь: ${a} кг ${p}%; ${b} кг ${q}%; найти концентрацию`);assert(eq(mul(s.expected,R(a+b)),R(a*p+b*q)));assert(compare(s.expected,R(Math.min(p,q)))>=0);assert(compare(s.expected,R(Math.max(p,q)))<=0);
 }
 solve('mixtures','Смесь: 200 г 10%; 0,3 кг 20%; найти концентрацию','16%');
 assert.equal(solveWordData('mixtures','Смесь: 200 г 110%; 300 г 20%; найти концентрацию'),null);
});
test('progression formulas agree with direct recurrence and summation, including q=1 and signs',()=>{
 let cases=0;for(const a of [-3,0,2])for(const d of [-2,-1,0,1,3])for(let n=1;n<=12;n++){
  let term=a,sum=0;for(let i=0;i<n;i++){sum+=term;if(i<n-1)term+=d;}
  for(const [target,want] of [['an',term],['sn',sum]]){const s=solve('arithmetic-progression',`Арифметическая: a1=${a}; d=${d}; n=${n}; найти ${target}`);assert(eq(s.expected,R(want)));cases++;}
 }
 for(const a of [-3,0,2])for(const q of [-2,-1,0,1,2])for(let n=1;n<=10;n++){
  let term=a,sum=0;for(let i=0;i<n;i++){sum+=term;if(i<n-1)term*=q;}
  for(const [target,want] of [['an',term],['sn',sum]]){const s=solve('geometric-progression',`Геометрическая: a1=${a}; q=${q}; n=${n}; найти ${target}`);assert(eq(s.expected,R(want)));cases++;}
 }assert.equal(cases,660);
 solve('geometric-progression','Геометрическая: a1=3; q=1/2; n=4; найти sn','45/8');
 solve('geometric-progression','Геометрическая: a1=3; a2=-6; найти q','-2');
 solve('arithmetic-progression','Арифметическая: a1=3; an=21; d=2; найти n','10');
 solve('arithmetic-progression','Арифметическая: a1=3; an=21; n=10; найти d','2');
 solve('arithmetic-progression','Арифметическая: a1=3; an=22; d=2; найти n','нет такого члена');
 for(const q of ['Геометрическая: a1=3; q=2; n=0; найти sn','Геометрическая: a1=3; q=2; n=51; найти sn','Геометрическая: a1=0; a2=0; найти q'])assert.equal(solveWordData('geometric-progression',q),null);
});
test('statistics distinguish mean, even median and range without losing duplicates',()=>{
 solve('statistics','Статистика: 2; 4; 9; 5; найти медиану','4,5');solve('statistics','Статистика: -3; 2; 2; найти медиану','2');
 solve('statistics','Статистика: 1/3; 1/3; 1; найти среднее','5/9');solve('statistics','Статистика: -5; 2; 9; найти размах','14');
 solve('statistics','Статистика: 7; найти размах','0');
 for(let n=1;n<=20;n++){const values=Array.from({length:n},(_,i)=>i-4);solve('statistics',`Статистика: ${values.join('; ')}; найти среднее`,`${n-9}/2`);solve('statistics',`Статистика: ${values.join('; ')}; найти медиану`,`${n-9}/2`);}
 assert.equal(solveWordData('statistics','Статистика: ; найти медиану'),null);
});
test('probability tables cover every equally likely outcome and count favourable outcomes independently',()=>{
 const counts=[1,2,3,4,5,6,5,4,3,2,1];for(let total=2;total<=12;total++){const s=solve('probability',`Вероятность: два кубика; сумма=${total}`);assert(eq(s.expected,R(counts[total-2],36)));assert.equal(s.table.rows.flat().filter(x=>x.includes('✓')).length,counts[total-2]);}
 const choose=(n,k)=>{if(k>n)return 0;let r=1;for(let i=1;i<=k;i++)r=r*(n-i+1)/i;return r;};
 for(let n=1;n<=5;n++)for(let k=0;k<=n+1;k++){const s=solve('probability',`Вероятность: ${n} монет; орлов=${k}`);assert(eq(s.expected,R(choose(n,k),2**n)));assert.equal(s.table.rows.length,2**n);assert.equal(new Set(s.table.rows.map(r=>r[0])).size,2**n);}
 for(let r=1;r<=6;r++)for(let b=1;b<=6;b++){const s=solve('probability',`Вероятность: ${r} красных и ${b} синих; вытянуть 2 красных без возвращения`);assert(eq(s.expected,R(r*(r-1),(r+b)*(r+b-1))));assert.equal(s.table.rows.reduce((a,row)=>a+Number(row[1]),0),(r+b)*(r+b-1));}
});
test('function-table inverse returns all matches and never extrapolates',()=>{
 solve('function-table','Функция: x=-2 | -1 | 0 | 1; y=4 | 1 | 0 | 1; найти x при y=1','1;-1');
 solve('function-table','Функция: x=-2 | -1 | 0 | 1; y=4 | 1 | 0 | 1; найти y при x=-2','4');
 solve('function-table','Функция: x=1 | 2 | 3 | 4 | 5; y=1 | 1 | 1 | 1 | 1; найти x при y=1','1;2;3;4;5');
 solve('function-table','Функция: x=-2 | -1; y=4 | 1; найти x при y=8','нет решений');
 assert.equal(solveWordData('function-table','Функция: x=-2 | -1; y=4 | 1; найти y при x=8'),null);
 assert.equal(solveWordData('function-table','Функция: x=1 | 1; y=4 | 1; найти y при x=1'),null);
});
test('all new topics preserve offline boundary, staged hints and serializable tables',()=>{
 for(const t of DATA_TOPICS){assert.equal(isProviderTopic(t.id),false);const hint=answerOffline({topic:t.id,question:t.sample});assert.equal(hint.verification,'deterministic',t.id);assert.equal(hint.steps.length,1);assert.equal(hint.table,undefined);const full=answerOffline({topic:t.id,question:t.sample,mode:'explain'});assert.doesNotThrow(()=>JSON.stringify(full));if(['probability','function-table'].includes(t.id))assert(full.table);}
});
