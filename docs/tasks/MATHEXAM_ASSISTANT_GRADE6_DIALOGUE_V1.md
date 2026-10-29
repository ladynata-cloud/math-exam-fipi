# Grade 6 assistant: bounded follow-up questions

## Identity

- Task: MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_V1
- Owner: MathExam project owner
- Date: 2026-10-30 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: 6fb959fc0130a0bb8842601d19297e305ac91ac0
- Branch: codex/assistant-grade6-dialogue-20261030
- Review level: HIGH (authenticated cabinet boundary and outbound data)
- Architecture: accepted [ADR 0011](../adr/0011-independent-assistant.md)

## Goal and context

A learner can ask a short follow-up about the last explanation without replacing
the original mathematics problem. Add the grade 6 Vilenkin NOD/NOK profile next
to the existing Peterson decimal profile. The current assistant already supports
private cabinets, step hints, a default-off provider boundary and durable quotas;
it does not yet pass previous exchanges into a follow-up model request.

The owner asked to continue making the assistant in the current conversation.
The attached discussion clarifies the desired contextual assistant; it supplies
no new deployment, model-data or spending approval. This task implements the
reviewable candidate using synthetic fixtures and mocked model responses.

## Scope

- Add Vilenkin profile using the existing NOD/NOK solver and public trainers.
- Keep root task, previous explanation and new question together for follow-up.
- Cache only bounded successfully returned exchanges in gateway process memory;
  maximum 15 minutes from the first answer, 60 entries, 3 previous pairs, 3500 UTF-8 bytes of dialogue.
- Bind parent responses to account/session, settings version, profile and task.
- Require every existing external permission and per-request acknowledgement.
- Treat all dialogue as untrusted data, with existing privacy/output validation.
- Preserve source-only geometry/local task paths, durable usage and replay guards.
- No raw dialogue database, training export, provider activation, purchases,
  API calls, credentials, account changes, new trainers, merge or deployment.
- No changes to pupil data, course content, root hosting or unrelated open work.

## Acceptance

- NOD/NOK calculations match an independent oracle, including ones, repeated
  factors and coprimes; hints do not disclose a final result by default.
- A follow-up contains the trusted root problem and a bounded previous exchange.
- Client cannot supply arbitrary history, roles or another account's response.
- Expiry, settings/session/task changes, active assessment and disabled external
  access fail closed; stale parents cannot advance an old conversation branch.
- No automatic retries, provider fallback, hidden paid calls or quota reset.
- UI preserves displayed steps, explicitly labels unavailable model access,
  and discards stale follow-up anchors across task/account changes.

## Validation and review

Required: full helper and cabinet Node tests; assistant local/UI browser and E2E
regressions where runtime available; generated-course check; diff/secret review.
Review gate: MATHEXAM_ASSISTANT_GRADE6_DIALOGUE_PREPARED_OK denotes preparation
only. Independent technical review required; HIGH external exact-head review
remains a release prerequisite, not evidence implied by an agent's own verdict.
Live provider compatibility/pedagogy and hosting rollout are not tested here.

Trainer design consultation: no new trainer or learning sequence is introduced;
existing prime-factor hints are reused. Real learner pedagogical suitability of
model follow-ups still requires separately authorized evaluation. No live
external design consultation was run for this bounded assistant extension.

## Risk and rollback

External inference remains off by default. Memory context expires, is lost on
restart and never enters persistent pupil records. Disabling the cabinet helper
or reverting this change withdraws the feature without deleting either ledger.
New catalog must be deployed to cabinet and helper together; existing exact
catalog handshake fails closed during mismatched versions. No automatic pupil
profile assignment occurs.

## Permissions and handoff

The current request authorizes development, isolated branch, tests, commits,
push and a Draft PR. Merge, auto-merge, deployment, paid calls and student API
activation require separate authorization after the candidate is reviewable.
Sanitized handoffs contain only source, synthetic fixtures and test results.
Execution results and exact committed head will be recorded in the PR.

Base refresh: main advanced during implementation with unrelated Atanasyan chapter
content. Adopted 6fb959fc by fast-forward only; no rebase or merge commit.
