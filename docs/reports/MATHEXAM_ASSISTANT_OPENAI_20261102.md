# Prepared OpenAI helper adapter and strict answer contract

Date: 2026-11-02 (Asia/Novosibirsk). Task:
[MATHEXAM_ASSISTANT_OPENAI_20261102](../tasks/MATHEXAM_ASSISTANT_OPENAI_20261102.md).
Branch: `feat/assistant-openai-adapter-20261102`; [Draft PR399](https://github.com/ladynata-cloud/math-exam-fipi/pull/399).
Original base: `6b9c327f2ca438cb7e7620ef302876de467fac19`. Review: HIGH.

## Result

The default-off OpenAI adapter uses only `gpt-5.4-mini-2026-03-17` at the fixed
Chat Completions endpoint. The continuation adds strict JSON Schema with four
required fields, bounded strings, exactly one hint step or up to five explicit
explanation steps. Local output, refusal, privacy and hint validators still
apply; structured output does not certify mathematical correctness.

The input bound now includes serialized schema bytes before the 16,000-token
ceiling and integer cost reservation. A request affordable under the former
message-only estimate but exceeding its budget with the schema is rejected
before transport. DeepSeek/Amvera keep their existing format and accounting.
Standard uncached prices, store=false, reasoning_effort=none, default tier,
model/tier verification, no retries and the durable circuit remain.

PR375 was separately published as `059ee8c9f5baeb0b333c96d9b8516edb570666b2`.
The [immutable release record](https://github.com/ladynata-cloud/math-exam-fipi/blob/d060c99a7fcd19db2f68a494d2ca5350ef4b1e71/docs/reports/ASSISTANT_PR375_RELEASE_20261102.md)
and current main establish that baseline. PROJECT_STATUS is reconciled within
this task. No pupil settings, hosting, keys, curriculum or production runtime
were changed in this continuation. External inference remains off.

## Verification

Node 24.22.1. All model transports were synthetic; real local HTTP, input
validation, SQLite storage, reservation and replay handling were exercised.

| Check | Result |
| --- | --- |
| Full PR399 assistant suite | 133 passed, 0 failed, 0 skipped |
| OpenAI groups within that suite | 14 passed |
| Full isolated composition with published PR375 | 145 repository tests + 1 temporary dialogue probe passed, 0 failed/skipped |
| Both course knowledge reproduction checks | ATANASYAN_ASSISTANT_SOURCE_OK; ICHENSKAYA_ASSISTANT_SOURCE_OK |
| Changed JavaScript syntax and whitespace | PASS |
| Scope | Original eight allowed files; two runtime files |
| Paid model requests; real pupil records accessed | 0; 0 |

New regressions verify actual outbound schema fields and mode bounds, UTF-8
context and schema accounting, exactly-at-limit acceptance and one-byte-over
rejection, legacy provider compatibility, malformed or unsafe output despite
a schema request, and a real HTTP budget denial including schema cost.
Existing tests retain consent, free exact arithmetic, reservation before
transport, secret/identity exclusion, restart replay, model/tier drift,
refusal/truncation, timeout, no retries and persistent circuit coverage.

For compatibility, assistant-service was extracted from immutable current main,
then overlaid with only this task's config, provider and OpenAI test files.
Unchanged source/course links resolved to the original repository paths. The
extra temporary HTTP probe first obtained a free deterministic decimal result,
then sent an opted-in follow-up through OpenAI with the original task and prior
explanation. It verified strict schema, the complete reservation before fetch,
identity exclusion, no conversation text in SQLite and replay rejection after
restart. The probe is composition evidence, not part of the 133-test head gate.

The first composition run found one missing original course link in the sparse
checkout (`courses/vilenkin-6-part-1`). Restoring that unchanged original path
and rerunning the entire composed suite yielded the 146 passing checks above.
No test or assertion was weakened. Original preparation findings (allowlisted
model-date metadata filtering and sparse trainer links) remain fixed.

The status update is placed in an unchanged document section so the existing
main preparation record is preserved by the ordinary three-way merge. The new
published record explicitly supersedes it. No main merge, rebase, force push or
branch-history repair was performed. Exact-head CI status, the tested tree and
publication SHA are recorded in the PR after publication, avoiding a recursive
report-only commit. The earlier CI run 41330891306 applies only to the previous
head and is not evidence for this continuation.

## Review, limits and rollback

Focused self-review found no outstanding defect in the bounded change. This
is not independent/external HIGH review, which remains outstanding; the PR375
owner exception does not apply. Local Docker/browser checks were not run;
GitHub's existing workflow covers contracts, desktop/mobile flow, production
image and durable restart. There is no UI modification in this task.

No live provider call, credit lookup, account change or new deployment was
performed. [Operator notes](../../assistant-service/OPENAI.md) retain primary
references and account/geography/child-data prerequisites. Live teaching
quality, account eligibility and real latency/usage remain unmeasured;
store=false is not a ZDR claim. Existing DeepSeek campaign authorization does
not authorize OpenAI calls.

Rollback: keep or return external inference to disabled and preserve both
ledgers; revert the additive code normally if required. There is no migration
or learner-storage change.

```text
EXECUTIVE STATUS

Task: MATHEXAM_ASSISTANT_OPENAI_20261102
PR: 399, existing Draft
Base: 6b9c327f2ca438cb7e7620ef302876de467fac19; compatibility main 059ee8c9f5baeb0b333c96d9b8516edb570666b2
Head: exact publication SHA and tree recorded in PR
Gate: MATHEXAM_ASSISTANT_OPENAI_PREPARED_OK (local)
Tests: 133 head; 145 composed repository tests + 1 temporary HTTP dialogue probe; source checks, syntax, scope, whitespace
Failures: none remaining in final local runs
Not run: local Docker/browser, independent/external HIGH review, live model, deployment
Scope deviations: none; same eight allowed files
Recommendation: retain default-off; complete review before release/activation
Next user decision: none for this Draft continuation; release/live pilot remain separate
```
