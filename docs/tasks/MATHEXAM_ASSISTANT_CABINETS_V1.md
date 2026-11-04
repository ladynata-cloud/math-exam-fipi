# MathExam task — bounded assistant in three selected cabinets

## Identity

- Task: `MATHEXAM_ASSISTANT_CABINETS_V1`
- Owner: repository owner
- Date: 2026-10-27 (Asia/Novosibirsk)
- Base branch: `feat/math-assistant-eval-20261027`
- Base SHA: `060a445d27e939a3d68a8e1885986ad56d5c89d5`
- Branch: `feat/math-assistant-cabinets-20261027`
- Dependencies: Draft PRs #358 and #359; both remain unmerged.
- Main observed at start: `92d733a49692744ce043503c57f29b77bfb09a24`
- Review level: `HIGH` — cabinet authorization, private configuration, quotas,
  model transport and assistance accounting.
- Related accepted ADR: [0011](../adr/0011-independent-assistant.md).

## Goal

Connect the existing mathematics helper to three owner-selected cabinets with
separate learning profiles: OGE geometry, grade-six Peterson with decimal
arithmetic consolidation, and Atanasyan triangle congruence. Keep the assistant
service separate, access restricted to explicitly selected accounts, answers
honestly labelled, and external inference disabled until the actual provider
and pupil-data conditions, required reviews and funding are resolved.

## Context and evidence

The owner's current instruction to connect these three cabinets is the START
for this task. The identities belong in private runtime configuration, not this
public task, source, fixtures, review handoffs or PR. Never resolve an account
by a first-name guess, and distinguish similarly named pupils using the
authenticated teacher's actual account/profile view.

The owner has confirmed that no DeepSeek API access is configured; personal use
of its chat does not supply an API credential. Earlier authorization of 32
synthetic DeepSeek requests / USD 0.20 remains limited to that campaign and
does not fund student traffic. No live model result is available.

Existing cabinet code establishes a server session, ownership checks and
assistance states. Linked public Peterson and OGE courses do not universally
publish structured current-task state to the cabinet. Their initial helper must
therefore use explicit mathematical task entry and identify its context honestly.
The assistant currently has its own pilot session boundary and no cabinet link.

The new approved scope extends ADR 0011's isolated pilot to an authenticated
cabinet gateway. This does not merge the databases or send cabinet identities,
credentials, photos or whole work histories to a model. The existing independent
service, reviewed knowledge and spending boundaries remain in force.

## Approved scope

### In scope

- One isolated branch and Draft PR stacked on the prepared evaluator.
- Authenticated teacher configuration for at most three enabled pupil accounts;
  no name/URL-based automatic enrolment. Private per-pupil profile selection and
  daily request quotas with durable replay/failure handling.
- Cabinet helper UI with one hint, simpler wording, retained steps and categorical
  feedback; explicit offline/model provenance, safe rendering and identity fences.
- Bounded original knowledge for the three requested topics and exact decimal
  arithmetic where supported; no invented proof or textbook exercise answer.
- Explicit manual task context for linked courses and optional owned structured
  attempt context where available. AI assistance must never count as independent
  work; teacher use also retains existing assistance semantics.
- A separately authenticated server-to-server assistant boundary with minimal
  mathematical payload, pseudonymous subjects and persistent global API budgets.
- External mode requires independent service/cabinet gates, provider review,
  teacher authorization for external transfer and the pupil's explicit request.
- Synthetic security, mathematics, integration and browser verification; private
  account verification when a supported authenticated connection is available.

### Out of scope

- Creating credentials, purchasing credit/hosting/GPU, or paid student/model calls.
- Enabling an unreviewed provider, silently moving the synthetic budget to pupils,
  weight training, auto-publishing knowledge or retaining free-text pupil chats.
- New trainers, redesigned textbook courses, arbitrary screen/photograph reading,
  automatic access to all iframe contents, or new board synchronization coverage.
- Unrelated accounts/assignments, public navigation, board/video resource changes,
  merging dependencies, merge, auto-merge or deployment.

### Areas retained

Existing course content, grading rules, cabinet authentication/session recovery,
trainer/board message contracts, root deployment configuration and video worker.
Only the required additive assistant wiring and truthful assistance marking may
touch existing cabinet paths.

