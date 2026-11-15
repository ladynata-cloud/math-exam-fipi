(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const width=360,height=280;
function bounds(p){return {minX:p.minX??-5,maxX:p.maxX??5,minY:p.minY??-6,maxY:p.maxY??6};}
function plotBox(b){
 const xSpan=b.maxX-b.minX,ySpan=b.maxY-b.minY,scale=Math.min(290/xSpan,220/ySpan);
 const left=185-xSpan*scale/2,top=135-ySpan*scale/2;
 return {scale,left,top,right:left+xSpan*scale,bottom:top+ySpan*scale};
}
function count(p){return p.kind==='parabola'?3:2;}
function yValue(p,x){return p.kind==='parabola'?(x-p.h)**2+p.k:p.k*x+p.b;}
function validPoints(points,p){const b=bounds(p);return Array.isArray(points)&&points.length<=count(p)&&points.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isInteger)&&q[0]>=b.minX&&q[0]<=b.maxX&&q[1]>=b.minY&&q[1]<=b.maxY);}
function correct(points,p){return validPoints(points,p)&&points.length===count(p)&&new Set(points.map(q=>q[0])).size===points.length&&points.every(q=>Math.abs(q[1]-yValue(p,q[0]))<1e-8);}
function interpolate(points,x){return points.reduce((sum,q,i)=>sum+q[1]*points.reduce((v,r,j)=>i===j?v:v*(x-r[0])/(q[0]-r[0]),1),0);}
function render(task,state){
 const p=task.plot;if(!p||!['line','parabola'].includes(p.kind))return '';
 const b=bounds(p),{scale,left,top,right,bottom}=plotBox(b);
 const pts=validPoints(state.plotPoints,p)?state.plotPoints:[],needed=count(p);
 const x=v=>left+(v-b.minX)*scale,y=v=>top+(b.maxY-v)*scale;
 let svg='';
 for(let i=b.minX;i<=b.maxX;i++)svg+=`<path d="M${x(i)} ${top}V${bottom}" stroke="${i===0?'#748e69':'#d9e5d0'}" stroke-width="${i===0?1.5:.6}"/><text x="${x(i)}" y="${bottom+18}" text-anchor="middle" font-size="10" fill="#65746a">${i}</text>`;
 for(let i=b.minY;i<=b.maxY;i++)svg+=`<path d="M${left} ${y(i)}H${right}" stroke="${i===0?'#748e69':'#d9e5d0'}" stroke-width="${i===0?1.5:.6}"/><text x="${left-10}" y="${y(i)+3}" text-anchor="end" font-size="10" fill="#65746a">${i}</text>`;
 const distinct=new Set(pts.map(q=>q[0])).size===pts.length;
 if(pts.length===needed&&distinct){
  let path='';
  for(let i=0;i<=100;i++){const xx=b.minX+(b.maxX-b.minX)*i/100,yy=interpolate(pts,xx);path+=`${i?'L':'M'}${x(xx).toFixed(3)} ${y(yy).toFixed(3)}`;}
  svg+=`<g clip-path="url(#plot-clip)"><path data-user-curve="true" d="${path}" stroke="#176848" stroke-width="2.5" fill="none"/></g>`;
 }
 for(const q of pts)svg+=`<circle cx="${x(q[0])}" cy="${y(q[1])}" r="5" fill="#176848" stroke="white" stroke-width="2"/>`;
 const noun=p.kind==='parabola'?'параболу':'прямую';
 let message=`Отметь ${needed===3?'три':'две'} точки с разными x. Нажми на сетку или введи координаты.`;
 if(pts.length&&pts.length<needed)message=`Отмечено ${pts.length} из ${needed} точек. Продолжай построение.`;
 const ok=correct(pts,p);
 if(pts.length===needed)message=ok?'Построение верно: выбранные точки лежат на заданном графике.':!distinct?'Абсциссы совпали. Выбери точки с разными x.':'Одна из точек не подходит. Подставь её x в формулу и проверь y.';
 const coord=pts.length?pts.map(q=>'('+q.join('; ')+')').join(', '):'пока не выбраны';
 const equation=p.kind==='parabola'?`y = (x ${p.h<0?'+ '+Math.abs(p.h):'− '+p.h})² ${p.k<0?'− '+Math.abs(p.k):'+ '+p.k}`:`y = ${p.k}x ${p.b<0?'− '+Math.abs(p.b):'+ '+p.b}`;
 const rectangle=`x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"`;
 return `<details class="plot-lab"><summary>Построить ${noun} на сетке</summary><p>Задача: ${equation}. ${p.kind==='parabola'?'Удобно начать с вершины и двух симметричных точек.':'Выбери две точки с разными абсциссами.'}</p><svg id="interactive-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="Координатная сетка. Точки можно вводить в полях ниже." data-plot-task="${esc(task.id)}"><defs><clipPath id="plot-clip"><rect ${rectangle}/></clipPath></defs><rect ${rectangle} fill="#fafcf7"/>${svg}<text x="${right+10}" y="${bottom+18}" font-size="12" fill="#176848">x</text><text x="${left-12}" y="${top-10}" font-size="12" fill="#176848">y</text></svg><p class="plot-message ${ok?'ok':''}" role="status">${esc(message)}</p><div class="plot-inputs"><label>x <input id="plot-x" type="number" min="${b.minX}" max="${b.maxX}" step="1" aria-label="Координата x"></label><label>y <input id="plot-y" type="number" min="${b.minY}" max="${b.maxY}" step="1" aria-label="Координата y"></label><button type="button" data-action="plot-add" class="btn small secondary">Добавить точку</button><button type="button" data-action="plot-clear" class="text-btn">Очистить</button></div><p class="format-help">Точки: ${esc(coord)}. Построение дополняет шаги и не даёт отдельных баллов.</p></details>`;
}
function point(event,svg,p){
 const b=bounds(p),{scale,left,top,right,bottom}=plotBox(b);
 const rect=svg.getBoundingClientRect(),displayScale=Math.min(rect.width/width,rect.height/height);
 if(!displayScale)return null;
 const sx=(event.clientX-rect.left-(rect.width-width*displayScale)/2)/displayScale;
 const sy=(event.clientY-rect.top-(rect.height-height*displayScale)/2)/displayScale;
 if(sx<left||sx>right||sy<top||sy>bottom)return null;
 return [Math.round(b.minX+(sx-left)/scale),Math.round(b.maxY-(sy-top)/scale)];
}
root.VPRPlot={render,point,bounds,validPoints,count,yValue,correct,interpolate};
})(typeof window!=='undefined'?window:globalThis);
if(typeof module!=='undefined')module.exports=globalThis.VPRPlot;
