# H01 — Profile numeric domain integrity

## Identity

- Task: `PROFILE_NUMERIC_DOMAIN_INTEGRITY_20261114` (H01).
- Owner: MathExam owner.
- Date: 2026-11-14.
- Base branch: `main`.
- Base SHA: `0a375390859437359427aaf1befac3d12754e837`.
- Branch: `fix/profile-numeric-domain-integrity-20261114`.
- Review level: **HIGH**.
- Owner authorization: explicit `START H01 — PROFILE_NUMERIC_DOMAIN_INTEGRITY_20261114`
  in the current task conversation.
- Related ADR: no architectural change; ADR 0001 remains Proposed and advisory.

## Goal

Ученик не получает правильный числовой ответ за выражение с недопустимым
корнем, делением на нуль или недопустимым промежуточным вычислением.
Допустимые привычные дроби, π, корни, степени и неявное умножение сохраняются
в старте профиля, курсе окружности и второй части.

## Context and evidence

The authoritative GitHub main API and `git ls-remote` both confirmed the base
above before branch creation. The local main was clean and identical to it.
There are no nested `AGENTS.md` files affecting this task.

At that base the shared parser accepted:

| Input | Incorrect accepted value |
| --- | ---: |
| `sqrt(-4)^2` | 4 |
| `(sqrt(-4))^0` | 1 |
| `(1/0)^0` | 1 |

`ege-profil/start/checks.js` let the radicand consume an outside power and
checked finiteness only at the end of the expression. JavaScript can turn
`NaN ** 0` or `Infinity ** 0` into 1, hiding an invalid intermediate result.

The same parser serves START, Circle and Part Two; their existing checkers
and handlers are retained. The exact changed-file lists of PRs #547 and #598
do not contain this parser: those PRs concern three standalone bonus trainers.
Pending #601 contains a profile download package that must take this correction
from the reviewed source before its separate publication.

### Project-status reconciliation

`docs/PROJECT_STATUS.md` contains historical preparation and publication
records, including the project exam map with 20 positions. Current code and
the preceding harmonization inventory establish 42 Part Two lessons and 252
fixed conditions. The public shared parser and entry resources were compared
with this base during that inventory; selected matches do not constitute a
full production acceptance test. H01 does not correct the exam map or update
historical status entries. Those belong to the separately scoped H02.

## Approved scope

1. End an explicitly parenthesized `sqrt` argument at its matching parenthesis.
   Keep the existing shorthand grammar for unparenthesized roots.
2. Reject negative radicands, division by zero and non-finite intermediate
   arithmetic immediately, before a later operation can hide them.
3. Preserve right-associated powers, unary precedence, finite valid notation,
   and existing source-length, nesting-depth and exponent safeguards.
4. Use school real arithmetic for zero powers: reject `0^0` and zero to a
   negative power; retain zero to a positive power. Negative bases with
   non-integer exponents retain the existing unsupported/rejected behavior.
   No new notation, symbolic arithmetic, `eval`, `Function` or dependencies.
5. Add meaningful parser/wrapper and actual-form regressions for all three
   consumers. Invalid input cannot complete a task or increase independent
   credit. Keep the existing distinct format feedback in START/Circle.
6. Change only the shared-parser version token in the three public entry pages.
7. Refresh the three canonical navigator bindings through the existing tool,
   against a real reviewed source commit, in a separate receipt commit.
8. Record scoped evidence, independent HIGH review and a Draft PR.
9. Owner-approved amendment, 2026-11-15 (Asia/Novosibirsk): add only the exact
   shared-parser cache-stamp mapping in `tools/public-page-script.cjs`.
   Authorization in the current conversation: "Разрешаю включить
   `tools/public-page-script.cjs` в H01 для этой единственной строки".
10. Owner-approved fixture amendment, 2026-11-15 (Asia/Novosibirsk): append
    only the reviewed parser entry to each of the two existing runtime arrays
    in `tools/profile-journey-public-scripts.test.cjs`.
    Authorization in the current conversation: "Разрешаю включить
    `tools/profile-journey-public-scripts.test.cjs` в H01 только для этих двух
    записей в тестовых массива".

### Exact allowed paths

