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
 const catalog=root.LearningCatalog,host=document.getElementById('geometry-sections'),links=document.getElementById('section-links');
 if(!catalog||!host||!links)return;
 const items=catalog.items.filter(item=>item.geometryRebuild&&!item.contentId.startsWith('grade7-r-photo-proof-'));
 const el=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
 const link=(text,href,className)=>{const node=el('a',text,className);node.href=href;return node;};
 document.getElementById('course-count').textContent=`17 тем · ${items.length} небольших уроков. Выбирай нужный шаг или двигайся по порядку.`;
 sections.forEach(([title,pages],index)=>{
  const number=index+1,entries=items.filter(item=>item.section===number),section=el('section','','course-section');
  section.id='section-'+number;section.dataset.geometrySection=String(number);
  const nav=el('li');nav.append(link(title,'#'+section.id));links.append(nav);
  const heading=el('div','','section-heading'),h=el('h3',title);h.id=section.id+'-title';section.setAttribute('aria-labelledby',h.id);
  heading.append(el('span',String(number).padStart(2,'0'),'section-number'),h);section.append(heading,el('p',`Страницы ${pages} · ${entries.length} небольших шагов`,'section-source'));
  const grid=el('div','','lesson-grid');
  entries.forEach((item,lessonIndex)=>{
   const card=el('article','','lesson');card.dataset.geometryLesson=item.contentId;card.id='lesson-'+item.contentId;
   card.append(el('span',number+'.'+(lessonIndex+1),'lesson-number'),el('h4',item.title),el('p',item.idea));
   const actions=el('div','','actions'),cabinet=link('Открыть в кабинете →','https://mathexam-board-ladynata.msk1.amvera.tech/learning/#practice='+encodeURIComponent(item.id),'button primary');cabinet.dataset.cabinetPractice='';
   const preview=link('Попробовать без входа','/ege-baza/path/index.html?practice=1#lesson='+encodeURIComponent(item.contentId));preview.dataset.preview='';actions.append(cabinet,preview);card.append(actions);
   const prerequisites=(item.prerequisites||[]).map(id=>catalog.get('path:'+id)).filter(Boolean);
   if(prerequisites.length){const details=el('details'),list=el('ul');details.append(el('summary','Если сначала хочется вспомнить основу'));for(const basis of prerequisites){const row=el('li');row.append(link(basis.title,basis.geometryRebuild?'#lesson-'+basis.contentId:'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#practice='+encodeURIComponent(basis.id)));list.append(row);}details.append(list);card.append(details);}
   grid.append(card);
  });
  section.append(grid);host.append(section);
 });
})(window);
