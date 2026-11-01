# OpenAI helper preparation evidence

Date: 2026-11-02 (Asia/Novosibirsk).
Task: [MATHEXAM_ASSISTANT_OPENAI_20261102](../tasks/MATHEXAM_ASSISTANT_OPENAI_20261102.md).
Base: `6b9c327f2ca438cb7e7620ef302876de467fac19`, main after PR396.
Branch: `feat/assistant-openai-adapter-20261102`. Review level: HIGH.

## Result

The independent assistant now has an optional, default-off OpenAI adapter.
Only `gpt-5.4-mini-2026-03-17` at the fixed official Chat Completions endpoint
is admitted. Standard uncached rates, output/input bounds and the existing
durable ledger limit requests. Storage and reasoning are explicitly disabled
in requests. Unexpected returned model/tier or usage disables further paid
requests through the existing persistent circuit.

The change does not update pupil settings, deploy a model, repair/merge the
dialogue PR375, publish the public navigator PR385, or train Qwen. Current
source already contains source-based helpers; OpenAI support is an additional
backend option, not proof of a new live pupil conversation.

## Local verification

| Check | Result |
| --- | --- |
| Full `npm --prefix assistant-service test` | 129 passed, 0 failed, 0 skipped |
| New OpenAI tests within that suite | 10 groups passed |
| `build-course-knowledge.cjs --check` | ATANASYAN_ASSISTANT_SOURCE_OK and ICHENSKAYA_ASSISTANT_SOURCE_OK |
| Changed JS syntax | PASS, config/provider/OpenAI tests |
| Whitespace and exact task scope | PASS |
| Paid provider requests | 0 |
| Real pupil data or settings | 0 accessed/changed |

Node 24.22.1. Model transport was injected with synthetic responses; HTTP
bridge, input validation, service logic and SQLite accounting were real local
components. Tests exercise a successful response, missing activation decisions,
wrong model/currency/prices, refusal, truncation, tool calls, hidden reasoning,
over-answering, malformed/oversized responses, timeout, wrong model/tier/usage,
no-consent/offline paths, exact free decimal calculations, reservation before
transport, identity exclusion, request replay after restart, budget exhaustion
and a persistent usage circuit after restart.

Two initial findings were resolved before the final run:

- The privacy filter rejected the date inside the known model snapshot when
  recording optional model provenance. Only the exact configured/allowlisted
  OpenAI model receives the metadata exception; answer text, unknown model
  strings and credentials retain filtering. The new transport test checks the
  returned provenance, and the existing credential-echo test still passes.
- A full-suite link test initially failed because the isolated sparse checkout
  omitted original trainer/Peterson files. The original paths were populated
  and the entire unchanged gate rerun successfully. No test was weakened.

Focused self-review found no remaining issue in the bounded diff. This is not
independent/external HIGH approval. No independent reviewer was used and no
external model review or live teaching-quality claim is made.

## Limits and next release conditions

Local Docker/browser suites were not run: Docker is unavailable and there is
no UI change. The existing assistant CI includes its browser/container gates;
their exact-head results belong in the PR once complete. No live provider call,
credit lookup, provider account change or production verification was performed.

[Primary-source operator notes](../../assistant-service/OPENAI.md) record the
documented model contract, standard USD rates, supported-country limitation and
child-data/retention prerequisites. The chosen model is an evaluation candidate;
Russian pedagogical quality, account eligibility, actual token/latency behavior
and intended deployment access remain unmeasured. In particular store=false
is not a ZDR claim, and the adapter does not resolve geographic eligibility.

Rollback: retain offline mode or disable external inference, preserve both
ledgers, and revert the additive adapter normally. There is no migration or
change to learner storage. Existing DeepSeek evaluation approval cannot be
reused for OpenAI.

```text
EXECUTIVE STATUS

Task: MATHEXAM_ASSISTANT_OPENAI_20261102
PR: Draft created from this branch; exact remote head recorded in PR
Base: 6b9c327f2ca438cb7e7620ef302876de467fac19
Head: exact committed head recorded in PR
Gate: MATHEXAM_ASSISTANT_OPENAI_PREPARED_OK (local)
Tests: 129/129, source checks, syntax, scope and whitespace
Failures: none remaining in final local run
Not run: local Docker/browser, independent/external HIGH review, live model, deployment
Scope deviations: none
Recommendation: keep default-off; review the bounded adapter before any activation
Next user decision: no additional decision needed to prepare the Draft; release and live pilot remain separate
```
