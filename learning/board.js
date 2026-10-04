(function(root){
  'use strict';
  class LearningDrawing{
    constructor(host,{readOnly=false,actorId=null,color='#23352d',onStroke,onErase}={}){
      this.host=host;this.readOnly=readOnly;this.actorId=actorId;this.color=color;this.width=3;this.tool='pen';this.strokes=[];this.draft=null;this.onStroke=onStroke;this.onErase=onErase;this.canvas=document.createElement('canvas');this.canvas.tabIndex=readOnly?-1:0;this.canvas.setAttribute('aria-label','Лист для решения. Рисуйте мышью или пером планшета.');host.append(this.canvas);
      this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',e=>this.move(e));this.canvas.addEventListener('pointerup',e=>this.up(e));this.canvas.addEventListener('pointercancel',e=>this.up(e));this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(host);this.draw();
    }
    point(e){const r=this.canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))};}
    mine(stroke){return stroke.author===this.actorId||stroke.actor?.id===this.actorId||stroke.author?.id===this.actorId||stroke.actorId===this.actorId;}
    down(e){if(this.readOnly||e.button!==0)return;e.preventDefault();const p=this.point(e);if(this.tool==='eraser'){const hit=[...this.strokes].reverse().find(s=>this.mine(s)&&s.points.some(v=>Math.hypot(v.x-p.x,v.y-p.y)<.035));if(hit)this.onErase?.(hit.id);return;}this.draft={id:crypto.randomUUID(),color:this.color,width:this.width,points:[p]};this.canvas.setPointerCapture(e.pointerId);this.draw();}
    move(e){if(!this.draft)return;e.preventDefault();if(this.draft.points.length<500)this.draft.points.push(this.point(e));this.draw();}
    up(e){if(!this.draft)return;e.preventDefault();const stroke=this.draft;this.draft=null;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.onStroke?.(stroke);this.draw();}
    update(strokes,{readOnly=this.readOnly}={}){this.strokes=strokes||[];this.readOnly=readOnly;this.canvas.tabIndex=readOnly?-1:0;this.draw();}
    draw(){const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(root.devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(this.canvas.width!==w)this.canvas.width=w;if(this.canvas.height!==h)this.canvas.height=h;const c=this.canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,r.width,r.height);c.lineJoin='round';c.lineCap='round';for(const s of [...this.strokes,...(this.draft?[this.draft]:[])]){if(!s.points?.length)continue;c.strokeStyle=s.color;c.fillStyle=s.color;c.lineWidth=s.width;c.beginPath();s.points.forEach((p,i)=>i?c.lineTo(p.x*r.width,p.y*r.height):c.moveTo(p.x*r.width,p.y*r.height));if(s.points.length===1){c.arc(s.points[0].x*r.width,s.points[0].y*r.height,s.width/2,0,Math.PI*2);c.fill();}else c.stroke();}}
    destroy(){this.observer.disconnect();this.canvas.remove();this.draft=null;}
  }
  root.LearningDrawing=LearningDrawing;
})(window);
