(function () {
  "use strict";
  function evaluate(source, variables) {
    var s = String(source).replace(/[−–]/g, "-").replace(/,/g, ".").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
    if (!s || s.length > 256) throw new Error("Введите число или короткую запись вычисления.");
    var tokens = s.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|[()+*/^−-]/g) || [];
    if (tokens.join("") !== s) throw new Error("Используйте числа, дробь через / и обычные знаки действий.");
    var pos = 0, depth = 0, vars = Object.assign({pi: Math.PI}, variables || {});
    function finite(x) { if (!Number.isFinite(x)) throw new Error("Эта запись не даёт допустимого конечного числа."); return x; }
    function atom() {
      if (++depth > 50) throw new Error("Слишком сложная запись.");
      var t = tokens[pos++], v;
      if (t === "(") { v = add(); if (tokens[pos++] !== ")") throw new Error("Проверьте скобки."); }
      else if (t === "sqrt" || t === "abs") {
        if (tokens[pos++] !== "(") throw new Error("После функции нужны скобки.");
        v = add(); if (tokens[pos++] !== ")") throw new Error("Проверьте скобки.");
        v = t === "sqrt" ? Math.sqrt(v) : Math.abs(v);
      } else if (t !== undefined && /^(?:\d|\.)/.test(t)) {
        v=Number(t);
        if(v===0&&/[1-9]/.test(t.split(/[eE]/)[0]))throw new Error("Это число слишком мало для численной проверки. Выберите другое значение.");
      }
      else if (t !== undefined && Object.prototype.hasOwnProperty.call(vars, t) && typeof vars[t] === "number") v = vars[t];
      else throw new Error("Не удалось прочитать число или обозначение.");
      depth--; return finite(v);
    }
    function power() { var v = atom(); if (tokens[pos] === "^") { pos++; var base=v;v = Math.pow(v, unary());if(v===0&&base!==0)throw new Error("Результат степени слишком мал для численной проверки."); } return finite(v); }
    function unary() { if (tokens[pos] === "+") { pos++; return unary(); } if (tokens[pos] === "-") { pos++; return -unary(); } return power(); }
    function mul() { var v = unary(); while (tokens[pos] === "*" || tokens[pos] === "/") { var op = tokens[pos++], r = unary(); if (op === "/" && r === 0) throw new Error("На ноль делить нельзя."); var before=v;v = op === "*" ? v * r : v / r;if(v===0&&before!==0&&r!==0)throw new Error("Результат слишком мал для численной проверки."); } return finite(v); }
    function add() { var v = mul(); while (tokens[pos] === "+" || tokens[pos] === "-") { var op = tokens[pos++], r = mul(); v = op === "+" ? v + r : v - r; } return finite(v); }
    var result = add(); if (pos !== tokens.length) throw new Error("Проверьте запись действия."); return finite(result);
  }
  function close(a, b) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b)); }
  function relativeClose(a,b){return a===b || Math.abs(a-b)<=32*Number.EPSILON*Math.max(Math.abs(a),Math.abs(b),Number.MIN_VALUE);}
  function gcd(a,b) { a=Math.abs(a); b=Math.abs(b); while(b){var t=a%b;a=b;b=t;} return a; }
  function fmt(x) { if (!Number.isFinite(x)) return "—"; return String(Number(x.toPrecision(10))).replace(/-/g, "−").replace(".", ","); }
  function compare(a, op, b) {
    if(op==="eq") return close(a,b);
    if(op==="lt") return a<b && !relativeClose(a,b);
    if(op==="gt") return a>b && !relativeClose(a,b);
    if(op==="lte") return a<b || relativeClose(a,b);
    if(op==="gte") return a>b || relativeClose(a,b);
    throw new Error("Неизвестное условие задания.");
  }
  function buildValues(t,input){
    var values=Object.assign({},t.constants||{});
    (t.fields||[]).forEach(function(f){
      var value=evaluate((input.values||{})[f.name]);
      if((f.min!==undefined&&value<f.min&&!relativeClose(value,f.min))||(f.max!==undefined&&value>f.max&&!relativeClose(value,f.max)))throw new Error("Значение «"+f.label+"» должно быть в указанном диапазоне.");
      if(f.integer&&!Number.isInteger(value))throw new Error("Здесь нужно целое число.");
      if(f.step!==undefined&&f.step>0){var steps=(value-(f.min||0))/f.step;if(!close(steps,Math.round(steps)))throw new Error("Для «"+f.label+"» используйте шаг "+fmt(f.step)+".");}
      values[f.name]=value;
    });
    return values;
  }
  function checkTask(t, input) {
    input = input || {};
    var x, n, p, vars, detail;
    if(t.type==="experiment"){
      var probes=Array.isArray(input.probes)?Array.from(new Set(input.probes)):[];
      if(probes.some(function(v){return t.probeValues.indexOf(v)<0;}))throw new Error("Выберите значение x из предложенных.");
      if(!probes.length)throw new Error("Сначала выберите значение x и получите значение функции.");
      var secret=t.models.find(function(m){return m.id===t.secretModelId;});
      if(!secret)throw new Error("В задании не указана функция для проверки.");
      var distinguished=t.models.every(function(m){return m.id===secret.id||probes.some(function(v){
        var variables={};variables[t.variable||"x"]=v;
        return !close(evaluate(m.expression,variables),evaluate(secret.expression,variables));
      });});
      if(t.requireDistinguishingProbe&&!distinguished)throw new Error("При выбранных значениях x обе формулы дают одинаковый результат. Выберите другое значение x.");
      if(!t.models.some(function(m){return m.id===input.modelId;}))throw new Error("Выберите формулу, которая соответствует полученным значениям.");
      return {ok:input.modelId===secret.id};
    }
    if (["number","numberline","tiltArea"].indexOf(t.type)>=0) {
      x=evaluate(input.answer);
      var expected=t.type==="tiltArea"?t.base*t.height:t.answer;
      return {ok:close(x,expected)};
    }
    if(t.type==="choice" || t.type==="multi"){
      var chosen=(input.selected||[]).slice().sort(function(a,b){return a-b;});
      if(!chosen.length) throw new Error("Выберите ответ.");
      var wanted=t.options.map(function(o,i){return o.correct?i:-1;}).filter(function(i){return i>=0;});
      return {ok:JSON.stringify(chosen)===JSON.stringify(wanted)};
    }
    if(t.type==="order") return {ok:JSON.stringify(input.order)===JSON.stringify(t.answer)};
    if(t.type==="match"){
      if(t.pairs.some(function(_,i){return input.matches[i]===undefined || input.matches[i]==="";})) throw new Error("Подберите пару к каждой строке.");
      return {ok:t.pairs.every(function(pair,i){return String(input.matches[i])===pair.right;})};
    }
    if(t.type==="build"){
      vars=buildValues(t,input);
      detail=t.conditions.map(function(c){var l=evaluate(c.left,vars),r=evaluate(c.right,vars);return {left:l,right:r,op:c.op,ok:compare(l,c.op,r)};});
      return {ok:detail.every(function(c){return c.ok;}),details:detail};
    }
    if(t.type==="counterexample"){
      x=evaluate(input.answer); vars=Object.assign({},t.constants||{});vars[t.field||"x"]=x;
      if(t.domain && t.domain.min!==undefined && x<t.domain.min) throw new Error("Проверьте допустимые значения.");
      if(t.domain && t.domain.max!==undefined && x>t.domain.max) throw new Error("Проверьте допустимые значения.");
      var certified=Array.isArray(t.counterexampleWhen)&&t.counterexampleWhen.length>0,criterion;
      if(certified)criterion=t.counterexampleWhen.every(function(c){
        var left=evaluate(c.left,vars),right=evaluate(c.right,vars);
        return c.op==="lt"?left<right:c.op==="gt"?left>right:c.op==="lte"?left<=right:c.op==="gte"?left>=right:left===right;
      });
      var l,r;
      try{l=evaluate(t.comparisonLeft||t.left,vars);r=evaluate(t.comparisonRight||t.right,vars);}
      catch(error){if(!certified)throw error;}
      return {ok:certified?criterion:!relativeClose(l,r),certified:certified,
        details:Number.isFinite(l)&&Number.isFinite(r)?[{left:l,right:r}]:null,counterexample:x};
    }
    if(t.type==="battle") {
      if(!input.sign)throw new Error("Сначала выберите предполагаемый знак результата.");
      x=evaluate(input.answer);
      var wantedSign=t.a+t.b<0?"−":t.a+t.b>0?"+":"0",signOK=input.sign===wantedSign;
      return {ok:close(x,t.a+t.b)&&signOK,signMismatch:!signOK,sumOK:close(x,t.a+t.b)};
    }
    if(t.type==="graph") return {ok:close(Number(input.k),t.k)&&close(Number(input.b),t.b)};
    if(t.type==="fraction"){
      n=Number(input.partition);
      if(!Number.isSafeInteger(n)||n<=0||n%t.denominatorA!==0||n%t.denominatorB!==0) throw new Error("Выберите положительное целое число одинаковых долей, подходящее для обеих дробей.");
      x=evaluate(input.answer);
      return {ok:close(x/n,t.numeratorA/t.denominatorA+t.numeratorB/t.denominatorB)};
    }
    if(t.type==="probability"){
      n=(input.red||[]).length;
      return {ok:n*t.denominator===t.total*t.numerator};
    }
    if(t.type==="triangleGate"){
      x=evaluate(input.answer);
      return {ok:x>Math.abs(t.sideA-t.sideB) && x<t.sideA+t.sideB};
    }
    throw new Error("Этот вид задания пока не поддерживается.");
  }
  var api={evaluate:evaluate,close:close,checkTask:checkTask,compare:compare,fmt:fmt};
  if(typeof module!=="undefined" && module.exports) module.exports=api;
  if(typeof document==="undefined") return;
  var root=document.getElementById("mathexam-skill-lab");
  if(!root || !window.OGE_DATA) return;
  var data=window.OGE_DATA, topics=data.topics, progress={}, storageAvailable=true;
  var answerFormat=window.OGE_ANSWER_FORMAT;
  try{progress=JSON.parse(localStorage.getItem("mathexam.skillLab.v1")||"{}");if(!progress||typeof progress!=="object"||Array.isArray(progress))progress={};}catch(_){progress={};storageAvailable=false;}
  var series=window.OGE_SERIES || {families:[],routes:[],familyIndex:{},routeIndex:{},taskIndex:{}};
  var state={topic:"n11",mode:"quick",indices:{},creativeIndices:{},map:false,skill:null,taskStates:{},feedback:null,teacher:false,runs:{},activeRun:null,seedCounter:0,backStack:[],reviews:{},seriesPicker:false};
  var renderedView=null;
  if(!topics.some(function(t){return t.id===state.topic;})) state.topic=topics[0].id;
  function owns(index,key){return !!index&&Object.prototype.hasOwnProperty.call(index,key);}
  function routeEntry(id){
    if(typeof id!=="string")return null;
    if(owns(series.routeIndex,id))return {id:id,kind:"route",target:id,topicId:series.routeIndex[id].topicId};
    var target=id.slice(7);
    if(id.indexOf("family:")===0&&owns(series.familyIndex,target))return {id:id,kind:"family",target:target,topicId:series.familyIndex[target].topicId};
    target=id.slice(5);
    if(id.indexOf("task:")===0&&owns(series.taskIndex,target))return {id:id,kind:"task",target:target,topicId:series.taskIndex[target].topicId};
    return null;
  }
  function applyLocation(){
    var params;
    try{params=new URL(window.location.href).searchParams;}catch(_){return;}
    var selected=topics.find(function(t){return t.id===params.get("topic");});
    var entry=routeEntry(params.get("route")),mode=params.get("mode"),map=params.get("map");
    var validMode=mode==="quick"||mode==="creative";
    if(entry){
      var sameRun=state.activeRun===entry.id;
      if(owns(state.runs,entry.id)){
        if(!sameRun)rememberContext();
        state.activeRun=entry.id;state.topic=entry.topicId;
      }else if(entry.kind==="route")openRoute(entry.target,false);
      else if(entry.kind==="family")openVariant(entry.target);
      else openTask(entry.target);
      state.map=false;if(!sameRun)state.skill=null;state.seriesPicker=false;state.feedback=null;
    }else if(selected||validMode){
      if(selected&&selected.id!==state.topic)state.skill=null;
      if(selected)state.topic=selected.id;
      state.mode=validMode?mode:"quick";state.activeRun=null;state.map=false;state.seriesPicker=false;state.feedback=null;
    }
    if(map==="1"||map==="0")state.map=map==="1";
  }
  function syncLocation(){
    try{
      var url=new URL(window.location.href),params=new URLSearchParams();
      if(url.protocol!=="https:"&&url.protocol!=="http:")return;
      params.set("topic",state.topic);
      if(routeEntry(state.activeRun))params.set("route",state.activeRun);
      else if(state.mode==="creative")params.set("mode","creative");
      if(state.map)params.set("map","1");
      url.search=params.toString();url.hash="";
      if(url.href!==window.location.href)window.history.replaceState(window.history.state,"",url.href);
    }catch(_){}
  }
  function trainerHref(){
    var href=topic().sourceHref;
    return typeof href==="string"&&/^\/trainers\/[a-z0-9/_-]+(?:\.html)?$/i.test(href)?href:"/trainers/oge-course/";
  }
  function updateNavigation(){
    var link=document.querySelector('[data-skill-link="trainer"]');
    if(link)link.setAttribute("href",trainerHref());
    syncLocation();
  }
  function esc(s){return String(s===undefined?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function topic(){return topics.find(function(t){return t.id===state.topic;});}
  function overview(top){
    return Array.isArray(top.overviewTaskIds)?top.overviewTaskIds.map(function(id){return top.quick.find(function(t){return t.id===id;});}).filter(Boolean):top.quick;
  }
  function run(){return state.activeRun?state.runs[state.activeRun]:null;}
  function list(){return run()?series.materialize(run()):(state.mode==="quick"?overview(topic()):(topic()[state.mode]||[]));}
  function index(){return run()?run().cursor:(state.mode==="quick"?(state.indices[state.topic]||0):(state.creativeIndices[state.topic]||0));}
  function task(){return list()[index()];}
  function setIndex(n){if(run())run().cursor=n;else if(state.mode==="quick")state.indices[state.topic]=n;else state.creativeIndices[state.topic]=n;}
  function ts(t){
    var prior=state.taskStates[t.id],presentationId=t.presentationId||null;
    if(!prior||prior.presentationId!==presentationId) state.taskStates[t.id]={answer:"",selected:[],matches:{},order:(t.items||[]).slice(),values:Object.fromEntries((t.fields||[]).map(function(f){return [f.name,f.initial===undefined?"":String(f.initial)];})),k:t.k===0?1:0,b:0,red:[],cancel:0,sign:null,partition:0,skew:0,hint:false,revealed:false,helpUsed:!!((prior&&prior.helpUsed)||(progress[t.id]&&(progress[t.id].guided||progress[t.id].hints||progress[t.id].solutions))),successFingerprint:null,presentationId:presentationId};
    if(progress[t.id]&&(progress[t.id].guided||progress[t.id].hints||progress[t.id].solutions))state.taskStates[t.id].helpUsed=true;
    if(!Array.isArray(state.taskStates[t.id].probes))state.taskStates[t.id].probes=[];
    return state.taskStates[t.id];
  }
  function save(){try{localStorage.setItem("mathexam.skillLab.v1",JSON.stringify(progress));}catch(_){storageAvailable=false;}}
  function saveSession(){
    try{localStorage.setItem("mathexam.skillLab.session.v2",JSON.stringify({
      topic:state.topic,mode:state.mode,indices:state.indices,creativeIndices:state.creativeIndices,
      map:state.map,skill:state.skill,taskStates:state.taskStates,runs:state.runs,
      activeRun:state.activeRun,seedCounter:state.seedCounter,backStack:state.backStack,reviews:state.reviews
    }));}catch(_){storageAvailable=false;}
  }
  function restoreSession(){
    try{
      var saved=JSON.parse(localStorage.getItem("mathexam.skillLab.session.v2")||"null");
      if(!saved||typeof saved!=="object")return;
      if(topics.some(function(t){return t.id===saved.topic;}))state.topic=saved.topic;
      if(saved.mode==="quick"||saved.mode==="creative")state.mode=saved.mode;
      ["indices","creativeIndices","taskStates","reviews"].forEach(function(key){
        if(saved[key]&&typeof saved[key]==="object"&&!Array.isArray(saved[key]))state[key]=saved[key];
      });
      state.seedCounter=Number.isInteger(saved.seedCounter)?((saved.seedCounter%1000)+1000)%1000:0;
      state.map=saved.map===true;state.skill=typeof saved.skill==="string"?saved.skill:null;
      if(Array.isArray(saved.backStack))state.backStack=saved.backStack.slice(-8).filter(function(c){
        return c&&topics.some(function(t){return t.id===c.topic;})&&(c.mode==="quick"||c.mode==="creative");
      });
      if(saved.runs&&typeof saved.runs==="object")Object.keys(saved.runs).forEach(function(key){
        try{
          var candidate=saved.runs[key];series.materialize(candidate);
          if(!topics.some(function(t){return t.id===candidate.topicId;}))return;
          candidate.cursor=Math.max(0,Math.min(candidate.refs.length,Math.trunc(Number(candidate.cursor)||0)));
          candidate.skipped=Array.isArray(candidate.skipped)?candidate.skipped:[];
          state.runs[key]=candidate;
        }catch(_){}
      });
      if(typeof saved.activeRun==="string"&&state.runs[saved.activeRun]){
        state.activeRun=saved.activeRun;state.topic=run().topicId;
      }
      topics.forEach(function(t){
        state.indices[t.id]=Math.max(0,Math.min(overview(t).length,Math.trunc(Number(state.indices[t.id])||0)));
        state.creativeIndices[t.id]=Math.max(0,Math.min(t.creative.length-1,Math.trunc(Number(state.creativeIndices[t.id])||0)));
      });
    }catch(_){storageAvailable=false;}
  }
  function nextSeed(){state.seedCounter=(state.seedCounter+71)%1000;return state.seedCounter;}
  function seenTasks(){return Object.keys(progress).concat(Object.keys(state.taskStates));}
  function rememberContext(){
    state.backStack.push({topic:state.topic,mode:state.mode,activeRun:state.activeRun,map:state.map,skill:state.skill});
    if(state.backStack.length>8)state.backStack.shift();
  }
  function returnContext(){
    var previous=state.backStack.pop();
    if(previous){
      state.topic=previous.topic;state.mode=previous.mode;state.map=previous.map;state.skill=previous.skill;
      state.activeRun=previous.activeRun&&state.runs[previous.activeRun]?previous.activeRun:null;
    }else{state.activeRun=null;state.mode="quick";state.map=false;}
    state.feedback=null;
  }
  function openRoute(id,fresh){
    if(!owns(series.routeIndex,id))return;
    if(!state.runs[id]||fresh)state.runs[id]=series.start(id,nextSeed(),seenTasks());
    if(state.activeRun!==id)rememberContext();
    state.activeRun=id;state.topic=run().topicId;state.map=false;state.skill=null;state.seriesPicker=false;
  }
  function openTask(id){
    if(!owns(series.taskIndex,id))return;
    var key="task:"+id;
    if(state.activeRun!==key)rememberContext();
    state.runs[key]=series.singleTask(id,seenTasks());
    state.activeRun=key;state.topic=run().topicId;state.map=false;state.skill=null;state.seriesPicker=false;
  }
  function variantFamily(t){
    if(!t)return null;
    if(t.familyId)return series.familyIndex[t.familyId]||null;
    var available=series.families.filter(function(f){return f.skillId===t.skillId&&f.topicId===state.topic;});
    return available.find(function(f){return f.mode==="quick";})||available[0]||null;
  }
  function openVariant(familyId,review){
    if(!owns(series.familyIndex,familyId))return;
    var current=task(),key="family:"+familyId;
    if(state.activeRun!==key)rememberContext();
    state.runs[key]=series.single(familyId,nextSeed(),seenTasks().concat(current?[current.id]:[]));
    if(review)state.runs[key].reviewContext=Object.assign({},review);
    state.activeRun=key;state.topic=run().topicId;state.map=false;state.skill=null;state.seriesPicker=false;
  }
  function queueReview(t){
    var family=variantFamily(t);if(!family)return;
    var now=Date.now();
    state.reviews[family.id]=Object.assign({},state.reviews[family.id]||{},{familyId:family.id,skillId:family.skillId,anchorTaskId:t.id,scheduledAt:now,dueAt:now+24*60*60*1000,pending:true,completedCount:((state.reviews[family.id]||{}).completedCount||0)});
    saveSession();
  }
  function pauseAfterHelp(t){
    var now=Date.now();
    Object.keys(state.reviews).forEach(function(key){
      var item=state.reviews[key];
      if(!item.pending || item.skillId!==t.skillId)return;
      item.anchorTaskId=t.id;item.scheduledAt=now;item.dueAt=now+24*60*60*1000;
      item.result="with_help";item.lastHelpAt=now;
    });
  }
  function recordReview(t,ok,alreadySolved){
    var current=run(),context=current&&current.reviewContext;
    if(!context||!ok||!t.familyId)return;
    var item=state.reviews[context.familyId];
    if(!item||!item.pending||item.anchorTaskId!==context.anchorTaskId||item.scheduledAt!==context.scheduledAt)return;
    var now=Date.now(),independent=!ts(t).helpUsed;
    if(independent&&!alreadySolved&&current.fresh&&t.id!==context.anchorTaskId&&now>=context.dueAt){
      item.pending=false;item.completedAt=now;item.completedTaskId=t.id;
      item.completedCount=(item.completedCount||0)+1;item.result="independent_after_pause";
    }else if(!independent){
      item.anchorTaskId=t.id;item.scheduledAt=now;item.dueAt=now+24*60*60*1000;
      item.result="with_help";item.pending=true;
    }else item.result="practice_before_pause";
  }
  function record(t,ok){
    var p=progress[t.id]||{attempts:0,successful:0,independent:0,helped:0,hints:0,solutions:0};
    p.attempts++;p.last=new Date().toISOString();p.mode=run()?"series":state.mode;p.learningMode=t.learningMode||state.mode;p.skillId=t.skillId;if(t.familyId)p.familyId=t.familyId;
    if(!ok){p.guided=true;p.feedbackHints=(p.feedbackHints||0)+1;}
    if(ok){p.successful++;if(ts(t).helpUsed){p.helped++;}else p.independent++;}
    progress[t.id]=p;save();
  }
  function noteHelp(t,solution){
    var p=progress[t.id]||{attempts:0,successful:0,independent:0,helped:0,hints:0,solutions:0};
    ts(t).helpUsed=true;p.guided=true;
    p.skillId=t.skillId;p.learningMode=t.learningMode||state.mode;if(t.familyId)p.familyId=t.familyId;
    if(solution)p.solutions++;else p.hints++;
    progress[t.id]=p;pauseAfterHelp(t);save();
  }
  function skillLabel(id){for(var ti=0;ti<topics.length;ti++){var s=topics[ti].skills.find(function(v){return v.id===id;});if(s)return s.label;}return id;}
  function stateForSkill(id){
    var keys=Object.keys(progress).filter(function(key){return progress[key].skillId===id;});
    var independent=keys.filter(function(k){return progress[k].independent>0;}),helped=keys.filter(function(k){return progress[k].helped>0;}).length;
    var creative=independent.filter(function(k){var p=progress[k],f=series.familyIndex[p.familyId];return (p.learningMode||(f&&f.mode)||p.mode)==="creative";}).length;
    var ordinary=independent.length-creative;
    var later=Object.keys(state.reviews).map(function(key){return state.reviews[key];}).filter(function(r){return r.skillId===id&&r.completedCount>0;}).reduce(function(n,r){return n+r.completedCount;},0);
    var observed=independent.length?"Без подсказки приложения: обычных задач — "+ordinary+", мастерских — "+creative+". Считаются разные карточки.":"";
    if(later)return observed+" Успешных проверок другого варианта после паузы: "+later+". Это наблюдения по выбранным заданиям, а не по всей теме.";
    if(independent.length)return observed+" После перерыва ещё не проверяли.";
    if(helped)return "Есть решения с помощью в разных карточках: "+helped+". Можно попробовать другой пример без подсказки приложения.";
    return "Выполнение без подсказки приложения здесь ещё не проверяли.";
  }
  function mapHTML(){
    var top=topic(), local=new Set(top.skills.map(function(s){return s.id;})),depths={};
    function depth(id,seen){if(depths[id]!==undefined)return depths[id];if(seen.has(id))return 0;var next=new Set(seen);next.add(id);var sk=top.skills.find(function(s){return s.id===id;});var req=(sk.requires||[]).filter(function(x){return local.has(x);});return depths[id]=req.length?Math.max.apply(null,req.map(function(x){return depth(x,next); }))+1:0;}
    top.skills.forEach(function(s){depth(s.id,new Set());});
    var max=Math.max.apply(null,Object.values(depths)),levels="";
    for(var i=0;i<=max;i++)levels+='<div class="map-level">'+top.skills.filter(function(s){return depths[s.id]===i;}).map(function(s){return '<button type="button" class="cursor-interaction" data-action="skill" data-skill="'+esc(s.id)+'" data-map-node="'+esc(s.id)+'" aria-pressed="'+(state.skill===s.id)+'">'+esc(s.label)+'</button>';}).join("")+"</div>";
    var selected=top.skills.find(function(s){return s.id===state.skill;}),detail="";
    if(selected){
      var related=top.creative.map(function(t,i){return t.skillId===selected.id||(selected.relatedTasks||[]).indexOf(t.id)>=0?{t:t,i:i}:null;}).filter(Boolean);
      detail='<div class="skill-detail"><strong>'+esc(selected.label)+'</strong><span><span class="map-note">Что здесь можно проверить:</span> '+esc(selected.evidence)+'</span>'+((selected.requires||[]).length?'<div class="help-links"><span class="map-note">Можно вернуться к опоре:</span>'+selected.requires.map(function(id){return '<button type="button" class="cursor-interaction" data-action="prerequisite" data-skill="'+esc(id)+'">'+esc(skillLabel(id))+'</button>';}).join("")+"</div>":"")+'<span class="skill-state">'+esc(stateForSkill(selected.id))+'</span>'+(selected.separateCheck===false?'<span class="map-note">Отдельная проверка этого навыка пока не выделена. В связанных заданиях он используется как часть решения.</span>':"")+'<div class="help-links">'+related.map(function(o){return '<button type="button" class="cursor-interaction" data-action="open-creative" data-index="'+o.i+'">'+esc(o.t.title)+'</button>';}).join("")+series.families.filter(function(f){return f.skillId===selected.id||(selected.relatedFamilies||[]).indexOf(f.id)>=0;}).map(function(f){return '<button type="button" class="cursor-interaction" data-action="variant" data-family="'+esc(f.id)+'">'+esc(f.title)+' · новый вариант</button>';}).join("")+"</div></div>";
      var ordinary=top.quick.filter(function(t){return t.skillId===selected.id||(selected.relatedTasks||[]).indexOf(t.id)>=0;});
      if(ordinary.length)detail+='<div class="help-links ordinary-links"><span class="map-note">Выбрать одну обычную задачу:</span>'+ordinary.map(function(t){return '<button type="button" class="cursor-interaction" data-action="open-task" data-task="'+esc(t.id)+'">'+esc(t.title)+'</button>';}).join("")+'</div>';
    }
    return '<section class="map" aria-label="Карта навыков темы"><h3>Куда можно пойти дальше</h3><p class="map-note">Выбирайте интересную ветку. Дополнительные занятия не увеличивают объём выбранной практики.</p><div class="map-drawing"><svg class="map-links" aria-hidden="true"></svg>'+levels+'</div>'+detail+'</section>';
  }
  function quickCount(){return (run()?list().filter(function(t){return t.learningMode!=="creative";}):overview(topic())).filter(function(t){return progress[t.id]&&progress[t.id].successful>0;}).length;}
  function seriesPickerHTML(){
    var routes=series.routes.filter(function(r){return r.topicId===state.topic;}),families=series.families.filter(function(f){return f.topicId===state.topic;});
    if(!routes.length&&!families.length)return "";
    return '<details class="series-picker"'+(state.seriesPicker?" open":"")+'><summary>Выбрать короткую серию по одной цели</summary><div class="series-content"><p class="status-note">Можно сразу решать обычные задачи. Исследовательские шаги внутри серий разрешено пропускать.</p><div class="route-list">'+routes.map(function(r){
      var previous=state.runs[r.id],complete=previous&&previous.cursor>=previous.refs.length,started=previous&&previous.cursor>0&&!complete;
      return '<article class="route-card"><h3>'+esc(r.title)+'</h3><p>'+esc(r.goal)+'</p><div class="route-footer"><span class="status-note">Шагов: '+r.steps.length+(started?' · остановились на '+(previous.cursor+1):"")+'</span><button type="button" class="cursor-interaction" data-action="route" data-route="'+esc(r.id)+'" data-fresh="'+!!complete+'">'+(started?"Продолжить":complete?(r.steps.some(function(step){return !!step.taskId;})?"Повторить":"Другие задания"):"Начать")+'</button></div></article>';
    }).join("")+'</div><details class="family-picker"><summary>Отдельные навыки и варианты</summary><div class="family-list">'+families.map(function(f){return '<button type="button" class="cursor-interaction" data-action="variant" data-family="'+esc(f.id)+'">'+esc(f.title)+'</button>';}).join("")+'</div></details></div></details>';
  }
  function reviewsHTML(){
    var items=Object.keys(state.reviews).map(function(key){return state.reviews[key];}).filter(function(r){return r.pending&&series.familyIndex[r.familyId];});
    if(!items.length)return "";
    return '<details class="review-queue"><summary>Темы, к которым вы решили вернуться</summary><div class="series-content"><p class="status-note">Повторение по желанию. Здесь нет просроченных заданий и штрафов.</p>'+items.map(function(r){
      var family=series.familyIndex[r.familyId],due=Date.now()>=r.dueAt,date=new Date(r.dueAt).toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
      return '<article class="review-row"><div><strong>'+esc(family.title)+'</strong><p class="status-note">'+(due?"Можно попробовать другой вариант после паузы.":"Запланировано с "+esc(date)+". Можно попробовать и раньше.")+'</p></div><button type="button" class="cursor-interaction" data-action="review" data-family="'+esc(family.id)+'">'+(due?"Проверить себя":"Попробовать раньше")+'</button></article>';
    }).join("")+"</div></details>";
  }
  function teacherHTML(){
    return '<details class="teacher"'+(state.teacher?" open":"")+'><summary>Для преподавателя: темы и мастерские</summary><div class="teacher-content"><p>Обзор помогает выбрать навык и мастерскую для занятия. Короткая практика в каждой теме начинается с четырёх заданий; дополнительные занятия остаются по желанию.</p>'+topics.map(function(t){return '<article class="overview-topic"><h3>'+esc(t.title)+'</h3><p>'+esc(t.goal)+'</p><ul>'+t.skills.map(function(s){return "<li>"+esc(s.label)+"</li>";}).join("")+'</ul><p>Мастерские: '+t.creative.map(function(a){return esc(a.title);}).join(" · ")+'.</p><button type="button" class="ghost cursor-interaction" data-action="topic" data-topic="'+esc(t.id)+'">Открыть тему</button></article>';}).join("")+'</div></details>';
  }
  function answerFingerprint(s){
    return JSON.stringify({answer:s.answer,selected:s.selected,matches:s.matches,order:s.order,values:s.values,k:s.k,b:s.b,red:s.red,partition:s.partition,sign:s.sign,probes:s.probes,modelId:s.modelId});
  }
  function hasCheckedAnswer(t,s){
    if(!s.successFingerprint||s.successFingerprint!==answerFingerprint(s)||!progress[t.id]||!progress[t.id].successful)return false;
    // Restoring the controls is not another attempt or another successful task.
    try{return checkTask(t,s).ok===true;}catch(_){return false;}
  }
  function clearAnswerFeedback(){
    state.feedback=null;
    root.querySelectorAll(".task .feedback,.task .after,.task .after-options").forEach(function(node){node.remove();});
  }
  function captureFocus(){
    var active=document.activeElement;
    if(!active||!root.contains(active))return null;
    var names=["id","data-action","data-field","data-route","data-family","data-task","data-index","data-mode","data-topic","data-skill","data-value","data-name"];
    return {tag:active.tagName,attributes:names.map(function(name){return [name,active.getAttribute(name)];}),
      summaryParent:active.tagName==="SUMMARY"?active.parentElement.className:null,
      selection:typeof active.selectionStart==="number"?[active.selectionStart,active.selectionEnd,active.selectionDirection]:null};
  }
  function visibleFocusTarget(node){
    if(!node||node.disabled||node.closest("[hidden]"))return false;
    for(var ancestor=node;ancestor&&ancestor!==root;ancestor=ancestor.parentElement){
      if(ancestor.tagName==="DETAILS"&&!ancestor.open){
        var summary=ancestor.querySelector("summary");
        if(!summary||!summary.contains(node))return false;
      }
    }
    return true;
  }
  function restoreFocus(previous,changedView){
    if(!previous&&!changedView)return;
    var target;
    if(previous&&!changedView){
      target=Array.from(root.querySelectorAll("button,input,select,summary,a,[tabindex]")).find(function(node){
        return node.tagName===previous.tag&&previous.attributes.every(function(pair){return node.getAttribute(pair[0])===pair[1];})&&
          (previous.summaryParent===null||node.parentElement.className===previous.summaryParent)&&visibleFocusTarget(node);
      });
    }
    if(!target)target=root.querySelector(".task-prompt")||root.querySelector(".completed h2")||root.querySelector(".heading h1");
    if(!target)return;
    if(!target.matches("button,input,select,summary,a"))target.setAttribute("tabindex","-1");
    try{
      target.focus({preventScroll:true});
      if(previous&&!changedView&&previous.selection&&target.setSelectionRange)target.setSelectionRange.apply(target,previous.selection);
    }catch(_){}
  }
  function render(){
    var top=topic(),current=run(),t=task(),count=quickCount(),practice=current?list():overview(top),ordinaryPractice=current?practice.filter(function(q){return q.learningMode!=="creative";}):practice,total=ordinaryPractice.length,content;
    var previousFocus=captureFocus(),view=JSON.stringify([state.topic,state.mode,state.activeRun,t?t.id:null,t?t.presentationId:null]);
    if(!t){
      var independent=ordinaryPractice.filter(function(q){return progress[q.id]&&progress[q.id].independent>0;}).length;
      var workshops=current?practice.filter(function(q){return q.learningMode==="creative"&&progress[q.id]&&progress[q.id].successful>0;}).length:0;
      var skipped=current?(current.skipped||[]).length:0;
      content='<section class="completed"><h2>'+(current?"Выбранная работа завершена":"Короткая практика завершена")+'</h2>'+(total?'<p class="ordinary-result">Обычная практика: решено '+count+' из '+total+'. Без подсказки приложения — '+independent+'.</p>':"")+(current?'<p class="workshop-result">'+(total?"Дополнительно исследовано мастерских: ":"Решено мастерских: ")+workshops+'.'+(skipped?' Остальные мастерские можно оставить на потом.':"")+'</p>':"")+'<p class="status-note">Можно закончить здесь. Это результат выбранной работы; дополнительные ветки остаются по желанию.</p><div class="controls">';
      if(current){
        content+='<button type="button" class="primary cursor-interaction" data-action="return">К прежнему заданию</button>';
        if(current.routeId.indexOf("family:")===0)content+='<button type="button" class="cursor-interaction" data-action="variant" data-family="'+esc(current.refs[0].familyId)+'">Другой вариант</button>';
        else if(current.routeId.indexOf("task:")!==0)content+='<button type="button" class="cursor-interaction" data-action="route" data-route="'+esc(current.routeId)+'" data-fresh="true">'+(series.routeIndex[current.routeId].steps.some(function(step){return !!step.taskId;})?"Повторить эти задания":"Другие задания этой серии")+'</button>';
      }else{
        content+='<button type="button" class="primary cursor-interaction" data-action="restart">Ещё раз пройти практику</button><button type="button" class="cursor-interaction" data-action="mode" data-mode="creative">Разобраться в теме</button>';
      }
      content+='</div></section>';
    }else{
      var st=ts(t),family=variantFamily(t),ordinary=current||state.mode==="quick",checkedAnswer=hasCheckedAnswer(t,st);
      content='<div class="stage-head"><div><span class="stage-count">'+(current?"Шаг "+(index()+1)+" из "+list().length:state.mode==="quick"?"Задание "+(index()+1)+" из "+list().length:"Мастерская по выбору")+'</span>';
      if(ordinary&&total)content+='<div class="progress-dots" aria-label="Обычная практика: решено '+count+' из '+total+'">'+ordinaryPractice.map(function(q){
        var done=progress[q.id]&&progress[q.id].successful>0,passed=current&&(current.skipped||[]).indexOf(q.id)>=0;
        return '<span class="'+(done?"done":passed?"passed":"")+'"></span>';
      }).join("")+"</div>";
      content+='</div><span class="stage-count">'+(current?esc(current.refs[index()].label):state.mode==="quick"?"Практика без обязательных ответвлений":"Можно вернуться к практике в любой момент")+'</span></div>';
      if(current)content+='<div class="route-current"><strong>'+esc(current.title)+'</strong><p class="status-note">'+esc(current.goal)+'</p>'+(!current.fresh?'<p class="status-note">Некоторые примеры в этой серии уже встречались. Можно повторить их или выбрать другой навык.</p>':"")+"</div>";
      if(!current&&state.mode==="creative")content+='<details class="creative-picker"><summary>Выбрать мастерскую · '+top.creative.length+'</summary><nav class="creative-menu" aria-label="Выбор мастерской">'+top.creative.map(function(q,i){
        return '<button type="button" class="cursor-interaction" data-action="creative" data-index="'+i+'" aria-pressed="'+(i===index())+'">'+esc(q.title)+'</button>';
      }).join("")+"</nav></details>";
      content+='<section class="task" aria-label="'+esc(t.title)+'"><div class="task-title">'+esc(t.title)+'</div><p class="task-prompt">'+esc(t.prompt)+'</p>'+activityHTML(t,st);
      content+='<div class="task-actions"><button type="button" class="primary cursor-interaction" data-action="check">Проверить</button><button type="button" class="ghost cursor-interaction" data-action="hint" aria-expanded="'+st.hint+'">Подсказка</button><button type="button" class="ghost cursor-interaction" data-action="solution" aria-expanded="'+st.revealed+'">Разобрать</button></div>';
      if(st.hint)content+='<div class="hint">'+esc(t.hint)+'</div>';
      if(st.revealed)content+='<div class="hint"><strong>Разбор.</strong> '+esc(t.explanation)+'<div class="status-note">После разбора можно попробовать другой пример самостоятельно.</div></div>';
      if(state.feedback)content+='<div class="feedback '+esc(state.feedback.kind)+'" role="'+(state.feedback.kind==="invalid"?"alert":"status")+'" aria-live="polite">'+esc(state.feedback.text)+'</div>';
      if(checkedAnswer){
        var last=index()+1>=list().length,nextLabel=current?(last?"Завершить серию":"Следующий шаг"):last?(state.mode==="quick"?"Завершить практику":"К практике"):"Следующее задание";
        content+='<div class="after"><button type="button" class="primary cursor-interaction" data-action="next">'+nextLabel+'</button><span class="status-note">'+(st.helpUsed?"Получилось с помощью.":"Получилось без подсказки приложения.")+'</span></div>';
        if(family)content+='<div class="help-links after-options"><button type="button" class="cursor-interaction" data-action="variant" data-family="'+esc(family.id)+'">Другой вариант</button>'+((state.reviews[family.id]||{}).pending?'<span class="status-note">К этой идее уже запланировано возвращение.</span>':'<button type="button" class="cursor-interaction" data-action="queue-review">Вернуться к этой идее позже</button>')+"</div>";
      }else if(st.revealed&&family){
        content+='<div class="help-links"><button type="button" class="cursor-interaction" data-action="variant" data-family="'+esc(family.id)+'">Попробовать другой пример</button></div>';
      }
      if(current&&t.learningMode==="creative")content+='<div class="optional-step"><span class="status-note">Это исследовательский шаг по желанию.</span><button type="button" class="ghost cursor-interaction" data-action="skip-workshop">Пропустить мастерскую</button></div>';
      if((t.learningMode||state.mode)!=="creative"&&answerFormat&&progress[t.id]&&progress[t.id].successful>0){
        var specification=answerFormat.specification(t,state.topic);
        if(specification)content+=examFormatHTML(t,st,specification);
      }
      content+='</section>';
    }
    root.innerHTML='<div class="brand"><span class="brand-name">MathExam · ОГЭ</span><span class="edition">Практика и мастерские</span></div><div class="topic-picker"><label for="skill-topic">Тема</label><select id="skill-topic" data-field="topic">'+topics.map(function(q){
      return '<option value="'+esc(q.id)+'"'+(q.id===state.topic?" selected":"")+'>'+esc(q.title)+'</option>';
    }).join("")+'</select></div><div class="heading"><h1>'+esc(top.title)+'</h1><p class="goal">'+esc(top.goal)+'</p></div>'+
    (state.backStack.length?'<button type="button" class="ghost return-link cursor-interaction" data-action="return">Вернуться к прежнему заданию</button>':"")+
    '<nav class="modes" aria-label="Как заниматься"><button type="button" class="cursor-interaction" data-action="mode" data-mode="quick" aria-pressed="'+(!current&&state.mode==="quick")+'">Потренироваться</button><button type="button" class="cursor-interaction" data-action="mode" data-mode="creative" aria-pressed="'+(!current&&state.mode==="creative")+'">Разобраться в теме</button></nav>'+
    '<button type="button" class="ghost map-toggle cursor-interaction" data-action="map" aria-expanded="'+state.map+'">'+(state.map?"Свернуть карту навыков":"Открыть карту навыков")+'</button>'+seriesPickerHTML()+(state.map?mapHTML():"")+
    '<div class="stage">'+content+'</div>'+reviewsHTML()+'<footer class="footer"><span>'+(storageAvailable?"Ответы и подсказки сохраняются в этом браузере. В кабинет они не передаются.":"Ответы и подсказки доступны в этой открытой вкладке.")+'</span></footer>'+teacherHTML();
    saveSession();
    updateNavigation();
    restoreFocus(previousFocus,renderedView!==null&&renderedView!==view);
    renderedView=view;
    requestAnimationFrame(drawAll);
  }

  function answerField(st,label,unit){
    return '<div class="controls"><div class="field"><label for="skill-answer">'+esc(label||"Ваш ответ")+(unit?" · "+esc(unit):"")+'</label><input id="skill-answer" type="text" inputmode="decimal" autocomplete="off" data-field="answer" value="'+esc(st.answer)+'" aria-describedby="answer-format"><span class="status-note" id="answer-format">Можно ввести дробь через / или десятичное число.</span></div></div>';
  }
  function examFormatHTML(t,s,spec){
    var html='<details class="exam-format"'+(s.examOpen?" open":"")+'><summary>Потренировать запись ответа</summary><p class="status-note">Это запись уже найденного ответа. Она учитывается отдельно от решения задачи.</p><p>'+esc(spec.instruction)+'</p>';
    if(spec.choices)html+='<ol class="format-options">'+spec.choices.map(function(c){return '<li value="'+c.number+'">'+esc(c.text)+'</li>';}).join("")+'</ol>';
    html+='<div class="controls"><div class="field"><label for="exam-answer">Ответ одной строкой</label><input id="exam-answer" type="text" inputmode="decimal" autocomplete="off" data-field="exam-answer" value="'+esc(s.examAnswer||"")+'"></div><button type="button" class="cursor-interaction" data-action="check-format">Проверить запись</button></div>';
    if(s.examFeedback)html+='<div class="format-feedback '+(s.examFeedback.ok?"good":"invalid")+'" role="status" aria-live="polite">'+esc(s.examFeedback.message)+'</div>';
    return html+'</details>';
  }
  function checkExamFormat(){
    var t=task();if(!t||!answerFormat)return;
    var s=ts(t),spec=answerFormat.specification(t,state.topic);if(!spec)return;
    s.examFeedback=answerFormat.check(spec,s.examAnswer,evaluate);s.examOpen=true;
    s.formatChecks=(s.formatChecks||0)+1;
    if(s.examFeedback.ok)s.formatSucceeded=true;
    render();
  }
  function activityHTML(t,s){
    var h="";
    if(t.visual)h+='<div class="figure" data-figure="custom"></div>';
    if(t.table&&Array.isArray(t.table.headers)&&Array.isArray(t.table.rows))h+='<div class="task-table"><table><thead><tr>'+t.table.headers.map(function(v){return '<th scope="col">'+esc(v)+'</th>';}).join("")+'</tr></thead><tbody>'+t.table.rows.map(function(row){return '<tr>'+row.map(function(v){return '<td>'+esc(typeof v==="number"?fmt(v):v)+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
    if(t.type==="experiment"){
      var secret=t.models.find(function(m){return m.id===t.secretModelId;});
      var rows=(t.known||[]).map(function(p){return [p.x,p.y,"Из условия"];}).concat(s.probes.map(function(v){var variables={};variables[t.variable||"x"]=v;return [v,evaluate(secret.expression,variables),"Выбрано вами"];}));
      return h+'<div class="task-table"><table><thead><tr><th scope="col">x</th><th scope="col">y</th><th scope="col">Данные</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+fmt(r[0])+'</td><td>'+fmt(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';}).join("")+'</tbody></table></div><div class="probe-controls"><span>Выберите значение x для проверки:</span><div class="controls">'+t.probeValues.map(function(v){return '<button type="button" class="cursor-interaction" data-action="probe" data-value="'+v+'"'+(s.probes.indexOf(v)>=0?' disabled':'')+'>x = '+fmt(v)+'</button>';}).join("")+'</div></div><div class="options" aria-label="Выберите формулу">'+t.models.map(function(m){return '<button type="button" class="cursor-interaction" data-action="model" data-value="'+esc(m.id)+'" aria-pressed="'+(s.modelId===m.id)+'">'+esc(m.label)+'</button>';}).join("")+'</div>';
    }
    if(t.type==="number")return h+answerField(s,"Ваш ответ",t.unit);
    if(t.type==="choice"||t.type==="multi")return h+(t.type==="multi"?'<span class="status-note">Можно выбрать несколько вариантов.</span>':"")+'<div class="options">'+t.options.map(function(o,i){return '<button type="button" class="cursor-interaction" data-action="option" data-index="'+i+'" aria-pressed="'+(s.selected.indexOf(i)>=0)+'">'+esc(o.text)+'</button>';}).join("")+"</div>";
    if(t.type==="order")return h+'<div class="order-list">'+s.order.map(function(text,i){return '<div class="order-row"><span class="step">'+esc(text)+'</span><button type="button" class="cursor-interaction" data-action="up" data-index="'+i+'" aria-label="Поднять шаг '+(i+1)+'"'+(i===0?" disabled":"")+'>↑</button><button type="button" class="cursor-interaction" data-action="down" data-index="'+i+'" aria-label="Опустить шаг '+(i+1)+'"'+(i===s.order.length-1?" disabled":"")+'>↓</button></div>';}).join("")+"</div>";
    if(t.type==="match"){
      var rights=(t.matchOptions||t.pairs.map(function(p){return p.right;})).slice();
      if(!t.matchOptions){var random=0;String(t.id).split("").forEach(function(c){random=(Math.imul(random,31)+c.charCodeAt(0))>>>0;});for(var q=rights.length-1;q>0;q--){random=(Math.imul(random,1664525)+1013904223)>>>0;var j=random%(q+1),temp=rights[q];rights[q]=rights[j];rights[j]=temp;}}
      return h+'<div>'+t.pairs.map(function(p,i){return '<div class="match-row"><label for="match-'+i+'">'+esc(p.left)+'</label><select id="match-'+i+'" data-field="match" data-index="'+i+'"><option value="">Выберите пару</option>'+rights.map(function(r){return '<option value="'+esc(r)+'"'+(s.matches[i]===r?" selected":"")+'>'+esc(r)+'</option>';}).join("")+"</select></div>";}).join("")+"</div>";
    }
    if(t.type==="build")return h+'<div class="controls">'+t.fields.map(function(f){return '<div class="field"><label for="build-'+esc(f.name)+'">'+esc(f.label)+'</label><input id="build-'+esc(f.name)+'" type="text" inputmode="decimal" autocomplete="off" data-field="build" data-name="'+esc(f.name)+'" value="'+esc(s.values[f.name]===undefined?"":s.values[f.name])+'">'+(f.min!==undefined||f.max!==undefined?'<span class="status-note">'+(f.min!==undefined?"от "+fmt(f.min)+" ":"")+(f.max!==undefined?"до "+fmt(f.max):"")+(f.integer||f.step===1?" · целое":f.step?" · шаг "+fmt(f.step):"")+"</span>":"")+"</div>";}).join("")+"</div>";
    if(t.type==="counterexample")return h+answerField(s,"Значение "+(t.field||"x"),"");
    if(t.type==="numberline")return h+'<div class="figure" data-figure="numberline"></div>'+answerField(s,"Координата","");
    if(t.type==="battle"){
      var neg=Math.abs(Math.min(t.a,t.b)),pos=Math.max(t.a,t.b),rows="";
      [{count:neg,kind:"neg",sign:"−1",label:"Отрицательные единицы"},{count:pos,kind:"pos",sign:"+1",label:"Положительные единицы"}].forEach(function(g){rows+='<div><div class="army-label"><span>'+g.label+'</span><span>'+g.count+'</span></div><div class="army">'+Array.from({length:g.count},function(_,i){return '<span class="token '+g.kind+(i<s.cancel?" cancelled":"")+'">'+(i<s.cancel?"0":g.sign)+'</span>';}).join("")+"</div></div>";});
      return h+'<div class="battle"><div class="battle-signs"><span>Сначала предположите знак:</span>'+["−","0","+"].map(function(v){return '<button type="button" class="cursor-interaction" data-action="sign" data-value="'+v+'" aria-pressed="'+(s.sign===v)+'">'+v+'</button>';}).join("")+'</div>'+rows+'<div><button type="button" class="cursor-interaction" data-action="cancel"'+(s.cancel>=Math.min(neg,pos)?" disabled":"")+'>Погасить пару −1 и +1</button></div><span class="status-note">Убрано противоположных пар: '+s.cancel+'. Каждая пара имеет сумму 0.</span></div>'+answerField(s,"Сумма","");
    }
    if(t.type==="graph")return h+'<div class="figure" data-figure="graph"></div><div class="formula" id="graph-formula">'+esc(lineFormula(s.k,s.b))+'</div><div class="graph-controls"><div><label for="graph-k">Угловой коэффициент k: <output id="k-output">'+fmt(s.k)+'</output></label><input id="graph-k" type="range" min="'+Math.min(-5,t.k-1)+'" max="'+Math.max(5,t.k+1)+'" step="0.25" value="'+s.k+'" data-field="k"></div><div><label for="graph-b">Значение y при x = 0, b: <output id="b-output">'+fmt(s.b)+'</output></label><input id="graph-b" type="range" min="'+Math.min(-6,t.b-1)+'" max="'+Math.max(6,t.b+1)+'" step="0.25" value="'+s.b+'" data-field="b"></div></div>';
    if(t.type==="fraction"){
      var lcm=t.denominatorA*t.denominatorB/gcd(t.denominatorA,t.denominatorB),parts=Array.from(new Set([t.denominatorA,t.denominatorB,lcm,lcm*2])).sort(function(a,b){return a-b;});
      function strip(n,d){return '<div class="fraction-row"><div class="fraction-label">'+n+"/"+d+'</div><div class="fraction-strip"><div class="fraction-fill" style="width:'+(n/d*100)+'%"></div>'+(s.partition?Array.from({length:s.partition-1},function(_,i){return '<span class="fraction-mark" style="left:'+((i+1)/s.partition*100)+'%"></span>';}).join(""):"")+"</div></div>";}
      return h+strip(t.numeratorA,t.denominatorA)+strip(t.numeratorB,t.denominatorB)+'<span class="status-note">Обе полоски — одинаковое целое.</span><div class="controls">'+parts.map(function(n){return '<button type="button" class="cursor-interaction" data-action="partition" data-value="'+n+'" aria-pressed="'+(s.partition===n)+'">Разделить на '+n+'</button>';}).join("")+'</div>'+answerField(s,s.partition?"Сколько частей размера 1/"+s.partition+" в сумме?":"Сначала выберите общую мерку","");
    }
    if(t.type==="probability")return h+'<div class="ball-field" aria-label="Выбор благоприятных исходов">'+Array.from({length:t.total},function(_,i){return '<button type="button" class="cursor-interaction '+(s.red.indexOf(i)>=0?"red":"")+'" data-action="ball" data-index="'+i+'" aria-pressed="'+(s.red.indexOf(i)>=0)+'" aria-label="Шар '+(i+1)+': '+(s.red.indexOf(i)>=0?"красный":"обычный")+'">'+(s.red.indexOf(i)>=0?"К":"○")+'</button>';}).join("")+'</div><span class="status-note">Красных: '+s.red.length+' из '+t.total+'. Нажмите на шар, чтобы изменить цвет.</span>';
    if(t.type==="tiltArea")return h+'<div class="figure" data-figure="area"></div><div class="field"><label for="area-skew">Измените наклон фигуры</label><input id="area-skew" type="range" min="-2" max="2" step="0.1" value="'+s.skew+'" data-field="skew"></div>'+answerField(s,"Площадь",t.unit||"кв. ед.");
    if(t.type==="triangleGate")return h+'<div class="figure" data-figure="triangle"></div>'+answerField(s,"Третья сторона",t.unit||"ед.");
    return '<p>Описание этого занятия находится в карте.</p>';
  }
  function lineFormula(k,b){var a=k===0?"":k===1?"x":k===-1?"−x":fmt(k)+"x";return "y = "+(a?(a+(b>0?" + "+fmt(b):b<0?" − "+fmt(-b):"")):fmt(b));}
  function svgWrap(w,h,body,label){return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+body+'</svg>';}
  function line(x1,y1,x2,y2,color,width,dash){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(color||"var(--rule)")+'" stroke-width="'+(width||1)+'"'+(dash?' stroke-dasharray="'+dash+'"':"")+'/>';}
  function text(x,y,content,anchor){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(anchor||"middle")+'" fill="var(--ink)" font-family="system-ui,sans-serif" font-size="12">'+esc(content)+'</text>';}
  function width(el){return Math.max(220,Math.floor(el.getBoundingClientRect().width));}
  function plotFrame(el,options){
    var w=width(el),h=options.compact?235:270,L=42,R=w-18,T=20,B=h-30;
    var xmin=options.xMin,xmax=options.xMax,ymin=options.yMin,ymax=options.yMax;
    function X(x){return L+(x-xmin)/(xmax-xmin)*(R-L);}
    function Y(y){return B-(y-ymin)/(ymax-ymin)*(B-T);}
    function tickStep(span,count){
      var raw=span/count,scale=Math.pow(10,Math.floor(Math.log10(raw))),n=raw/scale;
      return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*scale;
    }
    function ticks(min,max,count){
      var step=tickStep(max-min,count),values=[],start=Math.ceil(min/step)*step;
      for(var n=start;n<=max+step*1e-8;n+=step)values.push(Math.abs(n)<step*1e-8?0:n);
      if(values.length>count){step*=2;values=[];for(var k=Math.ceil(min/step)*step;k<=max+step*1e-8;k+=step)values.push(Math.abs(k)<step*1e-8?0:k);}
      return values;
    }
    var body="",xticks=ticks(xmin,xmax,w<380?4:6),yticks=ticks(ymin,ymax,6);
    xticks.forEach(function(x){body+=line(X(x),T,X(x),B)+text(X(x),B+19,fmt(x));});
    yticks.forEach(function(y){body+=line(L,Y(y),R,Y(y))+text(L-8,Y(y)+4,fmt(y),"end");});
    if(ymin<=0&&ymax>=0)body+=line(L,Y(0),R,Y(0),"var(--soft)",1.5);
    if(xmin<=0&&xmax>=0)body+=line(X(0),T,X(0),B,"var(--soft)",1.5);
    body+=text(R-1,B-7,"x","end")+text(L+8,T+6,"y","start");
    var clipId="plot-"+String(options.id||"figure").replace(/[^a-zA-Z0-9]/g,"");
    body+='<defs><clipPath id="'+clipId+'"><rect x="'+L+'" y="'+T+'" width="'+(R-L)+'" height="'+(B-T)+'"/></clipPath></defs>';
    return {w:w,h:h,L:L,R:R,T:T,B:B,xmin:xmin,xmax:xmax,ymin:ymin,ymax:ymax,X:X,Y:Y,body:body,clipId:clipId};
  }
  function markedPoints(frame,points){
    var body="",labels=[];
    (points||[]).forEach(function(p,index){
      var px=frame.X(p[0]),py=frame.Y(p[1]);
      if(px<frame.L||px>frame.R||py<frame.T||py>frame.B)return;
      var content=String.fromCharCode(65+index)+" ("+fmt(p[0])+"; "+fmt(p[1])+")",estimated=content.length*6.5;
      var anchor=px>frame.w*.55?"end":"start",x=px+(anchor==="end"?-9:9),y=py>frame.h/2?py-10:py+19;
      var left=anchor==="end"?x-estimated:x;
      if(left<4){x=4;anchor="start";left=4;}
      if(left+estimated>frame.w-4){x=frame.w-4;anchor="end";left=x-estimated;}
      for(var attempt=0;attempt<5;attempt++){
        var overlap=labels.some(function(r){return left<r.right&&left+estimated>r.left&&y-12<r.bottom&&y>r.top;});
        if(!overlap)break;
        y+=py>frame.h/2?-16:16;
      }
      y=Math.max(15,Math.min(frame.h-8,y));
      labels.push({left:left,right:left+estimated,top:y-12,bottom:y});
      body+='<circle cx="'+px+'" cy="'+py+'" r="5" fill="var(--neg)" stroke="var(--paper)" stroke-width="2"/>'+text(x,y,content,anchor);
    });
    return body;
  }
  function drawGraph(el,t,s){
    var pts=t.points||[[0,t.b],[2,2*t.k+t.b]],xs=pts.map(function(p){return p[0];}),ys=pts.map(function(p){return p[1];});
    var options={
      id:t.id||"line",compact:t.compact,
      xMin:Number.isFinite(t.xMin)?t.xMin:Math.min(-3,Math.min.apply(null,xs)-1),
      xMax:Number.isFinite(t.xMax)?t.xMax:Math.max(3,Math.max.apply(null,xs)+1),
      yMin:Number.isFinite(t.yMin)?t.yMin:Math.min(-4,Math.min.apply(null,ys)-1),
      yMax:Number.isFinite(t.yMax)?t.yMax:Math.max(6,Math.max.apply(null,ys)+1)
    };
    var f=plotFrame(el,options),body=f.body+'<g clip-path="url(#'+f.clipId+')">'+line(f.X(f.xmin),f.Y(s.k*f.xmin+s.b),f.X(f.xmax),f.Y(s.k*f.xmax+s.b),"var(--accent)",3)+'</g>'+markedPoints(f,pts);
    var label=t.ariaLabel||t.label;
    if(!label)label=t.type==="graph"?"Текущая прямая: "+lineFormula(s.k,s.b)+". Заданные точки отмечены.":"Прямая проходит через точки (0; "+fmt(t.b)+") и (1; "+fmt(t.k+t.b)+"). Масштаб осей подписан.";
    el.innerHTML=svgWrap(f.w,f.h,body,label);
  }
  function drawFunction(el,v){
    var f=plotFrame(el,{
      id:v.id||"function",compact:v.compact,
      xMin:Number.isFinite(v.xMin)?v.xMin:-5,xMax:Number.isFinite(v.xMax)?v.xMax:5,
      yMin:Number.isFinite(v.yMin)?v.yMin:-6,yMax:Number.isFinite(v.yMax)?v.yMax:6
    });
    function value(x){return v.family==="quadratic"?v.a*x*x+v.b*x+v.c:v.k/x;}
    var path="",connected=false,previousX=null,steps=Math.max(160,Math.ceil(f.R-f.L));
    for(var i=0;i<=steps;i++){
      var x=f.xmin+(f.xmax-f.xmin)*i/steps,y=value(x);
      if(v.family==="inverse"&&(Math.abs(x)<1e-10||(previousX!==null&&previousX*x<0)))connected=false;
      if(!Number.isFinite(y)||Math.abs(y)>1e6){connected=false;previousX=x;continue;}
      path+=(connected?"L":"M")+f.X(x).toFixed(3)+","+f.Y(y).toFixed(3);
      connected=true;previousX=x;
    }
    var body=f.body+'<g clip-path="url(#'+f.clipId+')"><path d="'+path+'" fill="none" stroke="var(--accent)" stroke-width="2.6"/></g>'+markedPoints(f,v.points||[]);
    var label=v.ariaLabel||v.label||(v.family==="quadratic"?"График квадратичной функции с подписанными осями и отмеченными точками.":"Две ветви гиперболы с подписанными осями.");
    el.innerHTML=svgWrap(f.w,f.h,body,label);
  }

  function drawNumberline(el,t,s){
    var w=width(el),h=90,L=20,R=w-20,Y=39,min=t.min,max=t.max,X=function(x){return L+(x-min)/(max-min)*(R-L);},body=line(L,Y,R,Y,"var(--soft)",2),span=max-min,step=span>15?5:span>8?2:1;
    for(var n=Math.ceil(min/step)*step;n<=max;n+=step)body+=line(X(n),Y-6,X(n),Y+6,"var(--soft)",1)+text(X(n),Y+27,fmt(n));
    var val;try{val=evaluate(s.answer);}catch(_){val=null;}
    if(val!==null && val>=min && val<=max)body+='<circle cx="'+X(val)+'" cy="'+Y+'" r="7" fill="var(--accent)"/>'+text(X(val),Y-16,fmt(val));
    el.innerHTML=svgWrap(w,h,body,"Числовая прямая от "+min+" до "+max+". Введите координату под рисунком.");
  }
  function drawPolygon(el,visual){
    var pts=visual.points,w=width(el),h=235,xs=pts.map(function(p){return p[0];}),ys=pts.map(function(p){return p[1];}),bounds=visual.bounds||{},xmin=bounds.xMin===undefined?Math.min.apply(null,xs)-1:bounds.xMin,xmax=bounds.xMax===undefined?Math.max.apply(null,xs)+1:bounds.xMax,ymin=bounds.yMin===undefined?Math.min.apply(null,ys)-1:bounds.yMin,ymax=bounds.yMax===undefined?Math.max.apply(null,ys)+1:bounds.yMax;
    var scale=Math.min((w-44)/(xmax-xmin),(h-40)/(ymax-ymin)),ox=(w-(xmax-xmin)*scale)/2,oy=(h-(ymax-ymin)*scale)/2,X=function(x){return ox+(x-xmin)*scale;},Y=function(y){return h-oy-(y-ymin)*scale;},body="";
    if(visual.grid){for(var x=Math.ceil(xmin);x<=xmax;x++)body+=line(X(x),Y(ymin),X(x),Y(ymax));for(var y=Math.ceil(ymin);y<=ymax;y++)body+=line(X(xmin),Y(y),X(xmax),Y(y));}
    var shape=pts.length>2?"polygon":"polyline";
    if(!visual.pointsOnly)body+='<'+shape+' points="'+pts.map(function(p){return X(p[0])+","+Y(p[1]);}).join(" ")+'" fill="'+(pts.length>2?"var(--accent)":"none")+'" fill-opacity=".15" stroke="var(--accent)" stroke-width="2"/>';
    (visual.polygons||[]).forEach(function(extra){body+='<polygon points="'+extra.points.map(function(p){return X(p[0])+","+Y(p[1]);}).join(" ")+'" fill="var(--pos)" fill-opacity=".10" stroke="var(--pos)" stroke-width="1.6"/>';});
    (visual.circles||[]).forEach(function(c){
      body+='<circle data-geometry-circle="true" cx="'+X(c.center[0])+'" cy="'+Y(c.center[1])+'" r="'+(c.radius*scale)+'" fill="none" stroke="var(--soft)" stroke-width="1.8"/>';
      if(c.showCenter)body+='<circle cx="'+X(c.center[0])+'" cy="'+Y(c.center[1])+'" r="3" fill="var(--soft)"/>'+text(X(c.center[0])+8,Y(c.center[1])-8,c.label||"O","start");
    });
    (visual.segments||[]).forEach(function(segment){
      body+=line(X(segment.from[0]),Y(segment.from[1]),X(segment.to[0]),Y(segment.to[1]),"var(--soft)",1.5,segment.dashed?"5 4":null);
      if(segment.label)body+=text(X((segment.from[0]+segment.to[0])/2)+4,Y((segment.from[1]+segment.to[1])/2)-8,segment.label);
    });
    (visual.diagonals||[]).forEach(function(pair){var a=pts[pair[0]],b=pts[pair[1]];if(a&&b)body+=line(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),"var(--soft)",1.5,"5 4");});
    var cx=xs.reduce(function(a,b){return a+b;},0)/pts.length,cy=ys.reduce(function(a,b){return a+b;},0)/pts.length;
    pts.forEach(function(p,i){
      var dx=p[0]>=cx?9:-9,dy=p[1]>=cy?-9:17;
      body+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="3" fill="var(--accent)"/>'+text(X(p[0])+dx,Math.max(13,Math.min(h-4,Y(p[1])+dy)),(visual.labels||[])[i]||String.fromCharCode(65+i),dx>0?"start":"end");
    });
    el.innerHTML=svgWrap(w,h,body,visual.ariaLabel||visual.label||"Чертёж фигуры по данным задания. "+(visual.grid?"Сторона клетки равна единичному отрезку.":"Масштаб изображения сам по себе не является условием."));
  }
  function resolveVisual(t,s){
    var v=t.visual;if(!v.dynamic)return v;
    var d=v.dynamic,result=Object.assign({},v),keys=d.fields||Object.keys(d).filter(function(k){return ["kind","index"].indexOf(k)<0;}).map(function(k){return d[k];});
    var fields=(t.fields||[]).filter(function(f){return keys.indexOf(f.name)>=0;});
    var values=buildValues(Object.assign({},t,{fields:fields}),s);
    if(d.kind==="parallelogram"){
      var a=values[d.a],h=values[d.h],shift=values[d.shift];
      result.points=[[0,0],[a,0],[a+shift,h],[shift,h]];
    }else if(d.kind==="vertex"){
      result.points=v.points.map(function(p){return p.slice();});
      result.points[d.index]=[values[d.x],values[d.y]];
    }else if(d.kind==="rectangle")result.current=[values[d.a],values[d.b]];
    else if(d.kind==="circumcircle")result.circles=(v.circles||[]).concat([{center:[values[d.x],values[d.y]],radius:values[d.r],showCenter:true,label:"O"}]);
    else if(d.kind==="calibration")result.candidate={origin:values[d.origin],step:values[d.step]};
    else if(d.kind==="formula")result.variables=values;
    return result;
  }
  function drawCalibration(el,v){
    var w=width(el),h=v.candidate?165:110,L=34,R=w-34,extent=v.extent||[0,v.ticks.length-1],X=function(x){return L+(x-extent[0])/(extent[1]-extent[0])*(R-L);};
    var body=line(L,45,R,45,"var(--soft)",1.5);
    (v.ticks||[]).forEach(function(t){body+=line(X(t.position),38,X(t.position),52,"var(--soft)",1.5)+text(X(t.position),72,t.label===null||t.label===undefined?"?":t.label);});
    if(v.candidate){
      body+=text(L,103,"Ваши значения:","start");
      (v.ticks||[]).forEach(function(t){body+=text(X(t.position),132,fmt(v.candidate.origin+t.position*v.candidate.step));});
    }
    el.innerHTML=svgWrap(w,h,body,v.ariaLabel||"Равноотстоящие отметки числовой прямой. Данные подписи расположены в верхнем ряду; выбранные значения — ниже.");
  }
  function drawNumberlinePoints(el,v){
    var w=width(el),h=125,L=34,R=w-27,Y=48,X=function(x){return L+(x-v.min)/(v.max-v.min)*(R-L);},body=line(L,Y,R,Y,"var(--soft)",1.4);
    var step=v.tickStep||1,count=Math.round((v.max-v.min)/step),previous=-Infinity;
    for(var i=0;i<=count;i++){
      var value=v.min+i*step,x=X(value),low=x-previous<38;
      body+=line(x,Y-6,x,Y+6,"var(--soft)",1.2)+text(x,low?94:77,fmt(value));previous=x;
    }
    var lastPoint=-Infinity;
    (v.points||[]).forEach(function(point){
      var px=X(point.x),labelY=px-lastPoint<25?14:28;
      body+='<circle data-numberline-point="'+esc(point.label)+'" data-coordinate="'+point.x+'" cx="'+px+'" cy="'+Y+'" r="4" fill="var(--accent)"/>'+text(px,labelY,point.label);lastPoint=px;
    });
    el.innerHTML=svgWrap(w,h,body,v.ariaLabel||"На числовой прямой отмечены четыре точки. Подписи шкалы определяют масштаб.");
  }
  function drawPiecewise(el,v){
    var f=plotFrame(el,{id:v.id||"piecewise",xMin:v.xDomain[0],xMax:v.xDomain[1],yMin:v.yDomain[0],yMax:v.yDomain[1]}),body=f.body;
    var paths="",ends=[];
    v.segments.forEach(function(segment,index){
      var from=Math.max(segment.from,f.xmin),to=Math.min(segment.to,f.xmax),path="",count=Math.max(2,Math.ceil((to-from)/(f.xmax-f.xmin)*(f.R-f.L)));
      if(from>to)return;
      for(var i=0;i<=count;i++){
        var x=from+(to-from)*i/count,y=evaluate(segment.expression,Object.assign({},v.variables||{},{x:x}));
        path+=(i?"L":"M")+f.X(x).toFixed(3)+","+f.Y(y).toFixed(3);
      }
      paths+='<path data-piecewise-segment="'+index+'" d="'+path+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
      [{x:segment.from,closed:segment.leftClosed},{x:segment.to,closed:segment.rightClosed}].forEach(function(p){
        if(p.x<f.xmin||p.x>f.xmax)return;
        var y=evaluate(segment.expression,Object.assign({},v.variables||{},{x:p.x}));
        if(y>=f.ymin&&y<=f.ymax)ends.push({x:p.x,y:y,closed:!!p.closed});
      });
    });
    // Draw open endpoints first; a closed endpoint at the same coordinate wins.
    ends.sort(function(a,b){return Number(a.closed)-Number(b.closed);});
    body+='<g clip-path="url(#'+f.clipId+')">'+paths+'</g>'+ends.map(function(p){return '<circle data-endpoint="'+(p.closed?"closed":"open")+'" cx="'+f.X(p.x)+'" cy="'+f.Y(p.y)+'" r="4" fill="'+(p.closed?"var(--accent)":"var(--paper)")+'" stroke="var(--accent)" stroke-width="1.7"/>';}).join("");
    el.innerHTML=svgWrap(f.w,f.h,body,v.ariaLabel||"График функции, заданной разными формулами на разных промежутках.");
    if(v.xLabel||v.yLabel)el.innerHTML+='<div class="status-note">'+esc((v.xLabel?"x: "+v.xLabel:"")+(v.yLabel?"; y: "+v.yLabel:""))+'</div>';
  }
  function drawRectangles(el,v){
    var w=width(el),stack=w<460,panelW=stack?w:w/2,h=stack?550:270,scale=Math.min(panelW-64,180)/v.maxSide,body="";
    [v.reference,v.current||v.reference].forEach(function(sides,i){
      var px=stack?0:i*panelW,py=stack?i*275:0,a=sides[0],b=sides[1],x=px+(panelW-a*scale)/2,y=py+217;
      body+=text(px+panelW/2,py+19,i===0?"A · исходный":"B · ваш пример");
      body+='<rect x="'+x+'" y="'+(y-b*scale)+'" width="'+(a*scale)+'" height="'+(b*scale)+'" fill="var(--accent)" fill-opacity=".12" stroke="var(--accent)" stroke-width="2"/>';
      body+=text(x+a*scale/2,y+18,fmt(a))+text(x-9,y-b*scale/2+4,fmt(b),"end");
      body+=text(px+panelW/2,py+263,"S = "+fmt(a*b)+";  P = "+fmt(2*(a+b)));
    });
    el.innerHTML=svgWrap(w,h,body,v.label||"Два прямоугольника в одном масштабе; подписаны длины сторон, площади и периметры.");
  }
  function drawCircleSquare(el,v){
    var w=width(el),h=250,cx=w/2,cy=113,r=Math.min(80,(w-70)/2),half=v.mode==="outer"?r:r/Math.sqrt(2);
    var body='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="var(--accent)" fill-opacity=".07" stroke="var(--soft)" stroke-width="1.6"/>';
    body+='<rect x="'+(cx-half)+'" y="'+(cy-half)+'" width="'+(2*half)+'" height="'+(2*half)+'" fill="none" stroke="var(--accent)" stroke-width="2"/>';
    body+=line(cx,cy,cx+r,cy,"var(--soft)",1.5)+text(cx-7,cy+17,"O","end")+text(cx+r/2,cy-10,"r = "+fmt(v.radius));
    body+=text(cx,h-17,v.mode==="outer"?"Квадрат описан около окружности":"Квадрат вписан в окружность");
    el.innerHTML=svgWrap(w,h,body,v.label||"Квадрат и окружность. Отмечен радиус "+fmt(v.radius)+". Отношение фигур указано в условии.");
  }
  function drawIntervals(el,v){
    var w=width(el),rowH=86,h=v.rows.length*rowH+8,L=42,R=w-27,X=function(x){return L+(x-v.min)/(v.max-v.min)*(R-L);},body="",descriptions=[];
    function arrow(x,y,right,color){return '<path d="M'+(x+(right?-6:6))+','+(y-4)+' L'+x+','+y+' L'+(x+(right?-6:6))+','+(y+4)+'" fill="none" stroke="'+color+'" stroke-width="1.8"/>';}
    v.rows.forEach(function(row,i){
      var y=i*rowH+30,marks=[],description=[];
      body+=text(13,y+4,row.label)+line(L,y,R,y,"var(--soft)",1.2)+arrow(R,y,true,"var(--soft)")+text(R,y+24,"x");
      if(!row.segments.length){body+=text((L+R)/2,y-10,"Нет решений");description.push("пустое множество");}
      row.segments.forEach(function(s){
        var left=s.from===null?L:X(s.from),right=s.to===null?R:X(s.to);
        body+=line(left,y,right,y,"var(--accent)",4);
        if(s.from===null)body+=arrow(L,y,false,"var(--accent)");
        if(s.to===null)body+=arrow(R,y,true,"var(--accent)");
        [{value:s.from,closed:s.fromClosed},{value:s.to,closed:s.toClosed}].forEach(function(p){
          if(p.value===null)return;
          body+='<circle cx="'+X(p.value)+'" cy="'+y+'" r="5" fill="'+(p.closed?"var(--accent)":"var(--paper)")+'" stroke="var(--accent)" stroke-width="2"/>';
          if(marks.indexOf(p.value)<0)marks.push(p.value);
        });
        description.push((s.fromClosed&&s.from!==null?"[":"(")+(s.from===null?"−∞":fmt(s.from))+"; "+(s.to===null?"+∞":fmt(s.to))+(s.toClosed&&s.to!==null?"]":")"));
      });
      marks.sort(function(a,b){return a-b;});
      var lastLabel=-Infinity;
      marks.forEach(function(value,j){var x=X(value),closeLabel=x-lastLabel<38,labelY=y+24+(closeLabel?17:0);body+=text(x,labelY,fmt(value));lastLabel=x;});
      descriptions.push("Рисунок "+row.label+": "+description.join(" или "));
    });
    el.innerHTML=svgWrap(w,h,body,descriptions.join(". ")+". Закрашенная точка включена, пустая точка исключена.");
  }
  function drawArea(el,t,s){
    var w=width(el),h=220,scale=Math.min((w-70)/(t.base+4),145/t.height),x=(w-t.base*scale)/2,y=175,dx=s.skew*scale;
    var pts=[[x,y],[x+t.base*scale,y],[x+t.base*scale+dx,y-t.height*scale],[x+dx,y-t.height*scale]],body='<polygon points="'+pts.map(function(p){return p.join(",");}).join(" ")+'" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="2"/>';
    body+=line(x+dx,y,x+dx,y-t.height*scale,"var(--soft)",1.5,"4 4")+text(x+t.base*scale/2,y+24,"Основание "+fmt(t.base))+text(x+dx+8,y-t.height*scale/2,"h = "+fmt(t.height),"start");
    el.innerHTML=svgWrap(w,h,body,"Параллелограмм. Основание "+t.base+", высота "+t.height+". При изменении наклона основание и высота сохраняются.");
  }
  function drawTriangle(el,t,s){
    var c;try{c=evaluate(s.answer);}catch(_){c=(Math.abs(t.sideA-t.sideB)+t.sideA+t.sideB)/2;}
    if(c<=Math.abs(t.sideA-t.sideB)||c>=t.sideA+t.sideB||c<=0){el.innerHTML=svgWrap(width(el),110,text(width(el)/2,40,"Стороны не замыкаются")+text(width(el)/2,62,"в треугольник."),"При выбранной длине невырожденный треугольник не получается.");return;}
    var u=(t.sideA*t.sideA+c*c-t.sideB*t.sideB)/(2*c),v=Math.sqrt(Math.max(0,t.sideA*t.sideA-u*u));
    drawPolygon(el,{points:[[0,0],[c,0],[u,v]],labels:["A","B","C"],grid:false});
  }
  function drawCustom(el,v){
    if(v.kind==="polygon"&&v.points)drawPolygon(el,v);
    else if(v.kind==="rectangles")drawRectangles(el,v);
    else if(v.kind==="circleSquare")drawCircleSquare(el,v);
    else if(v.kind==="intervals")drawIntervals(el,v);
    else if(v.kind==="calibration")drawCalibration(el,v);
    else if(v.kind==="numberlinePoints")drawNumberlinePoints(el,v);
    else if(v.kind==="piecewise")drawPiecewise(el,v);
    else if(v.kind==="circle"){
      var w=width(el),h=210,cx=w/2,cy=100,r=75;
      el.innerHTML=svgWrap(w,h,'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="var(--accent)" fill-opacity=".10" stroke="var(--accent)" stroke-width="2"/>'+line(cx,cy,cx+r,cy,"var(--soft)",1.5)+text(cx,cy+18,"O")+text(cx+r/2,cy-10,v.radius!==undefined?"r = "+fmt(v.radius):"r"),"Окружность с обозначенным радиусом.");
    }else if(v.kind==="graph")drawGraph(el,Object.assign({id:"custom",points:[]},v),{k:v.k,b:v.b});
    else if(v.kind==="function")drawFunction(el,v);
    else if(v.kind==="graphs"){
      el.classList.add("graph-gallery");
      el.innerHTML=v.plots.map(function(plot,index){return '<section class="graph-panel"><h3>'+esc(plot.label||String.fromCharCode(65+index))+'</h3><div data-plot-index="'+index+'"></div></section>';}).join("");
      el.querySelectorAll("[data-plot-index]").forEach(function(target){
        var index=Number(target.dataset.plotIndex),plot=v.plots[index];
        drawCustom(target,Object.assign({},plot,{id:"gallery-"+index,compact:true}));
      });
    }
  }
  function drawMap(){
    var container=root.querySelector(".map-drawing"),svg=root.querySelector(".map-links");if(!container||!svg)return;
    var box=container.getBoundingClientRect(),w=box.width,h=box.height,html="";
    topic().skills.forEach(function(s){
      var target=root.querySelector('[data-map-node="'+s.id+'"]');if(!target)return;var b=target.getBoundingClientRect();
      (s.requires||[]).forEach(function(id){var origin=root.querySelector('[data-map-node="'+id+'"]');if(!origin)return;var a=origin.getBoundingClientRect();html+=line(a.left+a.width/2-box.left,a.bottom-box.top,b.left+b.width/2-box.left,b.top-box.top,"var(--rule)",1.5);});
    });
    svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.innerHTML=html;
  }
  function drawAll(){
    drawMap();var t=task();if(!t)return;var s=ts(t);
    root.querySelectorAll("[data-figure]").forEach(function(el){
      var kind=el.dataset.figure;
      if(kind==="graph")drawGraph(el,t,s);if(kind==="numberline")drawNumberline(el,t,s);
      if(kind==="area")drawArea(el,t,s);if(kind==="triangle")drawTriangle(el,t,s);
      if(kind==="custom"){
        try{drawCustom(el,resolveVisual(t,s));}
        catch(error){
          if(t.visual.dynamic&&t.visual.dynamic.kind==="circumcircle"){
            var initial=Object.assign({},t.visual,{circles:t.visual.circles||[]});delete initial.dynamic;drawCustom(el,initial);
            el.innerHTML+='<div class="figure-placeholder" role="status">'+esc(error.message)+' Для окружности введите допустимые координаты центра и радиус.</div>';
          }else if(t.visual.dynamic&&t.visual.dynamic.kind==="calibration"){
            var original=Object.assign({},t.visual);delete original.dynamic;drawCustom(el,original);
            el.innerHTML+='<div class="figure-placeholder" role="status">'+esc(error.message)+'</div>';
          }else el.innerHTML='<div class="figure-placeholder" role="status">'+esc(error.message)+' Чертёж появится после ввода допустимых значений.</div>';
        }
      }
    });
  }
  function check(){
    var t=task();if(!t)return;var s=ts(t),result;
    try{result=checkTask(t,s);}catch(e){state.feedback={kind:"invalid",text:e.message,ok:false};render();return;}
    var alreadySolved=!!(progress[t.id]&&progress[t.id].successful>0);
    var fingerprint=answerFingerprint(s);
    if(!result.ok || s.successFingerprint!==fingerprint) record(t,result.ok);
    if(result.ok) s.successFingerprint=fingerprint;
    else {s.helpUsed=true;pauseAfterHelp(t);}
    recordReview(t,result.ok,alreadySolved);
    var message=result.ok?(t.explanation||"Получилось."):t.hint;
    if(!result.ok&&Array.isArray(t.diagnostics)&&t.type==="number"){
      try{var entered=evaluate(s.answer),diagnostic=t.diagnostics.find(function(d){return typeof d.value==="number"&&close(entered,d.value);});if(diagnostic)message=diagnostic.message;}catch(_){}
    }
    if(t.type==="counterexample"&&result.details){
      var d=result.details[0];
      if(result.ok&&result.certified&&fmt(d.left)===fmt(d.right))message="Контрпример найден. При округлении разница не видна, но равенство нарушается. "+t.explanation;
      else message=result.ok?"Найден контрпример: слева "+fmt(d.left)+", справа "+fmt(d.right)+". "+t.explanation:"При этом значении равенство выполняется. Одно совпадение не доказывает общее правило. Попробуйте другое число.";
    }
    if(t.type==="counterexample"&&result.certified&&!result.details)message=(result.ok?"Контрпример найден. ":"При этом значении равенство выполняется. ")+(t.criterionExplanation||t.explanation);
    if(t.type==="build"&&result.details&&!result.ok){
      var wrong=result.details.find(function(d){return !d.ok;});
      if(wrong&&wrong.op==="eq")message="Получились разные значения: "+fmt(wrong.left)+" и "+fmt(wrong.right)+". "+t.hint;
    }
    if(t.type==="triangleGate"&&!result.ok)message="Три стороны должны образовать фигуру, которая не лежит на одной прямой. "+t.hint;
    if(t.type==="battle"&&result.signMismatch)message=(result.sumOK?"Сумма найдена верно. ":"")+(t.a+t.b===0?"Положительных и отрицательных единиц поровну: сумма равна нулю. Выберите ноль.":"Проверьте выбранный знак: он должен совпадать со знаком оставшихся единиц. Прогноз можно изменить после работы с парами.");
    state.feedback={kind:result.ok?"good":"bad",text:message,ok:result.ok};render();
  }
  root.addEventListener("click",function(e){
    var b=e.target.closest("button[data-action]");if(!b)return;var action=b.dataset.action,t=task(),s=t?ts(t):null,i=Number(b.dataset.index);
    if(action==="check"){check();return;}
    if(action==="check-format"){checkExamFormat();return;}
    if(action==="route"){openRoute(b.dataset.route,b.dataset.fresh==="true");state.feedback=null;render();return;}
    if(action==="open-task"){openTask(b.dataset.task);state.feedback=null;render();return;}
    if(action==="variant"){openVariant(b.dataset.family);state.feedback=null;render();return;}
    if(action==="review"){openVariant(b.dataset.family,state.reviews[b.dataset.family]);state.feedback=null;render();return;}
    if(action==="return"){returnContext();render();return;}
    if(action==="queue-review"){if(t)queueReview(t);render();return;}
    if(action==="skip-workshop"){
      if(run()&&t&&t.learningMode==="creative"){
        var skipped=run().skipped||(run().skipped=[]);
        if(!(progress[t.id]&&progress[t.id].successful>0)&&skipped.indexOf(t.id)<0)skipped.push(t.id);
        setIndex(index()+1);state.feedback=null;render();
      }
      return;
    }
    if(action==="prerequisite"){
      var targetTopic=topics.find(function(top){return top.skills.some(function(sk){return sk.id===b.dataset.skill;});});
      if(targetTopic){
        rememberContext();state.activeRun=null;state.topic=targetTopic.id;state.skill=b.dataset.skill;state.map=true;
        var chosen=targetTopic.creative.findIndex(function(q){return q.skillId===b.dataset.skill;});
        if(chosen>=0){state.mode="creative";state.creativeIndices[targetTopic.id]=chosen;}else state.mode="quick";
        state.feedback=null;render();
      }
      return;
    }
    if(action==="topic"){state.topic=b.dataset.topic;state.skill=null;state.map=false;state.activeRun=null;state.seriesPicker=false;}
    if(action==="mode"){state.mode=b.dataset.mode;state.activeRun=null;}
    if(action==="map"){state.map=!state.map;}
    if(action==="skill"){state.skill=b.dataset.skill;}
    if(action==="creative"||action==="open-creative"){if(run()||action==="open-creative")rememberContext();state.activeRun=null;state.mode="creative";state.creativeIndices[state.topic]=i;}
    if(action==="restart"){state.activeRun=null;state.indices[state.topic]=0;topic().quick.forEach(function(q){delete state.taskStates[q.id];});}
    if(action==="next"){
      if(!run()&&state.mode==="creative" && index()+1>=list().length)state.mode="quick";else setIndex(index()+1);
    }
    if(!s){state.feedback=null;render();return;}
    if(action==="hint"){s.hint=!s.hint;if(s.hint)noteHelp(t,false);}
    if(action==="solution"){s.revealed=!s.revealed;if(s.revealed)noteHelp(t,true);}
    if(["option","probe","model","up","down","sign","cancel","partition","ball"].indexOf(action)>=0){s.examFeedback=null;s.formatSucceeded=false;}
    if(action==="option"){
      if(t.type==="choice")s.selected=[i];
      else{s.selected=s.selected.indexOf(i)>=0?s.selected.filter(function(v){return v!==i;}):s.selected.concat([i]);}
    }
    if(action==="probe"&&t.type==="experiment"){
      var value=Number(b.dataset.value);
      if(t.probeValues.indexOf(value)>=0&&s.probes.indexOf(value)<0)s.probes.push(value);
    }
    if(action==="model"&&t.type==="experiment")s.modelId=b.dataset.value;
    if(action==="up"||action==="down"){var j=i+(action==="up"?-1:1);if(j>=0&&j<s.order.length){var v=s.order[i];s.order[i]=s.order[j];s.order[j]=v;}}
    if(action==="sign")s.sign=b.dataset.value;
    if(action==="cancel")s.cancel=Math.min(Math.abs(t.a),Math.abs(t.b),s.cancel+1);
    if(action==="partition")s.partition=Number(b.dataset.value);
    if(action==="ball")s.red=s.red.indexOf(i)>=0?s.red.filter(function(v){return v!==i;}):s.red.concat([i]);
    state.feedback=null;render();
  });
  root.addEventListener("input",function(e){
    var el=e.target,field=el.dataset.field,t=task();if(!field||!t)return;var s=ts(t);
    if(field==="exam-answer"){
      s.examAnswer=el.value;s.examFeedback=null;s.formatSucceeded=false;
      root.querySelectorAll(".format-feedback").forEach(function(n){n.remove();});saveSession();return;
    }
    if(s.examFeedback){s.examFeedback=null;s.formatSucceeded=false;root.querySelectorAll(".format-feedback").forEach(function(n){n.remove();});}
    clearAnswerFeedback();
    if(field==="answer")s.answer=el.value;
    if(field==="build")s.values[el.dataset.name]=el.value;
    if(field==="k"||field==="b"){
      s[field]=Number(el.value);
      var out=root.querySelector("#"+field+"-output");if(out)out.textContent=fmt(s[field]);
      var f=root.querySelector("#graph-formula");if(f)f.textContent=lineFormula(s.k,s.b);
    }
    if(field==="skew")s.skew=Number(el.value);
    if(["k","b","skew","answer","build"].indexOf(field)>=0)drawAll();
    saveSession();
  });
  root.addEventListener("change",function(e){
    var el=e.target,field=el.dataset.field;
    if(field==="topic"){state.topic=el.value;state.skill=null;state.map=false;state.feedback=null;state.activeRun=null;state.seriesPicker=false;render();}
    if(field==="match"&&task()){
      ts(task()).matches[el.dataset.index]=el.value;
      ts(task()).examFeedback=null;ts(task()).formatSucceeded=false;
      root.querySelectorAll(".format-feedback").forEach(function(n){n.remove();});
      clearAnswerFeedback();
      saveSession();
    }
  });
  root.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.tagName==="INPUT"&&e.target.type==="text"){e.preventDefault();if(e.target.dataset.field==="exam-answer")checkExamFormat();else check();}});
  root.addEventListener("toggle",function(e){if(e.target.matches(".teacher"))state.teacher=e.target.open;if(e.target.matches(".series-picker"))state.seriesPicker=e.target.open;if(e.target.matches(".exam-format")&&task()){ts(task()).examOpen=e.target.open;saveSession();}},true);
  var resize=new ResizeObserver(function(){drawAll();});resize.observe(root);
  window.OGESkillLab=Object.assign(api,{state:state,progress:progress,render:render,task:task,taskState:ts,data:data,series:series,openRoute:openRoute,openTask:openTask,openVariant:openVariant,returnContext:returnContext});
  restoreSession();
  applyLocation();
  window.addEventListener("popstate",function(){applyLocation();render();});
  render();
}());
