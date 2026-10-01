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
console.log('PASS: exact fraction parsing, all 112 foundation answers, independent keys for all percentage steps, inverse-function identities, geometric projection, conservation and invalid percentage domains.');

module.exports={answerKeys,percentKeys};
