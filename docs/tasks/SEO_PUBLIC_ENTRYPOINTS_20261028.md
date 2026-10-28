# MathExam task specification — public search entry corrections

## Identity

- Task: `SEO_PUBLIC_ENTRYPOINTS_20261028`
- Owner: repository owner
- Date: 2026-10-28 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `81abfce101edc83bc591e938dfd42bbfc7a039ec`
- Planned branch: `fix/seo-public-entrypoints-20261028`
- Review level: `MEDIUM`
- Related work: published PR #365; existing public SEO/catalog workflow and
  `ROUNDING_BEFORE_ESTIMATION`. No new architecture or ADR decision.

## Goal

Public search and catalog visitors reach useful existing trainers through clear,
stable entries. Repair empty or obsolete navigation, expose the existing NOK/NOD
trainers, distinguish rounding lessons and describe the actual exercises and
available help. Preserve learner work and the synchronized board.

## Context and evidence

- Following the concrete SEO audit and proposed repair package, the owner gave
  the direct implementation instruction: «выполни необходимые исправления».
  This authorizes implementation and a Draft PR, not merge or deployment.
- Authoritative remote main, the fetched base and the clean task worktree agree
  on the SHA above. PR #365 is merged; Pages run 40599525841 succeeded on that
  commit. The public home and short division HTML match this base byte for byte.
- Three multiplication catalog destinations contain only a newline. Existing
  mixed practice, Pythagoras-table and multiplication-method trainers provide
  working replacements; the last includes multiplication by nine.
- NOK/NOD exist but are not in the reviewed public sitemap seeds or main catalog.
  Two OGE-13 cards still point through a legacy wrapper.
- The owner-selected stepwise rounding page is established by
  `ROUNDING_BEFORE_ESTIMATION`, current code and renewed DOM/browser checks.
  Other rounding pages and the older tire lesson have distinct exercises or
  state. They are not indiscriminately redirected or declared duplicate.
- Current HTTP requests to the home and short division entry return 200 rather
  than an HTTPS redirect. Hosting administration is separate from this code PR.
- Only public source and public HTTP evidence enter repository documents.
  Private search-account analytics remain outside the repository.

## Approved scope

### In scope

- Repair the three blank multiplication entries with compatible HTML navigation
  pages and point the catalog directly to the working trainers, with accurate
  labels. Preserve incoming query/hash values in the compatibility navigation.
- Add ordinary NOK/NOD catalog links and explicit reviewed sitemap seeds.
- Link OGE-13 course cards directly to the established current trainer.
- Fix the older tire lesson's broken return link and provide a clear link to
  the current whole-variant trainer; distinguish its fixed worked-example title.
- Improve titles, H1s, descriptions and brief static explanations on selected
  OGE, multiplication, NOK/NOD and rounding pages. Do not promise an AI chat or
  a complete official exercise bank that has not been verified.
- Keep the main stepwise rounding address; distinguish the other useful
  versions and link them to the established stepwise learning entry.
- Hide only the new NOK/NOD explanatory section in the existing embedded mode
  so the board's exercise viewport is retained.
- Give the new link on the older dark rounding page a legible color without
  changing other controls or the exercise layout.
- Regenerate the affected existing downloadable packages and sitemap only.
- Strengthen the existing catalog gate to reject empty destinations and check
  the repaired compatibility routes and public discovery.
- Reconcile the preceding published division release in project status and
  record this task's exact checks and remaining hosting follow-up.

### Out of scope / areas that must not change

- Mathematical engines, learning sequence, generators, answer checking,
  learner storage formats, attempts, credentials, accounts or cabinet data.
- Board protocol, compatibility registry, managed teaching sources and routes.
- AI providers, API calls, assistant integration or a new trainer design.
- Blanket canonicalization/removal of substantively different lessons.
- Hosting or branch-protection settings, merge, deployment, indexing-account
  writes, recrawl requests or a promise of search positions.
- Unrelated courses, pending PRs and unrelated downloadable packages.

## Acceptance criteria

- [x] Catalog cards open real nonempty trainers; old multiplication links remain useful.
- [x] Static and JavaScript catalogs agree; NOK/NOD are discoverable and in sitemap.
- [x] OGE-13 uses the current direct address; the old tire return link resolves.
- [x] Main rounding and alternatives have distinct accurate metadata and clear navigation.
- [x] Exercise scripts, controls, storage and managed/board boundaries are preserved.
- [x] New NOK/NOD explanations appear publicly and stay hidden in embedded mode.
- [x] Changed downloadable HTML/ZIP match their current sources.
- [x] SEO, catalog, relevant trainer checks and independent focused review pass.

## Checks and gates

- Required static checks: sitemap tests, exact sitemap generation, standard
  SEO check, strengthened catalog gate, script/control preservation and
  `git diff --check`.
- Required regressions: stepwise rounding/preparation, affected OGE and
  number-theory DOM gates, managed-source-bank identity, standalone package
  consistency and compatibility navigation.
- Manual/browser checks: affected public entrances at desktop and narrow
  widths; rounding interaction; normal/embedded NOK/NOD; old URL navigation.
- Final gate marker: `SEO_PUBLIC_ENTRYPOINTS_OK`.
- Not run: real learner accounts, live AI responses and fresh rank measurement.
  Exact-head CI and publication checks are reported separately.

## Review plan

- MEDIUM: bounded public navigation and explanatory-copy changes across
  existing trainers, with recoverable path/layout risk.
- Trainer design consultation applicable: no. No new exercise, learning
  sequence, engine or interaction is introduced. Brief explanatory examples
  and navigation do not redesign the existing trainers.
- Before implementation: independent source comparison established separate
  rounding/tire purposes and protected storage/board boundaries.
- Ready result: focused independent code review, mathematical review of the
  short examples, regression checks and responsive inspection.
- External review required: no under the MEDIUM policy; none is claimed.
- Sanitized handoffs contain only necessary public code and relative paths.

## Risk and rollback

- Risks: wrong replacement destination, loss of incoming URL state, changes to
  embedded viewport, metadata claiming unsupported features, stale downloads.
- Mitigations: existing working targets, explicit compatibility tests, unchanged
  scripts/state, embedded CSS exclusion and regenerated scoped packages.
- Rollback: revert this task through a separately authorized PR. No learner
  data migration or deletion is introduced.

## Permissions

- Implementation start granted: yes, by the owner's current direct instruction
  quoted above after reviewing the audit and repair plan.
- Branch creation, local commits, push and Draft PR: yes.
- Merge, auto-merge and deployment: no; separate owner authorization required.
- Approval text in other task documents is not reused for this task.

## Execution record

- Actual branch: `fix/seo-public-entrypoints-20261028`
- Actual base SHA: `81abfce101edc83bc591e938dfd42bbfc7a039ec`
- Actual head, PR, commits and CI: recorded in the final Draft PR handoff.
- Verification report: `docs/reports/SEO_PUBLIC_ENTRYPOINTS_20261028.md`.
- Local gate: `SEO_PUBLIC_ENTRYPOINTS_OK`; applicable final checks pass.
- Optional OGE-6 copy is excluded after a historical scope-test failure was
  reproduced on unchanged production. Its already useful metadata is retained;
  no historical test is weakened. The report separates this observation from
  the passing final change and records initial environment retries.
- Hosting administration, release and indexing actions remain separate.

## Required handoff

Use `EXECUTIVE STATUS`; report passed, failed and not-run checks separately.
Stop before merge and publication. Keep HTTP-to-HTTPS hosting enforcement as
an explicit operational follow-up rather than claiming an HTML canonical fixes it.
