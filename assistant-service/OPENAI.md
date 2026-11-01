# Prepared OpenAI adapter

Preparation date: 2026-11-02 (Asia/Novosibirsk). This is an optional provider
inside the existing independent assistant, not a production activation record.

## Implemented contract

| Setting | Value |
| --- | --- |
| Provider | `openai` |
| Endpoint | `https://api.openai.com/v1/chat/completions` |
| Model | `gpt-5.4-mini-2026-03-17` only; no moving alias |
| Format | Strict JSON Schema: four required bounded fields, no additional properties |
| Reasoning | `reasoning_effort=none` |
| Processing | `service_tier=default` |
| Provider application storage | Explicit `store=false` |
| Output | Existing `ASSISTANT_MAX_OUTPUT_TOKENS`, sent as `max_completion_tokens` |
| Pricing floors | Standard uncached USD 0.75 input / 4.50 output per million |
| Default | Offline, no model call, no credential required |

The published model documentation lists this snapshot, Chat Completions, structured
output and the `none` reasoning setting. It is a bounded evaluation candidate,
not a measured recommendation about teaching quality. The previously considered
GPT-4.1 mini is marked deprecated in current documentation and is not added.
Chat Completions preserves the service's existing small request/response and
accounting boundary; this change adds no tools or provider conversation store.

All [existing configuration requirements](README.md#paid-mode--no-enabled-defaults)
still apply: explicit external/data review, secret, model, currency, prices,
fresh seven-day price acknowledgement and positive daily/monthly budgets.
Neither an API key nor a promotional credit enables requests. An actual credit
balance has not been inspected. The maximum configured input allowance (16,000)
and output allowance (800) reserve USD 0.0156 per call at these floors; normal
requests reserve their own smaller computed bound. This is a conditional
accounting limit, not a measured average cost or a provider invoice.

The existing cabinet bridge additionally requires its independent switch and
per-request consent. Teacher account settings and the cabinet-side gates remain
unchanged. Source-only courses and supported exact calculations stay local.
No browser endpoint or teacher UI can select an arbitrary model or destination.

The strict schema requires `title`, `text`, `steps` and `check`, with the same
length bounds as the existing validator. Hints have exactly one step;
explanations allow one to five. Serialized schema bytes are included in the
conservative input bound and reserved cost before transport. A schema request
is not a guarantee of mathematical correctness: local shape, safety, refusal
and hint checks still reject unsuitable output.

The response must report the exact model and standard tier. A mismatch or
invalid token accounting trips the existing persistent provider circuit.
Refusals, partial JSON, truncated answers, tool calls, unexpected reasoning,
oversized output and obvious over-answering are rejected. A failed or uncertain
request retains its reservation; there is no automatic retry. API output is
always `model-unverified`, never automatically checked mathematics or training
material. The exact allowlisted model name can appear in evaluation provenance
even though its date resembles a phone number; arbitrary output and model
labels retain their privacy checks.

## What remains before live use

1. Complete the repository's HIGH review/release process. This preparation
   does not release this adapter or PR385 (navigation). PR375 was separately
   published at `059ee8c9f5baeb0b333c96d9b8516edb570666b2`, with external
   inference off. Its review exception does not transfer to this adapter.
2. Verify real account/provider eligibility, supported service geography,
   deployment egress and applicable data conditions. The official supported
   country list does not include Russia; this adapter does not resolve that
   restriction or provide a workaround. A foreign server alone does not prove
   that offering the service to the intended users is permitted.
3. Review child-data conditions before any pupil traffic. `store=false` is not
   Zero Data Retention: standard abuse-monitoring retention is separate.
   OpenAI's under-18 guidance calls for ZDR before processing personal data of
   children below 13 or the applicable digital-consent age. Real eligibility,
   ages, consent and data settings have not been verified here.
4. Run a separately bounded live synthetic evaluation, then pedagogical review
   of Russian explanations, wrong attempts, partial hints and task context.
   The existing DeepSeek CLI is pinned to its own campaign and must not be used
   as an OpenAI authorization. Mock transport validates plumbing, not quality.
5. Only after those results, verify the selected course/context and already
   published dialogue work for the intended private pilot. This adapter alone
   does not make the source-only Vilenkin/Peterson task buttons into free model chat.

No pupil records were accessed, API keys configured, model calls sent, model
weights trained or budget spent during preparation. Disable external mode to
roll back and preserve both ledgers. Reverting the additive code has no schema
migration and does not delete learner work.

## Primary references checked

- [GPT-5.4 mini model, snapshot, pricing and capabilities](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [Chat Completions request and response contract](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
- [Structured output schema and remaining refusal handling](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Data retention and controls](https://developers.openai.com/api/docs/guides/your-data)
- [Under-18 API guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)
- [Supported countries and territories](https://developers.openai.com/api/docs/supported-countries)
