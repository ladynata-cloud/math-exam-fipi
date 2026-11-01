# Profile first-part trainer repair: verification

Task: [PROFILE-TRAINER-REPAIR-20261101](../tasks/PROFILE_TRAINER_REPAIR_20261101.md).
Base: `6b9c327f2ca438cb7e7620ef302876de467fac19` (merged PR396).
The PR records the exact remote head and final CI verdict; this file records
the implementation and reproducible gates without a self-referential SHA.

## Corrections

- Old finance: L1 balance 500 (a160/b100, total2580); I1 February-July schedule
  and 375.1 overpayment; B1 exact threshold; J1 sum and hint; M1 asks for the
  scalar boundary actually checked. Exact input and money/integer tolerances.
- Legacy planimetry/stereo reject numeric-prefix garbage while retaining valid
  simple fractions; probability rejects a percent used as a decimal probability
  and validates the explicitly rounded result.
- Algebra, applied and trigonometry assessments count a response once, cancel
  stale transitions, retain earned scores and distinguish requested assistance.
  Dynamically rendered trig scripts use local scope; all ten traps and five
  final-test questions remain interactive. The zero graph coefficient is no
  longer replaced by one; derivative wording uses valid implications.
- New course: legitimate fresh checkpoint successes credit their lesson once;
  familiar clean repeats remain explicitly different and provide continuation.
  Unknown stored fields/IDs/drafts survive without influencing validated marks.
  Diagnostics survive reload; continuation uses learning evidence rather than
  an arbitrary truthy count. The error journal includes retained course errors.
- A complete JSON report can be read by the teacher without writing any local
  pupil data. The existing MEP1 import/export format and records remain intact.
- Topic links choose the intended existing group: probabilities, trig equations
  or values, applied formulas or text problems, graphs or extrema. Main geometry
  links use the calm catalogue; board links use registered topic-specific routes.
- Condition, drawing and essential construction controls remain visible. Theory,
  hints, reference blocks, earned explanations and final worked solutions open
  on request. Help closure preserves assistance, inputs and drawing instances.
  Seven board wrappers use the same versioned canonical assets and accept old
  snapshots plus validated optional recovery/help state.
- Prior-year materials and project-2027 sources remain explicitly distinguished.

## Independent review

Separate internal reviewers recalculated finance B1/L1/I1/J1/M1, exercised
invalid inputs and units, reviewed main geometry and drawing preservation, and
tested checkpoint/recovery, opaque-state preservation and read-only report
import. Review found a stale J1 hint, a missing common-help signal, opaque state
loss and automatically opened earned explanations; these were returned to the
implementers and corrected. Final head binding and any remaining findings are
recorded in the PR.

External consultation/review is not completed. No general authorized Claude
integration is exposed; the existing OGE review script is not a generic profile
review service. HIGH release review or a current task-specific owner exception
is still required. Internal review is not represented as a Claude verdict.

## Reproducible checks

Preparation results: the fresh full profile Node run passed **340/340** tests;
the exact financial oracle passed **78/78 final and 442/442 intermediate**
answers. All nine main-course data modules are byte-identical to the base.
The 39 focused link/wrapper checks passed after asset synchronization. The
stereo source/parity suite passed 23 gates; probability and old planimetry
self-tests covered 26,000 and 3,200 generated tasks without a mismatch. These
are mathematical/DOM results. Subsequent browser evidence is recorded below.

- `node --test tools/profile-*.test.cjs`
- `python3 tools/profile-finance-exact-steps.py`
- `npm --prefix ege-profil test`
- Stereo canonical-source/math parity gates under `ege-profil/_istochniki`.
- `node tools/profile-main-geometry-disclosure.browser.cjs`
- `node tools/profile-progress-repair.browser.cjs`
- `node tools/profile-legacy-geometry-repair.browser.cjs`
- `node tools/profile-legacy-learning-repair.browser.cjs`
- `node tools/profile-legacy-applied-repair.browser.cjs`
- Existing course, earned-solution, help, geometry, financial and seven-board
  learner journeys in the unchanged existing workflow jobs.
- `git diff --check`; validate exact changed-file set, asset parity and preserved
  main-course mathematical banks against the named base.

The new Actions job retains actual screenshots from the five browser gates.
Widths are 320/390/1280 for geometry and legacy learning pages; progress/report
journeys additionally test mobile reload and read-only teacher import. Inspect
these artifacts before declaring visual verification completed.

Local headless-shell evidence after the browser corrections includes 60 main
geometry journeys with all 54 first-screen checks, 27 repaired learning-page
screens, 12 financial table screens, 44 foundation-help roundtrips across all
20 banks, 84 readable-help journeys, 42 earned-solution journeys, 341 learner
robot checks and 192 calm-learner checks. Existing start, first-three,
full-course, readiness and exam-first browser gates also passed. The financial
course gate passed 78 guided and 78 independent tasks, 546 accepted answers,
28 reloads and 10,056 model-cell checks at 320/1280 pixels. Actual representative
screenshots were visually inspected, including the condition/drawing viewport,
requested financial ledger, diagnostics and read-only reports.
The final seven-bank geometry browser gate passed 54 page states and 183
checks at 320/390/1280 px. It actually drags a construction point, retains that
point through a foundation-help detour, and completes the construction. Mobile
stereometry keeps condition, drawing and answer in that order; construction
availability is checked against the authored task rather than assumed for
every solid. The full legacy package passed again after these changes.

