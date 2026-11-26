# MathExam: пилот учебного цикла v2

- Task: LESSON-CYCLE-V2 / 26.11.2026; owner START: «START — интеграция учебного цикла v2».
- Base: main `ecf4cd2078c2c67da38f0c5fd1de3ebc41f257b0`; branch `work/lesson-cycle-v2-20261126`; review HIGH (local persistence).
- Related: #761, #763, #764, #766; one specification, branch and Draft PR. Standing release policy: [OWNER_RELEASE_AUTHORIZATION](../OWNER_RELEASE_AUTHORIZATION.md), only after applicable gates.

## Goal and scope
Add one optional personal lesson cycle to the four existing courses: entrance/exit probes, example, real interactive practice, independent written attempt, four original PDF homework sheets, delayed transfer and manual teacher review. No competing curriculum, no changes to the previous banks, IDs, local keys, board, cabinet, server, public sitemap, navigator/rollout or global manifests. No student information is collected or sent. No new paid API. Personal links excluded from board/learning/embedded/file contexts, independent area transfer, probability transfer and functions test mode. HTML geometry entry reviewed against main and coordinated; no changes to global protection mechanisms. The new pilot is noindex and links to existing canonical courses.

## Persistence
The v2 schema and first-record lock are unchanged. Per-topic write queues and origin-wide exclusive Web Locks serialize the compare-and-write operation among cooperating tabs. If locks/storage fail, no durable write occurs: continue in memory and download backup JSON. Corruption and stale records are not overwritten. Import only into a blank topic; no v1 migration. JSON not an authenticated exam protocol. Always export before closing. If a noncooperating script writes the same key, no exclusivity guarantee is claimed.

## Acceptance and evidence
- Current authoritative main and 112 open PR changed-file lists checked; no overlap in four exact source paths/new directory/spec/tests. Repository connector used (direct git DNS unavailable). Coordinator registry records ownership. No common rollout edit.
- Original source blob/unique anchor guards; binary-safe patch generator and exact rollback checked on a synthetic tree. Original four PDFs preserved byte-for-byte. Source/task/test files must be verified in actual commit and changed-file set checked before release.
- Local Chromium, simulated storage/locks: all four routes × widths 320/390/1280, first attempts, import/export, denied/corrupt/conflict, isolation, reset. Node mock tests: four links, mode guards, competing queues, missing/denied locks, old keys. These are not native browser storage evidence.
- `node tools/lesson-cycle/entry.test.cjs`, `node tools/lesson-cycle/hooks.test.cjs`, `node tools/lesson-cycle/race.test.cjs`; `python tools/lesson-cycle/cycle.py` (Python Playwright); `python tools/lesson-cycle/native.py` (real loopback HTTP and native Web Locks; persistent restart; actual course integration; Playwright/Chromium; optionally CHROMIUM_EXECUTABLE_PATH).
- Run existing written practice, Tyurin, college functions, motion, navigator/SEO and board platform gates on the actual candidate. Check autonomous ZIP/file mode and unchanged prior progress. Independent HIGH review, exact candidate CI and pre-merge base drift validation required. Browser environment blocked all HTTP/file navigation (ERR_BLOCKED_BY_ADMINISTRATOR); actual native test NOT RUN/PASS, no full checkout or real-learner trial. Provider consultation not performed; standing policy makes it optional. No release claim.

## Rollback
Revert the one task commit after exact-base release procedure. Remove entry links/resources, preserve all older storage and exported records. No migration/deletion. Use the backup if switching between browser profiles.

## Coordination update before commit
A new Draft #767 appeared after the initial audit. All 113 open PR file lists were checked. The only direct overlap is `trainers/tyurin-statistics/condition-lab.js`. #767 exact head `8e5d113ea1f02092dcb7f8d01ab9b2c323201837` preserves the base script as a byte-identical prefix and appends its independent WORK-12 block. Coordinator allocated only the four existing-IIFE insertion anchors to LESSON-CYCLE-V2; #767 owns its appended block. Read-only composition of this candidate's modified original prefix with the exact #767 tail preserves that tail. No edit to the #767 branch; no unpublished WORK-12 code in this PR. Before either affected release, revalidate the actual composition and run both sets of tests. No simultaneous merge on stale base.

## Execution record
START granted; branch/push/Draft PR permitted under AGENTS.md. Release HOLD pending actual candidate native and full tests, independent HIGH review, current-base composition and deployment verification. Exact head, CI, and gate status recorded in Draft PR. Never treat this specification as external review evidence.
