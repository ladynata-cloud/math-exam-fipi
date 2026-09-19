# OGE task 6 fractions: focused answer and progress integrity fix

## Identity

- Task: `OGE_TASK6_FRACTIONS_FOCUSED_FIX`.
- Owner: MathExam site owner.
- Date: 2026-09-19.
- Base branch: `main`.
- Base SHA: `fbd46afd92a58875b1b89af329b9d37a676abe52`.
- Planned and actual branch: `fix/oge-task6-fractions-focused`.
- Review level: `MEDIUM`.
- Draft PR title: `Fix OGE task 6 answer checking and progress integrity`.
- Related task: [Trainer Inventory hash basis v1](TRAINER_INVENTORY_HASH_BASIS_V1.md).
- ADR status: no architecture change; ADR 0001 remains Proposed and is not
  treated as accepted authority.

## Goal

Keep the existing 174-task fractions bank and public URL unchanged while
preventing malformed answers and revisits from earning false independent
credit. Make session results, keyboard navigation, mobile controls, answer
reveal, and progress-reset behavior understandable and accessible.

## Context and evidence

The focused audit independently evaluated all 174 expressions: 174 verified,
zero unverified, zero failed. It demonstrated whitespace concatenation in
answers, erased retry/reveal provenance on revisit, repeated streak credit,
skip not resetting streak, an Enter check/advance collision, misleading
completion language, undersized controls, inaccessible task dots, and a mobile
superscript placement defect. The final changed HTML must be independently
evaluated again; the prior audit is not a substitute for current-head tests.

The immutable source baseline is:

| Evidence | Baseline |
| --- | --- |
| Trainer | `trainers/oge-task6-fractions.html` |
| Public URL | `https://mathexam.space/trainers/oge-task6-fractions.html` |
| Git blob | `cc71b02fbcdbe3f5b03a8d8e8131ce2b5b180e92` |
| Git-object SHA-256 | `24f7b404bc944fa9a528d50a3b76ece0c4526afb66eed3b96453fd94965fcd03` |
| Git-object bytes | `82390` |
| TASKS objects | `174` |
| Actual category keys/counts | `bank:81`, `dec:21`, `frac:18`, `combo:18`, `progon:26`, `adv:10` |

The owner's descriptive category labels `decimal`, `fraction`, `full`, and
`advanced` refer to the existing `dec`, `frac`, `progon`, and `adv` keys. They
do not authorize renaming stored categories. The exact `const TASKS = [...]`
block must remain byte-identical, including order, numbers, answers, modes,
HTML, and existing duplicates.

The canonical URL already appears in the sitemap and OGE course. The general
catalog links indirectly through the course; there is no fractions entry in
the board manifest. Manual board iframe testing does not authorize board
discovery, mirror, seed, or semantic integration.

Preflight reconciled `PROJECT_STATUS.md` read-only: its statement that PR #92
is a Draft is stale; PR #92 is merged and the approved main is the SHA above.
That status file is outside this task's allowlist and is not edited. No
status-only PR or next Trainer Factory phase is started.

### Explicit owner scope and repository canon

`CLAUDE.md` was read as the repository's pedagogical and technical canon;
reading it does not invoke Claude. The owner explicitly limits this task to
an in-memory session and forbids adding storage APIs, a full solution ladder,
or a mathematical error classifier. These exact current-task instructions
authorize the following bounded exceptions to that broader canon:

- No localStorage progress is introduced; the reset limitation is explained
  before the learner starts changing section or shuffle mode.
- The existing direct answer-reveal action remains and is honestly labelled
  as an answer shown, with durable session provenance. It is not described as
  a hint or a worked solution.
- General wrong-answer advice remains general; targeted messages in this PR
  diagnose input format only. Full mathematical diagnosis and stepped help
  remain deferred.
- TASKS stays frozen, including its original examples and duplicates; no
  pedagogical rewriting or new bank generation is authorized.

