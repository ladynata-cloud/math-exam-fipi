(function (root) {
  'use strict';
  const lessonIds = ['eq-linear','eq-rational','eq-quadratic','eq-root','expr-powers','expr-roots','expr-fractions','expr-logarithms'];
  const ids = lessonIds.flatMap(id => Array.from({length:6},(_,i)=>id+'-'+(i+1)));
  const NS='http://www.w3.org/2000/svg';
  const fmt = value => {
    if (Number.isInteger(value)) return String(value).replace('-', '−');
    if (Math.abs(value*100-Math.round(value*100))<1e-9) return String(Math.round(value*100)/100).replace('.',',').replace('-','−');
    for(let d=2;d<=1000;d++) if(Math.abs(value*d-Math.round(value*d))<1e-9) return String(Math.round(value*d)).replace('-','−')+'/'+d;
    return String(value).replace('.',',').replace('-','−');
  };
  function sceneFor(task, context={}) {
    const earned = context.mode==='guided' ? Math.max(0,Math.min(task.steps.length,Number(context.completed)||0)) : context.solved ? task.steps.length : 0;
    const stage=earned ? task.diagram.stages[earned-1] : [task.diagram.left,task.diagram.right];
    return {left:stage[0],right:stage[1],earned,domain:(task.diagram.domains||[]).filter(d=>earned>=d.after).at(-1)||null,parts:task.diagram.parts};
  }
  function render(container,task,context={}) {
    const doc=container.ownerDocument;
    const scene=sceneFor(task,context);
    const box=doc.createElement('div');box.className='equation-task-model';
    const svg=doc.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 440 '+(scene.domain?244:168));
    svg.setAttribute('width','100%');svg.setAttribute('role','img');svg.setAttribute('data-equation-view',task.id);
    svg.setAttribute('aria-label',(scene.earned?'Полученная запись: ':'Запись из условия: ')+scene.left+(scene.right!==null?' = '+scene.right:''));
    svg.style.display='block';svg.style.maxWidth='100%';
    const add=(tag,attrs,text)=>{const e=doc.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=text;svg.append(e);return e;};
    add('rect',{x:8,y:16,width:424,height:112,rx:14,fill:'#f1f6fa',stroke:'#ccdae5'});
    add('text',{x:24,y:44,fill:'#5b6e80','font-size':14,'font-family':'system-ui, sans-serif'},scene.earned?'После выполненного шага':'Запись из условия');
    const formula=scene.left+(scene.right!==null?' = '+scene.right:'');
    add('text',{x:220,y:87,'text-anchor':'middle',fill:'#17354f','font-size':Math.max(14,Math.min(26,660/formula.length)),'font-family':'system-ui, sans-serif','data-current-expression':''},formula);
    if(scene.domain){
      const d=scene.domain,x=220,y=191;
      add('text',{x:24,y:155,fill:'#334e68','font-size':16,'font-family':'system-ui, sans-serif'},'ОДЗ: x '+d.relation+' '+fmt(d.boundary));
      add('line',{x1:28,y1:y,x2:411,y2:y,stroke:'#65798b','stroke-width':2});
      add('path',{d:'M404 186 L412 191 L404 196',fill:'none',stroke:'#65798b','stroke-width':2});
      if(d.relation==='≠'){
        add('line',{x1:32,y1:y,x2:x-7,y2:y,stroke:'#1a7c71','stroke-width':5});
        add('line',{x1:x+7,y1:y,x2:402,y2:y,stroke:'#1a7c71','stroke-width':5});
      }else add('line',{x1:d.relation==='≥'?x:32,y1:y,x2:d.relation==='≥'?402:x,y2:y,stroke:'#1a7c71','stroke-width':5});
      add('circle',{cx:x,cy:y,r:6,fill:d.relation==='≠'?'white':'#1a7c71',stroke:'#1a7c71','stroke-width':2,'data-domain-boundary':d.relation});
      add('text',{x,y:218,'text-anchor':'middle',fill:'#17354f','font-size':16,'font-family':'system-ui, sans-serif'},fmt(d.boundary));
      add('text',{x:418,y:197,fill:'#65798b','font-size':14},'x');
    }
    box.append(svg);
    const independent=context.mode==='independent'&&!context.solved;
    const closedLabel=independent?'Показать подсказку к записи':'Показать части записи';
    const button=doc.createElement('button');button.type='button';button.className='button quiet model-toggle';button.textContent=closedLabel;button.setAttribute('aria-pressed','false');
    const parts=doc.createElement('div');parts.hidden=true;parts.style.marginTop='12px';parts.style.lineHeight='1.6';parts.setAttribute('data-expression-parts','');
    task.diagram.parts.forEach(text=>{const p=doc.createElement('p');p.style.margin='4px 0';p.textContent=text;parts.append(p);});
    button.onclick=()=>{
      const on=button.getAttribute('aria-pressed')!=='true';
      if(on&&independent&&typeof context.onHelp==='function')context.onHelp();
      button.setAttribute('aria-pressed',String(on));button.textContent=on?'Скрыть подсказку':closedLabel;parts.hidden=!on;
    };
    box.append(button,parts);container.replaceChildren(box);
    return()=>{button.onclick=null;};
  }
  const taskModels=root.ProfileTaskModels=root.ProfileTaskModels||{};
  ids.forEach(id=>{taskModels[id]=render;});
  const lessonModels=root.ProfileModels=root.ProfileModels||{};
  lessonIds.forEach(id=>{lessonModels[id]=container=>{const lesson=(root.ProfileLessons||[]).find(l=>l.id===id);return lesson?render(container,lesson.tasks[0],{mode:'independent',solved:false}):()=>{};};});
  if(typeof module!=='undefined'&&module.exports)module.exports={lessonIds,ids,sceneFor,render};
})(typeof globalThis!=='undefined'?globalThis:window);
