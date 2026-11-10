/* Exact shared learning diagrams; geometric grids use one scale on both axes. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.FoundationRouteVisuals=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function figure(v){
 if(!v)return'';
 const caption=E(v.caption||''),base='<figure class="question-model">',end=(body)=>base+body+(caption?'<figcaption>'+caption+'</figcaption>':'')+'</figure>';
 if(v.type==='table')return end('<div class="table-wrap"><table><thead><tr>'+v.headers.map(x=>'<th scope="col">'+E(x)+'</th>').join('')+'</tr></thead><tbody>'+v.rows.map(row=>'<tr>'+row.map(x=>'<td>'+E(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');
 if(v.type==='bars'){const max=Math.max(...v.values,1);return end('<div class="bar-model" aria-label="Диаграмма">'+v.values.map((x,i)=>'<div class="bar-row"><span>'+E(v.labels[i])+'</span><div class="bar-track"><span style="width:'+Math.max(0,x/max*100)+'%"></span></div><b>'+E(x)+(v.unit?' '+E(v.unit):'')+'</b></div>').join('')+'</div>');}
 const svg=(body,canvasHeight=210)=>'<svg viewBox="0 0 320 '+canvasHeight+'" role="img" aria-label="'+E(v.label||'Модель к текущему условию')+'">'+body+'</svg>';
 if(v.type==='graph'){
  const xmin=Number(v.xmin),xmax=Number(v.xmax),ymin=Number(v.ymin),ymax=Number(v.ymax),step=Number(v.step)||1;
  if(![xmin,xmax,ymin,ymax,step].every(Number.isFinite)||xmax<=xmin||ymax<=ymin||step<=0||(xmax-xmin)/step>30||(ymax-ymin)/step>30)return'';
  const plotHeight=Math.max(148,Math.min(300,(ymax-ymin)/step*14)),canvasHeight=plotHeight+62,unit=Math.min(245/(xmax-xmin),plotHeight/(ymax-ymin)),width=(xmax-xmin)*unit,height=(ymax-ymin)*unit,left=42+(245-width)/2,top=27+(plotHeight-height)/2,bottom=top+height,right=left+width,xEvery=Math.max(1,Math.ceil((xmax-xmin)/step/12)),yEvery=Math.max(1,Math.ceil((ymax-ymin)/step/16));
  const x=n=>left+(n-xmin)*unit,y=n=>bottom-(n-ymin)*unit;let grid='',labels='';
  for(let n=Math.ceil(xmin/step)*step;n<=xmax;n+=step){grid+='<line x1="'+x(n)+'" x2="'+x(n)+'" y1="'+top+'" y2="'+bottom+'" class="graph-grid"/>';if(Math.round(n/step)%xEvery===0)labels+='<text x="'+x(n)+'" y="'+(bottom+19)+'" text-anchor="middle">'+E(Number(n.toFixed(4)))+'</text>';}
  for(let n=Math.ceil(ymin/step)*step;n<=ymax;n+=step){grid+='<line x1="'+left+'" x2="'+right+'" y1="'+y(n)+'" y2="'+y(n)+'" class="graph-grid"/>';if(Math.round(n/step)%yEvery===0)labels+='<text x="'+(left-9)+'" y="'+(y(n)+4)+'" text-anchor="end">'+E(Number(n.toFixed(4)))+'</text>';}
  if(xmin<=0&&xmax>=0)grid+='<line x1="'+x(0)+'" x2="'+x(0)+'" y1="'+(top-7)+'" y2="'+(bottom+6)+'" class="model-axis"/>';
  if(ymin<=0&&ymax>=0)grid+='<line x1="'+(left-6)+'" x2="'+(right+8)+'" y1="'+y(0)+'" y2="'+y(0)+'" class="model-axis"/>';
  const within=(a,b)=>Number.isFinite(a+b)&&a>=xmin&&a<=xmax&&b>=ymin&&b<=ymax;
  const lines=(v.segments||[]).filter(s=>within(s.x1,s.y1)&&within(s.x2,s.y2)).map(s=>'<line x1="'+x(s.x1)+'" y1="'+y(s.y1)+'" x2="'+x(s.x2)+'" y2="'+y(s.y2)+'" class="graph-segment"/>').join('');
  const points=(v.points||[]).filter(p=>within(p.x,p.y)).map(p=>'<circle cx="'+x(p.x)+'" cy="'+y(p.y)+'" r="4" class="model-point"/>'+(p.label?'<text x="'+(x(p.x)+7)+'" y="'+(y(p.y)-8)+'">'+E(p.label)+'</text>':'')).join('');
  return end(svg(grid+lines+points+labels+'<text x="'+(right+17)+'" y="'+(bottom+19)+'">x</text><text x="'+(left-24)+'" y="'+(top-9)+'">y</text>',canvasHeight));
 }
 if(v.type==='numberLine'){
  const min=Number(v.min),max=Number(v.max);if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min)return'';
  let step=Number(v.step)||1;if(step<=0)return'';if((max-min)/step>60)step=Math.ceil((max-min)/15);const x=n=>26+(n-min)/(max-min)*268,labelEvery=Math.max(1,Math.ceil((max-min)/step/12));let ticks='',tick=0;
  for(let n=min;n<=max+step/1000;n+=step,tick++){ticks+='<line x1="'+x(n)+'" x2="'+x(n)+'" y1="98" y2="112" class="model-tick"/>'+(tick%labelEvery===0?'<text x="'+x(n)+'" y="134" text-anchor="middle">'+E(Number(n.toFixed(6)))+'</text>':'');}
  const points=(v.points||[]).filter(p=>p.value>=min&&p.value<=max).map((p,i)=>'<circle cx="'+x(p.value)+'" cy="105" r="6" class="model-point"/><text x="'+x(p.value)+'" y="'+(75-i%2*23)+'" text-anchor="middle">'+E(p.label??p.value)+'</text>').join('');
  return end(svg('<path d="M20 105H302l-7-5m7 5l-7 5" class="model-axis"/>'+ticks+points));
 }
 if(v.type==='fraction'){
  const parts=Number(v.parts),shaded=Number(v.shaded);if(!Number.isInteger(parts)||parts<1||parts>100||!Number.isInteger(shaded)||shaded<0)return'';
  const wholes=Math.max(1,Math.ceil(shaded/parts)),rows=Math.min(wholes,5);let s='';
  for(let row=0;row<rows;row++)for(let j=0;j<parts;j++)s+='<rect x="'+(20+j*280/parts)+'" y="'+(25+row*145/rows)+'" width="'+(280/parts)+'" height="'+(Math.min(70,130/rows))+'" class="'+(row*parts+j<shaded?'part-filled':'part-empty')+'"/>';
  return end(svg(s)) ;
 }
 if(v.type==='array'){
  const rows=Number(v.rows),cols=Number(v.columns);if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>30||cols>30)return'';
  const size=Math.min(260/cols,160/rows,28),left=(320-cols*size)/2,top=(210-rows*size)/2;let s='';
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)s+='<rect x="'+(left+c*size+2)+'" y="'+(top+r*size+2)+'" width="'+(size-4)+'" height="'+(size-4)+'" rx="3" class="part-filled"/>';
  return end(svg(s));
 }
 if(v.type==='rectangle'){
  const w=Number(v.width),h=Number(v.height);if(!(w>0&&h>0&&Number.isFinite(w+h)))return'';
  const scale=Math.min(220/w,120/h),x=(320-w*scale)/2,y=(175-h*scale)/2;
  return end(svg('<rect x="'+x+'" y="'+y+'" width="'+(w*scale)+'" height="'+(h*scale)+'" class="part-filled"/><text x="160" y="'+(y+h*scale+26)+'" text-anchor="middle">'+E(v.width)+' '+E(v.unit||'')+'</text><text x="'+Math.max(15,x-12)+'" y="'+(y+h*scale/2)+'" text-anchor="end">'+E(v.height)+'</text>'));
 }
 if(v.type==='angle'){
  const deg=Number(v.degrees);if(!(deg>0&&deg<=180))return'';const rad=deg*Math.PI/180,x=150+120*Math.cos(rad),y=175-120*Math.sin(rad),ax=150+37*Math.cos(rad),ay=175-37*Math.sin(rad);
  let protractor='';if(v.protractor){protractor='<path d="M250 175A100 100 0 0 0 50 175" class="model-tick" fill="none"/>';for(let t=0;t<=180;t+=5){const a=t*Math.PI/180,r=t%10===0?90:95;protractor+='<line x1="'+(150+r*Math.cos(a))+'" y1="'+(175-r*Math.sin(a))+'" x2="'+(150+100*Math.cos(a))+'" y2="'+(175-100*Math.sin(a))+'" class="model-tick"/>';if(t%30===0)protractor+='<text x="'+(150+110*Math.cos(a))+'" y="'+(179-110*Math.sin(a))+'" text-anchor="middle" font-size="11">'+t+'</text>';}}
  return end(svg(protractor+'<path d="M270 175H150L'+x+' '+y+'" class="model-axis"/><path d="M187 175A37 37 0 0 0 '+ax+' '+ay+'" class="angle-arc"/><text x="142" y="199">O</text>'));
 }
 return'';
}
return{figure};
});
