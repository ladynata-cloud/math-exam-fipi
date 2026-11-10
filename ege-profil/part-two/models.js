(function (root) {
  'use strict';
  // Author-written bounded explorations informed by the recorded audit principles.
  // These activities never write course credit or validate a written proof.
  const KEY = 'mathexam.profilePartTwoLab.v1.';
  const esc = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const fmt = value => String(Math.round(value * 10000) / 10000).replace('-', '−').replace('.', ',');
  const labs = {
    14: { title: 'Отбор корней: сколько оборотов входит?', question: 'Сколько корней sin x = 1/2 попадёт в [0; 3π]?', choices: ['2','3','4'], answer: '4', initial: 1, min: 1, max: 4, step: 1, parameter: 'Правый конец интервала, в долях π', target: 'Поставьте правый конец 3π и пересчитайте отмеченные корни.', explanation: 'За один оборот есть два положения с sin x = 1/2. Важно отсчитывать угол, а не считать разные точки на окружности: одна точка может появиться после нового оборота.', transfer: 'Теперь sin x = √2/2. Сколько корней в [0; 2π]?', transferAnswers: [2], transferWhy: 'В одном полном обороте подходят π/4 и 3π/4: два корня.' },
    15: { title: 'Наклонная и её проекция', question: 'AH = 6, BH ⟂ AH. Чему станет равна AB, когда BH = 8?', choices: ['8','10','14'], answer: '10', initial: 4, min: 2, max: 8, step: 1, parameter: 'Длина перпендикуляра BH', target: 'Увеличьте только BH до 8. Проекция AH остаётся равной 6.', explanation: 'Наклонная AB, её проекция AH и перпендикуляр BH образуют прямоугольный треугольник. Поэтому AB² = AH² + BH². Меняется наклонная, а длина проекции остаётся прежней.', transfer: 'В другом прямоугольном треугольнике проекция равна 8, перпендикуляр равен 6. Найдите наклонную.', transferAnswers: [10], transferWhy: '√(8² + 6²) = √100 = 10.' },
    16: { title: 'Почему у двойного корня знак сохраняется?', question: 'У f(x) = (x − 1)²(x + 2) меняется ли знак при переходе через x = 1?', choices: ['Да','Нет'], answer: 'Нет', initial: 1, min: 1, max: 2, step: 1, parameter: 'Показатель у множителя (x − 1)', target: 'Смените степень с 1 на 2 и сравните знаки слева и справа от 1.', explanation: 'Множитель (x − 1) меняет знак, а его квадрат положителен с обеих сторон корня. В точке 1 всё произведение равно нулю. У корня −2 множитель x + 2 имеет нечётную кратность, поэтому там знак меняется.', transfer: 'Сколько точек смены знака у (x − 3)²(x + 4)²?', transferAnswers: [0], transferWhy: 'Оба множителя имеют чётную кратность. В корнях произведение нулевое, на остальных точках положительное; смены знака нет.' },
    17: { title: 'Максимум должен быть допустимым', question: 'S(x) = x(8 − x), 0 ≤ x ≤ L. При L = 6 чему равно максимальное значение S?', choices: ['12','16','36'], answer: '16', initial: 2, min: 1, max: 7, step: 1, parameter: 'Верхняя допустимая граница L', target: 'Измените L от 2 до 6: следите, когда вершина становится допустимой.', explanation: 'S(x) = 16 − (x − 4)². Если L < 4, вершина вне разрешённого отрезка: максимум достигается при x = L. Если L ≥ 4, можно взять x = 4 и получить 16. Одного уравнения S′(x) = 0 недостаточно без проверки ограничений.', transfer: 'Для той же S(x) разрешено 0 ≤ x ≤ 3. При каком x достигается максимум?', transferAnswers: [3], transferWhy: 'На [0; 3] функция возрастает. Точка 4 недопустима, поэтому максимум достигается на правом конце x = 3.' },
    18: { title: 'Подобие: длина и площадь меняются по-разному', question: 'Все длины треугольника увеличили в 2 раза. Во сколько раз увеличилась площадь?', choices: ['2','4','8'], answer: '4', initial: 1, min: .5, max: 3, step: .5, parameter: 'Коэффициент подобия k', target: 'Поставьте k = 2: сравните основание, высоту и площадь.', explanation: 'При подобии и основание, и соответствующая высота умножаются на k. Поэтому S₂ = (kb)(kh)/2 = k²S₁. Для положительного k отношение площадей равно квадрату отношения длин.', transfer: 'Коэффициент подобия равен 3/2. Найдите отношение площади нового треугольника к исходной.', transferAnswers: [2.25], transferWhy: '(3/2)² = 9/4 = 2,25. Можно ввести дробь.' },
    19: { title: 'Горизонталь и целый отрезок решений', question: 'Сколько решений у |x − 1| + |x + 1| = a при a = 2?', choices: ['0','2','Бесконечно много'], answer: 'Бесконечно много', initial: 3, min: 0, max: 4, step: .5, parameter: 'Уровень горизонтали a', target: 'Поставьте a = 2, затем чуть ниже и чуть выше. Пересечение может быть целым отрезком.', explanation: 'На [−1; 1] сумма расстояний равна 2. Ниже уровня 2 пересечений нет; на уровне 2 подходит весь отрезок; выше уровня 2 появляются два корня ±a/2. Длина нарисованной линии не означает конечное число корней.', transfer: 'Сколько решений у |x − 2| + |x + 2| = 3?', transferAnswers: [0], transferWhy: 'Минимальная сумма расстояний до −2 и 2 равна 4. Уровень 3 ниже минимума, поэтому решений нет.' },
    20: { title: 'Остаток сохраняется при добавлении кратного', question: 'К числу 17 прибавили 6 · 5. Какой остаток получится при делении на 5?', choices: ['0','1','2','3','4'], answer: '2', initial: 0, min: -3, max: 6, step: 1, parameter: 'Количество добавленных пятёрок k', target: 'Меняйте k: число меняется, а неполная последняя группа — нет.', explanation: '17 + 5k = 5(3 + k) + 2. При всех допустимых k частное меняется, но остаток 2 остаётся в диапазоне 0 ≤ 2 < 5. Это обоснование для любого целого k, а не только для нарисованных примеров.', transfer: 'Какой остаток даёт число 23 + 7 · 100 при делении на 7?', transferAnswers: [2], transferWhy: '23 + 7 · 100 = 7 · 103 + 2. Остаток равен 2.' }
  };
  function parameter(exam, value) {
    const lab = labs[exam]; if (!lab) throw Error('Unknown exploration');
    const p = Number(value);
    if (!Number.isFinite(p) || p < lab.min || p > lab.max || Math.abs((p-lab.min)/lab.step-Math.round((p-lab.min)/lab.step))>1e-9) return lab.initial;
    return p;
  }
  function evaluate(exam, raw) {
    const p = parameter(exam, raw);
    if (exam === 14) { const roots=[]; for(let k=0;k<3;k++)for(const q of [1/6+2*k,5/6+2*k])if(q<=p)roots.push(q); return {p, roots, count:roots.length}; }
    if (exam === 15) return {p, base:6, height:p, length:Math.sqrt(36+p*p)};
    if (exam === 16) return {p, roots:[-2,1], samples:[-3,0,2], signs:[-3,0,2].map(x=>Math.sign((x-1)**p*(x+2)))};
    if (exam === 17) {const x=Math.min(4,p);return {p,x,maximum:x*(8-x)};}
    if (exam === 18) return {p,base:4*p,height:3*p,area:6*p*p,ratio:p*p};
    if (exam === 19) return {p,count:p<2?0:p===2?Infinity:2,roots:p>2?[-p/2,p/2]:[]};
    return {p,n:17+5*p,quotient:3+p,remainder:2};
  }
  const text = (x,y,value,color='#173f3a') => '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="system-ui,sans-serif" font-size="14">'+esc(value)+'</text>';
  const line = (x1,y1,x2,y2,color='#52746f',dash='') => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="2"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
  const dot = (x,y,color='#087f6b',r=4) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'"/>';
  function scene(exam, value) {
    const v=evaluate(exam,value);let drawing='',summary='';
    if(exam===14){
      const X=q=>34+q*83;drawing=text(18,22,'sin x = 1/2; интервал [0; '+v.p+'π]')+line(27,85,143,85)+line(85,28,85,142)+'<circle cx="85" cy="85" r="50" fill="none" stroke="#52746f" stroke-width="2"/>'+line(30,60,140,60,'#b04431')+text(148,64,'y = 1/2');
      for(const angle of [Math.PI/6,5*Math.PI/6]){const x=85+50*Math.cos(angle),y=85-50*Math.sin(angle);drawing+=line(85,85,x,y,'#087f6b')+dot(x,y);}
      drawing+=text(218,95,'2 точки за оборот')+text(218,120,'Корней: '+v.count)+line(34,185,366,185)+text(25,213,'0');
      for(let k=1;k<=4;k++)drawing+=line(X(k),180,X(k),190)+text(X(k)-9,213,(k===1?'':k)+'π');
      drawing+=line(X(v.p),159,X(v.p),198,'#b04431','5 4');
      for(const q of v.roots)drawing+=dot(X(q),185)+line(X(q),165,X(q),179,'#087f6b');
      summary='В интервале '+v.count+' корня. Каждая зелёная точка обозначает угол, а не новую точку окружности.';
    }else if(exam===15){
      const A=[42,185],H=[150,185],B=[150,185-18*v.height];
      drawing=line(...A,...H)+line(...H,...B)+line(...A,...B,'#087f6b')+'<path d="M138 185v-12h12" fill="none" stroke="#52746f"/>'+text(26,207,'A')+text(155,207,'H')+text(B[0]+8,B[1]+4,'B')+text(93,207,'6')+text(163,(H[1]+B[1])/2,'h = '+v.height)+text(18,25,'AB² = 6² + h²');
      summary='AH = 6; BH = '+v.height+'; AB = √'+(36+v.height*v.height)+' ≈ '+fmt(v.length)+'. Рисунок сохраняет прямой угол при H.';
      drawing+=text(240,190,'AB ≈ '+fmt(v.length));
    }else if(exam===16){
      drawing=text(18,25,'f(x) = (x − 1)'+(v.p===2?'²':'')+'(x + 2)')+line(30,105,370,105);
      for(const [x,label]of [[135,'−2'],[265,'1']])drawing+=dot(x,105)+text(x-8,132,label);
      for(let i=0;i<3;i++)drawing+=text([70,195,315][i],87,v.signs[i]>0?'+':'−');
      drawing+=text(18,178,v.p===2?'В точке 1: + → 0 → +':'В точке 1: − → 0 → +');
      summary='Знаки слева направо: '+v.signs.map(s=>s>0?'плюс':'минус').join(', ')+'. В корнях −2 и 1 значение равно нулю.';
    }else if(exam===17){
      const X=x=>35+x*43,Y=y=>191-y*9;let points=[];for(let i=0;i<=80;i++){const x=i/10;points.push(X(x)+','+Y(x*(8-x)));}
      drawing=line(35,191,379,191)+line(35,200,35,30)+'<polyline points="'+points.join(' ')+'" fill="none" stroke="#839691" stroke-width="2"/>';
      drawing+='<rect x="35" y="35" width="'+(43*v.p)+'" height="156" fill="#087f6b" opacity=".09"/>'+line(X(v.p),35,X(v.p),191,'#b04431','5 4')+dot(X(v.x),Y(v.maximum),'#087f6b',6)+text(43,23,'S = x(8 − x), 0 ≤ x ≤ '+v.p)+text(X(v.p)-4,214,fmt(v.p))+(v.p===4?'':text(201,214,'4'))+text(47,62,'max S = '+fmt(v.maximum));
      summary='При L = '+v.p+' максимум '+fmt(v.maximum)+' достигается при x = '+fmt(v.x)+'. Зелёная область отмечает допустимые x, остальная кривая дана для сравнения.';
    }else if(exam===18){
      const polygon=(x,y,k)=>'<polygon points="'+x+','+y+' '+(x+40*k)+','+y+' '+x+','+(y-30*k)+'" fill="#087f6b" fill-opacity=".12" stroke="#087f6b" stroke-width="2"/>';
      drawing=text(18,24,'Один масштаб для обеих фигур')+polygon(30,175,1)+polygon(190,175,v.p)+text(25,203,'b = 4; h = 3')+text(185,203,'b = '+fmt(v.base)+'; h = '+fmt(v.height))+text(25,69,'S₁ = 6')+text(185,46,'S₂ = '+fmt(v.area))+text(185,69,'S₂ / S₁ = '+fmt(v.ratio));
      summary='k = '+fmt(v.p)+': основание '+fmt(v.base)+', высота '+fmt(v.height)+', площадь '+fmt(v.area)+'. Отношение площадей '+fmt(v.ratio)+'.';
    }else if(exam===19){
      const X=x=>200+x*48,Y=y=>194-y*34;drawing=line(X(-3.5),Y(0),X(3.5),Y(0))+line(X(0),Y(0),X(0),Y(4.6));
      drawing+='<polyline points="'+[[-2.3,4.6],[-1,2],[1,2],[2.3,4.6]].map(([x,y])=>X(x)+','+Y(y)).join(' ')+'" fill="none" stroke="#087f6b" stroke-width="3"/>'+line(X(-3.3),Y(v.p),X(3.3),Y(v.p),'#b04431');
      if(v.count===Infinity)drawing+=line(X(-1),Y(2),X(1),Y(2),'#8e43a0');else for(const x of v.roots)drawing+=dot(X(x),Y(v.p),'#8e43a0',5);
      drawing+=text(17,21,'|x − 1| + |x + 1| = '+fmt(v.p))+text(X(-1)-12,216,'−1')+text(X(1)-4,216,'1')+text(23,50,'Решений: '+(v.count===Infinity?'бесконечно много':v.count));
      summary=v.count===Infinity?'Подходит каждая точка отрезка [−1; 1], включая концы.':v.count===0?'Горизонталь ниже минимального значения 2. Решений нет.':'Два решения: '+v.roots.map(fmt).join('; ')+'.';
    }else{
      drawing=text(18,24,'n = 17 + 5 · ('+v.p+') = '+v.n)+text(18,48,'Полных пятёрок: '+v.quotient+'; остаток: 2');
      for(let i=0;i<v.n;i++){const group=Math.floor(i/5),j=i%5;const x=28+(group%5)*75+j*11,y=90+Math.floor(group/5)*39;drawing+=dot(x,y,i<5*v.quotient?'#52746f':'#b04431',4);}
      drawing+=text(18,207,v.n+' = 5 · '+v.quotient+' + 2');summary='Число '+v.n+' разбито на '+v.quotient+' полных групп по 5 и 2 оставшихся единицы.';
    }
    return {value:v,summary,svg:'<svg viewBox="0 0 400 230" role="img" aria-label="'+esc(summary)+'" style="display:block;width:100%;max-width:640px;height:auto"><title>'+esc(summary)+'</title>'+drawing+'</svg>'};
  }
  function cleanRecord(value,lab){
    if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1)return null;
    const validAttempt=a=>a&&typeof a==='object'&&!Array.isArray(a)&&typeof a.value==='string'&&a.value.length<=120&&typeof a.correct==='boolean';
    const r={version:1,p:parameter(lab.exam,value.p),changed:value.changed===true,prediction:null,transferFirst:null,transferLast:null,draft:typeof value.draft==='string'?value.draft.slice(0,120):''};
    for(const key of ['prediction','transferFirst','transferLast'])if(value[key]!==null&&value[key]!==undefined){if(!validAttempt(value[key]))return null;r[key]={value:value[key].value,correct:value[key].correct};}
    return r;
  }
  function createStore(exam,storage){
    const lab={...labs[exam],exam};if(!labs[exam])throw Error('Unknown exploration');
    const empty=()=>({version:1,p:lab.initial,changed:false,prediction:null,transferFirst:null,transferLast:null,draft:''});
    let record=empty(),warning='',blocked=false;
    function read(){const raw=storage?.getItem(KEY+exam);if(raw==null||raw==='')return empty();const parsed=cleanRecord(JSON.parse(raw),lab);if(!parsed)throw Error('invalid');return parsed;}
    try{if(storage)record=read();}catch(_){blocked=true;warning='Сохранённое исследование сейчас недоступно. Прежняя запись оставлена без изменений.';}
    function write(patch){
      let current=record;
      if(!blocked&&storage)try{current=read();}catch(_){blocked=true;warning='Запись исследования изменилась и не читается. Она сохранена без изменений.';}
      const next={...current,...patch};for(const key of ['prediction','transferFirst'])if(current[key])next[key]=current[key];
      record=next;
      if(!blocked&&storage)try{storage.setItem(KEY+exam,JSON.stringify(next));}catch(_){blocked=true;warning='Исследование сохраняется только до закрытия страницы.';}
      return snapshot();
    }
    const snapshot=()=>JSON.parse(JSON.stringify(record));
    return {snapshot,write,get warning(){return warning;}};
  }
  function numeric(value){
    if(root.ProfileCheck?.number)return root.ProfileCheck.number(value);
    const s=String(value).trim().replace(',','.').replace('−','-');if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return Number(s);
    const f=s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);return f&&Number(f[2])!==0?Number(f[1])/Number(f[2]):NaN;
  }
  function mount(container,exam,options={}){
    exam=Number(exam);const lab=labs[exam];if(!container||!lab)return()=>{};
    let storage=options.storage;try{if(storage===undefined)storage=root.localStorage;}catch(_){storage=null;}
    const store=createStore(exam,storage);let active=true,helpCalled=false;
    function help(){if(!helpCalled){helpCalled=true;options.onHelp?.();}}
    function draw(){if(!active)return;const r=store.snapshot(),view=scene(exam,r.p);
      container.innerHTML='<section class="part2-lab" aria-label="'+esc(lab.title)+'"><p class="eyebrow">Исследование, не зачёт</p><h3>'+esc(lab.title)+'</h3><p>Сначала прогноз, затем изменение модели и проверка на другом условии. Результат не добавляется к освоению темы.</p><form data-lab-prediction><label for="part2-prediction-'+exam+'"><strong>1. Предскажите</strong><br>'+esc(lab.question)+'</label><select id="part2-prediction-'+exam+'"'+(r.prediction?' disabled':'')+'><option value="">Выберите прогноз</option>'+lab.choices.map(v=>'<option value="'+esc(v)+'"'+(r.prediction?.value===v?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select><button type="submit"'+(r.prediction?' disabled':'')+'>Сохранить первый прогноз</button><p data-lab-prediction-feedback role="status">'+(r.prediction?'Первый прогноз сохранён: '+esc(r.prediction.value)+'. Теперь проверьте его на модели.':'')+'</p></form><div'+(!r.prediction?' hidden':'')+' data-lab-observation><label for="part2-parameter-'+exam+'"><strong>2. Измените одно значение</strong><br>'+esc(lab.parameter)+' = <output data-lab-value>'+fmt(r.p)+'</output></label><input id="part2-parameter-'+exam+'" type="range" min="'+lab.min+'" max="'+lab.max+'" step="'+lab.step+'" value="'+r.p+'" aria-label="'+esc(lab.parameter)+'"><p>'+esc(lab.target)+'</p><div data-lab-model>'+view.svg+'</div><p data-lab-summary aria-live="polite">'+esc(view.summary)+'</p></div><div data-lab-explain'+(!r.changed?' hidden':'')+'><h4>3. Объясните связь</h4><p>'+esc(lab.explanation)+'</p><p>Сопоставьте это объяснение со своим первым прогнозом.</p><form data-lab-transfer><label for="part2-transfer-'+exam+'"><strong>4. Проверьте на другом условии</strong><br>'+esc(lab.transfer)+'</label><input id="part2-transfer-'+exam+'" type="text" inputmode="text" autocomplete="off" maxlength="120" value="'+esc(r.draft)+'"><button type="submit">Проверить перенос</button><p data-lab-transfer-feedback role="status">'+(r.transferLast?(r.transferLast.correct?'Верно. '+esc(lab.transferWhy):'Пока не совпало. Проверьте, какая связь сохранилась в новом условии.'):'')+'</p><p data-lab-transfer-first class="small">'+(r.transferFirst?'Первая попытка переноса: '+esc(r.transferFirst.value)+(r.transferFirst.correct?' — верно.':' — потребовалось исправление.'):'')+'</p></form></div><p data-lab-warning role="status">'+esc(store.warning)+'</p></section>';
      const $=selector=>container.querySelector(selector);
      $('[data-lab-prediction]').onsubmit=e=>{e.preventDefault();const value=$('#part2-prediction-'+exam).value;if(!lab.choices.includes(value)){ $('[data-lab-prediction-feedback]').textContent='Сначала выберите прогноз.';return;}help();store.write({prediction:{value,correct:value===lab.answer}});draw();};
      $('#part2-parameter-'+exam).oninput=e=>{const p=parameter(exam,e.target.value);store.write({p,changed:store.snapshot().changed||p!==lab.initial});const next=scene(exam,p);$('[data-lab-value]').textContent=fmt(p);$('[data-lab-model]').innerHTML=next.svg;$('[data-lab-summary]').textContent=next.summary;$('[data-lab-explain]').hidden=!store.snapshot().changed;$('[data-lab-warning]').textContent=store.warning;};
      $('#part2-transfer-'+exam).oninput=e=>store.write({draft:e.target.value.slice(0,120)});
      $('[data-lab-transfer]').onsubmit=e=>{e.preventDefault();const value=$('#part2-transfer-'+exam).value.trim();if(!value){$('[data-lab-transfer-feedback]').textContent='Введите ответ на новое условие.';return;}const n=numeric(value);if(!Number.isFinite(n)){$('[data-lab-transfer-feedback]').textContent='Введите число или дробь, например 9/4.';return;}const attempt={value,correct:lab.transferAnswers.some(a=>Math.abs(n-a)<1e-9)};store.write({draft:value,transferFirst:attempt,transferLast:attempt});draw();};
    }
    const storageChange=e=>{if(e.key===KEY+exam&&active){const fresh=createStore(exam,storage);store.write(fresh.snapshot());draw();}};
    root.addEventListener?.('storage',storageChange);draw();
    return()=>{active=false;root.removeEventListener?.('storage',storageChange);container.innerHTML='';};
  }
  const api={labs,evaluate,scene,createStore,mount};root.ProfilePartTwoLabs=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
