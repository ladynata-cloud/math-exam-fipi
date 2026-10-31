# Vilenkin course navigation — preparation and dependency integration

Date: 2026-11-01 (Asia/Novosibirsk). Task:
[VILENKIN_COURSE_NAVIGATION_20261101](../tasks/VILENKIN_COURSE_NAVIGATION_20261101.md).
Review level: MEDIUM. Original base:
`a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
Authorized dependency integration base:
`37718f1c0138ba031314b8f4716b73c9d963bc81`.
Branch: `fix/vilenkin-course-navigation-20261101`.

The navigation preparation evidence below is bound to reviewed head
`97338833c9c92b164e73433c097464530507bd60`. The dependency continuation is
recorded separately; earlier local and virtual passes are not execution on its
resulting head. Existing [PR392](https://github.com/ladynata-cloud/math-exam-fipi/pull/392)
records the final published head and exact-head CI. This report does not claim
that PR392 is merged or deployed.

## Result

**Original navigation preparation gate: `VILENKIN_COURSE_NAVIGATION_OK`.**
The integration gate and release status are separate below.

- Course entry has a visible Start/Continue action, readable topic cards,
  explicit task buttons, exact source references and real saved progress.
- Existing unfinished work opens by its original attempt ID. A new unfinished
  repeat remains resumable even after an earlier successful completion.
- The bottom-right helper is available in the course and on owned saved tasks.
  Course navigation makes no help requests; mathematical help keeps the existing
  server acknowledgment, context check, access and assistance accounting.
- The task's “Все темы” link returns to the cabinet catalogue through the
  existing authenticated frame navigation event. A pending/rejected save blocks
  leaving and shows the existing message. After saving, clicking again returns
  safely; the same task and draft can be resumed.
- A real “Все темы курса” link above the task also works for teachers and
  read-only history views. It uses the existing cabinet catalogue route and
  save guard, without changing answers, control, history or attempt counts.
  The protected inner breadcrumb is visibly disabled in read-only mode; the
  banner points to the available cabinet link above it.
- Fraction tasks expose the existing factorization-based LCM trainer beside
  answer/help controls. The label explicitly says it is a separate example.
  Opening it records use of help, preserves the current fractions and draft,
  and opens a `noopener` tab. It does not fill an answer or grant credit.

The original task 2.134в still does not contain an interactive 75/30
factorization worksheet. Its authored guided sequence is unchanged. The new
entry opens the existing 12/18 example; a new exact-number teaching interaction
would need separate scope and applicable trainer consultation.

## Preservation and scope

The 194 Vilenkin source cards, 615 authored steps, Vilenkin source JSON/hashes, catalog identities,
27 legacy modules, server code, authorization, saved-work contracts and learner
records are unchanged. Git comparison against the base confirms byte identity
of both source-data directories, both catalogs, textbook learning contracts and
the board server. No paid model or provider was activated.

The original navigation preparation excluded both PR389 and PR391. The owner's
later approval permits ordinary integration of the separately released PR391
source repair after coordinated publication was confirmed. Intake preserves its reviewed
source metadata and associated assertions byte-for-byte;
this does not authorize further geometry or teaching changes. PR389 (additional
LCM cards) remains separate and excluded.

The owner's UI feedback added the broken catalogue return and an explicit
entry to the existing LCM trainer within this presentation/navigation scope.

## Verification of the reviewed navigation head

| Check | Result |
| --- | --- |
| Course catalog DOM | 9 cases PASS: identities, saved work, retry, teacher selection, fresh work, cross-button duplicate prevention, completed-course navigation and unfinished repeat |
| Source and navigation helper DOM | 14 cases PASS, including restored-permission status, stale instances, navigation without task/help requests and existing answer guards |
| Managed textbook bridge DOM | 7 cases PASS, including all 194 hydrations, current/stale/read-only catalogue-return links and unchanged draft snapshot |
| Study support and integrated support | 6 + 8 cases PASS, including contextual LCM link, assistance provenance, read-only/stale guards and unchanged answers |
| Existing textbook backend and source-help backend | 15 + 10 cases PASS |
| Source inventory and catalog generation | PASS: 24 units, 194 cards, 615 steps, 25 figure uses; generated catalog exact |
| Full existing textbook DOM | PASS: 194 views, 25 source figures, 30 recorded learner journeys |
| New browser course/UI gate | `VILENKIN_COURSE_UI_BROWSER_OK`: 10 grouped checks, 320/390/1280 × 900, including teacher/read-only/history catalogue return |
| Existing source-helper browser regression | 7 grouped checks PASS: delayed ACK, permissions, reload, exam race and post-result credit |
| Syntax, bounded diff, whitespace and source identity | PASS |

The continuation ran the 44 focused and 25 backend cases with
`--test-isolation=none`: 69 individually reported passes, zero failures or
skips. The 44 focused cases were rerun after the final accessibility/caption
correction. The integrated browser run binds the final files by SHA256.

Browser tests use local HTTP origins, real API/SQLite and synthetic accounts.
External traffic is blocked. The final UI run records zero external requests,
zero provider calls, zero JavaScript errors, and unchanged profile/legacy/peer
records. No TLS verification was disabled.

### Browser and image evidence

The [browser result](vilenkin-course-navigation-20261101/browser-result.json)
binds 14 exact images and all 12 relevant source files with SHA256. The harness
compares source hashes at start/end. All 14 final images received actual visual
inspection; root additionally inspected course, topic, task helper and fraction
practice views. Earlier development captures and a failed test screenshot are
not included in this final image registry.

- [Desktop course](vilenkin-course-navigation-20261101/course-1280.png)
- [320 px course](vilenkin-course-navigation-20261101/course-320.png)
- [390 px topic and task buttons](vilenkin-course-navigation-20261101/topic-390.png)
- [Course helper](vilenkin-course-navigation-20261101/course-helper-390.png)
- [Task helper](vilenkin-course-navigation-20261101/task-helper-320.png)
- [Fraction task and LCM practice](vilenkin-course-navigation-20261101/fraction-practice-1280.png)
- [320 px return from history](vilenkin-course-navigation-20261101/history-catalog-return-320.png)
- [Teacher catalogue return](vilenkin-course-navigation-20261101/teacher-catalog-return-1280.png)

The fixed launcher can overlap the edge of a partially visible card at the
bottom while scrolling. Every final action can scroll clear of it; the browser
checks actual pointer hit targets at the bottom on all three widths. The open
panel intentionally overlays content and has reachable Close/Escape controls.
No claim is made that an overlay intersects no content at any scroll position.

## Review and corrected findings

Two independent focused internal reviews covered each other's non-authored
product files. No blocking finding remains. This is internal review, not an
external-provider verdict. External review is not required for this bounded
MEDIUM presentation/navigation scope; PR389's exception is not reused.

1. Review found that aggregate `completed` can describe an older attempt, while
   the latest is unfinished. Current buttons now use the latest outcome;
   aggregate earned progress remains unchanged. The exact-repeat regression
   and independent reproduction pass.
2. Visual review found a stale “wait for saving” placeholder in an otherwise
   ready helper. Only that temporary placeholder now clears when access returns;
   real errors and success messages remain. A focused test and final browser
   screenshot verify the correction.
3. The first harness assumed every typed answer lived in the final draft field.
   Guided examples correctly save the current step draft. The test was corrected
   to check the active mode; no product data-loss issue was found or hidden.
4. Continuation review found that the original return handled pupils but
   explicitly ignored an editable teacher. Read-only/history views also had
   no catalogue exit outside the protected frame. The cabinet link now uses
   the existing teacher-capable `#vilenkin-textbook` route; the inner link also
   accepts the already-owned editable teacher event. No frame/read-only guard
   or mutation contract was weakened. Independent focused review of the final
   navigation and accessibility changes found no remaining blocker.

