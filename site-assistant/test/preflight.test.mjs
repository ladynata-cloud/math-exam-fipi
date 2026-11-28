import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import navigator from '../../assets/assistant/navigator-data.js';
import readerRules from '../reader/search.cjs';

const directory = new URL('../training/', import.meta.url);
const pilot = JSON.parse(await readFile(new URL('../reader/pilot.json', import.meta.url), 'utf8'));
const domains = {math: 'https://mathexam.space', reader: 'https://usel-toski-po-miru.art'};
const known = {
  math: new Set([domains.math + '/', ...navigator.catalogue.map(({url}) => new URL(url, domains.math).href)]),
  reader: new Set([domains.reader + '/poisk-po-pamyati/', ...pilot.before.concat(pilot.after).map(r => r.url)]),
};
const rows = data => data.trimEnd().split('\n').map(line => JSON.parse(line));
const readRows = async file => rows(await readFile(new URL(file, directory), 'utf8'));
const normalize = text => text.normalize('NFKC').toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const exportRows = mode => rows(execFileSync(process.execPath,
  [fileURLToPath(new URL('../scripts/preflight.mjs', import.meta.url)), mode], {encoding: 'utf8', maxBuffer: 8e6}));
const sources = await readRows('provenance.jsonl');
const cases = await readRows('eval.jsonl');

test('two-site training export contains only sourced training messages', async () => {
  const all = [];
  const ids = new Set();
  for (const site of Object.keys(domains)) {
    const train = await readRows('train-' + site + '.jsonl');
    const siteSources = sources.filter(row => row.site === site);
    assert.ok(train.length > 0);
    assert.equal(siteSources.length, train.length);
    for (const [i, row] of train.entries()) {
      const src = siteSources.find(record => record.line === i + 1);
      assert.ok(src, site + ' row ' + (i + 1));
      assert.ok(src.id && !ids.has(src.id));
      ids.add(src.id);
      assert.equal(src.split, 'train');
      assert.equal(src.creation, 'editorial_synthetic');
      assert.ok(src.source_locator.trim() && known[site].has(src.source_url), src.id);
      assert.deepEqual(Object.keys(row), ['messages']);
      assert.deepEqual(row.messages.map(m => m.role), ['system', 'user', 'assistant', 'user', 'assistant']);
      assert.ok(row.messages[0].content.includes(src.source_url), src.id);
      for (const m of row.messages) {
        assert.deepEqual(Object.keys(m).sort(), ['content', 'role']);
        assert.ok(m.content.trim());
        for (const match of m.content.matchAll(/https?:\/\/[^\s)\]<>]+/g)) {
          const url = match[0].replace(/[.,;!]+$/u, '');
          assert.ok(known[site].has(url), src.id + ': ' + url);
        }
      }
      all.push(row);
    }
  }
  assert.equal(ids.size, sources.length);
  assert.deepEqual(exportRows('train'), all);
});

test('evaluation cases are disjoint and questions omit grading instructions', async () => {
  const train = exportRows('train');
  const seenTrainQuestions = new Set();
  for (const {messages} of train) {
    for (const m of messages.filter(m => m.role === 'user')) seenTrainQuestions.add(normalize(m.content));
  }
  const prompts = exportRows('questions');
  const baseline = exportRows('offline');
  assert.equal(prompts.length, cases.length);
  assert.equal(baseline.length, cases.length);
  assert.deepEqual(new Set(cases.map(c => c.site)), new Set(Object.keys(domains)));
  const usedIds = new Set(sources.map(r => r.id));
  const usedQuestions = new Set(seenTrainQuestions);
  for (const [i, item] of cases.entries()) {
    assert.ok(item.id && !usedIds.has(item.id));
    usedIds.add(item.id);
    assert.ok(item.scenario.trim() && item.turns.length > 0);
    const {surface, mode, workId} = item.context;
    if (item.site === 'reader') {
      assert.equal(surface, 'reader');
      if (mode === 'before_reading') {
        assert.equal(workId, undefined);
        assert.deepEqual(prompts[i].evidence, pilot.before);
      } else {
        assert.equal(mode, 'after_reading');
        if (item.turns.some(turn => readerRules.asksForSafeMode(turn.user))) {
          assert.deepEqual(prompts[i].evidence, [pilot.before.find(card => card.id === workId)]);
        } else {
          assert.equal(prompts[i].evidence.card_id, workId);
        }
      }
    } else {
      assert.ok(['navigator', 'division'].includes(surface));
    }
    const prompt = prompts[i];
    assert.deepEqual(Object.keys(prompt).sort(), ['caseNumber', 'context', ...(prompt.evidence ? ['evidence'] : []), 'site', 'system', 'turns'].sort());
    assert.ok(prompt.system.trim() && prompt.caseNumber === i + 1 && prompt.site === item.site);
    assert.deepEqual(prompt.context, item.context);
    assert.deepEqual(prompt.turns, item.turns.map(t => t.user));
    assert.equal(baseline[i].id, item.id);
    assert.equal(baseline[i].backend, 'offline-rules');
    assert.equal(baseline[i].turns.length, item.turns.length);
    for (const [index, turn] of item.turns.entries()) {
      const question = normalize(turn.user);
      assert.ok(question && !usedQuestions.has(question), item.id + ': ' + turn.user);
      usedQuestions.add(question);
      assert.ok(turn.rubric.trim() && turn.forbidden.length > 0 && turn.forbidden.every(f => f.trim()));
      const result = baseline[i].turns[index];
      assert.equal(result.user, turn.user);
      assert.ok(result.reply.trim() && Array.isArray(result.links));
    }
  }
});
