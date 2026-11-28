(function(root){
 'use strict';
 const G=root.GeoMath;
 const names=['A','B','C','D'];
 const bound=name=>name==='D'?9:3;
 const coords=p=>'('+p.x+'; '+p.y+')';
 const component=(end,start)=>end+' − '+(start<0?'('+start+')':start)+' = '+(end-start);
 class VectorBoard extends G.Board {
  constructor(){
   super({points:[[-2,-1],[1,1],[-1,2],[1,3]].map(([x,y],i)=>({id:names[i],kind:'free',x,y})),objects:[]});
  }
  goal(){
   const [a,b,c,d]=names.map(id=>this.point(id));
   const ok=b.x-a.x===d.x-c.x&&b.y-a.y===d.y-c.y;
   return {ok,message:ok?'Оба смещения совпали. Векторы равны.':'Сравни отдельно смещение вправо или влево и смещение вверх или вниз.'};
  }
  setCoordinates(id,x,y){
   if(!names.includes(id)||![x,y].every(v=>Number.isInteger(v)&&Math.abs(v)<=bound(id)))return false;
   const point=this.point(id);
   if(point.x===x&&point.y===y)return false;
   this.remember();
   Object.assign(point,{x,y});
   return true;
  }
 }

 const plotExtent=points=>Math.max(4,...points.map(p=>Math.max(Math.abs(p.x),Math.abs(p.y))));
 function draw(canvas,points){
  const ctx=canvas.getContext('2d');
  const width=640,height=420;
  const extent=plotExtent(points);
  const scale=175/extent,origin={x:width/2,y:height/2};
  const pos=({x,y})=>({x:origin.x+scale*x,y:origin.y-scale*y});
  const segment=(a,b,color,lineWidth=1,dash=[])=>{
   ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dash);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
  };
  const label=(value,p,color='#304b59')=>{ctx.fillStyle=color;ctx.fillText(value,p.x,p.y);};
  function arrow(a,b,color){
   const u=G.sub(b,a),length=G.norm(u);
   if(!length){ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(a.x,a.y,8,0,2*Math.PI);ctx.stroke();return;}
   segment(a,b,color,4);
   const dir=G.unit(u),head=G.sub(b,G.mul(dir,Math.min(13,length/2))),normal=G.mul(G.rot(dir),5);
   ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(head.x+normal.x,head.y+normal.y);
   ctx.lineTo(head.x-normal.x,head.y-normal.y);ctx.closePath();ctx.fill();
  }
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,width,height);
  ctx.font='16px sans-serif';
  for(let n=-extent;n<=extent;n++){
   const x=pos({x:n,y:0}).x,y=pos({x:0,y:n}).y;
   segment({x,y:25},{x,y:height-25},'#dce2df');segment({x:105,y},{x:width-105,y},'#dce2df');
   if(n!==0&&(extent<=5||n%2===0)){
    label(String(n),{x:x-8,y:origin.y+17});label(String(n),{x:origin.x+5,y:y-3});
   }
  }
  arrow({x:105,y:origin.y},{x:width-105,y:origin.y},'#526677');
  arrow({x:origin.x,y:height-15},{x:origin.x,y:15},'#526677');
  label('x',{x:width-100,y:origin.y+8});label('y',{x:origin.x+12,y:18});
  label('0',{x:origin.x-14,y:origin.y+17});
  const colors=['#1d5792','#ad511d'];
  for(const [i,start] of [0,2].entries()){
   const a=pos(points[start]),b=pos(points[start+1]),corner={x:b.x,y:a.y};
   segment(a,corner,colors[i],2,[5,4]);segment(corner,b,colors[i],2,[5,4]);
   arrow(a,b,colors[i]);
  }
  const labels=new Map();
  for(const p of points){
   const key=coords(p);
   const group=labels.get(key)||{point:p,ids:[]};group.ids.push(p.id);labels.set(key,group);
  }
  ctx.font='bold 18px sans-serif';
  for(const {point,ids} of labels.values()){
   const p=pos(point),text=ids.join('=');
   ctx.fillStyle='#223846';ctx.beginPath();ctx.arc(p.x,p.y,3,0,2*Math.PI);ctx.fill();
   ctx.strokeStyle='#fffdf7';ctx.lineWidth=3;ctx.strokeText(text,p.x+6,p.y-8);label(text,{x:p.x+6,y:p.y-8});
  }
 }

 function mount(el,spec,onChange){
  const board=new VectorBoard();
  el.innerHTML='<div class="canvas-wrap"><canvas width="640" height="420" tabindex="0" aria-label="Векторы AB и CD на координатной плоскости. Стрелками можно двигать выбранную точку. Координаты приведены под рисунком."></canvas></div>'+
   '<div class="lab-readout" aria-live="polite"></div>'+
   '<p>Выбери точку и нажми на нужный узел сетки. Можно ввести координаты или использовать стрелки на чертеже.</p><form class="row"><label>Точка <select>'+names.map(id=>'<option>'+id+'</option>').join('')+'</select></label>'+
   '<label>x <input type="number" required step="1"></label><label>y <input type="number" required step="1"></label>'+
   '<button>Передвинуть</button></form><div class="row"><button type="button" data-vector-check>Проверить перенос</button>'+
   '<button type="button" data-vector-undo>Отменить</button></div><p class="lab-feedback" role="status"></p>';
  const canvas=el.querySelector('canvas'),form=el.querySelector('form'),select=form.querySelector('select');
  const [xInput,yInput]=form.querySelectorAll('input'),feedback=el.querySelector('.lab-feedback');
  select.value='D';
  function fields(){
   const p=board.point(select.value);
   for(const [input,value] of [[xInput,p.x],[yInput,p.y]]){
    input.min=-bound(p.id);input.max=bound(p.id);input.value=value;
   }
  }
  function redraw(){
   if(!names.every(id=>{const p=board.point(id);return p&&[p.x,p.y].every(v=>Number.isInteger(v)&&Math.abs(v)<=bound(id));}))board.reset();
   const points=names.map(id=>board.point(id));
   draw(canvas,points);fields();
   const readout=el.querySelector('.lab-readout');
   readout.replaceChildren();
   for(const [start,end] of [[points[0],points[1]],[points[2],points[3]]]){
    const row=document.createElement('p');
    row.textContent=start.id+coords(start)+' → '+end.id+coords(end)+'. По x: '+component(end.x,start.x)+'. По y: '+component(end.y,start.y)+'.';
    readout.appendChild(row);
   }
   el.querySelector('[data-vector-undo]').disabled=!board.history.length;
  }
  select.onchange=fields;
  function moveTo(x,y){
   const id=select.value;
   if(Math.abs(x)>bound(id)||Math.abs(y)>bound(id)){
    feedback.textContent='Для точки '+id+' выбери координаты от −'+bound(id)+' до '+bound(id)+'.';
    return;
   }
   if(board.setCoordinates(id,x,y)){redraw();feedback.textContent='';onChange({type:'move',moved:true,board});}
  }
  form.onsubmit=e=>{
   e.preventDefault();
   if(form.reportValidity())moveTo(xInput.valueAsNumber,yInput.valueAsNumber);
  };
  canvas.onclick=e=>{
   const rect=canvas.getBoundingClientRect(),scale=175/plotExtent(names.map(id=>board.point(id)));
   const x=Math.round(((e.clientX-rect.left)*640/rect.width-320)/scale);
   const y=Math.round((210-(e.clientY-rect.top)*420/rect.height)/scale);
   moveTo(x,y);
  };
  canvas.onkeydown=e=>{
   const step={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowDown:[0,-1],ArrowUp:[0,1]}[e.key];
   if(step){e.preventDefault();const p=board.point(select.value);moveTo(p.x+step[0],p.y+step[1]);}
  };
  el.querySelector('[data-vector-check]').onclick=()=>{
   const result=board.goal();
   feedback.textContent=result.message;feedback.className='lab-feedback '+(result.ok?'good':'error');
   onChange({type:result.ok?'goal':'goal-attempt',moved:false,board});
  };
  el.querySelector('[data-vector-undo]').onclick=()=>{
   if(board.undo()){redraw();feedback.textContent='';onChange({type:'undo',moved:false,board});}
  };
  redraw();
  return {board,redraw,destroy(){},highlight(){}};
 }
 root.GeoVectorComponents={mount,VectorBoard};
})(window);
