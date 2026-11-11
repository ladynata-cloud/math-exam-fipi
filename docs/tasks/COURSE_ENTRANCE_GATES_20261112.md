# MathExam task specification — course entrance gates

## Identity

- Task: `COURSE_ENTRANCE_GATES_20261112`
- Owner: MathExam owner, current conversation.
- Date: 12 November 2026 (Asia/Novosibirsk).
- Base branch: `feat/makarychev8-square-roots-complete-20261106` (#482).
- Initial base SHA: `f3c6db70ec4286b751b69c3387cba7ce535959ce`.
- Current integration target: `9802acdd84ca2711dbfac93c12639505b3263703`.
- Comparison main: `96466665da8d8c4052040adf5c1f7ad92ffb20e5`.
- Branch: `fix/course-entrance-gates-20261112`.
- Repair PR: [#563](https://github.com/ladynata-cloud/math-exam-fipi/pull/563), Draft.
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
- Initially checked #522 head: `4d3a0528bdd6cba951d0a1fecd9eb696d129e93f`.
  Its prior head `4ccc693e7c68e54b842e37bba900b4b9c9961d55` failed
  [SEO run 43083112214](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43083112214)
  because the generated Peterson footer was followed by a newly added script.
  That head moves the script into head and restores generated ordering.
  Local generation and all four entrance tests pass on that #522 revision.
  [SEO run 43085023177](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43085023177)
  subsequently completed successfully at 2026-11-11 19:42:58 UTC, including the
  native entrance/GIF/saved-work step (job `130747024190`). No generator change
  is needed in this repair.
- Initially checked #482 head: `f3c6db70ec4286b751b69c3387cba7ce535959ce`.
  [SEO run 43084541206](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43084541206)
  checks the composition `587bc1b9c672f43026e7d333eab81f0262bedd28`
  of this head and the stated main. Its browser assertion at line 46 finds zero
  catalogue links while expecting three. The same browser-test blob exists on
  main: `449370ccc0302b4ed27a78827928c239865415f5`.
- The hash router renders catalogue links after same-document navigation.
  Navigation completion alone does not establish that the catalogue is ready.
- A real application regression was confirmed on that #482 head: `home()` lost the
  existing optional catalogue call for Makarychev. The new asynchronous DOM
  regression passes 2/2 on main and #522, but fails on the initial #482 head even
  after hashchange finishes. Restoring that single call is required; a wait
  alone is not a fix. The native lesson GIF adapter is still present.
- The initial #522 head additionally failed cabinet-return geometry in
  [run 43085022866](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43085022866).
  This was a separate failure, not evidence of stale generation.
- During the task, #522 independently advanced to
  `8a9477f9177d8eedf9ef2d55046ed8dee463e1a5`. Its cabinet-layout repair retains
  the strict viewport assertion and adds an actual same-tab homepage click.
  [Cabinet run 43090951964](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43090951964)
  and [SEO run 43090951754](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43090951754)
  pass on that new head. Local generation, entrance tests 4/4 and router tests
  2/2 also pass. No duplicate #522 patch is needed.
- During the task, #482 independently advanced to
  `9802acdd84ca2711dbfac93c12639505b3263703`: one commit restores exactly the
  same guarded catalogue call, with different line breaks, and changes no
  other file. [SEO run 43090786905](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43090786905)
  passes on that head. The repair branch aligns app.js byte-for-byte with this
  current target using an ordinary additive commit, without merging branches
  or rewriting history. The remaining integration delta is limited to the
  browser test, router regression, workflow and two task/status documents.
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
- [x] Native browser checks retain media, help, saved-work and no-JS assertions
  on the first repair head; the final head must receive its own Actions result.
- [x] The application is byte-identical to current #482 (`9802acdd`);
  exercise data, GIFs, existing URLs and saved-work contracts remain identical.
- [x] Local failures and unavailable/queued native checks are reported separately.
- [x] Candidate stays Draft until the owner's separate explicit release decision.

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

Initial local gate: the corrected router regression passes 2/2; the initial
#482 head fails Makarychev after the real hashchange event, while main and
#522 pass 2/2. Strict generation passes all 13 outputs on all source
checkouts. Entrance/media/mathematics tests pass 4/4, sitemap tests 12/12,
the 580-URL sitemap is current, and static catalogue parity passes for 73
destinations. Syntax and whitespace checks pass.

Independent internal review reproduced the failing and fixed DOM results.
Removing only the restored optional catalogue call recovered the initial
#482 app.js byte-for-byte. The first remote repair head
`f4cc52d413d58726cb30115847cb04681c01c83f` passed native SEO
[43090424318](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43090424318),
including 12 interactive routes, retained work and GIF controls. Its native
Makarychev gate passed all 1789 cards / 4116 steps and 1127 roots cards /
4508 browser views. Independent source/mathematics suites passed 34017
assertions. Full local DOM walking exhausted an imposed 512 MiB heap; that
local resource failure is retained even though the full native suite passed.

The follow-up ordinary commit preserves the current #482 app.js exactly;
course data, topic sources, example code and media remain unchanged. Earlier
native results are historical evidence and do not substitute for the final
repair head's Actions. No original PR branch was edited by this task.

The PR records exact commits, final checks, failures/not-run checks, unchanged
source identities, release proposal and rollback. Use the repository's
`EXECUTIVE STATUS` fields; do not turn pending CI into a pass.
