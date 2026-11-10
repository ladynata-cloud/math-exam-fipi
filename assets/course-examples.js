/* Optional explanations. Native adapters own help/progress; this module awards no credit. */
(function (root) {
  'use strict';
  const items = root.MathExamCourseExampleData || [], byId = new Map(items.map(t => [t.id, t]));
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const math = s => escape(s).replace(/(?<![\w/])(\([^()]+\)|\d+)\/(\([^()]+\)|\d+)(?![\w/])/g, (_,a,b) => '<span class="ce-fraction" role="math" aria-label="'+a+' разделить на '+b+'"><span>'+a+'</span><span>'+b+'</span></span>');
  let playing = null;
  function stop(finalFrame) {
    if (!playing) return;
    const p = playing; playing = null;
    clearTimeout(p.timer); p.button.textContent = '▶ Смотреть GIF'; p.button.setAttribute('aria-pressed','false');
    p.frame(finalFrame === true ? 4 : p.index());
  }
  function bindExample(el) {
    if (el.dataset.ceBound) return;
    const item = byId.get(el.dataset.courseExample), img = el.querySelector('img');
    if (!item || !img) return;
    el.dataset.ceBound = '1';
    const controls = el.querySelector('.ce-controls'), caption = el.querySelector('[data-ce-caption]');
    controls.hidden = false;
    const button = controls.querySelector('[data-ce-action="play"]'), prev = controls.querySelector('[data-ce-action="prev"]'), next = controls.querySelector('[data-ce-action="next"]');
    let step = 0;
    function frame(n) {
      step = Math.max(0,Math.min(4,n));
      img.src = '/assets/course-examples/'+item.id+'-'+step+'.png';
      img.alt = item.steps[step]; caption.innerHTML = 'Шаг '+(step+1)+' из 5. '+math(item.steps[step]);
      el.querySelector('[data-ce-counter]').textContent = 'Кадр '+(step+1)+' / 5'; prev.disabled = step===0; next.disabled = step===4;
    }
    button.onclick = () => {
      const same = playing?.button === button; stop(); if (same) return;
      playing = {el,img,button,frame,index:()=>step,timer:null};
      button.textContent = '■ Остановить'; button.setAttribute('aria-pressed','true');
      img.alt = 'Наглядный разбор: '+item.short+'. Текст всех шагов расположен ниже.';
      caption.textContent = 'Идёт разбор из пяти шагов. Можно остановить и перейти по кадрам стрелками.';
      img.src = '/assets/course-examples/'+item.id+'.gif';
    };
    img.addEventListener('load', () => {
      if (playing?.img !== img || !img.src.endsWith('.gif')) return;
      const current=playing; clearTimeout(current.timer);
      current.timer = setTimeout(()=>{if(playing===current)stop(true);},11000);
    });
    img.addEventListener('error',()=>{if(playing?.img===img){stop();caption.textContent='Анимация не загрузилась. Все шаги можно прочитать ниже.';}});
    prev.onclick=()=>{stop();frame(step-1);}; next.onclick=()=>{stop();frame(step+1);};
    el.closest('details')?.addEventListener('toggle',event=>{if(!event.currentTarget.open&&playing?.el===el)stop();});
  }
  function rational(raw) {
    const s=String(raw).trim().replace(/−/g,'-').replace(/,/g,'.');
    if (!s || s.length>40) return null;
    function decimal(v) {
      if(!/^[+-]?(?:\d{1,12}(?:\.\d{1,12})?|\.\d{1,12})$/.test(v))return null;
      const sign=v[0]==='-'?-1n:1n, parts=v.replace(/^[+-]/,'').split('.');
      return [sign*BigInt((parts[0]||'0')+(parts[1]||'')),10n**BigInt((parts[1]||'').length)];
    }
    const parts=s.split('/');if(parts.length>2)return null;
    const a=decimal(parts[0]);if(!a)return null;if(parts.length===1)return a;
    const b=decimal(parts[1]);if(!b||b[0]===0n)return null;return [a[0]*b[1],a[1]*b[0]];
  }
  function equal(value,expected) {const a=rational(value),b=rational(expected);return a&&b?a[0]*b[1]===b[0]*a[1]:null;}
  function bindQuiz(form) {
    if(form.dataset.ceBound)return;
    const t=byId.get(form.dataset.ceTopic);if(!t)return;form.dataset.ceBound='1';
    const fresh=form.dataset.ceQuiz==='fresh', input=form.querySelector('input'), result=form.querySelector('.ce-result');
    let mistakes=0,help=false;
    form.querySelector('button').hidden=false;
    const section=form.closest('section');
    section?.querySelectorAll('details').forEach(d=>{d.addEventListener('toggle',()=>{if(d.open)help=true;});});
    input.addEventListener('input',()=>{result.textContent='';});
    form.addEventListener('submit',event=>{
      event.preventDefault();const value=input.value;
      if(!value.trim()){result.textContent='Сначала введи свой ответ. Пустое поле не считается ошибкой.';return;}
      const correct=equal(value,fresh?t.freshAnswer:t.answer);
      if(correct===null){result.textContent='Введи число или дробь: например, 0,5 или 1/2. Знаменатель не может быть нулём. Формат не считается математической ошибкой.';return;}
      if(correct){result.textContent=(fresh?'Верный ответ на новое условие. ':'Верно. ')+(fresh?t.freshWhy:'Теперь проверь способ на другом примере ниже.')+(help?' Разбор был открыт — закрепи навык на новых числах в курсе.':'');return;}
      mistakes++;result.textContent=(fresh?'Пока не совпало. Прочитай, какую величину спрашивают в новом условии.':t.mistake)+(mistakes>=2?' Можно открыть подсказку или наглядный разбор.':' Попробуй исправить свою запись.');
    });
  }
  function init(scope) {scope.querySelectorAll('[data-course-example]').forEach(bindExample);scope.querySelectorAll('[data-ce-quiz]').forEach(bindQuiz);}
  function mount(anchor,course,lesson,onHelp) {
    const t=items.find(x=>x.course===course&&x.lesson===lesson);if(!anchor||!t)return null;
    const details=document.createElement('details');details.className='ce-help';details.dataset.ceNative=t.id;
    details.innerHTML='<summary>Наглядный пример: '+escape(t.short)+'</summary><p>Это объяснение способа на отдельном примере. Открытие считается помощью к текущей задаче; твой ответ остаётся на месте.</p><p>'+math(t.question)+'</p><div class="ce-example" data-course-example="'+t.id+'"><figure><img src="/assets/course-examples/'+t.id+'-0.png" width="720" height="420" loading="lazy" alt="'+escape(t.steps[0])+'"><figcaption data-ce-caption>Шаг 1 из 5. '+math(t.steps[0])+'</figcaption></figure><div class="ce-controls" hidden><button type="button" data-ce-action="play" aria-pressed="false">▶ Смотреть GIF</button><button type="button" data-ce-action="prev" aria-label="Предыдущий кадр" disabled>←</button><button type="button" data-ce-action="next" aria-label="Следующий кадр">→</button><span data-ce-counter>Кадр 1 / 5</span></div><ol class="ce-steps">'+t.steps.map(s=>'<li>'+math(s)+'</li>').join('')+'</ol></div><button type="button" data-ce-return>Вернуться к своей задаче</button>';
    let marked=false;
    function mark(){if(marked||!details.isConnected)return;onHelp?.();marked=true;}
    // Record before the disclosure opens, including a rapid submit after a click.
    details.querySelector('summary').addEventListener('click',()=>{if(!details.open)mark();});
    details.addEventListener('toggle',()=>{if(details.open)mark();});
    details.querySelector('[data-ce-return]').onclick=()=>{details.open=false;stop();const input=anchor.querySelector('input:not([type="hidden"]),textarea,button');input?.focus({preventScroll:true});anchor.scrollIntoView?.({block:'start'});};
    anchor.insertAdjacentElement('afterend',details);init(details);return details;
  }
  function catalogue(host,course) {
    const list=items.filter(t=>t.course===course);if(!list.length||!host)return;
    const anchor=host.querySelector('.lr-next')||host.querySelector('.lead')||host.querySelector('h1');if(!anchor)return;
    const section=document.createElement('section');section.className='ce-native-link';
    section.innerHTML='<h2>Понять на одном примере</h2><ul class="ce-links">'+list.map(t=>'<li><a href="'+escape(t.url)+'">'+escape(t.short)+'</a></li>').join('')+'</ul>';
    anchor.insertAdjacentElement('afterend',section);
  }
  root.MathExamCourseExamples={mount,equal,catalogue};
  init(document);
  root.addEventListener('hashchange',()=>stop());root.addEventListener('pagehide',()=>stop());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  root.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>stop());
  new MutationObserver(()=>{if(playing&&!playing.el.isConnected)stop();}).observe(document.body,{childList:true,subtree:true});
})(window);
