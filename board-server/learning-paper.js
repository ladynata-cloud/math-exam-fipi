'use strict';

// Original, bounded exercises. The server freezes the task text at assignment
// time; only the owning teacher receives the separate answer keys.
const crypto = require('node:crypto');
const { requireValue, exactKeys } = require('./learning-auth');
const topics = Object.freeze({
  'negative-numbers': 'Положительные и отрицательные числа',
  fractions: 'Обыкновенные дроби',
  'linear-equations': 'Линейные уравнения',
  brackets: 'Уравнения со скобками',
  proportions: 'Пропорции',
  percentages: 'Проценты',
  'adjacent-angles': 'Смежные углы'
});
const instructions = 'Решите в тетради. Записывайте промежуточные действия и объясняйте выбор правила. Если нужна помощь, отметьте номер и место, где остановились. Затем прикрепите фотографии всех страниц решения и нажмите «Сдать Наталье Михайловне». Это дополнительные авторские задачи, а не номера из учебника.';
const number = value => String(value).replace('-', '−');
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const fraction = (n, d) => { const g = gcd(n, d); return d / g === 1 ? number(n / g) : `${number(n / g)}/${d / g}`; };
function rng(seed) {
  let index = 0;
  return (min, max) => {
    const n = crypto.createHash('sha256').update(seed + ':' + index++).digest().readUInt32BE(0);
    return min + n % (max - min + 1);
  };
}

