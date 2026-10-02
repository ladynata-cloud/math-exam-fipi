'use strict';
const assert=require('node:assert/strict'),D=require('../school/m9-exercises/data'),Check=require('../school/m9-exercises/checks'),State=require('../school/m9-exercises/app');
const C=require('../school/curriculum'),M=require('../school/math');require('../school/algebra7').install(C,M);require('../school/secondary').install(C,M);require('../school/core-content').install(C);require('../school/core-math').install(M);require('../school/paths').install(C);const E=require('../school/editions-content');E.install(C);require('../school/editions-math').install(M);const V6=require('../school/vilenkin6-lessons');V6.install(C,E);require('../school/vilenkin5-lessons').install(C,V6);require('../school/makarychev9-lessons').install(C,E);
assert.equal(D.total,891);assert.deepEqual(D.exercises.map(e=>e.number),Array.from({length:97},(_,i)=>i+1));assert.equal(D.exercises.reduce((n,e)=>n+e.parts.length,0),311);
let steps=0;for(const e of D.exercises)for(const p of e.parts){assert(C.byId[p.skill],p.skill);assert(p.steps.length>=2);assert(p.steps.some(s=>s.final));for(const s of p.steps){steps++;if(s.options&&Array.isArray(s.example))for(const id of s.example)assert(s.options.some(x=>x[0]===id),'answer absent from visible choices '+e.number);assert(s.explain&&s.hints.length===2);const a=['interval','angle','form','construction'].includes(s.rule.type)?JSON.parse(s.example):s.example;assert(Check.check(s,a).ok,`${e.number} ${p.label}: ${s.prompt}`);assert(!Check.check(s,'').ok,'empty accepted');if(s.rule.type==='number'&&s.rule.value!==0)assert(!Check.check(s,'0').ok,'zero accepted for '+s.rule.value);if(s.rule.type==='choice'){assert(!Check.check(s,s.rule.answer.concat('impossible')).ok);assert(!Check.check(s,[...s.rule.answer,...s.rule.answer]).ok);}}}
function final(n,p=0){return D.byNumber[n].parts[p].steps.filter(s=>s.final);}
function numeric(n,values){values.forEach((v,i)=>assert(Math.abs(final(n,i).at(-1).rule.value-v)<1e-12*Math.max(1,Math.abs(v)),`source oracle #${n}/${i}`));}
// Independent calculations from the visually verified printed source.
numeric(20,[Math.sqrt(1)-Math.sqrt(.64),Math.sqrt(1-.64),2*Math.sqrt(.12+4*.01),Math.sqrt(3*.6-.8),Math.sqrt(.7+Math.sqrt(.09)),-Math.sqrt(4.8-Math.sqrt(.64))]);
numeric(21,[(22.5/.45)*(5.27+1.93),(7.6-8.5)/(.23+2.92),35.4*(62.4-49.9)-12.5*15.4,12.48/(1.23+1.17)-14.7/.49]);
numeric(33,[62/5-(16/7)/(40/21),(62/5-16/7)/(40/21)]);
const numbers34=[[2.4*10**-2,.0125*10**3],[(1.3*10**-2)**2,5.2*10**-5],[15.4*10**6,.044*10**7],[(3.5*10**-3)**2,(7*10**-4)**2]];
numbers34.forEach(([a,b],i)=>{const expect=[a+b,a-b,a*b,a/b];final(34,i).forEach((s,j)=>assert(Check.check(s,String(expect[j])).ok,`#34/${i}/${j}`));});
numeric(35,[7**5*(7**2)**4/7**11,11**(-4)*11**13/11**17,5**9/5**(-12)/5**20,10/(5**(-2))**13/25**14,(15**5/(3**3*5**4))/(12**5/(3**6*4**6)),(10**10/(2**8*5**9))/(17**6*8**3/34**7)]);
const gcd=(a,b)=>b?gcd(b,a%b):a;function rat(n,d){const g=gcd(n,d);return [n/g,d/g];}
const big36=[rat(27n**5n+27n**4n,9n**8n+9n**7n+9n**6n),rat(16n**7n+16n**6n,8n**10n+8n**9n+8n**8n),rat(4n**95n+4n**94n+4n**93n,21n*(16n**2n)**23n)];
big36.forEach(([n,d],i)=>assert(Check.check(final(36,i)[0],n+'/'+d).ok));
const ranges=[[1,3],[2,3],[5,6],[7,9],[19,11],[34,15]];ranges.forEach(([n,d],i)=>assert(Check.check(final(7,i)[0],D.periodic(n,d)).ok));
// Source comparisons checked by independent fractions/known decimal prefixes.
const expectedSigns={25:['<','<','>','=','<','<','<','=','>','<'],26:['>','<','>','>'],27:['>','>','>','<'],28:['=','>','=','<','>','='],29:['<','<'],32:['>','=','>','<']};
for(const [n,signs]of Object.entries(expectedSigns))signs.forEach((s,i)=>assert.deepEqual(final(n,i).at(-1).rule.answer,[s]));
const witness=final(1,0)[0];assert(Check.check(witness,'0.002;0.003;0.004;0.005;0.006;0.007;0.008;0.009;0.0091;0.0092').ok);assert(!Check.check(witness,'0.001;0.003;0.004;0.005;0.006;0.007;0.008;0.009;0.0091;0.0092').ok);
assert(Check.check(final(1,1)[0],'sqrt(5)/1000;pi/1000').ok);assert.equal(Check.check(final(4,0)[0],'sqrt(2)*sqrt(2);0').unsupported,true);assert(Check.check(final(4,0)[0],'-4;-100').ok);assert(Check.check(final(15,0)[0],'1/4;4/9;9/16;16/25;0').ok);assert(Check.check(final(15,1)[0],'1/2;3/4;2;3;5').ok);
assert(!Check.check(final(14,0)[0],'').ok);assert(Check.check(final(14,0)[0],'2,65').ok);assert(!Check.check(final(14,0)[0],'2,7').ok);
assert.equal(Check.number('-2^2').value,-4);assert.equal(Check.number('(-2)^2').value,4);assert.equal(Check.number('sqrt(4/9)').rational,true);assert.equal(Check.number('sqrt(2)').rational,false);assert(Check.close(Check.number('0,0(9)').value,.1));assert.equal(Check.number('2^(-3)').value,.125);assert.throws(()=>Check.number('alert(1)'));assert.throws(()=>Check.number('1/0'));
let state=State.blank();state.records['1:0']={seen:true,learn:true,check:false,independent:false};assert.deepEqual(State.validate(state),state);assert.throws(()=>State.validate({}));assert.throws(()=>State.validate({...state,records:{'100:0':state.records['1:0']}}));assert.throws(()=>State.validate({...state,sessions:{'1:0':{mode:'learn',index:999}}}));

