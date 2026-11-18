// Update the pinned pilot from a locally built Узел checkout. No fetch during build or startup.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import process from 'node:process';

const input = process.argv[2];
if (!input) throw new Error('Usage: npm run sync:reader -- /path/to/uzel/dist');
const root = resolve(input);
const destination = new URL('../reader/', import.meta.url);
const origin = 'https://usel-toski-po-miru.art';
async function catalogue(filename, mode) {
  const parsed = JSON.parse(await readFile(join(root, 'assistant/v1', filename), 'utf8'));
  if (parsed.version !== 1 || parsed.mode !== mode || !Array.isArray(parsed.records)) {
    throw new Error('Unexpected reader catalogue: ' + filename);
  }
  return parsed.records;
}
const before = await catalogue('before-reading.json', 'before_reading');
const analyses = await catalogue('after-reading.json', 'after_reading');
const after = [];
const ids = new Set();
const safeKeys = new Set(['id', 'title', 'author', 'url', 'teaser', 'cues', 'detail_hint']);
for (const card of before) {
  if (!/^work-[a-z0-9-]+$/.test(card.id) || ids.has(card.id) ||
      card.url !== origin + '/poisk-po-pamyati/#' + card.id ||
      Object.keys(card).some(key => !safeKeys.has(key))) {
    throw new Error('Unexpected first-reading card: ' + card.id);
  }
  ids.add(card.id);
  const matches = analyses.filter(record => record.card_id === card.id);
  if (matches.length !== 1 || new URL(matches[0].url).origin !== origin) {
    throw new Error('Missing or ambiguous after-reading record: ' + card.id);
  }
  after.push(matches[0]);
}
const rules = await readFile(join(root, 'assets/reader-search.js'), 'utf8');
await mkdir(destination, { recursive: true });
await writeFile(new URL('search.cjs', destination), rules);
await writeFile(new URL('pilot.json', destination), JSON.stringify({ before, after }) + '\n');
console.log('Updated reader snapshot (' + ids.size + ' paired works).');
