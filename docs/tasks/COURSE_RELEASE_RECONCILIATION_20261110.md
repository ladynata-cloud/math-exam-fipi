# Reconcile the approved course publication backlog

## Identity and authorization

- Task: preserve and compose the approved pending course updates into one checked publication candidate.
- Owner: MathExam owner; the current conversation explicitly authorizes completing the remaining publication work.
- Date: 2026-11-10 UTC.
- Validated published base: `82ed551bd6922eb4e84551ec8dbfdcc387a4e6d8`.
- Review level: HIGH; substantial combined interaction, saved work and offline-book compatibility.
- Release authority: current task authorization and [standing policy](../OWNER_RELEASE_AUTHORIZATION.md), subject to applicable checks and current-base verification.

## Approved scope

Compose the following exact course heads while retaining the published Makarychev learning changes and EGE menu links. The composition uses ordinary merges and explicit conflict resolutions. It does not introduce new course requirements or change the Pages publishing configuration.

| Pending PR | Reviewed feature head |
|---|---|
| #497 | `8c3550d4264362b51fff092c0b38e04583fa1ff7` |
| #499 | `879551c0cc8f0b952a1e9bd80ff6f77b6be8bc9c` |
| #508 | `69f7d61e68ba3b4edbb95a91e89d990eb1865cba` |
| #507 | `ce19ca31d4776034503d81c8997feba5fbccbb1b` |
| #474 | `655376985f35ae0f872926d781313b819051a162` |
| #504 | `fcdf3a07d8cc2d275fe077d95ea0b7933d5c53e7` |
| #502 | `6463e076ffca4724566a196644f6d145a91ae736` |
| #509 | `76500d1e2ea2bd0096dc13a630e1838e63e2c46d` |
| #513 | `6ce2062030e326541f103160fc7b8751f017a3bf` |
| #514 | `9e2b50bf44b896e243cd2906323277cc1885cfb9` |
| #517 | `a2d1e6b10bc6e3070c07de28e524045e4415abd7` |
| #518 | `b414480d0fe0f77de7cd53b3bf645e8e08ec84e6` |
| #523 | `93e57088115fc73bd104fda9e39b7ec199dc8226` |
| #524 | `882f9fe0f0f2ede8cbf83997937d422fe70e99a1` |

Preserve learner drafts, attempts, first-answer evidence, independent completion, inquiry histories, route metadata and shared-board storage isolation. Preserve all published version 1 and version 2 OGE book bytes. Keep the existing navigator snippet and all original remote source/coverage receipts.

The final aggregate source is recorded separately from its provenance-only manifest binding. Local intermediate composition receipts are not presented as remotely published sources. Every remote receipt from the listed feature heads and the published base remains in the aggregate manifest.

## Resolved interactions

- Vilenkin unfinished checkpoints and Makarychev 9 draft/inquiry restoration coexist; grades 7/8 retain first-answer and assistance provenance.
- The shared textbook route retains import/export metadata and avoids creating personal route state inside shared-board frames.
- Course styles coexist with published Makarychev-specific layout and the current EGE learning cycle.
- Atanasyan generated pages retain both investigation support and shared course styling.
- The catalogue retains the course guide, all previous entries and the VPR entry (29 cards).
- OGE book closure includes the four video-model resources, the all-topics exam helper, three active-lesson resources and the shared course stylesheet: exactly 243 resources. Model and active-lesson inverse checks compose in the required reverse order; native mathematical source and immutable versions retain exact checks.

## Validation evidence

Local checks passed on the individual composition stages and affected combined source:

