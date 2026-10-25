/* Shared native practice for OGE 6–9. Only a bank index and bounded semantic
 * actions travel. Every condition, step, diagnostic and model is rebuilt by
 * the local trainer; neither answer keys nor markup are accepted from peers. */
(function (root, doc) {
  'use strict';
  function start(){
  const page=Number(doc.body.dataset.ogeFoundation);
  if(!root.OgeCourseSharedMode||![6,7,8,9].includes(page)||new URLSearchParams(root.location.search).get('selftest')==='1')return;
  const bank=page===6?TASKS:BANK, count=bank.length, auxiliary=[7,8].includes(page)?root.OgeCourseAlgebraShared:null;
  const ignored='.oca-exploration,.oca-reference,.oca-work,.oca-instruction';
  const copy=v=>JSON.parse(JSON.stringify(v));
  const bytes=v=>new Blob([JSON.stringify(v)]).size;
  let task=0,actions=[],applying=false,notify=()=>{},previous='';
  const shell=doc.createElement('main');shell.id='oge-foundation-room';
  const heading=doc.createElement('h1');heading.textContent='ОГЭ №'+page+' · совместная тренировка';
  const note=doc.createElement('p');note.textContent='Общий банк: '+count+' заданий. Ответы, шаги и исследования видны обоим участникам. Личный зачёт не изменяется. Генераторы и зачёт доступны в отдельном тренажёре.';
  const toolbar=doc.createElement('div');toolbar.className='oge-foundation-toolbar';
  const previousButton=doc.createElement('button'),nextButton=doc.createElement('button'),restart=doc.createElement('button'),select=doc.createElement('select');
  previousButton.textContent='← Предыдущее';nextButton.textContent='Следующее →';restart.textContent='Начать это задание заново';
  select.setAttribute('aria-label','Общее задание');
  bank.forEach((t,i)=>{const option=doc.createElement('option');option.value=String(i);option.textContent='№ '+(i+1)+(page===6?' · '+catLabel(t.cat):page===7?' · '+typeName(typeOf(t)):page===8?' · '+grpByK[typeGroup[t.type]].name:' · '+({lin:'Линейное',quad:'Квадратное',frac:'Дробное'}[taskChapter(t)]));select.append(option);});
  toolbar.append(previousButton,select,nextButton,restart);
  const status=doc.createElement('p');status.setAttribute('role','status');
  const stage=doc.createElement('section');stage.id='oge-foundation-stage';
  // Preserve the native hidden roots used by counters, without importing any
  // personal progress. The prelude and native CP guards run before startup.
  const nativeRoot=page===6?doc.getElementById('card'):page===7?doc.getElementById('marTask'):null;
  Array.from(doc.body.children).forEach(n=>{if(!['SCRIPT','STYLE'].includes(n.tagName))n.hidden=true;});
  shell.append(heading,note,toolbar,status,stage);doc.body.append(shell);
  const css=doc.createElement('style');css.textContent='#oge-foundation-room{max-width:980px;margin:24px auto;padding:0 18px}#oge-foundation-room h1{font-size:1.55rem}.oge-foundation-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:18px 0}.oge-foundation-toolbar button,.oge-foundation-toolbar select{padding:9px;border:1px solid #b9c8bb;border-radius:8px;background:#fff;color:#203c2b;font:inherit;max-width:100%}#oge-foundation-stage{min-width:0}#oge-foundation-stage .task-card,#oge-foundation-stage .mtask{display:block}#oge-foundation-stage [data-a="learn"]{display:none}#oge-foundation-stage .task-actions{display:none}#oge-foundation-stage [hidden]{display:none!important}';doc.head.append(css);
  function render(index){
    task=index;stage.inert=false;select.value=String(index);status.textContent='';
    if(page===6){cat='all';shuffle=false;order=TASKS.map((_,i)=>i);pos=index;records={};hintSessions={};streak=0;stage.replaceChildren(nativeRoot);nativeRoot.hidden=false;renderTask();}
    else if(page===7){marIdx=index;marFilter='all';marSrc='all';marStatus.forEach((_,i)=>{marStatus[i]={state:'none'};marRec[i]={verdict:'',shown:false,hinted:false,counted:false,fm:0};});stage.replaceChildren(nativeRoot);nativeRoot.hidden=false;renderMarTask();Array.from(nativeRoot.querySelectorAll('button')).find(b=>b.textContent==='Следующая →')?.setAttribute('hidden','');}
    else if(page===8){Object.keys(marState).forEach(k=>delete marState[k]);Object.keys(marRec).forEach(k=>delete marRec[k]);stage.replaceChildren(marCard(bank[index]));}
    else{maraState.solved.clear();maraState.clean.clear();maraState.shown.clear();maraState.task={};stage.replaceChildren(makeMaraCard(bank[index],()=>{}));}
    auxiliary?.enhanceCard(card());
  }
  const card=()=>stage.firstElementChild;
  function getState(){return {schemaVersion:1,task:{source:'bank',index:task},actions:copy(actions),auxiliary:auxiliary?auxiliary.getState(card()):null};}
  function changed(){if(applying)return;auxiliary?.enhanceCard(card());const serialized=JSON.stringify(getState());if(serialized!==previous){previous=serialized;notify();}}
  const later=()=>Promise.resolve().then(changed);
  function choose(index){actions=[];render((index+count)%count);changed();}
  previousButton.onclick=()=>choose(task-1);nextButton.onclick=()=>choose(task+1);restart.onclick=()=>choose(task);select.onchange=()=>choose(Number(select.value));
  function groupOf(node){
    const step=page===6?node.closest('#hintCurrent'):node.closest(page===7?'.stepcard':'.step');
    const stepIndex=step?(page===6?hintSession().index:Array.from(card().querySelectorAll(page===7?'.stepcard':'.step')).indexOf(step)):-1;
    return {scope:node.closest('#stepLab,.equation-discovery,.transfer-lab')?'model':step?'step':'answer',step:stepIndex};
  }
  function roleOf(node){
    if(node.closest(ignored))return null;
    if(node.matches('details'))return 'disclosure';
    if(node.matches('input,textarea,select'))return 'draft';
    if(!node.matches('button')||node.matches('#previous,#skip,[data-a="learn"],.transfer-term'))return null;
    const text=node.textContent.trim();
    if(text==='Следующая →'||node.id==='labReturn'||text==='Перейти к сложению'||text==='Перейти к записи результата')return null;
    if(node.closest('#stepLab,.equation-discovery')||node.matches('.ocr-zoom'))return 'model';
    if(node.matches('.optbtn,.choice,.chip'))return 'choice';
    if(node.matches('#reveal,.sb,.reveal,.show')||/^Показать (шаг|ответ)/.test(text))return 'show';
    if(node.matches('#check,#stepCheck,.ck')||/^Проверить/.test(text))return 'check';
    if(node.matches('#hintToggle,#stepHelpToggle,.minimal-hint,.bs,.hb,.oca-return')||/подсказк|Подсказк|шаги|Шаги|Разобрать эту|Вернуться|Убрать/.test(text))return 'help';
    return null;
  }
  function catalog(){
    root.OgeCourseReferenceEntry?.update();
    const counts=new Map(),list=[];
    for(const node of card().querySelectorAll('input,textarea,select,button,details')){
      const role=roleOf(node);if(!role)continue;
      const group=groupOf(node),key=[group.scope,group.step,role].join('/'),index=counts.get(key)||0;counts.set(key,index+1);
      list.push({node,scope:group.scope,step:group.step,role,index});
    }
    return list;
  }
  function descriptor(node){return catalog().find(x=>x.node===node);}
  function actionFor(node,value){const d=descriptor(node);return d?[d.role,d.scope,d.step,d.index,value]:null;}
  function allowed(node){if(!node||node.disabled||node.readOnly||node.closest('[hidden]')||(page===6&&node.id==='check'&&answeredCur))return false;for(let p=node.parentElement;p&&p!==stage;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)return false;return true;}
  function limited(){return actions.length>=256||bytes(actions)>=38000;}
  function showLimit(){stage.inert=limited();if(stage.inert)status.textContent='История этой совместной задачи заполнена. Начните её заново или выберите следующую.';}
  function record(action){
    if(!action)return true;
    if(limited()){showLimit();return false;}
    const last=actions[actions.length-1];
    const replacing=action[0]==='draft'&&last&&last.slice(0,4).join('|')===action.slice(0,4).join('|');
    if(replacing)actions[actions.length-1]=action;
    else if(actions.length<256)actions.push(action);
    else{status.textContent='История этой совместной задачи заполнена. Начните её заново или выберите следующую.';return false;}
    if(bytes(actions)>40000){if(replacing)actions[actions.length-1]=last;else actions.pop();status.textContent='История заполнена. Начните это задание заново.';return false;}
    showLimit();
    return true;
  }
  function sanitize(value){return value.replace(/[<>\u0000-\u001f]/g,'').slice(0,128);}
  stage.addEventListener('input',event=>{
    if(applying)return;if(event.target.closest(ignored)){later();return;}
    const node=event.target,d=descriptor(node);if(!d||d.role!=='draft')return;
    node.value=sanitize(node.value);if(!record(actionFor(node,node.type==='checkbox'?node.checked:node.value))){event.stopImmediatePropagation();applyState(getState());status.textContent='История заполнена. Начните это задание заново.';return;}later();
  },true);
  stage.addEventListener('change',event=>{
    if(applying)return;if(event.target.closest(ignored)){later();return;}
    const node=event.target;if(!node.matches('input[type=checkbox],select'))return;
    record(actionFor(node,node.type==='checkbox'?node.checked:node.value));later();
  },true);
  stage.addEventListener('click',event=>{
    if(applying)return;const target=event.target.closest('button,summary');if(!target)return;
    if(target.closest(ignored)){later();return;}
    if(page===6&&target.id==='check'&&answeredCur){event.preventDefault();event.stopImmediatePropagation();choose(task+1);return;}
    if(target.matches('.transfer-term'))return; // move hook covers click, keyboard, drag and touch equally
    const detail=target.matches('summary')?target.parentElement:null,node=detail||target;
    if(!allowed(node))return;
    const action=actionFor(node,detail?!detail.open:null);
    if(!record(action)){event.preventDefault();event.stopImmediatePropagation();return;}
    // Native summary listeners (assistance provenance) run before the browser
    // toggles open. Replay uses the same click, not a fabricated answer/result.
    later();
  },true);
  stage.addEventListener('keydown',event=>{
    if(applying||event.key!=='Enter'||event.isComposing||event.target.closest(ignored)||!event.target.matches('input,textarea'))return;
    if(page===6&&event.target.id==='ans'&&answeredCur){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)choose(task+1);return;}
    const d=descriptor(event.target);if(!d||d.role!=='draft')return;
    const check=catalog().find(x=>x.scope===d.scope&&x.step===d.step&&(x.role==='check'||event.target.id==='labMiniAnswer'&&x.node.id==='labMiniCheck'));
    if(!check||!allowed(check.node))return;
    event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)check.node.click();
  },true);
  stage.addEventListener('toggle',event=>{if(!applying&&event.target.closest(ignored))later();},true);
  stage.addEventListener('oge-equation-move',event=>{
    if(applying)return;const lab=event.target,step=groupOf(lab).step;
    const labs=Array.from(card().querySelectorAll('.transfer-lab')).filter(n=>groupOf(n).step===step);
    if(!record(['move','model',step,labs.indexOf(lab),[Number(event.detail.term),event.detail.side]])){applyState(getState());status.textContent='История заполнена. Начните это задание заново.';return;}later();
  });
  function plain(value,keys){return !!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Reflect.ownKeys(value).length===keys.length&&keys.every(k=>{const p=Object.getOwnPropertyDescriptor(value,k);return p&&p.enumerable&&Object.hasOwn(p,'value');});}
  function array(value,max,test){return Array.isArray(value)&&Object.getPrototypeOf(value)===Array.prototype&&value.length<=max&&Reflect.ownKeys(value).length===value.length+1&&Array.from({length:value.length},(_,i)=>{const p=Object.getOwnPropertyDescriptor(value,String(i));return p&&p.enumerable&&Object.hasOwn(p,'value')&&test(p.value,i);}).every(Boolean);}
  function fail(){throw new TypeError('Invalid OGE foundation shared state');}
  function prepare(state){
    if(!plain(state,['schemaVersion','task','actions','auxiliary'])||state.schemaVersion!==1||!plain(state.task,['source','index'])||state.task.source!=='bank'||!Number.isInteger(state.task.index)||state.task.index<0||state.task.index>=count)fail();
    if(!array(state.actions,256,a=>array(a,5,()=>true)&&a.length===5&&['draft','check','help','show','choice','model','disclosure','move'].includes(a[0])&&['answer','step','model'].includes(a[1])&&Number.isInteger(a[2])&&a[2]>=-1&&a[2]<64&&Number.isInteger(a[3])&&a[3]>=0&&a[3]<128&&(a[0]==='draft'?(typeof a[4]==='boolean'||typeof a[4]==='string'&&a[4].length<=128&&!/[<>\u0000-\u001f]/.test(a[4])):a[0]==='disclosure'?typeof a[4]==='boolean':a[0]==='move'?page===9&&a[1]==='model'&&array(a[4],2,()=>true)&&a[4].length===2&&Number.isInteger(a[4][0])&&a[4][0]>=0&&a[4][0]<64&&['L','R'].includes(a[4][1]):a[4]===null)))fail();
    if(auxiliary){auxiliary.validateState(state.auxiliary);if(state.auxiliary.cards.length!==1)fail();}else if(state.auxiliary!==null)fail();
    if(bytes(state)>48000)fail();return copy(state);
  }
  function replay(state){
    render(state.task.index);actions=[];
    for(const a of state.actions){
      if(a[0]==='move'){
        const labs=Array.from(card().querySelectorAll('.transfer-lab')).filter(n=>groupOf(n).step===a[2]);
        if(!labs[a[3]]||!labs[a[3]].ogeMoveTerm(String(a[4][0]),a[4][1]))fail();
      }else{
        const d=catalog().find(x=>x.role===a[0]&&x.scope===a[1]&&x.step===a[2]&&x.index===a[3]);if(!d||!allowed(d.node))fail();
        const node=d.node;
        if(a[0]==='draft'){
          if(node.type==='checkbox'){if(typeof a[4]!=='boolean')fail();node.checked=a[4];node.dispatchEvent(new Event('change',{bubbles:true}));}
          else{if(typeof a[4]!=='string')fail();if(node.tagName==='SELECT'&&!Array.from(node.options).some(o=>o.value===a[4]))fail();if(node.type==='range'&&(!Number.isFinite(Number(a[4]))||Number(a[4])<Number(node.min)||Number(a[4])>Number(node.max)))fail();node.value=a[4];node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));}
        }else if(a[0]==='disclosure'){if(node.open===a[4])fail();node.querySelector('summary').click();node.dispatchEvent(new Event('toggle'));}
        else node.click();
      }
      actions.push(copy(a));auxiliary?.enhanceCard(card());
    }
    if(auxiliary){auxiliary.getState(card());auxiliary.applyState(state.auxiliary,card());}
    showLimit();
  }
  function applyState(incoming){const next=prepare(incoming),old=getState();applying=true;try{replay(next);previous=JSON.stringify(getState());}catch(error){replay(old);previous=JSON.stringify(getState());throw error;}finally{applying=false;}}
  function validateState(incoming){let old;try{const next=prepare(incoming);old=getState();applying=true;replay(next);replay(old);previous=JSON.stringify(getState());return true;}catch(_){if(old){replay(old);previous=JSON.stringify(getState());}return false;}finally{applying=false;}}
  render(0);previous=JSON.stringify(getState());
  root.OgeFoundationBoard=Object.freeze({getState,applyState,validateState});root.getBoardTrainerState=getState;root.applyBoardTrainerState=applyState;
  root.MathExamBoard.register({id:'oge-task'+page+'-'+({6:'fractions',7:'number-line',8:'powers-roots',9:'equations'}[page]),version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe(callback){notify=callback;return()=>{notify=()=>{};};}});
  }
  if(doc.readyState==='loading')root.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window,document);
