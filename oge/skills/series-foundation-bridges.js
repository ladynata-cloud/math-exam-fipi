(function () {
  "use strict";

  // Three ordinary practice families for specific remaining content gaps.
  // Deterministic data only; no DOM, network, or shared mutable generator state.
  function validSeed(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 999) {
      throw new RangeError("seed должен быть целым числом от 0 до 999.");
    }
    return seed;
  }
  function randomFor(seed, salt) {
    var state = ((validSeed(seed) + 1) ^ salt) >>> 0;
    function next() {
      state = (state + 0x6d2b79f5) >>> 0;
      var x = state;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
    function int(min, max) { return min + Math.floor(next() * (max - min + 1)); }
    return {int:int,pick:function(items){return items[int(0,items.length-1)];}};
  }
  function fmt(n) {
    if (Object.is(n,-0)) n=0;
    return String(Number(n.toPrecision(12))).replace(/-/g,"−").replace(".",",");
  }
  function operand(n) { return n < 0 ? "("+fmt(n)+")" : fmt(n); }
  function approximatelyEqual(a,b) { return Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)); }
  function diagnostics(answer,entries) {
    var result=[];
    entries.forEach(function(entry){
      if(Number.isFinite(entry.value)&&!approximatelyEqual(answer,entry.value)&&
        !result.some(function(other){return approximatelyEqual(other.value,entry.value);})) {
        result.push({value:entry.value,message:entry.message});
      }
    });
    return result;
  }
  function nonTrailingZero(rng,min,max) {
    var values=[];
    for(var i=min;i<=max;i++) if(i%10!==0) values.push(i);
    return rng.pick(values);
  }
  var families=[];
  function family(meta,generator) {
    var f=Object.assign({mode:"quick"},meta);
    f.generate=function(seed){
      seed=validSeed(seed);
      var t=generator(seed);
      t.id=f.id+"-v"+String(seed).padStart(3,"0");
      t.title=t.title||f.title;
      t.skillId=f.skillId;t.familyId=f.id;t.seed=seed;
      t.witness=t.type==="number"?{answer:String(t.answer)}:
        {selected:t.options.map(function(o,i){return o.correct?i:-1;}).filter(function(i){return i>=0;})};
      return t;
    };
    families.push(f);
  }

  family({
    id:"bridge-decimal-product",topicId:"n6",title:"Умножение десятичных дробей",
    skillId:"n6-decimal",goal:"Умножить два нецелых десятичных числа и проверить положение запятой."
  },function(seed){
    var rng=randomFor(seed,0x60627),mode=seed%5,a,b,pa,pb;
    if(mode===0) {
      pa=pb=1;a=nonTrailingZero(rng,11,99);b=nonTrailingZero(rng,11,99);
    } else if(mode===1) {
      pa=pb=1;a=rng.int(1,9);b=rng.int(1,9);
    } else if(mode===2) {
      pa=1;pb=2;a=nonTrailingZero(rng,11,99);b=nonTrailingZero(rng,11,99);
    } else if(mode===3) {
      pa=pb=2;a=nonTrailingZero(rng,101,899);b=nonTrailingZero(rng,11,199);
    } else {
      pa=1;pb=2;a=-nonTrailingZero(rng,1,99);b=nonTrailingZero(rng,11,299);
    }
    var left=a/Math.pow(10,pa),right=b/Math.pow(10,pb);
    var integerProduct=a*b,scale=Math.pow(10,pa+pb),answer=integerProduct/scale;
    return {
      type:"number",variant:["tenths-above-one","both-below-one","tenths-and-hundredths","two-hundredths","negative-factor"][mode],
      prompt:"Вычисли: "+operand(left)+" × "+operand(right)+".",answer:answer,
      math:{kind:"decimal-product",leftUnits:a,leftPlaces:pa,rightUnits:b,rightPlaces:pb},
      hint:"Сначала оцени знак и размер результата. Умножь числа без учёта запятых. В произведении отдели справа столько цифр, сколько их после запятой в обоих множителях вместе.",
      explanation:"Без десятичных запятых получаем "+operand(a)+" × "+operand(b)+" = "+fmt(integerProduct)+
        ". Число знаков после запятой: в первом множителе — "+pa+", во втором — "+pb+"; всего "+(pa+pb)+
        ". Делим целое произведение на "+scale+": ответ "+fmt(answer)+
        (mode===1?". Оба положительных множителя меньше 1, поэтому произведение меньше каждого из них.":
          mode===4?". У множителей разные знаки, поэтому произведение отрицательное.":"."),
      diagnostics:diagnostics(answer,[
        {value:answer*10,message:"Результат отличается в 10 раз. Пересчитай суммарное число знаков после запятой в двух множителях."},
        {value:answer/10,message:"Проверь положение запятой: в произведении учти десятичные разряды обоих множителей."},
        {value:left+right,message:"В условии требуется произведение. Сложение двух исходных чисел даёт другое действие."},
        {value:Math.abs(answer),message:"Проверь знак произведения: один из множителей отрицательный."}
      ])
    };
  });

  var allRadicands=[],fineRadicands=[],anchors=[0.125,0.375,0.625,0.875];
  for(var n=2;n<=120;n++) {
    var root=Math.sqrt(n),whole=Math.floor(root),fraction=root-whole;
    if(Number.isInteger(root)) continue;
    if(fraction>=0.08&&fraction<=0.92) allRadicands.push(n);
    if(anchors.some(function(anchor){return Math.abs(fraction-anchor)<=0.04;})) fineRadicands.push(n);
  }
  family({
    id:"bridge-root-point",topicId:"n7",title:"Корень и отмеченная точка",
    skillId:"n7-bounds",goal:"Оценить квадратный корень и выбрать соответствующую точку на числовой прямой."
  },function(seed){
    var rng=randomFor(seed,0x70727),fine=seed%2===1;
    var n=rng.pick(fine?fineRadicands:allRadicands),root=Math.sqrt(n),whole=Math.floor(root);
    var targetIndex=fine?anchors.reduce(function(best,anchor,i){
      return Math.abs(root-whole-anchor)<Math.abs(root-whole-anchors[best])?i:best;
    },0):Math.floor(seed/2)%4;
    var min=fine?whole:whole-targetIndex,max=fine?whole+1:min+4;
    var labels=["A","B","C","D"];
    var points=labels.map(function(label,i){
      return {x:i===targetIndex?root:fine?whole+anchors[i]:min+i+rng.pick([0.25,0.5,0.75]),label:label};
    });
    var lower=fine?whole+targetIndex/4:whole,upper=fine?lower+0.25:whole+1;
    return {
      type:"choice",variant:fine?"one-unit-scale":"integer-bounds",
      prompt:"На числовой прямой отмечены точки A, B, C и D. Какой точке соответствует число √"+n+"? Выбери одну точку.",
      options:labels.map(function(label,i){return {text:"Точка "+label,correct:i===targetIndex};}),
      visual:{kind:"numberlinePoints",min:min,max:max,tickStep:fine?0.25:1,points:points,
        ariaLabel:"Числовая прямая от "+fmt(min)+" до "+fmt(max)+"; четыре точки A, B, C, D слева направо. Требуется выбрать точку для квадратного корня."},
      math:{kind:"root-point",radicand:n,intervalLower:lower,intervalUpper:upper},
      hint:fine?"Сначала найди соседние целые числа для корня. Затем сравни подкоренное число с квадратами промежуточных отметок шкалы.":
        "Сравни подкоренное число с квадратами соседних целых чисел. Арифметический квадратный корень неотрицателен.",
      explanation:fmt(lower)+"² = "+fmt(lower*lower)+" < "+n+" < "+fmt(upper*upper)+" = "+fmt(upper)+
        "². Значит, "+fmt(lower)+" < √"+n+" < "+fmt(upper)+
        ". Из отмеченных точек в этом промежутке находится "+labels[targetIndex]+"."
    };
  });

  family({
    id:"bridge-algebraic-fraction",topicId:"n8",title:"Разность квадратов в дроби",
    skillId:"n8-difference-squares",goal:"Разложить разность квадратов, сократить ненулевой множитель и вычислить значение при допустимом x."
  },function(seed){
    var rng=randomFor(seed,0x80827),mode=seed%4,a=rng.int(2,15),x,m=1;
    if(mode===0) {
      var nonnegative=[];for(var i=0;i<=25;i++)if(i!==a)nonnegative.push(i);
      x=rng.pick(nonnegative);
    } else if(mode===1) {
      x=seed%5===1?-a:-rng.int(1,25);
    } else if(mode===2) {
      var quarters=[];for(var q=-39;q<=59;q++)if(q%4!==0)quarters.push(q);
      x=rng.pick(quarters)/4;
    } else {
      m=rng.pick([-3,-2,2,3,4]);var integers=[];
      for(var j=-15;j<=25;j++)if(j!==a)integers.push(j);
      x=rng.pick(integers);
    }
    var answer=m*(x+a),numerator="x² − "+(a*a);
    if(Object.is(answer,-0))answer=0;
    var expression=(m===1?"("+numerator+")":fmt(m)+"("+numerator+")")+"/(x − "+a+")";
    var simplified=(m===1?"x + "+a:fmt(m)+"(x + "+a+")");
    return {
      type:"number",variant:["nonnegative-integer","negative-integer","fractional-argument","common-factor"][mode],
      prompt:"Найди значение выражения "+expression+" при x = "+fmt(x)+". Исходное выражение определено при x ≠ "+a+".",
      answer:answer,math:{kind:"algebraic-fraction",a:a,multiplier:m,x:x,excluded:a},
      hint:"Разложи разность квадратов. Сокращать можно одинаковые множители числителя и знаменателя; сокращаемый множитель должен быть ненулевым.",
      explanation:"x² − "+(a*a)+" = (x − "+a+")(x + "+a+"). При x ≠ "+a+
        " множитель x − "+a+" ненулевой. После сокращения получается "+simplified+
        ". При x = "+fmt(x)+" значение равно "+(m===1?"":"("+fmt(m)+") × ")+"("+fmt(x)+" + "+a+") = "+fmt(answer)+
        ". Ограничение x ≠ "+a+" относится к исходной дроби и сохраняется после сокращения.",
      diagnostics:diagnostics(answer,[
        {value:m*(x-a),message:"После разложения разности квадратов остаются множители x − "+a+" и x + "+a+". Проверь, какой из них совпадает со знаменателем."},
        {value:x+a,message:"Проверь множитель перед скобкой в числителе: он сохраняется после сокращения."},
        {value:m*(x*x-a*a),message:"Это значение числителя. В исходном выражении остаётся деление на ненулевой знаменатель."},
        {value:x===0?NaN:m*(x*x-a*a)/x,message:"Знаменатель исходной дроби — разность x и указанного числа, а не просто x."}
      ])
    };
  });

  var bundle={families:families,routes:[]};
  if(typeof module!=="undefined"&&module.exports)module.exports=bundle;
  if(typeof window!=="undefined")(window.OGE_SERIES_PARTS ||= []).push(bundle);
}());
