const { parseSolution } = require('../utils/lib');

const cases = [
  {
    name: 'json with noise',
    input: 'prefix {"final":"42","short":"кратко","full":"полный разбор"} suffix',
    expected: { final: '42', short: 'кратко', full: 'полный разбор' },
  },
  {
    name: 'markers',
    input: 'ANSWER: 5\nSHORT: быстро\nFULL: подробно',
    expected: { final: '5', short: 'быстро', full: 'подробно' },
  },
  {
    name: 'plain text',
    input: 'Просто текст без маркеров.',
    expected: { final: '', short: '', full: 'Просто текст без маркеров.' },
  },
];

const failures = [];

for (const test of cases) {
  const actual = parseSolution(test.input);
  if (
    actual.final !== test.expected.final ||
    actual.short !== test.expected.short ||
    actual.full !== test.expected.full
  ) {
    failures.push({ name: test.name, actual });
  }
}

if (failures.length) {
  console.error('parseSolution self-check failed:', failures);
  process.exit(1);
}

console.log('parseSolution self-check passed.');
