/* Optional tyre vocabulary checks. They never read task answers or write progress. */
(function(global){
'use strict';
const doc=global.document;
const fraction=(a,b)=>'<span class="tsq-fraction"><span>'+a+'</span><span>'+b+'</span></span>';
const questions={
 before:[
  {q:'Что означает ширина шины B?',options:['Расстояние между самыми выпуклыми частями боковин вдоль оси колеса.','Расстояние от края диска до наружного края шины.','Диаметр диска.'],answer:0,why:'Ширина B идёт вдоль оси колеса. Высота боковины H измеряется в другом направлении: от диска к наружному краю шины.'},
  {q:'Где измеряют высоту боковины H?',options:['Между двумя боковинами поперёк шины.','От края диска до наружного края шины, по радиусу.','Через весь диск от края до края.'],answer:1,why:'H — высота одной боковины по радиусу. В полный диаметр колеса входят две такие высоты: над диском и под ним.'},
  {q:'Чем диаметр колеса D отличается от диаметра диска d?',options:['Это два названия одной величины.','Диаметр колеса измеряют по наружному краю шины; диаметр диска — по диску.','Диаметр колеса — это ширина шины.'],answer:1,why:'Колесо с шиной больше диска. Если обе величины измерены в миллиметрах, D = d + 2H.'}
 ],
 middle:[
  {q:'На учебной шине написано 205/60 R16. Какую величину сразу сообщает число 205?',options:['Высоту боковины: 205 мм.','Диаметр диска: 205 мм.','Ширину шины: 205 мм.'],answer:2,why:'Первое число маркировки — ширина B в миллиметрах. Число 60 означает высоту боковины в процентах от ширины, а 16 — диаметр диска в дюймах.'},
  {q:'Ширина шины — B мм, высота боковины составляет p% от ширины. Как найти H в миллиметрах?',options:['H = '+fraction('B · p','100'),'H = B + p','H = '+fraction('B','p')],answer:0,why:'Процент — сотая часть. Чтобы найти p% от ширины B, умножаем B на p и делим на 100.'},
  {q:'Диаметр диска d указан в дюймах. Как перевести его в миллиметры?',options:['Умножить d на 10.','Умножить d на 25,4.','Разделить d на 25,4.'],answer:1,why:'В одном дюйме 25,4 мм. Поэтому d дюймов — это d · 25,4 миллиметра.'}
 ],
 after:[
  {q:'Диаметр диска уже перевели в миллиметры. Как найти полный диаметр колеса D?',options:['К диаметру диска прибавить одну высоту боковины H.','К диаметру диска прибавить ширину B.','К диаметру диска прибавить две высоты боковины: D = d + 2H.'],answer:2,why:'На виде со стороны диска шина добавляет H сверху и H снизу. Поэтому прибавляем 2H. Ширина B направлена вдоль оси и в эту сумму не входит.'},
  {q:'Ширина двух шин одинакова. У одной высота боковины — 55% ширины, у другой — 65%. У какой боковина выше?',options:['У шины с обозначением 65%.','У шины с обозначением 55%.','Высота одинаковая, потому что одинакова ширина.'],answer:0,why:'Сравниваем проценты от одной и той же ширины. 65% от этой ширины больше 55%, поэтому боковина выше у второй шины.'},
  {q:'Шину поставили на более широкий диск. Можно ли только по ширине диска узнать наружный диаметр колеса?',options:['Да: наружный диаметр равен ширине диска.','Нет: нужны диаметр диска и высота боковины шины.','Да: достаточно удвоить ширину диска.'],answer:1,why:'Ширина и диаметр измеряются в разных направлениях. Для наружного диаметра D нужны диаметр диска d и высота боковины H в одинаковых единицах.'}
 ]
};
const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
function diagram(){
 const figure=make('figure','tsq-figure'),scroll=make('div','tsq-figure-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Размеры шины: рисунок можно прокручивать вправо и влево');
 scroll.innerHTML='<svg viewBox="0 0 560 300" role="img" aria-label="Со стороны диска видны наружный диаметр D, диаметр диска d и высота боковины H. На виде сверху показана ширина B вдоль оси." xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke-width="3"><circle cx="130" cy="140" r="85" fill="#e0e9e3" stroke="#29483c"/><circle cx="130" cy="140" r="50" fill="#fafcfb" stroke="#6b8173"/><path d="M20 55V225M12 55H28M12 225H28" stroke="#225d9d"/><path d="M80 140H180M80 132V148M180 132V148" stroke="#6f438b"/><path d="M130 55V90M122 55H138M122 90H138" stroke="#a95516"/><rect x="350" y="55" width="120" height="170" rx="42" fill="#e0e9e3" stroke="#29483c"/><rect x="373" y="55" width="74" height="170" rx="12" stroke="#6b8173" stroke-dasharray="5 4"/><path d="M322 140H498" stroke="#778d7d" stroke-dasharray="7 5"/><path d="M350 247H470M350 239V255M470 239V255" stroke="#176747"/></g><g font-size="20" font-family="sans-serif" fill="#173c2d"><text x="130" y="27" text-anchor="middle">Со стороны диска</text><text x="410" y="27" text-anchor="middle">Вид сверху</text><text x="3" y="146">D</text><text x="130" y="166" text-anchor="middle">d</text><text x="149" y="79">H</text><text x="410" y="275" text-anchor="middle">B</text><text x="500" y="147">ось</text></g></svg>';
 figure.append(scroll,make('figcaption',null,'На узком экране рисунок можно прокручивать. Размеры показаны в разных направлениях.'));return figure;
}
function widget(phase){
 const card=make('section','tsq-card');card.id='tire-structure-quiz-'+phase;card.dataset.tireQuizPhase=phase;card.setAttribute('aria-label','Тест по Шине');
 const head=make('div','tsq-head'),title=make('h3',null,'Тест по Шине'),toggle=make('button','tsq-toggle','Хочешь тест?');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',card.id+'-panel');head.append(title,toggle);
 const panel=make('div','tsq-panel');panel.id=card.id+'-panel';panel.hidden=true;
 const intro=make('p','tsq-intro',phase==='before'?'Три коротких вопроса: узнаем размеры шины.':phase==='middle'?'Три коротких вопроса: прочитаем маркировку и выберем действия.':'Три коротких вопроса: проверим, что теперь понятно.');
 const host=make('div','tsq-question-host'),back=make('button','tsq-back','Вернуться к задачам');back.type='button';panel.append(intro,diagram(),host,back);card.append(head,panel);
 let index=0,firstTry=0,attempted=false,accepted=false,round=0;
 const close=()=>{panel.hidden=true;toggle.textContent='Хочешь тест?';toggle.setAttribute('aria-expanded','false');toggle.focus();};back.addEventListener('click',close);
 toggle.addEventListener('click',()=>{if(!panel.hidden){close();return;}panel.hidden=false;toggle.textContent='Убрать тест';toggle.setAttribute('aria-expanded','true');});
 function render(focus){
  host.replaceChildren();attempted=false;accepted=false;
  if(index===questions[phase].length){
   const result=make('p','tsq-result','Все 3 вопроса разобраны. С первой попытки: '+firstTry+' из 3.');result.setAttribute('role','status');result.tabIndex=-1;host.append(result,make('p',null,firstTry===3?'Теперь вернись к задачам и используй эти обозначения.':'Если перепутал размеры, ещё раз найди B, H, d и D на рисунке. Затем можно повторить тест.'));
   const retry=make('button','tsq-retry','Пройти ещё раз');retry.type='button';retry.addEventListener('click',()=>{index=0;firstTry=0;round++;render(true);});host.append(retry);if(focus)result.focus();return;
  }
  const item=questions[phase][index],progress=make('p','tsq-progress','Вопрос '+(index+1)+' из 3'),question=make('h4','tsq-question',item.q);question.tabIndex=-1;host.append(progress,question);
  const answers=make('div','tsq-options'),feedback=make('p','tsq-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const next=make('button','tsq-next',index===2?'Завершить тест':'Следующий вопрос');next.type='button';next.disabled=true;next.addEventListener('click',()=>{if(accepted){index++;render(true);}});
  const order=item.options.map((_,i)=>(i+round)%item.options.length);
  for(const optionIndex of order){const option=make('button','tsq-option');option.type='button';option.innerHTML=item.options[optionIndex];option.addEventListener('click',()=>{
    if(accepted)return;
    const correct=optionIndex===item.answer;
    if(correct){if(!attempted)firstTry++;accepted=true;option.classList.add('tsq-correct');answers.querySelectorAll('button').forEach(b=>b.disabled=true);next.disabled=false;feedback.textContent='Верно. '+item.why;feedback.className='tsq-feedback tsq-correct';}
    else{option.classList.add('tsq-incorrect');feedback.textContent='Пока не так. '+item.why+' Выбери ответ ещё раз.';feedback.className='tsq-feedback tsq-incorrect';}
    attempted=true;
   });answers.append(option);}
  host.append(answers,feedback,next);if(focus)question.focus();
 }
 render(false);return card;
}
let observing=false,scheduled=false;
function decorate(){
 if(doc.body.dataset.practicalPage!=='tires')return;
 const workspace=doc.querySelector('#tvl-workspace'),middle=doc.querySelector('#section-4'),end=doc.querySelector('#section-6');
 if(!workspace||!middle||!end)return;
 for(const [phase,anchor,before]of [['before',workspace,true],['middle',middle,false],['after',end,false]]){if(doc.getElementById('tire-structure-quiz-'+phase))continue;const card=widget(phase);before?anchor.before(card):anchor.after(card);}
 doc.documentElement.dataset.tireStructureQuiz='ready';
}
function start(){if(observing||doc.body.dataset.practicalPage!=='tires')return;observing=true;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;decorate();});});observer.observe(doc.body,{childList:true,subtree:true});decorate();}
global.TireStructureQuiz={decorate};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else start();
})(window);