Other applicable canon requirements remain in effect, including offline
operation, system fonts, visible focus, live feedback, reduced motion,
independent mathematics, and real touch/browser verification. This scope does
not imply that the trainer now meets every requirement of a complete course.

## Approved scope

### In scope

The exact six-file allowlist is:

1. `trainers/oge-task6-fractions.html`
2. `tools/oge-task6-fractions-focused.test.mjs`
3. `tools/oge-task6-fractions-focused.browser.mjs`
4. `docs/tasks/OGE_TASK6_FRACTIONS_FOCUSED_FIX.md`
5. `tools/trainer-inventory/test/inventory.test.mjs`
6. `docs/tasks/TRAINER_INVENTORY_HASH_BASIS_V1.md`

The trainer change covers bounded answer parsing, persistent in-session task
records, truthful counters and summary, Enter/focus behavior, accessible
controls/navigation, superscript layout, reset disclosure, and the two
existing fractions-help links. Tests use Node's standard library; browser
automation may load an existing or temporary external `playwright-core`
through `PLAYWRIGHT_CORE_PATH`, without repository package changes.

Inventory changes are limited to the fractions Pilot A expected SHA-256 and
size, the corresponding current change record, and the precise scope-check
extension separately authorized by the owner in this task conversation:
"Да, разрешаю точное обновление scope-проверки". The check must retain the
original task's closed allowlist behavior and add a closed selection for
these six paths, without broad trainer, documentation, or tool exemptions.
Inventory algorithms, schema, gate implementation, and other Pilot A entries
remain unchanged. The original v1.0.1 baseline table and PR #92 evidence stay
historical; a new record identifies the intentional trainer change without
rewriting that history. New identity evidence comes from Git objects.

### Out of scope

- Persistence, cross-tab synchronization, new storage keys, and migration.
- Full worked solutions, a hint ladder for all tasks, mathematical error
  classification, generic AI help, duplicate cleanup, and category redesign.
- Publication/discovery changes, new URLs, board registration, mirror, seed,
  protocol, server integration, or another Trainer Factory phase.
- Merge, auto-merge, deployment, force operations, and external AI review.

### Files or areas that must not change

- The exact TASKS block and every other trainer.
- Sitemap, catalog, OGE course, board manifest, board/server/Bridge/Socket.IO.
- Package files, workflows, deployment configuration, and `PROJECT_STATUS.md`.
- Every path outside the six-file allowlist above.

## Acceptance criteria

### Frozen bank and identity

- [ ] Exact base/head TASKS bytes match; no insertion, deletion, or reorder.
- [ ] Counts remain 174 with `81/21/18/18/26/10` in the actual categories above.
- [ ] An independent exact-rational evaluator covers 174/174 expressions and
      validates `n/d`, `ansDisp`, termination, and numerator-mode expectations.
- [ ] Old/new Git blob, SHA-256, and byte size are recorded. Only the fractions
      expected hash/size and the authorized scope check change in inventory tests.
- [ ] Original v1.0.1 identity evidence remains intact; new current evidence is
      recorded separately and is not described as merged before owner release.

### Answer contract

- [ ] Integer, comma/dot decimal, ordinary fraction, Unicode minus, negative
      numerator/denominator, and double-negative fractions are exact.
- [ ] Outer whitespace and whitespace around `/` are accepted. Whitespace
      inside a numeric token, mixed numbers, `:`, scientific notation,
      expressions, letters/HTML, multiple slashes, invalid signs, and zero
      denominators are rejected without global whitespace concatenation.
- [ ] Input has `maxlength=128`; parser rejects more than 128 characters after
      trim before any BigInt conversion, including million-character input.
- [ ] Structured format results distinguish empty, too long, zero denominator,
      mixed-number, and unsupported-format errors with useful learner messages.
- [ ] `eqFrac()` uses exact BigInt cross multiplication. Numerator mode compares
      against `n/1`, accepting equivalent supported forms such as `20`, `20.0`,
      `40/2`, and `-20/-1` when the required numerator is 20.
