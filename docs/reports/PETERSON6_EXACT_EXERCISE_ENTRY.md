# Peterson 6: exact exercise entry and cabinet controls

Date: 2026-11-02 (Asia/Novosibirsk).

- Task: [PETERSON6_EXACT_EXERCISE_ENTRY](../tasks/PETERSON6_EXACT_EXERCISE_ENTRY.md).
- Implementation base: `5bbfe3a4615b6410dacf7f1344aa57b909a986ef`, published PR400.
- Branch: `fix/peterson6-exact-exercises-20261102`.
- Review level: MEDIUM; focused internal review, targeted regressions and rollback notes.
- Local gate: **PETERSON6_EXACT_ENTRY_LOCAL_OK**.
- Exact commit, Draft PR, subsequent CI and virtual-merge identity belong in the
  PR release-preparation record. No new production publication is claimed here.

## Result

Course number search opens the existing textbook conditions for 303 and 305.
The separate line validates exercise-specific URLs and resumes current or
archived work. The chosen unknown is described as the smaller speed in the
question, contextual helper and HTML report. Stored question labels and answer
identities remain unchanged.

Actual cabinet browser testing exposed blocked native form submission in the
existing sandbox. Search, guided steps and final answers now invoke their
existing local validators through click/Enter handling. Native form navigation
is cancelled; composition, repeated keys, disabled controls and detached forms
cannot manufacture checks or attempts. The cabinet permissions are unchanged.

Public course links open an isolated tab. Cabinet links navigate inside the
existing public frame and forward only its public helper flag. The downloaded
course uses an absolute HTTPS link. No room, learner or parent parameters are
forwarded.

## Executed checks

All commands below completed successfully on the final runtime. DOM checks use
Node 24 and jsdom 26.1.0. Browser checks use isolated Playwright Chromium and two
loopback origins; they do not use a production account or teacher room.

| Check | Result |
| --- | --- |
| `node --check school/peterson6/app.js` and changed test syntax | PASS |
| `node school/peterson6/build.cjs --check` | 14 topics, 224 tasks, 497 source numbers |
| `node school/peterson6/test-content.cjs` | 224 tasks, 572 validated steps, 497 mappings |
| `node school/peterson6/test-ui.cjs` | 224 tasks, 60 practice screens; 98 equation tasks / 491 steps |
| `node school/peterson6/test-equation-state.cjs` | 25/25 saved-work scenarios |
| `node tools/peterson6-exact-number-search.test.cjs` | 8/8; links, query isolation, file copy, board state, click/Enter, stale controls |
| `node tools/maxim-peterson6-entry.test.cjs` | 10/10; all 27 source routes/keys, malformed routes, archives, legacy, helper/report, click/Enter |
| `node tools/maxim-peterson6.test.cjs` | 15/15; 27 source entries, 26 generated cases |
| `node tools/maxim-peterson6-equations.test.cjs` | 10/10; 2,304 independently checked word cases across 22 families |
| `node tools/peterson-assistant.test.cjs` | 9/9 |
| `node tools/peterson6-board.test.cjs` | 9/9, including all 224 authored and 60 practice views |
| `node tools/maxim-peterson6-entry.browser.cjs` | 13 actual browser journeys |
| `node tools/maxim-peterson6-equations.browser.cjs` | 9 journeys / 42 accepted steps |
| Final scoped diff, linked assets, syntax and `git diff --check` | PASS |

### Browser evidence

The new gate covers 303 and 305 at 320, 390 and 1280 pixels, both from the public
course and from an iframe with the exact existing cabinet sandbox/referrer
policy. Its 12 source-entry journeys verify:

- six separate public tabs and six same-frame cabinet transitions;
- the exact source prompt and equation method;
- 12 accepted steps, 12 partial reloads and 12 archived-source restorations;
- six searches through Enter and six numeric answers entered as `4/3` + Enter;
- helper availability, retained drafts/hints, unchanged parent URL, and no
  inherited private query parameters or horizontal overflow.

The thirteenth journey completes all five guided steps of main-course `p09-t03`
inside the same sandbox, checks that an empty final click does not count an
attempt, accepts `21` + Enter once, and reloads the completed work unchanged.
External requests, API mutations and browser errors are all zero.

