/* Exam-like variants use the original generators, answer checkers and progress keys. */
(function(global){
'use strict';
const doc=global.document, V=global.PracticalVariant;
if(!V)return;
const q=(s,r=doc)=>r.querySelector(s), all=(s,r=doc)=>Array.from(r.querySelectorAll(s));
const decimal=n=>String(Math.round(n*1000)/1000).replace('.',',');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const node=html=>V.html(html), button=(label,run)=>{const b=V.el('button',label,'pv-button');b.type='button';b.addEventListener('click',run);return b;};
function select(label,items,value,run){const box=V.el('label',null,'pv-subtype'),span=V.el('span',label),input=V.el('select');items.forEach(([v,t])=>{const o=V.el('option',t);o.value=v;input.append(o);});input.value=value;input.addEventListener('change',()=>run(input.value));box.append(span,input);return box;}
function text(markup){const tmp=V.el('div');tmp.innerHTML=markup||'';return tmp.textContent;}
function scrollFigure(svg,label){const figure=V.el('figure',null,'pv-figure');const wrap=V.el('div',null,'pv-figure-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',label);wrap.append(node(svg));figure.append(wrap,V.el('figcaption','На узком экране прокручивай рисунок в сторону.'));return figure;}
function fractionMarkup(markup){return String(markup||'').replace(/\b1\/(\d+(?:<sup>[^<]+<\/sup>)?|√2)/g,'<span class="pm-fraction"><span>1</span><span>$1</span></span>');}
function roomFigure(a,b,h,door){
 const scale=48, x=95,y=225, ax=a*scale, bx=b*scale*.65, by=b*scale*.34, hy=h*scale, width=Math.max(470,x+ax+bx+75),height=Math.max(300,y+65);
 const doorSize=door?String(door).match(/\d+(?:[,.]\d+)?/g)?.map(n=>+n.replace(',','.')):null;
 const doorShape=doorSize?`<rect x="${x+bx+ax*.12}" y="${y-by-doorSize[1]*scale}" width="${doorSize[0]*scale}" height="${doorSize[1]*scale}" fill="#f9f4e9" stroke="#29483c" stroke-width="2"/>`:'';
 const p=(X,Y)=>X.toFixed(2)+','+Y.toFixed(2), A=p(x,y),B=p(x+ax,y),C=p(x+ax+bx,y-by),D=p(x+bx,y-by),At=p(x,y-hy),Bt=p(x+ax,y-hy),Ct=p(x+ax+bx,y-by-hy),Dt=p(x+bx,y-by-hy);
 return `<svg class="pv-room-diagram" viewBox="0 0 ${width} ${height}" style="min-width:470px" role="img" aria-label="Парная: длина ${decimal(a)} м, ширина ${decimal(b)} м, высота ${decimal(h)} м" data-room-a="${a}" data-room-b="${b}" data-room-h="${h}" xmlns="http://www.w3.org/2000/svg"><g stroke="#29483c" stroke-width="2.5" stroke-linejoin="round"><polygon points="${A} ${B} ${C} ${D}" fill="#f5eddc"/><polygon points="${D} ${C} ${Ct} ${Dt}" fill="#e2eee7"/><polygon points="${B} ${C} ${Ct} ${Bt}" fill="#d0e3d8"/><path d="M${At} L${A} M${At} L${Bt} M${At} L${Dt}" fill="none" stroke-dasharray="6 5"/>${doorShape}</g><g fill="#173c2d" font-family="sans-serif" font-size="20"><text x="${x+ax/2}" y="${y+35}" text-anchor="middle">${decimal(a)} м</text><text x="${x+ax+bx+12}" y="${y-by/2+15}">${decimal(b)} м</text><text x="${x-16}" y="${y-hy/2}" text-anchor="end">${decimal(h)} м</text>${door?`<text x="${x}" y="${height-12}">Дверь: ${esc(door)} м. Окон нет.</text>`:''}</g></svg>`;
}
function arcFigure(kind,a,b){
 const half=kind==='rect'?a/2:a/2, radius=kind==='rect'?Math.hypot(half,b):(half*half+b*b)/(2*b), rise=kind==='rect'?radius-b:b;
 const k=Math.min(260/(2*half),245/radius),cx=190,cy=300,r=radius*k,ey=kind==='rect'?cy-b*k:cy-(radius-b)*k,ty=cy-r,left=cx-half*k,right=cx+half*k;
 const body=`<path d="M${left} ${ey} A${r} ${r} 0 0 1 ${right} ${ey}" fill="none" stroke="#176747" stroke-width="4"/><path d="M${left} ${ey}H${right}" fill="none" stroke="#506b60" stroke-width="2"/><path d="M${left} ${ey}L${cx} ${cy}L${cx} ${ty}" fill="none" stroke="#506b60" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${cx}" cy="${cy}" r="4" fill="#173c2d"/>`;
 const dimensions=kind==='rect'?`<path d="M${left} ${ey}V${cy}H${right}V${ey}" fill="none" stroke="#506b60" stroke-width="2"/><text x="${cx}" y="${cy+29}" text-anchor="middle">Ширина ${decimal(a)} см</text><text x="${left-10}" y="${(ey+cy)/2}" text-anchor="end">${decimal(b)} см</text>`:`<path d="M${cx+12} ${ey}V${ty}" fill="none" stroke="#a95613" stroke-width="3"/><text x="${cx+23}" y="${(ey+ty)/2+6}">h = ${decimal(b)} см</text><text x="${cx}" y="${ey+28}" text-anchor="middle">w = ${decimal(a)} см</text>`;
 return `<svg class="pv-arc-diagram" viewBox="0 0 440 350" style="min-width:440px" data-arc-kind="${kind}" data-width="${a}" data-height="${b}" data-arc-radius="${radius}" data-arc-rise="${rise}" role="img" aria-label="Дуга окружности и её центр. Даны ширина ${decimal(a)} см и высота ${decimal(b)} см; радиус требуется найти" xmlns="http://www.w3.org/2000/svg">${body}<g fill="#173c2d" font-family="sans-serif" font-size="20">${dimensions}<text x="${cx+12}" y="${cy+2}">${kind==='rect'?'C':'O'}</text><text x="${(left+cx)/2-15}" y="${(ey+cy)/2-6}">R</text></g></svg>`;
}

V.register('stoves',function(){
 const roots=[q('.wrap'),q('.topnav')].filter(Boolean),sets=[[[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]],[[2,3],[2,4],[2,5]],[[3,0],[3,1]]];
 let records=[],selected=[0,0,0,0,0],serial=0;
 const make=(g,t,fresh,seed=global.PracticalBoard?.seed())=>({g,t,seed,fresh,spec:global.PracticalBoard?global.PracticalBoard.seeded(seed,()=>GROUPS[g].tasks[t].gen(fresh)):GROUPS[g].tasks[t].gen(fresh),draft:{},passed:false});
 function ensure(slot){const [g,t]=sets[slot][selected[slot]];const key=g+':'+t;return records[slot][key]||(records[slot][key]=make(g,t,false));}
 function check(rec,values){
  state.g=rec.g;state.t=rec.t;state.current=rec.spec;renderCard(rec.spec);
  if(rec.spec.match)all('#task-card .stove-select').forEach((s,i)=>s.value=values['match'+i]||'');else q('#answer-input').value=values.answer||'';
  q('#check-btn').click();const feedback=q('#feedback'),ok=feedback.classList.contains('correct');rec.passed=rec.passed||ok;rec.draft={...values};return rec.result={ok,html:feedback.innerHTML};
 }
 function card(slot){
  const rec=ensure(slot),s=rec.spec,condition=V.el('div');condition.append(node(s.prompt.replace('в карточках печей выше','в общей таблице печей')));
  if(s.givens)condition.append(node('<div class="pv-givens">'+s.givens+'</div>'));
  if(rec.g===1){const tmp=node('<div>'+s.givens+'</div>'),vals=all('.g',tmp).map(e=>text(e.querySelector('.v')?.innerHTML).replace(',','.'));condition.append(scrollFigure(roomFigure(parseFloat(vals[0]),parseFloat(vals[1]),rec.t===1?ROOM.c:parseFloat(vals[2]),rec.t===2?vals[3]?.replace('.',','):null),'Размеры парной для этой задачи'));}
  if(rec.g===3){const nums=text(s.prompt).match(/\d+(?:[,.]\d+)?/g).map(Number);condition.append(scrollFigure(arcFigure(rec.t===0?'rect':'sag',nums[0],nums[1]),'Арка кожуха — дуга окружности'));}
  if(rec.g===1&&rec.t===2)condition.append(V.el('p','Окон в парной нет.'));
  const fields=s.match?s.match.map((r,i)=>({key:'match'+i,label:r.label+' — номер печи',value:rec.draft['match'+i]||'',type:'select',options:[['','Выбери номер'],...s.options.map(o=>[o.v,o.t])]})):[{key:'answer',label:(s.meta.split('·').pop().trim())+(s.unit?' ('+s.unit+')':''),value:rec.draft.answer||''}];
  const c=V.question({id:'stoves-'+slot+'-'+serial,number:slot+1,page:'stoves',title:s.meta,condition,fields,helpType:s.meta,helpNative:()=>'<ol>'+s.hint.map(x=>'<li>'+x+'</li>').join('')+'</ol><details><summary>Полный разбор</summary>'+s.solution.map(x=>'<p>'+x+'</p>').join('')+'</details>',onDraft:values=>{rec.draft={...values};rec.result=null;},check:values=>check(rec,values),status:rec.result});
  c.dataset.prototype=rec.g+':'+rec.t;c.prepend(select('Другой вопрос №'+(slot+1),sets[slot].map(([g,t],i)=>[String(i),GROUPS[g].tasks[t].short]),String(selected[slot]),value=>{selected[slot]=+value;if(global.OgeCourseSharedMode)records[slot]={};c.replaceWith(card(slot));}));
  if(s.regen)c.append(button('Другие числа для этого вопроса',()=>{const [g,t]=sets[slot][selected[slot]];records[slot][g+':'+t]=make(g,t,true);c.replaceWith(card(slot));}));
  return c;
 }
 function render(fresh){serial++;if(fresh){records=sets.map(()=>({}));selected=selected.map((x,i)=>(x+1)%sets[i].length);}
  if(!records.length)records=sets.map(()=>({}));
  const controls=V.el('div');controls.append(button('Новый вариант',()=>render(true)));
  const table='<table><caption>Характеристики печей</caption><thead><tr><th>№</th><th>Тип</th><th>Объём парной, м³</th><th>Масса, кг</th><th>Цена, руб.</th><th>Кабель, руб.</th></tr></thead><tbody>'+STOVES.map(s=>`<tr><th>${s.n}</th><td>${s.kind}</td><td>${decimal(s.vmin)}–${decimal(s.vmax)}</td><td>${s.mass}</td><td>${s.price}</td><td>${s.install}</td></tr>`).join('')+'</tbody></table>';
  const visual=scrollFigure(roomFigure(ROOM.a,ROOM.b,ROOM.c,ROOM.doorW+' × '+ROOM.doorH),'Парное отделение из общего условия');
  V.mount({title:'Печь для бани · задания 1–5',condition:'<p>Хозяин выбирает печь для парного отделения без окон. Длина парной — 3,6 м, ширина — 2 м, высота — 2,2 м. Дверь имеет размеры 0,7 × 1,8 м. Характеристики трёх печей приведены в таблице. Для электрической печи требуется установка кабеля стоимостью 5400 рублей; дровяные печи дополнительной установки не требуют.</p><p>Если в отдельном вопросе указаны другие размеры, используй размеры из этого вопроса. Они подписаны на его рисунке.</p>',visual,tables:node(table),controls,questions:sets.map((_,i)=>card(i)),nativeRoots:roots});
 }
 render(false);
 const B=global.PracticalBoard;
 B?.register({id:'practice-1-5-stoves',get:()=>({selected:selected.slice(),items:sets.map((_,i)=>{const r=ensure(i);return{seed:r.seed,fresh:r.fresh};})}),
 valid:d=>B.exact(d,['selected','items'])&&Array.isArray(d.selected)&&d.selected.length===5&&d.selected.every((v,i)=>Number.isInteger(v)&&v>=0&&v<sets[i].length)&&Array.isArray(d.items)&&d.items.length===5&&d.items.every(r=>B.exact(r,['seed','fresh'])&&B.uint(r.seed)&&typeof r.fresh==='boolean'),
 describe:d=>sets.map((_,i)=>{const[g,t]=sets[i][d.selected[i]],s=B.seeded(d.items[i].seed,()=>GROUPS[g].tasks[t].gen(d.items[i].fresh));return B.description(B.kind('stoves',s.meta,text(s.prompt)+(s.givens?text(s.givens):'')),s.match?Object.fromEntries(s.match.map((_,j)=>['match'+j,['',...s.options.map(o=>String(o.v))]])):{answer:null},4,g===1||g===3?1:0);}),
 set:d=>{selected=d.selected.slice();records=sets.map((_,i)=>{const[g,t]=sets[i][selected[i]];return{[g+':'+t]:make(g,t,d.items[i].fresh,d.items[i].seed)};});state.solved=new Set();state.streak=0;render(false);}});
});

V.register('paper-sheets',function(){
 const roots=[q('body>.wrap')].filter(Boolean),sets=[[0],[1],[2],[3,5],[4]];let records=[],selected=[0,0,0,0,0],serial=0;
 function make(index,seed=global.PracticalBoard?.seed()){return{index,seed,spec:global.PracticalBoard?global.PracticalBoard.seeded(seed,()=>TYPES[index].make()):TYPES[index].make(),draft:{},solved:false};}
 function ensure(slot){const index=sets[slot][selected[slot]];return records[slot][index]||(records[slot][index]=make(index));}
 function check(rec,values){state.typeIdx=rec.index;state.inst=rec.spec;state.instSolved=rec.solved;renderTask();if(rec.spec.kind==='match'){q('#matchAns').value=values.answer||'';}else q('#numAns').value=values.answer||'';onCheck();rec.solved=state.instSolved;const fb=q('#feedback');rec.draft={...values};return rec.result={ok:fb.classList.contains('ok'),html:fractionMarkup(fb.innerHTML)};}
 function card(slot){const rec=ensure(slot),s=rec.spec,condition=V.el('div');condition.append(node(s.promptHTML));
  if(s.kind==='match')condition.append(node('<table><caption>Размеры листов для задания 1</caption><thead><tr><th>Номер листа</th><th>Длина, мм</th><th>Ширина, мм</th></tr></thead><tbody>'+s.sheets.map(row=>`<tr><th>${row.id}</th><td>${row.long}</td><td>${row.short}</td></tr>`).join('')+'</tbody></table>'));
  const label=s.kind==='match'?'Номера листов подряд в порядке '+s.order.join(', '):s.typeId==='count'?'Количество листов (шт.)':s.typeId==='area'?'Площадь листа ('+s.unit+')':s.typeId==='mass'?'Масса пачки ('+s.unit+')':'Отношение, округлённое до десятых';
  const c=V.question({id:'paper-'+slot+'-'+serial,number:slot+1,page:'paper-sheets',title:TYPE_LABELS[s.typeId],condition,fields:[{key:'answer',label,value:rec.draft.answer||''}],helpType:s.typeId,helpNative:()=>fractionMarkup(s.hintHTML+'<details><summary>Полный разбор</summary>'+s.solveHTML+'</details>'),check:values=>check(rec,values),onDraft:values=>{rec.draft={...values};rec.result=null;},status:rec.result});c.dataset.prototype=s.typeId;
  if(sets[slot].length>1)c.prepend(select('Другой вопрос №'+(slot+1),sets[slot].map((idx,i)=>[String(i),TYPE_LABELS[TYPES[idx].id]]),String(selected[slot]),value=>{selected[slot]=+value;if(global.OgeCourseSharedMode)records[slot]={};c.replaceWith(card(slot));}));
  c.append(button('Другие числа для этого вопроса',()=>{records[slot][rec.index]=null;c.replaceWith(card(slot));}));return c;
 }
 function paperDiagram(){let current={x:50,y:40,w:490,h:490/Math.SQRT2},pieces=[];for(let n=1;n<=6;n++){const r={...current};if(r.w>=r.h){r.w/=2;current={x:r.x+r.w,y:r.y,w:r.w,h:r.h};}else{r.h/=2;current={x:r.x,y:r.y+r.h,w:r.w,h:r.h};}pieces.push({...r,n});}pieces.push({...current,n:6});return '<svg class="pv-paper-diagram" viewBox="0 0 620 430" style="min-width:620px" role="img" aria-label="Лист А0, последовательно разделённый пополам на А1–А6" xmlns="http://www.w3.org/2000/svg"><text x="50" y="25" font-size="22" fill="#173c2d">А0 — весь прямоугольник</text>'+pieces.map((r,i)=>`<rect data-paper-format="${r.n}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${['#e7f2eb','#d9eade','#c5dfce','#b1d3bd','#98c5a9','#7eb493'][Math.min(r.n-1,5)]}" stroke="#29483c" stroke-width="2"/><text x="${r.x+r.w/2}" y="${r.y+r.h/2+7}" text-anchor="middle" font-size="22" fill="#173c2d">А${r.n}</text>`).join('')+'</svg>';}
 function render(fresh){serial++;if(fresh||!records.length)records=sets.map(()=>({}));const controls=V.el('div');controls.append(button('Новый вариант',()=>render(true)));
  const sizes='<table><caption>Размеры форматов, мм</caption><thead><tr><th>Формат</th><th>Длина</th><th>Ширина</th></tr></thead><tbody>'+ISO.slice(0,7).map((f,i)=>`<tr><th>А${i}</th><td>${f.long}</td><td>${f.short}</td></tr>`).join('')+'</tbody></table>';
  V.mount({title:'Форматы бумаги · задания 1–5',condition:'<p>Лист А0 — прямоугольник площадью 1 м². Каждый следующий формат получают, разрезая предыдущий пополам параллельно его короткой стороне. Все форматы подобны. Размеры в миллиметрах округляют вниз до целого числа; при вычислении площади и массы используй модель А0 = 1 м².</p>',visual:scrollFigure(paperDiagram(),'Деление листа А0'),tables:node(sizes),controls,questions:sets.map((_,i)=>card(i)),nativeRoots:roots});
 }
 render(false);
 const B=global.PracticalBoard;
 B?.register({id:'practice-1-5-paper-sheets',get:()=>({selected:selected.slice(),seeds:sets.map((_,i)=>ensure(i).seed)}),
 valid:d=>B.exact(d,['selected','seeds'])&&Array.isArray(d.selected)&&d.selected.length===5&&d.selected.every((v,i)=>Number.isInteger(v)&&v>=0&&v<sets[i].length)&&Array.isArray(d.seeds)&&d.seeds.length===5&&d.seeds.every(B.uint),
 describe:d=>sets.map((_,i)=>{const index=sets[i][d.selected[i]],s=B.seeded(d.seeds[i],()=>TYPES[index].make());return B.description(B.kind('paper-sheets',s.typeId,text(s.promptHTML)),{answer:null},4);}),
 set:d=>{selected=d.selected.slice();records=sets.map((_,i)=>{const index=sets[i][selected[i]];return{[index]:make(index,d.seeds[i])};});render(false);}});
});

V.register('tariffs',function(){
 const roots=[q('body>.wrap')].filter(Boolean),types=['match','bill','count','percent','switch'];let records=[],serial=0;
 function activate(i){q('#task-tabs').children[i].click();}
 function snapshot(){records=[];for(let i=0;i<5;i++){activate(i);records.push({html:q('#task-q').innerHTML,unit:q('#answer-area .unit')?.textContent||'',draft:{answer:q('#in').value},answered:q('#in').disabled,feedback:q('#fb').innerHTML,ok:q('#fb').classList.contains('good')});}activate(0);}
 function check(i,values){activate(i);const input=q('#in');if(!input.disabled){input.value=values.answer||'';q('#check-btn').click();}const fb=q('#fb'),ok=fb.classList.contains('good');records[i].answered=input.disabled;records[i].feedback=fb.innerHTML;records[i].ok=ok;records[i].draft={...values};return{ok,html:fb.innerHTML||'Введи ответ перед проверкой.',locked:input.disabled};}
 function graph(){const svg=V.clone(q('#graph'));svg.classList.add('pv-tariff-diagram');svg.setAttribute('role','img');svg.setAttribute('aria-label','Расход минут и гигабайтов по месяцам: минуты — левая шкала, гигабайты — правая');svg.style.minWidth='760px';svg.style.width='100%';svg.setAttribute('viewBox','-16 -28 720 386');all('text',svg).forEach(t=>{t.setAttribute('font-size','18');t.setAttribute('font-weight','600');if(['мин','ГБ'].includes(t.textContent.trim()))t.setAttribute('y','-2');});const figure=scrollFigure(svg.outerHTML,'График расхода услуг связи');figure.prepend(V.el('p','Сплошная синяя линия — минуты, левая шкала. Пунктирная фиолетовая — гигабайты, правая шкала. Внизу — номера месяцев.'));return figure;}
 function calculations(){return node('<table><caption>Твой черновик расходов за год</caption><thead><tr><th>Месяц</th><th>Минуты</th><th>ГБ</th><th>Стандартный, руб.</th><th>Новый, руб.</th></tr></thead><tbody>'+Array.from({length:12},(_,i)=>'<tr><th>'+(i+1)+'</th>'+['минуты','ГБ','расходы на стандартном тарифе','расходы на новом тарифе'].map((label,j)=>'<td><input class="pv-calculation" inputmode="decimal" aria-label="Месяц '+(i+1)+': '+label+'" data-month="'+(i+1)+'" data-column="'+j+'"></td>').join('')+'</tr>').join('')+'</tbody></table>');}
 function render(fresh){if(fresh)q('#newvar-btn').click();serial++;snapshot();const controls=V.el('div');controls.append(button('Новый вариант',()=>render(true)),V.el('span',q('#vnum').textContent));
  const questions=records.map((r,i)=>V.question({id:'tariffs-'+i+'-'+serial,number:i+1,page:'tariffs',condition:r.html,fields:[{key:'answer',label:i===0?'Номера месяцев подряд в порядке столбцов таблицы':i===2?'Количество месяцев':i===4?'Абонентская плата выбранного тарифа (руб.)':r.unit==='%'?'Изменение в процентах (%)':'Ответ ('+r.unit+')',value:r.draft.answer}],helpType:types[i],status:r.answered?{ok:r.ok,html:r.feedback,locked:true}:null,check:values=>check(i,values),onDraft:values=>{r.draft={...values};activate(i);if(!q('#in').disabled)q('#in').value=values.answer||'';}}));questions.forEach((c,i)=>c.dataset.prototype=types[i]);
  V.mount({title:'Тарифы · задания 1–5',condition:'<p>На графике показан расход минут и мобильного интернета по месяцам за 2019 год.</p>'+q('.rules').innerHTML,visual:graph(),tables:calculations(),controls,questions,nativeRoots:roots});
 }
 render(false);
 const B=global.PracticalBoard;
 B?.register({id:'practice-1-5-tariffs',calculations:48,...global.PracticalNativeVariant,set:d=>{global.PracticalNativeVariant.set(d);render(false);}});
});
})(window);
