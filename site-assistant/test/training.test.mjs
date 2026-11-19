import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadRows(file) {
  const data = await readFile(new URL(`../training/${file}`, import.meta.url), 'utf8');
  return data.trimEnd().split('\n').map(line => JSON.parse(line));
}

test('training messages are traced to public sources and kept apart from routing evaluation', async () => {
  const origins = {
    math: 'https://mathexam.space',
    reader: 'https://usel-toski-po-miru.art',
    tarot: 'https://kabbala-tarot.online',
  };
  const ids = new Set();
  const questions = new Set();
  const normalize = text => text.trim().normalize('NFC').toLowerCase();
  const provenance = await loadRows('provenance.jsonl');
  for (const [site, origin] of Object.entries(origins)) {
    const examples = await loadRows(`train-${site}.jsonl`);
    const sources = provenance.filter(source => source.site === site);
    assert.ok(examples.length > 0);
    assert.equal(sources.length, examples.length);
    for (const [index, { messages }] of examples.entries()) {
      assert.deepEqual(messages.map(m => m.role), ['system', 'user', 'assistant', 'user', 'assistant']);
      assert.ok(messages.every(m => typeof m.content === 'string' && m.content.trim()));
      const source = sources.find(s => s.line === index + 1);
      assert.ok(source, `Missing source for ${site} line ${index + 1}`);
      assert.equal(source.split, 'train');
      assert.equal(source.creation, 'editorial_synthetic');
      assert.ok(source.source_locator.trim() && source.id.trim());
      assert.equal(new URL(source.source_url).origin, origin);
      assert.ok(messages[0].content.includes(source.source_url));
      assert.ok(!ids.has(source.id));
      ids.add(source.id);
      for (const message of messages.filter(m => m.role === 'user')) questions.add(normalize(message.content));
    }
  }
  assert.equal(ids.size, provenance.length);
  const holdout = await loadRows('routing-holdout.jsonl');
  assert.deepEqual(new Set(holdout.map(c => c.active_site)), new Set(Object.keys(origins)));
  for (const item of holdout) {
    assert.equal(item.split, 'test');
    assert.equal(item.expected_active_site, item.active_site);
    assert.ok(item.id.trim() && item.expected_action.trim() && item.rubric.trim() && item.user.trim());
    assert.ok(!ids.has(item.id));
    ids.add(item.id);
    assert.ok(!questions.has(normalize(item.user)));
    questions.add(normalize(item.user));
  }
});
