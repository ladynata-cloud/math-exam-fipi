// Refresh both reviewed catalogue and deterministic dialogue rules from the same checked-out site.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('Usage: npm run sync:tarot -- /path/to/kabbala-tarot');
const root = resolve(input);
const destination = new URL('../tarot/', import.meta.url);
const data = JSON.parse(await readFile(join(root,'assistant/v1/symbols.json'),'utf8'));
const rules = await readFile(join(root,'assets/course/symbols-assistant.js'),'utf8');
if (data.version !== 1 || data.site !== 'tarot' || !Array.isArray(data.records) || !data.records.length) {
  throw new Error('Unexpected tarot catalogue format');
}
const ids = new Set();
for (const r of data.records) {
  if (!r.id || ids.has(r.id) || !r.title || !Array.isArray(r.sources) ||
      new URL(r.url).origin !== 'https://kabbala-tarot.online') {
    throw new Error('Invalid tarot entity: ' + r.id);
  }
  ids.add(r.id);
  for (const s of r.sources) {
    if (!s.label || !['https:', 'http:'].includes(new URL(s.url).protocol)) {
      throw new Error('Invalid reference for ' + r.id);
    }
  }
}
await mkdir(destination, {recursive:true});
await writeFile(new URL('symbols.json', destination), JSON.stringify(data) + '\n');
await writeFile(new URL('rules.cjs', destination), rules);
console.log('Updated ' + ids.size + ' symbolic-study entries.');
