/* Source figures and learner-built graphs. No saved state or completion credit here. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../peterson6/math.js'):root.PetersonMath);if(typeof module==='object'&&module.exports)module.exports=api;else root.MakarychevTaskGraphs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
function number(raw,limit=1000000){
 const s=String(raw).trim().replace(/−/g,'-').replace(/,/g,'.');
 // Share the checker's exact fraction parser so accepted mixed numbers also
 // produce points and curves. Keep the existing graph-only numeric syntax.
 const rational=M?.parse(s);
 if(rational){const v=rational.n/rational.d;return Math.abs(v)<=limit?v:null;}
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*[+-]?\d+(?:\.\d+)?)?$/.test(s))return null;
 const parts=s.split('/').map(Number),v=parts.length===2?parts[0]/parts[1]:parts[0];
 return Number.isFinite(v)&&Math.abs(v)<=limit?v:null;
}
function parse(value){
 const parts=String(value).split(';');if(parts.length<3||parts.length>12)return null;
 const k=number(parts[0]),b=number(parts[1]);
 const holes=parts.length===3&&parts[2].trim().toLowerCase()==='нет'?[]:parts.slice(2).map(v=>number(v));
 if(k===null||b===null||holes.some(x=>x===null)||new Set(holes).size!==holes.length)return null;
 return {k,b,holes};
}
function parseLine(value){const parts=String(value).split(';');if(parts.length!==2)return null;const [k,b]=parts.map(v=>number(v,1000000000000));return k===null||b===null?null:{k,b};}
function parsePair(value){
 const parts=String(value).split(';');if(parts.length!==4)return null;
 const values=parts.map(v=>number(v));if(values.some(v=>v===null))return null;
 return [{k:values[0],b:values[1],holes:[]},{k:values[2],b:values[3],holes:[]}];
}
function parseRootPoints(value,xs){
 const parts=String(value).split(';');if(!Array.isArray(xs)||xs.length<2||xs.length>12||parts.length!==xs.length)return null;
 const ys=parts.map(v=>number(v));if(ys.some(v=>v===null)||xs.some(x=>!Number.isFinite(x)))return null;
 return xs.map((x,i)=>[x,ys[i]]);
}
function curveValue(curve,x){
 if(curve.domain&&(x<curve.domain[0]||x>curve.domain[1]))return NaN;
 if((curve.holes||[]).some(([h])=>x===h))return NaN;
 if(curve.kind==='quotient'){
  const polynomial=coeff=>coeff.reduceRight((sum,c)=>sum*x+c,0);
  const bottom=polynomial(curve.denominator);return bottom===0?NaN:polynomial(curve.numerator)/bottom;
 }
 if(curve.kind==='reciprocal-offset')return x===0?NaN:curve.b+curve.k/x;
 if(curve.kind==='absolute-reciprocal')return x===0?NaN:curve.k/Math.abs(x);
 if(curve.kind==='sign-linear')return x===curve.h?NaN:Math.sign(x-curve.h)*(curve.k*x+curve.b);
 if(curve.kind==='abs-linear')return curve.k*Math.abs(x)+curve.b;
 if(curve.kind==='sqrt')return x>=0?Math.sqrt(x):NaN;
 if(curve.kind==='line')return curve.k*x+curve.b;
 if(curve.kind==='hyperbola')return x===0?NaN:curve.k/x;
 if(curve.kind==='quadratic')return curve.a*x*x+curve.b*x+curve.c;
 if(curve.kind==='square')return x*x;
 if(curve.kind==='cube')return (curve.scale??1)*x*x*x;
 if(curve.kind==='sqrt-shift')return x>=curve.h?Math.sqrt(x-curve.h)+(curve.k||0):NaN;
 if(curve.kind==='sqrt-abs')return Math.sqrt(Math.abs(x));
 if(curve.kind==='abs-ratio')return x===0?NaN:(curve.scale??1)*Math.abs(x)/x;
 if(curve.kind==='x-abs')return (curve.scale??1)*x*Math.abs(x);
 return NaN;
}
function node(name,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs||{}))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function graph(k,b,holes,range,label,otherLines=[]){
 const size=300,pad=24,scale=(size-2*pad)/(2*range),x=v=>150+scale*v,y=v=>150-scale*v;
 const svg=node('svg',{viewBox:'0 0 300 300',role:'img','aria-label':label});
 const line=(x1,y1,x2,y2,stroke,width=1)=>svg.append(node('line',{x1,y1,x2,y2,stroke,'stroke-width':width}));
 for(let v=-range;v<=range;v++){line(x(v),pad,x(v),size-pad,'#e1e7e2');line(pad,y(v),size-pad,y(v),'#e1e7e2');}
 line(pad,150,size-pad,150,'#567468',1.5);line(150,pad,150,size-pad,'#567468',1.5);
 const step=range>4?2:1;
 for(let v=-range+1;v<range;v++)if(v&&v%step===0){svg.append(node('text',{x:x(v),y:169,'text-anchor':'middle','font-size':16,fill:'#203b36'},v));svg.append(node('text',{x:139,y:y(v)+5,'text-anchor':'end','font-size':16,fill:'#203b36'},v));}
 svg.append(node('text',{x:282,y:145,'font-size':18},'x'),node('text',{x:158,y:22,'font-size':18},'y'),node('text',{x:157,y:169,'font-size':14},'0'));
 for(const [index,g]of [{k,b,holes},...otherLines].entries())if(g.k!==null){
  const {k,b,holes}=g,color=index?'#9b4d14':'#087c92';
  // Clip the mathematical line to the square without large coordinates or a shared SVG id.
  const points=[[-range,k*-range+b],[range,k*range+b]];
  if(k!==0)points.push([(-range-b)/k,-range],[(range-b)/k,range]);
  const inside=points.filter(([a,c])=>a>=-range-1e-9&&a<=range+1e-9&&c>=-range-1e-9&&c<=range+1e-9);
  if(inside.length>=2){const p=inside[0],q=inside.find(v=>Math.hypot(v[0]-p[0],v[1]-p[1])>1e-9);if(q){const l=node('line',{x1:x(p[0]),y1:y(p[1]),x2:x(q[0]),y2:y(q[1]),stroke:color,'stroke-width':3,'data-k':k,'data-b':b,'data-line-index':index});svg.append(l);}}
  for(const h of holes){const v=k*h+b;if(Math.abs(h)<=range&&Math.abs(v)<=range)svg.append(node('circle',{cx:x(h),cy:y(v),r:5,fill:'white',stroke:color,'stroke-width':2,'data-hole-x':h,'data-hole-y':v}));}
 }
 return svg;
}
const alternatives=[{k:-1,b:1,holes:[0]},{k:1,b:-1,holes:[]},{k:-1,b:1,holes:[1]},{k:1,b:-1,holes:[1]}];
function rootGraph(config,value){
 const xr=config.xRange||[-1,10],yr=config.yRange||[-1,6],width=360,height=260;
 const pad=config.compactTicks?56:Math.max(30,Math.max(...yr.map(v=>String(Math.round(v)).length))*10+6);
 if(xr.length!==2||yr.length!==2||![...xr,...yr].every(Number.isFinite)||xr[0]>=xr[1]||yr[0]>=yr[1])throw Error('Invalid root graph bounds');
 const x=v=>pad+(v-xr[0])/(xr[1]-xr[0])*(width-2*pad),y=v=>height-pad-(v-yr[0])/(yr[1]-yr[0])*(height-2*pad);
 const svg=node('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-label':config.label||(['root-build','curve-build'].includes(config.type)?'Координатная плоскость для твоего построения':'Графики функций на координатной плоскости')});
 const line=(x1,y1,x2,y2,color,attrs={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:color,'stroke-width':1,...attrs}));
 const step=(a,b)=>{const size=(b-a)/(Math.max(Math.abs(a),Math.abs(b))>=10000?3:6),p=Math.pow(10,Math.floor(Math.log10(size)));return [1,2,5,10].find(n=>n*p>=size)*p;};
 const label=v=>config.compactTicks&&Math.abs(v)>=10000?v.toExponential(0):Math.abs(v)>=10000?Number(v.toPrecision(3)).toString():Number(v.toFixed(4)).toString();
 const sx=config.xTickStep||step(...xr),sy=config.yTickStep||step(...yr),gx=config.gridStep||(xr[1]-xr[0]<=24?Math.min(1,sx):sx),gy=config.gridStep||(yr[1]-yr[0]<=24?Math.min(1,sy):sy),hasXAxis=yr[0]<=0&&yr[1]>=0,hasYAxis=xr[0]<=0&&xr[1]>=0;
 if(![sx,sy,gx,gy].every(v=>Number.isFinite(v)&&v>0)||(xr[1]-xr[0])/gx>200||(yr[1]-yr[0])/gy>200)throw Error('Invalid root grid');
 for(let v=Math.ceil(xr[0]/gx)*gx;v<=xr[1]+gx/100;v+=gx)line(x(v),pad,x(v),height-pad,'#e1e7e2');
 for(let v=Math.ceil(yr[0]/gy)*gy;v<=yr[1]+gy/100;v+=gy)line(pad,y(v),width-pad,y(v),'#e1e7e2');
 for(let v=Math.ceil(xr[0]/sx)*sx;v<=xr[1]+sx/100;v+=sx){svg.append(node('text',{x:x(v),y:height-7,'text-anchor':'middle','font-size':18},label(v)));}
 for(let v=Math.ceil(yr[0]/sy)*sy;v<=yr[1]+sy/100;v+=sy){svg.append(node('text',{x:pad-5,y:y(v)+4,'text-anchor':'end','font-size':18},label(v)));}
 // A cropped view may omit zero. Its boundary is not a coordinate axis.
 if(hasXAxis){line(pad,y(0),width-pad,y(0),'#567468',{'data-axis':'x'});svg.append(node('text',{x:config.axisLabels?width-6:width-14,...(config.axisLabels?{'text-anchor':'end'}:{}),y:y(0)-6,'font-size':18,'data-axis-label':'x'},config.axisLabels?.[0]||'x'));}
 if(hasYAxis){line(x(0),pad,x(0),height-pad,'#567468',{'data-axis':'y'});svg.append(node('text',{x:x(0)+6,y:18,'font-size':18,'data-axis-label':'y'},config.axisLabels?.[1]||'y'));}
 const colors=['#087c92','#9b4d14','#7657ad'];
 const learner=['root-build','curve-build'].includes(config.type);
 const buildCurves=config.type==='curve-build'?(config.curves||[]):[{...(config.curve||{kind:'sqrt'}),xs:config.xs||[0,1,4,9]}];
 const definitions=buildCurves.flatMap(curve=>(curve.xs||[]).map(a=>({a,curve}))),xs=definitions.map(d=>d.a),points=learner?parseRootPoints(value,xs):null;
 // Construction begins with an empty coordinate plane. An exact curve is
 // shown only after the learner has supplied all correct defining points.
 const complete=config.showSolution!==false&&points&&points.every(([a,b],i)=>Number.isFinite(curveValue(definitions[i].curve,a))&&b===curveValue(definitions[i].curve,a));
 const curves=learner?(complete?buildCurves:[]):(config.curves||[{kind:'sqrt'}]);
 curves.forEach((c,j)=>{
  let path='',open=false,previous=null;
  const breaks=[...(c.holes||[]).map(([h])=>h),...(c.poles||[])];
  if(['hyperbola','reciprocal-offset','absolute-reciprocal'].includes(c.kind))breaks.push(0);
  if(c.kind==='sign-linear')breaks.push(c.h);
  const samples=Array.from({length:601},(_,i)=>xr[0]+(xr[1]-xr[0])*i/600);
  for(const cut of breaks)if(cut>=xr[0]&&cut<=xr[1])samples.push(cut);
  if(xr[0]<=0&&xr[1]>=0)samples.push(0);
  if(c.kind==='sqrt-shift'&&c.h>=xr[0]&&c.h<=xr[1])samples.push(c.h);
  for(const a of c.xs||[])if(a>=xr[0]&&a<=xr[1])samples.push(a);
  samples.sort((a,b)=>a-b);
  for(const a of samples){
   const b=curveValue(c,a);
   const inside=Number.isFinite(b)&&b>=yr[0]&&b<=yr[1];
   const continuous=previous&&!breaks.some(h=>previous[0]<=h&&h<=a)&&Math.abs(y(b)-y(previous[1]))<height/2;
   if(inside){path+=(open&&continuous?'L':'M')+x(a).toFixed(3)+' '+y(b).toFixed(3)+' ';open=true;}else open=false;
   previous=[a,b];
  }
  if(c.kind==='vertical'&&c.h>=xr[0]&&c.h<=xr[1])path='M'+x(c.h)+' '+pad+' L'+x(c.h)+' '+(height-pad);
  svg.append(node('path',{d:path,fill:'none',stroke:colors[j%colors.length],'stroke-width':2.5,...(c.dashed?{'stroke-dasharray':c.dashPattern||'7 4'}:{}),'data-root-curve':c.kind,'data-curve-k':c.k??'','data-curve-b':c.b??'','data-curve-h':c.h??'','data-curve-scale':c.scale??''}));
  for(const [h,v] of c.holes||[])if(h>=xr[0]&&h<=xr[1]&&v>=yr[0]&&v<=yr[1])svg.append(node('circle',{cx:x(h),cy:y(v),r:5,fill:'white',stroke:colors[j%colors.length],'stroke-width':2,'data-hole-x':h,'data-hole-y':v}));
  if(c.kind==='abs-ratio'&&xr[0]<=0&&xr[1]>=0)for(const b of [-(c.scale??1),c.scale??1])if(b>=yr[0]&&b<=yr[1])svg.append(node('circle',{cx:x(0),cy:y(b),r:4,fill:'white',stroke:colors[j%colors.length],'stroke-width':2,'data-hole-x':0,'data-hole-y':b}));
  if(c.label){
   const at=c.labelAt||[xr[1]-(xr[1]-xr[0])/8,curveValue(c,xr[1]-(xr[1]-xr[0])/8)];
   if(at.every(Number.isFinite)){
    // Face labels toward the plot interior. One em per character is a
    // conservative bound for the supplied formulas, including detached SVGs.
    const length=Math.max(1,Array.from(String(c.label)).length),fontSize=Math.min(20,(width-2*pad-16)/length),labelWidth=length*fontSize,left=pad+8,right=width-pad-8,end=x(at[0])>=width/2;
    const labelX=end?Math.max(left+labelWidth,Math.min(right,x(at[0]))):Math.max(left,Math.min(right-labelWidth,x(at[0])));
    svg.append(node('text',{x:labelX,y:Math.max(pad+fontSize,Math.min(height-pad-5,y(at[1]))),'text-anchor':end?'end':'start','font-size':fontSize,fill:colors[j%colors.length],'data-curve-label':c.label},c.label));
   }
  }
 });
 for(const [a,b,labelText]of [...(points||[]),...(config.points||[])]){
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<xr[0]||a>xr[1]||b<yr[0]||b>yr[1])continue;
  svg.append(node('circle',{cx:x(a),cy:y(b),r:4,fill:'#166753','data-point-x':a,'data-point-y':b}));
  if(labelText)svg.append(node('text',{x:x(a)+6,y:y(b)-7,'font-size':18},labelText));
 }
 return svg;
}
function numberLine(config){
 const [min,max]=config.range||[0,4],major=config.major||1,minor=config.minor||major,width=360,pad=30,axis=76;
 if(![min,max,major,minor].every(Number.isFinite)||min>=max||major<=0||minor<=0||(max-min)/minor>200)throw Error('Invalid number line');
 const x=v=>pad+(v-min)/(max-min)*(width-2*pad),svg=node('svg',{viewBox:'0 0 360 138',role:'img','aria-label':config.label||'Координатная прямая с отмеченными точками'});
 for(let v=Math.ceil(min/minor)*minor;v<=max+minor/100;v+=minor)svg.append(node('line',{x1:x(v),x2:x(v),y1:18,y2:104,stroke:'#e1e7e2','stroke-width':1}));
 for(let y=18;y<=104;y+=17.2)svg.append(node('line',{x1:pad,x2:width-pad,y1:y,y2:y,stroke:'#e1e7e2','stroke-width':1}));
 svg.append(node('line',{x1:pad,x2:width-pad,y1:axis,y2:axis,stroke:'#203b36','stroke-width':1.5}),node('path',{d:'M326 72 L333 76 L326 80 Z',fill:'#203b36'}));
 const labels=config.labels||Array.from({length:Math.floor((max-min)/major)+1},(_,i)=>Math.ceil(min/major)*major+i*major).filter(v=>v<=max);
 for(const v of labels)svg.append(node('line',{x1:x(v),x2:x(v),y1:axis-4,y2:axis+4,stroke:'#203b36','stroke-width':1.5}),node('text',{x:x(v),y:axis+23,'text-anchor':'middle','font-size':18},v));
 for(const point of config.points||[])if(point.x>=min&&point.x<=max)svg.append(node('line',{x1:x(point.x),x2:x(point.x),y1:axis-5,y2:axis+5,stroke:'#087c92','stroke-width':2,'data-number-point':point.label,'data-number-x':point.x}),node('text',{x:x(point.x),y:axis-12,'text-anchor':'middle','font-size':20},point.label));
 return svg;
}
function parseIntegerPairs(value){
 const text=String(value).trim().replace(/−/g,'-');
 if(!text || text.length>1000)return null;
 const pattern=/\(\s*([+-]?\d{1,8})\s*;\s*([+-]?\d{1,8})\s*\)/y;
 const pairs=[];
 let position=0;
 while(position<text.length){
  pattern.lastIndex=position;
  const match=pattern.exec(text);
  if(!match)return null;
  pairs.push([Number(match[1]),Number(match[2])]);
  position=pattern.lastIndex;
  if(position===text.length)break;
  const separator=/^\s*[,;]\s*/.exec(text.slice(position));
  if(!separator)return null;
  position+=separator[0].length;
  if(position===text.length)return null;
 }
 return pairs;
}

