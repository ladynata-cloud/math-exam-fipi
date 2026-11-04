import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, moneyMicros, pricesFresh } from '../src/config.js';
import { fixture, NOW } from './helpers.js';

test('offline loopback is default and has no provider key, URL or nonzero budget', () => {
  const config = loadConfig({});
  assert.equal(config.mode, 'offline'); assert.equal(config.localDemo, true);
  assert.equal(config.host, '127.0.0.1'); assert.equal(config.apiKey, ''); assert.equal(config.dailyBudgetMicros, 0);
  assert.equal(config.providerUrl, undefined);
});
test('public binding, production persistence and origin fail closed', () => {
  for (const env of [{ HOST: '0.0.0.0' }, { NODE_ENV: 'production' }, { ASSISTANT_PUBLIC_ORIGIN: 'https://example.test/path' },
    { ASSISTANT_PUBLIC_ORIGIN: 'http://example.test' }, { ASSISTANT_MODE: 'unexpected' }, { PORT: '3e3' }, { PORT: '0' }]) {
    assert.throws(() => loadConfig(env));
  }
  const production = { NODE_ENV: 'production', HOST: '0.0.0.0', ASSISTANT_PUBLIC_ORIGIN: 'https://assistant.example.test',
    ASSISTANT_PILOT_KEY: 'test-only-pilot-key-aaaaaaaaaaaaaaaaaaaaaaaaaaaa', ASSISTANT_PERSISTENCE_CONFIRMED: '1', ASSISTANT_DB_PATH: '/data/assistant.sqlite' };
  assert.equal(loadConfig(production).cookieSecure, true);
  assert.throws(() => loadConfig({ ...production, ASSISTANT_DB_PATH: '/data/../cabinet.sqlite' }));
  assert.throws(() => loadConfig({ ...production, ASSISTANT_PERSISTENCE_CONFIRMED: '0' }));
});
test('paid mode requires every enablement, secret, model, price and budget decision', t => {
  const fx = fixture(t, { api: true });
  for (const key of ['ASSISTANT_EXTERNAL_ENABLED', 'ASSISTANT_PROVIDER_DATA_REVIEWED', 'ASSISTANT_API_KEY',
    'ASSISTANT_PILOT_KEY', 'ASSISTANT_PROVIDER', 'ASSISTANT_MODEL', 'ASSISTANT_CURRENCY', 'ASSISTANT_INPUT_PER_MILLION',
    'ASSISTANT_OUTPUT_PER_MILLION', 'ASSISTANT_DAILY_BUDGET', 'ASSISTANT_MONTHLY_BUDGET', 'ASSISTANT_PRICE_REVIEWED_ON']) {
    const env = { ...fx.env }; delete env[key]; assert.throws(() => loadConfig(env, NOW), key);
  }
  for (const overrides of [{ ASSISTANT_PROVIDER: 'custom-url' }, { ASSISTANT_MODEL: 'expensive-model' },
    { ASSISTANT_INPUT_PER_MILLION: '0.15' }, { ASSISTANT_DAILY_BUDGET: '0' }, { ASSISTANT_MONTHLY_BUDGET: '0.1' },
    { ASSISTANT_API_KEY: 'bad\nheader\rsecret' }, { ASSISTANT_MAX_OUTPUT_TOKENS: '100000' }]) {
    assert.throws(() => loadConfig({ ...fx.env, ...overrides }, NOW));
  }
});
test('price acknowledgement expires at runtime and invalid/future dates are rejected', t => {
  const { config, env } = fixture(t, { api: true });
  assert.equal(pricesFresh(config, NOW), true); assert.equal(pricesFresh(config, NOW + 7 * 86400000), false);
  for (const date of ['2026-10-19', '2026-10-28', '2026-02-30', 'garbage'])
    assert.throws(() => loadConfig({ ...env, ASSISTANT_PRICE_REVIEWED_ON: date }, NOW));
});
test('money uses exact micros and rejects floating/negative/ambiguous formats', () => {
  assert.equal(moneyMicros('0.30'), 300000); assert.equal(moneyMicros('1.000001'), 1000001);
  for (const value of ['-1', '1e4', '1,5', 'Infinity', 'NaN', '01', '.2', '0.0000001', '10001', undefined])
    assert.throws(() => moneyMicros(value));
});