- `ege-profil/start/checks.js`
- `tools/profile-number-input.test.cjs`
- `tools/profile-input-ui.test.cjs`
- `tools/profile-part2-engine.test.cjs`
- `ege-profil/start/index.html` — shared-parser version token only.
- `ege-profil/circle/index.html` — shared-parser version token only.
- `ege-profil/part-two/index.html` — shared-parser version token only.
- `assets/assistant/page-rollout.json` — the three affected bindings and their
  canonical source-checkpoint receipt only.
- `docs/tasks/PROFILE_NUMERIC_DOMAIN_INTEGRITY_20261114.md`
- `tools/public-page-script.cjs` — only
  `['checks.js?v=20261114-numeric-domain', 'checks.js?v=20261101-trainer-repair'],`
  in the existing exact `cacheStamps` map; no other helper change.
- `tools/profile-journey-public-scripts.test.cjs` — append only
  `checks.js?v=20261114-numeric-domain` to `runtime` and
  `checks.js?v=20261101-trainer-repair` to `boardRuntime`; all assertions,
  helper functions and the positions of previous array entries remain unchanged.

### Exclusions and preservation

No changes to generators, answer keys, lesson/task IDs, saved-work keys or
schemas, historical progress, other pages, navigator code, board/server
contracts, authentication, dependencies/lockfiles or workflow files.
Do not regrade or erase past successes, including successes incorrectly awarded
before this correction.

Part Two's separate classification of malformed answers as mathematical errors
remains H04. Proof self-checking, two-tab persistence and the FIPI migration
remain separate tasks. This change does not update PRs #547/#598/#596/#600/#559/
#550/#601 or create new download build logic.

Nine existing board-wrapper HTML pages also load the shared file. Their
historical query tokens are outside the approved eleven-file scope and remain
unchanged. Board-contract regressions are required. Cache-busting is claimed
only for the three public entries; fresh delivery/revalidation through the
other entry points must be checked at a separately authorized release.

## Acceptance criteria

- [x] The three confirmed invalid expressions and compositions such as
  `(0/0)^0`, `(0^-1)^0`, `((-1)^0.5)^0`, overflow followed by exponent zero,
  and division by an overflowing expression are rejected.
- [x] `sqrt((-4)^2)`, `sqrt(4)^2`, `sqrt(9)+1`, nested roots, fractions,
  decimal commas, Unicode minus, `π/6`, `3/4π`, `3/(4π)` and implicit
  multiplication preserve their intended values.
- [x] `2^3^2 = 512`, `-2^2 = -4`, `2^-3 = 0.125` and the explicit zero-base
  domain policy have regression coverage.
- [x] Invalid input cannot award correctness or independent credit through
  START, Circle or Part Two handlers. Literal drafts survive the tested reload.
- [x] The 252 authored Part Two conditions and relevant START/Circle math,
  state and board-contract gates pass without changed generators or keys.
- [x] Native acceptance of the three entry forms at 320/390/1280 px checks
  invalid/valid input and reload, with screenshots and the new parser version.
- [x] The diff contains exactly the declared paths and only the permitted
  HTML token and canonical binding updates.
- [x] Independent HIGH review records the examined base/head or source tree,
  risk cases, verdict and remaining limitations.

## Checks and gates

Required focused regressions:

```sh
node tools/profile-number-input.test.cjs
node tools/profile-input-ui.test.cjs
node --test tools/profile-part2-engine.test.cjs tools/profile-part2-course.test.cjs
node --test tools/profile-part2-algebra.test.cjs tools/profile-part2-geometry.test.cjs tools/profile-part2-models.test.cjs
node --check ege-profil/start/checks.js
git diff --check
```

Run the applicable existing profile math, state, Circle and board-contract
gates defined by the affected workflows. Record native tests separately from
DOM tests, and report CI for the actual final PR head separately from local
results. Do not claim unrelated workflows passed because focused tests passed.

The native H01 cases live in the approved Part Two engine test file. The
existing profile workflow installs pinned Playwright and Chromium before
running it. Native cases are mandatory in CI, with no fallback or skip after a
browser failure. Outside CI, `H01_NATIVE_BROWSER=1` requests them explicitly;
an ordinary DOM-only invocation reports the native group as skipped.
Screenshots use the existing `/tmp/profile-part2-shots` artifact directory.
No workflow or dependency change is required.

