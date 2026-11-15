// Exercise the integrated adapter with a mock transport.
import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRequest, callProvider } from '../src/provider.js';
import { getBuiltinKnowledge } from '../src/tutor.js';
import { fixture, question, modelResponse, NOW } from './helpers.js';

const MODEL = 'gpt-5.4-mini-2026-03-17';
function setup(t) {
  const { config } = fixture(t, { api: true, env: {
    ASSISTANT_PROVIDER: 'openai', ASSISTANT_MODEL: MODEL,
    ASSISTANT_INPUT_PER_MILLION: '0.75', ASSISTANT_OUTPUT_PER_MILLION: '4.50'
  } });
  const input = question({ question: '-3x + 4 = 19', mode: 'explain', externalConsent: true });
  const cards = getBuiltinKnowledge().filter(card => card.topic === input.topic);
  const prepared = prepareRequest(config, input, cards, NOW);
  let calls = 0;
  return {
    get calls() { return calls; },
    call(chain) {
      const content = { title: 'Разбор', text: 'Вычислим по шагам.',
        steps: [chain, 'Ответ: -5'], check: 'Подставь результат в исходное уравнение.' };
      return callProvider({ config, prepared, input, cards, fetchImpl: async (_url, options) => {
        calls++;
        const body = JSON.parse(options.body);
        assert.equal(body.model, MODEL);
        assert.equal(body.store, false);
        assert.equal(body.response_format.json_schema.strict, true);
        return modelResponse({ model: MODEL, service_tier: 'default', choices: [
          { finish_reason: 'stop', message: { content: JSON.stringify(content) } }
        ] });
      } });
    }
  };
}

test('composed OpenAI accepts correct mixed chains but does not certify their explanation', async t => {
  const fx = setup(t);
  for (const chain of ['-3 · x = 19 − 4 = 15', '15=19-4=-3x']) {
    const before = fx.calls, result = await fx.call(chain);
    assert.equal(fx.calls, before + 1);
    assert.equal(result.answer.verification, 'model-unverified');
    assert.equal(result.validation.mathematics.status, 'partial');
    assert.equal(result.validation.mathematics.finalAnswer, 'matched');
    assert.equal(result.validation.mathematics.mathematicallyVerified, false);
  }
});

test('composed OpenAI rejects false links despite correct final answers and never retries', async t => {
  const fx = setup(t);
  for (const chain of ['-3x=19-4=16', 'log(x)=15=16', '16=15=log(x)', '1 см=1=1 см²']) {
    const before = fx.calls;
    await assert.rejects(fx.call(chain), { code: 'PROVIDER_MATH_INVALID' });
    assert.equal(fx.calls, before + 1);
  }
});
