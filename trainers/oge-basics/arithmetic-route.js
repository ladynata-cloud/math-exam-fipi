(function (root) {
  'use strict';
  const groups = [
    {id:'division', title:'Деление уголком', example:'3848 : 37', lead:'Выбираем первое неполное делимое, делим и записываем каждый шаг.', easier:'multiply', checkpoint:'multiplication-division/long-division-mixed-checkpoint.html', levels:[
      ['n3e','Уголком — по шагам'], ['n3d','Понимаем остаток'], ['n3f','Делим с остатком'], ['n4c','Не теряем ноль в ответе'], ['n4d','Делим на двузначное — с опорой'], ['n4e','Делим на двузначное — самостоятельно']]},
    {id:'multiply', title:'Умножение и таблица', example:'6 × 7', lead:'Сначала видим равные группы, затем вспоминаем таблицу и считаем столбиком.', easier:'count', checkpoint:'multiplication-division.html', levels:[
      ['t2a','Умножение на рисунке'], ['t2b','Одна таблица за раз'], ['t2c','Заполняем таблицу'], ['n2d','Вспоминаем без рисунка'], ['t2e','Находим неизвестный множитель'], ['n2e','Делим по таблице'], ['n3c','Умножаем столбиком на одну цифру'], ['n4b','Умножаем столбиком на две цифры']]},
    {id:'count', title:'Сложение и вычитание', example:'402 − 185', lead:'Можно начать с маленьких чисел и постепенно дойти до счёта столбиком.', checkpoint:'order-of-operations.html', levels:[
      ['n1a','Складываем до 10'], ['n1b','Вычитаем до 10'], ['c1a','Из каких чисел состоит число'], ['c1b','Переходим через десяток'], ['n1c','Считаем до 20'], ['n2a','Считаем до 100'], ['n2b','Складываем столбиком'], ['n2c','Вычитаем столбиком'], ['n3a','Складываем до 1000'], ['n3b','Вычитаем через ноль'], ['n4a','Считаем с большими числами']]},
    {id:'decimals', title:'Десятичные дроби', example:'4,8 : 1,2', lead:'Складываем, умножаем и делим. Следим за запятой.', easier:'division', checkpoint:'decimal-add-subtract.html', levels:[
      ['n5a','Складываем десятичные дроби'], ['n5b','Вычитаем десятичные дроби'], ['n5c','Умножаем десятичные дроби'], ['n5d','Дробь делим на натуральное число'], ['n5e','Продолжаем делить после запятой'], ['n5f','Делим на десятичную дробь']]},
    {id:'fractions', title:'Обыкновенные дроби', example:'½ + ⅓', lead:'Разбираемся в частях целого, сокращаем и приводим к общему знаменателю.', easier:'multiples', checkpoint:'fraction-common-denominator.html', levels:[
      ['f4a','Показываем дробь на рисунке'], ['f4b','Сравниваем простые дроби'], ['f4c','Считаем с одинаковыми знаменателями'], ['f6e','Сокращаем дробь'], ['f6a','Находим общий знаменатель'], ['f6b','Меняем знаменатель и числитель'], ['f6c','Сравниваем разные дроби'], ['f6d','Складываем и вычитаем разные дроби']]},
    {id:'multiples', title:'Делимость и общий знаменатель', example:'12 и 18 → 36', lead:'Ищем общие кратные и раскладываем числа на множители.', easier:'multiply', checkpoint:'fraction-common-denominator.html', levels:[
      ['k5a','Ищем общее кратное'], ['k6a','Простые и составные числа'], ['k6b','Раскладываем на простые множители'], ['k6c','Находим НОК по множителям']]}
  ];
  const levelMap = new Map(groups.flatMap(g => g.levels.map(([id,title]) => [id,{id,title,group:g.id}])));
  const guidedMap = {start:'n3e', oneDigit:'n3e', quotientDigit:'n2e', remainder:'n3d', zero:'n4c', twoDigit:'n4d', decimalNatural:'n5d', appendZeros:'n5e', decimalDivisor:'n5f'};
  const practiceMap = {n2e:'quotientDigit',n3e:'start',n3d:'remainder',n3f:'remainder',n4c:'zero',n4d:'twoDigit',n4e:'twoDigit',n5d:'decimalNatural',n5e:'appendZeros',n5f:'decimalDivisor'};
  const prefix = 'mathExamBasics.arithmeticAttempts.v1.';
  const guidedKey = 'mathExamBasics.guidedDivision.v1';
  const base = '/trainers/oge-basics/';
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const nonnegative = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000;
  const guidedCore = typeof module !== 'undefined' && module.exports ? require('./multiplication-division/division-guided-core.js') : root.DivisionGuided;
  function validRecord(r) {
    return r && r.version === 1 && levelMap.has(r.level) && typeof r.fingerprint === 'string' && r.fingerprint.length > 0 && r.fingerprint.length <= 1000 && nonnegative(r.errors) && nonnegative(r.hints) && typeof r.revealed === 'boolean' && Number.isFinite(r.at) && r.at >= 0;
  }
  function createStore(storage) {
    let warning = '';
    function read() {
      const records = [];
      if (!storage) { warning = 'Браузер не разрешил сохранение. Можно тренироваться, но результаты не сохранятся.'; return records; }
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (!key || !key.startsWith(prefix)) continue;
          try { const r = JSON.parse(storage.getItem(key)); if (!validRecord(r)) throw Error(); records.push(r); }
          catch (_) { warning = 'Часть сохранённых результатов не удалось прочитать. Эти записи оставлены без изменений.'; }
        }
      } catch (_) { warning = 'Не удалось прочитать результаты в этом браузере.'; }
      return records.sort((a,b) => a.at - b.at);
    }
    function recordAttempt(value) {
      const r = {version:1, level:value.level, fingerprint:value.fingerprint, errors:value.errors, hints:value.hints, revealed:value.revealed, at:value.at ?? Date.now()};
      if (!validRecord(r) || !storage) return false;
      try {
        // Each finished attempt has its own key: one tab never rewrites another.
        // No migration, cleanup or deletion of either trainer's existing store.
        if (read().length >= 10000) throw Error('limit');
        const id = root.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
        storage.setItem(prefix + id, JSON.stringify(r));
        return true;
      } catch (_) { warning = 'Не удалось сохранить новый результат. Скопируй его или отправь учителю снимок экрана.'; return false; }
    }
    function guidedRecords() {
      if (!storage) return [];
      try {
        const raw = storage.getItem(guidedKey);
        if (!raw) return [];
        const s = JSON.parse(raw);
        if (s?.version !== 1 || !Array.isArray(s.records) || s.records.length > 10000) throw Error();
        const ids = new Set();
        return s.records.filter(r => {
          try {
            if (!r || !own(guidedMap,r.topic) || !nonnegative(r.id) || ids.has(r.id) || !Number.isFinite(r.at) || !['errors','hints','reveals'].every(k => nonnegative(r[k])) || typeof r.repeated !== 'boolean' || r.task?.topicId !== r.topic || !guidedCore) throw Error();
            guidedCore.plan(r.task);
            ids.add(r.id); return true;
          } catch (_) { warning = 'Часть результатов подробного разбора повреждена и не включена в итог. Сохранённая работа оставлена без изменений.'; return false; }
        });
      } catch (_) { warning = 'Сохранённый подробный разбор не удалось прочитать. Открой его, чтобы проверить работу.'; return []; }
    }
    function summaries() {
      const all = Object.fromEntries([...levelMap.keys()].map(id => [id,{solved:0,independent:0,viewed:0,guidedSolved:0,guidedIndependent:0}]));
      const seen = new Set(), solved = new Set(), viewed = new Set();
      for (const r of read()) {
        const key = r.level + '\n' + r.fingerprint, s = all[r.level];
        if (r.revealed) { if (!viewed.has(key)) s.viewed++; viewed.add(key); }
        else {
          if (!solved.has(key)) s.solved++;
          solved.add(key);
          if (!seen.has(key) && !r.errors && !r.hints) s.independent++;
        }
        seen.add(key);
      }
      const guidedSeen = new Set();
      for (const r of guidedRecords()) {
        const level = guidedMap[r.topic], key = level + ':' + r.task.dividend + ':' + r.task.divisor;
        if (guidedSeen.has(key)) continue;
        guidedSeen.add(key);
        all[level].guidedSolved++;
        if (!r.errors && !r.hints && !r.reveals && !r.repeated) all[level].guidedIndependent++;
      }
      return all;
    }
    return {recordAttempt, summaries, summaryForLevel:level => summaries()[level] || {solved:0,independent:0,viewed:0,guidedSolved:0,guidedIndependent:0}, notice:() => warning};
  }
  let storage; try { storage = root.localStorage; } catch (_) {}
  const api = {
    groups, levels:[...levelMap.values()], prefix, guidedKey, createStore,
    levelForGuided:topic => own(guidedMap,topic) ? guidedMap[topic] : null,
    practiceURL:level => '/trainers/arifmetika.html?course=preoge&level=' + (levelMap.has(level) ? level : 'n3e'),
    routeURL:level => base + 'arithmetic-route.html' + (levelMap.has(level) ? '?skill=' + levelMap.get(level).group : ''),
    guidedURL:level => own(practiceMap,level) ? base + 'multiplication-division/long-division-from-simple-to-decimals.html?course=preoge#' + practiceMap[level] : null,
    ...createStore(storage)
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PreOgeArithmetic = api;
})(typeof window !== 'undefined' ? window : globalThis);