Canonical source-binding order:

1. Review and commit the parser, regressions, entry tokens and this task record.
2. Preview and run `tools/public_navigator_bindings.py` with that full source
   SHA, this task path and exactly the three HTML paths, then `--write`.
3. Run `tools/public_navigator_bindings.test.py`,
   `node --test tools/public-navigator-preservation.test.cjs`, and
   `node tools/public-navigator-regression.cjs` with the existing navigator and
   a scratch output path. Inspect the exact receipt diff and commit it.

`tools/public_navigator_preservation.py` is an imported helper, not an executable
strict assertion gate. The `.test.cjs` command above is the actual preservation
test. This corrects the draft's command description without changing scope or
weakening any assertion.

Final gate marker: `PROFILE_NUMERIC_DOMAIN_INTEGRITY_20261114_OK` only after
all required checks and independent review have actually passed.

## Review plan

HIGH applies because one evaluator affects answers and independent-credit
outcomes across multiple learning engines. Independent technical review must
examine root grouping, power precedence/domain, nesting, overflow, valid syntax,
actual consumer behavior, scope and rollback.

No new trainer archetype or learning sequence is introduced. External provider
consultation/review is optional under the current review policy and has not
been requested. Internal independent technical review is still required.
Remote handoffs contain only minimal approved code/diff/context, with no
credentials, private learner data or machine-specific paths. If an external
review is used, record provider, PR, exact base/head, verdict and date/source.

## Risk and rollback

Risks: over-rejecting legitimate notation, wrong root/power precedence, hidden
overflow and stale cached copies. Keep finite valid controls alongside each
invalid regression. Floating-point representation and the existing answer
tolerances are unchanged; this is not a symbolic-equivalence engine.

Rollback uses an ordinary revert of this task's commits after the appropriate
owner decision. Saved data requires no migration or deletion. Do not reset,
rebase, force-push, bypass protection or weaken tests.

## Permissions

The direct user-supplied `AGENTS.md` in this conversation overrides the broader
standing release policy in the repository for this task.

- START / implementation / branch / commits / push / Draft PR: **YES**.
- Exact one-line helper amendment: **YES**, explicitly authorized by the owner
  on 2026-11-15 (Asia/Novosibirsk).
- Exact two-entry synthetic-fixture amendment: **YES**, separately authorized
  by the owner on 2026-11-15 (Asia/Novosibirsk); the task now has eleven allowed
  paths. This permission does not cover any other change in that test file.
- Merge / auto-merge / deployment: **NO**, pending separate explicit owner
  authorization.
- A future exact-base merge authorization is invalidated by remote main drift.
  Stop, inspect a read-only virtual composition, rerun applicable gates and
  obtain new owner authorization; do not repair the branch automatically.

## Execution record

- Base verified: `0a375390859437359427aaf1befac3d12754e837`.
- Branch created: `fix/profile-numeric-domain-integrity-20261114`.
- Reviewed parser/source checkpoint:
  `276851ea937eb5de1bb2437dae2f362341853e9f`, tree
  `852f208f0342f569a1666de7a6e4b503987a0fa8`, single parent the approved base.
- Separate native-test commit: `c09ab1bb8a63be56345a63001e3c6b0493fad33c`;
  independently reviewed engine-test blob
  `87fd542a1749a16804c552a8fc4d01b67a55b4f4`. No production byte changed in
  this second commit; the receipt remains bound to the reviewed HTML source.
- Source implementation: complete; explicit root arguments are bounded and
  invalid intermediate arithmetic is rejected before any later operation.
- Focused regression evidence: 38 valid and 34 invalid parser inputs pass;
  START/Circle cover six false-success compositions, reload and valid correction;
  the Part Two engine covers three actual final-form cases and numeric root lists.
  The new tests fail against the exact original parser at the approved base.
  Final local engine invocation: 15 pass, 0 fail, one explicitly skipped native
  group; the two separate number/input files also pass. Native is not counted
  as a successful local check.
