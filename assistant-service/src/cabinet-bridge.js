import { requireValue, exactKeys } from './errors.js';
import { hash, secretEqual } from './store.js';
import { prepareRequest, callProvider } from './provider.js';
import { pricesFresh } from './config.js';
import { prepareCabinetQuestion, answerCabinetOffline, buildCabinetMessages, listCabinetProfiles } from './cabinet-topics.js';
import { COURSE_PROFILE } from './course-context.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUBJECT = /^[a-f0-9]{64}$/;
const ASK_KEYS = ['subject', 'requestId', 'profileId', 'topic', 'question', 'attempt', 'mode', 'hintLevel', 'simpler', 'externalConsent'];
const FALLBACK_CODES = new Set(['PROVIDER_DISABLED', 'BUDGET_EXHAUSTED', 'API_RATE_LIMIT', 'PROVIDER_BUSY', 'PROMPT_LIMIT']);

// Both the existing private UI and the cabinet bridge use the same reservation,
// failure and output boundary. A failed call retains its reserve; no retry or
// higher-priced provider is ever selected here.
export async function executeAssistantAnswer({ store, config, clock, fetchImpl, active, res,
  session, input, cards, offline, externalAllowed = true, externalConsent = input.externalConsent,
  permanentRequestId = null, messageBuilder }) {
  let answer = offline, notice, usage, reservation;
  const reservationArgs = { sessionHash: session.hash, requestId: input.requestId, permanentRequestId };
  const eligible = externalAllowed && config.mode === 'api' && externalConsent && offline.verification !== 'deterministic';
  if (eligible) {
    let prepared;
    try {
      prepared = prepareRequest(config, input, cards, clock(), messageBuilder);
      reservation = store.reserve({ ...reservationArgs, kind: 'api', reservedMicros: prepared.reservedMicros, inputBound: prepared.inputBound });
    } catch (error) {
      if (!FALLBACK_CODES.has(error.code)) throw error;
      notice = 'Внешняя модель сейчас недоступна или достигнут лимит. Показываю материалы MathExam без платного запроса.';
    }
    if (reservation) {
      const controller = new AbortController();
      active.set(reservation.id, { controller, sessionHash: session.hash });
      const disconnect = () => { if (!res.writableEnded) controller.abort(); };
      res.once('close', disconnect);
      try {
        const result = await callProvider({ config, prepared, input, cards, fetchImpl, signal: controller.signal });
        answer = result.answer; usage = result.usage;
      } catch (error) {
        if (error.code === 'PROVIDER_USAGE_CONTRACT') store.tripCircuit();
        notice = 'Модель не дала проверяемый ответ. Показываю материалы MathExam; повторного платного запроса не было.';
      } finally { active.delete(reservation.id); res.removeListener('close', disconnect); }
    }
  }
  if (!reservation) reservation = store.reserve(reservationArgs);
  try {
    const response = store.finish(reservation, session.hash, answer, usage);
    return { ok: true, answer: response, ...(notice ? { notice } : {}) };
  } catch (error) { store.fail(reservation); throw error; }
}

function authorize(req, config) {
  requireValue(config.cabinetBridgeKey, 'ROUTE_NOT_FOUND', 404);
  // This is a service-to-service boundary. It never accepts browser sessions or
  // an Origin exception to the existing public API's CSRF rules.
  requireValue(!Object.hasOwn(req.headers, 'origin') && !Object.hasOwn(req.headers, 'cookie')
    && !['sec-fetch-site', 'sec-fetch-dest', 'sec-fetch-user'].some(key => Object.hasOwn(req.headers, key)), 'CABINET_BROWSER_REJECTED', 403);
  // Node's server-side fetch adds Sec-Fetch-Mode: cors itself. The browser-only
  // site/destination metadata above, Origin and cookies remain forbidden.
  const authorizations = req.rawHeaders.filter((_, index) => index % 2 === 0)
    .filter(name => name.toLowerCase() === 'authorization').length;
  requireValue(authorizations === 1 && secretEqual(req.headers.authorization, `Bearer ${config.cabinetBridgeKey}`), 'CABINET_ACCESS_DENIED', 401);
}

