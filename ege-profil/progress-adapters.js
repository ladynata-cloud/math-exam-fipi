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

  /* Форма данных. Записи из localStorage и из присланного кода могут
     оказаться мусором: строка, массив, null, NaN вместо числа. Мусор — это
     «нет данных»: адаптер не падает и не выводит NaN, undefined или чужую
     строку в подпись. */
  function isObj(o){ return !!o && typeof o === "object" && !Array.isArray(o); }
  /* конечное положительное число, иначе 0 */
  function num(v){ return (typeof v === "number" && isFinite(v) && v > 0) ? v : 0; }
  /* счётчик: целое неотрицательное, иначе 0 */
  function cnt(v){ return Math.floor(num(v)); }
  /* запись тренажёра в главном ключе — только объект */
  function rec(tid){
    var all = read(KEY);
    return (isObj(all) && isObj(all[tid])) ? all[tid] : null;
  }
  /* попытки пробника, у которых есть оба числа результата */
  function examAttempts(d){
    if (!isObj(d) || !Array.isArray(d.attempts)) return [];
    return d.attempts.filter(function(a){
      return isObj(a) && typeof a.primary === "number" && isFinite(a.primary) &&
             typeof a.test === "number" && isFinite(a.test);
    });
  }

  /* id задач банка стерео-линейки: номер открытого банка (Решу ЕГЭ) или
     id новой задачи задания 3 по теме; «Развёртки» razv-* — отдельно. */
  var STEREO_ID = /^(?:\d+|(?:kub|par|sost|priz|pir|cil|kon|shar|komb)-\d+)$/;
  var STEREO_RAZV = /^razv-\d+$/;
  var STEREO_TOTAL = 281;
  /* треки вкладки «Тренажёр» производной (TRACKS в trainers/derivative-t8.html) */
  var DERIVATIVE_TRACKS = ["extrema", "onemax", "intpoints", "marked", "tangent", "parallel", "physics", "antider"];
  /* треки практикума тригонометрии (defaults().xp и TRACKS в trainers/trigonometry.html)
     и цель трека (GOAL там же) */
  var TRIG_TRACKS = ["table", "rad", "sign", "red", "ident", "eq", "sup"];
  var TRIG_GOAL = 8;
  /* зачёт «Планиметрии без промахов»: EXAM_N в trainers/planimetry-t1.html и
     MARATHON_N в генераторе ege-t1-planimetry-generator — по одной задаче
     каждого из 8 типов; passed пишут только при 8 из 8 чисто (EXAM_PASS /
     MARATHON_PASS там же) */
  var PLAN_EXAM_N = 8;

  function bar(host, ratio, label, done){
    host.innerHTML = "";
    if (ratio != null){
      var cells = document.createElement("div");
      cells.className = "cellsbar";
      cells.setAttribute("aria-hidden","true");
      /* Ненулевой прогресс — хотя бы одна клетка (1 из 30 не должен
         выглядеть как «ничего»), неполный — не больше девяти: вся полоса
         закрашена только при ratio >= 1. */
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
  var adapters = {
    none: function(host){ host.remove(); },
    stereo: function(host){
      /* Объединённая линейка курса: 281 задача задания 3 (номера открытого
         банка Решу ЕГЭ и новые kub-01…) плюс 7 «Развёрток» razv-*, которые
         к заданию 3 не относятся и в счёт не идут. Считаются только id,
         похожие на id банка; посторонние ключи и не-объекты — мусор. */
      var st = read("stereo3.status");
      if (!isObj(st)){ bar(host, null, "не начат"); return; }
      var ok = 0, seen = 0, k;
      for (k in st){
        if (!isObj(st[k])) continue;
        if (STEREO_RAZV.test(k)){ seen++; continue; }
        if (!STEREO_ID.test(k)) continue;
        seen++;
        if (st[k].st === "ok") ok++;
      }
      if (!seen){ bar(host, null, "не начат"); return; }
      if (!ok){ bar(host, null, "в работе"); return; }
      ok = Math.min(ok, STEREO_TOTAL);
      bar(host, ok/STEREO_TOTAL, "решено задач: " + ok + " из " + STEREO_TOTAL, ok >= STEREO_TOTAL);
    },
    trig: function(host){
      /* xp — { трек: очки }. Знаменатель постоянный: все 7 треков × 8 = 56.
         Испорченное значение трека — 0 очков, трек из знаменателя не выбывает
         (иначе недобранный практикум стал бы «выполнено»); посторонние ключи
         не в счёт. Ни одного трека с числом — данных нет, «не начат». */
      var d = read("ep_progress_v1");
      if (!isObj(d) || !isObj(d.xp)){ bar(host, null, "не начат"); return; }
      var sum = 0, any = false, goal = TRIG_TRACKS.length * TRIG_GOAL, v;
      for (var i = 0; i < TRIG_TRACKS.length; i++){
        v = d.xp[TRIG_TRACKS[i]];
        if (typeof v === "number" && isFinite(v)) any = true;
        sum += Math.min(TRIG_GOAL, cnt(v));
      }
      if (!any){ bar(host, null, "не начат"); return; }
      bar(host, sum/goal, "практикум: " + sum + " из " + goal + " очков", sum >= goal);
    },
    planimetry: function(host){
      /* passed ставят курс, trainers/ege-t1-planimetry-trainer.html и генератор
         только при 8 из 8 и не отзывают; best — лучший счёт зачёта/марафона
         из 8 у всех трёх. До 26.09.2026 passed ставился при любом счёте, поэтому
         отметка читается только вместе с best ≥ 8: старая запись {best:3, passed:true}
         показывает «лучший зачёт: 3 из 8» (хранилище не мигрируется, меняется
         только толкование; так же читают хабы курса и генератора). Без сдачи —
         «лучший зачёт: N из 8», как «зачёт: N из 10» у plan1y; ничего, кроме
         запусков, — «запусков: N». */
      var st = rec("ege-t1-planimetry-generator");
      if (!st){ bar(host, null, "не начат"); return; }
      if (st.passed === true && cnt(st.best) >= PLAN_EXAM_N){ bar(host, 1, "зачёт сдан ✓", true); return; }
      var best = Math.min(PLAN_EXAM_N, cnt(st.best));
      if (best){ bar(host, best/PLAN_EXAM_N, "лучший зачёт: " + best + " из " + PLAN_EXAM_N); return; }
      bar(host, null, "запусков: " + cnt(st.runs));
    },
    plan1y: function(host){
      var d = rec("ege-t1-yashchenko");
      if (!d){ bar(host, null, "не начат"); return; }
      var tp = isObj(d.types) ? d.types : {}, closed = 0, any = false, k;
      for (k in tp){
        if (!isObj(tp[k])) continue;
        if (num(tp[k].best) >= 3) closed++;
        if (cnt(tp[k].solved) > 0) any = true;
      }
      closed = Math.min(closed, 19);
      if (!closed && !cnt(d.runs) && !any){ bar(host, null, "в работе"); return; }
      var label = "типов закрыто: " + closed + " из 19";
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (num(d.best)) label += " · зачёт: " + num(d.best) + " из 10";
      bar(host, closed/19, label, d.passed === true && closed >= 19);
    },
    vec2y: function(host){
      var d = rec("ege-t2-yashchenko");
      if (!d){ bar(host, null, "не начат"); return; }
      var tp = isObj(d.types) ? d.types : {}, closed = 0, any = false, k;
      for (k in tp){
        if (!isObj(tp[k])) continue;
        if (num(tp[k].best) >= 3) closed++;
        if (cnt(tp[k].solved) > 0) any = true;
      }
      closed = Math.min(closed, 7);
      var label = "типов закрыто: " + closed + " из 7";
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (num(d.best)) label += " · зачёт: " + num(d.best) + " из 7";
      if (!closed && !cnt(d.runs) && !any){ bar(host, null, "в работе"); return; }
      bar(host, closed/7, label, closed >= 7 && d.passed === true);
    },
    righttri: function(host){
      var d = rec("righttri-t1");
      var tp = d && isObj(d.topics) ? d.topics : null;
      if (!tp){ bar(host, null, "не начат"); return; }
      var sum = 0, solved = 0, k;
      for (k in tp){
        if (!(+k >= 1 && +k <= 5) || !isObj(tp[k])) continue;
        sum += Math.min(3, cnt(tp[k].correct));
        solved += cnt(tp[k].solved);
      }
      if (!sum && !solved){ bar(host, null, "в работе"); return; }
      bar(host, sum/15, "чистые серии: " + sum + " из 15 · решено: " + solved, sum >= 15);
    },
    finance: function(host){
      /* Решённая задача — запись в stats.doneTasks (ставится при верном
         итоговом ответе); задач в тренажёре 14. */
      var st = rec("financeNonstandardTrainer");
      if (!st){ bar(host, null, "не начат"); return; }
      var dt = isObj(st.stats) ? st.stats.doneTasks : null;
      var done = isObj(dt) ? Object.keys(dt).length : 0;
      if (!done){ bar(host, null, "в работе"); return; }
      bar(host, Math.min(1, done/14), "решено задач: " + Math.min(done, 14) + " из 14", done >= 14);
    },
    stp: function(host){
      var s = read("trig-stp-trainer-v2");
      var p = isObj(s) && isObj(s.progress) ? s.progress : null;
      if (!p){ bar(host, null, "не начат"); return; }
      var flags = [p.pqIntroDone];
      ["ssum","sdiff","csum","cdiff"].forEach(function(l){
        var x = isObj(p[l]) ? p[l] : {};
        flags.push(!!x.derive, !!x.assemble, !!x.product);
      });
      var doneCount = flags.filter(Boolean).length;
      var label = "шагов: " + doneCount + " из 13";
      if (num(p.testBest)) label += " · тест: " + num(p.testBest);
      bar(host, doneCount/13, label, doneCount >= 13);
    },
    derivative: function(host){
      /* Зачёт — passed/best/runs; решённые во вкладке «Тренажёр» —
         solvedByType { трек: число }. Пока зачёта не было, полоса идёт
         по охвату треков: 8 треков × 3 задачи = 24, от каждого известного
         трека в счёт идут не больше трёх решённых (24 задачи одного трека
         не закрашивают всю полосу). Подпись — фактическое число решённых
         по известным трекам. Мусорные значения не в счёт. */
      var d = rec("derivative-t8");
      if (!d){ bar(host, null, "не начат"); return; }
      if (d.passed === true){ bar(host, 1, "зачёт сдан ✓", true); return; }
      var best = num(d.best);
      if (best){ bar(host, best/10, "зачёт: лучший результат " + best + " из 10"); return; }
      var by = isObj(d.solvedByType) ? d.solvedByType : {}, n = 0, cover = 0;
      DERIVATIVE_TRACKS.forEach(function(t){
        if (!Object.prototype.hasOwnProperty.call(by, t)) return;
        var c = cnt(by[t]);
        n += c; cover += Math.min(3, c);
      });
      if (n){ bar(host, cover/24, "решено задач: " + n); return; }
      bar(host, null, "запусков зачёта: " + cnt(d.runs));
    },
    p14: function(host){
      var d = rec("stereo-t14");
      if (!d){ bar(host, null, "не начат"); return; }
      var tasks = isObj(d.tasks) ? d.tasks : {}, n = 0, k;
      for (k in tasks){ if (isObj(tasks[k]) && tasks[k].proof && tasks[k].b) n++; }
      n = Math.min(n, 6);
      var drill = num(d.drillBest);
      if (!n && !drill){ bar(host, null, "в работе"); return; }
      var label = "разобрано задач: " + n + " из 6";
      if (d.passed === true) label += " · счёт зачтён ✓";
      else if (drill) label += " · счёт: " + drill + " из 8";
      bar(host, n/6, label, n >= 6 && d.passed === true);
    },
    p17: function(host){
      var d = rec("planimetry-t17");
      var tasks = d && isObj(d.tasks) ? d.tasks : null;
      if (!tasks){ bar(host, null, "не начат"); return; }
      var n = 0;
      for (var k in tasks){ if (isObj(tasks[k]) && tasks[k].b) n++; }
      n = Math.min(n, 6);
      if (!n){ bar(host, null, "в работе"); return; }
      bar(host, n/6, "решено задач: " + n + " из 6", n >= 6);
    },
    p18: function(host){
      var d = rec("parameters-t18");
      if (!d){ bar(host, null, "не начат"); return; }
      var n = isObj(d.keys) ? Math.min(6, Object.keys(d.keys).length) : 0;
      var drill = num(d.drillBest);
      if (!n && !drill && d.passed !== true){ bar(host, null, "в работе"); return; }
      var label = "ключей: " + n + " из 6";
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (drill) label += " · дриллы: " + drill + " из 8";
      bar(host, n/6, label, d.passed === true && n >= 6);
    },
    numbers: function(host){
      var d = rec("numbers-t19");
      if (!d){ bar(host, null, "не начат"); return; }
      var pts = 0, tasks = isObj(d.tasks) ? d.tasks : {};
      for (var k in tasks){
        if (!isObj(tasks[k])) continue;
        if (tasks[k].a) pts++;
        if (tasks[k].b) pts++;
        if (tasks[k].c) pts++;
      }
      pts = Math.min(pts, 18);
      var drill = num(d.drillBest);
      if (!pts && !drill && d.passed !== true){ bar(host, null, "в работе"); return; }
      var label = "пунктов: " + pts + " из 18";
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (drill) label += " · зачёт: " + drill + " из 8";
      bar(host, pts/18, label, d.passed === true && pts >= 18);
    },
    prob: function(host){
      var d = rec("probability-t45");
      if (!d){ bar(host, null, "не начат"); return; }
      var n = cnt(d.solved4) + cnt(d.solved5);
      var label = "решено задач: " + n;
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (num(d.best)) label += " · зачёт: " + num(d.best) + " из 10";
      bar(host, Math.min(1, n/30), label, d.passed === true);
    },
    applied: function(host){
      var d = rec("applied-t910");
      if (!d){ bar(host, null, "не начат"); return; }
      var n = cnt(d.solved9) + cnt(d.solved10);
      var label = "решено задач: " + n;
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (num(d.best)) label += " · зачёт: " + num(d.best) + " из 8";
      bar(host, Math.min(1, n/24), label, d.passed === true);
    },
    funcs: function(host){
      var d = rec("functions-t1112");
      if (!d){ bar(host, null, "не начат"); return; }
      var n = cnt(d.solved11) + cnt(d.solved12);
      var label = "решено задач: " + n;
      if (d.passed === true) label += " · зачёт сдан ✓";
      else if (num(d.best)) label += " · зачёт: " + num(d.best) + " из 10";
      bar(host, Math.min(1, n/30), label, d.passed === true);
    },
    expert: function(host){
      var d = rec("expert-t");
      var done = d && isObj(d.done) ? d.done : null;
      if (!done){ bar(host, null, "не начат"); return; }
      var n = 0, hit = 0, k;
      for (k in done){ if (!isObj(done[k])) continue; n++; if (done[k].hit) hit++; }
      n = Math.min(n, 12); hit = Math.min(hit, n);
      if (!n){ bar(host, null, "не начат"); return; }
      bar(host, n/12, "проверено работ: " + n + " из 12 · вердикт совпал: " + hit, n >= 12 && hit >= 10);
    },
    fullexam: function(host){
      /* в счёт идут только попытки с числовыми первичным и тестовым баллами */
      var at = examAttempts(rec("full-exam"));
      if (!at.length){ bar(host, null, "не начат"); return; }
      var last = at[at.length - 1], best = 0, i;
      for (i = 0; i < at.length; i++) best = Math.max(best, num(at[i].test));
      bar(host, best/100, "последний: " + cnt(last.primary) + " перв. · " + num(last.test) + " тест. · лучший: " + best, best >= 100);
    },
    review: function(host){
      /* То же правило записи, что entry() и keyOk() в registry.js (страница
         «Работа над ошибками»): ключ «TID|тип», запись — объект, w — число ≥ 0,
         r и метки времени — числа ≥ 0 или их нет. Иначе запись не в счёт.
         Менять — в обоих местах: гейт tests/cabinet-safety-test.js сверяет
         этот счёт с RV.open()/RV.closed() на сгенерированных записях. */
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
    },
    exam: function(host){
      /* profile-ege-course-v1.progress — { номер линии 1…19: { attempts, correct, … } } */
      var d = read("profile-ege-course-v1");
      var pr = isObj(d) && isObj(d.progress) ? d.progress : null;
      if (!pr){ bar(host, null, "не начат"); return; }
      var touched = 0;
      for (var k in pr){
        if (!/^(?:[1-9]|1[0-9])$/.test(k) || !isObj(pr[k])) continue;
        if (cnt(pr[k].attempts) || cnt(pr[k].correct)) touched++;
      }
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
      var A = read(KEY);
      if (!isObj(A)) A = {};
      var attempts = examAttempts(A["full-exam"]);
      var firstIds = ["probability-t45", "derivative-t8", "applied-t910", "functions-t1112"];
      var secondIds = ["stereo-t14", "planimetry-t17", "parameters-t18", "numbers-t19"];
      var passedOne = function(id){ return isObj(A[id]) && A[id].passed === true; };
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
           route:route, mount:mount, liveStore:liveStore, snapshotStore:snapshotStore,
           STEREO_ID:STEREO_ID, STEREO_TOTAL:STEREO_TOTAL, DERIVATIVE_TRACKS:DERIVATIVE_TRACKS,
           TRIG_TRACKS:TRIG_TRACKS, TRIG_GOAL:TRIG_GOAL };
})();
if (typeof module !== "undefined") module.exports = PROGRESS;