## Failures and limits

The initial full Chromium executable could not start because the environment
denied its singleton socket. The installed Chromium headless shell subsequently
ran the same Playwright gates successfully with the existing executable-path
option; no permissions, sandbox policy or TLS settings were changed. GitHub
Actions also runs its pinned Chromium version. No physical-device,
Safari/Firefox or real-pupil pilot is claimed. Existing tests that expected automatically disclosed help
are updated to assert it remains hidden, explicitly request it, and retain all
their subsequent mathematical/help/history assertions.

The first full local pass found seven canonical-wrapper asset mismatches after
adding the complete report dependency; the wrappers and version assertions were
synchronized. A legacy probability test expected automatic help after errors;
it now explicitly requests help and asserts the new closed state first. Neither
case was bypassed or removed. Fresh results supersede these initial runs.

The initial PR browser run additionally exposed a 32 px bottom overflow in the
first main geometry drawing at 320 px and horizontal overflow in the legacy
vector controls. Mobile spacing and flexible tracks were corrected without
reducing figure/readability assertions. Actual screenshots also motivated
shorter course navigation and requested disclosure of secondary explanations.
Old browser scenarios now explicitly open the requested example, and verify
the complete report envelope before retaining their former course assertions.
The trig trap scenario reads the heading's text content rather than its
CSS-transformed uppercase rendering, and additionally answers the second trap.
An additional scrolled mobile capture exposed a tall sticky trig menu covering
the task. On narrow screens it now scrolls with the page; shared navigation
replaces the overlapping floating return link, and mode labels no longer break
inside words. The browser gate checks this scrolled state and captures finite
animations at their completed state for reliable visual inspection.

The local added-board run passed four complete trainer families and the fifth
family's topic navigation, then reached its unchanged 240-second watchdog while
other browser suites were running. This partial run is not a passing verdict;
the isolated exact-head CI job must pass before final handoff. No watchdog,
mathematical assertion, mobile dimension or board gate was weakened.

## Release and rollback

No merge, auto-merge or deployment is performed by this preparation task. The
separate owner decision must name current base/head. Requery authoritative main
immediately before any authorized merge; follow the repository drift procedure.
A bounded revert restores the previous runtime without deleting original work;
additional recovery/report fields remain readable or safely ignored.

## Authorized release continuation, 2026-11-02

The owner explicitly authorized the following bounded sequence in the current
conversation: retain both project-status records; merge main
`059ee8c9f5baeb0b333c96d9b8516edb570666b2` into PR397 while preserving history;
grant this PR an external HIGH-review exception on the basis of completed
checks; and, after the updated branch passes checks, squash-merge, publish and
verify the public site. This task-specific decision supersedes the outstanding
permission notes above. It is not an external-review verdict or a standing waiver.

The previously reviewed head is
`d1291ca1214f8a96f7f0de5e613161e6d4eecc5a`. Direct remote-ref verification found
exactly one concurrent main commit: the authorized, published assistant PR375.
The read-only virtual merge found a single conflict in `docs/PROJECT_STATUS.md`;
the other 77 PR files matched the reviewed head exactly and no extra file
appeared in the 78-file main-to-virtual delta. All ten course-data files matched
the original base, reviewed head, current main and virtual runtime. The conflict
resolution retains the profile entry, reconciles the assistant entry with its
actual publication, and retains the historical PR396 heading. No runtime source,
task condition, task ID, stored pupil record or deployment configuration changes.

Continued checks reused the existing audit rather than starting it over:

- The six original exact-head workflows were rechecked and all were successful;
  the actual dedicated audit-job log confirms its mathematical/browser gates.
- Fresh 66/66 targeted Node/DOM checks passed on the reviewed head and virtual
  runtime, covering strict answers, repeated clicks/Enter, help evidence,
  checkpoint recovery, opaque saved fields and read-only teacher reports.
- The independent Fraction-based oracle passed 78 financial tasks and 442
  intermediate values again, with zero failures. Legacy L1 gives a=160, b=100,
  debt=500 and total=2580. Legacy I1 gives payments=1280, penalties=95.1 and
  overpayment=375.1; the wrong 300 and 352.9 answers are rejected.
- Virtual-runtime browser checks passed: 60 main geometry journeys and 54
  first-screen checks at 320/390/1280; progress/diagnostic reload and read-only
  report roundtrip; seven additional geometry banks with 54 page states and
  183 checks including pointer construction; 27 legacy learning screens.
- The existing 72-PNG artifact matched SHA-256
  `f84c2c91684436f6a337ed4386f3d9476e5ab2a8521fa50a361451a688a6b89f`.
  Representative main/additional geometry, constructions, finance tables and
  scrolled trig screenshots were inspected, as were fresh geometry screenshots.
- `git diff --check` passed for the prepared patch. The history-preserving
  integration is separately checked for exact source/blob preservation.

Browser verification uses the existing executable-path option and installed
Chromium headless shell. No assertion, gate, timeout or TLS setting was relaxed.
No external model verdict, physical-device check or real-pupil pilot is claimed.
Updated-head CI and production evidence are recorded in PR397 after this
non-self-referential report is committed. Passing local checks alone is not
reported as a deployment. Requery main before the authorized squash merge;
the named authorized base remains `059ee8c9f5baeb0b333c96d9b8516edb570666b2`.
