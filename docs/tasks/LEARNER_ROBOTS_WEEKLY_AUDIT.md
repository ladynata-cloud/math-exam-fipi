# Learner robots: bounded weekly audit

## Identity
- Task: LEARNER_ROBOTS_WEEKLY_AUDIT
- Owner: Natalya / ladynata-cloud
- Base: main, 64c1079e0f2e73ad77d9fbd1d58526be5517246d
- Branch: test/learner-robots-weekly-audit
- Review level: MEDIUM (test execution only; no product changes).
- Current owner instruction: «выполни пожалуйста сам эти небольшие шаги сейчас. для учеников напиши сам несколько роботов».

## Goal
Execute fictional learner journeys for written division and fractions; review the pending task-15 candidate and stale OGE PRs. Robots are deterministic software checks, not evidence of comprehension by actual pupils.

## Approved scope
New files only: this specification; tools/learner-robots/learner_robots.py; tools/learner-robots/README.md; a dedicated read-only GitHub Actions workflow .github/workflows/learner-robots-audit.yml. Additional audit fixtures must remain inside tools/learner-robots and be explicitly described in the PR.

No edits to existing trainers, student data, progress contracts, course navigation, dependencies, other workflows or historical tests. No changes to PR #126/#129/#146 branches. No merge, auto-merge, deployment, force operations or closure of existing PRs.

## Checks
- Exact rational arithmetic independently evaluated from displayed fraction expressions.
- Division answers derived from original operands and visible prompts, not the trainer answer fields.
- Correct, wrong-then-correct, hint, reveal, repeat, interruption and multiplication-table learner journeys.
- Ordinary browser actions at 1280 and 360 CSS pixels; fresh profiles and zero-credit fixtures.
- Record failed, blocked and not-run checks separately. Never weaken a requirement to make a test green.
- Read-only candidate snapshots and virtual merges; no branch repairs or release decisions.

## Execution constraints
Local arithmetic and syntax checks are available. The local browser currently refuses HTTP and file navigation with ERR_BLOCKED_BY_ADMINISTRATOR; no browser policy is modified. A separate CI runner may execute the same tests in its normal supported browser environment. CI uses read-only repository permissions and does not invoke deployment.

## Risk and rollback
Test runs use only synthetic learners and isolated browser profiles. No classroom sessions or actual student accounts are used. Revert/delete only this audit's new files if later approved; unrelated work remains untouched.

## Handoff
Report actual tested base/head, checks run, failures, screenshots, candidate review limitations, and pending owner decisions. Passing tests do not authorize release.
