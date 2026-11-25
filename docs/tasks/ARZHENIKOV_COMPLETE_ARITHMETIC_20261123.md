# MathExam task specification — connected Arzhenikov arithmetic

## Identity

- Task: ARZHENIKOV_COMPLETE_ARITHMETIC_20261123.
- Owner: MathExam project owner.
- Date: 2026-11-23 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `1712651b71dcb3ab833e5a9899819789a2bbcf61`.
- Planned/actual branch: `feat/arzhenikov-complete-arithmetic-20261123`.
- Review level: `HIGH` (shared course assessment, persistent drafts and a substantial learning sequence).
- Related architecture: extend the existing local course engine and spatial map; no new platform, service, protocol or accepted-ADR change.

## Goal

Connect written division, common fractions and decimal arithmetic into a coherent,
free, offline-capable learning route inspired by Arzhenikov. Preserve the existing
zoomable map, all earlier lessons, games, addresses and saved work.

## Context and evidence

- The owner explicitly requested continuing the development in this conversation:
  «продолжай пожалуйста, сохраняй карту навыков в стиле Прези, все наработки
  прошлых курсов, и методику Арженикина. Хочу чтобы на сайте лежала цельная методика».
  This is START for the concrete three-part extension discussed immediately before it.
- Base contains PR #741: 24 arithmetic, 8 algebra and 8 geometry lessons (320 conditions).
- Existing arithmetic introduces equal shares but does not yet provide a complete
  sequence of the four operations with common and decimal fractions.
- Primary sources: Arzhenikov, collection of mathematics problems, part III (1924),
  printed p.24, written division including a zero in the quotient:
  https://djvu.online/file/Zmmk0C6Gqh83D . Part IV (1924), common fractions
  pp.5–33, decimal fractions pp.52–71:
  https://djvu.online/file/AIsMeWPu7uz8w . New conditions are MathExam adaptations.
- Historical author coverage is distinct from the implemented scope. The introductory
  algebra and geometry courses remain introductory; no complete historical reprint is claimed.

## Approved scope

### In scope

- Add three connected tracks with 12 lessons each: written division, common fractions,
  decimal fractions. Each lesson retains explanation, an actionable model, practice,
  two initial independent conditions, explanation and two different repeat conditions.
- Extend exact answer checking to fractions, mixed numbers, decimals and comparisons;
  provide visible, student-entered intermediate steps where the algorithm needs them.
- Extend the existing Prezi-style map and accessible list with the new skills; keep
  historical sources and a clear method overview next to the actual route.
- Preserve all previous lesson/task identifiers and all existing progress namespaces.
- Rebuild the existing autonomous ZIP and verify its resources without network access.
- Add mathematical, persistence, browser, mobile and old-route regression checks.
- Reconcile relevant project status with the current baseline and release evidence.

### Out of scope / protected areas

- No unrelated SEO work (the postponed SEO PR remains separate), prices, domain,
  deployment platform, board/server protocols, accounts or paid AI integrations.
- No replacement/removal of city, port, garden, discoveries, old division map or
  the 40 existing sequential lessons; no claims of a real-pupil study.
- No force, reset, rebase, admin override, weakened gates or credential documentation.

## Acceptance criteria

- [x] 36 additional lessons and 288 distinct conditions connect to the previous 40 lessons.
- [x] Both forms of fractions have all four operations and transitions between representations.
- [x] Written division exposes each relevant pupil calculation, zero, remainder and decimal transition.
- [x] Model work precedes notation; checks on new conditions distinguish first attempts and assistance.
- [x] Existing URLs, content and saved records remain usable.
- [ ] Map zoom, keyboard navigation, reduced-motion setting and list route work at 320 px and desktop.
- [ ] Local and offline gates pass; exact PR/head and remaining checks are reported truthfully.

## Checks and gates

- Required: legacy Arzhenikov unit/browser suites; independent rational arithmetic and
  written-division checks; draft restoration/first-error/help attribution; online and
  file:// browser routes; reproducible ZIP; applicable existing CI; `git diff --check`.
- Final gate marker: `ARZHENIKOV_COMPLETE_ARITHMETIC_PASS` only after the stated checks.
- Manual: inspect rendered map and new model/algorithm screens, especially narrow layouts.

## Review plan

- Before implementation: primary-source check and learning sequence review completed;
  separate content authors work on bounded banks under the same task.
- Ready result: independent internal mathematical/code review and actual browser use.
- External provider consultation: not performed; no new paid model call is requested.
- Sanitized review only: repository-relative files, public source URLs, no credentials,
  personal pupil records or machine-specific paths in committed reports.

## Risk and rollback

- Main risks: numeric-format ambiguity, incorrect intermediate steps, progress migration,
  map crowding and new offline dependencies. Tests must address these directly.
- Rollback: revert this task's additive commit through the ordinary PR workflow; keep
  existing data keys and original lesson banks unchanged. No data migration or server change.

## Permissions

- START, branch, implementation, local commits, push and Draft PR: allowed by the current request.
- The repository records broader standing publication permission, but the owner-provided
  AGENTS instructions in this conversation explicitly require separate merge authorization
  and forbid weakening that boundary. Those current conversation instructions govern this task.
- Merge, auto-merge and deployment: stop for separate explicit owner authorization
  after a concrete, validated PR is ready. Do not change repository policy to bypass this boundary.
- If an authorized base later drifts, follow the stricter conversation base-drift guard.

## Execution record

- Initial worktree: clean on `main`; authoritative remote base matched the SHA above.
- Local mathematical, legacy, all-lesson DOM, map/discoveries DOM and reproducible
  offline gates pass. Browser/mobile acceptance remains a CI gate; local Chromium
  could not create a socket in this environment.
- Current checks, review findings, PR and publication status: recorded in the task report.
