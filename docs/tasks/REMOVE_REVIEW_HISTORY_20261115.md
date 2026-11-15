# Remove the earlier-reviews explanation from the lesson showcase

## Identity

- Task: `REMOVE_REVIEW_HISTORY_20261115`
- Owner: repository owner
- Date: 2026-11-15 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `5842bd8dce477793eecd67ed961b8e19072eb1dc`
- Planned branch: `fix/remove-review-history-20261115`
- Review level: `SMALL`
- Related issue or ADR: none; no architecture change
- ADR status, if applicable: not applicable

## Goal

Remove the complete expandable explanation about earlier telephone reviews
from the teacher section of `/lessons/`, as indicated by the owner's screenshot.

## Context and evidence

- The owner requested removal of the marked block and then gave explicit
  `START` in the current task conversation.
- Source search found exactly one public instance, a `details.review-history`
  element in `lessons/index.html`.
- Before implementation, authoritative remote `main` was the base SHA above
  and the isolated task worktree was clean.
- Production `lessons/index.html` and `assets/lesson-showcase.css` both returned
  HTTP 200 and matched the base versions byte for byte. The published page
  still contained the marked explanation. This is a scoped production check,
  not a site-wide release claim.
- The existing showcase browser gate checks both review links and responsive
  layout. Its native-details assertions cover the FAQ and contact template,
  so no test expects the removed explanation.

## Approved scope

### In scope

- Delete the entire marked `details` element, including its summary and text,
  from `lessons/index.html`.
- Record this task and its scoped production reconciliation in
  `docs/PROJECT_STATUS.md`.

### Out of scope

- Finding, processing or publishing the earlier reviews as a separate item.
- Changes to the teacher biography, portrait, review destinations or pricing.
- Other website improvements, trainer work or unrelated in-progress branches.

### Files or areas that must not change

- Runtime files other than `lessons/index.html`.
- Tests, workflow definitions, branch protection and repository permissions.
- Private correspondence and user data.

## Acceptance criteria

- [x] The marked explanation and its expandable container are absent from
  the task branch's public HTML and locally rendered teacher section.
- [x] The two existing review links, portrait and biography remain intact.
- [x] The teacher section renders correctly at 320 and 1280 px without an
  empty disclosure or horizontal overflow.
- [x] Applicable local checks pass; no failures were observed.
- [ ] One scoped commit and Draft PR are prepared; no merge or deployment.

## Checks and gates

- Required tests: `node tools/lesson-funnel.test.cjs`,
  `node tools/avito-showcase.browser.cjs`.
- Required static checks: public-source search, exact scope/diff inspection,
  `python3 tools/seo-sitemap.test.py`,
  `python3 tools/build-sitemap.py --check`, `python3 tools/seo-check.py`,
  `node tools/oge-home-orbits.test.cjs`, `git diff --check`.
- Manual checks: browser DOM inspection and teacher-section screenshots at
  320 and 1280 px.
- Final local gate marker: `REMOVE_REVIEW_HISTORY_OK`.
- Checks intentionally not run and why: no new permanent test for a static
  deletion; no external provider review for this `SMALL` task. Production
  verification of the removal waits for separate release authorization.

## Review plan

- Review-level rationale: deletion of one static content element; no script,
  data, mathematical, architecture or runtime-boundary change.
- Trainer design consultation applicable: no; no trainer design change.
- Before implementation: read-only compatibility review of source and existing
  gates; no external provider consultation performed.
- Ready-result review: exact diff and task documentation independently
  inspected by a read-only agent; no implementation findings. The executing
  agent verified the browser gate output and visually inspected both
  teacher-section screenshots.
- External review required: no under the `SMALL` review policy.
- Sanitized handoff constraints: only the scoped public diff and repository
  evidence; no private correspondence, credentials or machine-specific paths.
- Required provenance if external review is used: provider, PR, base SHA,
  head SHA, verdict and verifiable source or timestamp. No provider verdict
  is claimed for this task.

## Risk and rollback

- Main risks: accidental removal of adjacent markup or a layout regression.
- Rollback plan: revert the scoped task commit through the normal PR process.
- Data or compatibility considerations: no stored data, scripts or contracts
  change. Existing unused presentation selectors can remain inert.

## Permissions

- `START` granted by owner in the current task conversation: yes.
- Branch creation allowed: yes.
- Local commits allowed: yes.
- Push allowed: yes.
- Draft PR allowed: yes.
- Release authorization: not granted for this task. The explicit `AGENTS.md`
  supplied by the owner in this conversation requires a separate merge
  authorization and overrides the broader committed standing policy.
- Merge allowed: **no** until separately authorized by the owner.
- Auto-merge: **not authorized**.
- Deployment allowed: **no** until separately authorized by the owner.
- Force, reset, rebase and non-fast-forward branch synchronization: not
  authorized.

## Execution record

- Actual branch: `fix/remove-review-history-20261115`.
- Actual base SHA: `5842bd8dce477793eecd67ed961b8e19072eb1dc`.
- Actual head SHA: recorded in the final PR and handoff.
- PR: recorded in the final handoff.
- Commits: one scoped implementation commit; exact SHA recorded in the PR.
- Tests passed: SEO sitemap 12/12; lesson-funnel 6/6; sitemap generation check
  (582 public canonical URLs); SEO static checks; OGE home orbit contract;
  complete existing showcase browser gate, including landing at
  320/390/768/1280 px and keyboard/no-JavaScript behavior; `git diff --check`.
- Manual verification passed: teacher-section screenshots at 320/1280 px,
  no `.review-history` or teacher-section `details` in the local DOM, correct
  review links and loaded portrait, document width equal to viewport width.
- Tests failed: none.
- Tests not run: external provider review; release and post-release checks.
- CI: recorded against the exact published head in the PR and handoff.
- Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
