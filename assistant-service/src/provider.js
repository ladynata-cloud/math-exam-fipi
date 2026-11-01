import { AssistantError, requireValue } from './errors.js';
import { pricesFresh } from './config.js';
import { buildMessages, validateModelAnswer } from './tutor.js';
import { containsSensitiveText } from './privacy.js';

export function prepareRequest(config, input, cards, now = Date.now(), messageBuilder = buildMessages) {
  requireValue(config.mode === 'api' && pricesFresh(config, now), 'PROVIDER_DISABLED', 503);
  // The alternate builder is selected by trusted application code for the
  // cabinet's fixed profiles. No HTTP field can provide a builder or prompt.
  requireValue(typeof messageBuilder === 'function', 'PROMPT_INVALID');
  const messages = messageBuilder(input, cards);
  // For the allowlisted byte-based tokenizers: count every UTF-8 byte as a
  // token, plus a deliberately large framing margin. This is conservative,
  // not an invoice or a promise about arbitrary providers/tokenizers.
  const inputBound = Buffer.byteLength(JSON.stringify(messages), 'utf8') + 1024;
  requireValue(inputBound <= config.maxInputTokens, 'PROMPT_LIMIT', 413);
  const numerator = BigInt(inputBound) * BigInt(config.inputPriceMicros)
    + BigInt(config.maxOutputTokens) * BigInt(config.outputPriceMicros);
  const reservedMicros = Number((numerator + 999999n) / 1000000n);
  const body = { model: config.model, messages, max_tokens: config.maxOutputTokens, stream: false,
    response_format: { type: 'json_object' } };
  if (config.provider === 'deepseek') body.thinking = { type: 'disabled' };
  if (config.provider === 'openai') {
    delete body.max_tokens;
    body.max_completion_tokens = config.maxOutputTokens;
    body.reasoning_effort = 'none';
    body.service_tier = 'default';
    body.store = false;
  }
  return { body, inputBound, reservedMicros };
}

async function boundedJson(response, limit) {
  const length = response.headers.get('content-length');
  requireValue(!length || (/^\d+$/.test(length) && Number(length) <= limit), 'PROVIDER_RESPONSE_TOO_LARGE', 502);
  requireValue(response.headers.get('content-type')?.toLowerCase().startsWith('application/json'), 'PROVIDER_RESPONSE_INVALID', 502);
  requireValue(response.body, 'PROVIDER_RESPONSE_INVALID', 502);
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      requireValue(size <= limit, 'PROVIDER_RESPONSE_TOO_LARGE', 502);
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    try { await reader.cancel(); } catch {}
    if (error instanceof AssistantError) throw error;
    throw new AssistantError('PROVIDER_RESPONSE_INVALID', 502);
  } finally { reader.releaseLock(); }
}

export async function callProvider({ config, prepared, input, cards, fetchImpl = fetch, signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new AssistantError('PROVIDER_TIMEOUT', 504)); }, config.timeoutMs);
  });
  try {
    const work = (async () => {
      requireValue(!controller.signal.aborted, 'PROVIDER_CANCELLED', 503);
      const response = await fetchImpl(config.providerUrl, {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(prepared.body)
      });
      requireValue(response.ok, 'PROVIDER_UNAVAILABLE', 502);
      const data = await boundedJson(response, config.maxResponseBytes);
      // An unexpected model or processing tier invalidates our cost contract.
      // The existing durable circuit stops subsequent paid requests on this error.
      if (config.provider === 'openai') requireValue(data.model === config.model
        && data.service_tier === 'default', 'PROVIDER_USAGE_CONTRACT', 502);
      const usage = data?.usage;
      requireValue(usage && Number.isSafeInteger(usage.prompt_tokens) && usage.prompt_tokens > 0
        && usage.prompt_tokens <= prepared.inputBound && Number.isSafeInteger(usage.completion_tokens)
        && usage.completion_tokens > 0 && usage.completion_tokens <= config.maxOutputTokens,
      'PROVIDER_USAGE_CONTRACT', 502);
      requireValue(usage.total_tokens === undefined || usage.total_tokens === usage.prompt_tokens + usage.completion_tokens,
        'PROVIDER_USAGE_CONTRACT', 502);
      const choices = data.choices;
      requireValue(Array.isArray(choices) && choices.length === 1 && choices[0].finish_reason === 'stop'
        && !choices[0].message?.tool_calls && !choices[0].message?.function_call, 'PROVIDER_RESPONSE_INVALID', 502);
      const message = choices[0].message;
      requireValue(!message?.refusal, 'PROVIDER_RESPONSE_INVALID', 502);
      // Never expose or store hidden reasoning. Non-empty reasoning despite the
      // non-thinking contract is a stop condition requiring operator review.
      requireValue(!message.reasoning_content && !(usage.completion_tokens_details?.reasoning_tokens > 0), 'PROVIDER_USAGE_CONTRACT', 502);
      requireValue(typeof message.content === 'string' && message.content.length <= 7000, 'PROVIDER_RESPONSE_INVALID', 502);
      let content;
      try { content = validateModelAnswer(JSON.parse(message.content)); }
      catch { throw new AssistantError('PROVIDER_RESPONSE_INVALID', 502); }
      if (input.mode === 'hint') {
        // Bounded mitigation for obvious over-answering. Meaning cannot be
        // guaranteed by a pattern: live model pedagogy still needs evaluation.
        requireValue(content.steps.length === 1 && !/(?:^|\s)(?:ответ\s*:|answer\s*:|итоговый\s+ответ|окончательный\s+ответ)/iu
          .test([content.title, content.text, ...content.steps, content.check].join('\n')), 'PROVIDER_HINT_CONTRACT', 502);
      }
      const answerText = [content.title, content.text, ...content.steps, content.check].join('\n');
      const credentials = [config.apiKey, config.cabinetBridgeKey, config.pilotKey].filter(value => typeof value === 'string' && value.length >= 16);
      requireValue(!containsSensitiveText(answerText) && !credentials.some(value => answerText.includes(value)), 'PROVIDER_RESPONSE_INVALID', 502);
      return {
        answer: { ...content,
          sources: cards.map(card => ({ id: card.id, title: card.title, url: card.source.url })),
          verification: 'model-unverified', topic: input.topic, complete: input.mode === 'explain' },
        usage: { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens },
        // A bounded provider label is useful for synthetic evaluation provenance;
        // it is not a weight hash or a guarantee that an alias is immutable.
        reportedModel: typeof data.model === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(data.model)
          && ((config.provider === 'openai' && data.model === config.model) || !containsSensitiveText(data.model))
          && !credentials.some(value => data.model.includes(value)) ? data.model : null
      };
    })();
    return await Promise.race([work, deadline]);
  } catch (error) {
    if (error instanceof AssistantError) throw error;
    throw new AssistantError('PROVIDER_UNAVAILABLE', 502);
  } finally { clearTimeout(timer); controller.abort(); signal?.removeEventListener('abort', abort); }
}
