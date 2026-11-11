# Existing equations course: resume and recover saved work

## Identity

- Task: Improve continuation of the existing fifteen-lesson `/equations/` course.
- Owner: MathExam owner, overnight implementation instruction of 9 November 2026.
- Base: `main`, `1f49566c5411767b67062a3bf172f1dd719e63ed`.
- Branch: `improve/equations-resume-20261109`.
- Review level: HIGH (local persistence and migration).
- Architecture: existing course, generation and grading unchanged; no new trainer archetype.

## Goal and evidence

The current course saves an individual lesson draft but has no resume link from
the map. A completed check reopens with an editable unanswered form. Starting a
new task replaces unfinished work. The old single-key snapshot can be overwritten
by a stale tab. These are verified code observations, not learner-study findings.

## Approved scope

The owner explicitly requested course continuation, restoration and small related
usability improvements after the linear pilot. Scope: protected browser persistence,
explicit conflict recovery, return to saved conditions, a last-lesson resume link,
truthful completed state after reload, a fixed return link for `?return=linear-pilot` gap visits, focused regression tests and CI. The return parameter only enables the literal local `/equations/linear-pilot/` link; other values are ignored.

Do not change mathematical data, grading thresholds, the algebra model, teaching
text, public course entrances owned by the pilot task, backend/room protocols,
real student records, assignments, domain or hosting.

## Acceptance criteria

- Existing v1 work migrates without changing its original bytes; legacy tabs
  cannot overwrite the new v2 storage key.
- A stale tab never silently replaces the shared snapshot; its current draft is
  stored separately and discoverable after reload. On a storage failure the UI
  instructs the pupil to export the in-memory copy.
- Before a shared write, a separate per-tab copy is saved. Even a comparison/write
  race leaves each tab's snapshot available for recovery; this is not a server
  synchronization protocol or an automatic multi-user merge.
- Conflicted attempts are conservatively assisted and cannot gain new independent
  credit. Existing confirmed independent receipts remain intact.
- New conditions archive unfinished drafts and positions. Restoring a condition
  retains its attempt state and conservatively marks the reopened archived work assisted and never awards credit merely for navigation.
- The map offers the last opened lesson. Completed checks reopen as completed,
  with the existing independent/assisted distinction and a next-task action.
- Unchanged original math and all fifteen original lesson browser cases pass.

## Verification and review

Required: `node tools/equations/check.cjs`, `regression.cjs`, `node --test
tools/equations/resume.test.cjs`, syntax and `git diff --check`; Chromium
`tools/equations/browser.cjs` and `resume.browser.cjs` in the new workflow.
Independent technical review is required before release. External provider audit
is not performed under the standing policy; real pupil effectiveness and delayed
retention are not measured by these tests.

Local completed evidence: 7,500 generated mathematical conditions; 858 exact
transformations/ODZ/zero-operation checks; 14 DOM regression cases for migration,
resume, archival, completion, help, stale tabs, legacy tabs and quota failure.
Recovery/import also unions previously seen and independently passed conditions across stored versions, so restoring an earlier snapshot cannot turn an already exposed task into a fresh one. Unions exceeding the existing 4000-condition schema limit are refused without deleting versions. Completed answer forms are frozen immediately.

Browser execution is pending CI because the current cloud container restricts
Chromium socket creation. No local UI pass is claimed.

## Risk and rollback

v2 retains the existing version-1 export shape with optional `saved` and
`lastLesson` fields. Legacy v1 remains untouched. Each tab has a separate recovery
snapshot; conflicting/restored versions remain available on the map, including
the pre-restore shared version. These are device-local copies, not teacher records.
There is no automatic pruning of recovery versions. Browser quota may stop saves;
export remains the fallback. A lesson retains up to 1,000 saved conditions; once
full, starting a new condition is refused without discarding current work.

Rollback restores `equations/app.js` and corresponding tests/workflow together.
Do not delete v2 or recovery keys; a rolled-back v1 interface cannot display newer
v2 work, so retain exports before any rollback. Mathematics files are unchanged.

## Permissions and release

START, branch, commit, push, PR, merge and established publication are authorized
by the owner's current direct instruction and `docs/OWNER_RELEASE_AUTHORIZATION.md`.
Root executing agent owns release; this worktree does not push or merge. Before
merge refresh authoritative main/head, validate any base drift, verify exact delta
and run actual deployment/live-resource checks. No new owner decision is requested.

## Independent ready-result review

The separately assigned review agent examined the final implementation and
reproduced the reported fixes. Its conditional PASS was delivered to the release
owner on 9 November 2026: no remaining blocking code/mathematics issue found;
Chromium CI and live verification remain required. This is an independent
in-session technical review, not an external-provider audit or real pupil pilot.

Exact reviewed SHA-256:

- `equations/app.js`: `11cb22af05a5abc5bd911fdc5eb51972fef3024fdd3aefb868a13d2385551b6b`.
- `tools/equations/resume.test.cjs`: `4db503b919f033381b150b4b6defc858035b172d26a1c04390db1d92ae12d35e`.
- `tools/equations/browser.cjs`: `70f45c07e7227e82550f18234cfeecadac31e337893a3ca29276683a8736a53a`.

Local gate: 14 DOM regressions passed; 7500 generated mathematical conditions
passed; 858 exact transformation/domain/zero-operation checks passed; syntax and
`git diff --check` passed. Browser script now retains four actual viewport
screenshots in CI for visual inspection, including live pages on a main push.
The release record must distinguish those executed results from this local gate.

## Base reconciliation before publication handoff

Fetched authoritative main `8c35bb0e41808c5baf19942cedd124659f8bab5c`.
The sole concurrent commit since the initial base corrects OGE №8 root-domain
wording and its preservation tests; it does not change this course runtime.
Read-only virtual merge was clean. An ordinary merge preserved that release;
14 DOM, 7500 mathematical and 858 exact-algebra checks were repeated successfully
on the composition. The reviewed app SHA-256 is unchanged. Root will refresh
main/head again before actual merge; no new authorization is requested.
