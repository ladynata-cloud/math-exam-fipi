/* =========================================================================
   АДАПТЕРЫ ПРОГРЕССА — общие для index.html и teacher.html.

   Каждый адаптер получает узел [data-progress] и рисует в нём полоску
   с подписью. Данные адаптер берёт не напрямую из localStorage, а из
   «хранилища»: liveStore() — этот браузер, snapshotStore(obj) — объект
   mathExamCourseProgress.v1, присланный кодом прогресса.

   Ключ localStorage, TID и формат прогресса не меняются.
   ========================================================================= */
var PROGRESS = (function(){
  "use strict";
  var KEY = "mathExamCourseProgress.v1";

  /* Активное хранилище. Ставится перед обходом узлов, читается адаптерами. */
  var STORE = null;

  function readLocal(key){
    try{ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  }
  /* Живой браузер: доступен и главный ключ, и побочные ключи тренажёров. */
  function liveStore(){ return { live:true, main:null, side:readLocal }; }
  /* Снимок: только главный ключ. Побочные ключи в код прогресса не входят,
     поэтому их адаптеры честно покажут «не начат». */
  function snapshotStore(obj){
    return { live:false, main:(obj && typeof obj === "object") ? obj : {}, side:function(){ return null; } };
  }
  function read(key){
    if (!STORE) return null;
    if (key === KEY) return STORE.live ? readLocal(KEY) : STORE.main;
    return STORE.side(key);
  }

  function bar(host, ratio, label, done){
    host.innerHTML = "";
    if (ratio != null){
      var cells = document.createElement("div");
      cells.className = "cellsbar";
      cells.setAttribute("aria-hidden","true");
      var filled = Math.max(0, Math.min(10, Math.round(ratio*10)));
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
  var adapters = {
    none: function(host){ host.remove(); },
    stereo: function(host){
      var st = read("stereo3.status");
      if (!st){ bar(host, null, "не начат"); return; }
      var ok = 0;
      for (var k in st){ if (st[k] && st[k].st === "ok") ok++; }
      bar(host, ok/143, "решено " + ok + " из 143", ok >= 143);
    },
    trig: function(host){
      var d = read("ep_progress_v1");
      if (!d || !d.xp){ bar(host, null, "не начат"); return; }
      var sum = 0, goal = 0;
      for (var t in d.xp){ sum += Math.min(8, d.xp[t] || 0); goal += 8; }
      if (!goal){ bar(host, null, "не начат"); return; }
      bar(host, sum/goal, "практикум: " + sum + " из " + goal + " очков", sum >= goal);
    },
    planimetry: function(host){
      var all = read("mathExamCourseProgress.v1");
      var st = all && all["ege-t1-planimetry-generator"];
      if (!st){ bar(host, null, "не начат"); return; }
      if (st.passed){ bar(host, 1, "зачёт сдан ✓", true); return; }
      bar(host, null, "запусков: " + (st.runs || 0));
    },
    plan1y: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["ege-t1-yashchenko"];
      if (!d){ bar(host, null, "не начат"); return; }
      var tp = d.types || {}, closed = 0, any = false, k;
      for (k in tp){ if ((tp[k].best || 0) >= 3) closed++; if ((tp[k].solved || 0) > 0) any = true; }
      if (!closed && !d.runs && !any){ bar(host, null, "в работе"); return; }
      var label = "типов закрыто: " + closed + " из 19";
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.best) label += " · зачёт: " + d.best + " из 10";
      bar(host, closed/19, label, d.passed && closed >= 19);
    },
    vec2y: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["ege-t2-yashchenko"];
      if (!d){ bar(host, null, "не начат"); return; }
      var tp = d.types || {}, closed = 0, k;
      for (k in tp) if ((tp[k].best || 0) >= 3) closed++;
      var label = "типов закрыто: " + closed + " из 7";
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.best) label += " · зачёт: " + d.best + " из 7";
      if (!closed && !d.runs && !hasAny(tp)){ bar(host, null, "в работе"); return; }
      bar(host, closed/7, label, closed >= 7 && d.passed);
      function hasAny(o){ for (var q in o) if ((o[q].solved || 0) > 0) return true; return false; }
    },
    righttri: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["righttri-t1"];
      var tp = d && d.topics;
      if (!tp){ bar(host, null, "не начат"); return; }
      var sum = 0, solved = 0, k;
      for (k in tp){ if (+k >= 1 && +k <= 5){ sum += Math.min(3, (tp[k] && tp[k].correct) || 0); solved += (tp[k] && tp[k].solved) || 0; } }
      if (!sum && !solved){ bar(host, null, "в работе"); return; }
      bar(host, sum/15, "чистые серии: " + sum + " из 15 · решено: " + solved, sum >= 15);
    },
    finance: function(host){
      var all = read("mathExamCourseProgress.v1");
      var st = all && all["financeNonstandardTrainer"];
      if (!st){ bar(host, null, "не начат"); return; }
      var n = Object.keys(st).length;
      if (!n){ bar(host, null, "не начат"); return; }
      bar(host, Math.min(1, n/27), "в работе: " + n + " из 27 задач", n >= 27);
    },
    stp: function(host){
      var s = read("trig-stp-trainer-v2");
      var p = s && s.progress;
      if (!p){ bar(host, null, "не начат"); return; }
      var flags = [p.pqIntroDone];
      ["ssum","sdiff","csum","cdiff"].forEach(function(l){
        var x = p[l] || {};
        flags.push(!!x.derive, !!x.assemble, !!x.product);
      });
      var doneCount = flags.filter(Boolean).length;
      var label = "шагов: " + doneCount + " из 13";
      if (p.testBest) label += " · тест: " + p.testBest;
      bar(host, doneCount/13, label, doneCount >= 13);
    },
    derivative: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["derivative-t8"];
      if (!d){ bar(host, null, "не начат"); return; }
      if (d.passed){ bar(host, 1, "зачёт сдан ✓", true); return; }
      if (d.best){ bar(host, d.best/10, "зачёт: лучший результат " + d.best + " из 10"); return; }
      bar(host, null, "запусков зачёта: " + (d.runs || 0));
    },
    p14: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["stereo-t14"];
      var tasks = d && d.tasks;
      if (!d){ bar(host, null, "не начат"); return; }
      var n = 0, k;
      for (k in (tasks || {})){ if (tasks[k] && tasks[k].proof && tasks[k].b) n++; }
      if (!n && !d.drillBest){ bar(host, null, "в работе"); return; }
      var label = "разобрано задач: " + n + " из 6";
      if (d.passed) label += " · счёт зачтён ✓";
      else if (d.drillBest) label += " · счёт: " + d.drillBest + " из 8";
      bar(host, n/6, label, n >= 6 && d.passed);
    },
    p17: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["planimetry-t17"];
      var tasks = d && d.tasks;
      if (!tasks){ bar(host, null, "не начат"); return; }
      var n = 0;
      for (var k in tasks){ if (tasks[k] && tasks[k].b) n++; }
      if (!n){ bar(host, null, "в работе"); return; }
      bar(host, n/6, "решено задач: " + n + " из 6", n >= 6);
    },
    p18: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["parameters-t18"];
      if (!d){ bar(host, null, "не начат"); return; }
      var n = d.keys ? Object.keys(d.keys).length : 0;
      if (!n && !d.drillBest && !d.passed){ bar(host, null, "в работе"); return; }
      var label = "ключей: " + n + " из 6";
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.drillBest) label += " · дриллы: " + d.drillBest + " из 8";
      bar(host, n/6, label, d.passed && n >= 6);
    },
    numbers: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["numbers-t19"];
      if (!d){ bar(host, null, "не начат"); return; }
      var pts = 0, tasks = d.tasks || {};
      for (var k in tasks){
        if (tasks[k].a) pts++;
        if (tasks[k].b) pts++;
        if (tasks[k].c) pts++;
      }
      if (!pts && !d.drillBest && !d.passed){ bar(host, null, "в работе"); return; }
      var label = "пунктов: " + pts + " из 18";
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.drillBest) label += " · зачёт: " + d.drillBest + " из 8";
      bar(host, pts/18, label, d.passed && pts >= 18);
    },
    prob: function(host){
      var d = (read("mathExamCourseProgress.v1") || {})["probability-t45"];
      if (!d){ bar(host, null, "не начат"); return; }
      var n = (d.solved4 || 0) + (d.solved5 || 0);
      var label = "решено задач: " + n;
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.best) label += " · зачёт: " + d.best + " из 10";
      bar(host, Math.min(1, n/30), label, d.passed);
    },
    applied: function(host){
      var d = (read("mathExamCourseProgress.v1") || {})["applied-t910"];
      if (!d){ bar(host, null, "не начат"); return; }
      var n = (d.solved9 || 0) + (d.solved10 || 0);
      var label = "решено задач: " + n;
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.best) label += " · зачёт: " + d.best + " из 8";
      bar(host, Math.min(1, n/24), label, d.passed);
    },
    funcs: function(host){
      var d = (read("mathExamCourseProgress.v1") || {})["functions-t1112"];
      if (!d){ bar(host, null, "не начат"); return; }
      var n = (d.solved11 || 0) + (d.solved12 || 0);
      var label = "решено задач: " + n;
      if (d.passed) label += " · зачёт сдан ✓";
      else if (d.best) label += " · зачёт: " + d.best + " из 10";
      bar(host, Math.min(1, n/30), label, d.passed);
    },
    expert: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["expert-t"];
      var done = d && d.done;
      if (!done){ bar(host, null, "не начат"); return; }
      var n = 0, hit = 0, k;
      for (k in done){ n++; if (done[k].hit) hit++; }
      if (!n){ bar(host, null, "не начат"); return; }
      bar(host, n/12, "проверено работ: " + n + " из 12 · вердикт совпал: " + hit, n >= 12 && hit >= 10);
    },
    fullexam: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["full-exam"];
      var at = d && d.attempts;
      if (!at || !at.length){ bar(host, null, "не начат"); return; }
      var last = at[at.length - 1], best = 0, i;
      for (i = 0; i < at.length; i++) best = Math.max(best, at[i].test || 0);
      bar(host, best/100, "последний: " + last.primary + " перв. · " + last.test + " тест. · лучший: " + best, best >= 100);
    },
    review: function(host){
      var all = read("mathExamCourseProgress.v1");
      var mk = all && all.mistakes;
      if (!mk){ bar(host, null, "журнал пуст"); return; }
      var open = 0, closed = 0, k, e;
      for (k in mk){
        e = mk[k];
        if ((e.w || 0) > 0){ if ((e.r || 0) >= 3) closed++; else open++; }
      }
      if (!open && !closed){ bar(host, null, "журнал пуст"); return; }
      bar(host, closed/(open + closed),
          open ? "к повтору: " + open + " · закрыто: " + closed : "все ошибки закрыты ✓", open === 0);
    },
    exam: function(host){
      var d = read("profile-ege-course-v1");
      var pr = d && d.progress;
      if (!pr){ bar(host, null, "не начат"); return; }
      var touched = 0;
      for (var k in pr){ if (pr[k] && (pr[k].attempts || pr[k].correct)) touched++; }
      if (!touched){ bar(host, null, "не начат"); return; }
      bar(host, touched/19, "затронуто линий: " + touched + " из 19", touched >= 19);
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

  /* Подсветка текущего шага маршрута. Без #routeSteps ничего не делает. */
  function route(root, store){
    STORE = store || liveStore();
    try{
      var steps = root.querySelectorAll("#routeSteps li");
      if (!steps.length) return;
      var A = read(KEY) || {};
      var attempts = (A["full-exam"] && A["full-exam"].attempts) || [];
      var firstIds = ["probability-t45", "derivative-t8", "applied-t910", "functions-t1112"];
      var secondIds = ["stereo-t14", "planimetry-t17", "parameters-t18", "numbers-t19"];
      var passedOne = function(id){ return !!(A[id] && A[id].passed); };
      var f = firstIds.filter(passedOne).length;
      var s2 = secondIds.filter(passedOne).length;
      var step = !attempts.length ? 1 : (f < firstIds.length ? 2 : (s2 < 2 ? 3 : 4));
      Array.prototype.forEach.call(steps, function(li){
        li.classList.toggle("now", Number(li.getAttribute("data-step")) === step);
      });
      var msgs = {
        1: "Вы на шаге 1: пробник ещё не написан — начните с диагностики.",
        2: "Вы на шаге 2: закрывайте зачёты первой части.",
        3: "Вы на шаге 3: пора во вторую часть — начните с 13-го и 15-го.",
        4: "Вы на шаге 4: держите цикл «пробник → работа над ошибками»."
      };
      var nowEl = root.querySelector("#routeNow");
      if (nowEl) nowEl.textContent = msgs[step];
    }catch(e){}
  }

  function mount(root, store){ apply(root, store); route(root, store); }

  return { KEY:KEY, adapters:adapters, bar:bar, read:read, apply:apply,
           route:route, mount:mount, liveStore:liveStore, snapshotStore:snapshotStore };
})();
if (typeof module !== "undefined") module.exports = PROGRESS;