function pairEquation(rule, pair){
 const [x,y]=pair.map(BigInt);
 switch(rule){
  case '206-a':return {left:5n*x+y-x*y,right:2n};
  case '206-b':return {left:x*y-x+y,right:8n};
  case '207-all':return {left:(x-3n)*y,right:x*x-6n*x+1n,allowed:x!==3n};
  case '209-all':return {left:7n*(x+y),right:x*y,allowed:x>0n&&y>0n};
 }
 throw Error('Unknown pair equation');
}

function renderIntegerPairs(host,config,value){
 host.className='task-graphs pair-check';
 const title=document.createElement('p');
 title.textContent='Подстановка твоих пар в равенство';
 host.append(title);
 const pairs=parseIntegerPairs(value);
 if(!pairs){
  const guide=document.createElement('p');
  guide.className='small';
  guide.textContent='Введи пару в скобках, например (2;3), и нажми «Проверить». Здесь появятся значения левой и правой частей.';
  host.append(guide);
  return;
 }
 const formulas={'206-a':'5x + y − xy = 2','206-b':'xy − x + y = 8',
                 '207-all':'(x − 3)y = x² − 6x + 1','209-all':'7(a + b) = ab'};
 title.textContent+=' '+formulas[config.rule];
 const list=document.createElement('ul');
 for(const pair of pairs){
  const result=pairEquation(config.rule,pair),row=document.createElement('li');
  const status=result.allowed===false?'проверь область допустимых значений':result.left===result.right?'равенство верно':'значения различаются';
  row.textContent='('+pair.join('; ')+'). '+'Слева '+result.left+', справа '+result.right+' — '+status+'.';
  list.append(row);
 }
 host.append(list);
}

function renderTrainMeeting(host,value){
 host.className='task-graphs train-model';
 const speeds=String(value||'').split(';');
 for(const [index,time] of [7,6].entries()){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');
  const speed=number(speeds[index]||''),first=60*time;
  const second=speed!==null&&speed>=0?speed*(time-3):null;
  caption.textContent='До встречи '+time+' ч. Первый поезд в пути '+time+' ч, второй — '+(time-3)+' ч.';
  const svg=node('svg',{viewBox:'0 0 300 62',role:'img','aria-label':'Путь от А до Б, 600 км'});
  svg.append(node('line',{x1:16,y1:26,x2:284,y2:26,stroke:'#57656e','stroke-width':2}));
  svg.append(node('text',{x:16,y:12,'text-anchor':'middle'},'А'),node('text',{x:284,y:12,'text-anchor':'middle'},'Б'));
  if(second!==null){
   const scale=268/600,bound=16+scale*first,end=284-Math.min(600,second)*scale;
   svg.append(node('line',{x1:16,y1:23,x2:bound,y2:23,stroke:'#206946','stroke-width':6}),
              node('circle',{cx:bound,cy:23,r:4,fill:'#206946'}),
              node('line',{x1:284,y1:30,x2:end,y2:30,stroke:'#9a422d','stroke-width':6}),
              node('path',{d:'M '+end+' 25 l -5 5 l 5 5 z',fill:'#9a422d'}));
   const total=first+second;
   const distance=n=>n.toLocaleString('ru',{maximumFractionDigits:2});
   caption.textContent+=' Из А '+first+' км, из Б '+distance(second)+' км. Вместе '+distance(total)+' км.';
   svg.setAttribute('aria-label',caption.textContent);
  }
  svg.append(node('text',{x:150,y:54,'text-anchor':'middle','font-size':13},'600 км'));
  figure.append(caption,svg);host.append(figure);
 }
}
function renderDomainFraction(host,config){
 host.className='task-graphs exclusion-model';
 const title=document.createElement('p');
 title.textContent='Что происходит в точках из условия?';
 host.append(title);
 const analysis=config.analysis;
 if(!analysis?.zeros){
  const guide=document.createElement('p');
  guide.className='small';
  guide.textContent=analysis?.status==='zero'?'Знаменатель всегда равен нулю. Попробуй изменить его.':'После проверки дроби здесь появится результат подстановки каждой исключённой точки.';
  host.append(guide);return;
 }
 const list=document.createElement('ul');
 config.points.forEach((point,i)=>{
  const item=document.createElement('li');
  item.textContent='x = '+point+': '+(analysis.zeros[i]?'знаменатель равен нулю, точка исключена.':'знаменатель отличен от нуля, точка осталась в области.');
  list.append(item);
 });
 const count=document.createElement('p');
 count.className='small';count.textContent='Всего различных действительных нулей у твоего знаменателя: '+analysis.count+'.';
 host.append(list,count);
}
function renderNaturalValues(host,config){
 host.className='task-graphs natural-model';
 const heading=document.createElement('p');heading.textContent='Подстановка выбранных n';host.append(heading);
 if(!config.rows?.length){
  const guide=document.createElement('p');guide.className='small';guide.textContent='После проверки появится значение выражения для каждого числа из твоего ответа.';host.append(guide);return;
 }
 const list=document.createElement('ul');
 for(const {term,pair} of config.rows){
  const row=document.createElement('li');
  if(!pair)row.textContent='n = '+term+': это не положительное целое число.';
  else{
   const [top,bottom]=pair;
   const value=top%bottom===0n?String(top/bottom):top+'/'+bottom;
   const property=top<=0n?'не положительное число':top%bottom===0n?'натуральное число':'нецелое число';
   row.textContent='n = '+term+': '+top+' : '+bottom+' = '+value+' ('+property+').';
  }
  list.append(row);
 }
 host.append(list);
}
function workEstimate(host,config,value){
 host.className='task-graphs quantity-model';
 const proposed=number(value),line=text=>{const p=document.createElement('p');p.className='small';p.textContent=text;host.append(p);};
 if(proposed===null||proposed<=0){line('После проверки положительного ответа здесь можно сравнить модель с условием.');return;}
 const decimal=x=>x.toLocaleString('ru',{maximumFractionDigits:4});
 if(config.type==='work-hours'){
  const total=[8,9,12].reduce((n,h)=>n+proposed/h,0);
  for(const h of [8,9,12])line('Мастерица, которая тратит '+h+' ч на заказ, за '+decimal(proposed)+' ч выполнит такую долю заказа: '+decimal(proposed/h)+'.');
  line('Выполнено заказов: '+decimal(total)+'. По условию требуется 3.');
 }else{
  line('Сравниваем две равные половины по 240 км: при 60 км/ч первая занимает 4 ч, при 80 км/ч вторая — 3 ч.');
  line('Твоя скорость за 7 ч дала бы '+decimal(7*proposed)+' км. Общий путь в модели — 480 км.');
 }
}
function quadraticExample(host,value){
 host.className='task-graphs root-graph';
 const parameters=String(value).split(';').map(v=>number(v));
 const valid=parameters.length===3&&parameters.every(v=>v!==null);
 const [a,b,c]=parameters;
 const curve=valid?{kind:'quadratic',a,b,c}:null;
 const height=valid?Math.max(2,Math.abs(c),Math.abs(4*a+2*b+c),Math.abs(4*a-2*b+c)):4;
 host.append(rootGraph({curves:curve?[curve]:[],xRange:[-2,2],yRange:[-height,height]},''));
 const p=document.createElement('p');p.className='small';
 p.textContent=valid?'Для твоих коэффициентов при x = 0 значение равно '+c+', а при x = 1 — '+(a+b+c)+'.':'После проверки на осях появится график для твоих коэффициентов.';
 host.append(p);
}
function quadraticStory(host,config,value){
 const scene=config.scene;
 host.className='task-graphs quantity-model';
 const caption=document.createElement('p');caption.className='small';
 if(scene.startsWith('529')){
  const slope={'529а':1-Math.sqrt(2),'529б':4-Math.sqrt(15),'529в':Math.sqrt(35)-5.7}[scene];
  const plane={curves:value?[{kind:'line',k:slope,b:0}]:[],xRange:[-4,4],yRange:[-2,2],xTickStep:2,yTickStep:1};
  host.append(rootGraph(plane,''));caption.textContent=value?'Проверь положение лучей по обе стороны от начала координат.':'После выбора четвертей появится прямая с коэффициентом из условия.';host.append(caption);return;
 }
 const svg=node('svg',{viewBox:'0 0 300 190',role:'img','aria-label':{
  court:'Корт со сторонами w и 2w',fence:'Участок со сторонами a и 0,75a',screen:'Стороны 4u и 3u, диагональ 25 дюймов',
  'cut-square':'Квадрат, разделённый на треугольник и оставшуюся фигуру',walk:'Прямой угол между северным и западным маршрутами',fall:'Вертикальная шахта глубиной 80 метров'
 }[scene]});
 const line=(x1,y1,x2,y2,extra={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:'#165d65','stroke-width':2,...extra}));
 const label=(x,y,text)=>svg.append(node('text',{x,y,'text-anchor':'middle','font-size':17,fill:'#143c3b'},text));
 const rectangle=(x,y,width,height)=>svg.append(node('rect',{x,y,width,height,fill:'#e7f4ee',stroke:'#165d65','stroke-width':2}));
 const decimal=n=>n.toLocaleString('ru',{maximumFractionDigits:3});
 const proposed=config.proposedTime??number(value);
 if(scene==='walk'){
  const x=198,y=143;line(x,y,x,43);line(x,y,73,y);line(73,y,x,43,{'stroke-dasharray':'5 3'});line(183,y,183,128);line(183,128,x,128);
  label(234,97,'4t км');label(130,170,'5t км');label(102,79,proposed>0?decimal(proposed*Math.sqrt(41))+' км':'16 км');label(199,31,'север');label(42,150,'запад');
  caption.textContent=proposed>0?'При t = '+decimal(proposed)+' ч группы пройдут '+decimal(4*proposed)+' и '+decimal(5*proposed)+' км. Расстояние между ними ≈ '+decimal(proposed*Math.sqrt(41))+' км. По условию требуется 16 км.':'Пункт выхода — вершина прямого угла. Два пройденных пути образуют катеты.';
 }else if(scene==='fall'){
  line(80,35,220,35);line(80,150,220,150);line(146,42,146,142,{'stroke-dasharray':'5 3'});line(140,132,146,142);line(152,132,146,142);
  label(90,24,'начало');label(202,105,'80 м');label(206,177,'дно');
  caption.textContent=proposed>=0&&proposed!==null?'За '+decimal(proposed)+' с модель даёт путь '+decimal(5*proposed*proposed)+' м.':'Глубина — путь камня от старта до дна.';
 }else if(scene==='cut-square'){
  rectangle(88,20,140,140);svg.append(node('polygon',{points:'88,20 228,20 228,134.72',fill:'#c1dcef',stroke:'#165d65','stroke-width':1.5}));
  label(184,55,'59 см²');label(141,123,'85 см²');label(157,183,'сторона a');
  caption.textContent=proposed>0?'Квадрат со стороной '+decimal(proposed)+' см имеет площадь '+decimal(proposed*proposed)+' см².':'Сложи площади двух частей, чтобы восстановить площадь целого квадрата.';
 }else{
  const width=scene==='court'?200:160,height=scene==='court'?100:120,x=48,y=23;
  rectangle(x,y,width,height);
  label(x+width/2,y+height+26,scene==='court'?'2w':scene==='fence'?'a':'4u');
  label(x+width+24,y+height/2+5,scene==='court'?'w':scene==='fence'?'0,75a':'3u');
  if(scene==='screen'){
   line(x,y+height,x+width,y,{'stroke-dasharray':'5 3'});label(x+width/2-13,y+height/2-10,'25″');
   caption.textContent='Диагональ делит экран на два равных прямоугольных треугольника.';
  }else if(scene==='court'){
   const pair=parseLine(value);if(pair)caption.textContent='Твои стороны дают площадь '+decimal(pair.k*pair.b)+' м². Длина по условию должна вдвое превышать ширину.';
   else caption.textContent='Прямоугольник можно разделить на два квадрата со стороной w.';
   line(x+100,y,x+100,y+height,{'stroke-dasharray':'5 3'});
  }else caption.textContent=proposed>0?'Для периметра '+decimal(proposed)+' м и отношения 4 : 3 площадь участка была бы '+decimal(12*(proposed/14)**2)+' м².':'Отношение длины к ширине равно 4 : 3. Забор проходит по всем четырём сторонам.';
 }
 host.append(svg,caption);
}

