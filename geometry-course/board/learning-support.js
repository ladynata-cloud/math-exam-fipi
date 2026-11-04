/* Authored support shared by the existing grade 7 activities. A diagram is
 * evidence to investigate; a completed proof still needs stated reasons. */
(function(doc){
'use strict';
const name=location.pathname.split('/').pop(),construction=/constr|construct/.test(name),parallel=name.startsWith('ch3-')||name.includes('distance-parallels');
const section=doc.createElement('section');section.className='geometry7-reasoning';section.setAttribute('aria-label','Объясни решение своими словами');
const heading=doc.createElement('h2');heading.textContent=construction?'Построение и его обоснование':parallel?'От условия к выводу о параллельности':'Как записать доказательство';section.append(heading);
const intro=doc.createElement('p');intro.textContent=construction?'После каждого действия объясни, что оно гарантирует. Линейка проводит прямую через две точки; циркуль переносит длину. Измерение по экрану не заменяет обоснование.':'Сначала назови, что дано и что требуется доказать. Каждое равенство нужно обосновать; похожий вид рисунка сам по себе ничего не доказывает.';section.append(intro);
const details=doc.createElement('details'),summary=doc.createElement('summary');summary.textContent='Опора для рассуждения';details.append(summary);
const items=construction?[
 'Дуги одного раствора циркуля задают равные расстояния от своих центров. Сначала проверь, что точки пересечения действительно существуют.',
 'Чтобы построить серединный перпендикуляр, возьми одинаковые радиусы больше половины отрезка. Соедини обе точки пересечения окружностей.',
 'Чтобы построить биссектрису, отметь на сторонах угла равноудалённые от вершины точки. От них одинаковым раствором проведи дуги. Обоснуй равенство полученных треугольников по трём сторонам.',
 'Запиши: построение → доказательство → проверка условий существования. Если возможны два решения, укажи оба.'
]:parallel?[
 'Укажи две прямые и секущую. Назови пару углов: накрест лежащие, соответственные или односторонние.',
 'Признаки: равенство накрест лежащих углов; равенство соответственных углов; сумма односторонних углов 180°. Из этого заключаем, что прямые параллельны.',
 'Свойства применяют в обратном порядке: параллельность уже дана или доказана, поэтому получаем равенства углов или сумму 180°.',
 'Не используй нужную параллельность как исходный факт в её же доказательстве. Укажи, какое утверждение применяется и почему его условия выполнены.'
]:[
 'Назови два треугольника в порядке соответствующих вершин. Запиши пары соответствующих сторон и углов.',
 'Первый признак: две стороны и угол МЕЖДУ ними соответственно равны.',
 'Второй признак: сторона и два ПРИЛЕЖАЩИХ к ней угла соответственно равны.',
 'Третий признак: три стороны соответственно равны. Две стороны и произвольный угол не дают общего признака равенства.',
 'Общая сторона равна самой себе; вертикальные углы равны. Эти причины нужно назвать. Равенство остальных элементов следует уже ПОСЛЕ доказанного равенства треугольников.'
];
const list=doc.createElement('ol');for(const text of items){const li=doc.createElement('li');li.textContent=text;list.append(li);}details.append(list);section.append(details);
for(const [key,text]of [['givens','Дано и что нужно доказать'],['reasons','Ход решения: утверждение — его основание'],['conclusion','Вывод и проверка условий']]){const label=doc.createElement('label');label.textContent=text;const input=doc.createElement('textarea');input.id='geometry7-'+key;input.maxLength=2000;input.rows=3;label.append(input);section.append(label);}
const note=doc.createElement('p');note.textContent='Записи помогают обсудить решение с преподавателем. Совпадение ответа или собранные карточки ещё не означают, что самостоятельное доказательство проверено.';section.append(note);doc.body.append(section);
})(document);
