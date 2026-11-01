# Geometry source provenance — preparation verification

Task: [GEOMETRY_SOURCE_PROVENANCE_20261101](../tasks/GEOMETRY_SOURCE_PROVENANCE_20261101.md).
Base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`.
Branch: `fix/geometry-source-provenance-20261101`.
Review: **MEDIUM**, bounded coordinated metadata repair.
Date: 2026-11-01 Asia/Novosibirsk / 2026-10-31 UTC.

## Result and original failure

**Local gate: `GEOMETRY_SOURCE_PROVENANCE_PREPARATION_OK`.** The deterministic
source, unchanged teaching payload, retained-work and helper compatibility
checks pass. This is preparation evidence; exact published head, CI and
read-only composition results are recorded in the separate Draft PR.

Both failing geometry workflows on PR389 stopped at the same full-source SHA
guard. The canonical JSON had grown from the pinned 705-card version to 1247
cards. Its own publication gate passed, but the bounded beginning-course
builder still expected the earlier whole-file fingerprint. The source, builder,
derived course and workflow files were identical on main and PR389; this was a
reproduced base failure. It was not a PDF mismatch or a change introduced by
the LCM supplement.

## Exact repair

The six substantive files contain 12 insertions and 11 deletions. The builder's
audited source pin changes; dependent current-artifact assertions follow the
deterministically generated outputs. Comments distinguish current provenance
from the historical content checks. No assertion is removed or weakened.

| Derived artifact | Exhaustive structural JSON diff |
| --- | --- |
| `learning/atanasyan-first-steps/course.json` | `/source/sha256` only |
| `assistant-service/knowledge/atanasyan-first-steps.json` | `/courseSha256`, `/sourceSha256` only |

| Object | Previous SHA-256 | Repaired SHA-256 |
| --- | --- | --- |
| Full-source pin | `bcd2aba64872aabcfd763448d9e3223ae90bb40a780091dd5922059c14583d81` | `af1e3a373745d3a66e3e6f71b14d02de4cd81f0c688a8929c0475277cc22b574` |
| Bounded course | `b7023d8b851143695e998445a420a09df0119c8e297a7314766e38ace40930ad` | `0a55791957f465cf6f9c3736fe41ca8a4fb110601bbcf9c4e9843e38a3f5a0fe` |
| Assistant knowledge | `2df5fd26028b6c940fc4a1720891adf77a4a95a630d18dd8ec76f99d2eb3dc60` | `755cd5c4593594f296cb1a7e03af5ad29ba5413104561522901918f31c418013` |

The complete canonical JSON and textbook PDF, all card content, answers,
models, steps, catalog entries, lesson revisions, source numbering and review
records are unchanged. The Ichenskaya source, generated course, manifest and
assistant snapshot are also unchanged. No runtime, backend, provider, storage,
workflow or deployment configuration is modified.

## Immutable-source and independent review evidence

An independent internal reviewer audited the sealed historical source before
implementation and inspected the resulting six-file patch afterwards. No
blocking finding remains. This is an internal review, not an external-model
approval and not the PR389 exception.

- Every one of the **705 historical cards and catalog entries** equals the
  sealed chapters I–V oracle, associated with historical source commit
  `fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8`.
- The oracle file retains SHA256
  `ab9c380dbf6e4a9d3cbd753437a10a9e973b99e3581b406a0f52f796dea4e1b3`.
- Every selected **255-card / 799-step** record, its order, sections, models
  and display overrides are identical. The selected-content fingerprint stays
  `175e92c3dc4476da7148b4e8c2d2e305d7cd322c55d6d5db1290cc98a1004318`.
- The PDF identity stays
  `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
- Existing independent tests restore only the original provenance fields and
  still require the original **complete file bytes**, not a newly recomputed
  expected payload: course
  `551c433a5332dba52779e74f7e6f95289c3915bdc55da3f7c0ed71d0b7e651a3`
  and knowledge
  `2b69a93b35d05dda1ae195cd5cf0ea2482dbd7064e82d7736750afcbdce024aa`.
