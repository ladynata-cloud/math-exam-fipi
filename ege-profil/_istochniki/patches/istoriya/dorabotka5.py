# -*- coding: utf-8 -*-
"""
Пять доработок по проходу «глазами ученика». Все правки с assert-якорями.

1. exam/variant.html — вторая попытка вместо мгновенной выдачи ответа.
2. trainers/interval-method.html — шапка и формулы на телефоне.
3. trainers/inequalities.html — починка setupSteps (краш init, полупустой
   первый экран) + поддержка #m0…#m9; навигатор ведёт сразу на модуль 9.
4. trainers/finance.html — режим «Учитель» за параметром ?teacher=1.
5. MathJax уже локализован отдельным шагом (lib/mathjax) — здесь только
   сопутствующие тексты не трогаем, их правит update-docs.
"""
import io
import os

# Путь сборочной машины архива убран 24.09.2026 (машинных путей в репозитории
# не держим). Скрипт уже применён и лежит для истории, см. README.md рядом.
# Корень дерева курса задаётся только явно — переменной COURSE_ROOT.
ROOT = os.environ.get("COURSE_ROOT", "")
if not ROOT:
    raise SystemExit("история: скрипт уже применён 22.09.2026; корень курса — только через COURSE_ROOT")


def rep(path, pairs):
    p = os.path.join(ROOT, path)
    t = io.open(p, encoding="utf-8").read()
    for old, new, cnt in pairs:
        n = t.count(old)
        assert n == cnt, "%s: якорь x%d (ждали %d): %r" % (path, n, cnt, old[:80])
        t = t.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(t)
    print("%-34s %d правок" % (path, len(pairs)))


# ---------- 1. Вторая попытка в отработке по линиям ----------
rep("exam/variant.html", [
    ('      const $ = (selector) => document.querySelector(selector);',
     '      const $ = (selector) => document.querySelector(selector);\n'
     '      let secondTry = false;   /* лестница: первая ошибка — ещё попытка, не ответ */', 1),
    ("""        const correct = Math.abs(value - currentTask.answer) < 1e-8;
        $("#feedback").className = `feedback ${correct ? "ok" : "bad"}`;""",
     """        const correct = Math.abs(value - currentTask.answer) < 1e-8;
        if (!correct && !secondTry) {
          secondTry = true;
          $("#feedback").className = "feedback hint";
          $("#feedback").innerHTML = "<strong>Пока неверно.</strong> Попробуйте ещё раз — вторая попытка. Подсказка рядом, если нужна.";
          $("#short-answer").select();
          return;
        }
        $("#feedback").className = `feedback ${correct ? "ok" : "bad"}`;""", 1),
    ("""        answered = false;
        renderModules();""",
     """        answered = false;
        secondTry = false;
        renderModules();""", 1),
])

# ---------- 2. Интервалы: шапка и формулы на телефоне ----------
rep("trainers/interval-method.html", [
    ("</head>",
     """<style>
/* курс: мобильная шапка и длинные формулы */
.navchips{min-width:0; flex:1 1 auto;}
mjx-container{max-width:100%; overflow-x:auto; overflow-y:hidden; padding-bottom:2px;}
@media (max-width:640px){
  .topbar-in{gap:10px; padding:8px 12px;}
  .brand-sub{display:none;}
}
</style>
</head>""", 1),
])

# ---------- 3. Неравенства: краш setupSteps + якоря модулей ----------
rep("trainers/inequalities.html", [
    ("""    const teach=sec.querySelector('details.teach');
    const ref=teach||sec.querySelector('.lesson-nav');
    if(ref) sec.insertBefore(card, ref); else sec.appendChild(card);""",
     """    let ref=sec.querySelector('details.teach')||sec.querySelector('.lesson-nav');
    while(ref&&ref.parentNode!==sec) ref=ref.parentNode;   /* insertBefore требует прямого потомка */
    if(ref) sec.insertBefore(card, ref); else sec.appendChild(card);""", 1),
    ("""  showView('home');
  updateProgress();""",
     """  showView('home');
  /* прямые ссылки на модуль: …inequalities.html#m8 открывает модуль 9 */
  const openFromHash=()=>{ const m=(location.hash||'').match(/^#(m\\d+|home)$/); if(m) showView(m[1]); };
  openFromHash();
  window.addEventListener('hashchange',openFromHash);
  updateProgress();""", 1),
])

# ---------- 3б. Навигатор: рационализация сразу на модуль 9 ----------
rep("index.html", [
    ('href="trainers/inequalities.html">3 · Рационализация</a>',
     'href="trainers/inequalities.html#m8">3 · Рационализация</a>', 1),
    ("""разобран модулем 9 курса неравенств</p>
        <div class="progress" data-progress="none"></div>
        <p class="open"><a class="btn" target="_blank" rel="noopener" href="trainers/inequalities.html">Открыть</a></p>""",
     """разобран модулем 9 курса неравенств — ссылка открывает его сразу</p>
        <div class="progress" data-progress="none"></div>
        <p class="open"><a class="btn" target="_blank" rel="noopener" href="trainers/inequalities.html#m8">Открыть</a></p>""", 1),
    # карточка финансов: не рекламировать учительский режим ученикам
    ('<p class="meta">14 задач · 11 схем · режимы ученик / практика / учитель</p>',
     '<p class="meta">14 задач · 11 схем · обучение и тренировка</p>', 1),
])

# ---------- 4. Финансы: «Учитель» за ключом ----------
rep("trainers/finance.html", [
    ("  mode: 'learn',                  // learn | practice | teacher",
     """  mode: 'learn',                  // learn | practice | teacher
  /* Режим учителя открывается ссылкой …finance.html?teacher=1 и после
     этого запоминается в этом браузере. Ученикам кнопка не видна. */
  teacherUnlocked: (function(){
    try {
      if (new URLSearchParams(location.search).has('teacher')) { localStorage.setItem('financeTeacherKey','1'); return true; }
      return localStorage.getItem('financeTeacherKey') === '1';
    } catch (e) { return false; }
  })(),""", 1),
    ("  STATE.mode = mode;",
     "  if (mode === 'teacher' && !STATE.teacherUnlocked) mode = 'learn';\n  STATE.mode = mode;", 1),
    ('      <button data-mode="teacher" role="tab">Учитель</button>',
     '      <button data-mode="teacher" role="tab" hidden>Учитель</button>', 1),
    ("""  // навесим обработчики на режим
  document.querySelectorAll('#modeSwitch button').forEach(b => {
    b.addEventListener('click', () => switchMode(b.dataset.mode));
  });""",
     """  // навесим обработчики на режим
  document.querySelectorAll('#modeSwitch button').forEach(b => {
    b.addEventListener('click', () => switchMode(b.dataset.mode));
  });
  // кнопка «Учитель» видна только после ?teacher=1 (запоминается в браузере)
  if (STATE.teacherUnlocked) {
    const tb = document.querySelector('#modeSwitch [data-mode="teacher"]');
    if (tb) tb.hidden = false;
  }""", 1),
])

print("готово")
