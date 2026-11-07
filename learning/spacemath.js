/* Account-owned construction library. Credentials stay in the cabinet. */
(function(root){
  'use strict';
  const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>new Date(value).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

  function mount(host,context){
    let alive=true,busy=false,models=[],pending=null;
    const teacher=context.account.role==='teacher';
    const learner=teacher?(context.learnerId||''):context.account.id;
    const current=()=>alive&&host.isConnected&&(context.isCurrent?.()??true);
    const scope=learner&&learner!==context.account.id?learner:'';
    const student=context.students?.find(item=>item.id===scope);
    host.classList.add('spacemath-library');
    host.innerHTML='<header class="page-heading"><div><p class="eyebrow">СОВМЕСТНЫЕ ПОСТРОЕНИЯ</p><h1>SpaceMath</h1><p>'+E(teacher?(student?'Построения ученика: '+student.name:'Ваши личные модели для подготовки к урокам.'):'Ваши сохранённые геометрические модели.')+'</p></div></header>'+
      '<section class="panel spacemath-library-create"><form data-spacemath-create><label>Название построения<input name="title" maxlength="120" value="Новое построение" required autocomplete="off"></label><button type="submit" class="primary">Новое построение</button></form>'+
      (teacher?'<label class="spacemath-library-owner">Чьи модели<select data-spacemath-owner><option value="">Мои личные модели</option>'+(context.students||[]).map(item=>'<option value="'+E(item.id)+'" '+(scope===item.id?'selected':'')+'>'+E(item.name)+'</option>').join('')+'</select></label>':'')+
      '<p class="form-hint">Изменения сохраняются в кабинете. Построение можно продолжить на следующем уроке.</p></section><p role="status" aria-live="polite" data-spacemath-status>Открываем сохранённые модели…</p><div class="spacemath-library-list" data-spacemath-list></div>';
    const status=host.querySelector('[data-spacemath-status]'),list=host.querySelector('[data-spacemath-list]'),form=host.querySelector('[data-spacemath-create]');
    function message(text,error=false){if(!current())return;status.textContent=text;status.classList.toggle('error',error);}
    function disabled(value){busy=value;if(!current())return;host.querySelectorAll('button,input,select').forEach(node=>{node.disabled=value;});}
    function route(id){context.navigate('attempt='+encodeURIComponent(id));}
    async function create(source){
      if(!current()||busy)return;
      const title=source?'Копия · '+source.title:form.elements.title.value.trim();
      if(!title){message('Введите название построения.',true);return;}
      const body={...(scope?{learnerId:scope}:{}),title:title.slice(0,120),...(source?{sourceAttemptId:source.id}:{})};
      const fingerprint=JSON.stringify(body);
      if(!pending||pending.fingerprint!==fingerprint)pending={fingerprint,body:{opId:crypto.randomUUID(),...body}};
      disabled(true);message(source?'Сохраняем копию…':'Создаём построение…');
      try{
        const result=await context.api('/spacemath/models',{method:'POST',body:JSON.stringify(pending.body)});
        if(!current())return;
        if(!result.attempt?.id)throw Error('MODEL_NOT_CREATED');
        pending=null;route(result.attempt.id);
      }catch(_){message('Не удалось сохранить. Проверьте связь и повторите: повторный запрос не создаст лишнюю копию.',true);}
      finally{disabled(false);}
    }
    function render(){
      if(!current())return;
      list.innerHTML=models.length?models.map(model=>'<article class="panel spacemath-library-model"><div><h2>'+E(model.title||'Построение')+'</h2><p>'+E(model.objectCount??0)+' объектов · '+E(date(model.updatedAt))+'</p></div><div class="actions"><button type="button" class="primary" data-spacemath-open="'+E(model.id)+'">Открыть</button><button type="button" data-spacemath-copy="'+E(model.id)+'">Создать копию</button>'+(teacher?'<button type="button" data-spacemath-lesson="'+E(model.id)+'">На урок</button>':'')+'</div></article>').join(''):'<section class="empty"><h2>Здесь будут ваши построения</h2><p>Создайте первую модель. Точки и геометрические связи сохранятся вместе с ней.</p></section>';
      list.querySelectorAll('[data-spacemath-open]').forEach(button=>button.onclick=()=>{if(current()&&!busy)route(button.dataset.spacemathOpen);});
      list.querySelectorAll('[data-spacemath-copy]').forEach(button=>button.onclick=()=>{const model=models.find(item=>item.id===button.dataset.spacemathCopy);if(model)create(model);});
      list.querySelectorAll('[data-spacemath-lesson]').forEach(button=>button.onclick=()=>{if(current()&&!busy)context.onLesson?.({sourceAttemptId:button.dataset.spacemathLesson,...(scope?{learnerId:scope}:{})});});
      if(busy)disabled(true);else message(models.length?'Модели сохранены в кабинете.':'');
    }
    form.addEventListener('submit',event=>{event.preventDefault();create();});
    host.querySelector('[data-spacemath-owner]')?.addEventListener('change',event=>{if(current()&&!busy)context.navigate('spacemath'+(event.target.value?'&learner='+encodeURIComponent(event.target.value):''));});
    context.api('/spacemath/models'+(scope?'?learnerId='+encodeURIComponent(scope):'')).then(result=>{
      if(!current())return;models=result.models||[];render();
    }).catch(()=>{if(!current())return;message('Не удалось открыть модели. Попробуйте обновить список.',true);const button=document.createElement('button');button.type='button';button.textContent='Обновить список';button.onclick=()=>{if(current())context.navigate('spacemath'+(scope?'&learner='+encodeURIComponent(scope):''));};list.append(button);});
    return()=>{alive=false;host.classList.remove('spacemath-library');};
  }
  function mountLessonPicker(host,context){
    let alive=true,busy=false;
    const receipts=new Map(),current=()=>alive&&host.isConnected&&(context.isCurrent?.()??true);
    host.innerHTML='<p>Создайте чистое поле, продолжите построение ученика или добавьте копию своей модели.</p><button type="button" class="primary" data-spacemath-new>Новое построение</button><p role="status" aria-live="polite" data-spacemath-picker-status>Открываем сохранённые модели…</p><div class="spacemath-library-list" data-spacemath-picker-models></div>';
    const status=host.querySelector('[data-spacemath-picker-status]'),list=host.querySelector('[data-spacemath-picker-models]');
    const disable=value=>{busy=value;if(current())host.querySelectorAll('button').forEach(button=>{button.disabled=value;});};
    async function select(choice){
      if(!current()||busy)return;
      const key=JSON.stringify(choice);if(!receipts.has(key))receipts.set(key,{});
      disable(true);status.textContent='Открываем построение на уроке…';
      try{if(!await context.onSelect(choice,receipts.get(key))&&current())status.textContent='Не удалось добавить построение. Повторите действие после восстановления связи.';}
      catch(_){if(current())status.textContent='Не удалось добавить построение. Повторите действие после восстановления связи.';}
      finally{disable(false);}
    }
    host.querySelector('[data-spacemath-new]').onclick=()=>select({kind:'new'});
    Promise.all([context.api('/spacemath/models'),context.api('/spacemath/models?learnerId='+encodeURIComponent(context.learnerId))]).then(([privateModels,pupilModels])=>{
      if(!current())return;
      const sections=[{title:'Построения ученика',models:pupilModels.models||[],kind:'continue',action:'Продолжить'},{title:'Мои модели',models:privateModels.models||[],kind:'copy',action:'Добавить копию'}];
      for(const section of sections){
        if(!section.models.length)continue;
        const heading=document.createElement('h3');heading.textContent=section.title;list.append(heading);
        for(const model of section.models){
          const article=document.createElement('article');article.className='panel spacemath-library-model';
          article.innerHTML='<div><h2>'+E(model.title||'Построение')+'</h2><p>'+E(model.objectCount??0)+' объектов · '+E(date(model.updatedAt))+'</p></div><button type="button" data-spacemath-saved="'+E(model.id)+'">'+section.action+'</button>';
          article.querySelector('button').onclick=()=>select({kind:section.kind,attemptId:model.id});list.append(article);
        }
      }
      if(busy)disable(true);else status.textContent=list.children.length?'':'Сохранённых моделей пока нет. Начните с чистого поля.';
    }).catch(()=>{if(current()&&!busy)status.textContent='Не удалось открыть список моделей. Можно создать новое построение или открыть это окно повторно.';});
    return()=>{alive=false;};
  }
  root.LearningSpaceMath={mount,mountLessonPicker};
})(window);
