/* Topic-specific, replayable investigations for the complete Vilenkin 5 course. */
(function (root) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = value => value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const text = (value, size = 400) => typeof value === 'string' && value.length <= size && !/<\/?[a-z][^>]*>/i.test(value);
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  const part1 = ['','table','place','segments','rays','scale','compare','bars','add','subtract','expression','equation','multiply','divide','remainder','distribute','order','power','divisors','divisibility','formula','area','areaunits','box','volume'];
  const fraction = {
    26:'parts',27:'compare',28:'parts',29:'add',30:'divide',31:'mixed',32:'add',33:'equivalent',34:'reduce',35:'lcd',36:'add',37:'multiply',38:'multiply',39:'divide',40:'divide'
  };
  const fractionOps = root.WorkshopV5Math?.FAMILIES || {};
  function descriptor(lesson) {
    if (!lesson?.v5Course) throw new TypeError('Unknown Vilenkin lesson');
    const key = lesson.fullKey, point = lesson.point;
    if (['natural-add','natural-subtract','multiply-column','division-column','remainder-find'].includes(key)) return {kind:'arithmetic', skill:{'natural-add':'add','natural-subtract':'subtract','multiply-column':'multiply','division-column':'divide','remainder-find':'remainder'}[key]};
    if (key === 'formula-perimeter') return {kind:'lab', key:'area', show:'perimeter'};
    if (point <= 24) return {kind:'lab', key:part1[point]};
    if (point === 25) return {kind:'circle'};
    if (fraction[point] || key === 'review-fractions') return {kind:'fraction', op:[31,34,35].includes(point)?fraction[point]:fractionOps[key] || fraction[point] || 'add'};
    if (point >= 41 && point <= 49) {
      const op = point === 41?'place':point === 42?'compare':point === 44?'round':point === 45||point === 47?'multiply':point === 46||point === 48?'divide':point === 49?'order':/subtract|borrow/.test(key)?'subtract':'add';
      return {kind:'decimal', op, naturalSecond:point === 45 || point === 46, powerOfTen:['decimal-times-ten','decimal-divide-ten'].includes(key)};
    }
    if (point === 50 || point === 51) return {kind:'angle'};
    if (point === 52) return {kind:'lab', key:key === 'project-room'?'garden':'budget'};
    if (point === 53) return {kind:key === 'mean-share'?'mean':'percent'};
    throw new TypeError('Missing Vilenkin visual: '+key);
  }
  function defaults(lesson) {
    const d = descriptor(lesson);
    if (d.kind === 'lab') {
      const config = root.VILENKIN_LABS?.[d.key];
      if (!config) throw new TypeError('Missing source laboratory: '+d.key);
      return {...Object.fromEntries(config.controls.map(c => [c.k,c.def])),...(d.show?{show:d.show}:{})};
    }
    const common = {prediction:'',first:'',seen:false,notice:''};
    if (d.kind === 'arithmetic') return {seed:17,level:d.skill === 'multiply'?3:2,step:0,draft:'',helped:false,notice:''};
    if (d.kind === 'fraction') return {...common,an:d.op === 'subtract'?5:d.op === 'divide'?3:2,ad:d.op === 'subtract'?4:d.op === 'divide'?2:3,bn:1,bd:4,factor:2};
    if (d.kind === 'decimal') return {...common,a:lesson.fullKey==='decimal-divide-zero'?408:d.op === 'subtract'?300:d.op === 'divide'?150:d.op === 'round'?347:68,b:lesson.fullKey==='decimal-divide-zero'?4:d.naturalSecond?(d.powerOfTen?10:3):d.op === 'subtract'?48:d.op === 'divide'?25:57,places:1,factor:d.naturalSecond?1:10};
    if (d.kind === 'angle') return {...common,angle:35,target:65,start:0};
    if (d.kind === 'circle') return {...common,radius:4,shape:'circle'};
    if (d.kind === 'percent') return {...common,total:80,percent:25};
    return {...common,a:4,b:8,c:6};
  }
  function normalize(lesson, raw) {
    if (!plain(raw) || Object.keys(raw).length > 40) throw new TypeError('Invalid model state');
    if (!Object.keys(raw).length) return defaults(lesson);
    const d = descriptor(lesson), base = defaults(lesson), allowed = new Set(Object.keys(base));
    if (d.kind === 'lab') for (const k of ['inquiryDraft','inquiryFirst','inquirySeen','inquiryContext']) allowed.add(k);
    for (const [k,v] of Object.entries(raw)) {
      if (!allowed.has(k) || !['number','string','boolean'].includes(typeof v) || typeof v === 'number' && !Number.isFinite(v) || typeof v === 'string' && !text(v,800)) throw new TypeError('Invalid model field');
    }
    const s = {...base,...raw};
    if (d.kind === 'lab') {
      for (const c of root.VILENKIN_LABS[d.key].controls) {
        const v=s[c.k];
        if (c.values ? !c.values.some(([a])=>a===v) : !integer(v,c.min,c.max) || (v-c.min)%c.step) throw new TypeError('Invalid laboratory control');
      }
      for (const k of ['inquiryDraft','inquiryFirst','inquiryContext']) if (s[k] !== undefined && !text(s[k],100)) throw new TypeError('Invalid prediction');
      if (s.inquirySeen !== undefined && ![0,1].includes(s.inquirySeen)) throw new TypeError('Invalid prediction state');
      return s;
    }
    if (d.kind === 'arithmetic') {
      if (!integer(s.seed,0,1000000)||!integer(s.level,1,3)||!integer(s.step,0,60)||!text(s.draft)||!text(s.notice,800)||typeof s.helped!=='boolean') throw new TypeError('Invalid arithmetic investigation');
      const task=root.ArithmeticPractice.generate(d.skill,s.level,s.seed);
      if (s.step>task.steps.length) throw new TypeError('Invalid arithmetic step');
      return s;
    }
    if (!text(s.prediction)||!text(s.first)||!text(s.notice,800)||typeof s.seen!=='boolean'||!s.seen&&s.first) throw new TypeError('Invalid model prediction');
    const check=(key,min,max)=>{if(!integer(s[key],min,max))throw new TypeError('Invalid model parameter '+key);};
    if(d.kind==='fraction'){check('an',0,12);check('ad',2,12);check('bn',d.op==='divide'?1:0,12);check('bd',2,12);check('factor',1,6);if(d.op==='subtract'&&s.an*s.bd<s.bn*s.ad)throw new TypeError('Use nonnegative fraction difference');}
    if(d.kind==='decimal'){check('a',0,999);if(d.naturalSecond){if(d.powerOfTen){if(![10,100,1000].includes(s.b))throw new TypeError('Invalid power of ten');}else check('b',1,12);}else check('b',d.op==='divide'?1:0,999);check('places',0,1);if(![1,10,100].includes(s.factor))throw new TypeError('Invalid scale');if(d.op==='subtract'&&s.a<s.b)throw new TypeError('Use nonnegative decimal difference');}
    if(d.kind==='angle'){check('angle',0,180);check('target',10,170);check('start',0,10);}
    if(d.kind==='circle'){check('radius',1,10);if(!['circle','boundary','sphere','cylinder'].includes(s.shape))throw new TypeError('Invalid shape');}
    if(d.kind==='percent'){check('total',20,200);check('percent',5,100);}
    if(d.kind==='mean')for(const k of ['a','b','c'])check(k,0,12);
    return s;
  }
  const fractionHTML=(n,d)=>'<span class="v5q-fraction" role="math" aria-label="'+n+' разделить на '+d+'"><span>'+esc(n)+'</span><span>'+esc(d)+'</span></span>';
  function mathHTML(value) {
    const escaped=esc(value);
    return escaped.replace(/(\d+)\s*\/\s*(\d+)/g,(_,n,d)=>fractionHTML(n,d));
  }
  const svg=(body,label,h=230,kind='',viewBox='')=>'<svg'+(kind?' class="v5q-plot--'+kind+'"':'')+' viewBox="'+(viewBox||'0 0 560 '+h)+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>';
  const rect=(x,y,w,h,cls='fill')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" class="v5q-'+cls+'"/>';
  const line=(x,y,X,Y)=>'<path d="M '+x+' '+y+' L '+X+' '+Y+'" class="v5q-line"/>';
  const label=(x,y,s,anchor='start')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+esc(s)+'</text>';
  const legend=lines=>'<div class="v5q-model-legend">'+lines.map(text=>'<p>'+esc(text)+'</p>').join('')+'</div>';
  const num=q=>q&&typeof q==='object'?q.n/q.d:q;
  function bar(n,d,y,name,maxUnits=2) {
    const units=Math.max(1,Math.ceil(n/d)),width=440/Math.max(units,maxUnits);let out=label(12,y+26,name);
    for(let i=0;i<units;i++){
      out+=rect(90+i*width,y,width-3,34,'empty')+rect(90+i*width,y,Math.max(0,Math.min(1,n/d-i))*(width-3),34);
      for(let j=1;j<d;j++)out+=line(90+i*width+j*(width-3)/d,y,90+i*width+j*(width-3)/d,y+34);
      out+=label(90+i*width+(width-3)/2,y+70,'1','middle');
    }
    return out;
  }
  function describe(lesson,s,M) {
    const d=descriptor(lesson),q=M.q,F=M.fmt,decimal=n=>String(n/100).replace('.',',');
    let title,question,answer,why,visual='',controls=[];
    const control=(key,title,min,max,step=1)=>controls.push({key,title,min,max,step});
    if(d.kind==='fraction') {
      const a=q(s.an,s.ad),b=q(s.bn,s.bd),gcd=(a,b)=>b?gcd(b,a%b):a,lcd=s.ad*s.bd/gcd(s.ad,s.bd);
      const op=d.op,one=['parts','mixed','equivalent','reduce'].includes(op);
      let diagramHeight=op==='add'||op==='subtract'?280:245,diagramKind='fractions',diagramBox='';
      let captions=['Каждая рамка с меткой 1 показывает одно целое.'];
      if(!one)captions.push('A — первая дробь, B — вторая дробь.');
      control('an','Числитель первой дроби',0,12);control('ad','Знаменатель первой дроби',2,12);
      if(!one){control('bn','Числитель второй дроби',op==='divide'?1:0,12);control('bd','Знаменатель второй дроби',2,12);}
      const combined=op==='add'?M.add(a,b):op==='subtract'?M.sub(a,b):null;
      const max=Math.max(2,Math.ceil(num(a)),Math.ceil(num(b)),combined?Math.ceil(num(combined)):0);
      visual=bar(s.an,s.ad,20,'A',max)+(one?'':bar(s.bn,s.bd,105,'B',max));
      const names={parts:'Доля и целое',mixed:'Выделяем целую часть',equivalent:'Размер целого сохраняется',reduce:'Одна величина — разные записи',lcd:'Доли одного размера',compare:'Сравниваем одинаковые целые',add:'Соединяем равные доли',subtract:'Убираем часть',multiply:'Берём долю от доли',divide:'Сколько порций помещается?'};
      title=names[op];
      if(['parts','mixed'].includes(op)){answer=a;question='Какое число изображено? Введи дробь или смешанное число.';why=s.an+' долей по 1/'+s.ad+'. Полная единица содержит '+s.ad+' таких долей.';}
      if(op==='equivalent'){control('factor','Разрезать каждую долю на частей',1,6);answer=a;question='Каждую долю разрежем на '+s.factor+' равных частей. Какая часть прежнего целого останется закрашенной?';why=s.an+'/'+s.ad+' = '+s.an*s.factor+'/'+s.ad*s.factor+'. Части мельче, но сама закраска не изменилась.';if(s.seen){visual+=bar(s.an*s.factor,s.ad*s.factor,105,'→',max);captions.push('Верхняя полоса — до разрезания, нижняя — после.');}}
      if(op==='reduce'){answer=a;question='Запиши закрашенную часть несократимой дробью.';why='Делим числитель и знаменатель на один общий делитель: '+F(a)+'. Величина дроби сохраняется.';}
      if(op==='lcd'){answer=lcd;question='Каков наименьший общий знаменатель для этих двух дробей?';why='Нужно число, которое делится и на '+s.ad+', и на '+s.bd+': '+lcd+'.';}
      if(op==='compare'){answer=num(a)>num(b)?'>':num(a)<num(b)?'<':'=';question='Сравни A и B. Введи <, > или =.';why='Сравни закрашенные длины при одинаковой длине целого. С общим знаменателем '+lcd+' это '+s.an*lcd/s.ad+' и '+s.bn*lcd/s.bd+' равных долей.';}
      if(op==='add'||op==='subtract'){answer=combined;question='Чему равно '+F(a)+(op==='add'?' + ':' − ')+F(b)+'?';why='Сначала одинаковые доли: знаменатель '+lcd+'. Затем '+(op==='add'?'складываем':'вычитаем')+' их количества. Получается '+F(answer)+'.';if(s.seen){visual+=bar(answer.n,answer.d,190,'=',max);captions.push('Нижняя полоса — результат.');}}
      if(op==='multiply'){
        answer=M.mul(a,b);question='Чему равно '+F(a)+' · '+F(b)+'?';why='Ширина '+F(a)+', высота '+F(b)+'. Площадь пересечения '+F(answer)+'. Маленькая клетка — 1/'+(s.ad*s.bd)+' квадратной единицы.';
        const scale=160/Math.max(1,num(a),num(b)),w=Math.max(1,num(a))*scale,h=Math.max(1,num(b))*scale;
        visual=rect(80,20,w,h,'empty')+rect(80,20,num(a)*scale,h,'blue');if(s.seen)visual+=rect(80,20,num(a)*scale,num(b)*scale);
        for(let i=0;i<=Math.ceil(Math.max(1,num(a))*s.ad);i++)visual+=line(80+i*scale/s.ad,20,80+i*scale/s.ad,20+h);
        for(let i=0;i<=Math.ceil(Math.max(1,num(b))*s.bd);i++)visual+=line(80,20+i*scale/s.bd,80+w,20+i*scale/s.bd);
        visual+='<path d="M 90 20 V 30 H 80" class="v5q-right-angle"/>';
        captions=['Ширина '+F(a)+', высота '+F(b)+'.','Квадрат 1 × 1 — единица площади.'];
        diagramHeight=200;diagramKind='area';diagramBox='60 0 200 200';
      }
      if(op==='divide'){
        answer=M.div(a,b);question='Сколько порций B помещается в запасе A? Введи число или дробь.';why='Измеряем запас порцией: '+F(a)+' : '+F(b)+' = '+F(answer)+'. Неполная порция тоже считается долей порции.';
        if(s.seen){const scale=440/Math.max(1,num(a),num(b));visual=rect(90,40,num(a)*scale,50,'empty');for(let i=0;i<Math.ceil(num(answer));i++)visual+=rect(90+i*num(b)*scale,40,Math.max(0,Math.min(1,num(answer)-i)*num(b)*scale-2),50,i%2?'blue':'fill');captions=['Запас A = '+F(a)+'.','Одна порция B = '+F(b)+'.'];diagramHeight=130;}
      }
      visual=svg(visual,title,diagramHeight,diagramKind,diagramBox)+legend(captions);
    } else if(d.kind==='decimal') {
      const a=q(s.a,100),b=q(s.b,d.naturalSecond?1:100),op=d.op,second=d.naturalSecond?String(s.b):decimal(s.b);
      control('a','Первое число, в сотых',0,999);
      if(d.naturalSecond){const title=op==='multiply'?'Второй множитель — натуральное число':'Делитель — натуральное число';if(d.powerOfTen)controls.push({key:'b',title,values:[[10,'10'],[100,'100'],[1000,'1000']]});else control('b',title,1,12);}
      else if(!['place','round'].includes(op))control('b','Второе число, в сотых',op==='divide'?1:0,999);
      const names={place:'Разряды после запятой',compare:'Выравниваем одинаковые разряды',round:'К какой отметке ближе?',add:'Сотые складываются с сотыми',subtract:'Размен перед вычитанием',multiply:'Размер доли в произведении',divide:'Меняем обе единицы счёта',order:'Калькулятор и порядок действий'};
      title=d.naturalSecond?(d.powerOfTen?(op==='multiply'?'Умножаем на 10, 100, 1000':'Делим на 10, 100, 1000'):(op==='multiply'?'Несколько равных десятичных величин':'Делим десятичную величину поровну')):names[op];
      visual='<div class="v5q-table-scroll" role="region" tabindex="0" aria-label="Таблица разрядов"><table class="v5q-place-table"><caption>'+(d.naturalSecond?'Десятичная величина по разрядам':'Одинаковые разряды в одном столбце')+'</caption><thead><tr><th>Число</th><th>Еди&shy;ницы</th><th>Деся&shy;тые</th><th>Со&shy;тые</th></tr></thead><tbody>'+[s.a,...(['place','round'].includes(op)||d.naturalSecond?[]:[s.b])].map(n=>'<tr><th>'+decimal(n)+'</th><td>'+Math.floor(n/100)+'</td><td>'+Math.floor(n/10)%10+'</td><td>'+n%10+'</td></tr>').join('')+'</tbody></table></div>';
      if(op==='place'){answer=a;question='Запиши '+s.a+' сотых десятичной дробью.';why=s.a+' / 100 = '+decimal(s.a)+'. Нуль сохраняет пустой разряд.';}
      if(op==='compare'){answer=s.a>s.b?'>':s.a<s.b?'<':'=';question='Сравни '+decimal(s.a)+' и '+decimal(s.b)+'. Введи <, > или =.';why='Сравнивай слева направо: единицы, десятые, сотые. Дописанный справа нуль величину не меняет.';}
      if(op==='round'){
        control('places','Сохраняемых знаков после запятой',0,1);const size=s.places?10:100,low=Math.floor(s.a/size)*size,high=low+size;
        answer=q(Math.floor(s.a/size+0.5)*size,100);question='Округли '+decimal(s.a)+' до '+(s.places?'десятых.':'единиц.');why='До нижней отметки '+decimal(s.a-low)+', до верхней '+decimal(high-s.a)+'. Ровно посередине выбираем верхнюю.';
        visual+=svg(line(60,100,500,100)+line(60,90,60,110)+line(500,90,500,110)+label(60,145,decimal(low),'middle')+label(500,145,decimal(high),'middle')+'<circle cx="'+(60+(s.a-low)/size*440)+'" cy="100" r="8" class="v5q-fill"/>'+label(280,60,decimal(s.a),'middle'),'Число между соседними отметками',175,'rounding');
      }
      if(['add','subtract','multiply','divide'].includes(op)){
        answer=op==='add'?M.add(a,b):op==='subtract'?M.sub(a,b):op==='multiply'?M.mul(a,b):M.div(a,b);
        const symbol={add:'+',subtract:'−',multiply:'·',divide:':'}[op];question='Вычисли '+decimal(s.a)+' '+symbol+' '+second+'.';
        why=op==='add'||op==='subtract'?'Работаем с сотыми: '+s.a+' '+symbol+' '+s.b+' = '+(op==='add'?s.a+s.b:s.a-s.b)+'. Возвращаемся к прежней единице: '+F(answer)+'.':op==='multiply'?'Сотая от сотой — одна десятитысячная: '+s.a+' · '+s.b+' / 10 000 = '+F(answer)+'.':'Делимое и делитель увеличиваем одинаково. '+s.a+' : '+s.b+' = '+F(answer)+'. Частное сохранилось.';
        if(d.naturalSecond){
          let denominator=answer.d;for(const factor of [2,5])while(denominator%factor===0)denominator/=factor;
          const result=denominator===1?String(num(answer)).replace('.',','):F(answer);
          why=op==='multiply'?'Берём '+s.a+' сотых '+s.b+' раз: '+s.a+' · '+s.b+' = '+s.a*s.b+' сотых, то есть '+result+'.':'Делим '+s.a+' сотых на '+s.b+' равных групп: '+F(M.div(s.a,s.b))+' сотых в каждой, то есть '+result+'.';
          if(d.powerOfTen){why+=' Каждый раз, когда '+(op==='multiply'?'умножаем':'делим')+' на 10, цифры переходят на один разряд в '+(op==='multiply'?'большую':'меньшую')+' сторону. Для 100 таких переходов два, для 1000 — три. Если нужного разряда нет в записи, дописываем нуль.';visual+='<div class="v5q-equality">'+decimal(s.a)+' '+symbol+' '+second+' = '+(s.seen?result:'?')+'</div>';}
          else {let drawing='';for(let i=0;i<s.b;i++)drawing+=rect(60+i*440/s.b,50,440/s.b-2,50,i%2?'blue':'fill');const captions=[op==='multiply'?'В каждой группе '+decimal(s.a)+'.':'Всего '+decimal(s.a)+'.','Равных групп: '+s.b+'.'];if(s.seen)captions.push((op==='multiply'?'Всего ':'В каждой группе ')+result+'.');visual+=svg(drawing,op==='multiply'?'Несколько одинаковых величин':'Величина разделена поровну',100,'groups','40 25 480 100')+legend(captions);}
        }
        if(op==='divide'&&!d.naturalSecond){controls.push({key:'factor',title:'Увеличить оба числа',values:[[1,'× 1'],[10,'× 10'],[100,'× 100']]});visual+='<div class="v5q-equality">'+decimal(s.a)+' : '+second+' = '+decimal(s.a*s.factor)+' : '+decimal(s.b*s.factor)+'</div>';}
        if(op==='multiply'&&!d.naturalSecond){const scale=150/Math.max(1,num(a),num(b));visual+=svg(rect(60,20,Math.max(1,num(a))*scale,Math.max(1,num(b))*scale,'empty')+rect(60,20,num(a)*scale,num(b)*scale)+'<path d="M 70 20 V 30 H 60" class="v5q-right-angle"/>','Площадь произведения',190,'area','40 0 190 190')+legend(['Ширина '+decimal(s.a)+', высота '+second+'.','Квадрат 1 × 1 — единица площади.']);}
      }
      if(op==='order'){answer=M.add(a,M.mul(b,3));question='Вычисли '+decimal(s.a)+' + '+decimal(s.b)+' · 3.';why='Сначала умножение, затем сложение: '+decimal(s.b)+' · 3 = '+F(M.mul(b,3))+'; результат '+F(answer)+'.';}
    } else if(d.kind==='angle') {
      title='Построй угол на транспортире';control('angle','Поверни второй луч, градусов',0,180);control('target','Заданный угол, градусов',10,170,5);
      let drawing=line(280,220,490,220);for(let i=0;i<=180;i+=10){const r=i*Math.PI/180;drawing+=line(280+165*Math.cos(r),220-165*Math.sin(r),280+175*Math.cos(r),220-175*Math.sin(r));if(i%30===0)drawing+=label(280+197*Math.cos(r),(i===0||i===180?260:233-197*Math.sin(r)),i,'middle');}
      const r=s.angle*Math.PI/180,bx=280+120*Math.cos(r),by=220-120*Math.sin(r);drawing+=line(280,220,280+185*Math.cos(r),220-185*Math.sin(r));
      if(s.angle===90)drawing+='<path d="M 280 202 H 298 V 220" class="v5q-right-angle"/>';
      drawing+='<circle cx="280" cy="220" r="4" class="v5q-fill"/><circle cx="430" cy="220" r="3" class="v5q-fill"/><circle cx="'+bx+'" cy="'+by+'" r="3" class="v5q-fill"/>';
      drawing+=label(257,266,'O','middle')+label(430,266,'A','middle')+label(bx-24*Math.sin(r),by-24*Math.cos(r),'B','middle');
      visual=svg(drawing,'Угол AOB. Ноль шкалы справа',312,'angle','0 -20 560 312')+legend(['O — вершина. Отсчёт начинаем от нуля справа, на стороне OA.']);answer=s.target;question='Поверни луч до '+s.target+'°. Затем запиши величину построенного угла.';why='Отсчёт начинается от нуля на стороне OA. Угол задаёт поворот, а длины лучей на него не влияют.';
    } else if(d.kind==='circle') {
      title='Граница, область и объём';control('radius','Радиус, см',1,10);controls.push({key:'shape',title:'Исследуем объект',values:[['boundary','Окружность'],['circle','Круг'],['sphere','Шар'],['cylinder','Цилиндр']]});
      const radius=s.radius*10;
      let drawing=s.shape==='cylinder'?'<ellipse cx="200" cy="60" rx="'+radius+'" ry="25" class="v5q-empty"/>'+line(200-radius,60,200-radius,180)+line(200+radius,60,200+radius,180)+'<ellipse cx="200" cy="180" rx="'+radius+'" ry="25" class="v5q-empty"/>':'<circle cx="200" cy="120" r="'+radius+'" class="v5q-'+(s.shape==='boundary'?'empty':'fill')+'"/>';
      if(s.shape==='sphere')drawing+='<ellipse cx="200" cy="120" rx="'+radius+'" ry="'+radius/3+'" class="v5q-empty"/>';
      drawing+=line(200-radius,120,200+radius,120);
      visual=svg(drawing,'Выбранная фигура и её диаметр',245,'circle','80 0 240 245')+legend(['Радиус '+s.radius+' см.','Отрезок через центр — диаметр. Найди его длину.']);answer=2*s.radius;question='Каков диаметр при радиусе '+s.radius+' см? Введи число сантиметров.';why='Диаметр проходит через центр и содержит два радиуса: '+s.radius+' + '+s.radius+' = '+2*s.radius+' см. Окружность — граница круга; шар и цилиндр — объёмные тела.';
    } else if(d.kind==='percent') {
      title='Процент — сотая часть целого';control('total','Величина целого',20,200);control('percent','Процентов',5,100,5);answer=M.div(M.mul(s.total,s.percent),100);
      question='Найди '+s.percent+'% от '+s.total+'.';why='Одна сотая: '+s.total+' : 100. Берём '+s.percent+' таких частей: '+F(answer)+'.';
      let drawing='';for(let i=0;i<100;i++)drawing+=rect(60+(i%10)*18,15+Math.floor(i/10)*18,17,17,i<s.percent?'fill':'empty');visual=svg(drawing,'Сто равных частей целого',210,'percent','40 0 220 210')+legend(['Все 100 клеток — это '+s.total+'.','Закрашено '+s.percent+' клеток из 100. Какую величину они обозначают?']);
    } else if(d.kind==='mean') {
      title='Раздели поровну, сохранив сумму';for(const k of ['a','b','c'])control(k,'Количество в группе '+k.toUpperCase(),0,12);answer=q(s.a+s.b+s.c,3);
      question='В трёх группах '+s.a+', '+s.b+' и '+s.c+'. Сколько в среднем в одной группе?';why='Сумма '+(s.a+s.b+s.c)+' распределяется поровну между тремя группами: '+F(answer)+'.';visual=svg(['a','b','c'].map((k,i)=>rect(80+i*150,180-s[k]*12,65,s[k]*12)+label(112.5+i*150,225,s[k],'middle')).join(''),'Три группы до выравнивания',255,'mean');
    }
    return {title,question,answer,why,visual,controls};
  }
  function mount(host,lesson,options={}) {
    const d=descriptor(lesson),M=root.WorkshopMath;
    let s=normalize(lesson,options.state||{}),alive=true;
    const publish=()=>{if(alive)options.onChange?.({...s});};
    if(d.kind==='lab'){
      const markRightAngle=()=>{
        const target=host.querySelector('svg');if(!target||target.querySelector('[data-v5-right-angle]'))return;
        const corner={area:[45,35,1],areaunits:[160,35,1],box:[70,240,-1],volume:[40,30,1],garden:[40,35,1],distribute:[40,45,1]}[d.key];
        const c=corner||(d.key==='rays'&&s.kind==='angle'&&s.angle===90?[180,220,-1]:null);if(!c)return;
        const path=root.document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M '+(c[0]+11)+' '+c[1]+' v '+(c[2]*11)+' H '+c[0]);path.setAttribute('class','v5q-right-angle');path.setAttribute('data-v5-right-angle','');target.append(path);
      };
      const variant={'project-room':'floor','volume-litres':'capacity'}[lesson.fullKey];
      const dispose=root.mountLab(host,d.key,{state:s,variant,onChange:value=>{s=normalize(lesson,value);markRightAngle();publish();}});markRightAngle();
      if(d.show==='perimeter'){host.querySelector('h3').textContent='Периметр — длина границы';host.querySelector('.g5-lab-question').textContent='Сложи длины четырёх сторон. Почему всю сумму двух разных сторон умножаем на два?';}
      return dispose;
    }
    const controls=(items)=>'<div class="v5q-model-controls">'+items.map(c=>'<label>'+esc(c.title)+(c.values?'<select data-v5-param="'+c.key+'">'+c.values.map(([v,t])=>'<option value="'+v+'"'+(v===s[c.key]?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select>':'<input type="number" inputmode="numeric" data-v5-param="'+c.key+'" min="'+c.min+'" max="'+c.max+'" step="'+c.step+'" value="'+s[c.key]+'">')+'</label>').join('')+'</div>';
    function draw() {
      if(!alive)return;
      if(d.kind==='arithmetic'){drawArithmetic();return;}
      const view=describe(lesson,s,M);
      host.innerHTML='<section class="v5q-model"><p class="eyebrow">Исследуй на отдельном примере</p><h2>'+view.title+'</h2>'+controls(view.controls)+'<div class="v5q-visual">'+view.visual+'</div><form data-v5-predict><label>'+mathHTML(view.question)+'<input data-v5-prediction autocomplete="off" value="'+esc(s.prediction)+'"'+(s.seen?' disabled':'')+'></label><button'+(s.seen?' disabled':'')+'>Проверить прогноз</button></form><p class="v5q-model-feedback" role="status">'+mathHTML(s.notice)+'</p>'+(s.seen?'<p class="v5q-model-why">'+mathHTML(view.why)+'</p>':'<button type="button" class="quiet" data-v5-reveal>Посмотреть объяснение</button>')+'<p class="tiny">Меняй числа и проверяй закономерность. Исследование помогает понять правило; самостоятельный результат проверяется на новой задаче.</p></section>';
      host.querySelectorAll('[data-v5-param]').forEach(input=>input.onchange=()=>{
        const key=input.dataset.v5Param,raw={...s,[key]:key==='shape'?input.value:Number(input.value),prediction:'',first:'',seen:false,notice:''};
        try{s=normalize(lesson,raw);publish();draw();host.querySelector('[data-v5-param="'+key+'"]').focus();}catch(_){s.notice='Проверь допустимый диапазон. Для вычитания первая величина должна быть не меньше второй.';publish();host.querySelector('[role=status]').textContent=s.notice;input.value=s[key];}
      });
      const input=host.querySelector('[data-v5-prediction]');input.oninput=()=>{if(s.seen)return;s.prediction=input.value.slice(0,400);publish();};
      host.querySelector('[data-v5-predict]').onsubmit=e=>{
        e.preventDefault();if(s.seen)return;const value=input.value.trim();
        if(!value){s.notice='Сначала запиши свой прогноз. Пустое поле не считается попыткой.';publish();host.querySelector('[role=status]').textContent=s.notice;return;}
        if((typeof view.answer==='number'||view.answer&&typeof view.answer==='object')&&!M.parse(value)){s.notice='Запись пока не распознана. Введи число или точную дробь: например, 0,5 или 1/2.';publish();host.querySelector('[role=status]').textContent=s.notice;return;}
        if(typeof view.answer==='string'&&!['<','>','='].includes(value)){s.notice='Для сравнения введи один знак: <, > или =.';publish();host.querySelector('[role=status]').textContent=s.notice;return;}
        if(d.kind==='angle'&&s.angle!==s.target){s.notice='Сначала поверни второй луч на '+s.target+'°. Сейчас он стоит на '+s.angle+'°.';publish();host.querySelector('[role=status]').textContent=s.notice;return;}
        s.prediction=value;s.first=value;s.seen=true;
        const correct=M.equal(value,view.answer)&&!(d.kind==='fraction'&&d.op==='reduce'&&!M.accepts(value,{answer:view.answer,answerFormat:'reduced-fraction'}));
        s.notice=correct?'Прогноз подтвердился. Объясни по рисунку, почему.':'Первый прогноз: '+value+'. Сравни его с моделью и объяснением. Затем измени числа и проверь ещё раз.';publish();draw();
      };
      const reveal=host.querySelector('[data-v5-reveal]');if(reveal)reveal.onclick=()=>{s.seen=true;s.notice='Объяснение открыто без прогноза. Попробуй новое сочетание чисел.';publish();draw();};
    }
    function drawArithmetic(){
      const task=root.ArithmeticPractice.generate(d.skill,s.level,s.seed),step=task.steps[s.step],names={add:'Сложение по разрядам',subtract:'Размен через нули',multiply:'Умножение в столбик',divide:'Деление уголком',remainder:'Полные группы и остаток'};
      host.innerHTML='<section class="v5q-model v5q-arithmetic"><p class="eyebrow">Собери запись своими руками</p><h2>'+names[d.skill]+'</h2><p class="v5q-example-prompt">'+esc(task.prompt)+'</p>'+root.ArithmeticPractice.renderModel(task,s)+'<div class="v5q-arithmetic-current">'+(step?'<form data-v5-predict><label>Шаг '+(s.step+1)+' из '+task.steps.length+'. '+esc(step.prompt)+'<input data-v5-prediction value="'+esc(s.draft)+'" inputmode="numeric" autocomplete="off"></label><button>Записать этот шаг</button></form><button class="quiet" type="button" data-v5-reveal>Подсказка к этому шагу</button>':'<p><strong>Запись собрана: '+esc(task.answer)+'</strong></p><p>Проверь результат обратным действием.</p>')+'<p role="status">'+esc(s.notice)+'</p></div><details'+(s.step?' open':'')+'><summary>Выполненные действия · '+s.step+'</summary><ol>'+task.steps.slice(0,s.step).map(t=>'<li>'+esc(t.explain)+'</li>').join('')+'</ol></details><button type="button" class="quiet" data-v5-another>Другой пример для исследования</button><p class="tiny">Это отдельный пример. Числа в основной задаче остаются на месте.</p></section>';
      if(step){const input=host.querySelector('[data-v5-prediction]');input.oninput=()=>{s.draft=input.value.slice(0,400);publish();};host.querySelector('form').onsubmit=e=>{e.preventDefault();if(!input.value.trim()){s.notice='Сначала запиши ответ к текущему шагу.';}else if(!root.CourseMath.equivalent(input.value,step.answer)){s.notice='Проверь именно этот шаг. '+step.hint;}else{s.step++;s.draft='';s.notice=step.explain;}publish();draw();host.querySelector('[data-v5-prediction]')?.focus();};host.querySelector('[data-v5-reveal]').onclick=()=>{s.helped=true;s.notice=step.hint;publish();host.querySelector('[role=status]').textContent=s.notice;};}
      host.querySelector('[data-v5-another]').onclick=()=>{s={...defaults(lesson),seed:(s.seed+1)%1000001};publish();draw();};
    }
    draw();return ()=>{alive=false;host.replaceChildren();};
  }
  root.Vilenkin5QualityModels={descriptor,defaults,normalize,describe,mount,fractionHTML};
})(typeof window!=='undefined'?window:globalThis);