## Continuation evidence

The existing PR392 branch was recovered after the prior conversation ended.
The new checks use Chromium 140.0.7339.16, Playwright 1.62.1 and Node 24.22.1
with real local API/SQLite and synthetic accounts; this is not a pupil trial.
The original CI runtime is separately recorded by GitHub.

The extended browser scenarios verify a held save, history return and exact
resume, stale detached links, a teacher observing read-only work, and an
editable teacher's inner breadcrumb. They compare complete saved attempts and
history and assert no navigation writes or duplicate attempts. The original
source-helper browser checks were also rerun. A temporary save-notice toast
is allowed to clear normally before the history screenshot.

The teacher catalogue remains the existing general catalogue. Returning there
does not preselect a pupil for a later assignment. History and read-only
trainers remain inert; their available exit is the cabinet link above them.

Before this continuation, all 15 workflows for the original head
`f5d20e57483069612d7c4c31390c4b8e4c38eeb5` completed: 13 successful and two
unchanged geometry-source failures. Those results are historical evidence,
not checks on a later head. Fresh HTTPS checks confirmed the live cabinet and
public course still served the previous navigation code. Both publication
surfaces must receive their new resources during a later authorized release.

## Authorized dependency continuation — 2026-11-01

The owner explicitly approved completing PR391's coordinated publication and
then bringing updated main into the existing PR392 branch by an ordinary merge,
including resolution of the status-document conflict. This is a bounded
preparation authorization. It does not authorize merging or deploying PR392.

