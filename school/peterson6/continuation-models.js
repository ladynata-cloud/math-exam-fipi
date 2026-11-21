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
 if(lesson?.id==='p35' && task?.likeTermsStudy)return {title:'Собери слагаемые с одинаковыми буквами и степенями',controls:[c('Буквенная часть',likeTermOptions(task.likeTermsStudy)),c('Пример',[[0,'Из задачи'],[1,task.likeTermsStudy.substitutions?'Другие значения':'Другое число']]),c('Проверка',[[0,'Сначала посчитаю'],[1,'Сумма группы'],[2,'Подстановка']])],initial:[0,0,0]};
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
function renderFigure(container,f){if(!container)return;addStyles();container.replaceChildren();if(!f||typeof f!=='object')return;const wrap=el('figure','pm-task-figure');let picture;if(f.type==='hundred-table'){picture=fullHundredGrid();}else if(f.type==='garden-ground'){picture=gardenScale();}else if(f.type==='road-ratio'){picture=roadTriangle();}else if(f.type==='city-scale-map'){picture=cityScaleFigure(f.city);}else if(f.type==='notched-parcel'){picture=parcelPicture();}else if(f.type==='six-room-flat'){picture=el('div');picture.append(apartmentPicture(),el('p','pm-note',flats.map(room=>room.tag+' — '+room.name.toLowerCase()).join(', ')));}else if(f.type==='five-lines'){picture=fiveLinePicture();}else if(f.type==='nested-tangents'){picture=tangentNest(-1,0);}else if(f.type==='pythagoras-dissection'){picture=el('div','pcm-two-arrangements');picture.append(dissectionFigure(3,4,false),dissectionFigure(3,4,true));}else if(f.type==='ratio-triangle')picture=trigFigure(f.measurable===true,null);else if(f.type==='plane')picture=planeFigure(f);else if(f.type==='line')picture=axisFigure(f.points||[],f.min??-8,f.max??8);else if(f.type==='geometry')picture=geometryFigure(f);else if(f.type==='solid')picture=solidFigure(f.shape);else if(f.type==='angle')picture=angleFigure(f.degrees,f.vertex,f.arms,f.protractor===true);else if(f.type==='proportion'){picture=eq(frac(f.leftTop,f.leftBottom),' = ',frac(f.rightTop,f.rightBottom));}else if(f.type==='parts'){picture=el('div');(f.parts||[]).forEach(p=>{const row=el('div','pcm-parts');row.append(el('span','',p.label));for(let i=0;i<p.count;i++)row.append(el('span','pcm-part',''));picture.append(row);});if(f.totalLabel)picture.append(el('p','',f.totalLabel));}else{picture=el('p','', 'Рисунок этого типа пока не поддерживается. Открой рисунок в учебнике.');}wrap.append(picture);const generic=['geometry','solid','parts'].includes(f.type)?'Схема. Размеры следует брать из условия, а не измерять на экране.':'';const caption=f.caption||generic;wrap.append(el('figcaption','pm-note',['geometry','solid','angle'].includes(f.type)&&!/^Схема[.:]/i.test(caption)?'Схема. '+caption:caption));container.append(wrap);}
let sequence=0;
function addStyles(){if(document.getElementById('peterson-continuation-styles'))return;const s=el('style');s.id='peterson-continuation-styles';s.textContent='.pcm-two-arrangements{display:flex;flex-wrap:wrap;gap:.6rem}.pcm-two-arrangements svg{width:clamp(130px,43%,225px);height:auto;max-width:100%}.pcm-parts{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:12px 0}.pcm-parts>span:first-child{flex-basis:100%}.pcm-part{display:inline-block;width:42px;height:35px;background:#a7d6bd;border:2px solid #3c7d60}.pcm-step{background:white;border-left:4px solid #4c9470;padding:10px 14px;margin:8px 0}.pm-task-figure{margin:12px 0;border:1px solid #b8d0c3;border-radius:12px;padding:14px;background:#fcfefc;overflow:auto}.pm-task-figure .pm-chart{max-height:400px}.pcm-chip{display:inline-block;margin:5px;padding:8px 12px;border-radius:8px;border:1px solid #aac7b5;background:white}.pcm-true{background:#d5ecd9}.pcm-false{background:#f7e0d5}.pcm-proof{border:1px solid #b79551;padding:12px;background:#fff9ed}.pcm-net{display:grid;grid-template-columns:repeat(4,44px);gap:0;justify-content:center}.pcm-net span{height:44px;border:1px solid #48745d;background:#cde8d8}.pcm-net .empty{visibility:hidden}.pcm-diagram{font-size:21px;text-align:center;padding:15px}.pm-control select{font:inherit;min-height:44px;width:100%}.pm-task-figure svg{width:100%;height:auto;min-width:360px}.pm-visual .pcm-dense,.pm-task-figure .pcm-dense{min-width:480px;max-height:none}.pm-task-figure .pm-note{max-width:65ch}.pm-task-figure .pm-equation{display:flex;align-items:center;justify-content:center;gap:14px;font-size:26px;line-height:1.7}.pm-task-figure .pm-fraction{display:inline-flex;flex-direction:column;text-align:center;line-height:1.25;min-width:1.2em}.pm-task-figure .pm-fraction>span:first-child{padding:0 4px 3px;border-bottom:2px solid currentColor}.pm-task-figure .pm-fraction>span:last-child{padding:3px 4px 0}';document.head.append(s);}
function mount(container,lesson,task){const conf=configFor(lesson,task);if(!container||!conf||lesson.model!=='continuation'||!task||typeof task.id!=='string')return ()=>{};addStyles();const n=Number(lesson.id.slice(1));let state={lessonId:lesson.id,kind:'continuation',taskId:task.id,values:conf.initial.slice(),stage:0};
 if(n===39&&task.figure?.type==='plane'){const p=(task.figure.points||[])[0];if(p&&allowed(conf.controls[0],p.x)&&allowed(conf.controls[1],p.y))state.values=[p.x,p.y];}
 const host=el('section','pm-model'),title=el('h3','pm-title',conf.title),intro=el('p','pm-note',task.likeTermsStudy||task.scaleExamples||task.crossScale||task.ownMapStudy||task.ownRoomStudy||task.ladderStudy||task.squareGridStudy||task.gardenPlan||task.classroomPlan||task.scaleTransfer||task.patternStudy||task.gearRatio||task.commissionStudy||task.roadSlope||task.linearStudy||task.regroupStudy||task.logicalPower||task.squareSum||task.numberTrick||task.coefficientStudy||task.coefficientContrast||Number.isInteger(task.cityMap)||task.parcelScale||task.flatScale||task.scaleReading||task.midpointStudy||task.lineRelation||task.letterStudy||task.verifyEquation||task.circusStudy||task.neighborStudy||task.steamerStudy||task.moneyStudy||task.teaStudy||task.comparisonStory||task.rateStudy||task.mixStudy||task.similarTangents||task.differenceStudy?'Предскажи результат. Измени данные модели и проверь своё объяснение.':task.oralStudy||task.chainStudy||task.travelStudy?'Сначала работай без ответа. Затем сравни свою запись с моделью.':task.nestStudy?'Сначала сформулируй свой прогноз. Меняй числа и объясняй, почему правило сохраняется.':task.pythagorasStudy?'Сосчитай одинаковые треугольники. Переключи раскладку и сравни белую площадь.':task.balanceStudy?'Предскажи, совпадут ли значения обеих сторон. Проверь подстановкой.':task.changeStudy?'Предскажи, станет ли число больше исходного. Сравни две полосы и проверь действие на другом числе.':task.partComparison?'Сначала назови сравниваемые группы. Выбери их в полях и проверь своё предположение на полосах одинакового масштаба.':task.groupRule?'Выбери небольшие числа b и c, сравни два способа вычисления и нарисуй свой пример в тетради.':task.trigStudy?'Выбери острый угол и найди обе роли катетов. Рисунок задачи остаётся выше.':task.ratioConstruction?'Измени модель и проверь своё предположение. Построение выполни в тетради и запиши проверку.':task.segmentRatio?'В модели отрезок AB состоит из 12 клеток. Меняй положение C и проверяй отношение. Затем построй свой отрезок в тетради.':n===39&&task.figure?.type==='plane'&&(task.figure.points||[]).some(p=>allowed(conf.controls[0],p.x)&&allowed(conf.controls[1],p.y))?'Модель начинается с координат точки из задачи. Изменения здесь не меняют исходный чертёж.':'Авторский пример для понимания темы. Условие выбранной задачи и её рисунок остаются на странице.'),controls=el('div','pm-controls'),visual=el('div','pm-visual'),result=el('div','pm-result'),steps=el('div'),actions=el('div','row');result.setAttribute('aria-live','polite');result.setAttribute('aria-atomic','true');host.setAttribute('aria-label','Модель: '+lesson.title);host.append(title,intro,controls,visual,result,steps,actions);container.replaceChildren(host);
 const selects=conf.controls.map((control,index)=>{const wrap=el('div','pm-control'),id='pcm-'+(++sequence),lab=el('label','',control.label),select=el('select');lab.htmlFor=id;select.id=id;control.values.forEach(v=>{const [value,label]=Array.isArray(v)?v:[v,String(v)],o=el('option','',label);o.value=String(value);select.append(o);});select.value=String(state.values[index]);select.addEventListener('change',()=>{const v=Number(select.value);if(!Number.isInteger(v)||!allowed(control,v)){select.value=String(state.values[index]);return;}state.values[index]=v;
  let hiddenControl=null;
  if(task.squareGridStudy && index<3)hiddenControl=3;
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
 else if(n===19){const y=2*a+(b?3:0);show(table(['x','y','y : x'],range(1,5).map(x=>[x,2*x+(b?3:0),num((2*x+(b?3:0))/x)])));formula('x = '+a+' → y = '+y);say(b?'Прибавка 3 делает отношение y : x непостоянным. Это зависимость, но не прямая пропорциональность.':'Отношение y : x всегда равно 2. Это прямая пропорциональность.');}
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
