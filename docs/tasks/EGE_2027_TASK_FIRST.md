# Profile and basic EGE: task first, help in place

## Identity

- Date: 2026-10-22 (Asia/Novosibirsk).
- Base branch: main; base SHA: `13b73619de97176789bc71d06617108aeb3d5994`.
- Branch: `feat/ege-2027-task-first`.
- Review level: MEDIUM, bounded presentation changes to established trainer engines.
- Owner request: apply the revised OGE approach to profile and basic EGE and provide published links.
- Existing presentation reference: `docs/TRAINER_PRESENTATION_PRINCIPLES.md`.

## Goal and scope

Show the problem, its essential diagram/data and a clear answer action first.
Offer optional, nested help in the same page without losing the problem, answer
or completed work. Simplify the two course entrances and use the 2027 season.

- Profile: existing `/ege-profil/start/` lesson families; retain task generators,
  mathematics, answer validation and progress accounting. Use one help disclosure,
  explicit prompts and readable green controls. Keep essential diagrams visible.
- Basic EGE: all existing 107 EGE families in `/ege-baza/path/`; task first with
  same-page explanation, model and steps. Keep main and intermediate drafts
  separate, preserve model settings, retain assisted/independent distinctions.
- Keep optional checks and existing stored progress. Grade7, pre7, managed
  cabinet lessons, diagnostic/exam restrictions and server contracts are outside
  this change. Their existing behavior must remain intact.
- Simplify the entry pages and retain old links and historical bank/source years.
  Preserved 2026 exam numbering and scoring must not be falsely relabelled 2027.
- This is presentation of existing banks, not a claim of complete FIPI coverage
  or completion of every profile second-part prototype.

## Acceptance criteria

- A lesson shows the task and all essential givens before any help is requested.
- Help is keyboard/touch accessible, optional, can be hidden, and supports
  further explanation. Each input states what the learner must enter.
- Opening help records assistance; closing it does not restore independent
  credit. No help action automatically submits, completes or replaces a task.
- Drafts and completed work survive help toggles. New tasks have their own drafts.
- Existing mathematical keys and generation stay unchanged; model controls and
  retained step justifications remain available.
- Narrow/mobile screens are readable with no document overflow.
- Both published course entries and changed runtime files match the reviewed build.

## Checks and review

- New profile/base task-first coverage, state and browser journeys.
- Existing profile mathematics/state/full-course gates and base virtual-classroom
  gates, including unchanged grade7 and assessment contracts where exercised.
- Existing browser tests may update UI setup/selectors when the old sequential
  presentation is replaced. Retain substantive grading/state assertions; record
  deliberate new display expectations instead of skipping them.
- Entry/navigation, local links, SEO and `git diff --check`.
- Independent source and visual review of the final result.
- Paid Claude consultation remains deferred by the owner's explicit conversation
  decision. No Claude API call or external Claude approval is claimed. Independent
  agent reviews and synthetic learner checks do not establish real learning gains.
- Final gate: `EGE_2027_TASK_FIRST_OK` after publication identity checks.

## Risks and rollback

Risks: separating final and guided drafts, accidentally granting independent
credit after help, altering shared grade7 routes, collapsing essential givens.
Use additive backward-compatible UI state, preserve stored identity and evaluate
those behaviors explicitly. Roll back this scoped commit via a normal reviewed
revert; no pupil-data migration, credentials or server changes are involved.

## Permissions and delivery

Owner requested implementation and has standing explicit authorization to publish
all these course updates in the active conversation. Branch, commit, PR, ordinary
merge and Pages publication are covered. No force push, admin override, payment,
provider change or destructive operation is authorized.
Fresh remote-main guard and exact reviewed-head checks remain required. Record
PR/head/CI/deployment/production evidence in the PR when available; reconcile
project status as part of this task, not a recursive status-only release.
