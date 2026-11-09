'use strict';
const assert = require('node:assert/strict');

// Exact reviewed acceptance corrections. Restore these bytes to PR #485 before
// its separate teaching normalizer restores the older immutable engine baseline.
// No regex stripping or hash replacement: missing/changed/duplicate fragments fail.
const changes = [
  {
    "scope": "reference",
    "current": "при a ≥ 0; этой строчки нет на листе — но это само определение корня",
    "original": "этой строчки нет на листе — но это само определение корня"
  },
  {
    "scope": "reference",
    "current": "  document.querySelectorAll(\"table.sq td.hl\").forEach(td=>td.classList.remove(\"hl\"));\n  if(!x){fb.textContent=\"введи целое неотрицательное число\";fb.className=\"fb no\";return;}\n  if(x.d===0n){fb.textContent=\"На ноль делить нельзя: такая запись не задаёт число.\";fb.className=\"fb no\";return;}\n  if(x.n<0n){fb.textContent=\"В действительных числах корень из отрицательного числа не определён: квадрат любого действительного числа неотрицателен.\";fb.className=\"fb no\";return;}\n  if(!fint(x)){fb.textContent=\"Поиск по таблице принимает целые неотрицательные числа. Корни из положительных дробей тоже существуют.\";fb.className=\"fb no\";return;}\n  const r=isqrtB(x.n);",
    "original": "  if(!x||!fint(x)){fb.textContent=\"введи целое число\";fb.className=\"fb no\";return;}\n  const r=isqrtB(x.n<0n?-x.n:x.n);"
  },
  {
    "scope": "learn-content",
    "current": "    <p class=\"note\">Если знак буквы неизвестен, помни: ${M(rt(\"x<sup>2</sup>\")+\" = |x|\")}. Например, ${M(rt(\"(−3)<sup>2</sup>\")+\" = \"+rt(9)+\" = 3\")}, а не −3. Условие a ≥ 0 позволяет обойтись без модуля.</p>\n    <div class=\"tool\"><div class=\"tl\">проверь идею · введи показатель — увидишь результат</div>",
    "original": "    <div class=\"tool\"><div class=\"tl\">проверь идею · введи показатель — увидишь результат</div>"
  },
  {
    "scope": "learn-content",
    "current": "в задачах №2 нашего банка оно является полным квадратом.",
    "original": "в ОГЭ оно всегда будет полным квадратом."
  },
  {
    "scope": "learn-content",
    "current": "    <div class=\"note\"><b>Почему нужны условия?</b> В действительных числах квадрат не бывает отрицательным, поэтому ${M(rt(\"−1\"))} не определён. Хотя ${M(rt(\"(−1) · (−1)\")+\" = 1\")}, выражение ${M(rt(\"−1\")+\" · \"+rt(\"−1\"))} не имеет значения. Сначала проверь каждый корень, затем объединяй.</div>\n    <p><b>А если ноль?</b> ${M(rt(0)+\" · \"+rt(4)+\" = 0\")} и ${M(fr(rt(0),rt(4))+\" = 0\")} допустимы. Но ${M(fr(rt(4),rt(0)))} и ${M(fr(rt(0),rt(0)))} не определены: ${M(rt(0)+\" = 0\")}, а на ноль делить нельзя. Поэтому в знаменателе нужно b &gt; 0.</p>\n    <p><b>Зачем:</b> по отдельности",
    "original": "    <p><b>Зачем:</b> по отдельности"
  },
  {
    "scope": "learn-content",
    "current": "      <p class=\"hintbox\">В этой модели вводи целые числа от 0 до 10000. Само свойство верно и для неотрицательных дробей.</p>\n      <div class=\"hintbox\" id=\"unOut\" aria-live=\"polite\"></div>",
    "original": "      <div class=\"hintbox\" id=\"unOut\"></div>"
  },
  {
    "scope": "learn-content",
    "current": "${M(par(rt(\"a\"))+\"<sup>2</sup> = a\")} при a ≥ 0. Например",
    "original": "${M(par(rt(\"a\"))+\"<sup>2</sup> = a\")}. Например"
  },
  {
    "scope": "learning",
    "current": "Любое ненулевое число в нулевой степени — единица!",
    "original": "Любое число в нулевой степени — единица!"
  },
  {
    "scope": "learning",
    "current": "В задачах №2 нашего банка основание — полный квадрат (4, 9, 16, 25); для них работает случай 2 ниже.",
    "original": "В ОГЭ при нечётном показателе основание всегда будет полным квадратом (4, 9, 16, 25) — тогда работает случай 2 ниже."
  },
  {
    "scope": "learning",
    "current": "  if(!a||!b){o.textContent=\"Введи два числа. В этой модели можно использовать целые числа от 0 до 10000.\";return;}\n  if(a.d===0n||b.d===0n){o.textContent=\"На ноль делить нельзя: такая запись не задаёт число.\";return;}\n  if(a.n<0n||b.n<0n){o.textContent=\"Объединять нельзя: корень из отрицательного числа не определён в действительных числах. Даже если произведение положительно, сначала должны существовать оба корня.\";return;}\n  if(!fint(a)||!fint(b)||a.n>10000n||b.n>10000n){o.textContent=\"В этой модели вводи целые числа от 0 до 10000. Это ограничение модели: свойство верно для любых неотрицательных чисел, в том числе дробей.\";return;}",
    "original": "  if(!a||!b||!fint(a)||!fint(b)||a.n<1n||b.n<1n||a.n>10000n||b.n>10000n){o.innerHTML=\"введи два натуральных числа\";return;}"
  },
  {
    "scope": "learning",
    "current": " — не полный квадрат: целого ответа нет; корень иногда можно упростить. Подбери пару",
    "original": " — не полный квадрат: так и останется ${M(rt(String(P)))}. Подбери пару"
  }
];

function restoreRootAcceptance(source, scope = 'all') {
  assert(['all', 'reference', 'learning', 'learn-content'].includes(scope), 'known normalization scope');
  let result = source;
  const selected = changes.filter(c => scope === 'all' || c.scope === scope || (scope === 'learning' && c.scope === 'learn-content'));
  for (const {current, original} of selected) {
    assert.equal(result.split(current).length, 2, 'exact reviewed acceptance fragment must occur once: ' + current.slice(0, 60));
    result = result.replace(current, original);
  }
  return result;
}
module.exports = { restoreRootAcceptance };