function quadraticEvidence(host,config,value){
 host.className='task-graphs root-graph';
 const caption=document.createElement('p');caption.className='small';
 if(config.type==='check-common-point'){
  const answer=parseLine(value);
  if(answer){
   for(const [k,b] of config.lines){
    const row=document.createElement('p');row.className='small';
    const ordinate=k*answer.k+b;
    row.textContent='При x = '+answer.k+' получаем y = '+ordinate+'. '+(Math.abs(ordinate-answer.b)<1e-9?'Ордината совпала.':'Твоя ордината '+answer.b+' отличается.');
    host.append(row);
   }
  }else{caption.textContent='После проверки здесь появятся две подстановки твоей точки.';host.append(caption);}
  return;
 }
 if(config.type==='quadratic-reciprocals'){
  const roots=String(value).trim().split(';').map(v=>number(v));
  if(!roots.length||roots.some(v=>v===null)){
   caption.textContent='После проверки рациональных корней сравни подстановку r в первое уравнение и 1/r во второе.';host.append(caption);return;
  }
  for(const r of roots){
   const row=document.createElement('p');row.className='small';
   const {a,b,c}=config,dec=v=>v.toLocaleString('ru',{maximumFractionDigits:5});
   row.textContent=r===0?'При r = 0 обратное число не определено. Свободный член данного уравнения не равен нулю.':
    'r = '+dec(r)+', 1/r = '+dec(1/r)+'. Левая часть первого уравнения: '+dec(a*r*r+b*r+c)+'. После перестановки a и c при 1/r: '+dec(c/(r*r)+b/r+a)+'.';
   host.append(row);
  }
  return;
 }
 let {a,b,c}=config;
 if(config.type==='quadratic-parameter'){
  const entry=M.parse(value),proposed=entry?entry.n/entry.d:null;
  if(proposed===null){
   caption.textContent='После ввода своего a и проверки появится его парабола.';host.append(caption);return;
  }
  a=1;b=-proposed;c=proposed-4;
 }
 if(!value){caption.textContent='После проверки можно сопоставить число корней с пересечениями оси x.';host.append(caption);return;}
 const discriminant=b*b-4*a*c,h=-b/(2*a),vertex=-discriminant/(4*a);
 const spread=discriminant>=0?Math.sqrt(discriminant)/(2*Math.abs(a)):0;
 const radius=Math.max(1.5,spread*1.45);
 const left=h-radius,right=h+radius;
 const ymax=Math.max(1,vertex,a*radius*radius+vertex),ymin=Math.min(-1,vertex,a*radius*radius+vertex),margin=(ymax-ymin)*.13;
 const plane={curves:[{kind:'quadratic',a,b,c}],compactTicks:Math.max(Math.abs(ymin),Math.abs(ymax))>=10000,xRange:[left,right],yRange:[ymin-margin,ymax+margin],
              label:'Парабола и горизонтальная ось y = 0 для указанного уравнения'};
 const points=discriminant>0?[[h-spread,0],[h+spread,0]]:discriminant===0?[[h,0]]:[];
 plane.points=points;
 host.append(rootGraph(plane,''));
 caption.textContent=(config.type==='quadratic-parameter'?'Для a = '+(-b).toLocaleString('ru')+' ':'')+
    'D = '+discriminant.toLocaleString('ru',{maximumFractionDigits:4})+'. Различных пересечений оси x: '+points.length+'.';
 host.append(caption);
}

function planeConstruction(host,config,value){
 host.className='task-graphs root-graph';const note=document.createElement('p');note.className='small';
 const num=z=>{const r=M.parse(String(z));return r.n/r.d;};
 const toCurve=([a,b,c])=>b?{kind:'line',k:-a/b,b:c/b}:{kind:'vertical',h:c/a};
 const groups=(config.groups||[]).map(g=>g.map(p=>p.map(r=>r.n/r.d))),points=[...groups.flat(),...(config.fixedPoints||[])],curves=[];
 if(config.type==='line-figure'){
  config.lines.forEach((l,i)=>{
   const c=toCurve(l.map(num));if(config.distinguish&&i===1)c.dashed=true;if(config.labels){c.label=config.labels[i];c.labelAt=config.labelPoints[i];}curves.push(c);
  });
 }else if(config.type==='own-lines'){
  for(const row of groups){
   if(row.length!==2)continue;
   const [[x,y],[u,v]]=row;
   if(x===u&&y===v)continue;
   curves.push(x===u?{kind:'vertical',h:x}:{kind:'line',k:(v-y)/(u-x),b:(y*u-v*x)/(u-x)});
  }
 }
 const max=config.bounds||Math.min(1000000,Math.max(5,...points.flat().map(v=>Math.ceil(Math.abs(v)*1.15))));
 host.append(rootGraph({curves,points,xRange:[-max,max],yRange:[-max,max],compactTicks:max>=10000,label:config.type==='line-figure'?'Координатный рисунок к заданию':'Координатная плоскость с твоими точками и прямыми'},''));
 note.textContent=config.distinguish?'Первая прямая сплошная, вторая штриховая. При совпадении сплошная линия видна между штрихами.':config.type==='line-figure'?'На обеих осях отмечен ноль. Отсчитывай координаты по подписанным делениям.':config.type==='own-points'?'Введённые пары отмечаются точками. Проверь каждую подстановкой в исходное уравнение.':'Через две разные точки каждой группы проводится прямая. Верная прямая содержит только решения исходного уравнения.';
 host.append(note);
}

function absLineChoice(host,config){
 host.className='task-graphs root-graph';
 const curves=[{kind:'abs-linear',k:1,b:0}],p=config.analysis,points=[[-3,0]];
 if(p)curves.push({kind:'line',k:p.k,b:p.b,dashed:true});
 if(config.checked&&p)points.push(...p.points);
 const size=Math.max(5,...points.flat().map(Math.abs))*1.15;
 host.append(rootGraph({curves,points,xRange:[-size,size],yRange:[-size/2,size],compactTicks:size>10000,
    label:'График модуля, заданная точка на оси x и твоя прямая'},''));
 const note=document.createElement('p');note.className='small';
 note.textContent='Сплошной линией показан модуль, отмечена заданная точка (−3; 0). Введённые k и b задают штриховую прямую.';
 if(config.checked&&p)note.textContent+=' Общих точек с модулем: '+(Number.isFinite(p.count)?p.count:'бесконечно много')+'.';
 if(p){note.dataset.absSlope=String(p.k);note.dataset.absCrossings=String(p.count);}
 host.append(note);
}
function systemPairModel(host,config){
 host.className='task-graphs quantity-model';
 const message=document.createElement('p');message.className='small';
 if(!config.checked||!config.evidence){
  message.textContent='После проверки для каждой предложенной пары появится результат подстановки в первое и второе равенства.';host.append(message);return;
 }
 if(!config.evidence.length){
  message.textContent='Ты указал, что решений нет. Проверь все допустимые значения из уравнения с одной переменной.';host.append(message);return;
 }
 for(const row of config.evidence){
  const p=document.createElement('p');p.className='small';p.dataset.systemEvidence=row.excluded?'excluded':row.valid.map(x=>x?'yes':'no').join('-');
  p.textContent='('+row.a+'; '+row.b+') — '+(row.excluded?'нулевая координата попадает в исходный знаменатель.':
      'первое равенство '+(row.valid[0]?'верно':'не выполняется')+', второе '+(row.valid[1]?'верно':'не выполняется')+'.');
  host.append(p);
 }
}
function inequalityIntervals(host,config){
 host.className='task-graphs number-line';
 const finite=config.cuts.map(s=>M.parse(s)).map(z=>z.n/z.d),delta=Math.max(1,(finite[1]-finite[0])/4),
       min=finite[0]-delta,max=finite[1]+delta,x=v=>30+(v-min)/(max-min)*300;
 const svg=numberLine({range:[min,max],major:Math.max(1,Math.ceil((max-min)/4)),points:[],label:'Предложенные промежутки и граничные точки неравенства'});
 for(const item of config.intervals||[]){
  const lo=Math.max(min,item.min),hi=Math.min(max,item.max);
  if(lo>=hi)continue;
  svg.append(node('line',{x1:x(lo),x2:x(hi),y1:76,y2:76,stroke:'#16735d','stroke-width':6,'data-interval-range':lo+';'+hi}));
  if(item.min===-Infinity)svg.append(node('path',{d:'M38 69 L30 76 L38 83',fill:'none',stroke:'#16735d','stroke-width':2}));
  if(item.max===Infinity)svg.append(node('path',{d:'M322 69 L330 76 L322 83',fill:'none',stroke:'#16735d','stroke-width':2}));
  for(const [v,open] of [[item.min,item.leftOpen],[item.max,item.rightOpen]])if(Number.isFinite(v)&&v>=min&&v<=max)svg.append(node('circle',{cx:x(v),cy:76,r:5,fill:open?'white':'#16735d',stroke:'#16735d','stroke-width':2}));
 }
 finite.forEach((v,i)=>svg.append(node('text',{x:x(v),y:39,'text-anchor':'middle','font-size':19,'data-critical-point':config.cuts[i]},config.cuts[i])));
 const note=document.createElement('p');note.className='small';note.textContent='Подписаны границы из условия. Зелёным отмечаются введённые тобой промежутки; стрелка показывает продолжение до бесконечности.';
 host.append(svg,note);
}

