// A separate, bounded SYNTHETIC evaluation. Never used by the pupil interface.
import {mkdirSync, openSync, writeSync, fsyncSync, closeSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {manifest, questions} from './materials.mjs';

export const ENDPOINT = 'https://api.openai.com/v1/responses';
export const profiles = Object.freeze({
  'gpt-6-luna':Object.freeze({effort:'none', inputNanoUsd:125, standardInputNanoUsd:100, outputNanoUsd:500}),
  'gpt-6.2-sol':Object.freeze({effort:'low', inputNanoUsd:5000, standardInputNanoUsd:2000, outputNanoUsd:10000})
});
const MAX_OUTPUT = 1024, MAX_INPUT_BYTES = 65536, MAX_CALLS = 32;
const MAX_REPLY_JSON_BYTES = 6144, MAX_RESPONSE_BYTES = 262144;
const INPUT_OVERHEAD = 1024, CEILING_NANO_USD = 1_000_000_000, TIMEOUT_MS = 45000;
const PRICING_CHECKED_AT = '2026-11-23T17:26:52.000Z';
const PRICING_EXPIRES_AT = '2026-11-30T17:26:52.000Z';
const digest = value => createHash('sha256').update(value).digest('hex');
const bytes = value => Buffer.byteLength(value, 'utf8');
const usd = value => (value / 1e9).toFixed(9);

export class EvaluationError extends Error {
  constructor(code, metadata = {}) { super(code); this.code = code; Object.assign(this, metadata); }
}
function requireValue(condition, code) { if (!condition) throw new EvaluationError(code); }
function requireCurrentPricing(value) {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  requireValue(Number.isFinite(time) && new Date(time).toISOString() === value, 'E_CLOCK');
  requireValue(time >= Date.parse(PRICING_CHECKED_AT), 'E_PRICING_NOT_CURRENT');
  requireValue(time < Date.parse(PRICING_EXPIRES_AT), 'E_PRICING_EXPIRED');
}
function budget(value = '1') {
  requireValue(typeof value === 'string' && /^(?:0(?:\.\d{1,9})?|1(?:\.0{1,9})?)$/.test(value), 'E_BUDGET');
  const [whole, decimal = ''] = value.split('.');
  const result = Number(whole) * 1e9 + Number(decimal.padEnd(9,'0'));
  requireValue(result > 0 && result <= CEILING_NANO_USD, 'E_BUDGET');
  return result;
}
function select(options) {
  const model = options.model ?? 'gpt-6-luna';
  requireValue(Object.hasOwn(profiles, model), 'E_MODEL');
  const corpus = questions(), limit = options.limit ?? corpus.length;
  requireValue(Number.isInteger(limit) && limit >= 1 && limit <= corpus.length, 'E_CASE_LIMIT');
  return {model, profile:profiles[model], corpus:corpus.slice(0,limit), maximum:budget(options.maxUsd)};
}
function payload(item, history, model, profile) {
  return {model, instructions:item.instruction,
    input:[{role:'user', content:'Контекст текущего задания: ' + JSON.stringify(item.context)}, ...history],
    reasoning:{effort:profile.effort}, max_output_tokens:MAX_OUTPUT,
    service_tier:'default', store:false};
}
function estimate(request, profile) {
  const serialized = JSON.stringify(request), length = bytes(serialized);
  requireValue(length <= MAX_INPUT_BYTES, 'E_INPUT_BOUND');
  const inputBound = length + INPUT_OVERHEAD;
  return {inputBound, requestBytes:length,
    reserve:inputBound * profile.inputNanoUsd + MAX_OUTPUT * profile.outputNanoUsd};
}
function buildPlan(options) {
  const selected = select(options), calls = [];
  for (const item of selected.corpus) {
    const history = [];
    for (const [turn, message] of item.turns.entries()) {
      history.push({role:'user', content:message});
      const bound = estimate(payload(item, history, selected.model, selected.profile), selected.profile);
      calls.push({caseId:item.id, turn:turn + 1, inputTokenBound:bound.inputBound,
        outputTokenBound:MAX_OUTPUT, reservedNanoUsd:bound.reserve, reservedUsd:usd(bound.reserve)});
      // The bound covers the entire JSON string of a future reply. This
      // placeholder is used only for planning and is NEVER sent or logged as a reply.
      history.push({role:'assistant', content:'x'.repeat(MAX_REPLY_JSON_BYTES)});
    }
  }
  requireValue(calls.length > 0 && calls.length <= MAX_CALLS, 'E_CALL_BOUND');
  const total = calls.reduce((sum, call) => sum + call.reservedNanoUsd, 0);
  requireValue(total <= selected.maximum, 'E_BUDGET_EXCEEDED');
  const metadata = manifest();
  return {selected, publicPlan:{version:1, kind:'synthetic-evaluation-plan',
    sourceFingerprint:metadata.sourceFingerprint, sources:metadata.sources,
    packetSha256:digest(JSON.stringify(selected.corpus)), model:selected.model,
    reasoningEffort:selected.profile.effort, serviceTier:'default', store:false,
    pricing:{currency:'USD', standardInputPerMillion:usd(selected.profile.standardInputNanoUsd * 1e6),
      maximumInputPerMillion:usd(selected.profile.inputNanoUsd * 1e6),
      outputPerMillion:usd(selected.profile.outputNanoUsd * 1e6),
      costBasis:'all input reserved and settled at maximum possible cache-write rate; conservative upper bound, not billing',
      source:'https://developers.openai.com/api/docs/pricing', checked:'2026-11-23', checkedTimezone:'UTC',
      checkedAt:PRICING_CHECKED_AT, expiresAt:PRICING_EXPIRES_AT},
    caseCount:selected.corpus.length, callCount:calls.length, maximumUsd:usd(selected.maximum),
    worstCaseUsd:usd(total), estimateMethod:'UTF-8 payload bytes plus 1024 tokens; engineering bound, not a tokenizer',
    maximumReplyJsonBytes:MAX_REPLY_JSON_BYTES, maximumInputBytes:MAX_INPUT_BYTES, calls}};
}

export function planEvaluation(options = {}) { return buildPlan(options).publicPlan; }

function containsCredential(value, credentials) {
  return typeof value === 'string' && Object.values(credentials).some(secret =>
    typeof secret === 'string' && secret.length > 0 && value.includes(secret));
}
function safeRequestId(response, credentials) {
  const value = response.headers?.get('x-request-id');
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value) &&
    !containsCredential(value, credentials) ? value : null;
}
async function readBody(response, controller) {
  if (response.body?.getReader) {
    const reader = response.body.getReader(), chunks = []; let length = 0;
    try {
      while (true) {
        const next = await reader.read(); if (next.done) break;
        length += next.value.byteLength;
        if (length > MAX_RESPONSE_BYTES) { controller.abort(); throw new EvaluationError('E_RESPONSE_BOUND'); }
        chunks.push(Buffer.from(next.value));
      }
      return Buffer.concat(chunks).toString('utf8');
    } finally { reader.releaseLock(); }
  }
  const text = await response.text();
  requireValue(bytes(text) <= MAX_RESPONSE_BYTES, 'E_RESPONSE_BOUND');
  return text;
}
async function requestModel(request, credentials, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let httpStatus = null, requestId = null;
  try {
    const headers = {'Content-Type':'application/json', Authorization:'Bearer ' + credentials.key};
    if (credentials.organization) headers['OpenAI-Organization'] = credentials.organization;
    if (credentials.project) headers['OpenAI-Project'] = credentials.project;
    const response = await fetchImpl(ENDPOINT, {method:'POST', headers,
      body:JSON.stringify(request), redirect:'error', signal:controller.signal});
    httpStatus = Number.isInteger(response.status) ? response.status : null;
    requestId = safeRequestId(response, credentials);
    requireValue(!response.redirected && (!response.url || response.url === ENDPOINT), 'E_REDIRECT');
    requireValue(httpStatus !== null && httpStatus >= 200 && httpStatus < 300, 'E_HTTP_STATUS');
    const text = await readBody(response, controller);
    let data;
    try { data = JSON.parse(text); } catch { throw new EvaluationError('E_RESPONSE_JSON'); }
    return {data, httpStatus, requestId};
  } catch (error) {
    const code = error instanceof EvaluationError ? error.code
      : controller.signal.aborted || error?.name === 'AbortError' ? 'E_TIMEOUT' : 'E_TRANSPORT';
    throw new EvaluationError(code, {httpStatus, requestId});
  } finally { clearTimeout(timeout); }
}
function validate(data, profile, model, bound) {
  requireValue(data && typeof data === 'object' && !Array.isArray(data), 'E_RESPONSE_SHAPE');
  requireValue(typeof data.id === 'string' && /^resp_[a-zA-Z0-9_-]{1,160}$/.test(data.id), 'E_RESPONSE_ID');
  requireValue(data.model === model, 'E_RESPONSE_MODEL');
  requireValue(data.status === 'completed' && data.error == null && data.incomplete_details == null, 'E_INCOMPLETE');
  requireValue(data.service_tier === 'default', 'E_RESPONSE_TIER');
  requireValue(data.reasoning?.effort == null || data.reasoning.effort === profile.effort, 'E_RESPONSE_REASONING');
  const usage = data.usage;
  requireValue(usage && [usage.input_tokens,usage.output_tokens,usage.total_tokens].every(Number.isSafeInteger), 'E_USAGE');
  requireValue(usage.input_tokens > 0 && usage.input_tokens <= bound.inputBound &&
    usage.output_tokens > 0 && usage.output_tokens <= MAX_OUTPUT &&
    usage.total_tokens === usage.input_tokens + usage.output_tokens, 'E_USAGE_BOUND');
  const cached = usage.input_tokens_details?.cached_tokens ?? 0;
  const reasoning = usage.output_tokens_details?.reasoning_tokens ?? 0;
  requireValue(Number.isSafeInteger(cached) && cached >= 0 && cached <= usage.input_tokens &&
    Number.isSafeInteger(reasoning) && reasoning >= 0 && reasoning <= usage.output_tokens, 'E_USAGE_DETAILS');
  for (const [details, allowed] of [[usage.input_tokens_details,['cached_tokens']], [usage.output_tokens_details,['reasoning_tokens']]]) {
    requireValue(details == null || typeof details === 'object' && !Array.isArray(details), 'E_USAGE_DETAILS');
    if (details) requireValue(Object.keys(details).every(key => allowed.includes(key) || details[key] === 0 || details[key] === null), 'E_UNEXPECTED_USAGE_DETAILS');
  }
  requireValue(Array.isArray(data.output) && data.output.length > 0, 'E_OUTPUT');
  const texts = [];
  for (const item of data.output) {
    if (item?.type === 'reasoning') continue;
    requireValue(item?.type === 'message' && item.role === 'assistant' && item.status === 'completed' && Array.isArray(item.content), 'E_OUTPUT_TYPE');
    for (const part of item.content) {
      requireValue(part?.type === 'output_text' && typeof part.text === 'string', 'E_OUTPUT_TYPE');
      texts.push(part.text);
    }
  }
  const reply = texts.join('\n').trim();
  requireValue(reply.length > 0 && bytes(JSON.stringify(reply)) <= MAX_REPLY_JSON_BYTES, 'E_REPLY_BOUND');
  const cost = usage.input_tokens * profile.inputNanoUsd + usage.output_tokens * profile.outputNanoUsd;
  requireValue(cost <= bound.reserve, 'E_COST_BOUND');
  return {responseId:data.id, returnedModel:data.model, reply,
    inputTokens:usage.input_tokens, outputTokens:usage.output_tokens, cachedTokens:cached,
    reasoningTokens:reasoning, reasoningProfileObserved:data.reasoning?.effort ?? null, cost};
}
function writeAll(fd, content) {
  const data = Buffer.from(content,'utf8'); let offset = 0;
  while (offset < data.length) {
    const count = writeSync(fd,data,offset,data.length - offset);
    requireValue(count > 0, 'E_LOCAL_IO'); offset += count;
  }
}
function createFile(path, content) {
  const fd = openSync(path,'wx',0o600);
  try { writeAll(fd, content); fsyncSync(fd); } finally { closeSync(fd); }
}
function safeEnvironment(env, expectedProjectId) {
  const key = env.OPENAI_API_KEY;
  requireValue(typeof key === 'string' && key.length >= 12 && key === key.trim() && !/[\r\n]/.test(key), 'E_KEY_MISSING');
  const organization = env.OPENAI_ORG_ID || null, project = env.OPENAI_PROJECT_ID || null;
  requireValue(typeof expectedProjectId === 'string' && expectedProjectId.length > 0 && project, 'E_BONUS_PROJECT_REQUIRED');
  requireValue(!organization || /^org-[a-zA-Z0-9_-]{1,120}$/.test(organization), 'E_ACCOUNT_CONFIG');
  requireValue(/^proj_[a-zA-Z0-9_-]{1,120}$/.test(project) && project === expectedProjectId, 'E_BONUS_PROJECT_MISMATCH');
  return {key, organization, project};
}

