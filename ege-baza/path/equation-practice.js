/* Focused linear-equation practice. Existing task IDs and seeds are unchanged. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,F=D.F;
const count=240;
const families=[
 {id:'equations-linear',title:'Линейные: как в первом разборе',idea:'Собери слагаемые с x слева, числа справа. К обеим частям применяй одно и то же действие.'},
 {id:'equations-signs',title:'Линейные: минусы и отрицательные корни',idea:'Вычесть отрицательное слагаемое — значит прибавить противоположное. В конце раздели обе части на коэффициент при x вместе с его знаком.'},
 {id:'equations-fractions',title:'Линейные: дробный ответ',idea:'Корень не обязан быть целым. После приведения подобных запиши частное как обыкновенную дробь; округлять не нужно.'},
 {id:'equations-brackets',title:'Линейные: сначала раскрой скобки',idea:'Умножь на число перед скобкой каждое слагаемое внутри. Затем собери слагаемые с x слева, числа справа.'}
];
const ids=new Set(families.map(m=>m.id));
const term=n=>(n<0?'−':'+')+' '+F(Math.abs(n));
const xterm=a=>(a===1?'':a===-1?'−':F(a))+'x';
const linear=(a,b)=>xterm(a)+(b?' '+term(b):'');
const step=(q,a,why)=>({q,a,why,strict:true});
function build(id,seed){
 const k=((Math.trunc(seed)%count)+count)%count;
 let c=1+Math.floor(k/5)%4,delta=2+k%5,a=c+delta,b=1+(k*7)%13,x=1+Math.floor(k/20),bracket=null,denominator=1;
 if(id==='equations-signs'){a=-2-k%5;delta=a-c;b=-3-(k*7)%17;x=Math.floor(k/20)-6;}
 if(id==='equations-fractions'){const den=2+Math.floor(k/80);denominator=den;x=Math.floor(k/20)%4+1/den;delta=den*(1+k%5);a=c+delta;}
 if(id==='equations-brackets'){a=2+k%4;c=a+1+Math.floor(k/4)%5;delta=a-c;bracket=k%5-2;b=a*bracket;x=Math.floor(k/20)-5;}
 const d=Math.round(delta*x+b),rhs=d-b,exact=n=>D.practice.fraction(Math.round(n*denominator),denominator);
 const left=bracket===null?linear(a,b):`${a}(x${bracket?' '+term(bracket):''})`;
 const steps=[];
 if(bracket!==null)steps.push(step(`Раскрой скобки ${left}. Какое свободное слагаемое получится?`,b,`${a} умножаем на каждое слагаемое: ${left} = ${linear(a,b)}.`));
 steps.push(step(`Вычти (${xterm(c)}) из обеих частей. Какой коэффициент останется при x слева?`,delta,`${F(a)} − (${F(c)}) = ${F(delta)}. Получаем ${linear(delta,b)} = ${F(d)}.`));
 steps.push(step(`Вычти (${F(b)}) из обеих частей. Какое число останется справа?`,rhs,`${F(d)} − (${F(b)}) = ${F(rhs)}. Теперь ${xterm(delta)} = ${F(rhs)}.`));
 steps.push(step('Раздели обе части на коэффициент при x. Чему равен x?',x,`x = (${F(rhs)})/(${F(delta)}). Можно ввести эту дробь без округления. Проверка: обе части исходного уравнения равны ${exact(a*x+b)}.`));
 if(denominator>1)steps[steps.length-1].a=exact(x);
 return {id,seed,pos:17,q:`${left} = ${linear(c,d)}. Найди x.`,answer:x,steps,strict:true,equationPractice:true,params:{a,b,c,d,bracket},model:{kind:'equation',left:[[a,1],[b,0]].filter(v=>v[0]!==0),right:[[c,1],[d,0]].filter(v=>v[0]!==0),root:x,...(bracket===null?{}:{expansion:`После раскрытия скобок: ${left} = ${linear(a,b)}. В модели работаем с этим равносильным уравнением.`})}};
}
D.meta.push(...families.map(m=>({...m,pos:17,gap:'equations',expanded:true,trainingOnly:true})));
D.task=(id,seed=1)=>ids.has(id)?build(id,seed):previous(id,seed);
D.equationPractice={families,count,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);
