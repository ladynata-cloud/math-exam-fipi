# MathExam task specification

## Identity

- Task: H03 — EGE_BASE_CROSS_TAB_PROGRESS_20261116
- Owner: MathExam owner
- Date: 2026-11-16 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: 5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae
- Preparation audit SHA: beffcbe1895e45f8d243e12d250181ac2ce62e1a
- Planned branch: fix/ege-base-cross-tab-progress-20261116
- Review level: HIGH
- Related issue or ADR: H03 in MathExam_Harmonization_Register_2026-11-14.xlsx; existing persistence and public course contracts.
- ADR status: No new archetype approved. ADR 0001 remains Proposed.

## Goal

Сохранить правдивую историю и черновики базового ЕГЭ при работе в двух вкладках: помощь или ошибка до ответа не превращается в самостоятельный успех; устаревшая вкладка не стирает более новый ответ.

## Context and evidence

The preparation audit used beffcbe1895e45f8d243e12d250181ac2ce62e1a. Existing task-first and learning-cycle suites pass on it; the new concurrent-tab scenario exposes a gap outside their coverage.

Actual unchanged page scripts and form handlers were run in JSDOM 26.1.0 with shared localStorage and storage events. Both tabs show the same generated problem: 58 notebooks in packs of 9; answer 7.

1. Tab A submits -99, or opens the help panel.
2. Stale tab B submits 7: saved independent becomes 1, the successful check is independent=true, and the prior help/mistake disappears.
3. A dispatches pagehide: independent becomes 0, done=false and checks=[]; the accepted answer disappears.
4. No jsdomErrors in either scenario.

Evidence: ege-baza/path/app.js reads state once, save writes the whole snapshot, pagehide calls save; task-first.js grades from local attempted/help/seen. A focused reproduction is packaged with this specification. This is a DOM reproduction, not real-browser acceptance.

Public app.js and task-first.js were fetched over HTTPS and are byte-identical to the inspected main. Existing PRs #555/#558/#559 contain largely transferred course data; none is authority to replace current files with its older tree.

### START reconciliation

The authoritative remote main at START was `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`. The intervening #616 concerns a separate college stereometry download and does not change this scope. The isolated task branch starts at that SHA.

At `2026-11-15T20:14:25Z`, the public `ege-baza/path/app.js`, `ege-baza/path/task-first.js` and `ege-baza/skill-map-data.js` each returned HTTP 200 and matched the START base byte for byte. Their SHA-256 values were respectively `c0096a4ea282ee3d4da331aa6cc466bd10ef236d911f02ada3035529290448ee`, `3d3e326121d41eee277fc834116b7fbbe9ba73293cb9019ea1c29875218915c4` and `663043cdb07185561729160d63117e98f4ad3f4e8c77adcaabd089c5626c25c2`. This confirms those resources only, not the entire deployment. The scoped PROJECT_STATUS note records preparation; it does not announce a release.

## Approved scope

Status: owner explicitly issued START for H03 and H17 in the current conversation. This specification retains the approved H03 scope and exact allowlist. Merge, auto-merge and deployment remain excluded.

### In scope

- Reconcile the public path controller with newer saved work before grading or writing.
- Preserve condition/attempt identity, order of help and answers, independent/guided history, seen conditions, final and step drafts, notes, model state and active exam/diagnostic sessions.
- Handle pagehide, input, disclosures, new task and same-origin storage events without stale whole-state overwrite.
- Preserve unchanged grade7/pre7 rows that share the path.v1 storage object; protect their drafts and history without redesigning their learning controllers.
- Permit additive recovery metadata scoped to this existing public course only; no global cross-course persistence protocol is introduced.
- Preserve a legitimately earned first independent answer when help is opened later; distinguish this from help/error preceding the answer.
- Deduplicate repeated successful submissions and merges of the same evidence.
- Maintain current v1 reads and task21Practice compatibility, including legacy rows lacking new metadata. Keep unrelated storage keys intact.
- Use the current architecture; a new generic persistence protocol or architectural primitive needs a separately accepted decision.
- Rebuild only the already existing ege-baza-practice offline artifact and its corresponding manifest checksums; preserve all unrelated manifest entries.
- Reconcile PROJECT_STATUS once at task start against the available production evidence.