// New source checks: decimal rounding, uncertainty intervals and Vieta.
numeric(37,[.04,.034,.046]);numeric(38,[.13,4,.047,.002]);numeric(39,[1/350]);numeric(47,[100/101]);numeric(48,[100/39]);numeric(49,[10/510.2]);numeric(53,[-48,10]);
assert(Check.check(final(45)[0],{angle:23,reading:'23'}).ok);assert(!Check.check(final(45)[0],{angle:90,reading:'90'}).ok);assert(!Check.check(final(45)[0],{angle:35,reading:'145'}).ok);
for(const p of [-100,-7,-.5,0,1,100]){assert(Math.abs(((3*p+1)*(2*p+1)+p)-6*p*(p+1)-1)<1e-9);assert(Math.abs((2*p-1)*(2*p+1)+3*(p+1)-(4*p+3)*p-2)<1e-9);}

console.log(`PASS M9 numbered: 97 exercises, 311 parts, ${steps} steps; source arithmetic with separate BigInt checks; open alternatives; strict endpoints; parser and progress validation.`);

// Source-derived oracle for the continuation. Calculations are independent of
// the worked-step examples; mixed-coordinate, unit and budget mistakes fail.
const model=require('../school/m9-exercises/models');
const end=(n,p=0)=>D.byNumber[n].parts[p].steps.at(-1);
numeric(56,[9460*1e9/1000,120/1e9]);numeric(57,[3e8*1e-9*1000]);numeric(58,[1e9/6e6]);
numeric(63,[Math.floor(500/26.5)]);numeric(64,[Math.floor(500/(26.5*.8))-Math.floor(500/26.5)]);
numeric(65,[22000*.7+45000*.85]);numeric(66,[Math.ceil(385/24)]);
numeric(67,[Math.ceil(500000/(36000+48000-[30000,11600,2000,700,6400,10000].reduce((s,x)=>s+x,0)))]);
numeric(69,[10/90*100]);numeric(70,[Math.ceil(2*(.8+2.7)*3.2*.75*2*.25)]);numeric(71,[30]);numeric(75,[1/25,15**2+4]);numeric(77,[4/3]);
for(const [n,pairsByPart,conditions]of [[60,[[[16,15],[-15,-16]],[[4,-7],[8,1]]],[(x,y)=>x-y===1&&x*y===240,(x,y)=>x*x+y*y===65&&2*x-y===15]],[74,[[[1,4]],[[1.5,1]]],[(x,y)=>3*y-2*x===10&&7*x+5*y===27,(x,y)=>Math.abs(.4*x-.2*y-.4)<1e-12&&x+11*y===12.5]]]){
 pairsByPart.forEach((pairs,p)=>{for(const [x,y]of pairs)assert(conditions[p](x,y));assert(Check.check(end(n,p),pairs.slice().reverse().map(a=>a.join(';')).join('|')).ok);assert(!Check.check(end(n,p),'1;1|1;1').ok);});}
