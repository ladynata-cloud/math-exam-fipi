# Cabinet links to existing public practice

## Identity

- Task: `CABINET_PUBLIC_PRACTICE_LINKS`.
- Date: 2026-10-20 (Asia/Novosibirsk).
- Base: `main`, `2bcfec70426f36eeff2ae97e0100eb221f58ca71` (PR267).
- Branch: `feat/cabinet-public-practice-links`.
- Review level: MEDIUM, bounded display behavior for teacher-authored text.
- Owner requests the existing Claude rounding trainer and OGE mathematics
  statement trainer in an existing pupil cabinet.

## Goal and evidence

Make the two public exercise URLs in a saved teacher focus note clickable on
the pupil home/route and the teacher's read-only preview. Neither exercise has
a managed LearningCatalog identity; pretending they are managed assignments
would misrepresent saving and progress. Existing preparation pages already
link public practice separately.

The local base is the merged PR267 release. The parent release verification
recorded 24/24 assets matching and healthy durable learning storage; the status
document is reconciled with that evidence. This task's new links are not yet
published by these local changes.

## Scope

- Render only the exact HTTPS URLs for `trainers/rounding-stepwise.html` and
  `trainers/task19-trainer.html` as labelled links in focus notes.
- Keep all other text escaped, and all other URLs non-clickable. Do not accept
  arbitrary hosts, credentials, protocols, queries, fragments or path suffixes.
- Share one presentation helper between OGE/foundations routes and teacher
  preview. Explain that these pages open separately and do not contribute to
  cabinet progress.
- Update cache identifiers for the two changed scripts and add the focused
  regression test to the existing unified learning CI job.
- No pupil names, account IDs or saved profile content in source control.
- No changes to profiles, API, database, authentication, managed catalog,
  assignments, attempts, trainer contents or the existing 26-step route.

## Acceptance and checks

- Both requested URLs are clickable on home/route and teacher preview.
- Plain comments and line breaks retain their contents; markup stays inert.
- Adversarial URLs cannot create arbitrary links or event handlers.
- Existing route order, completion and start behavior remain unchanged.
- Required: `tools/learning-focus-links.dom.cjs`, existing
  `tools/learning-vertical-route.dom.cjs`, `tools/learning-preparation.test.cjs`,
  syntax checks and `git diff --check`.
- Gate: `CABINET_PUBLIC_PRACTICE_LINKS_OK` after the above checks pass.
- Production publishing and live verification are not part of this delegated
  implementation step.

## Review, risks and rollback

Focused review is required because teacher-authored text gains clickable
content. The allowlist is literal and output is escaped before insertion.
Main risks: linking a lookalike URL, overstating progress saving, or displaying
different links in teacher/pupil views. Targeted DOM tests cover each risk.
Rollback reverts the presentation changes; existing focus notes remain plain
text and all pupil data stays intact. No migration or credential change.

## Permissions and execution

The parent task authorizes this implementation and local checks on the named
base. This delegated step stops before any commit, push, PR or publication.
No authorization is inferred from this document.

- Local implementation: complete; uncommitted for parent review.
- Five focused DOM tests pass: safe links and punctuation; hostile URL/HTML
  rejection; blank/plain text; pupil home/route with 26 unchanged steps; actual
  teacher preview with both current and cached-old presentation helpers.
- Existing `learning-preparation.test.cjs` passes: 12 groups, 185 destinations,
  server contracts and school lesson links.
- Existing `learning-vertical-route.dom.cjs` passes: 26 valid steps, four stages,
  order, completion, resume/repeat, homework priority and error recovery.
- Syntax checks and `git diff --check`: pass.
- Gate: `CABINET_PUBLIC_PRACTICE_LINKS_OK` (local scope).
- Not run: full CI and live publication/browser verification; parent handles
  these after the review/commit boundary.
- Commit, PR and deployment: not performed.
- Scope deviations: none.