### Allowed files

Runtime:
- ege-baza/path/app.js
- ege-baza/path/task-first.js
- ege-baza/path/progress-store.js (optional new narrowly scoped helper)
- ege-baza/path/index.html
- ege-baza/course-journey.js (only if required to read the additive progress metadata)

Validation and packaging:
- tools/ege-baza-cross-tab-progress.test.cjs (new)
- tools/ege-baza-cross-tab-progress.browser.cjs (new)
- tools/ege-baza-task-first.test.cjs
- tools/ege-baza-learning-cycle.test.cjs
- tools/ege-baza-journey.test.cjs
- .github/workflows/ege-task-first.yml (add the targeted tests, do not remove or weaken gates)
- scripts/build-trainer-downloads.mjs (only if helper inclusion needs explicit support)
- downloads/trainers/ege-baza-practice/ege-baza-practice.html
- downloads/trainers/ege-baza-practice/ege-baza-practice-package.zip
- downloads/trainers-manifest.json (only the ege-baza-practice entry and required generated metadata)

Documentation:
- docs/tasks/EGE_BASE_CROSS_TAB_PROGRESS_20261116.md
- docs/PROJECT_STATUS.md (one scoped reconciliation and task note)

### Out of scope

- Pedagogical redesign, new conditions, or adding skill maps already in main.
- OGE, EGE profile, textbook content, source/FIPI renumbering.
- Server, cabinet, authentication, permissions, board event schema or personal learner records.
- Concurrent independent administration of two different exam runs; preserve the existing one-active-session rule.
- Blindly merging, closing or replacing older PRs.
- Publication, merge, auto-merge or deployment in this task authorization.

### Files or areas that must not change

Mathematical banks, answers, other course storage keys, shared board/server contracts, fixed book editions and unrelated downloadable packages.

## Acceptance criteria

- [ ] Wrong A → correct stale B → pagehide A preserves the success, marks it non-independent and retains preceding error/help.
- [ ] Help A → correct stale B → pagehide A gives the same honest result.
- [ ] Correct independent A → later help B preserves the already earned independent success and records the later help separately.
- [ ] Simultaneous correct submissions of the same condition give one success; no count inflation.
- [ ] Separate lessons and separate new conditions do not overwrite one another. A grade7 row and a pre7 row keep their drafts/history while EGE updates merge.
- [ ] With both clients starting from one revision and overlapping saves, both valid updates survive and one success is not counted twice. Unavailable coordination yields explicit safe behavior; read-merge-write alone is not claimed to be atomic.
- [ ] An old-version page overwriting v1 beside a new-version page cannot silently destroy the new version's confirmed history: the new version restores retained evidence or enters an explicit safe state with a recoverable copy.
- [ ] Final answer, current step draft, accepted steps, model position and note survive reload and cross-tab changes; both conflicting drafts of one condition remain available for recovery or an explicit choice; confirmed steps/results do not roll back and unknown chronology cannot promote independence.
- [ ] Newer active exam/diagnostic answers are not erased by an older learning tab.
- [ ] Corrupt data, denied reads, quota/write failure and unknown future versions do not silently reset history; recovery/export remain truthful.
- [ ] Existing v1 and packed task21Practice saves load; missing chronology is not invented or used to promote independence.
- [ ] Existing single-tab task-first, hints, learning-cycle and journey/map behavior remains correct across all 113 families.
- [ ] Two real browser pages of one supported origin in one context reproduce the fixed cases, including close/reopen and overlapping writes. The generated HTML is also exercised under the same-origin setup.
- [ ] Opening the standalone file offline works for help, answer and reload where storage is supported; no cross-device or different-file-path synchronization is promised.
- [ ] Local generated offline HTML and ZIP match the new source; unrelated package entries are unchanged.

