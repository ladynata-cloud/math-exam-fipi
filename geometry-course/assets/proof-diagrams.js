(function (root) {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ink = '#183247', accent = '#147c78';
  const line = (d, active = false, extra = '') => `<path d="${d}" fill="none" stroke="${active ? accent : ink}" stroke-width="${active ? 3.5 : 2}" ${extra}/>`;
  const point = (id, x, y, dx = 0, dy = 20) => `<circle data-point="${id}" cx="${x}" cy="${y}" r="3" fill="${ink}"/><text x="${x+dx}" y="${y+dy}">${id}</text>`;
  const label = (x, y, value) => `<text x="${x}" y="${y}">${esc(value)}</text>`;
  function figure(kind, id, step, viewBox, title, drawing, caption) {
    return `<figure class="lesson-figure" data-figure-kind="${kind}" data-figure-id="${id}" data-figure-step="${step}" style="margin:10px 0;max-width:360px">
      <svg viewBox="${viewBox}" role="img" aria-label="${esc(title)}" style="display:block;width:100%;height:auto;background:#f3f7f5;border-radius:8px;font:600 15px system-ui;text-anchor:middle;fill:${ink};stroke-linecap:round;stroke-linejoin:round">${drawing}</svg>
      <figcaption style="font-size:14px;line-height:1.35;margin-top:4px">${esc(caption)}</figcaption></figure>`;
  }
  const proofIds = ['segment', 'tangent', 'projection', 'pythagoras'];
  function proof(id, value = 0) {
    if (!proofIds.includes(id)) return '';
    const step = Math.max(0, Math.min(4, Math.floor(Number(value) || 0)));
    if (id === 'segment') {
      const caption = ['M — середина AB: засечки обозначают равные части.', 'Сначала установи равенство AM и MB.', 'Весь отрезок AB состоит из частей AM и MB.', 'Две равные части вместе имеют длину 10.'][Math.min(step,3)];
      return figure('proof', id, step, '0 0 320 100', 'Отрезок AB длиной 10; M — его середина.',
        line('M30 35v-8h260v8', step===2)+line('M30 60H160M160 60H290', step===1)+
        line('M91 65l8-10m122 10l8-10', true)+point('A',30,60)+point('M',160,60)+point('B',290,60)+label(160,20,'AB = 10'), caption);
    }
    if (id === 'tangent') {
      const caption = ['Радиус OT перпендикулярен прямой l в точке T.', 'P — любая другая точка прямой l. Проведи OP.', 'В прямоугольном треугольнике OTP отрезок OP — гипотенуза.', 'Сравни OP с радиусом: может ли P лежать на окружности?', 'На прямой l только T принадлежит окружности.'][step];
      const other = step>0 ? line('M128 84L238 149',step>=2,'stroke-dasharray="6 5"')+point('P',238,149) : '';
      return figure('proof', id, step, '0 0 320 184', 'Окружность с центром O. Прямая l перпендикулярна радиусу OT.'+(step>0?' P лежит на l и отличается от T.':''),
        `<circle cx="128" cy="84" r="65" fill="#e8f2ed" stroke="${ink}" stroke-width="2"/>`+
        line('M128 84V149M27 149H293')+line('M128 136H141V149',true)+other+point('O',128,84,-13,-8)+point('T',128,149)+label(293,139,'l'),caption);
    }
    if (id === 'projection') {
      const caption = ['CH — высота к гипотенузе AB. Угол ACB прямой.', 'Высота образует два прямых угла при H.', 'Найди равные острые углы у двух меньших треугольников.', 'Сопоставь вершины: A ↔ C, H ↔ H, C ↔ B.', 'Сопоставь AH с CH, а CH с HB.'][step];
      const fills = step>=2 ? `<path d="M18 172L126 28V172Z" fill="#cfe7df"/><path d="M126 172V28L318 172Z" fill="#e8ddba"/>` : '';
      return figure('proof',id,step,'0 0 336 202','Прямоугольный треугольник ABC; CH — высота к гипотенузе AB.',
        fills+line('M18 172L126 28L318 172Z')+line('M126 28V172',step===1||step===4,'stroke-dasharray="6 5"')+
        line('M117 40l12 9 9-12M126 159h13v13',true)+point('A',18,172)+point('C',126,28,0,-10)+point('H',126,172)+point('B',318,172),caption);
    }
    const caption = ['Четыре копии треугольника помещены в квадрат со стороной a + b.', 'Проверь: у внутренней фигуры равны стороны и прямые углы.', 'Сложи площади четырёх треугольников и внутреннего квадрата.', 'Раскрой квадрат суммы и сравни с суммой площадей.', 'Вычти одинаковое слагаемое 2ab из обеих частей.'][step];
    return figure('proof',id,step,'0 0 260 240','Квадрат со стороной a + b разбит на четыре прямоугольных треугольника и внутреннюю фигуру со сторонами c.',
      `<path d="M34 22H226V214H34Z" fill="${step===2?'#e8ddba':'#e8f2ed'}" stroke="${ink}" stroke-width="2"/>`+
      `<path d="M106 22L226 94L154 214L34 142Z" fill="${step>=1?'#cfe7df':'#fffefa'}" stroke="${accent}" stroke-width="${step===1?3.5:2}"/>`+
      line('M214 22v12h12')+label(70,16,'a')+label(166,16,'b')+label(239,62,'a')+label(239,160,'b')+label(94,234,'b')+label(190,234,'a')+label(21,86,'b')+label(21,184,'a')+label(172,54,'c'),caption);
  }

  function practice(task, value = 0) {
    const d = task && task.meta && task.meta.diagram;
    const arity={segment:1,compare:2,length:2,tangent:1,pythagoras:2,projection:2,'circle-position':3};
    if (!d || !Array.isArray(d.values) || d.values.length!==arity[d.type] || !d.values.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>0)) return '';
    const step=Math.max(0,Math.min(3,Math.floor(Number(value)||0))), [a,b,c]=d.values;
    if ((d.type==='pythagoras'||d.type==='length')&&a<=b || d.type==='compare'&&b<=10*a) return '';
    let viewBox='0 0 320 140', title='', drawing='', caption='Рисунок показывает условие. Значение со знаком «?» нужно найти.';
    if (d.type==='segment') {
      title=`M — середина AB. AM = ${a} см; AB неизвестно.`;
      drawing=line('M30 70H290',true)+line('M91 75l8-10m122 10l8-10',true)+line('M30 25v-6h260v6')+
        point('A',30,70)+point('M',160,70)+point('B',290,70)+label(95,57,`${a} см`)+label(160,14,'AB = ?');
    } else if (d.type==='compare') {
      title=`Первый отрезок ${a} см, второй ${b} мм. Оба изображены в одном масштабе.`;
      const x=30+260*a*10/b;
      drawing=line(`M30 45H${x}`)+line('M30 100H290',step>0)+label((30+x)/2,30,`${a} см`)+label(160,85,`${b} мм`);
      caption='Оба отрезка показаны в одном масштабе. Сначала вырази длины в одной единице.';
    } else if (d.type==='length') {
      title=`B между A и C. AC = ${a} см; BC = ${b} см; AB неизвестно.`;
      const x=30+260*(a-b)/a;
      drawing=line('M30 70H290')+line(`M${x} 70H290`,true)+line('M30 25v-6h260v6')+
        point('A',30,70)+point('B',x,70)+point('C',290,70)+label(160,14,`AC = ${a} см`)+label((x+290)/2,57,`${b} см`)+label((30+x)/2,57,'?');
    } else if (d.type==='tangent') {
      viewBox='0 0 320 208';title=`PA и PB — касательные из P. PA = ${a} см. Найди сумму PA и PB.`;
      drawing=`<circle cx="92" cy="100" r="60" fill="#e8f2ed" stroke="${ink}" stroke-width="2"/>`+
        line('M114.5 44.37851134678253L252 100L114.5 155.62148865321747',step>0)+
        line('M114.5 44.37851134678253L92 100L114.5 155.62148865321747',false,'stroke-dasharray="5 5"')+
        point('A',114.5,44.37851134678253,-12,-10)+point('B',114.5,155.62148865321747,-12,20)+point('P',252,100,15,5)+point('O',92,100,-12,5)+label(200,49,`PA = ${a} см`)+label(195,173,'PB = ?');
      caption='Обе касательные проведены из одной точки P. В ответе нужна сумма двух отрезков.';
    } else if (d.type==='pythagoras') {
      viewBox='0 0 320 230';title=`Прямоугольный треугольник. Гипотенуза ${a} см, известный катет ${b} см, второй катет неизвестен.`;
      const unknown=Math.sqrt(a*a-b*b),scale=Math.min(235/unknown,145/b),y=175-b*scale,x=40+unknown*scale;
      drawing=line(`M40 ${y}V175H${x}Z`)+line('M40 162h13v13',true)+point('A',40,y,0,-12)+point('C',40,175,-16,6)+point('B',x,175,13,6)+
        label(21,(y+175)/2,`${b}`)+label((40+x)/2+10,(y+175)/2-10,`${a}`)+label((40+x)/2,198,'?');
      caption='Числа на сторонах — длины в сантиметрах. Гипотенуза лежит напротив прямого угла.';
    } else if (d.type==='projection') {
      viewBox='0 0 336 230';title=`Высота CH делит гипотенузу AB на отрезки ${a} см и ${b} см. CH неизвестна.`;
      const height=Math.sqrt(a*b),scale=Math.min(280/(a+b),145/height),x=25+a*scale,end=25+(a+b)*scale,y=180-height*scale;
      drawing=line(`M25 180L${x} ${y}L${end} 180Z`)+line(`M${x} ${y}V180`,true,'stroke-dasharray="6 5"')+
        line(`M${x} 168h12v12`,true)+point('A',25,180)+point('C',x,y,0,-12)+point('H',x,180)+point('B',end,180)+
        label((25+x)/2,216,`${a} см`)+label((x+end)/2,216,`${b} см`)+label(x+15,(y+180)/2,'?');
      caption='Высота CH перпендикулярна гипотенузе. Подписи относятся к двум частям гипотенузы.';
    } else if (d.type==='circle-position') {
      viewBox='0 0 336 220';title=`Окружности радиусов ${a} и ${b} см. Между центрами ${c} см.`;
      const scale=Math.min(290/(a+c+b),73/Math.max(a,b)),ox=22+a*scale,px=ox+c*scale;
      drawing=`<circle cx="${ox}" cy="100" r="${a*scale}" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="${px}" cy="100" r="${b*scale}" fill="none" stroke="${accent}" stroke-width="2"/>`+
        line(`M${ox} 100H${px}`,true,'stroke-dasharray="5 5"')+point('O₁',ox,100,0,20)+point('O₂',px,100,0,20)+
        label((ox+px)/2,91,`${c} см`)+label(168,186,`Радиусы: ${a} см и ${b} см`);
      caption='Сравни расстояние между центрами с суммой и разностью радиусов. Рисунок помогает проверить вывод.';
    } else return '';
    return figure('practice',d.type,step,viewBox,title,drawing,caption);
  }
  function preparePage() {
    if (typeof document==='undefined'||document.getElementById('proof-figure-styles')) return;
    document.body.classList.add('proof-figure-lesson');
    const style=document.createElement('style');style.id='proof-figure-styles';
    style.textContent=`
      .proof-figure-lesson .topbar { padding-block: 10px; gap: 8px; }
      .proof-figure-lesson .container { padding-top: 12px; }
      .proof-figure-lesson .lesson-head { margin: 0; padding: 6px 0; }
      .proof-figure-lesson .lesson-head h1 { font-size: clamp(24px, 4vw, 36px); line-height: 1.2; margin: 4px 0; }
      .proof-figure-lesson .stage-nav { margin: 6px 0 8px; padding-block: 4px 8px; }
      .proof-figure-lesson #lesson { padding-block: 16px; }
      .proof-figure-lesson #lesson > .step-label { margin: 0 0 6px; }
      .proof-figure-lesson #lesson > h2 { margin: 0 0 8px; }
      .proof-figure-lesson #lesson > .callout { padding: 8px 12px; margin: 8px 0; }
      .proof-figure-lesson #lesson > .callout p { margin: 3px 0; line-height: 1.45; }
      @media (max-width: 600px) {
        .proof-figure-lesson .topbar { padding-block: 8px; gap: 4px; }
        .proof-figure-lesson .toplinks { gap: 4px 5px; }
        .proof-figure-lesson .toplinks button { padding-inline: 4px; }
        .proof-figure-lesson .container { padding-top: 8px; }
        .proof-figure-lesson .lesson-head { padding-block: 2px; }
        .proof-figure-lesson .lesson-head .eyebrow { margin-bottom: 4px; }
        .proof-figure-lesson .lesson-head .pill { display: none; }
        .proof-figure-lesson .stage-nav { margin-block: 4px 6px; }
        .proof-figure-lesson #lesson { padding: 10px 14px; }
        .proof-figure-lesson #lesson > h2 { font-size: 22px; line-height: 1.2; }
        .proof-figure-lesson #lesson > .callout { padding: 6px 8px; }
        .proof-figure-lesson #lesson > .callout p,
        .proof-figure-lesson #lesson > p:has(+ .lesson-figure) { line-height: 1.4; }
        .proof-figure-lesson #lesson > .lesson-figure figcaption { padding-inline-end: 32px; }
      }`;
    document.head.appendChild(style);
  }
  const api={proof,practice,preparePage,proofIds};
  root.GeoProofDiagrams=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
