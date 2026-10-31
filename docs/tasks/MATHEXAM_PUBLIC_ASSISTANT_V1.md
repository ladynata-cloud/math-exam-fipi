# MathExam task — integrate the public navigation chat

## Identity

- Task: `MATHEXAM_PUBLIC_ASSISTANT_V1`, continuation of [PR #361](https://github.com/ladynata-cloud/math-exam-fipi/pull/361).
- Owner: repository owner.
- Date: 2026-10-31 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `139b944a70f2e8ba4d340d152d08807fad03e5da`.
- Original preparation base: `c9bf66e2d95f48db0134d43cc590da89f8bc3053`.
- Branch: `feat/public-assistant-main-20261031`.
- Current Draft PR: [#385](https://github.com/ladynata-cloud/math-exam-fipi/pull/385).
- Review level: `HIGH`: broad public-page wiring and a free-text interface.
- Related accepted ADR: [0011](../adr/0011-independent-assistant.md), bounded public navigation extension.
- Original prepared head: `391f595ab3639fe24990911691d24192a58b44ab`, stacked on the earlier cabinet branch.

## Goal

Let a visitor find current MathExam materials through a compact, honest navigation
chat on the home page and supported public trainers. Preserve the already
published learning, saved-work, URL and SEO contracts. A full language model is
a separate future stage, with no model call or model capability claim here.

## Context and evidence

The owner's direct instruction to continue PR #361, compare it with current
main, update the catalogue, test and prepare publication established this task's
START. Initial preparation continued the task through a main-based branch and
replacement Draft PR, preserving PR #361's history without force or rebase.

On 2026-10-31 the owner explicitly authorized a normal history-preserving merge
of the new `main` into the existing PR #385 branch, scope rebinding and task
document updates. The reconciled base is `139b944a70f2e8ba4d340d152d08807fad03e5da`.
This authorization covers branch reconciliation, validation, commits and push;
it does not authorize PR #385 to merge into `main`, auto-merge, deployment or an
external-review exception. The separate exact-base/head release decision remains
required by repository policy.

The subsequent direct instruction, "fix the errors and continue", authorizes
repair of the confirmed current-head CI blockers in this same task. The bounded
amendment audits and imports only the six-file source-provenance repair already
prepared in PR #375, plus two source-course browser fixtures that must serve the
actual public navigator and the narrowly scoped operations-receipt privacy test
that also failed on the preceding head. This does not import the dialogue/provider
changes from that PR or grant release permission. The nine exact additional paths
are listed below and in the scope manifest; the existing base and strict guards
remain.

Main already contains the assistant/cabinet foundation (#358), task helpers
(#369), stereometry hidden-edge fixes (#376), public entry fixes (#368), updated
Vilenkin courses/help (#378/#380), Atanasyan chapter VIII (#382), improved
arithmetic/division (#377), and Atanasyan 10–11 §2 Cone (#374). These changes are
retained. The old PR's 40 cloud workflows were 32 successful, seven failed and
one cancelled; they are not a passing release gate. The
[integration report](../reports/MATHEXAM_PUBLIC_ASSISTANT_INTEGRATION_20261031.md)
records fresh evidence and the remaining release conditions.

## Approved scope

### In scope

- Port the isolated public navigator from #361 onto current main, including its
  exact two-script inclusion and narrow fixture/generator compatibility changes.
- Reconcile the existing PR #385 branch with the authorized current main by a
  normal merge, preserve both histories, rebind the existing scope manifest and
  update task records. That reconciliation retained its original allowed-file
  list; the later authorized blocker repair adds only the nine paths below.
- Repair the stale canonical-source pin after independently proving that all
  255 selected cards, catalogue entries, ordering, revisions, sections, display
  overrides and historical exact-byte oracles are unchanged. Regenerate only
  source-provenance fingerprints and update their exact dependent test pins.
- Strengthen the two affected browser fixtures to serve only the three exact
  public-helper assets and exercise real public pages with the navigator loaded,
  retaining all original source, geometry, saved-work and cabinet assertions.
- Repair the operations-receipt privacy oracle's treatment of coincidental
  four-digit PIN substrings in typed opaque metadata, retaining credential-key
  and payload checks, exact DTO-path/database-identity validation, deliberate leak
  controls and actual issuance isolation. Keep the optional browser artifact
  readiness selector specific to the intended open route library.
- Update verified material routes and clarify ambiguous course/grade requests.
- Preserve numbered exam intent through clarification, and avoid substituting
  elementary arithmetic for advanced mathematical objects. Include the current
  prime-number table and Ichenskaya grade 7 collection without dropping existing routes.
- Make its limits visible: prepared navigation only, no current-exercise reading,
  no answer checking, no general AI dialogue, no invented textbook completeness.
- Closed-by-default mobile/desktop panel, scoped keys/focus, inert text rendering,
  input up to 400 characters and at most 40 in-memory messages.
- Offer `/lessons/#contact` only after two explicit learning difficulties, once
  per current conversation, or an explicit tutor request; respect refusal.
- No transmission/persistence of entered messages; retain analytics masking hooks
  without making guarantees about independent page analytics or extensions.
- Reproducible public coverage, exact source preservation, regression tests,
  internal review, exact-head cloud checks and a reviewable release report.

### Out of scope

- Provider keys/calls, paid infrastructure, general AI, training, a public API,
  pupil records, service/account changes, automatic messages or navigation.
- Exercise content, grading, learning sequence, stored progress, board protocols,
  server code, existing URLs/canonicals/sitemap/robots, or unrelated styling.
- Rewriting branch history, merging PR #385 into `main`, auto-merge or deployment
  without the separate exact-base/head owner decision. The authorized main-to-PR
  reconciliation above does not change review policy or release permissions.

### Files and boundaries retained

Every one of the 832 existing HTML files must match the base byte-for-byte after
removal of the exact inclusion. All teaching content, runtime scripts, storage
keys, review records and frozen baselines are retained. The narrow provenance
exception changes only the selected course's `source.sha256` and its helper
snapshot's `sourceSha256` / `courseSha256`, with matching strict test pins.
Two review-bound textbook
shells remain unchanged: `geometry-course/textbook/index.html` and
`stereo-course/textbook/index.html`. They remain valid navigation destinations.

`school/peterson6/index.html` and `trainers/maxim-peterson6/index.html` retain their
published task-aware helpers without a duplicate public launcher. Private,
board/source/archive/export/redirect pages remain outside public admission.

The authorized blocker repair may additionally touch only:

- `tools/atanasyan-first-steps/build.py`
- `learning/atanasyan-first-steps/course.json`
- `assistant-service/knowledge/atanasyan-first-steps.json`
- `tools/atanasyan-first-steps/source.test.cjs`
- `tools/ichenskaya-grade7-works/source.test.cjs`
- `assistant-service/test/course-context.test.js`
- `tools/atanasyan-first-steps/browser.cjs`
- `tools/ichenskaya-grade7-works/browser.cjs`
- `tools/learning-free-route.browser.cjs`

These paths do not authorize changes to server/runtime behavior, learning
content, credential/provider configuration or existing historical oracles.

## Acceptance criteria

Checked items record the previously verified product behavior. Fresh validation
of the reconciled head is recorded separately in the integration report and PR.

- [x] Current verified destinations work across home, arithmetic, OGE, EGE and public school courses.
- [x] Ambiguity is clarified; a navigator is never presented as a general model or solver.
- [x] Existing task helpers remain usable without duplicate launchers.
- [x] Closed widget does not obstruct the checked learner controls; open panel fits narrow screens.
- [x] Every admitted page has exactly one block; private and protected pages have none.
- [x] Source bytes, URLs, SEO and existing learning data are retained.
- [x] Privacy, bounded-memory, focus/keyboard, safe-links and referral tests pass.
- [ ] Relevant current-head gates and independent review are recorded accurately.

## Checks and gates

- Navigation queries, route/anchor verification, ambiguous intents and referral/privacy state.
- Admission and strict static-script exception, full 832-HTML base-byte proof and exact scope.
- Real browser public sections, 320/390/1280 layouts, obstruction, existing-helper preservation,
  storage/network interception, keyboard and iframe/private suppression.
- Actual division draft/notebook and single-submit continuation; actual Vilenkin
  condition/draft/route/storage preservation and draft retention after reload.
- SEO/sitemap/catalogue, existing arithmetic/OGE/profile fixture and browser gates.
- Unchanged protected shells; stereo generator and offline Pogorelov reproduction.
- Syntax and `git diff --check`; cloud checks must match the final PR head.
- Both bounded-course builders and source tests, the independent Ichenskaya
  mathematics audit, full canonical textbook reproduction, both helper knowledge
  projections, retained-work/cabinet tests and forged-source context negatives.
- Full first-steps and Ichenskaya public/native/teacher browser journeys, with
  the real public helper assets available rather than silently returning 404.
- Full synthetic free-route browser, typed receipt validation, positive leak
  injections and unchanged receipt snapshots around credential issuance.
- Four additional narrow fixture corrections cover URL loading in public
  continuation/arithmetic and exact T14 inclusion normalization. Original UI and
  geometry hashes remain fixed; negative controls reject unrelated changes.
- Local preparation marker: `MATHEXAM_PUBLIC_ASSISTANT_PREPARED_OK`.
- Provider inference, real pupil activation and production rollout are not local test claims.

## Review plan

HIGH remains appropriate. Independent internal review and full relevant gates are
required. External exact-head review is required unless the owner explicitly
accepts a reasoned exception. No unrelated release exception or copied marker
is approval. No trainer is created or its learning sequence redesigned, so a
trainer design consultation is not applicable.

A remote handoff contains only public scoped code, synthetic scenarios and
base/head/PR identities; no secrets, pupil details or machine-specific paths.
A valid external record needs provider, PR, base, head, verdict and verifiable
source/timestamp. Unavailable external review must be reported as not run.

## Risk and rollback

Main risks are misleading routes/capability claims, UI obstruction, duplicate
helpers and mistaken public admission. Exact page proof, isolated styles/keys,
strict links and real page journeys bound these risks. Rollback removes only
the exact marked inclusion from admitted pages and reruns coverage/SEO/browser
checks; it does not delete learner work or assistant-service accounting data.
The provenance repair keeps the course and helper knowledge fingerprints paired.
Any release or rollback of that pair must keep cabinet/helper packaging aligned;
the existing context handshake rejects mismatches. The canonical textbook and
all teaching/learner identities remain unchanged by the repair.

## Permissions

- Current START, local branch/commits, push and replacement Draft PR: yes.
- Normal merge of main into the existing PR branch with both histories retained,
  scope rebinding, task-document updates, validation, continuation commits and push: explicitly
  authorized by the owner on 2026-10-31.
- Confirmed CI-blocker repair, the nine narrowly enumerated repair paths,
  validation, commits and push: authorized by the subsequent direct instruction
  to fix the errors and continue. This is not a HIGH-review exception.
- Existing public-source inspection and synthetic local/browser checks: yes.
- Provider credentials/calls, external messages and new paid infrastructure: no.
- PR #385 merge into `main`, auto-merge and deployment: pending separate current
  base/head decision. External HIGH review remains required unless separately
  waived by an explicit reasoned owner decision.

## Execution record

The history-preserving reconciliation commit
`7d1ab4e33d6d0b0b342d1d86b507808d05d5a762` has parents
`40a43c89d0f3c8738aa15ede96dd43ee5ceece70` and
`139b944a70f2e8ba4d340d152d08807fad03e5da`, with clean merged tree
`69aac2c41c036793408248dba09ac95e39a47446`. The scope manifest uses the second
parent as its base. That reconciliation retained the existing allowed-file list;
the subsequently authorized blocker repair adds only the nine enumerated paths
while retaining the same strict base, placement and scope guards.
Fresh local navigator, scope, browser, SEO and composed-course checks are recorded
in the integration report. Exact final head, branch update and fresh cloud
outcomes are recorded separately in the current PR handoff.

Exact head, replacement PR, completed gates, failures/not-run items, coverage and
review evidence are recorded in the integration report and final PR body. The
original #361 is historical preparation, not a production release.

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
