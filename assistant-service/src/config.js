import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireValue } from './errors.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const PROVIDERS = Object.freeze({
  deepseek: { url: 'https://api.deepseek.com/chat/completions', label: 'DeepSeek API', models: ['deepseek-flash'], currency: 'USD' },
  amvera: { url: 'https://inference.waw0.amvera.ru/v1/chat/completions', label: 'Amvera Inference', models: ['qwen3_30b', 'qwen3_235b'], currency: 'RUB' }
});
export function moneyMicros(value) {
  requireValue(typeof value === 'string' && /^(?:0|[1-9]\d{0,4})(?:\.\d{1,6})?$/.test(value), 'CONFIG_MONEY_INVALID');
  const [whole, fraction = ''] = value.split('.');
  const amount = Number(whole) * 1000000 + Number(fraction.padEnd(6, '0'));
  requireValue(Number.isSafeInteger(amount) && amount <= 10000000000, 'CONFIG_MONEY_INVALID');
  return amount;
}
function integer(value, fallback, min, max) {
  if (value === undefined || value === '') return fallback;
  requireValue(/^\d+$/.test(String(value)), 'CONFIG_INTEGER_INVALID');
  const n = Number(value);
  requireValue(Number.isSafeInteger(n) && n >= min && n <= max, 'CONFIG_INTEGER_INVALID');
  return n;
}
export function pricesFresh(config, now = Date.now()) {
  return config.mode !== 'api' || (now >= config.priceReviewedAt && now < config.priceValidUntil);
}
export function loadConfig(env = process.env, now = Date.now()) {
  const mode = env.ASSISTANT_MODE || 'offline';
  requireValue(['offline', 'api'].includes(mode), 'CONFIG_MODE_INVALID');
  const production = env.NODE_ENV === 'production';
  const host = env.HOST || '127.0.0.1';
  requireValue(['127.0.0.1', '0.0.0.0'].includes(host), 'CONFIG_HOST_INVALID');
  const port = integer(env.PORT, 3000, 1, 65535);
  const publicOrigin = env.ASSISTANT_PUBLIC_ORIGIN || `http://127.0.0.1:${port}`;
  let origin;
  try { origin = new URL(publicOrigin); } catch { requireValue(false, 'CONFIG_ORIGIN_INVALID'); }
  const loopback = origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname);
  requireValue(origin.origin === publicOrigin && (origin.protocol === 'https:' || (!production && loopback)), 'CONFIG_ORIGIN_INVALID');
  const pilotKey = env.ASSISTANT_PILOT_KEY || '';
  const cabinetBridgeKey = env.ASSISTANT_CABINET_BRIDGE_KEY || '';
  requireValue(!cabinetBridgeKey || /^[A-Za-z0-9_-]{43,128}$/.test(cabinetBridgeKey), 'CONFIG_CABINET_KEY_INVALID');
  requireValue(!cabinetBridgeKey || cabinetBridgeKey !== pilotKey, 'CONFIG_CABINET_KEY_REUSED');
  requireValue([undefined, '', '0', '1'].includes(env.ASSISTANT_CABINET_EXTERNAL_ENABLED), 'CONFIG_CABINET_EXTERNAL_INVALID');
  const cabinetExternalEnabled = env.ASSISTANT_CABINET_EXTERNAL_ENABLED === '1';
  requireValue(!cabinetExternalEnabled || (cabinetBridgeKey && mode === 'api'), 'CONFIG_CABINET_EXTERNAL_INVALID');
  const localDemo = !production && mode === 'offline' && host === '127.0.0.1' && loopback && !pilotKey;
  requireValue(localDemo || /^[A-Za-z0-9_-]{43,128}$/.test(pilotKey), 'CONFIG_PILOT_KEY_REQUIRED');
  const dbPath = env.ASSISTANT_DB_PATH || path.join(ROOT, 'data', 'assistant.sqlite');
  requireValue(path.isAbsolute(dbPath), 'CONFIG_DB_PATH_INVALID');
  if (production) {
    requireValue(env.ASSISTANT_PERSISTENCE_CONFIRMED === '1', 'CONFIG_PERSISTENCE_UNCONFIRMED');
    requireValue(dbPath.startsWith('/data/') && path.normalize(dbPath) === dbPath, 'CONFIG_DB_PATH_INVALID');
  }
  const config = {
    mode, production, host, port, publicOrigin, pilotKey, localDemo, dbPath,
    cabinetBridgeKey, cabinetExternalEnabled,
    cookieSecure: origin.protocol === 'https:',
    sessionTtlMs: 3600000, feedbackRetentionMs: 30 * 86400000,
    maxSessionRequests: integer(env.ASSISTANT_SESSION_REQUESTS, 60, 1, 100),
    maxDailyRequests: integer(env.ASSISTANT_DAILY_REQUESTS, 1000, 1, 10000),
    maxDailyApiRequests: integer(env.ASSISTANT_DAILY_API_REQUESTS, 100, 1, 1000),
    maxConcurrent: integer(env.ASSISTANT_CONCURRENCY, 2, 1, 4),
    maxOutputTokens: integer(env.ASSISTANT_MAX_OUTPUT_TOKENS, 500, 100, 800),
    timeoutMs: integer(env.ASSISTANT_TIMEOUT_MS, 15000, 100, 30000),
    maxInputTokens: 16000, maxBodyBytes: 8192, maxResponseBytes: 65536,
    provider: null, providerLabel: '', apiKey: '', currency: null,
    dailyBudgetMicros: 0, monthlyBudgetMicros: 0, inputPriceMicros: 0, outputPriceMicros: 0,
    priceReviewedAt: 0, priceValidUntil: 0
  };
  if (mode === 'api') {
    requireValue(env.ASSISTANT_EXTERNAL_ENABLED === '1', 'CONFIG_EXTERNAL_NOT_ENABLED');
    requireValue(env.ASSISTANT_PROVIDER_DATA_REVIEWED === '1', 'CONFIG_DATA_TERMS_UNCONFIRMED');
    const provider = env.ASSISTANT_PROVIDER;
    requireValue(Object.hasOwn(PROVIDERS, provider || ''), 'CONFIG_PROVIDER_INVALID');
    const settings = PROVIDERS[provider];
    const model = env.ASSISTANT_MODEL;
    requireValue(settings.models.includes(model), 'CONFIG_MODEL_INVALID');
    const apiKey = env.ASSISTANT_API_KEY || '';
    requireValue(apiKey.length >= 16 && apiKey.length <= 2048 && /^[\x21-\x7e]+$/.test(apiKey), 'CONFIG_API_KEY_REQUIRED');
    requireValue(!cabinetBridgeKey || cabinetBridgeKey !== apiKey, 'CONFIG_CABINET_KEY_REUSED');
    requireValue(env.ASSISTANT_CURRENCY === settings.currency, 'CONFIG_CURRENCY_INVALID');
    const inputPriceMicros = moneyMicros(env.ASSISTANT_INPUT_PER_MILLION);
    const outputPriceMicros = moneyMicros(env.ASSISTANT_OUTPUT_PER_MILLION);
    requireValue(inputPriceMicros > 0 && outputPriceMicros > 0, 'CONFIG_PRICE_REQUIRED');
    // Verified peak cache-miss prices, 2026-10-27. Never budget with discounts.
    if (provider === 'deepseek') requireValue(inputPriceMicros >= 300000 && outputPriceMicros >= 1200000, 'CONFIG_PRICE_BELOW_VERIFIED_CEILING');
    const dailyBudgetMicros = moneyMicros(env.ASSISTANT_DAILY_BUDGET);
    const monthlyBudgetMicros = moneyMicros(env.ASSISTANT_MONTHLY_BUDGET);
    requireValue(dailyBudgetMicros > 0 && monthlyBudgetMicros >= dailyBudgetMicros, 'CONFIG_BUDGET_REQUIRED');
    const date = env.ASSISTANT_PRICE_REVIEWED_ON || '';
    const priceReviewedAt = Date.parse(`${date}T00:00:00Z`);
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(priceReviewedAt)
      && new Date(priceReviewedAt).toISOString().slice(0, 10) === date, 'CONFIG_PRICE_DATE_INVALID');
    Object.assign(config, { provider, providerLabel: settings.label, providerUrl: settings.url, model, apiKey,
      currency: settings.currency, inputPriceMicros, outputPriceMicros, dailyBudgetMicros, monthlyBudgetMicros,
      priceReviewedAt, priceValidUntil: priceReviewedAt + 7 * 86400000 });
    requireValue(pricesFresh(config, now), 'CONFIG_PRICES_EXPIRED');
  }
  return Object.freeze(config);
}
