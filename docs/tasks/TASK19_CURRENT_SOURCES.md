# Task19: current official sources, owner corrections and textbook references

- Date: 2026-10-21 (Asia/Novosibirsk).
- Base: main `6f42132355e0361f6bc54f0e4dacdc036b48b0e7`.
- Branch: `feat/task19-current-sources`.
- Review: MEDIUM; existing frontend trainer and optional references, ADR0003 Accepted.

## Owner request and scope

Visit FIPI now and retrieve every accessible current task19 question, compare the
existing collection, incorporate the supplied demo/Statgrad-labelled screenshots
without inventing their provenance, and process the new five-page annotation PDF.
Add optional same-page «Для ценителей строгости и точности» to every assertion,
with verified Atanasyan/Merzlyak edition and passage references. Link to passages;
do not reproduce bulk copyrighted textbook text or scans. Source-derived wording
written for this trainer must be identified as an explanation, not a quotation.

Keep previous card IDs, aliases, truth labels, grading, storage and other trainers.
The expected new geometry fixes concern a line through two points and coordinate
distance; add verified missing assertions with constrained interactive help.
Current open-bank completeness must remain explicitly unverified if access fails.
Save dated provenance, retrieved official counts and hashes, and source mappings.
Rebuild the current offline HTML/ZIP and cache versions.

## Acceptance and gates

- All supplied assertions mapped and mathematically reviewed; additions have help.
- Every card has a relevant reference mapping; direct source facts are verified.
- New owner interactions work on mobile and desktop and preserve current state.
- Existing task19 Node, source-catalog and cloud browser gates pass, together with
  focused reference/model checks, SEO and whitespace checks.
- Independent ready-result review, ordinary PR publication, authoritative main
  guard, merged-tree identity, deployment and live-file/interaction verification.
- Final marker: `TASK19_CURRENT_SOURCES_OK` only after deployed verification.

## Review, risk and permissions

This is a bounded extension of the accepted trainer, not a new archetype. The
owner deferred paid Claude use; no Claude call or provider approval is claimed.
Independent review will verify mathematics, relevance of source mappings,
copyright-safe attribution, state behavior and narrow-screen layout. Main risks
are false provenance/completeness, overbroad references and geometry regressions.
Rollback is an ordinary scoped revert; there is no data migration.

Current instruction authorizes execution; existing session authorization covers
cloud work, commits, push, PR, merge and publication. No destructive operations,
administrative bypasses or gate weakening. Private uploads remain outside git.
Final execution evidence belongs in the PR and source audit report.
