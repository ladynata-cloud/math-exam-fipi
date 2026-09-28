# OGE 2027 author analogue: distribution of tasks 6–10

## Identity and permissions

- Owner-approved task: `OGE_2027_ANALOGUE_DISTRIBUTE_6_10`.
- Base/current main at preflight: `d5c9d0388ab3b22bcffec10d11504a0624e2b598` (PR #125).
- Branch: `content/oge-2027-analogue-distribute-6-10`.
- Review: **HIGH** — five trainer architectures and three Pilot A blobs.
- The owner's current request authorizes implementation, commits, push and a Draft PR.
- Merge, auto-merge and deploy are not authorized. No external AI review.
- Source: [/trainers/oge-2027-analogue-1.html](https://mathexam.space/trainers/oge-2027-analogue-1.html), published by PR #124, merge `7ebbd328d7b59b691eb50d01324d4c438aa8404c`.
- Source blob: `9c9d856c716996e4285d11079edf4b25b5eb00aa`; SHA-256 `0dc6d63c073bd27d12a6bae2debc562765b0e12c4f16df77c7eec0e9aac3ed62`.
- PROJECT_STATUS is older than the verified PR #125 production evidence. No status-only update is included. ADR 0001 remains Proposed and grants no architectural authority.

## Goal and scope

Make the five published author tasks selectable in their existing thematic trainers without changing old tasks, their defaults or the published 25-task source. The PDF is not an input to this task.

The exact full PR scope is:

1. `trainers/oge-task6-fractions.html`
2. `trainers/oge-task7-number-line.html`
3. `trainers/oge-task8-powers-roots.html`
4. `trainers/oge-task9-equations.html`
5. `trainers/oge-task10-probability.html`
6. `tools/oge-2027-analogue-distribute-6-10.test.mjs`
7. `tools/oge-2027-analogue-distribute-6-10.browser.mjs`
8. `docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_6_10.md`
9. `tools/oge-2027-analogue-1.test.mjs`
10. `tools/trainer-inventory/test/inventory.test.mjs`
11. `docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md`

No course, sitemap, catalog, homepage, manifest, board/server/runtime, package, workflow, deploy or other trainer changes. Historical PR #124/#125 scope lists remain exact immutable snapshots; this task has a separate eleven-path fixture with missing, extra, substitution, duplicate and cross-task negative vectors. Other assertions in those files remain unchanged, apart from the expressly approved Pilot A rows 6/8/9.

## Coverage and dedup audit before implementation

Comparison includes normalized mathematical data, statement meaning, answer type and visual/choice semantics. A shared answer alone is not an exact match.

| Task | Existing canonical bank | Exact/normalized match | Analog evidence | Status and action | Stable local/source ID |
|---|---|---|---|---|---|
| 6 | 174 records | none | Existing decimal-product method; no `4,8 · 2,7` or value 12.96 | `MISSING_APPENDED`; one record, total 175 | `oge2027-analogue-1-task-06` |
| 7 | 142 records, A35/B23/C78/L6 | none | √50 occurs as a distractor in `m100_66`/`m100_70`; those single-point problems have different correct roots and are not this four-point task | `MISSING_APPENDED`; one record, total 143 | `oge2027-analogue-1-task-07` |
| 8 | 160 records | none | `18.5` also answers 81 but is `(7^4 · 9^6) / 63^4`; other equal answers do not match the expression | `MISSING_APPENDED`; one record, total 161 | `oge2027-analogue-1-task-08` |
| 9 | 135 records | none | `pf-10` answers −7 but is `x/6 + x/12 + x = −35/4`; existing two-bracket LB records use different coefficients | `MISSING_APPENDED`; one record, total 136 | `oge2027-analogue-1-task-09` |
| 10 | seven generators and seven fixed mini examples | none | `gen102` uses two-color totals 10/20/25/40/50; no 250-marker remainder problem | `MISSING_APPENDED`; one fixed author record after legacy content | `oge2027-analogue-1-task-10` |

No exact-existing aliases or format mismatches were found. All five additions fit local architectures; no global schema or runtime change is needed. Re-running the audit identifies the single existing source mapping instead of adding another record.

## Independent mathematics and answer types

- 6: `(48/10) × (27/10) = 1296/100 = 324/25 = 12.96`. Numeric; comma, dot and supported exact fraction accepted.
- 7: `7² = 49 < 50 < 50.41 = 7.1²`. B is √50 between 7 and 7.1; A=6.6, C=7.45, D=7.8. Exam answer is choice **2**, not a decimal approximation. Ticks are 6/7/8. Custom steps avoid an ambiguous midpoint test.
- 8: `90^5 = 9^5 × 10^5`; quotient `9^(7−5) × 10^(5−5) = 81`. Exact integer arithmetic.
- 9: `5x+20−3x+6=12`, `2x+26=12`, `2x=−14`, `x=−7`. Existing five-step LB format is used.
- 10: remainder `250−35−45−50=120`; black `120/2=60`; favorable `35+60=95`; `95/250=19/50=0.38`. Numeric probability, not a choice digit.

## Preservation and provenance

The full runtime banks include appended records; tests compare every old record with exact-Git base data in the same order. Task 6 keeps its historical 174-record literal byte-identical and appends explicitly, retaining its legacy cohorts 174/81/21. Task 10 preserves its generators and examples rather than replacing random tasks. Legacy quiz pools and default modes remain unchanged.

Each trainer has one author cohort and one local mapping with `sourceKind=author-analogue`, `variantId=oge-2027-analogue-1`, the stable source ID and `MISSING_APPENDED` status. Label: **Авторский аналог ОГЭ-2027 · Вариант 1**. Disclaimer: **Авторский материал MathExam. Не является официальным материалом ФИПИ.**

Direct links use `?task=<stable-source-ID>`. Unknown or repeated task parameters keep the legacy default. Author progress is isolated; help/reveal cannot become independent after rerender, repeated checks do not multiply credit, and unrelated storage is preserved. No shared storage schema is introduced.

## Gates and historical baseline

Required on committed head and its clean virtual merge with current main: focused Node, five trainers × desktop/390/360/actual board manual iframe/offline file browser checks, immutable source tests, available target self-tests, inventory unit/integration and CLI, board regression, independent mathematics, exact Git Pilot hashes, exact eleven-file scope, diff and static/security checks.

The pristine exact-Git base publication baseline is 18 PASS / 2 FAIL / 0 skipped. Known failures are:

- `board quick-select has exactly four iframe-only entries and preserves the baseline`: expected 28, actual 32.
- `publication artifacts contain no basename authorization or unexpected child manifest record`: expected empty string, actual `board-server/index.js` and `board-server/trainer-registry.js` separated by a newline.

The affected historical task-6 focused suite has 15 PASS / 1 FAIL / 0 skipped on this base: `only the six approved paths differ from the approved base`, expected true, actual false, first out-of-scope path `docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_1_5.md`. Its unchanged assertions must produce the identical failure on the virtual merge. No tests are weakened, removed or skipped. CRLF copies are not authoritative baselines.

## Risk, review and rollback

Primary risks: accidental old-bank mutation, mixing choice and numeric answers, help/credit leakage across filters, narrow-screen SVG layout and stale Pilot hashes. Focused tests and internal code review cover these. The owner excludes Claude and other external AI review; no external approval is claimed.

Rollback is a normal revert of this task's commit. No data migration, deployment or destructive Git operation is required. Future tasks **11–14** are deferred and are not started in this run.

## Execution record

Final committed-head, virtual-merge and Draft PR evidence is reported in the PR and handoff. A marker in this document is a gate name, not an assertion that an unrun gate passed.

- Browser gate: `OGE_2027_ANALOGUE_6_10_BROWSER_OK`.
- Complete gate: `OGE_2027_ANALOGUE_DISTRIBUTE_6_10_GATE_OK`.
- Draft handoff: `OGE_2027_ANALOGUE_DISTRIBUTE_6_10_DRAFT_READY`.

## PR #126 owner-review remediation: honest repeat labels

Owner-approved task `PR126_REPEAT_LABEL_REMEDIATION` continues this existing
Draft PR and branch. The finding was reproduced on head
`d2b936d515cebcb65246a8a8f86654d1904894c1`, tree
`542ce764aad09febfe86af04e9b079dd7b0970ed`, with unchanged main
`d5c9d0388ab3b22bcffec10d11504a0624e2b598`.

In tasks 7 and 8, the old **Начать заново** button recreated the card while
retaining author help/reveal history, status and earned credit. Its label
incorrectly implied a fresh attempt with no history. The replacement label is
**Повторить задачу**, with this visible explanation beside the author status:

> Поля очищаются, но результат и история помощи сохраняются до обновления страницы.

The existing handlers remain unchanged. Repeating clears inputs, choices,
feedback and open steps so the task can be solved again. It preserves earned
credit and all help/reveal provenance; it neither reduces the score nor grants
additional independent credit. A shown or assisted attempt cannot become an
independent result through this button. Reload continues to clear session-only
author progress. Controls and behavior in tasks 6, 9 and 10 are unchanged.

The remediation changes exactly six existing full-PR paths:

1. `trainers/oge-task7-number-line.html`
2. `trainers/oge-task8-powers-roots.html`
3. `tools/oge-2027-analogue-distribute-6-10.browser.mjs`
4. `docs/tasks/OGE_2027_ANALOGUE_DISTRIBUTE_6_10.md`
5. `tools/trainer-inventory/test/inventory.test.mjs`
6. `docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md`

The full PR still has its exact eleven-path scope. Task data, mathematics,
SVG/data, old records, IDs, order, answers, solutions and defaults are preserved.
Only Pilot A row 8 changes because its HTML blob changes; rows 6, 9 and 20 stay
fixed, and hash-basis history receives one appended change record.

The browser gate explicitly tests independent/reveal repeat cases for task 7
and independent/hint/reveal repeat cases for task 8 on all five surfaces. It
checks cleared controls, unchanged credit/status/counters, visible explanation,
reload behavior, 44px controls, keyboard focus, overflow, storage and errors.
Source assertions reject the old label in these author controls. Final exact
head/tree, gate counts, fresh virtual merge and task-8 Git-object evidence are
recorded in the PR body and handoff after execution.

One ordinary remediation commit and push are authorized. PR #126 remains
Draft; merge/deploy and tasks 11–14 remain unauthorized. Rollback is a normal
revert of that remediation commit. Review status:
`PENDING_OWNER_REVIEW_AFTER_REPEAT_LABEL_FIX`.

## Current-main readiness update (2026-09-25)

The owner's current two-stage request authorizes updating this existing branch
against current main, resolving actual conflicts, rerunning all gates, and
marking PR #126 ready for review only after those gates pass. Stage 11–14 is a
separate branch and Draft PR, permitted only after this readiness update is
complete. These permissions supersede the earlier run-specific deferral above.
Merge into main, auto-merge and deployment remain unauthorized.

The verified main is `f1eb11261a32dd30afb614bc563975d1d9865e7d`.
Concurrent changes are PR #127 (planimetry best-result correction) and PR #128
(profile EGE course update). The ordinary merge into the task branch preserves
both. Its only content conflicts are in the source-page and inventory test
scope regions. Their resolution keeps main's closed PR #125 snapshot and this
PR's separate exact eleven-file gate. Historical allowlists are unchanged;
only the active PR #126 base moves to current main. No trainer HTML conflicts
occurred, and no profile EGE, shared navigation, board or deployment edits are
part of this update.

Browser regression adds actual clicks on task 9's answer and step-check
buttons while retaining keyboard checks. All actionability, assistance,
repeat-credit, storage and error assertions remain required. Final counts,
baseline comparisons and fresh virtual-merge identity are recorded in the PR
handoff after execution; this paragraph does not claim an unrun gate passed.
