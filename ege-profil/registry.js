/* =========================================================================
   РЕЕСТР КУРСА — общий для review.html и teacher.html.

   TRAINERS — тренажёры, которые ведут журнал ошибок (кнопка «Повторить»).
   NAMES    — человеческие имена типов: "TID|тип" -> { n, line }.
   CABINET  — что показывает кабинет учителя: TID, заголовок, адаптер
              прогресса из progress-adapters.js и ссылка на тренажёр.

   Ключ localStorage, TID и формат журнала ошибок здесь не меняются.
   ========================================================================= */
var RV = (function(){
  "use strict";
  var TRAINERS = {
    "probability-t45":  { file:"trainers/probability-t45.html",  title:"Вероятность",              review:true  },
    "applied-t910":     { file:"trainers/applied-t910.html",     title:"Формулы и текстовые",      review:true  },
    "functions-t1112":  { file:"trainers/functions-t1112.html",  title:"Графики и производная",    review:true  },
    "stereo-t14":       { file:"trainers/stereo-t14.html",       title:"Стереометрия",             review:true  },
    "numbers-t19":      { file:"trainers/numbers-t19.html",      title:"Числа и их свойства",      review:false },
    "parameters-t18":   { file:"trainers/parameters-t18.html",   title:"Параметры",                review:false },
    "derivative-t8":    { file:"trainers/derivative-t8.html",    title:"Производная по графику",   review:false },
    "righttri-t1":      { file:"trainers/pryamougolny-treugolnik-trenazher.html", title:"Прямоугольный треугольник", review:true },
    "ege-t2-yashchenko":{ file:"trainers/vectors-yashchenko-t2.html", title:"Векторы (Ященко)",       review:true },
    "ege-t1-yashchenko":{ file:"trainers/planimetry-yashchenko-t1.html", title:"Планиметрия (Ященко)",   review:true }
  };
  var NAMES = {
    "ege-t1-yashchenko|t1":  { n:"равнобедренный треугольник и биссектриса", line:1 },
    "ege-t1-yashchenko|t2":  { n:"биссектриса угла параллелограмма", line:1 },
    "ege-t1-yashchenko|t3":  { n:"биссектрисы двух углов параллелограмма", line:1 },
    "ege-t1-yashchenko|t4":  { n:"высота к боковой стороне и синус угла", line:1 },
    "ege-t1-yashchenko|t5":  { n:"углы вписанного четырёхугольника", line:1 },
    "ege-t1-yashchenko|t6":  { n:"угол между биссектрисами треугольника", line:1 },
    "ege-t1-yashchenko|t7":  { n:"средняя линия трапеции и диагональ", line:1 },
    "ege-t1-yashchenko|t8":  { n:"высота, биссектриса и медиана из прямого угла", line:1 },
    "ege-t1-yashchenko|t9":  { n:"четырёхугольник с вписанной окружностью", line:1 },
    "ege-t1-yashchenko|t10": { n:"площадь, сторона и высота", line:1 },
    "ege-t1-yashchenko|t11": { n:"углы, опирающиеся на одну дугу", line:1 },
    "ege-t1-yashchenko|t12": { n:"прямоугольный треугольник: катет по синусу", line:1 },
    "ege-t1-yashchenko|t13": { n:"угол между секущими и дуги", line:1 },
    "ege-t1-yashchenko|t14": { n:"хорда и вписанный угол", line:1 },
    "ege-t1-yashchenko|t15": { n:"площади: отсечённая трапеция", line:1 },
    "ege-t1-yashchenko|t16": { n:"трапеция: диагонали и средняя линия", line:1 },
    "ege-t1-yashchenko|t17": { n:"описанная трапеция и средняя линия", line:1 },
    "ege-t1-yashchenko|t18": { n:"ромб: площадь через диагонали", line:1 },
    "ege-t1-yashchenko|t19": { n:"дуги вписанного четырёхугольника", line:1 },
    "ege-t2-yashchenko|v1": { n:"длина линейной комбинации", line:2 },
    "ege-t2-yashchenko|v2": { n:"скалярное произведение по координатам", line:2 },
    "ege-t2-yashchenko|v3": { n:"косинус угла между векторами", line:2 },
    "ege-t2-yashchenko|v4": { n:"скалярное произведение с коэффициентами", line:2 },
    "ege-t2-yashchenko|v5": { n:"неизвестная координата вектора", line:2 },
    "ege-t2-yashchenko|v6": { n:"клетчатая бумага: скалярное произведение", line:2 },
    "ege-t2-yashchenko|v7": { n:"клетчатая бумага: длина и угол", line:2 },
    "righttri-t1|t1-ratio":          { n:"sin/cos/tg по двум сторонам", line:1 },
    "righttri-t1|t1-side":           { n:"сторона по отношению (уравнение)", line:1 },
    "righttri-t1|t2-sinFromSeg":     { n:"синус через высоту к гипотенузе", line:1 },
    "righttri-t1|t2-legFromSeg":     { n:"катет через отрезок гипотенузы", line:1 },
    "righttri-t1|t2-altFromSegs":    { n:"высота по отрезкам гипотенузы", line:1 },
    "righttri-t1|t2-hypFromLegSeg":  { n:"гипотенуза по катету и отрезку", line:1 },
    "righttri-t1|t2-tanFromAHtg":    { n:"отрезок гипотенузы через тангенс", line:1 },
    "righttri-t1|t2-altFromLegRatio":{ n:"высота через два катета", line:1 },
    "righttri-t1|t3-legHyp":         { n:"площадь по катету и гипотенузе", line:1 },
    "righttri-t1|t3-diff":           { n:"катеты через площадь (уравнение)", line:1 },
    "righttri-t1|t4-sum":            { n:"острые углы: сумма 90°", line:1 },
    "righttri-t1|t4-median":         { n:"угол с медианой из прямого угла", line:1 },
    "righttri-t1|t4-hdm":            { n:"угол между высотой, биссектрисой и медианой", line:1 },
    "righttri-t1|t4-findAcute":      { n:"угол треугольника по углу между чевианами", line:1 },
    "righttri-t1|t5-height30":       { n:"высота в треугольнике с углом 30°", line:1 },
    "righttri-t1|t5-seg30":          { n:"отрезки гипотенузы при угле 30°", line:1 },
    "probability-t45|balls":    { n:"шары в урне", line:4 },
    "probability-t45|coins":    { n:"броски монеты", line:4 },
    "probability-t45|dice":     { n:"две игральные кости", line:4 },
    "probability-t45|order":    { n:"жеребьёвка выступлений", line:4 },
    "probability-t45|tickets":  { n:"билеты на экзамене", line:4 },
    "probability-t45|warranty": { n:"гарантийный срок", line:4 },
    "probability-t45|atleast":  { n:"«хотя бы один»", line:5 },
    "probability-t45|exactone": { n:"ровно один из двух", line:5 },
    "probability-t45|binom":    { n:"ровно k из трёх бросков", line:5 },
    "probability-t45|control":  { n:"система контроля брака", line:5 },
    "probability-t45|factories":{ n:"две фабрики", line:5 },
    "probability-t45|first":    { n:"первое попадание", line:5 },
    "probability-t45|coffee":   { n:"два кофейных автомата", line:5 },
    "applied-t910|ball":    { n:"мяч, брошенный вверх", line:9 },
    "applied-t910|power":   { n:"мощность тока", line:9 },
    "applied-t910|decay":   { n:"период полураспада", line:9 },
    "applied-t910|horizon": { n:"расстояние до горизонта", line:9 },
    "applied-t910|current": { n:"сила тока в цепи", line:9 },
    "applied-t910|revenue": { n:"выручка и спрос", line:9 },
    "applied-t910|meet":    { n:"встречное движение", line:10 },
    "applied-t910|river":   { n:"движение по реке", line:10 },
    "applied-t910|work":    { n:"совместная работа", line:10 },
    "applied-t910|prod":    { n:"производительность", line:10 },
    "applied-t910|alloy":   { n:"смеси и растворы", line:10 },
    "functions-t1112|line":    { n:"прямая по графику", line:11 },
    "functions-t1112|hyp":     { n:"гипербола по графику", line:11 },
    "functions-t1112|parab":   { n:"парабола по графику", line:11 },
    "functions-t1112|exp":     { n:"показательная по графику", line:11 },
    "functions-t1112|log":     { n:"логарифм по графику", line:11 },
    "functions-t1112|sqrt":    { n:"корень по графику", line:11 },
    "functions-t1112|cubic":   { n:"кубическая на отрезке", line:12 },
    "functions-t1112|frac":    { n:"x + a/x на отрезке", line:12 },
    "functions-t1112|expmin":  { n:"точка минимума с eˣ", line:12 },
    "functions-t1112|logmax":  { n:"точка максимума с ln", line:12 },
    "functions-t1112|sqrtmin": { n:"наименьшее значение с √x", line:12 },
    "stereo-t14|apothem":  { n:"апофема пирамиды", line:14 },
    "stereo-t14|median":   { n:"высота равностороннего треугольника", line:14 },
    "stereo-t14|volume":   { n:"объём пирамиды", line:14 },
    "stereo-t14|distance": { n:"расстояние через 3V/S", line:14 },
    "stereo-t14|dihedral": { n:"косинус двугранного угла", line:14 },
    "numbers-t19|invariant": { n:"инвариант чётности на доске", line:19 },
    "numbers-t19|maxcount":  { n:"наибольшее число слагаемых", line:19 },
    "numbers-t19|maxelem":   { n:"наибольший элемент набора", line:19 },
    "numbers-t19|groups":    { n:"разбиение на равные группы", line:19 },
    "numbers-t19|consec":    { n:"сумма подряд идущих", line:19 },
    "numbers-t19|digits":    { n:"уравнение N − S(N)", line:19 },
    "parameters-t18|drill":  { n:"пересечения с горизонтальной прямой", line:18 },
    "derivative-t8|extrema":   { n:"число точек экстремума", line:8 },
    "derivative-t8|onemax":    { n:"точка максимума по графику", line:8 },
    "derivative-t8|intpoints": { n:"целые точки с условием на знак", line:8 },
    "derivative-t8|marked":    { n:"сравнение значений в точках", line:8 },
    "derivative-t8|tangent":   { n:"касательная и производная", line:8 },
    "derivative-t8|parallel":  { n:"касательные, параллельные прямой", line:8 },
    "derivative-t8|physics":   { n:"скорость и путь", line:8 },
    "derivative-t8|antider":   { n:"первообразная по графику", line:8 }
  };
  function split(key){
    var i = key.indexOf("|");
    return [key.slice(0, i), key.slice(i + 1)];
  }
  function items(mk, wantOpen){
    var res = [], k, e;
    for (k in (mk || {})){
      e = mk[k];
      if ((e.w || 0) <= 0) continue;
      var closed = (e.r || 0) >= 3;
      if (closed === !wantOpen){
        var p = split(k);
        res.push({ key:k, tid:p[0], type:p[1], w:e.w, r:e.r || 0,
                   last:e.lastWrong || e.last || 0 });
      }
    }
    res.sort(function(a, b){ return b.last - a.last; });
    return res;
  }
  function open(mk){ return items(mk, true); }
  function closed(mk){ return items(mk, false); }
  function nameOf(key){ return NAMES[key] || null; }

  /* Кабинет учителя. Здесь только те тренажёры, чей прогресс лежит внутри
     mathExamCourseProgress.v1 — именно они переносятся кодом прогресса.
     Тренажёры на своих ключах (stereo3.status, ep_progress_v1,
     trig-stp-trainer-v2, profile-ege-course-v1) в перенос не попадают. */
  var CABINET = [
    { tid:"ege-t1-planimetry-generator", adapter:"planimetry", title:"Планиметрия без промахов",       file:"trainers/planimetry-t1.html",                     line:1 },
    { tid:"righttri-t1",                 adapter:"righttri",   title:"Прямоугольный треугольник",      file:"trainers/pryamougolny-treugolnik-trenazher.html", line:1 },
    { tid:"ege-t1-yashchenko",           adapter:"plan1y",     title:"Планиметрия по Ященко-2026",     file:"trainers/planimetry-yashchenko-t1.html",          line:1 },
    { tid:"ege-t2-yashchenko",           adapter:"vec2y",      title:"Векторы по Ященко-2026",         file:"trainers/vectors-yashchenko-t2.html",             line:2 },
    { tid:"probability-t45",             adapter:"prob",       title:"Вероятность",                    file:"trainers/probability-t45.html",                   line:4 },
    { tid:"derivative-t8",               adapter:"derivative", title:"Производная по графику",         file:"trainers/derivative-t8.html",                     line:8 },
    { tid:"applied-t910",                adapter:"applied",    title:"Формулы и текстовые задачи",     file:"trainers/applied-t910.html",                      line:9 },
    { tid:"functions-t1112",             adapter:"funcs",      title:"Графики и наибольшее значение",  file:"trainers/functions-t1112.html",                   line:11 },
    { tid:"stereo-t14",                  adapter:"p14",        title:"Стереометрия с доказательством", file:"trainers/stereo-t14.html",                        line:14 },
    { tid:"financeNonstandardTrainer",   adapter:"finance",    title:"Финансовая математика",          file:"../trainers/finance-nonstandard-trainer.html",                           line:16 },
    { tid:"planimetry-t17",              adapter:"p17",        title:"Планиметрия с доказательством",  file:"trainers/planimetry-t17.html",                    line:17 },
    { tid:"parameters-t18",              adapter:"p18",        title:"Параметр на графике",            file:"trainers/parameters-t18.html",                    line:18 },
    { tid:"numbers-t19",                 adapter:"numbers",    title:"Числа и их свойства",            file:"trainers/numbers-t19.html",                       line:19 },
    { tid:"expert-t",                    adapter:"expert",     title:"Проверь как эксперт",            file:"trainers/expert.html",                            line:0 },
    { tid:"full-exam",                   adapter:"fullexam",   title:"Пробный экзамен",                file:"exam/full-exam.html",                             line:0 }
  ];

  /* Последняя активность тренажёра — самая свежая метка журнала этого TID.
     Журнала может не быть вовсе: тогда 0. */
  function lastActivity(mk, tid){
    var best = 0, k, e;
    for (k in (mk || {})){
      if (k.indexOf("|") < 0) continue;
      if (split(k)[0] !== tid) continue;
      e = mk[k] || {};
      best = Math.max(best, e.last || 0, e.lastWrong || 0);
    }
    return best;
  }

  /* Строки журнала одного тренажёра, свежие сверху: сначала открытые. */
  function journalOf(mk, tid){
    function mine(list){ return list.filter(function(it){ return it.tid === tid; }); }
    return { open: mine(open(mk)), closed: mine(closed(mk)) };
  }

  return { TRAINERS:TRAINERS, NAMES:NAMES, CABINET:CABINET, split:split,
           open:open, closed:closed, nameOf:nameOf,
           lastActivity:lastActivity, journalOf:journalOf };
})();
if (typeof module !== "undefined") module.exports = RV;
