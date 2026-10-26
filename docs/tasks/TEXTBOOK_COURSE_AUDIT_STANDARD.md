# Textbook inventory and universal companion standard

## Identity

- Task: TEXTBOOK_COURSE_AUDIT_STANDARD
- Date: 2026-10-26, Asia/Novosibirsk
- Base: main, `1aa517ed819d09ff18649b0855319ecccaee5bc0`
- Branch: `docs/textbook-course-audit-standard`
- Review: SMALL; documentation only, no runtime or architecture change.

## Owner request and outcome

The owner asked which textbook courses/trainers exist, which already follow
«курс к учебнику / тренажёр к задаче», required the rule for all courses,
then requested completed/incomplete status and explicitly required always
distinguishing Merzlyak basic and advanced.

This is authorization to audit and record the requirement. No additional
implementation START question is necessary. No current-task merge/publication
authorization is inferred from unrelated historical approvals.

## Scope

Document the current inventory from executable data and public files, distinguish
topic completion from exact-exercise completion, add a shared companion standard,
and link it from repository operating rules and the course documentation.
Reconcile the current status with verified production evidence.

Do not relabel unverified authored tasks, change exercises/models/answers,
rebuild bundles, change persistence or board interfaces, remove source images,
delete PDF assets, or claim that old pages already comply. Record the migration
gaps concretely for the next content/interface update.

## Acceptance and validation

- [x] Inventory derived from current main, not conversation promises alone.
- [x] Eighteen public files match the corresponding main bytes; hashes retained.
- [x] Merzlyak basic/advanced recorded separately; unknown level stays unknown.
- [x] Topic-complete courses are not presented as all-exercise complete.
- [x] Existing companion labels and PDF/image exceptions documented honestly.
- [x] Universal requirement linked from AGENTS.md and canonical course docs.
- Required checks: internal Markdown links, JSON evidence structure/hash identity,
  derived counts against data, changed-file scope, `git diff --check`.
- Gate marker: `TEXTBOOK_AUDIT_STANDARD_OK` after those checks pass.
- Not run: new mathematical review, browser interaction tests, application
  regression suites; no application behavior is changed.

## Review, risk and rollback

Self-review and relevant static checks. External Claude consultation is not
required for documentation under SMALL. Main risk is confusing stale release
reports, topic maps, source-task counts and card counts; current runtime data
and explicit qualifiers address it. Revert this documentation delta to roll
back; learner data and deployed courses are unaffected.

Branch, commit, push and Draft PR are within the requested work. Merge,
auto-merge and deployment remain unperformed pending the separate decision
required by AGENTS.md and `.agents/skills/mathexam-pr/SKILL.md`.

## Executive status

- Task: TEXTBOOK_COURSE_AUDIT_STANDARD
- PR/head: recorded in the Draft PR after commit.
- Base: `1aa517ed819d09ff18649b0855319ecccaee5bc0`
- Gate: `TEXTBOOK_AUDIT_STANDARD_OK`.
- Checks passed: 18 public-file hashes, four numbered-course counts and two
  continuous Atanasyan number ranges; six school-course topic/task/source-type
  counts; 15 paragraphs / 134 cards / 92 unique Pogorelov numbers; 24 Vilenkin
  units / 192 tasks; separate 68 basic / 81 advanced Merzlyak source maps;
  internal Markdown links; documentation-only seven-file scope; `git diff --check`.
- Failures: web search could not open public course pages; direct HTTPS
  retrieval succeeded and supplied the recorded public-byte comparison.
- Not run: runtime rollout, merge or deployment; full source/math/UI re-review.
- Scope deviations: none; requirement and audit only.
- Recommendation: accept the verified inventory and the global requirement;
  use its explicit gap list for course migration.
- Next owner decision: merge of the prepared documentation PR, if requested.