- Both service boundaries agree on the question, topic, context and repaired
  revision for **all 799 steps**. Independent negative probes using the actual
  previous revision are rejected for **799/799** contexts.
- Synthetic retained records, including all step drafts, normalize identically
  for **255/255** cards, with identical storage keys. No pupil records are read.

The reviewed six-file binary diff has SHA256
`6d1c378d128c17c7445ae788640b23e548157eb050863b6fa3c3986de7011574`
and stable patch ID `0a3a728a1d34374f8d302d302ee5aaf355101802`.
Documentation is reviewed separately and does not alter this patch identity.

## Local checks

All commands below use the unchanged existing gates and assertions.

| Check | Result |
| --- | --- |
| First-steps deterministic builder, source and original-byte checks | PASS: 255 cards, 160 exercise numbers, 23 theory points, 12 sections |
| Full canonical course check | PASS: 1247 cards / 736 exercise numbers; publication review matches |
| Assistant knowledge generator in check mode | PASS for both courses and the companion manifest |
| Ichenskaya builder and source/model checks | PASS: 110 cards / 23 works / 360 steps / 470 views |
| Independent Ichenskaya math audit | PASS: 332 checks |
| Both courses' Node suite | PASS: 24 reported tests; embedded state gate 9 cases and runtime gate 6 cases also pass |
| Complete assistant-service suite | PASS: 119 tests, zero failures/skips |
| Board assistant and registry integration | PASS: 31 tests, zero failures/skips |
| First-steps browser | PASS: 12 public + 12 native journeys and read-only teacher preview, at 1280/390 px |
| Ichenskaya browser | PASS: 16 public + 16 native journeys, 2 retained course switches and teacher preview, at 1280/390 px |
| Real browser → cabinet → separate assistant HTTP integration | PASS: 8 scenarios / 15 requests, zero external model calls |
| Sitemap, bounded diff and whitespace | PASS: 531 canonical URLs; `git diff --check` clean |

The source-course browser runners use local serving, synthetic cabinet API
fixtures and isolated browser storage. They check complete conditions,
diagrams, draft/step retention, reload, assistance and read-only preview. The
separate helper integration uses real local authenticated cabinet HTTP,
SQLite and separate assistant HTTP; no production service is contacted.

The browser runner source is unchanged. An installed Chromium 140 was selected
through the runners' existing executable-path option; the repository gates
and assertions were not adapted. CI uses its own pinned browser runtime.

An independent reviewer actually inspected six representative images: desktop
and separate 320 px first-screen/model captures for one task from each course.
These additional captures do not extend the unchanged runners' 390/1280 px
coverage. Atanasyan #100a is readable with an unclipped diagram and labels.
Ichenskaya K-2, variant 2, #3 retains an existing layout limitation: its long
heading places the SVG below the 320×900 first screen (top at y=947.42); only
the upper part appears in the inspected 1280×900 first screen. The separate
SVG is not clipped, but the initial triangle is small on mobile. This is not a
repair regression or a claim that every diagram fits the first screen. The
metadata repair does not expand into an unrelated layout redesign.

Reproduction commands:

```sh
python3 -B tools/atanasyan-first-steps/build.py --check
node assistant-service/scripts/build-course-knowledge.cjs --check
node tools/atanasyan-first-steps/source.test.cjs
python3 -B tools/geometry-textbook/build_course.py --check
python3 -B tools/ichenskaya-grade7-works/build.py --check
python3 -B tools/ichenskaya-grade7-works/math_audit.py
node tools/ichenskaya-grade7-works/source.test.cjs
node --test --test-isolation=none tools/atanasyan-first-steps/*.test.cjs tools/ichenskaya-grade7-works/*.test.cjs
npm --prefix assistant-service test
node --test board-server/test/learning-assistant.test.js board-server/test/server-registry.integration.test.js
node tools/atanasyan-first-steps/browser.cjs
node tools/ichenskaya-grade7-works/browser.cjs
node tools/learning-assistant-e2e.browser.cjs
python3 -B tools/build-sitemap.py --check
git diff --check
```

