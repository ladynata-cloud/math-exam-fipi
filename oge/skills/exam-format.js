(function () {
  "use strict";
  // Optional practice of answer notation after the mathematical task is solved.
  // This does not award another mathematical success or claim exam readiness.
  function specification(task, topicId) {
    topicId = task.topicId || topicId;
    if (task.learningMode === "creative") return null;
    if (task.type === "number") {
      var value = task.answer, plain = String(value);
      if (!Number.isFinite(value) || Math.abs(value)>Number.MAX_SAFE_INTEGER || !/^-?\d+(?:\.\d{1,8})?$/.test(plain)) return null;
      if (topicId === "n19") {
        if (!/^[1-9]+$/.test(plain)) return null;
        return {kind:"digits",expected:plain,order:"any",instruction:"Запиши номера верных утверждений подряд, без пробелов и запятых."};
      }
      if (topicId === "n7" || topicId === "n13" || topicId === "base") return null;
      return {kind:"number",expected:value,instruction:"Запиши целое число или конечную десятичную дробь. Для дробной части используй запятую; единицы измерения и знаки действий не нужны."};
    }
    if (((task.type === "choice" && ["n7","n13"].indexOf(topicId) >= 0) ||
         (["choice","multi"].indexOf(task.type)>=0&&topicId==="n19")) && task.options.length <= 9) {
      var selected=task.options.map(function(o,i){return o.correct?i+1:null;}).filter(Boolean);
      if(!selected.length||(topicId!=="n19"&&selected.length!==1))return null;
      return {kind:"digits",expected:selected.join(""),order:topicId==="n19"?"any":"fixed",length:topicId==="n19"?undefined:1,
        instruction:topicId==="n19"?"Запиши номера верных утверждений подряд, без пробелов и запятых.":"Запиши одну цифру — номер правильного ответа.",
        choices:task.options.map(function(o,i){return {number:i+1,text:o.text.replace(new RegExp("^"+(i+1)+"\\.\\s*"),"")};})};
    }
    if (task.type === "match" && topicId === "n11" && task.visual && task.visual.kind === "graphs") {
      var options=task.matchOptions||[];
      if(!options.length||options.length>9||new Set(options).size!==options.length)return null;
      var digits=task.pairs.map(function(p){return options.indexOf(p.right)+1;});
      if(digits.some(function(n){return n<1;}))return null;
      return {kind:"digits",expected:digits.join(""),order:"fixed",length:digits.length,
        instruction:"Запиши номера формул в порядке "+task.pairs.map(function(p){return p.left;}).join(", ")+", без пробелов и запятых.",
        choices:options.map(function(value,index){return {number:index+1,text:value};})};
    }
    return null;
  }
  function decimalKey(value){
    var text=String(value).replace(",","."),negative=text[0]==="-";
    if(negative)text=text.slice(1);
    var parts=text.split("."),whole=parts[0].replace(/^0+/,"")||"0",fraction=(parts[1]||"").replace(/0+$/,"");
    return (negative&&(whole!=="0"||fraction)?"-":"")+whole+(fraction?"."+fraction:"");
  }
  function rational(value){
    var text=String(value).replace(",","."),negative=text[0]==="-";
    if(text[0]==="-"||text[0]==="+")text=text.slice(1);
    var parts=text.split("."),fraction=parts[1]||"";
    return {n:BigInt(parts[0]+fraction)*(negative?-1n:1n),d:10n**BigInt(fraction.length)};
  }
  function writtenValueEquals(value,expected){
    // Only prove equality for exact decimal literals and a quotient of two
    // such literals. A floating-point evaluation is not evidence of equality.
    var decimal="[+-]?\\d+(?:[.,]\\d+)?",literal=new RegExp("^"+decimal+"$"),fraction=new RegExp("^("+decimal+")\\s*/\\s*("+decimal+")$");
    var target=rational(String(expected)),input;
    if(literal.test(value))input=rational(value);
    else {
      var match=value.match(fraction);if(!match)return null;
      var numerator=rational(match[1]),denominator=rational(match[2]);
      if(denominator.n===0n)return false;
      input={n:numerator.n*denominator.d,d:numerator.d*denominator.n};
    }
    return input.n*target.d===target.n*input.d;
  }
  function check(spec, raw, evaluate) {
    if(!spec)throw new Error("Для этой задачи отдельная проверка записи не задана.");
    var value=String(raw===undefined?"":raw).trim().replace(/−/g,"-");
    if(!value)return {ok:false,formatOk:false,mathOk:null,message:"Введите ответ в поле записи."};
    if(value.length>128)return {ok:false,formatOk:false,mathOk:null,message:"Запись слишком длинная. Введите только ответ."};
    if(spec.kind==="number"){
      var mathOk=writtenValueEquals(value,spec.expected);
      if(!/^-?\d+(?:,\d+)?$/.test(value))return {ok:false,formatOk:false,mathOk:mathOk,
        message:(mathOk?"Числовое значение верное. ":"")+spec.instruction};
      var answer=Number(value.replace(",","."));
      if(!Number.isFinite(answer))return {ok:false,formatOk:false,mathOk:false,message:"Число слишком велико. Проверьте запись."};
      var ok=decimalKey(value)===decimalKey(String(spec.expected));
      return {ok:ok,formatOk:true,mathOk:ok,message:ok?"Ответ записан верно.":"Форма записи подходит. Проверьте само числовое значение."};
    }
    if(!/^\d+$/.test(value))return {ok:false,formatOk:false,mathOk:null,message:spec.instruction};
    if(spec.length!==undefined&&value.length!==spec.length)return {ok:false,formatOk:false,mathOk:null,message:spec.instruction};
    var actual=spec.order==="any"?value.split("").sort().join(""):value;
    var expected=spec.order==="any"?spec.expected.split("").sort().join(""):spec.expected;
    var correct=actual===expected;
    return {ok:correct,formatOk:true,mathOk:correct,message:correct?"Последовательность цифр записана верно.":
      spec.order==="any"?"Запись без лишних символов. Проверьте номера верных утверждений.":"Запись без лишних символов. Проверьте номера и их порядок по условию."};
  }
  var api={specification:specification,check:check};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(typeof window!=="undefined")window.OGE_ANSWER_FORMAT=api;
}());
