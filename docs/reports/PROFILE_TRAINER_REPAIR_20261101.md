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

Preparation results: the fresh full profile Node run passed **337/337** tests;
the exact financial oracle passed **78/78 final and 442/442 intermediate**
answers. All nine main-course data modules are byte-identical to the base.
The 39 focused link/wrapper checks passed after asset synchronization. The
stereo source/parity suite passed 23 gates; probability and old planimetry
self-tests covered 26,000 and 3,200 generated tasks without a mismatch. These
are mathematical/DOM results, not a claim of locally executed browser checks.

- `node --test tools/profile-*.test.cjs`
- `python3 tools/profile-finance-exact-steps.py`
- `npm --prefix ege-profil test`
- Stereo canonical-source/math parity gates under `ege-profil/_istochniki`.
- `node tools/profile-main-geometry-disclosure.browser.cjs`
- `node tools/profile-progress-repair.browser.cjs`
- `node tools/profile-legacy-geometry-repair.browser.cjs`
- `node tools/profile-legacy-learning-repair.browser.cjs`
- Existing course, earned-solution, help, geometry, financial and seven-board
  learner journeys in the unchanged existing workflow jobs.
- `git diff --check`; validate exact changed-file set, asset parity and preserved
  main-course mathematical banks against the named base.

The new Actions job retains actual screenshots from the four browser gates.
Widths are 320/390/1280 for geometry and legacy learning pages; progress/report
journeys additionally test mobile reload and read-only teacher import. Inspect
these artifacts before declaring visual verification completed.

## Failures and limits

Local Chromium cannot start because the execution environment denies its
singleton socket. Browser checks therefore run in GitHub Actions, not by
disabling sandbox/TLS checks. No physical-device, Safari/Firefox or real-pupil
pilot is claimed. Existing tests that expected automatically disclosed help
are updated to assert it remains hidden, explicitly request it, and retain all
their subsequent mathematical/help/history assertions.

The first full local pass found seven canonical-wrapper asset mismatches after
adding the complete report dependency; the wrappers and version assertions were
synchronized. A legacy probability test expected automatic help after errors;
it now explicitly requests help and asserts the new closed state first. Neither
case was bypassed or removed. Fresh results supersede these initial runs.

## Release and rollback

No merge, auto-merge or deployment is performed by this preparation task. The
separate owner decision must name current base/head. Requery authoritative main
immediately before any authorized merge; follow the repository drift procedure.
A bounded revert restores the previous runtime without deleting original work;
additional recovery/report fields remain readable or safely ignored.
