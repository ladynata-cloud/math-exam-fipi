# Task 19 terminology and corpus coverage

- Date: 2026-10-20 (Asia/Novosibirsk).
- Base: main at `763e89aedbd561054e3860016bb999ef6aa15b19`.
- Branch: `feat/task19-corpus-coverage`.
- Review: MEDIUM, existing public trainer content and provenance, no server changes.

## Owner request

Replace unfamiliar «конгруэнтны» with ordinary school terminology and check that
the assertion bank retains the summer collection and covers available FIPI
statements. Existing explicit authorization covers cloud work and publication.

## Scope

- Remove «конгруэнтны/конгруэнтных» from task19 statements and accessible old modes.
- Recover the June source corpus and compare statements and truth values.
- Audit current official FIPI sources, preserving task IDs and source limitations.
- Add verified missing assertions with relevant optional figures/models and clear
  explanations; retain current IDs/progress and the minimalist interface.
- Keep a machine-checkable source-to-card coverage record. Do not label authored
  or secondary collections as official FIPI or claim exhaustive coverage without
  an enumerated official corpus.
- Rebuild only task19 downloadable HTML/ZIP/prompt and version public assets.

## Acceptance and gates

All previous cards remain available except the requested language clarification.
Every recovered source entry maps to a card or an explicitly reviewed equivalent.
New cards have independent mathematical review and usable hints. Test original
and recovered source coverage, truth values, source metadata, all hint renders,
existing learner flows, offline bundle and narrow/desktop browser behavior.
Use normal SEO/whitespace checks and exact-head cloud CI. Final gate:
`TASK19_CORPUS_COVERAGE_OK` after live verification.

## Risk and rollback

Risk: claiming provenance or completeness not established by source evidence,
duplicating equivalent statements, or introducing misleading hints. Keep explicit
source status and mappings; independently review all additions. Revert the scoped
release normally if needed; no data migration or changed progress schema.

## Release

Use one task/branch/PR. Record exact base/head/tree, checks, independent review,
fresh authoritative main guard and deployed-file identity in the PR. Prior
publication authorization remains valid; no force/reset/rebase or weakened gate.