export async function runEvaluation(options = {}, dependencies = {}) {
  const {selected, publicPlan} = buildPlan(options);
  if (options.run !== true) return {...publicPlan, kind:'dry-run', actualCalls:0};
  if (dependencies.onPlan) dependencies.onPlan(publicPlan);
  const now = dependencies.now || (() => new Date().toISOString());
  requireCurrentPricing(now());
  // Credential reading happens only after explicit --run and complete bounded planning.
  const credentials = safeEnvironment(dependencies.env || process.env, options.expectedProjectId);
  requireValue(typeof options.out === 'string' && options.out.length > 0, 'E_OUTPUT_DIRECTORY_REQUIRED');
  const out = resolve(options.out);
  const fetchImpl = dependencies.fetchImpl || globalThis.fetch;
  requireValue(typeof fetchImpl === 'function', 'E_TRANSPORT_UNAVAILABLE');
  try { mkdirSync(out,{mode:0o700}); }
  catch { throw new EvaluationError('E_OUTPUT_DIRECTORY_NOT_FRESH'); }
  let lock, journal;
  const append = event => { writeAll(journal, JSON.stringify({at:now(), ...event}) + '\n'); fsyncSync(journal); };
  let actualCalls = 0, spent = 0, pending = 0;
  const seenIds = new Set();
  try {
    const parentFd = openSync(dirname(out),'r'); try { fsyncSync(parentFd); } finally { closeSync(parentFd); }
    lock = openSync(join(out,'run.lock'),'wx',0o600); writeAll(lock,'single-use\n'); fsyncSync(lock);
    createFile(join(out,'plan.json'), JSON.stringify(publicPlan,null,2) + '\n');
    journal = openSync(join(out,'journal.jsonl'),'ax',0o600);
    const directoryFd = openSync(out,'r'); try { fsyncSync(directoryFd); } finally { closeSync(directoryFd); }
    append({event:'started', model:selected.model, packetSha256:publicPlan.packetSha256,
      maximumUsd:publicPlan.maximumUsd, accountBinding:{organization:!!credentials.organization,
        project:!!credentials.project, projectSha256:digest(credentials.project)}});
    for (const item of selected.corpus) {
      const history = [];
      for (const [turn, user] of item.turns.entries()) {
        requireCurrentPricing(now());
        history.push({role:'user',content:user});
        const request = payload(item, history, selected.model, selected.profile);
        const bound = estimate(request,selected.profile);
        requireValue(actualCalls < MAX_CALLS && spent + pending + bound.reserve <= selected.maximum, 'E_BUDGET_EXCEEDED');
        pending = bound.reserve;
        // Durable reservation precedes the sole attempt. An uncertain result
        // stays reserved; this run never retries or resumes.
        append({event:'reserved', caseId:item.id, turn:turn + 1, requestedModel:selected.model,
          requestSha256:digest(JSON.stringify(request)), inputTokenBound:bound.inputBound,
          outputTokenBound:MAX_OUTPUT, reservedNanoUsd:pending, reservedUsd:usd(pending)});
        actualCalls += 1;
        const response = await requestModel(request,credentials,fetchImpl);
        let result;
        try {
          result = validate(response.data,selected.profile,selected.model,bound);
          requireValue(!containsCredential(result.responseId, credentials) &&
            !containsCredential(result.reply, credentials), 'E_SECRET_IN_OUTPUT');
          requireValue(!seenIds.has(result.responseId), 'E_DUPLICATE_RESPONSE');
        }
        catch (error) { throw new EvaluationError(error.code || 'E_RESPONSE_SHAPE', {httpStatus:response.httpStatus, requestId:response.requestId}); }
        append({event:'response',caseId:item.id,turn:turn + 1, httpStatus:response.httpStatus, requestId:response.requestId,
          responseId:result.responseId, requestedModel:selected.model, returnedModel:result.returnedModel,
          inputTokens:result.inputTokens,outputTokens:result.outputTokens,cachedTokens:result.cachedTokens,
          reasoningTokens:result.reasoningTokens,reasoningProfileObserved:result.reasoningProfileObserved,
          estimatedCostNanoUsd:result.cost,estimatedCostUsd:usd(result.cost),reply:result.reply,
          costBasis:'input at maximum cache-write rate; upper-bound estimate, not billing',
          assessment:'model-unreviewed; never automatically published or accepted as training'});
        spent += result.cost; pending = 0; seenIds.add(result.responseId);
        history.push({role:'assistant',content:result.reply});
      }
    }
    append({event:'completed',actualCalls,estimatedCostUsd:usd(spent),uncertainReservedUsd:usd(pending)});
    return {kind:'completed',actualCalls,estimatedCostUsd:usd(spent),uncertainReservedUsd:usd(pending),
      pedagogicalEvaluation:'not performed', outputDirectory:out};
  } catch (error) {
    const code = error instanceof EvaluationError ? error.code : 'E_LOCAL_IO';
    if (journal !== undefined) {
      try { append({event:'halted',code,httpStatus:error.httpStatus ?? null,requestId:error.requestId ?? null,
        actualCalls,estimatedCostUsd:usd(spent),uncertainReservedUsd:usd(pending),retryAllowed:false}); } catch {}
    }
    throw new EvaluationError(code,{httpStatus:error.httpStatus ?? null, requestId:error.requestId ?? null,
      actualCalls,estimatedCostUsd:usd(spent),uncertainReservedUsd:usd(pending)});
  } finally {
    if (journal !== undefined) closeSync(journal);
    if (lock !== undefined) closeSync(lock);
    // Keep both the directory and lock marker. Any second invocation is rejected.
  }
}

