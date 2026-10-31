/* Genuine FIPI excerpts. Coordinates and source hashes: task19-reference/source.json. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Task19Reference=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const crops = {
  "polygon-angles": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/polygon-angles.png",
    "title": "Сумма углов выпуклого многоугольника",
    "alt": "Сумма углов выпуклого n-угольника равна 180°(n−2).",
    "printedPage": 5,
    "fullPageFile": null,
    "width": 999,
    "height": 63
  },
  "midlines": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/midlines.png",
    "title": "Средние линии треугольника и трапеции",
    "alt": "Рисунки и формулы средних линий треугольника и трапеции.",
    "printedPage": 5,
    "fullPageFile": null,
    "width": 999,
    "height": 273
  },
  "equilateral-triangle": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/equilateral-triangle.png",
    "title": "Правильный треугольник",
    "alt": "Радиусы вписанной и описанной окружностей, площадь и высота правильного треугольника.",
    "printedPage": 5,
    "fullPageFile": null,
    "width": 999,
    "height": 246
  },
  "sine-cosine": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/sine-cosine.png",
    "title": "Теоремы синусов и косинусов",
    "alt": "Рисунок треугольника с обозначениями и формулы теорем синусов и косинусов.",
    "printedPage": 5,
    "fullPageFile": null,
    "width": 999,
    "height": 369
  },
  "circle": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/circle.png",
    "title": "Длина окружности и площадь круга",
    "alt": "Длина окружности C = 2πr и площадь круга S = πr², рисунок радиуса.",
    "printedPage": 5,
    "fullPageFile": null,
    "width": 669,
    "height": 216
  },
  "areas": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/areas.png",
    "title": "Площади фигур",
    "alt": "Рисунки и формулы площадей параллелограмма, треугольника, трапеции и ромба.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 1008,
    "height": 528
  },
  "parallelogram-area": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/parallelogram-area.png",
    "title": "Площадь параллелограмма",
    "alt": "Параллелограмм: S = ahₐ и S = ab sin γ; рисунок основания, высоты и угла.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 459,
    "height": 201
  },
  "triangle-area": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/triangle-area.png",
    "title": "Площадь треугольника",
    "alt": "Треугольник: S = ½ahₐ и S = ½ab sin γ; рисунок основания, высоты и угла.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 486,
    "height": 201
  },
  "trapezoid-area": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/trapezoid-area.png",
    "title": "Площадь трапеции",
    "alt": "Трапеция: S = (a + b)h/2; рисунок оснований и высоты с отметкой прямого угла.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 462,
    "height": 228
  },
  "rhombus-area": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/rhombus-area.png",
    "title": "Площадь ромба",
    "alt": "Ромб: S = ½d₁d₂; рисунок и обозначения диагоналей.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 501,
    "height": 228
  },
  "pythagoras": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/pythagoras.png",
    "title": "Теорема Пифагора",
    "alt": "Прямоугольный треугольник с катетами a, b и гипотенузой c; a² + b² = c². На исходном листе рядом также показаны sin, cos и tg.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 591,
    "height": 366
  },
  "trig-values": {
    "file": "/book/oge/2026-10-31/v1/trainers/task19-reference/trig-values.png",
    "title": "Значения тригонометрических функций",
    "alt": "Таблица синуса, косинуса и тангенса основных углов.",
    "printedPage": 6,
    "fullPageFile": null,
    "width": 993,
    "height": 363
  }
};
const sheets={"5": "/book/oge/2026-10-31/v1/trainers/task19-reference/fipi-oge-2027-page-05.png", "6": "/book/oge/2026-10-31/v1/trainers/task19-reference/fipi-oge-2027-page-06.png"};
Object.values(crops).forEach(c=>{c.fullPageFile=sheets[c.printedPage];});
function forCard(card){
 const h=card.hint||{},p=h.params||{},m=h.model;
 if(m==='triangleAreaPair'||m==='areaTriangle'||(m==='triangleExplore'&&['area-product'].includes(p.focus))||(m==='triangleMedian'&&p.focus==='area'))return ['triangle-area'];
 if(m==='triangleExplore'&&p.focus==='pythagoras')return ['pythagoras'];
 if(m==='triangleExplore'&&p.focus==='angles'||m==='triangleAngles'||m==='polygonFan'&&!['regular','irregular'].includes(p.mode))return ['polygon-angles'];
 if(m==='triangleExplore'&&p.focus==='tan'||m==='triangleExplore'&&p.focus==='cos')return ['pythagoras','trig-values'];
 if(m==='trapezoid'&&p.focus==='area')return ['trapezoid-area'];
 if(m==='trapezoid'&&(!p.focus||p.focus==='midline'))return ['midlines'];
 if(['parallelogram','rhombus','rectangle'].includes(m)&&p.focus==='area')return [m==='rhombus'?'rhombus-area':'parallelogram-area'];
 if(m==='rhombusArea')return ['rhombus-area'];
 if(m==='circleMeasure')return ['circle'];
 if(m==='triangleConstructions'&&p.focus==='midline')return ['midlines'];
 return [];
}
function mount(host,card){
 host.replaceChildren();const ids=forCard(card);if(!ids.length)return;
 const d=host.ownerDocument,outer=d.createElement('details'),summary=d.createElement('summary');
 outer.className='t19-reference';summary.textContent='Посмотреть формулу из справочных материалов';outer.append(summary);
 const intro=d.createElement('p');intro.textContent='Фрагмент настоящего справочного листа ФИПИ — проект ОГЭ 2027.';outer.append(intro);
 for(const id of ids){
  const c=crops[id],image=d.createElement('img');image.className='t19-reference-crop';image.src=c.file;image.alt=c.alt;image.width=c.width;image.height=c.height;image.loading='lazy';outer.append(image);
  const sheet=d.createElement('details'),s=d.createElement('summary'),full=d.createElement('img');sheet.className='t19-reference-sheet';s.textContent='Где эта формула на листе? Страница '+c.printedPage;full.src=c.fullPageFile;full.alt='Справочный лист ФИПИ целиком, страница '+c.printedPage;full.loading='lazy';sheet.append(s,full);outer.append(sheet);
 }
 if(card.hint?.params?.converse){const note=d.createElement('p');note.textContent='На листе записана прямая теорема Пифагора. Обратная: если сумма квадратов двух сторон равна квадрату третьей, угол напротив третьей стороны — прямой.';outer.append(note);}
 if(ids.includes('polygon-angles')&&card.hint.model!=='polygonFan'){const note=d.createElement('p');note.textContent='Для треугольника подставь n = 3: 180° · (3 − 2) = 180°.';outer.append(note);}
 const links=d.createElement('p'),pdf=d.createElement('a'),official=d.createElement('a');
 pdf.href='https://mathexam.space/book/oge/2026-10-31/v1/trainers/task19-reference/source-demo-2027.pdf';pdf.textContent='Оригинал справочных материалов (PDF)';official.href='https://fipi.ru/oge/demoversii-specifikacii-kodifikatory';official.textContent='Источник — ФИПИ';
 for(const link of [pdf,official]){link.target='_blank';link.rel='noopener';}links.append(pdf,d.createTextNode(' · '),official);outer.append(links);host.append(outer);
}
return {forCard,mount,crops};
});
