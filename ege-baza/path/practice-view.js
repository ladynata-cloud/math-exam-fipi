(function(root){'use strict';
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=PathData.F;
function table(headers,rows,caption='Данные задачи'){
 return `<div class="scroll"><table class="task-table"><caption>${E(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${E(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i?`<td>${E(v)}</td>`:`<th scope="row">${E(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function chart(d){
 const lo=Math.min(0,...d.values),hi=Math.max(1,...d.values),span=hi-lo||1,n=d.values.length;
 const X=i=>65+i*460/Math.max(1,n-1),Y=v=>255-(v-lo)/span*205;
 let g='';for(let i=0;i<=4;i++){let v=lo+span*i/4,y=Y(v);g+=`<path d="M48 ${y}H552" stroke="#dbe5dd"/><text x="42" y="${y+5}" text-anchor="end">${E(F(v))}</text>`;}
 if(d.kind==='bars')g+=d.values.map((v,i)=>`<rect x="${X(i)-18}" y="${Math.min(Y(v),Y(0))}" width="36" height="${Math.abs(Y(0)-Y(v))||1}" fill="#216e56"/><text x="${X(i)}" y="${Y(v)-10}" text-anchor="middle">${E(F(v))}</text>`).join('');
 else g+=`<polyline points="${d.values.map((v,i)=>X(i)+','+Y(v)).join(' ')}" fill="none" stroke="#216e56" stroke-width="4"/>`+d.values.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="5" fill="#9d472b"/>`).join('');
 g+=d.labels.map((s,i)=>`<text x="${X(i)}" y="285" text-anchor="middle">${E(s)}</text>`).join('');
 return `<svg class="task-figure" viewBox="0 0 600 310" role="img" aria-label="${E(d.yLabel)}: график с точными данными в таблице ниже"><text x="50" y="25">${E(d.yLabel)}</text>${g}</svg><details class="equivalent-data"><summary>Точные значения графика в таблице</summary>${table(['Отметка',d.yLabel],d.labels.map((s,i)=>[s,F(d.values[i])]))}</details>`;
}
function polygon(d,construction=false){
 const xs=d.points.map(p=>p[0]),ys=d.points.map(p=>p[1]),w=Math.max(...xs),h=Math.max(...ys),scale=Math.min(450/(w||1),230/(h||1)),X=x=>60+x*scale,Y=y=>280-y*scale;let grid='';
 if(d.grid){for(let x=0;x<=w;x++)grid+=`<path d="M${X(x)} ${Y(0)}V${Y(h)}"/>`;for(let y=0;y<=h;y++)grid+=`<path d="M${X(0)} ${Y(y)}H${X(w)}"/>`;}
 return `<svg class="task-figure" viewBox="0 0 600 330" role="img" aria-label="Фигура на единичной сетке; координаты вершин приведены под рисунком"><g stroke="#c9d9ce" stroke-width="1">${grid}</g><polygon points="${d.points.map(([x,y])=>X(x)+','+Y(y)).join(' ')}" fill="#6caa8870" stroke="#185940" stroke-width="3"/>${construction?`<path d="M${X(0)} ${Y(0)}H${X(w)}V${Y(h)}H${X(0)}Z" fill="none" stroke="#a44629" stroke-width="3" stroke-dasharray="6"/>`:''}${d.points.map(([x,y],i)=>`<circle cx="${X(x)}" cy="${Y(y)}" r="4" fill="#185940"/><text x="${X(x)+8}" y="${Y(y)-9}">${'ABCDEF'[i]}</text>`).join('')}<text x="60" y="318">Сторона клетки = 1</text></svg><details><summary>Координаты вершин по порядку</summary><p>${d.points.map(([x,y],i)=>`${'ABCDEF'[i]}(${x}; ${y})`).join(', ')}</p></details>`;
}
function numberline(d){const lo=Math.floor(Math.min(...d.values))-1,hi=Math.ceil(Math.max(...d.values))+1,X=v=>45+(v-lo)/(hi-lo)*510;let s='';for(let n=lo;n<=hi;n++)s+=`<path d="M${X(n)} 110v12" stroke="#617a6b"/><text x="${X(n)}" y="150" text-anchor="middle">${n}</text>`;return `<svg class="task-figure" viewBox="0 0 600 180" role="img" aria-label="Точки расположены слева направо; интервалы приведены ниже"><path d="M30 116H565" stroke="#617a6b"/>${s}${d.values.map((v,i)=>`<circle cx="${X(v)}" cy="116" r="5" fill="#a44629"/><text x="${X(v)}" y="88" text-anchor="middle">${E(d.names[i])}</text>`).join('')}</svg><p class="muted">${d.values.map((v,i)=>`${d.names[i]}: ${Number.isInteger(v)?'ровно '+v:'между '+Math.floor(v)+' и '+Math.ceil(v)}`).join('; ')}.</p>`;}
function visual(t){if(t.model?.kind==='grade7-construction'&&root.PathGrade7Construction)return root.PathGrade7Construction.visual(t);if(t.model?.kind==='pre7-lab'&&root.PathPre7Models)return root.PathPre7Models.visual(t);if(t.model?.kind==='grade7-geometry'&&root.PathGrade7Geometry)return root.PathGrade7Geometry.visual(t);const d=t.display;if(!d)return '';if(d.kind==='table')return table(d.headers,d.rows);if(['bars','graph'].includes(d.kind))return chart(d);if(d.kind==='polygon')return polygon(d);if(d.kind==='numberline')return numberline(d);if(d.kind==='triangle-label')return `<svg class="task-figure" viewBox="0 0 600 320" role="img" aria-label="Прямоугольный треугольник ABC, прямой угол при C"><path d="M70 255H510L70 45Z" fill="#d5e9da" stroke="#216e56" stroke-width="3"/><path d="M70 235H90V255" fill="none" stroke="#216e56"/><text x="46" y="270">C</text><text x="517" y="265">A</text><text x="51" y="36">B</text><text x="270" y="285">${d.a}</text><text x="28" y="160">${d.b}</text><text x="300" y="140">${d.c}</text></svg><p class="muted">Чертёж схематический; размеры берём из условия.</p>`;return '';}
function answerChoices(item) {
 return Array.isArray(item?.choices) && item.choices.length && item.choices.every(choice => choice && typeof choice === 'object' && typeof choice.label === 'string' && typeof choice.value === 'string') ? item.choices : null;
}
function answerText(item) {
 const choices=answerChoices(item), value=String(item?.a ?? item?.answer);
 return choices?.find(choice=>choice.value===value)?.label ?? PathData.answerText(item);
}
// Authored plain text for a known choice or canonical finite number; checking stays in PathData.
function wrongFeedback(item,answer,fallback) {
 const input=String(answer).trim(),choices=answerChoices(item),map=item?.feedback;
 let value=input;
 if(choices){if(!choices.some(choice=>choice.value===value))return fallback;}
 else{const number=PathData.parse(input);if(!input||!Number.isFinite(number))return fallback;value=String(number);}
 if(!map||typeof map!=='object'||Array.isArray(map)||!Object.prototype.hasOwnProperty.call(map,value))return fallback;
 const text=map[value];
 return typeof text==='string'&&text.trim()&&text.length<=4000?text:fallback;
}
function answerForm(item,limit=4000) {
 const choices=answerChoices(item);
 if(choices)return `<form id="answerForm"><fieldset><legend>Твой ответ: выбери вариант</legend><input id="answer" type="hidden" value=""><div class="actions answer-choices">${choices.map((choice,index)=>`<button type="button" id="answer-choice-${index}" data-answer-choice="${E(choice.value)}" aria-pressed="false">${E(choice.label)}</button>`).join('')}</div></fieldset><button class="primary" type="submit">Проверить</button></form>`;
 const placeholder=item?.answerKind==='match'?'Четыре цифры, например 2413':item?.answerKind==='multi'?'Номера, например 134':item?.answerKind==='solutions'?'Любое подходящее число':'Число или дробь, например 2/3';
 return `<form id="answerForm"><label for="answer">Твой ответ</label><div class="actions"><input id="answer" maxlength="${limit}" autocomplete="off" placeholder="${placeholder}"><button class="primary" type="submit">Проверить</button></div></form>`;
}
function bindChoices(host,onChange) {
 const input=host.querySelector('#answer');if(!input)return;
 const buttons=[...host.querySelectorAll('[data-answer-choice]')];
 const draw=()=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.answerChoice===input.value)));
 buttons.forEach(button=>button.onclick=()=>{if(host.inert)return;input.value=button.dataset.answerChoice;draw();onChange(input.value);});draw();
}
function markup(t,omitVisual=false){return `<div class="task-support">${omitVisual?'':visual(t)}${t.labels?`<ol class="match-labels" type="A">${t.labels.map(x=>`<li>${E(x)}</li>`).join('')}</ol>`:''}${t.choices&&!answerChoices(t)?`<ol class="task-choices">${t.choices.map(x=>`<li>${E(x)}</li>`).join('')}</ol>`:''}</div>`;}
root.PathPracticeView={markup,visual,polygon,answerChoices,answerText,answerForm,bindChoices,wrongFeedback};
if(!root.PathModels)return;
const previous=PathModels.mount;
PathModels.mount=function(el,t,options={}){
 const m=t.model,session=PathModels.session(el,m.kind,options),v=session.value,changed=session.changed;
 if(m.kind==='fraction-bars'){
  const [num,den]=m.fractions[0];v.selected=v.selected||[];v.checked=!!v.checked;
  el.innerHTML=`<p>Построй ${num}/${den} одного целого. Выбирай доли кнопками — мышью, касанием или клавишей пробела.</p><div class="fraction-builder">${Array.from({length:den},(_,i)=>`<button aria-label="Доля ${i+1} из ${den}" aria-pressed="false" data-share="${i}">${i+1}</button>`).join('')}</div><button id="checkShares">Проверить модель</button><p id="modelFeedback" role="status"></p><p>Знаменатель сообщает, на сколько равных частей разделено целое. Числитель — сколько таких частей взято.</p>`;
  const draw=()=>{el.querySelectorAll('[data-share]').forEach(b=>b.setAttribute('aria-pressed',String(v.selected.includes(+b.dataset.share))));el.querySelector('#modelFeedback').textContent=!v.checked?'':v.checkedCount===num?`Построено верно: ${num} из ${den} равных долей.`:`Выбрано ${v.checkedCount} долей. Нужно ${num}; размер одной доли остаётся 1/${den}.`;};
  el.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>{const n=+b.dataset.share;v.selected=v.selected.includes(n)?v.selected.filter(x=>x!==n):[...v.selected,n];draw();changed();});
  el.querySelector('#checkShares').onclick=()=>{v.checked=true;v.checkedCount=v.selected.length;draw();changed();};draw();return session;
 }
 if(m.kind==='percent-base'){
  const part=m.whole*m.p/100;v.base=v.base||'';v.experiment=!!v.experiment;v.percent=v.percent??m.p;
  el.innerHTML=`<p>В этой модели ${m.p}% — это ${F(part)}. Какое число принимаем за 100%?</p><div class="actions"><button data-base="part">${F(part)}</button><button data-base="whole">${m.whole}</button></div><p id="baseFeedback" role="status"></p><div id="percentExperiment"></div>`;
  const draw=()=>{
   el.querySelector('#baseFeedback').textContent=!v.base?'':v.base==='whole'?'Верно: всё количество — 100%. Часть сравниваем с этим целым.':'Это только часть. Вопрос: каково всё количество, от которого взяты проценты?';
   if(v.experiment){el.querySelector('#percentExperiment').innerHTML=`<label>Процент <input id="percentSlide" type="range" min="0" max="100" value="${v.percent}" step="1"></label><div class="percent-bar"><span></span></div><p id="percentRead" aria-live="polite"></p>`;const show=()=>{el.querySelector('.percent-bar span').style.width=v.percent+'%';el.querySelector('#percentRead').textContent=`${v.percent}% от ${m.whole} = ${F(m.whole*v.percent/100)}. Целое остаётся тем же.`;};el.querySelector('#percentSlide').oninput=e=>{v.percent=+e.target.value;show();changed();};show();}
  };
  el.querySelectorAll('[data-base]').forEach(b=>b.onclick=()=>{v.base=b.dataset.base;if(v.base==='whole'){v.experiment=true;v.percent=m.p;}draw();changed();});draw();return session;
 }
 if(m.kind==='ratio-parts'){
  const n=m.a+m.b;v.chosen=v.chosen||[];v.checked=!!v.checked;
  el.innerHTML=`<p>Собери отношение ${m.a}:${m.b}. Первой группе нужны ${m.a} равных долей, второй — ${m.b}. Все ${n} долей составляют ${m.total}${m.unit?' '+E(m.unit):''}.</p><div class="fraction-builder">${Array.from({length:n},(_,i)=>`<button data-ratio="${i}" aria-pressed="false">${i+1}</button>`).join('')}</div><button id="checkRatio">Проверить первую группу</button><p id="ratioRead" role="status"></p>`;
  const draw=()=>{el.querySelectorAll('[data-ratio]').forEach(b=>b.setAttribute('aria-pressed',String(v.chosen.includes(+b.dataset.ratio))));el.querySelector('#ratioRead').textContent=!v.checked?'':v.checkedCount===m.a?`Первая группа ${m.a}/${n} целого. Одна доля — ${F(m.total/n)}${m.unit?' '+m.unit:''}. Теперь вычисли вторую группу.`:`Выбрано ${v.checkedCount}. Первой группе нужны ${m.a} долей из ${n}, а не из ${m.b}.`;};
  el.querySelectorAll('[data-ratio]').forEach(b=>b.onclick=()=>{const n=+b.dataset.ratio;v.chosen=v.chosen.includes(n)?v.chosen.filter(x=>x!==n):[...v.chosen,n];draw();changed();});el.querySelector('#checkRatio').onclick=()=>{v.checked=true;v.checkedCount=v.chosen.length;draw();changed();};draw();return session;
 }
 if(m.kind==='polygon-build'){
  v.constructed=!!v.constructed;v.choice=v.choice||'';
  el.innerHTML='<p>Выбери вспомогательное построение, которое помогает найти площадь.</p><div class="actions"><button id="auxRect">Достроить до прямоугольника</button><button id="auxDiagonal">Провести произвольную диагональ</button></div><div id="construction"></div><p id="constructionRead" role="status"></p>';
  const draw=()=>{el.querySelector('#construction').innerHTML=polygon(t.display,v.constructed);el.querySelector('#constructionRead').textContent=v.choice==='rectangle'?'Теперь можно вычесть лишние части. У параллелограмма их можно перенести, сохранив основание и высоту. Найди нужные длины по клеткам.':v.choice==='diagonal'?'Диагональ разделяет фигуру, но площади получившихся частей ещё нужно найти. Попробуй построение по линиям сетки.':'';};
  el.querySelector('#auxRect').onclick=()=>{v.constructed=true;v.choice='rectangle';draw();changed();};el.querySelector('#auxDiagonal').onclick=()=>{v.choice='diagonal';draw();changed();};draw();return session;
 }
 if(m.kind==='interval-signs'){
  const {a,b}=m;v.x=v.x??a;
  el.innerHTML=`<p>Проверь точки на промежутках и сами границы. Знаменатель x−${b} не может равняться нулю.</p><label>Проверяемая точка <input id="testPoint" type="range" min="${a-3}" max="${b+3}" step="0.5" value="${v.x}"></label><p id="pointRead" role="status"></p>`;
  const draw=()=>{const x=v.x,p=(x-a)*(x-b);el.querySelector('#pointRead').textContent=`x=${F(x)}. (x−${a})(x−${b}) ${p<0?'отрицательно':p>0?'положительно':'равно нулю'}. Дробь (x−${a})/(x−${b}) ${x===b?'не определена':(x-a)/(x-b)>0?'положительна':(x-a)/(x-b)<0?'отрицательна':'равна нулю'}.`;};el.querySelector('#testPoint').oninput=e=>{v.x=+e.target.value;draw();changed();};draw();return session;
 }
 if(m.kind==='digit-work'){
  v.digits=v.digits||[0,0,0,0];
  el.innerHTML=`<p>Собери четырёхзначное число и проверь все условия.</p><div class="digit-row">${Array.from({length:4},(_,i)=>`<label>Цифра ${i+1}<select data-place="${i}">${Array.from({length:10},(_,n)=>`<option>${n}</option>`).join('')}</select></label>`).join('')}</div><button id="checkDigits">Проверить число</button><p id="digitRead" role="status"></p>`;
  const draw=()=>{if(!v.checkedDigits)return;const s=v.checkedDigits.join(''),sum=v.checkedDigits.reduce((a,x)=>a+x,0),product=v.checkedDigits.reduce((a,x)=>a*x,1);el.querySelector('#digitRead').textContent=`${s}: сумма цифр ${sum}, произведение ${product}. ${s[0]==='0'?'Запись начинается с нуля, это не четырёхзначное число.':PathData.correct(t,s)?'Все условия выполнены. Возможны и другие ответы.':'Проверь делимость и ограничения на цифры.'}`;};
  el.querySelectorAll('[data-place]').forEach(input=>{input.value=v.digits[+input.dataset.place];input.onchange=()=>{v.digits[+input.dataset.place]=+input.value;changed();};});el.querySelector('#checkDigits').onclick=()=>{v.checkedDigits=[...v.digits];draw();changed();};draw();return session;
 }
 if(m.kind==='data-read'&&t.display){
  const d=t.display,labels=d.kind==='table'?d.rows.map(r=>r[0]):d.labels||d.names;v.item=v.item??null;
  el.innerHTML='<p>Выбери строку или отметку, чтобы прочитать её отдельно.</p><div class="actions" id="dataSelect"></div><p id="dataRead" role="status"></p>';
  const draw=()=>{const i=v.item;el.querySelector('#dataRead').textContent=i===null?'':d.kind==='table'?d.headers.map((h,j)=>h+': '+d.rows[i][j]).join('; '):labels[i]+': '+F(d.values[i]);};
  el.querySelector('#dataSelect').innerHTML=labels.map((label,i)=>`<button data-item="${i}">${E(label)}</button>`).join('');el.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{v.item=+b.dataset.item;draw();changed();});draw();return session;
 }
 if(m.kind==='statements'){
  v.open=v.open||[];el.innerHTML='<p>Для каждого утверждения попробуй построить контрпример. Если хотя бы один пример удовлетворяет условию и опровергает утверждение, оно не обязательно верно.</p>'+t.choices.map((s,i)=>`<details data-statement="${i}" ${v.open.includes(i)?'open':''}><summary>Проверяем: ${E(s)}</summary><p>${E(t.steps[i].why)}</p><p>${t.steps[i].a?'Следует из условия.':'Не обязательно верно. В условии недостаточно такой связи.'}</p></details>`).join('');
  el.querySelectorAll('details').forEach((d,i)=>d.ontoggle=()=>{const before=v.open.includes(i);if(before===d.open)return;v.open=d.open?[...v.open,i]:v.open.filter(x=>x!==i);changed();});return session;
 }
 return previous(el,t,options);
};
root.PathPracticeView={markup,visual,polygon,answerChoices,answerText,answerForm,bindChoices,wrongFeedback};
})(window);

/* Presentation only: the saved photo task and its answer values stay intact. */
(function(root){'use strict';
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function supports(task){return /^grade7-r-photo-proof-[123]$/.test(task?.id||'')&&task.params?.kind==='photo-proof'&&task.steps?.length===6&&task.steps.every(s=>Array.isArray(s.choices))&&!!root.PathGrade7Construction;}
function lesson(task){
 const cross=task.params.problem===3,sss=task.params.problem===2;
 const pair=cross?'△DFE и △HFG':'△ABC и △ADC',equal=cross?'△DFE = △HFG':'△ABC = △ADC';
 const first=cross?'DF = FH':sss?'AB = AD':'BC = CD';
 const second=cross?'EF = FG':sss?'BC = CD':'AC — общая сторона';
 const angles=cross?'∠DFE = ∠HFG':'∠BCA = ∠ACD';
 const law=sss?'По трём сторонам — третий признак.':'По двум сторонам и углу между ними — первый признак.';
 const reasons=[
  cross?'Рассмотрим верхний △DFE и нижний △HFG.':'Рассмотрим △ABC и △ADC. У них есть общая сторона.',
  first+' — по условию.',
  cross?'EF = FG — по условию.':sss?'BC = CD — по условию.':'AC входит и в △ABC, и в △ADC. Это одна и та же сторона.',
  sss?'AC входит в оба треугольника. Теперь есть три пары равных сторон.':cross?'Эти углы вертикальные, поэтому они равны. Каждый лежит между выбранными сторонами.':'Равенство углов дано. Они лежат между BC и AC, CD и AC.',
  law,
  equal+'. '+law
 ];
 return {
  title:sss?'Третий признак равенства треугольников':'Первый признак равенства треугольников',pair,equal,law,
  given:cross?'DF = FH, EF = FG. Точки D, F, H лежат на одной прямой; E, F, G — на другой.':sss?'AB = AD, BC = CD.':'BC = CD, ∠BCA = ∠ACD.',
  questions:[
   'Какие треугольники будем сравнивать?',
   sss?'Какие стороны отмечены двумя штрихами?':'Какие стороны отмечены одним штрихом?',
   cross?'Какие стороны отмечены двумя штрихами?':sss?'Какие стороны отмечены одним штрихом?':'Назови общую сторону треугольников ABC и ADC.',
   sss?'Назови общую сторону треугольников ABC и ADC.':'Почему '+angles+'?',
   'Какой признак равенства можно применить?',
   'Выбери запись равенства треугольников.'
  ],
  reasons,
  hints:[
   cross?'Нужны треугольники по разные стороны от точки F.':'Найди верхний и нижний треугольники с вершинами A и C.',
   'Посмотри на одинаковые штрихи на сторонах.',
   cross||sss?'Найди стороны с одинаковым числом штрихов.':'Какая сторона принадлежит обоим треугольникам?',
   sss?'Какая сторона принадлежит обоим треугольникам?':cross?'Углы образованы двумя пересекающимися прямыми.':'Посмотри, какие равенства записаны в условии.',
   sss?'Мы нашли три пары равных сторон.':'Мы нашли две стороны и угол между ними.',
   cross?'D соответствует H, F — F, E — G.':'A соответствует A, B — D, C — C.'
  ],
  wrong:[
   cross?'Точки D, F, H лежат на одной прямой. Они не образуют треугольник.':'Нужны верхний △ABC и нижний △ADC.',
   'Равенство этих сторон не дано. Найди одинаковые штрихи.',
   cross||sss?'У этих сторон разные отметки. Найди одинаковые штрихи.':'AB есть только у △ABC. Найди сторону, которая есть и у △ADC.',
   sss?'Равенство углов не дано. Здесь нам нужна общая сторона.':'Равенство треугольников мы ещё доказываем. Его пока нельзя использовать.',
   sss?'Здесь известны три пары равных сторон. Углы в условии не даны.':'Для первого признака нужны две стороны и угол между ними. Три равных угла не гарантируют равенства треугольников.',
   cross?'Проверь порядок: D ↔ H, F ↔ F, E ↔ G.':'Проверь порядок: A ↔ A, B ↔ D, C ↔ C.'
  ],
  lines:['Рассмотрим '+pair+'.',first+' (по условию).',second+(cross||sss?' (по условию).':'.'),sss?'AC — общая сторона.':angles+(cross?' (вертикальные).':' (по условию).')],
  triangles:cross?['DFE','HFG']:['ABC','ADC']
 };
}
function choices(task,index){
 return task.steps[index].choices.map(choice=>{
  let label=choice.label.replace(/Δ/g,'△').replace(/\.$/,'');
  const common=task.params.problem===1&&index===2||task.params.problem===2&&index===3;
  if(common){label=label.startsWith('AC = AC')?'AC':label.startsWith('AB = AC')?'AB':label;}
  else if(index===1||index===2)label=label.split(' — ')[0];
  else if(index===3&&task.params.problem!==2){
   if(label.includes('вертикальные'))label='Это вертикальные углы';
   else if(label.includes('дано'))label='Их равенство дано в условии';
   else label='Потому что треугольники равны';
  }
  return {...choice,label};
 });
}
function proof(task,count){
 const data=lesson(task),lines=data.lines.slice(0,Math.min(count,4));
 if(count===5)lines.push(data.law);
 if(count>=6)lines.push(data.equal+'. '+data.law);
 return lines.length?`<section class="photo-proof-record" aria-label="Наше доказательство"><h2>${count>=6?'Доказательство собрано':'Наше доказательство'}</h2><ol>${lines.map(line=>`<li>${E(line)}</li>`).join('')}</ol></section>`:'';
}
function markup(task,work){
 const data=lesson(task),finished=work.step>=6,writing=work.stage===4,solving=work.stage===2&&!finished;
 const pane=writing?`<h2 id="photo-question" tabindex="-1">Запиши доказательство своими словами</h2><label for="note">Моё доказательство</label><textarea id="note" maxlength="4000" rows="7" placeholder="Рассмотрим треугольники…"></textarea><p class="photo-proof-note">Запись сохранится для обсуждения с преподавателем.</p><button type="button" data-proof-start>Вернуться к шагам</button>`:
 finished?`<p class="photo-proof-progress">6 из 6 шагов</p><h2 id="photo-question" tabindex="-1">Треугольники равны</h2><p class="photo-proof-conclusion">${E(data.equal)}</p><p>${E(data.law)}</p><button type="button" class="primary" data-proof-write>Записать доказательство</button>`:
 solving?`<p class="photo-proof-progress">Шаг ${work.step+1} из 6</p><h2 id="photo-question" tabindex="-1">${E(data.questions[work.step])}</h2><form id="answerForm"><input id="answer" type="hidden"><div class="photo-proof-choices" role="group" aria-labelledby="photo-question">${choices(task,work.step).map((choice,i)=>`<button type="button" id="answer-choice-${i}" data-answer-choice="${E(choice.value)}" aria-pressed="false">${E(choice.label)}</button>`).join('')}</div><button class="primary" type="submit">Проверить</button></form><button type="button" id="hint" class="photo-proof-hint">Подсказка</button><p id="hintText" class="photo-proof-hint-text"></p>`:
 `<h2 id="photo-question" tabindex="-1">Докажи, что треугольники равны</h2><p class="photo-proof-conclusion">${E(data.pair)}</p><p>Рассмотри рисунок. Будем собирать доказательство по одному шагу.</p><button type="button" class="primary" data-proof-start>${work.step?'Продолжить доказательство':'Начать доказательство'}</button>`;
 return `<article class="photo-proof"><header class="photo-proof-heading"><p>Геометрия · рисунок ${task.params.problem}</p><h1>${E(data.title)}</h1></header><div class="photo-proof-layout"><div class="photo-proof-left"><div class="photo-proof-given"><strong>Дано:</strong> ${E(data.given)}</div><div class="photo-proof-drawing" data-proof-drawing></div>${proof(task,work.step)}</div><section class="photo-proof-step" aria-label="Текущий шаг">${pane}<p id="feedback" class="feedback" role="status"></p></section></div></article>`;
}
function diagram(host,task,step,draft){
 const box=host.querySelector('[data-proof-drawing]');if(!box)return;
 box.innerHTML=root.PathGrade7Construction.svg(task);
 const svg=box.querySelector('svg'),points=task.model.diagram.points,values=Object.values(points),xs=values.map(p=>p.x),ys=values.map(p=>p.y);
 svg.setAttribute('viewBox',[Math.min(...xs)-50,Math.min(...ys)-64,Math.max(...xs)-Math.min(...xs)+100,Math.max(...ys)-Math.min(...ys)+120].join(' '));
 svg.style.maxWidth='none';svg.querySelectorAll('text').forEach(label=>label.setAttribute('font-size','36'));
 const ns='http://www.w3.org/2000/svg',data=lesson(task),fills=document.createElementNS(ns,'g');fills.setAttribute('aria-hidden','true');fills.setAttribute('pointer-events','none');
 for(const [i,names]of data.triangles.entries()){
  const p=document.createElementNS(ns,'polygon');p.setAttribute('points',names.split('').map(name=>points[name].x+','+points[name].y).join(' '));p.setAttribute('fill',i?'#f1e6cc':'#deedf5');fills.append(p);
 }
 svg.prepend(fills);
 const active=step<6?task.steps[step].choices.find(choice=>choice.value===draft)?.label||'':'';
 const ids=new Set((active.match(/[A-Z]{2,3}/g)||[]));
 if(step===3&&task.params.problem!==2&&draft){(task.params.problem===3?['DFE','HFG']:['BCA','ACD']).forEach(id=>ids.add(id));}
 for(const group of svg.querySelectorAll('[data-core-part]'))group.classList.toggle('photo-proof-focus',ids.has(group.getAttribute('data-core-part')));
 const triangles=[...active.matchAll(/[Δ△]([A-Z]{3})/g)].map(m=>m[1]);
 for(const names of triangles){
  if(!names.split('').every(name=>points[name]))continue;
  const p=document.createElementNS(ns,'polygon');p.setAttribute('points',names.split('').map(name=>points[name].x+','+points[name].y).join(' '));p.setAttribute('fill','#d9892722');p.setAttribute('stroke','#a34d15');p.setAttribute('stroke-width','5');p.setAttribute('pointer-events','none');fills.append(p);
 }
}
function bind(host,task,work,callbacks){
 const locked=()=>host.inert||!!host.closest('[inert]');
 const input=host.querySelector('#answer');if(input)input.value=work.draft||'';
 function select(value){
  if(locked())return;
  input.value=value;
  host.querySelectorAll('[data-answer-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.answerChoice===value)));
  diagram(host,task,work.step,value);callbacks.select?.(value);
 }
 host.querySelectorAll('[data-answer-choice]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.answerChoice===work.draft));b.onclick=()=>select(b.dataset.answerChoice);});
 host.querySelector('[data-proof-drawing]').onclick=event=>{
  if(!input||locked())return;
  const id=event.target.closest('[data-core-part]')?.getAttribute('data-core-part');if(!id||id.length===1)return;
  const options=choices(task,work.step).filter(c=>(c.label.match(/[A-Z]{2,3}/g)||[]).includes(id));
  if(options.length===1)select(options[0].value);
 };
 const form=host.querySelector('#answerForm');
 if(form){const check=event=>{event.preventDefault();if(!locked())callbacks.check?.(input.value);};form.onsubmit=check;const b=form.querySelector('[type=submit]');b.type='button';b.onclick=check;}
 host.querySelector('[data-proof-start]')?.addEventListener('click',()=>{if(!locked())callbacks.start?.();});
 host.querySelector('[data-proof-write]')?.addEventListener('click',()=>{if(!locked())callbacks.write?.();});
 host.querySelector('#hint')?.addEventListener('click',()=>{if(!locked())callbacks.hint?.();});
 const note=host.querySelector('#note');if(note){const limit=callbacks.noteLimit||4000;note.maxLength=limit;note.value=work.note||'';note.oninput=()=>{if(!locked())callbacks.note?.(note.value.slice(0,limit));};}
 diagram(host,task,work.step,work.draft);
}
root.PathPracticeView.photoProof=Object.freeze({supports,lesson,choices,markup,bind});
})(window);
