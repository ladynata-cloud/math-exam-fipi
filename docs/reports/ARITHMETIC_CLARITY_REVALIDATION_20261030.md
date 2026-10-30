# Arithmetic clarity release revalidation — 2026-10-30

## Scope and identity

- PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/377
- Review level: MEDIUM; bounded corrections within the existing engines.
- Original base: `6fb959fc0130a0bb8842601d19297e305ac91ac0`.
- Original head: `3d6dab62d24df4f5464570a3ee23a383383d9a21`.
- Revalidation base: `3411acd7df5ebfbd4179cce85c2300c59677ddf7`.

## Actual conflicts and preservation

The read-only virtual merge found exactly two content conflicts: shared status
insertions, and the download manifest's date. No trainer code conflict exists.
The complete current-main status is preserved, with the arithmetic record
appended at the end to avoid competing top insertions. The entire published
download manifest, including its `2026-10-27` catalogue date, is retained
byte-for-byte. Its entries have not changed; this date is not represented as
the verification date of the new division package.
The division package was already rebuilt by PR377 and its payload is verified
again here; no catalogue entry changed. Verification date: 2026-10-30.

This resolution is an ordinary forward commit on the existing branch. It does
not merge main into the branch, rewrite ancestry or require a force update.

Main contains six concurrent GitHub web-flow release commits: PR379
`884d1b646cb67a115f4bf70c2c0ce2ed7b987e52`, PR376
`51f7fa550bae29f0110a0f06608a3e35bb1f65fd`, PR368
`3eb0e787f30a8d0c16782a96bd928f25ba4f92c4`, PR378
`7547ea565871e09ee02b632761f27bc088bd5c8a`, PR380
`a02061d30494fed7b2db9a596c1e89654bdc25be`, and PR382
`3411acd7df5ebfbd4179cce85c2300c59677ddf7`. Their identities, parent chain,
verified signatures and merged PR metadata are confirmed. Historical claims of
owner exceptions or external review do not authorize this release.

The full Git comparison has 317 main-changed paths; only status and manifest
overlap PR377. The remaining 315 paths must remain byte-identical to main.

## Independent focused review

Internal independent code review of the original runtime found no blockers.
It additionally executed the actual legacy-state validation function against
415 accepted-state boundaries across nine topics and three examples per topic.
Answers, completion records, assistance counters and repeated-example flags
were preserved; normalization was idempotent. This is not external Claude
review. This corrective MEDIUM scope does not require an external design
consultation; it introduces no mathematical action sequence or architecture.

## Fresh validation

All local composed-tree checks below passed on 2026-10-30. The resolution
changes only documentation and retains the published manifest; runtime, tests,
workflows and package blobs remain identical to the original reviewed PR.

| Check | Fresh result |
| --- | --- |
| `node tools/division-guided.test.cjs` | 2700 deterministic exact-arithmetic plans |
| `node tools/division-guided-continuation.dom.cjs` | 11/11, all nine topics and accepted v1 restoration |
| `node tools/decimal-shift.test.cjs` | 2800 exact scaling/quotient properties, 11 examples |
| `node tools/decimal-divisor-entry.dom.cjs` | 2/2 original/converted operands and full solution |
| `node tools/preoge-arithmetic.test.cjs` | 43 links; legacy work, two-tab append, blocked/corrupt storage |
| `node tools/arithmetic-route-entry.dom.cjs` | Four starts, optional diagnosis, exact resumed topic; no progress writes |
| `node tools/arithmetic-course.test.cjs` | 43 levels, 377 phase actions; help and duplicate-completion protection |
| `node tools/learning-plain-division.dom.cjs` | Saved work, steps, hints, decimal/checkpoint and read-only behavior |
| Contextual inventory/help/standalone/managed/special-help test files | All five test files passed |
| `node tools/learning-remediation-bank.cjs --check` | Unchanged 35-source bank, 396075 bytes |
| `node tools/arithmetic-url-contract.test.cjs` | 20 URL/canonical contracts, 152 local links/assets, 12 storage configurations, 43 level URLs, nine anchors |
| `python3 tools/seo-sitemap.test.py` | 12/12 |
| `python3 tools/build-sitemap.py --check` | 531 public canonical URLs |
| `python3 tools/seo-check.py` | 30 entries, 560 canonical declarations, all 531 sitemap self-canonicals |
| `node tools/seo-catalog.test.cjs` with current-main comparison | 71 nonempty no-JavaScript destinations; published PR368 routes preserved |
| `git diff --check` | Passed |

The comparison of the original runtime/test/package delta and the composed
runtime/test/package delta is byte-identical. Stable patch ID, excluding
`docs/**` and the shared manifest:
`90c663b1d7da885c05caf63faeb5d1c03b8934a6`.

The ZIP passed CRC checks, contains exactly the expected HTML and prompt, and
matches the corresponding download files. All 14 inlined CSS/JS resources
match current source; there are no external scripts/stylesheets. ZIP SHA256:
`8a9556d167781de3994673d1f1e0b01d1fcc6896c43f687aa49418d626b0f669`.
Standalone HTML SHA256:
`b2944d176b34cd3c3975d5b467172186d7aee984a4c310b207c4ceecfdb0ff90`.

The local pinned Chromium installer received an invalid/truncated archive and
could not run browser gates. This is recorded as unavailable local execution,
not a browser pass. Fresh exact-head GitHub browser, classroom and integration
runs are required and will be recorded in the PR; old passes are not reused.
No test, TLS setting or protection was weakened. A pre-existing untracked
checkout temporary file was left untouched and excluded from every commit.

## Direct production baseline

A fresh public browser tab confirmed the homepage link “Начать с деления
уголком” opens the existing short URL in one click, and its actual canonical
is `https://mathexam.space/trainers/long-division-stepwise.html`. The current
published prefix digits are 16px. In the first `48 : 2` example, submitting
`4` once leaves “Шаг 1 из 14”, disables the input and exposes “Дальше”. The
arithmetic route still has the old six-card grouping. This is pre-release
baseline evidence, not post-release validation. No learner account was used.

## Release boundary

Merge and deployment have not occurred. A separate owner decision must bind
the current authoritative main SHA and final head. Production checks after
publication are still pending; no real-pupil learning benefit is claimed.

## Risk and rollback

Risks remain unintended advancement, duplicated accepted-state restoration,
help-accounting changes, decimal-context errors and navigation regressions.
Existing targeted tests protect these boundaries. Revert this scoped patch by
a normal reviewed revert if required; storage keys and schema v1 are unchanged.
