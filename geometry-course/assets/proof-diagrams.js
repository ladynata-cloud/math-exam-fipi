(function (root) {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ink = '#183247', accent = '#147c78';
  const line = (d, active = false, extra = '') => `<path d="${d}" fill="none" stroke="${active ? accent : ink}" stroke-width="${active ? 3.5 : 2}" ${extra}/>`;
  const point = (id, x, y, dx = 0, dy = 20) => `<circle data-point="${id}" cx="${x}" cy="${y}" r="3" fill="${ink}"/><text x="${x+dx}" y="${y+dy}">${id}</text>`;
  const label = (x, y, value) => `<text x="${x}" y="${y}">${esc(value)}</text>`;
  function figure(kind, id, step, viewBox, title, drawing, caption) {
    return `<figure class="lesson-figure" data-figure-kind="${kind}" data-figure-id="${id}" data-figure-step="${step}" style="margin:10px 0;max-width:360px">
      <svg viewBox="${viewBox}" role="img" aria-label="${esc(title)}" style="display:block;width:100%;height:auto;background:#f3f7f5;border-radius:8px;font:600 18px system-ui;text-anchor:middle;fill:${ink};stroke-linecap:round;stroke-linejoin:round">${drawing}</svg>
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
        line('M117 40l12 9 9-12M126 159h13v13',true)+point('A',18,172)+point('C',126,28,0,-8)+point('H',126,172)+point('B',318,172),caption);
    }
    const caption = ['Четыре копии треугольника помещены в квадрат со стороной a + b.', 'Проверь: у внутренней фигуры равны стороны и прямые углы.', 'Сложи площади четырёх треугольников и внутреннего квадрата.', 'Раскрой квадрат суммы и сравни с суммой площадей.', 'Вычти одинаковое слагаемое 2ab из обеих частей.'][step];
    return figure('proof',id,step,'0 0 260 240','Квадрат со стороной a + b разбит на четыре прямоугольных треугольника и внутреннюю фигуру со сторонами c.',
      `<path d="M34 22H226V214H34Z" fill="${step===2?'#e8ddba':'#e8f2ed'}" stroke="${ink}" stroke-width="2"/>`+
      `<path d="M106 22L226 94L154 214L34 142Z" fill="${step>=1?'#cfe7df':'#fffefa'}" stroke="${accent}" stroke-width="${step===1?3.5:2}"/>`+
      line('M214 22v12h12')+label(70,20,'a')+label(166,20,'b')+label(239,62,'a')+label(239,160,'b')+label(94,234,'b')+label(190,234,'a')+label(21,86,'b')+label(21,184,'a')+label(172,54,'c'),caption);
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

/* All atlas proof scenes. World coordinates retain one equal x/y scale.
 * The first four scenes above are the reviewed #599 components; they remain
 * available through `legacy`. New scenes expose their coordinates for tests. */
(function (root) {
  'use strict';
  const legacy = root.GeoProofDiagrams;
  const E = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], mul=(p,k)=>[p[0]*k,p[1]*k], mid=(a,b)=>mul(add(a,b),.5);
  const dist=(a,b)=>Math.hypot(...sub(a,b)), dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
  const polar=(r,t,o=[0,0])=>[o[0]+r*Math.cos(t*Math.PI/180),o[1]+r*Math.sin(t*Math.PI/180)];
  const foot=(p,a,b)=>add(a,mul(sub(b,a),dot(sub(p,a),sub(b,a))/dot(sub(b,a),sub(b,a))));
  const base=()=>({points:{},segments:[],circles:[],polygons:[],labels:[],arcs:[],rightAngles:[],caption:'Схема условия. Измерение рисунка не заменяет обоснование.'});
  function segment(m,a,b,extra={}){m.segments.push({a,b,...extra});return m;}
  function polygon(m,names,extra={}){m.polygons.push({vertices:names,...extra});return m;}
  const annotate=(m,at,text)=>{m.labels.push({at,text});return m;};
  const tri=(m,names=['A','B','C'],p=[[0,0],[6,0],[2,4]])=>{names.forEach((n,i)=>m.points[n]=p[i]);polygon(m,names);return m;};
  function regular(m,n,r=3,o=[0,0],prefix=''){const ids=[];for(let i=0;i<n;i++){const id=prefix+String.fromCharCode(65+i);m.points[id]=polar(r,90+i*360/n,o);ids.push(id);}polygon(m,ids);return ids;}
  const ids=['segment','angles','vertical','sas','iso','sss','bisector-locus','parallel','triangle-sum','hyp-median','distance','angle-locus','tangent','centers','reflection','polygon','parallelogram','trapezoid','rectangle','rhombus','central','area','area-parallelogram','area-triangle','area-trapezoid','pythagoras','heron','similarity','similarity-signs','midline','centroid','projection','shadow','trig','inscribed','chords','cyclic','vectors','vector-sum','vector-midline','coordinate-midpoint','equation-locus','trig-identity','area-sine','sine-rule','cosine-rule','dot','regular','sector','translation','reflection-path','homothety'];
  ids.push('line-uniqueness','angle-name','rigid-equality','circles-intersection','basis-unique','triangle-solvability','polygon-scale');
  function model(id,value=0){
    if(!ids.includes(id))return null;
    const s=Math.max(0,Math.floor(Number(value)||0)),m=base();m.id=id;m.step=s;
    if(id==='segment'){m.points={A:[0,0],M:[5,0],B:[10,0]};segment(m,'A','B');annotate(m,[5,1],'AB = 10; AM = MB');}
    if(id==='angles'){m.points={C:[0,0],A:polar(4,0),B:polar(4,70),M:polar(4,35)};['A','B','M'].forEach(n=>segment(m,'C',n,{accent:n==='M'}));m.arcs=[{center:'C',radius:1.1,start:0,end:70}];annotate(m,[2.7,3.2],'∠ACB = 70°');}
    if(id==='vertical'){m.points={O:[0,0],A:[-3,0],B:[3,0],C:polar(3,55),D:polar(3,235)};segment(m,'A','B');segment(m,'C','D');if(s)m.arcs=[{center:'O',radius:.8,start:55,end:180},{center:'O',radius:.9,start:235,end:360}];}
    if(id==='sas'){tri(m);tri(m,['D','E','F'],[[8,0],[14,0],[10,4]]);annotate(m,[7,-2.2],'AB = DE; AC = DF');m.arcs=[{center:'A',radius:1,start:0,end:Math.atan2(4,2)*180/Math.PI},{center:'D',radius:1,start:0,end:Math.atan2(4,2)*180/Math.PI}];if(s>1){segment(m,'B','C',{accent:true});segment(m,'E','F',{accent:true});}}
    if(id==='iso'){tri(m,['A','B','C'],[[0,0],[6,0],[3,4]]);m.points.D=[3,0];segment(m,'C','D',{accent:true});annotate(m,[3,5],'CA = CB; CD — биссектриса');if(s>=3)m.rightAngles=[{vertex:'D',a:'A',b:'C'}];}
    if(id==='sss'){m.points={A:[0,0],B:[2,3],C:[6,0],D:[2,-3]};polygon(m,['A','B','C','D']);segment(m,'A','C',{accent:true});annotate(m,[6.4,2.6],'AB = AD');annotate(m,[6.4,1.6],'BC = DC');}
    if(id==='bisector-locus'){m.points={A:[-3,0],M:[0,0],B:[3,0],P:[0,4]};segment(m,'A','B');segment(m,'P','A');segment(m,'P','B');segment(m,'P','M',{accent:true});if(s===1||s===2||s>=4)m.rightAngles=[{vertex:'M',a:'B',b:'P'}];annotate(m,[0,-1],'AM = MB');m.caption='Один допустимый случай. Прямое и обратное утверждения требуют отдельных доводов.';}
    if(id==='parallel'){m.points={};segment(m,[-4,0],[4,0]);segment(m,[-4,3],[4,3]);segment(m,[-2,-1],[2,5]);annotate(m,[-4.2,.4],'a');annotate(m,[-4.2,3.4],'b');m.arcs=[{center:[-4/3,0],radius:.5,start:0,end:56.309932474},{center:[2/3,3],radius:.5,start:180,end:236.309932474}];m.caption='Равенство накрест лежащих углов дано. Параллельность обосновывается признаком.';}
    if(id==='triangle-sum'){tri(m);if(s>=1){segment(m,[-1,4],[7,4],{accent:true,dashed:true});annotate(m,[6.5,4.7],'∥ AB');}if(s>=2)m.arcs=[{center:'C',radius:.8,start:180,end:360}];}
    if(id==='hyp-median'){tri(m,['A','B','C'],[[0,2*Math.sqrt(3)],[2,0],[0,0]]);m.rightAngles=[{vertex:'C',a:'A',b:'B'}];annotate(m,[.8,2.5],'30°');if(s>=1){m.points.D=[-2,0];segment(m,'C','D',{dashed:true,accent:true});segment(m,'A','D',{dashed:true});annotate(m,[-1,-.9],'CD = CB');}}
    if(id==='distance'){m.points={A:[-2,0],B:[5,0],H:[0,0],K:[4,0],C:[0,3]};segment(m,'A','B');segment(m,'C','H',{accent:true});segment(m,'C','K');m.rightAngles=[{vertex:'H',a:'K',b:'C'}];}
    if(id==='angle-locus'){m.points={O:[0,0],A:polar(6,0),B:polar(6,70),P:polar(4,35)};m.points.H=foot(m.points.P,m.points.O,m.points.A);m.points.K=foot(m.points.P,m.points.O,m.points.B);segment(m,'O','A');segment(m,'O','B');segment(m,'O','P',{dashed:true});segment(m,'P','H',{accent:true});segment(m,'P','K',{accent:true});m.rightAngles=[{vertex:'H',a:'A',b:'P'},{vertex:'K',a:'B',b:'P'}];m.caption='P внутри угла; PH и PK проведены к прямым, содержащим стороны. Два направления доказательства рассматриваются отдельно.';}
    if(id==='tangent'){m.points={O:[0,2],T:[0,0]};m.circles=[{center:'O',radius:2}];segment(m,[-3,0],[4,0]);segment(m,'O','T',{accent:true});m.rightAngles=[{vertex:'T',a:[1,0],b:'O'}];annotate(m,[4,-.4],'l');if(s>=1){m.points.P=[3,0];segment(m,'O','P',{dashed:true,accent:true});}}
    if(id==='centers'){tri(m);m.points.O=[3,1];if(s>=3)m.circles=[{center:'O',radius:Math.sqrt(10)}];segment(m,[3,-1],[3,4],{dashed:true});segment(m,[0,-2],[6,4],{dashed:true});if(s>=1)['A','B'].forEach(n=>segment(m,'O',n,{accent:true}));if(s>=2)segment(m,'O','C',{accent:true});}
    if(id==='reflection'){m.points={P:[-2,1],H:[0,1],'P′':[2,1]};segment(m,[0,-2],[0,4]);segment(m,'P','P′',{accent:true});m.rightAngles=[{vertex:'H',a:'P′',b:[0,2]}];annotate(m,[.5,3.5],'l');annotate(m,[0,-1],'HP = HP′');}
    if(id==='polygon'){const names=regular(m,6);if(s>=1)names.slice(2,-1).forEach(n=>segment(m,names[0],n,{dashed:true,accent:true}));annotate(m,[0,-5],'Выпуклый шестиугольник');}
    if(['parallelogram','rectangle','rhombus','central'].includes(id)){m.points=id==='rectangle'?{A:[0,0],B:[6,0],C:[6,4],D:[0,4]}:id==='rhombus'?{A:[-3,0],B:[0,2],C:[3,0],D:[0,-2]}:{A:[0,0],B:[6,0],C:[8,3],D:[2,3]};polygon(m,['A','B','C','D']);if(id!=='rectangle'||s>=1)segment(m,'A','C',{accent:true});if(id!=='parallelogram'&&(id!=='rectangle'||s>=1))segment(m,'B','D',{dashed:true});if(['rhombus','central'].includes(id)){m.points.O=mid(m.points.A,m.points.C);if(id==='rhombus'&&s>=3)m.rightAngles=[{vertex:'O',a:'A',b:'B'}];}if(id==='rectangle')m.rightAngles=[{vertex:'A',a:'B',b:'D'},{vertex:'B',a:'A',b:'C'}];}
    if(['trapezoid','area-trapezoid'].includes(id)){m.points={A:[0,0],B:[1,3],C:[4,3],D:[7,0]};polygon(m,['A','B','C','D']);annotate(m,[3.5,-.9],'AD');annotate(m,[2.5,3.8],'BC ∥ AD');if(id==='trapezoid'){m.points.M=mid(m.points.A,m.points.B);m.points.N=mid(m.points.C,m.points.D);m.points.K=mid(m.points.A,m.points.C);segment(m,'A','C',{dashed:true});if(s>=1)segment(m,'M','K',{accent:true});if(s>=2)segment(m,'K','N',{accent:true});}else{annotate(m,[7.8,1.5],'h');segment(m,[7,0],[7,3],{dashed:true});if(s>=1)segment(m,'A','C',{accent:true});}}
    if(id==='area'){m.points={A:[0,0],B:[5,0],C:[5,5],D:[0,5]};polygon(m,['A','B','C','D']);for(let i=1;i<5;i++){segment(m,[i,0],[i,5],{muted:true});segment(m,[0,i],[5,i],{muted:true});}annotate(m,[2.5,-1],'Сторона — 1 м');m.caption='Схема разбиения. На каждой стороне нужно 100 сантиметровых отрезков; на рисунке показаны только некоторые линии сетки.';}
    if(id==='area-parallelogram'){m.points={A:[0,0],B:[6,0],C:[8,3],D:[2,3],H:[2,0],K:[8,0]};polygon(m,['A','B','C','D']);segment(m,'D','H',{accent:true,dashed:true});segment(m,'C','K',{dashed:true});segment(m,'B','K',{dashed:true});m.rightAngles=[{vertex:'H',a:'B',b:'D'}];annotate(m,[3,-.8],'a');annotate(m,[2.5,1.5],'h');if(s>=1){polygon(m,['A','D','H'],{fill:'#f7dba9'});polygon(m,['B','C','K'],{fill:'#c8e9da',dashed:true});}}
    if(id==='area-triangle'){tri(m,['A','B','C'],[[0,0],[6,0],[8,3]]);m.points.H=[8,0];segment(m,'C','H',{dashed:true});segment(m,'B','H',{dashed:true});annotate(m,[8.7,1.5],'h');if(s>=1){m.points.D=[2,3];segment(m,'C','D',{accent:true});segment(m,'D','A',{accent:true});}m.caption='Треугольник ABC — половина достроенного параллелограмма ABCD. Высота относится ко всей прямой AB.';}
    if(id==='pythagoras'){m.points={A:[0,0],B:[7,0],C:[7,7],D:[0,7],P:[3,0],Q:[7,3],R:[4,7],S:[0,4]};polygon(m,['A','B','C','D']);polygon(m,['P','Q','R','S'],{fill:'#c8e9da'});annotate(m,[1.5,-.8],'a');annotate(m,[5,-.8],'b');annotate(m,[5.8,1],'c');m.caption='Четыре равных прямоугольных треугольника. Равенство сторон и прямые углы внутренней фигуры нужно обосновать.';}
    if(id==='heron'){tri(m,['A','B','C'],[[0,0],[14,0],[5,12]]);m.points.H=[5,0];segment(m,'C','H',{dashed:true,accent:true});annotate(m,[2,6],'13');annotate(m,[10,7],'15');annotate(m,[7,-1.4],'14');annotate(m,[2.5,.8],'x');annotate(m,[6,6],'h');m.rightAngles=[{vertex:'H',a:'B',b:'C'}];}
    if(id==='similarity'||id==='trig'){const right=id==='trig';const p=right?[[0,0],[4,0],[0,3]]:[[0,0],[4,0],[1,3]];tri(m,['A','B','C'],p);tri(m,['D','E','F'],p.map(([x,y])=>[6+1.4*x,1.4*y]));if(right){m.rightAngles=[{vertex:'A',a:'B',b:'C'},{vertex:'D',a:'E',b:'F'}];annotate(m,[3.2,.5],'α');annotate(m,[10.7,.6],'α');}else if(s>=2){m.points.H=[1,0];m.points.K=[7.4,0];segment(m,'C','H',{dashed:true,accent:true});segment(m,'F','K',{dashed:true,accent:true});}m.caption=right?'Одинаковый острый угол, разные размеры. Сопоставь противолежащие катеты и гипотенузы.':'Соответствие A ↔ D, B ↔ E, C ↔ F; коэффициент k > 0.';}
    if(['similarity-signs','midline','vector-midline'].includes(id)){tri(m);const ratio=id==='similarity-signs'?.6:.5;m.points.M=add(m.points.C,mul(sub(m.points.A,m.points.C),ratio));m.points.N=add(m.points.C,mul(sub(m.points.B,m.points.C),ratio));segment(m,'M','N',{accent:true,arrow:id==='vector-midline'});if(id==='vector-midline'){segment(m,'C','M',{arrow:true});segment(m,'C','N',{arrow:true});segment(m,'A','B',{arrow:true});}m.caption=id==='similarity-signs'?'MN ∥ AB дано. Общая вершина — C.':'M и N — середины соответствующих сторон; сравниваем отрезки с одной и той же ролью.';}
    if(id==='centroid'){tri(m);m.points.M=mid(m.points.B,m.points.C);m.points.N=mid(m.points.A,m.points.C);m.points.G=mul(add(add(m.points.A,m.points.B),m.points.C),1/3);segment(m,'A','M');segment(m,'B','N');if(s>=1)segment(m,'M','N',{accent:true});}
    if(id==='projection'){tri(m,['A','B','C'],[[0,0],[9,0],[3,Math.sqrt(18)]]);m.points.H=[3,0];segment(m,'C','H',{accent:true});m.rightAngles=[{vertex:'C',a:'A',b:'B'},{vertex:'H',a:'B',b:'C'}];}
    if(id==='shadow'){tri(m,['A','B','C'],[[0,0],[3,0],[0,2]]);tri(m,['D','E','F'],[[5,0],[11,0],[5,4]]);m.rightAngles=[{vertex:'A',a:'B',b:'C'},{vertex:'D',a:'E',b:'F'}];annotate(m,[6,-1.7],'Земля горизонтальна');m.caption='BC и EF показывают направления солнечных лучей. Измерения выполняются в один момент.';}
    if(id==='inscribed'){m.points={O:[0,0],C:[-3,0],B:[3,0],A:polar(3,65)};m.circles=[{center:'O',radius:3}];polygon(m,['A','B','C']);segment(m,'O','A',{accent:true});m.caption='CB — диаметр. Центральный угол AOB и вписанный угол ACB опираются на одну дугу AB.';}
    if(id==='chords'){m.points={O:[0,0],A:[-3,0],B:[3,0],C:[1,Math.sqrt(8)],D:[1,-Math.sqrt(8)],P:[1,0]};m.hiddenPoints=['O'];m.circles=[{center:'O',radius:3}];segment(m,'A','B');segment(m,'C','D');if(s>=2){segment(m,'A','C',{accent:true});segment(m,'D','B',{accent:true});}m.caption='P — внутренняя точка пересечения хорд. Сопоставь треугольники PAC и PDB, не меняя порядок вершин.';}
    if(id==='cyclic'){m.points={O:[0,0],A:polar(3,15),B:polar(3,100),C:polar(3,205),D:polar(3,285)};m.hiddenPoints=['O'];m.circles=[{center:'O',radius:3}];polygon(m,['A','B','C','D']);if(s>=1)m.arcs.push({center:'O',radius:3.12,start:100,end:285});if(s>=2)m.arcs.push({center:'O',radius:3.3,start:285,end:460});}
    if(id==='vectors'){m.points={A:[0,0],B:[4,2],C:[1,-2],D:[5,0]};segment(m,'A','B',{arrow:true});segment(m,'C','D',{arrow:true,accent:true});annotate(m,[5.5,2],'AB = CD');}
    if(id==='vector-sum'){m.points={A:[0,0],B:[4,0],C:[6,3]};segment(m,'A','B',{arrow:true});segment(m,'B','C',{arrow:true});if(s>=2)segment(m,'A','C',{arrow:true,accent:true});}
    if(id==='coordinate-midpoint'){m.points={A:[1,1],B:[7,5],M:[4,3]};segment(m,'A','B',{accent:true});m.axes=true;annotate(m,[1,-.2],'(x₁; y₁)');annotate(m,[7,6],'(x₂; y₂)');if(s>=1){segment(m,[1,1],[7,1],{dashed:true});segment(m,[7,1],[7,5],{dashed:true});}}
    if(id==='equation-locus'){m.points={O:[2,2],P:[5,6]};m.circles=[{center:'O',radius:5}];segment(m,'O','P',{accent:true});m.axes=true;if(s>=1){m.points.H=[5,2];segment(m,'O','H',{dashed:true});segment(m,'H','P',{dashed:true});m.rightAngles=[{vertex:'H',a:'O',b:'P'}];}annotate(m,[1,3],'(a; b)');m.pointOffsets={P:[-12,18]};annotate(m,[5.5,7.5],'(x; y)');}
    if(id==='trig-identity'){m.points={O:[0,0],P:polar(1,125),H:[Math.cos(125*Math.PI/180),0]};m.axes=true;m.circles=[{center:'O',radius:1}];segment(m,'O','P',{accent:true});segment(m,'P','H',{dashed:true});segment(m,'O','H',{dashed:true});m.caption='Единичная окружность. Для тупого угла P слева от оси y: первая координата отрицательна.';}
    if(id==='area-sine'||id==='cosine-rule'){tri(m,['A','B','C'],[[0,0],[6,0],[2,4]]);m.points.H=[2,0];segment(m,'C','H',{dashed:true,accent:true});m.rightAngles=[{vertex:'H',a:'B',b:'C'}];annotate(m,[3,-.9],'c');annotate(m,[.4,2.2],'b');annotate(m,[.7,.4],'α');if(id==='cosine-rule')m.axes=true;}
    if(id==='sine-rule'){tri(m);annotate(m,[4.4,2.3],'a');annotate(m,[.4,2.3],'b');annotate(m,[3,-.8],'c');if(s>=1){m.points.H=[2,0];segment(m,'C','H',{dashed:true,accent:true});}}
    if(id==='dot'){m.points={O:[0,0],U:[5,0],V:[2,3]};segment(m,'O','U',{arrow:true});segment(m,'O','V',{arrow:true,accent:true});if(s>=1)segment(m,'V','U',{arrow:true,dashed:true});annotate(m,[2.5,-.8],'u');annotate(m,[.2,1.8],'v');annotate(m,[1,.35],'α');m.caption='Векторы приложены к одному началу. От конца v к концу u идёт вектор u − v.';}
    if(id==='regular'){const ns=regular(m,6);m.points.O=[0,0];if(s>=1)ns.forEach(n=>segment(m,'O',n,{dashed:true}));if(s>=2){m.points.H=mid(m.points.A,m.points.B);segment(m,'O','H',{accent:true});annotate(m,mul(m.points.H,.5),'r');}}
    if(id==='sector'){m.points={O:[0,0],A:polar(3,0),B:polar(3,120)};m.circles=[{center:'O',radius:3}];segment(m,'O','A');segment(m,'O','B');m.arcs=[{center:'O',radius:3,start:0,end:120},{center:'O',radius:.7,start:0,end:120}];annotate(m,[1.8,.4],'R');annotate(m,[.4,1],'α');}
    if(id==='translation'){m.points={A:[0,0],B:[3,1],'A′':[2,3],'B′':[5,4]};segment(m,'A','B');segment(m,'A′','B′',{accent:true});segment(m,'A','A′',{arrow:true,dashed:true});segment(m,'B','B′',{arrow:true,dashed:true});annotate(m,[.6,1.7],'v');annotate(m,[4.4,2.6],'v');}
    if(id==='reflection-path'){m.points={A:[0,3],B:[6,2],M:[2,0]};segment(m,[-1,0],[8,0]);segment(m,'A','M');segment(m,'M','B');annotate(m,[8,-.4],'l');if(s>=1){m.points['B′']=[6,-2];segment(m,'B','B′',{dashed:true});segment(m,'M','B′',{accent:true});}if(s>=3){m.points['M₀']=[3.6,0];segment(m,'A','B′',{accent:true,dashed:true});}}
    if(id==='homothety'){m.points={O:[0,0],A:[2,1],B:[3,3],'A′':[-3,-1.5],'B′':[-4.5,-4.5]};segment(m,'A','B');segment(m,'A′','B′',{accent:true});['A','B','A′','B′'].forEach(n=>segment(m,'O',n,{dashed:true,arrow:true}));m.caption='Показан случай k < 0: образы на противоположных лучах. При k > 0 стороны сохраняются относительно центра.';}
    if(id==='line-uniqueness'){m.points={A:[0,0],B:[6,0]};segment(m,[-2,0],[8,0]);segment(m,[-1.5,0],[7.5,0],{accent:true,dashed:true});annotate(m,[3,1],'A ≠ B');m.caption='Обе предложенные прямые проходят через A и B. Утверждение об их совпадении использует аксиому, а не толщину линии.';}
    if(id==='angle-name'){m.points={O:[0,0],A:polar(3,0),P:polar(5,0),B:polar(3,55),Q:polar(5,55)};segment(m,'O','P');segment(m,'O','Q');m.arcs=[{center:'O',radius:1,start:0,end:55}];m.caption='Вершина O не меняется. A и P лежат на одном луче, B и Q — на другом.';}
    if(id==='rigid-equality'){const a=35*Math.PI/180;m.points={A:[0,0],B:[5,0],C:[7,1],D:[7+5*Math.cos(a),1+5*Math.sin(a)]};segment(m,'A','B');segment(m,'C','D',{accent:true});m.caption='C — образ A, D — образ B. Отрезок изменил положение после переноса и поворота без растяжения.';}
    if(id==='circles-intersection'){
      const d=4,R=3,r=2,x=(d*d+R*R-r*r)/(2*d),y=Math.sqrt(R*R-x*x);
      m.points={O:[0,0],P:[d,0]};m.circles=[{center:'O',radius:R},{center:'P',radius:r,accent:true}];segment(m,'O','P');
      if(s>=1){m.points.X=[x,y];segment(m,'O','X',{accent:true});segment(m,'P','X',{accent:true});}
      if(s>=3){m.points['X′']=[x,-y];segment(m,'O','X′',{dashed:true});segment(m,'P','X′',{dashed:true});}
      annotate(m,[d/2,-R-1],'OP = d; радиусы R и r');
      m.caption=s===0?'Две окружности заданы центрами и радиусами. Общие точки предстоит исследовать.':'X — предполагаемая общая точка. Свяжи расстояния OX, PX и OP с условиями существования треугольника.';
      if(s===3)m.caption='При строгих неравенствах X и X′ лежат по разные стороны OP и переходят друг в друга отражением.';
      if(s===4){m.points={O:[0,0],P:[5,0],X:[3,0],'O₂':[12,0],'P₂':[13,0],'X₂':[15,0]};m.pointOffsets={'O₂':[-16,-12],'P₂':[2,22],'X₂':[16,-12]};m.circles=[{center:'O',radius:3},{center:'P',radius:2,accent:true},{center:'O₂',radius:3},{center:'P₂',radius:2,accent:true}];m.segments=[];segment(m,'O','P');segment(m,'O₂','X₂');m.labels=[];annotate(m,[2.5,-4],'d = R + r');annotate(m,[12.5,-4],'d = R − r > 0');m.caption='Граничные случаи: внешнее касание слева, внутреннее справа. В каждом примере центры различны и общая точка одна.';}
      if(s>=5){m.points={O:[0,0],P:[0,0],'O₂':[8,0],'P₂':[8,0]};m.hiddenPoints=['P','P₂'];m.pointLabels={O:'O = P','O₂':'O₂ = P₂'};m.pointOffsets={O:[0,20],'O₂':[0,20]};m.circles=[{center:'O',radius:3},{center:'P',radius:3,accent:true,dashed:true},{center:'O₂',radius:3},{center:'P₂',radius:2,accent:true}];m.segments=[];m.labels=[];annotate(m,[0,-4],'d = 0, R = r');annotate(m,[8,-4],'d = 0, R ≠ r');m.caption='При совпавших центрах равные радиусы задают одну окружность (слева), разные — две концентрические окружности без общих точек (справа).';}
    }
    if(id==='basis-unique'){m.points={O:[0,0],A:[3,0],B:[1,2],V:[5,4],H:[3,0],K:[2,4]};m.hiddenPoints=['H'];segment(m,'O','A',{arrow:true});segment(m,'O','B',{arrow:true,accent:true});segment(m,'O','V',{arrow:true});if(s>=1){segment(m,'A','V',{dashed:true});segment(m,'K','V',{dashed:true});segment(m,'O','K',{dashed:true});}annotate(m,[1.5,-.7],'a');annotate(m,[.1,1.2],'b');annotate(m,[3.1,2.1],'v');m.caption='a и b неколлинеарны. Два разложения сравниваются через их разность; рисунок не заменяет доказательство единственности.';}
    if(id==='triangle-solvability'){tri(m,['A','B','C'],[[0,0],[5,0],[3.2,2.4]]);annotate(m,[2.5,-.8],'5');annotate(m,[1.2,1.5],'4');annotate(m,[4.6,1.5],'3');if(s>=2&&s<4)m.circles=[{center:'A',radius:4},{center:'B',radius:3}];if(s>=3)m.rightAngles=[{vertex:'C',a:'A',b:'B'}];m.caption='Показан набор сторон 3, 4, 5. Положение треугольника можно менять движением; его существование нужно обосновать.';if(s>=4){m.points.D=[0,-3];m.points.F=[3,-3];m.points.E=[7,-3];segment(m,'D','E');annotate(m,[1.5,-2.5],'3');annotate(m,[5,-2.5],'4');annotate(m,[3.5,-4.3],'DE = 7');m.caption='Первый набор задаёт невырожденный треугольник. При длинах 3, 4, 7 остаётся коллинеарное положение: 3 + 4 = 7.';}}
    if(id==='polygon-scale'){const p=[[0,0],[3,0],[4,2],[2,4],[-1,2]],names=['A','B','C','D','E'];names.forEach((n,i)=>{m.points[n]=p[i];m.points[n+'′']=[7+p[i][0]*1.3,p[i][1]*1.3];});polygon(m,names);polygon(m,names.map(n=>n+'′'));if(s>=1)for(const n of ['C','D'])segment(m,'A',n,{dashed:true,accent:true});if(s>=2)for(const n of ['C','D'])segment(m,'A′',n+'′',{dashed:true,accent:true});m.caption='Соответствующие вершины указаны штрихами. Сравниваются площади соответствующих треугольников разбиения.';}
    return m;
  }
  // Text is placed in screen coordinates after the mathematical drawing is
  // complete. Font bounds, rather than character counts, reserve the space.
  const textMetricCache=new Map();
  let textContext;
  function textMetrics(text,font=20){
    const key=font+'|'+text;
    if(textMetricCache.has(key))return textMetricCache.get(key);
    if(textContext===undefined){
      textContext=null;
      if(root.document&&typeof root.CanvasRenderingContext2D==='function'){
        try{textContext=root.document.createElement('canvas').getContext('2d');}catch(_error){}
      }
    }
    let width=0,ascent=font*1.15,descent=font*.38;
    if(textContext){
      textContext.font=`600 ${font}px system-ui`;
      const metric=textContext.measureText(text);
      width=metric.width;
      ascent=Math.max(ascent,metric.fontBoundingBoxAscent||0);
      descent=Math.max(descent,metric.fontBoundingBoxDescent||0);
    }else{
      // Conservative fallback for Node/DOM-only tests and browsers without
      // Canvas. It also covers the wider common system sans-serif fonts.
      for(const char of String(text))width+=font*(/\s/.test(char)?.36:/[ilIjt.,:;!′₀₁₂₃₄₅₆₇₈₉]/.test(char)?.45:/[MWmwЖШЩЮЫжшщюм]/.test(char)?1.1:/[A-ZА-ЯЁ]/.test(char)?.85:/[0-9]/.test(char)?.7:/[а-яёa-zαβγ]/.test(char)?.7:.8);
    }
    const result={width:Math.max(1,width)+2,ascent,descent};
    textMetricCache.set(key,result);return result;
  }
  function wrapNote(text,maxWidth=220){
    const rows=[];let row='';
    for(const word of String(text).split(/\s+/).filter(Boolean)){
      const candidate=row?row+' '+word:word;
      if(row&&textMetrics(candidate).width>maxWidth){rows.push(row);row=word;}else row=candidate;
    }
    if(row)rows.push(row);
    return rows.length?rows:[''];
  }
  function layoutLabels(labels,width,height,pointObstacles=[]){
    const inset=4,gap=3,lineHeight=24;
    const collide=(a,b)=>a.left<b.right+gap&&a.right+gap>b.left&&a.top<b.bottom+gap&&a.bottom+gap>b.top;
    const occupied=[],placed=[];
    const prepared=labels.map((label,index)=>{
      const rows=label.rows||[label.text],metrics=rows.map(row=>textMetrics(row));
      const boxWidth=Math.max(...metrics.map(m=>m.width))+2,ascent=Math.max(...metrics.map(m=>m.ascent))+1,descent=Math.max(...metrics.map(m=>m.descent))+1;
      return {...label,index,rows,boxWidth,ascent,descent,boxHeight:ascent+descent+(rows.length-1)*lineHeight};
    }).filter(label=>label.rows.some(row=>String(row).trim()));
    prepared.sort((a,b)=>{
      const priority=l=>l.kind==='axis'?0:l.kind==='note'&&l.boxWidth>90?1:l.kind==='point'?2:3;
      return priority(a)-priority(b)||a.index-b.index;
    });
    for(const label of prepared){
      const {boxWidth,ascent,descent,rows}=label;
      const clamp=(x,y)=>[Math.max(inset+boxWidth/2,Math.min(width-inset-boxWidth/2,x)),Math.max(inset+ascent,Math.min(height-inset-descent-(rows.length-1)*lineHeight,y))];
      const rectangle=(x,y)=>({left:x-boxWidth/2,right:x+boxWidth/2,top:y-ascent,bottom:y+descent+(rows.length-1)*lineHeight});
      const seen=new Set(),candidates=[];
      const addCandidate=(x,y)=>{const p=clamp(x,y),key=p.map(v=>v.toFixed(2)).join(',');if(!seen.has(key)){seen.add(key);candidates.push(p);}};
      addCandidate(label.x,label.y);
      // Nearby alternatives keep the association with the marked point clear.
      for(const radius of [12,24,40,56,80,112,144])for(const [dx,dy]of [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]])addCandidate(label.x+dx*radius,label.y+dy*radius);
      const free=p=>{const rect=rectangle(...p);return !occupied.some(other=>collide(rect,other))&&!pointObstacles.some(other=>collide(rect,other));};
      let chosen=candidates.find(free);
      if(!chosen){
        const grid=[];
        for(let y=inset+ascent;y<=height-inset-descent-(rows.length-1)*lineHeight;y+=8)for(let x=inset+boxWidth/2;x<=width-inset-boxWidth/2;x+=8)grid.push([x,y]);
        grid.sort((a,b)=>Math.hypot(a[0]-label.x,a[1]-label.y)-Math.hypot(b[0]-label.x,b[1]-label.y));
        chosen=grid.find(free);
      }
      if(!chosen){
        // Extremely dense caller-authored scenes remain finite and report their
        // crowding, instead of changing the geometry or reducing the font.
        const cost=p=>{const r=rectangle(...p);return occupied.reduce((sum,o)=>sum+Math.max(0,Math.min(r.right,o.right)-Math.max(r.left,o.left))*Math.max(0,Math.min(r.bottom,o.bottom)-Math.max(r.top,o.top)),0);};
        chosen=candidates.slice().sort((a,b)=>cost(a)-cost(b))[0];label.crowded=true;
      }
      const rect=rectangle(...chosen),result={...label,x:chosen[0],y:chosen[1],rect,lineHeight};
      occupied.push(rect);placed.push(result);
    }
    return placed.sort((a,b)=>a.index-b.index);
  }
  function render(m,{kind='proof',id=m?.id||'',step=m?.step||0,title,caption}={}){
    if(!m)return '';
    const resolve=p=>typeof p==='string'?m.points[p]:p;
    const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
    let bound=[];Object.values(m.points||{}).forEach(p=>{if(finite(p))bound.push(p);});
    for(const s of m.segments||[])for(const p of [s.a,s.b])if(finite(resolve(p)))bound.push(resolve(p));
    for(const c of m.circles||[]){const p=resolve(c.center);if(finite(p)&&Number.isFinite(c.radius)&&c.radius>0)bound.push([p[0]-c.radius,p[1]-c.radius],[p[0]+c.radius,p[1]+c.radius]);}
    for(const l of m.labels||[])if(finite(resolve(l.at)))bound.push(resolve(l.at));
    if(!bound.length)return '';
    if(m.axes)bound.push([0,0]);
    const minX=Math.min(...bound.map(p=>p[0])),maxX=Math.max(...bound.map(p=>p[0])),minY=Math.min(...bound.map(p=>p[1])),maxY=Math.max(...bound.map(p=>p[1]));
    const W=360,H=230,padX=32,padY=30,scale=Math.min((W-padX*2)/Math.max(maxX-minX,1),(H-padY*2)/Math.max(maxY-minY,1));
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2,to=p=>[W/2+(p[0]-cx)*scale,H/2-(p[1]-cy)*scale],num=n=>Number(n.toFixed(5));
    const pos=p=>to(resolve(p)).map(num),ink='#244638',green='#147c78';
    let d='';const labels=[];
    const line=(a,b,{accent=false,dashed=false,muted=false,arrow=false}={})=>{const p=pos(a),q=pos(b);let h=`<path d="M${p.join(' ')}L${q.join(' ')}" fill="none" stroke="${accent?green:muted?'#a4b5af':ink}" stroke-width="${accent?3:2}"${dashed?' stroke-dasharray="5 4"':''}/>`;if(arrow){const dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy);if(l>1){const ux=dx/l,uy=dy/l;h+=`<path d="M${num(q[0]-8*ux+4*uy)} ${num(q[1]-8*uy-4*ux)}L${q.join(' ')}L${num(q[0]-8*ux-4*uy)} ${num(q[1]-8*uy+4*ux)}" fill="none" stroke="${accent?green:ink}" stroke-width="2"/>`;}}return h;};
    if(m.axes){const z=to([0,0]);d+=`<path d="M15 ${num(z[1])}H345M${num(z[0])} 215V15" stroke="#b8c6c0" stroke-width="1.2" fill="none"/>`;labels.push({key:'axis-x',kind:'axis',text:'x',x:337,y:Math.min(216,z[1]+16)},{key:'axis-y',kind:'axis',text:'y',x:Math.max(16,z[0]-18),y:24});}
    for(const p of m.polygons||[]){if(!p.vertices.every(n=>finite(resolve(n))))continue;d+=`<polygon points="${p.vertices.map(n=>pos(n).join(',')).join(' ')}" fill="${p.fill||'#e4f0e9'}" fill-opacity=".7" stroke="${p.accent?green:ink}" stroke-width="2"${p.dashed?' stroke-dasharray="5 4"':''}/>`;}
    for(const c of m.circles||[]){const p=pos(c.center);if(!(c.radius>0))continue;d+=`<circle cx="${p[0]}" cy="${p[1]}" r="${num(c.radius*scale)}" stroke="${c.accent?green:ink}" stroke-width="2"${c.dashed?' stroke-dasharray="5 4"':''} fill="none"/>`;}
    for(const s of m.segments||[])if(finite(resolve(s.a))&&finite(resolve(s.b)))d+=line(s.a,s.b,s);
    for(const a of m.arcs||[]){const o=resolve(a.center),radius=a.radius;if(!finite(o)||!(radius>0))continue;const sweep=a.end-a.start,parts=Math.max(1,Math.ceil(Math.abs(sweep)/170));let q='';for(let i=0;i<=parts;i++){const p=to(polar(radius,a.start+sweep*i/parts,o));q+=(i?' A'+num(radius*scale)+' '+num(radius*scale)+' 0 0 '+(sweep>=0?0:1)+' ':'M')+p.map(num).join(' ');}d+=`<path d="${q}" fill="none" stroke="${green}" stroke-width="2.5"/>`;}
    for(const a of m.rightAngles||[]){const p=resolve(a.vertex),v=sub(resolve(a.a),p),w=sub(resolve(a.b),p),lv=Math.hypot(...v),lw=Math.hypot(...w);if(!lv||!lw)continue;const e=9/scale,u=mul(v,e/lv),z=mul(w,e/lw);d+=line(add(p,u),add(add(p,u),z),{accent:true})+line(add(add(p,u),z),add(p,z),{accent:true});}
    const hide=new Set(m.hiddenPoints||[]),groups=[],pointObstacles=[];
    for(const [name,value]of Object.entries(m.points||{})){
      if(hide.has(name)||!finite(value))continue;
      const p=to(value);
      d+=`<circle data-point="${E(name)}" data-world-x="${value[0]}" data-world-y="${value[1]}" cx="${num(p[0])}" cy="${num(p[1])}" r="2.8" fill="${ink}"/>`;
      let group=groups.find(group=>dist(group.position,p)<1e-7);
      if(!group){group={position:p,names:[],texts:[]};groups.push(group);pointObstacles.push({left:p[0]-4,right:p[0]+4,top:p[1]-4,bottom:p[1]+4});}
      group.names.push(name);group.texts.push(m.pointLabels?.[name]||name);
    }
    for(const group of groups){
      const p=group.position,name=group.names[0],offset=m.pointOffsets?.[name]||[p[0]<W/2?-10:10,p[1]<H/2?-9:18];
      labels.push({key:group.names.join(' '),kind:'point',text:[...new Set(group.texts)].join(' = '),target:p,x:p[0]+offset[0],y:p[1]+offset[1]});
    }
    const featureEdges=(m.segments||[]).filter(edge=>finite(resolve(edge.a))&&finite(resolve(edge.b))).map(edge=>[pos(edge.a),pos(edge.b)]);
    for(const polygon of m.polygons||[])for(let i=0;i<polygon.vertices.length;i++){
      const a=resolve(polygon.vertices[i]),b=resolve(polygon.vertices[(i+1)%polygon.vertices.length]);
      if(finite(a)&&finite(b))featureEdges.push([to(a),to(b)]);
    }
    const noteTarget=p=>{
      const candidates=groups.map(group=>group.position);
      for(const [a,b]of featureEdges){const v=sub(b,a),length=dot(v,v);if(length)candidates.push(add(a,mul(v,Math.max(0,Math.min(1,dot(sub(p,a),v)/length)))));}
      for(const circle of m.circles||[]){const center=pos(circle.center),v=sub(p,center),length=Math.hypot(...v);if(length)candidates.push(add(center,mul(v,circle.radius*scale/length)));}
      const nearest=candidates.sort((a,b)=>dist(a,p)-dist(b,p))[0];
      return nearest&&dist(nearest,p)<=18?nearest:undefined;
    };
    for(const [index,note]of (m.labels||[]).entries()){
      if(!finite(resolve(note.at))||!String(note.text).trim())continue;
      const p=pos(note.at),rows=wrapNote(note.text);
      labels.push({key:'note-'+index,kind:'note',rows,target:noteTarget(p),x:p[0],y:p[1]-(rows.length-1)*12});
    }
    const placed=layoutLabels(labels,W,H,pointObstacles);
    for(const label of placed){
      const rect=label.rect;
      if(label.target&&Math.hypot(label.x-label.target[0],label.y-label.target[1])>38){
        const p=label.target,q=[Math.max(rect.left,Math.min(rect.right,p[0])),Math.max(rect.top,Math.min(rect.bottom,p[1]))];
        if(Math.hypot(q[0]-p[0],q[1]-p[1])>18)d+=`<path class="diagram-leader" d="M${p.map(num).join(' ')}L${q.map(num).join(' ')}" fill="none" stroke="#73877c" stroke-width="1.2"/>`;
      }
    }
    for(const label of placed){
      d+=`<text data-label-kind="${label.kind}" data-label-for="${E(label.key)}" data-label-box="${[label.rect.left,label.rect.top,label.rect.right,label.rect.bottom].map(num).join(' ')}"${label.crowded?' data-label-crowded="true"':''} x="${num(label.x)}" y="${num(label.y)}" text-anchor="middle"${label.kind==='note'?' class="diagram-note" font-size="20"':''} paint-order="stroke" stroke="#f3f7f5" stroke-width="3" stroke-linejoin="round">${label.rows.length===1?E(label.rows[0]):label.rows.map((row,index)=>`<tspan x="${num(label.x)}" dy="${index?label.lineHeight:0}">${E(row)}</tspan>`).join('')}</text>`;
    }
    const alt=title||m.title||'Чертёж к условию и текущему шагу рассуждения',cap=caption===undefined?m.caption:caption;
    return `<figure class="lesson-figure" data-figure-kind="${E(kind)}" data-figure-id="${E(id)}" data-figure-step="${step}" style="margin:8px 0;max-width:380px"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(alt)}" style="display:block;width:100%;max-height:230px;height:auto;background:#f3f7f5;border-radius:8px;font:600 20px system-ui;fill:${ink};stroke-linecap:round;stroke-linejoin:round">${d}</svg>${cap?`<figcaption style="font-size:14px;line-height:1.35;margin-top:3px">${E(cap)}</figcaption>`:''}</figure>`;
  }
  function figure(id,step=0,options={}){if(legacy.proofIds.includes(id))return legacy.proof(id,step);return render(model(id,step),{...options,id,step,kind:'proof'});}
  const api={model,render,figure,layoutLabels,proof:figure,supports:id=>ids.includes(id),proofIds:ids.slice(),legacy,practice:legacy.practice,preparePage:legacy.preparePage,helpers:{base,segment,polygon,annotate,tri,regular,add,sub,mul,mid,dist,dot,polar,foot}};
  root.GeoProofDiagrams=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