## Checks and gates

Required existing tests:
- node tools/ege-baza-practice.test.cjs
- node --test tools/ege-baza-journey.test.cjs tools/ege-baza-exam-map.test.cjs
- node tools/ege-baza-task-first.test.cjs
- node tools/ege-baza-learning-cycle.test.cjs
- node tools/ege-baza-model-discovery.test.cjs
- node tools/ege-baza-cross-tab-progress.test.cjs
- node tools/ege-baza-cross-tab-progress.browser.cjs
- Existing applicable ege-task-first workflow and offline-package checks; record the exact commands and results at implementation time.

Required static checks: git diff --check; exact allowed-file diff; compatibility keys/schema review; no unrelated manifest changes.

Manual checks: same-origin tabs at 320×900 and 1280×900, close/reopen, interruption during a guided step, return to map; optional help remains optional.

Final gate marker: EGE_BASE_CROSS_TAB_PROGRESS_OK, only after all required applicable checks pass.

Checks intentionally not run during preparation: real Chromium acceptance and CI for an implementation that does not yet exist. Baseline DOM tests are not this final gate.

## Review plan

- HIGH because persisted learner work and progress attribution change.
- Trainer design consultation: no new learning sequence; focused review of progress semantics is necessary.
- Before implementation: resolve exact compatibility behavior for historical rows and draft conflicts within the described acceptance criteria.
- Preparation scope review identified and resolved risks around grade7/pre7 sibling rows, overlapping writes, old-client overwrite, conflicting drafts and offline-origin limits. This is scope review, not approval of an implementation.
- Independent technical review of the exact base/head, temporal attribution, duplicate events, old-tab behavior and rollback.
- External provider review: not performed in this preparation; apply current owner review policy to the implementation. Do not treat delegated analysis as a Claude verdict.
- Handoff includes only scoped public source/diff and synthetic tests; no secrets, personal data or machine paths.
- Any external review record must identify provider, PR, base, head, verdict and verifiable source/time.

## Implementation and compatibility

- The existing `mathexam.ege-baza.path.v1` value remains a compatible projection. Scoped per-document recovery records use `mathexam.ege-baza.path.v1.h03.`; retained previous-version copies use `mathexam.ege-baza.path.v1.h03-copy.`. Independent documents do not overwrite one another's records. Unknown or concurrent evidence cannot establish independent success.
- The narrowly scoped factory is placed in existing `app.js` and is inert until the personal course creates it. `index.html` stays byte-identical to the base; no new page binding or global persistence primitive is introduced. Managed `?learning=1` does not initialize personal storage.
- Reconciliation keeps the mounted attempt and exam object stable, checks the displayed question/step before accepting stale input, retains alternative drafts and preserves previously earned counters. Import creates a new generation; stale pages stop writing and expose recovery rather than silently repopulating the replacement.
- The home-course reader checks recovery generation, vector and projection digest without writing. Stale, corrupt, unavailable or future data yields an unknown/unavailable result, not invented mastery.
- Recovery is bounded: at most 256 records and 256 previous-version copies, 4 MiB per record, 6,000 events per writer and 10,000 entries per recovery-draft array. Browser quota or these limits produce an explicit stop in saving and a recovery download. This task does not delete old records or implement compaction.
- Ordinary export/import preserves current v1 work and alternative drafts. The separate recovery download additionally retains protected records, old raw copies and retired generations for inspection and recovery. It is not represented as a directly importable v1 file.
- Only the existing `ege-baza-practice` offline HTML/ZIP and its matching manifest data are rebuilt. Storage is local to the supported origin or file context; no synchronization between devices or different local file paths is claimed.

## Risk and rollback

