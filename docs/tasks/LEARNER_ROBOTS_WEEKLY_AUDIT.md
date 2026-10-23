# Learner robots: bounded weekly audit

## Identity
- Task: LEARNER_ROBOTS_WEEKLY_AUDIT
- Owner: Natalya / ladynata-cloud
- Historical base: main, 64c1079e0f2e73ad77d9fbd1d58526be5517246d
- Branch: test/learner-robots-weekly-audit
- Initial review: MEDIUM, test-only. Candidate persistence remediation requires HIGH review before product integration/release.
- Initial instruction: «выполни пожалуйста сам эти небольшие шаги сейчас. для учеников напиши сам несколько роботов».
- Continuation: «исправь пожалуйста все что нашел», additional learner characteristics and repeated checks; latest instruction «сделай всё облачно, я спать ложусь».

## Goal
Execute fictional learner journeys for written division and fractions; review the pending task-15 candidate and stale OGE PRs. Preserve exact repairs and executable learners in GitHub instead of leaving the only copy in chat attachments. Robots are software checks, not evidence of actual pupil comprehension or medical adaptation.

## Approved scope and accumulated files
One audit branch and PR. Existing six paths:
1. This specification.
2. tools/learner-robots/learner_robots.py
3. tools/learner-robots/README.md
4. .github/workflows/learner-robots-audit.yml
5. .github/workflows/learner-robots-remediation.yml
6. tools/learner-robots/remediate.py

The 24 October continuation adds exactly six files:
7. tools/learner-robots/personas.py
8. tools/learner-robots/check_task15_contract.mjs
9. tools/learner-robots/task15-remediation.patch
10. tools/learner-robots/prepare_task15.py
11. tools/learner-robots/test_prepare_task15.py
12. tools/learner-robots/CLOUD_HANDOFF_2026_10_24.md

No existing trainer, student data, progress contract, course navigation, dependency or workflow is modified in this continuation. No changes to PR #126/#129/#146 branches. No merge, auto-merge, deployment, force operation or closure of existing PRs. The patch is stored as review material, not applied to production by this PR.

## Checks
- Derive arithmetic independently from operands and displayed conditions.
- Separate correct, corrected, hint, reveal, repeat, interruption and prerequisite excursions.
- Preserve unknown historical fields and unrelated progress.
- Reject incomplete patches, source drift, substituted paths, bad context, duplicate paths and output-hash mismatch.
- Keep failed, blocked and not-run checks separate. Do not weaken a requirement for a green result.
- Match all evidence to an exact source identity; do not apply historical results to new main.

## Execution constraints
The current main was re-read as 202d39bf826c8c7e030e59ff162fe808000cae7e. #146 still points to 2069d21d96943602a03844ffb52f83d50b4700c9. The preparation tool accepts exactly that three-file source and writes only to a new disjoint directory.

The local browser refused file navigation with ERR_BLOCKED_BY_ADMINISTRATOR. Its policy was not changed. No blocked workflow edit was retried. The retained old audit workflow targets the old candidate; automatic runs are not new-candidate verification. The earlier source snapshot and chat artifacts establish historical arithmetic/candidate bytes, not a checkout of today's entire main.

## Risk and rollback
All fixtures are synthetic and contain no student accounts. No deployment or production data mutation occurs. Current-main reconciliation and actual product release require separate complete checks and the applicable review policy. No external approval or automatic review waiver is claimed.

## Handoff
See tools/learner-robots/CLOUD_HANDOFF_2026_10_24.md for exact output hashes, executed checks and remaining blockers. Preserve the historical October-9 results with their original head. Passing a preparation test does not authorize product release.
