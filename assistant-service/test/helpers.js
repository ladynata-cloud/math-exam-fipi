import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config.js';
import { AssistantStore } from '../src/store.js';
import { getBuiltinKnowledge, listTopics } from '../src/tutor.js';

export const NOW = Date.parse('2026-10-27T12:00:00Z');
export function fixture(t, { api = false, env = {}, clock = () => NOW } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-assistant-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const values = { ASSISTANT_DB_PATH: path.join(directory, 'assistant.sqlite'),
    ...(api ? { ASSISTANT_MODE: 'api', ASSISTANT_EXTERNAL_ENABLED: '1', ASSISTANT_PROVIDER_DATA_REVIEWED: '1',
      ASSISTANT_PILOT_KEY: 'test-only-pilot-key-aaaaaaaaaaaaaaaaaaaaaaaaaaaa', ASSISTANT_PROVIDER: 'deepseek',
      ASSISTANT_MODEL: 'deepseek-flash', ASSISTANT_API_KEY: 'test-only-fake-api-key-never-network', ASSISTANT_CURRENCY: 'USD',
      ASSISTANT_INPUT_PER_MILLION: '0.30', ASSISTANT_OUTPUT_PER_MILLION: '1.20',
      ASSISTANT_DAILY_BUDGET: '1', ASSISTANT_MONTHLY_BUDGET: '5', ASSISTANT_PRICE_REVIEWED_ON: '2026-10-27' } : {}), ...env };
  const config = loadConfig(values, clock());
  return { directory, config, env: values, clock,
    makeStore: () => new AssistantStore({ config, clock, builtinCards: getBuiltinKnowledge(), topics: listTopics().map(topic => topic.id) }) };
}
export function question(extra = {}) { return { topic: 'linear-equations', question: '3x + 5 = 20', attempt: '', hintLevel: 1,
  mode: 'hint', externalConsent: false, requestId: randomUUID(), ...extra }; }
export function modelResponse(extra = {}) {
  return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
    title: 'Один шаг', text: 'Рассмотрим равенство.', steps: ['Что стоит рядом с неизвестным числом?'], check: 'Выполни одно действие с обеими частями.' }) } }],
  usage: { prompt_tokens: 200, completion_tokens: 60, total_tokens: 260 }, ...extra }),
  { headers: { 'Content-Type': 'application/json' } });
}
