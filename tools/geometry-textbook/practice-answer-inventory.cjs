const assert = require('node:assert/strict');
const fs = require('node:fs');

function collectPracticeLessons(tables, runnerPath) {
  const source = fs.readFileSync(runnerPath, 'utf8');
  const declarations = [...source.matchAll(/^\s*const\s+(answers|[A-Za-z_$][\w$]*Answers)\s*=\s*\{/gm)].map(match => match[1]);
  assert(declarations.length, 'No practice answer tables declared in the browser runner');
  assert.deepEqual(Object.keys(tables).sort(), declarations.sort(), 'Each declared practice answer table must be registered exactly once');
  const cases = new Map();
  for (const [name, table] of Object.entries(tables)) {
    for (const [id, answers] of Object.entries(table)) {
      assert(!cases.has(id), 'Duplicate practice case '+id+' in '+name);
      cases.set(id, answers);
    }
  }
  return [...cases];
}

module.exports = {collectPracticeLessons};
