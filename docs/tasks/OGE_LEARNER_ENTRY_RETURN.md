# ОГЭ: понятный старт и возврат из тренажёров

- Owner: Наталья Михайловна; request: проверить все входы в ОГЭ для случайного посетителя и возможность вернуться из каждого встреченного тренажёра.
- Date: 2026-11-04 (Asia/Novosibirsk).
- Base: main, `0d96ad84f0dd9dcadf123b3845db75c5476be93a`.
- Branch: `fix/oge-learner-entry-return`; review: MEDIUM.
- Start/branch/commit/push/Draft PR: authorized by the current request. Release: [standing owner decision](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and evidence

A pupil arriving from search, the home page, OGE hubs, practical tasks or foundations can choose a suitable first exercise, find brief study instructions and return directly to the OGE catalogue or homepage.

Live inspection found no course/home link in task19, only a footer return in task11, and returns via the intermediate `/oge/` hub in several core trainers. The registry `tools/oge-learner-routes.json` records 147 public HTML documents including dynamic foundations destinations. This is a document inventory, not a count of individual exercises or a claim of pupil usability testing. Zero missing local destinations in the recorded static link inventory.

## Scope

- A consistent, static two-link return bar in 134 practice documents (including shared foundations engines reached through the public foundations menu).
- Preserve existing local topic navigation. Hide the extra bar inside an iframe or explicit board mode; the hosting board/cabinet owns navigation there.
- A visible practice-without-cabinet link on the foundations entrance.
- Three clear starts and optional study instructions in the OGE catalogue, plus a visible interactive full-variant entrance. The limited №1–5 diagnostic is explicitly labelled.
- Review the main entry surfaces and representative interactive routes, inventory every listed document, test mobile/desktop return links, keyboard access and navigation without JavaScript.
- Preserve mathematics, identifiers, inline engines, stores, student records, board protocols and established URLs. Archived book editions, offline downloads, PDFs and unrelated courses are outside this release; browser/PDF-viewer back controls still apply to standalone PDF documents.

## Acceptance and gates

- Every recorded nonredirect document exposes a direct course and homepage link.
- Added return bars are usable in a fresh direct visit and without JavaScript; mobile links fit and have a 44px target. Shared-board embeds do not display the redundant bar.
- Underlying trainer inline scripts and input/control identifiers are unchanged.
- Catalogue preserves every existing task and optional section; new starts and instructions are clear and functional.
- Required: `node tools/oge-learner-entry.test.cjs`, focused existing navigation/learner and mathematical contracts, `git diff --check`, browser workflow for all recorded pages at 320/1280, representative no-JS/click/embedded cases, production bytes and route checks.
- Gate: `OGE_LEARNER_ENTRY_RETURN_OK` only after the applicable checks pass. External review not performed under the owner policy. Real-pupil and physical-device testing are not claimed.

## Review, risk and rollback

Self-review the exact diff, learning instructions and static engine-preservation assertions. MEDIUM because the visual navigation changes many HTML entry documents, with no new persistence or server protocol. Main risk: legacy trainer CSS may conflict with a new bar; namespaced styles and exhaustive document/browser checks cover it. Revert this PR's navigation and catalogue delta through an ordinary revert commit; no user data migration is needed. Do not reset/rebase/force or weaken existing gates.

## Execution

CI, exact candidate head, premerge main comparison, deployment and production results are recorded in the PR. Production status is not inferred from this document. No new owner decision is needed for an in-scope, verified release.


## Integration corrections, 5 November 2026

The owner requested completion of all remaining work except Peterson. Existing publication authorization applies.

The first cloud run identified exact compatibility issues rather than mathematical changes: legacy course-return selectors, root-URL resolution in two test harnesses, whole-page percentage hashes, and a meta-refresh race. Tests now check the new literal return target and its exact asset attributes. Percentage historical hashes and all negative mutations remain enforced, with added rejection of altered navigation. All 174 native fraction expressions and controls remain unchanged. The frozen book packages remain untouched; the candidate-builder inventory explicitly accounts for eight already-published landing resources and the two navigation assets. The old browser workflow uses supported Ubuntu 24.04.

Local results: 32 mathematical and UI tests, 8 book-generator tests, 147-page static route check and diff whitespace check passed. Cloud browser checks must pass on the final head. A post-merge job waits for exact live asset hashes before repeating the public-page journeys against mathexam.space.

## Resumed release, 5 November 2026

Reconciled with main f4f3dada (PR440, PR443, PR442). The only overlapping UI edit is the moved model link /oge/#oge-models; both the new learner starts and that destination are retained. Both status entries are retained. Peterson and all assistant work are paused by the owner; this release changes neither.

## Completion, 6 November 2026

The owner requested completion of the current unfinished work, authorized publication and waived external provider review. This continuation preserves the existing PR and incorporates main `8448ccecff1334cfa4e404c6040f855f2bb258e5` with an ordinary two-parent commit. Published source-audit changes to OGE12, current division titles, navigator assets, cabinet changes and all unrelated files are retained.

The failed division historical-contract check is repaired by admitting exactly one empty, deferred `/assets/oge-wayfinding.js` tag; mathematical engines and ordered dependencies remain pinned. Missing, altered, duplicate or executable navigation tags are tested as negative controls. The learner-entry preservation baseline is the current published main, so already released OGE12 changes are checked rather than reverted. Prospective book builds account for the two navigation assets while frozen edition bytes remain unchanged.

Validation uses existing GitHub Actions because the local execution environment is unavailable. No local-test pass is claimed. Final exact-head results and live acceptance remain recorded in the PR.

### Final replay correction, 6 November 2026

The resumed local environment is available. The remaining CI failure was 243
pending source cases: all 81 fraction questions at each of three widths. The
new bar replaced the fractions page's redundant old course link, but the audit
had inverted only the added bar. The recorder now restores that one exact
removed fragment at its exact original position. Its resulting full-document
SHA256 equals the existing reviewed payload; the fixture, engines and
mathematical calculations are unchanged. The verifier accepts the absent
legacy label only for that exact route and historical payload. Negative
controls reject altered routes, payloads, raw visible text, labels and answers.

Local verification: 93 fresh source browser journeys at 320/390/1280;
independent replay 395 PASS, zero PENDING/FAIL/missing reports or unreviewed
source-derived oracles; 34 existing mathematical/persistence regressions;
147-document learner-entry preservation; JavaScript/Python syntax and diff
whitespace checks passed. Local browser: Chromium 134.0.6998.35 with
Playwright 1.62.1. The CI lane retains its pinned current Chromium and repeats
all source/v1/v2 replay checks. Local evidence is not a substitute for that
exact-head CI or production verification.

### Composition with published homework release

The coordinating agent authorized an ordinary merge of current main
`955c83154eed49554b648c03b66e1eba16932222` into the reviewed continuation. The
only conflict was task19's script version beside the new return assets. The
resolution keeps the published `oge-homework-20261106` version and the exact
two return assets. Removing only this PR's return head/bar reconstructs all
six concurrently updated native HTML documents byte for byte from main955.
Published assistant and cabinet changes are retained; frozen editions remain
unchanged. No reset, rebase, force operation or weakened fixture was used.

The composed tree passes 147-document preservation against main955, 62 current
mathematical/state/source contracts, frozen integrity, 10 prospective-generator
tests, 93 fresh source learner journeys and independent replay: 395 PASS, zero
PENDING/FAIL/missing/unreviewed cases. The final exact-head CI still has to run
on the composed commit before the coordinating agent's merge/release checks.