function balanceScene(host,config,value){
 host.className='task-graphs quantity-model';
 const intro=document.createElement('p');intro.className='small';
 intro.textContent='x — '+config.labels[0]+', y — '+config.labels[1]+'. Подставь свою пару и проверь оба условия.';host.append(intro);
 const fields=String(value||'').split(';'),raw=fields.map(v=>M.parse(v)),chosen=M.parse(String(value||''));
 let pair=null;
 if(config.mode==='pair'&&fields.length===2&&raw.every(Boolean))pair=raw;
 if(config.mode==='step')pair=config.trial?.split(';').map(v=>M.parse(v));
 if(config.mode==='digits'&&chosen?.d===1&&chosen.n>=10&&chosen.n<=99)pair=[M.parse(String(Math.floor(chosen.n/10))),M.parse(String(chosen.n%10))];
 if(['x','y'].includes(config.mode)&&chosen&&config.derive){
  const [slope,offset]=config.derive,n=BigInt(slope)*BigInt(chosen.n)+BigInt(offset)*BigInt(chosen.d);
  const derived=M.parse(n+'/'+chosen.d);if(derived)pair=config.mode==='x'?[chosen,derived]:[derived,chosen];
 }
 if(!pair&&config.trial)pair=config.trial.split(';').map(v=>M.parse(v));
 if(!pair||pair.length!==2||pair.some(v=>!v))pair=null;
 if(pair){
  const values=pair.map(r=>r.n/r.d),valid=config.restriction==='digits'?values.every(Number.isInteger)&&values[0]>=1&&values[0]<=9&&values[1]>=0&&values[1]<=9:
    values.every(v=>v>0&&(config.restriction!=='natural'||Number.isInteger(v)));
  const text=document.createElement('p');text.className='small';text.dataset.balanceDomain=valid?'yes':'no';
  text.textContent='x = '+M.answer(pair[0])+', y = '+M.answer(pair[1])+(config.unit?' ('+config.unit+')':'')+'. '+(valid?'Величины допустимы по смыслу.':config.restriction==='natural'?'Для количества требуются положительные целые числа.':'Проверь допустимые значения величин.');
  host.append(text);
 }
 for(const check of config.checks){
  const p=document.createElement('p');p.className='small';p.dataset.balanceRow='';
  p.textContent=check.label+': ('+check.coeff[0]+')x + ('+check.coeff[1]+')y = '+check.rhs+'.';
  if(pair){
   const [a,b]=check.coeff.map(k=>M.parse(k)),[x,y]=pair,target=M.parse(check.rhs);
   const n=BigInt(a.n)*BigInt(x.n)*BigInt(b.d)*BigInt(y.d)+BigInt(b.n)*BigInt(y.n)*BigInt(a.d)*BigInt(x.d),d=BigInt(a.d)*BigInt(x.d)*BigInt(b.d)*BigInt(y.d);
   const gcd=(u,v)=>v?gcd(v,u%v):u,g=gcd(n<0n?-n:n,d),num=n/g,den=d/g;
   p.dataset.balanceCheck=num*BigInt(target.d)===den*BigInt(target.n)?'yes':'no';
   p.append(' Получено '+(den===1n?num.toString():num+'/'+den)+'.');
  }
  host.append(p);
 }
}

function residualScene(host,config){
 host.className='task-graphs root-graph';
 const [a,b,c]=config.coefficients,checks=config.checks||[];
 const vertex=-b/(2*a),height=c-b*b/(4*a);
 const width=Math.max(2,Math.abs(vertex)*1.2+1,Math.sqrt(Math.abs(height/a))+Math.abs(vertex)+1);
 const limit=Math.max(2,Math.abs(height)*1.25,Math.abs(c)*1.25);
 const plot=rootGraph({curves:[{kind:'quadratic',a,b,c}],points:checks.filter(q=>Number.isFinite(q.x)).map(q=>[q.x,q.exact?0:a*q.x*q.x+b*q.x+c]),
 xRange:[-width,width],yRange:[-limit,limit],axisLabels:[config.unknown||'x','F'],label:'График разности левой и правой частей исходного уравнения'},'');
 host.append(plot);
 for(const item of checks){
  const row=document.createElement('p');row.className='small';row.dataset.rootResidual=item.exact?'zero':'nonzero';
  row.textContent='Подстановка '+item.value+': '+(item.exact?'остаток равен нулю.':config.mode==='rounded'?'остаток не нулевой. При округлении само значение обычно отличается от точного корня.':'остаток не равен нулю. Проверь знаки и знаменатель.');
  host.append(row);
 }
 if(!checks.length){const row=document.createElement('p');row.className='small';row.textContent='Введи предложенные корни. Для каждого модель отдельно проверит подстановку.';host.append(row);}
}
function squareCertificateScene(host,config,value){
 host.className='task-graphs construction';
 const entries=String(value||'').split(';').map(v=>M.parse(v)),complete=entries.length===config.targets.length*3&&entries.every(Boolean);
 config.targets.forEach(([a,b,c],i)=>{
  const h=-b/(2*a),r=c-b*b/(4*a),width=Math.max(3,Math.abs(h)+2),limit=Math.max(4,Math.abs(c)*1.3,Math.abs(r)*1.3);
  const curves=[{kind:'quadratic',a,b,c}],caption=document.createElement('p');caption.className='small';
  caption.textContent='Исследуем '+config.labels[i]+'. ';
  if(complete){
   const [kr,hr,rr]=entries.slice(3*i,3*i+3),[k,shift,rest]=[kr,hr,rr].map(v=>v.n/v.d);
   const eq=(x,y)=>x===y,toB=v=>BigInt(v),kn=toB(kr.n),kd=toB(kr.d),hn=toB(hr.n),hd=toB(hr.d),rn=toB(rr.n),rd=toB(rr.d);
   const match=eq(kn,toB(a)*kd)&&eq(-2n*kn*hn,toB(b)*kd*hd)&&eq(kn*hn*hn*rd+rn*kd*hd*hd,toB(c)*kd*hd*hd*rd);
   caption.dataset.squareCertificate=match?'yes':'no';
   caption.textContent+=(match?'Коэффициенты после раскрытия совпали. ':'Коэффициенты после раскрытия отличаются. ')+(k>0&&rest>0?'K и R положительны.':'Проверь, доказывают ли знаки K и R строгую положительность.');
   if([k,shift,rest].every(v=>Number.isFinite(v)&&Math.abs(v)<=1000000))curves.push({kind:'quadratic',a:k,b:-2*k*shift,c:k*shift*shift+rest,dashed:true});
  }else caption.textContent+='Сплошная кривая — исходный трёхчлен. После ввода коэффициентов пунктир покажет твою запись.';
  host.append(rootGraph({curves,xRange:[-width,width],yRange:[-limit/6,limit],axisLabels:[config.symbol,'F'],label:'Сравнение квадратичных выражений: '+config.labels[i]},''),caption);
 });
}

function sequenceRows(raw,config){
 const text=String(raw??'').trim();
 if(!text||text.length>220)return null;
 const pattern=/\(([^()]*)\)/g,matches=[...text.matchAll(pattern)];
 const groups=matches.length?matches.map(x=>x[1]):[text];
 if(matches.length&&!/^\([^()]*\)(?:\s*,\s*\([^()]*\))*$/.test(text)||groups.length>4)return null;
 const rows=groups.map(group=>group.split(';').map(v=>M.parse(v.trim())));
 if(rows.some(row=>row.length!==config.size||row.some(v=>!v||v.d!==1||Math.abs(v.n)>10000)))return null;
 return rows.map(row=>row.map(r=>r.n));
}
function sequenceEvidence(raw,config){
 return sequenceRows(raw,config)?.map(row=>{
  const ordered=row.every((v,i)=>!i||v===row[i-1]+config.stride);
  const domain=row.every(v=>(!config.natural||v>0)&&(!config.odd||Math.abs(v%2)===1)&&(!config.even||v%2===0));
  const result=config.mode==='sum-square'?row.reduce((s,v)=>s+v,0)**2-row.reduce((s,v)=>s+v*v,0):row.reduce((s,v,i)=>s+config.weights[i]*v**config.power,0);
  return {row,ordered,domain,result,correct:ordered&&domain&&result===config.target};
 })||[];
}
function sequenceScene(host,config,value){
 host.className='task-graphs quantity-model';
 const evidence=sequenceEvidence(value,config),note=document.createElement('p');note.className='small';
 note.textContent='Соседние числа отличаются на '+config.stride+'. '+(config.natural?'Все члены положительны.':'Нулевые и отрицательные целые допустимы.');host.append(note);
 for(const item of evidence){
  const p=document.createElement('p');p.className='small';p.dataset.sequenceTest=item.correct?'yes':'no';
  p.textContent=item.row.join(' → ')+'. '+(!item.ordered?'Нарушен шаг между числами. ':!item.domain?'Значения нарушают условие на числа. ':'Порядок и вид чисел подходят. ')+'Разность из условия равна '+item.result+'; требуется '+config.target+'.';host.append(p);
 }
}
function measureScene(host,config,value){
 host.className='task-graphs quantity-model';
 const fmt=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:4}).format(v||0),text=(s,valid)=>{
  const p=document.createElement('p');p.className='small';p.textContent=s;if(typeof valid==='boolean')p.dataset.measureCheck=valid?'yes':'no';host.append(p);
 };
 const input=String(value??'').trim(),parts=input.split(';').map(v=>M.parse(v)),finite=parts.every(r=>r&&Math.abs(r.n/r.d)<=10000);
 if(config.scene==='price-loss'||config.scene==='box-volume'){
  const price=config.scene==='price-loss';
  text(price?'Покупка минус убыток равна цене продажи.':'Высота 0,5 м; ширина x; длина 2x. Площадь дна 2x², боковых стенок 3x, объём x².');
  if(!input||!finite||parts.length>2)return;
  for(const r of parts){
   const v=r.n/r.d,n=BigInt(r.n),d=BigInt(r.d);
   if(v<=0||(price&&v>=100)){text(price?'Цена должна быть положительной, а убыток — меньше 100%.':'Объём ящика должен быть положителен.',false);continue;}
   if(price)text('Покупка '+fmt(v)+'; убыток '+fmt(v*v/100)+'; продажа '+fmt(v-v*v/100)+' пистолей.',100n*n*d-n*n===2400n*d*d);
   else{
    const w=Math.sqrt(v);
    text('При объёме '+fmt(v)+' м³ ширина ≈ '+fmt(w)+' м, площадь стенок ≈ '+fmt(3*w)+' м² и дна '+fmt(2*v)+' м². Разность ≈ '+fmt(3*w-2*v)+' м².',
      9n*n*d*625n===(50n*n+27n*d)**2n);
   }
  }
  return;
 }
 const svg=node('svg',{viewBox:'0 0 300 170',role:'img'});
 const rect=(x,y,w,h,fill,attrs={})=>svg.append(node('rect',{x,y,width:w,height:h,fill,stroke:'#205764','stroke-width':1.5,...attrs}));
 const lab=(x,y,s)=>svg.append(node('text',{x,y,'text-anchor':'middle','font-size':15,fill:'#17434c'},s));
 function planar(width,height,margin,kind,symbolic){
  const scale=Math.min(205/width,97/height),W=width*scale,H=height*scale,x=150-W/2,y=30+(97-H)/2;
  rect(x,y,W,H,'#e4efe9',{'data-measure-part':'outer'});
  if(margin>0&&2*margin<Math.min(width,height)){
   const q=margin*scale;
   if(kind==='sheet'){
    for(const xx of [x,x+W-q])for(const yy of [y,y+H-q])rect(xx,yy,q,q,'#fae6ba',{'data-measure-part':'cut'});
    rect(x+q,y+q,W-2*q,H-2*q,'#c4e6e2',{'stroke-dasharray':'4 3','data-measure-part':'base'});
   }else rect(x+q,y+q,W-2*q,H-2*q,'#c4e6e2',{'data-measure-part':'inside'});
  }
  lab(150,18,kind==='sheet'?'Лист с угловыми вырезами':'Наружный прямоугольник');lab(150,151,symbolic||fmt(width)+' × '+fmt(height));
  svg.setAttribute('aria-label',symbolic||'Наружные размеры '+fmt(width)+' и '+fmt(height)+(margin?'; ширина края '+fmt(margin):''));
 }
 function adjacent(short,long,symbolic){
  const k=128/(short+long),W=long*k,H=short*k,x=(300-W-H)/2,y=15;
  rect(x,y,W,H,'#edf1e9',{'data-measure-part':'rectangle'});
  rect(x,y+H,W,W,'#c2e4e1',{'data-measure-part':'long-square'});
  rect(x+W,y,H,H,'#fae6ba',{'data-measure-part':'short-square'});
  lab(150,162,symbolic?'Квадраты на соседних сторонах':fmt(short)+'² + '+fmt(long)+'²');
  svg.setAttribute('aria-label','Прямоугольник и два квадрата на его соседних сторонах');
 }
 const outer=config.scene==='outward-frame',inner=config.scene==='inward-frame',sheet=config.scene==='folded-sheet';
 if(!input||!finite||parts.length!==(outer||inner?1:2)){
  if(outer)planar(22,16,2,'frame','18 + 2x и 12 + 2x');
  else if(inner)planar(4.5,2.5,.4,'frame','Внутри: 4,5 − 2x и 2,5 − 2x');
  else if(sheet)planar(45,30,8,'sheet','Дно: 1,5x − 16 и x − 16');
  else adjacent(3,6,true);
  host.append(svg);
  text(outer?'Внутри фото 12 × 18 см. Снаружи к каждой стороне прибавляются две ширины рамки.':inner?'Снаружи 4,5 × 2,5 м. Внутренняя сторона уменьшается на две ширины бордюра.':sheet?'По каждому краю листа отгибается полоса 8 см. Введи длину и ширину листа, чтобы увидеть четыре угловых выреза.':'Две соседние стороны задают периметр и стороны двух квадратов.');return;
 }
 const values=parts.map(r=>r.n/r.d),[v,w]=values,n=BigInt(parts[0].n),d=BigInt(parts[0].d);
 if(outer||inner){
  if(v<=0||inner&&v>=1.25){text('Такая ширина не оставляет положительными все размеры исходной фигуры.',false);return;}
  const W=outer?18+2*v:4.5,H=outer?12+2*v:2.5;
  planar(W,H,v,'frame');host.append(svg);
  if(outer)text('Наружная площадь '+fmt(W*H)+' см²; по условию 280 см².',(18n*d+2n*n)*(12n*d+2n*n)===280n*d*d);
  else text('Внутренняя площадь '+fmt((W-2*v)*(H-2*v))+' м²; площадь бордюра '+fmt(W*H-(W-2*v)*(H-2*v))+' м².',(9n*d-4n*n)*(5n*d-4n*n)===32n*d*d);
 }else{
  const m=BigInt(parts[1].n),e=BigInt(parts[1].d);
  if(v<=0||w<=0||sheet&&(v<=16||w<=16)){text('Размеры должны быть положительными'+(sheet?' и оставлять дно после вырезания 16 см по каждой стороне.':'.'),false);return;}
  if(sheet)planar(v,w,8,'sheet');else adjacent(v,w,false);host.append(svg);
  if(sheet)text('Размеры дна '+fmt(v-16)+' × '+fmt(w-16)+' см; объём '+fmt((v-16)*(w-16)*8)+' см³. Отношение длины к ширине '+fmt(v/w)+'.',2n*n*e===3n*m*d&&8n*(n-16n*d)*(m-16n*e)===6080n*d*e);
  else text('Стороны '+fmt(v)+' и '+fmt(w)+' см. Периметр '+fmt(2*(v+w))+' см, сумма площадей квадратов '+fmt(v*v+w*w)+' см².',v<=w&&2n*(n*e+m*d)===28n*d*e&&n*n*e*e+m*m*d*d===116n*d*d*e*e);
 }
}