function generatePaper(topic, seed) {
  requireValue(typeof topic === 'string' && Object.hasOwn(topics, topic), 'LEARNING_PAPER_TOPIC_INVALID');
  requireValue(typeof seed === 'string' && seed.length > 0 && seed.length <= 300, 'LEARNING_PAPER_SEED_INVALID');
  const rand = rng(seed), tasks = [], answerKeys = [];
  function add(prompt, answer, explanation) {
    const id = String(tasks.length + 1); tasks.push({ id, prompt }); answerKeys.push({ id, answer: String(answer), explanation });
  }
  for (let i = 0; i < 6; i++) {
    if (topic === 'negative-numbers') {
      const a = rand(3, 24), b = rand(2, 18), c = rand(2, 13);
      if (i === 0) add(`Вычислите: −${a} − ${b}.`, number(-a - b), 'Оба слагаемых отрицательны: сложить модули и поставить минус.');
      if (i === 1) add(`Вычислите: −${a} + ${b}.`, number(-a + b), 'Сложение чисел с разными знаками: из большего модуля вычесть меньший.');
      if (i === 2) add(`Вычислите: ${a} − (−${b}).`, a + b, 'Вычитание отрицательного числа заменить сложением.');
      if (i === 3) add(`Вычислите: −${a} + ${b} − ${c}.`, number(-a + b - c), 'Можно сначала сложить отрицательные слагаемые.');
      if (i === 4) add(`Вычислите: (−${a}) · (−${b}) − ${c}.`, a * b - c, 'Сначала умножение: произведение двух отрицательных чисел положительно.');
      if (i === 5) add(`Утром было −${a} °C. К полудню температура повысилась на ${b} °C, а к вечеру понизилась на ${c} °C. Какой стала температура вечером?`, `${number(-a + b - c)} °C`, 'Начальная температура + повышение − понижение.');
    } else if (topic === 'fractions') {
      const d = rand(5, 12), a = rand(1, d - 1), b = rand(1, d - 1), k = rand(2, 4);
      if (i === 0) add(`Сложите и сократите результат: ${a}/${d} + ${b}/${d}.`, fraction(a + b, d), 'При одинаковых знаменателях складываются числители.');
      if (i === 1) add(`Вычтите и сократите результат: ${a + b}/${d} − ${b}/${d}.`, fraction(a, d), 'Вычесть числители, затем сократить дробь.');
      if (i === 2) add(`Сложите и сократите результат: ${a}/${d} + ${b}/${d * k}.`, fraction(a * k + b, d * k), `Общий знаменатель ${d * k}; числитель первой дроби умножается на ${k}.`);
      if (i === 3) add(`Вычислите и сократите: ${a}/${d} · ${b}/${k}.`, fraction(a * b, d * k), 'Перемножить числители и знаменатели; общие множители можно сократить заранее.');
      if (i === 4) add(`Вычислите и сократите: ${a}/${d} : ${b}/${k}.`, fraction(a * k, d * b), 'Деление заменить умножением на обратную дробь.');
      if (i === 5) add(`Лента длиной ${d * k} м. На украшение использовали ${a}/${d} всей ленты. Сколько метров использовали?`, `${a * k} м`, `Одна ${d}-я часть равна ${k} м; взять ${a} таких частей.`);
    } else if (topic === 'linear-equations') {
      const x = rand(i < 3 ? 1 : -9, 12), a = rand(2, 9), b = rand(2, 20), left = i % 2 ? -a : a;
      const c = left * x + b;
      add(`Решите уравнение и выполните проверку: ${number(left)}x + ${b} = ${number(c)}.`, `x = ${number(x)}`, `${number(left)}x = ${number(c - b)}; x = ${number(x)}. Подстановка: ${number(left)} · (${number(x)}) + ${b} = ${number(c)}.`);
    } else if (topic === 'brackets') {
      const x = rand(-7, 12), a = rand(2, 7), b = rand(2, 10), c = rand(1, 12), subtract = i >= 3;
      const rhs = a * (subtract ? b - x : x + b) + c;
      add(`Решите уравнение и выполните проверку: ${a}(${subtract ? `${b} − x` : `x + ${b}`}) + ${c} = ${number(rhs)}.`, `x = ${number(x)}`, `После раскрытия скобок: ${subtract ? '−' : ''}${a}x + ${a * b + c} = ${number(rhs)}. Значит, ${subtract ? '−' : ''}${a}x = ${number(rhs - a * b - c)}, x = ${number(x)}.`);
    } else if (topic === 'proportions') {
      const d = rand(2, 9), numerator = rand(1, 8), k = rand(2, 8), x = numerator * k;
      if (i < 3) add(`Найдите x и проверьте равенство отношений: x/${d * k} = ${numerator}/${d}.`, `x = ${x}`, `x · ${d} = ${d * k} · ${numerator}, поэтому x = ${x}.`);
      else add(`Для ${d} одинаковых наборов нужно ${d * numerator} листов бумаги. Сколько листов понадобится для ${k} таких наборов? Составьте пропорцию.`, `${x} шт.`, `Для одного набора нужно ${numerator} листов; для ${k} наборов — ${x}.`);
    } else if (topic === 'percentages') {
      const percentage = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75][rand(0, 9)], whole = rand(2, 15) * 100, part = whole * percentage / 100;
      if (i % 3 === 0) add(`В кружке запланировали собрать ${whole} деталей для моделей. Уже собрано ${percentage}% от плана. Сколько деталей собрано?`, `${part} шт.`, `${whole} · ${percentage}/100 = ${part}.`);
      if (i % 3 === 1) add(`После первого этапа собрали ${part} деталей. Это ${percentage}% всего плана. Сколько деталей запланировано собрать?`, `${whole} шт.`, `${part} : (${percentage}/100) = ${whole}.`);
      if (i % 3 === 2) add(`Из ${whole} запланированных деталей собрали ${part}. Сколько процентов плана выполнено?`, `${percentage}%`, `${part} : ${whole} · 100% = ${percentage}%.`);
    } else if (topic === 'adjacent-angles') {
      const angle = rand(22, 158), difference = rand(6, 60) * 2, ratio = rand(2, 5);
      if (i < 3) add(`Углы AOB и BOC смежные, ∠AOB = ${angle}°. Найдите ∠BOC. Сделайте рисунок: точки A, O, C лежат на одной прямой, O находится между A и C.`, `${180 - angle}°`, `Сумма смежных углов равна 180°; 180° − ${angle}° = ${180 - angle}°.`);
      if (i === 3) add(`Один из двух смежных углов на ${difference}° больше другого. Найдите оба угла, начиная с меньшего. Сделайте рисунок и составьте уравнение.`, `${(180 - difference) / 2}°; ${(180 + difference) / 2}°`, `Если меньший угол x°, то x + (x + ${difference}) = 180.`);
      if (i === 4) add(`Один из двух смежных углов в ${ratio} ${ratio === 5 ? 'раз' : 'раза'} больше другого. Найдите оба угла, начиная с меньшего.`, `${180 / (ratio + 1)}°; ${180 * ratio / (ratio + 1)}°`, `x + ${ratio}x = 180; x = ${180 / (ratio + 1)}°.`);
      if (i === 5) add(`Углы AOB и BOC смежные, ∠AOB = ${angle}°. Луч OD — биссектриса угла BOC. Найдите ∠BOD. Покажите луч OD на рисунке.`, `${(180 - angle) / 2}°`, `∠BOC = ${180 - angle}°; биссектриса делит этот угол на две равные части.`);
    }
  }
  return { topic, title: topics[topic], instructions, tasks, answerKeys };
}

