# Погорелов: курс к учебнику — проверка первой версии

Task: `POGORELOV_TEXTBOOK_COMPANION`. Date: 2026-10-26.
Base: `9cf995d30c400a6e581a3168bb8ef8f5c76ed945`.
Review level: MEDIUM. This record covers local preparation, not publication.

## Result and provenance

- 15 paragraphs, 134 trainers, 92 distinct paragraph-scoped exercise numbers,
  340 guided steps and 201 checked final numerical values.
- Selected exercise parts from the owner-provided 2022 edition were checked
  against the local book. Printed/PDF page offset is one. Source references
  are in `geometry-pogorelov/textbook/source-map.json`; coverage is explicitly
  incomplete at the exercise level.
- Original teaching material and newly constructed SVG models only. No source
  PDF, scans, publisher drawings or pupil records are included in the patch.
  This is a companion format, not legal clearance or a publisher endorsement.
- The earlier thematic course is preserved, including all of its storage keys.
  Its only visible change is a link to the new companion. The new route is
  added to the reviewed sitemap seeds and generated sitemap.

## Verification

| Check | Result |
| --- | --- |
| `node tools/pogorelov-textbook/check.cjs` | PASS: independent fixture for every final numeric value; source IDs, units, manual rubrics, parser boundary cases, restore validation and selected geometric oracles |
| `NODE_PATH=… node tools/pogorelov-textbook/runtime.cjs` | PASS: all 134 guided/independent or manual journeys and all 340 steps |
| Runtime regressions | PASS: wrong choices do not advance; hints/reveals record assistance; draft/step/reload retention; exact number search; safe free text; corrupt/concurrent records are not overwritten; editing an answer clears its previous success message; skip link retains the task |
| `node tools/pogorelov/check.cjs` | PASS: 88 existing units, 136 source points, 40,740 existing checks |
| `python3 tools/seo-sitemap.test.py` | PASS: 12 tests |
| Sitemap, SEO entrance and canonical checks | PASS: 528 canonical URLs; 30 entrances; 97 canonical declarations |
| `NODE_PATH=… node tools/seo-catalog.test.cjs` | PASS: static/rendered catalog parity and Vilenkin entry contract |
| JS/Python syntax, generated-content reproducibility, whitespace | PASS |

The runtime suite uses jsdom 26.1.0 in temporary dependency storage. It models
browser DOM and state, but is not evidence from real pupils.

## Actual browser observations

- Desktop: source reference, task, optional help and retained steps are legible;
  the large diagram remains beside the work. Triangle labels are separated.
- 390px frame: no horizontal overflow; diagram appears above the working
  controls, with usable text and buttons.
- § 3 № 2: two completed proof steps remain visible while the third is active.
- § 7 № 2(2): unfinished `sqrt(` survives switching to the guided mode, back
  to independent mode, and a page reload. `sqrt(2)` is accepted; the earlier
  help use remains visibly recorded.
- Browser QA uses synthetic local work only. No account or student data is read
  or changed. The inspected standalone HTML has no external runtime assets.

## Resolved findings and limits

- One initial independent test fixture incorrectly expected 408 for the
  triangle with sides 17, 65, 80 (§ 14 № 29(3)). Independent recomputation gives
  height 7.2 and area 288; the fixture was corrected. Course content was already
  288. The 408 result belongs to a different task (§ 14 № 38).
- Focused self-review corrected the § 14 № 19 model to retain its actual height,
  clarified a half-angle explanation, withheld solution points before help,
  made numbered search exact, and cleared stale success messages after editing.
- Proofs and physical constructions are saved for human review, not graded as
  correct by matching text. Guided completion is not a mastery certificate.
- Local storage is per browser/origin; standalone-file behavior can vary by
  browser. Visible warnings and JSON export provide a way to retain work.
  There is no import, account, board adapter or cross-device synchronization.
- Claude consultation/review: NOT RUN. No exposed Claude/Anthropic tool or
  configured authorized local API access was available. No provider response,
  release verdict or inherited exception is claimed. Required consultation or
  a current owner exception remains before publication.
- Real-pupil validation and deployed-site checks: NOT RUN. This is preparation.
- No remaining local test failures. Cloud CI is reported against the exact PR
  head after publication of the Draft PR.

Local gate: `POGORELOV_COMPANION_LOCAL_OK`.
Rollback: revert this isolated companion, its entrance link and sitemap entry.
Merge, auto-merge and deployment remain unperformed.