## Acceptance criteria

- [x] Disabled/unselected pupils cannot access the helper via UI or direct API.
- [x] A teacher can configure only owned pupils; at most three are enabled;
      concurrent/stale settings and request replays cannot reset quotas.
- [x] Two pupil sessions cannot see one another's questions, results or feedback.
- [x] Provider payloads omit account IDs, names, credentials and whole records;
      the internal bridge is inaccessible to browser/session-only callers.
- [x] Daily limits survive restart and failed calls; actual paid reservations
      remain in the assistant's existing persistent budget boundary.
- [x] Responses distinguish checked calculation, reviewed guidance, missing
      conditions and model output; offline material is not advertised as live AI.
- [x] Decimal arithmetic and triangle-congruence conditions are independently
      checked; unsupported geometry never invents missing facts from a drawing.
- [x] Assistance is marked before a structured task can be credited independently;
      linked-course work does not invent cabinet completion or synchronization.
- [x] Desktop/mobile flows retain hints, clear on account/route changes, reject
      active markup and do not automatically retry uncertain requests.
- [ ] Required tests/gates pass, and real account binding/model/deployment status
      remains explicit when unavailable.

## Checks and gates

- Existing assistant service/evaluation tests and new bridge/topic tests.
- Relevant cabinet auth, ownership, profile, assistance, replay and quota tests.
- HTTP integration with separate offline helper and synthetic accounts.
- Real local browser rendering/interaction, desktop and narrow mobile viewport.
- Existing affected course/browser contracts and scoped CI workflows.
- Syntax, `git diff --check`, repository links, scope and sanitized-file review.
- Gate: `MATHEXAM_ASSISTANT_CABINETS_PREPARED_OK`.
- Not run without resolved access/conditions: provider inference/billing, real
  account activation, real-pupil use and deployment.

## Review plan

- HIGH because authentication and durable spending/account boundaries are touched.
- This reuses the accepted helper interaction and existing trainer contracts;
  it does not create a trainer or redesign its learning sequence. Trainer design
  consultation is not applicable to this bounded wiring/content extension.
- Independent mathematical and technical review is required before handoff.
- External exact-head review remains required by [policy](../REVIEW_POLICY.md)
  unless the owner supplies an explicit reasoned exception. No exception or
  external verdict is assumed from permission to implement this task.
- Remote material must contain only necessary public code/synthetic fixtures.
  Required provenance: provider, PR, base SHA, head SHA, verdict and source/time.

## Risk and rollback

Main risks are cross-account disclosure, forged eligibility/context, duplicated
charges, assistance misclassification, stale model responses after account
switching, and confusing offline examples with model explanations. Rollback is
to disable cabinet helper access and preserve usage/reservation records. Never
delete accounting to renew allowance. Schema additions are additive; existing
cabinet records, authentication, assignments and coursework are not migrated.

## Permissions

- Current owner START: yes, the direct three-cabinet connection instruction.
- Branch, scoped local changes/commits, push and Draft PR: yes.
- Read-only verification of the selected cabinets: yes, through authorized access.
- Actual key purchase/creation, provider calls or new paid infrastructure: no.
- Merge/auto-merge/deployment: no; a separate reviewed release decision is required.

## Execution record

- Actual branch/base: as above.
- Head, PR, checks and deployment/access limitations: final task handoff.
- No live provider call or production mutation has been performed at task start.
- [Implementation report](../reports/MATHEXAM_ASSISTANT_CABINETS_20261027.md):
  107 service and 328 board tests passed; real two-service browser completed nine
  synthetic questions without external inference. The remaining full-gate item
  is resolved by the final exact-head PR evidence, including a reported local
  denied-clipboard regression reproduced against the unchanged base interface.
- Two test-fixture corrections were necessary for reliable full-suite evidence:
  copy runtime JSON in the Docker-layout fixture and check complete foreign-seat
  values instead of two-character substrings inside random opaque identifiers.
  Existing grouping/runtime behavior and test security intent are retained.
- Later owner steering prefers three complementary teaching models (OpenAI,
  GigaChat and a Chinese candidate). That provider/orchestration implementation
  is a separate bounded task; this cabinet change remains provider-independent,
  default-off, and does not reuse the DeepSeek campaign budget for it.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
