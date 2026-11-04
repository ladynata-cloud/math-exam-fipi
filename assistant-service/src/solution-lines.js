import { parseLinearEquation } from './extended-math.js';
const equal = (a, b) => a.kind === b.kind && (a.kind !== 'one' || a.expected.n * b.expected.d === b.expected.n * a.expected.d);
export function checkSolutionLines(question, attempt) {
  const lines = attempt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (lines.length > 6) return { status: 'unsupported', text: 'Проверь до 6 строк за один раз.', lines: [] };
  let previous = parseLinearEquation(question);
  if (!previous) return { status: 'unsupported', text: 'Исходное уравнение не распознано.', lines: [] };
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const current = parseLinearEquation(lines[i]);
    const status = !current ? 'unsupported' : equal(previous, current) ? 'correct' : 'incorrect';
    results.push({ line: i + 1, status });
    if (status !== 'correct') return { status, lines: results, text: status === 'incorrect'
      ? `Переход к строке ${i + 1} изменил решения. Проверь действие в обеих частях. Последующие строки пока не проверены.`
      : `Строку ${i + 1} пока не могу проверить. Нужна одна линейная запись с x и знаком =. Последующие строки пока не проверены.` };
    previous = current;
  }
  return { status: lines.length ? 'correct' : 'none', lines: results, text: lines.length ? 'Проверенные строки сохраняют решения. Объясни выполненные действия: равносильность сама по себе не доказывает записанный словами способ.' : '' };
}
