/* =========================================================================
   АДАПТЕРЫ ПРОГРЕССА КУРСА ОГЭ — общие для index.html и teacher.html.
   Движок повторяет ege-profil/progress-adapters.js; адаптеры — по контракту
   docs/OGE_PROGRESS_CONTRACT.md, раздел 7.

   Каждый адаптер получает узел [data-progress] и рисует в нём полоску с
   подписью. Данные адаптер берёт не напрямую из localStorage, а из
   «хранилища»: liveStore() — этот браузер, snapshotStore(obj) — объект
   mathExamCourseProgress.v1, присланный кодом прогресса.

   Узел линии: <span data-progress="line" data-tid="oge-task16-circle">.
   Типы линии берутся из реестра (RV.TYPES), не из хранилища; без RV на
   странице адаптер line честно показывает «нет реестра».

   Ключ localStorage, TID и формат прогресса не меняются.
   ========================================================================= */
var PROGRESS = (function(){
  "use strict";
  var KEY = "mathExamCourseProgress.v1";
  var ANALOGUE_KEY = "mathExamOge2027Analogue1.v2";
  var PER_TYPE = 3;                 /* от каждого типа в счёт охвата не больше трёх */
  var PLOT_TIDS = ["practiceRoadsGridTrainer", "practiceRoadsSchemaTrainer", "practiceTiresTrainer",
                   "practiceStovesTrainer", "practiceLandPlotsTrainer", "practiceApartmentsTrainer",
                   "practiceTariffsTrainer", "practicePaperSheetsTrainer"];
  var STORE = null;

  function readLocal(key){
    try{ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  }
  /* Живой браузер: доступен и главный ключ, и побочные ключи. */
  function liveStore(){ return { live:true, main:null, side:readLocal }; }
  /* Снимок: только главный ключ. Побочные ключи (аналог-2027) в код прогресса
     не входят, поэтому их адаптеры честно покажут «не начат». */
  function snapshotStore(obj){
    return { live:false, main:(obj && typeof obj === "object" && !Array.isArray(obj)) ? obj : {}, side:function(){ return null; } };
  }
  function read(key){
    if (!STORE) return null;
    if (key === KEY) return STORE.live ? readLocal(KEY) : STORE.main;
    return STORE.side(key);
  }

  /* Форма данных: мусор — это «нет данных», без NaN и чужих строк в подписи. */
  function isObj(o){ return !!o && typeof o === "object" && !Array.isArray(o); }
  function num(v){ return (typeof v === "number" && isFinite(v) && v > 0) ? v : 0; }
  function cnt(v){ return Math.floor(num(v)); }
  function rec(tid){
    var all = read(KEY);
    return (isObj(all) && isObj(all[tid])) ? all[tid] : null;
  }
  function registry(){
    return (typeof RV !== "undefined" && RV && isObj(RV.TYPES)) ? RV : null;
  }

  function bar(host, ratio, label, done){
    host.innerHTML = "";
    if (ratio != null){
      var cells = document.createElement("div");
      cells.className = "cellsbar";
      cells.setAttribute("aria-hidden","true");
      /* Ненулевой прогресс — хотя бы одна клетка, неполный — не больше
         девяти: вся полоса закрашена только при ratio >= 1. */
      var filled = 0;
      if (ratio > 0) filled = ratio >= 1 ? 10 : Math.min(9, Math.max(1, Math.round(ratio*10)));
      for (var i=0;i<10;i++){
        var s = document.createElement("span");
        if (i < filled) s.className = "filled";
        cells.appendChild(s);
      }
      host.appendChild(cells);
    }
    var txt = document.createElement("span");
    txt.className = "txt" + (done ? " done" : "");
    txt.textContent = label;
    host.appendChild(txt);
  }

  /* Ядро записи линии: охват типов — от каждого типа не больше PER_TYPE
     решённых, знаменатель PER_TYPE × число типов; зачёт сдан — полная
     полоса. Возвращает числа, чтобы тесты и кабинет считали одинаково. */
  function lineStats(d, typeIds){
    var out = { started:false, passed:false, best:0, total:0, solved:0, covered:0, denom:PER_TYPE * typeIds.length };
    if (!isObj(d)) return out;
    out.started = true;
    out.passed = d.passed === true;
    out.best = cnt(d.best);
    out.total = cnt(d.total);
    var sbt = isObj(d.solvedByType) ? d.solvedByType : {};
    for (var i = 0; i < typeIds.length; i++){
      var v = cnt(sbt[typeIds[i]]);
      out.solved += v;
      out.covered += Math.min(PER_TYPE, v);
    }
    return out;
  }

  /* Попытки пробника: только с числовым первичным баллом. */
  function examAttempts(d){
    if (!isObj(d) || !Array.isArray(d.attempts)) return [];
    return d.attempts.filter(function(a){
      return isObj(a) && typeof a.primary === "number" && isFinite(a.primary) && a.primary >= 0;
    });
  }

  var adapters = {
    none: function(host){ host.remove(); },
    line: function(host){
      var tid = host.getAttribute("data-tid") || "";
      var R = registry();
      if (!R || !tid){ bar(host, null, "нет реестра"); return; }
      var ids = R.typesOf(tid);
      var st = lineStats(rec(tid), ids);
      if (!st.started){ bar(host, null, "не начат"); return; }
      if (st.passed){
        bar(host, 1, "зачёт сдан ✓" + (st.total ? " · " + st.best + " из " + st.total : ""), true);
        return;
      }
      if (!st.solved && !st.best){ bar(host, null, "в работе"); return; }
      var label = "решено задач: " + st.solved;
      if (st.total) label += " · зачёт: " + st.best + " из " + st.total;
      /* без сданного зачёта полоса не бывает полной: охват типов даёт не больше 9 клеток */
      bar(host, st.denom ? Math.min(0.99, st.covered/st.denom) : 0, label, false);
    },
    plots: function(host){
      /* Линия 1–5: сюжет освоен — mastered:true (после задачи 05); до неё
         считается solved >= total > 0, как на карте. */
      var all = read(KEY);
      if (!isObj(all)){ bar(host, null, "не начат"); return; }
      var seen = 0, done = 0;
      for (var i = 0; i < PLOT_TIDS.length; i++){
        var d = all[PLOT_TIDS[i]];
        if (!isObj(d)) continue;
        seen++;
        if (d.mastered === true || (cnt(d.total) > 0 && cnt(d.solved) >= cnt(d.total))) done++;
      }
      if (!seen){ bar(host, null, "не начат"); return; }
      bar(host, done/PLOT_TIDS.length, "освоено сюжетов: " + done + " из " + PLOT_TIDS.length, done >= PLOT_TIDS.length);
    },
    diagnostic: function(host){
      var d = rec("practiceEntryDiagnostic2026");
      if (!d){ bar(host, null, "не пройдена"); return; }
      var best = Math.min(10, cnt(d.best));
      if (d.completed !== true && !best){ bar(host, null, "в работе"); return; }
      bar(host, best/10, "лучший результат: " + best + " из 10", best >= 10);
    },
    exam: function(host){
      var at = examAttempts(rec("oge-full-exam"));
      if (!at.length){ bar(host, null, "не начат"); return; }
      var last = at[at.length - 1], best = 0, i;
      for (i = 0; i < at.length; i++) best = Math.max(best, Math.min(31, cnt(at[i].primary)));
      var mark = (typeof last.mark === "number" && last.mark >= 2 && last.mark <= 5) ? " · отметка " + last.mark : "";
      bar(host, best/31, "последний: " + Math.min(31, cnt(last.primary)) + " из 31" + mark + " · лучший: " + best, best >= 31);
    },
    analogue: function(host){
      /* Побочный ключ аналога-2027: живой браузер; в снимке — «не начат». */
      var d = read(ANALOGUE_KEY);
      if (!isObj(d) || !Array.isArray(d.entries)){ bar(host, null, "не начат"); return; }
      var auto = 0, manual = 0, touched = 0;
      for (var i = 0; i < d.entries.length && i < 25; i++){
        var e = d.entries[i];
        if (!isObj(e)) continue;
        if (e.checked === true || e.input) touched++;
        if (i < 19 && e.correct === true && (e.credit === "independent" || e.credit === "assisted")) auto++;
        if (i >= 19 && typeof e.manual === "number" && isFinite(e.manual)) manual += Math.min(2, Math.max(0, Math.floor(e.manual)));
      }
      if (!touched){ bar(host, null, "не начат"); return; }
      var sum = auto + manual;
      bar(host, sum/31, "часть 1: " + auto + " из 19 · часть 2: " + manual + " из 12", sum >= 31);
    },
    review: function(host){
      /* То же правило записи, что entry() и keyOk() в registry.js. Менять — в
         обоих местах: гейт tests/cabinet-safety-test.js сверяет этот счёт с
         RV.open()/RV.closed() на сгенерированных записях. */
      var all = read(KEY);
      var mk = isObj(all) && isObj(all.mistakes) ? all.mistakes : null;
      if (!mk){ bar(host, null, "журнал пуст"); return; }
      var open = 0, closed = 0, k, e, i;
      function opt(v, max){ return v === undefined || (typeof v === "number" && isFinite(v) && v >= 0 && v <= max); }
      for (k in mk){
        if (!Object.prototype.hasOwnProperty.call(mk, k)) continue;
        i = k.indexOf("|");
        if (!(i > 0 && i < k.length - 1)) continue;
        e = mk[k];
        if (!isObj(e) || e.w === undefined || !opt(e.w, Infinity) || !opt(e.r, Infinity) ||
            !opt(e.lastWrong, 8.64e15) || !opt(e.last, 8.64e15)) continue;
        if (cnt(e.w) > 0){ if (cnt(e.r) >= 3) closed++; else open++; }
      }
      if (!open && !closed){ bar(host, null, "журнал пуст"); return; }
      bar(host, closed/(open + closed),
          open ? "к повтору: " + open + " · закрыто: " + closed : "все ошибки закрыты ✓", open === 0);
    }
  };

  /* Разложить адаптеры по узлам [data-progress] внутри root. */
  function apply(root, store){
    STORE = store || liveStore();
    Array.prototype.forEach.call(root.querySelectorAll("[data-progress]"), function(host){
      var fn = adapters[host.dataset.progress];
      if (fn){ try{ fn(host); }catch(e){ host.remove(); } }
      else host.remove();
    });
  }

  /* Маршрут «с чего начать»: 1 — диагностика 1–5 не пройдена; 2 — есть
     слабые сюжеты (weakTopics) или не освоена линия 1–5; 3 — первая часть:
     ещё нет 8 линий с зачётом, из них 2 геометрических (15–19); 4 — вторая
     часть и пробники. Без #routeSteps ничего не делает. */
  var FIRST_PART = ["oge-t6-vychisleniya", "oge-t7-pryamaya", "oge-t8-stepeni", "oge-t9-uravneniya",
                    "oge-t10-veroyatnost", "oge-t11-grafiki", "oge-t12-formuly", "oge-t13-neravenstva",
                    "oge-t14-progressii", "oge-t15-treugolniki", "oge-task16-circle", "oge17-chetyrehugolniki",
                    "oge18-kletki", "oge-t19-utverzhdeniya"];
  var GEOMETRY_FIRST = ["oge-t15-treugolniki", "oge-task16-circle", "oge17-chetyrehugolniki", "oge18-kletki", "oge-t19-utverzhdeniya"];
  function routeStep(A){
    if (!isObj(A)) A = {};
    var diag = isObj(A.practiceEntryDiagnostic2026) ? A.practiceEntryDiagnostic2026 : null;
    if (!diag || diag.completed !== true) return 1;
    var weak = Array.isArray(diag.weakTopics) ? diag.weakTopics.filter(function(t){ return typeof t === "string"; }) : [];
    var plotsDone = 0;
    for (var i = 0; i < PLOT_TIDS.length; i++){
      var d = A[PLOT_TIDS[i]];
      if (isObj(d) && (d.mastered === true || (cnt(d.total) > 0 && cnt(d.solved) >= cnt(d.total)))) plotsDone++;
    }
    if (weak.length && plotsDone < PLOT_TIDS.length) return 2;
    var passed = function(id){ return isObj(A[id]) && A[id].passed === true; };
    var f = FIRST_PART.filter(passed).length, g = GEOMETRY_FIRST.filter(passed).length;
    if (f < 8 || g < 2) return 3;
    return 4;
  }
  function route(root, store){
    STORE = store || liveStore();
    try{
      var steps = root.querySelectorAll("#routeSteps li");
      if (!steps.length) return;
      var step = routeStep(read(KEY));
      Array.prototype.forEach.call(steps, function(li){
        li.classList.toggle("now", Number(li.getAttribute("data-step")) === step);
      });
      var msgs = {
        1: "Вы на шаге 1: начните с входной диагностики 1–5 — она покажет слабые сюжеты.",
        2: "Вы на шаге 2: закройте слабые сюжеты 1–5 и пробелы из ликбеза.",
        3: "Вы на шаге 3: первая часть до 8 баллов, из них не меньше 2 по геометрии (15–19).",
        4: "Вы на шаге 4: вторая часть и цикл «пробник → работа над ошибками»."
      };
      var nowEl = root.querySelector("#routeNow");
      if (nowEl) nowEl.textContent = msgs[step];
    }catch(e){}
  }
  function mount(root, store){ apply(root, store); route(root, store); }

  return { KEY:KEY, ANALOGUE_KEY:ANALOGUE_KEY, PER_TYPE:PER_TYPE, PLOT_TIDS:PLOT_TIDS,
           adapters:adapters, bar:bar, read:read, rec:rec, lineStats:lineStats, examAttempts:examAttempts,
           routeStep:routeStep, apply:apply, route:route, mount:mount,
           liveStore:liveStore, snapshotStore:snapshotStore };
})();
if (typeof module !== "undefined") module.exports = PROGRESS;
