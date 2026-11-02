// Recognize only unambiguous omissions; a coverage gap is not missing data.
export function clarificationFor(topic, question) {
  const q = question.trim().toLowerCase().replace(/[−–—]/g, '-').replace(/[?!.]+$/, '').trim();
  const number = '[+-]?\\d+(?:[.,]\\d+)?';
  if (topic === 'percentages') {
    if (new RegExp(`^${number}\\s*%\\s*от$`).test(q)) return 'От какого числа нужно найти этот процент? Допиши число после «от».';
    if (new RegExp(`^(?:увеличь|уменьши)\\s+${number}(?:\\s+на)?$`).test(q)) return 'На сколько процентов нужно изменить число? Допиши величину изменения со знаком %.';
    if (new RegExp(`^${number}\\s*%\\s*числа\\s*равны$`).test(q)) return 'Чему равна указанная часть числа? Допиши значение после «равны».';
    if (new RegExp(`^сколько процентов составляет\\s+${number}\\s+от$`).test(q)) return 'С каким целым сравниваем эту часть? Допиши число после «от».';
  }
  if (topic === 'linear-equations' && /^[\dxх\s+*/().,=\-]+$/.test(q) && /[xх]/.test(q)) {
    if (!q.includes('=')) return 'Чему равно это выражение? Допиши знак = и вторую часть уравнения.';
    if (/^[^=]+=$/.test(q)) return 'Что находится справа от знака =? Допиши правую часть уравнения.';
    if (/^=[^=]+$/.test(q)) return 'Что находится слева от знака =? Допиши левую часть уравнения.';
  }
  if (topic === 'fractions' && /^[+-]?(?:\d+[ \t\u00a0]+)?\d+\s*\/\s*[1-9]\d*\s*[+-]$/.test(q)) return 'Какую дробь нужно прибавить или вычесть? Допиши второе число после знака действия.';
  if (topic === 'rounding' && /^округли\s+[+-]?\d+(?:[.,]\d+)?(?:\s+до)?$/.test(q)) return 'До какого разряда округляем: единиц, десятых или сотых? Допиши разряд после «до».';
  if (topic === 'gcd-lcm' && /^но[дк]\s+\d+(?:\s+и)?$/.test(q)) return 'Для каких чисел ищем НОД или НОК? Допиши второе число.';
  return null;
}