function fractionSample(value,count){
 const parts=String(value??'').split(';').map(v=>M.parse(v.trim()));
 return parts.length===count&&parts.every(v=>v&&Math.abs(v.n/v.d)<=100)?parts:null;
}
function sourceFractionTrial(config,value,unrestricted=false){
 const fields=unrestricted?String(value??'').split(';').map(v=>M.parse(v)):fractionSample(value,config.symbols.length);
 if(unrestricted&&(fields.length!==config.symbols.length||fields.some(v=>!v)))return null;
 if(!fields)return null;
 const values=new Map(config.symbols.map((symbol,i)=>[symbol,fields[i]]));
 function evaluate(tree){
  if(!Array.isArray(tree)){const r=values.get(tree)||M.parse(tree);return r?[BigInt(r.n),BigInt(r.d)]:null;}
  const [op,left,right]=tree,a=evaluate(left);if(!a)return null;
  if(op==='neg')return [-a[0],a[1]];
  const b=evaluate(right);if(!b)return null;
  if(op==='+')return [a[0]*b[1]+b[0]*a[1],a[1]*b[1]];
  if(op==='-')return [a[0]*b[1]-b[0]*a[1],a[1]*b[1]];
  if(op==='*')return [a[0]*b[0],a[1]*b[1]];
  if(op==='/')return b[0]?[a[0]*b[1],a[1]*b[0]]:null;
  if(op==='^'&&b[1]===1n&&b[0]>=0n&&b[0]<=4n)return [a[0]**b[0],a[1]**b[0]];
  return null;
 }
 function format(v){
  if(!v)return null;
  let [n,d]=v;if(d<0n){d=-d;n=-n;}
  let u=n<0n?-n:n,w=d;while(w){const rem=u%w;u=w;w=rem;}
  return d/u===1n?String(n/u):(n/u)+'/'+(d/u);
 }
 return {original:format(evaluate(config.original)),reduced:format(evaluate(config.reduced))};
}
function sourceFractionScene(host,config){
 host.className='task-graphs quantity-model';const input=config.fixedInput||config.trial||config.symbols.map(()=>0).join(';'),check=sourceFractionTrial(config,input);
 const add=(message,k,status)=>{const row=document.createElement('p');row.className='small';row.textContent=message;if(k){row.dataset.fractionSide=k;row.dataset.fractionStatus=status;}host.append(row);};
 if(!check){add('Введи '+(config.symbols.length===2?'пару рациональных чисел через точку с запятой':'рациональное число')+' от −100 до 100.');return;}
 add((config.trial?'Твоя подстановка: ':'Пример подстановки: ')+config.symbols.map((s,i)=>s+' = '+input.split(';')[i]).join(', ')+'.');
 if(config.fixedInput&&!config.showValue){
  add('Вычисли знаменатель и числитель при указанном x. Итоговая дробь появится после проверки результата.');
  if(config.partial?.[0])add('Твой знаменатель: '+config.partial[0]+'.');
  if(config.partial?.[1])add('Твой числитель: '+config.partial[1]+'.');
  return;
 }
 const row=(title,k)=>add(title+(check[k]===null?'не определена.':'равна '+check[k]+'.'),k,check[k]===null?'undefined':'defined');
 row('Исходная запись ', 'original');row('Упрощённая формула ', 'reduced');
 if(check.original===null&&check.reduced!==null)add('После сокращения получено число, но исходное выражение здесь не определено. Запрет сохраняется.');
}

function rationalScene(host,config){
 host.className='task-graphs root-graph';
 const add=(message,tag,valid)=>{const row=document.createElement('p');row.className='small';row.textContent=message;if(tag)row.dataset[tag]=valid;host.append(row);};
 const marks=[];
 if(config.type==='rational-root-audit'){
  for(const row of config.checks||[]){
   const outcome=row.forbidden?'excluded':row.exact?'root':'nonzero';
   add(row.value+': '+(row.forbidden?'исходный знаменатель нулевой; точка исключена.':row.exact?'числитель равен нулю, все исходные знаменатели допустимы.':'числитель не равен нулю.'),'rationalRoot',outcome);
   if(config.curves&&!row.forbidden&&Number.isFinite(row.x))marks.push([row.x,curveValue(config.curves[0],row.x)]);
  }
  if(!config.checks?.length)add('Подстановка каждого предложенного корня проверяет исходные запреты и числитель отдельно.');
 }else if(config.type==='graph-root-reading'){
  for(const entry of config.readings||[]){
   const ordinates=config.curves.map(curve=>curveValue(curve,entry.x));
   if(ordinates.every(Number.isFinite)){for(const y of ordinates)marks.push([entry.x,y]);add('При x ≈ '+entry.x.toLocaleString('ru',{maximumFractionDigits:3})+' значения графиков ≈ '+ordinates.map(z=>z.toLocaleString('ru',{maximumFractionDigits:3})).join(' и ')+'.');}
   else add('При x = 0 дробь не определена.');
  }
  if(!config.readings?.length)add('Найди общие точки двух графиков и считай их абсциссы. Обрати внимание на ветви по разные стороны нуля.');
 }else{
  for(const p of config.pairs||[]){
   const y=config.curves.map(curve=>curveValue(curve,p[0])),matches=y.map(v=>Number.isFinite(v)&&Math.abs(v-p[1])<1e-8);
   marks.push(p);add('Точка ('+p.map(v=>v.toLocaleString('ru',{maximumFractionDigits:3})).join('; ')+'): '+(matches.every(Boolean)?'лежит на обоих графиках.':y.some(v=>!Number.isFinite(v))?'не входит в область одного из графиков.':'проверь абсциссу и ординату по обеим формулам.'),'intersectionTrial',matches.every(Boolean)?'yes':'no');
  }
 }
 if(config.curves){
  const curves=config.curves.map((curve,i)=>i?{...curve,dashed:true}:curve);
  let first='левая часть равенства',second='правая часть равенства';
  if(config.level!==undefined){first='функция из задания';second='горизонталь y = '+String(config.level).replace('.',',');}
  else if(curves[1].kind==='line'&&curves[1].k===0&&curves[1].b===0){first='функция из задания';second='ось y = 0';}
  else if(config.type==='graph-root-reading'){
   first='y = '+curves[0].k+'/|x|';
   second=curves[1].kind==='quadratic'?'y = x²':curves[1].k===1?'y = x + 1':'y = 1,5x − 2';
  }
  const legend=document.createElement('p');legend.className='small';legend.textContent='Сплошная линия — '+first+'. Пунктир — '+second+'.';
  host.prepend(rootGraph({curves,xRange:config.xRange,yRange:config.yRange,points:marks,label:legend.textContent},''),legend);
 }
}

function parameterSample(value) {
 const r=M.parse(String(value??''));
 return r&&Math.abs(r.n/r.d)<=24&&8%r.d===0?r.n/r.d:null;
}
function parameterExample(config,value) {
 const t=parameterSample(value);
 if(t===null)return null;
 const [a,b,c]=config.coefficients.map(row=>row.reduceRight((acc,coefficient)=>acc*t+coefficient,0));
 const d=b*b-4*a*c;
 const roots=a===0?(b===0?[]:[-c/b]):d<0?[]:d===0?[-b/(2*a)]:[(-b-Math.sqrt(d))/(2*a),(-b+Math.sqrt(d))/(2*a)].sort((u,v)=>u-v);
 return {t,a,b,c,d,roots,count:a===0&&b===0&&c===0?'all':String(roots.length)};
}
function parameterScene(host,config) {
 host.className='task-graphs construction';
 const trial=config.trial,model=parameterExample(config,trial||'0'),caption=document.createElement('p');
 caption.className='small';
 if(!model){caption.textContent='Для опыта введи число от −24 до 24 с шагом 1/8.';host.append(caption);return;}
 const {t,a,b,c,roots,count}=model;
 const format=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(v||0);
 const center=a?-b/(2*a):0,vertex=a?c-b*b/(4*a):c;
 const horizontal=Math.max(2,Math.abs(center)*1.25,...roots.map(v=>Math.abs(v)*1.25));
 const vertical=Math.max(2,Math.abs(vertex)*1.25,Math.abs(c)*1.25,Math.abs(b)*horizontal*.2);
 const graph=rootGraph({curves:[a?{kind:'quadratic',a,b,c}:{kind:'line',k:b,b:c}],points:roots.map(v=>[v,0]),
  xRange:[-horizontal,horizontal],yRange:[-vertical,vertical],compactTicks:horizontal>=1000||vertical>=10000,
  axisLabels:[config.unknown||'x','F'],label:'График левой части после переноса всех членов влево, при '+config.symbol+' = '+format(t)},'');
 graph.dataset.parameterValue=String(t);graph.dataset.solutionCount=count;
 const names={'all':'график совпадает с горизонтальной осью, подходит любое число','0':'пересечений с горизонтальной осью нет','1':'одна общая точка с горизонтальной осью','2':'две общие точки с горизонтальной осью'};
 caption.textContent=(trial?'Твой опыт':'Начальный пример')+' при '+config.symbol+' = '+format(t)+'. '+(a?'Парабола':b?'Прямая':'Постоянная функция')+', '+names[count]+'.';
 host.append(graph,caption);
}

function equationExamples(host,value){
 host.className='task-graphs quantity-model';
 const parts=String(value||'').split(';').map(x=>x.trim());
 const note=document.createElement('p');note.className='small';
 if(parts.length!==4||parts.some(x=>!M.parse(x))){note.textContent='После ввода четырёх коэффициентов здесь появятся оба твоих уравнения.';}
 else{
  const [a,b,c,d]=parts;
  note.textContent='Целое: ('+a+')x + ('+b+') = 0. Дробное: 1 / (x − ('+c+')) = '+d+'. Знаменатель исключает x = '+c+'.';
  note.dataset.equationPair='';
 }
 host.append(note);
}
function admissibleSample(raw,domain,count){
 const xs=String(raw??'').split(';').map(v=>M.parse(v.trim()));
 if(xs.length!==count||xs.some(v=>!v))return false;
 const [a,b]=xs;
 if(domain==='nonnegative')return xs.every(v=>v.n>=0);
 if(xs.some(v=>v.n<=0))return false;
 if(domain==='positive')return true;
 if(!b)return false;
 const diff=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);
 if(domain==='positive-unequal')return diff!==0n;
 if(!xs.every(v=>v.d===1))return false;
 return domain==='natural-gt'?diff>0n:domain==='natural-lt'&&diff<0n;
}
function radicalComparison(host,config,value){
 host.className='task-graphs quantity-model';
 const add=message=>{const p=document.createElement('p');p.className='small';p.textContent=message;host.append(p);};
 for(const [i,[a,b,sign]] of config.pairs.entries()){
  add('Квадрат '+(i?'второго':'первого')+' выражения: '+(a+b)+(sign>0?' + ':' − ')+'2√'+(a*b)+'.');
 }
 if(['<','=','>'].includes(value)){
  const [[a,b,sign],[c,d,otherSign]]=config.pairs;
  if(a+b!==c+d||sign!==otherSign)return;
  const comparison=sign*Math.sign(a*b-c*d),ok=value===(comparison<0?'<':comparison>0?'>':'=');
  const row=document.createElement('p');row.className='small';row.dataset.radicalOrder=ok?'yes':'no';row.textContent='Твой знак: '+config.labels.join(' '+value+' ')+'. '+(ok?'Сравнение согласуется с квадратами.':'Проверь знак перед удвоенным корнем.');host.append(row);
 }
}
function inequalityTrial(config,value,unrestricted=false){
 const input=String(value??'').trim(),parts=input.split(';');
 if(parts.length!==config.symbols.length||parts.some(v=>!M.parse(v)))return null;
 const evidence=sourceFractionTrial({symbols:config.symbols,original:config.left,reduced:config.right},input,unrestricted);
 if(!evidence||evidence.original===null||evidence.reduced===null)return null;
 const [an,ad='1']=evidence.original.split('/'),[bn,bd='1']=evidence.reduced.split('/');
 const delta=BigInt(an)*BigInt(bd)-BigInt(bn)*BigInt(ad);
 return {left:evidence.original,right:evidence.reduced,sign:delta>0n?'>':delta<0n?'<':'='};
}
function inequalityScene(host,config,value){
 host.className='task-graphs quantity-model';
 const input=config.mode==='given'?config.given:config.mode==='pair-example'&&String(value??'').trim()?value:config.mode==='counter'&&String(value??'').trim()&&M.parse(value)?value:config.trial;
 const add=(txt,key,state)=>{const p=document.createElement('p');p.className='small';p.textContent=txt;if(key)p.dataset[key]=state;host.append(p);};
 if(!input){add('На числовой прямой большее значение располагается правее. Подставь число в первом шаге и сравни обе стороны.');return;}
 if(config.sourceDomain&&!admissibleSample(input,config.sourceDomain,config.symbols.length)){
  const constraints={'natural-gt':'нужны натуральные a > b','natural-lt':'нужны натуральные a < b','positive':'каждая величина должна быть положительна','nonnegative':'нужны неотрицательные величины','positive-unequal':'нужны положительные и разные a и b'};
  add('Подстановка вне условия: '+constraints[config.sourceDomain]+'.','inequalityDomain','invalid');return;
 }
 if(config.compareSquares)add('На оси показаны квадраты двух неотрицательных сторон.');
 const check=inequalityTrial(config,input,Boolean(config.sourceDomain)||config.mode==='counter'||config.mode==='pair-example');if(!check){add('Введи отдельное рациональное значение для каждой переменной.');return;}
 const setting=String(input).split(';').map((v,i)=>config.symbols[i]+' = '+v).join(', ');
 add('При '+setting+' получаем: '+check.left+' '+check.sign+' '+check.right+'.','inequalityRelation',check.sign);
 const svg=node('svg',{viewBox:'0 0 320 107',role:'img','aria-label':'Расположение значений из этой подстановки: '+check.left+' '+check.sign+' '+check.right});
 // A local scale spans the two submitted values. Heights separate the two
 // labels when the values coincide; no absolute zero is implied by placement.
 const positions=check.sign==='<'?[55,265]:check.sign==='>'?[265,55]:[160,160];
 svg.append(node('line',{x1:20,x2:301,y1:52,y2:52,stroke:'#536d65','stroke-width':2}),node('path',{d:'M294 47 L301 52 L294 57',stroke:'#536d65',fill:'none'}));
 for(const [i,x]of positions.entries()){
  const c=i?'#99500e':'#087981',label=i?'вторая':'первая';
  svg.append(node('line',{x1:x,x2:x,y1:52,y2:i?72:31,stroke:c,'stroke-width':2}));
  svg.append(i?node('rect',{x:x-4,y:48,width:8,height:8,fill:c}):node('circle',{cx:x,cy:52,r:6,fill:'white',stroke:c,'stroke-width':2}));
  svg.append(node('text',{x,y:i?89:21,'text-anchor':'middle','font-size':15,fill:c},label));
 }
 host.prepend(svg);
 if(config.mode!=='given')add('Модель проверяет эту подстановку. Для вывода при любых значениях обоснуй знак разности алгебраически.');
}