- Existing local gates: 140 Part Two, 88 profile and 21 Circle Node tests pass;
  the finance oracle verifies 442 exact steps. The profile npm suite reports
  3,278 checks and 7,600 generated planimetry cases with no failures.
- Canonical binding refresh: preview and write succeeded against that reviewed
  source. Exactly three HTML hash pairs changed; all other 621 added-page rows,
  earlier receipts and unrelated manifest fields are preserved. Post-refresh
  gates pass: binding tool 5/5, strict preservation 4/4, navigator regression
  43/43.
- Initial board-contract group at `7625193a1556d26afc838773d71d4b30e2cdd800`
  after the binding refresh: **106/114 pass, 8 fail**.
  All eight actual strict array comparisons differ on exactly one parser URL
  token, with no other script difference. This supersedes the preliminary
  navigator-binding failure recorded in the source checkpoint.
- Initial required gate: **BLOCKED**. The exact mapping
  `checks.js?v=20261114-numeric-domain` to the wrappers' existing
  `checks.js?v=20261101-trainer-repair` must be reviewed in
  `tools/public-page-script.cjs`. At that checkpoint the helper was outside the
  original nine approved paths, so the proposal was left unapplied until the
  owner's explicit amendment below.
- Independent HIGH source review on 2026-11-14: PASS for the exact checkpoint
  above, by the separate `h01_review` agent. It examined grouping, power domain,
  valid syntax, consumer behavior, scope and rollback. Its additional probes
  passed 24 boundary cases and 6,000 generated fully parenthesized expressions.
  This is internal technical review, not an external-provider approval.
- Initial prospective helper-map review: technically approved, conditional on owner
  scope expansion. An isolated diagnostic made the eight unchanged original
  tests pass and rejected 136 deliberate script-contract mutations. The real
  repository helper was unchanged at that checkpoint; the diagnostic was not
  an actual gate pass.
- Native local browser: **NOT RUN**. The interactive extension/cloud browsers
  could not reach the local server, and local Chromium stopped before opening
  pages because `process_singleton_posix.cc` reported `socket() failed:
  Operation not permitted`. No native screenshots or application-console
  observations were produced by those attempts.
- Native CI at `7625193a1556d26afc838773d71d4b30e2cdd800`: **27/27 PASS**,
  522 assertions and 18 screenshots, Chromium 151.0.7922.34, with zero
  page/console/HTTP errors. The cases cover START, Circle and Part Two at
  320/390/1280 px, each checking invalid input, reload, valid root/power
  correction, credit and the actual versioned parser resource. The full Part
  Two Node stage passed 183/183 without skips; the existing browser course
  passed 126 lesson/viewport combinations and 42 completed conditions.
  Evidence: [profile CI run](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43618601061),
  artifact `profile-part-two-viewports` ID `14123076270`; downloaded ZIP SHA-256
  `233d9240e79c0f0f98fea14419919ce270f6a50ed15fc23a11231f2e96671e3b`
  matches GitHub. All 11 initial workflows finished: eight success and three
  failure, attributable only to the eight cache-stamp assertions in four jobs.
- Independent review of the native test code: PASS for the exact blob above.
  A separate probe confirmed `CI=1` and `H01_NATIVE_BROWSER=0` still fail on a
  missing browser dependency, with zero skips. This proves mandatory CI
  execution, not successful browser acceptance.
- Final immutable receipt/head review and CI verdicts are recorded against the
  containing Draft PR's head; they do not grant merge or deployment permission.
- Scope deviations: none.
- Merge / publication: not performed.

### Owner-authorized helper amendment — 2026-11-15

