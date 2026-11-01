# Grade-six LCM and navigation: combined release preparation

Date: 2026-11-01, Asia/Novosibirsk. Task:
[GRADE6_LCM_NAVIGATION_INTEGRATION_20261101](../tasks/GRADE6_LCM_NAVIGATION_INTEGRATION_20261101.md).

## Result and release boundary

One compatible candidate combines the author LCM course and readable cabinet
navigation. It retains both methods, every teaching step, source-bound hints,
separate saved attempts, accepted answers and unfinished drafts. The original
PR389/PR392 branches remain unchanged. The new Draft PR binds the exact
published head and CI results; this report is preparation evidence, not a
claim that the new experience is already live.

Preparation marker: **`GRADE6_LCM_NAVIGATION_INTEGRATION_OK`** after the final
local gates and independent review recorded in the evidence below.

This is HIGH review. Independent internal review and technical gates are
recorded here. External review is unavailable: no authorized Claude tool is
exposed and the existing provider hold remains in effect. No paid retry or
provider activation occurred. The previous exception for the original PR389
version is not approval of this combined head. Separate exact-base/head merge
and public/cabinet deployment authorization is required, together with either
external review or the owner's explicit exception for this version.

## Verified inputs and production baseline

| Input | Identity |
| --- | --- |
| Main / already published PR391 | `37718f1c0138ba031314b8f4716b73c9d963bc81` |
| PR389, author LCM material | `a14fed1152a0dbfdca07775dd891ba3af00a2e30` |
| PR392, course navigation/helper | `5568a093d7ffb3e587d5dba145071c8cde206e70` |
| New branch | `feat/grade6-lcm-course-integration-20261101` |

Authoritative GitHub metadata identifies PR391's merge at 2026-10-31 22:36:02
UTC and its release as the current main. Its release record covers Pages and
the coordinated cabinet/helper delivery. Fresh normal-TLS reads independently
returned HTTP 200 without redirects and exact main bytes for five public
assets: public/cabinet bounded geometry course, both cabinet app copies and
the original public Vilenkin units-B source. The precise check time, sizes and
hashes are in [production-baseline.json](grade6-lcm-navigation-20261101/production-baseline.json).
No pupil API or authenticated learner record was read.

PR391 is retained as the base and is not proposed for another separate release.
Its bounded-course JSON and separate assistant knowledge snapshot remain exact.

## Composition and compatibility fixes

The source patches have ten common paths. A non-mutating `git merge-tree`
identified seven text conflicts: cabinet app, course overview, two entry HTML
files, embedded renderer/style and project status. Their 65-path union was
materialized on a fresh branch from main. Neither original branch was reset,
rebased, rewritten or merged into main.

| Conflict or observed defect | Resolution |
| --- | --- |
| Author-task collapsed tools hid catalogue navigation | Keep the cabinet-owned return and home link in a visible row; collapse only secondary work controls. Teacher/history returns retain identity and save guards. |
| Author CSS changed the helper to static flow | Preserve the fixed bottom-right dock and enough document space to reach controls above it. |
| New progress updates did not match author-control markup | Combine paired method controls with separate permanent method labels and changing action labels, plus the existing shared opening lock. |
| Generic topics could mislabel author tasks as textbook exercises | Retain the distinct author supplement, stages, paired methods, fresh checks and prerequisite review links. |
| Continue used catalogue order; an initial correction recognized only ISO dates | Select newest unfinished work using real numeric SQLite timestamps, ISO/creation-time fallback and stable order for ties. Numeric zero is valid; invalid timestamps do not outrank valid work. |
| Topic chooser skipped the author section | Course and helper target a common focusable heading before both author and source topics. |
| Closed helper overlapped the initial mobile check action | Move the duplicate managed stage/count label intact into the reference card and reclaim outer whitespace without shrinking input/button/question text or changing teaching content. |
| Scrolled topic actions approached the helper; mobile Continue broke within a word | Add safe scrolling margins/padding and full-width primary actions on narrow screens. Measure complete action/helper rectangles and pointer targets. |
| A longer next question could leave its input below the screen | After an explicit author answer action, centre the current form inside the trainer and its frame inside the pupil cabinet. Reuse the existing check event and ownership/history guards. |
| Reconstructed author action text inherited muted color on green | Inherit the button's white text color for the author action label; the independent visual review checks the corrected appearance. |

Both support options survive: the author unit's `relatedPoint` mapping and
navigation's `answerType`/`actionsHost`. No new schema, backend authorization,
persistence implementation or cross-origin message protocol is introduced.