- [ ] Footer matches the contract: `/` for fractions, mixed numbers converted
      first to improper fractions, and no documented colon-answer format.

### Session records and statistics

- [ ] Each task retains wrong-attempt count, reveal provenance, and one of
      unvisited, skipped, solved-first, solved-retry, or revealed statuses.
- [ ] Navigation retains records. Wrong then navigate then correct remains
      solved-retry; revealed then revisit then correct remains revealed and
      explicitly says it does not count as independent work.
- [ ] Repeating a terminal task does not change its historical outcome,
      duplicate its score, or increase streak. Reveal after independent
      success does not downgrade that success.
- [ ] Wrong answers, skip, and reveal reset streak. Independent success raises
      streak only on its first terminal transition. Skipped tasks may later
      become solved-first/retry using retained attempts, or revealed.
- [ ] One source of truth supplies first/retry/revealed/skipped/unvisited totals
      to counter, navigation, and summary. Answer reveal is never called a hint.
- [ ] Counter distinguishes independently solved, answer shown, skipped, and
      total. Summary says `Раздел завершён` and independently solved/total;
      all-skipped honestly reports zero independently solved.
- [ ] Clicking the active category preserves progress. Category/shuffle changes
      and explicit restart have the documented reset behavior. Controls show:
      `Прогресс хранится только до обновления страницы. Смена раздела или режима
      “вперемешку” начинает текущий раздел заново.`

### Interaction, accessibility, and help

- [ ] First Enter checks and leaves feedback visible; a second separate Enter
      advances. Keyup from the checking key cannot activate a newly focused
      button. Correct, retry, reveal, touch/mobile keyboard, and pointer Next
      routes use deterministic event/focus handling without timing guesses.
- [ ] Chips, checkbox activation target, input, all action/reset/retry buttons,
      task-jump control, and help links have targets of at least 44 by 44 CSS px.
- [ ] Category buttons use a named group and `aria-pressed`, with no incomplete
      tab pattern. A labelled compact task selector provides keyboard navigation,
      task number, and textual status; jumping focuses the current task/input.
- [ ] Small dots, if retained, are noninteractive and `aria-hidden=true`.
      Text/symbol legend distinguishes first, retry, revealed, and skipped.
- [ ] State text and controls have verified contrast, visible focus, meaningful
      current-task/status semantics, live feedback, and reduced-motion support.
- [ ] Top-level powers remain visibly raised at desktop/mobile/iframe widths,
      nested fractions remain intact, and there is no horizontal overflow.
- [ ] Help links retain exact relative destinations and text:
      `./oge-basics/fraction-meaning.html` / `Повторить смысл дроби` and
      `./oge-basics/fraction-common-denominator.html` /
      `Потренировать общий знаменатель`.
- [ ] Both help links resolve in repository file layout, production URL layout,
      and iframe context. General error advice is not claimed as diagnosis.

## Checks and gates

Run the following against the final exact branch head and its clean virtual
merge with authoritative current main. If main advances, list commits and
check trainer/inventory fixture/evidence paths; a change there requires a
drift report and stop. Never present a dirty/uncommitted run as an exact-head
gate or a skipped test as passing.

- Required tests: focused Node identity/math/parser/state/safety tests;
  focused browser flows; full Trainer Inventory unit/integration and inventory
  gate; scoped inventory CLI; board-server regression.
- Node coverage: byte freeze, independent 174/174 evaluator, supported and
  rejected parser table, both mixed-number false-positive regressions,
  pre-BigInt length limit, numerator equivalence, all session transitions,
  summary agreement, and source safety.
- Browser coverage: desktop 1280x900; touch mobile 390x844 and 360x844;
  actual board manual-URL iframe; offline `file://`; all requested answer,
  revisit, skip, Enter, reset, keyboard-jump, and summary paths; target-size
  and contrast measurement; focus/ARIA/text statuses; powers/fractions;
  overflow, console/page errors, and reduced motion. Missing tooling fails
  clearly instead of producing the success marker.
