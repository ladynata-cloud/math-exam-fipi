# Atanasyan harmonization composed with current geometry corrections

## Exact source and authorization

- Existing PR: #623, original head `99b3bfb9c231d5fd3b5cdda2c543231171a57618`.
- Dependency: #658 head `5439d927feb3b7f9a29a9c0d7b764f6d340864f2`, including #627 head `69dfdbc03d8065c59904ecb218344a4f1f87014e` and main `dcf771600a49a5f34a9695c0d10522db78ce2478`.
- Composed source checkpoint: `2d0651864042658fed9a28ca621d8cfb139b1e42`; tree `54ea7b59e6e28f902d717cd0e76c22b798c9ed1c`. Both parent histories are retained.
- The owner explicitly authorized reconciling #623/#627 with the current site and publishing after checks on 18 November. Together with `docs/OWNER_RELEASE_AUTHORIZATION.md`, this supersedes the earlier preparation-only wording in the historical task/report. Normal publication still requires fresh CI and a final main/head drift check.

## Bounded integration

The 63 geometry and 39 stereometry topic investigations remain in place. The merged builder also retains the current angle-notation lesson, targeted lesson builds, public navigator, existing catalog descriptions and return-to-course hook. Generated pages come from the merged sources.

The current angle lesson previously normalized answers only through `GeoTasks.equal`; the harmonized lesson uses classified `GeoTasks.check`. The same narrow angle-name/degree normalization now serves both interfaces. Empty/invalid/domain results remain classified, reversed Cyrillic names remain accepted, and the migrated former proof stays visible in the introductory mini-lesson. A DOM regression covers wrong choices, correct rays, `∠ВСА`, degrees, unchanged empty-attempt accounting and retained writing.

The textbook engine retains both harmonized input and catalog return. A separate exact composition record reverses only the four previously reviewed catalog-return spans, producing the original harmonization engine byte for byte. The existing harmonization, layout, companion and visibility assertions then run unchanged against their historical projections. No old expected hash was replaced.

The original 878-file preservation baseline remains unchanged. Exactly 868 files remain byte-identical; ten runtime/route files already reviewed in #658 have a separate full-hash supplement. Every exception equals both source `5d58b20a9aad26fbddc479f038d7df0faa62c68a` and dependency `5439d927`. All source/card banks, first steps and legacy trainers remain unchanged. Twelve negative controls reject arbitrary source mutation and extra files.

The independent reviewer recorded the inspected bytes and limits in `docs/reviews/ATANASYAN_HARMONIZATION_COMPOSITION_20261118.json`. This is an independent internal integration review, not an external provider audit or publication approval.

## Validation

- Primary topic/runtime suites: 77/77 Node tests. After the angle compatibility change, all 16 affected DOM and historical-projection tests pass, including the new asynchronous angle regression.
- Geometry static checks: 63 units, 137 source points, 59 arguments, 46,552 assertions. Stereometry static checks: 39 units, 99 points, 25,741 checks.
- Topic stereometry: 357 research configurations, 880 practice scenes, 149,997 assertions and 7,800 unchanged legacy tasks. Task scenes: 4,560 configurations and 486,594 independent checks.
- Textbook publication gate: 1,425 reviewed models with exact publication identity. Stereometry geometry: 674 cards, 23,910 planar polygons, 56,687 nonzero segments; JSON schema: 1,413 catalog entries and 674 authored cards.
- Historical runtime, exact catalog-return composition, preservation supplement and the existing negative controls pass. The reviewer separately repeated the angle regression, all 878 preservation identities and additional inverse-projection mutations.
- Navigator bindings: 5/5; complete public-page preservation: 4/4. The repeated source/HTML/ZIP build has no diff. Download acceptance covers 63 topics, 1,425 textbook cards, 255 first-step cards, 70 legacy trainers, 224 local resources and all 292 ZIP entries.

Navigator bindings are refreshed for exactly 65 generated HTML pages against the composed source checkpoint. The existing geometry download is rebuilt from those verified sources. Fresh CI, native browser acceptance and the main/head/tree release check remain required on the final head. Local DOM tests do not claim native browser acceptance or trials with pupils. The earlier missing local AJV dependency was installed at the workflow-pinned version; the schema test then passed without changing the gate.

Rollback is an ordinary revert without deleting learner work or reverting storage compatibility. No force, rebase or protection/test waiver is used.
