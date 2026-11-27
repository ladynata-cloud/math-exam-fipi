/* Cabinet lesson controls. Only descriptors leave the picker; the account API
 * creates pupil attempts after the teacher explicitly starts the lesson. */
(function(root){
  'use strict';
  const MAX_MATERIALS=12;
  const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const families={'ege-path':'7 класс и ЕГЭ · база','oge-basics':'Математическая основа','oge-public':'ОГЭ','vilenkin6-textbook':'6 класс · Виленкин','vilenkin6-part1':'6 класс · практика','atanasyan-7-9':'Геометрия · Атанасян','motion-grade6':'Задачи на движение'};
  const ratioLessonIds=[
    'vilenkin6-textbook:v6-book-3-32',
    'vilenkin6-textbook:v6-book-3-41-d',
    'vilenkin6-textbook:v6-book-3-42-c',
    'vilenkin6-textbook:v6-book-3-65'
  ];
  function findItem(catalog,source){
    return catalog.items.find(item=>item.trainerId===source.trainerId&&item.contentId===source.contentId);
  }
  function materialPicker(host,{catalog,initial=[],limit=MAX_MATERIALS,isCurrent=()=>true}={}){
    const items=(catalog?.items||[]).filter(item=>item.url&&item.trainerId!=='board');
    const selected=initial.slice(0,limit).map(source=>clone(source));
    let alive=true;
    host.classList.add('lesson-material-picker');
    host.innerHTML='<div class="lesson-picker-heading"><h3>На этот урок</h3><span data-lesson-material-count></span></div><ol data-lesson-materials></ol><label>Найти задание<input type="search" data-lesson-material-search placeholder="Тема или номер задания" autocomplete="off"></label><label>Курс<select data-lesson-material-family><option value="">Все подключённые курсы</option></select></label><div class="lesson-material-results" data-lesson-material-results></div><p class="form-hint" data-lesson-material-message role="status"></p>';
    const list=host.querySelector('[data-lesson-materials]'),results=host.querySelector('[data-lesson-material-results]'),search=host.querySelector('[data-lesson-material-search]'),family=host.querySelector('[data-lesson-material-family]'),message=host.querySelector('[data-lesson-material-message]');
    for(const key of [...new Set(items.map(item=>item.trainerId))]){
      const option=document.createElement('option');option.value=key;option.textContent=families[key]||key;family.append(option);
    }
    const current=()=>alive&&host.isConnected&&isCurrent();
    const ratioMaterials=ratioLessonIds.map(id=>items.find(item=>item.id===id));
    let ratioButton;
    function missingRatioMaterials(){
      return ratioMaterials.filter(item=>!selected.some(source=>source.trainerId===item.trainerId&&source.contentId===item.contentId));
    }
    if(limit>=ratioLessonIds.length && ratioMaterials.every(Boolean)){
      ratioButton=document.createElement('button');
      ratioButton.type='button';
      ratioButton.dataset.lessonRatioPreset='';
      ratioButton.textContent='Добавить подборку «Отношения и пропорции» · 6 класс';
      const boardLink=document.createElement('a');
      boardLink.href='https://mathexam.space/trainers/trainer-board.html?trainer='+encodeURIComponent('/trainers/vilenkin6-proportion/index.html?task=ratio-division-start');
      boardLink.target='_blank';boardLink.rel='noopener noreferrer';
      boardLink.textContent='Открыть «Коридор» на отдельной общей доске ↗';
      const boardHelp=document.createElement('p');
      boardHelp.className='form-hint';
      boardHelp.append(boardLink,document.createTextNode('. Ссылку ученику выдаёт доска. Подборка кабинета открывается кнопкой «Начать урок».'));
      list.before(ratioButton,boardHelp);
      ratioButton.onclick=()=>{
        if(!current())return;
        const missing=missingRatioMaterials();
        if(!missing.length)return;
        if(selected.length+missing.length>limit){
          message.textContent='Для подборки нужно свободных мест: '+missing.length+'. Сейчас свободно: '+(limit-selected.length)+'.';
          return;
        }
        selected.push(...missing.map(({trainerId,contentId})=>({trainerId,contentId})));
        drawSelected();drawResults();
        message.textContent='Добавлено заданий: '+missing.length+'. Порядок можно изменить в списке.';
      };
    }
    const title=source=>source.title||findItem(catalog,source)?.title||'Выбранное задание';
    function drawSelected(){
      if(ratioButton)ratioButton.disabled=missingRatioMaterials().length===0;
      host.querySelector('[data-lesson-material-count]').textContent=selected.length+' / '+limit;
      list.innerHTML=selected.map((source,index)=>'<li><span><b>'+E(title(source))+'</b>'+(source.sourceAttemptId||Number.isInteger(source.seed)?'<small>Точное выбранное условие</small>':'')+'</span><div class="lesson-material-order"><button type="button" data-lesson-material-move="'+index+'" aria-label="Выше: '+E(title(source))+'" '+(index===0?'disabled':'')+'>↑</button><button type="button" data-lesson-material-remove="'+index+'" aria-label="Убрать: '+E(title(source))+'">×</button></div></li>').join('');
      list.hidden=!selected.length;
      list.querySelectorAll('[data-lesson-material-remove]').forEach(button=>button.onclick=()=>{if(!current())return;selected.splice(Number(button.dataset.lessonMaterialRemove),1);drawSelected();drawResults();});
      list.querySelectorAll('[data-lesson-material-move]').forEach(button=>button.onclick=()=>{if(!current())return;const index=Number(button.dataset.lessonMaterialMove);if(index<1)return;[selected[index-1],selected[index]]=[selected[index],selected[index-1]];drawSelected();});
    }
    function drawResults(){
      const query=search.value.trim().toLocaleLowerCase('ru'),tokens=query.split(/\s+/).filter(Boolean);
      const matches=items.filter(item=>(!family.value||item.trainerId===family.value)&&tokens.every(token=>(item.title+' '+item.contentId+' '+(families[item.trainerId]||'')).toLocaleLowerCase('ru').includes(token)));
      const visible=matches.slice(0,query||family.value?16:5);
      results.innerHTML=visible.map(item=>'<button type="button" data-lesson-material-result="'+E(item.id)+'" '+(selected.length>=limit?'disabled':'')+'><span>'+E(item.title)+'<small>'+E(families[item.trainerId]||'Учебный тренажёр')+'</small></span><span aria-hidden="true">+</span></button>').join('');
      message.textContent=selected.length>=limit?'В подборке уже '+limit+' заданий. Уберите одно, чтобы добавить другое.':!matches.length?'Ничего не найдено. Попробуйте другую тему или номер.':matches.length>visible.length?'Уточните тему или курс: показаны первые '+visible.length+' заданий.':'Задания появятся у ученика после начала урока.';
      results.querySelectorAll('[data-lesson-material-result]').forEach(button=>button.onclick=()=>{
        if(!current()||selected.length>=limit)return;
        const item=catalog.get(button.dataset.lessonMaterialResult);if(!item||!items.includes(item))return;
        selected.push({trainerId:item.trainerId,contentId:item.contentId});drawSelected();drawResults();
      });
    }
    search.addEventListener('input',drawResults);family.addEventListener('change',drawResults);drawSelected();drawResults();
    return {value:()=>selected.map(source=>source.sourceAttemptId?{sourceAttemptId:source.sourceAttemptId}:{trainerId:source.trainerId,contentId:source.contentId,...(Number.isInteger(source.seed)?{seed:source.seed}:{})}),destroy(){alive=false;search.removeEventListener('input',drawResults);family.removeEventListener('change',drawResults);}};
  }
  function queueMarkup(seat,{teacher=false,busy=false}={}){
    const materials=seat?.materials||[],active=seat?.attemptId;
    if(!teacher)return materials.length?'<p class="lesson-material-progress">На уроке: задание '+Math.max(1,materials.findIndex(item=>item.attemptId===active)+1)+' из '+materials.length+'</p>':'';
    return '<div class="lesson-queue-heading"><strong>На этот урок <span>'+materials.length+' / '+MAX_MATERIALS+'</span></strong><button type="button" class="small" data-lesson-add-material '+(busy||materials.length>=MAX_MATERIALS?'disabled':'')+'>+ Задание</button></div><div class="lesson-queue-items">'+materials.map((item,index)=>'<button type="button" data-lesson-material="'+E(item.attemptId)+'" aria-current="'+(item.attemptId===active?'step':'false')+'" '+(busy||item.attemptId===active?'disabled':'')+' title="'+E(item.title)+'"><span>'+String(index+1)+'</span>'+E(item.title||'Задание')+'</button>').join('')+'</div>';
  }
  function joinEntry(host,lessons){
    host.querySelector('#lesson-join-entry')?.remove();
    const latest=[...(lessons||[])].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(!latest)return;
    const section=document.createElement('section');section.id='lesson-join-entry';section.className='lesson-join-entry';
    const date=new Date(latest.createdAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
    section.innerHTML='<div><span class="eyebrow">ЗАНЯТИЕ С ПРЕПОДАВАТЕЛЕМ</span><h2>'+E(latest.title)+'</h2><p>'+E(date)+'</p></div><a id="lesson-join-link" class="button primary" href="#lesson='+encodeURIComponent(latest.id)+'">Открыть урок →</a>';
    host.prepend(section);
  }
  root.LearningLessonWorkspace={MAX_MATERIALS,materialPicker,queueMarkup,joinEntry};
})(window);