- Continuing the same branch and [Draft PR #603](https://github.com/ladynata-cloud/math-exam-fipi/pull/603),
  not a separate task or PR. Authoritative main and remote/local task head
  were rechecked at 2026-11-14 23:02 UTC (2026-11-15 06:02 Asia/Novosibirsk):
  main remained `0a375390859437359427aaf1befac3d12754e837`, task head remained
  `7625193a1556d26afc838773d71d4b30e2cdd800`, with a clean worktree.
- Applied exactly the authorized cache-stamp pair before the existing
  `state.js` entry. Helper blob:
  `089f96ee5b316382552a39165a7a3a73d00d2317`.
- Parser, three HTML entries, three H01 regression files and canonical
  manifest remain byte-identical to the previously reviewed head. No binding
  refresh is needed because none of the bound HTML source changed.
- Independent amendment review: the actual eight formerly failing strict
  tests pass against the amended repository helper without an overlay;
  zero failures or skips. Exact URL, count, order and public-module assertions
  are preserved. The previous 136 negative diagnostic controls remain
  applicable to this identical reviewed mapping.
- Full local amendment gates: the identical board-contract command now passes
  **114/114**, with zero failures or skips. Navigator gates pass 5/5, 4/4 and
  43/43; number-input passes 38 valid and 34 invalid cases, and actual-input DOM
  regressions pass all six invalid-domain/reload/correction scenarios. The
  command array is unchanged from the original failing run and all tested
  input hashes remained stable. Local runtime: Node 24.22.1, jsdom 24.1.3.
- The amendment was committed as
  `d3c87239dce4b5b77c988065c1055a08122499e9`. Its exact-head CI completed:
  **10 workflows SUCCESS / 1 FAILURE**, 20 successful jobs, one failed job,
  and one expected production-only skip. All four formerly failing board jobs
  passed, including their native synchronization stages. Native H01 passed
  27/27 with 522 assertions and 18 screenshots; Part Two passed 183/183 and
  the existing browser course passed 126 screens / 42 completed conditions.
  The profile npm regression passed 3,278 checks and 7,600 planimetry cases.
  Evidence: [amendment CI](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43651459590).
- Its remaining failure was the synthetic runtime fixture in
  `tools/profile-journey-public-scripts.test.cjs`, whose two arrays omitted
  `checks.js`. The journey stage passed 36/37 and six downstream audit steps
  were skipped. At that checkpoint the file was outside the ten allowed paths,
  so no repository edit was made without the separate authorization above.
- Before that authorization, the exact two-entry proposal was independently
  reviewed: its in-memory diagnostic passed the same 37 tests and preserved
  all original assertions. Those prospective results were not claimed as a
  passing repository gate. The final verdict and completion marker belong to
  the containing PR's exact-head handoff after actual amended checks.
- Merge and deployment still require separate explicit owner authorization.

### Owner-authorized fixture amendment — 2026-11-15

- Continuing the same branch and Draft PR #603. At 2026-11-14 23:18 UTC
  (2026-11-15 06:18 Asia/Novosibirsk), authoritative main remained
  `0a375390859437359427aaf1befac3d12754e837` and the remote/local task head
  remained `d3c87239dce4b5b77c988065c1055a08122499e9`; worktree was clean.
- Applied exactly the two authorized entries at the ends of `runtime` and
  `boardRuntime`. The resulting fixture blob is the reviewed proposal:
  `1a7b1db361dad03d27f5b49e6f40a784ed072283`. All assertions, helper functions
  and previous array positions remain byte-identical.
- This amendment changes only that fixture and this already approved task
  record. The parser, helper mapping, three HTML pages, other regressions and
  canonical manifest remain identical to the previous head. No canonical
  binding refresh is needed because the bound HTML remains unchanged.
- Actual repository gates ran 2026-11-14 23:19:14–23:19:44 UTC, with no fixture
  overlay: the same six-file journey command passed **37/37**, the same full
  board-contract command passed **114/114**, both with zero failures or skips.
  Number-input passed 38 valid and 34 invalid cases; actual-input DOM passed
  all six invalid-domain/reload/correction cases. Tested input hashes remained
  stable; runtime was Node 24.22.1 and jsdom 24.1.3.
- Independent working-tree HIGH review passed: exact approved fixture blob,
  unchanged assertions and index-based reorder samples, only the two intended
  amendment paths. Its separate actual-repository fixture run passed **5/5**,
  with no overlay, failure or skip. The final immutable-head review and CI
  verdict are recorded against the containing PR's exact head after publish.
- Full CI is pending publication of this commit. Prior 37/37 prospective
  diagnostics and prior-head CI do not substitute for current-head acceptance;
  no final completion marker is asserted here.
- Scope deviations: none. Merge, auto-merge, deployment and production
  acceptance have not been performed and still require separate explicit
  owner release authorization.

## Required handoff

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