## Content and saved work

- The supplement JSON is byte-identical to PR389: three worked conditions
  and sixteen practice conditions through both methods, then six fresh
  checks — **44 cards and 203 teaching steps**.
- Successive pairwise LCM uses the accumulated result in the next pair.
  Prime-factor solutions retain the greatest necessary multiplicity, handle
  one and repeated numbers, and retain the missing-factor explanation
  `30 × 2 × 3 = 180` for 12, 18 and 30.
- All **194 original textbook cards**, their order/revisions and four A-D
  source files remain exact. The **378 other catalogue entries**, **27 legacy
  modules** and original offline bundle are preserved.
- Real API/SQLite browser fixtures retain **194 previously saved original
  attempts**, a legacy attempt and the other synthetic pupil's profile/work.
  Separate chain/factor IDs retain separate steps, drafts and hint evidence.
- Closing help does not erase assistance provenance. Fresh-check conditions
  differ from the demonstrated conditions. Correct answer-only submission
  does not establish which paper method was used or topic-wide mastery.

See [preservation.json](grade6-lcm-navigation-20261101/preservation.json) for
input provenance, source identity and byte comparisons.

## Local validation

Final evidence: [checks](grade6-lcm-navigation-20261101/checks.json),
[LCM journey/layout](grade6-lcm-navigation-20261101/lcm/result.json),
[course/navigation journey](grade6-lcm-navigation-20261101/navigation/browser-result.json)
and [visual review](grade6-lcm-navigation-20261101/visual-review.json).
Source hashes bind the browser outputs to this candidate. Local results are
not presented as exact-head GitHub CI; CI is separately recorded in the PR.

| Gate | Result |
| --- | --- |
| Authored arithmetic and immutable-source tests | 7 PASS; all 44 answers and 203 steps independently checked |
| Existing retained-work/backend suites | 36 PASS |
| Managed DOM, number-theory route and helper | 34 PASS |
| Source support, source labels, integrated support and bridge | 23 PASS |
| Combined catalogue DOM | 15 PASS: timestamps/fallbacks, separate methods, global opening lock and disposal |
| Legacy cabinet DOM | 8 PASS |
| Original textbook DOM | 194 views, 25 source figures and 30 journeys PASS |
| Coverage inventory and Python tests | Unchanged 194-card coverage; 10 PASS |
| Original finite legacy bank | 27 modules, 475 tasks, 81 examples, 266 steps PASS |
| Exhaustive catalogue partition | 616 identities, 676 legacy cases, 62 reshuffle checks PASS |
| Published geometry source and assistant projection | Atanasyan, Ichenskaya, full source and both projections PASS |
| Offline generation | Original bytes preserved |
| Extended two-origin LCM browser | 15 groups PASS; 10 complete guided cases, six fresh checks, nine layout views |
| Course/navigation browser | 10 groups PASS at 320/390/1280 px |
| Existing textbook and helper browsers | 8 + 7 groups PASS |
| Expanded source-reference browser | PASS at 320/390/1280 px; all 168 primes through 1000, retained draft/help and isolated links |
| Syntax, source binding, sanitized scoped diff and whitespace | PASS |

The Node rows total **123 passing cases**, with ten additional Python cases.
Repeated checks are not counted again. The source/static batch contains
19 successful command groups; original and combined assertions remain enabled.

### Complete learner path

The combined browser signs into a synthetic cabinet, opens the attached
course, selects LCM, uses both methods, saves a correct step and unfinished
answer, receives acknowledged help, returns through both catalogue routes
and continues the same attempt. Reload and a separate browser context retain
the work. New LCM work takes priority over 194 older unfinished source attempts.
Catalogue/helper navigation alone creates no attempt.

Held saves and a real stale-version rejection block leaving and revealing help
until the existing safeguards permit them. Teacher control, pupil read-only
viewing and history retain mutation fences; a peer is denied access. The outer
teacher/history return changes neither controller, saved state, event history
nor attempt count.

Both combined browser runs record zero JavaScript errors, unexpected external
requests and provider calls. They use isolated synthetic SQLite, two local
origins, Node 24.22.1, Playwright 1.62.1 and Chromium 140.0.7339.16. The unchanged
reference gate uses installed Playwright 1.55.0 with matching Chromium in normal
multiprocess mode.

### Visual verification and limits

