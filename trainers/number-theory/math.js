(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NumberTheoryMath = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';

  const primes = Object.freeze([
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53,
    59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
    127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181,
    191, 193, 197, 199
  ]);

  // Append within each level: existing task IDs identify saved board work.
  const pairs = [
    [
      [4, 6], [6, 8], [8, 12], [6, 9], [12, 18], [10, 15], [8, 16], [12, 12],
      [16, 24], [20, 28], [24, 40], [27, 45], [32, 48], [75, 25], [22, 33], [26, 39]
    ],
    [
      [18, 24], [20, 30], [24, 36], [28, 42], [36, 48], [18, 30], [8, 15], [14, 25],
      [66, 44], [39, 65], [34, 85], [38, 95], [92, 69], [58, 145],
      [93, 124], [74, 111], [82, 123], [86, 129], [141, 94], [55, 77]
    ],
    [
      [36, 54], [45, 75], [48, 72], [60, 84], [72, 90], [84, 126], [96, 144], [45, 180],
      [132, 88], [99, 165], [104, 156], [117, 195], [68, 102], [76, 114],
      [121, 143], [169, 143], [22, 65], [26, 77], [34, 57], [116, 58]
    ]
  ];
  const bank = Object.freeze(pairs.flatMap(function (levelPairs, levelIndex) {
    return levelPairs.map(function (pair, index) {
      return Object.freeze({
        id: 'nt-' + (levelIndex + 1) + '-' + (index + 1),
        level: levelIndex + 1,
        a: pair[0],
        b: pair[1]
      });
    });
  }));

  function validatePair(a, b) {
    return Number.isInteger(a) && Number.isInteger(b) &&
      a >= 2 && a <= 200 && b >= 2 && b <= 200;
  }

  function assertNatural(n) {
    if (!Number.isSafeInteger(n) || n < 1) {
      throw new RangeError('Expected a positive safe integer');
    }
  }

  // The lesson accepts 2..200; 1 is the terminal row of a factorization.
  // A repeated prime remains a separate occurrence, never a set member.
  function factorize(n) {
    assertNatural(n);
    if (n > 200) throw new RangeError('Factorization supports integers from 1 to 200');
    const factors = [];
    let remaining = n;
    for (const prime of primes) {
      if (prime * prime > remaining) break;
      while (remaining % prime === 0) {
        factors.push(prime);
        remaining /= prime;
      }
    }
    if (remaining > 1) factors.push(remaining);
    return factors;
  }

  function gcd(a, b) {
    assertNatural(a);
    assertNatural(b);
    while (b !== 0) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    return a;
  }

  function lcm(a, b) {
    const result = (a / gcd(a, b)) * b;
    if (!Number.isSafeInteger(result)) throw new RangeError('LCM exceeds the safe integer range');
    return result;
  }

  function analyze(a, b) {
    if (!validatePair(a, b)) throw new RangeError('Choose two integers from 2 to 200');
    const aFactors = factorize(a);
    const bFactors = factorize(b);
    const unusedB = bFactors.slice();
    const commonFactors = [];
    for (const factor of aFactors) {
      const index = unusedB.indexOf(factor);
      if (index !== -1) {
        commonFactors.push(factor);
        unusedB.splice(index, 1);
      }
    }

    const larger = Math.max(a, b);
    const smaller = Math.min(a, b);
    const largerFactors = (a >= b ? aFactors : bFactors).slice();
    const smallerFactors = a >= b ? bFactors : aFactors;
    const missingFromLarger = [];
    for (const factor of smallerFactors) {
      const index = largerFactors.indexOf(factor);
      if (index === -1) missingFromLarger.push(factor);
      else largerFactors.splice(index, 1);
    }

    return {
      aFactors, bFactors, commonFactors, missingFromLarger, larger, smaller,
      gcd: gcd(a, b), lcm: lcm(a, b)
    };
  }

  function feedback(status, code, message) {
    return { status, code, message };
  }

  function evaluateAnswer(kind, a, b, raw) {
    const operation = kind === 'nok' || kind === 'lcm' ? 'lcm' :
      kind === 'nod' || kind === 'gcd' ? 'gcd' : null;
    if (!operation) return feedback('invalid', 'kind', 'Выбери задание НОК или НОД.');
    if (!validatePair(a, b)) {
      return feedback('invalid', 'pair', 'Для задания нужны два целых числа от 2 до 200.');
    }
    if (raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '')) {
      return feedback('empty', 'empty', 'Впиши ответ и нажми «Проверить».');
    }
    // Do not accept exponent notation, fractions, decimals or partial parses.
    // Other object types are never coerced through a caller-provided toString.
    const text = typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw) : '';
    if (!/^[0-9]+$/.test(text)) {
      return feedback('invalid', 'positive-integer', 'Впиши целое положительное число цифрами, без дроби и выражения.');
    }
    const answer = Number(text);
    if (!Number.isSafeInteger(answer) || answer < 1) {
      return feedback('invalid', 'positive-integer', 'Впиши целое положительное число цифрами, без дроби и выражения.');
    }

    const divisor = gcd(a, b);
    const multiple = lcm(a, b);
    if (answer === (operation === 'gcd' ? divisor : multiple)) {
      return feedback('correct', 'correct', 'Верно! ' + (operation === 'gcd' ? 'НОД' : 'НОК') + ' найден.');
    }

    if (operation === 'gcd') {
      if (answer === multiple) {
        return feedback('wrong', 'confused-kind', 'Похоже, получилось общее кратное. Сейчас ищем НОД: число, на которое делятся оба исходных числа.');
      }
      if (answer > Math.min(a, b)) {
        return feedback('wrong', 'too-large-divisor', 'Общий делитель не может быть больше меньшего из исходных чисел. Проверь выбранные множители.');
      }
      if (a % answer !== 0 || b % answer !== 0) {
        return feedback('wrong', 'not-common-divisor', 'Оба исходных числа должны делиться на твой ответ без остатка. Проверь оба деления.');
      }
      return feedback('wrong', 'not-greatest-divisor', 'Это общий делитель, но можно найти больше. Проверь, остались ли ещё одинаковые множители.');
    }

    if (answer === divisor) {
      return feedback('wrong', 'confused-kind', 'Похоже, получилось значение НОД. Сейчас ищем НОК: число, которое делится на оба исходных числа.');
    }
    if (answer < Math.max(a, b)) {
      return feedback('wrong', 'too-small-multiple', 'Общее кратное не может быть меньше большего из исходных чисел. Проверь недостающие множители.');
    }
    if (answer % a !== 0 || answer % b !== 0) {
      return feedback('wrong', 'not-common-multiple', 'Твой ответ должен делиться на каждое из двух исходных чисел без остатка. Проверь оба деления.');
    }
    if (answer === a * b && divisor > 1) {
      return feedback('wrong', 'duplicated-common-factors', 'Получилось общее кратное, но можно меньше. Проверь, не посчитаны ли общие множители дважды.');
    }
    return feedback('wrong', 'not-least-multiple', 'Это общее кратное, но есть меньше. К большему числу добавляем умножением только недостающие множители.');
  }

  return Object.freeze({ bank, primes, factorize, gcd, lcm, analyze, validatePair, evaluateAnswer });
});
