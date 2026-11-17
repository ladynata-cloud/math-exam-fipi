/* Static geometry diagrams for the basic-EGE bank. */
(function(root){'use strict';
 const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const F=value=>typeof value==='number'?root.PathData.F(value):String(value);
 const ids=new Set(['box','roundbody','pyramid','scale','practice-displacement','practice-pour','practice-joined-surface','practice-faces','practice-cone-area','practice-pyramid-lateral','practice-box-diagonal','practice-similar-volume']);
 const path=(d,{fill='none',color='#216e56',dash=false,width=3}={})=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}"${dash?' stroke-dasharray="7 6"':''} stroke-linejoin="round"/>`;
 const line=(a,b,options)=>path(`M${a}L${b}`,options);
 const label=(x,y,value,given)=>`<text x="${x}" y="${y}" text-anchor="middle"${given?` data-stereo-given="${E(given)}"`:''}>${E(value)}</text>`;
 const fraction=(x,y,num,den,given)=>`<g${given?` data-stereo-given="${E(given)}"`:''} aria-label="${E(num)} / ${E(den)}">${label(x,y-9,num)}${line([x-22,y],[x+22,y],{color:'#173e3c',width:2})}${label(x,y+25,den)}</g>`;
 // Fixed front view: the upper half of a horizontal ring is its rear half.
 // Keep the ellipse as an unpainted geometry/fill element; only these arcs
 // stroke its boundary, so a fill never covers the hidden half with a solid line.
 const ring=(cx,cy,rx,ry,options={})=>`<ellipse data-stereo-ring="${options.kind||'ring'}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${options.fill||'none'}" stroke="none"/>`
  +`<g data-ring-half="back" data-hidden="${options.backHidden!==false}">${path(`M${cx-rx} ${cy}A${rx} ${ry} 0 0 1 ${cx+rx} ${cy}`,{...options,dash:options.backHidden!==false})}</g>`
  +`<g data-ring-half="front" data-hidden="false">${path(`M${cx+rx} ${cy}A${rx} ${ry} 0 0 1 ${cx-rx} ${cy}`,options)}</g>`;
 const figure=(name,body)=>`<figure style="flex:1 1 260px;min-width:0;margin:0"><figcaption style="text-align:center;font-weight:650">${E(name)}</figcaption><svg class="task-figure stereo-figure" viewBox="0 0 420 380" role="img" aria-label="${E(name)}" style="font-size:23px;max-width:420px;max-height:none">${body}</svg></figure>`;
 function box(labels={},seam=false,diagonal=false){
  let s=path('M75 105H275L345 55H145Z',{fill:'#edf6f0'})+path('M75 105H275V260H75Z',{fill:'#f5faf7'})+path('M275 105L345 55V210L275 260Z',{fill:'#e3efe7'});
  s+=path('M75 260L145 210H345M145 210V55',{dash:true,color:'#8da99a',width:2});
  if(seam)s+=path('M175 105V260M175 105L245 55',{color:'#a66a37',width:2});
  if(diagonal)s+=line([75,260],[275,105],{color:'#b05d2d',width:4})+label(160,145,'d = '+F(labels.d),'diagonal');
  if(labels.a!==undefined)s+=label(seam?123:175,296,F(labels.a),'a');
  if(labels.b!==undefined)s+=label(329,253,F(labels.b),'b');
  if(labels.h!==undefined)s+=label(43,189,F(labels.h),'height');
  return s;
 }
 function steppedBox({width,baseHeight,upperWidth,raise,depth}){
  const unit=Math.min(195/width,176/(baseHeight+raise)),x=83,y=277;
  const dx=18+6*depth,dy=-.64*dx,full=x+width*unit,upper=x+upperWidth*unit,step=y-baseHeight*unit,top=step-raise*unit;
  const front=[[x,y],[full,y],[full,step],[upper,step],[upper,top],[x,top]];
  const back=front.map(([px,py])=>[px+dx,py+dy]);
  const face=(points,fill)=>path('M'+points.map(p=>p.join(',')).join('L')+'Z',{fill});
  let picture=face(front,'#f5faf7');
  for(const [i,j,fill] of [[1,2,'#e3efe7'],[2,3,'#edf6f0'],[3,4,'#e3efe7'],[4,5,'#edf6f0']]){
   picture+=face([front[i],front[j],back[j],back[i]],fill);
  }
  const rear={dash:true,color:'#8da99a',width:2};
  picture+=path('M'+[front[0],back[0],back[1]].map(p=>p.join(',')).join('L'),rear)+line(back[0],back[5],rear);
  picture+=label((x+full)/2,y+35,F(width)+' см','width')+label(x-39,(y+step)/2,F(baseHeight)+' см','base-height');
  picture+=label((x+upper)/2,top-13,F(upperWidth)+' см','upper-width')+label(x-39,(top+step)/2,F(raise)+' см','raise');
  return picture+label(full+dx+23,y+dy-4,F(depth)+' см','depth');
 }
 function cylinder({radius='r',height,unknown=false,water=false,radiusSize=100}={}){
  const left=210-radiusSize,right=210+radiusSize,rim=radiusSize*.26;
  let s=water?path(`M${left+1} 135Q210 ${135+rim} ${right-1} 135V265Q210 ${265+rim} ${left+1} 265Z`,{fill:'#d9edf6',color:'#5e9db6',width:0}):'';
  s+=path(`M${left} 75V265M${right} 75V265`)+ring(210,75,radiusSize,rim,{kind:'cylinder-top',backHidden:false})+ring(210,265,radiusSize,rim,{kind:'cylinder-base'});
  if(water)s+=ring(210,135,radiusSize-1,rim,{kind:'water-level',color:'#5e9db6',width:2});
  s+=line([210,75],[right,75],{color:'#b05d2d'})+label(210+radiusSize/2,38,radius,'radius');
  if(height!==undefined)s+=line([right+26,water?135:75],[right+26,265],{color:'#b05d2d',dash:true})+label(right+59,178,F(height),'height');
  if(unknown)s+=label(210,186,'h = ?');
  return s;
 }
 function cone({radius,height,slant,cut,smallVolume,wholeVolume,ratio,unitScale,levels}={}){
  let radiusPx=108,heightPx=228;
  if(radius!==undefined&&slant!==undefined){const realHeight=Math.sqrt(slant*slant-radius*radius),unit=unitScale??Math.min(108/radius,228/realHeight);radiusPx=radius*unit;heightPx=realHeight*unit;}
  const apexY=268-heightPx;
  let s=path(`M${210-radiusPx} 268L210 ${apexY}L${210+radiusPx} 268`,{fill:'#edf6f0'})+ring(210,268,radiusPx,radiusPx*28/108,{kind:'cone-base'});
  if(radius!==undefined)s+=`<g data-hidden="true" data-stereo-aux="radius">${line([210,268],[210+radiusPx,268],{color:'#b05d2d',dash:true})}</g>`+label(210+radiusPx/2,326,'r = '+F(radius),'radius');
  if(height!==undefined)s+=line([210,40],[210,268],{color:'#b05d2d',dash:true})+label(168,173,'h = '+F(height),'height')+path('M210 249H229V268',{color:'#b05d2d',width:2,dash:true});
  if(slant!==undefined)s+=label(265+radiusPx/2,apexY+heightPx/2,'l = '+F(slant),'slant');
  if(cut){const y=40+228*cut;s+=ring(210,y,108*cut,28*cut,{kind:'cone-section',color:'#b05d2d'});s+=line([72,40],[72,y],{color:'#b05d2d',dash:true});s+=label(44,(40+y)/2+8,levels?F(levels.small)+' см':'h');s+=line([350,40],[350,268],{color:'#6c8277',dash:true})+label(379,165,levels?F(levels.whole)+' см':'H');}
  if(smallVolume!==undefined)s+=label(210,20,'V малого = '+F(smallVolume),'small-volume');
  if(wholeVolume!==undefined)s+=label(210,20,'V большого = '+F(wholeVolume),'whole-volume');
  if(ratio!==undefined)s+=fraction(150,335,'h','H')+label(196,343,'=')+fraction(244,335,1,ratio,'height-ratio');
  return s;
 }
 function pyramid(n,side,edge,height){
  const pts=n===6?[[90,243],[185,284],[290,263],[331,217],[233,181],[130,198]]:[[85,248],[251,282],[333,213],[167,180]],apex=[210,43];
  const front=n===6?4:3;
  let s=path('M'+pts.map(p=>p.join(',')).join('L')+'Z',{fill:'#edf6f0',width:0});
  s+=path('M'+pts.slice(0,front).map(p=>p.join(',')).join('L'));
  s+=path('M'+pts.slice(front-1).concat([pts[0]]).map(p=>p.join(',')).join('L'),{dash:true,color:'#8da99a'});
  pts.forEach((p,i)=>{s+=line(p,apex,{dash:i>=front,color:i>=front?'#8da99a':'#216e56'});});
  if(side!==undefined)s+=label(n===6?128:157,304,'a = '+F(side),'side');
  if(edge!==undefined)s+=label(95,151,F(edge),'lateral-edge');
  if(height!==undefined)s+=line(apex,[210,234],{color:'#b05d2d',dash:true})+label(259,170,'h = '+F(height),'height')+path('M210 216L225 218V236',{color:'#b05d2d',width:2,dash:true});
  return s;
 }
 function composite(n){
  const lower=n===3?[[95,270],[300,270],[235,220]]:[[85,275],[275,275],[337,221],[147,221]],upper=lower.map(([x,y])=>[x,y-100]),apex=[211,42];
  const front=n===3?2:3;
  let s=path('M'+lower.map(p=>p.join(',')).join('L')+'Z',{fill:'#f5faf7',width:0});
  s+=path('M'+lower.slice(0,front).map(p=>p.join(',')).join('L'));
  s+=path('M'+lower.slice(front-1).concat([lower[0]]).map(p=>p.join(',')).join('L'),{dash:true,color:'#8da99a'});
  lower.forEach((p,i)=>{s+=line(p,upper[i],{dash:i===lower.length-1});});
  s+=path('M'+upper.slice(0,front).map(p=>p.join(',')).join('L'),{color:'#a66a37'});
  s+=path('M'+upper.slice(front-1).concat([upper[0]]).map(p=>p.join(',')).join('L'),{color:'#a66a37',dash:true});
  upper.forEach((p,i)=>{s+=line(p,apex,{dash:i===upper.length-1});});
  return s;
 }
 function tank(litres,factor,after,depth){
  const top=270-100*(after?factor:1);
  let s=path('M95 55V270H305V55',{fill:'#f9fcfa'})+path(`M96 ${top}H304V269H96Z`,{fill:'#d9edf6',color:'#5e9db6',width:2});
  if(after)s+=path('M171 234H235L257 215H193ZM171 234V259H235V234M235 259L257 240V215',{fill:'#b6c6c5',color:'#526c6b',width:2});
  s+=line([327,270],[327,top],{color:'#b05d2d',dash:true})+label(361,(270+top)/2+8,depth!==undefined?F(depth)+' см':after?F(factor)+'h':'h',depth!==undefined?'water-depth':after?'level-factor':undefined);
  s+=label(200,305,after?'Та же вода и деталь':F(litres)+' л воды',after?undefined:'litres');
  return s;
 }
 function supports(t){return !!t&&ids.has(t.id);}
 // A saved exam has its own pinned condition. Project only its authored givens;
 // the lesson's model may also hold the answer or intermediate results.
 function condition(t){
  const p=t.params, m=t.model;
  let givens;
  switch(t.id){
   case 'grid': case 'practical': if(m)givens={a:m.a,b:m.b};break;
   case 'triangle': if(m)givens=p?.perimeter===undefined?{base:2*m.a,side:m.b}:{base:p.base,perimeter:p.perimeter};break;
   case 'quadrilateral': case 'box': if(m)givens={a:m.a,b:m.b,h:m.h};break;
   case 'pyramid': if(m)givens={a:m.a,h:m.h};break;
   case 'circle': if(m)givens={r:m.r,d:m.d};break;
   case 'roundbody': if(m)givens={body:m.body,a:m.a,...(m.body==='sphere'?{}:{h:m.h})};break;
   case 'scale': if(Number.isSafeInteger(t.seed))givens={volume:27*(2+t.seed%7)};break;
   case 'practice-free-area': if(p)givens={a:p.a,b:p.b,c:p.c};break;
   case 'practice-fence': if(p)givens={a:p.a,b:p.b,g:p.g};break;
   case 'practice-spokes': if(p)givens=p.gaps===undefined?{n:p.n}:{n:p.n,between:p.gaps-1};break;
   case 'practice-faces': if(p)givens={n:p.n};break;
   case 'practice-triangle-angle': if(p)givens={a:p.a,b:p.b};break;
   case 'practice-diameter-chord': if(p)givens={r:p.r,chord:p.chord};break;
   case 'practice-displacement': if(p)givens=p.before===undefined?{litres:p.litres,factor:p.factor}:{litres:p.litres,before:p.before,after:p.after};break;
   case 'practice-pour': if(p)givens={ratio:p.ratio,oldH:p.oldH};break;
   case 'practice-joined-surface': if(p)givens=p.width===undefined?{a:p.a}:{width:p.width,baseHeight:p.baseHeight,upperWidth:p.upperWidth,raise:p.raise,depth:p.depth};break;
   case 'practice-cone-area': if(p)givens={r:p.r,l:p.l,ratio:p.ratio};break;
   case 'practice-pyramid-lateral': if(p)givens=p.perimeter===undefined?{n:p.n,side:10*p.s,edge:13*p.s}:{n:p.n,perimeter:p.perimeter,edge:p.edge};break;
   case 'practice-box-diagonal': if(p)givens={a:p.a,b:p.b,d:p.d};break;
   case 'practice-similar-volume': if(p)givens=p.height===undefined?{factor:p.factor,small:p.small}:{height:p.height,smallHeight:p.smallHeight,whole:p.whole};break;
  }
  return givens&&Object.entries(givens).every(([key,value])=>key==='body'?['cylinder','cone','sphere'].includes(value):Number.isFinite(value))
   ? {kind:'geometry-figure',figure:t.id,givens} : null;
 }
 function visual(t){
  if(!supports(t))return '';
  const d=t.display?.kind==='geometry-figure'?t.display:condition(t);
  if(d?.figure!==t.id)return '';
  const p=d.givens,id=t.id;let figures=[],note='Чертёж схематический. На нём подписаны только данные условия.';
  switch(id){
   case 'box':figures=[figure('Закрытая коробка',box(p))];break;
   case 'roundbody':{
    if(p.body==='sphere')figures=[figure('Шар',`<circle cx="210" cy="164" r="112" fill="#edf6f0" stroke="#216e56" stroke-width="3"/>`+ring(210,164,112,28,{kind:'sphere-equator',width:2})+`<g data-hidden="true" data-stereo-aux="radius">${line([210,164],[322,164],{color:'#b05d2d',dash:true})}</g>`+`<circle cx="210" cy="164" r="3" fill="#173e3c"/>`+label(266,149,'r = '+F(p.a),'radius'))];
    else figures=[figure(p.body==='cone'?'Конус':'Цилиндр',p.body==='cone'?cone({radius:p.a,height:p.h}):cylinder({radius:'r = '+F(p.a),height:p.h}))];break;
   }
   case 'pyramid':figures=[figure('Пирамида с квадратным основанием',pyramid(4,p.a,undefined,p.h))];break;
   case 'scale':figures=[figure('Сечение параллельно основанию',cone({cut:1/3,wholeVolume:p.volume,ratio:3}))];note+=' h — высота малого конуса, H — высота большого. Измерять длины по экрану не нужно.';break;
   case 'practice-displacement':{
    const factor=p.factor??p.after/p.before;
    figures=[figure('До погружения',tank(p.litres,factor,false,p.before)),figure('После погружения',tank(p.litres,factor,true,p.after))];
    note+=' Схема вертикального сечения бака. Деталь целиком под водой; вода не вылилась.';break;
   }
   case 'practice-pour':figures=[figure('Первый цилиндр',cylinder({radius:'r',height:p.oldH,water:true,radiusSize:100/p.ratio})),figure('Второй цилиндр',cylinder({radius:F(p.ratio)+'r',unknown:true}))];note+=' Воду переливают полностью. Радиус второго основания указан относительно первого.';break;
   case 'practice-joined-surface':
    if(p.width===undefined){figures=[figure('Два куба, склеенные целыми гранями',box({a:p.a,b:p.a,h:p.a},true))];note+=' Рыжим отмечены линии соединения кубов.';}
    else figures=[figure('Ступенчатое тело из двух призм',steppedBox(p))];
    break;
   case 'practice-faces':figures=[figure(nName(p.n)+' и пирамида',composite(p.n))];note+=' Рыжим отмечены рёбра соединения. Соседние внешние грани не лежат в одной плоскости.';break;
   case 'practice-cone-area':{const r2=p.r*p.ratio,l2=p.l*2,unitScale=Math.min(108/r2,228/Math.max(Math.sqrt(p.l*p.l-p.r*p.r),Math.sqrt(l2*l2-r2*r2)));figures=[figure('Первый конус',cone({radius:p.r,slant:p.l,unitScale})),figure('Второй конус',cone({radius:r2,slant:l2,unitScale}))];note+=' l — образующая конуса. Оба конуса показаны в одном масштабе.';break;}
   case 'practice-pyramid-lateral':{
    let body=pyramid(p.n,p.side,p.edge);
    if(p.perimeter!==undefined)body+=label(210,333,'P основания = '+F(p.perimeter)+' см','perimeter');
    figures=[figure('Правильная '+(p.n===6?'шестиугольная':'четырёхугольная')+' пирамида',body)];break;
   }
   case 'practice-box-diagonal':figures=[figure('Диагональ боковой грани',box({a:p.a,b:p.b,d:p.d},false,true))];note+=' Выделенная диагональ лежит в грани с ребром '+F(p.a)+'. Высота пока неизвестна.';break;
   case 'practice-similar-volume':{
    const cut=p.height===undefined?{cut:1/p.factor,smallVolume:p.small,ratio:p.factor}:{cut:p.smallHeight/p.height,wholeVolume:p.whole,levels:{small:p.smallHeight,whole:p.height}};
    figures=[figure('Малый и большой конусы',cone(cut))];
    note+=p.height===undefined?' h — высота малого конуса, H — высота большого. Плоскость сечения параллельна основанию.':' Плоскость сечения параллельна основанию.';break;
   }
  }
  return `<div class="stereo-figures" data-stereo-task="${E(id)}"><div style="display:flex;flex-wrap:wrap;gap:16px;align-items:start">${figures.join('')}</div><p class="muted">${E(note)}</p></div>`;
 }
 function nName(n){return n===3?'Треугольная призма':'Прямоугольный параллелепипед';}
 root.PathStereoFigures=Object.freeze({supports,visual,condition});
 // Six current families use a step-plan model. Add their diagram while leaving
 // the plan controller, semantic state and persistence callback unchanged.
 if(root.PathModels){const previous=root.PathModels.mount;root.PathModels.mount=function(el,t,options){
  if(!supports(t)||t.model.kind!=='plan')return previous(el,t,options);
  el.innerHTML=visual(t)+'<div data-stereo-plan></div>';
  const session=previous(el.querySelector('[data-stereo-plan]'),t,options);el.pathModel=session;return session;
 };}
 if(typeof module!=='undefined')module.exports=root.PathStereoFigures;
})(typeof window==='undefined'?globalThis:window);
