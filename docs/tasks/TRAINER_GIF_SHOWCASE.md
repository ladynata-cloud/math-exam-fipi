# Twenty trainer GIF demonstrations

## Identity and authorization

- Owner request: 2026-11-05; create, place, check and publish 20 substantive GIFs.
- Base: main / 63a2676d896d62bd07f87d77f811eb8dea3d0438 (published PR446).
- Branch: feat/trainer-gif-release-20261105; review MEDIUM.
- Permission: current explicit publication request and OWNER_RELEASE_AUTHORIZATION.md.
- START, branch, commit, push, Draft PR, checked release and production verification: authorized.
- No architecture change or ADR needed. External provider review not requested/performed.

## Evidence and design

Current main contains no tracked GIFs. PR442 has moved the OGE visual landing to
/oge/; PR446 updated teaching descriptions and contact information. Both are
preserved. A local, unsubmitted earlier draft contained twenty illustrative GIFs;
its generator and player were reused, not presented as already published work.
The separate earlier task11 recording is not duplicated: these are short,
redrawn mathematical explanations, not screen recordings or promises that the
trainer UI looks like the GIF. Public copy says that example numbers can differ.

The twenty examples match available trainer methods. The graph laboratory has
parameters a/b/c and line controls; the bisector trainer actually performs the
three compass arcs and ruler ray; task16 contains the central/inscribed angle
relationship; the division entry starts with 48/2; EGE starts with legs 9 and 12;
Atanasyan exercise 346 uses height 15 and radius 8. The other examples are simple
instances of the linked arithmetic/practical exercise families.

## Scope and placement

- 6 examples on /oge/: course discovery, below the course entrances, beside the existing teaching invitation.
- 8 optional examples in /trainers/: help choose a skill, without pushing search down.
- 4 examples replace the four static illustrations on /lessons/: individual steps, graphical help, independent answers, spatial reasoning. Existing teaching copy and direct contact CTA remain.
- 2 optional examples beside post-test guidance in /oge/variants/2027/: repair a specific skill, retry the variant, or discuss a difficulty with the teacher.
- General home, foundations, learner state, trainer engines/content, personal data,
  prices, analytics and the 104 PDFs remain unchanged.
- Exact placement and practice URLs: assets/trainer-previews/manifest.json.

## Acceptance and verification

- Exactly 20 unique GIFs with 20 unique page anchors and corresponding live trainer links.
- 640x500, 11 seconds; total GIF budget 1.5 MB, individual budget 250 KB.
- PNG final-frame posters, explicit dimensions, lazy loading/decoding; no GIF fetched before play.
- Explicit play only, one at a time; stop button, timed stop after load, stop off screen/on page hide/on motion-preference change. Reduced motion begins with stills.
- Expanded textual steps and descriptive alt text; keyboard-operable controls; no-JS posters and normal links.
- Static: image bytes/frames/durations/budgets, independent mathematics, local routes and all embeds.
- Browser: 320/390/1280, all 60 plays/stops, hash entrances, still loading, no-JS, real destination rendering, keyboard, one-at-a-time and timed stop.
- Existing SEO/catalog, public showcase and four full learner journeys required in CI.
- Local Chromium is unavailable (socket operation rejected by host). Browser QA runs in GitHub Actions; never claim local/browser checks passed without their result.
- Production: deployment commit, bytes for all media and changed pages, links and public accessibility.
- Final gate: TRAINER_GIF_SHOWCASE_PASS only after applicable CI and production evidence.

## Review and rollback

Focused code and visual self-review; all final GIF frames inspected together and
mobile screenshots retained by CI. Triangles drawn with correct 3:4 proportions;
construction radii/angle bisector and 90/45-degree circle diagram checked
independently. New animations show graph translation, a rotating axial triangle,
and compass arcs. Mathematical figures are programmatically rendered.

Risks: distraction, slow connections, stale source links. Mitigation: no autoplay,
small files, still fallback and exact source links. Revert this task normally to
remove the media and player. No data migration or external service dependency.

## Execution record

Local static checks and visual inspection recorded in the PR. The PR is the
release record for exact head, CI, drift, merge/deployment and live verification.
No ranking, enquiries, revenue increase, real-pupil test or physical-device test
is claimed. Mobile checks use browser viewport emulation.