The existing equation browser gate retains all previous assertions. Its legacy
fixture now selects `#ratio?example=303` before injecting the synthetic 303
save, so reload requests the intended condition. The asset assertion also
retains its exact allowlist with the new equation-script cache version.

The gates produced 13 entry and six equation screenshots. Representative
desktop 303, mobile 305 and completed main-course cabinet frames were visually
inspected. CI retains these images through the existing artifact workflow.

## Published-save compatibility

`tools/fixtures/maxim-peterson6-pr400-save.json` is a frozen synthetic export
created with the code from production commit
`5bbfe3a4615b6410dacf7f1344aa57b909a986ef`, not regenerated from the candidate.
It records source-file hashes and all 27 published condition-key hashes.

The version-2 save contains a completed meeting 303 and a partial ratio 305
with two accepted steps, a draft and a used hint. Its version-1 companion
contains a legacy 303 with an accepted step, the draft `2,` and a hint. Both
remain readable; all source keys retain their published hashes. Repeated exact
links, archive transitions and reload retain work without duplicate credit.

The mathematical model, stored labels, option order, expected answers, source
conditions, storage keys/schemas and reader/writer functions are unchanged.
The clarified display label is optional presentation metadata only.

## Review and resolved findings

Focused independent internal reviews covered routing, archive restoration,
helper identity, display wording and form controls. No open findings remain.

1. An exact return to an archived legacy source initially started a new method-2
   attempt. The router now resumes the existing source archive, preferring an
   available method-2 attempt and otherwise retaining legacy. The original
   legacy session and the displaced new source attempt survive reload.
2. A detached line button initially could submit a different task at the same
   step index. Captured session identity and connected-form guards now reject
   it, including after a failed step is redrawn. Tests verify no extra error,
   hint or credit.
3. Actual cabinet form submission was blocked by the browser before the submit
   handler. Direct local click/Enter handlers resolved the failure in search,
   guided work and final answers without changing sandbox permissions.

The final browser reruns and focused counterexamples pass. Internal review is
not an external provider verdict. No external review is mandatory for this
bounded MEDIUM correction unless requested by the owner. PR400's exception is
not reused.

## Concurrent main and release boundary

After branch creation, authoritative main advanced from the implementation
base to `3376ff99926e6e8e9721316f4cac045afc737a0c` through separately published
[Atanasyan PR386](https://github.com/ladynata-cloud/math-exam-fipi/pull/386).
Its commit is a direct child of the published PR400 commit. Its changes concern
the sphere course and a different section of `PROJECT_STATUS.md`.

The task branch was not rebased, reset or merged with that main. Read-only
composition, affected-file identity and rerun gate evidence are recorded in the
Draft PR. Future release authorization must name the current production base
and this correction's exact head; main must be queried again before merge.

## Limits, risk and rollback

- No real pupil data, authenticated production account or live shared room was
  opened. No external-model call, server configuration, registry version,
  deployment, PDF content or textbook-source map was changed.
- Local JSDOM checks are not visual or sandbox browser evidence. The isolated
  browser gates above provide the actual click/Enter/frame evidence.
- Unrelated full-book PR367 and paused parts-2/3 PR355 remain outside this task.
- Main risks were reopening the wrong attempt and double submission. Frozen
  saves, explicit task/form guards and actual browser checks cover these paths.
- Rollback is a separately authorized code revert. There is no data migration
  or learner-record deletion to reverse.
- No unresolved failure remains. Exact-head CI is recorded separately in the
  PR after publication of the branch; passing local checks do not authorize merge.

## Handoff

```text
EXECUTIVE STATUS

Task: PETERSON6_EXACT_EXERCISE_ENTRY
PR: Draft PR linked in the task handoff
Base: 5bbfe3a4615b6410dacf7f1344aa57b909a986ef
Head: exact committed head recorded in the Draft PR
Gate: PETERSON6_EXACT_ENTRY_LOCAL_OK
Tests: scoped DOM/state/math/board checks and 22 browser journeys PASS
Failures: none unresolved
Not run: real-pupil/production-write trials; external provider review (not required)
Scope deviations: none; cabinet control correction follows the observed entry blocker
Recommendation: review the complete Draft PR and its current-base evidence
Next user decision: separate authorization for this PR's merge and deployment
```