function linearReview(host,config,value){
 host.className='task-graphs root-graph';
 const C=window.MakarychevCheck;
 const parse=z=>{const r=M.parse(z);return r?r.n/r.d:NaN;};
 const asCurve=([a,b,c],i)=>b?{kind:'line',k:-a/b,b:c/b,dashed:i>0}:{kind:'vertical',h:c/a,dashed:i>0};
 const curves=config.lines.map(asCurve),points=[...(config.points||[])];
 const say=(message,key,status)=>{const p=document.createElement('p');p.className='small';p.textContent=message;if(key)p.dataset[key]=status;host.append(p);};
 if(config.mode==='parameters'){
  const coordinates=String(value||'').split(';');
  const data=coordinates.map(parse);
  if(data.length===2&&data.every(Number.isFinite)){
   const [m,b]=data;curves.push(asCurve([2,-b,-10],1));points.push([m,3]);
   const subs=[-3*m+3,2*m-3*b];say('При (m; 3) левые части приближённо равны '+subs.map(v=>v.toLocaleString('ru',{maximumFractionDigits:5})).join(' и ')+'. Справа стоят 9 и −10.','parameterPoint',M.equal(coordinates[0],'-2')&&M.equal(coordinates[1],'2')?'yes':'no');
  }else say('Введите m и b, чтобы провести вторую прямую и проверить точку (m; 3).');
 }else if(config.mode==='triple'){
  const t=C.systemTriple(value);
  if(t){const [a,b,c]=t.values;
   if(a!==0||b!==0)curves.push(asCurve(t.values,1));
   const message=t.nonzero?'У прямых разные направления. Они пересекаются в одной точке.':a===0&&b===0?'Вторая строка вообще не задаёт прямую.':t.same?'Второе уравнение задаёт ту же прямую.':'Прямые параллельны и различны.';
   say(message,'lineRelation',t.nonzero?'intersect':a===0&&b===0?'degenerate':'parallel-or-same');
  }else say('Сплошная прямая задана условием. Введи a; b; c, чтобы добавить свой вариант.');
 }else if(config.mode==='constant'){
  const raw=config.trial||value,r=M.parse(raw);
  if(r){curves.push(asCurve([10,-4,r.n/r.d],1));const same=M.equal(raw,'6');say('При c = '+raw+(same?' обе строки дают одну прямую.':' две прямые параллельны и различны.'),'lineRelation',same?'same':'parallel');}
  else say('Подставь пробное c в первом шаге, чтобы увидеть вторую прямую.');
 }else{
  if(config.fromSystem&&config.trial){
   const coords=String(config.trial).split(';').map(parse);
   if(coords.length===2&&coords.every(Number.isFinite)){
    points.push(coords);const [x,y]=coords;
    const valid=3*x-2*y===16&&4*x+3*y===-7;
    say(valid?'Пробная точка удовлетворяет обеим исходным прямым.':'Проверь пробную точку в обоих исходных уравнениях.','systemPoint',valid?'yes':'no');
   }
  }
  const proposal=C.affinePlot(value);
  if(proposal){curves.push({kind:'line',...proposal,dashed:curves.length>0});const required=config.fromSystem?[...config.points,[2,-5]]:config.points;
    for(const [x,y] of required){
     const on=proposal.atPoint(x,y);
     const label=config.fromSystem&&x===2?'Точка пересечения исходных прямых':'Точка ('+x+'; '+y+')';
     say(label+(on?' лежит на введённой прямой.':' не лежит на введённой прямой.'),'pointOnCandidate',on?'yes':'no');
    }
  }else say(config.fromSystem?'На рисунке показаны исходные прямые и данная точка. Введи формулу искомой прямой.':'По заданным точкам составь формулу y = kx + d. Введённая прямая появится на рисунке.');
 }
 const legend=document.createElement('p');legend.className='small';
 if(config.fromSystem){
  legend.textContent='Сплошная: 3x − 2y = 16. Короткие штрихи: 4x + 3y = −7.';
  if(curves.length===3){curves[2].dashPattern='14 3';legend.textContent+=' Длинные штрихи: введённая функция.';}
 }else if(config.mode==='through')legend.textContent=curves.length?'Сплошная линия показывает введённую функцию. Точки заданы в условии.':'На рисунке отмечены заданные точки.';
 else legend.textContent='Сплошная линия показывает первую строку.'+(curves.length>1?' Штриховая — вторую строку.':'');
 const b=config.bounds;host.prepend(rootGraph({curves,points,xRange:[-b,b],yRange:[-b,b],label:legend.textContent},''),legend);
}

function quantityTrial(graph,raw){
 const [x]=fractionSample(raw,1)||[];
 if(!x)return null;
 const evaluate=(left,right)=>sourceFractionTrial({symbols:['x'],original:left,reduced:right},raw);
 const validNumber=(value,domain)=>{
  if(value===null||value==='0'||value.startsWith('-'))return false;
  const [n,d='1']=value.split('/');
  if(domain==='integer')return d==='1';
  return domain!=='fraction'||BigInt(n)<=BigInt(d);
 };
 const rows=graph.rows.map(row=>{
  const value=evaluate(row.formula,'0').original;
  return {...row,value,valid:validNumber(value,row.domain)};
 });
 const valid=x.n>0&&rows.every(row=>row.valid);
 const comparison=valid?evaluate(graph.comparison,graph.target):null;
 return {rows,valid,value:comparison?.original,agrees:valid&&comparison.original===comparison.reduced};
}

function quantityAudit(host,graph,value){
 host.className='task-graphs quantity-model';
 const add=(content,tag,state)=>{const p=document.createElement('p');p.className='small';p.textContent=content;if(tag)p.dataset[tag]=state;host.append(p);return p;};
 add('x обозначает '+graph.variable+'.');
 const parts=String(value||'').split(';'),selected=graph.trial?[graph.trial]:graph.focus===null||graph.focus===undefined?[]:graph.allowMultiple?parts:parts.slice(graph.focus,graph.focus+1);
 const trials=selected.slice(0,3).map(raw=>[raw,quantityTrial(graph,raw)]).filter(([,trial])=>trial);
 if(!trials.length){for(const row of graph.rows)add(row.name+': '+row.formulaText+' ('+row.unit+').');add('В первом шаге можно подставить число и проверить все величины.');}
 for(const [raw,trial] of trials){
  add('Пробное значение x = '+raw+'.');
  for(const row of trial.rows){
   const warning=row.valid?'':row.domain==='fraction'?' Массовая доля или выполненная часть должна быть больше нуля и не выше единицы.':row.domain==='integer'?' Здесь нужно положительное целое число.':' Нужна положительная величина.';
   const line=add(row.name+': '+(row.value===null?'деление на ноль':row.value+' '+row.unit)+'.'+warning,'quantityMeasure',row.valid?'valid':'invalid');
   if(row.bar&&row.valid){const [n,d='1']=row.value.split('/'),share=Number(n)/Number(d);const bar=document.createElement('progress');bar.max=1;bar.value=share;bar.setAttribute('aria-label',row.name);line.append(' ',bar,' '+(share*100).toLocaleString('ru',{maximumFractionDigits:2})+'%');}
  }
  if(trial.valid)add(graph.summary+' = '+trial.value+' '+graph.unit+'. По условию требуется '+graph.target+' '+graph.unit+'.','quantityComparison',trial.agrees?'agrees':'differs');
  else if(M.parse(raw)?.n<=0)add('Исходная величина x должна быть положительной.','quantityDomain','invalid');
 }
}

function journeyTrial(graph, raw){
 const fields=fractionSample(raw,1);
 if(!fields)return null;
 const evaluate=(left,right)=>sourceFractionTrial({symbols:['x'],original:left,reduced:right},raw);
 const rows=graph.legs.map(leg=>{
  const {original:distance,reduced:speed}=evaluate(leg.distance,leg.speed);
  const positive=v=>v!==null&&v!=='0'&&!v.startsWith('-');
  const valid=positive(distance)&&positive(speed);
  const time=valid?evaluate(['/',leg.distance,leg.speed],'0').original:null;
  return {name:leg.name,distance,speed,time,valid};
 });
 const valid=rows.every(row=>row.valid);
 const comparison=valid?evaluate(graph.timeComparison,graph.target):null;
 return {rows,valid,comparison:comparison?.original??null,agrees:valid&&comparison.original===comparison.reduced};
}

function travelTimes(host, graph, value){
 host.className='task-graphs quantity-model';
 const add=(content,tag,state)=>{const p=document.createElement('p');p.className='small';p.textContent=content;if(tag)p.dataset[tag]=state;host.append(p);};
 add('x — '+graph.variable+'. Время каждого участка равно его длине, делённой на скорость.');
 const entries=graph.trial?[graph.trial]:graph.speedAnswer?String(value||'').split(';'):[];
 const trials=entries.slice(0,3).map(raw=>[raw,journeyTrial(graph,raw)]).filter(([,trial])=>trial);
 if(!trials.length){
  for(const leg of graph.legs)add(leg.name+': '+leg.distanceText+' км, '+leg.speedText+' км/ч.');
  add('В первом шаге можно подставить пробную скорость и сравнить времена по условию.');
 }
 for(const [raw,trial] of trials){
  add('Подстановка x = '+raw+' км/ч.');
  for(const row of trial.rows){
   add(row.name+': '+row.distance+' км, '+row.speed+' км/ч. '+(row.valid?'Время '+row.time+' ч.':'Такой участок невозможен: нужны положительные длина и скорость.'),'travelLeg',row.valid?'valid':'invalid');
  }
  if(trial.valid)add(graph.relation[0].toUpperCase()+graph.relation.slice(1)+': '+trial.comparison+' ч. По условию требуется '+graph.target+' ч.','travelComparison',trial.agrees?'agrees':'differs');
 }
}

