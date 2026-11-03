# Peterson 6: unknowns and equations — verification

Task: [PETERSON6_EQUATION_METHOD](../tasks/PETERSON6_EQUATION_METHOD.md).
Original implementation base: `6b9c327f2ca438cb7e7620ef302876de467fac19`.
Approved reconciliation base: `059ee8c9f5baeb0b333c96d9b8516edb570666b2`.
Branch: `task/peterson6-equation-method-20261102`.
Review level: HIGH. Current owner START authorizes implementation and a Draft PR;
merge and deployment remain separate decisions.

## Result

The prepared trainer teaches the applicable word problems through the unknown, a
relationship or equation, the calculation and a check against the condition.
Conditions, final answers, task IDs, source references and preparation goals
are preserved. Earlier unfinished and completed work retains its original
teaching version and remains accessible.

| Surface | Coverage |
| --- | --- |
| Main course | 14 topics, 224 cards; 98 word-problem cards revised |
| New main-course steps | 491: 196 choice steps and 295 numeric steps |
| Current compiled course | 572 steps, unchanged 497-number source map |
| Main percentage practice | 3 skills; explicit revision 2, original default API retained |
| Separate line | 22 generated word families and 13 unique textbook word problems |
| Preserved preparation | 11 line families and 13 percentage-conversion subparts |
| Printable materials | 3 revised PDFs, 7 / 7 / 8 pages; 20 homework items retained |

The base JSON files and source map are unchanged. A bounded overlay stores new
instructional fields; the bundle also carries complete original affected tasks.
Other courses continue to receive the exact original three-argument math API.
Unpublished PR355 and PR367 are outside this task and have not been resumed.

### Required school examples

- Textbook 303: slower speed `x > 0`, faster speed `1.2x`, closing speed `2.2x`,
  time `385/(2.2x) = 175/x`, faster path `1.2x * 175/x = 210 km`.
  The unknown speed cancels; no numerical speed is invented.
- Textbook 305: `1 h 20 min = 4/3 h`, equation `(4/3)(x + 3x) = 96`,
  speeds `18` and `54 km/h`. The interface shows a horizontal `4/3` fraction.
- Printed analogue 303 remains `270 km`, ratio `1.25`, answer `150 km`;
  homework analogue remains `315 km`, ratio `1.25`, answer `175 km`.
- Printed analogue 305 remains `90 km`, `1 h 15 min`, ratio `3`;
  homework analogue remains `100 km`, `1 h 15 min`, ratio `4`.

## Local verification

**Final local gate: `PETERSON6_EQUATION_METHOD_LOCAL_OK`.**

| Check | Executed result |
| --- | --- |
| Syntax, generated bundle and whitespace | PASS |
| Main content | 224 tasks / 572 steps / 497 source mappings |
| Original shared generator | 6000 examples / 18000 numeric steps; exact arithmetic and formats |
| Independent content oracle | 98 original answers, 295 numeric steps, 98 models, 196 false alternatives |
| Independent percentage oracle | 900 cases, 2700 numeric steps, 900 models, 1800 false alternatives |
| Generator compatibility | 900 legacy/new identities and 1020 unchanged arithmetic cases |
| Existing saved-work checks | PASS: corruption, formats, assistance, duplicates, drafts and detours |
| New saved-work/DOM gate | 25 scenarios; legacy/new restore, archives, imports, exports and exact saved seed navigation |
| Main DOM journeys | 224 task screens, 60 practice screens, all 98 revised tasks / 491 steps completed |
| Existing separate-line gate | 15 cases; original source entries and portable assets |
| New separate-line gate | 10 cases; 2304 independent calculations over all 22 word families |
| Independent legacy line comparison | 2600 generated examples and all 27 source entrances identical to base |
| Models | 14 variants; boundary checks; 58 board round trips and 205 invalid-state rejections |
| Shared helper, picker, board session and cabinet DOM | PASS |
| Registry | 25 unit cases and 7 server integration cases |
| Dependent courses | Makarychev 7 / 8, Alimov 10–11, Nikolsky 10: content, models, state, import and DOM gates PASS |
| Offline export | Embedded revised course loads; external runtime scripts and stylesheet removed |
| PDF mathematical preflight | Exact rational checks for 16 homework word problems and 3 meeting variants |
| PDF layout and preservation | All 22 pages rendered and inspected; all 20 homework items present |

Browser checks used isolated local sites, synthetic records and real Chromium:

- Main equation journeys: **30 journeys / 132 accepted steps**, widths
  **320 / 390 / 1280 px**; model selection survives reload, earlier steps stay
  visible, legacy notes/help survive switching, no page overflow or runtime errors.
- Separate line: **9 journeys / 42 accepted steps**, the same three widths;
  complete 303/305 solutions, model reload and legacy draft/help restoration.
- Existing helper: **63 checks**, six desktop/mobile views.
- Cabinet pair: **10 checks**, desktop/mobile; no actual pupil mutation and no
  live public requests.
- Actual local board/server: teacher, learner, reload, late join, control
  grant/revoke, 14 lessons, 60 practice screens, models and 320 px views;
  personal progress remains isolated.

CI now runs the new content, math, state, line and browser checks. Exact commit
SHAs, workflow URLs and their final results are recorded in the Draft PR after
publication; this document does not claim an unexecuted CI result.

## Saved work and duplicate credit

Personal storage keys remain stable. Existing drafts are read with their
original steps. Switching methods archives earlier work, including notes,
accepted answers and assistance; old completions remain visible separately
from current-method readiness. Imports preserve competing nonempty work.
Links to old generated examples restore their exact seed.

