# Yandex public indexing: canonical URLs and static trainer metadata

## Identity

- Task: `YANDEX_PUBLIC_INDEXING_20261027`
- Owner: MathExam owner
- Date: 2026-10-27 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `e50fcfb7ffe4a99447ee18e4d2ca2f937cd1dd68`
- Planned branch: `fix/yandex-public-indexing`
- Review level: `SMALL`
- Related ADR: none; no architectural change.

## Goal

Give search crawlers consistent HTTPS document addresses and meaningful static
titles for existing public trainers, while preserving every learner interaction.

## Context and evidence

- A public HTTP audit of the 529 existing sitemap URLs returned 529 successful
  responses, all matching the base revision. No missing local link targets were
  found in those responses.
- 455 of those pages have no canonical declaration. Ten OGE basics trainers
  initially expose the generic title `MathExam`, then set a specific title from
  their existing `SPEC` in JavaScript.
- The two task-19 routes have identical bodies and learning content. The
  established `task19-trainer.html` route is used by the learning plan and
  download manifest; retain it as the canonical document. Both routes and their
  distinct existing head scripts remain available.
- Two triangle-congruence trainers have the same title but teach different
  congruence criteria.
- Public HTTP URLs currently do not redirect to HTTPS. The GitHub Pages
  hosting setting is an operational follow-up, not an HTML redirect workaround.

## Approved scope

### In scope

- Add absolute HTTPS canonical declarations only to the already reviewed
  public sitemap inventory that lacks them.
- Point the task-19 duplicate to its established canonical route and regenerate
  the existing sitemap with its existing exclusion policy.
- Derive static titles/descriptions for ten basics trainers from their actual
  existing `SPEC.title` and `SPEC.lead`; distinguish the two triangle trainers.
- Retain the same canonical in the stereometry HTML generator. Extend the
  percentage-source preservation check to require only the exact canonical
  addition while keeping every historical source hash and adding rejection cases
  for incorrect metadata, injected scripts and changed content.
- Enforce self-canonical coverage for every sitemap entry in the existing SEO
  gate so later generator rebuilds cannot silently discard the metadata.
- Reconcile the published lesson-funnel release in project status and document
  public audit results and remaining operational work.

### Out of scope / files and areas that must not change

- Trainer bodies, executable scripts, CSS, mathematics, navigation destinations,
  progress, board adapters, authentication, private cabinets and deployment code.
- Existing robots/noindex directives, technical-path exclusions and public-route
  behavior. No speculative mass descriptions or fabricated structured data.
- Private account reports or credentials in repository documentation.

## Acceptance criteria

- Every resulting sitemap URL has one HTTPS self-canonical.
- Only the proven task-19 alternative disappears from the sitemap; its file and
  existing behavior remain available.
- Ten basics titles match their existing runtime titles and have actual topic
  descriptions; triangle titles distinguish first and second congruence criteria.
- Every changed HTML body, executable script and style is byte-identical to base,
  except removal of a trailing space after the closing HTML tag in the minified
  decimal trainer so that the unchanged whitespace is not reintroduced in the diff.
- Existing SEO, sitemap, catalog and funnel checks pass.

## Checks and gates

- `python tools/seo-sitemap.test.py`
- `python tools/build-sitemap.py --check`
- `python tools/seo-check.py --base e50fcfb7ffe4a99447ee18e4d2ca2f937cd1dd68`
- Existing catalog and lesson-funnel checks; full changed-HTML preservation
  comparison and sitemap inventory comparison against base; `git diff --check`.
- Reproducible stereometry build; four percentage preservation/adversarial tests
  and 35 existing OGE basics contextual-help/state tests.
- Final gate: `YANDEX_PUBLIC_INDEXING_OK`.
- Post-deployment byte checks wait for a separately authorized release.

## Review plan

- SMALL: mechanical metadata only, with explicit preservation of runtime and
  storage boundaries despite the number of existing documents.
- Trainer design consultation: not applicable; no learning or interaction change.
- External review: optional, not requested or claimed. Self-review of final diff
  plus existing gates and the independent byte-preservation comparison.
- Remote handoff contains only public code, tests and audit observations.

## Risk and rollback

- Risk: an incorrect canonical could consolidate the wrong route. Restrict
  changes to the reviewed sitemap, retain existing declarations, and compare the
  complete before/after URL sets. Search engines may take time to process changes.
- Rollback: revert this scoped commit through a separately authorized PR.
- No storage migration or learner-data change.

## Permissions

- START: current owner request to perform the current Yandex SEO measures.
- Branch, local commits, push and Draft PR: allowed by repository task workflow.
- Merge, auto-merge and deployment: require separate explicit owner authorization.

## Execution record

- Actual branch: `fix/yandex-public-indexing`
- Actual base: `e50fcfb7ffe4a99447ee18e4d2ca2f937cd1dd68`
- Exact head, PR, tests and handoff: see the final PR body and linked audit report.