assert(!Check.check(end(60,0),'16;-16|-15;15').ok);
for(const a of [-7,-2,.5,2,6])for(const b of [-5,-1,1,4])if(a!==b&&a!==-b){const v=(2*a*b/(a*a-b*b)+(a-b)/(2*a+2*b))*2*a/(a+b)+b/(b-a);assert(Math.abs(v-1)<1e-10);const v2=b/(a-b)-(a**3-a*b*b)/(a*a+b*b)*(a/(a-b)**2-b/(a*a-b*b));assert(Math.abs(v2+1)<1e-10);const v3=(a*b*b-a*a*b)/(a+b)*(a+a*b/(a-b))/(a-a*b/(a+b));assert(Math.abs(v3+a*b)<1e-10);}
for(const a of [-8,-4,-2,0,1,2,4,9]){const v=((a-3)/(a*a-3*a+9)-(6*a-18)/(a**3+27))/((5*a-15)/(4*a**3+108));assert(Math.abs(v-4*(a-3)/5)<1e-10);}
const costData=[[275,1000,80],[105,250,156],[45,1000,120],[20,1000,53],[15,500,45],[15,12,17],[350,1000,47],[700,1000,450],[130,1000,30],[10,25,40]];
const consumed=costData.reduce((sum,[amount,pack,price])=>sum+amount/pack*price,0),receipt=costData.reduce((sum,[amount,pack,price])=>sum+Math.ceil(amount/pack)*price,0);
assert(Math.abs(consumed-467.93)<1e-10);assert.equal(receipt,1055);[consumed,1500-consumed,receipt,1500-receipt].forEach((x,i)=>assert(Check.check(D.byNumber[72].parts[10].steps[i],String(x)).ok));
for(const [i,[amount,pack]] of costData.entries())assert(Check.check(end(72,i),String(Math.ceil(amount/pack)*pack-amount)).ok);
assert(Check.check(end(68),{length:'72',count:'1500',time:'18',distance:'1080',speed:'60'}).ok);assert(!Check.check(end(68),{length:'72',count:'1500',time:'18',distance:'108000',speed:'6000'}).ok);
assert(!Check.check(end(78),{circumference:'0',diameter:'0',ratio:'3.14',error:'0'}).ok);assert(Check.check(end(78),{circumference:'62.8',diameter:'20',ratio:'3.14',error:'0.0016'}).ok);
assert(Check.check(end(76,1),{before:'5',after:'20',percent:'300'}).ok);assert(!Check.check(end(76,1),{before:'5',after:'20',percent:'400'}).ok);
for(let i=0;i<18;i++){const s=D.byNumber[62].parts[i].steps[0];for(const unit of s.rule.answer)assert(Check.check(s,[unit]).ok);assert(!Check.check(s,[s.options.at(-1)[0]]).ok);}
assert.equal(model.calculate('purchase',{budget:500,price:26.5,discount:0}).count,18);assert.equal(model.calculate('purchase',{budget:500,price:26.5,discount:20}).count,23);
assert.equal(model.calculate('discount',{fridge:2,washer:1}).total,53650);assert.equal(model.calculate('rooms',{rooms:16}).missing,1);
assert.equal(model.calculate('budget',{months:22,reserve:10000}).total,512600);assert.equal(model.calculate('walls',{layers:2,glass:25}).cans,9);assert(Math.abs(model.calculate('circle',{radius:4/3}).difference-1)<1e-12);
console.log('PASS continuation oracle: source algebra, all system pairs, units, 10 product rows, distinct receipt/consumption models, user measurements, ambiguous source data, interactive model calculations.');