- Vilenkin, Makarychev 7/8/9, route, mastery and state/import mathematical and DOM suites; a new cross-course browser regression preserves separate Vilenkin and Makarychev 9 drafts across reload.
- Real-browser Vilenkin and four Makarychev surfaces at 320/1280; full textbook route flows including storage denial/corruption and shared-board isolation.
- OGE numeric-input safety; 124 active-learning/preservation checks and 668 algebra contracts; 21 public browser journeys and 21 isolation cases.
- Sections deterministic build, 186 task cards, mathematics, saved progress and 41 board/state integration tests; separate progress/tour suites.
- Shared course UI: 29 entrances and seven task/route regressions at narrow and desktop widths with paired-control checks.
- Atanasyan mathematical/interaction checks and full lesson browser suites; stereometry task-first on 39 units at 320/768/1280, feedback on 78 trainer journeys, saved drafts, honest credit and expanded navigator close/Escape behavior.
- Course integrity catalogue, equation/logarithm and Pogorelov checks; catalogue browser at 320/1280 and DejaVu 320, retaining 29 cards and matching search/filter state.
- EGE catalogue/board cross-checks (8 tests) and 111 complete model/guided/final task paths with existing saved work.
- Strict OGE generator: all 16 tests, exact 243-resource closure and immutable published v1/v2; 68 model/active preservation checks, seven Python negative-test groups and 52 book/active checks.
- Navigator payload/source-binding tests, sitemap and SEO checks run on their affected stages; final canonical binding is checked again before remote publication.

The complete required CI must pass on the exact final remote candidate. The two-participant sections browser did not complete locally: Chromium crashed on two runs, without reporting an assertion failure. This remains a required CI verification, not a local pass. The combined OGE video/active real-browser regression is recorded separately when complete. External provider review and a new real-pupil pilot were not performed; independent technical review of conflict resolutions was requested.

## Release controls and rollback

Only the coordinating release process may publish. Do not run competing Pages deployments. Requery authoritative main and feature heads before merging and revalidate any drift. Publish the aggregate only after required CI and the sections board-server dependency are ready. Verify the deployed source, public course routes and saved-work behavior.

Rollback is a scoped ordinary revert of the aggregate if a material live regression is found; do not reset or delete learner storage, rewrite shared history, or modify immutable book editions. Backend compatibility must remain available for already published board clients. No test, branch protection or provenance gate is weakened by this composition.

## Revalidation against the November 10 public release

The follow-up owner request authorizes fixing the release blockers. The previous run
[42714347491](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42714347491)
timed out while preparing a full-page stereometry screenshot. The screenshot now
captures the complete document directly. The mathematical, interaction, restoration
and layout assertions remain in place.

Recompose with public base `25ae3eb9158bd62b543d252206cdb1331fd77921`, retaining
all pending work plus the published OGE explanations and division, EGE examination
map and concrete hints, Alimov single answer check, and illustrated course examples.
The merged OGE candidate has 244 resources. The additional resource relative to
the prior aggregate is the published OGE entry sections stylesheet. The published
books stay unchanged. The navigator union covers 580 of 581 canonical URLs, retaining
the existing dedicated Peterson helper exception and both release histories.

This update does not release the aggregate. The current-base and exact-candidate
checks, public server prerequisite, and verified Pages rollout remain required.

The next base `50765eca825ad97c00361bf640e0122b21b9d4a0` introduces #545's
post-Pages check. Its four paths were reconciled cleanly; the aggregate keeps
the active-learning path filters and the new post-publication verification.

Local candidate checks passed for the stereometry investigations at widths
320, 390 and 1280, and the complete two-participant sections browser test.
The EGE base DOM and browser suites passed across all 111 existing families.
The illustrated course entrances passed all 12 interactive routes. The
Alimov, Peterson and Makarychev DOM/state suites and the exact fixed-book
closure and OGE source-pin suites passed.

The updated candidate retains the checked construction, diagrams and answer
feedback work in #533/#534 and the one-step place-value fix in #538. The
geometry atlas was regenerated with both the new investigations and the shared
construction controls. The native OGE revisions for №9 and №11 remain
independently bound to the published #543 and approved #534 sources. Existing
historical checks remain unchanged for the fixed books.

GIF links follow the textbook route's next-step card, so the primary action is
visible at 320 px. Compact EGE navigation keeps the question, diagram, answer
and check button in the initial mobile viewport. The OGE explanation browser
tests use deterministic reviewed exercise families and the original assertions.