function rateTable(host,config,value){
 host.className='task-graphs quantity-model';
 const entries=String(value||'').split(';').map(x=>x.trim());
 const selected=config.all?entries:[entries[config.answerIndex||0]];
 const caption=document.createElement('p');
 caption.className='small';
 caption.textContent='Подставь своё значение x ('+config.varName+'). Для каждой строки сравни целое и делитель.';
 host.append(caption);
 const fraction=(n,d)=>{
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const g=gcd(n<0n?-n:n,d);
  return d/g===1n?String(n/g):n/g+'/'+d/g;
 };
 const renderRows=x=>{
  for(const row of config.rows){
   const line=document.createElement('p');line.className='small';line.dataset.rateRow='';
   line.textContent=row.label+' · '+row.total+' / ('+row.denominator+')';
   if(x){
    const denom=BigInt(row.slope)*BigInt(x.n)+BigInt(row.offset)*BigInt(x.d),result=document.createElement('strong');
    result.dataset.rateResult='';result.textContent=fraction(BigInt(row.total)*BigInt(x.d),denom)+' '+config.unit;
    line.append(' = ',result);
   }
   host.append(line);
  }
 };
 if(!selected.some(Boolean)){renderRows(null);return;}
 for(const raw of selected.slice(0,6)){
  if(!raw)continue;
  const x=M.parse(raw);
  if(!x){renderRows(null);continue;}
  const note=document.createElement('p');note.className='small';note.textContent='Подстановка x = '+raw;
  host.append(note);
  if((config.inclusiveMin?x.n<config.min*x.d:x.n<=config.min*x.d)||(config.max!==undefined&&x.n>=config.max*x.d)||(config.integer&&x.d!==1)){
   note.dataset.rateDomain='';note.textContent+=' не подходит по смыслу. Нужно x '+(config.inclusiveMin?'≥ ':'> ')+config.min+
      (config.max!==undefined?' и x < '+config.max:'')+(config.integer?', целое число':'')+'.';
  }else renderRows(x);
 }
}
function rationalEquationModel(host,config,value){
 host.className='task-graphs quantity-model';const note=document.createElement('p');note.className='small';
 if(!config.checked||!config.terms){
  note.textContent='После проверки можно проследить для каждого предложенного корня: разрешают ли его знаменатели и верно ли исходное равенство.';host.append(note);return;
 }
 if(!config.terms.length){
  note.textContent='Ты указал, что решений нет. Проверь отдельно кандидатов уравнения без дробей и исходные ограничения.';host.append(note);return;
 }
 for(const {term,status} of config.terms){
  const row=document.createElement('p');row.className='small';row.dataset.candidateStatus=status;
  row.textContent=term+' — '+({excluded:'значение обнуляет исходный знаменатель; его нужно исключить.',correct:'все знаменатели определены и равенство выполняется.',different:'знаменатели допустимы, но исходное равенство не выполняется.'})[status];host.append(row);
 }
}
function reciprocalExample(host,config,value){
 host.className='task-graphs root-graph';
 const caption=document.createElement('p');caption.className='small';
 if(!config.analysis){
  caption.textContent='Введи коэффициенты a и b, чтобы построить свою прямую и гиперболу.';host.append(caption);return;
 }
 const {a,b,count,discriminant}=config.analysis,points=[];
 if(a===0&&b!==0)points.push([1/b,b]);
 if(a!==0&&count===1){const x=-b/(2*a);points.push([x,1/x]);}
 if(a!==0&&count===2){
  const q=-(b+(b>=0?1:-1)*Math.sqrt(discriminant))/2;
  for(const x of [q/a,-1/q])points.push([x,1/x]);
 }
 const xs=points.map(p=>p[0]);const ys=points.map(p=>p[1]);
 // Fit each axis independently so intersections remain visible for steep lines.
 const xEnd=Math.max(3,...xs.map(Math.abs))*1.18,yEnd=Math.max(3,Math.abs(b),...ys.map(Math.abs))*1.18;
 const visible=points.filter(p=>p.every(Number.isFinite));
 const plane={curves:[{kind:'hyperbola',k:1,xs:[-2,-1,1,2,...xs]},{kind:'line',k:a,b,dashed:true,xs}],points:config.checked?visible:[],xRange:[-xEnd,xEnd],yRange:[-yEnd,yEnd],
  compactTicks:Math.max(xEnd,yEnd)>1000,label:'Сплошная гипербола y = 1/x и твоя штриховая прямая'};
 const svg=rootGraph(plane,'');svg.dataset.reciprocalSlope=String(a);svg.dataset.reciprocalIntercept=String(b);host.append(svg);
 caption.textContent='Сплошная кривая — y = 1/x, штриховая прямая определяется твоими a и b.'+(config.checked?' Число действительных точек встречи: '+count+'.':'');
 host.append(caption);
}

function coefficientExample(host,config,value){
 host.className='task-graphs root-graph';
 const caption=document.createElement('p');caption.className='small';
 const fields=String(value).split(';').slice(0,3),coeffs=fields.map(v=>M?.parse(v));
 if(fields.length!==3||coeffs.some(x=>!x||x.d!==1||x.n<=0)){
  caption.textContent='Для модели введи три положительных целых коэффициента и разложение после следующей точки с запятой.';host.append(caption);return;
 }
 const [a,b,c]=coeffs.map(v=>BigInt(v.n));
 const discriminant=b*b-4n*a*c;
 caption.textContent='Твой трёхчлен: '+a+'x² + '+b+'x + '+c+'.';
 if(config.evaluated){
  caption.textContent+=' D = '+discriminant+'. '+(discriminant<0n?'У этого примера нет действительных пересечений с осью x.':'Можно проверить линейные множители по действительным корням.');
  const B=Number(b)/Number(a),C=Number(c)/Number(a);
  if(B<=10&&C<=10){
   const h=-B/2,k=C-B*B/4,radius=Math.max(1.75,Math.sqrt(Math.max(0,-k))*1.4),points=[];
   if(discriminant>=0n){const delta=Math.sqrt(Number(discriminant))/Number(2n*a);points.push([h-delta,0]);if(delta)points.push([h+delta,0]);}
   const plane={curves:[{kind:'quadratic',a:1,b:B,c:C}],points,xRange:[h-radius,h+radius],yRange:[Math.min(k,-.5)-.5,Math.max(k+radius*radius,.5)+.5],label:'Корни твоего трёхчлена на графике P(x)/A'};
   const svg=rootGraph(plane,'');svg.dataset.exampleDiscriminant=String(discriminant);host.append(svg);caption.textContent+=' Показан график P(x)/A с теми же нулями.';
  }
 }
 host.append(caption);
}

function vertexForm(host,config,value){
 host.className='task-graphs root-graph';
 const parts=String(value).split(';').map(v=>number(v)),pointOnly=config.mode==='point';
 const caption=document.createElement('p');caption.className='small';
 if(parts.length!==(pointOnly?2:3)||parts.some(v=>v===null)){
  caption.textContent=pointOnly?'Введи обе координаты предложенной вершины: на чертеже появится твоя точка.':'Запись A; h; k построит твою параболу с вершиной (h; k).';host.append(caption);return;
 }
 const [a,h,k]=pointOnly?[config.a,...parts]:parts;
 if(!a){caption.textContent='При A = 0 получается постоянная функция. У исходного квадратного трёхчлена A отличается от нуля.';host.append(caption);return;}
 const fmt=n=>Number(n.toFixed(6)).toLocaleString('ru',{maximumFractionDigits:6});
 const curve=(a,h,k,dashed=false)=>({kind:'quadratic',a,b:-2*a*h,c:a*h*h+k,dashed});
 const curves=pointOnly?[]:[curve(a,h,k)];
 if(config.evaluated)curves.push(curve(config.a,config.h,config.k,true));
 const xs=config.evaluated?[h,config.h]:[h],left=Math.min(...xs)-2,right=Math.max(...xs)+2;
 const limits=[k];for(const q of curves){
  const center=-q.b/(2*q.a);limits.push(curveValue(q,left),curveValue(q,right),curveValue(q,center));
 }
 let bottom=Math.min(...limits),top=Math.max(...limits);const margin=Math.max(1,(top-bottom)*.13);bottom-=margin;top+=margin;
 const formula=fmt(a)+'(x '+(h<0?'+':'−')+' '+fmt(Math.abs(h))+')² '+(k<0?'−':'+')+' '+fmt(Math.abs(k));
 const note=pointOnly?'Предложенная точка ('+fmt(h)+'; '+fmt(k)+').':'Твоя запись: '+formula+'. Вершина ('+fmt(h)+'; '+fmt(k)+').';
 const svg=rootGraph({curves,points:[[h,k]],xRange:[left,right],yRange:[bottom,top],compactTicks:Math.max(Math.abs(bottom),Math.abs(top))>1000,label:note},'');
 caption.textContent=note+(config.evaluated?' Штриховая линия показывает исходный трёхчлен.':'');
 host.append(svg,caption);
}
function legTrial(host,value){
 host.className='task-graphs quantity-model';
 const caption=document.createElement('p');caption.className='small';
 const x=number(value);
 if(x===null||x<=0||x>=6){
  caption.textContent=String(value).trim()?'Оба катета должны иметь положительную длину: 0 < x < 6.':'Укажи возможный катет от 0 до 6 см, исключая концы. Изменяя длину, сравнивай площади.';
  host.append(caption);return;
 }
 const other=6-x,area=x*other/2,scale=138/Math.max(x,other),w=x*scale,h=other*scale;
 const svg=node('svg',{viewBox:'0 0 260 190',role:'img','aria-label':'Прямоугольный треугольник для введённого катета'});
 const fmt=n=>n.toLocaleString('ru',{maximumFractionDigits:6});
 svg.append(node('polygon',{points:[[58,154],[58+w,154],[58,154-h]].map(p=>p.join(',')).join(' '),fill:'#d3eee7',stroke:'#166753','stroke-width':2,'data-first-leg':x,'data-second-leg':other,'data-trial-area':area}));
 svg.append(node('text',{x:58+w/2,y:175,'font-size':15,'text-anchor':'middle'},fmt(x)+' см'));
 svg.append(node('text',{x:29,y:154-h/2,'font-size':15,'text-anchor':'middle'},fmt(other)+' см'));
 caption.textContent='Катеты '+fmt(x)+' и '+fmt(other)+' см. Текущая площадь '+fmt(area)+' см².';host.append(svg,caption);
}

function vietaRelations(host,config,value){
 host.className='task-graphs quantity-model';
 const parts=String(value).split(';');
 const hasPair=parts.length===2&&parts.every(part=>M?.parse(part));
 const description=document.createElement('p');description.className='small';
 if(!hasPair){
  description.textContent='Две независимые проверки: сумма корней S = −b/a и произведение P = c/a. После ответа модель сопоставит их с твоей парой.';
  host.append(description);return;
 }
 for(const [i,key,title] of [[0,'sum','Сумма'],[1,'product','Произведение']]){
  const same=M.equal(parts[i],config[key]);
  const row=document.createElement('p');row.className='small';row.dataset.vietaRelation=key;row.dataset.match=String(same);
  row.textContent=title+': '+parts[i].trim()+' — '+(same?'совпадает':key==='sum'?'проверь обратный знак и деление на a':'проверь свободный член и деление на a')+'.';
  host.append(row);
 }
 const values=parts.map(p=>number(p)),[s,p]=values;
 if(values.every(n=>n!==null)){
  const discriminant=s*s-4*p;
  description.textContent='Из введённых S и P получится t² − St + P = 0. У полученного уравнения '+(discriminant<0?'нет действительных корней.':discriminant===0?'один двукратный корень.':'два различных действительных корня.');
  host.append(description);
 }
}

function appliedShape(host,config,value){
 host.className='task-graphs quantity-model';
 const svg=node('svg',{viewBox:'0 0 300 175',role:'img'}),caption=document.createElement('p');
 caption.className='small';
 const rect=(x,y,w,h,attrs={})=>svg.append(node('rect',{x,y,width:w,height:h,fill:'#d8eeeb',stroke:'#184e56','stroke-width':1.7,...attrs}));
 const line=(x1,y1,x2,y2,attrs={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:'#184e56','stroke-width':1.8,...attrs}));
 const label=(x,y,t)=>svg.append(node('text',{x,y,'text-anchor':'middle','font-size':15,fill:'#17393f'},t));
 const fmt=n=>Number(n.toFixed(4)).toLocaleString('ru');
 const scene=config.scene;
 if(scene==='scaled-cuts'){
  const entries=String(value).trim().split(';').map(part=>number(part,100));
  const [total,a,b,h]=entries;
  const valid=entries.length===4&&entries.every(x=>x!==null&&x>0)&&a<b&&b<total;
  if(valid){
   const scale=Math.min(235/total,104/h),x=32,y=32,w=total*scale,height=h*scale;
   rect(x,y,w,height,{fill:'#f3f7f6','data-source-cut':'sheet'});rect(x+a*scale,y,(b-a)*scale,height,{'data-source-cut':'middle'});
   line(x+a*scale,y,x+a*scale,y+height,{'stroke-dasharray':'3 3'});line(x+b*scale,y,x+b*scale,y+height,{'stroke-dasharray':'3 3'});
   label(x+w/2,20,'Лист '+fmt(total)+' × '+fmt(h)+' см');label(x+w/2,159,'Разрезы: '+fmt(a)+' и '+fmt(b)+' см');
   caption.textContent='Чертёж по твоим размерам. Ширина левой, средней и правой частей: '+[a,b-a,total-b].map(fmt).join('; ')+' см на бумаге.';
  }else{
   line(28,114,272,114);line(28,107,28,121);label(29,142,'0');label(150,62,'Масштаб 1 : 2');
   caption.textContent=String(value).trim()?'Для построения нужны четыре положительные длины. Отметки идут от левого края и лежат внутри листа.':'Размеры чертежа вводятся ниже. После ввода увидишь расположение обоих разрезов.';
  }
 }else if(scene==='round-robin'){
  const pts=[[150,20],[241,77],[207,141],[93,141],[59,77]];
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)line(...pts[i],...pts[j],{stroke:i===0?'#226776':'#a3b4b4','stroke-dasharray':i===0?'none':'4 3'});
  pts.forEach(([x,y],i)=>{svg.append(node('circle',{cx:x,cy:y,r:8,fill:i===0?'#a34725':'#225963'}));});
  caption.textContent='Пример с пятью участниками. Точка — участник, линия — общая игра. Сплошные линии показывают все встречи одного участника. Каждая линия имеет два конца.';
 }else if(scene==='box-net'){
  const x=47,y=14,w=195,h=130,d=30;
  rect(x,y,w,h,{fill:'#f5f7f4','stroke-dasharray':'4 3'});rect(x+d,y,w-2*d,h);rect(x,y+d,w,h-2*d);
  rect(x+d,y+d,w-2*d,h-2*d,{fill:'#b9ddd6','stroke-dasharray':'5 3'});
  label(x+w/2,y+h/2+4,'дно');label(x+w/2,167,'60 см');label(25,85,'40');label(x+d/2,y+19,'x');
  caption.textContent='Четыре угловых квадрата убирают. По штриховым линиям отгибают четыре борта. Дно — внутренний прямоугольник.';
 }else if(scene==='end-squares'){
  rect(26,42,248,64,{fill:'#f8f3e5'});rect(90,42,120,64);line(90,42,90,106);line(210,42,210,106);
  label(150,28,'26 см');label(59,80,'x');label(240,80,'x');label(150,82,'26 − 2x');label(150,143,'Ширина листа — x');
  caption.textContent='Два крайних квадрата вырезают. Средний участок сохраняет ширину листа.';
 }else if(scene==='triangle'){
  const x=60,y=128,w=166,h=w*config.h/config.w;
  svg.append(node('polygon',{points:[[x,y],[x+w,y],[x,y-h]].map(p=>p.join(',')).join(' '),fill:'#d8eeeb',stroke:'#184e56','stroke-width':2}));
  line(x+10,y,x+10,y-10);line(x+10,y-10,x,y-10);label(x+w/2,y+22,config.label1);label(x-23,y-h/2,config.label2);
  caption.textContent='Подписи относятся к перпендикулярным сторонам. Наклонная сторона — гипотенуза. Схема помогает составить уравнение.';
 }else{
  const x=58,y=22,w=182,h=Math.min(107,w*config.h/config.w);
  rect(x,y,w,h);
  if(config.diagonal){line(x,y+h,x+w,y,{'stroke-dasharray':'5 3'});label(x+w*.7,y+h*.67,config.diagonal);}
  if(scene==='square-cut'){line(x+h,y,x+h,y+h,{'stroke-dasharray':'5 3'});label(x+(w+h)/2,y+h/2+5,'120 см');}
  if(scene==='seats'){
   for(let row=0;row<4;row++)for(let col=0;col<7;col++)svg.append(node('circle',{cx:x+18+col*24,cy:y+18+row*23,r:4,fill:'#286477'}));
  }
  label(x+w/2,y+h+22,config.label1);label(29,y+h/2,config.label2);
  caption.textContent=scene==='seats'?'Схема показывает, как строки и столбцы образуют произведение. Точки на примере не задают число мест в условии.':scene==='square-cut'?'Штриховая линия — распил. Квадрат и прямоугольная часть имеют одинаковую ширину.':'Соседние подписи обозначают разные стороны. Противоположные стороны равны.';
 }
 svg.setAttribute('aria-label',caption.textContent);host.append(svg,caption);
}

