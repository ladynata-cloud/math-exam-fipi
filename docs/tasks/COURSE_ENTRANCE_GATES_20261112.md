# MathExam task specification — course entrance gates

## Identity

- Task: `COURSE_ENTRANCE_GATES_20261112`
- Owner: MathExam owner, current conversation.
- Date: 12 November 2026 (Asia/Novosibirsk).
- Base branch: `feat/makarychev8-square-roots-complete-20261106` (#482).
- Base SHA: `f3c6db70ec4286b751b69c3387cba7ce535959ce`.
- Comparison main: `96466665da8d8c4052040adf5c1f7ad92ffb20e5`.
- Planned branch: `fix/course-entrance-gates-20261112`.
- Review level: `MEDIUM` — shared browser gate; focused independent review.
- Related PRs: [#522](https://github.com/ladynata-cloud/math-exam-fipi/pull/522)
  and [#482](https://github.com/ladynata-cloud/math-exam-fipi/pull/482).
- ADR: no architecture change. ADR 0001 is Proposed, not an approval source.

## Goal

Distinguish historical Actions failures from failures on the current two PR
heads, correct confirmed entrance-gate defects without losing courses, links,
mathematical media or saved work, and present a validated, reversible candidate
before asking the owner about merge or publication.

## Context and evidence

- Authoritative main at task start is the comparison SHA above. The checkout
  was clean. Before any task commit or remote write, the independent task
  branch was created from current #482 so the repair PR can target #482 without
  importing or overwriting its prepared square-roots work.
- #522 head is `4d3a0528bdd6cba951d0a1fecd9eb696d129e93f`.
  Its prior head `4ccc693e7c68e54b842e37bba900b4b9c9961d55` failed
  [SEO run 43083112214](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43083112214)
  because the generated Peterson footer was followed by a newly added script.
  Current head moves that script into head and restores generated ordering.
  Local generation and all four entrance tests pass on current #522.
  [Current SEO run 43085023177](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43085023177)
  subsequently completed successfully at 2026-11-11 19:42:58 UTC, including the
  native entrance/GIF/saved-work step (job `130747024190`). No generator change
  is needed in this repair.
- #482 head is `f3c6db70ec4286b751b69c3387cba7ce535959ce`.
  [SEO run 43084541206](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43084541206)
  checks the composition `587bc1b9c672f43026e7d333eab81f0262bedd28`
  of this head and the stated main. Its browser assertion at line 46 finds zero
  catalogue links while expecting three. The same browser-test blob exists on
  main: `449370ccc0302b4ed27a78827928c239865415f5`.
- The hash router renders catalogue links after same-document navigation.
  Navigation completion alone does not establish that the catalogue is ready.
- A real application regression is also confirmed: #482's `home()` lost the
  existing optional catalogue call for Makarychev. The new asynchronous DOM
  regression passes 2/2 on main and #522, but fails on unmodified #482 even
  after hashchange finishes. Restoring that single call is required; a wait
  alone is not a fix. The native lesson GIF adapter is still present.
- Current #522 additionally fails cabinet-return geometry in
  [run 43085022866](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43085022866).
  This is a separate failure, not evidence of stale generation. Preserve its
  strict viewport assertion and report its status independently.
- At task start the public Peterson index was fetched over HTTPS and matched
  main byte-for-byte (SHA-256
  `a16e8d8c1671516598f4a350c5751178887d24757962170091040d01578d7d13`).
  This is one production-resource check, not acceptance of the whole site.

## Approved scope

### In scope

- Read current PR heads, Actions results and relevant logs.
- Correct the browser's readiness assumptions; require the existing exact
  link count and exact destinations, including return to diagnostic mode.
- Restore the missing optional Makarychev catalogue call, with the existing
  shared-board guard, preserving the rest of #482's application and content.
- Add a targeted asynchronous-router regression with synthetic local work.
- Run generator, mathematical-media, route, catalogue and relevant browser gates;
  compare the unchanged course sources on main and both current PR heads.
- Record evidence, risks, rollback and a proposed release sequence.

### Out of scope / files that must not change

- No course content, exercise banks, answer rules, GIF assets or public URLs.
- No learner data, storage keys, server contracts, accounts or database writes
  outside isolated synthetic test fixtures.
- No alteration of the existing #522/#482 branches, merge, auto-merge or deploy.
- No relaxed assertions, skipped gates, force, reset, rebase or TLS bypass.
- No new trainer, learning sequence, unrelated roadmap work or Habr work.

## Acceptance criteria

- [x] Current and historical failures are identified by exact head and run.
- [x] Current generated pages pass strict byte-for-byte generation checks.
- [x] The delayed router produces the expected three exact links, without
  duplicates or changes to saved synthetic answers.
- [ ] Native browser checks retain media, help, saved-work and no-JS assertions.
- [x] The application differs from #482 only by the restored catalogue call;
  exercise data, GIFs, existing URLs and saved-work contracts remain identical.
- [ ] Local failures and unavailable/queued native checks are reported separately.
- [ ] Candidate stays Draft until the owner's separate explicit release decision.

## Checks and gates

- Python: `tools/build-course-entrances.py --check`,
  `tools/course-entrances.test.py`, `tools/seo-sitemap.test.py`,
  `tools/build-sitemap.py --check`, `tools/seo-check.py`.
- Node: `tools/seo-catalog.test.cjs`, `tools/course-entrances.routes.test.cjs`,
  syntax checks and `git diff --check`.
- Browser: `tools/seo-entrypoints.browser.cjs` and
  `tools/course-entrances.browser.cjs` through Public SEO and sitemap Actions.
- Main/current-PR comparison: repeat strict generation and the router regression
  against each pinned source tree; compare application/content file identities.
- Local Chromium launch is unavailable: the process socket is denied before
  any browser assertion. It is not counted as a browser pass.
- Gate: `COURSE_ENTRANCE_GATES_OK` only after applicable checks pass.

## Review plan

- Focused independent technical review of readiness, assertions and scope.
- Trainer design consultation is inapplicable: no learning design change.
- External provider review was not requested and is not claimed.
- Use only public repository context; no secrets, private records or machine
  paths in remote handoffs. Any provider review must identify exact PR/base/head.

## Risk and rollback

- Risk: a readiness wait could mask a missing or wrong catalogue. The wait is
  followed by strict three-link and exact-destination assertions, with no sleep,
  forced click or increased timeout. Missing output must still fail.
- Rollback before merge: leave/close this independent Draft; main is unchanged.
- Rollback after a separately authorized merge: revert this task's merge commit
  in a new PR, rerun the gates and obtain the required release authorization.
  No learner-data migration, deletion or restoration is needed for this repair.

## Permissions

- Start: the owner's explicit current Action directs checking and fixing the
  confirmed errors in a separate branch; it is the task's implementation order.
- Branch creation, scoped local commits, push and Draft PR: authorized.
- Merge, auto-merge and deployment: **not authorized**. The current task-specific
  instruction requires a concrete plan, explicit consent and waiting for reply.
  It overrides the repository's standing release policy.

## Execution record and handoff

Local gate before submission: the corrected router regression passes 2/2;
unmodified #482 fails Makarychev after the real hashchange event, while main and
#522 pass 2/2. Strict generation passes all 13 outputs on all three source
checkouts. Entrance/media/mathematics tests pass 4/4, sitemap tests 12/12,
the 580-URL sitemap is current, and static catalogue parity passes for 73
destinations. Syntax and whitespace checks pass.

Independent internal review reproduced the failing and fixed DOM results.
Removing only the restored optional catalogue call recovers #482's app.js
byte-for-byte. Course data, topic sources, example code and media are unchanged.
Native browser validation of this new repair remains required through Actions;
the successful #522 run is not substituted for this candidate's gate.

The PR records exact commits, final checks, failures/not-run checks, unchanged
source identities, release proposal and rollback. Use the repository's
`EXECUTIVE STATUS` fields; do not turn pending CI into a pass.
