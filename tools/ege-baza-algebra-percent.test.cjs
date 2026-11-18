const assert=require('node:assert/strict'),M=require('../ege-baza/algebra/math.js'),P=require('../ege-baza/percent/math.js'),D=require('../ege-baza/algebra/data.js'),Q=require('../ege-baza/percent/data.js'),G=require('../ege-baza/labs/math.js');
global.AlgebraData=D;global.window={};require('../ege-baza/algebra/primary.js');delete global.window;delete global.AlgebraData;
for(const [input,n,d] of [['-1 1/2',-3,2],['0,375',3,8],['6/8',3,4],['2/-4',-1,2],['0',0,1]])assert.deepEqual(M.parse(input),{n,d});
for(const bad of ['','1/0','1 5/4','Infinity','2e3','1+2','<b>1</b>','1.2.3'])assert.equal(M.parse(bad),null,bad);
assert.equal(M.text(M.operate(M.parse('3/4'),M.parse('9/8'),'/')),'2/3');assert.equal(M.operate(M.parse('1'),M.parse('0'),'/'),null);
for(const a of [.25,.5,2,3,4])for(let x=-3;x<=3;x+=.25)assert(Math.abs(M.logarithm(a,M.exponential(a,x))-x)<1e-10);
for(const x of [-2,0])assert.equal(M.logarithm(2,x),null);assert.equal(M.logarithm(1,3),null);
const predicates={exp:[x=>x===2,x=>x<=-1,x=>x<1.5,x=>x===1.5],log:[x=>x===9,x=>x>1&&x<=5,x=>x>-2&&x<0,x=>x===3]};
for(const kind of ['exp','log'])D.lessons[kind].forEach((l,i)=>{for(let x=-5;x<=10;x+=.25)assert.equal(l.test(x),predicates[kind][i](x),kind+' '+i+' '+x);});
const answerKeys={add:['-11','-4','-4','-5','0','-3','-13','5'],multiply:['12','-3','-24','-14','-4',1,'-2','-7'],fractions:['5/6','7/12','-1/2','2/3','2/3',2,'19/24','-3/4'],mixed:['7/3','-5/6','5/12','4','4/3','3/8','7/4','-3/2'],decimals:['3.05','3.22','.12','40','-.35','9/20','1.87','12'],powers:['128','25','64','1/8','1','7','9','7'],identities:[1,2,1,1,0,2,1,0],equations:['4','7','1',1,2,'4','7',1],natural:['56','8','102','360','5','18','12','5'],place:['7000','941','432','963','3700','1549','904','444'],divisibility:['6','24','3/4',1,2,'36','10','24'],compare:[1,0,0,0,'12',1,1,1],units:['240','30000','90','2.5','22','28','6000','135'],wordparts:['11','24','43','115','20',1,'34','30']};
for(const [id,key] of Object.entries(answerKeys)){const bank=[...D.foundation[id].tasks,...D.foundation[id].check];assert.equal(bank.length,key.length,id);bank.forEach((t,i)=>assert(t.options?t.a===key[i]:M.equal(M.parse(t.a),M.parse(key[i])),id+' '+i));}
assert.deepEqual(G.perpendicularFoot([3,7],[0,1],[8,1]),[3,1]);assert.deepEqual(G.perpendicularFoot([2,2],[0,0],[4,4]),[2,2]);assert.equal(G.perpendicularFoot([1,1],[0,0],[0,0]),null);
for(let w=20;w<=1000;w+=20)for(const p of [.2,1,15,37.5,100,125,200]){assert(Math.abs(P.whole(P.part(w,p),p)-w)<1e-7);assert(Math.abs(P.percent(P.part(w,p),w)-p)<1e-7);}
assert.equal(P.percent(10,0),null);assert.equal(P.whole(12,0),null);assert.equal(P.chain(100,[-110]),null);
assert.equal(P.chain(1000,[20,-20]),960);assert.equal(P.reverseChange(-20),25);assert.equal(P.reverseChange(-100),null);assert.equal(P.mix(100,10,300,30),25);assert.equal(P.mix(100,101,200,20),null);assert.equal(P.concentration(30,300),10);assert.equal(P.concentration(30,20),null);
for(let a=1;a<=6;a++)for(let b=1;b<=6;b++){const r=P.split(750,a,b);assert(Math.abs(r.first+r.second-750)<1e-8);assert(Math.abs(r.first/r.second-a/b)<1e-8);}
const percentKeys=[[0,'2.4','36'],[1,'1.2','120'],['.375','37.5',1],[1,'.35','35'],['40',1,'50','100/3'],['5','150','300','40'],[1,'75','750',0],[1,'48','12',1],[1,'.8','2100'],['4000',1,'3600','28'],['1200','960','4','25'],['10',1,'25'],['30',1,'300','10'],['60','400','100'],['10','90','25',1],['.75','.3','.45','200'],['220','22','242',1]];
Q.lessons.forEach((l,i)=>l.steps.forEach((t,j)=>assert(t.options?t.a===percentKeys[i][j]:M.equal(M.parse(t.a),M.parse(percentKeys[i][j])),l.id+' '+j)));
assert.equal(Q.lessons.length,17);assert.equal(Q.extra.length+Q.lessons.length,24);
// Compute each expected result from the quantities displayed to the learner.
const modelRules={
 hundred:[
  [/Сколько открыток отобрали/, /дол|процент/, ([total,rate])=>total*rate/100],
  [/Сколько всего учебников подготовила/, /одному проценту|часть/, ([part,rate])=>part*100/rate],
  [/Сколько процентов записавшихся выбрали утро/, /100%|общего числа/, ([total,riders])=>riders*100/total],
  [/Сколько листов осталось/, /процент запаса остался/, ([total,used])=>total*(100-used)/100]
 ],
 compare:[
  [/прежний выпуск меньше нынешнего/, /100%|баз/, ([old,current])=>(current-old)*100/current],
  [/сбор вырос по сравнению с первой неделей/, /прибавку.*первую неделю/, ([first,second])=>(second-first)*100/first],
  [/На сколько процентных пунктов/, /разност/, ([first,second])=>second-first],
  [/Сколько процентов от числа посетителей среды/, /среды за 100%/, ([wednesday,thursday])=>thursday*100/wednesday]
 ],
 ratio:[
  [/Сколько синих плиток/, /дол/, ([total,white,blue])=>total*blue/(white+blue)],
  [/Сколько миллилитров морса получилось/, /объём сока.*дол/, ([juice,water,ml])=>ml*(juice+water)/juice],
  [/Сколько красных бусин/, /разност.*дол/i, ([red,blue,extra])=>extra*red/(blue-red)],
  [/Сколько миллилитров синей краски/, /жёлтой краске.*дол/i, ([yellow,blue,ml])=>ml*blue/yellow]
 ],
 shop:[
  [/Сколько рублей стоит рюкзак теперь/, /после скидки/, ([price,discount,rise])=>price*(100-discount)*(100+rise)/10000],
  [/Сколько рублей сэкономил покупатель/, /после каждой скидки/, ([price,first,second])=>price-price*(1-first/100)*(1-second/100)],
  [/Сколько рублей она стоила до повышения/, /перед скидкой.*перед повышением/, ([rise,drop,finalPrice])=>finalPrice/((1+rise/100)*(1-drop/100))],
  [/На сколько процентов итоговая цена ниже/, /первоначальную цену за 100/, ([rise,drop])=>100-(100+rise)*(1-drop/100)]
 ],
 mix:[
  [/Сколько процентов соли в новом растворе/, /чистая вода|вод/, ([mass,rate,water])=>mass*rate/(mass+water)],
  [/Сколько процентов соли стало в растворе/, /соли.*сохраняется/, ([mass,rate,water])=>mass*rate/(mass+water)],
  [/испарилось .* г воды/, /вычтите.*масс/i, ([mass,rate,water])=>mass*rate/(mass-water)],
  [/Сколько процентов соли в смеси/, /соли в каждом растворе/, ([firstMass,firstRate,secondMass,secondRate])=>(firstMass*firstRate+secondMass*secondRate)/(firstMass+secondMass)]
 ],
 growth:[
  [/В каждый из двух месяцев израсходовали/, /каждого месяца|первого месяца/, ([mass,rate])=>mass*((100-rate)/100)**2],
  [/Два сезона подряд .*увеличивалось/, /прирост.*этого числа/, ([start,increase])=>start*(1+increase/100)**2],
  [/Каждый из трёх дней .* первоначального запаса/, /первоначального/, ([start,rate])=>start*(1-3*rate/100)],
  [/Сколько метров ткани было в начале первого месяца/, /обратном порядке/, ([rate,end])=>end/(1-rate/100)**2]
 ]
};
const waterAddedRatios=new Set();
const warmupQuantities={
 hundred:[[80,12.5],[160,12.5]],compare:[[75,100],[160,200]],ratio:[[70,2,5],[140,2,5]],
 shop:[[400,25,20],[800,25,20]],mix:[[50,12,50],[100,18,100]],growth:[[25,20],[50,20]]
};
for(const [model,rules] of Object.entries(modelRules)){
 const questions=new Set(),transferRules=[];
 for(let round=0;round<20;round++){
  const task=Q.modelTask(model,round);
  const matches=rules.filter(([question])=>question.test(task.q));
  assert.equal(matches.length,1,model+' — '+task.q);
  const [wording,hint,solve]=matches[0];
  const values=Array.from(task.q.matchAll(/\d+(?:[.,]\d+)?/g),m=>Number(m[0].replace(',','.')));
  if(model==='mix'){
   for(const [,percent] of task.q.matchAll(/(\d+)%/g))assert(Number(percent)<=24,task.q);
   assert(Number(task.a)<=24,task.q);
   if(task.q.includes('добавили'))waterAddedRatios.add(values[2]/values[0]);
  }
  const expected=solve(values);
  const answer=M.parse(task.a);
  assert(answer,task.q+' — '+task.a);
  assert(Math.abs(answer.n/answer.d-expected)<1e-8,task.q+' — ожидается '+expected+', записано '+task.a);
  assert.match(task.hint,hint,task.q+' — '+task.hint);
  if(round<2){
   assert.equal(wording,rules[0][0],model+' warm-up');
   assert.deepEqual(values,warmupQuantities[model][round],task.q);
  }else{
   transferRules.push(wording);
  }
  questions.add(task.q);
 }
 assert.equal(questions.size,20,model+' distinct problems');
 assert.equal(new Set(transferRules).size,3,model+' transfer families');
 for(let i=0;i+2<transferRules.length;i++)
  assert(new Set(transferRules.slice(i,i+3)).size>=2,model+' repeated transfer family');
 for(let round=0;round<3;round++)assert.deepEqual(Q.modelTask(model,round+20),Q.modelTask(model,round));
}
assert(waterAddedRatios.size>=2,'Dilution tasks must vary the water-to-solution mass ratio');
console.log('PASS: exact fraction parsing, all 112 foundation answers, 120 model tasks recalculated from their wording, independent keys for all percentage steps, inverse-function identities, geometric projection, conservation and invalid percentage domains.');

module.exports={answerKeys,percentKeys};
