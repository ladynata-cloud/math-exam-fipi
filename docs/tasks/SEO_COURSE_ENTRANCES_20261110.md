# Учебные входы Петерсон 6, Макарычев 8 и ЕГЭ база

## Identity
- Owner: Наталья, explicit START and expansion to course/trainer GIF explanations in current conversation.
- Date: 2026-11-10 Asia/Novosibirsk.
- Base: main, c8a4f1fc61dd07038e30764f8cedf0725b767539.
- Branch: feat/seo-course-entrances-20261110.
- Review: MEDIUM — bounded static entrances and optional help in existing lesson engines; no schema, account, score definition or bridge change.

## Goal and approved scope
Make three existing course entrances readable without JavaScript and provide nine concrete topic entrances with mathematical GIF explanations, an initial attempt, text alternatives and a new practice question. Connect the same explanations to the existing lessons without losing the current task, draft or assistance history.

Peterson: fractions, river motion, percentages. Makarychev: cancellation with restrictions, square root of a square, quadratic formula. EGE base: whole packages, probability, percentage changes. Preserve all current course topics and native practice. Include explicit public URLs in sitemap; open only the EGE base catalogue to indexing after its static contents are present.

Out of scope: other PR releases, publishing messages, purchased links, claiming traffic growth, all textbook exercises, diagnostic/exam help, personal storage migration.

## Context and design review
- Live audit: Peterson/Makarychev shells have little static content; EGE base catalogue is noindex. The school root remains intentionally excluded.
- Read current Brilliant audit revision 12 (2026-11-07 filename, updated 2026-11-08), sections 1 and evidence map in `docs/reports/MAKARYCHEV_AUDIT_EVIDENCE_20261109.md`; read GeoGebra graphs audit 2026-11-08 introduction and source scope. Audits are selective; they do not establish full external product coverage or real learner gains.
- Learning question: can the pupil explain the relevant relation, preserve their first attempt and transfer to different numbers after seeing a worked example?
- Internal design decisions: one visible question, optional controlled GIF plus individual still frames and text; explicit units and restrictions; new numbers for self-check; do not award mastery for viewing or guide quizzes. Native opening of explanatory help marks existing assistance state. Avoid replacing native problem banks or changing progress semantics. Methods are our adaptation of the recorded observations.
- External provider consultation not requested and not required under `docs/OWNER_RELEASE_AUTHORIZATION.md`. No external verdict claimed.

## Acceptance and checks
- [x] 3 catalogues and 9 self-canonical topic pages have real HTML contents and valid direct lesson links.
- [x] Nine original mathematical GIFs, controlled playback, separate still frames, textual explanation, no autoplay or sound, mobile keyboard access.
- [x] Wrong/empty/correct guide answers distinguish format from mathematical errors; revealing help preserves the draft.
- [x] Native lesson help preserves current input, records assistance, does not increase independent credit; fresh practice remains available.
- [x] Existing scores, localStorage keys, shared-board mode and exam help restrictions unchanged.
- [x] Exact sitemap seeds; no new private/noindex URLs admitted; relevant SEO, course, navigator and browser gates pass.
- [x] Ready-result review: exact source diff, mathematical boundary cases, screenshots at 320/1280 and user paths. Real-pupil validation remains unperformed.

## Risks and rollback
Help could be displayed without being recorded, an asset could delay the task, or a route could point to the wrong theme. Mitigate with native callback tests, lazy opt-in images and route validation. Revert this task's commits to remove the additions; no persisted data requires migration or deletion. Unchanged storage keys and schemas.

## Permissions and release
START, branch, commit, push and Draft PR: yes. Merge/deploy: standing owner authorization after relevant successful gates and fresh base/head verification. No force, reset, rebase, bypass or unrelated PR merges.

## Execution record
- Source commit: 638ac9d79; current main 82ed551bd6922eb4e84551ec8dbfdcc387a4e6d8 composed by ordinary merge d52a0503057062baf04ef1e2724dcbfdafc84789.
- Concurrent change #521 adds EGE links to the home header; only index.html and its task document changed. Virtual merge clean; no touched course source conflict.
- Local: new browser gate (12 interactive routes; 3 no-JS catalogues), exact rational arithmetic and 9 GIF/45 PNG checks; native P6 UI/state/equation-state/build; M8 UI/state/import/audit-learning; EGE task-first/learning-cycle unit and browser gates; SEO catalogue, old entrance browser gate, sitemap and metadata checks passed.
- Initial unit invocations lacked jsdom in NODE_PATH; repeated successfully with installed dependency. One local browser process crashed during parallel QA; isolated rerun passed. No assertion was weakened.
- Scope refinement from screenshot: collapse P6 task menu on initial narrow viewport, move theory behind task, and record opening of theory as assistance. Source and UI tests passed.
- CI and publication are pending; final PR records exact tested head and public verification.

- Navigator gate required the existing navigation widget on the nine new sitemap pages. Added the exact unchanged include pair, source-bound to d52a0503057062baf04ef1e2724dcbfdafc84789; updated coverage 557→567, 9 new pages plus already-covered EGE catalogue. No exclusions or gate assertions were relaxed.