// Chapter I completion: independent source oracles and counterexamples.
assert.equal(D.exercises.filter(e=>e.number>=79).reduce((n,e)=>n+e.parts.length,0),65);
assert.equal(steps,774);
const boundSources=[[-5*Math.sqrt(6),Math.sqrt(83)],[3*Math.sqrt(3),4*Math.sqrt(11)],[-5*Math.sqrt(6),-Math.sqrt(68)/2],[-2*Math.sqrt(54)/3,6*Math.sqrt(147)/7]];
boundSources.forEach(([lo,hi],p)=>{const integers=Array.from({length:100},(_,i)=>i-50).filter(x=>x>lo&&x<hi);assert(Check.check(end(81,p),String(integers.length)).ok);assert.equal(D.byNumber[81].parts[p].steps[0].rule.value,integers[0]);assert.equal(D.byNumber[81].parts[p].steps[1].rule.value,integers.at(-1));});
for(let p=0;p<8;p++){const r=end(79,p),[factor,shift]=[[2,0],[-1,0],[1,1],[1,-2]][p%4];for(const a of p<4?[.1,.45,.9]:[-1.5,-.1,.8]){assert(Check.check(r,{a:String(a),point:String(a*factor+shift)}).ok);assert(!Check.check(r,{a:String(a),point:String(a*factor+shift+.04)}).ok);}assert(!Check.check(r,{a:'1',point:'0'}).ok);}
for(const v of ['1;1','1;100','5;6'])assert(Check.check(end(80,1),v).ok);
for(const v of ['0;1','5;2','-1;2','2.5;3'])assert(!Check.check(end(80,1),v).ok);
for(const v of ['1;2','7;3','101;10'])assert(Check.check(end(80,2),v).ok);
for(const v of ['6;3','0;2','2;0','2;1'])assert(!Check.check(end(80,2),v).ok);
const radicals82=[Math.sqrt(72)/Math.sqrt(50),(Math.sqrt(24)-Math.sqrt(54))*Math.sqrt(12),(3-Math.sqrt(5))**2+(3+Math.sqrt(5))**2,(Math.sqrt(13)+Math.sqrt(8))**2];
radicals82.forEach((v,p)=>assert(Check.check(D.byNumber[82].parts[p].steps[1],String(v)).ok));
const first83=Math.sqrt((7-4*Math.sqrt(3))**2)-Math.sqrt((4-2*Math.sqrt(3))**2);assert(Math.abs(first83-(3-2*Math.sqrt(3)))<1e-12);assert(Check.check(final(83)[0],String(first83)).ok);assert.deepEqual(end(83).rule.answer,['В напечатанном виде утверждение неверно']);
assert(Check.check(end(83,1),String(Math.sqrt((37+12*Math.sqrt(7))**2)+Math.sqrt((37-12*Math.sqrt(7))**2))).ok);
assert.deepEqual(D.byNumber[84].parts.map(p=>p.steps.at(-1).rule.answer[0]),['C','D','B','A']);
const orderValues86=[{'(2/3)⁻⁴':(2/3)**-4,'2/3':2/3,'(3/2)⁻⁴':(3/2)**-4,'(3/2)⁰':1},{'(2,5)⁻³':2.5**-3,'2,5':2.5,'(2,5)⁻⁵':2.5**-5,'(2,5)⁰':1},{'(4/9)⁻⁵':(4/9)**-5,'(4/9)⁻⁶':(4/9)**-6,'4/9':4/9,'(4/9)⁰':1}];
orderValues86.forEach((v,p)=>assert.deepEqual(end(86,p).rule.answer,Object.keys(v).sort((a,b)=>v[b]-v[a])));
for(const [p,a,b]of [[0,5,5],[1,-5,7],[2,0,3]])assert(Check.check(end(87,p),String(a/b)).ok);
numeric(88,[10,2,-29,3]);
const r2=Math.sqrt(2),r3=Math.sqrt(3),r5=Math.sqrt(5),radicals90=[(r2+r3)*(r2-r3),(r2+2*r3)*(r2-r3),1/(2+r3)+1/(2-r3),1/(r3-r2)-1/(r3+r2),(r2+r3)/(r3-r2),r5/(r5-r2)+r5/(r5+r2)];
radicals90.forEach((v,p)=>assert(Check.check(D.byNumber[90].parts[p].steps[1],String(v)).ok));
for(const [p,v]of [13/7,-13/7,5/16,-5/16,Math.sqrt(3),-Math.sqrt(3)].entries())for(let d=1;d<=3;d++){
 const [lo,hi]=D.byNumber[91].parts[p].steps.slice((d-1)*2,d*2).map(s=>s.rule.value);assert(lo<v&&v<hi);assert(Math.abs(hi-lo-10**-d)<1e-12);assert(Math.abs(lo*10**d-Math.round(lo*10**d))<1e-9);
}
const rounded92=[Math.sqrt(5)+Math.sqrt(7),4/11-Math.sqrt(8),11/9*-Math.sqrt(5),Math.sqrt(2)-5/8,3/16/Math.sqrt(3)];
rounded92.forEach((v,p)=>[1,2].forEach((digits,i)=>assert(Check.check(D.byNumber[92].parts[p].steps[i],v.toFixed(digits)).ok)));
assert(Check.check(end(93),String(-5*25+45*5+2)).ok);assert(Check.check(final(93,1)[0],String(-5*100+45*10+2)).ok);
const land=model.calculate('projectile',{time:10});assert(land.landing>9&&land.landing<10);assert.equal(land.height,-48);assert(Math.abs(-5*land.landing**2+45*land.landing+2)<1e-10);
numeric(94,[7700*3.14*.025**2*.8]);numeric(95,[1e-3*40**2/2]);
const room=end(96),small={length:'4',width:'3',height:'2.5',openings:'2',walls:'35',floor:'12',rolls:'3',packs:'5',total:'12400'};
assert(Check.check(room,small).ok);assert(!Check.check(room,{...small,rolls:'2'}).ok);assert(!Check.check(room,{...small,openings:'100'}).ok);assert(!Check.check(room,{...small,length:'-4'}).ok);assert(D.byNumber[96].parts[0].manual);
assert(Check.check(end(97,1),String((12-1)*(21-12)*5**2)).ok);assert(!Check.check(end(97,1),'99').ok);assert(!Check.check(end(97,1),'495').ok);
assert.equal(D.byNumber[97].parts[2].steps[2].rule.value,Math.ceil(73/(120/4)));assert.equal(end(97,2).rule.value,Math.ceil((73-60)/(120/4/6)));
const park=end(97,3);assert(Check.check(park,{side:'25',rows:'2',places:'10',total:'20'}).ok);assert(!Check.check(park,{side:'20',rows:'2',places:'10',total:'20'}).ok);assert(!Check.check(park,{side:'25',rows:'3',places:'10',total:'30'}).ok);
let debt=200000000n;const debtRows=[];while(debt){const interest=debt/10n,payment=debt+interest<50000000n?debt+interest:50000000n;debt+=interest-payment;debtRows.push([payment,debt]);}
assert.equal(debtRows.length,6);assert.equal(debtRows[4][1],16847000n);assert.equal(debtRows[5][0],18531700n);
const loan=model.calculate('loan',{payment:500000});assert.equal(loan.years,debtRows.length);assert.equal(loan.last,Number(debtRows[5][0])/100);assert.equal(loan.rows[4].balance,168470);assert(model.calculate('loan',{payment:400000}).years>loan.years);
assert.equal(model.calculate('capacitor',{voltage:80}).energy/model.calculate('capacitor',{voltage:40}).energy,4);
assert.equal(model.calculate('cylinder',{radius:5,length:80}).mass/model.calculate('cylinder',{radius:2.5,length:80}).mass,4);
assert.equal(model.calculate('cylinder',{radius:2.5,length:160}).mass/model.calculate('cylinder',{radius:2.5,length:80}).mass,2);
console.log('PASS Chapter I oracle: 79–97, flexible constructions/counterexamples, source typo, rationalization, negative bounds, flight domain, own room, fence area, parking and exact kopeck loan recurrence.');
