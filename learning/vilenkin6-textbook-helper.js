/* Source-based help for an owned saved textbook task. This is a course reader,
 * not a free-chat model: only server-acknowledged course material is rendered. */
(function(root){
  'use strict';
  let sequence=0;
  const node=(tag,text,attrs={})=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;};
  const signature=value=>value&&JSON.stringify([value.id,value.contentId,value.sourceRevision,value.step,value.workMode,value.completed]);
  function mathText(parent,value){
    // Build text nodes and a fraction bar; authored strings are never HTML.
    let start=0;const pattern=/\[\[([^\[\]\n]+)\/([^\[\]\n]+)\]\]/g;
    for(const match of String(value).matchAll(pattern)){
      parent.append(document.createTextNode(value.slice(start,match.index)));
      const fraction=node('span',undefined,{class:'fraction',role:'math','aria-label':match[1]+' разделить на '+match[2]});
      fraction.append(node('span',match[1]),node('span',match[2]));parent.append(fraction);start=match.index+match[0].length;
    }
    parent.append(document.createTextNode(value.slice(start)));
  }
  function mount(host,context){
    let alive=true,open=false,busy=false,serial=0,lastSignature='';
    const current=()=>alive&&host.isConnected&&context.isCurrent();
    const snapshot=()=>{try{return current()?context.snapshot():null;}catch(_){return null;}};
    const permitted=()=>current()&&context.canAsk();
    const id='vilenkin-source-help-'+(++sequence),panel=node('section',undefined,{class:'panel cabinet-assistant vilenkin-source-helper',role:'dialog','aria-modal':'false','aria-labelledby':id+'-title',id});
    const header=node('div',undefined,{class:'cabinet-assistant-dock-header'}),close=node('button','Свернуть',{type:'button','data-source-help-close':''});
    header.append(node('h2','Помощник по заданию',{id:id+'-title'}),close);
    const title=node('p',''),explanation=node('p','Подсказки из материалов курса. Открывай помощь по мере необходимости.',{'data-source-help-intro':''});
    const actions=node('div',undefined,{class:'actions cabinet-assistant-actions'}),status=node('p','',{role:'status','aria-live':'polite'}),answers=node('div',undefined,{class:'cabinet-assistant-answers'}),buttons={};
    for(const [mode,label]of [['hint','Небольшая подсказка'],['step','Разобрать текущий шаг'],['solution','Показать всё решение']]){
      const button=node('button',label,{type:'button','data-source-help':mode,...(mode==='hint'?{class:'primary'}:{})});button.addEventListener('click',()=>ask(mode));actions.append(button);buttons[mode]=button;
    }
    panel.append(header,title,explanation,actions,status,answers);
    const launcher=node('button','Помощник по заданию',{type:'button',class:'cabinet-assistant-launcher','aria-controls':id,'aria-expanded':'false','data-source-help-launcher':''});
    host.replaceChildren(panel,launcher);host.hidden=false;host.classList.add('cabinet-assistant-dock');panel.hidden=true;
    function setOpen(value){if(!current())return;open=value;if(!open)serial++;panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));(open?close:launcher).focus({preventScroll:true});refresh();}
    launcher.addEventListener('click',()=>setOpen(!open));close.addEventListener('click',()=>setOpen(false));
    const escape=event=>{if(event.target?.closest?.('dialog[open]')&&!host.contains(event.target))return;if(open&&event.key==='Escape'&&current()){event.preventDefault();setOpen(false);}};
    document.addEventListener('keydown',escape);
    function refresh(){
      if(!current())return;
      const value=snapshot(),key=signature(value);
      if(key!==lastSignature){lastSignature=key;serial++;answers.replaceChildren();status.textContent='';}
      title.textContent=value?.title||'Текущее задание курса';
      for(const [mode,button]of Object.entries(buttons)){button.hidden=!!value?.completed&&mode!=='solution';button.disabled=busy||!value||!permitted();}
      buttons.solution.textContent=value?.completed?'Посмотреть решение после ответа':'Показать всё решение';
      buttons.step.textContent=value?.workMode==='independent'?'Разобрать первый шаг':'Разобрать текущий шаг';
      if(!busy&&!permitted()){answers.replaceChildren();status.textContent='Подсказки доступны после сохранения работы, когда управление у тебя.';}
      explanation.hidden=answers.childElementCount>0;
    }
    async function ask(mode){
      const before=snapshot();if(busy||!before||!permitted())return;
      busy=true;const turn=++serial;status.textContent='Сохраняем обращение за помощью…';refresh();
      try{
        const result=await context.ask(mode,before);
        if(!current()||turn!==serial||!open||!permitted()||signature(before)!==signature(snapshot()))return;
        if(!result||result.contentId!==before.contentId||result.sourceRevision!==before.sourceRevision||result.mode!==mode||result.step!==before.step||result.workMode!==before.workMode||result.completed!==before.completed||
          typeof result.title!=='string'||result.title.length>500||typeof result.prompt!=='string'||result.prompt.length>2048||!Array.isArray(result.lines)||!result.lines.length||result.lines.length>16||result.lines.some(line=>typeof line!=='string'||line.length>2048))throw Error('SOURCE_HELP_INVALID');
        const answer=node('article',undefined,{class:'cabinet-assistant-answer','data-source-help-answer':''});
        answer.append(node('h3',mode==='hint'?'Подсказка':mode==='step'?(before.workMode==='independent'?'С чего начать: первый шаг':'Разбор текущего шага'):'Решение для проверки'));
        const condition=node('p',undefined,{'data-source-help-condition':''});condition.append(node('strong','Задание. '));mathText(condition,result.prompt);answer.append(condition);
        for(const line of result.lines){const p=node('p');mathText(p,line);answer.append(p);}answers.replaceChildren(answer);
        status.textContent=before.completed?'Отметка за выполненное задание сохранена.':'Помощь сохранена. Продолжи решение в том же задании.';
      }catch(_){if(current()&&turn===serial&&open){answers.replaceChildren();status.textContent='Не удалось подтвердить помощь. Проверь сохранение работы и попробуй снова.';}}
      finally{busy=false;if(current()&&turn!==serial)status.textContent='';refresh();}
    }
    function destroy(){alive=false;serial++;document.removeEventListener('keydown',escape);host.replaceChildren();host.hidden=true;host.classList.remove('cabinet-assistant-dock');}
    destroy.refresh=refresh;destroy.open=()=>setOpen(true);destroy.close=()=>setOpen(false);refresh();return destroy;
  }
  root.VilenkinTextbookHelper={mount};
})(window);
