# Arzhenikov contextual assistant — implementation receipt

Date: 2026-11-24 (Asia/Novosibirsk). Task:
[ARZHENIKOV_ASSISTANT_20261124](../tasks/ARZHENIKOV_ASSISTANT_20261124.md).
Review level: HIGH. Base: `b944df23a069b593aa03c7bcc4f9938300695f41`.

This is a preparation receipt. The associated Draft PR records its exact public
head, final CI, screenshots and subsequent access changes. This document does
not claim publication, a completed provider experiment or improved pupil results.

## Result and boundaries

The existing exercise now contains a collapsed, local helper. It reads the
current lesson, public condition, action model, first unfinished step and input.
Four actions offer a starting point, a simpler explanation, the purpose of a
step and a check of the current notation. A short text question maps to bounded
intents. It is a deterministic helper, not an unrestricted model conversation.

The panel opens without recording help. Mathematical feedback, including
confirmation of an unsubmitted correct value, is saved as assistance before
being shown. The course's own buttons remain responsible for accepting a step
or answer. Earlier `firstCorrect` and `firstHelpUsed` are preserved, including
after reload. A correction or model change clears an obsolete verdict.

The context uses an explicit field allowlist. It omits expected answers, model
targets, future steps, complete solutions and saved pupil records. The helper
uses no network, does not persist its conversation, writes text through
`textContent` and excludes its contents from the existing session replay and
click-map mechanism. The original bank conditions, IDs, progress namespace,
public navigator and course structure remain intact.

The autonomous ZIP includes the same helper. Its reproducible build contains
41 files. The checked archive SHA-256 is
`780d8780f47f30abf8f4541d0e84cd85067890e1930ad7ad7e2cf7d5c1192a1e`.

## Reconciliation with production

At task start the authoritative main was the released PR
[#742](https://github.com/ladynata-cloud/math-exam-fipi/pull/742), with Pages
run `45174901215`. The public course HTML, engine and fraction bank returned
HTTP 200 and matched the base bytes. That release contains 76 lessons and
608 conditions across six tracks. `PROJECT_STATUS.md` now distinguishes this
published baseline from the new assistant preparation.

## Course material and model evaluation

`site-assistant/arzhenikov` creates 76 local reference examples and 24 synthetic
evaluation cases containing 28 user turns. It covers all six tracks. References
use task index 0; evaluation uses other task IDs with index 4 or greater, plus
a missing-context case. This separation tests different conditions within
shared lessons and mathematical types; it does not establish transfer to wholly
unseen types. Model inputs omit the separate evaluator rubric and numerical keys.

The multi-turn runner uses the actual preceding model response. Default execution
is a dry run with no credential read or network. An explicit real run requires
an existing key and an exact match between the configured project and the
operator's selected bonus project. The endpoint and model profiles are bounded;
each fresh run has a USD 1 ceiling, at most 32 calls, a durable reservation before
each request, no retries and no resume of a used directory. Failed or uncertain
requests retain their reservation. Responses remain unreviewed model output.
The ceiling is not a check of the actual bonus balance or a global account limit.

The old Kimi/OpenAI pilot archive was inspected as historical design evidence.
Its halted queue and ledger were not executed, copied into this repository,
repaired or restarted. No private project identifiers, credentials or pupil
data were added to this package.

At preparation time Kimi and the former Codespaces entry showed sign-in pages,
and no API credential was available in the current runtime. Therefore the
new task has **0 provider responses, 0 live API calls and USD 0 API spend**.
No new key was created. Local reference answers are labelled
`local-rules-reference`; they are not attributed to Kimi or OpenAI. No model
weight training or pedagogical score is claimed. Any later authenticated run
requires its own truthful response, usage and review receipt.

## Local checks and independent review

| Check | Result at preparation |
| --- | --- |
| Dialogue, original course and extended arithmetic unit tests | 40 passed, including all 76 lessons, 608 conditions and intermediate steps |
| Site assistant tests, including material and bounded runner | 35 passed after independent runner review fixes |
| Real course DOM interactions | `ARZHENIKOV_ASSISTANT_DOM_PASS` |
| Extended arithmetic regression DOM | 36 lessons, 288 conditions, 1015 pupil steps and 144 independent first solutions passed |
| Offline closure and preservation | 7 passed; deterministic rebuild check passed |
| Exact HTML source binding | Required in the follow-up provenance commit and PR gate |
| Real Chromium and visual inspection | Pending GitHub Actions; local launch blocked by `socket() failed: Operation not permitted` |
| Provider evaluation and manual pedagogical scoring | Not run: authenticated access unavailable |

Independent agents reviewed the UI and dialogue across ownership boundaries.
They found and fixed an incorrect verdict after removing an input control
character, uncounted value-dependent format feedback and stale context after an
input/model change. Additional fixes avoid a misleading unchanged-denominator
hint and a scale-factor hint that named ready answers. Every existing hint
template and repeated requests for answers were checked against the actual banks.

A separate review verified the mathematics, source-task separation and absence
of grading answers in all synthetic model inputs. The runner receives an
independent technical review of budget accounting, durable reservations,
failure handling, credentials and genuine multi-turn history. It identified
and fixed undercounted cache-write premiums and possible secret reflection in
provider identifiers. Both reservations and reported usage estimates now use
the conservative maximum input rate. A seven-day pricing validity check blocks
stale real runs; the real UTC verification time is distinct from the user's
Novosibirsk calendar date. These are local
technical reviews, not external Kimi/Claude release approvals.

## Remaining gates and release boundary

The source binding must identify the reviewed public source commit for exactly
`trainers/oge-basics/multiplication-division/arzhenikov-map.html`. Other page
bindings, the global base and prior receipts remain unchanged. Applicable
exact-head CI, online/offline Chromium interaction, 320/390/1280 px layouts and
manual screenshot review must be recorded in the Draft PR. The marker
`ARZHENIKOV_ASSISTANT_TECHNICAL_PASS` is reserved for that completed gate.

The user-supplied AGENTS instructions in this conversation require a separate
explicit owner authorization for merge and deployment. They override the
repository's broader standing policy for this task. Neither a successful test
nor a provider answer is release authorization.

Risks are stale instructional context, misleading hints, help attribution and
mobile layout. An ordinary revert PR restores the prior runtime and offline
bundle without migrating or deleting pupil progress. No force/reset/rebase,
TLS bypass, weakened gate or changes to an unrelated worktree are part of this
task.

## Executive status at preparation

```text
EXECUTIVE STATUS

Task: ARZHENIKOV_ASSISTANT_20261124
PR: Draft PR receipt records the public URL and final checks
Base: b944df23a069b593aa03c7bcc4f9938300695f41
Head: exact public head recorded in the PR
Gate: local checks passed; exact-head technical gate pending
Tests: 40 course/dialogue + 35 site-assistant + 7 offline; assistant/arithmetic DOM passed
Failures: local Chromium could not launch because sockets are restricted
Not run: provider evaluation; final source-binding/CI/visual checks at this preparation point
Scope deviations: none
Recommendation: complete technical gates, restore existing provider access, then review actual responses
Next user decision: separate explicit merge/deployment authorization when the candidate is ready
```
