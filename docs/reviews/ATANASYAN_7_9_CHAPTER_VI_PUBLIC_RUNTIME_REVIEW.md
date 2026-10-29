# Independent final public-entry893 runtime verification

Reviewer: independent non-author OpenAI agent `vi_runtime_final`. PR: ladynata-cloud/math-exam-fipi#373. Original task base: `d3122b9f3905cd8f7715cee6a873d031cdb43de4`. Verification: 2026-10-29T13:58:26.284Z–2026-10-29T13:58:38.464Z. This is separate final evidence; the previously frozen runtime-extension and release-transition reports are unchanged.

**Verdict: PASS for actual public index.html availability, navigation and learner-work behavior on the exact approved893-card snapshot below.** No unresolved technical findings remain in this scope. This run served the repository's real index.html and assets locally in Chromium153.0.8010.0. It did not inject preview mode, rewrite review flags or claim that production has been deployed.

| Reviewed object | SHA256 |
| --- | --- |
| data/course.json | `d15bb793245f20b9f1b8d4bac726637192c816922effd45d209618a0c244f3fc` |
| VI release manifest | `ca4e5a1ee48653e338905b8d9edadadf0925f2a3f743106f91c237456613ac26` |
| Shared implementation | `04e5a58da99bf68421e8f7aa9baccd8c3b2054766dab4141f912a46eba7690ec` |
| source-inventory.json | `96ab32a3b61bbac81432e6dc6c003cdbcf998e39b8ea3000254689f73ab88cf3` |
| All authored content | `eac1eb2b73cf13a6bd31c4524d4327be75d044f4a174bb7b7d9ff910d5c744e1` |
| VI authored content | `a3c589e661f6cc024516ea5e797c172f0f11cedd6127bb0b5bcd360967a50f64` |
| Independent browser script | `04799bfaa43c8a704c87ca609910c0406cb1193bf0057820748ee55d9e9fa995` |
| Independent browser evidence | `4962bbab0b60b5c07c1dfa610812e4837ec5ce3defc9e4c564e06435bb4a3f45` |

## Independent public-entry checks

The test required all893 lesson and catalog records to be reviewed before launching. On every VI cold load it required the actual running application's coverage to report893 available, zero in-review and no preview notice. All138 VI URLs opened the exact requested ID and permalink, correct heading and chapter/paragraph source labels, a rendered SVG, and the visible printed/PDF source disclosure.

Six further cold links opened existing sections I–V and the independent grade7 advanced section. Four catalog→card journeys covered VI main462, theory46, selfcheck1 and additional task520. The §3 source query returned exactly30 cards. No paragraph was invented for additional tasks520–540 or selfchecks.

All six question-1 drafts, one per chapter I–VI, survived closing the writing page and opening fresh pages, with six distinct book/lesson/revision localStorage keys. A native cross-tab VI write froze the older editor, preserved its previous draft in the recovery field, and loaded the new draft on explicit recovery. These writes affected only a new temporary browser context. No real learner records were accessed.

No browser page errors occurred. The tests used320px and1280px viewport widths. This smoke run is not represented as exhaustive drawing inspection or a replacement for the full-course browser gate.

## Reproducibility and approval boundaries

The reviewer independently recomposed the working course and confirmed byte-identical JSON content to the recorded bundle. The old755 full-record preservation validator passed. All14 implementation/receipt/scope hashes in the frozen technical review remain unchanged. All17 evidence file hashes in the actual VI release manifest resolved and matched.

The reviewer reran chapter06-release.test.py6/6 and chapter06-candidate.test.py6/6, now both completely passing. Thus the two intermediate missing-approval failures recorded in the earlier report are resolved. The released VI caption check passed138 DOM journeys, and check_course.cjs --require-reviewed passed893 cards,540 numbered exercises and publicationReviewMatches=true. The missing-VI-review negative path remains tested and preserves exactly755 reviewed cards.

No source/PDF, mathematics, pedagogy or exhaustive image-review verdict is invented by this runtime verification. Those remain bound to their actual independent review evidence. This document describes a working-tree payload snapshot, not a future Git head. Exact final-head CI, the composed-base/virtual-merge checks after main drift, and a separate owner merge decision remain required. No merge or deployment authority is granted.
