# MathExam task — integrate the public navigation chat

## Identity

- Task: `MATHEXAM_PUBLIC_ASSISTANT_V1`, continuation of [PR #361](https://github.com/ladynata-cloud/math-exam-fipi/pull/361).
- Owner: repository owner.
- Date: 2026-10-31 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `c9bf66e2d95f48db0134d43cc590da89f8bc3053`.
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

The owner's current direct instruction to continue PR #361, compare it with
current main, update the catalogue, test and prepare publication is this task's
START. The final separate base/head release decision remains required by the
repository policy. The old task is continued through a new main-based branch
and replacement Draft PR, preserving PR #361's history without force, rebase or
a non-fast-forward merge.

Main already contains the assistant/cabinet foundation (#358), task helpers
(#369), stereometry hidden-edge fixes (#376), public entry fixes (#368), updated
Vilenkin courses/help (#378/#380), Atanasyan chapter VIII (#382), and improved
arithmetic/division (#377). These changes are retained. The old PR's 40 cloud
workflows were 32 successful, seven failed and one cancelled; they are not a
passing release gate. The [integration report](../reports/MATHEXAM_PUBLIC_ASSISTANT_INTEGRATION_20261031.md)
records fresh evidence and the remaining release conditions.

## Approved scope

### In scope

- Port the isolated public navigator from #361 onto current main, including its
  exact two-script inclusion and narrow fixture/generator compatibility changes.
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
- Rewriting an old branch, merge, auto-merge or deployment without the separate
  exact-base/head owner decision. This task does not change review policy.

### Files and boundaries retained

Every one of the 832 existing HTML files must match the base byte-for-byte after
removal of the exact inclusion. All existing course data, scripts, storage keys,
review records and frozen baselines are retained. Two review-bound textbook
shells remain unchanged: `geometry-course/textbook/index.html` and
`stereo-course/textbook/index.html`. They remain valid navigation destinations.

`school/peterson6/index.html` and `trainers/maxim-peterson6/index.html` retain their
published task-aware helpers without a duplicate public launcher. Private,
board/source/archive/export/redirect pages remain outside public admission.

## Acceptance criteria

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

## Permissions

- Current START, local branch/commits, push and replacement Draft PR: yes.
- Existing public-source inspection and synthetic local/browser checks: yes.
- Provider credentials/calls, external messages and new paid infrastructure: no.
- Merge, auto-merge and deployment: pending separate current base/head decision.

## Execution record

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