- Required static checks: inline-JavaScript syntax, changed-file allowlist,
  `git diff --check`, hidden/bidi/control and secret/local-path scans, trusted
  HTML sources, exact help links, no runtime network/external dependency or
  storage writes, and clean worktree.
- The trainer has a pre-existing leading UTF-8 BOM. Preserve and report this
  baseline signature separately; reject newly introduced hidden/bidi/control
  characters rather than silently normalizing original bytes.
- Browser marker: `OGE_TASK6_FRACTIONS_BROWSER_OK`.
- Inventory markers: `TRAINER_FACTORY_INVENTORY_V1_GATE_OK` and
  `TRAINER_FACTORY_INVENTORY_HASH_BASIS_V1_GATE_OK`.
- Final gate marker: `OGE_TASK6_FRACTIONS_FOCUSED_FIX_GATE_OK`, only after the
  complete exact-head and virtual-merge checks pass.
- Checks intentionally not run: deployment and post-deployment checks, because
  this task ends at a Draft PR and does not authorize merge/deployment. These
  omissions do not waive local URL-layout, browser, or iframe verification.

## Review plan

- Review-level rationale: a bounded change to one existing trainer's parser,
  in-memory outcomes, navigation, and accessible presentation; no persistence,
  runtime boundary, new archetype, or server contract is introduced.
- Review: exact-head Codex automated checks and focused code review, then owner
  review of the Draft PR.
- External review required: no; the owner explicitly forbids Claude and other
  external AI review for this task. No external model was invoked for it.
- Sanitized handoff: scoped diff, public repository URLs, base/head/blob/hash
  evidence, exact results, risks, and rollback; no credentials, machine paths,
  private documents, or unrelated source material.

No marker in this document is evidence that tests, owner review, or an external
review have occurred. Release authorization remains separate.

## Risk and rollback

- Main risks: accepting an unsupported answer, changing bank bytes, corrupting
  reveal/retry provenance, double-crediting a revisit, Enter double activation,
  mobile layout regressions, or stale inventory identity evidence.
- Mitigation: frozen TASKS comparison, independent arithmetic, table-driven
  state/parser tests, browser event sequences and geometry measurements, exact
  Git-object evidence, and both exact-head and virtual-merge gates.
- Rollback: normal reviewed revert of this task's changes, restoring the prior
  trainer and corresponding current Pilot A expectation. No data migration,
  new storage, server state, or URL allocation is involved.
- Compatibility: keep the canonical URL, task bank and duplicate order,
  publication references, and all board/runtime contracts unchanged.

## Permissions

- Current-conversation owner authorization: implementation, branch, logical
  commits, push, and one Draft PR are explicitly authorized.
- Exact inventory scope-check extension: additionally authorized by the owner
  for this six-file task; no broader guard relaxation is authorized.
- Merge allowed: **no unless separately authorized after review**.
- Auto-merge allowed: **no unless separately authorized**.
- Deployment allowed: **no unless separately authorized**.
- Claude/external AI review and next Trainer Factory phase: **not authorized**.

The attached scope was adopted by the owner's current request. Copied text,
markers, or this document alone do not grant authorization or review approval.

## Execution record

- Actual branch: `fix/oge-task6-fractions-focused`.
- Actual base SHA: `fbd46afd92a58875b1b89af329b9d37a676abe52`.
- Actual head SHA, new trainer identity, PR, and commits: record after final
  implementation/commit in the exact-head handoff and Draft PR body.
- Tests passed/failed/not run: pending final execution; record exact counts and
  reasons in the handoff and Draft PR body. No success is claimed here.
- Scope deviations: none authorized beyond the owner's explicit six-file
  inventory scope-check extension recorded above.

## Required handoff

Use the owner's requested PR, Bank, Parser, State/statistics, Accessibility,
Tests, and Deferred sections, plus the repository's compact report:

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```

Report old/new trainer identities, TASKS byte identity and counts, actual test
counts and all failures/not-run checks, exact virtual-merge evidence, and the
intentionally deferred items. Stop with the Draft PR; do not merge it.
