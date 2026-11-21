(function () {
  'use strict';
  const curriculum = window.WorkshopCurriculum;
  const math = window.WorkshopMath;
  // Each set samples the main parts of its route. The existing generators supply
  // new conditions, intermediate explanations and the expected answer format.
  const skills = {
    foundation: ['divide', 'fractionadd', 'unlike', 'decimaldiv', 'percent', 'signedsub'],
    5: ['order', 'equation', 'area', 'fractionadd', 'decimalmul', 'motion'],
    6: ['gcd', 'fractiondiv', 'percentchange', 'signedmul', 'proportion', 'coordinate'],
    7: ['core-brackets', 'sec-linear', 'sec-line', 'core-factor', 'sec-square', 'core-elimination'],
    8: ['sec-domain', 'core-fraction-add', 'core-radical-equation', 'core-viete', 'core-quadratic-general', 'core-inequality-system'],
    9: ['core-transform', 'core-inverse', 'core-rational-inequality', 'core-absolute-equation', 'core-nonlinear-system', 'core-sequence'],
    10: ['core-power-domain', 'core-exp-inequality', 'core-log-domain', 'core-log-equation', 'core-trig-equation', 'core-trig-graph'],
    11: ['core-exp-inequality', 'core-log-inequality', 'core-trig-graph', 'core-derivative-rule', 'core-extrema', 'core-integral'],
    'makarychev7-start': ['m7f-decimals','m7f-expression-language','m7f-compare-difference','m7f-common-factor','m7f-equation-brackets','m7f-word-motion'],
    vilenkin5: ['v5f-table-total','v5f-division-column','v5f-area-missing','v5f-mixed-borrow','v5f-fraction-divide','v5f-decimal-money'],
    vilenkin6: ['v6f-percent-increase','v6f-gcd-list','v6f-fraction-subtract','v6f-scale-map','v6f-multiply-many','v6f-equation-both'],
    makarychev9: ['m9f-relative-error','m9f-parabola-value','m9f-rational-solve','m9f-interval-product','m9f-arithmetic-index','m9f-geometric-term'],
    probability: ['core-frequency', 'core-weighted', 'core-combinations', 'core-independence', 'core-binomial', 'core-variance']
  };
  const statuses = {
    first: 'С первой попытки', corrected: 'После исправления', helped: 'С опорой', skipped: 'Пропущено'
  };
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const integer = (x, lo, hi) => Number.isSafeInteger(x) && x >= lo && x <= hi;
  const safe = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const embedded = window !== window.top;
  const select = document.querySelector('#course');
  const work = document.querySelector('#work');
  const notice = document.querySelector('#storage-note');
  const board = document.querySelector('#board');
  let bridge, state, saved = null, locked = false;
  const key = id => 'mathexam:school-final:v1:' + id;
  const queryCourse = new URLSearchParams(location.search).get('course');
  const validCourse = id => typeof id === 'string' && own(skills,id);
  const seed = () => Math.floor(Math.random() * 900000);
  function fresh(course, items = skills[course], variant = seed()) {
    return {course, items:items.slice(), variant, results:[], draft:'', tries:0, hint:0, modelPosition:null, stage:'answer'};
  }
  function task(s) {
    const index = s.results.length;
    return math.generate(s.items[index],s.variant + index * 173);
  }
  function valid(s) {
    if (!s || typeof s !== 'object' || Object.keys(s).sort().join() !== 'course,draft,hint,items,modelPosition,results,stage,tries,variant') return false;
    if (!validCourse(s.course) || !integer(s.variant,0,999999) || !Array.isArray(s.items) || !integer(s.items.length,1,6)
      || new Set(s.items).size !== s.items.length || !s.items.every(id => skills[s.course].includes(id))
      || !Array.isArray(s.results) || s.results.length > s.items.length || !s.results.every(v => typeof v === 'string' && own(statuses,v))
      || !integer(s.tries,0,10000) || (s.modelPosition !== null && (!s.hint || !integer(s.modelPosition,0,100))) || !integer(s.hint,0,12) || typeof s.draft !== 'string' || s.draft.length > 160 || /<\/?[a-z][^>]*>/i.test(s.draft)
      || !['answer','wrong','correct'].includes(s.stage)) return false;
    if (s.results.length === s.items.length) return s.stage === 'answer' && !s.tries && !s.hint && !s.draft;
    const t = task(s);
    return s.hint <= t.steps.length && (s.stage === 'answer' || s.tries > 0 && !!s.draft.trim() && math.accepts(s.draft,t) === (s.stage === 'correct'));
  }
  function load(id) {
    locked=false; saved=null; notice.textContent='';
    if (!embedded) try {
      saved=localStorage.getItem(key(id));
      if (saved) {
        const value=JSON.parse(saved);
        if (!valid(value) || value.course !== id) throw Error();
        return value;
      }
    } catch (_) {
      locked=true; notice.textContent='Сохранение недоступно. Задания можно решать в этой вкладке.';
    }
    return fresh(id);
  }
  function persist() {
    if (embedded) { bridge?.notifyStateChanged(); return; }
    if (locked) return;
    try {
      if (localStorage.getItem(key(state.course)) !== saved) throw Error();
      const value=JSON.stringify(state);
      localStorage.setItem(key(state.course),value); saved=value;
    } catch (_) {
      locked=true; notice.textContent='Работа в этой вкладке продолжается. Чтобы открыть последнее сохранение, обнови страницу.';
    }
  }
  function resetQuestion() {
    state.draft=''; state.tries=0; state.hint=0; state.modelPosition=null; state.stage='answer';
  }
  function route() {
    select.value=state.course;
    const url=new URL(location.href); url.searchParams.set('course',state.course);
    if (!embedded && location.protocol !== 'file:') history.replaceState(null,'',url);
    board.href='../trainer-board.html?trainer='+encodeURIComponent('/trainers/school-workshop-check/index.html?course='+state.course);
    board.hidden=embedded;
  }
  function format(t) {
    if(t.answerFormat==='decimal') return 'Запиши десятичную дробь через запятую.';
    if(t.answerFormat==='reduced-fraction') return 'Сократи дробь и запиши её через / или введи целое число.';
    if(t.answerFormat==='improper-fraction') return 'Запиши неправильную дробь через /.';
    if(t.answerFormat==='prime-factors') return 'Пиши простые множители через знак умножения.';
    if(Array.isArray(t.answer)) return 'Введи значения по порядку через точку с запятой.';
    return '';
  }
  function answerLabel(t) {
    if(t.answerFormat==='prime-factors') return t.answer.join(' · ');
    if(t.answerFormat==='decimal') {
      const v=typeof t.answer==='number'?t.answer:t.answer.n/t.answer.d;
      return Number.isInteger(v)?v+',0':String(v).replace('.',',');
    }
    const word = a => Array.isArray(a)?a.map(word).join('; '):typeof a==='object'?math.fmt(a):String(a);
    return word(t.answer);
  }
  function summary() {
    const weak=state.items.filter((_,i)=>state.results[i]!=='first');
    const rows=state.items.map((id,i)=>'<li><strong>'+safe(curriculum.byId[id].title)+'</strong>'+statuses[state.results[i]]+
      (!embedded && state.results[i]!=='first'?' · <a href="../../school/index.html?course='+state.course+'#lesson/'+id+'">Разобрать тему на модели</a>':'')+'</li>').join('');
    work.innerHTML='<section class="panel"><h2 tabindex="-1">Работа завершена</h2><p>С первой попытки без помощи: '+(state.items.length-weak.length)+' из '+state.items.length+'.</p><ul class="result-list">'+rows+'</ul><div class="row">'+
      (weak.length?'<button data-action="retry">Новые задания по трудным темам</button>':'')+'<button class="quiet" data-action="again">Новая полная работа</button></div></section>';
  }
  // Render the course model via its own engine. Only one bounded slider value
  // travels over the board. SVG and captions are rebuilt by each participant.
  function drawModel(t) {
    const host=work.querySelector('#concept-model');
    if(!host) return;
    const source=document.createElement('div');
    window.WorkshopModels.mount(source,t.model);
    const slider=source.querySelector('input[type=range]');
    if(slider && state.modelPosition!==null) {
      const min=Number(slider.min), max=Number(slider.max), step=Number(slider.step)||1;
      slider.value=String(min+step*Math.round((max-min)*state.modelPosition/100/step));
      slider.dispatchEvent(new Event('input',{bubbles:true}));
    }
    const svg=source.querySelector('svg,.v5-table-wrap,.v5-equivalence,.v6-eq-display');
    if(!svg) {host.hidden=true;return;}
    host.querySelector('.model-image').replaceChildren(svg.cloneNode(true));
    host.querySelector('.diagram-note').textContent=source.querySelector('.core-caption,.secondary-caption,.alg-caption,.model-caption,.v5-caption,.v6-caption,.m9-formula')?.textContent||'';
    const control=host.querySelector('#model-slider');
    control.parentElement.hidden=!slider;
    host.querySelector('.diagram-instruction').textContent=slider?'Измени величину и посмотри, что произойдёт в примере на рисунке.':'Сопоставь пример на модели со своим заданием.';
    if(slider) {
      const name=slider.getAttribute('aria-label')||slider.closest('label')?.textContent.replace(/-?\d+(?:[.,]\d+)?\s*$/,'').trim()||'Параметр модели';
      const min=Number(slider.min), max=Number(slider.max);
      host.querySelector('span').textContent=name+' · '+slider.value;
      control.value=String(state.modelPosition ?? Math.round((Number(slider.value)-min)*100/(max-min||1)));
    }
  }
  function render(focus) {
    route(); const index=state.results.length;
    if(index===state.items.length) { summary(); if(focus) work.querySelector('h2').focus(); return; }
    const id=state.items[index],t=task(state),lesson=curriculum.byId[id],formatNote=format(t);
    const open=state.hint,ready=state.stage==='correct';
    const feedback=ready?(open?'Верно. Этот пример решён с опорой.':state.tries>1?'Верно после исправления.':'Верно с первой попытки.') :
      state.stage==='wrong'?(math.equal(state.draft,t.answer)&&formatNote?'Значение верное. '+formatNote:'Пока не сходится. '+(lesson.detail?.find(r=>r[0].includes('ловуш'))?.[1]||'Открой первый шаг, чтобы проверить ход решения.')):'';
    work.innerHTML='<section class="panel" aria-labelledby="problem"><p>Задание '+(index+1)+' из '+state.items.length+'</p><progress aria-label="Завершено заданий" max="'+state.items.length+'" value="'+index+'"></progress><h2 id="problem" tabindex="-1">'+safe(lesson.title)+'</h2><p class="prompt">'+safe(t.prompt)+'</p>'+
      (formatNote?'<p>'+formatNote+'</p>':'')+'<form><label class="label" for="answer">Твой ответ</label><div class="row"><input id="answer" maxlength="160" autocomplete="off"'+(ready?' readonly':'')+' value="'+safe(state.draft)+'">'+(ready?'<button type="button" data-action="next">Продолжить</button>':'<button>Проверить</button>')+'</div></form>'+
      '<p id="feedback" class="feedback" role="status">'+safe(feedback)+'</p>'+
      (open?'<section><h3>Разбор по шагам</h3><ol class="steps-list">'+t.steps.slice(0,open).map((s,i)=>'<li>'+safe(s.prompt)+(i+1<open?'<br><b>'+safe(answerLabel(s))+'</b>. '+safe(s.why||''):'')+'</li>').join('')+'</ol></section><section id="concept-model"><h3>Модель к теме</h3><p class="diagram-instruction"></p><div class="model-image"></div><p class="diagram-note"></p><label><span></span><input type="range" id="model-slider" min="0" max="100"></label></section>':'')+
      (!ready?'<div class="row">'+(open<t.steps.length?'<button class="quiet" data-action="hint">'+(open?'Следующий шаг подсказки':'Помочь с первым шагом')+'</button>':'')+
      '<button class="quiet" data-action="skip">Пока пропустить</button></div>':'')+'</section>';
    if(open) drawModel(t);
    if(focus==='question') work.querySelector('h2').focus(); else if(focus==='answer') work.querySelector('#answer').focus();
    else if(focus==='feedback') work.querySelector(ready?'[data-action="next"]':'#answer').focus();
  }
  function changeCourse(id) {
    if(!validCourse(id)) return;
    state=load(id); persist(); render('question');
  }
  for (const id of ['foundation','5','6','7','8','9','10','11','probability','vilenkin5','vilenkin6','makarychev7-start','makarychev9']) select.add(new Option(curriculum.pathById[id].title,id));
  select.addEventListener('change',()=>changeCourse(select.value));
  work.addEventListener('input',e=>{
    if(e.target.id==='model-slider') {state.modelPosition=Number(e.target.value);drawModel(task(state));persist();return;}
    if(e.target.id!=='answer'||state.stage==='correct') return;
    state.draft=e.target.value.replace(/<\/?[a-z][^>]*>/gi,'').slice(0,160);
    if(e.target.value!==state.draft) e.target.value=state.draft;
    if(state.stage==='wrong') {state.stage='answer';work.querySelector('#feedback').textContent='';}
    persist();
  });
  work.addEventListener('submit',e=>{
    e.preventDefault();
    if(state.stage==='correct') return;
    if(!state.draft.trim()) {work.querySelector('#feedback').textContent='Сначала введи ответ.';return;}
    state.tries=Math.min(10000,state.tries+1);state.stage=math.accepts(state.draft,task(state))?'correct':'wrong';
    persist();render('feedback');
  });
  work.addEventListener('click',e=>{
    const action=e.target.closest('button[data-action]')?.dataset.action;
    if(!action) return;
    if(action==='retry'||action==='again') {
      const list=action==='retry'?state.items.filter((_,i)=>state.results[i]!=='first'):skills[state.course];
      state=fresh(state.course,list,(state.variant+947)%1000000);
    } else if(action==='hint') {
      state.hint=Math.min(state.hint+1,task(state).steps.length);
    } else if(action==='skip'||action==='next') {
      if(action==='next'&&state.stage!=='correct') return;
      state.results.push(action==='skip'?'skipped':state.hint?'helped':state.tries>1?'corrected':'first');resetQuestion();
    }
    persist();render(action==='hint'?'answer':'question');
  });
  state=load(validCourse(queryCourse)?queryCourse:'5');
  render();
  if(embedded && location.origin!=='null') {
    bridge=window.MathExamBoard.register({id:'school-workshop-check',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,
      getState:()=>JSON.parse(JSON.stringify(state)),applyState:value=>{
        if(!valid(value)) throw Error('Некорректная работа');
        state=JSON.parse(JSON.stringify(value));render();
      }});
  }
})();
