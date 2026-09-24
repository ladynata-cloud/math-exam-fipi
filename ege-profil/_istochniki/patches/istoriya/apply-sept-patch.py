# -*- coding: utf-8 -*-
# Сентябрьская интеграция тренажёра «Прямоугольный треугольник: sin, cos, tg»
# (righttri-t1) в review.html и index.html.
#
# Источник: чат «Тренажёр прямоугольного треугольника: sin, cos, tg»
# (conversation 47d73a47-bdef-433a-a147-90dcded06ec0), ход 9, 5 сентября 2026.
# Правки воспроизведены дословно; изменён только каталог назначения.
#
# Запуск (исторический, на сборочной машине архива): python3 apply-sept-patch.py
#
# ВНИМАНИЕ. Якорь TRAINERS в review.html («… review:false }», без запятой)
# остаётся подстрокой собственной замены («… review:false },»), поэтому
# на голых assert-ах повторный запуск молча продублировал бы вставку.
# Отсюда guard ниже: если righttri-t1 уже вписан — скрипт останавливается
# и ничего не трогает. Сами якоря и замены — дословно из хода 9.

import io
import os
import sys

# Путь сборочной машины архива убран 24.09.2026 (машинных путей в репозитории
# не держим). Скрипт уже применён и лежит для истории, см. README.md рядом.
# Корень дерева курса задаётся только явно — переменной COURSE_ROOT.
ROOT = os.environ.get("COURSE_ROOT", "")
if not ROOT:
    raise SystemExit("история: скрипт уже применён 22.09.2026; корень курса — только через COURSE_ROOT")

# --- guard: правка уже применена? ---------------------------------------
for _f, _mark in (('review.html', '"righttri-t1":'),
                  ('index.html', 'data-progress="righttri"')):
    _t = io.open(os.path.join(ROOT, _f), encoding='utf-8').read()
    if _mark in _t:
        print(f'{_f}: интеграция righttri-t1 уже применена ({_mark}) — выхожу, ничего не меняю.')
        sys.exit(0)


def rep(path, pairs):
    full = os.path.join(ROOT, path)
    t = io.open(full, encoding='utf-8').read()
    for old, new, cnt in pairs:
        n = t.count(old)
        assert n == cnt, f'{path}: якорь x{n} (ждали {cnt}): {old[:90]!r}'
        t = t.replace(old, new)
    io.open(full, 'w', encoding='utf-8').write(t)
    print(f'{path}: {len(pairs)} правок OK')


# ---------------------------------------------------------------- review.html

NAMES16 = '''    "righttri-t1|t1-ratio":          { n:"sin/cos/tg по двум сторонам", line:1 },
    "righttri-t1|t1-side":           { n:"сторона по отношению (табличные тройки)", line:1 },
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
    "righttri-t1|t5-seg30":          { n:"отрезки гипотенузы при угле 30°", line:1 },'''

rep('review.html', [
  # 1. запись тренажёра в реестр TRAINERS
  ('    "derivative-t8":    { file:"trainers/derivative-t8.html",    title:"Производная по графику",   review:false }',
   '    "derivative-t8":    { file:"trainers/derivative-t8.html",    title:"Производная по графику",   review:false },\n    "righttri-t1":      { file:"trainers/pryamougolny-treugolnik-trenazher.html", title:"Прямоугольный треугольник", review:true }', 1),
  # 2. 16 человеческих названий типов в начало NAMES
  ('  var NAMES = {\n', '  var NAMES = {\n' + NAMES16 + '\n', 1),
])


# ----------------------------------------------------------------- index.html

CARD = '''      <article class="card">
        <p class="for">задание 1 · фундамент</p>
        <h3>Прямоугольный треугольник: sin, cos, tg</h3>
        <p>Шесть тем: от определений до углов между высотой, биссектрисой и медианой. Честный чертёж с новыми буквами каждый раз, лесенка шагов и адресный разбор типичных ошибок.</p>
        <p class="meta">6 тем · 16 типов задач · журнал ошибок</p>
        <div class="progress" data-progress="righttri"></div>
        <p class="open"><a class="btn" target="_blank" rel="noopener" href="trainers/pryamougolny-treugolnik-trenazher.html">Открыть</a></p>
      </article>

'''

ADAPTER = '''    righttri: function(host){
      var all = read("mathExamCourseProgress.v1");
      var d = all && all["righttri-t1"];
      var tp = d && d.topics;
      if (!tp){ bar(host, null, "не начат"); return; }
      var sum = 0, solved = 0, k;
      for (k in tp){ if (+k >= 1 && +k <= 5){ sum += Math.min(3, (tp[k] && tp[k].correct) || 0); solved += (tp[k] && tp[k].solved) || 0; } }
      if (!sum && !solved){ bar(host, null, "в работе"); return; }
      bar(host, sum/15, "чистые серии: " + sum + " из 15 · решено: " + solved, sum >= 15);
    },
'''

rep('index.html', [
  # карточка сразу после «Планиметрия без промахов»
  ('        <p class="open"><a class="btn" target="_blank" rel="noopener" href="trainers/planimetry-t1.html">Открыть</a></p>\n      </article>\n\n',
   '        <p class="open"><a class="btn" target="_blank" rel="noopener" href="trainers/planimetry-t1.html">Открыть</a></p>\n      </article>\n\n' + CARD, 1),
  # вторая pill в маршруте линии 1
  ('<a class="pill" target="_blank" rel="noopener" href="trainers/planimetry-t1.html">Планиметрия без промахов</a><a class="ghostlink" target="_blank" rel="noopener" href="exam/variant.html?m=1">вариант</a>',
   '<a class="pill" target="_blank" rel="noopener" href="trainers/planimetry-t1.html">Планиметрия без промахов</a><a class="pill" target="_blank" rel="noopener" href="trainers/pryamougolny-treugolnik-trenazher.html">Прямоугольный треугольник</a><a class="ghostlink" target="_blank" rel="noopener" href="exam/variant.html?m=1">вариант</a>', 1),
  # адаптер прогресса после planimetry
  ('      bar(host, null, "запусков: " + (st.runs || 0));\n    },\n',
   '      bar(host, null, "запусков: " + (st.runs || 0));\n    },\n' + ADAPTER, 1),
])

print('патчи сайта готовы')
