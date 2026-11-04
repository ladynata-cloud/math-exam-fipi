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
