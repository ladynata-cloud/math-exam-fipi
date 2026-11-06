(function(root){'use strict';const C=root.LogCourseCore,E=C.E,esc=E.escapeHTML;
function bounds(p){return {xmin:p.h-2,xmax:p.h+Math.max(6,p.a+2,1/p.a+2),ymin:p.k-3.5,ymax:p.k+3.5};}
function render(svg,p,points=[],curve=true){const b=bounds(p),X=x=>48+(x-b.xmin)/(b.xmax-b.xmin)*528,Y=y=>340-(y-b.ymin)/(b.ymax-b.ymin)*310;let s='<defs><clipPath id="'+svg.id+'-clip"><rect x="48" y="30" width="528" height="310"/></clipPath></defs>';
for(let x=Math.ceil(b.xmin);x<=b.xmax;x++){s+=`<path d="M${X(x)} 30V340" stroke="#dce7df"/><text x="${X(x)}" y="360" font-size="16" text-anchor="middle" fill="#466158">${x}</text>`;}
for(let y=Math.ceil(b.ymin);y<=b.ymax;y++){s+=`<path d="M48 ${Y(y)}H576" stroke="#dce7df"/><text x="35" y="${Y(y)+5}" font-size="16" text-anchor="end" fill="#466158">${y}</text>`;}
if(0>=b.xmin&&0<=b.xmax)s+=`<path d="M${X(0)} 30V340" stroke="#627d70" stroke-width="2"/>`;
if(0>=b.ymin&&0<=b.ymax)s+=`<path d="M48 ${Y(0)}H576" stroke="#627d70" stroke-width="2"/>`;
s+='<text x="580" y="365" font-size="16">x</text><text x="18" y="22" font-size="16">y</text>';
if(curve){s+=`<path data-asymptote d="M${X(p.h)} 30V340" stroke="#bc712b" stroke-width="2" stroke-dasharray="6 5"/><text x="${X(p.h)+7}" y="22" font-size="15" fill="#97551c">x = ${p.h}</text>`;let d='';
// Sample by y, so the curve approaches the asymptote without artificial segments across it.
for(let i=0;i<=400;i++){const y=b.ymin+(b.ymax-b.ymin)*i/400,x=p.h+p.a**(y-p.k);d+=(i?'L':'M')+X(x).toFixed(2)+' '+Y(y).toFixed(2);}
s+=`<path data-curve d="${d}" clip-path="url(#${svg.id}-clip)" stroke="#14664d" stroke-width="3" fill="none"/>`;}
for(const [x,y] of points)s+=`<g data-point><circle cx="${X(x)}" cy="${Y(y)}" r="6" fill="#14664d" stroke="white" stroke-width="2"/><text x="${X(x)+9}" y="${Y(y)-10}" fill="#183c36" font-size="16">${esc('('+E.formatNumber(x)+'; '+E.formatNumber(y)+')')}</text></g>`;
svg.innerHTML=s;svg.setAttribute('aria-label',`Логарифмический график, основание ${E.formatNumber(p.a)}, сдвиги ${p.h} и ${p.k}. Отмечено точек: ${points.length}.`);}
function coordinates(svg,event,p){const r=svg.getBoundingClientRect(),b=bounds(p),sx=(event.clientX-r.left)*600/r.width,sy=(event.clientY-r.top)*380/r.height;if(sx<48||sx>576||sy<30||sy>340)return null;return [Math.round((b.xmin+(sx-48)/528*(b.xmax-b.xmin))*4)/4,Math.round((b.ymin+(340-sy)/310*(b.ymax-b.ymin))*4)/4];}
root.LogCoursePlot={render,coordinates};})(window);
