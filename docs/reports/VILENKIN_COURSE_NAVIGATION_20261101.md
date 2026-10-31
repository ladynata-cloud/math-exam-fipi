# Vilenkin course navigation — preparation report

Date: 2026-11-01 (Asia/Novosibirsk). Task:
[VILENKIN_COURSE_NAVIGATION_20261101](../tasks/VILENKIN_COURSE_NAVIGATION_20261101.md).
Review level: MEDIUM. Base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
Branch: `fix/vilenkin-course-navigation-20261101`.

This is the local preparation record. The resulting Draft PR records the
published head and later exact-head CI; this document does not claim a release.

## Result

**Local gate: `VILENKIN_COURSE_NAVIGATION_OK`.**

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
- Fraction tasks expose the existing factorization-based LCM trainer beside
  answer/help controls. The label explicitly says it is a separate example.
  Opening it records use of help, preserves the current fractions and draft,
  and opens a `noopener` tab. It does not fill an answer or grant credit.

The original task 2.134в still does not contain an interactive 75/30
factorization worksheet. Its authored guided sequence is unchanged. The new
entry opens the existing 12/18 example; a new exact-number teaching interaction
would need separate scope and applicable trainer consultation.

## Preservation and scope

The 194 source cards, 615 authored steps, source JSON/hashes, catalog identities,
27 legacy modules, server code, authorization, saved-work contracts and learner
records are unchanged. Git comparison against the base confirms byte identity
of both source-data directories, both catalogs, textbook learning contracts and
the board server. No paid model or provider was activated.

PR389 (additional LCM cards) and PR391 (geometry source provenance) are separate
pending tasks. This branch neither integrates them nor claims their release.
The owner's later UI feedback added the broken catalogue return and an explicit
entry to the existing LCM trainer within this presentation/navigation scope.

## Verification

| Check | Result |
| --- | --- |
| Course catalog DOM | 9 cases PASS: identities, saved work, retry, teacher selection, fresh work, cross-button duplicate prevention, completed-course navigation and unfinished repeat |
| Source and navigation helper DOM | 14 cases PASS, including restored-permission status, stale instances, navigation without task/help requests and existing answer guards |
| Managed textbook bridge DOM | 7 cases PASS, including all 194 hydrations, current/stale/read-only catalogue-return links and unchanged draft snapshot |
| Study support and integrated support | 6 + 8 cases PASS, including contextual LCM link, assistance provenance, read-only/stale guards and unchanged answers |
| Existing textbook backend and source-help backend | 15 + 10 cases PASS |
| Source inventory and catalog generation | PASS: 24 units, 194 cards, 615 steps, 25 figure uses; generated catalog exact |
| Full existing textbook DOM | PASS: 194 views, 25 source figures, 30 recorded learner journeys |
| New browser course/UI gate | `VILENKIN_COURSE_UI_BROWSER_OK`: 8 grouped checks, 320/390/1280 × 900 |
| Existing source-helper browser regression | 7 grouped checks PASS: delayed ACK, permissions, reload, exam race and post-result credit |
| Syntax, bounded diff, whitespace and source identity | PASS |

The Node runner reports file-level aggregates when invoked in separate test
processes; counts above name the individual registered cases. The helper's
additional fourteenth case was rerun after the visual status correction. The
final integrated browser run binds the actual final files by SHA256.

Browser tests use local HTTP origins, real API/SQLite and synthetic accounts.
External traffic is blocked. The final UI run records zero external requests,
zero provider calls, zero JavaScript errors, and unchanged profile/legacy/peer
records. No TLS verification was disabled.

### Browser and image evidence

The [browser result](vilenkin-course-navigation-20261101/browser-result.json)
binds 12 exact images and all 12 relevant source files with SHA256. The harness
compares source hashes at start/end. All 12 final images received actual visual
inspection; root additionally inspected course, topic, task helper and fraction
practice views. Earlier development captures and a failed test screenshot are
not included in this final image registry.

- [Desktop course](vilenkin-course-navigation-20261101/course-1280.png)
- [320 px course](vilenkin-course-navigation-20261101/course-320.png)
- [390 px topic and task buttons](vilenkin-course-navigation-20261101/topic-390.png)
- [Course helper](vilenkin-course-navigation-20261101/course-helper-390.png)
- [Task helper](vilenkin-course-navigation-20261101/task-helper-320.png)
- [Fraction task and LCM practice](vilenkin-course-navigation-20261101/fraction-practice-1280.png)

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

## Remaining checks and release

- Later exact-head CI is recorded in the Draft PR, not inferred from these
  local results. Existing source-provenance failures on main are not repaired
  or waived by this UI task.
- No production deployment, real pupil account change, physical-phone trial,
  Safari/Firefox trial or external-provider review was performed.
- No new 75/30 interactive worksheet and no PR389 content integration.
- Rollback is a revert of this presentation patch; no database migration or
  saved-work deletion is needed. The existing workflows retain their assertions;
  the focused browser gate is added to the Vilenkin cloud workflow.

```text
EXECUTIVE STATUS

Task: VILENKIN_COURSE_NAVIGATION_20261101
PR: Draft PR URL and published head recorded after this local report
Base: a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3
Head: Exact published identity recorded in the Draft PR
Gate: VILENKIN_COURSE_NAVIGATION_OK locally; CI/release separate
Tests: 44 focused cases; 25 backend; 194 views/30 journeys; 8+7 browser groups
Failures: No remaining local product finding; corrected review/harness findings above
Not run: Production, real pupil changes, physical/other-browser trials, external review
Scope deviations: None; direct owner follow-ups are included in this UI correction
Recommendation: Review concrete screenshots and exact-head CI before release
Next user decision: Separate exact-base/head merge/deployment authorization after gates
```
