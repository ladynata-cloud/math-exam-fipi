# MathExam task specification

## Identity

- Task: `AVITO_SHOWCASE_20261101`
- Owner: MathExam project owner
- Date: 2026-11-01 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `37718f1c0138ba031314b8f4716b73c9d963bc81`
- Planned branch: `feat/avito-showcase-20261101`
- Review level: `MEDIUM`
- Related issue or ADR: no architectural change; existing static public pages.
- ADR status: not applicable. Proposed ADR0001 is not used as authority.

## Goal

Give parents and pupils arriving from Avito a convincing, complete first visit:
understand individual online mathematics lessons for grades 5–11, OGE and both
EGE levels, try a few verified public examples, and contact the teacher.

## Context and evidence

- The current owner explicitly requests: «Сделай на MathExam привлекательную
  витрину для родителей и учеников, приходящих из Авито» and «Подготовь
  соответствующие изменения сайта через GitHub, выполни проверки и согласуй
  публикацию». This is the current implementation instruction, not a copied
  approval from an earlier task. Release approval is still a separate step.
- Current public `/` emphasizes OGE. Existing `/lessons/` already offers school
  mathematics, OGE and basic/profile EGE, and the existing personal Telegram
  and VK destinations. Public contact addresses are preserved.
- The base is the PR391 squash merge. Its primary release record reports
  successful Pages and coordinated source delivery. Reconciliation of that
  record is not a new certification of cabinet or assistant behavior.
- Public division, OGE graphs, profile right-triangle practice and Atanasyan
  cone explanation are candidates. Only examples that pass the scoped browser
  check may appear in the final showcase. An explanation is not advertised as
  an automatically marked proof.

## Approved scope

### In scope

- Rebuild existing `lessons/index.html` as the canonical advertising showcase,
  using a dedicated stylesheet and ordinary accessible links.
- Make the homepage hero and metadata reflect school mathematics, OGE and EGE,
  with a prominent route to the showcase and its selected examples.
- Offer three age/goal entry anchors, truthful teaching benefits, selected
  public examples and existing direct booking contacts, including public email.
- Keep examples in explicitly labelled new tabs so booking remains available.
- Check complete selected learner journeys, responsive layouts, navigation,
  resource availability, normal TLS production parity, SEO and existing funnel.
- Add a task, verification report, focused regression scripts and a scoped CI
  workflow; reconcile the relevant project status within the same PR.

### Out of scope

- Publishing or merging this PR; those require a separate owner decision.
- Completing other courses, adding trainers or changing teaching engines.
- Cabinets, accounts, real pupil records, assistant models, billing, prices,
  communications sent to people, advertising purchases and hosting settings.
- Claims of full textbook coverage, guaranteed marks or automatic assessment
  where the existing example only offers an explanation.

### Files or areas that must not change

- Existing trainer/course engines, source banks, storage keys and board code.
- Existing analytics behavior, verification tags, robots and canonical routes.
- Existing tests/gates and branch protection must not be weakened.
- Other tasks and open PRs.

## Acceptance criteria

- [x] First screen clearly identifies grades 5–11, school lessons, OGE and EGE.
- [x] A parent can understand the teaching approach and reach direct contact.
- [x] Showcase links only to the selected public examples and contact channels;
      no cabinet or unchecked course catalogue entry is offered there.
- [x] Every selected example passes a complete appropriate learner path.
- [x] Examples and booking remain usable at 320px, 390px and desktop widths.
- [x] Keyboard focus, headings, anchors, no-JavaScript content and reduced
      motion are checked; no horizontal overflow on the showcase.
- [x] Existing verification tags, analytics safeguards and canonical URLs stay
      intact; scoped SEO and funnel checks pass.
- [x] Independent focused review, exact committed diff and complete Draft PR
      identify failures and unperformed checks honestly.

## Checks and gates

- Required tests: selected real-browser demo journeys and landing navigation;
  existing `tools/lesson-funnel.test.cjs`; scoped public SEO/sitemap checks.
- Required static checks: link/asset existence, expected contact destinations,
  no cabinet routes in showcase, syntax/metadata, `git diff --check`.
- Manual checks: actual desktop and phone-width screenshots; first screen,
  examples, booking and visible completion states.
- Final gate marker: `AVITO_SHOWCASE_READY` for preparation only.
- Production gate: verify deployed exact assets and navigation after separate
  release approval; physical-device and real-pupil trials are not inferred.

## Review plan

- Review-level rationale: bounded product presentation and navigation across
  static files, with easy rollback and no new runtime boundary.
- Trainer design consultation applicable: no; existing learning sequences and
  interactions remain unchanged.
- Before implementation: read-only product audit of live offer, contacts and
  public demo candidates; no external-provider consultation requested.
- Ready-result review: independent focused code/product review and actual
  browser completion evidence for the selected exercises.
- External review required: no under the MEDIUM policy; no external verdict is
  claimed. Internal agent review is labelled as such.
- Sanitized handoff: public source and synthetic browser work only; no private
  account records, credentials or machine-specific paths.

## Risk and rollback

- Main risks: a selected demo is less usable than its entry page suggests;
  narrow screens obscure actions; copy overstates what a course can do.
- Rollback plan: before release, close the Draft PR; after separate authorized
  publication, revert this bounded presentation commit through the normal PR
  workflow. No data rollback or migration is required.
- Data/compatibility: existing URLs and analytics are preserved. Exercises use
  their existing browser storage; tests use isolated synthetic profiles and
  never erase a visitor's previous progress.

## Permissions

- Current task start and implementation authorization: the owner's direct
  action instruction quoted above authorizes preparation through GitHub.
- Branch creation, local commits, push and Draft PR: authorized by that current
  request to prepare the site changes through GitHub.
- Merge, auto-merge and deployment: **not authorized**; request the owner's
  decision only after the concrete reviewed base/head and checks are available.

## Execution record

- Actual branch: `feat/avito-showcase-20261101`
- Actual base SHA: `37718f1c0138ba031314b8f4716b73c9d963bc81`
- Actual head SHA and PR: final Draft PR metadata is authoritative.
- Tests, review, failures and limitations: see
  `docs/reports/AVITO_SHOWCASE_20261101.md` and the final PR record.
- Scope deviations: none planned.

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