function render(host,config,value){
 if(!host||!config)return;host.replaceChildren();
 if(config.learnerIntersections){
  const points=parseIntegerPairs(value)||[];
  config=config.type==='line-figure'?{...config,fixedPoints:points}:{...config,points};
 }
 if(['quadratic-discriminant','quadratic-parameter','quadratic-reciprocals','check-common-point'].includes(config.type)){quadraticEvidence(host,config,value);return;}
 if(config.type==='rational-line-example'){reciprocalExample(host,config,value);return;}
 if(config.type==='rational-equation-check'){rationalEquationModel(host,config,value);return;}
 if(config.type==='coefficient-example'){coefficientExample(host,config,value);return;}
 if(config.type==='vertex-form'){vertexForm(host,config,value);return;}
 if(['line-figure','own-lines','own-points'].includes(config.type)){planeConstruction(host,config,value);return;}
 if(config.type==='abs-line-choice'){absLineChoice(host,config);return;}
 if(config.type==='system-pair-audit'){systemPairModel(host,config);return;}
 if(config.type==='inequality-intervals'){inequalityIntervals(host,config);return;}
 if(['rational-intersections','rational-root-audit','graph-root-reading'].includes(config.type)){rationalScene(host,config);return;}
 if(config.type==='source-fraction'){sourceFractionScene(host,config);return;}
 if(config.type==='factor-witness'){
  host.className='task-graphs quantity-model';
  const parts=String(value||'').split(';');
  if(parts.length===3&&config.audit){
   const caption=document.createElement('p');caption.className='small';caption.dataset.factorProduct='';
   caption.textContent='Твоё произведение: ('+parts[0]+')·(x − ('+parts[1]+'))·(x − ('+parts[2]+')).';host.append(caption);
   for(const [name,good] of [['Старший коэффициент',config.rightLeading],['Сумма корней',config.audit.sum],['Произведение корней',config.audit.product]]){
    const row=document.createElement('p');row.className='small';row.dataset.factorWitness=good?'yes':'no';row.textContent=name+(good?' совпадает.':' отличается.');host.append(row);
   }
  }else {const row=document.createElement('p');row.className='small';row.textContent='Введи A и оба корня: модель составит твоё произведение линейных множителей.';host.append(row);}
  return;
 }
 if(config.type==='vieta-audit'){
  host.className='task-graphs quantity-model';
  for(const [name,label] of [['sum','Сумма'],['product','Произведение']]){
   const p=document.createElement('p');p.className='small';p.dataset.vietaRelation=name;
   p.textContent=label+' по коэффициентам: '+config[name]+'. ';
   if(config.audit){const good=config.audit[name];p.dataset.vietaCheck=good?'yes':'no';p.textContent+=good?'Введённые числа дают это значение.':'Введённые числа дают другое значение.';}
   else p.textContent+='Введи оба корня для точной проверки.';
   host.append(p);
  }
  return;
 }
 if(config.type==='number-sequence'){sequenceScene(host,config,value);return;}
 if(config.type==='applied-measure'){measureScene(host,config,value);return;}
 if(config.type==='square-certificate'){squareCertificateScene(host,config,value);return;}
 if(config.type==='root-residual'){residualScene(host,config);return;}
 if(config.type==='parameter-polynomial'){parameterScene(host,config);return;}
 if(config.type==='story-balance'){balanceScene(host,config,value);return;}
 if(config.type==='two-equations'){equationExamples(host,value);return;}
 if(config.type==='radical-comparison'){radicalComparison(host,config,value);return;}
 if(config.type==='inequality-evidence'){inequalityScene(host,config,value);return;}
 if(config.type==='linear-review'){linearReview(host,config,value);return;}
 if(config.type==='quantity-audit'){quantityAudit(host,config,value);return;}
 if(config.type==='travel-times'){travelTimes(host,config,value);return;}
 if(config.type==='rate-table'){rateTable(host,config,value);return;}
 if(config.type==='leg-trial'){legTrial(host,value);return;}
 if(config.type==='vieta-relations'){vietaRelations(host,config,value);return;}
 if(config.type==='applied-shape'){appliedShape(host,config,value);return;}
 if(config.type==='quadratic-story'){quadraticStory(host,config,value);return;}
 if(config.type==='quadratic-example'){quadraticExample(host,value);return;}
 if(['work-hours','equal-distances'].includes(config.type)){workEstimate(host,config,value);return;}
 if(['intersection-example','shared-hyperbola-line'].includes(config.type)){
  host.className='task-graphs root-graph';
  const own=config.type==='shared-hyperbola-line',params=own?parseLine(value):config.reveal?{k:config.k,b:config.line[1]}:null;
  const curves=params?[{kind:'hyperbola',k:params.k},{kind:'line',k:own?params.k:config.line[0],b:params.b}]:[];
  const points=own?[config.point]:config.reveal?config.points:[];
  const bound=own?Math.max(6,Math.abs(config.point[0])+2,Math.abs(config.point[1])+2):5;
  host.append(rootGraph({type:'root-plane',curves,points,xRange:[-bound,bound],yRange:[-bound,bound]},''));
  const note=document.createElement('p');note.className='small';note.textContent=own?'Данная точка отмечена. После проверки на осях появятся обе кривые по введённым k и b.':config.reveal?'Показаны кривые и точки именно из примера доказательства.':'После попытки можно сопоставить рассуждение с примером на этих осях.';host.append(note);return;
 }
 if(config.type==='natural-values'){renderNaturalValues(host,config);return;}
 if(config.type==='domain-fraction'){renderDomainFraction(host,config);return;}
 if(config.type==='train-meeting'){renderTrainMeeting(host,value);return;}
 if(config.type==='integer-pairs'){renderIntegerPairs(host,config,value);return;}
 if(config.type==='number-line'){host.className='task-graphs number-line';host.append(numberLine(config));if(config.caption){const caption=document.createElement('p');caption.className='small';caption.textContent=config.caption;host.append(caption);}
 }else if(config.type==='line-example'){
  host.className='task-graphs root-graph';
  const line=parseLine(value);
  const caption=document.createElement('p');caption.className='small';
  caption.textContent=line?'Сравни наклон и пересечение с осью y с условием.':'Введи коэффициенты k и b, чтобы построить свою прямую.';
  const plane={...config,type:'root-plane',curves:line?[{kind:'line',...line}]:[]};
  if(line){
   const bound=Math.max(6,Math.abs(line.b),Math.abs(line.b+line.k),Math.abs(line.b-line.k));
   plane.xRange=[-3,3];plane.yRange=[-bound,bound];
  }
  host.append(rootGraph(plane,''),caption);
 }else if(config.type==='root-line'){
  host.className='task-graphs root-graph';const line=parseLine(value),plane={...config,type:'root-plane',curves:[{kind:'sqrt'},...(line?[{kind:'line',...line}]:[])]};host.append(rootGraph(plane,''));
  const caption=document.createElement('p');caption.className='small';caption.textContent='Показана часть графиков. Введи k; b, чтобы добавить свою прямую y=kx+b. Число пересечений проверяется по уравнению.';host.append(caption);
 }else if(['root-plane','root-build','curve-build'].includes(config.type)){
  host.className='task-graphs root-graph';host.append(rootGraph(config,value));
  const caption=document.createElement('p');caption.className='small';
  caption.textContent=['root-build','curve-build'].includes(config.type)?((config.showSolution&&config.completeCaption)||config.caption||'Введи ординаты точек ниже — они появятся на твоём чертеже.'):(config.caption||'На рисунке показана часть графика. Проверяй выводы по формуле.');host.append(caption);
 }else if(config.type==='choices'||config.type==='hyperbola-choices'){
  host.className='task-graphs alternatives';
  const inverse=config.type==='hyperbola-choices';
  const graphs=inverse?config.coefficients.map(k=>({k})):alternatives;
  graphs.forEach((g,i)=>{
   const fig=document.createElement('figure'),caption=document.createElement('figcaption'),zoom=document.createElement('button');zoom.type='button';zoom.className='graph-zoom';zoom.textContent='График '+(i+1)+' ↗';zoom.setAttribute('aria-label','Увеличить график '+(i+1));caption.append(zoom);
   const label=inverse?'График '+(i+1)+': при x = 2 значение y примерно '+(g.k/2).toLocaleString('ru',{maximumSignificantDigits:3})+'.':'График '+(i+1)+': y='+g.k+'x'+(g.b<0?'':'+')+g.b+(g.holes.length?', выколотая точка при x='+g.holes[0]:', без выколотых точек');
   const draw=()=>inverse?rootGraph({label,curves:[{kind:'hyperbola',k:g.k}],xRange:[-6,6],yRange:[-6,6],xTickStep:2,yTickStep:2},''):graph(g.k,g.b,g.holes,3,label);
   fig.append(caption,draw());host.append(fig);
   zoom.onclick=()=>{const dialog=document.createElement('dialog'),title=document.createElement('p'),close=document.createElement('button');dialog.className='graph-dialog';dialog.setAttribute('aria-label','Увеличенный график '+(i+1));title.textContent='График '+(i+1);close.type='button';close.textContent='Вернуться к выбору';dialog.append(title,draw(),close);host.append(dialog);close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();zoom.focus();},{once:true});dialog.showModal();};
  });
 }else if(config.type==='pair'||config.type==='pair-reference'){
  host.className='task-graphs construction';
  const pair=parsePair(config.type==='pair-reference'?(config.lines||[]).flat().join(';'):value),caption=document.createElement('p');caption.className='small';
  caption.textContent=config.type==='pair-reference'?'Сравни с точным решением.':pair?'Чертёж по твоей записи.':'Введи коэффициенты ниже.';
  const label=pair?'Две прямые: '+pair.map(g=>'y='+g.k+'x'+(g.b<0?'':'+')+g.b).join('; '):'Координатные оси для построения двух прямых';
  host.append(graph(pair?pair[0].k:null,pair?pair[0].b:0,[],config.range||4,label,pair?[pair[1]]:[]),caption);
 }else{
  host.className='task-graphs construction';const g=parse(value),caption=document.createElement('p');caption.className='small';caption.textContent=g?'Твой график по введённой записи. Проверь его кнопкой ниже.':'Твой чертёж появится после ввода k; b; исключённых x в поле ответа.';
  host.append(graph(g?g.k:null,g?g.b:0,g?g.holes:[],config.range||7,'Твой график'+(g?': y='+g.k+'x'+(g.b<0?'':'+')+g.b+'; исключённые x: '+(g.holes.join(', ')||'нет'):': координатные оси')),caption);
 }
}
return {admissibleSample,inequalityTrial,quantityTrial,journeyTrial,fractionSample,sourceFractionTrial,sequenceRows,sequenceEvidence,parameterSample,parameterExample,parse,parsePair,parseLine,parseRootPoints,parseIntegerPairs,pairEquation,curveValue,alternatives,render,rootGraph,numberLine};
});
