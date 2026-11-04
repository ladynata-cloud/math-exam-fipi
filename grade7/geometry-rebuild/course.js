/* Course navigation only: no attempt is created, no learner data is read here. */
(function(root){'use strict';
 const sections=[
  ['Точка, прямая, отрезок','5–10'],['Луч, угол','11–14'],['Сравнение и измерение отрезков и углов','15–20'],
  ['Смежные и вертикальные углы. Перпендикулярные прямые','21–26'],['Треугольник','27–32'],
  ['Первый признак равенства треугольников','33–36'],['Медианы, биссектрисы и высоты','37–39'],
  ['Свойства равнобедренного треугольника','40–42'],['Второй признак равенства треугольников','43–46'],
  ['Третий признак равенства треугольников','47–50'],['Окружность','51–53'],
  ['Признаки параллельности двух прямых','54–59'],['Углы при параллельных прямых и секущей','60–63'],
  ['Сумма углов треугольника','64–68'],['Соотношения между сторонами и углами треугольника','69–72'],
  ['Прямоугольный треугольник и его свойства','73–76'],['Признаки равенства прямоугольных треугольников','77–80']
 ];
 const goals=[
  'Различай прямую и отрезок, называй концы и считай отрезки без повторов.',
  'Находи начало луча, вершину и стороны угла.',
  'Собирай целое из частей и измеряй отрезки и углы.',
  'Узнавай пары углов и объясняй, почему они равны или дают в сумме 180°.',
  'Находи элементы треугольника и вычисляй его периметр.',
  'Проверяй две стороны и угол между ними — это первый признак.',
  'Различай три отрезка по их свойствам, даже на непривычном рисунке.',
  'Используй равные стороны и углы при основании.',
  'Находи сторону и два прилежащих к ней угла — это второй признак.',
  'Собирай три пары равных сторон и выбирай подходящий признак.',
  'Различай радиус, диаметр, хорду и дугу; используй равенство радиусов.',
  'По углам объясняй, почему две прямые параллельны.',
  'Находи равные углы и пары с суммой 180° при параллельных прямых.',
  'Находи неизвестные углы и проверяй сумму 180°.',
  'Сравнивай стороны и углы; проверяй, существует ли треугольник.',
  'Используй прямой угол и свойства прямоугольного треугольника.',
  'Выбирай данные, которых достаточно для равенства прямоугольных треугольников.'
 ];
 const catalog=root.LearningCatalog,host=document.getElementById('geometry-sections');
 if(!catalog||!host)return;
 const items=catalog.items.filter(item=>item.geometryRebuild&&!item.contentId.startsWith('grade7-r-photo-proof-'));
 const el=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
 const link=(text,href,className)=>{const node=el('a',text,className);node.href=href;return node;};
 const lessonCount=count=>`${count} ${count%100>=11&&count%100<=14?'уроков':count%10===1?'урок':count%10>=2&&count%10<=4?'урока':'уроков'}`;
 document.getElementById('course-count').textContent=`17 тем · ${items.length} небольших уроков на весь маршрут. Сегодня выбери один.`;
 sections.forEach(([title,pages],index)=>{
  const number=index+1,entries=items.filter(item=>item.section===number),section=el('details','','course-section');
  section.id='section-'+number;section.dataset.geometrySection=String(number);
  const summary=el('summary','','section-heading'),h=el('h3',title);h.id=section.id+'-title';
  summary.append(el('span',String(number).padStart(2,'0'),'section-number'),h,el('span',lessonCount(entries.length),'section-count'));section.append(summary);
  section.append(el('p',goals[index],'section-goal'),el('p',`Страницы ${pages} в пособии · можно выбрать любой урок`,'section-source'));
  const grid=el('div','','lesson-grid');
  entries.forEach((item,lessonIndex)=>{
   const card=el('article','','lesson');card.dataset.geometryLesson=item.contentId;card.id='lesson-'+item.contentId;card.tabIndex=-1;
   card.append(el('span',number+'.'+(lessonIndex+1),'lesson-number'),el('h4',item.title),el('p',item.idea));
   const actions=el('div','','actions'),cabinet=link('Открыть в кабинете →','https://mathexam-board-ladynata.msk1.amvera.tech/learning/#practice='+encodeURIComponent(item.id),'button primary');cabinet.dataset.cabinetPractice='';
   const preview=link('Попробовать без входа','/ege-baza/path/index.html?practice=1#lesson='+encodeURIComponent(item.contentId));preview.dataset.preview='';actions.append(cabinet,preview);card.append(actions);
   const prerequisites=(item.prerequisites||[]).map(id=>catalog.get('path:'+id)).filter(Boolean);
   if(prerequisites.length){const details=el('details'),list=el('ul');details.append(el('summary','Если сначала хочется вспомнить основу'));for(const basis of prerequisites){const row=el('li');row.append(link(basis.title,basis.geometryRebuild?'#lesson-'+basis.contentId:'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#practice='+encodeURIComponent(basis.id)));list.append(row);}details.append(list);card.append(details);}
   grid.append(card);
  });
  section.append(grid);host.append(section);
 });
 const allSections=Array.from(host.querySelectorAll('.course-section')),toggle=document.getElementById('toggle-sections');
 function syncToggle(){if(toggle)toggle.textContent=allSections.every(section=>section.open)?'Свернуть все темы':'Развернуть все темы';}
 if(toggle){toggle.hidden=false;toggle.addEventListener('click',()=>{const open=!allSections.every(section=>section.open);allSections.forEach(section=>{section.open=open;});syncToggle();});}
 allSections.forEach(section=>section.addEventListener('toggle',syncToggle));
 // An anchor may point into a folded topic, including a prerequisite in another topic.
 function revealAnchor(hash,scroll){
  let id;try{id=decodeURIComponent((hash||'').slice(1));}catch(_){return;}
  if(!/^(section-|lesson-)/.test(id))return;
  const target=document.getElementById(id);if(!target)return;
  const section=target.closest('.course-section');if(section)section.open=true;
  if(scroll)target.scrollIntoView({block:'start'});
 }
 document.addEventListener('click',event=>{const anchor=event.target.closest('a[href^="#"]');if(anchor)revealAnchor(anchor.getAttribute('href'),true);});
 root.addEventListener('hashchange',()=>revealAnchor(root.location.hash,true));
 revealAnchor(root.location.hash,true);
})(window);
