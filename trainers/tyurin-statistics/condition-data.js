(function () {
  'use strict';

  const cards = { total: 24, a: 9, b: 8, both: 6 };

  const transfers = [
    {
      id: 'envelopes',
      title: 'Конверты для ярмарки',
      story: 'Из 20 закрытых конвертов наугад выбирают один. В 8 конвертах лежит открытка, на 5 стоит печать. В 3 конвертах с печатью есть открытка.',
      eventA: 'в конверте есть открытка', eventB: 'на конверте стоит печать',
      total: 20, a: 8, b: 5, both: 3
    },
    {
      id: 'photos',
      title: 'Архив экспедиции',
      story: 'Программа выбирает с равными шансами один из 30 снимков. На 12 снимках виден маяк, 10 снимков сделаны на закате. На 4 снимках маяк виден на закате.',
      eventA: 'на снимке виден маяк', eventB: 'снимок сделан на закате',
      total: 30, a: 12, b: 10, both: 4
    },
    {
      id: 'books',
      title: 'Книжная полка',
      story: 'Из 28 книг по жребию выбирают одну для выставки. У 7 книг зелёная обложка, в 12 книгах есть карта. Во всех книгах с картой обложки другого цвета.',
      eventA: 'у книги зелёная обложка', eventB: 'в книге есть карта',
      total: 28, a: 7, b: 12, both: 0
    },
    {
      id: 'seeds',
      title: 'Школьная теплица',
      story: 'В журнале описаны 36 посеянных семян. По жребию берут одну запись. Из 12 семян сорта «Луч» одно взошло на третий день. Всего на третий день взошли 9 семян.',
      eventA: 'выбрано семя сорта «Луч»', eventB: 'семя взошло на третий день',
      total: 36, a: 12, b: 9, both: 1
    }
  ];

  // Represent a probability by its reduced fraction, including terminating decimals exactly.
  function fraction(numerator, denominator) {
    const n = BigInt(numerator);
    const d = BigInt(denominator);
    if (d === 0n) return null;
    let a = n;
    let b = d;
    while (b !== 0n) [a, b] = [b, a % b];
    return d === a ? String(n / a) : String(n / a) + '/' + String(d / a);
  }

  function model(context, both = context.both) {
    const { total, a, b } = context;
    if (![total, a, b, both].every(Number.isSafeInteger) || total < 1 ||
        a < 0 || a > total || b < 0 || b > total) {
      throw new RangeError('Числа объектов должны задавать конечную непустую группу.');
    }
    const minBoth = Math.max(0, a - (total - b));
    const maxBoth = Math.min(a, b);
    if (both < minBoth || both > maxBoth) throw new RangeError('Невозможное пересечение групп.');
    const all = BigInt(total);
    const expectedProduct = BigInt(a) * BigInt(b);
    const actualProduct = BigInt(both) * all;
    const independent = actualProduct === expectedProduct;
    let change = null;
    if (b > 0) change = independent ? 'same' : (actualProduct > expectedProduct ? 'up' : 'down');
    return {
      total, a, b, both, onlyA: a - both, onlyB: b - both, neither: total - a - b + both,
      minBoth, maxBoth,
      independentBoth: expectedProduct % all === 0n ? Number(expectedProduct / all) : null,
      independent, disjoint: both === 0, change,
      pA: fraction(a, total), pB: fraction(b, total), joint: fraction(both, total),
      givenB: fraction(both, b), givenA: fraction(both, a)
    };
  }

  function parseAnswer(raw) {
    const value = String(raw ?? '').trim();
    if (!value || value.length > 120) return null;
    const parts = /^(\d+)\s*\/\s*(\d+)$/.exec(value);
    if (parts) return fraction(parts[1], parts[2]);
    if (/^\d+$/.test(value)) return fraction(value, 1);
    const decimal = /^(\d*)[.,](\d+)$/.exec(value);
    if (!decimal) return null;
    return fraction(decimal[1] + decimal[2], 10n ** BigInt(decimal[2].length));
  }

  const guidance = {
    pA: 'Для P(A) посчитай все исходы с признаком A и сравни с общим числом исходов.',
    pB: 'Для P(B) посчитай все исходы с признаком B и сравни с общим числом исходов.',
    joint: 'В числителе нужны исходы с обоими признаками. В знаменателе остаётся вся группа.',
    givenB: 'Оставь только исходы, в которых выполнено B. Какая доля из них имеет признак A?',
    givenA: 'Оставь только исходы, в которых выполнено A. Какая доля из них имеет признак B?',
    independentBoth: 'Какое число общих исходов сохранит в группе B ту же долю A, что и во всей группе?'
  };

  function checkAnswer(raw, result, field) {
    if (!Object.hasOwn(guidance, field)) throw new RangeError('Неизвестная величина.');
    if (result[field] === null) {
      const message = field === 'independentBoth'
        ? 'При этих итогах получить независимость с целым числом общих исходов невозможно.'
        : 'В группе, заданной условием, нет исходов. Условная вероятность не определена.';
      return { ok: false, message };
    }
    const answer = parseAnswer(raw);
    if (answer === null) return { ok: false, message: 'Введи целое число, обыкновенную дробь с ненулевым знаменателем или точную десятичную дробь.' };
    if (answer === String(result[field])) return { ok: true, message: 'Верно.' };

    let message = guidance[field];
    if (field === 'givenA' || field === 'givenB') {
      const condition = field === 'givenB' ? 'B' : 'A';
      const reverseField = field === 'givenB' ? 'givenA' : 'givenB';
      const baseField = field === 'givenB' ? 'pA' : 'pB';
      if (answer === result.joint) {
        message = 'Так получается вероятность пересечения во всей группе. По условию выбирать можно только среди исходов ' + condition + '.';
      } else if (answer === result[reverseField]) {
        message = 'Так получается обратная условная вероятность. После вертикальной черты стоит ' + condition + ' — этот признак определяет группу отбора.';
      } else if (answer === result[baseField]) {
        message = 'Это доля во всей группе. Пересчитай её среди исходов ' + condition + '.';
      }
    }
    return { ok: false, message };
  }

  const api = { cards, transfers, model, checkAnswer };
  if (typeof window !== 'undefined') window.TyurinConditionData = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