function initializePaper(store) {
  if (!store.available) return;
  store.db.exec(`CREATE TABLE IF NOT EXISTS learning_paper_homework(
    assignment_id TEXT PRIMARY KEY REFERENCES assignments(id), topic TEXT NOT NULL,
    revision INTEGER NOT NULL, prompts_json TEXT NOT NULL, answerkeys_json TEXT NOT NULL, created_at INTEGER NOT NULL);`);
}
function assignmentFor(store, auth, id) {
  const row = store.row('SELECT * FROM assignments WHERE id=?', id);
  requireValue(row && (auth.role === 'teacher' ? row.teacher_id === auth.id : row.learner_id === auth.id && row.status === 'published'), 'LEARNING_NOT_FOUND', 404);
  return row;
}
function hasPaper(store, id) { return !!store.row('SELECT assignment_id FROM learning_paper_homework WHERE assignment_id=?', id); }
function getPaper(store, auth, id) {
  assignmentFor(store, auth, id);
  const row = store.row('SELECT * FROM learning_paper_homework WHERE assignment_id=?', id);
  if (!row) return null;
  return { ...JSON.parse(row.prompts_json), revision: row.revision, createdAt: row.created_at,
    ...(auth.role === 'teacher' ? { answerKeys: JSON.parse(row.answerkeys_json) } : {}) };
}
function mountPaperRoutes(router, learning) {
  const { store, handler, mutationMiddleware } = learning;
  initializePaper(store);
  // The parent router supplies authentication to every route. Mutations retain
  // the shared CSRF/origin guard and the existing transactional idempotency.
  router.post('/assignments/:id/paper', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId', 'topic'], ['opId', 'topic']);
    const auth = req.learningAuth; store.teacher(auth);
    const row = assignmentFor(store, auth, req.params.id);
    requireValue(typeof req.body.topic === 'string' && Object.hasOwn(topics, req.body.topic), 'LEARNING_PAPER_TOPIC_INVALID');
    res.status(201).json(store.operation(auth, { ...req.body, operation: 'author-paper-homework', assignmentId: row.id }, () => {
      const current = assignmentFor(store, auth, row.id);
      requireValue(current.status === 'draft', 'LEARNING_HOMEWORK_ALREADY_PUBLISHED', 409);
      requireValue(store.attemptRow(auth, current.attempt_id).archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
      const previous = store.row('SELECT revision FROM learning_paper_homework WHERE assignment_id=?', row.id);
      const revision = (previous?.revision || 0) + 1; requireValue(revision <= 100, 'LEARNING_LIMIT_EXCEEDED', 507);
      const { answerKeys, ...prompts } = generatePaper(req.body.topic, row.id + ':' + req.body.opId);
      store.run(`INSERT INTO learning_paper_homework VALUES(?,?,?,?,?,?) ON CONFLICT(assignment_id) DO UPDATE SET
        topic=excluded.topic,revision=excluded.revision,prompts_json=excluded.prompts_json,answerkeys_json=excluded.answerkeys_json,created_at=excluded.created_at`,
      row.id, prompts.topic, revision, JSON.stringify(prompts), JSON.stringify(answerKeys), store.clock());
      return { paper: getPaper(store, auth, row.id) };
    }));
  }));
}

module.exports = { topics, generatePaper, initializePaper, getPaper, hasPaper, mountPaperRoutes };