export function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--run') { requireValue(!Object.hasOwn(options,'run'), 'E_ARGUMENT'); options.run = true; continue; }
    const field = {'--model':'model','--max-usd':'maxUsd','--limit':'limit','--out':'out','--bonus-project':'expectedProjectId'}[flag];
    requireValue(field && !Object.hasOwn(options,field) && index + 1 < argv.length, 'E_ARGUMENT');
    const value = argv[++index]; requireValue(!value.startsWith('--'), 'E_ARGUMENT');
    options[field] = field === 'limit' ? (/^\d+$/.test(value) ? Number(value) : NaN) : value;
  }
  return options;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const options = parseArguments(process.argv.slice(2));
    console.log(JSON.stringify(await runEvaluation(options,{
      onPlan:plan => console.log(JSON.stringify({stage:'before-run',...plan},null,2))
    }),null,2));
  }
  catch (error) {
    console.error(JSON.stringify({error:error instanceof EvaluationError ? error.code : 'E_LOCAL_IO',
      ...(/^(E_PRICING_|E_CLOCK$)/.test(error.code || '') ? {
        action:'Verify the UTC clock and current official pricing; refresh the reviewed rate bounds and seven-day dates in source. No override is available.'
      } : {}),
      httpStatus:error.httpStatus ?? null, requestId:error.requestId ?? null,
      actualCalls:error.actualCalls ?? 0,estimatedCostUsd:error.estimatedCostUsd ?? null,
      uncertainReservedUsd:error.uncertainReservedUsd ?? null}));
    process.exitCode = 1;
  }
}
