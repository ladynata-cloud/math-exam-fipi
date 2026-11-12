# MathExam task specification

## Identity

- Task: `FOUNDATIONS_COMPLETE_ROUTES_20261111`.
- Owner: MathExam project owner.
- Date: 2026-11-11 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `19811cc15a33d63fc0fcc0b6a11c34863ec64d03`.
- Branch: `feat/foundations-complete-routes-20261111`.
- Review level: **HIGH**: broad public learning navigation and local progress.
- Architecture: existing public foundations navigator and bounded practice/check
  patterns. No new board, server protocol, generic trainer factory or ADR acceptance.

## Goal

Make every substantive topic and subtopic in the existing basic mathematics
course a finite learning route, with a visible map, several approaches and
trainers, short practice, a fresh independent check and useful return/next steps.
Use the same public course from OGE and basic EGE and retain the earlier work.

## Context and evidence

- The verified base preparation map has 12 groups and 185 entries (122 managed,
  63 public). Four are overview catalogues, not separately assessable skills.
- `foundations/course.js` stores visits only; these are not mastery.
- The public OGE entrance already links to foundations; basic EGE has six
  prerequisite entrances. The existing division path is present in the base.
- The missing old `skill-map.html` is referenced by archived signed-number
  trainers. Its six stations can be reconstructed from those files; the
  original map file itself was not found.
- The owner directly requested this large autonomous implementation. This is
  START for the stated scope. During execution the owner explicitly revoked
  the previously supplied AGENTS instructions; the repository's active
  [standing release authorization](../OWNER_RELEASE_AUTHORIZATION.md) initially applied.
  The later user-supplied AGENTS rules explicitly reinstate separate merge
  authorization: finish implementation and Draft PR, then stop before release.
- The initial scratch clone was clean and matched authoritative remote main.
  The execution environment subsequently became unavailable. Implementation
  continues through the GitHub connector; mathematical checks run in isolated
  JavaScript and full Node/browser gates run in GitHub Actions. No local
  command result during that interruption is claimed. The environment later
  returned; the clean local branch was fast-forwarded to the existing reviewed
  remote task head for local verification.

## Approved scope

### In scope

- All 12 group maps and a concrete route for each of the 181 substantive
  existing entries. Appropriate equivalent entrances may share a route.
- Overview catalogues remain accessible without mastery credit.
- Each route has a concrete goal, prerequisites, at least two distinct
  existing trainer URLs, finite stopping instructions, six practice questions
  and two disjoint six-question check sets.
- Different models, reading/interpreting, calculations, choice of method,
  error detection and application as appropriate to the actual skill.
- Reconstructed signed-number sequence; repair only missing navigation URLs
  in the reused archived sources. Preserve their mathematical logic.
- Additive browser-only records; retain unfinished questions, answers,
  mistakes and help; distinguish fresh independent work from assisted work
  and repeated familiar conditions.
- Shared course entry from OGE/basic EGE, safe contextual return and mobile/
  keyboard access; preserve old public/managed entrances and storage.
- Independent content/technical review, exact mathematical and learner-flow
  regression checks, one task branch and PR, controlled verified publication.

### Out of scope

- Student accounts/data, server storage, board/assessment protocols, paid AI,
  external provider messages, unrelated PRs, frozen book editions.
- Claims of complete FIPI/textbook coverage or measured learning outcomes.
- Inferring mastery from legacy counters or an opened trainer.

### Areas which must remain unchanged

- `book/oge/**`, account/server schemas, prior storage keys and unrelated
  mathematical banks, branch protection, required gate strictness.

## Acceptance criteria

- [ ] Every group has a readable map, concrete starting point and ending.
- [ ] All 181 substantive old item IDs are covered exactly once; four overview
  catalogues remain libraries, without an assessment badge.
- [ ] Every route has at least two appropriate distinct trainer resources.
- [ ] All 18 questions per route are mathematically verified and disjoint
  between the learning portion and the two independent check sets.
- [ ] Every session ends after six questions with an explicit result and next
  action; there is no automatic endless regeneration.
- [ ] Assistance/errors/repeated exposure cannot become fresh independent
  success after reload, duplicate submission, return or cross-tab activity.
- [ ] Old saves remain intact; storage denial, corruption and exhausted check
  sets produce truthful messages and never erase existing data.
- [ ] Correct numerical answers accept Russian decimals/simple fractions and
  reject blank, invalid or non-finite values; choice sets are unambiguous.
- [ ] Conditions, exact models, answers and controls fit 320/390/1280px; the
  current route and return remain available; keyboard flows work.
- [ ] Existing foundation/cabinet/source link contracts remain valid.
- [ ] All applicable exact-head checks, independent review and release/site
  verification are recorded, with failures and omissions separate.

## Checks and gates

- Content: coverage, link/lesson targets, question uniqueness, independent
  exact-rational oracles and mathematical witnesses, visual bounds.
- State: finite sessions, genuine unseen success, sticky help/errors, replay,
  cross-tab merges, restore, corrupted/blocked storage and legacy isolation.
- Browser: all route entrances and model rendering; representative complete
  sessions, iframe return, mobile/desktop screenshots and actual EGE entry.
- Existing relevant foundations, division, arithmetic and EGE navigator gates.
- `git diff --check`, syntax, approved file set and source-preservation checks.
- Final marker: `FOUNDATIONS_COMPLETE_ROUTES_OK`, only after applicable gates.
- Not run: real-pupil trial and external provider review. Other unavailable
  checks are disclosed; the unavailable local runtime is not a passed check.

## Review plan

- Independent internal learning-design/source inventories precede content.
- Cross-review other contributors' banks, mathematical witnesses and links.
- Independent technical review of progress, persistence and learner behavior.
- External provider review not requested and not performed; no verdict claimed.
- Public-source-only sanitized handoffs; no private learner information,
  credentials, unrelated private documents or machine-specific paths.

## Risk and rollback

- Risks: overbroad grouping, wrong alternative resource, incorrect
  mathematics/pictures, false independent credit, lost drafts, poor narrow
  layout or a broken old return URL.
- Rollback: ordinary revert of this task after release. Existing saves,
  accounts and book versions need no migration; old code ignores new keys.

## Permissions

- START, scoped implementation, branch, commits, push and Draft PR: yes.
- Release: active standing owner policy, after the owner revoked the earlier
  AGENTS restrictions in this conversation. No repeat publication permission
  is required when gates, current-base/head and deployment checks pass.
- Force, reset, rebase, disabled TLS, admin override and weakened gates: no.

## Execution record

- Initial actual base: `19811cc15a33d63fc0fcc0b6a11c34863ec64d03`.
- Final head, PR, commits, counts, passed/failed/not-run checks and publication
  evidence: final PR and [task report](../reports/FOUNDATIONS_COMPLETE_ROUTES_20261111.md).
- Scope deviations: none.

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
