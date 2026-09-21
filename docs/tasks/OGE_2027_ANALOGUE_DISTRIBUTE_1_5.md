# OGE 2027 author analogue: distribute tasks 1–5

## Identity and authorization

- Task: OGE_2027_ANALOGUE_DISTRIBUTE_1_5.
- Owner: MathExam repository owner; explicit START and six-file scope approval in the task conversation.
- Date: 2026-09-21.
- Base/current main: `7ebbd328d7b59b691eb50d01324d4c438aa8404c`.
- Branch: `content/oge-2027-analogue-distribute-1-5`.
- Review level: MEDIUM (new data set and a narrow radius-comparison rendering branch).
- Source: [published author variant](https://mathexam.space/trainers/oge-2027-analogue-1.html), released by PR #124 at the base commit above.
- Target: `trainers/oge-1-5-trainers/practice-1-5-tires.html`.
- ADR 0001 remains Proposed; this task changes no architecture or runtime authority.

## Goal and context

Append one coherent author tyre set to the existing twenty-variant trainer. The
published source has 25 stable tasks and `sourceKind: author-analogue`. Its
69,217 production bytes matched the exact Git source during preflight (SHA-256
`0dc6d63c073bd27d12a6bae2debc562765b0e12c4f16df77c7eec0e9aac3ed62`).
Production evidence, rather than an older status-document summary, establishes
PR #124 as released. No separate status-document change is needed in this batch.

The source PDF is not used for publishing data. The new record uses only the
already published MathExam author dataset. It is labelled
“Авторский аналог ОГЭ-2027 · Вариант 1” with the disclaimer
“Авторский комплект MathExam. Не является официальным материалом ФИПИ.”

## Exact approved scope

1. `trainers/oge-1-5-trainers/practice-1-5-tires.html`
2. `tools/oge-2027-analogue-distribute-1-5.test.mjs`
3. `tools/oge-2027-analogue-distribute-1-5.browser.mjs`
4. `docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_1_5.md`
5. `tools/oge-2027-analogue-1.test.mjs`
6. `tools/trainer-inventory/test/inventory.test.mjs`

The final two paths are authorized solely for scope fixtures, exact task
allowlists and negative scope vectors. Historical allowlists are unchanged and
checked against their closed Git snapshots; the current task independently
requires all six exact paths. Missing, additional, substituted and duplicate
paths must fail. All other source mathematics, originality, provenance and
publication assertions remain unchanged.

The target is not in Pilot A. Pilot A hashes/sizes, hash-basis documentation,
inventory logic/schema/CLI/gate, source HTML, other banks, course, sitemap,
catalog, homepage, board/server/Bridge, manifests, packages and workflows are
outside scope and remain unchanged.

## Coverage and deduplication

Preflight status: **PARTIAL_OVERLAP**. There is no exact or normalized complete
coherent set, no matching factory, no matching full allowed table, and no
pre-existing `oge-2027-analogue-1` ID among the twenty old records.

- `1F235A` shares the numeric answers 205 and 102.5; its sidewall question uses
  205/50 R18, mathematically the same height but a different wheel.
- `DB5DF7` shares seven of eight allowed markings, but has a different factory,
  table, questions and answer sequence.
- `0ACF28`, `3482E5` and `6312CF` share individual permitted markings.

Normalization includes factory, the full allowed table, five ordered question
meanings, units, rounding and answers. Individual coincidences do not identify a
complete coherent set. Old records are retained. The new test checks exactly one
appended record and one selector entry, preventing duplicate publication.

## Frozen set and independent mathematics

Stable ID: `oge-2027-analogue-1`. Source mapping in order:
`oge2027-analogue-1-task-01` through `oge2027-analogue-1-task-05`.
Factory: **185/65 R14**.

| Width, mm | R14 | R15 | R16 |
| --- | --- | --- | --- |
| 175 | 175/70 | 175/65 | — |
| 185 | 185/65 | 185/60 | — |
| 195 | — | 195/60 | 195/55 |
| 205 | — | 205/55 | 205/50 |

1. Largest allowed width for R15: max(175,185,195,205) = **205 mm**.
2. Sidewall 205/50 R16: 205 × 50 / 100 = **102.5 mm**.
3. Factory diameter: 14 × 25.4 + 2 × 185 × 65 / 100 = **596.1 mm**.
4. Radius difference, 195/60 R15 versus 185/60 R15:
   (615 − 603) / 2 = 195 × 0.60 − 185 × 0.60 = **6 mm**.
5. New diameter: 15 × 25.4 + 2 × 195 × 0.60 = **615 mm**.
   Circumference ratio equals diameter ratio; the relative increase is
   (615 − 596.1) / 596.1 × 100 = 18900/5961 ≈ 3.170608958%,
   rounded to one decimal: **3.2%**.

Independent result: 5 verified, 0 failed, 0 unverified.

## Integration and preservation

The original twenty-record `VARIANTS` literal and embedded PNG bytes are
preserved. One separate author record is appended. Optional `t4Base` and
`t4Measure` metadata introduce the radius comparison only for the new record;
old defaults still compare diameters against the factory. Author diagrams use
the existing code-generated wheel drawing, without displaying legacy raster
images. Existing legacy conditions, solutions and diagrams are regression
compared with exact base bytes and rendered output.

The existing seven-step pedagogical flow, modes, checking, hints, teacher
solutions and reset behavior remain. The new set has its own
`tiresTrainerV2.byCode['oge-2027-analogue-1']` component. Opening, solving and
resetting it preserve old `byCode` entries and unrelated storage keys. Legacy
selection/reload behavior remains as in the base (selected progress resets).
The existing course-progress aggregate continues to update only its own
`practiceTiresTrainer` member.

Deep link: `practice-1-5-tires.html?variant=oge-2027-analogue-1`.
Absent or invalid variant parameters use the previous saved/default selection.
The new author label, 44px controls, keyboard focus and narrow-screen layout
use the existing visual palette. Author-only layout corrections address the
old 34px arrows, narrow reference tables and sticky navigation interception.

## Checks and gates

Required on exact committed head and a clean virtual merge with current main:

- New focused Node suite: independent mathematics, source identity, coherent
  dedup, complete old-variant preservation, selector/deep link and storage.
- New browser suite with external cached Playwright and system Edge, no added
  dependency: 1280×900, 390×844, 360×844, actual board manual iframe and offline
  file; five correct/wrong answers, hints/solutions, reset/reload, legacy smoke,
  storage isolation, keyboard/focus, 44px controls, overflow and error collection.
- Source focused suite, with all non-scope assertions unchanged.
- Trainer Inventory full unit/integration suite and scoped CLI; target outside
  Pilot A, no inventory data migration.
- Board regression and historical publication tests on pristine exact-Git base
  and virtual merge; no new or changed historical failure is acceptable.
- Exact six-file scope and negative seventh-file vector, diff whitespace,
  hidden/bidi/control, secret/local-path scans and clean worktree.

Browser marker: `OGE_2027_ANALOGUE_TIRES_BROWSER_OK`.
Final gate marker: `OGE_2027_ANALOGUE_DISTRIBUTE_1_5_GATE_OK`.
Actual final-head results and SHAs belong in the Draft PR handoff, avoiding a
self-referential commit SHA in this task document. No final PASS is implied by
listing required markers here.

## Historical baseline

The preceding release established an exact-Git-byte baseline of 18 PASS / 2 FAIL
in the three historical publication suites, with 0 skipped:

- `board quick-select has exactly four iframe-only entries and preserves the baseline`:
  expected 28, actual 32.
- `publication artifacts contain no basename authorization or unexpected child manifest record`:
  expected empty string, actual `board-server/index.js` followed by
  `board-server/trainer-registry.js` on a new line.

Reproduce this baseline for this batch and compare it with the virtual merge.
CRLF-converted copies are not authoritative. No expected values or functional
assertions are changed to obtain a passing result.

## Risk, review and rollback

The main risk is accidentally applying a radius question to a legacy diameter
variant or mixing stored progress. Base comparisons and real browser workflows
cover these boundaries. Rollback is a normal revert of this one bounded PR.
No storage namespace migration is introduced.

No Claude or external AI review: explicitly prohibited by the owner. Branch,
local commits, push and Draft PR are authorized. Merge, auto-merge and deploy
are not authorized. Draft title:
**Add OGE 2027 author-analogue tyre set to tasks 1–5 bank**.

## Next

The next bounded batch is tasks 6–10. It is explicitly deferred and must not be
started in this run. Trainer Factory implementation is outside this task.