Risks: partial writes, confusing later help with help preceding the answer, duplicate merges, stale old clients, legacy task21 rows, a race in an active diagnostic, incompatible standalone bundle.

Rollback: revert the scoped code and generated package without deleting any user storage. New metadata must be additive or have a documented recovery path so an older page does not destroy newer evidence. Validate rollback on synthetic v1/current snapshots.

## Permissions

- START granted by owner for this task in the current conversation: yes, explicit user message.
- Branch creation, scoped implementation, local validation, logical commits, push and Draft PR: allowed.
- Merge: no; separate explicit owner authorization required by the AGENTS.md supplied in this conversation.
- Auto-merge: no.
- Deployment: no.

The repository contains a less restrictive standing publication policy. The direct user-supplied AGENTS.md in this conversation takes precedence; it is not modified. A copied START or approval marker inside this specification grants no permission.

## Execution record

- Actual branch: `fix/ege-base-cross-tab-progress-20261116`.
- Actual base SHA: `5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae`.
- Actual head SHA and PR: the immutable candidate head, complete CI evidence and Draft PR URL are recorded in the PR handoff; this task file is part of that candidate.
- Commits: scoped implementation and evidence only; no merge or deployment.
- Local checks: completed; exact commands and results are recorded below. The final CI must repeat applicable gates on the immutable candidate head.
- Independent review: incremental technical review reproduced and corrected concurrent exam advancement, stale step input, partial import, alternative-draft export/import, durable old-client recovery, packed task21 handling and malformed recovery metadata. Independent synthetic rollback checks confirm preserved v1/packed/sibling data, durable old raw copies and correct future attribution after old-only help/error; already earned independent credit remains. Final exact-head review binding remains required.
- Browser checks: local Chromium cannot create its required socket in this executor. The added browser gate runs in existing GitHub Actions on the exact PR head; local DOM results are not browser acceptance.
- External provider review: not performed or requested. Independent delegated technical review is not an external-provider verdict.
- Scope deviations: none. Optional helper logic is in the allowed existing app.js; no separate helper/index/binding change is needed.
- Publication: not performed and not authorized by START.

### Candidate verification record before the first PR CI

| Local command or check | Observed result |
| --- | --- |
| `node tools/ege-baza-practice.test.cjs` | PASS: 6,800 generated conditions, 81 new families, all 21 positions and 168 legacy cases. |
| `node --test tools/ege-baza-journey.test.cjs tools/ege-baza-exam-map.test.cjs tools/ege-baza-concrete-hints.test.cjs tools/ege-baza-skill-map.test.cjs` | PASS: 33 tests; hint coverage reports 113 families, 78,448 variants and 482 scaffolds. |
| `node tools/ege-baza-task-first.test.cjs` | PASS: 113 paths, concrete hints/models/steps/final answer, reload, honest credit and the 21-task exam. |
| `node tools/ege-baza-learning-cycle.test.cjs` | PASS: 113 repairs, including the preserved legacy-counter and same-condition-wrap assertions. |
| `node tools/ege-baza-model-discovery.test.cjs` | PASS: 373 checks, including managed/board payload preservation. |
| `node tools/ege-baza-cross-tab-progress.test.cjs` | PASS: 96 targeted assertions with actual page handlers, old-version copies, concurrent writes, rollback, recovery limits, import and read-only map behavior. |
| New browser test syntax and `git diff --check` | PASS. Chromium execution remains in CI because the local executor denies socket creation. |
| `node scripts/build-trainer-downloads.mjs --only=ege-baza-practice --downloads-only` | PASS: one target, no warnings. |
| ZIP/source integrity | PASS: standalone HTML equals the ZIP member; all three modified runtime files are included exactly; the other four ZIP members retain their original bytes. |
| Scope preservation | Manifest and path index remain byte-identical to the base; no bank, server, managed runtime or unrelated download changes. |