## Production reconciliation

On **2026-10-31 18:47 UTC**, verified HTTPS requests returned HTTP 200 without
redirect for both public JSON assets:

- [Canonical source](https://mathexam.space/geometry-course/textbook/data/course.json):
  1247 cards, 7,206,785 bytes, SHA256 `af1e3a373745d3a66e3e6f71b14d02de4cd81f0c688a8929c0475277cc22b574`;
- [Beginning course](https://mathexam.space/learning/atanasyan-first-steps/course.json):
  255 cards, 2,805,951 bytes, SHA256 `b7023d8b851143695e998445a420a09df0119c8e297a7314766e38ace40930ad`.

Both matched the current main bytes exactly. This demonstrates the source
publication and the old derived provenance; it does not claim that this repair
has been deployed or recertify all prior release behavior. Primary PR388
metadata also confirms its merge as the current base. The existing status file
is reconciled in this task; no status-only PR is created.

## Compatibility, release and rollback

The cabinet hashes the complete bounded-course file into `courseRevision`;
the assistant packages that value as `courseSha256`. Both cache their source
in process memory. Therefore, a metadata-only rebind still requires matching
cabinet/public and assistant packages and normal process restarts when a later
release is separately authorized.

Mixed versions fail closed: the assistant rejects `CABINET_COURSE_MISMATCH`,
and the cabinet rejects a mismatched response revision. A request during skew
may consume the already reserved per-pupil allowance without yielding an
answer. This existing fence and quota behavior are unchanged. Release planning
must avoid a prolonged mismatched pair and verify both boundary revisions.

Saved work uses the unchanged namespace plus `lesson.id` and `lesson.revision`;
neither the full-source SHA nor `courseRevision` is a work-storage key. No
migration, deletion, reset or rewrite of learner work is required.

Before release, close the Draft to abandon it. After owner-authorized release,
rollback restores the prior cabinet/course and assistant packages together,
then restarts both normally. The original source-audit failure would return;
it must remain visible. Work and teaching content stay intact in either pair.

## PR389 and remaining decisions

The owner explicitly waived **external review for PR389 only**, citing the
unavailable provider and completed independent checks. PR389 metadata records
that decision for base `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3`,
head `a14fed1152a0dbfdca07775dd891ba3af00a2e30`. No provider verdict is fabricated.
This repair is independently classified MEDIUM; that exception is not extended.

Both geometry workflows explicitly checkout each PR's head SHA. Merging a
separate repair into main would not change or green an unchanged PR389 rerun.
Read-only virtual composition results in the repair PR will inform the later
integration decision. No branch is merged/rebased or history rewritten here.

Not run: production release, real cabinet assignment, physical-device/pupil
trial and external-provider review. Container/exact-head CI results are
recorded in the PR rather than inferred from local tests. The original source
failures remain historical failures; current repaired gates are separate runs.

No scope deviation. **Merge, auto-merge, deployment and any new-base integration
of PR389 remain separate owner decisions.**

```text
EXECUTIVE STATUS

Task: GEOMETRY_SOURCE_PROVENANCE_20261101
PR: Separate Draft; final URL in handoff
Base: a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3
Head: Exact published identity recorded in PR
Gate: GEOMETRY_SOURCE_PROVENANCE_PREPARATION_OK (local)
Tests: Source and immutable audit; 24 course + 119 assistant + 31 board tests; both course browsers; 8-scenario helper integration PASS
Failures: None on the repaired local candidate; original base/PR389 failures remain recorded
Not run: Production release, actual cabinet assignment, physical devices/pupils, external-provider review; see PR for CI
Scope deviations: None
Recommendation: Review exact-head CI and composed evidence before separate release decision
Next user decision: Separate merge/release and subsequent PR389 integration authorization
```
