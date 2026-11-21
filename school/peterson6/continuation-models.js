/* Original, local models for the selected textbook tasks in parts 2 and 3. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg';
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i), signs=range(-5,5), nonzero=signs.filter(Boolean);
const configs={};
function cfg(n,title,controls,initial){configs['p'+n]={title,controls,initial};}
const c=(label,values)=>({label,values});
cfg(15,'Отношение: сравни одинаковые единицы',[c('Первое число',range(1,12)),c('Второе число',range(1,12))],[6,4]);
cfg(16,'Масштаб связывает карту и местность',[c('Длина на карте, см',range(1,8)),c('Знаменатель масштаба',[100,1000,10000,100000])],[3,10000]);
cfg(17,'Крест-накрест в пропорции',[c('Во сколько раз увеличить оба члена?',range(1,6))],[2]);
cfg(18,'Преобразования сохраняют равенство отношений',[c('Преобразование',[[0,'Исходная'],[1,'Обратные отношения'],[2,'Переставить средние члены'],[3,'Переставить крайние члены']])],[0]);
cfg(19,'Зависимость — правило, а не отдельная пара чисел',[c('Значение x',range(1,6)),c('Правило',[[0,'y = 2x'],[1,'y = 2x + 3']])],[2,0]);
cfg(20,'Одинаковое отношение или одинаковое произведение?',[c('Значение x',range(1,6)),c('Зависимость',[[0,'Прямая: y = 12x'],[1,'Обратная: y = 12 : x']])],[2,0]);
cfg(21,'График и таблица описывают одно правило',[c('Коэффициент k',range(1,6)),c('Правило',[[0,'y = kx'],[1,'y = k : x']])],[2,0]);
cfg(22,'Сначала определяем зависимость',[c('Количество, кг',range(1,8))],[4]);
cfg(23,'Разделить целое в отношении 2 : 3',[c('Величина одной доли',range(1,8))],[6]);
cfg(24,'Отрицательные числа расположены левее нуля',[c('Координата точки',range(-8,8))],[-3]);
cfg(25,'Противоположные числа и расстояние до нуля',[c('Число',range(-8,8))],[-4]);
cfg(26,'Больше то число, которое правее',[c('Число a',signs),c('Число b',signs)],[-4,-1]);
cfg(27,'Прибавление — движение по прямой',[c('Первое слагаемое',signs),c('Второе слагаемое',signs)],[-3,5]);
cfg(28,'Вычесть — прибавить противоположное',[c('Уменьшаемое',signs),c('Вычитаемое',signs)],[-3,-5]);
cfg(29,'Знак произведения и его модуль',[c('Первый множитель',signs),c('Второй множитель',signs)],[-3,-2]);
cfg(30,'Деление проверяется умножением',[c('Делитель',nonzero),c('Частное',signs)],[-3,4]);
cfg(31,'Какому множеству принадлежит число?',[c('Число',[[0,'3'],[1,'−3'],[2,'0'],[3,'Одна вторая'],[4,'√2']])],[0]);
cfg(32,'Значение цифры зависит от разряда и основания',[c('Число в десятичной системе',range(1,32)),c('Основание системы',[2,3,8])],[13,2]);
cfg(33,'Минус перед скобками меняет оба знака',[c('Число b',signs),c('Число c',signs)],[3,-2]);
cfg(34,'Коэффициент — числовой множитель',[c('Первый числовой множитель',nonzero),c('Второй числовой множитель',nonzero)],[-2,3]);
cfg(35,'Складываем количества одинаковых буквенных частей',[c('Первый коэффициент',signs),c('Второй коэффициент',signs)],[3,-5]);
cfg(36,'Корень делает равенство верным',[c('Проверяем значение x',range(-2,8))],[2]);
cfg(37,'Одинаковое действие с обеими частями',[c('Вид уравнения',[[0,'2x + 3 = 11'],[1,'3x − 4 = 11']])],[0]);
cfg(38,'Переведи связь из условия в уравнение',[c('На сколько больше?',range(1,6)),c('Меньшее количество',range(1,8))],[3,5]);
cfg(39,'Сначала горизонталь, затем вертикаль',[c('Координата x',range(-10,10)),c('Координата y',range(-10,10))],[2,3]);
cfg(40,'У каждого участка графика свой смысл',[c('Время t',range(0,6))],[2]);
cfg(41,'Следование проверяется на всех допустимых объектах',[c('Проверяемое число',range(1,20))],[12]);
cfg(42,'Контрпример: условие верно, заключение неверно',[c('Проверяемое число',range(1,20))],[10]);
cfg(43,'Проверь обратное утверждение отдельно',[c('Проверяемое число',range(1,20))],[6]);
cfg(44,'Равносильность требует двух направлений',[c('Проверяемое число',range(1,20))],[8]);
cfg(45,'Свойства предметов: включение классов',[c('Пример',[[0,'Квадрат'],[1,'Прямоугольник, не квадрат'],[2,'Круг']])],[0]);
cfg(46,'Рисунок помогает увидеть определение',[c('Объект',[[0,'Отрезок'],[1,'Луч'],[2,'Прямая']])],[0]);
cfg(47,'Классифицируй по существенным признакам',[c('Фигура',[[0,'Квадрат'],[1,'Прямоугольник, не квадрат'],[2,'Ромб, не квадрат'],[3,'Треугольник']])],[0]);
cfg(48,'Построение серединного перпендикуляра',[c('Показывать',[[0,'Исходный отрезок'],[1,'Равные окружности'],[2,'Прямая через пересечения']])],[0]);
cfg(49,'Замечательные точки треугольника',[c('Положение вершины C',range(1,5)),c('Линии',[[0,'Медианы'],[1,'Высоты'],[2,'Биссектрисы'],[3,'Серединные перпендикуляры']])],[2,0]);
cfg(50,'Объёмная фигура на плоском рисунке',[c('Фигура',[[0,'Куб'],[1,'Прямоугольный параллелепипед'],[2,'Тетраэдр']])],[0]);
cfg(51,'Грани, рёбра, вершины',[c('Многогранник',[[0,'Куб'],[1,'Тетраэдр'],[2,'Треугольная призма']])],[0]);
cfg(52,'Вращение плоской фигуры вокруг оси',[c('Что вращаем?',[[0,'Прямоугольник'],[1,'Прямоугольный треугольник'],[2,'Полукруг']])],[0]);
cfg(53,'Длина, площадь и объём используют разные единицы',[c('Ребро куба, см',range(1,5))],[3]);
cfg(54,'Совмести центр транспортира с вершиной',[c('Градусная мера',range(1,11).map(n=>n*15))],[60]);
cfg(55,'Отражение относительно оси',[c('Координата x',range(1,5)),c('Координата y',signs)],[3,2]);
cfg(56,'Преобразование сохраняет расстояния',[c('Преобразование',[[0,'Перенос'],[1,'Отражение'],[2,'Поворот на 180°']]),c('Сдвиг по горизонтали',range(-2,3))],[0,2]);
cfg(57,'У правильного многоугольника равны стороны и углы',[c('Число сторон',[3,4,5,6,8])],[5]);
cfg(58,'Пять правильных многогранников',[c('Фигура',[[0,'Тетраэдр'],[1,'Куб'],[2,'Октаэдр'],[3,'Додекаэдр'],[4,'Икосаэдр']])],[0]);
const segmentRatios = {
 equal: {sign:'= 1',initial:4,matches:(left,right)=>left===right},
 greater: {sign:'> 1',initial:4,matches:(left,right)=>left>right},
 less: {sign:'< 1',initial:8,matches:(left,right)=>left<right},
 double: {sign:'= 2',initial:6,matches:(left,right)=>left===2*right},
};
const ratioConstructions = {
 segments: 'Два отрезка в отношении 2 : 3',
 rectangle: 'Прямоугольник со сторонами в отношении 5 : 3',
 triangle: 'Катеты и гипотенуза',
 angle: 'Два угла внутри 60°',
};
function constructionConfig(kind) {
 if (kind === 'angle') return {
  title: ratioConstructions.angle,
  controls: [c('Угол от нижней стороны, в градусах', [0,10,20,30,40,50,60])],
  initial: [30],
 };
 return {
  title: ratioConstructions[kind],
  controls: [c('Длина одной доли, в сантиметрах', [1,2,3])],
  initial: [2],
 };
}
function constructionFigure(kind, value) {
 const diagram = svg('svg', {
  viewBox: '0 0 360 250', role: 'img', class: 'pm-chart pcm-segment',
  'aria-label': ratioConstructions[kind] + (kind === 'angle'
   ? '. Луч составляет с нижней стороной ' + value + ' градусов.'
   : '. Длина одной доли — ' + value + ' см.'),
 });
 const main = { stroke:'#086850', 'stroke-width':4 };
 const secondary = { stroke:'#9c510e', 'stroke-width':4 };
 const ink = { 'font-size':21 };
 const left = 47, bottom = 199, unit = 17*value;
 if (kind === 'segments') {
  for (const [count,y,style] of [[2,74,main],[3,166,secondary]]) {
   ln(diagram,left,y,left+count*unit,y,style);
   for (let index=0; index<=count; index++) ln(diagram,left+index*unit,y-6,left+index*unit,y+6,style);
   txt(diagram,left+count*unit/2,y-16,count*value+' см',ink);
  }
 } else if (kind === 'angle') {
  const point = (degrees,distance) => {
   const radians = degrees*Math.PI/180;
   return [left+distance*Math.cos(radians), bottom-distance*Math.sin(radians)];
  };
  for (const degrees of [0,60]) {
   const [x,y] = point(degrees,205);
   ln(diagram,left,bottom,x,y,main);
  }
  const [x,y] = point(value,185);
  ln(diagram,left,bottom,x,y,{...secondary,'stroke-dasharray':'9 4'});
  txt(diagram,68,228,'O',ink);
  txt(diagram,262,208,'A',ink);
  if(value>0 && value<60) txt(diagram,x+11,y-3,'X',ink);
  txt(diagram,151,25,'B',ink);
 } else {
  const width=(kind==='rectangle'?5:4)*unit, height=3*unit;
  if(kind==='rectangle') {
   diagram.append(svg('rect',{x:left,y:bottom-height,width,height,fill:'#e4f1e9',...main}));
  } else {
   diagram.append(svg('polygon',{points:[[left,bottom],[left+width,bottom],[left,bottom-height]].map(pt=>pt.join(',')).join(' '),fill:'#e4f1e9',...main}));
   txt(diagram,left+width*.62+14,bottom-height*.52-8,5*value+' см',ink);
  }
  diagram.append(svg('polyline',{points:[[left,bottom-10],[left+10,bottom-10],[left+10,bottom]].map(pt=>pt.join(',')).join(' '),fill:'none',stroke:'#234436','stroke-width':2}));
  txt(diagram,left+width/2,bottom+25,(kind==='rectangle'?5:4)*value+' см',ink);
  txt(diagram,left-4,bottom-height/2,3*value+' см',{...ink,'text-anchor':'end'});
 }
 return diagram;
}
const triangleMeasurements = [[3,4,5], [5,12,13], [8,15,17]];
function trigConfig(study) {
 const controls = [c('Острый угол', [[0,'Угол A'], [1,'Угол B']])];
 const initial = [0];
 if (study !== 'named') {
  controls.push(c('Прямоугольный треугольник', [[0,'3 и 4 · рисунок'],[1,'5 и 12 · пример'],[2,'8 и 15 · пример']]));
  initial.push(study === 'general' ? 1 : 0);
 }
 controls.push(c('Числитель синуса выбранного угла', [[0,'Сначала выберу сторону'],[1,'AC'],[2,'BC'],[3,'AB']]));
 initial.push(0);
 return {title:'Стороны относительно угла',controls,initial};
}
function trigFigure(measurable, selectedAngle, sample=0, showRoles=false) {
 const [vertical,horizontal] = measurable ? triangleMeasurements[sample] : [4,5];
 const unit = 242 / horizontal;
 const xA=44, xC=286, yC=210, yB=yC-unit*vertical;
 const picture=svg('svg',{
  viewBox:'0 0 352 282', role:'img',class:'pm-chart pcm-ratio-triangle',
  'aria-label': 'Треугольник ABC: A слева внизу, C справа внизу, B прямо над C. Прямой угол C.'+
   (selectedAngle==null?'':' Выбран угол '+(selectedAngle===0?'A.':'B.'))+
   (measurable?' Под треугольником показана одна единица длины.':''),
 });
 const side = (name,x1,y1,x2,y2,role) => {
  const colors={opposite:'#a54f1a',adjacent:'#0a6950',hypotenuse:'#354b71'};
  const attributes={'data-side':name,stroke:showRoles?colors[role]:'#214b3d','stroke-width':3.5};
  if (showRoles) attributes['data-role']=role;
  ln(picture,x1,y1,x2,y2,attributes);
 };
 side('AC',xA,yC,xC,yC,selectedAngle===1?'opposite':'adjacent');
 side('BC',xC,yB,xC,yC,selectedAngle===1?'adjacent':'opposite');
 side('AB',xA,yC,xC,yB,'hypotenuse');
 picture.append(svg('polyline',{points:[[xC-13,yC],[xC-13,yC-13],[xC,yC-13]].map(p=>p.join(',')).join(' '),fill:'none',stroke:'#234436','stroke-width':2}));
 for (const [x,y,name] of [[xA-12,yC+4,'A'],[xC+16,yB+7,'B'],[xC+16,yC+8,'C']]) txt(picture,x,y,name,{'font-size':23});
 if (selectedAngle!=null) {
  const angle=Math.atan2(unit*vertical,xC-xA);
  const radius=31, atA=selectedAngle===0, centerX=atA?xA:xC,centerY=atA?yC:yB;
  const start=atA?-angle:Math.PI/2;
  const end=atA?0:Math.PI-angle;
  const at=r=>[centerX+radius*Math.cos(r),centerY+radius*Math.sin(r)].join(' ');
  picture.append(svg('path',{d:'M '+at(start)+' A '+radius+' '+radius+' 0 0 1 '+at(end),fill:'none',stroke:'#51345d','stroke-width':3,'data-angle':atA?'A':'B'}));
 }
 if (measurable) {
  const y=239;
  ln(picture,xA,y,xA+unit,y,{stroke:'#152d26','stroke-width':2.5,'data-ruler':'1'});
  ln(picture,xA,y-5,xA,y+5);ln(picture,xA+unit,y-5,xA+unit,y+5);
  txt(picture,xA,y+26,'1 деление',{'font-size':19,'text-anchor':'start'});
 }
 return picture;
}
const groupRules = {
 add: 'Два прибавления на прямой',
 subtract: 'Два вычитания на прямой',
 distribute: 'Прямоугольник из двух частей',
};
function drawGroupRule(rule,b,c) {
 const picture=svg('svg',{viewBox:'0 0 360 192',role:'img',class:'pm-chart pcm-group-rule',
  'aria-label':groupRules[rule]+'. b = '+b+', c = '+c+'.'});
 const green='#086850',amber='#9c510e',blue='#354b71';
 if(rule==='distribute') {
  const cell=31, left=(360-(b+c)*cell)/2, y=40, rows=3;
  for(const [start,count,color] of [[0,b,'#d6ebe0'],[b,c,'#f6e0c9']]) {
   picture.append(svg('rect',{x:left+start*cell,y,width:count*cell,height:rows*cell,fill:color,stroke:'#234436','stroke-width':2}));
  }
  for(let k=1;k<b+c;k++) ln(picture,left+k*cell,y,left+k*cell,y+rows*cell,{'stroke-width':k===b?3:1});
  for(let k=1;k<rows;k++) ln(picture,left,y+k*cell,left+(b+c)*cell,y+k*cell,{'stroke-width':1});
  txt(picture,left+b*cell/2,y-11,'b = '+b,{'font-size':18});
  txt(picture,left+(b+c/2)*cell,y-11,'c = '+c,{'font-size':18});
  txt(picture,180,y+rows*cell+34,'3 ряда',{'font-size':21});
  return picture;
 }
 const sign=rule==='add'?1:-1,initial=10,middle=initial+sign*b,end=middle+sign*c;
 const low=Math.min(initial,end)-1, high=Math.max(initial,end)+1;
 const X=v=>25+(v-low)/(high-low)*310;
 const lineY=151;
 ln(picture,12,lineY,348,lineY,{stroke:'#677871','stroke-width':2});
 for(let v=low;v<=high;v++) ln(picture,X(v),lineY-4,X(v),lineY+4,{'stroke-width':1.5});
 for(const v of [initial,middle,end]) txt(picture,X(v),lineY+26,v,{'font-size':20});
 function arrow(from,to,y,color,id) {
  const x=X(from),last=X(to),direction=Math.sign(last-x);
  ln(picture,x,y,last,y,{stroke:color,'stroke-width':3,'data-move':id});
  ln(picture,last,y,last-8*direction,y-5,{stroke:color,'stroke-width':3});
  ln(picture,last,y,last-8*direction,y+5,{stroke:color,'stroke-width':3});
  txt(picture,(x+last)/2,y-9,(sign>0?'+':'−')+Math.abs(to-from),{'font-size':20});
 }
 arrow(initial,end,52,blue,'sum');
 arrow(initial,middle,104,green,'first');
 arrow(middle,end,104,amber,'second');
 return picture;
}
function compareConfig(task) {
 const choices=task.partComparison.labels.map((label,i)=>[i,label]);
 return {
  title:'Что берём за основание отношения?',
  controls:[c('Набор чисел',[[0,'Из задачи'],[1,'Другой пример']]),c('Первая величина',choices),c('Вторая величина — основание',choices)],
  initial:[0,0,2],
 };
}
function compareBars(left,right,first,second) {
 const total=left+right;
 const picture=svg('svg',{viewBox:'0 0 350 193',role:'img',class:'pm-chart pcm-group-rule',
  'aria-label':'Две части: '+left+' и '+right+'. Сравниваются '+first+' и '+second+' в одном масштабе.'});
 const x=16,width=308;
 picture.append(svg('rect',{x,y:13,width:width*left/total,height:17,fill:'#99c8af',stroke:'#315649','data-portion':'left'}));
 picture.append(svg('rect',{x:x+width*left/total,y:13,width:width*right/total,height:17,fill:'#ebc9a1',stroke:'#775530','data-portion':'right'}));
 for(const [id,title,amount,y,color] of [['first','Первая',first,77,'#197354'],['base','Основание',second,150,'#97531b']]) {
  txt(picture,x,y-10,title+': '+amount,{'font-size':21,'text-anchor':'start'});
  picture.append(svg('rect',{x,y,width,height:13,fill:'#e2ebe5'}));
  picture.append(svg('rect',{x,y,width:width*amount/total,height:13,fill:color,'data-measure':id}));
 }
 return picture;
}
// Nine point features from Natural Earth, ne_10m_populated_places_simple v5.1.2 (WGS84).
// Source: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/
// Spherical azimuthal equidistant coordinates are centered on Moscow, so each selected radius has the same scale.
const moscow=[55.75411,37.61358];
const mapCities=[
 ['Санкт-Петербург',59.94096,30.31407],['Казань',55.75189,49.12440],['Ижевск',56.85003,53.23002],
 ['Киев',50.43531,30.51468],['Прага',50.08697,14.42294],['Берлин',52.52376,13.39960],
 ['Париж',48.85809,2.35299],['Лондон',51.50194,-.11867],
];
function fromMoscow(city){
 const rad=Math.PI/180,lat0=moscow[0]*rad,lat=city[1]*rad,delta=(city[2]-moscow[1])*rad;
 const dot=Math.sin(lat0)*Math.sin(lat)+Math.cos(lat0)*Math.cos(lat)*Math.cos(delta);
 const distance=6371*Math.acos(Math.max(-1,Math.min(1,dot)));
 const bearing=Math.atan2(Math.sin(delta)*Math.cos(lat),Math.cos(lat0)*Math.sin(lat)-Math.sin(lat0)*Math.cos(lat)*Math.cos(delta));
 return {distance,x:distance*Math.sin(bearing),y:distance*Math.cos(bearing)};
}
function cityScaleFigure(index){
 const place=mapCities[index],origin=[170,61],scale=.061;
 const picture=svg('svg',{viewBox:'0 0 248 152',role:'img',class:'pm-chart pcm-group-rule pcm-city-scale',
  'aria-label':'Направление и расстояние по прямой от Москвы до города '+place[0]+'. Линейка 500 км.'});
 const cityPoint=c=>{const v=fromMoscow(c);return [origin[0]+scale*v.x,origin[1]-scale*v.y];};
 const [x,y]=cityPoint(place);
 ln(picture,...origin,x,y,{stroke:'#277654','stroke-width':2,'data-measure':'radius'});
 for(const [i,city]of mapCities.entries()){
  const [x,y]=cityPoint(city);
  picture.append(svg('circle',{cx:x,cy:y,r:i===index?3.8:2.4,fill:i===index?'#a55124':'#73867a','data-city':i}));
 }
 picture.append(svg('circle',{cx:origin[0],cy:origin[1],r:3.8,fill:'#264d3d'}));
 txt(picture,origin[0],origin[1]+16,'Москва',{'font-size':13,'font-weight':'bold'});
 // Keep labels inside the narrow viewport even for the eastern and western endpoints.
 const anchor=x<80?'start':x>183?'end':'middle';
 txt(picture,x,y-9,place[0],{'font-size':13,'text-anchor':anchor,'font-weight':'bold'});
 const left=11,right=left+500*scale;
 ln(picture,left,128,right,128,{stroke:'#253e2f','stroke-width':2,'data-measure':'500km'});
 for(const v of [left,right])ln(picture,v,124,v,131,{'stroke-width':1.5});
 txt(picture,left,145,'0',{'font-size':12});txt(picture,right+3,145,'500 км',{'font-size':12,'text-anchor':'start'});
 txt(picture,238,129,'Север ↑',{'font-size':12,'text-anchor':'end'});return picture;
}
const roomAreaFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 });
function roomArea(widthMetres,heightMetres) {
 return roomAreaFormat.format(Math.round(widthMetres*100)*Math.round(heightMetres*100)/10000);
}
const flats=[
 {name:'Гостиная',tag:'Г',box:[0,0,3.5,2.5]},{name:'Спальня',tag:'С',box:[0,2.5,2.25,4.05]},
 {name:'Кухня',tag:'К',box:[3.5,.55,5.75,2.5]},{name:'Прихожая',tag:'П',box:[2.25,2.5,4.6,4.05]},
 {name:'Кладовая',tag:'Кл',box:[3.5,0,5.75,.55]},{name:'Ванная',tag:'В',box:[4.6,2.5,5.75,4.05]},
];
function apartmentPicture(selected=-1){
 const picture=svg('svg',{viewBox:'0 0 248 194',role:'img',class:'pm-chart pcm-group-rule pcm-flat-scale',
  'aria-label':'Авторский план шести помещений. Горизонтальные границы 0, 2,25, 3,5, 4,6 и 5,75 см; вертикальные границы 0, 0,55, 2,5 и 4,05 см.'});
 const left=22,top=22,s=34;
 for(const [i,room]of flats.entries()){
  const [x1,y1,x2,y2]=room.box;
  picture.append(svg('rect',{x:left+s*x1,y:top+s*y1,width:s*(x2-x1),height:s*(y2-y1),fill:i===selected?'#f1cda8':'#dfebe2',stroke:'#355b48','stroke-width':1.1,'data-room':i}));
  txt(picture,left+s*(x1+x2)/2,top+s*(y1+y2)/2+4,room.tag,{'font-size':13,'font-weight':'bold'});
 }
 for(const [i,value]of [0,2.25,3.5,4.6,5.75].entries()){
  const x=left+s*value;ln(picture,x,163,x,168,{stroke:'#55735e','stroke-width':1});
  txt(picture,x,184,num(value),{'font-size':12});
 }
 for(const value of [0,.55,2.5,4.05]){
  const y=top+s*value;ln(picture,218,y,222,y,{stroke:'#55735e','stroke-width':1});
  txt(picture,225,y+4,num(value),{'text-anchor':'start','font-size':10});
 }
 return picture;
}
function parcelPicture(fresh=false,mode=0){
 const [width,height,cutWidth,cutHeight]=fresh?[6,3,1.5,1]:[5,2.4,2,1];
 const left=15,top=24,s=34;
 const outline=[[0,0],[width-cutWidth,0],[width-cutWidth,cutHeight],[width,cutHeight],[width,height],[0,height]];
 const picture=svg('svg',{viewBox:'0 0 248 157',role:'img',class:'pm-chart pcm-group-rule pcm-parcel-scale',
  'aria-label':'План участка с вырезом. Внешние размеры '+num(width)+' × '+num(height)+' см; вырез '+num(cutWidth)+' × '+num(cutHeight)+' см.'});
 if(mode===1)picture.append(svg('rect',{x:left,y:top,width:s*width,height:s*height,fill:'#f4d9b8',stroke:'#a16c41','stroke-dasharray':'4 3'}));
 picture.append(svg('polygon',{points:outline.map(([x,y])=>(left+s*x)+','+(top+s*y)).join(' '),fill:'#d9e8dc',stroke:mode===2?'#aa5426':'#386148','stroke-width':mode===2?3:1.5}));
 txt(picture,left+s*width/2,top+s*height+20,num(width)+' см',{'font-size':14});
 txt(picture,left+s*width+5,top+s*height-4,num(height)+' см',{'font-size':12,'text-anchor':'start'});
 txt(picture,left+s*(width-cutWidth/2),top-8,num(cutWidth)+' см',{'font-size':13});
 txt(picture,left+s*(width-cutWidth/2),top+s*cutHeight-5,num(cutHeight)+' см',{'font-size':12});
 return picture;
}
function evaluateLinear(groups,inputs) {
 return groups.reduce((sum,g)=>sum+g.scale*(g.constant+Object.entries(g.terms).reduce((n,[v,k])=>n+k*inputs[v],0)),0);
}
function squarePartition(a,b){
 const positive=a*b>=0,u=Math.max(Math.abs(a),Math.abs(b)),v=Math.min(Math.abs(a),Math.abs(b));
 const total=positive?u+v:u,left=19,top=15,side=134,scale=side/total;
 const pic=svg('svg',{viewBox:'0 0 210 170',class:'pm-chart pcm-group-rule',role:'img',
  'aria-label':positive?'Квадрат разделён на два квадрата и два равных прямоугольника.':'В большом квадрате удаляют горизонтальную и вертикальную полосы; маленький квадрат был посчитан дважды.'});
 const box=(x,y,w,h,color,label)=>{
  if(w===0||h===0)return;
  pic.append(svg('rect',{x:left+scale*x,y:top+scale*y,width:scale*w,height:scale*h,fill:color,stroke:'#42664f','stroke-width':1.2,'data-piece':label}));
 };
 if(positive){
  box(0,0,u,u,'#c6dfd0','u²');box(u,0,v,u,'#edd5ad','uv');box(0,u,u,v,'#edd5ad','uv');box(u,u,v,v,'#bdd5e4','v²');
  txt(pic,87,163,'|a| + |b| = '+num(total),{'font-size':13});
 }else{
  const difference=u-v;
  box(0,0,difference,difference,'#c6dfd0','difference²');
  box(difference,0,v,difference,'#edd5ad','cut');box(0,difference,difference,v,'#edd5ad','cut');box(difference,difference,v,v,'#bdd5e4','overlap');
  txt(pic,87,163,'||a| − |b|| = '+num(difference),{'font-size':13});
 }
 return pic;
}
const trickInputs={
 constant:[[0,'0'],[1,'3'],[2,'−2'],[3,'1/2']],
 reverse:[[0,'12'],[1,'10'],[2,'7']],
 'reverse-own':[[0,'20'],[1,'18'],[2,'16']],
 'make-own':[[0,'8'],[1,'14'],[2,'−2']],
 'square-root':[[0,'6'],[1,'2'],[2,'1,5']],
};
function numberTrail(kind,index){
 const values={constant:[0,3,-2,.5],reverse:[12,10,7],'reverse-own':[20,18,16],'make-own':[8,14,-2],'square-root':[6,2,1.5]};
 const x=values[kind][index];
 if(kind==='constant')return [['Задумано',x],['Прибавили 7',x+7],['Утроили',3*(x+7)],['Прибавили 4',3*(x+7)+4],['Вычли 3x',25]];
 if(kind==='reverse')return [['Задумано',x],['Умножили на 8',8*x],['Вычли из 100',100-8*x],['Удвоили',2*(100-8*x)],['Вычли из 15',15-2*(100-8*x)]];
 if(kind==='reverse-own')return [['Задумано',x],['Вычли 16',x-16],['Умножили на 7',7*(x-16)],['Вычли из 40',40-7*(x-16)]];
 if(kind==='make-own')return [['Задумано',x],['Вычли 3',x-3],['Удвоили',2*(x-3)]];
 return [['Задумано',x],['Квадрат',x*x],['Прибавили 2x',x*x+2*x],['Прибавили 1',(x+1)**2],['Корень и минус 1',Math.sqrt((x+1)**2)-1]];
}
const exponentGlyphs=['','', '²','³','⁴','⁵','⁶','⁷','⁸','⁹'];
function signedTerm(power,base) {return base+(power>1?exponentGlyphs[power]||'^'+power:'');}
function coefficientParts(task,variant) {
 const math=root.PetersonMath;
 const factors=task.coefficientStudy.factors.map((factor,index)=>{
  if(index!==0||variant===0)return factor;
  if(task.source.exercise===29)return {...factor,power:factor.power+1};
  return {...factor,coefficient:math.answer(math.operation('multiply',factor.coefficient,2))};
 });
 let coefficient=math.parse(1),negatives=0;
 const degrees={},written=[],numericFactors=[];
 for(const item of factors){
  const value=math.parse(item.coefficient);
  for(let i=0;i<item.power;i++){
   coefficient=math.operation('multiply',coefficient,value);
   numericFactors.push(math.answer(value).replace('-','−'));
  }
  if(value.n<0)negatives+=item.power;
  for(const [letter,degree]of Object.entries(item.variables))degrees[letter]=(degrees[letter]||0)+degree*item.power;
  const names=Object.entries(item.variables).map(([v,p])=>signedTerm(p,v)).join('');
  const raw=math.answer(value),visible=raw.replace('-','−');
  const formatted=names?(raw==='1'?'':raw==='-1'?'−':raw.includes('/')?'('+visible+')':visible)+names:visible;
  written.push(item.power>1?signedTerm(item.power,'('+formatted+')'):value.n<0?'('+formatted+')':formatted);
 }
 const literal=Object.entries(degrees).sort(([a],[b])=>a.localeCompare(b)).map(([v,d])=>signedTerm(d,v)).join('');
 return {coefficient:math.answer(coefficient).replace('-','−'),literal,negatives,degrees,numericFactors,written:written.join(' · ')};
}
function numericFactorDiagram(factors) {
 const row=el('div','pcm-factor-strip');
 row.setAttribute('role','img');row.setAttribute('aria-label','Числовые множители: '+factors.join(' умножить на '));
 for(const [i,factor]of factors.entries()){
  if(i)row.append(el('span','pcm-factor-times','×'));
  const value=el('span','pcm-factor-chip',factor);
  value.dataset.sign=factor.startsWith('−')?'negative':'positive';row.append(value);
 }
 return row;
}
function exponentDiagram(variables){
 const wrap=el('div','pcm-exponents');
 for(const [letter,degree]of Object.entries(variables)){
  const row=el('p','pcm-exponent-row'),label=el('strong','',signedTerm(degree,letter)+' = ');
  row.append(label,document.createTextNode(Array(degree).fill(letter).join(' · ')));wrap.append(row);
 }
 return wrap;
}
function mapStrip(drawn,kmPerCm){
 const fig=svg('svg',{viewBox:'0 0 246 104',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Два города, отрезок '+num(drawn)+' сантиметра по шкале этой схемы.'});
 const x=21,y=42,unit=21,end=x+drawn*unit;
 ln(fig,x,y,end,y,{stroke:'#39634c','stroke-width':3,'data-drawn':drawn});
 for(const [cx,k]of [[x,'A'],[end,'Б']]){fig.append(svg('circle',{cx,cy:y,r:4,fill:'#9e5433'}));txt(fig,cx,30,k,{'font-size':15});}
 ln(fig,x,72,x+unit,72,{stroke:'#567168','stroke-width':2});ln(fig,x,67,x,77);ln(fig,x+unit,67,x+unit,77);
 txt(fig,x+unit+8,77,'1 см шкалы = '+num(kmPerCm)+' км',{'text-anchor':'start','font-size':13});return fig;
}
function roomFurniture(w,h,denominator){
 const fig=svg('svg',{viewBox:'0 0 231 156',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Пример комнаты '+num(w)+' на '+num(h)+' м, с дверью, окном и столом.'});
 const unit=21*50/denominator,x=19,y=16;
 fig.append(svg('rect',{x,y,width:w*unit,height:h*unit,fill:'#e6efe4',stroke:'#3d6351','stroke-width':2}));
 ln(fig,x+.5*unit,y+h*unit,x+1.4*unit,y+h*unit,{stroke:'#bc763a','stroke-width':4});
 ln(fig,x+2*unit,y,x+3.5*unit,y,{stroke:'#4691b6','stroke-width':4});
 fig.append(svg('rect',{x:x+(w-1.5)*unit,y:y+unit*.5,width:unit*1.2,height:unit*.6,fill:'#d9aa78',stroke:'#825b3d','data-furniture':'письменный стол'}));
 ln(fig,x,115,x+10.5,115,{stroke:'#416f58','stroke-width':2,'data-paper-cm':1});
 txt(fig,x+16,119,'1 см на схеме листа',{'font-size':12,'text-anchor':'start'});
 txt(fig,19,145,'Окно — синее, дверь — оранжевая.',{'font-size':12,'text-anchor':'start'});
 txt(fig,226,21,'1 : '+denominator,{'font-size':13,'text-anchor':'end'});return fig;
}
function ladderSlope(rows){
 const fig=svg('svg',{viewBox:'0 0 242 149',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Две лестницы с одной шкалой для вертикали и горизонтали.'});
 rows.forEach(([height,run],i)=>{
  const x=12+i*116,y=112,s=38,tip=x+run*s;
  ln(fig,x,y,tip,y,{stroke:'#627360'});ln(fig,tip,y,tip,y-height*s,{stroke:'#627360'});
  ln(fig,x,y,tip,y-height*s,{stroke:'#a15f3a','stroke-width':3,'data-ladder':i+1});
  txt(fig,x+43,135,'Лестница '+(i+1),{'font-size':13});
 });return fig;
}
function fullHundredGrid(){
 const fig=svg('svg',{viewBox:'0 0 225 225',role:'img',class:'pm-chart pcm-group-rule pcm-hundred-table','aria-label':'Таблица по десять чисел в строке. Первая строка от 1 до 10, последняя от 91 до 100.'});
 for(let i=0;i<100;i++){
  const x=3+(i%10)*22,y=3+Math.floor(i/10)*22;
  fig.append(svg('rect',{x,y,width:22,height:22,fill:Math.floor(i/10)%2?'#ecf3e9':'#fff',stroke:'#839382','stroke-width':.65}));
  txt(fig,x+11,y+15,String(i+1),{'font-size':11,'data-hundred-number':i+1});
 }
 return fig;
}
function gridSelection(size,row,column,selection){
 const corner=Number(row)*10+Number(column)+1;
 const groups=size===2?[[0,3],[1,2]]:[[0,4,8],[0,5,7],[1,3,8],[1,5,6],[2,3,7],[2,4,6],[3,4,5],[1,4,7]];
 const fig=svg('svg',{viewBox:'0 0 240 143',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Положение выбранного квадрата в сотне и крупные значения его клеток.'});
 const dx=5.5,x=10,y=24;
 fig.append(svg('rect',{x,y,width:10*dx,height:10*dx,fill:'#f4f6ef',stroke:'#63735d'}));
 for(let i=1;i<10;i++){ln(fig,x+i*dx,y,x+i*dx,y+10*dx,{stroke:'#c0c9bd','stroke-width':.45});ln(fig,x,y+i*dx,x+10*dx,y+i*dx,{stroke:'#c0c9bd','stroke-width':.45});}
 fig.append(svg('rect',{x:x+column*dx,y:y+row*dx,width:size*dx,height:size*dx,fill:'#a4c8ad','fill-opacity':.65,stroke:'#2d604a'}));
 txt(fig,x+5*dx,99,'Таблица 1–100',{'font-size':10});
 const px=90,py=13,cell=36;
 for(let r=0;r<size;r++)for(let c=0;c<size;c++){
  const numCell=corner+10*r+c,chosen=groups[selection].includes(size*r+c);
  fig.append(svg('rect',{x:px+c*cell,y:py+r*cell,width:cell,height:cell,fill:chosen?'#e4c49c':'#f1f5ef',stroke:'#657765','data-cell-number':numCell,'data-in-group':String(chosen)}));
  txt(fig,px+(c+.5)*cell,py+(r+.5)*cell+5,String(numCell),{'font-size':16,'font-weight':chosen?700:400});
 }
 return {figure:fig,values:groups[selection].map(i=>corner+10*Math.floor(i/size)+i%size)};
}
function likeTermOptions(item){
 return item.groups.map(([symbol],i)=>[i,symbol==='1'?'Числа без букв':symbol]);
}
function likeTermValues(item,selected,fresh){
 const M=root.PetersonMath,groups=item.groups.map(([symbol,coefficients],i)=>{
  const values=coefficients.map(v=>M.parse(v));
  if(fresh && !item.substitutions && i===selected)values[0]=M.operation('add',values[0],1);
  const total=values.reduce((s,v)=>M.operation('add',s,v),M.parse(0));
  return {symbol,values,total};
 });
 const symbols=Array.from(new Set(groups.flatMap(g=>g.symbol.match(/[a-z]/g)||[]))).sort();
 const numbers=item.substitutions?item.substitutions[fresh?1:0]:Object.fromEntries(symbols.map((symbol,i)=>[symbol,i%2===0?2:-3]));
 function evaluate(symbol){
  let product=M.parse(1);
  for(const [_,letter,exponent]of symbol.matchAll(/([a-z])([²³]?)/g)){
   const count=exponent==='³'?3:exponent==='²'?2:1;
   for(let i=0;i<count;i++)product=M.operation('multiply',product,numbers[letter]);
  }
  return product;
 }
 const result=groups.reduce((s,g)=>M.operation('add',s,M.operation('multiply',g.total,evaluate(g.symbol))),M.parse(0));
 return {groups,numbers,result};
}
function readQuartet(terms,change){
 const M=root.PetersonMath,values=terms.map(v=>M.parse(v));
 const same=M.equal(M.operation('multiply',values[0],values[3]),M.operation('multiply',values[1],values[2]));
 if(change)values[2]=same?M.operation('add',values[2],1):M.operation('divide',M.operation('multiply',values[0],values[3]),values[1]);
 return values;
}
function compareQuartet(values){
 const M=root.PetersonMath;
 const lhs=M.operation('divide',values[0],values[1]),rhs=M.operation('divide',values[2],values[3]);
 const outer=M.operation('multiply',values[0],values[3]),inner=M.operation('multiply',values[1],values[2]);
 return {lhs,rhs,outer,inner,same:M.equal(lhs,rhs)};
}
function ratioCandidates(task){
 const M=root.PetersonMath,values=new Set(['0']);
 for(const answer of task.missingRatio.answers){
  for(const shift of [-1,1,0])values.add(M.answer(M.operation('add',answer,shift)));
 }
 return [...values].sort((a,b)=>{const x=M.parse(a),y=M.parse(b);return x.n/x.d-y.n/y.d;});
}
const cycleKeys={'+':'add','−':'subtract','×':'multiply','÷':'divide'};
const freshUnitRows={
 's = vt':[['км','км/с','с'],['м','м/мин','мин'],['дм','дм/ч','ч'],['мм','мм/с','с']],
 'A = wt':[['л','л/ч','ч'],['м²','м²/день','день'],['дет.','дет./мин','мин'],['м³','м³/с','с']],
 'C = an':[['р.','р./л','л'],['р.','р./т','т'],['р.','р./км','км'],['р.','р./книгу','книг']]
};
function missingUnitsTable(item,row=-1,shown=false,fresh=false){
 const source=fresh?freshUnitRows[item.formula]:item.rows;
 const body=source.map((values,i)=>values.map((v,j)=>j===item.missing[i]&&!(i===row&&shown)?'?' : v));
 return table(item.headers,body);
}
function approachCase(t,fresh){
 const m=root.PetersonMath,op=m.operation,near=t.approach,first=+t.a,second=m.parse(t.b),orig=m.parse(t.given),g=op('multiply',orig,fresh?(t.unknown==='first'?'3/2':2):1);
 if(t.unknown==='first'){
  const relative=op('divide',g,second),v1=op(near?'subtract':'add',relative,first);
  return {v1:m.answer(v1),v2:String(first),time:m.answer(second),space:m.answer(g),relative:m.answer(relative),answer:m.answer(v1)};
 }
 const relative=op(near?'add':'subtract',first,second),time=t.unknown==='time'?op('divide',g,relative):g;
 const space=t.unknown==='time'?g:op('multiply',relative,time);
 return {v1:String(first),v2:m.answer(second),time:m.answer(time),space:m.answer(space),relative:m.answer(relative),answer:m.answer(t.unknown==='time'?time:space)};
}
const planeProfiles=[
 [[540,0],[600,800],[660,800],[780,2400],[860,2400],[900,1600],[960,1600],[1080,0]],
 [[640,0],[800,1600],[860,1600],[940,800],[1040,800],[1120,0]],
];
const hobbyNames=['Музыка и танцы','Спорт','Компьютерные игры','Фильмы','Слушать музыку','Чтение','Театр','Путешествия'];
const hobbyFigures=[8,19,24,19,16,4,2,22],toyNames=['Френдс','Город','Майнкрафт','Звёздные войны','Техник','Бионикл','Ниндзяго'],toyFigures=[9,6,5,3,3,3,1];
function clockText(minutes){return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
function flightProfile(which,fresh){return planeProfiles[which].map(([t,h])=>[t+(which&&fresh?20:0),h]);}
function flightPosition(points,minute){
 const m=root.PetersonMath;
 if(minute<points[0][0]||minute>points.at(-1)[0])return {range:'0',state:'во Внукове вне показанного рейса'};
 for(const [i,[t,h]]of points.entries()){
  if(t===minute){
   if(i===0)return {range:String(h),state:'вылет из Внукова'};
   if(i===points.length-1)return {range:String(h),state:'возвращение во Внуково'};
   if(points[i-1][1]===h)return {range:String(h),state:'окончание стоянки, взлёт'};
   if(points[i+1][1]===h)return {range:String(h),state:'посадка, начало стоянки'};
  }
  if(i&&points[i-1][0]<minute&&minute<t){
   const [ta,ha]=points[i-1];return {range:m.answer(m.operation('add',ha,m.operation('multiply',h-ha,m.operation('divide',minute-ta,t-ta)))),state:ha===h?'на земле, стоянка':'в воздухе'};
  }
 }
 throw new Error('Неподдерживаемое время рейса');
}
function sourceChart(kind,series,xMark=null){
 const chartOptions={
  station:[540,1080,36,[540,600,660,720,780,840,900,960,1020,1080],[0,4,8,12,16,20,24,28,32,36],'км','часы','Поездка к станции: пешеход сплошной, велосипедист пунктиром.'],
  flights:[540,1140,2400,[540,660,780,900,1020,1140],[0,800,1600,2400],'км','часы','Расстояние от Внукова: A сплошная линия, Б пунктир'],
  fuel:[0,100,10,[0,20,40,60,80,100],[0,2,4,6,8,10],'л','км','Расход бензина в литрах по километрам пути'],
  section:[0,120,1.6,[0,20,40,60,80,100,120],[0,.4,.8,1.2,1.6],'м/с','м²','Скорость по площади сечения реки'],
  apples:[0,4,400,[0,1,2,3,4],[0,80,160,240,320,400],'р.','кг','Стоимость купленных яблок по массе'],
  fixedTrip:[0,18,24,[0,3,6,9,12,15,18],[0,6,12,18,24],'км/ч','ч','Скорость по времени на одном пути'],
 };
 const [xmin,xmax,ymax,xTicks,yTicks,yUnit,xUnit,description]=chartOptions[kind],isFlight=kind==='flights'||kind==='station';
 const s=svg('svg',{viewBox:'0 0 292 185',class:'pm-chart pcm-route-fractions',role:'img','aria-label':description});
 const X=x=>38+238*(x-xmin)/(xmax-xmin),Y=y=>150-120*y/ymax;
 if(kind==='station')for(let tm=570;tm<1080;tm+=60)ln(s,X(tm),28,X(tm),150,{stroke:'#e4ebe6','stroke-width':1});
 for(const x of xTicks){ln(s,X(x),28,X(x),150,{stroke:'#d0dfd8'});txt(s,X(x),167,isFlight?String(x/60):String(x),{'font-size':12});}
 for(const y of yTicks){ln(s,X(xmin),Y(y),X(xmax),Y(y),{stroke:'#d0dfd8'});txt(s,32,Y(y)+4,num(y),{'text-anchor':'end','font-size':11.5});}
 ln(s,38,28,38,150);ln(s,38,150,278,150);txt(s,42,16,yUnit,{'font-size':13});txt(s,271,181,xUnit,{'font-size':12,'text-anchor':'end'});
 series.forEach((data,i)=>s.append(svg('polyline',{points:data.map(([x,y])=>X(x)+','+Y(y)).join(' '),fill:'none',stroke:i?'#a44c0d':'#226653','stroke-width':2.5,'stroke-dasharray':i?'6 3':'none','data-source-series':i})));
 if(xMark!==null)ln(s,X(xMark),25,X(xMark),150,{stroke:'#724a93','stroke-width':2,'stroke-dasharray':'3 3'});return s;
}
function baseHeightTriangle(base,height){
 const s=svg('svg',{viewBox:'0 0 258 160',role:'img',class:'pm-chart pcm-route-fractions','aria-label':'Треугольник ABC. Высота BD под прямым углом к основанию AC.'});
 const u=Math.min(205/base,105/height),ax=21,by=126-height*u,dx=ax+.55*base*u,cx=ax+base*u;
 s.append(svg('polygon',{points:ax+',126 '+dx+','+by+' '+cx+',126',fill:'#e4f1e5',stroke:'#2e6250','stroke-width':2}));
 ln(s,dx,126,dx,by,{stroke:'#924f11','stroke-dasharray':'4 3','stroke-width':2});
 s.append(svg('path',{d:'M'+dx+' 118h8v8',fill:'none',stroke:'#924f11','stroke-width':1.8,'data-right-angle':'D'}));
 for(const [x,y,t]of [[ax,143,'A'],[dx,by-8,'B'],[cx,143,'C'],[dx,143,'D']])txt(s,x,y,t,{'font-size':13});
 return s;
}
function passageGeometry(tag,size){
 if(tag===6){
  const h=4;
  return {diagram:baseHeightTriangle(size,h),labels:[['Основание',size+' см'],['Высота',h+' см'],['Обратные формулы','a = 2S/h, h = 2S/a']],formula:'S = ah/2',result:size*h/2+' см²'};
 }
 if(tag===9)return {diagram:solidFigure('cuboid'),labels:[['Площадь основания',size+' см²'],['Высота','3 см']],formula:'V = Sh',result:size*3+' см³'};
 const points=[{name:'A',x:0,y:0},{name:'B',x:size,y:0},{name:'C',x:size,y:size},{name:'D',x:0,y:size}];
 return {diagram:geometryFigure({points,segments:[['A','B'],['B','C'],['C','D'],['D','A']],caption:'Квадрат с четырьмя равными сторонами'}),labels:[['Сторона',size+' см']],formula:tag===7?'P = 4a':'S = a²',result:(tag===7?4*size:size*size)+(tag===7?' см':' см²')};
}
function printedStoryDetails(tag,variant,elapsed){
 const m=root.PetersonMath,r=v=>m.answer(v),op=m.operation;
 if(tag==='trains'){
  const delay=variant?1.5:2.5,initial=72*delay,gap=initial-18*elapsed;
  return {description:'Первый движется 72 км/ч. Второй начинает на '+num(delay)+' ч позже, скорость первого — 80% второго.',rows:[['Скорость второго',90],['Начальное отставание',initial],['Время после отправления второго',elapsed],['Положение первого',72*(elapsed+delay)],['Положение второго',90*elapsed]],answer:'Второй догонит первого через '+num(initial/18)+' ч после своего отправления. Сейчас расстояние '+num(Math.abs(gap))+' км. '+(gap>0?'Первый впереди.':gap<0?'Второй впереди.':'Поезда поравнялись.')};
 }
 if(tag==='rider'){
  const wait=variant?3:2,walk=op('multiply','28/5','3/2'),ride=16*(wait+1.5),total=op('add',op('add',walk,ride),'54/5');
  return {description:'Пешеход стартует спустя '+wait+' ч. После этого оба едут или идут 1,5 ч и между ними 10,8 км.',rows:[['Путь велосипедиста, км',ride],['Путь пешехода, км',r(walk)],['Осталось между ними, км','54/5']],answer:'Между посёлками '+r(total)+' км.'};
 }
 if(tag==='fuelAverage'){
  const roadRate=variant?15:18,farmFuel=op('divide',roadRate,2),ten=op('divide',op('add',30,farmFuel),30);
  return {description:'Шоссе 250 км, просёлок 50 км. На шоссе расход 12 л на 100 км; на просёлке '+roadRate+' л.',rows:[['Шоссе, л',30],['Просёлок, л',r(farmFuel)],['Общий путь, км',300]],answer:'На каждые 10 км в среднем '+r(ten)+' л.'};
 }
 if(tag==='meanThree'){
  const diff=variant?'9/10':'7/2',x=op('divide',op('subtract','141/5',diff),'13/5'),first=op('add',x,diff),last=op('multiply','3/5',x);
  return {description:'У трёх чисел среднее 9,4. Первое превосходит второе на '+r(diff)+', третье — 60% второго.',rows:[['Первое',r(first)],['Второе',r(x)],['Третье',r(last)]],answer:'Меньшее число '+r(last)+'.'};
 }
 if(tag==='meanFour'){
  const diff=variant?'31/10':'8/5',x=op('divide',op('add','112/5',diff),'15/2'),second=op('multiply','5/2',x),third=op('multiply',3,x);
  return {description:'Среднее четырёх чисел 5,6. Из первого вычитают '+r(diff)+', чтобы получить четвёртое.',rows:[['Первое',r(x)],['Второе',r(second)],['Третье',r(third)],['Четвёртое',r(op('subtract',x,diff))]],answer:'Среднее первого и третьего '+r(op('divide',op('add',x,third),2))+'.'};
 }
 const rear=variant?'1/2':'4/5',time=op('subtract',2,rear),first=op('divide',210,op('add',2,op('multiply','5/4',time))),second=op('multiply','5/4',first);
 return {description:'Первый ехал 2 ч. Поздний выезд второго — на '+r(rear)+' ч. Оба прибыли одновременно.',rows:[['Скорость первого, км/ч',r(first)],['Скорость второго, км/ч',r(second)],['Путь первого, км',r(op('multiply',first,2))],['Путь второго, км',r(op('multiply',second,time))]],answer:'Вместе пути дают 210 км. Скорости '+r(first)+' и '+r(second)+' км/ч.'};
}
function sourceHobbyFigure(values,selected=-1){
 const s=svg('svg',{viewBox:'0 0 272 146',class:'pm-chart pcm-route-fractions',role:'img','aria-label':'Высота столбца — число ответов, категории подписаны буквами от а до з'});
 const Y=n=>116-4*n;
 for(const n of [0,8,16,24]){ln(s,28,Y(n),260,Y(n),{stroke:'#c8d9d2'});txt(s,24,Y(n)+4,n,{'font-size':12,'text-anchor':'end'});}
 values.forEach((v,i)=>{const x=34+28*i;s.append(svg('rect',{x,y:Y(v),width:17,height:116-Y(v),fill:i===selected?'#b26725':'#659f89',stroke:'#315742'}));txt(s,x+8,134,'абвгдежз'[i],{'font-size':14});});return s;
}
function toyLineDiagram(nums){
 const total=nums.reduce((a,b)=>a+b,0),s=svg('svg',{viewBox:'0 0 285 167',class:'pm-chart pcm-route-fractions',role:'img','aria-label':'Длина каждой горизонтальной линии показывает процент голосов за серию.'});
 nums.forEach((n,i)=>{const y=15+i*22,percent=Math.round(100*n/total),end=94+percent*4.35;txt(s,90,y+4,toyNames[i],{'font-size':10.5,'text-anchor':'end'});ln(s,96,y,end,y,{stroke:'#30775c','stroke-width':7});txt(s,end+5,y+4,percent+'%',{'font-size':12,'text-anchor':'start'});});return s;
}
function unitSample(group,index,alternate){
 const m=root.PetersonMath,op=m.operation,r=x=>m.answer(x),units={'км/ч':'5/18','м/мин':'1/60','м/с':'1'},[v,from]=group.rows[index],to=group.dest;
 const factor=op('divide',units[from],units[to]),given=op('multiply',v,alternate?2:1),answer=op('multiply',given,factor);
 return {from,to,given:r(given),factor:r(factor),answer:r(answer),metresSecond:r(op('multiply',given,units[from]))};
}
function movingWalkers(mode,fresh,t){
 const gap=fresh?60:50,v1=fresh?'9/5':'3/2',v2=fresh?'6/5':1,dir1=[1,-1,1,1][mode],dir2=[-1,1,1,1][mode],m=root.PetersonMath,op=m.operation,r=x=>m.answer(x);
 const fasterAhead=mode===3,current1=fasterAhead?v2:v1,current2=fasterAhead?v1:v2;
 const rate=op('subtract',op('multiply',dir2,current2),op('multiply',dir1,current1)),distance=op('add',gap,op('multiply',rate,t));
 const convert=v=>{const f=m.parse(v);return f.n/f.d;},x1=dir1*convert(current1)*t,x2=gap+dir2*convert(current2)*t;
 const low=Math.min(0,dir1*convert(current1)*15),high=Math.max(gap,gap+dir2*convert(current2)*15),X=x=>28+212*(x-low)/(high-low);
 return {gap,rate:r(rate),distance:r(distance),v1:r(v1),v2:r(v2),positions:[X(x1),X(x2)],dirs:[dir1,dir2]};
}
function walkTracks(points,dirs){
 const s=svg('svg',{viewBox:'0 0 270 87',role:'img',class:'pm-chart pcm-route-fractions','aria-label':'Два пешехода на одном масштабе. Стрелка возле кружка показывает направление.'});
 for(let i=0;i<2;i++){
  const x=points[i],y=i?64:30,d=dirs[i],c=i?'#94551a':'#245c48';ln(s,16,y,255,y,{stroke:'#a7b9b1'});s.append(svg('circle',{cx:x,cy:y,r:5,fill:c,'data-walker':i}));ln(s,x,y,x+12*d,y,{stroke:c});ln(s,x+12*d,y,x+8*d,y-3,{stroke:c});ln(s,x+12*d,y,x+8*d,y+3,{stroke:c});
 }
 return s;
}
function printedFormulaSample(tag,changed){
 const a=changed?9:6,b=changed?3:4;
 switch(tag){
 case 'area':return {given:'Стороны '+a+' и '+b+' см.',calculation:a+' × '+b,answer:a*b+' см²',rows:[['Число рядов',a],['Клеток в ряду',b]]};
 case 'perimeter':return {given:'Стороны '+a+' и '+b+' см.',calculation:'2 × ('+a+' + '+b+')',answer:2*(a+b)+' см',rows:[['Полупериметр, см',a+b],['Два полупериметра',2*(a+b)]]};
 case 'distance':{const speed=changed?9:7,hours=changed?3:2;return {given:speed+' км/ч в течение '+hours+' ч.',calculation:speed+' × '+hours,answer:speed*hours+' км',rows:[['Скорость, км/ч',speed],['Время, ч',hours]]};}
 case 'closure':{const u=changed?5:4,v=changed?8:6,t=changed?2:3;return {given:'Движутся навстречу со скоростями '+u+' и '+v+' км/ч в течение '+t+' ч.',calculation:'('+u+' + '+v+') × '+t,answer:(u+v)*t+' км',rows:[['Скорость сближения, км/ч',u+v],['Время до встречи, ч',t]]};}
 case 'volume':case 'surface':{const dims=changed?[2,6,7]:[3,4,5],[x,y,z]=dims;const volume=tag==='volume';
  return {given:'Рёбра '+dims.join(', ')+' см.',calculation:volume?dims.join(' × '):'2 × ('+x*y+' + '+y*z+' + '+x*z+')',answer:volume?x*y*z+' см³':2*(x*y+y*z+x*z)+' см²',rows:volume?[['Слой основания, см²',x*y],['Число слоёв',z]]:[['Грань ab',x*y],['Грань bc',y*z],['Грань ac',x*z]],shape:solidFigure('cuboid')};}
 case 'remainder':{const divisor=changed?8:7,q=changed?4:5,rest=changed?5:3;return {given:'Делитель '+divisor+', частное '+q+', остаток '+rest+'.',calculation:divisor+' × '+q+' + '+rest,answer:String(divisor*q+rest),rows:[['Полные группы',q],['Полных единиц',divisor*q],['Остаток',rest]]};}
 default:{const down=changed?21:16,up=changed?13:10;return {given:'По течению '+down+' км/ч, против '+up+' км/ч.',calculation:'('+down+' + '+up+') ÷ 2',answer:(down+up)/2+' км/ч',rows:[['Собственная скорость, км/ч',(down+up)/2],['Скорость воды, км/ч',(down-up)/2]]};}
 }
}
const stationPaths=[
 [[540,0],[720,12],[780,12],[900,24],[930,24],[1050,36]],
 [[570,36],[690,12],[780,12],[840,0]],
];
function stationSchedule(changed){
 const dt=changed?30:0,k=changed?.5:1;
 return stationPaths.map(points=>points.map(([time,km])=>[time+dt,km*k]));
}
function stationLegs(track){
 return track.slice(1).map(([end,next],i)=>{const [start,first]=track[i];return {start,end,minutes:end-start,speed:60*Math.abs(next-first)/(end-start),from:first,to:next};});
}
function stationResults(tag,changed){
 const tracks=stationSchedule(changed),legs=tracks.map(stationLegs),[walk,bike]=tracks,[w,b]=legs,at=clockText;
 const stand=legs.map(sequence=>sequence.filter(s=>!s.speed));
 if(tag==='starts')return {rows:[['Пешеход',at(walk[0][0]),'Деревня → станция'],['Велосипедист',at(bike[0][0]),'Станция → деревня']],head:['Путь','Начало','Направление'],result:'Старт пешехода '+at(walk[0][0])+', велосипедиста '+at(bike[0][0])+'.'};
 if(tag==='meeting'){
  const first=Math.max(stand[0][0].start,stand[1][0].start),last=Math.min(stand[0][0].end,stand[1][0].end);
  return {head:['Общее положение','Время'],rows:[['Впервые',at(first)],['Разъезжаются',at(last)],['Вместе, мин',last-first]],result:'Оба в '+walk[1][1]+' км от деревни с '+at(first)+' до '+at(last)+'.'};
 }
 if(tag==='speeds')return {head:['Путь','Интервал','Скорость, км/ч'],rows:legs.flatMap((sequence,i)=>sequence.map(u=>[i?'Велосипедист':'Пешеход',at(u.start)+'–'+at(u.end),u.speed])),result:'Пешеход: '+w[0].speed+', '+w[2].speed+' и '+w[4].speed+' км/ч в движении. Велосипедист: '+b[0].speed+' км/ч на обоих наклонных участках.'};
 return {head:['Участник','Остановка','Минуты'],rows:stand.flatMap((seq,i)=>seq.map(u=>[i?'Велосипедист':'Пешеход',at(u.start)+'–'+at(u.end),u.minutes])),result:'Пешеход отдыхает '+stand[0][0].minutes+' и '+stand[0][1].minutes+' мин. Велосипедист — '+stand[1][0].minutes+' мин.'};
}
function paperArea(tag,fresh,reveal,letters){
 const a=fresh?8:6,b=fresh?5:4,c=fresh?2:1,d=fresh?3:2;
 const A=tag==='oneStep'?a:fresh?9:8,B=tag==='oneStep'?b:fresh?7:6,C=tag==='squareHole'?(fresh?3:2):c;
 const W=tag==='oneStep'?a+d:tag==='squareHole'?A:B,H=tag==='oneStep'?b+c:tag==='squareHole'?B:A;
 const h=160,w=220,unit=Math.min(w/W,h/H),x0=(315-W*unit)/2,y0=21;
 const X=x=>x0+x*unit,Y=y=>y0+y*unit,coord=(x,y)=>X(x)+','+Y(y);
 const s=svg('svg',{viewBox:'0 0 315 215',class:'pm-chart pcm-route-fractions',role:'img','aria-label':{squareHole:'Прямоугольник с квадратным отверстием',oneStep:'Ступенчатая фигура с одной ступенью',twoSteps:'Прямоугольник с тремя вырезанными угловыми квадратами'}[tag]});
 const outline={fill:'#ead5e2',stroke:'#553348','stroke-width':2.3},label=(x,y,t,v)=>txt(s,X(x),Y(y),letters?t:String(v),{'font-size':19}),line=(x1,y1,x2,y2)=>ln(s,X(x1),Y(y1),X(x2),Y(y2),{stroke:'#286452','stroke-dasharray':'5 4','stroke-width':2});
 let area,formulaText,dimensions;
 if(tag==='squareHole'){
  const ox=(W-C)/2,oy=(H-C)/2;s.append(svg('rect',{x:X(0),y:Y(0),width:W*unit,height:H*unit,...outline}),svg('rect',{x:X(ox),y:Y(oy),width:C*unit,height:C*unit,fill:'#fff',stroke:'#553348','stroke-width':2.3}));
  label(W/2,-.22,'a',A);label(W+.44,H/2,'b',B);label(W/2,oy-.2,'c',C);
  if(reveal)line(ox,oy+C/2,ox+C,oy+C/2);
  area=A*B-C*C;formulaText='S = ab − c²';dimensions='a = '+A+', b = '+B+', c = '+C;
 }else if(tag==='oneStep'){
  s.append(svg('polygon',{points:[[0,0],[a,0],[a,c],[W,c],[W,H],[0,H]].map(([x,y])=>coord(x,y)).join(' '),...outline}));
  label(a/2,-.15,'a',a);label(a+.33,c/2,'c',c);label(a+d/2,c-.12,'d',d);label(W+.36,c+b/2,'b',b);
  if(reveal)line(0,c,a,c);area=(a+d)*b+a*c;formulaText='S = (a + d)b + ac';dimensions='a = '+a+', b = '+b+', c = '+c+', d = '+d;
 }else{
  s.append(svg('polygon',{points:[[0,0],[W-2*C,0],[W-2*C,C],[W-C,C],[W-C,2*C],[W,2*C],[W,H],[0,H]].map(([x,y])=>coord(x,y)).join(' '),...outline}));
  label(-.42,H/2,'a',A);label(W/2,H+.8,'b',B);label(W-2*C+.28,C*.65,'c',C);label(W-1.5*C,C-.1,'c',C);label(W-C+.27,1.7*C,'c',C);label(W-.48*C,2*C-.1,'c',C);
  if(reveal){line(W-2*C,0,W,0);line(W,0,W,2*C);line(W-C,0,W-C,C);line(W-C,C,W,C);}
  area=A*B-3*C*C;formulaText='S = ab − 3c²';dimensions='a = '+A+', b = '+B+', c = '+C;
 }
 return {picture:s,area,formulaText,dimensions};
}
function coordinateKite(delta,mode){
 const raw=[[4,2],[2,8],[14,12],[10,0]],pts=raw.map(([x,y])=>[x+delta,y+delta]),intersection=[6+delta,4+delta];
 const s=svg('svg',{viewBox:'0 0 315 282',class:'pm-chart pcm-route-fractions',role:'img','aria-label':'Четырёхугольник и координатная сетка. '+pts.map((p,i)=>'ABCD'[i]+'('+p.join('; ')+')').join(', ')});
 const X=x=>27+16*x,Y=y=>245-16*y;
 for(let i=0;i<=16;i++){ln(s,X(i),Y(0),X(i),Y(14),{stroke:'#e2e7e4','stroke-width':1});if(i%2===0)txt(s,X(i),260,String(i),{'font-size':13});}
 for(let j=0;j<=14;j++){ln(s,X(0),Y(j),X(16),Y(j),{stroke:'#e2e7e4','stroke-width':1});if(j%2===0)txt(s,14,Y(j)+4,String(j),{'font-size':13});}
 ln(s,X(0),Y(0),X(16.6),Y(0));ln(s,X(0),Y(0),X(0),Y(14.5));txt(s,300,248,'x',{'font-size':16});txt(s,24,12,'y',{'font-size':16});
 const link=(p,q,style={})=>ln(s,X(p[0]),Y(p[1]),X(q[0]),Y(q[1]),style);
 for(let i=0;i<4;i++){const [x,y]=pts[i];link(pts[i],pts[(i+1)%4]);s.append(svg('circle',{cx:X(x),cy:Y(y),r:3,fill:'#32664e'}));txt(s,X(x)+9,Y(y)-4,'ABCD'[i],{'font-size':16});}
 if(mode>=1){link(pts[0],pts[2],{stroke:'#99482f','stroke-dasharray':'5 3'});link(pts[1],pts[3],{stroke:'#4b5ea0','stroke-dasharray':'5 3'});}
 if(mode===2){s.append(svg('circle',{cx:X(intersection[0]),cy:Y(intersection[1]),r:4.2,fill:'#822c30','data-kite-intersection':intersection.join(',')}));txt(s,X(intersection[0])+11,Y(intersection[1])+13,'M',{'font-size':16});}
 return {picture:s,coords:pts,intersection};
}
function printedSequence(tag,alt){
 const mul=(a,b)=>['×',a,b],div=(a,b)=>['÷',a,b],sub=(a,b)=>['−',a,b],add=(a,b)=>['+',a,b],square=a=>mul(a,a);
 const groups=tag==='seriesA'?(alt?[sub(div(-3,'1/20'),div(10,-1)),mul(sub(4,'9/2'),div(5,'1/10')),add(div(square('-3/2'),'-3/4'),mul(3,1))]:[sub(div(-2,'3/100'),div('35/3',-1)),mul(sub('9/2','31/6'),div('9/2','1/10')),add(div(square('-4/3'),'-4/5'),mul('25/9',-1))]):
 (alt?[add(mul('1/4','-4/5'),mul('2/3','-3/2')),sub(sub(mul(3,'3/2'),'31/2'),1),div(sub(square('-1/5'),div('29/125','-1/5')),'-1/100')]:[add(mul('1/8','-8/25'),mul('5/9','-27/10')),sub(sub(mul('12/5','17/12'),'89/5'),square(-1)),div(sub(square('-1/5'),div('1/4','-1/6')),'-1/100')]);
 const m=root.PetersonMath,list=groups.map(tree=>expressionStages(tree,false)),v=list.map(q=>q.value),rule=tag==='seriesA'?m.operation('subtract',v[1],v[0]):m.operation('divide',v[1],v[0]),next=m.operation(tag==='seriesA'?'add':'multiply',v[2],rule);
 return {list,v,rule:m.answer(rule),next:m.answer(next)};
}
function magnitudesForRule(rule,fresh){
 const m=root.PetersonMath,x=fresh?120:60,y=rule==='minusTwo'?m.operation('subtract',x,2):m.operation('multiply',x,rule);
 return {given:x,result:m.answer(y),delta:m.answer(m.operation('subtract',y,x)),expression:rule==='minusTwo'?'y − 2':rule+' × '+(m.parse(rule).n>m.parse(rule).d?'x':'y')};
}
function compareBothBases(item,fresh){
 const m=root.PetersonMath,op=m.operation,r=v=>m.answer(v),ratio=fresh?({'2/5':'3/8','5/2':'8/3','4/5':'3/4','2':'3','3/5':'2/3','10/9':'5/4'}[item.ratio]):item.ratio;
 const b=item.fixed?(fresh?(item.ratio==='2/5'?8:3):(item.ratio==='2/5'?12:'24/5')):180,a=op('multiply',b,ratio);
 const p=op('multiply',ratio,100),q=op('divide',100,ratio),diff=v=>{const z=op('subtract',v,100);return r({n:Math.abs(z.n),d:z.d});};
 return {a:r(a),b:r(b),p:r(p),q:r(q),deltaA:diff(p),deltaB:diff(q),aLarger:p.n>100*p.d};
}
function reducedFormExample(key,fresh){
 const m=root.PetersonMath,op=m.operation,r=x=>m.answer(x);
 if(key==='principle'||key==='numbersA'||key==='numbersB'){
  const pairs={principle:[[18,30],[21,35]],numbersA:[[546,910],[385,550]],numbersB:[[264,1056],[294,672]]},[n,d]=pairs[key][fresh?1:0],reduced=op('divide',n,d),factor=n/reduced.n,answer=r(reduced);
  return {given:n+'/'+d,factor:String(factor),reduced:answer,original:answer,substitution:'Числитель '+n+', знаменатель '+d,small:[n/factor,d/factor]};
 }
 const examples={
  lettersA:{values:fresh?[3,12,2]:[2,9,3],letters:['a','b','c'],original:'4abc/(12a²c)',factor:'4ac',reduced:'b/(3a)',both:([a,b,c])=>[4*a*b*c,12*a*a*c,b,3*a]},
  lettersB:{values:fresh?[5,2,3]:[4,3,2],letters:['x','y','z'],original:'15x²y/(40xyz)',factor:'5xy',reduced:'3x/(8z)',both:([x,y,z])=>[15*x*x*y,40*x*y*z,3*x,8*z]},
  lettersC:{values:fresh?[4,8,2]:[5,7,3],letters:['a','x','y'],original:'(ax − ay)/(ax + ay)',factor:'a',reduced:'(x − y)/(x + y)',both:([a,x,y])=>[a*x-a*y,a*x+a*y,x-y,x+y]},
  lettersD:{values:fresh?[6,5]:[3,4],letters:['m','n'],original:'mn/(mn + m)',factor:'m',reduced:'n/(n + 1)',both:([m,n])=>[m*n,m*n+m,n,n+1]}
 };
 const em=examples[key],[num0,den0,num1,den1]=em.both(em.values);
 return {given:em.original,reduced:em.reduced,factor:em.factor,substitution:em.letters.map((k,i)=>k+' = '+em.values[i]).join(', '),original:r(op('divide',num0,den0)),small:[num1,den1]};
}
function sharedJourney(tag,changed) {
 let condition,equation,labels,bar,rows,result;
 if(tag==='rider'){
  const distance=changed?3:2,sum=distance*12,walk=(sum-12)/2,rider=walk+12;
  condition='Пешеход и всадник сближаются из пунктов в '+distance+' км. Встреча через пять минут. Разность скоростей 12 км/ч.';
  equation='(v + v + 12) × 1/12 = '+distance;labels=['Пешеход','Всадник'];bar=[walk,rider];rows=[['Время обоих, ч','1/12'],['Скорость сближения, км/ч',sum],['Путь пешехода, км',root.PetersonMath.answer(root.PetersonMath.operation('divide',walk,12))],['Путь всадника, км',root.PetersonMath.answer(root.PetersonMath.operation('divide',rider,12))]];result='Скорости '+walk+' и '+rider+' км/ч.';
 }else if(tag==='trainsCatch'){
  const initial=changed?192:256,gap=initial/8,freight=2*gap,passenger=3*gap;
  condition='Пассажирский догоняет товарный. Начальное отставание '+initial+' км. Время погони 8 ч, преимущество в скорости 50%.';
  equation='(1,5v − v) × 8 = '+initial;labels=['Товарный','Пассажирский'];bar=[freight,passenger];rows=[['Скорость сближения, км/ч',gap],['Товарный за 8 ч, км',8*freight],['Пассажирский за 8 ч, км',8*passenger]];result='Скорости '+freight+' и '+passenger+' км/ч.';
 }else if(tag==='afterMeet'){
  const apart=changed?36:54,sum=3*apart,truck=4*sum/9,car=5*sum/9,m=root.PetersonMath,time=v=>m.answer(m.operation('divide',324,v));
  condition='Спустя треть часа после встречи машины разделяют '+apart+' км. Скорости даны в отношении 4:5. Каждой нужно пройти 324 км.';
  equation='(4k + 5k) × 1/3 = '+apart;labels=['Грузовик','Легковая'];bar=[truck,car];rows=[['Сумма скоростей, км/ч',sum],['Грузовик, км/ч',truck],['Легковая, км/ч',car],['Время грузовика, ч',time(truck)],['Время легковой, ч',time(car)]];result='На 324 км нужны '+time(truck)+' и '+time(car)+' ч.';
 }else{
  const gap=changed?24:20,slow=gap*5/2,fast=slow*6/5;condition='Первый автобус выехал на 15 мин раньше и едет на 20% быстрее. Через 30 мин после выезда второго разрыв '+gap+' км.';
  equation='1,2v × 3/4 − v × 1/2 = '+gap;labels=['Междугородный','Рейсовый'];bar=[fast,slow];rows=[['Первый в пути, ч','3/4'],['Второй в пути, ч','1/2'],['Путь первого, км',fast*3/4],['Путь второго, км',slow/2]];result='Скорости '+fast+' и '+slow+' км/ч.';
 }
 return {condition,equation,labels,bar,rows,result};
}
function oneMentalOperation(tuple,alternate){
 const [source,sign,y]=tuple,m=root.PetersonMath,op=m.operation,r=x=>m.answer(x),x=alternate?op('multiply',source,2):m.parse(source),right=m.parse(y);
 const keys={'+':'add','−':'subtract','×':'multiply','÷':'divide'};
 let value;
 if(sign==='^'){value=op('multiply',x,x);if(Number(y)===3)value=op('multiply',value,x);}
 else value=op(keys[sign],x,right);
 const abs=z=>r({n:Math.abs(z.n),d:z.d}),entry=z=>z.n<0?'('+r(z)+')':r(z),expression=sign==='^'?entry(x)+(y==='2'?'²':'³'):entry(x)+' '+sign+' '+entry(right);
 let guidance;
 if(sign==='^')guidance=Number(y)===2?'Два отрицательных множителя дают положительный квадрат.':'В произведении три отрицательных множителя, поэтому куб отрицателен.';
 else if(sign==='÷')guidance='Для модуля умножь '+abs(x)+' на '+r(op('divide',1,{n:Math.abs(right.n),d:right.d}))+'. Сравни знаки делимого и делителя.';
 else if(sign==='×')guidance='Умножь модули '+abs(x)+' и '+abs(right)+'. Одинаковые знаки дают плюс, разные дают минус.';
 else guidance=sign==='−'?'Представь вычитание как прибавление противоположного. Слева на числовой прямой числа уменьшаются.':'Сравни модули '+abs(x)+' и '+abs(right)+'. При разных знаках вычти меньший модуль из большего.';
 return {expression,guidance,value:r(value),sign:value.n>0?'Плюс':value.n<0?'Минус':'Ноль',left:r(x),right:r(right)};
}
function startingCarDiagram(route) {
 const drawings={
  carsMeet:{arrows:[1,-1],marks:['x + 15','x'],distance:243,time:'1 ч 48 мин',end:0},
  carsApart:{arrows:[-1,1],marks:['x','x + 32'],distance:52,time:'1 ч 30 мин',end:304},
  carsLead:{arrows:[1,1],marks:['x','1,4x'],distance:30,time:'2 ч 15 мин',end:162},
  carsCatch:{arrows:[1,1],marks:['x','0,7x'],distance:24,time:'40 мин',end:0}
 },data=drawings[route],after=data.end?'промежуток '+data.end+' км':'встреча';
 const picture=svg('svg',{viewBox:'0 0 315 165',class:'pm-chart pcm-route-fractions',role:'img','aria-label':'Начальная схема. '+data.distance+' км. Левая едет '+(data.arrows[0]>0?'вправо':'влево')+', правая '+(data.arrows[1]>0?'вправо':'влево')+'. Через '+data.time+' '+after+'.'});
 ln(picture,18,68,298,68,{stroke:'#8da79a'});
 const points=[72,239];
 for(let i=0;i<2;i++){
  const x=points[i],dir=data.arrows[i],end=x+35*dir,color=i?'#915018':'#22664a';
  txt(picture,x,25,data.marks[i]+' км/ч',{'font-size':21});
  ln(picture,x,61,x,75,{stroke:color});ln(picture,x,52,end,52,{stroke:color,'stroke-width':3});ln(picture,end,52,end-8*dir,46,{stroke:color});ln(picture,end,52,end-8*dir,58,{stroke:color});
  picture.append(svg('circle',{cx:x,cy:68,r:4,fill:color,'data-drive':dir}));
 }
 ln(picture,72,85,239,85,{stroke:'#688274','stroke-width':1});ln(picture,72,79,72,85);ln(picture,239,79,239,85);
 txt(picture,157,108,'Вначале '+data.distance+' км',{'font-size':20});txt(picture,157,135,'Через '+data.time,{'font-size':19});txt(picture,157,159,data.end?'Расстояние '+data.end+' км':'Встреча',{'font-size':19});
 return picture;
}
function sourceRoute(spec,changed){
 const m=root.PetersonMath,r=x=>m.answer(x),op=m.operation;
 let condition,equation,labels,bar,rows,result,shape;
 if(spec==='mint'||spec==='salt'){
  const mint=spec==='mint',added=mint?(changed?40:80):(changed?25:50),initial=mint?5*added:4*added,substance=mint?.4*initial:.05*initial,other=initial-substance;
  condition=mint?'Мята составляет 40% смеси. Добавили '+added+' г мяты, и теперь массы мяты и зверобоя равны.':'Исходная концентрация соли 5%. После добавления '+added+' г чистой соли концентрация стала 24%.';
  equation=mint?'0,4x + '+added+' = 0,6x':'0,05x + '+added+' = 0,24(x + '+added+')';labels=mint?['Мята до','Зверобой до']:['Соль до','Соль после'];bar=mint?[substance,other]:[substance,substance+added];
  rows=[['Масса смеси до, г',initial],[mint?'Мята до, г':'Соль до, г',substance],[mint?'Зверобой, г':'Вода, г',other],['Масса смеси после, г',initial+added],[mint?'Мята после, г':'Соль после, г',substance+added]];
  result=mint?'Первоначально зверобоя '+other+' г, мяты '+substance+' г.':'В исходном растворе '+substance+' г соли.';
 }else if(spec==='triangle'||spec==='quad'){
  const tri=spec==='triangle',third=changed?21:14,x=tri?third*45/7:(changed?25:15),sides=tri?[x*4/9,x*2/5,third]:[.6*x,x,1.2*x,.6*x+7],per=sides.reduce((a,b)=>a+b,0);
  condition=tri?'Первая сторона равна 4/9 периметра. Вторая равна 90% первой. Третья '+third+' см.':'Периметр '+per+' см. Первая сторона 60% второй. Третья 75% суммы первых двух. Четвёртая на 7 см длиннее первой.';
  equation=tri?'(1 − 4/9 − 2/5)P = '+third:'0,6x + x + 1,2x + 0,6x + 7 = '+per;
  labels=['Первая сторона','Вторая сторона'];bar=sides.slice(0,2);rows=sides.map((length,i)=>['Сторона '+(i+1)+', см',length]);rows.push(['Периметр, см',per]);
  result=tri?'Периметр '+per+' см. Стороны: '+sides.join(', ')+' см.':'Стороны по порядку: '+sides.join(', ')+' см.';
  if(tri){
   const [ab,bc,ca]=sides,xx=(ab**2+ca**2-bc**2)/(2*ab),yy=Math.sqrt(ca**2-xx**2);
   shape=geometryFigure({caption:'Треугольник в едином масштабе. AB '+ab+', BC '+bc+', CA '+ca+' см.',points:[{name:'A',x:0,y:0},{name:'B',x:ab,y:0},{name:'C',x:xx,y:yy}],segments:[['A','B'],['B','C'],['C','A']]});
  }
 }else if(spec==='rectPercent'||spec==='rectDifference'){
  const percent=spec==='rectPercent',width=percent?(changed?'13/5':'13/10'):(changed?'6/5':'12/5'),length=percent?(changed?5:'5/2'):(changed?3:6);
  const perimeter=r(op('multiply',2,op('add',width,length))),area=r(op('multiply',width,length)),diff=r(op('subtract',length,width));
  condition=percent?'Дан периметр '+perimeter+' см, ширина на 48% меньше длины.':'Длина больше ширины на '+diff+' см. Ширина равна одной седьмой периметра.';
  equation=percent?'2(x + 0,52x) = '+perimeter:'2(w + w + '+diff+') = 7w';labels=['Длина','Ширина'];bar=[r(length),width];
  rows=[['Длина, см',bar[0]],['Ширина, см',width],['Периметр, см',perimeter],['Площадь, см²',area]];result='Площадь '+area+' см².';
  const decimal=x=>{const f=m.parse(x);return f.n/f.d;},a=decimal(length),b=decimal(width);
  shape=geometryFigure({caption:'Длина и ширина в одном масштабе: '+bar[0]+' и '+width+' см.',points:[{name:'A',x:0,y:0},{name:'B',x:a,y:0},{name:'C',x:a,y:b},{name:'D',x:0,y:b}],segments:[['A','B'],['B','C'],['C','D'],['D','A']]});
 }else if(spec==='riverEqual'||spec==='riverRatio'){
  const equal=spec==='riverEqual',c=equal?(changed?3:2):(changed?3:'5/2'),own=equal?r(op('multiply',c,11)):r(op('multiply',c,7)),up=r(op('subtract',own,c)),down=r(op('add',own,c));
  condition=equal?'Лодка в стоячей воде прошла бы '+own+' км за час. 1 ч 15 мин по течению и 1 ч 30 мин против дают равные пути.':'Скорость воды '+r(c)+' км/ч. За одинаковое время путь против течения составляет три четверти пути по течению.';
  equation=equal?'(5/4)('+own+' + c) = (3/2)('+own+' − c)':'v − '+r(c)+' = (3/4)(v + '+r(c)+')';
  labels=['Против течения','По течению'];bar=[up,down];rows=[['Скорость воды, км/ч',r(c)],['Собственная скорость, км/ч',own],['Против течения, км/ч',up],['По течению, км/ч',down]];
  result=equal?'Скорость течения '+r(c)+' км/ч. Пути по '+r(op('multiply',down,'5/4'))+' км.':'Собственная скорость '+own+' км/ч. Точное общее время сокращается.';
 }else{
  const variations={
   carsMeet:{directions:[1,-1],initial:changed?270:243,hours:'9/5',end:0,rule:'v₁ = v₂ + 15'},
   carsApart:{directions:[-1,1],initial:52,hours:'3/2',end:changed?328:304,rule:'v₂ = v₁ + 32'},
   carsLead:{directions:[1,1],initial:30,hours:'9/4',end:changed?156:162,rule:'v₂ = (7/5)v₁'},
   carsCatch:{directions:[1,1],initial:changed?18:24,hours:'2/3',end:0,rule:'v₂ = (7/10)v₁'}
  },v=variations[spec],gapRate=op('divide',Math.abs(v.end-v.initial),v.hours);
  let left,right;
  if(spec==='carsMeet'){right=op('divide',op('subtract',gapRate,15),2);left=op('add',right,15);}
  else if(spec==='carsApart'){left=op('divide',op('subtract',gapRate,32),2);right=op('add',left,32);}
  else{left=op('divide',gapRate,spec==='carsLead'?'2/5':'3/10');right=op('multiply',left,spec==='carsLead'?'7/5':'7/10');}
  const decimal=x=>{const f=m.parse(x);return f.n/f.d;},finalLeft=v.directions[0]*decimal(op('multiply',left,v.hours)),finalRight=v.initial+v.directions[1]*decimal(op('multiply',right,v.hours)),lo=Math.min(0,v.initial,finalLeft,finalRight),hi=Math.max(0,v.initial,finalLeft,finalRight),place=x=>28+212*(x-lo)/(hi-lo);
  condition='Начальный промежуток '+v.initial+' км. Через '+v.hours+' ч промежуток '+v.end+' км. '+v.rule+'.';
  equation=(spec==='carsMeet'?'(v₁ + v₂)t':spec==='carsApart'?'(v₁ + v₂)t':spec==='carsLead'?'(v₂ − v₁)t':'(v₁ − v₂)t')+' = '+Math.abs(v.end-v.initial);
  labels=['Левая вначале','Правая вначале'];bar=[r(left),r(right)];rows=[['Промежуток вначале, км',v.initial],['Промежуток в конце, км',v.end],['Скорость изменения, км/ч',r(gapRate)],['Левая машина, км/ч',r(left)],['Правая машина, км/ч',r(right)]];
  result='Скорости слева направо: '+r(left)+' и '+r(right)+' км/ч.';
  shape=el('div');const frames=[['Старт',0,v.initial],['Через '+v.hours+' ч',finalLeft,finalRight]];
  for(const [title,x,y] of frames){shape.append(el('p','pm-note',title),twoCarLanes(place(x),place(y),...v.directions,title+': расстояние '+Math.round(Math.abs(y-x))+' км.'));}
 }
 return {condition,equation,labels,bar,rows,result,shape};
}
function comparedAmounts(kind,changed){
 const m=root.PetersonMath,op=m.operation,r=x=>m.answer(x);
 let condition,equation,labels,bar,rows,result;
 if(kind==='sugar'){
  const total=changed?'15/2':5,left=op('multiply',total,'6/25'),first=op('multiply',left,3),second=op('subtract',total,first);
  condition='В двух пакетах '+r(total)+' кг. После изъятия 2/3 первого и 1/7 второго остатки равны.';
  equation='3r + (7/6)r = '+r(total);labels=['Первый пакет','Второй пакет'];bar=[r(first),r(second)];
  rows=[['В первом сначала, кг',bar[0]],['Во втором сначала, кг',bar[1]],['Осталось в каждом, кг',r(left)]];
  result='Первый пакет '+bar[0]+' кг, второй '+bar[1]+' кг. В каждом осталось '+r(left)+' кг.';
 }else if(kind==='tram'){
  const k=changed?2:1,first=20*k,second=24*k,nowFirst=25*k,nowSecond=23*k;
  condition='Второй вагон вначале перевозит 1,2 от числа пассажиров первого. В первом прибыло '+5*k+', во втором убыло '+k+'. Теперь во втором на 8% меньше.';
  equation='1,2x − '+k+' = 0,92(x + '+5*k+')';labels=['Первый после','Второй после'];bar=[nowFirst,nowSecond];
  rows=[['Первый: сначала',first],['Второй: сначала',second],['Первый: после',nowFirst],['Второй: после',nowSecond]];
  result='После остановки в вагонах '+nowFirst+' и '+nowSecond+' чел. Разность равна 8% от '+nowFirst+'.';
 }else if(kind==='classes'){
  const gap=changed?10:5,small=5*gap,big=6*gap,now=27*gap/5;
  condition='Первый класс вначале меньше второго на '+gap+' чел. После роста первого на 8% и сокращения второго на 10% численность сравнялась.';
  equation='1,08x = 0,9(x + '+gap+')';labels=['Первый до','Второй до'];bar=[small,big];
  rows=[['Первый: до',small],['Второй: до',big],['Первый: после',now],['Второй: после',now]];result='Стало по '+now+' чел. в каждом классе.';
 }else if(kind==='cinema'){
  const g=changed?16:12,delta=g/4,moreGirls=g+delta,fewerBoys=3*delta;
  condition='В первом классе '+g+' девочек, во втором на четверть больше. Мальчиков в первом на треть больше, чем во втором. Общие числа равны.';
  equation=g+' + (4/3)b = '+moreGirls+' + b';labels=['Мальчики первого','Мальчики второго'];bar=[4*delta,fewerBoys];
  rows=[['Девочки первого',g],['Девочки второго',moreGirls],['Мальчики первого',bar[0]],['Мальчики второго',bar[1]]];
  result='От каждого класса пришло по '+(g+bar[0])+' чел.';
 }else if(kind==='tea'){
  const total=changed?720:480,cup=2*total/15,kettle=3*cup/2;
  condition='Чайник и шесть чашек вместе стоят '+total+' руб. Чайник на 50% дороже чашки.';
  equation='(6 + 1,5)c = '+total;labels=['Чайник','Две чашки'];bar=[kettle,2*cup];
  rows=[['Чашка, руб.',cup],['Чайник, руб.',kettle],['Две чашки, руб.',2*cup]];
  result='Чайник с двумя чашками стоит '+(kettle+2*cup)+' руб.';
 }else if(kind==='clothes'){
  const total=changed?990:792,shorts=total*25/99,shirt=shorts*4/5,jacket=(shorts+shirt)*6/5;
  condition='Три вещи стоят '+total+' руб. Футболка на 20% дешевле шорт, жакет на 20% дороже обеих вещей вместе.';
  equation='x + 0,8x + 1,2(x + 0,8x) = '+total;labels=['Футболка','Жакет'];bar=[shirt,jacket];
  rows=[['Шорты, руб.',shorts],['Футболка, руб.',shirt],['Жакет, руб.',jacket]];result='Футболка и жакет стоят '+(shirt+jacket)+' руб.';
 }else if(kind==='marks'){
  const k=changed?2:1,n=30*k,difference=10*k,twos=3*k;
  condition='Доли пятёрок и четвёрок 1/6 и 8/15. Троек на '+difference+' меньше, чем четвёрок, двоек '+twos+'.';
  equation='n/6 + 8n/15 + (8n/15 − '+difference+') + '+twos+' = n';labels=['Четвёрки','Пятёрки'];bar=[16*k,5*k];
  rows=[['Четвёрки',bar[0]],['Пятёрки',bar[1]],['Тройки',6*k],['Двойки',twos],['Всего',n]];
  result='Оценки 4 и 5 получили '+(21*k)+' из '+n+' учащихся (70%). Четвёрок '+bar[0]+', пятёрок '+bar[1]+'.';
 }else if(kind==='asymmetric'){
  const rise=changed?60:50,gap=3,small=40*gap/(rise-40),big=small+gap;
  condition='Меньшее число увеличивают на '+rise+'%, большее уменьшают на 40%. Сумма сохраняется, а изначальная разность равна 3.';
  equation=rise+'x = 40(x + 3)';labels=['Меньшее','Большее'];bar=[small,big];
  const above=r(op('divide',100*gap,small)),below=r(op('divide',100*gap,big));rows=[['Меньшее',small],['Большее',big],['Разность',gap],['Превышение, %',above],['Недостача, %',below]];
  result='Большее превышает меньшее на '+above+'%, меньшее отстаёт от большего на '+below+'%.';
 }else if(kind==='brothers'){
  const total=changed?60:45,middle=total/3,young=2*middle/5,old=8*middle/5;
  condition='Троим вместе '+total+' лет. Возраст младшего на 60% меньше среднего, возраст старшего на 60% больше среднего.';
  equation='0,4x + x + 1,6x = '+total;labels=['Младший','Старший'];bar=[young,old];
  rows=[['Младший, лет',young],['Средний, лет',middle],['Старший, лет',old]];result='Возраст братьев по порядку: '+young+', '+middle+', '+old+' лет.';
 }else{
  const gap=changed?130:260,english=gap*25/13,french=english*12/25,combined=english+french,all=20*combined;
  condition='Французских книг 48% от числа английских. Их на '+gap+' меньше. Вместе эти группы составляют 5% фонда.';
  equation='(1 − 0,48)E = '+gap+'; 0,05N = E + 0,48E';labels=['Английские','Французские'];bar=[english,french];
  rows=[['Английские',english],['Французские',french],['На двух языках',combined],['Весь фонд',all]];result='Во всей библиотеке '+all+' книг.';
 }
 return {condition,equation,labels,bar,rows,result};
}
function modelStory(opening,changed){
 const m=root.PetersonMath,op=m.operation,r=x=>m.answer(x);
 let condition,equation,labels,bar,rows,result;
 if(opening==='clockElapsed'||opening==='clockRemain'){
  const elapsedFirst=opening==='clockElapsed',ratio=elapsedFirst?(changed?'1/4':'1/5'):(changed?'1/2':'3/5');
  const larger=op('divide',24,op('add',1,ratio)),smaller=op('subtract',24,larger),elapsed=elapsedFirst?smaller:larger,remaining=elapsedFirst?larger:smaller;
  condition=(elapsedFirst?'Прошло '+ratio+' оставшегося времени.':'Осталось '+ratio+' прошедшего времени.');equation=elapsedFirst?'x = ('+ratio+')(24 − x)':'24 − x = ('+ratio+')x';
  labels=['Прошло','Осталось'];bar=[r(elapsed),r(remaining)];rows=[['Прошло, ч',bar[0]],['Осталось, ч',bar[1]],['Всего, ч',24]];result='На часах '+clockText(Number(r(op('multiply',elapsed,60))))+'.';
 }else if(opening==='craft'||opening==='trainWork'){
  const workshop=opening==='craft',gap=workshop?(changed?20:15):(changed?20:28),ta=workshop?8:10,tb=workshop?10:12.5,slow=gap*ta/(tb-ta),fast=slow+gap,total=fast*ta;
  condition=workshop?'Мастер завершает тот же заказ за 8 ч, ученик — за 10 ч. Разность производительностей '+gap+' деталей/ч.':'Скорый поезд в пути 10 ч, пассажирский 12,5 ч. Разность скоростей '+gap+' км/ч.';
  equation=ta+'(x + '+gap+') = '+num(tb)+'x';labels=workshop?['Мастер','Ученик']:['Скорый','Пассажирский'];bar=[fast,slow];rows=[[labels[0]+': за час',fast],[labels[1]+': за час',slow],[workshop?'Один заказ, деталей':'Путь, км',total]];result=workshop?'За час мастер делает '+fast+', ученик '+slow+'.':'Расстояние '+total+' км.';
 }else if(opening==='threeDays'||opening==='repair'){
  const drive=opening==='threeDays',remainder=drive?(changed?220:440):(changed?10:5),total=drive?remainder*30/11:remainder*9,first=drive?total/3:total*2/9,second=total-remainder-first;
  condition=drive?'В третьем дне '+remainder+' км. Второй день составляет 90% первого.':'В июне '+remainder+' км. В мае выполнено 6/7 остатка после апреля.';
  equation=drive?'x/3 + (9/10)(x/3) + '+remainder+' = x':'(1/7)(7/9)x = '+remainder;
  labels=drive?['Первый день','Второй день']:['Апрель','Май'];bar=[first,second];rows=[[labels[0],first],[labels[1],second],[drive?'Третий день':'Июнь',remainder],['Всего, км',total]];result=(drive?'Во второй день ':'В мае ')+second+' км.';
 }else if(opening==='candy'){
  const q=changed?6:4,total=9*q,left=6*q;condition='Сначала взяли '+q+' конфет, потом четверть остатка. Остались две трети начального числа.';equation='(3/4)(x − '+q+') = (2/3)x';labels=['Вначале','В конце'];bar=[total,left];rows=[['Начало',total],['После первой операции',8*q],['Затем взяли',2*q],['В конце',left]];result='Остаток: '+left+' шт.';
 }else if(opening==='log'){
  const last=changed?'21/5':'21/10',total=op('divide',last,'21/50'),middle=op('multiply',total,'7/10'),second=op('multiply',middle,'2/5');
  condition='Конечный остаток бревна '+r(last)+' м. По очереди отрезано 30% и 40% остатка.';equation='(7/10)(3/5)x = '+r(last);labels=['До второго','После второго'];bar=[r(middle),r(last)];rows=[['Вначале',r(total)],['Перед вторым распилом',r(middle)],['Второй отпил',r(second)],['Осталось',r(last)]];result='Второй отпил '+r(second)+' м.';
 }else if(opening==='nursery'){
  const gap=changed?120:150,x=(270-gap)/3;condition='После продаж яблонь осталось на '+gap+' больше, чем слив. Начальные количества 450 и 180.';equation='(450 − 4x) − (180 − x) = '+gap;labels=['Продано яблонь','Продано слив'];bar=[4*x,x];rows=[['Продано яблонь',4*x],['Продано слив',x],['Осталось яблонь',450-4*x],['Осталось слив',180-x]];result='Продано '+5*x+' саженцев.';
 }else if(opening==='basins'){
  const q=changed?100:200;condition='Из каждого бассейна выкачали по '+q+' м³. Начальное отношение 3:1, конечное 5:1.';equation='3x − '+q+' = 5(x − '+q+')';labels=['Первый сначала','Второй сначала'];bar=[6*q,2*q];rows=[['Первый: сначала',6*q],['Второй: сначала',2*q],['Первый: после',5*q],['Второй: после',q]];result='Сначала было '+6*q+' и '+2*q+' м³.';
 }else if(opening==='notebooks'||opening==='oilTransfer'){
  const books=opening==='notebooks',q=books?(changed?9:6):(changed?'16/5':'8/5'),small=op('multiply',q,books?4:'1/2'),big=op('multiply',small,books?'3/2':4),first=op('subtract',big,q),second=op('add',small,q);
  condition=(books?'Из первой пачки во вторую переложили ':'Из первого бидона во второй перелили ')+r(q)+(books?' тетрадей.':' л.');equation=books?'1,5x − '+q+' = x + '+q:'x + '+q+' = 1,5(4x − '+q+')';labels=['Первая после','Вторая после'];bar=[r(first),r(second)];rows=[['Первая: вначале',r(big)],['Вторая: вначале',r(small)],['Первая: после',r(first)],['Вторая: после',r(second)]];result=books?'Сначала было '+r(big)+' и '+r(small)+' тетрадей.':'Конечные объёмы '+r(first)+' и '+r(second)+' л.';
 }else if(opening==='segments'){
  const extra=changed?6:3,cd=4*(extra+3),ab=cd/2;condition='AB увеличивают на '+extra+' см, а CD уменьшают на 40 мм = 4 см.';equation='x/2 + '+extra+' = (3/4)(x − 4)';labels=['Новый AB','Новый CD'];bar=[ab+extra,cd-4];rows=[['AB сначала',ab],['CD сначала',cd],['AB после',bar[0]],['CD после',bar[1]]];result='Первоначальный CD равен '+cd+' см.';
 }else{
  const percent=changed?75:80,second=80,first=90*second/percent;condition=percent+'% первого куска равны 90% второго.';equation=percent+'A = 90B';labels=['Первый','Второй'];bar=[first,second];rows=[['Первый кусок, условных единиц',first],['Второй кусок',second],['Одинаковая доля каждого',72]];result='Первый длиннее на '+num((first-second)/second*100)+'%.';
 }
 return {condition,equation,labels,bar,rows,result};
}
function changingGap(type,initial,t){
 const direct1=type===1||type===3?-1:1,direct2=type===0||type===3?-1:1,v1=20,v2=10;
 const left=direct1*v1*t,right=initial+direct2*v2*t;
 const min=Math.min(0,initial,direct1*v1*3,initial+direct2*v2*3),max=Math.max(0,initial,direct1*v1*3,initial+direct2*v2*3);
 return {left,right,distance:right-left,firstDirection:direct1,secondDirection:direct2,pos:x=>26+216*(x-min)/(max-min)};
}
function twoCarLanes(firstX,secondX,firstArrow,secondArrow,label){
 const s=svg('svg',{viewBox:'0 0 270 104',class:'pm-chart pcm-route-fractions',role:'img','aria-label':label});
 const car=(x,y,dir,colour,caption)=>{
  ln(s,20,y,250,y,{stroke:'#9aafa3'});s.append(svg('circle',{cx:x,cy:y,r:7,fill:colour}));
  const end=x+dir*14;ln(s,x,y,end,y,{stroke:'#314d42','stroke-width':2});ln(s,end,y,end-dir*4,y-4,{stroke:'#314d42'});ln(s,end,y,end-dir*4,y+4,{stroke:'#314d42'});
  txt(s,135,y-17,caption,{'font-size':13});
 };
 car(firstX,36,firstArrow,'#235b46','Первая машина');car(secondX,77,secondArrow,'#9f4e08','Вторая машина');return s;
}
function formulaGeometry(tag,a){
 if(tag>=6)return passageGeometry(tag,a);
 const b=tag===3?10-a:4,c=5,perimeter=20;
 if(tag===0||tag===4)return {diagram:solidFigure('cube'),labels:[['Ребро',a+' см'],['Площадь одной грани',a*a+' см²']],formula:tag===0?'V = a³':'S = 6a²',result:tag===0?a**3+' см³':6*a*a+' см²'};
 if(tag===2)return {diagram:circleDiameterFigure(),labels:[['Радиус',a+' см'],['Число радиусов в диаметре','2']],formula:'D = 2R',result:2*a+' см'};
 if(tag===5)return {diagram:solidFigure('cuboid'),labels:[['a × b',a*b+' см²'],['a × c',a*c+' см²'],['b × c',b*c+' см²']],formula:'S = 2(ab + ac + bc)',result:2*(a*b+a*c+b*c)+' см²'};
 const tri=tag===1,points=[{name:'A',x:0,y:0},{name:'B',x:a,y:0},{name:'C',x:tri?0:a,y:b}];if(!tri)points.push({name:'D',x:0,y:b});
 const pairs=tri?[['A','B'],['B','C'],['C','A']]:[['A','B'],['B','C'],['C','D'],['D','A']];
 return {diagram:geometryFigure({points,segments:pairs,caption:tri?'Два катета под прямым углом':'Прямоугольник данного периметра'}),labels:tri?[['Первый катет',a+' см'],['Второй катет',b+' см']]:[['Периметр',perimeter+' см'],['Первая сторона',a+' см'],['Вторая сторона',b+' см']],formula:tri?'S = ab/2':'S = a(P/2 − a)',result:(tri?a*b/2:a*b)+' см²'};
}
function approachDiagram(t,d,stage){
 const m=root.PetersonMath,toNum=v=>{const q=m.parse(v);return q.n/q.d;};
 const space=toNum(d.space),v1=toNum(d.v1),v2=toNum(d.v2),time=toNum(d.time),vSecond=t.approach?-v2:v2,last=Math.max(space,time*v1,space+time*vSecond),phase=stage/2;
 const x=n=>26+216*n/last,one=x(time*v1*phase),two=x(space+time*vSecond*phase);
 return twoCarLanes(one,two,1,t.approach?-1:1,t.approach?'Встречное движение: стрелки направлены навстречу':'Вдогонку: обе стрелки идут вправо');
}
function lastSectionStory(tag,a,b){
 if(tag==='fuel'){
  const draw=a?5:6,small=2*draw,large=4*draw,withdrawn=b?draw:0;
  return {title:'Из обеих канистр отлили по '+draw+' л.',columns:['Канистра','Сейчас, л'],rows:[['Первая',large-withdrawn],['Вторая',small-withdrawn]],conclusion:'Отношение сейчас '+(b?3:2)+' к 1.'};
 }
 if(tag==='park'){
  const lindens=a?88:94,total=(lindens+18)*15/2;
  return {title:'Лип '+lindens+', дубов на 18 больше, чем клёнов.',columns:['Вид','Количество'],rows:[['Берёзы',total/5],['Клёны',total/3],['Дубы',total/3+18],['Липы',lindens]],conclusion:'Всего '+total+' деревьев.'};
 }
 const potatoes=a?128:140,cabbage=80,cabbageDaily=(potatoes-cabbage)/12,potatoDaily=2.5*cabbageDaily;
 return {title:'Запасы в начале: '+potatoes+' т картофеля, '+cabbage+' т капусты.',columns:['Овощи','Осталось, т'],rows:[['Картофель',potatoes-b*potatoDaily],['Капуста',cabbage-b*cabbageDaily]],conclusion:'В сутки вывозят '+num(potatoDaily)+' + '+num(cabbageDaily)+' = '+num(potatoDaily+cabbageDaily)+' т.'};
}
function expressionStages(tree,fresh){
 const m=root.PetersonMath,steps=[];let visited=false;
 function value(node){
  if(!Array.isArray(node)){const v=m.operation('multiply',node,!visited&&fresh?2:1);visited=true;return v;}
  const [op,l,r]=node,a=value(l),b=value(r),v=m.operation(cycleKeys[op],a,b);
  steps.push([m.answer(a)+' '+op+' ('+m.answer(b)+')',m.answer(v)]);return v;
 }
 return {value:m.answer(value(tree)),steps};
}
function fractionPairFigure(){
 const pair=el('div','pcm-sum-fractions');
 for(const [i,lines]of [['(−2/9) × (3/7) × (−4/5)','(1/21) × (−2/15) × 4'],['5/8 − 3/4 − 1/2','2/3 − 7/12 − 1/4']].entries()){
  if(i)pair.append(el('span','pcm-sum-symbol','+'));const f=el('div','pcm-printed-fraction');
  f.append(el('div','pcm-fraction-numerator',lines[0]),el('div','pcm-fraction-denominator',lines[1]));pair.append(f);
 }
 return pair;
}
function lifeYears(yearsBeforeBirth,yearsAfterDeath){
 const age=(yearsBeforeBirth+yearsAfterDeath)*28/3;
 return {age,segments:[['Детство',age/6],['Следующий этап',age/12],['До брака',age/7],['От свадьбы до рождения сына',yearsBeforeBirth],['Жизнь сына',age/2],['После смерти сына',yearsAfterDeath]]};
}
function fractionRouteFigure(data,top,bottom) {
 const s=svg('svg',{viewBox:'0 0 270 152',role:'img',class:'pm-chart pcm-route-fractions','aria-label':'Три верхних числа, знак '+data.sign+' и три нижних числа. Первый операнд сверху.'});
 const node=(x,y,label,picked)=>{
  s.append(svg('rect',{x:x-26,y:y-15,width:52,height:30,rx:8,stroke:picked?'#914a08':'#527369',fill:picked?'#ffdfa8':'#eef7ef','stroke-width':picked?3:1}));
  txt(s,x,y+5,label,{'font-size':15});
 };
 const arrows=(x1,y1,x2,y2)=>{
  ln(s,x1,y1,x2,y2,{stroke:'#496d60','stroke-width':1.5});
  const angle=Math.atan2(y2-y1,x2-x1),back=Math.PI/7;
  s.append(svg('path',{d:'M'+(x2-6*Math.cos(angle-back))+' '+(y2-6*Math.sin(angle-back))+' L'+x2+' '+y2+' L'+(x2-6*Math.cos(angle+back))+' '+(y2-6*Math.sin(angle+back)),fill:'none',stroke:'#496d60','stroke-width':1.5}));
 };
 for(let i=0;i<3;i++){const x=43+92*i;arrows(x,44,125+10*i,60);arrows(125+10*i,91,x,107);node(x,27,data.upper[i],i===top);node(x,126,data.lower[i],i===bottom);}
 node(135,76,data.sign,true);return s;
}
function fractionRouteResult(t,i,j){return root.PetersonMath.operation(cycleKeys[t.sign],t.upper[i],t.lower[j]);}
function mixedTermText(n,d){const whole=Math.floor(n/d),rest=n%d;return rest?whole+' и '+root.PetersonMath.answer(root.PetersonMath.operation('divide',rest,d)):String(whole);}
function schoolChain(data,fresh){
 const m=root.PetersonMath,first=m.operation('multiply',data.vals[0],fresh?2:1),values=[first];
 for(const [i,op]of data.ops.entries())values.push(m.operation(cycleKeys[op],values.at(-1),data.vals[i+1]));
 return values;
}
function cycleValues(t,start){
 const M=root.PetersonMath,values=[M.parse(start)];
 for(const [sign,v]of t.ops)values.push(M.operation(cycleKeys[sign],values.at(-1),v));
 return values;
}
function cycleDiagram(t,start,shown){
 const M=root.PetersonMath,s=svg('svg',{viewBox:'0 0 400 176',role:'img','aria-label':(t.side?'Правая':'Левая')+' цепочка со стрелками и шестью действиями',class:'pm-chart'});
 const grid=[[50,39],[193,39],[342,39],[342,138],[193,138],[50,138]],loc=(t.side?[0,5,4,3,2,1]:[0,1,2,3,4,5]).map(i=>grid[i]);
 const vals=cycleValues(t,start);
 for(let i=0;i<6;i++){
  const [x,y]=loc[i],[x2,y2]=loc[(i+1)%6],dx=Math.sign(x2-x),dy=Math.sign(y2-y),u=x+dx*35,v=y+dy*18,u2=x2-dx*35,v2=y2-dy*18;
  ln(s,u,v,u2,v2,{stroke:'#246454','stroke-width':2});const size=6;
  s.append(svg('path',{d:'M'+(u2-dx*size-dy*size)+' '+(v2-dy*size+dx*size)+' L'+u2+' '+v2+' L'+(u2-dx*size+dy*size)+' '+(v2-dy*size-dx*size),fill:'none',stroke:'#246454','stroke-width':2,'data-directed-step':i+1}));
  const [sign,k]=t.ops[i];txt(s,(u+u2)/2+(dy?(x>190?-27:26):0),(v+v2)/2+(dy?0:-7),sign+' '+k,{'font-size':13});
 }
 for(const [i,p]of loc.entries()){
  s.append(svg('rect',{x:p[0]-33,y:p[1]-17,width:66,height:34,rx:5,fill:i===0?'#ffecd5':'#edf7ee',stroke:'#436951','data-position':i}));
  txt(s,p[0],p[1]+5,i<=shown?M.answer(vals[i]):'?',{'font-size':16});
 }
 return s;
}
function componentValues(t,fresh){
 const M=root.PetersonMath,op=M.operation;
 const k=M.parse(t.known),r=op('multiply',t.result,fresh?2:1);
 const operations={
  unknownAdd:()=>op('subtract',r,k),unknownMinuend:()=>op('add',r,k),unknownSubtrahend:()=>op('subtract',k,r),
  unknownFactor:()=>op('divide',r,k),unknownDividend:()=>op('multiply',r,k),unknownDivisor:()=>op('divide',k,r),
 };
 const solved=operations[t.rule]();
 const labels={unknownAdd:'x + '+M.answer(k),unknownMinuend:'x − ('+M.answer(k)+')',unknownSubtrahend:M.answer(k)+' − x',unknownFactor:'('+M.answer(k)+') × x',unknownDividend:'x : ('+M.answer(k)+')',unknownDivisor:M.answer(k)+' : x'};
 return {result:r,solved,expr:labels[t.rule]+' = '+M.answer(r)};
}
function situationConfig(tag){
 if(tag==='milk'||tag==='honey')return {title:'Перелить из одной ёмкости в другую',controls:[c('Условие',[[0,'Исходное'],[1,'Другое переливание']]),c('Состояние',[[0,'До переливания'],[1,'После переливания']]),c('Что показать?',[[0,'Сначала составлю уравнение'],[1,'Оба объёма'],[2,'Проверка отношения']])],initial:[0,0,0]};
 if(tag==='grains')return {title:'Два запаса по дням',controls:[c('Начальные запасы',[[0,'150 и 120 кг'],[1,'160 и 120 кг']]),c('Дней прошло',range(0,21)),c('Сравнение',[[0,'Сначала предположу'],[1,'Остатки']])],initial:[0,0,0]};
 if(tag==='workers')return {title:'Изготовлено и осталось',controls:[c('Условие',[[0,'10 дней'],[1,'6 дней']]),c('Показать',[[0,'Известная производительность'],[1,'Сделано'],[2,'Остатки и заказ']])],initial:[0,0]};
 if(tag==='languages')return {title:'Три непересекающиеся группы',controls:[c('Учат немецкий',[30,45,60]),c('Схема',[[0,'Сначала решу'],[1,'Из четырнадцати долей'],[2,'Число учеников']])],initial:[45,0]};
 return {title:'Три часа пути',controls:[c('Прибавка во второй час, км',[6,12,18]),c('Этап',[[0,'Сначала составлю уравнение'],[1,'Сколько в первый час'],[2,'Три участка и весь путь']])],initial:[12,0]};
}
const finiteSourceCases={
 quadratic107:{candidates:[1,2,3,4,5],why:'При каждом переходе от x к x + 1 левая часть увеличивается на 10x − 2. Для натурального x это положительно, поэтому найденное решение единственно.'},
 threeFactors107:{candidates:[4,5,6],why:'При x ≤ 3 или x ≥ 7 один из двух последних множителей неположителен, а другой положителен. Положительная правая часть оставляет только x = 4, 5, 6.'},
 sevenTimes:{candidates:[1,2,3,4],why:'При x ≥ 5 множитель 9 − 2x отрицателен. Требуется положительное произведение.'},
 fourMinus:{candidates:[1,2,3],why:'Начиная с x = 4 множитель 4 − x неположителен. Положительное значение невозможно.'},
 plusEight:{why:'Для положительных x множители x и x + 8 растут. Найденное натуральное решение единственно.'},
 threeSquare:{why:'Перенеси 15 вправо и вынеси x за скобки. В уравнении x(3x − 14) = N натуральное x должно делить N.'},
};
function linearBalanceValues(item,fresh){
 const M=root.PetersonMath,add=(x,y)=>M.operation('add',x,y),sub=(x,y)=>M.operation('subtract',x,y);
 const [a,b,c,d]=item.coefficients.map(M.parse),k=sub(a,c),identity=!k.n&&M.equal(b,d);
 // Move the unknown in both original expressions, or change one constant of an identity.
 const left=fresh&&k.n?sub(b,a):b,right=fresh?(identity?add(d,1):!k.n?b:sub(d,c)):d,target=sub(right,left);
 return {a,c,left,right,k,target,identity,constantComparison:!k.n,root:k.n?M.operation('divide',target,k):null};
}
function linearBalanceCandidates(item){
 const M=root.PetersonMath,values=new Set(['-2','0','1','2']);
 for(const fresh of [false,true]){
  const q=linearBalanceValues(item,fresh).root;
  if(q)for(const off of [-1,0,1])values.add(M.answer(M.operation('add',q,off)));
 }
 return [...values].sort((u,v)=>{const a=M.parse(u),b=M.parse(v);return a.n/a.d-b.n/b.d;});
}
function writeLinearTerm(a,b,letter){
 const M=root.PetersonMath;
 const term=a.n===0?'':M.equal(a,1)?letter:M.equal(a,-1)?'−'+letter:'('+M.answer(a)+')'+letter;
 if(!term)return M.answer(b);
 if(!b.n)return term;
 return term+(b.n<0?' − ':' + ')+M.answer(M.parse({n:Math.abs(b.n),d:b.d}));
}
function reviewOperationChain(which,fresh){
 const M=root.PetersonMath,op=M.operation;
 if(which===1){
  const diff=op('subtract','17/5','1.141'),quo=op('divide',diff,'.45'),prod=op('multiply',quo,'14.5'),sum=op('add',fresh?'28.21':'27.21',prod);
  return {expr:(fresh?'28,21':'27,21')+' + (3⅖ − 1,141) : 0,45 × 14,5',steps:[['Разность в скобках',diff],['После деления',quo],['После умножения',prod],['Итог',sum]]};
 }
 const diff=op('subtract','31/7','23/14'),quo=op('divide','7.8',diff),sum=op('add',quo,'.312'),lhs=op('divide',sum,'.02'),rhs=op('multiply',fresh?'3.88':'3.89',40),final=op('subtract',lhs,rhs);
 return {expr:'[7,8 : (4 3/7 − 1 9/14) + 0,312] : 0,02 − '+(fresh?'3,88':'3,89')+' × 40',steps:[['Разность смешанных чисел',diff],['После первого деления',quo],['В квадратных скобках',sum],['Левая часть итоговой разности',lhs],['Правая часть',rhs],['Итог',final]]};
}
const unitMapData={
 scale:[[18.6,744,4000000],[12,600,5000000]],
 map:[[14.9,1490,10000000],[22,880,4000000]],
 land:[[13.7,1096,8000000],[17.5,700,4000000]],
};
const cutPatterns={
 pentomino:{w:4,h:4,outside:new Set(['3,3']),dots:new Set(),plans:[['1133','1133','1223','2220'],['1112','1122','3322','3330'],['2133','1133','1123','2220']]},
 dotTrios:{w:6,h:4,outside:new Set(),dots:new Set(['1,0','1,1','3,1','4,1','5,1','5,2','1,3','3,3']),plans:[['777811','668821','564223','554433'],['778811','766821','564223','554433'],['111222','333444','555666','777888']]},
};
function cellPieces(plan){
 const parts=[];
 plan.forEach((row,y)=>[...row].forEach((val,x)=>{if(val!=='0')(parts[Number(val)-1]??=[]).push([x,y]);}));return parts;
}
function shapeSignature(cells){
 function normalized(items){const minX=Math.min(...items.map(p=>p[0])),minY=Math.min(...items.map(p=>p[1]));return items.map(([x,y])=>(x-minX)+','+(y-minY)).sort().join('|');}
 let pts=cells;const keys=[];
 for(let turn=0;turn<4;turn++){keys.push(normalized(pts),normalized(pts.map(([x,y])=>[-x,y])));pts=pts.map(([x,y])=>[-y,x]);}
 return keys.sort()[0];
}
function connectedCells(cells){
 const known=new Set([cells[0].join(',')]);let length;
 do{length=known.size;for(const [x,y]of cells){if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(p=>known.has(p.join(','))))known.add(x+','+y);}}while(known.size!==length);
 return known.size===cells.length;
}
function cutGridFigure(design,plan,selected){
 const d=cutPatterns[design],unit=44,w=unit*d.w+16,h=unit*d.h+16;
 const s=svg('svg',{viewBox:'0 0 '+w+' '+h,role:'img','aria-label':'Фигура '+(design==='pentomino'?'А':'Б')+(plan?' с вариантом разрезов':' без разрезов'),class:'pm-chart'});
 const colors=['#def3ed','#fff1d4','#e3e5fa','#d6ebfb','#ffe2d2','#ead8ef','#dceaca','#e6e1d6'];
 for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){
  if(d.outside.has(x+','+y))continue;
  const group=plan?Number(plan[y][x]):0,X=8+x*unit,Y=8+y*unit,isDot=d.dots.has(x+','+y);
  s.append(svg('rect',{x:X,y:Y,width:unit,height:unit,fill:group?(!selected||selected===group?colors[group-1]:'#fff'):'#fff',stroke:'#507165','stroke-width':1,'data-cell':x+','+y,'data-group':group,'data-dot':Number(isDot)}));
  const sides=[[-1,0,X,Y,X,Y+unit],[1,0,X+unit,Y,X+unit,Y+unit],[0,-1,X,Y,X+unit,Y],[0,1,X,Y+unit,X+unit,Y+unit]];
  for(const [dx,dy,x1,y1,x2,y2] of sides){const nx=x+dx,ny=y+dy,outer=nx<0||nx>=d.w||ny<0||ny>=d.h||d.outside.has(nx+','+ny);if(outer||plan&&Number(plan[ny][nx])!==group)ln(s,x1,y1,x2,y2,{stroke:'#215344','stroke-width':3});}
  if(isDot)s.append(svg('circle',{cx:X+unit/2,cy:Y+unit/2,r:7,fill:'#fff',stroke:'#1b302b','stroke-width':2.5}));
  if(group)txt(s,X+5,Y+12,String(group),{'font-size':10,'text-anchor':'start'});
 }return s;
}
function sectionTriangle(variant,part){
 const A=[40,228],C=[365,228],B=variant?[128,40]:[270,48],t=[1/3,1/2,2/3][part],at=(x,y)=>x.map((v,i)=>v+(y[i]-v)*t),M=at(A,B),N=at(C,B);
 const s=svg('svg',{viewBox:'0 0 410 260',role:'img','aria-label':'Треугольник ABC с сечением MN параллельно AC',class:'pm-chart'});
 for(const [label,x,y]of [['AB',A,B],['BC',B,C],['AC',A,C],['MN',M,N]])s.append(svg('line',{x1:x[0],y1:x[1],x2:y[0],y2:y[1],stroke:label==='MN'?'#a85a20':'#205b46','stroke-width':label==='MN'?4:3,'data-segment':label}));
 for(const [name,pt,dx,dy]of [['A',A,-7,20],['B',B,0,-8],['C',C,8,20],['M',M,-15,-2],['N',N,15,-2]]){
  s.append(svg('circle',{cx:pt[0],cy:pt[1],r:3,fill:'#205b46','data-triangle-point':name}));txt(s,pt[0]+dx,pt[1]+dy,name,{'font-size':17});
 }
 const dist=(l,r)=>Math.hypot(l[0]-r[0],l[1]-r[1])/20;
 return {svg:s,AM:dist(A,M),MB:dist(M,B),BN:dist(B,N),NC:dist(N,C)};
}
function scoreFigure(rows){
 return table(['Строка','Буква','Баллы'],rows.map(([l,...marks],i)=>[i+1,l,marks.join(' · ')]));
}
const operationSigns=['+','−','×','÷'];
const operationKeys=['add','subtract','multiply','divide'];
function wholeFromExtraValues(t,variant){
 const M=root.PetersonMath,[f,g,extraA,extraB]=t.values.map(M.parse),m=variant?2:1;
 const a=M.operation('multiply',extraA,m),b=M.operation('multiply',extraB,m),rest=M.operation('subtract',1,M.operation('add',f,g));
 const all=M.operation('divide',M.operation('add',a,b),rest);
 return {a,b,rest,total:all,first:M.operation('add',M.operation('multiply',all,f),a),second:M.operation('add',M.operation('multiply',all,g),b)};
}
const validationQuartets=[
 {label:'Равные отношения',values:[3,2,15,10]},
 {label:'Разные отношения',values:[3,2,16,10]},
 {label:'Отношение равно 1',values:[2,2,5,5]},
 {label:'Отношение равно −1',values:[-2,2,-5,5]},
 {label:'Нулевые числители',values:[0,2,0,5]},
 {label:'Один нулевой знаменатель',values:[3,0,6,8]},
];
function transformedFractions(tag,[a,b,c,d]){
 switch(tag){
  case 1:return [[[a+b,b],[c+d,d]]];
  case 2:return [[[a-b,b],[c-d,d]]];
  case 3:return [[[b-a,b],[d-c,d]]];
  case 4:return [[[a,a+b],[c,c+d]]];
  case 5:return [[[a,a-b],[c,c-d]]];
  case 6:return [[[a,b-a],[c,d-c]]];
  case 7:return [[[a+b,a-b],[c+d,c-d]],[[a+b,c+d],[a-b,c-d]]];
 }
 throw new Error('Неизвестное преобразование пропорции');
}
function inspectFractionPair(parts){
 const [[a,b],[c,d]]=parts;
 if(!b||!d)return 'Есть нулевой знаменатель';
 const truth=a*d===b*c;
 return (truth?'Равенство верно':'Равенство ложно')+(!a||!c?' (нулевой член)':'');
}
function rayInterceptFigure(angle,k,which){
 const s=svg('svg',{viewBox:'0 0 490 285',role:'img','aria-label':'Два луча и три параллельные секущие. Угол '+angle+'°, коэффициент длин '+k,class:'pm-chart'});
 const origin=[42,237],theta=angle*Math.PI/180,dist=[1.2,3.2,4.7],scale=Math.min(390/(dist[2]*Math.max(1,k*Math.cos(theta))),187/(dist[2]*k*Math.sin(theta)));
 function spot(t,top){const d=scale*t*(top?k:1);return top?[origin[0]+d*Math.cos(theta),origin[1]-d*Math.sin(theta)]:[origin[0]+d,origin[1]];}
 for(const top of [false,true]){const end=spot(5.1,top);ln(s,...origin,...end);}
 txt(s,origin[0]-13,origin[1]+7,'A');
 for(const [i,t]of dist.entries()){
  const p=spot(t,true),q=spot(t,false),o=svg('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:'#9b5720','stroke-width':3,'data-transversal':i+1});s.append(o);
  for(const [pos,label]of [[p,'B'],[q,'C']]){s.append(svg('circle',{cx:pos[0],cy:pos[1],r:3,fill:'#205b46'}));txt(s,pos[0]+(label==='B'?1:0),pos[1]+(label==='B'?-9:24),label+['₁','₂','₃'][i],{'font-size':16});}
 }
 const selected=which===2?[0,2]:[which%2,which%2+1];
 for(const top of [true,false]){const a=spot(dist[selected[0]],top),b=spot(dist[selected[1]],top);s.append(svg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#167958','stroke-width':5,'data-measured-branch':top?'B':'C'}));}
 return s;
}
function thalesRows(rows){return table(['Буква','Левая пара','Правая пара'],rows.map(([l,a,b,c,d])=>[l,a+' : '+b,c+' : '+d]));}
function sourceTerms(item,fresh){
 const M=root.PetersonMath;
 if(item.symbolic)return {names:item.terms,values:[fresh?4:2,fresh?7:3,fresh?12:6,fresh?21:9].map(v=>M.parse(v))};
 const values=item.terms.map((v,i)=>fresh&&i<2?M.operation('multiply',v,3):M.parse(v));
 return {names:values.map(M.answer),values};
}
function orderRatio(names,order){const wrap=v=>v.includes('/')?'('+v+')':v;const [a,b,c,d]=order.map(i=>wrap(names[i]));return a+' : '+b+' = '+c+' : '+d;}
function preservesProducts(order){
 const set=[order[0],order[3]].sort().join('');
 return set==='03'||set==='12';
}
function storyRateRows(task,fresh){
 const M=root.PetersonMath,rate=M.operation('multiply',task.rate,fresh?2:1),use=task.inputs.map(v=>fresh?v+v/2:v);
 return {rate,amounts:use,outputs:use.map(v=>M.operation('multiply',v,rate))};
}
const quantifiedReadings = {
 inverseTotal:'Для каждого рационального a существует обратное и их произведение равно 1.',
 nonzeroProduct:'Произведение любых двух рациональных чисел отлично от нуля.',
 existsOpposite:'Найдётся рациональное число, меньшее своего противоположного.',
 existsSquare:'Найдётся рациональное число, для которого −a² больше (−a)².',
};
function evaluateClaim(rule,a,b){
 switch(rule){
  case 'inverseTotal':return a===0?'У нуля нет обратного: для этой подстановки запись не определена.':'Обратное существует. Произведение равно 1.';
  case 'nonzeroProduct':return a+' × '+b+' = '+(a*b)+'. '+(a*b===0?'Это контрпример.':'На этой паре произведение отлично от нуля.');
  case 'existsOpposite':return -a+' > '+a+(a<0?' — верно. Это свидетель существования.':' — неверно. Один неудачный выбор не опровергает существования.');
  case 'existsSquare':return -(a*a)+' > '+a*a+' — неверно. Слева число не больше нуля, справа — не меньше нуля.';
 }
 throw new Error('Неизвестное высказывание');
}
const storyBalances={
 oneHalf:[
  {equation:'1,5a − 3 = a + 7,5',stages:['0,5a − 3 = 7,5','0,5a = 10,5','a = 21'],calc:x=>[1.5*x-3,x+7.5]},
  {equation:'1,5a − 3 = a + 4,5',stages:['0,5a − 3 = 4,5','0,5a = 7,5','a = 15'],calc:x=>[1.5*x-3,x+4.5]}],
 threeTimes:[
  {equation:'1,8b = 3(b − 0,12)',stages:['1,8b = 3b − 0,36','1,2b = 0,36','b = 3/10'],calc:x=>[45*x/25,(75*x-9)/25]},
  {equation:'1,8b = 3(b − 0,24)',stages:['1,8b = 3b − 0,72','1,2b = 0,72','b = 3/5'],calc:x=>[45*x/25,(75*x-18)/25]}],
 halfAfterFive:[
  {equation:'(5x − 3)/2 = x − 0,3',stages:['5x − 3 = 2x − 0,6','3x = 2,4','x = 4/5'],calc:x=>[(25*x-15)/5,(10*x-3)/5]},
  {equation:'(5x − 4)/2 = x − 0,2',stages:['5x − 4 = 2x − 0,4','3x = 3,6','x = 6/5'],calc:x=>[(25*x-20)/5,(10*x-2)/5]}],
 tripleFromTen:[
  {equation:'2(10 − 3x) + 2 = 5x',stages:['22 − 6x = 5x','22 = 11x','x = 2'],calc:x=>[2*(10-3*x)+2,5*x]},
  {equation:'2(15 − 3x) + 3 = 5x',stages:['33 − 6x = 5x','33 = 11x','x = 3'],calc:x=>[2*(15-3*x)+3,5*x]}],
 subtractDouble:[
  {equation:'2(x − 4) + 9 = x − 2',stages:['2x + 1 = x − 2','x + 1 = −2','x = −3'],calc:x=>[2*(x-4)+9,x-2]},
  {equation:'2(x − 5) + 7 = x − 1',stages:['2x − 3 = x − 1','x − 3 = −1','x = 2'],calc:x=>[2*(x-5)+7,x-1]}],
 gainRatio:[
  {equation:'(x + 3)/(3x) = 11/15',stages:['x ≠ 0, 15(x + 3) = 33x','45 = 18x','x = 5/2'],calc:x=>x===0?null:[15*(x+3),33*x]},
  {equation:'(x + 4)/(3x) = 2/3',stages:['x ≠ 0, 3(x + 4) = 6x','12 = 3x','x = 4'],calc:x=>x===0?null:[3*(x+4),6*x]}],
 tripleFive:[
  {equation:'3(5x − 8) = 3x',stages:['15x − 24 = 3x','12x = 24','x = 2'],calc:x=>[3*(5*x-8),3*x]},
  {equation:'3(5x − 12) = 3x',stages:['15x − 36 = 3x','12x = 36','x = 3'],calc:x=>[3*(5*x-12),3*x]}],
};
const balanceCandidates=['-3','0','2','5/2','3','4','5'];
function balanceInputs(task){
 const extra={halfAfterFive:['4/5','6/5'],oneHalf:['21','15'],threeTimes:['3/10','3/5']}[task.storyBalance.rule];
 return extra?balanceCandidates.concat(extra):balanceCandidates;
}
const trialRules={
 quadratic107:x=>5*x*x-7*x-24,threeFactors107:x=>4*x*(x-3)*(7-x),
 sevenTimes:x=>7*x*(9-2*x),fourMinus:x=>x*(2*x-1)*(4-x)*(x+1),plusEight:x=>x*(x+8),threeSquare:x=>3*x*x-14*x-15,
 rectGrow:x=>x*(x+12),boundedThree:x=>x*(x-9)*(15-x),
 rectSubtract:x=>x*(x-4),rectPlus3:x=>x*x+3*x,
};
const extraTrials={quadratic107:28,threeFactors107:48,sevenTimes:63,fourMinus:36,plusEight:48,threeSquare:-10,rectGrow:85,boundedThree:88,rectSubtract:117,rectPlus3:54};
const endFamilyCandidates=['-9','-5','-3','-1','0','19/16','9/2','9'];
function finalFamilyPair(rule,x){
 switch(rule){
  case 'linear48':return [6*(4*x-7)-3*(5-8*x),0];
  case 'identity4':return [2*(9-5*x)+7*(2*x-4),4*(x-2.5)];
  case 'squareEmpty':return [x*x,-4];
  case 'square81':return [x*x,81];
  case 'absZero':return [Math.abs(2*x-9),0];
  case 'absDist':return [Math.abs(x+3),2];
 }
 throw new Error('Неизвестное множество корней');
}
function yearlyCapital(initial,cost){
 const M=root.PetersonMath,rows=[];
 let cap=M.parse(initial);
 for(let i=0;i<3;i++){
  const afterSpend=M.operation('subtract',cap,cost),added=M.operation('divide',afterSpend,3),next=M.operation('add',afterSpend,added);
  rows.push([String(i+1),M.answer(afterSpend),M.answer(added),M.answer(next)]);cap=next;
 }
 return {rows,final:cap};
}
const proofProperties = {
 squareEven: {evaluate:x=>[(-x)**2,x*x],law:'В произведении (−x)(−x) два отрицательных множителя −1. Их произведение равно 1.'},
 cubeOdd: {evaluate:x=>[(-x)**3,-(x**3)],law:'В произведении трёх противоположных чисел коэффициент (−1)³ равен −1.'},
 distribute: {evaluate:x=>[3*(x-4),x-2*(6-x)],law:'После раскрытия скобок в обеих частях получается 3x − 12.'},
 modulusEven: {evaluate:x=>[Math.abs(x),Math.abs(-x)],law:'Точки x и −x равноудалены от нуля, в том числе когда обе совпадают с нулём.'},
 unequalLinear: {evaluate:x=>[x+4,x-3],law:'После вычитания x остаётся 4 = −3. Это равенство ложно для любого x.'},
 positiveSquare: {evaluate:x=>[x*x+1,0],law:'При любом x квадрат x² ≥ 0. Значит, x² + 1 ≥ 1 и нулю равняться не может.'},
 negativeModulus: {evaluate:x=>[Math.abs(2*x-3),-1],law:'Абсолютная величина всегда неотрицательна. Значение −1 ей недоступно.'},
};
const familyCandidates = ['-6','-5','-1','-4/5','0','4/5','1','2','3','5','6'];
function familyPair(rule,q){
 const M=root.PetersonMath;
 const add=(v,w)=>M.operation('add',v,w),mul=(v,w)=>M.operation('multiply',v,w);
 const absolute=v=>M.parse(Math.abs(v.n)+'/'+v.d);
 switch(rule){
  case 'nineConstant':return [add(add(mul(2,q),mul(3,add(q,-2))),mul(-5,add(q,-3))),M.parse(0)];
  case 'square25':return [mul(q,q),M.parse(25)];
  case 'squareNeg36':return [mul(q,q),M.parse(-36)];
  case 'linearAbsZero':return [absolute(add(mul(5,q),4)),M.parse(0)];
  case 'shiftAbs':return [absolute(add(q,-2)),M.parse(1)];
 }
 throw new Error('Неизвестное семейство уравнений');
}
const domainNames=['Рациональные','Целые','Натуральные (от 1)','Положительные','Неотрицательные'];
function passesDomain(value,domain){
 const q=root.PetersonMath.parse(value);
 return [true,q.d===1,q.d===1&&q.n>0,q.n>0,q.n>=0][domain];
}
const reciprocalSteps=[
 ['3','1/3',1/3],['0,01','100',100],['10','0,1',0.1],
 ['2','0,5',0.5],['5','0,2',0.2],['4','0,25',0.25]
];
function reciprocalOperations(){return table(['Шаг','Верхняя строка','Нижняя строка'],reciprocalSteps.map(([d,m],i)=>[i+1,'÷ '+d,'× '+m]));}
function unaryValue(rule,x){
 switch(rule){
  case 'reciprocal':return x===0?null:root.PetersonMath.operation('divide',1,x);
  case 'opposite':return -x;
  case 'negativeReciprocal':case 'reciprocalOpposite':return x===0?null:root.PetersonMath.operation('divide',-1,x);
  case 'absoluteOpposite':return Math.abs(-x);
  case 'negativeAbsolute':return -Math.abs(x);
  case 'squaredOpposite':return (-x)**2;
  case 'oppositeSquare':return -(x**2);
 }
 throw new Error('Неизвестная последовательность действий');
}
const rootProbeValues=['-5','-4','-3','-2','-1','-1/2','0','1/2','1','2','3','4','5','6','7'];
function evaluateRootProbe(rule,q){
 const M=root.PetersonMath,mul=(a,b)=>M.operation('multiply',a,b),inc=(a,b)=>M.operation('add',a,b),neg=x=>M.operation('subtract',0,x),s=mul(q,q);
 if(rule==='absSign')return [M.parse(Math.abs(q.n)+'/'+q.d),neg(q)];
 if(rule==='selfSquare')return [s,mul(2,q)];
 if(rule==='triple')return [mul(mul(q,inc(q,-1)),inc(q,1)),M.parse(0)];
 if(rule==='quadratic')return [inc(inc(mul(2,s),mul(5,q)),2),M.parse(0)];
 throw new Error('Неизвестная подстановка');
}
function evaluateRootCount(rule,x){
 switch(rule){
  case 'abs':return Math.abs(x);
  case 'square':return x*x;
  case 'fractionX':return x===0?null:x*(x-5)/x;
  case 'fractionY':return x===0?null:2*(x+3)*(x-6)/x;
  case 'fiveFactors':return -4*x*(x-1)*(x+2)*(x-3)*(x+4);
 }
 throw new Error('Неизвестное уравнение');
}
function fixedAreaGraph(area,a,reveal){
 const fig=svg('svg',{viewBox:'0 0 230 155',class:'pm-chart pcm-group-rule',role:'img','aria-label':'Участок графика b = S/a для положительных сторон прямоугольника.'}),X=x=>32+14.7*x,Y=y=>127-103*y/area;
 ln(fig,31,15,31,129);ln(fig,31,128,215,128);txt(fig,18,13,'b, см',{'font-size':9});txt(fig,207,150,'a, см',{'font-size':9});
 for(const x of [1,2,4,6,8,10,12]){ln(fig,X(x),126,X(x),131);txt(fig,X(x),140,x,{'font-size':9});}
 for(const y of [area/4,area/2,3*area/4,area]){ln(fig,31,Y(y),210,Y(y),{stroke:'#d4ded7','stroke-width':.7});txt(fig,26,Y(y)+3,y,{'font-size':9,'text-anchor':'end'});}
 if(reveal){
  let d='';for(let i=0;i<=88;i++){const x=1+i/8;d+=(i?' L ':'M ')+X(x)+' '+Y(area/x);}fig.append(svg('path',{d,fill:'none',stroke:'#287363','stroke-width':2,'data-hyperbola':'true'}));
  for(const x of [1,1.5,2,3,4,8,12])fig.append(svg('circle',{cx:X(x),cy:Y(area/x),r:2.5,fill:'#446254','data-side-a':x,'data-side-b':area/x}));
 }
 fig.append(svg('circle',{cx:X(a),cy:Y(area/a),r:3.6,fill:'#a86126','data-selected-a':a,'data-selected-b':area/a}));return fig;
}
function diameterAngleFigure(radius,degrees,mark){
 const fig=svg('svg',{viewBox:'0 0 224 168',class:'pm-chart pcm-group-rule',role:'img','aria-label':'Треугольник с диаметром AB и третьей вершиной C на окружности.'}),cx=108,cy=79,r=radius*11.5,phi=degrees*Math.PI/180;
 const points={A:[cx-r,cy],B:[cx+r,cy],C:[cx+r*Math.cos(phi),cy-r*Math.sin(phi)],O:[cx,cy]};
 fig.append(svg('circle',{cx,cy,r,fill:'#f7faf2',stroke:'#507765','stroke-width':1.4,'data-radius-cm':radius}));
 for(const pair of ['AB','AC','CB']){
  const [u,v]=pair;ln(fig,...points[u],...points[v],{stroke:pair==='AB'?'#2e6958':'#956037','stroke-width':2,'data-side':pair});
 }
 for(const [name,[x,y]]of Object.entries(points)){
  const [dx,dy]=name==='A'?[-9,2]:name==='B'?[9,2]:name==='O'?[0,12]:[4,degrees<180?-7:12];
  fig.append(svg('circle',{cx:x,cy:y,r:2.2,fill:'#40564b','data-point':name}));txt(fig,x+dx,y+dy,name,{'font-size':11});
 }
 if(mark){const pc=points.C,unit=arr=>{const v=[arr[0]-pc[0],arr[1]-pc[1]],length=Math.hypot(...v);return v.map(n=>n*6/length);},u=unit(points.A),v=unit(points.B);
  const corners=[[pc[0]+u[0],pc[1]+u[1]],[pc[0]+u[0]+v[0],pc[1]+u[1]+v[1]],[pc[0]+v[0],pc[1]+v[1]]];
  fig.append(svg('polyline',{points:corners.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#285c50','stroke-width':1.4,'data-right-angle':'C'}));
 }
 txt(fig,109,155,'Радиус '+radius+' см',{'font-size':11});return fig;
}
function endingCandidate(ending){
 const tail=String(ending).padStart(2,'0'),rest='0123456789'.split('').filter(x=>!tail.includes(x));
 if(rest[0]==='0')[rest[0],rest[1]]=[rest[1],rest[0]];
 return Number(rest.join('')+tail);
}
const distinctEndings=range(0,98).filter(n=>Math.floor(n/10)!==n%10);
function placementTruth(order,swap){
 const name=n=>swap?(n==='А'?'Б':n==='Б'?'А':n):n,sets=[[['А',1],['Б',2]],[['А',2],['Г',3]],[['В',2],['Г',4]]];
 return sets.map(group=>group.map(([className,place])=>({label:name(className)+' — '+place,yes:order[place-1]===name(className)})));
}
function boatStudy(direction,variant,time){
 const [s,fast,slow]=variant===0?[60,7,5]:[75,9,6];
 const speeds=[[fast,-slow],[-fast,slow],[fast,slow],[slow,fast]][direction-1],x=speeds[0]*time,y=s+speeds[1]*time;
 const min=-4*fast-6,max=s+4*fast+6,X=n=>15+(n-min)*188/(max-min),svgRoot=svg('svg',{viewBox:'0 0 220 115',class:'pm-chart pcm-group-rule',role:'img','aria-label':'Места старта и положения двух катеров на одной прямой.'});
 for(const [name,start,pos,velocity,yy,fill]of [['I',0,x,speeds[0],32,'#296f62'],['II',s,y,speeds[1],75,'#925b2d']]){
  const xx=X(pos),right=velocity>0?1:-1,end=xx+8*right;
  ln(svgRoot,X(min),yy,X(max),yy,{stroke:'#d8dfdb','stroke-width':1});ln(svgRoot,X(start),yy-4,X(start),yy+4,{stroke:'#66746e','stroke-width':1.5});
  ln(svgRoot,X(start),yy,xx,yy,{stroke:fill,'stroke-width':2.2});ln(svgRoot,xx,yy,end,yy,{stroke:fill,'stroke-width':2});
  ln(svgRoot,end,yy,end-3*right,yy-3,{stroke:fill,'stroke-width':1.6});ln(svgRoot,end,yy,end-3*right,yy+3,{stroke:fill,'stroke-width':1.6});
  svgRoot.append(svg('circle',{cx:xx,cy:yy,r:3,fill,'data-boat':name,'data-position':pos}));txt(svgRoot,xx,yy-9,name,{'font-size':11});
 }
 txt(svgRoot,108,104,'Засечки обозначают пристани',{'font-size':10.5});
 return {picture:svgRoot,s,fast,slow,speeds,d:y-x};
}
function fallGraph(t,curve){
 const fig=svg('svg',{viewBox:'0 0 235 160',class:'pm-chart pcm-group-rule',role:'img','aria-label':'График расстояния в метрах от времени в секундах: h = 5t².'}),X=x=>32+33*x,Y=h=>132-.82*h;
 ln(fig,32,18,32,132);ln(fig,32,132,213,132);txt(fig,13,15,'h, м',{'font-size':10});txt(fig,210,152,'t, с',{'font-size':10});
 for(const h of [0,25,50,75,100,125]){ln(fig,30,Y(h),200,Y(h),{stroke:'#d6dfd9','stroke-width':.7});txt(fig,24,Y(h)+3,h,{'font-size':9,'text-anchor':'end'});}
 for(let x=0;x<=5;x++){ln(fig,X(x),131,X(x),135,{stroke:'#345e50','stroke-width':1});txt(fig,X(x),146,x,{'font-size':9});}
 if(curve){
  let path='';for(let i=0;i<=60;i++){const x=i/12;path+=(i?' L ':'M ')+X(x)+' '+Y(5*x*x);}fig.append(svg('path',{d:path,stroke:'#327268','stroke-width':2,fill:'none','data-curve':'5t²'}));
 }
 for(let i=0;i<=5;i++)fig.append(svg('circle',{cx:X(i),cy:Y(5*i*i),r:2.3,fill:'#364f47','data-time':i,'data-height':5*i*i}));
 fig.append(svg('circle',{cx:X(t),cy:Y(5*t*t),r:4,fill:'#ab6324','data-preview-time':t,'data-preview-height':5*t*t}));return fig;
}
function copyConstruction(kind,scale){
 const isRhombus=kind==='rhombus',unit=18*scale;
 const template=isRhombus?{A:[-3,0],B:[0,1.635],C:[3,0],D:[0,-1.635],O:[0,0]}:{K:[-3.75,0],L:[-2.25,3],M:[2.25,3],N:[3.75,0],E:[-2.25,0],F:[2.25,0]};
 const points=Object.fromEntries(Object.entries(template).map(([n,[x,y]])=>[n,[112+x*unit,(isRhombus?72:103)-y*unit]]));
 const root=svg('svg',{viewBox:'0 0 224 154',class:'pm-chart pcm-group-rule',role:'img','aria-label':isRhombus?'Ромб ABCD с пересечением диагоналей в точке O.':'Трапеция KLMN с двумя высотами LE и MF.'});
 for(const pair of isRhombus?['AB','BC','CD','DA','AC','BD']:['KL','LM','MN','NK','LE','MF']){
  const [a,b]=pair;ln(root,...points[a],...points[b],{stroke:'#396b5d','stroke-width':1.6,'data-segment':pair,'data-cm':Number((Math.hypot(template[a][0]-template[b][0],template[a][1]-template[b][1])*scale).toFixed(5))});
 }
 for(const [n,[x,y]]of Object.entries(points)){
  const offset=isRhombus?{A:[-9,3],B:[2,-6],C:[9,3],D:[2,12],O:[7,11]}[n]:{K:[-8,11],L:[0,-7],M:[2,-7],N:[8,11],E:[0,12],F:[0,12]}[n];
  txt(root,x+offset[0],y+offset[1],n,{'font-size':11});
 }
 const base=18;ln(root,17,138,17+base,138,{stroke:'#88582e','stroke-width':2});for(const x of [17,17+base])ln(root,x,135,x,141,{stroke:'#88582e','stroke-width':1.3});
 txt(root,43,142,'1 см в масштабе схемы',{'font-size':10,'text-anchor':'start'});return root;
}
function claimExample(key,index){
 const n=[1,4,7][index],[a,b]=[[8,2],[3,3],[2,8]][index],M=root.PetersonMath,frac=(x,y)=>M.answer(M.operation('divide',x,y));
 switch(key){
  case '76-1':return ['a = '+n, n+'/8 = '+frac(n,8)+'; 2/'+n+' = '+frac(2,n)+'.', n===4?'Этот пример подходит. Для слова «каждое» одного совпадения мало.':'Получен контрпример.'];
  case '76-2':return ['n = '+n,n+'² − 16 = '+(n*n-16)+'.',n===4?'Свидетель найден: для существования этого достаточно.':'Эта подстановка не подходит; это ещё не опровергает существование.'];
  case '76-3':{const v=[0,.5,3][index];return ['b = '+num(v),'b² + 9 = '+num(v*v+9)+'.','Общий довод: квадрат неотрицателен, значит сумма не меньше девяти.'];}
  case '76-4':{const c=['0','1/2','3'][index];return ['c = '+c,'c/5 = '+frac(c,5)+'; c/6 = '+frac(c,6)+'.',index===0?'На границе 0/1 обе стороны равны. Строгое неравенство здесь ложно.':'У положительной дроби c разность c/30 положительна.'];}
  case '77-1':return ['Сравни '+a+' и '+b,frac(a,b)+' × '+b+' = '+a+'.','Частное показывает множитель перехода к первому числу. Для обратного направления нужен обратный множитель.'];
  case '77-2':return ['Возьми '+a+' и '+b,frac(a,b)+' и '+frac(b,a)+'.',a===b?'Отношение и обратное равны 1. Этого примера достаточно.':'Для этой пары отношения различны. Это не исключает другую пару.'];
  case '77-3':{const s=['1/50','1','4'][index];return ['Масштаб '+s,'Отрезок длиной 50 мм на изображении имеет '+M.answer(M.operation('multiply',50,s))+' мм.',index===0?'Уменьшение соответствует данному примеру.':'Это контрпример к слову «всегда меньше».'];}
  case '77-4':{const [a,b,c,d]=[[2,3,8,12],[3,5,9,15],[4,7,12,21]][index];return [a+'/'+b+' = '+c+'/'+d,a+' × '+d+' = '+b+' × '+c+' = '+a*d+'.','Общее доказательство получается умножением обеих частей a/b = c/d на bd.'];}
  case '77-5':{const [n,d]=[[2,3],[3,3],[5,3]][index];return ['Дробь '+n+'/'+d,'Её значение '+frac(n,d)+'.',n<d?'Числитель меньше знаменателя, значение меньше единицы.':n===d?'Значение 1, но такая дробь не является правильной.':'Значение больше 1, и дробь неправильная.'];}
  case '77-6':return ['Натуральное n = '+n,n+' = '+n+'/1.','При любом натуральном n деление на единицу даёт то же число.'];
 }
 throw new Error('Неизвестное сравнение.');
}
function pentagonShape(){
 const b=[-.375,Math.sqrt(1.5**2-.375**2)],d=[3.55,Math.sqrt(2**2-1.05**2)],dx=d[0]-b[0],dy=d[1]-b[1],distance=Math.hypot(dx,dy);
 const along=(9-4+distance**2)/(2*distance),height=Math.sqrt(9-along**2);
 const c=[b[0]+(along*dx-height*dy)/distance,b[1]+(along*dy+height*dx)/distance];
 return [[0,0],b,c,d,[2.5,0]];
}
function pairedPentagons(factor,reveal){
 const host=el('div','pcm-pentagon-pair'),base=pentagonShape(),lengths=[1.5,3,2,2,2.5];
 for(const copy of [false,true]){
  const k=copy?factor:1,unit=18*k,points=base.map(([x,y])=>[40+x*unit,113-y*unit]);
  const fig=svg('svg',{viewBox:'0 0 205 154',role:'img',class:'pm-chart pcm-group-rule','aria-label':copy?'Увеличенная копия пятиугольника A₁B₁C₁D₁E₁.':'Исходный пятиугольник ABCDE.'});
  const names=['A','B','C','D','E'],labelOffsets=[[-7,12],[-6,-7],[0,-9],[8,-4],[2,12]];
  for(let i=0;i<5;i++){
   const j=(i+1)%5,[x,y]=points[i],[xx,yy]=points[j],dx=xx-x,dy=yy-y,length=Math.hypot(dx,dy);
   ln(fig,x,y,xx,yy,{stroke:copy?'#91674a':'#416e65','stroke-width':2,'data-side':names[i]+names[j],'data-length':lengths[i]*k});
   const known=reveal||i===4||(copy?i===1||i===2:i===0||i===3);
   txt(fig,(x+xx)/2+dy/length*10,(y+yy)/2-dx/length*10+3,known?num(lengths[i]*k):'?',{'font-size':10.5,'font-weight':600,'data-given':known?'yes':'no'});
   txt(fig,x+labelOffsets[i][0],y+labelOffsets[i][1],names[i]+(copy?'₁':''),{'font-size':10.5});
  }
  txt(fig,100,146,copy?'Копия · см':'Оригинал · см',{'font-size':12});host.append(fig);
 }
 return host;
}
function chordExperiment(index,showLengths){
 const row=[
  {r:5,q:3,c:0,label:['8','2','4','4']},
  {r:5,q:4,c:0,label:['9','1','3','3']},
  {r:13,q:5,c:.7,label:['18','8','16','9']}
 ][index],{r,q,c}=row,s=Math.sqrt(1-c*c),cx=108,cy=70,k=49/r;
 const power=r*r-q*q,t=Math.sqrt(q*q*c*c+power),back=t+q*c,forward=t-q*c;
 const positions={A:[-r,0],B:[r,0],C:[q-back*c,-back*s],D:[q+forward*c,forward*s],O:[q,0]};
 const xy=Object.fromEntries(Object.entries(positions).map(([letter,[x,y]])=>[letter,[cx+x*k,cy-y*k]]));
 const pic=svg('svg',{viewBox:'0 0 220 147',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Хорды AB и CD пересекаются в точке O внутри окружности.'});
 pic.append(svg('circle',{cx,cy,r:r*k,fill:'#f9fbf5',stroke:'#506e62','stroke-width':1.4,'data-circle':'chords'}));
 for(const [u,v,color]of [['A','B','#27665f'],['C','D','#92572b']])ln(pic,...xy[u],...xy[v],{stroke:color,'stroke-width':2,'data-chord':u+v});
 for(const [letter,[x,y]]of Object.entries(xy)){
  pic.append(svg('circle',{cx:x,cy:y,r:2.5,fill:'#253b34','data-point':letter}));
  const [ox,oy]={A:[-9,4],B:[10,4],C:[-6,12],D:[4,-7],O:[-7,-6]}[letter];txt(pic,x+ox,y+oy,letter,{'font-size':11});
 }
 if(showLengths)txt(pic,110,136,'AO = '+row.label[0]+'; OB = '+row.label[1]+'; CO = '+row.label[2]+'; OD = '+row.label[3],{'font-size':10.7});
 return {picture:pic,lengths:row.label,power};
}
function alloyBars(share){
 const fig=svg('svg',{viewBox:'0 0 215 93',class:'pm-chart pcm-group-rule',role:'img','aria-label':'Две одинаковые доли золота и пять таких же долей серебра.'});
 for(const [amount,y,name,fill]of [[2,25,'Золото','#cfab57'],[5,66,'Серебро','#aebfce']]){
  txt(fig,12,y-7,name,{'font-size':11,'text-anchor':'start'});
  for(let i=0;i<amount;i++)fig.append(svg('rect',{x:12+i*34,y,width:30,height:14,fill,stroke:'#677064','data-alloy':name,'data-unit':share}));
 }
 return fig;
}
function circleDiameterFigure(){
 const fig=svg('svg',{viewBox:'0 0 220 113',class:'pm-chart pcm-group-rule',role:'img','aria-label':'Синяя линия проходит через центр между двумя точками окружности.'});
 fig.append(svg('circle',{cx:106,cy:52,r:38,fill:'none',stroke:'#9d6138','stroke-width':3}));
 ln(fig,68,52,144,52,{stroke:'#32655b','stroke-width':2,'data-diameter':'true'});fig.append(svg('circle',{cx:106,cy:52,r:2.5,fill:'#32655b'}));
 txt(fig,105,106,'Диаметр проходит через центр',{'font-size':11.5});return fig;
}
function affineRatioCandidates(task){
 const M=root.PetersonMath,data=task.affineRatios,values=new Set(['0']);
 for(const offset of [-1,0,1,2])values.add(M.answer(M.operation('add',data.root,offset)));
 for(const slot of [1,3]){
  const term=data.terms[slot];
  if(Array.isArray(term)){
   const forbidden=M.operation('divide',M.operation('subtract',0,term[1]),term[0]);
   values.add(M.answer(forbidden));values.add(M.answer(M.operation('add',forbidden,1)));
  }
 }
 return [...values].sort((a,b)=>{const x=M.parse(a),y=M.parse(b);return x.n/x.d-y.n/y.d;});
}
function copiedSegment(original){
 const copy=original*.6,view=svg('svg',{viewBox:'0 0 225 104',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Отрезки оригинала и копии в одном масштабе.'});
 const left=17,unit=183/original;
 for(const [y,value,label]of [[30,original,'Оригинал'],[80,copy,'Копия']]){
  txt(view,left,y-10,label+' · '+num(value)+' см',{'font-size':13,'text-anchor':'start'});
  ln(view,left,y,left+value*unit,y,{stroke:'#287061','stroke-width':3,'data-length':value});
  for(const x of [left,left+value*unit])ln(view,x,y-4,x,y+4,{stroke:'#287061','stroke-width':2});
 }
 return view;
}
function codedRatioTable(rows){
 const printed=v=>String(v).replace(/^\./,'0.').replace('.',',');
 return table(['Буква','Левое отношение','Правое отношение'],rows.map(([letter,a,b,c,d])=>[letter,printed(a)+' : '+printed(b),printed(c)+' : '+printed(d)]));
}
function chordDiagram(){
 const fig=svg('svg',{viewBox:'0 0 220 110',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Хорда AB соединяет две точки окружности, не проходя через центр O.'});
 fig.append(svg('circle',{cx:108,cy:55,r:43,fill:'#f3f7ec',stroke:'#386c59','stroke-width':1.7}));
 ln(fig,73.6,29.2,142.4,29.2,{stroke:'#a2522b','stroke-width':3,'data-chord':'AB'});
 for(const [x,name] of [[73.6,'A'],[142.4,'B']]){fig.append(svg('circle',{cx:x,cy:29.2,r:2.5,fill:'#7c391f'}));txt(fig,x+(name==='A'?-9:9),26,name,{'font-size':13});}
 fig.append(svg('circle',{cx:108,cy:55,r:2.5,fill:'#1a594d'}));txt(fig,119,64,'O',{'font-size':13});return fig;
}
function quartetFigure(values,mode){
 const M=root.PetersonMath,fig=svg('svg',{viewBox:'0 0 239 123',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Два числителя и два знаменателя. Крайние — сверху слева и снизу справа, средние — на другой диагонали.'});
 const positions=[[46,34],[46,91],[184,34],[184,91]];
 if(mode===2){
  ln(fig,positions[0][0],positions[0][1],positions[3][0],positions[3][1],{stroke:'#b4744a','stroke-width':2,'data-product':'outer'});
  ln(fig,positions[1][0],positions[1][1],positions[2][0],positions[2][1],{stroke:'#367863','stroke-width':2.5,'stroke-dasharray':'5 3','data-product':'inner'});
 }
 for(const [i,[x,y]]of positions.entries()){
  fig.append(svg('rect',{x:x-27,y:y-16,width:54,height:29,fill:'#f7f8ee',stroke:'#b3c6b7',rx:4}));
  txt(fig,x,y+5,typeof values[i]==='string'?values[i]:M.answer(values[i]),{'font-size':15,'font-weight':650,'data-position':i});
 }
 ln(fig,18,59,74,59);ln(fig,156,59,212,59);
 const symbolic=values.some(v=>typeof v==='string'&&/[a-z]/.test(v));
 const relation=mode===0?'?':symbolic||compareQuartet(values.map(v=>typeof v==='string'?M.parse(v):v)).same?'=':'≠';
 fig.append(svg('rect',{x:104,y:48,width:23,height:22,rx:4,fill:'#f8faf4'}));
 txt(fig,115,65,relation,{'font-size':20,'font-weight':650,'data-relation':relation});return fig;
}
const quartetOrders=[];
for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
 if(a===b||b===c||a===c)continue;
 quartetOrders.push([a,b,c,6-a-b-c]);
}
function wheelLabel(v){return String(v).replace(/^(-?)\./,'$10.').replace('.' ,',').replace('-', '−');}
function wheelFigure(scenario,selected=-1){
 const onIn=scenario.direction==='in',cx=119,cy=113,radius=80;
 const fig=svg('svg',{viewBox:'0 0 239 229',role:'img',class:'pm-chart pcm-group-rule pcm-operation-spokes','aria-label':onIn?'Восемь чисел. От каждого стрелка к операции деления в центре.':'От начального числа в центре к восьми отдельным действиям направлены стрелки.'});
 const center=wheelLabel(scenario.center);
 fig.append(svg('circle',{cx,cy,r:23,fill:'#dfecdb',stroke:'#45694c','stroke-width':1.5}));
 txt(fig,cx,cy+5,(onIn?'÷ ':'')+center,{'font-size':14,'font-weight':700});
 for(const [i,[op,operand]] of scenario.spokes.entries()){
  const theta=(-112.5+i*45)*Math.PI/180,dx=Math.cos(theta),dy=Math.sin(theta),outerX=cx+dx*radius,outerY=cy+dy*radius;
  const start=onIn?radius-24:24,end=onIn?25:radius-25;
  const px=cx+end*dx,py=cy+end*dy,dir=onIn?-1:1,color=i===selected?'#a15129':'#607468';
  ln(fig,cx+start*dx,cy+start*dy,px,py,{stroke:color,'stroke-width':i===selected?2.7:1.4,'data-ray':i+1,'data-direction':scenario.direction});
  fig.append(svg('polygon',{points:[[px,py],[px-dir*6*dx+3*dy,py-dir*6*dy-3*dx],[px-dir*6*dx-3*dy,py-dir*6*dy+3*dx]].map(p=>p.join(',')).join(' '),fill:color}));
  fig.append(svg('rect',{x:outerX-23,y:outerY-15,width:46,height:30,rx:8,fill:i===selected?'#f4dbc1':'#f8f9f3',stroke:color,'stroke-width':i===selected?2:1}));
  txt(fig,outerX,outerY+4,(onIn?'':op)+wheelLabel(operand),{'font-size':13,'font-weight':i===selected?700:500});
  txt(fig,cx+dx*(radius+32),cy+dy*(radius+32)+3,String(i+1),{'font-size':12,'data-ray-label':i+1});
 }
 return fig;
}
function tripDistances(first,second){
 const figure=svg('svg',{viewBox:'0 0 236 111',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Две полоски в общем масштабе показывают путь по течению и против течения.'});
 const factor=180/Math.max(first,second);
 for(const [i,[d,label,color]]of [[first,'По течению','#548b70'],[second,'Против течения','#a57851']].entries()){
  const y=32+i*48;txt(figure,14,y-6,label,{'font-size':13,'text-anchor':'start'});figure.append(svg('rect',{x:14,y,width:d*factor,height:10,fill:color,'data-km':d}));txt(figure,14,y+25,num(d)+' км',{'font-size':12,'text-anchor':'start'});
 }return figure;
}
function footOnLine(p,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy);
 return [a[0]+t*dx,a[1]+t*dy];
}
function printedAltitude(index){
 let points,triangle,lines,rights,offsets;
 if(index===1){
  points={A:[0,0],B:[6,5],C:[8,0]};points.L=footOnLine(points.C,points.A,points.B);
  triangle=['A','B','C'];lines=[['C','L']];rights=[['L','A','C']];offsets={A:[-8,8],B:[5,-7],C:[8,8],L:[-8,-5]};
 }else if(index===2){
  points={D:[.3,5],E:[3.1,0],F:[8,0],K:[.3,0]};triangle=['D','E','F'];lines=[['K','E','extension'],['D','K']];rights=[['K','D','E']];offsets={D:[-6,-5],K:[-8,8],E:[0,14],F:[8,8]};
 }else if(index===3){
  points={M:[0,3.8],N:[8,5.5],P:[5.6,0]};points.R=[8*.58,3.8+(5.5-3.8)*.58];points.S=footOnLine(points.R,points.M,points.P);
  triangle=['M','N','P'];lines=[['R','S']];rights=[['S','M','R']];offsets={M:[-8,-3],N:[6,-5],P:[6,10],R:[0,-9],S:[-6,13]};
 }else{
  points={X:[1,6],Z:[1,0],Y:[7.5,0]};points.T=footOnLine(points.Z,points.X,points.Y);
  triangle=['X','Y','Z'];lines=[['Z','T']];rights=[['Z','X','Y'],['T','X','Z']];offsets={X:[-3,-8],Z:[-8,10],Y:[8,8],T:[9,-4]};
 }
 return {points,triangle,lines,rights,offsets};
}
function constructionAltitudes(kind){
 const c=[3,0,-2][kind],points={A:[0,0],B:[6,0],C:[c,4],H:[c,c*(6-c)/4]};
 const paths=[['A','B','C','D'],['B','A','C','E'],['C','A','B','F']];
 paths.forEach(([v,a,b,foot])=>points[foot]=footOnLine(points[v],points[a],points[b]));
 return {points,triangle:['A','B','C'],paths,offsets:{A:[-8,9],B:[8,8],C:[3,-8],H:[10,10]}};
}
function altitudeDiagram(index,stage=0,construction=false){
 const model=construction?constructionAltitudes(index):printedAltitude(index),pts=model.points;
 const all=Object.values(pts),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const unit=Math.min(185/(x1-x0),114/(y1-y0)),left=(236-(x1-x0)*unit)/2,top=18;
 const screen=p=>[left+(p[0]-x0)*unit,top+(y1-p[1])*unit];
 const mline=(a,b,attrs={})=>{const [x,y]=screen(pts[a]),[u,v]=screen(pts[b]);ln(fig,x,y,u,v,attrs);};
 const fig=svg('svg',{viewBox:'0 0 236 161',role:'img',class:'pm-chart pcm-group-rule pcm-altitude-lesson','aria-label':construction?'Перпендикуляры из вершин треугольника и общая точка их прямых.':'Треугольник '+model.triangle.join('')+' с подписями и знаками прямого угла.'});
 for(const [i,v]of model.triangle.entries())mline(v,model.triangle[(i+1)%3],{stroke:'#405e4f','stroke-width':1.9,'data-side':v+model.triangle[(i+1)%3]});
 const corner=(at,along,other)=>{
  const p=screen(pts[at]),v1=screen(pts[along]),v2=screen(pts[other]),direction=v=>{const dx=v[0]-p[0],dy=v[1]-p[1],dist=Math.hypot(dx,dy);return dist?[dx/dist,dy/dist]:[0,0];};
  const a=direction(v1),b=direction(v2),len=6;
  if(!Math.hypot(...a)||!Math.hypot(...b))return;
  const vertices=[[0,0],a,[a[0]+b[0],a[1]+b[1]],b].map(v=>(p[0]+len*v[0])+','+(p[1]+len*v[1])).join(' ');
  fig.append(svg('polygon',{points:vertices,fill:'#f0d4b9',stroke:'#815b42','stroke-width':.8,'data-right-at':at}));
 };
 if(construction){
  for(const [i,[v,a,b,foot]]of model.paths.entries()){
   if(stage===0||stage===1&&i!==2)continue;
   mline(a,foot,{stroke:'#acb7ad','stroke-width':1,'stroke-dasharray':'3 3'});
   mline(v,foot,{stroke:['#96703f','#477a6e','#6f648a'][i],'stroke-width':1.7,'data-altitude-from':v});
   if(stage===2)mline(v,'H',{stroke:['#96703f','#477a6e','#6f648a'][i],'stroke-width':1.2,'stroke-dasharray':'4 3'});
   const coincides=pts[foot][0]===pts[a][0]&&pts[foot][1]===pts[a][1];corner(foot,coincides?b:a,v);
  }
  if(stage===2){const [x,y]=screen(pts.H);fig.append(svg('circle',{cx:x,cy:y,r:3.5,fill:'#9d4a31','data-orthocenter':index}));}
 }else{
  model.lines.forEach(([a,b,type])=>mline(a,b,{stroke:type==='extension'?'#88978d':stage?'#9b6036':'#577568','stroke-width':type==='extension'?1:2,'stroke-dasharray':type==='extension'?'4 3':'','data-aux':a+b}));
  model.rights.forEach(([at,a,b])=>corner(at,a,b));
 }
 for(const [name,offset]of Object.entries(model.offsets)){
  if(construction && name==='H'&&(stage!==2||index===1))continue;
  const [x,y]=screen(pts[name]);txt(fig,x+offset[0],y+offset[1],construction&&name==='A'&&index===1&&stage===2?'A = H':name,{'font-size':13,'font-weight':600});
 }
 return fig;
}
function percentStrips(before,after){
 const fig=svg('svg',{viewBox:'0 0 233 99',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Две полосы одной шкалы. Исходная величина '+num(before)+', сравниваемая '+num(after)+'.'});
 const scale=181/Math.max(before,after);
 for(const [i,[value,label,color]]of [[before,'Исходное','#51886f'],[after,'Сравниваемое','#bd8455']].entries()){
  const y=25+43*i;txt(fig,12,y-5,label+' '+num(value),{'font-size':13,'text-anchor':'start'});fig.append(svg('rect',{x:12,y,width:value*scale,height:9,fill:color,'data-bar-value':value}));
 }
 return fig;
}
function trialLeft(rule,x){
 switch(rule){
  case 'square':return x*x;
  case 'square-plus-nine':return x*x+9;
  case 'square-minus-25':return x*x-25;
  case 'neighbors':return x*x*(x+1);
  case 'even-fourth':return x**4+x*x;
  case 'fifth-difference':return x**4*(x-1);
 }
 throw new Error('Неизвестная форма уравнения');
}
function nestedFractionFigure(){
 const fraction=el('div','pcm-printed-fraction');
 const top=el('div','pcm-fraction-numerator','10,2 : [18,5 − (5 ⅔ × 1,75 − 3 ⅔ × 1,75) : 2 ⅓]'),
  bottom=el('div','pcm-fraction-denominator','80,64 : 1,6 − 3,4 : ⅙');
 fraction.append(top,bottom);
 return fraction;
}
function largeFractionTrail(fresh){
 const M=root.PetersonMath,op=(kind,a,b)=>M.operation(kind,a,b),factor=fresh?'7/2':'7/4',top=fresh?'15.5':'10.2';
 const brackets=op('multiply',op('subtract','17/3','11/3'),factor);
 const divider=op('subtract','18.5',op('divide',brackets,'7/3'));
 const numerator=op('divide',top,divider),denominator=op('subtract',op('divide','80.64','1.6'),op('divide','3.4','1/6'));
 return [['Разность произведений',brackets],['После вычитания из 18,5',divider],['Большой числитель',numerator],['Большой знаменатель',denominator],['Большая дробь',op('divide',numerator,denominator)]];
}
function gardenScale(placement,gate){
 const pic=svg('svg',{viewBox:'0 0 242 173',role:'img',class:'pm-chart pcm-group-rule pcm-plan-garden','aria-label':placement===undefined?'Прямоугольный участок длиной 40 м и шириной 30 м.':'Участок, дом и ворота на длинной нижней стороне.'});
 const x=21,y=19,s=20.5,gardenW=8,gardenH=6,home=2;
 pic.append(svg('rect',{x,y,width:s*gardenW,height:s*gardenH,fill:'#e4eee3',stroke:'#346550','stroke-width':1.7}));
 if(placement===undefined){
  txt(pic,x+4*s,y-5,'40 м',{'font-size':13});txt(pic,x+8*s+9,y+3*s,'30 м',{'font-size':13,'text-anchor':'start'});
  txt(pic,x+4*s,y+3*s,'Участок',{'font-size':17});
  return pic;
 }
 const [dx,dy]=[[3,2],[2,2],[3,1]][placement];
 pic.append(svg('rect',{x:x+dx*s,y:y+dy*s,width:home*s,height:home*s,fill:'#efd5b6',stroke:'#865335','stroke-width':1.5,'data-home':placement}));
 const gateCenter=gate===0?4:gate===1?2:6;
 ln(pic,x+(gateCenter-.4)*s,y+6*s,x+(gateCenter+.4)*s,y+6*s,{stroke:'#bc7134','stroke-width':5,'data-gate-center':gateCenter});
 txt(pic,x+4*s,y-5,'8 см',{'font-size':13});txt(pic,x+8*s+10,y+3*s,'6 см',{'font-size':13,'text-anchor':'start'});
 txt(pic,x+(dx+1)*s,y+(dy+1)*s+5,'дом',{'font-size':13});txt(pic,x+gateCenter*s,y+6*s+20,'ворота',{'font-size':13});
 return pic;
}
function roadTriangle(horizontal,height,showHeight=true){
 const pic=svg('svg',{viewBox:'0 0 246 133',role:'img',class:'pm-chart pcm-group-rule pcm-road-triangle','aria-label':'Прямоугольный треугольник. Основание a горизонтально, катет h вертикален.'});
 const x=16,y=88,end=206,top=horizontal===undefined?38:y-(end-x)*height/horizontal;
 pic.append(svg('polygon',{points:x+','+y+' '+end+','+y+' '+end+','+top,fill:'#e7ede1',stroke:'#496953','stroke-width':1.2}));
 ln(pic,x,y,end,top,{stroke:'#9d552c','stroke-width':3,'data-run':'horizontal','data-rise':y-top});
 const corner=Math.min(8,(y-top)*.45);
 pic.append(svg('polyline',{points:(end-corner)+','+y+' '+(end-corner)+','+(y-corner)+' '+end+','+(y-corner),fill:'none',stroke:'#496953'}));
 txt(pic,107,110,horizontal===undefined?'a':('a = '+num(horizontal)+' м'),{'font-size':14});
 txt(pic,215,(top+y)/2+3,'h',{'font-size':14});if(height!==undefined&&showHeight)txt(pic,119,23,'h = '+num(height)+' м',{'font-size':14});
 return pic;
}
function gearPairFigure(first,second){
 const pic=svg('svg',{viewBox:'0 0 245 155',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Две шестерни, у первой '+first+' зубьев, у второй '+second+'.'});
 const scale=Math.min(99/(first+second),49/Math.max(first,second)),r1=first*scale,r2=second*scale;
 const start=(245-2*(r1+r2))/2,contact=start+2*r1,cy=65;
 for(const [teeth,r,cx,color]of [[first,r1,start+r1,'#72a889'],[second,r2,contact+r2,'#dba77a']]){
  const points=[];
  for(let tooth=0;tooth<teeth;tooth++)for(const [offset,factor]of [[0,.97],[.23,1.025],[.58,1.025],[.84,.97]]){
   const angle=2*Math.PI*(tooth+offset)/teeth;
   points.push((cx+r*factor*Math.cos(angle)).toFixed(2)+','+(cy+r*factor*Math.sin(angle)).toFixed(2));
  }
  pic.append(svg('polygon',{points:points.join(' '),fill:color,stroke:'#315640','stroke-width':.45,'data-teeth':teeth}));
  pic.append(svg('circle',{cx,cy,r:Math.min(5,r/3),fill:'#fff',stroke:'#586650','stroke-width':1}));
 }
 txt(pic,15,139,'Первая: '+first,{'font-size':14,'text-anchor':'start'});txt(pic,230,139,'Вторая: '+second,{'font-size':14,'text-anchor':'end'});return pic;
}
const sequenceChecks={
 divide:{examples:[['10 → 2 → 0,4 → 0,08 → 0,16 → 0,032','0,08 : 5 = 0,016; здесь напечатано 0,16.'],['25 → 5 → 1 → 0,3 → 0,06','1 : 5 = 0,2; здесь указано 0,3.']]},
 sum:{examples:[['0,5 → 1 → 1,5 → 2,5 → 4 → 6,5 → 10 → 16,5','4 + 6,5 = 10,5; здесь напечатано 10.'],['1 → 2 → 3 → 5 → 9 → 14','3 + 5 = 8; здесь указано 9.']]},
 alternating:{examples:[['3 → 0,5 → 6 → 0,8 → 12 → 1,1 → 18 → 1,4','Нечётные места: 3, 6, 12, 18. Удвоение даёт 24 вместо 18.'],['2 → 1 → 4 → 1,2 → 7 → 1,4','Нечётные места: 2, 4, 7. Удвоение даёт 8 вместо 7.']]},
 denominator:{examples:[['5/8 → 6/13 → 7/19 → 8/26 → 9/32 → 10/41 → 11/51 → 12/62','26 + 8 = 34: после 8/26 по этому правилу идёт 9/34.'],['2/5 → 3/7 → 4/10 → 5/13 → 6/18','10 + 4 = 14: после 4/10 по этому правилу идёт 5/14.']]},
};
const scaleReadings={
 'enlarge-reduce':{titles:['Увеличить в 5 раз','Уменьшить в 100 раз'],scales:[[5,1],[1,100]],drawing:[5,2],units:'см'},
 plan400:{titles:['3 см на плане','7 см на плане'],scales:[[1,400],[1,400]],drawing:[3,7],units:'м'},
 map500000:{titles:['3 см на карте','7 см на карте'],scales:[[1,500000],[1,500000]],drawing:[3,7],units:'км'},
 draw3:{titles:['12 см на чертеже','21 см на чертеже'],scales:[[3,1],[3,1]],drawing:[12,21],units:'см'},
 map2dm:{titles:['2 дм = 20 см, на местности 50 км','3 дм = 30 см, на местности 48 км'],scales:[[1,250000],[1,160000]],drawing:[20,30],units:'км',findScale:true},
 million1:{titles:['1 см на карте','0,9 см на карте'],scales:[[1,1000000],[1,1000000]],drawing:[1,.9],units:'км'},
 million3:{titles:['1,8 дм на карте','2,4 дм на карте'],scales:[[1,1000000],[1,1000000]],drawing:[18,24],units:'км'},
 million4:{titles:['35 мм на карте','42 мм на карте'],scales:[[1,1000000],[1,1000000]],drawing:[3.5,4.2],units:'км'},
};
function scaleRuler(length,real,unit,reveal){
 const picture=svg('svg',{viewBox:'0 0 240 106',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Координаты одной и той же доли отрезка на двух подписанных шкалах. Шкалы заданы числами.'});
 for(const [y,title,extent,suffix,color]of [[25,'Изображение',length,'см','#227354'],[76,'В действительности',real,unit,'#9d6028']]){
  txt(picture,10,y-8,title,{'text-anchor':'start','font-size':13});
  ln(picture,12,y,219,y,{stroke:color,'stroke-width':3});
  for(let i=0;i<=4;i++){const x=12+i*51.75;ln(picture,x,y-3,x,y+4,{stroke:color,'stroke-width':1.25});}
  txt(picture,12,y+16,'0',{'font-size':12});
  txt(picture,219,y+16,y===25||reveal?num(extent)+' '+suffix:'? '+suffix,{'text-anchor':'end','font-size':13,'font-weight':'bold'});
 }
 return picture;
}
const planePairs=['ab','ac','ad','al','bc','bd','bl','cd','cl','dl'];
const parallelPairs=['ad','cl'],rightAnglePairs=['ac','al','cd','dl'];
function fiveLinePicture(pair='',alternate=false) {
 const picture=svg('svg',{viewBox:'0 0 249 154',role:'img',class:'pm-chart pcm-group-rule pcm-five-lines',
  'aria-label':'Две горизонтальные прямые a и d, две вертикальные c и l и косая b. Выбранная пара: '+(pair||'нет')});
 const first=alternate?39:51,second=alternate?93:106,left=alternate?93:74,right=alternate?168:153;
 const defs=[
  ['a',[14,first,221,first],[233,first+4]],['d',[14,second,221,second],[233,second+4]],
  ['c',[left,17,left,142],[left,13]],['l',[right,17,right,142],[right,13]],
  ['b',alternate?[25,22,196,137]:[15,125,176,15],alternate?[20,19]:[184,17]],
 ];
 for(const [name,points,labelAt]of defs){
  const active=pair.includes(name);
  ln(picture,...points,{stroke:active?'#b05028':'#346550','stroke-width':active?3:1.65,'data-line':name});
  txt(picture,...labelAt,name,{'font-size':15,'font-style':'italic','font-weight':active?'bold':'normal'});
 }
 return picture;
}
function midpointPicture(center,radius,revealed) {
 const picture=svg('svg',{viewBox:'0 0 240 92',role:'img',class:'pm-chart pcm-group-rule',
  'aria-label':'Расстояния влево и вправо от центра '+center+' равны '+radius});
 const middle=120,span=42,y=46,step=span/radius;
 ln(picture,12,y,228,y,{'stroke-width':1.5});
 for(let v=center-radius-1;v<=center+radius+1;v++){
  const x=middle+(v-center)*step;
  ln(picture,x,y-3,x,y+3,{stroke:'#466354','stroke-width':1});
 }
 for(const [label,sign]of [['Левее',-1],['Правее',1]]){
  const x=middle+sign*span;
  ln(picture,middle,y-7,x,y-7,{stroke:sign===1?'#9b581d':'#29714d','stroke-width':3});
  txt(picture,(x+middle)/2,y-15,String(radius),{'font-size':14});
  picture.append(svg('circle',{cx:x,cy:y,r:3.5,fill:'#293d31','data-root':sign<0?'left':'right'}));
  txt(picture,x,y+24,revealed?String(center+sign*radius):'?',{'font-size':15});
 }
 txt(picture,middle,y+25,String(center),{'font-size':15,'font-weight':'bold'});
 return picture;
}
function parallelogramPicture(){
 const pic=svg('svg',{viewBox:'0 0 240 142',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Параллелограмм с попарно параллельными противоположными сторонами.'});
 pic.append(svg('polygon',{points:'22,116 65,23 219,23 176,116',fill:'#dfede3',stroke:'#396148','stroke-width':2}));
 for(const [x,y]of [[123,23],[100,116]])pic.append(svg('polyline',{points:(x-5)+','+(y-3)+' '+x+','+y+' '+(x-5)+','+(y+3),fill:'none',stroke:'#34614c','stroke-width':2}));
 for(const [x,y]of [[44,68],[198,68]])for(const delta of [-4,3])pic.append(svg('polyline',{points:(x-2)+','+(y+delta+4)+' '+(x+2)+','+(y+delta)+' '+(x+4)+','+(y+delta+5),fill:'none',stroke:'#34614c','stroke-width':1.5}));
 return pic;
}
const comparisonStories={
 tram:{unknown:'Во втором вагоне до остановки',values:[12,16,20],cases:['Из первого вышли 5, во второй вошли 3.','Из первого вышли 3, во второй вошли 3.']},
 milk:{unknown:'Литры в банке сначала',values:[2.4,4,6],cases:['Отлили 2 л и 3 л; остаток в бидоне больше в 4,5 раза.','Из каждой ёмкости отлили 2 л; остаток в бидоне больше втрое.']},
 books:{unknown:'Книги на первой полке сначала',values:[12,15,18],cases:['Разность 18 книг, удвоенное первое число — 80 % второго.','Разность 15 книг, удвоенное первое число равно второму.']},
 ages:{unknown:'Возраст самого младшего',values:[8,10,12],cases:['Шесть сыновей, соседние возрасты различаются на 4 года.','Семь сыновей, соседние возрасты различаются на 4 года.']},
};
function storyComparison(kind,v,fresh) {
 let rows,left,right,test;
 if(kind==='tram'){
  const first=1.5*v,leaving=fresh?3:5;
  rows=[['Первый вагон',first,first-leaving],['Второй вагон',v,v+3]];
  left=first-leaving;right=v+3;test='Сравни число людей после остановки.';
 }else if(kind==='milk'){
  const first=2*v,removed=fresh?2:3,multiple=fresh?3:4.5;
  rows=[['Бидон, л',first,first-removed],['Банка, л',v,v-2]];
  left=first-removed;right=(v-2)*multiple;test='Остаток в бидоне и '+num(multiple)+' остатка в банке.';
 }else if(kind==='books'){
  const second=v+(fresh?15:18),fraction=fresh?1:0.8;
  rows=[['Первая полка',v,2*v],['Вторая полка',second,second]];
  left=2*v;right=second*fraction;test='Удвоенная первая полка и '+num(fraction*100)+' % второй.';
 }else{
  const count=fresh?7:6,difference=(count-1)*4;
  rows=[['Младший',v,v],['Старший',v+difference,3*v]];
  left=v+difference;right=3*v;test='Старший по промежуткам и по условию «втрое».';
 }
 return {rows:rows.map(([name,start,end])=>[name,num(start),num(end)]),left,right,test};
}
function tangentNest(choice,sample) {
 const figure=svg('svg',{viewBox:'0 0 242 174',role:'img',class:'pm-chart pcm-group-rule pcm-tangent-nest',
  'aria-label':'Четыре прямоугольных треугольника с общим углом A. Цветом выделен выбранный вертикальный катет.'});
 const x=15,y=145,unit=27,slope=sample===1?2/3:1/2;
 ln(figure,x,y,231,y);ln(figure,x,y,x+unit*7.5,y-unit*7.5*slope);
 txt(figure,11,164,'A',{'font-size':12});
 const names=['','₁','₂','₃'];
 for(let i=0;i<4;i++){
  const base=4+i,abscissa=x+base*unit,top=y-base*slope*unit,selected=i===choice;
  ln(figure,abscissa,y,abscissa,top,{stroke:selected?'#ae512a':'#4a7562','stroke-width':selected?3:1.3,'data-base':base,'data-height':base*slope});
  figure.append(svg('polyline',{points:(abscissa-5)+','+y+' '+(abscissa-5)+','+(y-5)+' '+abscissa+','+(y-5),fill:'none',stroke:'#576450','stroke-width':1}));
  txt(figure,abscissa,164,'C'+names[i],{'font-size':11});txt(figure,abscissa-3,top-5,'B'+names[i],{'font-size':11});
 }
 return figure;
}
const travelCases={
 bus:[
  {input:'За три часа: 20, 30 и 40 км',rows:[['Первый час','20 км'],['Второй час','30 км'],['Третий час','40 км']],summary:'90 км : 3 ч = 30 км/ч'},
  {input:'За три часа: 32, 41 и 50 км',rows:[['Первый час','32 км'],['Второй час','41 км'],['Третий час','50 км']],summary:'123 км : 3 ч = 41 км/ч'},
 ],
 walker:[
  {input:'5 мин по 60 м/мин и 15 мин по 80 м/мин',rows:[['Первые 5 мин','5 × 60 = 300 м'],['Дальше 15 мин','15 × 80 = 1200 м']],summary:'1500 м : 20 мин = 75 м/мин'},
  {input:'5 мин по 84 м/мин и 15 мин по 52 м/мин',rows:[['Первые 5 мин','5 × 84 = 420 м'],['Дальше 15 мин','15 × 52 = 780 м']],summary:'1200 м : 20 мин = 60 м/мин'},
 ],
 boat:[
  {input:'12 км в каждом направлении',rows:[['Вниз за 2 ч','6 км/ч'],['Вверх за 3 ч','4 км/ч']],summary:'Собственная: (6 + 4) / 2 = 5 км/ч. Течение: (6 − 4) / 2 = 1 км/ч.'},
  {input:'36 км в каждом направлении',rows:[['Вниз за 2 ч','18 км/ч'],['Вверх за 3 ч','12 км/ч']],summary:'Собственная: (18 + 12) / 2 = 15 км/ч. Течение: (18 − 12) / 2 = 3 км/ч.'},
 ],
 upstream:[
  {input:'Катер вниз: 16 км/ч, плот: 3 км/ч',rows:[['Собственная скорость','16 − 3 = 13 км/ч'],['Против течения','13 − 3 = 10 км/ч']],summary:'4 ч × 10 км/ч = 40 км'},
  {input:'Катер вниз: 21 км/ч, плот: 4 км/ч',rows:[['Собственная скорость','21 − 4 = 17 км/ч'],['Против течения','17 − 4 = 13 км/ч']],summary:'4 ч × 13 км/ч = 52 км'},
 ],
};
function rhombusPicture(){
 const pic=svg('svg',{viewBox:'0 0 240 147',role:'img',class:'pm-chart pcm-group-rule','aria-label':'Ромб с четырьмя одинаковыми сторонами, острыми углами слева и справа.'});
 pic.append(svg('polygon',{points:'13,74 120,13 227,74 120,135',fill:'#d7e8dd',stroke:'#38614b','stroke-width':2}));
 for(const [x,y,dx,dy]of [[66.5,43.5,3,5.3],[173.5,43.5,-3,5.3],[173.5,104.5,3,5.3],[66.5,104.5,-3,5.3]])ln(pic,x-dx,y-dy,x+dx,y+dy,{'stroke-width':2});
 return pic;
}
const nestedRules={
 'simplify-x':{variable:'x',expression:'4x − (3x + (2x − 1))',simplified:'1 − x',
  stages:x=>[['2x − 1',2*x-1],['3x + (2x − 1)',3*x+(2*x-1)],['4x − (5x − 1)',4*x-(5*x-1)]],value:x=>1-x},
 'simplify-y':{variable:'y',expression:'y − (2y − (3y − 4))',simplified:'2y − 4',
  stages:y=>[['3y − 4',3*y-4],['2y − (3y − 4)',2*y-(3*y-4)],['y − (−y + 4)',y-(-y+4)]],value:y=>2*y-4},
 'simplify-z':{variable:'z',expression:'z − (2z + (3z − (4z + 5)))',simplified:'5',
  stages:z=>[['4z + 5',4*z+5],['3z − (4z + 5)',3*z-(4*z+5)],['2z + (−z − 5)',2*z+(-z-5)],['z − (z − 5)',z-(z-5)]],value:()=>5},
};
function remainderGroups(total,divisor) {
 const rows=Math.ceil(total/divisor),w=260,pitch=18;
 const chart=svg('svg',{viewBox:'0 0 '+w+' '+(rows*26+12),role:'img',class:'pm-chart pcm-group-rule',
  'aria-label':total+' точек, ряды по '+divisor+'. Остаток '+(total%divisor)+'.'});
 for(let row=0;row<rows;row++){
  const count=Math.min(divisor,total-row*divisor),y=7+row*26;
  chart.append(svg('rect',{x:5,y,width:divisor*pitch+8,height:22,rx:4,fill:count===divisor?'#e4f0e8':'#fcf0dc',stroke:count===divisor?'#4c775f':'#91632f','data-remainder-row':count}));
  for(let dot=0;dot<count;dot++)chart.append(svg('circle',{cx:18+dot*pitch,cy:y+11,r:5.5,fill:count===divisor?'#2c7451':'#94511e'}));
 }
 return chart;
}
const pythagorasCases=[[3,4,5],[5,12,13],[8,15,17]];
function dissectionFigure(a,b,central) {
 const size=a+b,side=150,x0=15,y0=12,unit=side/size;
 const picture=svg('svg',{viewBox:'0 0 180 181',role:'img',class:'pm-chart pcm-dissection',
  'aria-label':central?'Четыре прямоугольных треугольника вокруг квадрата со стороной c.':'Четыре прямоугольных треугольника рядом с квадратами со сторонами a и b.'});
 picture.append(svg('rect',{x:x0,y:y0,width:side,height:side,fill:'white',stroke:'#244a39','stroke-width':1.5}));
 const triangles=central
  ? [[[0,0],[a,0],[0,b]],[[a,0],[size,0],[size,a]],[[size,a],[size,size],[b,size]],[[b,size],[0,size],[0,b]]]
  : [[[a,0],[size,0],[a,a]],[[size,0],[size,a],[a,a]],[[0,a],[a,a],[a,size]],[[0,a],[a,size],[0,size]]];
 for(const triangle of triangles) {
  const points=triangle.map(([x,y])=>[x0+x*unit,y0+y*unit].join(',')).join(' ');
  picture.append(svg('polygon',{points,fill:'#b4d7c4',stroke:'#245942','stroke-width':1.4,'data-triangle':'1'}));
 }
 const caption=(x,y,label)=>txt(picture,x0+x*unit,y0+y*unit+4,label,{'font-size':15});
 const edgeLabel={'font-size':11};
 txt(picture,x0+a*unit/2,y0-2,'a',edgeLabel);
 txt(picture,x0+(a+b/2)*unit,y0-2,'b',edgeLabel);
 const firstLeg=central?b:a,secondLeg=central?a:b;
 txt(picture,x0-7,y0+firstLeg*unit/2+3,central?'b':'a',edgeLabel);
 txt(picture,x0-7,y0+(firstLeg+secondLeg/2)*unit+3,central?'a':'b',edgeLabel);
 if(central)caption(size/2,size/2,'c²');
 else {caption(a/2,a/2,'a²');caption(a+b/2,a+b/2,'b²');}
 txt(picture,90,177,'Сторона a + b',{'font-size':12});
 return picture;
}
function changeBars(before,after,labels=['Было','Стало']) {
 const pic=svg('svg',{viewBox:'0 0 330 125',role:'img',class:'pm-chart pcm-group-rule',
  'aria-label':labels[0]+' — '+before+', '+labels[1]+' — '+after+'. Обе полосы в одном масштабе.'});
 const value=raw=>{const parsed=root.PetersonMath.parse(raw);return parsed.n/parsed.d;};
 const max=Math.max(value(before),value(after));
 for(const [label,amount,y,color] of [[labels[0],before,31,'#34745d'],[labels[1],after,93,'#925719']]) {
  txt(pic,12,y-8,label+' · '+amount,{'font-size':19,'text-anchor':'start'});
  pic.append(svg('rect',{x:12,y,width:300,height:13,fill:'#e3eae7'}));
  pic.append(svg('rect',{x:12,y,width:300*value(amount)/max,height:13,fill:color,'data-change-bar':label}));
 }
 return pic;
}
function configFor(lesson,task){
 if(lesson?.id==='p15' && Object.hasOwn(comparisonStories,task?.comparisonStory)){
  const story=comparisonStories[task.comparisonStory];return {title:'Проверь свою модель по условию',
   controls:[c('Условие',[[0,'Из упражнения'],[1,'Новый случай']]),c(story.unknown,story.values.map((v,i)=>[i,num(v)]))],initial:[0,0]};
 }
 if(lesson?.id==='p15' && task?.rateStudy)return {title:'Первая величина относительно второй',controls:[c('Пара величин',[[0,'Из задачи'],[1,'Новые числа']]),c('Показ процентов',[[0,'Сначала вычислю'],[1,'Сверю результат']])],initial:[0,0]};
 if(lesson?.id==='p15' && task?.mixStudy)return {title:'Раствор и содержащаяся в нём соль',controls:[c('Массы растворов',[[0,'180, 360, 460 г'],[1,'100, 200, 300 г']]),c('Что считаем?',[[0,'Массу раствора'],[1,'Массу соли'],[2,'Общую концентрацию']])],initial:[0,0]};
 if(lesson?.id==='p15' && task?.similarTangents)return {title:'Один угол, разные размеры треугольника',controls:[c('Треугольник',[[0,'ABC'],[1,'AB₁C₁'],[2,'AB₂C₂'],[3,'AB₃C₃']]),c('Луч из A',[[0,'Как на авторском чертеже'],[1,'Другой острый угол']])],initial:[0,0]};
 if(lesson?.id==='p15' && task?.differenceStudy)return {title:'Что принято за 100 процентов?',controls:[c('Числа A и B',[[0,'Из упражнения'],[1,'Другие числа']]),c('Основание разницы',[[0,'Число B'],[1,'Число A']])],initial:[0,task.source.subpart==='1'?0:1]};

 if(lesson?.id==='p34' && task?.linearStudy)return {title:'Вклад каждой скобки',controls:[c('Множители',[[0,'Исходные'],[1,'Другой первый множитель']]),c('Проверка',[[0,'Сначала раскрою сам'],[1,'Коэффициенты'],[2,'Подстановка']])],initial:[0,0]};
 if(lesson?.id==='p34' && task?.regroupStudy)return {title:'Перестановка множителей',controls:[c('Данные',[[0,'Из задания'],[1,'Другой первый множитель']]),c('Группировка',[[0,'Исходный порядок'],[1,'Удобный порядок'],[2,'Сверить ответ']])],initial:[0,0]};
 if(lesson?.id==='p34' && task?.logicalPower)return {title:'Пример и утверждение для всех чисел',controls:[c('Число a',[-2,-1,0,1,2]),c('Значения',[[0,'Сначала предскажу'],[1,'Сравнить']])],initial:[task.logicalPower.initial,0]};
 if(lesson?.id==='p34' && task?.squareSum)return {title:'Квадрат суммы при разных знаках',controls:[c('Знаки и числа',[[0,'Из задачи'],[1,'Новый пример']]),c('Сравниваем',[[0,'Сначала посчитаю'],[1,'Три выражения'],[2,'Площади частей']])],initial:[0,0]};
 if(lesson?.id==='p34' && Object.hasOwn(trickInputs,task?.numberTrick)){const options=trickInputs[task.numberTrick];return {title:'Пройди арифметический фокус по действиям',controls:[c('Исходное число',options),c('Выполнено действий',range(0,numberTrail(task.numberTrick,0).length-1))],initial:[0,0]};}
 if(lesson?.id==='p34' && task?.coefficientStudy)return {title:'Где кончается степень?',controls:[c('Выражение',[[0,'Из упражнения'],[1,'Новый пример']]),c('Как проверить?',[[0,'Сначала решу'],[1,'Числовая часть'],[2,'Буквенная часть']])],initial:[0,0]};
 if(lesson?.id==='p34' && task?.coefficientContrast)return {title:'Один набор, разные признаки',controls:[c('Признак',[[0,'Нецелый коэффициент'],[1,'Только одна буква'],[2,'Два числовых множителя']]),c('Показ сравнения',[[0,'Сначала выберу сам'],[1,'Сверю свойство']])],initial:[0,0]};
 if(lesson?.id==='p35' && task?.integerTrial)return {title:'Проверь число и его противоположное',controls:[c('Уравнение',[[0,'Исходное'],[1,'Другая правая часть']]),c('Пробное x',range(-6,6)),c('Сравнение',[[0,'Сначала вычислю'],[1,'Одна проба'],[2,'Соседние числа']])],initial:[0,0,0]};
 if(lesson?.id==='p35' && task?.lunchStudy)return {title:'Собери стоимость четырёх блюд',controls:[c('Меню',[[0,'Из задачи'],[1,'Другие цены']]),c('Борщ, р.',[16,20,25,30,45]),c('Проверка',[[0,'Сначала вычислю'],[1,'Сверю стоимость']])],initial:[0,16,0]};
 if(lesson?.id==='p35' && task?.reverseRateStudy)return {title:'От цены или массы к исходной величине',controls:[c('Данные',[[0,'Из задачи'],[1,'Новые числа']]),c('Что сравнить?',[[0,'Условие'],[1,'Основание процента'],[2,'Вычисление']])],initial:[0,0]};
 if(lesson?.id==='p35' && task?.appleSaleStudy)return {title:'Две цены одной продажи',controls:[c('Выручка',[[0,'3360 р.'],[1,'3280 р.']]),c('По новой цене, кг',[0,60,80,100,120,140,180]),c('Проверка',[[0,'Сначала вычислю'],[1,'Сверю выручку']])],initial:[0,60,0]};
 if(lesson?.id==='p35' && task?.fractionTreeStudy)return {title:'Собери большую дробь снизу вверх',controls:[c('Данные',[[0,'Из задания'],[1,'Новый числитель']]),c('Сколько результатов открыть',range(0,5))],initial:[0,0]};
 if(lesson?.id==='p35' && task?.oldCoinStudy)return {title:'Сравни две стоимости в полушках',controls:[c('Левая часть',[[0,'25 яиц без полушки'],[1,'15 яиц без полушки']]),c('Полушек за яйцо',[[0,'1/10'],[1,'1/5'],[2,'3/10'],[3,'1/2']]),c('Проверка',[[0,'Сначала вычислю'],[1,'Сверю равенство']])],initial:[0,0,0]};
 if(lesson?.id==='p35' && Number.isInteger(task?.logicalIdentity))return {title:'Проверь квантор на выбранных числах',controls:[c('Пара a, b',[[0,'2 и 3'],[1,'−1 и 1/2'],[2,'0 и 0'],[3,'−2 и −1']]),c('Проверка',[[0,'Сначала предскажу'],[1,'Сравню']])],initial:[0,0]};
 if(lesson?.id==='p35' && task?.altitudeStudy){
  if(task.altitudeStudy==='picture')return {title:'Проверь оба признака высоты',controls:[c('Вопрос',[[0,'Из какой вершины?'],[1,'К какой прямой?'],[2,'Оба условия']])],initial:[0]};
  return {title:'Три вершины и три перпендикуляра',controls:[c('Треугольник',[[0,'Остроугольный'],[1,'Прямоугольный'],[2,'Тупоугольный']]),c('Что провести?',[[0,'Пока только стороны'],[1,'Высоту из C'],[2,'Все три прямые']])],initial:[0,0]};
 }
 if(lesson?.id==='p35' && (task?.percentagePortion||task?.percentageChange))return {title:'Целое, сравниваемая часть и изменение',controls:[c('Начальное число',[60,120,180]),c('Проверка',[[0,'Сначала сравню'],[1,'Доля от начала'],[2,'Изменение']])],initial:[60,0]};
 if(lesson?.id==='p35' && task?.percentNarrative)return {title:'Проверь основание процента',controls:[c('Пример',[[0,'Первый набор'],[1,'Новые числа']]),c('Величины',[[0,'Только данное'],[1,'Первый шаг'],[2,'Весь расчёт']])],initial:[0,0]};
 if(lesson?.id==='p35' && task?.collectedEquation){
  const M=root.PetersonMath,r=task.collectedEquation.solution,options=[-1,0,1].map((delta,i)=>[i,M.answer(M.operation('add',r,delta))]);
  return {title:'Сверь обе стороны уравнения',controls:[c('Уравнение',[[0,'Из задания'],[1,'Другая правая часть']]),c('Неизвестное',options),c('Проверка',[[0,'Сначала решу'],[1,'Сверю значения']])],initial:[0,0,0]};
 }
 if(lesson?.id==='p35' && task?.packingStudy)return {title:'Собери партии пакетов и коробок',controls:[c('Партия',[[0,'32 кг; разница 16'],[1,'45 кг; разница 10']]),c('Число пакетов',[8,12,16,20,24]),c('Проверка',[[0,'Сначала оценю'],[1,'Сверю массу']])],initial:[0,8,0]};
 if(lesson?.id==='p35' && task?.patrolStudy)return {title:'Две части пути по реке и движение по озеру',controls:[c('Маршрут',[[0,'Из задания'],[1,'Новый маршрут']]),c('Скорость в стоячей воде',[8,9,12,15]),c('Проверка',[[0,'Сначала оценю'],[1,'Сверю расстояние']])],initial:[0,8,0]};
 if(lesson?.id==='p35' && task?.spokeStudy)return {title:'Прочти действие по направлению стрелки',controls:[c('Луч',range(1,8)),c('Число в центре',[[0,'Из задания'],[1,'Другое число']]),c('Ответ',[[0,'Сначала вычислю'],[1,'Сверю']])],initial:[1,0,0]};
 if(lesson?.id==='p35' && task?.factorSum)return {title:'Вынеси общий числовой множитель',controls:[c('Пример',[[0,'Из задания'],[1,'Изменить слагаемое']]),c('Проверка',[[0,'Сначала решу'],[1,'Содержимое скобок'],[2,'Весь результат']])],initial:[0,0]};
 if(lesson?.id==='p35' && task?.differenceSquareStudy){
  const cases=task.differenceSquareStudy;
  const controls=cases.free?[c('Число a',range(-6,6)),c('Число b',range(-6,6))]:[c('Числа',[[0,'Из учебника'],[1,'Другая пара']])];
  controls.push(c('Как проверить?',[[0,'Сначала вычислю'],[1,'Три выражения'],[2,'Площади']]));
  return {title:'Квадрат разности и разность квадратов',controls,initial:cases.free?[4,1,0]:[0,0]};
 }
 if(lesson?.id==='p35' && task?.likeTermsStudy)return {title:'Собери слагаемые с одинаковыми буквами и степенями',controls:[c('Буквенная часть',likeTermOptions(task.likeTermsStudy)),c('Пример',[[0,'Из задачи'],[1,task.likeTermsStudy.substitutions?'Другие значения':'Другое число']]),c('Проверка',[[0,'Сначала посчитаю'],[1,'Сумма группы'],[2,'Подстановка']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.proportionReading)return {title:'Сравни два отношения',controls:[c('Числа',[[0,'Из книги'],[1,'Изменить третье число']]),c('Способ',[[0,'Сначала решу'],[1,'Два частных'],[2,'Два произведения']])],initial:[0,0]};
 if(lesson?.id==='p38'&&task?.convertGroup)return {title:'Переведи одну скорость и проверь единицы',controls:[c('Данные',[[0,'Из упражнения'],[1,'Новые значения']]),c('Скорость',task.convertGroup.rows.map(([v,u],i)=>[i,String(i+1)+'. '+v+' '+u])),c('Проверка',[[0,'Переведу сам'],[1,'Множитель'],[2,'Проверка единиц']])],initial:[0,0,0]};
 if(lesson?.id==='p38'&&Number.isInteger(task?.walkingGap))return {title:'Проследи за промежутком во времени',controls:[c('Пешеходы',[[0,'Из упражнения'],[1,'Новые данные']]),c('Время, с',[[0,'0'],[1,'5'],[2,'10'],[3,'15']]),c('Проверка',[[0,'Смотрю направления'],[1,'Формула'],[2,'Расстояние']])],initial:[0,0,0]};
 if(lesson?.id==='p38'&&task?.calendarBalance)return {title:'Проверь три части целого',controls:[c('Ситуация',[[0,'Из упражнения'],[1,'Новые данные']]),c('Шаг',[[0,'Составлю уравнение'],[1,'Уравнение'],[2,'Проверка суммы']])],initial:[0,0]};
 if(lesson?.id==='p38'&&task?.formulaWords)return {title:'Прочитай и проверь формулу',controls:[c('Данные',[[0,'Первый пример'],[1,'Другой пример']]),c('Шаг',[[0,'Объясню сам'],[1,'Подстановка'],[2,'Проверка']])],initial:[0,0]};
 if(lesson?.id==='p38'&&task?.stationGraph)return {title:'Прочитай обе линии и общее время',controls:[c('Расписание',[[0,'Из упражнения'],[1,'Новый маршрут']]),c('Метка времени',[[0,'Без отметки'],[1,'Начало остановки велосипедиста'],[2,'Начало общей остановки'],[3,'Середина общей остановки'],[4,'Конец общей остановки'],[5,'Конец второй остановки пешехода']]),c('Проверка',[[0,'Прочитаю график'],[1,'Как читать'],[2,'Проверить вывод']])],initial:[0,0,0]};
 if(lesson?.id==='p38'&&task?.p38Shape)return {title:'Проследи шаги и проверь результат',controls:[c('Набор',[[0,'Из упражнения'],[1,'Новые данные']]),c('Шаг',[[0,'Решу сам'],[1,'Промежуточная проверка'],[2,'Проверка результата']])],initial:[0,0]};
 if(lesson?.id==='p38'&&(task?.sizeRule||task?.percentBasis||task?.reduceStudy))return {title:task.reduceStudy?'Сократи и проверь равенство':task.percentBasis?'Смени основание сравнения':'Проверь изменение величины',controls:[c('Данные',[[0,'Из упражнения'],[1,'Другой пример']]),c('Шаг',[[0,'Решу сам'],[1,'Запись'],[2,'Проверка']])],initial:[0,0]};
 if(lesson?.id==='p38'&&Number.isInteger(task?.squareClaim))return {title:'Проверь частный пример и общий вывод',controls:[c('Число a',[[0,'−2/3'],[1,'0'],[2,'3/2']]),c('Шаг',[[0,'Предположение'],[1,'Квадрат'],[2,'Смысл квантора']])],initial:[0,0]};
 if(lesson?.id==='p38'&&task?.mentalSeries)return {title:'Проверь одно вычисление',controls:[c('Набор',[[0,'Из счёт-теста'],[1,'Новые числа']]),c('Пример',task.mentalSeries.map((_,i)=>[i,String(i+1)])),c('Проверка',[[0,'Вычислю сам'],[1,'Разобрать действие'],[2,'Проверить результат']])],initial:[0,0,0]};
 if(lesson?.id==='p38'&&task?.portionRow)return {title:'Восстанови целое или найди долю',controls:[c('Данные',[[0,'Из упражнения'],[1,'Новые числа']]),c('Проверка',[[0,'Выберу действие'],[1,'Связь'],[2,'Вычисление']])],initial:[0,0]};
 if(lesson?.id==='p38'&&(task?.appliedBalance||task?.appliedCompare||task?.printedJourney||task?.sharedRate))return {title:'Составь и проверь уравнение для этой ситуации',controls:[c('Условие',[[0,'Из учебника'],[1,'Новые данные']]),c('Шаг',[[0,'Сначала составлю сам'],[1,'Уравнение'],[2,'Модель и проверка']])],initial:[0,0]};
 if(lesson?.id==='p19'&&task?.ratioRewrite)return {title:'Что изменилось в четырёх членах?',controls:[c('Набор',[[0,'Исходные числа'],[1,'Все четыре числа вдвое больше']]),c('Стадия',[[0,'До преобразования'],[1,'После преобразования'],[2,'Проверка']])],initial:[0,0]};
 if(lesson?.id==='p19'&&task?.printedRateStory){
  const train=task.printedRateStory==='trains';
  return {title:train?'Место каждого поезда от общей станции':'Сопоставь величины исходной задачи',controls:[c('Данные',[[0,'Из учебника'],[1,'Изменённое условие']]),...(train?[c('После старта второго, ч',[0,4,6,10,15])]:[]),c('Разбор',[[0,'Сначала составлю модель'],[1,'Таблица'],[2,'Проверка ответа']])],initial:train?[0,0,0]:[0,0]};
 }
 if(lesson?.id==='p19'&&task?.marketDistanceGraph){
  const apples=task.marketDistanceGraph==='apples';
  return {title:apples?'Цена килограмма на графике':'Скорость на фиксированном пути',controls:[apples?c('Цена, р./кг',[80,100]):c('Расстояние, км',[18,24]),apples?c('Масса, кг',[0,1,2,3,4]):c('Время',[1,2,3,4,4.5,6,9,18].map((v,i)=>[i,num(v)+' ч'])),c('Стадия',[[0,'Выбери точку'],[1,'Значение'],[2,'Таблица и формула']])],initial:apples?[80,1,0]:[18,0,0]};
 }
 if(lesson?.id==='p19'&&task?.composeSourceRatio)return {title:'Пропорции из четырёх значений',controls:[c('Расстановка',[[0,'A/B и C/D'],[1,'A/C и B/D'],[2,'A/D и B/C']]),c('Проверка',[[0,'Предскажу'],[1,'Перекрёстные произведения']])],initial:[0,0]};
 if(lesson?.id==='p19'&&task?.oilCans)return {title:'Две вместимости и целое число бидонов',controls:[c('Всего, л',[223,233,227]),c('Больших бидонов',range(0,13)),c('Проверка',[[0,'Сначала проверю'],[1,'Остаток'],[2,'Все подходящие варианты']])],initial:[223,0,0]};
 if(lesson?.id==='p19'&&task?.sourceFuelGraph)return {title:'Израсходованные литры по пути',controls:[c('Расход, л на 100 км',[8,10]),c('Путь, км',range(0,10).map(x=>x*10)),c('Проверка',[[0,'Сниму с графика'],[1,'Значение'],[2,'Таблица и формула']])],initial:[8,10,0]};
 if(lesson?.id==='p19'&&task?.flightGraph)return {title:'Проследи за двумя рейсами',controls:[c('Расписание',[[0,'Из учебника'],[1,'Рейс Б на 20 минут позже']]),c('Время',range(54,114).map(x=>[10*x,clockText(10*x)])),c('Проверка',[[0,'Предскажу по графику'],[1,'Положение обоих'],[2,'Точки маршрутов']])],initial:[0,720,0]};
 if(lesson?.id==='p19'&&task?.sectionFlow)return {title:'Площадь сечения и скорость',controls:[c('Расход, м³/с',[24,30]),c('Площадь, м²',[20,24,30,40,48,60,80,96,120]),c('Проверка',[[0,'Сначала предскажу'],[1,'График и точка'],[2,'Формула']])],initial:[24,48,0]};
 if(lesson?.id==='p19'&&task?.hobbySurvey)return {title:'Столбцы опроса об увлечениях',controls:[c('Данные',[[0,'Из учебника'],[1,'Ещё три ответа за чтение']]),c('Категория',hobbyNames.map((n,i)=>[i,n])),c('Проверка',[[0,'Сниму высоту'],[1,'Значение'],[2,'Все ответы']])],initial:[0,0,0]};
 if(lesson?.id==='p19'&&task?.legoSurvey)return {title:'Из голосов в проценты',controls:[c('Данные',[[0,'Из учебника'],[1,'Один голос из Френдс переходит в Ниндзяго']]),c('Серия',toyNames.map((n,i)=>[i,n])),c('Проверка',[[0,'Сначала посчитаю'],[1,'Процент'],[2,'Линейная диаграмма']])],initial:[0,0,0]};
 if(lesson?.id==='p19'&&Number.isInteger(task?.gapDirection))return {title:'Промежуток между двумя машинами',controls:[c('Начальное расстояние, км',[100,120]),c('Время, ч',range(0,3)),c('Проверка',[[0,'Покажи положение машин'],[1,'Найти расстояние'],[2,'Обратные формулы']])],initial:[100,0,0]};
 if(lesson?.id==='p19'&&Number.isInteger(task?.quantityFamily)){
  return task.quantityFamily<2?{title:task.quantityFamily?'Часть и основание процентного отношения':'Собственная скорость и течение',controls:[task.quantityFamily?c('Часть A',[12,18,24]):c('Скорость течения, км/ч',[2,3,4]),c('Проверка',[[0,'Условие'],[1,'Прямая зависимость'],[2,'Обратная зависимость']])],initial:task.quantityFamily?[12,0]:[2,0]}:
   {title:task.quantityFamily===2?'Равные прибавки по периодам':'Начисление на текущее значение',controls:[c('Ставка, %',[10,20]),c('Число периодов',[1,2,3]),c('Показать',[[0,'Сначала рассчитаю'],[1,'По периодам'],[2,'Итог и восстановление начального']])],initial:[10,2,0]};
 }
 if(lesson?.id==='p19'&&Number.isInteger(task?.geometryQuantity))return {title:'Свяжи размеры фигуры',controls:[c(task.geometryQuantity===2?'Радиус, см':task.geometryQuantity===9?'Площадь основания, см²':'Размер a, см',task.geometryQuantity===9?[6,10,12]:task.geometryQuantity===6?[3,6,8]:[3,4,5]),c('Проверка',[[0,'Схема'],[1,'Известные размеры'],[2,'Формула и результат']])],initial:[task.geometryQuantity===9?10:task.geometryQuantity===6?6:3,0]};
 if(lesson?.id==='p19'&&task?.productUnits){
  const t=task.productUnits,items={own:['Количество предметов',[5,6,8]],books:['Цена одной тетради, р.',[20,25,30]],typing:['Страниц за час',[20,30,40]],salt:['Масса раствора, г',[100,150,200]],telegram:['Число слов',[5,10,20]]}[t];
  return {title:'Свяжи формулу с единицами измерения',controls:[c(items[0],items[1]),c('Проверка',[[0,'Сначала запишу'],[1,'Состав величин'],[2,'Значение и проверка']])],initial:[items[1][0],0]};
 }
 if(lesson?.id==='p19'&&task?.unitBlanks)return {title:'Какая единица пропущена?',controls:[c('Набор',[[0,'Из таблицы'],[1,'Новые величины']]),c('Строка',[1,2,3,4]),c('Подсказка',[[0,'Сначала подберу'],[1,'Открыть ячейку']])],initial:[0,1,0]};
 if(lesson?.id==='p19'&&task?.approachFormula)return {title:'Как исчезает начальный промежуток?',controls:[c('Данные',[[0,'Из условия'],[1,'Новое расстояние или время']]),c('Момент',[[0,'Старт'],[1,'Половина времени'],[2,'Встреча']]),c('Сверка',[[0,'Сначала решу'],[1,'Скорость сближения'],[2,'Ответ и единицы']])],initial:[0,0,0]};
 if(lesson?.id==='p37'&&task?.remainingStory){
  const tag=task.remainingStory,first=tag==='fuel'?['По 6 л','По 5 л']:tag==='park'?['94 липы','88 лип']:['140 т картофеля','128 т картофеля'];
  return {title:tag==='fuel'?'Две канистры':tag==='park'?'Состав деревьев в парке':'Остатки на овощной базе',controls:[c('Данные',first.map((x,i)=>[i,x])),...(tag==='park'?[]:[tag==='fuel'?c('Когда?',[[0,'До отбора'],[1,'После отбора']]):c('День',range(0,8))]),c('Показать',[[0,'Сначала составлю уравнение'],[1,'Таблицу'],[2,'Проверку']])],initial:tag==='park'?[0,0]:[0,0,0]};
 }
 if(['p19','p37'].includes(lesson?.id)&&task?.expressionGroup)return {title:'Дерево арифметических действий',controls:[c('Условие',[[0,'По учебнику'],[1,'Удвоить первый операнд']]),c('Действий выполнено',range(0,expressionStages(task.expressionGroup.tree,false).steps.length))],initial:[0,0]};
 if(lesson?.id==='p37'&&task?.percentDoubleFraction)return {title:'Сложные дроби и прибавка в процентах',controls:[c('Увеличение, %',[100,200,300]),c('Разобрать',[[0,'Условие'],[1,'Числители и знаменатели'],[2,'Большие дроби'],[3,'После увеличения']])],initial:[300,0]};
 if(lesson?.id==='p37'&&task?.threeDigits)return {title:'Три цифры и разные записи',controls:[c('Цифра',[1,2,4]),c('Конструкция',[[0,'Три цифры рядом'],[1,'Двузначное в степени'],[2,'Цифра в двузначной степени'],[3,'Башня степеней']])],initial:[task.threeDigits,0]};
 if(lesson?.id==='p37'&&task?.lifeTimeline)return {title:'Возраст Диофанта на временной линии',controls:[c('До рождения сына, лет',[5,14,23]),c('Разбор',[[0,'Сначала составлю уравнение'],[1,'Доли всей жизни'],[2,'Периоды по годам']])],initial:[5,0]};
 if(lesson?.id==='p37'&&task?.fractionRoutes)return {title:'Два операнда на одном маршруте',controls:[c('Верхний узел',task.fractionRoutes.upper.map((x,i)=>[i,x]).concat(task.fractionRoutes.upper.map((x,i)=>[3+i,'Новый набор: '+root.PetersonMath.answer(root.PetersonMath.operation('add',x,1))]))),c('Нижний узел',task.fractionRoutes.lower.map((x,i)=>[i,x])),c('Ответ',[[0,'Сначала посчитаю'],[1,'Сверить результат']])],initial:[0,0,0]};
 if(lesson?.id==='p37'&&task?.mixedRule)return {title:'Пересчитай целое в равные доли',controls:[c('Целая часть',[2,3,4]),c('Знаменатель',[3,5,7]),c('Показать',[[0,'Модель числа'],[1,'Сосчитать доли']])],initial:[2,3,0]};
 if(lesson?.id==='p37'&&task?.mixedSeries)return {title:'Две закономерности одной дроби',controls:[c('Номер члена',range(1,7)),c('Начальный числитель',[4,5]),c('Проверка',[[0,'Сначала продолжу'],[1,'Дробь и целая часть']])],initial:[1,4,0]};
 if(lesson?.id==='p37'&&task?.rationalChain)return {title:'Запиши промежуточный результат точно',controls:[c('Данные',[[0,'Из книги'],[1,'Первое число вдвое больше по модулю']]),c('Выполни действий',range(0,task.rationalChain.ops.length))],initial:[0,0]};
 if(lesson?.id==='p37'&&task?.fractionCompare)return {title:'Сравни две дроби',controls:[c('Порядок',[[0,'Из книги'],[1,'Поменять местами'],[2,'Добавить слева одну долю']]),c('Проверка',[[0,'Сначала сравню'],[1,'Способ'],[2,'Ответ']])],initial:[0,0]};
 if(lesson?.id==='p37' && task?.papyrusBlock)return {title:'Повторяющийся блок и две трети',controls:[c('Правая часть',[10,20,30]),c('Этап',[[0,'Условие'],[1,'Значение блока B'],[2,'Найти x и проверить']])],initial:[10,0]};
 if(lesson?.id==='p37' && task?.directedCycle)return {title:'Двигайся по стрелкам от стартового числа',controls:[c('Старт',[[0,'Из книги'],[1,'Новые данные']]),c('Сколько действий выполнить?',range(0,6))],initial:[0,0]};
 if(lesson?.id==='p37' && task?.operationRole)return {title:'Неизвестный компонент действия',controls:[c('Условие',[[0,'Исходное'],[1,'Удвоить результат']]),c('Разбор',[[0,'Сначала решу'],[1,'Правило'],[2,'Проверка ответа']])],initial:[0,0]};
 if(lesson?.id==='p37' && task?.equationSituation)return situationConfig(task.equationSituation);
 if(lesson?.id==='p37' && task?.linearEquationStudy){
  const item=task.linearEquationStudy,inputs=linearBalanceCandidates(item);
  return {title:'Сохрани равенство обеих частей',controls:[c('Уравнение',[[0,'Из упражнения'],[1,'Новое условие']]),c('Пробное значение',inputs.map((v,i)=>[i,v])),c('Как проверить?',[[0,'Сначала решу'],[1,'После раскрытия'],[2,item.clear?'Целые коэффициенты':'Собрать слагаемые'],[3,'Проверить подстановку'],[4,'Полное решение']])],initial:[0,inputs.indexOf('0'),0]};
 }
 if(lesson?.id==='p18' && task?.reviewRatio)return {title:task.reviewRatio.percent?'Первая величина в процентах от второй':'Отношение и его значение',controls:[c('Данные',[[0,'Исходные'],[1,'Удвоить первый член']]),c('Разбор',[[0,'Сначала решу'],[1,'Дробь'],[2,'Итог']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.cancelRatio)return {title:'Сокращение буквенного множителя',controls:[c('Значение a',[-2,0,1,3]),c('Значение b',[-3,0,3,6]),c('Подстановка',[[0,'Сначала упрости'],[1,'Сравнить']])],initial:[1,6,0]};
 if(lesson?.id==='p18' && task?.reviewMap)return {title:'Карта и расстояние по одному масштабу',controls:[c('Данные',[[0,'Из учебника'],[1,'Новые расстояния']]),c('Расчёт',[[0,'Сначала решу'],[1,'Сантиметр карты'],[2,'Три величины']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.reviewPercentageWord)return {title:'Проверь буквенное выражение на числах',controls:[c('Пример',[[0,'Первый'],[1,'Другие числа']]),c('Проверка',[[0,'Сначала составлю'],[1,'Промежуточное значение'],[2,'Подстановка']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.reviewArithmetic)return {title:'Порядок действий и точные промежуточные дроби',controls:[c('Числа',[[0,'Из упражнения'],[1,'Новый пример']]),c('До какого шага?',range(0,task.reviewArithmetic===1?4:6))],initial:[0,0]};
 if(lesson?.id==='p18' && task?.tariffStudy)return {title:'Постоянная прибавка от первого тарифа',controls:[c('Первый тариф',[6000,8000]),c('Разряд',range(1,9)),c('Сравнение',[[0,'Сначала решу'],[1,'Сумма и отношение'],[2,'Процент изменения']])],initial:[8000,1,0]};
 if(lesson?.id==='p18' && task?.scoreRanking)return {title:'Средние баллы и порядок коэффициентов',controls:[c('Строка',task.scoreRanking.map(([l],i)=>[i,(i+1)+' · '+l])),c('Таблица',[[0,'Из упражнения'],[1,'Другие баллы первой строки']]),c('Проверка',[[0,'Сначала решу'],[1,'Коэффициент'],[2,'Порядок всех строк']])],initial:[0,0,0]};
 if(lesson?.id==='p18' && task?.triangleSection)return {title:'Сечение треугольника параллельно основанию',controls:[c('Треугольник',[[0,'Вершина справа'],[1,'Вершина слева']]),c('Доля AM от AB',[[0,'1/3'],[1,'1/2'],[2,'2/3']]),c('Измерения',[[0,'Только чертёж'],[1,'Четыре длины'],[2,'Пропорции']])],initial:[0,0,0]};
 if(lesson?.id==='p18' && task?.classParts)return {title:'Раздели класс на равные двенадцатые',controls:[c('Сверх четверти класса',[3,4,5]),c('Этап',[[0,'Сначала решу'],[1,'Доли'],[2,'Группы целиком']])],initial:[3,0]};
 if(lesson?.id==='p18' && task?.simpleMonths)return {title:'Ежемесячный простой процент',controls:[c('Вклад',[[0,'Исходный'],[1,'Новые суммы']]),c('Этап',[[0,'Условие'],[1,'Прибавка за месяц'],[2,'Обе ставки']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.gridDivision)return {title:'Исследуй форму и площадь разрезов',controls:[c('Разрез',[[0,'Только фигура'],[1,'Первый вариант'],[2,'Второй вариант'],[3,'Проверить спорный разрез']]),c('Выделить часть',[[0,'Все'],...range(1,task.gridDivision==='pentomino'?3:8).map(v=>[v,'Часть '+v])]),c('Проверка',[[0,'Мой прогноз'],[1,'Размеры и условия']])],initial:[0,0,0]};
 if(lesson?.id==='p18' && task?.fiveMultiples)return {title:'Пять чисел из одного набора цифр',controls:[c('Карточки',[[0,'С нулём'],[1,'Без нуля']]),c('Первое число',range(1,19)),c('Проверка',[[0,'Сначала составлю'],[1,'Проверить каждую цифру']])],initial:[0,10,0]};
 if(lesson?.id==='p18' && task?.missingOperation)return {title:'Подбери действие по точному ответу',controls:[c('Данные',[[0,'Из упражнения'],[1,'Новые числа']]),c('Операция',operationSigns.map((v,i)=>[i,v])),c('Сравнение',[[0,'Проверю сам'],[1,'Вычислить']])],initial:[0,0,0]};
 if(lesson?.id==='p18' && task?.wholeFromExtras)return {title:'Известное количество и оставшаяся доля',controls:[c('Добавки',[[0,'Исходные'],[1,'Вдвое больше']]),c('Этап',[[0,'Условие'],[1,'Остаток доли'],[2,'Целое и его части']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.outputRates)return {title:'Процент всегда относится к своей базе',controls:[c('Набор чисел',[[0,'Исходные'],[1,'Другой пример']]),c('Этап',[[0,'Предскажу'],[1,'Промежуточные числа'],[2,'Сравнение']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.derivedProof)return {title:'Проверь область определения каждой записи',controls:[c('Значения букв',validationQuartets.map((v,i)=>[i,v.label])),c('Что проверить?',[[0,'Сначала рассуждаю'],[1,'Знаменатели и равенство'],[2,'Общее доказательство']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.deriveThree)return {title:'Три производные из одной пропорции',controls:[c('Данные',[[0,'Из учебника'],[1,'Пример с числами 5, 3, 20, 12']]),c('Преобразование',[[0,'Прибавить 1'],[1,'Разность с единицей'],[2,'Доля числителя в сумме']]),c('Проверка',[[0,'Составлю сам'],[1,'Новая запись']])],initial:[0,0,0]};
 if(lesson?.id==='p18' && task?.parallelIntercept)return {title:'Соответственные отрезки на двух лучах',controls:[c('Угол',[[20,'20°'],[35,'35°'],[50,'50°']]),c('Отношение длин B к C',[[0,'3/2'],[1,'2'],[2,'5/2']]),c('Какие длины измерить?',[[0,'Между 1 и 2'],[1,'Между 2 и 3'],[2,'От 1 до 3']])],initial:[20,1,0]};
 if(lesson?.id==='p18' && task?.thalesCipher)return {title:'Девять проверок для имени учёного',controls:[c('Буква',task.thalesCipher.map(([l],i)=>[i,l])),c('Проверка',[[0,'Сначала вычислю'],[1,'Сравнение дробей'],[2,'Историческая справка']])],initial:[0,0]};
 if(lesson?.id==='p18' && task?.sourceRearrangement)return {title:'Какие из 24 перестановок сохраняют равенство?',controls:[c('Порядок четырёх мест',quartetOrders.map((v,i)=>[i,v.map(j=>String.fromCharCode(65+j)).join(' · ')])),c('Значения',[[0,'Исходные'],[1,'Новые числа']]),c('Проверка',[[0,'Составлю сам'],[1,'Перекрёстные произведения'],[2,'Все допустимые записи']])],initial:[0,0,0]};
 if(lesson?.id==='p18' && task?.constantRateStory)return {title:'Две величины при одном коэффициенте',controls:[c('Данные',[[0,'Первый пример'],[1,'Другой коэффициент и числа']]),c('Что сравнить?',[[0,'Посчитаю сам'],[1,'Обе величины'],[2,'Отношения']])],initial:[0,0]};
 if(lesson?.id==='p36' && task?.quantifiedEquation){const pair=task.quantifiedEquation==='nonzeroProduct';return {title:'Свидетель и контрпример',controls:[c('Число a',range(-3,3)),...(pair?[c('Число b',range(-2,2))]:[]),c('Проверка',[[0,'Сначала сформулирую'],[1,'Подстановка'],[2,'Общая формулировка']])],initial:pair?[1,1,0]:[1,0]};}
 if(['p18','p36'].includes(lesson?.id) && task?.storyBalance)return {title:'Одна операция на обеих чашах',controls:[c('Задача',[[0,'Из книги'],[1,'Новые данные']]),c('Мой кандидат',balanceInputs(task).map((v,i)=>[i,v])),c('Состояние равенства',[[0,'Исходное'],[1,'Первое преобразование'],[2,'Перенос слагаемых'],[3,'Результат и проверка']])],initial:[0,1,0]};
 if(['p36','p37'].includes(lesson?.id) && task?.naturalTrials)return {title:'Испытай натуральное число',controls:[c('Правая часть',[[0,String(task.naturalTrials.rhs)],[1,String(extraTrials[task.naturalTrials.rule])]]),c('Кандидат x',range(1,17)),c('Подстановка',[[0,'Предскажу'],[1,'Вычислить'],[2,'Границы перебора']])],initial:[0,1,0]};
 if(lesson?.id==='p36' && task?.finalRootFamily)return {title:'Проверка и полнота множества решений',controls:[c('Подставить',endFamilyCandidates.map((v,i)=>[i,v])),c('Разбор',[[0,'Сначала решу'],[1,'Проверить число'],[2,'Общее решение']])],initial:[4,0]};
 if(lesson?.id==='p36' && task?.newtonCapital)return {title:'Три года счёта купца',controls:[c('Годовой расход',[50,100]),c('Начальная сумма',[740,1000,1200,1480]),c('Сколько лет проверить?',range(0,3))],initial:[100,1200,0]};
 if(lesson?.id==='p36' && task?.identityProof)return {title:'Что показывает подстановка, а что доказывает общий закон?',controls:[c('Подставить x',range(-4,4)),c('Разбор',[[0,'Сначала исследую'],[1,'Пара значений'],[2,'Общий закон']])],initial:[0,0]};
 if(lesson?.id==='p36' && task?.rootFamily)return {title:'Какие значения дают равенство?',controls:[c('Проверить число',familyCandidates.map((v,i)=>[i,v])),c('Проверка',[[0,'Сначала решу'],[1,'Значения частей'],[2,'Полный ответ']])],initial:[4,0]};
 if(lesson?.id==='p36' && Number.isInteger(task?.rootDomain))return {title:'Нули произведения и числовое множество',controls:[c('Уравнение',[[0,'Из упражнения'],[1,'Новый пример']]),c('Множество',domainNames.map((v,i)=>[i,v])),c('Что показать?',[[0,'Сначала решу'],[1,'Нули множителей'],[2,'Отбор по множеству']])],initial:[0,task.rootDomain,0]};
 if(lesson?.id==='p36' && task?.inverseChain)return {title:'Две цепочки дают одинаковый результат',controls:[c('Стартовое число',[36,48,72]),c('Стрелка',range(1,6)),c('Проверка шага',[[0,'Посчитаю сам'],[1,'Обе операции']])],initial:[36,1,0]};
 if(lesson?.id==='p36' && task?.unarySequence)return {title:'Сначала внутреннее действие',controls:[c('Число x',[-3,-2,-1,0,1,2,3]),c('Результат',[[0,'Предположу'],[1,'Вычислить']])],initial:[-2,0]};
 if(lesson?.id==='p36' && task?.equationNotation)return {title:'Чем связаны части записи?',controls:[c('Запись',[[0,'Из упражнения'],[1,'Новая']]),c('Что проверить?',[[0,'Сначала решу'],[1,'Знак'],[2,'Знак и переменная']])],initial:[0,0]};
 if(lesson?.id==='p36' && task?.rootProbe)return {title:'Подстановка в левую и правую часть',controls:[c('Значение буквы',rootProbeValues.map((v,i)=>[i,v])),c('Вычисления',[[0,'Сначала вычислю'],[1,'Обе части'],[2,'Вывод']])],initial:[rootProbeValues.indexOf(task.rootProbe.initial),0]};
 if(lesson?.id==='p36' && task?.rootCount)return {title:'Проверь число и допустимость',controls:[c('Подстановка',range(-6,7)),c('Вопрос',[[0,'Сначала решу'],[1,'Вычисление'],[2,'Вывод для одного числа']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.ratioRectangle)return {title:'Четыре и семь частей стороны',controls:[c('Большая сторона, см',[[0,'31,5'],[1,'42'],[2,'35']]),c('Расчёты',[[0,'Сначала решу'],[1,'Стороны'],[2,'Периметр и площадь']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.roadMeeting)return {title:'Скорости навстречу в долях маршрута',controls:[c('Условия',[[0,'145 км, 2,5 ч, +50%'],[1,'100 км, 2,5 ч, +50%'],[2,'120 км, 3 ч, +25%']]),c('Расчёты',[[0,'Сначала решу'],[1,'Скорости'],[2,'Встреча']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.fixedRectangle)return {title:'Площадь постоянна, стороны меняются',controls:[c('Площадь, см²',[12,24]),c('Сторона a, см',[[0,'1'],[1,'1,5'],[2,'2'],[3,'3'],[4,'4'],[5,'8'],[6,'12']]),c('График',[[0,'Моя точка'],[1,'Таблица и кривая']])],initial:[12,0,0]};
 if(lesson?.id==='p17' && task?.diameterAngle)return {title:'Угол, опирающийся на диаметр',controls:[c('Радиус, см',[3,4,5]),c('Положение точки C',[30,60,90,120,150,210,270,315]),c('Проверка',[[0,'Сначала измерю'],[1,'Сверить угол']])],initial:[3,60,0]};
 if(lesson?.id==='p17' && task?.proportionExpressions)return {title:'Четыре вычисления перед составлением пропорции',controls:[c('Выражение',[[0,'A'],[1,'B'],[2,'C'],[3,'D']]),c('До какого этапа?',[[0,'Условие'],[1,'Промежуточные значения'],[2,'Ответ']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.pandigitalStudy)return {title:'Проверь десятизначное число по окончанию',controls:[c('Делитель',[36,18]),c('Последние две цифры',distinctEndings.map(n=>[n,String(n).padStart(2,'0')])),c('Сравнить',[[0,'Мой вариант'],[1,'Признаки делимости'],[2,'Наименьшее число']])],initial:[36,89,0]};
 if(lesson?.id==='p17' && task?.reverseSquare)return {title:'Сравни квадрат и перевёрнутую запись',controls:[c('Исходная цифра',range(5,9)),c('Вместо квадрата',[[2,'Удвоить'],[3,'Утроить']]),c('Проверка',[[0,'Сначала вычислю'],[1,'Сравнить цифры']])],initial:[5,2,0]};
 if(lesson?.id==='p17' && task?.classOrderStudy)return {title:'Проверь все три пары спортивных прогнозов',controls:[c('Порядок мест',quartetOrders.map((v,i)=>[i,v.map(x=>['А','Б','В','Г'][x]).join(' · ')])),c('Прогнозы',[[0,'Из задачи'],[1,'Смена букв А и Б']]),c('Сравнение',[[0,'Сначала проверю'],[1,'Все три пары']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.boatGap)return {title:'Два катера на одной прямой',controls:[c('Пристани и скорости',[[0,'60 км; 7 и 5 км/ч'],[1,'75 км; 9 и 6 км/ч']]),c('Время, ч',range(0,4)),c('Результат',[[0,'Сначала посчитаю'],[1,'Проверю промежуток']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.fallCurve)return {title:'Расстояние за первые пять секунд',controls:[c('Время',range(0,10).map(v=>[v,num(v/2)+' с'])),c('График',[[0,'Точки таблицы'],[1,'Добавить кривую'],[2,'Значение в выбранный момент']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.currencyCipher)return {title:'Узнай валюту по двенадцати сравнениям',controls:[c('Буква строки',task.currencyCipher.map(([letter],i)=>[i,letter])),c('Что показать?',[[0,'Исходные отношения'],[1,'Проверка строки'],[2,'Страны и коды']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.copyDrawing)return {title:'Перестрой чертёж в нужном масштабе',controls:[c('Множитель',[[0,'Из упражнения'],[1,'Другой пример']]),c('Чертёж',[[0,'Данный'],[1,'После преобразования']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.proportionClaim)return {title:'Подстановка и утверждение для всех чисел',controls:[c('Пример',[[0,'Первый'],[1,'Второй'],[2,'Третий']]),c('Разбор',[[0,'Сначала проверю'],[1,'Вычисления'],[2,'Что показывает пример']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.twoPercentBases)return {title:'Что здесь принято за сто процентов?',controls:[c('Пара чисел',[[0,'28 и 35'],[1,'30 и 50'],[2,'36 и 48']]),c('Направление',[[0,'От большего к меньшему'],[1,'От меньшего к большему']]),c('Сравнение',[[0,'Сначала проверю'],[1,'Отношение и изменение']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.percentTransform)return {title:'Доля результата и процент изменения',controls:[c('Исходное число',[60,120,300]),c('Разбор',[[0,'Сначала посчитаю'],[1,'Новое значение'],[2,'Изменение']])],initial:[60,0]};
 if(lesson?.id==='p17' && task?.motionPercent==='meeting')return {title:'Что значит «быстрее»?',controls:[c('Изменяем',[[0,'Время пути'],[1,'Скорость']]),c('Маршрут и изменение',[[0,'36 км, 40%'],[1,'54 км, 40%'],[2,'30 км, 25%']]),c('Проверка',[[0,'Сначала решу'],[1,'Таблица скоростей'],[2,'Момент встречи']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.motionPercent)return {title:task.motionPercent==='motorcycle'?'Общий план для двух скоростей':'Разность скоростей при движении в одном направлении',controls:[c('Данные',[[0,'Из задачи'],[1,'Второй пример'],[2,'Третий пример']]),c('Проверка',[[0,'Сначала решу'],[1,'Промежуточные величины'],[2,'Результат']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.similarPentagon)return {title:'Один множитель для пяти сторон',controls:[c('Увеличение',[[0,'Как в задаче'],[1,'Другая копия']]),c('Длины на чертеже',[[0,'Только данные'],[1,'Сверить все стороны']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.alloyParts)return {title:'Семь равных долей сплава',controls:[c('Масса',[[0,'Как в задаче'],[1,'Другая масса']]),c('Показать',[[0,'Только доли'],[1,'Масса одной доли'],[2,'Обе массы']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.circleRatio)return {title:'Диаметр и приближённая длина окружности',controls:[c('Данные',[[0,'Как в задаче'],[1,'Новая длина']]),c('Результат',[[0,'Сначала вычислю'],[1,'Без округления в модели'],[2,'С округлением до десятых']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.crossedChords)return {title:'Три опыта с пересечением хорд',controls:[c('Построение',[[0,'Первое'],[1,'Второе'],[2,'Третье']]),c('Сравнение',[[0,'Чертёж'],[1,'Части хорд'],[2,'Произведения и пропорция']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.oddExpressions)return {title:'Проверь правило на разных числах',controls:[c('Подстановка',[-2,0,1,2,3]),c('Что сравнить?',[[0,'Прогноз'],[1,'Значения'],[2,'Общий вид']])],initial:[0,0]};
 if(['p17','p18','p19','p37'].includes(lesson?.id) && task?.affineRatios)return {title:'Проверь обе стороны при выбранном числе',controls:[c('Уравнение',[[0,'Из упражнения'],[1,'Со сдвигом неизвестного']]),c('Пробное число',affineRatioCandidates(task).map((v,i)=>[i,v])),c('Способ проверки',[[0,'Сначала вычислю'],[1,'Два отношения'],[2,'Два произведения']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.linkedRatios)return {title:'От второй пропорции к первой',controls:[c('Данные',[[0,'Из упражнения'],[1,'Новая вторая пропорция']]),c('Вычисления',[[0,'Сначала решу'],[1,'Промежуточное y'],[2,'Пара x и y']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.reorderSymbols)return {title:'Обе диагонали после перестановки',controls:[c('Расположение букв',range(1,8)),c('Проверка',[[0,'Ненулевые буквы'],[1,'Нулевые числители']])],initial:[1,0]};
 if(lesson?.id==='p17' && task?.copierRatio)return {title:'Оригинал и копия в одном масштабе',controls:[c('Данные',[[0,'Из упражнения'],[1,'Новая длина']]),c('Сравнение',[[0,'Сначала решу'],[1,'Вычисления и чертёж']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.codedRatios)return {title:'Проверь строку шифра',controls:[c('Строка',task.codedRatios.map(([letter],i)=>[i,letter])),c('Сравнить',[[0,'Сначала вычислю'],[1,'Два произведения'],[2,'Хорда на окружности']])],initial:[0,0]};
 if(['p17','p18'].includes(lesson?.id) && task?.missingRatio)return {title:'Подставь число на место неизвестного',controls:[c('Числа',[[0,'Из задачи'],[1,'Новый пример']]),c('Пробное число',ratioCandidates(task).map((v,i)=>[i,v])),c('Проверка',[[0,'Сначала вычислю'],[1,'Сравню отношения'],[2,'Сравню произведения']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.ratioCollection){
  const labels=task.ratioCollection.map((terms,i)=>[i,'№'+(i+1)+' · '+terms.map(v=>root.PetersonMath.answer(root.PetersonMath.parse(v))).join(' : ')]);
  return {title:'Подбери равные отношения из списка',controls:[c('Левое отношение',labels),c('Правое отношение',labels),c('Проверка',[[0,'Сначала сравню'],[1,'Частные'],[2,'Произведения']])],initial:[0,1,0]};
 }
 if(lesson?.id==='p17' && task?.symbolProportion)return {title:'Какие символы перемножают?',controls:[c('Четыре позиции',[[0,'Буквенная запись'],[1,'Числовой пример']]),c('Проверка',[[0,'Сначала запишу'],[1,'Пары в произведениях']])],initial:[0,0]};
 if(lesson?.id==='p17' && task?.fourPlaces)return {title:'Проверь любую расстановку четырёх чисел',controls:[c('Порядок позиций',quartetOrders.map((order,i)=>[i,order.map(v=>v+1).join(' · ')])),c('Данные',[[0,'Из задачи'],[1,'Изменить четвёртое число']]),c('Проверка',[[0,'Сначала сравню'],[1,'Частные'],[2,'Произведения']])],initial:[0,0,0]};
 if(lesson?.id==='p17' && task?.ratioTarget)return {title:'Две свои дроби с одним значением',controls:[c('Множитель слева',range(1,8)),c('Множитель справа',range(1,8)),c('Какое отношение?',[[0,'Из задания'],[1,'Обратное']])],initial:[2,5,0]};
 if(lesson?.id==='p16' && task?.scaleExamples)return {title:task.scaleExamples.title,controls:[c('Условие',[[0,'Первый пример'],[1,'Другой пример']]),c('Проверка',[[0,'Сначала решу'],[1,'Сверю объяснение']])],initial:[0,0]};
 if(lesson?.id==='p16' && task?.crossScale)return {title:'Подставь x в оба перекрёстных произведения',controls:[c('Пропорция',[[0,'Из задачи'],[1,'С изменённым числом']]),c('Проверяем x',[-1,0,1].map((v,i)=>[i,root.PetersonMath.answer(root.PetersonMath.operation('multiply',task.crossScale.solution,v===-1?'1/2':v===0?1:2))])),c('Произведения',[[0,'Сначала посчитаю'],[1,'Сверю']])],initial:[0,0,0]};
 if(lesson?.id==='p16' && task?.ownMapStudy)return {title:'Один маршрут на трёх картах',controls:[c('Карта',[[0,'1 : 1 000 000'],[1,'1 : 2 000 000'],[2,'1 : 3 000 000']]),c('Маршрут',[[0,'Между A и Б'],[1,'Новая пара городов']]),c('Расстояние',[[0,'Сначала измерю'],[1,'Сверю']])],initial:[0,0,0]};
 if(lesson?.id==='p16' && task?.ownRoomStudy)return {title:'Размеры и ориентиры плана комнаты',controls:[c('Комната',[[0,'5 на 4 м'],[1,'6 на 3 м']]),c('Масштаб',[[0,'1 : 50'],[1,'1 : 100'],[2,'1 : 200']]),c('Размеры на листе',[[0,'Сначала переведу'],[1,'Сверю']])],initial:[0,0,0]};
 if(lesson?.id==='p16' && task?.ladderStudy)return {title:'Сравни уклоны лестниц',controls:[c('Лестницы',[[0,'Из задачи'],[1,'Другая пара']]),c('Вычисление',[[0,'Сначала сравню'],[1,'Сверю крутизну']])],initial:[0,0]};
 if(lesson?.id==='p16' && task?.squareGridStudy){
  const size=task.squareGridStudy,positions=range(0,10-size).map(i=>[i,String(i+1)]);
  const groups=size===2?['Первая диагональ','Вторая диагональ']:['Диагональ ↘','По строкам: 1, 3, 2','По строкам: 2, 1, 3','По строкам: 2, 3, 1','По строкам: 3, 1, 2','Диагональ ↙','Средняя строка','Средний столбец'];
  return {title:'Передвинь квадрат по таблице сотни',controls:[c('Начальная строка',positions),c('Начальный столбец',positions),c('Сравниваемая группа',groups.map((label,index)=>[index,label])),c('Сумма',[[0,'Сначала сложу'],[1,'Проверю']])],initial:[0,0,0,0]};
 }
 if(lesson?.id==='p16' && task?.gardenPlan)return {title:'Дом и ворота на плане',controls:[c('Дом',[[0,'В центре'],[1,'Сдвинут влево'],[2,'Сдвинут вверх']]),c('Ворота',[[0,'В середине стороны'],[1,'Левее середины'],[2,'Правее середины']])],initial:[1,1]};
 if(lesson?.id==='p16' && task?.classroomPlan){const measure=range(20,160).map(v=>[v,num(v/10)+' м']);return {title:'От измеренной стены к плану',controls:[c('Длина кабинета',measure),c('Ширина кабинета',measure)],initial:[84,62]};}
 if(lesson?.id==='p16' && task?.scaleTransfer)return {title:'Сохрани отношение длин',controls:[c('Исходные данные',[[0,'Из задачи'],[1,'Другие длины']]),c('Проверка',[[0,'Сначала решу'],[1,'Покажи перевод']])],initial:[0,0]};
 if(lesson?.id==='p16' && Object.hasOwn(sequenceChecks,task?.patternStudy))return {title:'Какой переход нарушил правило?',controls:[c('Ряд',[[0,'Из книги'],[1,'Новый ряд']]),c('Проверка',[[0,'Сначала найду'],[1,'Сверю переход']])],initial:[0,0]};
 if(lesson?.id==='p16' && task?.gearRatio){const gears=range(3,24).map(n=>n*5);return {title:'Подбери зубчатые колёса',controls:[c('Зубцов у первой',gears),c('Зубцов у второй',gears),c('Цель',[[0,'Как в задаче'],[1,'Обратное отношение']])],initial:[15,15,0]};}
 if(lesson?.id==='p16' && task?.commissionStudy)return {title:'Рубли и процентная ставка',controls:[c('Продажи',[[0,'Из задачи'],[1,'Другие цены']]),c('Что сравнить?',[[0,'Сначала вычислю'],[1,'Процент'],[2,'Сумму платежа']])],initial:[0,0]};
 if(lesson?.id==='p16' && task?.roadSlope)return {title:'Горизонталь и перепад высоты',controls:[c('Участок дороги',[[0,'Из задачи'],[1,'Новые данные']]),c('Расчёт',[[0,'Сначала решу'],[1,'Сверю ответ']])],initial:[0,0]};
 if(lesson?.id==='p16' && Number.isInteger(task?.cityMap))return {title:'Измеряем расстояние от Москвы',controls:[c('Город',mapCities.map(([name],i)=>[i,name])),c('Линейка',[[0,'Сначала измерю'],[1,'Сниму показание'],[2,'Сверю расстояние']])],initial:[task.cityMap,0]};
 if(lesson?.id==='p16' && task?.parcelScale)return {title:'План участка с вырезом',controls:[c('Размеры участка',[[0,'По рисунку книги'],[1,'Новый участок']]),c('Что сравнить?',[[0,'Сначала измерю'],[1,'Площадь и вырез'],[2,'Периметр']])],initial:[0,0]};
 if(lesson?.id==='p16' && task?.flatScale)return {title:'Измеряем помещения на плане',controls:[c('Помещение',flats.map((room,i)=>[i,room.name])),c('Масштаб рисунка',[[0,'1 : 200 (из упражнения)'],[1,'1 : 300 (другой дом)']]),c('Расчёт',[[0,'Сначала решу'],[1,'Сверю размеры и площадь']])],initial:[0,0,0]};
 if(lesson?.id==='p16' && Object.hasOwn(scaleReadings,task?.scaleReading)){
  const spec=scaleReadings[task.scaleReading];return {title:'Две шкалы для одного отрезка',controls:[c('Измерение',spec.titles.map((title,i)=>[i,title])),c('Показ расчёта',[[0,'Сначала посчитаю'],[1,'Сверю единицы и ответ']])],initial:[0,0]};
 }
 if(lesson?.id==='p33' && task?.midpointStudy)return {title:'Два корня на равном расстоянии',controls:[c('Центр и радиус',[[0,'Из упражнения'],[1,'Новые числа']]),c('Координаты',[[0,'Сначала отмечу сам'],[1,'Сверю отметки']])],initial:[0,0]};
 if(lesson?.id==='p33' && task?.lineRelation)return {title:'Сравни направления двух прямых',controls:[c('Расположение',[[0,'Исходная схема'],[1,'Новая схема']]),c('Пара',planePairs.map((pair,i)=>[i,pair])),c('Свойство',[[0,'Сначала назову'],[1,'Сверю пару']])],initial:[0,0,0]};
 if(lesson?.id==='p33' && task?.letterStudy)return {title:'Буква и значение выражения',controls:[c('Буква',task.letterStudy.map((item,i)=>[i,item.letter])),c('Значение переменной',[[0,'Из задания'],[1,'Новое число']]),c('Что открыть?',[[0,'Сначала посчитаю'],[1,'Сверю значение'],[2,'Сверю определение']])],initial:[0,0,0]};
 if(lesson?.id==='p33' && task?.verifyEquation)return {title:'Проверка корня подстановкой',controls:[c('Уравнение',[[0,'Из задачи'],[1,'С другой правой частью']]),c('Проверяемое значение',[[0,'Ноль'],[1,'Исходный корень'],[2,'На два больше исходного корня']])],initial:[0,0]};
 if(lesson?.id==='p33' && task?.circusStudy)return {title:'Четыре группы артистов',controls:[c('Всего артистов',[[0,'28'],[1,'34']]),c('Число клоунов',[4,5,6,7])],initial:[0,4]};
 if(lesson?.id==='p33' && task?.neighborStudy)return {title:'Центр и два его соседа',controls:[c('Натуральное n',[1,2,4,7]),c('Координаты',[[0,'Сначала предскажу'],[1,'Сверю отметки']])],initial:[1,0]};
 if(lesson?.id==='p33' && task?.steamerStudy)return {title:'Средняя скорость теплохода',controls:[c('Собственная скорость',[[0,'28 км/ч'],[1,'29,7 км/ч'],[2,'35,5 км/ч'],[3,'24 км/ч']]),c('Время вниз и вверх',[[0,'5 и 3 часа'],[1,'3 и 5 часов']]),c('Расчёт',[[0,'Сначала решу'],[1,'Сверю таблицу']])],initial:[0,0,0]};
 if(lesson?.id==='p33' && task?.moneyStudy)return {title:'Доли суммы денег',controls:[c('Сумма и отношение',[[0,'25 ₽, в 49 раз'],[1,'30 ₽, в 5 раз']]),c('Показ расчёта',[[0,'Сначала разделю'],[1,'Сверю суммы']])],initial:[0,0]};
 if(lesson?.id==='p33' && task?.teaStudy)return {title:'Смесь двух сортов чая',controls:[c('Цена смеси',[[0,'6 гривен за фунт'],[1,'7 гривен за фунт']]),c('Массы дешёвого и дорогого',[[0,'1 и 1 фунт'],[1,'2 и 1 фунт'],[2,'1 и 2 фунта']])],initial:[0,0]};
 if(lesson?.id==='p33' && task?.oralStudy)return {title:'Проверяй знак и величину',controls:[c('Пример в группе',[[0,'Первый'],[1,'Второй'],[2,'Третий'],[3,'Четвёртый']]),c('Условия',[[0,'Из задачи'],[1,'Новый пример']]),c('Показ результата',[[0,'Сначала решу сам'],[1,'Сверю с ответом']])],initial:[0,0,0]};
 if(lesson?.id==='p33' && task?.chainStudy)return {title:'Арифметическая дорожка',controls:[c('Буква',task.chainStudy.map((chain,i)=>[i,chain.letter])),c('Сколько действий выполнить',[0,1,2,3,4]),c('Показать фигуру',[[0,'Сначала найду слово'],[1,'Сверю рисунок']])],initial:[0,0,0]};
 if(lesson?.id==='p33' && Object.hasOwn(travelCases,task?.travelStudy))return {title:'Путь, время и скорость',controls:[c('Авторские данные',[[0,'Первый пример'],[1,'Другие числа']]),c('Показ расчёта',[[0,'Сначала составлю модель'],[1,'Сверю расчёт']])],initial:[0,0]};

 if(lesson?.id==='p33' && Object.hasOwn(nestedRules,task?.nestStudy)){
  const rule=nestedRules[task.nestStudy];
  return {title:'От внутренней группы к внешней',controls:[c('Значение '+rule.variable,[-2,0,1,3,5])],initial:[1]};
 }
 if(lesson?.id==='p33' && ['remainder-five','remainder-twelve'].includes(task?.nestStudy)){
  const five=task.nestStudy==='remainder-five';
  return {title:'Целые группы и остаток',controls:[c(five?'Натуральное n':'Натуральное k',[1,2,3,4,5])],initial:[2]};
 }
 if(lesson?.id==='p33' && ['place-one','place-two'].includes(task?.nestStudy))
  return {title:'Граница скобки меняет знаки',controls:[c('Число m',[-2,0,2,4]),c('Число n',[-1,0,1,3]),c('Положение скобки',[[0,'Без скобок'],[1,'До последнего n'],[2,'С последним n']])],initial:[4,1,0]};

 if (lesson?.id==='p15' && task?.pythagorasStudy) return {
  title:'Две раскладки четырёх одинаковых треугольников',
  controls:[c('Длины катетов',pythagorasCases.map(([a,b],i)=>[i,a+' и '+b])),c('Раскладка',[[0,'Два белых квадрата'],[1,'Один белый квадрат']])],
  initial:[0,0],
 };
 if (lesson?.id==='p15' && task?.balanceStudy) return {
  title:'Сравни обе части при подстановке',controls:[c('Какое значение проверяем?',[[0,'Ноль'],[1,'Единица'],[2,'Найденный корень'],[3,'На единицу больше корня']])],initial:[0],
 };
 if (lesson?.id==='p15' && task?.changeStudy) return {title:'Исходная величина и результат',controls:[c('Какой пример сравниваем?',[[0,'Из упражнения'],[1,'Новое исходное число']])],initial:[0]};
 if (lesson?.id==='p15' && task?.partComparison) return compareConfig(task);
 if (lesson?.id==='p33' && Object.hasOwn(groupRules,task?.groupRule)) return {
  title:groupRules[task.groupRule],controls:[c('Число b',[1,2,3,4]),c('Число c',[1,2,3,4])],initial:[2,3],
 };
 if (lesson?.id==='p15' && ['named','measured','general'].includes(task?.trigStudy)) return trigConfig(task.trigStudy);
 if (lesson?.id === 'p15' && Object.hasOwn(ratioConstructions,task?.ratioConstruction)) return constructionConfig(task.ratioConstruction);
 const spec=lesson?.id==='p15'&&Object.hasOwn(segmentRatios,task?.segmentRatio)&&segmentRatios[task.segmentRatio];
 if(!spec)return configs[lesson?.id];
 return {title:'Где поставить точку C?',controls:[c('Положение C в клетках от A',range(0,12))],initial:[spec.initial]};
}
const allowed=(item,v)=>item.values.some(a=>(Array.isArray(a)?a[0]:a)===v);
function fields(v,names){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;return Reflect.ownKeys(v).length===names.length&&names.every(k=>{const d=Object.getOwnPropertyDescriptor(v,k);return !!d&&d.enumerable&&Object.hasOwn(d,'value');});}
function validateBoardState(lesson,value,task){try{const conf=configFor(lesson,task);if(lesson?.model!=='continuation'||!conf||!task||typeof task.id!=='string'||!fields(value,['lessonId','kind','taskId','values','stage']))return false;if(value.lessonId!==lesson.id||value.kind!=='continuation'||value.taskId!==task.id||!Number.isInteger(value.stage)||value.stage<0||value.stage>5)return false;const vals=value.values;if(!Array.isArray(vals)||Object.getPrototypeOf(vals)!==Array.prototype||vals.length!==conf.controls.length||Reflect.ownKeys(vals).length!==vals.length+1)return false;for(let i=0;i<vals.length;i++){const d=Object.getOwnPropertyDescriptor(vals,String(i));if(!d||!d.enumerable||!Object.hasOwn(d,'value')||!Number.isInteger(d.value)||!allowed(conf.controls[i],d.value))return false;}return true;}catch{return false;}}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function svg(tag,attrs){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));return n;}
function chart(label){return svg('svg',{viewBox:'0 0 600 370',role:'img','aria-label':label,class:'pm-chart'});}
function txt(s,x,y,text,attrs={}){const t=svg('text',{x,y,'font-size':20,'text-anchor':'middle',fill:'#234436',...attrs});t.textContent=String(text);s.append(t);return t;}
function ln(s,x1,y1,x2,y2,attrs={}){s.append(svg('line',{x1,y1,x2,y2,stroke:'#205b46','stroke-width':2.5,...attrs}));}
function dot(s,x,y,name,color='#176b51'){s.append(svg('circle',{cx:x,cy:y,r:4,fill:color}));if(name)txt(s,x+10,y-12,name,{'text-anchor':'start'});}
function splitSegmentFigure(left){
 const right=12-left,cx=24+26*left,y=65;
 const picture=svg('svg',{viewBox:'0 0 360 115',role:'img',class:'pm-chart pcm-segment',
  'aria-label':'Отрезок AB из 12 клеток. AC — '+left+', CB — '+right+'.'});
 ln(picture,24,y,336,y,{stroke:'#89978f','stroke-width':2});
 for(let i=0;i<=12;i++)ln(picture,24+26*i,y-4,24+26*i,y+5,{stroke:'#64746d','stroke-width':1.5});
 ln(picture,24,y,cx,y,{stroke:'#086850','stroke-width':5});
 ln(picture,cx,y,336,y,{stroke:'#9c510e','stroke-width':5});
 txt(picture,24,y-16,'A',{'font-size':23});txt(picture,336,y-16,'B',{'font-size':23});
 picture.append(svg('circle',{cx,cy:y,r:6,fill:'#152d26'}));
 txt(picture,cx,y+32,'C',{'font-size':23});
 return picture;
}
function frac(a,b){const n=el('span','pm-fraction');n.setAttribute('aria-label',a+' делить на '+b);n.append(el('span','',a),el('span','',b));return n;}
function eq(...items){const n=el('p','pm-equation');for(const v of items)n.append(typeof v==='object'?v:document.createTextNode(String(v)));return n;}
function exactRatio(n,d){let a=Math.abs(n),b=Math.abs(d);while(b){const r=a%b;a=b;b=r;}return d/a===1?String(n/a):frac(n/a,d/a);}
const continuationNumberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });
function num(n) { return continuationNumberFormat.format(n); }
function table(headers,rows){const t=el('table','pm-table'),head=el('thead'),r=el('tr');headers.forEach(x=>{const n=el('th','',x);n.scope='col';r.append(n);});head.append(r);t.append(head);const b=el('tbody');rows.forEach(row=>{const tr=el('tr');row.forEach(x=>{const td=el('td');if(x&&typeof x==='object')td.append(x);else td.textContent=String(x);tr.append(td);});b.append(tr);});t.append(b);return t;}
function axisFigure(points,min=-10,max=10,arrows=[]){const s=chart('Координатная прямая'),y=180,X=x=>50+(x-min)/(max-min)*500;ln(s,40,y,565,y);ln(s,565,y,552,y-7);ln(s,565,y,552,y+7);for(let x=Math.ceil(min);x<=max;x++){ln(s,X(x),y-5,X(x),y+5);if((max-min<=20)||x%2===0)txt(s,X(x),y+27,x,{'font-size':17});}for(const p of points){dot(s,X(p.x),y,p.name);if(p.x!==0)ln(s,X(p.x),y-48,X(p.x),y-10,{stroke:'#b5812b','stroke-dasharray':'5 5'});}arrows.forEach((a,i)=>{const yy=120-i*35;ln(s,X(a[0]),yy,X(a[1]),yy,{stroke:'#c08020','stroke-width':4});const dir=a[1]>a[0]?1:-1;ln(s,X(a[1]),yy,X(a[1])-dir*10,yy-6,{stroke:'#c08020'});ln(s,X(a[1]),yy,X(a[1])-dir*10,yy+6,{stroke:'#c08020'});});return s;}
function planeFigure(f){const s=chart(f.caption||'Координатная плоскость');s.setAttribute('class','pm-chart pcm-dense');const xmin=f.xMin??-6,xmax=f.xMax??6,ymin=f.yMin??-5,ymax=f.yMax??5;const unit=Math.min(490/(xmax-xmin),280/(ymax-ymin)),left=(600-(xmax-xmin)*unit)/2,top=(370-(ymax-ymin)*unit)/2,X=x=>left+(x-xmin)*unit,Y=y=>top+(ymax-y)*unit;for(let x=Math.ceil(xmin);x<=xmax;x++){ln(s,X(x),Y(ymin),X(x),Y(ymax),{stroke:'#d8e4dc','stroke-width':1});if(x&&x%Math.max(1,Math.ceil((xmax-xmin)/16))===0)txt(s,X(x),Y(Math.max(ymin,Math.min(ymax,0)))+20,x,{'font-size':14});}for(let y=Math.ceil(ymin);y<=ymax;y++){ln(s,X(xmin),Y(y),X(xmax),Y(y),{stroke:'#d8e4dc','stroke-width':1});if(y&&y%Math.max(1,Math.ceil((ymax-ymin)/12))===0)txt(s,X(Math.max(xmin,Math.min(xmax,0)))-15,Y(y)+5,y,{'font-size':14});}if(ymin<=0&&ymax>=0){ln(s,X(xmin),Y(0),X(xmax),Y(0));txt(s,X(xmax)+18,Y(0)+6,'x');}if(xmin<=0&&xmax>=0){ln(s,X(0),Y(ymin),X(0),Y(ymax));txt(s,X(0)+10,Y(ymax)-10,'y');}const pts=f.points||[],by=Object.fromEntries(pts.map(p=>[p.name,p]));for(const seg of f.segments||[]){const a=by[seg[0]],b=by[seg[1]];if(a&&b)ln(s,X(a.x),Y(a.y),X(b.x),Y(b.y));}for(const poly of f.polylines||[])s.append(svg('polyline',{points:poly.map(p=>X(p[0])+','+Y(p[1])).join(' '),fill:'none',stroke:'#22805b','stroke-width':3}));pts.forEach(p=>dot(s,X(p.x),Y(p.y),p.name));return s;}
function geometryFigure(f){const pts=f.points||[],circles=f.circles||[],by=Object.fromEntries(pts.map(p=>[p.name,p])),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);circles.forEach(c=>{const p=by[c.center];if(p){xs.push(p.x-c.radius,p.x+c.radius);ys.push(p.y-c.radius,p.y+c.radius);}});(f.labels||[]).forEach(p=>{xs.push(p.x);ys.push(p.y);});const xmin=Math.min(...xs,0),xmax=Math.max(...xs,1),ymin=Math.min(...ys,0),ymax=Math.max(...ys,1),unit=Math.min(450/(xmax-xmin||1),240/(ymax-ymin||1)),X=x=>75+(x-xmin)*unit,Y=y=>300-(y-ymin)*unit,s=chart(f.caption||'Геометрическая схема');for(const seg of f.segments||[]){const a=by[seg[0]],b=by[seg[1]];if(a&&b)ln(s,X(a.x),Y(a.y),X(b.x),Y(b.y));}circles.forEach(c=>{const p=by[c.center];if(p)s.append(svg('circle',{cx:X(p.x),cy:Y(p.y),r:c.radius*unit,fill:'none',stroke:'#8ca991','stroke-width':2}));});pts.forEach(p=>dot(s,X(p.x),Y(p.y),p.name));(f.labels||[]).forEach(p=>txt(s,X(p.x),Y(p.y),p.text));return s;}

function platonicData(shape){const f=(1+Math.sqrt(5))/2,points=[];if(shape==='dodecahedron'){for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])points.push([x,y,z]);for(const a of [-1,1])for(const b of [-1,1]){points.push([0,a/f,b*f],[a/f,b*f,0],[a*f,0,b/f]);}}else for(const a of [-1,1])for(const b of [-1,1])points.push([0,a,b*f],[a,b*f,0],[a*f,0,b]);const edgeLength=shape==='dodecahedron'?2/f:2,edges=[];for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(Math.abs(Math.hypot(...points[i].map((x,k)=>x-points[j][k]))-edgeLength)<1e-8)edges.push([i,j]);return {points,edges};}
function platonicWire(shape){const s=chart('Каркасная схема правильного многогранника; показаны все рёбра'),data=platonicData(shape),rot=data.points.map(([x,y,z])=>{const xx=x*Math.cos(.42)+z*Math.sin(.42),zz=-x*Math.sin(.42)+z*Math.cos(.42);return [xx,y*Math.cos(.31)-zz*Math.sin(.31)];}),scale=125/Math.max(...rot.flat().map(Math.abs)),pts=rot.map(([x,y])=>[300+x*scale,185-y*scale]);for(const[a,b]of data.edges)ln(s,...pts[a],...pts[b],{'stroke-width':2});pts.forEach(p=>s.append(svg('circle',{cx:p[0],cy:p[1],r:3,fill:'#236a4b'})));return s;}
function solidFigure(shape){if(['dodecahedron','icosahedron'].includes(shape))return platonicWire(shape);const s=chart('Схема пространственной фигуры: '+shape);if(['cube','cuboid','prism','tetrahedron','octahedron'].includes(shape)){let pts,edges;if(shape==='tetrahedron'){pts=[[110,285],[430,285],[270,65],[325,215]];edges=[[0,1],[0,2],[1,2],[0,3,1],[1,3,1],[2,3,1]];}else if(shape==='prism'){pts=[[100,280],[290,280],[195,100],[310,220],[500,220],[405,40]];edges=[[0,1],[0,2],[1,2],[3,4],[3,5],[4,5],[0,3,1],[1,4],[2,5]];}else if(shape==='octahedron'){pts=[[150,185],[300,260],[450,185],[300,130],[300,45],[300,330]];edges=[[0,1],[1,2],[2,3,1],[3,0,1],[4,0],[4,1],[4,2],[4,3,1],[5,0],[5,1],[5,2],[5,3,1]];}else{const w=shape==='cube'?210:300;pts=[[100,290],[100+w,290],[100+w,100],[100,100],[180,240],[180+w,240],[180+w,50],[180,50]];edges=[[0,1],[1,2],[2,3],[3,0],[4,5,1],[5,6],[6,7],[7,4,1],[0,4,1],[1,5],[2,6],[3,7]];}edges.forEach(([a,b,hidden])=>ln(s,...pts[a],...pts[b],hidden?{'stroke-dasharray':'7 6',stroke:'#779888'}:{}));pts.forEach((p,i)=>dot(s,...p,String.fromCharCode(65+i)));}else if(shape==='sphere'){s.append(svg('circle',{cx:300,cy:185,r:120,fill:'#e9f4ee',stroke:'#235b46','stroke-width':3}));s.append(svg('ellipse',{cx:300,cy:185,rx:120,ry:35,fill:'none',stroke:'#779888','stroke-dasharray':'7 5'}));ln(s,300,45,300,325,{'stroke-dasharray':'5 6',stroke:'#b88128'});}else if(['cylinder','cone'].includes(shape)){const cone=shape==='cone';s.append(svg('ellipse',{cx:300,cy:290,rx:110,ry:30,fill:'#e9f4ee',stroke:'#235b46','stroke-width':2}));if(cone){ln(s,190,290,300,65);ln(s,410,290,300,65);}else{s.append(svg('ellipse',{cx:300,cy:80,rx:110,ry:30,fill:'#e9f4ee',stroke:'#235b46','stroke-width':2}));ln(s,190,80,190,290);ln(s,410,80,410,290);}ln(s,300,45,300,325,{'stroke-dasharray':'5 6',stroke:'#b88128'});}else txt(s,300,185,'Неизвестная пространственная фигура');return s;}
function angleFigure(deg,vertex='O',arms=['A','B'],protractor=true){const s=chart(protractor?'Угол '+deg+' градусов':'Данный угол');s.setAttribute('class','pm-chart pcm-dense');const cx=300,cy=290,r=210;ln(s,cx,cy,cx+r,cy);const x=cx+r*Math.cos(deg*Math.PI/180),y=cy-r*Math.sin(deg*Math.PI/180);ln(s,cx,cy,x,y);dot(s,cx,cy,vertex);txt(s,530,315,arms[0]);txt(s,x,y-15,arms[1]);if(protractor)for(let d=0;d<=180;d+=15){const a=d*Math.PI/180;ln(s,cx+175*Math.cos(a),cy-175*Math.sin(a),cx+185*Math.cos(a),cy-185*Math.sin(a),{stroke:'#7b9b89','stroke-width':1.5});txt(s,cx+208*Math.cos(a),cy-208*Math.sin(a),d,{'font-size':14});}if(protractor)s.append(svg('path',{d:'M 475 290 A 175 175 0 0 0 125 290',fill:'none',stroke:'#a9c6b5'}));return s;}
function renderFigure(container,f){if(!container)return;addStyles();container.replaceChildren();if(!f||typeof f!=='object')return;const wrap=el('figure','pm-task-figure');let picture;if(f.type==='p38-station-graph'){picture=sourceChart('station',stationSchedule(false));}else if(f.type==='p38-source-area'){picture=paperArea(f.variant,false,false,true).picture;}else if(f.type==='printed-car-start'){picture=startingCarDiagram(f.route);}else if(f.type==='base-height-triangle'){picture=baseHeightTriangle(6,4);}else if(f.type==='paper-quantity-graph'){picture=f.variant==='flights'?sourceChart('flights',planeProfiles):f.variant==='apples'?sourceChart('apples',[[[0,0],[4,320]]]):sourceChart('fuel',[[[0,0],[100,8]]]);}else if(f.type==='school-hobby-bars'){picture=el('div');picture.append(sourceHobbyFigure(hobbyFigures),table(['Буква','Занятие'],hobbyNames.map((n,i)=>['абвгдежз'[i],n])));}else if(f.type==='unit-blanks'){picture=missingUnitsTable(f);}else if(f.type==='sum-fraction-percent'){picture=fractionPairFigure();}else if(f.type==='fraction-routes'){picture=fractionRouteFigure(f,-1,-1);}else if(f.type==='equation-cycle'){picture=cycleDiagram(f,f.start,0);}else if(f.type==='cut-cell-figure'){picture=cutGridFigure(f.design,null,0);}else if(f.type==='seven-score-rows'){picture=scoreFigure(f.rows);}else if(f.type==='parallel-triangle'){picture=sectionTriangle(0,0).svg;}else if(f.type==='parallel-ray-intercepts'){picture=rayInterceptFigure(20,2,0);}else if(f.type==='thales-proportions'){picture=thalesRows(f.rows);}else if(f.type==='reciprocal-chain'){picture=reciprocalOperations();}else if(f.type==='semicircle-angle'){picture=diameterAngleFigure(3,60,false);}else if(f.type==='four-proportion-expressions'){picture=table(['Буква','Вычисление'],f.rows.map((v,i)=>[['A','B','C','D'][i],v]));}else if(f.type==='copy-construction'){picture=copyConstruction(f.drawing,1);}else if(f.type==='similar-pentagons'){picture=pairedPentagons(1.6,false);}else if(f.type==='crossed-chords'){picture=chordExperiment(0,false).picture;}else if(f.type==='coded-ratios'){picture=codedRatioTable(f.rows);}else if(f.type==='nested-numeric-fraction'){picture=nestedFractionFigure();}else if(f.type==='altitude-example'){picture=altitudeDiagram(f.diagram);}else if(f.type==='operation-wheel'){picture=wheelFigure(f);}else if(f.type==='hundred-table'){picture=fullHundredGrid();}else if(f.type==='garden-ground'){picture=gardenScale();}else if(f.type==='road-ratio'){picture=roadTriangle();}else if(f.type==='city-scale-map'){picture=cityScaleFigure(f.city);}else if(f.type==='notched-parcel'){picture=parcelPicture();}else if(f.type==='six-room-flat'){picture=el('div');picture.append(apartmentPicture(),el('p','pm-note',flats.map(room=>room.tag+' — '+room.name.toLowerCase()).join(', ')));}else if(f.type==='five-lines'){picture=fiveLinePicture();}else if(f.type==='nested-tangents'){picture=tangentNest(-1,0);}else if(f.type==='pythagoras-dissection'){picture=el('div','pcm-two-arrangements');picture.append(dissectionFigure(3,4,false),dissectionFigure(3,4,true));}else if(f.type==='ratio-triangle')picture=trigFigure(f.measurable===true,null);else if(f.type==='plane')picture=planeFigure(f);else if(f.type==='line')picture=axisFigure(f.points||[],f.min??-8,f.max??8);else if(f.type==='geometry')picture=geometryFigure(f);else if(f.type==='solid')picture=solidFigure(f.shape);else if(f.type==='angle')picture=angleFigure(f.degrees,f.vertex,f.arms,f.protractor===true);else if(f.type==='proportion'){picture=eq(frac(f.leftTop,f.leftBottom),' = ',frac(f.rightTop,f.rightBottom));}else if(f.type==='parts'){picture=el('div');(f.parts||[]).forEach(p=>{const row=el('div','pcm-parts');row.append(el('span','',p.label));for(let i=0;i<p.count;i++)row.append(el('span','pcm-part',''));picture.append(row);});if(f.totalLabel)picture.append(el('p','',f.totalLabel));}else{picture=el('p','', 'Рисунок этого типа пока не поддерживается. Открой рисунок в учебнике.');}wrap.append(picture);const generic=['geometry','solid','parts'].includes(f.type)?'Схема. Размеры следует брать из условия, а не измерять на экране.':'';const caption=f.caption||generic;wrap.append(el('figcaption','pm-note',['geometry','solid','angle'].includes(f.type)&&!/^Схема[.:]/i.test(caption)?'Схема. '+caption:caption));container.append(wrap);}
let sequence=0;
function addStyles(){if(document.getElementById('peterson-continuation-styles'))return;const s=el('style');s.id='peterson-continuation-styles';s.textContent='.pcm-pentagon-pair{display:flex;flex-wrap:wrap;justify-content:center;gap:.3rem}.pcm-pentagon-pair>svg.pm-chart{flex:0 1 13rem;width:13rem;min-width:0;max-width:100%;height:auto}.pcm-printed-fraction{display:grid;gap:0;max-width:33rem;margin:.8rem auto;text-align:center;line-height:1.65;font-variant-numeric:lining-nums}.pcm-sum-fractions{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.4rem}.pcm-sum-fractions .pcm-printed-fraction{margin:.3rem 0;max-width:100%}.pcm-sum-symbol{font-size:1.4rem}.pcm-fraction-numerator{padding:.2rem .3rem;border-bottom:2px solid currentColor}.pcm-fraction-denominator{padding:.2rem .3rem}.pcm-two-arrangements{display:flex;flex-wrap:wrap;gap:.6rem}.pcm-two-arrangements svg{width:clamp(130px,43%,225px);height:auto;max-width:100%}.pcm-parts{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:12px 0}.pcm-parts>span:first-child{flex-basis:100%}.pcm-part{display:inline-block;width:42px;height:35px;background:#a7d6bd;border:2px solid #3c7d60}.pcm-step{background:white;border-left:4px solid #4c9470;padding:10px 14px;margin:8px 0}.pm-task-figure{margin:12px 0;border:1px solid #b8d0c3;border-radius:12px;padding:14px;background:#fcfefc;overflow:auto}.pm-task-figure .pm-chart{max-height:400px}.pcm-chip{display:inline-block;margin:5px;padding:8px 12px;border-radius:8px;border:1px solid #aac7b5;background:white}.pcm-true{background:#d5ecd9}.pcm-false{background:#f7e0d5}.pcm-proof{border:1px solid #b79551;padding:12px;background:#fff9ed}.pcm-net{display:grid;grid-template-columns:repeat(4,44px);gap:0;justify-content:center}.pcm-net span{height:44px;border:1px solid #48745d;background:#cde8d8}.pcm-net .empty{visibility:hidden}.pcm-diagram{font-size:21px;text-align:center;padding:15px}.pm-control select{font:inherit;min-height:44px;width:100%}.pm-task-figure svg{width:100%;height:auto;min-width:360px}.pm-visual .pcm-dense,.pm-task-figure .pcm-dense{min-width:480px;max-height:none}.pm-task-figure svg.pcm-route-fractions,.pm-visual svg.pcm-route-fractions{min-width:0;width:100%;max-width:23rem;height:auto}.pm-task-figure .pm-note{max-width:65ch}.pm-task-figure .pm-equation{display:flex;align-items:center;justify-content:center;gap:14px;font-size:26px;line-height:1.7}.pm-task-figure .pm-fraction{display:inline-flex;flex-direction:column;text-align:center;line-height:1.25;min-width:1.2em}.pm-task-figure .pm-fraction>span:first-child{padding:0 4px 3px;border-bottom:2px solid currentColor}.pm-task-figure .pm-fraction>span:last-child{padding:3px 4px 0}';document.head.append(s);}
function mount(container,lesson,task){const conf=configFor(lesson,task);if(!container||!conf||lesson.model!=='continuation'||!task||typeof task.id!=='string')return ()=>{};addStyles();const n=Number(lesson.id.slice(1));let state={lessonId:lesson.id,kind:'continuation',taskId:task.id,values:conf.initial.slice(),stage:0};
 if(n===39&&task.figure?.type==='plane'){const p=(task.figure.points||[])[0];if(p&&allowed(conf.controls[0],p.x)&&allowed(conf.controls[1],p.y))state.values=[p.x,p.y];}
 const host=el('section','pm-model'),title=el('h3','pm-title',conf.title),intro=el('p','pm-note',task.convertGroup||Number.isInteger(task.walkingGap)||task.stationGraph||task.mentalSeries||task.calendarBalance||task.formulaWords||task.p38Shape||task.sizeRule||task.percentBasis||task.reduceStudy||Number.isInteger(task.squareClaim)||task.sharedRate||task.portionRow||task.printedJourney||task.appliedCompare||task.appliedBalance||task.ratioRewrite||task.printedRateStory||task.marketDistanceGraph||task.composeSourceRatio||task.oilCans||task.sourceFuelGraph||task.flightGraph||task.sectionFlow||task.hobbySurvey||task.legoSurvey||Number.isInteger(task.gapDirection)||Number.isInteger(task.quantityFamily)||Number.isInteger(task.geometryQuantity)||task.productUnits||task.unitBlanks||task.approachFormula||task.remainingStory||task.expressionGroup||task.percentDoubleFraction||task.threeDigits||task.lifeTimeline||task.fractionRoutes||task.mixedRule||task.mixedSeries||task.rationalChain||task.fractionCompare||task.papyrusBlock||task.directedCycle||task.operationRole||task.equationSituation||task.linearEquationStudy||task.reviewRatio||task.cancelRatio||task.reviewMap||task.reviewPercentageWord||task.reviewArithmetic||task.tariffStudy||task.scoreRanking||task.triangleSection||task.classParts||task.simpleMonths||task.gridDivision||task.fiveMultiples||task.missingOperation||task.wholeFromExtras||task.outputRates||task.derivedProof||task.deriveThree||task.parallelIntercept||task.thalesCipher||task.sourceRearrangement||task.constantRateStory||task.quantifiedEquation||task.storyBalance||task.naturalTrials||task.finalRootFamily||task.newtonCapital||Number.isInteger(task.rootDomain)||task.inverseChain||task.identityProof||task.rootFamily||task.unarySequence||task.equationNotation||task.rootProbe||task.rootCount||task.ratioRectangle||task.roadMeeting||task.fixedRectangle||task.diameterAngle||task.proportionExpressions||task.pandigitalStudy||task.reverseSquare||task.classOrderStudy||task.boatGap||task.fallCurve||task.currencyCipher||task.copyDrawing||task.proportionClaim||task.twoPercentBases||task.percentTransform||task.motionPercent||task.similarPentagon||task.alloyParts||task.circleRatio||task.crossedChords||task.oddExpressions||task.affineRatios||task.linkedRatios||task.copierRatio||task.reorderSymbols||task.codedRatios||task.missingRatio||task.integerTrial||task.lunchStudy||task.reverseRateStudy||task.appleSaleStudy||task.fractionTreeStudy||task.oldCoinStudy||Number.isInteger(task.logicalIdentity)||task.altitudeStudy||task.percentagePortion||task.percentageChange||task.percentNarrative||task.collectedEquation||task.packingStudy||task.patrolStudy||task.spokeStudy||task.factorSum||task.differenceSquareStudy||task.proportionReading||task.symbolProportion||task.ratioCollection||task.ratioTarget||task.fourPlaces||task.likeTermsStudy||task.scaleExamples||task.crossScale||task.ownMapStudy||task.ownRoomStudy||task.ladderStudy||task.squareGridStudy||task.gardenPlan||task.classroomPlan||task.scaleTransfer||task.patternStudy||task.gearRatio||task.commissionStudy||task.roadSlope||task.linearStudy||task.regroupStudy||task.logicalPower||task.squareSum||task.numberTrick||task.coefficientStudy||task.coefficientContrast||Number.isInteger(task.cityMap)||task.parcelScale||task.flatScale||task.scaleReading||task.midpointStudy||task.lineRelation||task.letterStudy||task.verifyEquation||task.circusStudy||task.neighborStudy||task.steamerStudy||task.moneyStudy||task.teaStudy||task.comparisonStory||task.rateStudy||task.mixStudy||task.similarTangents||task.differenceStudy?'Предскажи результат. Измени данные модели и проверь своё объяснение.':task.oralStudy||task.chainStudy||task.travelStudy?'Сначала работай без ответа. Затем сравни свою запись с моделью.':task.nestStudy?'Сначала сформулируй свой прогноз. Меняй числа и объясняй, почему правило сохраняется.':task.pythagorasStudy?'Сосчитай одинаковые треугольники. Переключи раскладку и сравни белую площадь.':task.balanceStudy?'Предскажи, совпадут ли значения обеих сторон. Проверь подстановкой.':task.changeStudy?'Предскажи, станет ли число больше исходного. Сравни две полосы и проверь действие на другом числе.':task.partComparison?'Сначала назови сравниваемые группы. Выбери их в полях и проверь своё предположение на полосах одинакового масштаба.':task.groupRule?'Выбери небольшие числа b и c, сравни два способа вычисления и нарисуй свой пример в тетради.':task.trigStudy?'Выбери острый угол и найди обе роли катетов. Рисунок задачи остаётся выше.':task.ratioConstruction?'Измени модель и проверь своё предположение. Построение выполни в тетради и запиши проверку.':task.segmentRatio?'В модели отрезок AB состоит из 12 клеток. Меняй положение C и проверяй отношение. Затем построй свой отрезок в тетради.':n===39&&task.figure?.type==='plane'&&(task.figure.points||[]).some(p=>allowed(conf.controls[0],p.x)&&allowed(conf.controls[1],p.y))?'Модель начинается с координат точки из задачи. Изменения здесь не меняют исходный чертёж.':'Авторский пример для понимания темы. Условие выбранной задачи и её рисунок остаются на странице.'),controls=el('div','pm-controls'),visual=el('div','pm-visual'),result=el('div','pm-result'),steps=el('div'),actions=el('div','row');result.setAttribute('aria-live','polite');result.setAttribute('aria-atomic','true');host.setAttribute('aria-label','Модель: '+lesson.title);host.append(title,intro,controls,visual,result,steps,actions);container.replaceChildren(host);
 const selects=conf.controls.map((control,index)=>{const wrap=el('div','pm-control'),id='pcm-'+(++sequence),lab=el('label','',control.label),select=el('select');lab.htmlFor=id;select.id=id;control.values.forEach(v=>{const [value,label]=Array.isArray(v)?v:[v,String(v)],o=el('option','',label);o.value=String(value);select.append(o);});select.value=String(state.values[index]);select.addEventListener('change',()=>{const v=Number(select.value);if(!Number.isInteger(v)||!allowed(control,v)){select.value=String(state.values[index]);return;}state.values[index]=v;
  let hiddenControl=null;
  if((task.quantifiedEquation||task.mentalSeries||task.stationGraph||task.convertGroup||Number.isInteger(task.walkingGap)) && index<conf.controls.length-1)hiddenControl=conf.controls.length-1;
  if(task.squareGridStudy && index<3)hiddenControl=3;
  if((task.integerTrial||task.lunchStudy||task.appleSaleStudy||task.oldCoinStudy) && index<2)hiddenControl=2;
  if((task.reverseRateStudy||task.fractionTreeStudy) && index===0)hiddenControl=1;
  if((Number.isInteger(task.logicalIdentity)||task.percentagePortion||task.percentageChange||task.percentNarrative||task.altitudeStudy&&task.altitudeStudy!=='picture') && index===0)hiddenControl=1;
  if((task.collectedEquation||task.packingStudy||task.patrolStudy||task.spokeStudy||task.differenceSquareStudy?.free) && index<2)hiddenControl=2;
  if((task.factorSum||task.differenceSquareStudy&&!task.differenceSquareStudy.free) && index===0)hiddenControl=1;
  if((task.proportionReading||task.symbolProportion) && index===0)hiddenControl=1;
  if((task.calendarBalance||task.formulaWords||task.p38Shape||task.sizeRule||task.percentBasis||task.reduceStudy||Number.isInteger(task.squareClaim)||task.sharedRate||task.portionRow||task.printedJourney||task.appliedCompare||task.appliedBalance||task.ratioRewrite||task.printedRateStory&&task.printedRateStory!=='trains'||task.composeSourceRatio||Number.isInteger(task.geometryQuantity)||Number.isInteger(task.quantityFamily)&&task.quantityFamily<2||task.productUnits||task.remainingStory==='park'||task.expressionGroup||task.percentDoubleFraction||task.lifeTimeline||task.rationalChain||task.fractionCompare||task.papyrusBlock||task.directedCycle||task.operationRole||['languages','journey','workers'].includes(task.equationSituation)||task.reviewRatio||task.reviewMap||task.reviewPercentageWord||task.reviewArithmetic||task.classParts||task.simpleMonths||task.wholeFromExtras||task.outputRates||task.derivedProof||task.thalesCipher||task.constantRateStory||task.finalRootFamily||task.identityProof||task.rootFamily||task.unarySequence||task.equationNotation||task.rootProbe||task.rootCount||task.ratioRectangle||task.roadMeeting||task.proportionExpressions||task.fallCurve||task.currencyCipher||task.copyDrawing||task.proportionClaim||task.percentTransform||task.motionPercent&&task.motionPercent!=='meeting'||task.similarPentagon||task.alloyParts||task.circleRatio||task.crossedChords||task.oddExpressions||task.codedRatios||task.linkedRatios||task.copierRatio) && index===0)hiddenControl=1;
  if((task.printedRateStory==='trains'||task.marketDistanceGraph||task.oilCans||task.sourceFuelGraph||task.flightGraph||task.sectionFlow||task.hobbySurvey||task.legoSurvey||Number.isInteger(task.gapDirection)||Number.isInteger(task.quantityFamily)&&task.quantityFamily>=2||task.unitBlanks||task.approachFormula||['fuel','vegetables'].includes(task.remainingStory)||task.fractionRoutes||task.mixedRule||task.mixedSeries||['milk','honey','grains'].includes(task.equationSituation)||task.linearEquationStudy||task.cancelRatio||task.tariffStudy||task.scoreRanking||task.triangleSection||task.gridDivision||task.fiveMultiples||task.missingOperation||task.deriveThree||task.sourceRearrangement||task.storyBalance||task.naturalTrials||task.newtonCapital||Number.isInteger(task.rootDomain)||task.inverseChain||task.fixedRectangle||task.diameterAngle||task.pandigitalStudy||task.reverseSquare||task.classOrderStudy||task.boatGap||task.twoPercentBases||task.motionPercent==='meeting'||task.missingRatio||task.affineRatios) && index<2)hiddenControl=2;
  if((task.ratioCollection||task.fourPlaces) && index<2)hiddenControl=2;
  if((task.likeTermsStudy||task.crossScale||task.ownMapStudy||task.ownRoomStudy) && index<2)hiddenControl=2;
  if((task.scaleExamples||task.ladderStudy) && index===0)hiddenControl=1;
  if((task.flatScale || task.oralStudy || task.lineRelation || task.letterStudy || task.steamerStudy) && index<2)hiddenControl=2;
  if((task.scaleTransfer || task.patternStudy || task.commissionStudy || task.roadSlope || task.linearStudy || task.regroupStudy || task.logicalPower || task.squareSum || task.numberTrick || task.coefficientStudy || task.coefficientContrast || Number.isInteger(task.cityMap) || task.parcelScale || task.scaleReading || task.midpointStudy || task.neighborStudy || task.moneyStudy || task.travelStudy || task.chainStudy || task.rateStudy) && index===0)hiddenControl=1;
  if(hiddenControl!==null){state.values[hiddenControl]=0;selects[hiddenControl].value='0';}
  draw();});wrap.append(lab,select);controls.append(wrap);return select;});
 let explanations=[];
 const next=el('button','pm-button','Следующий шаг модели'),reset=el('button','pm-button','Начать модель заново');next.type=reset.type='button';next.addEventListener('click',()=>{state.stage=Math.min(5,state.stage+1);draw();});reset.addEventListener('click',()=>{state.values=conf.initial.slice();state.stage=0;selects.forEach((s,i)=>s.value=String(state.values[i]));draw();});actions.append(next,reset);
 function say(text){result.append(el('p','',text));}function formula(...s){result.append(eq(...s));}function show(node){visual.append(node);}function stepList(lines){explanations=lines;}
 function draw(){visual.replaceChildren();result.replaceChildren();steps.replaceChildren();explanations=[];const [a,b]=state.values;
 if(n===34 && task.linearStudy){
  const groups=task.linearStudy.groups.map((g,index)=>({...g,scale:index===0&&a===1?g.scale+Math.sign(g.scale):g.scale}));
  const names=[...new Set(groups.flatMap(g=>Object.keys(g.terms)))].sort(),z={};for(const v of names)z[v]=0;
  say(a===0?task.linearStudy.original:'Те же скобки. Новый первый внешний множитель: '+num(groups[0].scale)+'.');
  if(b===1){
   const rows=groups.map((g,index)=>['Скобка '+(index+1),names.map(letter=>num(g.scale*(g.terms[letter]||0))+' при '+letter).join('; ')+'; постоянное '+num(g.scale*g.constant)]);
   show(table(['Группа','Вклады после раскрытия'],rows));
   const constant=evaluateLinear(groups,z);
   for(const letter of names)formula('Коэффициент при '+letter+': '+num(evaluateLinear(groups,{...z,[letter]:1})-constant).replace('-','−'));
   say('Свободный член: '+num(constant)+'.');
  }
  if(b===2){const inputs=Object.fromEntries(names.map((v,i)=>[v,i+2]));say('Подстановка: '+Object.entries(inputs).map(([v,x])=>v+' = '+x).join(', ')+'.');
   formula('Значение исходных групп: '+num(evaluateLinear(groups,inputs)));}
  stepList(['Пройди по каждой скобке отдельно.','Одинаковые буквы собираются в один коэффициент.','Сначала предскажи изменившийся результат, затем открой проверку.']);
 }
 else if(n===34 && task.regroupStudy){
  const m=root.PetersonMath,factors=task.regroupStudy.slice();if(a===1)factors[0]=m.answer(m.operation('multiply',factors[0],2));
  const shown=factors.map(v=>{const q=m.parse(v);return q.n<0?'('+m.decimal(q).replace('-','−')+')':q.d===17?'9/17':m.decimal(q);});
  formula(shown.join(' · '));
  if(b===1){const ordered=task.source.subpart==='а'?[0,2,3,4,1]:[1,5,0,2,3,4];formula(ordered.map(i=>shown[i]).join(' · '));}
  if(b===2){const value=factors.reduce((k,v)=>m.operation('multiply',k,v),m.parse(1));formula('Произведение: '+m.decimal(value).replace('-','−'));}
  stepList(['У каждой переставленной группы сохрани её исходный знак.','Сочетательный закон позволяет менять скобки без изменения результата.']);
 }
 else if(n===34 && task.logicalPower){
  const kind=task.logicalPower.kind,p=kind==='cube-negative'?3:2,left=(-a)**p,right=kind==='square-positive'?a**2:-(a**p);
  say('Рациональное число a = '+num(a)+'.');
  if(b===1){
   show(table(['Левая запись','Правая запись'],[[num(left),num(right)]]));say(left===right?'При этом a значения равны.':'При этом a значения различны.');
   say('Чтобы опровергнуть «для всех», достаточно одного контрпримера. Чтобы опровергнуть «найдётся», докажи равенство при любом a.');
  }
  stepList(['Определи область действия минуса и степени.','Сравни стороны при выбранном числе.','Проверь, соответствует ли проверка логической форме утверждения.']);
 }
 else if(n===34 && task.squareSum){
  const [u,v]=a===0?task.squareSum:[4,-2];
  formula('a = '+num(u)+', b = '+num(v));
  if(b===1){show(table(['Выражение','Значение'],[['(a + b)²',(u+v)**2],['a² + b²',u*u+v*v],['a² + 2ab + b²',u*u+2*u*v+v*v]]));}
  if(b===2){show(squarePartition(u,v));
   say(u*v<0?'При разных знаках размер квадрата суммы равен разности модулей. Из большого квадрата вычти две полосы и верни малый квадрат пересечения один раз.':'При одинаковых знаках сторона большого квадрата равна сумме модулей. Между двумя квадратами два прямоугольника площади |ab|.');
   formula('2ab = '+num(2*u*v));}
  stepList(['Сравни квадрат суммы и сумму квадратов.','Найди смешанное слагаемое 2ab.','Докажи равенство раскрытием (a + b)(a + b), включая отрицательные числа.']);
 }
 else if(n===34 && Object.hasOwn(trickInputs,task.numberTrick)){
  const chain=numberTrail(task.numberTrick,a),last=chain.length-1,limit=Math.min(b,last);
  show(table(['Действие','Значение'],chain.slice(0,limit+1).map(([step,v])=>[step,num(v)])));
  if(limit<last)say('Следующий шаг: '+chain[limit+1][0]+'. Предскажи число.');
  else say('Сверь выполненные действия. Чтобы проверить другое исходное число, выбери его в первом поле.');
  stepList(['Обозначь исходное число x.','Записывай порядок действий, особенно «вычесть из».','Проверь правило на другом числе, а общее утверждение обоснуй буквами.']);
 }
 else
 if(n===34 && task.coefficientStudy){
  const parts=coefficientParts(task,a);
  formula(a===0?task.coefficientStudy.original:parts.written);
  if(b===1){show(numericFactorDiagram(parts.numericFactors));say('Числовых минусов после раскрытия степеней: '+parts.negatives+'.');formula('Коэффициент '+parts.coefficient);}
  if(b===2){
   show(exponentDiagram(parts.degrees));say('Буквенная часть: '+parts.literal+'.');
  }
  stepList(['Отметь границы степеней. Степень у буквы не действует на число перед ней.','Перемножь числовые множители. Нечётное число отрицательных числовых множителей даёт минус.','Отдельно собери одинаковые буквы, затем проверь выражение с новыми данными.']);
 }
 else if(n===34 && task.coefficientContrast){
  const rows=[['2xy','2'],['k⁵','1'],['−3ab⁴','−3'],['−(5/6)m³n²','−5/6'],['7c⁴d · (−2)','−14']];
  const focused=[3,1,4][a];
  show(table(['Запись','Коэффициент'],rows));say('Выбранный признак: '+['нецелый коэффициент','одна различная буква','два отдельно записанных числовых множителя'][a]+'.');
  if(b===1)say('По этому признаку выделяется '+rows[focused][0]+'. Своё объяснение запиши в тетради.');
  stepList(['Сначала сформулируй точное свойство.','Сверь по нему каждую из пяти записей.','Испытай другой признак.']);
 }
 else
 if(n===35 && task.integerTrial){
  const caseData=task.integerTrial,target=a===0?caseData.right:caseData.fresh,mode=state.values[2];
  say(a===0?caseData.printed:'Оставь ту же левую часть. Новая правая часть: '+num(target)+'.');
  say('Проверяем x = '+num(b)+'.');
  if(mode>0){
   const probes=mode===1?[b]:[b-1,b,b+1];
   show(table(['x','Левая часть'],probes.map(x=>[num(x),num(trialLeft(caseData.rule,x))])));
   say(trialLeft(caseData.rule,b)===target?'Пробное число — корень. Проверь, могут ли подойти ещё числа.':'При выбранном числе равенства нет.');
  }
  stepList(['Назови знаки возможных значений левой части.','Подставь выбранное число точно.','Обоснуй полный набор корней, а не только проверенные примеры.']);
 }
 else if(n===35 && task.lunchStudy){
  const [salad,discount]=a===0?[24,16]:[30,12],patty=1.6*b,drink=b-discount,total=salad+b+patty+drink;
  say('Салат '+salad+' р. Компот на '+discount+' р. дешевле борща. Борщ должен составлять четверть стоимости обеда.');
  if(state.values[2]===1){show(table(['Блюдо','Цена, р.'],[['Салат',salad],['Борщ',b],['Котлеты',num(patty)],['Компот',num(drink)]]));say('Сумма '+num(total)+' р. По условию она должна равняться 4 × '+b+' = '+4*b+' р.');say(Math.abs(total-4*b)<1e-8?'Все условия выполнены.':'Проверь другую цену борща.');}
  stepList(['Вырази каждое блюдо через борщ.','Сложи четыре цены.','Проверь, ровно ли четверть составляет борщ.']);
 }
 else if(n===35 && task.reverseRateStudy){
  const kind=task.reverseRateStudy;
  if(kind==='dry'){
   const dry=a===0?27:18;say('Высушено '+dry+' кг; при сушке ушло 64% исходной массы.');
   if(b>=1)say('Сушёные плоды составляют 36% исходной массы.');if(b===2)say('Свежих нужно '+dry+' : 0,36 = '+num(dry/.36)+' кг.');
  }else if(kind==='loss'){
   const sale=a===0?5100:8500;say('Выручено '+sale+' р., убыток — 15% себестоимости.');
   if(b>=1)say('Себестоимость равна 100%, выручка составляет 85%.');if(b===2)say('Себестоимость '+sale+' : 0,85 = '+num(sale/.85)+' р.');
  }else{
   const [old,now]=a===0?[96,120]:[80,104];say('До повышения '+old+' р.; после повышения '+now+' р.');
   if(b>=1)say('За 100% берём прежние '+old+' р.');if(b===2)say('Рост цены '+(now-old)+' : '+old+' × 100 = '+num(100*(now-old)/old)+'%.');
  }
  stepList(['Подпиши, что означает 100%.','Отличай известную часть от полной величины.','Сделай обратную проверку в денежных единицах или килограммах.']);
 }
 else if(n===35 && task.appleSaleStudy){
  const revenue=a===0?3360:3280,cheap=180-b,received=cheap*16+b*20;
  show(table(['Партия','Масса и цена'],[['Первая',cheap+' кг по 16 р.'],['Вторая',b+' кг по 20 р.']]));
  if(state.values[2]===1){say('Выручка '+num(received)+' р., в условии '+revenue+' р.');if(received===revenue)formula('Подходящая доля: '+root.PetersonMath.answer(root.PetersonMath.operation('divide',b,180))+'.');else say('Измени число килограммов, проданных по новой цене.');}
  stepList(['Общее количество товара сохраняется.','Вычисли выручку от каждой части и сложи.','Массу дорогой части сравни со всеми 180 кг.']);
 }
 else if(n===35 && task.fractionTreeStudy){
  const trail=largeFractionTrail(a===1),M=root.PetersonMath;
  say(a===0?'Во внутренней скобке множитель 1,75; снаружи числитель начинается с 10,2.':'Во внутренней скобке вместо 1,75 возьми 3,5. Вместо начального 10,2 возьми 15,5. Остальные числа прежние.');
  show(table(['Что вычислено','Значение'],trail.map(([label,v],i)=>[label,i<b?M.answer(v):'…'])));
  stepList(['Собери вложенные скобки отдельно.','Вычисли числитель и знаменатель большой дроби.','Последнее действие — деление большой дроби.']);
 }
 else if(n===35 && task.oldCoinStudy){
  const M=root.PetersonMath,eggs=a===0?25:15,price=['1/10','1/5','3/10','1/2'][b];
  say('Один десяток — 10 яиц. Проверяем цену '+price+' полушки за яйцо.');
  if(state.values[2]===1){
   const left=M.operation('subtract',M.operation('multiply',eggs,price),1),right=M.operation('subtract',5,M.operation('multiply',5,price));
   show(table(['Что сравнили','В полушках'],[[eggs+' яиц без полушки',M.answer(left)],['5 полушек без 5 яиц',M.answer(right)]]));
   if(M.equal(left,right)){const cost=M.operation('multiply',10,price);say('Равенство верно. Десяток стоит '+M.answer(cost)+' полушки, то есть '+M.answer(M.operation('divide',cost,4))+' копейки.');}
   else say('Группы имеют разную стоимость. Измени цену одного яйца.');
  }
  stepList(['Переведи обе словесные части в одну единицу денег.','Найди цену яйца и цену десятка в полушках.','Только после этого переведи полушки в копейки.']);
 }
 else
 if(n===35 && Number.isInteger(task.logicalIdentity)){
  const [u,v]=[[2,3],[-1,.5],[0,0],[-2,-1]][a],type=task.logicalIdentity;
  const pairs=[[-(u-v),v-u],[-(u+v),-u+v],[u*u,(u+1)**2],[v**3,v*v]],ops=['=','=','>','<'];
  say('a = '+num(u)+', b = '+num(v)+'.');if(b===1){const [left,right]=pairs[type],truth=type<=1?left===right:type===2?left>right:left<right;
   formula(num(left)+' '+ops[type]+' '+num(right)+' — '+(truth?'верно':'неверно')+' для выбранных чисел.');
   say(type<=1?(truth?'Один подходящий пример ещё не проверяет все рациональные числа.':'Получился контрпример к общему утверждению.'):(truth?'Этого примера достаточно для утверждения о существовании.':'Этот пример не подходит; проверь другое число.'));
  }
  stepList(['Прочти квантор.','Сравни части при выбранных значениях.','Реши, что один пример позволяет заключить о кванторе.']);
 }
 else if(n===35 && task.altitudeStudy){
  if(task.altitudeStudy==='picture'){
   const i=task.altitudeDiagram,rows=[
    ['Отрезок CL начинается в вершине C.','Точка L лежит на AB, CL перпендикулярен AB.','Оба условия выполнены. CL — высота ABC.'],
    ['Отрезок DK проведён из вершины D.','Точка K на продолжении EF. DK перпендикулярен прямой EF.','Оба условия выполнены, в том числе при внешнем основании K.'],
    ['Конец R лежит на стороне MN. Он не является вершиной MNP.','RS перпендикулярен прямой MP.','Перпендикулярность есть, но RS не начинается в вершине MNP. В маленьком MRS это катет и высота.'],
    ['В X и Y начинаются катеты, а в Z начинается ZT.','XZ и YZ взаимно перпендикулярны. ZT перпендикулярен XY.','Высоты большого XYZ — катеты XZ, YZ и отрезок ZT.']
   ];show(altitudeDiagram(i,a===2?1:0));say(rows[i-1][a]);
  }else{
   show(altitudeDiagram(a,b,true));if(b===1)say('Из C опущен перпендикуляр к прямой AB.');
   if(b===2)say(['Три прямые встречаются внутри треугольника.','Ортоцентр совпадает с вершиной прямого угла A.','Прямые высот пересекаются за пределами треугольника.'][a]);
  }
  stepList(['Укажи вершину, противоположную выбранной стороне.','Проведи перпендикуляр к прямой, содержащей сторону.','Проверь другую вершину или другую форму треугольника.']);
 }
 else if(n===35 && (task.percentagePortion||task.percentageChange)){
  const M=root.PetersonMath,r=M.parse(task.percentagePortion||task.percentageChange),scale=r.n/r.d,after=a*scale;
  show(percentStrips(a,after));
  if(b===1)formula('Сравниваемая величина: '+M.answer(M.operation('multiply',r,100))+'% от исходной.');
  if(b===2){const delta=M.operation('subtract',r,1),rate=M.operation('multiply',delta,100);say('Изменение относительно начала: '+M.answer(rate)+'%.');}
  stepList(['Отметь, что именно равно 100%.','Отдели итоговую величину от разности.','Для числа процентов умножай отношение на 100.']);
 }
 else if(n===35 && task.percentNarrative){
  const work=task.percentNarrative,values=work.values[a];
  show(table(['Что считаем','Значение'],work.labels.map((label,i)=>[label,i<=b?num(values[i]):'Сначала вычисли'])));
  stepList(['Назови исходную величину для первого процента.','При следующем изменении проверь, что принято за 100%.','Вычисли и проверь формулу на втором наборе.']);
 }
 else
 if(n===35 && task.collectedEquation){
  const e=task.collectedEquation,M=root.PetersonMath,x=M.operation('add',e.solution,b-1);
  const right=a===0?M.parse(e.right):M.operation('add',e.right,e.factor);let left=M.operation('add',M.operation('multiply',e.factor,x),e.constant);
  say(a===0?e.printed:'Слева оставь те же скобки. Теперь вместо прежней правой части поставь '+M.answer(right)+'.');say(e.variable+' = '+M.answer(x)+'.');
  if(state.values[2]===1){show(table(['Часть','Значение'],[['Слева',M.answer(left)],['Справа',M.answer(right)]]));say(M.equal(left,right)?'Равенство выполняется. Корень подходит.':'Значения различны. Проверь другой вариант.');}
  stepList(['Раскрой каждую скобку вместе со знаком множителя.','Собери коэффициенты и свободные числа.','Подставь предложенное число в обе части.']);
 }
 else if(n===35 && task.packingStudy){
  const delta=a===0?16:10,target=a===0?32:45,boxes=b+delta,m1=b*1.5,m2=boxes*.5;
  show(table(['Упаковки','Масса одного вида'],[[b+' пакетов',num(b)+' × 1,5 кг'],[boxes+' коробок',num(boxes)+' × 0,5 кг']]));
  say('Коробок на '+delta+' больше, всего требуется '+target+' кг.');
  if(state.values[2]===1){say('Получилось '+num(m1)+' + '+num(m2)+' = '+num(m1+m2)+' кг.');say(m1+m2===target?'Масса совпала. Всего упаковок '+(b+boxes)+'.':'Масса пока отличается. Одна добавочная пара меняет её на 2 кг.');}
  stepList(['Обозначь число пакетов буквой.','Прибавь разницу, чтобы узнать число коробок.','Сложи массы, затем отдельно сложи количества.']);
 }
 else if(n===35 && task.patrolStudy){
  const [v,t1,t2,target,lake]=a===0?[2,6,8,164,54]:[1,4,6,88,45],s1=(b+v)*t1,s2=(b-v)*t2;
  say('Течение '+v+' км/ч. По течению '+t1+' ч, против — '+t2+' ч. Заданный путь '+target+' км. На озере предстоит '+lake+' км.');
  if(state.values[2]===1){show(tripDistances(s1,s2));say('Речной путь '+s1+' + '+s2+' = '+(s1+s2)+' км.');say(s1+s2===target?'Данные согласуются. На озере '+lake+' : '+b+' = '+num(lake/b)+' ч.':'Этот путь отличается от заданного. Проверь другую собственную скорость.');}
  stepList(['Добавь скорость течения только при движении вниз по реке.','Встречное течение замедляет катер.','Для времени на озере используй собственную скорость.']);
 }
 else if(n===35 && task.spokeStudy){
  const st=task.spokeStudy,M=root.PetersonMath,center=b===0?st.center:st.fresh,[op,v]=st.spokes[a-1];
  const incoming=st.direction==='in',left=incoming?v:center,right=incoming?center:v;
  const operation={'+':'add','−':'subtract','×':'multiply','÷':'divide'}[op];
  show(wheelFigure({...st,center},a-1));say('Луч '+a+': '+wheelLabel(left)+' '+op+' ('+wheelLabel(right)+').');
  if(state.values[2]===1)formula('Ответ '+M.answer(M.operation(operation,left,right))+'.');
  stepList(['Установи начало стрелки.','Прочитай оба числа с их знаками.','Следующий луч считай отдельно от предыдущего.']);
 }
 else if(n===35 && task.factorSum){
  const f=task.factorSum,M=root.PetersonMath,x=a===0?M.parse(f.terms[0]):M.operation('add',f.terms[0],1),y=M.parse(f.terms[1]);
  say(a===0?f.printed:'Увеличь на 1 первое число внутри скобки после вынесения общего множителя.');
  formula('Общий множитель '+M.answer(M.parse(f.factor))+'.');
  if(b!==0){const inside=M.operation('add',x,y);say('В скобках: ('+M.answer(x)+') + ('+M.answer(y)+') = '+M.answer(inside)+'.');if(b===2)say('Весь результат '+M.answer(M.operation('multiply',inside,f.factor))+'.');}
  stepList(['Найди множитель, присутствующий в обоих слагаемых.','Сохрани знак между оставшимися частями.','Выполни одно умножение после сложения.']);
 }
 else if(n===35 && task.differenceSquareStudy){
  const st=task.differenceSquareStudy,[u,v]=st.free?[a,b]:(a===0?st.source:st.fresh),mode=st.free?state.values[2]:b;
  say('a = '+num(u)+', b = '+num(v)+'.');
  if(mode===1)show(table(['Выражение','Значение'],[['(a − b)²',(u-v)**2],['a² − b²',u*u-v*v],['a² − 2ab + b²',u*u-2*u*v+v*v]]));
  if(mode===2){
   if(u===0&&v===0)say('Обе длины равны нулю: квадрат стягивается в точку, его площадь 0.');
   else show(squarePartition(u,-v));
   say('Сторона квадрата — |a − b| = '+num(Math.abs(u-v))+'. Площадь '+num((u-v)**2)+'.');
   say(u*v>0?'Модули вычитаются. Убери две полосы и верни одно общее пересечение.':u*v<0?'При разных знаках исходных чисел модули складываются. Получаются два квадрата и два одинаковых прямоугольника.':'Один из модулей равен нулю, смешанный прямоугольник имеет нулевую площадь.');
  }
  stepList(['Поставь скобки в квадрате всей разности.','Сравни вычисления для разных знаков.','Обоснуй тождество раскрытием произведения двух скобок.']);
 }
 else
 if(n===35 && task.likeTermsStudy){
  const item=task.likeTermsStudy,M=root.PetersonMath,example=likeTermValues(item,a,b===1),group=example.groups[a],mode=state.values[2];
  const label=s=>s==='1'?'Числа без букв':s;
  say(item.printed);
  if(b===1&&!item.substitutions)say('Новый пример: прибавь 1 к первому коэффициенту группы «'+label(group.symbol)+'». Другие группы не меняются.');
  if(item.substitutions||mode===2)say('Подстановка: '+Object.entries(example.numbers).map(([k,v])=>k+' = '+M.answer(M.parse(v))).join(', ')+'.');
  const boxes=el('div','pcm-like-groups');
  for(const g of example.groups){
   const row=el('div','pcm-coefficient-group');
   row.setAttribute('data-symbol',g.symbol);row.setAttribute('data-selected',String(g===group));
   const title=el('strong','',label(g.symbol));row.append(title);
   const terms=el('span','',g.values.map(v=>{const raw=M.answer(v);return raw.startsWith('-')?'−'+raw.slice(1):raw;}).join('; '));
   row.append(terms);boxes.append(row);
  }
  show(boxes);
  if(mode===1)formula('Сумма коэффициентов группы «'+label(group.symbol)+'»: '+M.answer(group.total)+'.');
  else if(mode===2){formula('Значение всего выражения: '+M.answer(example.result)+'.');}
  stepList(['Сохрани знак перед каждым слагаемым.','Проверь все буквы и их степени.','Числа при одинаковой буквенной части можно сложить, саму буквенную часть оставь.']);
 }
 else
 if(n===37&&task.remainingStory){
  const tag=task.remainingStory,data=lastSectionStory(tag,a,b),mode=state.values.at(-1);say(data.title);
  if(mode>=1){show(table(data.columns,data.rows));if(tag==='fuel')show(changeBars(...data.rows.map(row=>row[1]),['Первая','Вторая']));}
  if(mode===2)say(data.conclusion);
  stepList(['Запиши, как связаны исходные величины.','Составь уравнение для изменившихся величин.','Проверь ответ в таблице.']);
 }
 else if((n===19||n===37)&&task.expressionGroup){
  const t=task.expressionGroup,trace=expressionStages(t.tree,a===1);
  formula(t.printed);if(a)say('Для нового примера удвой только самое первое число исходной записи.');
  if(b)show(table(['Действие','Результат'],trace.steps.slice(0,b)));
  if(b===trace.steps.length)say('Точное значение: '+trace.value+'.');
  stepList(['Сначала разбери умножения и деления и выражения в скобках.','При сложении и вычитании выбери общий знаменатель.','Проверь знак результата.']);
 }
 else if(n===37&&task.percentDoubleFraction){
  show(fractionPairFigure());say('Увеличь сумму на '+a+'%.');
  if(b>=1)show(table(['Выражение','Числитель','Знаменатель'],[['Первое','8/105','−8/315'],['Второе','−5/8','−1/6']]));
  if(b>=2)say('Большие дроби −3 и 15/4. Вместе 3/4.');
  if(b===3)say('Множитель '+(1+a/100)+'. Результат: '+root.PetersonMath.answer(root.PetersonMath.operation('multiply','3/4',1+a/100))+'.');
  stepList(['Вычисли над и под каждой большой чертой.','Найди две дроби и сложи.','Увеличение на p% умножает на 1 + p/100.']);
 }
 else if(n===37&&task.threeDigits){
  const digit=BigInt(a),double=BigInt(11*a),values=[BigInt(111*a),double**digit,digit**double,digit**(digit**digit)],labels=[String(a).repeat(3),String(a).repeat(2)+' в степени '+a,a+' в степени '+String(a).repeat(2),a+' в степени ('+a+' в степени '+a+')'];
  formula(labels[b]);const v=String(values[b]);say(v.length<30?'Значение: '+v+'.':'В значении '+v.length+' цифр. Оно начинается с '+v.slice(0,8)+'…');
  stepList(['Назови разрешённые операции.','В самой формуле проверь число использованных одинаковых цифр.','Сравни записи по значению или по показателям степени.']);
 }
 else if(n===37&&task.lifeTimeline){
  const data=lifeYears(a,4);formula('T/6 + T/12 + T/7 + '+a+' + T/2 + 4 = T.');
  if(b>=1)say('Доли дают 25/28 жизни. На оставшиеся 3/28 приходится '+(a+4)+' лет.');
  if(b===2){let age=0;show(table(['Период','Длился, лет','Возраст в конце'],data.segments.map(([s,n])=>[s,n,age+=n])));say('Возраст в конце: '+data.age+' лет.');}
  stepList(['Обозначь полную длину жизни буквой.','Вырази известные доли через один объект.','Сложи шесть непересекающихся интервалов и сверь возраст.']);
 }
 else
 if(n===37&&task.fractionRoutes){
  const printed=task.fractionRoutes,idx=a%3,m=root.PetersonMath;
  const t=a<3?printed:{...printed,upper:printed.upper.map(x=>m.answer(m.operation('add',x,1)))};
  show(fractionRouteFigure(t,idx,b));formula(t.upper[idx]+' '+t.sign+' ('+t.lower[b]+')');
  if(state.values[2]===1)say('Результат: '+root.PetersonMath.answer(fractionRouteResult(t,idx,b))+'.');
  stepList(['Выбери верхний узел.','Пройди через знак действия к нижнему узлу.','Сначала посчитай сам, затем сверь.']);
 }
 else if(n===37&&task.mixedRule){
  const sections=Array.from({length:a},(_,i)=>['Целая единица '+(i+1),b+' равных долей']);sections.push(['Остаток','1 доля']);
  show(table(['Часть числа','Сколько долей'],sections));formula(a+' и 1/'+b);
  if(state.values[2])say('Всего долей: '+a+' × '+b+' + 1 = '+(a*b+1)+'. Дробь: '+(a*b+1)+'/'+b+'.');
  stepList(['Разбей каждую целую единицу на одинаковые доли.','Добавь оставшуюся долю.','Знаменатель остаётся прежним.']);
 }
 else if(n===37&&task.mixedSeries){
  const num=b*2**(a-1),den=2*a+1;formula('Начало: '+b+'/3. Выбран член №'+a+'.');
  if(a>1)say('На предыдущем месте: '+(num/2)+'/'+(den-2)+'.');
  if(state.values[2])say('Получается '+num+'/'+den+' = '+mixedTermText(num,den)+'.');
  stepList(['Удваивай числитель.','Прибавляй к знаменателю два.','Раздели числитель на знаменатель с остатком.']);
 }
 else if(n===37&&task.rationalChain){
  const m=root.PetersonMath,t=task.rationalChain,values=schoolChain(t,a===1);
  formula(a===0?t.print:[m.answer(values[0]),...t.ops.map((v,i)=>v+' ('+t.vals[i+1]+')')].join(' '));
  if(b>0)show(table(['Действие','Точный результат'],t.ops.slice(0,b).map((op,i)=>[m.answer(values[i])+' '+op+' ('+t.vals[i+1]+')',m.answer(values[i+1])])));
  if(b===t.ops.length)say('Итог: '+m.answer(values.at(-1))+'.');
  stepList(['Переведи числа в дроби.','Сохраняй порядок действий и проверяй знак.','Сокращай и контролируй промежуточные результаты.']);
 }
 else if(n===37&&task.fractionCompare){
  const m=root.PetersonMath,t=task.fractionCompare,first=m.parse(t.left),second=m.parse(t.right),u=a===2?m.operation('add',first,'1/'+first.d):a===1?second:first,v=a===1?first:second,cross1=u.n*v.d,cross2=v.n*u.d;
  formula(m.answer(u)+'   ?   '+m.answer(v));if(b>=1){show(table(['Произведение','Значение'],[[u.n+' × '+v.d,cross1],[v.n+' × '+u.d,cross2]]));if(!a)say(t.method+'. '+task.hint);}
  if(b===2)say('Сравнение: '+m.answer(u)+' '+(cross1<cross2?'<':cross1>cross2?'>':'=')+' '+m.answer(v)+'.');
  stepList(['Проверь, можно ли обойтись без общего знаменателя.','Для положительных знаменателей знак определяет порядок перекрёстных произведений.']);
 }
 else
 if(n===37 && task.papyrusBlock){
  const M=root.PetersonMath,block=M.operation('multiply',a,'9/4'),x=M.operation('multiply',block,'3/5');formula('(B + B/3)/3 = '+a);say('B = x + (2/3)x.');
  if(b>=1){show(table(['Операция','Получилось'],[['Умножить обе части на 3',String(a*3)],['Разделить результат на 4/3',M.answer(block)]]));say('Повторяющийся блок B = '+M.answer(block)+'.');}
  if(b===2)say('Из B = (5/3)x получается x = '+M.answer(x)+'.');
  stepList(['Обозначь повторяющуюся сумму.','Отмени последнее умножение на 1/3.','Вернись от блока к исходной букве.']);
 }
 else if(n===37 && task.directedCycle){
  const M=root.PetersonMath,t=task.directedCycle,x=M.operation('multiply',t.start,a?2:1),vals=cycleValues(t,x);show(cycleDiagram(t,x,b));
  if(b>0){const [op,v]=t.ops[b-1];formula(M.answer(vals[b-1])+' '+op+' ('+v+') = '+M.answer(vals[b]));}
  if(b===6)say(M.equal(vals[6],vals[0])?'Цепочка вернулась в исходное число.':'Итог '+M.answer(vals[6])+' отличается от старта '+M.answer(x)+'.');
  stepList(['Найди направление первой стрелки.','Используй результат одного действия как вход следующего.','Проверь последнее число против начального.']);
 }
 else if(n===37 && task.operationRole){
  const M=root.PetersonMath,t=task.operationRole,caseData=componentValues(t,a===1);formula(a===0?t.printed:caseData.expr);
  if(b>=1)say(task.hint);
  if(b===2)say('x = '+M.answer(caseData.solved)+'. В исходном действии получится '+M.answer(caseData.result)+'.');
  stepList(['Назови роль неизвестного числа.','Примени обратное действие в нужном порядке.','Проверь найденное число подстановкой.']);
 }
 else
 if(n===37 && task.equationSituation){
  const key=task.equationSituation;
  if(key==='milk'||key==='honey'){
   const milk=key==='milk',transfer=milk?(a?1:.5):(a?30:60),small=milk?2*transfer:transfer,big=small*(milk?2:4),first=b?big-transfer:big,second=b?small+transfer:small,mode=state.values[2];
   say('Переливаем '+num(transfer)+' л из первой ёмкости во вторую. '+(milk?'После переливания объёмы равны.':'После переливания первый объём в 1,5 раза больше второго.'));
   if(mode>=1){show(changeBars(first,second,['Первая','Вторая']));say('Объёмы '+num(first)+' и '+num(second)+' л.');}
   if(mode===2)say('Отношение первой ко второй: '+num(first/second)+'. Сумма объёмов '+num(first+second)+' л.');
  }else if(key==='grains'){
   const first=a?160:150,restA=first-5*b,restB=120-3*b;
   say('Прошло дней: '+b+'. Каждый день расходуется 5 кг гречки и 3 кг риса.');
   if(state.values[2]){show(changeBars(restA,restB,['Гречка','Рис']));say('Осталось '+restA+' и '+restB+' кг. '+(restA===restB?'Запасы равны.':'Разница '+Math.abs(restA-restB)+' кг.'));}
  }else if(key==='workers'){
   const days=a?6:10,done1=25*days,done2=20*days,difference=done1-done2;
   say('Заказ каждому одинаков. Скорости 25 и 20 деталей в день. Работали '+days+' дней.');
   if(b>=1)say('Сделано '+done1+' и '+done2+' деталей, разность '+difference+'.');
   if(b===2){show(table(['Рабочий','Сделано','Осталось'],[['Первый',done1,difference],['Второй',done2,2*difference]]));say('Заказ каждому '+(done1+difference)+' деталей.');}
  }else if(key==='languages'){
   const unit=a/3;say('Немецкий учат '+a+' человек.');
   if(b>=1)show(table(['Язык','Часть класса'],[['Французский','7/14'],['Английский','4/14'],['Немецкий','3/14']]));
   if(b===2)say('Ученики: '+num(7*unit)+', '+num(4*unit)+', '+a+'. Всего '+num(14*unit)+'.');
  }else{
   const first=9*a,second=10*a,third=8*a;say('Во второй час на '+a+' км больше, чем в первый. В третий — 80% второго.');
   if(b>=1)say('Первый час '+first+' км.');
   if(b===2){show(table(['Час','Километры'],[['Первый',first],['Второй',second],['Третий',third]]));say('Весь путь '+(first+second+third)+' км.');}
  }
  stepList(['Отдели начальные данные от конечного условия.','Запиши связь величин в уравнении.','Подставь ответ и проверь все части условия.']);
 }
 else
 if(n===37 && task.linearEquationStudy){
  const item=task.linearEquationStudy,M=root.PetersonMath,vals=linearBalanceValues(item,a===1),cand=linearBalanceCandidates(item)[b],mode=state.values[2],x=item.variable;
  say('Исходная запись: '+item.printed+'.');
  if(a===1)say(vals.identity?'В новом примере к правой части прибавь 1. Как изменилось множество корней?':vals.constantComparison?'В новом примере свободный член справа равен свободному члену слева. Как изменилось множество корней?':'В новом примере в обеих частях вместо '+x+' поставь ('+x+' − 1).');
  if(mode===1){show(table(['Часть','Коэффициент','Свободный член'],[['Левая',M.answer(vals.a),M.answer(vals.left)],['Правая',M.answer(vals.c),M.answer(vals.right)]]));}
  if(mode===2){
   if(item.clear){const scaled=[vals.a,vals.left,vals.c,vals.right].map(q=>M.operation('multiply',q,item.clear));say('Умножаем обе части на '+item.clear+'.');formula(writeLinearTerm(scaled[0],scaled[1],x)+' = '+writeLinearTerm(scaled[2],scaled[3],x));}
   else{formula(writeLinearTerm(vals.k,M.parse(0),x)+' = '+M.answer(vals.target));say('Буквенные члены собраны слева, числа — справа.');}
  }
  if(mode===3){const pair=[[vals.a,vals.left],[vals.c,vals.right]].map(([coef,n])=>M.operation('add',M.operation('multiply',coef,cand),n));show(table(['Часть','При '+x+' = '+cand],[['Левая',M.answer(pair[0])],['Правая',M.answer(pair[1])]]));say(M.equal(...pair)?'Подстановка даёт равенство.':'Части не совпали, кандидат не подходит.');}
  if(mode===4){if(vals.root)say('Корень '+x+' = '+M.answer(vals.root)+'.');else say(vals.target.n?'Получено противоречие. Корней нет.':'Получено верное равенство без переменной. Все рациональные числа являются корнями.');}
  stepList(['Раскрой скобки и собери подобные члены на каждой стороне.','Сохрани равенство, применяя одну операцию к обеим сторонам.','Проверь найденный корень или докажи полное множество решений.']);
 }
 else
 if(n===18 && task.reviewRatio){
  const t=task.reviewRatio,M=root.PetersonMath,x=M.operation('multiply',t.values[0],a?2:1),y=M.parse(t.values[1]),q=M.operation('divide',x,y);
  formula('('+M.answer(x)+') : ('+M.answer(y)+')');
  if(b>=1)say('Значение отношения '+M.answer(q)+'.');
  if(b===2)say(t.percent?'Процентное отношение '+M.answer(M.operation('multiply',q,100))+'%.':'Целые взаимно простые члены: '+q.n+' : '+q.d+'.');
  stepList(['Переведи величины в одинаковые единицы.','Раздели первый член на второй.','Для процента умножь значение отношения на 100.']);
 }
 else if(n===18 && task.cancelRatio){
  const M=root.PetersonMath;formula('2ab/(6a)');say('a = '+a+', b = '+b+'.');
  if(state.values[2]){if(a===0)say('Исходная дробь не определена. Сокращение не разрешает подставить исключённое значение a = 0.');else say('Исходное значение '+M.answer(M.operation('divide',2*a*b,6*a))+' и b/3 = '+M.answer(M.operation('divide',b,3))+'.');}
  stepList(['Выдели общий множитель.','Проверь, что он не равен нулю.','Сохрани ограничение после сокращения.']);
 }
 else if(n===18 && task.reviewMap){
  const type=task.reviewMap,[cm,km,scale]=unitMapData[type][a],per=scale/100000;
  if(type==='scale')say('На карте '+num(cm)+' см, на местности '+num(km)+' км.');
  else if(type==='map')say('На местности '+num(km)+' км. Масштаб 1 : '+num(scale)+'.');
  else say('На карте '+num(cm)+' см. Масштаб 1 : '+num(scale)+'.');
  if(b>=1)say('Одному сантиметру соответствует '+num(per)+' км.');
  if(b===2)show(table(['Величина','Значение'],[['Карта',num(cm)+' см'],['Местность',num(km)+' км'],['Масштаб','1 : '+num(scale)]]));
  stepList(['Установи связь 1 км = 100 000 см.','Найди расстояние, приходящееся на 1 см карты.','Сопоставь длину на карте и на местности.']);
 }
 else if(n===18 && task.reviewPercentageWord){
  const k=task.reviewPercentageWord;
  if(k==='distance'){const part=a?36:20;say('Известная пятая часть пути: '+part+' км.');if(b>=1)say('Один процент: '+num(part/20)+' км.');if(b===2)say('Весь путь '+num(part*5)+' км.');}
  if(k==='printer'){const total=a?120:80;say('Страниц в документе '+total+'.');if(b>=1)say('За две минуты напечатали '+num(.55*total)+' страниц.');if(b===2)say('Осталось '+num(.45*total)+' страниц.');}
  if(k==='price'){const price=a?250:200,gain=a?50:30;say('Начальная цена '+price+' руб., прибавка '+gain+' руб.');if(b>=1)say('Новая цена '+(price+gain)+' руб.');if(b===2)say('Процентное повышение '+num(100*gain/price)+'%.');}
  if(k==='winners'){const total=a?150:100;say('Участников '+total+'.');if(b>=1)say('Призёров '+num(total*.1)+'.');if(b===2)say('Женщин среди призёров '+num(total*.04)+'.');}
  stepList(['Назови исходную величину для процента.','Проверь буквенное выражение на выбранных числах.','Проверь, разумны ли единицы ответа.']);
 }
 else if(n===18 && task.reviewArithmetic){
  const M=root.PetersonMath,c=reviewOperationChain(task.reviewArithmetic,a===1);formula(c.expr);
  if(b)show(table(['Действие','Точное значение'],c.steps.slice(0,b).map(([name,val])=>[name,M.answer(val)])));
  if(b===c.steps.length)say('Окончательное значение '+M.answer(c.steps.at(-1)[1])+'.');
  stepList(['Сначала вычисли внутренние скобки.','Отрабатывай умножение и деление равного приоритета слева направо.','Заверши последнее сложение или вычитание.']);
 }
 else
 if(n===18 && task.tariffStudy){
  const increment=a/4,salary=a+(b-1)*increment,mode=state.values[2];
  say('Первый разряд: '+num(a)+' руб. Постоянная прибавка: '+num(increment)+' руб.');
  if(mode>=1){show(table(['Разряд','Шагов','Тариф, руб.'],[[b,b-1,num(salary)]]));say('Отношение выбранного тарифа к первому: '+root.PetersonMath.answer(root.PetersonMath.operation('divide',salary,a))+'.');}
  if(mode===2)say('Превышение над первым тарифом: '+num((b-1)*25)+'% начальной суммы.');
  stepList(['Вычисли четверть начальной ставки.','Сосчитай промежутки между разрядами.','Сравни общий прирост с начальной суммой.']);
 }
 else if(n===18 && task.scoreRanking){
  const scores=task.scoreRanking.map(([letter,...marks],i)=>({letter,marks:b&&i===0?[34,96,83,87]:marks,i})),M=root.PetersonMath,mode=state.values[2];
  for(const row of scores){row.sum=row.marks.reduce((x,y)=>x+y,0);row.mean=M.operation('divide',row.sum,4);row.index=M.operation('divide',row.mean,75);}
  const picked=scores[a];say('Строка '+(a+1)+', буква '+picked.letter+', баллы '+picked.marks.join(', ')+'. Общее среднее 75.');
  if(mode>=1)say('Средний балл '+M.answer(picked.mean)+', коэффициент '+M.answer(picked.index)+'.');
  if(mode===2){const order=[...scores].sort((a,b)=>b.sum-a.sum);show(table(['Строка','Буква','Коэффициент'],order.map(x=>[x.i+1,x.letter,M.answer(x.index)])));if(b===0)say('Слово: '+order.map(x=>x.letter).join('')+'.');}
  stepList(['Вычисли среднее четырёх результатов.','Раздели на одно общее среднее.','Отсортируй по убыванию и прочти буквы.']);
 }
 else if(n===18 && task.triangleSection){
  const but=sectionTriangle(a,b),mode=state.values[2],r=['1/2','1','2'][b],upper=['2/3','1/2','1/3'][b];show(but.svg);
  if(mode>=1)show(table(['Отрезок','Длина на схеме'],['AM','MB','BN','NC'].map(k=>[k,num(but[k])])));
  if(mode===2){formula('AM/MB = NC/BN = '+r);formula('MB/AB = BN/CB = '+upper);say('Проверка чертежа даёт примеры. Общий вывод опирается на подобие треугольников BMN и BAC.');}
  stepList(['Проверь, что MN и AC параллельны.','Сравни соответствующие куски боковых сторон.','Получи отношения с полной стороной и объясни общий случай.']);
 }
 else if(n===18 && task.classParts){
  say('Экскурсия — 2/3 класса. Кино — 1/4 класса и ещё '+a+' чел.');
  if(b>=1)show(table(['Часть','Из 12 равных долей'],[['Экскурсия','8'],['Кино, известная четверть','3'],['Остаток','1']]));
  if(b===2)say('В классе '+12*a+' чел. Экскурсия '+8*a+', кино '+4*a+'.');
  stepList(['Перейди к двенадцатым.','Найди незанятую долю.','Восстанови обе группы и проверь их сумму.']);
 }
 else if(n===18 && task.simpleMonths){
  const [start,end,months]=a?[1000,1040,4]:[5000,5225,6],gain=(end-start)/months,monthly=gain*100/start;
  say('Первоначально '+num(start)+' руб., через '+months+' мес. — '+num(end)+' руб. Проценты простые.');
  if(b>=1)say('Весь доход '+num(end-start)+' руб., за один месяц '+num(gain)+' руб.');
  if(b===2)say('Месячная ставка '+num(monthly)+'%, простая годовая ставка '+num(monthly*12)+'%.');
  stepList(['Вычти первоначальный вклад.','Раздели прибавку на число месяцев.','Отнеси месячную прибавку к первоначальному вкладу и умножь ставку на 12.']);
 }
 else if(n===18 && task.gridDivision){
  const design=task.gridDivision,d=cutPatterns[design],plan=a?d.plans[a-1]:null,mode=state.values[2];show(cutGridFigure(design,plan,b));
  if(!plan)say('Линии внутри пока только делят фигуру на клетки. Выбери разрез и проверь свои наблюдения.');
  if(plan&&mode){const pieces=cellPieces(plan),first=shapeSignature(pieces[0]),congruent=design==='pentomino';
   const checks=pieces.map((cells,i)=>{const dots=cells.filter(v=>d.dots.has(v.join(','))).length,ok=connectedCells(cells)&&cells.length===(congruent?5:3)&&(congruent?shapeSignature(cells)===first:dots===1);return {i,cells,dots,ok};});
   const selected=b?checks.filter(r=>r.i===b-1):checks;show(table(['Часть','Клеток',congruent?'Та же форма и связность':'Кружков'],selected.map(({i,cells,dots,ok})=>[i+1,cells.length,congruent?(ok?'Да':'Нет'):dots])));
   say(checks.every(r=>r.ok)?'Этот разрез выполняет оба условия.':'Для этого разреза одинакового числа клеток недостаточно: нарушена форма, связность или количество кружков.');
  }
  stepList(['Проверь количество клеток.','Выдели по очереди каждую связную часть.','Для A сравни формы, для B сосчитай кружки.']);
 }
 else if(n===18 && task.fiveMultiples){
  const values=[1,2,3,4,5].map(v=>v*b),digits=values.join(''),required=a?'123456789':'0123456789',missing=[...required].filter(x=>!digits.includes(x)),extra=[...new Set([...digits].filter((x,i)=>!required.includes(x)||digits.indexOf(x)!==i))];
  say('Карточки: '+required+'. Начальное число '+b+'.');show(table(['Множитель','Число'],values.map((x,i)=>[i+1,x])));
  if(state.values[2]){if(missing.length)say('Нужно ещё использовать: '+missing.join(', ')+'.');if(extra.length)say('Лишняя или повторная цифра: '+extra.join(', ')+'.');
   const ok=!missing.length&&!extra.length&&(a||values.every(x=>x>=10&&x<100));say(ok?'Каждая доступная карточка использована ровно один раз, раскладка подходит.':'Раскладка не подходит.');
  }
  stepList(['Запиши пять последовательных кратных k.','Проверь диапазон чисел для выбранного набора.','Сосчитай вхождения каждой цифры.']);
 }
 else
 if(n===18 && task.missingOperation){
  const M=root.PetersonMath,t=task.missingOperation,params=t.terms.map(M.parse),[x,y]=a?[M.operation('add',params[0],1),params[1]]:params;
  const correct=operationKeys[operationSigns.indexOf(task.answer)],target=a?M.operation(correct,x,y):M.parse(t.target);
  formula(M.answer(x)+' □ '+M.answer(y)+' = '+M.answer(target));say('Выбран знак '+operationSigns[b]+'.');
  if(state.values[2]){const val=M.operation(operationKeys[b],x,y);say('После выбранного действия: '+M.answer(val)+'. '+(M.equal(val,target)?'Равенство получилось.':'Получилось другое значение.'));}
  stepList(['Переведи числа в удобную форму.','Проверь выбранное действие.','Измени данные и попробуй снова.']);
 }
 else if(n===18 && task.wholeFromExtras){
  const M=root.PetersonMath,t=task.wholeFromExtras,v=wholeFromExtraValues(t,a),unit=t.scene==='field'?'га':'деталей';
  say('К известным долям '+t.values[0]+' и '+t.values[1]+' добавлено '+M.answer(v.a)+' и '+M.answer(v.b)+' '+unit+'.');
  if(b>=1)say('Оставшаяся доля целого '+M.answer(v.rest)+'.');
  if(b===2){show(table(['Часть','Количество'],[['Первая',M.answer(v.first)],['Вторая',M.answer(v.second)],['Всё целое',M.answer(v.total)]]));say('Целое '+M.answer(v.total)+' '+unit+'.');}
  stepList(['Сложи известные доли одного целого.','Оставшейся доле соответствует сумма двух добавок.','После вычисления целого пересчитай обе части.']);
 }
 else if(n===18 && task.outputRates){
  const type=task.outputRates;
  if(type==='factories'){
   const [first,second,gain]=a?[12,20,3]:[8,10,2];say('Годовой выпуск до реконструкции: '+first+' и '+second+' тыс. автомобилей. Прибавка у каждого '+gain+' тыс.');
   if(b>=1)show(table(['Завод','До','После'],[['Первый',first,first+gain],['Второй',second,second+gain]]));
   if(b===2)say('Приросты: '+num(100*gain/first)+'% и '+num(100*gain/second)+'%. Разность '+num(100*gain/first-100*gain/second)+' процентных пунктов.');
  }else{
   const isYear=type==='twoYears',start=a?200:100,stage=isYear?(a?0.8:0.9):(a?2.5:3.6),next=isYear?(a?1.25:1.2):(a?0.4:0.25),middle=start*stage,last=middle*next;
   say('Вначале '+start+'. Первый множитель '+num(stage)+', второй '+num(next)+'.');
   if(b>=1)show(table(['Этап','Уровень','База сравнения'],[['Старт',start,'—'],['Середина',num(middle),start],['Финиш',num(last),num(middle)]]));
   if(b===2){const delta=(last-start)*100/start;say('Относительно начала: '+(delta>0?'рост '+num(delta)+'%':delta<0?'снижение '+num(-delta)+'%':'уровень тот же')+'.');}
  }
  stepList(['Выдели исходное количество для каждого процента.','Найди промежуточное значение.','Сравни конечную величину с начальной.']);
 }
 else
 if(n===18 && task.derivedProof){
  const q=validationQuartets[a].values,[x,y,z,w]=q,pairs=[[[x,y],[z,w]],...transformedFractions(task.derivedProof,q)];
  say('a = '+x+', b = '+y+', c = '+z+', d = '+w+'.');
  if(b>=1){show(table(['Запись','Проверяем','Вывод'],pairs.map((pair,i)=>[i===0?'Исходная':'Новая '+i,pair.map(([n,d])=>n+'/'+d).join(' = '),inspectFractionPair(pair)])));
   const undefinedCase=pairs.some(pair=>pair.some(([,d])=>d===0));say(undefinedCase?'Равносильность этих записей проверяют только на их общей области определения.':'Все знаменатели допустимы. Обоснуй связь для любых допустимых значений.');}
  if(b===2)say(task.explanation);
  stepList(['Выпиши все знаменатели.','Сравни результат одинакового обратимого преобразования.','Различи равенство дробей и пропорцию из ненулевых членов.']);
 }
 else if(n===18 && task.deriveThree){
  const t=task.deriveThree,terms=a===0?t.terms:['5','3','20','12'],tag=[1,t.variant==='subtract'?2:3,4][b],spell=(v,w,op)=>'('+v+op+w+')';
  const [x,y,z,w]=terms;formula(x+' / '+y+' = '+z+' / '+w);
  if(state.values[2]){const showTerms=tag===1?[spell(x,y,'+'),y,spell(z,w,'+'),w]:tag===2?[spell(x,y,'−'),y,spell(z,w,'−'),w]:tag===3?[spell(y,x,'−'),y,spell(w,z,'−'),w]:[x,spell(x,y,'+'),z,spell(z,w,'+')];
   formula(showTerms[0]+' / '+showTerms[1]+' = '+showTerms[2]+' / '+showTerms[3]);
   if(terms.every(v=>Number.isFinite(Number(v)))){const p=transformedFractions(tag,terms.map(Number))[0];show(table(['Левая дробь','Правая дробь'],[[p[0].join('/'),p[1].join('/')]]));say(inspectFractionPair(p)+'.');}
   else say('Укажи, какие буквы и суммы или разности должны отличаться от нуля.');
  }
  stepList(['Выбери преобразование.','Примени его одинаково к обеим частям.','Проверь каждую новую пару дробей.']);
 }
 else if(n===18 && task.parallelIntercept){
  const k=[1.5,2,2.5][b],i=state.values[2],lower=[2,1.5,3.5][i],u=lower*k,span=['₁–₂','₂–₃','₁–₃'][i];show(rayInterceptFigure(a,k,i));
  show(table(['Отрезок','Длина на схеме'],[['B'+span,num(u)],['C'+span,num(lower)]]));
  say('Отношение отмеченных длин: '+num(u)+' : '+num(lower)+' = '+num(k)+'.');
  if(task.parallelIntercept==='measure')say('В книге длины соседних отрезков близки к 40 и 30 мм на B, к 20 и 15 мм на C. На экране схема построена заново.');
  if(task.parallelIntercept==='sum')say('Если каждая верхняя длина в k раз больше нижней, сумма верхних равна k, умноженному на сумму нижних.');
  stepList(['Сравни соседние пары.','Измени угол или коэффициент.','Реши, какой вывод требует доказательства.']);
 }
 else if(n===18 && task.thalesCipher){
  const M=root.PetersonMath,[letter,x,y,z,w]=task.thalesCipher[a],left=M.operation('divide',x,y),right=M.operation('divide',z,w);
  formula(letter+': '+x+' : '+y+' = '+z+' : '+w+' ?');
  if(b>=1)say('Слева '+M.answer(left)+', справа '+M.answer(right)+'. '+(M.equal(left,right)?'Равенство верно, буква входит в имя.':'Равенство ложно, букву пропусти.'));
  if(b===2){say(task.explanation);const link=el('a','', 'Биография Фалеса в архиве Университета Сент-Эндрюса');link.href='https://mathshistory.st-andrews.ac.uk/Biographies/Thales/';link.target='_blank';link.rel='noopener noreferrer';show(link);}
  stepList(['Проверь обе части точно.','Собери буквы истинных строк в имя.','Укажи город и эпоху учёного.']);
 }
 else
 if(n===18 && task.sourceRearrangement){
  const item=task.sourceRearrangement,M=root.PetersonMath,s=sourceTerms(item,b),ord=quartetOrders[a],mode=state.values[2];
  show(table(['Место','Член',...(item.symbolic?['Для подстановки']:[])],s.names.map((v,i)=>[String.fromCharCode(65+i),v,...(item.symbolic?[M.answer(s.values[i])]:[])])));
  formula(orderRatio(s.names,ord));
  if(item.symbolic)say('Для перестановок считаем все буквы ненулевыми. Числа в таблице — один пример допустимой подстановки.');
  if(mode>=1){
   const [v,w,x,y]=ord.map(j=>s.values[j]),outer=M.operation('multiply',v,y),inner=M.operation('multiply',w,x),ok=preservesProducts(ord);
   say('Крайние дают '+M.answer(outer)+', средние '+M.answer(inner)+'. '+(ok?'Порядок сохраняет исходные пары множителей.':'Здесь множители исходных пар перемешаны.'));
  }
  if(mode===2){show(table(['Все восемь записей'],quartetOrders.filter(preservesProducts).map(v=>[orderRatio(s.names,v)])));say('Для крайних есть две пары. Два порядка в каждой паре дают 2 × 2 × 2 = 8.');}
  stepList(['Выбери порядок и составь два отношения.','Сравни произведение крайних с произведением средних.','Запиши все варианты без повторений.']);
 }
 else if(n===18 && task.constantRateStory){
  const t=task.constantRateStory,M=root.PetersonMath,s=storyRateRows(t,a),[u,v]=s.amounts,[y,z]=s.outputs.map(M.answer);
  say('Постоянный коэффициент: '+t.name+' = '+M.answer(s.rate)+'.');show(table(['Случай',t.x,t.y],[['I',num(u),b?y:'?'],['II',num(v),b?z:'?']]));
  if(b===2){const ratio=M.answer(M.operation('divide',v,u));formula(y+' : '+u+' = '+z+' : '+v);formula(v+' : '+u+' = '+z+' : '+y);say('От первого случая ко второму обе величины выросли в '+ratio+' раза.');}
  stepList(['Определи, что осталось постоянным.','Найди вторые значения обеих пар.','Сравни стоимости, работы, площади или массы в том же порядке.']);
 }
 else
 if(n===36 && task.quantifiedEquation){
  const rule=task.quantifiedEquation,mode=state.values.at(-1);say(quantifiedReadings[rule]);
  say('Подстановка: a = '+num(a)+(rule==='nonzeroProduct'?', b = '+num(b):'')+'.');
  if(mode>=1)say(evaluateClaim(rule,a,b));
  if(mode===2)say(task.explanation);
  stepList(['Уточни, нужно ли условие для всех или достаточно одного свидетеля.','Проверь граничное значение: ноль.','Для ложного утверждения смени квантор и отрицай условие.']);
 }
 else if((n===18||n===36) && task.storyBalance){
  const t=storyBalances[task.storyBalance.rule][a],inputs=balanceInputs(task),q=root.PetersonMath.parse(inputs[b]),x=q.n/q.d,mode=state.values[2];
  formula(t.equation);if(mode){formula(t.stages[mode-1]);if(mode===3){const pair=t.calc(x);
   if(pair){show(table(['Проверяем','Значение'],[['Слева',num(pair[0])],['Справа',num(pair[1])]]));say('Кандидат '+inputs[b]+(pair[0]===pair[1]?' подходит.':' не подходит.'));if(task.storyBalance.rule==='halfAfterFive')say('В таблице обе части исходного уравнения умножены на 2.');if(task.storyBalance.rule==='gainRatio')say('В таблице сравниваются произведения крайних и средних членов.');}
   else say('Ноль исключён: исходный знаменатель равен нулю.');
  }}
  stepList(['Обозначь неизвестное буквой.','Применяй одинаковое действие к обеим частям.','Проверь результат в исходной задаче.']);
 }
 else if((n===36||n===37) && task.naturalTrials){
  const t=task.naturalTrials,mode=state.values[2],rhs=a===0?t.rhs:extraTrials[t.rule],value=trialRules[t.rule](b);
  formula(t.equation.split(' = ')[0]+' = '+rhs);say('Кандидат: x = '+b+'.');
  if(mode>=1)say('Левая часть '+num(value)+', правая '+num(rhs)+'. Число '+(value===rhs?'подходит.':'не подходит.'));
  if(mode===2&&finiteSourceCases[t.rule]){
   const item=finiteSourceCases[t.rule];say(item.why);
   const candidates=t.rule==='threeSquare'?(a?[1,5]:[1,3,5,15]):item.candidates;
   if(candidates)show(table(['x','Левая часть исходной записи'],candidates.map(x=>[x,trialRules[t.rule](x)])));
  }else if(mode===2){if(t.rule==='boundedThree'){const candidates=[10,11,12,13,14];show(table(['x','Произведение'],candidates.map(x=>[x,trialRules[t.rule](x)])));say('При x ≤ 9 и x ≥ 15 произведение неположительно. Для положительного ответа достаточно этой таблицы.');}else say(t.rule==='rectSubtract'?'При x ≤ 4 произведение неположительно, а для x ≥ 5 оба множителя положительны и растут.':'Оба положительных множителя растут с натуральным x. Найденное верное значение единственно.');}
  stepList(['Выбери пробное число.','Сравни с требуемым результатом.','Объясни, какие оставшиеся кандидаты можно исключить.']);
 }
 else if(n===36 && task.finalRootFamily){
  const t=task.finalRootFamily,q=root.PetersonMath.parse(endFamilyCandidates[a]),pair=finalFamilyPair(t.rule,q.n/q.d);
  formula(t.equation);say('Проверяем число '+endFamilyCandidates[a]+'.');
  if(b>=1){show(table(['Левая часть','Правая часть'],[[num(pair[0]),num(pair[1])]]));say(pair[0]===pair[1]?'Получили равенство.':'Части не равны.');}
  if(b===2)say(task.explanation);
  stepList(['Проверь знаки после раскрытия скобок.','При квадрате и модуле учти все варианты.','Обоснуй полное множество корней.']);
 }
 else if(n===36 && task.newtonCapital){
  const years=state.values[2],history=yearlyCapital(b,a);
  say('Старт '+b+' фунтов. В начале каждого года расход '+a+' фунтов, затем к остатку добавляется его треть.');
  if(years)show(table(['Год','После расхода','Треть','Итог'],history.rows.slice(0,years)));
  if(years===3){const good=root.PetersonMath.equal(history.final,2*b);say('Через три года '+root.PetersonMath.answer(history.final)+' фунтов. Двойная начальная сумма '+(2*b)+'. '+(good?'Кандидат подходит.':'Кандидат не подходит.'));}
  stepList(['Вычти годовой расход до начисления.','Возьми треть именно нового остатка.','Сравни третий итог с удвоенной начальной суммой.']);
 }
 else
 if(n===36 && task.identityProof){
  const desc=task.identityProof,property=proofProperties[desc.rule],pair=property.evaluate(a);formula(desc.equation);
  say('Твоя подстановка: x = '+num(a)+'.');
  if(b>=1){show(table(['Левая часть','Правая часть'],[[num(pair[0]),num(pair[1])]]));say(pair[0]===pair[1]?'На выбранном числе части равны.':'На выбранном числе части различаются.');}
  if(b===2)say(property.law);
  stepList(['Выбери число для исследования.','Запиши отдельно общий закон.','Свяжи общий закон с ответом про все рациональные числа.']);
 }
 else if(n===36 && task.rootFamily){
  const M=root.PetersonMath,t=task.rootFamily,q=M.parse(familyCandidates[a]),[left,right]=familyPair(t.rule,q);formula(t.equation);say('Проверь число '+M.answer(q)+'.');
  if(b>=1){show(table(['Левая часть','Правая часть'],[[M.answer(left),M.answer(right)]]));say(M.equal(left,right)?'Это число подходит.':'Это число не подходит.');}
  if(b===2)say(task.explanation);
  stepList(['Подставь выбранное число.','Сравни обе части.','Объясни, какие ещё числа возможны.']);
 }
 else if(n===36 && Number.isInteger(task.rootDomain)){
  const values=a===0?['-2','0','5/3']:['-3','0','5/2'],mode=state.values[2];
  formula(a===0?'3x(x + 2)(3x − 5) = 0':'3x(x + 3)(2x − 5) = 0');say('Множество: '+domainNames[b]+'.');
  if(mode>=1)show(table(['Нулевой множитель','Кандидат'],[[a===0?'x + 2':'x + 3',values[0]],['x',values[1]],[a===0?'3x − 5':'2x − 5',values[2]]]));
  if(mode===2){const allowedValues=values.filter(v=>passesDomain(v,b));say(allowedValues.length?'В этом множестве: '+allowedValues.join(', ')+'.':'В этом множестве корней нет.');}
  stepList(['Найди нули каждого переменного множителя.','Проверь принадлежность каждого кандидата множеству.','Объясни судьбу нуля и дробного корня.']);
 }
 else if(n===36 && task.inverseChain){
  const row=reciprocalSteps[b-1],start=reciprocalSteps.slice(0,b-1).reduce((value,step)=>value*step[2],a);
  say('Шаг '+b+'. Исходное число для всей цепочки: '+a+'. Перед этой стрелкой: '+num(start)+'.');formula('Делим на '+row[0]+' или умножаем на '+row[1]+'.');
  if(state.values[2]){const after=num(start*row[2]);show(table(['Операция','Получилось'],[[num(start)+' ÷ '+row[0],after],[num(start)+' × '+row[1],after]]));say('После этого шага: '+after+'.');}
  stepList(['Определи число перед стрелкой.','Посчитай верхнее и нижнее действия.','Сравни, объясни общий результат и проверь другой старт.']);
 }
 else if(n===36 && task.unarySequence){
  const M=root.PetersonMath,desc=task.unarySequence,v=unaryValue(desc.rule,a);formula(desc.expression);say('Подстановка: x = '+num(a)+'.');
  if(b)say(v===null?'При x = 0 операция не определена: нельзя делить на ноль.':'Значение выражения: '+M.answer(M.parse(v))+'.');
  stepList(['Прочитай выражение от буквы к внешнему знаку.','Зафиксируй, что стоит в скобках, под модулем или в знаменателе.','Выполни действия при новом x.']);
 }
 else
 if(n===36 && task.equationNotation){
  const t=task.equationNotation,expr=t.examples[a],hasEquals=t.kind===0||t.kind===1,hasLetter=t.kind!==0;
  formula(expr);
  if(b>=1)say(hasEquals?'Между двумя частями стоит знак =.':t.kind===3?'Записи связывает знак неравенства.':'Есть одно выражение. Знака равенства нет.');
  if(b===2)say((hasLetter?'Обозначена переменная. ':'Переменной нет. ')+['Это равенство чисел.','Это уравнение.','Это выражение без равенства.','Это неравенство.'][t.kind]);
  stepList(['Прочитай целую запись.','Найди равенство и неизвестное.','Проверь признак на новом примере.']);
 }
 else if(n===36 && task.rootProbe){
  const t=task.rootProbe,M=root.PetersonMath,q=M.parse(rootProbeValues[a]),[left,right]=evaluateRootProbe(t.rule,q);
  formula(t.equation);say('Подставь '+t.letter+' = '+M.answer(q)+'.');
  if(b>=1)show(table(['Часть','Значение'],[['Левая',M.answer(left)],['Правая',M.answer(right)]]));
  if(b===2)say(M.equal(left,right)?'Значения совпали: это число является корнем.':'Значения различны: это число не является корнем.');
  stepList(['Подставь одно и то же число во все вхождения буквы.','Отрицательные числа при возведении в квадрат заключай в скобки.','Сравни обе части до вывода.']);
 }
 else if(n===36 && task.rootCount){
  const t=task.rootCount,v=evaluateRootCount(t.rule,a);formula(t.equation);say('Пробное значение переменной: '+num(a)+'.');
  if(b>=1){if(v===null)say('Знаменатель равен нулю: подстановка не допускается.');else show(table(['Левая часть','Правая часть'],[[num(v),num(t.rhs)]]));}
  if(b===2&&v!==null)say(v===t.rhs?'Выбранное число подходит. Обоснуй, полный ли список.':'При выбранном числе равенство неверно. Другие числа нужно проверять или исключать рассуждением.');
  stepList(['Выдели область допустимых значений.','Примени знак квадрата, модуля или правило нулевого произведения.','Отдели проверку одного числа от полного решения.']);
 }
 else
 if(n===17 && task.ratioRectangle){
  const long=[31.5,42,35][a],unit=long/7,short=4*unit;
  say('Стороны относятся как 4 : 7, большая '+num(long)+' см.');
  if(b>=1){show(changeBars(short,long,['Меньшая сторона','Большая сторона']));say('Одна доля '+num(unit)+' см. Меньшая сторона '+num(short)+' см.');}
  if(b===2)say('Периметр '+num(2*(short+long))+' см, площадь '+num(short*long)+' см².');
  stepList(['Найди длину одной доли.','Восстанови обе стороны.','Длину контура и площадь указывай в разных единицах.']);
 }
 else if(n===17 && task.roadMeeting){
  const [distance,time,factor]=[[145,'2.5','1.5'],[100,'2.5','1.5'],[120,3,'1.25']][a],M=root.PetersonMath,truck=M.operation('divide',1,time),car=M.operation('multiply',truck,factor),meeting=M.operation('divide',1,M.operation('add',truck,car));
  say('Длина пути '+distance+' км. Время грузовика '+M.answer(M.parse(time))+' ч. Скорость легкового автомобиля в '+M.answer(M.parse(factor))+' раза больше.');
  if(b>=1)show(table(['Транспорт','Долей пути в час','Км/ч'],[['Грузовик',M.answer(truck),M.answer(M.operation('multiply',truck,distance))],['Легковой',M.answer(car),M.answer(M.operation('multiply',car,distance))]]));
  if(b===2)say('Время встречи '+M.answer(meeting)+' ч. Изменение только длины пути не меняет времени при том же полном времени грузовика.');
  stepList(['Прими весь маршрут за единицу.','При встречном движении сложи скорости.','Сравни с расчётом в километрах.']);
 }
 else if(n===17 && task.fixedRectangle){
  const sizes=[1,1.5,2,3,4,8,12],x=sizes[b],M=root.PetersonMath;show(fixedAreaGraph(a,x,state.values[2]===1));say('Площадь '+a+' см², выбранная длина a = '+num(x)+' см.');
  if(state.values[2]===1){show(table(['a, см','b, см'],sizes.map(n=>[num(n),M.answer(M.operation('divide',a,n))])));say('Для этой точки b = '+M.answer(M.operation('divide',a,x))+' см. Показан участок 1 ≤ a ≤ 12, формула действует при любом a > 0.');}
  stepList(['Сохраняй произведение сторон.','Размести значения на положительных полуосях.','Проверь точку обратным умножением.']);
 }
 else if(n===17 && task.diameterAngle){
  show(diameterAngleFigure(a,b,state.values[2]===1));say('AC и BC выходят из точки C, AB — диаметр. Положение модели определяется углом радиуса OC, а искомый угол имеет вершину C.');
  if(state.values[2]===1)say('В этой модели угол ACB равен 90°. Запиши, почему нескольких измерений недостаточно для вывода обо всех точках.');
  stepList(['Не совпадай точкой C с концами диаметра.','Измеряй угол между CA и CB.','Повтори опыт с иным радиусом и другим расположением C.']);
 }
 else if(n===17 && task.proportionExpressions){
  const rows=[['Скобка = 25/18','3,6 × 25/18 = 5.'],['84,8 × 0,125 = 10,6; 10,07 : 0,95 = 10,6','10,6 : 10,6 = 1.'],['(4 1/12 − 1/3) : 0,15 = 25; (14 − 0,14) : 0,014 = 990','25 − 990/99 = 15.'],['0,28 × 4500 : 50,4 = 25; 16,2 − 12 2/5 = 3,8','25 × (3,8/190 + 0,1) = 3.']];
  say('Выражение '+['A','B','C','D'][a]+'.');if(b>=1)say(rows[a][0]+'.');if(b===2)say(rows[a][1]);
  stepList(['Сначала вычисли вложенные скобки.','Сохрани точные дроби до последнего действия.','Проверь две пары получившихся чисел.']);
 }
 else if(n===17 && task.pandigitalStudy){
  const candidate=endingCandidate(b),endTest=a===36?4:2,mode=state.values[2],minimum=Math.min(...distinctEndings.filter(z=>z%endTest===0).map(endingCandidate));
  say('При окончании '+String(b).padStart(2,'0')+' наименьшая возможная запись '+candidate+'. Все десять цифр использованы по одному разу.');
  if(mode>=1)say('Сумма цифр всегда 45. Последние две цифры '+(b%endTest===0?'делятся':'не делятся')+' на '+endTest+'.');
  if(mode===2)say('Среди допустимых окончаний наименьшее полное число '+minimum+'. Сначала сравни первые различающиеся цифры.');
  stepList(['Фиксируй последние две цифры.','Остальные поставь в наименьшем допустимом порядке.','Сравни числа с подходящими окончаниями.']);
 }
 else if(n===17 && task.reverseSquare){
  const wrong=a*b,square=a*a,reverse=Number(String(wrong).split('').reverse().join(''));say('Кандидат '+a+', вместо квадрата берём множитель '+b+'.');
  if(state.values[2]===1){show(table(['Полученное число','Цифры наоборот','Точный квадрат'],[[wrong,String(wrong).split('').reverse().join(''),square]]));say(reverse===square?'Цифры в точности совпали в обратном порядке.':'В обратном порядке записи не совпадают с квадратом.');}
  stepList(['Обе записи должны быть двузначными.','Сравни десятки одного числа с единицами другого.','Проверь всех возможных кандидатов.']);
 }
 else if(n===17 && task.classOrderStudy){
  const orders=quartetOrders[a].map(n=>['А','Б','В','Г'][n]),groups=placementTruth(orders,b===1);say('Порядок с первого до четвёртого места: '+orders.join(', ')+'.');
  show(table(['Пара','Два прогноза'],groups.map((g,i)=>['№'+(i+1),g.map(item=>item.label).join(' / ')])));
  if(state.values[2]===1){const counts=groups.map(g=>g.filter(t=>t.yes).length);say('Число верных прогнозов в парах: '+counts.join(', ')+'. '+(counts.every(n=>n===1)?'Порядок удовлетворяет всем условиям.':'Нужен ровно один верный прогноз в каждой паре.'));}
  stepList(['Прочти каждую пару целиком.','Для каждого класса проверь названное место.','Исключи варианты с нулём или двумя верными прогнозами.']);
 }
 else
 if(n===17 && task.boatGap){
  const r=boatStudy(task.boatGap,a,b);show(r.picture);say('Между пристанями '+r.s+' км. Скорости '+r.fast+' и '+r.slow+' км/ч, время '+b+' ч.');
  if(state.values[2]===1)say('Расстояние между катерами '+r.d+' км. Относительная скорость изменения промежутка '+(r.speeds[1]-r.speeds[0])+' км/ч.');
  stepList(['Отметь пристани и положительное направление.','Сначала определи, растёт или уменьшается промежуток.','Проверь свою формулу в начале и после выбранного времени.']);
 }
 else if(n===17 && task.fallCurve){
  const t=a/2;show(fallGraph(t,b>=1));say('Выбран момент времени '+num(t)+' с. Тёмные точки — шесть исходных наблюдений.');
  if(b===2)say('По приближённой модели h = 5t² получается '+num(5*t*t)+' м. Между измеренными секундами это предсказание модели.');
  stepList(['Отметь начальную точку.','Для ненулевого времени проверь h/t².','Проведи плавную кривую и сравни её с точками.']);
 }
 else if(n===17 && task.currencyCipher){
  const [letter,...raw]=task.currencyCipher[a],M=root.PetersonMath,values=raw.map(q=>M.parse(q));
  if(b===2){
   show(table(['Страна','Код кроны'],[['Дания','DKK'],['Исландия','ISK'],['Норвегия','NOK'],['Чехия','CZK'],['Швеция','SEK']]));
   const source=el('a','','Таблица валют центрального банка Швеции');source.target='_blank';source.rel='noopener noreferrer';source.href='https://www.riksbank.se/en-gb/statistics/interest-rates-and-exchange-rates/explanations--interest-rates-and-exchange-rates/currency/';show(source);
   say('Общее русское название «крона» объединяет разные валюты. Их коды различны.');
  }else{
   show(quartetFigure(values,b===1?2:0));say('Строка '+letter+'.');
   if(b===1){const r=compareQuartet(values);say('Произведения '+M.answer(r.outer)+' и '+M.answer(r.inner)+'. '+(r.same?'Буква входит в название.':'Буква не входит в название.'));}
  }
  stepList(['Проверь все двенадцать равенств.','Собери буквы верных строк.','Сверь название с обозначениями валют.']);
 }
 else if(n===17 && task.copyDrawing){
  const isRhombus=task.copyDrawing==='rhombus',k=a===0?(isRhombus?1.5:2/3):isRhombus?1.25:.8;
  show(copyConstruction(task.copyDrawing,b===1?k:1));say('Множитель перехода от показанного исходного чертежа к требуемому: '+root.PetersonMath.answer(root.PetersonMath.parse(isRhombus?(a===0?'3/2':'5/4'):(a===0?'2/3':'4/5')))+'.');
  if(b===1){say(isRhombus?'Новый AC ≈ '+num(6*k)+' см; BD ≈ '+num(Math.round(3.27*k*10)/10)+' см до десятых.':'Получились основания '+num(7.5*k)+' и '+num(4.5*k)+' см, высота '+num(3*k)+' см.');}
  stepList(['Выбери удобные длины для построения.','Примени один и тот же множитель к каждой из них.','Сохрани расположение вершин, пересечения и прямые углы.']);
 }
 else
 if(n===17 && task.proportionClaim){
  const items=claimExample(task.proportionClaim,a);say(items[0]);if(b>=1)say(items[1]);if(b===2)say(items[2]);
  stepList(['Прочти область допустимых чисел.','Проверь выбранную подстановку.','Объясни, когда достаточно примера и когда нужен общий довод.']);
 }
 else if(n===17 && task.twoPercentBases){
  const [small,big]=[[28,35],[30,50],[36,48]][a],old=b===0?big:small,next=b===0?small:big,M=root.PetersonMath;
  show(changeBars(old,next,['Основание','Сравниваемое']));say('Основание сравнения: '+old+'. Разность по модулю '+(big-small)+'.');
  if(state.values[2]===1){const r=M.operation('divide',next,old),delta=M.operation('divide',big-small,old);say('Процентное отношение '+M.answer(M.operation('multiply',100,r))+'%. Величина изменения '+M.answer(M.operation('multiply',100,delta))+'%.');}
  stepList(['Выбери число, принятое за 100%.','Различай новое значение и разность.','Поменяй направление и проверь другое основание.']);
 }
 else if(n===17 && task.percentTransform){
  const M=root.PetersonMath,r=M.parse(task.percentTransform),now=M.operation('multiply',a,r),newPct=M.operation('multiply',100,r),absDiff=M.operation('multiply',100,(r.n>=r.d?M.operation('subtract',r,1):M.operation('subtract',1,r)));
  say('Исходное число '+a+'. Множитель из задачи '+M.answer(r)+'.');
  if(b>=1){show(changeBars(a,now.n/now.d));say('Новое число '+M.answer(now)+'; оно составляет '+M.answer(newPct)+'% исходного.');}
  if(b===2)say((r.n>r.d?'Увеличение':'Уменьшение')+' на '+M.answer(absDiff)+'%.');
  stepList(['Вырази преобразование дробью.','Сравни результат с 100%.','Назови отдельно направление и величину изменения.']);
 }
 else if(n===17 && task.motionPercent==='meeting'){
  const M=root.PetersonMath,[distance,pct]=[[36,40],[54,40],[30,25]][b],ratio=M.operation('divide',pct,100);
  const busSpeed=M.operation('divide',distance,40),carTime=a===0?M.operation('multiply',40,M.operation('subtract',1,ratio)):M.operation('divide',40,M.operation('add',1,ratio));
  const carSpeed=M.operation('divide',distance,carTime),meeting=M.operation('divide',distance,M.operation('add',busSpeed,carSpeed)),mode=state.values[2];
  say('Длина маршрута '+distance+' км. Автобус проходит его за 40 минут. Дано для автомобиля: '+(a===0?'время меньше':'скорость больше')+' на '+pct+'%.');
  if(mode>=1)show(table(['Транспорт','Время всего пути, мин','Скорость, км/мин'],[['Автобус','40',M.answer(busSpeed)],['Автомобиль',M.answer(carTime),M.answer(carSpeed)]]));
  if(mode===2)say('Время до встречи '+M.answer(meeting)+' мин. Скорости складываются, а расстояние одинаково в обоих слагаемых и сокращается.');
  stepList(['Определи, меняют скорость или время.','Вырази обе скорости в одних единицах.','Раздели расстояние на сумму скоростей.']);
 }
 else if(n===17 && task.motionPercent==='motorcycle'){
  const [plan,pct]=[[100,20],[80,20],[60,25]][a],forward=plan*(100+pct)/100,back=plan*(100-pct)/100;
  say('Плановая скорость '+plan+' км/ч. Отклонения вверх и вниз: по '+pct+'%.');
  if(b>=1){show(changeBars(forward,back,['Туда','Обратно']));say('Туда '+num(forward)+' км/ч, обратно '+num(back)+' км/ч.');}
  if(b===2)say('Обратная скорость меньше в '+root.PetersonMath.answer(root.PetersonMath.operation('divide',forward,back))+' раза.');
  stepList(['Возьми один и тот же план за 100%.','Найди обе фактические скорости.','Сравни большую скорость с меньшей.']);
 }
 else if(n===17 && task.motionPercent==='catchup'){
  const M=root.PetersonMath,[pct,hours,separation]=[[250,'1.5','16.5'],[250,'2','20'],[150,'2','18']][a];
  const gain=M.operation('divide',separation,hours),walk=M.operation('divide',gain,M.operation('divide',pct,100)),bike=M.operation('add',walk,gain);
  say('Опережение за '+num(M.parse(hours).n/M.parse(hours).d)+' ч равно '+num(M.parse(separation).n/M.parse(separation).d)+' км. Скорость велосипедиста выше на '+pct+'%.');
  if(b>=1)say('Разность скоростей '+M.answer(gain)+' км/ч.');
  if(b===2){say('Скорость пешехода '+M.answer(walk)+' км/ч, велосипедиста '+M.answer(bike)+' км/ч.');show(changeBars(walk.n/walk.d,bike.n/bike.d,['Пешеход','Велосипедист']));}
  stepList(['Сравни путь участников в одно и то же время.','Отдели избыток скорости от полной скорости.','Проверь расстояние между ними.']);
 }
 else
 if(n===17 && task.similarPentagon){
  const factor=a===0?1.6:1.2;show(pairedPentagons(factor,b===1));say('Основание оригинала 2,5 см, основание копии '+num(2.5*factor)+' см.');
  if(b===1)say('Копия составляет '+num(factor*100)+'% оригинала. Прирост составляет '+num((factor-1)*100)+'%.');
  stepList(['Сопоставь стороны по буквам.','Раздели длину основания копии на исходную длину.','Проверь этим множителем каждую пару.']);
 }
 else if(n===17 && task.alloyParts){
  const goldGiven=task.alloyParts===2,share=goldGiven?(a===0?9:12):(a===0?16:12);
  show(alloyBars(share));say((goldGiven?'Золота ':'Серебра ')+(goldGiven?2:5)*share+' г. Все прямоугольники обозначают равные массы.');
  if(b>=1)say('Одна доля — '+share+' г.');if(b===2)say('Золота '+2*share+' г, серебра '+5*share+' г.');
  stepList(['Найди строку известного металла.','Найди массу одной одинаковой части.','Сосчитай части другого металла.']);
 }
 else if(n===17 && task.circleRatio){
  const forward=task.circleRatio===1,given=forward?(a===0?10:14):(a===0?60:88),M=root.PetersonMath,value=M.operation('multiply',given,forward?'22/7':'7/22');
  show(circleDiameterFigure());say((forward?'Диаметр ':'Длина окружности ')+given+' см. Для расчёта используй приближение 22 : 7.');
  if(b>=1)say('До округления в этой модели получается '+M.answer(value)+' см.');
  if(b===2)say('До десятых: '+(value.n/value.d).toFixed(1).replace('.',',')+' см.');
  stepList(['Определи направление перехода.','Вычисли с точной дробью модели.','Для десятых посмотри на цифру сотых.']);
 }
 else if(n===17 && task.crossedChords){
  const trial=chordExperiment(a,b>=1),[ao,ob,co,od]=trial.lengths;show(trial.picture);
  if(b>=1)say('Длины в сантиметрах: AO = '+ao+', OB = '+ob+', CO = '+co+', OD = '+od+'.');
  if(b===2){say(ao+' × '+ob+' = '+co+' × '+od+' = '+trial.power+' см².');say('Например, AO/CO = OD/OB. Это проверка одного опыта; общее утверждение требует доказательства.');}
  stepList(['Сопоставь два отрезка именно одной хорды.','Сравни произведения, сохраняя единицы.','Повтори опыт и отдели наблюдение от доказательства.']);
 }
 else if(n===17 && task.oddExpressions){
  const first=task.oddExpressions===1,v=a;
  say((first?'x':'y')+' = '+v+'.');
  if(b>=1)show(table(['Выражение','Значение'],first?[['x² + 8',num(v*v+8)],['x + 1',num(v+1)],['2x + 4',num(2*v+4)]]:[['3y + 4,6',num(3*v+4.6)],['5y + 2y',num(7*v)],['y + 0,7y',num(1.7*v)]]));
  if(b===2)say(first?'Один признак: во всех остальных записях переменная имеет степень 1 и выражение имеет вид ax + b.':'Один признак: остальные выражения можно записать как ay + by = (a + b)y. При y = 0 все такие выражения равны нулю.');
  stepList(['Чётко сформулируй выбранный признак.','Проверь каждое оставшееся выражение по формуле.','Отдельный числовой пример помогает проверить догадку, но общего вывода не доказывает.']);
 }
 else
 if((n===17||n===18||n===19||n===37) && task.affineRatios){
  const t=task.affineRatios,M=root.PetersonMath,z=M.parse(affineRatioCandidates(task)[b]),effective=M.operation('subtract',z,a),mode=state.values[2];
  say('Исходное равенство: '+t.printed+'.');
  if(a===1)say('Новый пример: в каждом месте вместо '+t.letter+' поставь ('+t.letter+' − 1).');
  say('Пробуем '+t.letter+' = '+M.answer(z)+'.');
  const cells=t.terms.map(v=>Array.isArray(v)?M.operation('add',M.operation('multiply',v[0],effective),v[1]):M.parse(v));
  if(cells[1].n===0||cells[3].n===0){
   show(quartetFigure(cells,0));if(mode>0)say('Один из знаменателей равен нулю. Этот кандидат не допускается.');
  }else{
   const r=compareQuartet(cells);show(quartetFigure(cells,mode));
   if(mode===1)say('Отношения '+M.answer(r.lhs)+' и '+M.answer(r.rhs)+'.');
   if(mode===2)say('Перекрёстные произведения '+M.answer(r.outer)+' и '+M.answer(r.inner)+'.');
   if(mode>0)say(r.same?'Оба отношения совпали. Это корень.':'При этом значении равенство не выполняется.');
  }
  stepList(['Проверь знаменатели.','Подставь число в каждое выражение целиком.','Сравни результаты и объясни выбор.']);
 }
 else if(n===17 && task.linkedRatios){
  const M=root.PetersonMath,first=task.linkedRatios===1,divisor=first?25:(a===0?'1.5':'2.25'),r=first?(a===0?'32/25':'4/5'):'4/15',ratio=first?'3/8':'1/2',y=M.operation('multiply',r,divisor),x=M.operation('multiply',y,ratio);
  say(first?'x/y = 3/8 и y/25 = '+(a===0?'6,4/5.':'4/5.'):'x : 1 ⅔ = y : 3 ⅓ и y : '+(a===0?'1,5':'2,25')+' = 0,2 : 0,75.');
  if(b>=1)say('Во второй пропорции y = '+M.answer(M.parse(divisor))+' × '+r+' = '+M.answer(y)+'.');
  if(b===2)say('По первой пропорции x = '+ratio+' × '+M.answer(y)+' = '+M.answer(x)+'.');
  stepList(['Выбери равенство с одной неизвестной.','Подставь найденное значение во второе уравнение.','Проверь оба равенства с одной парой чисел.']);
 }
 else if(n===17 && task.reorderSymbols){
  const forms=['abcd','cdab','badc','dcba','acbd','bdac','cadb','dbca'],order=forms[a-1].split('');
  if(b===0){show(quartetFigure(order,2));say('Крайние: '+order[0]+order[3]+'. Средние: '+order[1]+order[2]+'. Произведения равны по условию.');}
  else{
   const values=order.map(k=>k==='a'||k==='c'?'0':k==='b'?'2':'3'),invalid=values[1]==='0'||values[3]==='0';
   show(quartetFigure(values.map(v=>root.PetersonMath.parse(v)),invalid?0:2));say(invalid?'Такое расположение содержит деление на нуль.':'Обе дроби равны нулю, знаменатели ненулевые.');
  }
  stepList(['Поставь буквы в два отношения.','Сравни произведения по диагонали.','Перед делением проверь каждый знаменатель.']);
 }
 else if(n===17 && task.copierRatio){
  const M=root.PetersonMath,back=task.copierRatio===1,given=back?(a===0?'7.5':'9'):(a===0?'8':'12'),origin=back?M.operation('multiply',given,'5/3'):M.parse(given),copy=M.operation('multiply',origin,'3/5');
  say((back?'Длина копии ':'Длина оригинала ')+num(M.parse(given).n/M.parse(given).d)+' см. Полученная копия составляет 3/5 первоначальной длины.');
  if(b===1){show(copiedSegment(origin.n/origin.d));say('Оригинал '+M.answer(origin)+' см, копия '+M.answer(copy)+' см. Множитель нужного направления '+(back?'5/3':'3/5')+'.');}
  stepList(['Обозначь оригинал пятью равными частями.','На копии остаются три такие части.','Определи направление вычисления.']);
 }
 else
 if(n===17 && task.codedRatios){
  const [letter,...raw]=task.codedRatios[a],M=root.PetersonMath,values=raw.map(v=>M.parse(v));
  if(b===2){show(chordDiagram());say('A и B лежат на окружности. Хорда AB проходит в стороне от центра O.');}
  else{
   const q=compareQuartet(values);show(quartetFigure(values,b===1?2:0));say('Строка «'+letter+'».');
   if(b===1)say('Произведения '+M.answer(q.outer)+' и '+M.answer(q.inner)+'. '+(q.same?'Буква входит в слово.':'Эта буква не входит в слово.'));
  }
  stepList(['Проверь каждую строку отдельно.','Оставь только буквы равных отношений.','Проверь определение получившегося слова на чертеже.']);
 }
 else if((n===17||n===18) && task.missingRatio){
  const M=root.PetersonMath,caseData=task.missingRatio,candidate=M.parse(ratioCandidates(task)[b]);
  const cells=caseData.sets[a].map(v=>v===null?candidate:M.parse(v)),mode=state.values[2],denominatorZero=cells[1].n===0||cells[3].n===0;
  say('На месте '+caseData.letter+' проверь '+M.answer(candidate)+'.');
  if(denominatorZero){show(quartetFigure(cells,0));if(mode>0)say('Один из делителей равен нулю. При таком значении отношение не определено.');}
  else{show(quartetFigure(cells,mode));const r=compareQuartet(cells);
   if(mode===1)say('Отношения '+M.answer(r.lhs)+' и '+M.answer(r.rhs)+'.');
   if(mode===2)say('Перекрёстные произведения '+M.answer(r.outer)+' и '+M.answer(r.inner)+'.');
   if(mode>0)say(r.same?'Подстановка подходит.':'Значения различаются. Испытай другое число.');
  }
  stepList(['Запомни место неизвестного члена.','Вычисли произведение полностью известных членов по диагонали.','Проверь обе дроби на выбранном числе.']);
 }
 else
 if(n===17 && (task.proportionReading||task.ratioCollection||task.fourPlaces)){
  const M=root.PetersonMath,collection=task.ratioCollection,places=task.fourPlaces;
  let values,mode;
  if(collection){
   values=[...collection[a],...collection[b]].map(v=>M.parse(v));mode=state.values[2];say('Выбраны записи №'+(a+1)+' и №'+(b+1)+'.');
  }else if(places){
   const raw=places.map(v=>M.parse(v));if(b===1)raw[3]=M.operation('add',raw[3],1);
   const order=quartetOrders[a];values=order.map(i=>raw[i]);mode=state.values[2];
   say('Исходные места от 1 до 4: '+raw.map(v=>M.answer(v)).join(', ')+'. Сверху и снизу первой дроби стоят позиции '+(order[0]+1)+' и '+(order[1]+1)+'.');
  }else {values=readQuartet(task.proportionReading,a===1);mode=b;}
  const comparison=compareQuartet(values);show(quartetFigure(values,mode));
  if(mode===1)formula('Частные: '+M.answer(comparison.lhs)+' и '+M.answer(comparison.rhs)+'.');
  if(mode===2){
   say('Крайние: '+M.answer(values[0])+' и '+M.answer(values[3])+'. Средние: '+M.answer(values[1])+' и '+M.answer(values[2])+'.');
   formula('Произведения: '+M.answer(comparison.outer)+' и '+M.answer(comparison.inner)+'.');
  }
  if(mode>0)say(collection&&a===b?'Это одна запись, взятая дважды. Выбери два разных номера.':comparison.same?'Равенство верно. Это пропорция.':'Результаты различны. Пропорция не получилась.');
  stepList(['Прочти оба отношения сверху вниз.','Проверь ненулевые знаменатели.','Сравни результаты двумя способами и объясни выбор.']);
 }
 else if(n===17 && task.symbolProportion){
  const symbols=task.symbolProportion,values=a===0?symbols:['4','6','10','15'];
  show(quartetFigure(values,b===1?2:0));
  if(b===1)say(values[0]+' × '+values[3]+' = '+values[1]+' × '+values[2]+(a===1?' = 60.':'.'));
  stepList(['Определи расположение четырёх членов.','Прочти названия крайних и средних.','Умножь обе дроби на произведение знаменателей.']);
 }
 else if(n===17 && task.ratioTarget){
  const [num,den]=state.values[2]===0?task.ratioTarget:[task.ratioTarget[1],task.ratioTarget[0]];
  formula(frac(a*num,a*den),' = ',frac(b*num,b*den));
  say('Левую дробь получаем умножением на '+a+', правую — на '+b+'. Обе равны '+root.PetersonMath.answer(root.PetersonMath.operation('divide',num,den))+'.');
  stepList(['Выбери значение отношения.','Умножай числитель и знаменатель на один и тот же множитель.','Выбери свою пару множителей, запиши пропорцию и объясни.']);
 }
 else
 if(n===16 && task.scaleExamples){
  const [condition,explanation]=task.scaleExamples.cases[a];say(condition);
  if(b===1)say(explanation);
  stepList(['Назови правило, с которым работаешь.','Запиши прогноз и проверь вычисление.','Измени данные и повтори рассуждение.']);
 }
 else if(n===16 && task.crossScale){
  const study=task.crossScale,M=root.PetersonMath;
  const known=study.position===0||study.position===3?1:0;
  const vals=study.terms.map((v,i)=>i===study.position?M.parse(study.coefficient):M.parse(v));
  if(a===1)vals[known]=M.operation('multiply',vals[known],2);
  const symbols=study.terms.slice();if(a===1)symbols[known]=M.answer(vals[known]);
  formula(frac(symbols[0],symbols[1]),' = ',frac(symbols[2],symbols[3]));
  const x=M.operation('multiply',study.solution,['1/2',1,2][b]);say('Подставь x = '+M.answer(x)+'.');
  vals[study.position]=M.operation('multiply',vals[study.position],x);
  if(state.values[2]===1){
   const left=M.operation('multiply',vals[0],vals[3]),right=M.operation('multiply',vals[1],vals[2]);
   show(table(['Произведение','Значение'],[[M.answer(vals[0])+' × '+M.answer(vals[3]),M.answer(left)],[M.answer(vals[1])+' × '+M.answer(vals[2]),M.answer(right)]]));
   say(M.equal(left,right)?'Произведения равны: выбранное x подходит.':'Произведения различны: это x не является корнем.');
  }
  stepList(['Обозначь числители и знаменатели двух дробей.','Перед проверкой исключи нулевой знаменатель.','При умножении бери противоположные позиции.']);
 }
 else if(n===16 && task.ownMapStudy){
  const kmPerCm=[10,20,30][a],distance=b===0?60:90,drawn=distance/kmPerCm;
  show(mapStrip(drawn,kmPerCm));say('Отрезок между двумя центрами занимает '+num(drawn)+' см на шкале карты.');
  if(state.values[2]===1)formula(num(drawn)+' × '+kmPerCm+' = '+distance+' км');
  stepList(['Соотнеси отрезок со шкалой карты.','Умножь длину на число километров в одном сантиметре.','Смени карту и сравни результат для тех же городов.']);
 }
 else if(n===16 && task.ownRoomStudy){
  const [w,h]=a===0?[5,4]:[6,3],den=[50,100,200][b];
  show(roomFurniture(w,h,den));say('Реальная комната '+w+' × '+h+' м. Стол 1,2 × 0,6 м. Дверь 0,9 м, окно 1,5 м.');
  if(state.values[2]===1)say('На листе комната '+num(w*100/den)+' × '+num(h*100/den)+' см, стол '+num(120/den)+' × '+num(60/den)+' см, проём двери '+num(90/den)+' см.');
  stepList(['Выбери угол отсчёта для дверей и окна.','Переведи стены и мебель в один масштаб.','Размести мебель и подпиши свой план.']);
 }
 else if(n===16 && task.ladderStudy){
  const ladders=a===0?[[1.5,1.2],[2.4,2]]:[[1.8,1.5],[2.1,1.4]];
  show(ladderSlope(ladders));
  for(const [i,[h,run]]of ladders.entries())say('Лестница '+(i+1)+': высота '+num(h)+' м, отступ '+num(run)+' м.');
  if(b===1){const rates=ladders.map(([h,run])=>h/run);say('Крутизна '+num(rates[0]*100)+'% и '+num(rates[1]*100)+'%. Круче '+(rates[0]>rates[1]?'первая':'вторая')+' лестница.');}
  stepList(['У обеих лестниц выдели вертикаль и горизонталь.','Приведи оба размера к одним единицам.','Сравни отношения, сохраняя точность.']);
 }
 else if(n===16 && task.squareGridStudy){
  const size=task.squareGridStudy,group=gridSelection(size,a,b,state.values[2]);
  show(group.figure);say('Выбраны '+group.values.join(', ')+'.');
  if(state.values[3]===1)say(group.values.join(' + ')+' = '+group.values.reduce((sum,x)=>sum+x,0)+'.');
  stepList(['Оставь квадрат на месте и выбери другую группу.','Передвинь квадрат и повтори сравнение.','Обозначь первое число буквой и объясни равенство.']);
 }
 else
 if(n===16 && task.gardenPlan){
  show(gardenScale(a,b));const centered=a===0,gate=b===0;
  say(centered?'До дома слева и справа по 3 см, сверху и снизу по 2 см.':'Дом смещён. Отметь равные расстояния до каждой пары противоположных сторон.');
  say(gate?'Центр ворот находится в 4 см от каждого конца длинной стороны.':'Середина ворот смещена относительно середины длинной стороны.');
  stepList(['Переведи метры в сантиметры плана.','Установи дом по центру обоих направлений.','От центра длинной стороны отложи по 0,4 см.']);
 }
 else if(n===16 && task.classroomPlan){
  const measure={length:a/10,width:b/10};
  show(table(['Что измеряем','В кабинете','На плане 1 : 100'],[['Длина',num(measure.length)+' м',num(measure.length)+' см'],['Ширина',num(measure.width)+' м',num(measure.width)+' см']]));
  say('В модели длины выбраны с точностью до дециметра. Точные собственные измерения запиши в тетради.');stepList(['Выбери начало измерений.','Отдельно измерь стены и положение дверного проёма.','Проверь масштаб одной стены обратным переводом.']);
 }
 else if(n===16 && task.scaleTransfer){
  const isRoom=task.scaleTransfer==='room';
  const [width,length,plan]=a===0?[4.2,6,4]:[3.5,7,6];const mapLength=a===0?12:21;
  if(isRoom){formula('Комната '+num(length)+' × '+num(width)+' м. Длинная сторона на плане '+num(plan)+' см.');
   if(b===1)formula('Ширина на плане '+num(plan)+' × '+num(width)+' / '+num(length)+' = '+num(plan*width/length)+' см.');}
  else{formula('Карта 1 : 100 000; на ней '+num(mapLength)+' см.');
   if(b===1)formula('В действительности '+num(mapLength)+' км. На карте 1 : 300 000 это '+num(mapLength/3)+' см.');}
  stepList(['Запиши соответствующие длины в две строки.','Сохрани одно и то же отношение.','Измени числа и повтори расчёт.']);
 }
 else if(n===16 && Object.hasOwn(sequenceChecks,task.patternStudy)){
  const example=sequenceChecks[task.patternStudy].examples[a];say(example[0]);if(b===1)say(example[1]);
  stepList(['Опиши правило для соседних или чередующихся позиций.','Найди первое место, где написано другое значение.','Полностью исправленная последовательность может иметь другой дальнейший хвост.']);
 }
 else if(n===16 && task.gearRatio){
  const target=task.gearRatio,ratio=state.values[2]===0?target:[target[1],target[0]];
  show(gearPairFigure(a,b));formula('Нужно '+ratio[0]+' : '+ratio[1]+'. Выбрано '+a+' : '+b+'.');
  const left=a*ratio[1],right=b*ratio[0];formula('Перекрёстные произведения: '+left+' и '+right+'.');
  say(left===right?'Шестерёнки выполняют условие. Запиши свой пример.':'Отношение пока другое. Измени одно из колёс.');
  stepList(['Первое число относится к первому колесу.','Измени оба размера в одинаковое число раз.','Переверни целевое отношение и найди другую пару.']);
 }
 else if(n===16 && task.commissionStudy){
  const details=a===0?[[4000,240],[18000,900]]:[[6000,360],[4000,200]];
  show(table(['Магазин','Цена, ₽','Сбор, ₽'],details.map(([price,fee],i)=>[String(i+1),num(price),num(fee)])));
  if(b===1)for(const [i,[price,fee]]of details.entries())formula('Магазин '+(i+1)+': '+num(100*fee/price)+' %.');
  if(b===2)say('Больше в рублях: '+(details[0][1]>details[1][1]?'первый':'второй')+' магазин.');
  stepList(['Сначала назови величину сравнения.','Ставку считают на каждые 100 рублей цены.','Фактический платёж получается из цены и ставки.']);
 }
 else if(n===16 && task.roadSlope){
  const down=task.roadSlope==='а',horizontal=down?(a===0?400:250):(a===0?1200:800);
  const rate=down?(a===0?20:12):(a===0?2.5:3.75),h=horizontal*rate/100;
  show(roadTriangle(horizontal,h,!down||b===1));
  if(down)say('Крутизна '+num(rate)+' %.');else say('Перепад высоты '+num(h)+' м.');
  if(b===1){if(down)formula('h = '+num(horizontal)+' × '+num(rate)+' / 100 = '+num(h)+' м');else formula('100 × '+num(h)+' / '+num(horizontal)+' = '+num(rate)+' %');}
  stepList(['Горизонтальная проекция — знаменатель отношения.','Работай с одинаковыми единицами.','Отношение длин переведи в проценты или обратно.']);
 }
 else
 if(n===16 && Number.isInteger(task.cityMap)){
  const city=mapCities[a],distance=fromMoscow(city).distance;
  show(cityScaleFigure(a));say('Из Москвы по прямой до города '+city[0]+'. Сравни выделенный отрезок с отметкой 500 км.');
  if(b>=1)formula('Показание линейки: '+num(Math.round(distance/500*100)/100)+' × 500 км');
  if(b===2)say('Расчёт по координатам: около '+num(Math.round(distance))+' км. С точностью до сотен: '+num(Math.round(distance/100)*100)+' км.');
  stepList(['Приложи одну полоску к отрезку, вторую к масштабной линейке.','Оцени отношение длин.','Умножь оценку на 500 км. На новой паре городов спрячь ответ.']);
 }
 else if(n===16 && task.parcelScale){
  const [width,height,cutWidth,cutHeight]=a===0?[5,2.4,2,1]:[6,3,1.5,1];
  show(parcelPicture(a===1,b));say('1 см плана равен 40 м на участке.');
  if(b===1)formula('Площадь = ('+num(width)+' × '+num(height)+' − '+num(cutWidth)+' × '+num(cutHeight)+') × 40² = '+num((width*height-cutWidth*cutHeight)*1600)+' м²');
  if(b===2)formula('Периметр = 2 × ('+num(width)+' + '+num(height)+') × 40 = '+num(2*(width+height)*40)+' м');
  stepList(['Отметь внешний прямоугольник и вырез.','Для площади вычти вырез.','Для периметра проследи все стороны оставшегося контура.']);
 }
 else if(n===16 && task.flatScale){
  const room=flats[a],[x1,y1,x2,y2]=room.box,mult=b===0?2:3,w=(x2-x1)*mult,h=(y2-y1)*mult;
  show(apartmentPicture(a));say(room.name+'. На этом плане 1 см соответствует '+mult+' м.');
  formula('На плане '+num(x2-x1)+' × '+num(y2-y1)+' см.');
  if(state.values[2]===1){formula('Размеры '+num(w)+' × '+num(h)+' м');say('Площадь выбранного помещения '+roomArea(w,h)+' м². Все помещения вместе: '+roomArea(5.75*mult,4.05*mult)+' м².');}
  stepList(['Каждая длина на плане — разность отметок нужных стен.','Умножь обе длины на масштабный множитель.','Сложи площади помещений и сравни с площадью внешнего прямоугольника.']);
 }
 else
 if(n===16 && Object.hasOwn(scaleReadings,task.scaleReading)){
  const spec=scaleReadings[task.scaleReading],[drawingPart,realPart]=spec.scales[a],drawing=spec.drawing[a];
  const realCm=drawing*realPart/drawingPart,units={см:1,м:100,км:100000},real=realCm/units[spec.units];
  say(spec.titles[a]+'.');
  show(scaleRuler(drawing,real,spec.units,b===1||spec.findScale));
  if(!spec.findScale)formula('Масштаб '+num(drawingPart)+' : '+num(realPart));
  if(b===1){
   show(table(['Изображение','Настоящая длина'],[[num(drawing)+' см',num(realCm)+' см']]));
   if(spec.findScale){formula(num(drawing)+' : '+num(realCm)+' = 1 : '+num(realPart));}
   else{formula(num(drawing)+' × '+num(realPart)+' / '+num(drawingPart)+' = '+num(realCm)+' см');say('В запрошенных единицах: '+num(real)+' '+spec.units+'.');}
  }
  stepList(['Прочитай порядок: изображение к действительности.','Сравни соответствующие отметки двух шкал. Измерять экран линейкой не требуется.','Чтобы записать масштаб, приведи обе длины к одной единице.']);
 }
 else
 if(n===33 && task.midpointStudy){
  const center=task.midpointStudy.center+(a===1?2:0),radius=task.midpointStudy.radius+(a===1?1:0);
  formula('Расстояние от '+num(center)+': '+num(radius));
  show(midpointPicture(center,radius,b===1));
  if(b===1)say('Середина между '+num(center-radius)+' и '+num(center+radius)+' равна '+num(center)+'.');
  stepList(['От центра отложи расстояние влево.','Повтори это расстояние вправо.','Найди полусумму координат двух корней.']);
 }
 else if(n===33 && task.lineRelation){
  const pair=planePairs[b],para=parallelPairs.includes(pair),right=rightAnglePairs.includes(pair);
  show(fiveLinePicture(pair,a===1));say('Сравни направления прямых '+pair[0]+' и '+pair[1]+'.');
  if(state.values[2]===1)say(para?'Прямые параллельны, общих точек нет.':right?'Прямые пересекаются под прямым углом.':'Прямые пересекаются под углом, отличным от прямого.');
  stepList(['Проследи прямые и за пределами выделенного отрезка.','Сравни направления. Для проверки прямого угла используй угольник.']);
 }
 else if(n===33 && task.letterStudy){
  const row=task.letterStudy[a],m=root.PetersonMath,op=(id,left,right)=>m.operation(id,left,right);
  const value=b===0?m.parse(row.value):op('add',row.value,2);
  formula(row.formula);say(row.variable+' = '+m.decimal(value).replace('-', '−')+'. Сначала раскрой скобки.');
  if(state.values[2]===1){const answer=op('add',op('multiply',row.coefficient,value),row.constant);formula(row.letter+' = '+m.decimal(answer).replace('-','−'));}
  if(state.values[2]===2){if(task.source.exercise===19){show(parallelogramPicture());say('У параллелограмма обе пары противоположных сторон параллельны.');}else say('Корень уравнения обращает его в верное равенство. Например, при x = 4 запись 3x − 5 = 7 верна.');}
  stepList(['Отметь знак перед каждой скобкой.','Сгруппируй буквенные и свободные слагаемые.','Измени исходное число и проверь обе записи.']);
 }
 else if(n===33 && task.verifyEquation){
  const spec=task.verifyEquation,m=root.PetersonMath,op=(id,l,r)=>m.operation(id,l,r);
  const candidate=[0,spec.root,spec.root+2][b],left=op('subtract',spec.constant,candidate),right=op('subtract',spec.right,a===1?2:0);
  formula('Левая часть при '+num(candidate)+' = '+m.decimal(left));formula('Правая часть = '+m.decimal(right));
  say(m.answer(left)===m.answer(right)?'Обе стороны равны. Это число — корень выбранного уравнения.':'Стороны различаются. Это число не подходит.');
  stepList(['Подставь выбранное число в исходную запись.','Раскрой скобки, сохраняя знаки.','Сравни две стороны.']);
 }
 else if(n===33 && task.circusStudy){
  const target=a===0?28:34,total=8+b+(b+6)+(b-1);
  show(table(['Группа','Артистов'],[['Жонглёры',8],['Клоуны',b],['Акробаты',b+6],['Дрессировщики',b-1]]));
  formula('Всего '+total+'; по условию '+target+'.');say(total===target?'Числа выполняют все условия.':'Подбери число клоунов, чтобы совпала сумма.');
  stepList(['Вырази все четыре численности через одну.','Прибавление одного клоуна изменяет три группы.']);
 }
 else if(n===33 && task.neighborStudy){
  show(midpointPicture(a,1,b===1));if(b===1){formula('('+num(a-1)+' + '+num(a+1)+') / 2 = '+num(a));say('Теперь замени выбранное число буквой n и докажи общее равенство.');}
  stepList(['Назови предыдущую точку.','Назови следующую.','Сумма двух координат равна удвоенной центральной.']);
 }
 else if(n===33 && task.steamerStudy){
  const speed=[28,29.7,35.5,24][a],down=b===0?5:3,up=b===0?3:5;
  say('Течение 2 км/ч; вниз '+down+' ч, вверх '+up+' ч.');formula('Собственная скорость '+num(speed)+' км/ч.');
  if(state.values[2]===1){
   const leg=(hours,v)=>hours+' ч × '+num(v)+' км/ч = '+num(hours*v)+' км';
   const paths=table(['Куда','Как найти путь'],[['Вниз',leg(down,speed+2)],['Вверх',leg(up,speed-2)]]);
   paths.classList.add('pcm-route-table');show(paths);
   say('Общий путь '+num(down*(speed+2)+up*(speed-2))+' км за 8 ч. Средняя скорость '+num((down*(speed+2)+up*(speed-2))/8)+' км/ч.');
  }
  stepList(['Для каждого направления учти течение.','У каждого участка своё время.','Раздели общий путь на общую продолжительность.']);
 }
 else if(n===33 && task.moneyStudy){
  const total=a===0?25:30,ratio=a===0?49:5,unit=total/(1+ratio);
  formula('1 доля + '+ratio+' долей = '+total+' ₽');
  if(b===1){show(table(['Сумма','Долей','Рублей'],[['Меньшая',1,num(unit)],['Большая',ratio,num(unit*ratio)]]));say('Проверь сумму и отношение отдельно.');}
  stepList(['Обозначь меньшую сумму одной долей.','Раздели общую сумму на число всех долей.','Найди большую сумму и проверь отношение.']);
 }
 else if(n===33 && task.teaStudy){
  const target=6+a,[cheap,dear]=[[1,1],[2,1],[1,2]][b],cost=5*cheap+8*dear,weight=cheap+dear;
  show(table(['Чай','Фунтов','Стоимость'],[['Дешёвый',cheap,5*cheap],['Дорогой',dear,8*dear]]));
  formula(num(cost)+' / '+weight+' = '+num(cost/weight)+' гривен за фунт');
  say(cost/weight===target?'Смесь имеет заданную цену. Доли по массе: '+cheap+'/'+weight+' и '+dear+'/'+weight+'.':'Цена отличается от '+target+'. Измени соотношение сортов.');
  stepList(['Посчитай стоимость обоих компонентов.','Сложи их массы.','Раздели общую стоимость на общую массу.']);
 }
 else
 if(n===15 && Object.hasOwn(comparisonStories,task.comparisonStory)){
  const spec=comparisonStories[task.comparisonStory],comparison=storyComparison(task.comparisonStory,spec.values[b],a===1);
  say(spec.cases[a]);show(table(task.comparisonStory==='ages'?['Возраст','По шагам','По множителю']:['Что сравниваем','Сначала','После'],comparison.rows));
  say(comparison.test);const equal=Math.abs(comparison.left-comparison.right)<1e-8;
  formula(num(comparison.left)+(equal?' = ':' ≠ ')+num(comparison.right));
  say(equal?'Предположение согласуется с условием. Обоснуй его уравнением.':'Условие ещё не выполнено. Подумай, как изменить начальное число.');
  stepList(['Назови неизвестную величину.','Вырази через неё сравниваемые величины.','Составь равенство и проверь решение.']);
 }
 else if(n===15 && task.rateStudy){
  const spec=task.rateStudy,math=root.PetersonMath,first=a===0?spec.first:spec.fresh[0],base=a===0?spec.base:spec.fresh[1];
  show(changeBars(String(first).replace(',','.'),String(base).replace(',','.'),['Первая','Основание']));
  say('Здесь вторая величина — 100 %. Общая единица: '+spec.unit+'.');
  if(b===1){const ratio=math.operation('divide',first,base),percent=math.operation('multiply',ratio,100);formula('Первая / вторая = ',exactRatio(ratio.n,ratio.d));formula('Процентов: ',exactRatio(percent.n,percent.d),' %.');}
  else say('Сравни длины и вычисли процентное отношение. Затем открой проверку.');
  stepList(['Приведи величины к одним единицам.','Первую раздели на вторую.','Умножь частное на 100.']);
 }
 else if(n===15 && task.mixStudy){
  const masses=a===0?[180,360,460]:[100,200,300],amounts=masses.map((v,i)=>v*[10,15,30][i]/100);
  const total=masses.reduce((v,n)=>v+n),salt=amounts.reduce((v,n)=>v+n);
  show(table(['Сосуд','Концентрация',b===0?'Раствор, г':'Соль, г'],masses.map((v,i)=>[String(i+1),[10,15,30][i]+' %',String(b===0?v:amounts[i])])));
  if(b===2)formula('Соль / раствор = '+salt+' / '+total+';   ',exactRatio(100*salt,total),' %.');
  else say(b===0?'Общая масса раствора: '+total+' г.':'Общая масса соли: '+salt+' г.');
  stepList(['Доля соли относится к массе своего сосуда.','Сложи массы соли отдельно от масс растворов.','Для процентов используй общую массу смеси как основание.']);
 }
 else if(n===15 && task.similarTangents){
  const base=4+a,slope=b===0?1/2:2/3;show(tangentNest(a,b));
  say('Прилежащий катет: '+base+' мерок. Противолежащий: '+num(base*slope)+' мерок'+(b===1&&base%3!==0?' (приблизительно).':'.'));
  formula('Точное отношение = ',exactRatio(b===0?1:2,b===0?2:3));
  stepList(['Выбери другой треугольник на том же луче.','Отметь общий угол и прямые углы.','Измени сам луч. Изменился угол, поэтому изменилось и отношение.']);
 }
 else if(n===15 && task.differenceStudy){
  const first=a===0?9:12,second=a===0?36:30,base=b===0?second:first,delta=second-first;
  show(changeBars(String(delta),String(base),['Разность','Основание']));say('A = '+first+', B = '+second+'. Разность '+delta+', за 100 % взято '+(b===0?'B.':'A.'));
  formula('Разность / основание = ',exactRatio(delta,base),';   ',exactRatio(100*delta,base),' %.');
  stepList(['Отдели саму величину A от разности B − A.','Для уменьшения относительно B выбери B.','Для увеличения относительно A выбери A.']);
 }
 else if(n===33 && task.oralStudy) {
  const spec=task.oralStudy,expression=(b===0?spec.expressions:spec.freshExpressions)[a],answer=(b===0?spec.answers:spec.freshAnswers)[a];
  formula(expression+' = '+(state.values[2]===1?answer:'?'));
  say('Предскажи знак результата, затем реши пример устно.');
  if(state.values[2]===1){const parsed=root.PetersonMath.parse(answer);say(parsed.n===0?'Ответ равен нулю.':parsed.n<0?'Ответ отрицательный.':'Ответ положительный.');}
  stepList(['Определи порядок операций.','Проверь, какие минусы принадлежат числам, а какие обозначают вычитание.','Выбери новый пример и снова скрой ответ.']);
 }
 else if(n===33 && task.chainStudy) {
  const math=root.PetersonMath,chain=task.chainStudy[a],ops={'+':'add','−':'subtract','×':'multiply',':':'divide'};
  const written=v=>math.decimal(v).replace('-','−');
  let current=chain.start;const rows=[['Начало',written(current)]];
  for(let i=0;i<b;i++){const [sign,operand]=chain.steps[i];const next=math.answer(math.operation(ops[sign],current,operand));rows.push([written(current)+' '+sign+' '+written(operand),written(next)]);current=next;}
  show(table(['Действие','Результат'],rows));
  if(b<4)say('Следующее действие: '+chain.steps[b][0]+' '+written(chain.steps[b][1])+'. Сначала выполни его сам.');
  else say('Запиши число '+written(current)+' рядом с буквой '+chain.letter+'.');
  if(state.values[2]===1){show(rhombusPicture());say('Ромб: все четыре стороны равны. Проверь свой чертёж.');}
  stepList(['Запиши промежуточное значение.','В следующей строке используй именно этот результат.','После всех шести дорожек расположи итоги по возрастанию.']);
 }
 else if(n===33 && Object.hasOwn(travelCases,task.travelStudy)) {
  const sample=travelCases[task.travelStudy][a];
  say(sample.input);
  if(b===1){show(table(['Участок или величина','Расчёт'],sample.rows));say(sample.summary);}
  else say('Составь таблицу или схему на бумаге. Затем включи проверку расчёта.');
  stepList(['Назови единицу каждой величины.','Отметь, к какому промежутку или направлению она относится.','Измени числа и испытай прежнюю формулу.']);
 }
 else if(n===33 && Object.hasOwn(nestedRules,task.nestStudy)) {
  const rule=nestedRules[task.nestStudy],stages=rule.stages(a);
  show(table(['Что вычисляем','Значение'],stages));
  formula(rule.variable+' = '+a+'.   '+rule.simplified+' = '+rule.value(a));
  say('Для подстановки получились одинаковые результаты. Чтобы обосновать равенство для любого числа, раскрой группы по порядку.');
  stepList(['Определи внутреннюю группу.','Найди знак непосредственно перед ней.','Собери отдельно коэффициенты и свободные члены.']);
 }
 else if(n===33 && ['remainder-five','remainder-twelve'].includes(task.nestStudy)) {
  const five=task.nestStudy==='remainder-five',divisor=five?5:12;
  const terms=five?[2*(a-1),3*(a+1)]:[3*a,3*a+3,3*a+6,3*a+9];
  const total=terms.reduce((sum,v)=>sum+v,0),quotient=Math.floor(total/divisor),rem=total%divisor;
  show(remainderGroups(total,divisor));
  formula(terms.join(' + ')+' = '+total);
  formula(total+' = '+divisor+' × '+quotient+' + '+rem);
  say('Полных рядов: '+quotient+'. В последнем ряду '+rem+' из '+divisor+' мест заняты.');
  stepList(['Сосчитай только полные ряды.','Измени исходное число. Что происходит с неполным рядом?','Докажи постоянство остатка формулой из записи к задаче.']);
 }
 else if(n===33 && ['place-one','place-two'].includes(task.nestStudy)) {
  const position=state.values[2],expressions=['m − n − m + n','m − (n − m) + n','m − (n − m + n)'];
  const values=[a-b-a+b,a-(b-a)+b,a-(b-a+b)],goal=task.nestStudy==='place-one'?2*a:2*a-2*b;
  show(table(['Запись','При этих m и n'],[[expressions[position],values[position]],[task.nestStudy==='place-one'?'2m':'2m − 2n',goal]]));
  formula('m = '+a+', n = '+b+'.   '+values[position]+(values[position]===goal?' = ':' ≠ ')+goal);
  say('Совпадения на одном наборе недостаточно. Для всех m и n сравни коэффициенты после раскрытия скобок.');
  stepList(['Определи, входит ли последнее n в вычитаемую группу.','Перепиши знаки каждого слагаемого.','Объедини два члена с m и два члена с n.']);
 }
 else if (n===15 && task.pythagorasStudy) {
  const [legA,legB,hyp]=pythagorasCases[a];
  show(dissectionFigure(legA,legB,b===1));
  const remaining=legA*legA+legB*legB,covered=2*legA*legB,outer=(legA+legB)**2;
  formula('Внешняя площадь: ('+legA+' + '+legB+')² = '+outer);
  formula('Четыре треугольника: 4 × ('+legA+' × '+legB+' / 2) = '+covered);
  formula(b===0?'Белая площадь: '+legA+'² + '+legB+'² = '+remaining:'Белая площадь: '+hyp+'² = '+remaining);
  stepList(['Сравни площади до и после перекладки.','Найди четыре гипотенузы во второй раскладке.','Объясни, почему между соседними гипотенузами прямой угол.']);
 }
 else if (n===15 && task.balanceStudy) {
  const spec=task.balanceStudy,math=root.PetersonMath;
  const input=['0','1',spec.root,math.answer(math.operation('add',spec.root,'1'))][a];
  const [m,p,k,q]=spec.coefficients;
  const evaluate=(factor,constant)=>math.answer(math.operation('add',math.operation('multiply',factor,input),constant));
  const left=evaluate(m,p),right=evaluate(k,q),equal=math.equal(left,right);
  show(table(['Подстановка','Значение'],[['Слева',left],['Справа',right]]));
  formula(spec.variable+' = '+input+';   '+left+(equal?' = ':' ≠ ')+right);
  say(equal?'Обе части равны. Эта подстановка подтверждает корень.':'Значения различаются. Это число не является корнем.');
  stepList(['Сначала приведи подобные слагаемые с каждой стороны.','При подстановке используй одно число в обеих частях.','Сравни значения точно, без округления.']);
 }
 else if (n===15 && task.changeStudy) {
  const study=task.changeStudy,before=a===0?study.base:study.alternate,after=a===0?study.result:study.nextResult;
  show(changeBars(before,after));
  say('Как изменяется исходная величина: '+study.statement+'.');
  formula(before+' '+study.sign+' '+study.operand+' = '+after);
  const isDifference=study.sign==='+'||study.sign==='−';
  say(isDifference?'Здесь сохраняется разность между новым и исходным числом.':'Здесь сохраняется отношение нового числа к исходному.');
  stepList(['Сначала сравни, какая полоса длиннее.','Проверь равенство обратным действием.','Смени исходное число. Какое свойство не изменилось?']);
 }
 else if (n===15 && task.partComparison) {
  const [example,firstIndex,baseIndex]=state.values;
  const spec=task.partComparison;
  const [left,right]=spec.sets[example],sizes=[left,right,left+right];
  const first=sizes[firstIndex],base=sizes[baseIndex];
  show(compareBars(left,right,first,base));
  say(spec.labels[0]+': '+left+'. '+spec.labels[1]+': '+right+'. '+spec.labels[2]+': '+(left+right)+'.');
  formula(spec.labels[firstIndex]+' / '+spec.labels[baseIndex]+' = ',exactRatio(first,base));
  formula('В процентах: ',exactRatio(100*first,base),' %');
  if(firstIndex===baseIndex) say('Сравнивается одна группа с собой. Измени первое или второе поле, чтобы ответить на другой вопрос.');
  else if(first===base) say('Группы имеют равную численность. Одна составляет 100 % другой.');
  else if(first>base) say('Числитель больше выбранного основания, поэтому получилось больше 100 %.');
  else say('Сравни полосы: первая величина составляет только часть выбранного основания.');
  stepList(['Сначала назови, о какой группе задаётся вопрос.','Выбери основание: с чем сравнивается первая группа?','Поменяй группы местами или выбери другой пример. Предскажи, окажется ли новое отношение больше единицы.']);
 }
 else if (n===33 && Object.hasOwn(groupRules,task.groupRule)) {
  const rule=task.groupRule;
  show(drawGroupRule(rule,a,b));
  if (rule==='distribute') {
   formula('3 × ('+a+' + '+b+') = '+3*(a+b));
   formula('3 × '+a+' + 3 × '+b+' = '+(3*a)+' + '+(3*b));
   stepList(['Сосчитай все клетки по числу рядов и столбцов.','Сосчитай клетки в каждой цветной полосе отдельно.','Измени ширину одной полосы. Объясни, почему оба способа по-прежнему дают одно число.']);
  } else {
   const op=rule==='add'?' + ':' − ',sign=rule==='add'?1:-1,end=10+sign*(a+b);
   formula('10'+op+'('+a+' + '+b+') = '+end);
   formula('(10'+op+a+')'+op+b+' = '+end);
   stepList(['На верхней дорожке пройди весь путь за один шаг.','На нижней дорожке сначала пройди b, потом c.','Сравни конечные точки и попробуй другие длины шагов.']);
  }
 }
 else if (n===15 && task.trigStudy) {
  const alpha=a===0?'A':'B', opposite=a===0?'BC':'AC', adjacent=a===0?'AC':'BC';
  const measurable=task.trigStudy!=='named', sample=measurable?b:0;
  const chosen=['','AC','BC','AB'][state.values[measurable?2:1]];
  const correct=chosen===opposite;
  const [vertical,horizontal,hypotenuse]=triangleMeasurements[sample];
  const across=a===0?vertical:horizontal, along=a===0?horizontal:vertical;
  show(trigFigure(measurable,a,sample,correct));
  if (measurable) say('В делениях шкалы BC = '+vertical+', AC = '+horizontal+', AB = '+hypotenuse+'.');
  if (!chosen) say('Какой отрезок будет в числителе синуса угла '+alpha+'? Сначала выбери его по чертежу.');
  else if (chosen==='AB') say('AB лежит напротив прямого угла. Это гипотенуза, которая у синуса стоит в знаменателе. Попробуй выбрать катет.');
  else if (!correct) say(chosen+' касается угла '+alpha+'. Его длина стоит в числителе косинуса. Для синуса поищи катет напротив этого угла.');
  else {
   say('Верно. Для угла '+alpha+' противолежащий катет '+opposite+', прилежащий '+adjacent+'. Гипотенуза AB остаётся напротив C.');
   const entries=[['sin',opposite,'AB',across,hypotenuse],['cos',adjacent,'AB',along,hypotenuse],['tg',opposite,adjacent,across,along]];
   for(const [name,numerator,denominator,m,k] of entries) {
    const notation=name+' '+alpha+' = ';
    if(measurable) formula(notation,frac(numerator,denominator),' = ',exactRatio(m,k));
    else formula(notation,frac(numerator,denominator));
   }
  }
  if (measurable) {
   stepList(['Проверь, что '+across+'² + '+along+'² = '+hypotenuse+'².','Сложи дроби с общим знаменателем '+hypotenuse+'², чтобы вычислить сумму квадратов синуса и косинуса.','Выбери другой треугольник и угол. Сначала вычисли отношения в тетради, потом сверь числитель и результаты.']);
  } else {
   stepList(['Найди AB напротив прямого угла C.','Выбери острый угол и назови катет, не содержащий его вершину.','Переключи угол. Объясни, какие две стороны поменялись ролями.']);
  }
 }
 else if (n===15 && Object.hasOwn(ratioConstructions,task.ratioConstruction)) {
  const kind=task.ratioConstruction;
  show(constructionFigure(kind,a));
  if (kind==='angle') {
   const remaining=60-a;
   formula('∠AOX = '+a+'°, ∠XOB = '+remaining+'°');
   if (!a || !remaining) say('Луч совпал со стороной исходного угла. Для двух углов внутри выбери промежуточное положение.');
   else {
    formula('∠AOX / ∠XOB = ',exactRatio(a,remaining));
    if (2*a===remaining || 2*remaining===a) {
     say(2*a===remaining?'Нижняя часть занимает одну долю, верхняя — две.':'Верхняя часть занимает одну долю, нижняя — две. Порядок записи определяет, с какой части начинаешь.');
    } else say('Для отношения 1 : 2 больший угол должен быть ровно вдвое больше меньшего. Сравни выбранные величины.');
   }
   stepList(['Сначала отметь транспортиром угол 60°.','Раздели 60° на три одинаковые доли: одна достанется меньшему углу, две — большему.','Проверь на собственном чертеже обе величины и их сумму.']);
  } else {
   const sides=kind==='segments'?[2,3]:kind==='rectangle'?[5,3]:[3,4];
   formula('Отношение длин: '+sides[0]*a+' : '+sides[1]*a+' = '+sides[0]+' : '+sides[1]);
   if (kind==='triangle') {
    formula('Короткий катет / гипотенуза = ',exactRatio(3*a,5*a));
    formula('Длинный катет / гипотенуза = ',exactRatio(4*a,5*a));
   }
   stepList(['Измени мерку: обе длины увеличатся или уменьшатся вместе.','Проверь отношение делением и подпиши свои измерения на бумаге.','Сравни чертёж и модель: экран показывает пропорции, а мерку в сантиметрах отложи линейкой на бумаге.']);
  }
 }
 else if(n===15&&Object.hasOwn(segmentRatios,task.segmentRatio)){
  const spec=segmentRatios[task.segmentRatio],right=12-a;
  show(splitSegmentFigure(a));
  formula('AC = '+a+', CB = '+right);
  if(!right)say('C совпала с B. В знаменателе ноль, поэтому отношение AC/BC не определено.');
  else{
   formula('AC / BC = ',exactRatio(a,right));
   say(spec.matches(a,right)?'Выбранное положение подходит для AC/BC '+spec.sign+'.':
    'Выбранное положение пока не подходит для AC/BC '+spec.sign+'. Передвинь C.');
   if(!a)say('C совпала с A, поэтому AC равно нулю. Чтобы на чертеже были три разные точки, выбери положение между концами.');
  }
  stepList(['Сравни две части по клеткам, считая от концов до точки C.',
   'У середины AC и CB равны. При движении C к B левая часть растёт, а правая уменьшается.',
   'Покажи на своём рисунке, какое из двух расстояний попало в знаменатель.']);
 }
 else if(n===15){show(table(['Первая величина','Вторая величина','Единицы'],[[a,b,'одинаковые']]));formula(a+' : '+b+' = ',frac(a,b));say('Порядок важен: отношение '+a+' к '+b+' — первое число делим на второе.');stepList(['Сначала вырази обе величины в одинаковых единицах.','Если переставить числа, получится обратное отношение: '+b+' : '+a+'.','Отношение не отвечает на вопрос «на сколько больше»: для этого нужна разность.']);}
 else if(n===16){show(geometryFigure({points:[{name:'A',x:0,y:0},{name:'B',x:a,y:0}],segments:[['A','B']],labels:[{x:a/2,y:-0.6,text:a+' см на карте'}],caption:'Схема отрезка на карте'}));formula('Масштаб 1 : '+b);say('На местности: '+a+' · '+b+' = '+a*b+' см = '+num(a*b/100)+' м.');stepList(['Масштаб сравнивает длины в одинаковых единицах.','Один сантиметр карты соответствует '+b+' сантиметрам на местности.','Размер схемы на экране не предназначен для измерения линейкой.']);}
 else if(n===17){show(eq(frac(3,5),' = ',frac(3*a,5*a)));const s=chart('Произведения крест-накрест');txt(s,190,90,'3');txt(s,190,270,'5');txt(s,410,90,3*a);txt(s,410,270,5*a);ln(s,155,177,225,177);ln(s,375,177,445,177);txt(s,300,185,'=');ln(s,215,105,385,245,{stroke:'#b4812a'});ln(s,215,245,385,105,{stroke:'#b4812a'});show(s);formula('3 · '+5*a+' = 5 · '+3*a+' = '+15*a);stepList(['Сначала сравни отношения: числитель и знаменатель увеличены в '+a+' раз.','Соедини числитель первой дроби со знаменателем второй — и наоборот.','Произведения равны. Все знаменатели ненулевые, поэтому пропорция верна.']);}
 else if(n===18){const pairs=[[[2,3],[8,12]],[[3,2],[12,8]],[[2,8],[3,12]],[[12,3],[8,2]]],p=pairs[a];show(eq(frac(...p[0]),' = ',frac(...p[1])));formula(p[0][0]+' · '+p[1][1]+' = '+p[0][1]+' · '+p[1][0]);say('Проверяем обе новые дроби, а не переставляем числа наугад.');stepList(['Исходная пропорция: 2 : 3 = 8 : 12.','После выбранного преобразования перекрёстные произведения равны '+p[0][0]*p[1][1]+'.']);}
 else
 if(n===38&&task.convertGroup){
  const g=unitSample(task.convertGroup,b,a===1),stage=state.values[2];say('Переведи '+g.given+' '+g.from+' в '+g.to+'.');
  if(stage>=1)formula('Переход от '+g.from+' к '+g.to+': умножить на '+g.factor);
  if(stage===2){show(table(['Проверка','Скорость'],[['В исходных единицах',g.given+' '+g.from],['В метрах в секунду',g.metresSecond+' м/с'],['В целевых единицах',g.answer+' '+g.to]]));say('Результат '+g.answer+' '+g.to+'.');}
  stepList(['Проверь, в каких единицах записаны расстояние и время.','Измени числитель и знаменатель отдельно.','Оцени ответ по смыслу одного часа, минуты или секунды.']);
 }else if(n===38&&Number.isInteger(task.walkingGap)){
  const t=[0,5,10,15][b],sample=movingWalkers(task.walkingGap,a===1,t),stage=state.values[2];say('В начале '+sample.gap+' м; скорости '+sample.v1+' и '+sample.v2+' м/с. Показываем момент '+t+' с.');
  show(walkTracks(sample.positions,sample.dirs));
  if(stage>=1)formula('d(t) = '+sample.gap+(sample.rate[0]==='-'?' − '+sample.rate.slice(1):' + '+sample.rate)+'t');
  if(stage===2)say('Расстояние '+sample.distance+' м. Изменение за секунду '+sample.rate+' м.');
  stepList(['Проверь единицы скоростей.','Отметь направления участников и реши, складывать или вычитать модули.','Сравни расстояние в начале с промежутком через несколько секунд.']);
 }else if(n===38&&task.calendarBalance){
  const albums=task.calendarBalance==='albums',last=a?80:56,all=last*15/8,first=all/5,second=all-first-last,days=a?25:30,rainGap=a?9:4,cloudy=(days+rainGap)/3.4,sunny=cloudy*1.2,rain=sunny-rainGap;
  say(albums?'Третий альбом содержит '+last+' марок. За основу второй доли взяли остаток после первого.':'За '+days+' дней наблюдения солнечных было на 20% больше, чем пасмурных. Дождливых на '+rainGap+' меньше солнечных.');
  if(b>=1)formula(albums?'(2/3)(4/5)N = '+last:'x + 1,2x + (1,2x − '+rainGap+') = '+days);
  if(b===2){const rows=albums?[['Первый альбом',first],['Второй',second],['Третий',last]]:[['Пасмурные',cloudy],['Солнечные',sunny],['Дождливые',rain]];show(table(['Группа','Количество'],rows));say(albums?'Изначально '+all+' марок.':'Солнечных '+sunny+' из '+days+', то есть '+(sunny*100/days)+'%.');}
  stepList(['Отметь целое, с которым сравнивается каждое число.','Сложи три непересекающиеся группы.','Проверь ответ по исходной сумме.']);
 }
 else
 if(n===38&&task.formulaWords){
  const sample=printedFormulaSample(task.formulaWords,a===1);say(sample.given);if(b>=1)formula(sample.calculation);
  if(b===2){if(sample.shape)show(sample.shape);show(table(['Величина','Значение'],sample.rows));say('По формуле получаем '+sample.answer+'.');}
  stepList(['Назови каждую величину и её единицы.','Объясни, что означает каждое действие в формуле.','Проверь своё объяснение на другом числовом примере.']);
 }else if(n===38&&task.stationGraph){
  const change=a===1,tracks=stationSchedule(change),shift=change?30:0,mark=[null,690+shift,720+shift,750+shift,780+shift,930+shift][b],stage=state.values[2],sample=stationResults(task.stationGraph,change);
  say(change?'Новое расписание: старт на полчаса позже, путь до станции вдвое короче.':'Расписание из упражнения. Пешеход идёт из деревни, велосипедист едет со станции.');
  show(sourceChart('station',tracks,mark));if(mark!==null)say('Вертикальная отметка: '+clockText(mark)+'.');
  if(stage>=1)say({starts:'Для начала каждого пути найди его первую точку.',meeting:'Отметь, где и как долго линии совпадают.',speeds:'Вычти расстояния в концах отрезка и раздели модуль разности на время в часах.',stops:'Ищи горизонтальные участки каждой линии по отдельности.'}[task.stationGraph]);
  if(stage===2){show(table(sample.head,sample.rows));say(sample.result);}
  stepList(['Различи сплошную и штриховую линии.','Проверь время по горизонтали и положение по вертикали.','Сохрани единицы и подпиши участников.']);
 }
 else
 if(n===38&&task.p38Shape){
  const tag=task.p38Shape,alt=a===1,m=root.PetersonMath,op=m.operation,r=x=>m.answer(x);
  if(tag==='simplifyA'||tag==='simplifyB'){
   const first=tag==='simplifyA',x=first?(alt?'-3/2':'-7/3'):(alt?'3/2':'-1/2'),y=first?(alt?4:'3/2'):(alt?'-1/2':'8/7'),value=first?op('multiply',-2,op('multiply',x,y)):op('multiply',2,op('multiply',x,x));
   say(first?'a = '+x+', b = '+y:'x = '+x+', y = '+y);if(b>=1)formula(first?'2a² − ab − ab + 2b² − 2a² − 2b²':'x² + 3xy − 3xy + y² + x² − y²');
   if(b===2){show(table(['Коэффициент',first?'При a², ab, b²':'При x², xy, y²'],[['После сбора',first?'0, −2, 0':'2, 0, 0']]));say((first?'−2ab':'2x²')+' = '+r(value)+'.');}
  }else if(tag==='squareHole'||tag==='oneStep'||tag==='twoSteps'){
   const s=paperArea(tag,alt,b>0,false);say(s.dimensions+'.');show(s.picture);
   if(b>=1)formula(s.formulaText);if(b===2)say('Площадь '+s.area+' кв. ед.');
  }else if(tag==='seriesA'||tag==='seriesB'){
   const seq=printedSequence(tag,alt);say(alt?'Новый ряд из трёх вычислений.':'Ряд из трёх выражений учебника.');
   const expression=i=>seq.list[i].steps.map(([operation,value],j)=>[j+1,operation,b>=1?value:'?']);
   for(let i=0;i<3;i++){if(b>=1)show(table(['Шаг','Действие','Результат'],expression(i)));else{const first=seq.list[i].steps[0];say('Начни ряд '+(i+1)+' с '+first[0]+'.');}}
   if(b>=1)say('Первые три значения: '+seq.v.join(', ')+'.');if(b===2)say((tag==='seriesA'?'Разность ':'Множитель ')+seq.rule+'. Следующее число '+seq.next+'.');
  }else{
   const draw=coordinateKite(alt?1:0,b);say(draw.coords.map((xy,i)=>'ABCD'[i]+'('+xy.join('; ')+')').join(', ')+'.');show(draw.picture);
   if(b>=1)say('Одна диагональ поднимается на одну клетку при движении вправо на клетку, другая опускается.');
   if(b===2){say('Пересечение ('+draw.intersection.join('; ')+'). Диагонали перпендикулярны.');show(table(['Проверка','Результат'],[['AB² и AD²','40 и 40'],['CB² и CD²','160 и 160'],['MB² и MD²','32 и 32']]));}
  }
  stepList(['Составь решение по исходному условию.','Сравни каждый переход с проверкой.','На новых данных проверь, какое свойство сохранилось.']);
 }
 else
 if(n===38&&task.sizeRule){
  const v=magnitudesForRule(task.sizeRule,a===1);say('Начальное число '+v.given+'. Применим правило из задания.');
  if(b>=1)formula(v.expression);if(b===2){show(changeBars(v.given,v.result,['Было','Стало']));say('Результат '+v.result+'. Изменение со знаком '+v.delta+'.');}
  stepList(['Определи, что означает «на», «в» или знак процента.','Запиши действие с буквой.','Подставь другое исходное число и проверь разницу.']);
 }else if(n===38&&task.percentBasis){
  const v=compareBothBases(task.percentBasis,a===1);say('Сравниваем a = '+v.a+' и b = '+v.b+'.');
  if(b>=1)formula('a/b × 100% и b/a × 100%');
  if(b===2){show(changeBars(v.a,v.b,['Число a','Число b']));show(table(['Основание','Отношение','Отклонение'],[['b',v.p+'%',v.deltaA+'%'],['a',v.q+'%',v.deltaB+'%']]));say('a составляет '+v.p+'% от b; b составляет '+v.q+'% от a.');say('a '+(v.aLarger?'больше':'меньше')+' b на '+v.deltaA+'%. b '+(v.aLarger?'меньше':'больше')+' a на '+v.deltaB+'%.');}
  stepList(['Подчеркни число, от которого считаешь проценты.','Для обратного сравнения переставь числитель и знаменатель.','Разность с 100% показывает изменение, а не полное отношение.']);
 }else if(n===38&&task.reduceStudy){
  const v=reducedFormExample(task.reduceStudy,a===1),m=root.PetersonMath,after=m.answer(m.operation('divide',...v.small));say(v.given+'. '+v.substitution+'.');
  if(b>=1)say('Общий ненулевой множитель: '+v.factor+'.');
  if(b===2){formula(v.given+' = '+v.reduced);show(table(['Проверка','Значение'],[['До сокращения',v.original],['После сокращения',after],['Числитель после',v.small[0]],['Знаменатель после',v.small[1]]]));say('Значения равны: '+v.original+' = '+after+'.');}
  stepList(['Представь весь числитель и весь знаменатель произведениями.','Раздели оба на один ненулевой множитель.','Подставь допустимые числа до сокращения и после него.']);
 }else if(n===38&&Number.isInteger(task.squareClaim)){
  const q=task.squareClaim,m=root.PetersonMath,x=['-2/3','0','3/2'][a],sx=m.operation('multiply',x,x),test=[sx.n>0,sx.n>=0,sx.n<0,sx.n<=0][q];
  say('Проверим рациональное a = '+x+'.');if(b>=1)formula('a² = ('+x+') × ('+x+') = '+m.answer(sx));
  if(b===2){show(table(['Проверка','Вывод'],[['У выбранного числа неравенство',test?'выполнено':'не выполнено'],['Утверждение с квантором',['ложно','истинно','ложно','истинно'][q]]]));say(['Для a = 0 строгая положительность нарушена. Отрицание: существует a с a² ≤ 0.','Все квадраты неотрицательны: два множителя имеют одинаковый знак или равны нулю.','Ни один квадрат не бывает отрицательным. Отрицание: для каждого a квадрат неотрицателен.','Существует подходящее число: a = 0, ведь 0² ≤ 0.'][q]);}
  stepList(['Различай «для каждого» и «существует».','Проверь отдельно a = 0 и любое ненулевое число.','Для общего вывода используй правило знаков, для существования достаточно примера.']);
 }
 else
 if(n===38&&task.mentalSeries){
  const sample=oneMentalOperation(task.mentalSeries[b],a===1),stage=state.values[2];say('Пример '+(b+1)+'. '+sample.expression+' = ?');
  if(stage>=1)say(sample.guidance);if(stage===2){show(table(['Проверка','Значение'],[['Первое число',sample.left],['Второе число или показатель',sample.right],['Знак результата',sample.sign],['Результат',sample.value]]));say('Точный ответ: '+sample.value+'.');}
  stepList(['Оцени знак результата до вычисления.','Сосчитай модуль, затем запиши ответ со знаком.','Проверь тот же приём на новом наборе чисел.']);
 }
 else if(n===38&&task.portionRow){
  const q=task.portionRow,m=root.PetersonMath,op=m.operation,r=x=>m.answer(x),known=op('multiply',q.given,a===1?2:1),whole=q.whole?op('divide',known,q.ratio):known,part=op('multiply',whole,q.ratio);
  say((q.symbol?'При '+q.symbol+' = '+r(known)+'. ':'')+(q.whole?'Известная часть: ':'Данное целое: ')+r(known)+'. Доля '+q.ratio+'.');
  if(b>=1)formula(q.whole?'Целое = часть ÷ доля':'Часть = целое × доля');
  if(b===2){show(changeBars(r(whole),r(part),['Целое','Сравниваемая величина']));show(table(['Что проверяем','Значение'],[['Целое',r(whole)],['Коэффициент',q.ratio],['Часть',r(part)]]));say('Ответ: '+(q.whole?r(whole):r(part))+'.');}
  stepList(['Реши, известны целое или его часть.','Дробь может быть больше единицы. Сравни результат с целым.','Подставь ответ в связь «часть = целое × доля».']);
 }
 else if(n===38&&(task.appliedBalance||task.appliedCompare||task.printedJourney||task.sharedRate)){
  const sample=task.sharedRate?sharedJourney(task.sharedRate,a===1):task.printedJourney?sourceRoute(task.printedJourney,a===1):task.appliedCompare?comparedAmounts(task.appliedCompare,a===1):modelStory(task.appliedBalance,a===1);say(sample.condition);
  if(b>=1)formula(sample.equation);if(b===2){show(sample.shape||changeBars(...sample.bar,sample.labels));show(table(['Величина','Значение'],sample.rows));say(sample.result);}
  stepList(['Определи, к какому исходному числу относится доля.','Запиши, что остаётся тем же или как меняется величина.','Подставь найденное значение и проверь именно запрошенный результат.']);
 }
 else
 if(n===19&&task.ratioRewrite){
  const data=task.ratioRewrite,m=root.PetersonMath,values=(b?data.after:data.before).map(x=>m.operation('multiply',x,a?2:1));show(quartetFigure(values,b===2?2:0));
  say(b?'После преобразования.':'До преобразования.');if(b>=1)say(data.law);if(b===2){const products=compareQuartet(values);say('Крайние: '+m.answer(products.outer)+'. Средние: '+m.answer(products.inner)+'.');}
  stepList(['Отметь крайние и средние члены.','Сопоставь все четыре места слева направо.','Обоснуй равносильность преобразования.']);
 }
 else if(n===19&&task.printedRateStory){
  const info=printedStoryDetails(task.printedRateStory,a,b),mode=state.values.at(-1);say(info.description);
  if(mode>=1)show(table(['Величина','Значение'],info.rows));if(mode===2)say(info.answer);
  stepList(['Отдели исходные величины от искомых.','Запиши зависимости до подстановки чисел.','Проверь единицы и ответ в исходной ситуации.']);
 }
 else if(n===19&&task.marketDistanceGraph){
  const apples=task.marketDistanceGraph==='apples',mode=state.values[2],m=root.PetersonMath,times=[1,2,3,4,4.5,6,9,18],x=apples?b:times[b],calc=k=>apples?m.operation('multiply',a,k):m.operation('divide',a,k);
  const curve=apples?[[0,0],[4,4*a]]:Array.from({length:137},(_,i)=>{const t=1+i/8;return [t,a/t];});show(sourceChart(task.marketDistanceGraph,[curve],x));
  say(apples?'Масса '+x+' кг, цена '+a+' р./кг.':'Путь '+a+' км, время '+num(x)+' ч.');
  if(mode>=1)say('Значение: '+m.answer(calc(x))+(apples?' р.':' км/ч.'));
  if(mode===2){formula(apples?'C = '+a+'m':'v = '+a+'/t, t > 0');show(table(apples?['кг','рубли']:['ч','км/ч'],(apples?[0,1,2,3,4]:times).map(k=>[num(k),m.answer(calc(k))])));}
  stepList(['Назови постоянную величину.','Отметь точки таблицы в соответствующих единицах.','Сопоставь форму графика с формулой.']);
 }
 else if(n===19&&task.composeSourceRatio){
  const m=root.PetersonMath,vs=[[6,10,3,5],[6,3,10,5],[6,5,10,3]][a],cmp=compareQuartet(vs);show(quartetFigure(vs.map(m.parse),b?2:0));
  if(b)say('Крайние: '+m.answer(cmp.outer)+'. Средние: '+m.answer(cmp.inner)+'. '+(cmp.same?'Пропорция верна.':'Эта расстановка не подходит.'));
  stepList(['Используй каждое из четырёх значений один раз.','Сравни произведения по диагоналям.']);
 }
 else if(n===19&&task.oilCans){
  const rem=a-17*b,mode=state.values[2];formula('10a + 17b = '+a+'. Выбрано b = '+b+'.');
  if(mode>=1)say('Остаток '+rem+' л. '+(rem>=0&&rem%10===0?'Хватит на '+rem/10+' полных малых бидонов.':'Полными 10-литровыми бидонами его не заполнить.'));
  if(mode===2){const variants=range(0,Math.floor(a/17)).filter(k=>(a-17*k)%10===0).map(k=>[(a-17*k)/10,k,(a-17*k)/10+k]);show(table(['Малых','Больших','Всего'],variants));say('Число подходящих вариантов: '+variants.length+'.');}
  stepList(['Запиши уравнение общего объёма.','Ограничь число больших бидонов вместимостью.','Для каждого допустимого числа проверь остаток по модулю 10.']);
 }
 else
 if(n===19&&task.sourceFuelGraph){
  const mode=state.values[2],m=root.PetersonMath,per=m.operation('divide',a,100);show(sourceChart('fuel',[[[0,0],[100,a]]],b));
  say('За 100 км расходуется '+a+' л. Выбран путь '+b+' км.');
  if(mode>=1)say('Расход: '+m.answer(m.operation('multiply',per,b))+' л.');if(mode===2){formula('B = '+num(a/100)+'s');show(table(['км','л'],range(1,10).map(k=>[10*k,num(k*a/10)])));}
  stepList(['Найди пройденный путь на горизонтальной оси.','Поднимись до линии и посмотри на вертикальную ось.','Проверь отношение литров к километрам.']);
 }
 else if(n===19&&task.flightGraph){
  const mode=state.values[2],series=[flightProfile(0,a),flightProfile(1,a)],positions=series.map(p=>flightPosition(p,b));show(sourceChart('flights',series,b));
  say('Время '+clockText(b)+'. A — сплошная линия, Б — пунктир.');
  if(mode>=1){show(table(['Самолёт','От Внукова, км','Состояние'],positions.map((p,i)=>[i?'Б':'A',p.range,p.state])));positions.forEach((p,i)=>say((i?'Б':'A')+': '+p.range+' км, '+p.state+'.'));}
  if(mode===2){series.forEach((points,i)=>show(table([i?'Б: время':'A: время','км'],points.map(([t,v])=>[clockText(t),v]))));}
  stepList(['Горизонталь обозначает стоянку, наклон означает полёт.','Модуль наклона равен скорости.','Для времени на заданном расстоянии найди все пересечения с горизонталью.']);
 }
 else if(n===19&&task.sectionFlow){
  const mode=state.values[2],m=root.PetersonMath,points=range(20,120).map(x=>[x,a/x]);show(sourceChart('section',[points],b));
  say('Расход воды '+a+' м³/с. Выбранное сечение '+b+' м².');if(mode>=1)say('Скорость '+m.answer(m.operation('divide',a,b))+' м/с.');if(mode===2)formula('v = '+a+'/P, P > 0.');
  stepList(['Проверь произведение площади на скорость.','Отметь пары на координатной плоскости.','Соедини точки плавной убывающей кривой для положительной площади.']);
 }
 else if(n===19&&task.hobbySurvey){
  const vals=hobbyFigures.slice(),mode=state.values[2];if(a)vals[5]+=3;show(sourceHobbyFigure(vals,b));say('Выбрано: '+hobbyNames[b]+'.');
  if(mode>=1)say('Отмечено: '+vals[b]+'.');if(mode===2){show(table(['Занятие','Ответов'],hobbyNames.map((n,i)=>[n,vals[i]])));say('Сумма отметок '+vals.reduce((sum,v)=>sum+v,0)+'.');}
  stepList(['Сопоставь букву названию занятия.','Считай высоту в голосах.','Отличай количество отметок от числа опрошенных.']);
 }
 else if(n===19&&task.legoSurvey){
  const nums=toyFigures.slice(),mode=state.values[2];if(a){nums[0]--;nums[6]++;}const total=nums.reduce((s,v)=>s+v,0),rate=Math.round(100*nums[b]/total);
  say(toyNames[b]+': '+nums[b]+' голосов из '+total+'.');if(mode>=1)say('Округлённая доля: '+rate+'%.');if(mode===2){show(toyLineDiagram(nums));show(table(['Серия','Голоса','Доля, %'],nums.map((q,i)=>[toyNames[i],q,Math.round(100*q/total)])));}
  stepList(['Найди общее число голосов.','Раздели количество выбранной серии на общее и умножь на 100.','Покажи округлённый процент длиной горизонтальной линии.']);
 }
 else
 if(n===19&&Number.isInteger(task.gapDirection)){
  const type=task.gapDirection,d=changingGap(type,a,b),sign=type===0||type===2?'−':'+',oper=type<2?'+':'−',delta=type===0||type===2?'s₀ − d':'d − s₀';
  say('Сначала между машинами '+a+' км. Скорости 20 и 10 км/ч. Прошло '+b+' ч.');
  show(twoCarLanes(d.pos(d.left),d.pos(d.right),d.firstDirection,d.secondDirection,task.hint));
  if(state.values[2]>=1){formula('d = s₀ '+sign+' (v₁ '+oper+' v₂)t');say('Расстояние сейчас '+d.distance+' км.');}
  if(state.values[2]===2){formula('t = ('+delta+')/(v₁ '+oper+' v₂)');formula('v₁ = ('+delta+')/t '+(type<2?'−':'+')+' v₂');say('Для восстановления скорости по этим формулам необходимо t > 0.');}
  stepList(['Определи направление обеих скоростей.','Проверь знак изменения промежутка.','Вырази время и первую скорость из одной связи.']);
 }
 else if(n===19&&Number.isInteger(task.quantityFamily)){
  const tag=task.quantityFamily;
  if(tag===0){const down=10+a,up=10-a;say('Лодка идёт '+down+' км/ч по течению и '+up+' км/ч против.');
   if(b>=1)formula('vпо = u + c; vпр = u − c');if(b===2)say('Собственная скорость ('+down+' + '+up+')/2 = 10 км/ч. Течение ('+down+' − '+up+')/2 = '+a+' км/ч.');
  }else if(tag===1){say('Часть A = '+a+', основание B = 80.');if(b>=1)say('p = 100A/B = '+num(100*a/80)+'%.');if(b===2)say('B = 100A/p = 80. А = pB/100 = '+a+'.');}
  else{
   const m=root.PetersonMath,compound=tag===3,rate=m.operation('divide',a,100),rows=[];let value=m.parse(1000);
   say('Начальное значение 1000, ставка '+a+'%, периодов '+b+'.');
   for(let k=1;k<=b;k++){const increase=m.operation('multiply',compound?value:1000,rate);value=m.operation('add',value,increase);rows.push([k,m.answer(increase),m.answer(value)]);}
   if(state.values[2]>=1)show(table(['Период','Прибавка','Итог'],rows));if(state.values[2]===2){say('Итог: '+m.answer(value)+'.');formula(compound?'S₀ = S/(1 + p/100)ⁿ':'S₀ = S/(1 + np/100)');}
  }
  stepList(['Определи основание или исходную величину.','Запиши прямую связь.','Проверь обратную формулу на тех же данных.']);
 }
 else if(n===19&&Number.isInteger(task.geometryQuantity)){
  const geo=formulaGeometry(task.geometryQuantity,a);show(geo.diagram);if(b>=1)show(table(['Величина','Значение'],geo.labels));
  if(b===2){formula(geo.formula);say('Результат: '+geo.result+'.');}
  stepList(['Назови размеры на схеме.','Различи длину, площадь и объём.','Проверь размерность численного результата.']);
 }
 else
 if(n===19&&task.productUnits){
  const key=task.productUnits;
  const data={
   own:{formula:'C = a × n',units:'(р./шт.) × шт. = р.',condition:'Цена 18 р., предметов '+a+'.',answer:18*a+' р. Обратно: '+(18*a)+' / '+a+' = 18 р./шт.'},
   books:{formula:'n = 600/a',units:'р. / (р./тетрадь) = тетради',condition:'На тетради есть 600 р., цена одной '+a+' р.',answer:600/a+' тетрадей. Проверь: '+(600/a)+' × '+a+' = 600 р.'},
   typing:{formula:'t = 240/w',units:'стр. / (стр./ч) = ч',condition:'Рукопись 240 страниц, набор '+a+' стр./ч.',answer:240/a+' ч. Проверь: '+(240/a)+' × '+a+' = 240 стр.'},
   salt:{formula:'m = (30/100)M',units:'доля × г = г',condition:'В растворе '+a+' г, массовая доля соли 30%.',answer:num(a*.3)+' г соли. На остальное приходится '+num(a*.7)+' г.'},
   telegram:{formula:'C = 18 + 1,1n',units:'р. + (р./слово) × слов = р.',condition:'Слов '+a+'. Подача стоит 18 р., каждое слово — ещё 1,1 р.',answer:num(18+1.1*a)+' р. Одна подача и '+a+' оплаченных слов.'}
  }[key];say(data.condition);if(b>=1){formula(data.formula);say(data.units);}if(b===2)say('Ответ: '+data.answer);
  stepList(['Назови величины и их единицы.','Запиши зависимость, опираясь на смысл предметов, времени или массы.','Проверь результат обратным действием либо по частям суммы.']);
 }
 else if(n===19&&task.unitBlanks){
  const d=task.unitBlanks,idx=b-1,mode=state.values[2],rows=a?freshUnitRows[d.formula]:d.rows;
  formula(d.formula);show(missingUnitsTable(d,idx,mode===1,a===1));say('Строка '+b+', пропущено: '+d.headers[d.missing[idx]]+'.');
  if(mode)say('Подходит единица '+rows[idx][d.missing[idx]]+'.');stepList(['Определи, что измеряет столбец.','Сократи единицу времени или количества в произведении.','Проверь оставшуюся размерность.']);
 }
 else if(n===19&&task.approachFormula){
  const t=task.approachFormula,data=approachCase(t,a===1),mode=state.values[2];show(approachDiagram(t,data,b));
  say(t.unknown==='distance'?'Скорости '+data.v1+' и '+data.v2+' км/ч, время '+data.time+' ч.':t.unknown==='time'?'Промежуток '+data.space+' км, скорости '+data.v1+' и '+data.v2+' км/ч.':'Промежуток '+data.space+' км, время '+data.time+' ч, вторая скорость '+data.v2+' км/ч.');
  if(mode>=1)say('Скорость сближения: '+(t.approach?'v₁ + v₂':'v₁ − v₂')+' = '+data.relative+' км/ч.');
  if(mode===2)say('Ответ: '+data.answer+' '+(t.unknown==='distance'?'км':t.unknown==='time'?'ч':'км/ч')+'. Проверка: '+data.relative+' × '+data.time+' = '+data.space+' км.');
  stepList(['Определи направление обеих стрелок.','Найди, насколько уменьшается промежуток за час.','Используй s = vсбл × t, проверяя единицы.']);
 }
 else
 if(n===19){const y=2*a+(b?3:0);show(table(['x','y','y : x'],range(1,5).map(x=>[x,2*x+(b?3:0),num((2*x+(b?3:0))/x)])));formula('x = '+a+' → y = '+y);say(b?'Прибавка 3 делает отношение y : x непостоянным. Это зависимость, но не прямая пропорциональность.':'Отношение y : x всегда равно 2. Это прямая пропорциональность.');}
 else if(n===20){const y=b?12/a:12*a;show(table(['x','y',b?'x · y':'y : x'],range(1,6).map(x=>[x,num(b?12/x:12*x),12])));formula('x = '+a+'; y = '+num(y));say(b?'Увеличиваем x — y уменьшается во столько же раз. Произведение равно 12.':'Увеличиваем x — y увеличивается во столько же раз. Отношение равно 12.');}
 else if(n===21){const poly=[];for(let x=b?0.5:0;x<=6;x+=0.1){const y=b?a/x:a*x;if(y<=12)poly.push([x,y]);}show(planeFigure({xMin:0,xMax:6,yMin:0,yMax:12,polylines:[poly],points:[{name:'A',x:2,y:b?a/2:2*a}],caption:b?'График обратной пропорциональности при x > 0':'График y = kx при x ≥ 0'}));show(table(['x',1,2,3,6],[[b?'k : x':'kx',... [1,2,3,6].map(x=>b?exactRatio(a,x):a*x)]]));say(b?'Точки обратной пропорциональности не лежат на одной прямой. x = 0 запрещён.':'График прямой пропорциональности лежит на прямой через начало координат.');}
 else if(n===22){show(table(['Масса, кг','Стоимость, р.'],[[2,6],[a,3*a]]));formula(frac(2,a),' = ',frac(6,3*a));stepList(['Цена неизменна: 6 : 2 = 3 р. за килограмм.','Масса и стоимость прямо пропорциональны. Сохраняй одинаковый порядок строк.','Стоимость '+a+' кг: 3 · '+a+' = '+3*a+' р.']);}
 else if(n===23){const f=el('div');renderFigure(f,{type:'parts',parts:[{label:'Первая часть',count:2},{label:'Вторая часть',count:3}],totalLabel:'Всего '+5*a,caption:'Каждый прямоугольник — одна и та же доля.'});show(f);stepList(['Всего 2 + 3 = 5 равных долей.','Одна доля: '+5*a+' : 5 = '+a+'.','Части: '+2*a+' и '+3*a+'. Проверка: сумма '+5*a+', отношение 2 : 3.']);}
 else if(n>=24&&n<=28){let pts=[{name:'A',x:a}],arrows=[];if(n===25)pts=[{name:'A',x:a},{name:'B',x:-a}];if(n===26)pts=[{name:'A',x:a},{name:'B',x:b}];if(n===27||n===28){const end=n===27?a+b:a-b;pts=[{name:'A',x:a},{name:'B',x:end}];arrows=[[a,end]];}show(axisFigure(pts,-11,11,arrows));if(n===24)say(a<0?'Число '+a+' левее нуля.':'Число '+a+(a===0?' равно нулю.':' правее нуля.'));if(n===25){formula('|'+a+'| = '+Math.abs(a));say('Противоположное число: '+(-a)+'. Расстояние до нуля у них одинаковое.');}if(n===26){formula(a+' '+(a>b?'>':a<b?'<':'=')+' '+b);say('Сравни положение, а не только модули. Среди отрицательных больше число с меньшим модулем.');}if(n===27||n===28){const move=n===27?b:-b,end=a+move;formula(a+(n===27?' + ':' − ')+'('+b+') = '+end);say('От '+a+' двигаемся '+(move<0?'влево':'вправо')+' на '+Math.abs(move)+' единиц.');if(n===28)formula(a+' + ('+(-b)+') = '+end);}}
 else if(n===29){formula('('+a+') · ('+b+') = '+a*b);show(table(['Модули','Знак','Произведение'],[[Math.abs(a)+' · '+Math.abs(b),a*b<0?'минус':a*b>0?'плюс':'ноль',a*b]]));stepList(['Сначала определи знак: одинаковые ненулевые знаки дают плюс, разные — минус.','Затем перемножь модули. Если хотя бы один множитель равен нулю, всё произведение равно нулю.']);}
 else if(n===30){formula('('+a*b+') : ('+a+') = '+b);formula('Проверка: ('+b+') · ('+a+') = '+a*b);say('Делитель не равен нулю. Знак частного определяется тем же правилом, что знак произведения.');}
 else if(n===31){const rows=[['3','натуральное','целое','рациональное'],['−3','не натуральное','целое','рациональное'],['0','не натуральное в этом курсе','целое','рациональное'],[frac(1,2),'не натуральное','не целое','рациональное'],['√2','не натуральное','не целое','не рациональное']];show(table(['Число','Натуральные','Целые','Рациональные'],[rows[a]]));say('Натуральные числа входят в целые, целые — в рациональные. Рациональное число записывается отношением двух целых с ненулевым знаменателем.');if(a===4)say('Здесь лишь знакомство: доказательство нерациональности √2 требует отдельного рассуждения.');}
 else if(n===32){const digits=a.toString(b).split('').map(Number);show(table(['Разряд','Цифра','Вес'],digits.map((x,i)=>[digits.length-i-1,x,b+'^'+(digits.length-i-1)])));formula(a+'₁₀ = '+a.toString(b)+' (основание '+b+')');say(digits.map((x,i)=>x+' · '+b+'^'+(digits.length-i-1)).join(' + ')+' = '+a+'.');}
 else if(n===33){formula('10 − ('+a+' − ('+b+'))');stepList(['Минус перед скобками меняет знаки обоих слагаемых.','10 − ('+a+') + ('+b+') = '+(10-a+b)+'.','Проверка вычислением внутри скобок: '+a+' − ('+b+') = '+(a-b)+'. Затем 10 − ('+(a-b)+') = '+(10-a+b)+'.']);}
 else if(n===34){formula('('+a+') · ('+b+') · x = '+a*b+'x');say('Числовые множители объединены в коэффициент '+a*b+'. Буква остаётся множителем.');}
 else if(n===35){formula(a+'x + ('+b+')x = ('+a+' + ('+b+'))x = '+(a+b)+'x');say('Буквенная часть у слагаемых одна и та же. Для 3x + 2y такое объединение невозможно без дополнительной связи между x и y.');}
 else if(n===36){formula('x + 3 = 7');formula('При x = '+a+': '+a+' + 3 = '+(a+3));say(a+3===7?'Получилось верное равенство. Это корень.':'Левая и правая части не равны. Это не корень.');}
 else if(n===37){const coef=a?3:2,offset=a?-4:3,sol=a?5:4;formula(coef+'x '+(offset<0?'− '+(-offset):'+ '+offset)+' = 11');stepList(['Выполним с обеими частями одинаковое действие: '+(offset<0?'прибавим '+(-offset):'вычтем '+offset)+'.',coef+'x = '+(11-offset)+'.','Разделим обе части на '+coef+': x = '+sol+'.','Проверка: '+coef+' · '+sol+' '+(offset<0?'− '+(-offset):'+ '+offset)+' = 11.']);}
 else if(n===38){const total=2*b+a;show(geometryFigure({points:[{name:'A',x:0,y:0},{name:'B',x:b,y:0},{name:'C',x:0,y:-2},{name:'D',x:b,y:-2},{name:'E',x:b+a,y:-2}],segments:[['A','B'],['C','D'],['D','E']],labels:[{x:b/2,y:.7,text:'x'},{x:b/2,y:-2.7,text:'x'},{x:b+a/2,y:-2.7,text:'ещё '+a}],caption:'Схема двух количеств'}));say('Сумма двух количеств равна '+total+'.');formula('x + (x + '+a+') = '+total);stepList(['Пусть x — меньшее количество. Тогда большее равно x + '+a+'.','Сложим количества: 2x + '+a+' = '+total+'.','2x = '+(total-a)+'; x = '+b+'. Большее: '+(b+a)+'.']);}
 else if(n===39){show(planeFigure({xMin:Math.min(-6,a-1),xMax:Math.max(6,a+1),yMin:Math.min(-6,b-1),yMax:Math.max(6,b+1),points:[{name:'A',x:a,y:b}],polylines:[[[0,0],[a,0],[a,b]]],caption:'Путь к точке по её координатам'}));formula('A('+a+'; '+b+')');say('Первая координата — горизонтальное смещение от нуля. Вторая — вертикальное. При перестановке координат обычно получается другая точка.');}
 else if(n===40){const path=[[0,0],[2,4],[4,4],[6,8]],value=a<=2?2*a:a<=4?4:4+2*(a-4);show(planeFigure({xMin:0,xMax:6,yMin:0,yMax:9,polylines:[path],points:[{name:'P',x:a,y:value}],caption:'Путь s от времени t: условный пример'}));formula('t = '+a+' ч; s = '+value+' км');say(a>2&&a<4?'Горизонтальный участок: путь не меняется, путешественник стоит.':'На наклонном участке путь увеличивается. Сравни изменение пути и времени.');}
 else if(n>=41&&n<=44){let A,B,astr,bstr;if(n===41){A=a%4===0;B=a%2===0;astr='Делится на 4';bstr='Делится на 2';}else if(n===42||n===43){A=a%2===0;B=a%4===0;astr='Делится на 2';bstr='Делится на 4';}else{A=a%2===0;B=a%10%2===0;astr='Число чётное';bstr='Последняя цифра чётная';}show(table(['Число',astr,bstr],[[a,A?'да':'нет',B?'да':'нет']]));say(A&&!B?'Найден контрпример: условие истинно, заключение ложно.':!A?'Условие ложно. Этот пример не опровергает следование.':'Условие и заключение истинны. Один пример не доказывает общий случай.');if(n===41)say('Общее объяснение: если n = 4k, то n = 2 · (2k), поэтому n делится на 2.');if(n===42||n===43)say('Попробуй 2, 6, 10… Из делимости на 2 не следует делимость на 4.');if(n===44)say('Оба направления верны по признаку делимости на 2. Это равносильные свойства.');}
 else if(n===45||n===47){const shapes=[{pts:[[0,0],[3,0],[3,3],[0,3]],name:'Квадрат'},{pts:[[0,0],[5,0],[5,2],[0,2]],name:'Прямоугольник, не квадрат'},{pts:[[0,0],[3,1],[6,0],[3,-1]],name:'Ромб, не квадрат'},{pts:[[0,0],[4,0],[1,3]],name:'Треугольник'}];if(n===45&&a===2){show(geometryFigure({points:[{name:'O',x:0,y:0}],circles:[{center:'O',radius:2}],caption:'Круг и его граница'}));say('Круг не является многоугольником.');}else{const sh=shapes[a],points=sh.pts.map(([x,y],i)=>({name:String.fromCharCode(65+i),x,y}));show(geometryFigure({points,segments:points.map((p,i)=>[p.name,points[(i+1)%points.length].name]),caption:sh.name}));say(sh.name+(a===0?' — одновременно прямоугольник, ромб и четырёхугольник.':a===1?' — четырёхугольник, но его стороны не все равны.':a===2?' — четырёхугольник с равными сторонами, но углы не все прямые.':' — многоугольник с тремя сторонами.'));}}
 else if(n===46){const s=chart('Отрезок, луч или прямая');ln(s,a===2?45:150,180,a===0?450:555,180);dot(s,150,180,'A');dot(s,450,180,'B');if(a>0){ln(s,555,180,545,173);ln(s,555,180,545,187);}if(a===2){ln(s,45,180,55,173);ln(s,45,180,55,187);}show(s);say(['Отрезок AB имеет два конца.','Луч AB начинается в A и продолжается через B без конца.','Прямая AB продолжается без конца в обе стороны.'][a]);}
 else if(n===48){const points=[{name:'A',x:0,y:0},{name:'B',x:4,y:0}],f={points,segments:[['A','B']],caption:'Схема построения серединного перпендикуляра'};if(a>=1){f.circles=[{center:'A',radius:3},{center:'B',radius:3}];points.push({name:'P',x:2,y:Math.sqrt(5)},{name:'Q',x:2,y:-Math.sqrt(5)});}if(a===2)f.segments.push(['P','Q']);show(geometryFigure(f));say(['Дан отрезок AB. Нужно построить его серединный перпендикуляр.','Из A и B проведи окружности одинакового радиуса, большего половины AB.','Проведи прямую через P и Q. Она перпендикулярна AB и делит его пополам.'][a]);say('Выполни построение циркулем и линейкой в тетради. Просмотр схемы не подтверждает, что построение выполнено.');}
 else if(n===49){const A={name:'A',x:0,y:0},B={name:'B',x:6,y:0},C={name:'C',x:a,y:4},points=[A,B,C],segments=[['A','B'],['B','C'],['C','A']];let center,lines=[];if(b===0){const mid=(p,q,name)=>({name,x:(p.x+q.x)/2,y:(p.y+q.y)/2}),D=mid(B,C,'D'),E=mid(A,C,'E'),F=mid(A,B,'F');points.push(D,E,F);lines=[['A','D'],['B','E'],['C','F']];center={name:'G',x:(6+a)/3,y:4/3};}else if(b===1){const project=(p,u,v,name)=>{const dx=v.x-u.x,dy=v.y-u.y,t=((p.x-u.x)*dx+(p.y-u.y)*dy)/(dx*dx+dy*dy);return {name,x:u.x+t*dx,y:u.y+t*dy};},D=project(A,B,C,'D'),E=project(B,A,C,'E'),F={name:'F',x:a,y:0};points.push(D,E,F);lines=[['A','D'],['B','E'],['C','F']];center={name:'H',x:a,y:a*(6-a)/4};}else if(b===2){const la=Math.hypot(6-a,4),lb=Math.hypot(a,4),lc=6,sum=la+lb+lc;center={name:'I',x:(lb*6+lc*a)/sum,y:lc*4/sum};points.push(center);lines=[['A','I'],['B','I'],['C','I']];}else{center={name:'O',x:3,y:(a*a+16-6*a)/8};const mids=[{name:'D',x:3,y:0},{name:'E',x:a/2,y:2},{name:'F',x:(6+a)/2,y:2}];points.push(...mids,center);lines=mids.map(p=>[p.name,'O']);}if(!points.includes(center))points.push(center);show(geometryFigure({points,segments:[...segments,...lines],caption:['Медианы и центр тяжести','Высоты и ортоцентр','Биссектрисы и центр вписанной окружности','Серединные перпендикуляры и центр описанной окружности'][b],...(b===3?{circles:[{center:'O',radius:Math.hypot(center.x,center.y)}]}:{})}));say(['Медиана соединяет вершину с серединой противоположной стороны. Три медианы проходят через G.','Высота проводится из вершины перпендикулярно противоположной стороне. Три высоты проходят через H.','Биссектриса делит угол пополам. Три биссектрисы проходят через I.','Серединный перпендикуляр проходит через середину стороны и перпендикулярен ей. Их общая точка O равноудалена от вершин.'][b]);say('Изменяй вершину C. Наблюдение помогает понять утверждение, но не заменяет его доказательства.');}
 else if(n===50){show(solidFigure(['cube','cuboid','tetrahedron'][a]));say('Схема: пунктиром показаны невидимые рёбра. Углы и длины на изображении могут отличаться от настоящих.');}
 else if(n===51){show(solidFigure(['cube','tetrahedron','prism'][a]));const data=[[6,12,8],[4,6,4],[5,9,6]][a];show(table(['Грани','Рёбра','Вершины'],[data]));say('Считай также невидимые элементы. Для этих выпуклых многогранников В − Р + Г = 2.');}
 else if(n===52){show(solidFigure(['cylinder','cone','sphere'][a]));say(['Прямоугольник вращается вокруг стороны: получается цилиндр.','Прямоугольный треугольник вращается вокруг одного катета: получается конус.','Полукруг вращается вокруг диаметра: получается шар.'][a]);say('Схема. Штриховая линия — ось вращения. Поверхность шара называется сферой.');}
 else if(n===53){show(solidFigure('cube'));show(table(['Ребро','Площадь одной грани','Объём'],[[a+' см',a*a+' см²',a*a*a+' см³']]));stepList(['Длину измеряем единичными отрезками: '+a+' см.','На одной грани '+a+' · '+a+' = '+a*a+' квадратных сантиметров.','В '+a+' слоях по '+a*a+' кубиков: '+a*a*a+' кубических сантиметров.']);}
 else if(n===54){show(angleFigure(a));formula('∠AOB = '+a+'°');say('Центр транспортира совпадает с O. Нулевая отметка выбранной шкалы лежит на луче OA. Читаем ту же шкалу у OB.');}
 else if(n===55){show(planeFigure({xMin:-6,xMax:6,yMin:-6,yMax:6,points:[{name:'A',x:a,y:b},{name:'A′',x:-a,y:b}],segments:[['A','A′']],caption:'Отражение относительно вертикальной оси y'}));say('A('+a+'; '+b+') → A′('+(-a)+'; '+b+'). Точки находятся по разные стороны оси на одинаковом расстоянии от неё.');}
 else if(n===56){const original=[[0,0],[2,0],[0,2]],changed=original.map(([x,y])=>a===0?[x+b,y+1]:a===1?[-x-1,y]:[-x,-y]),points=original.map(([x,y],i)=>({name:['A','B','C'][i],x,y})).concat(changed.map(([x,y],i)=>({name:['A′','B′','C′'][i],x,y})));show(planeFigure({xMin:-5,xMax:6,yMin:-4,yMax:5,points,segments:[['A','B'],['B','C'],['C','A'],['A′','B′'],['B′','C′'],['C′','A′']],caption:'Равные треугольники до и после преобразования'}));say(['Все точки сдвигаются на '+b+' по горизонтали и на 1 вверх.','Отражение относительно прямой x = −0,5.','Поворот на 180° вокруг начала координат.'][a]);say('Расстояния и углы сохраняются: фигуры равны.');}
 else if(n===57){const points=range(0,a-1).map(i=>({name:String.fromCharCode(65+i),x:3*Math.cos(2*Math.PI*i/a+Math.PI/2),y:3*Math.sin(2*Math.PI*i/a+Math.PI/2)}));show(geometryFigure({points,segments:points.map((p,i)=>[p.name,points[(i+1)%a].name]),caption:'Правильный '+a+'-угольник'}));say('Все '+a+' сторон равны и все углы равны. Одного равенства сторон для общего многоугольника недостаточно.');say('Поворот вокруг центра на '+num(360/a)+'° совмещает фигуру с собой.');}
 else if(n===58){const names=['Тетраэдр','Куб','Октаэдр','Додекаэдр','Икосаэдр'],rows=[[4,6,4,'треугольники'],[6,12,8,'квадраты'],[8,12,6,'треугольники'],[12,30,20,'пятиугольники'],[20,30,12,'треугольники']];show(solidFigure(['tetrahedron','cube','octahedron','dodecahedron','icosahedron'][a]));if(a>=3)say('Каркасная схема: показаны все рёбра, в том числе находящиеся сзади.');show(table(['Многогранник','Грани','Рёбра','Вершины'],[[names[a],...rows[a].slice(0,3)]]));say('Все грани — равные правильные '+rows[a][3]+'. В каждой вершине сходится одинаковое число граней.');}
 explanations.slice(0,state.stage).forEach((line,i)=>steps.append(el('p','pcm-step',(i+1)+'. '+line)));next.hidden=!explanations.length||state.stage>=explanations.length;
 }
 draw();const cleanup=()=>host.remove();cleanup.getBoardState=()=>({...state,values:state.values.slice()});cleanup.validateBoardState=v=>validateBoardState(lesson,v,task);cleanup.applyBoardState=v=>{if(!validateBoardState(lesson,v,task))throw new TypeError('Invalid Peterson model board state');state={...v,values:v.values.slice()};selects.forEach((select,i)=>select.value=String(state.values[i]));draw();};return cleanup;
}
root.PetersonContinuationModels={mount,validateBoardState,renderFigure,configs,planeFigure,geometryFigure,platonicData};
})(typeof window!=='undefined'?window:globalThis);