The final runtime delta retains already-read records/raw copies in recovery export when a capacity limit is reached. The 96-assertion targeted suite includes this delta; the completed broad local suites precede that small capacity-only correction. CI must exercise the exact final candidate. These local results do not claim real-browser acceptance or the final gate marker.

Standalone HTML SHA-256: `90ad545a83674636a0ecd66a1dcb5b9a8bd50f1409607416871ca026c362ca29`; ZIP SHA-256: `3d2eb6c7001f5ec30e0bf90aded29e0afcdb755dded93f67c2116847badba409`. The package has five members: only `ege-baza-practice.html` changes. `README.md`, the adaptation GIF/PNG and the prompt are unchanged. The manifest has no generated checksum fields to update and remains byte-identical.

The added real-browser gate covers source and generated HTML in one supported origin at 320/1280 px, real interleaved storage commits, opener/sessionStorage copying, close/reopen, conflicting drafts, stale steps/questions, the actual old controllers from the START base, old-only rollback help/error, assisted exam completion and standalone `file://` help/answer/reload with the context offline. The run and screenshots remain required evidence, not an assumed result.

Rollback means restoring earlier source and its corresponding package without clearing storage. Earlier controllers read the v1 projection and ignore recovery keys. On returning to the new version, protected history and old raw copies remain recoverable. Two clients both running only the old code still retain its original overwrite behavior; work they have already overwritten cannot be reconstructed. Archived old work does not receive automatic positive credit.

The acceptance checklist above describes the final gate, whose exact CI results and reviewed head are recorded in the PR handoff. Merge and deployment are separate owner decisions.

### First candidate browser result and scoped harness correction

The exact candidate `beaa01a8ec8ee1ac1733d22d2a747a4ce83241f6` ran in
[EGE task-first CI 43761778659](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43761778659).
The existing 113-family checks and the new 96-assertion DOM regression passed.
The real-browser artifact records **21 completed cases**: all 18 source cases,
including overlapping native writes, actual old clients, exam preservation,
opener identity and guided steps, plus the first three sequential offline-HTTP
cases at 320 px. The first offline-HTTP overlapping-write case then failed with
`cross-tab overlap barrier timed out`; later cases and downstream browser steps
did not run. This partial result is not a passing browser gate.

The generated standalone HTML deliberately has `default-src 'none'`. Its CSP
blocked the test harness's synchronous XHR to the pause endpoint before the
endpoint could observe the held write. The injected storage wrapper threw, and
the application displayed its save-failure recovery notice. The failure evidence
contains no page errors; it does not establish a runtime loss of accepted work.

The correction changes only the allowed browser harness: a held per-page browser
dialog now pauses immediately before the native `localStorage.setItem`, without
a network request or CSP bypass. While A is held, the test verifies through B
that A's writer record is unchanged and a peer record has actually changed,
then releases A and runs every existing outcome assertion. Dialog/listener/timer
cleanup runs on failure as well. Per-case overlap evidence is included in the
artifact. Runtime sources, standalone HTML/ZIP and their hashes remain unchanged.
Syntax and local targeted checks are recorded in the new PR handoff. The full
real-browser suite and downstream CI remain **pending on the new exact head**;
neither the previous 21 cases nor this harness correction claims their result.

## Required handoff

```text
EXECUTIVE STATUS

Task: H03 — EGE_BASE_CROSS_TAB_PROGRESS_20261116
PR: one Draft PR, exact URL in the execution handoff
Base: 5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae
Head: exact candidate SHA in the execution handoff
Gate: LOCAL_PASS; exact-head browser/CI and final review binding pending
Tests: local math, 113 paths, 113 repairs, 373 models, 33 tests, 96 cross-tab assertions, package checks PASS
Failures: no remaining local gate failures; fixed findings recorded above
Not run: real-browser/CI pending; release and post-release acceptance not authorized
Scope deviations: none
Recommendation: complete scoped gates and independent review; retain Draft until handoff
Next user decision: none during authorized implementation; merge requires separate authorization
```
