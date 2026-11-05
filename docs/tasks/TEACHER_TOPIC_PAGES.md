# Ten teacher worksheet topic pages

## Identity and authorization

- Owner: MathExam owner; explicit implementation and publication request of 2026-11-05.
- Base: main, a0b176e2bb659fe7385678c0199b2d0c47aaa9e3.
- Branch: codex/teacher-topic-pages-20261105.
- Review level: MEDIUM, bounded static content and catalog navigation.
- Release: current explicit request and docs/OWNER_RELEASE_AUTHORIZATION.md.
- No new architecture, trainer, student persistence or external provider review.

## Goal and verified context

Create ten substantive teacher entrances for existing worksheet packs, selected using current qualitative search evidence. PR453 supplied 101 packs; current main now has 145. All ten selected IDs were checked against the actual manifest at PR453 merge cb82abba54e3f95769b924d53d2bc4853d3c06e0. Keep the expanded catalog, old anchors and every PDF/ZIP byte unchanged.

## Approved scope

- Ten HTML pages inside existing pack directories, unique teaching notes, actual sample tasks, curricular limits, four variant SR/KR downloads, separate answers and suitable interactive practice.
- Shared scoped CSS, deterministic HTML-only builder and catalog generation hook.
- Catalog links, nearby topic links, contextual teacher section links, canonical metadata, structured data and generated sitemap entries.
- Research record, focused static/browser checks and applicable existing regressions.
- No PDF/ZIP generation, invented demand volumes, duplicate keyword pages, learner-data changes or marketing messages.

## Acceptance and gates

- Exactly ten independently useful pages; all four PDFs and ZIP reachable per page.
- Authoring uses existing bank as source of exact samples and scores. Scope notes match PDF content.
- Existing 145 catalog entries, filters and download addresses retained.
- Mobile widths 320/390 and desktop 1280; no overflow or page errors; keyboard/details/download checks.
- Canonical/H1/description/JSON-LD, local links and fragments, all ten sitemap records.
- Topic builder --check, focused static/browser scripts, existing teacher materials and PDF checks, SEO/sitemap tests, git diff --check, applicable CI.
- Frozen base/head immediately before controlled squash merge; verify merge tree/parent, deployment and public resources.

## Review, risks and rollback

Review actual topic notes and PDF samples; a separate agent checks links and responsive behavior. Search evidence is qualitative: neither keyword volumes nor actual Google/Yandex ranking measurements are available. Main risks are inaccurate scope descriptions, stale generated links and narrow mobile layouts. Revert this PR to remove the new HTML layer; original downloads remain valid. External provider audit and real-class pilot not performed.

## Execution record

Research: docs/reports/TEACHER_TOPIC_SEARCH_20261105.md. Final tests, exact base/head, CI, deployment and live status are recorded in the task PR; preparation alone is not a publication claim.