function prepare(body, config) {
  requireValue(exactKeys(body, [...ASK_KEYS, 'courseContext', 'courseRevision']) && ASK_KEYS.every(key => Object.hasOwn(body, key)), 'CABINET_REQUEST_INVALID');
  requireValue(Object.hasOwn(body, 'courseContext') === Object.hasOwn(body, 'courseRevision'), 'CABINET_REQUEST_INVALID');
  requireValue(typeof body.subject === 'string' && SUBJECT.test(body.subject), 'CABINET_SUBJECT_INVALID');
  requireValue(typeof body.requestId === 'string' && UUID.test(body.requestId), 'REQUEST_ID_INVALID');
  requireValue(typeof body.externalConsent === 'boolean' && typeof body.simpler === 'boolean', 'CABINET_REQUEST_INVALID');
  requireValue(body.profileId !== COURSE_PROFILE || body.externalConsent === false, 'CABINET_COURSE_SOURCE_ONLY', 409);
  const credentials = [config.cabinetBridgeKey, config.apiKey, config.pilotKey].filter(value => typeof value === 'string' && value.length >= 16);
  requireValue(!credentials.some(value => [body.question, body.attempt].some(text => typeof text === 'string' && text.includes(value))), 'PERSONAL_DATA_REJECTED');
  const { input, cards } = prepareCabinetQuestion({
    profileId: body.profileId, topic: body.topic, question: body.question, attempt: body.attempt,
    mode: body.mode, hintLevel: body.hintLevel, simpler: body.simpler, requestId: body.requestId,
    ...(Object.hasOwn(body, 'courseContext') ? { courseContext: body.courseContext, courseRevision: body.courseRevision } : {})
  });
  // Neither subject nor the bridge's authentication material enters input,
  // source cards or a provider payload.
  return { subject: body.subject, input: { ...input, requestId: body.requestId }, cards, externalConsent: body.externalConsent };
}

export function createCabinetBridge({ config, store, clock, fetchImpl, active, readBody, send }) {
  return async function cabinetBridge(req, res) {
    if (!req.url.startsWith('/internal/cabinet/')) return false;
    requireValue(req.method === 'POST' && ['/internal/cabinet/ask', '/internal/cabinet/feedback', '/internal/cabinet/status'].includes(req.url), 'ROUTE_NOT_FOUND', 404);
    authorize(req, config);
    const body = await readBody(req, config.maxBodyBytes);
    if (req.url === '/internal/cabinet/status') {
      requireValue(exactKeys(body, []), 'CABINET_REQUEST_INVALID');
      send(res, 200, { ok: true, protocolVersion: 1, mode: config.mode,
        externalEnabled: config.cabinetExternalEnabled === true && config.mode === 'api' && pricesFresh(config, clock()) && !store.meta('provider_circuit'),
        providerLabel: config.providerLabel, profiles: listCabinetProfiles() });
      return true;
    }
    if (req.url === '/internal/cabinet/feedback') {
      requireValue(exactKeys(body, ['subject', 'answerId', 'rating'])
        && typeof body.subject === 'string' && SUBJECT.test(body.subject)
        && typeof body.answerId === 'string' && UUID.test(body.answerId)
        && ['helpful', 'simpler', 'incorrect'].includes(body.rating), 'FEEDBACK_INVALID');
      const session = store.cabinetSession(body.subject);
      store.feedback(session.hash, body.answerId, body.rating === 'simpler' ? 'unclear' : body.rating);
      send(res, 200, { ok: true }); return true;
    }
    const { subject, input, cards, externalConsent } = prepare(body, config);
    const session = store.cabinetSession(subject, true);
    input.simpler ||= !!session.simpler;
    const offline = answerCabinetOffline(input, cards);
    const result = await executeAssistantAnswer({ config, store, clock, fetchImpl, active, res,
      session, input, cards, offline, externalConsent,
      externalAllowed: config.cabinetExternalEnabled === true && input.profileId !== COURSE_PROFILE,
      // UUIDs are globally unique operations. Changing a profile, pseudonym or
      // bridge/session secret must not make the same operation spend again.
      permanentRequestId: hash(`cabinet-request:${input.requestId.toLowerCase()}`), messageBuilder: buildCabinetMessages });
    if (input.profileId === COURSE_PROFILE) {
      result.notice = 'Подсказка взята из проверенного разбора курса. Внешняя модель не вызывается; доказательство проверяет преподаватель.';
    } else if (result.answer.verification !== 'model-unverified' && !result.notice && !config.cabinetExternalEnabled) {
      result.notice = 'Внешняя модель для кабинетов не подключена. Это проверенные подсказки MathExam.';
    }
    result.answer.answerId = result.answer.id;
    result.answer.sourceIds = (result.answer.sources || []).map(source => source.id);
    result.mode = result.answer.verification === 'model-unverified' ? 'api' : 'offline';
    send(res, 200, result); return true;
  };
}