### Confirmed dependency publication

- [PR391](https://github.com/ladynata-cloud/math-exam-fipi/pull/391) was
  squash-merged as `37718f1c0138ba031314b8f4716b73c9d963bc81`, sole parent
  `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
- Merged tree `ae2f591ce87bcde3ea6ac9b1f28bad42ff48e366` equals the tree of
  reviewed repair head `7a4c049c3c58827774921e51d47b82bdd20219b8`.
- [Pages run 41248923855](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41248923855)
  succeeded for that merged commit. Independent verified-HTTPS checks at
  2026-10-31 22:38:30 UTC (2026-11-01 05:38:30 Asia/Novosibirsk) confirmed the
  matching public and cabinet bounded course: 2,805,951 bytes, SHA256
  `0a55791957f465cf6f9c3736fe41ca8a4fb110601bbcf9c4e9843e38a3f5a0fe`.
- Matching running assistant package / coordinated publication confirmation:
  Amvera package `69afae86d08c0e6c3041a29646e1845704951f43` has a successful build, is marked used, and is running with one replica; its sole changed knowledge snapshot is 448638 bytes with SHA256 `755cd5c4593594f296cb1a7e03af5ad29ba5413104561522901918f31c418013`. Public/cabinet byte verification
  alone does not establish the private helper package or process revision.
- The Amvera Control version row dated 01.11.2026 05:37 identifies that
  package with successful-build, stored and used indicators; application status
  is running with one replica. This is package/version evidence, not a real
  learner dialogue or a provider trial. The coordinated-publication prerequisite
  is satisfied; the actual branch integration uses the separate owner approval.

### Integration identity and preservation

- Branch remains `fix/vilenkin-course-navigation-20261101`; PR remains #392.
- Navigation parent: `97338833c9c92b164e73433c097464530507bd60`.
- Authorized main input: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
- Immediately before the ordinary merge, the authoritative remote query
  returned the named main and unchanged navigation head. No base drift was
  observed. Any further movement before a later release remains subject to
  the repository's mandatory stop and revalidation procedure.
- Resulting head: recorded in the existing PR392 publication record to avoid a self-referential SHA in this commit. The merge preserves the
  two named parents; the tested-tree and input identity are recorded below.
- An ordinary merge preserves both histories. Only the shared status
  document conflicted. Its reconciliation retains each task's truthful release
  state, with bounded task/report updates and no product-file edit.
- Comparison confirms every carried dependency product/test blob equals
  released PR391 and every navigation product/test blob equals the reviewed
  navigation head. The full checked-input manifest also matches. PR389 and
  unrelated main commits are absent.

### Checks on the resulting candidate

Fresh local checks ran on **2026-10-31 22:48:13–22:49:46 UTC**
(2026-11-01 05:48:13–05:49:46 Asia/Novosibirsk) against a read-only virtual
composition of navigation head `97338833c9c92b164e73433c097464530507bd60`
and released main `37718f1c0138ba031314b8f4716b73c9d963bc81`.
The tested virtual tree is `885165ce75cd854e3e505416eab1ecc2b2e8c5c8`.
The virtual status/task/report reconciliation contained explicitly unexecuted
placeholders; it did not perform or establish actual branch integration.

| Fresh composition check | Result |
| --- | --- |
| Source/generator/inventory commands | 9 PASS, including both previously failing geometry provenance guards |
| Vilenkin navigation, bridge, helper, support and backend Node cases | 69/69 PASS, zero skips |
| Atanasyan and Ichenskaya Node suites | 24/24 PASS, zero skips |
| Complete assistant-service suite | 119/119 PASS, zero skips |
| Actual Vilenkin navigation browser | 10 groups PASS at 320/390/1280 px |
| Existing Vilenkin source-helper browser | 7 groups PASS |
| Atanasyan browser | 12 public + 12 native journeys and teacher preview PASS |
| Ichenskaya browser | 16 public + 16 native journeys, 2 retained course switches and teacher preview PASS |
| Real local cabinet → separate assistant integration | 8 scenarios / 15 requests PASS |
| Browser errors, unexpected external requests and model-provider calls | Zero |
| Virtual patch whitespace and post-test input preservation | PASS |

Runtime: Node 24.22.1, Playwright 1.62.1 and Chromium 140.0.7339.16 selected
through the existing runner options. The runners and their assertions were
unchanged. Accounts, records, HTTP services and SQLite were local synthetic
fixtures. The actual task branch, index and worktree remained unchanged.

The combined original-base delta contains exactly 43 paths, the union of the
35-path navigation patch and 9-path source repair, sharing only
`docs/PROJECT_STATUS.md`. Only that status document and the bounded navigation
task/report proposals differ from the respective reviewed inputs. All 40
other changed-file blobs match their reviewed heads. The six substantive
repair files retain stable patch ID
`0a3a728a1d34374f8d302d302ee5aaf355101802`.

A canonical path/mode/blob manifest covers all **6,011 tracked inputs** other
than those three reconciled documents. Its SHA256 is
`2400dad31c28fdd2e13a8fd71ad18c89a344064c1bb498b81ae5bd3e7a6e8ecd`
(UTF-8 compact sorted-key JSON without a final newline). All 2,963 exported
tracked files were checked against the virtual tree before and after testing.
The sparse export included every file required by the listed checks.

These passes support the actual integration after the recorded identity
comparison: the product/test inputs and the two intended parents match,
and differences are confined to the three reconciled documents. They are
tests of the **byte-identical candidate**, not executions at the later commit.
Any subsequent product or test change requires the affected gates to run again.

Exact resulting-head GitHub CI, final documentation/whitespace review and
PR392 production remain separate evidence. The fresh runs generated browser
images but do not claim a new exhaustive visual audit; the original visual
review remains bound to the unchanged UI sources. No real pupil or physical
device trial, other-browser trial or external-provider review is claimed.

The actual ordinary integration preserves those tested product and test inputs.
The authoritative remote-main query immediately before the merge returned
`37718f1c0138ba031314b8f4716b73c9d963bc81`; the remote task head was still
`97338833c9c92b164e73433c097464530507bd60`. No further base drift was
observed. The only differences from the tested candidate are the finalized
status, task and report documents. The merge has the named navigation and
released-main parents, without rewriting either history. The final commit
identity and fresh exact-head CI belong in PR392 after branch publication.


The record distinguishes fresh virtual-candidate executions, actual input
identity verification, and subsequent exact-head CI. No earlier count is
silently reused as an execution at a later commit.

The two geometry workflows check out the PR head explicitly. The old failures
remain historical failures; PR391's successful release does not make an old
PR392-head run pass. A passing local composed candidate is also separate from
exact-head CI and production verification.

## Remaining checks and release

- PR392 remains Draft while branch publication and fresh exact-head CI
  complete. CI is recorded in that PR; the local candidate evidence does not
  substitute for it. Historical source failures remain distinct, with no
  weakened or waived check.
- PR392 production deployment, real pupil account change, physical-phone trial,
  Safari/Firefox trial and external-provider review remain unperformed. The
  separate PR391 publication evidence above is not a PR392 release claim.
- No new 75/30 interactive worksheet and no PR389 content integration.
- Rollback of a later PR392 release reverts its navigation/presentation delta
  against the integrated base while retaining the separately released PR391
  course/helper package pair. No database migration or saved-work deletion is
  needed. Existing workflow assertions remain intact; the focused browser gate
  is added to the Vilenkin cloud workflow.

## Continuation handoff

```text
EXECUTIVE STATUS

Task: VILENKIN_COURSE_NAVIGATION_20261101 — dependency integrated locally
PR: #392, Draft
Base: 37718f1c0138ba031314b8f4716b73c9d963bc81; original preparation base a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3
Head: recorded in the existing PR392 publication record to avoid a self-referential SHA in this commit
Gate: Fresh virtual candidate PASS; identical integrated inputs verified; exact-head CI and PR392 release separate
Tests: Fresh candidate 69+24+119 Node cases; 9 source commands; 10+7 browser groups; 24+32 geometry journeys; 8 assistant scenarios
Failures: None in fresh composition checks; historical old-head geometry failures remain recorded; exact-head CI pending publication
Not run: PR392 production, real pupil changes, physical/other-browser trials, external review; any additional unrun checks are recorded above
Scope deviations: None beyond the explicitly approved dependency intake and status/task/report reconciliation; PR389 excluded
Recommendation: Publish the preserved-history task update, obtain exact-head CI, then present the concrete PR392 release candidate
Next user decision: Separate exact-base/head PR392 merge/deployment authorization after gates
```
