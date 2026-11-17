(function(root){
  'use strict';
  // Stable legacy trainer groups. Public labels and new links use the shared exam map.
  const bank=(numbers,path,title,help)=>({numbers,path,title,help});
  const banks=[
    bank([1],'/ege-profil/trainers/planimetry-t1.html','Планиметрия без промахов',['geo-angles','bridge-triangle','bridge-roots']),
    bank([1],'/ege-profil/trainers/pryamougolny-treugolnik-trenazher.html','Прямоугольный треугольник',['bridge-triangle','bridge-equations']),
    bank([1],'/ege-profil/trainers/planimetry-yashchenko-t1.html','Планиметрия по Ященко · 2026',['geo-angles','bridge-triangle','geo-area']),
    bank([2],'/ege-profil/trainers/vectors-t2.html','Векторы: разные типы задач',['bridge-coordinates','bridge-signs','bridge-roots']),
    bank([2],'/ege-profil/trainers/vectors-yashchenko-t2.html','Векторы по Ященко · 2026',['bridge-coordinates','bridge-signs']),
    bank([3],'/ege-profil/trainers/stereo/index.html','Стереометрия с объёмными моделями',['geo-right','geo-area','bridge-roots']),
    bank([4,5],'/ege-profil/trainers/probability-t45.html','Вероятность: события и сочетания',['bridge-fractions','prob-count']),
    bank([7,8],'/ege-profil/trainers/trigonometry.html','Тригонометрия: от треугольника к окружности',['bridge-triangle','bridge-signs','bridge-fractions']),
    bank([8],'/ege-profil/trainers/trig-sum-to-product.html','Тригонометрия: сумма и произведение',['bridge-triangle','algebra-double-angle']),
    bank([8],'/ege-profil/trigonometry/index.html','Подробный курс тригонометрии',['bridge-triangle','bridge-signs']),
    bank([9],'/ege-profil/trainers/derivative-t8.html','Производная по графику',['bridge-coordinates','fn-line','expr-powers']),
    bank([10,11],'/ege-profil/trainers/applied-t910.html','Формулы и текстовые задачи',['bridge-equations','bridge-fractions']),
    bank([9,12],'/ege-profil/trainers/functions-t1112.html','Графики и наибольшее значение',['bridge-coordinates','bridge-equations','expr-powers']),
    bank([13],'/ege-profil/trainers/finance.html','Финансовые задачи: разные схемы',['bridge-fractions','bridge-equations','applied-percent']),
    bank([16],'/trainers/ege-profile/inequalities/index.html','Неравенства: выбор темы и пошаговые решения',['bridge-signs','bridge-equations','expr-powers','expr-logarithms']),
    bank([16],'/trainers/ege-profile/log-inequalities/lesson.html','Логарифм с переменным основанием',['expr-logarithms','expr-powers','bridge-signs']),
    bank([16],'/trainers/ege-profile/log-inequalities/nested.html','Внутренний и внешний логарифмы',['expr-logarithms','expr-powers','bridge-signs']),
    bank([16],'/trainers/ege-profile/log-inequalities/index.html','48 вариантов логарифмических неравенств',['expr-logarithms','expr-powers','bridge-signs']),
    bank([16],'/ege-profil/trainers/interval-method.html','Метод интервалов',['bridge-signs','bridge-equations']),
    bank([16],'/ege-profil/trainers/inequalities.html','Курс неравенств и рационализация',['bridge-signs','expr-powers','expr-logarithms'])
  ];
  const helpTitles={
    'geo-angles':'Углы треугольника','bridge-triangle':'Синус и косинус в прямоугольном треугольнике',
    'bridge-roots':'Квадратные корни','bridge-equations':'Раскрыть скобки и найти x',
    'bridge-coordinates':'Координаты','bridge-signs':'Знаки чисел','bridge-fractions':'Дроби',
    'geo-right':'Теорема Пифагора','geo-area':'Площадь фигуры','prob-count':'Простая вероятность',
    'algebra-double-angle':'Формулы двойного угла','fn-line':'График прямой','expr-powers':'Степени',
    'applied-percent':'Проценты','expr-logarithms':'Свойства логарифмов'
  };
  const extraPages={
    '/ege-profil/trainers/stereo/trainer.html':'/ege-profil/trainers/stereo/index.html',
    '/trainers/ege-profile/inequalities/lesson.html':'/trainers/ege-profile/inequalities/index.html'
  };
  const entry='/ege-profil/start/index.html';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Keep the registered page stable; select the requested existing topic when
  // a single trainer covers more than one current course number.
  const topics={
    '/ege-profil/trainers/applied-t910.html':{10:'formulas',11:'text'},
    '/ege-profil/trainers/functions-t1112.html':{9:'extrema',12:'graphs'},
    '/ege-profil/trainers/probability-t45.html':{4:'basic',5:'compound'},
    '/ege-profil/trainers/trigonometry.html':{7:'equations',8:'values'}
  };
  function resourceHref(b,number){const topic=topics[b.path]?.[Number(number)];return b.path+(topic?'?topic='+topic:'');}
  function renderResources(items,href){
    if(!items.length)return '';
    return '<details class="panel course-resources"><summary>Ещё тренажёры этой темы</summary><p>Дополнительная практика. Справка открывается внутри тренажёра по запросу.</p><ul class="resource-list">'+items.map(b=>'<li><a data-course-resource href="'+href(b)+'">'+esc(b.title)+'</a></li>').join('')+'</ul></details>';
  }
  function resources(number){return renderResources(banks.filter(b=>b.numbers.includes(Number(number))),b=>resourceHref(b,number));}
  function resourcesFor(value){
    if(!value)return '';
    const legacy=value.legacyStart??value.legacyNumber??(value.legacyPartTwo===16?16:null);
    let items=banks.filter(b=>b.numbers.includes(Number(legacy)));
    if(value.number===8)items=items.filter(b=>b.path.endsWith('derivative-t8.html'));
    if(value.number===12)items=items.filter(b=>b.path.endsWith('functions-t1112.html'));
    if(value.id==='integral')items=[];
    const writtenUrl=(root.MathExamTrainerOffline?.origin||'')+'/ege-profil/part-two/#fipi/2027/16';
    const writtenLink=value.number===16?'<p><a class="button quiet" href="'+writtenUrl+'">Решить №16 письменно</a></p>':'';
    return writtenLink+renderResources(items,b=>resourceHref(b,legacy));
  }
  function bankEntries(b){
    const map=root.ProfileExamMap||(typeof module!=='undefined'&&module.exports?require('../exam-map.js'):null);
    if(!map)return [];
    return b.numbers.map(number=>number===16?map.get(15):number===9?map.get(b.path.endsWith('derivative-t8.html')?8:12):map.fromLegacyStart(number)).filter(Boolean);
  }
  function card16(){return '<article class="exam-card" data-course-extra="15"><span class="exam-number">15</span><h2>Неравенства</h2><p>Обычные и логарифмические неравенства. Разбираем ограничения, метод интервалов и каждый шаг решения.</p><div class="exam-card-actions"><a class="button" href="#fipi/2027/15">Выбрать задачу</a></div></article>';}
  root.ProfileCourse={banks,extraPages,helpTitles,resources,resourcesFor,resourceHref,bankEntries,card16,entry};
  if(typeof module!=='undefined')module.exports=root.ProfileCourse;
  if(typeof document==='undefined')return;
  if(window.self!==window.top&&new URLSearchParams(location.search).get('course-help')==='1')document.documentElement.classList.add('course-help');
  function mount(){
    // Embedded board/cabinet trainers retain their existing navigation boundary.
    if(window.self!==window.top)return;
    let pathname=location.pathname;if(pathname.endsWith('/'))pathname+='index.html';
    const b=banks.find(b=>b.path===(extraPages[pathname]||pathname));
    if(!b||document.getElementById('profile-course-nav'))return;
    document.body.classList.add('profile-course-page');
    const nav=document.createElement('nav');nav.id='profile-course-nav';nav.setAttribute('aria-label','Навигация единого курса');
    nav.innerHTML='<a href="'+entry+'#calm" aria-label="Все задания курса: №1–19 и дополнительные темы">← Курс</a><span>'+bankEntries(b).map(value=>'<a href="'+entry+root.ProfileExamMap.hash(value)+'">'+esc(value.number?'Темы №'+value.number:value.title)+'</a>').join(' · ')+'</span><button type="button" id="profile-course-help">Вспомнить основу</button>';
    document.body.prepend(nav);
    // This trainer's formerly fixed teacher switch would cover the new help
    // button on desktop. Retain the same node and handlers in the navigation.
    const teacherToggle=document.getElementById('teachToggle');
    if(teacherToggle)nav.append(teacherToggle);
    // Keep the trainer and its in-memory draft mounted while the pupil repeats a rule.
    // No attempt, account, score or trainer storage is modified here.
    const dialog=document.createElement('dialog');dialog.id='profile-course-support';dialog.setAttribute('aria-labelledby','profile-course-support-title');
    dialog.innerHTML='<div class="profile-support-head"><h2 id="profile-course-support-title">Вспомнить основу</h2><button type="button" id="profile-course-return">Вернуться к моей задаче</button></div><p>Выберите то, что сейчас мешает решению. Ваша задача и введённый ответ остаются на месте.</p><div class="profile-support-topics">'+b.help.map(id=>'<button type="button" data-course-help="'+id+'">'+esc(helpTitles[id])+'</button>').join('')+'</div><p class="profile-support-hint">После повторения нажмите «Вернуться к моей задаче».</p><iframe hidden title="Повторение школьной темы"></iframe>';
    document.body.append(dialog);
    const open=nav.querySelector('button'),close=dialog.querySelector('#profile-course-return'),frame=dialog.querySelector('iframe');
    open.onclick=()=>dialog.showModal();close.onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>open.focus());
    dialog.querySelectorAll('[data-course-help]').forEach(button=>{
      button.onclick=()=>{
        // Notify the active trainer synchronously, before showing any school
        // material. Closing the dialog must not erase that assistance evidence.
        document.dispatchEvent(new CustomEvent('profile-course-help-requested',{detail:{path:pathname,lessonId:button.dataset.courseHelp}}));
        dialog.querySelectorAll('[data-course-help]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
        frame.title='Повторение: '+helpTitles[button.dataset.courseHelp];
        frame.src=entry+'?course-help=1#lesson/'+button.dataset.courseHelp;frame.hidden=false;
      };
    });
    frame.addEventListener('load',()=>{
      try{frame.contentDocument.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});}catch(_){}
    });
  }
  function ready(){
    if(root.ProfileExamMap)return mount();
    // Older trainer pages keep their stable script bindings. Fetch the same
    // shared map before rendering topic links, including the nested stereo pages.
    // Skill-map can start during the same DOMContentLoaded event: both consumers
    // share the pending request and adopt a script already supplied by the page.
    if(!root.ProfileExamMapReady)root.ProfileExamMapReady=new Promise(resolve=>{
      let script=[...document.querySelectorAll('script[src]')].find(script=>new URL(script.src,location.href).pathname==='/ege-profil/exam-map.js');
      const existing=!!script;
      if(!script){script=document.createElement('script');script.src='/ege-profil/exam-map.js?v=20261115-fipi-map';script.async=true;}
      const settled=()=>resolve(root.ProfileExamMap||null);
      script.addEventListener('load',settled,{once:true});
      script.addEventListener('error',()=>resolve(null),{once:true});
      if(!existing)document.head.append(script);
      else if(document.readyState==='complete')settled();
      // A supplied deferred script may have failed before these listeners.
      // Window load also waits for a still-pending async script; DOMContentLoaded
      // alone would incorrectly settle that successful request as unavailable.
      else root.addEventListener('load',settled,{once:true});
    });
    root.ProfileExamMapReady.then(mount);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})(typeof globalThis!=='undefined'?globalThis:this);