Prior help, completed explanations and familiarity with the same condition
cannot create fresh independent credit under the new method or another seed.
The separate line additionally checks help received after a new attempt was
created. Its two entrances to 303 share one result while retaining per-topic
hint/error attribution. Exported work passes its own validator after these flows.

### Board version boundary

The Peterson board content version changes from `1.0.0` to `1.1.0`; transport
schema remains `1`. Old room snapshots are explicitly incompatible with the
new teaching steps. Existing bridge/server guards reject them before applying
or replacing room work. **There is no automatic migration of old rooms.**
They require the earlier content to resume. This differs from personal course
progress, for which both teaching versions remain available in the new build.

## Review findings closed

Independent internal agents found and verified fixes for:

- Percentage distractors accidentally true at particular values, including
  10% and 125%; distractor equations now have an independent exact oracle.
- A shared-generator default that would have changed other courses; the new
  method is now enabled only by this course's facade or explicit revision 2.
- Legacy hint drift, empty-record import overwrites, lost generated signatures,
  and navigation to the wrong saved seed.
- Decimal-format steps accepting an ordinary fraction despite asking for a
  decimal; `3/40` is rejected where `0,075` is requested.
- Late legacy exposure and cross-module 303 help accounting in the line.
- Symbolic fractions in the shared helper and several ambiguous explanations.

Both independent internal reviews concluded READY after the fixes. These are
internal agent reviews, **not external Claude review** and not merge approval.
No private photographs, pupil records, credentials or local machine paths
were included in repository handoffs.

## Failures, limitations and release decision

- No unresolved local feature/test failure remains.
- Initial local browser attempts were blocked by loopback sandbox permissions;
  authorized isolated reruns succeeded. Sparse-checkout fixture/assets and the
  installed Chromium path were resolved without changing product behavior or
  weakening assertions.
- Git CLI publication is unauthenticated; use the authorized GitHub integration.
- Claude consultation/review is unavailable in this session. Under the trainer
  consultation and HIGH review policies, release still requires the external
  review or a new explicit owner exception. Historical waivers do not apply.
- No actual-pupil trial, main merge, deployment or production mutation was done.
- A release must coordinate the board content metadata and retain the old-room
  limitation above. A code rollback needs separate authorization; do not erase
  newly saved method-2 work as part of a rollback.

## Printable identity

| File | SHA-256 |
| --- | --- |
| Peterson6_Shpargalki.pdf | `310135df98295da4e77b1fbf1c92821cce47f14aea412c5075c7445c883aeb18` |
| Maxim_Peterson6_Novye_shpargalki.pdf | `f2c09b630fa1e75d668ed444a9f62312e469896c5f739d4815274409a4b3bb0d` |
| Peterson6_Domashnyaya_rabota.pdf | `a23bb853105355256c53122b1de56fd158b3fdab8af1d36a1f8063d4544551b9` |
| Peterson6_Procenty_340.pdf (unchanged) | `50836e2d50498170b7830cd88356a56359fc5f58bcf6649dd16a88d0931de358` |

## Read-only integration revalidation and authorized reconciliation, 2026-11-02

The owner approved reconciling the sole status-document conflict and preparing
PR400 for publication after reviewing the following base-drift evidence. This
is authorization for the task branch, not production merge or deployment.

- Original PR head: `84945da0d9fc9eac10d42d089798f53a27c97b99`.
- Current main: `059ee8c9f5baeb0b333c96d9b8516edb570666b2`.
- Concurrent commit provenance: published PR375 (assistant dialogue), with
  successful Pages41337980680. Its task-specific review exception is not reused.
- The read-only virtual merge tree is
  `002383f74525747c403daecf4a91ca93f537fe5d`. Only
  `docs/PROJECT_STATUS.md` conflicts; the runtime files do not overlap.
- The virtual delta retains the original 39 paths, with no extra or missing
  path. Every non-conflicting PR400 blob matches its reviewed head; every
  upstream-only blob matches current main. Documentation reconciliation keeps
  both task records and the already verified PR396 release record.
- The previous 23/23 successful CI runs belong to head `84945da0`. They are prior
  evidence, not new-head CI. Record the new candidate and final workflow URLs
  in PR400 after the authorized task-branch update.

### Executed tests of the composed runtime

- Main course: 13 commands covering syntax/build/content/math/state/models and
  UI coverage of 224 cards, 60 practice screens and 98 revised tasks/491 steps;
  equation-state gate 25/25; board model gate PASS.
- Separate line: 15/15 baseline and 10/10 equation/state checks, including
  2304 independent mathematical cases across all 22 word families.
- Main equation browser: 30 journeys/132 accepted steps; separate-line browser:
  9 journeys/42 steps, both at 320/390/1280 px.
- Cabinet/helper/board DOM and registry contracts PASS; registry 32/32.
  Real-SDK board gate passed 9/9 in an isolated unchanged rerun.
- Helper browser 63 checks, cabinet pair 10 checks and actual local board/server
  coverage of 14 lessons/60 practice screens PASS, including retained work,
  reload, late join, control transfer and personal-storage isolation.
- Updated assistant/cabinet target tests 61/61 PASS. PDF exact-rational preflight
  retained 20 homework items, 16 word problems and 3 meeting variants.
- Initial scratch failures were recorded: two missing assistant-service source
  files were materialized from the exact virtual tree. One SDK notification
  assertion failed during a parallel run and passed unchanged in isolation.
  Redundant aggregate-runner failures were superseded by successful direct
  registry and board runs. No test assertion or TLS control was weakened.

These checks were executed on the read-only composed runtime before the
owner's reconciliation authorization. The subsequent documentation-only
reconciliation must preserve that runtime byte for byte. No current-task
external-review waiver or Claude verdict is claimed. The board 1.1.0 old-room
boundary and personal saved-work preservation described above still apply.
