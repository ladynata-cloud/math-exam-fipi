# Geometry cabinet: on-demand helper and explicit object names

## Identity

- Date: 2026-10-28 (Asia/Novosibirsk)
- Base: `main`, `fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8`
- Branch: `feat/maxim-peterson-cabinet-helper`
- PR: [#369](https://github.com/ladynata-cloud/math-exam-fipi/pull/369)
- Review level: `MEDIUM`

## Goal and approved scope

The owner requested completion of the geometry pupil cabinet: course placement,
a bottom-right assistant helping with the current trainer, and a whole-course
audit of object names. The supplied example is the already-issued first task
of the methodology route: a point beyond an endpoint, whose object picker
names points and a line explicitly but labels the finite segment only `AB`.

- Make existing pupil assistant views collapsible and bottom-right, initially
  closed, with accessible keyboard behavior and mobile layout. Teacher settings
  remain inline.
- Retain native Atanasyan/Ichenskaya source-helper behavior and exact task/step
  context. Do not add provider calls or broaden backend contracts.
- For existing owned legacy geometry attempts, expose existing task conditions,
  step explanations and object descriptions through the same helper. Await the
  existing persisted hint action before showing help; retain identity, control,
  history, archive, connection and assessment boundaries.
- Audit geometry-course pickers across the complete relevant generated families
  and old thematic course. Name points, segments, rays, lines, angles and figures
  from actual model semantics, including saved assignments. Keep bare notation
  such as `AB` where it is mathematically appropriate in formulas and diagrams.
- Synchronize generated copies only where a common geometry-renderer change
  requires it. Preserve tasks, source text, answers, identifiers and generators.
- Verify the two assigned native source course cards and the legacy assignment
  remain reachable; actual pupil configuration uses private teacher UI only.

The owner expanded the active cabinet/helper work to include this geometry
continuation. It is delivered together with the Peterson work in PR #369 on
`feat/maxim-peterson-cabinet-helper`; the temporary geometry worktree is only an
implementation aid. This specification records the geometry part of that one
reviewable change. No source scans, private pupil identifiers, credentials or
real pupil records enter Git.

## Context

The current implementation recognizes the native Atanasyan beginning course and
Ichenskaya companion. Its source profile rejects generic legacy-attempt calls;
the old methodology route therefore receives links instead of current-step
help. The saved-assignment renderer also displays stored abbreviated labels,
so source-generation fixes alone would leave existing assignments ambiguous.

The accepted assistant ADR and existing tests define the source-only and
account-isolation boundaries. This task adds no architecture or trainer
learning sequence. It changes presentation and reuses existing hint actions.

## Acceptance and gates

- Existing cabinet and native course entry points remain available.
- Pupil helper is closed by default, right-bottom, closes with Escape, restores
  focus, fits narrow screens and never requests help without a pupil action.
- Native task changes and legacy attempt/step changes never leak stale answers.
- Legacy explanations appear only after a successful hint acknowledgment; no
  independent-credit claim after assistance, and no help during active exams,
  teacher control, history, archived work, account switches or lost connection.
- Systematic object-label audit has no unexplained bare names in pickers and
  distinguishes collinear segments/rays/lines according to source semantics.
- Saved assignments receive the corrected display labels without migration.
- Source, DOM, server-action contract and actual-browser regression checks,
  desktop/mobile screenshot inspection, independent review and diff checks.
- Gate: `GEOMETRY_HELPER_CLARITY_PASS` after relevant checks pass.

## Object-name audit and implemented correction

`learning/geometry-object-labels.js` derives display names from the saved
diagram and explicit source-family semantics. The assignment renderer, both
practice renderers, workshop target prompts and legacy helper projection use
the same names. It does not modify the stored task, IDs, drawing coordinates,
formulas, answer choices, solutions or progress protocol. Thus an older saved
`AB` element becomes `Отрезок AB` immediately, while the separate `line` element
remains `Прямая AB`, without a task migration.

| Audited surface | Coverage | Result |
| --- | --- | --- |
| Construction route and classic grade-seven practice | 126 construction families plus 8 classic families; all 13,872 admitted variants; 101,642 selectable object labels | 43,952 captions clarified across 115 families; no unexplained untyped selectable names |
| Type-identification exercise | 216 variants of `grade7-g-core-point-line-ray` | `Вся фигура` intentionally remains neutral because naming its type would reveal the requested answer |
| Older thematic GeoLab | All 63 units; 210 points and 194 initial objects: 175 segments, 10 rays, 9 circles | Explicit names follow `extent` and object type; constructed lines, segments, rays and circles are checked separately |
| Assigned native Atanasyan and Ichenskaya courses | 255 and 110 cards; 1,276 and 470 model views; 222 case captions in total | Existing interactive case captions are descriptive; no mathematical source or planar-viewer change is needed |

Angle sides are rays when the source identifies them as rays; radii, chords,
triangle sides and finite extensions remain segments. Crossing lines and
secants retain their line semantics. A neutral or unknown model is not
classified by blindly prefixing its letters. Short notation on the actual
figure and inside formulas remains unchanged. Construction controls use the
matching object type, including `Провести прямую CD` and `Провести луч AD`.

The 63 standalone atlas pages contain the exact updated `lab.js` block. Only
that embedded block is synchronized; existing canonical URLs, page titles and
other generated markup remain unchanged. The new label/selector sizing also
keeps the complete circle name readable without horizontal overflow at 320px.

### Explicit full-textbook exception: exercise №205

The wider, unassigned canonical textbook was also inspected: 705 cards, 3,784
views and 532 case captions. Five captions in exercise №205 are bare `AB`,
`AE`, `AC`, `BC`, `PQ`; their model metadata confirms that each denotes a
straight line. They are outside the assigned 255-card beginning course, the
110-card companion and the legacy methodology route corrected here.

These five captions remain an explicit audit finding. The textbook's direct
callers and planar viewer belong to the fixed runtime review hash; adding a
display adapter there would invalidate review bindings beyond these five
labels. The existing unbound board adapter does not expose №205. This task
does not replace source labels, alter the viewer, weaken historical freezes or
claim a blanket reapproval of 705 cards. All assigned-course naming paths are
covered above; completion of every caption in the full textbook is not claimed.

## Native source provenance repair

The existing source gate exposed a pre-existing mismatch after the canonical
textbook grew from 569 to 705 cards. A content audit compared all 255 selected
native cards and their catalog entries with both the earlier sealed source
and the current canonical bundle: zero selected cards or catalog entries
changed. Rebuilding the native projection against the current bundle produced
the same teaching payload. Its selected-content digest remains
`175e92c3dc4476da7148b4e8c2d2e305d7cd322c55d6d5db1290cc98a1004318`.

The bounded repair updates the whole-bundle fingerprint in the source builder
and its tests, one `source.sha256` field in the native course, and the two
`sourceSha256` / `courseSha256` metadata fields in assistant knowledge. Dependent
native-course test pins are updated. No Ichenskaya teaching projection, book
source, model, answer, review record or provider/backend logic changes.

| Fingerprint | Before | After |
| --- | --- | --- |
| Canonical source bundle | `afd4228a2e1444c8fca719fcc2dc0145ca5419354980a33dcadbf637b560325d` | `bcd2aba64872aabcfd763448d9e3223ae90bb40a780091dd5922059c14583d81` |
| Native Atanasyan course | `551c433a5332dba52779e74f7e6f95289c3915bdc55da3f7c0ed71d0b7e651a3` | `b7023d8b851143695e998445a420a09df0119c8e297a7314766e38ace40930ad` |
| Assistant Atanasyan knowledge | `2b69a93b35d05dda1ae195cd5cf0ea2482dbd7064e82d7736750afcbdce024aa` | `2df5fd26028b6c940fc4a1720891adf77a4a95a630d18dd8ec76f99d2eb3dc60` |

Independent regression assertions restore only the previous provenance
fields, then require the original full native-course and knowledge byte hashes.
This proves that the repair preserves all previously reviewed teaching content;
the selection digest is also explicitly frozen. Existing source and knowledge
workflows retain these gates, rather than bypassing or duplicating them.

Publication must rebuild and deploy the cabinet/public course and
`assistant-service` from the same reviewed revision. The service packages the
course fingerprint as its `courseRevision`; deploying only one side leaves a
revision mismatch. This is a coordinated packaging requirement, not a provider
or runtime-contract change. Deployment authorization remains separate.

## Reproducible evidence

Local focused checks completed for this geometry scope:

- `tools/geometry-object-labels.test.cjs`: four passing tests, including the
  exhaustive 134-family audit, saved bare-label snapshots, exact source/task
  preservation, source-type distinctions, DOM text safety and entry-point
  loading order.
- `tools/geometry/object-labels.test.cjs`: three passing tests for all 63 units,
  constructed object types, unchanged geometry and exact embedded source copies.
- `tools/geometry-object-labels.browser.cjs`: nine passing journeys across
  1280px, 360px and 320px. Actual public membership/angle lessons and a synthetic
  old assignment verify selection/readout names, distinct line/segment labels,
  unchanged saved data and no horizontal overflow.
- `tools/geometry/object-labels.browser.cjs`: six passing actual-page journeys
  for a segment topic and the longest circle name at the same three widths.
- Existing GeoLab checks: 46,551 mathematical assertions passed. Native source
  builders/tests and ten assistant course-context tests passed after the narrow
  provenance repair.

The saved-assignment desktop and public-ray mobile screenshots were visually
inspected. Browser fixtures use synthetic local tasks and never access real
pupil accounts. Independent review reran both label DOM gates and reviewed
source-specific segment/ray/line rules; final combined-head review and CI are
recorded in PR #369, not inferred from these local results.

`.github/workflows/learning-quality.yml` now runs both new helper boundary
tests (`learning-assistant-local.test.cjs` and
`learning-legacy-geometry-helper.dom.cjs`), both label audit tests and both label
browser suites, reusing its pinned runtime and actions. The existing native
source/knowledge workflows continue to cover provenance. CI uploads:

- `grade7-geometry-rebuild-evidence/object-names/`: saved-assignment,
  point-membership, angle-vertex and GeoLab screenshots at 1280/360/320px;
- `geometry-helper-evidence/`: current-source helper desktop/mobile screenshots
  from the existing assistant browser suite.

Exact final head, full-suite outcomes and production smoke results remain
release-handoff evidence. Local test completion is not a merge or deployment
approval.

## Risk, review and rollback

MEDIUM: bounded frontend behavior within existing contexts and server actions.
No new mathematical tasks or substantial learning-sequence redesign; a new
trainer consultation is not applicable. Independent focused review must check
source accuracy, aid accounting, stale context, semantic labels and UI layout.
No external review is required at this review level.

Risks: semantic misclassification, saved-task incompatibility, inadvertent hint
disclosure, mobile overlap and inconsistent packaged course revisions. Revert
the frontend/helper presentation together if needed; no pupil records or helper
quotas are deleted or migrated. A provenance-repair rollback must keep the
cabinet course and assistant-service knowledge at the same reviewed revision;
the earlier source pin remains incompatible with the expanded canonical bundle.

## Permissions and execution

The current direct owner request authorizes implementation, tests, branch,
logical commit, push and Draft PR. Merge/auto-merge/deployment require separate
authorization. Record exact head, PR, test evidence and any live access blocker
at handoff. Production configuration must preserve earlier plans and records.
