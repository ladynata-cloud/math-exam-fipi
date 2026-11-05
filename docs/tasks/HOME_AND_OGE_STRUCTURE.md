# General mathematics home and dedicated OGE landing

## Identity and approved scope

- Owner: MathExam owner; request on 2026-11-05 (Asia/Novosibirsk): move the OGE illustrations from the general home into OGE, in the context of the mathematics-trainer search entrance.
- Base: `main`, `0d96ad84f0dd9dcadf123b3845db75c5476be93a`.
- Branch: `feat/home-and-oge-structure`.
- Review: MEDIUM, bounded static navigation and presentation changes.
- Start: the owner's current request; publication follows [standing authorization](../OWNER_RELEASE_AUTHORIZATION.md). No new external audit requested.

## Goal and acceptance

- General `/` introduces mathematics across grades 5–11 with immediate entrances to foundations, textbooks, OGE, both EGE levels and geometry.
- Existing `/oge/` receives the complete OGE landing, 25 orbits, 53 model subtypes, SVG illustrations and existing invitation. The renderer and illustrations are unchanged.
- `/trainers/` retains its URL, all 58 static and dynamic cards and their destinations. Search moves above the introductory counters, teacher download instructions below the catalogue.
- `/trainers/oge-course/` retains all tasks and its URL; the model return link points to `/oge/#oge-models`.
- Distinct titles, descriptions, self-canonicals and structured data identify the general site and OGE collection. Existing verification tokens remain on the root. No indexing, storage, authentication, mathematical-content or domain changes.
- Existing OGE hub destinations, informatics disclosure, PDF entry and lesson/contact routes remain available. Old `/#oge-models` bookmarks reach the general home's OGE card with its new model link.

## Checks and review

- Relevant gates: SEO sitemap tests and canonical check; sitemap --check; static/dynamic catalogue parity; OGE route preservation; orbital geometry regression; lesson-funnel privacy tests; changed-page links; git diff --check.
- Existing browser coverage retargets the complete OGE suite to `/oge/`; every orbit, subtype, pause/drag, graphics fallback, keyboard route and mobile width remains checked. General-home expectations now check the requested wider scope and six direction cards.
- Manual cloud preview: general home, relocated landing, orbit selector and narrow 320px presentations. CI provides full browser regression.
- External provider review not performed under the standing policy. No real pupil data or contact messages used.
- An exploratory legacy `oge-1-5-entry-diagnostic.test.mjs` run fails three assertions (home map link, board capability contract, external-link prohibition). The untouched base reproduces the same three failures. This is a pre-existing legacy-suite mismatch, not a passing check; no trainer/board changes or weakened assertions were made.

## Risk and rollback

The search engine may need to recrawl revised page identities; no ranking gain is promised. Old public URLs remain valid. Rollback is an ordinary revert of this task's commit; no learner state migration is involved. Immediately before merge, requery authoritative main/head, revalidate any drift and verify the actual merge parent/tree. Deployment and public checks are recorded in the PR.

## Execution record

- Local implementation commit: `acebbadfd708c297a60d58931e7267f315cabace`.
- Static checks passed: 31 SEO entrances; 533 sitemap canonical URLs; four changed-page link inventories with no broken targets; 58 catalogue cards match static/client rendering; six OGE navigation contracts; six lesson-funnel privacy cases; 25-orbit/53-subtype geometry regressions on four stage sizes; 12 sitemap tests.
- Cloud browser: 320px iframe previews of the three entrances show no horizontal overflow (305px document and content widths inside scrollbars). Catalogue search `деление` returns the two division entries. The OGE graph model link resolves to the existing graph trainer. Actual OGE landing → course → `/oge/#oge-models` navigation succeeds; the fallback canvas renderer initializes.
- Automatic approval review rejected public Git push, requiring explicit approval of this payload despite the standing repository publication policy. No push, PR, CI, merge or deployment is claimed. Prepared branch remains local pending that decision.
- Full remote browser suites are not run because the public branch/PR could not be created. Existing tests were retargeted, not removed; their CI coverage remains intact for the next step.
- Next decision: authorize publishing this branch to `ladynata-cloud/math-exam-fipi` and deploying the checked changes to `mathexam.space`.

### Authorization resumed

On 2026-11-05 the owner answered «согласна» to the exact request to send this version to the public `ladynata-cloud/math-exam-fipi` repository and publish to `mathexam.space` after cloud checks. The earlier approval-review hold is resolved. CLI Git lacks write credentials; the authenticated GitHub integration is used instead. CI and release evidence will be recorded in the PR.

Cloud-gate preparation found an older OGE-focus test still asserting that the root must hide textbooks and EGE. Its OGE-only assertions now follow the relocated `/oge/` page; the root is checked for all six approved directions and no OGE renderer. The historical direct division link is retained in the foundations card. No assertion about trainer destinations, lesson contacts or storage was removed.

### Base drift before release

Remote main advanced from `0d96ad84` to `27f9f72953d97edc67c266fa2a040d3e26b25b58` through approved PR440 (Atanasyan mobile layout). A read-only virtual merge found only the two new PROJECT_STATUS headings in conflict. An ordinary history-preserving merge retains both entries and PR440 files; no runtime product conflict occurred. Revalidate SEO, catalog/navigation, linked lesson demonstration and final CI against this composition. Standing authorization and the owner’s explicit current consent remain valid; no new permission is needed.