The final records contain **27 LCM and 14 navigation images**. After workspace
recovery, independent reviewers actually inspected all 41 newly generated
images. The last author-label contrast correction is reviewed through fresh
inspection of every changed image and exact-byte identity for unchanged images.
The visual manifest distinguishes these observations from automatic assertions.

Initial condition/current question/input/check rectangles clear the closed
helper at **320×900, 390×844 and 1280×900**. Long factor journeys start at the top
of both documents and reset there immediately before advancing to the longer
question. No test scroll is applied after advancement. The full multiplicity
question, input and check fit both frame and outer viewport at 320 and 390 px.

The outer catalogue link remains outside collapsed secondary tools and the
protected task frame. An open helper intentionally overlays underlying content
and has a reachable collapse action. At arbitrary scroll positions the closed
launcher may overlap a transient success toast, lower text or a bottom item in
a tall section capture; universal pixel non-overlap is not claimed. Selected
task actions have explicit full-rectangle and pointer-hit clearance checks.

Accepted previous steps are proven in state/DOM and browser checks. Screenshots
centred on the active form do not show every earlier history entry. These are
Chromium viewport trials, not physical-phone, mobile-keyboard, Safari/Firefox
or actual-pupil learning trials.

## Failed diagnostics and workspace recovery

Initial diagnostics exposed wrong continuation and mobile helper overlap.
Later tests exposed scrolled topic overlap and a long-step view that had passed
only because of inherited scroll. Each caused a product correction and stronger
regression coverage; no failed assertion was removed or relabelled as success.

An earlier optional single-process reference-browser launch crashed Chromium.
The unchanged gate passes with its normal multiprocess launch and matching
installed runtime. No application guard or TLS check was weakened.

During the first GitHub upload, a tool-catalog/executor switch made the local
repository and evidence unavailable. No task branch or PR had been published.
The source union was rebuilt from the same Git identities and virtual tree.
Saved hashes recovered the cabinet app, embedded renderer, both entry HTML
files, workflow and extended LCM browser test byte-for-byte. Course presentation
styles and the catalogue renderer/tests were reconstructed with the same scope
and received fresh review, all relevant gates and new image evidence. The final
report binds only the restored candidate; missing old files are not presented
as current evidence. Verified source blobs are now uploaded as durable Git data.

The original PR389 geometry failures remain historical at its unchanged head.
This combined candidate retains the already released PR391 repair; source
guards pass. No old external-review waiver or old-head CI is reused.

## Release and rollback

1. Present the single Draft candidate with exact base/head, current CI and
   independent review. Obtain the owner release decision and required HIGH
   external-review decision for this version.
2. Immediately query authoritative main and PR head before merging. Any base
   drift invalidates the named-base authorization: stop, classify concurrent
   commits, build a read-only virtual composition, rerun applicable gates and
   obtain a new exact-base/head authorization.
3. With unchanged authorized base, squash once; verify the sole merge parent,
   complete reviewed tree, changed-file set and expected delta. Do not merge
   either original draft separately after the combined release.
4. Verify Pages and the matching cabinet deployment use the authorized merge.
   Compare public/cabinet runtime, catalogue and source bytes, then exercise the
   approved live journey. The separately released assistant knowledge package
   is unchanged and does not require a duplicate update.
5. Identify the intended existing grade-six profile before any route edit,
   preserve notes/work and verify course/continuation from the learner view.
   No real profile is claimed configured during this preparation.

Before release, abandoning the Draft has no production effect. After release,
an owner-approved revert may remove the new entry points while preserving all
records. Restore matching author source before reopening new author attempts.
Keep PR391's published source/helper pair; rollback never deletes pupil work.

## Handoff

```text
EXECUTIVE STATUS

Task: GRADE6_LCM_NAVIGATION_INTEGRATION_20261101
PR: Exact Draft PR recorded in its body
Base: 37718f1c0138ba031314b8f4716b73c9d963bc81
Head: Exact published head recorded in the Draft PR
Gate: Local combined preparation and independent review; exact-head CI recorded separately
Tests: 123 Node cases, 10 Python cases; original source/legacy/geometry checks; 15+10+8+7 browser groups and reference regression
Failures: Resolved diagnostics and workspace recovery recorded above; final status bound to current PR evidence
Not run: External-provider review, merge/deployment, real-profile assignment and physical-device/pupil trial
Scope deviations: Source-patch composition and necessary compatibility/recovery corrections only
Recommendation: Release only this combined candidate after the exact-version owner decision
Next user decision: Separate squash-merge/public-cabinet publication authorization and HIGH external-review decision
```
